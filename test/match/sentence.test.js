/**
 * @file
 * @module toolmatcher.nunit
 * @copyright (c) 2016 Gerd Forstmann
 */

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../js_cov' : '../../js';

var debuglog = require('debug')('sentence.nunit');

const sentence = require(root + '/match/sentence.js');

debuglog(' here sentence ' + JSON.stringify(sentence));

const oSentence = [
  { 'matchedString': 'start', 'category': 'filler' },
  { 'matchedString': 'catalog', 'category': 'category' },
  { 'matchedString': 'ABC', 'category': 'catalog' },
  { 'matchedString': 'in', 'category': 'filler' },
  { 'matchedString': 'FLPD', 'category': 'tool' },
  { 'matchedString': 'in', 'category': 'filler' },
  { 'matchedString': 'UV2', 'category': 'systemId' },
  { 'matchedString': 'client', 'category': 'category' },
  { 'matchedString': '120', 'category': 'client' }
];



it('testFindWordByCategory', done => {
  // prepare
  // act
  const res = sentence.findWordByCategory(oSentence, 'catalog');
  expect(res).toEqual({ word : oSentence[2], index : 2});
  expect(res.word).toEqual(oSentence[2]);
  done();
});



it('testGetDistinctCategoriesInSentence', done => {
  // prepare
  // act
  const res = sentence.getDistinctCategoriesInSentence([
    { 'matchedString': 'start', 'category': 'filler' },
    { 'matchedString': 'catalog', 'category': 'category' },
    { 'matchedString': 'ABC', 'category': 'catalog' },
    { 'matchedString': 'in', 'category': 'filler' },
    { 'matchedString': 'FLPD', 'category': 'category' },
    { 'matchedString': 'in', 'category': 'filler' },
    { 'matchedString': 'catalog', 'category': 'category' },
    { 'matchedString': 'client', 'category': 'category' },
    { 'matchedString': '120', 'category': 'client' }
  ]);
  expect(res).toEqual(['catalog', 'FLPD', 'client']);
  done();
});



it('testFindWordByCategoryNotFound', done => {
  // prepare
  // act
  const res = sentence.findWordByCategory(oSentence, 'notthese');
  expect(res).toEqual({});
  done();
});


it('testRankingGeometricMean', done => {
  expect(sentence.rankingGeometricMean( [{_ranking : 1 }, { _ranking : 1}] )).toEqual(1);
  expect(sentence.rankingGeometricMean( [{_ranking : 0.5 }, { _ranking : 0.5}] )).toEqual(0.5);
  expect(sentence.rankingGeometricMean( [] )).toEqual(1);
  expect(sentence.rankingGeometricMean( [{_ranking : 0.8 }] )).toEqual(0.8);
  expect(sentence.rankingGeometricMean( [{_ranking : 0.5 }, { _ranking : 1.0}] )).toEqual(Math.pow(0.5,0.5));

  done();
});

it('testCmpRanking', done => {
  expect(
    sentence.cmpRankingProduct([{ _ranking : 0.5},{ _ranking : 0.5 }] , [ { _ranking : 0.4}]) < 0
  ).toBeTruthy();
  done();
});
