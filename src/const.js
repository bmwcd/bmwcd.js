function _k (obj) {
  return obj === null || obj === undefined ? [] : [...Object.keys(obj)]
}
function inObj (key, object) {
  return _k(object).includes(key) ? object[key] : false
}
const env = process.env
const BMW_DEBUG = !!env.BMW_DEBUG
const REGIONS = {
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
const BMW_REGION = inObj(REGIONS, env.BMW_REGION)
  ? env.BMW_REGION
  : _k(REGIONS)[0]
const BMW_TIME_OFFSET = env.BMW_TIME_OFFSET * (-1 * 60)

const BMW_URLS = new function (
  regionName = Object.keys(REGIONS)[0],
  timeOffset = '-7'
) {
  this.region = REGIONS[regionName]
  this.redirect =
    'https://www.bmw-connecteddrive.com/app/static/external-dispatch.html'
  this.referrer = 'https://www.bmw-connecteddrive.com/app/index.html'
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
}(BMW_REGION, BMW_TIME_OFFSET)

const MAPS_URL = 'https://maps.google.com/maps/?q=%s,%s'

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
const IMPERIAL_UNITS = env.IMPERIAL_UNITS

export {
  BMW_DEBUG,
  BMW_URLS,
  MAPS_URL,
  BMW_SERVICES,
  BMW_TIME_OFFSET,
  BMW_REGION,
  REGIONS,
  IMPERIAL_UNITS,
  _k,
  inObj,
  env
}
