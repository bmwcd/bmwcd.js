#!/usr/bin/env node
import BmwCD from '../src/bmwcd.js'
let vehicles, vehicle, status, account
const bmw = new BmwCD(process.env.BMW_USERNAME, process.env.BMW_PASSWORD)

const main = async () => {
  account = await bmw.auth()
  vehicles = await account.getVehicles()
  vehicle = await account.findVehicle(vehicles[0].vin)
  status = await vehicle.status(true)
  console.log(JSON.stringify(status, null, 2))
}
main()
