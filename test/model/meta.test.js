/*! copyright gerd forstmann, all rights reserved */
//var debug = require('debug')('appdata.nunit');
var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../gen_cov' : '../../js';

var Meta = require(root + '/model/meta.js');


/**
 * Unit test for sth
 */
it('testAMetaBad', async () => {
  try {
    new Meta.AMeta('junk','junk');
    expect(true).toEqual(false);
  } catch(e) {
    expect(e.toString().indexOf('junk') >= 0).toEqual(true);
  }
  //test.done();
});


/**
 * Unit test for sth
 */
it('testAMeta', async () => {

  expect(new Meta.AMeta('category', 'unit test').toFullString()).toEqual('category -:- unit test');
  expect(new Meta.AMeta('relation', 'abc').toName()).toEqual('abc');
  //test.done();
});

/**
 * Unit test for sth
 */
it('testMetaFactory', async () => {
  expect(Meta.getMetaFactory().Domain('abc').toFullString()).toEqual('domain -:- abc');
  expect(Meta.getMetaFactory().Category('abc').toFullString()).toEqual('category -:- abc');
  expect(Meta.getMetaFactory().Relation('abc').toFullString()).toEqual('relation -:- abc');
  //test.done();
});


/**
 * Unit test for sth
 */
it('testgetMetaFactory_parseIMeta', async () => {
  expect(Meta.getMetaFactory().parseIMeta('category -:- def').toFullString()).toEqual('category -:- def');
  expect(Meta.getMetaFactory().parseIMeta('relation -:- def').toFullString()).toEqual('relation -:- def');
  expect(Meta.getMetaFactory().parseIMeta('domain -:- def').toFullString()).toEqual('domain -:- def');
  try {
    Meta.getMetaFactory().parseIMeta('catego def');
    expect(true).toEqual(false);
  } catch(e) {
    expect(e.toString().indexOf('catego def') >= 0).toEqual(true);
  }
  try {
    Meta.getMetaFactory().parseIMeta('catego -:- def');
    expect(true).toEqual(false);
  } catch(e) {
    expect(e.toString().indexOf('catego') >= 0).toEqual(true);
  }
  //test.done();
});



it('testGetStringArray', async () => {
  expect(Meta.getStringArray([
    Meta.getMetaFactory().Domain('abc'),
    Meta.getMetaFactory().Relation('def'),
    Meta.getMetaFactory().Category('abc')
  ])).toEqual(['abc', 'def', 'abc']);
  //test.done();
});
