/* global tus */
/* eslint no-console: 0 */

var upload = null;
var stopBtn = document.querySelector("#stop-btn");
var resumeCheckbox = document.querySelector("#resume");
var input = document.querySelector("input[type=file]");
var progress = document.querySelector(".progress");
var progressBar = progress.querySelector(".bar");
var alertBox = document.querySelector("#support-alert");
var chunkInput = document.querySelector("#chunksize");
var endpointInput = document.querySelector("#endpoint");

if (!tus.isSupported) {
  alertBox.className = alertBox.className.replace("hidden", "");
}

stopBtn.addEventListener("click", function (e) {
  e.preventDefault();

  if (upload) {
    upload.abort();
  }
});

input.addEventListener("change", function (e) {
  var file = e.target.files[0];
  // Only continue if a file has actually been selected.
  // IE will trigger a change event if we reset the input element
  // inside reset() and we do not want to blow up later.
  if (!file) {
      return;
  }

  console.log("selected file", file);

  stopBtn.classList.remove("disabled");
  var endpoint = endpointInput.value;
  var chunkSize = parseInt(chunkInput.value, 10);
  if (isNaN(chunkSize)) {
    chunkSize = Infinity;
  }

  var options = {
    endpoint: endpoint,
    resume: !resumeCheckbox.checked,
    chunkSize: chunkSize,
    retryDelays: [0, 1000, 2000],
    metadata: {
        filename: file.name
    },
    onError: function (error) {
      if (error.originalRequest) {
        if (confirm("Failed because: " + error + "\nDo you want to retry?")) {
          options.resume = false;
          options.uploadUrl = upload.url;
          upload = new tus.Upload(file, options);
          upload.start();
          return;
        }
      } else {
        alert("Failed because: " + error);
      }

      reset();
    },
    onProgress: function (bytesUploaded, bytesTotal) {
      var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
      progressBar.style.width = percentage + "%";
      console.log(bytesUploaded, bytesTotal, percentage + "%");
    },
    onSuccess: function () {
      reset();
      var anchor = document.createElement("a");
      anchor.textContent = "Download " + upload.file.name + " (" + upload.file.size + " bytes)";
      anchor.href = upload.url;
      anchor.className = "btn btn-success";
      e.target.parentNode.appendChild(anchor);
    }
  };

  upload = new tus.Upload(file, options);
  upload.start();
});

function reset() {
  input.value = "";
  stopBtn.classList.add("disabled");
  progress.classList.remove("active");
}
