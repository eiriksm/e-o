var codes = require('../common/codes');
var casper = require('casper').create({
  viewportSize: {
    width: 1280,
    height: 960
  }
});
var site = String(casper.cli.get(0));
var id = String(casper.cli.get(1));
var md5 = require('../3rdparty/js-md5');

var start;
var lastResource;
var resources = [];

casper.start(site, function(res) {
  // Log the statuscode.
  _log('STATUSCODE', res.status);
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
  _log('TOTALTIME', totalTime);
  _log('RENDERTIME', totalTime - (lastResource - start));
  _log('TOTALRESOURCES', resources.length);
});

casper.on('resource.requested', function(res) {
  resources.push(res);
});

casper.on('resource.received', function() {
  lastResource = Date.now();
});

casper.on('resource.error', function(resourceError) {
  _log('RESOURCEERROR', JSON.stringify(resourceError, 4));
});

casper.on('page.error', function(e, t) {
  _log('PAGEERROR', JSON.stringify({message: e, trace: t}));
});

casper.on('remote.message', function(data) {
  _log('CONSOLEMSG', data);
});

casper.on('capture.saved', function(file) {
  _log('SCREENSHOT', file);
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

function _log(type, str) {
  if (!codes[type]) {
    throw new Error('Log type is not recognized');
  }
  console.log(id + type + ': ' + str);
}

casper.run();
