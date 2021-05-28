require('dotenv').config()

const BMW_URLS = new function (regionName = 'north_america', timeOffset = '-7') {
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
  this.referrer = 'https://www.bmw-connecteddrive.de/app/index.html'
  this.auth = `https://${this.region.base}/gcdm/oauth/authenticate`
  this.API = `https://${this.region.base}/webapi/v1`
  this.API2 = `https://${this.region.base}/api`
  this.API3 = 'https://www.bmw-connecteddrive.com/api'
  this.vehicles = `${this.API2}/me/vehicles/v2`
  this.vehicles2 = `${this.API}/user/vehicles`
  this.vehicles3 = `${this.API3}/me/vehicles/v2`
  this.VIN = `${this.vehicles}/%s`
  this.VIN2 = `${this.vehicles2}/%s`
  this.VIN3 = `${this.vehicles3}/%s`
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
  this.status = this.API2 + '/vehicle/dynamic/v1/%s?offset=' + timeOffset
  this.efficiency = this.API2 + '/vehicle/efficiency/v1/%s'
  this.navigation = this.API2 + '/vehicle/navigation/v1/%s'
  this.mapsUrl = 'https://maps.google.com/maps/?q=%s,%s'
}(this.BMW_REGION, this.BMW_TIME_OFFSET)
const convert = new function () {
  this.roundTo = (num, precision = 1) => {
    const x = Math.pow(10, precision)
    return Math.round(num * x) / x
  }
  this.toMiles = (kilom, precision = 1) => {
    return this.roundTo((kilom * 0.6213712), precision)
  }
  this.toKilom = (miles, precision = 1) => {
    return this.roundTo((miles * 1.609344), precision)
  }
  this.toGallons = (liters, precision = 1) => {
    return this.roundTo((liters * 0.2641729), precision)
  }
  this.toLiters = (gallons, precision = 1) => {
    return this.roundTo((gallons * 3.7854), precision)
  }
}()
const VALID_REGIONS = ['north_america', 'rest_of_world', 'china']
module.exports = {
  BMW_DEBUG: !!process.env.BMW_DEBUG,
  BMW_REGION: VALID_REGIONS.includes(process.env.BMW_REGION) ? process.env.BMW_REGION : VALID_REGIONS[0],
  BMW_TIME_OFFSET: process.env.BMW_TIME_OFFSET * (-1 * 60),
  BMW_URLS,
  BMW_SERVICES: {
    LIGHTS: 'LIGHT_FLASH',
    LOCK: 'DOOR_LOCK',
    UNLOCK: 'DOOR_UNLOCK',
    HORN: 'BLOW_HORN',
    CLIMATE: 'CLIMATE_NOW',
    FINDER: 'VEHICLE_FINDER',
    STATUS: 'STATUS',
    EFFICIENCY: 'EFFICIENCY',
    NAVIGATION: 'NAVIGATION'
  },
  FREEDOM_UNITS: process.env.IMPERIAL_UNITS,

  _log: async (...args) => {
    if (this.BMW_DEBUG) console.log(...args)
  },
  _error: async (...args) => {
    if (this.BMW_DEBUG) console.error(...args)
  },
  convert
}
