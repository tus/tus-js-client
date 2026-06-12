// This file is generated from Transloadit API2 TUS protocol contracts. If it looks wrong,
// please report the issue instead of editing this file by hand; the source fix
// belongs in the protocol contract generator so all TUS clients stay in sync.

import { DetailedError } from './DetailedError.js'
import {
  tusNextRetryAttempt,
  tusPlanRetryAfterError,
  tusShouldEvaluateRetryPolicy,
  tusShouldResetRetryAttempt,
  tusShouldTreatRequestErrorAsRetryable,
} from './protocol_generated.js'

export interface TusScheduleUploadRetryOrEmitErrorInput {
  emitError: (error: Error) => void
  error: Error
  evaluateRetryPolicy: (error: DetailedError, retryAttempt: number) => boolean
  getOffset: () => number
  getOffsetBeforeRetry: () => number
  getRetryAttempt: () => number
  isAborted: () => boolean
  retryDelays: readonly number[] | null
  scheduleRestart: (delayMs: number) => void
  setOffsetBeforeRetry: (offset: number) => void
  setRetryAttempt: (retryAttempt: number) => void
}

export function tusRetryableUploadError(error: Error): DetailedError | null {
  if (
    error instanceof DetailedError &&
    tusShouldTreatRequestErrorAsRetryable({ hasRequestContext: error.originalRequest != null })
  ) {
    return error
  }

  return null
}

export function tusEffectiveUploadRetryAttempt({
  offset,
  offsetBeforeRetry,
  retryAttempt,
}: {
  offset: number
  offsetBeforeRetry: number
  retryAttempt: number
}): number {
  return tusShouldResetRetryAttempt({ offset, offsetBeforeRetry }) ? 0 : retryAttempt
}

export function tusShouldScheduleUploadRetry({
  error,
  evaluateRetryPolicy,
  retryAttempt,
  retryDelays,
}: {
  error: Error
  evaluateRetryPolicy: (error: DetailedError, retryAttempt: number) => boolean
  retryAttempt: number
  retryDelays: readonly number[]
}): boolean {
  const retryableError = tusRetryableUploadError(error)
  let retryPlan = tusPlanRetryAfterError({
    isNetworkError: retryableError != null,
    offset: 0,
    offsetBeforeRetry: 0,
    retryAttempt,
    retryDelays,
  })

  if (
    tusShouldEvaluateRetryPolicy({
      hasRetryableError: retryableError != null,
      retryPlanAction: retryPlan.action,
    }) &&
    retryableError != null
  ) {
    retryPlan = tusPlanRetryAfterError({
      isNetworkError: true,
      offset: 0,
      offsetBeforeRetry: 0,
      retryAttempt: retryPlan.retryAttempt,
      retryDelays,
      shouldRetry: evaluateRetryPolicy(retryableError, retryPlan.retryAttempt),
    })
  }

  return retryPlan.action === 'scheduleRetry'
}

export function tusScheduleUploadRetryOrEmitError({
  emitError,
  error,
  evaluateRetryPolicy,
  getOffset,
  getOffsetBeforeRetry,
  getRetryAttempt,
  isAborted,
  retryDelays,
  scheduleRestart,
  setOffsetBeforeRetry,
  setRetryAttempt,
}: TusScheduleUploadRetryOrEmitErrorInput): void {
  const activeRetryDelays = retryDelays ?? []
  if (isAborted()) {
    return
  }

  const effectiveRetryAttempt = tusEffectiveUploadRetryAttempt({
    offset: getOffset(),
    offsetBeforeRetry: getOffsetBeforeRetry(),
    retryAttempt: getRetryAttempt(),
  })
  const scheduleRetry = tusShouldScheduleUploadRetry({
    error,
    evaluateRetryPolicy,
    retryAttempt: effectiveRetryAttempt,
    retryDelays: activeRetryDelays,
  })
  if (!scheduleRetry) {
    setRetryAttempt(effectiveRetryAttempt)
    emitError(error)
    return
  }

  setRetryAttempt(tusNextRetryAttempt({ retryAttempt: effectiveRetryAttempt }))
  setOffsetBeforeRetry(getOffset())
  scheduleRestart(activeRetryDelays[effectiveRetryAttempt])
}
