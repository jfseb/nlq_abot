/**
 * @file sentence
 * @module jfseb.fdevstart.sentence
 * @copyright (c) Gerd Forstmann
 *
 * Match a tool record on a sentence,
 *
 * This will unify matching required and optional category words
 * with the requirements of the tool.
 *
 */

// <reference path="../../lib/node-4.d.ts" />

import * as debug from 'debug';

// import * as utils from '../utils/utils';

import * as IMatch from './iferbase';

const debuglog = debug('sentence')

export function findWordByCategory(oSentence, sCategory : string) : { word : IMatch.IWord, index : number} {
  	var res = {} as { word : IMatch.IWord, index : number};
    oSentence.every(function(oWord, iIndex) {
      if(oWord.category === sCategory) {
        res = { word: oWord,
                index : iIndex };
        return false;
      }
      return true;
    })
    return res;
}

export function getDistinctCategoriesInSentence(oSentence : IMatch.ISentence) : string[] {
  var res = [];
  var resm = {};
  oSentence.forEach(function(oWord) {
    if(oWord.category === "category") {
      if(!resm[oWord.matchedString]) {
        res.push(oWord.matchedString);
        resm[oWord.matchedString] = 1;
      }
    }
  });
  return res;
}

export function rankingGeometricMean(oSentence : IMatch.ISentence) : number {
  const length = oSentence.length;
  if(length === 0) {
    return 1.0;
  }
  var prod =  oSentence.reduce(function(prev, oWord) {
    return prev * (oWord._ranking || 1.0);
  },1.0);
  // TODO: find somethign faster ;-)
  return Math.pow(prod, 1/length);
}

export function rankingProduct(oSentence: IMatch.ISentence) : number {
  return rankingGeometricMean(oSentence);
}

export function cmpRankingProduct(a : IMatch.ISentence, b : IMatch.ISentence) {
  return - (rankingProduct(a) - rankingProduct(b));
}

export function cutoffSentenceAtRatio(sentences : IMatch.ISentence[]) {
  if(sentences.length === 0){
    return sentences;
  }
  var bestRank = rankingProduct(sentences[0]);
  for(var i = 1; (i < Math.min(sentences.length, 300)) && ((rankingProduct(sentences[i])/ bestRank) > 0.8); ++ i) {
    // empty
  }
  debuglog("reduce sentences by " + i + "/" + sentences.length);
  return sentences.slice(0,i);
}

/*
export function simplifySentence(res : IMatch.ICategorizedStringRanged[][]) : string[][] {
  return res.map(function (r) {
    return r.map(word => { return word.string + '=>' + word.matchedString + '/' + word.category + (word.span ? '/' + word.span : '') })
  });
}
*/

export function dumpNice(sentence : IMatch.ISentence, fn?: any) : string {
  var result = [];
    sentence.forEach(function(oWord, index) {
      var sWord = `[${index}] : ${(oWord._ranking || 0).toFixed(3)} ${oWord.category} "${oWord.string}" => "${oWord.matchedString}"`
      result.push(sWord + "\n");
    })
    result.push(".\n");
    return result.join("");
}

export function dumpNiceRuled(sentence : IMatch.ISentence, fn?: any) : string {
  var result = [];
    sentence.forEach(function(oWord, index) {
      var sWord = `[${index}] : ${(oWord._ranking || 0).toFixed(3)} ${oWord.category} "${oWord.string}" => "${oWord.matchedString}" `
      result.push(sWord + "\n");
    })
    result.push(".\n");
    return result.join("");
}


export function dumpNiceBitIndexed(sentence : IMatch.ISentence, fn?: any) : string {
  var result = [];
    sentence.forEach(function(word, index) {
      var sWord = `[${index}] : ${(word._ranking || 0).toFixed(3)} "${word.string}" => "${word.matchedString}" `
      + word.category + ((word as any).span? '/' + (word as any).span : '') + ` ${word.rule.wordType}${word.rule.bitindex}`;
      result.push(sWord + "\n");
    })
    result.push(".\n");
    return result.join("");
}


export function dumpNiceArr(sentences : IMatch.ISentence[], fn? : any) : string {
  if(!sentences) {
    return "";
  }
  var res = sentences.reduce(function(prev, oSentence) {
    return prev + dumpNice(oSentence);
  }, "")
  return res;
}

export function simplifyStringsWithBitIndex(sentence : IMatch.ISentence) {
  if(!sentence) {
    return [];
  }
  return sentence.map(word =>  { return word.string + '=>' +  word.matchedString + '/' + word.category + ((word as any).span? '/' + (word as any).span : '') + ` ${word.rule.wordType}${word.rule.bitindex}`})
}
