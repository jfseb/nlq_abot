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
exports.processString2 = exports.filterReverseNonSameInterpretations = exports.filterBadOperatorArgs = exports.filterNonSameInterpretations = exports.isDistinctInterpretationForSameOLD = exports.isNonOptimalDistinctSourceForSame = exports.isBadOperatorArgs = exports.isSameCategoryAndHigherMatch = exports.isDistinctInterpretationForSame = exports.findCloseIdenticals = exports.processString = exports.expandTokenMatchesToSentences2 = exports.isSuccessorOperator = exports.makeAnyWord = exports.expandTokenMatchesToSentences = exports.isSpanVec = exports.evaluateRangeRulesToPosition = exports.mergeIgnoreOrAppend = exports.isSameRes = exports.tokenizeString = exports.mockDebug = void 0;
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
    res = res.filter((sentence, index) => {
        var full = 0xFFFFFFFF;
        //console.log(`sentence  ${index}  \n`)
        return sentence.every((word, index2) => {
            if (!word.rule)
                return true;
            full = (full & word.rule.bitSentenceAnd);
            //console.log(` word  ${index2} ${full} "${word.matchedString}" ${word.rule.bitSentenceAnd}  ${tokens[index2]} \n`);
            return full !== 0;
        });
    });
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
                console.log("discarding due to arg " + op.operator + " arg #" + i + " expected" + JSON.stringify(argtypex) + " was " + ith_arg.rule.wordType);
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
/*
 * Return true if the identical source word is interpreted
 * (within the same domain and the same wordtype)
 * as a differnent  (e.g. element numb is one interpreted as 'CAT' element name, once as CAT 'element number' in
 * same domain IUPAC elements)
 *
 * - exact match
 * - stemming by removing/appending traling s
 * - closeness
 *
 * @param sentence
 */
function isDistinctInterpretationForSameOLD(sentence) {
    var mp = {};
    var res = sentence.every((word, index) => {
        var seen = mp[word.string];
        if (!seen) { // exact match
            /*if( word.string.length > 3 && word.string.charAt(word.string.length - 1).toLowerCase() == 's')
            {
      
            }
            */
        }
        if (!seen) {
            mp[word.string] = word;
            return true;
        }
        if (!seen.rule || !word.rule) {
            return true;
        }
        if (seen.rule.bitindex === word.rule.bitindex
            && seen.rule.matchedString !== word.rule.matchedString) {
            //  console.log("skipping this" + JSON.stringify(sentence,undefined,2));
            return false;
        }
        return true;
    });
    return res;
}
exports.isDistinctInterpretationForSameOLD = isDistinctInterpretationForSameOLD;
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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RSxPQUFPLFFBQVEsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLEdBQUcsS0FBSyxHQUFHLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLDRCQUE0QjtJQUN4SCxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNqQixPQUFPLFVBQVUsQ0FBQztBQUNwQixDQUFDO0FBM0JELHdDQTJCQyIsImZpbGUiOiJtYXRjaC9lcmJhc2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICpcclxuICogQG1vZHVsZSBqZnNlYi5lcmJhc2VcclxuICogQGZpbGUgZXJiYXNlXHJcbiAqIEBjb3B5cmlnaHQgKGMpIDIwMTYgR2VyZCBGb3JzdG1hbm5cclxuICpcclxuICogQmFzaWMgZG9tYWluIGJhc2VkIGVudGl0eSByZWNvZ25pdGlvblxyXG4gKlxyXG4gKi9cclxuXHJcblxyXG5pbXBvcnQgKiBhcyBXb3JkTWF0Y2ggZnJvbSAnLi9pbnB1dEZpbHRlcic7XHJcbmltcG9ydCAqIGFzIENoYXJTZXF1ZW5jZSBmcm9tICcuL2NoYXJzZXF1ZW5jZSc7XHJcblxyXG5pbXBvcnQgKiBhcyBkZWJ1ZyBmcm9tICdkZWJ1Z2YnO1xyXG5cclxuXHJcblxyXG52YXIgZGVidWdsb2cgPSBkZWJ1ZygnZXJiYXNlJyk7XHJcbnZhciBkZWJ1Z2xvZ1YgPSBkZWJ1ZygnZXJWYmFzZScpO1xyXG52YXIgcGVyZmxvZyA9IGRlYnVnKCdwZXJmJyk7XHJcblxyXG5pbXBvcnQgeyBCcmVha0Rvd24gYXMgYnJlYWtkb3dufSAgZnJvbSAnLi4vbW9kZWwvaW5kZXhfbW9kZWwnO1xyXG5pbXBvcnQgKiBhcyBFUkVycm9yIGZyb20gJy4vZXJlcnJvcic7XHJcblxyXG5jb25zdCBBbnlPYmplY3QgPSA8YW55Pk9iamVjdDtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtb2NrRGVidWcobykge1xyXG4gIGRlYnVnbG9nID0gbztcclxuICBkZWJ1Z2xvZ1YgPSBvO1xyXG4gIHBlcmZsb2cgPSBvO1xyXG59XHJcblxyXG5cclxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnYWJvdF91dGlscyc7XHJcblxyXG5pbXBvcnQgKiBhcyBJRkVyQmFzZSBmcm9tICcuL2lmZXJiYXNlJztcclxuaW1wb3J0IHsgSUZNb2RlbCAgYXMgSU1hdGNofSAgZnJvbSAnLi4vbW9kZWwvaW5kZXhfbW9kZWwnO1xyXG5pbXBvcnQgeyBJRk1vZGVsICBhcyBJRk1vZGVsfSAgZnJvbSAnLi4vbW9kZWwvaW5kZXhfbW9kZWwnO1xyXG5cclxuXHJcblxyXG5pbXBvcnQgKiBhcyBTZW50ZW5jZSBmcm9tICcuL3NlbnRlbmNlJztcclxuXHJcbmltcG9ydCAqIGFzIFdvcmQgZnJvbSAnLi93b3JkJztcclxuXHJcbmltcG9ydCAqIGFzIEFsZ29sIGZyb20gJy4vYWxnb2wnO1xyXG5pbXBvcnQgeyBBc3NlcnRpb25FcnJvciB9IGZyb20gJ2Fzc2VydCc7XHJcbmltcG9ydCB7IElPcGVyYXRvciB9IGZyb20gJy4vaWZtYXRjaCc7XHJcblxyXG5cclxuLy9pbXBvcnQgKiBhcyBNYXRjaCBmcm9tICcuL21hdGNoJztcclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElUb2tlbml6ZWRTdHJpbmcge1xyXG4gIHRva2Vuczogc3RyaW5nW10sXHJcbiAgY2F0ZWdvcml6ZWRXb3JkczogSU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZFtdW11cclxuICBmdXNhYmxlOiBib29sZWFuW107XHJcbn1cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuLyoqXHJcbiAqIEdpdmVuIGEgIHN0cmluZywgYnJlYWsgaXQgZG93biBpbnRvIGNvbXBvbmVudHMsXHJcbiAqIFtbJ0EnLCAnQiddLCBbJ0EgQiddXVxyXG4gKlxyXG4gKiB0aGVuIGNhdGVnb3JpemVXb3Jkc1xyXG4gKiByZXR1cm5pbmdcclxuICpcclxuICogWyBbWyB7IGNhdGVnb3J5OiAnc3lzdGVtSWQnLCB3b3JkIDogJ0EnfSxcclxuICogICAgICB7IGNhdGVnb3J5OiAnb3RoZXJ0aGluZycsIHdvcmQgOiAnQSd9XHJcbiAqICAgIF0sXHJcbiAqICAgIC8vIHJlc3VsdCBvZiBCXHJcbiAqICAgIFsgeyBjYXRlZ29yeTogJ3N5c3RlbUlkJywgd29yZCA6ICdCJ30sXHJcbiAqICAgICAgeyBjYXRlZ29yeTogJ290aGVydGhpbmcnLCB3b3JkIDogJ0EnfVxyXG4gKiAgICAgIHsgY2F0ZWdvcnk6ICdhbm90aGVydHJ5cCcsIHdvcmQgOiAnQid9XHJcbiAqICAgIF1cclxuICogICBdLFxyXG4gKiBdXV1cclxuICpcclxuICpcclxuICpcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB0b2tlbml6ZVN0cmluZyhzU3RyaW5nOiBzdHJpbmcsIHJ1bGVzOiBJTWF0Y2guU3BsaXRSdWxlcyxcclxuICB3b3JkczogeyBba2V5OiBzdHJpbmddOiBBcnJheTxJTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nPiB9KVxyXG4gIDogSVRva2VuaXplZFN0cmluZyB7XHJcbiAgdmFyIGNudCA9IDA7XHJcbiAgdmFyIGZhYyA9IDE7XHJcbiAgdmFyIHRva2VucyA9IGJyZWFrZG93bi50b2tlbml6ZVN0cmluZyhzU3RyaW5nKTtcclxuICBpZiAoZGVidWdsb2cuZW5hYmxlZCkge1xyXG4gICAgZGVidWdsb2coXCJoZXJlIGJyZWFrZG93blwiICsgSlNPTi5zdHJpbmdpZnkodG9rZW5zKSk7XHJcbiAgfVxyXG4gIC8vY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodSkpO1xyXG4gIHdvcmRzID0gd29yZHMgfHwge307XHJcbiAgcGVyZmxvZygndGhpcyBtYW55IGtub3duIHdvcmRzOiAnICsgT2JqZWN0LmtleXMod29yZHMpLmxlbmd0aCk7XHJcbiAgdmFyIHJlcyA9IFtdIGFzIElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWRbXVtdO1xyXG4gIHZhciBjbnRSZWMgPSB7fTtcclxuICB2YXIgY2F0ZWdvcml6ZWRTZW50ZW5jZSA9IFtdIGFzIElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWRbXVtdO1xyXG4gIHZhciBoYXNSZWNvbWJpbmVkID0gZmFsc2U7XHJcbiAgdG9rZW5zLnRva2Vucy5mb3JFYWNoKGZ1bmN0aW9uICh0b2tlbiwgaW5kZXgpIHtcclxuICAgIHZhciBzZWVuSXQgPSBXb3JkTWF0Y2guY2F0ZWdvcml6ZUFXb3JkV2l0aE9mZnNldHModG9rZW4sIHJ1bGVzLCBzU3RyaW5nLCB3b3JkcywgY250UmVjKTtcclxuICAgIC8qIGNhbm5vdCBoYXZlIHRoaXMsIG9yIG5lZWQgdG8gYWRkIGFsbCBmcmFnbWVudCB3b3JkcyBcIlVJMiBJbnRlZ3JhdGlvblwiICBpZihzZWVuSXQubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgKi9cclxuICAgIGhhc1JlY29tYmluZWQgPSBoYXNSZWNvbWJpbmVkIHx8ICFzZWVuSXQuZXZlcnkocmVzID0+ICFyZXMucnVsZS5yYW5nZSk7XHJcbiAgICBkZWJ1Z2xvZ1YoZGVidWdsb2dWLmVuYWJsZWQgPyAoYCBjYXRlZ29yaXplZCAke3Rva2VufS8ke2luZGV4fSB0byBgICsgSlNPTi5zdHJpbmdpZnkoc2Vlbkl0KSlcclxuICAgICA6IFwiLVwiKTtcclxuICAgIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyAoYCBjYXRlZ29yaXplZCAke3Rva2VufS8ke2luZGV4fSB0byBgICtcclxuICAgIHNlZW5JdC5tYXAoIChpdCxpZHgpID0+IHsgcmV0dXJuIGAgJHtpZHh9ICAke2l0LnJ1bGUubWF0Y2hlZFN0cmluZ30vJHtpdC5ydWxlLmNhdGVnb3J5fSAgJHtpdC5ydWxlLndvcmRUeXBlfSR7aXQucnVsZS5iaXRpbmRleH0gYCB9KS5qb2luKFwiXFxuXCIpKVxyXG4gICAgIDogXCItXCIpO1xyXG4gICAgY2F0ZWdvcml6ZWRTZW50ZW5jZVtpbmRleF0gPSBzZWVuSXQ7XHJcbiAgICBjbnQgPSBjbnQgKyBzZWVuSXQubGVuZ3RoO1xyXG4gICAgZmFjID0gZmFjICogc2Vlbkl0Lmxlbmd0aDtcclxuICB9KTtcclxuICAvLyBoYXZlIHNlZW4gdGhlIHBsYWluIGNhdGVnb3JpemF0aW9uLFxyXG4gIGRlYnVnbG9nKFwiIHNlbnRlbmNlcyBcIiArIHRva2Vucy50b2tlbnMubGVuZ3RoICsgXCIgbWF0Y2hlcyBcIiArIGNudCArIFwiIGZhYzogXCIgKyBmYWMpO1xyXG4gIGlmIChkZWJ1Z2xvZy5lbmFibGVkICYmIHRva2Vucy50b2tlbnMubGVuZ3RoKSB7XHJcbiAgICBkZWJ1Z2xvZyhcImZpcnN0IG1hdGNoIFwiICsgSlNPTi5zdHJpbmdpZnkodG9rZW5zLCB1bmRlZmluZWQsIDIpKTtcclxuICB9XHJcbiAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/IGAgcHJpb3IgUmFuZ2VSdWxlICR7SlNPTi5zdHJpbmdpZnkoY2F0ZWdvcml6ZWRTZW50ZW5jZSl9IGAgOiAnLScpO1xyXG4gIGlmIChoYXNSZWNvbWJpbmVkKSB7XHJcbiAgICBldmFsdWF0ZVJhbmdlUnVsZXNUb1Bvc2l0aW9uKHRva2Vucy50b2tlbnMsIHRva2Vucy5mdXNhYmxlLCBjYXRlZ29yaXplZFNlbnRlbmNlKTtcclxuICB9XHJcbiAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/IGAgYWZ0ZXIgUmFuZ2VSdWxlICR7SlNPTi5zdHJpbmdpZnkoY2F0ZWdvcml6ZWRTZW50ZW5jZSl9IGAgOiAnLScpO1xyXG4gIHBlcmZsb2coXCIgc2VudGVuY2VzIFwiICsgdG9rZW5zLnRva2Vucy5sZW5ndGggKyBcIiAvIFwiICsgcmVzLmxlbmd0aCArIFwiIG1hdGNoZXMgXCIgKyBjbnQgKyBcIiBmYWM6IFwiICsgZmFjICsgXCIgcmVjIDogXCIgKyBKU09OLnN0cmluZ2lmeShjbnRSZWMsIHVuZGVmaW5lZCwgMikpO1xyXG4gIHJldHVybiB7XHJcbiAgICBmdXNhYmxlOiB0b2tlbnMuZnVzYWJsZSxcclxuICAgIHRva2VuczogdG9rZW5zLnRva2VucyxcclxuICAgIGNhdGVnb3JpemVkV29yZHM6IGNhdGVnb3JpemVkU2VudGVuY2VcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1NhbWVSZXMocHJlc2VudDogSU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZCwgcmVzIDogSU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZCkgIDogbnVtYmVyIHtcclxuICBpZighKChwcmVzZW50LnJ1bGUubWF0Y2hlZFN0cmluZyA9PT0gcmVzLnJ1bGUubWF0Y2hlZFN0cmluZylcclxuICAgICYmIChwcmVzZW50LnJ1bGUuY2F0ZWdvcnkgPT09IHJlcy5ydWxlLmNhdGVnb3J5KVxyXG4gICAgJiYgKHByZXNlbnQuc3BhbiA9PT0gcmVzLnNwYW4pXHJcbiAgJiYgKHByZXNlbnQucnVsZS5iaXRpbmRleCA9PT0gcmVzLnJ1bGUuYml0aW5kZXgpKSkge1xyXG4gICAgICByZXR1cm4gMDtcclxuICB9XHJcbiAgaWYocHJlc2VudC5fcmFua2luZyA8IHJlcy5fcmFua2luZykge1xyXG4gICAgcmV0dXJuIC0xO1xyXG4gIH1cclxuICByZXR1cm4gKzE7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtZXJnZUlnbm9yZU9yQXBwZW5kKHJlc3VsdCA6IElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWRbXSwgcmVzIDogSU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZCkge1xyXG4gIHZhciBpbnNlcnRpbmRleCA9IC0xO1xyXG4gIHZhciBmb3VuZE5vdGhpbmcgPSByZXN1bHQuZXZlcnkoIChwcmVzZW50LGluZGV4KSA9PiB7XHJcbiAgICB2YXIgciA9IGlzU2FtZVJlcyhwcmVzZW50LHJlcyk7XHJcbiAgICBpZiAociA8IDApIHtcclxuICAgICAgLy9jb25zb2xlLmxvZyhcIm92ZXJ3cml0aW5nIHdvcnNlIFxcblwiICsgSlNPTi5zdHJpbmdpZnkocmVzKSArICdcXG4nICsgSlNPTi5zdHJpbmdpZnkocHJlc2VudCkrICdcXG4nKTtcclxuICAgICAgcmVzdWx0W2luZGV4XSA9IHJlcztcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSBlbHNlIGlmKHIgPiAwKSB7XHJcbiAgICAgIC8vY29uc29sZS5sb2coJ3NraXBwaW5nIHByZXNlbnQnKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSk7XHJcbiAgaWYoZm91bmROb3RoaW5nKSB7XHJcbiAgICAvL2RlYnVsb2coJ3B1c2hpbmcnKTtcclxuICAgIHJlc3VsdC5wdXNoKHJlcyk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZXZhbHVhdGVSYW5nZVJ1bGVzVG9Qb3NpdGlvbih0b2tlbnM6IHN0cmluZ1tdLCBmdXNhYmxlOiBib29sZWFuW10sIGNhdGVnb3JpemVkV29yZHM6IElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWRbXVtdKSB7XHJcbiAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/IChcImV2YWx1YXRlUmFuZ2VSdWxlc1RvUG9zaXRpb24uLi4gXCIgKyBKU09OLnN0cmluZ2lmeShjYXRlZ29yaXplZFdvcmRzKSkgOiAnLScpO1xyXG4gIGNhdGVnb3JpemVkV29yZHMuZm9yRWFjaChmdW5jdGlvbiAod29yZGxpc3QsIGluZGV4KSB7XHJcbiAgICB3b3JkbGlzdC5mb3JFYWNoKGZ1bmN0aW9uICh3b3JkKSB7XHJcbiAgICAgIGlmICh3b3JkLnJ1bGUucmFuZ2UpIHtcclxuICAgICAgICAvL2NvbnNvbGUubG9nKGAgZ290IHRhcmdldGluZGV4IGZvciBSYW5nZVJ1bGVzIGV2YWx1YXRpb24gOiAke3RhcmdldEluZGV4fSAke2luZGV4fSAke2Z1c2FibGUuam9pbihcIiBcIil9YCk7XHJcbiAgICAgICAgdmFyIHRhcmdldEluZGV4ID0gYnJlYWtkb3duLmlzQ29tYmluYWJsZVJhbmdlUmV0dXJuSW5kZXgod29yZC5ydWxlLnJhbmdlLCBmdXNhYmxlLCBpbmRleCk7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyhgIGdvdCB0YXJnZXRpbmRleCBmb3IgUmFuZ2VSdWxlcyBldmFsdWF0aW9uIDogJHt0YXJnZXRJbmRleH1gKTtcclxuICAgICAgICBpZiAodGFyZ2V0SW5kZXggPj0gMCkge1xyXG4gICAgICAgICAgdmFyIGNvbWJpbmVkV29yZCA9IGJyZWFrZG93bi5jb21iaW5lVG9rZW5zKHdvcmQucnVsZS5yYW5nZSwgaW5kZXgsIHRva2Vucyk7XHJcbiAgICAgICAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKGAgdGVzdCBcIiR7Y29tYmluZWRXb3JkfVwiIGFnYWluc3QgXCIke3dvcmQucnVsZS5yYW5nZS5ydWxlLmxvd2VyY2FzZXdvcmR9XCIgJHtKU09OLnN0cmluZ2lmeSh3b3JkLnJ1bGUucmFuZ2UucnVsZSl9YCkgOiAnLScpO1xyXG4gICAgICAgICAgdmFyIHJlcyA9IFdvcmRNYXRjaC5jYXRlZ29yaXplV29yZFdpdGhPZmZzZXRXaXRoUmFua0N1dG9mZlNpbmdsZShjb21iaW5lZFdvcmQsIHdvcmQucnVsZS5yYW5nZS5ydWxlKTtcclxuICAgICAgICAgIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyAoXCIgZ290IHJlcyA6IFwiICsgSlNPTi5zdHJpbmdpZnkocmVzKSkgOiAnLScpO1xyXG4gICAgICAgICAgaWYgKHJlcykge1xyXG4gICAgICAgICAgICByZXMuc3BhbiA9IHdvcmQucnVsZS5yYW5nZS5oaWdoIC0gd29yZC5ydWxlLnJhbmdlLmxvdyArIDE7XHJcbiAgICAgICAgICAgIGNhdGVnb3JpemVkV29yZHNbdGFyZ2V0SW5kZXhdID0gY2F0ZWdvcml6ZWRXb3Jkc1t0YXJnZXRJbmRleF0uc2xpY2UoMCk7IC8vIGF2b2lkIGludmFsaWRhdGlvbiBvZiBzZWVuaXRcclxuICAgICAgICAgICAgZGVidWdsb2coYHB1c2hlZCBzdGggYXQgJHt0YXJnZXRJbmRleH1gKTtcclxuICAgICAgICAgICAgbWVyZ2VJZ25vcmVPckFwcGVuZChjYXRlZ29yaXplZFdvcmRzW3RhcmdldEluZGV4XSxyZXMpO1xyXG4gICAvLyAgICAgICAgIGNhdGVnb3JpemVkV29yZHNbdGFyZ2V0SW5kZXhdLnB1c2gocmVzKTsgLy8gY2hlY2sgdGhhdCB0aGlzIGRvZXMgbm90IGludmFsaWRhdGUgc2Vlbml0IVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbiAgLy8gZmlsdGVyIGFsbCByYW5nZSBydWxlcyAhXHJcbiAgY2F0ZWdvcml6ZWRXb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uICh3b3JkbGlzdCwgaW5kZXgpIHtcclxuICAgIGNhdGVnb3JpemVkV29yZHNbaW5kZXhdID0gd29yZGxpc3QuZmlsdGVyKHdvcmQgPT4gIXdvcmQucnVsZS5yYW5nZSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcblxyXG5cclxuXHJcbmNvbnN0IGNsb25lID0gdXRpbHMuY2xvbmVEZWVwO1xyXG5cclxuXHJcblxyXG5cclxuZnVuY3Rpb24gY29weVZlY01lbWJlcnModSkge1xyXG4gIHZhciBpID0gMDtcclxuICBmb3IgKGkgPSAwOyBpIDwgdS5sZW5ndGg7ICsraSkge1xyXG4gICAgdVtpXSA9IGNsb25lKHVbaV0pO1xyXG4gIH1cclxuICByZXR1cm4gdTtcclxufVxyXG5cclxuXHJcbi8vIHdlIGNhbiByZXBsaWNhdGUgdGhlIHRhaWwgb3IgdGhlIGhlYWQsXHJcbi8vIHdlIHJlcGxpY2F0ZSB0aGUgdGFpbCBhcyBpdCBpcyBzbWFsbGVyLlxyXG4vLyBbYSxiLGMgXVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzU3BhblZlYyh2ZWM6IEFycmF5PGFueT4sIGluZGV4OiBudW1iZXIpIHtcclxuICB2YXIgZWZmZWN0aXZlbGVuID0gdmVjLnJlZHVjZSgocHJldiwgbWVtKSA9PiBwcmV2ICs9IG1lbS5zcGFuID8gbWVtLnNwYW4gOiAxLCAwKTtcclxuICByZXR1cm4gZWZmZWN0aXZlbGVuID4gaW5kZXg7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBleHBhbmQgYW4gYXJyYXkgW1thMSxhMl0sIFtiMSxiMl0sW2NdXVxyXG4gKiBpbnRvIGFsbCBjb21iaW5hdGlvbnNcclxuICpcclxuICogIGlmIGExIGhhcyBhIHNwYW4gb2YgdGhyZWUsIHRoZSB2YXJpYXRpb25zIG9mIHRoZSBsb3dlciBsYXllciBhcmUgc2tpcHBlZFxyXG4gKlxyXG4gKiB3aXRoIHRoZSBzcGVjaWFsIHByb3BlcnR5XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZXhwYW5kVG9rZW5NYXRjaGVzVG9TZW50ZW5jZXModG9rZW5zOiBzdHJpbmdbXSwgdG9rZW5NYXRjaGVzOiBBcnJheTxBcnJheTxhbnk+Pik6IElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzIHtcclxuICByZXR1cm4gZXhwYW5kVG9rZW5NYXRjaGVzVG9TZW50ZW5jZXMyKCB0b2tlbnMsIHRva2VuTWF0Y2hlcyk7XHJcbn1cclxuIC8qXHJcbmV4cG9ydCBmdW5jdGlvbiBleHBhbmRUb2tlbk1hdGNoZXNUb1NlbnRlbmNlcyh0b2tlbnM6IHN0cmluZ1tdLCB0b2tlbk1hdGNoZXM6IEFycmF5PEFycmF5PGFueT4+KTogSU1hdGNoLklQcm9jZXNzZWRTZW50ZW5jZXMge1xyXG4gIHZhciBhID0gW107XHJcbiAgdmFyIHdvcmRNYXRjaGVzID0gW107XHJcbiAgZGVidWdsb2dWKGRlYnVnbG9nLmVuYWJsZWQgPyBKU09OLnN0cmluZ2lmeSh0b2tlbk1hdGNoZXMpIDogJy0nKTtcclxuICB0b2tlbk1hdGNoZXMuZm9yRWFjaChmdW5jdGlvbiAoYVdvcmRNYXRjaGVzLCB3b3JkSW5kZXg6IG51bWJlcikge1xyXG4gICAgd29yZE1hdGNoZXNbd29yZEluZGV4XSA9IFtdO1xyXG4gICAgYVdvcmRNYXRjaGVzLmZvckVhY2goZnVuY3Rpb24gKG9Xb3JkVmFyaWFudCwgd29yZFZhcmlhbnRJbmRleDogbnVtYmVyKSB7XHJcbiAgICAgIHdvcmRNYXRjaGVzW3dvcmRJbmRleF1bd29yZFZhcmlhbnRJbmRleF0gPSBvV29yZFZhcmlhbnQ7XHJcbiAgICB9KTtcclxuICB9KTtcclxuICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gSlNPTi5zdHJpbmdpZnkodG9rZW5NYXRjaGVzKSA6ICctJyk7XHJcbiAgdmFyIHJlc3VsdCA9IHtcclxuICAgIGVycm9yczogW10sXHJcbiAgICB0b2tlbnM6IHRva2VucyxcclxuICAgIHNlbnRlbmNlczogW11cclxuICB9IGFzIElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzO1xyXG4gIHZhciBudmVjcyA9IFtdO1xyXG4gIHZhciByZXMgPSBbW11dO1xyXG4gIC8vIHZhciBudmVjcyA9IFtdO1xyXG4gIHZhciBydmVjID0gW107XHJcbiAgZm9yICh2YXIgdG9rZW5JbmRleCA9IDA7IHRva2VuSW5kZXggPCB0b2tlbk1hdGNoZXMubGVuZ3RoOyArK3Rva2VuSW5kZXgpIHsgLy8gd29yZGcgaW5kZXgga1xyXG4gICAgLy92ZWNzIGlzIHRoZSB2ZWN0b3Igb2YgYWxsIHNvIGZhciBzZWVuIHZhcmlhbnRzIHVwIHRvIGsgbGVuZ3RoLlxyXG4gICAgdmFyIG5leHRCYXNlID0gW107XHJcbiAgICAvL2luZGVwZW5kZW50IG9mIGV4aXN0ZW5jZSBvZiBtYXRjaGVzIG9uIGxldmVsIGssIHdlIHJldGFpbiBhbGwgdmVjdG9ycyB3aGljaCBhcmUgY292ZXJlZCBieSBhIHNwYW5cclxuICAgIC8vIHdlIHNraXAgZXh0ZW5kaW5nIHRoZW0gYmVsb3dcclxuICAgIGZvciAodmFyIHUgPSAwOyB1IDwgcmVzLmxlbmd0aDsgKyt1KSB7XHJcbiAgICAgIGlmIChpc1NwYW5WZWMocmVzW3VdLCB0b2tlbkluZGV4KSkge1xyXG4gICAgICAgIG5leHRCYXNlLnB1c2gocmVzW3VdKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdmFyIGxlbk1hdGNoZXMgPSB0b2tlbk1hdGNoZXNbdG9rZW5JbmRleF0ubGVuZ3RoO1xyXG4gICAgaWYgKG5leHRCYXNlLmxlbmd0aCA9PT0gMCAmJiBsZW5NYXRjaGVzID09PSAwKSB7XHJcbiAgICAgIC8vIHRoZSB3b3JkIGF0IGluZGV4IEkgY2Fubm90IGJlIHVuZGVyc3Rvb2RcclxuICAgICAgLy9pZiAocmVzdWx0LmVycm9ycy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmVzdWx0LmVycm9ycy5wdXNoKEVSRXJyb3IubWFrZUVycm9yX05PX0tOT1dOX1dPUkQodG9rZW5JbmRleCwgdG9rZW5zKSk7XHJcbiAgICAgIC8vfVxyXG4gICAgfVxyXG4gICAgZm9yICh2YXIgbCA9IDA7IGwgPCBsZW5NYXRjaGVzOyArK2wpIHsgLy8gZm9yIGVhY2ggdmFyaWFudCBwcmVzZW50IGF0IGluZGV4IGtcclxuICAgICAgLy9kZWJ1Z2xvZyhcInZlY3Mgbm93XCIgKyBKU09OLnN0cmluZ2lmeSh2ZWNzKSk7XHJcbiAgICAgIHZhciBudmVjcyA9IFtdOyAvL3ZlY3Muc2xpY2UoKTsgLy8gY29weSB0aGUgdmVjW2ldIGJhc2UgdmVjdG9yO1xyXG4gICAgICAvL2RlYnVnbG9nKFwidmVjcyBjb3BpZWQgbm93XCIgKyBKU09OLnN0cmluZ2lmeShudmVjcykpO1xyXG4gICAgICBmb3IgKHZhciB1ID0gMDsgdSA8IHJlcy5sZW5ndGg7ICsrdSkge1xyXG4gICAgICAgIGlmICghaXNTcGFuVmVjKHJlc1t1XSwgdG9rZW5JbmRleCkpIHtcclxuICAgICAgICAgIC8vIGZvciBlYWNoIHNvIGZhciBjb25zdHJ1Y3RlZCByZXN1bHQgKG9mIGxlbmd0aCBrKSBpbiByZXNcclxuICAgICAgICAgIG52ZWNzLnB1c2gocmVzW3VdLnNsaWNlKCkpOyAvLyBtYWtlIGEgY29weSBvZiBlYWNoIHZlY3RvclxyXG4gICAgICAgICAgbnZlY3NbbnZlY3MubGVuZ3RoIC0gMV0gPSBjb3B5VmVjTWVtYmVycyhudmVjc1tudmVjcy5sZW5ndGggLSAxXSk7XHJcbiAgICAgICAgICAvLyBkZWJ1Z2xvZyhcImNvcGllZCB2ZWNzW1wiKyB1K1wiXVwiICsgSlNPTi5zdHJpbmdpZnkodmVjc1t1XSkpO1xyXG4gICAgICAgICAgbnZlY3NbbnZlY3MubGVuZ3RoIC0gMV0ucHVzaChcclxuICAgICAgICAgICAgY2xvbmUodG9rZW5NYXRjaGVzW3Rva2VuSW5kZXhdW2xdKSk7IC8vIHB1c2ggdGhlIGx0aCB2YXJpYW50XHJcbiAgICAgICAgICAvLyBkZWJ1Z2xvZyhcIm5vdyBudmVjcyBcIiArIG52ZWNzLmxlbmd0aCArIFwiIFwiICsgSlNPTi5zdHJpbmdpZnkobnZlY3MpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgLy8gICBkZWJ1Z2xvZyhcIiBhdCAgICAgXCIgKyBrICsgXCI6XCIgKyBsICsgXCIgbmV4dGJhc2UgPlwiICsgSlNPTi5zdHJpbmdpZnkobmV4dEJhc2UpKVxyXG4gICAgICAvLyAgIGRlYnVnbG9nKFwiIGFwcGVuZCBcIiArIGsgKyBcIjpcIiArIGwgKyBcIiBudmVjcyAgICA+XCIgKyBKU09OLnN0cmluZ2lmeShudmVjcykpXHJcbiAgICAgIG5leHRCYXNlID0gbmV4dEJhc2UuY29uY2F0KG52ZWNzKTtcclxuICAgICAgLy8gICBkZWJ1Z2xvZyhcIiAgcmVzdWx0IFwiICsgayArIFwiOlwiICsgbCArIFwiIG52ZWNzICAgID5cIiArIEpTT04uc3RyaW5naWZ5KG5leHRCYXNlKSlcclxuICAgIH0gLy9jb25zdHJ1XHJcbiAgICAvLyAgZGVidWdsb2coXCJub3cgYXQgXCIgKyBrICsgXCI6XCIgKyBsICsgXCIgPlwiICsgSlNPTi5zdHJpbmdpZnkobmV4dEJhc2UpKVxyXG4gICAgcmVzID0gbmV4dEJhc2U7XHJcbiAgfVxyXG4gIGRlYnVnbG9nVihkZWJ1Z2xvZ1YuZW5hYmxlZCA/IChcIkFQUEVORElORyBUTyBSRVMyI1wiICsgMCArIFwiOlwiICsgbCArIFwiID5cIiArIEpTT04uc3RyaW5naWZ5KG5leHRCYXNlKSkgOiAnLScpO1xyXG4gIHJlc3VsdC5zZW50ZW5jZXMgPSByZXM7XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuKi9cclxuXHJcbi8vIHRvZG86IGJpdGluZGV4XHJcbmV4cG9ydCBmdW5jdGlvbiBtYWtlQW55V29yZCh0b2tlbiA6IHN0cmluZykge1xyXG4gIHJldHVybiB7IHN0cmluZzogdG9rZW4sXHJcbiAgICBtYXRjaGVkU3RyaW5nOiB0b2tlbixcclxuICAgIGNhdGVnb3J5OiAnYW55JyxcclxuICAgIHJ1bGU6XHJcbiAgICAgeyBjYXRlZ29yeTogJ2FueScsXHJcbiAgICAgICB0eXBlOiAwLFxyXG4gICAgICAgd29yZDogdG9rZW4sXHJcbiAgICAgICBsb3dlcmNhc2V3b3JkOiB0b2tlbi50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgbWF0Y2hlZFN0cmluZzogdG9rZW4sXHJcbiAgICAgICBleGFjdE9ubHk6IHRydWUsXHJcbiAgICAgICBiaXRpbmRleDogNDA5NixcclxuICAgICAgIGJpdFNlbnRlbmNlQW5kOiA0MDk1LFxyXG4gICAgICAgd29yZFR5cGU6ICdBJywgLy8gSU1hdGNoLldPUkRUWVBFLkFOWSxcclxuICAgICAgIF9yYW5raW5nOiAwLjkgfSxcclxuICAgIF9yYW5raW5nOiAwLjlcclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNTdWNjZXNzb3JPcGVyYXRvcihyZXMgOiBhbnksIHRva2VuSW5kZXggOiBudW1iZXIpIDogYm9vbGVhbiB7XHJcbiAgaWYodG9rZW5JbmRleCA9PT0gMCkge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuICBpZihyZXNbcmVzLmxlbmd0aC0xXS5ydWxlICYmIHJlc1tyZXMubGVuZ3RoLTFdLnJ1bGUud29yZFR5cGUgPT09ICdPJykge1xyXG4gICAgaWYgKCBJTWF0Y2guYUFueVN1Y2Nlc3Nvck9wZXJhdG9yTmFtZXMuaW5kZXhPZihyZXNbcmVzLmxlbmd0aC0xXS5ydWxlLm1hdGNoZWRTdHJpbmcpID49IDApXHJcbiAgICB7XHJcbiAgICAgIGRlYnVnbG9nKCgpPT4nIGlzU3VjY2Vzc29yT3BlcmF0b3InICsgSlNPTi5zdHJpbmdpZnkoIHJlc1tyZXMubGVuZ3RoLTFdICkpO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIGZhbHNlO1xyXG59XHJcbi8qKlxyXG4gKiBleHBhbmQgYW4gYXJyYXkgW1thMSxhMl0sIFtiMSxiMl0sW2NdXVxyXG4gKiBpbnRvIGFsbCBjb21iaW5hdGlvbnNcclxuICpcclxuICogIGlmIGExIGhhcyBhIHNwYW4gb2YgdGhyZWUsIHRoZSB2YXJpYXRpb25zIG9mIHRoZSBsb3dlciBsYXllciBhcmUgc2tpcHBlZFxyXG4gKlxyXG4gKiB3aXRoIHRoZSBzcGVjaWFsIHByb3BlcnR5XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZXhwYW5kVG9rZW5NYXRjaGVzVG9TZW50ZW5jZXMyKHRva2Vuczogc3RyaW5nW10sIHRva2VuTWF0Y2hlczogQXJyYXk8QXJyYXk8YW55Pj4pOiBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcyB7XHJcbiAgdmFyIGEgPSBbXTtcclxuICB2YXIgd29yZE1hdGNoZXMgPSBbXTtcclxuICBkZWJ1Z2xvZ1YoZGVidWdsb2cuZW5hYmxlZCA/IEpTT04uc3RyaW5naWZ5KHRva2VuTWF0Y2hlcykgOiAnLScpO1xyXG4gIHRva2VuTWF0Y2hlcy5mb3JFYWNoKGZ1bmN0aW9uIChhV29yZE1hdGNoZXMsIHdvcmRJbmRleDogbnVtYmVyKSB7XHJcbiAgICB3b3JkTWF0Y2hlc1t3b3JkSW5kZXhdID0gW107XHJcbiAgICBhV29yZE1hdGNoZXMuZm9yRWFjaChmdW5jdGlvbiAob1dvcmRWYXJpYW50LCB3b3JkVmFyaWFudEluZGV4OiBudW1iZXIpIHtcclxuICAgICAgd29yZE1hdGNoZXNbd29yZEluZGV4XVt3b3JkVmFyaWFudEluZGV4XSA9IG9Xb3JkVmFyaWFudDtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG4gIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyBKU09OLnN0cmluZ2lmeSh0b2tlbk1hdGNoZXMpIDogJy0nKTtcclxuICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgZXJyb3JzOiBbXSxcclxuICAgIHRva2VuczogdG9rZW5zLFxyXG4gICAgc2VudGVuY2VzOiBbXVxyXG4gIH0gYXMgSU1hdGNoLklQcm9jZXNzZWRTZW50ZW5jZXM7XHJcbiAgdmFyIG52ZWNzID0gW107XHJcbiAgdmFyIHJlcyA9IFtbXV07XHJcbiAgLy8gdmFyIG52ZWNzID0gW107XHJcbiAgdmFyIHJ2ZWMgPSBbXTtcclxuICBmb3IgKHZhciB0b2tlbkluZGV4ID0gMDsgdG9rZW5JbmRleCA8IHRva2VuTWF0Y2hlcy5sZW5ndGg7ICsrdG9rZW5JbmRleCkgeyAvLyB3b3JkZyBpbmRleCBrXHJcbiAgICAvL3ZlY3MgaXMgdGhlIHZlY3RvciBvZiBhbGwgc28gZmFyIHNlZW4gdmFyaWFudHMgdXAgdG8gdG9rZW5JbmRleCBsZW5ndGguXHJcbiAgICB2YXIgbmV4dEJhc2UgPSBbXTtcclxuICAgIC8vIGluZGVwZW5kZW50IG9mIGV4aXN0ZW5jZSBvZiBtYXRjaGVzIG9uIGxldmVsIGssIHdlIHJldGFpbiBhbGwgdmVjdG9ycyB3aGljaCBhcmUgY292ZXJlZCBieSBhIHNwYW5cclxuICAgIC8vIHdlIHNraXAgZXh0ZW5kaW5nIHRoZW0gYmVsb3dcclxuICAgIGZvciAodmFyIHUgPSAwOyB1IDwgcmVzLmxlbmd0aDsgKyt1KSB7XHJcbiAgICAgIGlmIChpc1NwYW5WZWMocmVzW3VdLCB0b2tlbkluZGV4KSkge1xyXG4gICAgICAgIG5leHRCYXNlLnB1c2gocmVzW3VdKTtcclxuICAgICAgfSBlbHNlIGlmKCBpc1N1Y2Nlc3Nvck9wZXJhdG9yKHJlc1t1XSx0b2tlbkluZGV4KSkge1xyXG4gICAgICAgIHJlc1t1XS5wdXNoKG1ha2VBbnlXb3JkKHRva2Vuc1t0b2tlbkluZGV4XSkpO1xyXG4gICAgICAgIG5leHRCYXNlLnB1c2gocmVzW3VdKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gaW5kZXBlbmRlbnQgb2YgZXhpc3RlbmNlIG9mIG1hdGNoZXMgb24gbGV2ZWwgdG9rZW5JbmRleCwgd2UgZXh0ZW5kIGFsbCB2ZWN0b3JzIHdoaWNoXHJcbiAgICAvLyBhcmUgYSBzdWNjZXNzb3Igb2YgYSBiaW5hcnkgZXh0ZW5kaW5nIG9wICggbGlrZSBcInN0YXJ0aW5nIHdpdGhcIiwgXCJjb250YWluaW5nXCIgd2l0aCB0aGUgbmV4dCB0b2tlbilcclxuICAgIC8qICAgZm9yKHZhciByZXNJbmRleCA9IDA7IHJlc0luZGV4IDwgcmVzLmxlbmd0aDsgKytyZXNJbmRleCkge1xyXG4gICAgICBpZiAoaXNTdWNjZXNzb3JPcGVyYXRvcihyZXNbcmVzSW5kZXhdLCB0b2tlbkluZGV4KSkge1xyXG4gICAgICAgIHJlc1tyZXNJbmRleF0ucHVzaChtYWtlQW55V29yZCh0b2tlbnNbdG9rZW5JbmRleF0pKTtcclxuICAgICAgICBuZXh0QmFzZS5wdXNoKHJlc1tyZXNJbmRleF0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAqL1xyXG4gICAgdmFyIGxlbk1hdGNoZXMgPSB0b2tlbk1hdGNoZXNbdG9rZW5JbmRleF0ubGVuZ3RoO1xyXG4gICAgaWYgKG5leHRCYXNlLmxlbmd0aCA9PT0gMCAmJiBsZW5NYXRjaGVzID09PSAwKSB7XHJcbiAgICAgIC8vIHRoZSB3b3JkIGF0IGluZGV4IEkgY2Fubm90IGJlIHVuZGVyc3Rvb2RcclxuICAgICAgLy9pZiAocmVzdWx0LmVycm9ycy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmVzdWx0LmVycm9ycy5wdXNoKEVSRXJyb3IubWFrZUVycm9yX05PX0tOT1dOX1dPUkQodG9rZW5JbmRleCwgdG9rZW5zKSk7XHJcbiAgICAgIC8vfVxyXG4gICAgfVxyXG4gICAgZm9yICh2YXIgbCA9IDA7IGwgPCBsZW5NYXRjaGVzOyArK2wpIHsgLy8gZm9yIGVhY2ggdmFyaWFudCBwcmVzZW50IGF0IGluZGV4IGtcclxuICAgICAgLy9kZWJ1Z2xvZyhcInZlY3Mgbm93XCIgKyBKU09OLnN0cmluZ2lmeSh2ZWNzKSk7XHJcbiAgICAgIHZhciBudmVjcyA9IFtdOyAvL3ZlY3Muc2xpY2UoKTsgLy8gY29weSB0aGUgdmVjW2ldIGJhc2UgdmVjdG9yO1xyXG4gICAgICAvL2RlYnVnbG9nKFwidmVjcyBjb3BpZWQgbm93XCIgKyBKU09OLnN0cmluZ2lmeShudmVjcykpO1xyXG4gICAgICBmb3IgKHZhciB1ID0gMDsgdSA8IHJlcy5sZW5ndGg7ICsrdSkge1xyXG4gICAgICAgIGlmICghaXNTcGFuVmVjKHJlc1t1XSwgdG9rZW5JbmRleCkgJiYgIWlzU3VjY2Vzc29yT3BlcmF0b3IocmVzW3VdLHRva2VuSW5kZXgpKSB7XHJcbiAgICAgICAgICAvLyBmb3IgZWFjaCBzbyBmYXIgY29uc3RydWN0ZWQgcmVzdWx0IChvZiBsZW5ndGggaykgaW4gcmVzXHJcbiAgICAgICAgICBudmVjcy5wdXNoKHJlc1t1XS5zbGljZSgpKTsgLy8gbWFrZSBhIGNvcHkgb2YgZWFjaCB2ZWN0b3JcclxuICAgICAgICAgIG52ZWNzW252ZWNzLmxlbmd0aCAtIDFdID0gY29weVZlY01lbWJlcnMobnZlY3NbbnZlY3MubGVuZ3RoIC0gMV0pO1xyXG4gICAgICAgICAgLy8gZGVidWdsb2coXCJjb3BpZWQgdmVjc1tcIisgdStcIl1cIiArIEpTT04uc3RyaW5naWZ5KHZlY3NbdV0pKTtcclxuICAgICAgICAgIG52ZWNzW252ZWNzLmxlbmd0aCAtIDFdLnB1c2goXHJcbiAgICAgICAgICAgIGNsb25lKHRva2VuTWF0Y2hlc1t0b2tlbkluZGV4XVtsXSkpOyAvLyBwdXNoIHRoZSBsdGggdmFyaWFudFxyXG4gICAgICAgICAgLy8gZGVidWdsb2coXCJub3cgbnZlY3MgXCIgKyBudmVjcy5sZW5ndGggKyBcIiBcIiArIEpTT04uc3RyaW5naWZ5KG52ZWNzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIC8vICAgZGVidWdsb2coXCIgYXQgICAgIFwiICsgayArIFwiOlwiICsgbCArIFwiIG5leHRiYXNlID5cIiArIEpTT04uc3RyaW5naWZ5KG5leHRCYXNlKSlcclxuICAgICAgLy8gICBkZWJ1Z2xvZyhcIiBhcHBlbmQgXCIgKyBrICsgXCI6XCIgKyBsICsgXCIgbnZlY3MgICAgPlwiICsgSlNPTi5zdHJpbmdpZnkobnZlY3MpKVxyXG4gICAgICBuZXh0QmFzZSA9IG5leHRCYXNlLmNvbmNhdChudmVjcyk7XHJcbiAgICAgIC8vICAgZGVidWdsb2coXCIgIHJlc3VsdCBcIiArIGsgKyBcIjpcIiArIGwgKyBcIiBudmVjcyAgICA+XCIgKyBKU09OLnN0cmluZ2lmeShuZXh0QmFzZSkpXHJcbiAgICB9IC8vY29uc3RydVxyXG4gICAgLy8gIGRlYnVnbG9nKFwibm93IGF0IFwiICsgayArIFwiOlwiICsgbCArIFwiID5cIiArIEpTT04uc3RyaW5naWZ5KG5leHRCYXNlKSlcclxuICAgIHJlcyA9IG5leHRCYXNlO1xyXG4gIH1cclxuICBkZWJ1Z2xvZ1YoZGVidWdsb2dWLmVuYWJsZWQgPyAoXCJBUFBFTkRJTkcgVE8gUkVTMSNcIiArIDAgKyBcIjpcIiArIGwgKyBcIiA+XCIgKyBKU09OLnN0cmluZ2lmeShuZXh0QmFzZSkpIDogJy0nKTtcclxuICByZXMgPSByZXMuZmlsdGVyKCAoc2VudGVuY2UsaW5kZXgpID0+IHtcclxuICAgIHZhciBmdWxsID0gMHhGRkZGRkZGRjtcclxuICAgIC8vY29uc29sZS5sb2coYHNlbnRlbmNlICAke2luZGV4fSAgXFxuYClcclxuICAgIHJldHVybiBzZW50ZW5jZS5ldmVyeSggKHdvcmQsaW5kZXgyKSA9PiB7XHJcbiAgICAgIGlmICghd29yZC5ydWxlKVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICBmdWxsID0gKGZ1bGwgJiB3b3JkLnJ1bGUuYml0U2VudGVuY2VBbmQpO1xyXG4gICAgICAvL2NvbnNvbGUubG9nKGAgd29yZCAgJHtpbmRleDJ9ICR7ZnVsbH0gXCIke3dvcmQubWF0Y2hlZFN0cmluZ31cIiAke3dvcmQucnVsZS5iaXRTZW50ZW5jZUFuZH0gICR7dG9rZW5zW2luZGV4Ml19IFxcbmApO1xyXG4gICAgICByZXR1cm4gZnVsbCAhPT0gMCB9IClcclxuICB9KTtcclxuICByZXN1bHQuc2VudGVuY2VzID0gcmVzO1xyXG4gIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHByb2Nlc3NTdHJpbmcocXVlcnk6IHN0cmluZywgcnVsZXM6IElGTW9kZWwuU3BsaXRSdWxlcyxcclxuIHdvcmRzOiB7IFtrZXk6IHN0cmluZ106IEFycmF5PElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+IH0sXHJcbiBvcGVyYXRvcnMgOiB7IFtrZXk6c3RyaW5nXSA6IElPcGVyYXRvciB9XHJcbik6ICBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcyB7XHJcbiAgd29yZHMgPSB3b3JkcyB8fCB7fTtcclxuICBvcGVyYXRvcnMgPSBvcGVyYXRvcnMgfHwge307XHJcbiAgLy9pZighcHJvY2Vzcy5lbnYuQUJPVF9OT19URVNUMSkge1xyXG4gIHJldHVybiBwcm9jZXNzU3RyaW5nMihxdWVyeSwgcnVsZXMsIHdvcmRzLCBvcGVyYXRvcnMpO1xyXG59XHJcbiAgLypcclxuICB2YXIgdG9rZW5TdHJ1Y3QgPSB0b2tlbml6ZVN0cmluZyhxdWVyeSwgcnVsZXMsIHdvcmRzKTtcclxuICBldmFsdWF0ZVJhbmdlUnVsZXNUb1Bvc2l0aW9uKHRva2VuU3RydWN0LnRva2VucywgdG9rZW5TdHJ1Y3QuZnVzYWJsZSxcclxuICAgIHRva2VuU3RydWN0LmNhdGVnb3JpemVkV29yZHMpO1xyXG4gIGlmIChkZWJ1Z2xvZy5lbmFibGVkKSB7XHJcbiAgICBkZWJ1Z2xvZyhcIkFmdGVyIG1hdGNoZWQgXCIgKyBKU09OLnN0cmluZ2lmeSh0b2tlblN0cnVjdC5jYXRlZ29yaXplZFdvcmRzKSk7XHJcbiAgfVxyXG4gIHZhciBhU2VudGVuY2VzID0gZXhwYW5kVG9rZW5NYXRjaGVzVG9TZW50ZW5jZXModG9rZW5TdHJ1Y3QudG9rZW5zLCB0b2tlblN0cnVjdC5jYXRlZ29yaXplZFdvcmRzKTtcclxuICBpZiAoZGVidWdsb2cuZW5hYmxlZCkge1xyXG4gICAgZGVidWdsb2coXCJhZnRlciBleHBhbmRcIiArIGFTZW50ZW5jZXMuc2VudGVuY2VzLm1hcChmdW5jdGlvbiAob1NlbnRlbmNlKSB7XHJcbiAgICByZXR1cm4gU2VudGVuY2UucmFua2luZ1Byb2R1Y3Qob1NlbnRlbmNlKSArIFwiOlwiICsgU2VudGVuY2UuZHVtcE5pY2Uob1NlbnRlbmNlKTsgLy9KU09OLnN0cmluZ2lmeShvU2VudGVuY2UpO1xyXG4gICAgfSkuam9pbihcIlxcblwiKSk7XHJcbiAgfVxyXG4gIGFTZW50ZW5jZXMuc2VudGVuY2VzID0gV29yZE1hdGNoLnJlaW5Gb3JjZShhU2VudGVuY2VzLnNlbnRlbmNlcyk7XHJcbiAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcclxuICAgIGRlYnVnbG9nKFwiYWZ0ZXIgcmVpbmZvcmNlXCIgKyBhU2VudGVuY2VzLnNlbnRlbmNlcy5tYXAoZnVuY3Rpb24gKG9TZW50ZW5jZSkge1xyXG4gICAgICByZXR1cm4gU2VudGVuY2UucmFua2luZ1Byb2R1Y3Qob1NlbnRlbmNlKSArIFwiOlwiICsgSlNPTi5zdHJpbmdpZnkob1NlbnRlbmNlKTtcclxuICAgIH0pLmpvaW4oXCJcXG5cIikpO1xyXG4gIH1cclxuICByZXR1cm4gYVNlbnRlbmNlcztcclxuICAqL1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmaW5kQ2xvc2VJZGVudGljYWxzKCBtcCA6ICB7W2tleSA6IHN0cmluZ10gOiBJTWF0Y2guSVdvcmR9LCB3b3JkIDogSU1hdGNoLklXb3JkICkgOiBBcnJheTxJTWF0Y2guSVdvcmQ+XHJcbntcclxuICB2YXIgcmVzID0gW10gYXMgQXJyYXk8SU1hdGNoLklXb3JkPjtcclxuICBmb3IoIHZhciBrZXkgaW4gbXAgKVxyXG4gIHtcclxuICAgIGlmICgga2V5ID09IHdvcmQuc3RyaW5nIClcclxuICAgIHtcclxuICAgICAgcmVzLnB1c2goIG1wWyBrZXkgXSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICggQ2hhclNlcXVlbmNlLkNoYXJTZXF1ZW5jZS5pc1NhbWVPclBsdXJhbE9yVmVyeUNsb3NlKCBrZXksIHdvcmQuc3RyaW5nICkgKVxyXG4gICAge1xyXG4gICAgICByZXMucHVzaCggbXBba2V5XSApO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG4vKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgaWRlbnRpY2FsICpzb3VyY2Ugd29yZCogaXMgaW50ZXJwcmV0ZWRcclxuKiAod2l0aGluIHRoZSBzYW1lIGRvbWFpbiBhbmQgdGhlIHNhbWUgd29yZHR5cGUpXHJcbiogYXMgYSBkaWZmZXJuZW50ICAoZS5nLiBlbGVtZW50IG51bWIgaXMgb25lIGludGVycHJldGVkIGFzICdDQVQnIGVsZW1lbnQgbmFtZSwgb25jZSBhcyBDQVQgJ2VsZW1lbnQgbnVtYmVyJyBpblxyXG4qXHJcbiogZXhhbXBsZVxyXG4qIFsgJ2VsZW1lbnQgbmFtZXM9PmVsZW1lbnQgbnVtYmVyL2NhdGVnb3J5LzIgRjE2JywgICAgICAgICA8PDwgKDEpXHJcbiogICAgJ2VsZW1lbnQgbnVtYmVyPT5lbGVtZW50IG51bWJlci9jYXRlZ29yeS8yIEYxNicsXHJcbiogICAgJ2VsZW1lbnQgd2VpZ2h0PT5hdG9taWMgd2VpZ2h0L2NhdGVnb3J5LzIgRjE2JyxcclxuKiAgICAnZWxlbWVudCBuYW1lPT5lbGVtZW50IG5hbWUvY2F0ZWdvcnkvMiBGMTYnLCAgICAgICAgICAgPDw8ICgyKVxyXG4qICAgICd3aXRoPT53aXRoL2ZpbGxlciBJMjU2JyxcclxuKiAgICAnZWxlbWVudCBuYW1lPT5lbGVtZW50IG5hbWUvY2F0ZWdvcnkvMiBGMTYnLCAgICAgICAgICAgPDw8ICgzKVxyXG4qICAgJ3N0YXJ0aW5nIHdpdGg9PnN0YXJ0aW5nIHdpdGgvb3BlcmF0b3IvMiBPMjU2JyxcclxuKiAgICAnQUJDPT5BQkMvYW55IEE0MDk2JyBdLFxyXG4qXHJcbiogc2FtZSBkb21haW4gSVVQQUMgZWxlbWVudHMpXHJcbipcclxuKiAgKDEpIGRpZmZlcnMgdG8gKDIpLCgzKSBhbHRob3VnaCB0aGUgYmFzZSB3b3JkcyBhcmUgdmVyeSBzaW1pbGFyIGVsZW1lbnQgbmFtZXMsIGVsZW1lbnQgbmFtZSwgZWxlbWVudCBuYW1lIHJlc3BlY3RpdmVseVxyXG4qXHJcbiogLSBleGFjdCBtYXRjaFxyXG4qIC0gc3RlbW1pbmcgYnkgcmVtb3ZpbmcvYXBwZW5kaW5nIHRyYWxpbmcgc1xyXG4qIC0gY2xvc2VuZXNzXHJcbipcclxuKiBAcGFyYW0gc2VudGVuY2VcclxuKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzRGlzdGluY3RJbnRlcnByZXRhdGlvbkZvclNhbWUoc2VudGVuY2UgOiBJTWF0Y2guSVNlbnRlbmNlKSA6IGJvb2xlYW4ge1xyXG4gIHZhciBtcCA9IHt9IGFzIHtba2V5IDogc3RyaW5nXSA6IElNYXRjaC5JV29yZH07XHJcbiAgdmFyIHJlcyA9IHNlbnRlbmNlLmV2ZXJ5KCh3b3JkLCBpbmRleCkgPT4ge1xyXG4gICAgdmFyIHNlZW5zID0gZmluZENsb3NlSWRlbnRpY2FscyggbXAsIHdvcmQgKTtcclxuICAgIGRlYnVnbG9nKFwiIGludmVzdGlnYXRpbmcgc2VlbnMgZm9yIFwiICsgd29yZC5zdHJpbmcgKyBcIiBcIiArIEpTT04uc3RyaW5naWZ5KHNlZW5zLCB1bmRlZmluZWQsIDIpKTtcclxuICAgIGZvciggdmFyIHNlZW4gb2Ygc2VlbnMpXHJcbiAgICB7XHJcbiAgICAgIC8vdmFyIHNlZW4gPSBtcFt3b3JkLnN0cmluZ107XHJcbiAgICAgIC8qaWYoIXNlZW4pIHtcclxuICAgICAgICBtcFt3b3JkLnN0cmluZ10gPSB3b3JkO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9Ki9cclxuICAgICAgaWYoIXNlZW4ucnVsZSB8fCAhd29yZC5ydWxlKSB7XHJcbiAgICAgICAgLy9yZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmKHNlZW4ucnVsZS5iaXRpbmRleCA9PT0gd29yZC5ydWxlLmJpdGluZGV4XHJcbiAgICAgICAgJiYgc2Vlbi5ydWxlLm1hdGNoZWRTdHJpbmcgIT09IHdvcmQucnVsZS5tYXRjaGVkU3RyaW5nICl7XHJcbiAgICAgICAgICBkZWJ1Z2xvZyhcInNraXBwaW5nIHRoaXNcIiArIEpTT04uc3RyaW5naWZ5KHNlbnRlbmNlLHVuZGVmaW5lZCwyKSk7XHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGlmKCFtcFt3b3JkLnN0cmluZ10pXHJcbiAgICB7XHJcbiAgICAgIG1wW3dvcmQuc3RyaW5nXSA9IHdvcmQ7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiB9KTtcclxuIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1NhbWVDYXRlZ29yeUFuZEhpZ2hlck1hdGNoKHNlbnRlbmNlIDogSU1hdGNoLklTZW50ZW5jZSwgIGlkeG1hcCA6IHsgW2FrZXkgOiBudW1iZXJdIDogQXJyYXk8SU1hdGNoLklXb3JkPiB9KSA6IGJvb2xlYW4ge1xyXG4gIHZhciBpZHhtYXBvdGhlciA9IHt9IGFzIHsgW2FrZXkgOiBudW1iZXJdIDogQXJyYXk8SU1hdGNoLklXb3JkPiB9O1xyXG4gIHZhciBjbnQgPSAwO1xyXG4gIHZhciBwcm9kbyA9MS4wO1xyXG4gIHZhciBwcm9kID0gMS4wO1xyXG4gIE9iamVjdC5rZXlzKCBpZHhtYXAgKS5mb3JFYWNoKCAoaWR4a2V5KSA9PiB7XHJcbiAgICB2YXIgd3JkID0gaWR4bWFwW2lkeGtleV07XHJcbiAgICB2YXIgaWR4ID0gcGFyc2VJbnQoIGlkeGtleSApO1xyXG4gICAgaWYgKCBzZW50ZW5jZS5sZW5ndGggPiBpZHggKVxyXG4gICAge1xyXG4gICAgICB2YXIgd3JkbyA9IHNlbnRlbmNlW2lkeF07XHJcbiAgICAgIGlmKCB3cmRvLnN0cmluZyA9PT0gd3JkLnN0cmluZ1xyXG4gICAgICAgICYmIHdyZG8ucnVsZS5iaXRpbmRleCA9PT0gd3JkLnJ1bGUuYml0aW5kZXhcclxuICAgICAgICAmJiB3cmRvLnJ1bGUud29yZFR5cGUgPT09IHdyZC5ydWxlLndvcmRUeXBlXHJcbiAgICAgICAgJiYgd3Jkby5ydWxlLmNhdGVnb3J5ID09PSB3cmQucnVsZS5jYXRlZ29yeSApXHJcbiAgICAgIHtcclxuICAgICAgICArK2NudDtcclxuICAgICAgICBwcm9kbyA9IHByb2RvICogd3Jkby5fcmFua2luZztcclxuICAgICAgICBwcm9kID0gcHJvZCAqIHdyZC5fcmFua2luZztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG4gIGlmICggY250ID09PSBPYmplY3Qua2V5cyggaWR4bWFwICkubGVuZ3RoICYmIHByb2RvID4gcHJvZCApXHJcbiAge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG4gIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0X2l0aF9hcmcoIG9uZXBvcyA6IG51bWJlciwgb3Bwb3MgOiBudW1iZXIsIHNlbnRlbmNlOiBJTWF0Y2guSVNlbnRlbmNlLCBpbmRleCA6IG51bWJlciApIDogSU1hdGNoLklXb3JkXHJcbnsgLy8vICAgICAgICAgb3Bwb3M9MCAgICAgb3Bwb3M9LTEgICAgIG9wcG9zPS0yICAgb3Bwb3M9MVxyXG4gIC8vIDEgLT4gIDAgIC0xOyAgICAgICAgICAgMSAgICAgICAgICAgIDIgICAgICAgICAtMlxyXG4gIC8vIDIgIC0+IDEgICAxOyAgICAgICAgICAgMiAgICAgICAgICAgIDMgICAgICAgICAtMVxyXG4gIHZhciBwb3MgPSBvbmVwb3MgLSAxO1xyXG4gIGlmICggcG9zIDw9IG9wcG9zIClcclxuICAgICBwb3MgPSAtMTtcclxuICBwb3MgLT0gb3Bwb3M7XHJcbiAgdmFyIGlkeCA9IHBvcyArIGluZGV4O1xyXG4gIHJldHVybiBzZW50ZW5jZVtpZHhdO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNCYWRPcGVyYXRvckFyZ3Moc2VudGVuY2UgOiBJTWF0Y2guSVNlbnRlbmNlLCBvcGVyYXRvcnM6IElNYXRjaC5JT3BlcmF0b3JzICkgOiBib29sZWFuIHtcclxuICBpZiAoaXNOdWxsT3JFbXB0eURpY3Rpb25hcnkob3BlcmF0b3JzKSlcclxuICAgIHJldHVybiBmYWxzZTtcclxuICByZXR1cm4gIXNlbnRlbmNlLmV2ZXJ5KCAod29yZCwgaW5kZXgpID0+IHtcclxuICAgIGlmKCAgKHdvcmQucnVsZSAmJiB3b3JkLnJ1bGUud29yZFR5cGUpICE9IElNYXRjaC5XT1JEVFlQRS5PUEVSQVRPUiApXHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgdmFyIG9wID1vcGVyYXRvcnNbd29yZC5ydWxlLm1hdGNoZWRTdHJpbmddO1xyXG4gICAgaWYoICFvcClcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB2YXIgb3BlcmF0b3Jwb3MgPSBvcC5vcGVyYXRvcnBvcyB8fCAwO1xyXG4gICAgaWYgKCFvcC5hcml0eSlcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICBmb3IoIHZhciBpID0gMTsgaSA8PSBvcC5hcml0eTsgKytpKVxyXG4gICAge1xyXG4gICAgICB2YXIgaXRoX2FyZyA9IGdldF9pdGhfYXJnKCBpLCBvcGVyYXRvcnBvcyAsIHNlbnRlbmNlLCBpbmRleCApO1xyXG4gICAgICBpZiAoIWl0aF9hcmcpXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB2YXIgYXJndHlwZSA9IG9wLmFyZ2NhdGVnb3J5WyBpIC0gMV07XHJcbiAgICAgIHZhciBhcmd0eXBleCA9IGFyZ3R5cGUubWFwKCAgKHgpID0+IFdvcmQuV29yZFR5cGUuZnJvbUNhdGVnb3J5U3RyaW5nKCB4ICkpO1xyXG4gICAgICBpZiAoIGFyZ3R5cGV4LmluZGV4T2YoIGl0aF9hcmcucnVsZS53b3JkVHlwZSApIDwgMCApXHJcbiAgICAgIHtcclxuICAgICAgICBjb25zb2xlLmxvZyggXCJkaXNjYXJkaW5nIGR1ZSB0byBhcmcgXCIgKyBvcC5vcGVyYXRvciArIFwiIGFyZyAjXCIgKyBpICsgXCIgZXhwZWN0ZWRcIiArIEpTT04uc3RyaW5naWZ5KCBhcmd0eXBleCApICsgXCIgd2FzIFwiICArIGl0aF9hcmcucnVsZS53b3JkVHlwZSk7XHJcbiAgICAgICAgZGVidWdsb2coICgpPT4geyByZXR1cm4gXCJkaXNjYXJkaW5nIGR1ZSB0byBhcmcgXCIgKyBvcC5vcGVyYXRvciArIFwiIGFyZyAjXCIgKyBpICsgXCIgZXhwZWN0ZWRcIiArIEpTT04uc3RyaW5naWZ5KCBhcmd0eXBleCApICsgXCIgd2FzIFwiICArIGl0aF9hcmcucnVsZS53b3JkVHlwZTt9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0pO1xyXG59XHJcblxyXG5cclxuLyogUmV0dXJuIHRydWUgaWYgdGhlIGlkZW50aWNhbCAqdGFyZ2V0IHdvcmQqIGlzIGV4cHJlc3NlZCBieSBkaWZmZXJlbnQgc291cmNlIHdvcmRzXHJcbiogKHdpdGhpbiB0aGUgc2FtZSBkb21haW4gYW5kIHRoZSBzYW1lIHdvcmR0eXBlKVxyXG4qXHJcbiogdGhpcyBpcyBwcm9ibGVtYXRpYyB3aXRoIGFsaWFzZXMgbWFwcGVkIG9udG8gdGhlIHNhbWUgdGFyZ2V0LCAoZWcuIHdoZXJlIC0+IHdpdGgsIHdpdGggLT4gd2hlcmUgKVxyXG4qIHNvIHBlcmhhcHMgb25seSBmb3IgY2F0ZWdvcmllcyBhbmQgZmFjdHM/XHJcbipcclxuKiBleGFtcGxlIDxwcmU+XHJcbiogWyAnZWxlbWVudCBuYW1lcz0+ZWxlbWVudCBudW1iZXIvY2F0ZWdvcnkvMiBDOCcsICAgICAgICAgPDw8ICgxYSlcclxuKiAgICAnZWxlbWVudCBudW1iZXI9PmVsZW1lbnQgbnVtYmVyL2NhdGVnb3J5LzIgQzgnLCAgICAgICA8PDwgKDIpXHJcbiogICAgJ2VsZW1lbnQgd2VpZ2h0PT5hdG9taWMgd2VpZ2h0L2NhdGVnb3J5LzIgQzgnLFxyXG4qICAgICdlbGVtZW50IG5hbWU9PmVsZW1lbnQgbnVtYmVyL2NhdGVnb3J5LzIgQzgnLCAgICAgICAgICAgPDw8ICgxYilcclxuKiAgICAnd2l0aD0+d2l0aC9maWxsZXIgSTI1NicsXHJcbiogICAgJ2VsZW1lbnQgbmFtZT0+ZWxlbWVudCBudW1iZXIvY2F0ZWdvcnkvMiBDOCcsICAgICAgICAgICA8PDwgKDFjKVxyXG4qICAgICdzdGFydGluZyB3aXRoPT5zdGFydGluZyB3aXRoL29wZXJhdG9yLzIgTzI1NicsXHJcbiogICAgJ0FCQz0+QUJDL2FueSBBNDA5NicgXSxcclxuKlxyXG4qIHNhbWUgZG9tYWluIElVUEFDIGVsZW1lbnRzKVxyXG4qXHJcbiogICgxYWJjKSBkaWZmZXJzIGZyb20gKDIpLFxyXG4qICBhbmQgdGhlcmUgaXMgYSBtdWNoIGJldHRlciBpbnRlcnByZXRhdGlvbiBhcm91bmRcclxuKiA8L3ByZT5cclxuKiAtIGV4YWN0IG1hdGNoXHJcbiogLSBzdGVtbWluZyBieSByZW1vdmluZy9hcHBlbmRpbmcgdHJhbGluZyBzXHJcbiogLSBjbG9zZW5lc3NcclxuKlxyXG4qIEBwYXJhbSBzZW50ZW5jZVxyXG4qL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNOb25PcHRpbWFsRGlzdGluY3RTb3VyY2VGb3JTYW1lKHNlbnRlbmNlIDogSU1hdGNoLklTZW50ZW5jZSwgc2VudGVuY2VzIDogQXJyYXk8SU1hdGNoLklTZW50ZW5jZT4pIDogYm9vbGVhbiB7XHJcbiAgdmFyIG1wID0ge30gYXMge1trZXkgOiBzdHJpbmddIDogIHsgW2tleSA6IG51bWJlcl0gOiBBcnJheTxJTWF0Y2guSVdvcmQ+IH0gfTtcclxuICAvLyBjYWxjdWxhdGUgY29uZmxpY3RzIDogICAgW3RhZ2V0X3dvcmQgLT4gXVxyXG4gIHZhciByZXMgPSBzZW50ZW5jZS5ldmVyeSgod29yZCkgPT4ge1xyXG4gICAgaWYgKCB3b3JkLmNhdGVnb3J5ID09PSBXb3JkLkNhdGVnb3J5LkNBVF9DQVRFR09SWVxyXG4gICAgICAmJiAoICB3b3JkLnJ1bGUud29yZFR5cGUgPT09IElNYXRjaC5XT1JEVFlQRS5GQUNUXHJcbiAgICAgICAgIHx8IHdvcmQucnVsZS53b3JkVHlwZSA9PT0gSU1hdGNoLldPUkRUWVBFLkNBVEVHT1JZICkpXHJcbiAgICB7XHJcbiAgICAgIGlmICghbXBbd29yZC5ydWxlLm1hdGNoZWRTdHJpbmcgXSlcclxuICAgICAgICBtcFt3b3JkLnJ1bGUubWF0Y2hlZFN0cmluZ10gPSB7fSBhcyB7IFtrZXkgOiBudW1iZXJdIDogQXJyYXk8SU1hdGNoLklXb3JkPiB9O1xyXG4gICAgICBpZiggIW1wW3dvcmQucnVsZS5tYXRjaGVkU3RyaW5nXVt3b3JkLnJ1bGUuYml0aW5kZXhdKVxyXG4gICAgICAgIG1wW3dvcmQucnVsZS5tYXRjaGVkU3RyaW5nXVt3b3JkLnJ1bGUuYml0aW5kZXhdID0gW10gYXMgIEFycmF5PElNYXRjaC5JV29yZD47XHJcbiAgICAgIHZhciBhcnIgPSBtcFt3b3JkLnJ1bGUubWF0Y2hlZFN0cmluZ11bd29yZC5ydWxlLmJpdGluZGV4XTtcclxuICAgICAgaWYoIGFyci5sZW5ndGggPT0gMCApXHJcbiAgICAgIHtcclxuICAgICAgICBhcnIucHVzaCh3b3JkKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoICFhcnIuZXZlcnkoIChwcmVzZW50d29yZCkgPT4ge1xyXG4gICAgICAgIHJldHVybiBDaGFyU2VxdWVuY2UuQ2hhclNlcXVlbmNlLmlzU2FtZU9yUGx1cmFsT3JWZXJ5Q2xvc2UoIHdvcmQuc3RyaW5nLCBwcmVzZW50d29yZC5zdHJpbmcgKTtcclxuICAgICAgfSkpXHJcbiAgICAgIHtcclxuICAgICAgICBhcnIucHVzaCggd29yZCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyByZXRhaW4gb25seSBlbnRyaWVzIHdpdGggbW9yZSB0aGFuIG9uZSBtZW1iZXIgaW4gdGhlIGxpc3RcclxuICAgIHZhciBtcGR1cGxpY2F0ZXMgPSB7fSBhcyB7W2tleSA6IHN0cmluZ10gOiAgeyBba2V5IDogbnVtYmVyXSA6IEFycmF5PElNYXRjaC5JV29yZD4gfSB9O1xyXG4gICAgT2JqZWN0LmtleXMoIG1wICkuZm9yRWFjaCggKGtleSkgPT4ge1xyXG4gICAgICB2YXIgZW50cnkgPSBtcFtrZXldO1xyXG4gICAgICBPYmplY3Qua2V5cyggZW50cnkgKS5mb3JFYWNoKCAoa2V5Yml0aW5kZXgpID0+IHtcclxuICAgICAgICBpZiAoIGVudHJ5W2tleWJpdGluZGV4XS5sZW5ndGggPiAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlmICghbXBkdXBsaWNhdGVzW2tleV0pXHJcbiAgICAgICAgICAgIG1wZHVwbGljYXRlc1trZXldID0ge30gYXMgeyBba2V5IDogbnVtYmVyXSA6IEFycmF5PElNYXRjaC5JV29yZD4gfTtcclxuICAgICAgICAgIG1wZHVwbGljYXRlc1trZXldW2tleWJpdGluZGV4XSA9IGVudHJ5W2tleWJpdGluZGV4XTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoIG1wZHVwbGljYXRlcyApLmV2ZXJ5KCAoa2V5KSA9PiAge1xyXG4gICAgICByZXR1cm4gT2JqZWN0LmtleXMoIG1wZHVwbGljYXRlc1sga2V5IF0gKS5ldmVyeSggKCBiaSApID0+IHtcclxuICAgICAgICB2YXIgbHN0ID0gbXBkdXBsaWNhdGVzW2tleV1bYmldO1xyXG4gICAgICAgIHZhciBpZHhtYXAgPSB7fSBhcyB7IFtha2V5IDogbnVtYmVyXSA6IEFycmF5PElNYXRjaC5JV29yZD4gfTtcclxuICAgICAgICAvKiBvaywgZG8gc29tZSB3b3JrIC4uICAqL1xyXG4gICAgICAgIC8qIGZvciBldmVyeSBkdXBsaWNhdGUgd2UgY29sbGVjdCBhbiBpbmRleCAgaWR4IC0+IHdvcmQgKi9cclxuICAgICAgICBmb3IoIHZhciBhbHN0IG9mIGxzdCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdmFyIGlkeCA9IHNlbnRlbmNlLmluZGV4T2YoIGFsc3QgKTtcclxuICAgICAgICAgIGlmICggaWR4IDwgMCApXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIndvcmQgbXVzdCBiZSBmb3VuZCBpbiBzZW50ZW5jZSBcIik7XHJcbiAgICAgICAgICBpZHhtYXBbIGlkeCBdID0gYWxzdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLyogdGhlbiB3ZSBydW4gdGhyb3VnaCBhbGwgdGhlIHNlbnRlbmNlcyBpZGVudGlmeWluZyAqaWRlbnRpY2FsIHNvdXJjZSB3b3JkcyBwYWlycyxcclxuICAgICAgICAgICBpZiB3ZSBmaW5kIGEgIGEpIGRpc3RpbmN0IHNlbnRlbmNlIHdpdGhcclxuICAgICAgICAgICAgICAgICAgICAgIGIpIHNhbWUgY2F0ZWdvcmllcyBGMTYvRjE2XHJcbiAgICAgICAgICAgICAgICAgIGFuZCBjKSAqaGlnaGVyIG1hdGNoZXMqIGZvciBib3RoICwgdGhlbiB3ZSBkaXNjYXJkICp0aGlzKiBzZW50ZW5jZVxyXG4gICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgIHJldHVybiBzZW50ZW5jZXMuZXZlcnkoIChvdGhlcnNlbnRlbmNlKSA9PiB7XHJcbiAgICAgICAgICBpZiggb3RoZXJzZW50ZW5jZSA9PT0gc2VudGVuY2UgKVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgIGlmICggaXNTYW1lQ2F0ZWdvcnlBbmRIaWdoZXJNYXRjaCggb3RoZXJzZW50ZW5jZSwgaWR4bWFwKSApXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGRlYnVnbG9nKFwiIHJlbW92aW5nIHNlbnRlbmNlIHdpdGggZHVlIHRvIGhpZ2hlciBtYXRjaCBcIiArICBTZW50ZW5jZS5zaW1wbGlmeVN0cmluZ3NXaXRoQml0SW5kZXgoc2VudGVuY2UpXHJcbiAgICAgICAgICAgICsgXCIgYXMgXCIgKyBTZW50ZW5jZS5zaW1wbGlmeVN0cmluZ3NXaXRoQml0SW5kZXgoIG90aGVyc2VudGVuY2UgKSArIFwiIGFwcGVhcnMgYmV0dGVyIFwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pXHJcbiAgICB9KTtcclxuICB9KTtcclxuICBkZWJ1Z2xvZyhcIiBoZXJlIHJlcyBcIiArICFyZXMgKyBcIiBcIiArICBTZW50ZW5jZS5zaW1wbGlmeVN0cmluZ3NXaXRoQml0SW5kZXgoc2VudGVuY2UpICk7XHJcbiAgcmV0dXJuICFyZXM7XHJcbn1cclxuXHJcblxyXG4vKlxyXG4gKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgaWRlbnRpY2FsIHNvdXJjZSB3b3JkIGlzIGludGVycHJldGVkXHJcbiAqICh3aXRoaW4gdGhlIHNhbWUgZG9tYWluIGFuZCB0aGUgc2FtZSB3b3JkdHlwZSlcclxuICogYXMgYSBkaWZmZXJuZW50ICAoZS5nLiBlbGVtZW50IG51bWIgaXMgb25lIGludGVycHJldGVkIGFzICdDQVQnIGVsZW1lbnQgbmFtZSwgb25jZSBhcyBDQVQgJ2VsZW1lbnQgbnVtYmVyJyBpblxyXG4gKiBzYW1lIGRvbWFpbiBJVVBBQyBlbGVtZW50cylcclxuICpcclxuICogLSBleGFjdCBtYXRjaFxyXG4gKiAtIHN0ZW1taW5nIGJ5IHJlbW92aW5nL2FwcGVuZGluZyB0cmFsaW5nIHNcclxuICogLSBjbG9zZW5lc3NcclxuICpcclxuICogQHBhcmFtIHNlbnRlbmNlXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNEaXN0aW5jdEludGVycHJldGF0aW9uRm9yU2FtZU9MRChzZW50ZW5jZSA6IElNYXRjaC5JU2VudGVuY2UpIDogYm9vbGVhbiB7XHJcbiAgdmFyIG1wID0ge30gYXMge1trZXkgOiBzdHJpbmddIDogSU1hdGNoLklXb3JkfTtcclxuICB2YXIgcmVzID0gc2VudGVuY2UuZXZlcnkoKHdvcmQsIGluZGV4KSA9PiB7XHJcbiAgICB2YXIgc2VlbiA9IG1wW3dvcmQuc3RyaW5nXTtcclxuICAgIGlmKCFzZWVuKVxyXG4gICAgeyAvLyBleGFjdCBtYXRjaFxyXG4gICAgICAvKmlmKCB3b3JkLnN0cmluZy5sZW5ndGggPiAzICYmIHdvcmQuc3RyaW5nLmNoYXJBdCh3b3JkLnN0cmluZy5sZW5ndGggLSAxKS50b0xvd2VyQ2FzZSgpID09ICdzJylcclxuICAgICAge1xyXG5cclxuICAgICAgfVxyXG4gICAgICAqL1xyXG4gICAgfVxyXG4gICAgaWYoIXNlZW4pIHtcclxuICAgICAgbXBbd29yZC5zdHJpbmddID0gd29yZDtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBpZighc2Vlbi5ydWxlIHx8ICF3b3JkLnJ1bGUpIHtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBpZihzZWVuLnJ1bGUuYml0aW5kZXggPT09IHdvcmQucnVsZS5iaXRpbmRleFxyXG4gICAgICAmJiBzZWVuLnJ1bGUubWF0Y2hlZFN0cmluZyAhPT0gd29yZC5ydWxlLm1hdGNoZWRTdHJpbmcgKXtcclxuICAgICAgLy8gIGNvbnNvbGUubG9nKFwic2tpcHBpbmcgdGhpc1wiICsgSlNPTi5zdHJpbmdpZnkoc2VudGVuY2UsdW5kZWZpbmVkLDIpKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9KTtcclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyTm9uU2FtZUludGVycHJldGF0aW9ucyhhU2VudGVuY2VzIDogIElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzICkgOiBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcyB7XHJcbiAgdmFyIGRpc2NhcmRJbmRleCA9IFtdIGFzIEFycmF5PG51bWJlcj47XHJcbiAgdmFyIHJlcyA9IChPYmplY3QgYXMgYW55KS5hc3NpZ24oIHt9LCBhU2VudGVuY2VzICk7XHJcbiAgcmVzLnNlbnRlbmNlcyA9IGFTZW50ZW5jZXMuc2VudGVuY2VzLmZpbHRlcigoc2VudGVuY2UsaW5kZXgpID0+IHtcclxuICAgIGlmKCFpc0Rpc3RpbmN0SW50ZXJwcmV0YXRpb25Gb3JTYW1lKHNlbnRlbmNlKSkge1xyXG4gICAgICBkaXNjYXJkSW5kZXgucHVzaChpbmRleCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0pO1xyXG4gIGlmKGRpc2NhcmRJbmRleC5sZW5ndGgpIHtcclxuICAgIHJlcy5lcnJvcnMgPSBhU2VudGVuY2VzLmVycm9ycy5maWx0ZXIoIChlcnJvcixpbmRleCkgPT4ge1xyXG4gICAgICBpZihkaXNjYXJkSW5kZXguaW5kZXhPZihpbmRleCkgPj0gMCkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc051bGxPckVtcHR5RGljdGlvbmFyeShvYmopIHtcclxuICByZXR1cm4gKG9iaiA9PT0gdW5kZWZpbmVkKSB8fCAoT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDApO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlckJhZE9wZXJhdG9yQXJncyhhU2VudGVuY2VzIDogIElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzLCBvcGVyYXRvcnMgOiBJRk1vZGVsLklPcGVyYXRvcnMgKSA6IElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzIHtcclxuICBpZiAoIGlzTnVsbE9yRW1wdHlEaWN0aW9uYXJ5KG9wZXJhdG9ycykgKVxyXG4gICAgcmV0dXJuIGFTZW50ZW5jZXM7XHJcbiAgdmFyIGRpc2NhcmRJbmRleCA9IFtdIGFzIEFycmF5PG51bWJlcj47XHJcbiAgdmFyIHJlcyA9IChPYmplY3QgYXMgYW55KS5hc3NpZ24oIHt9LCBhU2VudGVuY2VzICk7XHJcbiAgcmVzLnNlbnRlbmNlcyA9IGFTZW50ZW5jZXMuc2VudGVuY2VzLmZpbHRlcigoc2VudGVuY2UsaW5kZXgpID0+IHtcclxuICAgIGlmKGlzQmFkT3BlcmF0b3JBcmdzKHNlbnRlbmNlLCBvcGVyYXRvcnMpKSB7XHJcbiAgICAgIGRpc2NhcmRJbmRleC5wdXNoKGluZGV4KTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSk7XHJcbiAgaWYoZGlzY2FyZEluZGV4Lmxlbmd0aCkge1xyXG4gICAgcmVzLmVycm9ycyA9IGFTZW50ZW5jZXMuZXJyb3JzLmZpbHRlciggKGVycm9yLGluZGV4KSA9PiB7XHJcbiAgICAgIGlmKGRpc2NhcmRJbmRleC5pbmRleE9mKGluZGV4KSA+PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHJldHVybiByZXM7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyUmV2ZXJzZU5vblNhbWVJbnRlcnByZXRhdGlvbnMoYVNlbnRlbmNlcyA6ICBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcyApIDogSU1hdGNoLklQcm9jZXNzZWRTZW50ZW5jZXMge1xyXG4gIHZhciBkaXNjYXJkSW5kZXggPSBbXSBhcyBBcnJheTxudW1iZXI+O1xyXG4gIHZhciByZXMgPSAoT2JqZWN0IGFzIGFueSkuYXNzaWduKCB7fSwgYVNlbnRlbmNlcyApO1xyXG4gIHJlcy5zZW50ZW5jZXMgPSBhU2VudGVuY2VzLnNlbnRlbmNlcy5maWx0ZXIoKHNlbnRlbmNlLGluZGV4KSA9PiB7XHJcbiAgICBpZihpc05vbk9wdGltYWxEaXN0aW5jdFNvdXJjZUZvclNhbWUoc2VudGVuY2UsIGFTZW50ZW5jZXMuc2VudGVuY2VzKSkge1xyXG4gICAgICBkaXNjYXJkSW5kZXgucHVzaChpbmRleCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0pO1xyXG4gIGlmKGRpc2NhcmRJbmRleC5sZW5ndGgpIHtcclxuICAgIHJlcy5lcnJvcnMgPSBhU2VudGVuY2VzLmVycm9ycy5maWx0ZXIoIChlcnJvcixpbmRleCkgPT4ge1xyXG4gICAgICBpZihkaXNjYXJkSW5kZXguaW5kZXhPZihpbmRleCkgPj0gMCkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcHJvY2Vzc1N0cmluZzIocXVlcnk6IHN0cmluZywgcnVsZXM6IElGTW9kZWwuU3BsaXRSdWxlcyxcclxuIHdvcmRzOiB7IFtrZXk6IHN0cmluZ106IEFycmF5PElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+IH0sXHJcbiBvcGVyYXRvcnMgOiB7IFtrZXk6c3RyaW5nXSA6IElPcGVyYXRvciB9XHJcbik6ICBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcyB7XHJcbiAgd29yZHMgPSB3b3JkcyB8fCB7fTtcclxuICB2YXIgdG9rZW5TdHJ1Y3QgPSB0b2tlbml6ZVN0cmluZyhxdWVyeSwgcnVsZXMsIHdvcmRzKTtcclxuICBkZWJ1Z2xvZygoKT0+IGB0b2tlbml6ZWQ6XFxuYCArIHRva2VuU3RydWN0LmNhdGVnb3JpemVkV29yZHMubWFwKCBzID0+IFNlbnRlbmNlLnNpbXBsaWZ5U3RyaW5nc1dpdGhCaXRJbmRleChzKS5qb2luKFwiXFxuXCIpICkuam9pbihcIlxcblwiKSk7XHJcbiAgZXZhbHVhdGVSYW5nZVJ1bGVzVG9Qb3NpdGlvbih0b2tlblN0cnVjdC50b2tlbnMsIHRva2VuU3RydWN0LmZ1c2FibGUsXHJcbiAgICB0b2tlblN0cnVjdC5jYXRlZ29yaXplZFdvcmRzKTtcclxuICBkZWJ1Z2xvZ1YoKCk9PlwiQWZ0ZXIgbWF0Y2hlZCBcIiArIEpTT04uc3RyaW5naWZ5KHRva2VuU3RydWN0LmNhdGVnb3JpemVkV29yZHMpKTtcclxuICB2YXIgYVNlbnRlbmNlcyA9IGV4cGFuZFRva2VuTWF0Y2hlc1RvU2VudGVuY2VzMih0b2tlblN0cnVjdC50b2tlbnMsIHRva2VuU3RydWN0LmNhdGVnb3JpemVkV29yZHMpO1xyXG4gIGRlYnVnbG9nKCgpID0+IFwiYWZ0ZXIgZXhwYW5kIFwiICsgYVNlbnRlbmNlcy5zZW50ZW5jZXMubWFwKGZ1bmN0aW9uIChvU2VudGVuY2UpIHtcclxuICAgIHJldHVybiBTZW50ZW5jZS5yYW5raW5nUHJvZHVjdChvU2VudGVuY2UpICsgXCI6XFxuXCIgKyBTZW50ZW5jZS5kdW1wTmljZUJpdEluZGV4ZWQob1NlbnRlbmNlKTsgLy9KU09OLnN0cmluZ2lmeShvU2VudGVuY2UpO1xyXG4gICAgfSkuam9pbihcIlxcblwiKSk7XHJcbiAgYVNlbnRlbmNlcyA9IGZpbHRlckJhZE9wZXJhdG9yQXJncyhhU2VudGVuY2VzLCBvcGVyYXRvcnMpXHJcbiAgYVNlbnRlbmNlcyA9IGZpbHRlck5vblNhbWVJbnRlcnByZXRhdGlvbnMoYVNlbnRlbmNlcyk7XHJcblxyXG4gIGFTZW50ZW5jZXMgPSBmaWx0ZXJSZXZlcnNlTm9uU2FtZUludGVycHJldGF0aW9ucyhhU2VudGVuY2VzKTtcclxuXHJcbiAgYVNlbnRlbmNlcy5zZW50ZW5jZXMgPSBXb3JkTWF0Y2gucmVpbkZvcmNlKGFTZW50ZW5jZXMuc2VudGVuY2VzKTtcclxuICBkZWJ1Z2xvZ1YoKCk9PiBcImFmdGVyIHJlaW5mb3JjZVxcblwiICsgYVNlbnRlbmNlcy5zZW50ZW5jZXMubWFwKGZ1bmN0aW9uIChvU2VudGVuY2UpIHtcclxuICAgICAgcmV0dXJuIFNlbnRlbmNlLnJhbmtpbmdQcm9kdWN0KG9TZW50ZW5jZSkgKyBcIjpcXG5cIiArIEpTT04uc3RyaW5naWZ5KG9TZW50ZW5jZSk7XHJcbiAgICB9KS5qb2luKFwiXFxuXCIpKTtcclxuICBkZWJ1Z2xvZygoKSA9PiBcImFmdGVyIHJlaW5mb3JjZVwiICsgYVNlbnRlbmNlcy5zZW50ZW5jZXMubWFwKGZ1bmN0aW9uIChvU2VudGVuY2UpIHtcclxuICAgIHJldHVybiBTZW50ZW5jZS5yYW5raW5nUHJvZHVjdChvU2VudGVuY2UpICsgXCI6XFxuXCIgKyBTZW50ZW5jZS5kdW1wTmljZUJpdEluZGV4ZWQob1NlbnRlbmNlKTsgLy9KU09OLnN0cmluZ2lmeShvU2VudGVuY2UpO1xyXG4gICAgfSkuam9pbihcIlxcblwiKSk7XHJcbiAgcmV0dXJuIGFTZW50ZW5jZXM7XHJcbn1cclxuXHJcblxyXG4iXX0=
