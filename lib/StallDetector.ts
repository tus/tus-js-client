import { log } from './logger.js'
import type { StallDetectionOptions } from './options.js'
import type { HttpStack } from './options.js'

export class StallDetector {
  private options: StallDetectionOptions
  private httpStack: HttpStack
  private onStallDetected: (reason: string) => void

  private intervalId: ReturnType<typeof setInterval> | null = null
  private lastProgressTime = 0
  private isActive = false
  private isPaused = false

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

    // Only enable stall detection if the HTTP stack supports progress events
    if (!this._supportsProgressEvents()) {
      log(
        'Stall detection disabled: HTTP stack does not support progress events. Consider using chunkSize with appropriate timeouts instead.',
      )
      return
    }

    this.lastProgressTime = Date.now()
    this.isActive = true

    log(
      `Starting stall detection with checkInterval: ${this.options.checkInterval}ms, stallTimeout: ${this.options.stallTimeout}ms`,
    )

    // Setup periodic check
    this.intervalId = setInterval(() => {
      if (!this.isActive || this.isPaused) {
        return
      }

      const now = Date.now()
      if (this._isProgressStalled(now)) {
        this._handleStall('No progress events received')
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
   */
  updateProgress(): void {
    this.lastProgressTime = Date.now()
  }

  /**
   * Pause stall detection temporarily (e.g., during onBeforeRequest callback)
   */
  pause(): void {
    this.isActive = false
    this.isPaused = true
  }

  /**
   * Resume stall detection after pause
   */
  resume(): void {
    if (this.isPaused) {
      this.isPaused = false
      this.isActive = true
      // Reset the last progress time to avoid false positives
      this.lastProgressTime = Date.now()
    }
  }

  /**
   * Detect if current HttpStack supports progress events
   */
  private _supportsProgressEvents(): boolean {
    // Check if the HTTP stack explicitly declares support for progress events
    return (
      typeof this.httpStack.supportsProgressEvents === 'function' &&
      this.httpStack.supportsProgressEvents()
    )
  }

  /**
   * Check if upload has stalled based on progress events
   */
  private _isProgressStalled(now: number): boolean {
    const timeSinceProgress = now - this.lastProgressTime
    const stallTimeout = this.options.stallTimeout
    const isStalled = timeSinceProgress > stallTimeout

    if (isStalled) {
      log(`No progress for ${timeSinceProgress}ms (limit: ${stallTimeout}ms)`)
    }

    return isStalled
  }

  /**
   * Handle a detected stall
   */
  private _handleStall(reason: string): void {
    log(`Upload stalled: ${reason}`)
    this.stop()
    this.onStallDetected(reason)
  }
}
