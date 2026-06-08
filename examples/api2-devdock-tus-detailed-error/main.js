import { DetailedError, Upload } from '../../lib.esm/node/index.js'
import {
  fail,
  loadScenario,
  requireTusConformanceScenario,
  TusConformanceHttpStack,
  tusConformanceUploadInput,
  tusConformanceUploadOptions,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

function detailedErrorRequestIdHeaderName(conformanceScenario) {
  const inputHeadersEntry = conformanceScenario.inputOptionEntries.find((entry) => {
    return entry.key === 'headers'
  })
  const inputHeaders = inputHeadersEntry?.value
  if (typeof inputHeaders !== 'object' || inputHeaders === null || Array.isArray(inputHeaders)) {
    fail('detailed error scenario is missing request headers input options')
  }

  const expectedHeaders = conformanceScenario.requests[0]?.effectiveHeaders
  if (
    typeof expectedHeaders !== 'object' ||
    expectedHeaders === null ||
    Array.isArray(expectedHeaders)
  ) {
    fail('detailed error scenario is missing expected request headers')
  }

  const matchingHeaderNames = Object.entries(inputHeaders)
    .filter(([name, value]) => expectedHeaders[name] === value)
    .map(([name]) => name)

  if (matchingHeaderNames.length !== 1) {
    fail(
      `detailed error scenario expected one request ID header candidate, got ${matchingHeaderNames.length}`,
    )
  }

  return matchingHeaderNames[0]
}

async function uploadExpectingDetailedError(conformanceScenario) {
  const content = await tusConformanceUploadInput(conformanceScenario)
  const httpStack = new TusConformanceHttpStack(conformanceScenario)
  const upload = new Upload(content, {
    ...tusConformanceUploadOptions(conformanceScenario),
    httpStack,
  })

  let capturedError = null
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('detailed error scenario did not fail before timeout'))
    }, 1000)

    upload.options.onError = (error) => {
      clearTimeout(timeout)
      capturedError = error
      resolve()
    }
    upload.options.onSuccess = () => {
      clearTimeout(timeout)
      reject(new Error('detailed error scenario unexpectedly succeeded'))
    }

    upload.start()
  })

  if (!(capturedError instanceof Error)) {
    fail('detailed error scenario did not capture an Error instance')
  }

  if (httpStack.nextRequestIndex !== conformanceScenario.requests.length) {
    fail(
      `detailed error scenario expected ${conformanceScenario.requests.length} request(s), got ${httpStack.nextRequestIndex}`,
    )
  }

  const originalRequest = capturedError.originalRequest
  if (!originalRequest) {
    fail('detailed error scenario did not expose the original request')
  }

  const requestIdHeaderName = detailedErrorRequestIdHeaderName(conformanceScenario)
  const originalResponse = capturedError.originalResponse ?? null
  const causingError = capturedError.causingError ?? null
  const result = {
    causingErrorPresent: causingError instanceof Error,
    errorCaught: true,
    errorIsDetailed: capturedError instanceof DetailedError,
    errorMessage: capturedError.message,
    originalRequestMethod: originalRequest.getMethod(),
    originalRequestRequestId: originalRequest.getHeader(requestIdHeaderName),
    originalRequestUrl: originalRequest.getURL(),
    originalResponsePresent: originalResponse !== null,
    requestCount: httpStack.nextRequestIndex,
    requestMethods: httpStack.observed.requestMethods,
    requestUrls: httpStack.observed.requestUrls,
  }

  if (causingError instanceof Error) {
    result.causingErrorMessage = causingError.message
  }

  if (originalResponse !== null) {
    result.originalResponseBody = originalResponse.getBody()
    result.originalResponseStatus = originalResponse.getStatus()
  }

  return result
}

async function main() {
  const scenario = await loadScenario(import.meta.url)
  const conformanceScenario = requireTusConformanceScenario(scenario)
  const result = await uploadExpectingDetailedError(conformanceScenario)
  await writeJsonResult(result)
  console.log(
    `TypeScript TUS SDK devdock scenario ${scenario.scenarioId} reported ${conformanceScenario.completion.reason}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
