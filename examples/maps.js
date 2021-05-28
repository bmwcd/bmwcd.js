#!/usr/bin/env node
const bmwcd = require('..')
require('dotenv').config()

let account, vehicle, status

(async () => {
  account = await bmwcd.auth(process.env.BMW_USERNAME, process.env.BMW_PASSWORD)
  vehicle = await account.findVehicle(process.env.BMW_VIN)
  status = await vehicle.location()
  console.log(status)
  console.log(status.mapsUrl)
})()
