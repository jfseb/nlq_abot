/**
 *
 * @module jfseb.fdevstart.analyze
 * @file analyze.ts
 * @copyright (c) 2016 Gerd Forstmann
 */


import { InputFilter as InputFilter} from '../index_parser';;
import { MongoQ as MongoQ } from '../index_parser';;
import * as ListAll from './listall';


import * as debug from 'debug';

var debuglog = debug('whatis');
var debuglogV = debug('whatVis');
var perflog = debug('perf');


import { ErError as ErError} from '../index_parser';;

import { ErBase as ErBase} from '../index_parser';;


export function mockDebug(o) {
  debuglog = o;
  debuglogV = o;
  perflog = o;
}


import * as _ from 'lodash';

import * as IMatch from './ifmatch';

//import * as Match from './match';
//import * as Toolmatcher from './toolmatcher';

import { Sentence as Sentence} from '../index_parser';;

import { Word as Word}  from '../index_parser';;

import * as Algol from './algol';

import {Model as Model}  from '../model/index_model';



/*
export function cmpByResultThenRanking(a: IMatch.IWhatIsAnswer, b: IMatch.IWhatIsAnswer) {
  var cmp = a.result.localeCompare(b.result);
  if (cmp) {
    return cmp;
  }
  return -(a._ranking - b._ranking);
}
*/

export function localeCompareArrays(aaresult: string[], bbresult: string[]): number {
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


export function localeCompareRecordArrays(aaresult: MongoQ.IResultRecord[], bbresult: MongoQ.IResultRecord[]):  number {
  var cmp = 0;
  var blen = bbresult.length;
  aaresult.every(function (a, index) {
    if (blen <= index) {
      cmp = -1;
      return false;
    }
    cmp = localeCompareRecord(a,bbresult[index]);
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


export function localeCompareRecord(aaresult: MongoQ.IResultRecord, bbresult: MongoQ.IResultRecord): number {
  var cmp = 0;
  var blen = bbresult.length;
  var keys = Object.keys(aaresult).sort();
  keys.every(function (keya, index)  : boolean{
   var a = aaresult[keya];
    if (blen <= index) {
      cmp = -1;
      return false;
    }
    var b = bbresult[keya];
    var ta = typeof a;
    var tb = typeof b;
    if(ta !== tb ) {
      cmp = ta.localeCompare(tb);
      return false;
    }
    if(typeof ta === 'number') {
      cmp = safeDelta(a as number,b as number);
    } else {
      cmp = (a as string).localeCompare( (b as string));
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

export function safeEqual(a : number, b : number) : boolean {
  var delta = a - b ;
  if(Math.abs(delta) < Algol.RANKING_EPSILON) {
    return true;
  }
  return false;
}

export function safeDelta(a : number, b : number) : number {
  var delta = a - b ;
  if(Math.abs(delta) < Algol.RANKING_EPSILON) {
    return 0;
  }
  return delta;
}

export function cmpByResultThenRankingTupel(aa: IMatch.IWhatIsTupelAnswer, bb: IMatch.IWhatIsTupelAnswer) {
  var cmp = localeCompareRecordArrays(aa.results, bb.results);
  if (cmp) {
    return cmp;
  }
  return 0; // -safeDelta(aa._ranking,bb._ranking);
}


export function cmpRecords(a: IMatch.IRecord, b: IMatch.IRecord) : number {
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

export function dumpNiceTupel(answer: IMatch.IWhatIsTupelAnswer) {
  var result = {
    s: "",
    push: function (s) { this.s = this.s + s; }
  };
  var s =
    `**Result for categories: ${answer.columns.join(";")} is ${answer.results}
 rank: ${1 /*answer._ranking*/}
`;
  result.push(s);
  answer.results.forEach(function (queryresult,index) {
  answer.columns.forEach(function (sRequires, index) {
    if (sRequires.charAt(0) !== '_') {
      result.push(`record: ${sRequires} -> ${queryresult[sRequires]}`);
    }
    result.push('\n');
  });
});

  var oSentence = answer.aux.sentence || [];
  oSentence.forEach(function (oWord, index) {
    var sWord = `[${index}] : ${oWord.category} "${oWord.string}" => "${oWord.matchedString}"`
    result.push(sWord + "\n");
  })
  result.push(".\n");
  return result.s;
}

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

function classifyWordWithTargetCategory(word: string, targetcategory: string, rules: IMatch.SplitRules,
  wholesentence: string): string {
  //console.log("classify " + word + " "  + targetcategory);
  var cats = InputFilter.categorizeAWord(word, rules, wholesentence, {});
  // TODO qualify
  cats = cats.filter(function (cat) {
    return cat.category === targetcategory;
  })
  //debuglog(JSON.stringify(cats));
  if (cats.length) {
    return cats[0].matchedString;
  }
}


export function analyzeCategory(categoryword: string, rules: IMatch.SplitRules, wholesentence: string): string {
  return classifyWordWithTargetCategory(categoryword, 'category', rules, wholesentence);
}

export function splitAtCommaAnd(str: string): string[] {
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
/**
 * A simple implementation, splitting at and and ,
 */
export function analyzeCategoryMultOnlyAndComma(categorylist: string, rules: IMatch.SplitRules, wholesentence: string): string[] {
  var rtrimmed = splitAtCommaAnd(categorylist);
  var rcat = rtrimmed.map(function (o) {
    return analyzeCategory(o, rules, wholesentence);
  });
  if (rcat.indexOf(undefined) >= 0) {
    throw new Error('"' + rtrimmed[rcat.indexOf(undefined)] + '" is not a category!');
  }
  return rcat;
}



export function filterAcceptingOnly(res: IMatch.ICategorizedString[][], categories: string[]):
  IMatch.ICategorizedString[][] {
  return res.filter(function (aSentence, iIndex) {
    return aSentence.every(function (oWord) {
      return categories.indexOf(oWord.category) >= 0;
    });
  })
}




export function processString(query: string, rules: IMatch.SplitRules
): IMatch.IProcessedSentences {

//  if (!process.env.ABOT_OLDMATCH) {
    return ErBase.processString(query, rules, rules.wordCache, {} /*TODO OPERATORS} */ );
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

export function analyzeContextString(contextQueryString: string, rules: IMatch.SplitRules):
  IMatch.IProcessedSentences {

  var aSentencesReinforced = processString(contextQueryString, rules)
  // we limit analysis to n sentences
  aSentencesReinforced.sentences = aSentencesReinforced.sentences.slice(0, Algol.Cutoff_Sentences);
  if (debuglog.enabled) {
    debuglog("after reinforce and cutoff" + aSentencesReinforced.sentences.length + "\n" + aSentencesReinforced.sentences.map(function (oSentence) {
      return Sentence.rankingProduct(oSentence) + ":" + JSON.stringify(oSentence);
    }).join("\n"));
  }
  return aSentencesReinforced;
}

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

export function analyzeCategoryMult(categorylist: string, rules: IMatch.SplitRules, wholesentence: string, gWords:
  { [key: string]: IMatch.ICategorizedString[] }): string[] {

  var res = analyzeContextString(categorylist, rules);
  //  debuglog("resulting category sentences", JSON.stringify(res));
  var res2 = filterAcceptingOnly(res.sentences, ["category", "filler"]);
  //  console.log("here res2" + JSON.stringify(res2) );
  //  console.log("here undefined ! + " + res2.filter(o => !o).length);
  res2.sort(Sentence.cmpRankingProduct);
  debuglog("resulting category sentences: \n", debuglog.enabled ? (Sentence.dumpNiceArr(res2.slice(0, 3), Sentence.rankingProduct)) : '-');
  // TODO:   res2 = filterAcceptingOnlySameDomain(res2);
  //debuglog("resulting category sentences", JSON.stringify(res2, undefined, 2));
  // expect only categories
  // we could rank now by common domains , but for now we only take the first one
  if (!res2.length) {
    return undefined;
  }
  //res.sort(cmpByNrCategoriesAndSameDomain);
  var rescat = Sentence.getDistinctCategoriesInSentence(res2[0]);
  return rescat;
  // "" return res[0].filter()
  // return classifyWordWithTargetCategory(categorylist, 'category', rules, wholesentence);
}

/*
export function analyzeOperator(opword: string, rules: IMatch.SplitRules, wholesentence: string): string {
  return classifyWordWithTargetCategory(opword, 'operator', rules, wholesentence);
}
*/


// const result = WhatIs.resolveCategory(cat, a1.entity,
//   theModel.mRules, theModel.tools, theModel.records);

export function isIndiscriminateResultTupel(results: Array<IMatch.IWhatIsTupelAnswer>): string {
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
