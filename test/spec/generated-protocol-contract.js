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
        {
          fields: [
            {
              displayName: 'Tus-Resumable',
              name: 'tus-resumable',
              required: true,
            },
            {
              displayName: 'Upload-Concat',
              name: 'upload-concat',
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
              required: false,
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
              displayName: 'Upload-Concat',
              name: 'upload-concat',
              required: true,
            },
            {
              displayName: 'Upload-Metadata',
              name: 'upload-metadata',
              required: false,
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
    conformance: {
      scenarioIds: ['singleUploadLifecycle'],
      status: 'covered-by-generated-scenario',
    },
    description: 'Create an upload, store its URL, upload bytes, and finish successfully.',
    featureId: 'singleUploadLifecycle',
    flow: [
      {
        kind: 'primitive',
        primitive: 'open-input-source',
        summary: 'Open the caller input as a sliceable source.',
      },
      {
        kind: 'operation',
        operationId: 'createTusUpload',
        summary: 'Create the remote upload resource.',
      },
      {
        kind: 'operation',
        operationId: 'patchTusUpload',
        summary: 'Upload bytes until the accepted offset reaches the known length.',
      },
    ],
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
    conformance: {
      scenarioIds: ['resumeFromPreviousUpload'],
      status: 'covered-by-generated-scenario',
    },
    description: 'Resume a stored upload URL by discovering the remote offset before patching.',
    featureId: 'resumeUpload',
    flow: [
      {
        kind: 'primitive',
        primitive: 'resume-from-previous-upload',
        summary: 'Load a stored upload URL selected by fingerprint.',
      },
      {
        kind: 'operation',
        operationId: 'getTusUploadOffset',
        summary: 'Read the server offset for the stored upload URL.',
      },
      {
        kind: 'operation',
        operationId: 'patchTusUpload',
        summary: 'Continue uploading from the discovered offset.',
      },
    ],
    operationIds: ['getTusUploadOffset', 'patchTusUpload'],
    primitives: ['fingerprint-input', 'resume-from-previous-upload', 'store-resume-url'],
  },
  {
    conformance: {
      scenarioIds: ['deferredLengthUpload', 'deferredLengthChunkedUpload'],
      status: 'covered-by-generated-scenario',
    },
    description:
      'Create an upload without a known length and declare the length on the final upload request.',
    featureId: 'deferredLengthUpload',
    flow: [
      {
        kind: 'operation',
        operationId: 'createTusUpload',
        summary: 'Create the upload with deferred length.',
      },
      {
        kind: 'primitive',
        primitive: 'defer-upload-length',
        summary: 'Track the source until the final upload request reveals the total size.',
      },
      {
        kind: 'operation',
        operationId: 'patchTusUpload',
        summary: 'Declare Upload-Length on the final upload request.',
      },
    ],
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['defer-upload-length', 'emit-chunk-complete', 'emit-progress'],
  },
  {
    conformance: {
      scenarioIds: ['creationWithUpload', 'creationWithUploadPartialChunk'],
      status: 'covered-by-generated-scenario',
    },
    description: 'Send the first bytes on the creation request when the server/client support it.',
    featureId: 'creationWithUpload',
    flow: [
      {
        kind: 'operation',
        operationId: 'createTusUpload',
        summary: 'Create the upload while streaming the initial body.',
      },
      {
        kind: 'primitive',
        primitive: 'upload-during-creation',
        summary: 'Interpret the creation response as an accepted offset.',
      },
    ],
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['upload-during-creation', 'emit-progress'],
  },
  {
    conformance: {
      scenarioIds: ['uploadBodyHeaders'],
      status: 'covered-by-generated-scenario',
    },
    description:
      'Send protocol-specific upload body headers whenever the client transmits file bytes.',
    featureId: 'uploadBodyHeaders',
    flow: [
      {
        kind: 'primitive',
        primitive: 'send-upload-body-headers',
        summary: 'Attach the protocol-specific upload body content type when a request has bytes.',
      },
      {
        kind: 'operation',
        operationId: 'patchTusUpload',
        summary: 'Upload bytes with the protocol-specific body headers.',
      },
    ],
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['send-upload-body-headers'],
  },
  {
    conformance: {
      scenarioIds: ['customRequestHeaders'],
      status: 'covered-by-generated-scenario',
    },
    description: 'Apply user-provided request headers to every upload request.',
    featureId: 'customRequestHeaders',
    flow: [
      {
        kind: 'primitive',
        primitive: 'apply-custom-request-headers',
        summary: 'Merge user-provided headers after protocol headers are prepared.',
      },
      {
        kind: 'operation',
        operationId: 'createTusUpload',
        summary: 'Create uploads with the configured custom headers.',
      },
      {
        kind: 'operation',
        operationId: 'patchTusUpload',
        summary: 'Upload bytes with the configured custom headers.',
      },
    ],
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['apply-custom-request-headers'],
  },
  {
    conformance: {
      scenarioIds: ['requestIdHeaders'],
      status: 'covered-by-generated-scenario',
    },
    description: 'Add generated request IDs after protocol and custom request headers.',
    featureId: 'requestIdHeaders',
    flow: [
      {
        kind: 'primitive',
        primitive: 'add-request-id-header',
        summary:
          'Generate a request ID and apply it after custom request headers so it is authoritative.',
      },
      {
        kind: 'operation',
        operationId: 'createTusUpload',
        summary: 'Create uploads with a generated request ID.',
      },
      {
        kind: 'operation',
        operationId: 'patchTusUpload',
        summary: 'Upload bytes with a generated request ID.',
      },
    ],
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['add-request-id-header', 'apply-custom-request-headers'],
  },
  {
    conformance: {
      scenarioIds: ['overridePatchMethod'],
      status: 'covered-by-generated-scenario',
    },
    description: 'Tunnel PATCH through POST with the method-override header.',
    featureId: 'overridePatchMethod',
    flow: [
      {
        kind: 'operation',
        operationId: 'getTusUploadOffset',
        summary: 'Resume from the upload URL before sending bytes.',
      },
      {
        kind: 'primitive',
        primitive: 'override-patch-method',
        summary: 'Replace PATCH with POST while preserving the protocol operation intent.',
      },
      {
        kind: 'operation',
        operationId: 'patchTusUpload',
        summary: 'Upload bytes through the overridden request.',
      },
    ],
    operationIds: ['getTusUploadOffset', 'patchTusUpload'],
    primitives: ['override-patch-method'],
  },
  {
    conformance: {
      scenarioIds: ['parallelUploadConcat', 'parallelUploadAbortCleanup'],
      status: 'covered-by-generated-scenario',
    },
    description:
      'Split one input into partial uploads, run the parts concurrently, clean up aborted parts, and concatenate their upload URLs.',
    featureId: 'parallelUploadConcat',
    flow: [
      {
        kind: 'primitive',
        primitive: 'split-parallel-upload-boundaries',
        summary: 'Split the input into stable byte ranges.',
      },
      {
        kind: 'operation',
        operationId: 'createTusUpload',
        summary: 'Create partial uploads for each range.',
      },
      {
        kind: 'primitive',
        primitive: 'concatenate-partial-uploads',
        summary: 'Create the final upload from completed partial upload URLs.',
      },
    ],
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: [
      'abort-current-request',
      'concatenate-partial-uploads',
      'emit-progress',
      'split-parallel-upload-boundaries',
      'terminate-upload',
    ],
  },
  {
    conformance: {
      scenarioIds: ['retryPatchAfterOffsetRecovery'],
      status: 'covered-by-generated-scenario',
    },
    description: 'Recover from a failed chunk by reading the server offset before retrying.',
    featureId: 'retryOffsetRecovery',
    flow: [
      {
        kind: 'operation',
        operationId: 'patchTusUpload',
        summary: 'Attempt the chunk upload.',
      },
      {
        kind: 'primitive',
        primitive: 'recover-offset-after-error',
        summary: 'Discover the accepted offset after a retryable failure.',
      },
      {
        kind: 'operation',
        operationId: 'getTusUploadOffset',
        summary: 'Use HEAD to recover the offset before retrying PATCH.',
      },
    ],
    operationIds: ['createTusUpload', 'getTusUploadOffset', 'patchTusUpload'],
    primitives: ['retry-with-backoff', 'recover-offset-after-error'],
  },
  {
    conformance: {
      scenarioIds: ['retryPatchAfterOffsetRecovery'],
      status: 'covered-by-generated-scenario',
    },
    description: 'Schedule retry timers and reset retry attempts after accepted progress.',
    featureId: 'retryStateTransitions',
    flow: [
      {
        kind: 'primitive',
        primitive: 'schedule-retry-timer',
        summary: 'Consume the current retry delay and restart the upload after that timer fires.',
      },
      {
        kind: 'primitive',
        primitive: 'reset-retry-attempt-after-progress',
        summary: 'Reset retry attempts once a later retry observes server-side offset progress.',
      },
    ],
    operationIds: ['getTusUploadOffset', 'patchTusUpload'],
    primitives: [
      'retry-with-backoff',
      'schedule-retry-timer',
      'reset-retry-attempt-after-progress',
    ],
  },
  {
    conformance: {
      scenarioIds: ['terminateWithRetry'],
      status: 'covered-by-generated-scenario',
    },
    description: 'Terminate an upload resource and retry retryable termination failures.',
    featureId: 'terminateUpload',
    flow: [
      {
        kind: 'primitive',
        primitive: 'terminate-upload',
        summary: 'Choose server-side termination for an upload URL.',
      },
      {
        kind: 'operation',
        operationId: 'terminateTusUpload',
        summary: 'Delete the upload resource.',
      },
    ],
    operationIds: ['terminateTusUpload'],
    primitives: ['terminate-upload', 'retry-with-backoff'],
  },
  {
    conformance: {
      scenarioIds: ['abortUpload', 'abortUploadAfterStoredUrl'],
      status: 'covered-by-generated-scenario',
    },
    description: 'Abort the active request, pending retry timer, and any partial uploads.',
    featureId: 'abortUpload',
    flow: [
      {
        kind: 'primitive',
        primitive: 'abort-current-request',
        summary: 'Cancel in-flight transport work without emitting user callbacks after abort.',
      },
    ],
    operationIds: ['terminateTusUpload'],
    primitives: ['abort-current-request', 'terminate-upload'],
  },
  {
    conformance: {
      scenarioIds: ['singleUploadLifecycle', 'creationWithUpload', 'resumeFromPreviousUpload'],
      status: 'covered-by-generated-scenario',
    },
    description: 'Expose progress and accepted-chunk callbacks from runtime upload activity.',
    featureId: 'uploadCallbacks',
    flow: [
      {
        kind: 'primitive',
        primitive: 'emit-progress',
        summary: 'Report bytes sent against known or deferred length.',
      },
      {
        kind: 'primitive',
        primitive: 'emit-chunk-complete',
        summary: 'Report chunk size, accepted offset, and total size after server acceptance.',
      },
      {
        kind: 'primitive',
        primitive: 'emit-upload-url',
        summary: 'Notify once a usable upload URL is known.',
      },
    ],
    operationIds: [],
    primitives: ['emit-progress', 'emit-chunk-complete', 'emit-upload-url'],
  },
  {
    conformance: {
      scenarioIds: ['requestLifecycleHooks', 'retryPatchAfterOffsetRecovery'],
      status: 'covered-by-generated-scenario',
    },
    description: 'Run before-request, after-response, and custom retry hooks around transport.',
    featureId: 'requestLifecycleHooks',
    flow: [
      {
        kind: 'primitive',
        primitive: 'run-request-hooks',
        summary: 'Call user hooks around each HTTP request/response pair.',
      },
      {
        kind: 'primitive',
        primitive: 'customize-retry',
        summary: 'Let user retry policy override default retry decisions.',
      },
    ],
    operationIds: [],
    primitives: ['customize-retry', 'run-request-hooks'],
  },
  {
    conformance: {
      scenarioIds: ['singleUploadLifecycle', 'resumeFromPreviousUpload'],
      status: 'covered-by-generated-scenario',
    },
    description: 'Persist, find, resume, and optionally remove upload URLs by fingerprint.',
    featureId: 'resumeUrlStorage',
    flow: [
      {
        kind: 'primitive',
        primitive: 'fingerprint-input',
        summary: 'Derive a stable key for the input when possible.',
      },
      {
        kind: 'primitive',
        primitive: 'store-resume-url',
        summary: 'Persist upload URLs and partial-upload URLs for future resumption.',
      },
      {
        kind: 'primitive',
        primitive: 'remove-stored-url-on-success',
        summary: 'Remove stored upload URLs when configured after success or invalidation.',
      },
    ],
    operationIds: [],
    primitives: ['fingerprint-input', 'store-resume-url', 'remove-stored-url-on-success'],
  },
  {
    conformance: {
      scenarioIds: [
        'arrayBufferInput',
        'arrayBufferViewInput',
        'webReadableStreamInput',
        'nodeReadableStreamInput',
        'nodePathInput',
      ],
      status: 'covered-by-generated-scenario',
    },
    description: 'Support the reference client input/source families across runtimes.',
    featureId: 'inputSources',
    flow: [
      {
        kind: 'primitive',
        primitive: 'read-browser-file',
        summary: 'Read browser Blob/File and ArrayBuffer-family inputs.',
      },
      {
        kind: 'primitive',
        primitive: 'read-node-stream',
        summary: 'Read Node streams when size and chunk constraints are satisfied.',
      },
      {
        kind: 'primitive',
        primitive: 'read-web-stream',
        summary: 'Read Web Streams with deferred or configured size.',
      },
      {
        kind: 'primitive',
        primitive: 'read-node-file',
        summary: 'Read filesystem paths and fs streams, including parallel ranges.',
      },
    ],
    operationIds: [],
    primitives: ['read-browser-file', 'read-node-file', 'read-node-stream', 'read-web-stream'],
  },
  {
    conformance: {
      scenarioIds: ['webStorageUrlStorageBackend', 'fileUrlStorageBackend'],
      status: 'covered-by-generated-scenario',
    },
    description: 'Support browser and file-backed URL storage implementations.',
    featureId: 'urlStorageBackends',
    flow: [
      {
        kind: 'primitive',
        primitive: 'store-browser-url',
        summary: 'Persist upload records in browser localStorage.',
      },
      {
        kind: 'primitive',
        primitive: 'store-file-url',
        summary: 'Persist upload records in the Node file store.',
      },
    ],
    operationIds: [],
    primitives: ['store-browser-url', 'store-file-url'],
  },
  {
    conformance: {
      scenarioIds: [
        'ietfDraft05CreationWithUpload',
        'ietfDraft05ChunkedUploadComplete',
        'ietfDraft03ResumeWithoutKnownLength',
      ],
      status: 'covered-by-generated-scenario',
    },
    description: 'Select between tus v1 and supported IETF draft client protocol modes.',
    featureId: 'protocolVersionSelection',
    flow: [
      {
        kind: 'primitive',
        primitive: 'select-client-protocol',
        summary: 'Choose request headers and response expectations for the selected protocol.',
      },
    ],
    operationIds: ['createTusUpload', 'getTusUploadOffset', 'patchTusUpload'],
    primitives: ['select-client-protocol'],
  },
  {
    conformance: {
      scenarioIds: ['relativeLocationResolution'],
      status: 'covered-by-generated-scenario',
    },
    description: 'Normalize relative Location headers against the request endpoint.',
    featureId: 'relativeLocationResolution',
    flow: [
      {
        kind: 'primitive',
        primitive: 'resolve-relative-location',
        summary: 'Resolve server Location headers with the creation endpoint as origin.',
      },
    ],
    operationIds: ['createTusUpload'],
    primitives: ['resolve-relative-location'],
  },
  {
    conformance: {
      scenarioIds: [
        'startValidationMissingInput',
        'startValidationMissingEndpointOrUploadUrl',
        'startValidationUnsupportedProtocol',
        'startValidationRetryDelaysNotArray',
        'startValidationParallelUploadsWithUploadUrl',
        'startValidationParallelUploadsWithUploadSize',
        'startValidationParallelUploadsWithDeferredLength',
        'startValidationParallelUploadsWithUploadDataDuringCreation',
        'startValidationParallelBoundariesWithoutParallelUploads',
        'startValidationParallelBoundariesLengthMismatch',
      ],
      status: 'covered-by-generated-scenario',
    },
    description: 'Validate option combinations before starting runtime work.',
    featureId: 'startOptionValidation',
    flow: [
      {
        kind: 'primitive',
        primitive: 'validate-start-options',
        summary: 'Reject missing inputs and incompatible parallel/deferred/resume options.',
      },
    ],
    operationIds: [],
    primitives: ['validate-start-options'],
  },
  {
    conformance: {
      scenarioIds: ['detailedCreateResponseError', 'detailedCreateRequestError'],
      status: 'covered-by-generated-scenario',
    },
    description: 'Attach request, response, status, body, and request ID context to errors.',
    featureId: 'detailedErrors',
    flow: [
      {
        kind: 'primitive',
        primitive: 'report-detailed-errors',
        summary: 'Return user-facing errors with enough transport context for debugging.',
      },
    ],
    operationIds: [],
    primitives: ['report-detailed-errors'],
  },
]

export const tusClientConformanceEventKeyTemplates = [
  {
    eventKind: 'after-response',
    fields: [
      {
        name: 'requestIndex',
        valueKind: 'number',
      },
    ],
  },
  {
    eventKind: 'before-request',
    fields: [
      {
        name: 'requestIndex',
        valueKind: 'number',
      },
    ],
  },
  {
    eventKind: 'chunk-complete',
    fields: [
      {
        name: 'chunkSize',
        valueKind: 'number',
      },
      {
        name: 'bytesAccepted',
        valueKind: 'number',
      },
      {
        name: 'bytesTotal',
        valueKind: 'nullable-number',
      },
    ],
  },
  {
    eventKind: 'fingerprint',
    fields: [
      {
        name: 'fingerprint',
        valueKind: 'nullable-string',
      },
    ],
  },
  {
    eventKind: 'progress',
    fields: [
      {
        name: 'bytesSent',
        valueKind: 'number',
      },
      {
        name: 'bytesTotal',
        valueKind: 'nullable-number',
      },
    ],
  },
  {
    eventKind: 'request-abort',
    fields: [
      {
        name: 'requestIndex',
        valueKind: 'number',
      },
    ],
  },
  {
    eventKind: 'retry-schedule',
    fields: [
      {
        name: 'delay',
        valueKind: 'number',
      },
    ],
  },
  {
    eventKind: 'should-retry',
    fields: [
      {
        name: 'retryAttempt',
        valueKind: 'number',
      },
      {
        name: 'decision',
        valueKind: 'boolean',
      },
    ],
  },
  {
    eventKind: 'source-close',
    fields: [],
  },
  {
    eventKind: 'source-open',
    fields: [
      {
        name: 'inputKind',
        valueKind: 'string',
      },
      {
        name: 'size',
        valueKind: 'nullable-number',
      },
    ],
  },
  {
    eventKind: 'success',
    fields: [],
  },
  {
    eventKind: 'upload-url-available',
    fields: [],
  },
  {
    eventKind: 'url-storage-add',
    fields: [
      {
        name: 'fingerprint',
        valueKind: 'string',
      },
      {
        name: 'uploadUrl',
        valueKind: 'nullable-string',
      },
    ],
  },
  {
    eventKind: 'url-storage-find',
    fields: [
      {
        name: 'fingerprint',
        valueKind: 'string',
      },
      {
        name: 'count',
        valueKind: 'number',
      },
    ],
  },
  {
    eventKind: 'url-storage-remove',
    fields: [
      {
        name: 'urlStorageKey',
        valueKind: 'string',
      },
    ],
  },
]

export const tusManagedUpload = {
  capabilities: {
    cleanup: {
      policies: [
        'absent-after-source-unavailable',
        'remove-owned-source-after-success',
        'remove-owned-source-after-cancel',
        'retain-owned-source-while-deferred',
        'retain-owned-source-after-permanent-failure',
        'retain-source-after-retryable-failure',
        'remove-managed-state-after-terminal-retention',
      ],
    },
    failureClassification: {
      permanentFailures: [
        'source-unavailable',
        'unretryable-protocol-error',
        'retry-policy-exhausted',
      ],
      retryableFailures: ['retryable-protocol-error', 'io-error', 'network-unavailable'],
    },
    networkConstraints: {
      options: ['any-network', 'unmetered-network'],
    },
    retryPolicy: {
      controls: [
        'max-attempts',
        'deadline',
        'progress-sensitive-budget',
        'unbounded-until-permanent-failure',
      ],
      permanentFailure: 'stop-without-retry',
      progressReset: 'reset-budget-after-accepted-offset-advances',
    },
    scheduling: {
      strategies: ['foreground-task', 'process-lifetime-worker-pool', 'durable-os-scheduler'],
    },
    sourceDurability: {
      ownedCopyCleanup: 'after-success-or-cancel',
      strategies: ['copy-to-owned-storage', 'reference-original-source', 'memory-only'],
    },
    stateReporting: {
      states: ['pending', 'running', 'succeeded', 'failed'],
      terminalRetention: 'session-and-next-launch',
      transientRetention: 'until-terminal',
    },
  },
  conformance: {
    scenarioIds: [
      'managedUploadDurableRetry',
      'managedUploadPermanentFailure',
      'managedUploadRetryPolicyExhausted',
      'managedUploadSourceUnavailable',
      'managedUploadNetworkConstraint',
    ],
    status: 'covered-by-generated-scenario',
  },
  description:
    'Submit upload work that can make sources durable, schedule/resume execution, retry, report state, and clean up while reusing the raw TUS protocol features underneath.',
  featureId: 'managedUpload',
  flow: [
    {
      kind: 'managed-primitive',
      primitive: 'accept-upload-submission',
      summary: 'Accept source, metadata, headers, endpoint, and retry/scheduling policy.',
    },
    {
      kind: 'managed-primitive',
      primitive: 'make-source-durable',
      summary: 'Keep the source readable according to the selected runtime durability strategy.',
    },
    {
      kind: 'managed-primitive',
      primitive: 'schedule-upload-work',
      summary: 'Run upload work according to the runtime scheduler capability.',
    },
    {
      featureId: 'singleUploadLifecycle',
      kind: 'protocol-feature',
      summary: 'Use the raw protocol upload lifecycle for each execution attempt.',
    },
    {
      featureId: 'retryOffsetRecovery',
      kind: 'protocol-feature',
      summary: 'Use protocol retry and offset recovery before classifying terminal failure.',
    },
    {
      kind: 'managed-primitive',
      primitive: 'publish-upload-state',
      summary: 'Expose pending, running, succeeded, and failed state snapshots.',
    },
    {
      kind: 'managed-primitive',
      primitive: 'cleanup-managed-upload',
      summary: 'Remove owned sources and terminal state according to cleanup policy.',
    },
  ],
  layer: 'feature-over-protocol',
  primitives: [
    'accept-upload-submission',
    'make-source-durable',
    'schedule-upload-work',
    'run-protocol-upload',
    'apply-managed-retry-policy',
    'classify-failure',
    'publish-upload-state',
    'cleanup-managed-upload',
  ],
  protocolPrimitives: [
    'store-resume-url',
    'resume-from-previous-upload',
    'recover-offset-after-error',
    'retry-with-backoff',
    'emit-progress',
    'emit-chunk-complete',
    'terminate-upload',
  ],
  runtimeProfiles: [
    {
      networkConstraints: ['any-network', 'unmetered-network'],
      runtime: 'android',
      scheduler: 'durable-os-scheduler',
      sourceDurability: ['copy-to-owned-storage', 'reference-original-source'],
      stateBackend: 'platform-key-value-store',
    },
    {
      networkConstraints: ['any-network', 'unmetered-network'],
      runtime: 'ios',
      scheduler: 'durable-os-scheduler',
      sourceDurability: ['copy-to-owned-storage', 'reference-original-source'],
      stateBackend: 'platform-key-value-store',
    },
    {
      networkConstraints: ['any-network'],
      runtime: 'browser',
      scheduler: 'foreground-task',
      sourceDurability: ['reference-original-source', 'memory-only'],
      stateBackend: 'web-storage',
    },
    {
      networkConstraints: ['any-network'],
      runtime: 'java',
      scheduler: 'process-lifetime-worker-pool',
      sourceDurability: ['copy-to-owned-storage', 'reference-original-source'],
      stateBackend: 'filesystem',
    },
    {
      networkConstraints: ['any-network'],
      runtime: 'node',
      scheduler: 'process-lifetime-worker-pool',
      sourceDurability: ['copy-to-owned-storage', 'reference-original-source', 'memory-only'],
      stateBackend: 'filesystem',
    },
    {
      networkConstraints: ['any-network'],
      runtime: 'react-native',
      scheduler: 'foreground-task',
      sourceDurability: ['reference-original-source', 'memory-only'],
      stateBackend: 'platform-key-value-store',
    },
  ],
  scenarios: [
    {
      proofs: [
        {
          attempts: [
            {
              attemptIndex: 0,
              failure: {
                afterAcceptedOffset: 7,
                kind: 'io-error',
                phase: 'after-accepted-offset',
              },
              requests: [
                {
                  bodySize: 0,
                  headers: {
                    'Upload-Length': '14',
                  },
                  operationId: 'createTusUpload',
                  response: {
                    headers: {
                      Location: 'https://tus.io/uploads/managed-durable-retry',
                    },
                    statusCode: 201,
                  },
                  url: 'endpoint',
                },
                {
                  bodySize: 7,
                  headers: {
                    'Upload-Offset': '0',
                  },
                  operationId: 'patchTusUpload',
                  response: {
                    headers: {
                      'Upload-Offset': '7',
                    },
                    statusCode: 204,
                  },
                  url: 'upload',
                },
              ],
              stateAfterAttempt: 'failed',
            },
            {
              attemptIndex: 1,
              requests: [
                {
                  headers: {},
                  operationId: 'getTusUploadOffset',
                  response: {
                    headers: {
                      'Upload-Length': '14',
                      'Upload-Offset': '7',
                    },
                    statusCode: 200,
                  },
                  url: 'upload',
                },
                {
                  bodySize: 7,
                  headers: {
                    'Upload-Offset': '7',
                  },
                  operationId: 'patchTusUpload',
                  response: {
                    headers: {
                      'Upload-Offset': '14',
                    },
                    statusCode: 204,
                  },
                  url: 'upload',
                },
              ],
              stateAfterAttempt: 'succeeded',
            },
          ],
          cleanup: {
            ownedSource: 'remove-owned-source-after-success',
            resumeUrl: 'remove-after-success',
          },
          input: {
            chunkSize: 7,
            content: 'hello managed!',
            fingerprint: 'managed-durable-retry-fingerprint',
            metadata: {
              filename: 'managed.txt',
            },
            uploadPath: 'managed-durable-retry',
          },
          network: {
            current: 'unmetered-network',
            decision: 'start-upload-work',
            required: 'any-network',
          },
          outcome: {
            kind: 'terminal',
            state: 'succeeded',
          },
          retryDelays: [0],
          sourceAvailability: 'available',
          sourceDurability: 'copy-to-owned-storage',
          states: ['pending', 'running', 'failed', 'running', 'succeeded'],
          runtime: 'java',
          scheduler: 'process-lifetime-worker-pool',
          stateBackend: 'filesystem',
        },
        {
          attempts: [
            {
              attemptIndex: 0,
              failure: {
                afterAcceptedOffset: 7,
                kind: 'io-error',
                phase: 'after-accepted-offset',
              },
              requests: [
                {
                  bodySize: 0,
                  headers: {
                    'Upload-Length': '14',
                  },
                  operationId: 'createTusUpload',
                  response: {
                    headers: {
                      Location: 'https://tus.io/uploads/managed-durable-retry',
                    },
                    statusCode: 201,
                  },
                  url: 'endpoint',
                },
                {
                  bodySize: 7,
                  headers: {
                    'Upload-Offset': '0',
                  },
                  operationId: 'patchTusUpload',
                  response: {
                    headers: {
                      'Upload-Offset': '7',
                    },
                    statusCode: 204,
                  },
                  url: 'upload',
                },
              ],
              stateAfterAttempt: 'failed',
            },
            {
              attemptIndex: 1,
              requests: [
                {
                  headers: {},
                  operationId: 'getTusUploadOffset',
                  response: {
                    headers: {
                      'Upload-Length': '14',
                      'Upload-Offset': '7',
                    },
                    statusCode: 200,
                  },
                  url: 'upload',
                },
                {
                  bodySize: 7,
                  headers: {
                    'Upload-Offset': '7',
                  },
                  operationId: 'patchTusUpload',
                  response: {
                    headers: {
                      'Upload-Offset': '14',
                    },
                    statusCode: 204,
                  },
                  url: 'upload',
                },
              ],
              stateAfterAttempt: 'succeeded',
            },
          ],
          cleanup: {
            ownedSource: 'remove-owned-source-after-success',
            resumeUrl: 'remove-after-success',
          },
          input: {
            chunkSize: 7,
            content: 'hello managed!',
            fingerprint: 'managed-durable-retry-fingerprint',
            metadata: {
              filename: 'managed.txt',
            },
            uploadPath: 'managed-durable-retry',
          },
          network: {
            current: 'unmetered-network',
            decision: 'start-upload-work',
            required: 'any-network',
          },
          outcome: {
            kind: 'terminal',
            state: 'succeeded',
          },
          retryDelays: [0],
          sourceAvailability: 'available',
          sourceDurability: 'copy-to-owned-storage',
          states: ['pending', 'running', 'failed', 'running', 'succeeded'],
          runtime: 'android',
          scheduler: 'durable-os-scheduler',
          stateBackend: 'platform-key-value-store',
        },
      ],
      requiredPrimitives: [
        'accept-upload-submission',
        'make-source-durable',
        'schedule-upload-work',
        'run-protocol-upload',
        'apply-managed-retry-policy',
        'publish-upload-state',
        'cleanup-managed-upload',
      ],
      scenarioId: 'managedUploadDurableRetry',
      summary:
        'Submit a durable source, survive scheduler/process interruption, resume by stored upload URL, and finish with cleanup.',
    },
    {
      proofs: [
        {
          attempts: [
            {
              attemptIndex: 0,
              failure: {
                kind: 'unretryable-protocol-error',
                phase: 'during-protocol-request',
              },
              requests: [
                {
                  bodySize: 0,
                  headers: {
                    'Upload-Length': '14',
                  },
                  operationId: 'createTusUpload',
                  response: {
                    headers: {},
                    statusCode: 400,
                  },
                  url: 'endpoint',
                },
              ],
              stateAfterAttempt: 'failed',
            },
          ],
          cleanup: {
            ownedSource: 'retain-owned-source-after-permanent-failure',
            resumeUrl: 'absent-after-permanent-failure',
          },
          input: {
            chunkSize: 7,
            content: 'hello failure!',
            fingerprint: 'managed-permanent-failure-fingerprint',
            metadata: {
              filename: 'managed-permanent-failure.txt',
            },
            uploadPath: 'managed-permanent-failure',
          },
          network: {
            current: 'unmetered-network',
            decision: 'start-upload-work',
            required: 'any-network',
          },
          outcome: {
            failure: 'unretryable-protocol-error',
            kind: 'terminal',
            state: 'failed',
          },
          retryDelays: [],
          sourceAvailability: 'available',
          sourceDurability: 'copy-to-owned-storage',
          states: ['pending', 'running', 'failed'],
          runtime: 'java',
          scheduler: 'process-lifetime-worker-pool',
          stateBackend: 'filesystem',
        },
        {
          attempts: [
            {
              attemptIndex: 0,
              failure: {
                kind: 'unretryable-protocol-error',
                phase: 'during-protocol-request',
              },
              requests: [
                {
                  bodySize: 0,
                  headers: {
                    'Upload-Length': '14',
                  },
                  operationId: 'createTusUpload',
                  response: {
                    headers: {},
                    statusCode: 400,
                  },
                  url: 'endpoint',
                },
              ],
              stateAfterAttempt: 'failed',
            },
          ],
          cleanup: {
            ownedSource: 'retain-owned-source-after-permanent-failure',
            resumeUrl: 'absent-after-permanent-failure',
          },
          input: {
            chunkSize: 7,
            content: 'hello failure!',
            fingerprint: 'managed-permanent-failure-fingerprint',
            metadata: {
              filename: 'managed-permanent-failure.txt',
            },
            uploadPath: 'managed-permanent-failure',
          },
          network: {
            current: 'unmetered-network',
            decision: 'start-upload-work',
            required: 'any-network',
          },
          outcome: {
            failure: 'unretryable-protocol-error',
            kind: 'terminal',
            state: 'failed',
          },
          retryDelays: [],
          sourceAvailability: 'available',
          sourceDurability: 'copy-to-owned-storage',
          states: ['pending', 'running', 'failed'],
          runtime: 'android',
          scheduler: 'durable-os-scheduler',
          stateBackend: 'platform-key-value-store',
        },
      ],
      requiredPrimitives: [
        'accept-upload-submission',
        'make-source-durable',
        'schedule-upload-work',
        'run-protocol-upload',
        'classify-failure',
        'publish-upload-state',
        'cleanup-managed-upload',
      ],
      scenarioId: 'managedUploadPermanentFailure',
      summary: 'Classify unretryable protocol failures as terminal without further retry.',
    },
    {
      proofs: [
        {
          attempts: [
            {
              attemptIndex: 0,
              failure: {
                kind: 'retryable-protocol-error',
                phase: 'during-protocol-request',
              },
              requests: [
                {
                  bodySize: 0,
                  headers: {
                    'Upload-Length': '14',
                  },
                  operationId: 'createTusUpload',
                  response: {
                    headers: {},
                    statusCode: 500,
                  },
                  url: 'endpoint',
                },
              ],
              stateAfterAttempt: 'failed',
            },
            {
              attemptIndex: 1,
              failure: {
                kind: 'retryable-protocol-error',
                phase: 'during-protocol-request',
              },
              requests: [
                {
                  bodySize: 0,
                  headers: {
                    'Upload-Length': '14',
                  },
                  operationId: 'createTusUpload',
                  response: {
                    headers: {},
                    statusCode: 500,
                  },
                  url: 'endpoint',
                },
              ],
              stateAfterAttempt: 'failed',
            },
            {
              attemptIndex: 2,
              failure: {
                kind: 'retryable-protocol-error',
                phase: 'during-protocol-request',
              },
              requests: [
                {
                  bodySize: 0,
                  headers: {
                    'Upload-Length': '14',
                  },
                  operationId: 'createTusUpload',
                  response: {
                    headers: {},
                    statusCode: 500,
                  },
                  url: 'endpoint',
                },
              ],
              stateAfterAttempt: 'failed',
            },
          ],
          cleanup: {
            ownedSource: 'retain-owned-source-after-permanent-failure',
            resumeUrl: 'absent-after-permanent-failure',
          },
          input: {
            chunkSize: 7,
            content: 'hello retries!',
            fingerprint: 'managed-retry-exhausted-fingerprint',
            metadata: {
              filename: 'managed-retry-exhausted.txt',
            },
            uploadPath: 'managed-retry-exhausted',
          },
          network: {
            current: 'unmetered-network',
            decision: 'start-upload-work',
            required: 'any-network',
          },
          outcome: {
            failure: 'retry-policy-exhausted',
            kind: 'terminal',
            state: 'failed',
          },
          retryDelays: [0, 0],
          sourceAvailability: 'available',
          sourceDurability: 'copy-to-owned-storage',
          states: ['pending', 'running', 'failed', 'running', 'failed', 'running', 'failed'],
          runtime: 'java',
          scheduler: 'process-lifetime-worker-pool',
          stateBackend: 'filesystem',
        },
        {
          attempts: [
            {
              attemptIndex: 0,
              failure: {
                kind: 'retryable-protocol-error',
                phase: 'during-protocol-request',
              },
              requests: [
                {
                  bodySize: 0,
                  headers: {
                    'Upload-Length': '14',
                  },
                  operationId: 'createTusUpload',
                  response: {
                    headers: {},
                    statusCode: 500,
                  },
                  url: 'endpoint',
                },
              ],
              stateAfterAttempt: 'failed',
            },
            {
              attemptIndex: 1,
              failure: {
                kind: 'retryable-protocol-error',
                phase: 'during-protocol-request',
              },
              requests: [
                {
                  bodySize: 0,
                  headers: {
                    'Upload-Length': '14',
                  },
                  operationId: 'createTusUpload',
                  response: {
                    headers: {},
                    statusCode: 500,
                  },
                  url: 'endpoint',
                },
              ],
              stateAfterAttempt: 'failed',
            },
            {
              attemptIndex: 2,
              failure: {
                kind: 'retryable-protocol-error',
                phase: 'during-protocol-request',
              },
              requests: [
                {
                  bodySize: 0,
                  headers: {
                    'Upload-Length': '14',
                  },
                  operationId: 'createTusUpload',
                  response: {
                    headers: {},
                    statusCode: 500,
                  },
                  url: 'endpoint',
                },
              ],
              stateAfterAttempt: 'failed',
            },
          ],
          cleanup: {
            ownedSource: 'retain-owned-source-after-permanent-failure',
            resumeUrl: 'absent-after-permanent-failure',
          },
          input: {
            chunkSize: 7,
            content: 'hello retries!',
            fingerprint: 'managed-retry-exhausted-fingerprint',
            metadata: {
              filename: 'managed-retry-exhausted.txt',
            },
            uploadPath: 'managed-retry-exhausted',
          },
          network: {
            current: 'unmetered-network',
            decision: 'start-upload-work',
            required: 'any-network',
          },
          outcome: {
            failure: 'retry-policy-exhausted',
            kind: 'terminal',
            state: 'failed',
          },
          retryDelays: [0, 0],
          sourceAvailability: 'available',
          sourceDurability: 'copy-to-owned-storage',
          states: ['pending', 'running', 'failed', 'running', 'failed', 'running', 'failed'],
          runtime: 'android',
          scheduler: 'durable-os-scheduler',
          stateBackend: 'platform-key-value-store',
        },
      ],
      requiredPrimitives: [
        'accept-upload-submission',
        'make-source-durable',
        'schedule-upload-work',
        'run-protocol-upload',
        'apply-managed-retry-policy',
        'classify-failure',
        'publish-upload-state',
        'cleanup-managed-upload',
      ],
      scenarioId: 'managedUploadRetryPolicyExhausted',
      summary:
        'Retry transient protocol failures up to the managed retry budget and then classify the upload as terminally failed.',
    },
    {
      proofs: [
        {
          attempts: [
            {
              attemptIndex: 0,
              failure: {
                kind: 'source-unavailable',
                phase: 'before-protocol-request',
              },
              requests: [],
              stateAfterAttempt: 'failed',
            },
          ],
          cleanup: {
            ownedSource: 'absent-after-source-unavailable',
            resumeUrl: 'absent-after-permanent-failure',
          },
          input: {
            chunkSize: 7,
            content: 'hello missing!',
            fingerprint: 'managed-source-unavailable-fingerprint',
            metadata: {
              filename: 'managed-source-unavailable.txt',
            },
            uploadPath: 'managed-source-unavailable',
          },
          network: {
            current: 'unmetered-network',
            decision: 'start-upload-work',
            required: 'any-network',
          },
          outcome: {
            failure: 'source-unavailable',
            kind: 'terminal',
            state: 'failed',
          },
          retryDelays: [],
          sourceAvailability: 'missing-before-durable-copy',
          sourceDurability: 'copy-to-owned-storage',
          states: ['pending', 'running', 'failed'],
          runtime: 'java',
          scheduler: 'process-lifetime-worker-pool',
          stateBackend: 'filesystem',
        },
        {
          attempts: [
            {
              attemptIndex: 0,
              failure: {
                kind: 'source-unavailable',
                phase: 'before-protocol-request',
              },
              requests: [],
              stateAfterAttempt: 'failed',
            },
          ],
          cleanup: {
            ownedSource: 'absent-after-source-unavailable',
            resumeUrl: 'absent-after-permanent-failure',
          },
          input: {
            chunkSize: 7,
            content: 'hello missing!',
            fingerprint: 'managed-source-unavailable-fingerprint',
            metadata: {
              filename: 'managed-source-unavailable.txt',
            },
            uploadPath: 'managed-source-unavailable',
          },
          network: {
            current: 'unmetered-network',
            decision: 'start-upload-work',
            required: 'any-network',
          },
          outcome: {
            failure: 'source-unavailable',
            kind: 'terminal',
            state: 'failed',
          },
          retryDelays: [],
          sourceAvailability: 'missing-before-durable-copy',
          sourceDurability: 'copy-to-owned-storage',
          states: ['pending', 'running', 'failed'],
          runtime: 'android',
          scheduler: 'durable-os-scheduler',
          stateBackend: 'platform-key-value-store',
        },
      ],
      requiredPrimitives: [
        'accept-upload-submission',
        'make-source-durable',
        'schedule-upload-work',
        'classify-failure',
        'publish-upload-state',
        'cleanup-managed-upload',
      ],
      scenarioId: 'managedUploadSourceUnavailable',
      summary:
        'Classify source disappearance before protocol requests as terminal without issuing a TUS request.',
    },
    {
      proofs: [
        {
          attempts: [],
          cleanup: {
            ownedSource: 'retain-owned-source-while-deferred',
            resumeUrl: 'absent-while-deferred',
          },
          input: {
            chunkSize: 7,
            content: 'hello later!',
            fingerprint: 'managed-network-constraint-fingerprint',
            metadata: {
              filename: 'managed-network-constraint.txt',
            },
            uploadPath: 'managed-network-constraint',
          },
          network: {
            current: 'metered-network',
            decision: 'defer-until-network-constraint-satisfied',
            required: 'unmetered-network',
          },
          outcome: {
            kind: 'deferred',
            reason: 'network-constraint-unsatisfied',
            state: 'pending',
          },
          retryDelays: [],
          sourceAvailability: 'available',
          sourceDurability: 'copy-to-owned-storage',
          states: ['pending'],
          runtime: 'android',
          scheduler: 'durable-os-scheduler',
          stateBackend: 'platform-key-value-store',
        },
      ],
      requiredPrimitives: [
        'accept-upload-submission',
        'make-source-durable',
        'schedule-upload-work',
        'publish-upload-state',
      ],
      scenarioId: 'managedUploadNetworkConstraint',
      summary: 'Honor network constraints before starting or resuming upload work.',
    },
  ],
}

export const tusManagedUploadProofCases = [
  {
    featureId: 'managedUpload',
    layer: 'feature-over-protocol',
    proofRuntimes: ['java', 'android'],
    protocolFeatureIds: ['singleUploadLifecycle', 'retryOffsetRecovery'],
    requiredPrimitives: [
      'accept-upload-submission',
      'make-source-durable',
      'schedule-upload-work',
      'run-protocol-upload',
      'apply-managed-retry-policy',
      'publish-upload-state',
      'cleanup-managed-upload',
    ],
    runtimeProfiles: ['android', 'ios', 'browser', 'java', 'node', 'react-native'],
    scenarioId: 'managedUploadDurableRetry',
  },
  {
    featureId: 'managedUpload',
    layer: 'feature-over-protocol',
    proofRuntimes: ['java', 'android'],
    protocolFeatureIds: ['singleUploadLifecycle', 'retryOffsetRecovery'],
    requiredPrimitives: [
      'accept-upload-submission',
      'make-source-durable',
      'schedule-upload-work',
      'run-protocol-upload',
      'classify-failure',
      'publish-upload-state',
      'cleanup-managed-upload',
    ],
    runtimeProfiles: ['android', 'ios', 'browser', 'java', 'node', 'react-native'],
    scenarioId: 'managedUploadPermanentFailure',
  },
  {
    featureId: 'managedUpload',
    layer: 'feature-over-protocol',
    proofRuntimes: ['java', 'android'],
    protocolFeatureIds: ['singleUploadLifecycle', 'retryOffsetRecovery'],
    requiredPrimitives: [
      'accept-upload-submission',
      'make-source-durable',
      'schedule-upload-work',
      'run-protocol-upload',
      'apply-managed-retry-policy',
      'classify-failure',
      'publish-upload-state',
      'cleanup-managed-upload',
    ],
    runtimeProfiles: ['android', 'ios', 'browser', 'java', 'node', 'react-native'],
    scenarioId: 'managedUploadRetryPolicyExhausted',
  },
  {
    featureId: 'managedUpload',
    layer: 'feature-over-protocol',
    proofRuntimes: ['java', 'android'],
    protocolFeatureIds: ['singleUploadLifecycle', 'retryOffsetRecovery'],
    requiredPrimitives: [
      'accept-upload-submission',
      'make-source-durable',
      'schedule-upload-work',
      'classify-failure',
      'publish-upload-state',
      'cleanup-managed-upload',
    ],
    runtimeProfiles: ['android', 'ios', 'browser', 'java', 'node', 'react-native'],
    scenarioId: 'managedUploadSourceUnavailable',
  },
  {
    featureId: 'managedUpload',
    layer: 'feature-over-protocol',
    proofRuntimes: ['android'],
    protocolFeatureIds: ['singleUploadLifecycle', 'retryOffsetRecovery'],
    requiredPrimitives: [
      'accept-upload-submission',
      'make-source-durable',
      'schedule-upload-work',
      'publish-upload-state',
    ],
    runtimeProfiles: ['android', 'ios', 'browser', 'java', 'node', 'react-native'],
    scenarioId: 'managedUploadNetworkConstraint',
  },
]

export const tusClientConformanceScenarios = [
  {
    behavior: 'single-upload-lifecycle',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/generated-contract',
    eventKeyAlternativeGroups: [[], [], [], [], [], [], [], []],
    eventKeyExtraPrefixes: ['progress:'],
    eventKeys: [
      'fingerprint:contract-single-fingerprint',
      'upload-url-available',
      'url-storage-add:contract-single-fingerprint:https://tus.io/uploads/generated-contract',
      'progress:0:11',
      'progress:11:11',
      'chunk-complete:11:11:11',
      'success',
      'source-close',
    ],
    eventKinds: [
      'fingerprint',
      'upload-url-available',
      'url-storage-add',
      'progress',
      'chunk-complete',
      'success',
      'source-close',
    ],
    eventPolicy: {
      matching: 'exact-except-allowed-extra-events',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    executionActionPhases: [],
    featureId: 'singleUploadLifecycle',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
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
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/generated-contract',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/generated-contract',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'create-upload',
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 11,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '11',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'upload-chunk',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/generated-contract',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: true,
        value: 'contract-single-fingerprint',
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: true,
        storedUpload: null,
      },
    },
    scenarioId: 'singleUploadLifecycle',
    runtimes: [],
  },
  {
    behavior: 'creation-with-upload',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/creation-with-upload-contract',
    eventKeyAlternativeGroups: [[], [], [], [], []],
    eventKeyExtraPrefixes: ['progress:'],
    eventKeys: [
      'progress:0:11',
      'progress:11:11',
      'upload-url-available',
      'success',
      'source-close',
    ],
    eventKinds: ['progress', 'upload-url-available', 'success', 'source-close'],
    eventPolicy: {
      matching: 'exact-except-allowed-extra-events',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    executionActionPhases: [],
    featureId: 'creationWithUpload',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
      {
        key: 'uploadDataDuringCreation',
        value: true,
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: ['createTusUpload'],
    primitives: ['upload-during-creation', 'emit-progress'],
    requests: [
      {
        absentHeaders: [],
        abort: false,
        bodySize: 11,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/creation-with-upload-contract',
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/creation-with-upload-contract',
            'Upload-Offset': '11',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'create-upload',
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'creationWithUpload',
    runtimes: [],
  },
  {
    behavior: 'creation-with-upload-partial-chunk',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/creation-with-upload-partial-contract',
    eventKeyAlternativeGroups: [[], [], [], [], [], [], [], [], [], [], [], []],
    eventKeyExtraPrefixes: ['progress:'],
    eventKeys: [
      'progress:0:11',
      'progress:5:11',
      'upload-url-available',
      'chunk-complete:5:5:11',
      'progress:5:11',
      'progress:10:11',
      'chunk-complete:5:10:11',
      'progress:10:11',
      'progress:11:11',
      'chunk-complete:1:11:11',
      'success',
      'source-close',
    ],
    eventKinds: ['progress', 'upload-url-available', 'chunk-complete', 'success', 'source-close'],
    eventPolicy: {
      matching: 'exact-except-allowed-extra-events',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    executionActionPhases: [],
    featureId: 'creationWithUpload',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'chunkSize',
        value: 5,
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
      {
        key: 'uploadDataDuringCreation',
        value: true,
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['upload-during-creation', 'emit-progress'],
    requests: [
      {
        absentHeaders: [],
        abort: false,
        bodySize: 5,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/creation-with-upload-partial-contract',
            'Upload-Offset': '5',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/creation-with-upload-partial-contract',
            'Upload-Offset': '5',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'create-upload',
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 5,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '5',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '10',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '10',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'upload-chunk',
        uploadUrl: 'https://tus.io/uploads/creation-with-upload-partial-contract',
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '5',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/creation-with-upload-partial-contract',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 1,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '10',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '11',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'upload-final-chunk',
        uploadUrl: 'https://tus.io/uploads/creation-with-upload-partial-contract',
        url: 'upload',
        requestIndex: 2,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '10',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/creation-with-upload-partial-contract',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'creationWithUploadPartialChunk',
    runtimes: [],
  },
  {
    behavior: 'creation-with-upload',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/ietf-draft-05-contract',
    eventKeyAlternativeGroups: [[], [], [], [], []],
    eventKeyExtraPrefixes: ['progress:'],
    eventKeys: [
      'progress:0:11',
      'progress:11:11',
      'upload-url-available',
      'success',
      'source-close',
    ],
    eventKinds: ['progress', 'upload-url-available', 'success', 'source-close'],
    eventPolicy: {
      matching: 'exact-except-allowed-extra-events',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    executionActionPhases: [],
    featureId: 'protocolVersionSelection',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
      {
        key: 'protocol',
        value: 'ietf-draft-05',
      },
      {
        key: 'uploadDataDuringCreation',
        value: true,
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: ['createTusUpload'],
    primitives: ['select-client-protocol'],
    requests: [
      {
        absentHeaders: ['Tus-Resumable'],
        abort: false,
        bodySize: 11,
        errorMessage: null,
        headerMode: 'exact',
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: 'exact',
          headers: {
            Location: 'https://tus.io/uploads/ietf-draft-05-contract',
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/ietf-draft-05-contract',
            'Upload-Offset': '11',
          },
        },
        role: null,
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Upload-Draft-Interop-Version': '6',
          'Upload-Length': '11',
          'Upload-Complete': '?1',
          'Content-Type': 'application/partial-upload',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'ietfDraft05CreationWithUpload',
    runtimes: [],
  },
  {
    behavior: 'upload-body-headers',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/ietf-draft-05-chunked-contract',
    eventKeyAlternativeGroups: [[], [], [], [], [], [], [], [], [], [], [], []],
    eventKeyExtraPrefixes: ['progress:'],
    eventKeys: [
      'upload-url-available',
      'progress:0:11',
      'progress:5:11',
      'chunk-complete:5:5:11',
      'progress:5:11',
      'progress:10:11',
      'chunk-complete:5:10:11',
      'progress:10:11',
      'progress:11:11',
      'chunk-complete:1:11:11',
      'success',
      'source-close',
    ],
    eventKinds: ['upload-url-available', 'progress', 'chunk-complete', 'success', 'source-close'],
    eventPolicy: {
      matching: 'exact-except-allowed-extra-events',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    executionActionPhases: [],
    featureId: 'protocolVersionSelection',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'chunkSize',
        value: 5,
      },
      {
        key: 'protocol',
        value: 'ietf-draft-05',
      },
      {
        key: 'uploadUrl',
        value: 'https://tus.io/uploads/ietf-draft-05-chunked-contract',
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: ['getTusUploadOffset', 'patchTusUpload'],
    primitives: ['select-client-protocol'],
    requests: [
      {
        absentHeaders: ['Tus-Resumable'],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: 'exact',
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'getTusUploadOffset',
        response: {
          body: null,
          headerMode: 'exact',
          headers: {
            'Upload-Length': '11',
            'Upload-Offset': '0',
          },
          headersSpecified: true,
          statusCode: 200,
          effectiveHeaders: {
            'Upload-Length': '11',
            'Upload-Offset': '0',
          },
        },
        role: null,
        uploadUrl: null,
        url: 'upload',
        requestIndex: 0,
        effectiveHeaders: {
          'Upload-Draft-Interop-Version': '6',
        },
        effectiveMethod: 'HEAD',
        expectedUrl: 'https://tus.io/uploads/ietf-draft-05-chunked-contract',
      },
      {
        absentHeaders: ['Tus-Resumable'],
        abort: false,
        bodySize: 5,
        errorMessage: null,
        headerMode: 'exact',
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: 'exact',
          headers: {
            'Upload-Offset': '5',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '5',
          },
        },
        role: 'upload-chunk',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Upload-Draft-Interop-Version': '6',
          'Upload-Complete': '?0',
          'Content-Type': 'application/partial-upload',
          'Upload-Offset': '0',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/ietf-draft-05-chunked-contract',
      },
      {
        absentHeaders: ['Tus-Resumable'],
        abort: false,
        bodySize: 5,
        errorMessage: null,
        headerMode: 'exact',
        headers: {
          'Upload-Offset': '5',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: 'exact',
          headers: {
            'Upload-Offset': '10',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '10',
          },
        },
        role: 'upload-chunk',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 2,
        effectiveHeaders: {
          'Upload-Draft-Interop-Version': '6',
          'Upload-Complete': '?0',
          'Content-Type': 'application/partial-upload',
          'Upload-Offset': '5',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/ietf-draft-05-chunked-contract',
      },
      {
        absentHeaders: ['Tus-Resumable'],
        abort: false,
        bodySize: 1,
        errorMessage: null,
        headerMode: 'exact',
        headers: {
          'Upload-Offset': '10',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: 'exact',
          headers: {
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '11',
          },
        },
        role: 'upload-final-chunk',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 3,
        effectiveHeaders: {
          'Upload-Draft-Interop-Version': '6',
          'Upload-Complete': '?1',
          'Content-Type': 'application/partial-upload',
          'Upload-Offset': '10',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/ietf-draft-05-chunked-contract',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'ietfDraft05ChunkedUploadComplete',
    runtimes: [],
  },
  {
    behavior: 'upload-body-headers',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/ietf-draft-03-resume-contract',
    eventKeyAlternativeGroups: [[], [], [], [], [], []],
    eventKeyExtraPrefixes: ['progress:'],
    eventKeys: [
      'upload-url-available',
      'progress:5:11',
      'progress:11:11',
      'chunk-complete:6:11:11',
      'success',
      'source-close',
    ],
    eventKinds: ['upload-url-available', 'progress', 'chunk-complete', 'success', 'source-close'],
    eventPolicy: {
      matching: 'exact-except-allowed-extra-events',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    executionActionPhases: [],
    featureId: 'protocolVersionSelection',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'chunkSize',
        value: 6,
      },
      {
        key: 'protocol',
        value: 'ietf-draft-03',
      },
      {
        key: 'uploadUrl',
        value: 'https://tus.io/uploads/ietf-draft-03-resume-contract',
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: ['getTusUploadOffset', 'patchTusUpload'],
    primitives: ['select-client-protocol'],
    requests: [
      {
        absentHeaders: ['Tus-Resumable'],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: 'exact',
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'getTusUploadOffset',
        response: {
          body: null,
          headerMode: 'exact',
          headers: {
            'Upload-Offset': '5',
          },
          headersSpecified: true,
          statusCode: 200,
          effectiveHeaders: {
            'Upload-Offset': '5',
          },
        },
        role: null,
        uploadUrl: null,
        url: 'upload',
        requestIndex: 0,
        effectiveHeaders: {
          'Upload-Draft-Interop-Version': '5',
        },
        effectiveMethod: 'HEAD',
        expectedUrl: 'https://tus.io/uploads/ietf-draft-03-resume-contract',
      },
      {
        absentHeaders: ['Content-Type', 'Tus-Resumable'],
        abort: false,
        bodySize: 6,
        errorMessage: null,
        headerMode: 'exact',
        headers: {
          'Upload-Offset': '5',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: 'exact',
          headers: {
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '11',
          },
        },
        role: null,
        uploadUrl: null,
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Upload-Draft-Interop-Version': '5',
          'Upload-Complete': '?1',
          'Upload-Offset': '5',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/ietf-draft-03-resume-contract',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'ietfDraft03ResumeWithoutKnownLength',
    runtimes: [],
  },
  {
    behavior: 'start-option-validation',
    completionKind: 'error',
    completionMessage: 'tus: no file or stream to upload provided',
    completionReason: 'missingInput',
    completionUploadUrl: null,
    eventKeyAlternativeGroups: [],
    eventKeyExtraPrefixes: [],
    eventKeys: [],
    eventKinds: [],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'startOptionValidation',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
    ],
    inputSource: {
      content: '',
      kind: 'none',
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'startValidationMissingInput',
    runtimes: [],
  },
  {
    behavior: 'start-option-validation',
    completionKind: 'error',
    completionMessage: 'tus: neither an endpoint or an upload URL is provided',
    completionReason: 'missingEndpointOrUploadUrl',
    completionUploadUrl: null,
    eventKeyAlternativeGroups: [],
    eventKeyExtraPrefixes: [],
    eventKeys: [],
    eventKinds: [],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'startOptionValidation',
    inputOptionEntries: [],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'startValidationMissingEndpointOrUploadUrl',
    runtimes: [],
  },
  {
    behavior: 'start-option-validation',
    completionKind: 'error',
    completionMessage: 'tus: unsupported protocol tus-v9',
    completionReason: 'unsupportedProtocol',
    completionUploadUrl: null,
    eventKeyAlternativeGroups: [],
    eventKeyExtraPrefixes: [],
    eventKeys: [],
    eventKinds: [],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'startOptionValidation',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'protocol',
        value: 'tus-v9',
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'startValidationUnsupportedProtocol',
    runtimes: [],
  },
  {
    behavior: 'start-option-validation',
    completionKind: 'error',
    completionMessage: 'tus: the `retryDelays` option must either be an array or null',
    completionReason: 'retryDelaysNotArray',
    completionUploadUrl: null,
    eventKeyAlternativeGroups: [],
    eventKeyExtraPrefixes: [],
    eventKeys: [],
    eventKinds: [],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'startOptionValidation',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'rawOptions',
        value: {
          retryDelays: 44,
        },
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'startValidationRetryDelaysNotArray',
    runtimes: [],
  },
  {
    behavior: 'start-option-validation',
    completionKind: 'error',
    completionMessage: 'tus: cannot use the `uploadUrl` option when parallelUploads is enabled',
    completionReason: 'parallelUploadsWithUploadUrl',
    completionUploadUrl: null,
    eventKeyAlternativeGroups: [],
    eventKeyExtraPrefixes: [],
    eventKeys: [],
    eventKinds: [],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'startOptionValidation',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'parallelUploads',
        value: 2,
      },
      {
        key: 'uploadUrl',
        value: 'https://tus.io/uploads/start-validation-upload-url',
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'startValidationParallelUploadsWithUploadUrl',
    runtimes: [],
  },
  {
    behavior: 'start-option-validation',
    completionKind: 'error',
    completionMessage: 'tus: cannot use the `uploadSize` option when parallelUploads is enabled',
    completionReason: 'parallelUploadsWithUploadSize',
    completionUploadUrl: null,
    eventKeyAlternativeGroups: [],
    eventKeyExtraPrefixes: [],
    eventKeys: [],
    eventKinds: [],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'startOptionValidation',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'parallelUploads',
        value: 2,
      },
      {
        key: 'uploadSize',
        value: 11,
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'startValidationParallelUploadsWithUploadSize',
    runtimes: [],
  },
  {
    behavior: 'start-option-validation',
    completionKind: 'error',
    completionMessage:
      'tus: cannot use the `uploadLengthDeferred` option when parallelUploads is enabled',
    completionReason: 'parallelUploadsWithDeferredLength',
    completionUploadUrl: null,
    eventKeyAlternativeGroups: [],
    eventKeyExtraPrefixes: [],
    eventKeys: [],
    eventKinds: [],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'startOptionValidation',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'parallelUploads',
        value: 2,
      },
      {
        key: 'uploadLengthDeferred',
        value: true,
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'startValidationParallelUploadsWithDeferredLength',
    runtimes: [],
  },
  {
    behavior: 'start-option-validation',
    completionKind: 'error',
    completionMessage:
      'tus: cannot use the `uploadDataDuringCreation` option when parallelUploads is enabled',
    completionReason: 'parallelUploadsWithUploadDataDuringCreation',
    completionUploadUrl: null,
    eventKeyAlternativeGroups: [],
    eventKeyExtraPrefixes: [],
    eventKeys: [],
    eventKinds: [],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'startOptionValidation',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'parallelUploads',
        value: 2,
      },
      {
        key: 'uploadDataDuringCreation',
        value: true,
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'startValidationParallelUploadsWithUploadDataDuringCreation',
    runtimes: [],
  },
  {
    behavior: 'start-option-validation',
    completionKind: 'error',
    completionMessage:
      'tus: cannot use the `parallelUploadBoundaries` option when `parallelUploads` is disabled',
    completionReason: 'parallelBoundariesWithoutParallelUploads',
    completionUploadUrl: null,
    eventKeyAlternativeGroups: [],
    eventKeyExtraPrefixes: [],
    eventKeys: [],
    eventKinds: [],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'startOptionValidation',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'parallelUploadBoundaries',
        value: [
          {
            end: 5,
            start: 0,
          },
        ],
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'startValidationParallelBoundariesWithoutParallelUploads',
    runtimes: [],
  },
  {
    behavior: 'start-option-validation',
    completionKind: 'error',
    completionMessage:
      'tus: the `parallelUploadBoundaries` must have the same length as the value of `parallelUploads`',
    completionReason: 'parallelBoundariesLengthMismatch',
    completionUploadUrl: null,
    eventKeyAlternativeGroups: [],
    eventKeyExtraPrefixes: [],
    eventKeys: [],
    eventKinds: [],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'startOptionValidation',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'parallelUploads',
        value: 2,
      },
      {
        key: 'parallelUploadBoundaries',
        value: [
          {
            end: 5,
            start: 0,
          },
        ],
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'startValidationParallelBoundariesLengthMismatch',
    runtimes: [],
  },
  {
    behavior: 'detailed-error',
    completionKind: 'error',
    completionMessage:
      'tus: unexpected response while creating upload, originated from request (method: POST, url: https://tus.io/uploads, response code: 500, response text: server_error, request id: contract-request-id)',
    completionReason: 'unexpectedCreateResponse',
    completionUploadUrl: null,
    eventKeyAlternativeGroups: [],
    eventKeyExtraPrefixes: [],
    eventKeys: [],
    eventKinds: [],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'detailedErrors',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
      {
        key: 'headers',
        value: {
          'X-Request-ID': 'contract-request-id',
        },
      },
      {
        key: 'rawOptions',
        value: {
          retryDelays: null,
        },
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: ['createTusUpload'],
    primitives: ['report-detailed-errors'],
    requests: [
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: 'server_error',
          headerMode: null,
          headers: {},
          headersSpecified: false,
          statusCode: 500,
          effectiveHeaders: {},
        },
        role: null,
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
          'X-Request-ID': 'contract-request-id',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'detailedCreateResponseError',
    runtimes: [],
  },
  {
    behavior: 'detailed-error',
    completionKind: 'error',
    completionMessage:
      'tus: failed to create upload, caused by Error: socket down, originated from request (method: POST, url: https://tus.io/uploads, response code: n/a, response text: n/a, request id: contract-request-id)',
    completionReason: 'createUploadRequestFailed',
    completionUploadUrl: null,
    eventKeyAlternativeGroups: [],
    eventKeyExtraPrefixes: [],
    eventKeys: [],
    eventKinds: [],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'detailedErrors',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
      {
        key: 'headers',
        value: {
          'X-Request-ID': 'contract-request-id',
        },
      },
      {
        key: 'rawOptions',
        value: {
          retryDelays: null,
        },
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: ['createTusUpload'],
    primitives: ['report-detailed-errors'],
    requests: [
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: 'socket down',
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: null,
        role: null,
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
          'X-Request-ID': 'contract-request-id',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'detailedCreateRequestError',
    runtimes: [],
  },
  {
    behavior: 'upload-body-headers',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/upload-body-headers-contract',
    eventKeyAlternativeGroups: [],
    eventKeyExtraPrefixes: [],
    eventKeys: [],
    eventKinds: [],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'uploadBodyHeaders',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['send-upload-body-headers'],
    requests: [
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/upload-body-headers-contract',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/upload-body-headers-contract',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: null,
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 11,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '11',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: null,
        uploadUrl: null,
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/upload-body-headers-contract',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'uploadBodyHeaders',
    runtimes: [],
  },
  {
    behavior: 'custom-request-headers',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/custom-headers-contract',
    eventKeyAlternativeGroups: [],
    eventKeyExtraPrefixes: [],
    eventKeys: [],
    eventKinds: [],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'customRequestHeaders',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
      {
        key: 'headers',
        value: {
          'X-Tus-Contract': 'custom-header',
          'X-Tus-Trace': 'trace-123',
        },
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['apply-custom-request-headers'],
    requests: [
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/custom-headers-contract',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/custom-headers-contract',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'create-upload',
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
          'X-Tus-Contract': 'custom-header',
          'X-Tus-Trace': 'trace-123',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 11,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '11',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'upload-chunk',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
          'X-Tus-Contract': 'custom-header',
          'X-Tus-Trace': 'trace-123',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/custom-headers-contract',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: true,
        value: 'contract-custom-headers-fingerprint',
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'customRequestHeaders',
    runtimes: [],
  },
  {
    behavior: 'request-id-headers',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/request-id-contract',
    eventKeyAlternativeGroups: [],
    eventKeyExtraPrefixes: [],
    eventKeys: [],
    eventKinds: [],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'requestIdHeaders',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
      {
        key: 'headers',
        value: {
          'X-Request-ID': 'custom-request-id',
        },
      },
      {
        key: 'addRequestId',
        value: true,
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['add-request-id-header', 'apply-custom-request-headers'],
    requests: [
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/request-id-contract',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/request-id-contract',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'create-upload',
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
          'X-Request-ID': '00000000-0000-4000-8000-000000000000',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 11,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '11',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'upload-chunk',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
          'X-Request-ID': '00000000-0000-4000-8000-000000000000',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/request-id-contract',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: true,
        generatedRequestId: '00000000-0000-4000-8000-000000000000',
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'requestIdHeaders',
    runtimes: [],
  },
  {
    behavior: 'resume-from-previous-upload',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/resume-contract',
    eventKeyAlternativeGroups: [[], [], [], [], [], [], [], [], [], []],
    eventKeyExtraPrefixes: ['progress:'],
    eventKeys: [
      'fingerprint:contract-resume-fingerprint',
      'url-storage-find:contract-resume-fingerprint:1',
      'fingerprint:contract-resume-fingerprint',
      'upload-url-available',
      'progress:5:11',
      'progress:11:11',
      'chunk-complete:6:11:11',
      'url-storage-remove:tus::contract-resume-fingerprint::1337',
      'success',
      'source-close',
    ],
    eventKinds: [
      'fingerprint',
      'url-storage-find',
      'upload-url-available',
      'progress',
      'chunk-complete',
      'url-storage-remove',
      'success',
      'source-close',
    ],
    eventPolicy: {
      matching: 'exact-except-allowed-extra-events',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    executionActionPhases: [
      {
        actions: [
          {
            expectedPreviousUploadCount: 1,
            kind: 'resume-from-previous-upload',
            selectedPreviousUploadIndex: 0,
          },
        ],
        phase: 'beforeStart',
      },
    ],
    featureId: 'resumeUpload',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'removeFingerprintOnSuccess',
        value: true,
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: ['getTusUploadOffset', 'patchTusUpload'],
    primitives: ['fingerprint-input', 'resume-from-previous-upload', 'store-resume-url'],
    requests: [
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'getTusUploadOffset',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Length': '11',
            'Upload-Offset': '5',
          },
          headersSpecified: true,
          statusCode: 200,
          effectiveHeaders: {
            'Upload-Length': '11',
            'Upload-Offset': '5',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'recover-upload-offset',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
        },
        effectiveMethod: 'HEAD',
        expectedUrl: 'https://tus.io/uploads/resume-contract',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 6,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '5',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '11',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'upload-chunk',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '5',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/resume-contract',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: true,
        value: 'contract-resume-fingerprint',
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: true,
        storedUpload: {
          fingerprint: 'contract-resume-fingerprint',
          uploadUrl: 'https://tus.io/uploads/resume-contract',
          urlStorageKey: 'tus::contract-resume-fingerprint::1337',
        },
      },
    },
    scenarioId: 'resumeFromPreviousUpload',
    runtimes: [],
  },
  {
    behavior: 'relative-location-resolution',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/files/relative-contract',
    eventKeyAlternativeGroups: [[], [], [], [], [], []],
    eventKeyExtraPrefixes: ['progress:'],
    eventKeys: [
      'upload-url-available',
      'progress:0:11',
      'progress:11:11',
      'chunk-complete:11:11:11',
      'success',
      'source-close',
    ],
    eventKinds: ['upload-url-available', 'progress', 'chunk-complete', 'success', 'source-close'],
    eventPolicy: {
      matching: 'exact-except-allowed-extra-events',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    executionActionPhases: [],
    featureId: 'relativeLocationResolution',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/files/',
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['resolve-relative-location'],
    requests: [
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'relative-contract',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'relative-contract',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: null,
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/files/',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 11,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '11',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: null,
        uploadUrl: null,
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/files/relative-contract',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'relativeLocationResolution',
    runtimes: [],
  },
  {
    behavior: 'array-buffer-input',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/array-buffer-contract',
    eventKeyAlternativeGroups: [[], [], []],
    eventKeyExtraPrefixes: [],
    eventKeys: ['source-open:array-buffer:11', 'success', 'source-close'],
    eventKinds: ['source-open', 'success', 'source-close'],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'inputSources',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'array-buffer',
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['read-browser-file'],
    requests: [
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/array-buffer-contract',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/array-buffer-contract',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: null,
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 11,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '11',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: null,
        uploadUrl: null,
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/array-buffer-contract',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'arrayBufferInput',
    runtimes: [],
  },
  {
    behavior: 'array-buffer-view-input',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/array-buffer-view-contract',
    eventKeyAlternativeGroups: [[], [], []],
    eventKeyExtraPrefixes: [],
    eventKeys: ['source-open:array-buffer-view:11', 'success', 'source-close'],
    eventKinds: ['source-open', 'success', 'source-close'],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'inputSources',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'array-buffer-view',
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['read-browser-file'],
    requests: [
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/array-buffer-view-contract',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/array-buffer-view-contract',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: null,
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 11,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '11',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: null,
        uploadUrl: null,
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/array-buffer-view-contract',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'arrayBufferViewInput',
    runtimes: [],
  },
  {
    behavior: 'web-readable-stream-input',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/web-stream-contract',
    eventKeyAlternativeGroups: [[], [], []],
    eventKeyExtraPrefixes: [],
    eventKeys: ['source-open:web-readable-stream:null', 'success', 'source-close'],
    eventKinds: ['source-open', 'success', 'source-close'],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'inputSources',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'chunkSize',
        value: 100,
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
      {
        key: 'uploadLengthDeferred',
        value: true,
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'web-readable-stream',
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['read-web-stream'],
    requests: [
      {
        absentHeaders: ['Upload-Length'],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/web-stream-contract',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/web-stream-contract',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: null,
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Defer-Length': '1',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 11,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '11',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: null,
        uploadUrl: null,
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/web-stream-contract',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: true,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'webReadableStreamInput',
    runtimes: [],
  },
  {
    behavior: 'node-readable-stream-input',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/node-stream-contract',
    eventKeyAlternativeGroups: [[], [], []],
    eventKeyExtraPrefixes: [],
    eventKeys: ['source-open:node-readable-stream:null', 'success', 'source-close'],
    eventKinds: ['source-open', 'success', 'source-close'],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'inputSources',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'chunkSize',
        value: 100,
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
      {
        key: 'uploadLengthDeferred',
        value: true,
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'node-readable-stream',
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['read-node-stream'],
    requests: [
      {
        absentHeaders: ['Upload-Length'],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/node-stream-contract',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/node-stream-contract',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: null,
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Defer-Length': '1',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 11,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '11',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: null,
        uploadUrl: null,
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/node-stream-contract',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: true,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'nodeReadableStreamInput',
    runtimes: ['node'],
  },
  {
    behavior: 'node-path-input',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/node-path-contract',
    eventKeyAlternativeGroups: [[], [], []],
    eventKeyExtraPrefixes: [],
    eventKeys: ['source-open:node-path-reference:11', 'success', 'source-close'],
    eventKinds: ['source-open', 'success', 'source-close'],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'inputSources',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'node-path-reference',
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['read-node-file'],
    requests: [
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/node-path-contract',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/node-path-contract',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'create-upload',
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 11,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '11',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'upload-chunk',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/node-path-contract',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'nodePathInput',
    runtimes: ['node'],
  },
  {
    behavior: 'deferred-length-upload',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/deferred-contract',
    eventKeyAlternativeGroups: [[], [], [], [], [], []],
    eventKeyExtraPrefixes: ['progress:'],
    eventKeys: [
      'upload-url-available',
      'progress:0:11',
      'progress:11:11',
      'chunk-complete:11:11:11',
      'success',
      'source-close',
    ],
    eventKinds: ['upload-url-available', 'progress', 'chunk-complete', 'success', 'source-close'],
    eventPolicy: {
      deferredLengthBytesTotal: 'allow-known-total-before-declaration',
      matching: 'exact-except-allowed-extra-events',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    executionActionPhases: [],
    featureId: 'deferredLengthUpload',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'chunkSize',
        value: 100,
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
      {
        key: 'uploadLengthDeferred',
        value: true,
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'web-readable-stream',
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['defer-upload-length', 'emit-progress'],
    requests: [
      {
        absentHeaders: ['Upload-Length'],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/deferred-contract',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/deferred-contract',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'create-upload',
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Defer-Length': '1',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 11,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '11',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'upload-chunk',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/deferred-contract',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: true,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'deferredLengthUpload',
    runtimes: [],
  },
  {
    behavior: 'deferred-length-upload',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/deferred-chunked-contract',
    eventKeyAlternativeGroups: [
      [],
      ['progress:0:11'],
      ['progress:5:11'],
      ['chunk-complete:5:5:11'],
      ['progress:5:11'],
      ['progress:10:11'],
      ['chunk-complete:5:10:11'],
      [],
      [],
      [],
      [],
      [],
    ],
    eventKeyExtraPrefixes: ['progress:'],
    eventKeys: [
      'upload-url-available',
      'progress:0:null',
      'progress:5:null',
      'chunk-complete:5:5:null',
      'progress:5:null',
      'progress:10:null',
      'chunk-complete:5:10:null',
      'progress:10:11',
      'progress:11:11',
      'chunk-complete:1:11:11',
      'success',
      'source-close',
    ],
    eventKinds: ['upload-url-available', 'progress', 'chunk-complete', 'success', 'source-close'],
    eventPolicy: {
      deferredLengthBytesTotal: 'allow-known-total-before-declaration',
      matching: 'exact-except-allowed-extra-events',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    executionActionPhases: [],
    featureId: 'deferredLengthUpload',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'chunkSize',
        value: 5,
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
      {
        key: 'uploadLengthDeferred',
        value: true,
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['defer-upload-length', 'emit-chunk-complete', 'emit-progress'],
    requests: [
      {
        absentHeaders: ['Upload-Length'],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/deferred-chunked-contract',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/deferred-chunked-contract',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'create-upload',
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Defer-Length': '1',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 5,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '5',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '5',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'upload-chunk',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/deferred-chunked-contract',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 5,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '5',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '10',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '10',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'upload-chunk',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 2,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '5',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/deferred-chunked-contract',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 1,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '10',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '11',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'upload-final-chunk',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 3,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '10',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/deferred-chunked-contract',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'deferredLengthChunkedUpload',
    runtimes: [],
  },
  {
    behavior: 'override-patch-method',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/override-contract',
    eventKeyAlternativeGroups: [],
    eventKeyExtraPrefixes: [],
    eventKeys: [],
    eventKinds: [],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'overridePatchMethod',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'overridePatchMethod',
        value: true,
      },
      {
        key: 'uploadUrl',
        value: 'https://tus.io/uploads/override-contract',
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: ['getTusUploadOffset', 'patchTusUpload'],
    primitives: ['override-patch-method'],
    requests: [
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'getTusUploadOffset',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Length': '11',
            'Upload-Offset': '3',
          },
          headersSpecified: true,
          statusCode: 200,
          effectiveHeaders: {
            'Upload-Length': '11',
            'Upload-Offset': '3',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'recover-upload-offset',
        uploadUrl: 'https://tus.io/uploads/override-contract',
        url: 'upload',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
        },
        effectiveMethod: 'HEAD',
        expectedUrl: 'https://tus.io/uploads/override-contract',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 8,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '3',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '11',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'upload-chunk',
        uploadUrl: 'https://tus.io/uploads/override-contract',
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '3',
          'X-HTTP-Method-Override': 'PATCH',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads/override-contract',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: true,
        value: 'contract-override-fingerprint',
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'overridePatchMethod',
    runtimes: [],
  },
  {
    behavior: 'parallel-upload-concat',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/parallel-final',
    eventKeyAlternativeGroups: [[], [], [], []],
    eventKeyExtraPrefixes: ['progress:'],
    eventKeys: [
      'progress:5:11',
      'chunk-complete:5:5:11',
      'progress:11:11',
      'chunk-complete:6:11:11',
    ],
    eventKinds: ['progress', 'chunk-complete'],
    eventPolicy: {
      matching: 'exact-except-allowed-extra-events',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    executionActionPhases: [
      {
        actions: [
          {
            gateId: 'parallel-patches',
            heldRequestIndexes: [2, 3],
            kind: 'release-after-all-started',
            releaseAfterRequestIndexes: [2, 3],
            timeoutMs: 2000,
          },
        ],
        phase: 'serverRequestGates',
      },
    ],
    featureId: 'parallelUploadConcat',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'metadata',
        value: {
          foo: 'hello',
        },
      },
      {
        key: 'metadataForPartialUploads',
        value: {
          test: 'world',
        },
      },
      {
        key: 'parallelUploads',
        value: 2,
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: [
      'createTusUpload',
      'createTusUpload',
      'patchTusUpload',
      'patchTusUpload',
      'createTusUpload',
    ],
    primitives: ['concatenate-partial-uploads', 'emit-progress'],
    requests: [
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Concat': 'partial',
          'Upload-Length': '5',
        },
        headersSpecified: true,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/parallel-part-1',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/parallel-part-1',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'create-partial-upload',
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Concat': 'partial',
          'Upload-Length': '5',
          'Upload-Metadata': 'test d29ybGQ=',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Concat': 'partial',
          'Upload-Length': '6',
        },
        headersSpecified: true,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/parallel-part-2',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/parallel-part-2',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'create-partial-upload',
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Concat': 'partial',
          'Upload-Length': '6',
          'Upload-Metadata': 'test d29ybGQ=',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 5,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '5',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '5',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'upload-partial-chunk',
        uploadUrl: 'https://tus.io/uploads/parallel-part-1',
        url: 'upload',
        requestIndex: 2,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/parallel-part-1',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 6,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '6',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '6',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'upload-partial-chunk',
        uploadUrl: 'https://tus.io/uploads/parallel-part-2',
        url: 'upload',
        requestIndex: 3,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/parallel-part-2',
      },
      {
        absentHeaders: ['Upload-Length'],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Concat':
            'final;https://tus.io/uploads/parallel-part-1 https://tus.io/uploads/parallel-part-2',
        },
        headersSpecified: true,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/parallel-final',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/parallel-final',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'create-final-upload',
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 4,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Concat':
            'final;https://tus.io/uploads/parallel-part-1 https://tus.io/uploads/parallel-part-2',
          'Upload-Metadata': 'foo aGVsbG8=',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'parallelUploadConcat',
    runtimes: [],
  },
  {
    behavior: 'parallel-upload-abort-cleanup',
    completionKind: 'aborted',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: null,
    eventKeyAlternativeGroups: [[]],
    eventKeyExtraPrefixes: [],
    eventKeys: ['request-abort:3'],
    eventKinds: ['request-abort'],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [
      {
        actions: [
          {
            gateId: 'parallel-cleanup-patches',
            heldRequestIndexes: [2, 3],
            kind: 'release-after-all-started',
            releaseAfterRequestIndexes: [2, 3],
            timeoutMs: 2000,
          },
        ],
        phase: 'serverRequestGates',
      },
    ],
    featureId: 'parallelUploadConcat',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'metadataForPartialUploads',
        value: {
          test: 'world',
        },
      },
      {
        key: 'headers',
        value: {
          'X-Tus-Contract': 'parallel-cleanup-policy',
          'X-Tus-Trace': 'parallel-cleanup-trace-123',
        },
      },
      {
        key: 'overridePatchMethod',
        value: true,
      },
      {
        key: 'parallelUploads',
        value: 2,
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: [
      'createTusUpload',
      'createTusUpload',
      'patchTusUpload',
      'patchTusUpload',
      'terminateTusUpload',
      'terminateTusUpload',
    ],
    primitives: ['abort-current-request', 'terminate-upload', 'concatenate-partial-uploads'],
    requests: [
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Concat': 'partial',
          'Upload-Length': '5',
        },
        headersSpecified: true,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/parallel-cleanup-part-1',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/parallel-cleanup-part-1',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'create-partial-upload',
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Concat': 'partial',
          'Upload-Length': '5',
          'Upload-Metadata': 'test d29ybGQ=',
          'X-Tus-Contract': 'parallel-cleanup-policy',
          'X-Tus-Trace': 'parallel-cleanup-trace-123',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Concat': 'partial',
          'Upload-Length': '6',
        },
        headersSpecified: true,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/parallel-cleanup-part-2',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/parallel-cleanup-part-2',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'create-partial-upload',
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Concat': 'partial',
          'Upload-Length': '6',
          'Upload-Metadata': 'test d29ybGQ=',
          'X-Tus-Contract': 'parallel-cleanup-policy',
          'X-Tus-Trace': 'parallel-cleanup-trace-123',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 5,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {},
          headersSpecified: false,
          statusCode: 500,
          effectiveHeaders: {},
        },
        role: 'upload-partial-chunk',
        uploadUrl: 'https://tus.io/uploads/parallel-cleanup-part-1',
        url: 'upload',
        requestIndex: 2,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
          'X-HTTP-Method-Override': 'PATCH',
          'X-Tus-Contract': 'parallel-cleanup-policy',
          'X-Tus-Trace': 'parallel-cleanup-trace-123',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads/parallel-cleanup-part-1',
      },
      {
        absentHeaders: [],
        abort: true,
        bodySize: 6,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: null,
        role: 'upload-partial-chunk',
        uploadUrl: 'https://tus.io/uploads/parallel-cleanup-part-2',
        url: 'upload',
        requestIndex: 3,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
          'X-HTTP-Method-Override': 'PATCH',
          'X-Tus-Contract': 'parallel-cleanup-policy',
          'X-Tus-Trace': 'parallel-cleanup-trace-123',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads/parallel-cleanup-part-2',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: true,
        method: null,
        operationId: 'terminateTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {},
          headersSpecified: false,
          statusCode: 204,
          effectiveHeaders: {
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'terminate-upload',
        uploadUrl: 'https://tus.io/uploads/parallel-cleanup-part-1',
        url: 'upload',
        requestIndex: 4,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'X-Tus-Contract': 'parallel-cleanup-policy',
          'X-Tus-Trace': 'parallel-cleanup-trace-123',
        },
        effectiveMethod: 'DELETE',
        expectedUrl: 'https://tus.io/uploads/parallel-cleanup-part-1',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: true,
        method: null,
        operationId: 'terminateTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {},
          headersSpecified: false,
          statusCode: 204,
          effectiveHeaders: {
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'terminate-upload',
        uploadUrl: 'https://tus.io/uploads/parallel-cleanup-part-2',
        url: 'upload',
        requestIndex: 5,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'X-Tus-Contract': 'parallel-cleanup-policy',
          'X-Tus-Trace': 'parallel-cleanup-trace-123',
        },
        effectiveMethod: 'DELETE',
        expectedUrl: 'https://tus.io/uploads/parallel-cleanup-part-2',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: true,
      },
      fingerprint: {
        install: true,
        value: 'contract-parallel-cleanup-fingerprint',
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'parallelUploadAbortCleanup',
    runtimes: [],
  },
  {
    behavior: 'retry-patch-after-offset-recovery',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/retry-contract',
    eventKeyAlternativeGroups: [[], [], [], []],
    eventKeyExtraPrefixes: [],
    eventKeys: [
      'should-retry:0:true',
      'retry-schedule:0',
      'should-retry:0:true',
      'retry-schedule:0',
    ],
    eventKinds: ['should-retry', 'retry-schedule'],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'retryOffsetRecovery',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
      {
        key: 'retryDelays',
        value: [0],
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: [
      'createTusUpload',
      'patchTusUpload',
      'getTusUploadOffset',
      'patchTusUpload',
      'getTusUploadOffset',
      'patchTusUpload',
    ],
    primitives: ['retry-with-backoff', 'recover-offset-after-error'],
    requests: [
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/retry-contract',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/retry-contract',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'create-upload',
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 11,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {},
          headersSpecified: false,
          statusCode: 500,
          effectiveHeaders: {},
        },
        role: 'upload-chunk',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/retry-contract',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'getTusUploadOffset',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Length': '11',
            'Upload-Offset': '5',
          },
          headersSpecified: true,
          statusCode: 200,
          effectiveHeaders: {
            'Upload-Length': '11',
            'Upload-Offset': '5',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'recover-upload-offset',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 2,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
        },
        effectiveMethod: 'HEAD',
        expectedUrl: 'https://tus.io/uploads/retry-contract',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 6,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '5',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {},
          headersSpecified: false,
          statusCode: 500,
          effectiveHeaders: {},
        },
        role: 'retry-upload-chunk',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 3,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '5',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/retry-contract',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'getTusUploadOffset',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Length': '11',
            'Upload-Offset': '5',
          },
          headersSpecified: true,
          statusCode: 200,
          effectiveHeaders: {
            'Upload-Length': '11',
            'Upload-Offset': '5',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'recover-upload-offset',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 4,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
        },
        effectiveMethod: 'HEAD',
        expectedUrl: 'https://tus.io/uploads/retry-contract',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 6,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '5',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '11',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'upload-final-chunk',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 5,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '5',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/retry-contract',
      },
    ],
    retryDecisions: [
      {
        decision: true,
        retryAttempt: 0,
      },
      {
        decision: true,
        retryAttempt: 0,
      },
    ],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'retryPatchAfterOffsetRecovery',
    runtimes: [],
  },
  {
    behavior: 'request-lifecycle-hooks',
    completionKind: 'success',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/request-hooks-contract',
    eventKeyAlternativeGroups: [[], [], [], []],
    eventKeyExtraPrefixes: [],
    eventKeys: ['before-request:0', 'after-response:0', 'success', 'source-close'],
    eventKinds: ['before-request', 'after-response', 'success', 'source-close'],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [],
    featureId: 'requestLifecycleHooks',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'uploadUrl',
        value: 'https://tus.io/uploads/request-hooks-contract',
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: ['getTusUploadOffset'],
    primitives: ['run-request-hooks'],
    requests: [
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'getTusUploadOffset',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Length': '11',
            'Upload-Offset': '11',
          },
          headersSpecified: true,
          statusCode: 200,
          effectiveHeaders: {
            'Upload-Length': '11',
            'Upload-Offset': '11',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'recover-upload-offset',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
        },
        effectiveMethod: 'HEAD',
        expectedUrl: 'https://tus.io/uploads/request-hooks-contract',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'requestLifecycleHooks',
    runtimes: [],
  },
  {
    behavior: 'abort-upload',
    completionKind: 'aborted',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: null,
    eventKeyAlternativeGroups: [[]],
    eventKeyExtraPrefixes: [],
    eventKeys: ['request-abort:0'],
    eventKinds: ['request-abort'],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [
      {
        actions: [
          {
            kind: 'cancel-upload',
            requestIndex: 0,
          },
        ],
        phase: 'onRequestStart',
      },
    ],
    featureId: 'abortUpload',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: ['createTusUpload'],
    primitives: ['abort-current-request'],
    requests: [
      {
        absentHeaders: [],
        abort: true,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: null,
        role: 'create-upload',
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'abortUpload',
    runtimes: [],
  },
  {
    behavior: 'abort-upload-after-stored-url',
    completionKind: 'aborted',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/abort-terminate-contract',
    eventKeyAlternativeGroups: [[]],
    eventKeyExtraPrefixes: [],
    eventKeys: ['request-abort:1'],
    eventKinds: ['request-abort'],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [
      {
        actions: [
          {
            kind: 'cancel-upload',
            requestIndex: 1,
          },
        ],
        phase: 'onRequestStart',
      },
    ],
    featureId: 'abortUpload',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
      {
        key: 'headers',
        value: {
          'X-Tus-Contract': 'abort-policy',
          'X-Tus-Trace': 'abort-trace-123',
        },
      },
      {
        key: 'overridePatchMethod',
        value: true,
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: ['createTusUpload', 'patchTusUpload', 'terminateTusUpload'],
    primitives: ['abort-current-request', 'terminate-upload'],
    requests: [
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/abort-terminate-contract',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/abort-terminate-contract',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'create-upload',
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
          'X-Tus-Contract': 'abort-policy',
          'X-Tus-Trace': 'abort-trace-123',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
      {
        absentHeaders: [],
        abort: true,
        bodySize: 11,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: null,
        role: 'abort-upload-chunk',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
          'X-HTTP-Method-Override': 'PATCH',
          'X-Tus-Contract': 'abort-policy',
          'X-Tus-Trace': 'abort-trace-123',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads/abort-terminate-contract',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: true,
        method: null,
        operationId: 'terminateTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {},
          headersSpecified: false,
          statusCode: 204,
          effectiveHeaders: {
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'terminate-upload',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 2,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'X-Tus-Contract': 'abort-policy',
          'X-Tus-Trace': 'abort-trace-123',
        },
        effectiveMethod: 'DELETE',
        expectedUrl: 'https://tus.io/uploads/abort-terminate-contract',
      },
    ],
    retryDecisions: [],
    runtimeSetup: {
      abort: {
        terminateUpload: true,
      },
      fingerprint: {
        install: true,
        value: 'contract-abort-terminate-fingerprint',
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'abortUploadAfterStoredUrl',
    runtimes: [],
  },
  {
    behavior: 'terminate-with-retry',
    completionKind: 'terminated',
    completionMessage: null,
    completionReason: null,
    completionUploadUrl: 'https://tus.io/uploads/terminate-contract',
    eventKeyAlternativeGroups: [[], []],
    eventKeyExtraPrefixes: [],
    eventKeys: ['should-retry:0:true', 'retry-schedule:0'],
    eventKinds: ['should-retry', 'retry-schedule'],
    eventPolicy: {
      matching: 'exact',
    },
    executionActionPhases: [
      {
        actions: [
          {
            kind: 'abort-upload',
            terminateUpload: true,
          },
        ],
        phase: 'onChunkComplete',
      },
    ],
    featureId: 'terminateUpload',
    inputOptionEntries: [
      {
        key: 'endpointUrl',
        value: 'https://tus.io/uploads',
      },
      {
        key: 'chunkSize',
        value: 5,
      },
      {
        key: 'metadata',
        value: {
          filename: 'hello.txt',
        },
      },
      {
        key: 'retryDelays',
        value: [0, 0],
      },
    ],
    inputSource: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: ['createTusUpload', 'patchTusUpload', 'terminateTusUpload', 'terminateTusUpload'],
    primitives: ['terminate-upload', 'retry-with-backoff'],
    requests: [
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'createTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            Location: 'https://tus.io/uploads/terminate-contract',
          },
          headersSpecified: true,
          statusCode: 201,
          effectiveHeaders: {
            Location: 'https://tus.io/uploads/terminate-contract',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'create-upload',
        uploadUrl: null,
        url: 'endpoint',
        requestIndex: 0,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '11',
          'Upload-Metadata': 'filename aGVsbG8udHh0',
        },
        effectiveMethod: 'POST',
        expectedUrl: 'https://tus.io/uploads',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: 5,
        errorMessage: null,
        headerMode: null,
        headers: {
          'Upload-Offset': '0',
        },
        headersSpecified: true,
        method: null,
        operationId: 'patchTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {
            'Upload-Offset': '5',
          },
          headersSpecified: true,
          statusCode: 204,
          effectiveHeaders: {
            'Upload-Offset': '5',
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'upload-chunk',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 1,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
        },
        effectiveMethod: 'PATCH',
        expectedUrl: 'https://tus.io/uploads/terminate-contract',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'terminateTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {},
          headersSpecified: false,
          statusCode: 423,
          effectiveHeaders: {},
        },
        role: 'terminate-upload',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 2,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
        },
        effectiveMethod: 'DELETE',
        expectedUrl: 'https://tus.io/uploads/terminate-contract',
      },
      {
        absentHeaders: [],
        abort: false,
        bodySize: null,
        errorMessage: null,
        headerMode: null,
        headers: {},
        headersSpecified: false,
        method: null,
        operationId: 'terminateTusUpload',
        response: {
          body: null,
          headerMode: null,
          headers: {},
          headersSpecified: false,
          statusCode: 204,
          effectiveHeaders: {
            'Tus-Resumable': '1.0.0',
          },
        },
        role: 'retry-terminate-upload',
        uploadUrl: null,
        url: 'upload',
        requestIndex: 3,
        effectiveHeaders: {
          'Tus-Resumable': '1.0.0',
        },
        effectiveMethod: 'DELETE',
        expectedUrl: 'https://tus.io/uploads/terminate-contract',
      },
    ],
    retryDecisions: [
      {
        decision: true,
        retryAttempt: 0,
      },
    ],
    runtimeSetup: {
      abort: {
        terminateUpload: false,
      },
      fingerprint: {
        install: false,
        value: null,
      },
      requestId: {
        enabled: false,
        generatedRequestId: null,
      },
      urlStorage: {
        install: false,
        storedUpload: null,
      },
    },
    scenarioId: 'terminateWithRetry',
    runtimes: [],
  },
]

export const tusClientScenarioProofCases = [
  {
    behavior: 'single-upload-lifecycle',
    completionKind: 'success',
    featureId: 'singleUploadLifecycle',
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: [
      'open-input-source',
      'fingerprint-input',
      'store-resume-url',
      'retry-with-backoff',
      'emit-progress',
      'abort-current-request',
    ],
    profile: 'urlStorageCreateFlow',
    scenarioId: 'singleUploadLifecycle',
  },
  {
    behavior: 'custom-request-headers',
    completionKind: 'success',
    featureId: 'customRequestHeaders',
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['apply-custom-request-headers'],
    profile: 'customRequestHeaders',
    scenarioId: 'customRequestHeaders',
  },
  {
    behavior: 'override-patch-method',
    completionKind: 'success',
    featureId: 'overridePatchMethod',
    operationIds: ['getTusUploadOffset', 'patchTusUpload'],
    primitives: ['override-patch-method'],
    profile: 'overridePatchMethod',
    scenarioId: 'overridePatchMethod',
  },
  {
    behavior: 'node-path-input',
    completionKind: 'success',
    featureId: 'inputSources',
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['read-node-file'],
    profile: 'nodePathFileUpload',
    scenarioId: 'nodePathInput',
  },
  {
    behavior: 'resume-from-previous-upload',
    completionKind: 'success',
    featureId: 'resumeUpload',
    operationIds: ['getTusUploadOffset', 'patchTusUpload'],
    primitives: ['fingerprint-input', 'resume-from-previous-upload', 'store-resume-url'],
    profile: 'resumeFromPreviousUpload',
    scenarioId: 'resumeFromPreviousUpload',
  },
]

export const tusClientUrlStorageConformanceScenarios = [
  {
    actions: [
      {
        kind: 'assert-empty',
      },
      {
        expectedKeyPrefix: 'tus::contract-storage-a::',
        fingerprint: 'contract-storage-a',
        keyRef: 'a1',
        kind: 'add-upload',
        upload: {
          id: 1,
          metadata: {
            filename: 'a1.txt',
          },
          size: 11,
          uploadUrl: 'https://tus.io/uploads/storage-a1',
        },
      },
      {
        expectedKeyPrefix: 'tus::contract-storage-a::',
        fingerprint: 'contract-storage-a',
        keyRef: 'a2',
        kind: 'add-upload',
        upload: {
          id: 2,
          metadata: {
            filename: 'a2.txt',
          },
          size: 12,
          uploadUrl: 'https://tus.io/uploads/storage-a2',
        },
      },
      {
        expectedKeyPrefix: 'tus::contract-storage-b::',
        fingerprint: 'contract-storage-b',
        keyRef: 'b1',
        kind: 'add-upload',
        upload: {
          id: 3,
          metadata: {
            filename: 'b1.txt',
          },
          size: 13,
          uploadUrl: 'https://tus.io/uploads/storage-b1',
        },
      },
      {
        expectedKeyRefs: ['a1', 'a2'],
        fingerprint: 'contract-storage-a',
        kind: 'find-by-fingerprint',
      },
      {
        expectedKeyRefs: ['b1'],
        fingerprint: 'contract-storage-b',
        kind: 'find-by-fingerprint',
      },
      {
        expectedKeyRefs: ['a1', 'a2', 'b1'],
        kind: 'find-all',
      },
      {
        keyRef: 'a2',
        kind: 'remove-upload',
      },
      {
        keyRef: 'b1',
        kind: 'remove-upload',
      },
      {
        expectedKeyRefs: ['a1'],
        fingerprint: 'contract-storage-a',
        kind: 'find-by-fingerprint',
      },
      {
        expectedKeyRefs: [],
        fingerprint: 'contract-storage-b',
        kind: 'find-by-fingerprint',
      },
    ],
    backend: 'web-storage',
    featureId: 'urlStorageBackends',
    runtimes: ['browser'],
    scenarioId: 'webStorageUrlStorageBackend',
  },
  {
    actions: [
      {
        kind: 'assert-empty',
      },
      {
        expectedKeyPrefix: 'tus::contract-storage-a::',
        fingerprint: 'contract-storage-a',
        keyRef: 'a1',
        kind: 'add-upload',
        upload: {
          id: 1,
          metadata: {
            filename: 'a1.txt',
          },
          size: 11,
          uploadUrl: 'https://tus.io/uploads/storage-a1',
        },
      },
      {
        expectedKeyPrefix: 'tus::contract-storage-a::',
        fingerprint: 'contract-storage-a',
        keyRef: 'a2',
        kind: 'add-upload',
        upload: {
          id: 2,
          metadata: {
            filename: 'a2.txt',
          },
          size: 12,
          uploadUrl: 'https://tus.io/uploads/storage-a2',
        },
      },
      {
        expectedKeyPrefix: 'tus::contract-storage-b::',
        fingerprint: 'contract-storage-b',
        keyRef: 'b1',
        kind: 'add-upload',
        upload: {
          id: 3,
          metadata: {
            filename: 'b1.txt',
          },
          size: 13,
          uploadUrl: 'https://tus.io/uploads/storage-b1',
        },
      },
      {
        expectedKeyRefs: ['a1', 'a2'],
        fingerprint: 'contract-storage-a',
        kind: 'find-by-fingerprint',
      },
      {
        expectedKeyRefs: ['b1'],
        fingerprint: 'contract-storage-b',
        kind: 'find-by-fingerprint',
      },
      {
        expectedKeyRefs: ['a1', 'a2', 'b1'],
        kind: 'find-all',
      },
      {
        keyRef: 'a2',
        kind: 'remove-upload',
      },
      {
        keyRef: 'b1',
        kind: 'remove-upload',
      },
      {
        expectedKeyRefs: ['a1'],
        fingerprint: 'contract-storage-a',
        kind: 'find-by-fingerprint',
      },
      {
        expectedKeyRefs: [],
        fingerprint: 'contract-storage-b',
        kind: 'find-by-fingerprint',
      },
    ],
    backend: 'file-storage',
    featureId: 'urlStorageBackends',
    runtimes: ['deno', 'node'],
    scenarioId: 'fileUrlStorageBackend',
  },
]
