import { Upload } from '../../lib.esm/node/index.js'
import {
  fail,
  loadScenario,
  requireTerminationPlan,
  scenarioBytes,
  tusDefaultRequestHeaders,
  tusUploadOptions,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

function countRequests(methods, method) {
  return methods.filter((candidate) => candidate === method).length
}

async function verifyTerminatedUpload({ termination, uploadUrl }) {
  const response = await fetch(uploadUrl, {
    headers: tusDefaultRequestHeaders(),
    method: termination.verificationMethod,
  })

  return response.status
}

async function uploadAndTerminate(scenario, createResponse) {
  const termination = requireTerminationPlan(scenario.upload)
  const content = scenarioBytes(scenario.upload)
  const requestMethods = []
  let acceptedBytes = 0
  let upload = null
  let uploadUrl = null

  await new Promise((resolve, reject) => {
    upload = new Upload(content, {
      ...tusUploadOptions({ content, createResponse, scenario }),
      onBeforeRequest(req) {
        requestMethods.push(req.getMethod())
      },
      onChunkComplete(_chunkSize, bytesAccepted) {
        acceptedBytes = bytesAccepted
        if (bytesAccepted < termination.stopAfterAcceptedBytes) {
          return
        }

        uploadUrl = upload.url
        void upload.abort(true).then(resolve, reject)
      },
      onError: reject,
      onSuccess() {
        reject(new Error('termination scenario completed before abort(true) terminated the upload'))
      },
    })
    upload.start()
  })

  if (!uploadUrl) {
    fail('termination scenario did not capture the upload URL before abort(true)')
  }

  requestMethods.push(termination.verificationMethod)
  const verificationStatus = await verifyTerminatedUpload({ termination, uploadUrl })

  return {
    acceptedBytes,
    deleteRequestCount: countRequests(requestMethods, 'DELETE'),
    requestMethods,
    terminated: true,
    uploadUrl,
    verificationStatus,
  }
}

async function main() {
  const scenario = await loadScenario(import.meta.url)
  const createResponse = scenario.prepared.createResponse
  const result = await uploadAndTerminate(scenario, createResponse)
  await writeJsonResult(result)
  console.log(
    `TypeScript TUS SDK devdock scenario ${scenario.scenarioId} terminated ${result.uploadUrl}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
