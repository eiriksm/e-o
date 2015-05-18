'use strict';
var codes = require('./common/codes');

function lookForType(type, str) {
  var testString = codes[type];
  if (String(str).indexOf(testString) > -1) {
    return true;
  }
  return false;
}

function numberProcessor(type, str, eo) {
  if (lookForType(type, str)) {
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

function totalTime(str, eo) {
  return numberProcessor('TOTALTIME', str, eo);
}

function totalResources(str, eo) {
  return numberProcessor('TOTALRESOURCES', str, eo);
}

function arrayProcessor(arr, type, str, eo) {
  if (lookForType(type, str)) {
    var testString = codes[type];
    eo[arr].push(String(str).replace(testString + ': ', ''));
    return true;
  }
  return false;
}

function screenshot(str, eo) {
  if (lookForType('SCREENSHOT', str)) {
    var testString = codes.SCREENSHOT;
    eo.screenshot = String(str).replace(testString + ': ', '');
    return true;
  }
  return false;
}

function pageError(str, eo) {
  return arrayProcessor('pageErrors', 'PAGEERROR', str, eo);
}

function resourceError(str, eo) {
  return arrayProcessor('resourceErrors', 'RESOURCEERROR', str, eo);
}

function consoleMessage(str, eo) {
  return arrayProcessor('consoleMessages', 'CONSOLEMSG', str, eo);
}

function renderTime(str, eo) {
  return numberProcessor('RENDERTIME', str, eo);
}

function statusCode(str, eo) {
  if (numberProcessor('STATUSCODE', str, eo)) {
    eo.statusCode = eo.numbers.STATUSCODE;
    return true;
  }
  return false;
}

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
