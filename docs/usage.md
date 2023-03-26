# Usage

This document contains an introduction and example about how to use tus-js-client. Please see the [API reference](/docs/api.md) for a more detailed explanation about alls available methods and classes.

The basic flow is for every application the same:

1. **Obtain** the file that you want to upload (e.g. let the user select a file using an input element).
2. **Create** a new `tus.Upload` instance by passing the file to be uploaded alongside additional options.
3. Optionally **fetch** a list of previously started uploads using `tus.Upload#findPreviousUploads` method and select one of them to resume using `tus.Upload#resumeFromPreviousUpload`.
4. **Start** the upload using the `tus.Upload#start` function. This will create the upload resource on the server if necessary and then transfer the file to the remote endpoint.
5. Optionally **pause** the upload if the user/application wishes to do so using `tus.Upload#abort`. This will cause any currently running transfers to be immediately stopped.
6. Optionally **unpause** the previously paused upload by called `Upload#start` again. This will resume the upload at the point at which it had stopped before. You can also use this approach to continue the upload after an error has occurred.

## Example: Simple file upload

This example demonstrates the most basic usage of tus-js-client where a single file is uploaded to a tus server:

```js
input.addEventListener('change', function (e) {
  // Get the selected file from the input element
  var file = e.target.files[0]

  // Create a new tus upload
  var upload = new tus.Upload(file, {
    // Endpoint is the upload creation URL from your tus server
    endpoint: 'http://localhost:1080/files/',
    // Retry delays will enable tus-js-client to automatically retry on errors
    retryDelays: [0, 3000, 5000, 10000, 20000],
    // Attach additional meta data about the file for the server
    metadata: {
      filename: file.name,
      filetype: file.type,
    },
    // Callback for errors which cannot be fixed using retries
    onError: function (error) {
      console.log('Failed because: ' + error)
    },
    // Callback for reporting upload progress
    onProgress: function (bytesUploaded, bytesTotal) {
      var percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
      console.log(bytesUploaded, bytesTotal, percentage + '%')
    },
    // Callback for once the upload is completed
    onSuccess: function () {
      console.log('Download %s from %s', upload.file.name, upload.url)
    },
  })

  // Check if there are any previous uploads to continue.
  upload.findPreviousUploads().then(function (previousUploads) {
    // Found previous uploads so we select the first one.
    if (previousUploads.length) {
      upload.resumeFromPreviousUpload(previousUploads[0])
    }

    // Start the upload
    upload.start()
  })
})
```

## Example: Upload with pause button

This example shows how you can implement a pauseable upload using tus-js-client. The upload can be paused and unpaused using two buttons:

```js
// Obtain file from user input or similar
var file = ...

function startOrResumeUpload(upload) {
    // Check if there are any previous uploads to continue.
    upload.findPreviousUploads().then(function (previousUploads) {
        // Found previous uploads so we select the first one.
        if (previousUploads.length) {
            upload.resumeFromPreviousUpload(previousUploads[0])
        }

        // Start the upload
        upload.start()
    })
}

// Create the tus upload similar to the example from above
var upload = new tus.Upload(file, {
    endpoint: "http://localhost:1080/files/",
    onError: function(error) {
        console.log("Failed because: " + error)
    },
    onSuccess: function() {
        console.log("Download %s from %s", upload.file.name, upload.url)
    }
})

// Add listeners for the pause and unpause button
var pauseButton   = document.querySelector("#pauseButton")
var unpauseButton = document.querySelector("#unpauseButton")

pauseButton.addEventListener("click", function() {
    upload.abort()
})

unpauseButton.addEventListener("click", function() {
    startOrResumeUpload(upload)
})

// Start the upload by default
startOrResumeUpload(upload)
```

## Example: Let user select upload to resume

If tus-js-client creates an upload, it will by default save the upload URL in the URL storage. If a user selects the same file in another browsing session (e.g. after the browser has been accidentally closed), the application can query the URL storage to retrieve the original upload URL again and instruct tus-js-client to resume from that upload. This way, the resumability is also possible across browser sessions.

This example shows how the application can query the URL Storage to find uploads and how to ask the end user which upload should be resumed:

```js
var file = ...
var options = ...
var upload = new tus.Upload(file, options)

// Retrieve a list of uploads that have been previously started for this file.
// These uploads will be queried from the URL Storage using the file's fingerprint.
upload.findPreviousUploads().then((previousUploads) => {
    // previousUploads is an array containing details about the previously started uploads.
    // The objects in the array have following properties:
    // - size: The upload's size in bytes
    // - metadata: The metadata associated with the upload during its creation
    // - creationTime: The timestamp when the upload was created

    // We ask the end user if they want to resume one of those uploads or start a new one.
    var chosenUpload = askToResumeUpload(previousUploads);

    // If an upload has been chosen to be resumed, instruct the upload object to do so.
    if(chosenUpload) {
        upload.resumeFromPreviousUpload(chosenUpload);
    }

    // Finally start the upload requests.
    upload.start();
});

// Open a dialog box to the user where they can select whether they want to resume an upload
// or instead create a new one.
function askToResumeUpload(previousUploads) {
  if (previousUploads.length === 0) return null;

  var text = "You tried to upload this file previously at these times:\n\n";
  previousUploads.forEach((previousUpload, index) => {
    text += "[" + index + "] " + previousUpload.creationTime + "\n";
  });
  text += "\nEnter the corresponding number to resume an upload or press Cancel to start a new upload";

  var answer = prompt(text);
  var index = parseInt(answer, 10);

  if (!isNaN(index) && previousUploads[index]) {
    return previousUploads[index];
  }
}
```

## Example: Upload to Vimeo

The Vimeo API uses tus for its upload but has a bit unusual implementation detail: It already creates the tus upload on the server for you, so you don't have to use `endpoint` option but must use `uploadUrl` instead:

```js
// Obtain video to upload from user input or similar
var file = ...

// The upload URL you get from the Vimeo API for uploading
var uploadUrl = ...

// Create the tus upload similar to the example from above
var upload = new tus.Upload(file, {
    uploadUrl: uploadUrl,
    onError: function(error) {
        console.log("Failed because: " + error)
    },
    onSuccess: function() {
        console.log("Download %s from %s", upload.file.name, upload.url)
    }
})

// Start the upload
upload.start()
```

## Example: Overriding the default retry behavior

In some cases it might be desirable to change the condition for which an upload will be retried. This example shows how to override the default retry behavior with a callback function where no retry will occur after a 403 status code (indicating a permission issue) is received. This will cause the error message to be directly logged instead of the retrys kicking in.

```js
input.addEventListener('change', function (e) {
  // Get the selected file from the input element
  var file = e.target.files[0]

  // Create a new tus upload
  var upload = new tus.Upload(file, {
    endpoint: 'http://localhost:1080/files/',
    retryDelays: [0, 3000, 5000, 10000, 20000],
    metadata: {
      filename: file.name,
      filetype: file.type,
    },
    onError: function (error) {
      // Display an error message
      console.log('Failed because: ' + error)
    },
    onShouldRetry: function (err, retryAttempt, options) {
      var status = err.originalResponse ? err.originalResponse.getStatus() : 0
      // If the status is a 403, we do not want to retry.
      if (status === 403) {
        return false
      }

      // For any other status code, tus-js-client should retry.
      return true
    },
  })

  // Check if there are any previous uploads to continue.
  upload.findPreviousUploads().then(function (previousUploads) {
    // Found previous uploads so we select the first one.
    if (previousUploads.length) {
      upload.resumeFromPreviousUpload(previousUploads[0])
    }

    // Start the upload
    upload.start()
  })
})
```

## More examples

Complete example applications can be found in the demos folder:

- `/demos/browser`: Example website for upload a user-selected file
- `/demos/nodejs`: Example script for uploading a file from Node.js
- `/demos/reactnative`: Example application using React Native
- `/demos/cordova`: Example application using Apache Cordova
