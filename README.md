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

// ConnectedDrive account authentication
const account = await bmwcd.auth(username, password)

// Select vehicle by VIN; log status; honk if you code
const vehicle = await account.vehicles('WBAXXXXXXX1234567')
console.log(await vehicle.status())
await vehicle.honk()
```

### ES6 Import

```javascript
import bmwcd from "bmwcd.js"
const { auth, status, services } = bmwcd

// ConnectedDrive username or email, password
const account = await bmwcd.auth(username, password)

// Fetch all vehicles
const vehicles = await account.vehicles()
console.log(vehicles)

// Ordinary method: Select the first vehicle (index 0)
const vehicle = await account.vehicles(0)
console.log(await vehicle.status())

// Log the last known vehicle location
console.log(await vehicle.location())
```

## Vehicle Status

```javascript
const status = await vehicle.status()
```

## Remote Services

These Remote Servics are currently functioning and usable through the **bmwcd.js** module.

```javascript
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
```

## Remote Service Status

Responds with real-time status of a recent Remote Service request. Useful to monitor for successful execution of a service like `DOOR_LOCK`.

## Documentation

Coming soon :)

## Acknowledgements

Inspired heavily by the following repositories 
* [connected_drive.js](https://github.com/1source-ac/connected_drive.js) 
* [bimmerconnected](https://github.com/bimmerconnected/bimmer_connected) (python)

