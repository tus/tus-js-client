let isEnabled = false

export function enableDebugLog(): void {
  isEnabled = true
}

export function log(msg: string): void {
  if (!isEnabled) return
  console.log(msg)
}
