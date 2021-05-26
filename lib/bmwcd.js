#!/usr/bin/env node
/*
888                                              888     ,e,
888 88e  888 888 8e  Y8b Y8b Y888P  e88'888  e88 888      "   dP"Y
888 888b 888 888 88b  Y8b Y8b Y8P  d888  '8 d888 888     888 C88b
888 888P 888 888 888   Y8b Y8b "   Y888   , Y888 888 d8b 888  Y88D
888 88"  888 888 888    YP  Y8P     "88,e8'  "88 888 Y8P 888 d,dP
-------------------------------------------------------- 88P -----
In loving memory of James Contino 1989-2020              8"

Developed by Nicholas Berlette <https://github.com/bmwcd/bmwcd.js>
*/
require('dotenv').config()
const request = require('axios')
const qs = require('qs')
const util = require('util')
const to = require('await-to-js').default
const moment = require('moment')

const { Toker } = require('./toker')
const toker = new Toker()
let { token } = toker

const BMW_TIME_OFFSET = Number(process.env.BMW_TIME_OFFSET) * (-1 * 60)
const BMW_REGION = ['north_america', 'rest_of_world', 'china'].includes(process.env.BMW_REGION) ? process.env.BMW_REGION : 'north_america'

const BMW_URLS = new function (regionName) {
  this.regions = {
    north_america: {
      base: 'b2vapi.bmwgroup.us',
      host: 'b2vapi.bmwgroup.us',
      data: 'Basic ZDc2NmI1MzctYTY1NC00Y2JkLWEzZGMtMGNhNTY3MmQ3ZjhkOjE1ZjY5N2Y2LWE1ZDUtNGNhZC05OWQ5LTNhMTViYzdmMzk3Mw=='
    },
    rest_of_world: {
      base: 'b2vapi.bmwgroup.com',
      host: 'customer.bmwgroup.com',
      data: 'Basic ZDc2NmI1MzctYTY1NC00Y2JkLWEzZGMtMGNhNTY3MmQ3ZjhkOjE1ZjY5N2Y2LWE1ZDUtNGNhZC05OWQ5LTNhMTViYzdmMzk3Mw=='
    },
    china: {
      base: 'b2vapi.bmwgroup.cn:8592',
      host: 'customer.bmwgroup.cn',
      data: 'Basic blF2NkNxdHhKdVhXUDc0eGYzQ0p3VUVQOjF6REh4NnVuNGNEanliTEVOTjNreWZ1bVgya0VZaWdXUGNRcGR2RFJwSUJrN3JPSg=='
    }
  }
  this.region = this.regions[regionName]
  this.redirect = 'https://www.bmw-connecteddrive.com/app/static/external-dispatch.html'
  this.auth = `https://${this.region.host}/gcdm/oauth/authenticate`
  this.API = `https://${this.region.base}/webapi/v1`
  this.API2 = `https://${this.region.base}/api`
  this.vehicles = `${this.API2}/me/vehicles/v2`
  this.vehicles2 = `${this.API}/user/vehicles`
  this.VIN = this.vehicles + '/%s'
  this.VIN2 = this.vehicles2 + '/%s'
  this.service = this.VIN + '/executeService'
  this.serviceStatus = this.VIN + '/serviceExecutionStatus?serviceType=%s'
  this.image = this.VIN + '/image?width=%s&height=%s&view=%s'
  this.poi = this.VIN + '/sendpoi'
  this.statistics = this.VIN + '/statistics'
  this.lastTrip = this.statistics + '/lastTrip'
  this.allTrips = this.statistics + '/allTrips'
  this.chargingProfile = this.VIN + '/chargingprofile'
  this.destinations = this.VIN + '/destinations'
  this.rangeMap = this.VIN + '/rangemap'
  this.status = this.API2 + '/vehicle/dynamic/v1/%s?offset=' + BMW_TIME_OFFSET
  this.efficiency = this.API2 + '/vehicle/efficiency/v1/%s'
  this.navigation = this.API2 + '/vehicle/navigation/v1/%s'
}(BMW_REGION)

const BMW_ERROR_CODES = {
  401: 'UNAUTHORIZED',
  404: 'NOT_FOUND',
  405: 'MOBILE_ACCESS_DISABLED',
  408: 'VEHICLE_UNAVAILABLE',
  423: 'ACCOUNT_LOCKED',
  429: 'TOO_MANY_REQUESTS',
  500: 'SERVER_ERROR',
  503: 'SERVICE_MAINTENANCE'
}

const BMW_SERVICES = {
  LIGHTS: 'LIGHT_FLASH',
  LOCK: 'DOOR_LOCK',
  UNLOCK: 'DOOR_UNLOCK',
  HORN: 'BLOW_HORN',
  CLIMATE: 'CLIMATE_NOW',
  FINDER: 'VEHICLE_FINDER',
  STATUS: 'STATUS',
  EFFICIENCY: 'EFFICIENCY',
  NAVIGATION: 'NAVIGATION'
}

const BMW_DEBUG = !!process.env.BMW_DEBUG
async function _log (...args) { if (BMW_DEBUG) console.log(...args) }
async function _error (error) { if (BMW_DEBUG) console.error(JSON.stringify(error, null, 2)) }
// async function _error (...args) { if (BMW_DEBUG) console.error(...args) }

module.exports = {
  BMW_URLS,
  BMW_SERVICES,
  BMW_ERROR_CODES,
  BMW_TIME_OFFSET,

  async parseVehicle (data = {}) {
    if (data.vin === undefined) return _error('Invalid vehicle')

    const parsedVehicle = {
      id: data.vin.substr(-7, 7),
      vin: data.vin,
      series: data.series,
      year: Number(data.modelYearNA),
      brand: data.brand,
      model: data.modelName,
      basicType: data.basicType,
      bodyType: data.bodyType,
      color: 'Mineral White Metallic', // Mineral White Metallic
      colorCode: 'A96', // A96
      options: {
        steering: data.steering,
        driveTrain: data.driveTrain,
        sunroof: Boolean(data.hasSunRoof),
        navigation: Boolean(data.hasNavi),
        rangeExtender: Boolean(data.hasRex),
        electric: Boolean(data.dcOnly)
      }
    }
    return parsedVehicle
  }, // .parseVehicle()

  async parseLocation (status = {}) {
    if (status.attributesMap === undefined) return _error('Invalid status object')
    const parsedLocation = {
      latitude: Number(status.attributesMap.gps_lat),
      longitude: Number(status.attributesMap.gps_lng),
      heading: Number(status.attributesMap.heading),
      tracking: Boolean(status.attributesMap.vehicle_tracking)
    }
    return parsedLocation
  }, // .parseLocation()

  async parseStatus (vin, status = {}) {
    if (status.attributesMap === undefined) return _error('Invalid status object')
    if (String(vin).length !== 17) return _error('Invalid vehicle identifier')
    const updateTime = moment(status.attributesMap.updateTime_converted, 'MM/DD/YYYY HH:MM A', false)
    const parsedStatus = {
      id: String(vin).substr(-7, 7),
      info: {
        vin: String(vin),
        mileage: Number(status.attributesMap.mileage),
        updateReason: status.attributesMap.lastUpdateReason,
        lscTrigger: status.attributesMap.lsc_trigger,
        parkingLights: status.attributesMap.lights_parking,
        doorLockState: status.attributesMap.door_lock_state,
        time: {
          local: updateTime.toISOString(true),
          unix: updateTime.unix(),
          utc: updateTime.toISOString()
        },
        units: {
          length: status.attributesMap.unitOfLength,
          fuel: status.attributesMap.unitOfCombustionConsumption,
          energy: status.attributesMap.unitOfEnergy
        }
      },
      location: { ...await this.parseLocation(status) },
      economy: {
        rangeKm: Number(status.attributesMap.beRemainingRangeFuelKm),
        rangeMiles: Number(status.attributesMap.beRemainingRangeFuelMile),
        fuelLiters: Number(status.attributesMap.remaining_fuel),
        fuelGallons: parseFloat(Number(status.attributesMap.remaining_fuel) * 0.2641729)
      },
      lids: {
        locks: status.attributesMap.door_lock_state,
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
  }, // .parseStatus()

  async parseMessages (status = {}) {
    if (status.vehicleMessages === undefined) return _error('Invalid status object')

    const parsedMessages = {
      checkControlMessages: [
        ...status.vehicleMessages.ccmMessages.map(ccm => {
          return {
            ...ccm
          }
        })
      ],
      cbsData: [
        ...status.vehicleMessages.cbsMessages.map(cbs => {
          const cbsMessage = {
            cbsType: String(cbs.text).toUpperCase().replace(' ', '_'),
            cbsState: String(cbs.status),
            cbsDueDate: moment(cbs.date, false),
            cbsRemainingMileage: Number(cbs.unitOfLengthRemaining),
            cbsDescription: String(cbs.description)
          }
          if (cbsMessage.cbsRemainingMileage === null) delete cbsMessage.cbsRemainingMileage
          return cbsMessage
        })
      ]
    }
    return parsedMessages
  }, // .parseMessages()

  async parse (data = {}, status = {}) {
    return {
      vehicle: { ...await this.parseVehicle(data) },
      status: { ...await this.parseStatus(data.vin, status) },
      messages: { ...await this.parseMessages(status) }
    }
  }, // .parse()

  async auth (username, password) {
    let vehicles = []
    let error, result
    const values = {
      client_id: 'dbf0a542-ebd1-4ff0-a9a7-55172fbfce35',
      redirect_uri: BMW_URLS.redirect,
      response_type: 'token',
      scope: 'authenticate_user vehicle_data remote_services',
      username,
      password
    }
    // read token data from JSON file with Toker
    // file doesn't exist? create and write default data
    token = toker.read()
    // toker.check() token structure and expiration time
    if (toker.check(token)) {
      const tokenLeft = moment(token[0]).diff(moment(), 'minutes')
      _log('Session still valid. Authenticated.')
      _log(` >> Token expires in ${(tokenLeft >= 60 ? '1 hour ' : ' ')}${(tokenLeft % 60)} min`)
    } else {
      _log('Requesting new token...')
      try {
        result = await request.post(BMW_URLS.auth, qs.stringify(values), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': '124',
            Host: BMW_URLS.region.base,
            'Accept-Encoding': 'gzip'
          }
        })
        _log('Authenticated with new token.')
        _log(' >> ', result.request.res.responseUrl)
        const tokenData = qs.parse(result.request.res.responseUrl.split('#')[1])
        // format token data with toker
        token = toker.format(tokenData)
      } catch (err) {
        token = toker.default
        throw _error(err)
      }
    }
    // save token to toker and write json file
    toker.set(token)
    toker.write()
    const headers = {
      authorization: `Bearer ${token[1]}`
    }
    const _bmwcd = this
    return {

      async vehicles () {
        _log('Requesting vehicles...')
        try {
          result = await request.get(BMW_URLS.vehicles, { headers: headers })
        } catch (err) {
          throw _error(err)
        }
        return result.data
      }, // .vehicles()

      async findVehicle (vehicleVin) {
        if (vehicleVin === undefined || vehicleVin.length !== 17) return _error('Invalid vehicle identifier')
        vehicles = await this.vehicles()
        const vehicle = vehicles.find(vehicle => vehicle.vin === vehicleVin)

        return {
          id: String(vehicleVin).substr(-7, 7),
          vin: vehicleVin,

          async status (parseData = true) {
            if (vehicle === undefined) return _error('Invalid vehicle')
            _log(` >> ${vehicle.vin} status...`);

            [error, result] = await to(
              request.get(util.format(BMW_URLS.status, vehicle.vin), { headers: headers })
            )
            if (error) throw _error(error)
            else return parseData === true ? _bmwcd.parse(vehicle, result.data) : result.data
          }, // status()

          async location () {
            return _bmwcd.parseLocation(await this.status(false))
          }, // location()

          async remoteService (serviceType = BMW_SERVICES.DOOR_LOCK) {
            if (vehicle === undefined) return _error('Invalid vehicle')
            _log(` >> BMW_SERVICES.${serviceType} : ${vehicle.vin}...`);
            [error, result] = await to(
              request.post(
                util.format(BMW_URLS.service, vehicle.vin),
                qs.stringify({ serviceType: BMW_SERVICES[serviceType] }),
                { headers: headers }
              )
            )
            if (error) throw _error(error)
            else _log(result.data)
            return result.data
          }, // remoteService()

          async lights () {
            return await this.remoteService(BMW_SERVICES.LIGHTS)
          }, // flashLights()

          async horn () {
            return await this.remoteService(BMW_SERVICES.HORN)
          }, // horn()

          async climate () {
            return await this.remoteService(BMW_SERVICES.CLIMATE)
          }, // climate()

          async lock () {
            return await this.remoteService(BMW_SERVICES.LOCK)
          }, // lock()

          async unlock () {
            return await this.remoteService(BMW_SERVICES.UNLOCK)
          }, // unlock()

          async finder () {
            return await this.remoteService(BMW_SERVICES.FINDER)
          }, // finder()

          async remoteServiceStatus (serviceType = BMW_SERVICES.DOOR_LOCK) {
            if (vehicle === undefined) return _error('Invalid vehicle')
            _log(` >> ${serviceType} service status from ${vehicle.vin}...`);
            [error, result] = await to(
              request.get(
                util.format(BMW_URLS.serviceStatus, vehicle.vin, BMW_SERVICES[serviceType]),
                { headers: headers }
              )
            )
            if (error) throw _error(error)
            else _log(result.data)
            return result.data
          }, // remoteServiceStatus()

          async lockStatus () {
            return await this.remoteServiceStatus(BMW_SERVICES.LOCK)
          } // lockStatus()

        }
      } // .findVehicle()
    }
  } // .auth()
}
