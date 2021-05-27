# bmwcd.js

Lightweight module for requesting vehicle status and Remote Services via the BMW ConnectedDrive API.

[![Github all releases](https://img.shields.io/github/downloads/bmwcd/bmwcd.js/total.svg)](https://github.com/bmwcd/bmwcd.js/releases/) [![GitHub release](https://img.shields.io/github/release/bmwcd/bmwcd.js.svg)](https://github.com/bmwcd/bmwcd.js/releases/) [![Only 32 Kb](https://badge-size.herokuapp.com/bmwcd/bmwcd.js/main/lib/bmwcd.js)](https://github.com/bmwcd/bmwcd.js) [![Coverage Status](https://coveralls.io/repos/github/bmwcd/bmwcd.js/badge.svg?branch=main)](https://coveralls.io/github/bmwcd/bmwcd.js?branch=main) [![GitHub license](https://img.shields.io/github/license/bmwcd/bmwcd.js.svg)](https://github.com/bmwcd/bmwcd.js/blob/main/LICENSE.md)

## Basic Usage

### Installation

```shell
npm install bmwcd.js
```

### CommonJS

```javascript
const bmwcd = require('bmwcd.js')

const main = async () => {
  // ConnectedDrive account authentication
  const account = await bmwcd.auth(username, password)

  // Select vehicle by VIN, log status
  const vehicle = await account.vehicles('WBAXXXXXXX1234567')
  console.log(await vehicle.status())

  // honk if you like node
  await vehicle.honk()
}
main()
```

### ES6 Import

```javascript
import bmwcd from 'bmwcd.js'
const { auth, status, services } = bmwcd

// ConnectedDrive username or email, password
const account = bmwcd.auth(username, password)

// Fetch all vehicles
const vehicles = account.vehicles()
console.log(vehicles)
```

## Remote Services

As of 0.1.1, these Remote Services aren't fully functional. Check back soon!

```javascript
const services = async () => {
  // Lock / Unlock Doors
  await vehicle.lock()
  await vehicle.unlock()

  // Remote Air Conditioning / Ventilation
  await vehicle.climate()

  // Flash Headlights
  await vehicle.lights()

  // Honk Horn
  await vehicle.honk()

  // Vehicle Finder
  await vehicle.finder()
}
services()
```

## Remote Service Status

Responds with real-time status of a recent Remote Service request. Useful to monitor for successful execution of a service like `DOOR_LOCK`.

## Documentation

Coming soon!

## Acknowledgements

* [connected_drive.js](https://github.com/1source-ac/connected_drive.js)
* [bimmerconnected](https://github.com/bimmerconnected/bimmer_connected) (python)
