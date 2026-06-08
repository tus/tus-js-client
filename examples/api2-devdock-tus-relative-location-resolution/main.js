import { Upload } from '../../lib.esm/node/index.js'
import {
  fail,
  loadScenario,
  requireTusConformanceScenario,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

function conformanceInputOptions(conformanceScenario) {
  const options = {}
  for (const entry of conformanceScenario.inputOptionEntries) {
    options[entry.key] = entry.value
  }

  return options
}

function conformanceUploadInput(conformanceScenario) {
  const inputSource = conformanceScenario.inputSource
  if (inputSource.kind !== 'blob') {
    fail(`relative Location scenario cannot build input kind ${JSON.stringify(inputSource.kind)}`)
  }

  return new Blob([inputSource.content])
}

function bodySize(body) {
  if (body == null) {
    return null
  }

  if (body instanceof Blob) {
    return body.size
  }

  if (body instanceof ArrayBuffer) {
    return body.byteLength
  }

  if (ArrayBuffer.isView(body)) {
    return body.byteLength
  }

  if (typeof body.length === 'number') {
    return body.length
  }

  fail(`relative Location scenario cannot measure request body ${typeof body}`)
}

class ContractResponse {
  constructor(responsePlan) {
    this.responsePlan = responsePlan
  }

  getStatus() {
    return this.responsePlan.statusCode
  }

  getHeader(header) {
    return this.responsePlan.effectiveHeaders[header]
  }

  getBody() {
    return this.responsePlan.body ?? ''
  }

  getUnderlyingObject() {
    return this.responsePlan
  }
}

class ContractRequest {
  constructor({ observed, requestPlan, url }) {
    this.headers = {}
    this.observed = observed
    this.requestPlan = requestPlan
    this.url = url
    this.progressHandler = () => {}
  }

  getMethod() {
    return this.requestPlan.effectiveMethod
  }

  getURL() {
    return this.url
  }

  setHeader(header, value) {
    this.headers[header] = value
  }

  getHeader(header) {
    return this.headers[header]
  }

  setProgressHandler(progressHandler) {
    this.progressHandler = progressHandler
  }

  send(body = null) {
    const size = bodySize(body)
    if (size !== this.requestPlan.bodySize) {
      fail(
        `relative Location scenario expected request body size ${this.requestPlan.bodySize}, got ${size}`,
      )
    }

    for (const [header, value] of Object.entries(this.requestPlan.effectiveHeaders)) {
      if (this.headers[header] !== value) {
        fail(
          `relative Location scenario expected request header ${header}=${JSON.stringify(value)}, got ${JSON.stringify(this.headers[header])}`,
        )
      }
    }

    if (size != null) {
      this.progressHandler(0)
      this.progressHandler(size)
    }

    this.observed.requestMethods.push(this.requestPlan.effectiveMethod)
    this.observed.requestUrls.push(this.url)

    return Promise.resolve(new ContractResponse(this.requestPlan.response))
  }

  abort() {
    return Promise.resolve()
  }

  getUnderlyingObject() {
    return this.requestPlan
  }
}

class ContractHttpStack {
  constructor(conformanceScenario) {
    this.conformanceScenario = conformanceScenario
    this.nextRequestIndex = 0
    this.observed = {
      requestMethods: [],
      requestUrls: [],
    }
  }

  createRequest(method, url) {
    const requestPlan = this.conformanceScenario.requests[this.nextRequestIndex]
    if (!requestPlan) {
      fail(`relative Location scenario received unexpected ${method} request to ${url}`)
    }

    this.nextRequestIndex += 1

    if (method !== requestPlan.effectiveMethod) {
      fail(
        `relative Location scenario expected ${requestPlan.effectiveMethod} request, got ${method}`,
      )
    }

    if (url !== requestPlan.expectedUrl) {
      fail(`relative Location scenario expected request URL ${requestPlan.expectedUrl}, got ${url}`)
    }

    return new ContractRequest({
      observed: this.observed,
      requestPlan,
      url,
    })
  }

  getName() {
    return 'API2 contract conformance transport'
  }
}

async function uploadWithRelativeLocationResolution(conformanceScenario) {
  const inputOptions = conformanceInputOptions(conformanceScenario)
  const content = conformanceUploadInput(conformanceScenario)
  const httpStack = new ContractHttpStack(conformanceScenario)
  const upload = new Upload(content, {
    endpoint: inputOptions.endpointUrl,
    httpStack,
    metadata: inputOptions.metadata,
  })

  await new Promise((resolve, reject) => {
    upload.options.onError = reject
    upload.options.onSuccess = resolve
    upload.start()
  })

  if (!upload.url) {
    fail('relative Location scenario did not expose an upload URL')
  }

  if (httpStack.nextRequestIndex !== conformanceScenario.requests.length) {
    fail(
      `relative Location scenario expected ${conformanceScenario.requests.length} request(s), got ${httpStack.nextRequestIndex}`,
    )
  }

  return {
    requestMethods: httpStack.observed.requestMethods,
    requestUrls: httpStack.observed.requestUrls,
    uploadUrl: upload.url,
  }
}

async function main() {
  const scenario = await loadScenario(import.meta.url)
  const conformanceScenario = requireTusConformanceScenario(scenario)
  const result = await uploadWithRelativeLocationResolution(conformanceScenario)
  await writeJsonResult(result)
  console.log(
    `TypeScript TUS SDK devdock scenario ${scenario.scenarioId} resolved ${result.uploadUrl}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
