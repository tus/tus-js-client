// This is a test file for ensuring that the type definitions in index.d.ts are
// working correctly. For more details see:
// https://github.com/SamVerschueren/tsd

import * as tus from '../';
import {expectType} from 'tsd';

expectType<boolean>(tus.isSupported);
expectType<boolean>(tus.canStoreURLs);

const file = new File(["foo"], "foo.txt", {
  type: "text/plain",
});

const upload = new tus.Upload(file, {
    endpoint: "",
    fingerprint: (file: File) => Promise.resolve(file.name),
    metadata: {
        filename: "foo.txt"
    },
    onProgress: (bytesSent: number, bytesTotal: number) => {
        const percentage = (bytesSent / bytesTotal * 100).toFixed(2);
        console.log(bytesSent, bytesTotal, percentage + "%");
    },
    onChunkComplete: (chunkSize: number, bytesAccepted: number) => {},
    onSuccess: () => {
    	console.log("Download from %s complete", upload.url);
    },
    onError: (error: Error) => {
    	console.log("Failed because: " + error);
    },
    headers: {TestHeader: 'TestValue'},
    chunkSize: 100,
    uploadUrl: "",
    uploadSize: 50,
    overridePatchMethod: true,
    retryDelays: [10, 20, 50],
    removeFingerprintOnSuccess: true,
    parallelUploads: 42,
    onAfterResponse: function (req: tus.HttpRequest, res: tus.HttpResponse) {
	    var url = req.getURL();
	    var value = res.getHeader("X-My-Header");
	    console.log(`Request for ${url} responded with ${value}`);
	}
});

upload.start();

upload.findPreviousUploads().then((uploads: tus.PreviousUpload[]) => {
	upload.resumeFromPreviousUpload(uploads[0]);
})

upload.abort();
upload.abort(true).then(() => {});

const upload2 = new tus.Upload(file, {
	endpoint: ""
});

const reader = {
    read: () => Promise.resolve({ done: true, value: '' }),
};
const upload3 = new tus.Upload(reader, {
    endpoint: '',
    uploadLengthDeferred: true,
});

tus.Upload.terminate('https://myurl.com', {
	endpoint: ""
});
