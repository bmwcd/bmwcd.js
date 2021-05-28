# bmwcd.js

## ![npm install bmwcd.js](https://img.shields.io/badge/npm%20install-bmwcd.js-red) [![MIT license](https://img.shields.io/badge/-MIT%20License-8dddff.svg)](https://lbesson.mit-license.org/)

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

## Acknowledgements

I was mainly inspired by [connected_drive.js](https://github.com/1source-ac/connected_drive.js), expanding it with many features similar to those in [bimmerconnected](https://github.com/bimmerconnected/bimmer_connected) (python). I also tried to follow similar naming conventions as bimmerconnected, for added compatibility. It's a lot heavier now, but it's getting close to being a completed prototype.

[![RememberJimmy.com](https://img.shields.io/badge/-RememberJimmy.com-3f3d56)](https://www.rememberjimmy.com)
