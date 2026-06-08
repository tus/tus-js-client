export async function assertUrlStorage(urlStorage, scenario) {
  const keyRefs = new Map()
  const expectedUploads = new Map()

  for (const action of scenario.actions) {
    if (action.kind === 'assert-empty') {
      expect(await urlStorage.findAllUploads()).toEqual([])
      continue
    }

    if (action.kind === 'add-upload') {
      const upload = clone(action.upload)
      const key = await urlStorage.addUpload(action.fingerprint, upload)
      expect(key.startsWith(action.expectedKeyPrefix)).toBe(true)
      keyRefs.set(action.keyRef, key)
      expectedUploads.set(action.keyRef, { ...clone(action.upload), urlStorageKey: key })
      continue
    }

    if (action.kind === 'find-by-fingerprint') {
      expectStoredUploads(
        await urlStorage.findUploadsByFingerprint(action.fingerprint),
        expectedUploadsForRefs(expectedUploads, action.expectedKeyRefs),
      )
      continue
    }

    if (action.kind === 'find-all') {
      expectStoredUploads(
        await urlStorage.findAllUploads(),
        expectedUploadsForRefs(expectedUploads, action.expectedKeyRefs),
      )
      continue
    }

    if (action.kind === 'remove-upload') {
      const key = keyRefs.get(action.keyRef)
      if (key == null) {
        throw new Error(`Generated URL storage scenario references unknown key: ${action.keyRef}`)
      }

      await urlStorage.removeUpload(key)
      expectedUploads.delete(action.keyRef)
      continue
    }

    throw new Error(`Unsupported generated URL storage scenario action: ${action.kind}`)
  }
}

export function findUrlStorageScenario(scenarios, scenarioId) {
  const scenario = scenarios.find((candidate) => candidate.scenarioId === scenarioId)
  if (!scenario) {
    throw new Error(`Missing generated URL storage conformance scenario: ${scenarioId}`)
  }

  return scenario
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function expectedUploadsForRefs(expectedUploads, refs) {
  return refs.map((ref) => {
    const upload = expectedUploads.get(ref)
    if (!upload) {
      throw new Error(`Generated URL storage scenario references unknown expected upload: ${ref}`)
    }

    return upload
  })
}

function expectStoredUploads(actual, expected) {
  expect(sortStoredUploads(actual)).toEqual(sortStoredUploads(expected))
}

function sortStoredUploads(result) {
  return [...result].sort((a, b) => {
    if (a.id !== b.id) {
      return a.id - b.id
    }

    return String(a.urlStorageKey).localeCompare(String(b.urlStorageKey))
  })
}
