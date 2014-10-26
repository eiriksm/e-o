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

function _arrayProcessor(arr, type, str, eo) {
  if (_lookForType(type, str)) {
    var testString = codes[type];
    eo[arr].push(String(str).replace(testString + ': ', ''));
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
  return _arrayProcessor('pageErrors', 'PAGEERROR', str, eo);
}

function resourceError(str, eo) {
  return _arrayProcessor('resourceErrors', 'RESOURCEERROR', str, eo);
}

function consoleMessage(str, eo) {
  return _arrayProcessor('consoleMessages', 'CONSOLEMSG', str, eo);
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
