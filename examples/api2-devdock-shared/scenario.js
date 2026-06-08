import { readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'

import {
  TUS_DEFAULT_CLIENT_PROTOCOL,
  tusAbortErrorDescriptor,
  tusRequestHeadersForProtocol,
} from '../../lib.esm/protocol_generated.js'

export function fail(message) {
  throw new Error(message)
}

function exampleDirname(moduleUrl) {
  return path.dirname(fileURLToPath(moduleUrl))
}

export async function loadScenario(moduleUrl) {
  const scenarioPath =
    process.env.API2_SDK_EXAMPLE_SCENARIO ??
    path.join(exampleDirname(moduleUrl), 'api2-scenario.json')

  return JSON.parse(await readFile(scenarioPath, 'utf8'))
}

export function readPath(value, pathParts, label) {
  let current = value
  for (const part of pathParts) {
    if (Array.isArray(current) && Number.isInteger(part)) {
      if (part >= current.length) {
        fail(`${label} path ${JSON.stringify(pathParts)} index ${part} is out of range`)
      }
      current = current[part]
      continue
    }

    if (
      typeof current === 'object' &&
      current !== null &&
      !Array.isArray(current) &&
      typeof part === 'string'
    ) {
      if (!Object.hasOwn(current, part)) {
        fail(`${label} path ${JSON.stringify(pathParts)} is missing key ${JSON.stringify(part)}`)
      }
      current = current[part]
      continue
    }

    fail(`${label} path ${JSON.stringify(pathParts)} cannot read ${JSON.stringify(part)}`)
  }

  return current
}

export function resolveValue(valueSpec, context, label) {
  if (Object.hasOwn(valueSpec, 'value')) {
    return valueSpec.value
  }

  const source = valueSpec.source
  if (typeof source !== 'object' || source === null || Array.isArray(source)) {
    fail(`${label} value spec has no literal value or source`)
  }

  if (!Object.hasOwn(context, source.root)) {
    fail(`${label} value source root ${JSON.stringify(source.root)} is unavailable`)
  }

  if (!Array.isArray(source.path)) {
    fail(`${label} value source path must be an array`)
  }

  return readPath(context[source.root], source.path, label)
}

export function scalarString(value) {
  if (value === null) {
    return 'null'
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  return String(value)
}

export function scenarioBytes(uploadConfig) {
  const source = uploadConfig.source
  if (source.kind !== 'bytes') {
    fail(`unsupported scenario source kind ${JSON.stringify(source.kind)}`)
  }

  if (source.encoding !== 'utf8') {
    fail(`unsupported scenario source encoding ${JSON.stringify(source.encoding)}`)
  }

  return Buffer.from(source.value, 'utf8')
}

export function uploadMetadata(uploadConfig, scenario, createResponse) {
  const context = { createResponse, scenario }
  const metadata = {}
  for (const field of uploadConfig.metadata) {
    metadata[field.name] = scalarString(resolveValue(field.value, context, field.name))
  }

  return metadata
}

export function tusUploadOptions({ content, createResponse, scenario }) {
  const uploadConfig = scenario.upload
  const context = { createResponse, scenario }
  const options = {
    endpoint: scalarString(resolveValue(uploadConfig.tusUrl, context, 'tusUrl')),
    chunkSize: chunkSizeBytes(uploadConfig.chunkSize, content.length),
    metadata: uploadMetadata(uploadConfig, scenario, createResponse),
    retryDelays: retryDelays(uploadConfig.retries),
  }

  if (uploadConfig.headers) {
    options.headers = uploadConfig.headers
  }

  if (uploadConfig.addRequestId === true) {
    options.addRequestId = true
  }

  if (uploadConfig.uploadDataDuringCreation === true) {
    options.uploadDataDuringCreation = true
  }

  if (uploadConfig.uploadLengthDeferred === true) {
    options.uploadLengthDeferred = true
  }

  return options
}

export function tusDefaultRequestHeaders() {
  return tusRequestHeadersForProtocol(TUS_DEFAULT_CLIENT_PROTOCOL)
}

export function retryDelays(retries) {
  if (!Number.isInteger(retries) || retries < 0) {
    fail(`unsupported retry count ${JSON.stringify(retries)}`)
  }

  return Array.from({ length: retries }, () => 0)
}

export function chunkSizeBytes(chunkSize, contentLength) {
  if (chunkSize === 'full-file') {
    return contentLength
  }

  if (
    typeof chunkSize === 'object' &&
    chunkSize !== null &&
    !Array.isArray(chunkSize) &&
    chunkSize.kind === 'fixed-bytes' &&
    Number.isInteger(chunkSize.bytes) &&
    chunkSize.bytes > 0
  ) {
    return chunkSize.bytes
  }

  fail(`unsupported chunk size policy ${JSON.stringify(chunkSize)}`)
}

export function requireResumePlan(uploadConfig) {
  const resume = uploadConfig.resume
  if (typeof resume !== 'object' || resume === null || Array.isArray(resume)) {
    fail('scenario upload is missing a resume plan')
  }

  return resume
}

export function requireRetryOffsetRecoveryPlan(uploadConfig) {
  const retryOffsetRecovery = uploadConfig.retryOffsetRecovery
  if (
    typeof retryOffsetRecovery !== 'object' ||
    retryOffsetRecovery === null ||
    Array.isArray(retryOffsetRecovery)
  ) {
    fail('scenario upload is missing a retry offset recovery plan')
  }

  return retryOffsetRecovery
}

export function requireRequestLifecycleHooksPlan(uploadConfig) {
  const requestLifecycleHooks = uploadConfig.requestLifecycleHooks
  if (
    typeof requestLifecycleHooks !== 'object' ||
    requestLifecycleHooks === null ||
    Array.isArray(requestLifecycleHooks)
  ) {
    fail('scenario upload is missing a request lifecycle hooks plan')
  }

  return requestLifecycleHooks
}

export function requireTusConformanceScenario(scenario) {
  const conformanceScenario = scenario.conformanceScenario
  if (
    typeof conformanceScenario !== 'object' ||
    conformanceScenario === null ||
    Array.isArray(conformanceScenario)
  ) {
    fail('scenario is missing a TUS conformance scenario')
  }

  return conformanceScenario
}

function fixedBodySize(body) {
  if (body == null) {
    return null
  }

  if (body instanceof Blob) {
    return body.size
  }

  if (body instanceof ArrayBuffer) {
    return body.byteLength
  }

  if (ArrayBuffer.isView(body)) {
    return body.byteLength
  }

  if (typeof body.length === 'number') {
    return body.length
  }

  fail(`TUS conformance scenario cannot measure request body ${typeof body}`)
}

function chunkSize(chunk) {
  if (typeof chunk === 'string') {
    return Buffer.byteLength(chunk)
  }

  if (chunk instanceof ArrayBuffer) {
    return chunk.byteLength
  }

  if (ArrayBuffer.isView(chunk)) {
    return chunk.byteLength
  }

  fail(`TUS conformance scenario cannot measure request body chunk ${typeof chunk}`)
}

async function streamBodySize(body, progressHandler) {
  let size = 0
  for await (const chunk of body) {
    size += chunkSize(chunk)
    progressHandler(size)
  }

  return size
}

async function bodySize(body, progressHandler) {
  if (body instanceof Readable) {
    return await streamBodySize(body, progressHandler)
  }

  return fixedBodySize(body)
}

function contentBytes(content) {
  return new TextEncoder().encode(content)
}

function readableStreamFromContent(content) {
  let sent = false
  const bytes = contentBytes(content)
  return new ReadableStream({
    pull(controller) {
      if (sent) {
        controller.close()
        return
      }

      controller.enqueue(bytes)
      sent = true
    },
  })
}

const sameNameTusConformanceInputOptionKeys = new Set([
  'addRequestId',
  'chunkSize',
  'headers',
  'metadata',
  'metadataForPartialUploads',
  'overridePatchMethod',
  'parallelUploadBoundaries',
  'parallelUploads',
  'protocol',
  'removeFingerprintOnSuccess',
  'retryDelays',
  'storeFingerprintForResuming',
  'uploadDataDuringCreation',
  'uploadLengthDeferred',
  'uploadSize',
  'uploadUrl',
])

export function tusConformanceInputOptions(conformanceScenario) {
  const options = {}
  for (const entry of conformanceScenario.inputOptionEntries) {
    options[entry.key] = entry.value
  }

  return options
}

export function tusConformanceUploadOptions(conformanceScenario) {
  const options = {}

  for (const entry of conformanceScenario.inputOptionEntries) {
    if (entry.key === 'endpointUrl') {
      options.endpoint = entry.value
      continue
    }

    if (entry.key === 'rawOptions') {
      Object.assign(options, entry.value)
      continue
    }

    if (sameNameTusConformanceInputOptionKeys.has(entry.key)) {
      options[entry.key] = entry.value
      continue
    }

    fail(`TUS conformance scenario cannot map input option ${JSON.stringify(entry.key)}`)
  }

  return options
}

export function tusConformanceRuntimeSetupOptions(conformanceScenario) {
  const runtimeSetup = conformanceScenario.runtimeSetup
  if (typeof runtimeSetup !== 'object' || runtimeSetup === null || Array.isArray(runtimeSetup)) {
    return {}
  }

  const options = {}
  const fingerprint = runtimeSetup.fingerprint
  if (
    typeof fingerprint === 'object' &&
    fingerprint !== null &&
    !Array.isArray(fingerprint) &&
    fingerprint.install === true
  ) {
    if (typeof fingerprint.value !== 'string') {
      fail('TUS conformance scenario asked to install a fingerprint without a string value')
    }

    options.fingerprint = async () => fingerprint.value
  }

  return options
}

export async function tusConformanceUploadInput(conformanceScenario) {
  const inputSource = conformanceScenario.inputSource
  if (inputSource.kind === 'blob') {
    return new Blob([inputSource.content])
  }

  if (inputSource.kind === 'array-buffer') {
    const bytes = contentBytes(inputSource.content)
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  }

  if (inputSource.kind === 'array-buffer-view') {
    return contentBytes(inputSource.content)
  }

  if (inputSource.kind === 'web-readable-stream') {
    return readableStreamFromContent(inputSource.content)
  }

  if (inputSource.kind === 'node-readable-stream') {
    return Readable.from([Buffer.from(contentBytes(inputSource.content))])
  }

  if (inputSource.kind === 'node-path-reference') {
    const filePath = path.join(
      tmpdir(),
      `tus-js-client-api2-${conformanceScenario.scenarioId}-input.bin`,
    )
    await writeFile(filePath, contentBytes(inputSource.content))
    return { path: filePath }
  }

  fail(`TUS conformance scenario cannot build input kind ${JSON.stringify(inputSource.kind)}`)
}

class ContractResponse {
  constructor(responsePlan) {
    this.responsePlan = responsePlan
  }

  getStatus() {
    return this.responsePlan.statusCode
  }

  getHeader(header) {
    return this.responsePlan.effectiveHeaders[header]
  }

  getBody() {
    return this.responsePlan.body ?? ''
  }

  getUnderlyingObject() {
    return this.responsePlan
  }
}

class ContractRequest {
  constructor({ events, observed, onRequestStart, requestPlan, url }) {
    this.headers = {}
    this.events = events
    this.observed = observed
    this.onRequestStart = onRequestStart
    this.requestPlan = requestPlan
    this.url = url
    this.abortReject = null
    this.abortRecorded = false
    this.aborted = false
    this.progressHandler = () => {}
  }

  getMethod() {
    return this.requestPlan.effectiveMethod
  }

  getURL() {
    return this.url
  }

  setHeader(header, value) {
    this.headers[header] = value
  }

  getHeader(header) {
    return this.headers[header]
  }

  setProgressHandler(progressHandler) {
    this.progressHandler = progressHandler
  }

  async send(body = null) {
    for (const [header, value] of Object.entries(this.requestPlan.effectiveHeaders)) {
      if (this.headers[header] !== value) {
        fail(
          `TUS conformance scenario expected request header ${header}=${JSON.stringify(value)}, got ${JSON.stringify(this.headers[header])}`,
        )
      }
    }

    const isStreamBody = body instanceof Readable
    const size = await bodySize(body, this.progressHandler)
    if (size !== this.requestPlan.bodySize) {
      fail(
        `TUS conformance scenario expected request body size ${this.requestPlan.bodySize}, got ${size}`,
      )
    }

    if (size != null && !isStreamBody) {
      this.progressHandler(0)
      this.progressHandler(size)
    }

    this.observed.requestHeaders.push({ ...this.headers })
    this.observed.requestMethods.push(this.requestPlan.effectiveMethod)
    this.observed.requestUrls.push(this.url)

    if (this.requestPlan.abort) {
      return new Promise((_resolve, reject) => {
        this.abortReject = reject
        this.onRequestStart(this.requestPlan)
        if (this.aborted) {
          this.rejectAbort()
        }
      })
    }

    this.onRequestStart(this.requestPlan)

    if (this.requestPlan.errorMessage) {
      return Promise.reject(new Error(this.requestPlan.errorMessage))
    }

    if (!this.requestPlan.response) {
      fail('TUS conformance scenario request has no response or error plan')
    }

    return Promise.resolve(new ContractResponse(this.requestPlan.response))
  }

  abort() {
    if (this.requestPlan.abort !== true) {
      fail(
        `TUS conformance scenario did not expect request ${this.requestPlan.requestIndex} to be aborted`,
      )
    }

    this.aborted = true
    if (!this.abortRecorded) {
      this.events.push({
        kind: 'request-abort',
        method: this.requestPlan.effectiveMethod,
        requestIndex: this.requestPlan.requestIndex,
        url: this.url,
      })
      this.abortRecorded = true
    }

    this.rejectAbort()
    return Promise.resolve()
  }

  rejectAbort() {
    if (!this.abortReject) {
      return
    }

    const reject = this.abortReject
    this.abortReject = null
    const error = tusAbortErrorDescriptor()
    reject(new DOMException(error.message, error.name))
  }

  getUnderlyingObject() {
    return this.requestPlan
  }
}

export function tusConformanceScenarioWantsEvent(conformanceScenario, kind) {
  return conformanceScenario.events.some((event) => event.kind === kind)
}

export function tusConformanceRetryObserver(conformanceScenario, events) {
  const retryDecisions = Array.isArray(conformanceScenario.retryDecisions)
    ? conformanceScenario.retryDecisions
    : []
  if (tusConformanceScenarioWantsEvent(conformanceScenario, 'should-retry')) {
    if (retryDecisions.length === 0) {
      fail('TUS conformance scenario wants retry decisions but exposes none')
    }
  }

  let allowedScheduleCount = 0
  let retryDecisionIndex = 0
  let restoreRetryTimer = () => {}

  if (tusConformanceScenarioWantsEvent(conformanceScenario, 'retry-schedule')) {
    const originalSetTimeout = globalThis.setTimeout
    globalThis.setTimeout = (handler, delay, ...args) => {
      if (allowedScheduleCount > 0) {
        events.push({ delay, kind: 'retry-schedule' })
        allowedScheduleCount -= 1
      }

      return originalSetTimeout(handler, delay, ...args)
    }
    restoreRetryTimer = () => {
      globalThis.setTimeout = originalSetTimeout
    }
  }

  const onShouldRetry =
    retryDecisions.length === 0
      ? undefined
      : (_error, retryAttempt) => {
          const retryDecision = retryDecisions[retryDecisionIndex]
          if (!retryDecision) {
            fail(
              `TUS conformance scenario received unexpected retry decision request ${retryDecisionIndex}`,
            )
          }
          if (retryDecision.retryAttempt !== retryAttempt) {
            fail(
              `TUS conformance scenario expected retry attempt ${retryDecision.retryAttempt}, got ${retryAttempt}`,
            )
          }

          events.push({
            decision: retryDecision.decision,
            kind: 'should-retry',
            retryAttempt,
          })
          if (retryDecision.decision) {
            allowedScheduleCount += 1
          }
          retryDecisionIndex += 1
          return retryDecision.decision
        }

  return {
    assertComplete() {
      if (retryDecisionIndex !== retryDecisions.length) {
        fail(
          `TUS conformance scenario expected ${retryDecisions.length} retry decision(s), got ${retryDecisionIndex}`,
        )
      }
      if (allowedScheduleCount !== 0) {
        fail(`TUS conformance scenario left ${allowedScheduleCount} retry schedule(s) unobserved`)
      }
    },
    onShouldRetry,
    restore: restoreRetryTimer,
  }
}

export function tusConformanceEventRecordingFileReader({
  conformanceScenario,
  events,
  fileReader,
}) {
  return {
    async openFile(input, chunkSize) {
      const source = await fileReader.openFile(input, chunkSize)

      if (tusConformanceScenarioWantsEvent(conformanceScenario, 'source-open')) {
        events.push({
          inputKind: conformanceScenario.inputSource.kind,
          kind: 'source-open',
          size: source.size,
        })
      }

      return {
        get size() {
          return source.size
        },
        close() {
          events.push({ kind: 'source-close' })
          source.close()
        },
        slice(start, end) {
          return source.slice(start, end)
        },
      }
    },
  }
}

export class TusConformanceHttpStack {
  constructor(conformanceScenario, { events = [] } = {}) {
    this.conformanceScenario = conformanceScenario
    this.events = events
    this.nextRequestIndex = 0
    this.onRequestStart = () => {}
    this.observed = {
      requestHeaders: [],
      requestMethods: [],
      requestUrls: [],
    }
  }

  createRequest(method, url) {
    const requestPlan = this.conformanceScenario.requests[this.nextRequestIndex]
    if (!requestPlan) {
      fail(`TUS conformance scenario received unexpected ${method} request to ${url}`)
    }

    this.nextRequestIndex += 1

    if (method !== requestPlan.effectiveMethod) {
      fail(
        `TUS conformance scenario expected ${requestPlan.effectiveMethod} request, got ${method}`,
      )
    }

    if (url !== requestPlan.expectedUrl) {
      fail(`TUS conformance scenario expected request URL ${requestPlan.expectedUrl}, got ${url}`)
    }

    return new ContractRequest({
      events: this.events,
      observed: this.observed,
      onRequestStart: this.onRequestStart,
      requestPlan,
      url,
    })
  }

  getName() {
    return 'API2 contract conformance transport'
  }
}

export function requireTerminationPlan(uploadConfig) {
  const termination = uploadConfig.termination
  if (typeof termination !== 'object' || termination === null || Array.isArray(termination)) {
    fail('scenario upload is missing a termination plan')
  }

  return termination
}

export function requireUploadCallbacksPlan(uploadConfig) {
  const callbacks = uploadConfig.uploadCallbacks
  if (typeof callbacks !== 'object' || callbacks === null || Array.isArray(callbacks)) {
    fail('scenario upload is missing an upload callback plan')
  }

  return callbacks
}

export function uploadCallbackEventKey(callbacks, ...parts) {
  return parts.join(callbacks.eventKeyPartSeparator)
}

export function uploadCallbackEventKeyNumber(value) {
  return String(value)
}

export function uploadCallbackEventKeyTotal(value) {
  return scalarString(value)
}

function uploadCallbackEventMatchesExpected(callbacks, expectedIndex, actual) {
  if (actual === callbacks.eventKeys[expectedIndex]) {
    return true
  }

  if (expectedIndex >= callbacks.eventKeyAlternativeGroups.length) {
    return false
  }

  return callbacks.eventKeyAlternativeGroups[expectedIndex].includes(actual)
}

function hasAllowedUploadCallbackExtraEventPrefix(callbacks, event) {
  return callbacks.allowedExtraEventKeyPrefixes.some((prefix) => event.startsWith(prefix))
}

export function matchUploadCallbackEventKeys(callbacks, actual) {
  const policy = callbacks.eventPolicyMatching
  if (policy !== 'exact' && policy !== 'exact-except-allowed-extra-events') {
    fail(`unsupported upload callback event policy ${JSON.stringify(policy)}`)
  }

  let expectedIndex = 0
  const matched = []
  for (const event of actual) {
    if (
      expectedIndex < callbacks.eventKeys.length &&
      uploadCallbackEventMatchesExpected(callbacks, expectedIndex, event)
    ) {
      matched.push(callbacks.eventKeys[expectedIndex])
      expectedIndex += 1
      continue
    }

    if (
      policy === 'exact-except-allowed-extra-events' &&
      hasAllowedUploadCallbackExtraEventPrefix(callbacks, event)
    ) {
      continue
    }

    fail(
      `upload callback events emitted unexpected extra event ${JSON.stringify(event)}; allowed prefixes ${JSON.stringify(callbacks.allowedExtraEventKeyPrefixes)}; expected ${JSON.stringify(callbacks.eventKeys)}, got ${JSON.stringify(actual)}`,
    )
  }

  if (expectedIndex !== callbacks.eventKeys.length) {
    fail(
      `upload callback events did not emit every expected non-extra event; expected ${JSON.stringify(callbacks.eventKeys)}, got ${JSON.stringify(actual)}`,
    )
  }

  return matched
}

export async function writeJsonResult(result) {
  const resultPath = process.env.API2_SDK_EXAMPLE_RESULT
  if (!resultPath) {
    return
  }

  await writeFile(resultPath, `${JSON.stringify(result, undefined, 2)}\n`)
}
