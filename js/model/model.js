"use strict";
/**
 * Functionality managing the match models
 *
 * @file
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDomainCategoryFilterForTargetCategory = exports.getDomainCategoryFilterForTargetCategories = exports.getDomainsForCategory = exports.getPotentialWordCategoriesForDomain = exports.getTableColumns = exports.getCategoriesForDomain = exports.getShowURIRankCategoriesForDomain = exports.getShowURICategoriesForDomain = exports.checkDomainPresent = exports.getResultAsArray = exports.getOperator = exports.rankCategoryByImportance = exports.sortCategoriesByImportance = exports._loadModelsFull = exports.loadModels = exports.loadModelsOpeningConnection = exports.LoadModels = exports.releaseModel = exports.readOperators = exports.readFillers = exports.addCloseExactRangeRules = exports.addRangeRulesUnlessPresent = exports.findNextLen = exports.sortFlatRecords = exports.splitRules = exports.getDomainsForBitField = exports.getDomainBitIndexSafe = exports.getDomainBitIndex = exports.getAllDomainsBitIndex = exports.loadModel = exports.hasRuleWithFact = exports.readFileAsJSON = exports.addBestSplit = exports.getCategoryRec = exports.getDistinctValues = exports.getExpandedRecordsForCategory = exports.getExpandedRecordsSome = exports.getExpandedRecordsFirst = exports.checkModelMongoMap = exports.filterRemapCategories2 = exports.filterRemapCategories = exports.getDomainForModelName = exports.getModelNameForDomain = exports.getModelForDomain = exports.getModelForModelName = exports.getMongooseModelNameForDomain = exports.getMongoCollectionNameForDomain = exports.getFactSynonyms = exports.getModelHandle = exports.getModelData = exports.asPromise = exports.propagateTypeToModelDoc = exports.cmpTools = void 0;
//import * as intf from 'constants';
const debugf = require("debugf");
var debuglog = debugf('model');
const SrcHandle = require("./srchandle");
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
function getModelHandle(srcHandle, modelPath) {
    var res = {
        srcHandle: srcHandle,
        modelDocs: {},
        modelESchemas: {},
        mongoMaps: {}
    };
    //var modelES = Schemaload.getExtendedSchemaModel(srcHandle);
    return srcHandle.connect(modelPath).then(() => {
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
function getDomainForModelName(models, modelName) {
    var _a;
    var handle = models.mongoHandle;
    var res = (_a = handle.modelDocs[modelName]) === null || _a === void 0 ? void 0 : _a.domain;
    if (res == null) {
        throw " this is not a modelName " + modelName;
    }
    return res;
}
exports.getDomainForModelName = getDomainForModelName;
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
    return srchandle_1.applyProject(records, project, []);
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
/**
 * Unwraps array, retaining the *FIRST* member of an array,
 * note that the result is indexed by { category : member }
 * @param theModel
 * @param domain
 */
function getExpandedRecordsFirst(theModel, domain) {
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
exports.getExpandedRecordsFirst = getExpandedRecordsFirst;
function getExpandedRecordsSome(theModel, domain, categories, keepAsArray) {
    var mongoHandle = theModel.mongoHandle;
    var modelname = getModelNameForDomain(theModel.mongoHandle, domain);
    debuglog(() => ` modelname for ${domain} is ${modelname}`);
    var model = mongoHandle.srcHandle.model(modelname);
    var mongoMap = mongoHandle.mongoMaps[modelname];
    debuglog(() => 'here the mongomap' + JSON.stringify(mongoMap, undefined, 2));
    var p = checkModelMongoMap(model, modelname, mongoMap);
    debuglog(() => ` here the modelmap for ${domain} is ${JSON.stringify(mongoMap, undefined, 2)}`);
    // construct the flattened recordlist, retaining the 
    var project = {};
    categories.forEach(cat => {
        var cn = mongoMap[cat].shortName;
        project[cn] = mongoMap[cat].fullpath;
    });
    var query = [{ $project: project, $keepAsArray: keepAsArray }];
    console.log(" Project for " + modelname + " is " + JSON.stringify(query, undefined, 2));
    var res = theModel.mongoHandle.srcHandle.model(modelname).aggregate(query);
    console.log(JSON.stringify(res, undefined, 2));
    // now remap towards categories? 
    return res.then(rs => rs.map(rec => {
        var rn = {};
        categories.forEach(cat => {
            var cn = mongoMap[cat].shortName;
            rn[cat] = rec[cn];
        });
        return rn;
    }));
}
exports.getExpandedRecordsSome = getExpandedRecordsSome;
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
    oModel.rawModelByDomain[oMdl.domain] = oMdl;
    oModel.rawModelByModelName[oMdl.modelname] = oMdl;
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
function LoadModels(modelPath) {
    var srcHandle = SrcHandle.createSourceHandle();
    if (modelPath == './testmodel') {
        modelPath = __dirname + '/../../testmodel';
    }
    if (modelPath == './testmodel2') {
        modelPath = __dirname + "/../../testmodel2";
    }
    console.log(' modelpath ' + modelPath);
    return loadModelsOpeningConnection(srcHandle, modelPath);
}
exports.LoadModels = LoadModels;
/**
 * @deprecated use LoadModels
 * @param srchandle
 * @param modelPath
 */
function loadModelsOpeningConnection(srchandle, modelPath) {
    return loadModels(srchandle, modelPath);
}
exports.loadModelsOpeningConnection = loadModelsOpeningConnection;
/**
 * @param srcHandle
 * @param modelPath
 */
function loadModels(srcHandle, modelPath) {
    if (srcHandle === undefined) {
        throw new Error('expect a srcHandle handle to be passed');
    }
    return getModelHandle(srcHandle, modelPath).then((modelHandle) => {
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
        rawModelByDomain: {},
        rawModelByModelName: {},
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
        if (a && !process.env.NLQ_ABOT_NO_FILECACHE) {
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
    var modelName = getModelNameForDomain(theModel.mongoHandle, domain);
    return theModel.mongoHandle.modelDocs[modelName].columns.slice(0);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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T0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ3hCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDSCxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ25CLE9BQU87UUFDSCxPQUFPLEVBQUUsT0FBTztRQUNoQixXQUFXLEVBQUUsR0FBRztLQUNuQixDQUFDO0FBQ04sQ0FBQztBQTFCRCxnR0EwQkM7QUFHRCxTQUFnQix3Q0FBd0MsQ0FBQyxLQUFxQixFQUFFLFFBQWdCLEVBQUUsU0FBa0I7SUFDaEgsT0FBTywwQ0FBMEMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUNwRixDQUFDO0FBRkQsNEZBRUMiLCJmaWxlIjoibW9kZWwvbW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogRnVuY3Rpb25hbGl0eSBtYW5hZ2luZyB0aGUgbWF0Y2ggbW9kZWxzXHJcbiAqXHJcbiAqIEBmaWxlXHJcbiAqL1xyXG5cclxuLy9pbXBvcnQgKiBhcyBpbnRmIGZyb20gJ2NvbnN0YW50cyc7XHJcbmltcG9ydCAqIGFzIGRlYnVnZiBmcm9tICdkZWJ1Z2YnO1xyXG5cclxudmFyIGRlYnVnbG9nID0gZGVidWdmKCdtb2RlbCcpO1xyXG5cclxuaW1wb3J0IHsgSUZNb2RlbCBhcyBJRk1vZGVsfSBmcm9tICcuL2luZGV4X21vZGVsJztcclxuaW1wb3J0ICogYXMgU3JjSGFuZGxlIGZyb20gJy4vc3JjaGFuZGxlJztcclxuXHJcbmltcG9ydCB7IGFwcGx5UHJvamVjdCwgSVBzZXVkb01vZGVsLCBJU3JjSGFuZGxlLCBJU3lub255bX0gZnJvbSAnLi9zcmNoYW5kbGUnO1xyXG5cclxuLy8gdGhlIGhhcmRjb2RlZCBkb21haW4gbWV0YW1vZGVsIVxyXG5jb25zdCBET01BSU5fTUVUQU1PREVMID0gJ21ldGFtb2RlbCc7XHJcblxyXG4vL2NvbnN0IGxvYWRsb2cgPSBsb2dnZXIubG9nZ2VyKCdtb2RlbGxvYWQnLCAnJyk7XHJcblxyXG5cclxuaW1wb3J0ICogIGFzIElNYXRjaCBmcm9tICcuLi9tYXRjaC9pZm1hdGNoJztcclxuaW1wb3J0ICogYXMgSW5wdXRGaWx0ZXJSdWxlcyBmcm9tICcuLi9tYXRjaC9ydWxlJztcclxuLy9pbXBvcnQgKiBhcyBUb29scyBmcm9tICcuLi9tYXRjaC90b29scyc7XHJcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcclxuaW1wb3J0ICogYXMgTWV0YSBmcm9tICcuL21ldGEnO1xyXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICdhYm90X3V0aWxzJztcclxuaW1wb3J0ICogYXMgQ2lyY3VsYXJTZXIgZnJvbSAnYWJvdF91dGlscyc7XHJcbmltcG9ydCAqIGFzIERpc3RhbmNlIGZyb20gJ2Fib3Rfc3RyaW5nZGlzdCc7XHJcbmltcG9ydCAqIGFzIHByb2Nlc3MgZnJvbSAncHJvY2Vzcyc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcclxuXHJcbi8vaW1wb3J0ICogYXMgSVNjaGVtYSBmcm9tICcuLi9tb2RlbGxvYWQvc2NoZW1hbG9hZCc7XHJcbmltcG9ydCAqIGFzIFNjaGVtYWxvYWQgZnJvbSAnLi4vbW9kZWxsb2FkL3NjaGVtYWxvYWQnO1xyXG5pbXBvcnQgKiBhcyBNb25nb01hcCBmcm9tICcuL21vbmdvbWFwJztcclxuXHJcbi8qKlxyXG4gKiB0aGUgbW9kZWwgcGF0aCwgbWF5IGJlIGNvbnRyb2xsZWQgdmlhIGVudmlyb25tZW50IHZhcmlhYmxlXHJcbiAqL1xyXG52YXIgZW52TW9kZWxQYXRoID0gcHJvY2Vzcy5lbnZbXCJBQk9UX01PREVMUEFUSFwiXSB8fCBcIm5vZGVfbW9kdWxlcy9tZ25scV90ZXN0bW9kZWwvdGVzdG1vZGVsXCI7XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNtcFRvb2xzKGE6IElNYXRjaC5JVG9vbCwgYjogSU1hdGNoLklUb29sKSB7XHJcbiAgICByZXR1cm4gYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKTtcclxufVxyXG5cclxudHlwZSBJTW9kZWwgPSBJTWF0Y2guSU1vZGVsO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHByb3BhZ2F0ZVR5cGVUb01vZGVsRG9jKCBtb2RlbERvYyA6IElGTW9kZWwuSU1vZGVsRG9jLCBlc2NoZW1hIDogSUZNb2RlbC5JRXh0ZW5kZWRTY2hlbWEgKSB7XHJcbiAgICAvLyBwcm9wcyB7IFwiZWxlbWVudF9zeW1ib2xcIjp7XCJ0eXBlXCI6XCJTdHJpbmdcIixcInRyaW1cIjp0cnVlLFwiX21fY2F0ZWdvcnlcIjpcImVsZW1lbnQgc3ltYm9sXCIsXCJ7XHJcbiAgICBtb2RlbERvYy5fY2F0ZWdvcmllcy5mb3JFYWNoKCBjYXQgPT4ge1xyXG4gICAgICAgIHZhciBwcm9wZXJ0eU5hbWUgPSBNb25nb01hcC5tYWtlQ2Fub25pY1Byb3BlcnR5TmFtZShjYXQuY2F0ZWdvcnkpOyBcclxuICAgICAgICB2YXIgcHJvcCA9IE1vbmdvTWFwLmZpbmRFc2NoZW1hUHJvcEZvckNhdGVnb3J5KGVzY2hlbWEucHJvcHMsIGNhdC5jYXRlZ29yeSk7XHJcbiAgICAgICAgaWYgKCAhcHJvcCkge1xyXG4gICAgICAgICAgICBpZiggbW9kZWxEb2MubW9kZWxuYW1lICE9PSBcIm1ldGFtWFhYb2RlbHNcIikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGVyciA9IFxyXG4gICAgICAgICAgICAgICBcIlVuYWJsZSB0byBmaW5kIHByb3BlcnR5IFwiICsgcHJvcGVydHlOYW1lICsgXCIgZm9yIGNhdGVnb3J5IFwiICsgY2F0LmNhdGVnb3J5ICsgXCIgaW4gbW9kZWwgXCIgXHJcbiAgICAgICAgICAgICAgICArIG1vZGVsRG9jLm1vZGVsbmFtZVxyXG4gICAgICAgICAgICAgICAgKyBcIjsgdmFsaWQgcHJvcHMgYXJlOlxcXCJcIiArIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGVzY2hlbWEucHJvcHMpLmpvaW4oXCIsXFxuXCIpICsgXCJcXFwiXCIgXHJcbiAgICAgICAgICAgICAgICAgKyBcIiBcIiArIEpTT04uc3RyaW5naWZ5KGVzY2hlbWEucHJvcHMpO1xyXG4gICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XHJcbiAgICAgICAgICAgICAgICAgZGVidWdsb2coZXJyKTtcclxuICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGRlYnVnbG9nKCcgYXVnbWVudGluZyB0eXBlIGZvciBcXFwiJyArIGNhdC5jYXRlZ29yeSArIFwiKFwiICsgcHJvcGVydHlOYW1lICsgXCIpXFxcIiB3aXRoIFwiICsgSlNPTi5zdHJpbmdpZnkocHJvcC50eXBlKSk7XHJcbiAgICAgICAgICAgIGNhdC50eXBlID0gcHJvcC50eXBlOyAvLyB0aGlzIG1heSBiZSBbXCJTdHJpbmdcIl0gZm9yIGFuIGFycmF5IHR5cGUhXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhc1Byb21pc2UoYSA6IGFueSkgOiBQcm9taXNlPGFueT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKCAocmVzb2x2ZSxyZWplY3QpID0+IHsgcmVzb2x2ZShhKTt9ICk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRNb2RlbERhdGEoc3JjSGFuZGxlOiBJU3JjSGFuZGxlLCBtb2RlbE5hbWU6IHN0cmluZywgbW9kZWxOYW1lcyA6IHN0cmluZ1tdKSA6IFByb21pc2U8YW55PiB7XHJcbiAgICBpZiggbW9kZWxOYW1lID09IFwibWV0YW1vZGVsc1wiICkge1xyXG4gICAgICAgIHJldHVybiBhc1Byb21pc2UobW9kZWxOYW1lcy5maWx0ZXIoIChhKSA9PiAoYSAhPT0gXCJtZXRhbW9kZWxzXCIpKS5tYXAoIChhKSA9PiByZWFkRmlsZUFzSlNPTihzcmNIYW5kbGUuZ2V0UGF0aCgpICsgYSArICcubW9kZWwuZG9jLmpzb24nKSkpO1xyXG4gICAgfSBlbHNlIHsgIFxyXG4gICAgICAgIHJldHVybiBzcmNIYW5kbGUuZ2V0SlNPTihtb2RlbE5hbWUgKyBcIi5kYXRhLmpzb25cIilcclxuICAgIH1cclxufVxyXG4vKipcclxuICogcmV0dXJucyB3aGVuIGFsbCBtb2RlbHMgYXJlIGxvYWRlZCBhbmQgYWxsIG1vZGVsZG9jcyBhcmUgbWFkZVxyXG4gKiBAcGFyYW0gc3JjSGFuZGxlXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9kZWxIYW5kbGUoc3JjSGFuZGxlOiBJU3JjSGFuZGxlLCBtb2RlbFBhdGggOiBzdHJpbmcpOiBQcm9taXNlPElNYXRjaC5JTW9kZWxIYW5kbGVSYXc+IHtcclxuICAgIHZhciByZXMgPSB7XHJcbiAgICAgICAgc3JjSGFuZGxlOiBzcmNIYW5kbGUsXHJcbiAgICAgICAgbW9kZWxEb2NzOiB7fSxcclxuICAgICAgICBtb2RlbEVTY2hlbWFzOiB7fSxcclxuICAgICAgICBtb25nb01hcHM6IHt9XHJcbiAgICB9IGFzIElNYXRjaC5JTW9kZWxIYW5kbGVSYXc7XHJcbiAgICAvL3ZhciBtb2RlbEVTID0gU2NoZW1hbG9hZC5nZXRFeHRlbmRlZFNjaGVtYU1vZGVsKHNyY0hhbmRsZSk7XHJcbiAgICByZXR1cm4gc3JjSGFuZGxlLmNvbm5lY3QobW9kZWxQYXRoKS50aGVuKCAoKSA9PntcclxuICAgIHZhciBtb2RlbG5hbWVzID0gc3JjSGFuZGxlLm1vZGVsTmFtZXMoKTsgXHJcbiAgICAvL3JldHVybiBtb2RlbEVTLmRpc3RpbmN0KCdtb2RlbG5hbWUnKS50aGVuKFxyXG4gICAgLy92YXIgZm4gPSAobW9kZWxuYW1lcykgPT4ge1xyXG4gICAgIGRlYnVnbG9nKCgpID0+ICdoZXJlIGRpc3RpbmN0IG1vZGVsbmFtZXMgJyArIEpTT04uc3RyaW5naWZ5KG1vZGVsbmFtZXMpKTtcclxuICAgICByZXR1cm4gUHJvbWlzZS5hbGwobW9kZWxuYW1lcy5tYXAoZnVuY3Rpb24gKG1vZGVsbmFtZSkge1xyXG4gICAgICAgICAgICBkZWJ1Z2xvZygoKSA9PiAnY3JlYXRpbmcgdHJpcGVsIGZvciAnICsgbW9kZWxuYW1lKTtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFtTY2hlbWFsb2FkLmdldEV4dGVuZFNjaGVtYURvY0Zyb21EQihzcmNIYW5kbGUsIG1vZGVsbmFtZSksXHJcbiAgICAgICAgICAgIFNjaGVtYWxvYWQuZ2V0TW9kZWxEb2NGcm9tREIoc3JjSGFuZGxlLCBtb2RlbG5hbWUpLCBcclxuICAgICAgICAgICAgZ2V0TW9kZWxEYXRhKHNyY0hhbmRsZSxtb2RlbG5hbWUsIG1vZGVsbmFtZXMpXHJcbiAgICAgICAgXSkudGhlbihcclxuICAgICAgICAgICAgICAgICh2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlYnVnbG9nKCgpID0+ICdhdHRlbXB0aW5nIHRvIGxvYWQgJyArIG1vZGVsbmFtZSArICcgdG8gY3JlYXRlIG1vbmdvbWFwJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIFtleHRlbmRlZFNjaGVtYSwgbW9kZWxEb2MsIGRhdGFdID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzLm1vZGVsRVNjaGVtYXNbbW9kZWxuYW1lXSA9IGV4dGVuZGVkU2NoZW1hO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcy5tb2RlbERvY3NbbW9kZWxuYW1lXSA9IG1vZGVsRG9jO1xyXG4gICAgICAgICAgICAgICAgICAgIHByb3BhZ2F0ZVR5cGVUb01vZGVsRG9jKG1vZGVsRG9jLGV4dGVuZGVkU2NoZW1hKTtcclxuICAgICAgICAgICAgICAgICAgICBzcmNIYW5kbGUuc2V0TW9kZWwobW9kZWxuYW1lLGRhdGEsZXh0ZW5kZWRTY2hlbWEpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8qICBpZiAoIG1vZGVsbmFtZSA9PSBcIml1cGFjc1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgZGVidWdsb2coJyBtb2RlbGRvY3MgaXMgJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgZGVidWdsb2coJyBoZXJlICcgKyBKU09OLnN0cmluZ2lmeShtb2RlbERvYykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgIGRlYnVnbG9nKCcgaGVyZSAnICsgSlNPTi5zdHJpbmdpZnkoZXh0ZW5kZWRTY2hlbWEpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnIG1vZGVsRG9jcyBpcyAnICsgSlNPTi5zdHJpbmdpZnkobW9kZWxEb2MpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnKioqIGVzc2NoZW1hIGlzICcgKyBKU09OLnN0cmluZ2lmeShleHRlbmRlZFNjaGVtYSkpO1xyXG4gICAgICAgICAgICAgICAgICAgfSovXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzLm1vbmdvTWFwc1ttb2RlbG5hbWVdID0gTW9uZ29NYXAubWFrZU1vbmdvTWFwKG1vZGVsRG9jLCBleHRlbmRlZFNjaGVtYSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVidWdsb2coKCk9PiAnY3JlYXRlZCBtb25nb21hcCBmb3IgJyArIG1vZGVsbmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgfSkpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIHJldHVybiByZXM7XHJcbiAgICB9KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RmFjdFN5bm9ueW1zKG1vbmdvSGFuZGxlOiBJTWF0Y2guSU1vZGVsSGFuZGxlUmF3LCBtb2RlbG5hbWU6IHN0cmluZyk6IFByb21pc2U8SVN5bm9ueW1bXT4ge1xyXG4gICAgdmFyIG1vZGVsID0gbW9uZ29IYW5kbGUuc3JjSGFuZGxlLm1vZGVsKG1vZGVsbmFtZSk7XHJcbiAgICByZXR1cm4gbW9kZWwuYWdncmVnYXRlU3lub255bXMoKTtcclxufVxyXG5cclxuLypcclxuZXhwb3J0IGludGVyZmFjZSBJU3lub255bUJlYXJpbmdEb2Mge1xyXG4gICAgX3N5bm9ueW1zOiBbe1xyXG4gICAgICAgIGNhdGVnb3J5OiBzdHJpbmcsXHJcbiAgICAgICAgZmFjdDogc3RyaW5nLFxyXG4gICAgICAgIHN5bm9ueW1zOiBzdHJpbmdbXVxyXG4gICAgfV1cclxufVxyXG4qL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vbmdvQ29sbGVjdGlvbk5hbWVGb3JEb21haW4odGhlTW9kZWw6IElNYXRjaC5JTW9kZWxzLCBkb21haW4gOiBzdHJpbmcpIDogc3RyaW5nIHtcclxuICAgIHZhciByID0gZ2V0TW9uZ29vc2VNb2RlbE5hbWVGb3JEb21haW4odGhlTW9kZWwsIGRvbWFpbik7XHJcbiAgICByZXR1cm4gU2NoZW1hbG9hZC5tYWtlTW9uZ29Db2xsZWN0aW9uTmFtZShyKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9uZ29vc2VNb2RlbE5hbWVGb3JEb21haW4odGhlTW9kZWwgOiBJTWF0Y2guSU1vZGVscywgZG9tYWluIDogc3RyaW5nKSA6IHN0cmluZyB7XHJcbiAgICB2YXIgciA9IGdldE1vZGVsTmFtZUZvckRvbWFpbih0aGVNb2RlbC5tb25nb0hhbmRsZSwgZG9tYWluKTtcclxuICAgIHJldHVybiByOyBcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vZGVsRm9yTW9kZWxOYW1lKHRoZU1vZGVsIDogSU1hdGNoLklNb2RlbHMsIG1vZGVsbmFtZTogc3RyaW5nKSA6IGFueSB7XHJcbiAgICByZXR1cm4gdGhlTW9kZWwubW9uZ29IYW5kbGUuc3JjSGFuZGxlLm1vZGVsKG1vZGVsbmFtZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRNb2RlbEZvckRvbWFpbih0aGVNb2RlbCA6IElNYXRjaC5JTW9kZWxzLCBkb21haW4gOiBzdHJpbmcpIDogYW55IHtcclxuICAgIHZhciBtb2RlbG5hbWUgPSBnZXRNb2RlbE5hbWVGb3JEb21haW4odGhlTW9kZWwubW9uZ29IYW5kbGUsIGRvbWFpbik7XHJcbiAgICByZXR1cm4gZ2V0TW9kZWxGb3JNb2RlbE5hbWUodGhlTW9kZWwsIG1vZGVsbmFtZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRNb2RlbE5hbWVGb3JEb21haW4oaGFuZGxlIDogSU1hdGNoLklNb2RlbEhhbmRsZVJhdywgZG9tYWluIDogc3RyaW5nKSA6IHN0cmluZyB7XHJcbiAgICB2YXIgcmVzID0gdW5kZWZpbmVkO1xyXG4gICAgT2JqZWN0LmtleXMoaGFuZGxlLm1vZGVsRG9jcykuZXZlcnkoIGtleSA9PiB7XHJcbiAgICAgICAgdmFyIGRvYyA9IGhhbmRsZS5tb2RlbERvY3Nba2V5XTtcclxuICAgICAgICBpZiAoIGtleSA9PSBkb21haW4pIHtcclxuICAgICAgICAgICAgcmVzID0ga2V5OyBcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoZG9tYWluID09PSBkb2MuZG9tYWluICYmIGRvYy5tb2RlbG5hbWUpIHtcclxuICAgICAgICAgICAgcmVzID0gZG9jLm1vZGVsbmFtZTsgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAhcmVzO1xyXG4gICAgfSk7XHJcbiAgICBpZighcmVzKSB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoJ2F0dGVtcHQgdG8gcmV0cmlldmUgbW9kZWxOYW1lIGZvciB1bmtub3duIGRvbWFpbiAnICsgZG9tYWluKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXM7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RG9tYWluRm9yTW9kZWxOYW1lKG1vZGVscyA6IElNYXRjaC5JTW9kZWxzLCBtb2RlbE5hbWUgOiBzdHJpbmcpIDogc3RyaW5nIHtcclxuICAgIHZhciBoYW5kbGUgPSBtb2RlbHMubW9uZ29IYW5kbGU7XHJcbiAgICB2YXIgcmVzID0gaGFuZGxlLm1vZGVsRG9jc1ttb2RlbE5hbWVdPy5kb21haW47IFxyXG4gICAgaWYgKCByZXMgPT0gbnVsbCkge1xyXG4gICAgICAgIHRocm93IFwiIHRoaXMgaXMgbm90IGEgbW9kZWxOYW1lIFwiICsgbW9kZWxOYW1lOyBcclxuICAgIH1cclxuICAgIHJldHVybiByZXM7IFxyXG59XHJcblxyXG5mdW5jdGlvbiBhc3N1cmVEaXJFeGlzdHMoZGlyIDogc3RyaW5nKSB7XHJcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSl7XHJcbiAgICAgICAgZnMubWtkaXJTeW5jKGRpcik7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJSZW1hcENhdGVnb3JpZXMoIG1vbmdvTWFwIDogSU1hdGNoLkNhdE1vbmdvTWFwLCBjYXRlZ29yaWVzIDogc3RyaW5nW10sIHJlY29yZHMgOiBhbnlbXSApIDogYW55W10ge1xyXG4gICAgLy9cclxuICAgIC8vY29uc29sZS5sb2coJ2hlcmUgbWFwJyArIEpTT04uc3RyaW5naWZ5KG1vbmdvTWFwLHVuZGVmaW5lZCwyKSk7XHJcbiAgICByZXR1cm4gcmVjb3Jkcy5tYXAoKHJlYyxpbmRleCkgPT4ge1xyXG4gICAgICAgIHZhciByZXMgPSB7fTtcclxuICAgICAgICBjYXRlZ29yaWVzLmZvckVhY2goY2F0ZWdvcnkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgY2F0ZWdvcnlQYXRoID0gbW9uZ29NYXBbY2F0ZWdvcnldLnBhdGhzO1xyXG4gICAgICAgICAgICBpZighY2F0ZWdvcnlQYXRoKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gY2F0ZWdvcnkgJHtjYXRlZ29yeX0gbm90IHByZXNlbnQgaW4gJHtKU09OLnN0cmluZ2lmeShtb25nb01hcCx1bmRlZmluZWQsMil9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVzW2NhdGVnb3J5XSA9IE1vbmdvTWFwLmdldEZpcnN0TWVtYmVyQnlQYXRoKHJlYywgY2F0ZWdvcnlQYXRoKTtcclxuICAgICAgICAgICAgZGVidWdsb2coICgpPT4nZ290IG1lbWJlciBmb3IgJyAgKyBjYXRlZ29yeSArICcgZnJvbSByZWMgbm8gJyArIGluZGV4ICsgJyAnICsgSlNPTi5zdHJpbmdpZnkocmVjLHVuZGVmaW5lZCwyKSApO1xyXG4gICAgICAgICAgICBkZWJ1Z2xvZygoKT0+IEpTT04uc3RyaW5naWZ5KGNhdGVnb3J5UGF0aCkpO1xyXG4gICAgICAgICAgICBkZWJ1Z2xvZygoKT0+ICdyZXMgOiAnICsgcmVzW2NhdGVnb3J5XSApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiByZXM7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlclJlbWFwQ2F0ZWdvcmllczIoIG1vbmdvTWFwIDogSU1hdGNoLkNhdE1vbmdvTWFwLCBjYXRlZ29yaWVzIDogc3RyaW5nW10sIHJlY29yZHMgOiBhbnlbXSApIDogYW55W10ge1xyXG4gICAgLy8gY29uc3RydWN0IGEgcHJvamVjdFxyXG4gICAgdmFyIHByb2plY3QgPSB7fTtcclxuICAgIGNhdGVnb3JpZXMuZm9yRWFjaChjYXRlZ29yeSA9PiB7XHJcbiAgICAgICAgdmFyIGNhdGVnb3J5UGF0aCA9IG1vbmdvTWFwW2NhdGVnb3J5XS5mdWxscGF0aDtcclxuICAgICAgICBwcm9qZWN0W2NhdGVnb3J5XSA9IGNhdGVnb3J5UGF0aDtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIGFwcGx5UHJvamVjdChyZWNvcmRzLHByb2plY3QsW10pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tNb2RlbE1vbmdvTWFwKG1vZGVsOiBJUHNldWRvTW9kZWwsIG1vZGVsbmFtZSA6IHN0cmluZywgbW9uZ29NYXA6IElNYXRjaC5DYXRNb25nb01hcCwgY2F0ZWdvcnk/IDogc3RyaW5nKSB7XHJcbiAgICBpZiAoIW1vZGVsKSB7XHJcbiAgICAgICAgZGVidWdsb2coJyBubyBtb2RlbCBmb3IgJyArIG1vZGVsbmFtZSk7XHJcbiAvLyAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoYG1vZGVsICR7bW9kZWxuYW1lfSBub3QgZm91bmQgaW4gZGJgKTtcclxuICAgICAgICB0aHJvdyBFcnJvcihgbW9kZWwgJHttb2RlbG5hbWV9IG5vdCBmb3VuZCBpbiBkYmApO1xyXG4gICAgfVxyXG4gICAgaWYgKCFtb25nb01hcCkge1xyXG4gICAgICAgIGRlYnVnbG9nKCcgbm8gbW9uZ29NYXAgZm9yICcgKyBtb2RlbG5hbWUpO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgbW9kZWwgJHttb2RlbG5hbWV9IGhhcyBubyBtb2RlbG1hcGApO1xyXG4vLyAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGBtb2RlbCAke21vZGVsbmFtZX0gaGFzIG5vIG1vZGVsbWFwYCk7XHJcbiAgICB9XHJcbiAgICBpZiAoY2F0ZWdvcnkgJiYgIW1vbmdvTWFwW2NhdGVnb3J5XSkge1xyXG4gICAgICAgIGRlYnVnbG9nKCcgbm8gbW9uZ29NYXAgY2F0ZWdvcnkgZm9yICcgKyBtb2RlbG5hbWUpO1xyXG4gIC8vICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGBtb2RlbCAke21vZGVsbmFtZX0gaGFzIG5vIGNhdGVnb3J5ICR7Y2F0ZWdvcnl9YCk7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYG1vZGVsICR7bW9kZWxuYW1lfSBoYXMgbm8gY2F0ZWdvcnkgJHtjYXRlZ29yeX1gKTtcclxuICAgIH1cclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBVbndyYXBzIGFycmF5LCByZXRhaW5pbmcgdGhlICpGSVJTVCogbWVtYmVyIG9mIGFuIGFycmF5LCBcclxuICogbm90ZSB0aGF0IHRoZSByZXN1bHQgaXMgaW5kZXhlZCBieSB7IGNhdGVnb3J5IDogbWVtYmVyIH1cclxuICogQHBhcmFtIHRoZU1vZGVsIFxyXG4gKiBAcGFyYW0gZG9tYWluIFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEV4cGFuZGVkUmVjb3Jkc0ZpcnN0KHRoZU1vZGVsIDogSU1hdGNoLklNb2RlbHMsIGRvbWFpbiA6IHN0cmluZykgOiBQcm9taXNlPHsgW2tleSA6IHN0cmluZ10gOiBhbnl9PiB7XHJcbiAgICB2YXIgbW9uZ29IYW5kbGUgPSB0aGVNb2RlbC5tb25nb0hhbmRsZTtcclxuICAgIHZhciBtb2RlbG5hbWUgPSBnZXRNb2RlbE5hbWVGb3JEb21haW4odGhlTW9kZWwubW9uZ29IYW5kbGUsIGRvbWFpbik7XHJcbiAgICBkZWJ1Z2xvZygoKT0+YCBtb2RlbG5hbWUgZm9yICR7ZG9tYWlufSBpcyAke21vZGVsbmFtZX1gKTtcclxuICAgIHZhciBtb2RlbCA9IG1vbmdvSGFuZGxlLnNyY0hhbmRsZS5tb2RlbChtb2RlbG5hbWUpO1xyXG4gICAgdmFyIG1vbmdvTWFwID0gbW9uZ29IYW5kbGUubW9uZ29NYXBzW21vZGVsbmFtZV07XHJcbiAgICBkZWJ1Z2xvZygoKT0+ICdoZXJlIHRoZSBtb25nb21hcCcgKyBKU09OLnN0cmluZ2lmeShtb25nb01hcCx1bmRlZmluZWQsMikpO1xyXG4gICAgdmFyIHAgPSBjaGVja01vZGVsTW9uZ29NYXAobW9kZWwsbW9kZWxuYW1lLCBtb25nb01hcCk7XHJcbiAgICBkZWJ1Z2xvZygoKT0+YCBoZXJlIHRoZSBtb2RlbG1hcCBmb3IgJHtkb21haW59IGlzICR7SlNPTi5zdHJpbmdpZnkobW9uZ29NYXAsdW5kZWZpbmVkLDIpfWApO1xyXG4gICAgLy8gMSkgcHJvZHVjZSB0aGUgZmxhdHRlbmVkIHJlY29yZHNcclxuICAgIHZhciByZXMgPSBNb25nb01hcC51bndpbmRzRm9yTm9udGVybWluYWxBcnJheXMobW9uZ29NYXApO1xyXG4gICAgZGVidWdsb2coKCk9PidoZXJlIHRoZSB1bndpbmQgc3RhdGVtZW50ICcgKyBKU09OLnN0cmluZ2lmeShyZXMsdW5kZWZpbmVkLDIpKTtcclxuICAgIC8vIHdlIGhhdmUgdG8gdW53aW5kIGFsbCBjb21tb24gbm9uLXRlcm1pbmFsIGNvbGxlY3Rpb25zLlxyXG4gICAgZGVidWdsb2coKCk9PidoZXJlIHRoZSBtb2RlbCAnICsgbW9kZWwubW9kZWxuYW1lKTtcclxuICAgIHZhciBjYXRlZ29yaWVzID0gZ2V0Q2F0ZWdvcmllc0ZvckRvbWFpbih0aGVNb2RlbCwgZG9tYWluKTtcclxuICAgIGRlYnVnbG9nKCgpPT5gaGVyZSBjYXRlZ29yaWVzIGZvciAke2RvbWFpbn0gJHtjYXRlZ29yaWVzLmpvaW4oJzsnKX1gKTtcclxuICAgIGlmKHJlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXR1cm4gbW9kZWwuZmluZCh7fSkudGhlbigoIHVud291bmQgOiBhbnlbXSkgPT4ge1xyXG4gICAgICAgICAgICBkZWJ1Z2xvZygoKT0+J2hlcmUgcmVzJyArIEpTT04uc3RyaW5naWZ5KHVud291bmQpKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZpbHRlclJlbWFwQ2F0ZWdvcmllcyhtb25nb01hcCwgY2F0ZWdvcmllcywgdW53b3VuZClcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiBtb2RlbC5hZ2dyZWdhdGUocmVzKS50aGVuKCB1bndvdW5kID0+IHtcclxuICAgICAgICAvLyBmaWx0ZXIgZm9yIGFnZ3JlZ2F0ZVxyXG4gICAgICAgIGRlYnVnbG9nKCgpPT4naGVyZSByZXMnICsgSlNPTi5zdHJpbmdpZnkodW53b3VuZCkpO1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXJSZW1hcENhdGVnb3JpZXMobW9uZ29NYXAsIGNhdGVnb3JpZXMsIHVud291bmQpXHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHBhbmRlZFJlY29yZHNTb21lKHRoZU1vZGVsOiBJTWF0Y2guSU1vZGVscywgZG9tYWluIDogc3RyaW5nLCBjYXRlZ29yaWVzIDogc3RyaW5nW10sIGtlZXBBc0FycmF5IDogc3RyaW5nW10pIDogUHJvbWlzZTxhbnlbXT4ge1xyXG4gICAgdmFyIG1vbmdvSGFuZGxlID0gdGhlTW9kZWwubW9uZ29IYW5kbGU7XHJcbiAgICB2YXIgbW9kZWxuYW1lID0gZ2V0TW9kZWxOYW1lRm9yRG9tYWluKHRoZU1vZGVsLm1vbmdvSGFuZGxlLCBkb21haW4pO1xyXG4gICAgZGVidWdsb2coKCk9PmAgbW9kZWxuYW1lIGZvciAke2RvbWFpbn0gaXMgJHttb2RlbG5hbWV9YCk7XHJcbiAgICB2YXIgbW9kZWwgPSBtb25nb0hhbmRsZS5zcmNIYW5kbGUubW9kZWwobW9kZWxuYW1lKTtcclxuICAgIHZhciBtb25nb01hcCA9IG1vbmdvSGFuZGxlLm1vbmdvTWFwc1ttb2RlbG5hbWVdO1xyXG4gICAgZGVidWdsb2coKCk9PiAnaGVyZSB0aGUgbW9uZ29tYXAnICsgSlNPTi5zdHJpbmdpZnkobW9uZ29NYXAsdW5kZWZpbmVkLDIpKTtcclxuICAgIHZhciBwID0gY2hlY2tNb2RlbE1vbmdvTWFwKG1vZGVsLG1vZGVsbmFtZSwgbW9uZ29NYXApO1xyXG4gICAgZGVidWdsb2coKCk9PmAgaGVyZSB0aGUgbW9kZWxtYXAgZm9yICR7ZG9tYWlufSBpcyAke0pTT04uc3RyaW5naWZ5KG1vbmdvTWFwLHVuZGVmaW5lZCwyKX1gKTtcclxuICAgIC8vIGNvbnN0cnVjdCB0aGUgZmxhdHRlbmVkIHJlY29yZGxpc3QsIHJldGFpbmluZyB0aGUgXHJcbiAgICB2YXIgcHJvamVjdCA9IHt9O1xyXG4gICAgY2F0ZWdvcmllcy5mb3JFYWNoKCBjYXQgPT4ge1xyXG4gICAgICAgIHZhciBjbiA9IG1vbmdvTWFwW2NhdF0uc2hvcnROYW1lO1xyXG4gICAgICAgIHByb2plY3RbY25dID0gbW9uZ29NYXBbY2F0XS5mdWxscGF0aDtcclxuICAgIH0pXHJcbiAgICB2YXIgcXVlcnkgPSBbeyAkcHJvamVjdCA6IHByb2plY3QsICRrZWVwQXNBcnJheSA6IGtlZXBBc0FycmF5IH1dO1xyXG4gICAgY29uc29sZS5sb2coXCIgUHJvamVjdCBmb3IgXCIgKyBtb2RlbG5hbWUgKyBcIiBpcyBcIiArIEpTT04uc3RyaW5naWZ5KHF1ZXJ5LHVuZGVmaW5lZCwyKSk7XHJcbiAgICB2YXIgcmVzID0gdGhlTW9kZWwubW9uZ29IYW5kbGUuc3JjSGFuZGxlLm1vZGVsKG1vZGVsbmFtZSkuYWdncmVnYXRlKCBxdWVyeSApO1xyXG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocmVzLHVuZGVmaW5lZCwyKSk7XHJcbiAgICAvLyBub3cgcmVtYXAgdG93YXJkcyBjYXRlZ29yaWVzPyBcclxuICAgIHJldHVybiByZXMudGhlbiggcnMgPT4gcnMubWFwKCByZWMgPT4ge1xyXG4gICAgICAgIHZhciBybiA9IHt9O1xyXG4gICAgICAgIGNhdGVnb3JpZXMuZm9yRWFjaCggY2F0ID0+IHtcclxuICAgICAgICAgICAgdmFyIGNuID0gbW9uZ29NYXBbY2F0XS5zaG9ydE5hbWU7XHJcbiAgICAgICAgICAgIHJuW2NhdF0gPSByZWNbY25dO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBybjtcclxuICAgIH0pKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEV4cGFuZGVkUmVjb3Jkc0ZvckNhdGVnb3J5KHRoZU1vZGVsIDogSU1hdGNoLklNb2RlbHMsZG9tYWluIDogc3RyaW5nLGNhdGVnb3J5IDogc3RyaW5nKSA6IFByb21pc2U8eyBba2V5IDogc3RyaW5nXSA6IGFueX0+IHtcclxuICAgIHZhciBtb25nb0hhbmRsZSA9IHRoZU1vZGVsLm1vbmdvSGFuZGxlO1xyXG4gICAgdmFyIG1vZGVsbmFtZSA9IGdldE1vZGVsTmFtZUZvckRvbWFpbih0aGVNb2RlbC5tb25nb0hhbmRsZSwgZG9tYWluKTtcclxuICAgIGRlYnVnbG9nKCgpPT5gIG1vZGVsbmFtZSBmb3IgJHtkb21haW59IGlzICR7bW9kZWxuYW1lfWApO1xyXG4gICAgLy9kZWJ1Z2xvZygoKSA9PiBgaGVyZSBtb2RlbHMgJHttb2RlbG5hbWV9IGAgKyBtb25nb0hhbmRsZS5zcmNIYW5kbGUubW9kZWxOYW1lcygpLmpvaW4oJzsnKSk7XHJcbiAgICB2YXIgbW9kZWwgPSBtb25nb0hhbmRsZS5zcmNIYW5kbGUubW9kZWwobW9kZWxuYW1lKTtcclxuICAgIHZhciBtb25nb01hcCA9IG1vbmdvSGFuZGxlLm1vbmdvTWFwc1ttb2RlbG5hbWVdO1xyXG4gICAgZGVidWdsb2coKCk9PiAnaGVyZSB0aGUgbW9uZ29tYXAnICsgSlNPTi5zdHJpbmdpZnkobW9uZ29NYXAsdW5kZWZpbmVkLDIpKTtcclxuICAgIGNoZWNrTW9kZWxNb25nb01hcChtb2RlbCxtb2RlbG5hbWUsIG1vbmdvTWFwLGNhdGVnb3J5KTtcclxuICAgIGRlYnVnbG9nKCgpPT5gIGhlcmUgdGhlIG1vZGVsbWFwIGZvciAke2RvbWFpbn0gaXMgJHtKU09OLnN0cmluZ2lmeShtb25nb01hcCx1bmRlZmluZWQsMil9YCk7XHJcbiAgICAvLyAxKSBwcm9kdWNlIHRoZSBmbGF0dGVuZWQgcmVjb3Jkc1xyXG4gICAgdmFyIHJlcyA9IE1vbmdvTWFwLnVud2luZHNGb3JOb250ZXJtaW5hbEFycmF5cyhtb25nb01hcCk7XHJcbiAgICBkZWJ1Z2xvZygoKT0+J2hlcmUgdGhlIHVud2luZCBzdGF0ZW1lbnQgJyArIEpTT04uc3RyaW5naWZ5KHJlcyx1bmRlZmluZWQsMikpO1xyXG4gICAgLy8gd2UgaGF2ZSB0byB1bndpbmQgYWxsIGNvbW1vbiBub24tdGVybWluYWwgY29sbGVjdGlvbnMuXHJcbiAgICBkZWJ1Z2xvZygoKT0+J2hlcmUgdGhlIG1vZGVsICcgKyBtb2RlbC5tb2RlbG5hbWUpO1xyXG4gICAgaWYocmVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHJldHVybiBtb2RlbC5maW5kKHt9KS50aGVuKCggdW53b3VuZCA6IGFueVtdKSA9PiB7XHJcbiAgICAgICAgICAgIGRlYnVnbG9nKCgpPT4naGVyZSByZXMnICsgSlNPTi5zdHJpbmdpZnkodW53b3VuZCkpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyUmVtYXBDYXRlZ29yaWVzKG1vbmdvTWFwLCBbY2F0ZWdvcnldLCB1bndvdW5kKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG1vZGVsLmFnZ3JlZ2F0ZShyZXMpLnRoZW4oIHVud291bmQgPT4ge1xyXG4gICAgICAgIC8vIGZpbHRlciBmb3IgYWdncmVnYXRlXHJcbiAgICAgICAgZGVidWdsb2coKCk9PidoZXJlIHJlcycgKyBKU09OLnN0cmluZ2lmeSh1bndvdW5kKSk7XHJcbiAgICAgICAgcmV0dXJuIGZpbHRlclJlbWFwQ2F0ZWdvcmllcyhtb25nb01hcCwgW2NhdGVnb3J5XSwgdW53b3VuZClcclxuICAgIH0pO1xyXG59XHJcbi8vIGdldCBzeW5vbnltc1xyXG4vLyBkYi5jb3Ntb3MuZmluZCggeyBcIl9zeW5vbnltcy4wXCI6IHsgJGV4aXN0czogdHJ1ZSB9fSkubGVuZ3RoKClcclxuXHJcbi8qKlxyXG4gKiBcclxuICogQHBhcmFtIG1vbmdvSGFuZGxlXHJcbiAqIEBwYXJhbSBtb2RlbG5hbWUgXHJcbiAqIEBwYXJhbSBjYXRlZ29yeSBcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXREaXN0aW5jdFZhbHVlcyhtb25nb0hhbmRsZTogSU1hdGNoLklNb2RlbEhhbmRsZVJhdywgbW9kZWxuYW1lOiBzdHJpbmcsIGNhdGVnb3J5OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgICBkZWJ1Z2xvZygoKSA9PiBgaGVyZSBtb2RlbHMgJHttb2RlbG5hbWV9ICBvZiBhbGw6YCArIG1vbmdvSGFuZGxlLnNyY0hhbmRsZS5tb2RlbE5hbWVzKCkuam9pbignOycpKTtcclxuICAgIHZhciBtb2RlbCA9IG1vbmdvSGFuZGxlLnNyY0hhbmRsZS5tb2RlbChtb2RlbG5hbWUpO1xyXG4gICAgdmFyIG1vbmdvTWFwID0gbW9uZ29IYW5kbGUubW9uZ29NYXBzW21vZGVsbmFtZV07XHJcbiAgICBjaGVja01vZGVsTW9uZ29NYXAobW9kZWwsbW9kZWxuYW1lLCBtb25nb01hcCxjYXRlZ29yeSk7XHJcbiAgICBkZWJ1Z2xvZygnIGhlcmUgcGF0aCBmb3IgZGlzdGluY3QgdmFsdWUgXFxcIicgKyBtb2RlbG5hbWUgKyAnIFxcXCInICsgbW9uZ29NYXBbY2F0ZWdvcnldLmZ1bGxwYXRoICArIFwiXFxcIlwiKTtcclxuICAgIHJldHVybiBtb2RlbC5kaXN0aW5jdEZsYXQobW9uZ29NYXBbY2F0ZWdvcnldKS50aGVuKHJlcyA9PiB7XHJcbiAgICAgICAgZGVidWdsb2coKCkgPT4gYCBoZXJlIHJlcyBmb3IgXCIke21vZGVsbmFtZX1cIiA6IFwiJHtjYXRlZ29yeX1cIiB2YWx1ZXMgYCArIEpTT04uc3RyaW5naWZ5KHJlcywgdW5kZWZpbmVkLCAyKSk7XHJcbiAgICAgICAgcmV0dXJuIHJlcztcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2F0ZWdvcnlSZWMobW9uZ29IYW5kbGU6IElNYXRjaC5JTW9kZWxIYW5kbGVSYXcsIG1vZGVsbmFtZTogc3RyaW5nLCBjYXRlZ29yeTogc3RyaW5nKTogSU1hdGNoLklNb2RlbENhdGVnb3J5UmVjXHJcbntcclxuICAgIHZhciBjYXRlZ29yaWVzID0gbW9uZ29IYW5kbGUubW9kZWxEb2NzW21vZGVsbmFtZV0uX2NhdGVnb3JpZXM7XHJcbiAgICB2YXIgZmlsdGVyZWQgPSBjYXRlZ29yaWVzLmZpbHRlciggeCA9PiB4LmNhdGVnb3J5ID09IGNhdGVnb3J5ICk7XHJcbiAgICAvLyB3ZSB3YW50IHRvIGFtZW50IHRoZSB0eXBlIVxyXG4gICAgaWYgKCBmaWx0ZXJlZC5sZW5ndGggIT0gMSApXHJcbiAgICB7XHJcblxyXG4gICAgICAgIGRlYnVnZiggJyBkaWQgbm90IGZpbmQgJyArIG1vZGVsbmFtZSArICcgIGNhdGVnb3J5ICAnICsgY2F0ZWdvcnkgKyAnIGluICAnICsgSlNPTi5zdHJpbmdpZnkoY2F0ZWdvcmllcykgKTtcclxuICAgICAgICB0aHJvdyBFcnJvcignY2F0ZWdvcnkgbm90IGZvdW5kICcgKyBjYXRlZ29yeSArIFwiIFwiICsgSlNPTi5zdHJpbmdpZnkoY2F0ZWdvcmllcykgKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmaWx0ZXJlZFswXTtcclxufVxyXG5cclxuXHJcblxyXG5jb25zdCBBUlJfTU9ERUxfUFJPUEVSVElFUyA9IFtcImRvbWFpblwiLCBcImJpdGluZGV4XCIsIFwiZGVmYXVsdGtleWNvbHVtblwiLCBcImRlZmF1bHR1cmlcIiwgXCJjYXRlZ29yeURlc2NyaWJlZFwiLCBcImNvbHVtbnNcIiwgXCJkZXNjcmlwdGlvblwiLCBcInRvb2xcIiwgXCJ0b29saGlkZGVuXCIsIFwic3lub255bXNcIiwgXCJjYXRlZ29yeVwiLCBcIndvcmRpbmRleFwiLCBcImV4YWN0bWF0Y2hcIiwgXCJoaWRkZW5cIl07XHJcblxyXG5mdW5jdGlvbiBhZGRTeW5vbnltcyhzeW5vbnltczogc3RyaW5nW10sIGNhdGVnb3J5OiBzdHJpbmcsIHN5bm9ueW1Gb3I6IHN0cmluZywgYml0aW5kZXg6IG51bWJlciwgYml0U2VudGVuY2VBbmQsXHJcbiAgICB3b3JkVHlwZTogc3RyaW5nLFxyXG4gICAgbVJ1bGVzOiBBcnJheTxJTWF0Y2gubVJ1bGU+LCBzZWVuOiB7IFtrZXk6IHN0cmluZ106IElNYXRjaC5tUnVsZVtdIH0pIHtcclxuICAgIHN5bm9ueW1zLmZvckVhY2goZnVuY3Rpb24gKHN5bikge1xyXG4gICAgICAgIHZhciBvUnVsZSA9IHtcclxuICAgICAgICAgICAgY2F0ZWdvcnk6IGNhdGVnb3J5LFxyXG4gICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBzeW5vbnltRm9yLFxyXG4gICAgICAgICAgICB0eXBlOiBJTWF0Y2guRW51bVJ1bGVUeXBlLldPUkQsXHJcbiAgICAgICAgICAgIHdvcmQ6IHN5bixcclxuICAgICAgICAgICAgYml0aW5kZXg6IGJpdGluZGV4LFxyXG4gICAgICAgICAgICBiaXRTZW50ZW5jZUFuZDogYml0U2VudGVuY2VBbmQsXHJcbiAgICAgICAgICAgIHdvcmRUeXBlOiB3b3JkVHlwZSxcclxuICAgICAgICAgICAgX3Jhbmtpbmc6IDAuOTVcclxuICAgICAgICB9O1xyXG4gICAgICAgIGRlYnVnbG9nKGRlYnVnbG9nLmVuYWJsZWQgPyAoXCJpbnNlcnRpbmcgc3lub255bVwiICsgSlNPTi5zdHJpbmdpZnkob1J1bGUpKSA6ICctJyk7XHJcbiAgICAgICAgaW5zZXJ0UnVsZUlmTm90UHJlc2VudChtUnVsZXMsIG9SdWxlLCBzZWVuKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRSdWxlS2V5KHJ1bGUpIHtcclxuICAgIHZhciByMSA9IHJ1bGUubWF0Y2hlZFN0cmluZyArIFwiLXwtXCIgKyBydWxlLmNhdGVnb3J5ICsgXCIgLXwtIFwiICsgcnVsZS50eXBlICsgXCIgLXwtIFwiICsgcnVsZS53b3JkICsgXCIgXCIgKyBydWxlLmJpdGluZGV4ICsgXCIgXCIgKyBydWxlLndvcmRUeXBlO1xyXG4gICAgaWYgKHJ1bGUucmFuZ2UpIHtcclxuICAgICAgICB2YXIgcjIgPSBnZXRSdWxlS2V5KHJ1bGUucmFuZ2UucnVsZSk7XHJcbiAgICAgICAgcjEgKz0gXCIgLXwtIFwiICsgcnVsZS5yYW5nZS5sb3cgKyBcIi9cIiArIHJ1bGUucmFuZ2UuaGlnaCArIFwiIC18LSBcIiArIHIyO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHIxO1xyXG59XHJcblxyXG5cclxuaW1wb3J0ICogYXMgQnJlYWtkb3duIGZyb20gJy4uL21hdGNoL2JyZWFrZG93bic7XHJcblxyXG4vKiBnaXZlbiBhIHJ1bGUgd2hpY2ggcmVwcmVzZW50cyBhIHdvcmQgc2VxdWVuY2Ugd2hpY2ggaXMgc3BsaXQgZHVyaW5nIHRva2VuaXphdGlvbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gYWRkQmVzdFNwbGl0KG1SdWxlczogQXJyYXk8SU1hdGNoLm1SdWxlPiwgcnVsZTogSU1hdGNoLm1SdWxlLCBzZWVuUnVsZXM6IHsgW2tleTogc3RyaW5nXTogSU1hdGNoLm1SdWxlW10gfSkge1xyXG4gICAgLy9pZighZ2xvYmFsX0FkZFNwbGl0cykge1xyXG4gICAgLy8gICAgcmV0dXJuO1xyXG4gICAgLy99XHJcblxyXG4gICAgaWYgKHJ1bGUudHlwZSAhPT0gSU1hdGNoLkVudW1SdWxlVHlwZS5XT1JEKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdmFyIGJlc3QgPSBCcmVha2Rvd24ubWFrZU1hdGNoUGF0dGVybihydWxlLmxvd2VyY2FzZXdvcmQpO1xyXG4gICAgaWYgKCFiZXN0KSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdmFyIG5ld1J1bGUgPSB7XHJcbiAgICAgICAgY2F0ZWdvcnk6IHJ1bGUuY2F0ZWdvcnksXHJcbiAgICAgICAgbWF0Y2hlZFN0cmluZzogcnVsZS5tYXRjaGVkU3RyaW5nLFxyXG4gICAgICAgIGJpdGluZGV4OiBydWxlLmJpdGluZGV4LFxyXG4gICAgICAgIGJpdFNlbnRlbmNlQW5kOiBydWxlLmJpdGluZGV4LFxyXG4gICAgICAgIHdvcmRUeXBlOiBydWxlLndvcmRUeXBlLFxyXG4gICAgICAgIHdvcmQ6IGJlc3QubG9uZ2VzdFRva2VuLFxyXG4gICAgICAgIHR5cGU6IDAsXHJcbiAgICAgICAgbG93ZXJjYXNld29yZDogYmVzdC5sb25nZXN0VG9rZW4sXHJcbiAgICAgICAgX3Jhbmtpbmc6IDAuOTUsXHJcbiAgICAgICAgLy8gICAgZXhhY3RPbmx5IDogcnVsZS5leGFjdE9ubHksXHJcbiAgICAgICAgcmFuZ2U6IGJlc3Quc3BhblxyXG4gICAgfSBhcyBJTWF0Y2gubVJ1bGU7XHJcbiAgICBpZiAocnVsZS5leGFjdE9ubHkpIHtcclxuICAgICAgICBuZXdSdWxlLmV4YWN0T25seSA9IHJ1bGUuZXhhY3RPbmx5XHJcbiAgICB9O1xyXG4gICAgbmV3UnVsZS5yYW5nZS5ydWxlID0gcnVsZTtcclxuICAgIGluc2VydFJ1bGVJZk5vdFByZXNlbnQobVJ1bGVzLCBuZXdSdWxlLCBzZWVuUnVsZXMpO1xyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gaW5zZXJ0UnVsZUlmTm90UHJlc2VudChtUnVsZXM6IEFycmF5PElNYXRjaC5tUnVsZT4sIHJ1bGU6IElNYXRjaC5tUnVsZSxcclxuICAgIHNlZW5SdWxlczogeyBba2V5OiBzdHJpbmddOiBJTWF0Y2gubVJ1bGVbXSB9KSB7XHJcblxyXG4gICAgaWYgKHJ1bGUudHlwZSAhPT0gSU1hdGNoLkVudW1SdWxlVHlwZS5XT1JEKSB7XHJcbiAgICAgICAgZGVidWdsb2coJ25vdCBhICB3b3JkIHJldHVybiBmYXN0ICcrIHJ1bGUubWF0Y2hlZFN0cmluZyk7XHJcbiAgICAgICAgbVJ1bGVzLnB1c2gocnVsZSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKChydWxlLndvcmQgPT09IHVuZGVmaW5lZCkgfHwgKHJ1bGUubWF0Y2hlZFN0cmluZyA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignaWxsZWdhbCBydWxlJyArIEpTT04uc3RyaW5naWZ5KHJ1bGUsIHVuZGVmaW5lZCwgMikpO1xyXG4gICAgfVxyXG4gICAgdmFyIHIgPSBnZXRSdWxlS2V5KHJ1bGUpO1xyXG4gICAgLyogaWYoIChydWxlLndvcmQgPT09IFwic2VydmljZVwiIHx8IHJ1bGUud29yZD09PSBcInNlcnZpY2VzXCIpICYmIHIuaW5kZXhPZignT0RhdGEnKSA+PSAwKSB7XHJcbiAgICAgICAgIGNvbnNvbGUubG9nKFwicnVsZWtleSBpc1wiICsgcik7XHJcbiAgICAgICAgIGNvbnNvbGUubG9nKFwicHJlc2VuY2UgaXMgXCIgKyBKU09OLnN0cmluZ2lmeShzZWVuUnVsZXNbcl0pKTtcclxuICAgICB9Ki9cclxuICAgIHJ1bGUubG93ZXJjYXNld29yZCA9IHJ1bGUud29yZC50b0xvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKHNlZW5SdWxlc1tyXSkge1xyXG4gICAgICAgIGRlYnVnbG9nKCgpID0+IChcIkF0dGVtcHRpbmcgdG8gaW5zZXJ0IGR1cGxpY2F0ZVwiICsgSlNPTi5zdHJpbmdpZnkocnVsZSwgdW5kZWZpbmVkLCAyKSArIFwiIDogXCIgKyByKSk7XHJcbiAgICAgICAgdmFyIGR1cGxpY2F0ZXMgPSBzZWVuUnVsZXNbcl0uZmlsdGVyKGZ1bmN0aW9uIChvRW50cnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDAgPT09IElucHV0RmlsdGVyUnVsZXMuY29tcGFyZU1SdWxlRnVsbChvRW50cnksIHJ1bGUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGlmIChkdXBsaWNhdGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHNlZW5SdWxlc1tyXSA9IChzZWVuUnVsZXNbcl0gfHwgW10pO1xyXG4gICAgc2VlblJ1bGVzW3JdLnB1c2gocnVsZSk7XHJcbiAgICBpZiAocnVsZS53b3JkID09PSBcIlwiKSB7XHJcbiAgICAgICAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/ICgnU2tpcHBpbmcgcnVsZSB3aXRoIGVtdHB5IHdvcmQgJyArIEpTT04uc3RyaW5naWZ5KHJ1bGUsIHVuZGVmaW5lZCwgMikpIDogJy0nKTtcclxuICAgICAgICAvL2coJ1NraXBwaW5nIHJ1bGUgd2l0aCBlbXRweSB3b3JkICcgKyBKU09OLnN0cmluZ2lmeShydWxlLCB1bmRlZmluZWQsIDIpKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBtUnVsZXMucHVzaChydWxlKTtcclxuICAgIGFkZEJlc3RTcGxpdChtUnVsZXMsIHJ1bGUsIHNlZW5SdWxlcyk7XHJcbiAgICByZXR1cm47XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZWFkRmlsZUFzSlNPTihmaWxlbmFtZTogc3RyaW5nKTogYW55IHtcclxuICAgIHZhciBkYXRhID0gZnMucmVhZEZpbGVTeW5jKGZpbGVuYW1lLCAndXRmLTgnKTtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZGF0YSk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJDb250ZW50IG9mIGZpbGUgXCIgKyBmaWxlbmFtZSArIFwiIGlzIG5vIGpzb25cIiArIGUpO1xyXG4gICAgICAgIHByb2Nlc3Muc3Rkb3V0Lm9uKCdkcmFpbicsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoLTEpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vcHJvY2Vzcy5leGl0KC0xKTtcclxuICAgIH1cclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBoYXNSdWxlV2l0aEZhY3QobVJ1bGVzIDogSU1hdGNoLm1SdWxlW10sIGZhY3Q6IHN0cmluZywgY2F0ZWdvcnk6IHN0cmluZywgYml0aW5kZXg6IG51bWJlcikge1xyXG4gICAgLy8gVE9ETyBCQUQgUVVBRFJBVElDXHJcbiAgICByZXR1cm4gbVJ1bGVzLmZpbmQoIHJ1bGUgPT4ge1xyXG4gICAgICAgIHJldHVybiBydWxlLndvcmQgPT09IGZhY3QgJiYgcnVsZS5jYXRlZ29yeSA9PT0gY2F0ZWdvcnkgJiYgcnVsZS5iaXRpbmRleCA9PT0gYml0aW5kZXhcclxuICAgIH0pICE9PSB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxvYWRNb2RlbERhdGFNb25nbyhtb2RlbEhhbmRsZTogSU1hdGNoLklNb2RlbEhhbmRsZVJhdywgb01kbDogSU1vZGVsLCBzTW9kZWxOYW1lOiBzdHJpbmcsIG9Nb2RlbDogSU1hdGNoLklNb2RlbHMpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgLy8gcmVhZCB0aGUgZGF0YSAtPlxyXG4gICAgLy8gZGF0YSBpcyBwcm9jZXNzZWQgaW50byBtUnVsZXMgZGlyZWN0bHlcclxuXHJcbiAgICB2YXIgYml0aW5kZXggPSBvTWRsLmJpdGluZGV4O1xyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKG1vZGVsSGFuZGxlLm1vZGVsRG9jc1tzTW9kZWxOYW1lXS5fY2F0ZWdvcmllcy5tYXAoXHJcbiAgICAgICAgY2F0ZWdvcnlSZWMgPT4ge1xyXG4gICAgICAgICAgICB2YXIgY2F0ZWdvcnkgPSBjYXRlZ29yeVJlYy5jYXRlZ29yeTtcclxuICAgICAgICAgICAgdmFyIHdvcmRpbmRleCA9IGNhdGVnb3J5UmVjLndvcmRpbmRleDtcclxuICAgICAgICAgICAgaWYgKCF3b3JkaW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIGRlYnVnbG9nKCAoKT0+ICcgICcgKyBzTW9kZWxOYW1lICsgJyAnICsgIGNhdGVnb3J5ICsgJyBpcyBub3Qgd29yZCBpbmRleGVkIScgKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZygoKSA9PiAnYWRkaW5nIHZhbHVlcyBmb3IgJyArIHNNb2RlbE5hbWUgKyAnICcgKyAgY2F0ZWdvcnkpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldERpc3RpbmN0VmFsdWVzKG1vZGVsSGFuZGxlLCBzTW9kZWxOYW1lLCBjYXRlZ29yeSkudGhlbihcclxuICAgICAgICAgICAgICAgICAgICAodmFsdWVzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnbG9nKGBmb3VuZCAke3ZhbHVlcy5sZW5ndGh9IHZhbHVlcyBmb3IgJHtzTW9kZWxOYW1lfSAke2NhdGVnb3J5fSBgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzLm1hcCh2YWx1ZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc1N0cmluZyA9IFwiXCIgKyB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnbG9nKCgpID0+IFwicHVzaGluZyBydWxlIHdpdGggXCIgKyBjYXRlZ29yeSArIFwiIC0+IFwiICsgc1N0cmluZyArICcgJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb1J1bGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6IGNhdGVnb3J5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IHNTdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogSU1hdGNoLkVudW1SdWxlVHlwZS5XT1JELFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmQ6IHNTdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYml0aW5kZXg6IGJpdGluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJpdFNlbnRlbmNlQW5kOiBiaXRpbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGFjdE9ubHk6IGNhdGVnb3J5UmVjLmV4YWN0bWF0Y2ggfHwgZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd29yZFR5cGU6IElNYXRjaC5XT1JEVFlQRS5GQUNULFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9yYW5raW5nOiAwLjk1XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGFzIElNYXRjaC5tUnVsZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydFJ1bGVJZk5vdFByZXNlbnQob01vZGVsLm1SdWxlcywgb1J1bGUsIG9Nb2RlbC5zZWVuUnVsZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgaWYgKG9NZGxEYXRhLnN5bm9ueW1zICYmIG9NZGxEYXRhLnN5bm9ueW1zW2NhdGVnb3J5XSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgIHRocm93IG5ldyBFcnJvcihcImhvdyBjYW4gdGhpcyBoYXBwZW4/XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9hZGRTeW5vbnltcyhvTWRsRGF0YS5zeW5vbnltc1tjYXRlZ29yeV0sIGNhdGVnb3J5LCBzU3RyaW5nLCBiaXRpbmRleCwgYml0aW5kZXgsIFwiWFwiLCBvTW9kZWwubVJ1bGVzLCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGEgc3lub255bSBmb3IgYSBGQUNUXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICBpZiAob0VudHJ5LnN5bm9ueW1zICYmIG9FbnRyeS5zeW5vbnltc1tjYXRlZ29yeV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgYWRkU3lub255bXMob0VudHJ5LnN5bm9ueW1zW2NhdGVnb3J5XSwgY2F0ZWdvcnksIHNTdHJpbmcsIGJpdGluZGV4LCBiaXRpbmRleCwgSU1hdGNoLldPUkRUWVBFLkZBQ1QsIG9Nb2RlbC5tUnVsZXMsIG9Nb2RlbC5zZWVuUnVsZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICApXHJcbiAgICApLnRoZW4oXHJcbiAgICAgICAgKCkgPT4gIGdldEZhY3RTeW5vbnltcyhtb2RlbEhhbmRsZSwgc01vZGVsTmFtZSlcclxuICAgICkudGhlbigoc3lub255bVZhbHVlcyA6IGFueSkgPT4ge1xyXG4gICAgICAgIHN5bm9ueW1WYWx1ZXMuZm9yRWFjaCgoc3lub255bVJlYykgPT4ge1xyXG4gICAgICAgIGlmICghaGFzUnVsZVdpdGhGYWN0KG9Nb2RlbC5tUnVsZXMsIHN5bm9ueW1SZWMuZmFjdCwgc3lub255bVJlYy5jYXRlZ29yeSwgYml0aW5kZXgpKSB7XHJcbiAgICAgICAgICAgIGRlYnVnbG9nKCgpID0+SlNPTi5zdHJpbmdpZnkob01vZGVsLm1SdWxlcyx1bmRlZmluZWQsMikpO1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihgT3JwaGFuZWQgc3lub255bSB3aXRob3V0IGJhc2UgaW4gZGF0YT9cXG5gXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAoY2hlY2sgdHlwb3MgYW5kIHRoYXQgY2F0ZWdvcnkgaXMgd29yZGluZGV4ZWQhKSBmYWN0OiAnJHtzeW5vbnltUmVjLmZhY3R9JzsgIGNhdGVnb3J5OiBcIiR7c3lub255bVJlYy5jYXRlZ29yeX1cIiAgIGAgICsgSlNPTi5zdHJpbmdpZnkoc3lub255bVJlYykpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGFkZFN5bm9ueW1zKHN5bm9ueW1SZWMuc3lub255bXMsIHN5bm9ueW1SZWMuY2F0ZWdvcnksIHN5bm9ueW1SZWMuZmFjdCwgYml0aW5kZXgsIGJpdGluZGV4LCBJTWF0Y2guV09SRFRZUEUuRkFDVCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvTW9kZWwubVJ1bGVzLCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0pO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRNb2RlbChtb2RlbEhhbmRsZTogSU1hdGNoLklNb2RlbEhhbmRsZVJhdywgc01vZGVsTmFtZTogc3RyaW5nLCBvTW9kZWw6IElNYXRjaC5JTW9kZWxzKTogUHJvbWlzZTxhbnk+IHtcclxuICAgIGRlYnVnbG9nKFwiIGxvYWRpbmcgXCIgKyBzTW9kZWxOYW1lICsgXCIgLi4uLlwiKTtcclxuICAgIC8vdmFyIG9NZGwgPSByZWFkRmlsZUFzSlNPTignLi8nICsgbW9kZWxQYXRoICsgJy8nICsgc01vZGVsTmFtZSArIFwiLm1vZGVsLmpzb25cIikgYXMgSU1vZGVsO1xyXG4gICAgdmFyIG9NZGwgPSBtYWtlTWRsTW9uZ28obW9kZWxIYW5kbGUsIHNNb2RlbE5hbWUsIG9Nb2RlbCk7XHJcbiAgICByZXR1cm4gbG9hZE1vZGVsRGF0YU1vbmdvKG1vZGVsSGFuZGxlLCBvTWRsLCBzTW9kZWxOYW1lLCBvTW9kZWwpO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEFsbERvbWFpbnNCaXRJbmRleChvTW9kZWw6IElNYXRjaC5JTW9kZWxzKTogbnVtYmVyIHtcclxuICAgIHZhciBsZW4gPSBvTW9kZWwuZG9tYWlucy5sZW5ndGg7XHJcbiAgICB2YXIgcmVzID0gMDtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcclxuICAgICAgICByZXMgPSByZXMgPDwgMTtcclxuICAgICAgICByZXMgPSByZXMgfCAweDAwMDE7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RG9tYWluQml0SW5kZXgoZG9tYWluOiBzdHJpbmcsIG9Nb2RlbDogSU1hdGNoLklNb2RlbHMpOiBudW1iZXIge1xyXG4gICAgdmFyIGluZGV4ID0gb01vZGVsLmRvbWFpbnMuaW5kZXhPZihkb21haW4pO1xyXG4gICAgaWYgKGluZGV4IDwgMCkge1xyXG4gICAgICAgIGluZGV4ID0gb01vZGVsLmRvbWFpbnMubGVuZ3RoO1xyXG4gICAgfVxyXG4gICAgaWYgKGluZGV4ID49IDMyKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidG9vIG1hbnkgZG9tYWluIGZvciBzaW5nbGUgMzIgYml0IGluZGV4XCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIDB4MDAwMSA8PCBpbmRleDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldERvbWFpbkJpdEluZGV4U2FmZShkb21haW46IHN0cmluZywgb01vZGVsOiBJTWF0Y2guSU1vZGVscyk6IG51bWJlciB7XHJcbiAgICB2YXIgaW5kZXggPSBvTW9kZWwuZG9tYWlucy5pbmRleE9mKGRvbWFpbik7XHJcbiAgICBpZiAoaW5kZXggPCAwKSB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoJ2V4cGVjdGVkIGRvbWFpbiAnICsgZG9tYWluICsgJyB0byBiZSByZWdpc3RlcmVkPz8/ICcgKyBKU09OLnN0cmluZ2lmeShvTW9kZWwuZG9tYWlucykpO1xyXG4gICAgfVxyXG4gICAgaWYgKGluZGV4ID49IDMyKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidG9vIG1hbnkgZG9tYWluIGZvciBzaW5nbGUgMzIgYml0IGluZGV4XCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIDB4MDAwMSA8PCBpbmRleDtcclxufVxyXG5cclxuXHJcblxyXG4vKipcclxuICogR2l2ZW4gYSBiaXRmaWVsZCwgcmV0dXJuIGFuIHVuc29ydGVkIHNldCBvZiBkb21haW5zIG1hdGNoaW5nIHByZXNlbnQgYml0c1xyXG4gKiBAcGFyYW0gb01vZGVsXHJcbiAqIEBwYXJhbSBiaXRmaWVsZFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldERvbWFpbnNGb3JCaXRGaWVsZChvTW9kZWw6IElNYXRjaC5JTW9kZWxzLCBiaXRmaWVsZDogbnVtYmVyKTogc3RyaW5nW10ge1xyXG4gICAgcmV0dXJuIG9Nb2RlbC5kb21haW5zLmZpbHRlcihkb21haW4gPT5cclxuICAgICAgICAoZ2V0RG9tYWluQml0SW5kZXgoZG9tYWluLCBvTW9kZWwpICYgYml0ZmllbGQpXHJcbiAgICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYWtlTWRsTW9uZ28obW9kZWxIYW5kbGU6IElNYXRjaC5JTW9kZWxIYW5kbGVSYXcsIHNNb2RlbE5hbWU6IHN0cmluZywgb01vZGVsOiBJTWF0Y2guSU1vZGVscyk6IElNb2RlbCB7XHJcbiAgICB2YXIgbW9kZWxEb2MgPSBtb2RlbEhhbmRsZS5tb2RlbERvY3Nbc01vZGVsTmFtZV07XHJcbiAgICB2YXIgb01kbCA9IHtcclxuICAgICAgICBiaXRpbmRleDogZ2V0RG9tYWluQml0SW5kZXhTYWZlKG1vZGVsRG9jLmRvbWFpbiwgb01vZGVsKSxcclxuICAgICAgICBkb21haW46IG1vZGVsRG9jLmRvbWFpbixcclxuICAgICAgICBtb2RlbG5hbWU6IHNNb2RlbE5hbWUsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG1vZGVsRG9jLmRvbWFpbl9kZXNjcmlwdGlvblxyXG4gICAgfSBhcyBJTW9kZWw7XHJcbiAgICB2YXIgY2F0ZWdvcnlEZXNjcmliZWRNYXAgPSB7fSBhcyB7IFtrZXk6IHN0cmluZ106IElNYXRjaC5JQ2F0ZWdvcnlEZXNjIH07XHJcblxyXG4gICAgb01kbC5iaXRpbmRleCA9IGdldERvbWFpbkJpdEluZGV4U2FmZShtb2RlbERvYy5kb21haW4sIG9Nb2RlbCk7XHJcbiAgICBvTWRsLmNhdGVnb3J5ID0gbW9kZWxEb2MuX2NhdGVnb3JpZXMubWFwKGNhdCA9PiBjYXQuY2F0ZWdvcnkpO1xyXG4gICAgb01kbC5jYXRlZ29yeURlc2NyaWJlZCA9IFtdO1xyXG4gICAgbW9kZWxEb2MuX2NhdGVnb3JpZXMuZm9yRWFjaChjYXQgPT4ge1xyXG4gICAgICAgIG9NZGwuY2F0ZWdvcnlEZXNjcmliZWQucHVzaCh7XHJcbiAgICAgICAgICAgIG5hbWU6IGNhdC5jYXRlZ29yeSxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGNhdC5jYXRlZ29yeV9kZXNjcmlwdGlvblxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY2F0ZWdvcnlEZXNjcmliZWRNYXBbY2F0LmNhdGVnb3J5XSA9IGNhdDtcclxuICAgIH0pO1xyXG5cclxuICAgIG9NZGwuY2F0ZWdvcnkgPSBtb2RlbERvYy5fY2F0ZWdvcmllcy5tYXAoY2F0ID0+IGNhdC5jYXRlZ29yeSk7XHJcblxyXG4gICAgLyogLy8gcmVjdGlmeSBjYXRlZ29yeVxyXG4gICAgIG9NZGwuY2F0ZWdvcnkgPSBvTWRsLmNhdGVnb3J5Lm1hcChmdW5jdGlvbiAoY2F0OiBhbnkpIHtcclxuICAgICAgICAgaWYgKHR5cGVvZiBjYXQgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgIHJldHVybiBjYXQ7XHJcbiAgICAgICAgIH1cclxuICAgICAgICAgaWYgKHR5cGVvZiBjYXQubmFtZSAhPT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgY29uc29sZS5sb2coXCJNaXNzaW5nIG5hbWUgaW4gb2JqZWN0IHR5cGVkIGNhdGVnb3J5IGluIFwiICsgSlNPTi5zdHJpbmdpZnkoY2F0KSArIFwiIGluIG1vZGVsIFwiICsgc01vZGVsTmFtZSk7XHJcbiAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoLTEpO1xyXG4gICAgICAgICAgICAgLy90aHJvdyBuZXcgRXJyb3IoJ0RvbWFpbiAnICsgb01kbC5kb21haW4gKyAnIGFscmVhZHkgbG9hZGVkIHdoaWxlIGxvYWRpbmcgJyArIHNNb2RlbE5hbWUgKyAnPycpO1xyXG4gICAgICAgICB9XHJcbiAgICAgICAgIGNhdGVnb3J5RGVzY3JpYmVkTWFwW2NhdC5uYW1lXSA9IGNhdDtcclxuICAgICAgICAgb01kbC5jYXRlZ29yeURlc2NyaWJlZC5wdXNoKGNhdCk7XHJcbiAgICAgICAgIHJldHVybiBjYXQubmFtZTtcclxuICAgICB9KTtcclxuICAgICAqL1xyXG5cclxuICAgIC8vIGFkZCB0aGUgY2F0ZWdvcmllcyB0byB0aGUgcnVsZXNcclxuICAgIG9NZGwuY2F0ZWdvcnkuZm9yRWFjaChmdW5jdGlvbiAoY2F0ZWdvcnkpIHtcclxuICAgICAgICBpbnNlcnRSdWxlSWZOb3RQcmVzZW50KG9Nb2RlbC5tUnVsZXMsIHtcclxuICAgICAgICAgICAgY2F0ZWdvcnk6IFwiY2F0ZWdvcnlcIixcclxuICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogY2F0ZWdvcnksXHJcbiAgICAgICAgICAgIHR5cGU6IElNYXRjaC5FbnVtUnVsZVR5cGUuV09SRCxcclxuICAgICAgICAgICAgd29yZDogY2F0ZWdvcnksXHJcbiAgICAgICAgICAgIGxvd2VyY2FzZXdvcmQ6IGNhdGVnb3J5LnRvTG93ZXJDYXNlKCksXHJcbiAgICAgICAgICAgIGJpdGluZGV4OiBvTWRsLmJpdGluZGV4LFxyXG4gICAgICAgICAgICB3b3JkVHlwZTogSU1hdGNoLldPUkRUWVBFLkNBVEVHT1JZLFxyXG4gICAgICAgICAgICBiaXRTZW50ZW5jZUFuZDogb01kbC5iaXRpbmRleCxcclxuICAgICAgICAgICAgX3Jhbmtpbmc6IDAuOTVcclxuICAgICAgICB9LCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIGFkZCBzeW5vbmFueW0gZm9yIHRoZSBjYXRlZ29yaWVzIHRvIHRoZVxyXG5cclxuICAgIG1vZGVsRG9jLl9jYXRlZ29yaWVzLmZvckVhY2goY2F0ID0+IHtcclxuICAgICAgICBhZGRTeW5vbnltc1xyXG5cclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChvTW9kZWwuZG9tYWlucy5pbmRleE9mKG9NZGwuZG9tYWluKSA8IDApIHtcclxuICAgICAgICBkZWJ1Z2xvZyhcIioqKioqKioqKioqaGVyZSBtZGxcIiArIEpTT04uc3RyaW5naWZ5KG9NZGwsIHVuZGVmaW5lZCwgMikpO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRG9tYWluICcgKyBvTWRsLmRvbWFpbiArICcgYWxyZWFkeSBsb2FkZWQgd2hpbGUgbG9hZGluZyAnICsgc01vZGVsTmFtZSArICc/Jyk7XHJcbiAgICB9XHJcbiAgICAvKlxyXG4gICAgLy8gY2hlY2sgcHJvcGVydGllcyBvZiBtb2RlbFxyXG4gICAgT2JqZWN0LmtleXMob01kbCkuc29ydCgpLmZvckVhY2goZnVuY3Rpb24gKHNQcm9wZXJ0eSkge1xyXG4gICAgICAgIGlmIChBUlJfTU9ERUxfUFJPUEVSVElFUy5pbmRleE9mKHNQcm9wZXJ0eSkgPCAwKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTW9kZWwgcHJvcGVydHkgXCInICsgc1Byb3BlcnR5ICsgJ1wiIG5vdCBhIGtub3duIG1vZGVsIHByb3BlcnR5IGluIG1vZGVsIG9mIGRvbWFpbiAnICsgb01kbC5kb21haW4gKyAnICcpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgKi9cclxuXHJcbiAgICAvLyBjb25zaWRlciBzdHJlYW1saW5pbmcgdGhlIGNhdGVnb3JpZXNcclxuICAgIG9Nb2RlbC5yYXdNb2RlbEJ5RG9tYWluW29NZGwuZG9tYWluXSA9IG9NZGw7XHJcbiAgICBvTW9kZWwucmF3TW9kZWxCeU1vZGVsTmFtZVtvTWRsLm1vZGVsbmFtZV0gPSBvTWRsO1xyXG5cclxuICAgIG9Nb2RlbC5mdWxsLmRvbWFpbltvTWRsLmRvbWFpbl0gPSB7XHJcbiAgICAgICAgZGVzY3JpcHRpb246IG9NZGwuZGVzY3JpcHRpb24sXHJcbiAgICAgICAgY2F0ZWdvcmllczogY2F0ZWdvcnlEZXNjcmliZWRNYXAsXHJcbiAgICAgICAgYml0aW5kZXg6IG9NZGwuYml0aW5kZXhcclxuICAgIH07XHJcblxyXG4gICAgLy8gY2hlY2sgdGhhdFxyXG5cclxuXHJcbiAgICAvLyBjaGVjayB0aGF0IG1lbWJlcnMgb2Ygd29yZGluZGV4IGFyZSBpbiBjYXRlZ29yaWVzLFxyXG4gICAgLyogb01kbC53b3JkaW5kZXggPSBvTW9kZWxEb2Mub01kbC53b3JkaW5kZXggfHwgW107XHJcbiAgICAgb01kbC53b3JkaW5kZXguZm9yRWFjaChmdW5jdGlvbiAoc1dvcmRJbmRleCkge1xyXG4gICAgICAgICBpZiAob01kbC5jYXRlZ29yeS5pbmRleE9mKHNXb3JkSW5kZXgpIDwgMCkge1xyXG4gICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNb2RlbCB3b3JkaW5kZXggXCInICsgc1dvcmRJbmRleCArICdcIiBub3QgYSBjYXRlZ29yeSBvZiBkb21haW4gJyArIG9NZGwuZG9tYWluICsgJyAnKTtcclxuICAgICAgICAgfVxyXG4gICAgIH0pO1xyXG4gICAgICovXHJcbiAgICAvKlxyXG4gICAgb01kbC5leGFjdG1hdGNoID0gb01kbC5leGFjdG1hdGNoIHx8IFtdO1xyXG4gICAgb01kbC5leGFjdG1hdGNoLmZvckVhY2goZnVuY3Rpb24gKHNFeGFjdE1hdGNoKSB7XHJcbiAgICAgICAgaWYgKG9NZGwuY2F0ZWdvcnkuaW5kZXhPZihzRXhhY3RNYXRjaCkgPCAwKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTW9kZWwgZXhhY3RtYXRjaCBcIicgKyBzRXhhY3RNYXRjaCArICdcIiBub3QgYSBjYXRlZ29yeSBvZiBkb21haW4gJyArIG9NZGwuZG9tYWluICsgJyAnKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgICovXHJcbiAgICBvTWRsLmNvbHVtbnMgPSBtb2RlbERvYy5jb2x1bW5zOyAvLyBvTWRsLmNvbHVtbnMgfHwgW107XHJcbiAgICBvTWRsLmNvbHVtbnMuZm9yRWFjaChmdW5jdGlvbiAoc0V4YWN0TWF0Y2gpIHtcclxuICAgICAgICBpZiAob01kbC5jYXRlZ29yeS5pbmRleE9mKHNFeGFjdE1hdGNoKSA8IDApIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNb2RlbCBjb2x1bW4gXCInICsgc0V4YWN0TWF0Y2ggKyAnXCIgbm90IGEgY2F0ZWdvcnkgb2YgZG9tYWluICcgKyBvTWRsLmRvbWFpbiArICcgJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIC8vIGFkZCByZWxhdGlvbiBkb21haW4gLT4gY2F0ZWdvcnlcclxuICAgIHZhciBkb21haW5TdHIgPSBNZXRhRi5Eb21haW4ob01kbC5kb21haW4pLnRvRnVsbFN0cmluZygpO1xyXG4gICAgdmFyIHJlbGF0aW9uU3RyID0gTWV0YUYuUmVsYXRpb24oTWV0YS5SRUxBVElPTl9oYXNDYXRlZ29yeSkudG9GdWxsU3RyaW5nKCk7XHJcbiAgICB2YXIgcmV2ZXJzZVJlbGF0aW9uU3RyID0gTWV0YUYuUmVsYXRpb24oTWV0YS5SRUxBVElPTl9pc0NhdGVnb3J5T2YpLnRvRnVsbFN0cmluZygpO1xyXG4gICAgb01kbC5jYXRlZ29yeS5mb3JFYWNoKGZ1bmN0aW9uIChzQ2F0ZWdvcnkpIHtcclxuXHJcbiAgICAgICAgdmFyIENhdGVnb3J5U3RyaW5nID0gTWV0YUYuQ2F0ZWdvcnkoc0NhdGVnb3J5KS50b0Z1bGxTdHJpbmcoKTtcclxuICAgICAgICBvTW9kZWwubWV0YS50M1tkb21haW5TdHJdID0gb01vZGVsLm1ldGEudDNbZG9tYWluU3RyXSB8fCB7fTtcclxuICAgICAgICBvTW9kZWwubWV0YS50M1tkb21haW5TdHJdW3JlbGF0aW9uU3RyXSA9IG9Nb2RlbC5tZXRhLnQzW2RvbWFpblN0cl1bcmVsYXRpb25TdHJdIHx8IHt9O1xyXG4gICAgICAgIG9Nb2RlbC5tZXRhLnQzW2RvbWFpblN0cl1bcmVsYXRpb25TdHJdW0NhdGVnb3J5U3RyaW5nXSA9IHt9O1xyXG5cclxuICAgICAgICBvTW9kZWwubWV0YS50M1tDYXRlZ29yeVN0cmluZ10gPSBvTW9kZWwubWV0YS50M1tDYXRlZ29yeVN0cmluZ10gfHwge307XHJcbiAgICAgICAgb01vZGVsLm1ldGEudDNbQ2F0ZWdvcnlTdHJpbmddW3JldmVyc2VSZWxhdGlvblN0cl0gPSBvTW9kZWwubWV0YS50M1tDYXRlZ29yeVN0cmluZ11bcmV2ZXJzZVJlbGF0aW9uU3RyXSB8fCB7fTtcclxuICAgICAgICBvTW9kZWwubWV0YS50M1tDYXRlZ29yeVN0cmluZ11bcmV2ZXJzZVJlbGF0aW9uU3RyXVtkb21haW5TdHJdID0ge307XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gYWRkIGEgcHJlY2ljZSBkb21haW4gbWF0Y2hydWxlXHJcbiAgICBpbnNlcnRSdWxlSWZOb3RQcmVzZW50KG9Nb2RlbC5tUnVsZXMsIHtcclxuICAgICAgICBjYXRlZ29yeTogXCJkb21haW5cIixcclxuICAgICAgICBtYXRjaGVkU3RyaW5nOiBvTWRsLmRvbWFpbixcclxuICAgICAgICB0eXBlOiBJTWF0Y2guRW51bVJ1bGVUeXBlLldPUkQsXHJcbiAgICAgICAgd29yZDogb01kbC5kb21haW4sXHJcbiAgICAgICAgYml0aW5kZXg6IG9NZGwuYml0aW5kZXgsXHJcbiAgICAgICAgYml0U2VudGVuY2VBbmQ6IG9NZGwuYml0aW5kZXgsXHJcbiAgICAgICAgd29yZFR5cGU6IElNYXRjaC5XT1JEVFlQRS5ET01BSU4sXHJcbiAgICAgICAgX3Jhbmtpbmc6IDAuOTVcclxuICAgIH0sIG9Nb2RlbC5zZWVuUnVsZXMpO1xyXG5cclxuICAgIC8vIGFkZCBkb21haW4gc3lub255bXNcclxuICAgIGlmIChtb2RlbERvYy5kb21haW5fc3lub255bXMgJiYgbW9kZWxEb2MuZG9tYWluX3N5bm9ueW1zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBhZGRTeW5vbnltcyhtb2RlbERvYy5kb21haW5fc3lub255bXMsIFwiZG9tYWluXCIsIG1vZGVsRG9jLmRvbWFpbiwgb01kbC5iaXRpbmRleCxcclxuICAgICAgICAgICAgb01kbC5iaXRpbmRleCwgSU1hdGNoLldPUkRUWVBFLkRPTUFJTiwgb01vZGVsLm1SdWxlcywgb01vZGVsLnNlZW5SdWxlcyk7XHJcbiAgICAgICAgYWRkU3lub255bXMobW9kZWxEb2MuZG9tYWluX3N5bm9ueW1zLCBcImRvbWFpblwiLCBtb2RlbERvYy5kb21haW4sIGdldERvbWFpbkJpdEluZGV4U2FmZShET01BSU5fTUVUQU1PREVMLCBvTW9kZWwpLFxyXG4gICAgICAgICAgICAgICAgICBnZXREb21haW5CaXRJbmRleFNhZmUoRE9NQUlOX01FVEFNT0RFTCwgb01vZGVsKSxcclxuICAgICAgICAgICAgICAgIElNYXRjaC5XT1JEVFlQRS5GQUNULCBvTW9kZWwubVJ1bGVzLCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuICAgICAgICAvLyBUT0RPOiBzeW5vbnltIGhhdmUgdG8gYmUgYWRkZWQgYXMgKkZBQ1QqIGZvciB0aGUgbWV0YW1vZGVsIVxyXG5cclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgICAgLy8gY2hlY2sgdGhlIHRvb2xcclxuICAgICAgICBpZiAob01kbC50b29sICYmIG9NZGwudG9vbC5yZXF1aXJlcykge1xyXG4gICAgICAgICAgICB2YXIgcmVxdWlyZXMgPSBPYmplY3Qua2V5cyhvTWRsLnRvb2wucmVxdWlyZXMgfHwge30pO1xyXG4gICAgICAgICAgICB2YXIgZGlmZiA9IF8uZGlmZmVyZW5jZShyZXF1aXJlcywgb01kbC5jYXRlZ29yeSk7XHJcbiAgICAgICAgICAgIGlmIChkaWZmLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgJHtvTWRsLmRvbWFpbn0gOiBVbmtvd24gY2F0ZWdvcnkgaW4gcmVxdWlyZXMgb2YgdG9vbDogXCJgICsgZGlmZi5qb2luKCdcIicpICsgJ1wiJyk7XHJcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoLTEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBvcHRpb25hbCA9IE9iamVjdC5rZXlzKG9NZGwudG9vbC5vcHRpb25hbCk7XHJcbiAgICAgICAgICAgIGRpZmYgPSBfLmRpZmZlcmVuY2Uob3B0aW9uYWwsIG9NZGwuY2F0ZWdvcnkpO1xyXG4gICAgICAgICAgICBpZiAoZGlmZi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICR7b01kbC5kb21haW59IDogVW5rb3duIGNhdGVnb3J5IG9wdGlvbmFsIG9mIHRvb2w6IFwiYCArIGRpZmYuam9pbignXCInKSArICdcIicpO1xyXG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KC0xKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhvTWRsLnRvb2wuc2V0cyB8fCB7fSkuZm9yRWFjaChmdW5jdGlvbiAoc2V0SUQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBkaWZmID0gXy5kaWZmZXJlbmNlKG9NZGwudG9vbC5zZXRzW3NldElEXS5zZXQsIG9NZGwuY2F0ZWdvcnkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRpZmYubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgJHtvTWRsLmRvbWFpbn0gOiBVbmtvd24gY2F0ZWdvcnkgaW4gc2V0SWQgJHtzZXRJRH0gb2YgdG9vbDogXCJgICsgZGlmZi5qb2luKCdcIicpICsgJ1wiJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KC0xKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBleHRyYWN0IHRvb2xzIGFuIGFkZCB0byB0b29sczpcclxuICAgICAgICAgICAgb01vZGVsLnRvb2xzLmZpbHRlcihmdW5jdGlvbiAob0VudHJ5KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob0VudHJ5Lm5hbWUgPT09IChvTWRsLnRvb2wgJiYgb01kbC50b29sLm5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUb29sIFwiICsgb01kbC50b29sLm5hbWUgKyBcIiBhbHJlYWR5IHByZXNlbnQgd2hlbiBsb2FkaW5nIFwiICsgc01vZGVsTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy90aHJvdyBuZXcgRXJyb3IoJ0RvbWFpbiBhbHJlYWR5IGxvYWRlZD8nKTtcclxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoLTEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBvTWRsLnRvb2xoaWRkZW4gPSB0cnVlO1xyXG4gICAgICAgICAgICBvTWRsLnRvb2wucmVxdWlyZXMgPSB7IFwiaW1wb3NzaWJsZVwiOiB7fSB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBhZGQgdGhlIHRvb2wgbmFtZSBhcyBydWxlIHVubGVzcyBoaWRkZW5cclxuICAgICAgICBpZiAoIW9NZGwudG9vbGhpZGRlbiAmJiBvTWRsLnRvb2wgJiYgb01kbC50b29sLm5hbWUpIHtcclxuICAgICAgICAgICAgaW5zZXJ0UnVsZUlmTm90UHJlc2VudChvTW9kZWwubVJ1bGVzLCB7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yeTogXCJ0b29sXCIsXHJcbiAgICAgICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBvTWRsLnRvb2wubmFtZSxcclxuICAgICAgICAgICAgICAgIHR5cGU6IElNYXRjaC5FbnVtUnVsZVR5cGUuV09SRCxcclxuICAgICAgICAgICAgICAgIHdvcmQ6IG9NZGwudG9vbC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgYml0aW5kZXg6IG9NZGwuYml0aW5kZXgsXHJcbiAgICAgICAgICAgICAgICBiaXRTZW50ZW5jZUFuZCA6IG9NZGwuYml0aW5kZXgsXHJcbiAgICAgICAgICAgICAgICB3b3JkVHlwZSA6IElNYXRjaC5XT1JEVFlQRS5UT09MLFxyXG4gICAgICAgICAgICAgICAgX3Jhbmtpbmc6IDAuOTVcclxuICAgICAgICAgICAgfSwgb01vZGVsLnNlZW5SdWxlcyk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBpZiAob01kbC5zeW5vbnltcyAmJiBvTWRsLnN5bm9ueW1zW1widG9vbFwiXSkge1xyXG4gICAgICAgICAgICBhZGRTeW5vbnltcyhvTWRsLnN5bm9ueW1zW1widG9vbFwiXSwgXCJ0b29sXCIsIG9NZGwudG9vbC5uYW1lLCBvTWRsLmJpdGluZGV4LFxyXG4gICAgICAgICAgICBvTWRsLmJpdGluZGV4LCBJTWF0Y2guV09SRFRZUEUuVE9PTCwgb01vZGVsLm1SdWxlcywgb01vZGVsLnNlZW5SdWxlcyk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAqL1xyXG5cclxuICAgIC8vIGFkZCBzeW5zb255bSBmb3IgdGhlIGRvbWFpbnNcclxuXHJcblxyXG4gICAgLy8gYWRkIHN5bm9ueW1zIGZvciB0aGUgY2F0ZWdvcmllc1xyXG5cclxuICAgIG1vZGVsRG9jLl9jYXRlZ29yaWVzLmZvckVhY2goY2F0ID0+IHtcclxuICAgICAgICBpZiAoY2F0LmNhdGVnb3J5X3N5bm9ueW1zICYmIGNhdC5jYXRlZ29yeV9zeW5vbnltcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGlmIChvTW9kZWwuZnVsbC5kb21haW5bb01kbC5kb21haW5dLmNhdGVnb3JpZXNbY2F0LmNhdGVnb3J5XSkge1xyXG4gICAgICAgICAgICAgICAgb01vZGVsLmZ1bGwuZG9tYWluW29NZGwuZG9tYWluXS5jYXRlZ29yaWVzW2NhdC5jYXRlZ29yeV0uY2F0ZWdvcnlfc3lub255bXMgPSBjYXQuY2F0ZWdvcnlfc3lub255bXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYWRkU3lub255bXMoY2F0LmNhdGVnb3J5X3N5bm9ueW1zLCBcImNhdGVnb3J5XCIsIGNhdC5jYXRlZ29yeSwgb01kbC5iaXRpbmRleCwgb01kbC5iaXRpbmRleCxcclxuICAgICAgICAgICAgICAgIElNYXRjaC5XT1JEVFlQRS5DQVRFR09SWSwgb01vZGVsLm1SdWxlcywgb01vZGVsLnNlZW5SdWxlcyk7XHJcbiAgICAgICAgICAgIC8vIGFkZCBzeW5vbnltcyBpbnRvIHRoZSBtZXRhbW9kZWwgZG9tYWluXHJcbiAgICAgICAgICAgIGFkZFN5bm9ueW1zKGNhdC5jYXRlZ29yeV9zeW5vbnltcywgXCJjYXRlZ29yeVwiLCBjYXQuY2F0ZWdvcnksIGdldERvbWFpbkJpdEluZGV4U2FmZShET01BSU5fTUVUQU1PREVMLCBvTW9kZWwpLFxyXG4gICAgICAgICAgICAgICAgICBnZXREb21haW5CaXRJbmRleFNhZmUoRE9NQUlOX01FVEFNT0RFTCwgb01vZGVsKSxcclxuICAgICAgICAgICAgICAgIElNYXRjaC5XT1JEVFlQRS5GQUNULCBvTW9kZWwubVJ1bGVzLCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIGFkZCBvcGVyYXRvcnNcclxuXHJcbiAgICAvLyBhZGQgZmlsbGVyc1xyXG4gICAgaWYob01vZGVsLmRvbWFpbnMuaW5kZXhPZihvTWRsLmRvbWFpbikgPCAwKSB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoJ21pc3NpbmcgZG9tYWluIHJlZ2lzdHJhdGlvbiBmb3IgJyArIG9NZGwuZG9tYWluKTtcclxuICAgIH1cclxuICAgIC8vb01vZGVsLmRvbWFpbnMucHVzaChvTWRsLmRvbWFpbik7XHJcbiAgICBvTW9kZWwuY2F0ZWdvcnkgPSBvTW9kZWwuY2F0ZWdvcnkuY29uY2F0KG9NZGwuY2F0ZWdvcnkpO1xyXG4gICAgb01vZGVsLmNhdGVnb3J5LnNvcnQoKTtcclxuICAgIG9Nb2RlbC5jYXRlZ29yeSA9IG9Nb2RlbC5jYXRlZ29yeS5maWx0ZXIoZnVuY3Rpb24gKHN0cmluZywgaW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gb01vZGVsLmNhdGVnb3J5W2luZGV4XSAhPT0gb01vZGVsLmNhdGVnb3J5W2luZGV4ICsgMV07XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBvTWRsO1xyXG59IC8vIGxvYWRtb2RlbFxyXG5cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRSdWxlcyhydWxlczogSU1hdGNoLm1SdWxlW10pOiBJTWF0Y2guU3BsaXRSdWxlcyB7XHJcbiAgICB2YXIgcmVzID0ge307XHJcbiAgICB2YXIgbm9uV29yZFJ1bGVzID0gW107XHJcbiAgICBydWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChydWxlKSB7XHJcbiAgICAgICAgaWYgKHJ1bGUudHlwZSA9PT0gSU1hdGNoLkVudW1SdWxlVHlwZS5XT1JEKSB7XHJcbiAgICAgICAgICAgIGlmICghcnVsZS5sb3dlcmNhc2V3b3JkKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSdWxlIGhhcyBubyBtZW1iZXIgbG93ZXJjYXNld29yZFwiICsgSlNPTi5zdHJpbmdpZnkocnVsZSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlc1tydWxlLmxvd2VyY2FzZXdvcmRdID0gcmVzW3J1bGUubG93ZXJjYXNld29yZF0gfHwgeyBiaXRpbmRleDogMCwgcnVsZXM6IFtdIH07XHJcbiAgICAgICAgICAgIHJlc1tydWxlLmxvd2VyY2FzZXdvcmRdLmJpdGluZGV4ID0gcmVzW3J1bGUubG93ZXJjYXNld29yZF0uYml0aW5kZXggfCBydWxlLmJpdGluZGV4O1xyXG4gICAgICAgICAgICByZXNbcnVsZS5sb3dlcmNhc2V3b3JkXS5ydWxlcy5wdXNoKHJ1bGUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG5vbldvcmRSdWxlcy5wdXNoKHJ1bGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB3b3JkTWFwOiByZXMsXHJcbiAgICAgICAgbm9uV29yZFJ1bGVzOiBub25Xb3JkUnVsZXMsXHJcbiAgICAgICAgYWxsUnVsZXM6IHJ1bGVzLFxyXG4gICAgICAgIHdvcmRDYWNoZToge31cclxuICAgIH07XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc29ydEZsYXRSZWNvcmRzKGEsYikge1xyXG4gICAgdmFyIGtleXMgPSBfLnVuaW9uKE9iamVjdC5rZXlzKGEpLE9iamVjdC5rZXlzKGIpKS5zb3J0KCk7XHJcbiAgICB2YXIgciA9IDA7XHJcbiAgICBrZXlzLmV2ZXJ5KCAoa2V5KSA9PiB7XHJcbiAgICAgICAgaWYodHlwZW9mIGFba2V5XSA9PT0gXCJzdHJpbmdcIiAmJiB0eXBlb2YgYltrZXldICE9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIHIgPSAtMTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0eXBlb2YgYVtrZXldICE9PSBcInN0cmluZ1wiICYmIHR5cGVvZiBiW2tleV0gPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgciA9ICsxO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHR5cGVvZiBhW2tleV0gIT09IFwic3RyaW5nXCIgJiYgdHlwZW9mIGJba2V5XSAhPT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICByID0gMDtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHIgPSBhW2tleV0ubG9jYWxlQ29tcGFyZShiW2tleV0pO1xyXG4gICAgICAgIHJldHVybiByID09PSAwO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcjtcclxufTtcclxuXHJcblxyXG5mdW5jdGlvbiBjbXBMZW5ndGhTb3J0KGE6IHN0cmluZywgYjogc3RyaW5nKSB7XHJcbiAgICB2YXIgZCA9IGEubGVuZ3RoIC0gYi5sZW5ndGg7XHJcbiAgICBpZiAoZCkge1xyXG4gICAgICAgIHJldHVybiBkO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGEubG9jYWxlQ29tcGFyZShiKTtcclxufVxyXG5cclxuXHJcbmltcG9ydCAqIGFzIEFsZ29sIGZyb20gJy4uL21hdGNoL2FsZ29sJztcclxuLy8gb2Zmc2V0WzBdIDogbGVuLTJcclxuLy8gICAgICAgICAgICAgbGVuIC0xXHJcbi8vICAgICAgICAgICAgIGxlblxyXG4vLyAgICAgICAgICAgICBsZW4gKzFcclxuLy8gICAgICAgICAgICAgbGVuICsyXHJcbi8vICAgICAgICAgICAgIGxlbiArM1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbmROZXh0TGVuKHRhcmdldExlbjogbnVtYmVyLCBhcnI6IHN0cmluZ1tdLCBvZmZzZXRzOiBudW1iZXJbXSkge1xyXG4gICAgb2Zmc2V0cy5zaGlmdCgpO1xyXG4gICAgZm9yICh2YXIgaSA9IG9mZnNldHNbNF07IChpIDwgYXJyLmxlbmd0aCkgJiYgKGFycltpXS5sZW5ndGggPD0gdGFyZ2V0TGVuKTsgKytpKSB7XHJcbiAgICAgICAgLyogZW1wdHkqL1xyXG4gICAgfVxyXG4gICAgb2Zmc2V0cy5wdXNoKGkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYWRkUmFuZ2VSdWxlc1VubGVzc1ByZXNlbnQocnVsZXM6IElNYXRjaC5tUnVsZVtdLCBsY3dvcmQ6IHN0cmluZywgcmFuZ2VSdWxlczogSU1hdGNoLm1SdWxlW10sIHByZXNlbnRSdWxlc0ZvcktleTogSU1hdGNoLm1SdWxlW10sIHNlZW5SdWxlcykge1xyXG4gICAgcmFuZ2VSdWxlcy5mb3JFYWNoKHJhbmdlUnVsZSA9PiB7XHJcbiAgICAgICAgdmFyIG5ld1J1bGUgPSAoT2JqZWN0IGFzIGFueSkuYXNzaWduKHt9LCByYW5nZVJ1bGUpO1xyXG4gICAgICAgIG5ld1J1bGUubG93ZXJjYXNld29yZCA9IGxjd29yZDtcclxuICAgICAgICBuZXdSdWxlLndvcmQgPSBsY3dvcmQ7XHJcbiAgICAgICAgLy9pZigobGN3b3JkID09PSAnc2VydmljZXMnIHx8IGxjd29yZCA9PT0gJ3NlcnZpY2UnKSAmJiBuZXdSdWxlLnJhbmdlLnJ1bGUubG93ZXJjYXNld29yZC5pbmRleE9mKCdvZGF0YScpPj0wKSB7XHJcbiAgICAgICAgLy8gICAgY29uc29sZS5sb2coXCJhZGRpbmcgXCIrIEpTT04uc3RyaW5naWZ5KG5ld1J1bGUpICsgXCJcXG5cIik7XHJcbiAgICAgICAgLy99XHJcbiAgICAgICAgLy90b2RvOiBjaGVjayB3aGV0aGVyIGFuIGVxdWl2YWxlbnQgcnVsZSBpcyBhbHJlYWR5IHByZXNlbnQ/XHJcbiAgICAgICAgdmFyIGNudCA9IHJ1bGVzLmxlbmd0aDtcclxuICAgICAgICBpbnNlcnRSdWxlSWZOb3RQcmVzZW50KHJ1bGVzLCBuZXdSdWxlLCBzZWVuUnVsZXMpO1xyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhZGRDbG9zZUV4YWN0UmFuZ2VSdWxlcyhydWxlczogSU1hdGNoLm1SdWxlW10sIHNlZW5SdWxlcykge1xyXG4gICAgdmFyIGtleXNNYXAgPSB7fSBhcyB7IFtrZXk6IHN0cmluZ106IElNYXRjaC5tUnVsZVtdIH07XHJcbiAgICB2YXIgcmFuZ2VLZXlzTWFwID0ge30gYXMgeyBba2V5OiBzdHJpbmddOiBJTWF0Y2gubVJ1bGVbXSB9O1xyXG4gICAgcnVsZXMuZm9yRWFjaChydWxlID0+IHtcclxuICAgICAgICBpZiAocnVsZS50eXBlID09PSBJTWF0Y2guRW51bVJ1bGVUeXBlLldPUkQpIHtcclxuICAgICAgICAgICAgLy9rZXlzTWFwW3J1bGUubG93ZXJjYXNld29yZF0gPSAxO1xyXG4gICAgICAgICAgICBrZXlzTWFwW3J1bGUubG93ZXJjYXNld29yZF0gPSBrZXlzTWFwW3J1bGUubG93ZXJjYXNld29yZF0gfHwgW107XHJcbiAgICAgICAgICAgIGtleXNNYXBbcnVsZS5sb3dlcmNhc2V3b3JkXS5wdXNoKHJ1bGUpO1xyXG4gICAgICAgICAgICBpZiAoIXJ1bGUuZXhhY3RPbmx5ICYmIHJ1bGUucmFuZ2UpIHtcclxuICAgICAgICAgICAgICAgIHJhbmdlS2V5c01hcFtydWxlLmxvd2VyY2FzZXdvcmRdID0gcmFuZ2VLZXlzTWFwW3J1bGUubG93ZXJjYXNld29yZF0gfHwgW107XHJcbiAgICAgICAgICAgICAgICByYW5nZUtleXNNYXBbcnVsZS5sb3dlcmNhc2V3b3JkXS5wdXNoKHJ1bGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGtleXNNYXApO1xyXG4gICAga2V5cy5zb3J0KGNtcExlbmd0aFNvcnQpO1xyXG4gICAgdmFyIGxlbiA9IDA7XHJcbiAgICBrZXlzLmZvckVhY2goKGtleSwgaW5kZXgpID0+IHtcclxuICAgICAgICBpZiAoa2V5Lmxlbmd0aCAhPSBsZW4pIHtcclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcInNoaWZ0IHRvIGxlblwiICsga2V5Lmxlbmd0aCArICcgYXQgJyArIGluZGV4ICsgJyAnICsga2V5ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxlbiA9IGtleS5sZW5ndGg7XHJcbiAgICB9KTtcclxuICAgIC8vICAga2V5cyA9IGtleXMuc2xpY2UoMCwyMDAwKTtcclxuICAgIHZhciByYW5nZUtleXMgPSBPYmplY3Qua2V5cyhyYW5nZUtleXNNYXApO1xyXG4gICAgcmFuZ2VLZXlzLnNvcnQoY21wTGVuZ3RoU29ydCk7XHJcbiAgICAvL2NvbnNvbGUubG9nKGAgJHtrZXlzLmxlbmd0aH0ga2V5cyBhbmQgJHtyYW5nZUtleXMubGVuZ3RofSByYW5nZWtleXMgYCk7XHJcbiAgICB2YXIgbG93ID0gMDtcclxuICAgIHZhciBoaWdoID0gMDtcclxuICAgIHZhciBsYXN0bGVuID0gMDtcclxuICAgIHZhciBvZmZzZXRzID0gWzAsIDAsIDAsIDAsIDAsIDBdO1xyXG4gICAgdmFyIGxlbiA9IHJhbmdlS2V5cy5sZW5ndGg7XHJcbiAgICBmaW5kTmV4dExlbigwLCBrZXlzLCBvZmZzZXRzKTtcclxuICAgIGZpbmROZXh0TGVuKDEsIGtleXMsIG9mZnNldHMpO1xyXG4gICAgZmluZE5leHRMZW4oMiwga2V5cywgb2Zmc2V0cyk7XHJcblxyXG4gICAgcmFuZ2VLZXlzLmZvckVhY2goZnVuY3Rpb24gKHJhbmdlS2V5KSB7XHJcbiAgICAgICAgaWYgKHJhbmdlS2V5Lmxlbmd0aCAhPT0gbGFzdGxlbikge1xyXG4gICAgICAgICAgICBmb3IgKGkgPSBsYXN0bGVuICsgMTsgaSA8PSByYW5nZUtleS5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgZmluZE5leHRMZW4oaSArIDIsIGtleXMsIG9mZnNldHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vICAgY29uc29sZS5sb2coYCBzaGlmdGVkIHRvICR7cmFuZ2VLZXkubGVuZ3RofSB3aXRoIG9mZnNldHMgYmVlaW5nICR7b2Zmc2V0cy5qb2luKCcgJyl9YCk7XHJcbiAgICAgICAgICAgIC8vICAgY29uc29sZS5sb2coYCBoZXJlIDAgJHtvZmZzZXRzWzBdfSA6ICR7a2V5c1tNYXRoLm1pbihrZXlzLmxlbmd0aC0xLCBvZmZzZXRzWzBdKV0ubGVuZ3RofSAgJHtrZXlzW01hdGgubWluKGtleXMubGVuZ3RoLTEsIG9mZnNldHNbMF0pXX0gYCk7XHJcbiAgICAgICAgICAgIC8vICBjb25zb2xlLmxvZyhgIGhlcmUgNS0xICAke2tleXNbb2Zmc2V0c1s1XS0xXS5sZW5ndGh9ICAke2tleXNbb2Zmc2V0c1s1XS0xXX0gYCk7XHJcbiAgICAgICAgICAgIC8vICAgY29uc29sZS5sb2coYCBoZXJlIDUgJHtvZmZzZXRzWzVdfSA6ICR7a2V5c1tNYXRoLm1pbihrZXlzLmxlbmd0aC0xLCBvZmZzZXRzWzVdKV0ubGVuZ3RofSAgJHtrZXlzW01hdGgubWluKGtleXMubGVuZ3RoLTEsIG9mZnNldHNbNV0pXX0gYCk7XHJcbiAgICAgICAgICAgIGxhc3RsZW4gPSByYW5nZUtleS5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAodmFyIGkgPSBvZmZzZXRzWzBdOyBpIDwgb2Zmc2V0c1s1XTsgKytpKSB7XHJcbiAgICAgICAgICAgIHZhciBkID0gRGlzdGFuY2UuY2FsY0Rpc3RhbmNlQWRqdXN0ZWQocmFuZ2VLZXksIGtleXNbaV0pO1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtyYW5nZUtleS5sZW5ndGgta2V5c1tpXS5sZW5ndGh9ICR7ZH0gJHtyYW5nZUtleX0gYW5kICR7a2V5c1tpXX0gIGApO1xyXG4gICAgICAgICAgICBpZiAoKGQgIT09IDEuMCkgJiYgKGQgPj0gQWxnb2wuQ3V0b2ZmX3JhbmdlQ2xvc2VNYXRjaCkpIHtcclxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coYHdvdWxkIGFkZCAke3JhbmdlS2V5fSBmb3IgJHtrZXlzW2ldfSAke2R9YCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgY250ID0gcnVsZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgLy8gd2Ugb25seSBoYXZlIHRvIGFkZCBpZiB0aGVyZSBpcyBub3QgeWV0IGEgbWF0Y2ggcnVsZSBoZXJlIHdoaWNoIHBvaW50cyB0byB0aGUgc2FtZVxyXG4gICAgICAgICAgICAgICAgYWRkUmFuZ2VSdWxlc1VubGVzc1ByZXNlbnQocnVsZXMsIGtleXNbaV0sIHJhbmdlS2V5c01hcFtyYW5nZUtleV0sIGtleXNNYXBba2V5c1tpXV0sIHNlZW5SdWxlcyk7XHJcbiAgICAgICAgICAgICAgICBpZiAocnVsZXMubGVuZ3RoID4gY250KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhgIGFkZGVkICR7KHJ1bGVzLmxlbmd0aCAtIGNudCl9IHJlY29yZHMgYXQke3JhbmdlS2V5fSBmb3IgJHtrZXlzW2ldfSAke2R9YCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvKlxyXG4gICAgW1xyXG4gICAgICAgIFsnYUVGRycsJ2FFRkdIJ10sXHJcbiAgICAgICAgWydhRUZHSCcsJ2FFRkdISSddLFxyXG4gICAgICAgIFsnT2RhdGEnLCdPRGF0YXMnXSxcclxuICAgWydPZGF0YScsJ09kYXRhcyddLFxyXG4gICBbJ09kYXRhJywnT2RhdGInXSxcclxuICAgWydPZGF0YScsJ1VEYXRhJ10sXHJcbiAgIFsnc2VydmljZScsJ3NlcnZpY2VzJ10sXHJcbiAgIFsndGhpcyBpc2Z1bm55IGFuZCBtb3JlJywndGhpcyBpc2Z1bm55IGFuZCBtb3JlcyddLFxyXG4gICAgXS5mb3JFYWNoKHJlYyA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coYGRpc3RhbmNlICR7cmVjWzBdfSAke3JlY1sxXX0gOiAke0Rpc3RhbmNlLmNhbGNEaXN0YW5jZShyZWNbMF0scmVjWzFdKX0gIGFkZiAke0Rpc3RhbmNlLmNhbGNEaXN0YW5jZUFkanVzdGVkKHJlY1swXSxyZWNbMV0pfSBgKTtcclxuXHJcbiAgICB9KTtcclxuICAgIGNvbnNvbGUubG9nKFwiZGlzdGFuY2UgT2RhdGEgVWRhdGFcIisgRGlzdGFuY2UuY2FsY0Rpc3RhbmNlKCdPRGF0YScsJ1VEYXRhJykpO1xyXG4gICAgY29uc29sZS5sb2coXCJkaXN0YW5jZSBPZGF0YSBPZGF0YlwiKyBEaXN0YW5jZS5jYWxjRGlzdGFuY2UoJ09EYXRhJywnT0RhdGInKSk7XHJcbiAgICBjb25zb2xlLmxvZyhcImRpc3RhbmNlIE9kYXRhcyBPZGF0YVwiKyBEaXN0YW5jZS5jYWxjRGlzdGFuY2UoJ09EYXRhJywnT0RhdGFhJykpO1xyXG4gICAgY29uc29sZS5sb2coXCJkaXN0YW5jZSBPZGF0YXMgYWJjZGVcIisgRGlzdGFuY2UuY2FsY0Rpc3RhbmNlKCdhYmNkZScsJ2FiY2RlZicpKTtcclxuICAgIGNvbnNvbGUubG9nKFwiZGlzdGFuY2Ugc2VydmljZXMgXCIrIERpc3RhbmNlLmNhbGNEaXN0YW5jZSgnc2VydmljZXMnLCdzZXJ2aWNlJykpO1xyXG4gICAgKi9cclxufVxyXG52YXIgbiA9IDA7XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRGaWxsZXJzKHNyY0hhbmRsZSA6IElTcmNIYW5kbGUsIG9Nb2RlbCA6IElNYXRjaC5JTW9kZWxzKSAgOiBQcm9taXNlPGFueT4ge1xyXG4gICAgdmFyIGZpbGxlckJpdEluZGV4ID0gZ2V0RG9tYWluQml0SW5kZXgoJ21ldGEnLCBvTW9kZWwpO1xyXG4gICAgdmFyIGJpdEluZGV4QWxsRG9tYWlucyA9IGdldEFsbERvbWFpbnNCaXRJbmRleChvTW9kZWwpO1xyXG4gICAgcmV0dXJuIFNjaGVtYWxvYWQuZ2V0RmlsbGVyc0Zyb21EQihzcmNIYW5kbGUpXHJcbiAgICAvLy50aGVuKFxyXG4vLyAgICAgICAgKGZpbGxlcnNPYmopID0+IGZpbGxlcnNPYmouZmlsbGVyc1xyXG4gIC8vICApXHJcbiAgICAudGhlbigoZmlsbGVyczogc3RyaW5nW10pID0+IHtcclxuICAgICAgICAvLyAgZmlsbGVyc3JlYWRGaWxlQXNKU09OKCcuLycgKyBtb2RlbFBhdGggKyAnL2ZpbGxlci5qc29uJyk7XHJcbiAgICAgICAgLypcclxuICAgICAgICB2YXIgcmUgPSBcIl4oKFwiICsgZmlsbGVycy5qb2luKFwiKXwoXCIpICsgXCIpKSRcIjtcclxuICAgICAgICBvTW9kZWwubVJ1bGVzLnB1c2goe1xyXG4gICAgICAgICAgICBjYXRlZ29yeTogXCJmaWxsZXJcIixcclxuICAgICAgICAgICAgdHlwZTogSU1hdGNoLkVudW1SdWxlVHlwZS5SRUdFWFAsXHJcbiAgICAgICAgICAgIHJlZ2V4cDogbmV3IFJlZ0V4cChyZSwgXCJpXCIpLFxyXG4gICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBcImZpbGxlclwiLFxyXG4gICAgICAgICAgICBiaXRpbmRleDogZmlsbGVyQml0SW5kZXgsXHJcbiAgICAgICAgICAgIF9yYW5raW5nOiAwLjlcclxuICAgICAgICB9KTtcclxuICAgICAgICAqL1xyXG4gICAgICAgIGlmICghXy5pc0FycmF5KGZpbGxlcnMpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZXhwZWN0IGZpbGxlcnMgdG8gYmUgYW4gYXJyYXkgb2Ygc3RyaW5ncycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaWxsZXJzLmZvckVhY2goZmlsbGVyID0+IHtcclxuICAgICAgICAgICAgaW5zZXJ0UnVsZUlmTm90UHJlc2VudChvTW9kZWwubVJ1bGVzLCB7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yeTogXCJmaWxsZXJcIixcclxuICAgICAgICAgICAgICAgIHR5cGU6IElNYXRjaC5FbnVtUnVsZVR5cGUuV09SRCxcclxuICAgICAgICAgICAgICAgIHdvcmQ6IGZpbGxlcixcclxuICAgICAgICAgICAgICAgIGxvd2VyY2FzZXdvcmQ6IGZpbGxlci50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogZmlsbGVyLCAvL1wiZmlsbGVyXCIsXHJcbiAgICAgICAgICAgICAgICBleGFjdE9ubHk6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBiaXRpbmRleDogZmlsbGVyQml0SW5kZXgsXHJcbiAgICAgICAgICAgICAgICBiaXRTZW50ZW5jZUFuZDogYml0SW5kZXhBbGxEb21haW5zLFxyXG4gICAgICAgICAgICAgICAgd29yZFR5cGU6IElNYXRjaC5XT1JEVFlQRS5GSUxMRVIsXHJcbiAgICAgICAgICAgICAgICBfcmFua2luZzogMC45XHJcbiAgICAgICAgICAgIH0sIG9Nb2RlbC5zZWVuUnVsZXMpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRPcGVyYXRvcnMoc3JjSGFuZGxlOiBJU3JjSGFuZGxlLCBvTW9kZWw6IElNYXRjaC5JTW9kZWxzKSA6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgZGVidWdsb2coJ3JlYWRpbmcgb3BlcmF0b3JzJyk7XHJcbiAgICAgICAgLy9hZGQgb3BlcmF0b3JzXHJcbiAgICByZXR1cm4gU2NoZW1hbG9hZC5nZXRPcGVyYXRvcnNGcm9tREIoc3JjSGFuZGxlKS50aGVuKFxyXG4gICAgICAgIChvcGVyYXRvcnM6IGFueSkgPT4ge1xyXG4gICAgICAgIHZhciBvcGVyYXRvckJpdEluZGV4ID0gZ2V0RG9tYWluQml0SW5kZXgoJ29wZXJhdG9ycycsIG9Nb2RlbCk7XHJcbiAgICAgICAgdmFyIGJpdEluZGV4QWxsRG9tYWlucyA9IGdldEFsbERvbWFpbnNCaXRJbmRleChvTW9kZWwpO1xyXG4gICAgICAgIE9iamVjdC5rZXlzKG9wZXJhdG9ycy5vcGVyYXRvcnMpLmZvckVhY2goZnVuY3Rpb24gKG9wZXJhdG9yKSB7XHJcbiAgICAgICAgICAgIGlmIChJTWF0Y2guYU9wZXJhdG9yTmFtZXMuaW5kZXhPZihvcGVyYXRvcikgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZyhcInVua25vd24gb3BlcmF0b3IgXCIgKyBvcGVyYXRvcik7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmtub3duIG9wZXJhdG9yIFwiICsgb3BlcmF0b3IgKyAnIChhZGQgdG8gaWZtYXRjaC50cyAgYU9wZXJhdG9yTmFtZXMpJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb01vZGVsLm9wZXJhdG9yc1tvcGVyYXRvcl0gPSBvcGVyYXRvcnMub3BlcmF0b3JzW29wZXJhdG9yXTtcclxuICAgICAgICAgICAgb01vZGVsLm9wZXJhdG9yc1tvcGVyYXRvcl0ub3BlcmF0b3IgPSA8SU1hdGNoLk9wZXJhdG9yTmFtZT5vcGVyYXRvcjtcclxuICAgICAgICAgICAgT2JqZWN0LmZyZWV6ZShvTW9kZWwub3BlcmF0b3JzW29wZXJhdG9yXSk7XHJcbiAgICAgICAgICAgIHZhciB3b3JkID0gb3BlcmF0b3I7XHJcbiAgICAgICAgICAgIGluc2VydFJ1bGVJZk5vdFByZXNlbnQob01vZGVsLm1SdWxlcywge1xyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcnk6IFwib3BlcmF0b3JcIixcclxuICAgICAgICAgICAgICAgIHdvcmQ6IHdvcmQudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICAgICAgICAgIGxvd2VyY2FzZXdvcmQ6IHdvcmQudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICAgICAgICAgIHR5cGU6IElNYXRjaC5FbnVtUnVsZVR5cGUuV09SRCxcclxuICAgICAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IHdvcmQsXHJcbiAgICAgICAgICAgICAgICBiaXRpbmRleDogb3BlcmF0b3JCaXRJbmRleCxcclxuICAgICAgICAgICAgICAgIGJpdFNlbnRlbmNlQW5kOiBiaXRJbmRleEFsbERvbWFpbnMsXHJcbiAgICAgICAgICAgICAgICB3b3JkVHlwZTogSU1hdGNoLldPUkRUWVBFLk9QRVJBVE9SLFxyXG4gICAgICAgICAgICAgICAgX3Jhbmtpbmc6IDAuOVxyXG4gICAgICAgICAgICB9LCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuICAgICAgICAgICAgLy8gYWRkIGFsbCBzeW5vbnltc1xyXG4gICAgICAgICAgICBpZiAob3BlcmF0b3JzLnN5bm9ueW1zW29wZXJhdG9yXSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IG9wZXJhdG9ycy5zeW5vbnltc1tvcGVyYXRvcl07XHJcbiAgICAgICAgICAgICAgICBpZiAoIGFyciApXHJcbiAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmKCBBcnJheS5pc0FycmF5KGFycikpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcnIuZm9yRWFjaChmdW5jdGlvbiAoc3lub255bSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zZXJ0UnVsZUlmTm90UHJlc2VudChvTW9kZWwubVJ1bGVzLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6IFwib3BlcmF0b3JcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JkOiBzeW5vbnltLnRvTG93ZXJDYXNlKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXJjYXNld29yZDogc3lub255bS50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IElNYXRjaC5FbnVtUnVsZVR5cGUuV09SRCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBvcGVyYXRvcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiaXRpbmRleDogb3BlcmF0b3JCaXRJbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiaXRTZW50ZW5jZUFuZDogYml0SW5kZXhBbGxEb21haW5zLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmRUeXBlOiBJTWF0Y2guV09SRFRZUEUuT1BFUkFUT1IsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3Jhbmtpbmc6IDAuOVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgb01vZGVsLnNlZW5SdWxlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFeHBldGVkIG9wZXJhdG9yIHN5bm9ueW0gdG8gYmUgYXJyYXkgXCIgKyBvcGVyYXRvciArIFwiIGlzIFwiICsgSlNPTi5zdHJpbmdpZnkoYXJyKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVsZWFzZU1vZGVsKG1vZGVsIDogSU1hdGNoLklNb2RlbHMpIHtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIExvYWRNb2RlbHMoIG1vZGVsUGF0aCA6IHN0cmluZyApIDogUHJvbWlzZTxJTWF0Y2guSU1vZGVscz4ge1xyXG4gICAgdmFyIHNyY0hhbmRsZSA9IFNyY0hhbmRsZS5jcmVhdGVTb3VyY2VIYW5kbGUoKTtcclxuICBpZiAoIG1vZGVsUGF0aCA9PSAnLi90ZXN0bW9kZWwnKSB7XHJcbiAgICBtb2RlbFBhdGggPSBfX2Rpcm5hbWUgKyAnLy4uLy4uL3Rlc3Rtb2RlbCc7XHJcbiAgfVxyXG4gIGlmICggbW9kZWxQYXRoID09ICcuL3Rlc3Rtb2RlbDInKSB7XHJcbiAgICBtb2RlbFBhdGggPSBfX2Rpcm5hbWUgKyBcIi8uLi8uLi90ZXN0bW9kZWwyXCI7XHJcbiAgfVxyXG4gIGNvbnNvbGUubG9nKCcgbW9kZWxwYXRoICcgKyBtb2RlbFBhdGgpXHJcbiAgcmV0dXJuIGxvYWRNb2RlbHNPcGVuaW5nQ29ubmVjdGlvbihzcmNIYW5kbGUsIG1vZGVsUGF0aCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAZGVwcmVjYXRlZCB1c2UgTG9hZE1vZGVsc1xyXG4gKiBAcGFyYW0gc3JjaGFuZGxlIFxyXG4gKiBAcGFyYW0gbW9kZWxQYXRoIFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRNb2RlbHNPcGVuaW5nQ29ubmVjdGlvbihzcmNoYW5kbGU6IElTcmNIYW5kbGUsIG1vZGVsUGF0aD8gOiBzdHJpbmcpIDogUHJvbWlzZTxJTWF0Y2guSU1vZGVscz4ge1xyXG4gICAgcmV0dXJuIGxvYWRNb2RlbHMoc3JjaGFuZGxlLCBtb2RlbFBhdGgpO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHNyY0hhbmRsZVxyXG4gKiBAcGFyYW0gbW9kZWxQYXRoXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbG9hZE1vZGVscyhzcmNIYW5kbGU6IElTcmNIYW5kbGUsIG1vZGVsUGF0aCA6IHN0cmluZykgOiBQcm9taXNlPElNYXRjaC5JTW9kZWxzPiB7XHJcbiAgICBpZihzcmNIYW5kbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignZXhwZWN0IGEgc3JjSGFuZGxlIGhhbmRsZSB0byBiZSBwYXNzZWQnKTtcclxuICAgIH1cclxuICAgIHJldHVybiBnZXRNb2RlbEhhbmRsZShzcmNIYW5kbGUsIG1vZGVsUGF0aCApLnRoZW4oIChtb2RlbEhhbmRsZSkgPT57XHJcbiAgICAgICAgZGVidWdsb2coYGdvdCBhIG1vbmdvIGhhbmRsZSBmb3IgJHttb2RlbFBhdGh9YCk7XHJcbiAgICAgICAgcmV0dXJuIF9sb2FkTW9kZWxzRnVsbChtb2RlbEhhbmRsZSwgbW9kZWxQYXRoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX2xvYWRNb2RlbHNGdWxsKG1vZGVsSGFuZGxlOiBJTWF0Y2guSU1vZGVsSGFuZGxlUmF3LCBtb2RlbFBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPElNYXRjaC5JTW9kZWxzPiB7XHJcbiAgICB2YXIgb01vZGVsOiBJTWF0Y2guSU1vZGVscztcclxuICAgIG1vZGVsUGF0aCA9IG1vZGVsUGF0aCB8fCBlbnZNb2RlbFBhdGg7XHJcbiAgICBtb2RlbEhhbmRsZSA9IG1vZGVsSGFuZGxlIHx8IHtcclxuICAgICAgICBzcmNIYW5kbGU6IHVuZGVmaW5lZCxcclxuICAgICAgICBtb2RlbERvY3M6IHt9LFxyXG4gICAgICAgIG1vbmdvTWFwczoge30sXHJcbiAgICAgICAgbW9kZWxFU2NoZW1hczoge31cclxuICAgIH07XHJcbiAgICBvTW9kZWwgPSB7XHJcbiAgICAgICAgbW9uZ29IYW5kbGUgOiBtb2RlbEhhbmRsZSxcclxuICAgICAgICBmdWxsOiB7IGRvbWFpbjoge30gfSxcclxuICAgICAgICByYXdNb2RlbEJ5RG9tYWluOiB7fSxcclxuICAgICAgICByYXdNb2RlbEJ5TW9kZWxOYW1lIDoge30sXHJcbiAgICAgICAgZG9tYWluczogW10sXHJcbiAgICAgICAgcnVsZXM6IHVuZGVmaW5lZCxcclxuICAgICAgICBjYXRlZ29yeTogW10sXHJcbiAgICAgICAgb3BlcmF0b3JzOiB7fSxcclxuICAgICAgICBtUnVsZXM6IFtdLFxyXG4gICAgICAgIHNlZW5SdWxlczoge30sXHJcbiAgICAgICAgbWV0YTogeyB0Mzoge30gfVxyXG4gICAgfVxyXG4gICAgdmFyIHQgPSBEYXRlLm5vdygpO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgZGVidWdsb2coKCk9PiAnaGVyZSBtb2RlbCBwYXRoJyArIG1vZGVsUGF0aCk7XHJcbiAgICAgICAgdmFyIGEgPSBDaXJjdWxhclNlci5sb2FkKG1vZGVsUGF0aCArICcvX2NhY2hlLmpzJyk7XHJcbiAgICAgICAgLy8gVE9ETyBSRU1PVkUgXHJcbiAgICAgICAgLy90aHJvdyBcIm5vIGNhY2hlXCI7XHJcbiAgICAgICAgLy8gVE9ET1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coXCJmb3VuZCBhIGNhY2hlID8gIFwiICsgISFhKTtcclxuICAgICAgICAvL2EgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgaWYgKGEgJiYgIXByb2Nlc3MuZW52Lk5MUV9BQk9UX05PX0ZJTEVDQUNIRSkge1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdyZXR1cm4gcHJlcHMnICsgbW9kZWxQYXRoKTtcclxuICAgICAgICAgICAgZGVidWdsb2coXCJcXG4gcmV0dXJuIHByZXBhcmVkIG1vZGVsICEhXCIpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInVzaW5nIHByZXBhcmVkIG1vZGVsICBcIiArIG1vZGVsUGF0aCk7XHJcbiAgICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5BQk9UX0VNQUlMX1VTRVIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibG9hZGVkIG1vZGVscyBmcm9tIGNhY2hlIGluIFwiICsgKERhdGUubm93KCkgLSB0KSArIFwiIFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgcmVzID0gYSBhcyBJTWF0Y2guSU1vZGVscztcclxuICAgICAgICAgICAgcmVzLm1vbmdvSGFuZGxlLnNyY0hhbmRsZSAgPSBtb2RlbEhhbmRsZS5zcmNIYW5kbGU7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzKTtcclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnZXJyb3InICsgZSk7XHJcbiAgICAgICAgLy8gbm8gY2FjaGUgZmlsZSxcclxuICAgIH1cclxuICAgIHZhciBtZGxzID0gT2JqZWN0LmtleXMobW9kZWxIYW5kbGUubW9kZWxEb2NzKS5zb3J0KCk7XHJcbiAgICB2YXIgc2VlbkRvbWFpbnMgPXt9O1xyXG4gICAgbWRscy5mb3JFYWNoKChtb2RlbE5hbWUsaW5kZXgpID0+IHtcclxuICAgICAgICB2YXIgZG9tYWluID0gbW9kZWxIYW5kbGUubW9kZWxEb2NzW21vZGVsTmFtZV0uZG9tYWluO1xyXG4gICAgICAgIGlmKHNlZW5Eb21haW5zW2RvbWFpbl0pIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEb21haW4gJyArIGRvbWFpbiArICcgYWxyZWFkeSBsb2FkZWQgd2hpbGUgbG9hZGluZyAnICsgbW9kZWxOYW1lICsgJz8nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc2VlbkRvbWFpbnNbZG9tYWluXSA9IGluZGV4O1xyXG4gICAgfSlcclxuICAgIG9Nb2RlbC5kb21haW5zID0gbWRscy5tYXAobW9kZWxOYW1lID0+IG1vZGVsSGFuZGxlLm1vZGVsRG9jc1ttb2RlbE5hbWVdLmRvbWFpbik7XHJcbiAgICAvLyBjcmVhdGUgYml0aW5kZXggaW4gb3JkZXIgIVxyXG4gICAgZGVidWdsb2coJ2dvdCBkb21haW5zICcgKyBtZGxzLmpvaW4oXCJcXG5cIikpO1xyXG4gICAgZGVidWdsb2coJ2xvYWRpbmcgbW9kZWxzICcgKyBtZGxzLmpvaW4oXCJcXG5cIikpO1xyXG5cclxuICAgIHJldHVybiBQcm9taXNlLmFsbChtZGxzLm1hcCgoc01vZGVsTmFtZSkgPT5cclxuICAgICAgICBsb2FkTW9kZWwobW9kZWxIYW5kbGUsIHNNb2RlbE5hbWUsIG9Nb2RlbCkpXHJcbiAgICApLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIHZhciBtZXRhQml0SW5kZXggPSBnZXREb21haW5CaXRJbmRleCgnbWV0YScsIG9Nb2RlbCk7XHJcbiAgICAgICAgdmFyIGJpdEluZGV4QWxsRG9tYWlucyA9IGdldEFsbERvbWFpbnNCaXRJbmRleChvTW9kZWwpO1xyXG5cclxuICAgICAgICAvLyBhZGQgdGhlIGRvbWFpbiBtZXRhIHJ1bGVcclxuICAgICAgICBpbnNlcnRSdWxlSWZOb3RQcmVzZW50KG9Nb2RlbC5tUnVsZXMsIHtcclxuICAgICAgICAgICAgY2F0ZWdvcnk6IFwibWV0YVwiLFxyXG4gICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBcImRvbWFpblwiLFxyXG4gICAgICAgICAgICB0eXBlOiBJTWF0Y2guRW51bVJ1bGVUeXBlLldPUkQsXHJcbiAgICAgICAgICAgIHdvcmQ6IFwiZG9tYWluXCIsXHJcbiAgICAgICAgICAgIGJpdGluZGV4OiBtZXRhQml0SW5kZXgsXHJcbiAgICAgICAgICAgIHdvcmRUeXBlOiBJTWF0Y2guV09SRFRZUEUuTUVUQSxcclxuICAgICAgICAgICAgYml0U2VudGVuY2VBbmQ6IGJpdEluZGV4QWxsRG9tYWlucyxcclxuICAgICAgICAgICAgX3Jhbmtpbmc6IDAuOTVcclxuICAgICAgICB9LCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuICAgICAgICAvLyBpbnNlcnQgdGhlIE51bWJlcnMgcnVsZXNcclxuICAgICAgICBkZWJ1Z2xvZygnIGFkZCBudW1iZXJzIHJ1bGUnKTtcclxuICAgICAgICBpbnNlcnRSdWxlSWZOb3RQcmVzZW50KG9Nb2RlbC5tUnVsZXMsIHtcclxuICAgICAgICAgICAgY2F0ZWdvcnk6IFwibnVtYmVyXCIsXHJcbiAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IFwib25lXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IElNYXRjaC5FbnVtUnVsZVR5cGUuUkVHRVhQLFxyXG4gICAgICAgICAgICByZWdleHAgOiAvXigoXFxkKyl8KG9uZSl8KHR3byl8KHRocmVlKSkkLyxcclxuICAgICAgICAgICAgbWF0Y2hJbmRleCA6IDAsXHJcbiAgICAgICAgICAgIHdvcmQ6IFwiPG51bWJlcj5cIixcclxuICAgICAgICAgICAgYml0aW5kZXg6IG1ldGFCaXRJbmRleCxcclxuICAgICAgICAgICAgd29yZFR5cGU6IElNYXRjaC5XT1JEVFlQRS5OVU1FUklDQVJHLCAvLyBudW1iZXJcclxuICAgICAgICAgICAgYml0U2VudGVuY2VBbmQ6IGJpdEluZGV4QWxsRG9tYWlucyxcclxuICAgICAgICAgICAgX3Jhbmtpbmc6IDAuOTVcclxuICAgICAgICB9LCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICApLnRoZW4oICgpPT5cclxuICAgICAgICByZWFkRmlsbGVycyhtb2RlbEhhbmRsZS5zcmNIYW5kbGUsIG9Nb2RlbClcclxuICAgICkudGhlbiggKCkgPT5cclxuICAgICAgICByZWFkT3BlcmF0b3JzKG1vZGVsSGFuZGxlLnNyY0hhbmRsZSwgb01vZGVsKVxyXG4gICAgKS50aGVuKCAoKSA9PiB7XHJcbiAgICAgICAgLypcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBjYXRlZ29yeTogXCJmaWxsZXJcIixcclxuICAgICAgICAgICAgICB0eXBlOiAxLFxyXG4gICAgICAgICAgICAgIHJlZ2V4cDogL14oKHN0YXJ0KXwoc2hvdyl8KGZyb20pfChpbikpJC9pLFxyXG4gICAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IFwiZmlsbGVyXCIsXHJcbiAgICAgICAgICAgICAgX3Jhbmtpbmc6IDAuOVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICovXHJcbiAgICAgICAgZGVidWdsb2coJ3NhdmluZyBkYXRhIHRvICcgKyBtb2RlbFBhdGgpO1xyXG4gICAgICAgIG9Nb2RlbC5tUnVsZXMgPSBvTW9kZWwubVJ1bGVzLnNvcnQoSW5wdXRGaWx0ZXJSdWxlcy5jbXBNUnVsZSk7XHJcbiAgICAgICAgYWRkQ2xvc2VFeGFjdFJhbmdlUnVsZXMob01vZGVsLm1SdWxlcywgb01vZGVsLnNlZW5SdWxlcyk7XHJcbiAgICAgICAgb01vZGVsLm1SdWxlcyA9IG9Nb2RlbC5tUnVsZXMuc29ydChJbnB1dEZpbHRlclJ1bGVzLmNtcE1SdWxlKTtcclxuICAgICAgICBvTW9kZWwubVJ1bGVzLnNvcnQoSW5wdXRGaWx0ZXJSdWxlcy5jbXBNUnVsZSk7XHJcbiAgICAgICAgLy9mcy53cml0ZUZpbGVTeW5jKFwicG9zdF9zb3J0XCIsIEpTT04uc3RyaW5naWZ5KG9Nb2RlbC5tUnVsZXMsdW5kZWZpbmVkLDIpKTtcclxuXHJcbiAgICAgICAgZm9yY2VHQygpO1xyXG4gICAgICAgIG9Nb2RlbC5ydWxlcyA9IHNwbGl0UnVsZXMob01vZGVsLm1SdWxlcyk7XHJcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhcInRlc3QxeC5qc29uXCIsIEpTT04uc3RyaW5naWZ5KG9Nb2RlbC5ydWxlcyx1bmRlZmluZWQsMikpO1xyXG4gICAgICAgIGZvcmNlR0MoKTtcclxuICAgICAgICBkZWxldGUgb01vZGVsLnNlZW5SdWxlcztcclxuICAgICAgICBkZWJ1Z2xvZygnc2F2aW5nJyk7XHJcbiAgICAgICAgZm9yY2VHQygpO1xyXG4gICAgICAgIHZhciBvTW9kZWxTZXIgPSBPYmplY3QuYXNzaWduKHt9LCBvTW9kZWwpO1xyXG4gICAgICAgIG9Nb2RlbFNlci5tb25nb0hhbmRsZSA9IE9iamVjdC5hc3NpZ24oe30sIG9Nb2RlbC5tb25nb0hhbmRsZSk7XHJcbiAgICAgICAgZGVidWdsb2coJ2NyZWF0ZWQgZGlyMSAnICsgbW9kZWxQYXRoKTsgXHJcbiAgICAgICAgZGVsZXRlIG9Nb2RlbFNlci5tb25nb0hhbmRsZS5zcmNIYW5kbGU7XHJcbiAgICAgICAgdHJ5IHtcclxuXHJcbiAgICAgICAgICAgIGFzc3VyZURpckV4aXN0cyhtb2RlbFBhdGgpO1xyXG4gICAgICAgICAgICBkZWJ1Z2xvZygnY3JlYXRlZCBkaXIgJyArIG1vZGVsUGF0aCk7XHJcbiAgICAgICAgICAgIENpcmN1bGFyU2VyLnNhdmUobW9kZWxQYXRoICsgJy9fY2FjaGUuanMnLCBvTW9kZWxTZXIpO1xyXG4gICAgICAgICAgICBmb3JjZUdDKCk7XHJcbiAgICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5BQk9UX0VNQUlMX1VTRVIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibG9hZGVkIG1vZGVscyBieSBjYWxjdWxhdGlvbiBpbiBcIiArIChEYXRlLm5vdygpIC0gdCkgKyBcIiBcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHJlcyA9IG9Nb2RlbDtcclxuICAgICAgICAgICAgLy8gKE9iamVjdCBhcyBhbnkpLmFzc2lnbihtb2RlbEhhbmRsZSwgeyBtb2RlbDogb01vZGVsIH0pIGFzIElNYXRjaC5JTW9kZWxIYW5kbGU7XHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfSBjYXRjaCggZXJyKSB7XHJcbiAgICAgICAgICAgIGRlYnVnbG9nKFwiXCIgKyBlcnIpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZXJyICcgKyBlcnIpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIgKyAnICcgKyBlcnIuc3RhY2spO1xyXG4gICAgICAgICAgICBwcm9jZXNzLnN0ZG91dC5vbignZHJhaW4nLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgtMSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJyAnICsgZXJyICArICcgJyArIGVyci5zdGFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICB9XHJcbiAgICApLmNhdGNoKCAoZXJyKSA9PiB7XHJcbiAgICAgICAgZGVidWdsb2coXCJcIiArIGVycik7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2VyciAnICsgZXJyKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhlcnIgKyAnICcgKyBlcnIuc3RhY2spO1xyXG4gICAgICAgIHByb2Nlc3Muc3Rkb3V0Lm9uKCdkcmFpbicsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoLTEpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignICcgKyBlcnIgICsgJyAnICsgZXJyLnN0YWNrKTtcclxuICAgIH0pIGFzIFByb21pc2U8SU1hdGNoLklNb2RlbHM+O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc29ydENhdGVnb3JpZXNCeUltcG9ydGFuY2UobWFwOiB7IFtrZXk6IHN0cmluZ106IElNYXRjaC5JQ2F0ZWdvcnlEZXNjIH0sIGNhdHM6IHN0cmluZ1tdKTogc3RyaW5nW10ge1xyXG4gICAgdmFyIHJlcyA9IGNhdHMuc2xpY2UoMCk7XHJcbiAgICByZXMuc29ydChyYW5rQ2F0ZWdvcnlCeUltcG9ydGFuY2UuYmluZCh1bmRlZmluZWQsIG1hcCkpO1xyXG4gICAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJhbmtDYXRlZ29yeUJ5SW1wb3J0YW5jZShtYXA6IHsgW2tleTogc3RyaW5nXTogSU1hdGNoLklDYXRlZ29yeURlc2MgfSwgY2F0YTogc3RyaW5nLCBjYXRiOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gICAgdmFyIGNhdEFEZXNjID0gbWFwW2NhdGFdO1xyXG4gICAgdmFyIGNhdEJEZXNjID0gbWFwW2NhdGJdO1xyXG4gICAgaWYgKGNhdGEgPT09IGNhdGIpIHtcclxuICAgICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuICAgIC8vIGlmIGEgaXMgYmVmb3JlIGIsIHJldHVybiAtMVxyXG4gICAgaWYgKGNhdEFEZXNjICYmICFjYXRCRGVzYykge1xyXG4gICAgICAgIHJldHVybiAtMTtcclxuICAgIH1cclxuICAgIGlmICghY2F0QURlc2MgJiYgY2F0QkRlc2MpIHtcclxuICAgICAgICByZXR1cm4gKzE7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHByaW9BID0gKGNhdEFEZXNjICYmIGNhdEFEZXNjLmltcG9ydGFuY2UpIHx8IDk5O1xyXG4gICAgdmFyIHByaW9CID0gKGNhdEJEZXNjICYmIGNhdEJEZXNjLmltcG9ydGFuY2UpIHx8IDk5O1xyXG4gICAgLy8gbG93ZXIgcHJpbyBnb2VzIHRvIGZyb250XHJcbiAgICB2YXIgciA9IHByaW9BIC0gcHJpb0I7XHJcbiAgICBpZiAocikge1xyXG4gICAgICAgIHJldHVybiByO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNhdGEubG9jYWxlQ29tcGFyZShjYXRiKTtcclxufVxyXG5cclxuY29uc3QgTWV0YUYgPSBNZXRhLmdldE1ldGFGYWN0b3J5KCk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3BlcmF0b3IobWRsOiBJTWF0Y2guSU1vZGVscywgb3BlcmF0b3I6IHN0cmluZyk6IElNYXRjaC5JT3BlcmF0b3Ige1xyXG4gICAgcmV0dXJuIG1kbC5vcGVyYXRvcnNbb3BlcmF0b3JdO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVzdWx0QXNBcnJheShtZGw6IElNYXRjaC5JTW9kZWxzLCBhOiBNZXRhLklNZXRhLCByZWw6IE1ldGEuSU1ldGEpOiBNZXRhLklNZXRhW10ge1xyXG4gICAgaWYgKHJlbC50b1R5cGUoKSAhPT0gJ3JlbGF0aW9uJykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImV4cGVjdCByZWxhdGlvbiBhcyAybmQgYXJnXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciByZXMgPSBtZGwubWV0YS50M1thLnRvRnVsbFN0cmluZygpXSAmJlxyXG4gICAgICAgIG1kbC5tZXRhLnQzW2EudG9GdWxsU3RyaW5nKCldW3JlbC50b0Z1bGxTdHJpbmcoKV07XHJcbiAgICBpZiAoIXJlcykge1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhyZXMpLnNvcnQoKS5tYXAoTWV0YUYucGFyc2VJTWV0YSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjaGVja0RvbWFpblByZXNlbnQodGhlTW9kZWw6IElNYXRjaC5JTW9kZWxzLCBkb21haW46IHN0cmluZykge1xyXG4gICAgaWYgKHRoZU1vZGVsLmRvbWFpbnMuaW5kZXhPZihkb21haW4pIDwgMCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRvbWFpbiBcXFwiXCIgKyBkb21haW4gKyBcIlxcXCIgbm90IHBhcnQgb2YgbW9kZWxcIik7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRTaG93VVJJQ2F0ZWdvcmllc0ZvckRvbWFpbih0aGVNb2RlbCA6IElNYXRjaC5JTW9kZWxzLCBkb21haW4gOiBzdHJpbmcpIDogc3RyaW5nW10ge1xyXG4gICAgY2hlY2tEb21haW5QcmVzZW50KHRoZU1vZGVsLCBkb21haW4pO1xyXG4gICAgdmFyIG1vZGVsTmFtZSA9IGdldE1vZGVsTmFtZUZvckRvbWFpbih0aGVNb2RlbC5tb25nb0hhbmRsZSxkb21haW4pO1xyXG4gICAgdmFyIGFsbGNhdHMgPSBnZXRSZXN1bHRBc0FycmF5KHRoZU1vZGVsLCBNZXRhRi5Eb21haW4oZG9tYWluKSwgTWV0YUYuUmVsYXRpb24oTWV0YS5SRUxBVElPTl9oYXNDYXRlZ29yeSkpO1xyXG4gICAgdmFyIGRvYyA9IHRoZU1vZGVsLm1vbmdvSGFuZGxlLm1vZGVsRG9jc1ttb2RlbE5hbWVdO1xyXG4gICAgdmFyIHJlcyA9IGRvYy5fY2F0ZWdvcmllcy5maWx0ZXIoIGNhdCA9PiBjYXQuc2hvd1VSSSApLm1hcChjYXQgPT4gY2F0LmNhdGVnb3J5KTtcclxuICAgIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRTaG93VVJJUmFua0NhdGVnb3JpZXNGb3JEb21haW4odGhlTW9kZWwgOiBJTWF0Y2guSU1vZGVscywgZG9tYWluIDogc3RyaW5nKSA6IHN0cmluZ1tdIHtcclxuICAgIGNoZWNrRG9tYWluUHJlc2VudCh0aGVNb2RlbCwgZG9tYWluKTtcclxuICAgIHZhciBtb2RlbE5hbWUgPSBnZXRNb2RlbE5hbWVGb3JEb21haW4odGhlTW9kZWwubW9uZ29IYW5kbGUsZG9tYWluKTtcclxuICAgIHZhciBhbGxjYXRzID0gZ2V0UmVzdWx0QXNBcnJheSh0aGVNb2RlbCwgTWV0YUYuRG9tYWluKGRvbWFpbiksIE1ldGFGLlJlbGF0aW9uKE1ldGEuUkVMQVRJT05faGFzQ2F0ZWdvcnkpKTtcclxuICAgIHZhciBkb2MgPSB0aGVNb2RlbC5tb25nb0hhbmRsZS5tb2RlbERvY3NbbW9kZWxOYW1lXTtcclxuICAgIHZhciByZXMgPSBkb2MuX2NhdGVnb3JpZXMuZmlsdGVyKCBjYXQgPT4gY2F0LnNob3dVUklSYW5rICkubWFwKGNhdCA9PiBjYXQuY2F0ZWdvcnkpO1xyXG4gICAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldENhdGVnb3JpZXNGb3JEb21haW4odGhlTW9kZWw6IElNYXRjaC5JTW9kZWxzLCBkb21haW46IHN0cmluZyk6IHN0cmluZ1tdIHtcclxuICAgIGNoZWNrRG9tYWluUHJlc2VudCh0aGVNb2RlbCwgZG9tYWluKTtcclxuICAgIHZhciByZXMgPSBnZXRSZXN1bHRBc0FycmF5KHRoZU1vZGVsLCBNZXRhRi5Eb21haW4oZG9tYWluKSwgTWV0YUYuUmVsYXRpb24oTWV0YS5SRUxBVElPTl9oYXNDYXRlZ29yeSkpO1xyXG4gICAgcmV0dXJuIE1ldGEuZ2V0U3RyaW5nQXJyYXkocmVzKTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRUYWJsZUNvbHVtbnModGhlTW9kZWw6IElNYXRjaC5JTW9kZWxzLCBkb21haW46IHN0cmluZyk6IHN0cmluZ1tdIHtcclxuICAgIGNoZWNrRG9tYWluUHJlc2VudCh0aGVNb2RlbCwgZG9tYWluKTtcclxuICAgIHZhciBtb2RlbE5hbWUgPSBnZXRNb2RlbE5hbWVGb3JEb21haW4odGhlTW9kZWwubW9uZ29IYW5kbGUsIGRvbWFpbik7XHJcbiAgICByZXR1cm4gdGhlTW9kZWwubW9uZ29IYW5kbGUubW9kZWxEb2NzW21vZGVsTmFtZV0uY29sdW1ucy5zbGljZSgwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZm9yY2VHQygpIHtcclxuICAgIGlmIChnbG9iYWwgJiYgZ2xvYmFsLmdjKSB7XHJcbiAgICAgICAgZ2xvYmFsLmdjKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm4gYWxsIGNhdGVnb3JpZXMgb2YgYSBkb21haW4gd2hpY2ggY2FuIGFwcGVhciBvbiBhIHdvcmQsXHJcbiAqIHRoZXNlIGFyZSB0eXBpY2FsbHkgdGhlIHdvcmRpbmRleCBkb21haW5zICsgZW50cmllcyBnZW5lcmF0ZWQgYnkgZ2VuZXJpYyBydWxlc1xyXG4gKlxyXG4gKiBUaGUgY3VycmVudCBpbXBsZW1lbnRhdGlvbiBpcyBhIHNpbXBsaWZpY2F0aW9uXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UG90ZW50aWFsV29yZENhdGVnb3JpZXNGb3JEb21haW4odGhlTW9kZWw6IElNYXRjaC5JTW9kZWxzLCBkb21haW46IHN0cmluZyk6IHN0cmluZ1tdIHtcclxuICAgIC8vIHRoaXMgaXMgYSBzaW1wbGlmaWVkIHZlcnNpb25cclxuICAgIHJldHVybiBnZXRDYXRlZ29yaWVzRm9yRG9tYWluKHRoZU1vZGVsLCBkb21haW4pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RG9tYWluc0ZvckNhdGVnb3J5KHRoZU1vZGVsOiBJTWF0Y2guSU1vZGVscywgY2F0ZWdvcnk6IHN0cmluZyk6IHN0cmluZ1tdIHtcclxuICAgIGlmICh0aGVNb2RlbC5jYXRlZ29yeS5pbmRleE9mKGNhdGVnb3J5KSA8IDApIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYXRlZ29yeSBcXFwiXCIgKyBjYXRlZ29yeSArIFwiXFxcIiBub3QgcGFydCBvZiBtb2RlbFwiKTtcclxuICAgIH1cclxuICAgIHZhciByZXMgPSBnZXRSZXN1bHRBc0FycmF5KHRoZU1vZGVsLCBNZXRhRi5DYXRlZ29yeShjYXRlZ29yeSksIE1ldGFGLlJlbGF0aW9uKE1ldGEuUkVMQVRJT05faXNDYXRlZ29yeU9mKSk7XHJcbiAgICByZXR1cm4gTWV0YS5nZXRTdHJpbmdBcnJheShyZXMpO1xyXG59XHJcblxyXG4vKlxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsUmVjb3JkQ2F0ZWdvcmllc0ZvclRhcmdldENhdGVnb3J5KG1vZGVsOiBJTWF0Y2guSU1vZGVscywgY2F0ZWdvcnk6IHN0cmluZywgd29yZHNvbmx5OiBib29sZWFuKTogeyBba2V5OiBzdHJpbmddOiBib29sZWFuIH0ge1xyXG4gICAgdmFyIHJlcyA9IHt9O1xyXG4gICAgLy9cclxuICAgIHZhciBmbiA9IHdvcmRzb25seSA/IGdldFBvdGVudGlhbFdvcmRDYXRlZ29yaWVzRm9yRG9tYWluIDogZ2V0Q2F0ZWdvcmllc0ZvckRvbWFpbjtcclxuICAgIHZhciBkb21haW5zID0gZ2V0RG9tYWluc0ZvckNhdGVnb3J5KG1vZGVsLCBjYXRlZ29yeSk7XHJcbiAgICBkb21haW5zLmZvckVhY2goZnVuY3Rpb24gKGRvbWFpbikge1xyXG4gICAgICAgIGZuKG1vZGVsLCBkb21haW4pLmZvckVhY2goZnVuY3Rpb24gKHdvcmRjYXQpIHtcclxuICAgICAgICAgICAgcmVzW3dvcmRjYXRdID0gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gICAgT2JqZWN0LmZyZWV6ZShyZXMpO1xyXG4gICAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEFsbFJlY29yZENhdGVnb3JpZXNGb3JUYXJnZXRDYXRlZ29yaWVzKG1vZGVsOiBJTWF0Y2guSU1vZGVscywgY2F0ZWdvcmllczogc3RyaW5nW10sIHdvcmRzb25seTogYm9vbGVhbik6IHsgW2tleTogc3RyaW5nXTogYm9vbGVhbiB9IHtcclxuICAgIHZhciByZXMgPSB7fTtcclxuICAgIC8vXHJcbiAgICB2YXIgZm4gPSB3b3Jkc29ubHkgPyBnZXRQb3RlbnRpYWxXb3JkQ2F0ZWdvcmllc0ZvckRvbWFpbiA6IGdldENhdGVnb3JpZXNGb3JEb21haW47XHJcbiAgICB2YXIgZG9tYWlucyA9IHVuZGVmaW5lZDtcclxuICAgIGNhdGVnb3JpZXMuZm9yRWFjaChmdW5jdGlvbiAoY2F0ZWdvcnkpIHtcclxuICAgICAgICB2YXIgY2F0ZG9tYWlucyA9IGdldERvbWFpbnNGb3JDYXRlZ29yeShtb2RlbCwgY2F0ZWdvcnkpXHJcbiAgICAgICAgaWYgKCFkb21haW5zKSB7XHJcbiAgICAgICAgICAgIGRvbWFpbnMgPSBjYXRkb21haW5zO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGRvbWFpbnMgPSBfLmludGVyc2VjdGlvbihkb21haW5zLCBjYXRkb21haW5zKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIGlmIChkb21haW5zLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2F0ZWdvcmllcyAnICsgVXRpbHMubGlzdFRvUXVvdGVkQ29tbWFBbmQoY2F0ZWdvcmllcykgKyAnIGhhdmUgbm8gY29tbW9uIGRvbWFpbi4nKVxyXG4gICAgfVxyXG4gICAgZG9tYWlucy5mb3JFYWNoKGZ1bmN0aW9uIChkb21haW4pIHtcclxuICAgICAgICBmbihtb2RlbCwgZG9tYWluKS5mb3JFYWNoKGZ1bmN0aW9uICh3b3JkY2F0KSB7XHJcbiAgICAgICAgICAgIHJlc1t3b3JkY2F0XSA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICAgIE9iamVjdC5mcmVlemUocmVzKTtcclxuICAgIHJldHVybiByZXM7XHJcbn1cclxuKi9cclxuXHJcbi8qKlxyXG4gKiBnaXZlbmEgIHNldCAgb2YgY2F0ZWdvcmllcywgcmV0dXJuIGEgc3RydWN0dXJlXHJcbiAqXHJcbiAqXHJcbiAqIHsgZG9tYWlucyA6IFtcIkRPTUFJTjFcIiwgXCJET01BSU4yXCJdLFxyXG4gKiAgIGNhdGVnb3J5U2V0IDogeyAgIGNhdDEgOiB0cnVlLCBjYXQyIDogdHJ1ZSwgLi4ufVxyXG4gKiB9XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RG9tYWluQ2F0ZWdvcnlGaWx0ZXJGb3JUYXJnZXRDYXRlZ29yaWVzKG1vZGVsOiBJTWF0Y2guSU1vZGVscywgY2F0ZWdvcmllczogc3RyaW5nW10sIHdvcmRzb25seTogYm9vbGVhbik6IElNYXRjaC5JRG9tYWluQ2F0ZWdvcnlGaWx0ZXIge1xyXG4gICAgdmFyIHJlcyA9IHt9O1xyXG4gICAgLy9cclxuICAgIHZhciBmbiA9IHdvcmRzb25seSA/IGdldFBvdGVudGlhbFdvcmRDYXRlZ29yaWVzRm9yRG9tYWluIDogZ2V0Q2F0ZWdvcmllc0ZvckRvbWFpbjtcclxuICAgIHZhciBkb21haW5zID0gdW5kZWZpbmVkIGFzIHN0cmluZ1tdO1xyXG4gICAgY2F0ZWdvcmllcy5mb3JFYWNoKGZ1bmN0aW9uIChjYXRlZ29yeSkge1xyXG4gICAgICAgIHZhciBjYXRkb21haW5zID0gZ2V0RG9tYWluc0ZvckNhdGVnb3J5KG1vZGVsLCBjYXRlZ29yeSlcclxuICAgICAgICBpZiAoIWRvbWFpbnMpIHtcclxuICAgICAgICAgICAgZG9tYWlucyA9IGNhdGRvbWFpbnM7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZG9tYWlucyA9IF8uaW50ZXJzZWN0aW9uKGRvbWFpbnMsIGNhdGRvbWFpbnMpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgaWYgKGRvbWFpbnMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYXRlZ29yaWVzICcgKyBVdGlscy5saXN0VG9RdW90ZWRDb21tYUFuZChjYXRlZ29yaWVzKSArICcgaGF2ZSBubyBjb21tb24gZG9tYWluLicpXHJcbiAgICB9XHJcbiAgICBkb21haW5zLmZvckVhY2goZnVuY3Rpb24gKGRvbWFpbikge1xyXG4gICAgICAgIGZuKG1vZGVsLCBkb21haW4pLmZvckVhY2goZnVuY3Rpb24gKHdvcmRjYXQpIHtcclxuICAgICAgICAgICAgcmVzW3dvcmRjYXRdID0gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gICAgT2JqZWN0LmZyZWV6ZShyZXMpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBkb21haW5zOiBkb21haW5zLFxyXG4gICAgICAgIGNhdGVnb3J5U2V0OiByZXNcclxuICAgIH07XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RG9tYWluQ2F0ZWdvcnlGaWx0ZXJGb3JUYXJnZXRDYXRlZ29yeShtb2RlbDogSU1hdGNoLklNb2RlbHMsIGNhdGVnb3J5OiBzdHJpbmcsIHdvcmRzb25seTogYm9vbGVhbik6IElNYXRjaC5JRG9tYWluQ2F0ZWdvcnlGaWx0ZXIge1xyXG4gICAgcmV0dXJuIGdldERvbWFpbkNhdGVnb3J5RmlsdGVyRm9yVGFyZ2V0Q2F0ZWdvcmllcyhtb2RlbCwgW2NhdGVnb3J5XSwgd29yZHNvbmx5KTtcclxufVxyXG5cclxuXHJcbiJdfQ==
