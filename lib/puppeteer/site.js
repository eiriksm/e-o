const puppeteer = require('puppeteer');
var codes = require('../common/codes');
var md5 = require('../3rdparty/js-md5');
const mkdirp = require('async-mkdirp');

var start, site, id;
var lastResource;
var resources = [];
var data = []

function log(type, str) {
  if (!codes[type]) {
    throw new Error('Log type is not recognized');
  }
  data.push(type + ': ' + str);
}

function isBlackListed(url, opts) {
  // Avoid sending false statistics to google analytics.
  // @todo. Support more of these?
  if (url.indexOf('script.hotjar.com') > -1) {
    return true;
  }
  if (url.indexOf('google-analytics.com') > -1) {
    return true;
  }
  if (opts.ignore && opts.ignore[url]) {
    log('IGNORE', url);
    return true;
  }
  if (opts.ignore) {
    for (var prop in opts.ignore) {
      if (url.indexOf(prop) > -1) {
        log('IGNORE', url);
        return true;
      }
    }
  }
  return false
}

module.exports = function(config, callback) {
    (async function () {
      data = []
      var site = config.url
      let browser
      try {
        browser = await puppeteer.connect({ browserWSEndpoint: 'ws://localhost:3000' });
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        await page.setViewport({
          width: 1280,
          height: 960
        })
        if (config.auth) {
          page.authenticate({
            username: config.auth[0],
            password: config.auth[1]
          })
        }
        page.on('request', function(req) {
          if (isBlackListed(req.url(), config)) {
            req.abort()
            return
          }

          if (!start) {
            start = Date.now();
          }
          req.continue()
        })
        page.on('load', function() {
          var totalTime = (Date.now() - start);
          log('TOTALTIME', totalTime);
          log('RENDERTIME', totalTime - (lastResource - start));
          log('TOTALRESOURCES', resources.length);
        })
        page.on('requestfinished', function(request) {
          lastResource = Date.now();
          var response = request.response()
          var chain = request.redirectChain()
          if (chain && chain[0]) {
            // Use the statuscode for this, but the URL for the first one.
            if (chain[0].url() == config.url || chain[0].url() == config.url + '/') {
              request = chain[0]
              log('DEBUG', 'Redirect from ' + chain[0].url() + ' detected to ' + response.url())
            }
          }
          if (response && request.url() == config.url || request.url() == config.url + '/') {
            // console.log(request.redirectChain())
            log('STATUSCODE', response.status()) 
          }
        })
        page.on('requestfailed', function(req) {
          if (isBlackListed(req.url(), config)) {
            // Not so interesting. This might for example happen when requests are
            // aborted. Like analytics.
            return;
          }
          if (req.url() === site || req.url() == site + '/') {
            // Do nothing.
            return;
          }
          log('RESOURCEERROR', JSON.stringify({
            url: req.url(),
            error: req.failure()
          }, 4));
        })
        page.on('response', function(response) {
          resources.push(response.url());
        })
        page.on('pageerror', function(e) {
          log('PAGEERROR', JSON.stringify({message: e.message, trace: e.stack}));
        });
        page.on('console', function(msg) {
          var data = msg.args()
          for (let i = 0; i < data.length; ++i) {
            log('CONSOLEMSG', `${i}: ${msg.args()[i]}`)
          }
        });
        await page.goto(config.url);
        var dir = 'shots/' + md5(site) + '/'
        await mkdirp(dir)
        var file = dir + start + '.png'
        await page.screenshot({
          path: file,
          clip: {
            x: 0,
            y: 0,
            width: 1280,
            height: 960
          }
        })
        log('SCREENSHOT', file)
        await browser.close()
        callback(null, data)
      }
      catch (err) {
        try {
          if (browser) {
            await browser.close()
          }
        }
        catch (anotherErr) {
          console.log('Could not close browser')
        }
        callback(err)
      }
    })()
}