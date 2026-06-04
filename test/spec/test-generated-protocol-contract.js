import { defaultOptions, Upload } from 'tus-js-client'
import {
  tusClientConformanceScenarios,
  tusClientFeatures,
  tusClientScenarioProofCases,
  tusManagedUpload,
  tusManagedUploadProofCases,
  tusProtocolOperations,
} from './generated-protocol-contract.js'
import {
  defaultProtocolResponseHeaders,
  getBlob,
  TestHttpStack,
  wait,
  waitableFunction,
} from './helpers/utils.js'

function getProtocolOperation(operationId) {
  const operation = tusProtocolOperations.find((candidate) => candidate.operationId === operationId)
  if (!operation) {
    throw new Error(`Missing generated TUS protocol operation: ${operationId}`)
  }

  return operation
}

function getClientFeature(featureId) {
  const feature = tusClientFeatures.find((candidate) => candidate.featureId === featureId)
  if (!feature) {
    throw new Error(`Missing generated TUS client feature: ${featureId}`)
  }

  return feature
}

function getClientConformanceScenario(scenarioId) {
  const scenario = tusClientConformanceScenarios.find(
    (candidate) => candidate.scenarioId === scenarioId,
  )
  if (!scenario) {
    throw new Error(`Missing generated TUS client conformance scenario: ${scenarioId}`)
  }

  return scenario
}

function getManagedUploadScenario(scenarioId) {
  const scenario = tusManagedUpload.scenarios.find(
    (candidate) => candidate.scenarioId === scenarioId,
  )
  if (!scenario) {
    throw new Error(`Missing generated TUS managed-upload scenario: ${scenarioId}`)
  }

  return scenario
}

function getGeneratedConformanceRuntime() {
  if (typeof window !== 'undefined' && window.document) {
    return 'browser'
  }

  if (typeof globalThis.Deno !== 'undefined') {
    return 'deno'
  }

  return 'node'
}

function scenarioAppliesToCurrentRuntime(scenario) {
  return !scenario.runtimes || scenario.runtimes.includes(getGeneratedConformanceRuntime())
}

function requestMatchesHeaderVariant(requestHeaders, variant) {
  return variant.fields
    .filter((field) => field.required)
    .every((field) => requestHeaders[field.displayName] != null)
}

function expectRequestMatchesOperation(req, operation, request) {
  expect(req.method).toBe(request.effectiveMethod ?? request.method ?? operation.method)

  if (request.headerMode === 'exact') {
    return
  }

  const expectedHeaders = request.effectiveHeaders ?? request.headers ?? {}
  const expectedContentType = expectedHeaders['Content-Type'] ?? operation.request.contentType
  if (expectedContentType) {
    expect(req.requestHeaders['Content-Type']).toBe(expectedContentType)
  } else {
    expect(req.requestHeaders['Content-Type']).toBeUndefined()
  }

  if (operation.request.headerVariants.length > 0) {
    expect(
      operation.request.headerVariants.some((variant) =>
        requestMatchesHeaderVariant(req.requestHeaders, variant),
      ),
    ).toBe(true)
  }
}

function getOperationResponse(operation, statusCode) {
  return operation.responses.find((candidate) => candidate.statusCode === statusCode)
}

function responseHeadersFor(response, overrides = {}) {
  const headers = {}
  const variant = response.headerVariants[0]
  const defaultResponseHeaders = defaultProtocolResponseHeaders()
  for (const field of variant?.fields ?? []) {
    if (!field.required) continue
    if (overrides[field.displayName] != null) {
      headers[field.displayName] = overrides[field.displayName]
      continue
    }

    if (defaultResponseHeaders[field.displayName] != null) {
      headers[field.displayName] = defaultResponseHeaders[field.displayName]
      continue
    }

    throw new Error(
      `Generated scenario response is missing ${field.displayName} for a required ${response.statusCode} response header`,
    )
  }

  Object.assign(headers, overrides)

  return headers
}

function scenarioResponseHeadersFor(operation, response) {
  if (response.headerMode === 'exact') {
    return response.headers ?? {}
  }

  const operationResponse = getOperationResponse(operation, response.statusCode)
  if (!operationResponse) {
    return response.headers ?? {}
  }

  if (response.effectiveHeaders) {
    return response.effectiveHeaders
  }

  return responseHeadersFor(operationResponse, response.headers)
}

function createReadableStream(content) {
  let sent = false
  const encoder = new TextEncoder()
  return new ReadableStream({
    pull(controller) {
      if (sent) {
        controller.close()
        return
      }

      controller.enqueue(encoder.encode(content))
      sent = true
    },
  })
}

function contentBytes(content) {
  return new TextEncoder().encode(content)
}

async function createScenarioInput(input) {
  if (input.kind === 'none') {
    return null
  }

  if (input.kind === 'blob') {
    return getBlob(input.content)
  }

  if (input.kind === 'array-buffer') {
    const bytes = contentBytes(input.content)
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  }

  if (input.kind === 'array-buffer-view') {
    return contentBytes(input.content)
  }

  if (input.kind === 'web-readable-stream') {
    return createReadableStream(input.content)
  }

  if (input.kind === 'node-readable-stream') {
    const { Readable } = await import('node:stream')
    return Readable.from([Buffer.from(contentBytes(input.content))])
  }

  if (input.kind === 'node-path-reference') {
    const { writeFile } = await import('node:fs/promises')
    const { tmpdir } = await import('node:os')
    const path = await import('node:path')
    const filePath = path.join(tmpdir(), 'tus-js-client-generated-contract-input.bin')
    await writeFile(filePath, contentBytes(input.content))
    return { path: filePath }
  }

  throw new Error(`Unsupported generated TUS scenario input kind: ${input.kind}`)
}

function installGeneratedRequestIdRandom(scenario) {
  if (!scenario.input.addRequestId) {
    return () => {}
  }

  const expectedZeroUuid = '00000000-0000-4000-8000-000000000000'
  if (scenario.input.generatedRequestId !== expectedZeroUuid) {
    throw new Error(
      `Generated scenario ${scenario.scenarioId} has unsupported generatedRequestId ${scenario.input.generatedRequestId}`,
    )
  }

  const originalRandom = Math.random
  Math.random = () => 0
  return () => {
    Math.random = originalRandom
  }
}

function storedUploadKey(storedUpload) {
  return storedUpload.urlStorageKey ?? storedUpload.fingerprint
}

function storedUploadRecord(storedUpload) {
  return {
    creationTime: new Date(0).toString(),
    metadata: {},
    size: null,
    uploadUrl: storedUpload.uploadUrl,
    urlStorageKey: storedUploadKey(storedUpload),
  }
}

function makeEventRecordingUrlStorage(storedUpload, observedEvents) {
  return {
    findAllUploads() {
      return Promise.resolve(storedUpload ? [storedUploadRecord(storedUpload)] : [])
    },
    findUploadsByFingerprint(fingerprint) {
      const uploads =
        storedUpload && storedUpload.fingerprint === fingerprint
          ? [storedUploadRecord(storedUpload)]
          : []
      observedEvents.push({ count: uploads.length, fingerprint, kind: 'url-storage-find' })
      return Promise.resolve(uploads)
    },
    addUpload(fingerprint, upload) {
      observedEvents.push({ fingerprint, kind: 'url-storage-add', uploadUrl: upload.uploadUrl })
      return Promise.resolve(upload.urlStorageKey ?? `${fingerprint}-generated-key`)
    },
    removeUpload(urlStorageKey) {
      observedEvents.push({ kind: 'url-storage-remove', urlStorageKey })
      return Promise.resolve()
    },
  }
}

function scenarioWantsEvent(scenario, kind) {
  return scenario.events.some((event) => event.kind === kind)
}

function scenarioExecutionActions(scenario, phase) {
  return scenario.execution?.[phase] ?? []
}

function makeEventRecordingFileReader(fileReader, scenario, observedEvents) {
  return {
    async openFile(input, chunkSize) {
      const source = await fileReader.openFile(input, chunkSize)

      if (scenarioWantsEvent(scenario, 'source-open')) {
        observedEvents.push({
          inputKind: scenario.input.kind,
          kind: 'source-open',
          size: source.size,
        })
      }

      return {
        get size() {
          return source.size
        },
        close() {
          observedEvents.push({ kind: 'source-close' })
          source.close()
        },
        slice(start, end) {
          return source.slice(start, end)
        },
      }
    },
  }
}

function formatEventValue(value) {
  return value == null ? 'null' : String(value)
}

function observedEventKey(event) {
  if (event.kind === 'progress') {
    return `progress:${event.bytesSent}:${formatEventValue(event.bytesTotal)}`
  }

  if (event.kind === 'chunk-complete') {
    return `chunk-complete:${event.chunkSize}:${event.bytesAccepted}:${formatEventValue(
      event.bytesTotal,
    )}`
  }

  if (event.kind === 'before-request') {
    return `before-request:${event.requestIndex}`
  }

  if (event.kind === 'after-response') {
    return `after-response:${event.requestIndex}`
  }

  if (event.kind === 'request-abort') {
    return `request-abort:${event.requestIndex}`
  }

  if (event.kind === 'source-open') {
    return `source-open:${event.inputKind}:${formatEventValue(event.size)}`
  }

  if (event.kind === 'fingerprint') {
    return `fingerprint:${formatEventValue(event.fingerprint)}`
  }

  if (event.kind === 'should-retry') {
    return `should-retry:${event.retryAttempt}:${event.decision}`
  }

  if (event.kind === 'retry-schedule') {
    return `retry-schedule:${event.delay}`
  }

  if (event.kind === 'url-storage-add') {
    return `url-storage-add:${event.fingerprint}:${event.uploadUrl}`
  }

  if (event.kind === 'url-storage-find') {
    return `url-storage-find:${event.fingerprint}:${event.count}`
  }

  if (event.kind === 'url-storage-remove') {
    return `url-storage-remove:${event.urlStorageKey}`
  }

  return event.kind
}

function expectedEventKey(scenario, event) {
  if (event.key == null) {
    throw new Error(
      `Generated scenario ${scenario.scenarioId} has an event without a generated key: ${JSON.stringify(
        event,
      )}`,
    )
  }

  return event.key
}

function isProgressEventKey(eventKey) {
  return eventKey.startsWith('progress:')
}

function expectScenarioEventsExactExceptExtraProgress(
  scenario,
  observedEvents,
  observedEventKeys,
  expectedEventKeys,
) {
  let expectedIndex = 0

  for (const observedEventKey of observedEventKeys) {
    if (observedEventKey === expectedEventKeys[expectedIndex]) {
      expectedIndex += 1
      continue
    }

    expect(isProgressEventKey(observedEventKey))
      .withContext(
        `Expected generated scenario ${scenario.scenarioId} to only emit extra progress samples; observed events ${JSON.stringify(
          observedEvents,
        )}; expected keys ${JSON.stringify(expectedEventKeys)}`,
      )
      .toBe(true)
  }

  expect(expectedIndex)
    .withContext(
      `Expected generated scenario ${scenario.scenarioId} to emit every non-extra event; observed keys ${JSON.stringify(
        observedEventKeys,
      )}; expected keys ${JSON.stringify(expectedEventKeys)}`,
    )
    .toBe(expectedEventKeys.length)
}

function expectScenarioEvents(scenario, observedEvents) {
  const expectedEventKeys = scenario.events.map((event) => expectedEventKey(scenario, event))
  const observedEventKeys = observedEvents.map(observedEventKey)
  const eventPolicy = scenario.eventPolicy ?? { matching: 'exact' }

  if (eventPolicy.matching === 'exact-except-extra-progress') {
    expectScenarioEventsExactExceptExtraProgress(
      scenario,
      observedEvents,
      observedEventKeys,
      expectedEventKeys,
    )
    return
  }

  if (eventPolicy.matching === 'exact') {
    expect(observedEventKeys)
      .withContext(
        `Expected generated scenario ${scenario.scenarioId} runtime event keys to match exactly; observed events ${JSON.stringify(
          observedEvents,
        )}`,
      )
      .toEqual(expectedEventKeys)
    return
  }

  throw new Error(
    `Unsupported generated event policy for ${scenario.scenarioId}: ${JSON.stringify(eventPolicy)}`,
  )
}

function expectedUrlForScenarioRequest(scenario, request) {
  if (request.url === 'endpoint') {
    return scenario.input.endpointUrl
  }

  if (request.uploadUrl) {
    return request.uploadUrl
  }

  const uploadUrl =
    scenario.input.uploadUrl ??
    scenario.input.storedUpload?.uploadUrl ??
    scenario.completion.uploadUrl
  if (!uploadUrl) {
    throw new Error(`Generated scenario ${scenario.scenarioId} has no upload URL expectation`)
  }

  return uploadUrl
}

function expectScenarioRequest(req, scenario, request) {
  const operation = getProtocolOperation(request.operationId)

  expect(req.url).toBe(expectedUrlForScenarioRequest(scenario, request))
  expectRequestMatchesOperation(req, operation, request)

  for (const [header, value] of Object.entries(request.effectiveHeaders ?? request.headers ?? {})) {
    expect(req.requestHeaders[header]).toBe(value)
  }

  for (const header of request.absentHeaders ?? []) {
    expect(req.requestHeaders[header]).toBe(undefined)
  }

  if (request.bodySize != null) {
    expect(req.bodySize).toBe(request.bodySize)
  }

  if (!request.response) {
    return
  }

  req.respondWith({
    status: request.response.statusCode,
    responseHeaders: scenarioResponseHeadersFor(operation, request.response),
    responseText: request.response.body ?? '',
  })
}

async function abortScenarioRequest(req, scenario, request, requestIndex, observedEvents, upload) {
  const operation = getProtocolOperation(request.operationId)
  const originalAbort = req.abort.bind(req)
  req.abort = () => {
    observedEvents.push({
      kind: 'request-abort',
      method: req.method,
      requestIndex,
      url: req.url,
    })
    return originalAbort()
  }

  const abortPromise = upload.abort(Boolean(scenario.input.terminateUploadOnAbort))
  await wait(0)

  expect(req.method).toBe(request.effectiveMethod ?? request.method ?? operation.method)
  expect(req.url).toBe(expectedUrlForScenarioRequest(scenario, request))

  return abortPromise
}

async function startScenarioUpload(scenario, testStack) {
  let upload
  let terminatePromise
  let afterResponseRequestIndex = 0
  let beforeRequestIndex = 0
  let retryDecisionIndex = 0
  const observedEvents = []
  const restoreRetryTimerRecorder = installRetryTimerRecorder(scenario, observedEvents)
  const restoreRequestIdRandom = installGeneratedRequestIdRandom(scenario)
  const onError = waitableFunction('onError')
  const onSuccess = waitableFunction('onSuccess')
  const options = {
    endpoint: scenario.input.endpointUrl,
    httpStack: testStack,
    metadata: scenario.input.metadata ?? {},
    onError,
    onSuccess(payload) {
      if (scenarioWantsEvent(scenario, 'success')) {
        observedEvents.push({ kind: 'success' })
      }
      onSuccess(payload)
    },
  }

  if (scenarioWantsEvent(scenario, 'before-request')) {
    options.onBeforeRequest = (req) => {
      observedEvents.push({
        kind: 'before-request',
        method: req.getMethod(),
        requestIndex: beforeRequestIndex,
        url: req.getURL(),
      })
      beforeRequestIndex += 1
    }
  }

  if (scenarioWantsEvent(scenario, 'after-response')) {
    options.onAfterResponse = (req, res) => {
      observedEvents.push({
        kind: 'after-response',
        method: req.getMethod(),
        requestIndex: afterResponseRequestIndex,
        statusCode: res.getStatus(),
        url: req.getURL(),
      })
      afterResponseRequestIndex += 1
    }
  }

  if (scenarioWantsEvent(scenario, 'progress')) {
    options.onProgress = (bytesSent, bytesTotal) => {
      observedEvents.push({ bytesSent, bytesTotal, kind: 'progress' })
    }
  }

  if (scenarioWantsEvent(scenario, 'upload-url-available')) {
    options.onUploadUrlAvailable = () => {
      observedEvents.push({ kind: 'upload-url-available' })
    }
  }

  if (scenarioWantsEvent(scenario, 'source-open') || scenarioWantsEvent(scenario, 'source-close')) {
    options.fileReader = makeEventRecordingFileReader(
      defaultOptions.fileReader,
      scenario,
      observedEvents,
    )
  }

  if (scenarioWantsEvent(scenario, 'should-retry')) {
    options.onShouldRetry = (_error, retryAttempt) => {
      const event = scenario.events.filter((candidate) => candidate.kind === 'should-retry')[
        retryDecisionIndex
      ]
      if (!event) {
        throw new Error(
          `Generated scenario ${scenario.scenarioId} received unexpected retry decision request ${retryDecisionIndex}`,
        )
      }

      observedEvents.push({
        decision: event.decision,
        kind: 'should-retry',
        retryAttempt,
      })
      retryDecisionIndex += 1
      return event.decision
    }
  }

  if (scenario.input.chunkSize != null) {
    options.chunkSize = scenario.input.chunkSize
  }

  if (scenario.input.metadataForPartialUploads != null) {
    options.metadataForPartialUploads = scenario.input.metadataForPartialUploads
  }

  if (scenario.input.headers != null) {
    options.headers = scenario.input.headers
  }

  if (scenario.input.addRequestId != null) {
    options.addRequestId = scenario.input.addRequestId
  }

  if (scenario.input.overridePatchMethod != null) {
    options.overridePatchMethod = scenario.input.overridePatchMethod
  }

  if (scenario.input.parallelUploads != null) {
    options.parallelUploads = scenario.input.parallelUploads
  }

  if (scenario.input.parallelUploadBoundaries != null) {
    options.parallelUploadBoundaries = scenario.input.parallelUploadBoundaries
  }

  if (scenario.input.retryDelays != null) {
    options.retryDelays = scenario.input.retryDelays
  }

  if (scenario.input.protocol != null) {
    options.protocol = scenario.input.protocol
  }

  if (scenario.input.uploadSize != null) {
    options.uploadSize = scenario.input.uploadSize
  }

  if (scenario.input.removeFingerprintOnSuccess != null) {
    options.removeFingerprintOnSuccess = scenario.input.removeFingerprintOnSuccess
  }

  if (scenario.input.storeFingerprintForResuming != null) {
    options.storeFingerprintForResuming = scenario.input.storeFingerprintForResuming
  }

  if (scenario.input.uploadDataDuringCreation != null) {
    options.uploadDataDuringCreation = scenario.input.uploadDataDuringCreation
  }

  if (scenario.input.uploadLengthDeferred != null) {
    options.uploadLengthDeferred = scenario.input.uploadLengthDeferred
  }

  if (scenario.input.uploadUrl != null) {
    options.uploadUrl = scenario.input.uploadUrl
  }

  Object.assign(options, scenario.input.rawOptions ?? {})

  const scenarioFingerprint =
    scenario.input.fingerprint !== undefined
      ? scenario.input.fingerprint
      : scenario.input.storedUpload?.fingerprint
  if (
    scenarioFingerprint !== undefined ||
    scenario.input.kind === 'web-readable-stream' ||
    scenario.input.kind === 'node-readable-stream'
  ) {
    options.fingerprint = jasmine.createSpy('fingerprint').and.callFake(() => {
      const fingerprint = scenarioFingerprint ?? null
      if (scenarioWantsEvent(scenario, 'fingerprint')) {
        observedEvents.push({ fingerprint, kind: 'fingerprint' })
      }
      return Promise.resolve(fingerprint)
    })
  }

  if (
    scenario.input.storedUpload != null ||
    scenarioWantsEvent(scenario, 'url-storage-add') ||
    scenarioWantsEvent(scenario, 'url-storage-find') ||
    scenarioWantsEvent(scenario, 'url-storage-remove')
  ) {
    options.urlStorage = makeEventRecordingUrlStorage(scenario.input.storedUpload, observedEvents)
  }

  const onChunkCompleteActions = scenarioExecutionActions(scenario, 'onChunkComplete')
  if (scenarioWantsEvent(scenario, 'chunk-complete') || onChunkCompleteActions.length > 0) {
    options.onChunkComplete = (chunkSize, bytesAccepted, bytesTotal) => {
      if (scenarioWantsEvent(scenario, 'chunk-complete')) {
        observedEvents.push({ bytesAccepted, bytesTotal, chunkSize, kind: 'chunk-complete' })
      }
      for (const action of onChunkCompleteActions) {
        if (action.kind === 'abort-upload') {
          terminatePromise = upload.abort(action.terminateUpload)
          continue
        }

        throw new Error(
          `Unsupported generated onChunkComplete action for ${scenario.scenarioId}: ${action.kind}`,
        )
      }
    }
  }

  upload = new Upload(await createScenarioInput(scenario.input), options)

  for (const action of scenarioExecutionActions(scenario, 'beforeStart')) {
    if (action.kind === 'resume-from-previous-upload') {
      const previousUploads = await upload.findPreviousUploads()
      expect(previousUploads.length).toBe(action.expectedPreviousUploadCount)
      const previousUpload = previousUploads[action.selectedPreviousUploadIndex]
      expect(previousUpload).toBeDefined()
      upload.resumeFromPreviousUpload(previousUpload)
      continue
    }

    throw new Error(
      `Unsupported generated beforeStart action for ${scenario.scenarioId}: ${action.kind}`,
    )
  }

  upload.start()

  return {
    observedEvents,
    onError,
    onSuccess,
    restoreRequestIdRandom,
    restoreRetryTimerRecorder,
    terminatePromise: () => terminatePromise,
    upload,
  }
}

function installRetryTimerRecorder(scenario, observedEvents) {
  if (!scenarioWantsEvent(scenario, 'retry-schedule')) {
    return () => {}
  }

  const originalSetTimeout = globalThis.setTimeout
  globalThis.setTimeout = (handler, delay, ...args) => {
    observedEvents.push({ delay, kind: 'retry-schedule' })
    return originalSetTimeout(handler, delay, ...args)
  }

  return () => {
    globalThis.setTimeout = originalSetTimeout
  }
}

async function runGeneratedConformanceScenario(scenario) {
  const feature = getClientFeature(scenario.featureId)
  expect(feature.primitives).toEqual(jasmine.arrayContaining(scenario.primitives))

  const testStack = new TestHttpStack()
  const {
    observedEvents,
    onError,
    onSuccess,
    restoreRetryTimerRecorder,
    restoreRequestIdRandom,
    terminatePromise,
    upload,
  } = await startScenarioUpload(scenario, testStack)
  const abortPromises = []

  try {
    for (const [scenarioRequestIndex, request] of scenario.requests.entries()) {
      const requestIndex = request.requestIndex
      expect(requestIndex).toBe(scenarioRequestIndex)
      const req = await testStack.nextRequest()
      expectScenarioRequest(req, scenario, request)

      if (request.abort) {
        abortPromises.push(
          abortScenarioRequest(req, scenario, request, requestIndex, observedEvents, upload),
        )
      } else if (request.errorMessage) {
        req.responseError(new Error(request.errorMessage))
      } else if (!request.response) {
        throw new Error(
          `Generated scenario ${scenario.scenarioId} request ${requestIndex} has no response, error, or abort`,
        )
      }
    }

    if (scenario.completion.kind === 'aborted') {
      await Promise.all(abortPromises)
      expect(onSuccess).not.toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()
      expectScenarioEvents(scenario, observedEvents)
      return
    }

    if (scenario.completion.kind === 'terminated') {
      await terminatePromise()
      expect(upload.url).toBe(scenario.completion.uploadUrl)
      expect(onSuccess).not.toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()
      expectScenarioEvents(scenario, observedEvents)
      return
    }

    if (scenario.completion.kind === 'error') {
      const err = await onError.toBeCalled()
      expect(err.message).toBe(scenario.completion.message)
      expect(onSuccess).not.toHaveBeenCalled()
      expect(await Promise.race([testStack.nextRequest(), wait(0)])).toBe('timed out')
      expectScenarioEvents(scenario, observedEvents)
      return
    }

    await onSuccess.toBeCalled()
    expect(upload.url).toBe(scenario.completion.uploadUrl)
    expect(onError).not.toHaveBeenCalled()
    expectScenarioEvents(scenario, observedEvents)
  } finally {
    restoreRequestIdRandom()
    restoreRetryTimerRecorder()
  }
}

describe('generated TUS protocol contract', () => {
  for (const scenario of tusClientConformanceScenarios) {
    if (!scenarioAppliesToCurrentRuntime(scenario)) {
      continue
    }

    it(`drives ${scenario.scenarioId} from the generated contract`, async () => {
      await runGeneratedConformanceScenario(getClientConformanceScenario(scenario.scenarioId))
    })
  }

  it('preserves the generated proof-profile scenarios', () => {
    for (const proofCase of tusClientScenarioProofCases) {
      const scenario = getClientConformanceScenario(proofCase.scenarioId)
      const feature = getClientFeature(proofCase.featureId)

      expect(scenario.behavior).toBe(proofCase.behavior)
      expect(scenario.completion.kind).toBe(proofCase.completionKind)
      expect(scenario.featureId).toBe(proofCase.featureId)
      expect(feature.conformance.scenarioIds).toContain(scenario.scenarioId)
      expect(scenario.operationIds).toEqual(proofCase.operationIds)
      expect(scenario.primitives).toEqual(proofCase.primitives)
    }
  })

  it('preserves the generated managed-upload proof scenarios', () => {
    for (const proofCase of tusManagedUploadProofCases) {
      const scenario = getManagedUploadScenario(proofCase.scenarioId)

      expect(tusManagedUpload.featureId).toBe(proofCase.featureId)
      expect(tusManagedUpload.layer).toBe(proofCase.layer)
      expect(scenario.requiredPrimitives).toEqual(proofCase.requiredPrimitives)
      for (const primitive of proofCase.requiredPrimitives) {
        expect(tusManagedUpload.primitives).toContain(primitive)
      }
      for (const featureId of proofCase.protocolFeatureIds) {
        getClientFeature(featureId)
      }
      expect(tusManagedUpload.runtimeProfiles.map((profile) => profile.runtime)).toEqual(
        proofCase.runtimeProfiles,
      )
    }
  })
})
