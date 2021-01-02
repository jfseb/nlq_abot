"use strict";
/**
 *
 * @module jfseb.erbase
 * @file erbase
 * @copyright (c) 2016 Gerd Forstmann
 *
 * Basic domain based entity recognition
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processString2 = exports.filterReverseNonSameInterpretations = exports.filterBadOperatorArgs = exports.filterNonSameInterpretations = exports.isNonOptimalDistinctSourceForSame = exports.isBadOperatorArgs = exports.isSameCategoryAndHigherMatch = exports.isDistinctInterpretationForSame = exports.findCloseIdenticals = exports.processString = exports.expandTokenMatchesToSentences2 = exports.isSuccessorOperator = exports.makeAnyWord = exports.expandTokenMatchesToSentences = exports.isSpanVec = exports.evaluateRangeRulesToPosition = exports.mergeIgnoreOrAppend = exports.isSameRes = exports.tokenizeString = exports.mockDebug = void 0;
const WordMatch = require("./inputFilter");
const CharSequence = require("./charsequence");
const debug = require("debugf");
var debuglog = debug('erbase');
var debuglogV = debug('erVbase');
var perflog = debug('perf');
const index_model_1 = require("../model/index_model");
const ERError = require("./ererror");
const AnyObject = Object;
function mockDebug(o) {
    debuglog = o;
    debuglogV = o;
    perflog = o;
}
exports.mockDebug = mockDebug;
const utils = require("abot_utils");
const index_model_2 = require("../model/index_model");
const Sentence = require("./sentence");
const Word = require("./word");
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
function tokenizeString(sString, rules, words) {
    var cnt = 0;
    var fac = 1;
    var tokens = index_model_1.BreakDown.tokenizeString(sString);
    if (debuglog.enabled) {
        debuglog("here breakdown" + JSON.stringify(tokens));
    }
    //console.log(JSON.stringify(u));
    words = words || {};
    perflog('this many known words: ' + Object.keys(words).length);
    var res = [];
    var cntRec = {};
    var categorizedSentence = [];
    var hasRecombined = false;
    tokens.tokens.forEach(function (token, index) {
        var seenIt = WordMatch.categorizeAWordWithOffsets(token, rules, sString, words, cntRec);
        /* cannot have this, or need to add all fragment words "UI2 Integration"  if(seenIt.length === 0) {
              return false;
            }
        */
        hasRecombined = hasRecombined || !seenIt.every(res => !res.rule.range);
        debuglogV(debuglogV.enabled ? (` categorized ${token}/${index} to ` + JSON.stringify(seenIt))
            : "-");
        debuglog(debuglog.enabled ? (` categorized ${token}/${index} to ` +
            seenIt.map((it, idx) => { return ` ${idx}  ${it.rule.matchedString}/${it.rule.category}  ${it.rule.wordType}${it.rule.bitindex} `; }).join("\n"))
            : "-");
        categorizedSentence[index] = seenIt;
        cnt = cnt + seenIt.length;
        fac = fac * seenIt.length;
    });
    // have seen the plain categorization,
    debuglog(" sentences " + tokens.tokens.length + " matches " + cnt + " fac: " + fac);
    if (debuglog.enabled && tokens.tokens.length) {
        debuglog("first match " + JSON.stringify(tokens, undefined, 2));
    }
    debuglog(debuglog.enabled ? ` prior RangeRule ${JSON.stringify(categorizedSentence)} ` : '-');
    if (hasRecombined) {
        evaluateRangeRulesToPosition(tokens.tokens, tokens.fusable, categorizedSentence);
    }
    debuglog(debuglog.enabled ? ` after RangeRule ${JSON.stringify(categorizedSentence)} ` : '-');
    perflog(" sentences " + tokens.tokens.length + " / " + res.length + " matches " + cnt + " fac: " + fac + " rec : " + JSON.stringify(cntRec, undefined, 2));
    return {
        fusable: tokens.fusable,
        tokens: tokens.tokens,
        categorizedWords: categorizedSentence
    };
}
exports.tokenizeString = tokenizeString;
function isSameRes(present, res) {
    if (!((present.rule.matchedString === res.rule.matchedString)
        && (present.rule.category === res.rule.category)
        && (present.span === res.span)
        && (present.rule.bitindex === res.rule.bitindex))) {
        return 0;
    }
    if (present._ranking < res._ranking) {
        return -1;
    }
    return +1;
}
exports.isSameRes = isSameRes;
function mergeIgnoreOrAppend(result, res) {
    var insertindex = -1;
    var foundNothing = result.every((present, index) => {
        var r = isSameRes(present, res);
        if (r < 0) {
            //console.log("overwriting worse \n" + JSON.stringify(res) + '\n' + JSON.stringify(present)+ '\n');
            result[index] = res;
            return false;
        }
        else if (r > 0) {
            //console.log('skipping present');
            return false;
        }
        return true;
    });
    if (foundNothing) {
        //debulog('pushing');
        result.push(res);
    }
}
exports.mergeIgnoreOrAppend = mergeIgnoreOrAppend;
function evaluateRangeRulesToPosition(tokens, fusable, categorizedWords) {
    debuglog(debuglog.enabled ? ("evaluateRangeRulesToPosition... " + JSON.stringify(categorizedWords)) : '-');
    categorizedWords.forEach(function (wordlist, index) {
        wordlist.forEach(function (word) {
            if (word.rule.range) {
                //console.log(` got targetindex for RangeRules evaluation : ${targetIndex} ${index} ${fusable.join(" ")}`);
                var targetIndex = index_model_1.BreakDown.isCombinableRangeReturnIndex(word.rule.range, fusable, index);
                //console.log(` got targetindex for RangeRules evaluation : ${targetIndex}`);
                if (targetIndex >= 0) {
                    var combinedWord = index_model_1.BreakDown.combineTokens(word.rule.range, index, tokens);
                    debuglog(debuglog.enabled ? (` test "${combinedWord}" against "${word.rule.range.rule.lowercaseword}" ${JSON.stringify(word.rule.range.rule)}`) : '-');
                    var res = WordMatch.categorizeWordWithOffsetWithRankCutoffSingle(combinedWord, word.rule.range.rule);
                    debuglog(debuglog.enabled ? (" got res : " + JSON.stringify(res)) : '-');
                    if (res) {
                        res.span = word.rule.range.high - word.rule.range.low + 1;
                        categorizedWords[targetIndex] = categorizedWords[targetIndex].slice(0); // avoid invalidation of seenit
                        debuglog(`pushed sth at ${targetIndex}`);
                        mergeIgnoreOrAppend(categorizedWords[targetIndex], res);
                        //         categorizedWords[targetIndex].push(res); // check that this does not invalidate seenit!
                    }
                }
            }
        });
    });
    // filter all range rules !
    categorizedWords.forEach(function (wordlist, index) {
        categorizedWords[index] = wordlist.filter(word => !word.rule.range);
    });
}
exports.evaluateRangeRulesToPosition = evaluateRangeRulesToPosition;
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
function isSpanVec(vec, index) {
    var effectivelen = vec.reduce((prev, mem) => prev += mem.span ? mem.span : 1, 0);
    return effectivelen > index;
}
exports.isSpanVec = isSpanVec;
/**
 * expand an array [[a1,a2], [b1,b2],[c]]
 * into all combinations
 *
 *  if a1 has a span of three, the variations of the lower layer are skipped
 *
 * with the special property
 */
function expandTokenMatchesToSentences(tokens, tokenMatches) {
    return expandTokenMatchesToSentences2(tokens, tokenMatches);
}
exports.expandTokenMatchesToSentences = expandTokenMatchesToSentences;
/*
export function expandTokenMatchesToSentences(tokens: string[], tokenMatches: Array<Array<any>>): IMatch.IProcessedSentences {
 var a = [];
 var wordMatches = [];
 debuglogV(debuglog.enabled ? JSON.stringify(tokenMatches) : '-');
 tokenMatches.forEach(function (aWordMatches, wordIndex: number) {
   wordMatches[wordIndex] = [];
   aWordMatches.forEach(function (oWordVariant, wordVariantIndex: number) {
     wordMatches[wordIndex][wordVariantIndex] = oWordVariant;
   });
 });
 debuglog(debuglog.enabled ? JSON.stringify(tokenMatches) : '-');
 var result = {
   errors: [],
   tokens: tokens,
   sentences: []
 } as IMatch.IProcessedSentences;
 var nvecs = [];
 var res = [[]];
 // var nvecs = [];
 var rvec = [];
 for (var tokenIndex = 0; tokenIndex < tokenMatches.length; ++tokenIndex) { // wordg index k
   //vecs is the vector of all so far seen variants up to k length.
   var nextBase = [];
   //independent of existence of matches on level k, we retain all vectors which are covered by a span
   // we skip extending them below
   for (var u = 0; u < res.length; ++u) {
     if (isSpanVec(res[u], tokenIndex)) {
       nextBase.push(res[u]);
     }
   }
   var lenMatches = tokenMatches[tokenIndex].length;
   if (nextBase.length === 0 && lenMatches === 0) {
     // the word at index I cannot be understood
     //if (result.errors.length === 0) {
     result.errors.push(ERError.makeError_NO_KNOWN_WORD(tokenIndex, tokens));
     //}
   }
   for (var l = 0; l < lenMatches; ++l) { // for each variant present at index k
     //debuglog("vecs now" + JSON.stringify(vecs));
     var nvecs = []; //vecs.slice(); // copy the vec[i] base vector;
     //debuglog("vecs copied now" + JSON.stringify(nvecs));
     for (var u = 0; u < res.length; ++u) {
       if (!isSpanVec(res[u], tokenIndex)) {
         // for each so far constructed result (of length k) in res
         nvecs.push(res[u].slice()); // make a copy of each vector
         nvecs[nvecs.length - 1] = copyVecMembers(nvecs[nvecs.length - 1]);
         // debuglog("copied vecs["+ u+"]" + JSON.stringify(vecs[u]));
         nvecs[nvecs.length - 1].push(
           clone(tokenMatches[tokenIndex][l])); // push the lth variant
         // debuglog("now nvecs " + nvecs.length + " " + JSON.stringify(nvecs));
       }
     }
     //   debuglog(" at     " + k + ":" + l + " nextbase >" + JSON.stringify(nextBase))
     //   debuglog(" append " + k + ":" + l + " nvecs    >" + JSON.stringify(nvecs))
     nextBase = nextBase.concat(nvecs);
     //   debuglog("  result " + k + ":" + l + " nvecs    >" + JSON.stringify(nextBase))
   } //constru
   //  debuglog("now at " + k + ":" + l + " >" + JSON.stringify(nextBase))
   res = nextBase;
 }
 debuglogV(debuglogV.enabled ? ("APPENDING TO RES2#" + 0 + ":" + l + " >" + JSON.stringify(nextBase)) : '-');
 result.sentences = res;
 return result;
}

*/
// todo: bitindex
function makeAnyWord(token) {
    return { string: token,
        matchedString: token,
        category: 'any',
        rule: { category: 'any',
            type: 0,
            word: token,
            lowercaseword: token.toLowerCase(),
            matchedString: token,
            exactOnly: true,
            bitindex: 4096,
            bitSentenceAnd: 4095,
            wordType: 'A',
            _ranking: 0.9 },
        _ranking: 0.9
    };
}
exports.makeAnyWord = makeAnyWord;
function isSuccessorOperator(res, tokenIndex) {
    if (tokenIndex === 0) {
        return false;
    }
    if (res[res.length - 1].rule && res[res.length - 1].rule.wordType === 'O') {
        if (index_model_2.IFModel.aAnySuccessorOperatorNames.indexOf(res[res.length - 1].rule.matchedString) >= 0) {
            debuglog(() => ' isSuccessorOperator' + JSON.stringify(res[res.length - 1]));
            return true;
        }
    }
    return false;
}
exports.isSuccessorOperator = isSuccessorOperator;
/**
 * expand an array [[a1,a2], [b1,b2],[c]]
 * into all combinations
 *
 *  if a1 has a span of three, the variations of the lower layer are skipped
 *
 * with the special property
 */
function expandTokenMatchesToSentences2(tokens, tokenMatches) {
    var a = [];
    var wordMatches = [];
    debuglogV(debuglog.enabled ? JSON.stringify(tokenMatches) : '-');
    tokenMatches.forEach(function (aWordMatches, wordIndex) {
        wordMatches[wordIndex] = [];
        aWordMatches.forEach(function (oWordVariant, wordVariantIndex) {
            wordMatches[wordIndex][wordVariantIndex] = oWordVariant;
        });
    });
    debuglog(debuglog.enabled ? JSON.stringify(tokenMatches) : '-');
    var result = {
        errors: [],
        tokens: tokens,
        sentences: []
    };
    var nvecs = [];
    var res = [[]];
    // var nvecs = [];
    var rvec = [];
    for (var tokenIndex = 0; tokenIndex < tokenMatches.length; ++tokenIndex) { // wordg index k
        //vecs is the vector of all so far seen variants up to tokenIndex length.
        var nextBase = [];
        // independent of existence of matches on level k, we retain all vectors which are covered by a span
        // we skip extending them below
        for (var u = 0; u < res.length; ++u) {
            if (isSpanVec(res[u], tokenIndex)) {
                nextBase.push(res[u]);
            }
            else if (isSuccessorOperator(res[u], tokenIndex)) {
                res[u].push(makeAnyWord(tokens[tokenIndex]));
                nextBase.push(res[u]);
            }
        }
        // independent of existence of matches on level tokenIndex, we extend all vectors which
        // are a successor of a binary extending op ( like "starting with", "containing" with the next token)
        /*   for(var resIndex = 0; resIndex < res.length; ++resIndex) {
          if (isSuccessorOperator(res[resIndex], tokenIndex)) {
            res[resIndex].push(makeAnyWord(tokens[tokenIndex]));
            nextBase.push(res[resIndex]);
          }
        }
        */
        var lenMatches = tokenMatches[tokenIndex].length;
        if (nextBase.length === 0 && lenMatches === 0) {
            // the word at index I cannot be understood
            //if (result.errors.length === 0) {
            result.errors.push(ERError.makeError_NO_KNOWN_WORD(tokenIndex, tokens));
            //}
        }
        for (var l = 0; l < lenMatches; ++l) { // for each variant present at index k
            //debuglog("vecs now" + JSON.stringify(vecs));
            var nvecs = []; //vecs.slice(); // copy the vec[i] base vector;
            //debuglog("vecs copied now" + JSON.stringify(nvecs));
            for (var u = 0; u < res.length; ++u) {
                if (!isSpanVec(res[u], tokenIndex) && !isSuccessorOperator(res[u], tokenIndex)) {
                    // for each so far constructed result (of length k) in res
                    nvecs.push(res[u].slice()); // make a copy of each vector
                    nvecs[nvecs.length - 1] = copyVecMembers(nvecs[nvecs.length - 1]);
                    // debuglog("copied vecs["+ u+"]" + JSON.stringify(vecs[u]));
                    nvecs[nvecs.length - 1].push(clone(tokenMatches[tokenIndex][l])); // push the lth variant
                    // debuglog("now nvecs " + nvecs.length + " " + JSON.stringify(nvecs));
                }
            }
            //   debuglog(" at     " + k + ":" + l + " nextbase >" + JSON.stringify(nextBase))
            //   debuglog(" append " + k + ":" + l + " nvecs    >" + JSON.stringify(nvecs))
            nextBase = nextBase.concat(nvecs);
            //   debuglog("  result " + k + ":" + l + " nvecs    >" + JSON.stringify(nextBase))
        } //constru
        //  debuglog("now at " + k + ":" + l + " >" + JSON.stringify(nextBase))
        res = nextBase;
    }
    debuglogV(debuglogV.enabled ? ("APPENDING TO RES1#" + 0 + ":" + l + " >" + JSON.stringify(nextBase)) : '-');
    var lastBad = { indexWord: -1, indexSentence: -1 };
    // filter away inhomogeneous sentences w.r.t. a domain
    var sentencesPrior = res;
    res = res.filter((sentence, index) => {
        var full = 0xFFFFFFFF;
        //console.log(`sentence  ${index}  \n`)
        return sentence.every((word, index2) => {
            if (!word.rule)
                return true;
            full = (full & word.rule.bitSentenceAnd);
            if (full == 0 && index2 > lastBad.indexWord) {
                lastBad.indexSentence = index;
                lastBad.indexWord = index2;
            }
            //console.log(` word  ${index2} ${full} "${word.matchedString}" ${word.rule.bitSentenceAnd}  ${tokens[index2]} \n`);
            return full !== 0;
        });
    });
    if (res.length == 0 && result.errors.length == 0 && lastBad.indexWord >= 0 && lastBad.indexSentence >= 0) {
        debugger;
        result.errors.push(ERError.makeError_OFFENDING_WORD(sentencesPrior[lastBad.indexSentence][lastBad.indexWord].string, tokens, lastBad.indexWord));
    }
    result.sentences = res;
    return result;
}
exports.expandTokenMatchesToSentences2 = expandTokenMatchesToSentences2;
function processString(query, rules, words, operators) {
    words = words || {};
    operators = operators || {};
    //if(!process.env.ABOT_NO_TEST1) {
    return processString2(query, rules, words, operators);
}
exports.processString = processString;
/*
var tokenStruct = tokenizeString(query, rules, words);
evaluateRangeRulesToPosition(tokenStruct.tokens, tokenStruct.fusable,
  tokenStruct.categorizedWords);
if (debuglog.enabled) {
  debuglog("After matched " + JSON.stringify(tokenStruct.categorizedWords));
}
var aSentences = expandTokenMatchesToSentences(tokenStruct.tokens, tokenStruct.categorizedWords);
if (debuglog.enabled) {
  debuglog("after expand" + aSentences.sentences.map(function (oSentence) {
  return Sentence.rankingProduct(oSentence) + ":" + Sentence.dumpNice(oSentence); //JSON.stringify(oSentence);
  }).join("\n"));
}
aSentences.sentences = WordMatch.reinForce(aSentences.sentences);
if (debuglog.enabled) {
  debuglog("after reinforce" + aSentences.sentences.map(function (oSentence) {
    return Sentence.rankingProduct(oSentence) + ":" + JSON.stringify(oSentence);
  }).join("\n"));
}
return aSentences;
*/
function findCloseIdenticals(mp, word) {
    var res = [];
    for (var key in mp) {
        if (key == word.string) {
            res.push(mp[key]);
        }
        else if (CharSequence.CharSequence.isSameOrPluralOrVeryClose(key, word.string)) {
            res.push(mp[key]);
        }
    }
    return res;
}
exports.findCloseIdenticals = findCloseIdenticals;
/* Return true if the identical *source word* is interpreted
* (within the same domain and the same wordtype)
* as a differnent  (e.g. element numb is one interpreted as 'CAT' element name, once as CAT 'element number' in
*
* example
* [ 'element names=>element number/category/2 F16',         <<< (1)
*    'element number=>element number/category/2 F16',
*    'element weight=>atomic weight/category/2 F16',
*    'element name=>element name/category/2 F16',           <<< (2)
*    'with=>with/filler I256',
*    'element name=>element name/category/2 F16',           <<< (3)
*   'starting with=>starting with/operator/2 O256',
*    'ABC=>ABC/any A4096' ],
*
* same domain IUPAC elements)
*
*  (1) differs to (2),(3) although the base words are very similar element names, element name, element name respectively
*
* - exact match
* - stemming by removing/appending traling s
* - closeness
*
* @param sentence
*/
function isDistinctInterpretationForSame(sentence) {
    var mp = {};
    var res = sentence.every((word, index) => {
        var seens = findCloseIdenticals(mp, word);
        debuglog(" investigating seens for " + word.string + " " + JSON.stringify(seens, undefined, 2));
        for (var seen of seens) {
            //var seen = mp[word.string];
            /*if(!seen) {
              mp[word.string] = word;
              return true;
            }*/
            if (!seen.rule || !word.rule) {
                //return true;
            }
            else if (seen.rule.bitindex === word.rule.bitindex
                && seen.rule.matchedString !== word.rule.matchedString) {
                debuglog("skipping this" + JSON.stringify(sentence, undefined, 2));
                return false;
            }
        }
        if (!mp[word.string]) {
            mp[word.string] = word;
            return true;
        }
        return true;
    });
    return res;
}
exports.isDistinctInterpretationForSame = isDistinctInterpretationForSame;
function isSameCategoryAndHigherMatch(sentence, idxmap) {
    var idxmapother = {};
    var cnt = 0;
    var prodo = 1.0;
    var prod = 1.0;
    Object.keys(idxmap).forEach((idxkey) => {
        var wrd = idxmap[idxkey];
        var idx = parseInt(idxkey);
        if (sentence.length > idx) {
            var wrdo = sentence[idx];
            if (wrdo.string === wrd.string
                && wrdo.rule.bitindex === wrd.rule.bitindex
                && wrdo.rule.wordType === wrd.rule.wordType
                && wrdo.rule.category === wrd.rule.category) {
                ++cnt;
                prodo = prodo * wrdo._ranking;
                prod = prod * wrd._ranking;
            }
        }
    });
    if (cnt === Object.keys(idxmap).length && prodo > prod) {
        return true;
    }
    return false;
}
exports.isSameCategoryAndHigherMatch = isSameCategoryAndHigherMatch;
function get_ith_arg(onepos, oppos, sentence, index) {
    // 1 ->  0  -1;           1            2         -2
    // 2  -> 1   1;           2            3         -1
    var pos = onepos - 1;
    if (pos <= oppos)
        pos = -1;
    pos -= oppos;
    var idx = pos + index;
    return sentence[idx];
}
function isBadOperatorArgs(sentence, operators) {
    if (isNullOrEmptyDictionary(operators))
        return false;
    return !sentence.every((word, index) => {
        if ((word.rule && word.rule.wordType) != index_model_2.IFModel.WORDTYPE.OPERATOR)
            return true;
        var op = operators[word.rule.matchedString];
        if (!op)
            return true;
        var operatorpos = op.operatorpos || 0;
        if (!op.arity)
            return true;
        for (var i = 1; i <= op.arity; ++i) {
            var ith_arg = get_ith_arg(i, operatorpos, sentence, index);
            if (!ith_arg)
                return false;
            var argtype = op.argcategory[i - 1];
            var argtypex = argtype.map((x) => Word.WordType.fromCategoryString(x));
            if (argtypex.indexOf(ith_arg.rule.wordType) < 0) {
                debuglog(() => { return "discarding due to arg " + op.operator + " arg #" + i + " expected" + JSON.stringify(argtypex) + " was " + ith_arg.rule.wordType; });
                return false;
            }
        }
        return true;
    });
}
exports.isBadOperatorArgs = isBadOperatorArgs;
/* Return true if the identical *target word* is expressed by different source words
* (within the same domain and the same wordtype)
*
* this is problematic with aliases mapped onto the same target, (eg. where -> with, with -> where )
* so perhaps only for categories and facts?
*
* example <pre>
* [ 'element names=>element number/category/2 C8',         <<< (1a)
*    'element number=>element number/category/2 C8',       <<< (2)
*    'element weight=>atomic weight/category/2 C8',
*    'element name=>element number/category/2 C8',           <<< (1b)
*    'with=>with/filler I256',
*    'element name=>element number/category/2 C8',           <<< (1c)
*    'starting with=>starting with/operator/2 O256',
*    'ABC=>ABC/any A4096' ],
*
* same domain IUPAC elements)
*
*  (1abc) differs from (2),
*  and there is a much better interpretation around
* </pre>
* - exact match
* - stemming by removing/appending traling s
* - closeness
*
* @param sentence
*/
function isNonOptimalDistinctSourceForSame(sentence, sentences) {
    var mp = {};
    // calculate conflicts :    [taget_word -> ]
    var res = sentence.every((word) => {
        if (word.category === Word.Category.CAT_CATEGORY
            && (word.rule.wordType === index_model_2.IFModel.WORDTYPE.FACT
                || word.rule.wordType === index_model_2.IFModel.WORDTYPE.CATEGORY)) {
            if (!mp[word.rule.matchedString])
                mp[word.rule.matchedString] = {};
            if (!mp[word.rule.matchedString][word.rule.bitindex])
                mp[word.rule.matchedString][word.rule.bitindex] = [];
            var arr = mp[word.rule.matchedString][word.rule.bitindex];
            if (arr.length == 0) {
                arr.push(word);
            }
            if (!arr.every((presentword) => {
                return CharSequence.CharSequence.isSameOrPluralOrVeryClose(word.string, presentword.string);
            })) {
                arr.push(word);
            }
        }
        // retain only entries with more than one member in the list
        var mpduplicates = {};
        Object.keys(mp).forEach((key) => {
            var entry = mp[key];
            Object.keys(entry).forEach((keybitindex) => {
                if (entry[keybitindex].length > 1) {
                    if (!mpduplicates[key])
                        mpduplicates[key] = {};
                    mpduplicates[key][keybitindex] = entry[keybitindex];
                }
            });
        });
        return Object.keys(mpduplicates).every((key) => {
            return Object.keys(mpduplicates[key]).every((bi) => {
                var lst = mpduplicates[key][bi];
                var idxmap = {};
                /* ok, do some work ..  */
                /* for every duplicate we collect an index  idx -> word */
                for (var alst of lst) {
                    var idx = sentence.indexOf(alst);
                    if (idx < 0)
                        throw new Error("word must be found in sentence ");
                    idxmap[idx] = alst;
                }
                /* then we run through all the sentences identifying *identical source words pairs,
                   if we find a  a) distinct sentence with
                              b) same categories F16/F16
                          and c) *higher matches* for both , then we discard *this* sentence
                          */
                return sentences.every((othersentence) => {
                    if (othersentence === sentence)
                        return true;
                    if (isSameCategoryAndHigherMatch(othersentence, idxmap)) {
                        debuglog(" removing sentence with due to higher match " + Sentence.simplifyStringsWithBitIndex(sentence)
                            + " as " + Sentence.simplifyStringsWithBitIndex(othersentence) + " appears better ");
                        return false;
                    }
                    return true;
                });
            });
        });
    });
    debuglog(" here res " + !res + " " + Sentence.simplifyStringsWithBitIndex(sentence));
    return !res;
}
exports.isNonOptimalDistinctSourceForSame = isNonOptimalDistinctSourceForSame;
function filterNonSameInterpretations(aSentences) {
    var discardIndex = [];
    var res = Object.assign({}, aSentences);
    res.sentences = aSentences.sentences.filter((sentence, index) => {
        if (!isDistinctInterpretationForSame(sentence)) {
            discardIndex.push(index);
            return false;
        }
        return true;
    });
    if (discardIndex.length) {
        res.errors = aSentences.errors.filter((error, index) => {
            if (discardIndex.indexOf(index) >= 0) {
                return false;
            }
            return true;
        });
    }
    return res;
}
exports.filterNonSameInterpretations = filterNonSameInterpretations;
function isNullOrEmptyDictionary(obj) {
    return (obj === undefined) || (Object.keys(obj).length === 0);
}
function filterBadOperatorArgs(aSentences, operators) {
    if (isNullOrEmptyDictionary(operators))
        return aSentences;
    var discardIndex = [];
    var res = Object.assign({}, aSentences);
    res.sentences = aSentences.sentences.filter((sentence, index) => {
        if (isBadOperatorArgs(sentence, operators)) {
            discardIndex.push(index);
            return false;
        }
        return true;
    });
    if (discardIndex.length) {
        res.errors = aSentences.errors.filter((error, index) => {
            if (discardIndex.indexOf(index) >= 0) {
                return false;
            }
            return true;
        });
    }
    return res;
}
exports.filterBadOperatorArgs = filterBadOperatorArgs;
function filterReverseNonSameInterpretations(aSentences) {
    var discardIndex = [];
    var res = Object.assign({}, aSentences);
    res.sentences = aSentences.sentences.filter((sentence, index) => {
        if (isNonOptimalDistinctSourceForSame(sentence, aSentences.sentences)) {
            discardIndex.push(index);
            return false;
        }
        return true;
    });
    if (discardIndex.length) {
        res.errors = aSentences.errors.filter((error, index) => {
            if (discardIndex.indexOf(index) >= 0) {
                return false;
            }
            return true;
        });
    }
    return res;
}
exports.filterReverseNonSameInterpretations = filterReverseNonSameInterpretations;
function processString2(query, rules, words, operators) {
    words = words || {};
    var tokenStruct = tokenizeString(query, rules, words);
    debuglog(() => `tokenized:\n` + tokenStruct.categorizedWords.map(s => Sentence.simplifyStringsWithBitIndex(s).join("\n")).join("\n"));
    evaluateRangeRulesToPosition(tokenStruct.tokens, tokenStruct.fusable, tokenStruct.categorizedWords);
    debuglogV(() => "After matched " + JSON.stringify(tokenStruct.categorizedWords));
    var aSentences = expandTokenMatchesToSentences2(tokenStruct.tokens, tokenStruct.categorizedWords);
    debuglog(() => "after expand " + aSentences.sentences.map(function (oSentence) {
        return Sentence.rankingProduct(oSentence) + ":\n" + Sentence.dumpNiceBitIndexed(oSentence); //JSON.stringify(oSentence);
    }).join("\n"));
    aSentences = filterBadOperatorArgs(aSentences, operators);
    aSentences = filterNonSameInterpretations(aSentences);
    aSentences = filterReverseNonSameInterpretations(aSentences);
    aSentences.sentences = WordMatch.reinForce(aSentences.sentences);
    debuglogV(() => "after reinforce\n" + aSentences.sentences.map(function (oSentence) {
        return Sentence.rankingProduct(oSentence) + ":\n" + JSON.stringify(oSentence);
    }).join("\n"));
    debuglog(() => "after reinforce" + aSentences.sentences.map(function (oSentence) {
        return Sentence.rankingProduct(oSentence) + ":\n" + Sentence.dumpNiceBitIndexed(oSentence); //JSON.stringify(oSentence);
    }).join("\n"));
    return aSentences;
}
exports.processString2 = processString2;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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UUFBUSxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsNEJBQTRCO0lBQ3hILENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ2pCLFVBQVUsR0FBRyxxQkFBcUIsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUE7SUFDekQsVUFBVSxHQUFHLDRCQUE0QixDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBRXRELFVBQVUsR0FBRyxtQ0FBbUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUU3RCxVQUFVLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2pFLFNBQVMsQ0FBQyxHQUFFLEVBQUUsQ0FBQyxtQkFBbUIsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFVLFNBQVM7UUFDN0UsT0FBTyxRQUFRLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2hGLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ2pCLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFVLFNBQVM7UUFDN0UsT0FBTyxRQUFRLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEtBQUssR0FBRyxRQUFRLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyw0QkFBNEI7SUFDeEgsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDakIsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQztBQTNCRCx3Q0EyQkMiLCJmaWxlIjoibWF0Y2gvZXJiYXNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQG1vZHVsZSBqZnNlYi5lcmJhc2VcbiAqIEBmaWxlIGVyYmFzZVxuICogQGNvcHlyaWdodCAoYykgMjAxNiBHZXJkIEZvcnN0bWFublxuICpcbiAqIEJhc2ljIGRvbWFpbiBiYXNlZCBlbnRpdHkgcmVjb2duaXRpb25cbiAqXG4gKi9cblxuXG5pbXBvcnQgKiBhcyBXb3JkTWF0Y2ggZnJvbSAnLi9pbnB1dEZpbHRlcic7XG5pbXBvcnQgKiBhcyBDaGFyU2VxdWVuY2UgZnJvbSAnLi9jaGFyc2VxdWVuY2UnO1xuXG5pbXBvcnQgKiBhcyBkZWJ1ZyBmcm9tICdkZWJ1Z2YnO1xuXG5cblxudmFyIGRlYnVnbG9nID0gZGVidWcoJ2VyYmFzZScpO1xudmFyIGRlYnVnbG9nViA9IGRlYnVnKCdlclZiYXNlJyk7XG52YXIgcGVyZmxvZyA9IGRlYnVnKCdwZXJmJyk7XG5cbmltcG9ydCB7IEJyZWFrRG93biBhcyBicmVha2Rvd259ICBmcm9tICcuLi9tb2RlbC9pbmRleF9tb2RlbCc7XG5pbXBvcnQgKiBhcyBFUkVycm9yIGZyb20gJy4vZXJlcnJvcic7XG5cbmNvbnN0IEFueU9iamVjdCA9IDxhbnk+T2JqZWN0O1xuXG5leHBvcnQgZnVuY3Rpb24gbW9ja0RlYnVnKG8pIHtcbiAgZGVidWdsb2cgPSBvO1xuICBkZWJ1Z2xvZ1YgPSBvO1xuICBwZXJmbG9nID0gbztcbn1cblxuXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICdhYm90X3V0aWxzJztcblxuaW1wb3J0ICogYXMgSUZFckJhc2UgZnJvbSAnLi9pZmVyYmFzZSc7XG5pbXBvcnQgeyBJRk1vZGVsICBhcyBJTWF0Y2h9ICBmcm9tICcuLi9tb2RlbC9pbmRleF9tb2RlbCc7XG5pbXBvcnQgeyBJRk1vZGVsICBhcyBJRk1vZGVsfSAgZnJvbSAnLi4vbW9kZWwvaW5kZXhfbW9kZWwnO1xuXG5cblxuaW1wb3J0ICogYXMgU2VudGVuY2UgZnJvbSAnLi9zZW50ZW5jZSc7XG5cbmltcG9ydCAqIGFzIFdvcmQgZnJvbSAnLi93b3JkJztcblxuaW1wb3J0ICogYXMgQWxnb2wgZnJvbSAnLi9hbGdvbCc7XG5pbXBvcnQgeyBBc3NlcnRpb25FcnJvciB9IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQgeyBJT3BlcmF0b3IgfSBmcm9tICcuL2lmbWF0Y2gnO1xuXG5cbi8vaW1wb3J0ICogYXMgTWF0Y2ggZnJvbSAnLi9tYXRjaCc7XG5cblxuZXhwb3J0IGludGVyZmFjZSBJVG9rZW5pemVkU3RyaW5nIHtcbiAgdG9rZW5zOiBzdHJpbmdbXSxcbiAgY2F0ZWdvcml6ZWRXb3JkczogSU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZFtdW11cbiAgZnVzYWJsZTogYm9vbGVhbltdO1xufVxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuLyoqXG4gKiBHaXZlbiBhICBzdHJpbmcsIGJyZWFrIGl0IGRvd24gaW50byBjb21wb25lbnRzLFxuICogW1snQScsICdCJ10sIFsnQSBCJ11dXG4gKlxuICogdGhlbiBjYXRlZ29yaXplV29yZHNcbiAqIHJldHVybmluZ1xuICpcbiAqIFsgW1sgeyBjYXRlZ29yeTogJ3N5c3RlbUlkJywgd29yZCA6ICdBJ30sXG4gKiAgICAgIHsgY2F0ZWdvcnk6ICdvdGhlcnRoaW5nJywgd29yZCA6ICdBJ31cbiAqICAgIF0sXG4gKiAgICAvLyByZXN1bHQgb2YgQlxuICogICAgWyB7IGNhdGVnb3J5OiAnc3lzdGVtSWQnLCB3b3JkIDogJ0InfSxcbiAqICAgICAgeyBjYXRlZ29yeTogJ290aGVydGhpbmcnLCB3b3JkIDogJ0EnfVxuICogICAgICB7IGNhdGVnb3J5OiAnYW5vdGhlcnRyeXAnLCB3b3JkIDogJ0InfVxuICogICAgXVxuICogICBdLFxuICogXV1dXG4gKlxuICpcbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b2tlbml6ZVN0cmluZyhzU3RyaW5nOiBzdHJpbmcsIHJ1bGVzOiBJTWF0Y2guU3BsaXRSdWxlcyxcbiAgd29yZHM6IHsgW2tleTogc3RyaW5nXTogQXJyYXk8SU1hdGNoLklDYXRlZ29yaXplZFN0cmluZz4gfSlcbiAgOiBJVG9rZW5pemVkU3RyaW5nIHtcbiAgdmFyIGNudCA9IDA7XG4gIHZhciBmYWMgPSAxO1xuICB2YXIgdG9rZW5zID0gYnJlYWtkb3duLnRva2VuaXplU3RyaW5nKHNTdHJpbmcpO1xuICBpZiAoZGVidWdsb2cuZW5hYmxlZCkge1xuICAgIGRlYnVnbG9nKFwiaGVyZSBicmVha2Rvd25cIiArIEpTT04uc3RyaW5naWZ5KHRva2VucykpO1xuICB9XG4gIC8vY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodSkpO1xuICB3b3JkcyA9IHdvcmRzIHx8IHt9O1xuICBwZXJmbG9nKCd0aGlzIG1hbnkga25vd24gd29yZHM6ICcgKyBPYmplY3Qua2V5cyh3b3JkcykubGVuZ3RoKTtcbiAgdmFyIHJlcyA9IFtdIGFzIElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWRbXVtdO1xuICB2YXIgY250UmVjID0ge307XG4gIHZhciBjYXRlZ29yaXplZFNlbnRlbmNlID0gW10gYXMgSU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZFtdW107XG4gIHZhciBoYXNSZWNvbWJpbmVkID0gZmFsc2U7XG4gIHRva2Vucy50b2tlbnMuZm9yRWFjaChmdW5jdGlvbiAodG9rZW4sIGluZGV4KSB7XG4gICAgdmFyIHNlZW5JdCA9IFdvcmRNYXRjaC5jYXRlZ29yaXplQVdvcmRXaXRoT2Zmc2V0cyh0b2tlbiwgcnVsZXMsIHNTdHJpbmcsIHdvcmRzLCBjbnRSZWMpO1xuICAgIC8qIGNhbm5vdCBoYXZlIHRoaXMsIG9yIG5lZWQgdG8gYWRkIGFsbCBmcmFnbWVudCB3b3JkcyBcIlVJMiBJbnRlZ3JhdGlvblwiICBpZihzZWVuSXQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgKi9cbiAgICBoYXNSZWNvbWJpbmVkID0gaGFzUmVjb21iaW5lZCB8fCAhc2Vlbkl0LmV2ZXJ5KHJlcyA9PiAhcmVzLnJ1bGUucmFuZ2UpO1xuICAgIGRlYnVnbG9nVihkZWJ1Z2xvZ1YuZW5hYmxlZCA/IChgIGNhdGVnb3JpemVkICR7dG9rZW59LyR7aW5kZXh9IHRvIGAgKyBKU09OLnN0cmluZ2lmeShzZWVuSXQpKVxuICAgICA6IFwiLVwiKTtcbiAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKGAgY2F0ZWdvcml6ZWQgJHt0b2tlbn0vJHtpbmRleH0gdG8gYCArXG4gICAgc2Vlbkl0Lm1hcCggKGl0LGlkeCkgPT4geyByZXR1cm4gYCAke2lkeH0gICR7aXQucnVsZS5tYXRjaGVkU3RyaW5nfS8ke2l0LnJ1bGUuY2F0ZWdvcnl9ICAke2l0LnJ1bGUud29yZFR5cGV9JHtpdC5ydWxlLmJpdGluZGV4fSBgIH0pLmpvaW4oXCJcXG5cIikpXG4gICAgIDogXCItXCIpO1xuICAgIGNhdGVnb3JpemVkU2VudGVuY2VbaW5kZXhdID0gc2Vlbkl0O1xuICAgIGNudCA9IGNudCArIHNlZW5JdC5sZW5ndGg7XG4gICAgZmFjID0gZmFjICogc2Vlbkl0Lmxlbmd0aDtcbiAgfSk7XG4gIC8vIGhhdmUgc2VlbiB0aGUgcGxhaW4gY2F0ZWdvcml6YXRpb24sXG4gIGRlYnVnbG9nKFwiIHNlbnRlbmNlcyBcIiArIHRva2Vucy50b2tlbnMubGVuZ3RoICsgXCIgbWF0Y2hlcyBcIiArIGNudCArIFwiIGZhYzogXCIgKyBmYWMpO1xuICBpZiAoZGVidWdsb2cuZW5hYmxlZCAmJiB0b2tlbnMudG9rZW5zLmxlbmd0aCkge1xuICAgIGRlYnVnbG9nKFwiZmlyc3QgbWF0Y2ggXCIgKyBKU09OLnN0cmluZ2lmeSh0b2tlbnMsIHVuZGVmaW5lZCwgMikpO1xuICB9XG4gIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyBgIHByaW9yIFJhbmdlUnVsZSAke0pTT04uc3RyaW5naWZ5KGNhdGVnb3JpemVkU2VudGVuY2UpfSBgIDogJy0nKTtcbiAgaWYgKGhhc1JlY29tYmluZWQpIHtcbiAgICBldmFsdWF0ZVJhbmdlUnVsZXNUb1Bvc2l0aW9uKHRva2Vucy50b2tlbnMsIHRva2Vucy5mdXNhYmxlLCBjYXRlZ29yaXplZFNlbnRlbmNlKTtcbiAgfVxuICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gYCBhZnRlciBSYW5nZVJ1bGUgJHtKU09OLnN0cmluZ2lmeShjYXRlZ29yaXplZFNlbnRlbmNlKX0gYCA6ICctJyk7XG4gIHBlcmZsb2coXCIgc2VudGVuY2VzIFwiICsgdG9rZW5zLnRva2Vucy5sZW5ndGggKyBcIiAvIFwiICsgcmVzLmxlbmd0aCArIFwiIG1hdGNoZXMgXCIgKyBjbnQgKyBcIiBmYWM6IFwiICsgZmFjICsgXCIgcmVjIDogXCIgKyBKU09OLnN0cmluZ2lmeShjbnRSZWMsIHVuZGVmaW5lZCwgMikpO1xuICByZXR1cm4ge1xuICAgIGZ1c2FibGU6IHRva2Vucy5mdXNhYmxlLFxuICAgIHRva2VuczogdG9rZW5zLnRva2VucyxcbiAgICBjYXRlZ29yaXplZFdvcmRzOiBjYXRlZ29yaXplZFNlbnRlbmNlXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU2FtZVJlcyhwcmVzZW50OiBJTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkLCByZXMgOiBJTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkKSAgOiBudW1iZXIge1xuICBpZighKChwcmVzZW50LnJ1bGUubWF0Y2hlZFN0cmluZyA9PT0gcmVzLnJ1bGUubWF0Y2hlZFN0cmluZylcbiAgICAmJiAocHJlc2VudC5ydWxlLmNhdGVnb3J5ID09PSByZXMucnVsZS5jYXRlZ29yeSlcbiAgICAmJiAocHJlc2VudC5zcGFuID09PSByZXMuc3BhbilcbiAgJiYgKHByZXNlbnQucnVsZS5iaXRpbmRleCA9PT0gcmVzLnJ1bGUuYml0aW5kZXgpKSkge1xuICAgICAgcmV0dXJuIDA7XG4gIH1cbiAgaWYocHJlc2VudC5fcmFua2luZyA8IHJlcy5fcmFua2luZykge1xuICAgIHJldHVybiAtMTtcbiAgfVxuICByZXR1cm4gKzE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZUlnbm9yZU9yQXBwZW5kKHJlc3VsdCA6IElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWRbXSwgcmVzIDogSU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZCkge1xuICB2YXIgaW5zZXJ0aW5kZXggPSAtMTtcbiAgdmFyIGZvdW5kTm90aGluZyA9IHJlc3VsdC5ldmVyeSggKHByZXNlbnQsaW5kZXgpID0+IHtcbiAgICB2YXIgciA9IGlzU2FtZVJlcyhwcmVzZW50LHJlcyk7XG4gICAgaWYgKHIgPCAwKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKFwib3ZlcndyaXRpbmcgd29yc2UgXFxuXCIgKyBKU09OLnN0cmluZ2lmeShyZXMpICsgJ1xcbicgKyBKU09OLnN0cmluZ2lmeShwcmVzZW50KSsgJ1xcbicpO1xuICAgICAgcmVzdWx0W2luZGV4XSA9IHJlcztcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYociA+IDApIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ3NraXBwaW5nIHByZXNlbnQnKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH0pO1xuICBpZihmb3VuZE5vdGhpbmcpIHtcbiAgICAvL2RlYnVsb2coJ3B1c2hpbmcnKTtcbiAgICByZXN1bHQucHVzaChyZXMpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBldmFsdWF0ZVJhbmdlUnVsZXNUb1Bvc2l0aW9uKHRva2Vuczogc3RyaW5nW10sIGZ1c2FibGU6IGJvb2xlYW5bXSwgY2F0ZWdvcml6ZWRXb3JkczogSU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZFtdW10pIHtcbiAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/IChcImV2YWx1YXRlUmFuZ2VSdWxlc1RvUG9zaXRpb24uLi4gXCIgKyBKU09OLnN0cmluZ2lmeShjYXRlZ29yaXplZFdvcmRzKSkgOiAnLScpO1xuICBjYXRlZ29yaXplZFdvcmRzLmZvckVhY2goZnVuY3Rpb24gKHdvcmRsaXN0LCBpbmRleCkge1xuICAgIHdvcmRsaXN0LmZvckVhY2goZnVuY3Rpb24gKHdvcmQpIHtcbiAgICAgIGlmICh3b3JkLnJ1bGUucmFuZ2UpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhgIGdvdCB0YXJnZXRpbmRleCBmb3IgUmFuZ2VSdWxlcyBldmFsdWF0aW9uIDogJHt0YXJnZXRJbmRleH0gJHtpbmRleH0gJHtmdXNhYmxlLmpvaW4oXCIgXCIpfWApO1xuICAgICAgICB2YXIgdGFyZ2V0SW5kZXggPSBicmVha2Rvd24uaXNDb21iaW5hYmxlUmFuZ2VSZXR1cm5JbmRleCh3b3JkLnJ1bGUucmFuZ2UsIGZ1c2FibGUsIGluZGV4KTtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhgIGdvdCB0YXJnZXRpbmRleCBmb3IgUmFuZ2VSdWxlcyBldmFsdWF0aW9uIDogJHt0YXJnZXRJbmRleH1gKTtcbiAgICAgICAgaWYgKHRhcmdldEluZGV4ID49IDApIHtcbiAgICAgICAgICB2YXIgY29tYmluZWRXb3JkID0gYnJlYWtkb3duLmNvbWJpbmVUb2tlbnMod29yZC5ydWxlLnJhbmdlLCBpbmRleCwgdG9rZW5zKTtcbiAgICAgICAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKGAgdGVzdCBcIiR7Y29tYmluZWRXb3JkfVwiIGFnYWluc3QgXCIke3dvcmQucnVsZS5yYW5nZS5ydWxlLmxvd2VyY2FzZXdvcmR9XCIgJHtKU09OLnN0cmluZ2lmeSh3b3JkLnJ1bGUucmFuZ2UucnVsZSl9YCkgOiAnLScpO1xuICAgICAgICAgIHZhciByZXMgPSBXb3JkTWF0Y2guY2F0ZWdvcml6ZVdvcmRXaXRoT2Zmc2V0V2l0aFJhbmtDdXRvZmZTaW5nbGUoY29tYmluZWRXb3JkLCB3b3JkLnJ1bGUucmFuZ2UucnVsZSk7XG4gICAgICAgICAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/IChcIiBnb3QgcmVzIDogXCIgKyBKU09OLnN0cmluZ2lmeShyZXMpKSA6ICctJyk7XG4gICAgICAgICAgaWYgKHJlcykge1xuICAgICAgICAgICAgcmVzLnNwYW4gPSB3b3JkLnJ1bGUucmFuZ2UuaGlnaCAtIHdvcmQucnVsZS5yYW5nZS5sb3cgKyAxO1xuICAgICAgICAgICAgY2F0ZWdvcml6ZWRXb3Jkc1t0YXJnZXRJbmRleF0gPSBjYXRlZ29yaXplZFdvcmRzW3RhcmdldEluZGV4XS5zbGljZSgwKTsgLy8gYXZvaWQgaW52YWxpZGF0aW9uIG9mIHNlZW5pdFxuICAgICAgICAgICAgZGVidWdsb2coYHB1c2hlZCBzdGggYXQgJHt0YXJnZXRJbmRleH1gKTtcbiAgICAgICAgICAgIG1lcmdlSWdub3JlT3JBcHBlbmQoY2F0ZWdvcml6ZWRXb3Jkc1t0YXJnZXRJbmRleF0scmVzKTtcbiAgIC8vICAgICAgICAgY2F0ZWdvcml6ZWRXb3Jkc1t0YXJnZXRJbmRleF0ucHVzaChyZXMpOyAvLyBjaGVjayB0aGF0IHRoaXMgZG9lcyBub3QgaW52YWxpZGF0ZSBzZWVuaXQhXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuICAvLyBmaWx0ZXIgYWxsIHJhbmdlIHJ1bGVzICFcbiAgY2F0ZWdvcml6ZWRXb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uICh3b3JkbGlzdCwgaW5kZXgpIHtcbiAgICBjYXRlZ29yaXplZFdvcmRzW2luZGV4XSA9IHdvcmRsaXN0LmZpbHRlcih3b3JkID0+ICF3b3JkLnJ1bGUucmFuZ2UpO1xuICB9KTtcbn1cblxuXG5cblxuY29uc3QgY2xvbmUgPSB1dGlscy5jbG9uZURlZXA7XG5cblxuXG5cbmZ1bmN0aW9uIGNvcHlWZWNNZW1iZXJzKHUpIHtcbiAgdmFyIGkgPSAwO1xuICBmb3IgKGkgPSAwOyBpIDwgdS5sZW5ndGg7ICsraSkge1xuICAgIHVbaV0gPSBjbG9uZSh1W2ldKTtcbiAgfVxuICByZXR1cm4gdTtcbn1cblxuXG4vLyB3ZSBjYW4gcmVwbGljYXRlIHRoZSB0YWlsIG9yIHRoZSBoZWFkLFxuLy8gd2UgcmVwbGljYXRlIHRoZSB0YWlsIGFzIGl0IGlzIHNtYWxsZXIuXG4vLyBbYSxiLGMgXVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTcGFuVmVjKHZlYzogQXJyYXk8YW55PiwgaW5kZXg6IG51bWJlcikge1xuICB2YXIgZWZmZWN0aXZlbGVuID0gdmVjLnJlZHVjZSgocHJldiwgbWVtKSA9PiBwcmV2ICs9IG1lbS5zcGFuID8gbWVtLnNwYW4gOiAxLCAwKTtcbiAgcmV0dXJuIGVmZmVjdGl2ZWxlbiA+IGluZGV4O1xufVxuXG4vKipcbiAqIGV4cGFuZCBhbiBhcnJheSBbW2ExLGEyXSwgW2IxLGIyXSxbY11dXG4gKiBpbnRvIGFsbCBjb21iaW5hdGlvbnNcbiAqXG4gKiAgaWYgYTEgaGFzIGEgc3BhbiBvZiB0aHJlZSwgdGhlIHZhcmlhdGlvbnMgb2YgdGhlIGxvd2VyIGxheWVyIGFyZSBza2lwcGVkXG4gKlxuICogd2l0aCB0aGUgc3BlY2lhbCBwcm9wZXJ0eVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXhwYW5kVG9rZW5NYXRjaGVzVG9TZW50ZW5jZXModG9rZW5zOiBzdHJpbmdbXSwgdG9rZW5NYXRjaGVzOiBBcnJheTxBcnJheTxhbnk+Pik6IElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzIHtcbiAgcmV0dXJuIGV4cGFuZFRva2VuTWF0Y2hlc1RvU2VudGVuY2VzMiggdG9rZW5zLCB0b2tlbk1hdGNoZXMpO1xufVxuIC8qXG5leHBvcnQgZnVuY3Rpb24gZXhwYW5kVG9rZW5NYXRjaGVzVG9TZW50ZW5jZXModG9rZW5zOiBzdHJpbmdbXSwgdG9rZW5NYXRjaGVzOiBBcnJheTxBcnJheTxhbnk+Pik6IElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzIHtcbiAgdmFyIGEgPSBbXTtcbiAgdmFyIHdvcmRNYXRjaGVzID0gW107XG4gIGRlYnVnbG9nVihkZWJ1Z2xvZy5lbmFibGVkID8gSlNPTi5zdHJpbmdpZnkodG9rZW5NYXRjaGVzKSA6ICctJyk7XG4gIHRva2VuTWF0Y2hlcy5mb3JFYWNoKGZ1bmN0aW9uIChhV29yZE1hdGNoZXMsIHdvcmRJbmRleDogbnVtYmVyKSB7XG4gICAgd29yZE1hdGNoZXNbd29yZEluZGV4XSA9IFtdO1xuICAgIGFXb3JkTWF0Y2hlcy5mb3JFYWNoKGZ1bmN0aW9uIChvV29yZFZhcmlhbnQsIHdvcmRWYXJpYW50SW5kZXg6IG51bWJlcikge1xuICAgICAgd29yZE1hdGNoZXNbd29yZEluZGV4XVt3b3JkVmFyaWFudEluZGV4XSA9IG9Xb3JkVmFyaWFudDtcbiAgICB9KTtcbiAgfSk7XG4gIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyBKU09OLnN0cmluZ2lmeSh0b2tlbk1hdGNoZXMpIDogJy0nKTtcbiAgdmFyIHJlc3VsdCA9IHtcbiAgICBlcnJvcnM6IFtdLFxuICAgIHRva2VuczogdG9rZW5zLFxuICAgIHNlbnRlbmNlczogW11cbiAgfSBhcyBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcztcbiAgdmFyIG52ZWNzID0gW107XG4gIHZhciByZXMgPSBbW11dO1xuICAvLyB2YXIgbnZlY3MgPSBbXTtcbiAgdmFyIHJ2ZWMgPSBbXTtcbiAgZm9yICh2YXIgdG9rZW5JbmRleCA9IDA7IHRva2VuSW5kZXggPCB0b2tlbk1hdGNoZXMubGVuZ3RoOyArK3Rva2VuSW5kZXgpIHsgLy8gd29yZGcgaW5kZXgga1xuICAgIC8vdmVjcyBpcyB0aGUgdmVjdG9yIG9mIGFsbCBzbyBmYXIgc2VlbiB2YXJpYW50cyB1cCB0byBrIGxlbmd0aC5cbiAgICB2YXIgbmV4dEJhc2UgPSBbXTtcbiAgICAvL2luZGVwZW5kZW50IG9mIGV4aXN0ZW5jZSBvZiBtYXRjaGVzIG9uIGxldmVsIGssIHdlIHJldGFpbiBhbGwgdmVjdG9ycyB3aGljaCBhcmUgY292ZXJlZCBieSBhIHNwYW5cbiAgICAvLyB3ZSBza2lwIGV4dGVuZGluZyB0aGVtIGJlbG93XG4gICAgZm9yICh2YXIgdSA9IDA7IHUgPCByZXMubGVuZ3RoOyArK3UpIHtcbiAgICAgIGlmIChpc1NwYW5WZWMocmVzW3VdLCB0b2tlbkluZGV4KSkge1xuICAgICAgICBuZXh0QmFzZS5wdXNoKHJlc1t1XSk7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBsZW5NYXRjaGVzID0gdG9rZW5NYXRjaGVzW3Rva2VuSW5kZXhdLmxlbmd0aDtcbiAgICBpZiAobmV4dEJhc2UubGVuZ3RoID09PSAwICYmIGxlbk1hdGNoZXMgPT09IDApIHtcbiAgICAgIC8vIHRoZSB3b3JkIGF0IGluZGV4IEkgY2Fubm90IGJlIHVuZGVyc3Rvb2RcbiAgICAgIC8vaWYgKHJlc3VsdC5lcnJvcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXN1bHQuZXJyb3JzLnB1c2goRVJFcnJvci5tYWtlRXJyb3JfTk9fS05PV05fV09SRCh0b2tlbkluZGV4LCB0b2tlbnMpKTtcbiAgICAgIC8vfVxuICAgIH1cbiAgICBmb3IgKHZhciBsID0gMDsgbCA8IGxlbk1hdGNoZXM7ICsrbCkgeyAvLyBmb3IgZWFjaCB2YXJpYW50IHByZXNlbnQgYXQgaW5kZXgga1xuICAgICAgLy9kZWJ1Z2xvZyhcInZlY3Mgbm93XCIgKyBKU09OLnN0cmluZ2lmeSh2ZWNzKSk7XG4gICAgICB2YXIgbnZlY3MgPSBbXTsgLy92ZWNzLnNsaWNlKCk7IC8vIGNvcHkgdGhlIHZlY1tpXSBiYXNlIHZlY3RvcjtcbiAgICAgIC8vZGVidWdsb2coXCJ2ZWNzIGNvcGllZCBub3dcIiArIEpTT04uc3RyaW5naWZ5KG52ZWNzKSk7XG4gICAgICBmb3IgKHZhciB1ID0gMDsgdSA8IHJlcy5sZW5ndGg7ICsrdSkge1xuICAgICAgICBpZiAoIWlzU3BhblZlYyhyZXNbdV0sIHRva2VuSW5kZXgpKSB7XG4gICAgICAgICAgLy8gZm9yIGVhY2ggc28gZmFyIGNvbnN0cnVjdGVkIHJlc3VsdCAob2YgbGVuZ3RoIGspIGluIHJlc1xuICAgICAgICAgIG52ZWNzLnB1c2gocmVzW3VdLnNsaWNlKCkpOyAvLyBtYWtlIGEgY29weSBvZiBlYWNoIHZlY3RvclxuICAgICAgICAgIG52ZWNzW252ZWNzLmxlbmd0aCAtIDFdID0gY29weVZlY01lbWJlcnMobnZlY3NbbnZlY3MubGVuZ3RoIC0gMV0pO1xuICAgICAgICAgIC8vIGRlYnVnbG9nKFwiY29waWVkIHZlY3NbXCIrIHUrXCJdXCIgKyBKU09OLnN0cmluZ2lmeSh2ZWNzW3VdKSk7XG4gICAgICAgICAgbnZlY3NbbnZlY3MubGVuZ3RoIC0gMV0ucHVzaChcbiAgICAgICAgICAgIGNsb25lKHRva2VuTWF0Y2hlc1t0b2tlbkluZGV4XVtsXSkpOyAvLyBwdXNoIHRoZSBsdGggdmFyaWFudFxuICAgICAgICAgIC8vIGRlYnVnbG9nKFwibm93IG52ZWNzIFwiICsgbnZlY3MubGVuZ3RoICsgXCIgXCIgKyBKU09OLnN0cmluZ2lmeShudmVjcykpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyAgIGRlYnVnbG9nKFwiIGF0ICAgICBcIiArIGsgKyBcIjpcIiArIGwgKyBcIiBuZXh0YmFzZSA+XCIgKyBKU09OLnN0cmluZ2lmeShuZXh0QmFzZSkpXG4gICAgICAvLyAgIGRlYnVnbG9nKFwiIGFwcGVuZCBcIiArIGsgKyBcIjpcIiArIGwgKyBcIiBudmVjcyAgICA+XCIgKyBKU09OLnN0cmluZ2lmeShudmVjcykpXG4gICAgICBuZXh0QmFzZSA9IG5leHRCYXNlLmNvbmNhdChudmVjcyk7XG4gICAgICAvLyAgIGRlYnVnbG9nKFwiICByZXN1bHQgXCIgKyBrICsgXCI6XCIgKyBsICsgXCIgbnZlY3MgICAgPlwiICsgSlNPTi5zdHJpbmdpZnkobmV4dEJhc2UpKVxuICAgIH0gLy9jb25zdHJ1XG4gICAgLy8gIGRlYnVnbG9nKFwibm93IGF0IFwiICsgayArIFwiOlwiICsgbCArIFwiID5cIiArIEpTT04uc3RyaW5naWZ5KG5leHRCYXNlKSlcbiAgICByZXMgPSBuZXh0QmFzZTtcbiAgfVxuICBkZWJ1Z2xvZ1YoZGVidWdsb2dWLmVuYWJsZWQgPyAoXCJBUFBFTkRJTkcgVE8gUkVTMiNcIiArIDAgKyBcIjpcIiArIGwgKyBcIiA+XCIgKyBKU09OLnN0cmluZ2lmeShuZXh0QmFzZSkpIDogJy0nKTtcbiAgcmVzdWx0LnNlbnRlbmNlcyA9IHJlcztcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuKi9cblxuLy8gdG9kbzogYml0aW5kZXhcbmV4cG9ydCBmdW5jdGlvbiBtYWtlQW55V29yZCh0b2tlbiA6IHN0cmluZykge1xuICByZXR1cm4geyBzdHJpbmc6IHRva2VuLFxuICAgIG1hdGNoZWRTdHJpbmc6IHRva2VuLFxuICAgIGNhdGVnb3J5OiAnYW55JyxcbiAgICBydWxlOlxuICAgICB7IGNhdGVnb3J5OiAnYW55JyxcbiAgICAgICB0eXBlOiAwLFxuICAgICAgIHdvcmQ6IHRva2VuLFxuICAgICAgIGxvd2VyY2FzZXdvcmQ6IHRva2VuLnRvTG93ZXJDYXNlKCksXG4gICAgICAgbWF0Y2hlZFN0cmluZzogdG9rZW4sXG4gICAgICAgZXhhY3RPbmx5OiB0cnVlLFxuICAgICAgIGJpdGluZGV4OiA0MDk2LFxuICAgICAgIGJpdFNlbnRlbmNlQW5kOiA0MDk1LFxuICAgICAgIHdvcmRUeXBlOiAnQScsIC8vIElNYXRjaC5XT1JEVFlQRS5BTlksXG4gICAgICAgX3Jhbmtpbmc6IDAuOSB9LFxuICAgIF9yYW5raW5nOiAwLjlcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU3VjY2Vzc29yT3BlcmF0b3IocmVzIDogYW55LCB0b2tlbkluZGV4IDogbnVtYmVyKSA6IGJvb2xlYW4ge1xuICBpZih0b2tlbkluZGV4ID09PSAwKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmKHJlc1tyZXMubGVuZ3RoLTFdLnJ1bGUgJiYgcmVzW3Jlcy5sZW5ndGgtMV0ucnVsZS53b3JkVHlwZSA9PT0gJ08nKSB7XG4gICAgaWYgKCBJTWF0Y2guYUFueVN1Y2Nlc3Nvck9wZXJhdG9yTmFtZXMuaW5kZXhPZihyZXNbcmVzLmxlbmd0aC0xXS5ydWxlLm1hdGNoZWRTdHJpbmcpID49IDApXG4gICAge1xuICAgICAgZGVidWdsb2coKCk9PicgaXNTdWNjZXNzb3JPcGVyYXRvcicgKyBKU09OLnN0cmluZ2lmeSggcmVzW3Jlcy5sZW5ndGgtMV0gKSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuLyoqXG4gKiBleHBhbmQgYW4gYXJyYXkgW1thMSxhMl0sIFtiMSxiMl0sW2NdXVxuICogaW50byBhbGwgY29tYmluYXRpb25zXG4gKlxuICogIGlmIGExIGhhcyBhIHNwYW4gb2YgdGhyZWUsIHRoZSB2YXJpYXRpb25zIG9mIHRoZSBsb3dlciBsYXllciBhcmUgc2tpcHBlZFxuICpcbiAqIHdpdGggdGhlIHNwZWNpYWwgcHJvcGVydHlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4cGFuZFRva2VuTWF0Y2hlc1RvU2VudGVuY2VzMih0b2tlbnM6IHN0cmluZ1tdLCB0b2tlbk1hdGNoZXM6IEFycmF5PEFycmF5PGFueT4+KTogSU1hdGNoLklQcm9jZXNzZWRTZW50ZW5jZXMge1xuICB2YXIgYSA9IFtdO1xuICB2YXIgd29yZE1hdGNoZXMgPSBbXTtcbiAgZGVidWdsb2dWKGRlYnVnbG9nLmVuYWJsZWQgPyBKU09OLnN0cmluZ2lmeSh0b2tlbk1hdGNoZXMpIDogJy0nKTtcbiAgdG9rZW5NYXRjaGVzLmZvckVhY2goZnVuY3Rpb24gKGFXb3JkTWF0Y2hlcywgd29yZEluZGV4OiBudW1iZXIpIHtcbiAgICB3b3JkTWF0Y2hlc1t3b3JkSW5kZXhdID0gW107XG4gICAgYVdvcmRNYXRjaGVzLmZvckVhY2goZnVuY3Rpb24gKG9Xb3JkVmFyaWFudCwgd29yZFZhcmlhbnRJbmRleDogbnVtYmVyKSB7XG4gICAgICB3b3JkTWF0Y2hlc1t3b3JkSW5kZXhdW3dvcmRWYXJpYW50SW5kZXhdID0gb1dvcmRWYXJpYW50O1xuICAgIH0pO1xuICB9KTtcbiAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/IEpTT04uc3RyaW5naWZ5KHRva2VuTWF0Y2hlcykgOiAnLScpO1xuICB2YXIgcmVzdWx0ID0ge1xuICAgIGVycm9yczogW10sXG4gICAgdG9rZW5zOiB0b2tlbnMsXG4gICAgc2VudGVuY2VzOiBbXVxuICB9IGFzIElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzO1xuICB2YXIgbnZlY3MgPSBbXTtcbiAgdmFyIHJlcyA9IFtbXV07XG4gIC8vIHZhciBudmVjcyA9IFtdO1xuICB2YXIgcnZlYyA9IFtdO1xuICBmb3IgKHZhciB0b2tlbkluZGV4ID0gMDsgdG9rZW5JbmRleCA8IHRva2VuTWF0Y2hlcy5sZW5ndGg7ICsrdG9rZW5JbmRleCkgeyAvLyB3b3JkZyBpbmRleCBrXG4gICAgLy92ZWNzIGlzIHRoZSB2ZWN0b3Igb2YgYWxsIHNvIGZhciBzZWVuIHZhcmlhbnRzIHVwIHRvIHRva2VuSW5kZXggbGVuZ3RoLlxuICAgIHZhciBuZXh0QmFzZSA9IFtdO1xuICAgIC8vIGluZGVwZW5kZW50IG9mIGV4aXN0ZW5jZSBvZiBtYXRjaGVzIG9uIGxldmVsIGssIHdlIHJldGFpbiBhbGwgdmVjdG9ycyB3aGljaCBhcmUgY292ZXJlZCBieSBhIHNwYW5cbiAgICAvLyB3ZSBza2lwIGV4dGVuZGluZyB0aGVtIGJlbG93XG4gICAgZm9yICh2YXIgdSA9IDA7IHUgPCByZXMubGVuZ3RoOyArK3UpIHtcbiAgICAgIGlmIChpc1NwYW5WZWMocmVzW3VdLCB0b2tlbkluZGV4KSkge1xuICAgICAgICBuZXh0QmFzZS5wdXNoKHJlc1t1XSk7XG4gICAgICB9IGVsc2UgaWYoIGlzU3VjY2Vzc29yT3BlcmF0b3IocmVzW3VdLHRva2VuSW5kZXgpKSB7XG4gICAgICAgIHJlc1t1XS5wdXNoKG1ha2VBbnlXb3JkKHRva2Vuc1t0b2tlbkluZGV4XSkpO1xuICAgICAgICBuZXh0QmFzZS5wdXNoKHJlc1t1XSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIGluZGVwZW5kZW50IG9mIGV4aXN0ZW5jZSBvZiBtYXRjaGVzIG9uIGxldmVsIHRva2VuSW5kZXgsIHdlIGV4dGVuZCBhbGwgdmVjdG9ycyB3aGljaFxuICAgIC8vIGFyZSBhIHN1Y2Nlc3NvciBvZiBhIGJpbmFyeSBleHRlbmRpbmcgb3AgKCBsaWtlIFwic3RhcnRpbmcgd2l0aFwiLCBcImNvbnRhaW5pbmdcIiB3aXRoIHRoZSBuZXh0IHRva2VuKVxuICAgIC8qICAgZm9yKHZhciByZXNJbmRleCA9IDA7IHJlc0luZGV4IDwgcmVzLmxlbmd0aDsgKytyZXNJbmRleCkge1xuICAgICAgaWYgKGlzU3VjY2Vzc29yT3BlcmF0b3IocmVzW3Jlc0luZGV4XSwgdG9rZW5JbmRleCkpIHtcbiAgICAgICAgcmVzW3Jlc0luZGV4XS5wdXNoKG1ha2VBbnlXb3JkKHRva2Vuc1t0b2tlbkluZGV4XSkpO1xuICAgICAgICBuZXh0QmFzZS5wdXNoKHJlc1tyZXNJbmRleF0pO1xuICAgICAgfVxuICAgIH1cbiAgICAqL1xuICAgIHZhciBsZW5NYXRjaGVzID0gdG9rZW5NYXRjaGVzW3Rva2VuSW5kZXhdLmxlbmd0aDtcbiAgICBpZiAobmV4dEJhc2UubGVuZ3RoID09PSAwICYmIGxlbk1hdGNoZXMgPT09IDApIHtcbiAgICAgIC8vIHRoZSB3b3JkIGF0IGluZGV4IEkgY2Fubm90IGJlIHVuZGVyc3Rvb2RcbiAgICAgIC8vaWYgKHJlc3VsdC5lcnJvcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXN1bHQuZXJyb3JzLnB1c2goRVJFcnJvci5tYWtlRXJyb3JfTk9fS05PV05fV09SRCh0b2tlbkluZGV4LCB0b2tlbnMpKTtcbiAgICAgIC8vfVxuICAgIH1cbiAgICBmb3IgKHZhciBsID0gMDsgbCA8IGxlbk1hdGNoZXM7ICsrbCkgeyAvLyBmb3IgZWFjaCB2YXJpYW50IHByZXNlbnQgYXQgaW5kZXgga1xuICAgICAgLy9kZWJ1Z2xvZyhcInZlY3Mgbm93XCIgKyBKU09OLnN0cmluZ2lmeSh2ZWNzKSk7XG4gICAgICB2YXIgbnZlY3MgPSBbXTsgLy92ZWNzLnNsaWNlKCk7IC8vIGNvcHkgdGhlIHZlY1tpXSBiYXNlIHZlY3RvcjtcbiAgICAgIC8vZGVidWdsb2coXCJ2ZWNzIGNvcGllZCBub3dcIiArIEpTT04uc3RyaW5naWZ5KG52ZWNzKSk7XG4gICAgICBmb3IgKHZhciB1ID0gMDsgdSA8IHJlcy5sZW5ndGg7ICsrdSkge1xuICAgICAgICBpZiAoIWlzU3BhblZlYyhyZXNbdV0sIHRva2VuSW5kZXgpICYmICFpc1N1Y2Nlc3Nvck9wZXJhdG9yKHJlc1t1XSx0b2tlbkluZGV4KSkge1xuICAgICAgICAgIC8vIGZvciBlYWNoIHNvIGZhciBjb25zdHJ1Y3RlZCByZXN1bHQgKG9mIGxlbmd0aCBrKSBpbiByZXNcbiAgICAgICAgICBudmVjcy5wdXNoKHJlc1t1XS5zbGljZSgpKTsgLy8gbWFrZSBhIGNvcHkgb2YgZWFjaCB2ZWN0b3JcbiAgICAgICAgICBudmVjc1tudmVjcy5sZW5ndGggLSAxXSA9IGNvcHlWZWNNZW1iZXJzKG52ZWNzW252ZWNzLmxlbmd0aCAtIDFdKTtcbiAgICAgICAgICAvLyBkZWJ1Z2xvZyhcImNvcGllZCB2ZWNzW1wiKyB1K1wiXVwiICsgSlNPTi5zdHJpbmdpZnkodmVjc1t1XSkpO1xuICAgICAgICAgIG52ZWNzW252ZWNzLmxlbmd0aCAtIDFdLnB1c2goXG4gICAgICAgICAgICBjbG9uZSh0b2tlbk1hdGNoZXNbdG9rZW5JbmRleF1bbF0pKTsgLy8gcHVzaCB0aGUgbHRoIHZhcmlhbnRcbiAgICAgICAgICAvLyBkZWJ1Z2xvZyhcIm5vdyBudmVjcyBcIiArIG52ZWNzLmxlbmd0aCArIFwiIFwiICsgSlNPTi5zdHJpbmdpZnkobnZlY3MpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gICBkZWJ1Z2xvZyhcIiBhdCAgICAgXCIgKyBrICsgXCI6XCIgKyBsICsgXCIgbmV4dGJhc2UgPlwiICsgSlNPTi5zdHJpbmdpZnkobmV4dEJhc2UpKVxuICAgICAgLy8gICBkZWJ1Z2xvZyhcIiBhcHBlbmQgXCIgKyBrICsgXCI6XCIgKyBsICsgXCIgbnZlY3MgICAgPlwiICsgSlNPTi5zdHJpbmdpZnkobnZlY3MpKVxuICAgICAgbmV4dEJhc2UgPSBuZXh0QmFzZS5jb25jYXQobnZlY3MpO1xuICAgICAgLy8gICBkZWJ1Z2xvZyhcIiAgcmVzdWx0IFwiICsgayArIFwiOlwiICsgbCArIFwiIG52ZWNzICAgID5cIiArIEpTT04uc3RyaW5naWZ5KG5leHRCYXNlKSlcbiAgICB9IC8vY29uc3RydVxuICAgIC8vICBkZWJ1Z2xvZyhcIm5vdyBhdCBcIiArIGsgKyBcIjpcIiArIGwgKyBcIiA+XCIgKyBKU09OLnN0cmluZ2lmeShuZXh0QmFzZSkpXG4gICAgcmVzID0gbmV4dEJhc2U7XG4gIH1cbiAgZGVidWdsb2dWKGRlYnVnbG9nVi5lbmFibGVkID8gKFwiQVBQRU5ESU5HIFRPIFJFUzEjXCIgKyAwICsgXCI6XCIgKyBsICsgXCIgPlwiICsgSlNPTi5zdHJpbmdpZnkobmV4dEJhc2UpKSA6ICctJyk7XG4gIHZhciBsYXN0QmFkID0geyBpbmRleFdvcmQgOiAtMSwgaW5kZXhTZW50ZW5jZSA6IC0xfTtcbiAgLy8gZmlsdGVyIGF3YXkgaW5ob21vZ2VuZW91cyBzZW50ZW5jZXMgdy5yLnQuIGEgZG9tYWluXG4gIHZhciBzZW50ZW5jZXNQcmlvciA9IHJlcztcbiAgcmVzID0gcmVzLmZpbHRlciggKHNlbnRlbmNlLGluZGV4KSA9PiB7XG4gICAgdmFyIGZ1bGwgPSAweEZGRkZGRkZGO1xuICAgIC8vY29uc29sZS5sb2coYHNlbnRlbmNlICAke2luZGV4fSAgXFxuYClcbiAgICByZXR1cm4gc2VudGVuY2UuZXZlcnkoICh3b3JkLGluZGV4MikgPT4ge1xuICAgICAgaWYgKCF3b3JkLnJ1bGUpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgZnVsbCA9IChmdWxsICYgd29yZC5ydWxlLmJpdFNlbnRlbmNlQW5kKTtcbiAgICAgIGlmICggZnVsbCA9PSAwICYmIGluZGV4MiA+IGxhc3RCYWQuaW5kZXhXb3JkICkge1xuICAgICAgICBsYXN0QmFkLmluZGV4U2VudGVuY2UgPSBpbmRleDtcbiAgICAgICAgbGFzdEJhZC5pbmRleFdvcmQgPSBpbmRleDI7XG4gICAgICB9XG4gICAgICAvL2NvbnNvbGUubG9nKGAgd29yZCAgJHtpbmRleDJ9ICR7ZnVsbH0gXCIke3dvcmQubWF0Y2hlZFN0cmluZ31cIiAke3dvcmQucnVsZS5iaXRTZW50ZW5jZUFuZH0gICR7dG9rZW5zW2luZGV4Ml19IFxcbmApO1xuICAgICAgcmV0dXJuIGZ1bGwgIT09IDAgfSApXG4gIH0pO1xuICBpZiAoIHJlcy5sZW5ndGggPT0gMCAgJiYgcmVzdWx0LmVycm9ycy5sZW5ndGggPT0gMCAmJiBsYXN0QmFkLmluZGV4V29yZCA+PSAwICYmIGxhc3RCYWQuaW5kZXhTZW50ZW5jZSA+PSAwICkge1xuICAgIGRlYnVnZ2VyO1xuICAgIHJlc3VsdC5lcnJvcnMucHVzaChFUkVycm9yLm1ha2VFcnJvcl9PRkZFTkRJTkdfV09SRChzZW50ZW5jZXNQcmlvcltsYXN0QmFkLmluZGV4U2VudGVuY2VdW2xhc3RCYWQuaW5kZXhXb3JkXS5zdHJpbmcsIHRva2VucywgbGFzdEJhZC5pbmRleFdvcmQpKTtcbiAgfVxuICByZXN1bHQuc2VudGVuY2VzID0gcmVzO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIHByb2Nlc3NTdHJpbmcocXVlcnk6IHN0cmluZywgcnVsZXM6IElGTW9kZWwuU3BsaXRSdWxlcyxcbiB3b3JkczogeyBba2V5OiBzdHJpbmddOiBBcnJheTxJTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nPiB9LFxuIG9wZXJhdG9ycyA6IHsgW2tleTpzdHJpbmddIDogSU9wZXJhdG9yIH1cbik6ICBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcyB7XG4gIHdvcmRzID0gd29yZHMgfHwge307XG4gIG9wZXJhdG9ycyA9IG9wZXJhdG9ycyB8fCB7fTtcbiAgLy9pZighcHJvY2Vzcy5lbnYuQUJPVF9OT19URVNUMSkge1xuICByZXR1cm4gcHJvY2Vzc1N0cmluZzIocXVlcnksIHJ1bGVzLCB3b3Jkcywgb3BlcmF0b3JzKTtcbn1cbiAgLypcbiAgdmFyIHRva2VuU3RydWN0ID0gdG9rZW5pemVTdHJpbmcocXVlcnksIHJ1bGVzLCB3b3Jkcyk7XG4gIGV2YWx1YXRlUmFuZ2VSdWxlc1RvUG9zaXRpb24odG9rZW5TdHJ1Y3QudG9rZW5zLCB0b2tlblN0cnVjdC5mdXNhYmxlLFxuICAgIHRva2VuU3RydWN0LmNhdGVnb3JpemVkV29yZHMpO1xuICBpZiAoZGVidWdsb2cuZW5hYmxlZCkge1xuICAgIGRlYnVnbG9nKFwiQWZ0ZXIgbWF0Y2hlZCBcIiArIEpTT04uc3RyaW5naWZ5KHRva2VuU3RydWN0LmNhdGVnb3JpemVkV29yZHMpKTtcbiAgfVxuICB2YXIgYVNlbnRlbmNlcyA9IGV4cGFuZFRva2VuTWF0Y2hlc1RvU2VudGVuY2VzKHRva2VuU3RydWN0LnRva2VucywgdG9rZW5TdHJ1Y3QuY2F0ZWdvcml6ZWRXb3Jkcyk7XG4gIGlmIChkZWJ1Z2xvZy5lbmFibGVkKSB7XG4gICAgZGVidWdsb2coXCJhZnRlciBleHBhbmRcIiArIGFTZW50ZW5jZXMuc2VudGVuY2VzLm1hcChmdW5jdGlvbiAob1NlbnRlbmNlKSB7XG4gICAgcmV0dXJuIFNlbnRlbmNlLnJhbmtpbmdQcm9kdWN0KG9TZW50ZW5jZSkgKyBcIjpcIiArIFNlbnRlbmNlLmR1bXBOaWNlKG9TZW50ZW5jZSk7IC8vSlNPTi5zdHJpbmdpZnkob1NlbnRlbmNlKTtcbiAgICB9KS5qb2luKFwiXFxuXCIpKTtcbiAgfVxuICBhU2VudGVuY2VzLnNlbnRlbmNlcyA9IFdvcmRNYXRjaC5yZWluRm9yY2UoYVNlbnRlbmNlcy5zZW50ZW5jZXMpO1xuICBpZiAoZGVidWdsb2cuZW5hYmxlZCkge1xuICAgIGRlYnVnbG9nKFwiYWZ0ZXIgcmVpbmZvcmNlXCIgKyBhU2VudGVuY2VzLnNlbnRlbmNlcy5tYXAoZnVuY3Rpb24gKG9TZW50ZW5jZSkge1xuICAgICAgcmV0dXJuIFNlbnRlbmNlLnJhbmtpbmdQcm9kdWN0KG9TZW50ZW5jZSkgKyBcIjpcIiArIEpTT04uc3RyaW5naWZ5KG9TZW50ZW5jZSk7XG4gICAgfSkuam9pbihcIlxcblwiKSk7XG4gIH1cbiAgcmV0dXJuIGFTZW50ZW5jZXM7XG4gICovXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRDbG9zZUlkZW50aWNhbHMoIG1wIDogIHtba2V5IDogc3RyaW5nXSA6IElNYXRjaC5JV29yZH0sIHdvcmQgOiBJTWF0Y2guSVdvcmQgKSA6IEFycmF5PElNYXRjaC5JV29yZD5cbntcbiAgdmFyIHJlcyA9IFtdIGFzIEFycmF5PElNYXRjaC5JV29yZD47XG4gIGZvciggdmFyIGtleSBpbiBtcCApXG4gIHtcbiAgICBpZiAoIGtleSA9PSB3b3JkLnN0cmluZyApXG4gICAge1xuICAgICAgcmVzLnB1c2goIG1wWyBrZXkgXSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKCBDaGFyU2VxdWVuY2UuQ2hhclNlcXVlbmNlLmlzU2FtZU9yUGx1cmFsT3JWZXJ5Q2xvc2UoIGtleSwgd29yZC5zdHJpbmcgKSApXG4gICAge1xuICAgICAgcmVzLnB1c2goIG1wW2tleV0gKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cblxuLyogUmV0dXJuIHRydWUgaWYgdGhlIGlkZW50aWNhbCAqc291cmNlIHdvcmQqIGlzIGludGVycHJldGVkXG4qICh3aXRoaW4gdGhlIHNhbWUgZG9tYWluIGFuZCB0aGUgc2FtZSB3b3JkdHlwZSlcbiogYXMgYSBkaWZmZXJuZW50ICAoZS5nLiBlbGVtZW50IG51bWIgaXMgb25lIGludGVycHJldGVkIGFzICdDQVQnIGVsZW1lbnQgbmFtZSwgb25jZSBhcyBDQVQgJ2VsZW1lbnQgbnVtYmVyJyBpblxuKlxuKiBleGFtcGxlXG4qIFsgJ2VsZW1lbnQgbmFtZXM9PmVsZW1lbnQgbnVtYmVyL2NhdGVnb3J5LzIgRjE2JywgICAgICAgICA8PDwgKDEpXG4qICAgICdlbGVtZW50IG51bWJlcj0+ZWxlbWVudCBudW1iZXIvY2F0ZWdvcnkvMiBGMTYnLFxuKiAgICAnZWxlbWVudCB3ZWlnaHQ9PmF0b21pYyB3ZWlnaHQvY2F0ZWdvcnkvMiBGMTYnLFxuKiAgICAnZWxlbWVudCBuYW1lPT5lbGVtZW50IG5hbWUvY2F0ZWdvcnkvMiBGMTYnLCAgICAgICAgICAgPDw8ICgyKVxuKiAgICAnd2l0aD0+d2l0aC9maWxsZXIgSTI1NicsXG4qICAgICdlbGVtZW50IG5hbWU9PmVsZW1lbnQgbmFtZS9jYXRlZ29yeS8yIEYxNicsICAgICAgICAgICA8PDwgKDMpXG4qICAgJ3N0YXJ0aW5nIHdpdGg9PnN0YXJ0aW5nIHdpdGgvb3BlcmF0b3IvMiBPMjU2JyxcbiogICAgJ0FCQz0+QUJDL2FueSBBNDA5NicgXSxcbipcbiogc2FtZSBkb21haW4gSVVQQUMgZWxlbWVudHMpXG4qXG4qICAoMSkgZGlmZmVycyB0byAoMiksKDMpIGFsdGhvdWdoIHRoZSBiYXNlIHdvcmRzIGFyZSB2ZXJ5IHNpbWlsYXIgZWxlbWVudCBuYW1lcywgZWxlbWVudCBuYW1lLCBlbGVtZW50IG5hbWUgcmVzcGVjdGl2ZWx5XG4qXG4qIC0gZXhhY3QgbWF0Y2hcbiogLSBzdGVtbWluZyBieSByZW1vdmluZy9hcHBlbmRpbmcgdHJhbGluZyBzXG4qIC0gY2xvc2VuZXNzXG4qXG4qIEBwYXJhbSBzZW50ZW5jZVxuKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0Rpc3RpbmN0SW50ZXJwcmV0YXRpb25Gb3JTYW1lKHNlbnRlbmNlIDogSU1hdGNoLklTZW50ZW5jZSkgOiBib29sZWFuIHtcbiAgdmFyIG1wID0ge30gYXMge1trZXkgOiBzdHJpbmddIDogSU1hdGNoLklXb3JkfTtcbiAgdmFyIHJlcyA9IHNlbnRlbmNlLmV2ZXJ5KCh3b3JkLCBpbmRleCkgPT4ge1xuICAgIHZhciBzZWVucyA9IGZpbmRDbG9zZUlkZW50aWNhbHMoIG1wLCB3b3JkICk7XG4gICAgZGVidWdsb2coXCIgaW52ZXN0aWdhdGluZyBzZWVucyBmb3IgXCIgKyB3b3JkLnN0cmluZyArIFwiIFwiICsgSlNPTi5zdHJpbmdpZnkoc2VlbnMsIHVuZGVmaW5lZCwgMikpO1xuICAgIGZvciggdmFyIHNlZW4gb2Ygc2VlbnMpXG4gICAge1xuICAgICAgLy92YXIgc2VlbiA9IG1wW3dvcmQuc3RyaW5nXTtcbiAgICAgIC8qaWYoIXNlZW4pIHtcbiAgICAgICAgbXBbd29yZC5zdHJpbmddID0gd29yZDtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9Ki9cbiAgICAgIGlmKCFzZWVuLnJ1bGUgfHwgIXdvcmQucnVsZSkge1xuICAgICAgICAvL3JldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihzZWVuLnJ1bGUuYml0aW5kZXggPT09IHdvcmQucnVsZS5iaXRpbmRleFxuICAgICAgICAmJiBzZWVuLnJ1bGUubWF0Y2hlZFN0cmluZyAhPT0gd29yZC5ydWxlLm1hdGNoZWRTdHJpbmcgKXtcbiAgICAgICAgICBkZWJ1Z2xvZyhcInNraXBwaW5nIHRoaXNcIiArIEpTT04uc3RyaW5naWZ5KHNlbnRlbmNlLHVuZGVmaW5lZCwyKSk7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICBpZighbXBbd29yZC5zdHJpbmddKVxuICAgIHtcbiAgICAgIG1wW3dvcmQuc3RyaW5nXSA9IHdvcmQ7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gfSk7XG4gcmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU2FtZUNhdGVnb3J5QW5kSGlnaGVyTWF0Y2goc2VudGVuY2UgOiBJTWF0Y2guSVNlbnRlbmNlLCAgaWR4bWFwIDogeyBbYWtleSA6IG51bWJlcl0gOiBBcnJheTxJTWF0Y2guSVdvcmQ+IH0pIDogYm9vbGVhbiB7XG4gIHZhciBpZHhtYXBvdGhlciA9IHt9IGFzIHsgW2FrZXkgOiBudW1iZXJdIDogQXJyYXk8SU1hdGNoLklXb3JkPiB9O1xuICB2YXIgY250ID0gMDtcbiAgdmFyIHByb2RvID0xLjA7XG4gIHZhciBwcm9kID0gMS4wO1xuICBPYmplY3Qua2V5cyggaWR4bWFwICkuZm9yRWFjaCggKGlkeGtleSkgPT4ge1xuICAgIHZhciB3cmQgPSBpZHhtYXBbaWR4a2V5XTtcbiAgICB2YXIgaWR4ID0gcGFyc2VJbnQoIGlkeGtleSApO1xuICAgIGlmICggc2VudGVuY2UubGVuZ3RoID4gaWR4IClcbiAgICB7XG4gICAgICB2YXIgd3JkbyA9IHNlbnRlbmNlW2lkeF07XG4gICAgICBpZiggd3Jkby5zdHJpbmcgPT09IHdyZC5zdHJpbmdcbiAgICAgICAgJiYgd3Jkby5ydWxlLmJpdGluZGV4ID09PSB3cmQucnVsZS5iaXRpbmRleFxuICAgICAgICAmJiB3cmRvLnJ1bGUud29yZFR5cGUgPT09IHdyZC5ydWxlLndvcmRUeXBlXG4gICAgICAgICYmIHdyZG8ucnVsZS5jYXRlZ29yeSA9PT0gd3JkLnJ1bGUuY2F0ZWdvcnkgKVxuICAgICAge1xuICAgICAgICArK2NudDtcbiAgICAgICAgcHJvZG8gPSBwcm9kbyAqIHdyZG8uX3Jhbmtpbmc7XG4gICAgICAgIHByb2QgPSBwcm9kICogd3JkLl9yYW5raW5nO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIGlmICggY250ID09PSBPYmplY3Qua2V5cyggaWR4bWFwICkubGVuZ3RoICYmIHByb2RvID4gcHJvZCApXG4gIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGdldF9pdGhfYXJnKCBvbmVwb3MgOiBudW1iZXIsIG9wcG9zIDogbnVtYmVyLCBzZW50ZW5jZTogSU1hdGNoLklTZW50ZW5jZSwgaW5kZXggOiBudW1iZXIgKSA6IElNYXRjaC5JV29yZFxueyAvLy8gICAgICAgICBvcHBvcz0wICAgICBvcHBvcz0tMSAgICAgb3Bwb3M9LTIgICBvcHBvcz0xXG4gIC8vIDEgLT4gIDAgIC0xOyAgICAgICAgICAgMSAgICAgICAgICAgIDIgICAgICAgICAtMlxuICAvLyAyICAtPiAxICAgMTsgICAgICAgICAgIDIgICAgICAgICAgICAzICAgICAgICAgLTFcbiAgdmFyIHBvcyA9IG9uZXBvcyAtIDE7XG4gIGlmICggcG9zIDw9IG9wcG9zIClcbiAgICAgcG9zID0gLTE7XG4gIHBvcyAtPSBvcHBvcztcbiAgdmFyIGlkeCA9IHBvcyArIGluZGV4O1xuICByZXR1cm4gc2VudGVuY2VbaWR4XTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQmFkT3BlcmF0b3JBcmdzKHNlbnRlbmNlIDogSU1hdGNoLklTZW50ZW5jZSwgb3BlcmF0b3JzOiBJTWF0Y2guSU9wZXJhdG9ycyApIDogYm9vbGVhbiB7XG4gIGlmIChpc051bGxPckVtcHR5RGljdGlvbmFyeShvcGVyYXRvcnMpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuICFzZW50ZW5jZS5ldmVyeSggKHdvcmQsIGluZGV4KSA9PiB7XG4gICAgaWYoICAod29yZC5ydWxlICYmIHdvcmQucnVsZS53b3JkVHlwZSkgIT0gSU1hdGNoLldPUkRUWVBFLk9QRVJBVE9SIClcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIHZhciBvcCA9b3BlcmF0b3JzW3dvcmQucnVsZS5tYXRjaGVkU3RyaW5nXTtcbiAgICBpZiggIW9wKVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgdmFyIG9wZXJhdG9ycG9zID0gb3Aub3BlcmF0b3Jwb3MgfHwgMDtcbiAgICBpZiAoIW9wLmFyaXR5KVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgZm9yKCB2YXIgaSA9IDE7IGkgPD0gb3AuYXJpdHk7ICsraSlcbiAgICB7XG4gICAgICB2YXIgaXRoX2FyZyA9IGdldF9pdGhfYXJnKCBpLCBvcGVyYXRvcnBvcyAsIHNlbnRlbmNlLCBpbmRleCApO1xuICAgICAgaWYgKCFpdGhfYXJnKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB2YXIgYXJndHlwZSA9IG9wLmFyZ2NhdGVnb3J5WyBpIC0gMV07XG4gICAgICB2YXIgYXJndHlwZXggPSBhcmd0eXBlLm1hcCggICh4KSA9PiBXb3JkLldvcmRUeXBlLmZyb21DYXRlZ29yeVN0cmluZyggeCApKTtcbiAgICAgIGlmICggYXJndHlwZXguaW5kZXhPZiggaXRoX2FyZy5ydWxlLndvcmRUeXBlICkgPCAwIClcbiAgICAgIHtcbiAgICAgICAgZGVidWdsb2coICgpPT4geyByZXR1cm4gXCJkaXNjYXJkaW5nIGR1ZSB0byBhcmcgXCIgKyBvcC5vcGVyYXRvciArIFwiIGFyZyAjXCIgKyBpICsgXCIgZXhwZWN0ZWRcIiArIEpTT04uc3RyaW5naWZ5KCBhcmd0eXBleCApICsgXCIgd2FzIFwiICArIGl0aF9hcmcucnVsZS53b3JkVHlwZTt9KTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG59XG5cblxuLyogUmV0dXJuIHRydWUgaWYgdGhlIGlkZW50aWNhbCAqdGFyZ2V0IHdvcmQqIGlzIGV4cHJlc3NlZCBieSBkaWZmZXJlbnQgc291cmNlIHdvcmRzXG4qICh3aXRoaW4gdGhlIHNhbWUgZG9tYWluIGFuZCB0aGUgc2FtZSB3b3JkdHlwZSlcbipcbiogdGhpcyBpcyBwcm9ibGVtYXRpYyB3aXRoIGFsaWFzZXMgbWFwcGVkIG9udG8gdGhlIHNhbWUgdGFyZ2V0LCAoZWcuIHdoZXJlIC0+IHdpdGgsIHdpdGggLT4gd2hlcmUgKVxuKiBzbyBwZXJoYXBzIG9ubHkgZm9yIGNhdGVnb3JpZXMgYW5kIGZhY3RzP1xuKlxuKiBleGFtcGxlIDxwcmU+XG4qIFsgJ2VsZW1lbnQgbmFtZXM9PmVsZW1lbnQgbnVtYmVyL2NhdGVnb3J5LzIgQzgnLCAgICAgICAgIDw8PCAoMWEpXG4qICAgICdlbGVtZW50IG51bWJlcj0+ZWxlbWVudCBudW1iZXIvY2F0ZWdvcnkvMiBDOCcsICAgICAgIDw8PCAoMilcbiogICAgJ2VsZW1lbnQgd2VpZ2h0PT5hdG9taWMgd2VpZ2h0L2NhdGVnb3J5LzIgQzgnLFxuKiAgICAnZWxlbWVudCBuYW1lPT5lbGVtZW50IG51bWJlci9jYXRlZ29yeS8yIEM4JywgICAgICAgICAgIDw8PCAoMWIpXG4qICAgICd3aXRoPT53aXRoL2ZpbGxlciBJMjU2JyxcbiogICAgJ2VsZW1lbnQgbmFtZT0+ZWxlbWVudCBudW1iZXIvY2F0ZWdvcnkvMiBDOCcsICAgICAgICAgICA8PDwgKDFjKVxuKiAgICAnc3RhcnRpbmcgd2l0aD0+c3RhcnRpbmcgd2l0aC9vcGVyYXRvci8yIE8yNTYnLFxuKiAgICAnQUJDPT5BQkMvYW55IEE0MDk2JyBdLFxuKlxuKiBzYW1lIGRvbWFpbiBJVVBBQyBlbGVtZW50cylcbipcbiogICgxYWJjKSBkaWZmZXJzIGZyb20gKDIpLFxuKiAgYW5kIHRoZXJlIGlzIGEgbXVjaCBiZXR0ZXIgaW50ZXJwcmV0YXRpb24gYXJvdW5kXG4qIDwvcHJlPlxuKiAtIGV4YWN0IG1hdGNoXG4qIC0gc3RlbW1pbmcgYnkgcmVtb3ZpbmcvYXBwZW5kaW5nIHRyYWxpbmcgc1xuKiAtIGNsb3NlbmVzc1xuKlxuKiBAcGFyYW0gc2VudGVuY2VcbiovXG5leHBvcnQgZnVuY3Rpb24gaXNOb25PcHRpbWFsRGlzdGluY3RTb3VyY2VGb3JTYW1lKHNlbnRlbmNlIDogSU1hdGNoLklTZW50ZW5jZSwgc2VudGVuY2VzIDogQXJyYXk8SU1hdGNoLklTZW50ZW5jZT4pIDogYm9vbGVhbiB7XG4gIHZhciBtcCA9IHt9IGFzIHtba2V5IDogc3RyaW5nXSA6ICB7IFtrZXkgOiBudW1iZXJdIDogQXJyYXk8SU1hdGNoLklXb3JkPiB9IH07XG4gIC8vIGNhbGN1bGF0ZSBjb25mbGljdHMgOiAgICBbdGFnZXRfd29yZCAtPiBdXG4gIHZhciByZXMgPSBzZW50ZW5jZS5ldmVyeSgod29yZCkgPT4ge1xuICAgIGlmICggd29yZC5jYXRlZ29yeSA9PT0gV29yZC5DYXRlZ29yeS5DQVRfQ0FURUdPUllcbiAgICAgICYmICggIHdvcmQucnVsZS53b3JkVHlwZSA9PT0gSU1hdGNoLldPUkRUWVBFLkZBQ1RcbiAgICAgICAgIHx8IHdvcmQucnVsZS53b3JkVHlwZSA9PT0gSU1hdGNoLldPUkRUWVBFLkNBVEVHT1JZICkpXG4gICAge1xuICAgICAgaWYgKCFtcFt3b3JkLnJ1bGUubWF0Y2hlZFN0cmluZyBdKVxuICAgICAgICBtcFt3b3JkLnJ1bGUubWF0Y2hlZFN0cmluZ10gPSB7fSBhcyB7IFtrZXkgOiBudW1iZXJdIDogQXJyYXk8SU1hdGNoLklXb3JkPiB9O1xuICAgICAgaWYoICFtcFt3b3JkLnJ1bGUubWF0Y2hlZFN0cmluZ11bd29yZC5ydWxlLmJpdGluZGV4XSlcbiAgICAgICAgbXBbd29yZC5ydWxlLm1hdGNoZWRTdHJpbmddW3dvcmQucnVsZS5iaXRpbmRleF0gPSBbXSBhcyAgQXJyYXk8SU1hdGNoLklXb3JkPjtcbiAgICAgIHZhciBhcnIgPSBtcFt3b3JkLnJ1bGUubWF0Y2hlZFN0cmluZ11bd29yZC5ydWxlLmJpdGluZGV4XTtcbiAgICAgIGlmKCBhcnIubGVuZ3RoID09IDAgKVxuICAgICAge1xuICAgICAgICBhcnIucHVzaCh3b3JkKTtcbiAgICAgIH1cbiAgICAgIGlmICggIWFyci5ldmVyeSggKHByZXNlbnR3b3JkKSA9PiB7XG4gICAgICAgIHJldHVybiBDaGFyU2VxdWVuY2UuQ2hhclNlcXVlbmNlLmlzU2FtZU9yUGx1cmFsT3JWZXJ5Q2xvc2UoIHdvcmQuc3RyaW5nLCBwcmVzZW50d29yZC5zdHJpbmcgKTtcbiAgICAgIH0pKVxuICAgICAge1xuICAgICAgICBhcnIucHVzaCggd29yZCApO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyByZXRhaW4gb25seSBlbnRyaWVzIHdpdGggbW9yZSB0aGFuIG9uZSBtZW1iZXIgaW4gdGhlIGxpc3RcbiAgICB2YXIgbXBkdXBsaWNhdGVzID0ge30gYXMge1trZXkgOiBzdHJpbmddIDogIHsgW2tleSA6IG51bWJlcl0gOiBBcnJheTxJTWF0Y2guSVdvcmQ+IH0gfTtcbiAgICBPYmplY3Qua2V5cyggbXAgKS5mb3JFYWNoKCAoa2V5KSA9PiB7XG4gICAgICB2YXIgZW50cnkgPSBtcFtrZXldO1xuICAgICAgT2JqZWN0LmtleXMoIGVudHJ5ICkuZm9yRWFjaCggKGtleWJpdGluZGV4KSA9PiB7XG4gICAgICAgIGlmICggZW50cnlba2V5Yml0aW5kZXhdLmxlbmd0aCA+IDEpXG4gICAgICAgIHtcbiAgICAgICAgICBpZiAoIW1wZHVwbGljYXRlc1trZXldKVxuICAgICAgICAgICAgbXBkdXBsaWNhdGVzW2tleV0gPSB7fSBhcyB7IFtrZXkgOiBudW1iZXJdIDogQXJyYXk8SU1hdGNoLklXb3JkPiB9O1xuICAgICAgICAgIG1wZHVwbGljYXRlc1trZXldW2tleWJpdGluZGV4XSA9IGVudHJ5W2tleWJpdGluZGV4XTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKCBtcGR1cGxpY2F0ZXMgKS5ldmVyeSggKGtleSkgPT4gIHtcbiAgICAgIHJldHVybiBPYmplY3Qua2V5cyggbXBkdXBsaWNhdGVzWyBrZXkgXSApLmV2ZXJ5KCAoIGJpICkgPT4ge1xuICAgICAgICB2YXIgbHN0ID0gbXBkdXBsaWNhdGVzW2tleV1bYmldO1xuICAgICAgICB2YXIgaWR4bWFwID0ge30gYXMgeyBbYWtleSA6IG51bWJlcl0gOiBBcnJheTxJTWF0Y2guSVdvcmQ+IH07XG4gICAgICAgIC8qIG9rLCBkbyBzb21lIHdvcmsgLi4gICovXG4gICAgICAgIC8qIGZvciBldmVyeSBkdXBsaWNhdGUgd2UgY29sbGVjdCBhbiBpbmRleCAgaWR4IC0+IHdvcmQgKi9cbiAgICAgICAgZm9yKCB2YXIgYWxzdCBvZiBsc3QgKVxuICAgICAgICB7XG4gICAgICAgICAgdmFyIGlkeCA9IHNlbnRlbmNlLmluZGV4T2YoIGFsc3QgKTtcbiAgICAgICAgICBpZiAoIGlkeCA8IDAgKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwid29yZCBtdXN0IGJlIGZvdW5kIGluIHNlbnRlbmNlIFwiKTtcbiAgICAgICAgICBpZHhtYXBbIGlkeCBdID0gYWxzdDtcbiAgICAgICAgfVxuICAgICAgICAvKiB0aGVuIHdlIHJ1biB0aHJvdWdoIGFsbCB0aGUgc2VudGVuY2VzIGlkZW50aWZ5aW5nICppZGVudGljYWwgc291cmNlIHdvcmRzIHBhaXJzLFxuICAgICAgICAgICBpZiB3ZSBmaW5kIGEgIGEpIGRpc3RpbmN0IHNlbnRlbmNlIHdpdGhcbiAgICAgICAgICAgICAgICAgICAgICBiKSBzYW1lIGNhdGVnb3JpZXMgRjE2L0YxNlxuICAgICAgICAgICAgICAgICAgYW5kIGMpICpoaWdoZXIgbWF0Y2hlcyogZm9yIGJvdGggLCB0aGVuIHdlIGRpc2NhcmQgKnRoaXMqIHNlbnRlbmNlXG4gICAgICAgICAgICAgICAgICAqL1xuICAgICAgICByZXR1cm4gc2VudGVuY2VzLmV2ZXJ5KCAob3RoZXJzZW50ZW5jZSkgPT4ge1xuICAgICAgICAgIGlmKCBvdGhlcnNlbnRlbmNlID09PSBzZW50ZW5jZSApXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICBpZiAoIGlzU2FtZUNhdGVnb3J5QW5kSGlnaGVyTWF0Y2goIG90aGVyc2VudGVuY2UsIGlkeG1hcCkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGRlYnVnbG9nKFwiIHJlbW92aW5nIHNlbnRlbmNlIHdpdGggZHVlIHRvIGhpZ2hlciBtYXRjaCBcIiArICBTZW50ZW5jZS5zaW1wbGlmeVN0cmluZ3NXaXRoQml0SW5kZXgoc2VudGVuY2UpXG4gICAgICAgICAgICArIFwiIGFzIFwiICsgU2VudGVuY2Uuc2ltcGxpZnlTdHJpbmdzV2l0aEJpdEluZGV4KCBvdGhlcnNlbnRlbmNlICkgKyBcIiBhcHBlYXJzIGJldHRlciBcIik7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgfSk7XG4gIH0pO1xuICBkZWJ1Z2xvZyhcIiBoZXJlIHJlcyBcIiArICFyZXMgKyBcIiBcIiArICBTZW50ZW5jZS5zaW1wbGlmeVN0cmluZ3NXaXRoQml0SW5kZXgoc2VudGVuY2UpICk7XG4gIHJldHVybiAhcmVzO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJOb25TYW1lSW50ZXJwcmV0YXRpb25zKGFTZW50ZW5jZXMgOiAgSU1hdGNoLklQcm9jZXNzZWRTZW50ZW5jZXMgKSA6IElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzIHtcbiAgdmFyIGRpc2NhcmRJbmRleCA9IFtdIGFzIEFycmF5PG51bWJlcj47XG4gIHZhciByZXMgPSAoT2JqZWN0IGFzIGFueSkuYXNzaWduKCB7fSwgYVNlbnRlbmNlcyApO1xuICByZXMuc2VudGVuY2VzID0gYVNlbnRlbmNlcy5zZW50ZW5jZXMuZmlsdGVyKChzZW50ZW5jZSxpbmRleCkgPT4ge1xuICAgIGlmKCFpc0Rpc3RpbmN0SW50ZXJwcmV0YXRpb25Gb3JTYW1lKHNlbnRlbmNlKSkge1xuICAgICAgZGlzY2FyZEluZGV4LnB1c2goaW5kZXgpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG4gIGlmKGRpc2NhcmRJbmRleC5sZW5ndGgpIHtcbiAgICByZXMuZXJyb3JzID0gYVNlbnRlbmNlcy5lcnJvcnMuZmlsdGVyKCAoZXJyb3IsaW5kZXgpID0+IHtcbiAgICAgIGlmKGRpc2NhcmRJbmRleC5pbmRleE9mKGluZGV4KSA+PSAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICB9XG4gIHJldHVybiByZXM7XG59XG5cbmZ1bmN0aW9uIGlzTnVsbE9yRW1wdHlEaWN0aW9uYXJ5KG9iaikge1xuICByZXR1cm4gKG9iaiA9PT0gdW5kZWZpbmVkKSB8fCAoT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDApO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJCYWRPcGVyYXRvckFyZ3MoYVNlbnRlbmNlcyA6ICBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcywgb3BlcmF0b3JzIDogSUZNb2RlbC5JT3BlcmF0b3JzICkgOiBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcyB7XG4gIGlmICggaXNOdWxsT3JFbXB0eURpY3Rpb25hcnkob3BlcmF0b3JzKSApXG4gICAgcmV0dXJuIGFTZW50ZW5jZXM7XG4gIHZhciBkaXNjYXJkSW5kZXggPSBbXSBhcyBBcnJheTxudW1iZXI+O1xuICB2YXIgcmVzID0gKE9iamVjdCBhcyBhbnkpLmFzc2lnbigge30sIGFTZW50ZW5jZXMgKTtcbiAgcmVzLnNlbnRlbmNlcyA9IGFTZW50ZW5jZXMuc2VudGVuY2VzLmZpbHRlcigoc2VudGVuY2UsaW5kZXgpID0+IHtcbiAgICBpZihpc0JhZE9wZXJhdG9yQXJncyhzZW50ZW5jZSwgb3BlcmF0b3JzKSkge1xuICAgICAgZGlzY2FyZEluZGV4LnB1c2goaW5kZXgpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG4gIGlmKGRpc2NhcmRJbmRleC5sZW5ndGgpIHtcbiAgICByZXMuZXJyb3JzID0gYVNlbnRlbmNlcy5lcnJvcnMuZmlsdGVyKCAoZXJyb3IsaW5kZXgpID0+IHtcbiAgICAgIGlmKGRpc2NhcmRJbmRleC5pbmRleE9mKGluZGV4KSA+PSAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICB9XG4gIHJldHVybiByZXM7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlclJldmVyc2VOb25TYW1lSW50ZXJwcmV0YXRpb25zKGFTZW50ZW5jZXMgOiAgSU1hdGNoLklQcm9jZXNzZWRTZW50ZW5jZXMgKSA6IElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzIHtcbiAgdmFyIGRpc2NhcmRJbmRleCA9IFtdIGFzIEFycmF5PG51bWJlcj47XG4gIHZhciByZXMgPSAoT2JqZWN0IGFzIGFueSkuYXNzaWduKCB7fSwgYVNlbnRlbmNlcyApO1xuICByZXMuc2VudGVuY2VzID0gYVNlbnRlbmNlcy5zZW50ZW5jZXMuZmlsdGVyKChzZW50ZW5jZSxpbmRleCkgPT4ge1xuICAgIGlmKGlzTm9uT3B0aW1hbERpc3RpbmN0U291cmNlRm9yU2FtZShzZW50ZW5jZSwgYVNlbnRlbmNlcy5zZW50ZW5jZXMpKSB7XG4gICAgICBkaXNjYXJkSW5kZXgucHVzaChpbmRleCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9KTtcbiAgaWYoZGlzY2FyZEluZGV4Lmxlbmd0aCkge1xuICAgIHJlcy5lcnJvcnMgPSBhU2VudGVuY2VzLmVycm9ycy5maWx0ZXIoIChlcnJvcixpbmRleCkgPT4ge1xuICAgICAgaWYoZGlzY2FyZEluZGV4LmluZGV4T2YoaW5kZXgpID49IDApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByb2Nlc3NTdHJpbmcyKHF1ZXJ5OiBzdHJpbmcsIHJ1bGVzOiBJRk1vZGVsLlNwbGl0UnVsZXMsXG4gd29yZHM6IHsgW2tleTogc3RyaW5nXTogQXJyYXk8SU1hdGNoLklDYXRlZ29yaXplZFN0cmluZz4gfSxcbiBvcGVyYXRvcnMgOiB7IFtrZXk6c3RyaW5nXSA6IElPcGVyYXRvciB9XG4pOiAgSU1hdGNoLklQcm9jZXNzZWRTZW50ZW5jZXMge1xuICB3b3JkcyA9IHdvcmRzIHx8IHt9O1xuICB2YXIgdG9rZW5TdHJ1Y3QgPSB0b2tlbml6ZVN0cmluZyhxdWVyeSwgcnVsZXMsIHdvcmRzKTtcbiAgZGVidWdsb2coKCk9PiBgdG9rZW5pemVkOlxcbmAgKyB0b2tlblN0cnVjdC5jYXRlZ29yaXplZFdvcmRzLm1hcCggcyA9PiBTZW50ZW5jZS5zaW1wbGlmeVN0cmluZ3NXaXRoQml0SW5kZXgocykuam9pbihcIlxcblwiKSApLmpvaW4oXCJcXG5cIikpO1xuICBldmFsdWF0ZVJhbmdlUnVsZXNUb1Bvc2l0aW9uKHRva2VuU3RydWN0LnRva2VucywgdG9rZW5TdHJ1Y3QuZnVzYWJsZSxcbiAgICB0b2tlblN0cnVjdC5jYXRlZ29yaXplZFdvcmRzKTtcbiAgZGVidWdsb2dWKCgpPT5cIkFmdGVyIG1hdGNoZWQgXCIgKyBKU09OLnN0cmluZ2lmeSh0b2tlblN0cnVjdC5jYXRlZ29yaXplZFdvcmRzKSk7XG4gIHZhciBhU2VudGVuY2VzID0gZXhwYW5kVG9rZW5NYXRjaGVzVG9TZW50ZW5jZXMyKHRva2VuU3RydWN0LnRva2VucywgdG9rZW5TdHJ1Y3QuY2F0ZWdvcml6ZWRXb3Jkcyk7XG4gIGRlYnVnbG9nKCgpID0+IFwiYWZ0ZXIgZXhwYW5kIFwiICsgYVNlbnRlbmNlcy5zZW50ZW5jZXMubWFwKGZ1bmN0aW9uIChvU2VudGVuY2UpIHtcbiAgICByZXR1cm4gU2VudGVuY2UucmFua2luZ1Byb2R1Y3Qob1NlbnRlbmNlKSArIFwiOlxcblwiICsgU2VudGVuY2UuZHVtcE5pY2VCaXRJbmRleGVkKG9TZW50ZW5jZSk7IC8vSlNPTi5zdHJpbmdpZnkob1NlbnRlbmNlKTtcbiAgICB9KS5qb2luKFwiXFxuXCIpKTtcbiAgYVNlbnRlbmNlcyA9IGZpbHRlckJhZE9wZXJhdG9yQXJncyhhU2VudGVuY2VzLCBvcGVyYXRvcnMpXG4gIGFTZW50ZW5jZXMgPSBmaWx0ZXJOb25TYW1lSW50ZXJwcmV0YXRpb25zKGFTZW50ZW5jZXMpO1xuXG4gIGFTZW50ZW5jZXMgPSBmaWx0ZXJSZXZlcnNlTm9uU2FtZUludGVycHJldGF0aW9ucyhhU2VudGVuY2VzKTtcblxuICBhU2VudGVuY2VzLnNlbnRlbmNlcyA9IFdvcmRNYXRjaC5yZWluRm9yY2UoYVNlbnRlbmNlcy5zZW50ZW5jZXMpO1xuICBkZWJ1Z2xvZ1YoKCk9PiBcImFmdGVyIHJlaW5mb3JjZVxcblwiICsgYVNlbnRlbmNlcy5zZW50ZW5jZXMubWFwKGZ1bmN0aW9uIChvU2VudGVuY2UpIHtcbiAgICAgIHJldHVybiBTZW50ZW5jZS5yYW5raW5nUHJvZHVjdChvU2VudGVuY2UpICsgXCI6XFxuXCIgKyBKU09OLnN0cmluZ2lmeShvU2VudGVuY2UpO1xuICAgIH0pLmpvaW4oXCJcXG5cIikpO1xuICBkZWJ1Z2xvZygoKSA9PiBcImFmdGVyIHJlaW5mb3JjZVwiICsgYVNlbnRlbmNlcy5zZW50ZW5jZXMubWFwKGZ1bmN0aW9uIChvU2VudGVuY2UpIHtcbiAgICByZXR1cm4gU2VudGVuY2UucmFua2luZ1Byb2R1Y3Qob1NlbnRlbmNlKSArIFwiOlxcblwiICsgU2VudGVuY2UuZHVtcE5pY2VCaXRJbmRleGVkKG9TZW50ZW5jZSk7IC8vSlNPTi5zdHJpbmdpZnkob1NlbnRlbmNlKTtcbiAgICB9KS5qb2luKFwiXFxuXCIpKTtcbiAgcmV0dXJuIGFTZW50ZW5jZXM7XG59XG5cblxuIl19
