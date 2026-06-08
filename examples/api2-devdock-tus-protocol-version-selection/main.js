import { Upload } from '../../lib.esm/node/index.js'
import {
  fail,
  loadScenario,
  requireTusConformanceScenario,
  TusConformanceHttpStack,
  tusConformanceUploadInput,
  tusConformanceUploadOptions,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

function absentHeaderPresence(conformanceScenario, requestHeaders) {
  return conformanceScenario.requests.map((request, requestIndex) => {
    const observedHeaders = requestHeaders[requestIndex]
    if (!observedHeaders) {
      fail(`protocol version scenario did not capture request ${requestIndex} headers`)
    }

    return Object.fromEntries(
      request.absentHeaders.map((header) => [header, Object.hasOwn(observedHeaders, header)]),
    )
  })
}

async function uploadWithProtocolVersionSelection(conformanceScenario) {
  const content = await tusConformanceUploadInput(conformanceScenario)
  const httpStack = new TusConformanceHttpStack(conformanceScenario)
  const upload = new Upload(content, {
    ...tusConformanceUploadOptions(conformanceScenario),
    httpStack,
  })
  let completionKind = 'unknown'
  let errorCalled = false
  let successCalled = false

  await new Promise((resolve, reject) => {
    upload.options.onError = (error) => {
      completionKind = 'error'
      errorCalled = true
      reject(error)
    }
    upload.options.onSuccess = () => {
      completionKind = 'success'
      successCalled = true
      resolve()
    }
    upload.start()
  })

  if (!upload.url) {
    fail('protocol version scenario did not expose an upload URL')
  }
  if (httpStack.nextRequestIndex !== conformanceScenario.requests.length) {
    fail(
      `protocol version scenario expected ${conformanceScenario.requests.length} request(s), got ${httpStack.nextRequestIndex}`,
    )
  }

  return {
    absentHeaderPresence: absentHeaderPresence(
      conformanceScenario,
      httpStack.observed.requestHeaders,
    ),
    completionKind,
    errorCalled,
    requestCount: httpStack.nextRequestIndex,
    requestHeaders: httpStack.observed.requestHeaders,
    requestMethods: httpStack.observed.requestMethods,
    requestUrls: httpStack.observed.requestUrls,
    successCalled,
    uploadUrl: upload.url,
  }
}

async function main() {
  const scenario = await loadScenario(import.meta.url)
  const conformanceScenario = requireTusConformanceScenario(scenario)
  const result = await uploadWithProtocolVersionSelection(conformanceScenario)
  await writeJsonResult(result)
  console.log(
    `TypeScript TUS SDK devdock scenario ${scenario.scenarioId} selected ${conformanceScenario.inputOptionEntries.find((entry) => entry.key === 'protocol')?.value ?? 'the default protocol'} for ${result.uploadUrl}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
