"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.augmentContext = exports.augmentContext1 = exports.sortByWeight = exports.matchRegExp = exports.reinForce = exports.reinForceSentence = exports.extractCategoryMap = exports.reinforceDistWeight = exports.expandMatchArr = exports.categorizeAWordWithOffsets = exports.categorizeAWord = exports.categorizeWordWithOffsetWithRankCutoffSingle = exports.categorizeWordWithOffsetWithRankCutoff = exports.RankWord = exports.extractArgsMap = exports.matchWord = exports.categorizeWordInternalWithOffsets = exports.postFilterWithOffset = exports.dropLowerRankedEqualResult = exports.categorizeSingleWordWithOffset = exports.checkOneRuleWithOffset = exports.checkOneRule = exports.cmpByResultThenRank = exports.cmpByResult = exports.compareContext = exports.spuriousAnotInB = exports.countAinB = exports.levenPenalty = exports.calcDistance = exports.mockDebug = void 0;
/**
 * the input filter stage preprocesses a current context
 *
 * It a) combines multi-segment arguments into one context members
 * It b) attempts to augment the context by additional qualifications
 *           (Mid term generating Alternatives, e.g.
 *                 ClientSideTargetResolution -> unit test?
 *                 ClientSideTargetResolution -> source ?
 *           )
 *  Simple rules like  Intent
 *
 *
 * @module jfseb.fdevstart.inputFilter
 * @file inputFilter.ts
 * @copyright (c) 2016 Gerd Forstmann
 */
// <reference path="../../lib/node-4.d.ts" />
const distance = require("abot_stringdist");
//import * as Logger from '../utils/logger';
//const logger = Logger.logger('inputFilter');
const debug = require("debugf");
var debugperf = debug('perf');
var logger = debug('inputFilterLogger');
const index_model_1 = require("../model/index_model");
const utils = require("abot_utils");
//import * as IFMatch from '../match/iferbase';
//import * as inputFilterRules from './inputFilterRules';
const Algol = require("./algol");
const IFMatch = require("./iferbase");
const AnyObject = Object;
var debuglog = debug('inputFilter');
var debuglogV = debug('inputVFilter');
var debuglogM = debug('inputMFilter');
function mockDebug(o) {
    debuglog = o;
    debuglogV = o;
    debuglogM = o;
}
exports.mockDebug = mockDebug;
/**
 * @param sText {string} the text to match to NavTargetResolution
 * @param sText2 {string} the query text, e.g. NavTarget
 *
 * @return the distance, note that is is *not* symmetric!
 */
function calcDistance(sText1, sText2) {
    return distance.calcDistanceAdjusted(sText1, sText2);
}
exports.calcDistance = calcDistance;
;
function levenPenalty(i) {
    // 1 -> 1
    // cutOff => 0.8
    return i;
    //return   1 -  (1 - i) *0.2/Algol.Cutoff_WordMatch;
}
exports.levenPenalty = levenPenalty;
function nonPrivateKeys(oA) {
    return Object.keys(oA).filter(key => {
        return key[0] !== '_';
    });
}
function countAinB(oA, oB, fnCompare, aKeyIgnore) {
    aKeyIgnore = Array.isArray(aKeyIgnore) ? aKeyIgnore :
        typeof aKeyIgnore === "string" ? [aKeyIgnore] : [];
    fnCompare = fnCompare || function () { return true; };
    return nonPrivateKeys(oA).filter(function (key) {
        return aKeyIgnore.indexOf(key) < 0;
    }).
        reduce(function (prev, key) {
        if (Object.prototype.hasOwnProperty.call(oB, key)) {
            prev = prev + (fnCompare(oA[key], oB[key], key) ? 1 : 0);
        }
        return prev;
    }, 0);
}
exports.countAinB = countAinB;
function spuriousAnotInB(oA, oB, aKeyIgnore) {
    aKeyIgnore = Array.isArray(aKeyIgnore) ? aKeyIgnore :
        typeof aKeyIgnore === "string" ? [aKeyIgnore] : [];
    return nonPrivateKeys(oA).filter(function (key) {
        return aKeyIgnore.indexOf(key) < 0;
    }).
        reduce(function (prev, key) {
        if (!Object.prototype.hasOwnProperty.call(oB, key)) {
            prev = prev + 1;
        }
        return prev;
    }, 0);
}
exports.spuriousAnotInB = spuriousAnotInB;
function lowerCase(o) {
    if (typeof o === "string") {
        return o.toLowerCase();
    }
    return o;
}
function compareContext(oA, oB, aKeyIgnore) {
    var equal = countAinB(oA, oB, function (a, b) { return lowerCase(a) === lowerCase(b); }, aKeyIgnore);
    var different = countAinB(oA, oB, function (a, b) { return lowerCase(a) !== lowerCase(b); }, aKeyIgnore);
    var spuriousL = spuriousAnotInB(oA, oB, aKeyIgnore);
    var spuriousR = spuriousAnotInB(oB, oA, aKeyIgnore);
    return {
        equal: equal,
        different: different,
        spuriousL: spuriousL,
        spuriousR: spuriousR
    };
}
exports.compareContext = compareContext;
function sortByRank(a, b) {
    var r = -((a._ranking || 1.0) - (b._ranking || 1.0));
    if (r) {
        return r;
    }
    if (a.category && b.category) {
        r = a.category.localeCompare(b.category);
        if (r) {
            return r;
        }
    }
    if (a.matchedString && b.matchedString) {
        r = a.matchedString.localeCompare(b.matchedString);
        if (r) {
            return r;
        }
    }
    return 0;
}
/*
function cmpByRank(a: IFMatch.ICategorizedString, b: IFMatch.ICategorizedString): number {
  return sortByRank(a,b);
}
*/
function sortByRankThenResult(a, b) {
    var r = -((a._ranking || 1.0) - (b._ranking || 1.0));
    if (r) {
        return r;
    }
    if (a.category && b.category) {
        r = a.category.localeCompare(b.category);
        if (r) {
            return r;
        }
    }
    if (a.matchedString && b.matchedString) {
        r = a.matchedString.localeCompare(b.matchedString);
        if (r) {
            return r;
        }
    }
    r = cmpByResultThenRank(a, b);
    if (r) {
        return r;
    }
    return 0;
}
function cmpByResult(a, b) {
    if (a.rule === b.rule) {
        return 0;
    }
    var r = a.rule.bitindex - b.rule.bitindex;
    if (r) {
        return r;
    }
    if (a.rule.matchedString && b.rule.matchedString) {
        r = a.rule.matchedString.localeCompare(b.rule.matchedString);
        if (r) {
            return r;
        }
    }
    if (a.rule.category && b.rule.category) {
        r = a.rule.category.localeCompare(b.rule.category);
        if (r) {
            return r;
        }
    }
    if (a.rule.wordType && b.rule.wordType) {
        r = a.rule.wordType.localeCompare(b.rule.wordType);
        if (r) {
            return r;
        }
    }
    return 0;
}
exports.cmpByResult = cmpByResult;
function cmpByResultThenRank(a, b) {
    var r = cmpByResult(a, b);
    if (r) {
        return r;
    }
    var r = -((a._ranking || 1.0) - (b._ranking || 1.0));
    if (r) {
        return r;
    }
    // TODO consider a tiebreaker here
    return 0;
}
exports.cmpByResultThenRank = cmpByResultThenRank;
function analyseRegexp(res, oRule, string) {
    debuglog(() => " here regexp: " + JSON.stringify(oRule, undefined, 2) + '\n' + oRule.regexp.toString());
    var m = oRule.regexp.exec(string);
    var rec = undefined;
    if (m) {
        rec = {
            string: string,
            matchedString: (oRule.matchIndex !== undefined && m[oRule.matchIndex]) || string,
            rule: oRule,
            category: oRule.category,
            _ranking: oRule._ranking || 1.0
        };
        debuglog(() => "\n!match regexp  " + oRule.regexp.toString() + " " + rec._ranking.toFixed(3) + "  " + string + "=" + oRule.lowercaseword + " => " + oRule.matchedString + "/" + oRule.category);
        res.push(rec);
    }
}
function checkOneRule(string, lcString, exact, res, oRule, cntRec) {
    debuglogV(() => 'attempting to match rule ' + JSON.stringify(oRule) + " to string \"" + string + "\"");
    switch (oRule.type) {
        case index_model_1.IFModel.EnumRuleType.WORD:
            if (!oRule.lowercaseword) {
                throw new Error('rule without a lowercase variant' + JSON.stringify(oRule, undefined, 2));
            }
            ;
            // TODO CHECK THIS
            if (exact && (oRule.word === string || oRule.lowercaseword === lcString)) {
                //      if (exact && oRule.word === string || oRule.lowercaseword === lcString) {
                debuglog(() => "\n!matched exact " + string + "=" + oRule.lowercaseword + " => " + oRule.matchedString + "/" + oRule.category);
                res.push({
                    string: string,
                    matchedString: oRule.matchedString,
                    category: oRule.category,
                    _ranking: oRule._ranking || 1.0
                });
            }
            if (!exact && !oRule.exactOnly) {
                var levenmatch = calcDistance(oRule.lowercaseword, lcString);
                /*
                          addCntRec(cntRec,"calcDistance", 1);
                          if(levenmatch < 50) {
                            addCntRec(cntRec,"calcDistanceExp", 1);
                          }
                          if(levenmatch < 40000) {
                            addCntRec(cntRec,"calcDistanceBelow40k", 1);
                          }
                          */
                //if(oRule.lowercaseword === "cosmos") {
                //  console.log("here ranking " + levenmatch + " " + oRule.lowercaseword + " " + lcString);
                //}
                if (levenmatch >= Algol.Cutoff_WordMatch) { // levenCutoff) {
                    addCntRec(cntRec, "calcDistanceOk", 1);
                    var rec = {
                        string: string,
                        matchedString: oRule.matchedString,
                        category: oRule.category,
                        _ranking: (oRule._ranking || 1.0) * levenPenalty(levenmatch),
                        levenmatch: levenmatch
                    };
                    debuglog(() => "\n!fuzzy " + (levenmatch).toFixed(3) + " " + rec._ranking.toFixed(3) + "  " + string + "=" + oRule.lowercaseword + " => " + oRule.matchedString + "/" + oRule.category);
                    res.push(rec);
                }
            }
            break;
        case index_model_1.IFModel.EnumRuleType.REGEXP: {
            analyseRegexp(res, oRule, string);
            break;
        }
        //break;
        default:
            throw new Error("unknown type" + JSON.stringify(oRule, undefined, 2));
    }
}
exports.checkOneRule = checkOneRule;
function checkOneRuleWithOffset(string, lcString, exact, res, oRule, cntRec) {
    debuglogV(() => 'attempting to match rule ' + JSON.stringify(oRule) + " to string \"" + string + "\"");
    switch (oRule.type) {
        case index_model_1.IFModel.EnumRuleType.WORD:
            if (!oRule.lowercaseword) {
                throw new Error('rule without a lowercase variant' + JSON.stringify(oRule, undefined, 2));
            }
            ;
            if (exact && (oRule.word === string || oRule.lowercaseword === lcString)) {
                debuglog(() => "\n!matched exact " + string + "=" + oRule.lowercaseword + " => " + oRule.matchedString + "/" + oRule.category);
                res.push({
                    string: string,
                    matchedString: oRule.matchedString,
                    category: oRule.category,
                    rule: oRule,
                    _ranking: oRule._ranking || 1.0
                });
            }
            if (!exact && !oRule.exactOnly) {
                var levenmatch = calcDistance(oRule.lowercaseword, lcString);
                /*
                          addCntRec(cntRec,"calcDistance", 1);
                          if(levenmatch < 50) {
                            addCntRec(cntRec,"calcDistanceExp", 1);
                          }
                          if(levenmatch < 40000) {
                            addCntRec(cntRec,"calcDistanceBelow40k", 1);
                          }
                          */
                //if(oRule.lowercaseword === "cosmos") {
                //  console.log("here ranking " + levenmatch + " " + oRule.lowercaseword + " " + lcString);
                //}
                if (levenmatch >= Algol.Cutoff_WordMatch) { // levenCutoff) {
                    //console.log("found rec");
                    addCntRec(cntRec, "calcDistanceOk", 1);
                    var rec = {
                        string: string,
                        rule: oRule,
                        matchedString: oRule.matchedString,
                        category: oRule.category,
                        _ranking: (oRule._ranking || 1.0) * levenPenalty(levenmatch),
                        levenmatch: levenmatch
                    };
                    debuglog(() => "\n!CORO: fuzzy " + (levenmatch).toFixed(3) + " " + rec._ranking.toFixed(3) + "  \"" + string + "\"=" + oRule.lowercaseword + " => " + oRule.matchedString + "/" + oRule.category + "/" + oRule.bitindex);
                    res.push(rec);
                }
            }
            break;
        case index_model_1.IFModel.EnumRuleType.REGEXP: {
            analyseRegexp(res, oRule, string);
            break;
        }
        //break;
        default:
            throw new Error("unknown type" + JSON.stringify(oRule, undefined, 2));
    }
}
exports.checkOneRuleWithOffset = checkOneRuleWithOffset;
function addCntRec(cntRec, member, number) {
    if ((!cntRec) || (number === 0)) {
        return;
    }
    cntRec[member] = (cntRec[member] || 0) + number;
}
/*
export function categorizeString(word: string, exact: boolean, oRules: Array<IFModel.mRule>,
 cntRec? : ICntRec): Array<IFMatch.ICategorizedString> {
  // simply apply all rules
  debuglogV(() => "rules : " + JSON.stringify(oRules, undefined, 2));

  var lcString = word.toLowerCase();
  var res: Array<IFMatch.ICategorizedString> = []
  oRules.forEach(function (oRule) {
    checkOneRule(word,lcString,exact,res,oRule,cntRec);
  });
  res.sort(sortByRank);
  return res;
}
*/
function categorizeSingleWordWithOffset(word, lcword, exact, oRules, cntRec) {
    // simply apply all rules
    debuglogV(() => "rules : " + JSON.stringify(oRules, undefined, 2));
    var res = [];
    oRules.forEach(function (oRule) {
        checkOneRuleWithOffset(word, lcword, exact, res, oRule, cntRec);
    });
    debuglog(`CSWWO: got results for ${lcword}  ${res.length}`);
    res.sort(sortByRank);
    return res;
}
exports.categorizeSingleWordWithOffset = categorizeSingleWordWithOffset;
/*
export function postFilter(res : Array<IFMatch.ICategorizedString>) : Array<IFMatch.ICategorizedString> {
  res.sort(sortByRank);
  var bestRank = 0;
  //console.log("\npiltered " + JSON.stringify(res));
    debuglog(()=> "preFilter : \n" + res.map(function(word,index) {
      return `${index} ${word._ranking}  => "${word.category}" ${word.matchedString}`;
    }).join("\n"));
  var r = res.filter(function(resx,index) {
    if(index === 0) {
      bestRank = resx._ranking;
      return true;
    }
    // 1-0.9 = 0.1
    // 1- 0.93 = 0.7
    // 1/7
    var delta = bestRank / resx._ranking;
    if((resx.matchedString === res[index-1].matchedString)
      && (resx.category === res[index-1].category)
      ) {
        debuglog('postfilter ignoring bitinidex!!!');
      return false;
    }
    //console.log("\n delta for " + delta + "  " + resx._ranking);
    if (resx.levenmatch && (delta > 1.03)) {
      return false;
    }
    return true;
  });
  debuglog(()=> `\nfiltered ${r.length}/${res.length}` + JSON.stringify(r));
  return r;
}
*/
function dropLowerRankedEqualResult(res) {
    res.sort(cmpByResultThenRank);
    return res.filter(function (resx, index) {
        var prior = res[index - 1];
        if (prior &&
            !(resx.rule && resx.rule.range)
            && !(res[index - 1].rule && res[index - 1].rule.range)
            && (resx.matchedString === prior.matchedString)
            && (resx.rule.bitindex === prior.rule.bitindex)
            && (resx.rule.wordType === prior.rule.wordType)
            && (resx.category === res[index - 1].category)) {
            return false;
        }
        return true;
    });
}
exports.dropLowerRankedEqualResult = dropLowerRankedEqualResult;
function postFilterWithOffset(res) {
    // for filtering, we need to get *equal rule results close together
    // =>
    //
    res.sort(sortByRank);
    var bestRank = 0;
    //console.log("\npiltered " + JSON.stringify(res));
    debuglog(() => " preFilter : \n" + res.map(function (word) {
        return ` ${word._ranking}  => "${word.category}" ${word.matchedString} `;
    }).join("\n"));
    var r = res.filter(function (resx, index) {
        if (index === 0) {
            bestRank = resx._ranking;
            return true;
        }
        // 1-0.9 = 0.1
        // 1- 0.93 = 0.7
        // 1/7
        var delta = bestRank / resx._ranking;
        var prior = res[index - 1];
        if (!(resx.rule && resx.rule.range)
            && !(res[index - 1].rule && res[index - 1].rule.range)
            && (resx.matchedString === prior.matchedString)
            && (resx.rule.bitindex === prior.rule.bitindex)
            && (resx.rule.wordType === prior.rule.wordType)
            && (resx.category === res[index - 1].category)) {
            return false;
        }
        //console.log("\n delta for " + delta + "  " + resx._ranking);
        if (resx.levenmatch && (delta > 1.03)) {
            return false;
        }
        return true;
    });
    r = dropLowerRankedEqualResult(res);
    r.sort(sortByRankThenResult);
    debuglog(() => `\nfiltered ${r.length}/${res.length}` + JSON.stringify(r));
    return r;
}
exports.postFilterWithOffset = postFilterWithOffset;
/*
export function categorizeString2(word: string, exact: boolean,  rules : IFMatch.SplitRules
  , cntRec? : ICntRec): Array<IFMatch.ICategorizedString> {
  // simply apply all rules
  if (debuglogM.enabled )  {
    // TODO thisis ciruclar ! debuglogM("rules : " + JSON.stringify(rules,undefined, 2));
  }
  var u = 1;
  if( u === 1) {
    throw new Error('categorized String2');

  }
  var lcString = word.toLowerCase();
  var res: Array<IFMatch.ICategorizedString> = [];
  if (exact) {
    var r = rules.wordMap[lcString];
    if (r) {
      r.rules.forEach(function(oRule) {
        res.push({
            string: word,
            matchedString: oRule.matchedString,
            category: oRule.category,
            _ranking: oRule._ranking || 1.0
          })
     });
    }
    rules.nonWordRules.forEach(function (oRule) {
      checkOneRule(word,lcString,exact,res,oRule,cntRec);
    });
    res.sort(sortByRank);
    return res;
  } else {
    debuglog(()=>"categorize non exact" + word + " xx  " + rules.allRules.length);
    return postFilter(categorizeString(word, exact, rules.allRules, cntRec));
  }
}
*/
function categorizeWordInternalWithOffsets(word, lcword, exact, rules, cntRec) {
    debuglogM("categorize  CWIWO" + lcword + " with offset!!!!!!!!!!!!!!!!!" + exact);
    // simply apply all rules
    if (debuglogV.enabled) {
        // TODO this is circular: debuglogV("rules : " + JSON.stringify(rules,undefined, 2));
    }
    var res = [];
    if (exact) {
        var r = rules.wordMap[lcword];
        if (r) {
            debuglogM(debuglogM.enabled ? ` ....pushing n rules exact for ${lcword}:` + r.rules.length : '-');
            debuglogM(debuglogM.enabled ? r.rules.map((r, index) => '' + index + ' ' + JSON.stringify(r)).join("\n") : '-');
            r.rules.forEach(function (oRule) {
                res.push({
                    string: word,
                    matchedString: oRule.matchedString,
                    category: oRule.category,
                    rule: oRule,
                    _ranking: oRule._ranking || 1.0
                });
            });
        }
        rules.nonWordRules.forEach(function (oRule) {
            checkOneRuleWithOffset(word, lcword, exact, res, oRule, cntRec);
        });
        res = postFilterWithOffset(res);
        debuglog(() => "here results exact for " + word + " res " + res.length);
        debuglogM(() => "here results exact for " + word + " res " + res.length);
        res.sort(sortByRank);
        return res;
    }
    else {
        debuglog("categorize non exact \"" + word + "\"    " + rules.allRules.length);
        var rr = categorizeSingleWordWithOffset(word, lcword, exact, rules.allRules, cntRec);
        //debulogM("fuzzy res " + JSON.stringify(rr));
        return postFilterWithOffset(rr);
    }
}
exports.categorizeWordInternalWithOffsets = categorizeWordInternalWithOffsets;
/**
 *
 * Options may be {
 * matchothers : true,  => only rules where all others match are considered
 * augment : true,
 * override : true }  =>
 *
 */
function matchWord(oRule, context, options) {
    if (context[oRule.key] === undefined) {
        return undefined;
    }
    var s1 = context[oRule.key].toLowerCase();
    var s2 = oRule.word.toLowerCase();
    options = options || {};
    var delta = compareContext(context, oRule.follows, oRule.key);
    debuglogV(() => JSON.stringify(delta));
    debuglogV(() => JSON.stringify(options));
    if (options.matchothers && (delta.different > 0)) {
        return undefined;
    }
    var c = calcDistance(s2, s1);
    debuglogV(() => " s1 <> s2 " + s1 + "<>" + s2 + "  =>: " + c);
    if (c > 0.80) {
        var res = AnyObject.assign({}, oRule.follows);
        res = AnyObject.assign(res, context);
        if (options.override) {
            res = AnyObject.assign(res, oRule.follows);
        }
        // force key property
        // console.log(' objectcategory', res['systemObjectCategory']);
        res[oRule.key] = oRule.follows[oRule.key] || res[oRule.key];
        res._weight = AnyObject.assign({}, res._weight);
        res._weight[oRule.key] = c;
        Object.freeze(res);
        debuglog(() => 'Found one' + JSON.stringify(res, undefined, 2));
        return res;
    }
    return undefined;
}
exports.matchWord = matchWord;
function extractArgsMap(match, argsMap) {
    var res = {};
    if (!argsMap) {
        return res;
    }
    Object.keys(argsMap).forEach(function (iKey) {
        var value = match[iKey];
        var key = argsMap[iKey];
        if ((typeof value === "string") && value.length > 0) {
            res[key] = value;
        }
    });
    return res;
}
exports.extractArgsMap = extractArgsMap;
exports.RankWord = {
    hasAbove: function (lst, border) {
        return !lst.every(function (oMember) {
            return (oMember._ranking < border);
        });
    },
    takeFirstN: function (lst, n) {
        var lastRanking = 1.0;
        var cntRanged = 0;
        return lst.filter(function (oMember, iIndex) {
            var isRanged = !!(oMember["rule"] && oMember["rule"].range);
            if (isRanged) {
                cntRanged += 1;
                return true;
            }
            if (((iIndex - cntRanged) < n) || (oMember._ranking === lastRanking)) {
                lastRanking = oMember._ranking;
                return true;
            }
            return false;
        });
    },
    takeAbove: function (lst, border) {
        return lst.filter(function (oMember) {
            return (oMember._ranking >= border);
        });
    }
};
/*
var exactLen = 0;
var fuzzyLen = 0;
var fuzzyCnt = 0;
var exactCnt = 0;
var totalCnt = 0;
var totalLen = 0;
var retainedCnt = 0;

export function resetCnt() {
  exactLen = 0;
  fuzzyLen = 0;
  fuzzyCnt = 0;
  exactCnt = 0;
  totalCnt = 0;
  totalLen = 0;
  retainedCnt = 0;
}
*/
/*
export function categorizeWordWithRankCutoff(sWordGroup: string, splitRules : IMatch.SplitRules , cntRec? : ICntRec ): Array<IFMatch.ICategorizedString> {
  debuglog('cwwrc' + sWordGroup)
  console.log('cwwrc called');
  var u = 1;
  var seenIt = categorizeString2(sWordGroup, true, splitRules, cntRec);
  //totalCnt += 1;
  // exactLen += seenIt.length;
  addCntRec(cntRec, 'cntCatExact', 1);
  addCntRec(cntRec, 'cntCatExactRes', seenIt.length);

  if (RankWord.hasAbove(seenIt, 0.8)) {
    if(cntRec) {
      addCntRec(cntRec, 'exactPriorTake', seenIt.length)
    }
    seenIt = RankWord.takeAbove(seenIt, 0.8);
    if(cntRec) {
      addCntRec(cntRec, 'exactAfterTake', seenIt.length)
    }
   // exactCnt += 1;
  } else {
    seenIt = categorizeString2(sWordGroup, false, splitRules, cntRec);
    addCntRec(cntRec, 'cntNonExact', 1);
    addCntRec(cntRec, 'cntNonExactRes', seenIt.length);
  //  fuzzyLen += seenIt.length;
  //  fuzzyCnt += 1;
  }
 // totalLen += seenIt.length;
  seenIt = RankWord.takeFirstN(seenIt, Algol.Top_N_WordCategorizations);
 // retainedCnt += seenIt.length;
  return seenIt;
}
*/
/* if we have a  "Run like the Wind"
  an a user type fun like  a Rind , and Rind is an exact match,
  we will not start looking for the long sentence

  this is to be fixed by "spreading" the range indication accross very similar words in the vincinity of the
  target words
*/
function categorizeWordWithOffsetWithRankCutoff(sWordGroup, splitRules, cntRec) {
    var sWordGroupLC = sWordGroup.toLowerCase();
    var seenIt = categorizeWordInternalWithOffsets(sWordGroup, sWordGroupLC, true, splitRules, cntRec);
    //console.log("SEENIT" + JSON.stringify(seenIt));
    //totalCnt += 1;
    // exactLen += seenIt.length;
    //console.log("first run exact " + JSON.stringify(seenIt));
    addCntRec(cntRec, 'cntCatExact', 1);
    addCntRec(cntRec, 'cntCatExactRes', seenIt.length);
    if (exports.RankWord.hasAbove(seenIt, 0.8)) {
        if (cntRec) {
            addCntRec(cntRec, 'exactPriorTake', seenIt.length);
        }
        seenIt = exports.RankWord.takeAbove(seenIt, 0.8);
        if (cntRec) {
            addCntRec(cntRec, 'exactAfterTake', seenIt.length);
        }
        // exactCnt += 1;
    }
    else {
        seenIt = categorizeWordInternalWithOffsets(sWordGroup, sWordGroupLC, false, splitRules, cntRec);
        addCntRec(cntRec, 'cntNonExact', 1);
        addCntRec(cntRec, 'cntNonExactRes', seenIt.length);
        //  fuzzyLen += seenIt.length;
        //  fuzzyCnt += 1;
    }
    // totalLen += seenIt.length;
    debuglog(() => (`${seenIt.length} with ${seenIt.reduce((prev, obj) => prev + (obj.rule.range ? 1 : 0), 0)} ranged !`));
    //  var cntRanged = seenIt.reduce( (prev,obj) => prev + (obj.rule.range ? 1 : 0),0);
    //  console.log(`*********** ${seenIt.length} with ${cntRanged} ranged !`);
    seenIt = exports.RankWord.takeFirstN(seenIt, Algol.Top_N_WordCategorizations);
    // retainedCnt += seenIt.length;
    //console.log("final res of categorizeWordWithOffsetWithRankCutoff" + JSON.stringify(seenIt));
    return seenIt;
}
exports.categorizeWordWithOffsetWithRankCutoff = categorizeWordWithOffsetWithRankCutoff;
function categorizeWordWithOffsetWithRankCutoffSingle(word, rule) {
    var lcword = word.toLowerCase();
    if (lcword === rule.lowercaseword) {
        return {
            string: word,
            matchedString: rule.matchedString,
            category: rule.category,
            rule: rule,
            _ranking: rule._ranking || 1.0
        };
    }
    var res = [];
    checkOneRuleWithOffset(word, lcword, false, res, rule);
    debuglog("catWWOWRCS " + lcword);
    if (res.length) {
        return res[0];
    }
    return undefined;
}
exports.categorizeWordWithOffsetWithRankCutoffSingle = categorizeWordWithOffsetWithRankCutoffSingle;
/*
export function filterRemovingUncategorizedSentence(oSentence: IFMatch.ICategorizedString[][]): boolean {
  return oSentence.every(function (oWordGroup) {
    return (oWordGroup.length > 0);
  });
}



export function filterRemovingUncategorized(arr: IFMatch.ICategorizedString[][][]): IFMatch.ICategorizedString[][][] {
  return arr.filter(function (oSentence) {
    return filterRemovingUncategorizedSentence(oSentence);
  });
}
*/
function categorizeAWord(sWordGroup, rules, sentence, words, cntRec) {
    return categorizeAWordWithOffsets(sWordGroup, rules, sentence, words).filter(r => !r.span && !r.rule.range);
    /* consider removing the ranged stuff  */
    /*
      var seenIt = words[sWordGroup];
      if (seenIt === undefined) {
        //seenIt = categorizeWordWithRankCutoff(sWordGroup, rules, cntRec);
        seenIt = categorizeWordWithOffsetWithRankCutoff(sWordGroup,rules,cntRec);
        utils.deepFreeze(seenIt);
        words[sWordGroup] = seenIt;
      }
      if (!seenIt || seenIt.length === 0) {
        logger("***WARNING: Did not find any categorization for \"" + sWordGroup + "\" in sentence \""
          + sentence + "\"");
        if (sWordGroup.indexOf(" ") <= 0) {
          debuglog("***WARNING: Did not find any categorization for primitive (!)" + sWordGroup);
        }
        debuglog("***WARNING: Did not find any categorization for " + sWordGroup);
        if (!seenIt) {
          throw new Error("Expecting emtpy list, not undefined for \"" + sWordGroup + "\"")
        }
        words[sWordGroup] = []
        return [];
      }
      return utils.cloneDeep(seenIt);
      */
}
exports.categorizeAWord = categorizeAWord;
/**
 * Given a  string, break it down into components,
 * [['A', 'B'], ['A B']]
 *
 * then categorizeWords
 * returning
 *
 * [ [[ { category: 'systemId', word : 'A'},
 *      { category: 'otherthing', word : 'A'}
 *    ],
 *    // result of B
 *    [ { category: 'systemId', word : 'B'},
 *      { category: 'otherthing', word : 'A'}
 *      { category: 'anothertryp', word : 'B'}
 *    ]
 *   ],
 * ]]]
 *
 *
 *
 */
/*
export function analyzeString(sString: string, rules: IMatch.SplitRules,
  words?: { [key: string]: Array<IFMatch.ICategorizedString> })
  : [ [ IMatch.ICategorizedString[]] ]
   {
  var cnt = 0;
  var fac = 1;
  if(cnt === 0) {
    throw Error('use processStrign2');
  }
  var u = breakdown.breakdownString(sString, Algol.MaxSpacesPerCombinedWord);
  debuglog(()=>"here breakdown" + JSON.stringify(u));
  //console.log(JSON.stringify(u));
  words = words || {};
  debugperf(()=>'this many known words: ' + Object.keys(words).length);
  var res = [] as [[ IMatch.ICategorizedString[]] ];
  var cntRec = {};
  u.forEach(function (aBreakDownSentence) {
      var categorizedSentence = [] as [ IMatch.ICategorizedString[] ];
      var isValid = aBreakDownSentence.every(function (sWordGroup: string, index : number) {
        var seenIt = categorizeAWord(sWordGroup, rules, sString, words, cntRec);
        if(seenIt.length === 0) {
          return false;
        }
        categorizedSentence[index] = seenIt;
        cnt = cnt + seenIt.length;
        fac = fac * seenIt.length;
        return true;
      });
      if(isValid) {
        res.push(categorizedSentence);
      }
  });
  debuglog(()=>" sentences " + u.length + " matches " + cnt + " fac: " + fac);
  debuglog( ()=> "first match "+ JSON.stringify(u,undefined,2));
  debugperf(()=> " sentences " + u.length + " / " + res.length +  " matches " + cnt + " fac: " + fac + " rec : " + JSON.stringify(cntRec,undefined,2));
  return res;
}
*/
/**
 * This is the main entry point for word categorization,
 * If sentence is supplied it will be used
 * @param sWordGroup a single word, g.e. "earth" or a combination "UI5 Component"
 *  The word will *not* be broken down here, but diretyl matched against  rules
 * @param rules rule index
 * @param sentence optional, only for debugging
 * @param words
 * @param cntRec
 */
function categorizeAWordWithOffsets(sWordGroup, rules, sentence, words, cntRec) {
    var seenIt = words[sWordGroup];
    if (seenIt === undefined) {
        seenIt = categorizeWordWithOffsetWithRankCutoff(sWordGroup, rules, cntRec);
        utils.deepFreeze(seenIt);
        words[sWordGroup] = seenIt;
    }
    if (!seenIt || seenIt.length === 0) {
        logger("***WARNING: Did not find any categorization for \"" + sWordGroup + "\" in sentence \""
            + sentence + "\"");
        if (sWordGroup.indexOf(" ") <= 0) {
            debuglog(() => "***WARNING: Did not find any categorization for primitive (!)" + sWordGroup);
        }
        debuglog(() => "***WARNING: Did not find any categorization for " + sWordGroup);
        if (!seenIt) {
            throw new Error("Expecting emtpy list, not undefined for \"" + sWordGroup + "\"");
        }
        words[sWordGroup] = [];
        return [];
    }
    return utils.cloneDeep(seenIt);
}
exports.categorizeAWordWithOffsets = categorizeAWordWithOffsets;
/*
[ [a,b], [c,d]]

00 a
01 b
10 c
11 d
12 c
*/
const clone = utils.cloneDeep;
function copyVecMembers(u) {
    var i = 0;
    for (i = 0; i < u.length; ++i) {
        u[i] = clone(u[i]);
    }
    return u;
}
// we can replicate the tail or the head,
// we replicate the tail as it is smaller.
// [a,b,c ]
function expandMatchArr(deep) {
    var a = [];
    var line = [];
    debuglog(() => JSON.stringify(deep));
    deep.forEach(function (uBreakDownLine, iIndex) {
        line[iIndex] = [];
        uBreakDownLine.forEach(function (aWordGroup, wgIndex) {
            line[iIndex][wgIndex] = [];
            aWordGroup.forEach(function (oWordVariant, iWVIndex) {
                line[iIndex][wgIndex][iWVIndex] = oWordVariant;
            });
        });
    });
    debuglog(debuglog.enabled ? JSON.stringify(line) : '-');
    var res = [];
    var nvecs = [];
    for (var i = 0; i < line.length; ++i) {
        var vecs = [[]];
        var nvecs = [];
        var rvec = [];
        for (var k = 0; k < line[i].length; ++k) { // wordgroup k
            //vecs is the vector of all so far seen variants up to k wgs.
            var nextBase = [];
            for (var l = 0; l < line[i][k].length; ++l) { // for each variant
                //debuglog("vecs now" + JSON.stringify(vecs));
                nvecs = []; //vecs.slice(); // copy the vec[i] base vector;
                //debuglog("vecs copied now" + JSON.stringify(nvecs));
                for (var u = 0; u < vecs.length; ++u) {
                    nvecs[u] = vecs[u].slice(); //
                    nvecs[u] = copyVecMembers(nvecs[u]);
                    // debuglog("copied vecs["+ u+"]" + JSON.stringify(vecs[u]));
                    nvecs[u].push(clone(line[i][k][l])); // push the lth variant
                    // debuglog("now nvecs " + nvecs.length + " " + JSON.stringify(nvecs));
                }
                //   debuglog(" at     " + k + ":" + l + " nextbase >" + JSON.stringify(nextBase))
                //   debuglog(" append " + k + ":" + l + " nvecs    >" + JSON.stringify(nvecs))
                nextBase = nextBase.concat(nvecs);
                //   debuglog("  result " + k + ":" + l + " nvecs    >" + JSON.stringify(nextBase))
            } //constru
            //  debuglog("now at " + k + ":" + l + " >" + JSON.stringify(nextBase))
            vecs = nextBase;
        }
        debuglogV(debuglogV.enabled ? ("APPENDING TO RES3#" + i + ":" + l + " >" + JSON.stringify(nextBase)) : '-');
        res = res.concat(vecs);
    }
    return res;
}
exports.expandMatchArr = expandMatchArr;
/**
 * Calculate a weight factor for a given distance and
 * category
 * @param {integer} dist distance in words
 * @param {string} category category to use
 * @returns {number} a distance factor >= 1
 *  1.0 for no effect
 */
function reinforceDistWeight(dist, category) {
    var abs = Math.abs(dist);
    return 1.0 + (Algol.aReinforceDistWeight[abs] || 0);
}
exports.reinforceDistWeight = reinforceDistWeight;
/**
 * Given a sentence, extact categories
 */
function extractCategoryMap(oSentence) {
    var res = {};
    debuglog(debuglog.enabled ? ('extractCategoryMap ' + JSON.stringify(oSentence)) : '-');
    oSentence.forEach(function (oWord, iIndex) {
        if (oWord.category === IFMatch.CAT_CATEGORY) {
            res[oWord.matchedString] = res[oWord.matchedString] || [];
            res[oWord.matchedString].push({ pos: iIndex });
        }
    });
    utils.deepFreeze(res);
    return res;
}
exports.extractCategoryMap = extractCategoryMap;
function reinForceSentence(oSentence) {
    "use strict";
    var oCategoryMap = extractCategoryMap(oSentence);
    oSentence.forEach(function (oWord, iIndex) {
        var m = oCategoryMap[oWord.category] || [];
        m.forEach(function (oPosition) {
            "use strict";
            oWord.reinforce = oWord.reinforce || 1;
            var boost = reinforceDistWeight(iIndex - oPosition.pos, oWord.category);
            oWord.reinforce *= boost;
            oWord._ranking *= boost;
        });
    });
    oSentence.forEach(function (oWord, iIndex) {
        if (iIndex > 0) {
            if (oSentence[iIndex - 1].category === "meta" && (oWord.category === oSentence[iIndex - 1].matchedString)) {
                oWord.reinforce = oWord.reinforce || 1;
                var boost = reinforceDistWeight(1, oWord.category);
                oWord.reinforce *= boost;
                oWord._ranking *= boost;
            }
        }
    });
    return oSentence;
}
exports.reinForceSentence = reinForceSentence;
const Sentence = require("./sentence");
function reinForce(aCategorizedArray) {
    "use strict";
    aCategorizedArray.forEach(function (oSentence) {
        reinForceSentence(oSentence);
    });
    aCategorizedArray.sort(Sentence.cmpRankingProduct);
    debuglog(() => "after reinforce" + aCategorizedArray.map(function (oSentence) {
        return Sentence.rankingProduct(oSentence) + ":" + JSON.stringify(oSentence);
    }).join("\n"));
    return aCategorizedArray;
}
exports.reinForce = reinForce;
/// below may no longer be used
function matchRegExp(oRule, context, options) {
    if (context[oRule.key] === undefined) {
        return undefined;
    }
    var sKey = oRule.key;
    var s1 = context[oRule.key].toLowerCase();
    var reg = oRule.regexp;
    var m = reg.exec(s1);
    if (debuglogV.enabled) {
        debuglogV("applying regexp: " + s1 + " " + JSON.stringify(m));
    }
    if (!m) {
        return undefined;
    }
    options = options || {};
    var delta = compareContext(context, oRule.follows, oRule.key);
    debuglogV(() => JSON.stringify(delta));
    debuglogV(() => JSON.stringify(options));
    if (options.matchothers && (delta.different > 0)) {
        return undefined;
    }
    var oExtractedContext = extractArgsMap(m, oRule.argsMap);
    debuglogV(() => "extracted args " + JSON.stringify(oRule.argsMap));
    debuglogV(() => "match " + JSON.stringify(m));
    debuglogV(() => "extracted args " + JSON.stringify(oExtractedContext));
    var res = AnyObject.assign({}, oRule.follows);
    res = AnyObject.assign(res, oExtractedContext);
    res = AnyObject.assign(res, context);
    if (oExtractedContext[sKey] !== undefined) {
        res[sKey] = oExtractedContext[sKey];
    }
    if (options.override) {
        res = AnyObject.assign(res, oRule.follows);
        res = AnyObject.assign(res, oExtractedContext);
    }
    Object.freeze(res);
    debuglog(debuglog.enabled ? ('Found one' + JSON.stringify(res, undefined, 2)) : '-');
    return res;
}
exports.matchRegExp = matchRegExp;
function sortByWeight(sKey, oContextA, oContextB) {
    debuglogV(() => 'sorting: ' + sKey + 'invoked with\n 1:' + JSON.stringify(oContextA, undefined, 2) +
        " vs \n 2:" + JSON.stringify(oContextB, undefined, 2));
    var rankingA = parseFloat(oContextA["_ranking"] || "1");
    var rankingB = parseFloat(oContextB["_ranking"] || "1");
    if (rankingA !== rankingB) {
        debuglog(() => " rankin delta" + 100 * (rankingB - rankingA));
        return 100 * (rankingB - rankingA);
    }
    var weightA = oContextA["_weight"] && oContextA["_weight"][sKey] || 0;
    var weightB = oContextB["_weight"] && oContextB["_weight"][sKey] || 0;
    return +(weightB - weightA);
}
exports.sortByWeight = sortByWeight;
// Word, Synonym, Regexp / ExtractionRule
function augmentContext1(context, oRules, options) {
    var sKey = oRules[0].key;
    // check that rule
    if (debuglog.enabled) {
        // check consistency
        oRules.every(function (iRule) {
            if (iRule.key !== sKey) {
                throw new Error("Inhomogenous keys in rules, expected " + sKey + " was " + JSON.stringify(iRule));
            }
            return true;
        });
    }
    // look for rules which match
    var res = oRules.map(function (oRule) {
        // is this rule applicable
        switch (oRule.type) {
            case index_model_1.IFModel.EnumRuleType.WORD:
                return matchWord(oRule, context, options);
            case index_model_1.IFModel.EnumRuleType.REGEXP:
                return matchRegExp(oRule, context, options);
            //   case "Extraction":
            //     return matchExtraction(oRule,context);
        }
        return undefined;
    }).filter(function (ores) {
        return !!ores;
    }).sort(sortByWeight.bind(this, sKey));
    //debuglog("hassorted" + JSON.stringify(res,undefined,2));
    return res;
    // Object.keys().forEach(function (sKey) {
    // });
}
exports.augmentContext1 = augmentContext1;
function augmentContext(context, aRules) {
    var options1 = {
        matchothers: true,
        override: false
    };
    var aRes = augmentContext1(context, aRules, options1);
    if (aRes.length === 0) {
        var options2 = {
            matchothers: false,
            override: true
        };
        aRes = augmentContext1(context, aRules, options2);
    }
    return aRes;
}
exports.augmentContext = augmentContext;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tYXRjaC9pbnB1dEZpbHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCw2Q0FBNkM7QUFDN0MsNENBQTRDO0FBRTVDLDRDQUE0QztBQUU1Qyw4Q0FBOEM7QUFFOUMsZ0NBQWdDO0FBQ2hDLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUV4QyxzREFBd0Q7QUFDeEQsb0NBQW9DO0FBRXBDLCtDQUErQztBQUcvQyx5REFBeUQ7QUFFekQsaUNBQWlDO0FBRWpDLHNDQUFzQztBQUt0QyxNQUFNLFNBQVMsR0FBUSxNQUFNLENBQUM7QUFFOUIsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFBO0FBQ25DLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQTtBQUNyQyxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUE7QUFFckMsU0FBZ0IsU0FBUyxDQUFDLENBQUM7SUFDekIsUUFBUSxHQUFHLENBQUMsQ0FBQztJQUNiLFNBQVMsR0FBRyxDQUFDLENBQUM7SUFDZCxTQUFTLEdBQUcsQ0FBQyxDQUFDO0FBQ2hCLENBQUM7QUFKRCw4QkFJQztBQUdEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsWUFBWSxDQUFDLE1BQWMsRUFBRSxNQUFjO0lBQ3pELE9BQU8sUUFBUSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBQyxNQUFNLENBQUMsQ0FBQztBQUN0RCxDQUFDO0FBRkQsb0NBRUM7QUFJQSxDQUFDO0FBcUJGLFNBQWdCLFlBQVksQ0FBQyxDQUFTO0lBQ3BDLFNBQVM7SUFDVCxnQkFBZ0I7SUFDaEIsT0FBTyxDQUFDLENBQUM7SUFDVCxvREFBb0Q7QUFDdEQsQ0FBQztBQUxELG9DQUtDO0FBR0QsU0FBUyxjQUFjLENBQUMs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QUFJO1FBQ2pCLFFBQVEsRUFBRSxLQUFLO0tBQ0MsQ0FBQztJQUVuQixJQUFJLElBQUksR0FBRyxlQUFlLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUVyRCxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ3JCLElBQUksUUFBUSxHQUFrQjtZQUM1QixXQUFXLEVBQUUsS0FBSztZQUNsQixRQUFRLEVBQUUsSUFBSTtTQUNFLENBQUM7UUFDbkIsSUFBSSxHQUFHLGVBQWUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0tBQ25EO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBakJELHdDQWlCQyIsImZpbGUiOiJtYXRjaC9pbnB1dEZpbHRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogdGhlIGlucHV0IGZpbHRlciBzdGFnZSBwcmVwcm9jZXNzZXMgYSBjdXJyZW50IGNvbnRleHRcbiAqXG4gKiBJdCBhKSBjb21iaW5lcyBtdWx0aS1zZWdtZW50IGFyZ3VtZW50cyBpbnRvIG9uZSBjb250ZXh0IG1lbWJlcnNcbiAqIEl0IGIpIGF0dGVtcHRzIHRvIGF1Z21lbnQgdGhlIGNvbnRleHQgYnkgYWRkaXRpb25hbCBxdWFsaWZpY2F0aW9uc1xuICogICAgICAgICAgIChNaWQgdGVybSBnZW5lcmF0aW5nIEFsdGVybmF0aXZlcywgZS5nLlxuICogICAgICAgICAgICAgICAgIENsaWVudFNpZGVUYXJnZXRSZXNvbHV0aW9uIC0+IHVuaXQgdGVzdD9cbiAqICAgICAgICAgICAgICAgICBDbGllbnRTaWRlVGFyZ2V0UmVzb2x1dGlvbiAtPiBzb3VyY2UgP1xuICogICAgICAgICAgIClcbiAqICBTaW1wbGUgcnVsZXMgbGlrZSAgSW50ZW50XG4gKlxuICpcbiAqIEBtb2R1bGUgamZzZWIuZmRldnN0YXJ0LmlucHV0RmlsdGVyXG4gKiBAZmlsZSBpbnB1dEZpbHRlci50c1xuICogQGNvcHlyaWdodCAoYykgMjAxNiBHZXJkIEZvcnN0bWFublxuICovXG4vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9saWIvbm9kZS00LmQudHNcIiAvPlxuaW1wb3J0ICogYXMgZGlzdGFuY2UgZnJvbSAnYWJvdF9zdHJpbmdkaXN0JztcblxuLy9pbXBvcnQgKiBhcyBMb2dnZXIgZnJvbSAnLi4vdXRpbHMvbG9nZ2VyJztcblxuLy9jb25zdCBsb2dnZXIgPSBMb2dnZXIubG9nZ2VyKCdpbnB1dEZpbHRlcicpO1xuXG5pbXBvcnQgKiBhcyBkZWJ1ZyBmcm9tICdkZWJ1Z2YnO1xudmFyIGRlYnVncGVyZiA9IGRlYnVnKCdwZXJmJyk7XG52YXIgbG9nZ2VyID0gZGVidWcoJ2lucHV0RmlsdGVyTG9nZ2VyJyk7XG5cbmltcG9ydCB7SUZNb2RlbCBhcyBJRk1vZGVsfSBmcm9tICcuLi9tb2RlbC9pbmRleF9tb2RlbCc7XG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICdhYm90X3V0aWxzJztcblxuLy9pbXBvcnQgKiBhcyBJRk1hdGNoIGZyb20gJy4uL21hdGNoL2lmZXJiYXNlJztcblxuXG4vL2ltcG9ydCAqIGFzIGlucHV0RmlsdGVyUnVsZXMgZnJvbSAnLi9pbnB1dEZpbHRlclJ1bGVzJztcblxuaW1wb3J0ICogYXMgQWxnb2wgZnJvbSAnLi9hbGdvbCc7XG5cbmltcG9ydCAqIGFzIElGTWF0Y2ggZnJvbSAnLi9pZmVyYmFzZSc7XG5pbXBvcnQgKiBhcyBJTWF0Y2ggZnJvbSAnLi9pZmVyYmFzZSc7XG5cbmltcG9ydCB7IEJyZWFrRG93biBhcyBicmVha2Rvd259IGZyb20gJy4uL21vZGVsL2luZGV4X21vZGVsJztcblxuY29uc3QgQW55T2JqZWN0ID0gPGFueT5PYmplY3Q7XG5cbnZhciBkZWJ1Z2xvZyA9IGRlYnVnKCdpbnB1dEZpbHRlcicpXG52YXIgZGVidWdsb2dWID0gZGVidWcoJ2lucHV0VkZpbHRlcicpXG52YXIgZGVidWdsb2dNID0gZGVidWcoJ2lucHV0TUZpbHRlcicpXG5cbmV4cG9ydCBmdW5jdGlvbiBtb2NrRGVidWcobykge1xuICBkZWJ1Z2xvZyA9IG87XG4gIGRlYnVnbG9nViA9IG87XG4gIGRlYnVnbG9nTSA9IG87XG59XG5cblxuLyoqXG4gKiBAcGFyYW0gc1RleHQge3N0cmluZ30gdGhlIHRleHQgdG8gbWF0Y2ggdG8gTmF2VGFyZ2V0UmVzb2x1dGlvblxuICogQHBhcmFtIHNUZXh0MiB7c3RyaW5nfSB0aGUgcXVlcnkgdGV4dCwgZS5nLiBOYXZUYXJnZXRcbiAqXG4gKiBAcmV0dXJuIHRoZSBkaXN0YW5jZSwgbm90ZSB0aGF0IGlzIGlzICpub3QqIHN5bW1ldHJpYyFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbGNEaXN0YW5jZShzVGV4dDE6IHN0cmluZywgc1RleHQyOiBzdHJpbmcpOiBudW1iZXIge1xuICByZXR1cm4gZGlzdGFuY2UuY2FsY0Rpc3RhbmNlQWRqdXN0ZWQoc1RleHQxLHNUZXh0Mik7XG59XG5cblxuZXhwb3J0IGludGVyZmFjZSBJQ250UmVjIHtcbn07XG5cblxudHlwZSBJUnVsZSA9IElGTWF0Y2guSVJ1bGVcblxuXG5leHBvcnQgaW50ZXJmYWNlIElNYXRjaE9wdGlvbnMge1xuICBtYXRjaG90aGVycz86IGJvb2xlYW4sXG4gIGF1Z21lbnQ/OiBib29sZWFuLFxuICBvdmVycmlkZT86IGJvb2xlYW5cbn1cblxuaW50ZXJmYWNlIElNYXRjaENvdW50IHtcbiAgZXF1YWw6IG51bWJlclxuICBkaWZmZXJlbnQ6IG51bWJlclxuICBzcHVyaW91c1I6IG51bWJlclxuICBzcHVyaW91c0w6IG51bWJlclxufVxuXG50eXBlIEVudW1SdWxlVHlwZSA9IElGTW9kZWwuRW51bVJ1bGVUeXBlXG5cbmV4cG9ydCBmdW5jdGlvbiBsZXZlblBlbmFsdHkoaTogbnVtYmVyKTogbnVtYmVyIHtcbiAgLy8gMSAtPiAxXG4gIC8vIGN1dE9mZiA9PiAwLjhcbiAgcmV0dXJuIGk7XG4gIC8vcmV0dXJuICAgMSAtICAoMSAtIGkpICowLjIvQWxnb2wuQ3V0b2ZmX1dvcmRNYXRjaDtcbn1cblxuXG5mdW5jdGlvbiBub25Qcml2YXRlS2V5cyhvQSkge1xuICByZXR1cm4gT2JqZWN0LmtleXMob0EpLmZpbHRlcihrZXkgPT4ge1xuICAgIHJldHVybiBrZXlbMF0gIT09ICdfJztcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb3VudEFpbkIob0EsIG9CLCBmbkNvbXBhcmUsIGFLZXlJZ25vcmU/KTogbnVtYmVyIHtcbiAgYUtleUlnbm9yZSA9IEFycmF5LmlzQXJyYXkoYUtleUlnbm9yZSkgPyBhS2V5SWdub3JlIDpcbiAgICB0eXBlb2YgYUtleUlnbm9yZSA9PT0gXCJzdHJpbmdcIiA/IFthS2V5SWdub3JlXSA6IFtdO1xuICBmbkNvbXBhcmUgPSBmbkNvbXBhcmUgfHwgZnVuY3Rpb24gKCkgeyByZXR1cm4gdHJ1ZTsgfVxuICByZXR1cm4gbm9uUHJpdmF0ZUtleXMob0EpLmZpbHRlcihmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIGFLZXlJZ25vcmUuaW5kZXhPZihrZXkpIDwgMDtcbiAgfSkuXG4gICAgcmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBrZXkpIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob0IsIGtleSkpIHtcbiAgICAgICAgcHJldiA9IHByZXYgKyAoZm5Db21wYXJlKG9BW2tleV0sIG9CW2tleV0sIGtleSkgPyAxIDogMClcbiAgICAgIH1cbiAgICAgIHJldHVybiBwcmV2XG4gICAgfSwgMClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNwdXJpb3VzQW5vdEluQihvQSwgb0IsIGFLZXlJZ25vcmU/KSB7XG4gIGFLZXlJZ25vcmUgPSBBcnJheS5pc0FycmF5KGFLZXlJZ25vcmUpID8gYUtleUlnbm9yZSA6XG4gICAgdHlwZW9mIGFLZXlJZ25vcmUgPT09IFwic3RyaW5nXCIgPyBbYUtleUlnbm9yZV0gOiBbXTtcbiAgcmV0dXJuIG5vblByaXZhdGVLZXlzKG9BKS5maWx0ZXIoZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiBhS2V5SWdub3JlLmluZGV4T2Yoa2V5KSA8IDA7XG4gIH0pLlxuICAgIHJlZHVjZShmdW5jdGlvbiAocHJldiwga2V5KSB7XG4gICAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvQiwga2V5KSkge1xuICAgICAgICBwcmV2ID0gcHJldiArIDFcbiAgICAgIH1cbiAgICAgIHJldHVybiBwcmV2XG4gICAgfSwgMClcbn1cblxuZnVuY3Rpb24gbG93ZXJDYXNlKG8pIHtcbiAgaWYgKHR5cGVvZiBvID09PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIG8udG9Mb3dlckNhc2UoKVxuICB9XG4gIHJldHVybiBvXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wYXJlQ29udGV4dChvQSwgb0IsIGFLZXlJZ25vcmU/KSB7XG4gIHZhciBlcXVhbCA9IGNvdW50QWluQihvQSwgb0IsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBsb3dlckNhc2UoYSkgPT09IGxvd2VyQ2FzZShiKTsgfSwgYUtleUlnbm9yZSk7XG4gIHZhciBkaWZmZXJlbnQgPSBjb3VudEFpbkIob0EsIG9CLCBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gbG93ZXJDYXNlKGEpICE9PSBsb3dlckNhc2UoYik7IH0sIGFLZXlJZ25vcmUpO1xuICB2YXIgc3B1cmlvdXNMID0gc3B1cmlvdXNBbm90SW5CKG9BLCBvQiwgYUtleUlnbm9yZSlcbiAgdmFyIHNwdXJpb3VzUiA9IHNwdXJpb3VzQW5vdEluQihvQiwgb0EsIGFLZXlJZ25vcmUpXG4gIHJldHVybiB7XG4gICAgZXF1YWw6IGVxdWFsLFxuICAgIGRpZmZlcmVudDogZGlmZmVyZW50LFxuICAgIHNwdXJpb3VzTDogc3B1cmlvdXNMLFxuICAgIHNwdXJpb3VzUjogc3B1cmlvdXNSXG4gIH1cbn1cblxuZnVuY3Rpb24gc29ydEJ5UmFuayhhOiBJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZywgYjogSUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmcpOiBudW1iZXIge1xuICB2YXIgciA9IC0oKGEuX3JhbmtpbmcgfHwgMS4wKSAtIChiLl9yYW5raW5nIHx8IDEuMCkpO1xuICBpZiAocikge1xuICAgIHJldHVybiByO1xuICB9XG4gIGlmIChhLmNhdGVnb3J5ICYmIGIuY2F0ZWdvcnkpIHtcbiAgICByID0gYS5jYXRlZ29yeS5sb2NhbGVDb21wYXJlKGIuY2F0ZWdvcnkpO1xuICAgIGlmIChyKSB7XG4gICAgICByZXR1cm4gcjtcbiAgICB9XG4gIH1cbiAgaWYgKGEubWF0Y2hlZFN0cmluZyAmJiBiLm1hdGNoZWRTdHJpbmcpIHtcbiAgICByID0gYS5tYXRjaGVkU3RyaW5nLmxvY2FsZUNvbXBhcmUoYi5tYXRjaGVkU3RyaW5nKTtcbiAgICBpZiAocikge1xuICAgICAgcmV0dXJuIHI7XG4gICAgfVxuICB9XG4gIHJldHVybiAwO1xufVxuLypcbmZ1bmN0aW9uIGNtcEJ5UmFuayhhOiBJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZywgYjogSUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmcpOiBudW1iZXIge1xuICByZXR1cm4gc29ydEJ5UmFuayhhLGIpO1xufVxuKi9cblxuXG5mdW5jdGlvbiBzb3J0QnlSYW5rVGhlblJlc3VsdChhOiBJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZCwgYjogSUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWQpOiBudW1iZXIge1xuICB2YXIgciA9IC0oKGEuX3JhbmtpbmcgfHwgMS4wKSAtIChiLl9yYW5raW5nIHx8IDEuMCkpO1xuICBpZiAocikge1xuICAgIHJldHVybiByO1xuICB9XG4gIGlmIChhLmNhdGVnb3J5ICYmIGIuY2F0ZWdvcnkpIHtcbiAgICByID0gYS5jYXRlZ29yeS5sb2NhbGVDb21wYXJlKGIuY2F0ZWdvcnkpO1xuICAgIGlmIChyKSB7XG4gICAgICByZXR1cm4gcjtcbiAgICB9XG4gIH1cbiAgaWYgKGEubWF0Y2hlZFN0cmluZyAmJiBiLm1hdGNoZWRTdHJpbmcpIHtcbiAgICByID0gYS5tYXRjaGVkU3RyaW5nLmxvY2FsZUNvbXBhcmUoYi5tYXRjaGVkU3RyaW5nKTtcbiAgICBpZiAocikge1xuICAgICAgcmV0dXJuIHI7XG4gICAgfVxuICB9XG4gIHIgPSBjbXBCeVJlc3VsdFRoZW5SYW5rKGEsYik7XG4gIGlmKHIpIHtcbiAgICByZXR1cm4gcjtcbiAgfVxuICByZXR1cm4gMDtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gY21wQnlSZXN1bHQoYTogSUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWQsIGI6IElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkKTogbnVtYmVyIHtcbiAgaWYoYS5ydWxlID09PSBiLnJ1bGUpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuICB2YXIgciA9IGEucnVsZS5iaXRpbmRleCAtIGIucnVsZS5iaXRpbmRleDtcbiAgaWYocikge1xuICAgIHJldHVybiByO1xuICB9XG4gIGlmIChhLnJ1bGUubWF0Y2hlZFN0cmluZyAmJiBiLnJ1bGUubWF0Y2hlZFN0cmluZykge1xuICAgIHIgPSBhLnJ1bGUubWF0Y2hlZFN0cmluZy5sb2NhbGVDb21wYXJlKGIucnVsZS5tYXRjaGVkU3RyaW5nKTtcbiAgICBpZiAocikge1xuICAgICAgcmV0dXJuIHI7XG4gICAgfVxuICB9XG4gIGlmIChhLnJ1bGUuY2F0ZWdvcnkgJiYgYi5ydWxlLmNhdGVnb3J5KSB7XG4gICAgciA9IGEucnVsZS5jYXRlZ29yeS5sb2NhbGVDb21wYXJlKGIucnVsZS5jYXRlZ29yeSk7XG4gICAgaWYgKHIpIHtcbiAgICAgIHJldHVybiByO1xuICAgIH1cbiAgfVxuICBpZiAoYS5ydWxlLndvcmRUeXBlICYmIGIucnVsZS53b3JkVHlwZSkge1xuICAgIHIgPSBhLnJ1bGUud29yZFR5cGUubG9jYWxlQ29tcGFyZShiLnJ1bGUud29yZFR5cGUpO1xuICAgIGlmIChyKSB7XG4gICAgICByZXR1cm4gcjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIDA7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNtcEJ5UmVzdWx0VGhlblJhbmsoYTogSUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWQsIGI6IElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkKTogbnVtYmVyIHtcbiAgdmFyIHIgPSBjbXBCeVJlc3VsdChhLGIpO1xuICBpZiAocikge1xuICAgIHJldHVybiByO1xuICB9XG4gIHZhciByID0gLSgoYS5fcmFua2luZyB8fCAxLjApIC0gKGIuX3JhbmtpbmcgfHwgMS4wKSk7XG4gIGlmIChyKSB7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gVE9ETyBjb25zaWRlciBhIHRpZWJyZWFrZXIgaGVyZVxuICByZXR1cm4gMDtcbn1cblxuZnVuY3Rpb24gYW5hbHlzZVJlZ2V4cChcbiAgcmVzIDogQXJyYXk8SUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+LFxuICBvUnVsZSA6IElGTW9kZWwubVJ1bGUsXG4gIHN0cmluZyA6IHN0cmluZyApXG57XG4gIGRlYnVnbG9nKCgpPT4gXCIgaGVyZSByZWdleHA6IFwiICsgSlNPTi5zdHJpbmdpZnkob1J1bGUsIHVuZGVmaW5lZCwgMikgKyAnXFxuJyArIG9SdWxlLnJlZ2V4cC50b1N0cmluZygpICk7XG4gIHZhciBtID0gb1J1bGUucmVnZXhwLmV4ZWMoc3RyaW5nKTtcbiAgdmFyIHJlYyA9IHVuZGVmaW5lZDtcbiAgaWYgKG0pIHtcbiAgICByZWMgPSB7XG4gICAgICBzdHJpbmc6IHN0cmluZyxcbiAgICAgIG1hdGNoZWRTdHJpbmc6IChvUnVsZS5tYXRjaEluZGV4ICE9PSB1bmRlZmluZWQgJiYgbVtvUnVsZS5tYXRjaEluZGV4XSkgfHwgc3RyaW5nLFxuICAgICAgcnVsZSA6IG9SdWxlLFxuICAgICAgY2F0ZWdvcnk6IG9SdWxlLmNhdGVnb3J5LFxuICAgICAgX3Jhbmtpbmc6IG9SdWxlLl9yYW5raW5nIHx8IDEuMFxuICAgIH07XG4gICAgZGVidWdsb2coKCk9PlwiXFxuIW1hdGNoIHJlZ2V4cCAgXCIgKyBvUnVsZS5yZWdleHAudG9TdHJpbmcoKSArIFwiIFwiICsgcmVjLl9yYW5raW5nLnRvRml4ZWQoMykgKyBcIiAgXCIgKyBzdHJpbmcgKyBcIj1cIiAgKyBvUnVsZS5sb3dlcmNhc2V3b3JkICArIFwiID0+IFwiICsgb1J1bGUubWF0Y2hlZFN0cmluZyArIFwiL1wiICsgb1J1bGUuY2F0ZWdvcnkpO1xuICAgIHJlcy5wdXNoKHJlYyk7XG4gIH1cbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tPbmVSdWxlKHN0cmluZzogc3RyaW5nLCBsY1N0cmluZyA6IHN0cmluZywgZXhhY3QgOiBib29sZWFuLFxucmVzIDogQXJyYXk8SUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+LFxub1J1bGUgOiBJRk1vZGVsLm1SdWxlLCBjbnRSZWM/IDogSUNudFJlYyApIHtcbiAgICBkZWJ1Z2xvZ1YoKCk9PiAnYXR0ZW1wdGluZyB0byBtYXRjaCBydWxlICcgKyBKU09OLnN0cmluZ2lmeShvUnVsZSkgKyBcIiB0byBzdHJpbmcgXFxcIlwiICsgc3RyaW5nICsgXCJcXFwiXCIpO1xuICAgIHN3aXRjaCAob1J1bGUudHlwZSkge1xuICAgICAgY2FzZSBJRk1vZGVsLkVudW1SdWxlVHlwZS5XT1JEOlxuICAgICAgICBpZighb1J1bGUubG93ZXJjYXNld29yZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncnVsZSB3aXRob3V0IGEgbG93ZXJjYXNlIHZhcmlhbnQnICsgSlNPTi5zdHJpbmdpZnkob1J1bGUsIHVuZGVmaW5lZCwgMikpO1xuICAgICAgICAgfTtcbiAgICAgICAgIC8vIFRPRE8gQ0hFQ0sgVEhJU1xuICAgICAgICBpZiAoZXhhY3QgJiYgKG9SdWxlLndvcmQgPT09IHN0cmluZyB8fCBvUnVsZS5sb3dlcmNhc2V3b3JkID09PSBsY1N0cmluZykpIHtcbiAgLy8gICAgICBpZiAoZXhhY3QgJiYgb1J1bGUud29yZCA9PT0gc3RyaW5nIHx8IG9SdWxlLmxvd2VyY2FzZXdvcmQgPT09IGxjU3RyaW5nKSB7XG4gICAgICAgICAgZGVidWdsb2coKCk9PlwiXFxuIW1hdGNoZWQgZXhhY3QgXCIgKyBzdHJpbmcgKyBcIj1cIiAgKyBvUnVsZS5sb3dlcmNhc2V3b3JkICArIFwiID0+IFwiICsgb1J1bGUubWF0Y2hlZFN0cmluZyArIFwiL1wiICsgb1J1bGUuY2F0ZWdvcnkpO1xuICAgICAgICAgIHJlcy5wdXNoKHtcbiAgICAgICAgICAgIHN0cmluZzogc3RyaW5nLFxuICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogb1J1bGUubWF0Y2hlZFN0cmluZyxcbiAgICAgICAgICAgIGNhdGVnb3J5OiBvUnVsZS5jYXRlZ29yeSxcbiAgICAgICAgICAgIF9yYW5raW5nOiBvUnVsZS5fcmFua2luZyB8fCAxLjBcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICAgIGlmICghZXhhY3QgJiYgIW9SdWxlLmV4YWN0T25seSkge1xuICAgICAgICAgIHZhciBsZXZlbm1hdGNoID0gY2FsY0Rpc3RhbmNlKG9SdWxlLmxvd2VyY2FzZXdvcmQsIGxjU3RyaW5nKTtcblxuLypcbiAgICAgICAgICBhZGRDbnRSZWMoY250UmVjLFwiY2FsY0Rpc3RhbmNlXCIsIDEpO1xuICAgICAgICAgIGlmKGxldmVubWF0Y2ggPCA1MCkge1xuICAgICAgICAgICAgYWRkQ250UmVjKGNudFJlYyxcImNhbGNEaXN0YW5jZUV4cFwiLCAxKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYobGV2ZW5tYXRjaCA8IDQwMDAwKSB7XG4gICAgICAgICAgICBhZGRDbnRSZWMoY250UmVjLFwiY2FsY0Rpc3RhbmNlQmVsb3c0MGtcIiwgMSk7XG4gICAgICAgICAgfVxuICAgICAgICAgICovXG4gICAgICAgICAgLy9pZihvUnVsZS5sb3dlcmNhc2V3b3JkID09PSBcImNvc21vc1wiKSB7XG4gICAgICAgICAgLy8gIGNvbnNvbGUubG9nKFwiaGVyZSByYW5raW5nIFwiICsgbGV2ZW5tYXRjaCArIFwiIFwiICsgb1J1bGUubG93ZXJjYXNld29yZCArIFwiIFwiICsgbGNTdHJpbmcpO1xuICAgICAgICAgIC8vfVxuICAgICAgICAgIGlmIChsZXZlbm1hdGNoID49IEFsZ29sLkN1dG9mZl9Xb3JkTWF0Y2gpIHsgLy8gbGV2ZW5DdXRvZmYpIHtcbiAgICAgICAgICAgIGFkZENudFJlYyhjbnRSZWMsXCJjYWxjRGlzdGFuY2VPa1wiLCAxKTtcbiAgICAgICAgICAgIHZhciByZWMgPSB7XG4gICAgICAgICAgICAgIHN0cmluZzogc3RyaW5nLFxuICAgICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBvUnVsZS5tYXRjaGVkU3RyaW5nLFxuICAgICAgICAgICAgICBjYXRlZ29yeTogb1J1bGUuY2F0ZWdvcnksXG4gICAgICAgICAgICAgIF9yYW5raW5nOiAob1J1bGUuX3JhbmtpbmcgfHwgMS4wKSAqIGxldmVuUGVuYWx0eShsZXZlbm1hdGNoKSxcbiAgICAgICAgICAgICAgbGV2ZW5tYXRjaDogbGV2ZW5tYXRjaFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGRlYnVnbG9nKCgpPT5cIlxcbiFmdXp6eSBcIiArIChsZXZlbm1hdGNoKS50b0ZpeGVkKDMpICsgXCIgXCIgKyByZWMuX3JhbmtpbmcudG9GaXhlZCgzKSArIFwiICBcIiArIHN0cmluZyArIFwiPVwiICArIG9SdWxlLmxvd2VyY2FzZXdvcmQgICsgXCIgPT4gXCIgKyBvUnVsZS5tYXRjaGVkU3RyaW5nICsgXCIvXCIgKyBvUnVsZS5jYXRlZ29yeSk7XG4gICAgICAgICAgICByZXMucHVzaChyZWMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgSUZNb2RlbC5FbnVtUnVsZVR5cGUuUkVHRVhQOiB7XG4gICAgICAgIGFuYWx5c2VSZWdleHAoIHJlcywgb1J1bGUsIHN0cmluZyApO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIC8vYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmtub3duIHR5cGVcIiArIEpTT04uc3RyaW5naWZ5KG9SdWxlLCB1bmRlZmluZWQsIDIpKVxuICAgIH1cbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja09uZVJ1bGVXaXRoT2Zmc2V0KHN0cmluZzogc3RyaW5nLCBsY1N0cmluZyA6IHN0cmluZywgZXhhY3QgOiBib29sZWFuLFxucmVzIDogQXJyYXk8SU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZD4sXG5vUnVsZSA6IElGTW9kZWwubVJ1bGUsIGNudFJlYz8gOiBJQ250UmVjICkge1xuICAgIGRlYnVnbG9nVigoKT0+J2F0dGVtcHRpbmcgdG8gbWF0Y2ggcnVsZSAnICsgSlNPTi5zdHJpbmdpZnkob1J1bGUpICsgXCIgdG8gc3RyaW5nIFxcXCJcIiArIHN0cmluZyArIFwiXFxcIlwiKTtcbiAgICBzd2l0Y2ggKG9SdWxlLnR5cGUpIHtcbiAgICAgIGNhc2UgSUZNb2RlbC5FbnVtUnVsZVR5cGUuV09SRDpcbiAgICAgICAgaWYoIW9SdWxlLmxvd2VyY2FzZXdvcmQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3J1bGUgd2l0aG91dCBhIGxvd2VyY2FzZSB2YXJpYW50JyArIEpTT04uc3RyaW5naWZ5KG9SdWxlLCB1bmRlZmluZWQsIDIpKTtcbiAgICAgICAgIH07XG4gICAgICAgIGlmIChleGFjdCAmJiAob1J1bGUud29yZCA9PT0gc3RyaW5nIHx8IG9SdWxlLmxvd2VyY2FzZXdvcmQgPT09IGxjU3RyaW5nKSkge1xuICAgICAgICAgIGRlYnVnbG9nKCgpPT4gXCJcXG4hbWF0Y2hlZCBleGFjdCBcIiArIHN0cmluZyArIFwiPVwiICArIG9SdWxlLmxvd2VyY2FzZXdvcmQgICsgXCIgPT4gXCIgKyBvUnVsZS5tYXRjaGVkU3RyaW5nICsgXCIvXCIgKyBvUnVsZS5jYXRlZ29yeSk7XG4gICAgICAgICAgcmVzLnB1c2goe1xuICAgICAgICAgICAgc3RyaW5nOiBzdHJpbmcsXG4gICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBvUnVsZS5tYXRjaGVkU3RyaW5nLFxuICAgICAgICAgICAgY2F0ZWdvcnk6IG9SdWxlLmNhdGVnb3J5LFxuICAgICAgICAgICAgcnVsZTogb1J1bGUsXG4gICAgICAgICAgICBfcmFua2luZzogb1J1bGUuX3JhbmtpbmcgfHwgMS4wXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWV4YWN0ICYmICFvUnVsZS5leGFjdE9ubHkpIHtcbiAgICAgICAgICB2YXIgbGV2ZW5tYXRjaCA9IGNhbGNEaXN0YW5jZShvUnVsZS5sb3dlcmNhc2V3b3JkLCBsY1N0cmluZyk7XG5cbi8qXG4gICAgICAgICAgYWRkQ250UmVjKGNudFJlYyxcImNhbGNEaXN0YW5jZVwiLCAxKTtcbiAgICAgICAgICBpZihsZXZlbm1hdGNoIDwgNTApIHtcbiAgICAgICAgICAgIGFkZENudFJlYyhjbnRSZWMsXCJjYWxjRGlzdGFuY2VFeHBcIiwgMSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKGxldmVubWF0Y2ggPCA0MDAwMCkge1xuICAgICAgICAgICAgYWRkQ250UmVjKGNudFJlYyxcImNhbGNEaXN0YW5jZUJlbG93NDBrXCIsIDEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAqL1xuICAgICAgICAgIC8vaWYob1J1bGUubG93ZXJjYXNld29yZCA9PT0gXCJjb3Ntb3NcIikge1xuICAgICAgICAgIC8vICBjb25zb2xlLmxvZyhcImhlcmUgcmFua2luZyBcIiArIGxldmVubWF0Y2ggKyBcIiBcIiArIG9SdWxlLmxvd2VyY2FzZXdvcmQgKyBcIiBcIiArIGxjU3RyaW5nKTtcbiAgICAgICAgICAvL31cbiAgICAgICAgICBpZiAobGV2ZW5tYXRjaCA+PSBBbGdvbC5DdXRvZmZfV29yZE1hdGNoKSB7IC8vIGxldmVuQ3V0b2ZmKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiZm91bmQgcmVjXCIpO1xuICAgICAgICAgICAgYWRkQ250UmVjKGNudFJlYyxcImNhbGNEaXN0YW5jZU9rXCIsIDEpO1xuICAgICAgICAgICAgdmFyIHJlYyA9IHtcbiAgICAgICAgICAgICAgc3RyaW5nOiBzdHJpbmcsXG4gICAgICAgICAgICAgIHJ1bGUgOiBvUnVsZSxcbiAgICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogb1J1bGUubWF0Y2hlZFN0cmluZyxcbiAgICAgICAgICAgICAgY2F0ZWdvcnk6IG9SdWxlLmNhdGVnb3J5LFxuICAgICAgICAgICAgICBfcmFua2luZzogKG9SdWxlLl9yYW5raW5nIHx8IDEuMCkgKiBsZXZlblBlbmFsdHkobGV2ZW5tYXRjaCksXG4gICAgICAgICAgICAgIGxldmVubWF0Y2g6IGxldmVubWF0Y2hcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBkZWJ1Z2xvZygoKSA9PlwiXFxuIUNPUk86IGZ1enp5IFwiICsgKGxldmVubWF0Y2gpLnRvRml4ZWQoMykgKyBcIiBcIiArIHJlYy5fcmFua2luZy50b0ZpeGVkKDMpICsgXCIgIFxcXCJcIiArIHN0cmluZyArIFwiXFxcIj1cIiAgKyBvUnVsZS5sb3dlcmNhc2V3b3JkICArIFwiID0+IFwiICsgb1J1bGUubWF0Y2hlZFN0cmluZyArIFwiL1wiICsgb1J1bGUuY2F0ZWdvcnkgKyBcIi9cIiArIG9SdWxlLmJpdGluZGV4KTtcbiAgICAgICAgICAgIHJlcy5wdXNoKHJlYyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBJRk1vZGVsLkVudW1SdWxlVHlwZS5SRUdFWFA6IHtcbiAgICAgICAgYW5hbHlzZVJlZ2V4cCggcmVzLCBvUnVsZSwgc3RyaW5nICk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgLy9icmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInVua25vd24gdHlwZVwiICsgSlNPTi5zdHJpbmdpZnkob1J1bGUsIHVuZGVmaW5lZCwgMikpXG4gICAgfVxufVxuXG5cbmZ1bmN0aW9uIGFkZENudFJlYyhjbnRSZWMgOiBJQ250UmVjLCBtZW1iZXIgOiBzdHJpbmcsIG51bWJlciA6IG51bWJlcikge1xuICBpZigoIWNudFJlYykgfHwgKG51bWJlciA9PT0gMCkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY250UmVjW21lbWJlcl0gPSAoY250UmVjW21lbWJlcl0gfHwgMCkgKyBudW1iZXI7XG59XG5cbi8qXG5leHBvcnQgZnVuY3Rpb24gY2F0ZWdvcml6ZVN0cmluZyh3b3JkOiBzdHJpbmcsIGV4YWN0OiBib29sZWFuLCBvUnVsZXM6IEFycmF5PElGTW9kZWwubVJ1bGU+LFxuIGNudFJlYz8gOiBJQ250UmVjKTogQXJyYXk8SUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+IHtcbiAgLy8gc2ltcGx5IGFwcGx5IGFsbCBydWxlc1xuICBkZWJ1Z2xvZ1YoKCkgPT4gXCJydWxlcyA6IFwiICsgSlNPTi5zdHJpbmdpZnkob1J1bGVzLCB1bmRlZmluZWQsIDIpKTtcblxuICB2YXIgbGNTdHJpbmcgPSB3b3JkLnRvTG93ZXJDYXNlKCk7XG4gIHZhciByZXM6IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nPiA9IFtdXG4gIG9SdWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChvUnVsZSkge1xuICAgIGNoZWNrT25lUnVsZSh3b3JkLGxjU3RyaW5nLGV4YWN0LHJlcyxvUnVsZSxjbnRSZWMpO1xuICB9KTtcbiAgcmVzLnNvcnQoc29ydEJ5UmFuayk7XG4gIHJldHVybiByZXM7XG59XG4qL1xuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNhdGVnb3JpemVTaW5nbGVXb3JkV2l0aE9mZnNldCh3b3JkOiBzdHJpbmcsIGxjd29yZCA6IHN0cmluZywgZXhhY3Q6IGJvb2xlYW4sIG9SdWxlczogQXJyYXk8SUZNb2RlbC5tUnVsZT4sXG4gY250UmVjPyA6IElDbnRSZWMpOiBBcnJheTxJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZD4ge1xuICAvLyBzaW1wbHkgYXBwbHkgYWxsIHJ1bGVzXG4gIGRlYnVnbG9nVigoKT0+IFwicnVsZXMgOiBcIiArIEpTT04uc3RyaW5naWZ5KG9SdWxlcywgdW5kZWZpbmVkLCAyKSk7XG4gIHZhciByZXM6IEFycmF5PElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWQ+ID0gW11cbiAgb1J1bGVzLmZvckVhY2goZnVuY3Rpb24gKG9SdWxlKSB7XG4gICAgY2hlY2tPbmVSdWxlV2l0aE9mZnNldCh3b3JkLGxjd29yZCxleGFjdCxyZXMsb1J1bGUsY250UmVjKTtcbiAgfSk7XG4gIGRlYnVnbG9nKGBDU1dXTzogZ290IHJlc3VsdHMgZm9yICR7bGN3b3JkfSAgJHtyZXMubGVuZ3RofWApO1xuICByZXMuc29ydChzb3J0QnlSYW5rKTtcbiAgcmV0dXJuIHJlcztcbn1cblxuLypcbmV4cG9ydCBmdW5jdGlvbiBwb3N0RmlsdGVyKHJlcyA6IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nPikgOiBBcnJheTxJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZz4ge1xuICByZXMuc29ydChzb3J0QnlSYW5rKTtcbiAgdmFyIGJlc3RSYW5rID0gMDtcbiAgLy9jb25zb2xlLmxvZyhcIlxcbnBpbHRlcmVkIFwiICsgSlNPTi5zdHJpbmdpZnkocmVzKSk7XG4gICAgZGVidWdsb2coKCk9PiBcInByZUZpbHRlciA6IFxcblwiICsgcmVzLm1hcChmdW5jdGlvbih3b3JkLGluZGV4KSB7XG4gICAgICByZXR1cm4gYCR7aW5kZXh9ICR7d29yZC5fcmFua2luZ30gID0+IFwiJHt3b3JkLmNhdGVnb3J5fVwiICR7d29yZC5tYXRjaGVkU3RyaW5nfWA7XG4gICAgfSkuam9pbihcIlxcblwiKSk7XG4gIHZhciByID0gcmVzLmZpbHRlcihmdW5jdGlvbihyZXN4LGluZGV4KSB7XG4gICAgaWYoaW5kZXggPT09IDApIHtcbiAgICAgIGJlc3RSYW5rID0gcmVzeC5fcmFua2luZztcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvLyAxLTAuOSA9IDAuMVxuICAgIC8vIDEtIDAuOTMgPSAwLjdcbiAgICAvLyAxLzdcbiAgICB2YXIgZGVsdGEgPSBiZXN0UmFuayAvIHJlc3guX3Jhbmtpbmc7XG4gICAgaWYoKHJlc3gubWF0Y2hlZFN0cmluZyA9PT0gcmVzW2luZGV4LTFdLm1hdGNoZWRTdHJpbmcpXG4gICAgICAmJiAocmVzeC5jYXRlZ29yeSA9PT0gcmVzW2luZGV4LTFdLmNhdGVnb3J5KVxuICAgICAgKSB7XG4gICAgICAgIGRlYnVnbG9nKCdwb3N0ZmlsdGVyIGlnbm9yaW5nIGJpdGluaWRleCEhIScpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvL2NvbnNvbGUubG9nKFwiXFxuIGRlbHRhIGZvciBcIiArIGRlbHRhICsgXCIgIFwiICsgcmVzeC5fcmFua2luZyk7XG4gICAgaWYgKHJlc3gubGV2ZW5tYXRjaCAmJiAoZGVsdGEgPiAxLjAzKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG4gIGRlYnVnbG9nKCgpPT4gYFxcbmZpbHRlcmVkICR7ci5sZW5ndGh9LyR7cmVzLmxlbmd0aH1gICsgSlNPTi5zdHJpbmdpZnkocikpO1xuICByZXR1cm4gcjtcbn1cbiovXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGRyb3BMb3dlclJhbmtlZEVxdWFsUmVzdWx0KHJlcyA6IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkPikgOiBBcnJheTxJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZD4ge1xuICByZXMuc29ydChjbXBCeVJlc3VsdFRoZW5SYW5rKTtcbiAgcmV0dXJuIHJlcy5maWx0ZXIoZnVuY3Rpb24ocmVzeCxpbmRleCkge1xuICAgIHZhciBwcmlvciA9IHJlc1tpbmRleC0xXTtcbiAgICBpZiggcHJpb3IgJiZcbiAgICAgICAgIShyZXN4LnJ1bGUgJiYgcmVzeC5ydWxlLnJhbmdlKVxuICAgICAmJiAhKHJlc1tpbmRleC0xXS5ydWxlICYmIHJlc1tpbmRleC0xXS5ydWxlLnJhbmdlKVxuICAgICAmJiAocmVzeC5tYXRjaGVkU3RyaW5nID09PSBwcmlvci5tYXRjaGVkU3RyaW5nKVxuICAgICAmJiAocmVzeC5ydWxlLmJpdGluZGV4ID09PSBwcmlvci5ydWxlLmJpdGluZGV4KVxuICAgICAmJiAocmVzeC5ydWxlLndvcmRUeXBlID09PSBwcmlvci5ydWxlLndvcmRUeXBlKVxuICAgICAmJiAocmVzeC5jYXRlZ29yeSA9PT0gcmVzW2luZGV4LTFdLmNhdGVnb3J5KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHBvc3RGaWx0ZXJXaXRoT2Zmc2V0KHJlcyA6IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkPikgOiBBcnJheTxJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZD4ge1xuICAvLyBmb3IgZmlsdGVyaW5nLCB3ZSBuZWVkIHRvIGdldCAqZXF1YWwgcnVsZSByZXN1bHRzIGNsb3NlIHRvZ2V0aGVyXG4gIC8vID0+XG4gIC8vXG5cbiAgcmVzLnNvcnQoc29ydEJ5UmFuayk7XG4gIHZhciBiZXN0UmFuayA9IDA7XG4gIC8vY29uc29sZS5sb2coXCJcXG5waWx0ZXJlZCBcIiArIEpTT04uc3RyaW5naWZ5KHJlcykpO1xuICBkZWJ1Z2xvZygoKT0+XCIgcHJlRmlsdGVyIDogXFxuXCIgKyByZXMubWFwKGZ1bmN0aW9uKHdvcmQpIHtcbiAgICAgIHJldHVybiBgICR7d29yZC5fcmFua2luZ30gID0+IFwiJHt3b3JkLmNhdGVnb3J5fVwiICR7d29yZC5tYXRjaGVkU3RyaW5nfSBgO1xuICAgIH0pLmpvaW4oXCJcXG5cIikpO1xuICB2YXIgciA9IHJlcy5maWx0ZXIoZnVuY3Rpb24ocmVzeCxpbmRleCkge1xuICAgIGlmKGluZGV4ID09PSAwKSB7XG4gICAgICBiZXN0UmFuayA9IHJlc3guX3Jhbmtpbmc7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLy8gMS0wLjkgPSAwLjFcbiAgICAvLyAxLSAwLjkzID0gMC43XG4gICAgLy8gMS83XG4gICAgdmFyIGRlbHRhID0gYmVzdFJhbmsgLyByZXN4Ll9yYW5raW5nO1xuICAgIHZhciBwcmlvciA9IHJlc1tpbmRleC0xXTtcbiAgICBpZihcbiAgICAgICAgIShyZXN4LnJ1bGUgJiYgcmVzeC5ydWxlLnJhbmdlKVxuICAgICAmJiAhKHJlc1tpbmRleC0xXS5ydWxlICYmIHJlc1tpbmRleC0xXS5ydWxlLnJhbmdlKVxuICAgICAmJiAocmVzeC5tYXRjaGVkU3RyaW5nID09PSBwcmlvci5tYXRjaGVkU3RyaW5nKVxuICAgICAmJiAocmVzeC5ydWxlLmJpdGluZGV4ID09PSBwcmlvci5ydWxlLmJpdGluZGV4KVxuICAgICAmJiAocmVzeC5ydWxlLndvcmRUeXBlID09PSBwcmlvci5ydWxlLndvcmRUeXBlKVxuICAgICAmJiAocmVzeC5jYXRlZ29yeSA9PT0gcmVzW2luZGV4LTFdLmNhdGVnb3J5KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvL2NvbnNvbGUubG9nKFwiXFxuIGRlbHRhIGZvciBcIiArIGRlbHRhICsgXCIgIFwiICsgcmVzeC5fcmFua2luZyk7XG4gICAgaWYgKHJlc3gubGV2ZW5tYXRjaCAmJiAoZGVsdGEgPiAxLjAzKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG4gIHIgPSBkcm9wTG93ZXJSYW5rZWRFcXVhbFJlc3VsdChyZXMpO1xuICByLnNvcnQoc29ydEJ5UmFua1RoZW5SZXN1bHQpO1xuICBkZWJ1Z2xvZygoKT0+YFxcbmZpbHRlcmVkICR7ci5sZW5ndGh9LyR7cmVzLmxlbmd0aH1gICsgSlNPTi5zdHJpbmdpZnkocikpO1xuICByZXR1cm4gcjtcbn1cblxuLypcbmV4cG9ydCBmdW5jdGlvbiBjYXRlZ29yaXplU3RyaW5nMih3b3JkOiBzdHJpbmcsIGV4YWN0OiBib29sZWFuLCAgcnVsZXMgOiBJRk1hdGNoLlNwbGl0UnVsZXNcbiAgLCBjbnRSZWM/IDogSUNudFJlYyk6IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nPiB7XG4gIC8vIHNpbXBseSBhcHBseSBhbGwgcnVsZXNcbiAgaWYgKGRlYnVnbG9nTS5lbmFibGVkICkgIHtcbiAgICAvLyBUT0RPIHRoaXNpcyBjaXJ1Y2xhciAhIGRlYnVnbG9nTShcInJ1bGVzIDogXCIgKyBKU09OLnN0cmluZ2lmeShydWxlcyx1bmRlZmluZWQsIDIpKTtcbiAgfVxuICB2YXIgdSA9IDE7XG4gIGlmKCB1ID09PSAxKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjYXRlZ29yaXplZCBTdHJpbmcyJyk7XG5cbiAgfVxuICB2YXIgbGNTdHJpbmcgPSB3b3JkLnRvTG93ZXJDYXNlKCk7XG4gIHZhciByZXM6IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nPiA9IFtdO1xuICBpZiAoZXhhY3QpIHtcbiAgICB2YXIgciA9IHJ1bGVzLndvcmRNYXBbbGNTdHJpbmddO1xuICAgIGlmIChyKSB7XG4gICAgICByLnJ1bGVzLmZvckVhY2goZnVuY3Rpb24ob1J1bGUpIHtcbiAgICAgICAgcmVzLnB1c2goe1xuICAgICAgICAgICAgc3RyaW5nOiB3b3JkLFxuICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogb1J1bGUubWF0Y2hlZFN0cmluZyxcbiAgICAgICAgICAgIGNhdGVnb3J5OiBvUnVsZS5jYXRlZ29yeSxcbiAgICAgICAgICAgIF9yYW5raW5nOiBvUnVsZS5fcmFua2luZyB8fCAxLjBcbiAgICAgICAgICB9KVxuICAgICB9KTtcbiAgICB9XG4gICAgcnVsZXMubm9uV29yZFJ1bGVzLmZvckVhY2goZnVuY3Rpb24gKG9SdWxlKSB7XG4gICAgICBjaGVja09uZVJ1bGUod29yZCxsY1N0cmluZyxleGFjdCxyZXMsb1J1bGUsY250UmVjKTtcbiAgICB9KTtcbiAgICByZXMuc29ydChzb3J0QnlSYW5rKTtcbiAgICByZXR1cm4gcmVzO1xuICB9IGVsc2Uge1xuICAgIGRlYnVnbG9nKCgpPT5cImNhdGVnb3JpemUgbm9uIGV4YWN0XCIgKyB3b3JkICsgXCIgeHggIFwiICsgcnVsZXMuYWxsUnVsZXMubGVuZ3RoKTtcbiAgICByZXR1cm4gcG9zdEZpbHRlcihjYXRlZ29yaXplU3RyaW5nKHdvcmQsIGV4YWN0LCBydWxlcy5hbGxSdWxlcywgY250UmVjKSk7XG4gIH1cbn1cbiovXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNhdGVnb3JpemVXb3JkSW50ZXJuYWxXaXRoT2Zmc2V0cyh3b3JkOiBzdHJpbmcsIGxjd29yZCA6IHN0cmluZywgZXhhY3Q6IGJvb2xlYW4sICBydWxlcyA6IElNYXRjaC5TcGxpdFJ1bGVzXG4gICwgY250UmVjPyA6SUNudFJlYyk6IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkPiB7XG5cbiAgZGVidWdsb2dNKFwiY2F0ZWdvcml6ZSAgQ1dJV09cIiArIGxjd29yZCArIFwiIHdpdGggb2Zmc2V0ISEhISEhISEhISEhISEhISFcIiArIGV4YWN0KVxuICAvLyBzaW1wbHkgYXBwbHkgYWxsIHJ1bGVzXG4gIGlmIChkZWJ1Z2xvZ1YuZW5hYmxlZCApICB7XG4gICAgLy8gVE9ETyB0aGlzIGlzIGNpcmN1bGFyOiBkZWJ1Z2xvZ1YoXCJydWxlcyA6IFwiICsgSlNPTi5zdHJpbmdpZnkocnVsZXMsdW5kZWZpbmVkLCAyKSk7XG4gIH1cbiAgdmFyIHJlczogQXJyYXk8SU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZD4gPSBbXTtcbiAgaWYgKGV4YWN0KSB7XG4gICAgdmFyIHIgPSBydWxlcy53b3JkTWFwW2xjd29yZF07XG4gICAgaWYgKHIpIHtcbiAgICAgIGRlYnVnbG9nTShkZWJ1Z2xvZ00uZW5hYmxlZCA/IGAgLi4uLnB1c2hpbmcgbiBydWxlcyBleGFjdCBmb3IgJHtsY3dvcmR9OmAgKyByLnJ1bGVzLmxlbmd0aCA6ICctJyk7XG4gICAgICBkZWJ1Z2xvZ00oZGVidWdsb2dNLmVuYWJsZWQgPyByLnJ1bGVzLm1hcCgocixpbmRleCk9PiAnJyArIGluZGV4ICsgJyAnICsgSlNPTi5zdHJpbmdpZnkocikpLmpvaW4oXCJcXG5cIikgOiAnLScpO1xuICAgICAgci5ydWxlcy5mb3JFYWNoKGZ1bmN0aW9uKG9SdWxlKSB7XG4gICAgICAgIHJlcy5wdXNoKHtcbiAgICAgICAgICAgIHN0cmluZzogd29yZCxcbiAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IG9SdWxlLm1hdGNoZWRTdHJpbmcsXG4gICAgICAgICAgICBjYXRlZ29yeTogb1J1bGUuY2F0ZWdvcnksXG4gICAgICAgICAgICBydWxlOiBvUnVsZSxcbiAgICAgICAgICAgIF9yYW5raW5nOiBvUnVsZS5fcmFua2luZyB8fCAxLjBcbiAgICAgICAgICB9KVxuICAgICB9KTtcbiAgICB9XG4gICAgcnVsZXMubm9uV29yZFJ1bGVzLmZvckVhY2goZnVuY3Rpb24gKG9SdWxlKSB7XG4gICAgICBjaGVja09uZVJ1bGVXaXRoT2Zmc2V0KHdvcmQsbGN3b3JkLCBleGFjdCxyZXMsb1J1bGUsY250UmVjKTtcbiAgICB9KTtcbiAgICByZXMgPSBwb3N0RmlsdGVyV2l0aE9mZnNldChyZXMpO1xuICAgIGRlYnVnbG9nKCgpPT5cImhlcmUgcmVzdWx0cyBleGFjdCBmb3IgXCIgKyB3b3JkICsgXCIgcmVzIFwiICsgcmVzLmxlbmd0aCk7XG4gICAgZGVidWdsb2dNKCgpPT5cImhlcmUgcmVzdWx0cyBleGFjdCBmb3IgXCIgKyB3b3JkICsgXCIgcmVzIFwiICsgcmVzLmxlbmd0aCk7XG4gICAgcmVzLnNvcnQoc29ydEJ5UmFuayk7XG4gICAgcmV0dXJuIHJlcztcbiAgfSBlbHNlIHtcbiAgICBkZWJ1Z2xvZyhcImNhdGVnb3JpemUgbm9uIGV4YWN0IFxcXCJcIiArIHdvcmQgKyBcIlxcXCIgICAgXCIgKyBydWxlcy5hbGxSdWxlcy5sZW5ndGgpO1xuICAgIHZhciByciA9IGNhdGVnb3JpemVTaW5nbGVXb3JkV2l0aE9mZnNldCh3b3JkLGxjd29yZCwgZXhhY3QsIHJ1bGVzLmFsbFJ1bGVzLCBjbnRSZWMpO1xuICAgIC8vZGVidWxvZ00oXCJmdXp6eSByZXMgXCIgKyBKU09OLnN0cmluZ2lmeShycikpO1xuICAgIHJldHVybiBwb3N0RmlsdGVyV2l0aE9mZnNldChycik7XG4gIH1cbn1cblxuXG5cbi8qKlxuICpcbiAqIE9wdGlvbnMgbWF5IGJlIHtcbiAqIG1hdGNob3RoZXJzIDogdHJ1ZSwgID0+IG9ubHkgcnVsZXMgd2hlcmUgYWxsIG90aGVycyBtYXRjaCBhcmUgY29uc2lkZXJlZFxuICogYXVnbWVudCA6IHRydWUsXG4gKiBvdmVycmlkZSA6IHRydWUgfSAgPT5cbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaFdvcmQob1J1bGU6IElGTW9kZWwuSVJ1bGUsIGNvbnRleHQ6IElGTWF0Y2guY29udGV4dCwgb3B0aW9ucz86IElNYXRjaE9wdGlvbnMpIHtcbiAgaWYgKGNvbnRleHRbb1J1bGUua2V5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICB2YXIgczEgPSBjb250ZXh0W29SdWxlLmtleV0udG9Mb3dlckNhc2UoKVxuICB2YXIgczIgPSBvUnVsZS53b3JkLnRvTG93ZXJDYXNlKCk7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gIHZhciBkZWx0YSA9IGNvbXBhcmVDb250ZXh0KGNvbnRleHQsIG9SdWxlLmZvbGxvd3MsIG9SdWxlLmtleSlcbiAgZGVidWdsb2dWKCgpPT5KU09OLnN0cmluZ2lmeShkZWx0YSkpO1xuICBkZWJ1Z2xvZ1YoKCk9PkpTT04uc3RyaW5naWZ5KG9wdGlvbnMpKTtcbiAgaWYgKG9wdGlvbnMubWF0Y2hvdGhlcnMgJiYgKGRlbHRhLmRpZmZlcmVudCA+IDApKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuICB9XG4gIHZhciBjOiBudW1iZXIgPSBjYWxjRGlzdGFuY2UoczIsIHMxKTtcbiAgZGVidWdsb2dWKCgpID0+IFwiIHMxIDw+IHMyIFwiICsgczEgKyBcIjw+XCIgKyBzMiArIFwiICA9PjogXCIgKyBjKTtcbiAgaWYgKGMgPiAwLjgwKSB7XG4gICAgdmFyIHJlcyA9IEFueU9iamVjdC5hc3NpZ24oe30sIG9SdWxlLmZvbGxvd3MpIGFzIGFueTtcbiAgICByZXMgPSBBbnlPYmplY3QuYXNzaWduKHJlcywgY29udGV4dCk7XG4gICAgaWYgKG9wdGlvbnMub3ZlcnJpZGUpIHtcbiAgICAgIHJlcyA9IEFueU9iamVjdC5hc3NpZ24ocmVzLCBvUnVsZS5mb2xsb3dzKTtcbiAgICB9XG4gICAgLy8gZm9yY2Uga2V5IHByb3BlcnR5XG4gICAgLy8gY29uc29sZS5sb2coJyBvYmplY3RjYXRlZ29yeScsIHJlc1snc3lzdGVtT2JqZWN0Q2F0ZWdvcnknXSk7XG4gICAgcmVzW29SdWxlLmtleV0gPSBvUnVsZS5mb2xsb3dzW29SdWxlLmtleV0gfHwgcmVzW29SdWxlLmtleV07XG4gICAgcmVzLl93ZWlnaHQgPSBBbnlPYmplY3QuYXNzaWduKHt9LCByZXMuX3dlaWdodCk7XG4gICAgcmVzLl93ZWlnaHRbb1J1bGUua2V5XSA9IGM7XG4gICAgT2JqZWN0LmZyZWV6ZShyZXMpO1xuICAgIGRlYnVnbG9nKCgpPT4nRm91bmQgb25lJyArIEpTT04uc3RyaW5naWZ5KHJlcywgdW5kZWZpbmVkLCAyKSk7XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEFyZ3NNYXAobWF0Y2g6IEFycmF5PHN0cmluZz4sIGFyZ3NNYXA6IHsgW2tleTogbnVtYmVyXTogc3RyaW5nIH0pOiBJRk1hdGNoLmNvbnRleHQge1xuICB2YXIgcmVzID0ge30gYXMgSUZNYXRjaC5jb250ZXh0O1xuICBpZiAoIWFyZ3NNYXApIHtcbiAgICByZXR1cm4gcmVzO1xuICB9XG4gIE9iamVjdC5rZXlzKGFyZ3NNYXApLmZvckVhY2goZnVuY3Rpb24gKGlLZXkpIHtcbiAgICB2YXIgdmFsdWUgPSBtYXRjaFtpS2V5XVxuICAgIHZhciBrZXkgPSBhcmdzTWFwW2lLZXldO1xuICAgIGlmICgodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSAmJiB2YWx1ZS5sZW5ndGggPiAwKSB7XG4gICAgICByZXNba2V5XSA9IHZhbHVlXG4gICAgfVxuICB9XG4gICk7XG4gIHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBjb25zdCBSYW5rV29yZCA9IHtcbiAgaGFzQWJvdmU6IGZ1bmN0aW9uIChsc3Q6IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nPiwgYm9yZGVyOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gIWxzdC5ldmVyeShmdW5jdGlvbiAob01lbWJlcikge1xuICAgICAgcmV0dXJuIChvTWVtYmVyLl9yYW5raW5nIDwgYm9yZGVyKTtcbiAgICB9KTtcbiAgfSxcblxuICB0YWtlRmlyc3ROOiBmdW5jdGlvbjxUIGV4dGVuZHMgSUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+IChsc3Q6IEFycmF5PFQ+LCBuOiBudW1iZXIpOiBBcnJheTxUPiB7XG4gICAgdmFyIGxhc3RSYW5raW5nID0gMS4wO1xuICAgIHZhciBjbnRSYW5nZWQgPSAwO1xuICAgIHJldHVybiBsc3QuZmlsdGVyKGZ1bmN0aW9uIChvTWVtYmVyLCBpSW5kZXgpIHtcbiAgICB2YXIgaXNSYW5nZWQgPSAhIShvTWVtYmVyW1wicnVsZVwiXSAmJiBvTWVtYmVyW1wicnVsZVwiXS5yYW5nZSk7XG4gICAgaWYoaXNSYW5nZWQpIHtcbiAgICAgIGNudFJhbmdlZCArPSAxO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmICgoKGlJbmRleCAtIGNudFJhbmdlZCkgPCBuKSB8fCAob01lbWJlci5fcmFua2luZyA9PT0gbGFzdFJhbmtpbmcpKSAge1xuICAgICAgICBsYXN0UmFua2luZyA9IG9NZW1iZXIuX3Jhbmtpbmc7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuICB9LFxuICB0YWtlQWJvdmUgOiBmdW5jdGlvbjxUIGV4dGVuZHMgSUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+IChsc3Q6IEFycmF5PFQ+LCBib3JkZXI6IG51bWJlcik6IEFycmF5PFQ+IHtcbiAgICByZXR1cm4gbHN0LmZpbHRlcihmdW5jdGlvbiAob01lbWJlcikge1xuICAgICAgcmV0dXJuIChvTWVtYmVyLl9yYW5raW5nID49IGJvcmRlcik7XG4gICAgfSk7XG4gIH1cblxufTtcblxuLypcbnZhciBleGFjdExlbiA9IDA7XG52YXIgZnV6enlMZW4gPSAwO1xudmFyIGZ1enp5Q250ID0gMDtcbnZhciBleGFjdENudCA9IDA7XG52YXIgdG90YWxDbnQgPSAwO1xudmFyIHRvdGFsTGVuID0gMDtcbnZhciByZXRhaW5lZENudCA9IDA7XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNldENudCgpIHtcbiAgZXhhY3RMZW4gPSAwO1xuICBmdXp6eUxlbiA9IDA7XG4gIGZ1enp5Q250ID0gMDtcbiAgZXhhY3RDbnQgPSAwO1xuICB0b3RhbENudCA9IDA7XG4gIHRvdGFsTGVuID0gMDtcbiAgcmV0YWluZWRDbnQgPSAwO1xufVxuKi9cblxuLypcbmV4cG9ydCBmdW5jdGlvbiBjYXRlZ29yaXplV29yZFdpdGhSYW5rQ3V0b2ZmKHNXb3JkR3JvdXA6IHN0cmluZywgc3BsaXRSdWxlcyA6IElNYXRjaC5TcGxpdFJ1bGVzICwgY250UmVjPyA6IElDbnRSZWMgKTogQXJyYXk8SUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+IHtcbiAgZGVidWdsb2coJ2N3d3JjJyArIHNXb3JkR3JvdXApXG4gIGNvbnNvbGUubG9nKCdjd3dyYyBjYWxsZWQnKTtcbiAgdmFyIHUgPSAxO1xuICB2YXIgc2Vlbkl0ID0gY2F0ZWdvcml6ZVN0cmluZzIoc1dvcmRHcm91cCwgdHJ1ZSwgc3BsaXRSdWxlcywgY250UmVjKTtcbiAgLy90b3RhbENudCArPSAxO1xuICAvLyBleGFjdExlbiArPSBzZWVuSXQubGVuZ3RoO1xuICBhZGRDbnRSZWMoY250UmVjLCAnY250Q2F0RXhhY3QnLCAxKTtcbiAgYWRkQ250UmVjKGNudFJlYywgJ2NudENhdEV4YWN0UmVzJywgc2Vlbkl0Lmxlbmd0aCk7XG5cbiAgaWYgKFJhbmtXb3JkLmhhc0Fib3ZlKHNlZW5JdCwgMC44KSkge1xuICAgIGlmKGNudFJlYykge1xuICAgICAgYWRkQ250UmVjKGNudFJlYywgJ2V4YWN0UHJpb3JUYWtlJywgc2Vlbkl0Lmxlbmd0aClcbiAgICB9XG4gICAgc2Vlbkl0ID0gUmFua1dvcmQudGFrZUFib3ZlKHNlZW5JdCwgMC44KTtcbiAgICBpZihjbnRSZWMpIHtcbiAgICAgIGFkZENudFJlYyhjbnRSZWMsICdleGFjdEFmdGVyVGFrZScsIHNlZW5JdC5sZW5ndGgpXG4gICAgfVxuICAgLy8gZXhhY3RDbnQgKz0gMTtcbiAgfSBlbHNlIHtcbiAgICBzZWVuSXQgPSBjYXRlZ29yaXplU3RyaW5nMihzV29yZEdyb3VwLCBmYWxzZSwgc3BsaXRSdWxlcywgY250UmVjKTtcbiAgICBhZGRDbnRSZWMoY250UmVjLCAnY250Tm9uRXhhY3QnLCAxKTtcbiAgICBhZGRDbnRSZWMoY250UmVjLCAnY250Tm9uRXhhY3RSZXMnLCBzZWVuSXQubGVuZ3RoKTtcbiAgLy8gIGZ1enp5TGVuICs9IHNlZW5JdC5sZW5ndGg7XG4gIC8vICBmdXp6eUNudCArPSAxO1xuICB9XG4gLy8gdG90YWxMZW4gKz0gc2Vlbkl0Lmxlbmd0aDtcbiAgc2Vlbkl0ID0gUmFua1dvcmQudGFrZUZpcnN0TihzZWVuSXQsIEFsZ29sLlRvcF9OX1dvcmRDYXRlZ29yaXphdGlvbnMpO1xuIC8vIHJldGFpbmVkQ250ICs9IHNlZW5JdC5sZW5ndGg7XG4gIHJldHVybiBzZWVuSXQ7XG59XG4qL1xuXG4vKiBpZiB3ZSBoYXZlIGEgIFwiUnVuIGxpa2UgdGhlIFdpbmRcIlxuICBhbiBhIHVzZXIgdHlwZSBmdW4gbGlrZSAgYSBSaW5kICwgYW5kIFJpbmQgaXMgYW4gZXhhY3QgbWF0Y2gsXG4gIHdlIHdpbGwgbm90IHN0YXJ0IGxvb2tpbmcgZm9yIHRoZSBsb25nIHNlbnRlbmNlXG5cbiAgdGhpcyBpcyB0byBiZSBmaXhlZCBieSBcInNwcmVhZGluZ1wiIHRoZSByYW5nZSBpbmRpY2F0aW9uIGFjY3Jvc3MgdmVyeSBzaW1pbGFyIHdvcmRzIGluIHRoZSB2aW5jaW5pdHkgb2YgdGhlXG4gIHRhcmdldCB3b3Jkc1xuKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGNhdGVnb3JpemVXb3JkV2l0aE9mZnNldFdpdGhSYW5rQ3V0b2ZmKHNXb3JkR3JvdXA6IHN0cmluZywgc3BsaXRSdWxlcyA6IElNYXRjaC5TcGxpdFJ1bGVzLCBjbnRSZWM/IDogSUNudFJlYyApOiBBcnJheTxJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZD4ge1xuICB2YXIgc1dvcmRHcm91cExDID0gc1dvcmRHcm91cC50b0xvd2VyQ2FzZSgpO1xuICB2YXIgc2Vlbkl0ID0gY2F0ZWdvcml6ZVdvcmRJbnRlcm5hbFdpdGhPZmZzZXRzKHNXb3JkR3JvdXAsIHNXb3JkR3JvdXBMQywgdHJ1ZSwgc3BsaXRSdWxlcywgY250UmVjKTtcbiAgLy9jb25zb2xlLmxvZyhcIlNFRU5JVFwiICsgSlNPTi5zdHJpbmdpZnkoc2Vlbkl0KSk7XG4gIC8vdG90YWxDbnQgKz0gMTtcbiAgLy8gZXhhY3RMZW4gKz0gc2Vlbkl0Lmxlbmd0aDtcbiAgLy9jb25zb2xlLmxvZyhcImZpcnN0IHJ1biBleGFjdCBcIiArIEpTT04uc3RyaW5naWZ5KHNlZW5JdCkpO1xuICBhZGRDbnRSZWMoY250UmVjLCAnY250Q2F0RXhhY3QnLCAxKTtcbiAgYWRkQ250UmVjKGNudFJlYywgJ2NudENhdEV4YWN0UmVzJywgc2Vlbkl0Lmxlbmd0aCk7XG5cbiAgaWYgKFJhbmtXb3JkLmhhc0Fib3ZlKHNlZW5JdCwgMC44KSkge1xuICAgIGlmKGNudFJlYykge1xuICAgICAgYWRkQ250UmVjKGNudFJlYywgJ2V4YWN0UHJpb3JUYWtlJywgc2Vlbkl0Lmxlbmd0aClcbiAgICB9XG4gICAgc2Vlbkl0ID0gUmFua1dvcmQudGFrZUFib3ZlKHNlZW5JdCwgMC44KTtcbiAgICBpZihjbnRSZWMpIHtcbiAgICAgIGFkZENudFJlYyhjbnRSZWMsICdleGFjdEFmdGVyVGFrZScsIHNlZW5JdC5sZW5ndGgpXG4gICAgfVxuICAgLy8gZXhhY3RDbnQgKz0gMTtcbiAgfSBlbHNlIHtcbiAgICBzZWVuSXQgPSBjYXRlZ29yaXplV29yZEludGVybmFsV2l0aE9mZnNldHMoc1dvcmRHcm91cCwgc1dvcmRHcm91cExDLCBmYWxzZSwgc3BsaXRSdWxlcywgY250UmVjKTtcbiAgICBhZGRDbnRSZWMoY250UmVjLCAnY250Tm9uRXhhY3QnLCAxKTtcbiAgICBhZGRDbnRSZWMoY250UmVjLCAnY250Tm9uRXhhY3RSZXMnLCBzZWVuSXQubGVuZ3RoKTtcbiAgLy8gIGZ1enp5TGVuICs9IHNlZW5JdC5sZW5ndGg7XG4gIC8vICBmdXp6eUNudCArPSAxO1xuICB9XG4gIC8vIHRvdGFsTGVuICs9IHNlZW5JdC5sZW5ndGg7XG4gIGRlYnVnbG9nKCgpPT4oIGAke3NlZW5JdC5sZW5ndGh9IHdpdGggJHtzZWVuSXQucmVkdWNlKCAocHJldixvYmopID0+IHByZXYgKyAob2JqLnJ1bGUucmFuZ2UgPyAxIDogMCksMCl9IHJhbmdlZCAhYCkpO1xuLy8gIHZhciBjbnRSYW5nZWQgPSBzZWVuSXQucmVkdWNlKCAocHJldixvYmopID0+IHByZXYgKyAob2JqLnJ1bGUucmFuZ2UgPyAxIDogMCksMCk7XG4vLyAgY29uc29sZS5sb2coYCoqKioqKioqKioqICR7c2Vlbkl0Lmxlbmd0aH0gd2l0aCAke2NudFJhbmdlZH0gcmFuZ2VkICFgKTtcblxuICBzZWVuSXQgPSBSYW5rV29yZC50YWtlRmlyc3ROKHNlZW5JdCwgQWxnb2wuVG9wX05fV29yZENhdGVnb3JpemF0aW9ucyk7XG4gLy8gcmV0YWluZWRDbnQgKz0gc2Vlbkl0Lmxlbmd0aDtcbiAgLy9jb25zb2xlLmxvZyhcImZpbmFsIHJlcyBvZiBjYXRlZ29yaXplV29yZFdpdGhPZmZzZXRXaXRoUmFua0N1dG9mZlwiICsgSlNPTi5zdHJpbmdpZnkoc2Vlbkl0KSk7XG5cbiAgcmV0dXJuIHNlZW5JdDtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gY2F0ZWdvcml6ZVdvcmRXaXRoT2Zmc2V0V2l0aFJhbmtDdXRvZmZTaW5nbGUod29yZDogc3RyaW5nLCBydWxlOiBJRk1vZGVsLm1SdWxlKTogSUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWQge1xuICB2YXIgbGN3b3JkID0gd29yZC50b0xvd2VyQ2FzZSgpO1xuXG4gIGlmKGxjd29yZCA9PT0gcnVsZS5sb3dlcmNhc2V3b3JkKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0cmluZzogd29yZCxcbiAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IHJ1bGUubWF0Y2hlZFN0cmluZyxcbiAgICAgICAgICAgIGNhdGVnb3J5OiBydWxlLmNhdGVnb3J5LFxuICAgICAgICAgICAgcnVsZTogcnVsZSxcbiAgICAgICAgICAgIF9yYW5raW5nOiBydWxlLl9yYW5raW5nIHx8IDEuMFxuICAgICAgICAgIH07XG4gIH1cblxuICB2YXIgcmVzOiBBcnJheTxJTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkPiA9IFtdXG4gIGNoZWNrT25lUnVsZVdpdGhPZmZzZXQod29yZCxsY3dvcmQsZmFsc2UscmVzLHJ1bGUpO1xuICBkZWJ1Z2xvZyhcImNhdFdXT1dSQ1MgXCIgKyBsY3dvcmQpO1xuICBpZihyZXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHJlc1swXTtcbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5cblxuLypcbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJSZW1vdmluZ1VuY2F0ZWdvcml6ZWRTZW50ZW5jZShvU2VudGVuY2U6IElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nW11bXSk6IGJvb2xlYW4ge1xuICByZXR1cm4gb1NlbnRlbmNlLmV2ZXJ5KGZ1bmN0aW9uIChvV29yZEdyb3VwKSB7XG4gICAgcmV0dXJuIChvV29yZEdyb3VwLmxlbmd0aCA+IDApO1xuICB9KTtcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJSZW1vdmluZ1VuY2F0ZWdvcml6ZWQoYXJyOiBJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1tdW11bXSk6IElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nW11bXVtdIHtcbiAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24gKG9TZW50ZW5jZSkge1xuICAgIHJldHVybiBmaWx0ZXJSZW1vdmluZ1VuY2F0ZWdvcml6ZWRTZW50ZW5jZShvU2VudGVuY2UpO1xuICB9KTtcbn1cbiovXG5cbmV4cG9ydCBmdW5jdGlvbiBjYXRlZ29yaXplQVdvcmQoc1dvcmRHcm91cDogc3RyaW5nLCBydWxlczogSU1hdGNoLlNwbGl0UnVsZXMsIHNlbnRlbmNlOiBzdHJpbmcsIHdvcmRzOiB7IFtrZXk6IHN0cmluZ106IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nPn0sXG5jbnRSZWMgPyA6IElDbnRSZWMgKSA6IElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWRbXSB7XG4gIHJldHVybiBjYXRlZ29yaXplQVdvcmRXaXRoT2Zmc2V0cyhzV29yZEdyb3VwLCBydWxlcywgc2VudGVuY2UsIHdvcmRzKS5maWx0ZXIoXG4gICAgIHIgPT4gIXIuc3BhbiAmJiAhci5ydWxlLnJhbmdlXG4gICk7XG4vKiBjb25zaWRlciByZW1vdmluZyB0aGUgcmFuZ2VkIHN0dWZmICAqL1xuXG5cbi8qXG4gIHZhciBzZWVuSXQgPSB3b3Jkc1tzV29yZEdyb3VwXTtcbiAgaWYgKHNlZW5JdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy9zZWVuSXQgPSBjYXRlZ29yaXplV29yZFdpdGhSYW5rQ3V0b2ZmKHNXb3JkR3JvdXAsIHJ1bGVzLCBjbnRSZWMpO1xuICAgIHNlZW5JdCA9IGNhdGVnb3JpemVXb3JkV2l0aE9mZnNldFdpdGhSYW5rQ3V0b2ZmKHNXb3JkR3JvdXAscnVsZXMsY250UmVjKTtcbiAgICB1dGlscy5kZWVwRnJlZXplKHNlZW5JdCk7XG4gICAgd29yZHNbc1dvcmRHcm91cF0gPSBzZWVuSXQ7XG4gIH1cbiAgaWYgKCFzZWVuSXQgfHwgc2Vlbkl0Lmxlbmd0aCA9PT0gMCkge1xuICAgIGxvZ2dlcihcIioqKldBUk5JTkc6IERpZCBub3QgZmluZCBhbnkgY2F0ZWdvcml6YXRpb24gZm9yIFxcXCJcIiArIHNXb3JkR3JvdXAgKyBcIlxcXCIgaW4gc2VudGVuY2UgXFxcIlwiXG4gICAgICArIHNlbnRlbmNlICsgXCJcXFwiXCIpO1xuICAgIGlmIChzV29yZEdyb3VwLmluZGV4T2YoXCIgXCIpIDw9IDApIHtcbiAgICAgIGRlYnVnbG9nKFwiKioqV0FSTklORzogRGlkIG5vdCBmaW5kIGFueSBjYXRlZ29yaXphdGlvbiBmb3IgcHJpbWl0aXZlICghKVwiICsgc1dvcmRHcm91cCk7XG4gICAgfVxuICAgIGRlYnVnbG9nKFwiKioqV0FSTklORzogRGlkIG5vdCBmaW5kIGFueSBjYXRlZ29yaXphdGlvbiBmb3IgXCIgKyBzV29yZEdyb3VwKTtcbiAgICBpZiAoIXNlZW5JdCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0aW5nIGVtdHB5IGxpc3QsIG5vdCB1bmRlZmluZWQgZm9yIFxcXCJcIiArIHNXb3JkR3JvdXAgKyBcIlxcXCJcIilcbiAgICB9XG4gICAgd29yZHNbc1dvcmRHcm91cF0gPSBbXVxuICAgIHJldHVybiBbXTtcbiAgfVxuICByZXR1cm4gdXRpbHMuY2xvbmVEZWVwKHNlZW5JdCk7XG4gICovXG59XG5cblxuLyoqXG4gKiBHaXZlbiBhICBzdHJpbmcsIGJyZWFrIGl0IGRvd24gaW50byBjb21wb25lbnRzLFxuICogW1snQScsICdCJ10sIFsnQSBCJ11dXG4gKlxuICogdGhlbiBjYXRlZ29yaXplV29yZHNcbiAqIHJldHVybmluZ1xuICpcbiAqIFsgW1sgeyBjYXRlZ29yeTogJ3N5c3RlbUlkJywgd29yZCA6ICdBJ30sXG4gKiAgICAgIHsgY2F0ZWdvcnk6ICdvdGhlcnRoaW5nJywgd29yZCA6ICdBJ31cbiAqICAgIF0sXG4gKiAgICAvLyByZXN1bHQgb2YgQlxuICogICAgWyB7IGNhdGVnb3J5OiAnc3lzdGVtSWQnLCB3b3JkIDogJ0InfSxcbiAqICAgICAgeyBjYXRlZ29yeTogJ290aGVydGhpbmcnLCB3b3JkIDogJ0EnfVxuICogICAgICB7IGNhdGVnb3J5OiAnYW5vdGhlcnRyeXAnLCB3b3JkIDogJ0InfVxuICogICAgXVxuICogICBdLFxuICogXV1dXG4gKlxuICpcbiAqXG4gKi9cblxuLypcbmV4cG9ydCBmdW5jdGlvbiBhbmFseXplU3RyaW5nKHNTdHJpbmc6IHN0cmluZywgcnVsZXM6IElNYXRjaC5TcGxpdFJ1bGVzLFxuICB3b3Jkcz86IHsgW2tleTogc3RyaW5nXTogQXJyYXk8SUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+IH0pXG4gIDogWyBbIElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdbXV0gXVxuICAge1xuICB2YXIgY250ID0gMDtcbiAgdmFyIGZhYyA9IDE7XG4gIGlmKGNudCA9PT0gMCkge1xuICAgIHRocm93IEVycm9yKCd1c2UgcHJvY2Vzc1N0cmlnbjInKTtcbiAgfVxuICB2YXIgdSA9IGJyZWFrZG93bi5icmVha2Rvd25TdHJpbmcoc1N0cmluZywgQWxnb2wuTWF4U3BhY2VzUGVyQ29tYmluZWRXb3JkKTtcbiAgZGVidWdsb2coKCk9PlwiaGVyZSBicmVha2Rvd25cIiArIEpTT04uc3RyaW5naWZ5KHUpKTtcbiAgLy9jb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh1KSk7XG4gIHdvcmRzID0gd29yZHMgfHwge307XG4gIGRlYnVncGVyZigoKT0+J3RoaXMgbWFueSBrbm93biB3b3JkczogJyArIE9iamVjdC5rZXlzKHdvcmRzKS5sZW5ndGgpO1xuICB2YXIgcmVzID0gW10gYXMgW1sgSU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1tdXSBdO1xuICB2YXIgY250UmVjID0ge307XG4gIHUuZm9yRWFjaChmdW5jdGlvbiAoYUJyZWFrRG93blNlbnRlbmNlKSB7XG4gICAgICB2YXIgY2F0ZWdvcml6ZWRTZW50ZW5jZSA9IFtdIGFzIFsgSU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1tdIF07XG4gICAgICB2YXIgaXNWYWxpZCA9IGFCcmVha0Rvd25TZW50ZW5jZS5ldmVyeShmdW5jdGlvbiAoc1dvcmRHcm91cDogc3RyaW5nLCBpbmRleCA6IG51bWJlcikge1xuICAgICAgICB2YXIgc2Vlbkl0ID0gY2F0ZWdvcml6ZUFXb3JkKHNXb3JkR3JvdXAsIHJ1bGVzLCBzU3RyaW5nLCB3b3JkcywgY250UmVjKTtcbiAgICAgICAgaWYoc2Vlbkl0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRlZ29yaXplZFNlbnRlbmNlW2luZGV4XSA9IHNlZW5JdDtcbiAgICAgICAgY250ID0gY250ICsgc2Vlbkl0Lmxlbmd0aDtcbiAgICAgICAgZmFjID0gZmFjICogc2Vlbkl0Lmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KTtcbiAgICAgIGlmKGlzVmFsaWQpIHtcbiAgICAgICAgcmVzLnB1c2goY2F0ZWdvcml6ZWRTZW50ZW5jZSk7XG4gICAgICB9XG4gIH0pO1xuICBkZWJ1Z2xvZygoKT0+XCIgc2VudGVuY2VzIFwiICsgdS5sZW5ndGggKyBcIiBtYXRjaGVzIFwiICsgY250ICsgXCIgZmFjOiBcIiArIGZhYyk7XG4gIGRlYnVnbG9nKCAoKT0+IFwiZmlyc3QgbWF0Y2ggXCIrIEpTT04uc3RyaW5naWZ5KHUsdW5kZWZpbmVkLDIpKTtcbiAgZGVidWdwZXJmKCgpPT4gXCIgc2VudGVuY2VzIFwiICsgdS5sZW5ndGggKyBcIiAvIFwiICsgcmVzLmxlbmd0aCArICBcIiBtYXRjaGVzIFwiICsgY250ICsgXCIgZmFjOiBcIiArIGZhYyArIFwiIHJlYyA6IFwiICsgSlNPTi5zdHJpbmdpZnkoY250UmVjLHVuZGVmaW5lZCwyKSk7XG4gIHJldHVybiByZXM7XG59XG4qL1xuXG5cbi8qKlxuICogVGhpcyBpcyB0aGUgbWFpbiBlbnRyeSBwb2ludCBmb3Igd29yZCBjYXRlZ29yaXphdGlvbixcbiAqIElmIHNlbnRlbmNlIGlzIHN1cHBsaWVkIGl0IHdpbGwgYmUgdXNlZFxuICogQHBhcmFtIHNXb3JkR3JvdXAgYSBzaW5nbGUgd29yZCwgZy5lLiBcImVhcnRoXCIgb3IgYSBjb21iaW5hdGlvbiBcIlVJNSBDb21wb25lbnRcIlxuICogIFRoZSB3b3JkIHdpbGwgKm5vdCogYmUgYnJva2VuIGRvd24gaGVyZSwgYnV0IGRpcmV0eWwgbWF0Y2hlZCBhZ2FpbnN0ICBydWxlc1xuICogQHBhcmFtIHJ1bGVzIHJ1bGUgaW5kZXhcbiAqIEBwYXJhbSBzZW50ZW5jZSBvcHRpb25hbCwgb25seSBmb3IgZGVidWdnaW5nXG4gKiBAcGFyYW0gd29yZHNcbiAqIEBwYXJhbSBjbnRSZWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhdGVnb3JpemVBV29yZFdpdGhPZmZzZXRzKHNXb3JkR3JvdXA6IHN0cmluZywgcnVsZXM6IElNYXRjaC5TcGxpdFJ1bGVzLCBzZW50ZW5jZTogc3RyaW5nLCB3b3JkczogeyBba2V5OiBzdHJpbmddOiBBcnJheTxJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZz59LFxuY250UmVjID8gOiBJQ250UmVjICkgOiBJTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkW10ge1xuICB2YXIgc2Vlbkl0ID0gd29yZHNbc1dvcmRHcm91cF07XG4gIGlmIChzZWVuSXQgPT09IHVuZGVmaW5lZCkge1xuICAgIHNlZW5JdCA9IGNhdGVnb3JpemVXb3JkV2l0aE9mZnNldFdpdGhSYW5rQ3V0b2ZmKHNXb3JkR3JvdXAsIHJ1bGVzLCBjbnRSZWMpO1xuICAgIHV0aWxzLmRlZXBGcmVlemUoc2Vlbkl0KTtcbiAgICB3b3Jkc1tzV29yZEdyb3VwXSA9IHNlZW5JdDtcbiAgfVxuICBpZiAoIXNlZW5JdCB8fCBzZWVuSXQubGVuZ3RoID09PSAwKSB7XG4gICAgbG9nZ2VyKFwiKioqV0FSTklORzogRGlkIG5vdCBmaW5kIGFueSBjYXRlZ29yaXphdGlvbiBmb3IgXFxcIlwiICsgc1dvcmRHcm91cCArIFwiXFxcIiBpbiBzZW50ZW5jZSBcXFwiXCJcbiAgICAgICsgc2VudGVuY2UgKyBcIlxcXCJcIik7XG4gICAgaWYgKHNXb3JkR3JvdXAuaW5kZXhPZihcIiBcIikgPD0gMCkge1xuICAgICAgZGVidWdsb2coKCk9PlwiKioqV0FSTklORzogRGlkIG5vdCBmaW5kIGFueSBjYXRlZ29yaXphdGlvbiBmb3IgcHJpbWl0aXZlICghKVwiICsgc1dvcmRHcm91cCk7XG4gICAgfVxuICAgIGRlYnVnbG9nKCgpPT5cIioqKldBUk5JTkc6IERpZCBub3QgZmluZCBhbnkgY2F0ZWdvcml6YXRpb24gZm9yIFwiICsgc1dvcmRHcm91cCk7XG4gICAgaWYgKCFzZWVuSXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGluZyBlbXRweSBsaXN0LCBub3QgdW5kZWZpbmVkIGZvciBcXFwiXCIgKyBzV29yZEdyb3VwICsgXCJcXFwiXCIpXG4gICAgfVxuICAgIHdvcmRzW3NXb3JkR3JvdXBdID0gW11cbiAgICByZXR1cm4gW107XG4gIH1cbiAgcmV0dXJuIHV0aWxzLmNsb25lRGVlcChzZWVuSXQpO1xufVxuXG5cblxuXG5cblxuXG5cblxuLypcblsgW2EsYl0sIFtjLGRdXVxuXG4wMCBhXG4wMSBiXG4xMCBjXG4xMSBkXG4xMiBjXG4qL1xuXG5cbmNvbnN0IGNsb25lID0gdXRpbHMuY2xvbmVEZWVwO1xuXG5cbmZ1bmN0aW9uIGNvcHlWZWNNZW1iZXJzKHUpIHtcbiAgdmFyIGkgPSAwO1xuICBmb3IoaSA9IDA7IGkgPCB1Lmxlbmd0aDsgKytpKSB7XG4gICAgdVtpXSA9IGNsb25lKHVbaV0pO1xuICB9XG4gIHJldHVybiB1O1xufVxuLy8gd2UgY2FuIHJlcGxpY2F0ZSB0aGUgdGFpbCBvciB0aGUgaGVhZCxcbi8vIHdlIHJlcGxpY2F0ZSB0aGUgdGFpbCBhcyBpdCBpcyBzbWFsbGVyLlxuXG4vLyBbYSxiLGMgXVxuXG5leHBvcnQgZnVuY3Rpb24gZXhwYW5kTWF0Y2hBcnIoZGVlcDogQXJyYXk8QXJyYXk8YW55Pj4pOiBBcnJheTxBcnJheTxhbnk+PiB7XG4gIHZhciBhID0gW107XG4gIHZhciBsaW5lID0gW107XG4gIGRlYnVnbG9nKCgpPT4gSlNPTi5zdHJpbmdpZnkoZGVlcCkpO1xuICBkZWVwLmZvckVhY2goZnVuY3Rpb24gKHVCcmVha0Rvd25MaW5lLCBpSW5kZXg6IG51bWJlcikge1xuICAgIGxpbmVbaUluZGV4XSA9IFtdO1xuICAgIHVCcmVha0Rvd25MaW5lLmZvckVhY2goZnVuY3Rpb24gKGFXb3JkR3JvdXAsIHdnSW5kZXg6IG51bWJlcikge1xuICAgICAgbGluZVtpSW5kZXhdW3dnSW5kZXhdID0gW107XG4gICAgICBhV29yZEdyb3VwLmZvckVhY2goZnVuY3Rpb24gKG9Xb3JkVmFyaWFudCwgaVdWSW5kZXg6IG51bWJlcikge1xuICAgICAgICBsaW5lW2lJbmRleF1bd2dJbmRleF1baVdWSW5kZXhdID0gb1dvcmRWYXJpYW50O1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pXG4gIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyBKU09OLnN0cmluZ2lmeShsaW5lKSA6ICctJyk7XG4gIHZhciByZXMgPSBbXTtcbiAgdmFyIG52ZWNzID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZS5sZW5ndGg7ICsraSkge1xuICAgIHZhciB2ZWNzID0gW1tdXTtcbiAgICB2YXIgbnZlY3MgPSBbXTtcbiAgICB2YXIgcnZlYyA9IFtdO1xuICAgIGZvciAodmFyIGsgPSAwOyBrIDwgbGluZVtpXS5sZW5ndGg7ICsraykgeyAvLyB3b3JkZ3JvdXAga1xuICAgICAgLy92ZWNzIGlzIHRoZSB2ZWN0b3Igb2YgYWxsIHNvIGZhciBzZWVuIHZhcmlhbnRzIHVwIHRvIGsgd2dzLlxuICAgICAgdmFyIG5leHRCYXNlID0gW107XG4gICAgICBmb3IgKHZhciBsID0gMDsgbCA8IGxpbmVbaV1ba10ubGVuZ3RoOyArK2wpIHsgLy8gZm9yIGVhY2ggdmFyaWFudFxuICAgICAgICAvL2RlYnVnbG9nKFwidmVjcyBub3dcIiArIEpTT04uc3RyaW5naWZ5KHZlY3MpKTtcbiAgICAgICAgbnZlY3MgPSBbXTsgLy92ZWNzLnNsaWNlKCk7IC8vIGNvcHkgdGhlIHZlY1tpXSBiYXNlIHZlY3RvcjtcbiAgICAgICAgLy9kZWJ1Z2xvZyhcInZlY3MgY29waWVkIG5vd1wiICsgSlNPTi5zdHJpbmdpZnkobnZlY3MpKTtcbiAgICAgICAgZm9yICh2YXIgdSA9IDA7IHUgPCB2ZWNzLmxlbmd0aDsgKyt1KSB7XG4gICAgICAgICAgbnZlY3NbdV0gPSB2ZWNzW3VdLnNsaWNlKCk7IC8vXG4gICAgICAgICAgbnZlY3NbdV0gPSBjb3B5VmVjTWVtYmVycyhudmVjc1t1XSk7XG4gICAgICAgICAgLy8gZGVidWdsb2coXCJjb3BpZWQgdmVjc1tcIisgdStcIl1cIiArIEpTT04uc3RyaW5naWZ5KHZlY3NbdV0pKTtcbiAgICAgICAgICBudmVjc1t1XS5wdXNoKFxuICAgICAgICAgICAgY2xvbmUobGluZVtpXVtrXVtsXSkpOyAvLyBwdXNoIHRoZSBsdGggdmFyaWFudFxuICAgICAgICAgIC8vIGRlYnVnbG9nKFwibm93IG52ZWNzIFwiICsgbnZlY3MubGVuZ3RoICsgXCIgXCIgKyBKU09OLnN0cmluZ2lmeShudmVjcykpO1xuICAgICAgICB9XG4gICAgICAgIC8vICAgZGVidWdsb2coXCIgYXQgICAgIFwiICsgayArIFwiOlwiICsgbCArIFwiIG5leHRiYXNlID5cIiArIEpTT04uc3RyaW5naWZ5KG5leHRCYXNlKSlcbiAgICAgICAgLy8gICBkZWJ1Z2xvZyhcIiBhcHBlbmQgXCIgKyBrICsgXCI6XCIgKyBsICsgXCIgbnZlY3MgICAgPlwiICsgSlNPTi5zdHJpbmdpZnkobnZlY3MpKVxuICAgICAgICBuZXh0QmFzZSA9IG5leHRCYXNlLmNvbmNhdChudmVjcyk7XG4gICAgICAgIC8vICAgZGVidWdsb2coXCIgIHJlc3VsdCBcIiArIGsgKyBcIjpcIiArIGwgKyBcIiBudmVjcyAgICA+XCIgKyBKU09OLnN0cmluZ2lmeShuZXh0QmFzZSkpXG4gICAgICB9IC8vY29uc3RydVxuICAgICAgLy8gIGRlYnVnbG9nKFwibm93IGF0IFwiICsgayArIFwiOlwiICsgbCArIFwiID5cIiArIEpTT04uc3RyaW5naWZ5KG5leHRCYXNlKSlcbiAgICAgIHZlY3MgPSBuZXh0QmFzZTtcbiAgICB9XG4gICAgZGVidWdsb2dWKGRlYnVnbG9nVi5lbmFibGVkID8gKFwiQVBQRU5ESU5HIFRPIFJFUzMjXCIgKyBpICsgXCI6XCIgKyBsICsgXCIgPlwiICsgSlNPTi5zdHJpbmdpZnkobmV4dEJhc2UpKSA6ICctJyk7XG4gICAgcmVzID0gcmVzLmNvbmNhdCh2ZWNzKTtcbiAgfVxuICByZXR1cm4gcmVzO1xufVxuXG5cbi8qKlxuICogQ2FsY3VsYXRlIGEgd2VpZ2h0IGZhY3RvciBmb3IgYSBnaXZlbiBkaXN0YW5jZSBhbmRcbiAqIGNhdGVnb3J5XG4gKiBAcGFyYW0ge2ludGVnZXJ9IGRpc3QgZGlzdGFuY2UgaW4gd29yZHNcbiAqIEBwYXJhbSB7c3RyaW5nfSBjYXRlZ29yeSBjYXRlZ29yeSB0byB1c2VcbiAqIEByZXR1cm5zIHtudW1iZXJ9IGEgZGlzdGFuY2UgZmFjdG9yID49IDFcbiAqICAxLjAgZm9yIG5vIGVmZmVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVpbmZvcmNlRGlzdFdlaWdodChkaXN0OiBudW1iZXIsIGNhdGVnb3J5OiBzdHJpbmcpOiBudW1iZXIge1xuICB2YXIgYWJzID0gTWF0aC5hYnMoZGlzdCk7XG4gIHJldHVybiAxLjAgKyAoQWxnb2wuYVJlaW5mb3JjZURpc3RXZWlnaHRbYWJzXSB8fCAwKTtcbn1cblxuLyoqXG4gKiBHaXZlbiBhIHNlbnRlbmNlLCBleHRhY3QgY2F0ZWdvcmllc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdENhdGVnb3J5TWFwKG9TZW50ZW5jZTogQXJyYXk8SUZNYXRjaC5JV29yZD4pOiB7IFtrZXk6IHN0cmluZ106IEFycmF5PHsgcG9zOiBudW1iZXIgfT4gfSB7XG4gIHZhciByZXMgPSB7fTtcbiAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/ICgnZXh0cmFjdENhdGVnb3J5TWFwICcgKyBKU09OLnN0cmluZ2lmeShvU2VudGVuY2UpKSA6ICctJyk7XG4gIG9TZW50ZW5jZS5mb3JFYWNoKGZ1bmN0aW9uIChvV29yZCwgaUluZGV4KSB7XG4gICAgaWYgKG9Xb3JkLmNhdGVnb3J5ID09PSBJRk1hdGNoLkNBVF9DQVRFR09SWSkge1xuICAgICAgcmVzW29Xb3JkLm1hdGNoZWRTdHJpbmddID0gcmVzW29Xb3JkLm1hdGNoZWRTdHJpbmddIHx8IFtdO1xuICAgICAgcmVzW29Xb3JkLm1hdGNoZWRTdHJpbmddLnB1c2goeyBwb3M6IGlJbmRleCB9KTtcbiAgICB9XG4gIH0pO1xuICB1dGlscy5kZWVwRnJlZXplKHJlcyk7XG4gIHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWluRm9yY2VTZW50ZW5jZShvU2VudGVuY2UpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBvQ2F0ZWdvcnlNYXAgPSBleHRyYWN0Q2F0ZWdvcnlNYXAob1NlbnRlbmNlKTtcbiAgb1NlbnRlbmNlLmZvckVhY2goZnVuY3Rpb24gKG9Xb3JkLCBpSW5kZXgpIHtcbiAgICB2YXIgbSA9IG9DYXRlZ29yeU1hcFtvV29yZC5jYXRlZ29yeV0gfHwgW107XG4gICAgbS5mb3JFYWNoKGZ1bmN0aW9uIChvUG9zaXRpb246IHsgcG9zOiBudW1iZXIgfSkge1xuICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgICBvV29yZC5yZWluZm9yY2UgPSBvV29yZC5yZWluZm9yY2UgfHwgMTtcbiAgICAgIHZhciBib29zdCA9IHJlaW5mb3JjZURpc3RXZWlnaHQoaUluZGV4IC0gb1Bvc2l0aW9uLnBvcywgb1dvcmQuY2F0ZWdvcnkpO1xuICAgICAgb1dvcmQucmVpbmZvcmNlICo9IGJvb3N0O1xuICAgICAgb1dvcmQuX3JhbmtpbmcgKj0gYm9vc3Q7XG4gICAgfSk7XG4gIH0pO1xuICBvU2VudGVuY2UuZm9yRWFjaChmdW5jdGlvbiAob1dvcmQsIGlJbmRleCkge1xuICAgIGlmIChpSW5kZXggPiAwICkge1xuICAgICAgaWYgKG9TZW50ZW5jZVtpSW5kZXgtMV0uY2F0ZWdvcnkgPT09IFwibWV0YVwiICAmJiAob1dvcmQuY2F0ZWdvcnkgPT09IG9TZW50ZW5jZVtpSW5kZXgtMV0ubWF0Y2hlZFN0cmluZykgKSB7XG4gICAgICAgIG9Xb3JkLnJlaW5mb3JjZSA9IG9Xb3JkLnJlaW5mb3JjZSB8fCAxO1xuICAgICAgICB2YXIgYm9vc3QgPSByZWluZm9yY2VEaXN0V2VpZ2h0KDEsIG9Xb3JkLmNhdGVnb3J5KTtcbiAgICAgICAgb1dvcmQucmVpbmZvcmNlICo9IGJvb3N0O1xuICAgICAgICBvV29yZC5fcmFua2luZyAqPSBib29zdDtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb1NlbnRlbmNlO1xufVxuXG5cbmltcG9ydCAqIGFzIFNlbnRlbmNlIGZyb20gJy4vc2VudGVuY2UnO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVpbkZvcmNlKGFDYXRlZ29yaXplZEFycmF5KSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICBhQ2F0ZWdvcml6ZWRBcnJheS5mb3JFYWNoKGZ1bmN0aW9uIChvU2VudGVuY2UpIHtcbiAgICByZWluRm9yY2VTZW50ZW5jZShvU2VudGVuY2UpO1xuICB9KVxuICBhQ2F0ZWdvcml6ZWRBcnJheS5zb3J0KFNlbnRlbmNlLmNtcFJhbmtpbmdQcm9kdWN0KTtcbiBkZWJ1Z2xvZygoKT0+XCJhZnRlciByZWluZm9yY2VcIiArIGFDYXRlZ29yaXplZEFycmF5Lm1hcChmdW5jdGlvbiAob1NlbnRlbmNlKSB7XG4gICAgICByZXR1cm4gU2VudGVuY2UucmFua2luZ1Byb2R1Y3Qob1NlbnRlbmNlKSArIFwiOlwiICsgSlNPTi5zdHJpbmdpZnkob1NlbnRlbmNlKTtcbiAgICB9KS5qb2luKFwiXFxuXCIpKTtcbiAgcmV0dXJuIGFDYXRlZ29yaXplZEFycmF5O1xufVxuXG5cbi8vLyBiZWxvdyBtYXkgbm8gbG9uZ2VyIGJlIHVzZWRcblxuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoUmVnRXhwKG9SdWxlOiBJRk1vZGVsLklSdWxlLCBjb250ZXh0OiBJRk1hdGNoLmNvbnRleHQsIG9wdGlvbnM/OiBJTWF0Y2hPcHRpb25zKSB7XG4gIGlmIChjb250ZXh0W29SdWxlLmtleV0gPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgdmFyIHNLZXkgPSBvUnVsZS5rZXk7XG4gIHZhciBzMSA9IGNvbnRleHRbb1J1bGUua2V5XS50b0xvd2VyQ2FzZSgpXG4gIHZhciByZWcgPSBvUnVsZS5yZWdleHA7XG5cbiAgdmFyIG0gPSByZWcuZXhlYyhzMSk7XG4gIGlmKGRlYnVnbG9nVi5lbmFibGVkKSB7XG4gICAgZGVidWdsb2dWKFwiYXBwbHlpbmcgcmVnZXhwOiBcIiArIHMxICsgXCIgXCIgKyBKU09OLnN0cmluZ2lmeShtKSk7XG4gIH1cbiAgaWYgKCFtKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICB2YXIgZGVsdGEgPSBjb21wYXJlQ29udGV4dChjb250ZXh0LCBvUnVsZS5mb2xsb3dzLCBvUnVsZS5rZXkpXG4gIGRlYnVnbG9nVigoKT0+SlNPTi5zdHJpbmdpZnkoZGVsdGEpKTtcbiAgZGVidWdsb2dWKCgpPT5KU09OLnN0cmluZ2lmeShvcHRpb25zKSk7XG4gIGlmIChvcHRpb25zLm1hdGNob3RoZXJzICYmIChkZWx0YS5kaWZmZXJlbnQgPiAwKSkge1xuICAgIHJldHVybiB1bmRlZmluZWRcbiAgfVxuICB2YXIgb0V4dHJhY3RlZENvbnRleHQgPSBleHRyYWN0QXJnc01hcChtLCBvUnVsZS5hcmdzTWFwKTtcbiAgZGVidWdsb2dWKCgpPT5cImV4dHJhY3RlZCBhcmdzIFwiICsgSlNPTi5zdHJpbmdpZnkob1J1bGUuYXJnc01hcCkpO1xuICBkZWJ1Z2xvZ1YoKCk9PlwibWF0Y2ggXCIgKyBKU09OLnN0cmluZ2lmeShtKSk7XG4gIGRlYnVnbG9nVigoKT0+XCJleHRyYWN0ZWQgYXJncyBcIiArIEpTT04uc3RyaW5naWZ5KG9FeHRyYWN0ZWRDb250ZXh0KSk7XG4gIHZhciByZXMgPSBBbnlPYmplY3QuYXNzaWduKHt9LCBvUnVsZS5mb2xsb3dzKSBhcyBhbnk7XG4gIHJlcyA9IEFueU9iamVjdC5hc3NpZ24ocmVzLCBvRXh0cmFjdGVkQ29udGV4dCk7XG4gIHJlcyA9IEFueU9iamVjdC5hc3NpZ24ocmVzLCBjb250ZXh0KTtcbiAgaWYgKG9FeHRyYWN0ZWRDb250ZXh0W3NLZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXNbc0tleV0gPSBvRXh0cmFjdGVkQ29udGV4dFtzS2V5XTtcbiAgfVxuICBpZiAob3B0aW9ucy5vdmVycmlkZSkge1xuICAgIHJlcyA9IEFueU9iamVjdC5hc3NpZ24ocmVzLCBvUnVsZS5mb2xsb3dzKTtcbiAgICByZXMgPSBBbnlPYmplY3QuYXNzaWduKHJlcywgb0V4dHJhY3RlZENvbnRleHQpXG4gIH1cbiAgT2JqZWN0LmZyZWV6ZShyZXMpO1xuICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKCdGb3VuZCBvbmUnICsgSlNPTi5zdHJpbmdpZnkocmVzLCB1bmRlZmluZWQsIDIpKSA6ICctJyk7XG4gIHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzb3J0QnlXZWlnaHQoc0tleTogc3RyaW5nLCBvQ29udGV4dEE6IElGTWF0Y2guY29udGV4dCwgb0NvbnRleHRCOiBJRk1hdGNoLmNvbnRleHQpOiBudW1iZXIge1xuICBkZWJ1Z2xvZ1YoKCk9Pidzb3J0aW5nOiAnICsgc0tleSArICdpbnZva2VkIHdpdGhcXG4gMTonICsgSlNPTi5zdHJpbmdpZnkob0NvbnRleHRBLCB1bmRlZmluZWQsIDIpICtcbiAgICBcIiB2cyBcXG4gMjpcIiArIEpTT04uc3RyaW5naWZ5KG9Db250ZXh0QiwgdW5kZWZpbmVkLCAyKSk7XG4gIHZhciByYW5raW5nQTogbnVtYmVyID0gcGFyc2VGbG9hdChvQ29udGV4dEFbXCJfcmFua2luZ1wiXSB8fCBcIjFcIik7XG4gIHZhciByYW5raW5nQjogbnVtYmVyID0gcGFyc2VGbG9hdChvQ29udGV4dEJbXCJfcmFua2luZ1wiXSB8fCBcIjFcIik7XG4gIGlmIChyYW5raW5nQSAhPT0gcmFua2luZ0IpIHtcbiAgICBkZWJ1Z2xvZygoKT0+IFwiIHJhbmtpbiBkZWx0YVwiICsgMTAwICogKHJhbmtpbmdCIC0gcmFua2luZ0EpKTtcbiAgICByZXR1cm4gMTAwICogKHJhbmtpbmdCIC0gcmFua2luZ0EpXG4gIH1cblxuICB2YXIgd2VpZ2h0QSA9IG9Db250ZXh0QVtcIl93ZWlnaHRcIl0gJiYgb0NvbnRleHRBW1wiX3dlaWdodFwiXVtzS2V5XSB8fCAwO1xuICB2YXIgd2VpZ2h0QiA9IG9Db250ZXh0QltcIl93ZWlnaHRcIl0gJiYgb0NvbnRleHRCW1wiX3dlaWdodFwiXVtzS2V5XSB8fCAwO1xuICByZXR1cm4gKyh3ZWlnaHRCIC0gd2VpZ2h0QSk7XG59XG5cblxuLy8gV29yZCwgU3lub255bSwgUmVnZXhwIC8gRXh0cmFjdGlvblJ1bGVcblxuZXhwb3J0IGZ1bmN0aW9uIGF1Z21lbnRDb250ZXh0MShjb250ZXh0OiBJRk1hdGNoLmNvbnRleHQsIG9SdWxlczogQXJyYXk8SUZNb2RlbC5JUnVsZT4sIG9wdGlvbnM6IElNYXRjaE9wdGlvbnMpOiBBcnJheTxJRk1hdGNoLmNvbnRleHQ+IHtcbiAgdmFyIHNLZXkgPSBvUnVsZXNbMF0ua2V5O1xuICAvLyBjaGVjayB0aGF0IHJ1bGVcbiAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcbiAgICAvLyBjaGVjayBjb25zaXN0ZW5jeVxuICAgIG9SdWxlcy5ldmVyeShmdW5jdGlvbiAoaVJ1bGUpIHtcbiAgICAgIGlmIChpUnVsZS5rZXkgIT09IHNLZXkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW5ob21vZ2Vub3VzIGtleXMgaW4gcnVsZXMsIGV4cGVjdGVkIFwiICsgc0tleSArIFwiIHdhcyBcIiArIEpTT04uc3RyaW5naWZ5KGlSdWxlKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIGxvb2sgZm9yIHJ1bGVzIHdoaWNoIG1hdGNoXG4gIHZhciByZXMgPSBvUnVsZXMubWFwKGZ1bmN0aW9uIChvUnVsZSkge1xuICAgIC8vIGlzIHRoaXMgcnVsZSBhcHBsaWNhYmxlXG4gICAgc3dpdGNoIChvUnVsZS50eXBlKSB7XG4gICAgICBjYXNlIElGTW9kZWwuRW51bVJ1bGVUeXBlLldPUkQ6XG4gICAgICAgIHJldHVybiBtYXRjaFdvcmQob1J1bGUsIGNvbnRleHQsIG9wdGlvbnMpXG4gICAgICBjYXNlIElGTW9kZWwuRW51bVJ1bGVUeXBlLlJFR0VYUDpcbiAgICAgICAgcmV0dXJuIG1hdGNoUmVnRXhwKG9SdWxlLCBjb250ZXh0LCBvcHRpb25zKTtcbiAgICAgIC8vICAgY2FzZSBcIkV4dHJhY3Rpb25cIjpcbiAgICAgIC8vICAgICByZXR1cm4gbWF0Y2hFeHRyYWN0aW9uKG9SdWxlLGNvbnRleHQpO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkXG4gIH0pLmZpbHRlcihmdW5jdGlvbiAob3Jlcykge1xuICAgIHJldHVybiAhIW9yZXNcbiAgfSkuc29ydChcbiAgICBzb3J0QnlXZWlnaHQuYmluZCh0aGlzLCBzS2V5KVxuICAgICk7XG4gICAgLy9kZWJ1Z2xvZyhcImhhc3NvcnRlZFwiICsgSlNPTi5zdHJpbmdpZnkocmVzLHVuZGVmaW5lZCwyKSk7XG4gIHJldHVybiByZXM7XG4gIC8vIE9iamVjdC5rZXlzKCkuZm9yRWFjaChmdW5jdGlvbiAoc0tleSkge1xuICAvLyB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGF1Z21lbnRDb250ZXh0KGNvbnRleHQ6IElGTWF0Y2guY29udGV4dCwgYVJ1bGVzOiBBcnJheTxJRk1vZGVsLklSdWxlPik6IEFycmF5PElGTWF0Y2guY29udGV4dD4ge1xuXG4gIHZhciBvcHRpb25zMTogSU1hdGNoT3B0aW9ucyA9IHtcbiAgICBtYXRjaG90aGVyczogdHJ1ZSxcbiAgICBvdmVycmlkZTogZmFsc2VcbiAgfSBhcyBJTWF0Y2hPcHRpb25zO1xuXG4gIHZhciBhUmVzID0gYXVnbWVudENvbnRleHQxKGNvbnRleHQsIGFSdWxlcywgb3B0aW9uczEpXG5cbiAgaWYgKGFSZXMubGVuZ3RoID09PSAwKSB7XG4gICAgdmFyIG9wdGlvbnMyOiBJTWF0Y2hPcHRpb25zID0ge1xuICAgICAgbWF0Y2hvdGhlcnM6IGZhbHNlLFxuICAgICAgb3ZlcnJpZGU6IHRydWVcbiAgICB9IGFzIElNYXRjaE9wdGlvbnM7XG4gICAgYVJlcyA9IGF1Z21lbnRDb250ZXh0MShjb250ZXh0LCBhUnVsZXMsIG9wdGlvbnMyKTtcbiAgfVxuICByZXR1cm4gYVJlcztcbn1cbiJdfQ==
