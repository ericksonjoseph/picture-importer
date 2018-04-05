'use strict';

const log4js = require('log4js');

const LOG = log4js.getLogger();

const level = process.env.LOG_LEVEL || 'trace'
LOG.setLevel(level);

// Bridge to handle all logging using singleton logger instance
module.exports = class Logger {

    static trace() {
        LOG.trace.apply(LOG, arguments);
    }

    static debug() {
        LOG.debug.apply(LOG, arguments);
    }

    static info() {
        LOG.info.apply(LOG, arguments);
    }

    static warn() {
        LOG.warn.apply(LOG, arguments);
    }

    static error() {
        LOG.error.apply(LOG, arguments);
    }

    static fatal() {
        LOG.fatal.apply(LOG, arguments);
    }
}
