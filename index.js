var spawn = require('child_process').spawn;
var util = require('util');
var events = require('events');
var uuid = require('node-uuid');
var process = require('./lib/process');

function Eo(opts) {
  this.opts = opts;
  this.logs = [];
  this.id = uuid.v4();
  this.statusCode = 0;
  this.numbers = {};
  this.pageErrors = [];
  this.consoleMessages = [];
  this.resourceErrors = [];
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
      if (process.statusCode(n, _this)) {
        store = false;
      }
      if (process.renderTime(n, _this)) {
        store = false;
      }
      if (process.pageError(n, _this)) {
        store = false;
      }
      if (process.consoleMessage(n, _this)) {
        store = false;
      }
      if (process.resourceError(n, _this)) {
        store = false;
      }
      if (process.screenshot(n, _this)) {
        store = false;
      }
      if (process.totalTime(n, _this)) {
        store = false;
      }
      if (process.totalResources(n, _this)) {
        store = false;
      }
      if (store && n.length > 0) {
        _this._debug(util.format('Data from client %s: %s', _this.id, n));
      }
    });
  });
  p.on('close', function(c) {
    if (_this.statusCode !== 200) {
      // Normalize a little then.
      if (isNaN(_this.statusCode)) {
        _this.statusCode = 0;
      }
      _this.emit('error', _this.statusCode, _this.logs);
    }
    _this._echo(util.format('%s (%s) ended with the status code %d', _this.id, url, Number(_this.statusCode)));
    _this.emit('debug', _this.logs);
    _this.processTime = (Date.now() - time);
    _this.emit('end', _this);
  });
  return this;
};

Eo.prototype._echo = function(str) {
};

Eo.prototype._debug = function(str) {
  this.log('DEBUG', util.format('[%s] %s', new Date().toString(), str));
};

Eo.prototype._error = function(str) {
  this.log('ERROR', util.format('[%s] %s', new Date().toString(), str));
};

Eo.prototype.log = function(type, str) {
  this.logs.push({type: type, message: str});
};

module.exports = Eo;
