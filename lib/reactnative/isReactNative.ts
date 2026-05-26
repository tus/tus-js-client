// This file is generated from Transloadit API2 TUS protocol contracts. If it looks wrong,
// please report the issue instead of editing this file by hand; the source fix
// belongs in the protocol contract generator so all TUS clients stay in sync.

import type { ReactNativeFile } from '../options.js'

export function isReactNativePlatform() {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.product === 'string' &&
    navigator.product.toLowerCase() === 'reactnative'
  )
}

export function isReactNativeFile(input: unknown): input is ReactNativeFile {
  return (
    input != null && typeof input === 'object' && 'uri' in input && typeof input.uri === 'string'
  )
}
