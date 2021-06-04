#!/usr/bin/env node
require('dotenv').config()
const bmwcd = require('..')
const moment = require('moment')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

let account, vehicle, status

const writeData = async (dataFile, data) => {
  const fd = fs.openSync(dataFile, 'a+')
  fs.writeFileSync(fd, JSON.stringify(status, null, 2), { flag: 'a+' })
  fs.closeSync(fd)
}

(async () => {
  account = await bmwcd.auth(process.env.BMW_USERNAME, process.env.BMW_PASSWORD)
  vehicle = await account.findVehicle(process.env.BMW_VIN)
  status = await vehicle.status(true)
  const dataPath = path.join(
    process.cwd(),
    'data',
    moment().format('MM-YYYY'),
    status.vehicle.id
  )
  const dataFile = path.join(dataPath, moment().format('[status_]X[.json]'))
  await exec(
    `if [ ! -e "${dataPath}" ]; then mkdir -p "${dataPath}"; fi`,
    (error, stdout, stderr) => {
      if (!error) writeData(dataFile, status)
      console.log(`file://${dataFile}`)
    }
  )
  console.log(JSON.stringify(status, null, 2))
})()
