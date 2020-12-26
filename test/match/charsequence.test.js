/**
 * @file
 * @module charsequence.nunit.js
 * @copyright (c) 2016 Gerd Forstmann
 */

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../js_cov' : '../../js';

// var debuglog = require('debug')('charsequence.nunit');

const charsequence = require(root + '/match/charsequence.js').CharSequence;

it('testIsSameOrSimilar', done => {
  expect(false).toEqual(charsequence.isSameOrPluralOrVeryClose( 'abcdef', 'hijkl'));
  expect(false).toEqual(charsequence.isSameOrPluralOrVeryClose( '', 'hijkl'));
  expect(true).toEqual(charsequence.isSameOrPluralOrVeryClose( 'abcde', 'abcdef'));
  expect(true).toEqual(charsequence.isSameOrPluralOrVeryClose( 'abcs', 'abc'));
  expect(true).toEqual(charsequence.isSameOrPluralOrVeryClose( 'abcs', 'ABC'));
  expect(false).toEqual(charsequence.isSameOrPluralOrVeryClose( 'abd', 'ABC'));
  expect(false).toEqual(charsequence.isSameOrPluralOrVeryClose( 'abs', 'AB'));
  expect(false).toEqual(
    charsequence.isSameOrPluralOrVeryClose( 'element names', 'element numbers')
  );
  expect(true).toEqual(charsequence.isSameOrPluralOrVeryClose( 'element names', 'element name'));
  expect(true).toEqual(charsequence.isSameOrPluralOrVeryClose( 'element name', 'element nme'));
  expect(false).toEqual(charsequence.isSameOrPluralOrVeryClose( 'element Numbers', 'element nme'));
  expect(false).toEqual(charsequence.isSameOrPluralOrVeryClose( 'element names', 'element nme'));
  expect(true).toEqual(charsequence.isSameOrPluralOrVeryClose( 'application', 'applications'));
  done();
});
