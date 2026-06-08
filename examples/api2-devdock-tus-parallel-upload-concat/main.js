import { Upload } from '../../lib.esm/node/index.js'
import {
  absentHeaderPresence,
  fail,
  loadScenario,
  requireTusConformanceScenario,
  TusConformanceHttpStack,
  tusConformanceExpectedEventSequence,
  tusConformanceUploadInput,
  tusConformanceUploadOptions,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

async function uploadWithParallelConcat(conformanceScenario) {
  const rawEvents = []
  const content = await tusConformanceUploadInput(conformanceScenario)
  const httpStack = new TusConformanceHttpStack(conformanceScenario, { events: rawEvents })
  const upload = new Upload(content, {
    ...tusConformanceUploadOptions(conformanceScenario),
    httpStack,
    onChunkComplete: (chunkSize, bytesAccepted, bytesTotal) => {
      rawEvents.push({
        bytesAccepted,
        bytesTotal,
        chunkSize,
        kind: 'chunk-complete',
      })
    },
    onProgress: (bytesSent, bytesTotal) => {
      rawEvents.push({
        bytesSent,
        bytesTotal,
        kind: 'progress',
      })
    },
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
    fail('parallel upload concat scenario did not expose an upload URL')
  }
  if (httpStack.nextRequestIndex !== conformanceScenario.requests.length) {
    fail(
      `parallel upload concat scenario expected ${conformanceScenario.requests.length} request(s), got ${httpStack.nextRequestIndex}`,
    )
  }
  const events = tusConformanceExpectedEventSequence(conformanceScenario, rawEvents)

  return {
    absentHeaderPresence: absentHeaderPresence(
      conformanceScenario,
      httpStack.observed.requestHeaders,
    ),
    completionKind,
    errorCalled,
    eventCount: events.length,
    events,
    rawEventCount: rawEvents.length,
    requestBodySizes: httpStack.observed.requestBodySizes,
    requestBodyStarts: httpStack.observed.requestBodyStarts,
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
  const result = await uploadWithParallelConcat(conformanceScenario)
  await writeJsonResult(result)
  console.log(
    `TypeScript TUS SDK devdock scenario ${scenario.scenarioId} concatenated ${conformanceScenario.inputOptionEntries.find((entry) => entry.key === 'parallelUploads')?.value ?? 'parallel'} upload(s) into ${result.uploadUrl}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
