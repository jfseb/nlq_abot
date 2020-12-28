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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tYXRjaC9pbnB1dEZpbHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCw2Q0FBNkM7QUFDN0MsNENBQTRDO0FBRTVDLDRDQUE0QztBQUU1Qyw4Q0FBOEM7QUFFOUMsZ0NBQWdDO0FBQ2hDLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUV4QyxzREFBd0Q7QUFDeEQsb0NBQW9DO0FBRXBDLCtDQUErQztBQUcvQyx5REFBeUQ7QUFFekQsaUNBQWlDO0FBRWpDLHNDQUFzQztBQUt0QyxNQUFNLFNBQVMsR0FBUSxNQUFNLENBQUM7QUFFOUIsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFBO0FBQ25DLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQTtBQUNyQyxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUE7QUFFckMsU0FBZ0IsU0FBUyxDQUFDLENBQUM7SUFDekIsUUFBUSxHQUFHLENBQUMsQ0FBQztJQUNiLFNBQVMsR0FBRyxDQUFDLENBQUM7SUFDZCxTQUFTLEdBQUcsQ0FBQyxDQUFDO0FBQ2hCLENBQUM7QUFKRCw4QkFJQztBQUdEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsWUFBWSxDQUFDLE1BQWMsRUFBRSxNQUFjO0lBQ3pELE9BQU8sUUFBUSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBQyxNQUFNLENBQUMsQ0FBQztBQUN0RCxDQUFDO0FBRkQsb0NBRUM7QUFJQSxDQUFDO0FBcUJGLFNBQWdCLFlBQVksQ0FBQyxDQUFTO0lBQ3BDLFNBQVM7SUFDVCxnQkFBZ0I7SUFDaEIsT0FBTyxDQUFDLENBQUM7SUFDVCxvREFBb0Q7QUFDdEQsQ0FBQztBQUxELG9DQUtDO0FBR0QsU0FBUyxjQUFjLENBQUMs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QUFJO1FBQ2pCLFFBQVEsRUFBRSxLQUFLO0tBQ0MsQ0FBQztJQUVuQixJQUFJLElBQUksR0FBRyxlQUFlLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUVyRCxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ3JCLElBQUksUUFBUSxHQUFrQjtZQUM1QixXQUFXLEVBQUUsS0FBSztZQUNsQixRQUFRLEVBQUUsSUFBSTtTQUNFLENBQUM7UUFDbkIsSUFBSSxHQUFHLGVBQWUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0tBQ25EO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBakJELHdDQWlCQyIsImZpbGUiOiJtYXRjaC9pbnB1dEZpbHRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiB0aGUgaW5wdXQgZmlsdGVyIHN0YWdlIHByZXByb2Nlc3NlcyBhIGN1cnJlbnQgY29udGV4dFxyXG4gKlxyXG4gKiBJdCBhKSBjb21iaW5lcyBtdWx0aS1zZWdtZW50IGFyZ3VtZW50cyBpbnRvIG9uZSBjb250ZXh0IG1lbWJlcnNcclxuICogSXQgYikgYXR0ZW1wdHMgdG8gYXVnbWVudCB0aGUgY29udGV4dCBieSBhZGRpdGlvbmFsIHF1YWxpZmljYXRpb25zXHJcbiAqICAgICAgICAgICAoTWlkIHRlcm0gZ2VuZXJhdGluZyBBbHRlcm5hdGl2ZXMsIGUuZy5cclxuICogICAgICAgICAgICAgICAgIENsaWVudFNpZGVUYXJnZXRSZXNvbHV0aW9uIC0+IHVuaXQgdGVzdD9cclxuICogICAgICAgICAgICAgICAgIENsaWVudFNpZGVUYXJnZXRSZXNvbHV0aW9uIC0+IHNvdXJjZSA/XHJcbiAqICAgICAgICAgICApXHJcbiAqICBTaW1wbGUgcnVsZXMgbGlrZSAgSW50ZW50XHJcbiAqXHJcbiAqXHJcbiAqIEBtb2R1bGUgamZzZWIuZmRldnN0YXJ0LmlucHV0RmlsdGVyXHJcbiAqIEBmaWxlIGlucHV0RmlsdGVyLnRzXHJcbiAqIEBjb3B5cmlnaHQgKGMpIDIwMTYgR2VyZCBGb3JzdG1hbm5cclxuICovXHJcbi8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL2xpYi9ub2RlLTQuZC50c1wiIC8+XHJcbmltcG9ydCAqIGFzIGRpc3RhbmNlIGZyb20gJ2Fib3Rfc3RyaW5nZGlzdCc7XHJcblxyXG4vL2ltcG9ydCAqIGFzIExvZ2dlciBmcm9tICcuLi91dGlscy9sb2dnZXInO1xyXG5cclxuLy9jb25zdCBsb2dnZXIgPSBMb2dnZXIubG9nZ2VyKCdpbnB1dEZpbHRlcicpO1xyXG5cclxuaW1wb3J0ICogYXMgZGVidWcgZnJvbSAnZGVidWdmJztcclxudmFyIGRlYnVncGVyZiA9IGRlYnVnKCdwZXJmJyk7XHJcbnZhciBsb2dnZXIgPSBkZWJ1ZygnaW5wdXRGaWx0ZXJMb2dnZXInKTtcclxuXHJcbmltcG9ydCB7SUZNb2RlbCBhcyBJRk1vZGVsfSBmcm9tICcuLi9tb2RlbC9pbmRleF9tb2RlbCc7XHJcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJ2Fib3RfdXRpbHMnO1xyXG5cclxuLy9pbXBvcnQgKiBhcyBJRk1hdGNoIGZyb20gJy4uL21hdGNoL2lmZXJiYXNlJztcclxuXHJcblxyXG4vL2ltcG9ydCAqIGFzIGlucHV0RmlsdGVyUnVsZXMgZnJvbSAnLi9pbnB1dEZpbHRlclJ1bGVzJztcclxuXHJcbmltcG9ydCAqIGFzIEFsZ29sIGZyb20gJy4vYWxnb2wnO1xyXG5cclxuaW1wb3J0ICogYXMgSUZNYXRjaCBmcm9tICcuL2lmZXJiYXNlJztcclxuaW1wb3J0ICogYXMgSU1hdGNoIGZyb20gJy4vaWZlcmJhc2UnO1xyXG5cclxuaW1wb3J0IHsgQnJlYWtEb3duIGFzIGJyZWFrZG93bn0gZnJvbSAnLi4vbW9kZWwvaW5kZXhfbW9kZWwnO1xyXG5cclxuY29uc3QgQW55T2JqZWN0ID0gPGFueT5PYmplY3Q7XHJcblxyXG52YXIgZGVidWdsb2cgPSBkZWJ1ZygnaW5wdXRGaWx0ZXInKVxyXG52YXIgZGVidWdsb2dWID0gZGVidWcoJ2lucHV0VkZpbHRlcicpXHJcbnZhciBkZWJ1Z2xvZ00gPSBkZWJ1ZygnaW5wdXRNRmlsdGVyJylcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtb2NrRGVidWcobykge1xyXG4gIGRlYnVnbG9nID0gbztcclxuICBkZWJ1Z2xvZ1YgPSBvO1xyXG4gIGRlYnVnbG9nTSA9IG87XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogQHBhcmFtIHNUZXh0IHtzdHJpbmd9IHRoZSB0ZXh0IHRvIG1hdGNoIHRvIE5hdlRhcmdldFJlc29sdXRpb25cclxuICogQHBhcmFtIHNUZXh0MiB7c3RyaW5nfSB0aGUgcXVlcnkgdGV4dCwgZS5nLiBOYXZUYXJnZXRcclxuICpcclxuICogQHJldHVybiB0aGUgZGlzdGFuY2UsIG5vdGUgdGhhdCBpcyBpcyAqbm90KiBzeW1tZXRyaWMhXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY2FsY0Rpc3RhbmNlKHNUZXh0MTogc3RyaW5nLCBzVGV4dDI6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgcmV0dXJuIGRpc3RhbmNlLmNhbGNEaXN0YW5jZUFkanVzdGVkKHNUZXh0MSxzVGV4dDIpO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJQ250UmVjIHtcclxufTtcclxuXHJcblxyXG50eXBlIElSdWxlID0gSUZNYXRjaC5JUnVsZVxyXG5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSU1hdGNoT3B0aW9ucyB7XHJcbiAgbWF0Y2hvdGhlcnM/OiBib29sZWFuLFxyXG4gIGF1Z21lbnQ/OiBib29sZWFuLFxyXG4gIG92ZXJyaWRlPzogYm9vbGVhblxyXG59XHJcblxyXG5pbnRlcmZhY2UgSU1hdGNoQ291bnQge1xyXG4gIGVxdWFsOiBudW1iZXJcclxuICBkaWZmZXJlbnQ6IG51bWJlclxyXG4gIHNwdXJpb3VzUjogbnVtYmVyXHJcbiAgc3B1cmlvdXNMOiBudW1iZXJcclxufVxyXG5cclxudHlwZSBFbnVtUnVsZVR5cGUgPSBJRk1vZGVsLkVudW1SdWxlVHlwZVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxldmVuUGVuYWx0eShpOiBudW1iZXIpOiBudW1iZXIge1xyXG4gIC8vIDEgLT4gMVxyXG4gIC8vIGN1dE9mZiA9PiAwLjhcclxuICByZXR1cm4gaTtcclxuICAvL3JldHVybiAgIDEgLSAgKDEgLSBpKSAqMC4yL0FsZ29sLkN1dG9mZl9Xb3JkTWF0Y2g7XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBub25Qcml2YXRlS2V5cyhvQSkge1xyXG4gIHJldHVybiBPYmplY3Qua2V5cyhvQSkuZmlsdGVyKGtleSA9PiB7XHJcbiAgICByZXR1cm4ga2V5WzBdICE9PSAnXyc7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb3VudEFpbkIob0EsIG9CLCBmbkNvbXBhcmUsIGFLZXlJZ25vcmU/KTogbnVtYmVyIHtcclxuICBhS2V5SWdub3JlID0gQXJyYXkuaXNBcnJheShhS2V5SWdub3JlKSA/IGFLZXlJZ25vcmUgOlxyXG4gICAgdHlwZW9mIGFLZXlJZ25vcmUgPT09IFwic3RyaW5nXCIgPyBbYUtleUlnbm9yZV0gOiBbXTtcclxuICBmbkNvbXBhcmUgPSBmbkNvbXBhcmUgfHwgZnVuY3Rpb24gKCkgeyByZXR1cm4gdHJ1ZTsgfVxyXG4gIHJldHVybiBub25Qcml2YXRlS2V5cyhvQSkuZmlsdGVyKGZ1bmN0aW9uIChrZXkpIHtcclxuICAgIHJldHVybiBhS2V5SWdub3JlLmluZGV4T2Yoa2V5KSA8IDA7XHJcbiAgfSkuXHJcbiAgICByZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGtleSkge1xyXG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9CLCBrZXkpKSB7XHJcbiAgICAgICAgcHJldiA9IHByZXYgKyAoZm5Db21wYXJlKG9BW2tleV0sIG9CW2tleV0sIGtleSkgPyAxIDogMClcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcHJldlxyXG4gICAgfSwgMClcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNwdXJpb3VzQW5vdEluQihvQSwgb0IsIGFLZXlJZ25vcmU/KSB7XHJcbiAgYUtleUlnbm9yZSA9IEFycmF5LmlzQXJyYXkoYUtleUlnbm9yZSkgPyBhS2V5SWdub3JlIDpcclxuICAgIHR5cGVvZiBhS2V5SWdub3JlID09PSBcInN0cmluZ1wiID8gW2FLZXlJZ25vcmVdIDogW107XHJcbiAgcmV0dXJuIG5vblByaXZhdGVLZXlzKG9BKS5maWx0ZXIoZnVuY3Rpb24gKGtleSkge1xyXG4gICAgcmV0dXJuIGFLZXlJZ25vcmUuaW5kZXhPZihrZXkpIDwgMDtcclxuICB9KS5cclxuICAgIHJlZHVjZShmdW5jdGlvbiAocHJldiwga2V5KSB7XHJcbiAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9CLCBrZXkpKSB7XHJcbiAgICAgICAgcHJldiA9IHByZXYgKyAxXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHByZXZcclxuICAgIH0sIDApXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxvd2VyQ2FzZShvKSB7XHJcbiAgaWYgKHR5cGVvZiBvID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICByZXR1cm4gby50b0xvd2VyQ2FzZSgpXHJcbiAgfVxyXG4gIHJldHVybiBvXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb21wYXJlQ29udGV4dChvQSwgb0IsIGFLZXlJZ25vcmU/KSB7XHJcbiAgdmFyIGVxdWFsID0gY291bnRBaW5CKG9BLCBvQiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGxvd2VyQ2FzZShhKSA9PT0gbG93ZXJDYXNlKGIpOyB9LCBhS2V5SWdub3JlKTtcclxuICB2YXIgZGlmZmVyZW50ID0gY291bnRBaW5CKG9BLCBvQiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGxvd2VyQ2FzZShhKSAhPT0gbG93ZXJDYXNlKGIpOyB9LCBhS2V5SWdub3JlKTtcclxuICB2YXIgc3B1cmlvdXNMID0gc3B1cmlvdXNBbm90SW5CKG9BLCBvQiwgYUtleUlnbm9yZSlcclxuICB2YXIgc3B1cmlvdXNSID0gc3B1cmlvdXNBbm90SW5CKG9CLCBvQSwgYUtleUlnbm9yZSlcclxuICByZXR1cm4ge1xyXG4gICAgZXF1YWw6IGVxdWFsLFxyXG4gICAgZGlmZmVyZW50OiBkaWZmZXJlbnQsXHJcbiAgICBzcHVyaW91c0w6IHNwdXJpb3VzTCxcclxuICAgIHNwdXJpb3VzUjogc3B1cmlvdXNSXHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBzb3J0QnlSYW5rKGE6IElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nLCBiOiBJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZyk6IG51bWJlciB7XHJcbiAgdmFyIHIgPSAtKChhLl9yYW5raW5nIHx8IDEuMCkgLSAoYi5fcmFua2luZyB8fCAxLjApKTtcclxuICBpZiAocikge1xyXG4gICAgcmV0dXJuIHI7XHJcbiAgfVxyXG4gIGlmIChhLmNhdGVnb3J5ICYmIGIuY2F0ZWdvcnkpIHtcclxuICAgIHIgPSBhLmNhdGVnb3J5LmxvY2FsZUNvbXBhcmUoYi5jYXRlZ29yeSk7XHJcbiAgICBpZiAocikge1xyXG4gICAgICByZXR1cm4gcjtcclxuICAgIH1cclxuICB9XHJcbiAgaWYgKGEubWF0Y2hlZFN0cmluZyAmJiBiLm1hdGNoZWRTdHJpbmcpIHtcclxuICAgIHIgPSBhLm1hdGNoZWRTdHJpbmcubG9jYWxlQ29tcGFyZShiLm1hdGNoZWRTdHJpbmcpO1xyXG4gICAgaWYgKHIpIHtcclxuICAgICAgcmV0dXJuIHI7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiAwO1xyXG59XHJcbi8qXHJcbmZ1bmN0aW9uIGNtcEJ5UmFuayhhOiBJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZywgYjogSUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmcpOiBudW1iZXIge1xyXG4gIHJldHVybiBzb3J0QnlSYW5rKGEsYik7XHJcbn1cclxuKi9cclxuXHJcblxyXG5mdW5jdGlvbiBzb3J0QnlSYW5rVGhlblJlc3VsdChhOiBJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZCwgYjogSUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWQpOiBudW1iZXIge1xyXG4gIHZhciByID0gLSgoYS5fcmFua2luZyB8fCAxLjApIC0gKGIuX3JhbmtpbmcgfHwgMS4wKSk7XHJcbiAgaWYgKHIpIHtcclxuICAgIHJldHVybiByO1xyXG4gIH1cclxuICBpZiAoYS5jYXRlZ29yeSAmJiBiLmNhdGVnb3J5KSB7XHJcbiAgICByID0gYS5jYXRlZ29yeS5sb2NhbGVDb21wYXJlKGIuY2F0ZWdvcnkpO1xyXG4gICAgaWYgKHIpIHtcclxuICAgICAgcmV0dXJuIHI7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGlmIChhLm1hdGNoZWRTdHJpbmcgJiYgYi5tYXRjaGVkU3RyaW5nKSB7XHJcbiAgICByID0gYS5tYXRjaGVkU3RyaW5nLmxvY2FsZUNvbXBhcmUoYi5tYXRjaGVkU3RyaW5nKTtcclxuICAgIGlmIChyKSB7XHJcbiAgICAgIHJldHVybiByO1xyXG4gICAgfVxyXG4gIH1cclxuICByID0gY21wQnlSZXN1bHRUaGVuUmFuayhhLGIpO1xyXG4gIGlmKHIpIHtcclxuICAgIHJldHVybiByO1xyXG4gIH1cclxuICByZXR1cm4gMDtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjbXBCeVJlc3VsdChhOiBJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZCwgYjogSUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWQpOiBudW1iZXIge1xyXG4gIGlmKGEucnVsZSA9PT0gYi5ydWxlKSB7XHJcbiAgICByZXR1cm4gMDtcclxuICB9XHJcbiAgdmFyIHIgPSBhLnJ1bGUuYml0aW5kZXggLSBiLnJ1bGUuYml0aW5kZXg7XHJcbiAgaWYocikge1xyXG4gICAgcmV0dXJuIHI7XHJcbiAgfVxyXG4gIGlmIChhLnJ1bGUubWF0Y2hlZFN0cmluZyAmJiBiLnJ1bGUubWF0Y2hlZFN0cmluZykge1xyXG4gICAgciA9IGEucnVsZS5tYXRjaGVkU3RyaW5nLmxvY2FsZUNvbXBhcmUoYi5ydWxlLm1hdGNoZWRTdHJpbmcpO1xyXG4gICAgaWYgKHIpIHtcclxuICAgICAgcmV0dXJuIHI7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGlmIChhLnJ1bGUuY2F0ZWdvcnkgJiYgYi5ydWxlLmNhdGVnb3J5KSB7XHJcbiAgICByID0gYS5ydWxlLmNhdGVnb3J5LmxvY2FsZUNvbXBhcmUoYi5ydWxlLmNhdGVnb3J5KTtcclxuICAgIGlmIChyKSB7XHJcbiAgICAgIHJldHVybiByO1xyXG4gICAgfVxyXG4gIH1cclxuICBpZiAoYS5ydWxlLndvcmRUeXBlICYmIGIucnVsZS53b3JkVHlwZSkge1xyXG4gICAgciA9IGEucnVsZS53b3JkVHlwZS5sb2NhbGVDb21wYXJlKGIucnVsZS53b3JkVHlwZSk7XHJcbiAgICBpZiAocikge1xyXG4gICAgICByZXR1cm4gcjtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIDA7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY21wQnlSZXN1bHRUaGVuUmFuayhhOiBJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZCwgYjogSUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWQpOiBudW1iZXIge1xyXG4gIHZhciByID0gY21wQnlSZXN1bHQoYSxiKTtcclxuICBpZiAocikge1xyXG4gICAgcmV0dXJuIHI7XHJcbiAgfVxyXG4gIHZhciByID0gLSgoYS5fcmFua2luZyB8fCAxLjApIC0gKGIuX3JhbmtpbmcgfHwgMS4wKSk7XHJcbiAgaWYgKHIpIHtcclxuICAgIHJldHVybiByO1xyXG4gIH1cclxuICAvLyBUT0RPIGNvbnNpZGVyIGEgdGllYnJlYWtlciBoZXJlXHJcbiAgcmV0dXJuIDA7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFuYWx5c2VSZWdleHAoXHJcbiAgcmVzIDogQXJyYXk8SUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+LFxyXG4gIG9SdWxlIDogSUZNb2RlbC5tUnVsZSxcclxuICBzdHJpbmcgOiBzdHJpbmcgKVxyXG57XHJcbiAgZGVidWdsb2coKCk9PiBcIiBoZXJlIHJlZ2V4cDogXCIgKyBKU09OLnN0cmluZ2lmeShvUnVsZSwgdW5kZWZpbmVkLCAyKSArICdcXG4nICsgb1J1bGUucmVnZXhwLnRvU3RyaW5nKCkgKTtcclxuICB2YXIgbSA9IG9SdWxlLnJlZ2V4cC5leGVjKHN0cmluZyk7XHJcbiAgdmFyIHJlYyA9IHVuZGVmaW5lZDtcclxuICBpZiAobSkge1xyXG4gICAgcmVjID0ge1xyXG4gICAgICBzdHJpbmc6IHN0cmluZyxcclxuICAgICAgbWF0Y2hlZFN0cmluZzogKG9SdWxlLm1hdGNoSW5kZXggIT09IHVuZGVmaW5lZCAmJiBtW29SdWxlLm1hdGNoSW5kZXhdKSB8fCBzdHJpbmcsXHJcbiAgICAgIHJ1bGUgOiBvUnVsZSxcclxuICAgICAgY2F0ZWdvcnk6IG9SdWxlLmNhdGVnb3J5LFxyXG4gICAgICBfcmFua2luZzogb1J1bGUuX3JhbmtpbmcgfHwgMS4wXHJcbiAgICB9O1xyXG4gICAgZGVidWdsb2coKCk9PlwiXFxuIW1hdGNoIHJlZ2V4cCAgXCIgKyBvUnVsZS5yZWdleHAudG9TdHJpbmcoKSArIFwiIFwiICsgcmVjLl9yYW5raW5nLnRvRml4ZWQoMykgKyBcIiAgXCIgKyBzdHJpbmcgKyBcIj1cIiAgKyBvUnVsZS5sb3dlcmNhc2V3b3JkICArIFwiID0+IFwiICsgb1J1bGUubWF0Y2hlZFN0cmluZyArIFwiL1wiICsgb1J1bGUuY2F0ZWdvcnkpO1xyXG4gICAgcmVzLnB1c2gocmVjKTtcclxuICB9XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tPbmVSdWxlKHN0cmluZzogc3RyaW5nLCBsY1N0cmluZyA6IHN0cmluZywgZXhhY3QgOiBib29sZWFuLFxyXG5yZXMgOiBBcnJheTxJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZz4sXHJcbm9SdWxlIDogSUZNb2RlbC5tUnVsZSwgY250UmVjPyA6IElDbnRSZWMgKSB7XHJcbiAgICBkZWJ1Z2xvZ1YoKCk9PiAnYXR0ZW1wdGluZyB0byBtYXRjaCBydWxlICcgKyBKU09OLnN0cmluZ2lmeShvUnVsZSkgKyBcIiB0byBzdHJpbmcgXFxcIlwiICsgc3RyaW5nICsgXCJcXFwiXCIpO1xyXG4gICAgc3dpdGNoIChvUnVsZS50eXBlKSB7XHJcbiAgICAgIGNhc2UgSUZNb2RlbC5FbnVtUnVsZVR5cGUuV09SRDpcclxuICAgICAgICBpZighb1J1bGUubG93ZXJjYXNld29yZCkge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdydWxlIHdpdGhvdXQgYSBsb3dlcmNhc2UgdmFyaWFudCcgKyBKU09OLnN0cmluZ2lmeShvUnVsZSwgdW5kZWZpbmVkLCAyKSk7XHJcbiAgICAgICAgIH07XHJcbiAgICAgICAgIC8vIFRPRE8gQ0hFQ0sgVEhJU1xyXG4gICAgICAgIGlmIChleGFjdCAmJiAob1J1bGUud29yZCA9PT0gc3RyaW5nIHx8IG9SdWxlLmxvd2VyY2FzZXdvcmQgPT09IGxjU3RyaW5nKSkge1xyXG4gIC8vICAgICAgaWYgKGV4YWN0ICYmIG9SdWxlLndvcmQgPT09IHN0cmluZyB8fCBvUnVsZS5sb3dlcmNhc2V3b3JkID09PSBsY1N0cmluZykge1xyXG4gICAgICAgICAgZGVidWdsb2coKCk9PlwiXFxuIW1hdGNoZWQgZXhhY3QgXCIgKyBzdHJpbmcgKyBcIj1cIiAgKyBvUnVsZS5sb3dlcmNhc2V3b3JkICArIFwiID0+IFwiICsgb1J1bGUubWF0Y2hlZFN0cmluZyArIFwiL1wiICsgb1J1bGUuY2F0ZWdvcnkpO1xyXG4gICAgICAgICAgcmVzLnB1c2goe1xyXG4gICAgICAgICAgICBzdHJpbmc6IHN0cmluZyxcclxuICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogb1J1bGUubWF0Y2hlZFN0cmluZyxcclxuICAgICAgICAgICAgY2F0ZWdvcnk6IG9SdWxlLmNhdGVnb3J5LFxyXG4gICAgICAgICAgICBfcmFua2luZzogb1J1bGUuX3JhbmtpbmcgfHwgMS4wXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWV4YWN0ICYmICFvUnVsZS5leGFjdE9ubHkpIHtcclxuICAgICAgICAgIHZhciBsZXZlbm1hdGNoID0gY2FsY0Rpc3RhbmNlKG9SdWxlLmxvd2VyY2FzZXdvcmQsIGxjU3RyaW5nKTtcclxuXHJcbi8qXHJcbiAgICAgICAgICBhZGRDbnRSZWMoY250UmVjLFwiY2FsY0Rpc3RhbmNlXCIsIDEpO1xyXG4gICAgICAgICAgaWYobGV2ZW5tYXRjaCA8IDUwKSB7XHJcbiAgICAgICAgICAgIGFkZENudFJlYyhjbnRSZWMsXCJjYWxjRGlzdGFuY2VFeHBcIiwgMSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZihsZXZlbm1hdGNoIDwgNDAwMDApIHtcclxuICAgICAgICAgICAgYWRkQ250UmVjKGNudFJlYyxcImNhbGNEaXN0YW5jZUJlbG93NDBrXCIsIDEpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgKi9cclxuICAgICAgICAgIC8vaWYob1J1bGUubG93ZXJjYXNld29yZCA9PT0gXCJjb3Ntb3NcIikge1xyXG4gICAgICAgICAgLy8gIGNvbnNvbGUubG9nKFwiaGVyZSByYW5raW5nIFwiICsgbGV2ZW5tYXRjaCArIFwiIFwiICsgb1J1bGUubG93ZXJjYXNld29yZCArIFwiIFwiICsgbGNTdHJpbmcpO1xyXG4gICAgICAgICAgLy99XHJcbiAgICAgICAgICBpZiAobGV2ZW5tYXRjaCA+PSBBbGdvbC5DdXRvZmZfV29yZE1hdGNoKSB7IC8vIGxldmVuQ3V0b2ZmKSB7XHJcbiAgICAgICAgICAgIGFkZENudFJlYyhjbnRSZWMsXCJjYWxjRGlzdGFuY2VPa1wiLCAxKTtcclxuICAgICAgICAgICAgdmFyIHJlYyA9IHtcclxuICAgICAgICAgICAgICBzdHJpbmc6IHN0cmluZyxcclxuICAgICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBvUnVsZS5tYXRjaGVkU3RyaW5nLFxyXG4gICAgICAgICAgICAgIGNhdGVnb3J5OiBvUnVsZS5jYXRlZ29yeSxcclxuICAgICAgICAgICAgICBfcmFua2luZzogKG9SdWxlLl9yYW5raW5nIHx8IDEuMCkgKiBsZXZlblBlbmFsdHkobGV2ZW5tYXRjaCksXHJcbiAgICAgICAgICAgICAgbGV2ZW5tYXRjaDogbGV2ZW5tYXRjaFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBkZWJ1Z2xvZygoKT0+XCJcXG4hZnV6enkgXCIgKyAobGV2ZW5tYXRjaCkudG9GaXhlZCgzKSArIFwiIFwiICsgcmVjLl9yYW5raW5nLnRvRml4ZWQoMykgKyBcIiAgXCIgKyBzdHJpbmcgKyBcIj1cIiAgKyBvUnVsZS5sb3dlcmNhc2V3b3JkICArIFwiID0+IFwiICsgb1J1bGUubWF0Y2hlZFN0cmluZyArIFwiL1wiICsgb1J1bGUuY2F0ZWdvcnkpO1xyXG4gICAgICAgICAgICByZXMucHVzaChyZWMpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBJRk1vZGVsLkVudW1SdWxlVHlwZS5SRUdFWFA6IHtcclxuICAgICAgICBhbmFseXNlUmVnZXhwKCByZXMsIG9SdWxlLCBzdHJpbmcgKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgICAvL2JyZWFrO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInVua25vd24gdHlwZVwiICsgSlNPTi5zdHJpbmdpZnkob1J1bGUsIHVuZGVmaW5lZCwgMikpXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrT25lUnVsZVdpdGhPZmZzZXQoc3RyaW5nOiBzdHJpbmcsIGxjU3RyaW5nIDogc3RyaW5nLCBleGFjdCA6IGJvb2xlYW4sXHJcbnJlcyA6IEFycmF5PElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWQ+LFxyXG5vUnVsZSA6IElGTW9kZWwubVJ1bGUsIGNudFJlYz8gOiBJQ250UmVjICkge1xyXG4gICAgZGVidWdsb2dWKCgpPT4nYXR0ZW1wdGluZyB0byBtYXRjaCBydWxlICcgKyBKU09OLnN0cmluZ2lmeShvUnVsZSkgKyBcIiB0byBzdHJpbmcgXFxcIlwiICsgc3RyaW5nICsgXCJcXFwiXCIpO1xyXG4gICAgc3dpdGNoIChvUnVsZS50eXBlKSB7XHJcbiAgICAgIGNhc2UgSUZNb2RlbC5FbnVtUnVsZVR5cGUuV09SRDpcclxuICAgICAgICBpZighb1J1bGUubG93ZXJjYXNld29yZCkge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdydWxlIHdpdGhvdXQgYSBsb3dlcmNhc2UgdmFyaWFudCcgKyBKU09OLnN0cmluZ2lmeShvUnVsZSwgdW5kZWZpbmVkLCAyKSk7XHJcbiAgICAgICAgIH07XHJcbiAgICAgICAgaWYgKGV4YWN0ICYmIChvUnVsZS53b3JkID09PSBzdHJpbmcgfHwgb1J1bGUubG93ZXJjYXNld29yZCA9PT0gbGNTdHJpbmcpKSB7XHJcbiAgICAgICAgICBkZWJ1Z2xvZygoKT0+IFwiXFxuIW1hdGNoZWQgZXhhY3QgXCIgKyBzdHJpbmcgKyBcIj1cIiAgKyBvUnVsZS5sb3dlcmNhc2V3b3JkICArIFwiID0+IFwiICsgb1J1bGUubWF0Y2hlZFN0cmluZyArIFwiL1wiICsgb1J1bGUuY2F0ZWdvcnkpO1xyXG4gICAgICAgICAgcmVzLnB1c2goe1xyXG4gICAgICAgICAgICBzdHJpbmc6IHN0cmluZyxcclxuICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogb1J1bGUubWF0Y2hlZFN0cmluZyxcclxuICAgICAgICAgICAgY2F0ZWdvcnk6IG9SdWxlLmNhdGVnb3J5LFxyXG4gICAgICAgICAgICBydWxlOiBvUnVsZSxcclxuICAgICAgICAgICAgX3Jhbmtpbmc6IG9SdWxlLl9yYW5raW5nIHx8IDEuMFxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFleGFjdCAmJiAhb1J1bGUuZXhhY3RPbmx5KSB7XHJcbiAgICAgICAgICB2YXIgbGV2ZW5tYXRjaCA9IGNhbGNEaXN0YW5jZShvUnVsZS5sb3dlcmNhc2V3b3JkLCBsY1N0cmluZyk7XHJcblxyXG4vKlxyXG4gICAgICAgICAgYWRkQ250UmVjKGNudFJlYyxcImNhbGNEaXN0YW5jZVwiLCAxKTtcclxuICAgICAgICAgIGlmKGxldmVubWF0Y2ggPCA1MCkge1xyXG4gICAgICAgICAgICBhZGRDbnRSZWMoY250UmVjLFwiY2FsY0Rpc3RhbmNlRXhwXCIsIDEpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYobGV2ZW5tYXRjaCA8IDQwMDAwKSB7XHJcbiAgICAgICAgICAgIGFkZENudFJlYyhjbnRSZWMsXCJjYWxjRGlzdGFuY2VCZWxvdzQwa1wiLCAxKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgICovXHJcbiAgICAgICAgICAvL2lmKG9SdWxlLmxvd2VyY2FzZXdvcmQgPT09IFwiY29zbW9zXCIpIHtcclxuICAgICAgICAgIC8vICBjb25zb2xlLmxvZyhcImhlcmUgcmFua2luZyBcIiArIGxldmVubWF0Y2ggKyBcIiBcIiArIG9SdWxlLmxvd2VyY2FzZXdvcmQgKyBcIiBcIiArIGxjU3RyaW5nKTtcclxuICAgICAgICAgIC8vfVxyXG4gICAgICAgICAgaWYgKGxldmVubWF0Y2ggPj0gQWxnb2wuQ3V0b2ZmX1dvcmRNYXRjaCkgeyAvLyBsZXZlbkN1dG9mZikge1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiZm91bmQgcmVjXCIpO1xyXG4gICAgICAgICAgICBhZGRDbnRSZWMoY250UmVjLFwiY2FsY0Rpc3RhbmNlT2tcIiwgMSk7XHJcbiAgICAgICAgICAgIHZhciByZWMgPSB7XHJcbiAgICAgICAgICAgICAgc3RyaW5nOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgcnVsZSA6IG9SdWxlLFxyXG4gICAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IG9SdWxlLm1hdGNoZWRTdHJpbmcsXHJcbiAgICAgICAgICAgICAgY2F0ZWdvcnk6IG9SdWxlLmNhdGVnb3J5LFxyXG4gICAgICAgICAgICAgIF9yYW5raW5nOiAob1J1bGUuX3JhbmtpbmcgfHwgMS4wKSAqIGxldmVuUGVuYWx0eShsZXZlbm1hdGNoKSxcclxuICAgICAgICAgICAgICBsZXZlbm1hdGNoOiBsZXZlbm1hdGNoXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGRlYnVnbG9nKCgpID0+XCJcXG4hQ09STzogZnV6enkgXCIgKyAobGV2ZW5tYXRjaCkudG9GaXhlZCgzKSArIFwiIFwiICsgcmVjLl9yYW5raW5nLnRvRml4ZWQoMykgKyBcIiAgXFxcIlwiICsgc3RyaW5nICsgXCJcXFwiPVwiICArIG9SdWxlLmxvd2VyY2FzZXdvcmQgICsgXCIgPT4gXCIgKyBvUnVsZS5tYXRjaGVkU3RyaW5nICsgXCIvXCIgKyBvUnVsZS5jYXRlZ29yeSArIFwiL1wiICsgb1J1bGUuYml0aW5kZXgpO1xyXG4gICAgICAgICAgICByZXMucHVzaChyZWMpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBJRk1vZGVsLkVudW1SdWxlVHlwZS5SRUdFWFA6IHtcclxuICAgICAgICBhbmFseXNlUmVnZXhwKCByZXMsIG9SdWxlLCBzdHJpbmcgKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgICAvL2JyZWFrO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInVua25vd24gdHlwZVwiICsgSlNPTi5zdHJpbmdpZnkob1J1bGUsIHVuZGVmaW5lZCwgMikpXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBhZGRDbnRSZWMoY250UmVjIDogSUNudFJlYywgbWVtYmVyIDogc3RyaW5nLCBudW1iZXIgOiBudW1iZXIpIHtcclxuICBpZigoIWNudFJlYykgfHwgKG51bWJlciA9PT0gMCkpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY250UmVjW21lbWJlcl0gPSAoY250UmVjW21lbWJlcl0gfHwgMCkgKyBudW1iZXI7XHJcbn1cclxuXHJcbi8qXHJcbmV4cG9ydCBmdW5jdGlvbiBjYXRlZ29yaXplU3RyaW5nKHdvcmQ6IHN0cmluZywgZXhhY3Q6IGJvb2xlYW4sIG9SdWxlczogQXJyYXk8SUZNb2RlbC5tUnVsZT4sXHJcbiBjbnRSZWM/IDogSUNudFJlYyk6IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nPiB7XHJcbiAgLy8gc2ltcGx5IGFwcGx5IGFsbCBydWxlc1xyXG4gIGRlYnVnbG9nVigoKSA9PiBcInJ1bGVzIDogXCIgKyBKU09OLnN0cmluZ2lmeShvUnVsZXMsIHVuZGVmaW5lZCwgMikpO1xyXG5cclxuICB2YXIgbGNTdHJpbmcgPSB3b3JkLnRvTG93ZXJDYXNlKCk7XHJcbiAgdmFyIHJlczogQXJyYXk8SUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+ID0gW11cclxuICBvUnVsZXMuZm9yRWFjaChmdW5jdGlvbiAob1J1bGUpIHtcclxuICAgIGNoZWNrT25lUnVsZSh3b3JkLGxjU3RyaW5nLGV4YWN0LHJlcyxvUnVsZSxjbnRSZWMpO1xyXG4gIH0pO1xyXG4gIHJlcy5zb3J0KHNvcnRCeVJhbmspO1xyXG4gIHJldHVybiByZXM7XHJcbn1cclxuKi9cclxuXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNhdGVnb3JpemVTaW5nbGVXb3JkV2l0aE9mZnNldCh3b3JkOiBzdHJpbmcsIGxjd29yZCA6IHN0cmluZywgZXhhY3Q6IGJvb2xlYW4sIG9SdWxlczogQXJyYXk8SUZNb2RlbC5tUnVsZT4sXHJcbiBjbnRSZWM/IDogSUNudFJlYyk6IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkPiB7XHJcbiAgLy8gc2ltcGx5IGFwcGx5IGFsbCBydWxlc1xyXG4gIGRlYnVnbG9nVigoKT0+IFwicnVsZXMgOiBcIiArIEpTT04uc3RyaW5naWZ5KG9SdWxlcywgdW5kZWZpbmVkLCAyKSk7XHJcbiAgdmFyIHJlczogQXJyYXk8SU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZD4gPSBbXVxyXG4gIG9SdWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChvUnVsZSkge1xyXG4gICAgY2hlY2tPbmVSdWxlV2l0aE9mZnNldCh3b3JkLGxjd29yZCxleGFjdCxyZXMsb1J1bGUsY250UmVjKTtcclxuICB9KTtcclxuICBkZWJ1Z2xvZyhgQ1NXV086IGdvdCByZXN1bHRzIGZvciAke2xjd29yZH0gICR7cmVzLmxlbmd0aH1gKTtcclxuICByZXMuc29ydChzb3J0QnlSYW5rKTtcclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG4vKlxyXG5leHBvcnQgZnVuY3Rpb24gcG9zdEZpbHRlcihyZXMgOiBBcnJheTxJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZz4pIDogQXJyYXk8SUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+IHtcclxuICByZXMuc29ydChzb3J0QnlSYW5rKTtcclxuICB2YXIgYmVzdFJhbmsgPSAwO1xyXG4gIC8vY29uc29sZS5sb2coXCJcXG5waWx0ZXJlZCBcIiArIEpTT04uc3RyaW5naWZ5KHJlcykpO1xyXG4gICAgZGVidWdsb2coKCk9PiBcInByZUZpbHRlciA6IFxcblwiICsgcmVzLm1hcChmdW5jdGlvbih3b3JkLGluZGV4KSB7XHJcbiAgICAgIHJldHVybiBgJHtpbmRleH0gJHt3b3JkLl9yYW5raW5nfSAgPT4gXCIke3dvcmQuY2F0ZWdvcnl9XCIgJHt3b3JkLm1hdGNoZWRTdHJpbmd9YDtcclxuICAgIH0pLmpvaW4oXCJcXG5cIikpO1xyXG4gIHZhciByID0gcmVzLmZpbHRlcihmdW5jdGlvbihyZXN4LGluZGV4KSB7XHJcbiAgICBpZihpbmRleCA9PT0gMCkge1xyXG4gICAgICBiZXN0UmFuayA9IHJlc3guX3Jhbmtpbmc7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgLy8gMS0wLjkgPSAwLjFcclxuICAgIC8vIDEtIDAuOTMgPSAwLjdcclxuICAgIC8vIDEvN1xyXG4gICAgdmFyIGRlbHRhID0gYmVzdFJhbmsgLyByZXN4Ll9yYW5raW5nO1xyXG4gICAgaWYoKHJlc3gubWF0Y2hlZFN0cmluZyA9PT0gcmVzW2luZGV4LTFdLm1hdGNoZWRTdHJpbmcpXHJcbiAgICAgICYmIChyZXN4LmNhdGVnb3J5ID09PSByZXNbaW5kZXgtMV0uY2F0ZWdvcnkpXHJcbiAgICAgICkge1xyXG4gICAgICAgIGRlYnVnbG9nKCdwb3N0ZmlsdGVyIGlnbm9yaW5nIGJpdGluaWRleCEhIScpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICAvL2NvbnNvbGUubG9nKFwiXFxuIGRlbHRhIGZvciBcIiArIGRlbHRhICsgXCIgIFwiICsgcmVzeC5fcmFua2luZyk7XHJcbiAgICBpZiAocmVzeC5sZXZlbm1hdGNoICYmIChkZWx0YSA+IDEuMDMpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0pO1xyXG4gIGRlYnVnbG9nKCgpPT4gYFxcbmZpbHRlcmVkICR7ci5sZW5ndGh9LyR7cmVzLmxlbmd0aH1gICsgSlNPTi5zdHJpbmdpZnkocikpO1xyXG4gIHJldHVybiByO1xyXG59XHJcbiovXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGRyb3BMb3dlclJhbmtlZEVxdWFsUmVzdWx0KHJlcyA6IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkPikgOiBBcnJheTxJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZD4ge1xyXG4gIHJlcy5zb3J0KGNtcEJ5UmVzdWx0VGhlblJhbmspO1xyXG4gIHJldHVybiByZXMuZmlsdGVyKGZ1bmN0aW9uKHJlc3gsaW5kZXgpIHtcclxuICAgIHZhciBwcmlvciA9IHJlc1tpbmRleC0xXTtcclxuICAgIGlmKCBwcmlvciAmJlxyXG4gICAgICAgICEocmVzeC5ydWxlICYmIHJlc3gucnVsZS5yYW5nZSlcclxuICAgICAmJiAhKHJlc1tpbmRleC0xXS5ydWxlICYmIHJlc1tpbmRleC0xXS5ydWxlLnJhbmdlKVxyXG4gICAgICYmIChyZXN4Lm1hdGNoZWRTdHJpbmcgPT09IHByaW9yLm1hdGNoZWRTdHJpbmcpXHJcbiAgICAgJiYgKHJlc3gucnVsZS5iaXRpbmRleCA9PT0gcHJpb3IucnVsZS5iaXRpbmRleClcclxuICAgICAmJiAocmVzeC5ydWxlLndvcmRUeXBlID09PSBwcmlvci5ydWxlLndvcmRUeXBlKVxyXG4gICAgICYmIChyZXN4LmNhdGVnb3J5ID09PSByZXNbaW5kZXgtMV0uY2F0ZWdvcnkpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0pO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBvc3RGaWx0ZXJXaXRoT2Zmc2V0KHJlcyA6IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkPikgOiBBcnJheTxJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZD4ge1xyXG4gIC8vIGZvciBmaWx0ZXJpbmcsIHdlIG5lZWQgdG8gZ2V0ICplcXVhbCBydWxlIHJlc3VsdHMgY2xvc2UgdG9nZXRoZXJcclxuICAvLyA9PlxyXG4gIC8vXHJcblxyXG4gIHJlcy5zb3J0KHNvcnRCeVJhbmspO1xyXG4gIHZhciBiZXN0UmFuayA9IDA7XHJcbiAgLy9jb25zb2xlLmxvZyhcIlxcbnBpbHRlcmVkIFwiICsgSlNPTi5zdHJpbmdpZnkocmVzKSk7XHJcbiAgZGVidWdsb2coKCk9PlwiIHByZUZpbHRlciA6IFxcblwiICsgcmVzLm1hcChmdW5jdGlvbih3b3JkKSB7XHJcbiAgICAgIHJldHVybiBgICR7d29yZC5fcmFua2luZ30gID0+IFwiJHt3b3JkLmNhdGVnb3J5fVwiICR7d29yZC5tYXRjaGVkU3RyaW5nfSBgO1xyXG4gICAgfSkuam9pbihcIlxcblwiKSk7XHJcbiAgdmFyIHIgPSByZXMuZmlsdGVyKGZ1bmN0aW9uKHJlc3gsaW5kZXgpIHtcclxuICAgIGlmKGluZGV4ID09PSAwKSB7XHJcbiAgICAgIGJlc3RSYW5rID0gcmVzeC5fcmFua2luZztcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICAvLyAxLTAuOSA9IDAuMVxyXG4gICAgLy8gMS0gMC45MyA9IDAuN1xyXG4gICAgLy8gMS83XHJcbiAgICB2YXIgZGVsdGEgPSBiZXN0UmFuayAvIHJlc3guX3Jhbmtpbmc7XHJcbiAgICB2YXIgcHJpb3IgPSByZXNbaW5kZXgtMV07XHJcbiAgICBpZihcclxuICAgICAgICAhKHJlc3gucnVsZSAmJiByZXN4LnJ1bGUucmFuZ2UpXHJcbiAgICAgJiYgIShyZXNbaW5kZXgtMV0ucnVsZSAmJiByZXNbaW5kZXgtMV0ucnVsZS5yYW5nZSlcclxuICAgICAmJiAocmVzeC5tYXRjaGVkU3RyaW5nID09PSBwcmlvci5tYXRjaGVkU3RyaW5nKVxyXG4gICAgICYmIChyZXN4LnJ1bGUuYml0aW5kZXggPT09IHByaW9yLnJ1bGUuYml0aW5kZXgpXHJcbiAgICAgJiYgKHJlc3gucnVsZS53b3JkVHlwZSA9PT0gcHJpb3IucnVsZS53b3JkVHlwZSlcclxuICAgICAmJiAocmVzeC5jYXRlZ29yeSA9PT0gcmVzW2luZGV4LTFdLmNhdGVnb3J5KSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICAvL2NvbnNvbGUubG9nKFwiXFxuIGRlbHRhIGZvciBcIiArIGRlbHRhICsgXCIgIFwiICsgcmVzeC5fcmFua2luZyk7XHJcbiAgICBpZiAocmVzeC5sZXZlbm1hdGNoICYmIChkZWx0YSA+IDEuMDMpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0pO1xyXG4gIHIgPSBkcm9wTG93ZXJSYW5rZWRFcXVhbFJlc3VsdChyZXMpO1xyXG4gIHIuc29ydChzb3J0QnlSYW5rVGhlblJlc3VsdCk7XHJcbiAgZGVidWdsb2coKCk9PmBcXG5maWx0ZXJlZCAke3IubGVuZ3RofS8ke3Jlcy5sZW5ndGh9YCArIEpTT04uc3RyaW5naWZ5KHIpKTtcclxuICByZXR1cm4gcjtcclxufVxyXG5cclxuLypcclxuZXhwb3J0IGZ1bmN0aW9uIGNhdGVnb3JpemVTdHJpbmcyKHdvcmQ6IHN0cmluZywgZXhhY3Q6IGJvb2xlYW4sICBydWxlcyA6IElGTWF0Y2guU3BsaXRSdWxlc1xyXG4gICwgY250UmVjPyA6IElDbnRSZWMpOiBBcnJheTxJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZz4ge1xyXG4gIC8vIHNpbXBseSBhcHBseSBhbGwgcnVsZXNcclxuICBpZiAoZGVidWdsb2dNLmVuYWJsZWQgKSAge1xyXG4gICAgLy8gVE9ETyB0aGlzaXMgY2lydWNsYXIgISBkZWJ1Z2xvZ00oXCJydWxlcyA6IFwiICsgSlNPTi5zdHJpbmdpZnkocnVsZXMsdW5kZWZpbmVkLCAyKSk7XHJcbiAgfVxyXG4gIHZhciB1ID0gMTtcclxuICBpZiggdSA9PT0gMSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdjYXRlZ29yaXplZCBTdHJpbmcyJyk7XHJcblxyXG4gIH1cclxuICB2YXIgbGNTdHJpbmcgPSB3b3JkLnRvTG93ZXJDYXNlKCk7XHJcbiAgdmFyIHJlczogQXJyYXk8SUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+ID0gW107XHJcbiAgaWYgKGV4YWN0KSB7XHJcbiAgICB2YXIgciA9IHJ1bGVzLndvcmRNYXBbbGNTdHJpbmddO1xyXG4gICAgaWYgKHIpIHtcclxuICAgICAgci5ydWxlcy5mb3JFYWNoKGZ1bmN0aW9uKG9SdWxlKSB7XHJcbiAgICAgICAgcmVzLnB1c2goe1xyXG4gICAgICAgICAgICBzdHJpbmc6IHdvcmQsXHJcbiAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IG9SdWxlLm1hdGNoZWRTdHJpbmcsXHJcbiAgICAgICAgICAgIGNhdGVnb3J5OiBvUnVsZS5jYXRlZ29yeSxcclxuICAgICAgICAgICAgX3Jhbmtpbmc6IG9SdWxlLl9yYW5raW5nIHx8IDEuMFxyXG4gICAgICAgICAgfSlcclxuICAgICB9KTtcclxuICAgIH1cclxuICAgIHJ1bGVzLm5vbldvcmRSdWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChvUnVsZSkge1xyXG4gICAgICBjaGVja09uZVJ1bGUod29yZCxsY1N0cmluZyxleGFjdCxyZXMsb1J1bGUsY250UmVjKTtcclxuICAgIH0pO1xyXG4gICAgcmVzLnNvcnQoc29ydEJ5UmFuayk7XHJcbiAgICByZXR1cm4gcmVzO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBkZWJ1Z2xvZygoKT0+XCJjYXRlZ29yaXplIG5vbiBleGFjdFwiICsgd29yZCArIFwiIHh4ICBcIiArIHJ1bGVzLmFsbFJ1bGVzLmxlbmd0aCk7XHJcbiAgICByZXR1cm4gcG9zdEZpbHRlcihjYXRlZ29yaXplU3RyaW5nKHdvcmQsIGV4YWN0LCBydWxlcy5hbGxSdWxlcywgY250UmVjKSk7XHJcbiAgfVxyXG59XHJcbiovXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNhdGVnb3JpemVXb3JkSW50ZXJuYWxXaXRoT2Zmc2V0cyh3b3JkOiBzdHJpbmcsIGxjd29yZCA6IHN0cmluZywgZXhhY3Q6IGJvb2xlYW4sICBydWxlcyA6IElNYXRjaC5TcGxpdFJ1bGVzXHJcbiAgLCBjbnRSZWM/IDpJQ250UmVjKTogQXJyYXk8SUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWQ+IHtcclxuXHJcbiAgZGVidWdsb2dNKFwiY2F0ZWdvcml6ZSAgQ1dJV09cIiArIGxjd29yZCArIFwiIHdpdGggb2Zmc2V0ISEhISEhISEhISEhISEhISFcIiArIGV4YWN0KVxyXG4gIC8vIHNpbXBseSBhcHBseSBhbGwgcnVsZXNcclxuICBpZiAoZGVidWdsb2dWLmVuYWJsZWQgKSAge1xyXG4gICAgLy8gVE9ETyB0aGlzIGlzIGNpcmN1bGFyOiBkZWJ1Z2xvZ1YoXCJydWxlcyA6IFwiICsgSlNPTi5zdHJpbmdpZnkocnVsZXMsdW5kZWZpbmVkLCAyKSk7XHJcbiAgfVxyXG4gIHZhciByZXM6IEFycmF5PElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWQ+ID0gW107XHJcbiAgaWYgKGV4YWN0KSB7XHJcbiAgICB2YXIgciA9IHJ1bGVzLndvcmRNYXBbbGN3b3JkXTtcclxuICAgIGlmIChyKSB7XHJcbiAgICAgIGRlYnVnbG9nTShkZWJ1Z2xvZ00uZW5hYmxlZCA/IGAgLi4uLnB1c2hpbmcgbiBydWxlcyBleGFjdCBmb3IgJHtsY3dvcmR9OmAgKyByLnJ1bGVzLmxlbmd0aCA6ICctJyk7XHJcbiAgICAgIGRlYnVnbG9nTShkZWJ1Z2xvZ00uZW5hYmxlZCA/IHIucnVsZXMubWFwKChyLGluZGV4KT0+ICcnICsgaW5kZXggKyAnICcgKyBKU09OLnN0cmluZ2lmeShyKSkuam9pbihcIlxcblwiKSA6ICctJyk7XHJcbiAgICAgIHIucnVsZXMuZm9yRWFjaChmdW5jdGlvbihvUnVsZSkge1xyXG4gICAgICAgIHJlcy5wdXNoKHtcclxuICAgICAgICAgICAgc3RyaW5nOiB3b3JkLFxyXG4gICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBvUnVsZS5tYXRjaGVkU3RyaW5nLFxyXG4gICAgICAgICAgICBjYXRlZ29yeTogb1J1bGUuY2F0ZWdvcnksXHJcbiAgICAgICAgICAgIHJ1bGU6IG9SdWxlLFxyXG4gICAgICAgICAgICBfcmFua2luZzogb1J1bGUuX3JhbmtpbmcgfHwgMS4wXHJcbiAgICAgICAgICB9KVxyXG4gICAgIH0pO1xyXG4gICAgfVxyXG4gICAgcnVsZXMubm9uV29yZFJ1bGVzLmZvckVhY2goZnVuY3Rpb24gKG9SdWxlKSB7XHJcbiAgICAgIGNoZWNrT25lUnVsZVdpdGhPZmZzZXQod29yZCxsY3dvcmQsIGV4YWN0LHJlcyxvUnVsZSxjbnRSZWMpO1xyXG4gICAgfSk7XHJcbiAgICByZXMgPSBwb3N0RmlsdGVyV2l0aE9mZnNldChyZXMpO1xyXG4gICAgZGVidWdsb2coKCk9PlwiaGVyZSByZXN1bHRzIGV4YWN0IGZvciBcIiArIHdvcmQgKyBcIiByZXMgXCIgKyByZXMubGVuZ3RoKTtcclxuICAgIGRlYnVnbG9nTSgoKT0+XCJoZXJlIHJlc3VsdHMgZXhhY3QgZm9yIFwiICsgd29yZCArIFwiIHJlcyBcIiArIHJlcy5sZW5ndGgpO1xyXG4gICAgcmVzLnNvcnQoc29ydEJ5UmFuayk7XHJcbiAgICByZXR1cm4gcmVzO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBkZWJ1Z2xvZyhcImNhdGVnb3JpemUgbm9uIGV4YWN0IFxcXCJcIiArIHdvcmQgKyBcIlxcXCIgICAgXCIgKyBydWxlcy5hbGxSdWxlcy5sZW5ndGgpO1xyXG4gICAgdmFyIHJyID0gY2F0ZWdvcml6ZVNpbmdsZVdvcmRXaXRoT2Zmc2V0KHdvcmQsbGN3b3JkLCBleGFjdCwgcnVsZXMuYWxsUnVsZXMsIGNudFJlYyk7XHJcbiAgICAvL2RlYnVsb2dNKFwiZnV6enkgcmVzIFwiICsgSlNPTi5zdHJpbmdpZnkocnIpKTtcclxuICAgIHJldHVybiBwb3N0RmlsdGVyV2l0aE9mZnNldChycik7XHJcbiAgfVxyXG59XHJcblxyXG5cclxuXHJcbi8qKlxyXG4gKlxyXG4gKiBPcHRpb25zIG1heSBiZSB7XHJcbiAqIG1hdGNob3RoZXJzIDogdHJ1ZSwgID0+IG9ubHkgcnVsZXMgd2hlcmUgYWxsIG90aGVycyBtYXRjaCBhcmUgY29uc2lkZXJlZFxyXG4gKiBhdWdtZW50IDogdHJ1ZSxcclxuICogb3ZlcnJpZGUgOiB0cnVlIH0gID0+XHJcbiAqXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hXb3JkKG9SdWxlOiBJRk1vZGVsLklSdWxlLCBjb250ZXh0OiBJRk1hdGNoLmNvbnRleHQsIG9wdGlvbnM/OiBJTWF0Y2hPcHRpb25zKSB7XHJcbiAgaWYgKGNvbnRleHRbb1J1bGUua2V5XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuICB2YXIgczEgPSBjb250ZXh0W29SdWxlLmtleV0udG9Mb3dlckNhc2UoKVxyXG4gIHZhciBzMiA9IG9SdWxlLndvcmQudG9Mb3dlckNhc2UoKTtcclxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxyXG4gIHZhciBkZWx0YSA9IGNvbXBhcmVDb250ZXh0KGNvbnRleHQsIG9SdWxlLmZvbGxvd3MsIG9SdWxlLmtleSlcclxuICBkZWJ1Z2xvZ1YoKCk9PkpTT04uc3RyaW5naWZ5KGRlbHRhKSk7XHJcbiAgZGVidWdsb2dWKCgpPT5KU09OLnN0cmluZ2lmeShvcHRpb25zKSk7XHJcbiAgaWYgKG9wdGlvbnMubWF0Y2hvdGhlcnMgJiYgKGRlbHRhLmRpZmZlcmVudCA+IDApKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkXHJcbiAgfVxyXG4gIHZhciBjOiBudW1iZXIgPSBjYWxjRGlzdGFuY2UoczIsIHMxKTtcclxuICBkZWJ1Z2xvZ1YoKCkgPT4gXCIgczEgPD4gczIgXCIgKyBzMSArIFwiPD5cIiArIHMyICsgXCIgID0+OiBcIiArIGMpO1xyXG4gIGlmIChjID4gMC44MCkge1xyXG4gICAgdmFyIHJlcyA9IEFueU9iamVjdC5hc3NpZ24oe30sIG9SdWxlLmZvbGxvd3MpIGFzIGFueTtcclxuICAgIHJlcyA9IEFueU9iamVjdC5hc3NpZ24ocmVzLCBjb250ZXh0KTtcclxuICAgIGlmIChvcHRpb25zLm92ZXJyaWRlKSB7XHJcbiAgICAgIHJlcyA9IEFueU9iamVjdC5hc3NpZ24ocmVzLCBvUnVsZS5mb2xsb3dzKTtcclxuICAgIH1cclxuICAgIC8vIGZvcmNlIGtleSBwcm9wZXJ0eVxyXG4gICAgLy8gY29uc29sZS5sb2coJyBvYmplY3RjYXRlZ29yeScsIHJlc1snc3lzdGVtT2JqZWN0Q2F0ZWdvcnknXSk7XHJcbiAgICByZXNbb1J1bGUua2V5XSA9IG9SdWxlLmZvbGxvd3Nbb1J1bGUua2V5XSB8fCByZXNbb1J1bGUua2V5XTtcclxuICAgIHJlcy5fd2VpZ2h0ID0gQW55T2JqZWN0LmFzc2lnbih7fSwgcmVzLl93ZWlnaHQpO1xyXG4gICAgcmVzLl93ZWlnaHRbb1J1bGUua2V5XSA9IGM7XHJcbiAgICBPYmplY3QuZnJlZXplKHJlcyk7XHJcbiAgICBkZWJ1Z2xvZygoKT0+J0ZvdW5kIG9uZScgKyBKU09OLnN0cmluZ2lmeShyZXMsIHVuZGVmaW5lZCwgMikpO1xyXG4gICAgcmV0dXJuIHJlcztcclxuICB9XHJcbiAgcmV0dXJuIHVuZGVmaW5lZDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RBcmdzTWFwKG1hdGNoOiBBcnJheTxzdHJpbmc+LCBhcmdzTWFwOiB7IFtrZXk6IG51bWJlcl06IHN0cmluZyB9KTogSUZNYXRjaC5jb250ZXh0IHtcclxuICB2YXIgcmVzID0ge30gYXMgSUZNYXRjaC5jb250ZXh0O1xyXG4gIGlmICghYXJnc01hcCkge1xyXG4gICAgcmV0dXJuIHJlcztcclxuICB9XHJcbiAgT2JqZWN0LmtleXMoYXJnc01hcCkuZm9yRWFjaChmdW5jdGlvbiAoaUtleSkge1xyXG4gICAgdmFyIHZhbHVlID0gbWF0Y2hbaUtleV1cclxuICAgIHZhciBrZXkgPSBhcmdzTWFwW2lLZXldO1xyXG4gICAgaWYgKCh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpICYmIHZhbHVlLmxlbmd0aCA+IDApIHtcclxuICAgICAgcmVzW2tleV0gPSB2YWx1ZVxyXG4gICAgfVxyXG4gIH1cclxuICApO1xyXG4gIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBSYW5rV29yZCA9IHtcclxuICBoYXNBYm92ZTogZnVuY3Rpb24gKGxzdDogQXJyYXk8SUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+LCBib3JkZXI6IG51bWJlcik6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuICFsc3QuZXZlcnkoZnVuY3Rpb24gKG9NZW1iZXIpIHtcclxuICAgICAgcmV0dXJuIChvTWVtYmVyLl9yYW5raW5nIDwgYm9yZGVyKTtcclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIHRha2VGaXJzdE46IGZ1bmN0aW9uPFQgZXh0ZW5kcyBJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZz4gKGxzdDogQXJyYXk8VD4sIG46IG51bWJlcik6IEFycmF5PFQ+IHtcclxuICAgIHZhciBsYXN0UmFua2luZyA9IDEuMDtcclxuICAgIHZhciBjbnRSYW5nZWQgPSAwO1xyXG4gICAgcmV0dXJuIGxzdC5maWx0ZXIoZnVuY3Rpb24gKG9NZW1iZXIsIGlJbmRleCkge1xyXG4gICAgdmFyIGlzUmFuZ2VkID0gISEob01lbWJlcltcInJ1bGVcIl0gJiYgb01lbWJlcltcInJ1bGVcIl0ucmFuZ2UpO1xyXG4gICAgaWYoaXNSYW5nZWQpIHtcclxuICAgICAgY250UmFuZ2VkICs9IDE7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgaWYgKCgoaUluZGV4IC0gY250UmFuZ2VkKSA8IG4pIHx8IChvTWVtYmVyLl9yYW5raW5nID09PSBsYXN0UmFua2luZykpICB7XHJcbiAgICAgICAgbGFzdFJhbmtpbmcgPSBvTWVtYmVyLl9yYW5raW5nO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gIH0sXHJcbiAgdGFrZUFib3ZlIDogZnVuY3Rpb248VCBleHRlbmRzIElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nPiAobHN0OiBBcnJheTxUPiwgYm9yZGVyOiBudW1iZXIpOiBBcnJheTxUPiB7XHJcbiAgICByZXR1cm4gbHN0LmZpbHRlcihmdW5jdGlvbiAob01lbWJlcikge1xyXG4gICAgICByZXR1cm4gKG9NZW1iZXIuX3JhbmtpbmcgPj0gYm9yZGVyKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbn07XHJcblxyXG4vKlxyXG52YXIgZXhhY3RMZW4gPSAwO1xyXG52YXIgZnV6enlMZW4gPSAwO1xyXG52YXIgZnV6enlDbnQgPSAwO1xyXG52YXIgZXhhY3RDbnQgPSAwO1xyXG52YXIgdG90YWxDbnQgPSAwO1xyXG52YXIgdG90YWxMZW4gPSAwO1xyXG52YXIgcmV0YWluZWRDbnQgPSAwO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0Q250KCkge1xyXG4gIGV4YWN0TGVuID0gMDtcclxuICBmdXp6eUxlbiA9IDA7XHJcbiAgZnV6enlDbnQgPSAwO1xyXG4gIGV4YWN0Q250ID0gMDtcclxuICB0b3RhbENudCA9IDA7XHJcbiAgdG90YWxMZW4gPSAwO1xyXG4gIHJldGFpbmVkQ250ID0gMDtcclxufVxyXG4qL1xyXG5cclxuLypcclxuZXhwb3J0IGZ1bmN0aW9uIGNhdGVnb3JpemVXb3JkV2l0aFJhbmtDdXRvZmYoc1dvcmRHcm91cDogc3RyaW5nLCBzcGxpdFJ1bGVzIDogSU1hdGNoLlNwbGl0UnVsZXMgLCBjbnRSZWM/IDogSUNudFJlYyApOiBBcnJheTxJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZz4ge1xyXG4gIGRlYnVnbG9nKCdjd3dyYycgKyBzV29yZEdyb3VwKVxyXG4gIGNvbnNvbGUubG9nKCdjd3dyYyBjYWxsZWQnKTtcclxuICB2YXIgdSA9IDE7XHJcbiAgdmFyIHNlZW5JdCA9IGNhdGVnb3JpemVTdHJpbmcyKHNXb3JkR3JvdXAsIHRydWUsIHNwbGl0UnVsZXMsIGNudFJlYyk7XHJcbiAgLy90b3RhbENudCArPSAxO1xyXG4gIC8vIGV4YWN0TGVuICs9IHNlZW5JdC5sZW5ndGg7XHJcbiAgYWRkQ250UmVjKGNudFJlYywgJ2NudENhdEV4YWN0JywgMSk7XHJcbiAgYWRkQ250UmVjKGNudFJlYywgJ2NudENhdEV4YWN0UmVzJywgc2Vlbkl0Lmxlbmd0aCk7XHJcblxyXG4gIGlmIChSYW5rV29yZC5oYXNBYm92ZShzZWVuSXQsIDAuOCkpIHtcclxuICAgIGlmKGNudFJlYykge1xyXG4gICAgICBhZGRDbnRSZWMoY250UmVjLCAnZXhhY3RQcmlvclRha2UnLCBzZWVuSXQubGVuZ3RoKVxyXG4gICAgfVxyXG4gICAgc2Vlbkl0ID0gUmFua1dvcmQudGFrZUFib3ZlKHNlZW5JdCwgMC44KTtcclxuICAgIGlmKGNudFJlYykge1xyXG4gICAgICBhZGRDbnRSZWMoY250UmVjLCAnZXhhY3RBZnRlclRha2UnLCBzZWVuSXQubGVuZ3RoKVxyXG4gICAgfVxyXG4gICAvLyBleGFjdENudCArPSAxO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBzZWVuSXQgPSBjYXRlZ29yaXplU3RyaW5nMihzV29yZEdyb3VwLCBmYWxzZSwgc3BsaXRSdWxlcywgY250UmVjKTtcclxuICAgIGFkZENudFJlYyhjbnRSZWMsICdjbnROb25FeGFjdCcsIDEpO1xyXG4gICAgYWRkQ250UmVjKGNudFJlYywgJ2NudE5vbkV4YWN0UmVzJywgc2Vlbkl0Lmxlbmd0aCk7XHJcbiAgLy8gIGZ1enp5TGVuICs9IHNlZW5JdC5sZW5ndGg7XHJcbiAgLy8gIGZ1enp5Q250ICs9IDE7XHJcbiAgfVxyXG4gLy8gdG90YWxMZW4gKz0gc2Vlbkl0Lmxlbmd0aDtcclxuICBzZWVuSXQgPSBSYW5rV29yZC50YWtlRmlyc3ROKHNlZW5JdCwgQWxnb2wuVG9wX05fV29yZENhdGVnb3JpemF0aW9ucyk7XHJcbiAvLyByZXRhaW5lZENudCArPSBzZWVuSXQubGVuZ3RoO1xyXG4gIHJldHVybiBzZWVuSXQ7XHJcbn1cclxuKi9cclxuXHJcbi8qIGlmIHdlIGhhdmUgYSAgXCJSdW4gbGlrZSB0aGUgV2luZFwiXHJcbiAgYW4gYSB1c2VyIHR5cGUgZnVuIGxpa2UgIGEgUmluZCAsIGFuZCBSaW5kIGlzIGFuIGV4YWN0IG1hdGNoLFxyXG4gIHdlIHdpbGwgbm90IHN0YXJ0IGxvb2tpbmcgZm9yIHRoZSBsb25nIHNlbnRlbmNlXHJcblxyXG4gIHRoaXMgaXMgdG8gYmUgZml4ZWQgYnkgXCJzcHJlYWRpbmdcIiB0aGUgcmFuZ2UgaW5kaWNhdGlvbiBhY2Nyb3NzIHZlcnkgc2ltaWxhciB3b3JkcyBpbiB0aGUgdmluY2luaXR5IG9mIHRoZVxyXG4gIHRhcmdldCB3b3Jkc1xyXG4qL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNhdGVnb3JpemVXb3JkV2l0aE9mZnNldFdpdGhSYW5rQ3V0b2ZmKHNXb3JkR3JvdXA6IHN0cmluZywgc3BsaXRSdWxlcyA6IElNYXRjaC5TcGxpdFJ1bGVzLCBjbnRSZWM/IDogSUNudFJlYyApOiBBcnJheTxJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZD4ge1xyXG4gIHZhciBzV29yZEdyb3VwTEMgPSBzV29yZEdyb3VwLnRvTG93ZXJDYXNlKCk7XHJcbiAgdmFyIHNlZW5JdCA9IGNhdGVnb3JpemVXb3JkSW50ZXJuYWxXaXRoT2Zmc2V0cyhzV29yZEdyb3VwLCBzV29yZEdyb3VwTEMsIHRydWUsIHNwbGl0UnVsZXMsIGNudFJlYyk7XHJcbiAgLy9jb25zb2xlLmxvZyhcIlNFRU5JVFwiICsgSlNPTi5zdHJpbmdpZnkoc2Vlbkl0KSk7XHJcbiAgLy90b3RhbENudCArPSAxO1xyXG4gIC8vIGV4YWN0TGVuICs9IHNlZW5JdC5sZW5ndGg7XHJcbiAgLy9jb25zb2xlLmxvZyhcImZpcnN0IHJ1biBleGFjdCBcIiArIEpTT04uc3RyaW5naWZ5KHNlZW5JdCkpO1xyXG4gIGFkZENudFJlYyhjbnRSZWMsICdjbnRDYXRFeGFjdCcsIDEpO1xyXG4gIGFkZENudFJlYyhjbnRSZWMsICdjbnRDYXRFeGFjdFJlcycsIHNlZW5JdC5sZW5ndGgpO1xyXG5cclxuICBpZiAoUmFua1dvcmQuaGFzQWJvdmUoc2Vlbkl0LCAwLjgpKSB7XHJcbiAgICBpZihjbnRSZWMpIHtcclxuICAgICAgYWRkQ250UmVjKGNudFJlYywgJ2V4YWN0UHJpb3JUYWtlJywgc2Vlbkl0Lmxlbmd0aClcclxuICAgIH1cclxuICAgIHNlZW5JdCA9IFJhbmtXb3JkLnRha2VBYm92ZShzZWVuSXQsIDAuOCk7XHJcbiAgICBpZihjbnRSZWMpIHtcclxuICAgICAgYWRkQ250UmVjKGNudFJlYywgJ2V4YWN0QWZ0ZXJUYWtlJywgc2Vlbkl0Lmxlbmd0aClcclxuICAgIH1cclxuICAgLy8gZXhhY3RDbnQgKz0gMTtcclxuICB9IGVsc2Uge1xyXG4gICAgc2Vlbkl0ID0gY2F0ZWdvcml6ZVdvcmRJbnRlcm5hbFdpdGhPZmZzZXRzKHNXb3JkR3JvdXAsIHNXb3JkR3JvdXBMQywgZmFsc2UsIHNwbGl0UnVsZXMsIGNudFJlYyk7XHJcbiAgICBhZGRDbnRSZWMoY250UmVjLCAnY250Tm9uRXhhY3QnLCAxKTtcclxuICAgIGFkZENudFJlYyhjbnRSZWMsICdjbnROb25FeGFjdFJlcycsIHNlZW5JdC5sZW5ndGgpO1xyXG4gIC8vICBmdXp6eUxlbiArPSBzZWVuSXQubGVuZ3RoO1xyXG4gIC8vICBmdXp6eUNudCArPSAxO1xyXG4gIH1cclxuICAvLyB0b3RhbExlbiArPSBzZWVuSXQubGVuZ3RoO1xyXG4gIGRlYnVnbG9nKCgpPT4oIGAke3NlZW5JdC5sZW5ndGh9IHdpdGggJHtzZWVuSXQucmVkdWNlKCAocHJldixvYmopID0+IHByZXYgKyAob2JqLnJ1bGUucmFuZ2UgPyAxIDogMCksMCl9IHJhbmdlZCAhYCkpO1xyXG4vLyAgdmFyIGNudFJhbmdlZCA9IHNlZW5JdC5yZWR1Y2UoIChwcmV2LG9iaikgPT4gcHJldiArIChvYmoucnVsZS5yYW5nZSA/IDEgOiAwKSwwKTtcclxuLy8gIGNvbnNvbGUubG9nKGAqKioqKioqKioqKiAke3NlZW5JdC5sZW5ndGh9IHdpdGggJHtjbnRSYW5nZWR9IHJhbmdlZCAhYCk7XHJcblxyXG4gIHNlZW5JdCA9IFJhbmtXb3JkLnRha2VGaXJzdE4oc2Vlbkl0LCBBbGdvbC5Ub3BfTl9Xb3JkQ2F0ZWdvcml6YXRpb25zKTtcclxuIC8vIHJldGFpbmVkQ250ICs9IHNlZW5JdC5sZW5ndGg7XHJcbiAgLy9jb25zb2xlLmxvZyhcImZpbmFsIHJlcyBvZiBjYXRlZ29yaXplV29yZFdpdGhPZmZzZXRXaXRoUmFua0N1dG9mZlwiICsgSlNPTi5zdHJpbmdpZnkoc2Vlbkl0KSk7XHJcblxyXG4gIHJldHVybiBzZWVuSXQ7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2F0ZWdvcml6ZVdvcmRXaXRoT2Zmc2V0V2l0aFJhbmtDdXRvZmZTaW5nbGUod29yZDogc3RyaW5nLCBydWxlOiBJRk1vZGVsLm1SdWxlKTogSUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWQge1xyXG4gIHZhciBsY3dvcmQgPSB3b3JkLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gIGlmKGxjd29yZCA9PT0gcnVsZS5sb3dlcmNhc2V3b3JkKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzdHJpbmc6IHdvcmQsXHJcbiAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IHJ1bGUubWF0Y2hlZFN0cmluZyxcclxuICAgICAgICAgICAgY2F0ZWdvcnk6IHJ1bGUuY2F0ZWdvcnksXHJcbiAgICAgICAgICAgIHJ1bGU6IHJ1bGUsXHJcbiAgICAgICAgICAgIF9yYW5raW5nOiBydWxlLl9yYW5raW5nIHx8IDEuMFxyXG4gICAgICAgICAgfTtcclxuICB9XHJcblxyXG4gIHZhciByZXM6IEFycmF5PElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWQ+ID0gW11cclxuICBjaGVja09uZVJ1bGVXaXRoT2Zmc2V0KHdvcmQsbGN3b3JkLGZhbHNlLHJlcyxydWxlKTtcclxuICBkZWJ1Z2xvZyhcImNhdFdXT1dSQ1MgXCIgKyBsY3dvcmQpO1xyXG4gIGlmKHJlcy5sZW5ndGgpIHtcclxuICAgIHJldHVybiByZXNbMF07XHJcbiAgfVxyXG4gIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcblxyXG5cclxuLypcclxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlclJlbW92aW5nVW5jYXRlZ29yaXplZFNlbnRlbmNlKG9TZW50ZW5jZTogSUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdbXVtdKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIG9TZW50ZW5jZS5ldmVyeShmdW5jdGlvbiAob1dvcmRHcm91cCkge1xyXG4gICAgcmV0dXJuIChvV29yZEdyb3VwLmxlbmd0aCA+IDApO1xyXG4gIH0pO1xyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJSZW1vdmluZ1VuY2F0ZWdvcml6ZWQoYXJyOiBJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1tdW11bXSk6IElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nW11bXVtdIHtcclxuICByZXR1cm4gYXJyLmZpbHRlcihmdW5jdGlvbiAob1NlbnRlbmNlKSB7XHJcbiAgICByZXR1cm4gZmlsdGVyUmVtb3ZpbmdVbmNhdGVnb3JpemVkU2VudGVuY2Uob1NlbnRlbmNlKTtcclxuICB9KTtcclxufVxyXG4qL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNhdGVnb3JpemVBV29yZChzV29yZEdyb3VwOiBzdHJpbmcsIHJ1bGVzOiBJTWF0Y2guU3BsaXRSdWxlcywgc2VudGVuY2U6IHN0cmluZywgd29yZHM6IHsgW2tleTogc3RyaW5nXTogQXJyYXk8SUZNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+fSxcclxuY250UmVjID8gOiBJQ250UmVjICkgOiBJTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkW10ge1xyXG4gIHJldHVybiBjYXRlZ29yaXplQVdvcmRXaXRoT2Zmc2V0cyhzV29yZEdyb3VwLCBydWxlcywgc2VudGVuY2UsIHdvcmRzKS5maWx0ZXIoXHJcbiAgICAgciA9PiAhci5zcGFuICYmICFyLnJ1bGUucmFuZ2VcclxuICApO1xyXG4vKiBjb25zaWRlciByZW1vdmluZyB0aGUgcmFuZ2VkIHN0dWZmICAqL1xyXG5cclxuXHJcbi8qXHJcbiAgdmFyIHNlZW5JdCA9IHdvcmRzW3NXb3JkR3JvdXBdO1xyXG4gIGlmIChzZWVuSXQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgLy9zZWVuSXQgPSBjYXRlZ29yaXplV29yZFdpdGhSYW5rQ3V0b2ZmKHNXb3JkR3JvdXAsIHJ1bGVzLCBjbnRSZWMpO1xyXG4gICAgc2Vlbkl0ID0gY2F0ZWdvcml6ZVdvcmRXaXRoT2Zmc2V0V2l0aFJhbmtDdXRvZmYoc1dvcmRHcm91cCxydWxlcyxjbnRSZWMpO1xyXG4gICAgdXRpbHMuZGVlcEZyZWV6ZShzZWVuSXQpO1xyXG4gICAgd29yZHNbc1dvcmRHcm91cF0gPSBzZWVuSXQ7XHJcbiAgfVxyXG4gIGlmICghc2Vlbkl0IHx8IHNlZW5JdC5sZW5ndGggPT09IDApIHtcclxuICAgIGxvZ2dlcihcIioqKldBUk5JTkc6IERpZCBub3QgZmluZCBhbnkgY2F0ZWdvcml6YXRpb24gZm9yIFxcXCJcIiArIHNXb3JkR3JvdXAgKyBcIlxcXCIgaW4gc2VudGVuY2UgXFxcIlwiXHJcbiAgICAgICsgc2VudGVuY2UgKyBcIlxcXCJcIik7XHJcbiAgICBpZiAoc1dvcmRHcm91cC5pbmRleE9mKFwiIFwiKSA8PSAwKSB7XHJcbiAgICAgIGRlYnVnbG9nKFwiKioqV0FSTklORzogRGlkIG5vdCBmaW5kIGFueSBjYXRlZ29yaXphdGlvbiBmb3IgcHJpbWl0aXZlICghKVwiICsgc1dvcmRHcm91cCk7XHJcbiAgICB9XHJcbiAgICBkZWJ1Z2xvZyhcIioqKldBUk5JTkc6IERpZCBub3QgZmluZCBhbnkgY2F0ZWdvcml6YXRpb24gZm9yIFwiICsgc1dvcmRHcm91cCk7XHJcbiAgICBpZiAoIXNlZW5JdCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RpbmcgZW10cHkgbGlzdCwgbm90IHVuZGVmaW5lZCBmb3IgXFxcIlwiICsgc1dvcmRHcm91cCArIFwiXFxcIlwiKVxyXG4gICAgfVxyXG4gICAgd29yZHNbc1dvcmRHcm91cF0gPSBbXVxyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxuICByZXR1cm4gdXRpbHMuY2xvbmVEZWVwKHNlZW5JdCk7XHJcbiAgKi9cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBHaXZlbiBhICBzdHJpbmcsIGJyZWFrIGl0IGRvd24gaW50byBjb21wb25lbnRzLFxyXG4gKiBbWydBJywgJ0InXSwgWydBIEInXV1cclxuICpcclxuICogdGhlbiBjYXRlZ29yaXplV29yZHNcclxuICogcmV0dXJuaW5nXHJcbiAqXHJcbiAqIFsgW1sgeyBjYXRlZ29yeTogJ3N5c3RlbUlkJywgd29yZCA6ICdBJ30sXHJcbiAqICAgICAgeyBjYXRlZ29yeTogJ290aGVydGhpbmcnLCB3b3JkIDogJ0EnfVxyXG4gKiAgICBdLFxyXG4gKiAgICAvLyByZXN1bHQgb2YgQlxyXG4gKiAgICBbIHsgY2F0ZWdvcnk6ICdzeXN0ZW1JZCcsIHdvcmQgOiAnQid9LFxyXG4gKiAgICAgIHsgY2F0ZWdvcnk6ICdvdGhlcnRoaW5nJywgd29yZCA6ICdBJ31cclxuICogICAgICB7IGNhdGVnb3J5OiAnYW5vdGhlcnRyeXAnLCB3b3JkIDogJ0InfVxyXG4gKiAgICBdXHJcbiAqICAgXSxcclxuICogXV1dXHJcbiAqXHJcbiAqXHJcbiAqXHJcbiAqL1xyXG5cclxuLypcclxuZXhwb3J0IGZ1bmN0aW9uIGFuYWx5emVTdHJpbmcoc1N0cmluZzogc3RyaW5nLCBydWxlczogSU1hdGNoLlNwbGl0UnVsZXMsXHJcbiAgd29yZHM/OiB7IFtrZXk6IHN0cmluZ106IEFycmF5PElGTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nPiB9KVxyXG4gIDogWyBbIElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdbXV0gXVxyXG4gICB7XHJcbiAgdmFyIGNudCA9IDA7XHJcbiAgdmFyIGZhYyA9IDE7XHJcbiAgaWYoY250ID09PSAwKSB7XHJcbiAgICB0aHJvdyBFcnJvcigndXNlIHByb2Nlc3NTdHJpZ24yJyk7XHJcbiAgfVxyXG4gIHZhciB1ID0gYnJlYWtkb3duLmJyZWFrZG93blN0cmluZyhzU3RyaW5nLCBBbGdvbC5NYXhTcGFjZXNQZXJDb21iaW5lZFdvcmQpO1xyXG4gIGRlYnVnbG9nKCgpPT5cImhlcmUgYnJlYWtkb3duXCIgKyBKU09OLnN0cmluZ2lmeSh1KSk7XHJcbiAgLy9jb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh1KSk7XHJcbiAgd29yZHMgPSB3b3JkcyB8fCB7fTtcclxuICBkZWJ1Z3BlcmYoKCk9Pid0aGlzIG1hbnkga25vd24gd29yZHM6ICcgKyBPYmplY3Qua2V5cyh3b3JkcykubGVuZ3RoKTtcclxuICB2YXIgcmVzID0gW10gYXMgW1sgSU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1tdXSBdO1xyXG4gIHZhciBjbnRSZWMgPSB7fTtcclxuICB1LmZvckVhY2goZnVuY3Rpb24gKGFCcmVha0Rvd25TZW50ZW5jZSkge1xyXG4gICAgICB2YXIgY2F0ZWdvcml6ZWRTZW50ZW5jZSA9IFtdIGFzIFsgSU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1tdIF07XHJcbiAgICAgIHZhciBpc1ZhbGlkID0gYUJyZWFrRG93blNlbnRlbmNlLmV2ZXJ5KGZ1bmN0aW9uIChzV29yZEdyb3VwOiBzdHJpbmcsIGluZGV4IDogbnVtYmVyKSB7XHJcbiAgICAgICAgdmFyIHNlZW5JdCA9IGNhdGVnb3JpemVBV29yZChzV29yZEdyb3VwLCBydWxlcywgc1N0cmluZywgd29yZHMsIGNudFJlYyk7XHJcbiAgICAgICAgaWYoc2Vlbkl0Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRlZ29yaXplZFNlbnRlbmNlW2luZGV4XSA9IHNlZW5JdDtcclxuICAgICAgICBjbnQgPSBjbnQgKyBzZWVuSXQubGVuZ3RoO1xyXG4gICAgICAgIGZhYyA9IGZhYyAqIHNlZW5JdC5sZW5ndGg7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH0pO1xyXG4gICAgICBpZihpc1ZhbGlkKSB7XHJcbiAgICAgICAgcmVzLnB1c2goY2F0ZWdvcml6ZWRTZW50ZW5jZSk7XHJcbiAgICAgIH1cclxuICB9KTtcclxuICBkZWJ1Z2xvZygoKT0+XCIgc2VudGVuY2VzIFwiICsgdS5sZW5ndGggKyBcIiBtYXRjaGVzIFwiICsgY250ICsgXCIgZmFjOiBcIiArIGZhYyk7XHJcbiAgZGVidWdsb2coICgpPT4gXCJmaXJzdCBtYXRjaCBcIisgSlNPTi5zdHJpbmdpZnkodSx1bmRlZmluZWQsMikpO1xyXG4gIGRlYnVncGVyZigoKT0+IFwiIHNlbnRlbmNlcyBcIiArIHUubGVuZ3RoICsgXCIgLyBcIiArIHJlcy5sZW5ndGggKyAgXCIgbWF0Y2hlcyBcIiArIGNudCArIFwiIGZhYzogXCIgKyBmYWMgKyBcIiByZWMgOiBcIiArIEpTT04uc3RyaW5naWZ5KGNudFJlYyx1bmRlZmluZWQsMikpO1xyXG4gIHJldHVybiByZXM7XHJcbn1cclxuKi9cclxuXHJcblxyXG4vKipcclxuICogVGhpcyBpcyB0aGUgbWFpbiBlbnRyeSBwb2ludCBmb3Igd29yZCBjYXRlZ29yaXphdGlvbixcclxuICogSWYgc2VudGVuY2UgaXMgc3VwcGxpZWQgaXQgd2lsbCBiZSB1c2VkXHJcbiAqIEBwYXJhbSBzV29yZEdyb3VwIGEgc2luZ2xlIHdvcmQsIGcuZS4gXCJlYXJ0aFwiIG9yIGEgY29tYmluYXRpb24gXCJVSTUgQ29tcG9uZW50XCJcclxuICogIFRoZSB3b3JkIHdpbGwgKm5vdCogYmUgYnJva2VuIGRvd24gaGVyZSwgYnV0IGRpcmV0eWwgbWF0Y2hlZCBhZ2FpbnN0ICBydWxlc1xyXG4gKiBAcGFyYW0gcnVsZXMgcnVsZSBpbmRleFxyXG4gKiBAcGFyYW0gc2VudGVuY2Ugb3B0aW9uYWwsIG9ubHkgZm9yIGRlYnVnZ2luZ1xyXG4gKiBAcGFyYW0gd29yZHNcclxuICogQHBhcmFtIGNudFJlY1xyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNhdGVnb3JpemVBV29yZFdpdGhPZmZzZXRzKHNXb3JkR3JvdXA6IHN0cmluZywgcnVsZXM6IElNYXRjaC5TcGxpdFJ1bGVzLCBzZW50ZW5jZTogc3RyaW5nLCB3b3JkczogeyBba2V5OiBzdHJpbmddOiBBcnJheTxJRk1hdGNoLklDYXRlZ29yaXplZFN0cmluZz59LFxyXG5jbnRSZWMgPyA6IElDbnRSZWMgKSA6IElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWRbXSB7XHJcbiAgdmFyIHNlZW5JdCA9IHdvcmRzW3NXb3JkR3JvdXBdO1xyXG4gIGlmIChzZWVuSXQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgc2Vlbkl0ID0gY2F0ZWdvcml6ZVdvcmRXaXRoT2Zmc2V0V2l0aFJhbmtDdXRvZmYoc1dvcmRHcm91cCwgcnVsZXMsIGNudFJlYyk7XHJcbiAgICB1dGlscy5kZWVwRnJlZXplKHNlZW5JdCk7XHJcbiAgICB3b3Jkc1tzV29yZEdyb3VwXSA9IHNlZW5JdDtcclxuICB9XHJcbiAgaWYgKCFzZWVuSXQgfHwgc2Vlbkl0Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgbG9nZ2VyKFwiKioqV0FSTklORzogRGlkIG5vdCBmaW5kIGFueSBjYXRlZ29yaXphdGlvbiBmb3IgXFxcIlwiICsgc1dvcmRHcm91cCArIFwiXFxcIiBpbiBzZW50ZW5jZSBcXFwiXCJcclxuICAgICAgKyBzZW50ZW5jZSArIFwiXFxcIlwiKTtcclxuICAgIGlmIChzV29yZEdyb3VwLmluZGV4T2YoXCIgXCIpIDw9IDApIHtcclxuICAgICAgZGVidWdsb2coKCk9PlwiKioqV0FSTklORzogRGlkIG5vdCBmaW5kIGFueSBjYXRlZ29yaXphdGlvbiBmb3IgcHJpbWl0aXZlICghKVwiICsgc1dvcmRHcm91cCk7XHJcbiAgICB9XHJcbiAgICBkZWJ1Z2xvZygoKT0+XCIqKipXQVJOSU5HOiBEaWQgbm90IGZpbmQgYW55IGNhdGVnb3JpemF0aW9uIGZvciBcIiArIHNXb3JkR3JvdXApO1xyXG4gICAgaWYgKCFzZWVuSXQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0aW5nIGVtdHB5IGxpc3QsIG5vdCB1bmRlZmluZWQgZm9yIFxcXCJcIiArIHNXb3JkR3JvdXAgKyBcIlxcXCJcIilcclxuICAgIH1cclxuICAgIHdvcmRzW3NXb3JkR3JvdXBdID0gW11cclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcbiAgcmV0dXJuIHV0aWxzLmNsb25lRGVlcChzZWVuSXQpO1xyXG59XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbi8qXHJcblsgW2EsYl0sIFtjLGRdXVxyXG5cclxuMDAgYVxyXG4wMSBiXHJcbjEwIGNcclxuMTEgZFxyXG4xMiBjXHJcbiovXHJcblxyXG5cclxuY29uc3QgY2xvbmUgPSB1dGlscy5jbG9uZURlZXA7XHJcblxyXG5cclxuZnVuY3Rpb24gY29weVZlY01lbWJlcnModSkge1xyXG4gIHZhciBpID0gMDtcclxuICBmb3IoaSA9IDA7IGkgPCB1Lmxlbmd0aDsgKytpKSB7XHJcbiAgICB1W2ldID0gY2xvbmUodVtpXSk7XHJcbiAgfVxyXG4gIHJldHVybiB1O1xyXG59XHJcbi8vIHdlIGNhbiByZXBsaWNhdGUgdGhlIHRhaWwgb3IgdGhlIGhlYWQsXHJcbi8vIHdlIHJlcGxpY2F0ZSB0aGUgdGFpbCBhcyBpdCBpcyBzbWFsbGVyLlxyXG5cclxuLy8gW2EsYixjIF1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBleHBhbmRNYXRjaEFycihkZWVwOiBBcnJheTxBcnJheTxhbnk+Pik6IEFycmF5PEFycmF5PGFueT4+IHtcclxuICB2YXIgYSA9IFtdO1xyXG4gIHZhciBsaW5lID0gW107XHJcbiAgZGVidWdsb2coKCk9PiBKU09OLnN0cmluZ2lmeShkZWVwKSk7XHJcbiAgZGVlcC5mb3JFYWNoKGZ1bmN0aW9uICh1QnJlYWtEb3duTGluZSwgaUluZGV4OiBudW1iZXIpIHtcclxuICAgIGxpbmVbaUluZGV4XSA9IFtdO1xyXG4gICAgdUJyZWFrRG93bkxpbmUuZm9yRWFjaChmdW5jdGlvbiAoYVdvcmRHcm91cCwgd2dJbmRleDogbnVtYmVyKSB7XHJcbiAgICAgIGxpbmVbaUluZGV4XVt3Z0luZGV4XSA9IFtdO1xyXG4gICAgICBhV29yZEdyb3VwLmZvckVhY2goZnVuY3Rpb24gKG9Xb3JkVmFyaWFudCwgaVdWSW5kZXg6IG51bWJlcikge1xyXG4gICAgICAgIGxpbmVbaUluZGV4XVt3Z0luZGV4XVtpV1ZJbmRleF0gPSBvV29yZFZhcmlhbnQ7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSlcclxuICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gSlNPTi5zdHJpbmdpZnkobGluZSkgOiAnLScpO1xyXG4gIHZhciByZXMgPSBbXTtcclxuICB2YXIgbnZlY3MgPSBbXTtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmUubGVuZ3RoOyArK2kpIHtcclxuICAgIHZhciB2ZWNzID0gW1tdXTtcclxuICAgIHZhciBudmVjcyA9IFtdO1xyXG4gICAgdmFyIHJ2ZWMgPSBbXTtcclxuICAgIGZvciAodmFyIGsgPSAwOyBrIDwgbGluZVtpXS5sZW5ndGg7ICsraykgeyAvLyB3b3JkZ3JvdXAga1xyXG4gICAgICAvL3ZlY3MgaXMgdGhlIHZlY3RvciBvZiBhbGwgc28gZmFyIHNlZW4gdmFyaWFudHMgdXAgdG8gayB3Z3MuXHJcbiAgICAgIHZhciBuZXh0QmFzZSA9IFtdO1xyXG4gICAgICBmb3IgKHZhciBsID0gMDsgbCA8IGxpbmVbaV1ba10ubGVuZ3RoOyArK2wpIHsgLy8gZm9yIGVhY2ggdmFyaWFudFxyXG4gICAgICAgIC8vZGVidWdsb2coXCJ2ZWNzIG5vd1wiICsgSlNPTi5zdHJpbmdpZnkodmVjcykpO1xyXG4gICAgICAgIG52ZWNzID0gW107IC8vdmVjcy5zbGljZSgpOyAvLyBjb3B5IHRoZSB2ZWNbaV0gYmFzZSB2ZWN0b3I7XHJcbiAgICAgICAgLy9kZWJ1Z2xvZyhcInZlY3MgY29waWVkIG5vd1wiICsgSlNPTi5zdHJpbmdpZnkobnZlY3MpKTtcclxuICAgICAgICBmb3IgKHZhciB1ID0gMDsgdSA8IHZlY3MubGVuZ3RoOyArK3UpIHtcclxuICAgICAgICAgIG52ZWNzW3VdID0gdmVjc1t1XS5zbGljZSgpOyAvL1xyXG4gICAgICAgICAgbnZlY3NbdV0gPSBjb3B5VmVjTWVtYmVycyhudmVjc1t1XSk7XHJcbiAgICAgICAgICAvLyBkZWJ1Z2xvZyhcImNvcGllZCB2ZWNzW1wiKyB1K1wiXVwiICsgSlNPTi5zdHJpbmdpZnkodmVjc1t1XSkpO1xyXG4gICAgICAgICAgbnZlY3NbdV0ucHVzaChcclxuICAgICAgICAgICAgY2xvbmUobGluZVtpXVtrXVtsXSkpOyAvLyBwdXNoIHRoZSBsdGggdmFyaWFudFxyXG4gICAgICAgICAgLy8gZGVidWdsb2coXCJub3cgbnZlY3MgXCIgKyBudmVjcy5sZW5ndGggKyBcIiBcIiArIEpTT04uc3RyaW5naWZ5KG52ZWNzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vICAgZGVidWdsb2coXCIgYXQgICAgIFwiICsgayArIFwiOlwiICsgbCArIFwiIG5leHRiYXNlID5cIiArIEpTT04uc3RyaW5naWZ5KG5leHRCYXNlKSlcclxuICAgICAgICAvLyAgIGRlYnVnbG9nKFwiIGFwcGVuZCBcIiArIGsgKyBcIjpcIiArIGwgKyBcIiBudmVjcyAgICA+XCIgKyBKU09OLnN0cmluZ2lmeShudmVjcykpXHJcbiAgICAgICAgbmV4dEJhc2UgPSBuZXh0QmFzZS5jb25jYXQobnZlY3MpO1xyXG4gICAgICAgIC8vICAgZGVidWdsb2coXCIgIHJlc3VsdCBcIiArIGsgKyBcIjpcIiArIGwgKyBcIiBudmVjcyAgICA+XCIgKyBKU09OLnN0cmluZ2lmeShuZXh0QmFzZSkpXHJcbiAgICAgIH0gLy9jb25zdHJ1XHJcbiAgICAgIC8vICBkZWJ1Z2xvZyhcIm5vdyBhdCBcIiArIGsgKyBcIjpcIiArIGwgKyBcIiA+XCIgKyBKU09OLnN0cmluZ2lmeShuZXh0QmFzZSkpXHJcbiAgICAgIHZlY3MgPSBuZXh0QmFzZTtcclxuICAgIH1cclxuICAgIGRlYnVnbG9nVihkZWJ1Z2xvZ1YuZW5hYmxlZCA/IChcIkFQUEVORElORyBUTyBSRVMzI1wiICsgaSArIFwiOlwiICsgbCArIFwiID5cIiArIEpTT04uc3RyaW5naWZ5KG5leHRCYXNlKSkgOiAnLScpO1xyXG4gICAgcmVzID0gcmVzLmNvbmNhdCh2ZWNzKTtcclxuICB9XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGUgYSB3ZWlnaHQgZmFjdG9yIGZvciBhIGdpdmVuIGRpc3RhbmNlIGFuZFxyXG4gKiBjYXRlZ29yeVxyXG4gKiBAcGFyYW0ge2ludGVnZXJ9IGRpc3QgZGlzdGFuY2UgaW4gd29yZHNcclxuICogQHBhcmFtIHtzdHJpbmd9IGNhdGVnb3J5IGNhdGVnb3J5IHRvIHVzZVxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBhIGRpc3RhbmNlIGZhY3RvciA+PSAxXHJcbiAqICAxLjAgZm9yIG5vIGVmZmVjdFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHJlaW5mb3JjZURpc3RXZWlnaHQoZGlzdDogbnVtYmVyLCBjYXRlZ29yeTogc3RyaW5nKTogbnVtYmVyIHtcclxuICB2YXIgYWJzID0gTWF0aC5hYnMoZGlzdCk7XHJcbiAgcmV0dXJuIDEuMCArIChBbGdvbC5hUmVpbmZvcmNlRGlzdFdlaWdodFthYnNdIHx8IDApO1xyXG59XHJcblxyXG4vKipcclxuICogR2l2ZW4gYSBzZW50ZW5jZSwgZXh0YWN0IGNhdGVnb3JpZXNcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0Q2F0ZWdvcnlNYXAob1NlbnRlbmNlOiBBcnJheTxJRk1hdGNoLklXb3JkPik6IHsgW2tleTogc3RyaW5nXTogQXJyYXk8eyBwb3M6IG51bWJlciB9PiB9IHtcclxuICB2YXIgcmVzID0ge307XHJcbiAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/ICgnZXh0cmFjdENhdGVnb3J5TWFwICcgKyBKU09OLnN0cmluZ2lmeShvU2VudGVuY2UpKSA6ICctJyk7XHJcbiAgb1NlbnRlbmNlLmZvckVhY2goZnVuY3Rpb24gKG9Xb3JkLCBpSW5kZXgpIHtcclxuICAgIGlmIChvV29yZC5jYXRlZ29yeSA9PT0gSUZNYXRjaC5DQVRfQ0FURUdPUlkpIHtcclxuICAgICAgcmVzW29Xb3JkLm1hdGNoZWRTdHJpbmddID0gcmVzW29Xb3JkLm1hdGNoZWRTdHJpbmddIHx8IFtdO1xyXG4gICAgICByZXNbb1dvcmQubWF0Y2hlZFN0cmluZ10ucHVzaCh7IHBvczogaUluZGV4IH0pO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHV0aWxzLmRlZXBGcmVlemUocmVzKTtcclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVpbkZvcmNlU2VudGVuY2Uob1NlbnRlbmNlKSB7XHJcbiAgXCJ1c2Ugc3RyaWN0XCI7XHJcbiAgdmFyIG9DYXRlZ29yeU1hcCA9IGV4dHJhY3RDYXRlZ29yeU1hcChvU2VudGVuY2UpO1xyXG4gIG9TZW50ZW5jZS5mb3JFYWNoKGZ1bmN0aW9uIChvV29yZCwgaUluZGV4KSB7XHJcbiAgICB2YXIgbSA9IG9DYXRlZ29yeU1hcFtvV29yZC5jYXRlZ29yeV0gfHwgW107XHJcbiAgICBtLmZvckVhY2goZnVuY3Rpb24gKG9Qb3NpdGlvbjogeyBwb3M6IG51bWJlciB9KSB7XHJcbiAgICAgIFwidXNlIHN0cmljdFwiO1xyXG4gICAgICBvV29yZC5yZWluZm9yY2UgPSBvV29yZC5yZWluZm9yY2UgfHwgMTtcclxuICAgICAgdmFyIGJvb3N0ID0gcmVpbmZvcmNlRGlzdFdlaWdodChpSW5kZXggLSBvUG9zaXRpb24ucG9zLCBvV29yZC5jYXRlZ29yeSk7XHJcbiAgICAgIG9Xb3JkLnJlaW5mb3JjZSAqPSBib29zdDtcclxuICAgICAgb1dvcmQuX3JhbmtpbmcgKj0gYm9vc3Q7XHJcbiAgICB9KTtcclxuICB9KTtcclxuICBvU2VudGVuY2UuZm9yRWFjaChmdW5jdGlvbiAob1dvcmQsIGlJbmRleCkge1xyXG4gICAgaWYgKGlJbmRleCA+IDAgKSB7XHJcbiAgICAgIGlmIChvU2VudGVuY2VbaUluZGV4LTFdLmNhdGVnb3J5ID09PSBcIm1ldGFcIiAgJiYgKG9Xb3JkLmNhdGVnb3J5ID09PSBvU2VudGVuY2VbaUluZGV4LTFdLm1hdGNoZWRTdHJpbmcpICkge1xyXG4gICAgICAgIG9Xb3JkLnJlaW5mb3JjZSA9IG9Xb3JkLnJlaW5mb3JjZSB8fCAxO1xyXG4gICAgICAgIHZhciBib29zdCA9IHJlaW5mb3JjZURpc3RXZWlnaHQoMSwgb1dvcmQuY2F0ZWdvcnkpO1xyXG4gICAgICAgIG9Xb3JkLnJlaW5mb3JjZSAqPSBib29zdDtcclxuICAgICAgICBvV29yZC5fcmFua2luZyAqPSBib29zdDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiBvU2VudGVuY2U7XHJcbn1cclxuXHJcblxyXG5pbXBvcnQgKiBhcyBTZW50ZW5jZSBmcm9tICcuL3NlbnRlbmNlJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZWluRm9yY2UoYUNhdGVnb3JpemVkQXJyYXkpIHtcclxuICBcInVzZSBzdHJpY3RcIjtcclxuICBhQ2F0ZWdvcml6ZWRBcnJheS5mb3JFYWNoKGZ1bmN0aW9uIChvU2VudGVuY2UpIHtcclxuICAgIHJlaW5Gb3JjZVNlbnRlbmNlKG9TZW50ZW5jZSk7XHJcbiAgfSlcclxuICBhQ2F0ZWdvcml6ZWRBcnJheS5zb3J0KFNlbnRlbmNlLmNtcFJhbmtpbmdQcm9kdWN0KTtcclxuIGRlYnVnbG9nKCgpPT5cImFmdGVyIHJlaW5mb3JjZVwiICsgYUNhdGVnb3JpemVkQXJyYXkubWFwKGZ1bmN0aW9uIChvU2VudGVuY2UpIHtcclxuICAgICAgcmV0dXJuIFNlbnRlbmNlLnJhbmtpbmdQcm9kdWN0KG9TZW50ZW5jZSkgKyBcIjpcIiArIEpTT04uc3RyaW5naWZ5KG9TZW50ZW5jZSk7XHJcbiAgICB9KS5qb2luKFwiXFxuXCIpKTtcclxuICByZXR1cm4gYUNhdGVnb3JpemVkQXJyYXk7XHJcbn1cclxuXHJcblxyXG4vLy8gYmVsb3cgbWF5IG5vIGxvbmdlciBiZSB1c2VkXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hSZWdFeHAob1J1bGU6IElGTW9kZWwuSVJ1bGUsIGNvbnRleHQ6IElGTWF0Y2guY29udGV4dCwgb3B0aW9ucz86IElNYXRjaE9wdGlvbnMpIHtcclxuICBpZiAoY29udGV4dFtvUnVsZS5rZXldID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG4gIHZhciBzS2V5ID0gb1J1bGUua2V5O1xyXG4gIHZhciBzMSA9IGNvbnRleHRbb1J1bGUua2V5XS50b0xvd2VyQ2FzZSgpXHJcbiAgdmFyIHJlZyA9IG9SdWxlLnJlZ2V4cDtcclxuXHJcbiAgdmFyIG0gPSByZWcuZXhlYyhzMSk7XHJcbiAgaWYoZGVidWdsb2dWLmVuYWJsZWQpIHtcclxuICAgIGRlYnVnbG9nVihcImFwcGx5aW5nIHJlZ2V4cDogXCIgKyBzMSArIFwiIFwiICsgSlNPTi5zdHJpbmdpZnkobSkpO1xyXG4gIH1cclxuICBpZiAoIW0pIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XHJcbiAgdmFyIGRlbHRhID0gY29tcGFyZUNvbnRleHQoY29udGV4dCwgb1J1bGUuZm9sbG93cywgb1J1bGUua2V5KVxyXG4gIGRlYnVnbG9nVigoKT0+SlNPTi5zdHJpbmdpZnkoZGVsdGEpKTtcclxuICBkZWJ1Z2xvZ1YoKCk9PkpTT04uc3RyaW5naWZ5KG9wdGlvbnMpKTtcclxuICBpZiAob3B0aW9ucy5tYXRjaG90aGVycyAmJiAoZGVsdGEuZGlmZmVyZW50ID4gMCkpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWRcclxuICB9XHJcbiAgdmFyIG9FeHRyYWN0ZWRDb250ZXh0ID0gZXh0cmFjdEFyZ3NNYXAobSwgb1J1bGUuYXJnc01hcCk7XHJcbiAgZGVidWdsb2dWKCgpPT5cImV4dHJhY3RlZCBhcmdzIFwiICsgSlNPTi5zdHJpbmdpZnkob1J1bGUuYXJnc01hcCkpO1xyXG4gIGRlYnVnbG9nVigoKT0+XCJtYXRjaCBcIiArIEpTT04uc3RyaW5naWZ5KG0pKTtcclxuICBkZWJ1Z2xvZ1YoKCk9PlwiZXh0cmFjdGVkIGFyZ3MgXCIgKyBKU09OLnN0cmluZ2lmeShvRXh0cmFjdGVkQ29udGV4dCkpO1xyXG4gIHZhciByZXMgPSBBbnlPYmplY3QuYXNzaWduKHt9LCBvUnVsZS5mb2xsb3dzKSBhcyBhbnk7XHJcbiAgcmVzID0gQW55T2JqZWN0LmFzc2lnbihyZXMsIG9FeHRyYWN0ZWRDb250ZXh0KTtcclxuICByZXMgPSBBbnlPYmplY3QuYXNzaWduKHJlcywgY29udGV4dCk7XHJcbiAgaWYgKG9FeHRyYWN0ZWRDb250ZXh0W3NLZXldICE9PSB1bmRlZmluZWQpIHtcclxuICAgIHJlc1tzS2V5XSA9IG9FeHRyYWN0ZWRDb250ZXh0W3NLZXldO1xyXG4gIH1cclxuICBpZiAob3B0aW9ucy5vdmVycmlkZSkge1xyXG4gICAgcmVzID0gQW55T2JqZWN0LmFzc2lnbihyZXMsIG9SdWxlLmZvbGxvd3MpO1xyXG4gICAgcmVzID0gQW55T2JqZWN0LmFzc2lnbihyZXMsIG9FeHRyYWN0ZWRDb250ZXh0KVxyXG4gIH1cclxuICBPYmplY3QuZnJlZXplKHJlcyk7XHJcbiAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/ICgnRm91bmQgb25lJyArIEpTT04uc3RyaW5naWZ5KHJlcywgdW5kZWZpbmVkLCAyKSkgOiAnLScpO1xyXG4gIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzb3J0QnlXZWlnaHQoc0tleTogc3RyaW5nLCBvQ29udGV4dEE6IElGTWF0Y2guY29udGV4dCwgb0NvbnRleHRCOiBJRk1hdGNoLmNvbnRleHQpOiBudW1iZXIge1xyXG4gIGRlYnVnbG9nVigoKT0+J3NvcnRpbmc6ICcgKyBzS2V5ICsgJ2ludm9rZWQgd2l0aFxcbiAxOicgKyBKU09OLnN0cmluZ2lmeShvQ29udGV4dEEsIHVuZGVmaW5lZCwgMikgK1xyXG4gICAgXCIgdnMgXFxuIDI6XCIgKyBKU09OLnN0cmluZ2lmeShvQ29udGV4dEIsIHVuZGVmaW5lZCwgMikpO1xyXG4gIHZhciByYW5raW5nQTogbnVtYmVyID0gcGFyc2VGbG9hdChvQ29udGV4dEFbXCJfcmFua2luZ1wiXSB8fCBcIjFcIik7XHJcbiAgdmFyIHJhbmtpbmdCOiBudW1iZXIgPSBwYXJzZUZsb2F0KG9Db250ZXh0QltcIl9yYW5raW5nXCJdIHx8IFwiMVwiKTtcclxuICBpZiAocmFua2luZ0EgIT09IHJhbmtpbmdCKSB7XHJcbiAgICBkZWJ1Z2xvZygoKT0+IFwiIHJhbmtpbiBkZWx0YVwiICsgMTAwICogKHJhbmtpbmdCIC0gcmFua2luZ0EpKTtcclxuICAgIHJldHVybiAxMDAgKiAocmFua2luZ0IgLSByYW5raW5nQSlcclxuICB9XHJcblxyXG4gIHZhciB3ZWlnaHRBID0gb0NvbnRleHRBW1wiX3dlaWdodFwiXSAmJiBvQ29udGV4dEFbXCJfd2VpZ2h0XCJdW3NLZXldIHx8IDA7XHJcbiAgdmFyIHdlaWdodEIgPSBvQ29udGV4dEJbXCJfd2VpZ2h0XCJdICYmIG9Db250ZXh0QltcIl93ZWlnaHRcIl1bc0tleV0gfHwgMDtcclxuICByZXR1cm4gKyh3ZWlnaHRCIC0gd2VpZ2h0QSk7XHJcbn1cclxuXHJcblxyXG4vLyBXb3JkLCBTeW5vbnltLCBSZWdleHAgLyBFeHRyYWN0aW9uUnVsZVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGF1Z21lbnRDb250ZXh0MShjb250ZXh0OiBJRk1hdGNoLmNvbnRleHQsIG9SdWxlczogQXJyYXk8SUZNb2RlbC5JUnVsZT4sIG9wdGlvbnM6IElNYXRjaE9wdGlvbnMpOiBBcnJheTxJRk1hdGNoLmNvbnRleHQ+IHtcclxuICB2YXIgc0tleSA9IG9SdWxlc1swXS5rZXk7XHJcbiAgLy8gY2hlY2sgdGhhdCBydWxlXHJcbiAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcclxuICAgIC8vIGNoZWNrIGNvbnNpc3RlbmN5XHJcbiAgICBvUnVsZXMuZXZlcnkoZnVuY3Rpb24gKGlSdWxlKSB7XHJcbiAgICAgIGlmIChpUnVsZS5rZXkgIT09IHNLZXkpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbmhvbW9nZW5vdXMga2V5cyBpbiBydWxlcywgZXhwZWN0ZWQgXCIgKyBzS2V5ICsgXCIgd2FzIFwiICsgSlNPTi5zdHJpbmdpZnkoaVJ1bGUpKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLy8gbG9vayBmb3IgcnVsZXMgd2hpY2ggbWF0Y2hcclxuICB2YXIgcmVzID0gb1J1bGVzLm1hcChmdW5jdGlvbiAob1J1bGUpIHtcclxuICAgIC8vIGlzIHRoaXMgcnVsZSBhcHBsaWNhYmxlXHJcbiAgICBzd2l0Y2ggKG9SdWxlLnR5cGUpIHtcclxuICAgICAgY2FzZSBJRk1vZGVsLkVudW1SdWxlVHlwZS5XT1JEOlxyXG4gICAgICAgIHJldHVybiBtYXRjaFdvcmQob1J1bGUsIGNvbnRleHQsIG9wdGlvbnMpXHJcbiAgICAgIGNhc2UgSUZNb2RlbC5FbnVtUnVsZVR5cGUuUkVHRVhQOlxyXG4gICAgICAgIHJldHVybiBtYXRjaFJlZ0V4cChvUnVsZSwgY29udGV4dCwgb3B0aW9ucyk7XHJcbiAgICAgIC8vICAgY2FzZSBcIkV4dHJhY3Rpb25cIjpcclxuICAgICAgLy8gICAgIHJldHVybiBtYXRjaEV4dHJhY3Rpb24ob1J1bGUsY29udGV4dCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkXHJcbiAgfSkuZmlsdGVyKGZ1bmN0aW9uIChvcmVzKSB7XHJcbiAgICByZXR1cm4gISFvcmVzXHJcbiAgfSkuc29ydChcclxuICAgIHNvcnRCeVdlaWdodC5iaW5kKHRoaXMsIHNLZXkpXHJcbiAgICApO1xyXG4gICAgLy9kZWJ1Z2xvZyhcImhhc3NvcnRlZFwiICsgSlNPTi5zdHJpbmdpZnkocmVzLHVuZGVmaW5lZCwyKSk7XHJcbiAgcmV0dXJuIHJlcztcclxuICAvLyBPYmplY3Qua2V5cygpLmZvckVhY2goZnVuY3Rpb24gKHNLZXkpIHtcclxuICAvLyB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGF1Z21lbnRDb250ZXh0KGNvbnRleHQ6IElGTWF0Y2guY29udGV4dCwgYVJ1bGVzOiBBcnJheTxJRk1vZGVsLklSdWxlPik6IEFycmF5PElGTWF0Y2guY29udGV4dD4ge1xyXG5cclxuICB2YXIgb3B0aW9uczE6IElNYXRjaE9wdGlvbnMgPSB7XHJcbiAgICBtYXRjaG90aGVyczogdHJ1ZSxcclxuICAgIG92ZXJyaWRlOiBmYWxzZVxyXG4gIH0gYXMgSU1hdGNoT3B0aW9ucztcclxuXHJcbiAgdmFyIGFSZXMgPSBhdWdtZW50Q29udGV4dDEoY29udGV4dCwgYVJ1bGVzLCBvcHRpb25zMSlcclxuXHJcbiAgaWYgKGFSZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICB2YXIgb3B0aW9uczI6IElNYXRjaE9wdGlvbnMgPSB7XHJcbiAgICAgIG1hdGNob3RoZXJzOiBmYWxzZSxcclxuICAgICAgb3ZlcnJpZGU6IHRydWVcclxuICAgIH0gYXMgSU1hdGNoT3B0aW9ucztcclxuICAgIGFSZXMgPSBhdWdtZW50Q29udGV4dDEoY29udGV4dCwgYVJ1bGVzLCBvcHRpb25zMik7XHJcbiAgfVxyXG4gIHJldHVybiBhUmVzO1xyXG59XHJcbiJdfQ==
