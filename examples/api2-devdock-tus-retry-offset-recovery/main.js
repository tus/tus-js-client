import { Upload } from '../../lib.esm/node/index.js'
import {
  fail,
  loadScenario,
  requireRetryOffsetRecoveryPlan,
  scenarioBytes,
  tusUploadOptions,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

function assertRequestMethods(actual, expected) {
  if (!Array.isArray(expected)) {
    fail('retry offset recovery scenario expectedRequestMethods must be an array')
  }

  if (actual.length !== expected.length) {
    fail(
      `retry offset recovery expected request methods ${expected.join(',')}, got ${actual.join(',')}`,
    )
  }

  for (const [index, method] of expected.entries()) {
    if (actual[index] !== method) {
      fail(
        `retry offset recovery expected request method ${method} at index ${index}, got ${actual[index]}`,
      )
    }
  }
}

function readOffsetHeader(res, headerName) {
  const value = res.getHeader(headerName)
  const offset = Number(value)
  if (!Number.isInteger(offset) || offset < 0) {
    fail(`retry offset recovery expected numeric ${headerName} response header, got ${value}`)
  }

  return offset
}

async function uploadWithRetryOffsetRecovery(scenario, createResponse) {
  const retryOffsetRecovery = requireRetryOffsetRecoveryPlan(scenario.upload)
  const content = scenarioBytes(scenario.upload)
  const recoveredOffsets = []
  const requestMethods = []
  let failureCandidateCount = 0
  let simulatedFailureCount = 0

  const upload = new Upload(content, {
    ...tusUploadOptions({ content, createResponse, scenario }),
    onAfterResponse(req, res) {
      const method = req.getMethod()

      if (method === retryOffsetRecovery.recoveryResponse.method) {
        recoveredOffsets.push(
          readOffsetHeader(res, retryOffsetRecovery.recoveryResponse.offsetHeader),
        )
      }

      if (method !== retryOffsetRecovery.failAfterResponse.method) {
        return
      }

      failureCandidateCount += 1
      if (failureCandidateCount !== retryOffsetRecovery.failAfterResponse.occurrence) {
        return
      }

      simulatedFailureCount += 1
      throw new Error(retryOffsetRecovery.failAfterResponse.message)
    },
    onBeforeRequest(req) {
      requestMethods.push(req.getMethod())
    },
  })

  await new Promise((resolve, reject) => {
    upload.options.onError = reject
    upload.options.onSuccess = resolve
    upload.start()
  })

  if (!upload.url) {
    fail('retry offset recovery TUS upload did not expose an upload URL')
  }

  if (simulatedFailureCount !== retryOffsetRecovery.expectedFailureCount) {
    fail(
      `retry offset recovery expected ${retryOffsetRecovery.expectedFailureCount} simulated failure(s), got ${simulatedFailureCount}`,
    )
  }

  if (recoveredOffsets.length !== retryOffsetRecovery.expectedRecoveryRequestCount) {
    fail(
      `retry offset recovery expected ${retryOffsetRecovery.expectedRecoveryRequestCount} recovery request(s), got ${recoveredOffsets.length}`,
    )
  }

  const recoveredOffset = recoveredOffsets[0]
  if (recoveredOffset !== retryOffsetRecovery.expectedRecoveredOffset) {
    fail(
      `retry offset recovery expected recovered offset ${retryOffsetRecovery.expectedRecoveredOffset}, got ${recoveredOffset}`,
    )
  }

  assertRequestMethods(requestMethods, retryOffsetRecovery.expectedRequestMethods)

  return {
    recoveredOffsets,
    recoveryRequestCount: recoveredOffsets.length,
    requestMethods,
    simulatedFailureCount,
    uploadUrl: upload.url,
  }
}

async function main() {
  const scenario = await loadScenario(import.meta.url)
  const createResponse = scenario.prepared.createResponse
  const result = await uploadWithRetryOffsetRecovery(scenario, createResponse)
  await writeJsonResult(result)
  console.log(
    `TypeScript TUS SDK devdock scenario ${scenario.scenarioId} recovered offset for ${result.uploadUrl}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
