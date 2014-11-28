var spawn = require('child_process').spawn;
var util = require('util');
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
  var p = spawn(__dirname + '/node_modules/.bin/casperjs',
                [__dirname + '/lib/casper/site.js',
                 url,
                 this.id
  ]);
  var _this = this;
  p.stdout.on('data', function(data) {
    // Sometimes these come in several lines at a time. Let's make sure we
    // process one at a time.
    String(data).split(_this.id).forEach(function(n) {
      var store = true;
      Object.keys(processor).forEach(function(m) {
        // Run each processor on each line.
        if (processor[m](n, _this)) {
        }
      });
      if (store && n.length > 0) {
        // Only store as log if it is something not related to processors.
        _this._debug(n);
      }
    });
  });
  p.on('close', function(c) {
    if (_this.statusCode !== 200) {
      // Normalize a little then.
      if (isNaN(_this.statusCode)) {
        _this.statusCode = 0;
      }
      _this.emit('error', 'down', _this);
    }
    if (c !== 0) {
      _this.emit('error', 'process', _this);
    }
    if (_this.opts.errors && _this.opts.errors.resourceError && _this.resourceErrors.length > 0) {
      _this.emit('error', 'resource', _this);
    }
    _this._debug(util.format('GET %s ended with the status code %d', url, Number(_this.statusCode)));
    _this.emit('debug', _this.logs);
    _this.processTime = (Date.now() - time);
    _this.emit('end', _this);
  });
  return this;
};

Eo.prototype._echo = function(type, str) {
  console.log('[%s][%s] - %s', type, new Date().toString(),str);
};

Eo.prototype._debug = function(str) {
  this.log('DEBUG', str);
};

Eo.prototype._error = function(str) {
  this.log('ERROR', str);
};

Eo.prototype.log = function(type, str) {
  this.logs.push({type: type, message: str, timestamp: Date.now()});
  if (this.logLevel === 'debug') {
    this._echo(type, str);
  }
};

module.exports = Eo;
