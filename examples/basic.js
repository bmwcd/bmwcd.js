#!/usr/bin/env node
require('dotenv').config()
const bmwcd = require('bmwcd.js')
let account, vehicle, status

const main = async () => {
  account = await bmwcd.auth(process.env.BMW_USERNAME, process.env.BMW_PASSWORD)
  vehicle = await account.findVehicle(process.env.BMW_VIN)
  status = await vehicle.status(true)
  console.log(JSON.stringify(status, null, 2))
}

main()
