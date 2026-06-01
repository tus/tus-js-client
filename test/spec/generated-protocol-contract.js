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
      scenarioIds: ['deferredLengthUpload'],
      status: 'covered-by-generated-scenario',
    },
    description: 'Create an upload without a known length and declare the length on final PATCH.',
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
        summary: 'Track the source until the final chunk reveals the total size.',
      },
      {
        kind: 'operation',
        operationId: 'patchTusUpload',
        summary: 'Declare Upload-Length on the final chunk request.',
      },
    ],
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['defer-upload-length', 'emit-progress'],
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
      scenarioIds: ['ietfDraft05CreationWithUpload', 'ietfDraft03ResumeWithoutKnownLength'],
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
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/generated-contract',
    },
    events: [
      {
        fingerprint: 'contract-single-fingerprint',
        kind: 'fingerprint',
        key: 'fingerprint:contract-single-fingerprint',
      },
      {
        kind: 'upload-url-available',
        key: 'upload-url-available',
      },
      {
        fingerprint: 'contract-single-fingerprint',
        kind: 'url-storage-add',
        uploadUrl: 'https://tus.io/uploads/generated-contract',
        key: 'url-storage-add:contract-single-fingerprint:https://tus.io/uploads/generated-contract',
      },
      {
        bytesSent: 0,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:0:11',
      },
      {
        bytesSent: 11,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:11:11',
      },
      {
        bytesAccepted: 11,
        bytesTotal: 11,
        chunkSize: 11,
        kind: 'chunk-complete',
        key: 'chunk-complete:11:11:11',
      },
      {
        kind: 'success',
        key: 'success',
      },
      {
        kind: 'source-close',
        key: 'source-close',
      },
    ],
    eventPolicy: {
      matching: 'exact-except-extra-progress',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    featureId: 'singleUploadLifecycle',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      fingerprint: 'contract-single-fingerprint',
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
    behavior: 'creation-with-upload',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/creation-with-upload-contract',
    },
    events: [
      {
        bytesSent: 0,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:0:11',
      },
      {
        bytesSent: 11,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:11:11',
      },
      {
        kind: 'upload-url-available',
        key: 'upload-url-available',
      },
      {
        kind: 'success',
        key: 'success',
      },
      {
        kind: 'source-close',
        key: 'source-close',
      },
    ],
    eventPolicy: {
      matching: 'exact-except-extra-progress',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    featureId: 'creationWithUpload',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      metadata: {
        filename: 'hello.txt',
      },
      uploadDataDuringCreation: true,
    },
    operationIds: ['createTusUpload'],
    primitives: ['upload-during-creation', 'emit-progress'],
    requests: [
      {
        bodySize: 11,
        headers: {
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Length': '11',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'https://tus.io/uploads/creation-with-upload-contract',
            'Upload-Offset': '11',
          },
          statusCode: 201,
        },
        url: 'endpoint',
      },
    ],
    scenarioId: 'creationWithUpload',
  },
  {
    behavior: 'creation-with-upload-partial-chunk',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/creation-with-upload-partial-contract',
    },
    events: [
      {
        bytesSent: 0,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:0:11',
      },
      {
        bytesSent: 5,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:5:11',
      },
      {
        kind: 'upload-url-available',
        key: 'upload-url-available',
      },
      {
        bytesAccepted: 5,
        bytesTotal: 11,
        chunkSize: 5,
        kind: 'chunk-complete',
        key: 'chunk-complete:5:5:11',
      },
      {
        bytesSent: 5,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:5:11',
      },
      {
        bytesSent: 10,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:10:11',
      },
      {
        bytesAccepted: 10,
        bytesTotal: 11,
        chunkSize: 5,
        kind: 'chunk-complete',
        key: 'chunk-complete:5:10:11',
      },
      {
        bytesSent: 10,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:10:11',
      },
      {
        bytesSent: 11,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:11:11',
      },
      {
        bytesAccepted: 11,
        bytesTotal: 11,
        chunkSize: 1,
        kind: 'chunk-complete',
        key: 'chunk-complete:1:11:11',
      },
      {
        kind: 'success',
        key: 'success',
      },
      {
        kind: 'source-close',
        key: 'source-close',
      },
    ],
    eventPolicy: {
      matching: 'exact-except-extra-progress',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    featureId: 'creationWithUpload',
    input: {
      chunkSize: 5,
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      metadata: {
        filename: 'hello.txt',
      },
      uploadDataDuringCreation: true,
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['upload-during-creation', 'emit-progress'],
    requests: [
      {
        bodySize: 5,
        headers: {
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Length': '11',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'https://tus.io/uploads/creation-with-upload-partial-contract',
            'Upload-Offset': '5',
          },
          statusCode: 201,
        },
        url: 'endpoint',
      },
      {
        bodySize: 5,
        headers: {
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '5',
        },
        operationId: 'patchTusUpload',
        response: {
          headers: {
            'Upload-Offset': '10',
          },
          statusCode: 204,
        },
        uploadUrl: 'https://tus.io/uploads/creation-with-upload-partial-contract',
        url: 'upload',
      },
      {
        bodySize: 1,
        headers: {
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '10',
        },
        operationId: 'patchTusUpload',
        response: {
          headers: {
            'Upload-Offset': '11',
          },
          statusCode: 204,
        },
        uploadUrl: 'https://tus.io/uploads/creation-with-upload-partial-contract',
        url: 'upload',
      },
    ],
    scenarioId: 'creationWithUploadPartialChunk',
  },
  {
    behavior: 'creation-with-upload',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/ietf-draft-05-contract',
    },
    events: [
      {
        bytesSent: 0,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:0:11',
      },
      {
        bytesSent: 11,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:11:11',
      },
      {
        kind: 'upload-url-available',
        key: 'upload-url-available',
      },
      {
        kind: 'success',
        key: 'success',
      },
      {
        kind: 'source-close',
        key: 'source-close',
      },
    ],
    eventPolicy: {
      matching: 'exact-except-extra-progress',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    featureId: 'protocolVersionSelection',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      metadata: {
        filename: 'hello.txt',
      },
      protocol: 'ietf-draft-05',
      uploadDataDuringCreation: true,
    },
    operationIds: ['createTusUpload'],
    primitives: ['select-client-protocol'],
    requests: [
      {
        absentHeaders: ['Tus-Resumable'],
        bodySize: 11,
        headerMode: 'exact',
        headers: {
          'Content-Type': 'application/partial-upload',
          'Upload-Complete': '?1',
          'Upload-Draft-Interop-Version': '6',
          'Upload-Length': '11',
        },
        operationId: 'createTusUpload',
        response: {
          headerMode: 'exact',
          headers: {
            Location: 'https://tus.io/uploads/ietf-draft-05-contract',
            'Upload-Offset': '11',
          },
          statusCode: 201,
        },
        url: 'endpoint',
      },
    ],
    scenarioId: 'ietfDraft05CreationWithUpload',
  },
  {
    behavior: 'upload-body-headers',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/ietf-draft-03-resume-contract',
    },
    events: [
      {
        kind: 'upload-url-available',
        key: 'upload-url-available',
      },
      {
        bytesSent: 5,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:5:11',
      },
      {
        bytesSent: 11,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:11:11',
      },
      {
        bytesAccepted: 11,
        bytesTotal: 11,
        chunkSize: 6,
        kind: 'chunk-complete',
        key: 'chunk-complete:6:11:11',
      },
      {
        kind: 'success',
        key: 'success',
      },
      {
        kind: 'source-close',
        key: 'source-close',
      },
    ],
    eventPolicy: {
      matching: 'exact-except-extra-progress',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    featureId: 'protocolVersionSelection',
    input: {
      chunkSize: 6,
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      protocol: 'ietf-draft-03',
      uploadUrl: 'https://tus.io/uploads/ietf-draft-03-resume-contract',
    },
    operationIds: ['getTusUploadOffset', 'patchTusUpload'],
    primitives: ['select-client-protocol'],
    requests: [
      {
        absentHeaders: ['Tus-Resumable'],
        headerMode: 'exact',
        headers: {
          'Upload-Draft-Interop-Version': '5',
        },
        operationId: 'getTusUploadOffset',
        response: {
          headerMode: 'exact',
          headers: {
            'Upload-Offset': '5',
          },
          statusCode: 200,
        },
        url: 'upload',
      },
      {
        absentHeaders: ['Content-Type', 'Tus-Resumable'],
        bodySize: 6,
        headerMode: 'exact',
        headers: {
          'Upload-Complete': '?1',
          'Upload-Draft-Interop-Version': '5',
          'Upload-Offset': '5',
        },
        operationId: 'patchTusUpload',
        response: {
          headerMode: 'exact',
          headers: {
            'Upload-Offset': '11',
          },
          statusCode: 204,
        },
        url: 'upload',
      },
    ],
    scenarioId: 'ietfDraft03ResumeWithoutKnownLength',
  },
  {
    behavior: 'start-option-validation',
    completion: {
      kind: 'error',
      message: 'tus: no file or stream to upload provided',
      reason: 'missingInput',
    },
    events: [],
    featureId: 'startOptionValidation',
    input: {
      content: '',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'none',
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    scenarioId: 'startValidationMissingInput',
  },
  {
    behavior: 'start-option-validation',
    completion: {
      kind: 'error',
      message: 'tus: neither an endpoint or an upload URL is provided',
      reason: 'missingEndpointOrUploadUrl',
    },
    events: [],
    featureId: 'startOptionValidation',
    input: {
      content: 'hello world',
      kind: 'blob',
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    scenarioId: 'startValidationMissingEndpointOrUploadUrl',
  },
  {
    behavior: 'start-option-validation',
    completion: {
      kind: 'error',
      message: 'tus: unsupported protocol tus-v9',
      reason: 'unsupportedProtocol',
    },
    events: [],
    featureId: 'startOptionValidation',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      protocol: 'tus-v9',
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    scenarioId: 'startValidationUnsupportedProtocol',
  },
  {
    behavior: 'start-option-validation',
    completion: {
      kind: 'error',
      message: 'tus: the `retryDelays` option must either be an array or null',
      reason: 'retryDelaysNotArray',
    },
    events: [],
    featureId: 'startOptionValidation',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      rawOptions: {
        retryDelays: 44,
      },
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    scenarioId: 'startValidationRetryDelaysNotArray',
  },
  {
    behavior: 'start-option-validation',
    completion: {
      kind: 'error',
      message: 'tus: cannot use the `uploadUrl` option when parallelUploads is enabled',
      reason: 'parallelUploadsWithUploadUrl',
    },
    events: [],
    featureId: 'startOptionValidation',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      parallelUploads: 2,
      uploadUrl: 'https://tus.io/uploads/start-validation-upload-url',
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    scenarioId: 'startValidationParallelUploadsWithUploadUrl',
  },
  {
    behavior: 'start-option-validation',
    completion: {
      kind: 'error',
      message: 'tus: cannot use the `uploadSize` option when parallelUploads is enabled',
      reason: 'parallelUploadsWithUploadSize',
    },
    events: [],
    featureId: 'startOptionValidation',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      parallelUploads: 2,
      uploadSize: 11,
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    scenarioId: 'startValidationParallelUploadsWithUploadSize',
  },
  {
    behavior: 'start-option-validation',
    completion: {
      kind: 'error',
      message: 'tus: cannot use the `uploadLengthDeferred` option when parallelUploads is enabled',
      reason: 'parallelUploadsWithDeferredLength',
    },
    events: [],
    featureId: 'startOptionValidation',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      parallelUploads: 2,
      uploadLengthDeferred: true,
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    scenarioId: 'startValidationParallelUploadsWithDeferredLength',
  },
  {
    behavior: 'start-option-validation',
    completion: {
      kind: 'error',
      message:
        'tus: cannot use the `uploadDataDuringCreation` option when parallelUploads is enabled',
      reason: 'parallelUploadsWithUploadDataDuringCreation',
    },
    events: [],
    featureId: 'startOptionValidation',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      parallelUploads: 2,
      uploadDataDuringCreation: true,
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    scenarioId: 'startValidationParallelUploadsWithUploadDataDuringCreation',
  },
  {
    behavior: 'start-option-validation',
    completion: {
      kind: 'error',
      message:
        'tus: cannot use the `parallelUploadBoundaries` option when `parallelUploads` is disabled',
      reason: 'parallelBoundariesWithoutParallelUploads',
    },
    events: [],
    featureId: 'startOptionValidation',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      parallelUploadBoundaries: [
        {
          end: 5,
          start: 0,
        },
      ],
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    scenarioId: 'startValidationParallelBoundariesWithoutParallelUploads',
  },
  {
    behavior: 'start-option-validation',
    completion: {
      kind: 'error',
      message:
        'tus: the `parallelUploadBoundaries` must have the same length as the value of `parallelUploads`',
      reason: 'parallelBoundariesLengthMismatch',
    },
    events: [],
    featureId: 'startOptionValidation',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      parallelUploadBoundaries: [
        {
          end: 5,
          start: 0,
        },
      ],
      parallelUploads: 2,
    },
    operationIds: [],
    primitives: ['validate-start-options'],
    requests: [],
    scenarioId: 'startValidationParallelBoundariesLengthMismatch',
  },
  {
    behavior: 'detailed-error',
    completion: {
      kind: 'error',
      message:
        'tus: unexpected response while creating upload, originated from request (method: POST, url: https://tus.io/uploads, response code: 500, response text: server_error, request id: contract-request-id)',
      reason: 'unexpectedCreateResponse',
    },
    events: [],
    featureId: 'detailedErrors',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      headers: {
        'X-Request-ID': 'contract-request-id',
      },
      kind: 'blob',
      metadata: {
        filename: 'hello.txt',
      },
      rawOptions: {
        retryDelays: null,
      },
    },
    operationIds: ['createTusUpload'],
    primitives: ['report-detailed-errors'],
    requests: [
      {
        headers: {
          'Upload-Length': '11',
          'X-Request-ID': 'contract-request-id',
        },
        operationId: 'createTusUpload',
        response: {
          body: 'server_error',
          statusCode: 500,
        },
        url: 'endpoint',
      },
    ],
    scenarioId: 'detailedCreateResponseError',
  },
  {
    behavior: 'detailed-error',
    completion: {
      kind: 'error',
      message:
        'tus: failed to create upload, caused by Error: socket down, originated from request (method: POST, url: https://tus.io/uploads, response code: n/a, response text: n/a, request id: contract-request-id)',
      reason: 'createUploadRequestFailed',
    },
    events: [],
    featureId: 'detailedErrors',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      headers: {
        'X-Request-ID': 'contract-request-id',
      },
      kind: 'blob',
      metadata: {
        filename: 'hello.txt',
      },
      rawOptions: {
        retryDelays: null,
      },
    },
    operationIds: ['createTusUpload'],
    primitives: ['report-detailed-errors'],
    requests: [
      {
        error: {
          message: 'socket down',
        },
        headers: {
          'Upload-Length': '11',
          'X-Request-ID': 'contract-request-id',
        },
        operationId: 'createTusUpload',
        url: 'endpoint',
      },
    ],
    scenarioId: 'detailedCreateRequestError',
  },
  {
    behavior: 'upload-body-headers',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/upload-body-headers-contract',
    },
    events: [],
    featureId: 'uploadBodyHeaders',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      metadata: {
        filename: 'hello.txt',
      },
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['send-upload-body-headers'],
    requests: [
      {
        headers: {
          'Upload-Length': '11',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'https://tus.io/uploads/upload-body-headers-contract',
          },
          statusCode: 201,
        },
        url: 'endpoint',
      },
      {
        bodySize: 11,
        headers: {
          'Content-Type': 'application/offset+octet-stream',
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
    scenarioId: 'uploadBodyHeaders',
  },
  {
    behavior: 'custom-request-headers',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/custom-headers-contract',
    },
    events: [],
    featureId: 'customRequestHeaders',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      headers: {
        'X-Tus-Contract': 'custom-header',
        'X-Tus-Trace': 'trace-123',
      },
      kind: 'blob',
      metadata: {
        filename: 'hello.txt',
      },
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['apply-custom-request-headers'],
    requests: [
      {
        headers: {
          'Upload-Length': '11',
          'X-Tus-Contract': 'custom-header',
          'X-Tus-Trace': 'trace-123',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'https://tus.io/uploads/custom-headers-contract',
          },
          statusCode: 201,
        },
        url: 'endpoint',
      },
      {
        bodySize: 11,
        headers: {
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
          'X-Tus-Contract': 'custom-header',
          'X-Tus-Trace': 'trace-123',
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
    scenarioId: 'customRequestHeaders',
  },
  {
    behavior: 'resume-from-previous-upload',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/resume-contract',
    },
    events: [
      {
        fingerprint: 'contract-resume-fingerprint',
        kind: 'fingerprint',
        key: 'fingerprint:contract-resume-fingerprint',
      },
      {
        count: 1,
        fingerprint: 'contract-resume-fingerprint',
        kind: 'url-storage-find',
        key: 'url-storage-find:contract-resume-fingerprint:1',
      },
      {
        fingerprint: 'contract-resume-fingerprint',
        kind: 'fingerprint',
        key: 'fingerprint:contract-resume-fingerprint',
      },
      {
        kind: 'upload-url-available',
        key: 'upload-url-available',
      },
      {
        bytesSent: 5,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:5:11',
      },
      {
        bytesSent: 11,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:11:11',
      },
      {
        bytesAccepted: 11,
        bytesTotal: 11,
        chunkSize: 6,
        kind: 'chunk-complete',
        key: 'chunk-complete:6:11:11',
      },
      {
        kind: 'url-storage-remove',
        urlStorageKey: 'tus::contract-resume-fingerprint::1337',
        key: 'url-storage-remove:tus::contract-resume-fingerprint::1337',
      },
      {
        kind: 'success',
        key: 'success',
      },
      {
        kind: 'source-close',
        key: 'source-close',
      },
    ],
    eventPolicy: {
      matching: 'exact-except-extra-progress',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    execution: {
      beforeStart: [
        {
          expectedPreviousUploadCount: 1,
          kind: 'resume-from-previous-upload',
          selectedPreviousUploadIndex: 0,
        },
      ],
    },
    featureId: 'resumeUpload',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      removeFingerprintOnSuccess: true,
      storedUpload: {
        fingerprint: 'contract-resume-fingerprint',
        uploadUrl: 'https://tus.io/uploads/resume-contract',
        urlStorageKey: 'tus::contract-resume-fingerprint::1337',
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
    behavior: 'relative-location-resolution',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/files/relative-contract',
    },
    events: [
      {
        kind: 'upload-url-available',
        key: 'upload-url-available',
      },
      {
        bytesSent: 0,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:0:11',
      },
      {
        bytesSent: 11,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:11:11',
      },
      {
        bytesAccepted: 11,
        bytesTotal: 11,
        chunkSize: 11,
        kind: 'chunk-complete',
        key: 'chunk-complete:11:11:11',
      },
      {
        kind: 'success',
        key: 'success',
      },
      {
        kind: 'source-close',
        key: 'source-close',
      },
    ],
    eventPolicy: {
      matching: 'exact-except-extra-progress',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    featureId: 'relativeLocationResolution',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/files/',
      kind: 'blob',
      metadata: {
        filename: 'hello.txt',
      },
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['resolve-relative-location'],
    requests: [
      {
        headers: {
          'Upload-Length': '11',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'relative-contract',
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
    scenarioId: 'relativeLocationResolution',
  },
  {
    behavior: 'array-buffer-input',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/array-buffer-contract',
    },
    events: [
      {
        inputKind: 'array-buffer',
        kind: 'source-open',
        size: 11,
        key: 'source-open:array-buffer:11',
      },
      {
        kind: 'success',
        key: 'success',
      },
      {
        kind: 'source-close',
        key: 'source-close',
      },
    ],
    featureId: 'inputSources',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'array-buffer',
      metadata: {
        filename: 'hello.txt',
      },
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['read-browser-file'],
    requests: [
      {
        headers: {
          'Upload-Length': '11',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'https://tus.io/uploads/array-buffer-contract',
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
    scenarioId: 'arrayBufferInput',
  },
  {
    behavior: 'array-buffer-view-input',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/array-buffer-view-contract',
    },
    events: [
      {
        inputKind: 'array-buffer-view',
        kind: 'source-open',
        size: 11,
        key: 'source-open:array-buffer-view:11',
      },
      {
        kind: 'success',
        key: 'success',
      },
      {
        kind: 'source-close',
        key: 'source-close',
      },
    ],
    featureId: 'inputSources',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'array-buffer-view',
      metadata: {
        filename: 'hello.txt',
      },
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['read-browser-file'],
    requests: [
      {
        headers: {
          'Upload-Length': '11',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'https://tus.io/uploads/array-buffer-view-contract',
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
    scenarioId: 'arrayBufferViewInput',
  },
  {
    behavior: 'web-readable-stream-input',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/web-stream-contract',
    },
    events: [
      {
        inputKind: 'web-readable-stream',
        kind: 'source-open',
        size: null,
        key: 'source-open:web-readable-stream:null',
      },
      {
        kind: 'success',
        key: 'success',
      },
      {
        kind: 'source-close',
        key: 'source-close',
      },
    ],
    featureId: 'inputSources',
    input: {
      chunkSize: 100,
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'web-readable-stream',
      metadata: {
        filename: 'hello.txt',
      },
      uploadLengthDeferred: true,
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['read-web-stream'],
    requests: [
      {
        absentHeaders: ['Upload-Length'],
        headers: {
          'Upload-Defer-Length': '1',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'https://tus.io/uploads/web-stream-contract',
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
    scenarioId: 'webReadableStreamInput',
  },
  {
    behavior: 'node-readable-stream-input',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/node-stream-contract',
    },
    events: [
      {
        inputKind: 'node-readable-stream',
        kind: 'source-open',
        size: null,
        key: 'source-open:node-readable-stream:null',
      },
      {
        kind: 'success',
        key: 'success',
      },
      {
        kind: 'source-close',
        key: 'source-close',
      },
    ],
    featureId: 'inputSources',
    input: {
      chunkSize: 100,
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'node-readable-stream',
      metadata: {
        filename: 'hello.txt',
      },
      uploadLengthDeferred: true,
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['read-node-stream'],
    requests: [
      {
        absentHeaders: ['Upload-Length'],
        headers: {
          'Upload-Defer-Length': '1',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'https://tus.io/uploads/node-stream-contract',
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
    runtimes: ['node'],
    scenarioId: 'nodeReadableStreamInput',
  },
  {
    behavior: 'node-path-input',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/node-path-contract',
    },
    events: [
      {
        inputKind: 'node-path-reference',
        kind: 'source-open',
        size: 11,
        key: 'source-open:node-path-reference:11',
      },
      {
        kind: 'success',
        key: 'success',
      },
      {
        kind: 'source-close',
        key: 'source-close',
      },
    ],
    featureId: 'inputSources',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'node-path-reference',
      metadata: {
        filename: 'hello.txt',
      },
    },
    operationIds: ['createTusUpload', 'patchTusUpload'],
    primitives: ['read-node-file'],
    requests: [
      {
        headers: {
          'Upload-Length': '11',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'https://tus.io/uploads/node-path-contract',
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
    runtimes: ['node'],
    scenarioId: 'nodePathInput',
  },
  {
    behavior: 'deferred-length-upload',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/deferred-contract',
    },
    events: [
      {
        kind: 'upload-url-available',
        key: 'upload-url-available',
      },
      {
        bytesSent: 0,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:0:11',
      },
      {
        bytesSent: 11,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:11:11',
      },
      {
        bytesAccepted: 11,
        bytesTotal: 11,
        chunkSize: 11,
        kind: 'chunk-complete',
        key: 'chunk-complete:11:11:11',
      },
      {
        kind: 'success',
        key: 'success',
      },
      {
        kind: 'source-close',
        key: 'source-close',
      },
    ],
    eventPolicy: {
      matching: 'exact-except-extra-progress',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    featureId: 'deferredLengthUpload',
    input: {
      chunkSize: 100,
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'web-readable-stream',
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
    behavior: 'override-patch-method',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/override-contract',
    },
    events: [],
    featureId: 'overridePatchMethod',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      overridePatchMethod: true,
      uploadUrl: 'https://tus.io/uploads/override-contract',
    },
    operationIds: ['getTusUploadOffset', 'patchTusUpload'],
    primitives: ['override-patch-method'],
    requests: [
      {
        operationId: 'getTusUploadOffset',
        response: {
          headers: {
            'Upload-Length': '11',
            'Upload-Offset': '3',
          },
          statusCode: 200,
        },
        uploadUrl: 'https://tus.io/uploads/override-contract',
        url: 'upload',
      },
      {
        bodySize: 8,
        headers: {
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '3',
          'X-HTTP-Method-Override': 'PATCH',
        },
        method: 'POST',
        operationId: 'patchTusUpload',
        response: {
          headers: {
            'Upload-Offset': '11',
          },
          statusCode: 204,
        },
        uploadUrl: 'https://tus.io/uploads/override-contract',
        url: 'upload',
      },
    ],
    scenarioId: 'overridePatchMethod',
  },
  {
    behavior: 'parallel-upload-concat',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/parallel-final',
    },
    events: [
      {
        bytesSent: 5,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:5:11',
      },
      {
        bytesAccepted: 5,
        bytesTotal: 11,
        chunkSize: 5,
        kind: 'chunk-complete',
        key: 'chunk-complete:5:5:11',
      },
      {
        bytesSent: 11,
        bytesTotal: 11,
        kind: 'progress',
        key: 'progress:11:11',
      },
      {
        bytesAccepted: 11,
        bytesTotal: 11,
        chunkSize: 6,
        kind: 'chunk-complete',
        key: 'chunk-complete:6:11:11',
      },
    ],
    eventPolicy: {
      matching: 'exact-except-extra-progress',
      progress: 'milestone',
      transportProgress: 'may-emit-extra-samples',
    },
    execution: {
      serverRequestGates: [
        {
          gateId: 'parallel-patches',
          heldRequestIndexes: [2, 3],
          kind: 'release-after-all-started',
          releaseAfterRequestIndexes: [2, 3],
          timeoutMs: 2000,
        },
      ],
    },
    featureId: 'parallelUploadConcat',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      metadata: {
        foo: 'hello',
      },
      metadataForPartialUploads: {
        test: 'world',
      },
      parallelUploads: 2,
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
        headers: {
          'Upload-Concat': 'partial',
          'Upload-Length': '5',
          'Upload-Metadata': 'test d29ybGQ=',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'https://tus.io/uploads/parallel-part-1',
          },
          statusCode: 201,
        },
        url: 'endpoint',
      },
      {
        headers: {
          'Upload-Concat': 'partial',
          'Upload-Length': '6',
          'Upload-Metadata': 'test d29ybGQ=',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'https://tus.io/uploads/parallel-part-2',
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
        uploadUrl: 'https://tus.io/uploads/parallel-part-1',
        url: 'upload',
      },
      {
        bodySize: 6,
        headers: {
          'Upload-Offset': '0',
        },
        operationId: 'patchTusUpload',
        response: {
          headers: {
            'Upload-Offset': '6',
          },
          statusCode: 204,
        },
        uploadUrl: 'https://tus.io/uploads/parallel-part-2',
        url: 'upload',
      },
      {
        absentHeaders: ['Upload-Length'],
        headers: {
          'Upload-Concat':
            'final;https://tus.io/uploads/parallel-part-1 https://tus.io/uploads/parallel-part-2',
          'Upload-Metadata': 'foo aGVsbG8=',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'https://tus.io/uploads/parallel-final',
          },
          statusCode: 201,
        },
        url: 'endpoint',
      },
    ],
    scenarioId: 'parallelUploadConcat',
  },
  {
    behavior: 'parallel-upload-abort-cleanup',
    completion: {
      kind: 'aborted',
    },
    events: [
      {
        kind: 'request-abort',
        requestIndex: 3,
        key: 'request-abort:3',
      },
    ],
    execution: {
      serverRequestGates: [
        {
          gateId: 'parallel-cleanup-patches',
          heldRequestIndexes: [2, 3],
          kind: 'release-after-all-started',
          releaseAfterRequestIndexes: [2, 3],
          timeoutMs: 2000,
        },
      ],
    },
    featureId: 'parallelUploadConcat',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      fingerprint: 'contract-parallel-cleanup-fingerprint',
      headers: {
        'X-Tus-Contract': 'parallel-cleanup-policy',
        'X-Tus-Trace': 'parallel-cleanup-trace-123',
      },
      kind: 'blob',
      metadataForPartialUploads: {
        test: 'world',
      },
      overridePatchMethod: true,
      parallelUploads: 2,
      terminateUploadOnAbort: true,
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
        headers: {
          'Upload-Concat': 'partial',
          'Upload-Length': '5',
          'Upload-Metadata': 'test d29ybGQ=',
          'X-Tus-Contract': 'parallel-cleanup-policy',
          'X-Tus-Trace': 'parallel-cleanup-trace-123',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'https://tus.io/uploads/parallel-cleanup-part-1',
          },
          statusCode: 201,
        },
        url: 'endpoint',
      },
      {
        headers: {
          'Upload-Concat': 'partial',
          'Upload-Length': '6',
          'Upload-Metadata': 'test d29ybGQ=',
          'X-Tus-Contract': 'parallel-cleanup-policy',
          'X-Tus-Trace': 'parallel-cleanup-trace-123',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'https://tus.io/uploads/parallel-cleanup-part-2',
          },
          statusCode: 201,
        },
        url: 'endpoint',
      },
      {
        bodySize: 5,
        headers: {
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
          'X-HTTP-Method-Override': 'PATCH',
          'X-Tus-Contract': 'parallel-cleanup-policy',
          'X-Tus-Trace': 'parallel-cleanup-trace-123',
        },
        method: 'POST',
        operationId: 'patchTusUpload',
        response: {
          statusCode: 500,
        },
        uploadUrl: 'https://tus.io/uploads/parallel-cleanup-part-1',
        url: 'upload',
      },
      {
        abort: true,
        bodySize: 6,
        headers: {
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
          'X-HTTP-Method-Override': 'PATCH',
          'X-Tus-Contract': 'parallel-cleanup-policy',
          'X-Tus-Trace': 'parallel-cleanup-trace-123',
        },
        method: 'POST',
        operationId: 'patchTusUpload',
        uploadUrl: 'https://tus.io/uploads/parallel-cleanup-part-2',
        url: 'upload',
      },
      {
        headers: {
          'X-Tus-Contract': 'parallel-cleanup-policy',
          'X-Tus-Trace': 'parallel-cleanup-trace-123',
        },
        operationId: 'terminateTusUpload',
        response: {
          statusCode: 204,
        },
        uploadUrl: 'https://tus.io/uploads/parallel-cleanup-part-1',
        url: 'upload',
      },
      {
        headers: {
          'X-Tus-Contract': 'parallel-cleanup-policy',
          'X-Tus-Trace': 'parallel-cleanup-trace-123',
        },
        operationId: 'terminateTusUpload',
        response: {
          statusCode: 204,
        },
        uploadUrl: 'https://tus.io/uploads/parallel-cleanup-part-2',
        url: 'upload',
      },
    ],
    scenarioId: 'parallelUploadAbortCleanup',
  },
  {
    behavior: 'retry-patch-after-offset-recovery',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/retry-contract',
    },
    events: [
      {
        decision: true,
        kind: 'should-retry',
        retryAttempt: 0,
        key: 'should-retry:0:true',
      },
      {
        delay: 0,
        kind: 'retry-schedule',
        key: 'retry-schedule:0',
      },
      {
        decision: true,
        kind: 'should-retry',
        retryAttempt: 0,
        key: 'should-retry:0:true',
      },
      {
        delay: 0,
        kind: 'retry-schedule',
        key: 'retry-schedule:0',
      },
    ],
    featureId: 'retryOffsetRecovery',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      metadata: {
        filename: 'hello.txt',
      },
      retryDelays: [0],
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
          statusCode: 500,
        },
        url: 'upload',
      },
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
    scenarioId: 'retryPatchAfterOffsetRecovery',
  },
  {
    behavior: 'request-lifecycle-hooks',
    completion: {
      kind: 'success',
      uploadUrl: 'https://tus.io/uploads/request-hooks-contract',
    },
    events: [
      {
        kind: 'before-request',
        requestIndex: 0,
        key: 'before-request:0',
      },
      {
        kind: 'after-response',
        requestIndex: 0,
        key: 'after-response:0',
      },
      {
        kind: 'success',
        key: 'success',
      },
      {
        kind: 'source-close',
        key: 'source-close',
      },
    ],
    featureId: 'requestLifecycleHooks',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      uploadUrl: 'https://tus.io/uploads/request-hooks-contract',
    },
    operationIds: ['getTusUploadOffset'],
    primitives: ['run-request-hooks'],
    requests: [
      {
        operationId: 'getTusUploadOffset',
        response: {
          headers: {
            'Upload-Length': '11',
            'Upload-Offset': '11',
          },
          statusCode: 200,
        },
        url: 'upload',
      },
    ],
    scenarioId: 'requestLifecycleHooks',
  },
  {
    behavior: 'abort-upload',
    completion: {
      kind: 'aborted',
    },
    events: [
      {
        kind: 'request-abort',
        requestIndex: 0,
        key: 'request-abort:0',
      },
    ],
    execution: {
      onRequestStart: [
        {
          kind: 'cancel-upload',
          requestIndex: 0,
        },
      ],
    },
    featureId: 'abortUpload',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      kind: 'blob',
      metadata: {
        filename: 'hello.txt',
      },
    },
    operationIds: ['createTusUpload'],
    primitives: ['abort-current-request'],
    requests: [
      {
        abort: true,
        headers: {
          'Upload-Length': '11',
        },
        operationId: 'createTusUpload',
        url: 'endpoint',
      },
    ],
    scenarioId: 'abortUpload',
  },
  {
    behavior: 'abort-upload-after-stored-url',
    completion: {
      kind: 'aborted',
      uploadUrl: 'https://tus.io/uploads/abort-terminate-contract',
    },
    events: [
      {
        kind: 'request-abort',
        requestIndex: 1,
        key: 'request-abort:1',
      },
    ],
    execution: {
      onRequestStart: [
        {
          kind: 'cancel-upload',
          requestIndex: 1,
        },
      ],
    },
    featureId: 'abortUpload',
    input: {
      content: 'hello world',
      endpointUrl: 'https://tus.io/uploads',
      fingerprint: 'contract-abort-terminate-fingerprint',
      headers: {
        'X-Tus-Contract': 'abort-policy',
        'X-Tus-Trace': 'abort-trace-123',
      },
      kind: 'blob',
      metadata: {
        filename: 'hello.txt',
      },
      overridePatchMethod: true,
      terminateUploadOnAbort: true,
    },
    operationIds: ['createTusUpload', 'patchTusUpload', 'terminateTusUpload'],
    primitives: ['abort-current-request', 'terminate-upload'],
    requests: [
      {
        headers: {
          'Upload-Length': '11',
        },
        operationId: 'createTusUpload',
        response: {
          headers: {
            Location: 'https://tus.io/uploads/abort-terminate-contract',
          },
          statusCode: 201,
        },
        url: 'endpoint',
      },
      {
        abort: true,
        bodySize: 11,
        headers: {
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': '0',
          'X-HTTP-Method-Override': 'PATCH',
          'X-Tus-Contract': 'abort-policy',
          'X-Tus-Trace': 'abort-trace-123',
        },
        method: 'POST',
        operationId: 'patchTusUpload',
        url: 'upload',
      },
      {
        headers: {
          'X-Tus-Contract': 'abort-policy',
          'X-Tus-Trace': 'abort-trace-123',
        },
        operationId: 'terminateTusUpload',
        response: {
          statusCode: 204,
        },
        url: 'upload',
      },
    ],
    scenarioId: 'abortUploadAfterStoredUrl',
  },
  {
    behavior: 'terminate-with-retry',
    completion: {
      kind: 'terminated',
      uploadUrl: 'https://tus.io/uploads/terminate-contract',
    },
    events: [
      {
        decision: true,
        kind: 'should-retry',
        retryAttempt: 0,
        key: 'should-retry:0:true',
      },
      {
        delay: 0,
        kind: 'retry-schedule',
        key: 'retry-schedule:0',
      },
    ],
    execution: {
      onChunkComplete: [
        {
          kind: 'abort-upload',
          terminateUpload: true,
        },
      ],
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
