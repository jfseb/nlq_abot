/**
 *
 * @module jfseb.fdevstart.analyze
 * @file analyze.ts
 * @copyright (c) 2016 Gerd Forstmann
 */


import * as debug from 'debugf';

const debuglog = debug('mongoqueries');
import * as logger from '../utils/logger';
var logPerf = logger.perf("mongoqueries");
var perflog = debug('perf');
//const perflog = logger.perf("perflistall");

import * as Utils from 'abot_utils';
import * as _ from 'lodash';
import * as IMatch from './ifmatch';

import { BreakDown } from '../model/index_model';

import { Sentence as Sentence } from '../index_parser';;

import { Word as Word } from '../index_parser';;
import * as Operator from './operator';
import * as WhatIs from './whatis';
import { ErError as ErError } from '../index_parser';;
import { Model } from '../model/index_model';
import { MongoQ as MongoQ } from '../index_parser';;

var sWords = {};

/* we have sentences */
/* sentences lead to queries */
/* queries have columns, results */

export function listAll(query: string, theModel: IMatch.IModels): Promise<MongoQ.IProcessedMongoAnswers> {
  return MongoQ.query(query, theModel).then(
    res => {
      debuglog(() => 'got a query result' + JSON.stringify(res, undefined, 2));
      return res;
    }
  );
}
      /*
      var tupelanswers = [] as IMatch.IWhatIsTupelAnswer[];
      res.queryresults.map((qr, index) => {
        qr.results.forEach(function (result) {
          tupelanswers.push({
            record: {},
            categories: qr.columns,
            sentence: qr.sentence,
            result: result,
            _ranking: 1.0 // res.sentences[index]._ranking
          });
        });
      });
      return {
        tupelanswers: tupelanswers,
        errors: res.errors,
        tokens: res.tokens
      }
    }
  )
}

/**
 * Query for a showMe result
 * @param query
 * @param theModel
 */
export function listShowMe(query: string, theModel: IMatch.IModels): Promise<MongoQ.IProcessedMongoAnswers> {
  // Todo: preprocess query
  // Show me FAct =>  url with CAT is FACT
  //
  return MongoQ.queryWithURI(query, theModel, []).then(
    res => {
      debuglog(() => 'got a query result' + JSON.stringify(res, undefined, 2));
      // we find the "best" uri
      var bestURI = undefined;
      res.forEach((qr, index) => {
        var domain = qr.domain;
        if (!bestURI && qr.results.length && domain) {
          var uriCategories = Model.getShowURICategoriesForDomain(theModel, domain);
          var uriCategory = uriCategories[0];
          // EXTEND: do some priorization and search for all
          if (uriCategory &&
              (( qr.columns.indexOf(uriCategory) >= 0)
              || qr.auxcolumns.indexOf(uriCategory) >= 0))
            {
            //var colIndex = qr.columns.indexOf(showMeCategories[0]);
            qr.results.forEach(res => {
              debuglog(()=> 'result + ' + JSON.stringify(res));
              if (!bestURI && res[uriCategory]) {
                bestURI = res[uriCategory];
              }
            });
          }
        }
      });
      return Object.assign(res, { bestURI: bestURI });
    }
  );
}
