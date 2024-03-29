import { BMW_DEBUG, _k, inObj } from './const.js'

const convert = new function () {
  this.roundTo = (num, precision = 1) => {
    const x = Math.pow(10, precision)
    return Math.round(num * x) / x
  }
  this.roundMileage = (distance, precision = 100) => {
    return Math.round(distance / precision) * precision
  }
  this.toMiles = (kilom, precision = 1) => {
    return this.roundTo(kilom * 0.6213712, precision)
  }
  this.toKilom = (miles, precision = 1) => {
    return this.roundTo(miles * 1.609344, precision)
  }
  this.toGallons = (liters, precision = 1) => {
    return this.roundTo(liters * 0.2641729, precision)
  }
  this.toLiters = (gallons, precision = 1) => {
    return this.roundTo(gallons * 3.7854, precision)
  }
}()

async function _log (...args) {
  if (BMW_DEBUG) console.log(...args)
}
async function _error (...args) {
  if (BMW_DEBUG) console.error(...args)
}

export { convert, _log, _error, _k, inObj }
