/*
  d8             888                       ,e,
 d88    e88 88e  888 ee  ,e e,  888,8,      "   dP"Y
d88888 d888 888b 888 P  d88 88b 888 "      888 C88b
 888   Y888 888P 888 b  888   , 888    d8b 888  Y88D
 888    "88 88"  888 8b  "YeeP" 888    Y8P 888 d,dP
------------------------------------------ 88P -----
  @bmwcd/toker.js by @nberlette            8"
*/
const moment = require('moment')
const fs = require('fs')
const yaml = require('js-yaml')

module.exports.Toker = class {
  constructor (token = false, file = './token.json', minimum = 10) {
    this.default = [moment().valueOf(), '']
    this.token = token || this.default
    this.file = file
    this.minimum = Number(minimum * 60 * 1000)
  }

  get (key = 'token') {
    return this[key]
  }

  set (value, key = 'token') {
    return (this[key] = value || false)
  }

  json (data = this.token, replacer = null, spaces = 2) {
    return JSON.stringify(data, replacer, spaces)
  }

  yaml (data = this.token, options = {}) {
    return yaml.dump(data, options)
  }

  format (tokenData, setToken = false) {
    const token = [moment().add(tokenData.expires_in, 'seconds').valueOf(), tokenData.access_token]
    if (setToken) this.token = token
    return token
  }

  check (token) {
    if (/^[a-z0-9]{32}$/i.test(token[1]) && Math.abs(moment(token[0]).diff(moment())) >= this.minimum) return true
    else return false
  }

  init () {
    try {
      fs.closeSync(fs.openSync(this.file, 'a+'))
      this.write(this.file, this.default)
    } catch (error) {
      throw console.error(error)
    }
    return this.token
  }

  read () {
    try {
      this.token = JSON.parse(fs.readFileSync(this.file, 'utf-8'))
    } catch (error) {
      this.init()
      this.token = JSON.parse(fs.readFileSync(this.file, 'utf-8')) || console.error(error)
    }
    return this.token
  }

  write (file = this.file, data = this.token, type = 'json') {
    try {
      data = type === 'yaml' ? this.yaml(data, {}) : this.json(data)
      return fs.writeFileSync(file, data, 'utf8')
    } catch (error) {
      throw console.error(error)
    }
  }
}
