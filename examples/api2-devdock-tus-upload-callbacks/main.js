import { Readable } from 'node:stream'

import { Upload } from '../../lib.esm/node/index.js'
import {
  fail,
  loadScenario,
  matchUploadCallbackEventKeys,
  requireUploadCallbacksPlan,
  scenarioBytes,
  tusUploadOptions,
  uploadCallbackEventKey,
  uploadCallbackEventKeyNumber,
  uploadCallbackEventKeyTotal,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

class EventRecordingReadable extends Readable {
  #callbacks

  #content

  #events

  #sent = false

  constructor(content, callbacks, events) {
    super()
    this.#callbacks = callbacks
    this.#content = content
    this.#events = events
  }

  _read() {
    if (this.#sent) {
      this.push(null)
      return
    }

    this.#sent = true
    this.push(this.#content)
  }

  _destroy(error, callback) {
    this.#events.push(
      uploadCallbackEventKey(this.#callbacks, this.#callbacks.eventKinds.sourceClose),
    )
    callback(error)
  }
}

async function uploadWithCallbacks(scenario, createResponse) {
  const content = scenarioBytes(scenario.upload)
  const callbacks = requireUploadCallbacksPlan(scenario.upload)
  const events = []
  if (scenario.upload.chunkSize !== 'full-file') {
    fail(`unsupported chunk size policy ${JSON.stringify(scenario.upload.chunkSize)}`)
  }

  const source = new EventRecordingReadable(content, callbacks, events)
  const upload = new Upload(source, {
    ...tusUploadOptions({ content, createResponse, scenario }),
    uploadSize: content.length,
    onChunkComplete(chunkSize, bytesAccepted, bytesTotal) {
      events.push(
        uploadCallbackEventKey(
          callbacks,
          callbacks.eventKinds.chunkComplete,
          uploadCallbackEventKeyNumber(chunkSize),
          uploadCallbackEventKeyNumber(bytesAccepted),
          uploadCallbackEventKeyTotal(bytesTotal),
        ),
      )
    },
    onError: (error) => {
      throw error
    },
    onProgress(bytesSent, bytesTotal) {
      events.push(
        uploadCallbackEventKey(
          callbacks,
          callbacks.eventKinds.progress,
          uploadCallbackEventKeyNumber(bytesSent),
          uploadCallbackEventKeyTotal(bytesTotal),
        ),
      )
    },
    onSuccess() {
      events.push(uploadCallbackEventKey(callbacks, callbacks.eventKinds.success))
    },
    onUploadUrlAvailable() {
      events.push(uploadCallbackEventKey(callbacks, callbacks.eventKinds.uploadUrlAvailable))
    },
  })

  await new Promise((resolve, reject) => {
    upload.options.onError = reject
    const originalOnSuccess = upload.options.onSuccess
    upload.options.onSuccess = (payload) => {
      originalOnSuccess?.(payload)
      resolve()
    }
    upload.start()
  })

  if (!upload.url) {
    fail('upload callbacks TUS upload did not expose an upload URL')
  }

  return {
    eventKeys: matchUploadCallbackEventKeys(callbacks, events),
    rawEventKeys: events,
    uploadUrl: upload.url,
  }
}

async function main() {
  const scenario = await loadScenario(import.meta.url)
  const createResponse = scenario.prepared.createResponse
  const result = await uploadWithCallbacks(scenario, createResponse)
  await writeJsonResult(result)
  console.log(
    `TypeScript TUS SDK devdock scenario ${scenario.scenarioId} observed upload callbacks for ${result.uploadUrl}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
