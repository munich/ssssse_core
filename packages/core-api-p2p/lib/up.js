'use strict'

const logger = require('@arkecosystem/core-container').get('logger')
const Hapi = require('hapi')

module.exports = class Up {
  /**
   * @constructor
   * @param  {P2PInterface} p2p
   * @param  {Object}       config
   */
  constructor (p2p, config) {
    this.p2p = p2p
    this.config = config
  }

  /**
   * Start the Hapi interface and register plugins.
   * @return {Promise}
   */
  async start () {
    this.server = new Hapi.Server({ port: this.config.port })
    this.server.app.p2p = this.p2p

    await this.server.register({
      plugin: require('./plugins/accept-request')
    })

    await this.server.register({
      plugin: require('./plugins/set-headers')
    })

    await this.server.register({
      plugin: require('./versions/internal'),
      routes: { prefix: '/internal' }
    })

    if (this.config.remoteinterface) {
      await this.server.register({
        plugin: require('./versions/remote'),
        routes: { prefix: '/remote' }
      })
    }

    await this.server.register({ plugin: require('./versions/1') })

    try {
      await this.server.start()

      logger.info(`P2P API available and listening on ${this.server.info.uri}`)
    } catch (err) {
      logger.error(err)

      process.exit(1)
    }
  }

  /**
   * Stop the server.
   * @return {Promise}
   */
  stop () {
    return this.server.stop()
  }
}
