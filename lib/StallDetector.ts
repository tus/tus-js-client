import { log } from './logger.js'
import type { StallDetectionOptions } from './options.js'
import type { HttpStack } from './options.js'

export class StallDetector {
  private options: StallDetectionOptions
  private httpStack: HttpStack
  private onStallDetected: (reason: string) => void

  private intervalId: ReturnType<typeof setInterval> | null = null
  private lastProgressTime = 0
  private lastProgressValue = 0
  private progressValueCount = 0
  private isActive = false

  constructor(
    options: StallDetectionOptions,
    httpStack: HttpStack,
    onStallDetected: (reason: string) => void,
  ) {
    this.options = options
    this.httpStack = httpStack
    this.onStallDetected = onStallDetected
  }

  /**
   * Start monitoring for stalls
   */
  start() {
    if (this.intervalId) {
      return // Already started
    }

    this.lastProgressTime = Date.now()
    this.lastProgressValue = 0
    this.progressValueCount = 0
    this.isActive = true

    log(
      `tus: starting stall detection with checkInterval: ${this.options.checkInterval}ms, stallTimeout: ${this.options.stallTimeout}ms`,
    )

    // Setup periodic check
    this.intervalId = setInterval(() => {
      if (!this.isActive) {
        return
      }

      const now = Date.now()
      if (this._isProgressValueStalled()) {
        this._handleStall('progress value not changing')
      } else if (this._isProgressStalled(now)) {
        this._handleStall('no progress events received')
      }
    }, this.options.checkInterval)
  }

  /**
   * Stop monitoring for stalls
   */
  stop(): void {
    this.isActive = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Update progress information
   * @param progressValue The current progress value (bytes uploaded)
   */
  updateProgress(progressValue: number): void {
    this.lastProgressTime = Date.now()

    // Track if the progress value has changed
    if (progressValue === this.lastProgressValue) {
      this.progressValueCount++
    } else {
      this.lastProgressValue = progressValue
      this.progressValueCount = 0
    }
  }

  /**
   * Check if upload has stalled based on progress events
   */
  private _isProgressStalled(now: number): boolean {
    const timeSinceProgress = now - this.lastProgressTime
    const stallTimeout = this.options.stallTimeout
    const isStalled = timeSinceProgress > stallTimeout

    if (isStalled) {
      log(`tus: no progress for ${timeSinceProgress}ms (limit: ${stallTimeout}ms)`)
    }

    return isStalled
  }

  /**
   * Check if upload has stalled based on progress value not changing
   */
  private _isProgressValueStalled(): boolean {
    // Calculate how many times we expect progress to have changed based on check intervals
    const expectedProgressChanges = Math.floor(
      this.options.stallTimeout / this.options.checkInterval,
    )
    const isStalled = this.progressValueCount >= expectedProgressChanges

    if (isStalled) {
      log(
        `tus: progress value stuck at ${this.lastProgressValue} bytes for ${this.progressValueCount} checks`,
      )
    }

    return isStalled
  }

  /**
   * Handle a detected stall
   */
  private _handleStall(reason: string): void {
    log(`tus: upload stalled: ${reason}`)
    this.stop()
    this.onStallDetected(reason)
  }
}
