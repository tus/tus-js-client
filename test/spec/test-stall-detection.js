import { Upload } from "tus-js-client"
import { TestHttpStack, getBlob, waitableFunction } from "./helpers/utils.js"

describe("tus-stall-detection", () => {
  describe("configuration options", () => {
    it("should apply default stall detection options when enabled", () => {
      const testStack = new TestHttpStack()
      const file = getBlob("hello world")

      const options = {
        httpStack: testStack,
        endpoint: "https://tus.io/uploads",
        stallDetection: {
          enabled: true,
        },
      }

      const upload = new Upload(file, options)

      // Verify stall detection is enabled with default values
      expect(upload.options.stallDetection.enabled).toBe(true)
      expect(upload.options.stallDetection.stallTimeout).toBe(30000)
      expect(upload.options.stallDetection.checkInterval).toBe(5000)
      expect(upload.options.stallDetection.minimumBytesPerSecond).toBe(1)

      // Abort to clean up
      upload.abort()
    })

    it("should apply custom stall detection options", () => {
      const testStack = new TestHttpStack()
      const file = getBlob("hello world")

      const customOptions = {
        enabled: true,
        stallTimeout: 15000,
        checkInterval: 2500,
        minimumBytesPerSecond: 10,
      }

      const options = {
        httpStack: testStack,
        endpoint: "https://tus.io/uploads",
        stallDetection: customOptions,
      }

      const upload = new Upload(file, options)

      // Verify the custom options were applied
      expect(upload.options.stallDetection.enabled).toBe(true)
      expect(upload.options.stallDetection.stallTimeout).toBe(15000)
      expect(upload.options.stallDetection.checkInterval).toBe(2500)
      expect(upload.options.stallDetection.minimumBytesPerSecond).toBe(10)

      // Abort to clean up
      upload.abort()
    })

    it("should disable stall detection when configured", () => {
      const testStack = new TestHttpStack()
      const file = getBlob("hello world")

      const options = {
        httpStack: testStack,
        endpoint: "https://tus.io/uploads",
        stallDetection: {
          enabled: false,
        },
      }

      const upload = new Upload(file, options)

      // Verify stall detection is disabled
      expect(upload.options.stallDetection.enabled).toBe(false)

      // Abort to clean up
      upload.abort()
    })
  })

  describe("integration tests", () => {
    it("should upload a file with stall detection enabled", async () => {
      const testStack = new TestHttpStack()
      const file = getBlob("hello world")

      const options = {
        httpStack: testStack,
        endpoint: "https://tus.io/uploads",
        stallDetection: {
          enabled: true,
          checkInterval: 1000,
          stallTimeout: 2000,
          minimumBytesPerSecond: 1,
        },
        onSuccess: waitableFunction("onSuccess"),
        onError: waitableFunction("onError"),
      }

      const upload = new Upload(file, options)
      upload.start()

      // Handle the POST request to create the upload
      let req = await testStack.nextRequest()
      expect(req.url).toBe("https://tus.io/uploads")
      expect(req.method).toBe("POST")

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: "https://tus.io/uploads/12345",
        },
      })

      // Handle the PATCH request to upload the file
      req = await testStack.nextRequest()
      expect(req.url).toBe("https://tus.io/uploads/12345")
      expect(req.method).toBe("PATCH")

      // Complete the upload quickly (before stall detection triggers)
      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": "11",
        },
      })

      // Wait for the upload to complete successfully
      await options.onSuccess.toBeCalled()

      // Make sure the error callback was not called
      expect(options.onError.calls.count()).toBe(0)
    })

    it("should call _handleStall with the correct error message", () => {
      const testStack = new TestHttpStack()
      const file = getBlob("hello world")

      // Mock error handler to capture the error
      const errorSpy = jasmine.createSpy("errorSpy")

      const options = {
        httpStack: testStack,
        endpoint: "https://tus.io/uploads",
        stallDetection: {
          enabled: true,
        },
        // Disable retries so we get the error directly
        retryDelays: null,
        onError: (error) => {
          errorSpy(error.message)
        },
      }

      const upload = new Upload(file, options)

      // Directly call _handleStall to simulate stall detection
      upload._handleStall("test reason")

      // Verify the error message format
      expect(errorSpy).toHaveBeenCalledWith("Upload stalled: test reason")
    })

    it("should handle errors from stall detection", async () => {
      const testStack = new TestHttpStack()
      const file = getBlob("hello world")

      // Create spies to track callbacks
      const errorSpy = jasmine.createSpy("errorSpy")

      const options = {
        httpStack: testStack,
        endpoint: "https://tus.io/uploads",
        stallDetection: {
          enabled: true,
        },
        // No retries to get immediate error
        retryDelays: null,
        onError: (error) => {
          errorSpy(error.message)
        },
      }

      const upload = new Upload(file, options)
      upload.start()

      // Handle the POST request to create the upload
      let req = await testStack.nextRequest()

      req.respondWith({
        status: 201,
        responseHeaders: {
          Location: "https://tus.io/uploads/12345",
        },
      })

      // Handle first PATCH request
      req = await testStack.nextRequest()

      req.respondWith({
        status: 204,
        responseHeaders: {
          "Upload-Offset": "5", // Partial progress
        },
      })

      // Simulate stall detection
      upload._handleStall("test stall")

      // Verify error was emitted with correct message
      expect(errorSpy).toHaveBeenCalled()
      expect(errorSpy.calls.mostRecent().args[0]).toContain(
        "Upload stalled: test stall"
      )
    })
  })
})
