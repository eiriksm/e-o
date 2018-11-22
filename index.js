'use strict';
var util = require('util');
var path = require('path');
var events = require('events');
const uuidv4 = require('uuid/v4');
var processor = require('./lib/processor');
var pup = require('./lib/puppeteer/site')

function Eo(opts) {
  this.opts = opts;
  this.logs = [];
  this.id = uuidv4();
  this.statusCode = 0;
  this.numbers = {};
  this.pageErrors = [];
  this.consoleMessages = [];
  this.resourceErrors = [];
  this.logLevel = 'normal';
  events.EventEmitter.call(this);
  return this;
}
util.inherits(Eo, events.EventEmitter);

Eo.prototype.start = function() {
  var time = Date.now();
  var url = this.opts.url;
  var eo = this;
  pup({url: url, id: this.id, ignore: this.opts.ignore, auth: this.opts.auth}, function(err, data) {
    if (err) {
      eo.emit('error', 'process', eo)
      eo.emit('error', 'down', eo);
      eo.debug(err.message)
      if (!eo.statusCode) {
        eo.statusCode = 0;
      }
    }
    if (!data) {
      data = []
    }
    data.forEach(function(n) {
      var store = true;
      Object.keys(processor).forEach(function(m) {
        // Run each processor on each line.
        processor[m](n, eo);
      });
      if (store && n.length > 0) {
        // Only store as log if it is something not related to processors.
        eo.debug(n);
      }
    })
    if (eo.statusCode !== 200) {
      // Normalize a little then.
      if (isNaN(eo.statusCode)) {
        eo.statusCode = 0;
      }
      eo.emit('error', 'down', eo);
    }
    if (eo.opts.errors && eo.opts.errors.resourceError && eo.resourceErrors.length > 0) {
      eo.emit('error', 'resource', eo);
    }
    eo.debug(util.format('GET %s ended with the status code %d', url, Number(eo.statusCode)));
    eo.emit('debug', eo.logs);
    eo.processTime = (Date.now() - time);
    eo.emit('end', eo);
  });
  return this;
};

Eo.prototype.echo = function(type, str) {
  console.log('[%s][%s] - %s', type, new Date().toString(), str);
};

Eo.prototype.debug = function(str) {
  this.log('DEBUG', str);
};

Eo.prototype.error = function(str) {
  this.log('ERROR', str);
};

Eo.prototype.log = function(type, str) {
  this.logs.push({type: type, message: str.toString(), timestamp: Date.now()});
  if (this.logLevel === 'debug') {
    this.echo(type, str);
  }
};

module.exports = Eo;
