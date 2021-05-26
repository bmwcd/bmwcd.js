# bmwcd.js

Lightweight module for requesting vehicle status and Remote Services via the BMW ConnectedDrive API.

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

These Remote Servics are currently functioning and usable through the **bmwcd.js** module.

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
