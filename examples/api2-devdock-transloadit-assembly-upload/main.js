import { Upload } from '../../lib.esm/node/index.js'
import {
  fail,
  loadScenario,
  scenarioBytes,
  tusUploadOptions,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

async function uploadWithTus(scenario, createResponse) {
  const content = scenarioBytes(scenario.upload)

  const upload = new Upload(content, tusUploadOptions({ content, createResponse, scenario }))

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
