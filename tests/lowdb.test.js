#!/usr/bin/env node

import { Low, JSONFile } from 'lowdb'
// require('dotenv').config()
import { join } from 'path'
import * as connectedDrive from '../index.js'
// const connectedDrive = require('..')

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
  const adapter = new JSONFile(join(__dirname, 'db.json'))
  const db = new Low(adapter)
  await db.read()
  // default data if file doesn't exist
  if (db.data === undefined || !db.data) db.data = { updates: [] }

  vehicle = await getVehicle()
  status = await vehicle.status()

  _log(JSON.stringify(status, null, 2))

  db.data.updates.push(status)
  _log('Pushed status to db.json')

  // write to file
  await db.write()
}

main()
