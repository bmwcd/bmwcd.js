#!/usr/bin/env node

require('dotenv').config()
const connectedDrive = require('..')
let BMW_VIN = process.env.BMW_VIN || null
let account, vehicles, vehicle, status
const _log = async (...args) => { await console.log(...args) }

const getVehicle = async () => {
  account = await connectedDrive.auth(process.env.BMW_USERNAME, process.env.BMW_PASSWORD)
  vehicles = await account.vehicles()
  if (BMW_VIN.length !== 17) BMW_VIN = vehicles[0].vin
  const properties = vehicles.find(v => v.vin === BMW_VIN)
  return await account.findVehicle(properties.vin)
}

const main = async () => {
  vehicle = await getVehicle()
  status = await vehicle.status(false)

  _log(JSON.stringify(status, null, 2))
}

main()
