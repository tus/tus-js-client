module.exports = async function assertUrlStorage(urlStorage) {
  // In the beginning of the test, the storage should be empty.
  let result = await urlStorage.findAllUploads();
  expect(result).toEqual([]);

  // Add a few uploads into the storage
  const key1 = await urlStorage.addUpload("fingerprintA", { id: 1 });
  const key2 = await urlStorage.addUpload("fingerprintA", { id: 2 });
  const key3 = await urlStorage.addUpload("fingerprintB", { id: 3 });

  expect(/^tus::fingerprintA::/.test(key1)).toBe(true);
  expect(/^tus::fingerprintA::/.test(key2)).toBe(true);
  expect(/^tus::fingerprintB::/.test(key3)).toBe(true);

  // Query the just stored uploads individually
  result = await urlStorage.findUploadsByFingerprint("fingerprintA");
  sort(result);
  expect(result).toEqual([
    { id: 1, urlStorageKey: key1 },
    { id: 2, urlStorageKey: key2 }
  ]);

  result = await urlStorage.findUploadsByFingerprint("fingerprintB");
  sort(result);
  expect(result).toEqual([
    { id: 3, urlStorageKey: key3 }
  ]);

  // Check that we can retrieve all stored uploads
  result = await urlStorage.findAllUploads();
  sort(result);
  expect(result).toEqual([
    { id: 1, urlStorageKey: key1 },
    { id: 2, urlStorageKey: key2 },
    { id: 3, urlStorageKey: key3 }
  ]);

  // Check that it can remove an upload and will not return it back
  await urlStorage.removeUpload(key2);
  await urlStorage.removeUpload(key3);

  result = await urlStorage.findUploadsByFingerprint("fingerprintA");
  expect(result).toEqual([
    { id: 1, urlStorageKey: key1 }
  ]);

  result = await urlStorage.findUploadsByFingerprint("fingerprintB");
  expect(result).toEqual([]);
};

// Sort the results from the URL storage since the order in not deterministic.
function sort(result) {
  result.sort((a, b) => a.id - b.id);
}
