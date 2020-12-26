"use strict";
/**
 *
 * @module jfseb.fdevstart.explain
 * @file explain.ts
 * @copyright (c) 2016 Gerd Forstmann
 *
 * Functions dealing with explaining facts, categories etc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.describeCategory = exports.describeFactInDomain = exports.describeDomain = exports.increment = exports.findRecordsWithFact = exports.describeCategoryInDomain = exports.getCategoryStatsInDomain = exports.toPercent = exports.makeValuesListString = exports.countRecordPresence = exports.sloppyOrExact = exports.isSynonymFor = void 0;
const Algol = require("./algol");
const debug = require("debugf");
const debuglog = debug('describe');
const logger = require("../utils/logger");
var logPerf = logger.perf("perflistall");
var perflog = debug('perf');
;
const index_parser_1 = require("../index_parser");
;
const WhatIs = require("./whatis");
const index_model_1 = require("../model/index_model");
//import * as Match from './match';
const Utils = require("abot_utils");
var sWords = {};
function isSynonymFor(exactWord, sloppyWord, theModel) {
    // TODO: use model synonyms
    return sloppyWord === "name" && exactWord === "element name";
}
exports.isSynonymFor = isSynonymFor;
function sloppyOrExact(exactWord, sloppyWord, theModel) {
    if (exactWord.toLowerCase() === sloppyWord.toLowerCase()) {
        return '"' + sloppyWord + '"';
    }
    // TODO, find plural s etc.
    // still exact,
    //
    if (isSynonymFor(exactWord, sloppyWord, theModel)) {
        return '"' + sloppyWord + '" (interpreted as synonym for "' + exactWord + '")';
    }
    //todo, find is synonymfor ...
    // TODO, a synonym for ...
    return '"' + sloppyWord + '" (interpreted as "' + exactWord + '")';
}
exports.sloppyOrExact = sloppyOrExact;
/*
export function countRecordPresenceOLD(category : string, domain : string, theModel : IMatch.IModels) : IDescribeCategory {
  var res = { totalrecords : 0,
    presentrecords : 0,
    values : { },  // an their frequency
    multivalued : false
  } as IDescribeCategory;
  theModel.records.forEach(function(record) {
    //debuglog(JSON.stringify(record,undefined,2));
    if(record._domain !== domain) {
      return;
    }
    res.totalrecords++;
    var val = record[category];
    var valarr = [val];
    if(Array.isArray(val)) {
      res.multivalued = true;
      valarr = val;
    }
    // todo wrap arr
    if(val !== undefined && val !== "n/a") {
      res.presentrecords ++;
    }
    valarr.forEach(function(val) {
      res.values[val] = (res.values[val] || 0) + 1;
    })
  })
  return res;
}
*/
function countRecordPresence(category, domain, theModel) {
    var res = { totalrecords: 0,
        presentrecords: 0,
        values: {},
        multivalued: false
    };
    return index_model_1.Model.getExpandedRecordsForCategory(theModel, domain, category).then(records => {
        res.totalrecords = records.length;
        records.forEach(function (record) {
            //debuglog(JSON.stringify(record,undefined,2));
            /*if(record._domain !== domain) {
              return;
            }*/
            var val = record[category];
            var valarr = [val];
            if (Array.isArray(val)) {
                res.multivalued = true;
                valarr = val;
            }
            // todo wrap arr
            if (val !== undefined && val !== "n/a") {
                res.presentrecords++;
            }
            valarr.forEach(function (val) {
                res.values[val] = (res.values[val] || 0) + 1;
            });
        });
    }).then(() => res);
}
exports.countRecordPresence = countRecordPresence;
/*
export function countRecordPresenceFact(fact : string, category : string, domain : string, theModel : IMatch.IModels) : Promise<IDescribeFact> {
  var res = { totalrecords : 0,
    presentrecords : 0,
    values : { },  // an their frequency
    multivalued : false
  } as IDescribeCategory;
  return Model.getExpandedRecordsForCategory(theModel,domain,category).then(records =>{
    res.totalrecords = records.length;
    records.forEach((record) =>{
      res.totalrecords++;
      var val = record[category];
      var valarr = [val];
      if(Array.isArray(val)) {
        if(val.indexOf(fact) >= 0) {
          res.multivalued = true;
          valarr = val;
          res.presentrecords++;
        }
      } else if (val === fact) {
          res.presentrecords++;
      }
    });
    return res;
  });
}
*/
/*
export function countRecordPresenceFactOld(fact : string, category : string, domain : string, theModel : IMatch.IModels) : IDescribeFact {
  var res = { totalrecords : 0,
    presentrecords : 0,
    values : { },  // an their frequency
    multivalued : false
  } as IDescribeCategory;


  theModel.records.forEach(function(record) {
    //debuglog(JSON.stringify(record,undefined,2));
    if(record._domain !== domain) {
      return;
    }
    res.totalrecords++;
    var val = record[category];
    var valarr = [val];
    if(Array.isArray(val)) {
      if(val.indexOf(fact) >= 0) {
        res.multivalued = true;
        valarr = val;
        res.presentrecords++;
      }
    } else if (val === fact) {
        res.presentrecords++;
    }
  })
  return res;
}
*/
function makeValuesListString(realvalues) {
    var valuesString = "";
    var totallen = 0;
    var listValues = realvalues.filter(function (val, index) {
        totallen = totallen + val.length;
        return (index < Algol.DescribeValueListMinCountValueList) || (totallen < Algol.DescribeValueListLengthCharLimit);
    });
    if (listValues.length === 1 && realvalues.length === 1) {
        return 'The sole value is \"' + listValues[0] + '"';
    }
    var maxlen = listValues.reduce((prev, val) => Math.max(prev, val.length), 0);
    if (maxlen > 30) {
        return "Possible values are ...\n" +
            listValues.reduce((prev, val, index) => (prev + "(" + (index + 1) + '): "' + val + '"\n'), "")
            + (listValues.length === realvalues.length ? "" : "...");
    }
    var list = "";
    if (listValues.length === realvalues.length) {
        list = Utils.listToQuotedCommaOr(listValues);
    }
    else {
        list = '"' + listValues.join('", "') + '"';
    }
    return "Possible values are ...\n"
        + list
        + (listValues.length === realvalues.length ? "" : " ...");
}
exports.makeValuesListString = makeValuesListString;
function toPercent(a, b) {
    return "" + (100 * a / b).toFixed(1);
}
exports.toPercent = toPercent;
;
function getCategoryStatsInDomain(category, filterdomain, theModel) {
    return countRecordPresence(category, filterdomain, theModel).then((recordCount) => {
        //debuglog(JSON.stringify(theModel.records.filter(a => a._domain === "Cosmos"),undefined,2));
        const percent = toPercent(recordCount.presentrecords, recordCount.totalrecords);
        debuglog(JSON.stringify(recordCount.values));
        var allValues = Object.keys(recordCount.values);
        var realvalues = allValues.filter(value => (value !== 'undefined') && (value !== 'n/a'));
        debuglog;
        realvalues.sort();
        var undefNaDelta = (allValues.length - realvalues.length);
        var delta = (undefNaDelta) ? "(+" + undefNaDelta + ")" : "";
        const distinct = '' + realvalues.length;
        const valuesList = makeValuesListString(realvalues);
        return {
            categoryDesc: theModel.full.domain[filterdomain].categories[category],
            distinct: distinct,
            delta: delta,
            presentRecords: recordCount.presentrecords,
            percPresent: percent,
            sampleValues: valuesList
        };
    });
}
exports.getCategoryStatsInDomain = getCategoryStatsInDomain;
function describeCategoryInDomain(category, filterdomain, theModel) {
    /*  const recordCount = countRecordPresence(category, filterdomain, theModel);
      debuglog(JSON.stringify(theModel.records.filter(a => a._domain === "Cosmos"),undefined,2));
      const percent = toPercent(recordCount.presentrecords , recordCount.totalrecords);
      debuglog(JSON.stringify(recordCount.values));
      var allValues =Object.keys(recordCount.values);
      var realvalues = allValues.filter(value => (value !== 'undefined') && (value !== 'n/a'));
      debuglog
      realvalues.sort();
      var undefNaDelta =  (allValues.length - realvalues.length);
      var delta =  (undefNaDelta) ?  "(+" + undefNaDelta + ")" : "";
      const distinct = '' + realvalues.length;
    
      const valuesList = makeValuesListString(realvalues);
    */
    return getCategoryStatsInDomain(category, filterdomain, theModel).then((stats) => {
        var res = 'is a category in domain "' + filterdomain + '"\n'
            + `It is present in ${stats.presentRecords} (${stats.percPresent}%) of records in this domain,\n` +
            `having ${stats.distinct + ''}${stats.delta} distinct values.\n`
            + stats.sampleValues;
        var desc = theModel.full.domain[filterdomain].categories[category] || {};
        var description = desc.category_description || "";
        if (description) {
            res += `\nDescription: ${description}`;
        }
        return res;
    });
}
exports.describeCategoryInDomain = describeCategoryInDomain;
function findRecordsWithFact(matchedString, category, records, domains) {
    return records.filter(function (record) {
        let res = (record[category] === matchedString);
        if (res) {
            increment(domains, records._domain);
        }
        return res;
    });
}
exports.findRecordsWithFact = findRecordsWithFact;
function increment(map, key) {
    map[key] = (map[key] || 0) + 1;
}
exports.increment = increment;
function sortedKeys(map) {
    var r = Object.keys(map);
    r.sort();
    return r;
}
function describeDomain(fact, domain, theModel) {
    return index_model_1.Model.getExpandedRecordsForCategory(theModel, domain, index_model_1.Model.getCategoriesForDomain(theModel, domain)[0]).then((records) => {
        var count = records.length;
        var catcount = index_model_1.Model.getCategoriesForDomain(theModel, domain).length;
        var res = sloppyOrExact(domain, fact, theModel) + `is a domain with ${catcount} categories and ${count} records\n`;
        var desc = theModel.full.domain[domain].description || "";
        if (desc) {
            res += `Description:` + desc + `\n`;
        }
        return res;
    });
}
exports.describeDomain = describeDomain;
/*
export function describeFactInDomainOld(fact : string, filterdomain : string, theModel: IMatch.IModels) : string {
  var sentences = WhatIs.analyzeContextString(fact,  theModel.rules);
  //console.log("here sentences " + JSON.stringify(sentences));
  var lengthOneSentences = sentences.sentences.filter(oSentence => oSentence.length === 1);
  var res = '';
  // remove categories and domains
  var onlyFacts = lengthOneSentences.filter(oSentence =>{
    debuglog(JSON.stringify(oSentence[0]));
    return !Word.Word.isDomain(oSentence[0]) &&
           !Word.Word.isFiller(oSentence[0]) && !Word.Word.isCategory(oSentence[0])
  }
  );
  var onlyDomains = lengthOneSentences.filter(oSentence =>{
    return Word.Word.isDomain(oSentence[0]);
  });
  if(onlyDomains && onlyDomains.length > 0) {
    debuglog(()=>JSON.stringify(onlyDomains));
    onlyDomains.forEach(function(sentence) {
      var domain = sentence[0].matchedString;
      if( !filterdomain || domain === filterdomain) {
        debuglog(()=>"here match " + JSON.stringify(sentence));
        res += describeDomain(fact, sentence[0].matchedString, theModel);
      }
    })
  }

  debuglog("only facts: " + JSON.stringify(onlyFacts));
  var recordMap = {};
  var domainsMap = {} as {[key: string] : number};
  var matchedwordMap = {} as {[key: string] : number};
  var matchedCategoryMap = {} as {[key: string] : number};
  // look for all records
  onlyFacts.forEach(oSentence =>
    oSentence.forEach(oWord =>
      {
        increment(matchedwordMap, oWord.matchedString);
        increment(matchedCategoryMap, oWord.category);
      }
    )
  );
  // we have:
  // a list of categories,
  // a list of matchedWords  ->
  //

  var categories = sortedKeys(matchedCategoryMap);
  var matchedwords = sortedKeys(matchedwordMap);
  debuglog(()=>"matchedwords: " + JSON.stringify(matchedwords));
  debuglog(()=>"categories: " + JSON.stringify(categories));

  //var allMatchedWords = { [key : string] : number };
  var domainRecordCount = {} as {[key: string] : number};
  var domainMatchCatCount = {} as {[key: string] :
       {[key: string] :
     {[key: string] : number}}};
  // we prepare the following structure
  //
  // {domain} : recordcount;
  // {matchedwords} :
  // {domain} {matchedword} {category} presencecount
  theModel.records.forEach(function(record) {
    if(!filterdomain || record._domain === filterdomain ) {
      domainRecordCount[record._domain] = (domainRecordCount[record._domain] || 0) + 1;
      matchedwords.forEach(matchedword =>
        categories.forEach(category => {
          if( record[category] === matchedword) {
            var md = domainMatchCatCount[record._domain] = domainMatchCatCount[record._domain] || {};
            var mdc = md[matchedword] =  md[matchedword] || {};
            increment(mdc,category);
          };
        }
        )
      );
    }
  });
  debuglog(()=>JSON.stringify(domainMatchCatCount,undefined,2));
  debuglog(()=>JSON.stringify(domainRecordCount,undefined,2));
  var domains = sortedKeys(domainMatchCatCount);
  var resNext =  '"' + fact + '" has a meaning in ';
  var single = false;
  if(Object.keys(domainMatchCatCount).length > 1) {
    resNext += '' + domains.length +
              ' domains: ' + Utils.listToQuotedCommaAnd(domains) + "";
  } else if(domains.length === 1) {
    if(!filterdomain) {
      resNext += `one `;
    }
    resNext += `domain "${domains[0]}":`;
    single = true;
  } else {
    if(res) {
      return res;
    }
    var factclean = Utils.stripQuotes(fact);
    if(filterdomain) {
      return `"${factclean}" is no known fact in domain "${filterdomain}".\n`;
    }
    return `I don't know anything about "${factclean}".\n`;
  }
  res += resNext + "\n"; // ...\n";
  domains.forEach(function(domain) {
    var md = domainMatchCatCount[domain];
    Object.keys(md).forEach(matchedstring => {
      var mdc = md[matchedstring];
      if(!single) {
        res += 'in domain "' + domain + '" ';
      }
      var catsingle = Object.keys(mdc).length === 1;
      res += `${sloppyOrExact(matchedstring,fact,theModel)} `;
      if(!catsingle) {
        res += `...\n`;
      }
      Object.keys(mdc).forEach(category => {
      var percent =  toPercent(mdc[category],domainRecordCount[domain]);
        res += `is a value for category "${category}" present in ${mdc[category]}(${percent}%) of records;\n`;
      });
    });
  });
  return res;
}
*/
function describeFactInDomain(fact, filterdomain, theModel) {
    var sentences = WhatIs.analyzeContextString(fact, theModel.rules);
    //console.log("here sentences " + JSON.stringify(sentences));
    var lengthOneSentences = sentences.sentences.filter(oSentence => oSentence.length === 1);
    var res = '';
    // remove categories and domains
    var onlyFacts = lengthOneSentences.filter(oSentence => {
        debuglog(JSON.stringify(oSentence[0]));
        return !index_parser_1.Word.Word.isDomain(oSentence[0]) &&
            !index_parser_1.Word.Word.isFiller(oSentence[0]) && !index_parser_1.Word.Word.isCategory(oSentence[0]);
    });
    var onlyDomains = lengthOneSentences.filter(oSentence => {
        return (index_parser_1.Word.Word.isDomain(oSentence[0]));
    });
    var pPromise = undefined;
    debuglog(() => ` here onlyDomains ${onlyDomains.join(';')}`);
    if (onlyDomains && onlyDomains.length > 0) {
        debuglog(() => JSON.stringify(onlyDomains));
        pPromise = global.Promise.all(onlyDomains.map(function (sentence) {
            var domain = sentence[0].matchedString;
            if (!filterdomain || (domain === filterdomain)) {
                debuglog(() => "here match " + JSON.stringify(sentence));
                return describeDomain(fact, sentence[0].matchedString, theModel).then(rx => {
                    //console.log(`described domain ${fact} ${domain} ` + rx);
                    res += rx;
                });
            }
            else {
                return global.Promise.resolve(undefined);
            }
        })).then((arr) => {
            debuglog(() => arr.join(";"));
            arr.map((rec) => {
                if (rec !== undefined) {
                    res += rec;
                }
            });
            return res;
        });
    }
    else {
        pPromise = global.Promise.resolve(res);
    }
    ;
    return pPromise.then(resu => {
        debuglog(() => `constructed so far "${res}"`);
        debuglog("only facts: " + JSON.stringify(onlyFacts));
        var recordMap = {};
        var domainsMap = {};
        var matchedwordMap = {};
        var matchedCategoryMap = {};
        // look for all records
        onlyFacts.forEach(oSentence => oSentence.forEach(oWord => {
            increment(matchedwordMap, oWord.matchedString);
            increment(matchedCategoryMap, oWord.category);
        }));
        // we have:
        // a list of categories,
        // a list of matchedWords  ->
        //
        var categories = sortedKeys(matchedCategoryMap);
        categories.sort();
        var matchedwords = sortedKeys(matchedwordMap);
        debuglog(() => "matchedwords: " + JSON.stringify(matchedwords));
        debuglog(() => "categories: " + JSON.stringify(categories));
        //var allMatchedWords = { [key : string] : number };
        var domainRecordCount = {};
        var domainMatchCatCount = {};
        var filteredDomains = theModel.domains.filter((domain) => ((!filterdomain) || domain === filterdomain));
        // we prepare the following structure
        //
        // {domain} : recordcount;
        // {matchedwords} :
        // {domain} {matchedword} {category} presencecount
        return global.Promise.all(filteredDomains.map((domain) => {
            if (!filterdomain || domain === filterdomain) {
                return index_model_1.Model.getExpandedRecordsFull(theModel, domain).then(records => {
                    domainRecordCount[domain] = records.length;
                    records.map((record) => {
                        // domainRecordCount[record._domain] = (domainRecordCount[record._domain] || 0) + 1;
                        matchedwords.forEach(matchedword => {
                            categories.forEach(category => {
                                if (record[category] === matchedword) {
                                    var md = domainMatchCatCount[domain] = domainMatchCatCount[domain] || {};
                                    var mdc = md[matchedword] = md[matchedword] || {};
                                    increment(mdc, category);
                                }
                            });
                        });
                    });
                });
            }
            else {
                return index_model_1.Model.getExpandedRecordsFull(theModel, domain).then(records => {
                    domainRecordCount[domain] = records.length;
                    records.map((record) => {
                        // domainRecordCount[record._domain] = (domainRecordCount[record._domain] || 0) + 1;
                        matchedwords.forEach(matchedword => {
                            categories.forEach(category => {
                                if (record[category] === matchedword) {
                                    var md = domainMatchCatCount[domain] = domainMatchCatCount[domain] || {};
                                    var mdc = md[matchedword] = md[matchedword] || {};
                                    increment(mdc, category);
                                }
                            });
                        });
                    });
                });
            }
        })).then((a) => {
            debuglog(() => 'terminal processing ' + res);
            debuglog(() => JSON.stringify(domainMatchCatCount, undefined, 2));
            debuglog(() => JSON.stringify(domainRecordCount, undefined, 2));
            var domains = sortedKeys(domainMatchCatCount);
            var resNext = '"' + fact + '" has a meaning in ';
            var single = false;
            if (Object.keys(domainMatchCatCount).length > 1) {
                resNext += '' + domains.length +
                    ' domains: ' + Utils.listToQuotedCommaAnd(domains) + "";
            }
            else if (domains.length === 1) {
                if (!filterdomain) {
                    resNext += `one `;
                }
                resNext += `domain "${domains[0]}":`;
                single = true;
            }
            else {
                if (res) {
                    return res;
                }
                var factclean = Utils.stripQuotes(fact);
                if (filterdomain) {
                    return `"${factclean}" is no known fact in domain "${filterdomain}".\n`;
                }
                return `I don't know anything about "${factclean}".\n`;
            }
            res += resNext + "\n"; // ...\n";
            domains.forEach(function (domain) {
                var md = domainMatchCatCount[domain];
                Object.keys(md).forEach(matchedstring => {
                    var mdc = md[matchedstring];
                    if (!single) {
                        res += 'in domain "' + domain + '" ';
                    }
                    var catsingle = Object.keys(mdc).length === 1;
                    res += `${sloppyOrExact(matchedstring, fact, theModel)} `;
                    if (!catsingle) {
                        res += `...\n`;
                    }
                    Object.keys(mdc).forEach(category => {
                        debuglog(() => ` percent : ${mdc[category]} of ${domainRecordCount[domain]} `);
                        var percent = toPercent(mdc[category], domainRecordCount[domain]);
                        res += `is a value for category "${category}" present in ${mdc[category]}(${percent}%) of records;\n`;
                    });
                });
            });
            return res;
        });
    });
}
exports.describeFactInDomain = describeFactInDomain;
function describeCategory(category, filterDomain, model, message) {
    var doms = index_model_1.Model.getDomainsForCategory(model, category);
    function getPromiseArr() {
        var res = [];
        if (filterDomain) {
            if (doms.indexOf(filterDomain) >= 0) {
                res.push(describeCategoryInDomain(category, filterDomain, model));
                return res;
            }
            else {
                return [];
            }
        }
        doms.sort();
        doms.forEach(function (domain) {
            res.push(describeCategoryInDomain(category, domain, model));
        });
        return res;
    }
    var resPromiseArr = getPromiseArr();
    return global.Promise.all(resPromiseArr).then((resArr) => resArr);
}
exports.describeCategory = describeCategory;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tYXRjaC9kZXNjcmliZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7R0FPRzs7O0FBR0gsaUNBQWlDO0FBQ2pDLGdDQUFnQztBQUVoQyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDbkMsMENBQTBDO0FBQzFDLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDekMsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBTTJCLENBQUM7QUFFeEQsa0RBQStDO0FBQUEsQ0FBQztBQUdoRCxtQ0FBbUM7QUFHbkMsc0RBQWlFO0FBR2pFLG1DQUFtQztBQUduQyxvQ0FBb0M7QUFHcEMsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBRWhCLFNBQWdCLFlBQVksQ0FBQyxTQUFrQixFQUFFLFVBQW1CLEVBQUUsUUFBd0I7SUFDNUYsMkJBQTJCO0lBQzNCLE9BQU8sVUFBVSxLQUFLLE1BQU0sSUFBSSxTQUFTLEtBQUssY0FBYyxDQUFDO0FBQy9ELENBQUM7QUFIRCxvQ0FHQztBQUVELFNBQWdCLGFBQWEsQ0FBQyxTQUFrQixFQUFFLFVBQW1CLEVBQUUsUUFBd0I7SUFDN0YsSUFBRyxTQUFTLENBQUMsV0FBVyxFQUFFLEtBQUssVUFBVSxDQUFDLFdBQVcsRUFBRSxFQUFFO1FBQ3ZELE9BQU8sR0FBRyxHQUFHLFVBQVUsR0FBRyxHQUFHLENBQUM7S0FDL0I7SUFDRCwyQkFBMkI7SUFDM0IsZUFBZTtJQUNmLEVBQUU7SUFDRixJQUFHLFlBQVksQ0FBQyxTQUFTLEVBQUMsVUFBVSxFQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ2xELE9BQU8sR0FBRyxHQUFHLFVBQVUsR0FBRyxpQ0FBaUMsR0FBRyxTQUFTLEdBQUUsSUFBSSxDQUFDO0tBQzNFO0lBQ0QsOEJBQThCO0lBQzlCLDBCQUEwQjtJQUMxQixPQUFPLEdBQUcsR0FBRyxVQUFVLEdB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d0IsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDbEUsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLEdBQUcsQ0FBQztJQUNYLENBQUM7SUFDRCxJQUFJLGFBQWEsR0FBRyxhQUFhLEVBQUUsQ0FBQztJQUNwQyxPQUFRLE1BQU0sQ0FBQyxPQUFlLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDaEYsQ0FBQztBQXJCRCw0Q0FxQkMiLCJmaWxlIjoibWF0Y2gvZGVzY3JpYmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBAbW9kdWxlIGpmc2ViLmZkZXZzdGFydC5leHBsYWluXG4gKiBAZmlsZSBleHBsYWluLnRzXG4gKiBAY29weXJpZ2h0IChjKSAyMDE2IEdlcmQgRm9yc3RtYW5uXG4gKlxuICogRnVuY3Rpb25zIGRlYWxpbmcgd2l0aCBleHBsYWluaW5nIGZhY3RzLCBjYXRlZ29yaWVzIGV0Yy5cbiAqL1xuXG5cbmltcG9ydCAqIGFzIEFsZ29sIGZyb20gJy4vYWxnb2wnO1xuaW1wb3J0ICogYXMgZGVidWcgZnJvbSAnZGVidWdmJztcblxuY29uc3QgZGVidWdsb2cgPSBkZWJ1ZygnZGVzY3JpYmUnKTtcbmltcG9ydCAqIGFzIGxvZ2dlciBmcm9tICcuLi91dGlscy9sb2dnZXInO1xudmFyIGxvZ1BlcmYgPSBsb2dnZXIucGVyZihcInBlcmZsaXN0YWxsXCIpO1xudmFyIHBlcmZsb2cgPSBkZWJ1ZygncGVyZicpO1xuLy9jb25zdCBwZXJmbG9nID0gbG9nZ2VyLnBlcmYoXCJwZXJmbGlzdGFsbFwiKTtcblxuXG4vL2ltcG9ydCAqIGFzIFRvb2xtYXRjaGVyIGZyb20gJy4vdG9vbG1hdGNoZXInO1xuXG5pbXBvcnQgeyBTZW50ZW5jZSBhcyBTZW50ZW5jZSB9IGZyb20gJy4uL2luZGV4X3BhcnNlcic7O1xuXG5pbXBvcnQgeyBXb3JkIGFzIFdvcmQgfSBmcm9tICcuLi9pbmRleF9wYXJzZXInOztcbmltcG9ydCAqIGFzIE9wZXJhdG9yIGZyb20gJy4vb3BlcmF0b3InO1xuXG5pbXBvcnQgKiBhcyBXaGF0SXMgZnJvbSAnLi93aGF0aXMnO1xuXG5pbXBvcnQgKiBhcyBJTWF0Y2ggZnJvbSAnLi9pZm1hdGNoJztcbmltcG9ydCB7IE1vZGVsLCBJRk1vZGVsLCBCcmVha0Rvd24gfSBmcm9tICcuLi9tb2RlbC9pbmRleF9tb2RlbCc7XG5cblxuLy9pbXBvcnQgKiBhcyBNYXRjaCBmcm9tICcuL21hdGNoJztcblxuXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICdhYm90X3V0aWxzJztcblxuXG52YXIgc1dvcmRzID0ge307XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1N5bm9ueW1Gb3IoZXhhY3RXb3JkIDogc3RyaW5nLCBzbG9wcHlXb3JkIDogc3RyaW5nLCB0aGVNb2RlbDogSU1hdGNoLklNb2RlbHMpIDogYm9vbGVhbiB7XG4gIC8vIFRPRE86IHVzZSBtb2RlbCBzeW5vbnltc1xuICByZXR1cm4gc2xvcHB5V29yZCA9PT0gXCJuYW1lXCIgJiYgZXhhY3RXb3JkID09PSBcImVsZW1lbnQgbmFtZVwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2xvcHB5T3JFeGFjdChleGFjdFdvcmQgOiBzdHJpbmcsIHNsb3BweVdvcmQgOiBzdHJpbmcsIHRoZU1vZGVsOiBJTWF0Y2guSU1vZGVscykge1xuICBpZihleGFjdFdvcmQudG9Mb3dlckNhc2UoKSA9PT0gc2xvcHB5V29yZC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgcmV0dXJuICdcIicgKyBzbG9wcHlXb3JkICsgJ1wiJztcbiAgfVxuICAvLyBUT0RPLCBmaW5kIHBsdXJhbCBzIGV0Yy5cbiAgLy8gc3RpbGwgZXhhY3QsXG4gIC8vXG4gIGlmKGlzU3lub255bUZvcihleGFjdFdvcmQsc2xvcHB5V29yZCx0aGVNb2RlbCkpIHtcbnJldHVybiAnXCInICsgc2xvcHB5V29yZCArICdcIiAoaW50ZXJwcmV0ZWQgYXMgc3lub255bSBmb3IgXCInICsgZXhhY3RXb3JkICsnXCIpJztcbiAgfVxuICAvL3RvZG8sIGZpbmQgaXMgc3lub255bWZvciAuLi5cbiAgLy8gVE9ETywgYSBzeW5vbnltIGZvciAuLi5cbiAgcmV0dXJuICdcIicgKyBzbG9wcHlXb3JkICsgJ1wiIChpbnRlcnByZXRlZCBhcyBcIicgKyBleGFjdFdvcmQgKydcIiknO1xufVxuXG5pbnRlcmZhY2UgSURlc2NyaWJlQ2F0ZWdvcnkge1xuICAgIHRvdGFscmVjb3JkcyA6IG51bWJlcixcbiAgICBwcmVzZW50cmVjb3JkcyA6IG51bWJlcixcbiAgICB2YWx1ZXMgOiB7IFtrZXkgOiBzdHJpbmddIDogbnVtYmVyfSxcbiAgICBtdWx0aXZhbHVlZCA6IGJvb2xlYW5cbiAgfVxuLypcbmV4cG9ydCBmdW5jdGlvbiBjb3VudFJlY29yZFByZXNlbmNlT0xEKGNhdGVnb3J5IDogc3RyaW5nLCBkb21haW4gOiBzdHJpbmcsIHRoZU1vZGVsIDogSU1hdGNoLklNb2RlbHMpIDogSURlc2NyaWJlQ2F0ZWdvcnkge1xuICB2YXIgcmVzID0geyB0b3RhbHJlY29yZHMgOiAwLFxuICAgIHByZXNlbnRyZWNvcmRzIDogMCxcbiAgICB2YWx1ZXMgOiB7IH0sICAvLyBhbiB0aGVpciBmcmVxdWVuY3lcbiAgICBtdWx0aXZhbHVlZCA6IGZhbHNlXG4gIH0gYXMgSURlc2NyaWJlQ2F0ZWdvcnk7XG4gIHRoZU1vZGVsLnJlY29yZHMuZm9yRWFjaChmdW5jdGlvbihyZWNvcmQpIHtcbiAgICAvL2RlYnVnbG9nKEpTT04uc3RyaW5naWZ5KHJlY29yZCx1bmRlZmluZWQsMikpO1xuICAgIGlmKHJlY29yZC5fZG9tYWluICE9PSBkb21haW4pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmVzLnRvdGFscmVjb3JkcysrO1xuICAgIHZhciB2YWwgPSByZWNvcmRbY2F0ZWdvcnldO1xuICAgIHZhciB2YWxhcnIgPSBbdmFsXTtcbiAgICBpZihBcnJheS5pc0FycmF5KHZhbCkpIHtcbiAgICAgIHJlcy5tdWx0aXZhbHVlZCA9IHRydWU7XG4gICAgICB2YWxhcnIgPSB2YWw7XG4gICAgfVxuICAgIC8vIHRvZG8gd3JhcCBhcnJcbiAgICBpZih2YWwgIT09IHVuZGVmaW5lZCAmJiB2YWwgIT09IFwibi9hXCIpIHtcbiAgICAgIHJlcy5wcmVzZW50cmVjb3JkcyArKztcbiAgICB9XG4gICAgdmFsYXJyLmZvckVhY2goZnVuY3Rpb24odmFsKSB7XG4gICAgICByZXMudmFsdWVzW3ZhbF0gPSAocmVzLnZhbHVlc1t2YWxdIHx8IDApICsgMTtcbiAgICB9KVxuICB9KVxuICByZXR1cm4gcmVzO1xufVxuKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGNvdW50UmVjb3JkUHJlc2VuY2UoY2F0ZWdvcnkgOiBzdHJpbmcsIGRvbWFpbiA6IHN0cmluZywgdGhlTW9kZWwgOiBJTWF0Y2guSU1vZGVscykgOiBQcm9taXNlPElEZXNjcmliZUNhdGVnb3J5PiB7XG4gIHZhciByZXMgPSB7IHRvdGFscmVjb3JkcyA6IDAsXG4gICAgcHJlc2VudHJlY29yZHMgOiAwLFxuICAgIHZhbHVlcyA6IHsgfSwgLy8gW2tleSA6IHN0cmluZ10gOiBudW1iZXIgfSwgIC8vIGFuZCB0aGVpciBmcmVxdWVuY3lcbiAgICBtdWx0aXZhbHVlZCA6IGZhbHNlXG4gIH0gYXMgSURlc2NyaWJlQ2F0ZWdvcnk7XG5cbiAgcmV0dXJuIE1vZGVsLmdldEV4cGFuZGVkUmVjb3Jkc0ZvckNhdGVnb3J5KHRoZU1vZGVsLGRvbWFpbixjYXRlZ29yeSkudGhlbihyZWNvcmRzID0+e1xuICAgICAgcmVzLnRvdGFscmVjb3JkcyA9IHJlY29yZHMubGVuZ3RoO1xuICAgICAgcmVjb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uKHJlY29yZCkge1xuICAgICAgICAvL2RlYnVnbG9nKEpTT04uc3RyaW5naWZ5KHJlY29yZCx1bmRlZmluZWQsMikpO1xuICAgICAgICAvKmlmKHJlY29yZC5fZG9tYWluICE9PSBkb21haW4pIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0qL1xuICAgICAgICB2YXIgdmFsID0gcmVjb3JkW2NhdGVnb3J5XTtcbiAgICAgICAgdmFyIHZhbGFyciA9IFt2YWxdO1xuICAgICAgICBpZihBcnJheS5pc0FycmF5KHZhbCkpIHtcbiAgICAgICAgICByZXMubXVsdGl2YWx1ZWQgPSB0cnVlO1xuICAgICAgICAgIHZhbGFyciA9IHZhbDtcbiAgICAgICAgfVxuICAgICAgICAvLyB0b2RvIHdyYXAgYXJyXG4gICAgICAgIGlmKHZhbCAhPT0gdW5kZWZpbmVkICYmIHZhbCAhPT0gXCJuL2FcIikge1xuICAgICAgICAgIHJlcy5wcmVzZW50cmVjb3JkcyArKztcbiAgICAgICAgfVxuICAgICAgICB2YWxhcnIuZm9yRWFjaChmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICByZXMudmFsdWVzW3ZhbF0gPSAocmVzLnZhbHVlc1t2YWxdIHx8IDApICsgMTtcbiAgICAgICAgfSlcbiAgICAgIH0pO1xuICAgIH0pLnRoZW4oICgpID0+IHJlcyApO1xufVxuXG5pbnRlcmZhY2UgSURlc2NyaWJlRmFjdCB7XG4gICAgdG90YWxyZWNvcmRzIDogbnVtYmVyLFxuICAgIHByZXNlbnRyZWNvcmRzIDogbnVtYmVyLFxuICAgIG11bHRpdmFsdWVkIDogYm9vbGVhblxuICB9XG5cbi8qXG5leHBvcnQgZnVuY3Rpb24gY291bnRSZWNvcmRQcmVzZW5jZUZhY3QoZmFjdCA6IHN0cmluZywgY2F0ZWdvcnkgOiBzdHJpbmcsIGRvbWFpbiA6IHN0cmluZywgdGhlTW9kZWwgOiBJTWF0Y2guSU1vZGVscykgOiBQcm9taXNlPElEZXNjcmliZUZhY3Q+IHtcbiAgdmFyIHJlcyA9IHsgdG90YWxyZWNvcmRzIDogMCxcbiAgICBwcmVzZW50cmVjb3JkcyA6IDAsXG4gICAgdmFsdWVzIDogeyB9LCAgLy8gYW4gdGhlaXIgZnJlcXVlbmN5XG4gICAgbXVsdGl2YWx1ZWQgOiBmYWxzZVxuICB9IGFzIElEZXNjcmliZUNhdGVnb3J5O1xuICByZXR1cm4gTW9kZWwuZ2V0RXhwYW5kZWRSZWNvcmRzRm9yQ2F0ZWdvcnkodGhlTW9kZWwsZG9tYWluLGNhdGVnb3J5KS50aGVuKHJlY29yZHMgPT57XG4gICAgcmVzLnRvdGFscmVjb3JkcyA9IHJlY29yZHMubGVuZ3RoO1xuICAgIHJlY29yZHMuZm9yRWFjaCgocmVjb3JkKSA9PntcbiAgICAgIHJlcy50b3RhbHJlY29yZHMrKztcbiAgICAgIHZhciB2YWwgPSByZWNvcmRbY2F0ZWdvcnldO1xuICAgICAgdmFyIHZhbGFyciA9IFt2YWxdO1xuICAgICAgaWYoQXJyYXkuaXNBcnJheSh2YWwpKSB7XG4gICAgICAgIGlmKHZhbC5pbmRleE9mKGZhY3QpID49IDApIHtcbiAgICAgICAgICByZXMubXVsdGl2YWx1ZWQgPSB0cnVlO1xuICAgICAgICAgIHZhbGFyciA9IHZhbDtcbiAgICAgICAgICByZXMucHJlc2VudHJlY29yZHMrKztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh2YWwgPT09IGZhY3QpIHtcbiAgICAgICAgICByZXMucHJlc2VudHJlY29yZHMrKztcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzO1xuICB9KTtcbn1cbiovXG5cbi8qXG5leHBvcnQgZnVuY3Rpb24gY291bnRSZWNvcmRQcmVzZW5jZUZhY3RPbGQoZmFjdCA6IHN0cmluZywgY2F0ZWdvcnkgOiBzdHJpbmcsIGRvbWFpbiA6IHN0cmluZywgdGhlTW9kZWwgOiBJTWF0Y2guSU1vZGVscykgOiBJRGVzY3JpYmVGYWN0IHtcbiAgdmFyIHJlcyA9IHsgdG90YWxyZWNvcmRzIDogMCxcbiAgICBwcmVzZW50cmVjb3JkcyA6IDAsXG4gICAgdmFsdWVzIDogeyB9LCAgLy8gYW4gdGhlaXIgZnJlcXVlbmN5XG4gICAgbXVsdGl2YWx1ZWQgOiBmYWxzZVxuICB9IGFzIElEZXNjcmliZUNhdGVnb3J5O1xuXG5cbiAgdGhlTW9kZWwucmVjb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uKHJlY29yZCkge1xuICAgIC8vZGVidWdsb2coSlNPTi5zdHJpbmdpZnkocmVjb3JkLHVuZGVmaW5lZCwyKSk7XG4gICAgaWYocmVjb3JkLl9kb21haW4gIT09IGRvbWFpbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXMudG90YWxyZWNvcmRzKys7XG4gICAgdmFyIHZhbCA9IHJlY29yZFtjYXRlZ29yeV07XG4gICAgdmFyIHZhbGFyciA9IFt2YWxdO1xuICAgIGlmKEFycmF5LmlzQXJyYXkodmFsKSkge1xuICAgICAgaWYodmFsLmluZGV4T2YoZmFjdCkgPj0gMCkge1xuICAgICAgICByZXMubXVsdGl2YWx1ZWQgPSB0cnVlO1xuICAgICAgICB2YWxhcnIgPSB2YWw7XG4gICAgICAgIHJlcy5wcmVzZW50cmVjb3JkcysrO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodmFsID09PSBmYWN0KSB7XG4gICAgICAgIHJlcy5wcmVzZW50cmVjb3JkcysrO1xuICAgIH1cbiAgfSlcbiAgcmV0dXJuIHJlcztcbn1cbiovXG5cbmV4cG9ydCBmdW5jdGlvbiBtYWtlVmFsdWVzTGlzdFN0cmluZyhyZWFsdmFsdWVzOiBzdHJpbmdbXSkgOiBzdHJpbmcge1xuICB2YXIgdmFsdWVzU3RyaW5nID0gXCJcIjtcbiAgdmFyIHRvdGFsbGVuID0gMDtcbiAgdmFyIGxpc3RWYWx1ZXMgPSByZWFsdmFsdWVzLmZpbHRlcihmdW5jdGlvbih2YWwsIGluZGV4KSB7XG4gICAgdG90YWxsZW4gPSB0b3RhbGxlbiArIHZhbC5sZW5ndGg7XG4gIHJldHVybiAoaW5kZXggPCBBbGdvbC5EZXNjcmliZVZhbHVlTGlzdE1pbkNvdW50VmFsdWVMaXN0KSB8fCAodG90YWxsZW4gPCBBbGdvbC5EZXNjcmliZVZhbHVlTGlzdExlbmd0aENoYXJMaW1pdCk7XG4gIH0pO1xuICBpZihsaXN0VmFsdWVzLmxlbmd0aCA9PT0gMSAmJiByZWFsdmFsdWVzLmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiAnVGhlIHNvbGUgdmFsdWUgaXMgXFxcIicgKyBsaXN0VmFsdWVzWzBdICsgJ1wiJztcbiAgfVxuICB2YXIgbWF4bGVuID0gbGlzdFZhbHVlcy5yZWR1Y2UoIChwcmV2LHZhbCkgPT4gTWF0aC5tYXgocHJldix2YWwubGVuZ3RoKSwwKTtcbiAgaWYobWF4bGVuID4gMzApIHtcbiAgICByZXR1cm4gXCJQb3NzaWJsZSB2YWx1ZXMgYXJlIC4uLlxcblwiICtcbiAgICAgIGxpc3RWYWx1ZXMucmVkdWNlKCAocHJldix2YWwsaW5kZXgpID0+IChwcmV2ICsgXCIoXCIgKyAoaW5kZXggKyAxKSArICcpOiBcIicgKyB2YWwgKyAnXCJcXG4nXG4gICAgICApLFwiXCIpXG4gICAgICArICggbGlzdFZhbHVlcy5sZW5ndGggPT09IHJlYWx2YWx1ZXMubGVuZ3RoID8gXCJcIiA6IFwiLi4uXCIpO1xuICB9XG4gIHZhciBsaXN0ID0gXCJcIjtcbiAgaWYobGlzdFZhbHVlcy5sZW5ndGggPT09IHJlYWx2YWx1ZXMubGVuZ3RoKSB7XG4gICAgbGlzdCA9IFV0aWxzLmxpc3RUb1F1b3RlZENvbW1hT3IobGlzdFZhbHVlcyk7XG4gIH0gZWxzZSB7XG4gICAgbGlzdCA9ICdcIicgKyBsaXN0VmFsdWVzLmpvaW4oJ1wiLCBcIicpICsgJ1wiJztcbiAgfVxuICByZXR1cm4gXCJQb3NzaWJsZSB2YWx1ZXMgYXJlIC4uLlxcblwiXG4gICAgKyBsaXN0XG4gICAgKyAoIGxpc3RWYWx1ZXMubGVuZ3RoID09PSByZWFsdmFsdWVzLmxlbmd0aCA/IFwiXCIgOiBcIiAuLi5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b1BlcmNlbnQoYSA6IG51bWJlciwgYjogbnVtYmVyKSA6IHN0cmluZyB7XG4gIHJldHVybiBcIlwiICsgKDEwMCogYSAvIGIpLnRvRml4ZWQoMSk7XG59XG5cblxuZXhwb3J0IGludGVyZmFjZSBJQ2F0ZWdvcnlTdGF0cyB7XG4gIGNhdGVnb3J5RGVzYyA6IElGTW9kZWwuSUNhdGVnb3J5RGVzYyxcbiAgcHJlc2VudFJlY29yZHMgOiBudW1iZXIsXG4gIGRpc3RpbmN0IDogc3RyaW5nLFxuICBkZWx0YSA6IHN0cmluZyxcbiAgcGVyY1ByZXNlbnQgOiBzdHJpbmcsXG4gIHNhbXBsZVZhbHVlcyA6IHN0cmluZyxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDYXRlZ29yeVN0YXRzSW5Eb21haW4oY2F0ZWdvcnkgOiBzdHJpbmcsIGZpbHRlcmRvbWFpbiA6IHN0cmluZywgdGhlTW9kZWw6IElNYXRjaC5JTW9kZWxzKSA6IFByb21pc2U8SUNhdGVnb3J5U3RhdHM+IHtcbiAgcmV0dXJuIGNvdW50UmVjb3JkUHJlc2VuY2UoY2F0ZWdvcnksIGZpbHRlcmRvbWFpbiwgdGhlTW9kZWwpLnRoZW4oXG4gICAgKHJlY29yZENvdW50KSA9PiB7XG4gICAgICAvL2RlYnVnbG9nKEpTT04uc3RyaW5naWZ5KHRoZU1vZGVsLnJlY29yZHMuZmlsdGVyKGEgPT4gYS5fZG9tYWluID09PSBcIkNvc21vc1wiKSx1bmRlZmluZWQsMikpO1xuICAgICAgY29uc3QgcGVyY2VudCA9IHRvUGVyY2VudChyZWNvcmRDb3VudC5wcmVzZW50cmVjb3JkcyAsIHJlY29yZENvdW50LnRvdGFscmVjb3Jkcyk7XG4gICAgICBkZWJ1Z2xvZyhKU09OLnN0cmluZ2lmeShyZWNvcmRDb3VudC52YWx1ZXMpKTtcbiAgICAgIHZhciBhbGxWYWx1ZXMgPU9iamVjdC5rZXlzKHJlY29yZENvdW50LnZhbHVlcyk7XG4gICAgICB2YXIgcmVhbHZhbHVlcyA9IGFsbFZhbHVlcy5maWx0ZXIodmFsdWUgPT4gKHZhbHVlICE9PSAndW5kZWZpbmVkJykgJiYgKHZhbHVlICE9PSAnbi9hJykpO1xuICAgICAgZGVidWdsb2dcbiAgICAgIHJlYWx2YWx1ZXMuc29ydCgpO1xuICAgICAgdmFyIHVuZGVmTmFEZWx0YSA9ICAoYWxsVmFsdWVzLmxlbmd0aCAtIHJlYWx2YWx1ZXMubGVuZ3RoKTtcbiAgICAgIHZhciBkZWx0YSA9ICAodW5kZWZOYURlbHRhKSA/ICBcIigrXCIgKyB1bmRlZk5hRGVsdGEgKyBcIilcIiA6IFwiXCI7XG4gICAgICBjb25zdCBkaXN0aW5jdCA9ICcnICsgcmVhbHZhbHVlcy5sZW5ndGg7XG4gICAgICBjb25zdCB2YWx1ZXNMaXN0ID0gbWFrZVZhbHVlc0xpc3RTdHJpbmcocmVhbHZhbHVlcyk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjYXRlZ29yeURlc2MgOiB0aGVNb2RlbC5mdWxsLmRvbWFpbltmaWx0ZXJkb21haW5dLmNhdGVnb3JpZXNbY2F0ZWdvcnldLFxuICAgICAgICBkaXN0aW5jdCA6IGRpc3RpbmN0LFxuICAgICAgICBkZWx0YSA6IGRlbHRhLFxuICAgICAgICBwcmVzZW50UmVjb3JkcyA6IHJlY29yZENvdW50LnByZXNlbnRyZWNvcmRzLFxuICAgICAgICBwZXJjUHJlc2VudCA6IHBlcmNlbnQsXG4gICAgICAgIHNhbXBsZVZhbHVlcyA6IHZhbHVlc0xpc3RcbiAgICAgIH07XG4gICAgfVxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVzY3JpYmVDYXRlZ29yeUluRG9tYWluKGNhdGVnb3J5IDogc3RyaW5nLCBmaWx0ZXJkb21haW4gOiBzdHJpbmcsIHRoZU1vZGVsOiBJTWF0Y2guSU1vZGVscykgOiBQcm9taXNlPHN0cmluZz4ge1xuLyogIGNvbnN0IHJlY29yZENvdW50ID0gY291bnRSZWNvcmRQcmVzZW5jZShjYXRlZ29yeSwgZmlsdGVyZG9tYWluLCB0aGVNb2RlbCk7XG4gIGRlYnVnbG9nKEpTT04uc3RyaW5naWZ5KHRoZU1vZGVsLnJlY29yZHMuZmlsdGVyKGEgPT4gYS5fZG9tYWluID09PSBcIkNvc21vc1wiKSx1bmRlZmluZWQsMikpO1xuICBjb25zdCBwZXJjZW50ID0gdG9QZXJjZW50KHJlY29yZENvdW50LnByZXNlbnRyZWNvcmRzICwgcmVjb3JkQ291bnQudG90YWxyZWNvcmRzKTtcbiAgZGVidWdsb2coSlNPTi5zdHJpbmdpZnkocmVjb3JkQ291bnQudmFsdWVzKSk7XG4gIHZhciBhbGxWYWx1ZXMgPU9iamVjdC5rZXlzKHJlY29yZENvdW50LnZhbHVlcyk7XG4gIHZhciByZWFsdmFsdWVzID0gYWxsVmFsdWVzLmZpbHRlcih2YWx1ZSA9PiAodmFsdWUgIT09ICd1bmRlZmluZWQnKSAmJiAodmFsdWUgIT09ICduL2EnKSk7XG4gIGRlYnVnbG9nXG4gIHJlYWx2YWx1ZXMuc29ydCgpO1xuICB2YXIgdW5kZWZOYURlbHRhID0gIChhbGxWYWx1ZXMubGVuZ3RoIC0gcmVhbHZhbHVlcy5sZW5ndGgpO1xuICB2YXIgZGVsdGEgPSAgKHVuZGVmTmFEZWx0YSkgPyAgXCIoK1wiICsgdW5kZWZOYURlbHRhICsgXCIpXCIgOiBcIlwiO1xuICBjb25zdCBkaXN0aW5jdCA9ICcnICsgcmVhbHZhbHVlcy5sZW5ndGg7XG5cbiAgY29uc3QgdmFsdWVzTGlzdCA9IG1ha2VWYWx1ZXNMaXN0U3RyaW5nKHJlYWx2YWx1ZXMpO1xuKi9cbiAgcmV0dXJuIGdldENhdGVnb3J5U3RhdHNJbkRvbWFpbihjYXRlZ29yeSxmaWx0ZXJkb21haW4sdGhlTW9kZWwpLnRoZW4oIChzdGF0cykgPT4ge1xuICAgIHZhciByZXMgPSAnaXMgYSBjYXRlZ29yeSBpbiBkb21haW4gXCInICsgZmlsdGVyZG9tYWluICsgJ1wiXFxuJ1xuICAgICsgYEl0IGlzIHByZXNlbnQgaW4gJHtzdGF0cy5wcmVzZW50UmVjb3Jkc30gKCR7c3RhdHMucGVyY1ByZXNlbnR9JSkgb2YgcmVjb3JkcyBpbiB0aGlzIGRvbWFpbixcXG5gICtcbiAgICBgaGF2aW5nICR7c3RhdHMuZGlzdGluY3QgKyAnJ30ke3N0YXRzLmRlbHRhfSBkaXN0aW5jdCB2YWx1ZXMuXFxuYFxuICAgICsgc3RhdHMuc2FtcGxlVmFsdWVzO1xuXG4gICAgdmFyIGRlc2MgPSB0aGVNb2RlbC5mdWxsLmRvbWFpbltmaWx0ZXJkb21haW5dLmNhdGVnb3JpZXNbY2F0ZWdvcnldIHx8IHt9IGFzIElGTW9kZWwuSUNhdGVnb3J5RGVzYztcbiAgICB2YXIgZGVzY3JpcHRpb24gPSBkZXNjLmNhdGVnb3J5X2Rlc2NyaXB0aW9uIHx8IFwiXCI7XG4gICAgaWYgKGRlc2NyaXB0aW9uKSB7XG4gICAgICByZXMgKz0gYFxcbkRlc2NyaXB0aW9uOiAke2Rlc2NyaXB0aW9ufWA7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZFJlY29yZHNXaXRoRmFjdChtYXRjaGVkU3RyaW5nOiBzdHJpbmcsIGNhdGVnb3J5IDogc3RyaW5nLCByZWNvcmRzIDogYW55LCBkb21haW5zIDogeyBba2V5IDogc3RyaW5nXSA6IG51bWJlcn0pIDogYW55W10ge1xuICByZXR1cm4gcmVjb3Jkcy5maWx0ZXIoZnVuY3Rpb24ocmVjb3JkKSAge1xuXG4gICAgbGV0IHJlcyA9IChyZWNvcmRbY2F0ZWdvcnldID09PSBtYXRjaGVkU3RyaW5nKTtcbiAgICBpZiggcmVzKSB7XG4gICAgICBpbmNyZW1lbnQoZG9tYWlucyxyZWNvcmRzLl9kb21haW4pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluY3JlbWVudChtYXAgOiB7W2tleTogc3RyaW5nXSA6IG51bWJlcn0sIGtleSA6IHN0cmluZykge1xuICBtYXBba2V5XSA9IChtYXBba2V5XSB8fCAwKSArIDE7XG59XG5cbmZ1bmN0aW9uIHNvcnRlZEtleXM8VD4obWFwIDoge1trZXkgOiBzdHJpbmddIDogVH0pIDogc3RyaW5nW10ge1xuICB2YXIgciA9IE9iamVjdC5rZXlzKG1hcCk7XG4gIHIuc29ydCgpO1xuICByZXR1cm4gcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlc2NyaWJlRG9tYWluKGZhY3QgOiBzdHJpbmcsIGRvbWFpbjogc3RyaW5nLCB0aGVNb2RlbDogSU1hdGNoLklNb2RlbHMpIDogUHJvbWlzZTxzdHJpbmc+IHtcblxuICByZXR1cm4gTW9kZWwuZ2V0RXhwYW5kZWRSZWNvcmRzRm9yQ2F0ZWdvcnkodGhlTW9kZWwsZG9tYWluLCBNb2RlbC5nZXRDYXRlZ29yaWVzRm9yRG9tYWluKHRoZU1vZGVsLGRvbWFpbilbMF0pLnRoZW4oXG4gICAgKHJlY29yZHMpID0+e1xuICAgIHZhciBjb3VudCA9IHJlY29yZHMubGVuZ3RoO1xuICAgIHZhciBjYXRjb3VudCA9IE1vZGVsLmdldENhdGVnb3JpZXNGb3JEb21haW4odGhlTW9kZWwsIGRvbWFpbikubGVuZ3RoO1xuICAgIHZhciByZXMgPSBzbG9wcHlPckV4YWN0KGRvbWFpbiwgZmFjdCwgdGhlTW9kZWwpICsgYGlzIGEgZG9tYWluIHdpdGggJHtjYXRjb3VudH0gY2F0ZWdvcmllcyBhbmQgJHtjb3VudH0gcmVjb3Jkc1xcbmA7XG4gICAgdmFyIGRlc2MgPSB0aGVNb2RlbC5mdWxsLmRvbWFpbltkb21haW5dLmRlc2NyaXB0aW9uIHx8IFwiXCI7XG4gICAgaWYoZGVzYykge1xuICAgICAgcmVzICs9IGBEZXNjcmlwdGlvbjpgICsgZGVzYyArIGBcXG5gO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9KTtcbn1cbi8qXG5leHBvcnQgZnVuY3Rpb24gZGVzY3JpYmVGYWN0SW5Eb21haW5PbGQoZmFjdCA6IHN0cmluZywgZmlsdGVyZG9tYWluIDogc3RyaW5nLCB0aGVNb2RlbDogSU1hdGNoLklNb2RlbHMpIDogc3RyaW5nIHtcbiAgdmFyIHNlbnRlbmNlcyA9IFdoYXRJcy5hbmFseXplQ29udGV4dFN0cmluZyhmYWN0LCAgdGhlTW9kZWwucnVsZXMpO1xuICAvL2NvbnNvbGUubG9nKFwiaGVyZSBzZW50ZW5jZXMgXCIgKyBKU09OLnN0cmluZ2lmeShzZW50ZW5jZXMpKTtcbiAgdmFyIGxlbmd0aE9uZVNlbnRlbmNlcyA9IHNlbnRlbmNlcy5zZW50ZW5jZXMuZmlsdGVyKG9TZW50ZW5jZSA9PiBvU2VudGVuY2UubGVuZ3RoID09PSAxKTtcbiAgdmFyIHJlcyA9ICcnO1xuICAvLyByZW1vdmUgY2F0ZWdvcmllcyBhbmQgZG9tYWluc1xuICB2YXIgb25seUZhY3RzID0gbGVuZ3RoT25lU2VudGVuY2VzLmZpbHRlcihvU2VudGVuY2UgPT57XG4gICAgZGVidWdsb2coSlNPTi5zdHJpbmdpZnkob1NlbnRlbmNlWzBdKSk7XG4gICAgcmV0dXJuICFXb3JkLldvcmQuaXNEb21haW4ob1NlbnRlbmNlWzBdKSAmJlxuICAgICAgICAgICAhV29yZC5Xb3JkLmlzRmlsbGVyKG9TZW50ZW5jZVswXSkgJiYgIVdvcmQuV29yZC5pc0NhdGVnb3J5KG9TZW50ZW5jZVswXSlcbiAgfVxuICApO1xuICB2YXIgb25seURvbWFpbnMgPSBsZW5ndGhPbmVTZW50ZW5jZXMuZmlsdGVyKG9TZW50ZW5jZSA9PntcbiAgICByZXR1cm4gV29yZC5Xb3JkLmlzRG9tYWluKG9TZW50ZW5jZVswXSk7XG4gIH0pO1xuICBpZihvbmx5RG9tYWlucyAmJiBvbmx5RG9tYWlucy5sZW5ndGggPiAwKSB7XG4gICAgZGVidWdsb2coKCk9PkpTT04uc3RyaW5naWZ5KG9ubHlEb21haW5zKSk7XG4gICAgb25seURvbWFpbnMuZm9yRWFjaChmdW5jdGlvbihzZW50ZW5jZSkge1xuICAgICAgdmFyIGRvbWFpbiA9IHNlbnRlbmNlWzBdLm1hdGNoZWRTdHJpbmc7XG4gICAgICBpZiggIWZpbHRlcmRvbWFpbiB8fCBkb21haW4gPT09IGZpbHRlcmRvbWFpbikge1xuICAgICAgICBkZWJ1Z2xvZygoKT0+XCJoZXJlIG1hdGNoIFwiICsgSlNPTi5zdHJpbmdpZnkoc2VudGVuY2UpKTtcbiAgICAgICAgcmVzICs9IGRlc2NyaWJlRG9tYWluKGZhY3QsIHNlbnRlbmNlWzBdLm1hdGNoZWRTdHJpbmcsIHRoZU1vZGVsKTtcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgZGVidWdsb2coXCJvbmx5IGZhY3RzOiBcIiArIEpTT04uc3RyaW5naWZ5KG9ubHlGYWN0cykpO1xuICB2YXIgcmVjb3JkTWFwID0ge307XG4gIHZhciBkb21haW5zTWFwID0ge30gYXMge1trZXk6IHN0cmluZ10gOiBudW1iZXJ9O1xuICB2YXIgbWF0Y2hlZHdvcmRNYXAgPSB7fSBhcyB7W2tleTogc3RyaW5nXSA6IG51bWJlcn07XG4gIHZhciBtYXRjaGVkQ2F0ZWdvcnlNYXAgPSB7fSBhcyB7W2tleTogc3RyaW5nXSA6IG51bWJlcn07XG4gIC8vIGxvb2sgZm9yIGFsbCByZWNvcmRzXG4gIG9ubHlGYWN0cy5mb3JFYWNoKG9TZW50ZW5jZSA9PlxuICAgIG9TZW50ZW5jZS5mb3JFYWNoKG9Xb3JkID0+XG4gICAgICB7XG4gICAgICAgIGluY3JlbWVudChtYXRjaGVkd29yZE1hcCwgb1dvcmQubWF0Y2hlZFN0cmluZyk7XG4gICAgICAgIGluY3JlbWVudChtYXRjaGVkQ2F0ZWdvcnlNYXAsIG9Xb3JkLmNhdGVnb3J5KTtcbiAgICAgIH1cbiAgICApXG4gICk7XG4gIC8vIHdlIGhhdmU6XG4gIC8vIGEgbGlzdCBvZiBjYXRlZ29yaWVzLFxuICAvLyBhIGxpc3Qgb2YgbWF0Y2hlZFdvcmRzICAtPlxuICAvL1xuXG4gIHZhciBjYXRlZ29yaWVzID0gc29ydGVkS2V5cyhtYXRjaGVkQ2F0ZWdvcnlNYXApO1xuICB2YXIgbWF0Y2hlZHdvcmRzID0gc29ydGVkS2V5cyhtYXRjaGVkd29yZE1hcCk7XG4gIGRlYnVnbG9nKCgpPT5cIm1hdGNoZWR3b3JkczogXCIgKyBKU09OLnN0cmluZ2lmeShtYXRjaGVkd29yZHMpKTtcbiAgZGVidWdsb2coKCk9PlwiY2F0ZWdvcmllczogXCIgKyBKU09OLnN0cmluZ2lmeShjYXRlZ29yaWVzKSk7XG5cbiAgLy92YXIgYWxsTWF0Y2hlZFdvcmRzID0geyBba2V5IDogc3RyaW5nXSA6IG51bWJlciB9O1xuICB2YXIgZG9tYWluUmVjb3JkQ291bnQgPSB7fSBhcyB7W2tleTogc3RyaW5nXSA6IG51bWJlcn07XG4gIHZhciBkb21haW5NYXRjaENhdENvdW50ID0ge30gYXMge1trZXk6IHN0cmluZ10gOlxuICAgICAgIHtba2V5OiBzdHJpbmddIDpcbiAgICAge1trZXk6IHN0cmluZ10gOiBudW1iZXJ9fX07XG4gIC8vIHdlIHByZXBhcmUgdGhlIGZvbGxvd2luZyBzdHJ1Y3R1cmVcbiAgLy9cbiAgLy8ge2RvbWFpbn0gOiByZWNvcmRjb3VudDtcbiAgLy8ge21hdGNoZWR3b3Jkc30gOlxuICAvLyB7ZG9tYWlufSB7bWF0Y2hlZHdvcmR9IHtjYXRlZ29yeX0gcHJlc2VuY2Vjb3VudFxuICB0aGVNb2RlbC5yZWNvcmRzLmZvckVhY2goZnVuY3Rpb24ocmVjb3JkKSB7XG4gICAgaWYoIWZpbHRlcmRvbWFpbiB8fCByZWNvcmQuX2RvbWFpbiA9PT0gZmlsdGVyZG9tYWluICkge1xuICAgICAgZG9tYWluUmVjb3JkQ291bnRbcmVjb3JkLl9kb21haW5dID0gKGRvbWFpblJlY29yZENvdW50W3JlY29yZC5fZG9tYWluXSB8fCAwKSArIDE7XG4gICAgICBtYXRjaGVkd29yZHMuZm9yRWFjaChtYXRjaGVkd29yZCA9PlxuICAgICAgICBjYXRlZ29yaWVzLmZvckVhY2goY2F0ZWdvcnkgPT4ge1xuICAgICAgICAgIGlmKCByZWNvcmRbY2F0ZWdvcnldID09PSBtYXRjaGVkd29yZCkge1xuICAgICAgICAgICAgdmFyIG1kID0gZG9tYWluTWF0Y2hDYXRDb3VudFtyZWNvcmQuX2RvbWFpbl0gPSBkb21haW5NYXRjaENhdENvdW50W3JlY29yZC5fZG9tYWluXSB8fCB7fTtcbiAgICAgICAgICAgIHZhciBtZGMgPSBtZFttYXRjaGVkd29yZF0gPSAgbWRbbWF0Y2hlZHdvcmRdIHx8IHt9O1xuICAgICAgICAgICAgaW5jcmVtZW50KG1kYyxjYXRlZ29yeSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICApXG4gICAgICApO1xuICAgIH1cbiAgfSk7XG4gIGRlYnVnbG9nKCgpPT5KU09OLnN0cmluZ2lmeShkb21haW5NYXRjaENhdENvdW50LHVuZGVmaW5lZCwyKSk7XG4gIGRlYnVnbG9nKCgpPT5KU09OLnN0cmluZ2lmeShkb21haW5SZWNvcmRDb3VudCx1bmRlZmluZWQsMikpO1xuICB2YXIgZG9tYWlucyA9IHNvcnRlZEtleXMoZG9tYWluTWF0Y2hDYXRDb3VudCk7XG4gIHZhciByZXNOZXh0ID0gICdcIicgKyBmYWN0ICsgJ1wiIGhhcyBhIG1lYW5pbmcgaW4gJztcbiAgdmFyIHNpbmdsZSA9IGZhbHNlO1xuICBpZihPYmplY3Qua2V5cyhkb21haW5NYXRjaENhdENvdW50KS5sZW5ndGggPiAxKSB7XG4gICAgcmVzTmV4dCArPSAnJyArIGRvbWFpbnMubGVuZ3RoICtcbiAgICAgICAgICAgICAgJyBkb21haW5zOiAnICsgVXRpbHMubGlzdFRvUXVvdGVkQ29tbWFBbmQoZG9tYWlucykgKyBcIlwiO1xuICB9IGVsc2UgaWYoZG9tYWlucy5sZW5ndGggPT09IDEpIHtcbiAgICBpZighZmlsdGVyZG9tYWluKSB7XG4gICAgICByZXNOZXh0ICs9IGBvbmUgYDtcbiAgICB9XG4gICAgcmVzTmV4dCArPSBgZG9tYWluIFwiJHtkb21haW5zWzBdfVwiOmA7XG4gICAgc2luZ2xlID0gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICBpZihyZXMpIHtcbiAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIHZhciBmYWN0Y2xlYW4gPSBVdGlscy5zdHJpcFF1b3RlcyhmYWN0KTtcbiAgICBpZihmaWx0ZXJkb21haW4pIHtcbiAgICAgIHJldHVybiBgXCIke2ZhY3RjbGVhbn1cIiBpcyBubyBrbm93biBmYWN0IGluIGRvbWFpbiBcIiR7ZmlsdGVyZG9tYWlufVwiLlxcbmA7XG4gICAgfVxuICAgIHJldHVybiBgSSBkb24ndCBrbm93IGFueXRoaW5nIGFib3V0IFwiJHtmYWN0Y2xlYW59XCIuXFxuYDtcbiAgfVxuICByZXMgKz0gcmVzTmV4dCArIFwiXFxuXCI7IC8vIC4uLlxcblwiO1xuICBkb21haW5zLmZvckVhY2goZnVuY3Rpb24oZG9tYWluKSB7XG4gICAgdmFyIG1kID0gZG9tYWluTWF0Y2hDYXRDb3VudFtkb21haW5dO1xuICAgIE9iamVjdC5rZXlzKG1kKS5mb3JFYWNoKG1hdGNoZWRzdHJpbmcgPT4ge1xuICAgICAgdmFyIG1kYyA9IG1kW21hdGNoZWRzdHJpbmddO1xuICAgICAgaWYoIXNpbmdsZSkge1xuICAgICAgICByZXMgKz0gJ2luIGRvbWFpbiBcIicgKyBkb21haW4gKyAnXCIgJztcbiAgICAgIH1cbiAgICAgIHZhciBjYXRzaW5nbGUgPSBPYmplY3Qua2V5cyhtZGMpLmxlbmd0aCA9PT0gMTtcbiAgICAgIHJlcyArPSBgJHtzbG9wcHlPckV4YWN0KG1hdGNoZWRzdHJpbmcsZmFjdCx0aGVNb2RlbCl9IGA7XG4gICAgICBpZighY2F0c2luZ2xlKSB7XG4gICAgICAgIHJlcyArPSBgLi4uXFxuYDtcbiAgICAgIH1cbiAgICAgIE9iamVjdC5rZXlzKG1kYykuZm9yRWFjaChjYXRlZ29yeSA9PiB7XG4gICAgICB2YXIgcGVyY2VudCA9ICB0b1BlcmNlbnQobWRjW2NhdGVnb3J5XSxkb21haW5SZWNvcmRDb3VudFtkb21haW5dKTtcbiAgICAgICAgcmVzICs9IGBpcyBhIHZhbHVlIGZvciBjYXRlZ29yeSBcIiR7Y2F0ZWdvcnl9XCIgcHJlc2VudCBpbiAke21kY1tjYXRlZ29yeV19KCR7cGVyY2VudH0lKSBvZiByZWNvcmRzO1xcbmA7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG4gIHJldHVybiByZXM7XG59XG4qL1xuXG5leHBvcnQgZnVuY3Rpb24gZGVzY3JpYmVGYWN0SW5Eb21haW4oZmFjdCA6IHN0cmluZywgZmlsdGVyZG9tYWluIDogc3RyaW5nLCB0aGVNb2RlbDogSU1hdGNoLklNb2RlbHMpIDogUHJvbWlzZTxzdHJpbmc+IHtcbiAgdmFyIHNlbnRlbmNlcyA9IFdoYXRJcy5hbmFseXplQ29udGV4dFN0cmluZyhmYWN0LCAgdGhlTW9kZWwucnVsZXMpO1xuICAvL2NvbnNvbGUubG9nKFwiaGVyZSBzZW50ZW5jZXMgXCIgKyBKU09OLnN0cmluZ2lmeShzZW50ZW5jZXMpKTtcbiAgdmFyIGxlbmd0aE9uZVNlbnRlbmNlcyA9IHNlbnRlbmNlcy5zZW50ZW5jZXMuZmlsdGVyKG9TZW50ZW5jZSA9PiBvU2VudGVuY2UubGVuZ3RoID09PSAxKTtcbiAgdmFyIHJlcyA9ICcnO1xuICAvLyByZW1vdmUgY2F0ZWdvcmllcyBhbmQgZG9tYWluc1xuICB2YXIgb25seUZhY3RzID0gbGVuZ3RoT25lU2VudGVuY2VzLmZpbHRlcihvU2VudGVuY2UgPT57XG4gICAgZGVidWdsb2coSlNPTi5zdHJpbmdpZnkob1NlbnRlbmNlWzBdKSk7XG4gICAgcmV0dXJuICFXb3JkLldvcmQuaXNEb21haW4ob1NlbnRlbmNlWzBdKSAmJlxuICAgICAgICAgICAhV29yZC5Xb3JkLmlzRmlsbGVyKG9TZW50ZW5jZVswXSkgJiYgIVdvcmQuV29yZC5pc0NhdGVnb3J5KG9TZW50ZW5jZVswXSlcbiAgfSk7XG4gIHZhciBvbmx5RG9tYWlucyA9IGxlbmd0aE9uZVNlbnRlbmNlcy5maWx0ZXIob1NlbnRlbmNlID0+e1xuICAgIHJldHVybiAoV29yZC5Xb3JkLmlzRG9tYWluKG9TZW50ZW5jZVswXSkpO1xuICB9KTtcbiAgdmFyIHBQcm9taXNlID0gdW5kZWZpbmVkO1xuICBkZWJ1Z2xvZygoKT0+IGAgaGVyZSBvbmx5RG9tYWlucyAke29ubHlEb21haW5zLmpvaW4oJzsnKX1gKTtcbiAgaWYob25seURvbWFpbnMgJiYgb25seURvbWFpbnMubGVuZ3RoID4gMCkge1xuICAgIGRlYnVnbG9nKCgpPT5KU09OLnN0cmluZ2lmeShvbmx5RG9tYWlucykpO1xuICAgIHBQcm9taXNlID0gKGdsb2JhbC5Qcm9taXNlIGFzIGFueSkuYWxsKG9ubHlEb21haW5zLm1hcChmdW5jdGlvbihzZW50ZW5jZSkge1xuICAgICAgdmFyIGRvbWFpbiA9IHNlbnRlbmNlWzBdLm1hdGNoZWRTdHJpbmc7XG4gICAgICBpZiggIWZpbHRlcmRvbWFpbiB8fCAoZG9tYWluID09PSBmaWx0ZXJkb21haW4pKSB7XG4gICAgICAgIGRlYnVnbG9nKCgpPT5cImhlcmUgbWF0Y2ggXCIgKyBKU09OLnN0cmluZ2lmeShzZW50ZW5jZSkpO1xuICAgICAgICByZXR1cm4gZGVzY3JpYmVEb21haW4oZmFjdCwgc2VudGVuY2VbMF0ubWF0Y2hlZFN0cmluZywgdGhlTW9kZWwpLnRoZW4oXG4gICAgICAgICAgcnggPT4ge1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhgZGVzY3JpYmVkIGRvbWFpbiAke2ZhY3R9ICR7ZG9tYWlufSBgICsgcngpO1xuICAgICAgICAgICAgcmVzICs9IHJ4XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIChnbG9iYWwuUHJvbWlzZSBhcyBhbnkpLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgIH1cbiAgICB9KSkudGhlbiggKGFycikgPT4ge1xuICAgICAgZGVidWdsb2coICgpPT4gYXJyLmpvaW4oXCI7XCIpKTtcbiAgICAgIGFyci5tYXAoIChyZWMpID0+IHtcbiAgICAgICAgaWYocmVjICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICByZXMgKz0gcmVjO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXM7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgcFByb21pc2UgPSAoZ2xvYmFsLlByb21pc2UgYXMgYW55KS5yZXNvbHZlKHJlcyk7XG4gIH07XG4gIHJldHVybiBwUHJvbWlzZS50aGVuKHJlc3UgPT4ge1xuICAgIGRlYnVnbG9nKCgpPT4gYGNvbnN0cnVjdGVkIHNvIGZhciBcIiR7cmVzfVwiYCk7XG4gICAgZGVidWdsb2coXCJvbmx5IGZhY3RzOiBcIiArIEpTT04uc3RyaW5naWZ5KG9ubHlGYWN0cykpO1xuICAgIHZhciByZWNvcmRNYXAgPSB7fTtcbiAgICB2YXIgZG9tYWluc01hcCA9IHt9IGFzIHtba2V5OiBzdHJpbmddIDogbnVtYmVyfTtcbiAgICB2YXIgbWF0Y2hlZHdvcmRNYXAgPSB7fSBhcyB7W2tleTogc3RyaW5nXSA6IG51bWJlcn07XG4gICAgdmFyIG1hdGNoZWRDYXRlZ29yeU1hcCA9IHt9IGFzIHtba2V5OiBzdHJpbmddIDogbnVtYmVyfTtcbiAgICAvLyBsb29rIGZvciBhbGwgcmVjb3Jkc1xuICAgIG9ubHlGYWN0cy5mb3JFYWNoKG9TZW50ZW5jZSA9PlxuICAgICAgb1NlbnRlbmNlLmZvckVhY2gob1dvcmQgPT5cbiAgICAgICAge1xuICAgICAgICAgIGluY3JlbWVudChtYXRjaGVkd29yZE1hcCwgb1dvcmQubWF0Y2hlZFN0cmluZyk7XG4gICAgICAgICAgaW5jcmVtZW50KG1hdGNoZWRDYXRlZ29yeU1hcCwgb1dvcmQuY2F0ZWdvcnkpO1xuICAgICAgICB9XG4gICAgICApXG4gICAgKTtcbiAgICAvLyB3ZSBoYXZlOlxuICAgIC8vIGEgbGlzdCBvZiBjYXRlZ29yaWVzLFxuICAgIC8vIGEgbGlzdCBvZiBtYXRjaGVkV29yZHMgIC0+XG4gICAgLy9cbiAgICB2YXIgY2F0ZWdvcmllcyA9IHNvcnRlZEtleXMobWF0Y2hlZENhdGVnb3J5TWFwKTtcbiAgICBjYXRlZ29yaWVzLnNvcnQoKTtcbiAgICB2YXIgbWF0Y2hlZHdvcmRzID0gc29ydGVkS2V5cyhtYXRjaGVkd29yZE1hcCk7XG4gICAgZGVidWdsb2coKCk9PlwibWF0Y2hlZHdvcmRzOiBcIiArIEpTT04uc3RyaW5naWZ5KG1hdGNoZWR3b3JkcykpO1xuICAgIGRlYnVnbG9nKCgpPT5cImNhdGVnb3JpZXM6IFwiICsgSlNPTi5zdHJpbmdpZnkoY2F0ZWdvcmllcykpO1xuXG4gICAgLy92YXIgYWxsTWF0Y2hlZFdvcmRzID0geyBba2V5IDogc3RyaW5nXSA6IG51bWJlciB9O1xuICAgIHZhciBkb21haW5SZWNvcmRDb3VudCA9IHt9IGFzIHtba2V5OiBzdHJpbmddIDogbnVtYmVyfTtcbiAgICB2YXIgZG9tYWluTWF0Y2hDYXRDb3VudCA9IHt9IGFzIHtba2V5OiBzdHJpbmddIDpcbiAgICAgIHtba2V5OiBzdHJpbmddIDpcbiAgICAgIHtba2V5OiBzdHJpbmddIDogbnVtYmVyfX1cbiAgICB9O1xuXG4gICAgdmFyIGZpbHRlcmVkRG9tYWlucyA9IHRoZU1vZGVsLmRvbWFpbnMuZmlsdGVyKCAoZG9tYWluKSA9PlxuICAgICAgKCghZmlsdGVyZG9tYWluKSB8fCBkb21haW4gPT09IGZpbHRlcmRvbWFpbilcbiAgICApO1xuXG4gICAgLy8gd2UgcHJlcGFyZSB0aGUgZm9sbG93aW5nIHN0cnVjdHVyZVxuICAgIC8vXG4gICAgLy8ge2RvbWFpbn0gOiByZWNvcmRjb3VudDtcbiAgICAvLyB7bWF0Y2hlZHdvcmRzfSA6XG4gICAgLy8ge2RvbWFpbn0ge21hdGNoZWR3b3JkfSB7Y2F0ZWdvcnl9IHByZXNlbmNlY291bnRcbiAgICByZXR1cm4gKGdsb2JhbC5Qcm9taXNlIGFzIGFueSkuYWxsKFxuICAgICAgZmlsdGVyZWREb21haW5zLm1hcCggKGRvbWFpbikgPT4ge1xuICAgICAgICBpZighZmlsdGVyZG9tYWluIHx8IGRvbWFpbiA9PT0gZmlsdGVyZG9tYWluICkge1xuICAgICAgICAgIHJldHVybiBNb2RlbC5nZXRFeHBhbmRlZFJlY29yZHNGdWxsKHRoZU1vZGVsLCBkb21haW4pLnRoZW4ocmVjb3JkcyA9PiB7XG4gICAgICAgICAgICBkb21haW5SZWNvcmRDb3VudFtkb21haW5dID0gcmVjb3Jkcy5sZW5ndGg7XG4gICAgICAgICAgICByZWNvcmRzLm1hcCggKHJlY29yZCkgPT57XG4gICAgICAvLyBkb21haW5SZWNvcmRDb3VudFtyZWNvcmQuX2RvbWFpbl0gPSAoZG9tYWluUmVjb3JkQ291bnRbcmVjb3JkLl9kb21haW5dIHx8IDApICsgMTtcbiAgICAgICAgICAgICAgbWF0Y2hlZHdvcmRzLmZvckVhY2gobWF0Y2hlZHdvcmQgPT57XG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllcy5mb3JFYWNoKGNhdGVnb3J5ID0+IHtcbiAgICAgICAgICAgICAgICBpZihyZWNvcmRbY2F0ZWdvcnldID09PSBtYXRjaGVkd29yZCkge1xuICAgICAgICAgICAgICAgICAgdmFyIG1kID0gZG9tYWluTWF0Y2hDYXRDb3VudFtkb21haW5dID0gZG9tYWluTWF0Y2hDYXRDb3VudFtkb21haW5dIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgdmFyIG1kYyA9IG1kW21hdGNoZWR3b3JkXSA9ICBtZFttYXRjaGVkd29yZF0gfHwge307XG4gICAgICAgICAgICAgICAgICBpbmNyZW1lbnQobWRjLGNhdGVnb3J5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBNb2RlbC5nZXRFeHBhbmRlZFJlY29yZHNGdWxsKHRoZU1vZGVsLCBkb21haW4pLnRoZW4ocmVjb3JkcyA9PiB7XG4gICAgICAgICAgICBkb21haW5SZWNvcmRDb3VudFtkb21haW5dID0gcmVjb3Jkcy5sZW5ndGg7XG4gICAgICAgICAgICByZWNvcmRzLm1hcCggKHJlY29yZCkgPT57XG4gICAgICAvLyBkb21haW5SZWNvcmRDb3VudFtyZWNvcmQuX2RvbWFpbl0gPSAoZG9tYWluUmVjb3JkQ291bnRbcmVjb3JkLl9kb21haW5dIHx8IDApICsgMTtcbiAgICAgICAgICAgICAgbWF0Y2hlZHdvcmRzLmZvckVhY2gobWF0Y2hlZHdvcmQgPT57XG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllcy5mb3JFYWNoKGNhdGVnb3J5ID0+IHtcbiAgICAgICAgICAgICAgICBpZihyZWNvcmRbY2F0ZWdvcnldID09PSBtYXRjaGVkd29yZCkge1xuICAgICAgICAgICAgICAgICAgdmFyIG1kID0gZG9tYWluTWF0Y2hDYXRDb3VudFtkb21haW5dID0gZG9tYWluTWF0Y2hDYXRDb3VudFtkb21haW5dIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgdmFyIG1kYyA9IG1kW21hdGNoZWR3b3JkXSA9ICBtZFttYXRjaGVkd29yZF0gfHwge307XG4gICAgICAgICAgICAgICAgICBpbmNyZW1lbnQobWRjLGNhdGVnb3J5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICkudGhlbiggKGEpID0+IHtcbiAgICAgIGRlYnVnbG9nKCgpPT4gJ3Rlcm1pbmFsIHByb2Nlc3NpbmcgJyArIHJlcyk7XG4gICAgICBkZWJ1Z2xvZygoKT0+SlNPTi5zdHJpbmdpZnkoZG9tYWluTWF0Y2hDYXRDb3VudCx1bmRlZmluZWQsMikpO1xuICAgICAgZGVidWdsb2coKCk9PkpTT04uc3RyaW5naWZ5KGRvbWFpblJlY29yZENvdW50LHVuZGVmaW5lZCwyKSk7XG4gICAgICB2YXIgZG9tYWlucyA9IHNvcnRlZEtleXMoZG9tYWluTWF0Y2hDYXRDb3VudCk7XG4gICAgICB2YXIgcmVzTmV4dCA9ICAnXCInICsgZmFjdCArICdcIiBoYXMgYSBtZWFuaW5nIGluICc7XG4gICAgICB2YXIgc2luZ2xlID0gZmFsc2U7XG4gICAgICBpZihPYmplY3Qua2V5cyhkb21haW5NYXRjaENhdENvdW50KS5sZW5ndGggPiAxKSB7XG4gICAgICAgIHJlc05leHQgKz0gJycgKyBkb21haW5zLmxlbmd0aCArXG4gICAgICAgICAgICAgICAgICAnIGRvbWFpbnM6ICcgKyBVdGlscy5saXN0VG9RdW90ZWRDb21tYUFuZChkb21haW5zKSArIFwiXCI7XG4gICAgICB9IGVsc2UgaWYoZG9tYWlucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgaWYoIWZpbHRlcmRvbWFpbikge1xuICAgICAgICAgIHJlc05leHQgKz0gYG9uZSBgO1xuICAgICAgICB9XG4gICAgICAgIHJlc05leHQgKz0gYGRvbWFpbiBcIiR7ZG9tYWluc1swXX1cIjpgO1xuICAgICAgICBzaW5nbGUgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYocmVzKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfVxuICAgICAgICB2YXIgZmFjdGNsZWFuID0gVXRpbHMuc3RyaXBRdW90ZXMoZmFjdCk7XG4gICAgICAgIGlmKGZpbHRlcmRvbWFpbikge1xuICAgICAgICAgIHJldHVybiBgXCIke2ZhY3RjbGVhbn1cIiBpcyBubyBrbm93biBmYWN0IGluIGRvbWFpbiBcIiR7ZmlsdGVyZG9tYWlufVwiLlxcbmA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGBJIGRvbid0IGtub3cgYW55dGhpbmcgYWJvdXQgXCIke2ZhY3RjbGVhbn1cIi5cXG5gO1xuICAgICAgfVxuICAgICAgcmVzICs9IHJlc05leHQgKyBcIlxcblwiOyAvLyAuLi5cXG5cIjtcbiAgICAgIGRvbWFpbnMuZm9yRWFjaChmdW5jdGlvbihkb21haW4pIHtcbiAgICAgICAgdmFyIG1kID0gZG9tYWluTWF0Y2hDYXRDb3VudFtkb21haW5dO1xuICAgICAgICBPYmplY3Qua2V5cyhtZCkuZm9yRWFjaChtYXRjaGVkc3RyaW5nID0+IHtcbiAgICAgICAgICB2YXIgbWRjID0gbWRbbWF0Y2hlZHN0cmluZ107XG4gICAgICAgICAgaWYoIXNpbmdsZSkge1xuICAgICAgICAgICAgcmVzICs9ICdpbiBkb21haW4gXCInICsgZG9tYWluICsgJ1wiICc7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBjYXRzaW5nbGUgPSBPYmplY3Qua2V5cyhtZGMpLmxlbmd0aCA9PT0gMTtcbiAgICAgICAgICByZXMgKz0gYCR7c2xvcHB5T3JFeGFjdChtYXRjaGVkc3RyaW5nLGZhY3QsdGhlTW9kZWwpfSBgO1xuICAgICAgICAgIGlmKCFjYXRzaW5nbGUpIHtcbiAgICAgICAgICAgIHJlcyArPSBgLi4uXFxuYDtcbiAgICAgICAgICB9XG4gICAgICAgICAgT2JqZWN0LmtleXMobWRjKS5mb3JFYWNoKGNhdGVnb3J5ID0+IHtcbiAgICAgICAgICAgIGRlYnVnbG9nKCAoKT0+YCBwZXJjZW50IDogJHttZGNbY2F0ZWdvcnldfSBvZiAke2RvbWFpblJlY29yZENvdW50W2RvbWFpbl19IGApO1xuICAgICAgICAgIHZhciBwZXJjZW50ID0gIHRvUGVyY2VudChtZGNbY2F0ZWdvcnldLGRvbWFpblJlY29yZENvdW50W2RvbWFpbl0pO1xuICAgICAgICAgICAgcmVzICs9IGBpcyBhIHZhbHVlIGZvciBjYXRlZ29yeSBcIiR7Y2F0ZWdvcnl9XCIgcHJlc2VudCBpbiAke21kY1tjYXRlZ29yeV19KCR7cGVyY2VudH0lKSBvZiByZWNvcmRzO1xcbmA7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzO1xuICAgIH0pO1xuICB9KTtcblxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBkZXNjcmliZUNhdGVnb3J5KGNhdGVnb3J5IDogc3RyaW5nLCBmaWx0ZXJEb21haW46IHN0cmluZywgbW9kZWw6IElNYXRjaC5JTW9kZWxzLG1lc3NhZ2UgOiBzdHJpbmcpIDogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICB2YXIgZG9tcyA9IE1vZGVsLmdldERvbWFpbnNGb3JDYXRlZ29yeShtb2RlbCxjYXRlZ29yeSk7XG4gIGZ1bmN0aW9uIGdldFByb21pc2VBcnIoKSB7XG4gICAgdmFyIHJlcyA9IFtdO1xuXG4gICAgaWYoZmlsdGVyRG9tYWluKSB7XG4gICAgICBpZihkb21zLmluZGV4T2YoZmlsdGVyRG9tYWluKSA+PSAwKSB7XG4gICAgICAgIHJlcy5wdXNoKGRlc2NyaWJlQ2F0ZWdvcnlJbkRvbWFpbihjYXRlZ29yeSxmaWx0ZXJEb21haW4sbW9kZWwpKTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICAgIH1cbiAgICB9XG4gICAgZG9tcy5zb3J0KCk7XG4gICAgZG9tcy5mb3JFYWNoKGZ1bmN0aW9uKGRvbWFpbikge1xuICAgICAgICAgIHJlcy5wdXNoKGRlc2NyaWJlQ2F0ZWdvcnlJbkRvbWFpbihjYXRlZ29yeSwgZG9tYWluLCBtb2RlbCkpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIHZhciByZXNQcm9taXNlQXJyID0gZ2V0UHJvbWlzZUFycigpO1xuICAgIHJldHVybiAoZ2xvYmFsLlByb21pc2UgYXMgYW55KS5hbGwocmVzUHJvbWlzZUFycikudGhlbiggKHJlc0FycikgPT4gcmVzQXJyKTtcbn1cbiJdfQ==
