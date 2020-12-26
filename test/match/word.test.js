/**
 * @file
 * @module word.nunit
 * @copyright (c) 2016 Gerd Forstmann
 */

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../js_cov' : '../../js';

//var debuglog = require('debug')('word.nunit');

const OpsWord = require(root + '/match/word.js');
const Word = OpsWord.Word;
//const Category = OpsWord.Category;

it('testWordisCategory', done => {
  expect(Word.isCategory({ category: 'category' })).toEqual(true);
  expect(Word.isCategory({ category: 'wiki' })).toEqual(false);
  expect(Word.isCategory({})).toEqual(false);
  done();
});

//const Category = OpsWord.Category;

it('testWordisDomain', done => {
  expect(Word.isDomain({ category: 'category' })).toEqual(false);
  expect(Word.isDomain({ category: 'domain' })).toEqual(true);
  expect(Word.isDomain({})).toEqual(false);
  expect(
    Word.isDomain({ 'string': 'cusmos', 'rule': { 'category': 'domain', 'matchedString': 'Cosmos', 'type': 0, 'word': 'Cosmos', 'bitindex': 16, 'bitSentenceAnd': 16, 'exactOnly': false, 'wordType': 'F', '_ranking': 0.95, 'lowercaseword': 'cosmos' }, 'matchedString': 'Cosmos', 'category': 'domain', '_ranking': 0.8913821472645002, 'levenmatch': 0.9382969971205265 }
    )
  ).toEqual(false);
  expect(
    Word.isDomain({ 'string': 'cusmos', 'rule': { 'category': 'domain', 'matchedString': 'Cosmos', 'type': 0, 'word': 'Cosmos', 'bitindex': 16, 'bitSentenceAnd': 16, 'exactOnly': false, 'wordType': 'F', '_ranking': 0.95, 'lowercaseword': 'cosmos' }, 'matchedString': 'Cosmos', 'category': 'domain', '_ranking': 0.8913821472645002, 'levenmatch': 0.9382969971205265 })
  ).toEqual(false);
  expect(
    Word.isDomain({ 'string': 'cusmos', 'rule': { 'category': 'domain', 'matchedString': 'Cosmos', 'type': 0, 'word': 'Cosmos', 'bitindex': 1, 'bitSentenceAnd': 1, 'wordType': 'D', '_ranking': 0.95, 'lowercaseword': 'cosmos' }, 'matchedString': 'Cosmos', 'category': 'domain', '_ranking': 0.8913821472645002, 'levenmatch': 0.9382969971205265 })
  ).toEqual(true);

  done();
});

it('testWordisFiller', done => {
  expect(Word.isFiller({ category: 'category' })).toEqual(false);
  expect(Word.isFiller({ category: 'wiki' })).toEqual(false);
  expect(Word.isFiller({ category: 'filler' })).toEqual(true);
  expect(Word.isFiller({})).toEqual(true);
  done();
});
