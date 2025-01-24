#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.join(__dirname, '..', '..')
const tusJsPath = path.join(rootDir, '..', '..', 'dist', 'tus.js')
const assetsDir = path.join(rootDir, 'www', 'js', 'tus.js')

fs.copyFile(tusJsPath, assetsDir, (err) => {
  if (err) throw err
})
