const moment = require('moment')
const util = require('util')
const { BMW_URLS, FREEDOM_UNITS, _error, convert } = require('./helpers')

const CBSMESSAGE_DATE_FORMAT = 'M/YYYY'

const parseStates = (value, type = 'options') => {
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

const parseStatusCode = (code, expectedCode = 200) => {
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

const parseAll = async (data = {}, status = {}, minimalData = false) => {
  if (!minimalData) {
    return {
      vehicle: { ...await parseVehicle(data) },
      status: { ...await parseStatus(data.vin, status) },
      messages: { ...await parseMessages(status) }
    }
  } else return { ...await parseStatus(data.vin, status) }
}

const checkControlMessages = async (status) => {
  return status.vehicleMessages.ccmMessages.map(msg => {
    return {
      id: parseInt(msg.ccmId),
      mileage: parseInt(msg.ccmMileage),
      summary: msg.ccmDescriptionShort,
      details: msg.ccmDescriptionLong
    }
  })
}

const conditionBasedServices = async (status) => {
  return status.vehicleMessages.cbsMessages.map(msg => {
    const cbsMessage = {
      type: msg.text.toUpperCase().replace(' ', '_'),
      description: msg.description,
      dueDate: moment(msg.date).format(CBSMESSAGE_DATE_FORMAT)
    }
    if ([null, undefined].includes(msg.unitOfLengthRemaining) === false) {
      let mileage = status.attributesMap.mileage // miles
      let distanceLeft = msg.unitOfLengthRemaining // km
      if (['mls', 'miles'].includes(status.attributesMap.unitOfLength)) distanceLeft = convert.toMiles(distanceLeft, 0) // km -> miles
      else mileage = convert.toKilom(mileage, 0) // miles -> km
      cbsMessage.remaining = Math.round(distanceLeft / 100) * 100
      cbsMessage.scheduled = Math.round((distanceLeft + Math.round(mileage)) / 100) * 100
    }
    return cbsMessage
  })
}

const parseMessages = async (status = {}) => {
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

const parseLocation = async (status = {}, minimalData = false) => {
  if (status.attributesMap === undefined) return _error('Invalid status object')
  if (minimalData) {
    return [parseInt(status.attributesMap.gps_lat), parseFloat(status.attributesMap.gps_lng), parseFloat(status.attributesMap.heading)]
  } else {
    return {
      latitude: parseFloat(status.attributesMap.gps_lat),
      longitude: parseFloat(status.attributesMap.gps_lng),
      heading: parseInt(status.attributesMap.heading),
      mapsUrl: util.format(BMW_URLS.mapsUrl, status.attributesMap.gps_lat, status.attributesMap.gps_lng)
    }
  }
}

const parseStatus = async (vin, status = {}, minimalData = false, standalone = false) => {
  if (status.attributesMap === undefined) return _error('Invalid status object')
  if (vin.length !== 17) return _error('Invalid vehicle identifier')
  let freedomUnits = FREEDOM_UNITS
  if (freedomUnits === undefined || freedomUnits === null) freedomUnits = (status.attributesMap.unitOfLength === 'mls')
  // const updateTime = moment(status.attributesMap.updateTime_converted, 'MM/DD/YYYY hh:mm A', false)
  const updateTime = moment(status.attributesMap.updateTime_converted_timestamp, 'x', false)
  let parsedStatus = {}
  if (standalone) parsedStatus = { id: vin.substr(-7, 7), vin: vin, ...parsedStatus }
  parsedStatus = {
    updateReason: parseStates(status.attributesMap.lsc_trigger),
    doorLockState: status.attributesMap.door_lock_state,
    lscTrigger: status.attributesMap.lsc_trigger,
    timeLoc: updateTime.toISOString(true),
    timeUTC: updateTime.toISOString(),
    timeStr: updateTime.format('dddd [at] h:mm a'),
    mileage: parseInt(status.attributesMap.mileage),
    parkingLights: status.attributesMap.lights_parking,
    vehicleTracker: status.attributesMap.vehicle_tracking,
    fuelPercent: convert.roundTo((status.attributesMap.remaining_fuel / 62) * 100, 1)
  }
  if (freedomUnits) {
    parsedStatus.remainingFuel = convert.toGallons(status.attributesMap.remaining_fuel)
    parsedStatus.remainingRange = convert.roundTo(status.attributesMap.beRemainingRangeFuelMile, 1)
  } else {
    parsedStatus.remainingFuel = convert.roundTo(status.attributesMap.remaining_fuel, 1)
    parsedStatus.remainingRange = convert.roundTo(status.attributesMap.beRemainingRangeFuelKm, 1)
  }
  if (!minimalData) {
    parsedStatus = {
      ...parsedStatus
    }
  }
  parsedStatus = {
    ...parsedStatus,
    unitsLength: status.attributesMap.unitOfLength,
    unitsFuel: status.attributesMap.unitOfCombustionConsumption,
    unitsEnergy: status.attributesMap.unitOfEnergy,
    location: await parseLocation(status, false),
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

const parseVehicle = async (data = {}) => {
  if (data.vin === undefined) return _error('Invalid vehicle')

  const parsedVehicle = {
    id: data.vin.substr(-7, 7),
    vin: data.vin,
    year: parseInt(data.modelYearNA),
    model: data.modelName,

    options: {
      brand: data.brand,
      series: data.series,
      basicType: data.basicType,
      bodyType: data.bodyType,
      doorCount: data.doorCount,
      steering: parseStates(data.steering),
      drivetrain: parseStates(data.driveTrain),
      sunroof: parseStates(data.hasSunRoof),
      nav: parseStates(data.hasNavi),
      hybrid: parseStates(data.hasRex),
      electric: parseStates(data.dcOnly),
      socMax: data.socMax
    }
  }
  return parsedVehicle
}

module.exports = {
  parseAll,
  parseStates,
  parseLocation,
  checkControlMessages,
  conditionBasedServices,
  parseMessages,
  parseStatusCode,
  parseStatus,
  parseVehicle,
  moment,
  util
}
