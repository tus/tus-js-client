module.exports = function(grunt) {
    var browsers = [{
        browserName: "firefox",
        version: "19",
        platform: "XP"
    }, {
        browserName: "googlechrome",
        platform: "XP"
    }, {
        browserName: "googlechrome",
        platform: "linux"
    }, {
        browserName: "internet explorer",
        platform: "WIN8",
        version: "10"
    }]

    grunt.initConfig({
        connect: {
            server: {
                options: {
                    base: "",
                    port: 9999
                }
            }
        },
        "saucelabs-jasmine": {
            all: {
                options: {
                    urls: ["http://127.0.0.1:9999/test/SpecRunner.html"],
                    tunnelTimeout: 5,
                    build: process.env.TRAVIS_JOB_ID,
                    concurrency: 3,
                    browsers: browsers,
                    testname: "tus-js-client",
                    tags: ["master"]
                }
            }
        }
    })

    // Loading dependencies
    for (var key in grunt.file.readJSON("package.json").devDependencies) {
        if (key !== "grunt" && key.indexOf("grunt") === 0) grunt.loadNpmTasks(key)
    }

    grunt.registerTask("test", ["connect", "saucelabs-jasmine"])
}
