import { Upload } from '../../lib.esm/node/index.js'
import {
  fail,
  loadScenario,
  requireTusConformanceScenario,
  TusConformanceHttpStack,
  tusConformanceRetryObserver,
  tusConformanceRuntimeSetupOptions,
  tusConformanceUploadInput,
  tusConformanceUploadOptions,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

async function uploadWithRetryStateTransitions(conformanceScenario) {
  const events = []
  const content = await tusConformanceUploadInput(conformanceScenario)
  const httpStack = new TusConformanceHttpStack(conformanceScenario)
  const retryObserver = tusConformanceRetryObserver(conformanceScenario, events)
  const options = {
    ...tusConformanceUploadOptions(conformanceScenario),
    ...tusConformanceRuntimeSetupOptions(conformanceScenario),
    httpStack,
  }
  if (retryObserver.onShouldRetry) {
    options.onShouldRetry = retryObserver.onShouldRetry
  }

  const upload = new Upload(content, options)
  let completionKind = 'unknown'
  let errorCalled = false
  let successCalled = false

  try {
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
  } finally {
    retryObserver.restore()
  }

  retryObserver.assertComplete()

  if (!upload.url) {
    fail('retry state transition scenario did not expose an upload URL')
  }
  if (httpStack.nextRequestIndex !== conformanceScenario.requests.length) {
    fail(
      `retry state transition scenario expected ${conformanceScenario.requests.length} request(s), got ${httpStack.nextRequestIndex}`,
    )
  }

  return {
    completionKind,
    errorCalled,
    eventCount: events.length,
    events,
    requestCount: httpStack.nextRequestIndex,
    requestMethods: httpStack.observed.requestMethods,
    requestUrls: httpStack.observed.requestUrls,
    successCalled,
    uploadUrl: upload.url,
  }
}

async function main() {
  const scenario = await loadScenario(import.meta.url)
  const conformanceScenario = requireTusConformanceScenario(scenario)
  const result = await uploadWithRetryStateTransitions(conformanceScenario)
  await writeJsonResult(result)
  console.log(
    `TypeScript TUS SDK devdock scenario ${scenario.scenarioId} observed ${result.eventCount} retry event(s) for ${result.uploadUrl}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
