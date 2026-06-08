import { Upload } from '../../lib.esm/node/index.js'
import {
  fail,
  loadScenario,
  scenarioBytes,
  tusUploadOptions,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

function requireRequestIdHeaderName(uploadConfig) {
  if (typeof uploadConfig.requestIdHeaderName !== 'string') {
    fail('request ID headers scenario is missing upload.requestIdHeaderName')
  }

  return uploadConfig.requestIdHeaderName
}

function observedRequestIdHeader(req, headerName) {
  const value = req.getHeader(headerName)
  if (typeof value !== 'string') {
    fail(`request ID headers scenario did not observe ${headerName} on ${req.getMethod()}`)
  }

  return value
}

async function uploadWithRequestIdHeaders(scenario, createResponse) {
  const content = scenarioBytes(scenario.upload)
  const requestIdHeaderName = requireRequestIdHeaderName(scenario.upload)
  const headersByMethod = {}

  const upload = new Upload(content, {
    ...tusUploadOptions({ content, createResponse, scenario }),
    onBeforeRequest(req) {
      const method = req.getMethod()
      if (method === 'POST' || method === 'PATCH') {
        headersByMethod[method] = {
          [requestIdHeaderName]: observedRequestIdHeader(req, requestIdHeaderName),
        }
      }
    },
  })

  await new Promise((resolve, reject) => {
    upload.options.onError = reject
    upload.options.onSuccess = resolve
    upload.start()
  })

  if (!upload.url) {
    fail('request ID headers TUS upload did not expose an upload URL')
  }

  return {
    headersByMethod,
    uploadUrl: upload.url,
  }
}

async function main() {
  const scenario = await loadScenario(import.meta.url)
  const createResponse = scenario.prepared.createResponse
  const result = await uploadWithRequestIdHeaders(scenario, createResponse)
  await writeJsonResult(result)
  console.log(
    `TypeScript TUS SDK devdock scenario ${scenario.scenarioId} observed request ID headers for ${result.uploadUrl}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
