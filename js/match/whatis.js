"use strict";
/**
 *
 * @module jfseb.fdevstart.analyze
 * @file analyze.ts
 * @copyright (c) 2016 Gerd Forstmann
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIndiscriminateResultTupel = exports.analyzeCategoryMult = exports.analyzeContextString = exports.processString = exports.filterAcceptingOnly = exports.analyzeCategoryMultOnlyAndComma = exports.splitAtCommaAnd = exports.analyzeCategory = exports.dumpNiceTupel = exports.cmpRecords = exports.cmpByResultThenRankingTupel = exports.safeDelta = exports.safeEqual = exports.localeCompareRecord = exports.localeCompareRecordArrays = exports.localeCompareArrays = exports.mockDebug = void 0;
const index_parser_1 = require("../index_parser");
;
;
const debug = require("debug");
var debuglog = debug('whatis');
var debuglogV = debug('whatVis');
var perflog = debug('perf');
;
const index_parser_2 = require("../index_parser");
;
function mockDebug(o) {
    debuglog = o;
    debuglogV = o;
    perflog = o;
}
exports.mockDebug = mockDebug;
//import * as Match from './match';
//import * as Toolmatcher from './toolmatcher';
const index_parser_3 = require("../index_parser");
;
;
const Algol = require("./algol");
/*
export function cmpByResultThenRanking(a: IMatch.IWhatIsAnswer, b: IMatch.IWhatIsAnswer) {
  var cmp = a.result.localeCompare(b.result);
  if (cmp) {
    return cmp;
  }
  return -(a._ranking - b._ranking);
}
*/
function localeCompareArrays(aaresult, bbresult) {
    var cmp = 0;
    var blen = bbresult.length;
    aaresult.every(function (a, index) {
        if (blen <= index) {
            cmp = -1;
            return false;
        }
        cmp = a.localeCompare(bbresult[index]);
        if (cmp) {
            return false;
        }
        return true;
    });
    if (cmp) {
        return cmp;
    }
    if (blen > aaresult.length) {
        cmp = +1;
        return cmp;
    }
    return 0;
}
exports.localeCompareArrays = localeCompareArrays;
function localeCompareRecordArrays(aaresult, bbresult) {
    var cmp = 0;
    var blen = bbresult.length;
    aaresult.every(function (a, index) {
        if (blen <= index) {
            cmp = -1;
            return false;
        }
        cmp = localeCompareRecord(a, bbresult[index]);
        if (cmp) {
            return false;
        }
        return true;
    });
    if (cmp) {
        return cmp;
    }
    if (blen > aaresult.length) {
        cmp = +1;
        return cmp;
    }
    return 0;
}
exports.localeCompareRecordArrays = localeCompareRecordArrays;
function localeCompareRecord(aaresult, bbresult) {
    var cmp = 0;
    var blen = bbresult.length;
    var keys = Object.keys(aaresult).sort();
    keys.every(function (keya, index) {
        var a = aaresult[keya];
        if (blen <= index) {
            cmp = -1;
            return false;
        }
        var b = bbresult[keya];
        var ta = typeof a;
        var tb = typeof b;
        if (ta !== tb) {
            cmp = ta.localeCompare(tb);
            return false;
        }
        if (typeof ta === 'number') {
            cmp = safeDelta(a, b);
        }
        else {
            cmp = a.localeCompare(b);
        }
        if (cmp) {
            return false;
        }
        return true;
    });
    if (cmp) {
        return cmp;
    }
    if (blen > aaresult.length) {
        cmp = +1;
        return cmp;
    }
    return 0;
}
exports.localeCompareRecord = localeCompareRecord;
function safeEqual(a, b) {
    var delta = a - b;
    if (Math.abs(delta) < Algol.RANKING_EPSILON) {
        return true;
    }
    return false;
}
exports.safeEqual = safeEqual;
function safeDelta(a, b) {
    var delta = a - b;
    if (Math.abs(delta) < Algol.RANKING_EPSILON) {
        return 0;
    }
    return delta;
}
exports.safeDelta = safeDelta;
function cmpByResultThenRankingTupel(aa, bb) {
    var cmp = localeCompareRecordArrays(aa.results, bb.results);
    if (cmp) {
        return cmp;
    }
    return 0; // -safeDelta(aa._ranking,bb._ranking);
}
exports.cmpByResultThenRankingTupel = cmpByResultThenRankingTupel;
function cmpRecords(a, b) {
    // are records different?
    var keys = Object.keys(a).concat(Object.keys(b)).sort();
    var res = keys.reduce(function (prev, sKey) {
        if (prev) {
            return prev;
        }
        if (b[sKey] !== a[sKey]) {
            if (!b[sKey]) {
                return -1;
            }
            if (!a[sKey]) {
                return +1;
            }
            return a[sKey].localeCompare(b[sKey]);
        }
        return 0;
    }, 0);
    return res;
}
exports.cmpRecords = cmpRecords;
/*
export function cmpByRanking(a: IMatch.IWhatIsAnswer, b: IMatch.IWhatIsAnswer) : number {
  var cmp = - safeDelta(a._ranking, b._ranking) as number;
  if (cmp) {
    return cmp;
  }
  cmp = a.result.localeCompare(b.result);
  if (cmp) {
    return cmp;
  }

  return cmpRecords(a.record,b.record);
}
*/
/*
export function cmpByRankingTupel(a: IMatch.IWhatIsTupelAnswer, b: IMatch.IWhatIsTupelAnswer) : number {
  var cmp = 0; // - safeDelta(a._ranking, b._ranking);
  if (cmp) {
    return cmp;
  }
  cmp = localeCompareRecordArrays(a.results, b.results);
  if (cmp) {
    return cmp;
  }
  return 0; //cmpRecords(a.record,b.record);
}
*/
function dumpNiceTupel(answer) {
    var result = {
        s: "",
        push: function (s) { this.s = this.s + s; }
    };
    var s = `**Result for categories: ${answer.columns.join(";")} is ${answer.results}
 rank: ${1 /*answer._ranking*/}
`;
    result.push(s);
    answer.results.forEach(function (queryresult, index) {
        answer.columns.forEach(function (sRequires, index) {
            if (sRequires.charAt(0) !== '_') {
                result.push(`record: ${sRequires} -> ${queryresult[sRequires]}`);
            }
            result.push('\n');
        });
    });
    var oSentence = answer.aux.sentence || [];
    oSentence.forEach(function (oWord, index) {
        var sWord = `[${index}] : ${oWord.category} "${oWord.string}" => "${oWord.matchedString}"`;
        result.push(sWord + "\n");
    });
    result.push(".\n");
    return result.s;
}
exports.dumpNiceTupel = dumpNiceTupel;
/*
export function filterDistinctResultAndSortTupel(res: IMatch.IProcessedWhatIsTupelAnswers): IMatch.IProcessedWhatIsTupelAnswers {
  var result = res.tupelanswers.filter(function (iRes, index) {
    if (debuglog.enabled) {
      debuglog(' retain tupel ' + index + ' ' + JSON.stringify(iRes));
    }
    if (_.isEqual(iRes.result, res.tupelanswers[index - 1] && res.tupelanswers[index - 1].result)) {
      debuglog('skip');
      return false;
    }
    return true;
  });
  result.sort(cmpByRankingTupel);
  return (Object as any).assign(res, { tupelanswers: result });
}
*/
/*
export function filterOnlyTopRanked(results: Array<IMatch.IWhatIsAnswer>): Array<IMatch.IWhatIsAnswer> {
  var res = results.filter(function (result) {
    if (safeEqual(result._ranking, results[0]._ranking)) {
      return true;
    }
    if (result._ranking >= results[0]._ranking) {
      throw new Error("List to filter must be ordered");
    }
    return false;
  });
  return res;
}

export function filterOnlyTopRankedTupel(results: Array<IMatch.IWhatIsTupelAnswer>): Array<IMatch.IWhatIsTupelAnswer> {
  var res = results.filter(function (result) {
    if ( safeEqual(result._ranking, results[0]._ranking)) {
      return true;
    }
    if (result._ranking >= results[0]._ranking) {
      throw new Error("List to filter must be ordered");
    }
    return false;
  });
  return res;
}
*/
/**
 * A ranking which is purely based on the numbers of matched entities,
 * disregarding exactness of match
 */
/*
export function calcRankingSimple(matched: number,
  mismatched: number, nouse: number,
  relevantCount: number): number {
  // 2 : 0
  // 1 : 0
  var factor = matched * Math.pow(1.5, matched) * Math.pow(1.5, matched);
  var factor2 = Math.pow(0.4, mismatched);
  var factor3 = Math.pow(0.4, nouse);
  return Math.pow(factor2 * factor * factor3, 1 / (mismatched + matched + nouse));
}
*/
/*
export function calcRankingHavingCategory(matched: { [key: string]: IMatch.IWord },
  hasCategory: { [key: string]: number },
  mismatched: { [key: string]: IMatch.IWord }, relevantCount: number, hasDomain : number): number {


  var lenMatched = Object.keys(matched).length;
  var factor = Match.calcRankingProduct(matched);
  factor *= Math.pow(1.5, lenMatched);
  if(hasDomain) {
    factor *= 1.5;
  }
  var lenHasCategory = Object.keys(hasCategory).length;
  var factorH = Math.pow(1.1, lenHasCategory);

  var lenMisMatched = Object.keys(mismatched).length;
  var factor2 = Match.calcRankingProduct(mismatched);
  factor2 *= Math.pow(0.4, lenMisMatched);
  var divisor =  (lenMisMatched + lenHasCategory + lenMatched);
  divisor = divisor ? divisor : 1;
  return Math.pow(factor2 * factorH * factor, 1 / (divisor));
}
*/
/**
 * list all top level rankings
 */
/*
export function matchRecordsHavingContext(
  pSentences: IMatch.IProcessedSentences, category: string, records: Array<IMatch.IRecord>,
  categorySet: { [key: string]: boolean })
  : IMatch.IProcessedWhatIsAnswers {

  //debuglog(JSON.stringify(records, undefined, 2));
  var relevantRecords = records.filter(function (record: IMatch.IRecord) {
    return (record[category] !== undefined) && (record[category] !== null);
  });
  var res = [];
  debuglog("MatchRecordsHavingContext : relevant records nr:" + relevantRecords.length);
  debuglog(debuglog.enabled ? ("sentences are : " + JSON.stringify(pSentences, undefined, 2)) : "-");
  debuglog(debuglog.enabled ? ("category " + category + " and categoryset is: " + JSON.stringify(categorySet, undefined, 2)) : "-");
  if (process.env.ABOT_FAST && categorySet) {
    // we are only interested in categories present in records for domains which contain the category
    // var categoryset = Model.calculateRelevantRecordCategories(theModel,category);
    //knowing the target
    perflog("got categoryset with " + Object.keys(categorySet).length);
    var fl = 0;
    var lf = 0;
    var aSimplifiedSentences = pSentences.sentences.map(function (oSentence) {
      var fWords = oSentence.filter(function (oWord) {
        return !Word.Word.isFiller(oWord);
      });
      var rWords = oSentence.filter(function (oWord) {
        return !!categorySet[oWord.category] || Word.Word.isCategory(oWord);
      });
      fl = fl + oSentence.length;
      lf = lf + rWords.length;
      return {
        oSentence: oSentence,
        cntRelevantWords: rWords.length, // not a filler  // to be compatible it would be fWords
        rWords: rWords
      };
    });
    Object.freeze(aSimplifiedSentences);
    debuglog("post simplify (r=" + relevantRecords.length + " s=" + pSentences.sentences.length + " fl " + fl + "->" + lf + ")");
    perflog("post simplify (r=" + relevantRecords.length + " s=" + pSentences.sentences.length + " fl " + fl + "->" + lf + ")");
    relevantRecords.forEach(function (record) {
      // count matches in record which are *not* the category
      aSimplifiedSentences.forEach(function (aSentence) {
        var hasCategory = {};
        var mismatched = {};
        var matched = {};
        var cntRelevantWords = aSentence.cntRelevantWords;
        aSentence.rWords.forEach(function (oWord) {
          if (oWord.category && (record[oWord.category] !== undefined)) {
            if (oWord.matchedString === record[oWord.category]) {
              matched[oWord.category] = oWord;
            }
            else {
              mismatched[oWord.category] = oWord;
            }
          }
          else if (Word.Word.isCategory(oWord) && record[oWord.matchedString]) {
            hasCategory[oWord.matchedString] = 1;
          }
        }
        );
        if ((Object.keys(matched).length + Object.keys(hasCategory).length) > Object.keys(mismatched).length) {
          res.push({
            sentence: aSentence.oSentence,
            record: record,
            category: category,
            result: record[category],
            _ranking: calcRankingHavingCategory(matched, hasCategory, mismatched, cntRelevantWords)
          });
        }
      })
    });
    debuglog("here in weird");
  } else {
    relevantRecords.forEach(function (record) {
      // count matches in record which are *not* the category
      pSentences.sentences.forEach(function (aSentence) {
        var hasCategory = {};
        var mismatched = {};
        var matched = {};
        var cntRelevantWords = 0;
        aSentence.forEach(function (oWord) {
          if (!Word.Word.isFiller(oWord)) {
            cntRelevantWords = cntRelevantWords + 1;
            if (oWord.category && (record[oWord.category] !== undefined)) {
              if (oWord.matchedString === record[oWord.category]) {
                matched[oWord.category] = oWord;
              }
              else {
                mismatched[oWord.category] = oWord;
              }
            }
            else if (Word.Word.isCategory(oWord) && record[oWord.matchedString]) {
              hasCategory[oWord.matchedString] = 1;
            }
          }
        });
        if ((Object.keys(matched).length + Object.keys(hasCategory).length) > Object.keys(mismatched).length) {
          res.push({
            sentence: aSentence,
            record: record,
            category: category,
            result: record[category],
            _ranking: calcRankingHavingCategory(matched, hasCategory, mismatched, cntRelevantWords)
          });
        }
      })
    });
  }
  res.sort(cmpByResultThenRanking);
  debuglog(" after sort" + res.length);
  var result = Object.assign({}, pSentences, { answers: res });
  return filterRetainTopRankedResult(result);
}
*/
/*
export function matchRecords(aSentences: IMatch.IProcessedSentences, category: string, records: Array<IMatch.IRecord>)
  : IMatch.IProcessedWhatIsAnswers {
  // if (debuglog.enabled) {
  //   debuglog(JSON.stringify(records, undefined, 2));
  // }
  var relevantRecords = records.filter(function (record: IMatch.IRecord) {
    return (record[category] !== undefined) && (record[category] !== null);
  });
  var res = [];
  debuglog("relevant records nr:" + relevantRecords.length);
  relevantRecords.forEach(function (record) {
    aSentences.sentences.forEach(function (aSentence) {
      // count matches in record which are *not* the category
      var mismatched = {}
      var matched = {};
      var cntRelevantWords = 0;
      aSentence.forEach(function (oWord) {
        if (!Word.Word.isFiller(oWord)) {
          cntRelevantWords = cntRelevantWords + 1;
          if (oWord.category && (record[oWord.category] !== undefined)) {
            if (oWord.matchedString === record[oWord.category]) {
              matched[oWord.category] = oWord;
            } else {
              mismatched[oWord.category] = oWord;
            }
          }
        }
      });
      if (Object.keys(matched).length > Object.keys(mismatched).length) {
        res.push({
          sentence: aSentence,
          record: record,
          category: category,
          result: record[category],
          _ranking: calcRanking(matched, mismatched, cntRelevantWords)
        });
      }
    })
  });
  res.sort(cmpByResultThenRanking);
  var result = Object.assign({}, aSentences, { answers: res });
  return filterRetainTopRankedResult(result);
}
*/
/*
function makeSimplifiedSentencesCategorySet(aSentences: IMatch.IProcessedSentences,
  categorySet: { [key: string]: boolean }, track: { fl: number, lf: number }
): {
  domains: string[],
  oSentence: IMatch.ISentence,
  cntRelevantWords: number,
  rWords: IMatch.IWord[]
}[] {
  return aSentences.sentences.map(function (oSentence) {
    var aDomains = [] as string[];
    var rWords = oSentence.filter(function (oWord) {
      if (oWord.category === "domain") {
        aDomains.push(oWord.matchedString);
        return false;
      }
      if (oWord.category === "meta") {
        // e.g. domain XXX
        return false;
      }
      return !!categorySet[oWord.category];
    });
    track.fl += oSentence.length;
    track.lf += rWords.length;
    return {
      domains: aDomains,
      oSentence: oSentence,
      cntRelevantWords: rWords.length,
      rWords: rWords
    };
  });
}
*/
/*
function makeSimplifiedSentencesCategorySet2(aSentences: IMatch.IProcessedSentences,
  categorySet: { [key: string]: boolean }, track: { fl: number, lf: number }
): {
  domains: string[],
  oSentence: IMatch.ISentence,
  cntRelevantWords: number,
  rWords: IMatch.IWord[]
}[] {
  return aSentences.sentences.map(function (oSentence) {
    var aDomains = [] as string[];
    var rWords = oSentence.filter(function (oWord) {
      if (oWord.category === "domain") {
        aDomains.push(oWord.matchedString);
        return false;
      }
      if (oWord.category === "meta") {
        // e.g. domain XXX
        return false;
      }
      if(oWord.category === "category") {
        if(categorySet[oWord.matchedString]) {
          return true;
        }
      }
      return !!categorySet[oWord.category];
    });
    track.fl += oSentence.length;
    track.lf += rWords.length;
    return {
      domains: aDomains,
      oSentence: oSentence,
      cntRelevantWords: rWords.length,
      rWords: rWords
    };
  });
}
*/
/*
function makeSimplifiedSentences(aSentences : IMatch.IProcessedSentences,  track: { fl: number, lf: number }): {
  domains: string[],
  oSentence: IMatch.ISentence,
  cntRelevantWords: number,
  rWords: IMatch.IWord[]
}[] {
  return aSentences.sentences.map(function (oSentence) {
    var domains = [] as string[];
    var rWords = oSentence.filter(function (oWord) {
      if (oWord.category === "domain") {
        domains.push(oWord.matchedString);
        return false;
      }
      if (oWord.category === "meta") {
        // e.g. domain XXX
        return false;
      }
      return !Word.Word.isFiller(oWord);
    });
    track.fl += oSentence.length;
    track.lf += rWords.length;
    return {
      oSentence: oSentence,
      domains: domains,
      cntRelevantWords: rWords.length,
      rWords: rWords
    };
  });
}
*/
function classifyWordWithTargetCategory(word, targetcategory, rules, wholesentence) {
    //console.log("classify " + word + " "  + targetcategory);
    var cats = index_parser_1.InputFilter.categorizeAWord(word, rules, wholesentence, {});
    // TODO qualify
    cats = cats.filter(function (cat) {
        return cat.category === targetcategory;
    });
    //debuglog(JSON.stringify(cats));
    if (cats.length) {
        return cats[0].matchedString;
    }
}
function analyzeCategory(categoryword, rules, wholesentence) {
    return classifyWordWithTargetCategory(categoryword, 'category', rules, wholesentence);
}
exports.analyzeCategory = analyzeCategory;
function splitAtCommaAnd(str) {
    var r = str.split(/(\band\b)|[,]/);
    r = r.filter(function (o, index) {
        if (index % 2 > 0) {
            return false;
        }
        return true;
    });
    var rtrimmed = r.map(function (o) {
        return new String(o).trim();
    });
    return rtrimmed;
}
exports.splitAtCommaAnd = splitAtCommaAnd;
/**
 * A simple implementation, splitting at and and ,
 */
function analyzeCategoryMultOnlyAndComma(categorylist, rules, wholesentence) {
    var rtrimmed = splitAtCommaAnd(categorylist);
    var rcat = rtrimmed.map(function (o) {
        return analyzeCategory(o, rules, wholesentence);
    });
    if (rcat.indexOf(undefined) >= 0) {
        throw new Error('"' + rtrimmed[rcat.indexOf(undefined)] + '" is not a category!');
    }
    return rcat;
}
exports.analyzeCategoryMultOnlyAndComma = analyzeCategoryMultOnlyAndComma;
function filterAcceptingOnly(res, categories) {
    return res.filter(function (aSentence, iIndex) {
        return aSentence.every(function (oWord) {
            return categories.indexOf(oWord.category) >= 0;
        });
    });
}
exports.filterAcceptingOnly = filterAcceptingOnly;
function processString(query, rules) {
    //  if (!process.env.ABOT_OLDMATCH) {
    return index_parser_2.ErBase.processString(query, rules, rules.wordCache, {} /*TODO OPERATORS} */);
    //  }
    /*
      var matched = InputFilter.analyzeString(query, rules, sWords);
      if (debuglog.enabled) {
        debuglog("After matched " + JSON.stringify(matched));
      }
      var aSentences = InputFilter.expandMatchArr(matched);
      if (debuglog.enabled) {
        debuglog("after expand" + aSentences.map(function (oSentence) {
          return Sentence.rankingProduct(oSentence) + ":" + JSON.stringify(oSentence);
        }).join("\n"));
      }
      var aSentencesReinforced = InputFilter.reinForce(aSentences);
      if (debuglog.enabled) {
        debuglog("after reinforce" + aSentencesReinforced.map(function (oSentence) {
          return Sentence.rankingProduct(oSentence) + ":" + JSON.stringify(oSentence);
        }).join("\n"));
      }
      return {
        errors: [],
        sentences: aSentencesReinforced
      } as IMatch.IProcessedSentences;
    */
}
exports.processString = processString;
function analyzeContextString(contextQueryString, rules) {
    var aSentencesReinforced = processString(contextQueryString, rules);
    // we limit analysis to n sentences
    aSentencesReinforced.sentences = aSentencesReinforced.sentences.slice(0, Algol.Cutoff_Sentences);
    if (debuglog.enabled) {
        debuglog("after reinforce and cutoff" + aSentencesReinforced.sentences.length + "\n" + aSentencesReinforced.sentences.map(function (oSentence) {
            return index_parser_3.Sentence.rankingProduct(oSentence) + ":" + JSON.stringify(oSentence);
        }).join("\n"));
    }
    return aSentencesReinforced;
}
exports.analyzeContextString = analyzeContextString;
/*
export function cmpByNrCategoriesAndSameDomain(a: IMatch.ISentence, b: IMatch.ISentence): number {
  //console.log("compare a" + a + " cntb " + b);
  var cnta = Sentence.getDistinctCategoriesInSentence(a).length;
  var cntb = Sentence.getDistinctCategoriesInSentence(b).length;
  / *
    var cnta = a.reduce(function(prev, oWord) {
      return prev + ((oWord.category === "category")? 1 : 0);
    },0);
    var cntb = b.reduce(function(prev, oWord) {
      return prev + ((oWord.category === "category")? 1 : 0);
    },0);
   // console.log("cnt a" + cnta + " cntb " + cntb);
   * /
  return cntb - cnta;
}*/
function analyzeCategoryMult(categorylist, rules, wholesentence, gWords) {
    var res = analyzeContextString(categorylist, rules);
    //  debuglog("resulting category sentences", JSON.stringify(res));
    var res2 = filterAcceptingOnly(res.sentences, ["category", "filler"]);
    //  console.log("here res2" + JSON.stringify(res2) );
    //  console.log("here undefined ! + " + res2.filter(o => !o).length);
    res2.sort(index_parser_3.Sentence.cmpRankingProduct);
    debuglog("resulting category sentences: \n", debuglog.enabled ? (index_parser_3.Sentence.dumpNiceArr(res2.slice(0, 3), index_parser_3.Sentence.rankingProduct)) : '-');
    // TODO:   res2 = filterAcceptingOnlySameDomain(res2);
    //debuglog("resulting category sentences", JSON.stringify(res2, undefined, 2));
    // expect only categories
    // we could rank now by common domains , but for now we only take the first one
    if (!res2.length) {
        return undefined;
    }
    //res.sort(cmpByNrCategoriesAndSameDomain);
    var rescat = index_parser_3.Sentence.getDistinctCategoriesInSentence(res2[0]);
    return rescat;
    // "" return res[0].filter()
    // return classifyWordWithTargetCategory(categorylist, 'category', rules, wholesentence);
}
exports.analyzeCategoryMult = analyzeCategoryMult;
/*
export function analyzeOperator(opword: string, rules: IMatch.SplitRules, wholesentence: string): string {
  return classifyWordWithTargetCategory(opword, 'operator', rules, wholesentence);
}
*/
// const result = WhatIs.resolveCategory(cat, a1.entity,
//   theModel.mRules, theModel.tools, theModel.records);
function isIndiscriminateResultTupel(results) {
    var cnt = results.reduce(function (prev, result) {
        if (safeEqual(1, 1)) { // result._ranking,results[0]._ranking)) {
            return prev + 1;
        }
    }, 0);
    if (cnt > 1) {
        // search for a discriminating category value
        var discriminating = []; /*Object.keys(results[0].record).reduce(function (prev, category) {
          if ((category.charAt(0) !== '_' && results[0].categories.indexOf(category) < 0)
            && (results[0].record[category] !== results[1].record[category])) {
            prev.push(category);
          }
          return prev;
        }, []); */
        if (discriminating.length) {
            return "Many comparable results, perhaps you want to specify a discriminating " + discriminating.join(',') + ' or use "list all ..."';
        }
        return 'Your question does not have a specific answer';
    }
    return undefined;
}
exports.isIndiscriminateResultTupel = isIndiscriminateResultTupel;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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LENBQUMsQ0FBQzs7Ozs7O2tCQU1mO1FBQ1YsSUFBSSxjQUFjLENBQUMsTUFBTSxFQUFFO1lBQ3pCLE9BQU8sd0VBQXdFLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyx3QkFBd0IsQ0FBQztTQUN2STtRQUNELE9BQU8sK0NBQStDLENBQUM7S0FDeEQ7SUFDRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBckJELGtFQXFCQyIsImZpbGUiOiJtYXRjaC93aGF0aXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBAbW9kdWxlIGpmc2ViLmZkZXZzdGFydC5hbmFseXplXG4gKiBAZmlsZSBhbmFseXplLnRzXG4gKiBAY29weXJpZ2h0IChjKSAyMDE2IEdlcmQgRm9yc3RtYW5uXG4gKi9cblxuXG5pbXBvcnQgeyBJbnB1dEZpbHRlciBhcyBJbnB1dEZpbHRlcn0gZnJvbSAnLi4vaW5kZXhfcGFyc2VyJzs7XG5pbXBvcnQgeyBNb25nb1EgYXMgTW9uZ29RIH0gZnJvbSAnLi4vaW5kZXhfcGFyc2VyJzs7XG5pbXBvcnQgKiBhcyBMaXN0QWxsIGZyb20gJy4vbGlzdGFsbCc7XG5cblxuaW1wb3J0ICogYXMgZGVidWcgZnJvbSAnZGVidWcnO1xuXG52YXIgZGVidWdsb2cgPSBkZWJ1Zygnd2hhdGlzJyk7XG52YXIgZGVidWdsb2dWID0gZGVidWcoJ3doYXRWaXMnKTtcbnZhciBwZXJmbG9nID0gZGVidWcoJ3BlcmYnKTtcblxuXG5pbXBvcnQgeyBFckVycm9yIGFzIEVyRXJyb3J9IGZyb20gJy4uL2luZGV4X3BhcnNlcic7O1xuXG5pbXBvcnQgeyBFckJhc2UgYXMgRXJCYXNlfSBmcm9tICcuLi9pbmRleF9wYXJzZXInOztcblxuXG5leHBvcnQgZnVuY3Rpb24gbW9ja0RlYnVnKG8pIHtcbiAgZGVidWdsb2cgPSBvO1xuICBkZWJ1Z2xvZ1YgPSBvO1xuICBwZXJmbG9nID0gbztcbn1cblxuXG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5cbmltcG9ydCAqIGFzIElNYXRjaCBmcm9tICcuL2lmbWF0Y2gnO1xuXG4vL2ltcG9ydCAqIGFzIE1hdGNoIGZyb20gJy4vbWF0Y2gnO1xuLy9pbXBvcnQgKiBhcyBUb29sbWF0Y2hlciBmcm9tICcuL3Rvb2xtYXRjaGVyJztcblxuaW1wb3J0IHsgU2VudGVuY2UgYXMgU2VudGVuY2V9IGZyb20gJy4uL2luZGV4X3BhcnNlcic7O1xuXG5pbXBvcnQgeyBXb3JkIGFzIFdvcmR9ICBmcm9tICcuLi9pbmRleF9wYXJzZXInOztcblxuaW1wb3J0ICogYXMgQWxnb2wgZnJvbSAnLi9hbGdvbCc7XG5cbmltcG9ydCB7TW9kZWwgYXMgTW9kZWx9ICBmcm9tICcuLi9tb2RlbC9pbmRleF9tb2RlbCc7XG5cblxuXG4vKlxuZXhwb3J0IGZ1bmN0aW9uIGNtcEJ5UmVzdWx0VGhlblJhbmtpbmcoYTogSU1hdGNoLklXaGF0SXNBbnN3ZXIsIGI6IElNYXRjaC5JV2hhdElzQW5zd2VyKSB7XG4gIHZhciBjbXAgPSBhLnJlc3VsdC5sb2NhbGVDb21wYXJlKGIucmVzdWx0KTtcbiAgaWYgKGNtcCkge1xuICAgIHJldHVybiBjbXA7XG4gIH1cbiAgcmV0dXJuIC0oYS5fcmFua2luZyAtIGIuX3JhbmtpbmcpO1xufVxuKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGxvY2FsZUNvbXBhcmVBcnJheXMoYWFyZXN1bHQ6IHN0cmluZ1tdLCBiYnJlc3VsdDogc3RyaW5nW10pOiBudW1iZXIge1xuICB2YXIgY21wID0gMDtcbiAgdmFyIGJsZW4gPSBiYnJlc3VsdC5sZW5ndGg7XG4gIGFhcmVzdWx0LmV2ZXJ5KGZ1bmN0aW9uIChhLCBpbmRleCkge1xuICAgIGlmIChibGVuIDw9IGluZGV4KSB7XG4gICAgICBjbXAgPSAtMTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY21wID0gYS5sb2NhbGVDb21wYXJlKGJicmVzdWx0W2luZGV4XSk7XG4gICAgaWYgKGNtcCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG4gIGlmIChjbXApIHtcbiAgICByZXR1cm4gY21wO1xuICB9XG4gIGlmIChibGVuID4gYWFyZXN1bHQubGVuZ3RoKSB7XG4gICAgY21wID0gKzE7XG4gICAgcmV0dXJuIGNtcDtcbiAgfVxuICByZXR1cm4gMDtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gbG9jYWxlQ29tcGFyZVJlY29yZEFycmF5cyhhYXJlc3VsdDogTW9uZ29RLklSZXN1bHRSZWNvcmRbXSwgYmJyZXN1bHQ6IE1vbmdvUS5JUmVzdWx0UmVjb3JkW10pOiAgbnVtYmVyIHtcbiAgdmFyIGNtcCA9IDA7XG4gIHZhciBibGVuID0gYmJyZXN1bHQubGVuZ3RoO1xuICBhYXJlc3VsdC5ldmVyeShmdW5jdGlvbiAoYSwgaW5kZXgpIHtcbiAgICBpZiAoYmxlbiA8PSBpbmRleCkge1xuICAgICAgY21wID0gLTE7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNtcCA9IGxvY2FsZUNvbXBhcmVSZWNvcmQoYSxiYnJlc3VsdFtpbmRleF0pO1xuICAgIGlmIChjbXApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH0pO1xuICBpZiAoY21wKSB7XG4gICAgcmV0dXJuIGNtcDtcbiAgfVxuICBpZiAoYmxlbiA+IGFhcmVzdWx0Lmxlbmd0aCkge1xuICAgIGNtcCA9ICsxO1xuICAgIHJldHVybiBjbXA7XG4gIH1cbiAgcmV0dXJuIDA7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGxvY2FsZUNvbXBhcmVSZWNvcmQoYWFyZXN1bHQ6IE1vbmdvUS5JUmVzdWx0UmVjb3JkLCBiYnJlc3VsdDogTW9uZ29RLklSZXN1bHRSZWNvcmQpOiBudW1iZXIge1xuICB2YXIgY21wID0gMDtcbiAgdmFyIGJsZW4gPSBiYnJlc3VsdC5sZW5ndGg7XG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWFyZXN1bHQpLnNvcnQoKTtcbiAga2V5cy5ldmVyeShmdW5jdGlvbiAoa2V5YSwgaW5kZXgpICA6IGJvb2xlYW57XG4gICB2YXIgYSA9IGFhcmVzdWx0W2tleWFdO1xuICAgIGlmIChibGVuIDw9IGluZGV4KSB7XG4gICAgICBjbXAgPSAtMTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGIgPSBiYnJlc3VsdFtrZXlhXTtcbiAgICB2YXIgdGEgPSB0eXBlb2YgYTtcbiAgICB2YXIgdGIgPSB0eXBlb2YgYjtcbiAgICBpZih0YSAhPT0gdGIgKSB7XG4gICAgICBjbXAgPSB0YS5sb2NhbGVDb21wYXJlKHRiKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYodHlwZW9mIHRhID09PSAnbnVtYmVyJykge1xuICAgICAgY21wID0gc2FmZURlbHRhKGEgYXMgbnVtYmVyLGIgYXMgbnVtYmVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY21wID0gKGEgYXMgc3RyaW5nKS5sb2NhbGVDb21wYXJlKCAoYiBhcyBzdHJpbmcpKTtcbiAgICB9XG4gICAgaWYgKGNtcCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG4gIGlmIChjbXApIHtcbiAgICByZXR1cm4gY21wO1xuICB9XG4gIGlmIChibGVuID4gYWFyZXN1bHQubGVuZ3RoKSB7XG4gICAgY21wID0gKzE7XG4gICAgcmV0dXJuIGNtcDtcbiAgfVxuICByZXR1cm4gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhZmVFcXVhbChhIDogbnVtYmVyLCBiIDogbnVtYmVyKSA6IGJvb2xlYW4ge1xuICB2YXIgZGVsdGEgPSBhIC0gYiA7XG4gIGlmKE1hdGguYWJzKGRlbHRhKSA8IEFsZ29sLlJBTktJTkdfRVBTSUxPTikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhZmVEZWx0YShhIDogbnVtYmVyLCBiIDogbnVtYmVyKSA6IG51bWJlciB7XG4gIHZhciBkZWx0YSA9IGEgLSBiIDtcbiAgaWYoTWF0aC5hYnMoZGVsdGEpIDwgQWxnb2wuUkFOS0lOR19FUFNJTE9OKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cbiAgcmV0dXJuIGRlbHRhO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY21wQnlSZXN1bHRUaGVuUmFua2luZ1R1cGVsKGFhOiBJTWF0Y2guSVdoYXRJc1R1cGVsQW5zd2VyLCBiYjogSU1hdGNoLklXaGF0SXNUdXBlbEFuc3dlcikge1xuICB2YXIgY21wID0gbG9jYWxlQ29tcGFyZVJlY29yZEFycmF5cyhhYS5yZXN1bHRzLCBiYi5yZXN1bHRzKTtcbiAgaWYgKGNtcCkge1xuICAgIHJldHVybiBjbXA7XG4gIH1cbiAgcmV0dXJuIDA7IC8vIC1zYWZlRGVsdGEoYWEuX3JhbmtpbmcsYmIuX3JhbmtpbmcpO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBjbXBSZWNvcmRzKGE6IElNYXRjaC5JUmVjb3JkLCBiOiBJTWF0Y2guSVJlY29yZCkgOiBudW1iZXIge1xuICAvLyBhcmUgcmVjb3JkcyBkaWZmZXJlbnQ/XG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYSkuY29uY2F0KE9iamVjdC5rZXlzKGIpKS5zb3J0KCk7XG4gIHZhciByZXMgPSBrZXlzLnJlZHVjZShmdW5jdGlvbiAocHJldiwgc0tleSkge1xuICAgIGlmIChwcmV2KSB7XG4gICAgICByZXR1cm4gcHJldjtcbiAgICB9XG4gICAgaWYgKGJbc0tleV0gIT09IGFbc0tleV0pIHtcbiAgICAgIGlmICghYltzS2V5XSkge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICBpZiAoIWFbc0tleV0pIHtcbiAgICAgICAgcmV0dXJuICsxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFbc0tleV0ubG9jYWxlQ29tcGFyZShiW3NLZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG4gIH0sIDApO1xuICByZXR1cm4gcmVzO1xufVxuXG4vKlxuZXhwb3J0IGZ1bmN0aW9uIGNtcEJ5UmFua2luZyhhOiBJTWF0Y2guSVdoYXRJc0Fuc3dlciwgYjogSU1hdGNoLklXaGF0SXNBbnN3ZXIpIDogbnVtYmVyIHtcbiAgdmFyIGNtcCA9IC0gc2FmZURlbHRhKGEuX3JhbmtpbmcsIGIuX3JhbmtpbmcpIGFzIG51bWJlcjtcbiAgaWYgKGNtcCkge1xuICAgIHJldHVybiBjbXA7XG4gIH1cbiAgY21wID0gYS5yZXN1bHQubG9jYWxlQ29tcGFyZShiLnJlc3VsdCk7XG4gIGlmIChjbXApIHtcbiAgICByZXR1cm4gY21wO1xuICB9XG5cbiAgcmV0dXJuIGNtcFJlY29yZHMoYS5yZWNvcmQsYi5yZWNvcmQpO1xufVxuKi9cblxuLypcbmV4cG9ydCBmdW5jdGlvbiBjbXBCeVJhbmtpbmdUdXBlbChhOiBJTWF0Y2guSVdoYXRJc1R1cGVsQW5zd2VyLCBiOiBJTWF0Y2guSVdoYXRJc1R1cGVsQW5zd2VyKSA6IG51bWJlciB7XG4gIHZhciBjbXAgPSAwOyAvLyAtIHNhZmVEZWx0YShhLl9yYW5raW5nLCBiLl9yYW5raW5nKTtcbiAgaWYgKGNtcCkge1xuICAgIHJldHVybiBjbXA7XG4gIH1cbiAgY21wID0gbG9jYWxlQ29tcGFyZVJlY29yZEFycmF5cyhhLnJlc3VsdHMsIGIucmVzdWx0cyk7XG4gIGlmIChjbXApIHtcbiAgICByZXR1cm4gY21wO1xuICB9XG4gIHJldHVybiAwOyAvL2NtcFJlY29yZHMoYS5yZWNvcmQsYi5yZWNvcmQpO1xufVxuKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGR1bXBOaWNlVHVwZWwoYW5zd2VyOiBJTWF0Y2guSVdoYXRJc1R1cGVsQW5zd2VyKSB7XG4gIHZhciByZXN1bHQgPSB7XG4gICAgczogXCJcIixcbiAgICBwdXNoOiBmdW5jdGlvbiAocykgeyB0aGlzLnMgPSB0aGlzLnMgKyBzOyB9XG4gIH07XG4gIHZhciBzID1cbiAgICBgKipSZXN1bHQgZm9yIGNhdGVnb3JpZXM6ICR7YW5zd2VyLmNvbHVtbnMuam9pbihcIjtcIil9IGlzICR7YW5zd2VyLnJlc3VsdHN9XG4gcmFuazogJHsxIC8qYW5zd2VyLl9yYW5raW5nKi99XG5gO1xuICByZXN1bHQucHVzaChzKTtcbiAgYW5zd2VyLnJlc3VsdHMuZm9yRWFjaChmdW5jdGlvbiAocXVlcnlyZXN1bHQsaW5kZXgpIHtcbiAgYW5zd2VyLmNvbHVtbnMuZm9yRWFjaChmdW5jdGlvbiAoc1JlcXVpcmVzLCBpbmRleCkge1xuICAgIGlmIChzUmVxdWlyZXMuY2hhckF0KDApICE9PSAnXycpIHtcbiAgICAgIHJlc3VsdC5wdXNoKGByZWNvcmQ6ICR7c1JlcXVpcmVzfSAtPiAke3F1ZXJ5cmVzdWx0W3NSZXF1aXJlc119YCk7XG4gICAgfVxuICAgIHJlc3VsdC5wdXNoKCdcXG4nKTtcbiAgfSk7XG59KTtcblxuICB2YXIgb1NlbnRlbmNlID0gYW5zd2VyLmF1eC5zZW50ZW5jZSB8fCBbXTtcbiAgb1NlbnRlbmNlLmZvckVhY2goZnVuY3Rpb24gKG9Xb3JkLCBpbmRleCkge1xuICAgIHZhciBzV29yZCA9IGBbJHtpbmRleH1dIDogJHtvV29yZC5jYXRlZ29yeX0gXCIke29Xb3JkLnN0cmluZ31cIiA9PiBcIiR7b1dvcmQubWF0Y2hlZFN0cmluZ31cImBcbiAgICByZXN1bHQucHVzaChzV29yZCArIFwiXFxuXCIpO1xuICB9KVxuICByZXN1bHQucHVzaChcIi5cXG5cIik7XG4gIHJldHVybiByZXN1bHQucztcbn1cblxuLypcbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJEaXN0aW5jdFJlc3VsdEFuZFNvcnRUdXBlbChyZXM6IElNYXRjaC5JUHJvY2Vzc2VkV2hhdElzVHVwZWxBbnN3ZXJzKTogSU1hdGNoLklQcm9jZXNzZWRXaGF0SXNUdXBlbEFuc3dlcnMge1xuICB2YXIgcmVzdWx0ID0gcmVzLnR1cGVsYW5zd2Vycy5maWx0ZXIoZnVuY3Rpb24gKGlSZXMsIGluZGV4KSB7XG4gICAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcbiAgICAgIGRlYnVnbG9nKCcgcmV0YWluIHR1cGVsICcgKyBpbmRleCArICcgJyArIEpTT04uc3RyaW5naWZ5KGlSZXMpKTtcbiAgICB9XG4gICAgaWYgKF8uaXNFcXVhbChpUmVzLnJlc3VsdCwgcmVzLnR1cGVsYW5zd2Vyc1tpbmRleCAtIDFdICYmIHJlcy50dXBlbGFuc3dlcnNbaW5kZXggLSAxXS5yZXN1bHQpKSB7XG4gICAgICBkZWJ1Z2xvZygnc2tpcCcpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG4gIHJlc3VsdC5zb3J0KGNtcEJ5UmFua2luZ1R1cGVsKTtcbiAgcmV0dXJuIChPYmplY3QgYXMgYW55KS5hc3NpZ24ocmVzLCB7IHR1cGVsYW5zd2VyczogcmVzdWx0IH0pO1xufVxuKi9cblxuLypcbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJPbmx5VG9wUmFua2VkKHJlc3VsdHM6IEFycmF5PElNYXRjaC5JV2hhdElzQW5zd2VyPik6IEFycmF5PElNYXRjaC5JV2hhdElzQW5zd2VyPiB7XG4gIHZhciByZXMgPSByZXN1bHRzLmZpbHRlcihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgaWYgKHNhZmVFcXVhbChyZXN1bHQuX3JhbmtpbmcsIHJlc3VsdHNbMF0uX3JhbmtpbmcpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHJlc3VsdC5fcmFua2luZyA+PSByZXN1bHRzWzBdLl9yYW5raW5nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJMaXN0IHRvIGZpbHRlciBtdXN0IGJlIG9yZGVyZWRcIik7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSk7XG4gIHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJPbmx5VG9wUmFua2VkVHVwZWwocmVzdWx0czogQXJyYXk8SU1hdGNoLklXaGF0SXNUdXBlbEFuc3dlcj4pOiBBcnJheTxJTWF0Y2guSVdoYXRJc1R1cGVsQW5zd2VyPiB7XG4gIHZhciByZXMgPSByZXN1bHRzLmZpbHRlcihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgaWYgKCBzYWZlRXF1YWwocmVzdWx0Ll9yYW5raW5nLCByZXN1bHRzWzBdLl9yYW5raW5nKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChyZXN1bHQuX3JhbmtpbmcgPj0gcmVzdWx0c1swXS5fcmFua2luZykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTGlzdCB0byBmaWx0ZXIgbXVzdCBiZSBvcmRlcmVkXCIpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pO1xuICByZXR1cm4gcmVzO1xufVxuKi9cblxuLyoqXG4gKiBBIHJhbmtpbmcgd2hpY2ggaXMgcHVyZWx5IGJhc2VkIG9uIHRoZSBudW1iZXJzIG9mIG1hdGNoZWQgZW50aXRpZXMsXG4gKiBkaXNyZWdhcmRpbmcgZXhhY3RuZXNzIG9mIG1hdGNoXG4gKi9cbi8qXG5leHBvcnQgZnVuY3Rpb24gY2FsY1JhbmtpbmdTaW1wbGUobWF0Y2hlZDogbnVtYmVyLFxuICBtaXNtYXRjaGVkOiBudW1iZXIsIG5vdXNlOiBudW1iZXIsXG4gIHJlbGV2YW50Q291bnQ6IG51bWJlcik6IG51bWJlciB7XG4gIC8vIDIgOiAwXG4gIC8vIDEgOiAwXG4gIHZhciBmYWN0b3IgPSBtYXRjaGVkICogTWF0aC5wb3coMS41LCBtYXRjaGVkKSAqIE1hdGgucG93KDEuNSwgbWF0Y2hlZCk7XG4gIHZhciBmYWN0b3IyID0gTWF0aC5wb3coMC40LCBtaXNtYXRjaGVkKTtcbiAgdmFyIGZhY3RvcjMgPSBNYXRoLnBvdygwLjQsIG5vdXNlKTtcbiAgcmV0dXJuIE1hdGgucG93KGZhY3RvcjIgKiBmYWN0b3IgKiBmYWN0b3IzLCAxIC8gKG1pc21hdGNoZWQgKyBtYXRjaGVkICsgbm91c2UpKTtcbn1cbiovXG4vKlxuZXhwb3J0IGZ1bmN0aW9uIGNhbGNSYW5raW5nSGF2aW5nQ2F0ZWdvcnkobWF0Y2hlZDogeyBba2V5OiBzdHJpbmddOiBJTWF0Y2guSVdvcmQgfSxcbiAgaGFzQ2F0ZWdvcnk6IHsgW2tleTogc3RyaW5nXTogbnVtYmVyIH0sXG4gIG1pc21hdGNoZWQ6IHsgW2tleTogc3RyaW5nXTogSU1hdGNoLklXb3JkIH0sIHJlbGV2YW50Q291bnQ6IG51bWJlciwgaGFzRG9tYWluIDogbnVtYmVyKTogbnVtYmVyIHtcblxuXG4gIHZhciBsZW5NYXRjaGVkID0gT2JqZWN0LmtleXMobWF0Y2hlZCkubGVuZ3RoO1xuICB2YXIgZmFjdG9yID0gTWF0Y2guY2FsY1JhbmtpbmdQcm9kdWN0KG1hdGNoZWQpO1xuICBmYWN0b3IgKj0gTWF0aC5wb3coMS41LCBsZW5NYXRjaGVkKTtcbiAgaWYoaGFzRG9tYWluKSB7XG4gICAgZmFjdG9yICo9IDEuNTtcbiAgfVxuICB2YXIgbGVuSGFzQ2F0ZWdvcnkgPSBPYmplY3Qua2V5cyhoYXNDYXRlZ29yeSkubGVuZ3RoO1xuICB2YXIgZmFjdG9ySCA9IE1hdGgucG93KDEuMSwgbGVuSGFzQ2F0ZWdvcnkpO1xuXG4gIHZhciBsZW5NaXNNYXRjaGVkID0gT2JqZWN0LmtleXMobWlzbWF0Y2hlZCkubGVuZ3RoO1xuICB2YXIgZmFjdG9yMiA9IE1hdGNoLmNhbGNSYW5raW5nUHJvZHVjdChtaXNtYXRjaGVkKTtcbiAgZmFjdG9yMiAqPSBNYXRoLnBvdygwLjQsIGxlbk1pc01hdGNoZWQpO1xuICB2YXIgZGl2aXNvciA9ICAobGVuTWlzTWF0Y2hlZCArIGxlbkhhc0NhdGVnb3J5ICsgbGVuTWF0Y2hlZCk7XG4gIGRpdmlzb3IgPSBkaXZpc29yID8gZGl2aXNvciA6IDE7XG4gIHJldHVybiBNYXRoLnBvdyhmYWN0b3IyICogZmFjdG9ySCAqIGZhY3RvciwgMSAvIChkaXZpc29yKSk7XG59XG4qL1xuXG4vKipcbiAqIGxpc3QgYWxsIHRvcCBsZXZlbCByYW5raW5nc1xuICovXG4vKlxuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoUmVjb3Jkc0hhdmluZ0NvbnRleHQoXG4gIHBTZW50ZW5jZXM6IElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzLCBjYXRlZ29yeTogc3RyaW5nLCByZWNvcmRzOiBBcnJheTxJTWF0Y2guSVJlY29yZD4sXG4gIGNhdGVnb3J5U2V0OiB7IFtrZXk6IHN0cmluZ106IGJvb2xlYW4gfSlcbiAgOiBJTWF0Y2guSVByb2Nlc3NlZFdoYXRJc0Fuc3dlcnMge1xuXG4gIC8vZGVidWdsb2coSlNPTi5zdHJpbmdpZnkocmVjb3JkcywgdW5kZWZpbmVkLCAyKSk7XG4gIHZhciByZWxldmFudFJlY29yZHMgPSByZWNvcmRzLmZpbHRlcihmdW5jdGlvbiAocmVjb3JkOiBJTWF0Y2guSVJlY29yZCkge1xuICAgIHJldHVybiAocmVjb3JkW2NhdGVnb3J5XSAhPT0gdW5kZWZpbmVkKSAmJiAocmVjb3JkW2NhdGVnb3J5XSAhPT0gbnVsbCk7XG4gIH0pO1xuICB2YXIgcmVzID0gW107XG4gIGRlYnVnbG9nKFwiTWF0Y2hSZWNvcmRzSGF2aW5nQ29udGV4dCA6IHJlbGV2YW50IHJlY29yZHMgbnI6XCIgKyByZWxldmFudFJlY29yZHMubGVuZ3RoKTtcbiAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/IChcInNlbnRlbmNlcyBhcmUgOiBcIiArIEpTT04uc3RyaW5naWZ5KHBTZW50ZW5jZXMsIHVuZGVmaW5lZCwgMikpIDogXCItXCIpO1xuICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKFwiY2F0ZWdvcnkgXCIgKyBjYXRlZ29yeSArIFwiIGFuZCBjYXRlZ29yeXNldCBpczogXCIgKyBKU09OLnN0cmluZ2lmeShjYXRlZ29yeVNldCwgdW5kZWZpbmVkLCAyKSkgOiBcIi1cIik7XG4gIGlmIChwcm9jZXNzLmVudi5BQk9UX0ZBU1QgJiYgY2F0ZWdvcnlTZXQpIHtcbiAgICAvLyB3ZSBhcmUgb25seSBpbnRlcmVzdGVkIGluIGNhdGVnb3JpZXMgcHJlc2VudCBpbiByZWNvcmRzIGZvciBkb21haW5zIHdoaWNoIGNvbnRhaW4gdGhlIGNhdGVnb3J5XG4gICAgLy8gdmFyIGNhdGVnb3J5c2V0ID0gTW9kZWwuY2FsY3VsYXRlUmVsZXZhbnRSZWNvcmRDYXRlZ29yaWVzKHRoZU1vZGVsLGNhdGVnb3J5KTtcbiAgICAvL2tub3dpbmcgdGhlIHRhcmdldFxuICAgIHBlcmZsb2coXCJnb3QgY2F0ZWdvcnlzZXQgd2l0aCBcIiArIE9iamVjdC5rZXlzKGNhdGVnb3J5U2V0KS5sZW5ndGgpO1xuICAgIHZhciBmbCA9IDA7XG4gICAgdmFyIGxmID0gMDtcbiAgICB2YXIgYVNpbXBsaWZpZWRTZW50ZW5jZXMgPSBwU2VudGVuY2VzLnNlbnRlbmNlcy5tYXAoZnVuY3Rpb24gKG9TZW50ZW5jZSkge1xuICAgICAgdmFyIGZXb3JkcyA9IG9TZW50ZW5jZS5maWx0ZXIoZnVuY3Rpb24gKG9Xb3JkKSB7XG4gICAgICAgIHJldHVybiAhV29yZC5Xb3JkLmlzRmlsbGVyKG9Xb3JkKTtcbiAgICAgIH0pO1xuICAgICAgdmFyIHJXb3JkcyA9IG9TZW50ZW5jZS5maWx0ZXIoZnVuY3Rpb24gKG9Xb3JkKSB7XG4gICAgICAgIHJldHVybiAhIWNhdGVnb3J5U2V0W29Xb3JkLmNhdGVnb3J5XSB8fCBXb3JkLldvcmQuaXNDYXRlZ29yeShvV29yZCk7XG4gICAgICB9KTtcbiAgICAgIGZsID0gZmwgKyBvU2VudGVuY2UubGVuZ3RoO1xuICAgICAgbGYgPSBsZiArIHJXb3Jkcy5sZW5ndGg7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvU2VudGVuY2U6IG9TZW50ZW5jZSxcbiAgICAgICAgY250UmVsZXZhbnRXb3JkczogcldvcmRzLmxlbmd0aCwgLy8gbm90IGEgZmlsbGVyICAvLyB0byBiZSBjb21wYXRpYmxlIGl0IHdvdWxkIGJlIGZXb3Jkc1xuICAgICAgICByV29yZHM6IHJXb3Jkc1xuICAgICAgfTtcbiAgICB9KTtcbiAgICBPYmplY3QuZnJlZXplKGFTaW1wbGlmaWVkU2VudGVuY2VzKTtcbiAgICBkZWJ1Z2xvZyhcInBvc3Qgc2ltcGxpZnkgKHI9XCIgKyByZWxldmFudFJlY29yZHMubGVuZ3RoICsgXCIgcz1cIiArIHBTZW50ZW5jZXMuc2VudGVuY2VzLmxlbmd0aCArIFwiIGZsIFwiICsgZmwgKyBcIi0+XCIgKyBsZiArIFwiKVwiKTtcbiAgICBwZXJmbG9nKFwicG9zdCBzaW1wbGlmeSAocj1cIiArIHJlbGV2YW50UmVjb3Jkcy5sZW5ndGggKyBcIiBzPVwiICsgcFNlbnRlbmNlcy5zZW50ZW5jZXMubGVuZ3RoICsgXCIgZmwgXCIgKyBmbCArIFwiLT5cIiArIGxmICsgXCIpXCIpO1xuICAgIHJlbGV2YW50UmVjb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uIChyZWNvcmQpIHtcbiAgICAgIC8vIGNvdW50IG1hdGNoZXMgaW4gcmVjb3JkIHdoaWNoIGFyZSAqbm90KiB0aGUgY2F0ZWdvcnlcbiAgICAgIGFTaW1wbGlmaWVkU2VudGVuY2VzLmZvckVhY2goZnVuY3Rpb24gKGFTZW50ZW5jZSkge1xuICAgICAgICB2YXIgaGFzQ2F0ZWdvcnkgPSB7fTtcbiAgICAgICAgdmFyIG1pc21hdGNoZWQgPSB7fTtcbiAgICAgICAgdmFyIG1hdGNoZWQgPSB7fTtcbiAgICAgICAgdmFyIGNudFJlbGV2YW50V29yZHMgPSBhU2VudGVuY2UuY250UmVsZXZhbnRXb3JkcztcbiAgICAgICAgYVNlbnRlbmNlLnJXb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uIChvV29yZCkge1xuICAgICAgICAgIGlmIChvV29yZC5jYXRlZ29yeSAmJiAocmVjb3JkW29Xb3JkLmNhdGVnb3J5XSAhPT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAgICAgaWYgKG9Xb3JkLm1hdGNoZWRTdHJpbmcgPT09IHJlY29yZFtvV29yZC5jYXRlZ29yeV0pIHtcbiAgICAgICAgICAgICAgbWF0Y2hlZFtvV29yZC5jYXRlZ29yeV0gPSBvV29yZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBtaXNtYXRjaGVkW29Xb3JkLmNhdGVnb3J5XSA9IG9Xb3JkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChXb3JkLldvcmQuaXNDYXRlZ29yeShvV29yZCkgJiYgcmVjb3JkW29Xb3JkLm1hdGNoZWRTdHJpbmddKSB7XG4gICAgICAgICAgICBoYXNDYXRlZ29yeVtvV29yZC5tYXRjaGVkU3RyaW5nXSA9IDE7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIGlmICgoT2JqZWN0LmtleXMobWF0Y2hlZCkubGVuZ3RoICsgT2JqZWN0LmtleXMoaGFzQ2F0ZWdvcnkpLmxlbmd0aCkgPiBPYmplY3Qua2V5cyhtaXNtYXRjaGVkKS5sZW5ndGgpIHtcbiAgICAgICAgICByZXMucHVzaCh7XG4gICAgICAgICAgICBzZW50ZW5jZTogYVNlbnRlbmNlLm9TZW50ZW5jZSxcbiAgICAgICAgICAgIHJlY29yZDogcmVjb3JkLFxuICAgICAgICAgICAgY2F0ZWdvcnk6IGNhdGVnb3J5LFxuICAgICAgICAgICAgcmVzdWx0OiByZWNvcmRbY2F0ZWdvcnldLFxuICAgICAgICAgICAgX3Jhbmtpbmc6IGNhbGNSYW5raW5nSGF2aW5nQ2F0ZWdvcnkobWF0Y2hlZCwgaGFzQ2F0ZWdvcnksIG1pc21hdGNoZWQsIGNudFJlbGV2YW50V29yZHMpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSk7XG4gICAgZGVidWdsb2coXCJoZXJlIGluIHdlaXJkXCIpO1xuICB9IGVsc2Uge1xuICAgIHJlbGV2YW50UmVjb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uIChyZWNvcmQpIHtcbiAgICAgIC8vIGNvdW50IG1hdGNoZXMgaW4gcmVjb3JkIHdoaWNoIGFyZSAqbm90KiB0aGUgY2F0ZWdvcnlcbiAgICAgIHBTZW50ZW5jZXMuc2VudGVuY2VzLmZvckVhY2goZnVuY3Rpb24gKGFTZW50ZW5jZSkge1xuICAgICAgICB2YXIgaGFzQ2F0ZWdvcnkgPSB7fTtcbiAgICAgICAgdmFyIG1pc21hdGNoZWQgPSB7fTtcbiAgICAgICAgdmFyIG1hdGNoZWQgPSB7fTtcbiAgICAgICAgdmFyIGNudFJlbGV2YW50V29yZHMgPSAwO1xuICAgICAgICBhU2VudGVuY2UuZm9yRWFjaChmdW5jdGlvbiAob1dvcmQpIHtcbiAgICAgICAgICBpZiAoIVdvcmQuV29yZC5pc0ZpbGxlcihvV29yZCkpIHtcbiAgICAgICAgICAgIGNudFJlbGV2YW50V29yZHMgPSBjbnRSZWxldmFudFdvcmRzICsgMTtcbiAgICAgICAgICAgIGlmIChvV29yZC5jYXRlZ29yeSAmJiAocmVjb3JkW29Xb3JkLmNhdGVnb3J5XSAhPT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAgICAgICBpZiAob1dvcmQubWF0Y2hlZFN0cmluZyA9PT0gcmVjb3JkW29Xb3JkLmNhdGVnb3J5XSkge1xuICAgICAgICAgICAgICAgIG1hdGNoZWRbb1dvcmQuY2F0ZWdvcnldID0gb1dvcmQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbWlzbWF0Y2hlZFtvV29yZC5jYXRlZ29yeV0gPSBvV29yZDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoV29yZC5Xb3JkLmlzQ2F0ZWdvcnkob1dvcmQpICYmIHJlY29yZFtvV29yZC5tYXRjaGVkU3RyaW5nXSkge1xuICAgICAgICAgICAgICBoYXNDYXRlZ29yeVtvV29yZC5tYXRjaGVkU3RyaW5nXSA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKChPYmplY3Qua2V5cyhtYXRjaGVkKS5sZW5ndGggKyBPYmplY3Qua2V5cyhoYXNDYXRlZ29yeSkubGVuZ3RoKSA+IE9iamVjdC5rZXlzKG1pc21hdGNoZWQpLmxlbmd0aCkge1xuICAgICAgICAgIHJlcy5wdXNoKHtcbiAgICAgICAgICAgIHNlbnRlbmNlOiBhU2VudGVuY2UsXG4gICAgICAgICAgICByZWNvcmQ6IHJlY29yZCxcbiAgICAgICAgICAgIGNhdGVnb3J5OiBjYXRlZ29yeSxcbiAgICAgICAgICAgIHJlc3VsdDogcmVjb3JkW2NhdGVnb3J5XSxcbiAgICAgICAgICAgIF9yYW5raW5nOiBjYWxjUmFua2luZ0hhdmluZ0NhdGVnb3J5KG1hdGNoZWQsIGhhc0NhdGVnb3J5LCBtaXNtYXRjaGVkLCBjbnRSZWxldmFudFdvcmRzKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pO1xuICB9XG4gIHJlcy5zb3J0KGNtcEJ5UmVzdWx0VGhlblJhbmtpbmcpO1xuICBkZWJ1Z2xvZyhcIiBhZnRlciBzb3J0XCIgKyByZXMubGVuZ3RoKTtcbiAgdmFyIHJlc3VsdCA9IE9iamVjdC5hc3NpZ24oe30sIHBTZW50ZW5jZXMsIHsgYW5zd2VyczogcmVzIH0pO1xuICByZXR1cm4gZmlsdGVyUmV0YWluVG9wUmFua2VkUmVzdWx0KHJlc3VsdCk7XG59XG4qL1xuXG4vKlxuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoUmVjb3JkcyhhU2VudGVuY2VzOiBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcywgY2F0ZWdvcnk6IHN0cmluZywgcmVjb3JkczogQXJyYXk8SU1hdGNoLklSZWNvcmQ+KVxuICA6IElNYXRjaC5JUHJvY2Vzc2VkV2hhdElzQW5zd2VycyB7XG4gIC8vIGlmIChkZWJ1Z2xvZy5lbmFibGVkKSB7XG4gIC8vICAgZGVidWdsb2coSlNPTi5zdHJpbmdpZnkocmVjb3JkcywgdW5kZWZpbmVkLCAyKSk7XG4gIC8vIH1cbiAgdmFyIHJlbGV2YW50UmVjb3JkcyA9IHJlY29yZHMuZmlsdGVyKGZ1bmN0aW9uIChyZWNvcmQ6IElNYXRjaC5JUmVjb3JkKSB7XG4gICAgcmV0dXJuIChyZWNvcmRbY2F0ZWdvcnldICE9PSB1bmRlZmluZWQpICYmIChyZWNvcmRbY2F0ZWdvcnldICE9PSBudWxsKTtcbiAgfSk7XG4gIHZhciByZXMgPSBbXTtcbiAgZGVidWdsb2coXCJyZWxldmFudCByZWNvcmRzIG5yOlwiICsgcmVsZXZhbnRSZWNvcmRzLmxlbmd0aCk7XG4gIHJlbGV2YW50UmVjb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uIChyZWNvcmQpIHtcbiAgICBhU2VudGVuY2VzLnNlbnRlbmNlcy5mb3JFYWNoKGZ1bmN0aW9uIChhU2VudGVuY2UpIHtcbiAgICAgIC8vIGNvdW50IG1hdGNoZXMgaW4gcmVjb3JkIHdoaWNoIGFyZSAqbm90KiB0aGUgY2F0ZWdvcnlcbiAgICAgIHZhciBtaXNtYXRjaGVkID0ge31cbiAgICAgIHZhciBtYXRjaGVkID0ge307XG4gICAgICB2YXIgY250UmVsZXZhbnRXb3JkcyA9IDA7XG4gICAgICBhU2VudGVuY2UuZm9yRWFjaChmdW5jdGlvbiAob1dvcmQpIHtcbiAgICAgICAgaWYgKCFXb3JkLldvcmQuaXNGaWxsZXIob1dvcmQpKSB7XG4gICAgICAgICAgY250UmVsZXZhbnRXb3JkcyA9IGNudFJlbGV2YW50V29yZHMgKyAxO1xuICAgICAgICAgIGlmIChvV29yZC5jYXRlZ29yeSAmJiAocmVjb3JkW29Xb3JkLmNhdGVnb3J5XSAhPT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAgICAgaWYgKG9Xb3JkLm1hdGNoZWRTdHJpbmcgPT09IHJlY29yZFtvV29yZC5jYXRlZ29yeV0pIHtcbiAgICAgICAgICAgICAgbWF0Y2hlZFtvV29yZC5jYXRlZ29yeV0gPSBvV29yZDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG1pc21hdGNoZWRbb1dvcmQuY2F0ZWdvcnldID0gb1dvcmQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGlmIChPYmplY3Qua2V5cyhtYXRjaGVkKS5sZW5ndGggPiBPYmplY3Qua2V5cyhtaXNtYXRjaGVkKS5sZW5ndGgpIHtcbiAgICAgICAgcmVzLnB1c2goe1xuICAgICAgICAgIHNlbnRlbmNlOiBhU2VudGVuY2UsXG4gICAgICAgICAgcmVjb3JkOiByZWNvcmQsXG4gICAgICAgICAgY2F0ZWdvcnk6IGNhdGVnb3J5LFxuICAgICAgICAgIHJlc3VsdDogcmVjb3JkW2NhdGVnb3J5XSxcbiAgICAgICAgICBfcmFua2luZzogY2FsY1JhbmtpbmcobWF0Y2hlZCwgbWlzbWF0Y2hlZCwgY250UmVsZXZhbnRXb3JkcylcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSlcbiAgfSk7XG4gIHJlcy5zb3J0KGNtcEJ5UmVzdWx0VGhlblJhbmtpbmcpO1xuICB2YXIgcmVzdWx0ID0gT2JqZWN0LmFzc2lnbih7fSwgYVNlbnRlbmNlcywgeyBhbnN3ZXJzOiByZXMgfSk7XG4gIHJldHVybiBmaWx0ZXJSZXRhaW5Ub3BSYW5rZWRSZXN1bHQocmVzdWx0KTtcbn1cbiovXG4vKlxuZnVuY3Rpb24gbWFrZVNpbXBsaWZpZWRTZW50ZW5jZXNDYXRlZ29yeVNldChhU2VudGVuY2VzOiBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcyxcbiAgY2F0ZWdvcnlTZXQ6IHsgW2tleTogc3RyaW5nXTogYm9vbGVhbiB9LCB0cmFjazogeyBmbDogbnVtYmVyLCBsZjogbnVtYmVyIH1cbik6IHtcbiAgZG9tYWluczogc3RyaW5nW10sXG4gIG9TZW50ZW5jZTogSU1hdGNoLklTZW50ZW5jZSxcbiAgY250UmVsZXZhbnRXb3JkczogbnVtYmVyLFxuICByV29yZHM6IElNYXRjaC5JV29yZFtdXG59W10ge1xuICByZXR1cm4gYVNlbnRlbmNlcy5zZW50ZW5jZXMubWFwKGZ1bmN0aW9uIChvU2VudGVuY2UpIHtcbiAgICB2YXIgYURvbWFpbnMgPSBbXSBhcyBzdHJpbmdbXTtcbiAgICB2YXIgcldvcmRzID0gb1NlbnRlbmNlLmZpbHRlcihmdW5jdGlvbiAob1dvcmQpIHtcbiAgICAgIGlmIChvV29yZC5jYXRlZ29yeSA9PT0gXCJkb21haW5cIikge1xuICAgICAgICBhRG9tYWlucy5wdXNoKG9Xb3JkLm1hdGNoZWRTdHJpbmcpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAob1dvcmQuY2F0ZWdvcnkgPT09IFwibWV0YVwiKSB7XG4gICAgICAgIC8vIGUuZy4gZG9tYWluIFhYWFxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gISFjYXRlZ29yeVNldFtvV29yZC5jYXRlZ29yeV07XG4gICAgfSk7XG4gICAgdHJhY2suZmwgKz0gb1NlbnRlbmNlLmxlbmd0aDtcbiAgICB0cmFjay5sZiArPSByV29yZHMubGVuZ3RoO1xuICAgIHJldHVybiB7XG4gICAgICBkb21haW5zOiBhRG9tYWlucyxcbiAgICAgIG9TZW50ZW5jZTogb1NlbnRlbmNlLFxuICAgICAgY250UmVsZXZhbnRXb3JkczogcldvcmRzLmxlbmd0aCxcbiAgICAgIHJXb3JkczogcldvcmRzXG4gICAgfTtcbiAgfSk7XG59XG4qL1xuLypcbmZ1bmN0aW9uIG1ha2VTaW1wbGlmaWVkU2VudGVuY2VzQ2F0ZWdvcnlTZXQyKGFTZW50ZW5jZXM6IElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzLFxuICBjYXRlZ29yeVNldDogeyBba2V5OiBzdHJpbmddOiBib29sZWFuIH0sIHRyYWNrOiB7IGZsOiBudW1iZXIsIGxmOiBudW1iZXIgfVxuKToge1xuICBkb21haW5zOiBzdHJpbmdbXSxcbiAgb1NlbnRlbmNlOiBJTWF0Y2guSVNlbnRlbmNlLFxuICBjbnRSZWxldmFudFdvcmRzOiBudW1iZXIsXG4gIHJXb3JkczogSU1hdGNoLklXb3JkW11cbn1bXSB7XG4gIHJldHVybiBhU2VudGVuY2VzLnNlbnRlbmNlcy5tYXAoZnVuY3Rpb24gKG9TZW50ZW5jZSkge1xuICAgIHZhciBhRG9tYWlucyA9IFtdIGFzIHN0cmluZ1tdO1xuICAgIHZhciByV29yZHMgPSBvU2VudGVuY2UuZmlsdGVyKGZ1bmN0aW9uIChvV29yZCkge1xuICAgICAgaWYgKG9Xb3JkLmNhdGVnb3J5ID09PSBcImRvbWFpblwiKSB7XG4gICAgICAgIGFEb21haW5zLnB1c2gob1dvcmQubWF0Y2hlZFN0cmluZyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChvV29yZC5jYXRlZ29yeSA9PT0gXCJtZXRhXCIpIHtcbiAgICAgICAgLy8gZS5nLiBkb21haW4gWFhYXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmKG9Xb3JkLmNhdGVnb3J5ID09PSBcImNhdGVnb3J5XCIpIHtcbiAgICAgICAgaWYoY2F0ZWdvcnlTZXRbb1dvcmQubWF0Y2hlZFN0cmluZ10pIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuICEhY2F0ZWdvcnlTZXRbb1dvcmQuY2F0ZWdvcnldO1xuICAgIH0pO1xuICAgIHRyYWNrLmZsICs9IG9TZW50ZW5jZS5sZW5ndGg7XG4gICAgdHJhY2subGYgKz0gcldvcmRzLmxlbmd0aDtcbiAgICByZXR1cm4ge1xuICAgICAgZG9tYWluczogYURvbWFpbnMsXG4gICAgICBvU2VudGVuY2U6IG9TZW50ZW5jZSxcbiAgICAgIGNudFJlbGV2YW50V29yZHM6IHJXb3Jkcy5sZW5ndGgsXG4gICAgICByV29yZHM6IHJXb3Jkc1xuICAgIH07XG4gIH0pO1xufVxuKi9cblxuLypcbmZ1bmN0aW9uIG1ha2VTaW1wbGlmaWVkU2VudGVuY2VzKGFTZW50ZW5jZXMgOiBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcywgIHRyYWNrOiB7IGZsOiBudW1iZXIsIGxmOiBudW1iZXIgfSk6IHtcbiAgZG9tYWluczogc3RyaW5nW10sXG4gIG9TZW50ZW5jZTogSU1hdGNoLklTZW50ZW5jZSxcbiAgY250UmVsZXZhbnRXb3JkczogbnVtYmVyLFxuICByV29yZHM6IElNYXRjaC5JV29yZFtdXG59W10ge1xuICByZXR1cm4gYVNlbnRlbmNlcy5zZW50ZW5jZXMubWFwKGZ1bmN0aW9uIChvU2VudGVuY2UpIHtcbiAgICB2YXIgZG9tYWlucyA9IFtdIGFzIHN0cmluZ1tdO1xuICAgIHZhciByV29yZHMgPSBvU2VudGVuY2UuZmlsdGVyKGZ1bmN0aW9uIChvV29yZCkge1xuICAgICAgaWYgKG9Xb3JkLmNhdGVnb3J5ID09PSBcImRvbWFpblwiKSB7XG4gICAgICAgIGRvbWFpbnMucHVzaChvV29yZC5tYXRjaGVkU3RyaW5nKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKG9Xb3JkLmNhdGVnb3J5ID09PSBcIm1ldGFcIikge1xuICAgICAgICAvLyBlLmcuIGRvbWFpbiBYWFhcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuICFXb3JkLldvcmQuaXNGaWxsZXIob1dvcmQpO1xuICAgIH0pO1xuICAgIHRyYWNrLmZsICs9IG9TZW50ZW5jZS5sZW5ndGg7XG4gICAgdHJhY2subGYgKz0gcldvcmRzLmxlbmd0aDtcbiAgICByZXR1cm4ge1xuICAgICAgb1NlbnRlbmNlOiBvU2VudGVuY2UsXG4gICAgICBkb21haW5zOiBkb21haW5zLFxuICAgICAgY250UmVsZXZhbnRXb3JkczogcldvcmRzLmxlbmd0aCxcbiAgICAgIHJXb3JkczogcldvcmRzXG4gICAgfTtcbiAgfSk7XG59XG4qL1xuXG5mdW5jdGlvbiBjbGFzc2lmeVdvcmRXaXRoVGFyZ2V0Q2F0ZWdvcnkod29yZDogc3RyaW5nLCB0YXJnZXRjYXRlZ29yeTogc3RyaW5nLCBydWxlczogSU1hdGNoLlNwbGl0UnVsZXMsXG4gIHdob2xlc2VudGVuY2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIC8vY29uc29sZS5sb2coXCJjbGFzc2lmeSBcIiArIHdvcmQgKyBcIiBcIiAgKyB0YXJnZXRjYXRlZ29yeSk7XG4gIHZhciBjYXRzID0gSW5wdXRGaWx0ZXIuY2F0ZWdvcml6ZUFXb3JkKHdvcmQsIHJ1bGVzLCB3aG9sZXNlbnRlbmNlLCB7fSk7XG4gIC8vIFRPRE8gcXVhbGlmeVxuICBjYXRzID0gY2F0cy5maWx0ZXIoZnVuY3Rpb24gKGNhdCkge1xuICAgIHJldHVybiBjYXQuY2F0ZWdvcnkgPT09IHRhcmdldGNhdGVnb3J5O1xuICB9KVxuICAvL2RlYnVnbG9nKEpTT04uc3RyaW5naWZ5KGNhdHMpKTtcbiAgaWYgKGNhdHMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGNhdHNbMF0ubWF0Y2hlZFN0cmluZztcbiAgfVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBhbmFseXplQ2F0ZWdvcnkoY2F0ZWdvcnl3b3JkOiBzdHJpbmcsIHJ1bGVzOiBJTWF0Y2guU3BsaXRSdWxlcywgd2hvbGVzZW50ZW5jZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNsYXNzaWZ5V29yZFdpdGhUYXJnZXRDYXRlZ29yeShjYXRlZ29yeXdvcmQsICdjYXRlZ29yeScsIHJ1bGVzLCB3aG9sZXNlbnRlbmNlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNwbGl0QXRDb21tYUFuZChzdHI6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgdmFyIHIgPSBzdHIuc3BsaXQoLyhcXGJhbmRcXGIpfFssXS8pO1xuICByID0gci5maWx0ZXIoZnVuY3Rpb24gKG8sIGluZGV4KSB7XG4gICAgaWYgKGluZGV4ICUgMiA+IDApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH0pO1xuICB2YXIgcnRyaW1tZWQgPSByLm1hcChmdW5jdGlvbiAobykge1xuICAgIHJldHVybiBuZXcgU3RyaW5nKG8pLnRyaW0oKTtcbiAgfSk7XG4gIHJldHVybiBydHJpbW1lZDtcbn1cbi8qKlxuICogQSBzaW1wbGUgaW1wbGVtZW50YXRpb24sIHNwbGl0dGluZyBhdCBhbmQgYW5kICxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFuYWx5emVDYXRlZ29yeU11bHRPbmx5QW5kQ29tbWEoY2F0ZWdvcnlsaXN0OiBzdHJpbmcsIHJ1bGVzOiBJTWF0Y2guU3BsaXRSdWxlcywgd2hvbGVzZW50ZW5jZTogc3RyaW5nKTogc3RyaW5nW10ge1xuICB2YXIgcnRyaW1tZWQgPSBzcGxpdEF0Q29tbWFBbmQoY2F0ZWdvcnlsaXN0KTtcbiAgdmFyIHJjYXQgPSBydHJpbW1lZC5tYXAoZnVuY3Rpb24gKG8pIHtcbiAgICByZXR1cm4gYW5hbHl6ZUNhdGVnb3J5KG8sIHJ1bGVzLCB3aG9sZXNlbnRlbmNlKTtcbiAgfSk7XG4gIGlmIChyY2F0LmluZGV4T2YodW5kZWZpbmVkKSA+PSAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdcIicgKyBydHJpbW1lZFtyY2F0LmluZGV4T2YodW5kZWZpbmVkKV0gKyAnXCIgaXMgbm90IGEgY2F0ZWdvcnkhJyk7XG4gIH1cbiAgcmV0dXJuIHJjYXQ7XG59XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyQWNjZXB0aW5nT25seShyZXM6IElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdbXVtdLCBjYXRlZ29yaWVzOiBzdHJpbmdbXSk6XG4gIElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdbXVtdIHtcbiAgcmV0dXJuIHJlcy5maWx0ZXIoZnVuY3Rpb24gKGFTZW50ZW5jZSwgaUluZGV4KSB7XG4gICAgcmV0dXJuIGFTZW50ZW5jZS5ldmVyeShmdW5jdGlvbiAob1dvcmQpIHtcbiAgICAgIHJldHVybiBjYXRlZ29yaWVzLmluZGV4T2Yob1dvcmQuY2F0ZWdvcnkpID49IDA7XG4gICAgfSk7XG4gIH0pXG59XG5cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9jZXNzU3RyaW5nKHF1ZXJ5OiBzdHJpbmcsIHJ1bGVzOiBJTWF0Y2guU3BsaXRSdWxlc1xuKTogSU1hdGNoLklQcm9jZXNzZWRTZW50ZW5jZXMge1xuXG4vLyAgaWYgKCFwcm9jZXNzLmVudi5BQk9UX09MRE1BVENIKSB7XG4gICAgcmV0dXJuIEVyQmFzZS5wcm9jZXNzU3RyaW5nKHF1ZXJ5LCBydWxlcywgcnVsZXMud29yZENhY2hlLCB7fSAvKlRPRE8gT1BFUkFUT1JTfSAqLyApO1xuLy8gIH1cbi8qXG4gIHZhciBtYXRjaGVkID0gSW5wdXRGaWx0ZXIuYW5hbHl6ZVN0cmluZyhxdWVyeSwgcnVsZXMsIHNXb3Jkcyk7XG4gIGlmIChkZWJ1Z2xvZy5lbmFibGVkKSB7XG4gICAgZGVidWdsb2coXCJBZnRlciBtYXRjaGVkIFwiICsgSlNPTi5zdHJpbmdpZnkobWF0Y2hlZCkpO1xuICB9XG4gIHZhciBhU2VudGVuY2VzID0gSW5wdXRGaWx0ZXIuZXhwYW5kTWF0Y2hBcnIobWF0Y2hlZCk7XG4gIGlmIChkZWJ1Z2xvZy5lbmFibGVkKSB7XG4gICAgZGVidWdsb2coXCJhZnRlciBleHBhbmRcIiArIGFTZW50ZW5jZXMubWFwKGZ1bmN0aW9uIChvU2VudGVuY2UpIHtcbiAgICAgIHJldHVybiBTZW50ZW5jZS5yYW5raW5nUHJvZHVjdChvU2VudGVuY2UpICsgXCI6XCIgKyBKU09OLnN0cmluZ2lmeShvU2VudGVuY2UpO1xuICAgIH0pLmpvaW4oXCJcXG5cIikpO1xuICB9XG4gIHZhciBhU2VudGVuY2VzUmVpbmZvcmNlZCA9IElucHV0RmlsdGVyLnJlaW5Gb3JjZShhU2VudGVuY2VzKTtcbiAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcbiAgICBkZWJ1Z2xvZyhcImFmdGVyIHJlaW5mb3JjZVwiICsgYVNlbnRlbmNlc1JlaW5mb3JjZWQubWFwKGZ1bmN0aW9uIChvU2VudGVuY2UpIHtcbiAgICAgIHJldHVybiBTZW50ZW5jZS5yYW5raW5nUHJvZHVjdChvU2VudGVuY2UpICsgXCI6XCIgKyBKU09OLnN0cmluZ2lmeShvU2VudGVuY2UpO1xuICAgIH0pLmpvaW4oXCJcXG5cIikpO1xuICB9XG4gIHJldHVybiB7XG4gICAgZXJyb3JzOiBbXSxcbiAgICBzZW50ZW5jZXM6IGFTZW50ZW5jZXNSZWluZm9yY2VkXG4gIH0gYXMgSU1hdGNoLklQcm9jZXNzZWRTZW50ZW5jZXM7XG4qL1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYW5hbHl6ZUNvbnRleHRTdHJpbmcoY29udGV4dFF1ZXJ5U3RyaW5nOiBzdHJpbmcsIHJ1bGVzOiBJTWF0Y2guU3BsaXRSdWxlcyk6XG4gIElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzIHtcblxuICB2YXIgYVNlbnRlbmNlc1JlaW5mb3JjZWQgPSBwcm9jZXNzU3RyaW5nKGNvbnRleHRRdWVyeVN0cmluZywgcnVsZXMpXG4gIC8vIHdlIGxpbWl0IGFuYWx5c2lzIHRvIG4gc2VudGVuY2VzXG4gIGFTZW50ZW5jZXNSZWluZm9yY2VkLnNlbnRlbmNlcyA9IGFTZW50ZW5jZXNSZWluZm9yY2VkLnNlbnRlbmNlcy5zbGljZSgwLCBBbGdvbC5DdXRvZmZfU2VudGVuY2VzKTtcbiAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcbiAgICBkZWJ1Z2xvZyhcImFmdGVyIHJlaW5mb3JjZSBhbmQgY3V0b2ZmXCIgKyBhU2VudGVuY2VzUmVpbmZvcmNlZC5zZW50ZW5jZXMubGVuZ3RoICsgXCJcXG5cIiArIGFTZW50ZW5jZXNSZWluZm9yY2VkLnNlbnRlbmNlcy5tYXAoZnVuY3Rpb24gKG9TZW50ZW5jZSkge1xuICAgICAgcmV0dXJuIFNlbnRlbmNlLnJhbmtpbmdQcm9kdWN0KG9TZW50ZW5jZSkgKyBcIjpcIiArIEpTT04uc3RyaW5naWZ5KG9TZW50ZW5jZSk7XG4gICAgfSkuam9pbihcIlxcblwiKSk7XG4gIH1cbiAgcmV0dXJuIGFTZW50ZW5jZXNSZWluZm9yY2VkO1xufVxuXG4vKlxuZXhwb3J0IGZ1bmN0aW9uIGNtcEJ5TnJDYXRlZ29yaWVzQW5kU2FtZURvbWFpbihhOiBJTWF0Y2guSVNlbnRlbmNlLCBiOiBJTWF0Y2guSVNlbnRlbmNlKTogbnVtYmVyIHtcbiAgLy9jb25zb2xlLmxvZyhcImNvbXBhcmUgYVwiICsgYSArIFwiIGNudGIgXCIgKyBiKTtcbiAgdmFyIGNudGEgPSBTZW50ZW5jZS5nZXREaXN0aW5jdENhdGVnb3JpZXNJblNlbnRlbmNlKGEpLmxlbmd0aDtcbiAgdmFyIGNudGIgPSBTZW50ZW5jZS5nZXREaXN0aW5jdENhdGVnb3JpZXNJblNlbnRlbmNlKGIpLmxlbmd0aDtcbiAgLyAqXG4gICAgdmFyIGNudGEgPSBhLnJlZHVjZShmdW5jdGlvbihwcmV2LCBvV29yZCkge1xuICAgICAgcmV0dXJuIHByZXYgKyAoKG9Xb3JkLmNhdGVnb3J5ID09PSBcImNhdGVnb3J5XCIpPyAxIDogMCk7XG4gICAgfSwwKTtcbiAgICB2YXIgY250YiA9IGIucmVkdWNlKGZ1bmN0aW9uKHByZXYsIG9Xb3JkKSB7XG4gICAgICByZXR1cm4gcHJldiArICgob1dvcmQuY2F0ZWdvcnkgPT09IFwiY2F0ZWdvcnlcIik/IDEgOiAwKTtcbiAgICB9LDApO1xuICAgLy8gY29uc29sZS5sb2coXCJjbnQgYVwiICsgY250YSArIFwiIGNudGIgXCIgKyBjbnRiKTtcbiAgICogL1xuICByZXR1cm4gY250YiAtIGNudGE7XG59Ki9cblxuZXhwb3J0IGZ1bmN0aW9uIGFuYWx5emVDYXRlZ29yeU11bHQoY2F0ZWdvcnlsaXN0OiBzdHJpbmcsIHJ1bGVzOiBJTWF0Y2guU3BsaXRSdWxlcywgd2hvbGVzZW50ZW5jZTogc3RyaW5nLCBnV29yZHM6XG4gIHsgW2tleTogc3RyaW5nXTogSU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1tdIH0pOiBzdHJpbmdbXSB7XG5cbiAgdmFyIHJlcyA9IGFuYWx5emVDb250ZXh0U3RyaW5nKGNhdGVnb3J5bGlzdCwgcnVsZXMpO1xuICAvLyAgZGVidWdsb2coXCJyZXN1bHRpbmcgY2F0ZWdvcnkgc2VudGVuY2VzXCIsIEpTT04uc3RyaW5naWZ5KHJlcykpO1xuICB2YXIgcmVzMiA9IGZpbHRlckFjY2VwdGluZ09ubHkocmVzLnNlbnRlbmNlcywgW1wiY2F0ZWdvcnlcIiwgXCJmaWxsZXJcIl0pO1xuICAvLyAgY29uc29sZS5sb2coXCJoZXJlIHJlczJcIiArIEpTT04uc3RyaW5naWZ5KHJlczIpICk7XG4gIC8vICBjb25zb2xlLmxvZyhcImhlcmUgdW5kZWZpbmVkICEgKyBcIiArIHJlczIuZmlsdGVyKG8gPT4gIW8pLmxlbmd0aCk7XG4gIHJlczIuc29ydChTZW50ZW5jZS5jbXBSYW5raW5nUHJvZHVjdCk7XG4gIGRlYnVnbG9nKFwicmVzdWx0aW5nIGNhdGVnb3J5IHNlbnRlbmNlczogXFxuXCIsIGRlYnVnbG9nLmVuYWJsZWQgPyAoU2VudGVuY2UuZHVtcE5pY2VBcnIocmVzMi5zbGljZSgwLCAzKSwgU2VudGVuY2UucmFua2luZ1Byb2R1Y3QpKSA6ICctJyk7XG4gIC8vIFRPRE86ICAgcmVzMiA9IGZpbHRlckFjY2VwdGluZ09ubHlTYW1lRG9tYWluKHJlczIpO1xuICAvL2RlYnVnbG9nKFwicmVzdWx0aW5nIGNhdGVnb3J5IHNlbnRlbmNlc1wiLCBKU09OLnN0cmluZ2lmeShyZXMyLCB1bmRlZmluZWQsIDIpKTtcbiAgLy8gZXhwZWN0IG9ubHkgY2F0ZWdvcmllc1xuICAvLyB3ZSBjb3VsZCByYW5rIG5vdyBieSBjb21tb24gZG9tYWlucyAsIGJ1dCBmb3Igbm93IHdlIG9ubHkgdGFrZSB0aGUgZmlyc3Qgb25lXG4gIGlmICghcmVzMi5sZW5ndGgpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIC8vcmVzLnNvcnQoY21wQnlOckNhdGVnb3JpZXNBbmRTYW1lRG9tYWluKTtcbiAgdmFyIHJlc2NhdCA9IFNlbnRlbmNlLmdldERpc3RpbmN0Q2F0ZWdvcmllc0luU2VudGVuY2UocmVzMlswXSk7XG4gIHJldHVybiByZXNjYXQ7XG4gIC8vIFwiXCIgcmV0dXJuIHJlc1swXS5maWx0ZXIoKVxuICAvLyByZXR1cm4gY2xhc3NpZnlXb3JkV2l0aFRhcmdldENhdGVnb3J5KGNhdGVnb3J5bGlzdCwgJ2NhdGVnb3J5JywgcnVsZXMsIHdob2xlc2VudGVuY2UpO1xufVxuXG4vKlxuZXhwb3J0IGZ1bmN0aW9uIGFuYWx5emVPcGVyYXRvcihvcHdvcmQ6IHN0cmluZywgcnVsZXM6IElNYXRjaC5TcGxpdFJ1bGVzLCB3aG9sZXNlbnRlbmNlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gY2xhc3NpZnlXb3JkV2l0aFRhcmdldENhdGVnb3J5KG9wd29yZCwgJ29wZXJhdG9yJywgcnVsZXMsIHdob2xlc2VudGVuY2UpO1xufVxuKi9cblxuXG4vLyBjb25zdCByZXN1bHQgPSBXaGF0SXMucmVzb2x2ZUNhdGVnb3J5KGNhdCwgYTEuZW50aXR5LFxuLy8gICB0aGVNb2RlbC5tUnVsZXMsIHRoZU1vZGVsLnRvb2xzLCB0aGVNb2RlbC5yZWNvcmRzKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzSW5kaXNjcmltaW5hdGVSZXN1bHRUdXBlbChyZXN1bHRzOiBBcnJheTxJTWF0Y2guSVdoYXRJc1R1cGVsQW5zd2VyPik6IHN0cmluZyB7XG4gIHZhciBjbnQgPSByZXN1bHRzLnJlZHVjZShmdW5jdGlvbiAocHJldiwgcmVzdWx0KSB7XG4gICAgaWYgKHNhZmVFcXVhbCgxLCAxKSkgeyAvLyByZXN1bHQuX3JhbmtpbmcscmVzdWx0c1swXS5fcmFua2luZykpIHtcbiAgICAgIHJldHVybiBwcmV2ICsgMTtcbiAgICB9XG4gIH0sIDApO1xuICBpZiAoY250ID4gMSkge1xuICAgIC8vIHNlYXJjaCBmb3IgYSBkaXNjcmltaW5hdGluZyBjYXRlZ29yeSB2YWx1ZVxuICAgIHZhciBkaXNjcmltaW5hdGluZyA9IFtdOyAvKk9iamVjdC5rZXlzKHJlc3VsdHNbMF0ucmVjb3JkKS5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGNhdGVnb3J5KSB7XG4gICAgICBpZiAoKGNhdGVnb3J5LmNoYXJBdCgwKSAhPT0gJ18nICYmIHJlc3VsdHNbMF0uY2F0ZWdvcmllcy5pbmRleE9mKGNhdGVnb3J5KSA8IDApXG4gICAgICAgICYmIChyZXN1bHRzWzBdLnJlY29yZFtjYXRlZ29yeV0gIT09IHJlc3VsdHNbMV0ucmVjb3JkW2NhdGVnb3J5XSkpIHtcbiAgICAgICAgcHJldi5wdXNoKGNhdGVnb3J5KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwcmV2O1xuICAgIH0sIFtdKTsgKi9cbiAgICBpZiAoZGlzY3JpbWluYXRpbmcubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gXCJNYW55IGNvbXBhcmFibGUgcmVzdWx0cywgcGVyaGFwcyB5b3Ugd2FudCB0byBzcGVjaWZ5IGEgZGlzY3JpbWluYXRpbmcgXCIgKyBkaXNjcmltaW5hdGluZy5qb2luKCcsJykgKyAnIG9yIHVzZSBcImxpc3QgYWxsIC4uLlwiJztcbiAgICB9XG4gICAgcmV0dXJuICdZb3VyIHF1ZXN0aW9uIGRvZXMgbm90IGhhdmUgYSBzcGVjaWZpYyBhbnN3ZXInO1xuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG4iXX0=
