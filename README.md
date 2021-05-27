# bmwcd.js

Lightweight module for requesting vehicle status and Remote Services via the BMW ConnectedDrive API.

![npm install bmwcd.js](https://img.shields.io/badge/npm%20install-bmwcd.js-red) [![lightweight](https://img.shields.io/badge/size-13.9KB-blue)](https://github.com/bmwcd/bmwcd.js/releases) [![Coverage Status](https://coveralls.io/repos/github/bmwcd/bmwcd.js/badge.svg?branch=main)](https://coveralls.io/github/bmwcd/bmwcd.js?branch=main) [![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/) [![In memory of James Contino](https://img.shields.io/badge/-RememberJimmy.com-blue)](https://www.rememberjimmy.com)

## Basic Usage

```javascript
const bmwcd = require('bmwcd.js')

(async () => {
  // ConnectedDrive account authentication
  const account = await bmwcd.auth(username, password)

  // Select vehicle by VIN and output status object
  const vehicle = await account.vehicles('WBAXXXXXXX1234567')
  console.log(await vehicle.status())
})()
```

## Remote Services

Currently, not all of these Remote Services are fully functional. I'm working as fast as I can to fix that!

```javascript
const bmwcd = require('bmwcd.js')

(async () => {
  const account = await bmwcd.auth(username, password)
  const vehicle = await account.vehicles('WBAXXXXXXX1234567')
  
  // Lock / Unlock Doors
  await vehicle.lock()
  await vehicle.unlock()

  // Remote Air Conditioning / Ventilation
  await vehicle.climate()

  // Flash Headlights
  await vehicle.lights()

  // Honk Horn
  await vehicle.honk()
})()
```

## Remote Service Status

Responds with real-time status of a recent Remote Service request. Useful to monitor for successful execution of a service like `DOOR_LOCK`.

## Documentation

Coming soon!

## Acknowledgements

* [connected_drive.js](https://github.com/1source-ac/connected_drive.js)
* [bimmerconnected](https://github.com/bimmerconnected/bimmer_connected) (python)
