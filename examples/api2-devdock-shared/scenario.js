import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  TUS_DEFAULT_CLIENT_PROTOCOL,
  tusRequestHeadersForProtocol,
} from '../../lib.esm/protocol_generated.js'

export function fail(message) {
  throw new Error(message)
}

function exampleDirname(moduleUrl) {
  return path.dirname(fileURLToPath(moduleUrl))
}

export async function loadScenario(moduleUrl) {
  const scenarioPath =
    process.env.API2_SDK_EXAMPLE_SCENARIO ??
    path.join(exampleDirname(moduleUrl), 'api2-scenario.json')

  return JSON.parse(await readFile(scenarioPath, 'utf8'))
}

export function readPath(value, pathParts, label) {
  let current = value
  for (const part of pathParts) {
    if (Array.isArray(current) && Number.isInteger(part)) {
      if (part >= current.length) {
        fail(`${label} path ${JSON.stringify(pathParts)} index ${part} is out of range`)
      }
      current = current[part]
      continue
    }

    if (
      typeof current === 'object' &&
      current !== null &&
      !Array.isArray(current) &&
      typeof part === 'string'
    ) {
      if (!Object.hasOwn(current, part)) {
        fail(`${label} path ${JSON.stringify(pathParts)} is missing key ${JSON.stringify(part)}`)
      }
      current = current[part]
      continue
    }

    fail(`${label} path ${JSON.stringify(pathParts)} cannot read ${JSON.stringify(part)}`)
  }

  return current
}

export function resolveValue(valueSpec, context, label) {
  if (Object.hasOwn(valueSpec, 'value')) {
    return valueSpec.value
  }

  const source = valueSpec.source
  if (typeof source !== 'object' || source === null || Array.isArray(source)) {
    fail(`${label} value spec has no literal value or source`)
  }

  if (!Object.hasOwn(context, source.root)) {
    fail(`${label} value source root ${JSON.stringify(source.root)} is unavailable`)
  }

  if (!Array.isArray(source.path)) {
    fail(`${label} value source path must be an array`)
  }

  return readPath(context[source.root], source.path, label)
}

export function scalarString(value) {
  if (value === null) {
    return 'null'
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  return String(value)
}

export function scenarioBytes(uploadConfig) {
  const source = uploadConfig.source
  if (source.kind !== 'bytes') {
    fail(`unsupported scenario source kind ${JSON.stringify(source.kind)}`)
  }

  if (source.encoding !== 'utf8') {
    fail(`unsupported scenario source encoding ${JSON.stringify(source.encoding)}`)
  }

  return Buffer.from(source.value, 'utf8')
}

export function uploadMetadata(uploadConfig, scenario, createResponse) {
  const context = { createResponse, scenario }
  const metadata = {}
  for (const field of uploadConfig.metadata) {
    metadata[field.name] = scalarString(resolveValue(field.value, context, field.name))
  }

  return metadata
}

export function tusUploadOptions({ content, createResponse, scenario }) {
  const uploadConfig = scenario.upload
  const context = { createResponse, scenario }
  const options = {
    endpoint: scalarString(resolveValue(uploadConfig.tusUrl, context, 'tusUrl')),
    chunkSize: chunkSizeBytes(uploadConfig.chunkSize, content.length),
    metadata: uploadMetadata(uploadConfig, scenario, createResponse),
    retryDelays: retryDelays(uploadConfig.retries),
  }

  if (uploadConfig.uploadDataDuringCreation === true) {
    options.uploadDataDuringCreation = true
  }

  return options
}

export function tusDefaultRequestHeaders() {
  return tusRequestHeadersForProtocol(TUS_DEFAULT_CLIENT_PROTOCOL)
}

export function retryDelays(retries) {
  if (!Number.isInteger(retries) || retries < 0) {
    fail(`unsupported retry count ${JSON.stringify(retries)}`)
  }

  return Array.from({ length: retries }, () => 0)
}

export function chunkSizeBytes(chunkSize, contentLength) {
  if (chunkSize === 'full-file') {
    return contentLength
  }

  if (
    typeof chunkSize === 'object' &&
    chunkSize !== null &&
    !Array.isArray(chunkSize) &&
    chunkSize.kind === 'fixed-bytes' &&
    Number.isInteger(chunkSize.bytes) &&
    chunkSize.bytes > 0
  ) {
    return chunkSize.bytes
  }

  fail(`unsupported chunk size policy ${JSON.stringify(chunkSize)}`)
}

export function requireResumePlan(uploadConfig) {
  const resume = uploadConfig.resume
  if (typeof resume !== 'object' || resume === null || Array.isArray(resume)) {
    fail('scenario upload is missing a resume plan')
  }

  return resume
}

export function requireRetryOffsetRecoveryPlan(uploadConfig) {
  const retryOffsetRecovery = uploadConfig.retryOffsetRecovery
  if (
    typeof retryOffsetRecovery !== 'object' ||
    retryOffsetRecovery === null ||
    Array.isArray(retryOffsetRecovery)
  ) {
    fail('scenario upload is missing a retry offset recovery plan')
  }

  return retryOffsetRecovery
}

export function requireTerminationPlan(uploadConfig) {
  const termination = uploadConfig.termination
  if (typeof termination !== 'object' || termination === null || Array.isArray(termination)) {
    fail('scenario upload is missing a termination plan')
  }

  return termination
}

export async function writeJsonResult(result) {
  const resultPath = process.env.API2_SDK_EXAMPLE_RESULT
  if (!resultPath) {
    return
  }

  await writeFile(resultPath, `${JSON.stringify(result, undefined, 2)}\n`)
}
