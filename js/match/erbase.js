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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUFDO0FBQ3BCLENBQUM7QUEzQkQsd0NBMkJDIiwiZmlsZSI6Im1hdGNoL2VyYmFzZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKlxyXG4gKiBAbW9kdWxlIGpmc2ViLmVyYmFzZVxyXG4gKiBAZmlsZSBlcmJhc2VcclxuICogQGNvcHlyaWdodCAoYykgMjAxNiBHZXJkIEZvcnN0bWFublxyXG4gKlxyXG4gKiBCYXNpYyBkb21haW4gYmFzZWQgZW50aXR5IHJlY29nbml0aW9uXHJcbiAqXHJcbiAqL1xyXG5cclxuXHJcbmltcG9ydCAqIGFzIFdvcmRNYXRjaCBmcm9tICcuL2lucHV0RmlsdGVyJztcclxuaW1wb3J0ICogYXMgQ2hhclNlcXVlbmNlIGZyb20gJy4vY2hhcnNlcXVlbmNlJztcclxuXHJcbmltcG9ydCAqIGFzIGRlYnVnIGZyb20gJ2RlYnVnZic7XHJcblxyXG5cclxuXHJcbnZhciBkZWJ1Z2xvZyA9IGRlYnVnKCdlcmJhc2UnKTtcclxudmFyIGRlYnVnbG9nViA9IGRlYnVnKCdlclZiYXNlJyk7XHJcbnZhciBwZXJmbG9nID0gZGVidWcoJ3BlcmYnKTtcclxuXHJcbmltcG9ydCB7IEJyZWFrRG93biBhcyBicmVha2Rvd259ICBmcm9tICcuLi9tb2RlbC9pbmRleF9tb2RlbCc7XHJcbmltcG9ydCAqIGFzIEVSRXJyb3IgZnJvbSAnLi9lcmVycm9yJztcclxuXHJcbmNvbnN0IEFueU9iamVjdCA9IDxhbnk+T2JqZWN0O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1vY2tEZWJ1ZyhvKSB7XHJcbiAgZGVidWdsb2cgPSBvO1xyXG4gIGRlYnVnbG9nViA9IG87XHJcbiAgcGVyZmxvZyA9IG87XHJcbn1cclxuXHJcblxyXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICdhYm90X3V0aWxzJztcclxuXHJcbmltcG9ydCAqIGFzIElGRXJCYXNlIGZyb20gJy4vaWZlcmJhc2UnO1xyXG5pbXBvcnQgeyBJRk1vZGVsICBhcyBJTWF0Y2h9ICBmcm9tICcuLi9tb2RlbC9pbmRleF9tb2RlbCc7XHJcbmltcG9ydCB7IElGTW9kZWwgIGFzIElGTW9kZWx9ICBmcm9tICcuLi9tb2RlbC9pbmRleF9tb2RlbCc7XHJcblxyXG5cclxuXHJcbmltcG9ydCAqIGFzIFNlbnRlbmNlIGZyb20gJy4vc2VudGVuY2UnO1xyXG5cclxuaW1wb3J0ICogYXMgV29yZCBmcm9tICcuL3dvcmQnO1xyXG5cclxuaW1wb3J0ICogYXMgQWxnb2wgZnJvbSAnLi9hbGdvbCc7XHJcbmltcG9ydCB7IEFzc2VydGlvbkVycm9yIH0gZnJvbSAnYXNzZXJ0JztcclxuaW1wb3J0IHsgSU9wZXJhdG9yIH0gZnJvbSAnLi9pZm1hdGNoJztcclxuXHJcblxyXG4vL2ltcG9ydCAqIGFzIE1hdGNoIGZyb20gJy4vbWF0Y2gnO1xyXG5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVRva2VuaXplZFN0cmluZyB7XHJcbiAgdG9rZW5zOiBzdHJpbmdbXSxcclxuICBjYXRlZ29yaXplZFdvcmRzOiBJTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkW11bXVxyXG4gIGZ1c2FibGU6IGJvb2xlYW5bXTtcclxufVxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4vKipcclxuICogR2l2ZW4gYSAgc3RyaW5nLCBicmVhayBpdCBkb3duIGludG8gY29tcG9uZW50cyxcclxuICogW1snQScsICdCJ10sIFsnQSBCJ11dXHJcbiAqXHJcbiAqIHRoZW4gY2F0ZWdvcml6ZVdvcmRzXHJcbiAqIHJldHVybmluZ1xyXG4gKlxyXG4gKiBbIFtbIHsgY2F0ZWdvcnk6ICdzeXN0ZW1JZCcsIHdvcmQgOiAnQSd9LFxyXG4gKiAgICAgIHsgY2F0ZWdvcnk6ICdvdGhlcnRoaW5nJywgd29yZCA6ICdBJ31cclxuICogICAgXSxcclxuICogICAgLy8gcmVzdWx0IG9mIEJcclxuICogICAgWyB7IGNhdGVnb3J5OiAnc3lzdGVtSWQnLCB3b3JkIDogJ0InfSxcclxuICogICAgICB7IGNhdGVnb3J5OiAnb3RoZXJ0aGluZycsIHdvcmQgOiAnQSd9XHJcbiAqICAgICAgeyBjYXRlZ29yeTogJ2Fub3RoZXJ0cnlwJywgd29yZCA6ICdCJ31cclxuICogICAgXVxyXG4gKiAgIF0sXHJcbiAqIF1dXVxyXG4gKlxyXG4gKlxyXG4gKlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHRva2VuaXplU3RyaW5nKHNTdHJpbmc6IHN0cmluZywgcnVsZXM6IElNYXRjaC5TcGxpdFJ1bGVzLFxyXG4gIHdvcmRzOiB7IFtrZXk6IHN0cmluZ106IEFycmF5PElNYXRjaC5JQ2F0ZWdvcml6ZWRTdHJpbmc+IH0pXHJcbiAgOiBJVG9rZW5pemVkU3RyaW5nIHtcclxuICB2YXIgY250ID0gMDtcclxuICB2YXIgZmFjID0gMTtcclxuICB2YXIgdG9rZW5zID0gYnJlYWtkb3duLnRva2VuaXplU3RyaW5nKHNTdHJpbmcpO1xyXG4gIGlmIChkZWJ1Z2xvZy5lbmFibGVkKSB7XHJcbiAgICBkZWJ1Z2xvZyhcImhlcmUgYnJlYWtkb3duXCIgKyBKU09OLnN0cmluZ2lmeSh0b2tlbnMpKTtcclxuICB9XHJcbiAgLy9jb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh1KSk7XHJcbiAgd29yZHMgPSB3b3JkcyB8fCB7fTtcclxuICBwZXJmbG9nKCd0aGlzIG1hbnkga25vd24gd29yZHM6ICcgKyBPYmplY3Qua2V5cyh3b3JkcykubGVuZ3RoKTtcclxuICB2YXIgcmVzID0gW10gYXMgSU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZFtdW107XHJcbiAgdmFyIGNudFJlYyA9IHt9O1xyXG4gIHZhciBjYXRlZ29yaXplZFNlbnRlbmNlID0gW10gYXMgSU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZFtdW107XHJcbiAgdmFyIGhhc1JlY29tYmluZWQgPSBmYWxzZTtcclxuICB0b2tlbnMudG9rZW5zLmZvckVhY2goZnVuY3Rpb24gKHRva2VuLCBpbmRleCkge1xyXG4gICAgdmFyIHNlZW5JdCA9IFdvcmRNYXRjaC5jYXRlZ29yaXplQVdvcmRXaXRoT2Zmc2V0cyh0b2tlbiwgcnVsZXMsIHNTdHJpbmcsIHdvcmRzLCBjbnRSZWMpO1xyXG4gICAgLyogY2Fubm90IGhhdmUgdGhpcywgb3IgbmVlZCB0byBhZGQgYWxsIGZyYWdtZW50IHdvcmRzIFwiVUkyIEludGVncmF0aW9uXCIgIGlmKHNlZW5JdC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAqL1xyXG4gICAgaGFzUmVjb21iaW5lZCA9IGhhc1JlY29tYmluZWQgfHwgIXNlZW5JdC5ldmVyeShyZXMgPT4gIXJlcy5ydWxlLnJhbmdlKTtcclxuICAgIGRlYnVnbG9nVihkZWJ1Z2xvZ1YuZW5hYmxlZCA/IChgIGNhdGVnb3JpemVkICR7dG9rZW59LyR7aW5kZXh9IHRvIGAgKyBKU09OLnN0cmluZ2lmeShzZWVuSXQpKVxyXG4gICAgIDogXCItXCIpO1xyXG4gICAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/IChgIGNhdGVnb3JpemVkICR7dG9rZW59LyR7aW5kZXh9IHRvIGAgK1xyXG4gICAgc2Vlbkl0Lm1hcCggKGl0LGlkeCkgPT4geyByZXR1cm4gYCAke2lkeH0gICR7aXQucnVsZS5tYXRjaGVkU3RyaW5nfS8ke2l0LnJ1bGUuY2F0ZWdvcnl9ICAke2l0LnJ1bGUud29yZFR5cGV9JHtpdC5ydWxlLmJpdGluZGV4fSBgIH0pLmpvaW4oXCJcXG5cIikpXHJcbiAgICAgOiBcIi1cIik7XHJcbiAgICBjYXRlZ29yaXplZFNlbnRlbmNlW2luZGV4XSA9IHNlZW5JdDtcclxuICAgIGNudCA9IGNudCArIHNlZW5JdC5sZW5ndGg7XHJcbiAgICBmYWMgPSBmYWMgKiBzZWVuSXQubGVuZ3RoO1xyXG4gIH0pO1xyXG4gIC8vIGhhdmUgc2VlbiB0aGUgcGxhaW4gY2F0ZWdvcml6YXRpb24sXHJcbiAgZGVidWdsb2coXCIgc2VudGVuY2VzIFwiICsgdG9rZW5zLnRva2Vucy5sZW5ndGggKyBcIiBtYXRjaGVzIFwiICsgY250ICsgXCIgZmFjOiBcIiArIGZhYyk7XHJcbiAgaWYgKGRlYnVnbG9nLmVuYWJsZWQgJiYgdG9rZW5zLnRva2Vucy5sZW5ndGgpIHtcclxuICAgIGRlYnVnbG9nKFwiZmlyc3QgbWF0Y2ggXCIgKyBKU09OLnN0cmluZ2lmeSh0b2tlbnMsIHVuZGVmaW5lZCwgMikpO1xyXG4gIH1cclxuICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gYCBwcmlvciBSYW5nZVJ1bGUgJHtKU09OLnN0cmluZ2lmeShjYXRlZ29yaXplZFNlbnRlbmNlKX0gYCA6ICctJyk7XHJcbiAgaWYgKGhhc1JlY29tYmluZWQpIHtcclxuICAgIGV2YWx1YXRlUmFuZ2VSdWxlc1RvUG9zaXRpb24odG9rZW5zLnRva2VucywgdG9rZW5zLmZ1c2FibGUsIGNhdGVnb3JpemVkU2VudGVuY2UpO1xyXG4gIH1cclxuICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gYCBhZnRlciBSYW5nZVJ1bGUgJHtKU09OLnN0cmluZ2lmeShjYXRlZ29yaXplZFNlbnRlbmNlKX0gYCA6ICctJyk7XHJcbiAgcGVyZmxvZyhcIiBzZW50ZW5jZXMgXCIgKyB0b2tlbnMudG9rZW5zLmxlbmd0aCArIFwiIC8gXCIgKyByZXMubGVuZ3RoICsgXCIgbWF0Y2hlcyBcIiArIGNudCArIFwiIGZhYzogXCIgKyBmYWMgKyBcIiByZWMgOiBcIiArIEpTT04uc3RyaW5naWZ5KGNudFJlYywgdW5kZWZpbmVkLCAyKSk7XHJcbiAgcmV0dXJuIHtcclxuICAgIGZ1c2FibGU6IHRva2Vucy5mdXNhYmxlLFxyXG4gICAgdG9rZW5zOiB0b2tlbnMudG9rZW5zLFxyXG4gICAgY2F0ZWdvcml6ZWRXb3JkczogY2F0ZWdvcml6ZWRTZW50ZW5jZVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzU2FtZVJlcyhwcmVzZW50OiBJTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkLCByZXMgOiBJTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkKSAgOiBudW1iZXIge1xyXG4gIGlmKCEoKHByZXNlbnQucnVsZS5tYXRjaGVkU3RyaW5nID09PSByZXMucnVsZS5tYXRjaGVkU3RyaW5nKVxyXG4gICAgJiYgKHByZXNlbnQucnVsZS5jYXRlZ29yeSA9PT0gcmVzLnJ1bGUuY2F0ZWdvcnkpXHJcbiAgICAmJiAocHJlc2VudC5zcGFuID09PSByZXMuc3BhbilcclxuICAmJiAocHJlc2VudC5ydWxlLmJpdGluZGV4ID09PSByZXMucnVsZS5iaXRpbmRleCkpKSB7XHJcbiAgICAgIHJldHVybiAwO1xyXG4gIH1cclxuICBpZihwcmVzZW50Ll9yYW5raW5nIDwgcmVzLl9yYW5raW5nKSB7XHJcbiAgICByZXR1cm4gLTE7XHJcbiAgfVxyXG4gIHJldHVybiArMTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlSWdub3JlT3JBcHBlbmQocmVzdWx0IDogSU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZFtdLCByZXMgOiBJTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nUmFuZ2VkKSB7XHJcbiAgdmFyIGluc2VydGluZGV4ID0gLTE7XHJcbiAgdmFyIGZvdW5kTm90aGluZyA9IHJlc3VsdC5ldmVyeSggKHByZXNlbnQsaW5kZXgpID0+IHtcclxuICAgIHZhciByID0gaXNTYW1lUmVzKHByZXNlbnQscmVzKTtcclxuICAgIGlmIChyIDwgMCkge1xyXG4gICAgICAvL2NvbnNvbGUubG9nKFwib3ZlcndyaXRpbmcgd29yc2UgXFxuXCIgKyBKU09OLnN0cmluZ2lmeShyZXMpICsgJ1xcbicgKyBKU09OLnN0cmluZ2lmeShwcmVzZW50KSsgJ1xcbicpO1xyXG4gICAgICByZXN1bHRbaW5kZXhdID0gcmVzO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9IGVsc2UgaWYociA+IDApIHtcclxuICAgICAgLy9jb25zb2xlLmxvZygnc2tpcHBpbmcgcHJlc2VudCcpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9KTtcclxuICBpZihmb3VuZE5vdGhpbmcpIHtcclxuICAgIC8vZGVidWxvZygncHVzaGluZycpO1xyXG4gICAgcmVzdWx0LnB1c2gocmVzKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBldmFsdWF0ZVJhbmdlUnVsZXNUb1Bvc2l0aW9uKHRva2Vuczogc3RyaW5nW10sIGZ1c2FibGU6IGJvb2xlYW5bXSwgY2F0ZWdvcml6ZWRXb3JkczogSU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZFtdW10pIHtcclxuICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKFwiZXZhbHVhdGVSYW5nZVJ1bGVzVG9Qb3NpdGlvbi4uLiBcIiArIEpTT04uc3RyaW5naWZ5KGNhdGVnb3JpemVkV29yZHMpKSA6ICctJyk7XHJcbiAgY2F0ZWdvcml6ZWRXb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uICh3b3JkbGlzdCwgaW5kZXgpIHtcclxuICAgIHdvcmRsaXN0LmZvckVhY2goZnVuY3Rpb24gKHdvcmQpIHtcclxuICAgICAgaWYgKHdvcmQucnVsZS5yYW5nZSkge1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coYCBnb3QgdGFyZ2V0aW5kZXggZm9yIFJhbmdlUnVsZXMgZXZhbHVhdGlvbiA6ICR7dGFyZ2V0SW5kZXh9ICR7aW5kZXh9ICR7ZnVzYWJsZS5qb2luKFwiIFwiKX1gKTtcclxuICAgICAgICB2YXIgdGFyZ2V0SW5kZXggPSBicmVha2Rvd24uaXNDb21iaW5hYmxlUmFuZ2VSZXR1cm5JbmRleCh3b3JkLnJ1bGUucmFuZ2UsIGZ1c2FibGUsIGluZGV4KTtcclxuICAgICAgICAvL2NvbnNvbGUubG9nKGAgZ290IHRhcmdldGluZGV4IGZvciBSYW5nZVJ1bGVzIGV2YWx1YXRpb24gOiAke3RhcmdldEluZGV4fWApO1xyXG4gICAgICAgIGlmICh0YXJnZXRJbmRleCA+PSAwKSB7XHJcbiAgICAgICAgICB2YXIgY29tYmluZWRXb3JkID0gYnJlYWtkb3duLmNvbWJpbmVUb2tlbnMod29yZC5ydWxlLnJhbmdlLCBpbmRleCwgdG9rZW5zKTtcclxuICAgICAgICAgIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyAoYCB0ZXN0IFwiJHtjb21iaW5lZFdvcmR9XCIgYWdhaW5zdCBcIiR7d29yZC5ydWxlLnJhbmdlLnJ1bGUubG93ZXJjYXNld29yZH1cIiAke0pTT04uc3RyaW5naWZ5KHdvcmQucnVsZS5yYW5nZS5ydWxlKX1gKSA6ICctJyk7XHJcbiAgICAgICAgICB2YXIgcmVzID0gV29yZE1hdGNoLmNhdGVnb3JpemVXb3JkV2l0aE9mZnNldFdpdGhSYW5rQ3V0b2ZmU2luZ2xlKGNvbWJpbmVkV29yZCwgd29yZC5ydWxlLnJhbmdlLnJ1bGUpO1xyXG4gICAgICAgICAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/IChcIiBnb3QgcmVzIDogXCIgKyBKU09OLnN0cmluZ2lmeShyZXMpKSA6ICctJyk7XHJcbiAgICAgICAgICBpZiAocmVzKSB7XHJcbiAgICAgICAgICAgIHJlcy5zcGFuID0gd29yZC5ydWxlLnJhbmdlLmhpZ2ggLSB3b3JkLnJ1bGUucmFuZ2UubG93ICsgMTtcclxuICAgICAgICAgICAgY2F0ZWdvcml6ZWRXb3Jkc1t0YXJnZXRJbmRleF0gPSBjYXRlZ29yaXplZFdvcmRzW3RhcmdldEluZGV4XS5zbGljZSgwKTsgLy8gYXZvaWQgaW52YWxpZGF0aW9uIG9mIHNlZW5pdFxyXG4gICAgICAgICAgICBkZWJ1Z2xvZyhgcHVzaGVkIHN0aCBhdCAke3RhcmdldEluZGV4fWApO1xyXG4gICAgICAgICAgICBtZXJnZUlnbm9yZU9yQXBwZW5kKGNhdGVnb3JpemVkV29yZHNbdGFyZ2V0SW5kZXhdLHJlcyk7XHJcbiAgIC8vICAgICAgICAgY2F0ZWdvcml6ZWRXb3Jkc1t0YXJnZXRJbmRleF0ucHVzaChyZXMpOyAvLyBjaGVjayB0aGF0IHRoaXMgZG9lcyBub3QgaW52YWxpZGF0ZSBzZWVuaXQhXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9KTtcclxuICAvLyBmaWx0ZXIgYWxsIHJhbmdlIHJ1bGVzICFcclxuICBjYXRlZ29yaXplZFdvcmRzLmZvckVhY2goZnVuY3Rpb24gKHdvcmRsaXN0LCBpbmRleCkge1xyXG4gICAgY2F0ZWdvcml6ZWRXb3Jkc1tpbmRleF0gPSB3b3JkbGlzdC5maWx0ZXIod29yZCA9PiAhd29yZC5ydWxlLnJhbmdlKTtcclxuICB9KTtcclxufVxyXG5cclxuXHJcblxyXG5cclxuY29uc3QgY2xvbmUgPSB1dGlscy5jbG9uZURlZXA7XHJcblxyXG5cclxuXHJcblxyXG5mdW5jdGlvbiBjb3B5VmVjTWVtYmVycyh1KSB7XHJcbiAgdmFyIGkgPSAwO1xyXG4gIGZvciAoaSA9IDA7IGkgPCB1Lmxlbmd0aDsgKytpKSB7XHJcbiAgICB1W2ldID0gY2xvbmUodVtpXSk7XHJcbiAgfVxyXG4gIHJldHVybiB1O1xyXG59XHJcblxyXG5cclxuLy8gd2UgY2FuIHJlcGxpY2F0ZSB0aGUgdGFpbCBvciB0aGUgaGVhZCxcclxuLy8gd2UgcmVwbGljYXRlIHRoZSB0YWlsIGFzIGl0IGlzIHNtYWxsZXIuXHJcbi8vIFthLGIsYyBdXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNTcGFuVmVjKHZlYzogQXJyYXk8YW55PiwgaW5kZXg6IG51bWJlcikge1xyXG4gIHZhciBlZmZlY3RpdmVsZW4gPSB2ZWMucmVkdWNlKChwcmV2LCBtZW0pID0+IHByZXYgKz0gbWVtLnNwYW4gPyBtZW0uc3BhbiA6IDEsIDApO1xyXG4gIHJldHVybiBlZmZlY3RpdmVsZW4gPiBpbmRleDtcclxufVxyXG5cclxuLyoqXHJcbiAqIGV4cGFuZCBhbiBhcnJheSBbW2ExLGEyXSwgW2IxLGIyXSxbY11dXHJcbiAqIGludG8gYWxsIGNvbWJpbmF0aW9uc1xyXG4gKlxyXG4gKiAgaWYgYTEgaGFzIGEgc3BhbiBvZiB0aHJlZSwgdGhlIHZhcmlhdGlvbnMgb2YgdGhlIGxvd2VyIGxheWVyIGFyZSBza2lwcGVkXHJcbiAqXHJcbiAqIHdpdGggdGhlIHNwZWNpYWwgcHJvcGVydHlcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBleHBhbmRUb2tlbk1hdGNoZXNUb1NlbnRlbmNlcyh0b2tlbnM6IHN0cmluZ1tdLCB0b2tlbk1hdGNoZXM6IEFycmF5PEFycmF5PGFueT4+KTogSU1hdGNoLklQcm9jZXNzZWRTZW50ZW5jZXMge1xyXG4gIHJldHVybiBleHBhbmRUb2tlbk1hdGNoZXNUb1NlbnRlbmNlczIoIHRva2VucywgdG9rZW5NYXRjaGVzKTtcclxufVxyXG4gLypcclxuZXhwb3J0IGZ1bmN0aW9uIGV4cGFuZFRva2VuTWF0Y2hlc1RvU2VudGVuY2VzKHRva2Vuczogc3RyaW5nW10sIHRva2VuTWF0Y2hlczogQXJyYXk8QXJyYXk8YW55Pj4pOiBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcyB7XHJcbiAgdmFyIGEgPSBbXTtcclxuICB2YXIgd29yZE1hdGNoZXMgPSBbXTtcclxuICBkZWJ1Z2xvZ1YoZGVidWdsb2cuZW5hYmxlZCA/IEpTT04uc3RyaW5naWZ5KHRva2VuTWF0Y2hlcykgOiAnLScpO1xyXG4gIHRva2VuTWF0Y2hlcy5mb3JFYWNoKGZ1bmN0aW9uIChhV29yZE1hdGNoZXMsIHdvcmRJbmRleDogbnVtYmVyKSB7XHJcbiAgICB3b3JkTWF0Y2hlc1t3b3JkSW5kZXhdID0gW107XHJcbiAgICBhV29yZE1hdGNoZXMuZm9yRWFjaChmdW5jdGlvbiAob1dvcmRWYXJpYW50LCB3b3JkVmFyaWFudEluZGV4OiBudW1iZXIpIHtcclxuICAgICAgd29yZE1hdGNoZXNbd29yZEluZGV4XVt3b3JkVmFyaWFudEluZGV4XSA9IG9Xb3JkVmFyaWFudDtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG4gIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyBKU09OLnN0cmluZ2lmeSh0b2tlbk1hdGNoZXMpIDogJy0nKTtcclxuICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgZXJyb3JzOiBbXSxcclxuICAgIHRva2VuczogdG9rZW5zLFxyXG4gICAgc2VudGVuY2VzOiBbXVxyXG4gIH0gYXMgSU1hdGNoLklQcm9jZXNzZWRTZW50ZW5jZXM7XHJcbiAgdmFyIG52ZWNzID0gW107XHJcbiAgdmFyIHJlcyA9IFtbXV07XHJcbiAgLy8gdmFyIG52ZWNzID0gW107XHJcbiAgdmFyIHJ2ZWMgPSBbXTtcclxuICBmb3IgKHZhciB0b2tlbkluZGV4ID0gMDsgdG9rZW5JbmRleCA8IHRva2VuTWF0Y2hlcy5sZW5ndGg7ICsrdG9rZW5JbmRleCkgeyAvLyB3b3JkZyBpbmRleCBrXHJcbiAgICAvL3ZlY3MgaXMgdGhlIHZlY3RvciBvZiBhbGwgc28gZmFyIHNlZW4gdmFyaWFudHMgdXAgdG8gayBsZW5ndGguXHJcbiAgICB2YXIgbmV4dEJhc2UgPSBbXTtcclxuICAgIC8vaW5kZXBlbmRlbnQgb2YgZXhpc3RlbmNlIG9mIG1hdGNoZXMgb24gbGV2ZWwgaywgd2UgcmV0YWluIGFsbCB2ZWN0b3JzIHdoaWNoIGFyZSBjb3ZlcmVkIGJ5IGEgc3BhblxyXG4gICAgLy8gd2Ugc2tpcCBleHRlbmRpbmcgdGhlbSBiZWxvd1xyXG4gICAgZm9yICh2YXIgdSA9IDA7IHUgPCByZXMubGVuZ3RoOyArK3UpIHtcclxuICAgICAgaWYgKGlzU3BhblZlYyhyZXNbdV0sIHRva2VuSW5kZXgpKSB7XHJcbiAgICAgICAgbmV4dEJhc2UucHVzaChyZXNbdV0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB2YXIgbGVuTWF0Y2hlcyA9IHRva2VuTWF0Y2hlc1t0b2tlbkluZGV4XS5sZW5ndGg7XHJcbiAgICBpZiAobmV4dEJhc2UubGVuZ3RoID09PSAwICYmIGxlbk1hdGNoZXMgPT09IDApIHtcclxuICAgICAgLy8gdGhlIHdvcmQgYXQgaW5kZXggSSBjYW5ub3QgYmUgdW5kZXJzdG9vZFxyXG4gICAgICAvL2lmIChyZXN1bHQuZXJyb3JzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXN1bHQuZXJyb3JzLnB1c2goRVJFcnJvci5tYWtlRXJyb3JfTk9fS05PV05fV09SRCh0b2tlbkluZGV4LCB0b2tlbnMpKTtcclxuICAgICAgLy99XHJcbiAgICB9XHJcbiAgICBmb3IgKHZhciBsID0gMDsgbCA8IGxlbk1hdGNoZXM7ICsrbCkgeyAvLyBmb3IgZWFjaCB2YXJpYW50IHByZXNlbnQgYXQgaW5kZXgga1xyXG4gICAgICAvL2RlYnVnbG9nKFwidmVjcyBub3dcIiArIEpTT04uc3RyaW5naWZ5KHZlY3MpKTtcclxuICAgICAgdmFyIG52ZWNzID0gW107IC8vdmVjcy5zbGljZSgpOyAvLyBjb3B5IHRoZSB2ZWNbaV0gYmFzZSB2ZWN0b3I7XHJcbiAgICAgIC8vZGVidWdsb2coXCJ2ZWNzIGNvcGllZCBub3dcIiArIEpTT04uc3RyaW5naWZ5KG52ZWNzKSk7XHJcbiAgICAgIGZvciAodmFyIHUgPSAwOyB1IDwgcmVzLmxlbmd0aDsgKyt1KSB7XHJcbiAgICAgICAgaWYgKCFpc1NwYW5WZWMocmVzW3VdLCB0b2tlbkluZGV4KSkge1xyXG4gICAgICAgICAgLy8gZm9yIGVhY2ggc28gZmFyIGNvbnN0cnVjdGVkIHJlc3VsdCAob2YgbGVuZ3RoIGspIGluIHJlc1xyXG4gICAgICAgICAgbnZlY3MucHVzaChyZXNbdV0uc2xpY2UoKSk7IC8vIG1ha2UgYSBjb3B5IG9mIGVhY2ggdmVjdG9yXHJcbiAgICAgICAgICBudmVjc1tudmVjcy5sZW5ndGggLSAxXSA9IGNvcHlWZWNNZW1iZXJzKG52ZWNzW252ZWNzLmxlbmd0aCAtIDFdKTtcclxuICAgICAgICAgIC8vIGRlYnVnbG9nKFwiY29waWVkIHZlY3NbXCIrIHUrXCJdXCIgKyBKU09OLnN0cmluZ2lmeSh2ZWNzW3VdKSk7XHJcbiAgICAgICAgICBudmVjc1tudmVjcy5sZW5ndGggLSAxXS5wdXNoKFxyXG4gICAgICAgICAgICBjbG9uZSh0b2tlbk1hdGNoZXNbdG9rZW5JbmRleF1bbF0pKTsgLy8gcHVzaCB0aGUgbHRoIHZhcmlhbnRcclxuICAgICAgICAgIC8vIGRlYnVnbG9nKFwibm93IG52ZWNzIFwiICsgbnZlY3MubGVuZ3RoICsgXCIgXCIgKyBKU09OLnN0cmluZ2lmeShudmVjcykpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICAvLyAgIGRlYnVnbG9nKFwiIGF0ICAgICBcIiArIGsgKyBcIjpcIiArIGwgKyBcIiBuZXh0YmFzZSA+XCIgKyBKU09OLnN0cmluZ2lmeShuZXh0QmFzZSkpXHJcbiAgICAgIC8vICAgZGVidWdsb2coXCIgYXBwZW5kIFwiICsgayArIFwiOlwiICsgbCArIFwiIG52ZWNzICAgID5cIiArIEpTT04uc3RyaW5naWZ5KG52ZWNzKSlcclxuICAgICAgbmV4dEJhc2UgPSBuZXh0QmFzZS5jb25jYXQobnZlY3MpO1xyXG4gICAgICAvLyAgIGRlYnVnbG9nKFwiICByZXN1bHQgXCIgKyBrICsgXCI6XCIgKyBsICsgXCIgbnZlY3MgICAgPlwiICsgSlNPTi5zdHJpbmdpZnkobmV4dEJhc2UpKVxyXG4gICAgfSAvL2NvbnN0cnVcclxuICAgIC8vICBkZWJ1Z2xvZyhcIm5vdyBhdCBcIiArIGsgKyBcIjpcIiArIGwgKyBcIiA+XCIgKyBKU09OLnN0cmluZ2lmeShuZXh0QmFzZSkpXHJcbiAgICByZXMgPSBuZXh0QmFzZTtcclxuICB9XHJcbiAgZGVidWdsb2dWKGRlYnVnbG9nVi5lbmFibGVkID8gKFwiQVBQRU5ESU5HIFRPIFJFUzIjXCIgKyAwICsgXCI6XCIgKyBsICsgXCIgPlwiICsgSlNPTi5zdHJpbmdpZnkobmV4dEJhc2UpKSA6ICctJyk7XHJcbiAgcmVzdWx0LnNlbnRlbmNlcyA9IHJlcztcclxuICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG4qL1xyXG5cclxuLy8gdG9kbzogYml0aW5kZXhcclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VBbnlXb3JkKHRva2VuIDogc3RyaW5nKSB7XHJcbiAgcmV0dXJuIHsgc3RyaW5nOiB0b2tlbixcclxuICAgIG1hdGNoZWRTdHJpbmc6IHRva2VuLFxyXG4gICAgY2F0ZWdvcnk6ICdhbnknLFxyXG4gICAgcnVsZTpcclxuICAgICB7IGNhdGVnb3J5OiAnYW55JyxcclxuICAgICAgIHR5cGU6IDAsXHJcbiAgICAgICB3b3JkOiB0b2tlbixcclxuICAgICAgIGxvd2VyY2FzZXdvcmQ6IHRva2VuLnRvTG93ZXJDYXNlKCksXHJcbiAgICAgICBtYXRjaGVkU3RyaW5nOiB0b2tlbixcclxuICAgICAgIGV4YWN0T25seTogdHJ1ZSxcclxuICAgICAgIGJpdGluZGV4OiA0MDk2LFxyXG4gICAgICAgYml0U2VudGVuY2VBbmQ6IDQwOTUsXHJcbiAgICAgICB3b3JkVHlwZTogJ0EnLCAvLyBJTWF0Y2guV09SRFRZUEUuQU5ZLFxyXG4gICAgICAgX3Jhbmtpbmc6IDAuOSB9LFxyXG4gICAgX3Jhbmtpbmc6IDAuOVxyXG4gIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1N1Y2Nlc3Nvck9wZXJhdG9yKHJlcyA6IGFueSwgdG9rZW5JbmRleCA6IG51bWJlcikgOiBib29sZWFuIHtcclxuICBpZih0b2tlbkluZGV4ID09PSAwKSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG4gIGlmKHJlc1tyZXMubGVuZ3RoLTFdLnJ1bGUgJiYgcmVzW3Jlcy5sZW5ndGgtMV0ucnVsZS53b3JkVHlwZSA9PT0gJ08nKSB7XHJcbiAgICBpZiAoIElNYXRjaC5hQW55U3VjY2Vzc29yT3BlcmF0b3JOYW1lcy5pbmRleE9mKHJlc1tyZXMubGVuZ3RoLTFdLnJ1bGUubWF0Y2hlZFN0cmluZykgPj0gMClcclxuICAgIHtcclxuICAgICAgZGVidWdsb2coKCk9PicgaXNTdWNjZXNzb3JPcGVyYXRvcicgKyBKU09OLnN0cmluZ2lmeSggcmVzW3Jlcy5sZW5ndGgtMV0gKSk7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gZmFsc2U7XHJcbn1cclxuLyoqXHJcbiAqIGV4cGFuZCBhbiBhcnJheSBbW2ExLGEyXSwgW2IxLGIyXSxbY11dXHJcbiAqIGludG8gYWxsIGNvbWJpbmF0aW9uc1xyXG4gKlxyXG4gKiAgaWYgYTEgaGFzIGEgc3BhbiBvZiB0aHJlZSwgdGhlIHZhcmlhdGlvbnMgb2YgdGhlIGxvd2VyIGxheWVyIGFyZSBza2lwcGVkXHJcbiAqXHJcbiAqIHdpdGggdGhlIHNwZWNpYWwgcHJvcGVydHlcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBleHBhbmRUb2tlbk1hdGNoZXNUb1NlbnRlbmNlczIodG9rZW5zOiBzdHJpbmdbXSwgdG9rZW5NYXRjaGVzOiBBcnJheTxBcnJheTxhbnk+Pik6IElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzIHtcclxuICB2YXIgYSA9IFtdO1xyXG4gIHZhciB3b3JkTWF0Y2hlcyA9IFtdO1xyXG4gIGRlYnVnbG9nVihkZWJ1Z2xvZy5lbmFibGVkID8gSlNPTi5zdHJpbmdpZnkodG9rZW5NYXRjaGVzKSA6ICctJyk7XHJcbiAgdG9rZW5NYXRjaGVzLmZvckVhY2goZnVuY3Rpb24gKGFXb3JkTWF0Y2hlcywgd29yZEluZGV4OiBudW1iZXIpIHtcclxuICAgIHdvcmRNYXRjaGVzW3dvcmRJbmRleF0gPSBbXTtcclxuICAgIGFXb3JkTWF0Y2hlcy5mb3JFYWNoKGZ1bmN0aW9uIChvV29yZFZhcmlhbnQsIHdvcmRWYXJpYW50SW5kZXg6IG51bWJlcikge1xyXG4gICAgICB3b3JkTWF0Y2hlc1t3b3JkSW5kZXhdW3dvcmRWYXJpYW50SW5kZXhdID0gb1dvcmRWYXJpYW50O1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbiAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/IEpTT04uc3RyaW5naWZ5KHRva2VuTWF0Y2hlcykgOiAnLScpO1xyXG4gIHZhciByZXN1bHQgPSB7XHJcbiAgICBlcnJvcnM6IFtdLFxyXG4gICAgdG9rZW5zOiB0b2tlbnMsXHJcbiAgICBzZW50ZW5jZXM6IFtdXHJcbiAgfSBhcyBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcztcclxuICB2YXIgbnZlY3MgPSBbXTtcclxuICB2YXIgcmVzID0gW1tdXTtcclxuICAvLyB2YXIgbnZlY3MgPSBbXTtcclxuICB2YXIgcnZlYyA9IFtdO1xyXG4gIGZvciAodmFyIHRva2VuSW5kZXggPSAwOyB0b2tlbkluZGV4IDwgdG9rZW5NYXRjaGVzLmxlbmd0aDsgKyt0b2tlbkluZGV4KSB7IC8vIHdvcmRnIGluZGV4IGtcclxuICAgIC8vdmVjcyBpcyB0aGUgdmVjdG9yIG9mIGFsbCBzbyBmYXIgc2VlbiB2YXJpYW50cyB1cCB0byB0b2tlbkluZGV4IGxlbmd0aC5cclxuICAgIHZhciBuZXh0QmFzZSA9IFtdO1xyXG4gICAgLy8gaW5kZXBlbmRlbnQgb2YgZXhpc3RlbmNlIG9mIG1hdGNoZXMgb24gbGV2ZWwgaywgd2UgcmV0YWluIGFsbCB2ZWN0b3JzIHdoaWNoIGFyZSBjb3ZlcmVkIGJ5IGEgc3BhblxyXG4gICAgLy8gd2Ugc2tpcCBleHRlbmRpbmcgdGhlbSBiZWxvd1xyXG4gICAgZm9yICh2YXIgdSA9IDA7IHUgPCByZXMubGVuZ3RoOyArK3UpIHtcclxuICAgICAgaWYgKGlzU3BhblZlYyhyZXNbdV0sIHRva2VuSW5kZXgpKSB7XHJcbiAgICAgICAgbmV4dEJhc2UucHVzaChyZXNbdV0pO1xyXG4gICAgICB9IGVsc2UgaWYoIGlzU3VjY2Vzc29yT3BlcmF0b3IocmVzW3VdLHRva2VuSW5kZXgpKSB7XHJcbiAgICAgICAgcmVzW3VdLnB1c2gobWFrZUFueVdvcmQodG9rZW5zW3Rva2VuSW5kZXhdKSk7XHJcbiAgICAgICAgbmV4dEJhc2UucHVzaChyZXNbdV0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBpbmRlcGVuZGVudCBvZiBleGlzdGVuY2Ugb2YgbWF0Y2hlcyBvbiBsZXZlbCB0b2tlbkluZGV4LCB3ZSBleHRlbmQgYWxsIHZlY3RvcnMgd2hpY2hcclxuICAgIC8vIGFyZSBhIHN1Y2Nlc3NvciBvZiBhIGJpbmFyeSBleHRlbmRpbmcgb3AgKCBsaWtlIFwic3RhcnRpbmcgd2l0aFwiLCBcImNvbnRhaW5pbmdcIiB3aXRoIHRoZSBuZXh0IHRva2VuKVxyXG4gICAgLyogICBmb3IodmFyIHJlc0luZGV4ID0gMDsgcmVzSW5kZXggPCByZXMubGVuZ3RoOyArK3Jlc0luZGV4KSB7XHJcbiAgICAgIGlmIChpc1N1Y2Nlc3Nvck9wZXJhdG9yKHJlc1tyZXNJbmRleF0sIHRva2VuSW5kZXgpKSB7XHJcbiAgICAgICAgcmVzW3Jlc0luZGV4XS5wdXNoKG1ha2VBbnlXb3JkKHRva2Vuc1t0b2tlbkluZGV4XSkpO1xyXG4gICAgICAgIG5leHRCYXNlLnB1c2gocmVzW3Jlc0luZGV4XSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgICovXHJcbiAgICB2YXIgbGVuTWF0Y2hlcyA9IHRva2VuTWF0Y2hlc1t0b2tlbkluZGV4XS5sZW5ndGg7XHJcbiAgICBpZiAobmV4dEJhc2UubGVuZ3RoID09PSAwICYmIGxlbk1hdGNoZXMgPT09IDApIHtcclxuICAgICAgLy8gdGhlIHdvcmQgYXQgaW5kZXggSSBjYW5ub3QgYmUgdW5kZXJzdG9vZFxyXG4gICAgICAvL2lmIChyZXN1bHQuZXJyb3JzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXN1bHQuZXJyb3JzLnB1c2goRVJFcnJvci5tYWtlRXJyb3JfTk9fS05PV05fV09SRCh0b2tlbkluZGV4LCB0b2tlbnMpKTtcclxuICAgICAgLy99XHJcbiAgICB9XHJcbiAgICBmb3IgKHZhciBsID0gMDsgbCA8IGxlbk1hdGNoZXM7ICsrbCkgeyAvLyBmb3IgZWFjaCB2YXJpYW50IHByZXNlbnQgYXQgaW5kZXgga1xyXG4gICAgICAvL2RlYnVnbG9nKFwidmVjcyBub3dcIiArIEpTT04uc3RyaW5naWZ5KHZlY3MpKTtcclxuICAgICAgdmFyIG52ZWNzID0gW107IC8vdmVjcy5zbGljZSgpOyAvLyBjb3B5IHRoZSB2ZWNbaV0gYmFzZSB2ZWN0b3I7XHJcbiAgICAgIC8vZGVidWdsb2coXCJ2ZWNzIGNvcGllZCBub3dcIiArIEpTT04uc3RyaW5naWZ5KG52ZWNzKSk7XHJcbiAgICAgIGZvciAodmFyIHUgPSAwOyB1IDwgcmVzLmxlbmd0aDsgKyt1KSB7XHJcbiAgICAgICAgaWYgKCFpc1NwYW5WZWMocmVzW3VdLCB0b2tlbkluZGV4KSAmJiAhaXNTdWNjZXNzb3JPcGVyYXRvcihyZXNbdV0sdG9rZW5JbmRleCkpIHtcclxuICAgICAgICAgIC8vIGZvciBlYWNoIHNvIGZhciBjb25zdHJ1Y3RlZCByZXN1bHQgKG9mIGxlbmd0aCBrKSBpbiByZXNcclxuICAgICAgICAgIG52ZWNzLnB1c2gocmVzW3VdLnNsaWNlKCkpOyAvLyBtYWtlIGEgY29weSBvZiBlYWNoIHZlY3RvclxyXG4gICAgICAgICAgbnZlY3NbbnZlY3MubGVuZ3RoIC0gMV0gPSBjb3B5VmVjTWVtYmVycyhudmVjc1tudmVjcy5sZW5ndGggLSAxXSk7XHJcbiAgICAgICAgICAvLyBkZWJ1Z2xvZyhcImNvcGllZCB2ZWNzW1wiKyB1K1wiXVwiICsgSlNPTi5zdHJpbmdpZnkodmVjc1t1XSkpO1xyXG4gICAgICAgICAgbnZlY3NbbnZlY3MubGVuZ3RoIC0gMV0ucHVzaChcclxuICAgICAgICAgICAgY2xvbmUodG9rZW5NYXRjaGVzW3Rva2VuSW5kZXhdW2xdKSk7IC8vIHB1c2ggdGhlIGx0aCB2YXJpYW50XHJcbiAgICAgICAgICAvLyBkZWJ1Z2xvZyhcIm5vdyBudmVjcyBcIiArIG52ZWNzLmxlbmd0aCArIFwiIFwiICsgSlNPTi5zdHJpbmdpZnkobnZlY3MpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgLy8gICBkZWJ1Z2xvZyhcIiBhdCAgICAgXCIgKyBrICsgXCI6XCIgKyBsICsgXCIgbmV4dGJhc2UgPlwiICsgSlNPTi5zdHJpbmdpZnkobmV4dEJhc2UpKVxyXG4gICAgICAvLyAgIGRlYnVnbG9nKFwiIGFwcGVuZCBcIiArIGsgKyBcIjpcIiArIGwgKyBcIiBudmVjcyAgICA+XCIgKyBKU09OLnN0cmluZ2lmeShudmVjcykpXHJcbiAgICAgIG5leHRCYXNlID0gbmV4dEJhc2UuY29uY2F0KG52ZWNzKTtcclxuICAgICAgLy8gICBkZWJ1Z2xvZyhcIiAgcmVzdWx0IFwiICsgayArIFwiOlwiICsgbCArIFwiIG52ZWNzICAgID5cIiArIEpTT04uc3RyaW5naWZ5KG5leHRCYXNlKSlcclxuICAgIH0gLy9jb25zdHJ1XHJcbiAgICAvLyAgZGVidWdsb2coXCJub3cgYXQgXCIgKyBrICsgXCI6XCIgKyBsICsgXCIgPlwiICsgSlNPTi5zdHJpbmdpZnkobmV4dEJhc2UpKVxyXG4gICAgcmVzID0gbmV4dEJhc2U7XHJcbiAgfVxyXG4gIGRlYnVnbG9nVihkZWJ1Z2xvZ1YuZW5hYmxlZCA/IChcIkFQUEVORElORyBUTyBSRVMxI1wiICsgMCArIFwiOlwiICsgbCArIFwiID5cIiArIEpTT04uc3RyaW5naWZ5KG5leHRCYXNlKSkgOiAnLScpO1xyXG4gIHJlcyA9IHJlcy5maWx0ZXIoIChzZW50ZW5jZSxpbmRleCkgPT4ge1xyXG4gICAgdmFyIGZ1bGwgPSAweEZGRkZGRkZGO1xyXG4gICAgLy9jb25zb2xlLmxvZyhgc2VudGVuY2UgICR7aW5kZXh9ICBcXG5gKVxyXG4gICAgcmV0dXJuIHNlbnRlbmNlLmV2ZXJ5KCAod29yZCxpbmRleDIpID0+IHtcclxuICAgICAgaWYgKCF3b3JkLnJ1bGUpXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIGZ1bGwgPSAoZnVsbCAmIHdvcmQucnVsZS5iaXRTZW50ZW5jZUFuZCk7XHJcbiAgICAgIC8vY29uc29sZS5sb2coYCB3b3JkICAke2luZGV4Mn0gJHtmdWxsfSBcIiR7d29yZC5tYXRjaGVkU3RyaW5nfVwiICR7d29yZC5ydWxlLmJpdFNlbnRlbmNlQW5kfSAgJHt0b2tlbnNbaW5kZXgyXX0gXFxuYCk7XHJcbiAgICAgIHJldHVybiBmdWxsICE9PSAwIH0gKVxyXG4gIH0pO1xyXG4gIHJlc3VsdC5zZW50ZW5jZXMgPSByZXM7XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcHJvY2Vzc1N0cmluZyhxdWVyeTogc3RyaW5nLCBydWxlczogSUZNb2RlbC5TcGxpdFJ1bGVzLFxyXG4gd29yZHM6IHsgW2tleTogc3RyaW5nXTogQXJyYXk8SU1hdGNoLklDYXRlZ29yaXplZFN0cmluZz4gfSxcclxuIG9wZXJhdG9ycyA6IHsgW2tleTpzdHJpbmddIDogSU9wZXJhdG9yIH1cclxuKTogIElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzIHtcclxuICB3b3JkcyA9IHdvcmRzIHx8IHt9O1xyXG4gIG9wZXJhdG9ycyA9IG9wZXJhdG9ycyB8fCB7fTtcclxuICAvL2lmKCFwcm9jZXNzLmVudi5BQk9UX05PX1RFU1QxKSB7XHJcbiAgcmV0dXJuIHByb2Nlc3NTdHJpbmcyKHF1ZXJ5LCBydWxlcywgd29yZHMsIG9wZXJhdG9ycyk7XHJcbn1cclxuICAvKlxyXG4gIHZhciB0b2tlblN0cnVjdCA9IHRva2VuaXplU3RyaW5nKHF1ZXJ5LCBydWxlcywgd29yZHMpO1xyXG4gIGV2YWx1YXRlUmFuZ2VSdWxlc1RvUG9zaXRpb24odG9rZW5TdHJ1Y3QudG9rZW5zLCB0b2tlblN0cnVjdC5mdXNhYmxlLFxyXG4gICAgdG9rZW5TdHJ1Y3QuY2F0ZWdvcml6ZWRXb3Jkcyk7XHJcbiAgaWYgKGRlYnVnbG9nLmVuYWJsZWQpIHtcclxuICAgIGRlYnVnbG9nKFwiQWZ0ZXIgbWF0Y2hlZCBcIiArIEpTT04uc3RyaW5naWZ5KHRva2VuU3RydWN0LmNhdGVnb3JpemVkV29yZHMpKTtcclxuICB9XHJcbiAgdmFyIGFTZW50ZW5jZXMgPSBleHBhbmRUb2tlbk1hdGNoZXNUb1NlbnRlbmNlcyh0b2tlblN0cnVjdC50b2tlbnMsIHRva2VuU3RydWN0LmNhdGVnb3JpemVkV29yZHMpO1xyXG4gIGlmIChkZWJ1Z2xvZy5lbmFibGVkKSB7XHJcbiAgICBkZWJ1Z2xvZyhcImFmdGVyIGV4cGFuZFwiICsgYVNlbnRlbmNlcy5zZW50ZW5jZXMubWFwKGZ1bmN0aW9uIChvU2VudGVuY2UpIHtcclxuICAgIHJldHVybiBTZW50ZW5jZS5yYW5raW5nUHJvZHVjdChvU2VudGVuY2UpICsgXCI6XCIgKyBTZW50ZW5jZS5kdW1wTmljZShvU2VudGVuY2UpOyAvL0pTT04uc3RyaW5naWZ5KG9TZW50ZW5jZSk7XHJcbiAgICB9KS5qb2luKFwiXFxuXCIpKTtcclxuICB9XHJcbiAgYVNlbnRlbmNlcy5zZW50ZW5jZXMgPSBXb3JkTWF0Y2gucmVpbkZvcmNlKGFTZW50ZW5jZXMuc2VudGVuY2VzKTtcclxuICBpZiAoZGVidWdsb2cuZW5hYmxlZCkge1xyXG4gICAgZGVidWdsb2coXCJhZnRlciByZWluZm9yY2VcIiArIGFTZW50ZW5jZXMuc2VudGVuY2VzLm1hcChmdW5jdGlvbiAob1NlbnRlbmNlKSB7XHJcbiAgICAgIHJldHVybiBTZW50ZW5jZS5yYW5raW5nUHJvZHVjdChvU2VudGVuY2UpICsgXCI6XCIgKyBKU09OLnN0cmluZ2lmeShvU2VudGVuY2UpO1xyXG4gICAgfSkuam9pbihcIlxcblwiKSk7XHJcbiAgfVxyXG4gIHJldHVybiBhU2VudGVuY2VzO1xyXG4gICovXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRDbG9zZUlkZW50aWNhbHMoIG1wIDogIHtba2V5IDogc3RyaW5nXSA6IElNYXRjaC5JV29yZH0sIHdvcmQgOiBJTWF0Y2guSVdvcmQgKSA6IEFycmF5PElNYXRjaC5JV29yZD5cclxue1xyXG4gIHZhciByZXMgPSBbXSBhcyBBcnJheTxJTWF0Y2guSVdvcmQ+O1xyXG4gIGZvciggdmFyIGtleSBpbiBtcCApXHJcbiAge1xyXG4gICAgaWYgKCBrZXkgPT0gd29yZC5zdHJpbmcgKVxyXG4gICAge1xyXG4gICAgICByZXMucHVzaCggbXBbIGtleSBdKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCBDaGFyU2VxdWVuY2UuQ2hhclNlcXVlbmNlLmlzU2FtZU9yUGx1cmFsT3JWZXJ5Q2xvc2UoIGtleSwgd29yZC5zdHJpbmcgKSApXHJcbiAgICB7XHJcbiAgICAgIHJlcy5wdXNoKCBtcFtrZXldICk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiByZXM7XHJcbn1cclxuXHJcbi8qIFJldHVybiB0cnVlIGlmIHRoZSBpZGVudGljYWwgKnNvdXJjZSB3b3JkKiBpcyBpbnRlcnByZXRlZFxyXG4qICh3aXRoaW4gdGhlIHNhbWUgZG9tYWluIGFuZCB0aGUgc2FtZSB3b3JkdHlwZSlcclxuKiBhcyBhIGRpZmZlcm5lbnQgIChlLmcuIGVsZW1lbnQgbnVtYiBpcyBvbmUgaW50ZXJwcmV0ZWQgYXMgJ0NBVCcgZWxlbWVudCBuYW1lLCBvbmNlIGFzIENBVCAnZWxlbWVudCBudW1iZXInIGluXHJcbipcclxuKiBleGFtcGxlXHJcbiogWyAnZWxlbWVudCBuYW1lcz0+ZWxlbWVudCBudW1iZXIvY2F0ZWdvcnkvMiBGMTYnLCAgICAgICAgIDw8PCAoMSlcclxuKiAgICAnZWxlbWVudCBudW1iZXI9PmVsZW1lbnQgbnVtYmVyL2NhdGVnb3J5LzIgRjE2JyxcclxuKiAgICAnZWxlbWVudCB3ZWlnaHQ9PmF0b21pYyB3ZWlnaHQvY2F0ZWdvcnkvMiBGMTYnLFxyXG4qICAgICdlbGVtZW50IG5hbWU9PmVsZW1lbnQgbmFtZS9jYXRlZ29yeS8yIEYxNicsICAgICAgICAgICA8PDwgKDIpXHJcbiogICAgJ3dpdGg9PndpdGgvZmlsbGVyIEkyNTYnLFxyXG4qICAgICdlbGVtZW50IG5hbWU9PmVsZW1lbnQgbmFtZS9jYXRlZ29yeS8yIEYxNicsICAgICAgICAgICA8PDwgKDMpXHJcbiogICAnc3RhcnRpbmcgd2l0aD0+c3RhcnRpbmcgd2l0aC9vcGVyYXRvci8yIE8yNTYnLFxyXG4qICAgICdBQkM9PkFCQy9hbnkgQTQwOTYnIF0sXHJcbipcclxuKiBzYW1lIGRvbWFpbiBJVVBBQyBlbGVtZW50cylcclxuKlxyXG4qICAoMSkgZGlmZmVycyB0byAoMiksKDMpIGFsdGhvdWdoIHRoZSBiYXNlIHdvcmRzIGFyZSB2ZXJ5IHNpbWlsYXIgZWxlbWVudCBuYW1lcywgZWxlbWVudCBuYW1lLCBlbGVtZW50IG5hbWUgcmVzcGVjdGl2ZWx5XHJcbipcclxuKiAtIGV4YWN0IG1hdGNoXHJcbiogLSBzdGVtbWluZyBieSByZW1vdmluZy9hcHBlbmRpbmcgdHJhbGluZyBzXHJcbiogLSBjbG9zZW5lc3NcclxuKlxyXG4qIEBwYXJhbSBzZW50ZW5jZVxyXG4qL1xyXG5leHBvcnQgZnVuY3Rpb24gaXNEaXN0aW5jdEludGVycHJldGF0aW9uRm9yU2FtZShzZW50ZW5jZSA6IElNYXRjaC5JU2VudGVuY2UpIDogYm9vbGVhbiB7XHJcbiAgdmFyIG1wID0ge30gYXMge1trZXkgOiBzdHJpbmddIDogSU1hdGNoLklXb3JkfTtcclxuICB2YXIgcmVzID0gc2VudGVuY2UuZXZlcnkoKHdvcmQsIGluZGV4KSA9PiB7XHJcbiAgICB2YXIgc2VlbnMgPSBmaW5kQ2xvc2VJZGVudGljYWxzKCBtcCwgd29yZCApO1xyXG4gICAgZGVidWdsb2coXCIgaW52ZXN0aWdhdGluZyBzZWVucyBmb3IgXCIgKyB3b3JkLnN0cmluZyArIFwiIFwiICsgSlNPTi5zdHJpbmdpZnkoc2VlbnMsIHVuZGVmaW5lZCwgMikpO1xyXG4gICAgZm9yKCB2YXIgc2VlbiBvZiBzZWVucylcclxuICAgIHtcclxuICAgICAgLy92YXIgc2VlbiA9IG1wW3dvcmQuc3RyaW5nXTtcclxuICAgICAgLyppZighc2Vlbikge1xyXG4gICAgICAgIG1wW3dvcmQuc3RyaW5nXSA9IHdvcmQ7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH0qL1xyXG4gICAgICBpZighc2Vlbi5ydWxlIHx8ICF3b3JkLnJ1bGUpIHtcclxuICAgICAgICAvL3JldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYoc2Vlbi5ydWxlLmJpdGluZGV4ID09PSB3b3JkLnJ1bGUuYml0aW5kZXhcclxuICAgICAgICAmJiBzZWVuLnJ1bGUubWF0Y2hlZFN0cmluZyAhPT0gd29yZC5ydWxlLm1hdGNoZWRTdHJpbmcgKXtcclxuICAgICAgICAgIGRlYnVnbG9nKFwic2tpcHBpbmcgdGhpc1wiICsgSlNPTi5zdHJpbmdpZnkoc2VudGVuY2UsdW5kZWZpbmVkLDIpKTtcclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYoIW1wW3dvcmQuc3RyaW5nXSlcclxuICAgIHtcclxuICAgICAgbXBbd29yZC5zdHJpbmddID0gd29yZDtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuIH0pO1xyXG4gcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzU2FtZUNhdGVnb3J5QW5kSGlnaGVyTWF0Y2goc2VudGVuY2UgOiBJTWF0Y2guSVNlbnRlbmNlLCAgaWR4bWFwIDogeyBbYWtleSA6IG51bWJlcl0gOiBBcnJheTxJTWF0Y2guSVdvcmQ+IH0pIDogYm9vbGVhbiB7XHJcbiAgdmFyIGlkeG1hcG90aGVyID0ge30gYXMgeyBbYWtleSA6IG51bWJlcl0gOiBBcnJheTxJTWF0Y2guSVdvcmQ+IH07XHJcbiAgdmFyIGNudCA9IDA7XHJcbiAgdmFyIHByb2RvID0xLjA7XHJcbiAgdmFyIHByb2QgPSAxLjA7XHJcbiAgT2JqZWN0LmtleXMoIGlkeG1hcCApLmZvckVhY2goIChpZHhrZXkpID0+IHtcclxuICAgIHZhciB3cmQgPSBpZHhtYXBbaWR4a2V5XTtcclxuICAgIHZhciBpZHggPSBwYXJzZUludCggaWR4a2V5ICk7XHJcbiAgICBpZiAoIHNlbnRlbmNlLmxlbmd0aCA+IGlkeCApXHJcbiAgICB7XHJcbiAgICAgIHZhciB3cmRvID0gc2VudGVuY2VbaWR4XTtcclxuICAgICAgaWYoIHdyZG8uc3RyaW5nID09PSB3cmQuc3RyaW5nXHJcbiAgICAgICAgJiYgd3Jkby5ydWxlLmJpdGluZGV4ID09PSB3cmQucnVsZS5iaXRpbmRleFxyXG4gICAgICAgICYmIHdyZG8ucnVsZS53b3JkVHlwZSA9PT0gd3JkLnJ1bGUud29yZFR5cGVcclxuICAgICAgICAmJiB3cmRvLnJ1bGUuY2F0ZWdvcnkgPT09IHdyZC5ydWxlLmNhdGVnb3J5IClcclxuICAgICAge1xyXG4gICAgICAgICsrY250O1xyXG4gICAgICAgIHByb2RvID0gcHJvZG8gKiB3cmRvLl9yYW5raW5nO1xyXG4gICAgICAgIHByb2QgPSBwcm9kICogd3JkLl9yYW5raW5nO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgaWYgKCBjbnQgPT09IE9iamVjdC5rZXlzKCBpZHhtYXAgKS5sZW5ndGggJiYgcHJvZG8gPiBwcm9kIClcclxuICB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcbiAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRfaXRoX2FyZyggb25lcG9zIDogbnVtYmVyLCBvcHBvcyA6IG51bWJlciwgc2VudGVuY2U6IElNYXRjaC5JU2VudGVuY2UsIGluZGV4IDogbnVtYmVyICkgOiBJTWF0Y2guSVdvcmRcclxueyAvLy8gICAgICAgICBvcHBvcz0wICAgICBvcHBvcz0tMSAgICAgb3Bwb3M9LTIgICBvcHBvcz0xXHJcbiAgLy8gMSAtPiAgMCAgLTE7ICAgICAgICAgICAxICAgICAgICAgICAgMiAgICAgICAgIC0yXHJcbiAgLy8gMiAgLT4gMSAgIDE7ICAgICAgICAgICAyICAgICAgICAgICAgMyAgICAgICAgIC0xXHJcbiAgdmFyIHBvcyA9IG9uZXBvcyAtIDE7XHJcbiAgaWYgKCBwb3MgPD0gb3Bwb3MgKVxyXG4gICAgIHBvcyA9IC0xO1xyXG4gIHBvcyAtPSBvcHBvcztcclxuICB2YXIgaWR4ID0gcG9zICsgaW5kZXg7XHJcbiAgcmV0dXJuIHNlbnRlbmNlW2lkeF07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0JhZE9wZXJhdG9yQXJncyhzZW50ZW5jZSA6IElNYXRjaC5JU2VudGVuY2UsIG9wZXJhdG9yczogSU1hdGNoLklPcGVyYXRvcnMgKSA6IGJvb2xlYW4ge1xyXG4gIGlmIChpc051bGxPckVtcHR5RGljdGlvbmFyeShvcGVyYXRvcnMpKVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIHJldHVybiAhc2VudGVuY2UuZXZlcnkoICh3b3JkLCBpbmRleCkgPT4ge1xyXG4gICAgaWYoICAod29yZC5ydWxlICYmIHdvcmQucnVsZS53b3JkVHlwZSkgIT0gSU1hdGNoLldPUkRUWVBFLk9QRVJBVE9SIClcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB2YXIgb3AgPW9wZXJhdG9yc1t3b3JkLnJ1bGUubWF0Y2hlZFN0cmluZ107XHJcbiAgICBpZiggIW9wKVxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIHZhciBvcGVyYXRvcnBvcyA9IG9wLm9wZXJhdG9ycG9zIHx8IDA7XHJcbiAgICBpZiAoIW9wLmFyaXR5KVxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIGZvciggdmFyIGkgPSAxOyBpIDw9IG9wLmFyaXR5OyArK2kpXHJcbiAgICB7XHJcbiAgICAgIHZhciBpdGhfYXJnID0gZ2V0X2l0aF9hcmcoIGksIG9wZXJhdG9ycG9zICwgc2VudGVuY2UsIGluZGV4ICk7XHJcbiAgICAgIGlmICghaXRoX2FyZylcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIHZhciBhcmd0eXBlID0gb3AuYXJnY2F0ZWdvcnlbIGkgLSAxXTtcclxuICAgICAgdmFyIGFyZ3R5cGV4ID0gYXJndHlwZS5tYXAoICAoeCkgPT4gV29yZC5Xb3JkVHlwZS5mcm9tQ2F0ZWdvcnlTdHJpbmcoIHggKSk7XHJcbiAgICAgIGlmICggYXJndHlwZXguaW5kZXhPZiggaXRoX2FyZy5ydWxlLndvcmRUeXBlICkgPCAwIClcclxuICAgICAge1xyXG4gICAgICAgIGRlYnVnbG9nKCAoKT0+IHsgcmV0dXJuIFwiZGlzY2FyZGluZyBkdWUgdG8gYXJnIFwiICsgb3Aub3BlcmF0b3IgKyBcIiBhcmcgI1wiICsgaSArIFwiIGV4cGVjdGVkXCIgKyBKU09OLnN0cmluZ2lmeSggYXJndHlwZXggKSArIFwiIHdhcyBcIiAgKyBpdGhfYXJnLnJ1bGUud29yZFR5cGU7fSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9KTtcclxufVxyXG5cclxuXHJcbi8qIFJldHVybiB0cnVlIGlmIHRoZSBpZGVudGljYWwgKnRhcmdldCB3b3JkKiBpcyBleHByZXNzZWQgYnkgZGlmZmVyZW50IHNvdXJjZSB3b3Jkc1xyXG4qICh3aXRoaW4gdGhlIHNhbWUgZG9tYWluIGFuZCB0aGUgc2FtZSB3b3JkdHlwZSlcclxuKlxyXG4qIHRoaXMgaXMgcHJvYmxlbWF0aWMgd2l0aCBhbGlhc2VzIG1hcHBlZCBvbnRvIHRoZSBzYW1lIHRhcmdldCwgKGVnLiB3aGVyZSAtPiB3aXRoLCB3aXRoIC0+IHdoZXJlIClcclxuKiBzbyBwZXJoYXBzIG9ubHkgZm9yIGNhdGVnb3JpZXMgYW5kIGZhY3RzP1xyXG4qXHJcbiogZXhhbXBsZSA8cHJlPlxyXG4qIFsgJ2VsZW1lbnQgbmFtZXM9PmVsZW1lbnQgbnVtYmVyL2NhdGVnb3J5LzIgQzgnLCAgICAgICAgIDw8PCAoMWEpXHJcbiogICAgJ2VsZW1lbnQgbnVtYmVyPT5lbGVtZW50IG51bWJlci9jYXRlZ29yeS8yIEM4JywgICAgICAgPDw8ICgyKVxyXG4qICAgICdlbGVtZW50IHdlaWdodD0+YXRvbWljIHdlaWdodC9jYXRlZ29yeS8yIEM4JyxcclxuKiAgICAnZWxlbWVudCBuYW1lPT5lbGVtZW50IG51bWJlci9jYXRlZ29yeS8yIEM4JywgICAgICAgICAgIDw8PCAoMWIpXHJcbiogICAgJ3dpdGg9PndpdGgvZmlsbGVyIEkyNTYnLFxyXG4qICAgICdlbGVtZW50IG5hbWU9PmVsZW1lbnQgbnVtYmVyL2NhdGVnb3J5LzIgQzgnLCAgICAgICAgICAgPDw8ICgxYylcclxuKiAgICAnc3RhcnRpbmcgd2l0aD0+c3RhcnRpbmcgd2l0aC9vcGVyYXRvci8yIE8yNTYnLFxyXG4qICAgICdBQkM9PkFCQy9hbnkgQTQwOTYnIF0sXHJcbipcclxuKiBzYW1lIGRvbWFpbiBJVVBBQyBlbGVtZW50cylcclxuKlxyXG4qICAoMWFiYykgZGlmZmVycyBmcm9tICgyKSxcclxuKiAgYW5kIHRoZXJlIGlzIGEgbXVjaCBiZXR0ZXIgaW50ZXJwcmV0YXRpb24gYXJvdW5kXHJcbiogPC9wcmU+XHJcbiogLSBleGFjdCBtYXRjaFxyXG4qIC0gc3RlbW1pbmcgYnkgcmVtb3ZpbmcvYXBwZW5kaW5nIHRyYWxpbmcgc1xyXG4qIC0gY2xvc2VuZXNzXHJcbipcclxuKiBAcGFyYW0gc2VudGVuY2VcclxuKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzTm9uT3B0aW1hbERpc3RpbmN0U291cmNlRm9yU2FtZShzZW50ZW5jZSA6IElNYXRjaC5JU2VudGVuY2UsIHNlbnRlbmNlcyA6IEFycmF5PElNYXRjaC5JU2VudGVuY2U+KSA6IGJvb2xlYW4ge1xyXG4gIHZhciBtcCA9IHt9IGFzIHtba2V5IDogc3RyaW5nXSA6ICB7IFtrZXkgOiBudW1iZXJdIDogQXJyYXk8SU1hdGNoLklXb3JkPiB9IH07XHJcbiAgLy8gY2FsY3VsYXRlIGNvbmZsaWN0cyA6ICAgIFt0YWdldF93b3JkIC0+IF1cclxuICB2YXIgcmVzID0gc2VudGVuY2UuZXZlcnkoKHdvcmQpID0+IHtcclxuICAgIGlmICggd29yZC5jYXRlZ29yeSA9PT0gV29yZC5DYXRlZ29yeS5DQVRfQ0FURUdPUllcclxuICAgICAgJiYgKCAgd29yZC5ydWxlLndvcmRUeXBlID09PSBJTWF0Y2guV09SRFRZUEUuRkFDVFxyXG4gICAgICAgICB8fCB3b3JkLnJ1bGUud29yZFR5cGUgPT09IElNYXRjaC5XT1JEVFlQRS5DQVRFR09SWSApKVxyXG4gICAge1xyXG4gICAgICBpZiAoIW1wW3dvcmQucnVsZS5tYXRjaGVkU3RyaW5nIF0pXHJcbiAgICAgICAgbXBbd29yZC5ydWxlLm1hdGNoZWRTdHJpbmddID0ge30gYXMgeyBba2V5IDogbnVtYmVyXSA6IEFycmF5PElNYXRjaC5JV29yZD4gfTtcclxuICAgICAgaWYoICFtcFt3b3JkLnJ1bGUubWF0Y2hlZFN0cmluZ11bd29yZC5ydWxlLmJpdGluZGV4XSlcclxuICAgICAgICBtcFt3b3JkLnJ1bGUubWF0Y2hlZFN0cmluZ11bd29yZC5ydWxlLmJpdGluZGV4XSA9IFtdIGFzICBBcnJheTxJTWF0Y2guSVdvcmQ+O1xyXG4gICAgICB2YXIgYXJyID0gbXBbd29yZC5ydWxlLm1hdGNoZWRTdHJpbmddW3dvcmQucnVsZS5iaXRpbmRleF07XHJcbiAgICAgIGlmKCBhcnIubGVuZ3RoID09IDAgKVxyXG4gICAgICB7XHJcbiAgICAgICAgYXJyLnB1c2god29yZCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCAhYXJyLmV2ZXJ5KCAocHJlc2VudHdvcmQpID0+IHtcclxuICAgICAgICByZXR1cm4gQ2hhclNlcXVlbmNlLkNoYXJTZXF1ZW5jZS5pc1NhbWVPclBsdXJhbE9yVmVyeUNsb3NlKCB3b3JkLnN0cmluZywgcHJlc2VudHdvcmQuc3RyaW5nICk7XHJcbiAgICAgIH0pKVxyXG4gICAgICB7XHJcbiAgICAgICAgYXJyLnB1c2goIHdvcmQgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gcmV0YWluIG9ubHkgZW50cmllcyB3aXRoIG1vcmUgdGhhbiBvbmUgbWVtYmVyIGluIHRoZSBsaXN0XHJcbiAgICB2YXIgbXBkdXBsaWNhdGVzID0ge30gYXMge1trZXkgOiBzdHJpbmddIDogIHsgW2tleSA6IG51bWJlcl0gOiBBcnJheTxJTWF0Y2guSVdvcmQ+IH0gfTtcclxuICAgIE9iamVjdC5rZXlzKCBtcCApLmZvckVhY2goIChrZXkpID0+IHtcclxuICAgICAgdmFyIGVudHJ5ID0gbXBba2V5XTtcclxuICAgICAgT2JqZWN0LmtleXMoIGVudHJ5ICkuZm9yRWFjaCggKGtleWJpdGluZGV4KSA9PiB7XHJcbiAgICAgICAgaWYgKCBlbnRyeVtrZXliaXRpbmRleF0ubGVuZ3RoID4gMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZiAoIW1wZHVwbGljYXRlc1trZXldKVxyXG4gICAgICAgICAgICBtcGR1cGxpY2F0ZXNba2V5XSA9IHt9IGFzIHsgW2tleSA6IG51bWJlcl0gOiBBcnJheTxJTWF0Y2guSVdvcmQ+IH07XHJcbiAgICAgICAgICBtcGR1cGxpY2F0ZXNba2V5XVtrZXliaXRpbmRleF0gPSBlbnRyeVtrZXliaXRpbmRleF07XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKCBtcGR1cGxpY2F0ZXMgKS5ldmVyeSggKGtleSkgPT4gIHtcclxuICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKCBtcGR1cGxpY2F0ZXNbIGtleSBdICkuZXZlcnkoICggYmkgKSA9PiB7XHJcbiAgICAgICAgdmFyIGxzdCA9IG1wZHVwbGljYXRlc1trZXldW2JpXTtcclxuICAgICAgICB2YXIgaWR4bWFwID0ge30gYXMgeyBbYWtleSA6IG51bWJlcl0gOiBBcnJheTxJTWF0Y2guSVdvcmQ+IH07XHJcbiAgICAgICAgLyogb2ssIGRvIHNvbWUgd29yayAuLiAgKi9cclxuICAgICAgICAvKiBmb3IgZXZlcnkgZHVwbGljYXRlIHdlIGNvbGxlY3QgYW4gaW5kZXggIGlkeCAtPiB3b3JkICovXHJcbiAgICAgICAgZm9yKCB2YXIgYWxzdCBvZiBsc3QgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHZhciBpZHggPSBzZW50ZW5jZS5pbmRleE9mKCBhbHN0ICk7XHJcbiAgICAgICAgICBpZiAoIGlkeCA8IDAgKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ3b3JkIG11c3QgYmUgZm91bmQgaW4gc2VudGVuY2UgXCIpO1xyXG4gICAgICAgICAgaWR4bWFwWyBpZHggXSA9IGFsc3Q7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8qIHRoZW4gd2UgcnVuIHRocm91Z2ggYWxsIHRoZSBzZW50ZW5jZXMgaWRlbnRpZnlpbmcgKmlkZW50aWNhbCBzb3VyY2Ugd29yZHMgcGFpcnMsXHJcbiAgICAgICAgICAgaWYgd2UgZmluZCBhICBhKSBkaXN0aW5jdCBzZW50ZW5jZSB3aXRoXHJcbiAgICAgICAgICAgICAgICAgICAgICBiKSBzYW1lIGNhdGVnb3JpZXMgRjE2L0YxNlxyXG4gICAgICAgICAgICAgICAgICBhbmQgYykgKmhpZ2hlciBtYXRjaGVzKiBmb3IgYm90aCAsIHRoZW4gd2UgZGlzY2FyZCAqdGhpcyogc2VudGVuY2VcclxuICAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICByZXR1cm4gc2VudGVuY2VzLmV2ZXJ5KCAob3RoZXJzZW50ZW5jZSkgPT4ge1xyXG4gICAgICAgICAgaWYoIG90aGVyc2VudGVuY2UgPT09IHNlbnRlbmNlIClcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICBpZiAoIGlzU2FtZUNhdGVnb3J5QW5kSGlnaGVyTWF0Y2goIG90aGVyc2VudGVuY2UsIGlkeG1hcCkgKVxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBkZWJ1Z2xvZyhcIiByZW1vdmluZyBzZW50ZW5jZSB3aXRoIGR1ZSB0byBoaWdoZXIgbWF0Y2ggXCIgKyAgU2VudGVuY2Uuc2ltcGxpZnlTdHJpbmdzV2l0aEJpdEluZGV4KHNlbnRlbmNlKVxyXG4gICAgICAgICAgICArIFwiIGFzIFwiICsgU2VudGVuY2Uuc2ltcGxpZnlTdHJpbmdzV2l0aEJpdEluZGV4KCBvdGhlcnNlbnRlbmNlICkgKyBcIiBhcHBlYXJzIGJldHRlciBcIik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbiAgZGVidWdsb2coXCIgaGVyZSByZXMgXCIgKyAhcmVzICsgXCIgXCIgKyAgU2VudGVuY2Uuc2ltcGxpZnlTdHJpbmdzV2l0aEJpdEluZGV4KHNlbnRlbmNlKSApO1xyXG4gIHJldHVybiAhcmVzO1xyXG59XHJcblxyXG5cclxuLypcclxuICogUmV0dXJuIHRydWUgaWYgdGhlIGlkZW50aWNhbCBzb3VyY2Ugd29yZCBpcyBpbnRlcnByZXRlZFxyXG4gKiAod2l0aGluIHRoZSBzYW1lIGRvbWFpbiBhbmQgdGhlIHNhbWUgd29yZHR5cGUpXHJcbiAqIGFzIGEgZGlmZmVybmVudCAgKGUuZy4gZWxlbWVudCBudW1iIGlzIG9uZSBpbnRlcnByZXRlZCBhcyAnQ0FUJyBlbGVtZW50IG5hbWUsIG9uY2UgYXMgQ0FUICdlbGVtZW50IG51bWJlcicgaW5cclxuICogc2FtZSBkb21haW4gSVVQQUMgZWxlbWVudHMpXHJcbiAqXHJcbiAqIC0gZXhhY3QgbWF0Y2hcclxuICogLSBzdGVtbWluZyBieSByZW1vdmluZy9hcHBlbmRpbmcgdHJhbGluZyBzXHJcbiAqIC0gY2xvc2VuZXNzXHJcbiAqXHJcbiAqIEBwYXJhbSBzZW50ZW5jZVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzRGlzdGluY3RJbnRlcnByZXRhdGlvbkZvclNhbWVPTEQoc2VudGVuY2UgOiBJTWF0Y2guSVNlbnRlbmNlKSA6IGJvb2xlYW4ge1xyXG4gIHZhciBtcCA9IHt9IGFzIHtba2V5IDogc3RyaW5nXSA6IElNYXRjaC5JV29yZH07XHJcbiAgdmFyIHJlcyA9IHNlbnRlbmNlLmV2ZXJ5KCh3b3JkLCBpbmRleCkgPT4ge1xyXG4gICAgdmFyIHNlZW4gPSBtcFt3b3JkLnN0cmluZ107XHJcbiAgICBpZighc2VlbilcclxuICAgIHsgLy8gZXhhY3QgbWF0Y2hcclxuICAgICAgLyppZiggd29yZC5zdHJpbmcubGVuZ3RoID4gMyAmJiB3b3JkLnN0cmluZy5jaGFyQXQod29yZC5zdHJpbmcubGVuZ3RoIC0gMSkudG9Mb3dlckNhc2UoKSA9PSAncycpXHJcbiAgICAgIHtcclxuXHJcbiAgICAgIH1cclxuICAgICAgKi9cclxuICAgIH1cclxuICAgIGlmKCFzZWVuKSB7XHJcbiAgICAgIG1wW3dvcmQuc3RyaW5nXSA9IHdvcmQ7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgaWYoIXNlZW4ucnVsZSB8fCAhd29yZC5ydWxlKSB7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgaWYoc2Vlbi5ydWxlLmJpdGluZGV4ID09PSB3b3JkLnJ1bGUuYml0aW5kZXhcclxuICAgICAgJiYgc2Vlbi5ydWxlLm1hdGNoZWRTdHJpbmcgIT09IHdvcmQucnVsZS5tYXRjaGVkU3RyaW5nICl7XHJcbiAgICAgIC8vICBjb25zb2xlLmxvZyhcInNraXBwaW5nIHRoaXNcIiArIEpTT04uc3RyaW5naWZ5KHNlbnRlbmNlLHVuZGVmaW5lZCwyKSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlck5vblNhbWVJbnRlcnByZXRhdGlvbnMoYVNlbnRlbmNlcyA6ICBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcyApIDogSU1hdGNoLklQcm9jZXNzZWRTZW50ZW5jZXMge1xyXG4gIHZhciBkaXNjYXJkSW5kZXggPSBbXSBhcyBBcnJheTxudW1iZXI+O1xyXG4gIHZhciByZXMgPSAoT2JqZWN0IGFzIGFueSkuYXNzaWduKCB7fSwgYVNlbnRlbmNlcyApO1xyXG4gIHJlcy5zZW50ZW5jZXMgPSBhU2VudGVuY2VzLnNlbnRlbmNlcy5maWx0ZXIoKHNlbnRlbmNlLGluZGV4KSA9PiB7XHJcbiAgICBpZighaXNEaXN0aW5jdEludGVycHJldGF0aW9uRm9yU2FtZShzZW50ZW5jZSkpIHtcclxuICAgICAgZGlzY2FyZEluZGV4LnB1c2goaW5kZXgpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9KTtcclxuICBpZihkaXNjYXJkSW5kZXgubGVuZ3RoKSB7XHJcbiAgICByZXMuZXJyb3JzID0gYVNlbnRlbmNlcy5lcnJvcnMuZmlsdGVyKCAoZXJyb3IsaW5kZXgpID0+IHtcclxuICAgICAgaWYoZGlzY2FyZEluZGV4LmluZGV4T2YoaW5kZXgpID49IDApIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZnVuY3Rpb24gaXNOdWxsT3JFbXB0eURpY3Rpb25hcnkob2JqKSB7XHJcbiAgcmV0dXJuIChvYmogPT09IHVuZGVmaW5lZCkgfHwgKE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAwKTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJCYWRPcGVyYXRvckFyZ3MoYVNlbnRlbmNlcyA6ICBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcywgb3BlcmF0b3JzIDogSUZNb2RlbC5JT3BlcmF0b3JzICkgOiBJTWF0Y2guSVByb2Nlc3NlZFNlbnRlbmNlcyB7XHJcbiAgaWYgKCBpc051bGxPckVtcHR5RGljdGlvbmFyeShvcGVyYXRvcnMpIClcclxuICAgIHJldHVybiBhU2VudGVuY2VzO1xyXG4gIHZhciBkaXNjYXJkSW5kZXggPSBbXSBhcyBBcnJheTxudW1iZXI+O1xyXG4gIHZhciByZXMgPSAoT2JqZWN0IGFzIGFueSkuYXNzaWduKCB7fSwgYVNlbnRlbmNlcyApO1xyXG4gIHJlcy5zZW50ZW5jZXMgPSBhU2VudGVuY2VzLnNlbnRlbmNlcy5maWx0ZXIoKHNlbnRlbmNlLGluZGV4KSA9PiB7XHJcbiAgICBpZihpc0JhZE9wZXJhdG9yQXJncyhzZW50ZW5jZSwgb3BlcmF0b3JzKSkge1xyXG4gICAgICBkaXNjYXJkSW5kZXgucHVzaChpbmRleCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0pO1xyXG4gIGlmKGRpc2NhcmRJbmRleC5sZW5ndGgpIHtcclxuICAgIHJlcy5lcnJvcnMgPSBhU2VudGVuY2VzLmVycm9ycy5maWx0ZXIoIChlcnJvcixpbmRleCkgPT4ge1xyXG4gICAgICBpZihkaXNjYXJkSW5kZXguaW5kZXhPZihpbmRleCkgPj0gMCkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlclJldmVyc2VOb25TYW1lSW50ZXJwcmV0YXRpb25zKGFTZW50ZW5jZXMgOiAgSU1hdGNoLklQcm9jZXNzZWRTZW50ZW5jZXMgKSA6IElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzIHtcclxuICB2YXIgZGlzY2FyZEluZGV4ID0gW10gYXMgQXJyYXk8bnVtYmVyPjtcclxuICB2YXIgcmVzID0gKE9iamVjdCBhcyBhbnkpLmFzc2lnbigge30sIGFTZW50ZW5jZXMgKTtcclxuICByZXMuc2VudGVuY2VzID0gYVNlbnRlbmNlcy5zZW50ZW5jZXMuZmlsdGVyKChzZW50ZW5jZSxpbmRleCkgPT4ge1xyXG4gICAgaWYoaXNOb25PcHRpbWFsRGlzdGluY3RTb3VyY2VGb3JTYW1lKHNlbnRlbmNlLCBhU2VudGVuY2VzLnNlbnRlbmNlcykpIHtcclxuICAgICAgZGlzY2FyZEluZGV4LnB1c2goaW5kZXgpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9KTtcclxuICBpZihkaXNjYXJkSW5kZXgubGVuZ3RoKSB7XHJcbiAgICByZXMuZXJyb3JzID0gYVNlbnRlbmNlcy5lcnJvcnMuZmlsdGVyKCAoZXJyb3IsaW5kZXgpID0+IHtcclxuICAgICAgaWYoZGlzY2FyZEluZGV4LmluZGV4T2YoaW5kZXgpID49IDApIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHByb2Nlc3NTdHJpbmcyKHF1ZXJ5OiBzdHJpbmcsIHJ1bGVzOiBJRk1vZGVsLlNwbGl0UnVsZXMsXHJcbiB3b3JkczogeyBba2V5OiBzdHJpbmddOiBBcnJheTxJTWF0Y2guSUNhdGVnb3JpemVkU3RyaW5nPiB9LFxyXG4gb3BlcmF0b3JzIDogeyBba2V5OnN0cmluZ10gOiBJT3BlcmF0b3IgfVxyXG4pOiAgSU1hdGNoLklQcm9jZXNzZWRTZW50ZW5jZXMge1xyXG4gIHdvcmRzID0gd29yZHMgfHwge307XHJcbiAgdmFyIHRva2VuU3RydWN0ID0gdG9rZW5pemVTdHJpbmcocXVlcnksIHJ1bGVzLCB3b3Jkcyk7XHJcbiAgZGVidWdsb2coKCk9PiBgdG9rZW5pemVkOlxcbmAgKyB0b2tlblN0cnVjdC5jYXRlZ29yaXplZFdvcmRzLm1hcCggcyA9PiBTZW50ZW5jZS5zaW1wbGlmeVN0cmluZ3NXaXRoQml0SW5kZXgocykuam9pbihcIlxcblwiKSApLmpvaW4oXCJcXG5cIikpO1xyXG4gIGV2YWx1YXRlUmFuZ2VSdWxlc1RvUG9zaXRpb24odG9rZW5TdHJ1Y3QudG9rZW5zLCB0b2tlblN0cnVjdC5mdXNhYmxlLFxyXG4gICAgdG9rZW5TdHJ1Y3QuY2F0ZWdvcml6ZWRXb3Jkcyk7XHJcbiAgZGVidWdsb2dWKCgpPT5cIkFmdGVyIG1hdGNoZWQgXCIgKyBKU09OLnN0cmluZ2lmeSh0b2tlblN0cnVjdC5jYXRlZ29yaXplZFdvcmRzKSk7XHJcbiAgdmFyIGFTZW50ZW5jZXMgPSBleHBhbmRUb2tlbk1hdGNoZXNUb1NlbnRlbmNlczIodG9rZW5TdHJ1Y3QudG9rZW5zLCB0b2tlblN0cnVjdC5jYXRlZ29yaXplZFdvcmRzKTtcclxuICBkZWJ1Z2xvZygoKSA9PiBcImFmdGVyIGV4cGFuZCBcIiArIGFTZW50ZW5jZXMuc2VudGVuY2VzLm1hcChmdW5jdGlvbiAob1NlbnRlbmNlKSB7XHJcbiAgICByZXR1cm4gU2VudGVuY2UucmFua2luZ1Byb2R1Y3Qob1NlbnRlbmNlKSArIFwiOlxcblwiICsgU2VudGVuY2UuZHVtcE5pY2VCaXRJbmRleGVkKG9TZW50ZW5jZSk7IC8vSlNPTi5zdHJpbmdpZnkob1NlbnRlbmNlKTtcclxuICAgIH0pLmpvaW4oXCJcXG5cIikpO1xyXG4gIGFTZW50ZW5jZXMgPSBmaWx0ZXJCYWRPcGVyYXRvckFyZ3MoYVNlbnRlbmNlcywgb3BlcmF0b3JzKVxyXG4gIGFTZW50ZW5jZXMgPSBmaWx0ZXJOb25TYW1lSW50ZXJwcmV0YXRpb25zKGFTZW50ZW5jZXMpO1xyXG5cclxuICBhU2VudGVuY2VzID0gZmlsdGVyUmV2ZXJzZU5vblNhbWVJbnRlcnByZXRhdGlvbnMoYVNlbnRlbmNlcyk7XHJcblxyXG4gIGFTZW50ZW5jZXMuc2VudGVuY2VzID0gV29yZE1hdGNoLnJlaW5Gb3JjZShhU2VudGVuY2VzLnNlbnRlbmNlcyk7XHJcbiAgZGVidWdsb2dWKCgpPT4gXCJhZnRlciByZWluZm9yY2VcXG5cIiArIGFTZW50ZW5jZXMuc2VudGVuY2VzLm1hcChmdW5jdGlvbiAob1NlbnRlbmNlKSB7XHJcbiAgICAgIHJldHVybiBTZW50ZW5jZS5yYW5raW5nUHJvZHVjdChvU2VudGVuY2UpICsgXCI6XFxuXCIgKyBKU09OLnN0cmluZ2lmeShvU2VudGVuY2UpO1xyXG4gICAgfSkuam9pbihcIlxcblwiKSk7XHJcbiAgZGVidWdsb2coKCkgPT4gXCJhZnRlciByZWluZm9yY2VcIiArIGFTZW50ZW5jZXMuc2VudGVuY2VzLm1hcChmdW5jdGlvbiAob1NlbnRlbmNlKSB7XHJcbiAgICByZXR1cm4gU2VudGVuY2UucmFua2luZ1Byb2R1Y3Qob1NlbnRlbmNlKSArIFwiOlxcblwiICsgU2VudGVuY2UuZHVtcE5pY2VCaXRJbmRleGVkKG9TZW50ZW5jZSk7IC8vSlNPTi5zdHJpbmdpZnkob1NlbnRlbmNlKTtcclxuICAgIH0pLmpvaW4oXCJcXG5cIikpO1xyXG4gIHJldHVybiBhU2VudGVuY2VzO1xyXG59XHJcblxyXG5cclxuIl19
