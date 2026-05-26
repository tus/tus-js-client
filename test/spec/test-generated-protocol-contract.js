import { Upload } from 'tus-js-client'
import { tusClientFeatures, tusProtocolOperations } from './generated-protocol-contract.js'
import { getBlob, TestHttpStack, waitableFunction } from './helpers/utils.js'

function getProtocolOperation(operationId) {
  const operation = tusProtocolOperations.find((candidate) => candidate.operationId === operationId)
  if (!operation) {
    throw new Error(`Missing generated TUS protocol operation: ${operationId}`)
  }

  return operation
}

function getClientFeature(featureId) {
  const feature = tusClientFeatures.find((candidate) => candidate.featureId === featureId)
  if (!feature) {
    throw new Error(`Missing generated TUS client feature: ${featureId}`)
  }

  return feature
}

function requestMatchesHeaderVariant(requestHeaders, variant) {
  return variant.fields
    .filter((field) => field.required)
    .every((field) => requestHeaders[field.displayName] != null)
}

function expectRequestMatchesOperation(req, operation) {
  expect(req.method).toBe(operation.method)

  if (operation.request.contentType) {
    expect(req.requestHeaders['Content-Type']).toBe(operation.request.contentType)
  }

  if (operation.request.headerVariants.length > 0) {
    expect(
      operation.request.headerVariants.some((variant) =>
        requestMatchesHeaderVariant(req.requestHeaders, variant),
      ),
    ).toBe(true)
  }
}

function getResponse(operation, statusCode) {
  const response = operation.responses.find((candidate) => candidate.statusCode === statusCode)
  if (!response) {
    throw new Error(
      `Missing generated response status ${statusCode} for ${operation.operationId}`,
    )
  }

  return response
}

function responseHeadersFor(response, overrides) {
  const headers = {}
  const variant = response.headerVariants[0]
  for (const field of variant?.fields ?? []) {
    if (!field.required) continue
    headers[field.displayName] = overrides[field.displayName] ?? '1.0.0'
  }

  return headers
}

describe('generated TUS protocol contract', () => {
  it('drives the simple upload lifecycle assertions from the generated contract', async () => {
    const lifecycle = getClientFeature('singleUploadLifecycle')
    const createOperation = getProtocolOperation(lifecycle.operationIds[0])
    const patchOperation = getProtocolOperation(lifecycle.operationIds[2])
    const testStack = new TestHttpStack()
    const file = getBlob('hello world')
    const options = {
      httpStack: testStack,
      endpoint: 'https://tus.io/uploads',
      metadata: {
        filename: 'hello.txt',
      },
      onSuccess: waitableFunction('onSuccess'),
    }

    const upload = new Upload(file, options)
    upload.start()

    let req = await testStack.nextRequest()
    expectRequestMatchesOperation(req, createOperation)

    const createResponse = getResponse(createOperation, 201)
    req.respondWith({
      status: createResponse.statusCode,
      responseHeaders: responseHeadersFor(createResponse, {
        Location: 'https://tus.io/uploads/generated-contract',
      }),
    })

    req = await testStack.nextRequest()
    expectRequestMatchesOperation(req, patchOperation)
    expect(req.bodySize).toBe(11)

    const patchResponse = getResponse(patchOperation, 204)
    req.respondWith({
      status: patchResponse.statusCode,
      responseHeaders: responseHeadersFor(patchResponse, {
        'Upload-Offset': '11',
      }),
    })

    await options.onSuccess.toBeCalled()
    expect(upload.url).toBe('https://tus.io/uploads/generated-contract')
  })
})
