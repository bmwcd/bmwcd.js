import dayjs from 'dayjs'
import util from 'util'

import {
  IMPERIAL_UNITS,
  MAPS_URL
} from './const.js'

import {
  convert,
  _error
} from './utils.js'

const CBSMESSAGE_DATE_FORMAT = 'M/YYYY'

function parseValue (value, type = 'options') {
  const keys = {
    OFF: false,
    ON: true,
    NOT_SUPPORTED: false,
    NOT_AVAILABLE: false,
    ACTIVATED: true,
    CONV: 'Conventional',
    LEFT: 'LHD',
    RIGHT: 'RHD',
    VEHCSHUTDOWN: 'Vehicle Shutdown',
    VEHCSHUTDOWN_SECURED: 'Shutdown Secured',
    VEHICLE_MOVING: 'Vehicle Moving',
    DOORSTATECHANGED: 'Doors Opened / Closed',
    LOCKSTATECHANGED: 'Doors Locked / Unlocked'
  }
  return keys[value] || value
}

function parseHttpCode (code, expectedCode = 200) {
  let ret = 'OK'
  switch (code) {
    case 401: ret = 'UNAUTHORIZED'; break
    case 403: ret = 'FORBIDDEN'; break
    case 404: ret = 'NOT_FOUND'; break
    case 405: ret = 'MOBILE_ACCESS_DISABLED'; break
    case 408: ret = 'VEHICLE_UNAVAILABLE'; break
    case 423: ret = 'ACCOUNT_LOCKED'; break
    case 424: ret = 'FAILED_DEPENDENCY'; break
    case 429: ret = 'TOO_MANY_REQUESTS'; break
    case 500: ret = 'SERVER_ERROR'; break
    case 503: ret = 'SERVICE_MAINTENANCE'; break
    default: if (code > 299) ret = 'UNKNOWN_ERROR'; break
  }
  return [code, ret]
}

async function parseAll (data = {}, status = {}, minimalData = false) {
  if (!minimalData) {
    return {
      vehicle: {
        ...await parseVehicle(data)
      },
      status: {
        ...await parseStatus(data.vin, status, minimalData)
      },
      messages: {
        ...await parseMessages(status)
      }
    }
  } else {
    return {
      ...await parseStatus(data.vin, status, minimalData)
    }
  }
}

async function checkControlMessages (status) {
  return status.vehicleMessages.ccmMessages.map(msg => {
    return {
      id: parseInt(msg.ccmId),
      mileage: parseInt(msg.ccmMileage),
      summary: msg.ccmDescriptionShort,
      details: msg.ccmDescriptionLong
    }
  })
}

async function conditionBasedServices (status) {
  return status.vehicleMessages.cbsMessages.map(msg => {
    const cbsMessage = {
      type: msg.text.toUpperCase().replace(' ', '_'),
      description: msg.description,
      dueDate: dayjs(msg.date).format(CBSMESSAGE_DATE_FORMAT)
    }
    if ([null, undefined].includes(msg.unitOfLengthRemaining) === false) {
      let mileage = status.attributesMap.mileage // miles
      let distanceLeft = msg.unitOfLengthRemaining // km
      if (['mls', 'miles'].includes(status.attributesMap.unitOfLength)) distanceLeft = convert.toMiles(distanceLeft, 0)
      else mileage = convert.toKilom(mileage, 0)
      cbsMessage.remaining = convert.roundMileage(distanceLeft)
      cbsMessage.scheduled = convert.roundMileage(distanceLeft) + convert.roundMileage(mileage)
    }
    return cbsMessage
  })
}

async function parseMessages (status = {}) {
  if (status.vehicleMessages === undefined) return _error('Invalid status object')

  const parsedMessages = {
    checkControlMessages: [
      ...await checkControlMessages(status)
    ],
    conditionBasedServices: [
      ...await conditionBasedServices(status)
    ]
  }
  return parsedMessages
}

async function parseLocation (status = {}, minimalData = false) {
  if (status.attributesMap === undefined) return _error('Invalid status object')
  let parsedLocation = {
    latitude: parseFloat(status.attributesMap.gps_lat),
    longitude: parseFloat(status.attributesMap.gps_lng),
    heading: parseInt(status.attributesMap.heading)
  }
  if (!minimalData) {
    parsedLocation = {
      ...parsedLocation,
      mapsUrl: util.format(MAPS_URL, status.attributesMap.gps_lat, status.attributesMap.gps_lng)
    }
  }
  return parsedLocation
}

function parseFuelPercent (fuelLiters) {
  return convert.roundTo((fuelLiters / 62) * 100, 1)
}

async function parseStatus (vin, status = {}, minimalData = false, standalone = false) {
  if (status.attributesMap === undefined) return _error('Invalid status object')
  if (vin.length !== 17) return _error('Invalid vehicle identifier')
  let imperialUnits = IMPERIAL_UNITS
  if (imperialUnits === undefined || imperialUnits === null) imperialUnits = (status.attributesMap.unitOfLength === 'mls')
  // const updateTime = dayjs(status.attributesMap.updateTime_converted, 'MM/DD/YYYY hh:mm A', false)
  const updateTime = dayjs(status.attributesMap.updateTime_converted_timestamp, 'x', false)
  let parsedStatus = {}
  if (standalone) parsedStatus = { id: parseVin(vin), vin: vin }
  parsedStatus = {
    ...parsedStatus,
    updateReason: parseValue(status.attributesMap.lsc_trigger),
    doorLockState: status.attributesMap.door_lock_state,
    lscTrigger: status.attributesMap.lsc_trigger,
    timeLoc: updateTime.toISOString(),
    timeUTC: updateTime.toISOString(),
    timeStr: updateTime.format('dddd [at] h:mm a'),
    mileage: parseInt(status.attributesMap.mileage),
    parkingLights: status.attributesMap.lights_parking,
    vehicleTracker: status.attributesMap.vehicle_tracking,
    remainingFuelPct: parseFuelPercent(status.attributesMap.remaining_fuel)
  }
  if (imperialUnits) {
    parsedStatus.remainingFuel = convert.toGallons(status.attributesMap.remaining_fuel)
    parsedStatus.remainingRange = convert.roundTo(status.attributesMap.beRemainingRangeFuelMile, 1)
  } else {
    parsedStatus.remainingFuel = convert.roundTo(status.attributesMap.remaining_fuel, 1)
    parsedStatus.remainingRange = convert.roundTo(status.attributesMap.beRemainingRangeFuelKm, 1)
  }
  parsedStatus = {
    ...parsedStatus,
    unitsLength: status.attributesMap.unitOfLength,
    unitsFuel: status.attributesMap.unitOfCombustionConsumption,
    unitsEnergy: status.attributesMap.unitOfEnergy,
    location: await parseLocation(status, !!minimalData),
    lids: {
      hood: status.attributesMap.hood_state,
      frontLeftDoor: status.attributesMap.door_driver_front,
      frontRightDoor: status.attributesMap.door_passenger_front,
      rearLeftDoor: status.attributesMap.door_driver_rear,
      rearRightDoor: status.attributesMap.door_passenger_rear,
      trunk: status.attributesMap.trunk_state
    },
    windows: {
      frontLeft: status.attributesMap.window_driver_front,
      frontRight: status.attributesMap.window_passenger_front,
      rearLeft: status.attributesMap.window_driver_rear,
      rearRight: status.attributesMap.window_passenger_rear
    }
  }
  return parsedStatus
}

function parseVin (vin) {
  return vin.substr(-7, 7)
}

async function parseVehicle (data = {}) {
  if (data.vin === undefined) return _error('Invalid vehicle')

  return {
    id: parseVin(data.vin),
    vin: data.vin,
    year: parseInt(data.modelYearNA),
    model: data.modelName,

    options: {
      brand: data.brand,
      series: data.series,
      basicType: data.basicType,
      bodyType: data.bodyType,
      doorCount: data.doorCount,
      steering: parseValue(data.steering),
      drivetrain: parseValue(data.driveTrain),
      sunroof: parseValue(data.hasSunRoof),
      nav: parseValue(data.hasNavi),
      hybrid: parseValue(data.hasRex),
      electric: parseValue(data.dcOnly)
    }
  }
}

export {
  checkControlMessages,
  conditionBasedServices,
  parseAll,
  parseHttpCode,
  parseLocation,
  parseMessages,
  parseStatus,
  parseValue,
  parseVin,
  parseVehicle
}
