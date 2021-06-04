#!/usr/bin/env node
// import chalk from "chalk"
// import * as cmd from "commander"
// import * as path from "path"
// import { readFileSync, writeFileSync, existsSync } from "fs"
// import { spawnSync, execSync } from "child_process"
// import { BmwCD } from "bmwcd.js"

const chalk = require('chalk')
const cmd = require('commander')
const path = require('path')
const { readFileSync, writeFileSync, existsSync } = require('fs')
const { spawnSync, execSync } = require('child_process')
const { BmwCD, moment, utils } = require('./bmwcd.js')

const log = (...args) => {
  console.log(typeof (...args))
  console.log('[bmwcd.js]: ', ...args)
}

const error = (...args) => {
  console.error('[bmwcd.js]: ', ...args)
  process.exit(1)
}

// begin bmwcd.js command line interface
cmd.version(require('../package.json').version)

cmd.option('-u --user <user>', 'ConnectedDrive Username', 
(user) => {
  user = urlencode(user).toString()
  if (user) process.env.BMW_USERNAME = user
  else error('-u username required')
})

cmd.option('-p --password <password>', 'ConnectedDrive Password', 
(password) => {
  password = urlencode(password).toString()
  if (password.length > 5) process.env.BMW_PASSWORD = password
  else error('-p password required')
})

cmd.option('-c --config <config.json>', 'path to config file', 
(file) => {
  file = path.resolve(process.cwd(), file)

  if ((path.existsSync || fs.existsSync)(file)) {
    process.env.JSBIN_CONFIG = file
  } else {
    error('-c config must be path to a valid config file')
  }
})

cmd.option('-l --logger <default|short|tiny|dev|none>', 'server logger option',
(logger) => {
  var valid = 'default short tiny dev none'.split(' ')

  if (valid.indexOf(logger) !== -1) {
    process.env.JSBIN_LOGGER = logger
  } else {
    error('-l logger must be one of "' + valid.join('" or "') + '"')
  }
})

cmd.option('-e --env <development>', 'deployment environment', 
(env) => {
  process.env.NODE_ENV = env
})

cmd.parse(process.argv)

// const bmwcd = require('./bmwcd.js');
// app = jsbin.app;
// app.connect();
