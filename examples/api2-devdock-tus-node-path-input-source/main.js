import { defaultOptions, Upload } from '../../lib.esm/node/index.js'
import {
  fail,
  loadScenario,
  requireTusConformanceScenario,
  TusConformanceHttpStack,
  tusConformanceEventRecordingFileReader,
  tusConformanceInputOptions,
  tusConformanceScenarioWantsEvent,
  tusConformanceUploadInput,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

async function uploadWithNodePathInputSource(conformanceScenario) {
  const inputOptions = tusConformanceInputOptions(conformanceScenario)
  const content = await tusConformanceUploadInput(conformanceScenario)
  const events = []
  const httpStack = new TusConformanceHttpStack(conformanceScenario)
  const options = {
    endpoint: inputOptions.endpointUrl,
    fileReader: tusConformanceEventRecordingFileReader({
      conformanceScenario,
      events,
      fileReader: defaultOptions.fileReader,
    }),
    httpStack,
    metadata: inputOptions.metadata,
  }

  if (inputOptions.chunkSize !== undefined) {
    options.chunkSize = inputOptions.chunkSize
  }

  if (inputOptions.uploadLengthDeferred !== undefined) {
    options.uploadLengthDeferred = inputOptions.uploadLengthDeferred
  }

  const upload = new Upload(content, options)

  await new Promise((resolve, reject) => {
    upload.options.onError = reject
    upload.options.onSuccess = (payload) => {
      if (tusConformanceScenarioWantsEvent(conformanceScenario, 'success')) {
        events.push({ kind: 'success' })
      }
      resolve(payload)
    }
    upload.start()
  })

  if (!upload.url) {
    fail('node path input source scenario did not expose an upload URL')
  }

  if (httpStack.nextRequestIndex !== conformanceScenario.requests.length) {
    fail(
      `node path input source scenario expected ${conformanceScenario.requests.length} request(s), got ${httpStack.nextRequestIndex}`,
    )
  }

  return {
    events,
    requestMethods: httpStack.observed.requestMethods,
    requestUrls: httpStack.observed.requestUrls,
    uploadUrl: upload.url,
  }
}

async function main() {
  const scenario = await loadScenario(import.meta.url)
  const conformanceScenario = requireTusConformanceScenario(scenario)
  const result = await uploadWithNodePathInputSource(conformanceScenario)
  await writeJsonResult(result)
  console.log(
    `TypeScript TUS SDK devdock scenario ${scenario.scenarioId} read ${conformanceScenario.inputSource.kind} for ${result.uploadUrl}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
