/* global tus */
/* eslint no-console: 0 */

"use strict";

var upload          = null;
var uploadIsRunning = false;
var toggleBtn       = document.querySelector("#toggle-btn");
var recordBtn       = document.querySelector("#record-btn");
var resumeCheckbox  = document.querySelector("#resume");
var input           = document.querySelector("input[type=file]");
var progress        = document.querySelector(".progress");
var progressBar     = progress.querySelector(".bar");
var alertBox        = document.querySelector("#support-alert");
var uploadList      = document.querySelector("#upload-list");
var chunkInput      = document.querySelector("#chunksize");
var endpointInput   = document.querySelector("#endpoint");

if (!tus.isSupported) {
  alertBox.classList.remove("hidden");
}

if (!toggleBtn) {
  throw new Error("Toggle button not found on this page. Aborting upload-demo. ");
}

toggleBtn.addEventListener("click", function (e) {
  e.preventDefault();

  if (upload) {
    if (uploadIsRunning) {
      upload.abort();
      toggleBtn.textContent = "resume upload";
      uploadIsRunning = false;
    } else {
      upload.start();
      toggleBtn.textContent = "pause upload";
      uploadIsRunning = true;
    }
  } else {
    if (input.files.length > 0) {
      startUpload();
    } else {
      input.click();
    }
  }
});


let stopRecording;
recordBtn.addEventListener("click", function (e) {
  console.log({stopRecording});
  e.preventDefault();
  if (upload) {
    recordBtn.textContent = "start recording";
    stopRecording();
  } else {
    recordBtn.textContent = "stop recording";
    startStreamUpload();
  }
});

input.addEventListener("change", startFileUpload);


function startUpload(file, passedOptions) {
  passedOptions = passedOptions || {};
  var endpoint = endpointInput.value;
  var chunkSize = parseInt(chunkInput.value, 10);
  if (isNaN(chunkSize)) {
    chunkSize = Infinity;
  }

  toggleBtn.textContent = "pause upload";

  var options = {
    endpoint: endpoint,
    resume  : !resumeCheckbox.checked,
    chunkSize: chunkSize,
    retryDelays: [0, 1000, 3000, 5000],
    metadata: {
      filename: file.name,
      filetype: file.type
    },
    onError : function (error) {
      if (error.originalRequest) {
        if (window.confirm("Failed because: " + error + "\nDo you want to retry?")) {
          upload.start();
          uploadIsRunning = true;
          return;
        }
      } else {
        window.alert("Failed because: " + error);
      }

      reset();
    },
    onProgress: function (bytesUploaded, bytesTotal) {
      var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
      progressBar.style.width = percentage + "%";
      console.log(bytesUploaded, bytesTotal, percentage + "%");
    },
    onSuccess: function () {
      var listItem = document.createElement("li");
      if (upload.file.type.startsWith("video")) {
        var video = document.createElement("video");
        video.controls = true;
        video.height = 100;
        video.src = upload.url;
        listItem.appendChild(video);
      } else {
        var anchor = document.createElement("a");
        anchor.textContent = "Download " + upload.file.name + " (" + upload.file.size + " bytes)";
        anchor.href = upload.url;
        anchor.className = "btn btn-success";
        listItem.appendChild(anchor);
      }
      uploadList.appendChild(listItem);
      reset();
    }
  };

  Object.assign(options, passedOptions);

  upload = new tus.Upload(file, options);
  upload.start();
  uploadIsRunning = true;
}

function startStreamUpload() {
  navigator.mediaDevices.getUserMedia({video: true})
  .then(stream => {
    const mr = new MediaRecorder(stream);

    const chunks = [];
    let done = false;
    mr.onerror = e => { console.log("onerror", e); };
    mr.onstop = () => { done = true; };
    mr.ondataavailable = e => {
      chunks.push(e.data);
      if (onDataAvailable) {
        onDataAvailable(readableRecorder.read());
        onDataAvailable = undefined;
      }
    };
    let onDataAvailable;
    mr.start(1000);

    const readableRecorder = {
      read() {
        if (done && chunks.length === 0) {
          return Promise.resolve({ done: true });
        }

        if (chunks.length > 0) {
          return Promise.resolve({ value: chunks.shift(), done: false });
        }

        return new Promise((resolve) => { onDataAvailable = resolve; });
      },
      name: `foo${Math.random()}.webm`,
      type: "video/webm"
    };

    startUpload(readableRecorder, {uploadLengthDeferred: true});

    stopRecording = () => {
      stream.getTracks().forEach(t => t.stop());
      mr.stop();
    };
  });
}


function startFileUpload() {
  var file = input.files[0];
  // Only continue if a file has actually been selected.
  // IE will trigger a change event even if we reset the input element
  // using reset() and we do not want to blow up later.
  if (!file) {
    return;
  }

  startUpload(file);
}

function reset() {
  input.value = "";
  toggleBtn.textContent = "start upload";
  upload = null;
  uploadIsRunning = false;
}
