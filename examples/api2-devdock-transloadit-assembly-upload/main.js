import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Upload } from '../../lib.esm/node/index.js'

function fail(message) {
  throw new Error(message)
}

function exampleDirname() {
  return path.dirname(fileURLToPath(import.meta.url))
}

async function loadScenario() {
  const scenarioPath =
    process.env.API2_SDK_EXAMPLE_SCENARIO ?? path.join(exampleDirname(), 'api2-scenario.json')

  return JSON.parse(await readFile(scenarioPath, 'utf8'))
}

function readPath(value, pathParts, label) {
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

function resolveValue(valueSpec, context, label) {
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

function scalarString(value) {
  if (value === null) {
    return 'null'
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  return String(value)
}

function scenarioBytes(uploadConfig) {
  const source = uploadConfig.source
  if (source.kind !== 'bytes') {
    fail(`unsupported scenario source kind ${JSON.stringify(source.kind)}`)
  }

  if (source.encoding !== 'utf8') {
    fail(`unsupported scenario source encoding ${JSON.stringify(source.encoding)}`)
  }

  return Buffer.from(source.value, 'utf8')
}

function uploadMetadata(uploadConfig, scenario, createResponse) {
  const context = { createResponse, scenario }
  const metadata = {}
  for (const field of uploadConfig.metadata) {
    metadata[field.name] = scalarString(resolveValue(field.value, context, field.name))
  }

  return metadata
}

function retryDelays(retries) {
  if (!Number.isInteger(retries) || retries < 0) {
    fail(`unsupported retry count ${JSON.stringify(retries)}`)
  }

  return Array.from({ length: retries }, () => 0)
}

async function uploadWithTus(scenario, createResponse) {
  const uploadConfig = scenario.upload
  const context = { createResponse, scenario }
  const endpoint = scalarString(resolveValue(uploadConfig.tusUrl, context, 'tusUrl'))
  const content = scenarioBytes(uploadConfig)
  if (uploadConfig.chunkSize !== 'full-file') {
    fail(`unsupported chunk size policy ${JSON.stringify(uploadConfig.chunkSize)}`)
  }

  const upload = new Upload(content, {
    endpoint,
    chunkSize: content.length,
    metadata: uploadMetadata(uploadConfig, scenario, createResponse),
    retryDelays: retryDelays(uploadConfig.retries),
  })

  await new Promise((resolve, reject) => {
    upload.options.onError = reject
    upload.options.onSuccess = resolve
    upload.start()
  })

  if (!upload.url) {
    fail('TUS upload did not expose an upload URL')
  }

  return upload.url
}

async function writeResult(uploadUrl) {
  const resultPath = process.env.API2_SDK_EXAMPLE_RESULT
  if (!resultPath) {
    return
  }

  await writeFile(resultPath, `${JSON.stringify({ uploadUrl }, undefined, 2)}\n`)
}

async function main() {
  const scenario = await loadScenario()
  const createResponse = scenario.prepared.createResponse
  const uploadUrl = await uploadWithTus(scenario, createResponse)
  await writeResult(uploadUrl)
  console.log(`TypeScript TUS SDK devdock scenario ${scenario.scenarioId} uploaded to ${uploadUrl}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
