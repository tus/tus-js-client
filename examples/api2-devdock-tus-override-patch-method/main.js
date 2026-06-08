import { Upload } from '../../lib.esm/node/index.js'
import {
  fail,
  loadScenario,
  requireTusConformanceScenario,
  TusConformanceHttpStack,
  tusConformanceInputOptions,
  tusConformanceUploadInput,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

async function uploadWithOverridePatchMethod(conformanceScenario) {
  const inputOptions = tusConformanceInputOptions(conformanceScenario)
  const content = tusConformanceUploadInput(conformanceScenario)
  const httpStack = new TusConformanceHttpStack(conformanceScenario)
  const upload = new Upload(content, {
    endpoint: inputOptions.endpointUrl,
    httpStack,
    overridePatchMethod: inputOptions.overridePatchMethod,
    uploadUrl: inputOptions.uploadUrl,
  })

  await new Promise((resolve, reject) => {
    upload.options.onError = reject
    upload.options.onSuccess = resolve
    upload.start()
  })

  if (!upload.url) {
    fail('override PATCH scenario did not expose an upload URL')
  }

  if (httpStack.nextRequestIndex !== conformanceScenario.requests.length) {
    fail(
      `override PATCH scenario expected ${conformanceScenario.requests.length} request(s), got ${httpStack.nextRequestIndex}`,
    )
  }

  return {
    requestHeaders: httpStack.observed.requestHeaders,
    requestMethods: httpStack.observed.requestMethods,
    requestUrls: httpStack.observed.requestUrls,
    uploadUrl: upload.url,
  }
}

async function main() {
  const scenario = await loadScenario(import.meta.url)
  const conformanceScenario = requireTusConformanceScenario(scenario)
  const result = await uploadWithOverridePatchMethod(conformanceScenario)
  await writeJsonResult(result)
  console.log(
    `TypeScript TUS SDK devdock scenario ${scenario.scenarioId} overrode PATCH for ${result.uploadUrl}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
