import { Upload } from '../../lib.esm/node/index.js'
import {
  fail,
  loadScenario,
  scenarioBytes,
  tusUploadOptions,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

function requireBodyHeadersByMethod(uploadConfig) {
  if (
    typeof uploadConfig.bodyHeadersByMethod !== 'object' ||
    uploadConfig.bodyHeadersByMethod === null ||
    Array.isArray(uploadConfig.bodyHeadersByMethod)
  ) {
    fail('upload body headers scenario is missing upload.bodyHeadersByMethod')
  }

  return uploadConfig.bodyHeadersByMethod
}

function bodyHeaderNames(bodyHeadersByMethod) {
  const headerNames = new Set()
  for (const headers of Object.values(bodyHeadersByMethod)) {
    if (typeof headers !== 'object' || headers === null || Array.isArray(headers)) {
      fail('upload body headers scenario contains invalid method headers')
    }

    for (const headerName of Object.keys(headers)) {
      headerNames.add(headerName)
    }
  }

  return Array.from(headerNames)
}

function observedBodyHeaders(req, headerNames) {
  const headers = {}
  for (const headerName of headerNames) {
    const value = req.getHeader(headerName)
    if (typeof value === 'string') {
      headers[headerName] = value
    }
  }

  return headers
}

async function uploadWithBodyHeaders(scenario, createResponse) {
  const content = scenarioBytes(scenario.upload)
  const expectedHeadersByMethod = requireBodyHeadersByMethod(scenario.upload)
  const headerNames = bodyHeaderNames(expectedHeadersByMethod)
  const bodyHeadersByMethod = {}

  const upload = new Upload(content, {
    ...tusUploadOptions({ content, createResponse, scenario }),
    onBeforeRequest(req) {
      const method = req.getMethod()
      if (method === 'POST' || method === 'PATCH') {
        bodyHeadersByMethod[method] = observedBodyHeaders(req, headerNames)
      }
    },
  })

  await new Promise((resolve, reject) => {
    upload.options.onError = reject
    upload.options.onSuccess = resolve
    upload.start()
  })

  if (!upload.url) {
    fail('upload body headers TUS upload did not expose an upload URL')
  }

  for (const method of Object.keys(expectedHeadersByMethod)) {
    if (!Object.hasOwn(bodyHeadersByMethod, method)) {
      fail(`upload body headers scenario did not observe ${method} request`)
    }
  }

  return {
    bodyHeadersByMethod,
    uploadUrl: upload.url,
  }
}

async function main() {
  const scenario = await loadScenario(import.meta.url)
  const createResponse = scenario.prepared.createResponse
  const result = await uploadWithBodyHeaders(scenario, createResponse)
  await writeJsonResult(result)
  console.log(
    `TypeScript TUS SDK devdock scenario ${scenario.scenarioId} observed upload body headers for ${result.uploadUrl}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
