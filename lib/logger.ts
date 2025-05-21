let isEnabled = false

// TODO: Replace this global state with an option for the Upload class
export function enableDebugLog(): void {
  isEnabled = true
}

export function log(msg: string): void {
  if (!isEnabled) return
  console.log(msg)
}
