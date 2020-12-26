'use strict'

// based on: http://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Levenshtein_distance
// and:  http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance

import * as debugf from 'debugf';
import * as _ from 'lodash';
const debuglog = debugf('ast');

export enum ASTNodeType {
  BINOP, //0
  OP,
  OPEqIn,
  OPContains,
  OPStartsWith,
  OPEndsWith,
  OPAll,
  OPFirst,
  OPLatest,
  OPNewest,
  OPOldest,
  CAT,
  CATPH,
  FACT,
  LIST, //14
  ANY,
  OPMoreThan,
  OPLessThan,
  OPExactly,
  OPLT,
  OPLE,
  OPNE,
  OPEQ,
  OPGT,
  OPGE,
  OPOrderBy,
  OPOrderDescendingBy,
  OPExisting,
  OPNotExisting,
  OPLogicalAnd,
  OPLogicalOr,
  NUMBER,
  DOM
}

export class NodeType {
    nt : ASTNodeType;
  constructor(nt : ASTNodeType) {
    this.nt = nt;
  }
  toString() : string {
    return astNodeTypes[this.nt];
  }
}

const astNodeTypes =  [ "BINOP",
  "OP",
  "OPEqIn",
  "OPContains",
  "OPStartsWith",
  "OPEndsWith",
  "OPAll",
  "OPFirst",
  "OPLatest",
  "OPNewest",
  "OPOldest",
  "CAT",
  "CATPH",
  "FACT",
  "LIST",
  "ANY",
  "OPMoreThan",
  "OPLessThan",
  "OPExactly",
  "OPLT",
  "OPLE",
  "OPNE",
  "OPEQ",
  "OPGT",
  "OPGE",
  "OPOrderBy",
  "OPOrderDescendingBy",
  "OPExisting",
  "OPNotExisting",
  "OPLogicalAnd",
  "OPLogicalOr",
  "NUMBER",
  "DOM"
];

export interface ASTNode {
  type : ASTNodeType,
  bearer? : any,
  children? : ASTNode[];
};

export function makeNode(type : ASTNodeType, ...  args : ASTNode[]) : ASTNode {
  return {
    type : type,
    children : args
  }
}

export function makeNodeForCat(cat : any) : ASTNode {
  return {
    type : ASTNodeType.CAT,
    bearer : cat
  }
}


export function makeNodeForDomain(cat : any) : ASTNode {
  return {
    type : ASTNodeType.DOM,
    bearer : cat
  }
}

export function makeNodeForToken(type : ASTNodeType, opToken : any) : ASTNode {
  return {
    type : type,
    bearer : opToken
  }
}


export function makeNodeForFact(fact : any) : ASTNode {
  return {
    type : ASTNodeType.FACT,
    bearer : fact
  }
}


export function makeNodeForAny(fact : any) : ASTNode {
  return {
    type : ASTNodeType.ANY,
    bearer : fact
  }
}

export function makeNodeForInteger(inttok : any) : ASTNode {
  return {
    type : ASTNodeType.NUMBER,
    bearer : inttok
  }
}


export function typeToString(type : ASTNodeType) {
  return astNodeTypes[type];
}

export function dumpNodeNice(node : ASTNode) {
  if (!node) {
    return undefined;
  }
  var r = {  type : typeToString(node.type) } as any;
    r.index = getIndex(node);
    if(node.children && node.children.length) {
      r.children = node.children.map(n => dumpNodeNice(n));
    }
    return r;
}

function getIndex(node : ASTNode) {
  if(!node || !node.bearer) {
    return -1 ;
  }
  return node.bearer.startOffset;
}

function makePrefix(prefix : number, indent : number) {
  var s = '';
  for(var i = 0; i < indent*prefix; ++i) {
    s += ' ';
  }
  return s;
}

export function astToText(node : ASTNode, indent? : number, prefix? : number) {
  prefix = prefix || 0;
  indent = indent || 2;
  debuglog(() => JSON.stringify(node,undefined,2));
  var sprefix = makePrefix(prefix, indent);
  var index =  getIndex(node);
  var ln =  node ?  `${typeToString(node.type)} ${index}` : '(undefined)';
  if (!node) {
    return sprefix + node + "\n";
  }
  if(node.children && typeof node.children.length === "number") {
      var schildren = node.children.map(c => astToText(c,indent,prefix+1));
      return sprefix + ln + `(${schildren.length})` + '\n' + schildren.join('');
  } else {
    if(node.children && !_.isArray(node.children)) {
      throw new Error('weird children node' + node.children);
    }
  }
  return sprefix + ln + "\n";
}