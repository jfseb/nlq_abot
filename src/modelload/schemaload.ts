/**
 * Functionality managing the match models
 *
 * @file
 */

//import * as intf from 'constants';
import * as debug from 'debugf';

var debuglog = debug('schemaload');

//const loadlog = logger.logger('modelload', '');

import *  as IMatch from '../match/ifmatch';
//import * as InputFilterRules from '../match/rule';
//import * as Tools from '../match/tools';
import * as fs from 'fs';
import * as Meta from '../model/meta';
import * as FUtils from '../model/model';
import { IFModel as IFModel } from '../model/index_model';
import * as MongoMap from '../model/mongomap';
import * as Utils from 'abot_utils';
//import * as CircularSer from 'abot_utils';
//import * as Distance from 'abot_stringdist';
import * as process from 'process';
import * as _ from 'lodash';
import { ISrcHandle , IPseudoSchema, IPseudoModel } from '../model/srchandle';
import { assert } from 'console';

/**
 * WATCH out, this instruments srcHandle!
 */
// require('srcHandle-schema-jsonschema')(srcHandle);
/**
 * the model path, may be controlled via environment variable
 */
var envModelPath = process.env["ABOT_MODELPATH"] || "node_modules/abot_testmodel/testmodel";

export function cmpTools(a: IMatch.ITool, b: IMatch.ITool) {
  return a.name.localeCompare(b.name);
}


type IModel = IMatch.IModel;

type IModelDoc = IMatch.IModelDoc;

const ExtendedSchema_props = {
    "modelname": {
      "type": String,
      "trim": true,
      "required" : true
    },
    "domain": {
      "type": String,
      "trim": true,
      "required" : true
    },
    "mongoosemodelname": {
      "type": String,
      "trim": true,
      "required" : true
    },
    "collectionname": {
      "type": String,
      "trim": true,
      "required" : true
    },
    "props" : {},
    "index" : {}
};
const ExtendedSchema_index = {
    "modelname" : "text"
};



// load the models

export function loadModelNames(modelPath : string) : string[] {
  modelPath = modelPath || envModelPath;
  debuglog(()=> `modelpath is ${modelPath} `);
  var mdls = FUtils.readFileAsJSON(modelPath + '/models.json');
  mdls.forEach(name => {
    if(name !== makeMongoCollectionName(name)) {
        throw new Error('bad modelname, must terminate with s and be lowercase');
    }
  })
  return mdls;
}

export interface IRawSchema {
    props: any[],
    index : any
}

/*
export interface IModelDocCategoryRec {
    category : string,
    category_description : string,
    QBEColumnProps : {
        "defaultWidth": number,
        "QBE": boolean,
        "LUNRIndex": boolean
      },
      "category_synonyms": string[],
    wordindex : boolean,
    exactmatch: boolean,
    showM
};
*/


/*
export interface IModelDoc {
    domain : string,
    modelname? : string,
    collectionname? : string,
    domain_description : string
    _categories : IMatch.IModelCategoryRec[],
    columns: string[],
    domain_synonyms : string[]

}*/

export interface IExtendedSchema extends IRawSchema{
    domain : string,
    modelname : string
};

export function mapType(val : string) : any {
    if(val === "String") {
        return String;
    }
    if(val === "Boolean") {
        return Boolean;
    }
    if(val === "Number") {
        return Number;
    }
    throw new Error(" illegal type " + val + " expected String, Boolean, Number, ...");
}

export function replaceIfTypeDeleteM(obj : any, val : any, key : string) {
    if(key.substr(0,3) === "_m_") {
        delete obj[key];
        return;
    };
    if(key === "type" && typeof val === "string") {
        var r = mapType(val);
        obj[key] = r;
    }
}

function traverseExecuting(obj, fn ) {
    _.forIn(obj, function (val, key) {
    //    console.log(val + " -> " + key + " ");
        fn(obj,val,key);
        if (_.isArray(val)) {
            val.forEach(function(el) {
                if (_.isObject(el)) {
                    traverseExecuting(el,fn);
                }
            });
        }
        if (_.isObject(val)) {
            traverseExecuting(obj[key],fn);
        }
    });
}

function traverseReplacingType(obj) {
    return traverseExecuting(obj,replaceIfTypeDeleteM);
    /*
    _.forIn(obj, function (val, key) {
    //    console.log(val + " -> " + key + " ");
        replaceIfTypeDeleteM(obj,val,key);
        if (_.isArray(val)) {
            val.forEach(function(el) {
                if (_.isObject(el)) {
                    traverseReplacingType(el);
                }
            });
        }
        if (_.isObject(val)) {
            traverseReplacingType(obj[key]);
        }
    });
    */
}

export function typeProps(a : any) : any {
   var aCloned = _.cloneDeep(a);
   //console.log(JSON.stringify(aCloned, undefined, 2));
   traverseReplacingType(aCloned);
   return aCloned;
}

export function loadExtendedMongooseSchema(modelPath: string, modelName : string): IExtendedSchema {
  var filename =  modelPath + '/' + modelName + '.model.mongooseschema.json';
  debuglog(()=> `attempting to read ${filename}`)
  var schemaSer = FUtils.readFileAsJSON(filename);
  schemaSer.modelName = modelName;
  return schemaSer;
}

export function loadModelDoc(modelPath: string, modelName : string): IModelDoc {
  var docSer = FUtils.readFileAsJSON( modelPath + '/' + modelName + '.model.doc.json');
  docSer.modelname = modelName;
  return docSer;
}

var aPromise = global.Promise;

export interface IModelRec  {
    collectionName : string,
    model : IPseudoModel,
    schema : IPseudoSchema
};


export function augmentMongooseSchema( modelDoc : IModelDoc, schemaRaw : IRawSchema) : IExtendedSchema {
    debuglog( ()=>'augmenting for ' + modelDoc.modelname);
    var res = { domain : modelDoc.domain,
        modelname : modelDoc.modelname
     } as IExtendedSchema;
    return (Object as any).assign(res, schemaRaw);
}

/**
 * returns a srcHandle collection name
 * @param modelName
 */
export function makeMongoCollectionName(modelName : string) : string {
    assert( modelName == modelName.toLowerCase()); 
    return modelName; 
}

var SchemaOperators = { operators : {}, synonyms : {}};

var SchemaFillers = { fillers : [{
    type : String
}]
};

export function getOrCreateModelFillers(srcHandle: ISrcHandle) : IPseudoModel {
    if(srcHandle.modelNames().indexOf('fillers') >= 0) {
        return srcHandle.model('fillers');
    } else {
        return srcHandle.model('fillers', SchemaFillers as  IPseudoSchema);
    }
}

export function getOrCreateModelOperators(srcHandle: ISrcHandle) : IPseudoModel {
    if(srcHandle.modelNames().indexOf('operators') >= 0) {
        return srcHandle.model('operators');
    } else {
        return srcHandle.model('operators', SchemaOperators as any as IPseudoModel);
    }
}

export function getFillersFromDB( srcHandle : ISrcHandle) : Promise<string[]> {

    return srcHandle.getJSON("filler.json") as Promise<string[]>;
    /*
    var fillerModel = getOrCreateModelFillers(srcHandle);
    return fillerModel.find({}).lean().exec().then( (vals : any[]) => {
        if(vals.length !== 1) {
            throw new Error('expected exactly one operators entry ');
        };
        return vals[0];
    });
    */
}


export function getOperatorsFromDB( srcHandle : ISrcHandle) : Promise<any> {
    return srcHandle.getJSON('operators.json');
    /*   
    var operatorModel = getOrCreateModelOperators(srcHandle);

    return operatorModel.find({}).lean().exec().then( (vals : any[]) => {
        if(vals.length !== 1) {
            throw new Error('expected exactly one operators entry ');
        };
        return vals[0];
    });
    */
}

export function getExtendSchemaDocFromDB(srcHandle : ISrcHandle, modelName : string) : Promise<IExtendedSchema> {
    var mongooseModelName = modelName;
    //var model_ES = srcHandle.model(MongooseNLQ.MONGOOSE_MODELNAME_EXTENDEDSCHEMAS);
    var res = srcHandle.getJSONArr(modelName + ".model.mongooseschema.json") /*model_ES.find({ modelname : modelName}).lean().exec()
    */
      .then((doc) =>
    {   doc[0].modelname = modelName; 
        debuglog( ()=> ` loaded Es doc ${modelName} returned ${(doc as any).length} docus from db : `
        + (doc as any)[0].modelname + `` + (doc as any)[0].collectionname );
        debuglog(() => 'here the result' + JSON.stringify(doc));
        return doc[0];
    });
    return res;
}

export function getModelDocFromDB(srcHandle : ISrcHandle, modelName : string) : Promise<IModelDoc> {
    return srcHandle.getJSON(modelName + ".model.doc.json")
    .then((doc : IModelDoc) =>
        {
            doc.modelname = modelName;
            debuglog( ()=> ' loaded Model doc ${modelName} from db : '
            + (doc.modelname) );
            debuglog('here the result' + JSON.stringify(doc));
            return doc;
        }
    );
}

export const MongoNLQ = {
    MODELNAME_METAMODELS : "metamodels",
    COLL_METAMODELS : "metamodels",
};

export const MongooseNLQ = {
    MONGOOSE_MODELNAME_METAMODELS : "metamodels"
};

export function validateDocMongoose(srcHandle : ISrcHandle, collectionname, schema : ISrcHandle, doc : any ) {
    var DocModel;
    //console.log('schema ' + JSON.stringify(schema));
    if(srcHandle.modelNames().indexOf(collectionname) >= 0) {
        DocModel = srcHandle.model(collectionname);
    } else {
        DocModel = srcHandle.model(collectionname, schema);

    }
    return validateDocVsMongooseModel(DocModel, doc);
}

export function validateDocVsMongooseModel(model, doc : any) {
    return new Promise<any>((resolve,reject) => {
        var theDoc = new model(doc);
        theDoc.validate((err) =>  {
            if (err) {
                //console.log(err);
                reject(err);
            }
        else {
            resolve(theDoc);
        }
        });
    });
}

/*
export function validateDoc(collectionname: string, schema : ISrcHandle.Schema, doc : any) {
  var jsonSchemaR = (schema as any).jsonSchema();
  var jsonSchema = _.cloneDeep(jsonSchemaR);
  traverseExecuting(jsonSchema, function(obj,val,key) {
    if(key === 'properties' && obj.type === 'object') {
        //console.log('augmenting schema');
        obj.additionalProperties = false;
    }
  });

  debuglog(()=> ` here json schema ` + (JSON.stringify(jsonSchema,undefined,2)));
  var Validator = require('jsonschema').Validator;
  var v = new Validator();
  //console.log(JSON.stringify(jsonSchema,undefined,2));
  var valresult = v.validate(doc,jsonSchema);
  if(valresult.errors.length) {
      throw new Error("Schema validating against JSON Schema failed : " + JSON.stringify(valresult.errors,undefined,2));
  }
  return true;
}

*/