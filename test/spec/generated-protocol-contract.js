// This file is generated from Transloadit API2 TUS protocol contracts. If it looks wrong,
// please report the issue instead of editing this file by hand; the source fix
// belongs in the protocol contract generator so all TUS clients stay in sync.

export const tusWireVersions = [
  {
    default: true,
    value: '1.0.0',
  },
]

export const tusProtocolOperations = [
  {
    operationId: 'discoverTusCapabilities',
    role: 'capability-discovery',
    method: 'OPTIONS',
    path: '/resumable/files/',
    request: {
      bodyKind: 'empty',
      contentType: null,
      headerVariants: [],
    },
    responses: [
      {
        statusCode: 200,
        bodyKind: 'empty',
        headerVariants: [
          {
            fields: [
              {
                displayName: 'Tus-Extension',
                name: 'tus-extension',
                required: true,
              },
              {
                displayName: 'Tus-Max-Size',
                name: 'tus-max-size',
                required: true,
              },
              {
                displayName: 'Tus-Resumable',
                name: 'tus-resumable',
                required: true,
              },
              {
                displayName: 'Tus-Version',
                name: 'tus-version',
                required: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    operationId: 'createTusUpload',
    role: 'creation',
    method: 'POST',
    path: '/resumable/files/',
    request: {
      bodyKind: 'empty',
      contentType: null,
      headerVariants: [
        {
          fields: [
            {
              displayName: 'Tus-Resumable',
              name: 'tus-resumable',
              required: true,
            },
            {
              displayName: 'Upload-Length',
              name: 'upload-length',
              required: true,
            },
            {
              displayName: 'Upload-Metadata',
              name: 'upload-metadata',
              required: true,
            },
          ],
        },
        {
          fields: [
            {
              displayName: 'Tus-Resumable',
              name: 'tus-resumable',
              required: true,
            },
            {
              displayName: 'Upload-Defer-Length',
              name: 'upload-defer-length',
              required: true,
            },
            {
              displayName: 'Upload-Metadata',
              name: 'upload-metadata',
              required: true,
            },
          ],
        },
      ],
    },
    responses: [
      {
        statusCode: 201,
        bodyKind: 'empty',
        headerVariants: [
          {
            fields: [
              {
                displayName: 'Location',
                name: 'location',
                required: true,
              },
              {
                displayName: 'Tus-Resumable',
                name: 'tus-resumable',
                required: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    operationId: 'getTusUploadOffset',
    role: 'offset-discovery',
    method: 'HEAD',
    path: '/resumable/files/{upload_id}',
    request: {
      bodyKind: 'empty',
      contentType: null,
      headerVariants: [
        {
          fields: [
            {
              displayName: 'Tus-Resumable',
              name: 'tus-resumable',
              required: true,
            },
          ],
        },
      ],
    },
    responses: [
      {
        statusCode: 200,
        bodyKind: 'empty',
        headerVariants: [
          {
            fields: [
              {
                displayName: 'Tus-Resumable',
                name: 'tus-resumable',
                required: true,
              },
              {
                displayName: 'Upload-Length',
                name: 'upload-length',
                required: true,
              },
              {
                displayName: 'Upload-Offset',
                name: 'upload-offset',
                required: true,
              },
            ],
          },
          {
            fields: [
              {
                displayName: 'Tus-Resumable',
                name: 'tus-resumable',
                required: true,
              },
              {
                displayName: 'Upload-Defer-Length',
                name: 'upload-defer-length',
                required: true,
              },
              {
                displayName: 'Upload-Offset',
                name: 'upload-offset',
                required: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    operationId: 'patchTusUpload',
    role: 'upload-chunk',
    method: 'PATCH',
    path: '/resumable/files/{upload_id}',
    request: {
      bodyKind: 'binary',
      contentType: 'application/offset+octet-stream',
      headerVariants: [
        {
          fields: [
            {
              displayName: 'Content-Type',
              name: 'content-type',
              required: true,
            },
            {
              displayName: 'Tus-Resumable',
              name: 'tus-resumable',
              required: true,
            },
            {
              displayName: 'Upload-Offset',
              name: 'upload-offset',
              required: true,
            },
          ],
        },
      ],
    },
    responses: [
      {
        statusCode: 204,
        bodyKind: 'empty',
        headerVariants: [
          {
            fields: [
              {
                displayName: 'Tus-Resumable',
                name: 'tus-resumable',
                required: true,
              },
              {
                displayName: 'Upload-Offset',
                name: 'upload-offset',
                required: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    operationId: 'terminateTusUpload',
    role: 'termination',
    method: 'DELETE',
    path: '/resumable/files/{upload_id}',
    request: {
      bodyKind: 'empty',
      contentType: null,
      headerVariants: [
        {
          fields: [
            {
              displayName: 'Tus-Resumable',
              name: 'tus-resumable',
              required: true,
            },
          ],
        },
      ],
    },
    responses: [
      {
        statusCode: 204,
        bodyKind: 'empty',
        headerVariants: [
          {
            fields: [
              {
                displayName: 'Tus-Resumable',
                name: 'tus-resumable',
                required: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    operationId: 'downloadTusUpload',
    role: 'download',
    method: 'GET',
    path: '/resumable/files/{upload_id}',
    request: {
      bodyKind: 'empty',
      contentType: null,
      headerVariants: [],
    },
    responses: [
      {
        statusCode: 200,
        bodyKind: 'binary',
        headerVariants: [],
      },
    ],
  },
]

export const tusClientFeatures = [
  {
    featureId: 'singleUploadLifecycle',
    operationIds: ['createTusUpload', 'getTusUploadOffset', 'patchTusUpload'],
    primitives: [
      'open-input-source',
      'fingerprint-input',
      'store-resume-url',
      'retry-with-backoff',
      'emit-progress',
      'abort-current-request',
    ],
  },
  {
    featureId: 'resumeUpload',
    operationIds: ['getTusUploadOffset', 'patchTusUpload'],
    primitives: ['fingerprint-input', 'resume-from-previous-upload', 'store-resume-url'],
  },
  {
    featureId: 'deferredLengthUpload',
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['defer-upload-length', 'emit-progress'],
  },
  {
    featureId: 'retryOffsetRecovery',
    operationIds: ['createTusUpload', 'getTusUploadOffset', 'patchTusUpload'],
    primitives: ['retry-with-backoff', 'recover-offset-after-error'],
  },
  {
    featureId: 'terminateUpload',
    operationIds: ['terminateTusUpload'],
    primitives: ['terminate-upload', 'retry-with-backoff'],
  },
]

export const tusClientConformanceScenarios = [
  {
    behavior: 'single-upload-lifecycle',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/generated-contract',
    },
    featureId: 'singleUploadLifecycle',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      metadata: {
        filename: 'hello.txt',
      },
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: [
      'open-input-source',
      'fingerprint-input',
      'store-resume-url',
      'retry-with-backoff',
      'emit-progress',
      'abort-current-request',
    ],
    requests: [
      {
        headers: {
          'Upload-Length': '11',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'https://tus.io/uploads/generated-contract',
          },
          statusCode: 201,
        },
        url: 'endpoint',
      },
      {
        bodySize: 11,
        headers: {
          'Upload-Offset': '0',
        },
        operationId: 'patchTusUpload',
        response: {
          headers: {
            'Upload-Offset': '11',
          },
          statusCode: 204,
        },
        url: 'upload',
      },
    ],
    scenarioId: 'singleUploadLifecycle',
  },
  {
    behavior: 'resume-from-previous-upload',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/resume-contract',
    },
    featureId: 'resumeUpload',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      storedUpload: {
        fingerprint: 'contract-resume-fingerprint',
        uploadUrl: 'https://tus.io/uploads/resume-contract',
      },
    },
    operationIds: ['getTusUploadOffset', 'patchTusUpload'],
    primitives: ['fingerprint-input', 'resume-from-previous-upload', 'store-resume-url'],
    requests: [
      {
        operationId: 'getTusUploadOffset',
        response: {
          headers: {
            'Upload-Length': '11',
            'Upload-Offset': '5',
          },
          statusCode: 200,
        },
        url: 'upload',
      },
      {
        bodySize: 6,
        headers: {
          'Upload-Offset': '5',
        },
        operationId: 'patchTusUpload',
        response: {
          headers: {
            'Upload-Offset': '11',
          },
          statusCode: 204,
        },
        url: 'upload',
      },
    ],
    scenarioId: 'resumeFromPreviousUpload',
  },
  {
    behavior: 'deferred-length-upload',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/deferred-contract',
    },
    featureId: 'deferredLengthUpload',
    input: {
      chunkSize: 100,
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'readable-stream',
      metadata: {
        filename: 'hello.txt',
      },
      uploadLengthDeferred: true,
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['defer-upload-length', 'emit-progress'],
    requests: [
      {
        absentHeaders: ['Upload-Length'],
        headers: {
          'Upload-Defer-Length': '1',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'https://tus.io/uploads/deferred-contract',
          },
          statusCode: 201,
        },
        url: 'endpoint',
      },
      {
        bodySize: 11,
        headers: {
          'Upload-Length': '11',
          'Upload-Offset': '0',
        },
        operationId: 'patchTusUpload',
        response: {
          headers: {
            'Upload-Offset': '11',
          },
          statusCode: 204,
        },
        url: 'upload',
      },
    ],
    scenarioId: 'deferredLengthUpload',
  },
  {
    behavior: 'retry-patch-after-offset-recovery',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/retry-contract',
    },
    featureId: 'retryOffsetRecovery',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      metadata: {
        filename: 'hello.txt',
      },
      retryDelays: [0, 0],
    },
    operationIds: ['createTusUpload', 'patchTusUpload', 'getTusUploadOffset', 'patchTusUpload'],
    primitives: ['retry-with-backoff', 'recover-offset-after-error'],
    requests: [
      {
        headers: {
          'Upload-Length': '11',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'https://tus.io/uploads/retry-contract',
          },
          statusCode: 201,
        },
        url: 'endpoint',
      },
      {
        bodySize: 11,
        headers: {
          'Upload-Offset': '0',
        },
        operationId: 'patchTusUpload',
        response: {
          statusCode: 500,
        },
        url: 'upload',
      },
      {
        operationId: 'getTusUploadOffset',
        response: {
          headers: {
            'Upload-Length': '11',
            'Upload-Offset': '0',
          },
          statusCode: 200,
        },
        url: 'upload',
      },
      {
        bodySize: 11,
        headers: {
          'Upload-Offset': '0',
        },
        operationId: 'patchTusUpload',
        response: {
          headers: {
            'Upload-Offset': '11',
          },
          statusCode: 204,
        },
        url: 'upload',
      },
    ],
    scenarioId: 'retryPatchAfterOffsetRecovery',
  },
  {
    behavior: 'terminate-with-retry',
    completion: {
      kind: 'terminated',
      uploadUrl: 'https://tus.io/uploads/terminate-contract',
    },
    featureId: 'terminateUpload',
    input: {
      chunkSize: 5,
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      metadata: {
        filename: 'hello.txt',
      },
      retryDelays: [0, 0],
    },
    operationIds: ['createTusUpload', 'patchTusUpload', 'terminateTusUpload', 'terminateTusUpload'],
    primitives: ['terminate-upload', 'retry-with-backoff'],
    requests: [
      {
        headers: {
          'Upload-Length': '11',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'https://tus.io/uploads/terminate-contract',
          },
          statusCode: 201,
        },
        url: 'endpoint',
      },
      {
        bodySize: 5,
        headers: {
          'Upload-Offset': '0',
        },
        operationId: 'patchTusUpload',
        response: {
          headers: {
            'Upload-Offset': '5',
          },
          statusCode: 204,
        },
        url: 'upload',
      },
      {
        operationId: 'terminateTusUpload',
        response: {
          statusCode: 423,
        },
        url: 'upload',
      },
      {
        operationId: 'terminateTusUpload',
        response: {
          statusCode: 204,
        },
        url: 'upload',
      },
    ],
    scenarioId: 'terminateWithRetry',
  },
]
