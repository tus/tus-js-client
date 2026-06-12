// This file is generated from Transloadit API2 TUS protocol contracts. If it looks wrong,
// please report the issue instead of editing this file by hand; the source fix
// belongs in the protocol contract generator so all TUS clients stay in sync.

import { tusPlanUploadCompletionAfterOffset } from './protocol_generated.js'

export interface TusPrepareAndStartUploadInput {
  computeFingerprint: () => Promise<void>
  createUpload: () => Promise<void>
  hasSource: () => boolean
  openSource: () => Promise<void>
  prepareUploadSize: () => void
  resetAborted: () => void
  resolveStartMode: () => boolean
  resumeUpload: () => Promise<void>
  shouldUploadInParallel: () => boolean
  startParallelUpload: () => Promise<void>
}

export async function tusPrepareAndStartUpload({
  computeFingerprint,
  createUpload,
  hasSource,
  openSource,
  prepareUploadSize,
  resetAborted,
  resolveStartMode,
  resumeUpload,
  shouldUploadInParallel,
  startParallelUpload,
}: TusPrepareAndStartUploadInput): Promise<void> {
  await computeFingerprint()
  if (!hasSource()) {
    await openSource()
  }

  prepareUploadSize()
  if (shouldUploadInParallel()) {
    await startParallelUpload()
    return
  }

  resetAborted()
  const shouldResume = resolveStartMode()
  if (shouldResume) {
    await resumeUpload()
    return
  }

  await createUpload()
}

export interface TusCreateUploadFlowInput<Exchange> {
  applyCreationResponse: (exchange: Exchange) => boolean
  emitSuccess: (exchange: Exchange) => Promise<void>
  emitUploadUrlAvailable: () => Promise<void>
  performCreationRequest: () => Promise<Exchange>
  saveUploadInUrlStorage: () => Promise<void>
  setOffset: (offset: number) => void
  uploadChunks: (pendingExchange: Exchange | null) => Promise<void>
  uploadDataDuringCreation: boolean
}

export async function tusCreateUploadFlow<Exchange>({
  applyCreationResponse,
  emitSuccess,
  emitUploadUrlAvailable,
  performCreationRequest,
  saveUploadInUrlStorage,
  setOffset,
  uploadChunks,
  uploadDataDuringCreation,
}: TusCreateUploadFlowInput<Exchange>): Promise<void> {
  const exchange = await performCreationRequest()
  const creationComplete = applyCreationResponse(exchange)
  await emitUploadUrlAvailable()
  if (creationComplete) {
    await emitSuccess(exchange)
    return
  }

  await saveUploadInUrlStorage()
  if (uploadDataDuringCreation) {
    await uploadChunks(exchange)
    return
  }

  setOffset(0)
  await uploadChunks(null)
}

export interface TusResumeUploadFlowInput<Exchange> {
  applyResumeOffset: (exchange: Exchange) => number
  clearUploadUrl: () => void
  createUpload: () => Promise<void>
  emitProgressAfterResumeAlreadyComplete: (length: number) => void
  emitSuccess: (exchange: Exchange) => Promise<void>
  emitUploadUrlAvailable: () => Promise<void>
  performHeadRequest: () => Promise<Exchange>
  readUploadLength: (exchange: Exchange) => number | null
  saveUploadInUrlStorage: () => Promise<void>
  setOffset: (offset: number) => void
  settleResumeStatus: (exchange: Exchange) => Promise<boolean>
  uploadChunks: (pendingExchange: Exchange | null) => Promise<void>
}

export async function tusResumeUploadFlow<Exchange>({
  applyResumeOffset,
  clearUploadUrl,
  createUpload,
  emitProgressAfterResumeAlreadyComplete,
  emitSuccess,
  emitUploadUrlAvailable,
  performHeadRequest,
  readUploadLength,
  saveUploadInUrlStorage,
  setOffset,
  settleResumeStatus,
  uploadChunks,
}: TusResumeUploadFlowInput<Exchange>): Promise<void> {
  const exchange = await performHeadRequest()
  const shouldCreateNewUpload = await settleResumeStatus(exchange)
  if (shouldCreateNewUpload) {
    clearUploadUrl()
    await createUpload()
    return
  }

  const offset = applyResumeOffset(exchange)
  const length = readUploadLength(exchange)
  await emitUploadUrlAvailable()
  await saveUploadInUrlStorage()
  const uploadCompletion = tusPlanUploadCompletionAfterOffset({ length, offset })
  if (uploadCompletion.complete) {
    emitProgressAfterResumeAlreadyComplete(uploadCompletion.length)
    await emitSuccess(exchange)
    return
  }

  setOffset(offset)
  await uploadChunks(null)
}
