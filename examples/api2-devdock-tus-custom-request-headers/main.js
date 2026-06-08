import { Upload } from '../../lib.esm/node/index.js'
import {
  fail,
  loadScenario,
  scenarioBytes,
  tusUploadOptions,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

function requireUploadHeaders(uploadConfig) {
  if (
    typeof uploadConfig.headers !== 'object' ||
    uploadConfig.headers === null ||
    Array.isArray(uploadConfig.headers)
  ) {
    fail('custom request headers scenario is missing upload.headers')
  }

  return uploadConfig.headers
}

function observedCustomHeaders(req, expectedHeaders) {
  const headers = {}
  for (const headerName of Object.keys(expectedHeaders)) {
    const value = req.getHeader(headerName)
    if (typeof value !== 'string') {
      fail(`custom request headers scenario did not observe ${headerName} on ${req.getMethod()}`)
    }

    headers[headerName] = value
  }

  return headers
}

async function uploadWithCustomHeaders(scenario, createResponse) {
  const content = scenarioBytes(scenario.upload)
  const expectedHeaders = requireUploadHeaders(scenario.upload)
  const headersByMethod = {}

  const upload = new Upload(content, {
    ...tusUploadOptions({ content, createResponse, scenario }),
    onBeforeRequest(req) {
      const method = req.getMethod()
      if (method === 'POST' || method === 'PATCH') {
        headersByMethod[method] = observedCustomHeaders(req, expectedHeaders)
      }
    },
  })

  await new Promise((resolve, reject) => {
    upload.options.onError = reject
    upload.options.onSuccess = resolve
    upload.start()
  })

  if (!upload.url) {
    fail('custom request headers TUS upload did not expose an upload URL')
  }

  return {
    headersByMethod,
    uploadUrl: upload.url,
  }
}

async function main() {
  const scenario = await loadScenario(import.meta.url)
  const createResponse = scenario.prepared.createResponse
  const result = await uploadWithCustomHeaders(scenario, createResponse)
  await writeJsonResult(result)
  console.log(
    `TypeScript TUS SDK devdock scenario ${scenario.scenarioId} observed custom request headers for ${result.uploadUrl}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
