var codes = require('./common/codes');

module.exports = {
  statusCode: statusCode,
  renderTime: renderTime,
  pageError: pageError,
  consoleMessage: consoleMessage,
  resourceError: resourceError,
  screenshot: screenshot,
  totalTime: totalTime,
  totalResources: totalResources
};

function totalTime(str, eo) {
  return _numberProcessor('TOTALTIME', str, eo);
}

function totalResources(str, eo) {
  return _numberProcessor('TOTALRESOURCES', str, eo);
}

function _numberProcessor(type, str, eo) {
  var testString = codes[type];
  if (String(str).indexOf(testString) > -1) {
    eo.numbers[type] = 0;
    var num = Number(String(str).replace(testString + ': ', ''));
    if (!isNaN(num)) {
      eo.numbers[type] = num;
    }
    return true;
  }
  return false;
}

function screenshot(str, eo) {
  var testString = codes.SCREENSHOT;
  if (String(str).indexOf(testString) > -1) {
    eo.screenshot = String(str).replace(testString + ': ', '');
    return true;
  }
  return false;
}

function pageError(str, eo) {
  var errorString = codes.PAGEERROR;
  if (String(str).indexOf(errorString) > -1) {
    eo.pageErrors.push(String(str).replace(errorString + ': ', ''));
    return true;
  }
  return false;
}

function resourceError(str, eo) {
  var testString = codes.RESOURCEERROR;
  if (String(str).indexOf(testString) > -1) {
    eo.resourceErrors.push(String(str).replace(testString + ': ', ''));
    return true;
  }
  return false;
}

function consoleMessage(str, eo) {
  var testString = codes.CONSOLEMSG;
  if (String(str).indexOf(testString) > -1) {
    eo.consoleMessages.push(String(str).replace(testString + ': ', ''));
    return true;
  }
  return false;
}

function renderTime(str, eo) {
  return _numberProcessor('RENDERTIME', str, eo);
}

function statusCode(str, eo) {
  if (_numberProcessor('STATUSCODE', str, eo)) {
    eo.statusCode = eo.numbers.STATUSCODE;
    return true;
  }
  return false;
}
