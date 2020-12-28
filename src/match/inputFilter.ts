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
import * as distance from 'abot_stringdist';

//import * as Logger from '../utils/logger';

//const logger = Logger.logger('inputFilter');

import * as debug from 'debugf';
var debugperf = debug('perf');
var logger = debug('inputFilterLogger');

import {IFModel as IFModel} from '../model/index_model';
import * as utils from 'abot_utils';

//import * as IFMatch from '../match/iferbase';


//import * as inputFilterRules from './inputFilterRules';

import * as Algol from './algol';

import * as IFMatch from './iferbase';
import * as IMatch from './iferbase';

import { BreakDown as breakdown} from '../model/index_model';

const AnyObject = <any>Object;

var debuglog = debug('inputFilter')
var debuglogV = debug('inputVFilter')
var debuglogM = debug('inputMFilter')

export function mockDebug(o) {
  debuglog = o;
  debuglogV = o;
  debuglogM = o;
}


/**
 * @param sText {string} the text to match to NavTargetResolution
 * @param sText2 {string} the query text, e.g. NavTarget
 *
 * @return the distance, note that is is *not* symmetric!
 */
export function calcDistance(sText1: string, sText2: string): number {
  return distance.calcDistanceAdjusted(sText1,sText2);
}


export interface ICntRec {
};


type IRule = IFMatch.IRule


export interface IMatchOptions {
  matchothers?: boolean,
  augment?: boolean,
  override?: boolean
}

interface IMatchCount {
  equal: number
  different: number
  spuriousR: number
  spuriousL: number
}

type EnumRuleType = IFModel.EnumRuleType

export function levenPenalty(i: number): number {
  // 1 -> 1
  // cutOff => 0.8
  return i;
  //return   1 -  (1 - i) *0.2/Algol.Cutoff_WordMatch;
}


function nonPrivateKeys(oA) {
  return Object.keys(oA).filter(key => {
    return key[0] !== '_';
  });
}

export function countAinB(oA, oB, fnCompare, aKeyIgnore?): number {
  aKeyIgnore = Array.isArray(aKeyIgnore) ? aKeyIgnore :
    typeof aKeyIgnore === "string" ? [aKeyIgnore] : [];
  fnCompare = fnCompare || function () { return true; }
  return nonPrivateKeys(oA).filter(function (key) {
    return aKeyIgnore.indexOf(key) < 0;
  }).
    reduce(function (prev, key) {
      if (Object.prototype.hasOwnProperty.call(oB, key)) {
        prev = prev + (fnCompare(oA[key], oB[key], key) ? 1 : 0)
      }
      return prev
    }, 0)
}

export function spuriousAnotInB(oA, oB, aKeyIgnore?) {
  aKeyIgnore = Array.isArray(aKeyIgnore) ? aKeyIgnore :
    typeof aKeyIgnore === "string" ? [aKeyIgnore] : [];
  return nonPrivateKeys(oA).filter(function (key) {
    return aKeyIgnore.indexOf(key) < 0;
  }).
    reduce(function (prev, key) {
      if (!Object.prototype.hasOwnProperty.call(oB, key)) {
        prev = prev + 1
      }
      return prev
    }, 0)
}

function lowerCase(o) {
  if (typeof o === "string") {
    return o.toLowerCase()
  }
  return o
}

export function compareContext(oA, oB, aKeyIgnore?) {
  var equal = countAinB(oA, oB, function (a, b) { return lowerCase(a) === lowerCase(b); }, aKeyIgnore);
  var different = countAinB(oA, oB, function (a, b) { return lowerCase(a) !== lowerCase(b); }, aKeyIgnore);
  var spuriousL = spuriousAnotInB(oA, oB, aKeyIgnore)
  var spuriousR = spuriousAnotInB(oB, oA, aKeyIgnore)
  return {
    equal: equal,
    different: different,
    spuriousL: spuriousL,
    spuriousR: spuriousR
  }
}

function sortByRank(a: IFMatch.ICategorizedString, b: IFMatch.ICategorizedString): number {
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


function sortByRankThenResult(a: IFMatch.ICategorizedStringRanged, b: IFMatch.ICategorizedStringRanged): number {
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
  r = cmpByResultThenRank(a,b);
  if(r) {
    return r;
  }
  return 0;
}


export function cmpByResult(a: IFMatch.ICategorizedStringRanged, b: IFMatch.ICategorizedStringRanged): number {
  if(a.rule === b.rule) {
    return 0;
  }
  var r = a.rule.bitindex - b.rule.bitindex;
  if(r) {
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


export function cmpByResultThenRank(a: IFMatch.ICategorizedStringRanged, b: IFMatch.ICategorizedStringRanged): number {
  var r = cmpByResult(a,b);
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

function analyseRegexp(
  res : Array<IFMatch.ICategorizedString>,
  oRule : IFModel.mRule,
  string : string )
{
  debuglog(()=> " here regexp: " + JSON.stringify(oRule, undefined, 2) + '\n' + oRule.regexp.toString() );
  var m = oRule.regexp.exec(string);
  var rec = undefined;
  if (m) {
    rec = {
      string: string,
      matchedString: (oRule.matchIndex !== undefined && m[oRule.matchIndex]) || string,
      rule : oRule,
      category: oRule.category,
      _ranking: oRule._ranking || 1.0
    };
    debuglog(()=>"\n!match regexp  " + oRule.regexp.toString() + " " + rec._ranking.toFixed(3) + "  " + string + "="  + oRule.lowercaseword  + " => " + oRule.matchedString + "/" + oRule.category);
    res.push(rec);
  }
}


export function checkOneRule(string: string, lcString : string, exact : boolean,
res : Array<IFMatch.ICategorizedString>,
oRule : IFModel.mRule, cntRec? : ICntRec ) {
    debuglogV(()=> 'attempting to match rule ' + JSON.stringify(oRule) + " to string \"" + string + "\"");
    switch (oRule.type) {
      case IFModel.EnumRuleType.WORD:
        if(!oRule.lowercaseword) {
          throw new Error('rule without a lowercase variant' + JSON.stringify(oRule, undefined, 2));
         };
         // TODO CHECK THIS
        if (exact && (oRule.word === string || oRule.lowercaseword === lcString)) {
  //      if (exact && oRule.word === string || oRule.lowercaseword === lcString) {
          debuglog(()=>"\n!matched exact " + string + "="  + oRule.lowercaseword  + " => " + oRule.matchedString + "/" + oRule.category);
          res.push({
            string: string,
            matchedString: oRule.matchedString,
            category: oRule.category,
            _ranking: oRule._ranking || 1.0
          })
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
            addCntRec(cntRec,"calcDistanceOk", 1);
            var rec = {
              string: string,
              matchedString: oRule.matchedString,
              category: oRule.category,
              _ranking: (oRule._ranking || 1.0) * levenPenalty(levenmatch),
              levenmatch: levenmatch
            };
            debuglog(()=>"\n!fuzzy " + (levenmatch).toFixed(3) + " " + rec._ranking.toFixed(3) + "  " + string + "="  + oRule.lowercaseword  + " => " + oRule.matchedString + "/" + oRule.category);
            res.push(rec);
          }
        }
        break;
      case IFModel.EnumRuleType.REGEXP: {
        analyseRegexp( res, oRule, string );
        break;
      }
      //break;
      default:
        throw new Error("unknown type" + JSON.stringify(oRule, undefined, 2))
    }
}



export function checkOneRuleWithOffset(string: string, lcString : string, exact : boolean,
res : Array<IMatch.ICategorizedStringRanged>,
oRule : IFModel.mRule, cntRec? : ICntRec ) {
    debuglogV(()=>'attempting to match rule ' + JSON.stringify(oRule) + " to string \"" + string + "\"");
    switch (oRule.type) {
      case IFModel.EnumRuleType.WORD:
        if(!oRule.lowercaseword) {
          throw new Error('rule without a lowercase variant' + JSON.stringify(oRule, undefined, 2));
         };
        if (exact && (oRule.word === string || oRule.lowercaseword === lcString)) {
          debuglog(()=> "\n!matched exact " + string + "="  + oRule.lowercaseword  + " => " + oRule.matchedString + "/" + oRule.category);
          res.push({
            string: string,
            matchedString: oRule.matchedString,
            category: oRule.category,
            rule: oRule,
            _ranking: oRule._ranking || 1.0
          })
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
            addCntRec(cntRec,"calcDistanceOk", 1);
            var rec = {
              string: string,
              rule : oRule,
              matchedString: oRule.matchedString,
              category: oRule.category,
              _ranking: (oRule._ranking || 1.0) * levenPenalty(levenmatch),
              levenmatch: levenmatch
            };
            debuglog(() =>"\n!CORO: fuzzy " + (levenmatch).toFixed(3) + " " + rec._ranking.toFixed(3) + "  \"" + string + "\"="  + oRule.lowercaseword  + " => " + oRule.matchedString + "/" + oRule.category + "/" + oRule.bitindex);
            res.push(rec);
          }
        }
        break;
      case IFModel.EnumRuleType.REGEXP: {
        analyseRegexp( res, oRule, string );
        break;
      }
      //break;
      default:
        throw new Error("unknown type" + JSON.stringify(oRule, undefined, 2))
    }
}


function addCntRec(cntRec : ICntRec, member : string, number : number) {
  if((!cntRec) || (number === 0)) {
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



export function categorizeSingleWordWithOffset(word: string, lcword : string, exact: boolean, oRules: Array<IFModel.mRule>,
 cntRec? : ICntRec): Array<IFMatch.ICategorizedStringRanged> {
  // simply apply all rules
  debuglogV(()=> "rules : " + JSON.stringify(oRules, undefined, 2));
  var res: Array<IMatch.ICategorizedStringRanged> = []
  oRules.forEach(function (oRule) {
    checkOneRuleWithOffset(word,lcword,exact,res,oRule,cntRec);
  });
  debuglog(`CSWWO: got results for ${lcword}  ${res.length}`);
  res.sort(sortByRank);
  return res;
}

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


export function dropLowerRankedEqualResult(res : Array<IFMatch.ICategorizedStringRanged>) : Array<IFMatch.ICategorizedStringRanged> {
  res.sort(cmpByResultThenRank);
  return res.filter(function(resx,index) {
    var prior = res[index-1];
    if( prior &&
        !(resx.rule && resx.rule.range)
     && !(res[index-1].rule && res[index-1].rule.range)
     && (resx.matchedString === prior.matchedString)
     && (resx.rule.bitindex === prior.rule.bitindex)
     && (resx.rule.wordType === prior.rule.wordType)
     && (resx.category === res[index-1].category)) {
      return false;
    }
    return true;
  });
}


export function postFilterWithOffset(res : Array<IFMatch.ICategorizedStringRanged>) : Array<IFMatch.ICategorizedStringRanged> {
  // for filtering, we need to get *equal rule results close together
  // =>
  //

  res.sort(sortByRank);
  var bestRank = 0;
  //console.log("\npiltered " + JSON.stringify(res));
  debuglog(()=>" preFilter : \n" + res.map(function(word) {
      return ` ${word._ranking}  => "${word.category}" ${word.matchedString} `;
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
    var prior = res[index-1];
    if(
        !(resx.rule && resx.rule.range)
     && !(res[index-1].rule && res[index-1].rule.range)
     && (resx.matchedString === prior.matchedString)
     && (resx.rule.bitindex === prior.rule.bitindex)
     && (resx.rule.wordType === prior.rule.wordType)
     && (resx.category === res[index-1].category)) {
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
  debuglog(()=>`\nfiltered ${r.length}/${res.length}` + JSON.stringify(r));
  return r;
}

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


export function categorizeWordInternalWithOffsets(word: string, lcword : string, exact: boolean,  rules : IMatch.SplitRules
  , cntRec? :ICntRec): Array<IFMatch.ICategorizedStringRanged> {

  debuglogM("categorize  CWIWO" + lcword + " with offset!!!!!!!!!!!!!!!!!" + exact)
  // simply apply all rules
  if (debuglogV.enabled )  {
    // TODO this is circular: debuglogV("rules : " + JSON.stringify(rules,undefined, 2));
  }
  var res: Array<IMatch.ICategorizedStringRanged> = [];
  if (exact) {
    var r = rules.wordMap[lcword];
    if (r) {
      debuglogM(debuglogM.enabled ? ` ....pushing n rules exact for ${lcword}:` + r.rules.length : '-');
      debuglogM(debuglogM.enabled ? r.rules.map((r,index)=> '' + index + ' ' + JSON.stringify(r)).join("\n") : '-');
      r.rules.forEach(function(oRule) {
        res.push({
            string: word,
            matchedString: oRule.matchedString,
            category: oRule.category,
            rule: oRule,
            _ranking: oRule._ranking || 1.0
          })
     });
    }
    rules.nonWordRules.forEach(function (oRule) {
      checkOneRuleWithOffset(word,lcword, exact,res,oRule,cntRec);
    });
    res = postFilterWithOffset(res);
    debuglog(()=>"here results exact for " + word + " res " + res.length);
    debuglogM(()=>"here results exact for " + word + " res " + res.length);
    res.sort(sortByRank);
    return res;
  } else {
    debuglog("categorize non exact \"" + word + "\"    " + rules.allRules.length);
    var rr = categorizeSingleWordWithOffset(word,lcword, exact, rules.allRules, cntRec);
    //debulogM("fuzzy res " + JSON.stringify(rr));
    return postFilterWithOffset(rr);
  }
}



/**
 *
 * Options may be {
 * matchothers : true,  => only rules where all others match are considered
 * augment : true,
 * override : true }  =>
 *
 */
export function matchWord(oRule: IFModel.IRule, context: IFMatch.context, options?: IMatchOptions) {
  if (context[oRule.key] === undefined) {
    return undefined;
  }
  var s1 = context[oRule.key].toLowerCase()
  var s2 = oRule.word.toLowerCase();
  options = options || {}
  var delta = compareContext(context, oRule.follows, oRule.key)
  debuglogV(()=>JSON.stringify(delta));
  debuglogV(()=>JSON.stringify(options));
  if (options.matchothers && (delta.different > 0)) {
    return undefined
  }
  var c: number = calcDistance(s2, s1);
  debuglogV(() => " s1 <> s2 " + s1 + "<>" + s2 + "  =>: " + c);
  if (c > 0.80) {
    var res = AnyObject.assign({}, oRule.follows) as any;
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
    debuglog(()=>'Found one' + JSON.stringify(res, undefined, 2));
    return res;
  }
  return undefined;
}

export function extractArgsMap(match: Array<string>, argsMap: { [key: number]: string }): IFMatch.context {
  var res = {} as IFMatch.context;
  if (!argsMap) {
    return res;
  }
  Object.keys(argsMap).forEach(function (iKey) {
    var value = match[iKey]
    var key = argsMap[iKey];
    if ((typeof value === "string") && value.length > 0) {
      res[key] = value
    }
  }
  );
  return res;
}

export const RankWord = {
  hasAbove: function (lst: Array<IFMatch.ICategorizedString>, border: number): boolean {
    return !lst.every(function (oMember) {
      return (oMember._ranking < border);
    });
  },

  takeFirstN: function<T extends IFMatch.ICategorizedString> (lst: Array<T>, n: number): Array<T> {
    var lastRanking = 1.0;
    var cntRanged = 0;
    return lst.filter(function (oMember, iIndex) {
    var isRanged = !!(oMember["rule"] && oMember["rule"].range);
    if(isRanged) {
      cntRanged += 1;
      return true;
    }
    if (((iIndex - cntRanged) < n) || (oMember._ranking === lastRanking))  {
        lastRanking = oMember._ranking;
        return true;
      }
      return false;
    });
  },
  takeAbove : function<T extends IFMatch.ICategorizedString> (lst: Array<T>, border: number): Array<T> {
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

export function categorizeWordWithOffsetWithRankCutoff(sWordGroup: string, splitRules : IMatch.SplitRules, cntRec? : ICntRec ): Array<IFMatch.ICategorizedStringRanged> {
  var sWordGroupLC = sWordGroup.toLowerCase();
  var seenIt = categorizeWordInternalWithOffsets(sWordGroup, sWordGroupLC, true, splitRules, cntRec);
  //console.log("SEENIT" + JSON.stringify(seenIt));
  //totalCnt += 1;
  // exactLen += seenIt.length;
  //console.log("first run exact " + JSON.stringify(seenIt));
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
    seenIt = categorizeWordInternalWithOffsets(sWordGroup, sWordGroupLC, false, splitRules, cntRec);
    addCntRec(cntRec, 'cntNonExact', 1);
    addCntRec(cntRec, 'cntNonExactRes', seenIt.length);
  //  fuzzyLen += seenIt.length;
  //  fuzzyCnt += 1;
  }
  // totalLen += seenIt.length;
  debuglog(()=>( `${seenIt.length} with ${seenIt.reduce( (prev,obj) => prev + (obj.rule.range ? 1 : 0),0)} ranged !`));
//  var cntRanged = seenIt.reduce( (prev,obj) => prev + (obj.rule.range ? 1 : 0),0);
//  console.log(`*********** ${seenIt.length} with ${cntRanged} ranged !`);

  seenIt = RankWord.takeFirstN(seenIt, Algol.Top_N_WordCategorizations);
 // retainedCnt += seenIt.length;
  //console.log("final res of categorizeWordWithOffsetWithRankCutoff" + JSON.stringify(seenIt));

  return seenIt;
}


export function categorizeWordWithOffsetWithRankCutoffSingle(word: string, rule: IFModel.mRule): IFMatch.ICategorizedStringRanged {
  var lcword = word.toLowerCase();

  if(lcword === rule.lowercaseword) {
    return {
            string: word,
            matchedString: rule.matchedString,
            category: rule.category,
            rule: rule,
            _ranking: rule._ranking || 1.0
          };
  }

  var res: Array<IMatch.ICategorizedStringRanged> = []
  checkOneRuleWithOffset(word,lcword,false,res,rule);
  debuglog("catWWOWRCS " + lcword);
  if(res.length) {
    return res[0];
  }
  return undefined;
}



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

export function categorizeAWord(sWordGroup: string, rules: IMatch.SplitRules, sentence: string, words: { [key: string]: Array<IFMatch.ICategorizedString>},
cntRec ? : ICntRec ) : IMatch.ICategorizedStringRanged[] {
  return categorizeAWordWithOffsets(sWordGroup, rules, sentence, words).filter(
     r => !r.span && !r.rule.range
  );
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
export function categorizeAWordWithOffsets(sWordGroup: string, rules: IMatch.SplitRules, sentence: string, words: { [key: string]: Array<IFMatch.ICategorizedString>},
cntRec ? : ICntRec ) : IMatch.ICategorizedStringRanged[] {
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
      debuglog(()=>"***WARNING: Did not find any categorization for primitive (!)" + sWordGroup);
    }
    debuglog(()=>"***WARNING: Did not find any categorization for " + sWordGroup);
    if (!seenIt) {
      throw new Error("Expecting emtpy list, not undefined for \"" + sWordGroup + "\"")
    }
    words[sWordGroup] = []
    return [];
  }
  return utils.cloneDeep(seenIt);
}









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
  for(i = 0; i < u.length; ++i) {
    u[i] = clone(u[i]);
  }
  return u;
}
// we can replicate the tail or the head,
// we replicate the tail as it is smaller.

// [a,b,c ]

export function expandMatchArr(deep: Array<Array<any>>): Array<Array<any>> {
  var a = [];
  var line = [];
  debuglog(()=> JSON.stringify(deep));
  deep.forEach(function (uBreakDownLine, iIndex: number) {
    line[iIndex] = [];
    uBreakDownLine.forEach(function (aWordGroup, wgIndex: number) {
      line[iIndex][wgIndex] = [];
      aWordGroup.forEach(function (oWordVariant, iWVIndex: number) {
        line[iIndex][wgIndex][iWVIndex] = oWordVariant;
      });
    });
  })
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
          nvecs[u].push(
            clone(line[i][k][l])); // push the lth variant
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


/**
 * Calculate a weight factor for a given distance and
 * category
 * @param {integer} dist distance in words
 * @param {string} category category to use
 * @returns {number} a distance factor >= 1
 *  1.0 for no effect
 */
export function reinforceDistWeight(dist: number, category: string): number {
  var abs = Math.abs(dist);
  return 1.0 + (Algol.aReinforceDistWeight[abs] || 0);
}

/**
 * Given a sentence, extact categories
 */
export function extractCategoryMap(oSentence: Array<IFMatch.IWord>): { [key: string]: Array<{ pos: number }> } {
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

export function reinForceSentence(oSentence) {
  "use strict";
  var oCategoryMap = extractCategoryMap(oSentence);
  oSentence.forEach(function (oWord, iIndex) {
    var m = oCategoryMap[oWord.category] || [];
    m.forEach(function (oPosition: { pos: number }) {
      "use strict";
      oWord.reinforce = oWord.reinforce || 1;
      var boost = reinforceDistWeight(iIndex - oPosition.pos, oWord.category);
      oWord.reinforce *= boost;
      oWord._ranking *= boost;
    });
  });
  oSentence.forEach(function (oWord, iIndex) {
    if (iIndex > 0 ) {
      if (oSentence[iIndex-1].category === "meta"  && (oWord.category === oSentence[iIndex-1].matchedString) ) {
        oWord.reinforce = oWord.reinforce || 1;
        var boost = reinforceDistWeight(1, oWord.category);
        oWord.reinforce *= boost;
        oWord._ranking *= boost;
      }
    }
  });
  return oSentence;
}


import * as Sentence from './sentence';

export function reinForce(aCategorizedArray) {
  "use strict";
  aCategorizedArray.forEach(function (oSentence) {
    reinForceSentence(oSentence);
  })
  aCategorizedArray.sort(Sentence.cmpRankingProduct);
 debuglog(()=>"after reinforce" + aCategorizedArray.map(function (oSentence) {
      return Sentence.rankingProduct(oSentence) + ":" + JSON.stringify(oSentence);
    }).join("\n"));
  return aCategorizedArray;
}


/// below may no longer be used

export function matchRegExp(oRule: IFModel.IRule, context: IFMatch.context, options?: IMatchOptions) {
  if (context[oRule.key] === undefined) {
    return undefined;
  }
  var sKey = oRule.key;
  var s1 = context[oRule.key].toLowerCase()
  var reg = oRule.regexp;

  var m = reg.exec(s1);
  if(debuglogV.enabled) {
    debuglogV("applying regexp: " + s1 + " " + JSON.stringify(m));
  }
  if (!m) {
    return undefined;
  }
  options = options || {}
  var delta = compareContext(context, oRule.follows, oRule.key)
  debuglogV(()=>JSON.stringify(delta));
  debuglogV(()=>JSON.stringify(options));
  if (options.matchothers && (delta.different > 0)) {
    return undefined
  }
  var oExtractedContext = extractArgsMap(m, oRule.argsMap);
  debuglogV(()=>"extracted args " + JSON.stringify(oRule.argsMap));
  debuglogV(()=>"match " + JSON.stringify(m));
  debuglogV(()=>"extracted args " + JSON.stringify(oExtractedContext));
  var res = AnyObject.assign({}, oRule.follows) as any;
  res = AnyObject.assign(res, oExtractedContext);
  res = AnyObject.assign(res, context);
  if (oExtractedContext[sKey] !== undefined) {
    res[sKey] = oExtractedContext[sKey];
  }
  if (options.override) {
    res = AnyObject.assign(res, oRule.follows);
    res = AnyObject.assign(res, oExtractedContext)
  }
  Object.freeze(res);
  debuglog(debuglog.enabled ? ('Found one' + JSON.stringify(res, undefined, 2)) : '-');
  return res;
}

export function sortByWeight(sKey: string, oContextA: IFMatch.context, oContextB: IFMatch.context): number {
  debuglogV(()=>'sorting: ' + sKey + 'invoked with\n 1:' + JSON.stringify(oContextA, undefined, 2) +
    " vs \n 2:" + JSON.stringify(oContextB, undefined, 2));
  var rankingA: number = parseFloat(oContextA["_ranking"] || "1");
  var rankingB: number = parseFloat(oContextB["_ranking"] || "1");
  if (rankingA !== rankingB) {
    debuglog(()=> " rankin delta" + 100 * (rankingB - rankingA));
    return 100 * (rankingB - rankingA)
  }

  var weightA = oContextA["_weight"] && oContextA["_weight"][sKey] || 0;
  var weightB = oContextB["_weight"] && oContextB["_weight"][sKey] || 0;
  return +(weightB - weightA);
}


// Word, Synonym, Regexp / ExtractionRule

export function augmentContext1(context: IFMatch.context, oRules: Array<IFModel.IRule>, options: IMatchOptions): Array<IFMatch.context> {
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
      case IFModel.EnumRuleType.WORD:
        return matchWord(oRule, context, options)
      case IFModel.EnumRuleType.REGEXP:
        return matchRegExp(oRule, context, options);
      //   case "Extraction":
      //     return matchExtraction(oRule,context);
    }
    return undefined
  }).filter(function (ores) {
    return !!ores
  }).sort(
    sortByWeight.bind(this, sKey)
    );
    //debuglog("hassorted" + JSON.stringify(res,undefined,2));
  return res;
  // Object.keys().forEach(function (sKey) {
  // });
}

export function augmentContext(context: IFMatch.context, aRules: Array<IFModel.IRule>): Array<IFMatch.context> {

  var options1: IMatchOptions = {
    matchothers: true,
    override: false
  } as IMatchOptions;

  var aRes = augmentContext1(context, aRules, options1)

  if (aRes.length === 0) {
    var options2: IMatchOptions = {
      matchothers: false,
      override: true
    } as IMatchOptions;
    aRes = augmentContext1(context, aRules, options2);
  }
  return aRes;
}
