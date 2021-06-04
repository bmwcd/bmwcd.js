# bmwcd.js

## [![npm install bmwcd.js](https://img.shields.io/badge/npm%20install-bmwcd.js-red)](https://www.npmjs.com/package/bmwcd.js) [![MIT license](https://img.shields.io/badge/-MIT%20License-8dddff.svg)](https://lbesson.mit-license.org/)

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

Currently, not all of these Remote Services are 100% functional. I'll have it fixed soon!

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

## Acknowledgements

Inspired by [connected_drive.js](https://github.com/1source-ac/connected_drive.js) and [bimmerconnected](https://github.com/bimmerconnected/bimmer_connected) (python). Shares some similar naming conventions with bimmerconnected for added compatibility.

[![RememberJimmy.com](https://img.shields.io/badge/-RememberJimmy.com-3f3d56)](https://www.rememberjimmy.com)
