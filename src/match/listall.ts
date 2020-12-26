/**
 *
 * @module jfseb.fdevstart.analyze
 * @file analyze.ts
 * @copyright (c) 2016 Gerd Forstmann
 */

import * as Algol from './algol';
import * as debug from 'debugf';

const debuglog = debug('listall');
import * as logger from '../utils/logger';
var logPerf = logger.perf("perflistall");
var perflog = debug('perf');
import * as _ from 'lodash';
//const perflog = logger.perf("perflistall");

import * as Utils from 'abot_utils';
import * as IMatch from './ifmatch';
//import * as Match from './match';

//import * as Toolmatcher from './toolmatcher';
import { BreakDown } from '../model/index_model';
import { Sentence as Sentence } from '../index_parser';;
import { Word as Word } from '../index_parser';;
import * as Operator from './operator';
import * as WhatIs from './whatis';
import { ErError as ErError } from '../index_parser';;
import { Model } from '../model/index_model';
import * as MongoQueries from './mongoqueries';


export function projectResultToStringArray( answer : IMatch.IWhatIsTupelAnswer, result : MongoQ.IResultRecord) : string[] {
  return answer.columns.map( c => '' + result[c]);
}

export function projectResultsToStringArray( answer : IMatch.IWhatIsTupelAnswer) : string[][] {
  return answer.results.map( rec => projectResultToStringArray(answer, rec )); /*answer.columns.map( c =>
    { //console.log('here ' + JSON.stringify(res));
      return ('' + res[c]); }
  ));
  */
}

export function projectFullResultsToFlatStringArray( answers : IMatch.IWhatIsTupelAnswer[]) : string[][] {
  return answers.reduce( (prev,result) =>  {
    prev = prev.concat(projectResultsToStringArray(result));
    return prev;
  } , []);
}


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


export function analyzeContextString(contextQueryString: string, rules: IMatch.SplitRules) {
  return WhatIs.analyzeContextString(contextQueryString, rules);
}

// const result = WhatIs.resolveCategory(cat, a1.entity,
//   theModel.mRules, theModel.tools, theModel.records);


export function listAllWithContext(category: string, contextQueryString: string,
  theModel: IMatch.IModels, domainCategoryFilter?: IMatch.IDomainCategoryFilter): Promise<IMatch.IProcessedWhatIsTupelAnswers> {
  return listAllTupelWithContext([category], contextQueryString, theModel, domainCategoryFilter);
}


/*
export function listAllWithCategory(category: string, theModel: IMatch.IModels): Array<IMatch.IRecord> {
  var matchedAnswers = matchRecordHavingCategory(category, theModel); //aTool: Array<IMatch.ITool>): any / * objectstream* / {
  debuglog(" listAllWithCategory:" + JSON.stringify(matchedAnswers, undefined, 2));
  return matchedAnswers;
}
*/
import { MongoQ as MongoQ } from '../index_parser';;

export function listAllShowMe(query : string, theModel : IMatch.IModels ) : Promise<MongoQ.IProcessedMongoAnswers> {
  return MongoQueries.listShowMe(query, theModel);
}


/**
 * analyze results of a query,
 *
 * Resorting results
 *
 * -> split by domains
 * -> order by significance of sentence, dropping "lees relevant" (e.g. metamodel) answers
 * -> prune
 */

export function sortAnwsersByDomains( )
 {

 }
//



export function listAllTupelWithContext(categories: string[], contextQueryString: string,
  theModel: IMatch.IModels, domainCategoryFilter?: IMatch.IDomainCategoryFilter): Promise<IMatch.IProcessedWhatIsTupelAnswers> {

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

/*
export function filterStringListByOp(operator: IMatch.IOperator, fragment: string, srcarr: string[]): string[] {
  var fragmentLC = BreakDown.trimQuotedSpaced(fragment.toLowerCase());
  return srcarr.filter(function (str) {
    return Operator.matches(operator, fragmentLC, str.toLowerCase());
  }).sort();
}
*/

function compareCaseInsensitive(a: string, b: string) {
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
export function removeCaseDuplicates(arr: string[]): string[] {
  arr.sort(compareCaseInsensitive);
  debuglog('sorted arr' + JSON.stringify(arr));
  return arr.filter(function (s, index) {
    return index === 0 || (0 !== arr[index - 1].toLowerCase().localeCompare(s.toLowerCase()));
  });
};

export function getCategoryOpFilterAsDistinctStrings(operator: IMatch.IOperator, fragment: string,
  category: string, records: Array<IMatch.IRecord>, filterDomain?: string): string[] {
  var fragmentLC = BreakDown.trimQuoted(fragment.toLowerCase());
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
};

export function likelyPluralDiff(a: string, pluralOfa: string): boolean {
  var aLC = BreakDown.trimQuoted(a.toLowerCase()) || "";
  var pluralOfALC = BreakDown.trimQuoted((pluralOfa || "").toLowerCase()) || "";
  if (aLC === pluralOfALC) {
    return true;
  }
  if (aLC + 's' === pluralOfALC) {
    return true;
  }
  return false;
};

export function joinSortedQuoted(strings: string[]): string {
  if (strings.length === 0) {
    return "";
  }
  return '"' + strings.sort().join('"; "') + '"';
}

/*
export function joinDistinct(category: string, records: Array<IMatch.IRecord>): string {
  var res = records.reduce(function (prev, oRecord) {
    prev[oRecord[category]] = 1;
    return prev;
  }, {} as any);
  return joinSortedQuoted(Object.keys(res));
}
*/

export function formatDistinctFromWhatIfResult(answers: Array<IMatch.IWhatIsTupelAnswer>): string {
  var strs = projectFullResultsToFlatStringArray(answers);
  var resFirst = strs.map(r => r[0]);

  return joinSortedQuoted( resFirst ); /*projectResultsToStringArray(answers) answers.map(function (oAnswer) {
    return oAnswer.result;
  }));*/
}



export function flattenErrors(results: IMatch.IProcessedWhatIsTupelAnswers) : any[] {
  debuglog('flatten errors');
  return results.reduce( (prev, rec) =>  { if ((rec.errors !== undefined) && (rec.errors !== false)
    && (!_.isArray(rec.errors) || rec.errors.length > 0)) {
      prev.push(rec.errors); }
    return prev;
  }, []);
}

export function flattenComplete(r : any[]) : any[] {
  var res =[];
  r.forEach(mem => { if ( _.isArray(mem)) {
     res = res.concat(mem);
   } else {
     res.push(mem);
   }});
  return res;
}

/**
 * return undefined if resutls is not only erroneous
 * @param results
 */
export function returnErrorTextIfOnlyError(results: IMatch.IProcessedWhatIsTupelAnswers): string {
  var errors = flattenErrors(results);
  debuglog(()=>'here flattened errors ' + errors.length + '/' + results.length);
  if(errors.length === results.length) {
    var listOfErrors = flattenComplete(errors);
    var r = ErError.explainError(listOfErrors);
    debuglog(()=>'here explain ' + r);
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

export function flattenToStringArray(results: Array<IMatch.IWhatIsTupelAnswer>): string[][] {
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

export function joinResultsFilterDuplicates(answers: Array<IMatch.IWhatIsTupelAnswer>): string[] {
  var res = [];
  var seen = []; // serialized index
  var cnt = answers.reduce(function (prev, result) {
    if (true) { // TODO result._ranking === results[0]._ranking) {
      var arrs = projectResultsToStringArray(result);
      var cntlen = arrs.reduce( (prev,row) => {
        var value = Utils.listToQuotedCommaAnd(row); //projectResultToStringArray(result, result));
        if (seen.indexOf(value) < 0) {
          seen.push(value);
          res.push(row);
        }
        return prev + 1;} , 0);
    }
    return prev;
  }, 0);
  return res;
}

export function isOKAnswer(answer : IMatch.ITupelAnswer) : boolean {
  return !(answer.errors) && (answer.domain !== undefined);
}
function isNotUndefined(obj : any) : boolean {
  return !(obj === undefined);
}

function isNotEmptyResult(answer : IMatch.ITupelAnswer) : boolean {
  return (answer.results.length > 0)
}

/**
 *
 * @param answers
 * @return {string[]} an array of strings
 */
export function getDistinctOKDomains(answers : IMatch.ITupelAnswer[]) : string[] {
  return _.uniq(answers.filter(isOKAnswer).map(r => r.domain).filter(isNotUndefined));
}

export function hasOKAnswer(answers : IMatch.ITupelAnswers) : boolean {
  return getDistinctOKDomains(answers).length > 0 ;
}

export function hasError(answers : IMatch.ITupelAnswers) : boolean {
  return !answers.every(isOKAnswer);
}

export function hasEmptyResult(answers : IMatch.ITupelAnswers) : boolean {
  return !answers.every(answer =>
  {
    if(answer.results.length <= 0) {
      //console.log('here empty' + JSON.stringify(answer));
    }
    return (answer.results.length > 0);
  });
}


/**
 *
 * @param answers
 */
export function getOKIfDistinctOKDomains(answers : IMatch.ITupelAnswer[]) : string[] {
  return _.uniq(answers.filter(isOKAnswer).map(r => r.domain).filter(isNotUndefined));
}

export function removeErrorsIfOKAnswers(answers: IMatch.ITupelAnswers) : IMatch.ITupelAnswers {
  if (hasOKAnswer(answers) ) {
    return answers.filter(isOKAnswer);
  }
  return answers;
}

export function removeEmptyResults(answers: IMatch.ITupelAnswers) : IMatch.ITupelAnswers {
  if (hasOKAnswer(answers) ) {
    return answers.filter(isNotEmptyResult);
  }
  return answers;
}

export function removeMetamodelResultIfOthers(answers : IMatch.ITupelAnswers) : IMatch.ITupelAnswers {
  if(hasError(answers)) {
    throw Error('remove errors before');
  }
  if(hasEmptyResult(answers)) {
    throw Error('run removeEmptyResults before');
  }
  var domains = getDistinctOKDomains(answers);
  if ((domains.length > 1) && domains.indexOf('metamodel') > 0 ) {
    return answers.filter(a => (a.domain !== 'metamodel'));
  }
  return answers;
}

export function isSignificantWord(word : IMatch.IWord) {
  return word.rule.wordType === 'F'
      || word.rule.wordType === 'C';
}

export function isSignificantDifference(actualword : string, matchedWord: string) {
  var lca = actualword.toLowerCase();
  var lcm = matchedWord.toLowerCase();
  if( lca === lcm) {
    return false;
  }
  if ( lca + 's' === lcm) {
    return false;
  }
  if ( lca === lcm +'s' ) {
    return false;
  }
  return true;
}

export function getQueryString(answ : IMatch.ITupelAnswer) : string {
  var words = [];
  debuglog(()=> 'here tokens:' + answ.aux.tokens);
  debuglog(()=> JSON.stringify(answ.aux.sentence,undefined,2));
  debuglog(()=> ' ' + Sentence.dumpNiceRuled(answ.aux.sentence));
  answ.aux.sentence.forEach( (word, index) => {
    var word = answ.aux.sentence[index];
    words.push(word.string);
    if ( isSignificantWord(word))
    if ( isSignificantDifference(word.matchedString, word.string) ) {
            words.push("(\"" + word.rule.matchedString + "\")");
    }
  });
  return words.join(" ");
};


export function cmpDomainSentenceRanking(a : IMatch.ITupelAnswer, b : IMatch.ITupelAnswer) : number {
  var r = a.domain.localeCompare(b.domain);
  if (r) {
    return r;
  }
  var ca = Sentence.rankingGeometricMean(a.aux.sentence);
  var cb = Sentence.rankingGeometricMean(b.aux.sentence);
  return cb - ca;
}

export function retainOnlyTopRankedPerDomain(answers : IMatch.ITupelAnswers) : IMatch.ITupelAnswers {
  var domains = getDistinctOKDomains(answers);
 /* domains.sort();
 / answers.forEach( (answer, index) =>  {
    console.log(Sentence.rankingGeometricMean(answer.aux.sentence));
  });
  */
  answers.sort(cmpDomainSentenceRanking);
  return answers.filter( (entry, index, arr) =>  {
    if ((index === 0) ||  (entry.domain !== arr[index-1].domain)) {
      return true;
    }
    var prev = arr[index-1];
    var rank_prev = Sentence.rankingGeometricMean(prev.aux.sentence);
    var rank = Sentence.rankingGeometricMean(entry.aux.sentence);
    if (!WhatIs.safeEqual(rank, rank_prev)) {
      debuglog( ()=> `dropping ${ index } ${ Sentence.dumpNiceRuled(entry.aux.sentence) } `);
    }
    return false;
  });
}

export function resultAsListString(answers:IMatch.ITupelAnswers) : string {
  var nonerror = removeErrorsIfOKAnswers(answers);
  var nonempty = removeEmptyResults(nonerror);
  var filteredNoMM = removeMetamodelResultIfOthers(nonempty);
  var filtered = retainOnlyTopRankedPerDomain(filteredNoMM);
  var domains = getDistinctOKDomains(filtered);
  domains.sort();
  var res = '';
  if(domains.length > 1 ) {
    res = "The query has answers in more than one domain:\n"
  }
  res += domains.map(dom => {
    var answersForDomain =  answers.filter(a => (a.domain === dom));
    return answersForDomain.map( answ => {
      var localres = '';
      var querystr = getQueryString(answ);
      var answerN = joinResultsTupel([answ]).join("\n");
      localres += querystr;
      if(domains.length > 1) {
        localres += " in domain \"" + dom + "\"...\n";
      } else {
        localres += "\n..."
      }
      localres += joinResultsTupel([answ]).join("\n") + "\n";
      return localres;
    }).join("\n");
  }).join("\n");
  return res;
}

/**
 * TODO
 * @param results
 */
export function joinResultsTupel(results: Array<IMatch.IWhatIsTupelAnswer>): string[] {
  // TODO SPLIT BY DOMAIN
  var res = [];
  var cnt = results.reduce(function (prev, result) {
    if (true) { // TODO result._ranking === results[0]._ranking) {
      var arrs = projectResultsToStringArray(result);
      var cntlen = arrs.reduce( (prev,row) => {
        var value = Utils.listToQuotedCommaAnd(row); //projectResultToStringArray(result, result));
        if (res.indexOf(value) < 0) {
          res.push(value);
        }
        return prev + 1;} , 0);
    }
    return prev;
  }, 0);
  return res;
}

export function inferDomain(theModel: IMatch.IModels, contextQueryString: string): string {
  // console.log("here the string" + contextQueryString);
  //  console.log("here the rules" + JSON.stringify(theModel.mRules));
  var res = analyzeContextString(contextQueryString, theModel.rules);
  debuglog(()=>JSON.stringify(res,undefined,2));
  // run through the string, search for a category
  if (!res.sentences.length) {
    return undefined;
  }
  var domains = [];
  //console.log(Sentence.dumpNiceArr(res));
  // do we have a domain ?
  res.sentences[0].forEach(function (oWordGroup) {
    if (oWordGroup.category === "domain") {
      domains.push(oWordGroup.matchedString)
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
  debuglog("attempting to determine categories")
  // try a category reverse map
  res.sentences[0].forEach(function (oWordGroup) {
    if (oWordGroup.category === "category") {
      var sCat = oWordGroup.matchedString;
      var doms = Model.getDomainsForCategory(theModel, sCat);
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
};