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
import dayjs from 'dayjs'
import { BMW_DEBUG, BMW_URLS, BMW_SERVICES } from './const.js'
import { _log, _debug, _error } from './utils.js'
import { parseAll, parseLocation, parseHttpCode, parseVin, parseVehicle } from './parse.js'
import { Toker } from 'toker.js'
const token = new Toker()

var vehicle, vehicles, _vehicle
var _vehicles = {}

export default class ConnectedDrive {
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
      _debug(`[auth] token expires in ${dayjs(oldToken.expiration).fromNow()}`)
    } else {
      _debug('[auth] requesting new token')
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
        let tokenData = await token.format(tokenResponse, true)
        _debug('[auth] authenticated with new token ', tokenData)
      } catch (err) {
        _debug('[auth] ', err)
        await token.set(token.default)
      }
    }
    // save token to toker and write json file
    let tokenData = await token.write()
    const headers = {
      Accepted: 'application/json',
      Authorization: `Bearer ${tokenData}`
    }

    return {
      add_vehicle (v) {
        _vehicles[v.vin] = v
        return _vehicles[v.vin]
      },

      async getVehicles () {
        _debug('[getVehicles] requesting vehicle list from BMW')
        if (vehicles.length > 0) return [...vehicles]

        try {
          result = await axios.get(BMW_URLS.vehicles, {
            headers: headers,
            validateStatus: function (status) {
              if (status !== 200) { _error(`[getVehicles] response code `, parseHttpCode(status)) }
              return status < 500
            }
          })
        } catch (err) {
          throw _error(`[getVehicles] ${err}`)
        }
        _debug(`[getVehicles] [raw] ${result.data}`)
        vehicles = result.data.map((v, i) => this.add_vehicle(parseVehicle(v)))
        return vehicles
      }, // .vehicles()

      async findVehicle (vehicleVin) {
        if (vehicleVin === undefined || vehicleVin.length !== 17) { return _error('[findVehicle] invalid vin') }
        vehicles = await this.getVehicles()
        vehicle = vehicles[vehicleVin]
        _vehicle = _vehicles[vehicleVin]
        
        return {
          id: parseVin(vehicle.vin),
          vin: vehicle.vin,

          async status (parseData = true, minimalData = false, _vehicle = vehicle) {
            if (vehicle === undefined && _vehicle === undefined) return _error('[vehicle.status] invalid vehicle')
            else if (vehicle === undefined) vehicle = _vehicle
            _debug(`[vehicle.status] ${vehicle.vin}`)
            result = await axios.get(util.format(BMW_URLS.status, vehicleVin), {
              headers: headers,
              validateStatus: function (status) {
                if (status !== 200) { _error(`[vehicle.status] [${vehicleVin}] response code `, parseHttpCode(status)) }
                return status < 500
              }
            })
            return !parseData
              ? result.data
              : await parseAll(vehicle, result.data, minimalData)
          }, // status()

          async location (_vehicle = vehicle) {
            if (vehicle === undefined && _vehicle === undefined && _vehicle === undefined && _vehicle === undefined) return _error('[vehicle.location] invalid vehicle')
            else if (vehicle === undefined) vehicle = _vehicle
            return parseLocation(await this.status(false))
          }, // location()

          async getImages (_vehicle = vehicle) {
            if (vehicle === undefined && _vehicle === undefined) return _error('[vehicle.getImages] invalid vehicle')
            else if (vehicle === undefined) vehicle = _vehicle
          }, // getImages()

          async remoteService (serviceType = BMW_SERVICES.DOOR_LOCK, _vehicle = vehicle) {
            if (vehicle === undefined && _vehicle === undefined) return _error(`[remoteService.${serviceType}] [${vehicle.vin}] invalid vehicle`)
            else if (vehicle === undefined) vehicle = _vehicle
            _debug(`[remoteService.${serviceType}] [${vehicle.vin}]`)
            const [error, result] = await to(
              axios.post(
                util.format(BMW_URLS.service, vehicle.vin),
                qs.stringify({ serviceType: BMW_SERVICES[serviceType] }),
                {
                  headers: headers,
                  validateStatus: function (status) {
                    if (status !== 200) { _error(`[remoteService.${serviceType}] response code `, parseHttpCode(status)) }
                    return status < 500
                  }
                }
              )
            )
            if (error) throw _error(error)
            _debug(`[remoteService.${serviceType}][${vehicle.vin}] ${result.data}`)
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

          async remoteServiceStatus (serviceType = BMW_SERVICES.LOCK, _vehicle = vehicle) {
            if (vehicle === undefined && _vehicle === undefined) return _error(`[remoteServiceStatus.${serviceType}] invalid vehicle`)
            else if (vehicle === undefined) vehicle = _vehicle
            _debug(`[remoteServiceStatus.${serviceType}] ${vehicle.vin}`)
            const [error, result] = await to(
              axios.get(
                util.format(
                  BMW_URLS.serviceStatus,
                  vehicle.vin,
                  BMW_SERVICES[serviceType]
                ),
                {
                  headers: headers,
                  validateStatus: function (status) {
                    if (status !== 200) { _error(`[remoteServiceStatus.${serviceType}] reponse code `, parseHttpCode(status)) }
                    return status < 500
                  }
                }
              )
            )
            _debug(`[remoteServiceStatus.${serviceType}] ${result.data}`)
            if (error) throw _error(`[remoteServiceStatus.${serviceType}] ${error}`)
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
