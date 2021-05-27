
module.exports.Convers = class {
  constructor (imperial = 1) {
    this.imperial = imperial
  }

  roundTo (num, precision = 1) {
    const x = Math.pow(10, precision)
    return Math.round(num * x) / x
  }

  toMiles (kilom, precision = 1) {
    return this.roundTo((kilom * 0.6213712), precision)
  }

  toKilom (miles, precision = 1) {
    return this.roundTo((miles * 1.609344), precision)
  }

  toGallons (liters, precision = 1) {
    return this.roundTo((liters * 0.2641729), precision)
  }

  toLiters (gallons, precision = 1) {
    return this.roundTo((gallons * 3.7854), precision)
  }
}
