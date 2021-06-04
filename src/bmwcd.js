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

import { to } from 'await-to-js'
import axios from 'axios'
import qs from 'qs'
import util from 'util'
import moment from 'moment'

import {
  BMW_URLS,
  BMW_SERVICES
} from './const.js'

import { _log, _error } from './utils.js'

import {
  parseAll,
  parseLocation,
  parseHttpCode,
  parseVin,
  parseVehicle
} from './parse.js'

import { Toker } from 'toker.js'
const token = new Toker()

let vehicle, vehicles

export default class BmwCD {
  constructor (username, password) {
    this.username = username
    this.password = password
    return this.auth()
  }

  async auth (username = this.username, password = this.password) {
    let error, result

    const values = {
      client_id: 'dbf0a542-ebd1-4ff0-a9a7-55172fbfce35',
      redirect_uri:
        'https://www.bmw-connecteddrive.com/app/static/external-dispatch.html',
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
        result = await axios.post(BMW_URLS.auth, qs.stringify(values), {
          headers: {
            Credentials:
              'nQv6CqtxJuXWP74xf3CJwUEP:1zDHx6un4cDjybLENN3kyfumX2kEYigWPcQpdvDRpIBk7rOJ',
            Connection: 'Keep-Alive',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': '124',
            Host: BMW_URLS.region.base,
            'Accept-Encoding': 'gzip'
          }
        })
        // format token data with toker
        const tokenResponse = qs.parse(
          result.request.res.responseUrl.split('#')[1]
        )
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
      async getVehicles () {
        _log('Requesting vehicles...')
        try {
          result = await axios.get(BMW_URLS.vehicles, {
            headers: headers,
            validateStatus: function (status) {
              if (status !== 200) { _error('Response Code ', parseHttpCode(status)) }
              return status < 500
            }
          })
        } catch (err) {
          throw _error(err)
        }
        return result.data
      }, // .vehicles()

      async findVehicle (vehicleVin) {
        if (vehicleVin === undefined || vehicleVin.length !== 17) { return _error('Invalid vehicle identifier') }
        vehicles = await this.getVehicles()
        vehicle = await parseVehicle(vehicles.find((v) => v.vin === vehicleVin))
        return {
          id: parseVin(vehicle.vin),
          vin: vehicle.vin,

          async status (parseData = true, minimalData = false) {
            if (vehicle === undefined) return _error('Invalid vehicle')
            _log(` >> ${vehicle.vin} status...`)
            result = await axios.get(util.format(BMW_URLS.status, vehicleVin), {
              headers: headers,
              validateStatus: function (status) {
                if (status !== 200) { _error('Response Code ', parseHttpCode(status)) }
                return status < 500
              }
            })
            return !parseData
              ? result.data
              : await parseAll(vehicle, result.data, minimalData)
          }, // status()

          async location () {
            return parseLocation(await this.status(false))
          }, // location()

          async getImages () {
            if (this.vehicle === undefined) return _error('Invalid vehicle')
            _log(' >> ')
          }, // getImages()

          async remoteService (serviceType = BMW_SERVICES.DOOR_LOCK) {
            if (this.vehicle === undefined) return _error('Invalid vehicle')
            _log(` >> BMW_SERVICES.${serviceType} : ${this.vehicle.vin}...`)
            ;[error, result] = await to(
              axios.post(
                util.format(BMW_URLS.service, this.vehicle.vin),
                qs.stringify({ serviceType: BMW_SERVICES[serviceType] }),
                {
                  headers: headers,
                  validateStatus: function (status) {
                    if (status !== 200) { _error('Response Code ', parseHttpCode(status)) }
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

          async remoteServiceStatus (serviceType = BMW_SERVICES.LOCK) {
            if (this.vehicle === undefined) return _error('Invalid vehicle')
            _log(
              ` >> ${serviceType} service status from ${this.vehicle.vin}...`
            )
            ;[error, result] = await to(
              axios.get(
                util.format(
                  BMW_URLS.serviceStatus,
                  this.vehicle.vin,
                  BMW_SERVICES[serviceType]
                ),
                {
                  headers: headers,
                  validateStatus: function (status) {
                    if (status !== 200) { _error('Response Code ', parseHttpCode(status)) }
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
          }, // lockStatus()

          async unlockStatus () {
            return await this.remoteServiceStatus(BMW_SERVICES.UNLOCK)
          }, // unlockStatus()

          async climateStatus () {
            return await this.remoteServiceStatus(BMW_SERVICES.CLIMATE)
          }, // climateStatus()

          async finderStatus () {
            return await this.remoteServiceStatus(BMW_SERVICES.FINDER)
          }
        }
      } // .findVehicle()
    }
  } // .auth()
}
