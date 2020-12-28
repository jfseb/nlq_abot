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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUFDLEdBQUcsQ0FBQyxVQUFVLFNBQVM7UUFDN0UsT0FBTyxRQUFRLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEtBQUssR0FBRyxRQUFRLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyw0QkFBNEI7SUFDeEgsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDakIsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQztBQTNCRCx3Q0EyQkMiLCJmaWxlIjoibWF0Y2gvZXJiYXNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqXHJcbiAqIEBtb2R1bGUgamZzZWIuZXJiYXNlXHJcbiAqIEBmaWxlIGVyYmFzZVxyXG4gKiBAY29weXJpZ2h0IChjKSAyMDE2IEdlcmQgRm9yc3RtYW5uXHJcbiAqXHJcbiAqIEJhc2ljIGRvbWFpbiBiYXNlZCBlbnRpdHkgcmVjb2duaXRpb25cclxuICpcclxuICovXHJcblxyXG5cclxuaW1wb3J0ICogYXMgV29yZE1hdGNoIGZyb20gJy4vaW5wdXRGaWx0ZXInO1xyXG5pbXBvcnQgKiBhcyBDaGFyU2VxdWVuY2UgZnJvbSAnLi9jaGFyc2VxdWVuY2UnO1xyXG5cclxuaW1wb3J0ICogYXMgZGVidWcgZnJvbSAnZGVidWdmJztcclxuXHJcblxyXG5cclxudmFyIGRlYnVnbG9nID0gZGVidWcoJ2VyYmFzZScpO1xyXG52YXIgZGVidWdsb2dWID0gZGVidWcoJ2VyVmJhc2UnKTtcclxudmFyIHBlcmZsb2cgPSBkZWJ1ZygncGVyZicpO1xyXG5cclxuaW1wb3J0IHsgQnJlYWtEb3duIGFzIGJyZWFrZG93bn0gIGZyb20gJy4uL21vZGVsL2luZGV4X21vZGVsJztcclxuaW1wb3J0ICogYXMgRVJFcnJvciBmcm9tICcuL2VyZXJyb3InO1xyXG5cclxuY29uc3QgQW55T2JqZWN0ID0gPGFueT5PYmplY3Q7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbW9ja0RlYnVnKG8pIHtcclxuICBkZWJ1Z2xvZyA9IG87XHJcbiAgZGVidWdsb2dWID0gbztcclxuICBwZXJmbG9nID0gbztcclxufVxyXG5cclxuXHJcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJ2Fib3RfdXRpbHMnO1xyXG5cclxuaW1wb3J0ICogYXMgSUZFckJhc2UgZnJvbSAnLi9pZmVyYmFzZSc7XHJcbmltcG9ydCB7IElGTW9kZWwgIGFzIElNYXRjaH0gIGZyb20gJy4uL21vZGVsL2luZGV4X21vZGVsJztcclxuaW1wb3J0IHsgSUZNb2RlbCAgYXMgSUZNb2RlbH0gIGZyb20gJy4uL21vZGVsL2luZGV4X21vZGVsJztcclxuXHJcblxyXG5cclxuaW1wb3J0ICogYXMgU2VudGVuY2UgZnJvbSAnLi9zZW50ZW5jZSc7XHJcblxyXG5pbXBvcnQgKiBhcyBXb3JkIGZyb20gJy4vd29yZCc7XHJcblxyXG5pbXBvcnQgKiBhcyBBbGdvbCBmcm9tICcuL2FsZ29sJztcclxuaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tICdhc3NlcnQnO1xyXG5pbXBvcnQgeyBJT3BlcmF0b3IgfSBmcm9tICcuL2lmbWF0Y2gnO1xyXG5cclxuXHJcbi8vaW1wb3J0ICogYXMgTWF0Y2ggZnJvbSAnLi9tYXRjaCc7XHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJVG9rZW5pemVkU3RyaW5nIHtcclxuICB0b2tlbnM6IHN0cmluZ1tdLFxyXG4gIGNhdGVnb3JpemVkV29yZHM6IElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWRbXVtdXHJcbiAgZnVzYWJsZTogYm9vbGVhbltdO1xyXG59XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbi8qKlxyXG4gKiBHaXZlbiBhICBzdHJpbmcsIGJyZWFrIGl0IGRvd24gaW50byBjb21wb25lbnRzLFxyXG4gKiBbWydBJywgJ0InXSwgWydBIEInXV1cclxuICpcclxuICogdGhlbiBjYXRlZ29yaXplV29yZHNcclxuICogcmV0dXJuaW5nXHJcbiAqXHJcbiAqIFsgW1sgeyBjYXRlZ29yeTogJ3N5c3RlbUlkJywgd29yZCA6ICdBJ30sXHJcbiAqICAgICAgeyBjYXRlZ29yeTogJ290aGVydGhpbmcnLCB3b3JkIDogJ0EnfVxyXG4gKiAgICBdLFxyXG4gKiAgICAvLyByZXN1bHQgb2YgQlxyXG4gKiAgICBbIHsgY2F0ZWdvcnk6ICdzeXN0ZW1JZCcsIHdvcmQgOiAnQid9LFxyXG4gKiAgICAgIHsgY2F0ZWdvcnk6ICdvdGhlcnRoaW5nJywgd29yZCA6ICdBJ31cclxuICogICAgICB7IGNhdGVnb3J5OiAnYW5vdGhlcnRyeXAnLCB3b3JkIDogJ0InfVxyXG4gKiAgICBdXHJcbiAqICAgXSxcclxuICogXV1dXHJcbiAqXHJcbiAqXHJcbiAqXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdG9rZW5pemVTdHJpbmcoc1N0cmluZzogc3RyaW5nLCBydWxlczogSU1hdGNoLlNwbGl0UnVsZXMsXHJcbiAgd29yZHM6IHsgW2tleTogc3RyaW5nXTogQXJyYXk8SU1hdGNoLklDYXRlZ29yaXplZFN0cmluZz4gfSlcclxuICA6IElUb2tlbml6ZWRTdHJpbmcge1xyXG4gIHZhciBjbnQgPSAwO1xyXG4gIHZhciBmYWMgPSAxO1xyXG4gIHZhciB0b2tlbnMgPSBicmVha2Rvd24udG9rZW5pemVTdHJpbmcoc1N0cmluZyk7XHJcbiAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcclxuICAgIGRlYnVnbG9nKFwiaGVyZSBicmVha2Rvd25cIiArIEpTT04uc3RyaW5naWZ5KHRva2VucykpO1xyXG4gIH1cclxuICAvL2NvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHUpKTtcclxuICB3b3JkcyA9IHdvcmRzIHx8IHt9O1xyXG4gIHBlcmZsb2coJ3RoaXMgbWFueSBrbm93biB3b3JkczogJyArIE9iamVjdC5rZXlzKHdvcmRzKS5sZW5ndGgpO1xyXG4gIHZhciByZXMgPSBbXSBhcyBJTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkW11bXTtcclxuICB2YXIgY250UmVjID0ge307XHJcbiAgdmFyIGNhdGVnb3JpemVkU2VudGVuY2UgPSBbXSBhcyBJTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkW11bXTtcclxuICB2YXIgaGFzUmVjb21iaW5lZCA9IGZhbHNlO1xyXG4gIHRva2Vucy50b2tlbnMuZm9yRWFjaChmdW5jdGlvbiAodG9rZW4sIGluZGV4KSB7XHJcbiAgICB2YXIgc2Vlbkl0ID0gV29yZE1hdGNoLmNhdGVnb3JpemVBV29yZFdpdGhPZmZzZXRzKHRva2VuLCBydWxlcywgc1N0cmluZywgd29yZHMsIGNudFJlYyk7XHJcbiAgICAvKiBjYW5ub3QgaGF2ZSB0aGlzLCBvciBuZWVkIHRvIGFkZCBhbGwgZnJhZ21lbnQgd29yZHMgXCJVSTIgSW50ZWdyYXRpb25cIiAgaWYoc2Vlbkl0Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICovXHJcbiAgICBoYXNSZWNvbWJpbmVkID0gaGFzUmVjb21iaW5lZCB8fCAhc2Vlbkl0LmV2ZXJ5KHJlcyA9PiAhcmVzLnJ1bGUucmFuZ2UpO1xyXG4gICAgZGVidWdsb2dWKGRlYnVnbG9nVi5lbmFibGVkID8gKGAgY2F0ZWdvcml6ZWQgJHt0b2tlbn0vJHtpbmRleH0gdG8gYCArIEpTT04uc3RyaW5naWZ5KHNlZW5JdCkpXHJcbiAgICAgOiBcIi1cIik7XHJcbiAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKGAgY2F0ZWdvcml6ZWQgJHt0b2tlbn0vJHtpbmRleH0gdG8gYCArXHJcbiAgICBzZWVuSXQubWFwKCAoaXQsaWR4KSA9PiB7IHJldHVybiBgICR7aWR4fSAgJHtpdC5ydWxlLm1hdGNoZWRTdHJpbmd9LyR7aXQucnVsZS5jYXRlZ29yeX0gICR7aXQucnVsZS53b3JkVHlwZX0ke2l0LnJ1bGUuYml0aW5kZXh9IGAgfSkuam9pbihcIlxcblwiKSlcclxuICAgICA6IFwiLVwiKTtcclxuICAgIGNhdGVnb3JpemVkU2VudGVuY2VbaW5kZXhdID0gc2Vlbkl0O1xyXG4gICAgY250ID0gY250ICsgc2Vlbkl0Lmxlbmd0aDtcclxuICAgIGZhYyA9IGZhYyAqIHNlZW5JdC5sZW5ndGg7XHJcbiAgfSk7XHJcbiAgLy8gaGF2ZSBzZWVuIHRoZSBwbGFpbiBjYXRlZ29yaXphdGlvbixcclxuICBkZWJ1Z2xvZyhcIiBzZW50ZW5jZXMgXCIgKyB0b2tlbnMudG9rZW5zLmxlbmd0aCArIFwiIG1hdGNoZXMgXCIgKyBjbnQgKyBcIiBmYWM6IFwiICsgZmFjKTtcclxuICBpZiAoZGVidWdsb2cuZW5hYmxlZCAmJiB0b2tlbnMudG9rZW5zLmxlbmd0aCkge1xyXG4gICAgZGVidWdsb2coXCJmaXJzdCBtYXRjaCBcIiArIEpTT04uc3RyaW5naWZ5KHRva2VucywgdW5kZWZpbmVkLCAyKSk7XHJcbiAgfVxyXG4gIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyBgIHByaW9yIFJhbmdlUnVsZSAke0pTT04uc3RyaW5naWZ5KGNhdGVnb3JpemVkU2VudGVuY2UpfSBgIDogJy0nKTtcclxuICBpZiAoaGFzUmVjb21iaW5lZCkge1xyXG4gICAgZXZhbHVhdGVSYW5nZVJ1bGVzVG9Qb3NpdGlvbih0b2tlbnMudG9rZW5zLCB0b2tlbnMuZnVzYWJsZSwgY2F0ZWdvcml6ZWRTZW50ZW5jZSk7XHJcbiAgfVxyXG4gIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyBgIGFmdGVyIFJhbmdlUnVsZSAke0pTT04uc3RyaW5naWZ5KGNhdGVnb3JpemVkU2VudGVuY2UpfSBgIDogJy0nKTtcclxuICBwZXJmbG9nKFwiIHNlbnRlbmNlcyBcIiArIHRva2Vucy50b2tlbnMubGVuZ3RoICsgXCIgLyBcIiArIHJlcy5sZW5ndGggKyBcIiBtYXRjaGVzIFwiICsgY250ICsgXCIgZmFjOiBcIiArIGZhYyArIFwiIHJlYyA6IFwiICsgSlNPTi5zdHJpbmdpZnkoY250UmVjLCB1bmRlZmluZWQsIDIpKTtcclxuICByZXR1cm4ge1xyXG4gICAgZnVzYWJsZTogdG9rZW5zLmZ1c2FibGUsXHJcbiAgICB0b2tlbnM6IHRva2Vucy50b2tlbnMsXHJcbiAgICBjYXRlZ29yaXplZFdvcmRzOiBjYXRlZ29yaXplZFNlbnRlbmNlXHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNTYW1lUmVzKHByZXNlbnQ6IElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWQsIHJlcyA6IElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWQpICA6IG51bWJlciB7XHJcbiAgaWYoISgocHJlc2VudC5ydWxlLm1hdGNoZWRTdHJpbmcgPT09IHJlcy5ydWxlLm1hdGNoZWRTdHJpbmcpXHJcbiAgICAmJiAocHJlc2VudC5ydWxlLmNhdGVnb3J5ID09PSByZXMucnVsZS5jYXRlZ29yeSlcclxuICAgICYmIChwcmVzZW50LnNwYW4gPT09IHJlcy5zcGFuKVxyXG4gICYmIChwcmVzZW50LnJ1bGUuYml0aW5kZXggPT09IHJlcy5ydWxlLmJpdGluZGV4KSkpIHtcclxuICAgICAgcmV0dXJuIDA7XHJcbiAgfVxyXG4gIGlmKHByZXNlbnQuX3JhbmtpbmcgPCByZXMuX3JhbmtpbmcpIHtcclxuICAgIHJldHVybiAtMTtcclxuICB9XHJcbiAgcmV0dXJuICsxO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VJZ25vcmVPckFwcGVuZChyZXN1bHQgOiBJTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkW10sIHJlcyA6IElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmdSYW5nZWQpIHtcclxuICB2YXIgaW5zZXJ0aW5kZXggPSAtMTtcclxuICB2YXIgZm91bmROb3RoaW5nID0gcmVzdWx0LmV2ZXJ5KCAocHJlc2VudCxpbmRleCkgPT4ge1xyXG4gICAgdmFyIHIgPSBpc1NhbWVSZXMocHJlc2VudCxyZXMpO1xyXG4gICAgaWYgKHIgPCAwKSB7XHJcbiAgICAgIC8vY29uc29sZS5sb2coXCJvdmVyd3JpdGluZyB3b3JzZSBcXG5cIiArIEpTT04uc3RyaW5naWZ5KHJlcykgKyAnXFxuJyArIEpTT04uc3RyaW5naWZ5KHByZXNlbnQpKyAnXFxuJyk7XHJcbiAgICAgIHJlc3VsdFtpbmRleF0gPSByZXM7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0gZWxzZSBpZihyID4gMCkge1xyXG4gICAgICAvL2NvbnNvbGUubG9nKCdza2lwcGluZyBwcmVzZW50Jyk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0pO1xyXG4gIGlmKGZvdW5kTm90aGluZykge1xyXG4gICAgLy9kZWJ1bG9nKCdwdXNoaW5nJyk7XHJcbiAgICByZXN1bHQucHVzaChyZXMpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGV2YWx1YXRlUmFuZ2VSdWxlc1RvUG9zaXRpb24odG9rZW5zOiBzdHJpbmdbXSwgZnVzYWJsZTogYm9vbGVhbltdLCBjYXRlZ29yaXplZFdvcmRzOiBJTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkW11bXSkge1xyXG4gIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyAoXCJldmFsdWF0ZVJhbmdlUnVsZXNUb1Bvc2l0aW9uLi4uIFwiICsgSlNPTi5zdHJpbmdpZnkoY2F0ZWdvcml6ZWRXb3JkcykpIDogJy0nKTtcclxuICBjYXRlZ29yaXplZFdvcmRzLmZvckVhY2goZnVuY3Rpb24gKHdvcmRsaXN0LCBpbmRleCkge1xyXG4gICAgd29yZGxpc3QuZm9yRWFjaChmdW5jdGlvbiAod29yZCkge1xyXG4gICAgICBpZiAod29yZC5ydWxlLnJhbmdlKSB7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyhgIGdvdCB0YXJnZXRpbmRleCBmb3IgUmFuZ2VSdWxlcyBldmFsdWF0aW9uIDogJHt0YXJnZXRJbmRleH0gJHtpbmRleH0gJHtmdXNhYmxlLmpvaW4oXCIgXCIpfWApO1xyXG4gICAgICAgIHZhciB0YXJnZXRJbmRleCA9IGJyZWFrZG93bi5pc0NvbWJpbmFibGVSYW5nZVJldHVybkluZGV4KHdvcmQucnVsZS5yYW5nZSwgZnVzYWJsZSwgaW5kZXgpO1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coYCBnb3QgdGFyZ2V0aW5kZXggZm9yIFJhbmdlUnVsZXMgZXZhbHVhdGlvbiA6ICR7dGFyZ2V0SW5kZXh9YCk7XHJcbiAgICAgICAgaWYgKHRhcmdldEluZGV4ID49IDApIHtcclxuICAgICAgICAgIHZhciBjb21iaW5lZFdvcmQgPSBicmVha2Rvd24uY29tYmluZVRva2Vucyh3b3JkLnJ1bGUucmFuZ2UsIGluZGV4LCB0b2tlbnMpO1xyXG4gICAgICAgICAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/IChgIHRlc3QgXCIke2NvbWJpbmVkV29yZH1cIiBhZ2FpbnN0IFwiJHt3b3JkLnJ1bGUucmFuZ2UucnVsZS5sb3dlcmNhc2V3b3JkfVwiICR7SlNPTi5zdHJpbmdpZnkod29yZC5ydWxlLnJhbmdlLnJ1bGUpfWApIDogJy0nKTtcclxuICAgICAgICAgIHZhciByZXMgPSBXb3JkTWF0Y2guY2F0ZWdvcml6ZVdvcmRXaXRoT2Zmc2V0V2l0aFJhbmtDdXRvZmZTaW5nbGUoY29tYmluZWRXb3JkLCB3b3JkLnJ1bGUucmFuZ2UucnVsZSk7XHJcbiAgICAgICAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKFwiIGdvdCByZXMgOiBcIiArIEpTT04uc3RyaW5naWZ5KHJlcykpIDogJy0nKTtcclxuICAgICAgICAgIGlmIChyZXMpIHtcclxuICAgICAgICAgICAgcmVzLnNwYW4gPSB3b3JkLnJ1bGUucmFuZ2UuaGlnaCAtIHdvcmQucnVsZS5yYW5nZS5sb3cgKyAxO1xyXG4gICAgICAgICAgICBjYXRlZ29yaXplZFdvcmRzW3RhcmdldEluZGV4XSA9IGNhdGVnb3JpemVkV29yZHNbdGFyZ2V0SW5kZXhdLnNsaWNlKDApOyAvLyBhdm9pZCBpbnZhbGlkYXRpb24gb2Ygc2Vlbml0XHJcbiAgICAgICAgICAgIGRlYnVnbG9nKGBwdXNoZWQgc3RoIGF0ICR7dGFyZ2V0SW5kZXh9YCk7XHJcbiAgICAgICAgICAgIG1lcmdlSWdub3JlT3JBcHBlbmQoY2F0ZWdvcml6ZWRXb3Jkc1t0YXJnZXRJbmRleF0scmVzKTtcclxuICAgLy8gICAgICAgICBjYXRlZ29yaXplZFdvcmRzW3RhcmdldEluZGV4XS5wdXNoKHJlcyk7IC8vIGNoZWNrIHRoYXQgdGhpcyBkb2VzIG5vdCBpbnZhbGlkYXRlIHNlZW5pdCFcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0pO1xyXG4gIC8vIGZpbHRlciBhbGwgcmFuZ2UgcnVsZXMgIVxyXG4gIGNhdGVnb3JpemVkV29yZHMuZm9yRWFjaChmdW5jdGlvbiAod29yZGxpc3QsIGluZGV4KSB7XHJcbiAgICBjYXRlZ29yaXplZFdvcmRzW2luZGV4XSA9IHdvcmRsaXN0LmZpbHRlcih3b3JkID0+ICF3b3JkLnJ1bGUucmFuZ2UpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5cclxuXHJcblxyXG5jb25zdCBjbG9uZSA9IHV0aWxzLmNsb25lRGVlcDtcclxuXHJcblxyXG5cclxuXHJcbmZ1bmN0aW9uIGNvcHlWZWNNZW1iZXJzKHUpIHtcclxuICB2YXIgaSA9IDA7XHJcbiAgZm9yIChpID0gMDsgaSA8IHUubGVuZ3RoOyArK2kpIHtcclxuICAgIHVbaV0gPSBjbG9uZSh1W2ldKTtcclxuICB9XHJcbiAgcmV0dXJuIHU7XHJcbn1cclxuXHJcblxyXG4vLyB3ZSBjYW4gcmVwbGljYXRlIHRoZSB0YWlsIG9yIHRoZSBoZWFkLFxyXG4vLyB3ZSByZXBsaWNhdGUgdGhlIHRhaWwgYXMgaXQgaXMgc21hbGxlci5cclxuLy8gW2EsYixjIF1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1NwYW5WZWModmVjOiBBcnJheTxhbnk+LCBpbmRleDogbnVtYmVyKSB7XHJcbiAgdmFyIGVmZmVjdGl2ZWxlbiA9IHZlYy5yZWR1Y2UoKHByZXYsIG1lbSkgPT4gcHJldiArPSBtZW0uc3BhbiA/IG1lbS5zcGFuIDogMSwgMCk7XHJcbiAgcmV0dXJuIGVmZmVjdGl2ZWxlbiA+IGluZGV4O1xyXG59XHJcblxyXG4vKipcclxuICogZXhwYW5kIGFuIGFycmF5IFtbYTEsYTJdLCBbYjEsYjJdLFtjXV1cclxuICogaW50byBhbGwgY29tYmluYXRpb25zXHJcbiAqXHJcbiAqICBpZiBhMSBoYXMgYSBzcGFuIG9mIHRocmVlLCB0aGUgdmFyaWF0aW9ucyBvZiB0aGUgbG93ZXIgbGF5ZXIgYXJlIHNraXBwZWRcclxuICpcclxuICogd2l0aCB0aGUgc3BlY2lhbCBwcm9wZXJ0eVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGV4cGFuZFRva2VuTWF0Y2hlc1RvU2VudGVuY2VzKHRva2Vuczogc3RyaW5nW10sIHRva2VuTWF0Y2hlczogQXJyYXk8QXJyYXk8YW55Pj4pOiBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcyB7XHJcbiAgcmV0dXJuIGV4cGFuZFRva2VuTWF0Y2hlc1RvU2VudGVuY2VzMiggdG9rZW5zLCB0b2tlbk1hdGNoZXMpO1xyXG59XHJcbiAvKlxyXG5leHBvcnQgZnVuY3Rpb24gZXhwYW5kVG9rZW5NYXRjaGVzVG9TZW50ZW5jZXModG9rZW5zOiBzdHJpbmdbXSwgdG9rZW5NYXRjaGVzOiBBcnJheTxBcnJheTxhbnk+Pik6IElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzIHtcclxuICB2YXIgYSA9IFtdO1xyXG4gIHZhciB3b3JkTWF0Y2hlcyA9IFtdO1xyXG4gIGRlYnVnbG9nVihkZWJ1Z2xvZy5lbmFibGVkID8gSlNPTi5zdHJpbmdpZnkodG9rZW5NYXRjaGVzKSA6ICctJyk7XHJcbiAgdG9rZW5NYXRjaGVzLmZvckVhY2goZnVuY3Rpb24gKGFXb3JkTWF0Y2hlcywgd29yZEluZGV4OiBudW1iZXIpIHtcclxuICAgIHdvcmRNYXRjaGVzW3dvcmRJbmRleF0gPSBbXTtcclxuICAgIGFXb3JkTWF0Y2hlcy5mb3JFYWNoKGZ1bmN0aW9uIChvV29yZFZhcmlhbnQsIHdvcmRWYXJpYW50SW5kZXg6IG51bWJlcikge1xyXG4gICAgICB3b3JkTWF0Y2hlc1t3b3JkSW5kZXhdW3dvcmRWYXJpYW50SW5kZXhdID0gb1dvcmRWYXJpYW50O1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbiAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/IEpTT04uc3RyaW5naWZ5KHRva2VuTWF0Y2hlcykgOiAnLScpO1xyXG4gIHZhciByZXN1bHQgPSB7XHJcbiAgICBlcnJvcnM6IFtdLFxyXG4gICAgdG9rZW5zOiB0b2tlbnMsXHJcbiAgICBzZW50ZW5jZXM6IFtdXHJcbiAgfSBhcyBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcztcclxuICB2YXIgbnZlY3MgPSBbXTtcclxuICB2YXIgcmVzID0gW1tdXTtcclxuICAvLyB2YXIgbnZlY3MgPSBbXTtcclxuICB2YXIgcnZlYyA9IFtdO1xyXG4gIGZvciAodmFyIHRva2VuSW5kZXggPSAwOyB0b2tlbkluZGV4IDwgdG9rZW5NYXRjaGVzLmxlbmd0aDsgKyt0b2tlbkluZGV4KSB7IC8vIHdvcmRnIGluZGV4IGtcclxuICAgIC8vdmVjcyBpcyB0aGUgdmVjdG9yIG9mIGFsbCBzbyBmYXIgc2VlbiB2YXJpYW50cyB1cCB0byBrIGxlbmd0aC5cclxuICAgIHZhciBuZXh0QmFzZSA9IFtdO1xyXG4gICAgLy9pbmRlcGVuZGVudCBvZiBleGlzdGVuY2Ugb2YgbWF0Y2hlcyBvbiBsZXZlbCBrLCB3ZSByZXRhaW4gYWxsIHZlY3RvcnMgd2hpY2ggYXJlIGNvdmVyZWQgYnkgYSBzcGFuXHJcbiAgICAvLyB3ZSBza2lwIGV4dGVuZGluZyB0aGVtIGJlbG93XHJcbiAgICBmb3IgKHZhciB1ID0gMDsgdSA8IHJlcy5sZW5ndGg7ICsrdSkge1xyXG4gICAgICBpZiAoaXNTcGFuVmVjKHJlc1t1XSwgdG9rZW5JbmRleCkpIHtcclxuICAgICAgICBuZXh0QmFzZS5wdXNoKHJlc1t1XSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHZhciBsZW5NYXRjaGVzID0gdG9rZW5NYXRjaGVzW3Rva2VuSW5kZXhdLmxlbmd0aDtcclxuICAgIGlmIChuZXh0QmFzZS5sZW5ndGggPT09IDAgJiYgbGVuTWF0Y2hlcyA9PT0gMCkge1xyXG4gICAgICAvLyB0aGUgd29yZCBhdCBpbmRleCBJIGNhbm5vdCBiZSB1bmRlcnN0b29kXHJcbiAgICAgIC8vaWYgKHJlc3VsdC5lcnJvcnMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJlc3VsdC5lcnJvcnMucHVzaChFUkVycm9yLm1ha2VFcnJvcl9OT19LTk9XTl9XT1JEKHRva2VuSW5kZXgsIHRva2VucykpO1xyXG4gICAgICAvL31cclxuICAgIH1cclxuICAgIGZvciAodmFyIGwgPSAwOyBsIDwgbGVuTWF0Y2hlczsgKytsKSB7IC8vIGZvciBlYWNoIHZhcmlhbnQgcHJlc2VudCBhdCBpbmRleCBrXHJcbiAgICAgIC8vZGVidWdsb2coXCJ2ZWNzIG5vd1wiICsgSlNPTi5zdHJpbmdpZnkodmVjcykpO1xyXG4gICAgICB2YXIgbnZlY3MgPSBbXTsgLy92ZWNzLnNsaWNlKCk7IC8vIGNvcHkgdGhlIHZlY1tpXSBiYXNlIHZlY3RvcjtcclxuICAgICAgLy9kZWJ1Z2xvZyhcInZlY3MgY29waWVkIG5vd1wiICsgSlNPTi5zdHJpbmdpZnkobnZlY3MpKTtcclxuICAgICAgZm9yICh2YXIgdSA9IDA7IHUgPCByZXMubGVuZ3RoOyArK3UpIHtcclxuICAgICAgICBpZiAoIWlzU3BhblZlYyhyZXNbdV0sIHRva2VuSW5kZXgpKSB7XHJcbiAgICAgICAgICAvLyBmb3IgZWFjaCBzbyBmYXIgY29uc3RydWN0ZWQgcmVzdWx0IChvZiBsZW5ndGggaykgaW4gcmVzXHJcbiAgICAgICAgICBudmVjcy5wdXNoKHJlc1t1XS5zbGljZSgpKTsgLy8gbWFrZSBhIGNvcHkgb2YgZWFjaCB2ZWN0b3JcclxuICAgICAgICAgIG52ZWNzW252ZWNzLmxlbmd0aCAtIDFdID0gY29weVZlY01lbWJlcnMobnZlY3NbbnZlY3MubGVuZ3RoIC0gMV0pO1xyXG4gICAgICAgICAgLy8gZGVidWdsb2coXCJjb3BpZWQgdmVjc1tcIisgdStcIl1cIiArIEpTT04uc3RyaW5naWZ5KHZlY3NbdV0pKTtcclxuICAgICAgICAgIG52ZWNzW252ZWNzLmxlbmd0aCAtIDFdLnB1c2goXHJcbiAgICAgICAgICAgIGNsb25lKHRva2VuTWF0Y2hlc1t0b2tlbkluZGV4XVtsXSkpOyAvLyBwdXNoIHRoZSBsdGggdmFyaWFudFxyXG4gICAgICAgICAgLy8gZGVidWdsb2coXCJub3cgbnZlY3MgXCIgKyBudmVjcy5sZW5ndGggKyBcIiBcIiArIEpTT04uc3RyaW5naWZ5KG52ZWNzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIC8vICAgZGVidWdsb2coXCIgYXQgICAgIFwiICsgayArIFwiOlwiICsgbCArIFwiIG5leHRiYXNlID5cIiArIEpTT04uc3RyaW5naWZ5KG5leHRCYXNlKSlcclxuICAgICAgLy8gICBkZWJ1Z2xvZyhcIiBhcHBlbmQgXCIgKyBrICsgXCI6XCIgKyBsICsgXCIgbnZlY3MgICAgPlwiICsgSlNPTi5zdHJpbmdpZnkobnZlY3MpKVxyXG4gICAgICBuZXh0QmFzZSA9IG5leHRCYXNlLmNvbmNhdChudmVjcyk7XHJcbiAgICAgIC8vICAgZGVidWdsb2coXCIgIHJlc3VsdCBcIiArIGsgKyBcIjpcIiArIGwgKyBcIiBudmVjcyAgICA+XCIgKyBKU09OLnN0cmluZ2lmeShuZXh0QmFzZSkpXHJcbiAgICB9IC8vY29uc3RydVxyXG4gICAgLy8gIGRlYnVnbG9nKFwibm93IGF0IFwiICsgayArIFwiOlwiICsgbCArIFwiID5cIiArIEpTT04uc3RyaW5naWZ5KG5leHRCYXNlKSlcclxuICAgIHJlcyA9IG5leHRCYXNlO1xyXG4gIH1cclxuICBkZWJ1Z2xvZ1YoZGVidWdsb2dWLmVuYWJsZWQgPyAoXCJBUFBFTkRJTkcgVE8gUkVTMiNcIiArIDAgKyBcIjpcIiArIGwgKyBcIiA+XCIgKyBKU09OLnN0cmluZ2lmeShuZXh0QmFzZSkpIDogJy0nKTtcclxuICByZXN1bHQuc2VudGVuY2VzID0gcmVzO1xyXG4gIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbiovXHJcblxyXG4vLyB0b2RvOiBiaXRpbmRleFxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZUFueVdvcmQodG9rZW4gOiBzdHJpbmcpIHtcclxuICByZXR1cm4geyBzdHJpbmc6IHRva2VuLFxyXG4gICAgbWF0Y2hlZFN0cmluZzogdG9rZW4sXHJcbiAgICBjYXRlZ29yeTogJ2FueScsXHJcbiAgICBydWxlOlxyXG4gICAgIHsgY2F0ZWdvcnk6ICdhbnknLFxyXG4gICAgICAgdHlwZTogMCxcclxuICAgICAgIHdvcmQ6IHRva2VuLFxyXG4gICAgICAgbG93ZXJjYXNld29yZDogdG9rZW4udG9Mb3dlckNhc2UoKSxcclxuICAgICAgIG1hdGNoZWRTdHJpbmc6IHRva2VuLFxyXG4gICAgICAgZXhhY3RPbmx5OiB0cnVlLFxyXG4gICAgICAgYml0aW5kZXg6IDQwOTYsXHJcbiAgICAgICBiaXRTZW50ZW5jZUFuZDogNDA5NSxcclxuICAgICAgIHdvcmRUeXBlOiAnQScsIC8vIElNYXRjaC5XT1JEVFlQRS5BTlksXHJcbiAgICAgICBfcmFua2luZzogMC45IH0sXHJcbiAgICBfcmFua2luZzogMC45XHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzU3VjY2Vzc29yT3BlcmF0b3IocmVzIDogYW55LCB0b2tlbkluZGV4IDogbnVtYmVyKSA6IGJvb2xlYW4ge1xyXG4gIGlmKHRva2VuSW5kZXggPT09IDApIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbiAgaWYocmVzW3Jlcy5sZW5ndGgtMV0ucnVsZSAmJiByZXNbcmVzLmxlbmd0aC0xXS5ydWxlLndvcmRUeXBlID09PSAnTycpIHtcclxuICAgIGlmICggSU1hdGNoLmFBbnlTdWNjZXNzb3JPcGVyYXRvck5hbWVzLmluZGV4T2YocmVzW3Jlcy5sZW5ndGgtMV0ucnVsZS5tYXRjaGVkU3RyaW5nKSA+PSAwKVxyXG4gICAge1xyXG4gICAgICBkZWJ1Z2xvZygoKT0+JyBpc1N1Y2Nlc3Nvck9wZXJhdG9yJyArIEpTT04uc3RyaW5naWZ5KCByZXNbcmVzLmxlbmd0aC0xXSApKTtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBmYWxzZTtcclxufVxyXG4vKipcclxuICogZXhwYW5kIGFuIGFycmF5IFtbYTEsYTJdLCBbYjEsYjJdLFtjXV1cclxuICogaW50byBhbGwgY29tYmluYXRpb25zXHJcbiAqXHJcbiAqICBpZiBhMSBoYXMgYSBzcGFuIG9mIHRocmVlLCB0aGUgdmFyaWF0aW9ucyBvZiB0aGUgbG93ZXIgbGF5ZXIgYXJlIHNraXBwZWRcclxuICpcclxuICogd2l0aCB0aGUgc3BlY2lhbCBwcm9wZXJ0eVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGV4cGFuZFRva2VuTWF0Y2hlc1RvU2VudGVuY2VzMih0b2tlbnM6IHN0cmluZ1tdLCB0b2tlbk1hdGNoZXM6IEFycmF5PEFycmF5PGFueT4+KTogSU1hdGNoLklQcm9jZXNzZWRTZW50ZW5jZXMge1xyXG4gIHZhciBhID0gW107XHJcbiAgdmFyIHdvcmRNYXRjaGVzID0gW107XHJcbiAgZGVidWdsb2dWKGRlYnVnbG9nLmVuYWJsZWQgPyBKU09OLnN0cmluZ2lmeSh0b2tlbk1hdGNoZXMpIDogJy0nKTtcclxuICB0b2tlbk1hdGNoZXMuZm9yRWFjaChmdW5jdGlvbiAoYVdvcmRNYXRjaGVzLCB3b3JkSW5kZXg6IG51bWJlcikge1xyXG4gICAgd29yZE1hdGNoZXNbd29yZEluZGV4XSA9IFtdO1xyXG4gICAgYVdvcmRNYXRjaGVzLmZvckVhY2goZnVuY3Rpb24gKG9Xb3JkVmFyaWFudCwgd29yZFZhcmlhbnRJbmRleDogbnVtYmVyKSB7XHJcbiAgICAgIHdvcmRNYXRjaGVzW3dvcmRJbmRleF1bd29yZFZhcmlhbnRJbmRleF0gPSBvV29yZFZhcmlhbnQ7XHJcbiAgICB9KTtcclxuICB9KTtcclxuICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gSlNPTi5zdHJpbmdpZnkodG9rZW5NYXRjaGVzKSA6ICctJyk7XHJcbiAgdmFyIHJlc3VsdCA9IHtcclxuICAgIGVycm9yczogW10sXHJcbiAgICB0b2tlbnM6IHRva2VucyxcclxuICAgIHNlbnRlbmNlczogW11cclxuICB9IGFzIElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzO1xyXG4gIHZhciBudmVjcyA9IFtdO1xyXG4gIHZhciByZXMgPSBbW11dO1xyXG4gIC8vIHZhciBudmVjcyA9IFtdO1xyXG4gIHZhciBydmVjID0gW107XHJcbiAgZm9yICh2YXIgdG9rZW5JbmRleCA9IDA7IHRva2VuSW5kZXggPCB0b2tlbk1hdGNoZXMubGVuZ3RoOyArK3Rva2VuSW5kZXgpIHsgLy8gd29yZGcgaW5kZXgga1xyXG4gICAgLy92ZWNzIGlzIHRoZSB2ZWN0b3Igb2YgYWxsIHNvIGZhciBzZWVuIHZhcmlhbnRzIHVwIHRvIHRva2VuSW5kZXggbGVuZ3RoLlxyXG4gICAgdmFyIG5leHRCYXNlID0gW107XHJcbiAgICAvLyBpbmRlcGVuZGVudCBvZiBleGlzdGVuY2Ugb2YgbWF0Y2hlcyBvbiBsZXZlbCBrLCB3ZSByZXRhaW4gYWxsIHZlY3RvcnMgd2hpY2ggYXJlIGNvdmVyZWQgYnkgYSBzcGFuXHJcbiAgICAvLyB3ZSBza2lwIGV4dGVuZGluZyB0aGVtIGJlbG93XHJcbiAgICBmb3IgKHZhciB1ID0gMDsgdSA8IHJlcy5sZW5ndGg7ICsrdSkge1xyXG4gICAgICBpZiAoaXNTcGFuVmVjKHJlc1t1XSwgdG9rZW5JbmRleCkpIHtcclxuICAgICAgICBuZXh0QmFzZS5wdXNoKHJlc1t1XSk7XHJcbiAgICAgIH0gZWxzZSBpZiggaXNTdWNjZXNzb3JPcGVyYXRvcihyZXNbdV0sdG9rZW5JbmRleCkpIHtcclxuICAgICAgICByZXNbdV0ucHVzaChtYWtlQW55V29yZCh0b2tlbnNbdG9rZW5JbmRleF0pKTtcclxuICAgICAgICBuZXh0QmFzZS5wdXNoKHJlc1t1XSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIGluZGVwZW5kZW50IG9mIGV4aXN0ZW5jZSBvZiBtYXRjaGVzIG9uIGxldmVsIHRva2VuSW5kZXgsIHdlIGV4dGVuZCBhbGwgdmVjdG9ycyB3aGljaFxyXG4gICAgLy8gYXJlIGEgc3VjY2Vzc29yIG9mIGEgYmluYXJ5IGV4dGVuZGluZyBvcCAoIGxpa2UgXCJzdGFydGluZyB3aXRoXCIsIFwiY29udGFpbmluZ1wiIHdpdGggdGhlIG5leHQgdG9rZW4pXHJcbiAgICAvKiAgIGZvcih2YXIgcmVzSW5kZXggPSAwOyByZXNJbmRleCA8IHJlcy5sZW5ndGg7ICsrcmVzSW5kZXgpIHtcclxuICAgICAgaWYgKGlzU3VjY2Vzc29yT3BlcmF0b3IocmVzW3Jlc0luZGV4XSwgdG9rZW5JbmRleCkpIHtcclxuICAgICAgICByZXNbcmVzSW5kZXhdLnB1c2gobWFrZUFueVdvcmQodG9rZW5zW3Rva2VuSW5kZXhdKSk7XHJcbiAgICAgICAgbmV4dEJhc2UucHVzaChyZXNbcmVzSW5kZXhdKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgKi9cclxuICAgIHZhciBsZW5NYXRjaGVzID0gdG9rZW5NYXRjaGVzW3Rva2VuSW5kZXhdLmxlbmd0aDtcclxuICAgIGlmIChuZXh0QmFzZS5sZW5ndGggPT09IDAgJiYgbGVuTWF0Y2hlcyA9PT0gMCkge1xyXG4gICAgICAvLyB0aGUgd29yZCBhdCBpbmRleCBJIGNhbm5vdCBiZSB1bmRlcnN0b29kXHJcbiAgICAgIC8vaWYgKHJlc3VsdC5lcnJvcnMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJlc3VsdC5lcnJvcnMucHVzaChFUkVycm9yLm1ha2VFcnJvcl9OT19LTk9XTl9XT1JEKHRva2VuSW5kZXgsIHRva2VucykpO1xyXG4gICAgICAvL31cclxuICAgIH1cclxuICAgIGZvciAodmFyIGwgPSAwOyBsIDwgbGVuTWF0Y2hlczsgKytsKSB7IC8vIGZvciBlYWNoIHZhcmlhbnQgcHJlc2VudCBhdCBpbmRleCBrXHJcbiAgICAgIC8vZGVidWdsb2coXCJ2ZWNzIG5vd1wiICsgSlNPTi5zdHJpbmdpZnkodmVjcykpO1xyXG4gICAgICB2YXIgbnZlY3MgPSBbXTsgLy92ZWNzLnNsaWNlKCk7IC8vIGNvcHkgdGhlIHZlY1tpXSBiYXNlIHZlY3RvcjtcclxuICAgICAgLy9kZWJ1Z2xvZyhcInZlY3MgY29waWVkIG5vd1wiICsgSlNPTi5zdHJpbmdpZnkobnZlY3MpKTtcclxuICAgICAgZm9yICh2YXIgdSA9IDA7IHUgPCByZXMubGVuZ3RoOyArK3UpIHtcclxuICAgICAgICBpZiAoIWlzU3BhblZlYyhyZXNbdV0sIHRva2VuSW5kZXgpICYmICFpc1N1Y2Nlc3Nvck9wZXJhdG9yKHJlc1t1XSx0b2tlbkluZGV4KSkge1xyXG4gICAgICAgICAgLy8gZm9yIGVhY2ggc28gZmFyIGNvbnN0cnVjdGVkIHJlc3VsdCAob2YgbGVuZ3RoIGspIGluIHJlc1xyXG4gICAgICAgICAgbnZlY3MucHVzaChyZXNbdV0uc2xpY2UoKSk7IC8vIG1ha2UgYSBjb3B5IG9mIGVhY2ggdmVjdG9yXHJcbiAgICAgICAgICBudmVjc1tudmVjcy5sZW5ndGggLSAxXSA9IGNvcHlWZWNNZW1iZXJzKG52ZWNzW252ZWNzLmxlbmd0aCAtIDFdKTtcclxuICAgICAgICAgIC8vIGRlYnVnbG9nKFwiY29waWVkIHZlY3NbXCIrIHUrXCJdXCIgKyBKU09OLnN0cmluZ2lmeSh2ZWNzW3VdKSk7XHJcbiAgICAgICAgICBudmVjc1tudmVjcy5sZW5ndGggLSAxXS5wdXNoKFxyXG4gICAgICAgICAgICBjbG9uZSh0b2tlbk1hdGNoZXNbdG9rZW5JbmRleF1bbF0pKTsgLy8gcHVzaCB0aGUgbHRoIHZhcmlhbnRcclxuICAgICAgICAgIC8vIGRlYnVnbG9nKFwibm93IG52ZWNzIFwiICsgbnZlY3MubGVuZ3RoICsgXCIgXCIgKyBKU09OLnN0cmluZ2lmeShudmVjcykpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICAvLyAgIGRlYnVnbG9nKFwiIGF0ICAgICBcIiArIGsgKyBcIjpcIiArIGwgKyBcIiBuZXh0YmFzZSA+XCIgKyBKU09OLnN0cmluZ2lmeShuZXh0QmFzZSkpXHJcbiAgICAgIC8vICAgZGVidWdsb2coXCIgYXBwZW5kIFwiICsgayArIFwiOlwiICsgbCArIFwiIG52ZWNzICAgID5cIiArIEpTT04uc3RyaW5naWZ5KG52ZWNzKSlcclxuICAgICAgbmV4dEJhc2UgPSBuZXh0QmFzZS5jb25jYXQobnZlY3MpO1xyXG4gICAgICAvLyAgIGRlYnVnbG9nKFwiICByZXN1bHQgXCIgKyBrICsgXCI6XCIgKyBsICsgXCIgbnZlY3MgICAgPlwiICsgSlNPTi5zdHJpbmdpZnkobmV4dEJhc2UpKVxyXG4gICAgfSAvL2NvbnN0cnVcclxuICAgIC8vICBkZWJ1Z2xvZyhcIm5vdyBhdCBcIiArIGsgKyBcIjpcIiArIGwgKyBcIiA+XCIgKyBKU09OLnN0cmluZ2lmeShuZXh0QmFzZSkpXHJcbiAgICByZXMgPSBuZXh0QmFzZTtcclxuICB9XHJcbiAgZGVidWdsb2dWKGRlYnVnbG9nVi5lbmFibGVkID8gKFwiQVBQRU5ESU5HIFRPIFJFUzEjXCIgKyAwICsgXCI6XCIgKyBsICsgXCIgPlwiICsgSlNPTi5zdHJpbmdpZnkobmV4dEJhc2UpKSA6ICctJyk7XHJcbiAgcmVzID0gcmVzLmZpbHRlciggKHNlbnRlbmNlLGluZGV4KSA9PiB7XHJcbiAgICB2YXIgZnVsbCA9IDB4RkZGRkZGRkY7XHJcbiAgICAvL2NvbnNvbGUubG9nKGBzZW50ZW5jZSAgJHtpbmRleH0gIFxcbmApXHJcbiAgICByZXR1cm4gc2VudGVuY2UuZXZlcnkoICh3b3JkLGluZGV4MikgPT4ge1xyXG4gICAgICBpZiAoIXdvcmQucnVsZSlcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgZnVsbCA9IChmdWxsICYgd29yZC5ydWxlLmJpdFNlbnRlbmNlQW5kKTtcclxuICAgICAgLy9jb25zb2xlLmxvZyhgIHdvcmQgICR7aW5kZXgyfSAke2Z1bGx9IFwiJHt3b3JkLm1hdGNoZWRTdHJpbmd9XCIgJHt3b3JkLnJ1bGUuYml0U2VudGVuY2VBbmR9ICAke3Rva2Vuc1tpbmRleDJdfSBcXG5gKTtcclxuICAgICAgcmV0dXJuIGZ1bGwgIT09IDAgfSApXHJcbiAgfSk7XHJcbiAgcmVzdWx0LnNlbnRlbmNlcyA9IHJlcztcclxuICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwcm9jZXNzU3RyaW5nKHF1ZXJ5OiBzdHJpbmcsIHJ1bGVzOiBJRk1vZGVsLlNwbGl0UnVsZXMsXHJcbiB3b3JkczogeyBba2V5OiBzdHJpbmddOiBBcnJheTxJTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nPiB9LFxyXG4gb3BlcmF0b3JzIDogeyBba2V5OnN0cmluZ10gOiBJT3BlcmF0b3IgfVxyXG4pOiAgSU1hdGNoLklQcm9jZXNzZWRTZW50ZW5jZXMge1xyXG4gIHdvcmRzID0gd29yZHMgfHwge307XHJcbiAgb3BlcmF0b3JzID0gb3BlcmF0b3JzIHx8IHt9O1xyXG4gIC8vaWYoIXByb2Nlc3MuZW52LkFCT1RfTk9fVEVTVDEpIHtcclxuICByZXR1cm4gcHJvY2Vzc1N0cmluZzIocXVlcnksIHJ1bGVzLCB3b3Jkcywgb3BlcmF0b3JzKTtcclxufVxyXG4gIC8qXHJcbiAgdmFyIHRva2VuU3RydWN0ID0gdG9rZW5pemVTdHJpbmcocXVlcnksIHJ1bGVzLCB3b3Jkcyk7XHJcbiAgZXZhbHVhdGVSYW5nZVJ1bGVzVG9Qb3NpdGlvbih0b2tlblN0cnVjdC50b2tlbnMsIHRva2VuU3RydWN0LmZ1c2FibGUsXHJcbiAgICB0b2tlblN0cnVjdC5jYXRlZ29yaXplZFdvcmRzKTtcclxuICBpZiAoZGVidWdsb2cuZW5hYmxlZCkge1xyXG4gICAgZGVidWdsb2coXCJBZnRlciBtYXRjaGVkIFwiICsgSlNPTi5zdHJpbmdpZnkodG9rZW5TdHJ1Y3QuY2F0ZWdvcml6ZWRXb3JkcykpO1xyXG4gIH1cclxuICB2YXIgYVNlbnRlbmNlcyA9IGV4cGFuZFRva2VuTWF0Y2hlc1RvU2VudGVuY2VzKHRva2VuU3RydWN0LnRva2VucywgdG9rZW5TdHJ1Y3QuY2F0ZWdvcml6ZWRXb3Jkcyk7XHJcbiAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcclxuICAgIGRlYnVnbG9nKFwiYWZ0ZXIgZXhwYW5kXCIgKyBhU2VudGVuY2VzLnNlbnRlbmNlcy5tYXAoZnVuY3Rpb24gKG9TZW50ZW5jZSkge1xyXG4gICAgcmV0dXJuIFNlbnRlbmNlLnJhbmtpbmdQcm9kdWN0KG9TZW50ZW5jZSkgKyBcIjpcIiArIFNlbnRlbmNlLmR1bXBOaWNlKG9TZW50ZW5jZSk7IC8vSlNPTi5zdHJpbmdpZnkob1NlbnRlbmNlKTtcclxuICAgIH0pLmpvaW4oXCJcXG5cIikpO1xyXG4gIH1cclxuICBhU2VudGVuY2VzLnNlbnRlbmNlcyA9IFdvcmRNYXRjaC5yZWluRm9yY2UoYVNlbnRlbmNlcy5zZW50ZW5jZXMpO1xyXG4gIGlmIChkZWJ1Z2xvZy5lbmFibGVkKSB7XHJcbiAgICBkZWJ1Z2xvZyhcImFmdGVyIHJlaW5mb3JjZVwiICsgYVNlbnRlbmNlcy5zZW50ZW5jZXMubWFwKGZ1bmN0aW9uIChvU2VudGVuY2UpIHtcclxuICAgICAgcmV0dXJuIFNlbnRlbmNlLnJhbmtpbmdQcm9kdWN0KG9TZW50ZW5jZSkgKyBcIjpcIiArIEpTT04uc3RyaW5naWZ5KG9TZW50ZW5jZSk7XHJcbiAgICB9KS5qb2luKFwiXFxuXCIpKTtcclxuICB9XHJcbiAgcmV0dXJuIGFTZW50ZW5jZXM7XHJcbiAgKi9cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZmluZENsb3NlSWRlbnRpY2FscyggbXAgOiAge1trZXkgOiBzdHJpbmddIDogSU1hdGNoLklXb3JkfSwgd29yZCA6IElNYXRjaC5JV29yZCApIDogQXJyYXk8SU1hdGNoLklXb3JkPlxyXG57XHJcbiAgdmFyIHJlcyA9IFtdIGFzIEFycmF5PElNYXRjaC5JV29yZD47XHJcbiAgZm9yKCB2YXIga2V5IGluIG1wIClcclxuICB7XHJcbiAgICBpZiAoIGtleSA9PSB3b3JkLnN0cmluZyApXHJcbiAgICB7XHJcbiAgICAgIHJlcy5wdXNoKCBtcFsga2V5IF0pO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIENoYXJTZXF1ZW5jZS5DaGFyU2VxdWVuY2UuaXNTYW1lT3JQbHVyYWxPclZlcnlDbG9zZSgga2V5LCB3b3JkLnN0cmluZyApIClcclxuICAgIHtcclxuICAgICAgcmVzLnB1c2goIG1wW2tleV0gKTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuLyogUmV0dXJuIHRydWUgaWYgdGhlIGlkZW50aWNhbCAqc291cmNlIHdvcmQqIGlzIGludGVycHJldGVkXHJcbiogKHdpdGhpbiB0aGUgc2FtZSBkb21haW4gYW5kIHRoZSBzYW1lIHdvcmR0eXBlKVxyXG4qIGFzIGEgZGlmZmVybmVudCAgKGUuZy4gZWxlbWVudCBudW1iIGlzIG9uZSBpbnRlcnByZXRlZCBhcyAnQ0FUJyBlbGVtZW50IG5hbWUsIG9uY2UgYXMgQ0FUICdlbGVtZW50IG51bWJlcicgaW5cclxuKlxyXG4qIGV4YW1wbGVcclxuKiBbICdlbGVtZW50IG5hbWVzPT5lbGVtZW50IG51bWJlci9jYXRlZ29yeS8yIEYxNicsICAgICAgICAgPDw8ICgxKVxyXG4qICAgICdlbGVtZW50IG51bWJlcj0+ZWxlbWVudCBudW1iZXIvY2F0ZWdvcnkvMiBGMTYnLFxyXG4qICAgICdlbGVtZW50IHdlaWdodD0+YXRvbWljIHdlaWdodC9jYXRlZ29yeS8yIEYxNicsXHJcbiogICAgJ2VsZW1lbnQgbmFtZT0+ZWxlbWVudCBuYW1lL2NhdGVnb3J5LzIgRjE2JywgICAgICAgICAgIDw8PCAoMilcclxuKiAgICAnd2l0aD0+d2l0aC9maWxsZXIgSTI1NicsXHJcbiogICAgJ2VsZW1lbnQgbmFtZT0+ZWxlbWVudCBuYW1lL2NhdGVnb3J5LzIgRjE2JywgICAgICAgICAgIDw8PCAoMylcclxuKiAgICdzdGFydGluZyB3aXRoPT5zdGFydGluZyB3aXRoL29wZXJhdG9yLzIgTzI1NicsXHJcbiogICAgJ0FCQz0+QUJDL2FueSBBNDA5NicgXSxcclxuKlxyXG4qIHNhbWUgZG9tYWluIElVUEFDIGVsZW1lbnRzKVxyXG4qXHJcbiogICgxKSBkaWZmZXJzIHRvICgyKSwoMykgYWx0aG91Z2ggdGhlIGJhc2Ugd29yZHMgYXJlIHZlcnkgc2ltaWxhciBlbGVtZW50IG5hbWVzLCBlbGVtZW50IG5hbWUsIGVsZW1lbnQgbmFtZSByZXNwZWN0aXZlbHlcclxuKlxyXG4qIC0gZXhhY3QgbWF0Y2hcclxuKiAtIHN0ZW1taW5nIGJ5IHJlbW92aW5nL2FwcGVuZGluZyB0cmFsaW5nIHNcclxuKiAtIGNsb3NlbmVzc1xyXG4qXHJcbiogQHBhcmFtIHNlbnRlbmNlXHJcbiovXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0Rpc3RpbmN0SW50ZXJwcmV0YXRpb25Gb3JTYW1lKHNlbnRlbmNlIDogSU1hdGNoLklTZW50ZW5jZSkgOiBib29sZWFuIHtcclxuICB2YXIgbXAgPSB7fSBhcyB7W2tleSA6IHN0cmluZ10gOiBJTWF0Y2guSVdvcmR9O1xyXG4gIHZhciByZXMgPSBzZW50ZW5jZS5ldmVyeSgod29yZCwgaW5kZXgpID0+IHtcclxuICAgIHZhciBzZWVucyA9IGZpbmRDbG9zZUlkZW50aWNhbHMoIG1wLCB3b3JkICk7XHJcbiAgICBkZWJ1Z2xvZyhcIiBpbnZlc3RpZ2F0aW5nIHNlZW5zIGZvciBcIiArIHdvcmQuc3RyaW5nICsgXCIgXCIgKyBKU09OLnN0cmluZ2lmeShzZWVucywgdW5kZWZpbmVkLCAyKSk7XHJcbiAgICBmb3IoIHZhciBzZWVuIG9mIHNlZW5zKVxyXG4gICAge1xyXG4gICAgICAvL3ZhciBzZWVuID0gbXBbd29yZC5zdHJpbmddO1xyXG4gICAgICAvKmlmKCFzZWVuKSB7XHJcbiAgICAgICAgbXBbd29yZC5zdHJpbmddID0gd29yZDtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfSovXHJcbiAgICAgIGlmKCFzZWVuLnJ1bGUgfHwgIXdvcmQucnVsZSkge1xyXG4gICAgICAgIC8vcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZihzZWVuLnJ1bGUuYml0aW5kZXggPT09IHdvcmQucnVsZS5iaXRpbmRleFxyXG4gICAgICAgICYmIHNlZW4ucnVsZS5tYXRjaGVkU3RyaW5nICE9PSB3b3JkLnJ1bGUubWF0Y2hlZFN0cmluZyApe1xyXG4gICAgICAgICAgZGVidWdsb2coXCJza2lwcGluZyB0aGlzXCIgKyBKU09OLnN0cmluZ2lmeShzZW50ZW5jZSx1bmRlZmluZWQsMikpO1xyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZighbXBbd29yZC5zdHJpbmddKVxyXG4gICAge1xyXG4gICAgICBtcFt3b3JkLnN0cmluZ10gPSB3b3JkO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gfSk7XHJcbiByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNTYW1lQ2F0ZWdvcnlBbmRIaWdoZXJNYXRjaChzZW50ZW5jZSA6IElNYXRjaC5JU2VudGVuY2UsICBpZHhtYXAgOiB7IFtha2V5IDogbnVtYmVyXSA6IEFycmF5PElNYXRjaC5JV29yZD4gfSkgOiBib29sZWFuIHtcclxuICB2YXIgaWR4bWFwb3RoZXIgPSB7fSBhcyB7IFtha2V5IDogbnVtYmVyXSA6IEFycmF5PElNYXRjaC5JV29yZD4gfTtcclxuICB2YXIgY250ID0gMDtcclxuICB2YXIgcHJvZG8gPTEuMDtcclxuICB2YXIgcHJvZCA9IDEuMDtcclxuICBPYmplY3Qua2V5cyggaWR4bWFwICkuZm9yRWFjaCggKGlkeGtleSkgPT4ge1xyXG4gICAgdmFyIHdyZCA9IGlkeG1hcFtpZHhrZXldO1xyXG4gICAgdmFyIGlkeCA9IHBhcnNlSW50KCBpZHhrZXkgKTtcclxuICAgIGlmICggc2VudGVuY2UubGVuZ3RoID4gaWR4IClcclxuICAgIHtcclxuICAgICAgdmFyIHdyZG8gPSBzZW50ZW5jZVtpZHhdO1xyXG4gICAgICBpZiggd3Jkby5zdHJpbmcgPT09IHdyZC5zdHJpbmdcclxuICAgICAgICAmJiB3cmRvLnJ1bGUuYml0aW5kZXggPT09IHdyZC5ydWxlLmJpdGluZGV4XHJcbiAgICAgICAgJiYgd3Jkby5ydWxlLndvcmRUeXBlID09PSB3cmQucnVsZS53b3JkVHlwZVxyXG4gICAgICAgICYmIHdyZG8ucnVsZS5jYXRlZ29yeSA9PT0gd3JkLnJ1bGUuY2F0ZWdvcnkgKVxyXG4gICAgICB7XHJcbiAgICAgICAgKytjbnQ7XHJcbiAgICAgICAgcHJvZG8gPSBwcm9kbyAqIHdyZG8uX3Jhbmtpbmc7XHJcbiAgICAgICAgcHJvZCA9IHByb2QgKiB3cmQuX3Jhbmtpbmc7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxuICBpZiAoIGNudCA9PT0gT2JqZWN0LmtleXMoIGlkeG1hcCApLmxlbmd0aCAmJiBwcm9kbyA+IHByb2QgKVxyXG4gIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldF9pdGhfYXJnKCBvbmVwb3MgOiBudW1iZXIsIG9wcG9zIDogbnVtYmVyLCBzZW50ZW5jZTogSU1hdGNoLklTZW50ZW5jZSwgaW5kZXggOiBudW1iZXIgKSA6IElNYXRjaC5JV29yZFxyXG57IC8vLyAgICAgICAgIG9wcG9zPTAgICAgIG9wcG9zPS0xICAgICBvcHBvcz0tMiAgIG9wcG9zPTFcclxuICAvLyAxIC0+ICAwICAtMTsgICAgICAgICAgIDEgICAgICAgICAgICAyICAgICAgICAgLTJcclxuICAvLyAyICAtPiAxICAgMTsgICAgICAgICAgIDIgICAgICAgICAgICAzICAgICAgICAgLTFcclxuICB2YXIgcG9zID0gb25lcG9zIC0gMTtcclxuICBpZiAoIHBvcyA8PSBvcHBvcyApXHJcbiAgICAgcG9zID0gLTE7XHJcbiAgcG9zIC09IG9wcG9zO1xyXG4gIHZhciBpZHggPSBwb3MgKyBpbmRleDtcclxuICByZXR1cm4gc2VudGVuY2VbaWR4XTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzQmFkT3BlcmF0b3JBcmdzKHNlbnRlbmNlIDogSU1hdGNoLklTZW50ZW5jZSwgb3BlcmF0b3JzOiBJTWF0Y2guSU9wZXJhdG9ycyApIDogYm9vbGVhbiB7XHJcbiAgaWYgKGlzTnVsbE9yRW1wdHlEaWN0aW9uYXJ5KG9wZXJhdG9ycykpXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgcmV0dXJuICFzZW50ZW5jZS5ldmVyeSggKHdvcmQsIGluZGV4KSA9PiB7XHJcbiAgICBpZiggICh3b3JkLnJ1bGUgJiYgd29yZC5ydWxlLndvcmRUeXBlKSAhPSBJTWF0Y2guV09SRFRZUEUuT1BFUkFUT1IgKVxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIHZhciBvcCA9b3BlcmF0b3JzW3dvcmQucnVsZS5tYXRjaGVkU3RyaW5nXTtcclxuICAgIGlmKCAhb3ApXHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgdmFyIG9wZXJhdG9ycG9zID0gb3Aub3BlcmF0b3Jwb3MgfHwgMDtcclxuICAgIGlmICghb3AuYXJpdHkpXHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgZm9yKCB2YXIgaSA9IDE7IGkgPD0gb3AuYXJpdHk7ICsraSlcclxuICAgIHtcclxuICAgICAgdmFyIGl0aF9hcmcgPSBnZXRfaXRoX2FyZyggaSwgb3BlcmF0b3Jwb3MgLCBzZW50ZW5jZSwgaW5kZXggKTtcclxuICAgICAgaWYgKCFpdGhfYXJnKVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgdmFyIGFyZ3R5cGUgPSBvcC5hcmdjYXRlZ29yeVsgaSAtIDFdO1xyXG4gICAgICB2YXIgYXJndHlwZXggPSBhcmd0eXBlLm1hcCggICh4KSA9PiBXb3JkLldvcmRUeXBlLmZyb21DYXRlZ29yeVN0cmluZyggeCApKTtcclxuICAgICAgaWYgKCBhcmd0eXBleC5pbmRleE9mKCBpdGhfYXJnLnJ1bGUud29yZFR5cGUgKSA8IDAgKVxyXG4gICAgICB7XHJcbiAgICAgICAgZGVidWdsb2coICgpPT4geyByZXR1cm4gXCJkaXNjYXJkaW5nIGR1ZSB0byBhcmcgXCIgKyBvcC5vcGVyYXRvciArIFwiIGFyZyAjXCIgKyBpICsgXCIgZXhwZWN0ZWRcIiArIEpTT04uc3RyaW5naWZ5KCBhcmd0eXBleCApICsgXCIgd2FzIFwiICArIGl0aF9hcmcucnVsZS53b3JkVHlwZTt9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0pO1xyXG59XHJcblxyXG5cclxuLyogUmV0dXJuIHRydWUgaWYgdGhlIGlkZW50aWNhbCAqdGFyZ2V0IHdvcmQqIGlzIGV4cHJlc3NlZCBieSBkaWZmZXJlbnQgc291cmNlIHdvcmRzXHJcbiogKHdpdGhpbiB0aGUgc2FtZSBkb21haW4gYW5kIHRoZSBzYW1lIHdvcmR0eXBlKVxyXG4qXHJcbiogdGhpcyBpcyBwcm9ibGVtYXRpYyB3aXRoIGFsaWFzZXMgbWFwcGVkIG9udG8gdGhlIHNhbWUgdGFyZ2V0LCAoZWcuIHdoZXJlIC0+IHdpdGgsIHdpdGggLT4gd2hlcmUgKVxyXG4qIHNvIHBlcmhhcHMgb25seSBmb3IgY2F0ZWdvcmllcyBhbmQgZmFjdHM/XHJcbipcclxuKiBleGFtcGxlIDxwcmU+XHJcbiogWyAnZWxlbWVudCBuYW1lcz0+ZWxlbWVudCBudW1iZXIvY2F0ZWdvcnkvMiBDOCcsICAgICAgICAgPDw8ICgxYSlcclxuKiAgICAnZWxlbWVudCBudW1iZXI9PmVsZW1lbnQgbnVtYmVyL2NhdGVnb3J5LzIgQzgnLCAgICAgICA8PDwgKDIpXHJcbiogICAgJ2VsZW1lbnQgd2VpZ2h0PT5hdG9taWMgd2VpZ2h0L2NhdGVnb3J5LzIgQzgnLFxyXG4qICAgICdlbGVtZW50IG5hbWU9PmVsZW1lbnQgbnVtYmVyL2NhdGVnb3J5LzIgQzgnLCAgICAgICAgICAgPDw8ICgxYilcclxuKiAgICAnd2l0aD0+d2l0aC9maWxsZXIgSTI1NicsXHJcbiogICAgJ2VsZW1lbnQgbmFtZT0+ZWxlbWVudCBudW1iZXIvY2F0ZWdvcnkvMiBDOCcsICAgICAgICAgICA8PDwgKDFjKVxyXG4qICAgICdzdGFydGluZyB3aXRoPT5zdGFydGluZyB3aXRoL29wZXJhdG9yLzIgTzI1NicsXHJcbiogICAgJ0FCQz0+QUJDL2FueSBBNDA5NicgXSxcclxuKlxyXG4qIHNhbWUgZG9tYWluIElVUEFDIGVsZW1lbnRzKVxyXG4qXHJcbiogICgxYWJjKSBkaWZmZXJzIGZyb20gKDIpLFxyXG4qICBhbmQgdGhlcmUgaXMgYSBtdWNoIGJldHRlciBpbnRlcnByZXRhdGlvbiBhcm91bmRcclxuKiA8L3ByZT5cclxuKiAtIGV4YWN0IG1hdGNoXHJcbiogLSBzdGVtbWluZyBieSByZW1vdmluZy9hcHBlbmRpbmcgdHJhbGluZyBzXHJcbiogLSBjbG9zZW5lc3NcclxuKlxyXG4qIEBwYXJhbSBzZW50ZW5jZVxyXG4qL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNOb25PcHRpbWFsRGlzdGluY3RTb3VyY2VGb3JTYW1lKHNlbnRlbmNlIDogSU1hdGNoLklTZW50ZW5jZSwgc2VudGVuY2VzIDogQXJyYXk8SU1hdGNoLklTZW50ZW5jZT4pIDogYm9vbGVhbiB7XHJcbiAgdmFyIG1wID0ge30gYXMge1trZXkgOiBzdHJpbmddIDogIHsgW2tleSA6IG51bWJlcl0gOiBBcnJheTxJTWF0Y2guSVdvcmQ+IH0gfTtcclxuICAvLyBjYWxjdWxhdGUgY29uZmxpY3RzIDogICAgW3RhZ2V0X3dvcmQgLT4gXVxyXG4gIHZhciByZXMgPSBzZW50ZW5jZS5ldmVyeSgod29yZCkgPT4ge1xyXG4gICAgaWYgKCB3b3JkLmNhdGVnb3J5ID09PSBXb3JkLkNhdGVnb3J5LkNBVF9DQVRFR09SWVxyXG4gICAgICAmJiAoICB3b3JkLnJ1bGUud29yZFR5cGUgPT09IElNYXRjaC5XT1JEVFlQRS5GQUNUXHJcbiAgICAgICAgIHx8IHdvcmQucnVsZS53b3JkVHlwZSA9PT0gSU1hdGNoLldPUkRUWVBFLkNBVEVHT1JZICkpXHJcbiAgICB7XHJcbiAgICAgIGlmICghbXBbd29yZC5ydWxlLm1hdGNoZWRTdHJpbmcgXSlcclxuICAgICAgICBtcFt3b3JkLnJ1bGUubWF0Y2hlZFN0cmluZ10gPSB7fSBhcyB7IFtrZXkgOiBudW1iZXJdIDogQXJyYXk8SU1hdGNoLklXb3JkPiB9O1xyXG4gICAgICBpZiggIW1wW3dvcmQucnVsZS5tYXRjaGVkU3RyaW5nXVt3b3JkLnJ1bGUuYml0aW5kZXhdKVxyXG4gICAgICAgIG1wW3dvcmQucnVsZS5tYXRjaGVkU3RyaW5nXVt3b3JkLnJ1bGUuYml0aW5kZXhdID0gW10gYXMgIEFycmF5PElNYXRjaC5JV29yZD47XHJcbiAgICAgIHZhciBhcnIgPSBtcFt3b3JkLnJ1bGUubWF0Y2hlZFN0cmluZ11bd29yZC5ydWxlLmJpdGluZGV4XTtcclxuICAgICAgaWYoIGFyci5sZW5ndGggPT0gMCApXHJcbiAgICAgIHtcclxuICAgICAgICBhcnIucHVzaCh3b3JkKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoICFhcnIuZXZlcnkoIChwcmVzZW50d29yZCkgPT4ge1xyXG4gICAgICAgIHJldHVybiBDaGFyU2VxdWVuY2UuQ2hhclNlcXVlbmNlLmlzU2FtZU9yUGx1cmFsT3JWZXJ5Q2xvc2UoIHdvcmQuc3RyaW5nLCBwcmVzZW50d29yZC5zdHJpbmcgKTtcclxuICAgICAgfSkpXHJcbiAgICAgIHtcclxuICAgICAgICBhcnIucHVzaCggd29yZCApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyByZXRhaW4gb25seSBlbnRyaWVzIHdpdGggbW9yZSB0aGFuIG9uZSBtZW1iZXIgaW4gdGhlIGxpc3RcclxuICAgIHZhciBtcGR1cGxpY2F0ZXMgPSB7fSBhcyB7W2tleSA6IHN0cmluZ10gOiAgeyBba2V5IDogbnVtYmVyXSA6IEFycmF5PElNYXRjaC5JV29yZD4gfSB9O1xyXG4gICAgT2JqZWN0LmtleXMoIG1wICkuZm9yRWFjaCggKGtleSkgPT4ge1xyXG4gICAgICB2YXIgZW50cnkgPSBtcFtrZXldO1xyXG4gICAgICBPYmplY3Qua2V5cyggZW50cnkgKS5mb3JFYWNoKCAoa2V5Yml0aW5kZXgpID0+IHtcclxuICAgICAgICBpZiAoIGVudHJ5W2tleWJpdGluZGV4XS5sZW5ndGggPiAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlmICghbXBkdXBsaWNhdGVzW2tleV0pXHJcbiAgICAgICAgICAgIG1wZHVwbGljYXRlc1trZXldID0ge30gYXMgeyBba2V5IDogbnVtYmVyXSA6IEFycmF5PElNYXRjaC5JV29yZD4gfTtcclxuICAgICAgICAgIG1wZHVwbGljYXRlc1trZXldW2tleWJpdGluZGV4XSA9IGVudHJ5W2tleWJpdGluZGV4XTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoIG1wZHVwbGljYXRlcyApLmV2ZXJ5KCAoa2V5KSA9PiAge1xyXG4gICAgICByZXR1cm4gT2JqZWN0LmtleXMoIG1wZHVwbGljYXRlc1sga2V5IF0gKS5ldmVyeSggKCBiaSApID0+IHtcclxuICAgICAgICB2YXIgbHN0ID0gbXBkdXBsaWNhdGVzW2tleV1bYmldO1xyXG4gICAgICAgIHZhciBpZHhtYXAgPSB7fSBhcyB7IFtha2V5IDogbnVtYmVyXSA6IEFycmF5PElNYXRjaC5JV29yZD4gfTtcclxuICAgICAgICAvKiBvaywgZG8gc29tZSB3b3JrIC4uICAqL1xyXG4gICAgICAgIC8qIGZvciBldmVyeSBkdXBsaWNhdGUgd2UgY29sbGVjdCBhbiBpbmRleCAgaWR4IC0+IHdvcmQgKi9cclxuICAgICAgICBmb3IoIHZhciBhbHN0IG9mIGxzdCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdmFyIGlkeCA9IHNlbnRlbmNlLmluZGV4T2YoIGFsc3QgKTtcclxuICAgICAgICAgIGlmICggaWR4IDwgMCApXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIndvcmQgbXVzdCBiZSBmb3VuZCBpbiBzZW50ZW5jZSBcIik7XHJcbiAgICAgICAgICBpZHhtYXBbIGlkeCBdID0gYWxzdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLyogdGhlbiB3ZSBydW4gdGhyb3VnaCBhbGwgdGhlIHNlbnRlbmNlcyBpZGVudGlmeWluZyAqaWRlbnRpY2FsIHNvdXJjZSB3b3JkcyBwYWlycyxcclxuICAgICAgICAgICBpZiB3ZSBmaW5kIGEgIGEpIGRpc3RpbmN0IHNlbnRlbmNlIHdpdGhcclxuICAgICAgICAgICAgICAgICAgICAgIGIpIHNhbWUgY2F0ZWdvcmllcyBGMTYvRjE2XHJcbiAgICAgICAgICAgICAgICAgIGFuZCBjKSAqaGlnaGVyIG1hdGNoZXMqIGZvciBib3RoICwgdGhlbiB3ZSBkaXNjYXJkICp0aGlzKiBzZW50ZW5jZVxyXG4gICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgIHJldHVybiBzZW50ZW5jZXMuZXZlcnkoIChvdGhlcnNlbnRlbmNlKSA9PiB7XHJcbiAgICAgICAgICBpZiggb3RoZXJzZW50ZW5jZSA9PT0gc2VudGVuY2UgKVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgIGlmICggaXNTYW1lQ2F0ZWdvcnlBbmRIaWdoZXJNYXRjaCggb3RoZXJzZW50ZW5jZSwgaWR4bWFwKSApXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGRlYnVnbG9nKFwiIHJlbW92aW5nIHNlbnRlbmNlIHdpdGggZHVlIHRvIGhpZ2hlciBtYXRjaCBcIiArICBTZW50ZW5jZS5zaW1wbGlmeVN0cmluZ3NXaXRoQml0SW5kZXgoc2VudGVuY2UpXHJcbiAgICAgICAgICAgICsgXCIgYXMgXCIgKyBTZW50ZW5jZS5zaW1wbGlmeVN0cmluZ3NXaXRoQml0SW5kZXgoIG90aGVyc2VudGVuY2UgKSArIFwiIGFwcGVhcnMgYmV0dGVyIFwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pXHJcbiAgICB9KTtcclxuICB9KTtcclxuICBkZWJ1Z2xvZyhcIiBoZXJlIHJlcyBcIiArICFyZXMgKyBcIiBcIiArICBTZW50ZW5jZS5zaW1wbGlmeVN0cmluZ3NXaXRoQml0SW5kZXgoc2VudGVuY2UpICk7XHJcbiAgcmV0dXJuICFyZXM7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyTm9uU2FtZUludGVycHJldGF0aW9ucyhhU2VudGVuY2VzIDogIElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzICkgOiBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcyB7XHJcbiAgdmFyIGRpc2NhcmRJbmRleCA9IFtdIGFzIEFycmF5PG51bWJlcj47XHJcbiAgdmFyIHJlcyA9IChPYmplY3QgYXMgYW55KS5hc3NpZ24oIHt9LCBhU2VudGVuY2VzICk7XHJcbiAgcmVzLnNlbnRlbmNlcyA9IGFTZW50ZW5jZXMuc2VudGVuY2VzLmZpbHRlcigoc2VudGVuY2UsaW5kZXgpID0+IHtcclxuICAgIGlmKCFpc0Rpc3RpbmN0SW50ZXJwcmV0YXRpb25Gb3JTYW1lKHNlbnRlbmNlKSkge1xyXG4gICAgICBkaXNjYXJkSW5kZXgucHVzaChpbmRleCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0pO1xyXG4gIGlmKGRpc2NhcmRJbmRleC5sZW5ndGgpIHtcclxuICAgIHJlcy5lcnJvcnMgPSBhU2VudGVuY2VzLmVycm9ycy5maWx0ZXIoIChlcnJvcixpbmRleCkgPT4ge1xyXG4gICAgICBpZihkaXNjYXJkSW5kZXguaW5kZXhPZihpbmRleCkgPj0gMCkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc051bGxPckVtcHR5RGljdGlvbmFyeShvYmopIHtcclxuICByZXR1cm4gKG9iaiA9PT0gdW5kZWZpbmVkKSB8fCAoT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDApO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlckJhZE9wZXJhdG9yQXJncyhhU2VudGVuY2VzIDogIElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzLCBvcGVyYXRvcnMgOiBJRk1vZGVsLklPcGVyYXRvcnMgKSA6IElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzIHtcclxuICBpZiAoIGlzTnVsbE9yRW1wdHlEaWN0aW9uYXJ5KG9wZXJhdG9ycykgKVxyXG4gICAgcmV0dXJuIGFTZW50ZW5jZXM7XHJcbiAgdmFyIGRpc2NhcmRJbmRleCA9IFtdIGFzIEFycmF5PG51bWJlcj47XHJcbiAgdmFyIHJlcyA9IChPYmplY3QgYXMgYW55KS5hc3NpZ24oIHt9LCBhU2VudGVuY2VzICk7XHJcbiAgcmVzLnNlbnRlbmNlcyA9IGFTZW50ZW5jZXMuc2VudGVuY2VzLmZpbHRlcigoc2VudGVuY2UsaW5kZXgpID0+IHtcclxuICAgIGlmKGlzQmFkT3BlcmF0b3JBcmdzKHNlbnRlbmNlLCBvcGVyYXRvcnMpKSB7XHJcbiAgICAgIGRpc2NhcmRJbmRleC5wdXNoKGluZGV4KTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSk7XHJcbiAgaWYoZGlzY2FyZEluZGV4Lmxlbmd0aCkge1xyXG4gICAgcmVzLmVycm9ycyA9IGFTZW50ZW5jZXMuZXJyb3JzLmZpbHRlciggKGVycm9yLGluZGV4KSA9PiB7XHJcbiAgICAgIGlmKGRpc2NhcmRJbmRleC5pbmRleE9mKGluZGV4KSA+PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHJldHVybiByZXM7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyUmV2ZXJzZU5vblNhbWVJbnRlcnByZXRhdGlvbnMoYVNlbnRlbmNlcyA6ICBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcyApIDogSU1hdGNoLklQcm9jZXNzZWRTZW50ZW5jZXMge1xyXG4gIHZhciBkaXNjYXJkSW5kZXggPSBbXSBhcyBBcnJheTxudW1iZXI+O1xyXG4gIHZhciByZXMgPSAoT2JqZWN0IGFzIGFueSkuYXNzaWduKCB7fSwgYVNlbnRlbmNlcyApO1xyXG4gIHJlcy5zZW50ZW5jZXMgPSBhU2VudGVuY2VzLnNlbnRlbmNlcy5maWx0ZXIoKHNlbnRlbmNlLGluZGV4KSA9PiB7XHJcbiAgICBpZihpc05vbk9wdGltYWxEaXN0aW5jdFNvdXJjZUZvclNhbWUoc2VudGVuY2UsIGFTZW50ZW5jZXMuc2VudGVuY2VzKSkge1xyXG4gICAgICBkaXNjYXJkSW5kZXgucHVzaChpbmRleCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0pO1xyXG4gIGlmKGRpc2NhcmRJbmRleC5sZW5ndGgpIHtcclxuICAgIHJlcy5lcnJvcnMgPSBhU2VudGVuY2VzLmVycm9ycy5maWx0ZXIoIChlcnJvcixpbmRleCkgPT4ge1xyXG4gICAgICBpZihkaXNjYXJkSW5kZXguaW5kZXhPZihpbmRleCkgPj0gMCkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcHJvY2Vzc1N0cmluZzIocXVlcnk6IHN0cmluZywgcnVsZXM6IElGTW9kZWwuU3BsaXRSdWxlcyxcclxuIHdvcmRzOiB7IFtrZXk6IHN0cmluZ106IEFycmF5PElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+IH0sXHJcbiBvcGVyYXRvcnMgOiB7IFtrZXk6c3RyaW5nXSA6IElPcGVyYXRvciB9XHJcbik6ICBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcyB7XHJcbiAgd29yZHMgPSB3b3JkcyB8fCB7fTtcclxuICB2YXIgdG9rZW5TdHJ1Y3QgPSB0b2tlbml6ZVN0cmluZyhxdWVyeSwgcnVsZXMsIHdvcmRzKTtcclxuICBkZWJ1Z2xvZygoKT0+IGB0b2tlbml6ZWQ6XFxuYCArIHRva2VuU3RydWN0LmNhdGVnb3JpemVkV29yZHMubWFwKCBzID0+IFNlbnRlbmNlLnNpbXBsaWZ5U3RyaW5nc1dpdGhCaXRJbmRleChzKS5qb2luKFwiXFxuXCIpICkuam9pbihcIlxcblwiKSk7XHJcbiAgZXZhbHVhdGVSYW5nZVJ1bGVzVG9Qb3NpdGlvbih0b2tlblN0cnVjdC50b2tlbnMsIHRva2VuU3RydWN0LmZ1c2FibGUsXHJcbiAgICB0b2tlblN0cnVjdC5jYXRlZ29yaXplZFdvcmRzKTtcclxuICBkZWJ1Z2xvZ1YoKCk9PlwiQWZ0ZXIgbWF0Y2hlZCBcIiArIEpTT04uc3RyaW5naWZ5KHRva2VuU3RydWN0LmNhdGVnb3JpemVkV29yZHMpKTtcclxuICB2YXIgYVNlbnRlbmNlcyA9IGV4cGFuZFRva2VuTWF0Y2hlc1RvU2VudGVuY2VzMih0b2tlblN0cnVjdC50b2tlbnMsIHRva2VuU3RydWN0LmNhdGVnb3JpemVkV29yZHMpO1xyXG4gIGRlYnVnbG9nKCgpID0+IFwiYWZ0ZXIgZXhwYW5kIFwiICsgYVNlbnRlbmNlcy5zZW50ZW5jZXMubWFwKGZ1bmN0aW9uIChvU2VudGVuY2UpIHtcclxuICAgIHJldHVybiBTZW50ZW5jZS5yYW5raW5nUHJvZHVjdChvU2VudGVuY2UpICsgXCI6XFxuXCIgKyBTZW50ZW5jZS5kdW1wTmljZUJpdEluZGV4ZWQob1NlbnRlbmNlKTsgLy9KU09OLnN0cmluZ2lmeShvU2VudGVuY2UpO1xyXG4gICAgfSkuam9pbihcIlxcblwiKSk7XHJcbiAgYVNlbnRlbmNlcyA9IGZpbHRlckJhZE9wZXJhdG9yQXJncyhhU2VudGVuY2VzLCBvcGVyYXRvcnMpXHJcbiAgYVNlbnRlbmNlcyA9IGZpbHRlck5vblNhbWVJbnRlcnByZXRhdGlvbnMoYVNlbnRlbmNlcyk7XHJcblxyXG4gIGFTZW50ZW5jZXMgPSBmaWx0ZXJSZXZlcnNlTm9uU2FtZUludGVycHJldGF0aW9ucyhhU2VudGVuY2VzKTtcclxuXHJcbiAgYVNlbnRlbmNlcy5zZW50ZW5jZXMgPSBXb3JkTWF0Y2gucmVpbkZvcmNlKGFTZW50ZW5jZXMuc2VudGVuY2VzKTtcclxuICBkZWJ1Z2xvZ1YoKCk9PiBcImFmdGVyIHJlaW5mb3JjZVxcblwiICsgYVNlbnRlbmNlcy5zZW50ZW5jZXMubWFwKGZ1bmN0aW9uIChvU2VudGVuY2UpIHtcclxuICAgICAgcmV0dXJuIFNlbnRlbmNlLnJhbmtpbmdQcm9kdWN0KG9TZW50ZW5jZSkgKyBcIjpcXG5cIiArIEpTT04uc3RyaW5naWZ5KG9TZW50ZW5jZSk7XHJcbiAgICB9KS5qb2luKFwiXFxuXCIpKTtcclxuICBkZWJ1Z2xvZygoKSA9PiBcImFmdGVyIHJlaW5mb3JjZVwiICsgYVNlbnRlbmNlcy5zZW50ZW5jZXMubWFwKGZ1bmN0aW9uIChvU2VudGVuY2UpIHtcclxuICAgIHJldHVybiBTZW50ZW5jZS5yYW5raW5nUHJvZHVjdChvU2VudGVuY2UpICsgXCI6XFxuXCIgKyBTZW50ZW5jZS5kdW1wTmljZUJpdEluZGV4ZWQob1NlbnRlbmNlKTsgLy9KU09OLnN0cmluZ2lmeShvU2VudGVuY2UpO1xyXG4gICAgfSkuam9pbihcIlxcblwiKSk7XHJcbiAgcmV0dXJuIGFTZW50ZW5jZXM7XHJcbn1cclxuXHJcblxyXG4iXX0=
