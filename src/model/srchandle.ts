import { ISyntacticContentAssistPath } from "chevrotain";
import { resolve } from "url";

import * as fs from 'fs';
import { addCloseExactRangeRules, asPromise } from "./model";
import * as MongoMap from  "./mongomap";
import { aAnySuccessorOperatorNames, IModelPath } from "../match/ifmatch";
import * as _ from 'lodash';

//import * as intf from 'constants';
import * as debugf from 'debugf';
import { evaluateRangeRulesToPosition } from "../match/erbase";
import { Sentence } from "../match/er_index";
import { assert } from "console";
import { nextTick } from "process";
import { isEmpty } from "lodash";
import { recognize } from "../bot/plainrecognizer";
import { Z_PARTIAL_FLUSH } from "zlib";

var debuglog = debugf('srchandle');

export interface ISynonym {
  category: string,
  fact: string,
  synonyms: string[]
};

export interface IPseudoModel {
  modelname : string,
  records : any[];
  schema : any;
  aggregateSynonyms() : Promise<ISynonym[]>;
  distinctFlat( modelPath : IModelPath ) : Promise<string[]>;
  distinct( path : string) : Promise<string[]>;
  find(query: any) : Promise<any[]>;
  aggregate(query : any) : Promise<any[]>;
}

export interface IPseudoSchema {
}

export interface ISrcHandle {
  modelNames() : string[],
  getPath() : string,
  model(a : string, schema?: any) : IPseudoModel,
  setModel(modelname : string , data:any, schema : any),
  connect( connectionString : string ) : Promise<ISrcHandle>
  getJSON( filename : string , modelnames? : string[]) : Promise<any>;
  getJSONArr( filename : string) : Promise<any[]>;
}

export function isEvalArr(rec: any, arg : any) : boolean {
  if ( arg['$ARRAYSIZE_OR_VAL_OR1']) {
    var path = arg['$ARRAYSIZE_OR_VAL_OR1'];
    var propPath = path.split("."); // is this the category or the path
    var res = MongoMap.collectMemberByPath(rec, propPath);
    if( res.length && typeof res[0] == "number") {
      return false; // a numberical evaluation which can be done!
    }
    return true; 
  }
}

export function evalArg(rec: any, arg : any) : any[] {
  if ( arg['$eval']) {
    // TODO elements
    debuglog(" retrieve " + arg['$eval'] + ' from ' + JSON.stringify(rec));
    var str = arg['$eval'].split(".");
    return MongoMap.collectMemberByPath(rec, str);
  } else if ( arg['$regex']) {
    return arg['$regex'];
  } else if ( arg['$ARRAYSIZE_OR_VAL_OR1']) {
    var path = arg['$ARRAYSIZE_OR_VAL_OR1'];
    var propPath = path.split("."); // is this the category or the path
    var res = MongoMap.collectMemberByPath(rec, propPath);
    if( res.length && typeof res[0] == "number") {
      return res;
    }
    return [res.length];
    return arg['$regex'];
  } else {
    return [arg];
  }
}

export function asString( a : any) : string {
  return "" + a;
}

export function compareByType(op: string, l : any, r: any) : boolean {
  if ( typeof r == "string") {
    l = asString(l);
  }
  switch(op) {
  case "$lt": 
    return l < r;
  case "$lte":
    return l <= r;
  case "$gt":
    return l > r;
  case "$gte":
    return l >= r;
  case "$eq":
    return l == r;
  case "$ne":
    return l != r;
  default: 
  throw "Unimplemented op " + op;
  }
}

export function evalSet(op : string, lhs: any, rhs: any ) : boolean {
  switch(op) {
  case "$regex":{
    if ( typeof rhs == "object" &&  rhs.constructor == RegExp) {
      return lhs.some( a => rhs.exec(asString(a)));
    }
    throw "rhs is not an regexp" + JSON.stringify(rhs);
  }
  break;
  case "$lt": 
  case "$lte":
  case "$gt":
  case "$gte":
  case "$eq":
  case "$ne":
  {
    return rhs.some( r => ( lhs.some( l =>   compareByType(op,l,r) )));
  }
  break;
  case "$exists": {
    if ( rhs[0] == false) {
      return lhs.length == 0;
    }
    return lhs.length > 0;
  }
  default: 
    throw "Unimplemented op " + op;
  }
}

var ops = ["$lt", "$eq", "$ne", "$lte", "$gt", "$gte", "$exists", "$regex" ];

export function isCountOp(rec:any , matchOp : any) {
  return isEvalArr(rec, matchOp[0]) || isEvalArr(rec, matchOp[1]);
}

export function satisfiesMatch(rec : any, match : any, ignoreCount? : boolean) : boolean {
  var props = Object.getOwnPropertyNames(match);
  if(props.length == 0 ){
    return true;
  } else if(match['$and']) {
    debuglog('found $and');
    return match['$and'].every( cond => satisfiesMatch(rec, cond, ignoreCount));
  } else if (match['$or']) {
    return match['$or'].any( cond => satisfiesMatch(rec, cond, ignoreCount));
  } else if ( ops.indexOf(Object.getOwnPropertyNames(match)[0]) >= 0) {
      var op = Object.getOwnPropertyNames(match)[0];
      var lhs = evalArg(rec,match[op][0])
      var rhs = evalArg(rec,match[op][1]);
      debuglog(() => 'rhs ' + JSON.stringify(lhs) + " rhs:" + JSON.stringify(rhs));
      if ( ignoreCount && isCountOp(rec, match[op])) {
        return true; // this precluded logical not above!
      }
      return evalSet(op,lhs,rhs);
  } else if ( match["$expr"]) {
    return satisfiesMatch(rec,match["$expr"], ignoreCount);
  }
  else {
    console.log('unknown op ' + JSON.stringify(match));
  }
}

export function applyMatch(records:any[], match: any) : any[] {
  var l1= records.length;
  var res = records.filter( rec => satisfiesMatch(rec ,match));
  debuglog(' applied match ' + res.length + "/" + l1 );
  return res;
}

interface RelevantArrCategory {
  pathToArr : string
}

function atLeastOneIsArrayMult( records: any[], path: string) {
  return path.indexOf('.') < 0 && records.some( r => _.isArray(r[path]) && r[path].length > 1);
}

export function collectPaths(prev : string[], match: any) {
  if( match["$eval"] ) {
    var path = match["$eval"]; 
    if ( path.indexOf(".")< 0) {
      prev.push(path);
    }
    return prev;
  }
  if ( _.isArray(match) ) {
    var r = prev;
    match.forEach( m => { r = collectPaths(r,m)});
    return r;
  } 
  if ( typeof match == "object") {
    var r = prev;
    Object.getOwnPropertyNames(match).forEach(  pn => {
      r = collectPaths(r,match[pn]);
    });
    return r;
  }
  return prev;
}
  
export function collectRelevantCategoriesWithSingleArrayOnPath( records: any[], match: any) : RelevantArrCategory[] {
  // we only support "trivial categories, for now, not deep ones"
  var matchPaths = _.uniq(collectPaths([],match));
  // 1) we collect all evalution path   XXXXXXXX
  // then we analyse a record whether it is array-ish
  return matchPaths.filter( path =>
             atLeastOneIsArrayMult(records,path)).map( path =>{ var res = { "pathToArr": path} as RelevantArrCategory; return res});
}

/**
 * This step apply match conditions on records, pruning non-fitting array members on the result stream
 * 
 * A complete implementation would have to denormalize the tuples, then apply the filters (ignoring more than count x conditions), 
 * then recombine them into "unique" arrays
 * this is currenlty not implemented 
 *  
 * @param records 
 * @param match 
 */
export function applyMatchAsFilter(records:any[], match: any) : any[] {
  var l1= records.length;
  var relevantCategories = collectRelevantCategoriesWithSingleArrayOnPath(records, match);
  if ( relevantCategories.length == 0) {
    return records;
  }
  var res = records.map( rec => {
    // iterate over each relevant property,
    var rcClone = _.cloneDeep(rec);
    relevantCategories.forEach( relcat => {
      if ( _.isArray(rec[relcat.pathToArr])) {
        var rcOne = _.cloneDeep(rec);
        rcClone[relcat.pathToArr] = rcClone[relcat.pathToArr].filter(
          arrMem => {
            // construct a clone with the single member set
            rcOne[relcat.pathToArr] = [arrMem];
            return satisfiesMatch(rcOne, match, true);
          });
        } else {
          // nothign to filter 
        }
    });
    return rcClone;
  });
  debuglog(' applied match ' + res.length + "/" + l1 );
  return res;
}


export function applyProjectOnly(records:any[], project: any) : any[] {
  var res = [];
  var len = records.length; 
  records.forEach((rec,index) =>{
    if(index % 200 == 10) {
      console.log('' + index + "/" + len + " " + res.length);
    }
    res = applyProjectCollecting(res,rec,project,{})
  });
  return res;
}

/**
 * 
 * @param records 
 * @param project 
 * @param keepAsArray  members ( keys of project! ) are directly collected as array and not to-n-expanded, 
 * so  [{a :1, b:"B1" },{a:2, b:"B2"}] , c[ "C1", "C2" ] 
 * will become  a: [1,2], b: ["B1", B2], c: ["C1" , "C2"] if  ["a","b","c"] is passed
 */
export function applyProject(records:any[], project: any, keepAsArray : string[]) : any[] {
  // 1) collect all keepasarray directly, 
  var splitKeepAsArrayPaths = {};
  keepAsArray.forEach( k => {
    splitKeepAsArrayPaths[k] = project[k].split('.');
  });
  var recFixed = records;
  if( keepAsArray.length) {
    console.log(" keep fixed" + JSON.stringify(keepAsArrayMap));
    recFixed = records.map( r => {
      var rfix = _.clone(r);
      keepAsArray.forEach( p => {
        rfix[p] = MongoMap.collectMemberByPath(r, splitKeepAsArrayPaths[p]);      
      });
      return rfix;
    });
  }
  
  var newproject = _.clone(project);
  var keepAsArrayMap = {};
  keepAsArray.forEach( k => {
    newproject[k] = k;
    keepAsArrayMap[k] = 1;
  });
  var res = [];
  var len = records.length; 
  recFixed.forEach((rec,index) =>{
    if(index % 200 == 10) {
      console.log('' + index + "/" + len + " " + res.length);
    }
    res = applyProjectCollecting(res,rec,newproject, keepAsArrayMap)
  });
  return res;
}

export function filterProject(project: any, prefix: string) {
  var res = {};
  Object.getOwnPropertyNames(project).forEach( pn => {
    if( (""+ project[pn]).startsWith(prefix + ".") ) {
      res[pn] = project[pn].substr(prefix.length + 1)
    }
  });
  return res;
}

export function wrapArray(a : any) : any[] {
  if ( _.isArray(a)) {
    return a;
  }
  return [a];
}
export function copyAllBut(rec: any , removedProperties: string[]) {
  var res = {};
  Object.getOwnPropertyNames(rec).filter( pn => removedProperties.indexOf(pn) < 0).forEach( pn => 
    res[pn] = rec[pn]
  );
  return res;
}

export function flattenDeep( rec : any, compact : string[]) : any[] {
  var res = [copyAllBut(rec,compact)];
  // we construct the new records 
  compact.forEach( c => {  
    var next = [];
    res.forEach( base => {
      // copy all properties from res[c] into each base; 
      assert(_.isArray(rec[c])); // what if this is empty?
      rec[c].forEach( obj => {
        if ( typeof obj == "object") {
          var nb = _.clone(base);
          Object.assign(nb,obj);
          next.push(nb);
        } else {
          var nb = _.clone(base);
          nb[c] = obj;
          next.push(nb);
        }
      });
    });
    res = next;
  });
  return res;
}

 export function applyProjectCollecting(res:any[], rec:any, project: any, keepAsArrayMap : any): any[] {
  // 1) retrieve only members part of the project, flattening the records in the process
  var fields = Object.getOwnPropertyNames(project);
  var seen = {};
  var compact = [];
  // 1) we expand all collinear into an array [ regardless of origin]  construct a { e : x,  _categories : [ { x : a, b : [ { x: a, b: a} } ]}
  var tmpl = {};
  fields.forEach( f => {
    if ( !seen[f]) {
      var fullpath = (project[f] == 1)?  f : project[f];
      var path = fullpath.split(".");
      if ( path.length == 1) {
        if ( _.isArray(rec[fullpath]) && keepAsArrayMap[f]) {
          // keep array!
          tmpl[path] = rec[fullpath];
        } else if ( _.isArray(rec[fullpath])) {
          compact.push(fullpath)
          tmpl[f] = rec[fullpath];
          return;
        } else if ( typeof rec[fullpath] == "object") {
          // this cannot be, 
          throw "Unable to extract member " + fullpath + " from " + JSON.stringify(res);
        } else {
          tmpl[path] = rec[fullpath];
          return;
        }
      } else {
        // collect prefixe set, create pseudo projection from it. 
        var prefix = path[0];
        compact.push(prefix);
        var projSuffix = filterProject(project,prefix);
        Object.getOwnPropertyNames(projSuffix).forEach( a=> seen[a] = 1);
        var localExpand = applyProjectOnly(wrapArray(rec[prefix]), projSuffix);
        tmpl[prefix] = localExpand;
      }
    }
  });
  var aug = flattenDeep(tmpl, compact);
  return res.concat(aug);
}

export function isDeep(a:any) {
  return Object.getOwnPropertyNames(a).some( p => _.isObject(a[p]) || _.isArray(a[p]));
}

export function makeKey(a)  : string {
  return Object.getOwnPropertyNames(a).map( k => ''+ (a[k] || '')).join('__');
}

export function isAllPropsEmpty(s : string) {
  return s.search(/[^_]/) < 0;
}

export function removeDuplicates(records: any[]) {
  var seen = {};
  return records.filter( a => { var s = makeKey(a); var res = isDeep(a) || (!isAllPropsEmpty(s) && !seen[s]); seen[s] = 1; return res; });
}


/**
 * if member of unwind points to an array, expand it. 
 * @param records I 
 * @param unwind 
 * @param any 
 */
export function applyUnwind(records:any[], unwind : any) : any[] {
  var res = [];
  var prop = unwind.path;
  records.forEach( r => {
    if ( _.isArray(r[prop]) && r[prop].length > 0 ) {
      r[prop].forEach( el => {
        var rc = _.cloneDeep(r);
        rc[prop] = el;
        res.push(rc);
      });
    } else {
      res.push(r);
    }
  });
  return res;
}

export function applySort(records:any[], match: any) : any[] {
  var props = Object.getOwnPropertyNames(match);
  records.sort( (a,b) => { 
    for(var i = 0; i < props.length; ++i) {
      var fac = 1;
      if ( match[props[i]] == -1) {
        fac = -1;
      }
      var lhs = a[props[i]];
      var rhs = b[props[i]];
      if( lhs > rhs) {
        return +fac;
      } else if ( lhs < rhs ) {
        return -fac;
      } else if ( lhs == undefined ) {
        return +fac;
      }
    }
    return 0;
   });
  return records; 
}


export function applyStep(records:any[], queryStep: any) : any[] {
  debugger;
  if( queryStep["$match"]) {
    var r = applyMatch(records, queryStep["$match"])
    return applyMatchAsFilter(r, queryStep["$match"]);
  } else if ( queryStep["$project"]) {
    return applyProject(records, queryStep["$project"], queryStep["$keepAsArray"] || []);    
  } else if ( queryStep["$sort"] ) {
    return applySort(records, queryStep["$sort"]);
  } else if ( queryStep["$unwind"] ) {
    return applyUnwind(records, queryStep["$unwind"]);
  } 
  else if ( queryStep["$group"] || queryStep["$unwind"] ){
    return records;
  }
  console.log('unknown step ' + JSON.stringify(queryStep));
  return records;
}

export function filterByQuery(records:any[], query: any): any[] {
  var res = records;
  debugger;
  query.forEach( qcomp => { res = applyStep(res,qcomp)});
  return removeDuplicates(res);
}


class APseudoModel implements IPseudoModel {
  modelname : string;
  records : any[];
  schema : any;
  constructor( modelName : string, records: any[], schema : any) {
    this.modelname = modelName; 
    this.records = records; 
    this.schema = schema;
  }
  aggregateSynonyms() : Promise<ISynonym[]> {
    var self = this;
/*
    "_synonyms" : [
      { "category" : "object name",
        "fact" : "earth",
        "synonyms" : [ "blue planet" , "gaia"]
      },
      { "category" : "orbits",
        "fact" : "Sun",
        "synonyms" : [ "Sol"]
      }
      */
    var res = [] as ISynonym[];
    self.records.forEach( rec => {
        var syn = MongoMap.getMemberByPath(rec,["_synonyms"]);
        if ( syn ) {
          res = res.concat(syn);
        }
    });
    debuglog(' found ' + res.length + ' synonyms for ' + this.modelname);
    return new Promise<ISynonym[]>( (resolve,reject) => { resolve(res)});    
  }
  distinctFlat( modelPath : IModelPath ) : Promise<string[]> {
    var o = {};
    var self = this;
    this.records.forEach( rec => 
      { var r = MongoMap.getMemberByPath(rec, modelPath.paths);
        if(_.isArray(r)) {
          r.forEach( k => o[k] = k);
        } else {
          if ( r ) {
            o[r] = r;
          }
        }
      });
    var res = Object.getOwnPropertyNames(o).map( (k) => o[k]).sort();
    return asPromise(res);
  }
  distinct( path : string) : Promise<string[]> {
    var self = this;
    return new Promise<string[]>( (resolve,reject) => {
      var o = {};
      // TODO: not only direct prop
      self.records.forEach( a => console.log("here one " + a[path]));
      self.records.forEach( a => { 
        var u = a[path];
        if( _.isArray(u)) {

        } else {
          o[a[path]] = a[path]; 
        }
      
      });
      resolve(Object.getOwnPropertyNames(o).map( (k) => o[k]).sort());
    });    
  }
  find(query: any) : Promise<any[]> {
    var self = this;
    if ( Object.getOwnPropertyNames(query).length == 0) {
      return new Promise<ISynonym[]>( (resolve,reject) => { resolve(self.records)});    
    }
    console.log("find " + JSON.stringify(query));
    throw "Find " + JSON.stringify(query);
  }
  aggregate(query : any) : Promise<any[]> {
    debuglog("Aggregate " + JSON.stringify(query));
    var self = this;
    var res = filterByQuery(self.records,query);
    return new Promise<ISynonym[]>( (resolve,reject) => { resolve(res)});    
  }
}

class ASrcHandle implements ISrcHandle {
  _modelNames : string[];
  _pseudoModels : Map<String,IPseudoModel>;
  //name: string;
  path : string;
  constructor(path: string) {
    this.path = path;
    if( !this.path.endsWith('/')) {
      this.path = this.path + '/';
    }
    console.log(' this is the path' + path);
    this._pseudoModels = {} as Map<String,IPseudoModel>; 
  }
  modelNames() : string[] {
    return this._modelNames;
  }
  getPath() : string {
    return this.path;
  }
  model( name : string ) : IPseudoModel {
    return this._pseudoModels[name];
  }
  setModel(modelName : string , records :any, schema : any) {
    debuglog("Setting model " + modelName + " with " + records.length + " records ");
    this._pseudoModels[modelName] = new APseudoModel(modelName, records, schema); 
  }
  connect( modelPath : string ) : Promise<ISrcHandle> {
    this.path = modelPath;
    if( !this.path.endsWith('/')) {
      this.path = this.path + '/';
    }
    console.log(' this is the path' + this.path);
    var self = this;
    return new Promise<ISrcHandle>( (resolve, reject) => {
      fs.readFile( this.path + "models.json", (err, buffer ) => {
        if ( err ) {
          console.log(err);
          throw err;
        }
       self._modelNames = JSON.parse(buffer.toString('utf-8')) as any; 
        debuglog("Read modelnames " + JSON.stringify( self._modelNames) + " this.path =" + self.path);
        resolve(self);
      })
    });
  }
  getJSON(filename : string) : Promise<any> {
    var self = this;
    var fullfile = this.path + filename;
    //console.log(' read file ' + fullfile);
    return new Promise<any>( (resolve, reject) => {
      fs.readFile( fullfile, (err, buffer ) => {
        if ( err ) {
          console.log(fullfile + err);
          throw err;
        }
        var data = JSON.parse(buffer.toString('utf-8')) as any; 
        resolve(data);
      })
    });
  }
  getJSONArr(filename : string ) : Promise<any[]> {
    var self = this;
    var fullfile = this.path + filename;
    //console.log(' read file ' + fullfile);
    return new Promise<any[]>( (resolve, reject) => {
      fs.readFile( fullfile, (err, buffer ) => {
        if ( err ) {
          console.log(fullfile);
          console.log(err);
          throw err;
        }
       var data = JSON.parse(buffer.toString('utf-8')) as any; 
        resolve([data]);
      })
    });
  }
}

export function createSourceHandle()  : ISrcHandle {
  return new ASrcHandle(""); 
}