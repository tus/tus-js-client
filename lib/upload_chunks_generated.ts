// This file is generated from Transloadit API2 TUS protocol contracts. If it looks wrong,
// please report the issue instead of editing this file by hand; the source fix
// belongs in the protocol contract generator so all TUS clients stay in sync.

import { tusUploadIsCompleteAfterChunk } from './protocol_generated.js'

export interface TusUploadChunksUntilCompleteInput<Exchange> {
  applyChunkResponse: (exchange: Exchange) => number
  emitChunkComplete: (chunkSize: number, offset: number) => void
  emitProgressAfterChunkAccepted: (offset: number) => void
  emitSuccess: (exchange: Exchange) => Promise<void>
  getOffset: () => number
  getSize: () => number | null
  isAborted: () => boolean
  pendingExchange: Exchange | null
  performPatchRequest: () => Promise<Exchange>
}

export async function tusUploadChunksUntilComplete<Exchange>({
  applyChunkResponse,
  emitChunkComplete,
  emitProgressAfterChunkAccepted,
  emitSuccess,
  getOffset,
  getSize,
  isAborted,
  pendingExchange,
  performPatchRequest,
}: TusUploadChunksUntilCompleteInput<Exchange>): Promise<void> {
  let exchange = pendingExchange

  while (true) {
    if (exchange != null) {
      const acceptedBytes = applyChunkResponse(exchange)
      emitProgressAfterChunkAccepted(getOffset())
      emitChunkComplete(acceptedBytes, getOffset())
      if (tusUploadIsCompleteAfterChunk({ offset: getOffset(), size: getSize() })) {
        await emitSuccess(exchange)
        return
      }
    }

    if (isAborted()) {
      return
    }

    let patchError: Error | null = null
    try {
      exchange = await performPatchRequest()
    } catch (error) {
      if (isAborted()) {
        return
      }

      if (!(error instanceof Error)) {
        throw error
      }

      patchError = error
    }
    if (patchError != null) {
      throw patchError
    }
  }
}
