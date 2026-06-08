import { Upload } from '../../lib.esm/node/index.js'
import {
  fail,
  loadScenario,
  requireRequestLifecycleHooksPlan,
  scenarioBytes,
  tusUploadOptions,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

function assertArrayEquals(label, actual, expected) {
  if (!Array.isArray(expected)) {
    fail(`request lifecycle hooks scenario expected ${label} must be an array`)
  }

  if (actual.length !== expected.length) {
    fail(
      `request lifecycle hooks expected ${label} ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    )
  }

  for (const [index, value] of expected.entries()) {
    if (actual[index] !== value) {
      fail(
        `request lifecycle hooks expected ${label} value ${JSON.stringify(value)} at index ${index}, got ${JSON.stringify(actual[index])}`,
      )
    }
  }
}

function shouldCaptureMethod(method, ignoredMethods) {
  return !ignoredMethods.includes(method)
}

async function uploadWithRequestLifecycleHooks(scenario, createResponse) {
  const content = scenarioBytes(scenario.upload)
  const requestLifecycleHooks = requireRequestLifecycleHooksPlan(scenario.upload)
  const ignoredMethods = requestLifecycleHooks.ignoredRequestMethods
  const afterResponseMethods = []
  const afterResponseStatusCodes = []
  const beforeRequestMethods = []

  if (!Array.isArray(ignoredMethods)) {
    fail('request lifecycle hooks scenario ignoredRequestMethods must be an array')
  }

  const upload = new Upload(content, {
    ...tusUploadOptions({ content, createResponse, scenario }),
    onAfterResponse(req, res) {
      const method = req.getMethod()
      if (!shouldCaptureMethod(method, ignoredMethods)) {
        return
      }

      afterResponseMethods.push(method)
      afterResponseStatusCodes.push(res.getStatus())
    },
    onBeforeRequest(req) {
      const method = req.getMethod()
      if (!shouldCaptureMethod(method, ignoredMethods)) {
        return
      }

      beforeRequestMethods.push(method)
    },
  })

  await new Promise((resolve, reject) => {
    upload.options.onError = reject
    upload.options.onSuccess = resolve
    upload.start()
  })

  if (!upload.url) {
    fail('request lifecycle hooks TUS upload did not expose an upload URL')
  }

  assertArrayEquals(
    'beforeRequestMethods',
    beforeRequestMethods,
    requestLifecycleHooks.expectedBeforeRequestMethods,
  )
  assertArrayEquals(
    'afterResponseMethods',
    afterResponseMethods,
    requestLifecycleHooks.expectedAfterResponseMethods,
  )
  assertArrayEquals(
    'afterResponseStatusCodes',
    afterResponseStatusCodes,
    requestLifecycleHooks.expectedAfterResponseStatusCodes,
  )

  return {
    afterResponseMethods,
    afterResponseStatusCodes,
    beforeRequestMethods,
    uploadUrl: upload.url,
  }
}

async function main() {
  const scenario = await loadScenario(import.meta.url)
  const createResponse = scenario.prepared.createResponse
  const result = await uploadWithRequestLifecycleHooks(scenario, createResponse)
  await writeJsonResult(result)
  console.log(
    `TypeScript TUS SDK devdock scenario ${scenario.scenarioId} observed request lifecycle hooks for ${result.uploadUrl}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
