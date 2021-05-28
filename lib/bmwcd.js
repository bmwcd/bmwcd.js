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
const to = require('await-to-js').default

const {
  BMW_URLS, BMW_SERVICES
} = require('./helpers')

const {
  parseAll, parseLocation, parseStatusCode,
  util, moment
} = require('./parsers')

const BMW_DEBUG = !!process.env.BMW_DEBUG
async function _log (...args) { if (BMW_DEBUG) console.log(...args) }
async function _error (error) { if (BMW_DEBUG) console.error(JSON.stringify(error, null, 2)) }

const { Toker } = require('toker.js')
const token = new Toker()

module.exports = {
  async auth (username, password) {
    let vehicles = []
    let error, result
    const values = {
      client_id: 'dbf0a542-ebd1-4ff0-a9a7-55172fbfce35',
      redirect_uri: 'https://www.bmw-connecteddrive.com/app/static/external-dispatch.html',
      grant_type: 'password',
      response_type: 'token',
      scope: 'authenticate_user vehicle_data remote_services',
      username,
      password
    }
    const oldToken = await token.read()
    if (token.check(oldToken)) {
      _log('Session still valid. Authenticated.')
      _log(` >> Token expires ${moment(oldToken[0]).fromNow()}`)
    } else {
      _log('Requesting new token...')
      try {
        result = await request.post(BMW_URLS.auth, qs.stringify(values), {
          headers: {
            Credentials: 'nQv6CqtxJuXWP74xf3CJwUEP:1zDHx6un4cDjybLENN3kyfumX2kEYigWPcQpdvDRpIBk7rOJ',
            Connection: 'Keep-Alive',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': '124',
            Host: BMW_URLS.region.base,
            'Accept-Encoding': 'gzip'
          }
        })
        // format token data with toker
        const tokenResponse = qs.parse(result.request.res.responseUrl.split('#')[1])
        await token.format(tokenResponse, true)
        _log('Authenticated with new token.')
        _log(' >> ', token.token[1])
      } catch (err) {
        await token.set(token.default)
      }
    }
    // save token to toker and write json file
    await token.write()
    const headers = {
      Accepted: 'application/json',
      Authorization: `Bearer ${token.token[1]}`
    }
    return {

      async vehicles () {
        _log('Requesting vehicles...')
        try {
          result = await request.get(BMW_URLS.vehicles,
            {
              headers: headers,
              validateStatus: function (status) {
                if (status !== 200) _log('Error Code: ', parseStatusCode(status))
                return status < 500
              }
            })
        } catch (err) {
          throw _error(err)
        }
        return result.data || []
      }, // .vehicles()

      async findVehicle (vehicleVin) {
        if (vehicleVin === undefined || vehicleVin.length !== 17) return _error('Invalid vehicle identifier')
        vehicles = await this.vehicles()
        const vehicle = vehicles.find(vehicle => vehicle.vin === vehicleVin)

        return {
          id: vehicleVin.substr(-7, 7),
          vin: vehicleVin,

          async status (parseData = true, minimalData = false) {
            if (vehicle === undefined) return _error('Invalid vehicle')
            _log(` >> ${vehicle.vin} status...`);

            [error, result] = await to(
              request.get(util.format(BMW_URLS.status, vehicle.vin),
                {
                  headers: headers,
                  validateStatus: function (status) {
                    if (status !== 200) _log('Response Status: ', parseStatusCode(status))
                    return status < 500
                  }
                })
            )
            if (error) throw _error(error)
            else return parseData ? parseAll(vehicle, result.data, minimalData) : result.data
          }, // status()

          async location () {
            return parseLocation(await this.status(false))
          }, // location()

          async remoteService (serviceType = BMW_SERVICES.DOOR_LOCK) {
            if (vehicle === undefined) return _error('Invalid vehicle')
            _log(` >> BMW_SERVICES.${serviceType} : ${vehicle.vin}...`);
            [error, result] = await to(
              request.post(
                util.format(BMW_URLS.service, vehicle.vin),
                qs.stringify({ serviceType: BMW_SERVICES[serviceType] }),
                {
                  headers: headers,
                  validateStatus: function (status) {
                    if (status !== 200) _log('Response Status: ', parseStatusCode(status))
                    return status < 500
                  }
                }
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
                {
                  headers: headers,
                  validateStatus: function (status) {
                    if (status !== 200) _log('Response Status: ', parseStatusCode(status))
                    return status < 500
                  }
                }
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
