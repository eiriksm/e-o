/*global document*/
'use strict';
var codes = require('../common/codes');
var md5 = require('../3rdparty/js-md5');
var util = require('utils');

var start, site, id;
var lastResource;
var resources = [];

function log(type, str) {
  if (!codes[type]) {
    throw new Error('Log type is not recognized');
  }
  console.log(id + type + ': ' + str);
}

var casper = require('casper').create({
  viewportSize: {
    width: 1280,
    height: 960
  },
  stepTimeout: 30000,
  timeout: 40000,
  colorizerType: 'Dummy',
  onTimeout: function() {
    casper.capture('shots/' + md5(site) + '/' + start + '.png', {
      left: 0,
      top: 0,
      width: 1280,
      height: 960
    });
    log('PAGEERROR', 'script timed out');
    this.exit(0);
  },
  onResourceError: function() {
    util.dump(arguments);
  }
});
var opts = JSON.parse(String(casper.cli.get(0)));
id = opts.id;
site = opts.url;

casper.start(site);
casper.then(function(res) {
  // Log the statuscode.
  log('STATUSCODE', res.status);
  // Take a picture. But make sure the background is not transparent.
  // Stole this idea from http://uggedal.com/journal/phantomjs-default-background-color/
  this.evaluate(function() {
    var style = document.createElement('style');
    var text = document.createTextNode('body { background: #fff }');
    style.setAttribute('type', 'text/css');
    style.appendChild(text);
    document.head.insertBefore(style, document.head.firstChild);
  });
  // Take a picture
  this.capture('shots/' + md5(site) + '/' + start + '.png', {
    left: 0,
    top: 0,
    width: 1280,
    height: 960
  });
});

casper.on('page.resource.requested', function() {
  if (!start) {
    start = Date.now();
  }
});

casper.on('load.finished', function() {
  var totalTime = (Date.now() - start);
  log('TOTALTIME', totalTime);
  log('RENDERTIME', totalTime - (lastResource - start));
  log('TOTALRESOURCES', resources.length);
});

casper.on('resource.requested', function(res, req) {
  // Avoid sending false statistics to google analytics.
  // @todo. Support more of these?
  if (res.url.indexOf('script.hotjar.com') > -1) {
    req.abort();
    return;
  }
  if (res.url.indexOf('google-analytics.com') > -1) {
    req.abort();
    return;
  }
  if (opts.ignore && opts.ignore[res.url]) {
    log('IGNORE', res.url);
    req.abort();
    return;
  }
  resources.push(res);
});

casper.on('resource.received', function() {
  lastResource = Date.now();
});

casper.on('resource.error', function(resourceError) {
  if (resourceError.url === '') {
    // Not so interesting. This might for example happen when requests are
    // aborted. Like analytics.
    return;
  }
  if (resourceError.url === site) {
    // Do nothing.
    return;
  }
  log('RESOURCEERROR', JSON.stringify(resourceError, 4));
});

casper.on('page.error', function(e, t) {
  log('PAGEERROR', JSON.stringify({message: e, trace: t}));
});

casper.on('remote.message', function(data) {
  log('CONSOLEMSG', data);
});

casper.on('capture.saved', function(file) {
  log('SCREENSHOT', file);
});
casper.on('page.initialized', function() {
  this.evaluate(function() {
      var isFunction = function(o) {
        return typeof o === 'function';
      };

      var bind,
        slice = [].slice,
        proto = Function.prototype,
        featureMap;

      featureMap = {
        'function-bind': 'bind'
      };

      function has(feature) {
        var prop = featureMap[feature];
        return isFunction(proto[prop]);
      }

      // check for missing features
      if (!has('function-bind')) {
        // adapted from Mozilla Developer Network example at
        // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
        bind = function bind(obj) {
          var args = slice.call(arguments, 1),
            self = this,
            Nop = function() {
            },
            bound = function() {
              return self.apply(this instanceof Nop ? this : (obj || {}), args.concat(slice.call(arguments)));
            };
          Nop.prototype = this.prototype || {}; // Firefox cries sometimes if prototype is undefined
          bound.prototype = new Nop();
          return bound;
        };
        proto.bind = bind;
      }
  });
});

casper.run();
