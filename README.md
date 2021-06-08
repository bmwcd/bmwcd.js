# bmwcd.js

## [![npm install bmwcd.js](https://img.shields.io/badge/npm%20install-bmwcd.js-red)](https://www.npmjs.com/package/bmwcd.js) [[!Dependency status for bmwcd.js](https://status.david-dm.org/gh/bmwcd/bmwcd.js.svg)](https://david-dm.org/bmwcd/bmwcd.js) [![MIT license](https://img.shields.io/badge/-MIT%20License-8dddff.svg)](https://lbesson.mit-license.org/)

### yarn (recommended)
```sh
 $ yarn add bmwcd.js
```

### npm install
```sh
 $ npm install bmwcd.js
```

## Basic Usage

### ES6 + dotenv

```javascript
import ConnectedDrive from 'bmwcd.js';
import dotenv from 'dotenv/config';

(async () => {
  const bmwcd = await new ConnectedDrive(process.env.BMW_USERNAME, process.env.BMW_PASSWORD);
  const vehicle = await bmwcd.getVehicle(process.env.BMW_VIN);
  console.log(await vehicle.status());
})();
```

### CommonJS

```javascript
const { ConnectedDrive } = require('bmwcd.js')

(async () => {
  // ConnectedDrive account authentication
  const bmwcd = new ConnectedDrive(username, password)

  // Select vehicle by VIN and output status object
  const vehicle = await bmwcd.findVehicle('WBAXXXXXXX1234567')
  console.log(await vehicle.status())
})()
```

## Acknowledgements

Inspired by [connected_drive.js](https://github.com/1source-ac/connected_drive.js) and [bimmerconnected](https://github.com/bimmerconnected/bimmer_connected) (python).

[![RememberJimmy.com](https://img.shields.io/badge/-RememberJimmy.com-3f3d56)](https://www.rememberjimmy.com)
