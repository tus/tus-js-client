// This file is generated from Transloadit API2 TUS protocol contracts. If it looks wrong,
// please report the issue instead of editing this file by hand; the source fix
// belongs in the protocol contract generator so all TUS clients stay in sync.

import { DetailedError } from './DetailedError.js'
import {
  tusNextRetryAttempt,
  tusPlanRetryAfterError,
  tusShouldEvaluateRetryPolicy,
  tusShouldTreatRequestErrorAsRetryable,
} from './protocol_generated.js'

export interface TusTerminateUploadWithRetryInput {
  evaluateRetryPolicy: (error: DetailedError, retryAttempt: number) => boolean
  retryDelays: readonly number[] | null
  sendTerminateRequest: (uploadUrl: string) => Promise<void>
  sleep: (delayMs: number) => Promise<unknown>
  uploadUrl: string
}

export function tusShouldScheduleTerminateRetry({
  error,
  evaluateRetryPolicy,
  retryAttempt,
  retryDelays,
}: {
  error: DetailedError
  evaluateRetryPolicy: (error: DetailedError, retryAttempt: number) => boolean
  retryAttempt: number
  retryDelays: readonly number[]
}): boolean {
  const hasRetryableError = tusShouldTreatRequestErrorAsRetryable({
    hasRequestContext: error.originalRequest != null,
  })
  let retryPlan = tusPlanRetryAfterError({
    isNetworkError: hasRetryableError,
    offset: 0,
    offsetBeforeRetry: 0,
    retryAttempt,
    retryDelays,
  })

  if (tusShouldEvaluateRetryPolicy({ hasRetryableError, retryPlanAction: retryPlan.action })) {
    retryPlan = tusPlanRetryAfterError({
      isNetworkError: true,
      offset: 0,
      offsetBeforeRetry: 0,
      retryAttempt: retryPlan.retryAttempt,
      retryDelays,
      shouldRetry: evaluateRetryPolicy(error, retryPlan.retryAttempt),
    })
  }

  return retryPlan.action === 'scheduleRetry'
}

export async function tusTerminateUploadWithRetry({
  evaluateRetryPolicy,
  retryDelays,
  sendTerminateRequest,
  sleep,
  uploadUrl,
}: TusTerminateUploadWithRetryInput): Promise<void> {
  const activeRetryDelays = retryDelays ?? []
  let retryAttempt = 0

  while (true) {
    let terminateError: DetailedError | null = null
    try {
      await sendTerminateRequest(uploadUrl)
    } catch (error) {
      if (!(error instanceof DetailedError)) {
        throw error
      }

      terminateError = error
    }
    if (terminateError == null) {
      return
    }

    const scheduleRetry = tusShouldScheduleTerminateRetry({
      error: terminateError,
      evaluateRetryPolicy,
      retryAttempt,
      retryDelays: activeRetryDelays,
    })
    if (!scheduleRetry) {
      throw terminateError
    }

    await sleep(activeRetryDelays[retryAttempt])
    retryAttempt = tusNextRetryAttempt({ retryAttempt })
  }
}
