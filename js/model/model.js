"use strict";
/**
 * Functionality managing the match models
 *
 * @file
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDomainCategoryFilterForTargetCategory = exports.getDomainCategoryFilterForTargetCategories = exports.getDomainsForCategory = exports.getPotentialWordCategoriesForDomain = exports.getTableColumns = exports.getCategoriesForDomain = exports.getShowURIRankCategoriesForDomain = exports.getShowURICategoriesForDomain = exports.checkDomainPresent = exports.getResultAsArray = exports.getOperator = exports.rankCategoryByImportance = exports.sortCategoriesByImportance = exports._loadModelsFull = exports.loadModels = exports.loadModelsOpeningConnection = exports.releaseModel = exports.readOperators = exports.readFillers = exports.addCloseExactRangeRules = exports.addRangeRulesUnlessPresent = exports.findNextLen = exports.sortFlatRecords = exports.splitRules = exports.getDomainsForBitField = exports.getDomainBitIndexSafe = exports.getDomainBitIndex = exports.getAllDomainsBitIndex = exports.loadModel = exports.hasRuleWithFact = exports.readFileAsJSON = exports.addBestSplit = exports.getCategoryRec = exports.getDistinctValues = exports.getExpandedRecordsForCategory = exports.getExpandedRecordsFull = exports.checkModelMongoMap = exports.filterRemapCategories2 = exports.filterRemapCategories = exports.getModelNameForDomain = exports.getModelForDomain = exports.getModelForModelName = exports.getMongooseModelNameForDomain = exports.getMongoCollectionNameForDomain = exports.getFactSynonyms = exports.getModelHandle = exports.getModelData = exports.asPromise = exports.propagateTypeToModelDoc = exports.cmpTools = void 0;
//import * as intf from 'constants';
const debugf = require("debugf");
var debuglog = debugf('model');
const srchandle_1 = require("./srchandle");
// the hardcoded domain metamodel!
const DOMAIN_METAMODEL = 'metamodel';
//const loadlog = logger.logger('modelload', '');
const IMatch = require("../match/ifmatch");
const InputFilterRules = require("../match/rule");
//import * as Tools from '../match/tools';
const fs = require("fs");
const Meta = require("./meta");
const Utils = require("abot_utils");
const CircularSer = require("abot_utils");
const Distance = require("abot_stringdist");
const process = require("process");
const _ = require("lodash");
//import * as ISchema from '../modelload/schemaload';
const Schemaload = require("../modelload/schemaload");
const MongoMap = require("./mongomap");
/**
 * the model path, may be controlled via environment variable
 */
var envModelPath = process.env["ABOT_MODELPATH"] || "node_modules/mgnlq_testmodel/testmodel";
function cmpTools(a, b) {
    return a.name.localeCompare(b.name);
}
exports.cmpTools = cmpTools;
function propagateTypeToModelDoc(modelDoc, eschema) {
    // props { "element_symbol":{"type":"String","trim":true,"_m_category":"element symbol","{
    modelDoc._categories.forEach(cat => {
        var propertyName = MongoMap.makeCanonicPropertyName(cat.category);
        var prop = MongoMap.findEschemaPropForCategory(eschema.props, cat.category);
        if (!prop) {
            if (modelDoc.modelname !== "metamXXXodels") {
                var err = "Unable to find property " + propertyName + " for category " + cat.category + " in model "
                    + modelDoc.modelname
                    + "; valid props are:\"" + Object.getOwnPropertyNames(eschema.props).join(",\n") + "\""
                    + " " + JSON.stringify(eschema.props);
                console.log(err);
                debuglog(err);
                throw new Error(err);
            }
        }
        else {
            debuglog(' augmenting type for \"' + cat.category + "(" + propertyName + ")\" with " + JSON.stringify(prop.type));
            cat.type = prop.type; // this may be ["String"] for an array type!
        }
    });
}
exports.propagateTypeToModelDoc = propagateTypeToModelDoc;
function asPromise(a) {
    return new Promise((resolve, reject) => { resolve(a); });
}
exports.asPromise = asPromise;
function getModelData(srcHandle, modelName, modelNames) {
    if (modelName == "metamodels") {
        return asPromise(modelNames.filter((a) => (a !== "metamodels")).map((a) => readFileAsJSON(srcHandle.getPath() + a + '.model.doc.json')));
    }
    else {
        return srcHandle.getJSON(modelName + ".data.json");
    }
}
exports.getModelData = getModelData;
/**
 * returns when all models are loaded and all modeldocs are made
 * @param srcHandle
 */
function getModelHandle(srcHandle, connectionString) {
    var res = {
        srcHandle: srcHandle,
        modelDocs: {},
        modelESchemas: {},
        mongoMaps: {}
    };
    //var modelES = Schemaload.getExtendedSchemaModel(srcHandle);
    return srcHandle.connect(connectionString).then(() => {
        var modelnames = srcHandle.modelNames();
        //return modelES.distinct('modelname').then(
        //var fn = (modelnames) => {
        debuglog(() => 'here distinct modelnames ' + JSON.stringify(modelnames));
        return Promise.all(modelnames.map(function (modelname) {
            debuglog(() => 'creating tripel for ' + modelname);
            return Promise.all([Schemaload.getExtendSchemaDocFromDB(srcHandle, modelname),
                Schemaload.getModelDocFromDB(srcHandle, modelname),
                getModelData(srcHandle, modelname, modelnames)
            ]).then((value) => {
                debuglog(() => 'attempting to load ' + modelname + ' to create mongomap');
                var [extendedSchema, modelDoc, data] = value;
                res.modelESchemas[modelname] = extendedSchema;
                res.modelDocs[modelname] = modelDoc;
                propagateTypeToModelDoc(modelDoc, extendedSchema);
                srcHandle.setModel(modelname, data, extendedSchema);
                /*  if ( modelname == "iupacs") {
                   debuglog(' modeldocs is ');
                   debuglog(' here ' + JSON.stringify(modelDoc));
                   debuglog(' here ' + JSON.stringify(extendedSchema));
                   console.log(' modelDocs is ' + JSON.stringify(modelDoc));
                   console.log('*** esschema is ' + JSON.stringify(extendedSchema));
               }*/
                res.mongoMaps[modelname] = MongoMap.makeMongoMap(modelDoc, extendedSchema);
                debuglog(() => 'created mongomap for ' + modelname);
            });
        })).then(() => {
            return res;
        });
    });
}
exports.getModelHandle = getModelHandle;
function getFactSynonyms(mongoHandle, modelname) {
    var model = mongoHandle.srcHandle.model(modelname);
    return model.aggregateSynonyms();
}
exports.getFactSynonyms = getFactSynonyms;
/*
export interface ISynonymBearingDoc {
    _synonyms: [{
        category: string,
        fact: string,
        synonyms: string[]
    }]
}
*/
function getMongoCollectionNameForDomain(theModel, domain) {
    var r = getMongooseModelNameForDomain(theModel, domain);
    return Schemaload.makeMongoCollectionName(r);
}
exports.getMongoCollectionNameForDomain = getMongoCollectionNameForDomain;
function getMongooseModelNameForDomain(theModel, domain) {
    var r = getModelNameForDomain(theModel.mongoHandle, domain);
    return r;
}
exports.getMongooseModelNameForDomain = getMongooseModelNameForDomain;
function getModelForModelName(theModel, modelname) {
    return theModel.mongoHandle.srcHandle.model(modelname);
}
exports.getModelForModelName = getModelForModelName;
function getModelForDomain(theModel, domain) {
    var modelname = getModelNameForDomain(theModel.mongoHandle, domain);
    return getModelForModelName(theModel, modelname);
}
exports.getModelForDomain = getModelForDomain;
function getModelNameForDomain(handle, domain) {
    var res = undefined;
    Object.keys(handle.modelDocs).every(key => {
        var doc = handle.modelDocs[key];
        if (key == domain) {
            res = key;
        }
        if (domain === doc.domain && doc.modelname) {
            res = doc.modelname;
        }
        return !res;
    });
    if (!res) {
        throw Error('attempt to retrieve modelName for unknown domain ' + domain);
    }
    return res;
}
exports.getModelNameForDomain = getModelNameForDomain;
function assureDirExists(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}
function filterRemapCategories(mongoMap, categories, records) {
    //
    //console.log('here map' + JSON.stringify(mongoMap,undefined,2));
    return records.map((rec, index) => {
        var res = {};
        categories.forEach(category => {
            var categoryPath = mongoMap[category].paths;
            if (!categoryPath) {
                throw new Error(`unknown category ${category} not present in ${JSON.stringify(mongoMap, undefined, 2)}`);
            }
            res[category] = MongoMap.getFirstMemberByPath(rec, categoryPath);
            debuglog(() => 'got member for ' + category + ' from rec no ' + index + ' ' + JSON.stringify(rec, undefined, 2));
            debuglog(() => JSON.stringify(categoryPath));
            debuglog(() => 'res : ' + res[category]);
        });
        return res;
    });
}
exports.filterRemapCategories = filterRemapCategories;
function filterRemapCategories2(mongoMap, categories, records) {
    // construct a project
    var project = {};
    categories.forEach(category => {
        var categoryPath = mongoMap[category].fullpath;
        project[category] = categoryPath;
    });
    return srchandle_1.applyProject(records, project);
}
exports.filterRemapCategories2 = filterRemapCategories2;
function checkModelMongoMap(model, modelname, mongoMap, category) {
    if (!model) {
        debuglog(' no model for ' + modelname);
        //       return Promise.reject(`model ${modelname} not found in db`);
        throw Error(`model ${modelname} not found in db`);
    }
    if (!mongoMap) {
        debuglog(' no mongoMap for ' + modelname);
        throw new Error(`model ${modelname} has no modelmap`);
        //        return Promise.reject(`model ${modelname} has no modelmap`);
    }
    if (category && !mongoMap[category]) {
        debuglog(' no mongoMap category for ' + modelname);
        //      return Promise.reject(`model ${modelname} has no category ${category}`);
        throw new Error(`model ${modelname} has no category ${category}`);
    }
    return undefined;
}
exports.checkModelMongoMap = checkModelMongoMap;
function getExpandedRecordsFull(theModel, domain) {
    var mongoHandle = theModel.mongoHandle;
    var modelname = getModelNameForDomain(theModel.mongoHandle, domain);
    debuglog(() => ` modelname for ${domain} is ${modelname}`);
    var model = mongoHandle.srcHandle.model(modelname);
    var mongoMap = mongoHandle.mongoMaps[modelname];
    debuglog(() => 'here the mongomap' + JSON.stringify(mongoMap, undefined, 2));
    var p = checkModelMongoMap(model, modelname, mongoMap);
    debuglog(() => ` here the modelmap for ${domain} is ${JSON.stringify(mongoMap, undefined, 2)}`);
    // 1) produce the flattened records
    var res = MongoMap.unwindsForNonterminalArrays(mongoMap);
    debuglog(() => 'here the unwind statement ' + JSON.stringify(res, undefined, 2));
    // we have to unwind all common non-terminal collections.
    debuglog(() => 'here the model ' + model.modelname);
    var categories = getCategoriesForDomain(theModel, domain);
    debuglog(() => `here categories for ${domain} ${categories.join(';')}`);
    if (res.length === 0) {
        return model.find({}).then((unwound) => {
            debuglog(() => 'here res' + JSON.stringify(unwound));
            return filterRemapCategories(mongoMap, categories, unwound);
        });
    }
    return model.aggregate(res).then(unwound => {
        // filter for aggregate
        debuglog(() => 'here res' + JSON.stringify(unwound));
        return filterRemapCategories(mongoMap, categories, unwound);
    });
}
exports.getExpandedRecordsFull = getExpandedRecordsFull;
function getExpandedRecordsForCategory(theModel, domain, category) {
    var mongoHandle = theModel.mongoHandle;
    var modelname = getModelNameForDomain(theModel.mongoHandle, domain);
    debuglog(() => ` modelname for ${domain} is ${modelname}`);
    //debuglog(() => `here models ${modelname} ` + mongoHandle.srcHandle.modelNames().join(';'));
    var model = mongoHandle.srcHandle.model(modelname);
    var mongoMap = mongoHandle.mongoMaps[modelname];
    debuglog(() => 'here the mongomap' + JSON.stringify(mongoMap, undefined, 2));
    checkModelMongoMap(model, modelname, mongoMap, category);
    debuglog(() => ` here the modelmap for ${domain} is ${JSON.stringify(mongoMap, undefined, 2)}`);
    // 1) produce the flattened records
    var res = MongoMap.unwindsForNonterminalArrays(mongoMap);
    debuglog(() => 'here the unwind statement ' + JSON.stringify(res, undefined, 2));
    // we have to unwind all common non-terminal collections.
    debuglog(() => 'here the model ' + model.modelname);
    if (res.length === 0) {
        return model.find({}).then((unwound) => {
            debuglog(() => 'here res' + JSON.stringify(unwound));
            return filterRemapCategories(mongoMap, [category], unwound);
        });
    }
    return model.aggregate(res).then(unwound => {
        // filter for aggregate
        debuglog(() => 'here res' + JSON.stringify(unwound));
        return filterRemapCategories(mongoMap, [category], unwound);
    });
}
exports.getExpandedRecordsForCategory = getExpandedRecordsForCategory;
// get synonyms
// db.cosmos.find( { "_synonyms.0": { $exists: true }}).length()
/**
 *
 * @param mongoHandle
 * @param modelname
 * @param category
 */
function getDistinctValues(mongoHandle, modelname, category) {
    debuglog(() => `here models ${modelname}  of all:` + mongoHandle.srcHandle.modelNames().join(';'));
    var model = mongoHandle.srcHandle.model(modelname);
    var mongoMap = mongoHandle.mongoMaps[modelname];
    checkModelMongoMap(model, modelname, mongoMap, category);
    debuglog(' here path for distinct value \"' + modelname + ' \"' + mongoMap[category].fullpath + "\"");
    return model.distinctFlat(mongoMap[category]).then(res => {
        debuglog(() => ` here res for "${modelname}" : "${category}" values ` + JSON.stringify(res, undefined, 2));
        return res;
    });
}
exports.getDistinctValues = getDistinctValues;
function getCategoryRec(mongoHandle, modelname, category) {
    var categories = mongoHandle.modelDocs[modelname]._categories;
    var filtered = categories.filter(x => x.category == category);
    // we want to ament the type!
    if (filtered.length != 1) {
        debugf(' did not find ' + modelname + '  category  ' + category + ' in  ' + JSON.stringify(categories));
        throw Error('category not found ' + category + " " + JSON.stringify(categories));
    }
    return filtered[0];
}
exports.getCategoryRec = getCategoryRec;
const ARR_MODEL_PROPERTIES = ["domain", "bitindex", "defaultkeycolumn", "defaulturi", "categoryDescribed", "columns", "description", "tool", "toolhidden", "synonyms", "category", "wordindex", "exactmatch", "hidden"];
function addSynonyms(synonyms, category, synonymFor, bitindex, bitSentenceAnd, wordType, mRules, seen) {
    synonyms.forEach(function (syn) {
        var oRule = {
            category: category,
            matchedString: synonymFor,
            type: IMatch.EnumRuleType.WORD,
            word: syn,
            bitindex: bitindex,
            bitSentenceAnd: bitSentenceAnd,
            wordType: wordType,
            _ranking: 0.95
        };
        debuglog(debuglog.enabled ? ("inserting synonym" + JSON.stringify(oRule)) : '-');
        insertRuleIfNotPresent(mRules, oRule, seen);
    });
}
function getRuleKey(rule) {
    var r1 = rule.matchedString + "-|-" + rule.category + " -|- " + rule.type + " -|- " + rule.word + " " + rule.bitindex + " " + rule.wordType;
    if (rule.range) {
        var r2 = getRuleKey(rule.range.rule);
        r1 += " -|- " + rule.range.low + "/" + rule.range.high + " -|- " + r2;
    }
    return r1;
}
const Breakdown = require("../match/breakdown");
/* given a rule which represents a word sequence which is split during tokenization */
function addBestSplit(mRules, rule, seenRules) {
    //if(!global_AddSplits) {
    //    return;
    //}
    if (rule.type !== IMatch.EnumRuleType.WORD) {
        return;
    }
    var best = Breakdown.makeMatchPattern(rule.lowercaseword);
    if (!best) {
        return;
    }
    var newRule = {
        category: rule.category,
        matchedString: rule.matchedString,
        bitindex: rule.bitindex,
        bitSentenceAnd: rule.bitindex,
        wordType: rule.wordType,
        word: best.longestToken,
        type: 0,
        lowercaseword: best.longestToken,
        _ranking: 0.95,
        //    exactOnly : rule.exactOnly,
        range: best.span
    };
    if (rule.exactOnly) {
        newRule.exactOnly = rule.exactOnly;
    }
    ;
    newRule.range.rule = rule;
    insertRuleIfNotPresent(mRules, newRule, seenRules);
}
exports.addBestSplit = addBestSplit;
function insertRuleIfNotPresent(mRules, rule, seenRules) {
    if (rule.type !== IMatch.EnumRuleType.WORD) {
        debuglog('not a  word return fast ' + rule.matchedString);
        mRules.push(rule);
        return;
    }
    if ((rule.word === undefined) || (rule.matchedString === undefined)) {
        throw new Error('illegal rule' + JSON.stringify(rule, undefined, 2));
    }
    var r = getRuleKey(rule);
    /* if( (rule.word === "service" || rule.word=== "services") && r.indexOf('OData') >= 0) {
         console.log("rulekey is" + r);
         console.log("presence is " + JSON.stringify(seenRules[r]));
     }*/
    rule.lowercaseword = rule.word.toLowerCase();
    if (seenRules[r]) {
        debuglog(() => ("Attempting to insert duplicate" + JSON.stringify(rule, undefined, 2) + " : " + r));
        var duplicates = seenRules[r].filter(function (oEntry) {
            return 0 === InputFilterRules.compareMRuleFull(oEntry, rule);
        });
        if (duplicates.length > 0) {
            return;
        }
    }
    seenRules[r] = (seenRules[r] || []);
    seenRules[r].push(rule);
    if (rule.word === "") {
        debuglog(debuglog.enabled ? ('Skipping rule with emtpy word ' + JSON.stringify(rule, undefined, 2)) : '-');
        //g('Skipping rule with emtpy word ' + JSON.stringify(rule, undefined, 2));
        return;
    }
    mRules.push(rule);
    addBestSplit(mRules, rule, seenRules);
    return;
}
function readFileAsJSON(filename) {
    var data = fs.readFileSync(filename, 'utf-8');
    try {
        return JSON.parse(data);
    }
    catch (e) {
        console.log("Content of file " + filename + " is no json" + e);
        process.stdout.on('drain', function () {
            process.exit(-1);
        });
        //process.exit(-1);
    }
    return undefined;
}
exports.readFileAsJSON = readFileAsJSON;
function hasRuleWithFact(mRules, fact, category, bitindex) {
    // TODO BAD QUADRATIC
    return mRules.find(rule => {
        return rule.word === fact && rule.category === category && rule.bitindex === bitindex;
    }) !== undefined;
}
exports.hasRuleWithFact = hasRuleWithFact;
function loadModelDataMongo(modelHandle, oMdl, sModelName, oModel) {
    // read the data ->
    // data is processed into mRules directly
    var bitindex = oMdl.bitindex;
    return Promise.all(modelHandle.modelDocs[sModelName]._categories.map(categoryRec => {
        var category = categoryRec.category;
        var wordindex = categoryRec.wordindex;
        if (!wordindex) {
            debuglog(() => '  ' + sModelName + ' ' + category + ' is not word indexed!');
            return Promise.resolve(true);
        }
        else {
            debuglog(() => 'adding values for ' + sModelName + ' ' + category);
            return getDistinctValues(modelHandle, sModelName, category).then((values) => {
                debuglog(`found ${values.length} values for ${sModelName} ${category} `);
                values.map(value => {
                    var sString = "" + value;
                    debuglog(() => "pushing rule with " + category + " -> " + sString + ' ');
                    var oRule = {
                        category: category,
                        matchedString: sString,
                        type: IMatch.EnumRuleType.WORD,
                        word: sString,
                        bitindex: bitindex,
                        bitSentenceAnd: bitindex,
                        exactOnly: categoryRec.exactmatch || false,
                        wordType: IMatch.WORDTYPE.FACT,
                        _ranking: 0.95
                    };
                    insertRuleIfNotPresent(oModel.mRules, oRule, oModel.seenRules);
                    //    if (oMdlData.synonyms && oMdlData.synonyms[category]) {
                    //        throw new Error("how can this happen?");
                    //addSynonyms(oMdlData.synonyms[category], category, sString, bitindex, bitindex, "X", oModel.mRules, oModel.seenRules);
                    //    }
                    // a synonym for a FACT
                    //    if (oEntry.synonyms && oEntry.synonyms[category]) {
                    //         addSynonyms(oEntry.synonyms[category], category, sString, bitindex, bitindex, IMatch.WORDTYPE.FACT, oModel.mRules, oModel.seenRules);
                    //     }
                });
                return true;
            });
        }
    })).then(() => getFactSynonyms(modelHandle, sModelName)).then((synonymValues) => {
        synonymValues.forEach((synonymRec) => {
            if (!hasRuleWithFact(oModel.mRules, synonymRec.fact, synonymRec.category, bitindex)) {
                debuglog(() => JSON.stringify(oModel.mRules, undefined, 2));
                throw Error(`Orphaned synonym without base in data?\n`
                    +
                        `(check typos and that category is wordindexed!) fact: '${synonymRec.fact}';  category: "${synonymRec.category}"   ` + JSON.stringify(synonymRec));
            }
            addSynonyms(synonymRec.synonyms, synonymRec.category, synonymRec.fact, bitindex, bitindex, IMatch.WORDTYPE.FACT, oModel.mRules, oModel.seenRules);
            return true;
        });
        return true;
    });
}
;
function loadModel(modelHandle, sModelName, oModel) {
    debuglog(" loading " + sModelName + " ....");
    //var oMdl = readFileAsJSON('./' + modelPath + '/' + sModelName + ".model.json") as IModel;
    var oMdl = makeMdlMongo(modelHandle, sModelName, oModel);
    return loadModelDataMongo(modelHandle, oMdl, sModelName, oModel);
}
exports.loadModel = loadModel;
function getAllDomainsBitIndex(oModel) {
    var len = oModel.domains.length;
    var res = 0;
    for (var i = 0; i < len; ++i) {
        res = res << 1;
        res = res | 0x0001;
    }
    return res;
}
exports.getAllDomainsBitIndex = getAllDomainsBitIndex;
function getDomainBitIndex(domain, oModel) {
    var index = oModel.domains.indexOf(domain);
    if (index < 0) {
        index = oModel.domains.length;
    }
    if (index >= 32) {
        throw new Error("too many domain for single 32 bit index");
    }
    return 0x0001 << index;
}
exports.getDomainBitIndex = getDomainBitIndex;
function getDomainBitIndexSafe(domain, oModel) {
    var index = oModel.domains.indexOf(domain);
    if (index < 0) {
        throw Error('expected domain ' + domain + ' to be registered??? ' + JSON.stringify(oModel.domains));
    }
    if (index >= 32) {
        throw new Error("too many domain for single 32 bit index");
    }
    return 0x0001 << index;
}
exports.getDomainBitIndexSafe = getDomainBitIndexSafe;
/**
 * Given a bitfield, return an unsorted set of domains matching present bits
 * @param oModel
 * @param bitfield
 */
function getDomainsForBitField(oModel, bitfield) {
    return oModel.domains.filter(domain => (getDomainBitIndex(domain, oModel) & bitfield));
}
exports.getDomainsForBitField = getDomainsForBitField;
function makeMdlMongo(modelHandle, sModelName, oModel) {
    var modelDoc = modelHandle.modelDocs[sModelName];
    var oMdl = {
        bitindex: getDomainBitIndexSafe(modelDoc.domain, oModel),
        domain: modelDoc.domain,
        modelname: sModelName,
        description: modelDoc.domain_description
    };
    var categoryDescribedMap = {};
    oMdl.bitindex = getDomainBitIndexSafe(modelDoc.domain, oModel);
    oMdl.category = modelDoc._categories.map(cat => cat.category);
    oMdl.categoryDescribed = [];
    modelDoc._categories.forEach(cat => {
        oMdl.categoryDescribed.push({
            name: cat.category,
            description: cat.category_description
        });
        categoryDescribedMap[cat.category] = cat;
    });
    oMdl.category = modelDoc._categories.map(cat => cat.category);
    /* // rectify category
     oMdl.category = oMdl.category.map(function (cat: any) {
         if (typeof cat === "string") {
             return cat;
         }
         if (typeof cat.name !== "string") {
             console.log("Missing name in object typed category in " + JSON.stringify(cat) + " in model " + sModelName);
             process.exit(-1);
             //throw new Error('Domain ' + oMdl.domain + ' already loaded while loading ' + sModelName + '?');
         }
         categoryDescribedMap[cat.name] = cat;
         oMdl.categoryDescribed.push(cat);
         return cat.name;
     });
     */
    // add the categories to the rules
    oMdl.category.forEach(function (category) {
        insertRuleIfNotPresent(oModel.mRules, {
            category: "category",
            matchedString: category,
            type: IMatch.EnumRuleType.WORD,
            word: category,
            lowercaseword: category.toLowerCase(),
            bitindex: oMdl.bitindex,
            wordType: IMatch.WORDTYPE.CATEGORY,
            bitSentenceAnd: oMdl.bitindex,
            _ranking: 0.95
        }, oModel.seenRules);
    });
    // add synonanym for the categories to the
    modelDoc._categories.forEach(cat => {
        addSynonyms;
    });
    if (oModel.domains.indexOf(oMdl.domain) < 0) {
        debuglog("***********here mdl" + JSON.stringify(oMdl, undefined, 2));
        throw new Error('Domain ' + oMdl.domain + ' already loaded while loading ' + sModelName + '?');
    }
    /*
    // check properties of model
    Object.keys(oMdl).sort().forEach(function (sProperty) {
        if (ARR_MODEL_PROPERTIES.indexOf(sProperty) < 0) {
            throw new Error('Model property "' + sProperty + '" not a known model property in model of domain ' + oMdl.domain + ' ');
        }
    });
    */
    // consider streamlining the categories
    oModel.rawModels[oMdl.domain] = oMdl;
    oModel.full.domain[oMdl.domain] = {
        description: oMdl.description,
        categories: categoryDescribedMap,
        bitindex: oMdl.bitindex
    };
    // check that
    // check that members of wordindex are in categories,
    /* oMdl.wordindex = oModelDoc.oMdl.wordindex || [];
     oMdl.wordindex.forEach(function (sWordIndex) {
         if (oMdl.category.indexOf(sWordIndex) < 0) {
             throw new Error('Model wordindex "' + sWordIndex + '" not a category of domain ' + oMdl.domain + ' ');
         }
     });
     */
    /*
    oMdl.exactmatch = oMdl.exactmatch || [];
    oMdl.exactmatch.forEach(function (sExactMatch) {
        if (oMdl.category.indexOf(sExactMatch) < 0) {
            throw new Error('Model exactmatch "' + sExactMatch + '" not a category of domain ' + oMdl.domain + ' ');
        }
    });
    */
    oMdl.columns = modelDoc.columns; // oMdl.columns || [];
    oMdl.columns.forEach(function (sExactMatch) {
        if (oMdl.category.indexOf(sExactMatch) < 0) {
            throw new Error('Model column "' + sExactMatch + '" not a category of domain ' + oMdl.domain + ' ');
        }
    });
    // add relation domain -> category
    var domainStr = MetaF.Domain(oMdl.domain).toFullString();
    var relationStr = MetaF.Relation(Meta.RELATION_hasCategory).toFullString();
    var reverseRelationStr = MetaF.Relation(Meta.RELATION_isCategoryOf).toFullString();
    oMdl.category.forEach(function (sCategory) {
        var CategoryString = MetaF.Category(sCategory).toFullString();
        oModel.meta.t3[domainStr] = oModel.meta.t3[domainStr] || {};
        oModel.meta.t3[domainStr][relationStr] = oModel.meta.t3[domainStr][relationStr] || {};
        oModel.meta.t3[domainStr][relationStr][CategoryString] = {};
        oModel.meta.t3[CategoryString] = oModel.meta.t3[CategoryString] || {};
        oModel.meta.t3[CategoryString][reverseRelationStr] = oModel.meta.t3[CategoryString][reverseRelationStr] || {};
        oModel.meta.t3[CategoryString][reverseRelationStr][domainStr] = {};
    });
    // add a precice domain matchrule
    insertRuleIfNotPresent(oModel.mRules, {
        category: "domain",
        matchedString: oMdl.domain,
        type: IMatch.EnumRuleType.WORD,
        word: oMdl.domain,
        bitindex: oMdl.bitindex,
        bitSentenceAnd: oMdl.bitindex,
        wordType: IMatch.WORDTYPE.DOMAIN,
        _ranking: 0.95
    }, oModel.seenRules);
    // add domain synonyms
    if (modelDoc.domain_synonyms && modelDoc.domain_synonyms.length > 0) {
        addSynonyms(modelDoc.domain_synonyms, "domain", modelDoc.domain, oMdl.bitindex, oMdl.bitindex, IMatch.WORDTYPE.DOMAIN, oModel.mRules, oModel.seenRules);
        addSynonyms(modelDoc.domain_synonyms, "domain", modelDoc.domain, getDomainBitIndexSafe(DOMAIN_METAMODEL, oModel), getDomainBitIndexSafe(DOMAIN_METAMODEL, oModel), IMatch.WORDTYPE.FACT, oModel.mRules, oModel.seenRules);
        // TODO: synonym have to be added as *FACT* for the metamodel!
    }
    ;
    /*
        // check the tool
        if (oMdl.tool && oMdl.tool.requires) {
            var requires = Object.keys(oMdl.tool.requires || {});
            var diff = _.difference(requires, oMdl.category);
            if (diff.length > 0) {
                console.log(` ${oMdl.domain} : Unkown category in requires of tool: "` + diff.join('"') + '"');
                process.exit(-1);
            }
            var optional = Object.keys(oMdl.tool.optional);
            diff = _.difference(optional, oMdl.category);
            if (diff.length > 0) {
                console.log(` ${oMdl.domain} : Unkown category optional of tool: "` + diff.join('"') + '"');
                process.exit(-1);
            }
            Object.keys(oMdl.tool.sets || {}).forEach(function (setID) {
                var diff = _.difference(oMdl.tool.sets[setID].set, oMdl.category);
                if (diff.length > 0) {
                    console.log(` ${oMdl.domain} : Unkown category in setId ${setID} of tool: "` + diff.join('"') + '"');
                    process.exit(-1);
                }
            });

            // extract tools an add to tools:
            oModel.tools.filter(function (oEntry) {
                if (oEntry.name === (oMdl.tool && oMdl.tool.name)) {
                    console.log("Tool " + oMdl.tool.name + " already present when loading " + sModelName);
                    //throw new Error('Domain already loaded?');
                    process.exit(-1);
                }
            });
        } else {
            oMdl.toolhidden = true;
            oMdl.tool.requires = { "impossible": {} };
        }
        // add the tool name as rule unless hidden
        if (!oMdl.toolhidden && oMdl.tool && oMdl.tool.name) {
            insertRuleIfNotPresent(oModel.mRules, {
                category: "tool",
                matchedString: oMdl.tool.name,
                type: IMatch.EnumRuleType.WORD,
                word: oMdl.tool.name,
                bitindex: oMdl.bitindex,
                bitSentenceAnd : oMdl.bitindex,
                wordType : IMatch.WORDTYPE.TOOL,
                _ranking: 0.95
            }, oModel.seenRules);
        };
        if (oMdl.synonyms && oMdl.synonyms["tool"]) {
            addSynonyms(oMdl.synonyms["tool"], "tool", oMdl.tool.name, oMdl.bitindex,
            oMdl.bitindex, IMatch.WORDTYPE.TOOL, oModel.mRules, oModel.seenRules);
        };
        */
    // add synsonym for the domains
    // add synonyms for the categories
    modelDoc._categories.forEach(cat => {
        if (cat.category_synonyms && cat.category_synonyms.length > 0) {
            if (oModel.full.domain[oMdl.domain].categories[cat.category]) {
                oModel.full.domain[oMdl.domain].categories[cat.category].category_synonyms = cat.category_synonyms;
            }
            addSynonyms(cat.category_synonyms, "category", cat.category, oMdl.bitindex, oMdl.bitindex, IMatch.WORDTYPE.CATEGORY, oModel.mRules, oModel.seenRules);
            // add synonyms into the metamodel domain
            addSynonyms(cat.category_synonyms, "category", cat.category, getDomainBitIndexSafe(DOMAIN_METAMODEL, oModel), getDomainBitIndexSafe(DOMAIN_METAMODEL, oModel), IMatch.WORDTYPE.FACT, oModel.mRules, oModel.seenRules);
        }
    });
    // add operators
    // add fillers
    if (oModel.domains.indexOf(oMdl.domain) < 0) {
        throw Error('missing domain registration for ' + oMdl.domain);
    }
    //oModel.domains.push(oMdl.domain);
    oModel.category = oModel.category.concat(oMdl.category);
    oModel.category.sort();
    oModel.category = oModel.category.filter(function (string, index) {
        return oModel.category[index] !== oModel.category[index + 1];
    });
    return oMdl;
} // loadmodel
function splitRules(rules) {
    var res = {};
    var nonWordRules = [];
    rules.forEach(function (rule) {
        if (rule.type === IMatch.EnumRuleType.WORD) {
            if (!rule.lowercaseword) {
                throw new Error("Rule has no member lowercaseword" + JSON.stringify(rule));
            }
            res[rule.lowercaseword] = res[rule.lowercaseword] || { bitindex: 0, rules: [] };
            res[rule.lowercaseword].bitindex = res[rule.lowercaseword].bitindex | rule.bitindex;
            res[rule.lowercaseword].rules.push(rule);
        }
        else {
            nonWordRules.push(rule);
        }
    });
    return {
        wordMap: res,
        nonWordRules: nonWordRules,
        allRules: rules,
        wordCache: {}
    };
}
exports.splitRules = splitRules;
function sortFlatRecords(a, b) {
    var keys = _.union(Object.keys(a), Object.keys(b)).sort();
    var r = 0;
    keys.every((key) => {
        if (typeof a[key] === "string" && typeof b[key] !== "string") {
            r = -1;
            return false;
        }
        if (typeof a[key] !== "string" && typeof b[key] === "string") {
            r = +1;
            return false;
        }
        if (typeof a[key] !== "string" && typeof b[key] !== "string") {
            r = 0;
            return true;
        }
        r = a[key].localeCompare(b[key]);
        return r === 0;
    });
    return r;
}
exports.sortFlatRecords = sortFlatRecords;
;
function cmpLengthSort(a, b) {
    var d = a.length - b.length;
    if (d) {
        return d;
    }
    return a.localeCompare(b);
}
const Algol = require("../match/algol");
// offset[0] : len-2
//             len -1
//             len
//             len +1
//             len +2
//             len +3
function findNextLen(targetLen, arr, offsets) {
    offsets.shift();
    for (var i = offsets[4]; (i < arr.length) && (arr[i].length <= targetLen); ++i) {
        /* empty*/
    }
    offsets.push(i);
}
exports.findNextLen = findNextLen;
function addRangeRulesUnlessPresent(rules, lcword, rangeRules, presentRulesForKey, seenRules) {
    rangeRules.forEach(rangeRule => {
        var newRule = Object.assign({}, rangeRule);
        newRule.lowercaseword = lcword;
        newRule.word = lcword;
        //if((lcword === 'services' || lcword === 'service') && newRule.range.rule.lowercaseword.indexOf('odata')>=0) {
        //    console.log("adding "+ JSON.stringify(newRule) + "\n");
        //}
        //todo: check whether an equivalent rule is already present?
        var cnt = rules.length;
        insertRuleIfNotPresent(rules, newRule, seenRules);
    });
}
exports.addRangeRulesUnlessPresent = addRangeRulesUnlessPresent;
function addCloseExactRangeRules(rules, seenRules) {
    var keysMap = {};
    var rangeKeysMap = {};
    rules.forEach(rule => {
        if (rule.type === IMatch.EnumRuleType.WORD) {
            //keysMap[rule.lowercaseword] = 1;
            keysMap[rule.lowercaseword] = keysMap[rule.lowercaseword] || [];
            keysMap[rule.lowercaseword].push(rule);
            if (!rule.exactOnly && rule.range) {
                rangeKeysMap[rule.lowercaseword] = rangeKeysMap[rule.lowercaseword] || [];
                rangeKeysMap[rule.lowercaseword].push(rule);
            }
        }
    });
    var keys = Object.keys(keysMap);
    keys.sort(cmpLengthSort);
    var len = 0;
    keys.forEach((key, index) => {
        if (key.length != len) {
            //console.log("shift to len" + key.length + ' at ' + index + ' ' + key );
        }
        len = key.length;
    });
    //   keys = keys.slice(0,2000);
    var rangeKeys = Object.keys(rangeKeysMap);
    rangeKeys.sort(cmpLengthSort);
    //console.log(` ${keys.length} keys and ${rangeKeys.length} rangekeys `);
    var low = 0;
    var high = 0;
    var lastlen = 0;
    var offsets = [0, 0, 0, 0, 0, 0];
    var len = rangeKeys.length;
    findNextLen(0, keys, offsets);
    findNextLen(1, keys, offsets);
    findNextLen(2, keys, offsets);
    rangeKeys.forEach(function (rangeKey) {
        if (rangeKey.length !== lastlen) {
            for (i = lastlen + 1; i <= rangeKey.length; ++i) {
                findNextLen(i + 2, keys, offsets);
            }
            //   console.log(` shifted to ${rangeKey.length} with offsets beeing ${offsets.join(' ')}`);
            //   console.log(` here 0 ${offsets[0]} : ${keys[Math.min(keys.length-1, offsets[0])].length}  ${keys[Math.min(keys.length-1, offsets[0])]} `);
            //  console.log(` here 5-1  ${keys[offsets[5]-1].length}  ${keys[offsets[5]-1]} `);
            //   console.log(` here 5 ${offsets[5]} : ${keys[Math.min(keys.length-1, offsets[5])].length}  ${keys[Math.min(keys.length-1, offsets[5])]} `);
            lastlen = rangeKey.length;
        }
        for (var i = offsets[0]; i < offsets[5]; ++i) {
            var d = Distance.calcDistanceAdjusted(rangeKey, keys[i]);
            // console.log(`${rangeKey.length-keys[i].length} ${d} ${rangeKey} and ${keys[i]}  `);
            if ((d !== 1.0) && (d >= Algol.Cutoff_rangeCloseMatch)) {
                //console.log(`would add ${rangeKey} for ${keys[i]} ${d}`);
                var cnt = rules.length;
                // we only have to add if there is not yet a match rule here which points to the same
                addRangeRulesUnlessPresent(rules, keys[i], rangeKeysMap[rangeKey], keysMap[keys[i]], seenRules);
                if (rules.length > cnt) {
                    //console.log(` added ${(rules.length - cnt)} records at${rangeKey} for ${keys[i]} ${d}`);
                }
            }
        }
    });
    /*
    [
        ['aEFG','aEFGH'],
        ['aEFGH','aEFGHI'],
        ['Odata','ODatas'],
   ['Odata','Odatas'],
   ['Odata','Odatb'],
   ['Odata','UData'],
   ['service','services'],
   ['this isfunny and more','this isfunny and mores'],
    ].forEach(rec => {
        console.log(`distance ${rec[0]} ${rec[1]} : ${Distance.calcDistance(rec[0],rec[1])}  adf ${Distance.calcDistanceAdjusted(rec[0],rec[1])} `);

    });
    console.log("distance Odata Udata"+ Distance.calcDistance('OData','UData'));
    console.log("distance Odata Odatb"+ Distance.calcDistance('OData','ODatb'));
    console.log("distance Odatas Odata"+ Distance.calcDistance('OData','ODataa'));
    console.log("distance Odatas abcde"+ Distance.calcDistance('abcde','abcdef'));
    console.log("distance services "+ Distance.calcDistance('services','service'));
    */
}
exports.addCloseExactRangeRules = addCloseExactRangeRules;
var n = 0;
function readFillers(srcHandle, oModel) {
    var fillerBitIndex = getDomainBitIndex('meta', oModel);
    var bitIndexAllDomains = getAllDomainsBitIndex(oModel);
    return Schemaload.getFillersFromDB(srcHandle)
        //.then(
        //        (fillersObj) => fillersObj.fillers
        //  )
        .then((fillers) => {
        //  fillersreadFileAsJSON('./' + modelPath + '/filler.json');
        /*
        var re = "^((" + fillers.join(")|(") + "))$";
        oModel.mRules.push({
            category: "filler",
            type: IMatch.EnumRuleType.REGEXP,
            regexp: new RegExp(re, "i"),
            matchedString: "filler",
            bitindex: fillerBitIndex,
            _ranking: 0.9
        });
        */
        if (!_.isArray(fillers)) {
            throw new Error('expect fillers to be an array of strings');
        }
        fillers.forEach(filler => {
            insertRuleIfNotPresent(oModel.mRules, {
                category: "filler",
                type: IMatch.EnumRuleType.WORD,
                word: filler,
                lowercaseword: filler.toLowerCase(),
                matchedString: filler,
                exactOnly: true,
                bitindex: fillerBitIndex,
                bitSentenceAnd: bitIndexAllDomains,
                wordType: IMatch.WORDTYPE.FILLER,
                _ranking: 0.9
            }, oModel.seenRules);
        });
        return true;
    });
}
exports.readFillers = readFillers;
;
function readOperators(srcHandle, oModel) {
    debuglog('reading operators');
    //add operators
    return Schemaload.getOperatorsFromDB(srcHandle).then((operators) => {
        var operatorBitIndex = getDomainBitIndex('operators', oModel);
        var bitIndexAllDomains = getAllDomainsBitIndex(oModel);
        Object.keys(operators.operators).forEach(function (operator) {
            if (IMatch.aOperatorNames.indexOf(operator) < 0) {
                debuglog("unknown operator " + operator);
                throw new Error("unknown operator " + operator + ' (add to ifmatch.ts  aOperatorNames)');
            }
            oModel.operators[operator] = operators.operators[operator];
            oModel.operators[operator].operator = operator;
            Object.freeze(oModel.operators[operator]);
            var word = operator;
            insertRuleIfNotPresent(oModel.mRules, {
                category: "operator",
                word: word.toLowerCase(),
                lowercaseword: word.toLowerCase(),
                type: IMatch.EnumRuleType.WORD,
                matchedString: word,
                bitindex: operatorBitIndex,
                bitSentenceAnd: bitIndexAllDomains,
                wordType: IMatch.WORDTYPE.OPERATOR,
                _ranking: 0.9
            }, oModel.seenRules);
            // add all synonyms
            if (operators.synonyms[operator]) {
                var arr = operators.synonyms[operator];
                if (arr) {
                    if (Array.isArray(arr)) {
                        arr.forEach(function (synonym) {
                            insertRuleIfNotPresent(oModel.mRules, {
                                category: "operator",
                                word: synonym.toLowerCase(),
                                lowercaseword: synonym.toLowerCase(),
                                type: IMatch.EnumRuleType.WORD,
                                matchedString: operator,
                                bitindex: operatorBitIndex,
                                bitSentenceAnd: bitIndexAllDomains,
                                wordType: IMatch.WORDTYPE.OPERATOR,
                                _ranking: 0.9
                            }, oModel.seenRules);
                        });
                    }
                    else {
                        throw Error("Expeted operator synonym to be array " + operator + " is " + JSON.stringify(arr));
                    }
                }
            }
            return true;
        });
        return true;
    });
}
exports.readOperators = readOperators;
;
function releaseModel(model) {
}
exports.releaseModel = releaseModel;
function loadModelsOpeningConnection(srchandle, connectionString, modelPath) {
    return loadModels(srchandle, connectionString, modelPath);
}
exports.loadModelsOpeningConnection = loadModelsOpeningConnection;
/**
 * @param srcHandle
 * @param modelPath
 */
function loadModels(srcHandle, connectionString, modelPath) {
    if (srcHandle === undefined) {
        throw new Error('expect a srcHandle handle to be passed');
    }
    return getModelHandle(srcHandle, connectionString).then((modelHandle) => {
        debuglog(`got a mongo handle for ${modelPath}`);
        return _loadModelsFull(modelHandle, modelPath);
    });
}
exports.loadModels = loadModels;
function _loadModelsFull(modelHandle, modelPath) {
    var oModel;
    modelPath = modelPath || envModelPath;
    modelHandle = modelHandle || {
        srcHandle: undefined,
        modelDocs: {},
        mongoMaps: {},
        modelESchemas: {}
    };
    oModel = {
        mongoHandle: modelHandle,
        full: { domain: {} },
        rawModels: {},
        domains: [],
        rules: undefined,
        category: [],
        operators: {},
        mRules: [],
        seenRules: {},
        meta: { t3: {} }
    };
    var t = Date.now();
    try {
        debuglog(() => 'here model path' + modelPath);
        var a = CircularSer.load(modelPath + '/_cache.js');
        // TODO REMOVE 
        //throw "no cache";
        // TODO
        //console.log("found a cache ?  " + !!a);
        //a = undefined;
        if (a && !process.env.MGNLQ_MODEL_NO_FILECACHE) {
            //console.log('return preps' + modelPath);
            debuglog("\n return prepared model !!");
            console.log("using prepared model  " + modelPath);
            if (process.env.ABOT_EMAIL_USER) {
                console.log("loaded models from cache in " + (Date.now() - t) + " ");
            }
            var res = a;
            res.mongoHandle.srcHandle = modelHandle.srcHandle;
            return Promise.resolve(res);
        }
    }
    catch (e) {
        //console.log('error' + e);
        // no cache file,
    }
    var mdls = Object.keys(modelHandle.modelDocs).sort();
    var seenDomains = {};
    mdls.forEach((modelName, index) => {
        var domain = modelHandle.modelDocs[modelName].domain;
        if (seenDomains[domain]) {
            throw new Error('Domain ' + domain + ' already loaded while loading ' + modelName + '?');
        }
        seenDomains[domain] = index;
    });
    oModel.domains = mdls.map(modelName => modelHandle.modelDocs[modelName].domain);
    // create bitindex in order !
    debuglog('got domains ' + mdls.join("\n"));
    debuglog('loading models ' + mdls.join("\n"));
    return Promise.all(mdls.map((sModelName) => loadModel(modelHandle, sModelName, oModel))).then(() => {
        var metaBitIndex = getDomainBitIndex('meta', oModel);
        var bitIndexAllDomains = getAllDomainsBitIndex(oModel);
        // add the domain meta rule
        insertRuleIfNotPresent(oModel.mRules, {
            category: "meta",
            matchedString: "domain",
            type: IMatch.EnumRuleType.WORD,
            word: "domain",
            bitindex: metaBitIndex,
            wordType: IMatch.WORDTYPE.META,
            bitSentenceAnd: bitIndexAllDomains,
            _ranking: 0.95
        }, oModel.seenRules);
        // insert the Numbers rules
        debuglog(' add numbers rule');
        insertRuleIfNotPresent(oModel.mRules, {
            category: "number",
            matchedString: "one",
            type: IMatch.EnumRuleType.REGEXP,
            regexp: /^((\d+)|(one)|(two)|(three))$/,
            matchIndex: 0,
            word: "<number>",
            bitindex: metaBitIndex,
            wordType: IMatch.WORDTYPE.NUMERICARG,
            bitSentenceAnd: bitIndexAllDomains,
            _ranking: 0.95
        }, oModel.seenRules);
        return true;
    }).then(() => readFillers(modelHandle.srcHandle, oModel)).then(() => readOperators(modelHandle.srcHandle, oModel)).then(() => {
        /*
            })
                {
              category: "filler",
              type: 1,
              regexp: /^((start)|(show)|(from)|(in))$/i,
              matchedString: "filler",
              _ranking: 0.9
            },
        */
        debuglog('saving data to ' + modelPath);
        oModel.mRules = oModel.mRules.sort(InputFilterRules.cmpMRule);
        addCloseExactRangeRules(oModel.mRules, oModel.seenRules);
        oModel.mRules = oModel.mRules.sort(InputFilterRules.cmpMRule);
        oModel.mRules.sort(InputFilterRules.cmpMRule);
        //fs.writeFileSync("post_sort", JSON.stringify(oModel.mRules,undefined,2));
        forceGC();
        oModel.rules = splitRules(oModel.mRules);
        fs.writeFileSync("test1x.json", JSON.stringify(oModel.rules, undefined, 2));
        forceGC();
        delete oModel.seenRules;
        debuglog('saving');
        forceGC();
        var oModelSer = Object.assign({}, oModel);
        oModelSer.mongoHandle = Object.assign({}, oModel.mongoHandle);
        debuglog('created dir1 ' + modelPath);
        delete oModelSer.mongoHandle.srcHandle;
        try {
            assureDirExists(modelPath);
            debuglog('created dir ' + modelPath);
            CircularSer.save(modelPath + '/_cache.js', oModelSer);
            forceGC();
            if (process.env.ABOT_EMAIL_USER) {
                console.log("loaded models by calculation in " + (Date.now() - t) + " ");
            }
            var res = oModel;
            // (Object as any).assign(modelHandle, { model: oModel }) as IMatch.IModelHandle;
            return res;
        }
        catch (err) {
            debuglog("" + err);
            console.log('err ' + err);
            console.log(err + ' ' + err.stack);
            process.stdout.on('drain', function () {
                process.exit(-1);
            });
            throw new Error(' ' + err + ' ' + err.stack);
        }
    }).catch((err) => {
        debuglog("" + err);
        console.log('err ' + err);
        console.log(err + ' ' + err.stack);
        process.stdout.on('drain', function () {
            process.exit(-1);
        });
        throw new Error(' ' + err + ' ' + err.stack);
    });
}
exports._loadModelsFull = _loadModelsFull;
function sortCategoriesByImportance(map, cats) {
    var res = cats.slice(0);
    res.sort(rankCategoryByImportance.bind(undefined, map));
    return res;
}
exports.sortCategoriesByImportance = sortCategoriesByImportance;
function rankCategoryByImportance(map, cata, catb) {
    var catADesc = map[cata];
    var catBDesc = map[catb];
    if (cata === catb) {
        return 0;
    }
    // if a is before b, return -1
    if (catADesc && !catBDesc) {
        return -1;
    }
    if (!catADesc && catBDesc) {
        return +1;
    }
    var prioA = (catADesc && catADesc.importance) || 99;
    var prioB = (catBDesc && catBDesc.importance) || 99;
    // lower prio goes to front
    var r = prioA - prioB;
    if (r) {
        return r;
    }
    return cata.localeCompare(catb);
}
exports.rankCategoryByImportance = rankCategoryByImportance;
const MetaF = Meta.getMetaFactory();
function getOperator(mdl, operator) {
    return mdl.operators[operator];
}
exports.getOperator = getOperator;
function getResultAsArray(mdl, a, rel) {
    if (rel.toType() !== 'relation') {
        throw new Error("expect relation as 2nd arg");
    }
    var res = mdl.meta.t3[a.toFullString()] &&
        mdl.meta.t3[a.toFullString()][rel.toFullString()];
    if (!res) {
        return [];
    }
    return Object.getOwnPropertyNames(res).sort().map(MetaF.parseIMeta);
}
exports.getResultAsArray = getResultAsArray;
function checkDomainPresent(theModel, domain) {
    if (theModel.domains.indexOf(domain) < 0) {
        throw new Error("Domain \"" + domain + "\" not part of model");
    }
}
exports.checkDomainPresent = checkDomainPresent;
function getShowURICategoriesForDomain(theModel, domain) {
    checkDomainPresent(theModel, domain);
    var modelName = getModelNameForDomain(theModel.mongoHandle, domain);
    var allcats = getResultAsArray(theModel, MetaF.Domain(domain), MetaF.Relation(Meta.RELATION_hasCategory));
    var doc = theModel.mongoHandle.modelDocs[modelName];
    var res = doc._categories.filter(cat => cat.showURI).map(cat => cat.category);
    return res;
}
exports.getShowURICategoriesForDomain = getShowURICategoriesForDomain;
function getShowURIRankCategoriesForDomain(theModel, domain) {
    checkDomainPresent(theModel, domain);
    var modelName = getModelNameForDomain(theModel.mongoHandle, domain);
    var allcats = getResultAsArray(theModel, MetaF.Domain(domain), MetaF.Relation(Meta.RELATION_hasCategory));
    var doc = theModel.mongoHandle.modelDocs[modelName];
    var res = doc._categories.filter(cat => cat.showURIRank).map(cat => cat.category);
    return res;
}
exports.getShowURIRankCategoriesForDomain = getShowURIRankCategoriesForDomain;
function getCategoriesForDomain(theModel, domain) {
    checkDomainPresent(theModel, domain);
    var res = getResultAsArray(theModel, MetaF.Domain(domain), MetaF.Relation(Meta.RELATION_hasCategory));
    return Meta.getStringArray(res);
}
exports.getCategoriesForDomain = getCategoriesForDomain;
function getTableColumns(theModel, domain) {
    checkDomainPresent(theModel, domain);
    return theModel.rawModels[domain].columns.slice(0);
}
exports.getTableColumns = getTableColumns;
function forceGC() {
    if (global && global.gc) {
        global.gc();
    }
}
/**
 * Return all categories of a domain which can appear on a word,
 * these are typically the wordindex domains + entries generated by generic rules
 *
 * The current implementation is a simplification
 */
function getPotentialWordCategoriesForDomain(theModel, domain) {
    // this is a simplified version
    return getCategoriesForDomain(theModel, domain);
}
exports.getPotentialWordCategoriesForDomain = getPotentialWordCategoriesForDomain;
function getDomainsForCategory(theModel, category) {
    if (theModel.category.indexOf(category) < 0) {
        throw new Error("Category \"" + category + "\" not part of model");
    }
    var res = getResultAsArray(theModel, MetaF.Category(category), MetaF.Relation(Meta.RELATION_isCategoryOf));
    return Meta.getStringArray(res);
}
exports.getDomainsForCategory = getDomainsForCategory;
/*
export function getAllRecordCategoriesForTargetCategory(model: IMatch.IModels, category: string, wordsonly: boolean): { [key: string]: boolean } {
    var res = {};
    //
    var fn = wordsonly ? getPotentialWordCategoriesForDomain : getCategoriesForDomain;
    var domains = getDomainsForCategory(model, category);
    domains.forEach(function (domain) {
        fn(model, domain).forEach(function (wordcat) {
            res[wordcat] = true;
        });
    });
    Object.freeze(res);
    return res;
}

export function getAllRecordCategoriesForTargetCategories(model: IMatch.IModels, categories: string[], wordsonly: boolean): { [key: string]: boolean } {
    var res = {};
    //
    var fn = wordsonly ? getPotentialWordCategoriesForDomain : getCategoriesForDomain;
    var domains = undefined;
    categories.forEach(function (category) {
        var catdomains = getDomainsForCategory(model, category)
        if (!domains) {
            domains = catdomains;
        } else {
            domains = _.intersection(domains, catdomains);
        }
    });
    if (domains.length === 0) {
        throw new Error('categories ' + Utils.listToQuotedCommaAnd(categories) + ' have no common domain.')
    }
    domains.forEach(function (domain) {
        fn(model, domain).forEach(function (wordcat) {
            res[wordcat] = true;
        });
    });
    Object.freeze(res);
    return res;
}
*/
/**
 * givena  set  of categories, return a structure
 *
 *
 * { domains : ["DOMAIN1", "DOMAIN2"],
 *   categorySet : {   cat1 : true, cat2 : true, ...}
 * }
 */
function getDomainCategoryFilterForTargetCategories(model, categories, wordsonly) {
    var res = {};
    //
    var fn = wordsonly ? getPotentialWordCategoriesForDomain : getCategoriesForDomain;
    var domains = undefined;
    categories.forEach(function (category) {
        var catdomains = getDomainsForCategory(model, category);
        if (!domains) {
            domains = catdomains;
        }
        else {
            domains = _.intersection(domains, catdomains);
        }
    });
    if (domains.length === 0) {
        throw new Error('categories ' + Utils.listToQuotedCommaAnd(categories) + ' have no common domain.');
    }
    domains.forEach(function (domain) {
        fn(model, domain).forEach(function (wordcat) {
            res[wordcat] = true;
        });
    });
    Object.freeze(res);
    return {
        domains: domains,
        categorySet: res
    };
}
exports.getDomainCategoryFilterForTargetCategories = getDomainCategoryFilterForTargetCategories;
function getDomainCategoryFilterForTargetCategory(model, category, wordsonly) {
    return getDomainCategoryFilterForTargetCategories(model, [category], wordsonly);
}
exports.getDomainCategoryFilterForTargetCategory = getDomainCategoryFilterForTargetCategory;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tb2RlbC9tb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7O0FBRUgsb0NBQW9DO0FBQ3BDLGlDQUFpQztBQUVqQyxJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFJL0IsMkNBQXNHO0FBRXRHLGtDQUFrQztBQUNsQyxNQUFNLGdCQUFnQixHQUFHLFdBQVcsQ0FBQztBQUVyQyxpREFBaUQ7QUFHakQsMkNBQTRDO0FBQzVDLGtEQUFrRDtBQUNsRCwwQ0FBMEM7QUFDMUMseUJBQXlCO0FBQ3pCLCtCQUErQjtBQUMvQixvQ0FBb0M7QUFDcEMsMENBQTBDO0FBQzFDLDRDQUE0QztBQUM1QyxtQ0FBbUM7QUFDbkMsNEJBQTRCO0FBSTVCLHFEQUFxRDtBQUNyRCxzREFBc0Q7QUFDdEQsdUNBQXVDO0FBRXZDOztHQUVHO0FBQ0gsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLHdDQUF3QyxDQUFDO0FBRzdGLFNBQWdCLFFBQVEsQ0FBQyxDQUFlLEVBQUUsQ0FBZTtJQUNyRCxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN4QyxDQUFDO0FBRkQsNEJBRUM7QUFJRCxTQUFnQix1QkFBdUIsQ0FBRSxRQUE0QixFQUFFLE9BQWlDO0lBQ3BHLDBGQUEwRjtJQUMxRixRQUFRLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBRSxHQUFHLENBQUMsRUFBRTtRQUNoQyxJQUFJLFlBQVksR0FBRyxRQUFRLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2xFLElBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQywwQkFBMEIsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1RSxJQUFLLENBQUMsSUFBSSxFQUFFO1lBQ1IsSUFBSSxRQUFRLENBQUMsU0FBUyxLQUFLLGVBQWUsRUFBRTtnQkFDeEMsSUFBSSxHQUFHLEdBQ1IsMEJBQTBCLEdBQUcsWUFBWSxHQUFHLGdCQUFnQixHQUFHLEdBQUcsQ0FBQyxRQUFRLEdBQUcsWUFBWTtzQkFDdkYsUUFBUSxDQUFDLFNBQVM7c0JBQ2xCLHNCQUFzQixHQUFHLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUk7c0JBQ3BGLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDakIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNkLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDekI7U0FDSjthQUFNO1lBQ0gsUUFBUSxDQUFDLHlCQUF5QixHQUFHLEdBQUcsQ0FBQyxRQUFRLEdBQUcsR0FBRyxHQUFHLFlBQVksR0FBRyxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNsSCxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyw0Q0FBNEM7U0FDckU7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFyQkQsMERBcUJDO0FBRUQsU0FBZ0IsU0FBUyxDQUFDLENBQU87SUFDN0IsT0FBTyxJQUFJLE9BQU8sQ0FBRSxDQUFDLE9BQU8sRUFBQyxNQUFNLEVBQUUsRUFBRSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLENBQUMsQ0FBRSxDQUFDO0FBQzdELENBQUM7QUFGRCw4QkFFQztBQUVELFNBQWdCLFlBQVksQ0FBQyxTQUFxQixFQUFFLFNBQWlCLEVBQUUsVUFBcUI7SUFDeEYsSUFBSSxTQUFTLElBQUksWUFBWSxFQUFHO1FBQzVCLE9BQU8sU0FBUyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLFlBQVksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUM5STtTQUFNO1FBQ0gsT0FBTyxTQUFTLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxZQUFZLENBQUMsQ0FBQTtLQUNyRDtBQUNMLENBQUM7QUFORCxvQ0FNQztBQUNEOzs7R0FHRztBQUNILFNBQWdCLGNBQWMsQ0FBQyxTQUFxQixFQUFFLGdCQUF5QjtJQUMzRSxJQUFJLEdBQUcsR0FBRztRQUNOLFNBQVMsRUFBRSxTQUFTO1FBQ3BCLFNBQVMsRUFBRSxFQUFFO1FBQ2IsYUFBYSxFQUFFLEVBQUU7UUFDakIsU0FBUyxFQUFFLEVBQUU7S0FDVSxDQUFDO0lBQzVCLDZEQUE2RDtJQUM3RCxPQUFPLFNBQVMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUUsR0FBRyxFQUFFO1FBQ3RELElBQUksVUFBVSxHQUFHLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUN4Qyw0Q0FBNEM7UUFDNUMsNEJBQTRCO1FBQzNCLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDekUsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsVUFBVSxTQUFTO1lBQzlDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxzQkFBc0IsR0FBRyxTQUFTLENBQUMsQ0FBQztZQUNuRCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsd0JBQXdCLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQztnQkFDN0UsVUFBVSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUM7Z0JBQ2xELFlBQVksQ0FBQyxTQUFTLEVBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQzthQUNoRCxDQUFDLENBQUMsSUFBSSxDQUNDLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQ04sUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLHFCQUFxQixHQUFHLFNBQVMsR0FBRyxxQkFBcUIsQ0FBQyxDQUFDO2dCQUMxRSxJQUFJLENBQUMsY0FBYyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUM7Z0JBQzdDLEdBQUcsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLEdBQUcsY0FBYyxDQUFDO2dCQUM5QyxHQUFHLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLFFBQVEsQ0FBQztnQkFDcEMsdUJBQXVCLENBQUMsUUFBUSxFQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUNqRCxTQUFTLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBQyxJQUFJLEVBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQ2xEOzs7Ozs7a0JBTUU7Z0JBQ0YsR0FBRyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxjQUFjLENBQUMsQ0FBQztnQkFDM0UsUUFBUSxDQUFDLEdBQUUsRUFBRSxDQUFDLHVCQUF1QixHQUFHLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZELENBQUMsQ0FDQSxDQUFBO1FBQ1QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1lBQ2QsT0FBTyxHQUFHLENBQUM7UUFDZixDQUFDLENBQUMsQ0FBQztJQUNILENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQXpDRCx3Q0F5Q0M7QUFFRCxTQUFnQixlQUFlLENBQUMsV0FBbUMsRUFBRSxTQUFpQjtJQUNsRixJQUFJLEtBQUssR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNuRCxPQUFPLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0FBQ3JDLENBQUM7QUFIRCwwQ0FHQztBQUVEOzs7Ozs7OztFQVFFO0FBRUYsU0FBZ0IsK0JBQStCLENBQUMsUUFBd0IsRUFBRSxNQUFlO0lBQ3JGLElBQUksQ0FBQyxHQUFHLDZCQUE2QixDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN4RCxPQUFPLFVBQVUsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUNoRCxDQUFDO0FBSEQsMEVBR0M7QUFFRCxTQUFnQiw2QkFBNkIsQ0FBQyxRQUF5QixFQUFFLE1BQWU7SUFDcEYsSUFBSSxDQUFDLEdBQUcscUJBQXFCLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUM1RCxPQUFPLENBQUMsQ0FBQztBQUNiLENBQUM7QUFIRCxzRUFHQztBQUVELFNBQWdCLG9CQUFvQixDQUFDLFFBQXlCLEVBQUUsU0FBaUI7SUFDN0UsT0FBTyxRQUFRLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUZELG9EQUVDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsUUFBeUIsRUFBRSxNQUFlO0lBQ3hFLElBQUksU0FBUyxHQUFHLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDcEUsT0FBTyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDckQsQ0FBQztBQUhELDhDQUdDO0FBRUQsU0FBZ0IscUJBQXFCLENBQUMsTUFBK0IsRUFBRSxNQUFlO0lBQ2xGLElBQUksR0FBRyxHQUFHLFNBQVMsQ0FBQztJQUNwQixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLENBQUUsR0FBRyxDQUFDLEVBQUU7UUFDdkMsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoQyxJQUFLLEdBQUcsSUFBSSxNQUFNLEVBQUU7WUFDaEIsR0FBRyxHQUFHLEdBQUcsQ0FBQztTQUNiO1FBQ0QsSUFBRyxNQUFNLEtBQUssR0FBRyxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUMsU0FBUyxFQUFFO1lBQ3ZDLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDO1NBQ3ZCO1FBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQztJQUNoQixDQUFDLENBQUMsQ0FBQztJQUNILElBQUcsQ0FBQyxHQUFHLEVBQUU7UUFDTCxNQUFNLEtBQUssQ0FBQyxtREFBbUQsR0FBRyxNQUFNLENBQUMsQ0FBQztLQUM3RTtJQUNELE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQztBQWhCRCxzREFnQkM7QUFHRCxTQUFTLGVBQWUsQ0FBQyxHQUFZO0lBQ2pDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFDO1FBQ3BCLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDckI7QUFDTCxDQUFDO0FBRUQsU0FBZ0IscUJBQXFCLENBQUUsUUFBNkIsRUFBRSxVQUFxQixFQUFFLE9BQWU7SUFDeEcsRUFBRTtJQUNGLGlFQUFpRTtJQUNqRSxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUMsS0FBSyxFQUFFLEVBQUU7UUFDN0IsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBQ2IsVUFBVSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUMxQixJQUFJLFlBQVksR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQzVDLElBQUcsQ0FBQyxZQUFZLEVBQUU7Z0JBQ2QsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsUUFBUSxtQkFBbUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUMsU0FBUyxFQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUMxRztZQUNELEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxRQUFRLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ2pFLFFBQVEsQ0FBRSxHQUFFLEVBQUUsQ0FBQSxpQkFBaUIsR0FBSSxRQUFRLEdBQUcsZUFBZSxHQUFHLEtBQUssR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUMsU0FBUyxFQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7WUFDaEgsUUFBUSxDQUFDLEdBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUM1QyxRQUFRLENBQUMsR0FBRSxFQUFFLENBQUMsUUFBUSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBRSxDQUFDO1FBQzdDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxHQUFHLENBQUM7SUFDZixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFqQkQsc0RBaUJDO0FBRUQsU0FBZ0Isc0JBQXNCLENBQUUsUUFBNkIsRUFBRSxVQUFxQixFQUFFLE9BQWU7SUFDekcsc0JBQXNCO0lBQ3RCLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUNqQixVQUFVLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzFCLElBQUksWUFBWSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUM7UUFDL0MsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLFlBQVksQ0FBQztJQUNyQyxDQUFDLENBQUMsQ0FBQztJQUNILE9BQU8sd0JBQVksQ0FBQyxPQUFPLEVBQUMsT0FBTyxDQUFDLENBQUM7QUFDekMsQ0FBQztBQVJELHdEQVFDO0FBRUQsU0FBZ0Isa0JBQWtCLENBQUMsS0FBbUIsRUFBRSxTQUFrQixFQUFFLFFBQTRCLEVBQUUsUUFBa0I7SUFDeEgsSUFBSSxDQUFDLEtBQUssRUFBRTtRQUNSLFFBQVEsQ0FBQyxnQkFBZ0IsR0FBRyxTQUFTLENBQUMsQ0FBQztRQUM5QyxxRUFBcUU7UUFDOUQsTUFBTSxLQUFLLENBQUMsU0FBUyxTQUFTLGtCQUFrQixDQUFDLENBQUM7S0FDckQ7SUFDRCxJQUFJLENBQUMsUUFBUSxFQUFFO1FBQ1gsUUFBUSxDQUFDLG1CQUFtQixHQUFHLFNBQVMsQ0FBQyxDQUFDO1FBQzFDLE1BQU0sSUFBSSxLQUFLLENBQUMsU0FBUyxTQUFTLGtCQUFrQixDQUFDLENBQUM7UUFDOUQsc0VBQXNFO0tBQ2pFO0lBQ0QsSUFBSSxRQUFRLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDakMsUUFBUSxDQUFDLDRCQUE0QixHQUFHLFNBQVMsQ0FBQyxDQUFDO1FBQ3pELGdGQUFnRjtRQUN4RSxNQUFNLElBQUksS0FBSyxDQUFDLFNBQVMsU0FBUyxvQkFBb0IsUUFBUSxFQUFFLENBQUMsQ0FBQztLQUN2RTtJQUNELE9BQU8sU0FBUyxDQUFDO0FBQ3JCLENBQUM7QUFqQkQsZ0RBaUJDO0FBRUQsU0FBZ0Isc0JBQXNCLENBQUMsUUFBeUIsRUFBRSxNQUFlO0lBQzdFLElBQUksV0FBVyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUM7SUFDdkMsSUFBSSxTQUFTLEdBQUcscUJBQXFCLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNwRSxRQUFRLENBQUMsR0FBRSxFQUFFLENBQUEsa0JBQWtCLE1BQU0sT0FBTyxTQUFTLEVBQUUsQ0FBQyxDQUFDO0lBQ3pELElBQUksS0FBSyxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ25ELElBQUksUUFBUSxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDaEQsUUFBUSxDQUFDLEdBQUUsRUFBRSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFDLFNBQVMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFFLElBQUksQ0FBQyxHQUFHLGtCQUFrQixDQUFDLEtBQUssRUFBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDdEQsUUFBUSxDQUFDLEdBQUUsRUFBRSxDQUFBLDBCQUEwQixNQUFNLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUMsU0FBUyxFQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM1RixtQ0FBbUM7SUFDbkMsSUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLDJCQUEyQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3pELFFBQVEsQ0FBQyxHQUFFLEVBQUUsQ0FBQSw0QkFBNEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBQyxTQUFTLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3RSx5REFBeUQ7SUFDekQsUUFBUSxDQUFDLEdBQUUsRUFBRSxDQUFBLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNsRCxJQUFJLFVBQVUsR0FBRyxzQkFBc0IsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDMUQsUUFBUSxDQUFDLEdBQUUsRUFBRSxDQUFBLHVCQUF1QixNQUFNLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDdEUsSUFBRyxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUNqQixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUUsT0FBZSxFQUFFLEVBQUU7WUFDNUMsUUFBUSxDQUFDLEdBQUUsRUFBRSxDQUFBLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDbkQsT0FBTyxxQkFBcUIsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQy9ELENBQUMsQ0FBQyxDQUFDO0tBQ047SUFDRCxPQUFPLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFFLE9BQU8sQ0FBQyxFQUFFO1FBQ3hDLHVCQUF1QjtRQUN2QixRQUFRLENBQUMsR0FBRSxFQUFFLENBQUEsVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNuRCxPQUFPLHFCQUFxQixDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUE7SUFDL0QsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBM0JELHdEQTJCQztBQUdELFNBQWdCLDZCQUE2QixDQUFDLFFBQXlCLEVBQUMsTUFBZSxFQUFDLFFBQWlCO0lBQ3JHLElBQUksV0FBVyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUM7SUFDdkMsSUFBSSxTQUFTLEdBQUcscUJBQXFCLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNwRSxRQUFRLENBQUMsR0FBRSxFQUFFLENBQUEsa0JBQWtCLE1BQU0sT0FBTyxTQUFTLEVBQUUsQ0FBQyxDQUFDO0lBQ3pELDZGQUE2RjtJQUM3RixJQUFJLEtBQUssR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNuRCxJQUFJLFFBQVEsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2hELFFBQVEsQ0FBQyxHQUFFLEVBQUUsQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBQyxTQUFTLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxRSxrQkFBa0IsQ0FBQyxLQUFLLEVBQUMsU0FBUyxFQUFFLFFBQVEsRUFBQyxRQUFRLENBQUMsQ0FBQztJQUN2RCxRQUFRLENBQUMsR0FBRSxFQUFFLENBQUEsMEJBQTBCLE1BQU0sT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBQyxTQUFTLEVBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzVGLG1DQUFtQztJQUNuQyxJQUFJLEdBQUcsR0FBRyxRQUFRLENBQUMsMkJBQTJCLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDekQsUUFBUSxDQUFDLEdBQUUsRUFBRSxDQUFBLDRCQUE0QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFDLFNBQVMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdFLHlEQUF5RDtJQUN6RCxRQUFRLENBQUMsR0FBRSxFQUFFLENBQUEsaUJBQWlCLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2xELElBQUcsR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDakIsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFFLE9BQWUsRUFBRSxFQUFFO1lBQzVDLFFBQVEsQ0FBQyxHQUFFLEVBQUUsQ0FBQSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ25ELE9BQU8scUJBQXFCLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDL0QsQ0FBQyxDQUFDLENBQUM7S0FDTjtJQUNELE9BQU8sS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUUsT0FBTyxDQUFDLEVBQUU7UUFDeEMsdUJBQXVCO1FBQ3ZCLFFBQVEsQ0FBQyxHQUFFLEVBQUUsQ0FBQSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ25ELE9BQU8scUJBQXFCLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUE7SUFDL0QsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBMUJELHNFQTBCQztBQUNELGVBQWU7QUFDZixnRUFBZ0U7QUFFaEU7Ozs7O0dBS0c7QUFDSCxTQUFnQixpQkFBaUIsQ0FBQyxXQUFtQyxFQUFFLFNBQWlCLEVBQUUsUUFBZ0I7SUFDdEcsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQWUsU0FBUyxXQUFXLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNuRyxJQUFJLEtBQUssR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNuRCxJQUFJLFFBQVEsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2hELGtCQUFrQixDQUFDLEtBQUssRUFBQyxTQUFTLEVBQUUsUUFBUSxFQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3ZELFFBQVEsQ0FBQyxrQ0FBa0MsR0FBRyxTQUFTLEdBQUcsS0FBSyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLEdBQUksSUFBSSxDQUFDLENBQUM7SUFDdkcsT0FBTyxLQUFLLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNyRCxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsa0JBQWtCLFNBQVMsUUFBUSxRQUFRLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzRyxPQUFPLEdBQUcsQ0FBQztJQUNmLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQVZELDhDQVVDO0FBRUQsU0FBZ0IsY0FBYyxDQUFDLFdBQW1DLEVBQUUsU0FBaUIsRUFBRSxRQUFnQjtJQUVuRyxJQUFJLFVBQVUsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztJQUM5RCxJQUFJLFFBQVEsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUUsQ0FBQztJQUNoRSw2QkFBNkI7SUFDN0IsSUFBSyxRQUFRLENBQUMsTUFBTSxJQUFJLENBQUMsRUFDekI7UUFFSSxNQUFNLENBQUUsZ0JBQWdCLEdBQUcsU0FBUyxHQUFHLGNBQWMsR0FBRyxRQUFRLEdBQUcsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUUsQ0FBQztRQUMxRyxNQUFNLEtBQUssQ0FBQyxxQkFBcUIsR0FBRyxRQUFRLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUUsQ0FBQztLQUNyRjtJQUNELE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZCLENBQUM7QUFaRCx3Q0FZQztBQUlELE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRSxtQkFBbUIsRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBRXhOLFNBQVMsV0FBVyxDQUFDLFFBQWtCLEVBQUUsUUFBZ0IsRUFBRSxVQUFrQixFQUFFLFFBQWdCLEVBQUUsY0FBYyxFQUMzRyxRQUFnQixFQUNoQixNQUEyQixFQUFFLElBQXVDO0lBQ3BFLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBVSxHQUFHO1FBQzFCLElBQUksS0FBSyxHQUFHO1lBQ1IsUUFBUSxFQUFFLFFBQVE7WUFDbEIsYUFBYSxFQUFFLFVBQVU7WUFDekIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSTtZQUM5QixJQUFJLEVBQUUsR0FBRztZQUNULFFBQVEsRUFBRSxRQUFRO1lBQ2xCLGNBQWMsRUFBRSxjQUFjO1lBQzlCLFFBQVEsRUFBRSxRQUFRO1lBQ2xCLFFBQVEsRUFBRSxJQUFJO1NBQ2pCLENBQUM7UUFDRixRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pGLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDaEQsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBRUQsU0FBUyxVQUFVLENBQUMsSUFBSTtJQUNwQixJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0lBQzVJLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtRQUNaLElBQUksRUFBRSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JDLEVBQUUsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLE9BQU8sR0FBRyxFQUFFLENBQUM7S0FDekU7SUFDRCxPQUFPLEVBQUUsQ0FBQztBQUNkLENBQUM7QUFHRCxnREFBZ0Q7QUFFaEQsc0ZBQXNGO0FBQ3RGLFNBQWdCLFlBQVksQ0FBQyxNQUEyQixFQUFFLElBQWtCLEVBQUUsU0FBNEM7SUFDdEgseUJBQXlCO0lBQ3pCLGFBQWE7SUFDYixHQUFHO0lBRUgsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFO1FBQ3hDLE9BQU87S0FDVjtJQUNELElBQUksSUFBSSxHQUFHLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDMUQsSUFBSSxDQUFDLElBQUksRUFBRTtRQUNQLE9BQU87S0FDVjtJQUNELElBQUksT0FBTyxHQUFHO1FBQ1YsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1FBQ3ZCLGFBQWEsRUFBRSxJQUFJLENBQUMsYUFBYTtRQUNqQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7UUFDdkIsY0FBYyxFQUFFLElBQUksQ0FBQyxRQUFRO1FBQzdCLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtRQUN2QixJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVk7UUFDdkIsSUFBSSxFQUFFLENBQUM7UUFDUCxhQUFhLEVBQUUsSUFBSSxDQUFDLFlBQVk7UUFDaEMsUUFBUSxFQUFFLElBQUk7UUFDZCxpQ0FBaUM7UUFDakMsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJO0tBQ0gsQ0FBQztJQUNsQixJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7UUFDaEIsT0FBTyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFBO0tBQ3JDO0lBQUEsQ0FBQztJQUNGLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztJQUMxQixzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3ZELENBQUM7QUE5QkQsb0NBOEJDO0FBR0QsU0FBUyxzQkFBc0IsQ0FBQyxNQUEyQixFQUFFLElBQWtCLEVBQzNFLFNBQTRDO0lBRTVDLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRTtRQUN4QyxRQUFRLENBQUMsMEJBQTBCLEdBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEIsT0FBTztLQUNWO0lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxLQUFLLFNBQVMsQ0FBQyxFQUFFO1FBQ2pFLE1BQU0sSUFBSSxLQUFLLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3hFO0lBQ0QsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3pCOzs7UUFHSTtJQUNKLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUM3QyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUNkLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLGdDQUFnQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwRyxJQUFJLFVBQVUsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsTUFBTTtZQUNqRCxPQUFPLENBQUMsS0FBSyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDakUsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ3ZCLE9BQU87U0FDVjtLQUNKO0lBQ0QsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3BDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEIsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLEVBQUUsRUFBRTtRQUNsQixRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQ0FBZ0MsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0csMkVBQTJFO1FBQzNFLE9BQU87S0FDVjtJQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEIsWUFBWSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDdEMsT0FBTztBQUNYLENBQUM7QUFFRCxTQUFnQixjQUFjLENBQUMsUUFBZ0I7SUFDM0MsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDOUMsSUFBSTtRQUNBLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUMzQjtJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsR0FBRyxRQUFRLEdBQUcsYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQy9ELE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRTtZQUN2QixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckIsQ0FBQyxDQUFDLENBQUM7UUFDSCxtQkFBbUI7S0FDdEI7SUFDRCxPQUFPLFNBQVMsQ0FBQztBQUNyQixDQUFDO0FBWkQsd0NBWUM7QUFFRCxTQUFnQixlQUFlLENBQUMsTUFBdUIsRUFBRSxJQUFZLEVBQUUsUUFBZ0IsRUFBRSxRQUFnQjtJQUNyRyxxQkFBcUI7SUFDckIsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxFQUFFO1FBQ3ZCLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxRQUFRLENBQUE7SUFDekYsQ0FBQyxDQUFDLEtBQUssU0FBUyxDQUFDO0FBQ3JCLENBQUM7QUFMRCwwQ0FLQztBQUVELFNBQVMsa0JBQWtCLENBQUMsV0FBbUMsRUFBRSxJQUFZLEVBQUUsVUFBa0IsRUFBRSxNQUFzQjtJQUNySCxtQkFBbUI7SUFDbkIseUNBQXlDO0lBRXpDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDN0IsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FDaEUsV0FBVyxDQUFDLEVBQUU7UUFDVixJQUFJLFFBQVEsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDO1FBQ3BDLElBQUksU0FBUyxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUM7UUFDdEMsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNaLFFBQVEsQ0FBRSxHQUFFLEVBQUUsQ0FBQyxJQUFJLEdBQUcsVUFBVSxHQUFHLEdBQUcsR0FBSSxRQUFRLEdBQUcsdUJBQXVCLENBQUUsQ0FBQztZQUMvRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDaEM7YUFDSTtZQUNELFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxvQkFBb0IsR0FBRyxVQUFVLEdBQUcsR0FBRyxHQUFJLFFBQVEsQ0FBQyxDQUFDO1lBQ3BFLE9BQU8saUJBQWlCLENBQUMsV0FBVyxFQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQzVELENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ1AsUUFBUSxDQUFDLFNBQVMsTUFBTSxDQUFDLE1BQU0sZUFBZSxVQUFVLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQztnQkFDekUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDZixJQUFJLE9BQU8sR0FBRyxFQUFFLEdBQUcsS0FBSyxDQUFDO29CQUN6QixRQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsb0JBQW9CLEdBQUcsUUFBUSxHQUFHLE1BQU0sR0FBRyxPQUFPLEdBQUcsR0FBRyxDQUFDLENBQUM7b0JBQ3pFLElBQUksS0FBSyxHQUFHO3dCQUNSLFFBQVEsRUFBRSxRQUFRO3dCQUNsQixhQUFhLEVBQUUsT0FBTzt3QkFDdEIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSTt3QkFDOUIsSUFBSSxFQUFFLE9BQU87d0JBQ2IsUUFBUSxFQUFFLFFBQVE7d0JBQ2xCLGNBQWMsRUFBRSxRQUFRO3dCQUN4QixTQUFTLEVBQUUsV0FBVyxDQUFDLFVBQVUsSUFBSSxLQUFLO3dCQUMxQyxRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJO3dCQUM5QixRQUFRLEVBQUUsSUFBSTtxQkFDRCxDQUFDO29CQUNsQixzQkFBc0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQy9ELDZEQUE2RDtvQkFDN0Qsa0RBQWtEO29CQUNsRCx3SEFBd0g7b0JBQ3hILE9BQU87b0JBQ1AsdUJBQXVCO29CQUN2Qix5REFBeUQ7b0JBQ3pELGdKQUFnSjtvQkFDaEosUUFBUTtnQkFDWixDQUFDLENBQUMsQ0FBQztnQkFDSCxPQUFPLElBQUksQ0FBQztZQUNoQixDQUFDLENBQ0osQ0FBQztTQUNMO0lBQ0wsQ0FBQyxDQUNKLENBQ0EsQ0FBQyxJQUFJLENBQ0YsR0FBRyxFQUFFLENBQUUsZUFBZSxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FDbEQsQ0FBQyxJQUFJLENBQUMsQ0FBQyxhQUFtQixFQUFFLEVBQUU7UUFDM0IsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFO1lBQ3JDLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLEVBQUU7Z0JBQ2pGLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUMsU0FBUyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pELE1BQU0sS0FBSyxDQUFDLDBDQUEwQzs7d0JBRWxDLDBEQUEwRCxVQUFVLENBQUMsSUFBSSxrQkFBa0IsVUFBVSxDQUFDLFFBQVEsTUFBTSxHQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQTthQUMxSztZQUNELFdBQVcsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUN2RixNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNyQyxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDLENBQUMsQ0FBQztRQUNuQixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFBQSxDQUFDO0FBRUYsU0FBZ0IsU0FBUyxDQUFDLFdBQW1DLEVBQUUsVUFBa0IsRUFBRSxNQUFzQjtJQUNyRyxRQUFRLENBQUMsV0FBVyxHQUFHLFVBQVUsR0FBRyxPQUFPLENBQUMsQ0FBQztJQUM3QywyRkFBMkY7SUFDM0YsSUFBSSxJQUFJLEdBQUcsWUFBWSxDQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDekQsT0FBTyxrQkFBa0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUNyRSxDQUFDO0FBTEQsOEJBS0M7QUFHRCxTQUFnQixxQkFBcUIsQ0FBQyxNQUFzQjtJQUN4RCxJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztJQUNoQyxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFDWixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQzFCLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQ2YsR0FBRyxHQUFHLEdBQUcsR0FBRyxNQUFNLENBQUM7S0FDdEI7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUM7QUFSRCxzREFRQztBQUVELFNBQWdCLGlCQUFpQixDQUFDLE1BQWMsRUFBRSxNQUFzQjtJQUNwRSxJQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMzQyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7UUFDWCxLQUFLLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7S0FDakM7SUFDRCxJQUFJLEtBQUssSUFBSSxFQUFFLEVBQUU7UUFDYixNQUFNLElBQUksS0FBSyxDQUFDLHlDQUF5QyxDQUFDLENBQUM7S0FDOUQ7SUFDRCxPQUFPLE1BQU0sSUFBSSxLQUFLLENBQUM7QUFDM0IsQ0FBQztBQVRELDhDQVNDO0FBRUQsU0FBZ0IscUJBQXFCLENBQUMsTUFBYyxFQUFFLE1BQXNCO0lBQ3hFLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzNDLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRTtRQUNYLE1BQU0sS0FBSyxDQUFDLGtCQUFrQixHQUFHLE1BQU0sR0FBRyx1QkFBdUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0tBQ3ZHO0lBQ0QsSUFBSSxLQUFLLElBQUksRUFBRSxFQUFFO1FBQ2IsTUFBTSxJQUFJLEtBQUssQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO0tBQzlEO0lBQ0QsT0FBTyxNQUFNLElBQUksS0FBSyxDQUFDO0FBQzNCLENBQUM7QUFURCxzREFTQztBQUlEOzs7O0dBSUc7QUFDSCxTQUFnQixxQkFBcUIsQ0FBQyxNQUFzQixFQUFFLFFBQWdCO0lBQzFFLE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FDbEMsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQ2pELENBQUM7QUFDTixDQUFDO0FBSkQsc0RBSUM7QUFFRCxTQUFTLFlBQVksQ0FBQyxXQUFtQyxFQUFFLFVBQWtCLEVBQUUsTUFBc0I7SUFDakcsSUFBSSxRQUFRLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNqRCxJQUFJLElBQUksR0FBRztRQUNQLFFBQVEsRUFBRSxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztRQUN4RCxNQUFNLEVBQUUsUUFBUSxDQUFDLE1BQU07UUFDdkIsU0FBUyxFQUFFLFVBQVU7UUFDckIsV0FBVyxFQUFFLFFBQVEsQ0FBQyxrQkFBa0I7S0FDakMsQ0FBQztJQUNaLElBQUksb0JBQW9CLEdBQUcsRUFBNkMsQ0FBQztJQUV6RSxJQUFJLENBQUMsUUFBUSxHQUFHLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDL0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM5RCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsRUFBRSxDQUFDO0lBQzVCLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQy9CLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUM7WUFDeEIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxRQUFRO1lBQ2xCLFdBQVcsRUFBRSxHQUFHLENBQUMsb0JBQW9CO1NBQ3hDLENBQUMsQ0FBQTtRQUNGLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxHQUFHLENBQUM7SUFDN0MsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRTlEOzs7Ozs7Ozs7Ozs7OztPQWNHO0lBRUgsa0NBQWtDO0lBQ2xDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVUsUUFBUTtRQUNwQyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO1lBQ2xDLFFBQVEsRUFBRSxVQUFVO1lBQ3BCLGFBQWEsRUFBRSxRQUFRO1lBQ3ZCLElBQUksRUFBRSxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUk7WUFDOUIsSUFBSSxFQUFFLFFBQVE7WUFDZCxhQUFhLEVBQUUsUUFBUSxDQUFDLFdBQVcsRUFBRTtZQUNyQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7WUFDdkIsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUTtZQUNsQyxjQUFjLEVBQUUsSUFBSSxDQUFDLFFBQVE7WUFDN0IsUUFBUSxFQUFFLElBQUk7U0FDakIsRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDekIsQ0FBQyxDQUFDLENBQUM7SUFFSCwwQ0FBMEM7SUFFMUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDL0IsV0FBVyxDQUFBO0lBRWYsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDekMsUUFBUSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JFLE1BQU0sSUFBSSxLQUFLLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsZ0NBQWdDLEdBQUcsVUFBVSxHQUFHLEdBQUcsQ0FBQyxDQUFDO0tBQ2xHO0lBQ0Q7Ozs7Ozs7TUFPRTtJQUVGLHVDQUF1QztJQUN2QyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUM7SUFFckMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHO1FBQzlCLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztRQUM3QixVQUFVLEVBQUUsb0JBQW9CO1FBQ2hDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtLQUMxQixDQUFDO0lBRUYsYUFBYTtJQUdiLHFEQUFxRDtJQUNyRDs7Ozs7O09BTUc7SUFDSDs7Ozs7OztNQU9FO0lBQ0YsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsc0JBQXNCO0lBQ3ZELElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsV0FBVztRQUN0QyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUN4QyxNQUFNLElBQUksS0FBSyxDQUFDLGdCQUFnQixHQUFHLFdBQVcsR0FBRyw2QkFBNkIsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1NBQ3ZHO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFHSCxrQ0FBa0M7SUFDbEMsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDekQsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUMzRSxJQUFJLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDbkYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBVSxTQUFTO1FBRXJDLElBQUksY0FBYyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDOUQsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzVELE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN0RixNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFNUQsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3RFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDOUcsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFdkUsQ0FBQyxDQUFDLENBQUM7SUFFSCxpQ0FBaUM7SUFDakMsc0JBQXNCLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtRQUNsQyxRQUFRLEVBQUUsUUFBUTtRQUNsQixhQUFhLEVBQUUsSUFBSSxDQUFDLE1BQU07UUFDMUIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSTtRQUM5QixJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU07UUFDakIsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1FBQ3ZCLGNBQWMsRUFBRSxJQUFJLENBQUMsUUFBUTtRQUM3QixRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNO1FBQ2hDLFFBQVEsRUFBRSxJQUFJO0tBQ2pCLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRXJCLHNCQUFzQjtJQUN0QixJQUFJLFFBQVEsQ0FBQyxlQUFlLElBQUksUUFBUSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ2pFLFdBQVcsQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQzFFLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDNUUsV0FBVyxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNLEVBQUUscUJBQXFCLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLEVBQ3RHLHFCQUFxQixDQUFDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxFQUNqRCxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMvRCw4REFBOEQ7S0FFakU7SUFBQSxDQUFDO0lBR0Y7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7VUFvRE07SUFFTiwrQkFBK0I7SUFHL0Isa0NBQWtDO0lBRWxDLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQy9CLElBQUksR0FBRyxDQUFDLGlCQUFpQixJQUFJLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQzNELElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQzFELE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLGlCQUFpQixHQUFHLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQzthQUN0RztZQUNELFdBQVcsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsVUFBVSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUNyRixNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMvRCx5Q0FBeUM7WUFDekMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxVQUFVLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxxQkFBcUIsQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsRUFDdEcscUJBQXFCLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLEVBQ2pELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQzlEO0lBQ0wsQ0FBQyxDQUNBLENBQUM7SUFFRixnQkFBZ0I7SUFFaEIsY0FBYztJQUNkLElBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUN4QyxNQUFNLEtBQUssQ0FBQyxrQ0FBa0MsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDakU7SUFDRCxtQ0FBbUM7SUFDbkMsTUFBTSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDeEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN2QixNQUFNLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFVBQVUsTUFBTSxFQUFFLEtBQUs7UUFDNUQsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2pFLENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxJQUFJLENBQUM7QUFDaEIsQ0FBQyxDQUFDLFlBQVk7QUFJZCxTQUFnQixVQUFVLENBQUMsS0FBcUI7SUFDNUMsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQ2IsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxJQUFJO1FBQ3hCLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRTtZQUN4QyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRTtnQkFDckIsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQ0FBa0MsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDOUU7WUFDRCxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQztZQUNoRixHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3BGLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM1QzthQUFNO1lBQ0gsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMzQjtJQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTztRQUNILE9BQU8sRUFBRSxHQUFHO1FBQ1osWUFBWSxFQUFFLFlBQVk7UUFDMUIsUUFBUSxFQUFFLEtBQUs7UUFDZixTQUFTLEVBQUUsRUFBRTtLQUNoQixDQUFDO0FBQ04sQ0FBQztBQXJCRCxnQ0FxQkM7QUFHRCxTQUFnQixlQUFlLENBQUMsQ0FBQyxFQUFDLENBQUM7SUFDL0IsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN6RCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDVixJQUFJLENBQUMsS0FBSyxDQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7UUFDaEIsSUFBRyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxRQUFRLElBQUksT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssUUFBUSxFQUFFO1lBQ3pELENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNQLE9BQU8sS0FBSyxDQUFDO1NBQ2hCO1FBQ0QsSUFBRyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxRQUFRLElBQUksT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssUUFBUSxFQUFFO1lBQ3pELENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNQLE9BQU8sS0FBSyxDQUFDO1NBQ2hCO1FBQ0QsSUFBRyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxRQUFRLElBQUksT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssUUFBUSxFQUFFO1lBQ3pELENBQUMsR0FBRyxDQUFDLENBQUM7WUFDTixPQUFPLElBQUksQ0FBQztTQUNmO1FBQ0QsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDakMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25CLENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxDQUFDLENBQUM7QUFDYixDQUFDO0FBcEJELDBDQW9CQztBQUFBLENBQUM7QUFHRixTQUFTLGFBQWEsQ0FBQyxDQUFTLEVBQUUsQ0FBUztJQUN2QyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7SUFDNUIsSUFBSSxDQUFDLEVBQUU7UUFDSCxPQUFPLENBQUMsQ0FBQztLQUNaO0lBQ0QsT0FBTyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlCLENBQUM7QUFHRCx3Q0FBd0M7QUFDeEMsb0JBQW9CO0FBQ3BCLHFCQUFxQjtBQUNyQixrQkFBa0I7QUFDbEIscUJBQXFCO0FBQ3JCLHFCQUFxQjtBQUNyQixxQkFBcUI7QUFFckIsU0FBZ0IsV0FBVyxDQUFDLFNBQWlCLEVBQUUsR0FBYSxFQUFFLE9BQWlCO0lBQzNFLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNoQixLQUFLLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLFNBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQzVFLFVBQVU7S0FDYjtJQUNELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEIsQ0FBQztBQU5ELGtDQU1DO0FBRUQsU0FBZ0IsMEJBQTBCLENBQUMsS0FBcUIsRUFBRSxNQUFjLEVBQUUsVUFBMEIsRUFBRSxrQkFBa0MsRUFBRSxTQUFTO0lBQ3ZKLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUU7UUFDM0IsSUFBSSxPQUFPLEdBQUksTUFBYyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDcEQsT0FBTyxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUM7UUFDL0IsT0FBTyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUM7UUFDdEIsK0dBQStHO1FBQy9HLDZEQUE2RDtRQUM3RCxHQUFHO1FBQ0gsNERBQTREO1FBQzVELElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7UUFDdkIsc0JBQXNCLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN0RCxDQUFDLENBQUMsQ0FBQTtBQUNOLENBQUM7QUFaRCxnRUFZQztBQUdELFNBQWdCLHVCQUF1QixDQUFDLEtBQXFCLEVBQUUsU0FBUztJQUNwRSxJQUFJLE9BQU8sR0FBRyxFQUF1QyxDQUFDO0lBQ3RELElBQUksWUFBWSxHQUFHLEVBQXVDLENBQUM7SUFDM0QsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNqQixJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUU7WUFDeEMsa0NBQWtDO1lBQ2xDLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDaEUsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDL0IsWUFBWSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDMUUsWUFBWSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDL0M7U0FDSjtJQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0gsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3pCLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztJQUNaLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUU7UUFDeEIsSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFJLEdBQUcsRUFBRTtZQUNuQix5RUFBeUU7U0FDNUU7UUFDRCxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztJQUNyQixDQUFDLENBQUMsQ0FBQztJQUNILCtCQUErQjtJQUMvQixJQUFJLFNBQVMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDOUIseUVBQXlFO0lBQ3pFLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztJQUNaLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNiLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztJQUNoQixJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDakMsSUFBSSxHQUFHLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQztJQUMzQixXQUFXLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM5QixXQUFXLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM5QixXQUFXLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUU5QixTQUFTLENBQUMsT0FBTyxDQUFDLFVBQVUsUUFBUTtRQUNoQyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssT0FBTyxFQUFFO1lBQzdCLEtBQUssQ0FBQyxHQUFHLE9BQU8sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUU7Z0JBQzdDLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQzthQUNyQztZQUNELDRGQUE0RjtZQUM1RiwrSUFBK0k7WUFDL0ksbUZBQW1GO1lBQ25GLCtJQUErSTtZQUMvSSxPQUFPLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztTQUM3QjtRQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7WUFDMUMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6RCxzRkFBc0Y7WUFDdEYsSUFBSSxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsRUFBRTtnQkFDcEQsMkRBQTJEO2dCQUMzRCxJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO2dCQUN2QixxRkFBcUY7Z0JBQ3JGLDBCQUEwQixDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLFFBQVEsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDaEcsSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLEdBQUcsRUFBRTtvQkFDcEIsMEZBQTBGO2lCQUM3RjthQUVKO1NBQ0o7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUNIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O01BbUJFO0FBQ04sQ0FBQztBQWxGRCwwREFrRkM7QUFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFHVixTQUFnQixXQUFXLENBQUMsU0FBc0IsRUFBRSxNQUF1QjtJQUN2RSxJQUFJLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDdkQsSUFBSSxrQkFBa0IsR0FBRyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN2RCxPQUFPLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUM7UUFDN0MsUUFBUTtRQUNaLDRDQUE0QztRQUMxQyxLQUFLO1NBQ0YsSUFBSSxDQUFDLENBQUMsT0FBaUIsRUFBRSxFQUFFO1FBQ3hCLDZEQUE2RDtRQUM3RDs7Ozs7Ozs7OztVQVVFO1FBQ0YsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDckIsTUFBTSxJQUFJLEtBQUssQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO1NBQy9EO1FBQ0QsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUNyQixzQkFBc0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO2dCQUNsQyxRQUFRLEVBQUUsUUFBUTtnQkFDbEIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSTtnQkFDOUIsSUFBSSxFQUFFLE1BQU07Z0JBQ1osYUFBYSxFQUFFLE1BQU0sQ0FBQyxXQUFXLEVBQUU7Z0JBQ25DLGFBQWEsRUFBRSxNQUFNO2dCQUNyQixTQUFTLEVBQUUsSUFBSTtnQkFDZixRQUFRLEVBQUUsY0FBYztnQkFDeEIsY0FBYyxFQUFFLGtCQUFrQjtnQkFDbEMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTTtnQkFDaEMsUUFBUSxFQUFFLEdBQUc7YUFDaEIsRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDekIsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUF2Q0Qsa0NBdUNDO0FBQUEsQ0FBQztBQUdGLFNBQWdCLGFBQWEsQ0FBQyxTQUFxQixFQUFFLE1BQXNCO0lBQ25FLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0lBQzlCLGVBQWU7SUFDbkIsT0FBTyxVQUFVLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUNoRCxDQUFDLFNBQWMsRUFBRSxFQUFFO1FBQ25CLElBQUksZ0JBQWdCLEdBQUcsaUJBQWlCLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzlELElBQUksa0JBQWtCLEdBQUcscUJBQXFCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdkQsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsUUFBUTtZQUN2RCxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDN0MsUUFBUSxDQUFDLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxDQUFDO2dCQUN6QyxNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixHQUFHLFFBQVEsR0FBRyxzQ0FBc0MsQ0FBQyxDQUFDO2FBQzVGO1lBQ0QsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxHQUF3QixRQUFRLENBQUM7WUFDcEUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDMUMsSUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDO1lBQ3BCLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7Z0JBQ2xDLFFBQVEsRUFBRSxVQUFVO2dCQUNwQixJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRTtnQkFDeEIsYUFBYSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ2pDLElBQUksRUFBRSxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUk7Z0JBQzlCLGFBQWEsRUFBRSxJQUFJO2dCQUNuQixRQUFRLEVBQUUsZ0JBQWdCO2dCQUMxQixjQUFjLEVBQUUsa0JBQWtCO2dCQUNsQyxRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRO2dCQUNsQyxRQUFRLEVBQUUsR0FBRzthQUNoQixFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNyQixtQkFBbUI7WUFDbkIsSUFBSSxTQUFTLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUM5QixJQUFJLEdBQUcsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN2QyxJQUFLLEdBQUcsRUFDUjtvQkFFSSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQ3RCO3dCQUNJLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxPQUFPOzRCQUN6QixzQkFBc0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO2dDQUNsQyxRQUFRLEVBQUUsVUFBVTtnQ0FDcEIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxXQUFXLEVBQUU7Z0NBQzNCLGFBQWEsRUFBRSxPQUFPLENBQUMsV0FBVyxFQUFFO2dDQUNwQyxJQUFJLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJO2dDQUM5QixhQUFhLEVBQUUsUUFBUTtnQ0FDdkIsUUFBUSxFQUFFLGdCQUFnQjtnQ0FDMUIsY0FBYyxFQUFFLGtCQUFrQjtnQ0FDbEMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUTtnQ0FDbEMsUUFBUSxFQUFFLEdBQUc7NkJBQ2hCLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO3dCQUN6QixDQUFDLENBQUMsQ0FBQztxQkFDTjt5QkFDRDt3QkFDSSxNQUFNLEtBQUssQ0FBQyx1Q0FBdUMsR0FBRyxRQUFRLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztxQkFDbEc7aUJBQ0o7YUFDSjtZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBMURELHNDQTBEQztBQUFBLENBQUM7QUFFRixTQUFnQixZQUFZLENBQUMsS0FBc0I7QUFDbkQsQ0FBQztBQURELG9DQUNDO0FBRUQsU0FBZ0IsMkJBQTJCLENBQUMsU0FBcUIsRUFBRSxnQkFBMEIsRUFBRyxTQUFtQjtJQUMvRyxPQUFPLFVBQVUsQ0FBQyxTQUFTLEVBQUUsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDOUQsQ0FBQztBQUZELGtFQUVDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsVUFBVSxDQUFDLFNBQXFCLEVBQUUsZ0JBQXlCLEVBQUUsU0FBa0I7SUFDM0YsSUFBRyxTQUFTLEtBQUssU0FBUyxFQUFFO1FBQ3hCLE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXdDLENBQUMsQ0FBQztLQUM3RDtJQUNELE9BQU8sY0FBYyxDQUFDLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBRSxDQUFDLFdBQVcsRUFBRSxFQUFFO1FBQ3JFLFFBQVEsQ0FBQywwQkFBMEIsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUNoRCxPQUFPLGVBQWUsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDbkQsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBUkQsZ0NBUUM7QUFFRCxTQUFnQixlQUFlLENBQUMsV0FBbUMsRUFBRSxTQUFrQjtJQUNuRixJQUFJLE1BQXNCLENBQUM7SUFDM0IsU0FBUyxHQUFHLFNBQVMsSUFBSSxZQUFZLENBQUM7SUFDdEMsV0FBVyxHQUFHLFdBQVcsSUFBSTtRQUN6QixTQUFTLEVBQUUsU0FBUztRQUNwQixTQUFTLEVBQUUsRUFBRTtRQUNiLFNBQVMsRUFBRSxFQUFFO1FBQ2IsYUFBYSxFQUFFLEVBQUU7S0FDcEIsQ0FBQztJQUNGLE1BQU0sR0FBRztRQUNMLFdBQVcsRUFBRyxXQUFXO1FBQ3pCLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7UUFDcEIsU0FBUyxFQUFFLEVBQUU7UUFDYixPQUFPLEVBQUUsRUFBRTtRQUNYLEtBQUssRUFBRSxTQUFTO1FBQ2hCLFFBQVEsRUFBRSxFQUFFO1FBQ1osU0FBUyxFQUFFLEVBQUU7UUFDYixNQUFNLEVBQUUsRUFBRTtRQUNWLFNBQVMsRUFBRSxFQUFFO1FBQ2IsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRTtLQUNuQixDQUFBO0lBQ0QsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBRW5CLElBQUk7UUFDQSxRQUFRLENBQUMsR0FBRSxFQUFFLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsWUFBWSxDQUFDLENBQUM7UUFDbkQsZUFBZTtRQUNmLG1CQUFtQjtRQUNuQixPQUFPO1FBQ1AseUNBQXlDO1FBQ3pDLGdCQUFnQjtRQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLEVBQUU7WUFDNUMsMENBQTBDO1lBQzFDLFFBQVEsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1lBQ3hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLEdBQUcsU0FBUyxDQUFDLENBQUM7WUFDbEQsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRTtnQkFDN0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQzthQUN4RTtZQUNELElBQUksR0FBRyxHQUFHLENBQW1CLENBQUM7WUFDOUIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxTQUFTLEdBQUksV0FBVyxDQUFDLFNBQVMsQ0FBQztZQUNuRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDL0I7S0FDSjtJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1IsMkJBQTJCO1FBQzNCLGlCQUFpQjtLQUNwQjtJQUNELElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3JELElBQUksV0FBVyxHQUFFLEVBQUUsQ0FBQztJQUNwQixJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxFQUFDLEtBQUssRUFBRSxFQUFFO1FBQzdCLElBQUksTUFBTSxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3JELElBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3BCLE1BQU0sSUFBSSxLQUFLLENBQUMsU0FBUyxHQUFHLE1BQU0sR0FBRyxnQ0FBZ0MsR0FBRyxTQUFTLEdBQUcsR0FBRyxDQUFDLENBQUM7U0FDNUY7UUFDRCxXQUFXLENBQUMsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDO0lBQ2hDLENBQUMsQ0FBQyxDQUFBO0lBQ0YsTUFBTSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNoRiw2QkFBNkI7SUFDN0IsUUFBUSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDM0MsUUFBUSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUU5QyxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQ3ZDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQzlDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNSLElBQUksWUFBWSxHQUFHLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNyRCxJQUFJLGtCQUFrQixHQUFHLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXZELDJCQUEyQjtRQUMzQixzQkFBc0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO1lBQ2xDLFFBQVEsRUFBRSxNQUFNO1lBQ2hCLGFBQWEsRUFBRSxRQUFRO1lBQ3ZCLElBQUksRUFBRSxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUk7WUFDOUIsSUFBSSxFQUFFLFFBQVE7WUFDZCxRQUFRLEVBQUUsWUFBWTtZQUN0QixRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJO1lBQzlCLGNBQWMsRUFBRSxrQkFBa0I7WUFDbEMsUUFBUSxFQUFFLElBQUk7U0FDakIsRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDckIsMkJBQTJCO1FBQzNCLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQzlCLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7WUFDbEMsUUFBUSxFQUFFLFFBQVE7WUFDbEIsYUFBYSxFQUFFLEtBQUs7WUFDcEIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTTtZQUNoQyxNQUFNLEVBQUcsK0JBQStCO1lBQ3hDLFVBQVUsRUFBRyxDQUFDO1lBQ2QsSUFBSSxFQUFFLFVBQVU7WUFDaEIsUUFBUSxFQUFFLFlBQVk7WUFDdEIsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsVUFBVTtZQUNwQyxjQUFjLEVBQUUsa0JBQWtCO1lBQ2xDLFFBQVEsRUFBRSxJQUFJO1NBQ2pCLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRXJCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUMsQ0FDQSxDQUFDLElBQUksQ0FBRSxHQUFFLEVBQUUsQ0FDUixXQUFXLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FDN0MsQ0FBQyxJQUFJLENBQUUsR0FBRyxFQUFFLENBQ1QsYUFBYSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQy9DLENBQUMsSUFBSSxDQUFFLEdBQUcsRUFBRTtRQUNUOzs7Ozs7Ozs7VUFTRTtRQUNGLFFBQVEsQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLENBQUMsQ0FBQztRQUN4QyxNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlELHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUMsMkVBQTJFO1FBRTNFLE9BQU8sRUFBRSxDQUFDO1FBQ1YsTUFBTSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3pDLEVBQUUsQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBQyxTQUFTLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxRSxPQUFPLEVBQUUsQ0FBQztRQUNWLE9BQU8sTUFBTSxDQUFDLFNBQVMsQ0FBQztRQUN4QixRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkIsT0FBTyxFQUFFLENBQUM7UUFDVixJQUFJLFNBQVMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMxQyxTQUFTLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM5RCxRQUFRLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQyxDQUFDO1FBQ3RDLE9BQU8sU0FBUyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUM7UUFDdkMsSUFBSTtZQUVBLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMzQixRQUFRLENBQUMsY0FBYyxHQUFHLFNBQVMsQ0FBQyxDQUFDO1lBQ3JDLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0RCxPQUFPLEVBQUUsQ0FBQztZQUNWLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUU7Z0JBQzdCLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0NBQWtDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7YUFDNUU7WUFDRCxJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUM7WUFDakIsaUZBQWlGO1lBQ2pGLE9BQU8sR0FBRyxDQUFDO1NBQ2Q7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNWLFFBQVEsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUU7Z0JBQ3ZCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixDQUFDLENBQUMsQ0FBQztZQUNILE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ2pEO0lBRUwsQ0FBQyxDQUNBLENBQUMsS0FBSyxDQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7UUFDYixRQUFRLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFO1lBQ3ZCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xELENBQUMsQ0FBNEIsQ0FBQztBQUNsQyxDQUFDO0FBL0pELDBDQStKQztBQUVELFNBQWdCLDBCQUEwQixDQUFDLEdBQTRDLEVBQUUsSUFBYztJQUNuRyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hCLEdBQUcsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3hELE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQztBQUpELGdFQUlDO0FBRUQsU0FBZ0Isd0JBQXdCLENBQUMsR0FBNEMsRUFBRSxJQUFZLEVBQUUsSUFBWTtJQUM3RyxJQUFJLFFBQVEsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDekIsSUFBSSxRQUFRLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3pCLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtRQUNmLE9BQU8sQ0FBQyxDQUFDO0tBQ1o7SUFDRCw4QkFBOEI7SUFDOUIsSUFBSSxRQUFRLElBQUksQ0FBQyxRQUFRLEVBQUU7UUFDdkIsT0FBTyxDQUFDLENBQUMsQ0FBQztLQUNiO0lBQ0QsSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRLEVBQUU7UUFDdkIsT0FBTyxDQUFDLENBQUMsQ0FBQztLQUNiO0lBRUQsSUFBSSxLQUFLLEdBQUcsQ0FBQyxRQUFRLElBQUksUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNwRCxJQUFJLEtBQUssR0FBRyxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3BELDJCQUEyQjtJQUMzQixJQUFJLENBQUMsR0FBRyxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ3RCLElBQUksQ0FBQyxFQUFFO1FBQ0gsT0FBTyxDQUFDLENBQUM7S0FDWjtJQUNELE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBdEJELDREQXNCQztBQUVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUVwQyxTQUFnQixXQUFXLENBQUMsR0FBbUIsRUFBRSxRQUFnQjtJQUM3RCxPQUFPLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbkMsQ0FBQztBQUZELGtDQUVDO0FBRUQsU0FBZ0IsZ0JBQWdCLENBQUMsR0FBbUIsRUFBRSxDQUFhLEVBQUUsR0FBZTtJQUNoRixJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxVQUFVLEVBQUU7UUFDN0IsTUFBTSxJQUFJLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0tBQ2pEO0lBRUQsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ25DLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0lBQ3RELElBQUksQ0FBQyxHQUFHLEVBQUU7UUFDTixPQUFPLEVBQUUsQ0FBQztLQUNiO0lBQ0QsT0FBTyxNQUFNLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN4RSxDQUFDO0FBWEQsNENBV0M7QUFFRCxTQUFnQixrQkFBa0IsQ0FBQyxRQUF3QixFQUFFLE1BQWM7SUFDdkUsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDdEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxXQUFXLEdBQUcsTUFBTSxHQUFHLHNCQUFzQixDQUFDLENBQUM7S0FDbEU7QUFDTCxDQUFDO0FBSkQsZ0RBSUM7QUFFRCxTQUFnQiw2QkFBNkIsQ0FBQyxRQUF5QixFQUFFLE1BQWU7SUFDcEYsa0JBQWtCLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3JDLElBQUksU0FBUyxHQUFHLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUMsTUFBTSxDQUFDLENBQUM7SUFDbkUsSUFBSSxPQUFPLEdBQUcsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO0lBQzFHLElBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3BELElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNoRixPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUM7QUFQRCxzRUFPQztBQUVELFNBQWdCLGlDQUFpQyxDQUFDLFFBQXlCLEVBQUUsTUFBZTtJQUN4RixrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDckMsSUFBSSxTQUFTLEdBQUcscUJBQXFCLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBQyxNQUFNLENBQUMsQ0FBQztJQUNuRSxJQUFJLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7SUFDMUcsSUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDcEQsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3BGLE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQztBQVBELDhFQU9DO0FBRUQsU0FBZ0Isc0JBQXNCLENBQUMsUUFBd0IsRUFBRSxNQUFjO0lBQzNFLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNyQyxJQUFJLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7SUFDdEcsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3BDLENBQUM7QUFKRCx3REFJQztBQUVELFNBQWdCLGVBQWUsQ0FBQyxRQUF3QixFQUFFLE1BQWM7SUFDcEUsa0JBQWtCLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3JDLE9BQU8sUUFBUSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZELENBQUM7QUFIRCwwQ0FHQztBQUVELFNBQVMsT0FBTztJQUNaLElBQUksTUFBTSxJQUFJLE1BQU0sQ0FBQyxFQUFFLEVBQUU7UUFDckIsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDO0tBQ2Y7QUFDTCxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixtQ0FBbUMsQ0FBQyxRQUF3QixFQUFFLE1BQWM7SUFDeEYsK0JBQStCO0lBQy9CLE9BQU8sc0JBQXNCLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3BELENBQUM7QUFIRCxrRkFHQztBQUVELFNBQWdCLHFCQUFxQixDQUFDLFFBQXdCLEVBQUUsUUFBZ0I7SUFDNUUsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDekMsTUFBTSxJQUFJLEtBQUssQ0FBQyxhQUFhLEdBQUcsUUFBUSxHQUFHLHNCQUFzQixDQUFDLENBQUM7S0FDdEU7SUFDRCxJQUFJLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7SUFDM0csT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3BDLENBQUM7QUFORCxzREFNQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUF1Q0U7QUFFRjs7Ozs7OztHQU9HO0FBQ0gsU0FBZ0IsMENBQTBDLENBQUMsS0FBcUIsRUFBRSxVQUFvQixFQUFFLFNBQWtCO0lBQ3RILElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNiLEVBQUU7SUFDRixJQUFJLEVBQUUsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLG1DQUFtQyxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQztJQUNsRixJQUFJLE9BQU8sR0FBRyxTQUFxQixDQUFDO0lBQ3BDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBVSxRQUFRO1FBQ2pDLElBQUksVUFBVSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUN2RCxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ1YsT0FBTyxHQUFHLFVBQVUsQ0FBQztTQUN4QjthQUFNO1lBQ0gsT0FBTyxHQUFHLENBQUMsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQ2pEO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDSCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsR0FBRyx5QkFBeUIsQ0FBQyxDQUFBO0tBQ3RHO0lBQ0QsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLE1BQU07UUFDNUIsRUFBRSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxPQUFPO1lBQ3ZDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDeEIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztJQUNILE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDbkIsT0FBTztRQUNILE9BQU8sRUFBRSxPQUFPO1FBQ2hCLFdBQVcsRUFBRSxHQUFHO0tBQ25CLENBQUM7QUFDTixDQUFDO0FBMUJELGdHQTBCQztBQUdELFNBQWdCLHdDQUF3QyxDQUFDLEtBQXFCLEVBQUUsUUFBZ0IsRUFBRSxTQUFrQjtJQUNoSCxPQUFPLDBDQUEwQyxDQUFDLEtBQUssRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3BGLENBQUM7QUFGRCw0RkFFQyIsImZpbGUiOiJtb2RlbC9tb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBGdW5jdGlvbmFsaXR5IG1hbmFnaW5nIHRoZSBtYXRjaCBtb2RlbHNcclxuICpcclxuICogQGZpbGVcclxuICovXHJcblxyXG4vL2ltcG9ydCAqIGFzIGludGYgZnJvbSAnY29uc3RhbnRzJztcclxuaW1wb3J0ICogYXMgZGVidWdmIGZyb20gJ2RlYnVnZic7XHJcblxyXG52YXIgZGVidWdsb2cgPSBkZWJ1Z2YoJ21vZGVsJyk7XHJcblxyXG5pbXBvcnQgeyBJRk1vZGVsIGFzIElGTW9kZWx9IGZyb20gJy4vaW5kZXhfbW9kZWwnO1xyXG5cclxuaW1wb3J0IHsgYXBwbHlQcm9qZWN0LCBhcHBseVByb2plY3RDb2xsZWN0aW5nLCBJUHNldWRvTW9kZWwsIElTcmNIYW5kbGUsIElTeW5vbnltfSBmcm9tICcuL3NyY2hhbmRsZSc7XHJcblxyXG4vLyB0aGUgaGFyZGNvZGVkIGRvbWFpbiBtZXRhbW9kZWwhXHJcbmNvbnN0IERPTUFJTl9NRVRBTU9ERUwgPSAnbWV0YW1vZGVsJztcclxuXHJcbi8vY29uc3QgbG9hZGxvZyA9IGxvZ2dlci5sb2dnZXIoJ21vZGVsbG9hZCcsICcnKTtcclxuXHJcblxyXG5pbXBvcnQgKiAgYXMgSU1hdGNoIGZyb20gJy4uL21hdGNoL2lmbWF0Y2gnO1xyXG5pbXBvcnQgKiBhcyBJbnB1dEZpbHRlclJ1bGVzIGZyb20gJy4uL21hdGNoL3J1bGUnO1xyXG4vL2ltcG9ydCAqIGFzIFRvb2xzIGZyb20gJy4uL21hdGNoL3Rvb2xzJztcclxuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgKiBhcyBNZXRhIGZyb20gJy4vbWV0YSc7XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJ2Fib3RfdXRpbHMnO1xyXG5pbXBvcnQgKiBhcyBDaXJjdWxhclNlciBmcm9tICdhYm90X3V0aWxzJztcclxuaW1wb3J0ICogYXMgRGlzdGFuY2UgZnJvbSAnYWJvdF9zdHJpbmdkaXN0JztcclxuaW1wb3J0ICogYXMgcHJvY2VzcyBmcm9tICdwcm9jZXNzJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xyXG5cclxuaW1wb3J0ICogYXMgTW9uZ29VdGlscyBmcm9tICcuLi91dGlscy9tb25nbyc7XHJcblxyXG4vL2ltcG9ydCAqIGFzIElTY2hlbWEgZnJvbSAnLi4vbW9kZWxsb2FkL3NjaGVtYWxvYWQnO1xyXG5pbXBvcnQgKiBhcyBTY2hlbWFsb2FkIGZyb20gJy4uL21vZGVsbG9hZC9zY2hlbWFsb2FkJztcclxuaW1wb3J0ICogYXMgTW9uZ29NYXAgZnJvbSAnLi9tb25nb21hcCc7XHJcblxyXG4vKipcclxuICogdGhlIG1vZGVsIHBhdGgsIG1heSBiZSBjb250cm9sbGVkIHZpYSBlbnZpcm9ubWVudCB2YXJpYWJsZVxyXG4gKi9cclxudmFyIGVudk1vZGVsUGF0aCA9IHByb2Nlc3MuZW52W1wiQUJPVF9NT0RFTFBBVEhcIl0gfHwgXCJub2RlX21vZHVsZXMvbWdubHFfdGVzdG1vZGVsL3Rlc3Rtb2RlbFwiO1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjbXBUb29scyhhOiBJTWF0Y2guSVRvb2wsIGI6IElNYXRjaC5JVG9vbCkge1xyXG4gICAgcmV0dXJuIGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XHJcbn1cclxuXHJcbnR5cGUgSU1vZGVsID0gSU1hdGNoLklNb2RlbDtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwcm9wYWdhdGVUeXBlVG9Nb2RlbERvYyggbW9kZWxEb2MgOiBJRk1vZGVsLklNb2RlbERvYywgZXNjaGVtYSA6IElGTW9kZWwuSUV4dGVuZGVkU2NoZW1hICkge1xyXG4gICAgLy8gcHJvcHMgeyBcImVsZW1lbnRfc3ltYm9sXCI6e1widHlwZVwiOlwiU3RyaW5nXCIsXCJ0cmltXCI6dHJ1ZSxcIl9tX2NhdGVnb3J5XCI6XCJlbGVtZW50IHN5bWJvbFwiLFwie1xyXG4gICAgbW9kZWxEb2MuX2NhdGVnb3JpZXMuZm9yRWFjaCggY2F0ID0+IHtcclxuICAgICAgICB2YXIgcHJvcGVydHlOYW1lID0gTW9uZ29NYXAubWFrZUNhbm9uaWNQcm9wZXJ0eU5hbWUoY2F0LmNhdGVnb3J5KTsgXHJcbiAgICAgICAgdmFyIHByb3AgPSBNb25nb01hcC5maW5kRXNjaGVtYVByb3BGb3JDYXRlZ29yeShlc2NoZW1hLnByb3BzLCBjYXQuY2F0ZWdvcnkpO1xyXG4gICAgICAgIGlmICggIXByb3ApIHtcclxuICAgICAgICAgICAgaWYoIG1vZGVsRG9jLm1vZGVsbmFtZSAhPT0gXCJtZXRhbVhYWG9kZWxzXCIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBlcnIgPSBcclxuICAgICAgICAgICAgICAgXCJVbmFibGUgdG8gZmluZCBwcm9wZXJ0eSBcIiArIHByb3BlcnR5TmFtZSArIFwiIGZvciBjYXRlZ29yeSBcIiArIGNhdC5jYXRlZ29yeSArIFwiIGluIG1vZGVsIFwiIFxyXG4gICAgICAgICAgICAgICAgKyBtb2RlbERvYy5tb2RlbG5hbWVcclxuICAgICAgICAgICAgICAgICsgXCI7IHZhbGlkIHByb3BzIGFyZTpcXFwiXCIgKyBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhlc2NoZW1hLnByb3BzKS5qb2luKFwiLFxcblwiKSArIFwiXFxcIlwiIFxyXG4gICAgICAgICAgICAgICAgICsgXCIgXCIgKyBKU09OLnN0cmluZ2lmeShlc2NoZW1hLnByb3BzKTtcclxuICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xyXG4gICAgICAgICAgICAgICAgIGRlYnVnbG9nKGVycik7XHJcbiAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBkZWJ1Z2xvZygnIGF1Z21lbnRpbmcgdHlwZSBmb3IgXFxcIicgKyBjYXQuY2F0ZWdvcnkgKyBcIihcIiArIHByb3BlcnR5TmFtZSArIFwiKVxcXCIgd2l0aCBcIiArIEpTT04uc3RyaW5naWZ5KHByb3AudHlwZSkpO1xyXG4gICAgICAgICAgICBjYXQudHlwZSA9IHByb3AudHlwZTsgLy8gdGhpcyBtYXkgYmUgW1wiU3RyaW5nXCJdIGZvciBhbiBhcnJheSB0eXBlIVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYXNQcm9taXNlKGEgOiBhbnkpIDogUHJvbWlzZTxhbnk+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSggKHJlc29sdmUscmVqZWN0KSA9PiB7IHJlc29sdmUoYSk7fSApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9kZWxEYXRhKHNyY0hhbmRsZTogSVNyY0hhbmRsZSwgbW9kZWxOYW1lOiBzdHJpbmcsIG1vZGVsTmFtZXMgOiBzdHJpbmdbXSkgOiBQcm9taXNlPGFueT4ge1xyXG4gICAgaWYoIG1vZGVsTmFtZSA9PSBcIm1ldGFtb2RlbHNcIiApIHtcclxuICAgICAgICByZXR1cm4gYXNQcm9taXNlKG1vZGVsTmFtZXMuZmlsdGVyKCAoYSkgPT4gKGEgIT09IFwibWV0YW1vZGVsc1wiKSkubWFwKCAoYSkgPT4gcmVhZEZpbGVBc0pTT04oc3JjSGFuZGxlLmdldFBhdGgoKSArIGEgKyAnLm1vZGVsLmRvYy5qc29uJykpKTtcclxuICAgIH0gZWxzZSB7ICBcclxuICAgICAgICByZXR1cm4gc3JjSGFuZGxlLmdldEpTT04obW9kZWxOYW1lICsgXCIuZGF0YS5qc29uXCIpXHJcbiAgICB9XHJcbn1cclxuLyoqXHJcbiAqIHJldHVybnMgd2hlbiBhbGwgbW9kZWxzIGFyZSBsb2FkZWQgYW5kIGFsbCBtb2RlbGRvY3MgYXJlIG1hZGVcclxuICogQHBhcmFtIHNyY0hhbmRsZVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vZGVsSGFuZGxlKHNyY0hhbmRsZTogSVNyY0hhbmRsZSwgY29ubmVjdGlvblN0cmluZyA6IHN0cmluZyk6IFByb21pc2U8SU1hdGNoLklNb2RlbEhhbmRsZVJhdz4ge1xyXG4gICAgdmFyIHJlcyA9IHtcclxuICAgICAgICBzcmNIYW5kbGU6IHNyY0hhbmRsZSxcclxuICAgICAgICBtb2RlbERvY3M6IHt9LFxyXG4gICAgICAgIG1vZGVsRVNjaGVtYXM6IHt9LFxyXG4gICAgICAgIG1vbmdvTWFwczoge31cclxuICAgIH0gYXMgSU1hdGNoLklNb2RlbEhhbmRsZVJhdztcclxuICAgIC8vdmFyIG1vZGVsRVMgPSBTY2hlbWFsb2FkLmdldEV4dGVuZGVkU2NoZW1hTW9kZWwoc3JjSGFuZGxlKTtcclxuICAgIHJldHVybiBzcmNIYW5kbGUuY29ubmVjdChjb25uZWN0aW9uU3RyaW5nKS50aGVuKCAoKSA9PntcclxuICAgIHZhciBtb2RlbG5hbWVzID0gc3JjSGFuZGxlLm1vZGVsTmFtZXMoKTsgXHJcbiAgICAvL3JldHVybiBtb2RlbEVTLmRpc3RpbmN0KCdtb2RlbG5hbWUnKS50aGVuKFxyXG4gICAgLy92YXIgZm4gPSAobW9kZWxuYW1lcykgPT4ge1xyXG4gICAgIGRlYnVnbG9nKCgpID0+ICdoZXJlIGRpc3RpbmN0IG1vZGVsbmFtZXMgJyArIEpTT04uc3RyaW5naWZ5KG1vZGVsbmFtZXMpKTtcclxuICAgICByZXR1cm4gUHJvbWlzZS5hbGwobW9kZWxuYW1lcy5tYXAoZnVuY3Rpb24gKG1vZGVsbmFtZSkge1xyXG4gICAgICAgICAgICBkZWJ1Z2xvZygoKSA9PiAnY3JlYXRpbmcgdHJpcGVsIGZvciAnICsgbW9kZWxuYW1lKTtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFtTY2hlbWFsb2FkLmdldEV4dGVuZFNjaGVtYURvY0Zyb21EQihzcmNIYW5kbGUsIG1vZGVsbmFtZSksXHJcbiAgICAgICAgICAgIFNjaGVtYWxvYWQuZ2V0TW9kZWxEb2NGcm9tREIoc3JjSGFuZGxlLCBtb2RlbG5hbWUpLCBcclxuICAgICAgICAgICAgZ2V0TW9kZWxEYXRhKHNyY0hhbmRsZSxtb2RlbG5hbWUsIG1vZGVsbmFtZXMpXHJcbiAgICAgICAgXSkudGhlbihcclxuICAgICAgICAgICAgICAgICh2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlYnVnbG9nKCgpID0+ICdhdHRlbXB0aW5nIHRvIGxvYWQgJyArIG1vZGVsbmFtZSArICcgdG8gY3JlYXRlIG1vbmdvbWFwJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIFtleHRlbmRlZFNjaGVtYSwgbW9kZWxEb2MsIGRhdGFdID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzLm1vZGVsRVNjaGVtYXNbbW9kZWxuYW1lXSA9IGV4dGVuZGVkU2NoZW1hO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcy5tb2RlbERvY3NbbW9kZWxuYW1lXSA9IG1vZGVsRG9jO1xyXG4gICAgICAgICAgICAgICAgICAgIHByb3BhZ2F0ZVR5cGVUb01vZGVsRG9jKG1vZGVsRG9jLGV4dGVuZGVkU2NoZW1hKTtcclxuICAgICAgICAgICAgICAgICAgICBzcmNIYW5kbGUuc2V0TW9kZWwobW9kZWxuYW1lLGRhdGEsZXh0ZW5kZWRTY2hlbWEpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8qICBpZiAoIG1vZGVsbmFtZSA9PSBcIml1cGFjc1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgZGVidWdsb2coJyBtb2RlbGRvY3MgaXMgJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgZGVidWdsb2coJyBoZXJlICcgKyBKU09OLnN0cmluZ2lmeShtb2RlbERvYykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgIGRlYnVnbG9nKCcgaGVyZSAnICsgSlNPTi5zdHJpbmdpZnkoZXh0ZW5kZWRTY2hlbWEpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnIG1vZGVsRG9jcyBpcyAnICsgSlNPTi5zdHJpbmdpZnkobW9kZWxEb2MpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnKioqIGVzc2NoZW1hIGlzICcgKyBKU09OLnN0cmluZ2lmeShleHRlbmRlZFNjaGVtYSkpO1xyXG4gICAgICAgICAgICAgICAgICAgfSovXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzLm1vbmdvTWFwc1ttb2RlbG5hbWVdID0gTW9uZ29NYXAubWFrZU1vbmdvTWFwKG1vZGVsRG9jLCBleHRlbmRlZFNjaGVtYSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVidWdsb2coKCk9PiAnY3JlYXRlZCBtb25nb21hcCBmb3IgJyArIG1vZGVsbmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgfSkpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIHJldHVybiByZXM7XHJcbiAgICB9KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RmFjdFN5bm9ueW1zKG1vbmdvSGFuZGxlOiBJTWF0Y2guSU1vZGVsSGFuZGxlUmF3LCBtb2RlbG5hbWU6IHN0cmluZyk6IFByb21pc2U8SVN5bm9ueW1bXT4ge1xyXG4gICAgdmFyIG1vZGVsID0gbW9uZ29IYW5kbGUuc3JjSGFuZGxlLm1vZGVsKG1vZGVsbmFtZSk7XHJcbiAgICByZXR1cm4gbW9kZWwuYWdncmVnYXRlU3lub255bXMoKTtcclxufVxyXG5cclxuLypcclxuZXhwb3J0IGludGVyZmFjZSBJU3lub255bUJlYXJpbmdEb2Mge1xyXG4gICAgX3N5bm9ueW1zOiBbe1xyXG4gICAgICAgIGNhdGVnb3J5OiBzdHJpbmcsXHJcbiAgICAgICAgZmFjdDogc3RyaW5nLFxyXG4gICAgICAgIHN5bm9ueW1zOiBzdHJpbmdbXVxyXG4gICAgfV1cclxufVxyXG4qL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vbmdvQ29sbGVjdGlvbk5hbWVGb3JEb21haW4odGhlTW9kZWw6IElNYXRjaC5JTW9kZWxzLCBkb21haW4gOiBzdHJpbmcpIDogc3RyaW5nIHtcclxuICAgIHZhciByID0gZ2V0TW9uZ29vc2VNb2RlbE5hbWVGb3JEb21haW4odGhlTW9kZWwsIGRvbWFpbik7XHJcbiAgICByZXR1cm4gU2NoZW1hbG9hZC5tYWtlTW9uZ29Db2xsZWN0aW9uTmFtZShyKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9uZ29vc2VNb2RlbE5hbWVGb3JEb21haW4odGhlTW9kZWwgOiBJTWF0Y2guSU1vZGVscywgZG9tYWluIDogc3RyaW5nKSA6IHN0cmluZyB7XHJcbiAgICB2YXIgciA9IGdldE1vZGVsTmFtZUZvckRvbWFpbih0aGVNb2RlbC5tb25nb0hhbmRsZSwgZG9tYWluKTtcclxuICAgIHJldHVybiByOyBcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vZGVsRm9yTW9kZWxOYW1lKHRoZU1vZGVsIDogSU1hdGNoLklNb2RlbHMsIG1vZGVsbmFtZTogc3RyaW5nKSA6IGFueSB7XHJcbiAgICByZXR1cm4gdGhlTW9kZWwubW9uZ29IYW5kbGUuc3JjSGFuZGxlLm1vZGVsKG1vZGVsbmFtZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRNb2RlbEZvckRvbWFpbih0aGVNb2RlbCA6IElNYXRjaC5JTW9kZWxzLCBkb21haW4gOiBzdHJpbmcpIDogYW55IHtcclxuICAgIHZhciBtb2RlbG5hbWUgPSBnZXRNb2RlbE5hbWVGb3JEb21haW4odGhlTW9kZWwubW9uZ29IYW5kbGUsIGRvbWFpbik7XHJcbiAgICByZXR1cm4gZ2V0TW9kZWxGb3JNb2RlbE5hbWUodGhlTW9kZWwsIG1vZGVsbmFtZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRNb2RlbE5hbWVGb3JEb21haW4oaGFuZGxlIDogSU1hdGNoLklNb2RlbEhhbmRsZVJhdywgZG9tYWluIDogc3RyaW5nKSA6IHN0cmluZyB7XHJcbiAgICB2YXIgcmVzID0gdW5kZWZpbmVkO1xyXG4gICAgT2JqZWN0LmtleXMoaGFuZGxlLm1vZGVsRG9jcykuZXZlcnkoIGtleSA9PiB7XHJcbiAgICAgICAgdmFyIGRvYyA9IGhhbmRsZS5tb2RlbERvY3Nba2V5XTtcclxuICAgICAgICBpZiAoIGtleSA9PSBkb21haW4pIHtcclxuICAgICAgICAgICAgcmVzID0ga2V5OyBcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoZG9tYWluID09PSBkb2MuZG9tYWluICYmIGRvYy5tb2RlbG5hbWUpIHtcclxuICAgICAgICAgICAgcmVzID0gZG9jLm1vZGVsbmFtZTsgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAhcmVzO1xyXG4gICAgfSk7XHJcbiAgICBpZighcmVzKSB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoJ2F0dGVtcHQgdG8gcmV0cmlldmUgbW9kZWxOYW1lIGZvciB1bmtub3duIGRvbWFpbiAnICsgZG9tYWluKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXM7XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBhc3N1cmVEaXJFeGlzdHMoZGlyIDogc3RyaW5nKSB7XHJcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSl7XHJcbiAgICAgICAgZnMubWtkaXJTeW5jKGRpcik7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJSZW1hcENhdGVnb3JpZXMoIG1vbmdvTWFwIDogSU1hdGNoLkNhdE1vbmdvTWFwLCBjYXRlZ29yaWVzIDogc3RyaW5nW10sIHJlY29yZHMgOiBhbnlbXSApIDogYW55W10ge1xyXG4gICAgLy9cclxuICAgIC8vY29uc29sZS5sb2coJ2hlcmUgbWFwJyArIEpTT04uc3RyaW5naWZ5KG1vbmdvTWFwLHVuZGVmaW5lZCwyKSk7XHJcbiAgICByZXR1cm4gcmVjb3Jkcy5tYXAoKHJlYyxpbmRleCkgPT4ge1xyXG4gICAgICAgIHZhciByZXMgPSB7fTtcclxuICAgICAgICBjYXRlZ29yaWVzLmZvckVhY2goY2F0ZWdvcnkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgY2F0ZWdvcnlQYXRoID0gbW9uZ29NYXBbY2F0ZWdvcnldLnBhdGhzO1xyXG4gICAgICAgICAgICBpZighY2F0ZWdvcnlQYXRoKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gY2F0ZWdvcnkgJHtjYXRlZ29yeX0gbm90IHByZXNlbnQgaW4gJHtKU09OLnN0cmluZ2lmeShtb25nb01hcCx1bmRlZmluZWQsMil9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVzW2NhdGVnb3J5XSA9IE1vbmdvTWFwLmdldEZpcnN0TWVtYmVyQnlQYXRoKHJlYywgY2F0ZWdvcnlQYXRoKTtcclxuICAgICAgICAgICAgZGVidWdsb2coICgpPT4nZ290IG1lbWJlciBmb3IgJyAgKyBjYXRlZ29yeSArICcgZnJvbSByZWMgbm8gJyArIGluZGV4ICsgJyAnICsgSlNPTi5zdHJpbmdpZnkocmVjLHVuZGVmaW5lZCwyKSApO1xyXG4gICAgICAgICAgICBkZWJ1Z2xvZygoKT0+IEpTT04uc3RyaW5naWZ5KGNhdGVnb3J5UGF0aCkpO1xyXG4gICAgICAgICAgICBkZWJ1Z2xvZygoKT0+ICdyZXMgOiAnICsgcmVzW2NhdGVnb3J5XSApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiByZXM7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlclJlbWFwQ2F0ZWdvcmllczIoIG1vbmdvTWFwIDogSU1hdGNoLkNhdE1vbmdvTWFwLCBjYXRlZ29yaWVzIDogc3RyaW5nW10sIHJlY29yZHMgOiBhbnlbXSApIDogYW55W10ge1xyXG4gICAgLy8gY29uc3RydWN0IGEgcHJvamVjdFxyXG4gICAgdmFyIHByb2plY3QgPSB7fTtcclxuICAgIGNhdGVnb3JpZXMuZm9yRWFjaChjYXRlZ29yeSA9PiB7XHJcbiAgICAgICAgdmFyIGNhdGVnb3J5UGF0aCA9IG1vbmdvTWFwW2NhdGVnb3J5XS5mdWxscGF0aDtcclxuICAgICAgICBwcm9qZWN0W2NhdGVnb3J5XSA9IGNhdGVnb3J5UGF0aDtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIGFwcGx5UHJvamVjdChyZWNvcmRzLHByb2plY3QpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tNb2RlbE1vbmdvTWFwKG1vZGVsOiBJUHNldWRvTW9kZWwsIG1vZGVsbmFtZSA6IHN0cmluZywgbW9uZ29NYXA6IElNYXRjaC5DYXRNb25nb01hcCwgY2F0ZWdvcnk/IDogc3RyaW5nKSB7XHJcbiAgICBpZiAoIW1vZGVsKSB7XHJcbiAgICAgICAgZGVidWdsb2coJyBubyBtb2RlbCBmb3IgJyArIG1vZGVsbmFtZSk7XHJcbiAvLyAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoYG1vZGVsICR7bW9kZWxuYW1lfSBub3QgZm91bmQgaW4gZGJgKTtcclxuICAgICAgICB0aHJvdyBFcnJvcihgbW9kZWwgJHttb2RlbG5hbWV9IG5vdCBmb3VuZCBpbiBkYmApO1xyXG4gICAgfVxyXG4gICAgaWYgKCFtb25nb01hcCkge1xyXG4gICAgICAgIGRlYnVnbG9nKCcgbm8gbW9uZ29NYXAgZm9yICcgKyBtb2RlbG5hbWUpO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgbW9kZWwgJHttb2RlbG5hbWV9IGhhcyBubyBtb2RlbG1hcGApO1xyXG4vLyAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGBtb2RlbCAke21vZGVsbmFtZX0gaGFzIG5vIG1vZGVsbWFwYCk7XHJcbiAgICB9XHJcbiAgICBpZiAoY2F0ZWdvcnkgJiYgIW1vbmdvTWFwW2NhdGVnb3J5XSkge1xyXG4gICAgICAgIGRlYnVnbG9nKCcgbm8gbW9uZ29NYXAgY2F0ZWdvcnkgZm9yICcgKyBtb2RlbG5hbWUpO1xyXG4gIC8vICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGBtb2RlbCAke21vZGVsbmFtZX0gaGFzIG5vIGNhdGVnb3J5ICR7Y2F0ZWdvcnl9YCk7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYG1vZGVsICR7bW9kZWxuYW1lfSBoYXMgbm8gY2F0ZWdvcnkgJHtjYXRlZ29yeX1gKTtcclxuICAgIH1cclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHBhbmRlZFJlY29yZHNGdWxsKHRoZU1vZGVsIDogSU1hdGNoLklNb2RlbHMsIGRvbWFpbiA6IHN0cmluZykgOiBQcm9taXNlPHsgW2tleSA6IHN0cmluZ10gOiBhbnl9PiB7XHJcbiAgICB2YXIgbW9uZ29IYW5kbGUgPSB0aGVNb2RlbC5tb25nb0hhbmRsZTtcclxuICAgIHZhciBtb2RlbG5hbWUgPSBnZXRNb2RlbE5hbWVGb3JEb21haW4odGhlTW9kZWwubW9uZ29IYW5kbGUsIGRvbWFpbik7XHJcbiAgICBkZWJ1Z2xvZygoKT0+YCBtb2RlbG5hbWUgZm9yICR7ZG9tYWlufSBpcyAke21vZGVsbmFtZX1gKTtcclxuICAgIHZhciBtb2RlbCA9IG1vbmdvSGFuZGxlLnNyY0hhbmRsZS5tb2RlbChtb2RlbG5hbWUpO1xyXG4gICAgdmFyIG1vbmdvTWFwID0gbW9uZ29IYW5kbGUubW9uZ29NYXBzW21vZGVsbmFtZV07XHJcbiAgICBkZWJ1Z2xvZygoKT0+ICdoZXJlIHRoZSBtb25nb21hcCcgKyBKU09OLnN0cmluZ2lmeShtb25nb01hcCx1bmRlZmluZWQsMikpO1xyXG4gICAgdmFyIHAgPSBjaGVja01vZGVsTW9uZ29NYXAobW9kZWwsbW9kZWxuYW1lLCBtb25nb01hcCk7XHJcbiAgICBkZWJ1Z2xvZygoKT0+YCBoZXJlIHRoZSBtb2RlbG1hcCBmb3IgJHtkb21haW59IGlzICR7SlNPTi5zdHJpbmdpZnkobW9uZ29NYXAsdW5kZWZpbmVkLDIpfWApO1xyXG4gICAgLy8gMSkgcHJvZHVjZSB0aGUgZmxhdHRlbmVkIHJlY29yZHNcclxuICAgIHZhciByZXMgPSBNb25nb01hcC51bndpbmRzRm9yTm9udGVybWluYWxBcnJheXMobW9uZ29NYXApO1xyXG4gICAgZGVidWdsb2coKCk9PidoZXJlIHRoZSB1bndpbmQgc3RhdGVtZW50ICcgKyBKU09OLnN0cmluZ2lmeShyZXMsdW5kZWZpbmVkLDIpKTtcclxuICAgIC8vIHdlIGhhdmUgdG8gdW53aW5kIGFsbCBjb21tb24gbm9uLXRlcm1pbmFsIGNvbGxlY3Rpb25zLlxyXG4gICAgZGVidWdsb2coKCk9PidoZXJlIHRoZSBtb2RlbCAnICsgbW9kZWwubW9kZWxuYW1lKTtcclxuICAgIHZhciBjYXRlZ29yaWVzID0gZ2V0Q2F0ZWdvcmllc0ZvckRvbWFpbih0aGVNb2RlbCwgZG9tYWluKTtcclxuICAgIGRlYnVnbG9nKCgpPT5gaGVyZSBjYXRlZ29yaWVzIGZvciAke2RvbWFpbn0gJHtjYXRlZ29yaWVzLmpvaW4oJzsnKX1gKTtcclxuICAgIGlmKHJlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXR1cm4gbW9kZWwuZmluZCh7fSkudGhlbigoIHVud291bmQgOiBhbnlbXSkgPT4ge1xyXG4gICAgICAgICAgICBkZWJ1Z2xvZygoKT0+J2hlcmUgcmVzJyArIEpTT04uc3RyaW5naWZ5KHVud291bmQpKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZpbHRlclJlbWFwQ2F0ZWdvcmllcyhtb25nb01hcCwgY2F0ZWdvcmllcywgdW53b3VuZClcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiBtb2RlbC5hZ2dyZWdhdGUocmVzKS50aGVuKCB1bndvdW5kID0+IHtcclxuICAgICAgICAvLyBmaWx0ZXIgZm9yIGFnZ3JlZ2F0ZVxyXG4gICAgICAgIGRlYnVnbG9nKCgpPT4naGVyZSByZXMnICsgSlNPTi5zdHJpbmdpZnkodW53b3VuZCkpO1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXJSZW1hcENhdGVnb3JpZXMobW9uZ29NYXAsIGNhdGVnb3JpZXMsIHVud291bmQpXHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHBhbmRlZFJlY29yZHNGb3JDYXRlZ29yeSh0aGVNb2RlbCA6IElNYXRjaC5JTW9kZWxzLGRvbWFpbiA6IHN0cmluZyxjYXRlZ29yeSA6IHN0cmluZykgOiBQcm9taXNlPHsgW2tleSA6IHN0cmluZ10gOiBhbnl9PiB7XHJcbiAgICB2YXIgbW9uZ29IYW5kbGUgPSB0aGVNb2RlbC5tb25nb0hhbmRsZTtcclxuICAgIHZhciBtb2RlbG5hbWUgPSBnZXRNb2RlbE5hbWVGb3JEb21haW4odGhlTW9kZWwubW9uZ29IYW5kbGUsIGRvbWFpbik7XHJcbiAgICBkZWJ1Z2xvZygoKT0+YCBtb2RlbG5hbWUgZm9yICR7ZG9tYWlufSBpcyAke21vZGVsbmFtZX1gKTtcclxuICAgIC8vZGVidWdsb2coKCkgPT4gYGhlcmUgbW9kZWxzICR7bW9kZWxuYW1lfSBgICsgbW9uZ29IYW5kbGUuc3JjSGFuZGxlLm1vZGVsTmFtZXMoKS5qb2luKCc7JykpO1xyXG4gICAgdmFyIG1vZGVsID0gbW9uZ29IYW5kbGUuc3JjSGFuZGxlLm1vZGVsKG1vZGVsbmFtZSk7XHJcbiAgICB2YXIgbW9uZ29NYXAgPSBtb25nb0hhbmRsZS5tb25nb01hcHNbbW9kZWxuYW1lXTtcclxuICAgIGRlYnVnbG9nKCgpPT4gJ2hlcmUgdGhlIG1vbmdvbWFwJyArIEpTT04uc3RyaW5naWZ5KG1vbmdvTWFwLHVuZGVmaW5lZCwyKSk7XHJcbiAgICBjaGVja01vZGVsTW9uZ29NYXAobW9kZWwsbW9kZWxuYW1lLCBtb25nb01hcCxjYXRlZ29yeSk7XHJcbiAgICBkZWJ1Z2xvZygoKT0+YCBoZXJlIHRoZSBtb2RlbG1hcCBmb3IgJHtkb21haW59IGlzICR7SlNPTi5zdHJpbmdpZnkobW9uZ29NYXAsdW5kZWZpbmVkLDIpfWApO1xyXG4gICAgLy8gMSkgcHJvZHVjZSB0aGUgZmxhdHRlbmVkIHJlY29yZHNcclxuICAgIHZhciByZXMgPSBNb25nb01hcC51bndpbmRzRm9yTm9udGVybWluYWxBcnJheXMobW9uZ29NYXApO1xyXG4gICAgZGVidWdsb2coKCk9PidoZXJlIHRoZSB1bndpbmQgc3RhdGVtZW50ICcgKyBKU09OLnN0cmluZ2lmeShyZXMsdW5kZWZpbmVkLDIpKTtcclxuICAgIC8vIHdlIGhhdmUgdG8gdW53aW5kIGFsbCBjb21tb24gbm9uLXRlcm1pbmFsIGNvbGxlY3Rpb25zLlxyXG4gICAgZGVidWdsb2coKCk9PidoZXJlIHRoZSBtb2RlbCAnICsgbW9kZWwubW9kZWxuYW1lKTtcclxuICAgIGlmKHJlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXR1cm4gbW9kZWwuZmluZCh7fSkudGhlbigoIHVud291bmQgOiBhbnlbXSkgPT4ge1xyXG4gICAgICAgICAgICBkZWJ1Z2xvZygoKT0+J2hlcmUgcmVzJyArIEpTT04uc3RyaW5naWZ5KHVud291bmQpKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZpbHRlclJlbWFwQ2F0ZWdvcmllcyhtb25nb01hcCwgW2NhdGVnb3J5XSwgdW53b3VuZClcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiBtb2RlbC5hZ2dyZWdhdGUocmVzKS50aGVuKCB1bndvdW5kID0+IHtcclxuICAgICAgICAvLyBmaWx0ZXIgZm9yIGFnZ3JlZ2F0ZVxyXG4gICAgICAgIGRlYnVnbG9nKCgpPT4naGVyZSByZXMnICsgSlNPTi5zdHJpbmdpZnkodW53b3VuZCkpO1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXJSZW1hcENhdGVnb3JpZXMobW9uZ29NYXAsIFtjYXRlZ29yeV0sIHVud291bmQpXHJcbiAgICB9KTtcclxufVxyXG4vLyBnZXQgc3lub255bXNcclxuLy8gZGIuY29zbW9zLmZpbmQoIHsgXCJfc3lub255bXMuMFwiOiB7ICRleGlzdHM6IHRydWUgfX0pLmxlbmd0aCgpXHJcblxyXG4vKipcclxuICogXHJcbiAqIEBwYXJhbSBtb25nb0hhbmRsZVxyXG4gKiBAcGFyYW0gbW9kZWxuYW1lIFxyXG4gKiBAcGFyYW0gY2F0ZWdvcnkgXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGlzdGluY3RWYWx1ZXMobW9uZ29IYW5kbGU6IElNYXRjaC5JTW9kZWxIYW5kbGVSYXcsIG1vZGVsbmFtZTogc3RyaW5nLCBjYXRlZ29yeTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gICAgZGVidWdsb2coKCkgPT4gYGhlcmUgbW9kZWxzICR7bW9kZWxuYW1lfSAgb2YgYWxsOmAgKyBtb25nb0hhbmRsZS5zcmNIYW5kbGUubW9kZWxOYW1lcygpLmpvaW4oJzsnKSk7XHJcbiAgICB2YXIgbW9kZWwgPSBtb25nb0hhbmRsZS5zcmNIYW5kbGUubW9kZWwobW9kZWxuYW1lKTtcclxuICAgIHZhciBtb25nb01hcCA9IG1vbmdvSGFuZGxlLm1vbmdvTWFwc1ttb2RlbG5hbWVdO1xyXG4gICAgY2hlY2tNb2RlbE1vbmdvTWFwKG1vZGVsLG1vZGVsbmFtZSwgbW9uZ29NYXAsY2F0ZWdvcnkpO1xyXG4gICAgZGVidWdsb2coJyBoZXJlIHBhdGggZm9yIGRpc3RpbmN0IHZhbHVlIFxcXCInICsgbW9kZWxuYW1lICsgJyBcXFwiJyArIG1vbmdvTWFwW2NhdGVnb3J5XS5mdWxscGF0aCAgKyBcIlxcXCJcIik7XHJcbiAgICByZXR1cm4gbW9kZWwuZGlzdGluY3RGbGF0KG1vbmdvTWFwW2NhdGVnb3J5XSkudGhlbihyZXMgPT4ge1xyXG4gICAgICAgIGRlYnVnbG9nKCgpID0+IGAgaGVyZSByZXMgZm9yIFwiJHttb2RlbG5hbWV9XCIgOiBcIiR7Y2F0ZWdvcnl9XCIgdmFsdWVzIGAgKyBKU09OLnN0cmluZ2lmeShyZXMsIHVuZGVmaW5lZCwgMikpO1xyXG4gICAgICAgIHJldHVybiByZXM7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldENhdGVnb3J5UmVjKG1vbmdvSGFuZGxlOiBJTWF0Y2guSU1vZGVsSGFuZGxlUmF3LCBtb2RlbG5hbWU6IHN0cmluZywgY2F0ZWdvcnk6IHN0cmluZyk6IElNYXRjaC5JTW9kZWxDYXRlZ29yeVJlY1xyXG57XHJcbiAgICB2YXIgY2F0ZWdvcmllcyA9IG1vbmdvSGFuZGxlLm1vZGVsRG9jc1ttb2RlbG5hbWVdLl9jYXRlZ29yaWVzO1xyXG4gICAgdmFyIGZpbHRlcmVkID0gY2F0ZWdvcmllcy5maWx0ZXIoIHggPT4geC5jYXRlZ29yeSA9PSBjYXRlZ29yeSApO1xyXG4gICAgLy8gd2Ugd2FudCB0byBhbWVudCB0aGUgdHlwZSFcclxuICAgIGlmICggZmlsdGVyZWQubGVuZ3RoICE9IDEgKVxyXG4gICAge1xyXG5cclxuICAgICAgICBkZWJ1Z2YoICcgZGlkIG5vdCBmaW5kICcgKyBtb2RlbG5hbWUgKyAnICBjYXRlZ29yeSAgJyArIGNhdGVnb3J5ICsgJyBpbiAgJyArIEpTT04uc3RyaW5naWZ5KGNhdGVnb3JpZXMpICk7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoJ2NhdGVnb3J5IG5vdCBmb3VuZCAnICsgY2F0ZWdvcnkgKyBcIiBcIiArIEpTT04uc3RyaW5naWZ5KGNhdGVnb3JpZXMpICk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmlsdGVyZWRbMF07XHJcbn1cclxuXHJcblxyXG5cclxuY29uc3QgQVJSX01PREVMX1BST1BFUlRJRVMgPSBbXCJkb21haW5cIiwgXCJiaXRpbmRleFwiLCBcImRlZmF1bHRrZXljb2x1bW5cIiwgXCJkZWZhdWx0dXJpXCIsIFwiY2F0ZWdvcnlEZXNjcmliZWRcIiwgXCJjb2x1bW5zXCIsIFwiZGVzY3JpcHRpb25cIiwgXCJ0b29sXCIsIFwidG9vbGhpZGRlblwiLCBcInN5bm9ueW1zXCIsIFwiY2F0ZWdvcnlcIiwgXCJ3b3JkaW5kZXhcIiwgXCJleGFjdG1hdGNoXCIsIFwiaGlkZGVuXCJdO1xyXG5cclxuZnVuY3Rpb24gYWRkU3lub255bXMoc3lub255bXM6IHN0cmluZ1tdLCBjYXRlZ29yeTogc3RyaW5nLCBzeW5vbnltRm9yOiBzdHJpbmcsIGJpdGluZGV4OiBudW1iZXIsIGJpdFNlbnRlbmNlQW5kLFxyXG4gICAgd29yZFR5cGU6IHN0cmluZyxcclxuICAgIG1SdWxlczogQXJyYXk8SU1hdGNoLm1SdWxlPiwgc2VlbjogeyBba2V5OiBzdHJpbmddOiBJTWF0Y2gubVJ1bGVbXSB9KSB7XHJcbiAgICBzeW5vbnltcy5mb3JFYWNoKGZ1bmN0aW9uIChzeW4pIHtcclxuICAgICAgICB2YXIgb1J1bGUgPSB7XHJcbiAgICAgICAgICAgIGNhdGVnb3J5OiBjYXRlZ29yeSxcclxuICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogc3lub255bUZvcixcclxuICAgICAgICAgICAgdHlwZTogSU1hdGNoLkVudW1SdWxlVHlwZS5XT1JELFxyXG4gICAgICAgICAgICB3b3JkOiBzeW4sXHJcbiAgICAgICAgICAgIGJpdGluZGV4OiBiaXRpbmRleCxcclxuICAgICAgICAgICAgYml0U2VudGVuY2VBbmQ6IGJpdFNlbnRlbmNlQW5kLFxyXG4gICAgICAgICAgICB3b3JkVHlwZTogd29yZFR5cGUsXHJcbiAgICAgICAgICAgIF9yYW5raW5nOiAwLjk1XHJcbiAgICAgICAgfTtcclxuICAgICAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKFwiaW5zZXJ0aW5nIHN5bm9ueW1cIiArIEpTT04uc3RyaW5naWZ5KG9SdWxlKSkgOiAnLScpO1xyXG4gICAgICAgIGluc2VydFJ1bGVJZk5vdFByZXNlbnQobVJ1bGVzLCBvUnVsZSwgc2Vlbik7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0UnVsZUtleShydWxlKSB7XHJcbiAgICB2YXIgcjEgPSBydWxlLm1hdGNoZWRTdHJpbmcgKyBcIi18LVwiICsgcnVsZS5jYXRlZ29yeSArIFwiIC18LSBcIiArIHJ1bGUudHlwZSArIFwiIC18LSBcIiArIHJ1bGUud29yZCArIFwiIFwiICsgcnVsZS5iaXRpbmRleCArIFwiIFwiICsgcnVsZS53b3JkVHlwZTtcclxuICAgIGlmIChydWxlLnJhbmdlKSB7XHJcbiAgICAgICAgdmFyIHIyID0gZ2V0UnVsZUtleShydWxlLnJhbmdlLnJ1bGUpO1xyXG4gICAgICAgIHIxICs9IFwiIC18LSBcIiArIHJ1bGUucmFuZ2UubG93ICsgXCIvXCIgKyBydWxlLnJhbmdlLmhpZ2ggKyBcIiAtfC0gXCIgKyByMjtcclxuICAgIH1cclxuICAgIHJldHVybiByMTtcclxufVxyXG5cclxuXHJcbmltcG9ydCAqIGFzIEJyZWFrZG93biBmcm9tICcuLi9tYXRjaC9icmVha2Rvd24nO1xyXG5cclxuLyogZ2l2ZW4gYSBydWxlIHdoaWNoIHJlcHJlc2VudHMgYSB3b3JkIHNlcXVlbmNlIHdoaWNoIGlzIHNwbGl0IGR1cmluZyB0b2tlbml6YXRpb24gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGFkZEJlc3RTcGxpdChtUnVsZXM6IEFycmF5PElNYXRjaC5tUnVsZT4sIHJ1bGU6IElNYXRjaC5tUnVsZSwgc2VlblJ1bGVzOiB7IFtrZXk6IHN0cmluZ106IElNYXRjaC5tUnVsZVtdIH0pIHtcclxuICAgIC8vaWYoIWdsb2JhbF9BZGRTcGxpdHMpIHtcclxuICAgIC8vICAgIHJldHVybjtcclxuICAgIC8vfVxyXG5cclxuICAgIGlmIChydWxlLnR5cGUgIT09IElNYXRjaC5FbnVtUnVsZVR5cGUuV09SRCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHZhciBiZXN0ID0gQnJlYWtkb3duLm1ha2VNYXRjaFBhdHRlcm4ocnVsZS5sb3dlcmNhc2V3b3JkKTtcclxuICAgIGlmICghYmVzdCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHZhciBuZXdSdWxlID0ge1xyXG4gICAgICAgIGNhdGVnb3J5OiBydWxlLmNhdGVnb3J5LFxyXG4gICAgICAgIG1hdGNoZWRTdHJpbmc6IHJ1bGUubWF0Y2hlZFN0cmluZyxcclxuICAgICAgICBiaXRpbmRleDogcnVsZS5iaXRpbmRleCxcclxuICAgICAgICBiaXRTZW50ZW5jZUFuZDogcnVsZS5iaXRpbmRleCxcclxuICAgICAgICB3b3JkVHlwZTogcnVsZS53b3JkVHlwZSxcclxuICAgICAgICB3b3JkOiBiZXN0Lmxvbmdlc3RUb2tlbixcclxuICAgICAgICB0eXBlOiAwLFxyXG4gICAgICAgIGxvd2VyY2FzZXdvcmQ6IGJlc3QubG9uZ2VzdFRva2VuLFxyXG4gICAgICAgIF9yYW5raW5nOiAwLjk1LFxyXG4gICAgICAgIC8vICAgIGV4YWN0T25seSA6IHJ1bGUuZXhhY3RPbmx5LFxyXG4gICAgICAgIHJhbmdlOiBiZXN0LnNwYW5cclxuICAgIH0gYXMgSU1hdGNoLm1SdWxlO1xyXG4gICAgaWYgKHJ1bGUuZXhhY3RPbmx5KSB7XHJcbiAgICAgICAgbmV3UnVsZS5leGFjdE9ubHkgPSBydWxlLmV4YWN0T25seVxyXG4gICAgfTtcclxuICAgIG5ld1J1bGUucmFuZ2UucnVsZSA9IHJ1bGU7XHJcbiAgICBpbnNlcnRSdWxlSWZOb3RQcmVzZW50KG1SdWxlcywgbmV3UnVsZSwgc2VlblJ1bGVzKTtcclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIGluc2VydFJ1bGVJZk5vdFByZXNlbnQobVJ1bGVzOiBBcnJheTxJTWF0Y2gubVJ1bGU+LCBydWxlOiBJTWF0Y2gubVJ1bGUsXHJcbiAgICBzZWVuUnVsZXM6IHsgW2tleTogc3RyaW5nXTogSU1hdGNoLm1SdWxlW10gfSkge1xyXG5cclxuICAgIGlmIChydWxlLnR5cGUgIT09IElNYXRjaC5FbnVtUnVsZVR5cGUuV09SRCkge1xyXG4gICAgICAgIGRlYnVnbG9nKCdub3QgYSAgd29yZCByZXR1cm4gZmFzdCAnKyBydWxlLm1hdGNoZWRTdHJpbmcpO1xyXG4gICAgICAgIG1SdWxlcy5wdXNoKHJ1bGUpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGlmICgocnVsZS53b3JkID09PSB1bmRlZmluZWQpIHx8IChydWxlLm1hdGNoZWRTdHJpbmcgPT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2lsbGVnYWwgcnVsZScgKyBKU09OLnN0cmluZ2lmeShydWxlLCB1bmRlZmluZWQsIDIpKTtcclxuICAgIH1cclxuICAgIHZhciByID0gZ2V0UnVsZUtleShydWxlKTtcclxuICAgIC8qIGlmKCAocnVsZS53b3JkID09PSBcInNlcnZpY2VcIiB8fCBydWxlLndvcmQ9PT0gXCJzZXJ2aWNlc1wiKSAmJiByLmluZGV4T2YoJ09EYXRhJykgPj0gMCkge1xyXG4gICAgICAgICBjb25zb2xlLmxvZyhcInJ1bGVrZXkgaXNcIiArIHIpO1xyXG4gICAgICAgICBjb25zb2xlLmxvZyhcInByZXNlbmNlIGlzIFwiICsgSlNPTi5zdHJpbmdpZnkoc2VlblJ1bGVzW3JdKSk7XHJcbiAgICAgfSovXHJcbiAgICBydWxlLmxvd2VyY2FzZXdvcmQgPSBydWxlLndvcmQudG9Mb3dlckNhc2UoKTtcclxuICAgIGlmIChzZWVuUnVsZXNbcl0pIHtcclxuICAgICAgICBkZWJ1Z2xvZygoKSA9PiAoXCJBdHRlbXB0aW5nIHRvIGluc2VydCBkdXBsaWNhdGVcIiArIEpTT04uc3RyaW5naWZ5KHJ1bGUsIHVuZGVmaW5lZCwgMikgKyBcIiA6IFwiICsgcikpO1xyXG4gICAgICAgIHZhciBkdXBsaWNhdGVzID0gc2VlblJ1bGVzW3JdLmZpbHRlcihmdW5jdGlvbiAob0VudHJ5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAwID09PSBJbnB1dEZpbHRlclJ1bGVzLmNvbXBhcmVNUnVsZUZ1bGwob0VudHJ5LCBydWxlKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBpZiAoZHVwbGljYXRlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBzZWVuUnVsZXNbcl0gPSAoc2VlblJ1bGVzW3JdIHx8IFtdKTtcclxuICAgIHNlZW5SdWxlc1tyXS5wdXNoKHJ1bGUpO1xyXG4gICAgaWYgKHJ1bGUud29yZCA9PT0gXCJcIikge1xyXG4gICAgICAgIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyAoJ1NraXBwaW5nIHJ1bGUgd2l0aCBlbXRweSB3b3JkICcgKyBKU09OLnN0cmluZ2lmeShydWxlLCB1bmRlZmluZWQsIDIpKSA6ICctJyk7XHJcbiAgICAgICAgLy9nKCdTa2lwcGluZyBydWxlIHdpdGggZW10cHkgd29yZCAnICsgSlNPTi5zdHJpbmdpZnkocnVsZSwgdW5kZWZpbmVkLCAyKSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgbVJ1bGVzLnB1c2gocnVsZSk7XHJcbiAgICBhZGRCZXN0U3BsaXQobVJ1bGVzLCBydWxlLCBzZWVuUnVsZXMpO1xyXG4gICAgcmV0dXJuO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVhZEZpbGVBc0pTT04oZmlsZW5hbWU6IHN0cmluZyk6IGFueSB7XHJcbiAgICB2YXIgZGF0YSA9IGZzLnJlYWRGaWxlU3luYyhmaWxlbmFtZSwgJ3V0Zi04Jyk7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKGRhdGEpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiQ29udGVudCBvZiBmaWxlIFwiICsgZmlsZW5hbWUgKyBcIiBpcyBubyBqc29uXCIgKyBlKTtcclxuICAgICAgICBwcm9jZXNzLnN0ZG91dC5vbignZHJhaW4nLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcHJvY2Vzcy5leGl0KC0xKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAvL3Byb2Nlc3MuZXhpdCgtMSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaGFzUnVsZVdpdGhGYWN0KG1SdWxlcyA6IElNYXRjaC5tUnVsZVtdLCBmYWN0OiBzdHJpbmcsIGNhdGVnb3J5OiBzdHJpbmcsIGJpdGluZGV4OiBudW1iZXIpIHtcclxuICAgIC8vIFRPRE8gQkFEIFFVQURSQVRJQ1xyXG4gICAgcmV0dXJuIG1SdWxlcy5maW5kKCBydWxlID0+IHtcclxuICAgICAgICByZXR1cm4gcnVsZS53b3JkID09PSBmYWN0ICYmIHJ1bGUuY2F0ZWdvcnkgPT09IGNhdGVnb3J5ICYmIHJ1bGUuYml0aW5kZXggPT09IGJpdGluZGV4XHJcbiAgICB9KSAhPT0gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBsb2FkTW9kZWxEYXRhTW9uZ28obW9kZWxIYW5kbGU6IElNYXRjaC5JTW9kZWxIYW5kbGVSYXcsIG9NZGw6IElNb2RlbCwgc01vZGVsTmFtZTogc3RyaW5nLCBvTW9kZWw6IElNYXRjaC5JTW9kZWxzKTogUHJvbWlzZTxhbnk+IHtcclxuICAgIC8vIHJlYWQgdGhlIGRhdGEgLT5cclxuICAgIC8vIGRhdGEgaXMgcHJvY2Vzc2VkIGludG8gbVJ1bGVzIGRpcmVjdGx5XHJcblxyXG4gICAgdmFyIGJpdGluZGV4ID0gb01kbC5iaXRpbmRleDtcclxuICAgIHJldHVybiBQcm9taXNlLmFsbChtb2RlbEhhbmRsZS5tb2RlbERvY3Nbc01vZGVsTmFtZV0uX2NhdGVnb3JpZXMubWFwKFxyXG4gICAgICAgIGNhdGVnb3J5UmVjID0+IHtcclxuICAgICAgICAgICAgdmFyIGNhdGVnb3J5ID0gY2F0ZWdvcnlSZWMuY2F0ZWdvcnk7XHJcbiAgICAgICAgICAgIHZhciB3b3JkaW5kZXggPSBjYXRlZ29yeVJlYy53b3JkaW5kZXg7XHJcbiAgICAgICAgICAgIGlmICghd29yZGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZyggKCk9PiAnICAnICsgc01vZGVsTmFtZSArICcgJyArICBjYXRlZ29yeSArICcgaXMgbm90IHdvcmQgaW5kZXhlZCEnICk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZGVidWdsb2coKCkgPT4gJ2FkZGluZyB2YWx1ZXMgZm9yICcgKyBzTW9kZWxOYW1lICsgJyAnICsgIGNhdGVnb3J5KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBnZXREaXN0aW5jdFZhbHVlcyhtb2RlbEhhbmRsZSwgc01vZGVsTmFtZSwgY2F0ZWdvcnkpLnRoZW4oXHJcbiAgICAgICAgICAgICAgICAgICAgKHZhbHVlcykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWJ1Z2xvZyhgZm91bmQgJHt2YWx1ZXMubGVuZ3RofSB2YWx1ZXMgZm9yICR7c01vZGVsTmFtZX0gJHtjYXRlZ29yeX0gYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcy5tYXAodmFsdWUgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNTdHJpbmcgPSBcIlwiICsgdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1Z2xvZygoKSA9PiBcInB1c2hpbmcgcnVsZSB3aXRoIFwiICsgY2F0ZWdvcnkgKyBcIiAtPiBcIiArIHNTdHJpbmcgKyAnICcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9SdWxlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiBjYXRlZ29yeSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBzU3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IElNYXRjaC5FbnVtUnVsZVR5cGUuV09SRCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JkOiBzU3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJpdGluZGV4OiBiaXRpbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiaXRTZW50ZW5jZUFuZDogYml0aW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhhY3RPbmx5OiBjYXRlZ29yeVJlYy5leGFjdG1hdGNoIHx8IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmRUeXBlOiBJTWF0Y2guV09SRFRZUEUuRkFDVCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfcmFua2luZzogMC45NVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBhcyBJTWF0Y2gubVJ1bGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnRSdWxlSWZOb3RQcmVzZW50KG9Nb2RlbC5tUnVsZXMsIG9SdWxlLCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgIGlmIChvTWRsRGF0YS5zeW5vbnltcyAmJiBvTWRsRGF0YS5zeW5vbnltc1tjYXRlZ29yeV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJob3cgY2FuIHRoaXMgaGFwcGVuP1wiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vYWRkU3lub255bXMob01kbERhdGEuc3lub255bXNbY2F0ZWdvcnldLCBjYXRlZ29yeSwgc1N0cmluZywgYml0aW5kZXgsIGJpdGluZGV4LCBcIlhcIiwgb01vZGVsLm1SdWxlcywgb01vZGVsLnNlZW5SdWxlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhIHN5bm9ueW0gZm9yIGEgRkFDVFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgaWYgKG9FbnRyeS5zeW5vbnltcyAmJiBvRW50cnkuc3lub255bXNbY2F0ZWdvcnldKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIGFkZFN5bm9ueW1zKG9FbnRyeS5zeW5vbnltc1tjYXRlZ29yeV0sIGNhdGVnb3J5LCBzU3RyaW5nLCBiaXRpbmRleCwgYml0aW5kZXgsIElNYXRjaC5XT1JEVFlQRS5GQUNULCBvTW9kZWwubVJ1bGVzLCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG4gICAgKS50aGVuKFxyXG4gICAgICAgICgpID0+ICBnZXRGYWN0U3lub255bXMobW9kZWxIYW5kbGUsIHNNb2RlbE5hbWUpXHJcbiAgICApLnRoZW4oKHN5bm9ueW1WYWx1ZXMgOiBhbnkpID0+IHtcclxuICAgICAgICBzeW5vbnltVmFsdWVzLmZvckVhY2goKHN5bm9ueW1SZWMpID0+IHtcclxuICAgICAgICBpZiAoIWhhc1J1bGVXaXRoRmFjdChvTW9kZWwubVJ1bGVzLCBzeW5vbnltUmVjLmZhY3QsIHN5bm9ueW1SZWMuY2F0ZWdvcnksIGJpdGluZGV4KSkge1xyXG4gICAgICAgICAgICBkZWJ1Z2xvZygoKSA9PkpTT04uc3RyaW5naWZ5KG9Nb2RlbC5tUnVsZXMsdW5kZWZpbmVkLDIpKTtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoYE9ycGhhbmVkIHN5bm9ueW0gd2l0aG91dCBiYXNlIGluIGRhdGE/XFxuYFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgKGNoZWNrIHR5cG9zIGFuZCB0aGF0IGNhdGVnb3J5IGlzIHdvcmRpbmRleGVkISkgZmFjdDogJyR7c3lub255bVJlYy5mYWN0fSc7ICBjYXRlZ29yeTogXCIke3N5bm9ueW1SZWMuY2F0ZWdvcnl9XCIgICBgICArIEpTT04uc3RyaW5naWZ5KHN5bm9ueW1SZWMpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBhZGRTeW5vbnltcyhzeW5vbnltUmVjLnN5bm9ueW1zLCBzeW5vbnltUmVjLmNhdGVnb3J5LCBzeW5vbnltUmVjLmZhY3QsIGJpdGluZGV4LCBiaXRpbmRleCwgSU1hdGNoLldPUkRUWVBFLkZBQ1QsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb01vZGVsLm1SdWxlcywgb01vZGVsLnNlZW5SdWxlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsb2FkTW9kZWwobW9kZWxIYW5kbGU6IElNYXRjaC5JTW9kZWxIYW5kbGVSYXcsIHNNb2RlbE5hbWU6IHN0cmluZywgb01vZGVsOiBJTWF0Y2guSU1vZGVscyk6IFByb21pc2U8YW55PiB7XHJcbiAgICBkZWJ1Z2xvZyhcIiBsb2FkaW5nIFwiICsgc01vZGVsTmFtZSArIFwiIC4uLi5cIik7XHJcbiAgICAvL3ZhciBvTWRsID0gcmVhZEZpbGVBc0pTT04oJy4vJyArIG1vZGVsUGF0aCArICcvJyArIHNNb2RlbE5hbWUgKyBcIi5tb2RlbC5qc29uXCIpIGFzIElNb2RlbDtcclxuICAgIHZhciBvTWRsID0gbWFrZU1kbE1vbmdvKG1vZGVsSGFuZGxlLCBzTW9kZWxOYW1lLCBvTW9kZWwpO1xyXG4gICAgcmV0dXJuIGxvYWRNb2RlbERhdGFNb25nbyhtb2RlbEhhbmRsZSwgb01kbCwgc01vZGVsTmFtZSwgb01vZGVsKTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxEb21haW5zQml0SW5kZXgob01vZGVsOiBJTWF0Y2guSU1vZGVscyk6IG51bWJlciB7XHJcbiAgICB2YXIgbGVuID0gb01vZGVsLmRvbWFpbnMubGVuZ3RoO1xyXG4gICAgdmFyIHJlcyA9IDA7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XHJcbiAgICAgICAgcmVzID0gcmVzIDw8IDE7XHJcbiAgICAgICAgcmVzID0gcmVzIHwgMHgwMDAxO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldERvbWFpbkJpdEluZGV4KGRvbWFpbjogc3RyaW5nLCBvTW9kZWw6IElNYXRjaC5JTW9kZWxzKTogbnVtYmVyIHtcclxuICAgIHZhciBpbmRleCA9IG9Nb2RlbC5kb21haW5zLmluZGV4T2YoZG9tYWluKTtcclxuICAgIGlmIChpbmRleCA8IDApIHtcclxuICAgICAgICBpbmRleCA9IG9Nb2RlbC5kb21haW5zLmxlbmd0aDtcclxuICAgIH1cclxuICAgIGlmIChpbmRleCA+PSAzMikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInRvbyBtYW55IGRvbWFpbiBmb3Igc2luZ2xlIDMyIGJpdCBpbmRleFwiKTtcclxuICAgIH1cclxuICAgIHJldHVybiAweDAwMDEgPDwgaW5kZXg7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXREb21haW5CaXRJbmRleFNhZmUoZG9tYWluOiBzdHJpbmcsIG9Nb2RlbDogSU1hdGNoLklNb2RlbHMpOiBudW1iZXIge1xyXG4gICAgdmFyIGluZGV4ID0gb01vZGVsLmRvbWFpbnMuaW5kZXhPZihkb21haW4pO1xyXG4gICAgaWYgKGluZGV4IDwgMCkge1xyXG4gICAgICAgIHRocm93IEVycm9yKCdleHBlY3RlZCBkb21haW4gJyArIGRvbWFpbiArICcgdG8gYmUgcmVnaXN0ZXJlZD8/PyAnICsgSlNPTi5zdHJpbmdpZnkob01vZGVsLmRvbWFpbnMpKTtcclxuICAgIH1cclxuICAgIGlmIChpbmRleCA+PSAzMikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInRvbyBtYW55IGRvbWFpbiBmb3Igc2luZ2xlIDMyIGJpdCBpbmRleFwiKTtcclxuICAgIH1cclxuICAgIHJldHVybiAweDAwMDEgPDwgaW5kZXg7XHJcbn1cclxuXHJcblxyXG5cclxuLyoqXHJcbiAqIEdpdmVuIGEgYml0ZmllbGQsIHJldHVybiBhbiB1bnNvcnRlZCBzZXQgb2YgZG9tYWlucyBtYXRjaGluZyBwcmVzZW50IGJpdHNcclxuICogQHBhcmFtIG9Nb2RlbFxyXG4gKiBAcGFyYW0gYml0ZmllbGRcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXREb21haW5zRm9yQml0RmllbGQob01vZGVsOiBJTWF0Y2guSU1vZGVscywgYml0ZmllbGQ6IG51bWJlcik6IHN0cmluZ1tdIHtcclxuICAgIHJldHVybiBvTW9kZWwuZG9tYWlucy5maWx0ZXIoZG9tYWluID0+XHJcbiAgICAgICAgKGdldERvbWFpbkJpdEluZGV4KGRvbWFpbiwgb01vZGVsKSAmIGJpdGZpZWxkKVxyXG4gICAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFrZU1kbE1vbmdvKG1vZGVsSGFuZGxlOiBJTWF0Y2guSU1vZGVsSGFuZGxlUmF3LCBzTW9kZWxOYW1lOiBzdHJpbmcsIG9Nb2RlbDogSU1hdGNoLklNb2RlbHMpOiBJTW9kZWwge1xyXG4gICAgdmFyIG1vZGVsRG9jID0gbW9kZWxIYW5kbGUubW9kZWxEb2NzW3NNb2RlbE5hbWVdO1xyXG4gICAgdmFyIG9NZGwgPSB7XHJcbiAgICAgICAgYml0aW5kZXg6IGdldERvbWFpbkJpdEluZGV4U2FmZShtb2RlbERvYy5kb21haW4sIG9Nb2RlbCksXHJcbiAgICAgICAgZG9tYWluOiBtb2RlbERvYy5kb21haW4sXHJcbiAgICAgICAgbW9kZWxuYW1lOiBzTW9kZWxOYW1lLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBtb2RlbERvYy5kb21haW5fZGVzY3JpcHRpb25cclxuICAgIH0gYXMgSU1vZGVsO1xyXG4gICAgdmFyIGNhdGVnb3J5RGVzY3JpYmVkTWFwID0ge30gYXMgeyBba2V5OiBzdHJpbmddOiBJTWF0Y2guSUNhdGVnb3J5RGVzYyB9O1xyXG5cclxuICAgIG9NZGwuYml0aW5kZXggPSBnZXREb21haW5CaXRJbmRleFNhZmUobW9kZWxEb2MuZG9tYWluLCBvTW9kZWwpO1xyXG4gICAgb01kbC5jYXRlZ29yeSA9IG1vZGVsRG9jLl9jYXRlZ29yaWVzLm1hcChjYXQgPT4gY2F0LmNhdGVnb3J5KTtcclxuICAgIG9NZGwuY2F0ZWdvcnlEZXNjcmliZWQgPSBbXTtcclxuICAgIG1vZGVsRG9jLl9jYXRlZ29yaWVzLmZvckVhY2goY2F0ID0+IHtcclxuICAgICAgICBvTWRsLmNhdGVnb3J5RGVzY3JpYmVkLnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBjYXQuY2F0ZWdvcnksXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBjYXQuY2F0ZWdvcnlfZGVzY3JpcHRpb25cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNhdGVnb3J5RGVzY3JpYmVkTWFwW2NhdC5jYXRlZ29yeV0gPSBjYXQ7XHJcbiAgICB9KTtcclxuXHJcbiAgICBvTWRsLmNhdGVnb3J5ID0gbW9kZWxEb2MuX2NhdGVnb3JpZXMubWFwKGNhdCA9PiBjYXQuY2F0ZWdvcnkpO1xyXG5cclxuICAgIC8qIC8vIHJlY3RpZnkgY2F0ZWdvcnlcclxuICAgICBvTWRsLmNhdGVnb3J5ID0gb01kbC5jYXRlZ29yeS5tYXAoZnVuY3Rpb24gKGNhdDogYW55KSB7XHJcbiAgICAgICAgIGlmICh0eXBlb2YgY2F0ID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICByZXR1cm4gY2F0O1xyXG4gICAgICAgICB9XHJcbiAgICAgICAgIGlmICh0eXBlb2YgY2F0Lm5hbWUgIT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTWlzc2luZyBuYW1lIGluIG9iamVjdCB0eXBlZCBjYXRlZ29yeSBpbiBcIiArIEpTT04uc3RyaW5naWZ5KGNhdCkgKyBcIiBpbiBtb2RlbCBcIiArIHNNb2RlbE5hbWUpO1xyXG4gICAgICAgICAgICAgcHJvY2Vzcy5leGl0KC0xKTtcclxuICAgICAgICAgICAgIC8vdGhyb3cgbmV3IEVycm9yKCdEb21haW4gJyArIG9NZGwuZG9tYWluICsgJyBhbHJlYWR5IGxvYWRlZCB3aGlsZSBsb2FkaW5nICcgKyBzTW9kZWxOYW1lICsgJz8nKTtcclxuICAgICAgICAgfVxyXG4gICAgICAgICBjYXRlZ29yeURlc2NyaWJlZE1hcFtjYXQubmFtZV0gPSBjYXQ7XHJcbiAgICAgICAgIG9NZGwuY2F0ZWdvcnlEZXNjcmliZWQucHVzaChjYXQpO1xyXG4gICAgICAgICByZXR1cm4gY2F0Lm5hbWU7XHJcbiAgICAgfSk7XHJcbiAgICAgKi9cclxuXHJcbiAgICAvLyBhZGQgdGhlIGNhdGVnb3JpZXMgdG8gdGhlIHJ1bGVzXHJcbiAgICBvTWRsLmNhdGVnb3J5LmZvckVhY2goZnVuY3Rpb24gKGNhdGVnb3J5KSB7XHJcbiAgICAgICAgaW5zZXJ0UnVsZUlmTm90UHJlc2VudChvTW9kZWwubVJ1bGVzLCB7XHJcbiAgICAgICAgICAgIGNhdGVnb3J5OiBcImNhdGVnb3J5XCIsXHJcbiAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IGNhdGVnb3J5LFxyXG4gICAgICAgICAgICB0eXBlOiBJTWF0Y2guRW51bVJ1bGVUeXBlLldPUkQsXHJcbiAgICAgICAgICAgIHdvcmQ6IGNhdGVnb3J5LFxyXG4gICAgICAgICAgICBsb3dlcmNhc2V3b3JkOiBjYXRlZ29yeS50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICBiaXRpbmRleDogb01kbC5iaXRpbmRleCxcclxuICAgICAgICAgICAgd29yZFR5cGU6IElNYXRjaC5XT1JEVFlQRS5DQVRFR09SWSxcclxuICAgICAgICAgICAgYml0U2VudGVuY2VBbmQ6IG9NZGwuYml0aW5kZXgsXHJcbiAgICAgICAgICAgIF9yYW5raW5nOiAwLjk1XHJcbiAgICAgICAgfSwgb01vZGVsLnNlZW5SdWxlcyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBhZGQgc3lub25hbnltIGZvciB0aGUgY2F0ZWdvcmllcyB0byB0aGVcclxuXHJcbiAgICBtb2RlbERvYy5fY2F0ZWdvcmllcy5mb3JFYWNoKGNhdCA9PiB7XHJcbiAgICAgICAgYWRkU3lub255bXNcclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAob01vZGVsLmRvbWFpbnMuaW5kZXhPZihvTWRsLmRvbWFpbikgPCAwKSB7XHJcbiAgICAgICAgZGVidWdsb2coXCIqKioqKioqKioqKmhlcmUgbWRsXCIgKyBKU09OLnN0cmluZ2lmeShvTWRsLCB1bmRlZmluZWQsIDIpKTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RvbWFpbiAnICsgb01kbC5kb21haW4gKyAnIGFscmVhZHkgbG9hZGVkIHdoaWxlIGxvYWRpbmcgJyArIHNNb2RlbE5hbWUgKyAnPycpO1xyXG4gICAgfVxyXG4gICAgLypcclxuICAgIC8vIGNoZWNrIHByb3BlcnRpZXMgb2YgbW9kZWxcclxuICAgIE9iamVjdC5rZXlzKG9NZGwpLnNvcnQoKS5mb3JFYWNoKGZ1bmN0aW9uIChzUHJvcGVydHkpIHtcclxuICAgICAgICBpZiAoQVJSX01PREVMX1BST1BFUlRJRVMuaW5kZXhPZihzUHJvcGVydHkpIDwgMCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01vZGVsIHByb3BlcnR5IFwiJyArIHNQcm9wZXJ0eSArICdcIiBub3QgYSBrbm93biBtb2RlbCBwcm9wZXJ0eSBpbiBtb2RlbCBvZiBkb21haW4gJyArIG9NZGwuZG9tYWluICsgJyAnKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgICovXHJcblxyXG4gICAgLy8gY29uc2lkZXIgc3RyZWFtbGluaW5nIHRoZSBjYXRlZ29yaWVzXHJcbiAgICBvTW9kZWwucmF3TW9kZWxzW29NZGwuZG9tYWluXSA9IG9NZGw7XHJcblxyXG4gICAgb01vZGVsLmZ1bGwuZG9tYWluW29NZGwuZG9tYWluXSA9IHtcclxuICAgICAgICBkZXNjcmlwdGlvbjogb01kbC5kZXNjcmlwdGlvbixcclxuICAgICAgICBjYXRlZ29yaWVzOiBjYXRlZ29yeURlc2NyaWJlZE1hcCxcclxuICAgICAgICBiaXRpbmRleDogb01kbC5iaXRpbmRleFxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBjaGVjayB0aGF0XHJcblxyXG5cclxuICAgIC8vIGNoZWNrIHRoYXQgbWVtYmVycyBvZiB3b3JkaW5kZXggYXJlIGluIGNhdGVnb3JpZXMsXHJcbiAgICAvKiBvTWRsLndvcmRpbmRleCA9IG9Nb2RlbERvYy5vTWRsLndvcmRpbmRleCB8fCBbXTtcclxuICAgICBvTWRsLndvcmRpbmRleC5mb3JFYWNoKGZ1bmN0aW9uIChzV29yZEluZGV4KSB7XHJcbiAgICAgICAgIGlmIChvTWRsLmNhdGVnb3J5LmluZGV4T2Yoc1dvcmRJbmRleCkgPCAwKSB7XHJcbiAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01vZGVsIHdvcmRpbmRleCBcIicgKyBzV29yZEluZGV4ICsgJ1wiIG5vdCBhIGNhdGVnb3J5IG9mIGRvbWFpbiAnICsgb01kbC5kb21haW4gKyAnICcpO1xyXG4gICAgICAgICB9XHJcbiAgICAgfSk7XHJcbiAgICAgKi9cclxuICAgIC8qXHJcbiAgICBvTWRsLmV4YWN0bWF0Y2ggPSBvTWRsLmV4YWN0bWF0Y2ggfHwgW107XHJcbiAgICBvTWRsLmV4YWN0bWF0Y2guZm9yRWFjaChmdW5jdGlvbiAoc0V4YWN0TWF0Y2gpIHtcclxuICAgICAgICBpZiAob01kbC5jYXRlZ29yeS5pbmRleE9mKHNFeGFjdE1hdGNoKSA8IDApIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNb2RlbCBleGFjdG1hdGNoIFwiJyArIHNFeGFjdE1hdGNoICsgJ1wiIG5vdCBhIGNhdGVnb3J5IG9mIGRvbWFpbiAnICsgb01kbC5kb21haW4gKyAnICcpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgKi9cclxuICAgIG9NZGwuY29sdW1ucyA9IG1vZGVsRG9jLmNvbHVtbnM7IC8vIG9NZGwuY29sdW1ucyB8fCBbXTtcclxuICAgIG9NZGwuY29sdW1ucy5mb3JFYWNoKGZ1bmN0aW9uIChzRXhhY3RNYXRjaCkge1xyXG4gICAgICAgIGlmIChvTWRsLmNhdGVnb3J5LmluZGV4T2Yoc0V4YWN0TWF0Y2gpIDwgMCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01vZGVsIGNvbHVtbiBcIicgKyBzRXhhY3RNYXRjaCArICdcIiBub3QgYSBjYXRlZ29yeSBvZiBkb21haW4gJyArIG9NZGwuZG9tYWluICsgJyAnKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgLy8gYWRkIHJlbGF0aW9uIGRvbWFpbiAtPiBjYXRlZ29yeVxyXG4gICAgdmFyIGRvbWFpblN0ciA9IE1ldGFGLkRvbWFpbihvTWRsLmRvbWFpbikudG9GdWxsU3RyaW5nKCk7XHJcbiAgICB2YXIgcmVsYXRpb25TdHIgPSBNZXRhRi5SZWxhdGlvbihNZXRhLlJFTEFUSU9OX2hhc0NhdGVnb3J5KS50b0Z1bGxTdHJpbmcoKTtcclxuICAgIHZhciByZXZlcnNlUmVsYXRpb25TdHIgPSBNZXRhRi5SZWxhdGlvbihNZXRhLlJFTEFUSU9OX2lzQ2F0ZWdvcnlPZikudG9GdWxsU3RyaW5nKCk7XHJcbiAgICBvTWRsLmNhdGVnb3J5LmZvckVhY2goZnVuY3Rpb24gKHNDYXRlZ29yeSkge1xyXG5cclxuICAgICAgICB2YXIgQ2F0ZWdvcnlTdHJpbmcgPSBNZXRhRi5DYXRlZ29yeShzQ2F0ZWdvcnkpLnRvRnVsbFN0cmluZygpO1xyXG4gICAgICAgIG9Nb2RlbC5tZXRhLnQzW2RvbWFpblN0cl0gPSBvTW9kZWwubWV0YS50M1tkb21haW5TdHJdIHx8IHt9O1xyXG4gICAgICAgIG9Nb2RlbC5tZXRhLnQzW2RvbWFpblN0cl1bcmVsYXRpb25TdHJdID0gb01vZGVsLm1ldGEudDNbZG9tYWluU3RyXVtyZWxhdGlvblN0cl0gfHwge307XHJcbiAgICAgICAgb01vZGVsLm1ldGEudDNbZG9tYWluU3RyXVtyZWxhdGlvblN0cl1bQ2F0ZWdvcnlTdHJpbmddID0ge307XHJcblxyXG4gICAgICAgIG9Nb2RlbC5tZXRhLnQzW0NhdGVnb3J5U3RyaW5nXSA9IG9Nb2RlbC5tZXRhLnQzW0NhdGVnb3J5U3RyaW5nXSB8fCB7fTtcclxuICAgICAgICBvTW9kZWwubWV0YS50M1tDYXRlZ29yeVN0cmluZ11bcmV2ZXJzZVJlbGF0aW9uU3RyXSA9IG9Nb2RlbC5tZXRhLnQzW0NhdGVnb3J5U3RyaW5nXVtyZXZlcnNlUmVsYXRpb25TdHJdIHx8IHt9O1xyXG4gICAgICAgIG9Nb2RlbC5tZXRhLnQzW0NhdGVnb3J5U3RyaW5nXVtyZXZlcnNlUmVsYXRpb25TdHJdW2RvbWFpblN0cl0gPSB7fTtcclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBhZGQgYSBwcmVjaWNlIGRvbWFpbiBtYXRjaHJ1bGVcclxuICAgIGluc2VydFJ1bGVJZk5vdFByZXNlbnQob01vZGVsLm1SdWxlcywge1xyXG4gICAgICAgIGNhdGVnb3J5OiBcImRvbWFpblwiLFxyXG4gICAgICAgIG1hdGNoZWRTdHJpbmc6IG9NZGwuZG9tYWluLFxyXG4gICAgICAgIHR5cGU6IElNYXRjaC5FbnVtUnVsZVR5cGUuV09SRCxcclxuICAgICAgICB3b3JkOiBvTWRsLmRvbWFpbixcclxuICAgICAgICBiaXRpbmRleDogb01kbC5iaXRpbmRleCxcclxuICAgICAgICBiaXRTZW50ZW5jZUFuZDogb01kbC5iaXRpbmRleCxcclxuICAgICAgICB3b3JkVHlwZTogSU1hdGNoLldPUkRUWVBFLkRPTUFJTixcclxuICAgICAgICBfcmFua2luZzogMC45NVxyXG4gICAgfSwgb01vZGVsLnNlZW5SdWxlcyk7XHJcblxyXG4gICAgLy8gYWRkIGRvbWFpbiBzeW5vbnltc1xyXG4gICAgaWYgKG1vZGVsRG9jLmRvbWFpbl9zeW5vbnltcyAmJiBtb2RlbERvYy5kb21haW5fc3lub255bXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGFkZFN5bm9ueW1zKG1vZGVsRG9jLmRvbWFpbl9zeW5vbnltcywgXCJkb21haW5cIiwgbW9kZWxEb2MuZG9tYWluLCBvTWRsLmJpdGluZGV4LFxyXG4gICAgICAgICAgICBvTWRsLmJpdGluZGV4LCBJTWF0Y2guV09SRFRZUEUuRE9NQUlOLCBvTW9kZWwubVJ1bGVzLCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuICAgICAgICBhZGRTeW5vbnltcyhtb2RlbERvYy5kb21haW5fc3lub255bXMsIFwiZG9tYWluXCIsIG1vZGVsRG9jLmRvbWFpbiwgZ2V0RG9tYWluQml0SW5kZXhTYWZlKERPTUFJTl9NRVRBTU9ERUwsIG9Nb2RlbCksXHJcbiAgICAgICAgICAgICAgICAgIGdldERvbWFpbkJpdEluZGV4U2FmZShET01BSU5fTUVUQU1PREVMLCBvTW9kZWwpLFxyXG4gICAgICAgICAgICAgICAgSU1hdGNoLldPUkRUWVBFLkZBQ1QsIG9Nb2RlbC5tUnVsZXMsIG9Nb2RlbC5zZWVuUnVsZXMpO1xyXG4gICAgICAgIC8vIFRPRE86IHN5bm9ueW0gaGF2ZSB0byBiZSBhZGRlZCBhcyAqRkFDVCogZm9yIHRoZSBtZXRhbW9kZWwhXHJcblxyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAgICAvLyBjaGVjayB0aGUgdG9vbFxyXG4gICAgICAgIGlmIChvTWRsLnRvb2wgJiYgb01kbC50b29sLnJlcXVpcmVzKSB7XHJcbiAgICAgICAgICAgIHZhciByZXF1aXJlcyA9IE9iamVjdC5rZXlzKG9NZGwudG9vbC5yZXF1aXJlcyB8fCB7fSk7XHJcbiAgICAgICAgICAgIHZhciBkaWZmID0gXy5kaWZmZXJlbmNlKHJlcXVpcmVzLCBvTWRsLmNhdGVnb3J5KTtcclxuICAgICAgICAgICAgaWYgKGRpZmYubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAke29NZGwuZG9tYWlufSA6IFVua293biBjYXRlZ29yeSBpbiByZXF1aXJlcyBvZiB0b29sOiBcImAgKyBkaWZmLmpvaW4oJ1wiJykgKyAnXCInKTtcclxuICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgtMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIG9wdGlvbmFsID0gT2JqZWN0LmtleXMob01kbC50b29sLm9wdGlvbmFsKTtcclxuICAgICAgICAgICAgZGlmZiA9IF8uZGlmZmVyZW5jZShvcHRpb25hbCwgb01kbC5jYXRlZ29yeSk7XHJcbiAgICAgICAgICAgIGlmIChkaWZmLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgJHtvTWRsLmRvbWFpbn0gOiBVbmtvd24gY2F0ZWdvcnkgb3B0aW9uYWwgb2YgdG9vbDogXCJgICsgZGlmZi5qb2luKCdcIicpICsgJ1wiJyk7XHJcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoLTEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKG9NZGwudG9vbC5zZXRzIHx8IHt9KS5mb3JFYWNoKGZ1bmN0aW9uIChzZXRJRCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRpZmYgPSBfLmRpZmZlcmVuY2Uob01kbC50b29sLnNldHNbc2V0SURdLnNldCwgb01kbC5jYXRlZ29yeSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGlmZi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAke29NZGwuZG9tYWlufSA6IFVua293biBjYXRlZ29yeSBpbiBzZXRJZCAke3NldElEfSBvZiB0b29sOiBcImAgKyBkaWZmLmpvaW4oJ1wiJykgKyAnXCInKTtcclxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoLTEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIGV4dHJhY3QgdG9vbHMgYW4gYWRkIHRvIHRvb2xzOlxyXG4gICAgICAgICAgICBvTW9kZWwudG9vbHMuZmlsdGVyKGZ1bmN0aW9uIChvRW50cnkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChvRW50cnkubmFtZSA9PT0gKG9NZGwudG9vbCAmJiBvTWRsLnRvb2wubmFtZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRvb2wgXCIgKyBvTWRsLnRvb2wubmFtZSArIFwiIGFscmVhZHkgcHJlc2VudCB3aGVuIGxvYWRpbmcgXCIgKyBzTW9kZWxOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3Rocm93IG5ldyBFcnJvcignRG9tYWluIGFscmVhZHkgbG9hZGVkPycpO1xyXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgtMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG9NZGwudG9vbGhpZGRlbiA9IHRydWU7XHJcbiAgICAgICAgICAgIG9NZGwudG9vbC5yZXF1aXJlcyA9IHsgXCJpbXBvc3NpYmxlXCI6IHt9IH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGFkZCB0aGUgdG9vbCBuYW1lIGFzIHJ1bGUgdW5sZXNzIGhpZGRlblxyXG4gICAgICAgIGlmICghb01kbC50b29saGlkZGVuICYmIG9NZGwudG9vbCAmJiBvTWRsLnRvb2wubmFtZSkge1xyXG4gICAgICAgICAgICBpbnNlcnRSdWxlSWZOb3RQcmVzZW50KG9Nb2RlbC5tUnVsZXMsIHtcclxuICAgICAgICAgICAgICAgIGNhdGVnb3J5OiBcInRvb2xcIixcclxuICAgICAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IG9NZGwudG9vbC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogSU1hdGNoLkVudW1SdWxlVHlwZS5XT1JELFxyXG4gICAgICAgICAgICAgICAgd29yZDogb01kbC50b29sLm5hbWUsXHJcbiAgICAgICAgICAgICAgICBiaXRpbmRleDogb01kbC5iaXRpbmRleCxcclxuICAgICAgICAgICAgICAgIGJpdFNlbnRlbmNlQW5kIDogb01kbC5iaXRpbmRleCxcclxuICAgICAgICAgICAgICAgIHdvcmRUeXBlIDogSU1hdGNoLldPUkRUWVBFLlRPT0wsXHJcbiAgICAgICAgICAgICAgICBfcmFua2luZzogMC45NVxyXG4gICAgICAgICAgICB9LCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmIChvTWRsLnN5bm9ueW1zICYmIG9NZGwuc3lub255bXNbXCJ0b29sXCJdKSB7XHJcbiAgICAgICAgICAgIGFkZFN5bm9ueW1zKG9NZGwuc3lub255bXNbXCJ0b29sXCJdLCBcInRvb2xcIiwgb01kbC50b29sLm5hbWUsIG9NZGwuYml0aW5kZXgsXHJcbiAgICAgICAgICAgIG9NZGwuYml0aW5kZXgsIElNYXRjaC5XT1JEVFlQRS5UT09MLCBvTW9kZWwubVJ1bGVzLCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgICovXHJcblxyXG4gICAgLy8gYWRkIHN5bnNvbnltIGZvciB0aGUgZG9tYWluc1xyXG5cclxuXHJcbiAgICAvLyBhZGQgc3lub255bXMgZm9yIHRoZSBjYXRlZ29yaWVzXHJcblxyXG4gICAgbW9kZWxEb2MuX2NhdGVnb3JpZXMuZm9yRWFjaChjYXQgPT4ge1xyXG4gICAgICAgIGlmIChjYXQuY2F0ZWdvcnlfc3lub255bXMgJiYgY2F0LmNhdGVnb3J5X3N5bm9ueW1zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgaWYgKG9Nb2RlbC5mdWxsLmRvbWFpbltvTWRsLmRvbWFpbl0uY2F0ZWdvcmllc1tjYXQuY2F0ZWdvcnldKSB7XHJcbiAgICAgICAgICAgICAgICBvTW9kZWwuZnVsbC5kb21haW5bb01kbC5kb21haW5dLmNhdGVnb3JpZXNbY2F0LmNhdGVnb3J5XS5jYXRlZ29yeV9zeW5vbnltcyA9IGNhdC5jYXRlZ29yeV9zeW5vbnltcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhZGRTeW5vbnltcyhjYXQuY2F0ZWdvcnlfc3lub255bXMsIFwiY2F0ZWdvcnlcIiwgY2F0LmNhdGVnb3J5LCBvTWRsLmJpdGluZGV4LCBvTWRsLmJpdGluZGV4LFxyXG4gICAgICAgICAgICAgICAgSU1hdGNoLldPUkRUWVBFLkNBVEVHT1JZLCBvTW9kZWwubVJ1bGVzLCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuICAgICAgICAgICAgLy8gYWRkIHN5bm9ueW1zIGludG8gdGhlIG1ldGFtb2RlbCBkb21haW5cclxuICAgICAgICAgICAgYWRkU3lub255bXMoY2F0LmNhdGVnb3J5X3N5bm9ueW1zLCBcImNhdGVnb3J5XCIsIGNhdC5jYXRlZ29yeSwgZ2V0RG9tYWluQml0SW5kZXhTYWZlKERPTUFJTl9NRVRBTU9ERUwsIG9Nb2RlbCksXHJcbiAgICAgICAgICAgICAgICAgIGdldERvbWFpbkJpdEluZGV4U2FmZShET01BSU5fTUVUQU1PREVMLCBvTW9kZWwpLFxyXG4gICAgICAgICAgICAgICAgSU1hdGNoLldPUkRUWVBFLkZBQ1QsIG9Nb2RlbC5tUnVsZXMsIG9Nb2RlbC5zZWVuUnVsZXMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gYWRkIG9wZXJhdG9yc1xyXG5cclxuICAgIC8vIGFkZCBmaWxsZXJzXHJcbiAgICBpZihvTW9kZWwuZG9tYWlucy5pbmRleE9mKG9NZGwuZG9tYWluKSA8IDApIHtcclxuICAgICAgICB0aHJvdyBFcnJvcignbWlzc2luZyBkb21haW4gcmVnaXN0cmF0aW9uIGZvciAnICsgb01kbC5kb21haW4pO1xyXG4gICAgfVxyXG4gICAgLy9vTW9kZWwuZG9tYWlucy5wdXNoKG9NZGwuZG9tYWluKTtcclxuICAgIG9Nb2RlbC5jYXRlZ29yeSA9IG9Nb2RlbC5jYXRlZ29yeS5jb25jYXQob01kbC5jYXRlZ29yeSk7XHJcbiAgICBvTW9kZWwuY2F0ZWdvcnkuc29ydCgpO1xyXG4gICAgb01vZGVsLmNhdGVnb3J5ID0gb01vZGVsLmNhdGVnb3J5LmZpbHRlcihmdW5jdGlvbiAoc3RyaW5nLCBpbmRleCkge1xyXG4gICAgICAgIHJldHVybiBvTW9kZWwuY2F0ZWdvcnlbaW5kZXhdICE9PSBvTW9kZWwuY2F0ZWdvcnlbaW5kZXggKyAxXTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIG9NZGw7XHJcbn0gLy8gbG9hZG1vZGVsXHJcblxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzcGxpdFJ1bGVzKHJ1bGVzOiBJTWF0Y2gubVJ1bGVbXSk6IElNYXRjaC5TcGxpdFJ1bGVzIHtcclxuICAgIHZhciByZXMgPSB7fTtcclxuICAgIHZhciBub25Xb3JkUnVsZXMgPSBbXTtcclxuICAgIHJ1bGVzLmZvckVhY2goZnVuY3Rpb24gKHJ1bGUpIHtcclxuICAgICAgICBpZiAocnVsZS50eXBlID09PSBJTWF0Y2guRW51bVJ1bGVUeXBlLldPUkQpIHtcclxuICAgICAgICAgICAgaWYgKCFydWxlLmxvd2VyY2FzZXdvcmQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlJ1bGUgaGFzIG5vIG1lbWJlciBsb3dlcmNhc2V3b3JkXCIgKyBKU09OLnN0cmluZ2lmeShydWxlKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVzW3J1bGUubG93ZXJjYXNld29yZF0gPSByZXNbcnVsZS5sb3dlcmNhc2V3b3JkXSB8fCB7IGJpdGluZGV4OiAwLCBydWxlczogW10gfTtcclxuICAgICAgICAgICAgcmVzW3J1bGUubG93ZXJjYXNld29yZF0uYml0aW5kZXggPSByZXNbcnVsZS5sb3dlcmNhc2V3b3JkXS5iaXRpbmRleCB8IHJ1bGUuYml0aW5kZXg7XHJcbiAgICAgICAgICAgIHJlc1tydWxlLmxvd2VyY2FzZXdvcmRdLnJ1bGVzLnB1c2gocnVsZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbm9uV29yZFJ1bGVzLnB1c2gocnVsZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHdvcmRNYXA6IHJlcyxcclxuICAgICAgICBub25Xb3JkUnVsZXM6IG5vbldvcmRSdWxlcyxcclxuICAgICAgICBhbGxSdWxlczogcnVsZXMsXHJcbiAgICAgICAgd29yZENhY2hlOiB7fVxyXG4gICAgfTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzb3J0RmxhdFJlY29yZHMoYSxiKSB7XHJcbiAgICB2YXIga2V5cyA9IF8udW5pb24oT2JqZWN0LmtleXMoYSksT2JqZWN0LmtleXMoYikpLnNvcnQoKTtcclxuICAgIHZhciByID0gMDtcclxuICAgIGtleXMuZXZlcnkoIChrZXkpID0+IHtcclxuICAgICAgICBpZih0eXBlb2YgYVtrZXldID09PSBcInN0cmluZ1wiICYmIHR5cGVvZiBiW2tleV0gIT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgciA9IC0xO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHR5cGVvZiBhW2tleV0gIT09IFwic3RyaW5nXCIgJiYgdHlwZW9mIGJba2V5XSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICByID0gKzE7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodHlwZW9mIGFba2V5XSAhPT0gXCJzdHJpbmdcIiAmJiB0eXBlb2YgYltrZXldICE9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIHIgPSAwO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgciA9IGFba2V5XS5sb2NhbGVDb21wYXJlKGJba2V5XSk7XHJcbiAgICAgICAgcmV0dXJuIHIgPT09IDA7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiByO1xyXG59O1xyXG5cclxuXHJcbmZ1bmN0aW9uIGNtcExlbmd0aFNvcnQoYTogc3RyaW5nLCBiOiBzdHJpbmcpIHtcclxuICAgIHZhciBkID0gYS5sZW5ndGggLSBiLmxlbmd0aDtcclxuICAgIGlmIChkKSB7XHJcbiAgICAgICAgcmV0dXJuIGQ7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYS5sb2NhbGVDb21wYXJlKGIpO1xyXG59XHJcblxyXG5cclxuaW1wb3J0ICogYXMgQWxnb2wgZnJvbSAnLi4vbWF0Y2gvYWxnb2wnO1xyXG4vLyBvZmZzZXRbMF0gOiBsZW4tMlxyXG4vLyAgICAgICAgICAgICBsZW4gLTFcclxuLy8gICAgICAgICAgICAgbGVuXHJcbi8vICAgICAgICAgICAgIGxlbiArMVxyXG4vLyAgICAgICAgICAgICBsZW4gKzJcclxuLy8gICAgICAgICAgICAgbGVuICszXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZmluZE5leHRMZW4odGFyZ2V0TGVuOiBudW1iZXIsIGFycjogc3RyaW5nW10sIG9mZnNldHM6IG51bWJlcltdKSB7XHJcbiAgICBvZmZzZXRzLnNoaWZ0KCk7XHJcbiAgICBmb3IgKHZhciBpID0gb2Zmc2V0c1s0XTsgKGkgPCBhcnIubGVuZ3RoKSAmJiAoYXJyW2ldLmxlbmd0aCA8PSB0YXJnZXRMZW4pOyArK2kpIHtcclxuICAgICAgICAvKiBlbXB0eSovXHJcbiAgICB9XHJcbiAgICBvZmZzZXRzLnB1c2goaSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhZGRSYW5nZVJ1bGVzVW5sZXNzUHJlc2VudChydWxlczogSU1hdGNoLm1SdWxlW10sIGxjd29yZDogc3RyaW5nLCByYW5nZVJ1bGVzOiBJTWF0Y2gubVJ1bGVbXSwgcHJlc2VudFJ1bGVzRm9yS2V5OiBJTWF0Y2gubVJ1bGVbXSwgc2VlblJ1bGVzKSB7XHJcbiAgICByYW5nZVJ1bGVzLmZvckVhY2gocmFuZ2VSdWxlID0+IHtcclxuICAgICAgICB2YXIgbmV3UnVsZSA9IChPYmplY3QgYXMgYW55KS5hc3NpZ24oe30sIHJhbmdlUnVsZSk7XHJcbiAgICAgICAgbmV3UnVsZS5sb3dlcmNhc2V3b3JkID0gbGN3b3JkO1xyXG4gICAgICAgIG5ld1J1bGUud29yZCA9IGxjd29yZDtcclxuICAgICAgICAvL2lmKChsY3dvcmQgPT09ICdzZXJ2aWNlcycgfHwgbGN3b3JkID09PSAnc2VydmljZScpICYmIG5ld1J1bGUucmFuZ2UucnVsZS5sb3dlcmNhc2V3b3JkLmluZGV4T2YoJ29kYXRhJyk+PTApIHtcclxuICAgICAgICAvLyAgICBjb25zb2xlLmxvZyhcImFkZGluZyBcIisgSlNPTi5zdHJpbmdpZnkobmV3UnVsZSkgKyBcIlxcblwiKTtcclxuICAgICAgICAvL31cclxuICAgICAgICAvL3RvZG86IGNoZWNrIHdoZXRoZXIgYW4gZXF1aXZhbGVudCBydWxlIGlzIGFscmVhZHkgcHJlc2VudD9cclxuICAgICAgICB2YXIgY250ID0gcnVsZXMubGVuZ3RoO1xyXG4gICAgICAgIGluc2VydFJ1bGVJZk5vdFByZXNlbnQocnVsZXMsIG5ld1J1bGUsIHNlZW5SdWxlcyk7XHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFkZENsb3NlRXhhY3RSYW5nZVJ1bGVzKHJ1bGVzOiBJTWF0Y2gubVJ1bGVbXSwgc2VlblJ1bGVzKSB7XHJcbiAgICB2YXIga2V5c01hcCA9IHt9IGFzIHsgW2tleTogc3RyaW5nXTogSU1hdGNoLm1SdWxlW10gfTtcclxuICAgIHZhciByYW5nZUtleXNNYXAgPSB7fSBhcyB7IFtrZXk6IHN0cmluZ106IElNYXRjaC5tUnVsZVtdIH07XHJcbiAgICBydWxlcy5mb3JFYWNoKHJ1bGUgPT4ge1xyXG4gICAgICAgIGlmIChydWxlLnR5cGUgPT09IElNYXRjaC5FbnVtUnVsZVR5cGUuV09SRCkge1xyXG4gICAgICAgICAgICAvL2tleXNNYXBbcnVsZS5sb3dlcmNhc2V3b3JkXSA9IDE7XHJcbiAgICAgICAgICAgIGtleXNNYXBbcnVsZS5sb3dlcmNhc2V3b3JkXSA9IGtleXNNYXBbcnVsZS5sb3dlcmNhc2V3b3JkXSB8fCBbXTtcclxuICAgICAgICAgICAga2V5c01hcFtydWxlLmxvd2VyY2FzZXdvcmRdLnB1c2gocnVsZSk7XHJcbiAgICAgICAgICAgIGlmICghcnVsZS5leGFjdE9ubHkgJiYgcnVsZS5yYW5nZSkge1xyXG4gICAgICAgICAgICAgICAgcmFuZ2VLZXlzTWFwW3J1bGUubG93ZXJjYXNld29yZF0gPSByYW5nZUtleXNNYXBbcnVsZS5sb3dlcmNhc2V3b3JkXSB8fCBbXTtcclxuICAgICAgICAgICAgICAgIHJhbmdlS2V5c01hcFtydWxlLmxvd2VyY2FzZXdvcmRdLnB1c2gocnVsZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoa2V5c01hcCk7XHJcbiAgICBrZXlzLnNvcnQoY21wTGVuZ3RoU29ydCk7XHJcbiAgICB2YXIgbGVuID0gMDtcclxuICAgIGtleXMuZm9yRWFjaCgoa2V5LCBpbmRleCkgPT4ge1xyXG4gICAgICAgIGlmIChrZXkubGVuZ3RoICE9IGxlbikge1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwic2hpZnQgdG8gbGVuXCIgKyBrZXkubGVuZ3RoICsgJyBhdCAnICsgaW5kZXggKyAnICcgKyBrZXkgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGVuID0ga2V5Lmxlbmd0aDtcclxuICAgIH0pO1xyXG4gICAgLy8gICBrZXlzID0ga2V5cy5zbGljZSgwLDIwMDApO1xyXG4gICAgdmFyIHJhbmdlS2V5cyA9IE9iamVjdC5rZXlzKHJhbmdlS2V5c01hcCk7XHJcbiAgICByYW5nZUtleXMuc29ydChjbXBMZW5ndGhTb3J0KTtcclxuICAgIC8vY29uc29sZS5sb2coYCAke2tleXMubGVuZ3RofSBrZXlzIGFuZCAke3JhbmdlS2V5cy5sZW5ndGh9IHJhbmdla2V5cyBgKTtcclxuICAgIHZhciBsb3cgPSAwO1xyXG4gICAgdmFyIGhpZ2ggPSAwO1xyXG4gICAgdmFyIGxhc3RsZW4gPSAwO1xyXG4gICAgdmFyIG9mZnNldHMgPSBbMCwgMCwgMCwgMCwgMCwgMF07XHJcbiAgICB2YXIgbGVuID0gcmFuZ2VLZXlzLmxlbmd0aDtcclxuICAgIGZpbmROZXh0TGVuKDAsIGtleXMsIG9mZnNldHMpO1xyXG4gICAgZmluZE5leHRMZW4oMSwga2V5cywgb2Zmc2V0cyk7XHJcbiAgICBmaW5kTmV4dExlbigyLCBrZXlzLCBvZmZzZXRzKTtcclxuXHJcbiAgICByYW5nZUtleXMuZm9yRWFjaChmdW5jdGlvbiAocmFuZ2VLZXkpIHtcclxuICAgICAgICBpZiAocmFuZ2VLZXkubGVuZ3RoICE9PSBsYXN0bGVuKSB7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IGxhc3RsZW4gKyAxOyBpIDw9IHJhbmdlS2V5Lmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICBmaW5kTmV4dExlbihpICsgMiwga2V5cywgb2Zmc2V0cyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gICBjb25zb2xlLmxvZyhgIHNoaWZ0ZWQgdG8gJHtyYW5nZUtleS5sZW5ndGh9IHdpdGggb2Zmc2V0cyBiZWVpbmcgJHtvZmZzZXRzLmpvaW4oJyAnKX1gKTtcclxuICAgICAgICAgICAgLy8gICBjb25zb2xlLmxvZyhgIGhlcmUgMCAke29mZnNldHNbMF19IDogJHtrZXlzW01hdGgubWluKGtleXMubGVuZ3RoLTEsIG9mZnNldHNbMF0pXS5sZW5ndGh9ICAke2tleXNbTWF0aC5taW4oa2V5cy5sZW5ndGgtMSwgb2Zmc2V0c1swXSldfSBgKTtcclxuICAgICAgICAgICAgLy8gIGNvbnNvbGUubG9nKGAgaGVyZSA1LTEgICR7a2V5c1tvZmZzZXRzWzVdLTFdLmxlbmd0aH0gICR7a2V5c1tvZmZzZXRzWzVdLTFdfSBgKTtcclxuICAgICAgICAgICAgLy8gICBjb25zb2xlLmxvZyhgIGhlcmUgNSAke29mZnNldHNbNV19IDogJHtrZXlzW01hdGgubWluKGtleXMubGVuZ3RoLTEsIG9mZnNldHNbNV0pXS5sZW5ndGh9ICAke2tleXNbTWF0aC5taW4oa2V5cy5sZW5ndGgtMSwgb2Zmc2V0c1s1XSldfSBgKTtcclxuICAgICAgICAgICAgbGFzdGxlbiA9IHJhbmdlS2V5Lmxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IG9mZnNldHNbMF07IGkgPCBvZmZzZXRzWzVdOyArK2kpIHtcclxuICAgICAgICAgICAgdmFyIGQgPSBEaXN0YW5jZS5jYWxjRGlzdGFuY2VBZGp1c3RlZChyYW5nZUtleSwga2V5c1tpXSk7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAke3JhbmdlS2V5Lmxlbmd0aC1rZXlzW2ldLmxlbmd0aH0gJHtkfSAke3JhbmdlS2V5fSBhbmQgJHtrZXlzW2ldfSAgYCk7XHJcbiAgICAgICAgICAgIGlmICgoZCAhPT0gMS4wKSAmJiAoZCA+PSBBbGdvbC5DdXRvZmZfcmFuZ2VDbG9zZU1hdGNoKSkge1xyXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhgd291bGQgYWRkICR7cmFuZ2VLZXl9IGZvciAke2tleXNbaV19ICR7ZH1gKTtcclxuICAgICAgICAgICAgICAgIHZhciBjbnQgPSBydWxlcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAvLyB3ZSBvbmx5IGhhdmUgdG8gYWRkIGlmIHRoZXJlIGlzIG5vdCB5ZXQgYSBtYXRjaCBydWxlIGhlcmUgd2hpY2ggcG9pbnRzIHRvIHRoZSBzYW1lXHJcbiAgICAgICAgICAgICAgICBhZGRSYW5nZVJ1bGVzVW5sZXNzUHJlc2VudChydWxlcywga2V5c1tpXSwgcmFuZ2VLZXlzTWFwW3JhbmdlS2V5XSwga2V5c01hcFtrZXlzW2ldXSwgc2VlblJ1bGVzKTtcclxuICAgICAgICAgICAgICAgIGlmIChydWxlcy5sZW5ndGggPiBjbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKGAgYWRkZWQgJHsocnVsZXMubGVuZ3RoIC0gY250KX0gcmVjb3JkcyBhdCR7cmFuZ2VLZXl9IGZvciAke2tleXNbaV19ICR7ZH1gKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIC8qXHJcbiAgICBbXHJcbiAgICAgICAgWydhRUZHJywnYUVGR0gnXSxcclxuICAgICAgICBbJ2FFRkdIJywnYUVGR0hJJ10sXHJcbiAgICAgICAgWydPZGF0YScsJ09EYXRhcyddLFxyXG4gICBbJ09kYXRhJywnT2RhdGFzJ10sXHJcbiAgIFsnT2RhdGEnLCdPZGF0YiddLFxyXG4gICBbJ09kYXRhJywnVURhdGEnXSxcclxuICAgWydzZXJ2aWNlJywnc2VydmljZXMnXSxcclxuICAgWyd0aGlzIGlzZnVubnkgYW5kIG1vcmUnLCd0aGlzIGlzZnVubnkgYW5kIG1vcmVzJ10sXHJcbiAgICBdLmZvckVhY2gocmVjID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgZGlzdGFuY2UgJHtyZWNbMF19ICR7cmVjWzFdfSA6ICR7RGlzdGFuY2UuY2FsY0Rpc3RhbmNlKHJlY1swXSxyZWNbMV0pfSAgYWRmICR7RGlzdGFuY2UuY2FsY0Rpc3RhbmNlQWRqdXN0ZWQocmVjWzBdLHJlY1sxXSl9IGApO1xyXG5cclxuICAgIH0pO1xyXG4gICAgY29uc29sZS5sb2coXCJkaXN0YW5jZSBPZGF0YSBVZGF0YVwiKyBEaXN0YW5jZS5jYWxjRGlzdGFuY2UoJ09EYXRhJywnVURhdGEnKSk7XHJcbiAgICBjb25zb2xlLmxvZyhcImRpc3RhbmNlIE9kYXRhIE9kYXRiXCIrIERpc3RhbmNlLmNhbGNEaXN0YW5jZSgnT0RhdGEnLCdPRGF0YicpKTtcclxuICAgIGNvbnNvbGUubG9nKFwiZGlzdGFuY2UgT2RhdGFzIE9kYXRhXCIrIERpc3RhbmNlLmNhbGNEaXN0YW5jZSgnT0RhdGEnLCdPRGF0YWEnKSk7XHJcbiAgICBjb25zb2xlLmxvZyhcImRpc3RhbmNlIE9kYXRhcyBhYmNkZVwiKyBEaXN0YW5jZS5jYWxjRGlzdGFuY2UoJ2FiY2RlJywnYWJjZGVmJykpO1xyXG4gICAgY29uc29sZS5sb2coXCJkaXN0YW5jZSBzZXJ2aWNlcyBcIisgRGlzdGFuY2UuY2FsY0Rpc3RhbmNlKCdzZXJ2aWNlcycsJ3NlcnZpY2UnKSk7XHJcbiAgICAqL1xyXG59XHJcbnZhciBuID0gMDtcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVhZEZpbGxlcnMoc3JjSGFuZGxlIDogSVNyY0hhbmRsZSwgb01vZGVsIDogSU1hdGNoLklNb2RlbHMpICA6IFByb21pc2U8YW55PiB7XHJcbiAgICB2YXIgZmlsbGVyQml0SW5kZXggPSBnZXREb21haW5CaXRJbmRleCgnbWV0YScsIG9Nb2RlbCk7XHJcbiAgICB2YXIgYml0SW5kZXhBbGxEb21haW5zID0gZ2V0QWxsRG9tYWluc0JpdEluZGV4KG9Nb2RlbCk7XHJcbiAgICByZXR1cm4gU2NoZW1hbG9hZC5nZXRGaWxsZXJzRnJvbURCKHNyY0hhbmRsZSlcclxuICAgIC8vLnRoZW4oXHJcbi8vICAgICAgICAoZmlsbGVyc09iaikgPT4gZmlsbGVyc09iai5maWxsZXJzXHJcbiAgLy8gIClcclxuICAgIC50aGVuKChmaWxsZXJzOiBzdHJpbmdbXSkgPT4ge1xyXG4gICAgICAgIC8vICBmaWxsZXJzcmVhZEZpbGVBc0pTT04oJy4vJyArIG1vZGVsUGF0aCArICcvZmlsbGVyLmpzb24nKTtcclxuICAgICAgICAvKlxyXG4gICAgICAgIHZhciByZSA9IFwiXigoXCIgKyBmaWxsZXJzLmpvaW4oXCIpfChcIikgKyBcIikpJFwiO1xyXG4gICAgICAgIG9Nb2RlbC5tUnVsZXMucHVzaCh7XHJcbiAgICAgICAgICAgIGNhdGVnb3J5OiBcImZpbGxlclwiLFxyXG4gICAgICAgICAgICB0eXBlOiBJTWF0Y2guRW51bVJ1bGVUeXBlLlJFR0VYUCxcclxuICAgICAgICAgICAgcmVnZXhwOiBuZXcgUmVnRXhwKHJlLCBcImlcIiksXHJcbiAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IFwiZmlsbGVyXCIsXHJcbiAgICAgICAgICAgIGJpdGluZGV4OiBmaWxsZXJCaXRJbmRleCxcclxuICAgICAgICAgICAgX3Jhbmtpbmc6IDAuOVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICovXHJcbiAgICAgICAgaWYgKCFfLmlzQXJyYXkoZmlsbGVycykpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdleHBlY3QgZmlsbGVycyB0byBiZSBhbiBhcnJheSBvZiBzdHJpbmdzJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbGxlcnMuZm9yRWFjaChmaWxsZXIgPT4ge1xyXG4gICAgICAgICAgICBpbnNlcnRSdWxlSWZOb3RQcmVzZW50KG9Nb2RlbC5tUnVsZXMsIHtcclxuICAgICAgICAgICAgICAgIGNhdGVnb3J5OiBcImZpbGxlclwiLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogSU1hdGNoLkVudW1SdWxlVHlwZS5XT1JELFxyXG4gICAgICAgICAgICAgICAgd29yZDogZmlsbGVyLFxyXG4gICAgICAgICAgICAgICAgbG93ZXJjYXNld29yZDogZmlsbGVyLnRvTG93ZXJDYXNlKCksXHJcbiAgICAgICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBmaWxsZXIsIC8vXCJmaWxsZXJcIixcclxuICAgICAgICAgICAgICAgIGV4YWN0T25seTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGJpdGluZGV4OiBmaWxsZXJCaXRJbmRleCxcclxuICAgICAgICAgICAgICAgIGJpdFNlbnRlbmNlQW5kOiBiaXRJbmRleEFsbERvbWFpbnMsXHJcbiAgICAgICAgICAgICAgICB3b3JkVHlwZTogSU1hdGNoLldPUkRUWVBFLkZJTExFUixcclxuICAgICAgICAgICAgICAgIF9yYW5raW5nOiAwLjlcclxuICAgICAgICAgICAgfSwgb01vZGVsLnNlZW5SdWxlcyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9KTtcclxufTtcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVhZE9wZXJhdG9ycyhzcmNIYW5kbGU6IElTcmNIYW5kbGUsIG9Nb2RlbDogSU1hdGNoLklNb2RlbHMpIDogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICBkZWJ1Z2xvZygncmVhZGluZyBvcGVyYXRvcnMnKTtcclxuICAgICAgICAvL2FkZCBvcGVyYXRvcnNcclxuICAgIHJldHVybiBTY2hlbWFsb2FkLmdldE9wZXJhdG9yc0Zyb21EQihzcmNIYW5kbGUpLnRoZW4oXHJcbiAgICAgICAgKG9wZXJhdG9yczogYW55KSA9PiB7XHJcbiAgICAgICAgdmFyIG9wZXJhdG9yQml0SW5kZXggPSBnZXREb21haW5CaXRJbmRleCgnb3BlcmF0b3JzJywgb01vZGVsKTtcclxuICAgICAgICB2YXIgYml0SW5kZXhBbGxEb21haW5zID0gZ2V0QWxsRG9tYWluc0JpdEluZGV4KG9Nb2RlbCk7XHJcbiAgICAgICAgT2JqZWN0LmtleXMob3BlcmF0b3JzLm9wZXJhdG9ycykuZm9yRWFjaChmdW5jdGlvbiAob3BlcmF0b3IpIHtcclxuICAgICAgICAgICAgaWYgKElNYXRjaC5hT3BlcmF0b3JOYW1lcy5pbmRleE9mKG9wZXJhdG9yKSA8IDApIHtcclxuICAgICAgICAgICAgICAgIGRlYnVnbG9nKFwidW5rbm93biBvcGVyYXRvciBcIiArIG9wZXJhdG9yKTtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInVua25vd24gb3BlcmF0b3IgXCIgKyBvcGVyYXRvciArICcgKGFkZCB0byBpZm1hdGNoLnRzICBhT3BlcmF0b3JOYW1lcyknKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBvTW9kZWwub3BlcmF0b3JzW29wZXJhdG9yXSA9IG9wZXJhdG9ycy5vcGVyYXRvcnNbb3BlcmF0b3JdO1xyXG4gICAgICAgICAgICBvTW9kZWwub3BlcmF0b3JzW29wZXJhdG9yXS5vcGVyYXRvciA9IDxJTWF0Y2guT3BlcmF0b3JOYW1lPm9wZXJhdG9yO1xyXG4gICAgICAgICAgICBPYmplY3QuZnJlZXplKG9Nb2RlbC5vcGVyYXRvcnNbb3BlcmF0b3JdKTtcclxuICAgICAgICAgICAgdmFyIHdvcmQgPSBvcGVyYXRvcjtcclxuICAgICAgICAgICAgaW5zZXJ0UnVsZUlmTm90UHJlc2VudChvTW9kZWwubVJ1bGVzLCB7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yeTogXCJvcGVyYXRvclwiLFxyXG4gICAgICAgICAgICAgICAgd29yZDogd29yZC50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICAgICAgbG93ZXJjYXNld29yZDogd29yZC50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogSU1hdGNoLkVudW1SdWxlVHlwZS5XT1JELFxyXG4gICAgICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogd29yZCxcclxuICAgICAgICAgICAgICAgIGJpdGluZGV4OiBvcGVyYXRvckJpdEluZGV4LFxyXG4gICAgICAgICAgICAgICAgYml0U2VudGVuY2VBbmQ6IGJpdEluZGV4QWxsRG9tYWlucyxcclxuICAgICAgICAgICAgICAgIHdvcmRUeXBlOiBJTWF0Y2guV09SRFRZUEUuT1BFUkFUT1IsXHJcbiAgICAgICAgICAgICAgICBfcmFua2luZzogMC45XHJcbiAgICAgICAgICAgIH0sIG9Nb2RlbC5zZWVuUnVsZXMpO1xyXG4gICAgICAgICAgICAvLyBhZGQgYWxsIHN5bm9ueW1zXHJcbiAgICAgICAgICAgIGlmIChvcGVyYXRvcnMuc3lub255bXNbb3BlcmF0b3JdKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gb3BlcmF0b3JzLnN5bm9ueW1zW29wZXJhdG9yXTtcclxuICAgICAgICAgICAgICAgIGlmICggYXJyIClcclxuICAgICAgICAgICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIEFycmF5LmlzQXJyYXkoYXJyKSlcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyci5mb3JFYWNoKGZ1bmN0aW9uIChzeW5vbnltKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnRSdWxlSWZOb3RQcmVzZW50KG9Nb2RlbC5tUnVsZXMsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogXCJvcGVyYXRvclwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmQ6IHN5bm9ueW0udG9Mb3dlckNhc2UoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3dlcmNhc2V3b3JkOiBzeW5vbnltLnRvTG93ZXJDYXNlKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogSU1hdGNoLkVudW1SdWxlVHlwZS5XT1JELFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IG9wZXJhdG9yLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJpdGluZGV4OiBvcGVyYXRvckJpdEluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJpdFNlbnRlbmNlQW5kOiBiaXRJbmRleEFsbERvbWFpbnMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd29yZFR5cGU6IElNYXRjaC5XT1JEVFlQRS5PUEVSQVRPUixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfcmFua2luZzogMC45XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIkV4cGV0ZWQgb3BlcmF0b3Igc3lub255bSB0byBiZSBhcnJheSBcIiArIG9wZXJhdG9yICsgXCIgaXMgXCIgKyBKU09OLnN0cmluZ2lmeShhcnIpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZWxlYXNlTW9kZWwobW9kZWwgOiBJTWF0Y2guSU1vZGVscykge1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbG9hZE1vZGVsc09wZW5pbmdDb25uZWN0aW9uKHNyY2hhbmRsZTogSVNyY0hhbmRsZSwgY29ubmVjdGlvblN0cmluZz8gOiBzdHJpbmcsICBtb2RlbFBhdGg/IDogc3RyaW5nKSA6IFByb21pc2U8SU1hdGNoLklNb2RlbHM+IHtcclxuICAgIHJldHVybiBsb2FkTW9kZWxzKHNyY2hhbmRsZSwgY29ubmVjdGlvblN0cmluZywgbW9kZWxQYXRoKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSBzcmNIYW5kbGVcclxuICogQHBhcmFtIG1vZGVsUGF0aFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRNb2RlbHMoc3JjSGFuZGxlOiBJU3JjSGFuZGxlLCBjb25uZWN0aW9uU3RyaW5nIDogc3RyaW5nLCBtb2RlbFBhdGggOiBzdHJpbmcpIDogUHJvbWlzZTxJTWF0Y2guSU1vZGVscz4ge1xyXG4gICAgaWYoc3JjSGFuZGxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2V4cGVjdCBhIHNyY0hhbmRsZSBoYW5kbGUgdG8gYmUgcGFzc2VkJyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZ2V0TW9kZWxIYW5kbGUoc3JjSGFuZGxlLCBjb25uZWN0aW9uU3RyaW5nKS50aGVuKCAobW9kZWxIYW5kbGUpID0+e1xyXG4gICAgICAgIGRlYnVnbG9nKGBnb3QgYSBtb25nbyBoYW5kbGUgZm9yICR7bW9kZWxQYXRofWApO1xyXG4gICAgICAgIHJldHVybiBfbG9hZE1vZGVsc0Z1bGwobW9kZWxIYW5kbGUsIG1vZGVsUGF0aCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9sb2FkTW9kZWxzRnVsbChtb2RlbEhhbmRsZTogSU1hdGNoLklNb2RlbEhhbmRsZVJhdywgbW9kZWxQYXRoPzogc3RyaW5nKTogUHJvbWlzZTxJTWF0Y2guSU1vZGVscz4ge1xyXG4gICAgdmFyIG9Nb2RlbDogSU1hdGNoLklNb2RlbHM7XHJcbiAgICBtb2RlbFBhdGggPSBtb2RlbFBhdGggfHwgZW52TW9kZWxQYXRoO1xyXG4gICAgbW9kZWxIYW5kbGUgPSBtb2RlbEhhbmRsZSB8fCB7XHJcbiAgICAgICAgc3JjSGFuZGxlOiB1bmRlZmluZWQsXHJcbiAgICAgICAgbW9kZWxEb2NzOiB7fSxcclxuICAgICAgICBtb25nb01hcHM6IHt9LFxyXG4gICAgICAgIG1vZGVsRVNjaGVtYXM6IHt9XHJcbiAgICB9O1xyXG4gICAgb01vZGVsID0ge1xyXG4gICAgICAgIG1vbmdvSGFuZGxlIDogbW9kZWxIYW5kbGUsXHJcbiAgICAgICAgZnVsbDogeyBkb21haW46IHt9IH0sXHJcbiAgICAgICAgcmF3TW9kZWxzOiB7fSxcclxuICAgICAgICBkb21haW5zOiBbXSxcclxuICAgICAgICBydWxlczogdW5kZWZpbmVkLFxyXG4gICAgICAgIGNhdGVnb3J5OiBbXSxcclxuICAgICAgICBvcGVyYXRvcnM6IHt9LFxyXG4gICAgICAgIG1SdWxlczogW10sXHJcbiAgICAgICAgc2VlblJ1bGVzOiB7fSxcclxuICAgICAgICBtZXRhOiB7IHQzOiB7fSB9XHJcbiAgICB9XHJcbiAgICB2YXIgdCA9IERhdGUubm93KCk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBkZWJ1Z2xvZygoKT0+ICdoZXJlIG1vZGVsIHBhdGgnICsgbW9kZWxQYXRoKTtcclxuICAgICAgICB2YXIgYSA9IENpcmN1bGFyU2VyLmxvYWQobW9kZWxQYXRoICsgJy9fY2FjaGUuanMnKTtcclxuICAgICAgICAvLyBUT0RPIFJFTU9WRSBcclxuICAgICAgICAvL3Rocm93IFwibm8gY2FjaGVcIjtcclxuICAgICAgICAvLyBUT0RPXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcImZvdW5kIGEgY2FjaGUgPyAgXCIgKyAhIWEpO1xyXG4gICAgICAgIC8vYSA9IHVuZGVmaW5lZDtcclxuICAgICAgICBpZiAoYSAmJiAhcHJvY2Vzcy5lbnYuTUdOTFFfTU9ERUxfTk9fRklMRUNBQ0hFKSB7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3JldHVybiBwcmVwcycgKyBtb2RlbFBhdGgpO1xyXG4gICAgICAgICAgICBkZWJ1Z2xvZyhcIlxcbiByZXR1cm4gcHJlcGFyZWQgbW9kZWwgISFcIik7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwidXNpbmcgcHJlcGFyZWQgbW9kZWwgIFwiICsgbW9kZWxQYXRoKTtcclxuICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52LkFCT1RfRU1BSUxfVVNFUikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJsb2FkZWQgbW9kZWxzIGZyb20gY2FjaGUgaW4gXCIgKyAoRGF0ZS5ub3coKSAtIHQpICsgXCIgXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciByZXMgPSBhIGFzIElNYXRjaC5JTW9kZWxzO1xyXG4gICAgICAgICAgICByZXMubW9uZ29IYW5kbGUuc3JjSGFuZGxlICA9IG1vZGVsSGFuZGxlLnNyY0hhbmRsZTtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXMpO1xyXG4gICAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAvL2NvbnNvbGUubG9nKCdlcnJvcicgKyBlKTtcclxuICAgICAgICAvLyBubyBjYWNoZSBmaWxlLFxyXG4gICAgfVxyXG4gICAgdmFyIG1kbHMgPSBPYmplY3Qua2V5cyhtb2RlbEhhbmRsZS5tb2RlbERvY3MpLnNvcnQoKTtcclxuICAgIHZhciBzZWVuRG9tYWlucyA9e307XHJcbiAgICBtZGxzLmZvckVhY2goKG1vZGVsTmFtZSxpbmRleCkgPT4ge1xyXG4gICAgICAgIHZhciBkb21haW4gPSBtb2RlbEhhbmRsZS5tb2RlbERvY3NbbW9kZWxOYW1lXS5kb21haW47XHJcbiAgICAgICAgaWYoc2VlbkRvbWFpbnNbZG9tYWluXSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RvbWFpbiAnICsgZG9tYWluICsgJyBhbHJlYWR5IGxvYWRlZCB3aGlsZSBsb2FkaW5nICcgKyBtb2RlbE5hbWUgKyAnPycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzZWVuRG9tYWluc1tkb21haW5dID0gaW5kZXg7XHJcbiAgICB9KVxyXG4gICAgb01vZGVsLmRvbWFpbnMgPSBtZGxzLm1hcChtb2RlbE5hbWUgPT4gbW9kZWxIYW5kbGUubW9kZWxEb2NzW21vZGVsTmFtZV0uZG9tYWluKTtcclxuICAgIC8vIGNyZWF0ZSBiaXRpbmRleCBpbiBvcmRlciAhXHJcbiAgICBkZWJ1Z2xvZygnZ290IGRvbWFpbnMgJyArIG1kbHMuam9pbihcIlxcblwiKSk7XHJcbiAgICBkZWJ1Z2xvZygnbG9hZGluZyBtb2RlbHMgJyArIG1kbHMuam9pbihcIlxcblwiKSk7XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKG1kbHMubWFwKChzTW9kZWxOYW1lKSA9PlxyXG4gICAgICAgIGxvYWRNb2RlbChtb2RlbEhhbmRsZSwgc01vZGVsTmFtZSwgb01vZGVsKSlcclxuICAgICkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgdmFyIG1ldGFCaXRJbmRleCA9IGdldERvbWFpbkJpdEluZGV4KCdtZXRhJywgb01vZGVsKTtcclxuICAgICAgICB2YXIgYml0SW5kZXhBbGxEb21haW5zID0gZ2V0QWxsRG9tYWluc0JpdEluZGV4KG9Nb2RlbCk7XHJcblxyXG4gICAgICAgIC8vIGFkZCB0aGUgZG9tYWluIG1ldGEgcnVsZVxyXG4gICAgICAgIGluc2VydFJ1bGVJZk5vdFByZXNlbnQob01vZGVsLm1SdWxlcywge1xyXG4gICAgICAgICAgICBjYXRlZ29yeTogXCJtZXRhXCIsXHJcbiAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IFwiZG9tYWluXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IElNYXRjaC5FbnVtUnVsZVR5cGUuV09SRCxcclxuICAgICAgICAgICAgd29yZDogXCJkb21haW5cIixcclxuICAgICAgICAgICAgYml0aW5kZXg6IG1ldGFCaXRJbmRleCxcclxuICAgICAgICAgICAgd29yZFR5cGU6IElNYXRjaC5XT1JEVFlQRS5NRVRBLFxyXG4gICAgICAgICAgICBiaXRTZW50ZW5jZUFuZDogYml0SW5kZXhBbGxEb21haW5zLFxyXG4gICAgICAgICAgICBfcmFua2luZzogMC45NVxyXG4gICAgICAgIH0sIG9Nb2RlbC5zZWVuUnVsZXMpO1xyXG4gICAgICAgIC8vIGluc2VydCB0aGUgTnVtYmVycyBydWxlc1xyXG4gICAgICAgIGRlYnVnbG9nKCcgYWRkIG51bWJlcnMgcnVsZScpO1xyXG4gICAgICAgIGluc2VydFJ1bGVJZk5vdFByZXNlbnQob01vZGVsLm1SdWxlcywge1xyXG4gICAgICAgICAgICBjYXRlZ29yeTogXCJudW1iZXJcIixcclxuICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogXCJvbmVcIixcclxuICAgICAgICAgICAgdHlwZTogSU1hdGNoLkVudW1SdWxlVHlwZS5SRUdFWFAsXHJcbiAgICAgICAgICAgIHJlZ2V4cCA6IC9eKChcXGQrKXwob25lKXwodHdvKXwodGhyZWUpKSQvLFxyXG4gICAgICAgICAgICBtYXRjaEluZGV4IDogMCxcclxuICAgICAgICAgICAgd29yZDogXCI8bnVtYmVyPlwiLFxyXG4gICAgICAgICAgICBiaXRpbmRleDogbWV0YUJpdEluZGV4LFxyXG4gICAgICAgICAgICB3b3JkVHlwZTogSU1hdGNoLldPUkRUWVBFLk5VTUVSSUNBUkcsIC8vIG51bWJlclxyXG4gICAgICAgICAgICBiaXRTZW50ZW5jZUFuZDogYml0SW5kZXhBbGxEb21haW5zLFxyXG4gICAgICAgICAgICBfcmFua2luZzogMC45NVxyXG4gICAgICAgIH0sIG9Nb2RlbC5zZWVuUnVsZXMpO1xyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgICkudGhlbiggKCk9PlxyXG4gICAgICAgIHJlYWRGaWxsZXJzKG1vZGVsSGFuZGxlLnNyY0hhbmRsZSwgb01vZGVsKVxyXG4gICAgKS50aGVuKCAoKSA9PlxyXG4gICAgICAgIHJlYWRPcGVyYXRvcnMobW9kZWxIYW5kbGUuc3JjSGFuZGxlLCBvTW9kZWwpXHJcbiAgICApLnRoZW4oICgpID0+IHtcclxuICAgICAgICAvKlxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIGNhdGVnb3J5OiBcImZpbGxlclwiLFxyXG4gICAgICAgICAgICAgIHR5cGU6IDEsXHJcbiAgICAgICAgICAgICAgcmVnZXhwOiAvXigoc3RhcnQpfChzaG93KXwoZnJvbSl8KGluKSkkL2ksXHJcbiAgICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogXCJmaWxsZXJcIixcclxuICAgICAgICAgICAgICBfcmFua2luZzogMC45XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgKi9cclxuICAgICAgICBkZWJ1Z2xvZygnc2F2aW5nIGRhdGEgdG8gJyArIG1vZGVsUGF0aCk7XHJcbiAgICAgICAgb01vZGVsLm1SdWxlcyA9IG9Nb2RlbC5tUnVsZXMuc29ydChJbnB1dEZpbHRlclJ1bGVzLmNtcE1SdWxlKTtcclxuICAgICAgICBhZGRDbG9zZUV4YWN0UmFuZ2VSdWxlcyhvTW9kZWwubVJ1bGVzLCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuICAgICAgICBvTW9kZWwubVJ1bGVzID0gb01vZGVsLm1SdWxlcy5zb3J0KElucHV0RmlsdGVyUnVsZXMuY21wTVJ1bGUpO1xyXG4gICAgICAgIG9Nb2RlbC5tUnVsZXMuc29ydChJbnB1dEZpbHRlclJ1bGVzLmNtcE1SdWxlKTtcclxuICAgICAgICAvL2ZzLndyaXRlRmlsZVN5bmMoXCJwb3N0X3NvcnRcIiwgSlNPTi5zdHJpbmdpZnkob01vZGVsLm1SdWxlcyx1bmRlZmluZWQsMikpO1xyXG5cclxuICAgICAgICBmb3JjZUdDKCk7XHJcbiAgICAgICAgb01vZGVsLnJ1bGVzID0gc3BsaXRSdWxlcyhvTW9kZWwubVJ1bGVzKTtcclxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKFwidGVzdDF4Lmpzb25cIiwgSlNPTi5zdHJpbmdpZnkob01vZGVsLnJ1bGVzLHVuZGVmaW5lZCwyKSk7XHJcbiAgICAgICAgZm9yY2VHQygpO1xyXG4gICAgICAgIGRlbGV0ZSBvTW9kZWwuc2VlblJ1bGVzO1xyXG4gICAgICAgIGRlYnVnbG9nKCdzYXZpbmcnKTtcclxuICAgICAgICBmb3JjZUdDKCk7XHJcbiAgICAgICAgdmFyIG9Nb2RlbFNlciA9IE9iamVjdC5hc3NpZ24oe30sIG9Nb2RlbCk7XHJcbiAgICAgICAgb01vZGVsU2VyLm1vbmdvSGFuZGxlID0gT2JqZWN0LmFzc2lnbih7fSwgb01vZGVsLm1vbmdvSGFuZGxlKTtcclxuICAgICAgICBkZWJ1Z2xvZygnY3JlYXRlZCBkaXIxICcgKyBtb2RlbFBhdGgpOyBcclxuICAgICAgICBkZWxldGUgb01vZGVsU2VyLm1vbmdvSGFuZGxlLnNyY0hhbmRsZTtcclxuICAgICAgICB0cnkge1xyXG5cclxuICAgICAgICAgICAgYXNzdXJlRGlyRXhpc3RzKG1vZGVsUGF0aCk7XHJcbiAgICAgICAgICAgIGRlYnVnbG9nKCdjcmVhdGVkIGRpciAnICsgbW9kZWxQYXRoKTtcclxuICAgICAgICAgICAgQ2lyY3VsYXJTZXIuc2F2ZShtb2RlbFBhdGggKyAnL19jYWNoZS5qcycsIG9Nb2RlbFNlcik7XHJcbiAgICAgICAgICAgIGZvcmNlR0MoKTtcclxuICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52LkFCT1RfRU1BSUxfVVNFUikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJsb2FkZWQgbW9kZWxzIGJ5IGNhbGN1bGF0aW9uIGluIFwiICsgKERhdGUubm93KCkgLSB0KSArIFwiIFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgcmVzID0gb01vZGVsO1xyXG4gICAgICAgICAgICAvLyAoT2JqZWN0IGFzIGFueSkuYXNzaWduKG1vZGVsSGFuZGxlLCB7IG1vZGVsOiBvTW9kZWwgfSkgYXMgSU1hdGNoLklNb2RlbEhhbmRsZTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcztcclxuICAgICAgICB9IGNhdGNoKCBlcnIpIHtcclxuICAgICAgICAgICAgZGVidWdsb2coXCJcIiArIGVycik7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdlcnIgJyArIGVycik7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVyciArICcgJyArIGVyci5zdGFjayk7XHJcbiAgICAgICAgICAgIHByb2Nlc3Muc3Rkb3V0Lm9uKCdkcmFpbicsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KC0xKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignICcgKyBlcnIgICsgJyAnICsgZXJyLnN0YWNrKTtcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgIH1cclxuICAgICkuY2F0Y2goIChlcnIpID0+IHtcclxuICAgICAgICBkZWJ1Z2xvZyhcIlwiICsgZXJyKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnZXJyICcgKyBlcnIpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGVyciArICcgJyArIGVyci5zdGFjayk7XHJcbiAgICAgICAgcHJvY2Vzcy5zdGRvdXQub24oJ2RyYWluJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgtMSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCcgJyArIGVyciAgKyAnICcgKyBlcnIuc3RhY2spO1xyXG4gICAgfSkgYXMgUHJvbWlzZTxJTWF0Y2guSU1vZGVscz47XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzb3J0Q2F0ZWdvcmllc0J5SW1wb3J0YW5jZShtYXA6IHsgW2tleTogc3RyaW5nXTogSU1hdGNoLklDYXRlZ29yeURlc2MgfSwgY2F0czogc3RyaW5nW10pOiBzdHJpbmdbXSB7XHJcbiAgICB2YXIgcmVzID0gY2F0cy5zbGljZSgwKTtcclxuICAgIHJlcy5zb3J0KHJhbmtDYXRlZ29yeUJ5SW1wb3J0YW5jZS5iaW5kKHVuZGVmaW5lZCwgbWFwKSk7XHJcbiAgICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmFua0NhdGVnb3J5QnlJbXBvcnRhbmNlKG1hcDogeyBba2V5OiBzdHJpbmddOiBJTWF0Y2guSUNhdGVnb3J5RGVzYyB9LCBjYXRhOiBzdHJpbmcsIGNhdGI6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgICB2YXIgY2F0QURlc2MgPSBtYXBbY2F0YV07XHJcbiAgICB2YXIgY2F0QkRlc2MgPSBtYXBbY2F0Yl07XHJcbiAgICBpZiAoY2F0YSA9PT0gY2F0Yikge1xyXG4gICAgICAgIHJldHVybiAwO1xyXG4gICAgfVxyXG4gICAgLy8gaWYgYSBpcyBiZWZvcmUgYiwgcmV0dXJuIC0xXHJcbiAgICBpZiAoY2F0QURlc2MgJiYgIWNhdEJEZXNjKSB7XHJcbiAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgfVxyXG4gICAgaWYgKCFjYXRBRGVzYyAmJiBjYXRCRGVzYykge1xyXG4gICAgICAgIHJldHVybiArMTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcHJpb0EgPSAoY2F0QURlc2MgJiYgY2F0QURlc2MuaW1wb3J0YW5jZSkgfHwgOTk7XHJcbiAgICB2YXIgcHJpb0IgPSAoY2F0QkRlc2MgJiYgY2F0QkRlc2MuaW1wb3J0YW5jZSkgfHwgOTk7XHJcbiAgICAvLyBsb3dlciBwcmlvIGdvZXMgdG8gZnJvbnRcclxuICAgIHZhciByID0gcHJpb0EgLSBwcmlvQjtcclxuICAgIGlmIChyKSB7XHJcbiAgICAgICAgcmV0dXJuIHI7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY2F0YS5sb2NhbGVDb21wYXJlKGNhdGIpO1xyXG59XHJcblxyXG5jb25zdCBNZXRhRiA9IE1ldGEuZ2V0TWV0YUZhY3RvcnkoKTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRPcGVyYXRvcihtZGw6IElNYXRjaC5JTW9kZWxzLCBvcGVyYXRvcjogc3RyaW5nKTogSU1hdGNoLklPcGVyYXRvciB7XHJcbiAgICByZXR1cm4gbWRsLm9wZXJhdG9yc1tvcGVyYXRvcl07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRSZXN1bHRBc0FycmF5KG1kbDogSU1hdGNoLklNb2RlbHMsIGE6IE1ldGEuSU1ldGEsIHJlbDogTWV0YS5JTWV0YSk6IE1ldGEuSU1ldGFbXSB7XHJcbiAgICBpZiAocmVsLnRvVHlwZSgpICE9PSAncmVsYXRpb24nKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZXhwZWN0IHJlbGF0aW9uIGFzIDJuZCBhcmdcIik7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHJlcyA9IG1kbC5tZXRhLnQzW2EudG9GdWxsU3RyaW5nKCldICYmXHJcbiAgICAgICAgbWRsLm1ldGEudDNbYS50b0Z1bGxTdHJpbmcoKV1bcmVsLnRvRnVsbFN0cmluZygpXTtcclxuICAgIGlmICghcmVzKSB7XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHJlcykuc29ydCgpLm1hcChNZXRhRi5wYXJzZUlNZXRhKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrRG9tYWluUHJlc2VudCh0aGVNb2RlbDogSU1hdGNoLklNb2RlbHMsIGRvbWFpbjogc3RyaW5nKSB7XHJcbiAgICBpZiAodGhlTW9kZWwuZG9tYWlucy5pbmRleE9mKGRvbWFpbikgPCAwKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRG9tYWluIFxcXCJcIiArIGRvbWFpbiArIFwiXFxcIiBub3QgcGFydCBvZiBtb2RlbFwiKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFNob3dVUklDYXRlZ29yaWVzRm9yRG9tYWluKHRoZU1vZGVsIDogSU1hdGNoLklNb2RlbHMsIGRvbWFpbiA6IHN0cmluZykgOiBzdHJpbmdbXSB7XHJcbiAgICBjaGVja0RvbWFpblByZXNlbnQodGhlTW9kZWwsIGRvbWFpbik7XHJcbiAgICB2YXIgbW9kZWxOYW1lID0gZ2V0TW9kZWxOYW1lRm9yRG9tYWluKHRoZU1vZGVsLm1vbmdvSGFuZGxlLGRvbWFpbik7XHJcbiAgICB2YXIgYWxsY2F0cyA9IGdldFJlc3VsdEFzQXJyYXkodGhlTW9kZWwsIE1ldGFGLkRvbWFpbihkb21haW4pLCBNZXRhRi5SZWxhdGlvbihNZXRhLlJFTEFUSU9OX2hhc0NhdGVnb3J5KSk7XHJcbiAgICB2YXIgZG9jID0gdGhlTW9kZWwubW9uZ29IYW5kbGUubW9kZWxEb2NzW21vZGVsTmFtZV07XHJcbiAgICB2YXIgcmVzID0gZG9jLl9jYXRlZ29yaWVzLmZpbHRlciggY2F0ID0+IGNhdC5zaG93VVJJICkubWFwKGNhdCA9PiBjYXQuY2F0ZWdvcnkpO1xyXG4gICAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFNob3dVUklSYW5rQ2F0ZWdvcmllc0ZvckRvbWFpbih0aGVNb2RlbCA6IElNYXRjaC5JTW9kZWxzLCBkb21haW4gOiBzdHJpbmcpIDogc3RyaW5nW10ge1xyXG4gICAgY2hlY2tEb21haW5QcmVzZW50KHRoZU1vZGVsLCBkb21haW4pO1xyXG4gICAgdmFyIG1vZGVsTmFtZSA9IGdldE1vZGVsTmFtZUZvckRvbWFpbih0aGVNb2RlbC5tb25nb0hhbmRsZSxkb21haW4pO1xyXG4gICAgdmFyIGFsbGNhdHMgPSBnZXRSZXN1bHRBc0FycmF5KHRoZU1vZGVsLCBNZXRhRi5Eb21haW4oZG9tYWluKSwgTWV0YUYuUmVsYXRpb24oTWV0YS5SRUxBVElPTl9oYXNDYXRlZ29yeSkpO1xyXG4gICAgdmFyIGRvYyA9IHRoZU1vZGVsLm1vbmdvSGFuZGxlLm1vZGVsRG9jc1ttb2RlbE5hbWVdO1xyXG4gICAgdmFyIHJlcyA9IGRvYy5fY2F0ZWdvcmllcy5maWx0ZXIoIGNhdCA9PiBjYXQuc2hvd1VSSVJhbmsgKS5tYXAoY2F0ID0+IGNhdC5jYXRlZ29yeSk7XHJcbiAgICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2F0ZWdvcmllc0ZvckRvbWFpbih0aGVNb2RlbDogSU1hdGNoLklNb2RlbHMsIGRvbWFpbjogc3RyaW5nKTogc3RyaW5nW10ge1xyXG4gICAgY2hlY2tEb21haW5QcmVzZW50KHRoZU1vZGVsLCBkb21haW4pO1xyXG4gICAgdmFyIHJlcyA9IGdldFJlc3VsdEFzQXJyYXkodGhlTW9kZWwsIE1ldGFGLkRvbWFpbihkb21haW4pLCBNZXRhRi5SZWxhdGlvbihNZXRhLlJFTEFUSU9OX2hhc0NhdGVnb3J5KSk7XHJcbiAgICByZXR1cm4gTWV0YS5nZXRTdHJpbmdBcnJheShyZXMpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGFibGVDb2x1bW5zKHRoZU1vZGVsOiBJTWF0Y2guSU1vZGVscywgZG9tYWluOiBzdHJpbmcpOiBzdHJpbmdbXSB7XHJcbiAgICBjaGVja0RvbWFpblByZXNlbnQodGhlTW9kZWwsIGRvbWFpbik7XHJcbiAgICByZXR1cm4gdGhlTW9kZWwucmF3TW9kZWxzW2RvbWFpbl0uY29sdW1ucy5zbGljZSgwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZm9yY2VHQygpIHtcclxuICAgIGlmIChnbG9iYWwgJiYgZ2xvYmFsLmdjKSB7XHJcbiAgICAgICAgZ2xvYmFsLmdjKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm4gYWxsIGNhdGVnb3JpZXMgb2YgYSBkb21haW4gd2hpY2ggY2FuIGFwcGVhciBvbiBhIHdvcmQsXHJcbiAqIHRoZXNlIGFyZSB0eXBpY2FsbHkgdGhlIHdvcmRpbmRleCBkb21haW5zICsgZW50cmllcyBnZW5lcmF0ZWQgYnkgZ2VuZXJpYyBydWxlc1xyXG4gKlxyXG4gKiBUaGUgY3VycmVudCBpbXBsZW1lbnRhdGlvbiBpcyBhIHNpbXBsaWZpY2F0aW9uXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UG90ZW50aWFsV29yZENhdGVnb3JpZXNGb3JEb21haW4odGhlTW9kZWw6IElNYXRjaC5JTW9kZWxzLCBkb21haW46IHN0cmluZyk6IHN0cmluZ1tdIHtcclxuICAgIC8vIHRoaXMgaXMgYSBzaW1wbGlmaWVkIHZlcnNpb25cclxuICAgIHJldHVybiBnZXRDYXRlZ29yaWVzRm9yRG9tYWluKHRoZU1vZGVsLCBkb21haW4pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RG9tYWluc0ZvckNhdGVnb3J5KHRoZU1vZGVsOiBJTWF0Y2guSU1vZGVscywgY2F0ZWdvcnk6IHN0cmluZyk6IHN0cmluZ1tdIHtcclxuICAgIGlmICh0aGVNb2RlbC5jYXRlZ29yeS5pbmRleE9mKGNhdGVnb3J5KSA8IDApIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYXRlZ29yeSBcXFwiXCIgKyBjYXRlZ29yeSArIFwiXFxcIiBub3QgcGFydCBvZiBtb2RlbFwiKTtcclxuICAgIH1cclxuICAgIHZhciByZXMgPSBnZXRSZXN1bHRBc0FycmF5KHRoZU1vZGVsLCBNZXRhRi5DYXRlZ29yeShjYXRlZ29yeSksIE1ldGFGLlJlbGF0aW9uKE1ldGEuUkVMQVRJT05faXNDYXRlZ29yeU9mKSk7XHJcbiAgICByZXR1cm4gTWV0YS5nZXRTdHJpbmdBcnJheShyZXMpO1xyXG59XHJcblxyXG4vKlxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsUmVjb3JkQ2F0ZWdvcmllc0ZvclRhcmdldENhdGVnb3J5KG1vZGVsOiBJTWF0Y2guSU1vZGVscywgY2F0ZWdvcnk6IHN0cmluZywgd29yZHNvbmx5OiBib29sZWFuKTogeyBba2V5OiBzdHJpbmddOiBib29sZWFuIH0ge1xyXG4gICAgdmFyIHJlcyA9IHt9O1xyXG4gICAgLy9cclxuICAgIHZhciBmbiA9IHdvcmRzb25seSA/IGdldFBvdGVudGlhbFdvcmRDYXRlZ29yaWVzRm9yRG9tYWluIDogZ2V0Q2F0ZWdvcmllc0ZvckRvbWFpbjtcclxuICAgIHZhciBkb21haW5zID0gZ2V0RG9tYWluc0ZvckNhdGVnb3J5KG1vZGVsLCBjYXRlZ29yeSk7XHJcbiAgICBkb21haW5zLmZvckVhY2goZnVuY3Rpb24gKGRvbWFpbikge1xyXG4gICAgICAgIGZuKG1vZGVsLCBkb21haW4pLmZvckVhY2goZnVuY3Rpb24gKHdvcmRjYXQpIHtcclxuICAgICAgICAgICAgcmVzW3dvcmRjYXRdID0gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gICAgT2JqZWN0LmZyZWV6ZShyZXMpO1xyXG4gICAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEFsbFJlY29yZENhdGVnb3JpZXNGb3JUYXJnZXRDYXRlZ29yaWVzKG1vZGVsOiBJTWF0Y2guSU1vZGVscywgY2F0ZWdvcmllczogc3RyaW5nW10sIHdvcmRzb25seTogYm9vbGVhbik6IHsgW2tleTogc3RyaW5nXTogYm9vbGVhbiB9IHtcclxuICAgIHZhciByZXMgPSB7fTtcclxuICAgIC8vXHJcbiAgICB2YXIgZm4gPSB3b3Jkc29ubHkgPyBnZXRQb3RlbnRpYWxXb3JkQ2F0ZWdvcmllc0ZvckRvbWFpbiA6IGdldENhdGVnb3JpZXNGb3JEb21haW47XHJcbiAgICB2YXIgZG9tYWlucyA9IHVuZGVmaW5lZDtcclxuICAgIGNhdGVnb3JpZXMuZm9yRWFjaChmdW5jdGlvbiAoY2F0ZWdvcnkpIHtcclxuICAgICAgICB2YXIgY2F0ZG9tYWlucyA9IGdldERvbWFpbnNGb3JDYXRlZ29yeShtb2RlbCwgY2F0ZWdvcnkpXHJcbiAgICAgICAgaWYgKCFkb21haW5zKSB7XHJcbiAgICAgICAgICAgIGRvbWFpbnMgPSBjYXRkb21haW5zO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGRvbWFpbnMgPSBfLmludGVyc2VjdGlvbihkb21haW5zLCBjYXRkb21haW5zKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIGlmIChkb21haW5zLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2F0ZWdvcmllcyAnICsgVXRpbHMubGlzdFRvUXVvdGVkQ29tbWFBbmQoY2F0ZWdvcmllcykgKyAnIGhhdmUgbm8gY29tbW9uIGRvbWFpbi4nKVxyXG4gICAgfVxyXG4gICAgZG9tYWlucy5mb3JFYWNoKGZ1bmN0aW9uIChkb21haW4pIHtcclxuICAgICAgICBmbihtb2RlbCwgZG9tYWluKS5mb3JFYWNoKGZ1bmN0aW9uICh3b3JkY2F0KSB7XHJcbiAgICAgICAgICAgIHJlc1t3b3JkY2F0XSA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICAgIE9iamVjdC5mcmVlemUocmVzKTtcclxuICAgIHJldHVybiByZXM7XHJcbn1cclxuKi9cclxuXHJcbi8qKlxyXG4gKiBnaXZlbmEgIHNldCAgb2YgY2F0ZWdvcmllcywgcmV0dXJuIGEgc3RydWN0dXJlXHJcbiAqXHJcbiAqXHJcbiAqIHsgZG9tYWlucyA6IFtcIkRPTUFJTjFcIiwgXCJET01BSU4yXCJdLFxyXG4gKiAgIGNhdGVnb3J5U2V0IDogeyAgIGNhdDEgOiB0cnVlLCBjYXQyIDogdHJ1ZSwgLi4ufVxyXG4gKiB9XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RG9tYWluQ2F0ZWdvcnlGaWx0ZXJGb3JUYXJnZXRDYXRlZ29yaWVzKG1vZGVsOiBJTWF0Y2guSU1vZGVscywgY2F0ZWdvcmllczogc3RyaW5nW10sIHdvcmRzb25seTogYm9vbGVhbik6IElNYXRjaC5JRG9tYWluQ2F0ZWdvcnlGaWx0ZXIge1xyXG4gICAgdmFyIHJlcyA9IHt9O1xyXG4gICAgLy9cclxuICAgIHZhciBmbiA9IHdvcmRzb25seSA/IGdldFBvdGVudGlhbFdvcmRDYXRlZ29yaWVzRm9yRG9tYWluIDogZ2V0Q2F0ZWdvcmllc0ZvckRvbWFpbjtcclxuICAgIHZhciBkb21haW5zID0gdW5kZWZpbmVkIGFzIHN0cmluZ1tdO1xyXG4gICAgY2F0ZWdvcmllcy5mb3JFYWNoKGZ1bmN0aW9uIChjYXRlZ29yeSkge1xyXG4gICAgICAgIHZhciBjYXRkb21haW5zID0gZ2V0RG9tYWluc0ZvckNhdGVnb3J5KG1vZGVsLCBjYXRlZ29yeSlcclxuICAgICAgICBpZiAoIWRvbWFpbnMpIHtcclxuICAgICAgICAgICAgZG9tYWlucyA9IGNhdGRvbWFpbnM7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZG9tYWlucyA9IF8uaW50ZXJzZWN0aW9uKGRvbWFpbnMsIGNhdGRvbWFpbnMpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgaWYgKGRvbWFpbnMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYXRlZ29yaWVzICcgKyBVdGlscy5saXN0VG9RdW90ZWRDb21tYUFuZChjYXRlZ29yaWVzKSArICcgaGF2ZSBubyBjb21tb24gZG9tYWluLicpXHJcbiAgICB9XHJcbiAgICBkb21haW5zLmZvckVhY2goZnVuY3Rpb24gKGRvbWFpbikge1xyXG4gICAgICAgIGZuKG1vZGVsLCBkb21haW4pLmZvckVhY2goZnVuY3Rpb24gKHdvcmRjYXQpIHtcclxuICAgICAgICAgICAgcmVzW3dvcmRjYXRdID0gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gICAgT2JqZWN0LmZyZWV6ZShyZXMpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBkb21haW5zOiBkb21haW5zLFxyXG4gICAgICAgIGNhdGVnb3J5U2V0OiByZXNcclxuICAgIH07XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RG9tYWluQ2F0ZWdvcnlGaWx0ZXJGb3JUYXJnZXRDYXRlZ29yeShtb2RlbDogSU1hdGNoLklNb2RlbHMsIGNhdGVnb3J5OiBzdHJpbmcsIHdvcmRzb25seTogYm9vbGVhbik6IElNYXRjaC5JRG9tYWluQ2F0ZWdvcnlGaWx0ZXIge1xyXG4gICAgcmV0dXJuIGdldERvbWFpbkNhdGVnb3J5RmlsdGVyRm9yVGFyZ2V0Q2F0ZWdvcmllcyhtb2RlbCwgW2NhdGVnb3J5XSwgd29yZHNvbmx5KTtcclxufVxyXG5cclxuXHJcbiJdfQ==
