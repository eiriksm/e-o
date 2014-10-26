'use strict';
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
  if (_lookForType(type, str)) {
    var testString = codes[type];
    eo.numbers[type] = 0;
    var num = Number(String(str).replace(testString + ': ', ''));
    if (!isNaN(num)) {
      eo.numbers[type] = num;
    }
    return true;
  }
  return false;
}

function _lookForType(type, str) {
  var testString = codes[type];
  if (String(str).indexOf(testString) > -1) {
    return true;
  }
  return false;
}

function screenshot(str, eo) {
  if (_lookForType('SCREENSHOT', str)) {
    var testString = codes.SCREENSHOT;
    eo.screenshot = String(str).replace(testString + ': ', '');
    return true;
  }
  return false;
}

function pageError(str, eo) {
  if (_lookForType('PAGEERROR', str)) {
    var errorString = codes.PAGEERROR;
    eo.pageErrors.push(String(str).replace(errorString + ': ', ''));
    return true;
  }
  return false;
}

function resourceError(str, eo) {
  if (_lookForType('RESOURCEERROR', str)) {
    var testString = codes.RESOURCEERROR;
    eo.resourceErrors.push(String(str).replace(testString + ': ', ''));
    return true;
  }
  return false;
}

function consoleMessage(str, eo) {
  if (_lookForType('CONSOLEMSG', str)) {
    var testString = codes.CONSOLEMSG;
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
