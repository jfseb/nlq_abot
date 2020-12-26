"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplifyStringsWithBitIndex = exports.dumpNiceArr = exports.dumpNiceBitIndexed = exports.dumpNiceRuled = exports.dumpNice = exports.cutoffSentenceAtRatio = exports.cmpRankingProduct = exports.rankingProduct = exports.rankingGeometricMean = exports.getDistinctCategoriesInSentence = exports.findWordByCategory = void 0;
// <reference path="../../lib/node-4.d.ts" />
const debug = require("debug");
const debuglog = debug('sentence');
function findWordByCategory(oSentence, sCategory) {
    var res = {};
    oSentence.every(function (oWord, iIndex) {
        if (oWord.category === sCategory) {
            res = { word: oWord,
                index: iIndex };
            return false;
        }
        return true;
    });
    return res;
}
exports.findWordByCategory = findWordByCategory;
function getDistinctCategoriesInSentence(oSentence) {
    var res = [];
    var resm = {};
    oSentence.forEach(function (oWord) {
        if (oWord.category === "category") {
            if (!resm[oWord.matchedString]) {
                res.push(oWord.matchedString);
                resm[oWord.matchedString] = 1;
            }
        }
    });
    return res;
}
exports.getDistinctCategoriesInSentence = getDistinctCategoriesInSentence;
function rankingGeometricMean(oSentence) {
    const length = oSentence.length;
    if (length === 0) {
        return 1.0;
    }
    var prod = oSentence.reduce(function (prev, oWord) {
        return prev * (oWord._ranking || 1.0);
    }, 1.0);
    // TODO: find somethign faster ;-)
    return Math.pow(prod, 1 / length);
}
exports.rankingGeometricMean = rankingGeometricMean;
function rankingProduct(oSentence) {
    return rankingGeometricMean(oSentence);
}
exports.rankingProduct = rankingProduct;
function cmpRankingProduct(a, b) {
    return -(rankingProduct(a) - rankingProduct(b));
}
exports.cmpRankingProduct = cmpRankingProduct;
function cutoffSentenceAtRatio(sentences) {
    if (sentences.length === 0) {
        return sentences;
    }
    var bestRank = rankingProduct(sentences[0]);
    for (var i = 1; (i < Math.min(sentences.length, 300)) && ((rankingProduct(sentences[i]) / bestRank) > 0.8); ++i) {
        // empty
    }
    debuglog("reduce sentences by " + i + "/" + sentences.length);
    return sentences.slice(0, i);
}
exports.cutoffSentenceAtRatio = cutoffSentenceAtRatio;
/*
export function simplifySentence(res : IMatch.ICategorizedStringRanged[][]) : string[][] {
  return res.map(function (r) {
    return r.map(word => { return word.string + '=>' + word.matchedString + '/' + word.category + (word.span ? '/' + word.span : '') })
  });
}
*/
function dumpNice(sentence, fn) {
    var result = [];
    sentence.forEach(function (oWord, index) {
        var sWord = `[${index}] : ${(oWord._ranking || 0).toFixed(3)} ${oWord.category} "${oWord.string}" => "${oWord.matchedString}"`;
        result.push(sWord + "\n");
    });
    result.push(".\n");
    return result.join("");
}
exports.dumpNice = dumpNice;
function dumpNiceRuled(sentence, fn) {
    var result = [];
    sentence.forEach(function (oWord, index) {
        var sWord = `[${index}] : ${(oWord._ranking || 0).toFixed(3)} ${oWord.category} "${oWord.string}" => "${oWord.matchedString}" `;
        result.push(sWord + "\n");
    });
    result.push(".\n");
    return result.join("");
}
exports.dumpNiceRuled = dumpNiceRuled;
function dumpNiceBitIndexed(sentence, fn) {
    var result = [];
    sentence.forEach(function (word, index) {
        var sWord = `[${index}] : ${(word._ranking || 0).toFixed(3)} "${word.string}" => "${word.matchedString}" `
            + word.category + (word.span ? '/' + word.span : '') + ` ${word.rule.wordType}${word.rule.bitindex}`;
        result.push(sWord + "\n");
    });
    result.push(".\n");
    return result.join("");
}
exports.dumpNiceBitIndexed = dumpNiceBitIndexed;
function dumpNiceArr(sentences, fn) {
    if (!sentences) {
        return "";
    }
    var res = sentences.reduce(function (prev, oSentence) {
        return prev + dumpNice(oSentence);
    }, "");
    return res;
}
exports.dumpNiceArr = dumpNiceArr;
function simplifyStringsWithBitIndex(sentence) {
    if (!sentence) {
        return [];
    }
    return sentence.map(word => { return word.string + '=>' + word.matchedString + '/' + word.category + (word.span ? '/' + word.span : '') + ` ${word.rule.wordType}${word.rule.bitindex}`; });
}
exports.simplifyStringsWithBitIndex = simplifyStringsWithBitIndex;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tYXRjaC9zZW50ZW5jZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7R0FVRzs7O0FBRUgsNkNBQTZDO0FBRTdDLCtCQUErQjtBQU0vQixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUE7QUFFbEMsU0FBZ0Isa0JBQWtCLENBQUMsU0FBUyxFQUFFLFNBQWtCO0lBQzdELElBQUksR0FBRyxHQUFHLEVBQTRDLENBQUM7SUFDdEQsU0FBUyxDQUFDLEtBQUssQ0FBQyxVQUFTLEtBQUssRUFBRSxNQUFNO1FBQ3BDLElBQUcsS0FBSyxDQUFDLFFBQVEsS0FBSyxTQUFTLEVBQUU7WUFDL0IsR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUs7Z0JBQ1gsS0FBSyxFQUFHLE1BQU0sRUFBRSxDQUFDO1lBQ3pCLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUMsQ0FBQyxDQUFBO0lBQ0YsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDO0FBWEQsZ0RBV0M7QUFFRCxTQUFnQiwrQkFBK0IsQ0FBQyxTQUE0QjtJQUMxRSxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDYixJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7SUFDZCxTQUFTLENBQUMsT0FBTyxDQUFDLFVBQVMsS0FBSztRQUM5QixJQUFHLEtBQUssQ0FBQyxRQUFRLEtBQUssVUFBVSxFQUFFO1lBQ2hDLElBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxFQUFFO2dCQUM3QixHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDL0I7U0FDRjtJQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBWkQsMEVBWUM7QUFFRCxTQUFnQixvQkFBb0IsQ0FBQyxTQUE0QjtJQUMvRCxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDO0lBQ2hDLElBQUcsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUNmLE9BQU8sR0FBRyxDQUFDO0tBQ1o7SUFDRCxJQUFJLElBQUksR0FBSSxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVMsSUFBSSxFQUFFLEtBQUs7UUFDL0MsT0FBTyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ3hDLENBQUMsRUFBQyxHQUFHLENBQUMsQ0FBQztJQUNQLGtDQUFrQztJQUNsQyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBQyxNQUFNLENBQUMsQ0FBQztBQUNsQyxDQUFDO0FBVkQsb0RBVUM7QUFFRCxTQUFnQixjQUFjLENBQUMsU0FBMkI7SUFDeEQsT0FBTyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUN6QyxDQUFDO0FBRkQsd0NBRUM7QUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxDQUFvQixFQUFFLENBQW9CO0lBQzFFLE9BQU8sQ0FBRSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuRCxDQUFDO0FBRkQsOENBRUM7QUFFRCxTQUFnQixxQkFBcUIsQ0FBQyxTQUE4QjtJQUNsRSxJQUFHLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFDO1FBQ3hCLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBQ0QsSUFBSSxRQUFRLEdBQUcsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVDLEtBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUUsUUFBUSxDQUFDLEdBQUcsR0FBRyxDQUFDLEVBQUUsRUFBRyxDQUFDLEVBQUU7UUFDOUcsUUFBUTtLQUNUO0lBQ0QsUUFBUSxDQUFDLHNCQUFzQixHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzlELE9BQU8sU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUIsQ0FBQztBQVZELHNEQVVDO0FBRUQ7Ozs7OztFQU1FO0FBRUYsU0FBZ0IsUUFBUSxDQUFDLFFBQTJCLEVBQUUsRUFBUTtJQUM1RCxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDZCxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVMsS0FBSyxFQUFFLEtBQUs7UUFDcEMsSUFBSSxLQUFLLEdBQUcsSUFBSSxLQUFLLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxLQUFLLEtBQUssQ0FBQyxNQUFNLFNBQVMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFBO1FBQzlILE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQzVCLENBQUMsQ0FBQyxDQUFBO0lBQ0YsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuQixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDM0IsQ0FBQztBQVJELDRCQVFDO0FBRUQsU0FBZ0IsYUFBYSxDQUFDLFFBQTJCLEVBQUUsRUFBUTtJQUNqRSxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDZCxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVMsS0FBSyxFQUFFLEtBQUs7UUFDcEMsSUFBSSxLQUFLLEdBQUcsSUFBSSxLQUFLLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxLQUFLLEtBQUssQ0FBQyxNQUFNLFNBQVMsS0FBSyxDQUFDLGFBQWEsSUFBSSxDQUFBO1FBQy9ILE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQzVCLENBQUMsQ0FBQyxDQUFBO0lBQ0YsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuQixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDM0IsQ0FBQztBQVJELHNDQVFDO0FBR0QsU0FBZ0Isa0JBQWtCLENBQUMsUUFBMkIsRUFBRSxFQUFRO0lBQ3RFLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNkLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBUyxJQUFJLEVBQUUsS0FBSztRQUNuQyxJQUFJLEtBQUssR0FBRyxJQUFJLEtBQUssT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLFNBQVMsSUFBSSxDQUFDLGFBQWEsSUFBSTtjQUN4RyxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUUsSUFBWSxDQUFDLElBQUksQ0FBQSxDQUFDLENBQUMsR0FBRyxHQUFJLElBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN0SCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQztJQUM1QixDQUFDLENBQUMsQ0FBQTtJQUNGLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbkIsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzNCLENBQUM7QUFURCxnREFTQztBQUdELFNBQWdCLFdBQVcsQ0FBQyxTQUE4QixFQUFFLEVBQVM7SUFDbkUsSUFBRyxDQUFDLFNBQVMsRUFBRTtRQUNiLE9BQU8sRUFBRSxDQUFDO0tBQ1g7SUFDRCxJQUFJLEdBQUcsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVMsSUFBSSxFQUFFLFNBQVM7UUFDakQsT0FBTyxJQUFJLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3BDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtJQUNOLE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQVJELGtDQVFDO0FBRUQsU0FBZ0IsMkJBQTJCLENBQUMsUUFBMkI7SUFDckUsSUFBRyxDQUFDLFFBQVEsRUFBRTtRQUNaLE9BQU8sRUFBRSxDQUFDO0tBQ1g7SUFDRCxPQUFPLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBSSxPQUFPLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFJLElBQUksQ0FBQyxhQUFhLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBRSxJQUFZLENBQUMsSUFBSSxDQUFBLENBQUMsQ0FBQyxHQUFHLEdBQUksSUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBLENBQUEsQ0FBQyxDQUFDLENBQUE7QUFDOU0sQ0FBQztBQUxELGtFQUtDIiwiZmlsZSI6Im1hdGNoL3NlbnRlbmNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBmaWxlIHNlbnRlbmNlXHJcbiAqIEBtb2R1bGUgamZzZWIuZmRldnN0YXJ0LnNlbnRlbmNlXHJcbiAqIEBjb3B5cmlnaHQgKGMpIEdlcmQgRm9yc3RtYW5uXHJcbiAqXHJcbiAqIE1hdGNoIGEgdG9vbCByZWNvcmQgb24gYSBzZW50ZW5jZSxcclxuICpcclxuICogVGhpcyB3aWxsIHVuaWZ5IG1hdGNoaW5nIHJlcXVpcmVkIGFuZCBvcHRpb25hbCBjYXRlZ29yeSB3b3Jkc1xyXG4gKiB3aXRoIHRoZSByZXF1aXJlbWVudHMgb2YgdGhlIHRvb2wuXHJcbiAqXHJcbiAqL1xyXG5cclxuLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vbGliL25vZGUtNC5kLnRzXCIgLz5cclxuXHJcbmltcG9ydCAqIGFzIGRlYnVnIGZyb20gJ2RlYnVnJztcclxuXHJcbi8vIGltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uL3V0aWxzL3V0aWxzJztcclxuXHJcbmltcG9ydCAqIGFzIElNYXRjaCBmcm9tICcuL2lmZXJiYXNlJztcclxuXHJcbmNvbnN0IGRlYnVnbG9nID0gZGVidWcoJ3NlbnRlbmNlJylcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmaW5kV29yZEJ5Q2F0ZWdvcnkob1NlbnRlbmNlLCBzQ2F0ZWdvcnkgOiBzdHJpbmcpIDogeyB3b3JkIDogSU1hdGNoLklXb3JkLCBpbmRleCA6IG51bWJlcn0ge1xyXG4gIFx0dmFyIHJlcyA9IHt9IGFzIHsgd29yZCA6IElNYXRjaC5JV29yZCwgaW5kZXggOiBudW1iZXJ9O1xyXG4gICAgb1NlbnRlbmNlLmV2ZXJ5KGZ1bmN0aW9uKG9Xb3JkLCBpSW5kZXgpIHtcclxuICAgICAgaWYob1dvcmQuY2F0ZWdvcnkgPT09IHNDYXRlZ29yeSkge1xyXG4gICAgICAgIHJlcyA9IHsgd29yZDogb1dvcmQsXHJcbiAgICAgICAgICAgICAgICBpbmRleCA6IGlJbmRleCB9O1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0pXHJcbiAgICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGlzdGluY3RDYXRlZ29yaWVzSW5TZW50ZW5jZShvU2VudGVuY2UgOiBJTWF0Y2guSVNlbnRlbmNlKSA6IHN0cmluZ1tdIHtcclxuICB2YXIgcmVzID0gW107XHJcbiAgdmFyIHJlc20gPSB7fTtcclxuICBvU2VudGVuY2UuZm9yRWFjaChmdW5jdGlvbihvV29yZCkge1xyXG4gICAgaWYob1dvcmQuY2F0ZWdvcnkgPT09IFwiY2F0ZWdvcnlcIikge1xyXG4gICAgICBpZighcmVzbVtvV29yZC5tYXRjaGVkU3RyaW5nXSkge1xyXG4gICAgICAgIHJlcy5wdXNoKG9Xb3JkLm1hdGNoZWRTdHJpbmcpO1xyXG4gICAgICAgIHJlc21bb1dvcmQubWF0Y2hlZFN0cmluZ10gPSAxO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJhbmtpbmdHZW9tZXRyaWNNZWFuKG9TZW50ZW5jZSA6IElNYXRjaC5JU2VudGVuY2UpIDogbnVtYmVyIHtcclxuICBjb25zdCBsZW5ndGggPSBvU2VudGVuY2UubGVuZ3RoO1xyXG4gIGlmKGxlbmd0aCA9PT0gMCkge1xyXG4gICAgcmV0dXJuIDEuMDtcclxuICB9XHJcbiAgdmFyIHByb2QgPSAgb1NlbnRlbmNlLnJlZHVjZShmdW5jdGlvbihwcmV2LCBvV29yZCkge1xyXG4gICAgcmV0dXJuIHByZXYgKiAob1dvcmQuX3JhbmtpbmcgfHwgMS4wKTtcclxuICB9LDEuMCk7XHJcbiAgLy8gVE9ETzogZmluZCBzb21ldGhpZ24gZmFzdGVyIDstKVxyXG4gIHJldHVybiBNYXRoLnBvdyhwcm9kLCAxL2xlbmd0aCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByYW5raW5nUHJvZHVjdChvU2VudGVuY2U6IElNYXRjaC5JU2VudGVuY2UpIDogbnVtYmVyIHtcclxuICByZXR1cm4gcmFua2luZ0dlb21ldHJpY01lYW4ob1NlbnRlbmNlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNtcFJhbmtpbmdQcm9kdWN0KGEgOiBJTWF0Y2guSVNlbnRlbmNlLCBiIDogSU1hdGNoLklTZW50ZW5jZSkge1xyXG4gIHJldHVybiAtIChyYW5raW5nUHJvZHVjdChhKSAtIHJhbmtpbmdQcm9kdWN0KGIpKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGN1dG9mZlNlbnRlbmNlQXRSYXRpbyhzZW50ZW5jZXMgOiBJTWF0Y2guSVNlbnRlbmNlW10pIHtcclxuICBpZihzZW50ZW5jZXMubGVuZ3RoID09PSAwKXtcclxuICAgIHJldHVybiBzZW50ZW5jZXM7XHJcbiAgfVxyXG4gIHZhciBiZXN0UmFuayA9IHJhbmtpbmdQcm9kdWN0KHNlbnRlbmNlc1swXSk7XHJcbiAgZm9yKHZhciBpID0gMTsgKGkgPCBNYXRoLm1pbihzZW50ZW5jZXMubGVuZ3RoLCAzMDApKSAmJiAoKHJhbmtpbmdQcm9kdWN0KHNlbnRlbmNlc1tpXSkvIGJlc3RSYW5rKSA+IDAuOCk7ICsrIGkpIHtcclxuICAgIC8vIGVtcHR5XHJcbiAgfVxyXG4gIGRlYnVnbG9nKFwicmVkdWNlIHNlbnRlbmNlcyBieSBcIiArIGkgKyBcIi9cIiArIHNlbnRlbmNlcy5sZW5ndGgpO1xyXG4gIHJldHVybiBzZW50ZW5jZXMuc2xpY2UoMCxpKTtcclxufVxyXG5cclxuLypcclxuZXhwb3J0IGZ1bmN0aW9uIHNpbXBsaWZ5U2VudGVuY2UocmVzIDogSU1hdGNoLklDYXRlZ29yaXplZFN0cmluZ1JhbmdlZFtdW10pIDogc3RyaW5nW11bXSB7XHJcbiAgcmV0dXJuIHJlcy5tYXAoZnVuY3Rpb24gKHIpIHtcclxuICAgIHJldHVybiByLm1hcCh3b3JkID0+IHsgcmV0dXJuIHdvcmQuc3RyaW5nICsgJz0+JyArIHdvcmQubWF0Y2hlZFN0cmluZyArICcvJyArIHdvcmQuY2F0ZWdvcnkgKyAod29yZC5zcGFuID8gJy8nICsgd29yZC5zcGFuIDogJycpIH0pXHJcbiAgfSk7XHJcbn1cclxuKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkdW1wTmljZShzZW50ZW5jZSA6IElNYXRjaC5JU2VudGVuY2UsIGZuPzogYW55KSA6IHN0cmluZyB7XHJcbiAgdmFyIHJlc3VsdCA9IFtdO1xyXG4gICAgc2VudGVuY2UuZm9yRWFjaChmdW5jdGlvbihvV29yZCwgaW5kZXgpIHtcclxuICAgICAgdmFyIHNXb3JkID0gYFske2luZGV4fV0gOiAkeyhvV29yZC5fcmFua2luZyB8fCAwKS50b0ZpeGVkKDMpfSAke29Xb3JkLmNhdGVnb3J5fSBcIiR7b1dvcmQuc3RyaW5nfVwiID0+IFwiJHtvV29yZC5tYXRjaGVkU3RyaW5nfVwiYFxyXG4gICAgICByZXN1bHQucHVzaChzV29yZCArIFwiXFxuXCIpO1xyXG4gICAgfSlcclxuICAgIHJlc3VsdC5wdXNoKFwiLlxcblwiKTtcclxuICAgIHJldHVybiByZXN1bHQuam9pbihcIlwiKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGR1bXBOaWNlUnVsZWQoc2VudGVuY2UgOiBJTWF0Y2guSVNlbnRlbmNlLCBmbj86IGFueSkgOiBzdHJpbmcge1xyXG4gIHZhciByZXN1bHQgPSBbXTtcclxuICAgIHNlbnRlbmNlLmZvckVhY2goZnVuY3Rpb24ob1dvcmQsIGluZGV4KSB7XHJcbiAgICAgIHZhciBzV29yZCA9IGBbJHtpbmRleH1dIDogJHsob1dvcmQuX3JhbmtpbmcgfHwgMCkudG9GaXhlZCgzKX0gJHtvV29yZC5jYXRlZ29yeX0gXCIke29Xb3JkLnN0cmluZ31cIiA9PiBcIiR7b1dvcmQubWF0Y2hlZFN0cmluZ31cIiBgXHJcbiAgICAgIHJlc3VsdC5wdXNoKHNXb3JkICsgXCJcXG5cIik7XHJcbiAgICB9KVxyXG4gICAgcmVzdWx0LnB1c2goXCIuXFxuXCIpO1xyXG4gICAgcmV0dXJuIHJlc3VsdC5qb2luKFwiXCIpO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGR1bXBOaWNlQml0SW5kZXhlZChzZW50ZW5jZSA6IElNYXRjaC5JU2VudGVuY2UsIGZuPzogYW55KSA6IHN0cmluZyB7XHJcbiAgdmFyIHJlc3VsdCA9IFtdO1xyXG4gICAgc2VudGVuY2UuZm9yRWFjaChmdW5jdGlvbih3b3JkLCBpbmRleCkge1xyXG4gICAgICB2YXIgc1dvcmQgPSBgWyR7aW5kZXh9XSA6ICR7KHdvcmQuX3JhbmtpbmcgfHwgMCkudG9GaXhlZCgzKX0gXCIke3dvcmQuc3RyaW5nfVwiID0+IFwiJHt3b3JkLm1hdGNoZWRTdHJpbmd9XCIgYFxyXG4gICAgICArIHdvcmQuY2F0ZWdvcnkgKyAoKHdvcmQgYXMgYW55KS5zcGFuPyAnLycgKyAod29yZCBhcyBhbnkpLnNwYW4gOiAnJykgKyBgICR7d29yZC5ydWxlLndvcmRUeXBlfSR7d29yZC5ydWxlLmJpdGluZGV4fWA7XHJcbiAgICAgIHJlc3VsdC5wdXNoKHNXb3JkICsgXCJcXG5cIik7XHJcbiAgICB9KVxyXG4gICAgcmVzdWx0LnB1c2goXCIuXFxuXCIpO1xyXG4gICAgcmV0dXJuIHJlc3VsdC5qb2luKFwiXCIpO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGR1bXBOaWNlQXJyKHNlbnRlbmNlcyA6IElNYXRjaC5JU2VudGVuY2VbXSwgZm4/IDogYW55KSA6IHN0cmluZyB7XHJcbiAgaWYoIXNlbnRlbmNlcykge1xyXG4gICAgcmV0dXJuIFwiXCI7XHJcbiAgfVxyXG4gIHZhciByZXMgPSBzZW50ZW5jZXMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIG9TZW50ZW5jZSkge1xyXG4gICAgcmV0dXJuIHByZXYgKyBkdW1wTmljZShvU2VudGVuY2UpO1xyXG4gIH0sIFwiXCIpXHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNpbXBsaWZ5U3RyaW5nc1dpdGhCaXRJbmRleChzZW50ZW5jZSA6IElNYXRjaC5JU2VudGVuY2UpIHtcclxuICBpZighc2VudGVuY2UpIHtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcbiAgcmV0dXJuIHNlbnRlbmNlLm1hcCh3b3JkID0+ICB7IHJldHVybiB3b3JkLnN0cmluZyArICc9PicgKyAgd29yZC5tYXRjaGVkU3RyaW5nICsgJy8nICsgd29yZC5jYXRlZ29yeSArICgod29yZCBhcyBhbnkpLnNwYW4/ICcvJyArICh3b3JkIGFzIGFueSkuc3BhbiA6ICcnKSArIGAgJHt3b3JkLnJ1bGUud29yZFR5cGV9JHt3b3JkLnJ1bGUuYml0aW5kZXh9YH0pXHJcbn1cclxuIl19
