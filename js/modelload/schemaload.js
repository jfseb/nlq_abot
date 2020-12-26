"use strict";
/**
 * Functionality managing the match models
 *
 * @file
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDocVsMongooseModel = exports.validateDocMongoose = exports.MongooseNLQ = exports.MongoNLQ = exports.getModelDocFromDB = exports.getExtendSchemaDocFromDB = exports.getOperatorsFromDB = exports.getFillersFromDB = exports.getOrCreateModelOperators = exports.getOrCreateModelFillers = exports.makeMongoCollectionName = exports.augmentMongooseSchema = exports.loadModelDoc = exports.loadExtendedMongooseSchema = exports.typeProps = exports.replaceIfTypeDeleteM = exports.mapType = exports.loadModelNames = exports.cmpTools = void 0;
//import * as intf from 'constants';
const debug = require("debugf");
var debuglog = debug('schemaload');
const FUtils = require("../model/model");
//import * as CircularSer from 'abot_utils';
//import * as Distance from 'abot_stringdist';
const process = require("process");
const _ = require("lodash");
const console_1 = require("console");
/**
 * WATCH out, this instruments srcHandle!
 */
// require('srcHandle-schema-jsonschema')(srcHandle);
/**
 * the model path, may be controlled via environment variable
 */
var envModelPath = process.env["ABOT_MODELPATH"] || "node_modules/abot_testmodel/testmodel";
function cmpTools(a, b) {
    return a.name.localeCompare(b.name);
}
exports.cmpTools = cmpTools;
const ExtendedSchema_props = {
    "modelname": {
        "type": String,
        "trim": true,
        "required": true
    },
    "domain": {
        "type": String,
        "trim": true,
        "required": true
    },
    "mongoosemodelname": {
        "type": String,
        "trim": true,
        "required": true
    },
    "collectionname": {
        "type": String,
        "trim": true,
        "required": true
    },
    "props": {},
    "index": {}
};
const ExtendedSchema_index = {
    "modelname": "text"
};
// load the models
function loadModelNames(modelPath) {
    modelPath = modelPath || envModelPath;
    debuglog(() => `modelpath is ${modelPath} `);
    var mdls = FUtils.readFileAsJSON(modelPath + '/models.json');
    mdls.forEach(name => {
        if (name !== makeMongoCollectionName(name)) {
            throw new Error('bad modelname, must terminate with s and be lowercase');
        }
    });
    return mdls;
}
exports.loadModelNames = loadModelNames;
;
function mapType(val) {
    if (val === "String") {
        return String;
    }
    if (val === "Boolean") {
        return Boolean;
    }
    if (val === "Number") {
        return Number;
    }
    throw new Error(" illegal type " + val + " expected String, Boolean, Number, ...");
}
exports.mapType = mapType;
function replaceIfTypeDeleteM(obj, val, key) {
    if (key.substr(0, 3) === "_m_") {
        delete obj[key];
        return;
    }
    ;
    if (key === "type" && typeof val === "string") {
        var r = mapType(val);
        obj[key] = r;
    }
}
exports.replaceIfTypeDeleteM = replaceIfTypeDeleteM;
function traverseExecuting(obj, fn) {
    _.forIn(obj, function (val, key) {
        //    console.log(val + " -> " + key + " ");
        fn(obj, val, key);
        if (_.isArray(val)) {
            val.forEach(function (el) {
                if (_.isObject(el)) {
                    traverseExecuting(el, fn);
                }
            });
        }
        if (_.isObject(val)) {
            traverseExecuting(obj[key], fn);
        }
    });
}
function traverseReplacingType(obj) {
    return traverseExecuting(obj, replaceIfTypeDeleteM);
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
function typeProps(a) {
    var aCloned = _.cloneDeep(a);
    //console.log(JSON.stringify(aCloned, undefined, 2));
    traverseReplacingType(aCloned);
    return aCloned;
}
exports.typeProps = typeProps;
function loadExtendedMongooseSchema(modelPath, modelName) {
    var filename = modelPath + '/' + modelName + '.model.mongooseschema.json';
    debuglog(() => `attempting to read ${filename}`);
    var schemaSer = FUtils.readFileAsJSON(filename);
    schemaSer.modelName = modelName;
    return schemaSer;
}
exports.loadExtendedMongooseSchema = loadExtendedMongooseSchema;
function loadModelDoc(modelPath, modelName) {
    var docSer = FUtils.readFileAsJSON(modelPath + '/' + modelName + '.model.doc.json');
    docSer.modelname = modelName;
    return docSer;
}
exports.loadModelDoc = loadModelDoc;
var aPromise = global.Promise;
;
function augmentMongooseSchema(modelDoc, schemaRaw) {
    debuglog(() => 'augmenting for ' + modelDoc.modelname);
    var res = { domain: modelDoc.domain,
        modelname: modelDoc.modelname
    };
    return Object.assign(res, schemaRaw);
}
exports.augmentMongooseSchema = augmentMongooseSchema;
/**
 * returns a srcHandle collection name
 * @param modelName
 */
function makeMongoCollectionName(modelName) {
    console_1.assert(modelName == modelName.toLowerCase());
    return modelName;
}
exports.makeMongoCollectionName = makeMongoCollectionName;
var SchemaOperators = { operators: {}, synonyms: {} };
var SchemaFillers = { fillers: [{
            type: String
        }]
};
function getOrCreateModelFillers(srcHandle) {
    if (srcHandle.modelNames().indexOf('fillers') >= 0) {
        return srcHandle.model('fillers');
    }
    else {
        return srcHandle.model('fillers', SchemaFillers);
    }
}
exports.getOrCreateModelFillers = getOrCreateModelFillers;
function getOrCreateModelOperators(srcHandle) {
    if (srcHandle.modelNames().indexOf('operators') >= 0) {
        return srcHandle.model('operators');
    }
    else {
        return srcHandle.model('operators', SchemaOperators);
    }
}
exports.getOrCreateModelOperators = getOrCreateModelOperators;
function getFillersFromDB(srcHandle) {
    return srcHandle.getJSON("filler.json");
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
exports.getFillersFromDB = getFillersFromDB;
function getOperatorsFromDB(srcHandle) {
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
exports.getOperatorsFromDB = getOperatorsFromDB;
function getExtendSchemaDocFromDB(srcHandle, modelName) {
    var mongooseModelName = modelName;
    //var model_ES = srcHandle.model(MongooseNLQ.MONGOOSE_MODELNAME_EXTENDEDSCHEMAS);
    var res = srcHandle.getJSONArr(modelName + ".model.mongooseschema.json") /*model_ES.find({ modelname : modelName}).lean().exec()
    */
        .then((doc) => {
        doc[0].modelname = modelName;
        debuglog(() => ` loaded Es doc ${modelName} returned ${doc.length} docus from db : `
            + doc[0].modelname + `` + doc[0].collectionname);
        debuglog(() => 'here the result' + JSON.stringify(doc));
        return doc[0];
    });
    return res;
}
exports.getExtendSchemaDocFromDB = getExtendSchemaDocFromDB;
function getModelDocFromDB(srcHandle, modelName) {
    return srcHandle.getJSON(modelName + ".model.doc.json")
        .then((doc) => {
        doc.modelname = modelName;
        debuglog(() => ' loaded Model doc ${modelName} from db : '
            + (doc.modelname));
        debuglog('here the result' + JSON.stringify(doc));
        return doc;
    });
}
exports.getModelDocFromDB = getModelDocFromDB;
exports.MongoNLQ = {
    MODELNAME_METAMODELS: "metamodels",
    COLL_METAMODELS: "metamodels",
};
exports.MongooseNLQ = {
    MONGOOSE_MODELNAME_METAMODELS: "metamodels"
};
function validateDocMongoose(srcHandle, collectionname, schema, doc) {
    var DocModel;
    //console.log('schema ' + JSON.stringify(schema));
    if (srcHandle.modelNames().indexOf(collectionname) >= 0) {
        DocModel = srcHandle.model(collectionname);
    }
    else {
        DocModel = srcHandle.model(collectionname, schema);
    }
    return validateDocVsMongooseModel(DocModel, doc);
}
exports.validateDocMongoose = validateDocMongoose;
function validateDocVsMongooseModel(model, doc) {
    return new Promise((resolve, reject) => {
        var theDoc = new model(doc);
        theDoc.validate((err) => {
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
exports.validateDocVsMongooseModel = validateDocVsMongooseModel;
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tb2RlbGxvYWQvc2NoZW1hbG9hZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7O0FBRUgsb0NBQW9DO0FBQ3BDLGdDQUFnQztBQUVoQyxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7QUFTbkMseUNBQXlDO0FBSXpDLDRDQUE0QztBQUM1Qyw4Q0FBOEM7QUFDOUMsbUNBQW1DO0FBQ25DLDRCQUE0QjtBQUU1QixxQ0FBaUM7QUFFakM7O0dBRUc7QUFDSCxxREFBcUQ7QUFDckQ7O0dBRUc7QUFDSCxJQUFJLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksdUNBQXVDLENBQUM7QUFFNUYsU0FBZ0IsUUFBUSxDQUFDLENBQWUsRUFBRSxDQUFlO0lBQ3ZELE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3RDLENBQUM7QUFGRCw0QkFFQztBQU9ELE1BQU0sb0JBQW9CLEdBQUc7SUFDekIsV0FBVyxFQUFFO1FBQ1gsTUFBTSxFQUFFLE1BQU07UUFDZCxNQUFNLEVBQUUsSUFBSTtRQUNaLFVBQVUsRUFBRyxJQUFJO0tBQ2xCO0lBQ0QsUUFBUSxFQUFFO1FBQ1IsTUFBTSxFQUFFLE1BQU07UUFDZCxNQUFNLEVBQUUsSUFBSTtRQUNaLFVBQVUsRUFBRyxJQUFJO0tBQ2xCO0lBQ0QsbUJBQW1CLEVBQUU7UUFDbkIsTUFBTSxFQUFFLE1BQU07UUFDZCxNQUFNLEVBQUUsSUFBSTtRQUNaLFVBQVUsRUFBRyxJQUFJO0tBQ2xCO0lBQ0QsZ0JBQWdCLEVBQUU7UUFDaEIsTUFBTSxFQUFFLE1BQU07UUFDZCxNQUFNLEVBQUUsSUFBSTtRQUNaLFVBQVUsRUFBRyxJQUFJO0tBQ2xCO0lBQ0QsT0FBTyxFQUFHLEVBQUU7SUFDWixPQUFPLEVBQUcsRUFBRTtDQUNmLENBQUM7QUFDRixNQUFNLG9CQUFvQixHQUFH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YUFDZjtpQkFDQTtnQkFDRCxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDbkI7UUFDRCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQWJELGdFQWFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFzQkUiLCJmaWxlIjoibW9kZWxsb2FkL3NjaGVtYWxvYWQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogRnVuY3Rpb25hbGl0eSBtYW5hZ2luZyB0aGUgbWF0Y2ggbW9kZWxzXHJcbiAqXHJcbiAqIEBmaWxlXHJcbiAqL1xyXG5cclxuLy9pbXBvcnQgKiBhcyBpbnRmIGZyb20gJ2NvbnN0YW50cyc7XHJcbmltcG9ydCAqIGFzIGRlYnVnIGZyb20gJ2RlYnVnZic7XHJcblxyXG52YXIgZGVidWdsb2cgPSBkZWJ1Zygnc2NoZW1hbG9hZCcpO1xyXG5cclxuLy9jb25zdCBsb2FkbG9nID0gbG9nZ2VyLmxvZ2dlcignbW9kZWxsb2FkJywgJycpO1xyXG5cclxuaW1wb3J0ICogIGFzIElNYXRjaCBmcm9tICcuLi9tYXRjaC9pZm1hdGNoJztcclxuLy9pbXBvcnQgKiBhcyBJbnB1dEZpbHRlclJ1bGVzIGZyb20gJy4uL21hdGNoL3J1bGUnO1xyXG4vL2ltcG9ydCAqIGFzIFRvb2xzIGZyb20gJy4uL21hdGNoL3Rvb2xzJztcclxuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgKiBhcyBNZXRhIGZyb20gJy4uL21vZGVsL21ldGEnO1xyXG5pbXBvcnQgKiBhcyBGVXRpbHMgZnJvbSAnLi4vbW9kZWwvbW9kZWwnO1xyXG5pbXBvcnQgeyBJRk1vZGVsIGFzIElGTW9kZWwgfSBmcm9tICcuLi9tb2RlbC9pbmRleF9tb2RlbCc7XHJcbmltcG9ydCAqIGFzIE1vbmdvTWFwIGZyb20gJy4uL21vZGVsL21vbmdvbWFwJztcclxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnYWJvdF91dGlscyc7XHJcbi8vaW1wb3J0ICogYXMgQ2lyY3VsYXJTZXIgZnJvbSAnYWJvdF91dGlscyc7XHJcbi8vaW1wb3J0ICogYXMgRGlzdGFuY2UgZnJvbSAnYWJvdF9zdHJpbmdkaXN0JztcclxuaW1wb3J0ICogYXMgcHJvY2VzcyBmcm9tICdwcm9jZXNzJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgeyBJU3JjSGFuZGxlICwgSVBzZXVkb1NjaGVtYSwgSVBzZXVkb01vZGVsIH0gZnJvbSAnLi4vbW9kZWwvc3JjaGFuZGxlJztcclxuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSAnY29uc29sZSc7XHJcblxyXG4vKipcclxuICogV0FUQ0ggb3V0LCB0aGlzIGluc3RydW1lbnRzIHNyY0hhbmRsZSFcclxuICovXHJcbi8vIHJlcXVpcmUoJ3NyY0hhbmRsZS1zY2hlbWEtanNvbnNjaGVtYScpKHNyY0hhbmRsZSk7XHJcbi8qKlxyXG4gKiB0aGUgbW9kZWwgcGF0aCwgbWF5IGJlIGNvbnRyb2xsZWQgdmlhIGVudmlyb25tZW50IHZhcmlhYmxlXHJcbiAqL1xyXG52YXIgZW52TW9kZWxQYXRoID0gcHJvY2Vzcy5lbnZbXCJBQk9UX01PREVMUEFUSFwiXSB8fCBcIm5vZGVfbW9kdWxlcy9hYm90X3Rlc3Rtb2RlbC90ZXN0bW9kZWxcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjbXBUb29scyhhOiBJTWF0Y2guSVRvb2wsIGI6IElNYXRjaC5JVG9vbCkge1xyXG4gIHJldHVybiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpO1xyXG59XHJcblxyXG5cclxudHlwZSBJTW9kZWwgPSBJTWF0Y2guSU1vZGVsO1xyXG5cclxudHlwZSBJTW9kZWxEb2MgPSBJTWF0Y2guSU1vZGVsRG9jO1xyXG5cclxuY29uc3QgRXh0ZW5kZWRTY2hlbWFfcHJvcHMgPSB7XHJcbiAgICBcIm1vZGVsbmFtZVwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBTdHJpbmcsXHJcbiAgICAgIFwidHJpbVwiOiB0cnVlLFxyXG4gICAgICBcInJlcXVpcmVkXCIgOiB0cnVlXHJcbiAgICB9LFxyXG4gICAgXCJkb21haW5cIjoge1xyXG4gICAgICBcInR5cGVcIjogU3RyaW5nLFxyXG4gICAgICBcInRyaW1cIjogdHJ1ZSxcclxuICAgICAgXCJyZXF1aXJlZFwiIDogdHJ1ZVxyXG4gICAgfSxcclxuICAgIFwibW9uZ29vc2Vtb2RlbG5hbWVcIjoge1xyXG4gICAgICBcInR5cGVcIjogU3RyaW5nLFxyXG4gICAgICBcInRyaW1cIjogdHJ1ZSxcclxuICAgICAgXCJyZXF1aXJlZFwiIDogdHJ1ZVxyXG4gICAgfSxcclxuICAgIFwiY29sbGVjdGlvbm5hbWVcIjoge1xyXG4gICAgICBcInR5cGVcIjogU3RyaW5nLFxyXG4gICAgICBcInRyaW1cIjogdHJ1ZSxcclxuICAgICAgXCJyZXF1aXJlZFwiIDogdHJ1ZVxyXG4gICAgfSxcclxuICAgIFwicHJvcHNcIiA6IHt9LFxyXG4gICAgXCJpbmRleFwiIDoge31cclxufTtcclxuY29uc3QgRXh0ZW5kZWRTY2hlbWFfaW5kZXggPSB7XHJcbiAgICBcIm1vZGVsbmFtZVwiIDogXCJ0ZXh0XCJcclxufTtcclxuXHJcblxyXG5cclxuLy8gbG9hZCB0aGUgbW9kZWxzXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbG9hZE1vZGVsTmFtZXMobW9kZWxQYXRoIDogc3RyaW5nKSA6IHN0cmluZ1tdIHtcclxuICBtb2RlbFBhdGggPSBtb2RlbFBhdGggfHwgZW52TW9kZWxQYXRoO1xyXG4gIGRlYnVnbG9nKCgpPT4gYG1vZGVscGF0aCBpcyAke21vZGVsUGF0aH0gYCk7XHJcbiAgdmFyIG1kbHMgPSBGVXRpbHMucmVhZEZpbGVBc0pTT04obW9kZWxQYXRoICsgJy9tb2RlbHMuanNvbicpO1xyXG4gIG1kbHMuZm9yRWFjaChuYW1lID0+IHtcclxuICAgIGlmKG5hbWUgIT09IG1ha2VNb25nb0NvbGxlY3Rpb25OYW1lKG5hbWUpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdiYWQgbW9kZWxuYW1lLCBtdXN0IHRlcm1pbmF0ZSB3aXRoIHMgYW5kIGJlIGxvd2VyY2FzZScpO1xyXG4gICAgfVxyXG4gIH0pXHJcbiAgcmV0dXJuIG1kbHM7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVJhd1NjaGVtYSB7XHJcbiAgICBwcm9wczogYW55W10sXHJcbiAgICBpbmRleCA6IGFueVxyXG59XHJcblxyXG4vKlxyXG5leHBvcnQgaW50ZXJmYWNlIElNb2RlbERvY0NhdGVnb3J5UmVjIHtcclxuICAgIGNhdGVnb3J5IDogc3RyaW5nLFxyXG4gICAgY2F0ZWdvcnlfZGVzY3JpcHRpb24gOiBzdHJpbmcsXHJcbiAgICBRQkVDb2x1bW5Qcm9wcyA6IHtcclxuICAgICAgICBcImRlZmF1bHRXaWR0aFwiOiBudW1iZXIsXHJcbiAgICAgICAgXCJRQkVcIjogYm9vbGVhbixcclxuICAgICAgICBcIkxVTlJJbmRleFwiOiBib29sZWFuXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiY2F0ZWdvcnlfc3lub255bXNcIjogc3RyaW5nW10sXHJcbiAgICB3b3JkaW5kZXggOiBib29sZWFuLFxyXG4gICAgZXhhY3RtYXRjaDogYm9vbGVhbixcclxuICAgIHNob3dNXHJcbn07XHJcbiovXHJcblxyXG5cclxuLypcclxuZXhwb3J0IGludGVyZmFjZSBJTW9kZWxEb2Mge1xyXG4gICAgZG9tYWluIDogc3RyaW5nLFxyXG4gICAgbW9kZWxuYW1lPyA6IHN0cmluZyxcclxuICAgIGNvbGxlY3Rpb25uYW1lPyA6IHN0cmluZyxcclxuICAgIGRvbWFpbl9kZXNjcmlwdGlvbiA6IHN0cmluZ1xyXG4gICAgX2NhdGVnb3JpZXMgOiBJTWF0Y2guSU1vZGVsQ2F0ZWdvcnlSZWNbXSxcclxuICAgIGNvbHVtbnM6IHN0cmluZ1tdLFxyXG4gICAgZG9tYWluX3N5bm9ueW1zIDogc3RyaW5nW11cclxuXHJcbn0qL1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJRXh0ZW5kZWRTY2hlbWEgZXh0ZW5kcyBJUmF3U2NoZW1he1xyXG4gICAgZG9tYWluIDogc3RyaW5nLFxyXG4gICAgbW9kZWxuYW1lIDogc3RyaW5nXHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFwVHlwZSh2YWwgOiBzdHJpbmcpIDogYW55IHtcclxuICAgIGlmKHZhbCA9PT0gXCJTdHJpbmdcIikge1xyXG4gICAgICAgIHJldHVybiBTdHJpbmc7XHJcbiAgICB9XHJcbiAgICBpZih2YWwgPT09IFwiQm9vbGVhblwiKSB7XHJcbiAgICAgICAgcmV0dXJuIEJvb2xlYW47XHJcbiAgICB9XHJcbiAgICBpZih2YWwgPT09IFwiTnVtYmVyXCIpIHtcclxuICAgICAgICByZXR1cm4gTnVtYmVyO1xyXG4gICAgfVxyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiIGlsbGVnYWwgdHlwZSBcIiArIHZhbCArIFwiIGV4cGVjdGVkIFN0cmluZywgQm9vbGVhbiwgTnVtYmVyLCAuLi5cIik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZXBsYWNlSWZUeXBlRGVsZXRlTShvYmogOiBhbnksIHZhbCA6IGFueSwga2V5IDogc3RyaW5nKSB7XHJcbiAgICBpZihrZXkuc3Vic3RyKDAsMykgPT09IFwiX21fXCIpIHtcclxuICAgICAgICBkZWxldGUgb2JqW2tleV07XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfTtcclxuICAgIGlmKGtleSA9PT0gXCJ0eXBlXCIgJiYgdHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgIHZhciByID0gbWFwVHlwZSh2YWwpO1xyXG4gICAgICAgIG9ialtrZXldID0gcjtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gdHJhdmVyc2VFeGVjdXRpbmcob2JqLCBmbiApIHtcclxuICAgIF8uZm9ySW4ob2JqLCBmdW5jdGlvbiAodmFsLCBrZXkpIHtcclxuICAgIC8vICAgIGNvbnNvbGUubG9nKHZhbCArIFwiIC0+IFwiICsga2V5ICsgXCIgXCIpO1xyXG4gICAgICAgIGZuKG9iaix2YWwsa2V5KTtcclxuICAgICAgICBpZiAoXy5pc0FycmF5KHZhbCkpIHtcclxuICAgICAgICAgICAgdmFsLmZvckVhY2goZnVuY3Rpb24oZWwpIHtcclxuICAgICAgICAgICAgICAgIGlmIChfLmlzT2JqZWN0KGVsKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyYXZlcnNlRXhlY3V0aW5nKGVsLGZuKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChfLmlzT2JqZWN0KHZhbCkpIHtcclxuICAgICAgICAgICAgdHJhdmVyc2VFeGVjdXRpbmcob2JqW2tleV0sZm4pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0cmF2ZXJzZVJlcGxhY2luZ1R5cGUob2JqKSB7XHJcbiAgICByZXR1cm4gdHJhdmVyc2VFeGVjdXRpbmcob2JqLHJlcGxhY2VJZlR5cGVEZWxldGVNKTtcclxuICAgIC8qXHJcbiAgICBfLmZvckluKG9iaiwgZnVuY3Rpb24gKHZhbCwga2V5KSB7XHJcbiAgICAvLyAgICBjb25zb2xlLmxvZyh2YWwgKyBcIiAtPiBcIiArIGtleSArIFwiIFwiKTtcclxuICAgICAgICByZXBsYWNlSWZUeXBlRGVsZXRlTShvYmosdmFsLGtleSk7XHJcbiAgICAgICAgaWYgKF8uaXNBcnJheSh2YWwpKSB7XHJcbiAgICAgICAgICAgIHZhbC5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoXy5pc09iamVjdChlbCkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0cmF2ZXJzZVJlcGxhY2luZ1R5cGUoZWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKF8uaXNPYmplY3QodmFsKSkge1xyXG4gICAgICAgICAgICB0cmF2ZXJzZVJlcGxhY2luZ1R5cGUob2JqW2tleV0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgKi9cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHR5cGVQcm9wcyhhIDogYW55KSA6IGFueSB7XHJcbiAgIHZhciBhQ2xvbmVkID0gXy5jbG9uZURlZXAoYSk7XHJcbiAgIC8vY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoYUNsb25lZCwgdW5kZWZpbmVkLCAyKSk7XHJcbiAgIHRyYXZlcnNlUmVwbGFjaW5nVHlwZShhQ2xvbmVkKTtcclxuICAgcmV0dXJuIGFDbG9uZWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsb2FkRXh0ZW5kZWRNb25nb29zZVNjaGVtYShtb2RlbFBhdGg6IHN0cmluZywgbW9kZWxOYW1lIDogc3RyaW5nKTogSUV4dGVuZGVkU2NoZW1hIHtcclxuICB2YXIgZmlsZW5hbWUgPSAgbW9kZWxQYXRoICsgJy8nICsgbW9kZWxOYW1lICsgJy5tb2RlbC5tb25nb29zZXNjaGVtYS5qc29uJztcclxuICBkZWJ1Z2xvZygoKT0+IGBhdHRlbXB0aW5nIHRvIHJlYWQgJHtmaWxlbmFtZX1gKVxyXG4gIHZhciBzY2hlbWFTZXIgPSBGVXRpbHMucmVhZEZpbGVBc0pTT04oZmlsZW5hbWUpO1xyXG4gIHNjaGVtYVNlci5tb2RlbE5hbWUgPSBtb2RlbE5hbWU7XHJcbiAgcmV0dXJuIHNjaGVtYVNlcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRNb2RlbERvYyhtb2RlbFBhdGg6IHN0cmluZywgbW9kZWxOYW1lIDogc3RyaW5nKTogSU1vZGVsRG9jIHtcclxuICB2YXIgZG9jU2VyID0gRlV0aWxzLnJlYWRGaWxlQXNKU09OKCBtb2RlbFBhdGggKyAnLycgKyBtb2RlbE5hbWUgKyAnLm1vZGVsLmRvYy5qc29uJyk7XHJcbiAgZG9jU2VyLm1vZGVsbmFtZSA9IG1vZGVsTmFtZTtcclxuICByZXR1cm4gZG9jU2VyO1xyXG59XHJcblxyXG52YXIgYVByb21pc2UgPSBnbG9iYWwuUHJvbWlzZTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSU1vZGVsUmVjICB7XHJcbiAgICBjb2xsZWN0aW9uTmFtZSA6IHN0cmluZyxcclxuICAgIG1vZGVsIDogSVBzZXVkb01vZGVsLFxyXG4gICAgc2NoZW1hIDogSVBzZXVkb1NjaGVtYVxyXG59O1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhdWdtZW50TW9uZ29vc2VTY2hlbWEoIG1vZGVsRG9jIDogSU1vZGVsRG9jLCBzY2hlbWFSYXcgOiBJUmF3U2NoZW1hKSA6IElFeHRlbmRlZFNjaGVtYSB7XHJcbiAgICBkZWJ1Z2xvZyggKCk9PidhdWdtZW50aW5nIGZvciAnICsgbW9kZWxEb2MubW9kZWxuYW1lKTtcclxuICAgIHZhciByZXMgPSB7IGRvbWFpbiA6IG1vZGVsRG9jLmRvbWFpbixcclxuICAgICAgICBtb2RlbG5hbWUgOiBtb2RlbERvYy5tb2RlbG5hbWVcclxuICAgICB9IGFzIElFeHRlbmRlZFNjaGVtYTtcclxuICAgIHJldHVybiAoT2JqZWN0IGFzIGFueSkuYXNzaWduKHJlcywgc2NoZW1hUmF3KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIHJldHVybnMgYSBzcmNIYW5kbGUgY29sbGVjdGlvbiBuYW1lXHJcbiAqIEBwYXJhbSBtb2RlbE5hbWVcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBtYWtlTW9uZ29Db2xsZWN0aW9uTmFtZShtb2RlbE5hbWUgOiBzdHJpbmcpIDogc3RyaW5nIHtcclxuICAgIGFzc2VydCggbW9kZWxOYW1lID09IG1vZGVsTmFtZS50b0xvd2VyQ2FzZSgpKTsgXHJcbiAgICByZXR1cm4gbW9kZWxOYW1lOyBcclxufVxyXG5cclxudmFyIFNjaGVtYU9wZXJhdG9ycyA9IHsgb3BlcmF0b3JzIDoge30sIHN5bm9ueW1zIDoge319O1xyXG5cclxudmFyIFNjaGVtYUZpbGxlcnMgPSB7IGZpbGxlcnMgOiBbe1xyXG4gICAgdHlwZSA6IFN0cmluZ1xyXG59XVxyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlTW9kZWxGaWxsZXJzKHNyY0hhbmRsZTogSVNyY0hhbmRsZSkgOiBJUHNldWRvTW9kZWwge1xyXG4gICAgaWYoc3JjSGFuZGxlLm1vZGVsTmFtZXMoKS5pbmRleE9mKCdmaWxsZXJzJykgPj0gMCkge1xyXG4gICAgICAgIHJldHVybiBzcmNIYW5kbGUubW9kZWwoJ2ZpbGxlcnMnKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHNyY0hhbmRsZS5tb2RlbCgnZmlsbGVycycsIFNjaGVtYUZpbGxlcnMgYXMgIElQc2V1ZG9TY2hlbWEpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVNb2RlbE9wZXJhdG9ycyhzcmNIYW5kbGU6IElTcmNIYW5kbGUpIDogSVBzZXVkb01vZGVsIHtcclxuICAgIGlmKHNyY0hhbmRsZS5tb2RlbE5hbWVzKCkuaW5kZXhPZignb3BlcmF0b3JzJykgPj0gMCkge1xyXG4gICAgICAgIHJldHVybiBzcmNIYW5kbGUubW9kZWwoJ29wZXJhdG9ycycpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gc3JjSGFuZGxlLm1vZGVsKCdvcGVyYXRvcnMnLCBTY2hlbWFPcGVyYXRvcnMgYXMgYW55IGFzIElQc2V1ZG9Nb2RlbCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRGaWxsZXJzRnJvbURCKCBzcmNIYW5kbGUgOiBJU3JjSGFuZGxlKSA6IFByb21pc2U8c3RyaW5nW10+IHtcclxuXHJcbiAgICByZXR1cm4gc3JjSGFuZGxlLmdldEpTT04oXCJmaWxsZXIuanNvblwiKSBhcyBQcm9taXNlPHN0cmluZ1tdPjtcclxuICAgIC8qXHJcbiAgICB2YXIgZmlsbGVyTW9kZWwgPSBnZXRPckNyZWF0ZU1vZGVsRmlsbGVycyhzcmNIYW5kbGUpO1xyXG4gICAgcmV0dXJuIGZpbGxlck1vZGVsLmZpbmQoe30pLmxlYW4oKS5leGVjKCkudGhlbiggKHZhbHMgOiBhbnlbXSkgPT4ge1xyXG4gICAgICAgIGlmKHZhbHMubGVuZ3RoICE9PSAxKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZXhwZWN0ZWQgZXhhY3RseSBvbmUgb3BlcmF0b3JzIGVudHJ5ICcpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHZhbHNbMF07XHJcbiAgICB9KTtcclxuICAgICovXHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3BlcmF0b3JzRnJvbURCKCBzcmNIYW5kbGUgOiBJU3JjSGFuZGxlKSA6IFByb21pc2U8YW55PiB7XHJcbiAgICByZXR1cm4gc3JjSGFuZGxlLmdldEpTT04oJ29wZXJhdG9ycy5qc29uJyk7XHJcbiAgICAvKiAgIFxyXG4gICAgdmFyIG9wZXJhdG9yTW9kZWwgPSBnZXRPckNyZWF0ZU1vZGVsT3BlcmF0b3JzKHNyY0hhbmRsZSk7XHJcblxyXG4gICAgcmV0dXJuIG9wZXJhdG9yTW9kZWwuZmluZCh7fSkubGVhbigpLmV4ZWMoKS50aGVuKCAodmFscyA6IGFueVtdKSA9PiB7XHJcbiAgICAgICAgaWYodmFscy5sZW5ndGggIT09IDEpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdleHBlY3RlZCBleGFjdGx5IG9uZSBvcGVyYXRvcnMgZW50cnkgJyk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gdmFsc1swXTtcclxuICAgIH0pO1xyXG4gICAgKi9cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEV4dGVuZFNjaGVtYURvY0Zyb21EQihzcmNIYW5kbGUgOiBJU3JjSGFuZGxlLCBtb2RlbE5hbWUgOiBzdHJpbmcpIDogUHJvbWlzZTxJRXh0ZW5kZWRTY2hlbWE+IHtcclxuICAgIHZhciBtb25nb29zZU1vZGVsTmFtZSA9IG1vZGVsTmFtZTtcclxuICAgIC8vdmFyIG1vZGVsX0VTID0gc3JjSGFuZGxlLm1vZGVsKE1vbmdvb3NlTkxRLk1PTkdPT1NFX01PREVMTkFNRV9FWFRFTkRFRFNDSEVNQVMpO1xyXG4gICAgdmFyIHJlcyA9IHNyY0hhbmRsZS5nZXRKU09OQXJyKG1vZGVsTmFtZSArIFwiLm1vZGVsLm1vbmdvb3Nlc2NoZW1hLmpzb25cIikgLyptb2RlbF9FUy5maW5kKHsgbW9kZWxuYW1lIDogbW9kZWxOYW1lfSkubGVhbigpLmV4ZWMoKVxyXG4gICAgKi9cclxuICAgICAgLnRoZW4oKGRvYykgPT5cclxuICAgIHsgICBkb2NbMF0ubW9kZWxuYW1lID0gbW9kZWxOYW1lOyBcclxuICAgICAgICBkZWJ1Z2xvZyggKCk9PiBgIGxvYWRlZCBFcyBkb2MgJHttb2RlbE5hbWV9IHJldHVybmVkICR7KGRvYyBhcyBhbnkpLmxlbmd0aH0gZG9jdXMgZnJvbSBkYiA6IGBcclxuICAgICAgICArIChkb2MgYXMgYW55KVswXS5tb2RlbG5hbWUgKyBgYCArIChkb2MgYXMgYW55KVswXS5jb2xsZWN0aW9ubmFtZSApO1xyXG4gICAgICAgIGRlYnVnbG9nKCgpID0+ICdoZXJlIHRoZSByZXN1bHQnICsgSlNPTi5zdHJpbmdpZnkoZG9jKSk7XHJcbiAgICAgICAgcmV0dXJuIGRvY1swXTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vZGVsRG9jRnJvbURCKHNyY0hhbmRsZSA6IElTcmNIYW5kbGUsIG1vZGVsTmFtZSA6IHN0cmluZykgOiBQcm9taXNlPElNb2RlbERvYz4ge1xyXG4gICAgcmV0dXJuIHNyY0hhbmRsZS5nZXRKU09OKG1vZGVsTmFtZSArIFwiLm1vZGVsLmRvYy5qc29uXCIpXHJcbiAgICAudGhlbigoZG9jIDogSU1vZGVsRG9jKSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZG9jLm1vZGVsbmFtZSA9IG1vZGVsTmFtZTtcclxuICAgICAgICAgICAgZGVidWdsb2coICgpPT4gJyBsb2FkZWQgTW9kZWwgZG9jICR7bW9kZWxOYW1lfSBmcm9tIGRiIDogJ1xyXG4gICAgICAgICAgICArIChkb2MubW9kZWxuYW1lKSApO1xyXG4gICAgICAgICAgICBkZWJ1Z2xvZygnaGVyZSB0aGUgcmVzdWx0JyArIEpTT04uc3RyaW5naWZ5KGRvYykpO1xyXG4gICAgICAgICAgICByZXR1cm4gZG9jO1xyXG4gICAgICAgIH1cclxuICAgICk7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBNb25nb05MUSA9IHtcclxuICAgIE1PREVMTkFNRV9NRVRBTU9ERUxTIDogXCJtZXRhbW9kZWxzXCIsXHJcbiAgICBDT0xMX01FVEFNT0RFTFMgOiBcIm1ldGFtb2RlbHNcIixcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBNb25nb29zZU5MUSA9IHtcclxuICAgIE1PTkdPT1NFX01PREVMTkFNRV9NRVRBTU9ERUxTIDogXCJtZXRhbW9kZWxzXCJcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZURvY01vbmdvb3NlKHNyY0hhbmRsZSA6IElTcmNIYW5kbGUsIGNvbGxlY3Rpb25uYW1lLCBzY2hlbWEgOiBJU3JjSGFuZGxlLCBkb2MgOiBhbnkgKSB7XHJcbiAgICB2YXIgRG9jTW9kZWw7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdzY2hlbWEgJyArIEpTT04uc3RyaW5naWZ5KHNjaGVtYSkpO1xyXG4gICAgaWYoc3JjSGFuZGxlLm1vZGVsTmFtZXMoKS5pbmRleE9mKGNvbGxlY3Rpb25uYW1lKSA+PSAwKSB7XHJcbiAgICAgICAgRG9jTW9kZWwgPSBzcmNIYW5kbGUubW9kZWwoY29sbGVjdGlvbm5hbWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBEb2NNb2RlbCA9IHNyY0hhbmRsZS5tb2RlbChjb2xsZWN0aW9ubmFtZSwgc2NoZW1hKTtcclxuXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsaWRhdGVEb2NWc01vbmdvb3NlTW9kZWwoRG9jTW9kZWwsIGRvYyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZURvY1ZzTW9uZ29vc2VNb2RlbChtb2RlbCwgZG9jIDogYW55KSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2U8YW55PigocmVzb2x2ZSxyZWplY3QpID0+IHtcclxuICAgICAgICB2YXIgdGhlRG9jID0gbmV3IG1vZGVsKGRvYyk7XHJcbiAgICAgICAgdGhlRG9jLnZhbGlkYXRlKChlcnIpID0+ICB7XHJcbiAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJlc29sdmUodGhlRG9jKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLypcclxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlRG9jKGNvbGxlY3Rpb25uYW1lOiBzdHJpbmcsIHNjaGVtYSA6IElTcmNIYW5kbGUuU2NoZW1hLCBkb2MgOiBhbnkpIHtcclxuICB2YXIganNvblNjaGVtYVIgPSAoc2NoZW1hIGFzIGFueSkuanNvblNjaGVtYSgpO1xyXG4gIHZhciBqc29uU2NoZW1hID0gXy5jbG9uZURlZXAoanNvblNjaGVtYVIpO1xyXG4gIHRyYXZlcnNlRXhlY3V0aW5nKGpzb25TY2hlbWEsIGZ1bmN0aW9uKG9iaix2YWwsa2V5KSB7XHJcbiAgICBpZihrZXkgPT09ICdwcm9wZXJ0aWVzJyAmJiBvYmoudHlwZSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAvL2NvbnNvbGUubG9nKCdhdWdtZW50aW5nIHNjaGVtYScpO1xyXG4gICAgICAgIG9iai5hZGRpdGlvbmFsUHJvcGVydGllcyA9IGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICBkZWJ1Z2xvZygoKT0+IGAgaGVyZSBqc29uIHNjaGVtYSBgICsgKEpTT04uc3RyaW5naWZ5KGpzb25TY2hlbWEsdW5kZWZpbmVkLDIpKSk7XHJcbiAgdmFyIFZhbGlkYXRvciA9IHJlcXVpcmUoJ2pzb25zY2hlbWEnKS5WYWxpZGF0b3I7XHJcbiAgdmFyIHYgPSBuZXcgVmFsaWRhdG9yKCk7XHJcbiAgLy9jb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShqc29uU2NoZW1hLHVuZGVmaW5lZCwyKSk7XHJcbiAgdmFyIHZhbHJlc3VsdCA9IHYudmFsaWRhdGUoZG9jLGpzb25TY2hlbWEpO1xyXG4gIGlmKHZhbHJlc3VsdC5lcnJvcnMubGVuZ3RoKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlNjaGVtYSB2YWxpZGF0aW5nIGFnYWluc3QgSlNPTiBTY2hlbWEgZmFpbGVkIDogXCIgKyBKU09OLnN0cmluZ2lmeSh2YWxyZXN1bHQuZXJyb3JzLHVuZGVmaW5lZCwyKSk7XHJcbiAgfVxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG4qLyJdfQ==
