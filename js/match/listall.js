"use strict";
/**
 *
 * @module jfseb.fdevstart.analyze
 * @file analyze.ts
 * @copyright (c) 2016 Gerd Forstmann
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferDomain = exports.joinResultsTupel = exports.resultAsListString = exports.retainOnlyTopRankedPerDomain = exports.cmpDomainSentenceRanking = exports.getQueryString = exports.isSignificantDifference = exports.isSignificantWord = exports.removeMetamodelResultIfOthers = exports.removeEmptyResults = exports.removeErrorsIfOKAnswers = exports.getOKIfDistinctOKDomains = exports.hasEmptyResult = exports.hasError = exports.hasOKAnswer = exports.getDistinctOKDomains = exports.isOKAnswer = exports.joinResultsFilterDuplicates = exports.flattenToStringArray = exports.returnErrorTextIfOnlyError = exports.flattenComplete = exports.flattenErrors = exports.formatDistinctFromWhatIfResult = exports.joinSortedQuoted = exports.likelyPluralDiff = exports.getCategoryOpFilterAsDistinctStrings = exports.removeCaseDuplicates = exports.listAllTupelWithContext = exports.sortAnwsersByDomains = exports.listAllShowMe = exports.listAllWithContext = exports.analyzeContextString = exports.projectFullResultsToFlatStringArray = exports.projectResultsToStringArray = exports.projectResultToStringArray = void 0;
const debug = require("debugf");
const debuglog = debug('listall');
const logger = require("../utils/logger");
var logPerf = logger.perf("perflistall");
var perflog = debug('perf');
const _ = require("lodash");
//const perflog = logger.perf("perflistall");
const Utils = require("abot_utils");
//import * as Match from './match';
//import * as Toolmatcher from './toolmatcher';
const index_model_1 = require("../model/index_model");
const index_parser_1 = require("../index_parser");
;
;
const Operator = require("./operator");
const WhatIs = require("./whatis");
const index_parser_2 = require("../index_parser");
;
const index_model_2 = require("../model/index_model");
const MongoQueries = require("./mongoqueries");
function projectResultToStringArray(answer, result) {
    return answer.columns.map(c => '' + result[c]);
}
exports.projectResultToStringArray = projectResultToStringArray;
function projectResultsToStringArray(answer) {
    return answer.results.map(rec => projectResultToStringArray(answer, rec)); /*answer.columns.map( c =>
      { //console.log('here ' + JSON.stringify(res));
        return ('' + res[c]); }
    ));
    */
}
exports.projectResultsToStringArray = projectResultsToStringArray;
function projectFullResultsToFlatStringArray(answers) {
    return answers.reduce((prev, result) => {
        prev = prev.concat(projectResultsToStringArray(result));
        return prev;
    }, []);
}
exports.projectFullResultsToFlatStringArray = projectFullResultsToFlatStringArray;
var sWords = {};
/*
export function matchRecordHavingCategory(category: string, records: Array<IMatch.IRecord>)
  : Array<IMatch.IRecord> {
  debuglog(debuglog.enabled ? JSON.stringify(records, undefined, 2) : "-");
  var relevantRecords = records.filter(function (record: IMatch.IRecord) {
    return (record[category] !== undefined) && (record[category] !== null);
  });
  var res = [];
  debuglog("relevant records nr:" + relevantRecords.length);
  return relevantRecords;
}
*/
function analyzeContextString(contextQueryString, rules) {
    return WhatIs.analyzeContextString(contextQueryString, rules);
}
exports.analyzeContextString = analyzeContextString;
// const result = WhatIs.resolveCategory(cat, a1.entity,
//   theModel.mRules, theModel.tools, theModel.records);
function listAllWithContext(category, contextQueryString, theModel, domainCategoryFilter) {
    return listAllTupelWithContext([category], contextQueryString, theModel, domainCategoryFilter);
}
exports.listAllWithContext = listAllWithContext;
;
function listAllShowMe(query, theModel) {
    return MongoQueries.listShowMe(query, theModel);
}
exports.listAllShowMe = listAllShowMe;
/**
 * analyze results of a query,
 *
 * Resorting results
 *
 * -> split by domains
 * -> order by significance of sentence, dropping "lees relevant" (e.g. metamodel) answers
 * -> prune
 */
function sortAnwsersByDomains() {
}
exports.sortAnwsersByDomains = sortAnwsersByDomains;
//
function listAllTupelWithContext(categories, contextQueryString, theModel, domainCategoryFilter) {
    var query = categories.join(" ") + " with " + contextQueryString;
    if (!contextQueryString) {
        throw new Error('assumed contextQueryString passed');
    }
    return MongoQueries.listAll(query, theModel);
    /*
  
      if (contextQueryString.length === 0) {
        return {
          tupelanswers : [],
          errors : [ErError.makeError_EMPTY_INPUT()] ,
          tokens :[],
        };
      } else {
  
        logPerf('listAllWithContext');
        perflog("totalListAllWithContext");
        var aSentencesReinforced = analyzeContextString(contextQueryString, aRules);
        perflog("LATWC matching records (s=" + aSentencesReinforced.sentences.length + ")...");
        var matchedAnswers = WhatIs.matchRecordsQuickMultipleCategories(aSentencesReinforced, categories, records, domainCategoryFilter); //aTool: Array<IMatch.ITool>): any / * objectstream* / {
        if(debuglog.enabled){
          debuglog(" matched Answers" + JSON.stringify(matchedAnswers, undefined, 2));
        }
        perflog("filtering topRanked (a=" + matchedAnswers.tupelanswers.length + ")...");
        var matchedFiltered = WhatIs.filterOnlyTopRankedTupel(matchedAnswers.tupelanswers);
        if (debuglog.enabled) {
          debuglog("LATWC matched top-ranked Answers" + JSON.stringify(matchedFiltered, undefined, 2));
        }
        perflog("totalListAllWithContext (a=" + matchedFiltered.length + ")");
        logPerf('listAllWithContext');
        return {
          tupelanswers : matchedFiltered, // ??? Answers;
          errors : aSentencesReinforced.errors,
          tokens: aSentencesReinforced.tokens
        }
      }
      */
}
exports.listAllTupelWithContext = listAllTupelWithContext;
/*
export function filterStringListByOp(operator: IMatch.IOperator, fragment: string, srcarr: string[]): string[] {
  var fragmentLC = BreakDown.trimQuotedSpaced(fragment.toLowerCase());
  return srcarr.filter(function (str) {
    return Operator.matches(operator, fragmentLC, str.toLowerCase());
  }).sort();
}
*/
function compareCaseInsensitive(a, b) {
    var r = a.toLowerCase().localeCompare(b.toLowerCase());
    if (r) {
        return r;
    }
    return -a.localeCompare(b);
}
/**
 * Sort string list case insensitive, then remove duplicates retaining
 * "largest" match
 */
function removeCaseDuplicates(arr) {
    arr.sort(compareCaseInsensitive);
    debuglog('sorted arr' + JSON.stringify(arr));
    return arr.filter(function (s, index) {
        return index === 0 || (0 !== arr[index - 1].toLowerCase().localeCompare(s.toLowerCase()));
    });
}
exports.removeCaseDuplicates = removeCaseDuplicates;
;
function getCategoryOpFilterAsDistinctStrings(operator, fragment, category, records, filterDomain) {
    var fragmentLC = index_model_1.BreakDown.trimQuoted(fragment.toLowerCase());
    var res = [];
    var seen = {};
    records.forEach(function (record) {
        if (filterDomain && record['_domain'] !== filterDomain) {
            return;
        }
        if (record[category] && Operator.matches(operator, fragmentLC, record[category].toLowerCase())) {
            if (!seen[record[category]]) {
                seen[record[category]] = true;
                res.push(record[category]);
            }
        }
    });
    return removeCaseDuplicates(res);
}
exports.getCategoryOpFilterAsDistinctStrings = getCategoryOpFilterAsDistinctStrings;
;
function likelyPluralDiff(a, pluralOfa) {
    var aLC = index_model_1.BreakDown.trimQuoted(a.toLowerCase()) || "";
    var pluralOfALC = index_model_1.BreakDown.trimQuoted((pluralOfa || "").toLowerCase()) || "";
    if (aLC === pluralOfALC) {
        return true;
    }
    if (aLC + 's' === pluralOfALC) {
        return true;
    }
    return false;
}
exports.likelyPluralDiff = likelyPluralDiff;
;
function joinSortedQuoted(strings) {
    if (strings.length === 0) {
        return "";
    }
    return '"' + strings.sort().join('"; "') + '"';
}
exports.joinSortedQuoted = joinSortedQuoted;
/*
export function joinDistinct(category: string, records: Array<IMatch.IRecord>): string {
  var res = records.reduce(function (prev, oRecord) {
    prev[oRecord[category]] = 1;
    return prev;
  }, {} as any);
  return joinSortedQuoted(Object.keys(res));
}
*/
function formatDistinctFromWhatIfResult(answers) {
    var strs = projectFullResultsToFlatStringArray(answers);
    var resFirst = strs.map(r => r[0]);
    return joinSortedQuoted(resFirst); /*projectResultsToStringArray(answers) answers.map(function (oAnswer) {
      return oAnswer.result;
    }));*/
}
exports.formatDistinctFromWhatIfResult = formatDistinctFromWhatIfResult;
function flattenErrors(results) {
    debuglog('flatten errors');
    return results.reduce((prev, rec) => {
        if ((rec.errors !== undefined) && (rec.errors !== false)
            && (!_.isArray(rec.errors) || rec.errors.length > 0)) {
            prev.push(rec.errors);
        }
        return prev;
    }, []);
}
exports.flattenErrors = flattenErrors;
function flattenComplete(r) {
    var res = [];
    r.forEach(mem => {
        if (_.isArray(mem)) {
            res = res.concat(mem);
        }
        else {
            res.push(mem);
        }
    });
    return res;
}
exports.flattenComplete = flattenComplete;
/**
 * return undefined if resutls is not only erroneous
 * @param results
 */
function returnErrorTextIfOnlyError(results) {
    var errors = flattenErrors(results);
    debuglog(() => 'here flattened errors ' + errors.length + '/' + results.length);
    if (errors.length === results.length) {
        var listOfErrors = flattenComplete(errors);
        var r = index_parser_2.ErError.explainError(listOfErrors);
        debuglog(() => 'here explain ' + r);
        return r;
    }
    return undefined;
    /*
    if (results.length === 0) {
      debuglog(() => ` no answers: ${JSON.stringify(results, undefined, 2)}`);
      if (errors.length > 0) {
        if ((errors as any[]).filter(err => (err === false)).length > 0) {
          debuglog('valid result')
          return undefined; // at least one query was ok
        }
        debuglog(() => ` errors:  ${JSON.stringify(errors, undefined, 2)}`);
        if (errors.length) {
          return ErError.explainError(errors); //[0].text
        }
      }
    }
    return undefined;
    */
}
exports.returnErrorTextIfOnlyError = returnErrorTextIfOnlyError;
function flattenToStringArray(results) {
    // TODO SPLIT BY DOMAIN
    var res = [];
    var cnt = results.reduce(function (prev, result) {
        if (true) { // TODO result._ranking === results[0]._ranking) {
            var arrs = projectResultsToStringArray(result);
            res = res.concat(arrs);
        }
        return prev;
    }, 0);
    return res;
}
exports.flattenToStringArray = flattenToStringArray;
function joinResultsFilterDuplicates(answers) {
    var res = [];
    var seen = []; // serialized index
    var cnt = answers.reduce(function (prev, result) {
        if (true) { // TODO result._ranking === results[0]._ranking) {
            var arrs = projectResultsToStringArray(result);
            var cntlen = arrs.reduce((prev, row) => {
                var value = Utils.listToQuotedCommaAnd(row); //projectResultToStringArray(result, result));
                if (seen.indexOf(value) < 0) {
                    seen.push(value);
                    res.push(row);
                }
                return prev + 1;
            }, 0);
        }
        return prev;
    }, 0);
    return res;
}
exports.joinResultsFilterDuplicates = joinResultsFilterDuplicates;
function isOKAnswer(answer) {
    return !(answer.errors) && (answer.domain !== undefined);
}
exports.isOKAnswer = isOKAnswer;
function isNotUndefined(obj) {
    return !(obj === undefined);
}
function isNotEmptyResult(answer) {
    return (answer.results.length > 0);
}
/**
 *
 * @param answers
 * @return {string[]} an array of strings
 */
function getDistinctOKDomains(answers) {
    return _.uniq(answers.filter(isOKAnswer).map(r => r.domain).filter(isNotUndefined));
}
exports.getDistinctOKDomains = getDistinctOKDomains;
function hasOKAnswer(answers) {
    return getDistinctOKDomains(answers).length > 0;
}
exports.hasOKAnswer = hasOKAnswer;
function hasError(answers) {
    return !answers.every(isOKAnswer);
}
exports.hasError = hasError;
function hasEmptyResult(answers) {
    return !answers.every(answer => {
        if (answer.results.length <= 0) {
            //console.log('here empty' + JSON.stringify(answer));
        }
        return (answer.results.length > 0);
    });
}
exports.hasEmptyResult = hasEmptyResult;
/**
 *
 * @param answers
 */
function getOKIfDistinctOKDomains(answers) {
    return _.uniq(answers.filter(isOKAnswer).map(r => r.domain).filter(isNotUndefined));
}
exports.getOKIfDistinctOKDomains = getOKIfDistinctOKDomains;
function removeErrorsIfOKAnswers(answers) {
    if (hasOKAnswer(answers)) {
        return answers.filter(isOKAnswer);
    }
    return answers;
}
exports.removeErrorsIfOKAnswers = removeErrorsIfOKAnswers;
function removeEmptyResults(answers) {
    if (hasOKAnswer(answers)) {
        return answers.filter(isNotEmptyResult);
    }
    return answers;
}
exports.removeEmptyResults = removeEmptyResults;
function removeMetamodelResultIfOthers(answers) {
    if (hasError(answers)) {
        throw Error('remove errors before');
    }
    if (hasEmptyResult(answers)) {
        throw Error('run removeEmptyResults before');
    }
    var domains = getDistinctOKDomains(answers);
    if ((domains.length > 1) && domains.indexOf('metamodel') > 0) {
        return answers.filter(a => (a.domain !== 'metamodel'));
    }
    return answers;
}
exports.removeMetamodelResultIfOthers = removeMetamodelResultIfOthers;
function isSignificantWord(word) {
    return word.rule.wordType === 'F'
        || word.rule.wordType === 'C';
}
exports.isSignificantWord = isSignificantWord;
function isSignificantDifference(actualword, matchedWord) {
    var lca = actualword.toLowerCase();
    var lcm = matchedWord.toLowerCase();
    if (lca === lcm) {
        return false;
    }
    if (lca + 's' === lcm) {
        return false;
    }
    if (lca === lcm + 's') {
        return false;
    }
    return true;
}
exports.isSignificantDifference = isSignificantDifference;
function getQueryString(answ) {
    var words = [];
    debuglog(() => 'here tokens:' + answ.aux.tokens);
    debuglog(() => JSON.stringify(answ.aux.sentence, undefined, 2));
    debuglog(() => ' ' + index_parser_1.Sentence.dumpNiceRuled(answ.aux.sentence));
    answ.aux.sentence.forEach((word, index) => {
        var word = answ.aux.sentence[index];
        words.push(word.string);
        if (isSignificantWord(word))
            if (isSignificantDifference(word.matchedString, word.string)) {
                words.push("(\"" + word.rule.matchedString + "\")");
            }
    });
    return words.join(" ");
}
exports.getQueryString = getQueryString;
;
function cmpDomainSentenceRanking(a, b) {
    var r = a.domain.localeCompare(b.domain);
    if (r) {
        return r;
    }
    var ca = index_parser_1.Sentence.rankingGeometricMean(a.aux.sentence);
    var cb = index_parser_1.Sentence.rankingGeometricMean(b.aux.sentence);
    return cb - ca;
}
exports.cmpDomainSentenceRanking = cmpDomainSentenceRanking;
function retainOnlyTopRankedPerDomain(answers) {
    var domains = getDistinctOKDomains(answers);
    /* domains.sort();
    / answers.forEach( (answer, index) =>  {
       console.log(Sentence.rankingGeometricMean(answer.aux.sentence));
     });
     */
    answers.sort(cmpDomainSentenceRanking);
    return answers.filter((entry, index, arr) => {
        if ((index === 0) || (entry.domain !== arr[index - 1].domain)) {
            return true;
        }
        var prev = arr[index - 1];
        var rank_prev = index_parser_1.Sentence.rankingGeometricMean(prev.aux.sentence);
        var rank = index_parser_1.Sentence.rankingGeometricMean(entry.aux.sentence);
        if (!WhatIs.safeEqual(rank, rank_prev)) {
            debuglog(() => `dropping ${index} ${index_parser_1.Sentence.dumpNiceRuled(entry.aux.sentence)} `);
        }
        return false;
    });
}
exports.retainOnlyTopRankedPerDomain = retainOnlyTopRankedPerDomain;
function resultAsListString(answers) {
    var nonerror = removeErrorsIfOKAnswers(answers);
    var nonempty = removeEmptyResults(nonerror);
    var filteredNoMM = removeMetamodelResultIfOthers(nonempty);
    var filtered = retainOnlyTopRankedPerDomain(filteredNoMM);
    var domains = getDistinctOKDomains(filtered);
    domains.sort();
    var res = '';
    if (domains.length > 1) {
        res = "The query has answers in more than one domain:\n";
    }
    res += domains.map(dom => {
        var answersForDomain = answers.filter(a => (a.domain === dom));
        return answersForDomain.map(answ => {
            var localres = '';
            var querystr = getQueryString(answ);
            var answerN = joinResultsTupel([answ]).join("\n");
            localres += querystr;
            if (domains.length > 1) {
                localres += " in domain \"" + dom + "\"...\n";
            }
            else {
                localres += "\n...";
            }
            localres += joinResultsTupel([answ]).join("\n") + "\n";
            return localres;
        }).join("\n");
    }).join("\n");
    return res;
}
exports.resultAsListString = resultAsListString;
/**
 * TODO
 * @param results
 */
function joinResultsTupel(results) {
    // TODO SPLIT BY DOMAIN
    var res = [];
    var cnt = results.reduce(function (prev, result) {
        if (true) { // TODO result._ranking === results[0]._ranking) {
            var arrs = projectResultsToStringArray(result);
            var cntlen = arrs.reduce((prev, row) => {
                var value = Utils.listToQuotedCommaAnd(row); //projectResultToStringArray(result, result));
                if (res.indexOf(value) < 0) {
                    res.push(value);
                }
                return prev + 1;
            }, 0);
        }
        return prev;
    }, 0);
    return res;
}
exports.joinResultsTupel = joinResultsTupel;
function inferDomain(theModel, contextQueryString) {
    // console.log("here the string" + contextQueryString);
    //  console.log("here the rules" + JSON.stringify(theModel.mRules));
    var res = analyzeContextString(contextQueryString, theModel.rules);
    debuglog(() => JSON.stringify(res, undefined, 2));
    // run through the string, search for a category
    if (!res.sentences.length) {
        return undefined;
    }
    var domains = [];
    //console.log(Sentence.dumpNiceArr(res));
    // do we have a domain ?
    res.sentences[0].forEach(function (oWordGroup) {
        if (oWordGroup.category === "domain") {
            domains.push(oWordGroup.matchedString);
        }
    });
    if (domains.length === 1) {
        debuglog("got a precise domain " + domains[0]);
        return domains[0];
    }
    if (domains.length > 0) {
        debuglog(debuglog.enabled ? ("got more than one domain, confused  " + domains.join("\n")) : '-');
        return undefined;
        // TODOD
    }
    debuglog("attempting to determine categories");
    // try a category reverse map
    res.sentences[0].forEach(function (oWordGroup) {
        if (oWordGroup.category === "category") {
            var sCat = oWordGroup.matchedString;
            var doms = index_model_2.Model.getDomainsForCategory(theModel, sCat);
            doms.forEach(function (sDom) {
                if (domains.indexOf(sDom) < 0) {
                    domains.push(sDom);
                }
            });
        }
    });
    if (domains.length === 1) {
        debuglog("got a precise domain " + domains[0]);
        return domains[0];
    }
    debuglog(debuglog.enabled ? ("got more than one domain, confused  " + domains.join("\n")) : '-');
    return undefined;
}
exports.inferDomain = inferDomain;
;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tYXRjaC9saXN0YWxsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7R0FLRzs7O0FBR0gsZ0NBQWdDO0FBRWhDLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNsQywwQ0FBMEM7QUFDMUMsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUN6QyxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDNUIsNEJBQTRCO0FBQzVCLDZDQUE2QztBQUU3QyxvQ0FBb0M7QUFFcEMsbUNBQW1DO0FBRW5DLCtDQUErQztBQUMvQyxzREFBaUQ7QUFDakQsa0RBQXVEO0FBQUEsQ0FBQztBQUNULENBQUM7QUFDaEQsdUNBQXVDO0FBQ3ZDLG1DQUFtQztBQUNuQyxrREFBcUQ7QUFBQSxDQUFDO0FBQ3RELHNEQUE2QztBQUM3QywrQ0FBK0M7QUFHL0MsU0FBZ0IsMEJBQTBCLENBQUUsTUFBa0MsRUFBRSxNQUE2QjtJQUMzRyxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xELENBQUM7QUFGRCxnRUFFQztBQUVELFNBQWdCLDJCQUEyQixDQUFFLE1BQWtDO0lBQzdFLE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFFLENBQUMsQ0FBQyxDQUFDOzs7O01BSTNFO0FBQ0osQ0FBQztBQU5ELGtFQU1DO0FBRUQsU0FBZ0IsbUNBQW1DLENBQUUsT0FBcUM7SUFDeEYsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFFLENBQUMsSUFBSSxFQUFDLE1BQU0sRUFBRSxFQUFFO1FBQ3JDLElBQUksR0FBRyxJQUFJLENBQUMsTUFB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ZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIEBtb2R1bGUgamZzZWIuZmRldnN0YXJ0LmFuYWx5emVcbiAqIEBmaWxlIGFuYWx5emUudHNcbiAqIEBjb3B5cmlnaHQgKGMpIDIwMTYgR2VyZCBGb3JzdG1hbm5cbiAqL1xuXG5pbXBvcnQgKiBhcyBBbGdvbCBmcm9tICcuL2FsZ29sJztcbmltcG9ydCAqIGFzIGRlYnVnIGZyb20gJ2RlYnVnZic7XG5cbmNvbnN0IGRlYnVnbG9nID0gZGVidWcoJ2xpc3RhbGwnKTtcbmltcG9ydCAqIGFzIGxvZ2dlciBmcm9tICcuLi91dGlscy9sb2dnZXInO1xudmFyIGxvZ1BlcmYgPSBsb2dnZXIucGVyZihcInBlcmZsaXN0YWxsXCIpO1xudmFyIHBlcmZsb2cgPSBkZWJ1ZygncGVyZicpO1xuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuLy9jb25zdCBwZXJmbG9nID0gbG9nZ2VyLnBlcmYoXCJwZXJmbGlzdGFsbFwiKTtcblxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnYWJvdF91dGlscyc7XG5pbXBvcnQgKiBhcyBJTWF0Y2ggZnJvbSAnLi9pZm1hdGNoJztcbi8vaW1wb3J0ICogYXMgTWF0Y2ggZnJvbSAnLi9tYXRjaCc7XG5cbi8vaW1wb3J0ICogYXMgVG9vbG1hdGNoZXIgZnJvbSAnLi90b29sbWF0Y2hlcic7XG5pbXBvcnQgeyBCcmVha0Rvd24gfSBmcm9tICcuLi9tb2RlbC9pbmRleF9tb2RlbCc7XG5pbXBvcnQgeyBTZW50ZW5jZSBhcyBTZW50ZW5jZSB9IGZyb20gJy4uL2luZGV4X3BhcnNlcic7O1xuaW1wb3J0IHsgV29yZCBhcyBXb3JkIH0gZnJvbSAnLi4vaW5kZXhfcGFyc2VyJzs7XG5pbXBvcnQgKiBhcyBPcGVyYXRvciBmcm9tICcuL29wZXJhdG9yJztcbmltcG9ydCAqIGFzIFdoYXRJcyBmcm9tICcuL3doYXRpcyc7XG5pbXBvcnQgeyBFckVycm9yIGFzIEVyRXJyb3IgfSBmcm9tICcuLi9pbmRleF9wYXJzZXInOztcbmltcG9ydCB7IE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvaW5kZXhfbW9kZWwnO1xuaW1wb3J0ICogYXMgTW9uZ29RdWVyaWVzIGZyb20gJy4vbW9uZ29xdWVyaWVzJztcblxuXG5leHBvcnQgZnVuY3Rpb24gcHJvamVjdFJlc3VsdFRvU3RyaW5nQXJyYXkoIGFuc3dlciA6IElNYXRjaC5JV2hhdElzVHVwZWxBbnN3ZXIsIHJlc3VsdCA6IE1vbmdvUS5JUmVzdWx0UmVjb3JkKSA6IHN0cmluZ1tdIHtcbiAgcmV0dXJuIGFuc3dlci5jb2x1bW5zLm1hcCggYyA9PiAnJyArIHJlc3VsdFtjXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9qZWN0UmVzdWx0c1RvU3RyaW5nQXJyYXkoIGFuc3dlciA6IElNYXRjaC5JV2hhdElzVHVwZWxBbnN3ZXIpIDogc3RyaW5nW11bXSB7XG4gIHJldHVybiBhbnN3ZXIucmVzdWx0cy5tYXAoIHJlYyA9PiBwcm9qZWN0UmVzdWx0VG9TdHJpbmdBcnJheShhbnN3ZXIsIHJlYyApKTsgLyphbnN3ZXIuY29sdW1ucy5tYXAoIGMgPT5cbiAgICB7IC8vY29uc29sZS5sb2coJ2hlcmUgJyArIEpTT04uc3RyaW5naWZ5KHJlcykpO1xuICAgICAgcmV0dXJuICgnJyArIHJlc1tjXSk7IH1cbiAgKSk7XG4gICovXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9qZWN0RnVsbFJlc3VsdHNUb0ZsYXRTdHJpbmdBcnJheSggYW5zd2VycyA6IElNYXRjaC5JV2hhdElzVHVwZWxBbnN3ZXJbXSkgOiBzdHJpbmdbXVtdIHtcbiAgcmV0dXJuIGFuc3dlcnMucmVkdWNlKCAocHJldixyZXN1bHQpID0+ICB7XG4gICAgcHJldiA9IHByZXYuY29uY2F0KHByb2plY3RSZXN1bHRzVG9TdHJpbmdBcnJheShyZXN1bHQpKTtcbiAgICByZXR1cm4gcHJldjtcbiAgfSAsIFtdKTtcbn1cblxuXG52YXIgc1dvcmRzID0ge307XG4vKlxuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoUmVjb3JkSGF2aW5nQ2F0ZWdvcnkoY2F0ZWdvcnk6IHN0cmluZywgcmVjb3JkczogQXJyYXk8SU1hdGNoLklSZWNvcmQ+KVxuICA6IEFycmF5PElNYXRjaC5JUmVjb3JkPiB7XG4gIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyBKU09OLnN0cmluZ2lmeShyZWNvcmRzLCB1bmRlZmluZWQsIDIpIDogXCItXCIpO1xuICB2YXIgcmVsZXZhbnRSZWNvcmRzID0gcmVjb3Jkcy5maWx0ZXIoZnVuY3Rpb24gKHJlY29yZDogSU1hdGNoLklSZWNvcmQpIHtcbiAgICByZXR1cm4gKHJlY29yZFtjYXRlZ29yeV0gIT09IHVuZGVmaW5lZCkgJiYgKHJlY29yZFtjYXRlZ29yeV0gIT09IG51bGwpO1xuICB9KTtcbiAgdmFyIHJlcyA9IFtdO1xuICBkZWJ1Z2xvZyhcInJlbGV2YW50IHJlY29yZHMgbnI6XCIgKyByZWxldmFudFJlY29yZHMubGVuZ3RoKTtcbiAgcmV0dXJuIHJlbGV2YW50UmVjb3Jkcztcbn1cbiovXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGFuYWx5emVDb250ZXh0U3RyaW5nKGNvbnRleHRRdWVyeVN0cmluZzogc3RyaW5nLCBydWxlczogSU1hdGNoLlNwbGl0UnVsZXMpIHtcbiAgcmV0dXJuIFdoYXRJcy5hbmFseXplQ29udGV4dFN0cmluZyhjb250ZXh0UXVlcnlTdHJpbmcsIHJ1bGVzKTtcbn1cblxuLy8gY29uc3QgcmVzdWx0ID0gV2hhdElzLnJlc29sdmVDYXRlZ29yeShjYXQsIGExLmVudGl0eSxcbi8vICAgdGhlTW9kZWwubVJ1bGVzLCB0aGVNb2RlbC50b29scywgdGhlTW9kZWwucmVjb3Jkcyk7XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGxpc3RBbGxXaXRoQ29udGV4dChjYXRlZ29yeTogc3RyaW5nLCBjb250ZXh0UXVlcnlTdHJpbmc6IHN0cmluZyxcbiAgdGhlTW9kZWw6IElNYXRjaC5JTW9kZWxzLCBkb21haW5DYXRlZ29yeUZpbHRlcj86IElNYXRjaC5JRG9tYWluQ2F0ZWdvcnlGaWx0ZXIpOiBQcm9taXNlPElNYXRjaC5JUHJvY2Vzc2VkV2hhdElzVHVwZWxBbnN3ZXJzPiB7XG4gIHJldHVybiBsaXN0QWxsVHVwZWxXaXRoQ29udGV4dChbY2F0ZWdvcnldLCBjb250ZXh0UXVlcnlTdHJpbmcsIHRoZU1vZGVsLCBkb21haW5DYXRlZ29yeUZpbHRlcik7XG59XG5cblxuLypcbmV4cG9ydCBmdW5jdGlvbiBsaXN0QWxsV2l0aENhdGVnb3J5KGNhdGVnb3J5OiBzdHJpbmcsIHRoZU1vZGVsOiBJTWF0Y2guSU1vZGVscyk6IEFycmF5PElNYXRjaC5JUmVjb3JkPiB7XG4gIHZhciBtYXRjaGVkQW5zd2VycyA9IG1hdGNoUmVjb3JkSGF2aW5nQ2F0ZWdvcnkoY2F0ZWdvcnksIHRoZU1vZGVsKTsgLy9hVG9vbDogQXJyYXk8SU1hdGNoLklUb29sPik6IGFueSAvICogb2JqZWN0c3RyZWFtKiAvIHtcbiAgZGVidWdsb2coXCIgbGlzdEFsbFdpdGhDYXRlZ29yeTpcIiArIEpTT04uc3RyaW5naWZ5KG1hdGNoZWRBbnN3ZXJzLCB1bmRlZmluZWQsIDIpKTtcbiAgcmV0dXJuIG1hdGNoZWRBbnN3ZXJzO1xufVxuKi9cbmltcG9ydCB7IE1vbmdvUSBhcyBNb25nb1EgfSBmcm9tICcuLi9pbmRleF9wYXJzZXInOztcblxuZXhwb3J0IGZ1bmN0aW9uIGxpc3RBbGxTaG93TWUocXVlcnkgOiBzdHJpbmcsIHRoZU1vZGVsIDogSU1hdGNoLklNb2RlbHMgKSA6IFByb21pc2U8TW9uZ29RLklQcm9jZXNzZWRNb25nb0Fuc3dlcnM+IHtcbiAgcmV0dXJuIE1vbmdvUXVlcmllcy5saXN0U2hvd01lKHF1ZXJ5LCB0aGVNb2RlbCk7XG59XG5cblxuLyoqXG4gKiBhbmFseXplIHJlc3VsdHMgb2YgYSBxdWVyeSxcbiAqXG4gKiBSZXNvcnRpbmcgcmVzdWx0c1xuICpcbiAqIC0+IHNwbGl0IGJ5IGRvbWFpbnNcbiAqIC0+IG9yZGVyIGJ5IHNpZ25pZmljYW5jZSBvZiBzZW50ZW5jZSwgZHJvcHBpbmcgXCJsZWVzIHJlbGV2YW50XCIgKGUuZy4gbWV0YW1vZGVsKSBhbnN3ZXJzXG4gKiAtPiBwcnVuZVxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBzb3J0QW53c2Vyc0J5RG9tYWlucyggKVxuIHtcblxuIH1cbi8vXG5cblxuXG5leHBvcnQgZnVuY3Rpb24gbGlzdEFsbFR1cGVsV2l0aENvbnRleHQoY2F0ZWdvcmllczogc3RyaW5nW10sIGNvbnRleHRRdWVyeVN0cmluZzogc3RyaW5nLFxuICB0aGVNb2RlbDogSU1hdGNoLklNb2RlbHMsIGRvbWFpbkNhdGVnb3J5RmlsdGVyPzogSU1hdGNoLklEb21haW5DYXRlZ29yeUZpbHRlcik6IFByb21pc2U8SU1hdGNoLklQcm9jZXNzZWRXaGF0SXNUdXBlbEFuc3dlcnM+IHtcblxuICB2YXIgcXVlcnkgPSBjYXRlZ29yaWVzLmpvaW4oXCIgXCIpICsgXCIgd2l0aCBcIiArIGNvbnRleHRRdWVyeVN0cmluZztcbiAgaWYgKCFjb250ZXh0UXVlcnlTdHJpbmcpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2Fzc3VtZWQgY29udGV4dFF1ZXJ5U3RyaW5nIHBhc3NlZCcpO1xuICB9XG4gIHJldHVybiBNb25nb1F1ZXJpZXMubGlzdEFsbChxdWVyeSwgdGhlTW9kZWwpO1xuICAvKlxuXG4gICAgaWYgKGNvbnRleHRRdWVyeVN0cmluZy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR1cGVsYW5zd2VycyA6IFtdLFxuICAgICAgICBlcnJvcnMgOiBbRXJFcnJvci5tYWtlRXJyb3JfRU1QVFlfSU5QVVQoKV0gLFxuICAgICAgICB0b2tlbnMgOltdLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuXG4gICAgICBsb2dQZXJmKCdsaXN0QWxsV2l0aENvbnRleHQnKTtcbiAgICAgIHBlcmZsb2coXCJ0b3RhbExpc3RBbGxXaXRoQ29udGV4dFwiKTtcbiAgICAgIHZhciBhU2VudGVuY2VzUmVpbmZvcmNlZCA9IGFuYWx5emVDb250ZXh0U3RyaW5nKGNvbnRleHRRdWVyeVN0cmluZywgYVJ1bGVzKTtcbiAgICAgIHBlcmZsb2coXCJMQVRXQyBtYXRjaGluZyByZWNvcmRzIChzPVwiICsgYVNlbnRlbmNlc1JlaW5mb3JjZWQuc2VudGVuY2VzLmxlbmd0aCArIFwiKS4uLlwiKTtcbiAgICAgIHZhciBtYXRjaGVkQW5zd2VycyA9IFdoYXRJcy5tYXRjaFJlY29yZHNRdWlja011bHRpcGxlQ2F0ZWdvcmllcyhhU2VudGVuY2VzUmVpbmZvcmNlZCwgY2F0ZWdvcmllcywgcmVjb3JkcywgZG9tYWluQ2F0ZWdvcnlGaWx0ZXIpOyAvL2FUb29sOiBBcnJheTxJTWF0Y2guSVRvb2w+KTogYW55IC8gKiBvYmplY3RzdHJlYW0qIC8ge1xuICAgICAgaWYoZGVidWdsb2cuZW5hYmxlZCl7XG4gICAgICAgIGRlYnVnbG9nKFwiIG1hdGNoZWQgQW5zd2Vyc1wiICsgSlNPTi5zdHJpbmdpZnkobWF0Y2hlZEFuc3dlcnMsIHVuZGVmaW5lZCwgMikpO1xuICAgICAgfVxuICAgICAgcGVyZmxvZyhcImZpbHRlcmluZyB0b3BSYW5rZWQgKGE9XCIgKyBtYXRjaGVkQW5zd2Vycy50dXBlbGFuc3dlcnMubGVuZ3RoICsgXCIpLi4uXCIpO1xuICAgICAgdmFyIG1hdGNoZWRGaWx0ZXJlZCA9IFdoYXRJcy5maWx0ZXJPbmx5VG9wUmFua2VkVHVwZWwobWF0Y2hlZEFuc3dlcnMudHVwZWxhbnN3ZXJzKTtcbiAgICAgIGlmIChkZWJ1Z2xvZy5lbmFibGVkKSB7XG4gICAgICAgIGRlYnVnbG9nKFwiTEFUV0MgbWF0Y2hlZCB0b3AtcmFua2VkIEFuc3dlcnNcIiArIEpTT04uc3RyaW5naWZ5KG1hdGNoZWRGaWx0ZXJlZCwgdW5kZWZpbmVkLCAyKSk7XG4gICAgICB9XG4gICAgICBwZXJmbG9nKFwidG90YWxMaXN0QWxsV2l0aENvbnRleHQgKGE9XCIgKyBtYXRjaGVkRmlsdGVyZWQubGVuZ3RoICsgXCIpXCIpO1xuICAgICAgbG9nUGVyZignbGlzdEFsbFdpdGhDb250ZXh0Jyk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0dXBlbGFuc3dlcnMgOiBtYXRjaGVkRmlsdGVyZWQsIC8vID8/PyBBbnN3ZXJzO1xuICAgICAgICBlcnJvcnMgOiBhU2VudGVuY2VzUmVpbmZvcmNlZC5lcnJvcnMsXG4gICAgICAgIHRva2VuczogYVNlbnRlbmNlc1JlaW5mb3JjZWQudG9rZW5zXG4gICAgICB9XG4gICAgfVxuICAgICovXG59XG5cbi8qXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyU3RyaW5nTGlzdEJ5T3Aob3BlcmF0b3I6IElNYXRjaC5JT3BlcmF0b3IsIGZyYWdtZW50OiBzdHJpbmcsIHNyY2Fycjogc3RyaW5nW10pOiBzdHJpbmdbXSB7XG4gIHZhciBmcmFnbWVudExDID0gQnJlYWtEb3duLnRyaW1RdW90ZWRTcGFjZWQoZnJhZ21lbnQudG9Mb3dlckNhc2UoKSk7XG4gIHJldHVybiBzcmNhcnIuZmlsdGVyKGZ1bmN0aW9uIChzdHIpIHtcbiAgICByZXR1cm4gT3BlcmF0b3IubWF0Y2hlcyhvcGVyYXRvciwgZnJhZ21lbnRMQywgc3RyLnRvTG93ZXJDYXNlKCkpO1xuICB9KS5zb3J0KCk7XG59XG4qL1xuXG5mdW5jdGlvbiBjb21wYXJlQ2FzZUluc2Vuc2l0aXZlKGE6IHN0cmluZywgYjogc3RyaW5nKSB7XG4gIHZhciByID0gYS50b0xvd2VyQ2FzZSgpLmxvY2FsZUNvbXBhcmUoYi50b0xvd2VyQ2FzZSgpKTtcbiAgaWYgKHIpIHtcbiAgICByZXR1cm4gcjtcbiAgfVxuICByZXR1cm4gLWEubG9jYWxlQ29tcGFyZShiKTtcbn1cblxuLyoqXG4gKiBTb3J0IHN0cmluZyBsaXN0IGNhc2UgaW5zZW5zaXRpdmUsIHRoZW4gcmVtb3ZlIGR1cGxpY2F0ZXMgcmV0YWluaW5nXG4gKiBcImxhcmdlc3RcIiBtYXRjaFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlQ2FzZUR1cGxpY2F0ZXMoYXJyOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgYXJyLnNvcnQoY29tcGFyZUNhc2VJbnNlbnNpdGl2ZSk7XG4gIGRlYnVnbG9nKCdzb3J0ZWQgYXJyJyArIEpTT04uc3RyaW5naWZ5KGFycikpO1xuICByZXR1cm4gYXJyLmZpbHRlcihmdW5jdGlvbiAocywgaW5kZXgpIHtcbiAgICByZXR1cm4gaW5kZXggPT09IDAgfHwgKDAgIT09IGFycltpbmRleCAtIDFdLnRvTG93ZXJDYXNlKCkubG9jYWxlQ29tcGFyZShzLnRvTG93ZXJDYXNlKCkpKTtcbiAgfSk7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2F0ZWdvcnlPcEZpbHRlckFzRGlzdGluY3RTdHJpbmdzKG9wZXJhdG9yOiBJTWF0Y2guSU9wZXJhdG9yLCBmcmFnbWVudDogc3RyaW5nLFxuICBjYXRlZ29yeTogc3RyaW5nLCByZWNvcmRzOiBBcnJheTxJTWF0Y2guSVJlY29yZD4sIGZpbHRlckRvbWFpbj86IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgdmFyIGZyYWdtZW50TEMgPSBCcmVha0Rvd24udHJpbVF1b3RlZChmcmFnbWVudC50b0xvd2VyQ2FzZSgpKTtcbiAgdmFyIHJlcyA9IFtdO1xuICB2YXIgc2VlbiA9IHt9O1xuICByZWNvcmRzLmZvckVhY2goZnVuY3Rpb24gKHJlY29yZCkge1xuICAgIGlmIChmaWx0ZXJEb21haW4gJiYgcmVjb3JkWydfZG9tYWluJ10gIT09IGZpbHRlckRvbWFpbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAocmVjb3JkW2NhdGVnb3J5XSAmJiBPcGVyYXRvci5tYXRjaGVzKG9wZXJhdG9yLCBmcmFnbWVudExDLCByZWNvcmRbY2F0ZWdvcnldLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICBpZiAoIXNlZW5bcmVjb3JkW2NhdGVnb3J5XV0pIHtcbiAgICAgICAgc2VlbltyZWNvcmRbY2F0ZWdvcnldXSA9IHRydWU7XG4gICAgICAgIHJlcy5wdXNoKHJlY29yZFtjYXRlZ29yeV0pO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZW1vdmVDYXNlRHVwbGljYXRlcyhyZXMpO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGxpa2VseVBsdXJhbERpZmYoYTogc3RyaW5nLCBwbHVyYWxPZmE6IHN0cmluZyk6IGJvb2xlYW4ge1xuICB2YXIgYUxDID0gQnJlYWtEb3duLnRyaW1RdW90ZWQoYS50b0xvd2VyQ2FzZSgpKSB8fCBcIlwiO1xuICB2YXIgcGx1cmFsT2ZBTEMgPSBCcmVha0Rvd24udHJpbVF1b3RlZCgocGx1cmFsT2ZhIHx8IFwiXCIpLnRvTG93ZXJDYXNlKCkpIHx8IFwiXCI7XG4gIGlmIChhTEMgPT09IHBsdXJhbE9mQUxDKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKGFMQyArICdzJyA9PT0gcGx1cmFsT2ZBTEMpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gam9pblNvcnRlZFF1b3RlZChzdHJpbmdzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIGlmIChzdHJpbmdzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG4gIHJldHVybiAnXCInICsgc3RyaW5ncy5zb3J0KCkuam9pbignXCI7IFwiJykgKyAnXCInO1xufVxuXG4vKlxuZXhwb3J0IGZ1bmN0aW9uIGpvaW5EaXN0aW5jdChjYXRlZ29yeTogc3RyaW5nLCByZWNvcmRzOiBBcnJheTxJTWF0Y2guSVJlY29yZD4pOiBzdHJpbmcge1xuICB2YXIgcmVzID0gcmVjb3Jkcy5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIG9SZWNvcmQpIHtcbiAgICBwcmV2W29SZWNvcmRbY2F0ZWdvcnldXSA9IDE7XG4gICAgcmV0dXJuIHByZXY7XG4gIH0sIHt9IGFzIGFueSk7XG4gIHJldHVybiBqb2luU29ydGVkUXVvdGVkKE9iamVjdC5rZXlzKHJlcykpO1xufVxuKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdERpc3RpbmN0RnJvbVdoYXRJZlJlc3VsdChhbnN3ZXJzOiBBcnJheTxJTWF0Y2guSVdoYXRJc1R1cGVsQW5zd2VyPik6IHN0cmluZyB7XG4gIHZhciBzdHJzID0gcHJvamVjdEZ1bGxSZXN1bHRzVG9GbGF0U3RyaW5nQXJyYXkoYW5zd2Vycyk7XG4gIHZhciByZXNGaXJzdCA9IHN0cnMubWFwKHIgPT4gclswXSk7XG5cbiAgcmV0dXJuIGpvaW5Tb3J0ZWRRdW90ZWQoIHJlc0ZpcnN0ICk7IC8qcHJvamVjdFJlc3VsdHNUb1N0cmluZ0FycmF5KGFuc3dlcnMpIGFuc3dlcnMubWFwKGZ1bmN0aW9uIChvQW5zd2VyKSB7XG4gICAgcmV0dXJuIG9BbnN3ZXIucmVzdWx0O1xuICB9KSk7Ki9cbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBmbGF0dGVuRXJyb3JzKHJlc3VsdHM6IElNYXRjaC5JUHJvY2Vzc2VkV2hhdElzVHVwZWxBbnN3ZXJzKSA6IGFueVtdIHtcbiAgZGVidWdsb2coJ2ZsYXR0ZW4gZXJyb3JzJyk7XG4gIHJldHVybiByZXN1bHRzLnJlZHVjZSggKHByZXYsIHJlYykgPT4gIHsgaWYgKChyZWMuZXJyb3JzICE9PSB1bmRlZmluZWQpICYmIChyZWMuZXJyb3JzICE9PSBmYWxzZSlcbiAgICAmJiAoIV8uaXNBcnJheShyZWMuZXJyb3JzKSB8fCByZWMuZXJyb3JzLmxlbmd0aCA+IDApKSB7XG4gICAgICBwcmV2LnB1c2gocmVjLmVycm9ycyk7IH1cbiAgICByZXR1cm4gcHJldjtcbiAgfSwgW10pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmxhdHRlbkNvbXBsZXRlKHIgOiBhbnlbXSkgOiBhbnlbXSB7XG4gIHZhciByZXMgPVtdO1xuICByLmZvckVhY2gobWVtID0+IHsgaWYgKCBfLmlzQXJyYXkobWVtKSkge1xuICAgICByZXMgPSByZXMuY29uY2F0KG1lbSk7XG4gICB9IGVsc2Uge1xuICAgICByZXMucHVzaChtZW0pO1xuICAgfX0pO1xuICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiAqIHJldHVybiB1bmRlZmluZWQgaWYgcmVzdXRscyBpcyBub3Qgb25seSBlcnJvbmVvdXNcbiAqIEBwYXJhbSByZXN1bHRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXR1cm5FcnJvclRleHRJZk9ubHlFcnJvcihyZXN1bHRzOiBJTWF0Y2guSVByb2Nlc3NlZFdoYXRJc1R1cGVsQW5zd2Vycyk6IHN0cmluZyB7XG4gIHZhciBlcnJvcnMgPSBmbGF0dGVuRXJyb3JzKHJlc3VsdHMpO1xuICBkZWJ1Z2xvZygoKT0+J2hlcmUgZmxhdHRlbmVkIGVycm9ycyAnICsgZXJyb3JzLmxlbmd0aCArICcvJyArIHJlc3VsdHMubGVuZ3RoKTtcbiAgaWYoZXJyb3JzLmxlbmd0aCA9PT0gcmVzdWx0cy5sZW5ndGgpIHtcbiAgICB2YXIgbGlzdE9mRXJyb3JzID0gZmxhdHRlbkNvbXBsZXRlKGVycm9ycyk7XG4gICAgdmFyIHIgPSBFckVycm9yLmV4cGxhaW5FcnJvcihsaXN0T2ZFcnJvcnMpO1xuICAgIGRlYnVnbG9nKCgpPT4naGVyZSBleHBsYWluICcgKyByKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xuICAvKlxuICBpZiAocmVzdWx0cy5sZW5ndGggPT09IDApIHtcbiAgICBkZWJ1Z2xvZygoKSA9PiBgIG5vIGFuc3dlcnM6ICR7SlNPTi5zdHJpbmdpZnkocmVzdWx0cywgdW5kZWZpbmVkLCAyKX1gKTtcbiAgICBpZiAoZXJyb3JzLmxlbmd0aCA+IDApIHtcbiAgICAgIGlmICgoZXJyb3JzIGFzIGFueVtdKS5maWx0ZXIoZXJyID0+IChlcnIgPT09IGZhbHNlKSkubGVuZ3RoID4gMCkge1xuICAgICAgICBkZWJ1Z2xvZygndmFsaWQgcmVzdWx0JylcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDsgLy8gYXQgbGVhc3Qgb25lIHF1ZXJ5IHdhcyBva1xuICAgICAgfVxuICAgICAgZGVidWdsb2coKCkgPT4gYCBlcnJvcnM6ICAke0pTT04uc3RyaW5naWZ5KGVycm9ycywgdW5kZWZpbmVkLCAyKX1gKTtcbiAgICAgIGlmIChlcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBFckVycm9yLmV4cGxhaW5FcnJvcihlcnJvcnMpOyAvL1swXS50ZXh0XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG4gICovXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmbGF0dGVuVG9TdHJpbmdBcnJheShyZXN1bHRzOiBBcnJheTxJTWF0Y2guSVdoYXRJc1R1cGVsQW5zd2VyPik6IHN0cmluZ1tdW10ge1xuICAvLyBUT0RPIFNQTElUIEJZIERPTUFJTlxuICB2YXIgcmVzID0gW107XG4gIHZhciBjbnQgPSByZXN1bHRzLnJlZHVjZShmdW5jdGlvbiAocHJldiwgcmVzdWx0KSB7XG4gICAgaWYgKHRydWUpIHsgLy8gVE9ETyByZXN1bHQuX3JhbmtpbmcgPT09IHJlc3VsdHNbMF0uX3JhbmtpbmcpIHtcbiAgICAgIHZhciBhcnJzID0gcHJvamVjdFJlc3VsdHNUb1N0cmluZ0FycmF5KHJlc3VsdCk7XG4gICAgICByZXMgPSByZXMuY29uY2F0KGFycnMpO1xuICAgIH1cbiAgICByZXR1cm4gcHJldjtcbiAgfSwgMCk7XG4gIHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBqb2luUmVzdWx0c0ZpbHRlckR1cGxpY2F0ZXMoYW5zd2VyczogQXJyYXk8SU1hdGNoLklXaGF0SXNUdXBlbEFuc3dlcj4pOiBzdHJpbmdbXSB7XG4gIHZhciByZXMgPSBbXTtcbiAgdmFyIHNlZW4gPSBbXTsgLy8gc2VyaWFsaXplZCBpbmRleFxuICB2YXIgY250ID0gYW5zd2Vycy5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIHJlc3VsdCkge1xuICAgIGlmICh0cnVlKSB7IC8vIFRPRE8gcmVzdWx0Ll9yYW5raW5nID09PSByZXN1bHRzWzBdLl9yYW5raW5nKSB7XG4gICAgICB2YXIgYXJycyA9IHByb2plY3RSZXN1bHRzVG9TdHJpbmdBcnJheShyZXN1bHQpO1xuICAgICAgdmFyIGNudGxlbiA9IGFycnMucmVkdWNlKCAocHJldixyb3cpID0+IHtcbiAgICAgICAgdmFyIHZhbHVlID0gVXRpbHMubGlzdFRvUXVvdGVkQ29tbWFBbmQocm93KTsgLy9wcm9qZWN0UmVzdWx0VG9TdHJpbmdBcnJheShyZXN1bHQsIHJlc3VsdCkpO1xuICAgICAgICBpZiAoc2Vlbi5pbmRleE9mKHZhbHVlKSA8IDApIHtcbiAgICAgICAgICBzZWVuLnB1c2godmFsdWUpO1xuICAgICAgICAgIHJlcy5wdXNoKHJvdyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByZXYgKyAxO30gLCAwKTtcbiAgICB9XG4gICAgcmV0dXJuIHByZXY7XG4gIH0sIDApO1xuICByZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNPS0Fuc3dlcihhbnN3ZXIgOiBJTWF0Y2guSVR1cGVsQW5zd2VyKSA6IGJvb2xlYW4ge1xuICByZXR1cm4gIShhbnN3ZXIuZXJyb3JzKSAmJiAoYW5zd2VyLmRvbWFpbiAhPT0gdW5kZWZpbmVkKTtcbn1cbmZ1bmN0aW9uIGlzTm90VW5kZWZpbmVkKG9iaiA6IGFueSkgOiBib29sZWFuIHtcbiAgcmV0dXJuICEob2JqID09PSB1bmRlZmluZWQpO1xufVxuXG5mdW5jdGlvbiBpc05vdEVtcHR5UmVzdWx0KGFuc3dlciA6IElNYXRjaC5JVHVwZWxBbnN3ZXIpIDogYm9vbGVhbiB7XG4gIHJldHVybiAoYW5zd2VyLnJlc3VsdHMubGVuZ3RoID4gMClcbn1cblxuLyoqXG4gKlxuICogQHBhcmFtIGFuc3dlcnNcbiAqIEByZXR1cm4ge3N0cmluZ1tdfSBhbiBhcnJheSBvZiBzdHJpbmdzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREaXN0aW5jdE9LRG9tYWlucyhhbnN3ZXJzIDogSU1hdGNoLklUdXBlbEFuc3dlcltdKSA6IHN0cmluZ1tdIHtcbiAgcmV0dXJuIF8udW5pcShhbnN3ZXJzLmZpbHRlcihpc09LQW5zd2VyKS5tYXAociA9PiByLmRvbWFpbikuZmlsdGVyKGlzTm90VW5kZWZpbmVkKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNPS0Fuc3dlcihhbnN3ZXJzIDogSU1hdGNoLklUdXBlbEFuc3dlcnMpIDogYm9vbGVhbiB7XG4gIHJldHVybiBnZXREaXN0aW5jdE9LRG9tYWlucyhhbnN3ZXJzKS5sZW5ndGggPiAwIDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc0Vycm9yKGFuc3dlcnMgOiBJTWF0Y2guSVR1cGVsQW5zd2VycykgOiBib29sZWFuIHtcbiAgcmV0dXJuICFhbnN3ZXJzLmV2ZXJ5KGlzT0tBbnN3ZXIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzRW1wdHlSZXN1bHQoYW5zd2VycyA6IElNYXRjaC5JVHVwZWxBbnN3ZXJzKSA6IGJvb2xlYW4ge1xuICByZXR1cm4gIWFuc3dlcnMuZXZlcnkoYW5zd2VyID0+XG4gIHtcbiAgICBpZihhbnN3ZXIucmVzdWx0cy5sZW5ndGggPD0gMCkge1xuICAgICAgLy9jb25zb2xlLmxvZygnaGVyZSBlbXB0eScgKyBKU09OLnN0cmluZ2lmeShhbnN3ZXIpKTtcbiAgICB9XG4gICAgcmV0dXJuIChhbnN3ZXIucmVzdWx0cy5sZW5ndGggPiAwKTtcbiAgfSk7XG59XG5cblxuLyoqXG4gKlxuICogQHBhcmFtIGFuc3dlcnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9LSWZEaXN0aW5jdE9LRG9tYWlucyhhbnN3ZXJzIDogSU1hdGNoLklUdXBlbEFuc3dlcltdKSA6IHN0cmluZ1tdIHtcbiAgcmV0dXJuIF8udW5pcShhbnN3ZXJzLmZpbHRlcihpc09LQW5zd2VyKS5tYXAociA9PiByLmRvbWFpbikuZmlsdGVyKGlzTm90VW5kZWZpbmVkKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVFcnJvcnNJZk9LQW5zd2VycyhhbnN3ZXJzOiBJTWF0Y2guSVR1cGVsQW5zd2VycykgOiBJTWF0Y2guSVR1cGVsQW5zd2VycyB7XG4gIGlmIChoYXNPS0Fuc3dlcihhbnN3ZXJzKSApIHtcbiAgICByZXR1cm4gYW5zd2Vycy5maWx0ZXIoaXNPS0Fuc3dlcik7XG4gIH1cbiAgcmV0dXJuIGFuc3dlcnM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVFbXB0eVJlc3VsdHMoYW5zd2VyczogSU1hdGNoLklUdXBlbEFuc3dlcnMpIDogSU1hdGNoLklUdXBlbEFuc3dlcnMge1xuICBpZiAoaGFzT0tBbnN3ZXIoYW5zd2VycykgKSB7XG4gICAgcmV0dXJuIGFuc3dlcnMuZmlsdGVyKGlzTm90RW1wdHlSZXN1bHQpO1xuICB9XG4gIHJldHVybiBhbnN3ZXJzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlTWV0YW1vZGVsUmVzdWx0SWZPdGhlcnMoYW5zd2VycyA6IElNYXRjaC5JVHVwZWxBbnN3ZXJzKSA6IElNYXRjaC5JVHVwZWxBbnN3ZXJzIHtcbiAgaWYoaGFzRXJyb3IoYW5zd2VycykpIHtcbiAgICB0aHJvdyBFcnJvcigncmVtb3ZlIGVycm9ycyBiZWZvcmUnKTtcbiAgfVxuICBpZihoYXNFbXB0eVJlc3VsdChhbnN3ZXJzKSkge1xuICAgIHRocm93IEVycm9yKCdydW4gcmVtb3ZlRW1wdHlSZXN1bHRzIGJlZm9yZScpO1xuICB9XG4gIHZhciBkb21haW5zID0gZ2V0RGlzdGluY3RPS0RvbWFpbnMoYW5zd2Vycyk7XG4gIGlmICgoZG9tYWlucy5sZW5ndGggPiAxKSAmJiBkb21haW5zLmluZGV4T2YoJ21ldGFtb2RlbCcpID4gMCApIHtcbiAgICByZXR1cm4gYW5zd2Vycy5maWx0ZXIoYSA9PiAoYS5kb21haW4gIT09ICdtZXRhbW9kZWwnKSk7XG4gIH1cbiAgcmV0dXJuIGFuc3dlcnM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1NpZ25pZmljYW50V29yZCh3b3JkIDogSU1hdGNoLklXb3JkKSB7XG4gIHJldHVybiB3b3JkLnJ1bGUud29yZFR5cGUgPT09ICdGJ1xuICAgICAgfHwgd29yZC5ydWxlLndvcmRUeXBlID09PSAnQyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1NpZ25pZmljYW50RGlmZmVyZW5jZShhY3R1YWx3b3JkIDogc3RyaW5nLCBtYXRjaGVkV29yZDogc3RyaW5nKSB7XG4gIHZhciBsY2EgPSBhY3R1YWx3b3JkLnRvTG93ZXJDYXNlKCk7XG4gIHZhciBsY20gPSBtYXRjaGVkV29yZC50b0xvd2VyQ2FzZSgpO1xuICBpZiggbGNhID09PSBsY20pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKCBsY2EgKyAncycgPT09IGxjbSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoIGxjYSA9PT0gbGNtICsncycgKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UXVlcnlTdHJpbmcoYW5zdyA6IElNYXRjaC5JVHVwZWxBbnN3ZXIpIDogc3RyaW5nIHtcbiAgdmFyIHdvcmRzID0gW107XG4gIGRlYnVnbG9nKCgpPT4gJ2hlcmUgdG9rZW5zOicgKyBhbnN3LmF1eC50b2tlbnMpO1xuICBkZWJ1Z2xvZygoKT0+IEpTT04uc3RyaW5naWZ5KGFuc3cuYXV4LnNlbnRlbmNlLHVuZGVmaW5lZCwyKSk7XG4gIGRlYnVnbG9nKCgpPT4gJyAnICsgU2VudGVuY2UuZHVtcE5pY2VSdWxlZChhbnN3LmF1eC5zZW50ZW5jZSkpO1xuICBhbnN3LmF1eC5zZW50ZW5jZS5mb3JFYWNoKCAod29yZCwgaW5kZXgpID0+IHtcbiAgICB2YXIgd29yZCA9IGFuc3cuYXV4LnNlbnRlbmNlW2luZGV4XTtcbiAgICB3b3Jkcy5wdXNoKHdvcmQuc3RyaW5nKTtcbiAgICBpZiAoIGlzU2lnbmlmaWNhbnRXb3JkKHdvcmQpKVxuICAgIGlmICggaXNTaWduaWZpY2FudERpZmZlcmVuY2Uod29yZC5tYXRjaGVkU3RyaW5nLCB3b3JkLnN0cmluZykgKSB7XG4gICAgICAgICAgICB3b3Jkcy5wdXNoKFwiKFxcXCJcIiArIHdvcmQucnVsZS5tYXRjaGVkU3RyaW5nICsgXCJcXFwiKVwiKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gd29yZHMuam9pbihcIiBcIik7XG59O1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBjbXBEb21haW5TZW50ZW5jZVJhbmtpbmcoYSA6IElNYXRjaC5JVHVwZWxBbnN3ZXIsIGIgOiBJTWF0Y2guSVR1cGVsQW5zd2VyKSA6IG51bWJlciB7XG4gIHZhciByID0gYS5kb21haW4ubG9jYWxlQ29tcGFyZShiLmRvbWFpbik7XG4gIGlmIChyKSB7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgdmFyIGNhID0gU2VudGVuY2UucmFua2luZ0dlb21ldHJpY01lYW4oYS5hdXguc2VudGVuY2UpO1xuICB2YXIgY2IgPSBTZW50ZW5jZS5yYW5raW5nR2VvbWV0cmljTWVhbihiLmF1eC5zZW50ZW5jZSk7XG4gIHJldHVybiBjYiAtIGNhO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmV0YWluT25seVRvcFJhbmtlZFBlckRvbWFpbihhbnN3ZXJzIDogSU1hdGNoLklUdXBlbEFuc3dlcnMpIDogSU1hdGNoLklUdXBlbEFuc3dlcnMge1xuICB2YXIgZG9tYWlucyA9IGdldERpc3RpbmN0T0tEb21haW5zKGFuc3dlcnMpO1xuIC8qIGRvbWFpbnMuc29ydCgpO1xuIC8gYW5zd2Vycy5mb3JFYWNoKCAoYW5zd2VyLCBpbmRleCkgPT4gIHtcbiAgICBjb25zb2xlLmxvZyhTZW50ZW5jZS5yYW5raW5nR2VvbWV0cmljTWVhbihhbnN3ZXIuYXV4LnNlbnRlbmNlKSk7XG4gIH0pO1xuICAqL1xuICBhbnN3ZXJzLnNvcnQoY21wRG9tYWluU2VudGVuY2VSYW5raW5nKTtcbiAgcmV0dXJuIGFuc3dlcnMuZmlsdGVyKCAoZW50cnksIGluZGV4LCBhcnIpID0+ICB7XG4gICAgaWYgKChpbmRleCA9PT0gMCkgfHwgIChlbnRyeS5kb21haW4gIT09IGFycltpbmRleC0xXS5kb21haW4pKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgdmFyIHByZXYgPSBhcnJbaW5kZXgtMV07XG4gICAgdmFyIHJhbmtfcHJldiA9IFNlbnRlbmNlLnJhbmtpbmdHZW9tZXRyaWNNZWFuKHByZXYuYXV4LnNlbnRlbmNlKTtcbiAgICB2YXIgcmFuayA9IFNlbnRlbmNlLnJhbmtpbmdHZW9tZXRyaWNNZWFuKGVudHJ5LmF1eC5zZW50ZW5jZSk7XG4gICAgaWYgKCFXaGF0SXMuc2FmZUVxdWFsKHJhbmssIHJhbmtfcHJldikpIHtcbiAgICAgIGRlYnVnbG9nKCAoKT0+IGBkcm9wcGluZyAkeyBpbmRleCB9ICR7IFNlbnRlbmNlLmR1bXBOaWNlUnVsZWQoZW50cnkuYXV4LnNlbnRlbmNlKSB9IGApO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzdWx0QXNMaXN0U3RyaW5nKGFuc3dlcnM6SU1hdGNoLklUdXBlbEFuc3dlcnMpIDogc3RyaW5nIHtcbiAgdmFyIG5vbmVycm9yID0gcmVtb3ZlRXJyb3JzSWZPS0Fuc3dlcnMoYW5zd2Vycyk7XG4gIHZhciBub25lbXB0eSA9IHJlbW92ZUVtcHR5UmVzdWx0cyhub25lcnJvcik7XG4gIHZhciBmaWx0ZXJlZE5vTU0gPSByZW1vdmVNZXRhbW9kZWxSZXN1bHRJZk90aGVycyhub25lbXB0eSk7XG4gIHZhciBmaWx0ZXJlZCA9IHJldGFpbk9ubHlUb3BSYW5rZWRQZXJEb21haW4oZmlsdGVyZWROb01NKTtcbiAgdmFyIGRvbWFpbnMgPSBnZXREaXN0aW5jdE9LRG9tYWlucyhmaWx0ZXJlZCk7XG4gIGRvbWFpbnMuc29ydCgpO1xuICB2YXIgcmVzID0gJyc7XG4gIGlmKGRvbWFpbnMubGVuZ3RoID4gMSApIHtcbiAgICByZXMgPSBcIlRoZSBxdWVyeSBoYXMgYW5zd2VycyBpbiBtb3JlIHRoYW4gb25lIGRvbWFpbjpcXG5cIlxuICB9XG4gIHJlcyArPSBkb21haW5zLm1hcChkb20gPT4ge1xuICAgIHZhciBhbnN3ZXJzRm9yRG9tYWluID0gIGFuc3dlcnMuZmlsdGVyKGEgPT4gKGEuZG9tYWluID09PSBkb20pKTtcbiAgICByZXR1cm4gYW5zd2Vyc0ZvckRvbWFpbi5tYXAoIGFuc3cgPT4ge1xuICAgICAgdmFyIGxvY2FscmVzID0gJyc7XG4gICAgICB2YXIgcXVlcnlzdHIgPSBnZXRRdWVyeVN0cmluZyhhbnN3KTtcbiAgICAgIHZhciBhbnN3ZXJOID0gam9pblJlc3VsdHNUdXBlbChbYW5zd10pLmpvaW4oXCJcXG5cIik7XG4gICAgICBsb2NhbHJlcyArPSBxdWVyeXN0cjtcbiAgICAgIGlmKGRvbWFpbnMubGVuZ3RoID4gMSkge1xuICAgICAgICBsb2NhbHJlcyArPSBcIiBpbiBkb21haW4gXFxcIlwiICsgZG9tICsgXCJcXFwiLi4uXFxuXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb2NhbHJlcyArPSBcIlxcbi4uLlwiXG4gICAgICB9XG4gICAgICBsb2NhbHJlcyArPSBqb2luUmVzdWx0c1R1cGVsKFthbnN3XSkuam9pbihcIlxcblwiKSArIFwiXFxuXCI7XG4gICAgICByZXR1cm4gbG9jYWxyZXM7XG4gICAgfSkuam9pbihcIlxcblwiKTtcbiAgfSkuam9pbihcIlxcblwiKTtcbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBUT0RPXG4gKiBAcGFyYW0gcmVzdWx0c1xuICovXG5leHBvcnQgZnVuY3Rpb24gam9pblJlc3VsdHNUdXBlbChyZXN1bHRzOiBBcnJheTxJTWF0Y2guSVdoYXRJc1R1cGVsQW5zd2VyPik6IHN0cmluZ1tdIHtcbiAgLy8gVE9ETyBTUExJVCBCWSBET01BSU5cbiAgdmFyIHJlcyA9IFtdO1xuICB2YXIgY250ID0gcmVzdWx0cy5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIHJlc3VsdCkge1xuICAgIGlmICh0cnVlKSB7IC8vIFRPRE8gcmVzdWx0Ll9yYW5raW5nID09PSByZXN1bHRzWzBdLl9yYW5raW5nKSB7XG4gICAgICB2YXIgYXJycyA9IHByb2plY3RSZXN1bHRzVG9TdHJpbmdBcnJheShyZXN1bHQpO1xuICAgICAgdmFyIGNudGxlbiA9IGFycnMucmVkdWNlKCAocHJldixyb3cpID0+IHtcbiAgICAgICAgdmFyIHZhbHVlID0gVXRpbHMubGlzdFRvUXVvdGVkQ29tbWFBbmQocm93KTsgLy9wcm9qZWN0UmVzdWx0VG9TdHJpbmdBcnJheShyZXN1bHQsIHJlc3VsdCkpO1xuICAgICAgICBpZiAocmVzLmluZGV4T2YodmFsdWUpIDwgMCkge1xuICAgICAgICAgIHJlcy5wdXNoKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJldiArIDE7fSAsIDApO1xuICAgIH1cbiAgICByZXR1cm4gcHJldjtcbiAgfSwgMCk7XG4gIHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmZlckRvbWFpbih0aGVNb2RlbDogSU1hdGNoLklNb2RlbHMsIGNvbnRleHRRdWVyeVN0cmluZzogc3RyaW5nKTogc3RyaW5nIHtcbiAgLy8gY29uc29sZS5sb2coXCJoZXJlIHRoZSBzdHJpbmdcIiArIGNvbnRleHRRdWVyeVN0cmluZyk7XG4gIC8vICBjb25zb2xlLmxvZyhcImhlcmUgdGhlIHJ1bGVzXCIgKyBKU09OLnN0cmluZ2lmeSh0aGVNb2RlbC5tUnVsZXMpKTtcbiAgdmFyIHJlcyA9IGFuYWx5emVDb250ZXh0U3RyaW5nKGNvbnRleHRRdWVyeVN0cmluZywgdGhlTW9kZWwucnVsZXMpO1xuICBkZWJ1Z2xvZygoKT0+SlNPTi5zdHJpbmdpZnkocmVzLHVuZGVmaW5lZCwyKSk7XG4gIC8vIHJ1biB0aHJvdWdoIHRoZSBzdHJpbmcsIHNlYXJjaCBmb3IgYSBjYXRlZ29yeVxuICBpZiAoIXJlcy5zZW50ZW5jZXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICB2YXIgZG9tYWlucyA9IFtdO1xuICAvL2NvbnNvbGUubG9nKFNlbnRlbmNlLmR1bXBOaWNlQXJyKHJlcykpO1xuICAvLyBkbyB3ZSBoYXZlIGEgZG9tYWluID9cbiAgcmVzLnNlbnRlbmNlc1swXS5mb3JFYWNoKGZ1bmN0aW9uIChvV29yZEdyb3VwKSB7XG4gICAgaWYgKG9Xb3JkR3JvdXAuY2F0ZWdvcnkgPT09IFwiZG9tYWluXCIpIHtcbiAgICAgIGRvbWFpbnMucHVzaChvV29yZEdyb3VwLm1hdGNoZWRTdHJpbmcpXG4gICAgfVxuICB9KTtcbiAgaWYgKGRvbWFpbnMubGVuZ3RoID09PSAxKSB7XG4gICAgZGVidWdsb2coXCJnb3QgYSBwcmVjaXNlIGRvbWFpbiBcIiArIGRvbWFpbnNbMF0pO1xuICAgIHJldHVybiBkb21haW5zWzBdO1xuICB9XG4gIGlmIChkb21haW5zLmxlbmd0aCA+IDApIHtcbiAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKFwiZ290IG1vcmUgdGhhbiBvbmUgZG9tYWluLCBjb25mdXNlZCAgXCIgKyBkb21haW5zLmpvaW4oXCJcXG5cIikpIDogJy0nKTtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIC8vIFRPRE9EXG4gIH1cbiAgZGVidWdsb2coXCJhdHRlbXB0aW5nIHRvIGRldGVybWluZSBjYXRlZ29yaWVzXCIpXG4gIC8vIHRyeSBhIGNhdGVnb3J5IHJldmVyc2UgbWFwXG4gIHJlcy5zZW50ZW5jZXNbMF0uZm9yRWFjaChmdW5jdGlvbiAob1dvcmRHcm91cCkge1xuICAgIGlmIChvV29yZEdyb3VwLmNhdGVnb3J5ID09PSBcImNhdGVnb3J5XCIpIHtcbiAgICAgIHZhciBzQ2F0ID0gb1dvcmRHcm91cC5tYXRjaGVkU3RyaW5nO1xuICAgICAgdmFyIGRvbXMgPSBNb2RlbC5nZXREb21haW5zRm9yQ2F0ZWdvcnkodGhlTW9kZWwsIHNDYXQpO1xuICAgICAgZG9tcy5mb3JFYWNoKGZ1bmN0aW9uIChzRG9tKSB7XG4gICAgICAgIGlmIChkb21haW5zLmluZGV4T2Yoc0RvbSkgPCAwKSB7XG4gICAgICAgICAgZG9tYWlucy5wdXNoKHNEb20pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuICBpZiAoZG9tYWlucy5sZW5ndGggPT09IDEpIHtcbiAgICBkZWJ1Z2xvZyhcImdvdCBhIHByZWNpc2UgZG9tYWluIFwiICsgZG9tYWluc1swXSk7XG4gICAgcmV0dXJuIGRvbWFpbnNbMF07XG4gIH1cbiAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/IChcImdvdCBtb3JlIHRoYW4gb25lIGRvbWFpbiwgY29uZnVzZWQgIFwiICsgZG9tYWlucy5qb2luKFwiXFxuXCIpKSA6ICctJyk7XG4gIHJldHVybiB1bmRlZmluZWQ7XG59OyJdfQ==
