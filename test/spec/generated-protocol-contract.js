// This file is generated from Transloadit API2 TUS protocol contracts. If it looks wrong,
// please report the issue instead of editing this file by hand; the source fix
// belongs in the protocol contract generator so all TUS clients stay in sync.

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
    featureId: 'terminateUpload',
    operationIds: ['terminateTusUpload'],
    primitives: ['retry-with-backoff'],
  },
]
