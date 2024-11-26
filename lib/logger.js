let isEnabled = false

export function enableDebugLog() {
  isEnabled = true
}

export function log(msg) {
  if (!isEnabled) return
  console.log(msg)
}
