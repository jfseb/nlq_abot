/**
 * @file ererror.nunit
 * @copyright (c) 2016-2020 Gerd Forstmann
 */


/* eslxxint-disable */

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../js_cov' : '../../js';

//var debuglog = require('debug')('erbase.nunit');

const ERError = require(root + '/match/ererror.js');

it('testErrorNoWord', done => {
  var tokens = ['What', 'is', 'Abc' , 'def' ];
  var res = ERError.makeError_NO_KNOWN_WORD(2, tokens);
  expect(res).toEqual({
    err_code : 'NO_KNOWN_WORD',
    text : 'I do not understand "Abc".',
    context : {
      tokens : tokens,
      token : 'Abc',
      index : 2
    }
  });
  done();
});

it('testErrorNoWordThrow', done => {
  var tokens = ['What' ];
  try {
    ERError.makeError_NO_KNOWN_WORD(2, tokens);
    expect(1).toEqual(0);
  } catch(e) {
    expect(1).toEqual(1);
  }
  done();
});

it('testErrorEmptyString', done => {
  var res = ERError.makeError_EMPTY_INPUT();
  expect(res).toEqual({
    err_code : 'EMPTY_INPUT',
    text : 'I did not get an input.'
  });
  done();
});


it('testExplainErrorEmpty', done => {
  var empty = ERError.makeError_EMPTY_INPUT();
  var res = ERError.explainError([empty]);
  expect(res).toEqual('\nI did not get an input.');
  done();
});

it('testExplainErrorEmpty', done => {
  var err = ERError.makeError_NO_KNOWN_WORD(1, ['so', 'nicht']);
  var res = ERError.explainError([err]);
  expect(res).toEqual('\nI do not understand "nicht".');
  done();
});

