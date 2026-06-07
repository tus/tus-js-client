import { Upload } from '../../lib.esm/node/index.js'
import { TUS_HEADERS } from '../../lib.esm/protocol_generated.js'
import {
  fail,
  loadScenario,
  scenarioBytes,
  tusUploadOptions,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

function observedHeader(req, headerName) {
  const value = req.getHeader(headerName)
  return typeof value === 'string' ? value : undefined
}

function assertObservedHeader(headersByMethod, method, headerName, expectedValue) {
  const actualValue = headersByMethod[method]?.[headerName]
  if (actualValue !== expectedValue) {
    fail(
      `deferred-length scenario expected ${method} ${headerName}=${expectedValue}, got ${actualValue}`,
    )
  }
}

async function uploadWithDeferredLength(scenario, createResponse) {
  if (scenario.upload.uploadLengthDeferred !== true) {
    fail('deferred-length scenario must set uploadLengthDeferred')
  }

  const content = scenarioBytes(scenario.upload)
  const headersByMethod = {}
  const upload = new Upload(content, {
    ...tusUploadOptions({ content, createResponse, scenario }),
    onBeforeRequest(req) {
      const method = req.getMethod()
      if (method !== 'POST' && method !== 'PATCH') {
        return
      }

      headersByMethod[method] = {
        [TUS_HEADERS.UPLOAD_DEFER_LENGTH]: observedHeader(req, TUS_HEADERS.UPLOAD_DEFER_LENGTH),
        [TUS_HEADERS.UPLOAD_LENGTH]: observedHeader(req, TUS_HEADERS.UPLOAD_LENGTH),
      }
    },
  })

  await new Promise((resolve, reject) => {
    upload.options.onError = reject
    upload.options.onSuccess = resolve
    upload.start()
  })

  if (!upload.url) {
    fail('deferred-length TUS upload did not expose an upload URL')
  }

  assertObservedHeader(headersByMethod, 'POST', TUS_HEADERS.UPLOAD_DEFER_LENGTH, '1')
  assertObservedHeader(headersByMethod, 'PATCH', TUS_HEADERS.UPLOAD_LENGTH, String(content.length))

  return {
    headersByMethod,
    uploadUrl: upload.url,
  }
}

async function main() {
  const scenario = await loadScenario(import.meta.url)
  const createResponse = scenario.prepared.createResponse
  const result = await uploadWithDeferredLength(scenario, createResponse)
  await writeJsonResult(result)
  console.log(
    `TypeScript TUS SDK devdock scenario ${scenario.scenarioId} deferred length for ${result.uploadUrl}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
