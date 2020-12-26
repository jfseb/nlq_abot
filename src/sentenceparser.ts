'use strict'

// based on: http://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Levenshtein_distance
// and:  http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance

import { ErBase as ErBase, Sentence as Sentence, IFErBase as IFErBase } from './match/er_index';

import * as debug from 'debugf';

import * as SelectParser from './parser';


const debuglog = debug('sentenceparser');

import * as FormatError from './formaterror';
import * as chevrotain from 'chevrotain';
import * as AST from './ast';

import { ASTNodeType as NT} from './ast';

  var createToken = chevrotain.createToken;
  var Lexer = chevrotain.Lexer;
  var Parser = chevrotain.Parser;


import { IFModel as IFModel} from './model/index_model';

  var WhiteSpace = createToken({name: "WhiteSpace", pattern: /\s+/});

  WhiteSpace.GROUP = Lexer.SKIPPED;

  import { OperatorLookup as OperatorLookup, Tokens as T }  from './tokens';
  // whitespace is normally very common so it is placed first to speed up the lexer
  var allTokens = Object.keys(T).map(key => T[key]);


export function makeToken(t : IFErBase.IWord, index : number, OL : any ) {
  if (!t.rule) {
    throw new Error("Token without rule " + JSON.stringify(t));
  }
  if (t.rule.wordType === IFModel.WORDTYPE.CATEGORY) {
    return { image : "CAT",  startOffset : index, bearer : t, tokenType : OperatorLookup.CAT.tokenType };
  };
  if (t.rule.wordType === 'F') {
    return { image : "FACT",  startOffset : index, bearer : t, tokenType : T.FACT.tokenType };
  }
  if (t.rule.wordType === 'N') {
    //console.log( 'tokentype is ' +  T["Integer"].tokenType  +  ' ' + JSON.stringify( T["Integer"] ));
    // TODO i parses as integer -> integer
    return { image : "NUMBER",  startOffset : index, bearer : t, tokenType : T.Integer.tokenType };
  }
  if (t.rule.wordType === 'D') {
    return { image : "DOM",  startOffset : index, bearer : t, tokenType : T.DOM.tokenType };
  }
  if (t.rule.wordType === 'A') {
    return { image : "ANY",  startOffset : index, bearer : t, tokenType : T.AnANY.tokenType };
  }
  if (t.rule.wordType === 'M') {
    var tlc = t.matchedString.toLowerCase();
    var tlcClean = tlc.replace(/ /g,'_');
    //debulog(">" + tlcClean + "<");
    //debulog(Object.keys(T).indexOf("domain"));
    //debulog(">>>" + JSON.stringify(T["domain"]));
    //debulog("> token >>" + JSON.stringify(T[tlcClean]));
    if (!OL[tlcClean]) {
      //debuglog(Object.keys(T).join('\" \"'));
      throw new Error("unknown token of type M with >" + t.matchedString+ "<");
    }
    //debuglog(" here we go" + typeof T["domain"]);
    return { image : t.matchedString, bearer : t, startOffset : index, tokenType : T["domain"].tokenType };
  }
  if (t.rule.wordType === 'O') {
    var tlc = t.matchedString.toLowerCase();
    //var tlcClean = tlc; //  tlc.replace(/ /g,'_');
    var opToken = OperatorLookup[tlc];
    //console.log(' here mapped with _ ' + tlcClean + ' ' + Object.keys(T));
    if (!opToken) {
      debuglog(Object.keys(OperatorLookup).join('\" \"'));
      throw new Error("unknown token of type O with >" + t.matchedString + "< cleansed>" + (tlcClean) + "< not found in " + Object.getOwnPropertyNames(OperatorLookup).join('\n') +" , add to ");
      //process.exit(-1);
    }
    //console.log( ' here image  for O' + t.matchedString + ' ' + T[tlcClean].tokenType);
    return { image : t.matchedString, bearer : t, startOffset : index, tokenType : opToken.tokenType };
  }
  if (t.rule.wordType === 'I') {
    var tlc = t.matchedString.toLowerCase();
    var opToken = T[tlc];
    if (!opToken) {
      debuglog("unknown token of type I with " + t.matchedString);
      process.exit(-1);
    }
    return { image : t.matchedString, bearer : t, startOffset : index, tokenType : opToken.tokenType };
  }
  throw new Error("unknown token " + JSON.stringify(t));
}

class XLexer {
   tokenize = function(sentence : IFErBase.ISentence) : any[]  {
    debuglog( ()=> ' sentence prior tokenize:' + JSON.stringify(sentence));
    return sentence.map( (t,index) => {
         var u =  makeToken(t, index, OperatorLookup);
        debuglog("produced nr   " + index + " > " + JSON.stringify(u));
        return u;
    });
  }
};

export function getLexer()  : any {
  return new XLexer();
}

  /* [ AFact, And,
    Describe,
    First, Oldest, Latest, What,
    At, Every, All, At, Least, One,
    The,
    LParen, RParen,


   Meaning, Of, Are,  In, About, You, All,
  WhiteSpace, Select, From, Where, Comma, ACategory, All,
    List, Identifier, Integer, GreaterThan, LessThan, To, Relating, With];
*/
    var SelectLexer = new Lexer(allTokens);


function parse(tokens : any[], startrule : string) {
  const parser = new SelectParser.SelectParser(tokens);
  //console.log( ' ' + JSON.stringify( tokens ));
  var res = parser[startrule]();
   if (parser.errors.length > 0) {
    debuglog(() => 'parsing error in  input:' + JSON.stringify(parser.errors,undefined,2));
    var u = new Error(parser.errors[0]);
    (u as any).error_obj = parser.errors[0];
    throw u;
  }
  return res;
}

export interface IParsedSentences  extends IFModel.IProcessedSentences {
  asts : AST.ASTNode[],
  domains? : string[]
};

export declare const ERR_PARSE_ERROR = "PARSE_ERROR";

export function parseSentenceToAsts(s : string, model : IFModel.IModels, words : any) : IParsedSentences {
  var res = ErBase.processString(s, model.rules, words, {} /*model.operators*/ );
  debuglog(() =>'res > ' + JSON.stringify(res, undefined, 2));
  var res2 = Object.assign({}, res as any) as IParsedSentences;
  res2.errors = res2.errors || [];
  res2.asts = res.sentences.map((sentence, index) => {
    res2.errors[index] = false;
    var lexingResult = getLexer().tokenize(sentence);
    debuglog( () => {
      var sStrings = lexingResult.map((t, indext) =>  `[${indext}] ${t.image} (${t.bearer && t.bearer.matchedString || JSON.stringify(sentence[index][t.startIndex])})` );
      return 'tokens: #' + index + '...\n' + sStrings.join('\n');
    });
    //test.deepEqual(sStrings, ['CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT' ]);
    try {
      var ast = parse(lexingResult, 'catListOpMore');
      debuglog(() => {
        return 'ast: #' + index + '...\n' + AST.astToText(ast);
      });
      return ast;
    } catch (e) {
      debuglog(()=> 'error  ' + JSON.stringify(e.error_obj,undefined,2) + (!e.error_obj? (e + ' ') + JSON.stringify(e): ''));
      debuglog(()=> ' sentence : ' + Sentence.dumpNice(sentence));
      var e2 = FormatError.formatError(e.error_obj,sentence);
      res2.errors = res2.errors || [];
      debuglog('parse error ' + e.toString());

      res2.errors[index] = {
        err_code : ERR_PARSE_ERROR,
        text : e.toString().split(',\"token\":')[0]
      }  as IFErBase.IERError;
    }
    return undefined;
  });
  return res2;
}
//
export {
   SelectLexer,
   parse
   // defaultRule : "selectStatement"
};
