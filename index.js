'use strict';
var spawn = require('child_process').spawn;
var util = require('util');
var path = require('path');
var events = require('events');
var uuid = require('node-uuid');
var processor = require('./lib/processor');

function Eo(opts) {
  this.opts = opts;
  this.logs = [];
  this.id = uuid.v4();
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
  var args = [];
  if (this.opts.ignoreSsl) {
    args.push('--ignore-ssl-errors=true');
    args.push('--ssl-protocol=any');
  }
  if (this.opts.debug) {
    args.push('--debug=true');
  }
  args.push(path.join(__dirname, '/lib/casper/site.js'));
  args.push(JSON.stringify({url: url, id: this.id, ignore: this.opts.ignore}));
  var eo = this;
  var p = spawn(path.join(__dirname, '/node_modules/.bin/casperjs'), args);
  p.stdout.on('data', function(data) {
    // Sometimes these come in several lines at a time. Let's make sure we
    // process one at a time.
    String(data).split(eo.id).forEach(function(n) {
      var store = true;
      Object.keys(processor).forEach(function(m) {
        // Run each processor on each line.
        processor[m](n, eo);
      });
      if (store && n.length > 0) {
        // Only store as log if it is something not related to processors.
        eo.debug(n);
      }
    });
  });
  p.stderr.on('data', function(data) {
    eo.debug(data);
  });
  p.on('close', function(c) {
    if (eo.statusCode !== 200) {
      // Normalize a little then.
      if (isNaN(eo.statusCode)) {
        eo.statusCode = 0;
      }
      eo.emit('error', 'down', eo);
    }
    if (c !== 0) {
      eo.emit('error', 'process', eo);
    }
    if (eo.opts.errors && eo.opts.errors.resourceError && eo.resourceErrors.length > 0) {
      eo.emit('error', 'resource', eo);
    }
    eo.debug(util.format('GET %s ended with the status code %d', url, Number(eo.statusCode)));
    args.forEach(function(n) {
      eo.debug('Arg: ' + n);
    });
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
  this.logs.push({type: type, message: str, timestamp: Date.now()});
  if (this.logLevel === 'debug') {
    this.echo(type, str);
  }
};

module.exports = Eo;
