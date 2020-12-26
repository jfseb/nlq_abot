/**
 * @file word
 * @module jfseb.fdevstart.sentence
 * @copyright (c) Gerd Forstmann
 *
 * Word specific qualifications,
 *
 * These functions expose parf the underlying model,
 * e.g.
 * Match a tool record on a sentence,
 *
 * This will unify matching required and optional category words
 * with the requirements of the tool.
 *
 */

// <reference path="../../lib/node-4.d.ts" />

// import * as debug from 'debug';

// import * as utils from '../utils/utils';

import * as IMatch from './iferbase';
import { IFModel } from '../model/index_model';


import * as debug from 'debugf';

var debuglog = debug('word');

export const Category = {
  CAT_CATEGORY :  "category",
  CAT_DOMAIN :  "domain",
  CAT_OPERATOR : "operator",
  CAT_FILLER : "filler",
  CAT_NUMBER : "number",
  CAT_TOOL : "tool",
  CAT_ANY  : "any",
  _aCatFillers : ["filler"],
  isDomain : function(sCategory : string )  : boolean{
    return sCategory === Category.CAT_DOMAIN;
  },
  isCategory : function(sCategory : string )  : boolean{
    return sCategory === Category.CAT_CATEGORY;
  },
  isFiller: function(sCategory : string) : boolean {
    return Category._aCatFillers.indexOf(sCategory) >= 0;
  }
}

export const Word = {
  isFiller : function(word : IMatch.IWord) : boolean {
    return word.category === undefined || Category.isFiller(word.category);
  },
  isCategory : function(word : IMatch.IWord) : boolean {
    return Category.isCategory(word.category);
  },
  isDomain : function(word : IMatch.IWord) : boolean {
    if(word.rule && word.rule.wordType) {
      return word.rule.wordType === 'D' /* WORDTYPE_D */;
    }
    return Category.isDomain(word.category);
  }
};


export const WordType = {
  CAT_CATEGORY :  "category",
  CAT_DOMAIN :  "domain",
  CAT_FILLER : "filler",
  CAT_OPERATOR: "operator",
  CAT_TOOL : "tool",
  _aCatFillers : ["filler"],
  isDomain : function(sCategory : string )  : boolean{
    return sCategory === Category.CAT_DOMAIN;
  },
  isCategory : function(sCategory : string )  : boolean{
    return sCategory === Category.CAT_CATEGORY;
  },
  isFiller: function(sCategory : string) : boolean {
    return Category._aCatFillers.indexOf(sCategory) >= 0;
  },
  fromCategoryString: function(sCategory : string) : string
  {
    if( sCategory == Category.CAT_CATEGORY )
      return IFModel.WORDTYPE.CATEGORY;
    if( sCategory == Category.CAT_OPERATOR )
      return IFModel.WORDTYPE.OPERATOR;
    if( sCategory == Category.CAT_FILLER )
      return IFModel.WORDTYPE.FILLER;
    if( sCategory == Category.CAT_NUMBER )
    {
      //console.log("This is N? " + IFModel.WORDTYPE.NUMERICARG);
      return IFModel.WORDTYPE.NUMERICARG; // "N";
    }
    if( sCategory == Category.CAT_DOMAIN )
      return IFModel.WORDTYPE.DOMAIN;
    if( sCategory == Category.CAT_TOOL )
      return IFModel.WORDTYPE.TOOL;
    if ( sCategory == Category.CAT_ANY )
      return IFModel.WORDTYPE.ANY;
    debug(" unable to map to category " + sCategory );
    return undefined;
  }
}
