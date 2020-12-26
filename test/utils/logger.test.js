/*! copyright gerd forstmann, all rights reserved */

var debuglog = require('debug')('logger.nunit');

var root = '../../js';


var Logger = require(root + '/utils/logger.js');


it('testPerf', done => {
  var perf = Logger.perf('ABC');
  perf('abc');
  perf('abc');

  expect(typeof perf).toEqual('function');
  done();
});
/**
 * Unit test for sth
 */

it('testCTor', done => {
  expect.assertions(8);
  try {
    Logger.logger('$');
    expect(false).toBeTruthy();
  } catch (e) {
    expect(true).toBeTruthy();
  }
  try {
    Logger.logger('aBC$');
    expect(false).toBeTruthy();
  } catch (e) {
    expect(true).toBeTruthy();
  }
  try {
    Logger.logger('0aBCD');
    expect(false).toBeTruthy();
  } catch (e) {
    expect(true).toBeTruthy();
  }

  try {
    // illegal argument
    Logger.logger('ABCDEF','w');
    expect(false).toBeTruthy();
  } catch (e) {
    expect(true).toBeTruthy();
  }


  try {
    Logger.logger('AaBCD.def');
    expect(false).toBeTruthy();
  } catch (e) {
    expect(true).toBeTruthy();
  }
  var log = Logger.logger('AB');

  try {
    Logger.logger('AB','');
    expect(false).toBeTruthy();
  } catch (e) {
    expect(true).toBeTruthy();
  }
  Logger.logger('aBC');

  try {
    log(undefined);
    expect(false).toBeTruthy();
  } catch (e) {
    expect(true).toBeTruthy();
  }

  Logger.logger('ABC_abc0234');
  expect(true).toBeTruthy();
  done();
});


it('testSameInstanceHandedOut', done => {
  expect.assertions(2);
  var res = Logger.logger('AB');
  var res2 = Logger.logger('aBC');
  var res3 = Logger.logger('AB');
  expect(res).toEqual(res3);
  expect(res === res2).toEqual(false);
  done();
});


var fs = require('fs');

it('testLogOpenOverwrite', done => {
  expect.assertions(2);
  var filef = Logger._test.getFileName('TEST_OV');
  try {
    fs.unlinkSync(filef);
  } catch (e) {
    /* empty */
    // emtpy
    // debug("could not remove file");
  }
  var log1 = Logger.logger('TEST_OV','');
  log1('my entry');
  var res = ' ' + fs.readFileSync(filef);
  expect(res.indexOf('my entry') > 0).toEqual(true);
  expect(true).toBeTruthy();
  done();
});


it('testLogOpenAppend', done => {
  expect.assertions(4);
  var filef = Logger._test.getFileName('TEST_AB');
  try {
    fs.unlinkSync(filef);
  } catch (e) {
    /* empty */
    // emtpy
    // debug("could not remove file");
  }
  fs.writeFileSync(filef,'already in log');
  var log1 = Logger.logger('TEST_AB','a');
  log1('my entry 1');
  var log2 = Logger.logger('TEST_AB','a');
  log1('my entry 2');
  log2('my entry 3');
  var res = ' ' + fs.readFileSync(filef);
  expect(res.indexOf('my entry 1') > 0).toEqual(true);
  expect(res.indexOf('my entry 2') > 0).toEqual(true);
  expect(res.indexOf('my entry 3') > 0).toEqual(true);
  expect(res.indexOf('already in log') > 0).toEqual(true);
  done();
});


it('testLogException', done => {
  expect.assertions(2);
  var filef = Logger._test.getFileName('TEST_AC');
  try {
    fs.unlinkSync(filef);
  } catch (e) {
    /* empty */
    // emtpy
    // debug("could not remove file");
  }
  var log1 = Logger.logger('TEST_AC','');
  var stack = '';
  try {
    throw new Error('wow i crashed');
  } catch (e) {
    log1(e);
    stack = e.stack;
    debuglog('here a stack' + stack.toString());
  }
  var res = ' ' + fs.readFileSync(filef);
  expect(res.indexOf('wow i crashed') >= 0).toEqual(true);
  expect(res.indexOf(stack.toString()) >= 0).toEqual(true);
  done();
});


it('testLogPerf', done => {
  expect.assertions(18);

  var sS = undefined;
  var sU = undefined;
  var sK = undefined;
  var cS = 0;
  var cU = 0;
  var cK = 0;
  var FakeCons = {
    log : function(s) { ++cS; sS = s;},
    time : function(u) { ++cU; sU = u; },
    timeEnd : function(k) { ++cK; sK= k;}
  };

  var logger = Logger.logPerf.bind({ enabled : true , first : 0, on : {}, name: 'thename'}, FakeCons);
  logger('here');
  expect(cS).toEqual(1);
  expect(sS).toEqual('Perfthename');
  expect(cK).toEqual(0);
  expect(sK).toEqual(undefined);
  expect(cU).toEqual(1);
  expect(sU).toEqual('here');


  logger('here');

  expect(cS).toEqual(3);
  expect(sS.indexOf('Perfthename delta:')).toEqual(0);
  expect(cK).toEqual(1);
  expect(sK).toEqual('here');
  expect(cU).toEqual(1);
  expect(sU).toEqual('here');

  logger('here');

  expect(cS).toEqual(5);
  expect(sS.indexOf('Perfthename delta:')).toEqual(0);
  expect(cK).toEqual(1);
  expect(sK).toEqual('here');
  expect(cU).toEqual(2);
  expect(sU).toEqual('here');

  done();
});


