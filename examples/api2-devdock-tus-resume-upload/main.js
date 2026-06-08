import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { FileUrlStorage } from '../../lib.esm/node/FileUrlStorage.js'
import { Upload } from '../../lib.esm/node/index.js'
import {
  chunkSizeBytes,
  fail,
  loadScenario,
  requireResumePlan,
  resolveValue,
  retryDelays,
  scalarString,
  scenarioBytes,
  uploadMetadata,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

function uploadOptions({ content, createResponse, scenario, storage }) {
  const uploadConfig = scenario.upload
  const resume = requireResumePlan(uploadConfig)
  const context = { createResponse, scenario }

  return {
    endpoint: scalarString(resolveValue(uploadConfig.tusUrl, context, 'tusUrl')),
    chunkSize: chunkSizeBytes(uploadConfig.chunkSize, content.length),
    fingerprint: async () => resume.fingerprint,
    metadata: uploadMetadata(uploadConfig, scenario, createResponse),
    removeFingerprintOnSuccess: resume.removeFingerprintOnSuccess,
    retryDelays: retryDelays(uploadConfig.retries),
    urlStorage: storage,
  }
}

async function uploadFirstChunkAndAbort({ content, createResponse, scenario, storage }) {
  const resume = requireResumePlan(scenario.upload)
  let firstUploadUrl = null
  let acceptedBytes = 0
  let upload = null

  await new Promise((resolve, reject) => {
    upload = new Upload(content, {
      ...uploadOptions({ content, createResponse, scenario, storage }),
      onChunkComplete(_chunkSize, bytesAccepted) {
        acceptedBytes = bytesAccepted
        if (bytesAccepted < resume.stopAfterAcceptedBytes) {
          return
        }

        firstUploadUrl = upload.url
        void upload.abort().then(resolve, reject)
      },
      onError: reject,
      onSuccess() {
        reject(new Error('resume scenario completed before the first upload was aborted'))
      },
    })
    upload.start()
  })

  if (!firstUploadUrl) {
    fail('resume scenario did not capture the first upload URL')
  }

  return { acceptedBytes, firstUploadUrl }
}

async function resumeStoredUpload({ content, createResponse, scenario, storage }) {
  const resume = requireResumePlan(scenario.upload)
  const upload = new Upload(content, uploadOptions({ content, createResponse, scenario, storage }))
  const previousUploads = await upload.findPreviousUploads()
  if (previousUploads.length !== resume.expectedPreviousUploadCount) {
    fail(
      `resume scenario expected ${resume.expectedPreviousUploadCount} stored upload(s), got ${previousUploads.length}`,
    )
  }

  const previousUpload = previousUploads[0]
  if (!previousUpload) {
    fail('resume scenario could not find a previous upload')
  }

  upload.resumeFromPreviousUpload(previousUpload)

  await new Promise((resolve, reject) => {
    upload.options.onError = reject
    upload.options.onSuccess = resolve
    upload.start()
  })

  if (!upload.url) {
    fail('resumed TUS upload did not expose an upload URL')
  }

  const remainingPreviousUploads = await upload.findPreviousUploads()
  if (remainingPreviousUploads.length !== resume.expectedRemainingPreviousUploadCount) {
    fail(
      `resume scenario expected ${resume.expectedRemainingPreviousUploadCount} stored upload(s) after success, got ${remainingPreviousUploads.length}`,
    )
  }

  return {
    previousUploadCount: previousUploads.length,
    remainingPreviousUploadCount: remainingPreviousUploads.length,
    storedUploadKey: previousUpload.urlStorageKey,
    uploadUrl: upload.url,
  }
}

async function uploadWithStoredResume(scenario, createResponse) {
  const content = scenarioBytes(scenario.upload)
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'api2-tus-resume-'))
  const storagePath = path.join(tempDir, 'url-storage.json')
  await writeFile(storagePath, '{}\n')

  try {
    const storage = new FileUrlStorage(storagePath)
    const firstUpload = await uploadFirstChunkAndAbort({
      content,
      createResponse,
      scenario,
      storage,
    })
    const resumedUpload = await resumeStoredUpload({ content, createResponse, scenario, storage })
    const urlStorageBackend = scenario.upload.urlStorageBackend
    const result = {
      firstAcceptedBytes: firstUpload.acceptedBytes,
      firstUploadUrl: firstUpload.firstUploadUrl,
      ...resumedUpload,
    }

    if (urlStorageBackend) {
      if (urlStorageBackend.kind !== 'file') {
        fail(`resume scenario expected file URL storage backend, got ${urlStorageBackend.kind}`)
      }

      const storageFile = JSON.parse(await readFile(storagePath, 'utf8'))
      result.storedUploadKeyPrefixMatched = resumedUpload.storedUploadKey.startsWith(
        urlStorageBackend.expectedStoredUploadKeyPrefix,
      )
      result.storageFileEntryCount = Object.keys(storageFile).length
      result.urlStorageBackend = urlStorageBackend.kind
    }

    return result
  } finally {
    await rm(tempDir, { force: true, recursive: true })
  }
}

async function main() {
  const scenario = await loadScenario(import.meta.url)
  const createResponse = scenario.prepared.createResponse
  const result = await uploadWithStoredResume(scenario, createResponse)
  await writeJsonResult(result)
  console.log(
    `TypeScript TUS SDK devdock scenario ${scenario.scenarioId} resumed ${result.uploadUrl}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
