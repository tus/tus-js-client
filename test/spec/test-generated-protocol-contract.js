import { Upload } from 'tus-js-client'
import {
  tusClientConformanceScenarios,
  tusClientFeatures,
  tusProtocolOperations,
  tusWireVersions,
} from './generated-protocol-contract.js'
import { getBlob, TestHttpStack, waitableFunction } from './helpers/utils.js'

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

function getDefaultWireVersion() {
  const versions = tusWireVersions.filter((candidate) => candidate.default)
  if (versions.length !== 1) {
    throw new Error('Generated TUS protocol contract must have exactly one default wire version')
  }

  return versions[0].value
}

function requestMatchesHeaderVariant(requestHeaders, variant) {
  return variant.fields
    .filter((field) => field.required)
    .every((field) => requestHeaders[field.displayName] != null)
}

function expectRequestMatchesOperation(req, operation) {
  expect(req.method).toBe(operation.method)

  if (operation.request.contentType) {
    expect(req.requestHeaders['Content-Type']).toBe(operation.request.contentType)
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
  const defaultWireVersion = getDefaultWireVersion()
  for (const field of variant?.fields ?? []) {
    if (!field.required) continue
    if (overrides[field.displayName] != null) {
      headers[field.displayName] = overrides[field.displayName]
      continue
    }

    if (field.displayName === 'Tus-Resumable') {
      headers[field.displayName] = defaultWireVersion
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
  const operationResponse = getOperationResponse(operation, response.statusCode)
  if (!operationResponse) {
    return response.headers ?? {}
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

function createScenarioInput(input) {
  if (input.kind === 'blob') {
    return getBlob(input.content)
  }

  if (input.kind === 'readable-stream') {
    return createReadableStream(input.content)
  }

  throw new Error(`Unsupported generated TUS scenario input kind: ${input.kind}`)
}

function makeStoredUploadStorage(storedUpload) {
  return {
    findAllUploads() {
      return Promise.resolve([
        {
          creationTime: new Date(0).toString(),
          metadata: {},
          size: null,
          uploadUrl: storedUpload.uploadUrl,
          urlStorageKey: storedUpload.fingerprint,
        },
      ])
    },
    findUploadsByFingerprint(fingerprint) {
      expect(fingerprint).toBe(storedUpload.fingerprint)
      return this.findAllUploads()
    },
    addUpload() {
      return Promise.resolve(storedUpload.fingerprint)
    },
    removeUpload(urlStorageKey) {
      expect(urlStorageKey).toBe(storedUpload.fingerprint)
      return Promise.resolve()
    },
  }
}

function expectedUrlForScenarioRequest(scenario, request) {
  if (request.url === 'endpoint') {
    return scenario.input.endpointUrl
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
  expectRequestMatchesOperation(req, operation)

  for (const [header, value] of Object.entries(request.headers ?? {})) {
    expect(req.requestHeaders[header]).toBe(value)
  }

  for (const header of request.absentHeaders ?? []) {
    expect(req.requestHeaders[header]).toBe(undefined)
  }

  if (request.bodySize != null) {
    expect(req.bodySize).toBe(request.bodySize)
  }

  req.respondWith({
    status: request.response.statusCode,
    responseHeaders: scenarioResponseHeadersFor(operation, request.response),
  })
}

async function startScenarioUpload(scenario, testStack) {
  let upload
  let terminatePromise
  const options = {
    endpoint: scenario.input.endpointUrl,
    httpStack: testStack,
    metadata: scenario.input.metadata ?? {},
    onError: waitableFunction('onError'),
    onSuccess: waitableFunction('onSuccess'),
  }

  if (scenario.input.chunkSize != null) {
    options.chunkSize = scenario.input.chunkSize
  }

  if (scenario.input.retryDelays != null) {
    options.retryDelays = scenario.input.retryDelays
  }

  if (scenario.input.uploadLengthDeferred != null) {
    options.uploadLengthDeferred = scenario.input.uploadLengthDeferred
  }

  if (scenario.input.uploadUrl != null) {
    options.uploadUrl = scenario.input.uploadUrl
  }

  if (scenario.input.storedUpload != null) {
    options.fingerprint = jasmine
      .createSpy('fingerprint')
      .and.resolveTo(scenario.input.storedUpload.fingerprint)
    options.urlStorage = makeStoredUploadStorage(scenario.input.storedUpload)
  } else if (scenario.input.kind === 'readable-stream') {
    options.fingerprint = jasmine.createSpy('fingerprint').and.resolveTo(null)
  }

  if (scenario.behavior === 'terminate-with-retry') {
    options.onChunkComplete = () => {
      terminatePromise = upload.abort(true)
    }
  }

  upload = new Upload(createScenarioInput(scenario.input), options)

  if (scenario.behavior === 'resume-from-previous-upload') {
    const previousUploads = await upload.findPreviousUploads()
    expect(previousUploads.length).toBe(1)
    upload.resumeFromPreviousUpload(previousUploads[0])
  }

  upload.start()

  return { options, terminatePromise: () => terminatePromise, upload }
}

async function runGeneratedConformanceScenario(scenario) {
  const feature = getClientFeature(scenario.featureId)
  expect(feature.primitives).toEqual(jasmine.arrayContaining(scenario.primitives))

  const testStack = new TestHttpStack()
  const { options, terminatePromise, upload } = await startScenarioUpload(scenario, testStack)

  for (const request of scenario.requests) {
    const req = await testStack.nextRequest()
    expectScenarioRequest(req, scenario, request)
  }

  if (scenario.completion.kind === 'terminated') {
    await terminatePromise()
    expect(upload.url).toBe(scenario.completion.uploadUrl)
    expect(options.onSuccess).not.toHaveBeenCalled()
    expect(options.onError).not.toHaveBeenCalled()
    return
  }

  await options.onSuccess.toBeCalled()
  expect(upload.url).toBe(scenario.completion.uploadUrl)
  expect(options.onError).not.toHaveBeenCalled()
}

describe('generated TUS protocol contract', () => {
  for (const scenario of tusClientConformanceScenarios) {
    it(`drives ${scenario.scenarioId} from the generated contract`, async () => {
      await runGeneratedConformanceScenario(getClientConformanceScenario(scenario.scenarioId))
    })
  }

  it('covers the expected first wave of generated conformance scenarios', () => {
    expect(tusClientConformanceScenarios.map((scenario) => scenario.scenarioId)).toEqual([
      'singleUploadLifecycle',
      'resumeFromPreviousUpload',
      'deferredLengthUpload',
      'retryPatchAfterOffsetRecovery',
      'terminateWithRetry',
    ])
  })
})
