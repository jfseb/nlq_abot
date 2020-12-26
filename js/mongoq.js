'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryInternal = exports.remapResult = exports.projectResultToArray = exports.remapRecord = exports.query = exports.queryWithURI = exports.queryWithAuxCategories = exports.prepareQueries = exports.augmentCategoriesWithURI = exports.containsFixedCategories = exports.makeAggregateFromAstOld = exports.makeAggregateFromAst = exports.getDomainInfoForSentence = exports.getDomainForSentenceSafe = exports.ModelHandle = exports.MongoBridge = exports.makeMongoName = exports.JSONStringify = void 0;
/**
 * @file
 * @module jfseb.mgnlq_parser1.mongoq
 * @copyright (c) 2016-2109 Gerd Forstmann
 *
 * database connectivity and querying
 */
const er_index_1 = require("./match/er_index");
const index_model_1 = require("./model/index_model");
const debug = require("debugf");
const _ = require("lodash");
const debuglog = debug('mongoq');
const chevrotain = require("chevrotain");
const AST = require("./ast");
var createToken = chevrotain.createToken;
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;
const process = require("process");
function JSONStringify(obj) {
    function customSer(key, value) {
        if (value instanceof RegExp)
            return (value.toString());
        else
            return value;
    }
    return JSON.stringify(obj, customSer, 2);
}
exports.JSONStringify = JSONStringify;
process.on("unhandledRejection", function handleWarning(reason, promise) {
    console.log("[PROCESS] Unhandled Promise Rejection");
    console.log("- - - - - - - - - - - - - - - - - - -");
    console.log(reason);
    console.log('');
});
function makeMongoName(s) {
    return s.replace(/[^a-zA-Z0-9]/g, '_');
}
exports.makeMongoName = makeMongoName;
//var mongodb = process.env.ABOT_MONGODB || "testmodel";
//(<any>srcHandle).Promise = global.Promise;
//var db = srcHandle.connection;
class MongoBridge {
    constructor(model) {
        this._model = model;
    }
    mongoooseDomainToDomain(mgdomain) {
        var domain = undefined;
        debug('searching for .............## ' + mgdomain);
        this._model.domains.every(d => {
            // console.log("here we go "  + mgdomain + " " + makeMongoName(d));
            debug("here we go " + mgdomain + " " + makeMongoName(d));
            if (makeMongoName(d) === makeMongoName(mgdomain)) {
                domain = d;
                debug('got one ' + d);
                return false;
            }
            return true;
        });
        return domain;
    }
}
exports.MongoBridge = MongoBridge;
class ModelHandle {
    constructor(theModel) {
        this._theModel = theModel;
        this._mongoose = this._theModel.mongoHandle && this._theModel.mongoHandle.srcHandle;
        this._mgBridge = new MongoBridge(theModel);
    }
    query(domain, query) {
        var that = this;
        var modelname = index_model_1.Model.getMongooseModelNameForDomain(this._theModel, domain);
        debuglog('query ' + domain + ' >>' + modelname + ' ' + JSON.stringify(query, undefined, 2));
        return getDBConnection(this._mongoose).then((srcHandle) => {
            return new Promise(function (resolve, reject) {
                Promise.resolve(1).then(() => {
                    debuglog('constructing model for ' + modelname);
                    if (that._theModel.mongoHandle.srcHandle.modelNames().indexOf(modelname) < 0) {
                        throw new Error(` ${domain} / ${modelname} is not a present model `);
                    }
                    var model = that._theModel.mongoHandle.srcHandle.model(modelname);
                    debuglog(() => 'here model ' + Object.keys(model));
                    var resq = model.aggregate(query).then((res) => {
                        //   console.log("here the result" + JSON.stringify(res));
                        resolve(res);
                        //db.close();
                    }).catch((err) => {
                        console.error(err);
                        //db.close();
                    });
                });
            });
        });
    }
}
exports.ModelHandle = ModelHandle;
function incHash(hsh, key) {
    hsh[key] = (hsh[key] || 0) + 1;
}
/*
export function getDomainForSentence2(theModel: IFModel.IModels, sentence : IFErBase.ISentence) : {
  domain: string,
    collectionName: string,
    modelName: string
  }
{
  // this is sloppy and bad
  var res = {};
  var o = 0xFFFFFFF;
  sentence.forEach(w => {
    if (w.rule.wordType === IFModel.WORDTYPE.CATEGORY) {
      o = o & w.rule.bitSentenceAnd;
    }
    if (w.rule.wordType === IFModel.WORDTYPE.FACT) {
      o = o & w.rule.bitSentenceAnd;
    }
  });
  var domains = Model.getDomainsForBitField(theModel, o);
  if (domains.length !== 1) {
    throw new Error('more than one domain: "' + domains.join('", "') + '"');
  }
  if (!domains[0]) {
    console.log('query without a domain : ' + Sentence.dumpNiceArr([sentence]));
  }
  return {
    domain: domains[0],
    collectionName: Model.getMongoCollectionNameForDomain(theModel, domains[0]),
    modelName: Model.getModelNameForDomain(theModel.mongoHandle, domains[0])
  }
};

*/
function getDomainForSentenceSafe(theModel, sentence) {
    try {
        return getDomainInfoForSentence(theModel, sentence).domain;
    }
    catch (e) {
        return undefined;
    }
}
exports.getDomainForSentenceSafe = getDomainForSentenceSafe;
/**
 * given a Sentence, obtain the domain for it
 * @param theModel
 * @param sentence
 */
function getDomainInfoForSentence(theModel, sentence) {
    // this is sloppy and bad
    var res = {};
    var o = 0xFFFFFFF;
    sentence.forEach(w => {
        if (w.rule.wordType === index_model_1.IFModel.WORDTYPE.CATEGORY) {
            o = o & w.rule.bitSentenceAnd;
            index_model_1.Model.getDomainsForCategory(theModel, w.matchedString).forEach(d => {
                incHash(res, d);
            });
        }
        if (w.rule.wordType === index_model_1.IFModel.WORDTYPE.FACT) {
            o = o & w.rule.bitSentenceAnd;
            //   console.log(`${w.rule.bitindex} ${w.bitindex} ${w.rule.bitSentenceAnd} ${o} `);
            index_model_1.Model.getDomainsForCategory(theModel, w.category).forEach(d => {
                incHash(res, d);
            });
        }
    });
    var domains = index_model_1.Model.getDomainsForBitField(theModel, o);
    if (domains.length !== 1) {
        throw new Error('more than one domain: "' + domains.join('", "') + '"');
    }
    if (!domains[0]) {
        console.log('query without a domain : ' + er_index_1.Sentence.dumpNiceArr([sentence]));
    }
    return {
        domain: domains[0],
        collectionName: index_model_1.Model.getMongoCollectionNameForDomain(theModel, domains[0]),
        modelName: index_model_1.Model.getModelNameForDomain(theModel.mongoHandle, domains[0])
    };
}
exports.getDomainInfoForSentence = getDomainInfoForSentence;
;
//import { IFErBase as IMatch, ErError as ErError } from './match/index';
const mQ = require("./ast2query/ast2MQuery");
;
;
;
;
function getDBConnection(mongooseHndl) {
    if (mongooseHndl) {
        debuglog('assuming present handle');
        // we assume we are connected
        return Promise.resolve(mongooseHndl);
    }
    throw Error('how is this gonna work');
}
const SentenceParser = require("./sentenceparser");
;
;
function makeAggregateFromAst(astnode, sentence, models, modelname, fixedCategories) {
    var nodeFieldList = astnode.children[0].children[0];
    var nodeFilter = astnode.children[1];
    var mongoMap = undefined;
    mongoMap = models.mongoHandle.mongoMaps[modelname];
    var modelHandleRaw = models.mongoHandle;
    // match -> match 
    // unwind -> expand per array
    var explicitSort = mQ.extractExplicitSortFromAst(nodeFilter, sentence, mongoMap, modelname, modelHandleRaw);
    var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, mongoMap, modelname, modelHandleRaw);
    // TODO: be better than full unwind, use only relelvant categories!
    var unwind = index_model_1.MongoMap.unwindsForNonterminalArrays(mongoMap);
    var head = [match];
    if (unwind.length) {
        head = head.concat(unwind);
        head.push(match);
    }
    var categoryList = mQ.getCategoryList(fixedCategories, nodeFieldList, sentence);
    var categoryListPlusExplicitSort = mQ.amendCategoryList(explicitSort, categoryList);
    var proj = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
    var sort = mQ.makeMongoSortFromAst(categoryList, mongoMap);
    var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);
    var columnsReverseMap = mQ.makeMongoColumnsFromAst(categoryList, mongoMap);
    debuglog(" catPlus " + JSON.stringify(categoryListPlusExplicitSort));
    var projExplicit = mQ.makeMongoProjectionFromAst(categoryListPlusExplicitSort, mongoMap);
    var sortExplicit = mQ.makeMongoExplicitSort(explicitSort, categoryList, mongoMap);
    var groupExplicit = mQ.makeMongoGroupFromAst(categoryListPlusExplicitSort, mongoMap);
    //   console.log(' query: ' + JSON.stringify(r)); // how to get domain?
    // test.equal(domain, 'FioriBOM',' got domain');
    debuglog(" explicitSort" + JSON.stringify(explicitSort));
    var query = (explicitSort.length > 0) ?
        head.concat([sortExplicit, groupExplicit, projExplicit, sortExplicit, proj])
        : head.concat([group, proj, sort]);
    return { query: query, columnsReverseMap: columnsReverseMap };
}
exports.makeAggregateFromAst = makeAggregateFromAst;
function makeAggregateFromAstOld(astnode, sentence, models, collectionName, fixedCategories) {
    var nodeFieldList = astnode.children[0].children[0];
    var nodeFilter = astnode.children[1];
    var mongoMap = undefined;
    mongoMap = models.mongoHandle.mongoMaps[collectionName];
    var modelHandleRaw = models.mongoHandle;
    // todo: detect any explicit sorts
    // { sortCartegoryList : ["cat1"],
    //  [ {cat1 : 1} ,{ cat2 : -1} ]
    //
    // then iff explicit sort,
    // project out cat+sortCart, the then sort by it, only then project out desiredcat
    //
    //}//
    var explicitSort = mQ.extractExplicitSortFromAst(nodeFilter, sentence, mongoMap, collectionName, modelHandleRaw);
    var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, mongoMap, collectionName, modelHandleRaw);
    // TODO: be better than full unwind, use only relelvant categories!
    var unwind = index_model_1.MongoMap.unwindsForNonterminalArrays(mongoMap);
    var head = [match];
    if (unwind.length) {
        head = head.concat(unwind);
        head.push(match);
    }
    var categoryList = mQ.getCategoryList(fixedCategories, nodeFieldList, sentence);
    var categoryListPlusExplicitSort = mQ.amendCategoryList(explicitSort, categoryList);
    var proj = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
    var sort = mQ.makeMongoSortFromAst(categoryList, mongoMap);
    var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);
    var columnsReverseMap = mQ.makeMongoColumnsFromAst(categoryList, mongoMap);
    debuglog(" catPlus " + JSON.stringify(categoryListPlusExplicitSort));
    var projExplicit = mQ.makeMongoProjectionFromAst(categoryListPlusExplicitSort, mongoMap);
    var sortExplicit = mQ.makeMongoExplicitSort(explicitSort, categoryList, mongoMap);
    var groupExplicit = mQ.makeMongoGroupFromAst(categoryListPlusExplicitSort, mongoMap);
    //   console.log(' query: ' + JSON.stringify(r)); // how to get domain?
    // test.equal(domain, 'FioriBOM',' got domain');
    debuglog(" explicitSort" + JSON.stringify(explicitSort));
    var query = (explicitSort.length > 0) ?
        head.concat([sortExplicit, groupExplicit, projExplicit, sortExplicit, proj])
        : head.concat([group, proj, sort]);
    return { query: query, columnsReverseMap: columnsReverseMap };
}
exports.makeAggregateFromAstOld = makeAggregateFromAstOld;
function containsFixedCategories(theModel, domain, fixedCategories) {
    if (fixedCategories.length === 0) {
        return true;
    }
    var cats = index_model_1.Model.getCategoriesForDomain(theModel, domain);
    return _.intersection(cats, fixedCategories).length === fixedCategories.length;
}
exports.containsFixedCategories = containsFixedCategories;
function augmentCategoriesWithURI(fixedCategories, theModel, domain) {
    var uris = index_model_1.Model.getShowURICategoriesForDomain(theModel, domain);
    var ranks = index_model_1.Model.getShowURIRankCategoriesForDomain(theModel, domain);
    return _.union(uris, ranks, fixedCategories);
}
exports.augmentCategoriesWithURI = augmentCategoriesWithURI;
function prepareQueries(query, theModel, fixedCategories, options) {
    debuglog(`here query: ${query}`);
    var r = SentenceParser.parseSentenceToAsts(query, theModel, {}); // words);
    var res = Object.assign({}, r);
    debuglog(() => ' parsed ' + JSON.stringify(r));
    r.domains = [];
    res.queries = res.asts.map((astnode, index) => {
        var sentence = r.sentences[index];
        debuglog(() => `return  ast [${index}]:` + AST.astToText(astnode));
        if (!astnode) {
            debuglog(() => JSON.stringify(` empty node for ${index} ` + JSON.stringify(r.errors[index], undefined, 2)));
            return undefined;
        }
        var domainPick = getDomainInfoForSentence(theModel, sentence);
        debuglog(() => ' domainPick: ' + JSON.stringify(domainPick, undefined, 2));
        var domainFixedCategories = [];
        if (options && options.showURI) {
            domainFixedCategories = augmentCategoriesWithURI(fixedCategories, theModel, domainPick.domain);
        }
        else {
            domainFixedCategories = fixedCategories;
        }
        var mongoMap = theModel.mongoHandle.mongoMaps[domainPick.collectionName];
        if (!containsFixedCategories(theModel, domainPick.domain, domainFixedCategories)) {
            debuglog(() => JSON.stringify(` fixed fields not present in domain ${domainPick.domain} given fields ${domainFixedCategories.join(";")} for ${index} `));
            return undefined;
        }
        var res = makeAggregateFromAst(astnode, sentence, theModel, domainPick.collectionName, domainFixedCategories);
        var query = res.query;
        var columnsReverseMap = res.columnsReverseMap;
        /*
            var nodeFieldList = astnode.children[0].children[0];
            var nodeFilter = astnode.children[1];
            var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, mongoMap);
    
        // TODO: be better than full unwind, use only relelvant categories!
              var MongomMap = MongoMap.unwindsForNonterminalArrays(mongoMap);
    
            var proj = mQ.makeMongoProjectionFromAst(nodeFieldList, sentence, mongoMap);
            var columnsReverseMap= mQ.makeMongoColumnsFromAst(nodeFieldList, sentence, mongoMap);
            var group = mQ.makeMongoGroupFromAst(nodeFieldList, sentence, mongoMap);
            //   console.log(' query: ' + JSON.stringify(r)); // how to get domain?
           // test.equal(domain, 'FioriBOM',' got domain');
            var query = [ match, group, proj ];
          */
        r.domains[index] = domainPick.domain;
        debuglog(() => ` mongo query for collection ${domainPick.collectionName} : ` + JSONStringify(query));
        debuglog(() => ` columnmap ` + JSON.stringify(columnsReverseMap, undefined, 2));
        return {
            domain: domainPick.domain,
            collectionName: domainPick.collectionName,
            columns: columnsReverseMap.columns,
            auxcolumns: [],
            reverseMap: columnsReverseMap.reverseMap,
            query: query
        };
    });
    return res;
}
exports.prepareQueries = prepareQueries;
//extends IMatch.IProcessedSentences {
//  queryresults: QResult[]
//}
/* result format redesign */
/* 1) ability to transport the AST */
/* 2) ability to transport auxiliary information  ( e.g. _url )  */
/* 3) result objects  map [{  prop : value }] as this is more natural , not string[][] */
/* single array of "alternating options" */
function queryWithAuxCategories(query, theModel, auxiliary_categories) {
    var handle = new ModelHandle(theModel);
    return queryInternal(query, theModel, handle, auxiliary_categories);
}
exports.queryWithAuxCategories = queryWithAuxCategories;
function queryWithURI(query, theModel, auxiliary_categories) {
    var handle = new ModelHandle(theModel);
    return queryInternal(query, theModel, handle, [], { showURI: true });
}
exports.queryWithURI = queryWithURI;
function query(query, theModel) {
    var handle = new ModelHandle(theModel);
    return queryInternal(query, theModel, handle, []);
}
exports.query = query;
function remapRecord(rec, columns, reverseMap) {
    var r = {};
    Object.keys(rec).forEach(key => {
        var targetKey = reverseMap[key] || key;
        r[targetKey] = rec[key];
    });
    return r; // columns.map(c => r[c]);
}
exports.remapRecord = remapRecord;
;
function projectResultToArray(res) {
    debuglog(' full :' + JSON.stringify(res));
    return res.results.map(rec => res.columns.map(c => rec[c]));
}
exports.projectResultToArray = projectResultToArray;
function remapResult(res, columns, reverseMap) {
    return res.map(record => remapRecord(record, columns, reverseMap));
}
exports.remapResult = remapResult;
;
function queryInternal(querystring, theModel, handle, fixedFields, options) {
    fixedFields = fixedFields || [];
    var r = prepareQueries(querystring, theModel, fixedFields, options);
    debuglog(() => 'here prepared queries: ' + JSON.stringify(r));
    if (r.queries.length === 0) {
        return Promise.resolve([{
                domain: undefined,
                aux: { sentence: undefined,
                    tokens: r.tokens },
                errors: r.errors,
                columns: [],
                auxcolumns: [],
                results: []
            }]);
    }
    ;
    var aPromises = r.queries.map((query, index) => {
        debuglog(() => `query ${index} prepared for domain ` + (query && query.domain));
        debuglog(() => `query ${index} prepared for domain ` + (query && query.domain && getDomainForSentenceSafe(theModel, r.sentences[index])));
        if (query === undefined) {
            return {
                // TODO may not always be possible
                domain: getDomainForSentenceSafe(theModel, r.sentences[index]),
                aux: {
                    sentence: r.sentences[index],
                    tokens: r.tokens
                },
                errors: r.errors[index],
                columns: [],
                auxcolumns: [],
                results: []
            }; //as IQueryResult
        }
        return handle.query(query.domain, query.query).then(res => {
            var resClean = remapResult(res, r.queries[index].columns, query.reverseMap);
            return {
                domain: query.domain,
                aux: {
                    sentence: r.sentences[index],
                    tokens: r.tokens
                },
                errors: r.errors[index],
                columns: r.queries[index].columns,
                auxcolumns: r.queries[index].auxcolumns,
                results: resClean
            };
        });
    });
    var u = Promise.all(aPromises);
    var k = u.then(aRes => {
        debuglog("***here results of all queries " + JSON.stringify(aRes, undefined, 2));
        var queryresults = aRes; // mergeResults(aRes);
        return queryresults;
    });
    return k;
}
exports.queryInternal = queryInternal;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tb25nb3EudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFBOzs7QUFDWjs7Ozs7O0dBTUc7QUFHSCwrQ0FBOEU7QUFDOUUscURBQStGO0FBRS9GLGdDQUFnQztBQUNoQyw0QkFBNEI7QUFFNUIsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRWpDLHlDQUF5QztBQUN6Qyw2QkFBNkI7QUFJN0IsSUFBSSxXQUFXLEdBQUcsVUFBVSxDQUFDLFdBQVcsQ0FBQztBQUN6QyxJQUFJLEtBQUssR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDO0FBQzdCLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7QUFRL0IsbUNBQW1DO0FBSW5DLFNBQWdCLGFBQWEsQ0FBQyxHQUFRO0lBQ3BDLFNBQVMsU0FBUyxDQUFDLEdBQUcsRUFBRSxLQUFLO1FBQzNCLElBQUksS0FBSyxZQUFZLE1BQU07WUFDekIsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDOztZQUUxQixPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBQ0QsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDM0MsQ0FBQztBQVJELHNDQVFDO0FBRUQsT0FBTyxDQUFDLEVBQUUsQ0FFUixvQkFBb0IsRUFFcEIsU0FBUyxhQUFhLENBQUMsTUFBTSxFQUFFLE9BQU87SUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO0lBQ3JELE9BQU8sQ0FBQyxHQUFHLENBQUMsdUNBQXVDLENBQUMsQ0FBQztJQUNyRCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3BCLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDbEIsQ0FBQyxDQUVGLENBQUM7QUFFRixTQUFnQixhQUFhLENBQUMsQ0FBUztJQUNyQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3pDLENBQUM7QUFGRCxzQ0FFQztBQUVELHdEQUF3RDtBQUd4RCw0Q0FBNEM7QUFFNUMsZ0NBQWdDO0FBRWhDLE1BQWEsV0FBVztJQUV0QixZQUFZLEtBQXNCO1FBQ2hDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO0lBQ3RCLENBQUM7SUFDRCx1QkFBdUIsQ0FBQyxRQUFnQjtRQUN0QyxJQUFJLE1BQU0sR0FBRyxTQUFTLENBQUM7UUFDdkIsS0FBSyxDQUFDLGdDQUFnQyxHQUFHLFFBQVEsQ0FBQyxDQUFDO1FBQ25ELElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUM1QixtRUFBbUU7WUFDbkUsS0FBSyxDQUFDLGFBQWEsR0FBRyxRQUFRLEdBQUcsR0FBRyxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pELElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQyxLQUFLLGFBQWEsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDaEQsTUFBTSxHQUFHLENBQUMsQ0FBQztnQkFDWCxLQUFLLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUN0QixPQUFPLEtBQUssQ0FBQzthQUNkO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7Q0FpQkY7QUFyQ0Qsa0NBcUNDO0FBR0QsTUFBYSxXQUFXO0lBSXRCLFlBQVksUUFBeUI7UUFDbkMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFDMUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUM7UUFDcEYsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBQ0QsS0FBSyxDQUFDLE1BQWMsRUFBRSxLQUFVO1FBQzlCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztRQUNoQixJQUFJLFNBQVMsR0FBRyxtQkFBSyxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDNUUsUUFBUSxDQUFDLFFBQVEsR0FBRyxNQUFNLEdBQUcsS0FBSyxHQUFHLFNBQVMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUYsT0FBTyxlQUFlLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFO1lBRXhELE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBVSxPQUFPLEVBQUUsTUFBTTtnQkFDMUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO29CQUMzQixRQUFRLENBQUMseUJBQXlCLEdBQUcsU0FBUyxDQUFDLENBQUM7b0JBQ2hELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUU7d0JBQzVFLE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxNQUFNLE1BQU0sU0FBUywwQkFBMEIsQ0FBQyxDQUFDO3FCQUN0RTtvQkFDRCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUNsRSxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDbkQsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTt3QkFDN0MsMERBQTBEO3dCQUMxRCxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ2IsYUFBYTtvQkFDZixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTt3QkFDZixPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUNuQixhQUFhO29CQUNmLENBQUMsQ0FBQyxDQUFDO2dCQUNMLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7Q0FDRjtBQW5DRCxrQ0FtQ0M7QUFFRCxTQUFTLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRztJQUN2QixHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2pDLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFnQ0U7QUFFRixTQUFnQix3QkFBd0IsQ0FBQyxRQUF5QixFQUFFLFFBQTRCO0lBQzlGLElBQUk7UUFDRixPQUFPLHdCQUF3QixDQUFDLFFBQVEsRUFBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLENBQUM7S0FDM0Q7SUFBQyxPQUFNLENBQUMsRUFBRTtRQUNULE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0FBQ0gsQ0FBQztBQU5ELDREQU1DO0FBRUQ7Ozs7R0FJRztBQUNILFNBQWdCLHdCQUF3QixDQUFDLFFBQXlCLEVBQUUsUUFBNEI7SUFLOUYseUJBQXlCO0lBQ3pCLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNiLElBQUksQ0FBQyxHQUFHLFNBQVMsQ0FBQztJQUNsQixRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQ25CLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEtBQUsscUJBQU8sQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFO1lBQ2pELENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUM7WUFDOUIsbUJBQUssQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDakUsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsQixDQUFDLENBQUMsQ0FBQztTQUNKO1FBQ0QsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsS0FBSyxxQkFBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUU7WUFDN0MsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQztZQUM5QixvRkFBb0Y7WUFDcEYsbUJBQUssQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDNUQsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsQixDQUFDLENBQUMsQ0FBQztTQUNKO0lBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDSCxJQUFJLE9BQU8sR0FBRyxtQkFBSyxDQUFDLHFCQUFxQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN2RCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ3hCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztLQUN6RTtJQUNELElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7UUFDZixPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixHQUFHLG1CQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzdFO0lBQ0QsT0FBTztRQUNMLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ2xCLGNBQWMsRUFBRSxtQkFBSyxDQUFDLCtCQUErQixDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0UsU0FBUyxFQUFFLG1CQUFLLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDekUsQ0FBQTtBQUNILENBQUM7QUFuQ0QsNERBbUNDO0FBQUEsQ0FBQztBQUVGLHlFQUF5RTtBQUV6RSw2Q0FBNkM7QUFLNUMsQ0FBQztBQU9ELENBQUM7QUFFaUUsQ0FBQztBQWdCbkUsQ0FBQztBQUlGLFNBQVMsZUFBZSxDQUFDLFlBQXdCO0lBQy9DLElBQUksWUFBWSxFQUFFO1FBQ2hCLFFBQVEsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQ3BDLDZCQUE2QjtRQUM3QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7S0FDdEM7SUFDRCxNQUFNLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0FBQ3hDLENBQUM7QUFFRCxtREFBbUQ7QUFRbEQsQ0FBQztBQUlELENBQUM7QUFHRixTQUFnQixvQkFBb0IsQ0FBQyxPQUFvQixFQUFFLFFBQXlCLEVBQ2xGLE1BQXdCLEVBQ3hCLFNBQWtCLEVBQUUsZUFBeUI7SUFDN0MsSUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEQsSUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNyQyxJQUFJLFFBQVEsR0FBRyxTQUFnQyxDQUFDO0lBQ2hELFFBQVEsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNuRCxJQUFJLGNBQWMsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDO0lBRTFDLGtCQUFrQjtJQUNsQiw2QkFBNkI7SUFFM0IsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDLDBCQUEwQixDQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxjQUFjLENBQUUsQ0FBQztJQUU5RyxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUMscUJBQXFCLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRyxRQUFRLEVBQUUsU0FBUyxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ2pHLG1FQUFtRTtJQUNuRSxJQUFJLE1BQU0sR0FBRyxzQkFBUSxDQUFDLDJCQUEyQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzVELElBQUksSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFVLENBQUM7SUFDNUIsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFO1FBQ2pCLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDbEI7SUFDRCxJQUFJLFlBQVksR0FBRyxFQUFFLENBQUMsZUFBZSxDQUFDLGVBQWUsRUFBRSxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDaEYsSUFBSSw0QkFBNEIsR0FBRyxFQUFFLENBQUMsaUJBQWlCLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ3BGLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDakUsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDLG9CQUFvQixDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMzRCxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUMscUJBQXFCLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzdELElBQUksaUJBQWlCLEdBQUcsRUFBRSxDQUFDLHVCQUF1QixDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztJQUUzRSxRQUFRLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFDO0lBQ3JFLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyw0QkFBNEIsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN6RixJQUFJLFlBQVksR0FBRyxFQUFFLENBQUMscUJBQXFCLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNsRixJQUFJLGFBQWEsR0FBRyxFQUFFLENBQUMscUJBQXFCLENBQUMsNEJBQTRCLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDckYsdUVBQXVFO0lBQ3ZFLGdEQUFnRDtJQUNoRCxRQUFRLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztJQUN6RCxJQUFJLEtBQUssR0FBRyxDQUFFLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBRSxDQUFDO1FBQy9FLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3ZDLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLGlCQUFpQixFQUFFLGlCQUFpQixFQUFFLENBQUM7QUFDaEUsQ0FBQztBQXhDRCxvREF3Q0M7QUFHRCxTQUFnQix1QkFBdUIsQ0FBQyxPQUFvQixFQUFFLFFBQXlCLEVBQ3JGLE1BQXdCLEVBQ3hCLGNBQXVCLEVBQUUsZUFBeUI7SUFDbEQsSUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEQsSUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNyQyxJQUFJLFFBQVEsR0FBRyxTQUFnQyxDQUFDO0lBQ2hELFFBQVEsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUN4RCxJQUFJLGNBQWMsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDO0lBQ3hDLGtDQUFrQztJQUNsQyxrQ0FBa0M7SUFDbEMsZ0NBQWdDO0lBQ2hDLEVBQUU7SUFDRiwwQkFBMEI7SUFDMUIsa0ZBQWtGO0lBQ2xGLEVBQUU7SUFDRixLQUFLO0lBQ0wsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDLDBCQUEwQixDQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRSxjQUFjLENBQUUsQ0FBQztJQUVuSCxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUMscUJBQXFCLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRyxRQUFRLEVBQUUsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ3RHLG1FQUFtRTtJQUNuRSxJQUFJLE1BQU0sR0FBRyxzQkFBUSxDQUFDLDJCQUEyQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzVELElBQUksSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFVLENBQUM7SUFDNUIsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFO1FBQ2pCLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDbEI7SUFDRCxJQUFJLFlBQVksR0FBRyxFQUFFLENBQUMsZUFBZSxDQUFDLGVBQWUsRUFBRSxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDaEYsSUFBSSw0QkFBNEIsR0FBRyxFQUFFLENBQUMsaUJBQWlCLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ3BGLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDakUsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDLG9CQUFvQixDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMzRCxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUMscUJBQXFCLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzdELElBQUksaUJBQWlCLEdBQUcsRUFBRSxDQUFDLHVCQUF1QixDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztJQUUzRSxRQUFRLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFDO0lBQ3JFLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyw0QkFBNEIsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN6RixJQUFJLFlBQVksR0FBRyxFQUFFLENBQUMscUJBQXFCLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNsRixJQUFJLGFBQWEsR0FBRyxFQUFFLENBQUMscUJBQXFCLENBQUMsNEJBQTRCLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDckYsdUVBQXVFO0lBQ3ZFLGdEQUFnRDtJQUNoRCxRQUFRLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztJQUN6RCxJQUFJLEtBQUssR0FBRyxDQUFFLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBRSxDQUFDO1FBQy9FLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3ZDLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLGlCQUFpQixFQUFFLGlCQUFpQixFQUFFLENBQUM7QUFDaEUsQ0FBQztBQTVDRCwwREE0Q0M7QUFHRCxTQUFnQix1QkFBdUIsQ0FBQyxRQUF5QixFQUFFLE1BQWMsRUFBRSxlQUF5QjtJQUMxRyxJQUFJLGVBQWUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ2hDLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFDRCxJQUFJLElBQUksR0FBRyxtQkFBSyxDQUFDLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMxRCxPQUFPLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDLE1BQU0sS0FBSyxlQUFlLENBQUMsTUFBTSxDQUFDO0FBQ2pGLENBQUM7QUFORCwwREFNQztBQUVELFNBQWdCLHdCQUF3QixDQUFDLGVBQTBCLEVBQUUsUUFBMEIsRUFBRSxNQUFlO0lBQzlHLElBQUksSUFBSSxHQUFHLG1CQUFLLENBQUMsNkJBQTZCLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2pFLElBQUksS0FBSyxHQUFHLG1CQUFLLENBQUMsaUNBQWlDLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3RFLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0FBQy9DLENBQUM7QUFKRCw0REFJQztBQUVELFNBQWdCLGNBQWMsQ0FBQyxLQUFhLEVBQUUsUUFBeUIsRUFBRSxlQUF5QixFQUFFLE9BQXdCO0lBQzFILFFBQVEsQ0FBQyxlQUFlLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDakMsSUFBSSxDQUFDLEdBQUcsY0FBYyxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVO0lBQzNFLElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBbUIsQ0FBQztJQUNqRCxRQUFRLENBQUUsR0FBRSxFQUFFLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvQyxDQUFDLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUNmLEdBQUcsQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLEVBQUU7UUFDNUMsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsZ0JBQWdCLEtBQUssSUFBSSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNuRSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ1osUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLEtBQUssR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVHLE9BQU8sU0FBUyxDQUFDO1NBQ2xCO1FBQ0QsSUFBSSxVQUFVLEdBQUcsd0JBQXdCLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzlELFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0UsSUFBSSxxQkFBcUIsR0FBYyxFQUFFLENBQUM7UUFDMUMsSUFBRyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRTtZQUM3QixxQkFBcUIsR0FBRyx3QkFBd0IsQ0FBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUNoRzthQUFNO1lBQ0wscUJBQXFCLEdBQUcsZUFBZSxDQUFDO1NBQ3pDO1FBQ0QsSUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ3pFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLE1BQU0sRUFBRSxxQkFBcUIsQ0FBQyxFQUFFO1lBQ2hGLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLHVDQUF1QyxVQUFVLENBQUMsTUFBTSxpQkFBaUIscUJBQXFCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN6SixPQUFPLFNBQVMsQ0FBQztTQUNsQjtRQUNELElBQUksR0FBRyxHQUFHLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxjQUFjLEVBQUUscUJBQXFCLENBQUMsQ0FBQztRQUM3RyxJQUFJLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDO1FBQ3RCLElBQUksaUJBQWlCLEdBQUcsR0FBRyxDQUFDLGlCQUFpQixDQUFDO1FBQzlDOzs7Ozs7Ozs7Ozs7OztZQWNJO1FBQ0osQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO1FBQ3JDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQywrQkFBK0IsVUFBVSxDQUFDLGNBQWMsS0FBSyxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3JHLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoRixPQUFPO1lBQ0wsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNO1lBQ3pCLGNBQWMsRUFBRSxVQUFVLENBQUMsY0FBYztZQUN6QyxPQUFPLEVBQUUsaUJBQWlCLENBQUMsT0FBTztZQUNsQyxVQUFVLEVBQUcsRUFBRTtZQUNmLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQyxVQUFVO1lBQ3hDLEtBQUssRUFBRSxLQUFLO1NBQ2IsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBekRELHdDQXlEQztBQUdELHNDQUFzQztBQUN0QywyQkFBMkI7QUFDM0IsR0FBRztBQUVILDRCQUE0QjtBQUM1QixxQ0FBcUM7QUFDckMsbUVBQW1FO0FBQ25FLHlGQUF5RjtBQUN6RiwyQ0FBMkM7QUFJM0MsU0FBZ0Isc0JBQXNCLENBQUMsS0FBYSxFQUFFLFFBQXlCLEVBQUUsb0JBQStCO0lBQzlHLElBQUksTUFBTSxHQUFHLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3ZDLE9BQU8sYUFBYSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLG9CQUFvQixDQUFDLENBQUM7QUFDdEUsQ0FBQztBQUhELHdEQUdDO0FBR0QsU0FBZ0IsWUFBWSxDQUFDLEtBQWEsRUFBRSxRQUF5QixFQUFFLG9CQUErQjtJQUNwRyxJQUFJLE1BQU0sR0FBRyxJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN2QyxPQUFPLGFBQWEsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUN4RSxDQUFDO0FBSEQsb0NBR0M7QUFFRCxTQUFnQixLQUFLLENBQUMsS0FBYSxFQUFFLFFBQXlCO0lBQzVELElBQUksTUFBTSxHQUFHLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3ZDLE9BQU8sYUFBYSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ3BELENBQUM7QUFIRCxzQkFHQztBQUlELFNBQWdCLFdBQVcsQ0FBQyxHQUFHLEVBQUUsT0FBaUIsRUFBRSxVQUF1QjtJQUN6RSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDWCxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUM3QixJQUFJLFNBQVMsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDMUIsQ0FBQyxDQUFDLENBQUM7SUFDSCxPQUFPLENBQUMsQ0FBQyxDQUFDLDBCQUEwQjtBQUN0QyxDQUFDO0FBUEQsa0NBT0M7QUFBQSxDQUFDO0FBR0YsU0FBZ0Isb0JBQW9CLENBQUUsR0FBaUI7SUFDckQsUUFBUSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDMUMsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBRSxHQUFHLENBQUMsRUFBRSxDQUM1QixHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUM3QixDQUFDO0FBQ0osQ0FBQztBQUxELG9EQUtDO0FBRUQsU0FBZ0IsV0FBVyxDQUFDLEdBQUcsRUFBRSxPQUFpQixFQUFFLFVBQXVCO0lBQ3pFLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFFLENBQUM7QUFDdEUsQ0FBQztBQUZELGtDQUVDO0FBSUEsQ0FBQztBQUVGLFNBQWdCLGFBQWEsQ0FBQyxXQUFtQixFQUFFLFFBQXlCLEVBQUUsTUFBbUIsRUFBRSxXQUFxQixFQUFFLE9BQXVCO0lBRS9JLFdBQVcsR0FBRyxXQUFXLElBQUksRUFBRSxDQUFDO0lBQ2hDLElBQUksQ0FBQyxHQUFHLGNBQWMsQ0FBQyxXQUFXLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNwRSxRQUFRLENBQUMsR0FBRSxFQUFFLENBQUMseUJBQXlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdELElBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ3pCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FDcEIsQ0FBQztnQkFDQyxNQUFNLEVBQUcsU0FBUztnQkFDbEIsR0FBRyxFQUFHLEVBQUUsUUFBUSxFQUFHLFNBQVM7b0JBQzFCLE1BQU0sRUFBRyxDQUFDLENBQUMsTUFBTSxFQUFFO2dCQUNyQixNQUFNLEVBQUcsQ0FBQyxDQUFDLE1BQU07Z0JBQ2pCLE9BQU8sRUFBRyxFQUFFO2dCQUNaLFVBQVUsRUFBRyxFQUFFO2dCQUNmLE9BQU8sRUFBRyxFQUFFO2FBQ2IsQ0FBQyxDQUNILENBQUM7S0FDSDtJQUFBLENBQUM7SUFDRixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRTtRQUM3QyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsU0FBUyxLQUFLLHVCQUF1QixHQUFHLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ2hGLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLEtBQUssdUJBQXVCLEdBQUcsQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSx3QkFBd0IsQ0FBQyxRQUFRLEVBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUV6SSxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7WUFDdkIsT0FBTztnQkFDTCxrQ0FBa0M7Z0JBQ2xDLE1BQU0sRUFBRyx3QkFBd0IsQ0FBQyxRQUFRLEVBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDOUQsR0FBRyxFQUFHO29CQUNKLFFBQVEsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztvQkFDNUIsTUFBTSxFQUFHLENBQUMsQ0FBQyxNQUFNO2lCQUNsQjtnQkFDRCxNQUFNLEVBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7Z0JBQ3hCLE9BQU8sRUFBRSxFQUFFO2dCQUNYLFVBQVUsRUFBRSxFQUFFO2dCQUNkLE9BQU8sRUFBRSxFQUFFO2FBQ1osQ0FBQSxDQUFDLGlCQUFpQjtTQUNwQjtRQUNELE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDeEQsSUFBSSxRQUFRLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDNUUsT0FBTztnQkFDTCxNQUFNLEVBQUcsS0FBSyxDQUFDLE1BQU07Z0JBQ3JCLEdBQUcsRUFBRztvQkFDSixRQUFRLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUM7b0JBQzVCLE1BQU0sRUFBRyxDQUFDLENBQUMsTUFBTTtpQkFDbEI7Z0JBQ0QsTUFBTSxFQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO2dCQUN4QixPQUFPLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPO2dCQUNqQyxVQUFVLEVBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVO2dCQUN4QyxPQUFPLEVBQUUsUUFBUTthQUNGLENBQUE7UUFDbkIsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQ0EsQ0FBQztJQUNGLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQWUsU0FBUyxDQUFDLENBQUM7SUFDN0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBeUIsSUFBSSxDQUFDLEVBQUU7UUFDNUMsUUFBUSxDQUFDLGlDQUFpQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pGLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxDQUFDLHNCQUFzQjtRQUMvQyxPQUFPLFlBQVksQ0FBQztJQUN0QixDQUFDLENBQ0EsQ0FBQztJQUNGLE9BQU8sQ0FBQyxDQUFDO0FBQ1gsQ0FBQztBQTVERCxzQ0E0REMiLCJmaWxlIjoibW9uZ29xLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXHJcbi8qKlxyXG4gKiBAZmlsZVxyXG4gKiBAbW9kdWxlIGpmc2ViLm1nbmxxX3BhcnNlcjEubW9uZ29xXHJcbiAqIEBjb3B5cmlnaHQgKGMpIDIwMTYtMjEwOSBHZXJkIEZvcnN0bWFublxyXG4gKlxyXG4gKiBkYXRhYmFzZSBjb25uZWN0aXZpdHkgYW5kIHF1ZXJ5aW5nXHJcbiAqL1xyXG5cclxuXHJcbmltcG9ydCB7IFNlbnRlbmNlIGFzIFNlbnRlbmNlLCBJRkVyQmFzZSBhcyBJRkVyQmFzZSB9IGZyb20gJy4vbWF0Y2gvZXJfaW5kZXgnO1xyXG5pbXBvcnQgeyBJRk1vZGVsIGFzIElGTW9kZWwsIE1vZGVsIGFzIE1vZGVsLCBNb25nb01hcCBhcyBNb25nb01hcCB9IGZyb20gJy4vbW9kZWwvaW5kZXhfbW9kZWwnO1xyXG5cclxuaW1wb3J0ICogYXMgZGVidWcgZnJvbSAnZGVidWdmJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xyXG5cclxuY29uc3QgZGVidWdsb2cgPSBkZWJ1ZygnbW9uZ29xJyk7XHJcblxyXG5pbXBvcnQgKiBhcyBjaGV2cm90YWluIGZyb20gJ2NoZXZyb3RhaW4nO1xyXG5pbXBvcnQgKiBhcyBBU1QgZnJvbSAnLi9hc3QnO1xyXG5cclxuaW1wb3J0IHsgQVNUTm9kZVR5cGUgYXMgTlQgfSBmcm9tICcuL2FzdCc7XHJcblxyXG52YXIgY3JlYXRlVG9rZW4gPSBjaGV2cm90YWluLmNyZWF0ZVRva2VuO1xyXG52YXIgTGV4ZXIgPSBjaGV2cm90YWluLkxleGVyO1xyXG52YXIgUGFyc2VyID0gY2hldnJvdGFpbi5QYXJzZXI7XHJcblxyXG5cclxuXHJcblxyXG5cclxuaW1wb3J0IHsgSVNyY0hhbmRsZSB9IGZyb20gJy4vbW9kZWwvc3JjaGFuZGxlJztcclxuXHJcbmltcG9ydCAqIGFzIHByb2Nlc3MgZnJvbSAncHJvY2Vzcyc7XHJcblxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBKU09OU3RyaW5naWZ5KG9iajogYW55KTogc3RyaW5nIHtcclxuICBmdW5jdGlvbiBjdXN0b21TZXIoa2V5LCB2YWx1ZSkge1xyXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgUmVnRXhwKVxyXG4gICAgICByZXR1cm4gKHZhbHVlLnRvU3RyaW5nKCkpO1xyXG4gICAgZWxzZVxyXG4gICAgICByZXR1cm4gdmFsdWU7XHJcbiAgfVxyXG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShvYmosIGN1c3RvbVNlciwgMik7XHJcbn1cclxuXHJcbnByb2Nlc3Mub24oXHJcblxyXG4gIFwidW5oYW5kbGVkUmVqZWN0aW9uXCIsXHJcblxyXG4gIGZ1bmN0aW9uIGhhbmRsZVdhcm5pbmcocmVhc29uLCBwcm9taXNlKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIltQUk9DRVNTXSBVbmhhbmRsZWQgUHJvbWlzZSBSZWplY3Rpb25cIik7XHJcbiAgICBjb25zb2xlLmxvZyhcIi0gLSAtIC0gLSAtIC0gLSAtIC0gLSAtIC0gLSAtIC0gLSAtIC1cIik7XHJcbiAgICBjb25zb2xlLmxvZyhyZWFzb24pO1xyXG4gICAgY29uc29sZS5sb2coJycpO1xyXG4gIH1cclxuXHJcbik7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZU1vbmdvTmFtZShzOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gIHJldHVybiBzLnJlcGxhY2UoL1teYS16QS1aMC05XS9nLCAnXycpO1xyXG59XHJcblxyXG4vL3ZhciBtb25nb2RiID0gcHJvY2Vzcy5lbnYuQUJPVF9NT05HT0RCIHx8IFwidGVzdG1vZGVsXCI7XHJcblxyXG5cclxuLy8oPGFueT5zcmNIYW5kbGUpLlByb21pc2UgPSBnbG9iYWwuUHJvbWlzZTtcclxuXHJcbi8vdmFyIGRiID0gc3JjSGFuZGxlLmNvbm5lY3Rpb247XHJcblxyXG5leHBvcnQgY2xhc3MgTW9uZ29CcmlkZ2Uge1xyXG4gIF9tb2RlbDogSUZNb2RlbC5JTW9kZWxzO1xyXG4gIGNvbnN0cnVjdG9yKG1vZGVsOiBJRk1vZGVsLklNb2RlbHMpIHtcclxuICAgIHRoaXMuX21vZGVsID0gbW9kZWw7XHJcbiAgfVxyXG4gIG1vbmdvb29zZURvbWFpblRvRG9tYWluKG1nZG9tYWluOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgdmFyIGRvbWFpbiA9IHVuZGVmaW5lZDtcclxuICAgIGRlYnVnKCdzZWFyY2hpbmcgZm9yIC4uLi4uLi4uLi4uLi4jIyAnICsgbWdkb21haW4pO1xyXG4gICAgdGhpcy5fbW9kZWwuZG9tYWlucy5ldmVyeShkID0+IHtcclxuICAgICAgLy8gY29uc29sZS5sb2coXCJoZXJlIHdlIGdvIFwiICArIG1nZG9tYWluICsgXCIgXCIgKyBtYWtlTW9uZ29OYW1lKGQpKTtcclxuICAgICAgZGVidWcoXCJoZXJlIHdlIGdvIFwiICsgbWdkb21haW4gKyBcIiBcIiArIG1ha2VNb25nb05hbWUoZCkpO1xyXG4gICAgICBpZiAobWFrZU1vbmdvTmFtZShkKSA9PT0gbWFrZU1vbmdvTmFtZShtZ2RvbWFpbikpIHtcclxuICAgICAgICBkb21haW4gPSBkO1xyXG4gICAgICAgIGRlYnVnKCdnb3Qgb25lICcgKyBkKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gZG9tYWluO1xyXG4gIH1cclxuXHJcbiAgLypcclxuICAgIG1ha2VTY2hlbWEobWdkb21haW4gOiBzdHJpbmcpICA6IElQc2V1ZG9TY2hlbWEge1xyXG4gICAgICBkZWJ1ZygnbWFrZVNjaGVtYSBmb3IgJyArIG1nZG9tYWluKTtcclxuICAgICAvLyBjb25zb2xlLmxvZygnbWFrZXNjaGVtYSAnICsgbWdkb21haW4pO1xyXG4gICAgICB2YXIgZG9tYWluID0gdGhpcy5tb25nb29vc2VEb21haW5Ub0RvbWFpbihtZ2RvbWFpbik7XHJcbiAgICAgIGRlYnVnbG9nKCgpPT4gJyBkb21haW4gJyArIGRvbWFpbik7XHJcbiAgICAgIGRlYnVnbG9nKCgpPT4gYCBhbGwgZG9tYWlucyBgICsgdGhpcy5fbW9kZWwuZG9tYWlucy5qb2luKFwiOyBcIikpO1xyXG4gICAgICB2YXIgY2F0cyA9IE1vZGVsLmdldENhdGVnb3JpZXNGb3JEb21haW4odGhpcy5fbW9kZWwsIGRvbWFpbik7XHJcbiAgICAgIHZhciByZXMgPSB7fTtcclxuICAgICAgY2F0cy5mb3JFYWNoKGNhdCA9PiB7XHJcbiAgICAgICAgcmVzW21ha2VNb25nb05hbWUoY2F0KV0gPSB7IHR5cGUgOiBTdHJpbmd9O1xyXG4gICAgICB9KVxyXG4gICAgICByZXR1cm4gbmV3IElQc2V1ZG9TY2hlbWEocmVzKTtcclxuICAgIH1cclxuICAgICovXHJcbn1cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgTW9kZWxIYW5kbGUge1xyXG4gIF90aGVNb2RlbDogSUZNb2RlbC5JTW9kZWxzO1xyXG4gIF9tZ0JyaWRnZTogTW9uZ29CcmlkZ2U7XHJcbiAgX21vbmdvb3NlOiBJU3JjSGFuZGxlO1xyXG4gIGNvbnN0cnVjdG9yKHRoZU1vZGVsOiBJRk1vZGVsLklNb2RlbHMpIHtcclxuICAgIHRoaXMuX3RoZU1vZGVsID0gdGhlTW9kZWw7XHJcbiAgICB0aGlzLl9tb25nb29zZSA9IHRoaXMuX3RoZU1vZGVsLm1vbmdvSGFuZGxlICYmIHRoaXMuX3RoZU1vZGVsLm1vbmdvSGFuZGxlLnNyY0hhbmRsZTtcclxuICAgIHRoaXMuX21nQnJpZGdlID0gbmV3IE1vbmdvQnJpZGdlKHRoZU1vZGVsKTtcclxuICB9XHJcbiAgcXVlcnkoZG9tYWluOiBzdHJpbmcsIHF1ZXJ5OiBhbnkpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgdmFyIG1vZGVsbmFtZSA9IE1vZGVsLmdldE1vbmdvb3NlTW9kZWxOYW1lRm9yRG9tYWluKHRoaXMuX3RoZU1vZGVsLCBkb21haW4pO1xyXG4gICAgZGVidWdsb2coJ3F1ZXJ5ICcgKyBkb21haW4gKyAnID4+JyArIG1vZGVsbmFtZSArICcgJyArIEpTT04uc3RyaW5naWZ5KHF1ZXJ5LCB1bmRlZmluZWQsIDIpKTtcclxuICAgIHJldHVybiBnZXREQkNvbm5lY3Rpb24odGhpcy5fbW9uZ29vc2UpLnRoZW4oKHNyY0hhbmRsZSkgPT4ge1xyXG5cclxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICBQcm9taXNlLnJlc29sdmUoMSkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICBkZWJ1Z2xvZygnY29uc3RydWN0aW5nIG1vZGVsIGZvciAnICsgbW9kZWxuYW1lKTtcclxuICAgICAgICAgIGlmICh0aGF0Ll90aGVNb2RlbC5tb25nb0hhbmRsZS5zcmNIYW5kbGUubW9kZWxOYW1lcygpLmluZGV4T2YobW9kZWxuYW1lKSA8IDApIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAgJHtkb21haW59IC8gJHttb2RlbG5hbWV9IGlzIG5vdCBhIHByZXNlbnQgbW9kZWwgYCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICB2YXIgbW9kZWwgPSB0aGF0Ll90aGVNb2RlbC5tb25nb0hhbmRsZS5zcmNIYW5kbGUubW9kZWwobW9kZWxuYW1lKTtcclxuICAgICAgICAgIGRlYnVnbG9nKCgpID0+ICdoZXJlIG1vZGVsICcgKyBPYmplY3Qua2V5cyhtb2RlbCkpO1xyXG4gICAgICAgICAgdmFyIHJlc3EgPSBtb2RlbC5hZ2dyZWdhdGUocXVlcnkpLnRoZW4oKHJlcykgPT4ge1xyXG4gICAgICAgICAgICAvLyAgIGNvbnNvbGUubG9nKFwiaGVyZSB0aGUgcmVzdWx0XCIgKyBKU09OLnN0cmluZ2lmeShyZXMpKTtcclxuICAgICAgICAgICAgcmVzb2x2ZShyZXMpO1xyXG4gICAgICAgICAgICAvL2RiLmNsb3NlKCk7XHJcbiAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcclxuICAgICAgICAgICAgLy9kYi5jbG9zZSgpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSlcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluY0hhc2goaHNoLCBrZXkpIHtcclxuICBoc2hba2V5XSA9IChoc2hba2V5XSB8fCAwKSArIDE7XHJcbn1cclxuXHJcbi8qXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXREb21haW5Gb3JTZW50ZW5jZTIodGhlTW9kZWw6IElGTW9kZWwuSU1vZGVscywgc2VudGVuY2UgOiBJRkVyQmFzZS5JU2VudGVuY2UpIDoge1xyXG4gIGRvbWFpbjogc3RyaW5nLFxyXG4gICAgY29sbGVjdGlvbk5hbWU6IHN0cmluZyxcclxuICAgIG1vZGVsTmFtZTogc3RyaW5nXHJcbiAgfVxyXG57XHJcbiAgLy8gdGhpcyBpcyBzbG9wcHkgYW5kIGJhZFxyXG4gIHZhciByZXMgPSB7fTtcclxuICB2YXIgbyA9IDB4RkZGRkZGRjtcclxuICBzZW50ZW5jZS5mb3JFYWNoKHcgPT4ge1xyXG4gICAgaWYgKHcucnVsZS53b3JkVHlwZSA9PT0gSUZNb2RlbC5XT1JEVFlQRS5DQVRFR09SWSkge1xyXG4gICAgICBvID0gbyAmIHcucnVsZS5iaXRTZW50ZW5jZUFuZDtcclxuICAgIH1cclxuICAgIGlmICh3LnJ1bGUud29yZFR5cGUgPT09IElGTW9kZWwuV09SRFRZUEUuRkFDVCkge1xyXG4gICAgICBvID0gbyAmIHcucnVsZS5iaXRTZW50ZW5jZUFuZDtcclxuICAgIH1cclxuICB9KTtcclxuICB2YXIgZG9tYWlucyA9IE1vZGVsLmdldERvbWFpbnNGb3JCaXRGaWVsZCh0aGVNb2RlbCwgbyk7XHJcbiAgaWYgKGRvbWFpbnMubGVuZ3RoICE9PSAxKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ21vcmUgdGhhbiBvbmUgZG9tYWluOiBcIicgKyBkb21haW5zLmpvaW4oJ1wiLCBcIicpICsgJ1wiJyk7XHJcbiAgfVxyXG4gIGlmICghZG9tYWluc1swXSkge1xyXG4gICAgY29uc29sZS5sb2coJ3F1ZXJ5IHdpdGhvdXQgYSBkb21haW4gOiAnICsgU2VudGVuY2UuZHVtcE5pY2VBcnIoW3NlbnRlbmNlXSkpO1xyXG4gIH1cclxuICByZXR1cm4ge1xyXG4gICAgZG9tYWluOiBkb21haW5zWzBdLFxyXG4gICAgY29sbGVjdGlvbk5hbWU6IE1vZGVsLmdldE1vbmdvQ29sbGVjdGlvbk5hbWVGb3JEb21haW4odGhlTW9kZWwsIGRvbWFpbnNbMF0pLFxyXG4gICAgbW9kZWxOYW1lOiBNb2RlbC5nZXRNb2RlbE5hbWVGb3JEb21haW4odGhlTW9kZWwubW9uZ29IYW5kbGUsIGRvbWFpbnNbMF0pXHJcbiAgfVxyXG59O1xyXG5cclxuKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXREb21haW5Gb3JTZW50ZW5jZVNhZmUodGhlTW9kZWw6IElGTW9kZWwuSU1vZGVscywgc2VudGVuY2U6IElGRXJCYXNlLklTZW50ZW5jZSkgOiBzdHJpbmcge1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gZ2V0RG9tYWluSW5mb0ZvclNlbnRlbmNlKHRoZU1vZGVsLHNlbnRlbmNlKS5kb21haW47XHJcbiAgfSBjYXRjaChlKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIGdpdmVuIGEgU2VudGVuY2UsIG9idGFpbiB0aGUgZG9tYWluIGZvciBpdFxyXG4gKiBAcGFyYW0gdGhlTW9kZWxcclxuICogQHBhcmFtIHNlbnRlbmNlXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RG9tYWluSW5mb0ZvclNlbnRlbmNlKHRoZU1vZGVsOiBJRk1vZGVsLklNb2RlbHMsIHNlbnRlbmNlOiBJRkVyQmFzZS5JU2VudGVuY2UpOiB7XHJcbiAgZG9tYWluOiBzdHJpbmcsXHJcbiAgY29sbGVjdGlvbk5hbWU6IHN0cmluZyxcclxuICBtb2RlbE5hbWU6IHN0cmluZ1xyXG59IHtcclxuICAvLyB0aGlzIGlzIHNsb3BweSBhbmQgYmFkXHJcbiAgdmFyIHJlcyA9IHt9O1xyXG4gIHZhciBvID0gMHhGRkZGRkZGO1xyXG4gIHNlbnRlbmNlLmZvckVhY2godyA9PiB7XHJcbiAgICBpZiAody5ydWxlLndvcmRUeXBlID09PSBJRk1vZGVsLldPUkRUWVBFLkNBVEVHT1JZKSB7XHJcbiAgICAgIG8gPSBvICYgdy5ydWxlLmJpdFNlbnRlbmNlQW5kO1xyXG4gICAgICBNb2RlbC5nZXREb21haW5zRm9yQ2F0ZWdvcnkodGhlTW9kZWwsIHcubWF0Y2hlZFN0cmluZykuZm9yRWFjaChkID0+IHtcclxuICAgICAgICBpbmNIYXNoKHJlcywgZCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgaWYgKHcucnVsZS53b3JkVHlwZSA9PT0gSUZNb2RlbC5XT1JEVFlQRS5GQUNUKSB7XHJcbiAgICAgIG8gPSBvICYgdy5ydWxlLmJpdFNlbnRlbmNlQW5kO1xyXG4gICAgICAvLyAgIGNvbnNvbGUubG9nKGAke3cucnVsZS5iaXRpbmRleH0gJHt3LmJpdGluZGV4fSAke3cucnVsZS5iaXRTZW50ZW5jZUFuZH0gJHtvfSBgKTtcclxuICAgICAgTW9kZWwuZ2V0RG9tYWluc0ZvckNhdGVnb3J5KHRoZU1vZGVsLCB3LmNhdGVnb3J5KS5mb3JFYWNoKGQgPT4ge1xyXG4gICAgICAgIGluY0hhc2gocmVzLCBkKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgdmFyIGRvbWFpbnMgPSBNb2RlbC5nZXREb21haW5zRm9yQml0RmllbGQodGhlTW9kZWwsIG8pO1xyXG4gIGlmIChkb21haW5zLmxlbmd0aCAhPT0gMSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdtb3JlIHRoYW4gb25lIGRvbWFpbjogXCInICsgZG9tYWlucy5qb2luKCdcIiwgXCInKSArICdcIicpO1xyXG4gIH1cclxuICBpZiAoIWRvbWFpbnNbMF0pIHtcclxuICAgIGNvbnNvbGUubG9nKCdxdWVyeSB3aXRob3V0IGEgZG9tYWluIDogJyArIFNlbnRlbmNlLmR1bXBOaWNlQXJyKFtzZW50ZW5jZV0pKTtcclxuICB9XHJcbiAgcmV0dXJuIHtcclxuICAgIGRvbWFpbjogZG9tYWluc1swXSxcclxuICAgIGNvbGxlY3Rpb25OYW1lOiBNb2RlbC5nZXRNb25nb0NvbGxlY3Rpb25OYW1lRm9yRG9tYWluKHRoZU1vZGVsLCBkb21haW5zWzBdKSxcclxuICAgIG1vZGVsTmFtZTogTW9kZWwuZ2V0TW9kZWxOYW1lRm9yRG9tYWluKHRoZU1vZGVsLm1vbmdvSGFuZGxlLCBkb21haW5zWzBdKVxyXG4gIH1cclxufTtcclxuXHJcbi8vaW1wb3J0IHsgSUZFckJhc2UgYXMgSU1hdGNoLCBFckVycm9yIGFzIEVyRXJyb3IgfSBmcm9tICcuL21hdGNoL2luZGV4JztcclxuXHJcbmltcG9ydCAqIGFzIG1RIGZyb20gJy4vYXN0MnF1ZXJ5L2FzdDJNUXVlcnknO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTUmVzIHtcclxuICBzZW50ZW5jZTogSUZFckJhc2UuSVNlbnRlbmNlLFxyXG4gIHJlY29yZHM6IGFueVtdXHJcbn07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFFSZXN1bHQge1xyXG4gIGRvbWFpbjogc3RyaW5nLFxyXG4gIHNlbnRlbmNlOiBJRkVyQmFzZS5JU2VudGVuY2UsXHJcbiAgY29sdW1uczogc3RyaW5nW10sXHJcbiAgcmVzdWx0czogc3RyaW5nW11bXVxyXG59O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJUmVzdWx0UmVjb3JkICB7IFtrZXk6IHN0cmluZ10gOiBOdW1iZXIgfCBzdHJpbmcgfTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVF1ZXJ5UmVzdWx0IHtcclxuICBkb21haW46IHN0cmluZyxcclxuICBhdXggOiB7XHJcbiAgICBzZW50ZW5jZTogSUZFckJhc2UuSVNlbnRlbmNlLFxyXG4gICAgdG9rZW5zIDogc3RyaW5nW10sXHJcbiAgICBhc3Rub2RlPyA6IEFTVC5BU1ROb2RlXHJcbiAgfVxyXG4gIGVycm9ycyA6IGFueSwgIC8vIHVuZGVmaW5lZCBmb3Igb2sgcmVzdWx0XHJcbiAgLyoqXHJcbiAgICogQ29sdW1ucyByZWxldmFudCBmb3Igb3V0cHV0LCBpbiBcInF1ZXJ5XCIgLyBcInNlbnRlbmNlXCIgb3JkZXJcclxuICAgKi9cclxuICBjb2x1bW5zOiBzdHJpbmdbXSwgLy8gY29sdW1ucyByZWxldmFudCBmb3Igb3V0cHV0XHJcbiAgYXV4Y29sdW1ucz8gIDogc3RyaW5nW10sICAvLyBjb250YWlucyBhZGRpdGlvbmFsIGNvbHVtbnMsIHVzdWFsbHkgbm90IHByZXNlbnQhXHJcbiAgcmVzdWx0czogSVJlc3VsdFJlY29yZFtdXHJcbn07XHJcblxyXG5cclxuXHJcbmZ1bmN0aW9uIGdldERCQ29ubmVjdGlvbihtb25nb29zZUhuZGw6IElTcmNIYW5kbGUpOiBQcm9taXNlPElTcmNIYW5kbGU+e1xyXG4gIGlmIChtb25nb29zZUhuZGwpIHtcclxuICAgIGRlYnVnbG9nKCdhc3N1bWluZyBwcmVzZW50IGhhbmRsZScpO1xyXG4gICAgLy8gd2UgYXNzdW1lIHdlIGFyZSBjb25uZWN0ZWRcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobW9uZ29vc2VIbmRsKTtcclxuICB9XHJcbiAgdGhyb3cgRXJyb3IoJ2hvdyBpcyB0aGlzIGdvbm5hIHdvcmsnKTtcclxufVxyXG5cclxuaW1wb3J0ICogYXMgU2VudGVuY2VQYXJzZXIgZnJvbSAnLi9zZW50ZW5jZXBhcnNlcic7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElRdWVyeSB7XHJcbiAgZG9tYWluOiBzdHJpbmcsXHJcbiAgY29sdW1uczogc3RyaW5nW10sXHJcbiAgYXV4Y29sdW1ucz8gOiBzdHJpbmdbXSxcclxuICByZXZlcnNlTWFwOiBJUmV2ZXJzZU1hcCxcclxuICBxdWVyeTogYW55XHJcbn07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElQcmVwYXJlZFF1ZXJ5IGV4dGVuZHMgU2VudGVuY2VQYXJzZXIuSVBhcnNlZFNlbnRlbmNlcyB7XHJcbiAgcXVlcmllczogSVF1ZXJ5W11cclxufTtcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZUFnZ3JlZ2F0ZUZyb21Bc3QoYXN0bm9kZTogQVNULkFTVE5vZGUsIHNlbnRlbmNlOiBJRk1vZGVsLklXb3JkW10sXHJcbiAgbW9kZWxzIDogSUZNb2RlbC5JTW9kZWxzLFxyXG4gIG1vZGVsbmFtZSA6IHN0cmluZywgZml4ZWRDYXRlZ29yaWVzOiBzdHJpbmdbXSkge1xyXG4gIHZhciBub2RlRmllbGRMaXN0ID0gYXN0bm9kZS5jaGlsZHJlblswXS5jaGlsZHJlblswXTtcclxuICB2YXIgbm9kZUZpbHRlciA9IGFzdG5vZGUuY2hpbGRyZW5bMV07XHJcbiAgdmFyIG1vbmdvTWFwID0gdW5kZWZpbmVkIGFzIElGTW9kZWwuQ2F0TW9uZ29NYXA7XHJcbiAgbW9uZ29NYXAgPSBtb2RlbHMubW9uZ29IYW5kbGUubW9uZ29NYXBzW21vZGVsbmFtZV07XHJcbiAgdmFyIG1vZGVsSGFuZGxlUmF3ID0gbW9kZWxzLm1vbmdvSGFuZGxlO1xyXG5cclxuLy8gbWF0Y2ggLT4gbWF0Y2ggXHJcbi8vIHVud2luZCAtPiBleHBhbmQgcGVyIGFycmF5XHJcblxyXG4gIHZhciBleHBsaWNpdFNvcnQgPSBtUS5leHRyYWN0RXhwbGljaXRTb3J0RnJvbUFzdCggbm9kZUZpbHRlciwgc2VudGVuY2UsIG1vbmdvTWFwLCBtb2RlbG5hbWUsIG1vZGVsSGFuZGxlUmF3ICk7XHJcblxyXG4gIHZhciBtYXRjaCA9IG1RLm1ha2VNb25nb01hdGNoRnJvbUFzdChub2RlRmlsdGVyLCBzZW50ZW5jZSwgIG1vbmdvTWFwLCBtb2RlbG5hbWUsIG1vZGVsSGFuZGxlUmF3KTtcclxuICAvLyBUT0RPOiBiZSBiZXR0ZXIgdGhhbiBmdWxsIHVud2luZCwgdXNlIG9ubHkgcmVsZWx2YW50IGNhdGVnb3JpZXMhXHJcbiAgdmFyIHVud2luZCA9IE1vbmdvTWFwLnVud2luZHNGb3JOb250ZXJtaW5hbEFycmF5cyhtb25nb01hcCk7XHJcbiAgdmFyIGhlYWQgPSBbbWF0Y2hdIGFzIGFueVtdO1xyXG4gIGlmICh1bndpbmQubGVuZ3RoKSB7XHJcbiAgICBoZWFkID0gaGVhZC5jb25jYXQodW53aW5kKTtcclxuICAgIGhlYWQucHVzaChtYXRjaCk7XHJcbiAgfVxyXG4gIHZhciBjYXRlZ29yeUxpc3QgPSBtUS5nZXRDYXRlZ29yeUxpc3QoZml4ZWRDYXRlZ29yaWVzLCBub2RlRmllbGRMaXN0LCBzZW50ZW5jZSk7XHJcbiAgdmFyIGNhdGVnb3J5TGlzdFBsdXNFeHBsaWNpdFNvcnQgPSBtUS5hbWVuZENhdGVnb3J5TGlzdChleHBsaWNpdFNvcnQsIGNhdGVnb3J5TGlzdCk7XHJcbiAgdmFyIHByb2ogPSBtUS5tYWtlTW9uZ29Qcm9qZWN0aW9uRnJvbUFzdChjYXRlZ29yeUxpc3QsIG1vbmdvTWFwKTtcclxuICB2YXIgc29ydCA9IG1RLm1ha2VNb25nb1NvcnRGcm9tQXN0KGNhdGVnb3J5TGlzdCwgbW9uZ29NYXApO1xyXG4gIHZhciBncm91cCA9IG1RLm1ha2VNb25nb0dyb3VwRnJvbUFzdChjYXRlZ29yeUxpc3QsIG1vbmdvTWFwKTtcclxuICB2YXIgY29sdW1uc1JldmVyc2VNYXAgPSBtUS5tYWtlTW9uZ29Db2x1bW5zRnJvbUFzdChjYXRlZ29yeUxpc3QsIG1vbmdvTWFwKTtcclxuXHJcbiAgZGVidWdsb2coXCIgY2F0UGx1cyBcIiArIEpTT04uc3RyaW5naWZ5KGNhdGVnb3J5TGlzdFBsdXNFeHBsaWNpdFNvcnQpKTtcclxuICB2YXIgcHJvakV4cGxpY2l0ID0gbVEubWFrZU1vbmdvUHJvamVjdGlvbkZyb21Bc3QoY2F0ZWdvcnlMaXN0UGx1c0V4cGxpY2l0U29ydCwgbW9uZ29NYXApO1xyXG4gIHZhciBzb3J0RXhwbGljaXQgPSBtUS5tYWtlTW9uZ29FeHBsaWNpdFNvcnQoZXhwbGljaXRTb3J0LCBjYXRlZ29yeUxpc3QsIG1vbmdvTWFwKTtcclxuICB2YXIgZ3JvdXBFeHBsaWNpdCA9IG1RLm1ha2VNb25nb0dyb3VwRnJvbUFzdChjYXRlZ29yeUxpc3RQbHVzRXhwbGljaXRTb3J0LCBtb25nb01hcCk7XHJcbiAgLy8gICBjb25zb2xlLmxvZygnIHF1ZXJ5OiAnICsgSlNPTi5zdHJpbmdpZnkocikpOyAvLyBob3cgdG8gZ2V0IGRvbWFpbj9cclxuICAvLyB0ZXN0LmVxdWFsKGRvbWFpbiwgJ0Zpb3JpQk9NJywnIGdvdCBkb21haW4nKTtcclxuICBkZWJ1Z2xvZyhcIiBleHBsaWNpdFNvcnRcIiArIEpTT04uc3RyaW5naWZ5KGV4cGxpY2l0U29ydCkpO1xyXG4gIHZhciBxdWVyeSA9ICggZXhwbGljaXRTb3J0Lmxlbmd0aCA+IDApID9cclxuICAgICAgICBoZWFkLmNvbmNhdChbc29ydEV4cGxpY2l0LCBncm91cEV4cGxpY2l0LCBwcm9qRXhwbGljaXQsIHNvcnRFeHBsaWNpdCwgcHJvaiBdKVxyXG4gICAgICA6IGhlYWQuY29uY2F0KFtncm91cCwgcHJvaiwgc29ydF0pO1xyXG4gIHJldHVybiB7IHF1ZXJ5OiBxdWVyeSwgY29sdW1uc1JldmVyc2VNYXA6IGNvbHVtbnNSZXZlcnNlTWFwIH07XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZUFnZ3JlZ2F0ZUZyb21Bc3RPbGQoYXN0bm9kZTogQVNULkFTVE5vZGUsIHNlbnRlbmNlOiBJRk1vZGVsLklXb3JkW10sXHJcbiAgbW9kZWxzIDogSUZNb2RlbC5JTW9kZWxzLFxyXG4gIGNvbGxlY3Rpb25OYW1lIDogc3RyaW5nLCBmaXhlZENhdGVnb3JpZXM6IHN0cmluZ1tdKSB7XHJcbiAgdmFyIG5vZGVGaWVsZExpc3QgPSBhc3Rub2RlLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdO1xyXG4gIHZhciBub2RlRmlsdGVyID0gYXN0bm9kZS5jaGlsZHJlblsxXTtcclxuICB2YXIgbW9uZ29NYXAgPSB1bmRlZmluZWQgYXMgSUZNb2RlbC5DYXRNb25nb01hcDtcclxuICBtb25nb01hcCA9IG1vZGVscy5tb25nb0hhbmRsZS5tb25nb01hcHNbY29sbGVjdGlvbk5hbWVdO1xyXG4gIHZhciBtb2RlbEhhbmRsZVJhdyA9IG1vZGVscy5tb25nb0hhbmRsZTtcclxuICAvLyB0b2RvOiBkZXRlY3QgYW55IGV4cGxpY2l0IHNvcnRzXHJcbiAgLy8geyBzb3J0Q2FydGVnb3J5TGlzdCA6IFtcImNhdDFcIl0sXHJcbiAgLy8gIFsge2NhdDEgOiAxfSAseyBjYXQyIDogLTF9IF1cclxuICAvL1xyXG4gIC8vIHRoZW4gaWZmIGV4cGxpY2l0IHNvcnQsXHJcbiAgLy8gcHJvamVjdCBvdXQgY2F0K3NvcnRDYXJ0LCB0aGUgdGhlbiBzb3J0IGJ5IGl0LCBvbmx5IHRoZW4gcHJvamVjdCBvdXQgZGVzaXJlZGNhdFxyXG4gIC8vXHJcbiAgLy99Ly9cclxuICB2YXIgZXhwbGljaXRTb3J0ID0gbVEuZXh0cmFjdEV4cGxpY2l0U29ydEZyb21Bc3QoIG5vZGVGaWx0ZXIsIHNlbnRlbmNlLCBtb25nb01hcCwgY29sbGVjdGlvbk5hbWUsIG1vZGVsSGFuZGxlUmF3ICk7XHJcblxyXG4gIHZhciBtYXRjaCA9IG1RLm1ha2VNb25nb01hdGNoRnJvbUFzdChub2RlRmlsdGVyLCBzZW50ZW5jZSwgIG1vbmdvTWFwLCBjb2xsZWN0aW9uTmFtZSwgbW9kZWxIYW5kbGVSYXcpO1xyXG4gIC8vIFRPRE86IGJlIGJldHRlciB0aGFuIGZ1bGwgdW53aW5kLCB1c2Ugb25seSByZWxlbHZhbnQgY2F0ZWdvcmllcyFcclxuICB2YXIgdW53aW5kID0gTW9uZ29NYXAudW53aW5kc0Zvck5vbnRlcm1pbmFsQXJyYXlzKG1vbmdvTWFwKTtcclxuICB2YXIgaGVhZCA9IFttYXRjaF0gYXMgYW55W107XHJcbiAgaWYgKHVud2luZC5sZW5ndGgpIHtcclxuICAgIGhlYWQgPSBoZWFkLmNvbmNhdCh1bndpbmQpO1xyXG4gICAgaGVhZC5wdXNoKG1hdGNoKTtcclxuICB9XHJcbiAgdmFyIGNhdGVnb3J5TGlzdCA9IG1RLmdldENhdGVnb3J5TGlzdChmaXhlZENhdGVnb3JpZXMsIG5vZGVGaWVsZExpc3QsIHNlbnRlbmNlKTtcclxuICB2YXIgY2F0ZWdvcnlMaXN0UGx1c0V4cGxpY2l0U29ydCA9IG1RLmFtZW5kQ2F0ZWdvcnlMaXN0KGV4cGxpY2l0U29ydCwgY2F0ZWdvcnlMaXN0KTtcclxuICB2YXIgcHJvaiA9IG1RLm1ha2VNb25nb1Byb2plY3Rpb25Gcm9tQXN0KGNhdGVnb3J5TGlzdCwgbW9uZ29NYXApO1xyXG4gIHZhciBzb3J0ID0gbVEubWFrZU1vbmdvU29ydEZyb21Bc3QoY2F0ZWdvcnlMaXN0LCBtb25nb01hcCk7XHJcbiAgdmFyIGdyb3VwID0gbVEubWFrZU1vbmdvR3JvdXBGcm9tQXN0KGNhdGVnb3J5TGlzdCwgbW9uZ29NYXApO1xyXG4gIHZhciBjb2x1bW5zUmV2ZXJzZU1hcCA9IG1RLm1ha2VNb25nb0NvbHVtbnNGcm9tQXN0KGNhdGVnb3J5TGlzdCwgbW9uZ29NYXApO1xyXG5cclxuICBkZWJ1Z2xvZyhcIiBjYXRQbHVzIFwiICsgSlNPTi5zdHJpbmdpZnkoY2F0ZWdvcnlMaXN0UGx1c0V4cGxpY2l0U29ydCkpO1xyXG4gIHZhciBwcm9qRXhwbGljaXQgPSBtUS5tYWtlTW9uZ29Qcm9qZWN0aW9uRnJvbUFzdChjYXRlZ29yeUxpc3RQbHVzRXhwbGljaXRTb3J0LCBtb25nb01hcCk7XHJcbiAgdmFyIHNvcnRFeHBsaWNpdCA9IG1RLm1ha2VNb25nb0V4cGxpY2l0U29ydChleHBsaWNpdFNvcnQsIGNhdGVnb3J5TGlzdCwgbW9uZ29NYXApO1xyXG4gIHZhciBncm91cEV4cGxpY2l0ID0gbVEubWFrZU1vbmdvR3JvdXBGcm9tQXN0KGNhdGVnb3J5TGlzdFBsdXNFeHBsaWNpdFNvcnQsIG1vbmdvTWFwKTtcclxuICAvLyAgIGNvbnNvbGUubG9nKCcgcXVlcnk6ICcgKyBKU09OLnN0cmluZ2lmeShyKSk7IC8vIGhvdyB0byBnZXQgZG9tYWluP1xyXG4gIC8vIHRlc3QuZXF1YWwoZG9tYWluLCAnRmlvcmlCT00nLCcgZ290IGRvbWFpbicpO1xyXG4gIGRlYnVnbG9nKFwiIGV4cGxpY2l0U29ydFwiICsgSlNPTi5zdHJpbmdpZnkoZXhwbGljaXRTb3J0KSk7XHJcbiAgdmFyIHF1ZXJ5ID0gKCBleHBsaWNpdFNvcnQubGVuZ3RoID4gMCkgP1xyXG4gICAgICAgIGhlYWQuY29uY2F0KFtzb3J0RXhwbGljaXQsIGdyb3VwRXhwbGljaXQsIHByb2pFeHBsaWNpdCwgc29ydEV4cGxpY2l0LCBwcm9qIF0pXHJcbiAgICAgIDogaGVhZC5jb25jYXQoW2dyb3VwLCBwcm9qLCBzb3J0XSk7XHJcbiAgcmV0dXJuIHsgcXVlcnk6IHF1ZXJ5LCBjb2x1bW5zUmV2ZXJzZU1hcDogY29sdW1uc1JldmVyc2VNYXAgfTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb250YWluc0ZpeGVkQ2F0ZWdvcmllcyh0aGVNb2RlbDogSUZNb2RlbC5JTW9kZWxzLCBkb21haW46IHN0cmluZywgZml4ZWRDYXRlZ29yaWVzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xyXG4gIGlmIChmaXhlZENhdGVnb3JpZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcbiAgdmFyIGNhdHMgPSBNb2RlbC5nZXRDYXRlZ29yaWVzRm9yRG9tYWluKHRoZU1vZGVsLCBkb21haW4pO1xyXG4gIHJldHVybiBfLmludGVyc2VjdGlvbihjYXRzLCBmaXhlZENhdGVnb3JpZXMpLmxlbmd0aCA9PT0gZml4ZWRDYXRlZ29yaWVzLmxlbmd0aDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGF1Z21lbnRDYXRlZ29yaWVzV2l0aFVSSShmaXhlZENhdGVnb3JpZXMgOiBzdHJpbmdbXSwgdGhlTW9kZWwgOiBJRk1vZGVsLklNb2RlbHMsIGRvbWFpbiA6IHN0cmluZykgOiBzdHJpbmdbXSB7XHJcbiAgdmFyIHVyaXMgPSBNb2RlbC5nZXRTaG93VVJJQ2F0ZWdvcmllc0ZvckRvbWFpbih0aGVNb2RlbCwgZG9tYWluKTtcclxuICB2YXIgcmFua3MgPSBNb2RlbC5nZXRTaG93VVJJUmFua0NhdGVnb3JpZXNGb3JEb21haW4odGhlTW9kZWwsIGRvbWFpbik7XHJcbiAgcmV0dXJuIF8udW5pb24odXJpcywgcmFua3MsIGZpeGVkQ2F0ZWdvcmllcyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwcmVwYXJlUXVlcmllcyhxdWVyeTogc3RyaW5nLCB0aGVNb2RlbDogSUZNb2RlbC5JTW9kZWxzLCBmaXhlZENhdGVnb3JpZXM6IHN0cmluZ1tdLCBvcHRpb25zPyA6IElRdWVyeU9wdGlvbnMpOiBJUHJlcGFyZWRRdWVyeSB7XHJcbiAgZGVidWdsb2coYGhlcmUgcXVlcnk6ICR7cXVlcnl9YCk7XHJcbiAgdmFyIHIgPSBTZW50ZW5jZVBhcnNlci5wYXJzZVNlbnRlbmNlVG9Bc3RzKHF1ZXJ5LCB0aGVNb2RlbCwge30pOyAvLyB3b3Jkcyk7XHJcbiAgdmFyIHJlcyA9IE9iamVjdC5hc3NpZ24oe30sIHIpIGFzIElQcmVwYXJlZFF1ZXJ5O1xyXG4gIGRlYnVnbG9nKCAoKT0+ICcgcGFyc2VkICcgKyBKU09OLnN0cmluZ2lmeShyKSk7XHJcbiAgci5kb21haW5zID0gW107XHJcbiAgcmVzLnF1ZXJpZXMgPSByZXMuYXN0cy5tYXAoKGFzdG5vZGUsIGluZGV4KSA9PiB7XHJcbiAgICB2YXIgc2VudGVuY2UgPSByLnNlbnRlbmNlc1tpbmRleF07XHJcbiAgICBkZWJ1Z2xvZygoKSA9PiBgcmV0dXJuICBhc3QgWyR7aW5kZXh9XTpgICsgQVNULmFzdFRvVGV4dChhc3Rub2RlKSk7XHJcbiAgICBpZiAoIWFzdG5vZGUpIHtcclxuICAgICAgZGVidWdsb2coKCkgPT4gSlNPTi5zdHJpbmdpZnkoYCBlbXB0eSBub2RlIGZvciAke2luZGV4fSBgICsgSlNPTi5zdHJpbmdpZnkoci5lcnJvcnNbaW5kZXhdLCB1bmRlZmluZWQsIDIpKSk7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICB2YXIgZG9tYWluUGljayA9IGdldERvbWFpbkluZm9Gb3JTZW50ZW5jZSh0aGVNb2RlbCwgc2VudGVuY2UpO1xyXG4gICAgZGVidWdsb2coKCkgPT4gJyBkb21haW5QaWNrOiAnICsgSlNPTi5zdHJpbmdpZnkoZG9tYWluUGljaywgdW5kZWZpbmVkLCAyKSk7XHJcbiAgICB2YXIgZG9tYWluRml4ZWRDYXRlZ29yaWVzIDogc3RyaW5nW10gPSBbXTtcclxuICAgIGlmKG9wdGlvbnMgJiYgb3B0aW9ucy5zaG93VVJJKSB7XHJcbiAgICAgIGRvbWFpbkZpeGVkQ2F0ZWdvcmllcyA9IGF1Z21lbnRDYXRlZ29yaWVzV2l0aFVSSShmaXhlZENhdGVnb3JpZXMsIHRoZU1vZGVsLCBkb21haW5QaWNrLmRvbWFpbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkb21haW5GaXhlZENhdGVnb3JpZXMgPSBmaXhlZENhdGVnb3JpZXM7XHJcbiAgICB9XHJcbiAgICB2YXIgbW9uZ29NYXAgPSB0aGVNb2RlbC5tb25nb0hhbmRsZS5tb25nb01hcHNbZG9tYWluUGljay5jb2xsZWN0aW9uTmFtZV07XHJcbiAgICBpZiAoIWNvbnRhaW5zRml4ZWRDYXRlZ29yaWVzKHRoZU1vZGVsLCBkb21haW5QaWNrLmRvbWFpbiwgZG9tYWluRml4ZWRDYXRlZ29yaWVzKSkge1xyXG4gICAgICBkZWJ1Z2xvZygoKSA9PiBKU09OLnN0cmluZ2lmeShgIGZpeGVkIGZpZWxkcyBub3QgcHJlc2VudCBpbiBkb21haW4gJHtkb21haW5QaWNrLmRvbWFpbn0gZ2l2ZW4gZmllbGRzICR7ZG9tYWluRml4ZWRDYXRlZ29yaWVzLmpvaW4oXCI7XCIpfSBmb3IgJHtpbmRleH0gYCkpO1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgdmFyIHJlcyA9IG1ha2VBZ2dyZWdhdGVGcm9tQXN0KGFzdG5vZGUsIHNlbnRlbmNlLHRoZU1vZGVsLCBkb21haW5QaWNrLmNvbGxlY3Rpb25OYW1lLCBkb21haW5GaXhlZENhdGVnb3JpZXMpO1xyXG4gICAgdmFyIHF1ZXJ5ID0gcmVzLnF1ZXJ5O1xyXG4gICAgdmFyIGNvbHVtbnNSZXZlcnNlTWFwID0gcmVzLmNvbHVtbnNSZXZlcnNlTWFwO1xyXG4gICAgLypcclxuICAgICAgICB2YXIgbm9kZUZpZWxkTGlzdCA9IGFzdG5vZGUuY2hpbGRyZW5bMF0uY2hpbGRyZW5bMF07XHJcbiAgICAgICAgdmFyIG5vZGVGaWx0ZXIgPSBhc3Rub2RlLmNoaWxkcmVuWzFdO1xyXG4gICAgICAgIHZhciBtYXRjaCA9IG1RLm1ha2VNb25nb01hdGNoRnJvbUFzdChub2RlRmlsdGVyLCBzZW50ZW5jZSwgbW9uZ29NYXApO1xyXG5cclxuICAgIC8vIFRPRE86IGJlIGJldHRlciB0aGFuIGZ1bGwgdW53aW5kLCB1c2Ugb25seSByZWxlbHZhbnQgY2F0ZWdvcmllcyFcclxuICAgICAgICAgIHZhciBNb25nb21NYXAgPSBNb25nb01hcC51bndpbmRzRm9yTm9udGVybWluYWxBcnJheXMobW9uZ29NYXApO1xyXG5cclxuICAgICAgICB2YXIgcHJvaiA9IG1RLm1ha2VNb25nb1Byb2plY3Rpb25Gcm9tQXN0KG5vZGVGaWVsZExpc3QsIHNlbnRlbmNlLCBtb25nb01hcCk7XHJcbiAgICAgICAgdmFyIGNvbHVtbnNSZXZlcnNlTWFwPSBtUS5tYWtlTW9uZ29Db2x1bW5zRnJvbUFzdChub2RlRmllbGRMaXN0LCBzZW50ZW5jZSwgbW9uZ29NYXApO1xyXG4gICAgICAgIHZhciBncm91cCA9IG1RLm1ha2VNb25nb0dyb3VwRnJvbUFzdChub2RlRmllbGRMaXN0LCBzZW50ZW5jZSwgbW9uZ29NYXApO1xyXG4gICAgICAgIC8vICAgY29uc29sZS5sb2coJyBxdWVyeTogJyArIEpTT04uc3RyaW5naWZ5KHIpKTsgLy8gaG93IHRvIGdldCBkb21haW4/XHJcbiAgICAgICAvLyB0ZXN0LmVxdWFsKGRvbWFpbiwgJ0Zpb3JpQk9NJywnIGdvdCBkb21haW4nKTtcclxuICAgICAgICB2YXIgcXVlcnkgPSBbIG1hdGNoLCBncm91cCwgcHJvaiBdO1xyXG4gICAgICAqL1xyXG4gICAgci5kb21haW5zW2luZGV4XSA9IGRvbWFpblBpY2suZG9tYWluO1xyXG4gICAgZGVidWdsb2coKCkgPT4gYCBtb25nbyBxdWVyeSBmb3IgY29sbGVjdGlvbiAke2RvbWFpblBpY2suY29sbGVjdGlvbk5hbWV9IDogYCArIEpTT05TdHJpbmdpZnkocXVlcnkpKTtcclxuICAgIGRlYnVnbG9nKCgpID0+IGAgY29sdW1ubWFwIGAgKyBKU09OLnN0cmluZ2lmeShjb2x1bW5zUmV2ZXJzZU1hcCwgdW5kZWZpbmVkLCAyKSk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBkb21haW46IGRvbWFpblBpY2suZG9tYWluLFxyXG4gICAgICBjb2xsZWN0aW9uTmFtZTogZG9tYWluUGljay5jb2xsZWN0aW9uTmFtZSxcclxuICAgICAgY29sdW1uczogY29sdW1uc1JldmVyc2VNYXAuY29sdW1ucyxcclxuICAgICAgYXV4Y29sdW1ucyA6IFtdLCAvLyA/IC8vIFRPRE8gIGFsbGNvbHVtbnNcclxuICAgICAgcmV2ZXJzZU1hcDogY29sdW1uc1JldmVyc2VNYXAucmV2ZXJzZU1hcCxcclxuICAgICAgcXVlcnk6IHF1ZXJ5XHJcbiAgICB9O1xyXG4gIH0pO1xyXG4gIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIElQcm9jZXNzZWRNb25nb0Fuc3dlcnMgPSBJUXVlcnlSZXN1bHRbXTtcclxuLy9leHRlbmRzIElNYXRjaC5JUHJvY2Vzc2VkU2VudGVuY2VzIHtcclxuLy8gIHF1ZXJ5cmVzdWx0czogUVJlc3VsdFtdXHJcbi8vfVxyXG5cclxuLyogcmVzdWx0IGZvcm1hdCByZWRlc2lnbiAqL1xyXG4vKiAxKSBhYmlsaXR5IHRvIHRyYW5zcG9ydCB0aGUgQVNUICovXHJcbi8qIDIpIGFiaWxpdHkgdG8gdHJhbnNwb3J0IGF1eGlsaWFyeSBpbmZvcm1hdGlvbiAgKCBlLmcuIF91cmwgKSAgKi9cclxuLyogMykgcmVzdWx0IG9iamVjdHMgIG1hcCBbeyAgcHJvcCA6IHZhbHVlIH1dIGFzIHRoaXMgaXMgbW9yZSBuYXR1cmFsICwgbm90IHN0cmluZ1tdW10gKi9cclxuLyogc2luZ2xlIGFycmF5IG9mIFwiYWx0ZXJuYXRpbmcgb3B0aW9uc1wiICovXHJcblxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBxdWVyeVdpdGhBdXhDYXRlZ29yaWVzKHF1ZXJ5OiBzdHJpbmcsIHRoZU1vZGVsOiBJRk1vZGVsLklNb2RlbHMsIGF1eGlsaWFyeV9jYXRlZ29yaWVzIDogc3RyaW5nW10pOiBQcm9taXNlPElQcm9jZXNzZWRNb25nb0Fuc3dlcnM+IHtcclxuICB2YXIgaGFuZGxlID0gbmV3IE1vZGVsSGFuZGxlKHRoZU1vZGVsKTtcclxuICByZXR1cm4gcXVlcnlJbnRlcm5hbChxdWVyeSwgdGhlTW9kZWwsIGhhbmRsZSwgYXV4aWxpYXJ5X2NhdGVnb3JpZXMpO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHF1ZXJ5V2l0aFVSSShxdWVyeTogc3RyaW5nLCB0aGVNb2RlbDogSUZNb2RlbC5JTW9kZWxzLCBhdXhpbGlhcnlfY2F0ZWdvcmllcyA6IHN0cmluZ1tdKTogUHJvbWlzZTxJUHJvY2Vzc2VkTW9uZ29BbnN3ZXJzPiB7XHJcbiAgdmFyIGhhbmRsZSA9IG5ldyBNb2RlbEhhbmRsZSh0aGVNb2RlbCk7XHJcbiAgcmV0dXJuIHF1ZXJ5SW50ZXJuYWwocXVlcnksIHRoZU1vZGVsLCBoYW5kbGUsIFtdLCB7IHNob3dVUkkgOiB0cnVlIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcXVlcnkocXVlcnk6IHN0cmluZywgdGhlTW9kZWw6IElGTW9kZWwuSU1vZGVscyk6IFByb21pc2U8SVByb2Nlc3NlZE1vbmdvQW5zd2Vycz4ge1xyXG4gIHZhciBoYW5kbGUgPSBuZXcgTW9kZWxIYW5kbGUodGhlTW9kZWwpO1xyXG4gIHJldHVybiBxdWVyeUludGVybmFsKHF1ZXJ5LCB0aGVNb2RlbCwgaGFuZGxlLCBbXSk7XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIElSZXZlcnNlTWFwID0geyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZW1hcFJlY29yZChyZWMsIGNvbHVtbnM6IHN0cmluZ1tdLCByZXZlcnNlTWFwOiBJUmV2ZXJzZU1hcCk6IElSZXN1bHRSZWNvcmQge1xyXG4gIHZhciByID0ge307XHJcbiAgT2JqZWN0LmtleXMocmVjKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICB2YXIgdGFyZ2V0S2V5ID0gcmV2ZXJzZU1hcFtrZXldIHx8IGtleTtcclxuICAgIHJbdGFyZ2V0S2V5XSA9IHJlY1trZXldO1xyXG4gIH0pO1xyXG4gIHJldHVybiByOyAvLyBjb2x1bW5zLm1hcChjID0+IHJbY10pO1xyXG59O1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwcm9qZWN0UmVzdWx0VG9BcnJheSggcmVzOiBJUXVlcnlSZXN1bHQgKSA6IChzdHJpbmd8IE51bWJlcilbXVtdIHtcclxuICBkZWJ1Z2xvZygnIGZ1bGwgOicgKyBKU09OLnN0cmluZ2lmeShyZXMpKTtcclxuICByZXR1cm4gcmVzLnJlc3VsdHMubWFwKCByZWMgPT5cclxuICAgIHJlcy5jb2x1bW5zLm1hcChjID0+IHJlY1tjXSlcclxuICApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVtYXBSZXN1bHQocmVzLCBjb2x1bW5zOiBzdHJpbmdbXSwgcmV2ZXJzZU1hcDogSVJldmVyc2VNYXApOiBJUmVzdWx0UmVjb3JkW10ge1xyXG4gIHJldHVybiByZXMubWFwKHJlY29yZCA9PiByZW1hcFJlY29yZChyZWNvcmQsIGNvbHVtbnMsIHJldmVyc2VNYXApICk7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVF1ZXJ5T3B0aW9ucyB7XHJcbiAgc2hvd1VSSSA6IGJvb2xlYW5cclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBxdWVyeUludGVybmFsKHF1ZXJ5c3RyaW5nOiBzdHJpbmcsIHRoZU1vZGVsOiBJRk1vZGVsLklNb2RlbHMsIGhhbmRsZTogTW9kZWxIYW5kbGUsIGZpeGVkRmllbGRzOiBzdHJpbmdbXSwgb3B0aW9ucz8gOklRdWVyeU9wdGlvbnMgKTpcclxuICBQcm9taXNlPElQcm9jZXNzZWRNb25nb0Fuc3dlcnM+IHtcclxuICBmaXhlZEZpZWxkcyA9IGZpeGVkRmllbGRzIHx8IFtdO1xyXG4gIHZhciByID0gcHJlcGFyZVF1ZXJpZXMocXVlcnlzdHJpbmcsIHRoZU1vZGVsLCBmaXhlZEZpZWxkcywgb3B0aW9ucyk7XHJcbiAgZGVidWdsb2coKCk9PiAnaGVyZSBwcmVwYXJlZCBxdWVyaWVzOiAnICsgSlNPTi5zdHJpbmdpZnkocikpO1xyXG4gIGlmKHIucXVlcmllcy5sZW5ndGggPT09IDApIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmU8SVByb2Nlc3NlZE1vbmdvQW5zd2Vycz4oXHJcbiAgICAgIFt7XHJcbiAgICAgICAgZG9tYWluIDogdW5kZWZpbmVkLFxyXG4gICAgICAgIGF1eCA6IHsgc2VudGVuY2UgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICB0b2tlbnMgOiByLnRva2VucyB9LFxyXG4gICAgICAgIGVycm9ycyA6IHIuZXJyb3JzLFxyXG4gICAgICAgIGNvbHVtbnMgOiBbXSxcclxuICAgICAgICBhdXhjb2x1bW5zIDogW10sXHJcbiAgICAgICAgcmVzdWx0cyA6IFtdXHJcbiAgICAgIH1dXHJcbiAgICApO1xyXG4gIH07XHJcbiAgdmFyIGFQcm9taXNlcyA9IHIucXVlcmllcy5tYXAoKHF1ZXJ5LCBpbmRleCkgPT4ge1xyXG4gICAgZGVidWdsb2coKCkgPT4gYHF1ZXJ5ICR7aW5kZXh9IHByZXBhcmVkIGZvciBkb21haW4gYCArIChxdWVyeSAmJiBxdWVyeS5kb21haW4pKTtcclxuICAgIGRlYnVnbG9nKCgpID0+IGBxdWVyeSAke2luZGV4fSBwcmVwYXJlZCBmb3IgZG9tYWluIGAgKyAocXVlcnkgJiYgcXVlcnkuZG9tYWluICYmIGdldERvbWFpbkZvclNlbnRlbmNlU2FmZSh0aGVNb2RlbCxyLnNlbnRlbmNlc1tpbmRleF0pKSk7XHJcblxyXG4gICAgaWYgKHF1ZXJ5ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICAvLyBUT0RPIG1heSBub3QgYWx3YXlzIGJlIHBvc3NpYmxlXHJcbiAgICAgICAgZG9tYWluIDogZ2V0RG9tYWluRm9yU2VudGVuY2VTYWZlKHRoZU1vZGVsLHIuc2VudGVuY2VzW2luZGV4XSksXHJcbiAgICAgICAgYXV4IDoge1xyXG4gICAgICAgICAgc2VudGVuY2U6IHIuc2VudGVuY2VzW2luZGV4XSxcclxuICAgICAgICAgIHRva2VucyA6IHIudG9rZW5zXHJcbiAgICAgICAgfSxcclxuICAgICAgICBlcnJvcnMgOiByLmVycm9yc1tpbmRleF0sXHJcbiAgICAgICAgY29sdW1uczogW10sXHJcbiAgICAgICAgYXV4Y29sdW1uczogW10sXHJcbiAgICAgICAgcmVzdWx0czogW11cclxuICAgICAgfSAvL2FzIElRdWVyeVJlc3VsdFxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGhhbmRsZS5xdWVyeShxdWVyeS5kb21haW4sIHF1ZXJ5LnF1ZXJ5KS50aGVuKHJlcyA9PiB7XHJcbiAgICAgIHZhciByZXNDbGVhbiA9IHJlbWFwUmVzdWx0KHJlcywgci5xdWVyaWVzW2luZGV4XS5jb2x1bW5zLCBxdWVyeS5yZXZlcnNlTWFwKTtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBkb21haW4gOiBxdWVyeS5kb21haW4sXHJcbiAgICAgICAgYXV4IDoge1xyXG4gICAgICAgICAgc2VudGVuY2U6IHIuc2VudGVuY2VzW2luZGV4XSxcclxuICAgICAgICAgIHRva2VucyA6IHIudG9rZW5zXHJcbiAgICAgICAgfSxcclxuICAgICAgICBlcnJvcnMgOiByLmVycm9yc1tpbmRleF0sXHJcbiAgICAgICAgY29sdW1uczogci5xdWVyaWVzW2luZGV4XS5jb2x1bW5zLFxyXG4gICAgICAgIGF1eGNvbHVtbnMgOiByLnF1ZXJpZXNbaW5kZXhdLmF1eGNvbHVtbnMsXHJcbiAgICAgICAgcmVzdWx0czogcmVzQ2xlYW5cclxuICAgICAgfSBhcyBJUXVlcnlSZXN1bHRcclxuICAgIH0pXHJcbiAgfVxyXG4gICk7XHJcbiAgdmFyIHUgPSBQcm9taXNlLmFsbDxJUXVlcnlSZXN1bHQ+KGFQcm9taXNlcyk7XHJcbiAgdmFyIGsgPSB1LnRoZW48SVByb2Nlc3NlZE1vbmdvQW5zd2Vycz4oYVJlcyA9PiB7XHJcbiAgICBkZWJ1Z2xvZyhcIioqKmhlcmUgcmVzdWx0cyBvZiBhbGwgcXVlcmllcyBcIiArIEpTT04uc3RyaW5naWZ5KGFSZXMsIHVuZGVmaW5lZCwgMikpO1xyXG4gICAgdmFyIHF1ZXJ5cmVzdWx0cyA9IGFSZXM7IC8vIG1lcmdlUmVzdWx0cyhhUmVzKTtcclxuICAgIHJldHVybiBxdWVyeXJlc3VsdHM7XHJcbiAgfVxyXG4gICk7XHJcbiAgcmV0dXJuIGs7XHJcbn1cclxuXHJcblxyXG4vKlxyXG5cclxuXHJcbiAgICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElXaGF0SXNUdXBlbEFuc3dlciB7XHJcbiAgICAgICAgICAgICAgc2VudGVuY2U6IElTZW50ZW5jZTtcclxuICAgICAgICAgICAgICByZWNvcmQ6IElSZWNvcmQ7XHJcbiAgICAgICAgICAgICAgY2F0ZWdvcmllczogc3RyaW5nW107XHJcbiAgICAgICAgICAgICAgcmVzdWx0OiBzdHJpbmdbXTtcclxuICAgICAgICAgICAgICBfcmFua2luZzogbnVtYmVyO1xyXG4gICAgICAgICAgfVxyXG5cclxuXHJcblxyXG5cclxuXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIC8vICBsb2dQZXJmKCdsaXN0QWxsV2l0aENvbnRleHQnKTtcclxuICAvLyAgcGVyZmxvZyhcInRvdGFsTGlzdEFsbFdpdGhDb250ZXh0XCIpO1xyXG4gICAgdmFyIGFTZW50ZW5jZXNSZWluZm9yY2VkID0gYW5hbHl6ZUNvbnRleHRTdHJpbmcoY29udGV4dFF1ZXJ5U3RyaW5nLCBhUnVsZXMpO1xyXG4gIC8vICBwZXJmbG9nKFwiTEFUV0MgbWF0Y2hpbmcgcmVjb3JkcyAocz1cIiArIGFTZW50ZW5jZXNSZWluZm9yY2VkLnNlbnRlbmNlcy5sZW5ndGggKyBcIikuLi5cIik7XHJcbiAgICB2YXIgbWF0Y2hlZEFuc3dlcnMgPSBXaGF0SXMubWF0Y2hSZWNvcmRzUXVpY2tNdWx0aXBsZUNhdGVnb3JpZXMoYVNlbnRlbmNlc1JlaW5mb3JjZWQsIGNhdGVnb3JpZXMsIHJlY29yZHMsIGRvbWFpbkNhdGVnb3J5RmlsdGVyKTsgLy9hVG9vbDogQXJyYXk8SU1hdGNoLklUb29sPik6IGFueSAvKiBvYmplY3RzdHJlYW0gKiAvIHtcclxuICAgIGlmKGRlYnVnbG9nLmVuYWJsZWQpe1xyXG4gICAgICBkZWJ1Z2xvZyhcIiBtYXRjaGVkIEFuc3dlcnNcIiArIEpTT04uc3RyaW5naWZ5KG1hdGNoZWRBbnN3ZXJzLCB1bmRlZmluZWQsIDIpKTtcclxuICAgIH1cclxuICAvLyAgcGVyZmxvZyhcImZpbHRlcmluZyB0b3BSYW5rZWQgKGE9XCIgKyBtYXRjaGVkQW5zd2Vycy50dXBlbGFuc3dlcnMubGVuZ3RoICsgXCIpLi4uXCIpO1xyXG4gLy8gICB2YXIgbWF0Y2hlZEZpbHRlcmVkID0gV2hhdElzLmZpbHRlck9ubHlUb3BSYW5rZWRUdXBlbChtYXRjaGVkQW5zd2Vycy50dXBlbGFuc3dlcnMpO1xyXG4gLy8gICBpZiAoZGVidWdsb2cuZW5hYmxlZCkge1xyXG4gLy8gICAgIGRlYnVnbG9nKFwiTEFUV0MgbWF0Y2hlZCB0b3AtcmFua2VkIEFuc3dlcnNcIiArIEpTT04uc3RyaW5naWZ5KG1hdGNoZWRGaWx0ZXJlZCwgdW5kZWZpbmVkLCAyKSk7XHJcbiAvLyAgIH1cclxuICB9XHJcbn1cclxuKi8iXX0=
