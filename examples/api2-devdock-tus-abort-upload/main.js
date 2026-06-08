import { Upload } from '../../lib.esm/node/index.js'
import {
  fail,
  loadScenario,
  requireTusConformanceScenario,
  TusConformanceHttpStack,
  tusConformanceRuntimeSetupOptions,
  tusConformanceUploadInput,
  tusConformanceUploadOptions,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

function cancelUploadActions(conformanceScenario) {
  return conformanceScenario.execution.onRequestStart.filter((action) => {
    return action.kind === 'cancel-upload'
  })
}

async function waitForAbortPromises({ abortPromises, expectedCount }) {
  const timeoutMs = 1000
  const startedAt = Date.now()

  while (abortPromises.length < expectedCount) {
    if (Date.now() - startedAt > timeoutMs) {
      fail(`abort scenario expected ${expectedCount} abort promise(s), got ${abortPromises.length}`)
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 0)
    })
  }
}

async function uploadAndAbort(conformanceScenario) {
  const content = await tusConformanceUploadInput(conformanceScenario)
  const events = []
  const httpStack = new TusConformanceHttpStack(conformanceScenario, { events })
  const abortPromises = []
  const actions = cancelUploadActions(conformanceScenario)
  let errorCalled = false
  let successCalled = false
  let upload = null

  httpStack.onRequestStart = (requestPlan) => {
    for (const action of actions) {
      if (action.requestIndex !== requestPlan.requestIndex) {
        continue
      }

      if (!upload) {
        fail('abort scenario tried to cancel before the Upload was available')
      }

      abortPromises.push(upload.abort(conformanceScenario.runtimeSetup.abort.terminateUpload))
    }
  }

  upload = new Upload(content, {
    ...tusConformanceUploadOptions(conformanceScenario),
    ...tusConformanceRuntimeSetupOptions(conformanceScenario),
    httpStack,
    onError() {
      errorCalled = true
    },
    onSuccess() {
      successCalled = true
    },
  })

  upload.start()
  await waitForAbortPromises({ abortPromises, expectedCount: actions.length })
  await Promise.all(abortPromises)
  await new Promise((resolve) => {
    setTimeout(resolve, 0)
  })

  if (httpStack.nextRequestIndex !== conformanceScenario.requests.length) {
    fail(
      `abort scenario expected ${conformanceScenario.requests.length} request(s), got ${httpStack.nextRequestIndex}`,
    )
  }

  return {
    completionKind: 'aborted',
    errorCalled,
    events,
    requestCount: httpStack.nextRequestIndex,
    requestMethods: httpStack.observed.requestMethods,
    requestUrls: httpStack.observed.requestUrls,
    successCalled,
    uploadUrl: upload.url ?? null,
  }
}

async function main() {
  const scenario = await loadScenario(import.meta.url)
  const conformanceScenario = requireTusConformanceScenario(scenario)
  const result = await uploadAndAbort(conformanceScenario)
  await writeJsonResult(result)
  console.log(`TypeScript TUS SDK devdock scenario ${scenario.scenarioId} aborted the upload`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
