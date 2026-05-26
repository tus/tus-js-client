// This file is generated from Transloadit API2 TUS protocol contracts. If it looks wrong,
// please report the issue instead of editing this file by hand; the source fix
// belongs in the protocol contract generator so all TUS clients stay in sync.

let isEnabled = false

// TODO: Replace this global state with an option for the Upload class
export function enableDebugLog(): void {
  isEnabled = true
}

export function log(msg: string): void {
  if (!isEnabled) return
  console.log(msg)
}
