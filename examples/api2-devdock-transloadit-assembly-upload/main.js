import { Upload } from '../../lib.esm/node/index.js'
import {
  chunkSizeBytes,
  fail,
  loadScenario,
  resolveValue,
  retryDelays,
  scalarString,
  scenarioBytes,
  uploadMetadata,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

async function uploadWithTus(scenario, createResponse) {
  const uploadConfig = scenario.upload
  const context = { createResponse, scenario }
  const endpoint = scalarString(resolveValue(uploadConfig.tusUrl, context, 'tusUrl'))
  const content = scenarioBytes(uploadConfig)

  const upload = new Upload(content, {
    endpoint,
    chunkSize: chunkSizeBytes(uploadConfig.chunkSize, content.length),
    metadata: uploadMetadata(uploadConfig, scenario, createResponse),
    retryDelays: retryDelays(uploadConfig.retries),
  })

  await new Promise((resolve, reject) => {
    upload.options.onError = reject
    upload.options.onSuccess = resolve
    upload.start()
  })

  if (!upload.url) {
    fail('TUS upload did not expose an upload URL')
  }

  return upload.url
}

async function main() {
  const scenario = await loadScenario(import.meta.url)
  const createResponse = scenario.prepared.createResponse
  const uploadUrl = await uploadWithTus(scenario, createResponse)
  await writeJsonResult({ uploadUrl })
  console.log(`TypeScript TUS SDK devdock scenario ${scenario.scenarioId} uploaded to ${uploadUrl}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
