import { Upload } from '../../lib.esm/node/index.js'
import {
  fail,
  loadScenario,
  requireTusConformanceScenario,
  TusConformanceHttpStack,
  tusConformanceUploadInput,
  tusConformanceUploadOptions,
  writeJsonResult,
} from '../api2-devdock-shared/scenario.js'

async function validateStartOptions(conformanceScenario) {
  const content = await tusConformanceUploadInput(conformanceScenario)
  const httpStack = new TusConformanceHttpStack(conformanceScenario)
  const upload = new Upload(content, {
    ...tusConformanceUploadOptions(conformanceScenario),
    httpStack,
  })

  let capturedError = null
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('start option validation scenario did not fail before timeout'))
    }, 1000)

    upload.options.onError = (error) => {
      clearTimeout(timeout)
      capturedError = error
      resolve()
    }
    upload.options.onSuccess = () => {
      clearTimeout(timeout)
      reject(new Error('start option validation scenario unexpectedly succeeded'))
    }

    upload.start()
  })

  if (!(capturedError instanceof Error)) {
    fail('start option validation scenario did not capture an Error instance')
  }

  if (httpStack.nextRequestIndex !== 0) {
    fail(`start option validation scenario expected no requests, got ${httpStack.nextRequestIndex}`)
  }

  return {
    errorCaught: true,
    errorMessage: capturedError.message,
    requestCount: httpStack.nextRequestIndex,
  }
}

async function main() {
  const scenario = await loadScenario(import.meta.url)
  const conformanceScenario = requireTusConformanceScenario(scenario)
  const result = await validateStartOptions(conformanceScenario)
  await writeJsonResult(result)
  console.log(
    `TypeScript TUS SDK devdock scenario ${scenario.scenarioId} rejected ${conformanceScenario.completion.reason}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
