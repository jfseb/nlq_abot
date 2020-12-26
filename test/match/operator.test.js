/**
 * @file
 * @module word.nunit
 * @copyright (c) 2016 Gerd Forstmann
 */
var root = '../../js';

//var debuglog = require('debug')('word.nunit');

const Operator = require(root + '/match/operator.js');
//const Category = OpsWord.Category;

it('testMatches', done => {
  // prepare
  // act
  // check
  [{
    operator: { operator: 'containing' },
    fragment: 'abc',
    str: 'xabcy',
    expectedResult: true
  },
  {
    operator: { operator: 'ending with' },
    fragment: 'abc',
    str: 'xyzabc',
    expectedResult: true
  },
  {
    operator: { operator: 'ending with' },
    fragment: 'abc',
    str: 'xyzabcz',
    expectedResult: false
  },
  {
    operator: { operator: 'ending with' },
    fragment: 'abc',
    str: 'xyzabczdefabc',
    expectedResult: true
  },
  {
    operator: { operator: 'starting with' },
    fragment: 'abc',
    str: 'aBcz',
    expectedResult: false
  },
  {
    operator: { operator: 'starting with' },
    fragment: 'abc',
    str: 'xabc',
    expectedResult: false
  },
  {
    operator: { operator: 'starting with' },
    fragment: 'abc',
    str: 'abcz',
    expectedResult: true
  },
  {
    operator: { operator: 'starting with' },
    fragment: 'abc',
    str: 'abc',
    expectedResult: true
  },
  {
    operator: { operator: 'starting with' },
    fragment: 'abc',
    str: '',
    expectedResult: false
  }
  ].forEach(function (oFixture) {
    expect(Operator.matches(
      oFixture.operator,
      oFixture.fragment,
      oFixture.str)).toEqual(oFixture.expectedResult);
  });
  done();
});


it('testMatchesError', done => {
  expect.assertions(1);
  try {
    Operator.matches(
      'not an operator',
      'abc',
      'def');
    expect(1).toEqual(0);
  } catch (e) {
    expect(1).toEqual(1);
  }
  done();
});


