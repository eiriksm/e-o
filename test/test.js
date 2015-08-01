'use strict';
var should = require('should');
var Eo = require('..');

describe('Types and functions', function() {
  it('Should be a function', function() {
    Eo.should.be.instanceOf(Function);
  });
  it('Should have a couple of methods and properties', function() {
    var e = new Eo();
    should(e.id).be.instanceOf(Object);
    e.start.should.be.instanceOf(Function);
  });
});

describe('End to end', function() {
  it('Should report the expected result on a test run', function(done) {
    this.timeout(5000);
    var s = require('http').createServer(function(req, res) {
      res.end('<script>console.log("hello from web page");somethingStupid()</script>Hello world');
    });
    s.listen(8467);

    var e = new Eo({
      url: 'http://localhost:8467'
    });
    e.on('end', function(d) {
      /*eslint-disable quotes */
      d.consoleMessages[0].should.equal("hello from web page\n");
      /*eslint-enable quotes */
      d.pageErrors.length.should.be.above(0);
      JSON.parse(d.pageErrors[0]).message.indexOf('somethingStupid').should.be.above(1);
      Number(d.statusCode).should.equal(200);
      d.numbers.should.have.property('TOTALTIME');
      d.numbers.should.have.property('RENDERTIME');
      d.numbers.TOTALRESOURCES.should.equal(1);
      s.close();
      done();
    });
    e.start();
  });

  it('Should do the expected when requesting a non-existing URL', function(done) {
    this.timeout(10000);
    var url = 'http:/stupid.nonexistent.url:23""';
    var e = new Eo({
      url: url
    });
    e.logLevel = 'debug';
    e.on('end', function(d) {
      d.statusCode.should.equal(0);
      done();
    });
    e.on('error', function(a, b) {
      // Ignore it.
      a.should.equal('down');
      b.opts.url.should.equal(url);
    });
    e.start();
  });

});
