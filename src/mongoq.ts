'use strict'
/**
 * @file
 * @module jfseb.mgnlq_parser1.mongoq
 * @copyright (c) 2016-2109 Gerd Forstmann
 *
 * database connectivity and querying
 */


import { Sentence as Sentence, IFErBase as IFErBase } from './match/er_index';
import { IFModel as IFModel, Model as Model, MongoMap as MongoMap } from './model/index_model';

import * as debug from 'debugf';
import * as _ from 'lodash';

const debuglog = debug('mongoq');

import * as chevrotain from 'chevrotain';
import * as AST from './ast';

import { ASTNodeType as NT } from './ast';

var createToken = chevrotain.createToken;
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;





import { ISrcHandle } from './model/srchandle';

import * as process from 'process';



export function JSONStringify(obj: any): string {
  function customSer(key, value) {
    if (value instanceof RegExp)
      return (value.toString());
    else
      return value;
  }
  return JSON.stringify(obj, customSer, 2);
}

process.on(

  "unhandledRejection",

  function handleWarning(reason, promise) {
    console.log("[PROCESS] Unhandled Promise Rejection");
    console.log("- - - - - - - - - - - - - - - - - - -");
    console.log(reason);
    console.log('');
  }

);

export function makeMongoName(s: string): string {
  return s.replace(/[^a-zA-Z0-9]/g, '_');
}

//var mongodb = process.env.ABOT_MONGODB || "testmodel";


//(<any>srcHandle).Promise = global.Promise;

//var db = srcHandle.connection;

export class MongoBridge {
  _model: IFModel.IModels;
  constructor(model: IFModel.IModels) {
    this._model = model;
  }
  mongoooseDomainToDomain(mgdomain: string): string {
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

  /*
    makeSchema(mgdomain : string)  : IPseudoSchema {
      debug('makeSchema for ' + mgdomain);
     // console.log('makeschema ' + mgdomain);
      var domain = this.mongoooseDomainToDomain(mgdomain);
      debuglog(()=> ' domain ' + domain);
      debuglog(()=> ` all domains ` + this._model.domains.join("; "));
      var cats = Model.getCategoriesForDomain(this._model, domain);
      var res = {};
      cats.forEach(cat => {
        res[makeMongoName(cat)] = { type : String};
      })
      return new IPseudoSchema(res);
    }
    */
}


export class ModelHandle {
  _theModel: IFModel.IModels;
  _mgBridge: MongoBridge;
  _mongoose: ISrcHandle;
  constructor(theModel: IFModel.IModels) {
    this._theModel = theModel;
    this._mongoose = this._theModel.mongoHandle && this._theModel.mongoHandle.srcHandle;
    this._mgBridge = new MongoBridge(theModel);
  }
  query(domain: string, query: any): Promise<any> {
    var that = this;
    var modelname = Model.getMongooseModelNameForDomain(this._theModel, domain);
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
    })
  }
}

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

export function getDomainForSentenceSafe(theModel: IFModel.IModels, sentence: IFErBase.ISentence) : string {
  try {
    return getDomainInfoForSentence(theModel,sentence).domain;
  } catch(e) {
    return undefined;
  }
}

/**
 * given a Sentence, obtain the domain for it
 * @param theModel
 * @param sentence
 */
export function getDomainInfoForSentence(theModel: IFModel.IModels, sentence: IFErBase.ISentence): {
  domain: string,
  collectionName: string,
  modelName: string
} {
  // this is sloppy and bad
  var res = {};
  var o = 0xFFFFFFF;
  sentence.forEach(w => {
    if (w.rule.wordType === IFModel.WORDTYPE.CATEGORY) {
      o = o & w.rule.bitSentenceAnd;
      Model.getDomainsForCategory(theModel, w.matchedString).forEach(d => {
        incHash(res, d);
      });
    }
    if (w.rule.wordType === IFModel.WORDTYPE.FACT) {
      o = o & w.rule.bitSentenceAnd;
      //   console.log(`${w.rule.bitindex} ${w.bitindex} ${w.rule.bitSentenceAnd} ${o} `);
      Model.getDomainsForCategory(theModel, w.category).forEach(d => {
        incHash(res, d);
      });
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

//import { IFErBase as IMatch, ErError as ErError } from './match/index';

import * as mQ from './ast2query/ast2MQuery';

export interface SRes {
  sentence: IFErBase.ISentence,
  records: any[]
};

export interface QResult {
  domain: string,
  sentence: IFErBase.ISentence,
  columns: string[],
  results: string[][]
};

export interface IResultRecord  { [key: string] : Number | string };

export interface IQueryResult {
  domain: string,
  aux : {
    sentence: IFErBase.ISentence,
    tokens : string[],
    astnode? : AST.ASTNode
  }
  errors : any,  // undefined for ok result
  /**
   * Columns relevant for output, in "query" / "sentence" order
   */
  columns: string[], // columns relevant for output
  auxcolumns?  : string[],  // contains additional columns, usually not present!
  results: IResultRecord[]
};



function getDBConnection(mongooseHndl: ISrcHandle): Promise<ISrcHandle>{
  if (mongooseHndl) {
    debuglog('assuming present handle');
    // we assume we are connected
    return Promise.resolve(mongooseHndl);
  }
  throw Error('how is this gonna work');
}

import * as SentenceParser from './sentenceparser';

export interface IQuery {
  domain: string,
  columns: string[],
  auxcolumns? : string[],
  reverseMap: IReverseMap,
  query: any
};

export interface IPreparedQuery extends SentenceParser.IParsedSentences {
  queries: IQuery[]
};


export function makeAggregateFromAst(astnode: AST.ASTNode, sentence: IFModel.IWord[],
  models : IFModel.IModels,
  modelname : string, fixedCategories: string[]) {
  var nodeFieldList = astnode.children[0].children[0];
  var nodeFilter = astnode.children[1];
  var mongoMap = undefined as IFModel.CatMongoMap;
  mongoMap = models.mongoHandle.mongoMaps[modelname];
  var modelHandleRaw = models.mongoHandle;

// match -> match 
// unwind -> expand per array

  var explicitSort = mQ.extractExplicitSortFromAst( nodeFilter, sentence, mongoMap, modelname, modelHandleRaw );

  var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence,  mongoMap, modelname, modelHandleRaw);
  // TODO: be better than full unwind, use only relelvant categories!
  var unwind = MongoMap.unwindsForNonterminalArrays(mongoMap);
  var head = [match] as any[];
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
  var query = ( explicitSort.length > 0) ?
        head.concat([sortExplicit, groupExplicit, projExplicit, sortExplicit, proj ])
      : head.concat([group, proj, sort]);
  return { query: query, columnsReverseMap: columnsReverseMap };
}

export function containsFixedCategories(theModel: IFModel.IModels, domain: string, fixedCategories: string[]): boolean {
  if (fixedCategories.length === 0) {
    return true;
  }
  var cats = Model.getCategoriesForDomain(theModel, domain);
  return _.intersection(cats, fixedCategories).length === fixedCategories.length;
}

export function augmentCategoriesWithURI(fixedCategories : string[], theModel : IFModel.IModels, domain : string) : string[] {
  var uris = Model.getShowURICategoriesForDomain(theModel, domain);
  var ranks = Model.getShowURIRankCategoriesForDomain(theModel, domain);
  return _.union(uris, ranks, fixedCategories);
}

export function prepareQueries(query: string, theModel: IFModel.IModels, fixedCategories: string[], options? : IQueryOptions): IPreparedQuery {
  debuglog(`here query: ${query}`);
  var r = SentenceParser.parseSentenceToAsts(query, theModel, {}); // words);
  var res = Object.assign({}, r) as IPreparedQuery;
  debuglog( ()=> ' parsed ' + JSON.stringify(r));
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
    var domainFixedCategories : string[] = [];
    if(options && options.showURI) {
      domainFixedCategories = augmentCategoriesWithURI(fixedCategories, theModel, domainPick.domain);
    } else {
      domainFixedCategories = fixedCategories;
    }
    var mongoMap = theModel.mongoHandle.mongoMaps[domainPick.collectionName];
    if (!containsFixedCategories(theModel, domainPick.domain, domainFixedCategories)) {
      debuglog(() => JSON.stringify(` fixed fields not present in domain ${domainPick.domain} given fields ${domainFixedCategories.join(";")} for ${index} `));
      return undefined;
    }
    var res = makeAggregateFromAst(astnode, sentence,theModel, domainPick.collectionName, domainFixedCategories);
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
      auxcolumns : [], // ? // TODO  allcolumns
      reverseMap: columnsReverseMap.reverseMap,
      query: query
    };
  });
  return res;
}

export type IProcessedMongoAnswers = IQueryResult[];
//extends IMatch.IProcessedSentences {
//  queryresults: QResult[]
//}

/* result format redesign */
/* 1) ability to transport the AST */
/* 2) ability to transport auxiliary information  ( e.g. _url )  */
/* 3) result objects  map [{  prop : value }] as this is more natural , not string[][] */
/* single array of "alternating options" */



export function queryWithAuxCategories(query: string, theModel: IFModel.IModels, auxiliary_categories : string[]): Promise<IProcessedMongoAnswers> {
  var handle = new ModelHandle(theModel);
  return queryInternal(query, theModel, handle, auxiliary_categories);
}


export function queryWithURI(query: string, theModel: IFModel.IModels, auxiliary_categories : string[]): Promise<IProcessedMongoAnswers> {
  var handle = new ModelHandle(theModel);
  return queryInternal(query, theModel, handle, [], { showURI : true });
}

export function query(query: string, theModel: IFModel.IModels): Promise<IProcessedMongoAnswers> {
  var handle = new ModelHandle(theModel);
  return queryInternal(query, theModel, handle, []);
}

export type IReverseMap = { [key: string]: string };

export function remapRecord(rec, columns: string[], reverseMap: IReverseMap): IResultRecord {
  var r = {};
  Object.keys(rec).forEach(key => {
    var targetKey = reverseMap[key] || key;
    r[targetKey] = rec[key];
  });
  return r; // columns.map(c => r[c]);
};


export function projectResultToArray( res: IQueryResult ) : (string| Number)[][] {
  debuglog(' full :' + JSON.stringify(res));
  return res.results.map( rec =>
    res.columns.map(c => rec[c])
  );
}

export function remapResult(res, columns: string[], reverseMap: IReverseMap): IResultRecord[] {
  return res.map(record => remapRecord(record, columns, reverseMap) );
}

export interface IQueryOptions {
  showURI : boolean
};

export function queryInternal(querystring: string, theModel: IFModel.IModels, handle: ModelHandle, fixedFields: string[], options? :IQueryOptions ):
  Promise<IProcessedMongoAnswers> {
  fixedFields = fixedFields || [];
  var r = prepareQueries(querystring, theModel, fixedFields, options);
  debuglog(()=> 'here prepared queries: ' + JSON.stringify(r));
  if(r.queries.length === 0) {
    return Promise.resolve<IProcessedMongoAnswers>(
      [{
        domain : undefined,
        aux : { sentence : undefined,
          tokens : r.tokens },
        errors : r.errors,
        columns : [],
        auxcolumns : [],
        results : []
      }]
    );
  };
  var aPromises = r.queries.map((query, index) => {
    debuglog(() => `query ${index} prepared for domain ` + (query && query.domain));
    debuglog(() => `query ${index} prepared for domain ` + (query && query.domain && getDomainForSentenceSafe(theModel,r.sentences[index])));

    if (query === undefined) {
      return {
        // TODO may not always be possible
        domain : getDomainForSentenceSafe(theModel,r.sentences[index]),
        aux : {
          sentence: r.sentences[index],
          tokens : r.tokens
        },
        errors : r.errors[index],
        columns: [],
        auxcolumns: [],
        results: []
      } //as IQueryResult
    }
    return handle.query(query.domain, query.query).then(res => {
      var resClean = remapResult(res, r.queries[index].columns, query.reverseMap);
      return {
        domain : query.domain,
        aux : {
          sentence: r.sentences[index],
          tokens : r.tokens
        },
        errors : r.errors[index],
        columns: r.queries[index].columns,
        auxcolumns : r.queries[index].auxcolumns,
        results: resClean
      } as IQueryResult
    })
  }
  );
  var u = Promise.all<IQueryResult>(aPromises);
  var k = u.then<IProcessedMongoAnswers>(aRes => {
    debuglog("***here results of all queries " + JSON.stringify(aRes, undefined, 2));
    var queryresults = aRes; // mergeResults(aRes);
    return queryresults;
  }
  );
  return k;
}


/*


          export interface IWhatIsTupelAnswer {
              sentence: ISentence;
              record: IRecord;
              categories: string[];
              result: string[];
              _ranking: number;
          }





      });
    }
  //  logPerf('listAllWithContext');
  //  perflog("totalListAllWithContext");
    var aSentencesReinforced = analyzeContextString(contextQueryString, aRules);
  //  perflog("LATWC matching records (s=" + aSentencesReinforced.sentences.length + ")...");
    var matchedAnswers = WhatIs.matchRecordsQuickMultipleCategories(aSentencesReinforced, categories, records, domainCategoryFilter); //aTool: Array<IMatch.ITool>): any /* objectstream * / {
    if(debuglog.enabled){
      debuglog(" matched Answers" + JSON.stringify(matchedAnswers, undefined, 2));
    }
  //  perflog("filtering topRanked (a=" + matchedAnswers.tupelanswers.length + ")...");
 //   var matchedFiltered = WhatIs.filterOnlyTopRankedTupel(matchedAnswers.tupelanswers);
 //   if (debuglog.enabled) {
 //     debuglog("LATWC matched top-ranked Answers" + JSON.stringify(matchedFiltered, undefined, 2));
 //   }
  }
}
*/