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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUFFLFVBQVUsQ0FBQyxDQUFDO1NBQ2pEO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDSCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsR0FBRyx5QkFBeUIsQ0FBQyxDQUFBO0tBQ3RHO0lBQ0QsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLE1BQU07UUFDNUIsRUFBRSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxPQUFPO1lBQ3ZDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDeEIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztJQUNILE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDbkIsT0FBTztRQUNILE9BQU8sRUFBRSxPQUFPO1FBQ2hCLFdBQVcsRUFBRSxHQUFHO0tBQ25CLENBQUM7QUFDTixDQUFDO0FBMUJELGdHQTBCQztBQUdELFNBQWdCLHdDQUF3QyxDQUFDLEtBQXFCLEVBQUUsUUFBZ0IsRUFBRSxTQUFrQjtJQUNoSCxPQUFPLDBDQUEwQyxDQUFDLEtBQUssRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3BGLENBQUM7QUFGRCw0RkFFQyIsImZpbGUiOiJtb2RlbC9tb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBGdW5jdGlvbmFsaXR5IG1hbmFnaW5nIHRoZSBtYXRjaCBtb2RlbHNcclxuICpcclxuICogQGZpbGVcclxuICovXHJcblxyXG4vL2ltcG9ydCAqIGFzIGludGYgZnJvbSAnY29uc3RhbnRzJztcclxuaW1wb3J0ICogYXMgZGVidWdmIGZyb20gJ2RlYnVnZic7XHJcblxyXG52YXIgZGVidWdsb2cgPSBkZWJ1Z2YoJ21vZGVsJyk7XHJcblxyXG5pbXBvcnQgeyBJRk1vZGVsIGFzIElGTW9kZWx9IGZyb20gJy4vaW5kZXhfbW9kZWwnO1xyXG5cclxuaW1wb3J0IHsgYXBwbHlQcm9qZWN0LCBJUHNldWRvTW9kZWwsIElTcmNIYW5kbGUsIElTeW5vbnltfSBmcm9tICcuL3NyY2hhbmRsZSc7XHJcblxyXG4vLyB0aGUgaGFyZGNvZGVkIGRvbWFpbiBtZXRhbW9kZWwhXHJcbmNvbnN0IERPTUFJTl9NRVRBTU9ERUwgPSAnbWV0YW1vZGVsJztcclxuXHJcbi8vY29uc3QgbG9hZGxvZyA9IGxvZ2dlci5sb2dnZXIoJ21vZGVsbG9hZCcsICcnKTtcclxuXHJcblxyXG5pbXBvcnQgKiAgYXMgSU1hdGNoIGZyb20gJy4uL21hdGNoL2lmbWF0Y2gnO1xyXG5pbXBvcnQgKiBhcyBJbnB1dEZpbHRlclJ1bGVzIGZyb20gJy4uL21hdGNoL3J1bGUnO1xyXG4vL2ltcG9ydCAqIGFzIFRvb2xzIGZyb20gJy4uL21hdGNoL3Rvb2xzJztcclxuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgKiBhcyBNZXRhIGZyb20gJy4vbWV0YSc7XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJ2Fib3RfdXRpbHMnO1xyXG5pbXBvcnQgKiBhcyBDaXJjdWxhclNlciBmcm9tICdhYm90X3V0aWxzJztcclxuaW1wb3J0ICogYXMgRGlzdGFuY2UgZnJvbSAnYWJvdF9zdHJpbmdkaXN0JztcclxuaW1wb3J0ICogYXMgcHJvY2VzcyBmcm9tICdwcm9jZXNzJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xyXG5cclxuLy9pbXBvcnQgKiBhcyBJU2NoZW1hIGZyb20gJy4uL21vZGVsbG9hZC9zY2hlbWFsb2FkJztcclxuaW1wb3J0ICogYXMgU2NoZW1hbG9hZCBmcm9tICcuLi9tb2RlbGxvYWQvc2NoZW1hbG9hZCc7XHJcbmltcG9ydCAqIGFzIE1vbmdvTWFwIGZyb20gJy4vbW9uZ29tYXAnO1xyXG5cclxuLyoqXHJcbiAqIHRoZSBtb2RlbCBwYXRoLCBtYXkgYmUgY29udHJvbGxlZCB2aWEgZW52aXJvbm1lbnQgdmFyaWFibGVcclxuICovXHJcbnZhciBlbnZNb2RlbFBhdGggPSBwcm9jZXNzLmVudltcIkFCT1RfTU9ERUxQQVRIXCJdIHx8IFwibm9kZV9tb2R1bGVzL21nbmxxX3Rlc3Rtb2RlbC90ZXN0bW9kZWxcIjtcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY21wVG9vbHMoYTogSU1hdGNoLklUb29sLCBiOiBJTWF0Y2guSVRvb2wpIHtcclxuICAgIHJldHVybiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpO1xyXG59XHJcblxyXG50eXBlIElNb2RlbCA9IElNYXRjaC5JTW9kZWw7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcHJvcGFnYXRlVHlwZVRvTW9kZWxEb2MoIG1vZGVsRG9jIDogSUZNb2RlbC5JTW9kZWxEb2MsIGVzY2hlbWEgOiBJRk1vZGVsLklFeHRlbmRlZFNjaGVtYSApIHtcclxuICAgIC8vIHByb3BzIHsgXCJlbGVtZW50X3N5bWJvbFwiOntcInR5cGVcIjpcIlN0cmluZ1wiLFwidHJpbVwiOnRydWUsXCJfbV9jYXRlZ29yeVwiOlwiZWxlbWVudCBzeW1ib2xcIixcIntcclxuICAgIG1vZGVsRG9jLl9jYXRlZ29yaWVzLmZvckVhY2goIGNhdCA9PiB7XHJcbiAgICAgICAgdmFyIHByb3BlcnR5TmFtZSA9IE1vbmdvTWFwLm1ha2VDYW5vbmljUHJvcGVydHlOYW1lKGNhdC5jYXRlZ29yeSk7IFxyXG4gICAgICAgIHZhciBwcm9wID0gTW9uZ29NYXAuZmluZEVzY2hlbWFQcm9wRm9yQ2F0ZWdvcnkoZXNjaGVtYS5wcm9wcywgY2F0LmNhdGVnb3J5KTtcclxuICAgICAgICBpZiAoICFwcm9wKSB7XHJcbiAgICAgICAgICAgIGlmKCBtb2RlbERvYy5tb2RlbG5hbWUgIT09IFwibWV0YW1YWFhvZGVsc1wiKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZXJyID0gXHJcbiAgICAgICAgICAgICAgIFwiVW5hYmxlIHRvIGZpbmQgcHJvcGVydHkgXCIgKyBwcm9wZXJ0eU5hbWUgKyBcIiBmb3IgY2F0ZWdvcnkgXCIgKyBjYXQuY2F0ZWdvcnkgKyBcIiBpbiBtb2RlbCBcIiBcclxuICAgICAgICAgICAgICAgICsgbW9kZWxEb2MubW9kZWxuYW1lXHJcbiAgICAgICAgICAgICAgICArIFwiOyB2YWxpZCBwcm9wcyBhcmU6XFxcIlwiICsgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoZXNjaGVtYS5wcm9wcykuam9pbihcIixcXG5cIikgKyBcIlxcXCJcIiBcclxuICAgICAgICAgICAgICAgICArIFwiIFwiICsgSlNPTi5zdHJpbmdpZnkoZXNjaGVtYS5wcm9wcyk7XHJcbiAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgICAgICBkZWJ1Z2xvZyhlcnIpO1xyXG4gICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZGVidWdsb2coJyBhdWdtZW50aW5nIHR5cGUgZm9yIFxcXCInICsgY2F0LmNhdGVnb3J5ICsgXCIoXCIgKyBwcm9wZXJ0eU5hbWUgKyBcIilcXFwiIHdpdGggXCIgKyBKU09OLnN0cmluZ2lmeShwcm9wLnR5cGUpKTtcclxuICAgICAgICAgICAgY2F0LnR5cGUgPSBwcm9wLnR5cGU7IC8vIHRoaXMgbWF5IGJlIFtcIlN0cmluZ1wiXSBmb3IgYW4gYXJyYXkgdHlwZSFcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFzUHJvbWlzZShhIDogYW55KSA6IFByb21pc2U8YW55PiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoIChyZXNvbHZlLHJlamVjdCkgPT4geyByZXNvbHZlKGEpO30gKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vZGVsRGF0YShzcmNIYW5kbGU6IElTcmNIYW5kbGUsIG1vZGVsTmFtZTogc3RyaW5nLCBtb2RlbE5hbWVzIDogc3RyaW5nW10pIDogUHJvbWlzZTxhbnk+IHtcclxuICAgIGlmKCBtb2RlbE5hbWUgPT0gXCJtZXRhbW9kZWxzXCIgKSB7XHJcbiAgICAgICAgcmV0dXJuIGFzUHJvbWlzZShtb2RlbE5hbWVzLmZpbHRlciggKGEpID0+IChhICE9PSBcIm1ldGFtb2RlbHNcIikpLm1hcCggKGEpID0+IHJlYWRGaWxlQXNKU09OKHNyY0hhbmRsZS5nZXRQYXRoKCkgKyBhICsgJy5tb2RlbC5kb2MuanNvbicpKSk7XHJcbiAgICB9IGVsc2UgeyAgXHJcbiAgICAgICAgcmV0dXJuIHNyY0hhbmRsZS5nZXRKU09OKG1vZGVsTmFtZSArIFwiLmRhdGEuanNvblwiKVxyXG4gICAgfVxyXG59XHJcbi8qKlxyXG4gKiByZXR1cm5zIHdoZW4gYWxsIG1vZGVscyBhcmUgbG9hZGVkIGFuZCBhbGwgbW9kZWxkb2NzIGFyZSBtYWRlXHJcbiAqIEBwYXJhbSBzcmNIYW5kbGVcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRNb2RlbEhhbmRsZShzcmNIYW5kbGU6IElTcmNIYW5kbGUsIGNvbm5lY3Rpb25TdHJpbmcgOiBzdHJpbmcpOiBQcm9taXNlPElNYXRjaC5JTW9kZWxIYW5kbGVSYXc+IHtcclxuICAgIHZhciByZXMgPSB7XHJcbiAgICAgICAgc3JjSGFuZGxlOiBzcmNIYW5kbGUsXHJcbiAgICAgICAgbW9kZWxEb2NzOiB7fSxcclxuICAgICAgICBtb2RlbEVTY2hlbWFzOiB7fSxcclxuICAgICAgICBtb25nb01hcHM6IHt9XHJcbiAgICB9IGFzIElNYXRjaC5JTW9kZWxIYW5kbGVSYXc7XHJcbiAgICAvL3ZhciBtb2RlbEVTID0gU2NoZW1hbG9hZC5nZXRFeHRlbmRlZFNjaGVtYU1vZGVsKHNyY0hhbmRsZSk7XHJcbiAgICByZXR1cm4gc3JjSGFuZGxlLmNvbm5lY3QoY29ubmVjdGlvblN0cmluZykudGhlbiggKCkgPT57XHJcbiAgICB2YXIgbW9kZWxuYW1lcyA9IHNyY0hhbmRsZS5tb2RlbE5hbWVzKCk7IFxyXG4gICAgLy9yZXR1cm4gbW9kZWxFUy5kaXN0aW5jdCgnbW9kZWxuYW1lJykudGhlbihcclxuICAgIC8vdmFyIGZuID0gKG1vZGVsbmFtZXMpID0+IHtcclxuICAgICBkZWJ1Z2xvZygoKSA9PiAnaGVyZSBkaXN0aW5jdCBtb2RlbG5hbWVzICcgKyBKU09OLnN0cmluZ2lmeShtb2RlbG5hbWVzKSk7XHJcbiAgICAgcmV0dXJuIFByb21pc2UuYWxsKG1vZGVsbmFtZXMubWFwKGZ1bmN0aW9uIChtb2RlbG5hbWUpIHtcclxuICAgICAgICAgICAgZGVidWdsb2coKCkgPT4gJ2NyZWF0aW5nIHRyaXBlbCBmb3IgJyArIG1vZGVsbmFtZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbU2NoZW1hbG9hZC5nZXRFeHRlbmRTY2hlbWFEb2NGcm9tREIoc3JjSGFuZGxlLCBtb2RlbG5hbWUpLFxyXG4gICAgICAgICAgICBTY2hlbWFsb2FkLmdldE1vZGVsRG9jRnJvbURCKHNyY0hhbmRsZSwgbW9kZWxuYW1lKSwgXHJcbiAgICAgICAgICAgIGdldE1vZGVsRGF0YShzcmNIYW5kbGUsbW9kZWxuYW1lLCBtb2RlbG5hbWVzKVxyXG4gICAgICAgIF0pLnRoZW4oXHJcbiAgICAgICAgICAgICAgICAodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBkZWJ1Z2xvZygoKSA9PiAnYXR0ZW1wdGluZyB0byBsb2FkICcgKyBtb2RlbG5hbWUgKyAnIHRvIGNyZWF0ZSBtb25nb21hcCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBbZXh0ZW5kZWRTY2hlbWEsIG1vZGVsRG9jLCBkYXRhXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcy5tb2RlbEVTY2hlbWFzW21vZGVsbmFtZV0gPSBleHRlbmRlZFNjaGVtYTtcclxuICAgICAgICAgICAgICAgICAgICByZXMubW9kZWxEb2NzW21vZGVsbmFtZV0gPSBtb2RlbERvYztcclxuICAgICAgICAgICAgICAgICAgICBwcm9wYWdhdGVUeXBlVG9Nb2RlbERvYyhtb2RlbERvYyxleHRlbmRlZFNjaGVtYSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc3JjSGFuZGxlLnNldE1vZGVsKG1vZGVsbmFtZSxkYXRhLGV4dGVuZGVkU2NoZW1hKTtcclxuICAgICAgICAgICAgICAgICAgICAvKiAgaWYgKCBtb2RlbG5hbWUgPT0gXCJpdXBhY3NcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgIGRlYnVnbG9nKCcgbW9kZWxkb2NzIGlzICcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgIGRlYnVnbG9nKCcgaGVyZSAnICsgSlNPTi5zdHJpbmdpZnkobW9kZWxEb2MpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICBkZWJ1Z2xvZygnIGhlcmUgJyArIEpTT04uc3RyaW5naWZ5KGV4dGVuZGVkU2NoZW1hKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJyBtb2RlbERvY3MgaXMgJyArIEpTT04uc3RyaW5naWZ5KG1vZGVsRG9jKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJyoqKiBlc3NjaGVtYSBpcyAnICsgSlNPTi5zdHJpbmdpZnkoZXh0ZW5kZWRTY2hlbWEpKTtcclxuICAgICAgICAgICAgICAgICAgIH0qL1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcy5tb25nb01hcHNbbW9kZWxuYW1lXSA9IE1vbmdvTWFwLm1ha2VNb25nb01hcChtb2RlbERvYywgZXh0ZW5kZWRTY2hlbWEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlYnVnbG9nKCgpPT4gJ2NyZWF0ZWQgbW9uZ29tYXAgZm9yICcgKyBtb2RlbG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgIH0pKS50aGVuKCgpID0+IHtcclxuICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgfSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEZhY3RTeW5vbnltcyhtb25nb0hhbmRsZTogSU1hdGNoLklNb2RlbEhhbmRsZVJhdywgbW9kZWxuYW1lOiBzdHJpbmcpOiBQcm9taXNlPElTeW5vbnltW10+IHtcclxuICAgIHZhciBtb2RlbCA9IG1vbmdvSGFuZGxlLnNyY0hhbmRsZS5tb2RlbChtb2RlbG5hbWUpO1xyXG4gICAgcmV0dXJuIG1vZGVsLmFnZ3JlZ2F0ZVN5bm9ueW1zKCk7XHJcbn1cclxuXHJcbi8qXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVN5bm9ueW1CZWFyaW5nRG9jIHtcclxuICAgIF9zeW5vbnltczogW3tcclxuICAgICAgICBjYXRlZ29yeTogc3RyaW5nLFxyXG4gICAgICAgIGZhY3Q6IHN0cmluZyxcclxuICAgICAgICBzeW5vbnltczogc3RyaW5nW11cclxuICAgIH1dXHJcbn1cclxuKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRNb25nb0NvbGxlY3Rpb25OYW1lRm9yRG9tYWluKHRoZU1vZGVsOiBJTWF0Y2guSU1vZGVscywgZG9tYWluIDogc3RyaW5nKSA6IHN0cmluZyB7XHJcbiAgICB2YXIgciA9IGdldE1vbmdvb3NlTW9kZWxOYW1lRm9yRG9tYWluKHRoZU1vZGVsLCBkb21haW4pO1xyXG4gICAgcmV0dXJuIFNjaGVtYWxvYWQubWFrZU1vbmdvQ29sbGVjdGlvbk5hbWUocilcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vbmdvb3NlTW9kZWxOYW1lRm9yRG9tYWluKHRoZU1vZGVsIDogSU1hdGNoLklNb2RlbHMsIGRvbWFpbiA6IHN0cmluZykgOiBzdHJpbmcge1xyXG4gICAgdmFyIHIgPSBnZXRNb2RlbE5hbWVGb3JEb21haW4odGhlTW9kZWwubW9uZ29IYW5kbGUsIGRvbWFpbik7XHJcbiAgICByZXR1cm4gcjsgXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRNb2RlbEZvck1vZGVsTmFtZSh0aGVNb2RlbCA6IElNYXRjaC5JTW9kZWxzLCBtb2RlbG5hbWU6IHN0cmluZykgOiBhbnkge1xyXG4gICAgcmV0dXJuIHRoZU1vZGVsLm1vbmdvSGFuZGxlLnNyY0hhbmRsZS5tb2RlbChtb2RlbG5hbWUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9kZWxGb3JEb21haW4odGhlTW9kZWwgOiBJTWF0Y2guSU1vZGVscywgZG9tYWluIDogc3RyaW5nKSA6IGFueSB7XHJcbiAgICB2YXIgbW9kZWxuYW1lID0gZ2V0TW9kZWxOYW1lRm9yRG9tYWluKHRoZU1vZGVsLm1vbmdvSGFuZGxlLCBkb21haW4pO1xyXG4gICAgcmV0dXJuIGdldE1vZGVsRm9yTW9kZWxOYW1lKHRoZU1vZGVsLCBtb2RlbG5hbWUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9kZWxOYW1lRm9yRG9tYWluKGhhbmRsZSA6IElNYXRjaC5JTW9kZWxIYW5kbGVSYXcsIGRvbWFpbiA6IHN0cmluZykgOiBzdHJpbmcge1xyXG4gICAgdmFyIHJlcyA9IHVuZGVmaW5lZDtcclxuICAgIE9iamVjdC5rZXlzKGhhbmRsZS5tb2RlbERvY3MpLmV2ZXJ5KCBrZXkgPT4ge1xyXG4gICAgICAgIHZhciBkb2MgPSBoYW5kbGUubW9kZWxEb2NzW2tleV07XHJcbiAgICAgICAgaWYgKCBrZXkgPT0gZG9tYWluKSB7XHJcbiAgICAgICAgICAgIHJlcyA9IGtleTsgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGRvbWFpbiA9PT0gZG9jLmRvbWFpbiAmJiBkb2MubW9kZWxuYW1lKSB7XHJcbiAgICAgICAgICAgIHJlcyA9IGRvYy5tb2RlbG5hbWU7IFxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gIXJlcztcclxuICAgIH0pO1xyXG4gICAgaWYoIXJlcykge1xyXG4gICAgICAgIHRocm93IEVycm9yKCdhdHRlbXB0IHRvIHJldHJpZXZlIG1vZGVsTmFtZSBmb3IgdW5rbm93biBkb21haW4gJyArIGRvbWFpbik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gYXNzdXJlRGlyRXhpc3RzKGRpciA6IHN0cmluZykge1xyXG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKGRpcikpe1xyXG4gICAgICAgIGZzLm1rZGlyU3luYyhkaXIpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyUmVtYXBDYXRlZ29yaWVzKCBtb25nb01hcCA6IElNYXRjaC5DYXRNb25nb01hcCwgY2F0ZWdvcmllcyA6IHN0cmluZ1tdLCByZWNvcmRzIDogYW55W10gKSA6IGFueVtdIHtcclxuICAgIC8vXHJcbiAgICAvL2NvbnNvbGUubG9nKCdoZXJlIG1hcCcgKyBKU09OLnN0cmluZ2lmeShtb25nb01hcCx1bmRlZmluZWQsMikpO1xyXG4gICAgcmV0dXJuIHJlY29yZHMubWFwKChyZWMsaW5kZXgpID0+IHtcclxuICAgICAgICB2YXIgcmVzID0ge307XHJcbiAgICAgICAgY2F0ZWdvcmllcy5mb3JFYWNoKGNhdGVnb3J5ID0+IHtcclxuICAgICAgICAgICAgdmFyIGNhdGVnb3J5UGF0aCA9IG1vbmdvTWFwW2NhdGVnb3J5XS5wYXRocztcclxuICAgICAgICAgICAgaWYoIWNhdGVnb3J5UGF0aCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bmtub3duIGNhdGVnb3J5ICR7Y2F0ZWdvcnl9IG5vdCBwcmVzZW50IGluICR7SlNPTi5zdHJpbmdpZnkobW9uZ29NYXAsdW5kZWZpbmVkLDIpfWApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlc1tjYXRlZ29yeV0gPSBNb25nb01hcC5nZXRGaXJzdE1lbWJlckJ5UGF0aChyZWMsIGNhdGVnb3J5UGF0aCk7XHJcbiAgICAgICAgICAgIGRlYnVnbG9nKCAoKT0+J2dvdCBtZW1iZXIgZm9yICcgICsgY2F0ZWdvcnkgKyAnIGZyb20gcmVjIG5vICcgKyBpbmRleCArICcgJyArIEpTT04uc3RyaW5naWZ5KHJlYyx1bmRlZmluZWQsMikgKTtcclxuICAgICAgICAgICAgZGVidWdsb2coKCk9PiBKU09OLnN0cmluZ2lmeShjYXRlZ29yeVBhdGgpKTtcclxuICAgICAgICAgICAgZGVidWdsb2coKCk9PiAncmVzIDogJyArIHJlc1tjYXRlZ29yeV0gKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJSZW1hcENhdGVnb3JpZXMyKCBtb25nb01hcCA6IElNYXRjaC5DYXRNb25nb01hcCwgY2F0ZWdvcmllcyA6IHN0cmluZ1tdLCByZWNvcmRzIDogYW55W10gKSA6IGFueVtdIHtcclxuICAgIC8vIGNvbnN0cnVjdCBhIHByb2plY3RcclxuICAgIHZhciBwcm9qZWN0ID0ge307XHJcbiAgICBjYXRlZ29yaWVzLmZvckVhY2goY2F0ZWdvcnkgPT4ge1xyXG4gICAgICAgIHZhciBjYXRlZ29yeVBhdGggPSBtb25nb01hcFtjYXRlZ29yeV0uZnVsbHBhdGg7XHJcbiAgICAgICAgcHJvamVjdFtjYXRlZ29yeV0gPSBjYXRlZ29yeVBhdGg7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBhcHBseVByb2plY3QocmVjb3Jkcyxwcm9qZWN0KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTW9kZWxNb25nb01hcChtb2RlbDogSVBzZXVkb01vZGVsLCBtb2RlbG5hbWUgOiBzdHJpbmcsIG1vbmdvTWFwOiBJTWF0Y2guQ2F0TW9uZ29NYXAsIGNhdGVnb3J5PyA6IHN0cmluZykge1xyXG4gICAgaWYgKCFtb2RlbCkge1xyXG4gICAgICAgIGRlYnVnbG9nKCcgbm8gbW9kZWwgZm9yICcgKyBtb2RlbG5hbWUpO1xyXG4gLy8gICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGBtb2RlbCAke21vZGVsbmFtZX0gbm90IGZvdW5kIGluIGRiYCk7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoYG1vZGVsICR7bW9kZWxuYW1lfSBub3QgZm91bmQgaW4gZGJgKTtcclxuICAgIH1cclxuICAgIGlmICghbW9uZ29NYXApIHtcclxuICAgICAgICBkZWJ1Z2xvZygnIG5vIG1vbmdvTWFwIGZvciAnICsgbW9kZWxuYW1lKTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYG1vZGVsICR7bW9kZWxuYW1lfSBoYXMgbm8gbW9kZWxtYXBgKTtcclxuLy8gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChgbW9kZWwgJHttb2RlbG5hbWV9IGhhcyBubyBtb2RlbG1hcGApO1xyXG4gICAgfVxyXG4gICAgaWYgKGNhdGVnb3J5ICYmICFtb25nb01hcFtjYXRlZ29yeV0pIHtcclxuICAgICAgICBkZWJ1Z2xvZygnIG5vIG1vbmdvTWFwIGNhdGVnb3J5IGZvciAnICsgbW9kZWxuYW1lKTtcclxuICAvLyAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChgbW9kZWwgJHttb2RlbG5hbWV9IGhhcyBubyBjYXRlZ29yeSAke2NhdGVnb3J5fWApO1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBtb2RlbCAke21vZGVsbmFtZX0gaGFzIG5vIGNhdGVnb3J5ICR7Y2F0ZWdvcnl9YCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXhwYW5kZWRSZWNvcmRzRnVsbCh0aGVNb2RlbCA6IElNYXRjaC5JTW9kZWxzLCBkb21haW4gOiBzdHJpbmcpIDogUHJvbWlzZTx7IFtrZXkgOiBzdHJpbmddIDogYW55fT4ge1xyXG4gICAgdmFyIG1vbmdvSGFuZGxlID0gdGhlTW9kZWwubW9uZ29IYW5kbGU7XHJcbiAgICB2YXIgbW9kZWxuYW1lID0gZ2V0TW9kZWxOYW1lRm9yRG9tYWluKHRoZU1vZGVsLm1vbmdvSGFuZGxlLCBkb21haW4pO1xyXG4gICAgZGVidWdsb2coKCk9PmAgbW9kZWxuYW1lIGZvciAke2RvbWFpbn0gaXMgJHttb2RlbG5hbWV9YCk7XHJcbiAgICB2YXIgbW9kZWwgPSBtb25nb0hhbmRsZS5zcmNIYW5kbGUubW9kZWwobW9kZWxuYW1lKTtcclxuICAgIHZhciBtb25nb01hcCA9IG1vbmdvSGFuZGxlLm1vbmdvTWFwc1ttb2RlbG5hbWVdO1xyXG4gICAgZGVidWdsb2coKCk9PiAnaGVyZSB0aGUgbW9uZ29tYXAnICsgSlNPTi5zdHJpbmdpZnkobW9uZ29NYXAsdW5kZWZpbmVkLDIpKTtcclxuICAgIHZhciBwID0gY2hlY2tNb2RlbE1vbmdvTWFwKG1vZGVsLG1vZGVsbmFtZSwgbW9uZ29NYXApO1xyXG4gICAgZGVidWdsb2coKCk9PmAgaGVyZSB0aGUgbW9kZWxtYXAgZm9yICR7ZG9tYWlufSBpcyAke0pTT04uc3RyaW5naWZ5KG1vbmdvTWFwLHVuZGVmaW5lZCwyKX1gKTtcclxuICAgIC8vIDEpIHByb2R1Y2UgdGhlIGZsYXR0ZW5lZCByZWNvcmRzXHJcbiAgICB2YXIgcmVzID0gTW9uZ29NYXAudW53aW5kc0Zvck5vbnRlcm1pbmFsQXJyYXlzKG1vbmdvTWFwKTtcclxuICAgIGRlYnVnbG9nKCgpPT4naGVyZSB0aGUgdW53aW5kIHN0YXRlbWVudCAnICsgSlNPTi5zdHJpbmdpZnkocmVzLHVuZGVmaW5lZCwyKSk7XHJcbiAgICAvLyB3ZSBoYXZlIHRvIHVud2luZCBhbGwgY29tbW9uIG5vbi10ZXJtaW5hbCBjb2xsZWN0aW9ucy5cclxuICAgIGRlYnVnbG9nKCgpPT4naGVyZSB0aGUgbW9kZWwgJyArIG1vZGVsLm1vZGVsbmFtZSk7XHJcbiAgICB2YXIgY2F0ZWdvcmllcyA9IGdldENhdGVnb3JpZXNGb3JEb21haW4odGhlTW9kZWwsIGRvbWFpbik7XHJcbiAgICBkZWJ1Z2xvZygoKT0+YGhlcmUgY2F0ZWdvcmllcyBmb3IgJHtkb21haW59ICR7Y2F0ZWdvcmllcy5qb2luKCc7Jyl9YCk7XHJcbiAgICBpZihyZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIG1vZGVsLmZpbmQoe30pLnRoZW4oKCB1bndvdW5kIDogYW55W10pID0+IHtcclxuICAgICAgICAgICAgZGVidWdsb2coKCk9PidoZXJlIHJlcycgKyBKU09OLnN0cmluZ2lmeSh1bndvdW5kKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJSZW1hcENhdGVnb3JpZXMobW9uZ29NYXAsIGNhdGVnb3JpZXMsIHVud291bmQpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbW9kZWwuYWdncmVnYXRlKHJlcykudGhlbiggdW53b3VuZCA9PiB7XHJcbiAgICAgICAgLy8gZmlsdGVyIGZvciBhZ2dyZWdhdGVcclxuICAgICAgICBkZWJ1Z2xvZygoKT0+J2hlcmUgcmVzJyArIEpTT04uc3RyaW5naWZ5KHVud291bmQpKTtcclxuICAgICAgICByZXR1cm4gZmlsdGVyUmVtYXBDYXRlZ29yaWVzKG1vbmdvTWFwLCBjYXRlZ29yaWVzLCB1bndvdW5kKVxyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXhwYW5kZWRSZWNvcmRzRm9yQ2F0ZWdvcnkodGhlTW9kZWwgOiBJTWF0Y2guSU1vZGVscyxkb21haW4gOiBzdHJpbmcsY2F0ZWdvcnkgOiBzdHJpbmcpIDogUHJvbWlzZTx7IFtrZXkgOiBzdHJpbmddIDogYW55fT4ge1xyXG4gICAgdmFyIG1vbmdvSGFuZGxlID0gdGhlTW9kZWwubW9uZ29IYW5kbGU7XHJcbiAgICB2YXIgbW9kZWxuYW1lID0gZ2V0TW9kZWxOYW1lRm9yRG9tYWluKHRoZU1vZGVsLm1vbmdvSGFuZGxlLCBkb21haW4pO1xyXG4gICAgZGVidWdsb2coKCk9PmAgbW9kZWxuYW1lIGZvciAke2RvbWFpbn0gaXMgJHttb2RlbG5hbWV9YCk7XHJcbiAgICAvL2RlYnVnbG9nKCgpID0+IGBoZXJlIG1vZGVscyAke21vZGVsbmFtZX0gYCArIG1vbmdvSGFuZGxlLnNyY0hhbmRsZS5tb2RlbE5hbWVzKCkuam9pbignOycpKTtcclxuICAgIHZhciBtb2RlbCA9IG1vbmdvSGFuZGxlLnNyY0hhbmRsZS5tb2RlbChtb2RlbG5hbWUpO1xyXG4gICAgdmFyIG1vbmdvTWFwID0gbW9uZ29IYW5kbGUubW9uZ29NYXBzW21vZGVsbmFtZV07XHJcbiAgICBkZWJ1Z2xvZygoKT0+ICdoZXJlIHRoZSBtb25nb21hcCcgKyBKU09OLnN0cmluZ2lmeShtb25nb01hcCx1bmRlZmluZWQsMikpO1xyXG4gICAgY2hlY2tNb2RlbE1vbmdvTWFwKG1vZGVsLG1vZGVsbmFtZSwgbW9uZ29NYXAsY2F0ZWdvcnkpO1xyXG4gICAgZGVidWdsb2coKCk9PmAgaGVyZSB0aGUgbW9kZWxtYXAgZm9yICR7ZG9tYWlufSBpcyAke0pTT04uc3RyaW5naWZ5KG1vbmdvTWFwLHVuZGVmaW5lZCwyKX1gKTtcclxuICAgIC8vIDEpIHByb2R1Y2UgdGhlIGZsYXR0ZW5lZCByZWNvcmRzXHJcbiAgICB2YXIgcmVzID0gTW9uZ29NYXAudW53aW5kc0Zvck5vbnRlcm1pbmFsQXJyYXlzKG1vbmdvTWFwKTtcclxuICAgIGRlYnVnbG9nKCgpPT4naGVyZSB0aGUgdW53aW5kIHN0YXRlbWVudCAnICsgSlNPTi5zdHJpbmdpZnkocmVzLHVuZGVmaW5lZCwyKSk7XHJcbiAgICAvLyB3ZSBoYXZlIHRvIHVud2luZCBhbGwgY29tbW9uIG5vbi10ZXJtaW5hbCBjb2xsZWN0aW9ucy5cclxuICAgIGRlYnVnbG9nKCgpPT4naGVyZSB0aGUgbW9kZWwgJyArIG1vZGVsLm1vZGVsbmFtZSk7XHJcbiAgICBpZihyZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIG1vZGVsLmZpbmQoe30pLnRoZW4oKCB1bndvdW5kIDogYW55W10pID0+IHtcclxuICAgICAgICAgICAgZGVidWdsb2coKCk9PidoZXJlIHJlcycgKyBKU09OLnN0cmluZ2lmeSh1bndvdW5kKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJSZW1hcENhdGVnb3JpZXMobW9uZ29NYXAsIFtjYXRlZ29yeV0sIHVud291bmQpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbW9kZWwuYWdncmVnYXRlKHJlcykudGhlbiggdW53b3VuZCA9PiB7XHJcbiAgICAgICAgLy8gZmlsdGVyIGZvciBhZ2dyZWdhdGVcclxuICAgICAgICBkZWJ1Z2xvZygoKT0+J2hlcmUgcmVzJyArIEpTT04uc3RyaW5naWZ5KHVud291bmQpKTtcclxuICAgICAgICByZXR1cm4gZmlsdGVyUmVtYXBDYXRlZ29yaWVzKG1vbmdvTWFwLCBbY2F0ZWdvcnldLCB1bndvdW5kKVxyXG4gICAgfSk7XHJcbn1cclxuLy8gZ2V0IHN5bm9ueW1zXHJcbi8vIGRiLmNvc21vcy5maW5kKCB7IFwiX3N5bm9ueW1zLjBcIjogeyAkZXhpc3RzOiB0cnVlIH19KS5sZW5ndGgoKVxyXG5cclxuLyoqXHJcbiAqIFxyXG4gKiBAcGFyYW0gbW9uZ29IYW5kbGVcclxuICogQHBhcmFtIG1vZGVsbmFtZSBcclxuICogQHBhcmFtIGNhdGVnb3J5IFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldERpc3RpbmN0VmFsdWVzKG1vbmdvSGFuZGxlOiBJTWF0Y2guSU1vZGVsSGFuZGxlUmF3LCBtb2RlbG5hbWU6IHN0cmluZywgY2F0ZWdvcnk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcclxuICAgIGRlYnVnbG9nKCgpID0+IGBoZXJlIG1vZGVscyAke21vZGVsbmFtZX0gIG9mIGFsbDpgICsgbW9uZ29IYW5kbGUuc3JjSGFuZGxlLm1vZGVsTmFtZXMoKS5qb2luKCc7JykpO1xyXG4gICAgdmFyIG1vZGVsID0gbW9uZ29IYW5kbGUuc3JjSGFuZGxlLm1vZGVsKG1vZGVsbmFtZSk7XHJcbiAgICB2YXIgbW9uZ29NYXAgPSBtb25nb0hhbmRsZS5tb25nb01hcHNbbW9kZWxuYW1lXTtcclxuICAgIGNoZWNrTW9kZWxNb25nb01hcChtb2RlbCxtb2RlbG5hbWUsIG1vbmdvTWFwLGNhdGVnb3J5KTtcclxuICAgIGRlYnVnbG9nKCcgaGVyZSBwYXRoIGZvciBkaXN0aW5jdCB2YWx1ZSBcXFwiJyArIG1vZGVsbmFtZSArICcgXFxcIicgKyBtb25nb01hcFtjYXRlZ29yeV0uZnVsbHBhdGggICsgXCJcXFwiXCIpO1xyXG4gICAgcmV0dXJuIG1vZGVsLmRpc3RpbmN0RmxhdChtb25nb01hcFtjYXRlZ29yeV0pLnRoZW4ocmVzID0+IHtcclxuICAgICAgICBkZWJ1Z2xvZygoKSA9PiBgIGhlcmUgcmVzIGZvciBcIiR7bW9kZWxuYW1lfVwiIDogXCIke2NhdGVnb3J5fVwiIHZhbHVlcyBgICsgSlNPTi5zdHJpbmdpZnkocmVzLCB1bmRlZmluZWQsIDIpKTtcclxuICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRDYXRlZ29yeVJlYyhtb25nb0hhbmRsZTogSU1hdGNoLklNb2RlbEhhbmRsZVJhdywgbW9kZWxuYW1lOiBzdHJpbmcsIGNhdGVnb3J5OiBzdHJpbmcpOiBJTWF0Y2guSU1vZGVsQ2F0ZWdvcnlSZWNcclxue1xyXG4gICAgdmFyIGNhdGVnb3JpZXMgPSBtb25nb0hhbmRsZS5tb2RlbERvY3NbbW9kZWxuYW1lXS5fY2F0ZWdvcmllcztcclxuICAgIHZhciBmaWx0ZXJlZCA9IGNhdGVnb3JpZXMuZmlsdGVyKCB4ID0+IHguY2F0ZWdvcnkgPT0gY2F0ZWdvcnkgKTtcclxuICAgIC8vIHdlIHdhbnQgdG8gYW1lbnQgdGhlIHR5cGUhXHJcbiAgICBpZiAoIGZpbHRlcmVkLmxlbmd0aCAhPSAxIClcclxuICAgIHtcclxuXHJcbiAgICAgICAgZGVidWdmKCAnIGRpZCBub3QgZmluZCAnICsgbW9kZWxuYW1lICsgJyAgY2F0ZWdvcnkgICcgKyBjYXRlZ29yeSArICcgaW4gICcgKyBKU09OLnN0cmluZ2lmeShjYXRlZ29yaWVzKSApO1xyXG4gICAgICAgIHRocm93IEVycm9yKCdjYXRlZ29yeSBub3QgZm91bmQgJyArIGNhdGVnb3J5ICsgXCIgXCIgKyBKU09OLnN0cmluZ2lmeShjYXRlZ29yaWVzKSApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZpbHRlcmVkWzBdO1xyXG59XHJcblxyXG5cclxuXHJcbmNvbnN0IEFSUl9NT0RFTF9QUk9QRVJUSUVTID0gW1wiZG9tYWluXCIsIFwiYml0aW5kZXhcIiwgXCJkZWZhdWx0a2V5Y29sdW1uXCIsIFwiZGVmYXVsdHVyaVwiLCBcImNhdGVnb3J5RGVzY3JpYmVkXCIsIFwiY29sdW1uc1wiLCBcImRlc2NyaXB0aW9uXCIsIFwidG9vbFwiLCBcInRvb2xoaWRkZW5cIiwgXCJzeW5vbnltc1wiLCBcImNhdGVnb3J5XCIsIFwid29yZGluZGV4XCIsIFwiZXhhY3RtYXRjaFwiLCBcImhpZGRlblwiXTtcclxuXHJcbmZ1bmN0aW9uIGFkZFN5bm9ueW1zKHN5bm9ueW1zOiBzdHJpbmdbXSwgY2F0ZWdvcnk6IHN0cmluZywgc3lub255bUZvcjogc3RyaW5nLCBiaXRpbmRleDogbnVtYmVyLCBiaXRTZW50ZW5jZUFuZCxcclxuICAgIHdvcmRUeXBlOiBzdHJpbmcsXHJcbiAgICBtUnVsZXM6IEFycmF5PElNYXRjaC5tUnVsZT4sIHNlZW46IHsgW2tleTogc3RyaW5nXTogSU1hdGNoLm1SdWxlW10gfSkge1xyXG4gICAgc3lub255bXMuZm9yRWFjaChmdW5jdGlvbiAoc3luKSB7XHJcbiAgICAgICAgdmFyIG9SdWxlID0ge1xyXG4gICAgICAgICAgICBjYXRlZ29yeTogY2F0ZWdvcnksXHJcbiAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IHN5bm9ueW1Gb3IsXHJcbiAgICAgICAgICAgIHR5cGU6IElNYXRjaC5FbnVtUnVsZVR5cGUuV09SRCxcclxuICAgICAgICAgICAgd29yZDogc3luLFxyXG4gICAgICAgICAgICBiaXRpbmRleDogYml0aW5kZXgsXHJcbiAgICAgICAgICAgIGJpdFNlbnRlbmNlQW5kOiBiaXRTZW50ZW5jZUFuZCxcclxuICAgICAgICAgICAgd29yZFR5cGU6IHdvcmRUeXBlLFxyXG4gICAgICAgICAgICBfcmFua2luZzogMC45NVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgZGVidWdsb2coZGVidWdsb2cuZW5hYmxlZCA/IChcImluc2VydGluZyBzeW5vbnltXCIgKyBKU09OLnN0cmluZ2lmeShvUnVsZSkpIDogJy0nKTtcclxuICAgICAgICBpbnNlcnRSdWxlSWZOb3RQcmVzZW50KG1SdWxlcywgb1J1bGUsIHNlZW4pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFJ1bGVLZXkocnVsZSkge1xyXG4gICAgdmFyIHIxID0gcnVsZS5tYXRjaGVkU3RyaW5nICsgXCItfC1cIiArIHJ1bGUuY2F0ZWdvcnkgKyBcIiAtfC0gXCIgKyBydWxlLnR5cGUgKyBcIiAtfC0gXCIgKyBydWxlLndvcmQgKyBcIiBcIiArIHJ1bGUuYml0aW5kZXggKyBcIiBcIiArIHJ1bGUud29yZFR5cGU7XHJcbiAgICBpZiAocnVsZS5yYW5nZSkge1xyXG4gICAgICAgIHZhciByMiA9IGdldFJ1bGVLZXkocnVsZS5yYW5nZS5ydWxlKTtcclxuICAgICAgICByMSArPSBcIiAtfC0gXCIgKyBydWxlLnJhbmdlLmxvdyArIFwiL1wiICsgcnVsZS5yYW5nZS5oaWdoICsgXCIgLXwtIFwiICsgcjI7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcjE7XHJcbn1cclxuXHJcblxyXG5pbXBvcnQgKiBhcyBCcmVha2Rvd24gZnJvbSAnLi4vbWF0Y2gvYnJlYWtkb3duJztcclxuXHJcbi8qIGdpdmVuIGEgcnVsZSB3aGljaCByZXByZXNlbnRzIGEgd29yZCBzZXF1ZW5jZSB3aGljaCBpcyBzcGxpdCBkdXJpbmcgdG9rZW5pemF0aW9uICovXHJcbmV4cG9ydCBmdW5jdGlvbiBhZGRCZXN0U3BsaXQobVJ1bGVzOiBBcnJheTxJTWF0Y2gubVJ1bGU+LCBydWxlOiBJTWF0Y2gubVJ1bGUsIHNlZW5SdWxlczogeyBba2V5OiBzdHJpbmddOiBJTWF0Y2gubVJ1bGVbXSB9KSB7XHJcbiAgICAvL2lmKCFnbG9iYWxfQWRkU3BsaXRzKSB7XHJcbiAgICAvLyAgICByZXR1cm47XHJcbiAgICAvL31cclxuXHJcbiAgICBpZiAocnVsZS50eXBlICE9PSBJTWF0Y2guRW51bVJ1bGVUeXBlLldPUkQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB2YXIgYmVzdCA9IEJyZWFrZG93bi5tYWtlTWF0Y2hQYXR0ZXJuKHJ1bGUubG93ZXJjYXNld29yZCk7XHJcbiAgICBpZiAoIWJlc3QpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB2YXIgbmV3UnVsZSA9IHtcclxuICAgICAgICBjYXRlZ29yeTogcnVsZS5jYXRlZ29yeSxcclxuICAgICAgICBtYXRjaGVkU3RyaW5nOiBydWxlLm1hdGNoZWRTdHJpbmcsXHJcbiAgICAgICAgYml0aW5kZXg6IHJ1bGUuYml0aW5kZXgsXHJcbiAgICAgICAgYml0U2VudGVuY2VBbmQ6IHJ1bGUuYml0aW5kZXgsXHJcbiAgICAgICAgd29yZFR5cGU6IHJ1bGUud29yZFR5cGUsXHJcbiAgICAgICAgd29yZDogYmVzdC5sb25nZXN0VG9rZW4sXHJcbiAgICAgICAgdHlwZTogMCxcclxuICAgICAgICBsb3dlcmNhc2V3b3JkOiBiZXN0Lmxvbmdlc3RUb2tlbixcclxuICAgICAgICBfcmFua2luZzogMC45NSxcclxuICAgICAgICAvLyAgICBleGFjdE9ubHkgOiBydWxlLmV4YWN0T25seSxcclxuICAgICAgICByYW5nZTogYmVzdC5zcGFuXHJcbiAgICB9IGFzIElNYXRjaC5tUnVsZTtcclxuICAgIGlmIChydWxlLmV4YWN0T25seSkge1xyXG4gICAgICAgIG5ld1J1bGUuZXhhY3RPbmx5ID0gcnVsZS5leGFjdE9ubHlcclxuICAgIH07XHJcbiAgICBuZXdSdWxlLnJhbmdlLnJ1bGUgPSBydWxlO1xyXG4gICAgaW5zZXJ0UnVsZUlmTm90UHJlc2VudChtUnVsZXMsIG5ld1J1bGUsIHNlZW5SdWxlcyk7XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBpbnNlcnRSdWxlSWZOb3RQcmVzZW50KG1SdWxlczogQXJyYXk8SU1hdGNoLm1SdWxlPiwgcnVsZTogSU1hdGNoLm1SdWxlLFxyXG4gICAgc2VlblJ1bGVzOiB7IFtrZXk6IHN0cmluZ106IElNYXRjaC5tUnVsZVtdIH0pIHtcclxuXHJcbiAgICBpZiAocnVsZS50eXBlICE9PSBJTWF0Y2guRW51bVJ1bGVUeXBlLldPUkQpIHtcclxuICAgICAgICBkZWJ1Z2xvZygnbm90IGEgIHdvcmQgcmV0dXJuIGZhc3QgJysgcnVsZS5tYXRjaGVkU3RyaW5nKTtcclxuICAgICAgICBtUnVsZXMucHVzaChydWxlKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpZiAoKHJ1bGUud29yZCA9PT0gdW5kZWZpbmVkKSB8fCAocnVsZS5tYXRjaGVkU3RyaW5nID09PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbGxlZ2FsIHJ1bGUnICsgSlNPTi5zdHJpbmdpZnkocnVsZSwgdW5kZWZpbmVkLCAyKSk7XHJcbiAgICB9XHJcbiAgICB2YXIgciA9IGdldFJ1bGVLZXkocnVsZSk7XHJcbiAgICAvKiBpZiggKHJ1bGUud29yZCA9PT0gXCJzZXJ2aWNlXCIgfHwgcnVsZS53b3JkPT09IFwic2VydmljZXNcIikgJiYgci5pbmRleE9mKCdPRGF0YScpID49IDApIHtcclxuICAgICAgICAgY29uc29sZS5sb2coXCJydWxla2V5IGlzXCIgKyByKTtcclxuICAgICAgICAgY29uc29sZS5sb2coXCJwcmVzZW5jZSBpcyBcIiArIEpTT04uc3RyaW5naWZ5KHNlZW5SdWxlc1tyXSkpO1xyXG4gICAgIH0qL1xyXG4gICAgcnVsZS5sb3dlcmNhc2V3b3JkID0gcnVsZS53b3JkLnRvTG93ZXJDYXNlKCk7XHJcbiAgICBpZiAoc2VlblJ1bGVzW3JdKSB7XHJcbiAgICAgICAgZGVidWdsb2coKCkgPT4gKFwiQXR0ZW1wdGluZyB0byBpbnNlcnQgZHVwbGljYXRlXCIgKyBKU09OLnN0cmluZ2lmeShydWxlLCB1bmRlZmluZWQsIDIpICsgXCIgOiBcIiArIHIpKTtcclxuICAgICAgICB2YXIgZHVwbGljYXRlcyA9IHNlZW5SdWxlc1tyXS5maWx0ZXIoZnVuY3Rpb24gKG9FbnRyeSkge1xyXG4gICAgICAgICAgICByZXR1cm4gMCA9PT0gSW5wdXRGaWx0ZXJSdWxlcy5jb21wYXJlTVJ1bGVGdWxsKG9FbnRyeSwgcnVsZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKGR1cGxpY2F0ZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgc2VlblJ1bGVzW3JdID0gKHNlZW5SdWxlc1tyXSB8fCBbXSk7XHJcbiAgICBzZWVuUnVsZXNbcl0ucHVzaChydWxlKTtcclxuICAgIGlmIChydWxlLndvcmQgPT09IFwiXCIpIHtcclxuICAgICAgICBkZWJ1Z2xvZyhkZWJ1Z2xvZy5lbmFibGVkID8gKCdTa2lwcGluZyBydWxlIHdpdGggZW10cHkgd29yZCAnICsgSlNPTi5zdHJpbmdpZnkocnVsZSwgdW5kZWZpbmVkLCAyKSkgOiAnLScpO1xyXG4gICAgICAgIC8vZygnU2tpcHBpbmcgcnVsZSB3aXRoIGVtdHB5IHdvcmQgJyArIEpTT04uc3RyaW5naWZ5KHJ1bGUsIHVuZGVmaW5lZCwgMikpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIG1SdWxlcy5wdXNoKHJ1bGUpO1xyXG4gICAgYWRkQmVzdFNwbGl0KG1SdWxlcywgcnVsZSwgc2VlblJ1bGVzKTtcclxuICAgIHJldHVybjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRGaWxlQXNKU09OKGZpbGVuYW1lOiBzdHJpbmcpOiBhbnkge1xyXG4gICAgdmFyIGRhdGEgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZW5hbWUsICd1dGYtOCcpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShkYXRhKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkNvbnRlbnQgb2YgZmlsZSBcIiArIGZpbGVuYW1lICsgXCIgaXMgbm8ganNvblwiICsgZSk7XHJcbiAgICAgICAgcHJvY2Vzcy5zdGRvdXQub24oJ2RyYWluJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgtMSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy9wcm9jZXNzLmV4aXQoLTEpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGhhc1J1bGVXaXRoRmFjdChtUnVsZXMgOiBJTWF0Y2gubVJ1bGVbXSwgZmFjdDogc3RyaW5nLCBjYXRlZ29yeTogc3RyaW5nLCBiaXRpbmRleDogbnVtYmVyKSB7XHJcbiAgICAvLyBUT0RPIEJBRCBRVUFEUkFUSUNcclxuICAgIHJldHVybiBtUnVsZXMuZmluZCggcnVsZSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJ1bGUud29yZCA9PT0gZmFjdCAmJiBydWxlLmNhdGVnb3J5ID09PSBjYXRlZ29yeSAmJiBydWxlLmJpdGluZGV4ID09PSBiaXRpbmRleFxyXG4gICAgfSkgIT09IHVuZGVmaW5lZDtcclxufVxyXG5cclxuZnVuY3Rpb24gbG9hZE1vZGVsRGF0YU1vbmdvKG1vZGVsSGFuZGxlOiBJTWF0Y2guSU1vZGVsSGFuZGxlUmF3LCBvTWRsOiBJTW9kZWwsIHNNb2RlbE5hbWU6IHN0cmluZywgb01vZGVsOiBJTWF0Y2guSU1vZGVscyk6IFByb21pc2U8YW55PiB7XHJcbiAgICAvLyByZWFkIHRoZSBkYXRhIC0+XHJcbiAgICAvLyBkYXRhIGlzIHByb2Nlc3NlZCBpbnRvIG1SdWxlcyBkaXJlY3RseVxyXG5cclxuICAgIHZhciBiaXRpbmRleCA9IG9NZGwuYml0aW5kZXg7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwobW9kZWxIYW5kbGUubW9kZWxEb2NzW3NNb2RlbE5hbWVdLl9jYXRlZ29yaWVzLm1hcChcclxuICAgICAgICBjYXRlZ29yeVJlYyA9PiB7XHJcbiAgICAgICAgICAgIHZhciBjYXRlZ29yeSA9IGNhdGVnb3J5UmVjLmNhdGVnb3J5O1xyXG4gICAgICAgICAgICB2YXIgd29yZGluZGV4ID0gY2F0ZWdvcnlSZWMud29yZGluZGV4O1xyXG4gICAgICAgICAgICBpZiAoIXdvcmRpbmRleCkge1xyXG4gICAgICAgICAgICAgICAgZGVidWdsb2coICgpPT4gJyAgJyArIHNNb2RlbE5hbWUgKyAnICcgKyAgY2F0ZWdvcnkgKyAnIGlzIG5vdCB3b3JkIGluZGV4ZWQhJyApO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0cnVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGRlYnVnbG9nKCgpID0+ICdhZGRpbmcgdmFsdWVzIGZvciAnICsgc01vZGVsTmFtZSArICcgJyArICBjYXRlZ29yeSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RGlzdGluY3RWYWx1ZXMobW9kZWxIYW5kbGUsIHNNb2RlbE5hbWUsIGNhdGVnb3J5KS50aGVuKFxyXG4gICAgICAgICAgICAgICAgICAgICh2YWx1ZXMpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVidWdsb2coYGZvdW5kICR7dmFsdWVzLmxlbmd0aH0gdmFsdWVzIGZvciAke3NNb2RlbE5hbWV9ICR7Y2F0ZWdvcnl9IGApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXMubWFwKHZhbHVlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzU3RyaW5nID0gXCJcIiArIHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVidWdsb2coKCkgPT4gXCJwdXNoaW5nIHJ1bGUgd2l0aCBcIiArIGNhdGVnb3J5ICsgXCIgLT4gXCIgKyBzU3RyaW5nICsgJyAnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvUnVsZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogY2F0ZWdvcnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogc1N0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBJTWF0Y2guRW51bVJ1bGVUeXBlLldPUkQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd29yZDogc1N0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiaXRpbmRleDogYml0aW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYml0U2VudGVuY2VBbmQ6IGJpdGluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4YWN0T25seTogY2F0ZWdvcnlSZWMuZXhhY3RtYXRjaCB8fCBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JkVHlwZTogSU1hdGNoLldPUkRUWVBFLkZBQ1QsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3Jhbmtpbmc6IDAuOTVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gYXMgSU1hdGNoLm1SdWxlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zZXJ0UnVsZUlmTm90UHJlc2VudChvTW9kZWwubVJ1bGVzLCBvUnVsZSwgb01vZGVsLnNlZW5SdWxlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICBpZiAob01kbERhdGEuc3lub255bXMgJiYgb01kbERhdGEuc3lub255bXNbY2F0ZWdvcnldKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaG93IGNhbiB0aGlzIGhhcHBlbj9cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2FkZFN5bm9ueW1zKG9NZGxEYXRhLnN5bm9ueW1zW2NhdGVnb3J5XSwgY2F0ZWdvcnksIHNTdHJpbmcsIGJpdGluZGV4LCBiaXRpbmRleCwgXCJYXCIsIG9Nb2RlbC5tUnVsZXMsIG9Nb2RlbC5zZWVuUnVsZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYSBzeW5vbnltIGZvciBhIEZBQ1RcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgIGlmIChvRW50cnkuc3lub255bXMgJiYgb0VudHJ5LnN5bm9ueW1zW2NhdGVnb3J5XSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBhZGRTeW5vbnltcyhvRW50cnkuc3lub255bXNbY2F0ZWdvcnldLCBjYXRlZ29yeSwgc1N0cmluZywgYml0aW5kZXgsIGJpdGluZGV4LCBJTWF0Y2guV09SRFRZUEUuRkFDVCwgb01vZGVsLm1SdWxlcywgb01vZGVsLnNlZW5SdWxlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIClcclxuICAgICkudGhlbihcclxuICAgICAgICAoKSA9PiAgZ2V0RmFjdFN5bm9ueW1zKG1vZGVsSGFuZGxlLCBzTW9kZWxOYW1lKVxyXG4gICAgKS50aGVuKChzeW5vbnltVmFsdWVzIDogYW55KSA9PiB7XHJcbiAgICAgICAgc3lub255bVZhbHVlcy5mb3JFYWNoKChzeW5vbnltUmVjKSA9PiB7XHJcbiAgICAgICAgaWYgKCFoYXNSdWxlV2l0aEZhY3Qob01vZGVsLm1SdWxlcywgc3lub255bVJlYy5mYWN0LCBzeW5vbnltUmVjLmNhdGVnb3J5LCBiaXRpbmRleCkpIHtcclxuICAgICAgICAgICAgZGVidWdsb2coKCkgPT5KU09OLnN0cmluZ2lmeShvTW9kZWwubVJ1bGVzLHVuZGVmaW5lZCwyKSk7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKGBPcnBoYW5lZCBzeW5vbnltIHdpdGhvdXQgYmFzZSBpbiBkYXRhP1xcbmBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYChjaGVjayB0eXBvcyBhbmQgdGhhdCBjYXRlZ29yeSBpcyB3b3JkaW5kZXhlZCEpIGZhY3Q6ICcke3N5bm9ueW1SZWMuZmFjdH0nOyAgY2F0ZWdvcnk6IFwiJHtzeW5vbnltUmVjLmNhdGVnb3J5fVwiICAgYCAgKyBKU09OLnN0cmluZ2lmeShzeW5vbnltUmVjKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgYWRkU3lub255bXMoc3lub255bVJlYy5zeW5vbnltcywgc3lub255bVJlYy5jYXRlZ29yeSwgc3lub255bVJlYy5mYWN0LCBiaXRpbmRleCwgYml0aW5kZXgsIElNYXRjaC5XT1JEVFlQRS5GQUNULFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9Nb2RlbC5tUnVsZXMsIG9Nb2RlbC5zZWVuUnVsZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbG9hZE1vZGVsKG1vZGVsSGFuZGxlOiBJTWF0Y2guSU1vZGVsSGFuZGxlUmF3LCBzTW9kZWxOYW1lOiBzdHJpbmcsIG9Nb2RlbDogSU1hdGNoLklNb2RlbHMpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgZGVidWdsb2coXCIgbG9hZGluZyBcIiArIHNNb2RlbE5hbWUgKyBcIiAuLi4uXCIpO1xyXG4gICAgLy92YXIgb01kbCA9IHJlYWRGaWxlQXNKU09OKCcuLycgKyBtb2RlbFBhdGggKyAnLycgKyBzTW9kZWxOYW1lICsgXCIubW9kZWwuanNvblwiKSBhcyBJTW9kZWw7XHJcbiAgICB2YXIgb01kbCA9IG1ha2VNZGxNb25nbyhtb2RlbEhhbmRsZSwgc01vZGVsTmFtZSwgb01vZGVsKTtcclxuICAgIHJldHVybiBsb2FkTW9kZWxEYXRhTW9uZ28obW9kZWxIYW5kbGUsIG9NZGwsIHNNb2RlbE5hbWUsIG9Nb2RlbCk7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsRG9tYWluc0JpdEluZGV4KG9Nb2RlbDogSU1hdGNoLklNb2RlbHMpOiBudW1iZXIge1xyXG4gICAgdmFyIGxlbiA9IG9Nb2RlbC5kb21haW5zLmxlbmd0aDtcclxuICAgIHZhciByZXMgPSAwO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xyXG4gICAgICAgIHJlcyA9IHJlcyA8PCAxO1xyXG4gICAgICAgIHJlcyA9IHJlcyB8IDB4MDAwMTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXREb21haW5CaXRJbmRleChkb21haW46IHN0cmluZywgb01vZGVsOiBJTWF0Y2guSU1vZGVscyk6IG51bWJlciB7XHJcbiAgICB2YXIgaW5kZXggPSBvTW9kZWwuZG9tYWlucy5pbmRleE9mKGRvbWFpbik7XHJcbiAgICBpZiAoaW5kZXggPCAwKSB7XHJcbiAgICAgICAgaW5kZXggPSBvTW9kZWwuZG9tYWlucy5sZW5ndGg7XHJcbiAgICB9XHJcbiAgICBpZiAoaW5kZXggPj0gMzIpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ0b28gbWFueSBkb21haW4gZm9yIHNpbmdsZSAzMiBiaXQgaW5kZXhcIik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gMHgwMDAxIDw8IGluZGV4O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RG9tYWluQml0SW5kZXhTYWZlKGRvbWFpbjogc3RyaW5nLCBvTW9kZWw6IElNYXRjaC5JTW9kZWxzKTogbnVtYmVyIHtcclxuICAgIHZhciBpbmRleCA9IG9Nb2RlbC5kb21haW5zLmluZGV4T2YoZG9tYWluKTtcclxuICAgIGlmIChpbmRleCA8IDApIHtcclxuICAgICAgICB0aHJvdyBFcnJvcignZXhwZWN0ZWQgZG9tYWluICcgKyBkb21haW4gKyAnIHRvIGJlIHJlZ2lzdGVyZWQ/Pz8gJyArIEpTT04uc3RyaW5naWZ5KG9Nb2RlbC5kb21haW5zKSk7XHJcbiAgICB9XHJcbiAgICBpZiAoaW5kZXggPj0gMzIpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ0b28gbWFueSBkb21haW4gZm9yIHNpbmdsZSAzMiBiaXQgaW5kZXhcIik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gMHgwMDAxIDw8IGluZGV4O1xyXG59XHJcblxyXG5cclxuXHJcbi8qKlxyXG4gKiBHaXZlbiBhIGJpdGZpZWxkLCByZXR1cm4gYW4gdW5zb3J0ZWQgc2V0IG9mIGRvbWFpbnMgbWF0Y2hpbmcgcHJlc2VudCBiaXRzXHJcbiAqIEBwYXJhbSBvTW9kZWxcclxuICogQHBhcmFtIGJpdGZpZWxkXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RG9tYWluc0ZvckJpdEZpZWxkKG9Nb2RlbDogSU1hdGNoLklNb2RlbHMsIGJpdGZpZWxkOiBudW1iZXIpOiBzdHJpbmdbXSB7XHJcbiAgICByZXR1cm4gb01vZGVsLmRvbWFpbnMuZmlsdGVyKGRvbWFpbiA9PlxyXG4gICAgICAgIChnZXREb21haW5CaXRJbmRleChkb21haW4sIG9Nb2RlbCkgJiBiaXRmaWVsZClcclxuICAgICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1ha2VNZGxNb25nbyhtb2RlbEhhbmRsZTogSU1hdGNoLklNb2RlbEhhbmRsZVJhdywgc01vZGVsTmFtZTogc3RyaW5nLCBvTW9kZWw6IElNYXRjaC5JTW9kZWxzKTogSU1vZGVsIHtcclxuICAgIHZhciBtb2RlbERvYyA9IG1vZGVsSGFuZGxlLm1vZGVsRG9jc1tzTW9kZWxOYW1lXTtcclxuICAgIHZhciBvTWRsID0ge1xyXG4gICAgICAgIGJpdGluZGV4OiBnZXREb21haW5CaXRJbmRleFNhZmUobW9kZWxEb2MuZG9tYWluLCBvTW9kZWwpLFxyXG4gICAgICAgIGRvbWFpbjogbW9kZWxEb2MuZG9tYWluLFxyXG4gICAgICAgIG1vZGVsbmFtZTogc01vZGVsTmFtZSxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbW9kZWxEb2MuZG9tYWluX2Rlc2NyaXB0aW9uXHJcbiAgICB9IGFzIElNb2RlbDtcclxuICAgIHZhciBjYXRlZ29yeURlc2NyaWJlZE1hcCA9IHt9IGFzIHsgW2tleTogc3RyaW5nXTogSU1hdGNoLklDYXRlZ29yeURlc2MgfTtcclxuXHJcbiAgICBvTWRsLmJpdGluZGV4ID0gZ2V0RG9tYWluQml0SW5kZXhTYWZlKG1vZGVsRG9jLmRvbWFpbiwgb01vZGVsKTtcclxuICAgIG9NZGwuY2F0ZWdvcnkgPSBtb2RlbERvYy5fY2F0ZWdvcmllcy5tYXAoY2F0ID0+IGNhdC5jYXRlZ29yeSk7XHJcbiAgICBvTWRsLmNhdGVnb3J5RGVzY3JpYmVkID0gW107XHJcbiAgICBtb2RlbERvYy5fY2F0ZWdvcmllcy5mb3JFYWNoKGNhdCA9PiB7XHJcbiAgICAgICAgb01kbC5jYXRlZ29yeURlc2NyaWJlZC5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogY2F0LmNhdGVnb3J5LFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogY2F0LmNhdGVnb3J5X2Rlc2NyaXB0aW9uXHJcbiAgICAgICAgfSlcclxuICAgICAgICBjYXRlZ29yeURlc2NyaWJlZE1hcFtjYXQuY2F0ZWdvcnldID0gY2F0O1xyXG4gICAgfSk7XHJcblxyXG4gICAgb01kbC5jYXRlZ29yeSA9IG1vZGVsRG9jLl9jYXRlZ29yaWVzLm1hcChjYXQgPT4gY2F0LmNhdGVnb3J5KTtcclxuXHJcbiAgICAvKiAvLyByZWN0aWZ5IGNhdGVnb3J5XHJcbiAgICAgb01kbC5jYXRlZ29yeSA9IG9NZGwuY2F0ZWdvcnkubWFwKGZ1bmN0aW9uIChjYXQ6IGFueSkge1xyXG4gICAgICAgICBpZiAodHlwZW9mIGNhdCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgcmV0dXJuIGNhdDtcclxuICAgICAgICAgfVxyXG4gICAgICAgICBpZiAodHlwZW9mIGNhdC5uYW1lICE9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk1pc3NpbmcgbmFtZSBpbiBvYmplY3QgdHlwZWQgY2F0ZWdvcnkgaW4gXCIgKyBKU09OLnN0cmluZ2lmeShjYXQpICsgXCIgaW4gbW9kZWwgXCIgKyBzTW9kZWxOYW1lKTtcclxuICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgtMSk7XHJcbiAgICAgICAgICAgICAvL3Rocm93IG5ldyBFcnJvcignRG9tYWluICcgKyBvTWRsLmRvbWFpbiArICcgYWxyZWFkeSBsb2FkZWQgd2hpbGUgbG9hZGluZyAnICsgc01vZGVsTmFtZSArICc/Jyk7XHJcbiAgICAgICAgIH1cclxuICAgICAgICAgY2F0ZWdvcnlEZXNjcmliZWRNYXBbY2F0Lm5hbWVdID0gY2F0O1xyXG4gICAgICAgICBvTWRsLmNhdGVnb3J5RGVzY3JpYmVkLnB1c2goY2F0KTtcclxuICAgICAgICAgcmV0dXJuIGNhdC5uYW1lO1xyXG4gICAgIH0pO1xyXG4gICAgICovXHJcblxyXG4gICAgLy8gYWRkIHRoZSBjYXRlZ29yaWVzIHRvIHRoZSBydWxlc1xyXG4gICAgb01kbC5jYXRlZ29yeS5mb3JFYWNoKGZ1bmN0aW9uIChjYXRlZ29yeSkge1xyXG4gICAgICAgIGluc2VydFJ1bGVJZk5vdFByZXNlbnQob01vZGVsLm1SdWxlcywge1xyXG4gICAgICAgICAgICBjYXRlZ29yeTogXCJjYXRlZ29yeVwiLFxyXG4gICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBjYXRlZ29yeSxcclxuICAgICAgICAgICAgdHlwZTogSU1hdGNoLkVudW1SdWxlVHlwZS5XT1JELFxyXG4gICAgICAgICAgICB3b3JkOiBjYXRlZ29yeSxcclxuICAgICAgICAgICAgbG93ZXJjYXNld29yZDogY2F0ZWdvcnkudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICAgICAgYml0aW5kZXg6IG9NZGwuYml0aW5kZXgsXHJcbiAgICAgICAgICAgIHdvcmRUeXBlOiBJTWF0Y2guV09SRFRZUEUuQ0FURUdPUlksXHJcbiAgICAgICAgICAgIGJpdFNlbnRlbmNlQW5kOiBvTWRsLmJpdGluZGV4LFxyXG4gICAgICAgICAgICBfcmFua2luZzogMC45NVxyXG4gICAgICAgIH0sIG9Nb2RlbC5zZWVuUnVsZXMpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gYWRkIHN5bm9uYW55bSBmb3IgdGhlIGNhdGVnb3JpZXMgdG8gdGhlXHJcblxyXG4gICAgbW9kZWxEb2MuX2NhdGVnb3JpZXMuZm9yRWFjaChjYXQgPT4ge1xyXG4gICAgICAgIGFkZFN5bm9ueW1zXHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKG9Nb2RlbC5kb21haW5zLmluZGV4T2Yob01kbC5kb21haW4pIDwgMCkge1xyXG4gICAgICAgIGRlYnVnbG9nKFwiKioqKioqKioqKipoZXJlIG1kbFwiICsgSlNPTi5zdHJpbmdpZnkob01kbCwgdW5kZWZpbmVkLCAyKSk7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEb21haW4gJyArIG9NZGwuZG9tYWluICsgJyBhbHJlYWR5IGxvYWRlZCB3aGlsZSBsb2FkaW5nICcgKyBzTW9kZWxOYW1lICsgJz8nKTtcclxuICAgIH1cclxuICAgIC8qXHJcbiAgICAvLyBjaGVjayBwcm9wZXJ0aWVzIG9mIG1vZGVsXHJcbiAgICBPYmplY3Qua2V5cyhvTWRsKS5zb3J0KCkuZm9yRWFjaChmdW5jdGlvbiAoc1Byb3BlcnR5KSB7XHJcbiAgICAgICAgaWYgKEFSUl9NT0RFTF9QUk9QRVJUSUVTLmluZGV4T2Yoc1Byb3BlcnR5KSA8IDApIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNb2RlbCBwcm9wZXJ0eSBcIicgKyBzUHJvcGVydHkgKyAnXCIgbm90IGEga25vd24gbW9kZWwgcHJvcGVydHkgaW4gbW9kZWwgb2YgZG9tYWluICcgKyBvTWRsLmRvbWFpbiArICcgJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAqL1xyXG5cclxuICAgIC8vIGNvbnNpZGVyIHN0cmVhbWxpbmluZyB0aGUgY2F0ZWdvcmllc1xyXG4gICAgb01vZGVsLnJhd01vZGVsc1tvTWRsLmRvbWFpbl0gPSBvTWRsO1xyXG5cclxuICAgIG9Nb2RlbC5mdWxsLmRvbWFpbltvTWRsLmRvbWFpbl0gPSB7XHJcbiAgICAgICAgZGVzY3JpcHRpb246IG9NZGwuZGVzY3JpcHRpb24sXHJcbiAgICAgICAgY2F0ZWdvcmllczogY2F0ZWdvcnlEZXNjcmliZWRNYXAsXHJcbiAgICAgICAgYml0aW5kZXg6IG9NZGwuYml0aW5kZXhcclxuICAgIH07XHJcblxyXG4gICAgLy8gY2hlY2sgdGhhdFxyXG5cclxuXHJcbiAgICAvLyBjaGVjayB0aGF0IG1lbWJlcnMgb2Ygd29yZGluZGV4IGFyZSBpbiBjYXRlZ29yaWVzLFxyXG4gICAgLyogb01kbC53b3JkaW5kZXggPSBvTW9kZWxEb2Mub01kbC53b3JkaW5kZXggfHwgW107XHJcbiAgICAgb01kbC53b3JkaW5kZXguZm9yRWFjaChmdW5jdGlvbiAoc1dvcmRJbmRleCkge1xyXG4gICAgICAgICBpZiAob01kbC5jYXRlZ29yeS5pbmRleE9mKHNXb3JkSW5kZXgpIDwgMCkge1xyXG4gICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNb2RlbCB3b3JkaW5kZXggXCInICsgc1dvcmRJbmRleCArICdcIiBub3QgYSBjYXRlZ29yeSBvZiBkb21haW4gJyArIG9NZGwuZG9tYWluICsgJyAnKTtcclxuICAgICAgICAgfVxyXG4gICAgIH0pO1xyXG4gICAgICovXHJcbiAgICAvKlxyXG4gICAgb01kbC5leGFjdG1hdGNoID0gb01kbC5leGFjdG1hdGNoIHx8IFtdO1xyXG4gICAgb01kbC5leGFjdG1hdGNoLmZvckVhY2goZnVuY3Rpb24gKHNFeGFjdE1hdGNoKSB7XHJcbiAgICAgICAgaWYgKG9NZGwuY2F0ZWdvcnkuaW5kZXhPZihzRXhhY3RNYXRjaCkgPCAwKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTW9kZWwgZXhhY3RtYXRjaCBcIicgKyBzRXhhY3RNYXRjaCArICdcIiBub3QgYSBjYXRlZ29yeSBvZiBkb21haW4gJyArIG9NZGwuZG9tYWluICsgJyAnKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgICovXHJcbiAgICBvTWRsLmNvbHVtbnMgPSBtb2RlbERvYy5jb2x1bW5zOyAvLyBvTWRsLmNvbHVtbnMgfHwgW107XHJcbiAgICBvTWRsLmNvbHVtbnMuZm9yRWFjaChmdW5jdGlvbiAoc0V4YWN0TWF0Y2gpIHtcclxuICAgICAgICBpZiAob01kbC5jYXRlZ29yeS5pbmRleE9mKHNFeGFjdE1hdGNoKSA8IDApIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNb2RlbCBjb2x1bW4gXCInICsgc0V4YWN0TWF0Y2ggKyAnXCIgbm90IGEgY2F0ZWdvcnkgb2YgZG9tYWluICcgKyBvTWRsLmRvbWFpbiArICcgJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIC8vIGFkZCByZWxhdGlvbiBkb21haW4gLT4gY2F0ZWdvcnlcclxuICAgIHZhciBkb21haW5TdHIgPSBNZXRhRi5Eb21haW4ob01kbC5kb21haW4pLnRvRnVsbFN0cmluZygpO1xyXG4gICAgdmFyIHJlbGF0aW9uU3RyID0gTWV0YUYuUmVsYXRpb24oTWV0YS5SRUxBVElPTl9oYXNDYXRlZ29yeSkudG9GdWxsU3RyaW5nKCk7XHJcbiAgICB2YXIgcmV2ZXJzZVJlbGF0aW9uU3RyID0gTWV0YUYuUmVsYXRpb24oTWV0YS5SRUxBVElPTl9pc0NhdGVnb3J5T2YpLnRvRnVsbFN0cmluZygpO1xyXG4gICAgb01kbC5jYXRlZ29yeS5mb3JFYWNoKGZ1bmN0aW9uIChzQ2F0ZWdvcnkpIHtcclxuXHJcbiAgICAgICAgdmFyIENhdGVnb3J5U3RyaW5nID0gTWV0YUYuQ2F0ZWdvcnkoc0NhdGVnb3J5KS50b0Z1bGxTdHJpbmcoKTtcclxuICAgICAgICBvTW9kZWwubWV0YS50M1tkb21haW5TdHJdID0gb01vZGVsLm1ldGEudDNbZG9tYWluU3RyXSB8fCB7fTtcclxuICAgICAgICBvTW9kZWwubWV0YS50M1tkb21haW5TdHJdW3JlbGF0aW9uU3RyXSA9IG9Nb2RlbC5tZXRhLnQzW2RvbWFpblN0cl1bcmVsYXRpb25TdHJdIHx8IHt9O1xyXG4gICAgICAgIG9Nb2RlbC5tZXRhLnQzW2RvbWFpblN0cl1bcmVsYXRpb25TdHJdW0NhdGVnb3J5U3RyaW5nXSA9IHt9O1xyXG5cclxuICAgICAgICBvTW9kZWwubWV0YS50M1tDYXRlZ29yeVN0cmluZ10gPSBvTW9kZWwubWV0YS50M1tDYXRlZ29yeVN0cmluZ10gfHwge307XHJcbiAgICAgICAgb01vZGVsLm1ldGEudDNbQ2F0ZWdvcnlTdHJpbmddW3JldmVyc2VSZWxhdGlvblN0cl0gPSBvTW9kZWwubWV0YS50M1tDYXRlZ29yeVN0cmluZ11bcmV2ZXJzZVJlbGF0aW9uU3RyXSB8fCB7fTtcclxuICAgICAgICBvTW9kZWwubWV0YS50M1tDYXRlZ29yeVN0cmluZ11bcmV2ZXJzZVJlbGF0aW9uU3RyXVtkb21haW5TdHJdID0ge307XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gYWRkIGEgcHJlY2ljZSBkb21haW4gbWF0Y2hydWxlXHJcbiAgICBpbnNlcnRSdWxlSWZOb3RQcmVzZW50KG9Nb2RlbC5tUnVsZXMsIHtcclxuICAgICAgICBjYXRlZ29yeTogXCJkb21haW5cIixcclxuICAgICAgICBtYXRjaGVkU3RyaW5nOiBvTWRsLmRvbWFpbixcclxuICAgICAgICB0eXBlOiBJTWF0Y2guRW51bVJ1bGVUeXBlLldPUkQsXHJcbiAgICAgICAgd29yZDogb01kbC5kb21haW4sXHJcbiAgICAgICAgYml0aW5kZXg6IG9NZGwuYml0aW5kZXgsXHJcbiAgICAgICAgYml0U2VudGVuY2VBbmQ6IG9NZGwuYml0aW5kZXgsXHJcbiAgICAgICAgd29yZFR5cGU6IElNYXRjaC5XT1JEVFlQRS5ET01BSU4sXHJcbiAgICAgICAgX3Jhbmtpbmc6IDAuOTVcclxuICAgIH0sIG9Nb2RlbC5zZWVuUnVsZXMpO1xyXG5cclxuICAgIC8vIGFkZCBkb21haW4gc3lub255bXNcclxuICAgIGlmIChtb2RlbERvYy5kb21haW5fc3lub255bXMgJiYgbW9kZWxEb2MuZG9tYWluX3N5bm9ueW1zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBhZGRTeW5vbnltcyhtb2RlbERvYy5kb21haW5fc3lub255bXMsIFwiZG9tYWluXCIsIG1vZGVsRG9jLmRvbWFpbiwgb01kbC5iaXRpbmRleCxcclxuICAgICAgICAgICAgb01kbC5iaXRpbmRleCwgSU1hdGNoLldPUkRUWVBFLkRPTUFJTiwgb01vZGVsLm1SdWxlcywgb01vZGVsLnNlZW5SdWxlcyk7XHJcbiAgICAgICAgYWRkU3lub255bXMobW9kZWxEb2MuZG9tYWluX3N5bm9ueW1zLCBcImRvbWFpblwiLCBtb2RlbERvYy5kb21haW4sIGdldERvbWFpbkJpdEluZGV4U2FmZShET01BSU5fTUVUQU1PREVMLCBvTW9kZWwpLFxyXG4gICAgICAgICAgICAgICAgICBnZXREb21haW5CaXRJbmRleFNhZmUoRE9NQUlOX01FVEFNT0RFTCwgb01vZGVsKSxcclxuICAgICAgICAgICAgICAgIElNYXRjaC5XT1JEVFlQRS5GQUNULCBvTW9kZWwubVJ1bGVzLCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuICAgICAgICAvLyBUT0RPOiBzeW5vbnltIGhhdmUgdG8gYmUgYWRkZWQgYXMgKkZBQ1QqIGZvciB0aGUgbWV0YW1vZGVsIVxyXG5cclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgICAgLy8gY2hlY2sgdGhlIHRvb2xcclxuICAgICAgICBpZiAob01kbC50b29sICYmIG9NZGwudG9vbC5yZXF1aXJlcykge1xyXG4gICAgICAgICAgICB2YXIgcmVxdWlyZXMgPSBPYmplY3Qua2V5cyhvTWRsLnRvb2wucmVxdWlyZXMgfHwge30pO1xyXG4gICAgICAgICAgICB2YXIgZGlmZiA9IF8uZGlmZmVyZW5jZShyZXF1aXJlcywgb01kbC5jYXRlZ29yeSk7XHJcbiAgICAgICAgICAgIGlmIChkaWZmLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgJHtvTWRsLmRvbWFpbn0gOiBVbmtvd24gY2F0ZWdvcnkgaW4gcmVxdWlyZXMgb2YgdG9vbDogXCJgICsgZGlmZi5qb2luKCdcIicpICsgJ1wiJyk7XHJcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoLTEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBvcHRpb25hbCA9IE9iamVjdC5rZXlzKG9NZGwudG9vbC5vcHRpb25hbCk7XHJcbiAgICAgICAgICAgIGRpZmYgPSBfLmRpZmZlcmVuY2Uob3B0aW9uYWwsIG9NZGwuY2F0ZWdvcnkpO1xyXG4gICAgICAgICAgICBpZiAoZGlmZi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICR7b01kbC5kb21haW59IDogVW5rb3duIGNhdGVnb3J5IG9wdGlvbmFsIG9mIHRvb2w6IFwiYCArIGRpZmYuam9pbignXCInKSArICdcIicpO1xyXG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KC0xKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhvTWRsLnRvb2wuc2V0cyB8fCB7fSkuZm9yRWFjaChmdW5jdGlvbiAoc2V0SUQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBkaWZmID0gXy5kaWZmZXJlbmNlKG9NZGwudG9vbC5zZXRzW3NldElEXS5zZXQsIG9NZGwuY2F0ZWdvcnkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRpZmYubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgJHtvTWRsLmRvbWFpbn0gOiBVbmtvd24gY2F0ZWdvcnkgaW4gc2V0SWQgJHtzZXRJRH0gb2YgdG9vbDogXCJgICsgZGlmZi5qb2luKCdcIicpICsgJ1wiJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5leGl0KC0xKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBleHRyYWN0IHRvb2xzIGFuIGFkZCB0byB0b29sczpcclxuICAgICAgICAgICAgb01vZGVsLnRvb2xzLmZpbHRlcihmdW5jdGlvbiAob0VudHJ5KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob0VudHJ5Lm5hbWUgPT09IChvTWRsLnRvb2wgJiYgb01kbC50b29sLm5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUb29sIFwiICsgb01kbC50b29sLm5hbWUgKyBcIiBhbHJlYWR5IHByZXNlbnQgd2hlbiBsb2FkaW5nIFwiICsgc01vZGVsTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy90aHJvdyBuZXcgRXJyb3IoJ0RvbWFpbiBhbHJlYWR5IGxvYWRlZD8nKTtcclxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoLTEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBvTWRsLnRvb2xoaWRkZW4gPSB0cnVlO1xyXG4gICAgICAgICAgICBvTWRsLnRvb2wucmVxdWlyZXMgPSB7IFwiaW1wb3NzaWJsZVwiOiB7fSB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBhZGQgdGhlIHRvb2wgbmFtZSBhcyBydWxlIHVubGVzcyBoaWRkZW5cclxuICAgICAgICBpZiAoIW9NZGwudG9vbGhpZGRlbiAmJiBvTWRsLnRvb2wgJiYgb01kbC50b29sLm5hbWUpIHtcclxuICAgICAgICAgICAgaW5zZXJ0UnVsZUlmTm90UHJlc2VudChvTW9kZWwubVJ1bGVzLCB7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yeTogXCJ0b29sXCIsXHJcbiAgICAgICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBvTWRsLnRvb2wubmFtZSxcclxuICAgICAgICAgICAgICAgIHR5cGU6IElNYXRjaC5FbnVtUnVsZVR5cGUuV09SRCxcclxuICAgICAgICAgICAgICAgIHdvcmQ6IG9NZGwudG9vbC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgYml0aW5kZXg6IG9NZGwuYml0aW5kZXgsXHJcbiAgICAgICAgICAgICAgICBiaXRTZW50ZW5jZUFuZCA6IG9NZGwuYml0aW5kZXgsXHJcbiAgICAgICAgICAgICAgICB3b3JkVHlwZSA6IElNYXRjaC5XT1JEVFlQRS5UT09MLFxyXG4gICAgICAgICAgICAgICAgX3Jhbmtpbmc6IDAuOTVcclxuICAgICAgICAgICAgfSwgb01vZGVsLnNlZW5SdWxlcyk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBpZiAob01kbC5zeW5vbnltcyAmJiBvTWRsLnN5bm9ueW1zW1widG9vbFwiXSkge1xyXG4gICAgICAgICAgICBhZGRTeW5vbnltcyhvTWRsLnN5bm9ueW1zW1widG9vbFwiXSwgXCJ0b29sXCIsIG9NZGwudG9vbC5uYW1lLCBvTWRsLmJpdGluZGV4LFxyXG4gICAgICAgICAgICBvTWRsLmJpdGluZGV4LCBJTWF0Y2guV09SRFRZUEUuVE9PTCwgb01vZGVsLm1SdWxlcywgb01vZGVsLnNlZW5SdWxlcyk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAqL1xyXG5cclxuICAgIC8vIGFkZCBzeW5zb255bSBmb3IgdGhlIGRvbWFpbnNcclxuXHJcblxyXG4gICAgLy8gYWRkIHN5bm9ueW1zIGZvciB0aGUgY2F0ZWdvcmllc1xyXG5cclxuICAgIG1vZGVsRG9jLl9jYXRlZ29yaWVzLmZvckVhY2goY2F0ID0+IHtcclxuICAgICAgICBpZiAoY2F0LmNhdGVnb3J5X3N5bm9ueW1zICYmIGNhdC5jYXRlZ29yeV9zeW5vbnltcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGlmIChvTW9kZWwuZnVsbC5kb21haW5bb01kbC5kb21haW5dLmNhdGVnb3JpZXNbY2F0LmNhdGVnb3J5XSkge1xyXG4gICAgICAgICAgICAgICAgb01vZGVsLmZ1bGwuZG9tYWluW29NZGwuZG9tYWluXS5jYXRlZ29yaWVzW2NhdC5jYXRlZ29yeV0uY2F0ZWdvcnlfc3lub255bXMgPSBjYXQuY2F0ZWdvcnlfc3lub255bXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYWRkU3lub255bXMoY2F0LmNhdGVnb3J5X3N5bm9ueW1zLCBcImNhdGVnb3J5XCIsIGNhdC5jYXRlZ29yeSwgb01kbC5iaXRpbmRleCwgb01kbC5iaXRpbmRleCxcclxuICAgICAgICAgICAgICAgIElNYXRjaC5XT1JEVFlQRS5DQVRFR09SWSwgb01vZGVsLm1SdWxlcywgb01vZGVsLnNlZW5SdWxlcyk7XHJcbiAgICAgICAgICAgIC8vIGFkZCBzeW5vbnltcyBpbnRvIHRoZSBtZXRhbW9kZWwgZG9tYWluXHJcbiAgICAgICAgICAgIGFkZFN5bm9ueW1zKGNhdC5jYXRlZ29yeV9zeW5vbnltcywgXCJjYXRlZ29yeVwiLCBjYXQuY2F0ZWdvcnksIGdldERvbWFpbkJpdEluZGV4U2FmZShET01BSU5fTUVUQU1PREVMLCBvTW9kZWwpLFxyXG4gICAgICAgICAgICAgICAgICBnZXREb21haW5CaXRJbmRleFNhZmUoRE9NQUlOX01FVEFNT0RFTCwgb01vZGVsKSxcclxuICAgICAgICAgICAgICAgIElNYXRjaC5XT1JEVFlQRS5GQUNULCBvTW9kZWwubVJ1bGVzLCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIGFkZCBvcGVyYXRvcnNcclxuXHJcbiAgICAvLyBhZGQgZmlsbGVyc1xyXG4gICAgaWYob01vZGVsLmRvbWFpbnMuaW5kZXhPZihvTWRsLmRvbWFpbikgPCAwKSB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoJ21pc3NpbmcgZG9tYWluIHJlZ2lzdHJhdGlvbiBmb3IgJyArIG9NZGwuZG9tYWluKTtcclxuICAgIH1cclxuICAgIC8vb01vZGVsLmRvbWFpbnMucHVzaChvTWRsLmRvbWFpbik7XHJcbiAgICBvTW9kZWwuY2F0ZWdvcnkgPSBvTW9kZWwuY2F0ZWdvcnkuY29uY2F0KG9NZGwuY2F0ZWdvcnkpO1xyXG4gICAgb01vZGVsLmNhdGVnb3J5LnNvcnQoKTtcclxuICAgIG9Nb2RlbC5jYXRlZ29yeSA9IG9Nb2RlbC5jYXRlZ29yeS5maWx0ZXIoZnVuY3Rpb24gKHN0cmluZywgaW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gb01vZGVsLmNhdGVnb3J5W2luZGV4XSAhPT0gb01vZGVsLmNhdGVnb3J5W2luZGV4ICsgMV07XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBvTWRsO1xyXG59IC8vIGxvYWRtb2RlbFxyXG5cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRSdWxlcyhydWxlczogSU1hdGNoLm1SdWxlW10pOiBJTWF0Y2guU3BsaXRSdWxlcyB7XHJcbiAgICB2YXIgcmVzID0ge307XHJcbiAgICB2YXIgbm9uV29yZFJ1bGVzID0gW107XHJcbiAgICBydWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChydWxlKSB7XHJcbiAgICAgICAgaWYgKHJ1bGUudHlwZSA9PT0gSU1hdGNoLkVudW1SdWxlVHlwZS5XT1JEKSB7XHJcbiAgICAgICAgICAgIGlmICghcnVsZS5sb3dlcmNhc2V3b3JkKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSdWxlIGhhcyBubyBtZW1iZXIgbG93ZXJjYXNld29yZFwiICsgSlNPTi5zdHJpbmdpZnkocnVsZSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlc1tydWxlLmxvd2VyY2FzZXdvcmRdID0gcmVzW3J1bGUubG93ZXJjYXNld29yZF0gfHwgeyBiaXRpbmRleDogMCwgcnVsZXM6IFtdIH07XHJcbiAgICAgICAgICAgIHJlc1tydWxlLmxvd2VyY2FzZXdvcmRdLmJpdGluZGV4ID0gcmVzW3J1bGUubG93ZXJjYXNld29yZF0uYml0aW5kZXggfCBydWxlLmJpdGluZGV4O1xyXG4gICAgICAgICAgICByZXNbcnVsZS5sb3dlcmNhc2V3b3JkXS5ydWxlcy5wdXNoKHJ1bGUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG5vbldvcmRSdWxlcy5wdXNoKHJ1bGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB3b3JkTWFwOiByZXMsXHJcbiAgICAgICAgbm9uV29yZFJ1bGVzOiBub25Xb3JkUnVsZXMsXHJcbiAgICAgICAgYWxsUnVsZXM6IHJ1bGVzLFxyXG4gICAgICAgIHdvcmRDYWNoZToge31cclxuICAgIH07XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc29ydEZsYXRSZWNvcmRzKGEsYikge1xyXG4gICAgdmFyIGtleXMgPSBfLnVuaW9uKE9iamVjdC5rZXlzKGEpLE9iamVjdC5rZXlzKGIpKS5zb3J0KCk7XHJcbiAgICB2YXIgciA9IDA7XHJcbiAgICBrZXlzLmV2ZXJ5KCAoa2V5KSA9PiB7XHJcbiAgICAgICAgaWYodHlwZW9mIGFba2V5XSA9PT0gXCJzdHJpbmdcIiAmJiB0eXBlb2YgYltrZXldICE9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIHIgPSAtMTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0eXBlb2YgYVtrZXldICE9PSBcInN0cmluZ1wiICYmIHR5cGVvZiBiW2tleV0gPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgciA9ICsxO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHR5cGVvZiBhW2tleV0gIT09IFwic3RyaW5nXCIgJiYgdHlwZW9mIGJba2V5XSAhPT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICByID0gMDtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHIgPSBhW2tleV0ubG9jYWxlQ29tcGFyZShiW2tleV0pO1xyXG4gICAgICAgIHJldHVybiByID09PSAwO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcjtcclxufTtcclxuXHJcblxyXG5mdW5jdGlvbiBjbXBMZW5ndGhTb3J0KGE6IHN0cmluZywgYjogc3RyaW5nKSB7XHJcbiAgICB2YXIgZCA9IGEubGVuZ3RoIC0gYi5sZW5ndGg7XHJcbiAgICBpZiAoZCkge1xyXG4gICAgICAgIHJldHVybiBkO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGEubG9jYWxlQ29tcGFyZShiKTtcclxufVxyXG5cclxuXHJcbmltcG9ydCAqIGFzIEFsZ29sIGZyb20gJy4uL21hdGNoL2FsZ29sJztcclxuLy8gb2Zmc2V0WzBdIDogbGVuLTJcclxuLy8gICAgICAgICAgICAgbGVuIC0xXHJcbi8vICAgICAgICAgICAgIGxlblxyXG4vLyAgICAgICAgICAgICBsZW4gKzFcclxuLy8gICAgICAgICAgICAgbGVuICsyXHJcbi8vICAgICAgICAgICAgIGxlbiArM1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGZpbmROZXh0TGVuKHRhcmdldExlbjogbnVtYmVyLCBhcnI6IHN0cmluZ1tdLCBvZmZzZXRzOiBudW1iZXJbXSkge1xyXG4gICAgb2Zmc2V0cy5zaGlmdCgpO1xyXG4gICAgZm9yICh2YXIgaSA9IG9mZnNldHNbNF07IChpIDwgYXJyLmxlbmd0aCkgJiYgKGFycltpXS5sZW5ndGggPD0gdGFyZ2V0TGVuKTsgKytpKSB7XHJcbiAgICAgICAgLyogZW1wdHkqL1xyXG4gICAgfVxyXG4gICAgb2Zmc2V0cy5wdXNoKGkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYWRkUmFuZ2VSdWxlc1VubGVzc1ByZXNlbnQocnVsZXM6IElNYXRjaC5tUnVsZVtdLCBsY3dvcmQ6IHN0cmluZywgcmFuZ2VSdWxlczogSU1hdGNoLm1SdWxlW10sIHByZXNlbnRSdWxlc0ZvcktleTogSU1hdGNoLm1SdWxlW10sIHNlZW5SdWxlcykge1xyXG4gICAgcmFuZ2VSdWxlcy5mb3JFYWNoKHJhbmdlUnVsZSA9PiB7XHJcbiAgICAgICAgdmFyIG5ld1J1bGUgPSAoT2JqZWN0IGFzIGFueSkuYXNzaWduKHt9LCByYW5nZVJ1bGUpO1xyXG4gICAgICAgIG5ld1J1bGUubG93ZXJjYXNld29yZCA9IGxjd29yZDtcclxuICAgICAgICBuZXdSdWxlLndvcmQgPSBsY3dvcmQ7XHJcbiAgICAgICAgLy9pZigobGN3b3JkID09PSAnc2VydmljZXMnIHx8IGxjd29yZCA9PT0gJ3NlcnZpY2UnKSAmJiBuZXdSdWxlLnJhbmdlLnJ1bGUubG93ZXJjYXNld29yZC5pbmRleE9mKCdvZGF0YScpPj0wKSB7XHJcbiAgICAgICAgLy8gICAgY29uc29sZS5sb2coXCJhZGRpbmcgXCIrIEpTT04uc3RyaW5naWZ5KG5ld1J1bGUpICsgXCJcXG5cIik7XHJcbiAgICAgICAgLy99XHJcbiAgICAgICAgLy90b2RvOiBjaGVjayB3aGV0aGVyIGFuIGVxdWl2YWxlbnQgcnVsZSBpcyBhbHJlYWR5IHByZXNlbnQ/XHJcbiAgICAgICAgdmFyIGNudCA9IHJ1bGVzLmxlbmd0aDtcclxuICAgICAgICBpbnNlcnRSdWxlSWZOb3RQcmVzZW50KHJ1bGVzLCBuZXdSdWxlLCBzZWVuUnVsZXMpO1xyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhZGRDbG9zZUV4YWN0UmFuZ2VSdWxlcyhydWxlczogSU1hdGNoLm1SdWxlW10sIHNlZW5SdWxlcykge1xyXG4gICAgdmFyIGtleXNNYXAgPSB7fSBhcyB7IFtrZXk6IHN0cmluZ106IElNYXRjaC5tUnVsZVtdIH07XHJcbiAgICB2YXIgcmFuZ2VLZXlzTWFwID0ge30gYXMgeyBba2V5OiBzdHJpbmddOiBJTWF0Y2gubVJ1bGVbXSB9O1xyXG4gICAgcnVsZXMuZm9yRWFjaChydWxlID0+IHtcclxuICAgICAgICBpZiAocnVsZS50eXBlID09PSBJTWF0Y2guRW51bVJ1bGVUeXBlLldPUkQpIHtcclxuICAgICAgICAgICAgLy9rZXlzTWFwW3J1bGUubG93ZXJjYXNld29yZF0gPSAxO1xyXG4gICAgICAgICAgICBrZXlzTWFwW3J1bGUubG93ZXJjYXNld29yZF0gPSBrZXlzTWFwW3J1bGUubG93ZXJjYXNld29yZF0gfHwgW107XHJcbiAgICAgICAgICAgIGtleXNNYXBbcnVsZS5sb3dlcmNhc2V3b3JkXS5wdXNoKHJ1bGUpO1xyXG4gICAgICAgICAgICBpZiAoIXJ1bGUuZXhhY3RPbmx5ICYmIHJ1bGUucmFuZ2UpIHtcclxuICAgICAgICAgICAgICAgIHJhbmdlS2V5c01hcFtydWxlLmxvd2VyY2FzZXdvcmRdID0gcmFuZ2VLZXlzTWFwW3J1bGUubG93ZXJjYXNld29yZF0gfHwgW107XHJcbiAgICAgICAgICAgICAgICByYW5nZUtleXNNYXBbcnVsZS5sb3dlcmNhc2V3b3JkXS5wdXNoKHJ1bGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGtleXNNYXApO1xyXG4gICAga2V5cy5zb3J0KGNtcExlbmd0aFNvcnQpO1xyXG4gICAgdmFyIGxlbiA9IDA7XHJcbiAgICBrZXlzLmZvckVhY2goKGtleSwgaW5kZXgpID0+IHtcclxuICAgICAgICBpZiAoa2V5Lmxlbmd0aCAhPSBsZW4pIHtcclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcInNoaWZ0IHRvIGxlblwiICsga2V5Lmxlbmd0aCArICcgYXQgJyArIGluZGV4ICsgJyAnICsga2V5ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxlbiA9IGtleS5sZW5ndGg7XHJcbiAgICB9KTtcclxuICAgIC8vICAga2V5cyA9IGtleXMuc2xpY2UoMCwyMDAwKTtcclxuICAgIHZhciByYW5nZUtleXMgPSBPYmplY3Qua2V5cyhyYW5nZUtleXNNYXApO1xyXG4gICAgcmFuZ2VLZXlzLnNvcnQoY21wTGVuZ3RoU29ydCk7XHJcbiAgICAvL2NvbnNvbGUubG9nKGAgJHtrZXlzLmxlbmd0aH0ga2V5cyBhbmQgJHtyYW5nZUtleXMubGVuZ3RofSByYW5nZWtleXMgYCk7XHJcbiAgICB2YXIgbG93ID0gMDtcclxuICAgIHZhciBoaWdoID0gMDtcclxuICAgIHZhciBsYXN0bGVuID0gMDtcclxuICAgIHZhciBvZmZzZXRzID0gWzAsIDAsIDAsIDAsIDAsIDBdO1xyXG4gICAgdmFyIGxlbiA9IHJhbmdlS2V5cy5sZW5ndGg7XHJcbiAgICBmaW5kTmV4dExlbigwLCBrZXlzLCBvZmZzZXRzKTtcclxuICAgIGZpbmROZXh0TGVuKDEsIGtleXMsIG9mZnNldHMpO1xyXG4gICAgZmluZE5leHRMZW4oMiwga2V5cywgb2Zmc2V0cyk7XHJcblxyXG4gICAgcmFuZ2VLZXlzLmZvckVhY2goZnVuY3Rpb24gKHJhbmdlS2V5KSB7XHJcbiAgICAgICAgaWYgKHJhbmdlS2V5Lmxlbmd0aCAhPT0gbGFzdGxlbikge1xyXG4gICAgICAgICAgICBmb3IgKGkgPSBsYXN0bGVuICsgMTsgaSA8PSByYW5nZUtleS5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgZmluZE5leHRMZW4oaSArIDIsIGtleXMsIG9mZnNldHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vICAgY29uc29sZS5sb2coYCBzaGlmdGVkIHRvICR7cmFuZ2VLZXkubGVuZ3RofSB3aXRoIG9mZnNldHMgYmVlaW5nICR7b2Zmc2V0cy5qb2luKCcgJyl9YCk7XHJcbiAgICAgICAgICAgIC8vICAgY29uc29sZS5sb2coYCBoZXJlIDAgJHtvZmZzZXRzWzBdfSA6ICR7a2V5c1tNYXRoLm1pbihrZXlzLmxlbmd0aC0xLCBvZmZzZXRzWzBdKV0ubGVuZ3RofSAgJHtrZXlzW01hdGgubWluKGtleXMubGVuZ3RoLTEsIG9mZnNldHNbMF0pXX0gYCk7XHJcbiAgICAgICAgICAgIC8vICBjb25zb2xlLmxvZyhgIGhlcmUgNS0xICAke2tleXNbb2Zmc2V0c1s1XS0xXS5sZW5ndGh9ICAke2tleXNbb2Zmc2V0c1s1XS0xXX0gYCk7XHJcbiAgICAgICAgICAgIC8vICAgY29uc29sZS5sb2coYCBoZXJlIDUgJHtvZmZzZXRzWzVdfSA6ICR7a2V5c1tNYXRoLm1pbihrZXlzLmxlbmd0aC0xLCBvZmZzZXRzWzVdKV0ubGVuZ3RofSAgJHtrZXlzW01hdGgubWluKGtleXMubGVuZ3RoLTEsIG9mZnNldHNbNV0pXX0gYCk7XHJcbiAgICAgICAgICAgIGxhc3RsZW4gPSByYW5nZUtleS5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAodmFyIGkgPSBvZmZzZXRzWzBdOyBpIDwgb2Zmc2V0c1s1XTsgKytpKSB7XHJcbiAgICAgICAgICAgIHZhciBkID0gRGlzdGFuY2UuY2FsY0Rpc3RhbmNlQWRqdXN0ZWQocmFuZ2VLZXksIGtleXNbaV0pO1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgJHtyYW5nZUtleS5sZW5ndGgta2V5c1tpXS5sZW5ndGh9ICR7ZH0gJHtyYW5nZUtleX0gYW5kICR7a2V5c1tpXX0gIGApO1xyXG4gICAgICAgICAgICBpZiAoKGQgIT09IDEuMCkgJiYgKGQgPj0gQWxnb2wuQ3V0b2ZmX3JhbmdlQ2xvc2VNYXRjaCkpIHtcclxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coYHdvdWxkIGFkZCAke3JhbmdlS2V5fSBmb3IgJHtrZXlzW2ldfSAke2R9YCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgY250ID0gcnVsZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgLy8gd2Ugb25seSBoYXZlIHRvIGFkZCBpZiB0aGVyZSBpcyBub3QgeWV0IGEgbWF0Y2ggcnVsZSBoZXJlIHdoaWNoIHBvaW50cyB0byB0aGUgc2FtZVxyXG4gICAgICAgICAgICAgICAgYWRkUmFuZ2VSdWxlc1VubGVzc1ByZXNlbnQocnVsZXMsIGtleXNbaV0sIHJhbmdlS2V5c01hcFtyYW5nZUtleV0sIGtleXNNYXBba2V5c1tpXV0sIHNlZW5SdWxlcyk7XHJcbiAgICAgICAgICAgICAgICBpZiAocnVsZXMubGVuZ3RoID4gY250KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhgIGFkZGVkICR7KHJ1bGVzLmxlbmd0aCAtIGNudCl9IHJlY29yZHMgYXQke3JhbmdlS2V5fSBmb3IgJHtrZXlzW2ldfSAke2R9YCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvKlxyXG4gICAgW1xyXG4gICAgICAgIFsnYUVGRycsJ2FFRkdIJ10sXHJcbiAgICAgICAgWydhRUZHSCcsJ2FFRkdISSddLFxyXG4gICAgICAgIFsnT2RhdGEnLCdPRGF0YXMnXSxcclxuICAgWydPZGF0YScsJ09kYXRhcyddLFxyXG4gICBbJ09kYXRhJywnT2RhdGInXSxcclxuICAgWydPZGF0YScsJ1VEYXRhJ10sXHJcbiAgIFsnc2VydmljZScsJ3NlcnZpY2VzJ10sXHJcbiAgIFsndGhpcyBpc2Z1bm55IGFuZCBtb3JlJywndGhpcyBpc2Z1bm55IGFuZCBtb3JlcyddLFxyXG4gICAgXS5mb3JFYWNoKHJlYyA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coYGRpc3RhbmNlICR7cmVjWzBdfSAke3JlY1sxXX0gOiAke0Rpc3RhbmNlLmNhbGNEaXN0YW5jZShyZWNbMF0scmVjWzFdKX0gIGFkZiAke0Rpc3RhbmNlLmNhbGNEaXN0YW5jZUFkanVzdGVkKHJlY1swXSxyZWNbMV0pfSBgKTtcclxuXHJcbiAgICB9KTtcclxuICAgIGNvbnNvbGUubG9nKFwiZGlzdGFuY2UgT2RhdGEgVWRhdGFcIisgRGlzdGFuY2UuY2FsY0Rpc3RhbmNlKCdPRGF0YScsJ1VEYXRhJykpO1xyXG4gICAgY29uc29sZS5sb2coXCJkaXN0YW5jZSBPZGF0YSBPZGF0YlwiKyBEaXN0YW5jZS5jYWxjRGlzdGFuY2UoJ09EYXRhJywnT0RhdGInKSk7XHJcbiAgICBjb25zb2xlLmxvZyhcImRpc3RhbmNlIE9kYXRhcyBPZGF0YVwiKyBEaXN0YW5jZS5jYWxjRGlzdGFuY2UoJ09EYXRhJywnT0RhdGFhJykpO1xyXG4gICAgY29uc29sZS5sb2coXCJkaXN0YW5jZSBPZGF0YXMgYWJjZGVcIisgRGlzdGFuY2UuY2FsY0Rpc3RhbmNlKCdhYmNkZScsJ2FiY2RlZicpKTtcclxuICAgIGNvbnNvbGUubG9nKFwiZGlzdGFuY2Ugc2VydmljZXMgXCIrIERpc3RhbmNlLmNhbGNEaXN0YW5jZSgnc2VydmljZXMnLCdzZXJ2aWNlJykpO1xyXG4gICAgKi9cclxufVxyXG52YXIgbiA9IDA7XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRGaWxsZXJzKHNyY0hhbmRsZSA6IElTcmNIYW5kbGUsIG9Nb2RlbCA6IElNYXRjaC5JTW9kZWxzKSAgOiBQcm9taXNlPGFueT4ge1xyXG4gICAgdmFyIGZpbGxlckJpdEluZGV4ID0gZ2V0RG9tYWluQml0SW5kZXgoJ21ldGEnLCBvTW9kZWwpO1xyXG4gICAgdmFyIGJpdEluZGV4QWxsRG9tYWlucyA9IGdldEFsbERvbWFpbnNCaXRJbmRleChvTW9kZWwpO1xyXG4gICAgcmV0dXJuIFNjaGVtYWxvYWQuZ2V0RmlsbGVyc0Zyb21EQihzcmNIYW5kbGUpXHJcbiAgICAvLy50aGVuKFxyXG4vLyAgICAgICAgKGZpbGxlcnNPYmopID0+IGZpbGxlcnNPYmouZmlsbGVyc1xyXG4gIC8vICApXHJcbiAgICAudGhlbigoZmlsbGVyczogc3RyaW5nW10pID0+IHtcclxuICAgICAgICAvLyAgZmlsbGVyc3JlYWRGaWxlQXNKU09OKCcuLycgKyBtb2RlbFBhdGggKyAnL2ZpbGxlci5qc29uJyk7XHJcbiAgICAgICAgLypcclxuICAgICAgICB2YXIgcmUgPSBcIl4oKFwiICsgZmlsbGVycy5qb2luKFwiKXwoXCIpICsgXCIpKSRcIjtcclxuICAgICAgICBvTW9kZWwubVJ1bGVzLnB1c2goe1xyXG4gICAgICAgICAgICBjYXRlZ29yeTogXCJmaWxsZXJcIixcclxuICAgICAgICAgICAgdHlwZTogSU1hdGNoLkVudW1SdWxlVHlwZS5SRUdFWFAsXHJcbiAgICAgICAgICAgIHJlZ2V4cDogbmV3IFJlZ0V4cChyZSwgXCJpXCIpLFxyXG4gICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBcImZpbGxlclwiLFxyXG4gICAgICAgICAgICBiaXRpbmRleDogZmlsbGVyQml0SW5kZXgsXHJcbiAgICAgICAgICAgIF9yYW5raW5nOiAwLjlcclxuICAgICAgICB9KTtcclxuICAgICAgICAqL1xyXG4gICAgICAgIGlmICghXy5pc0FycmF5KGZpbGxlcnMpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZXhwZWN0IGZpbGxlcnMgdG8gYmUgYW4gYXJyYXkgb2Ygc3RyaW5ncycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaWxsZXJzLmZvckVhY2goZmlsbGVyID0+IHtcclxuICAgICAgICAgICAgaW5zZXJ0UnVsZUlmTm90UHJlc2VudChvTW9kZWwubVJ1bGVzLCB7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yeTogXCJmaWxsZXJcIixcclxuICAgICAgICAgICAgICAgIHR5cGU6IElNYXRjaC5FbnVtUnVsZVR5cGUuV09SRCxcclxuICAgICAgICAgICAgICAgIHdvcmQ6IGZpbGxlcixcclxuICAgICAgICAgICAgICAgIGxvd2VyY2FzZXdvcmQ6IGZpbGxlci50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICAgICAgbWF0Y2hlZFN0cmluZzogZmlsbGVyLCAvL1wiZmlsbGVyXCIsXHJcbiAgICAgICAgICAgICAgICBleGFjdE9ubHk6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBiaXRpbmRleDogZmlsbGVyQml0SW5kZXgsXHJcbiAgICAgICAgICAgICAgICBiaXRTZW50ZW5jZUFuZDogYml0SW5kZXhBbGxEb21haW5zLFxyXG4gICAgICAgICAgICAgICAgd29yZFR5cGU6IElNYXRjaC5XT1JEVFlQRS5GSUxMRVIsXHJcbiAgICAgICAgICAgICAgICBfcmFua2luZzogMC45XHJcbiAgICAgICAgICAgIH0sIG9Nb2RlbC5zZWVuUnVsZXMpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRPcGVyYXRvcnMoc3JjSGFuZGxlOiBJU3JjSGFuZGxlLCBvTW9kZWw6IElNYXRjaC5JTW9kZWxzKSA6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgZGVidWdsb2coJ3JlYWRpbmcgb3BlcmF0b3JzJyk7XHJcbiAgICAgICAgLy9hZGQgb3BlcmF0b3JzXHJcbiAgICByZXR1cm4gU2NoZW1hbG9hZC5nZXRPcGVyYXRvcnNGcm9tREIoc3JjSGFuZGxlKS50aGVuKFxyXG4gICAgICAgIChvcGVyYXRvcnM6IGFueSkgPT4ge1xyXG4gICAgICAgIHZhciBvcGVyYXRvckJpdEluZGV4ID0gZ2V0RG9tYWluQml0SW5kZXgoJ29wZXJhdG9ycycsIG9Nb2RlbCk7XHJcbiAgICAgICAgdmFyIGJpdEluZGV4QWxsRG9tYWlucyA9IGdldEFsbERvbWFpbnNCaXRJbmRleChvTW9kZWwpO1xyXG4gICAgICAgIE9iamVjdC5rZXlzKG9wZXJhdG9ycy5vcGVyYXRvcnMpLmZvckVhY2goZnVuY3Rpb24gKG9wZXJhdG9yKSB7XHJcbiAgICAgICAgICAgIGlmIChJTWF0Y2guYU9wZXJhdG9yTmFtZXMuaW5kZXhPZihvcGVyYXRvcikgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICBkZWJ1Z2xvZyhcInVua25vd24gb3BlcmF0b3IgXCIgKyBvcGVyYXRvcik7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmtub3duIG9wZXJhdG9yIFwiICsgb3BlcmF0b3IgKyAnIChhZGQgdG8gaWZtYXRjaC50cyAgYU9wZXJhdG9yTmFtZXMpJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb01vZGVsLm9wZXJhdG9yc1tvcGVyYXRvcl0gPSBvcGVyYXRvcnMub3BlcmF0b3JzW29wZXJhdG9yXTtcclxuICAgICAgICAgICAgb01vZGVsLm9wZXJhdG9yc1tvcGVyYXRvcl0ub3BlcmF0b3IgPSA8SU1hdGNoLk9wZXJhdG9yTmFtZT5vcGVyYXRvcjtcclxuICAgICAgICAgICAgT2JqZWN0LmZyZWV6ZShvTW9kZWwub3BlcmF0b3JzW29wZXJhdG9yXSk7XHJcbiAgICAgICAgICAgIHZhciB3b3JkID0gb3BlcmF0b3I7XHJcbiAgICAgICAgICAgIGluc2VydFJ1bGVJZk5vdFByZXNlbnQob01vZGVsLm1SdWxlcywge1xyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcnk6IFwib3BlcmF0b3JcIixcclxuICAgICAgICAgICAgICAgIHdvcmQ6IHdvcmQudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICAgICAgICAgIGxvd2VyY2FzZXdvcmQ6IHdvcmQudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICAgICAgICAgIHR5cGU6IElNYXRjaC5FbnVtUnVsZVR5cGUuV09SRCxcclxuICAgICAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IHdvcmQsXHJcbiAgICAgICAgICAgICAgICBiaXRpbmRleDogb3BlcmF0b3JCaXRJbmRleCxcclxuICAgICAgICAgICAgICAgIGJpdFNlbnRlbmNlQW5kOiBiaXRJbmRleEFsbERvbWFpbnMsXHJcbiAgICAgICAgICAgICAgICB3b3JkVHlwZTogSU1hdGNoLldPUkRUWVBFLk9QRVJBVE9SLFxyXG4gICAgICAgICAgICAgICAgX3Jhbmtpbmc6IDAuOVxyXG4gICAgICAgICAgICB9LCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuICAgICAgICAgICAgLy8gYWRkIGFsbCBzeW5vbnltc1xyXG4gICAgICAgICAgICBpZiAob3BlcmF0b3JzLnN5bm9ueW1zW29wZXJhdG9yXSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IG9wZXJhdG9ycy5zeW5vbnltc1tvcGVyYXRvcl07XHJcbiAgICAgICAgICAgICAgICBpZiAoIGFyciApXHJcbiAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmKCBBcnJheS5pc0FycmF5KGFycikpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcnIuZm9yRWFjaChmdW5jdGlvbiAoc3lub255bSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zZXJ0UnVsZUlmTm90UHJlc2VudChvTW9kZWwubVJ1bGVzLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6IFwib3BlcmF0b3JcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JkOiBzeW5vbnltLnRvTG93ZXJDYXNlKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXJjYXNld29yZDogc3lub255bS50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IElNYXRjaC5FbnVtUnVsZVR5cGUuV09SRCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBvcGVyYXRvcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiaXRpbmRleDogb3BlcmF0b3JCaXRJbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiaXRTZW50ZW5jZUFuZDogYml0SW5kZXhBbGxEb21haW5zLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmRUeXBlOiBJTWF0Y2guV09SRFRZUEUuT1BFUkFUT1IsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3Jhbmtpbmc6IDAuOVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgb01vZGVsLnNlZW5SdWxlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJFeHBldGVkIG9wZXJhdG9yIHN5bm9ueW0gdG8gYmUgYXJyYXkgXCIgKyBvcGVyYXRvciArIFwiIGlzIFwiICsgSlNPTi5zdHJpbmdpZnkoYXJyKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVsZWFzZU1vZGVsKG1vZGVsIDogSU1hdGNoLklNb2RlbHMpIHtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRNb2RlbHNPcGVuaW5nQ29ubmVjdGlvbihzcmNoYW5kbGU6IElTcmNIYW5kbGUsIGNvbm5lY3Rpb25TdHJpbmc/IDogc3RyaW5nLCAgbW9kZWxQYXRoPyA6IHN0cmluZykgOiBQcm9taXNlPElNYXRjaC5JTW9kZWxzPiB7XHJcbiAgICByZXR1cm4gbG9hZE1vZGVscyhzcmNoYW5kbGUsIGNvbm5lY3Rpb25TdHJpbmcsIG1vZGVsUGF0aCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gc3JjSGFuZGxlXHJcbiAqIEBwYXJhbSBtb2RlbFBhdGhcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBsb2FkTW9kZWxzKHNyY0hhbmRsZTogSVNyY0hhbmRsZSwgY29ubmVjdGlvblN0cmluZyA6IHN0cmluZywgbW9kZWxQYXRoIDogc3RyaW5nKSA6IFByb21pc2U8SU1hdGNoLklNb2RlbHM+IHtcclxuICAgIGlmKHNyY0hhbmRsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdleHBlY3QgYSBzcmNIYW5kbGUgaGFuZGxlIHRvIGJlIHBhc3NlZCcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGdldE1vZGVsSGFuZGxlKHNyY0hhbmRsZSwgY29ubmVjdGlvblN0cmluZykudGhlbiggKG1vZGVsSGFuZGxlKSA9PntcclxuICAgICAgICBkZWJ1Z2xvZyhgZ290IGEgbW9uZ28gaGFuZGxlIGZvciAke21vZGVsUGF0aH1gKTtcclxuICAgICAgICByZXR1cm4gX2xvYWRNb2RlbHNGdWxsKG1vZGVsSGFuZGxlLCBtb2RlbFBhdGgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfbG9hZE1vZGVsc0Z1bGwobW9kZWxIYW5kbGU6IElNYXRjaC5JTW9kZWxIYW5kbGVSYXcsIG1vZGVsUGF0aD86IHN0cmluZyk6IFByb21pc2U8SU1hdGNoLklNb2RlbHM+IHtcclxuICAgIHZhciBvTW9kZWw6IElNYXRjaC5JTW9kZWxzO1xyXG4gICAgbW9kZWxQYXRoID0gbW9kZWxQYXRoIHx8IGVudk1vZGVsUGF0aDtcclxuICAgIG1vZGVsSGFuZGxlID0gbW9kZWxIYW5kbGUgfHwge1xyXG4gICAgICAgIHNyY0hhbmRsZTogdW5kZWZpbmVkLFxyXG4gICAgICAgIG1vZGVsRG9jczoge30sXHJcbiAgICAgICAgbW9uZ29NYXBzOiB7fSxcclxuICAgICAgICBtb2RlbEVTY2hlbWFzOiB7fVxyXG4gICAgfTtcclxuICAgIG9Nb2RlbCA9IHtcclxuICAgICAgICBtb25nb0hhbmRsZSA6IG1vZGVsSGFuZGxlLFxyXG4gICAgICAgIGZ1bGw6IHsgZG9tYWluOiB7fSB9LFxyXG4gICAgICAgIHJhd01vZGVsczoge30sXHJcbiAgICAgICAgZG9tYWluczogW10sXHJcbiAgICAgICAgcnVsZXM6IHVuZGVmaW5lZCxcclxuICAgICAgICBjYXRlZ29yeTogW10sXHJcbiAgICAgICAgb3BlcmF0b3JzOiB7fSxcclxuICAgICAgICBtUnVsZXM6IFtdLFxyXG4gICAgICAgIHNlZW5SdWxlczoge30sXHJcbiAgICAgICAgbWV0YTogeyB0Mzoge30gfVxyXG4gICAgfVxyXG4gICAgdmFyIHQgPSBEYXRlLm5vdygpO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgZGVidWdsb2coKCk9PiAnaGVyZSBtb2RlbCBwYXRoJyArIG1vZGVsUGF0aCk7XHJcbiAgICAgICAgdmFyIGEgPSBDaXJjdWxhclNlci5sb2FkKG1vZGVsUGF0aCArICcvX2NhY2hlLmpzJyk7XHJcbiAgICAgICAgLy8gVE9ETyBSRU1PVkUgXHJcbiAgICAgICAgLy90aHJvdyBcIm5vIGNhY2hlXCI7XHJcbiAgICAgICAgLy8gVE9ET1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coXCJmb3VuZCBhIGNhY2hlID8gIFwiICsgISFhKTtcclxuICAgICAgICAvL2EgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgaWYgKGEgJiYgIXByb2Nlc3MuZW52Lk1HTkxRX01PREVMX05PX0ZJTEVDQUNIRSkge1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdyZXR1cm4gcHJlcHMnICsgbW9kZWxQYXRoKTtcclxuICAgICAgICAgICAgZGVidWdsb2coXCJcXG4gcmV0dXJuIHByZXBhcmVkIG1vZGVsICEhXCIpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInVzaW5nIHByZXBhcmVkIG1vZGVsICBcIiArIG1vZGVsUGF0aCk7XHJcbiAgICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5BQk9UX0VNQUlMX1VTRVIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibG9hZGVkIG1vZGVscyBmcm9tIGNhY2hlIGluIFwiICsgKERhdGUubm93KCkgLSB0KSArIFwiIFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgcmVzID0gYSBhcyBJTWF0Y2guSU1vZGVscztcclxuICAgICAgICAgICAgcmVzLm1vbmdvSGFuZGxlLnNyY0hhbmRsZSAgPSBtb2RlbEhhbmRsZS5zcmNIYW5kbGU7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzKTtcclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnZXJyb3InICsgZSk7XHJcbiAgICAgICAgLy8gbm8gY2FjaGUgZmlsZSxcclxuICAgIH1cclxuICAgIHZhciBtZGxzID0gT2JqZWN0LmtleXMobW9kZWxIYW5kbGUubW9kZWxEb2NzKS5zb3J0KCk7XHJcbiAgICB2YXIgc2VlbkRvbWFpbnMgPXt9O1xyXG4gICAgbWRscy5mb3JFYWNoKChtb2RlbE5hbWUsaW5kZXgpID0+IHtcclxuICAgICAgICB2YXIgZG9tYWluID0gbW9kZWxIYW5kbGUubW9kZWxEb2NzW21vZGVsTmFtZV0uZG9tYWluO1xyXG4gICAgICAgIGlmKHNlZW5Eb21haW5zW2RvbWFpbl0pIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEb21haW4gJyArIGRvbWFpbiArICcgYWxyZWFkeSBsb2FkZWQgd2hpbGUgbG9hZGluZyAnICsgbW9kZWxOYW1lICsgJz8nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc2VlbkRvbWFpbnNbZG9tYWluXSA9IGluZGV4O1xyXG4gICAgfSlcclxuICAgIG9Nb2RlbC5kb21haW5zID0gbWRscy5tYXAobW9kZWxOYW1lID0+IG1vZGVsSGFuZGxlLm1vZGVsRG9jc1ttb2RlbE5hbWVdLmRvbWFpbik7XHJcbiAgICAvLyBjcmVhdGUgYml0aW5kZXggaW4gb3JkZXIgIVxyXG4gICAgZGVidWdsb2coJ2dvdCBkb21haW5zICcgKyBtZGxzLmpvaW4oXCJcXG5cIikpO1xyXG4gICAgZGVidWdsb2coJ2xvYWRpbmcgbW9kZWxzICcgKyBtZGxzLmpvaW4oXCJcXG5cIikpO1xyXG5cclxuICAgIHJldHVybiBQcm9taXNlLmFsbChtZGxzLm1hcCgoc01vZGVsTmFtZSkgPT5cclxuICAgICAgICBsb2FkTW9kZWwobW9kZWxIYW5kbGUsIHNNb2RlbE5hbWUsIG9Nb2RlbCkpXHJcbiAgICApLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIHZhciBtZXRhQml0SW5kZXggPSBnZXREb21haW5CaXRJbmRleCgnbWV0YScsIG9Nb2RlbCk7XHJcbiAgICAgICAgdmFyIGJpdEluZGV4QWxsRG9tYWlucyA9IGdldEFsbERvbWFpbnNCaXRJbmRleChvTW9kZWwpO1xyXG5cclxuICAgICAgICAvLyBhZGQgdGhlIGRvbWFpbiBtZXRhIHJ1bGVcclxuICAgICAgICBpbnNlcnRSdWxlSWZOb3RQcmVzZW50KG9Nb2RlbC5tUnVsZXMsIHtcclxuICAgICAgICAgICAgY2F0ZWdvcnk6IFwibWV0YVwiLFxyXG4gICAgICAgICAgICBtYXRjaGVkU3RyaW5nOiBcImRvbWFpblwiLFxyXG4gICAgICAgICAgICB0eXBlOiBJTWF0Y2guRW51bVJ1bGVUeXBlLldPUkQsXHJcbiAgICAgICAgICAgIHdvcmQ6IFwiZG9tYWluXCIsXHJcbiAgICAgICAgICAgIGJpdGluZGV4OiBtZXRhQml0SW5kZXgsXHJcbiAgICAgICAgICAgIHdvcmRUeXBlOiBJTWF0Y2guV09SRFRZUEUuTUVUQSxcclxuICAgICAgICAgICAgYml0U2VudGVuY2VBbmQ6IGJpdEluZGV4QWxsRG9tYWlucyxcclxuICAgICAgICAgICAgX3Jhbmtpbmc6IDAuOTVcclxuICAgICAgICB9LCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuICAgICAgICAvLyBpbnNlcnQgdGhlIE51bWJlcnMgcnVsZXNcclxuICAgICAgICBkZWJ1Z2xvZygnIGFkZCBudW1iZXJzIHJ1bGUnKTtcclxuICAgICAgICBpbnNlcnRSdWxlSWZOb3RQcmVzZW50KG9Nb2RlbC5tUnVsZXMsIHtcclxuICAgICAgICAgICAgY2F0ZWdvcnk6IFwibnVtYmVyXCIsXHJcbiAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IFwib25lXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IElNYXRjaC5FbnVtUnVsZVR5cGUuUkVHRVhQLFxyXG4gICAgICAgICAgICByZWdleHAgOiAvXigoXFxkKyl8KG9uZSl8KHR3byl8KHRocmVlKSkkLyxcclxuICAgICAgICAgICAgbWF0Y2hJbmRleCA6IDAsXHJcbiAgICAgICAgICAgIHdvcmQ6IFwiPG51bWJlcj5cIixcclxuICAgICAgICAgICAgYml0aW5kZXg6IG1ldGFCaXRJbmRleCxcclxuICAgICAgICAgICAgd29yZFR5cGU6IElNYXRjaC5XT1JEVFlQRS5OVU1FUklDQVJHLCAvLyBudW1iZXJcclxuICAgICAgICAgICAgYml0U2VudGVuY2VBbmQ6IGJpdEluZGV4QWxsRG9tYWlucyxcclxuICAgICAgICAgICAgX3Jhbmtpbmc6IDAuOTVcclxuICAgICAgICB9LCBvTW9kZWwuc2VlblJ1bGVzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICApLnRoZW4oICgpPT5cclxuICAgICAgICByZWFkRmlsbGVycyhtb2RlbEhhbmRsZS5zcmNIYW5kbGUsIG9Nb2RlbClcclxuICAgICkudGhlbiggKCkgPT5cclxuICAgICAgICByZWFkT3BlcmF0b3JzKG1vZGVsSGFuZGxlLnNyY0hhbmRsZSwgb01vZGVsKVxyXG4gICAgKS50aGVuKCAoKSA9PiB7XHJcbiAgICAgICAgLypcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBjYXRlZ29yeTogXCJmaWxsZXJcIixcclxuICAgICAgICAgICAgICB0eXBlOiAxLFxyXG4gICAgICAgICAgICAgIHJlZ2V4cDogL14oKHN0YXJ0KXwoc2hvdyl8KGZyb20pfChpbikpJC9pLFxyXG4gICAgICAgICAgICAgIG1hdGNoZWRTdHJpbmc6IFwiZmlsbGVyXCIsXHJcbiAgICAgICAgICAgICAgX3Jhbmtpbmc6IDAuOVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICovXHJcbiAgICAgICAgZGVidWdsb2coJ3NhdmluZyBkYXRhIHRvICcgKyBtb2RlbFBhdGgpO1xyXG4gICAgICAgIG9Nb2RlbC5tUnVsZXMgPSBvTW9kZWwubVJ1bGVzLnNvcnQoSW5wdXRGaWx0ZXJSdWxlcy5jbXBNUnVsZSk7XHJcbiAgICAgICAgYWRkQ2xvc2VFeGFjdFJhbmdlUnVsZXMob01vZGVsLm1SdWxlcywgb01vZGVsLnNlZW5SdWxlcyk7XHJcbiAgICAgICAgb01vZGVsLm1SdWxlcyA9IG9Nb2RlbC5tUnVsZXMuc29ydChJbnB1dEZpbHRlclJ1bGVzLmNtcE1SdWxlKTtcclxuICAgICAgICBvTW9kZWwubVJ1bGVzLnNvcnQoSW5wdXRGaWx0ZXJSdWxlcy5jbXBNUnVsZSk7XHJcbiAgICAgICAgLy9mcy53cml0ZUZpbGVTeW5jKFwicG9zdF9zb3J0XCIsIEpTT04uc3RyaW5naWZ5KG9Nb2RlbC5tUnVsZXMsdW5kZWZpbmVkLDIpKTtcclxuXHJcbiAgICAgICAgZm9yY2VHQygpO1xyXG4gICAgICAgIG9Nb2RlbC5ydWxlcyA9IHNwbGl0UnVsZXMob01vZGVsLm1SdWxlcyk7XHJcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhcInRlc3QxeC5qc29uXCIsIEpTT04uc3RyaW5naWZ5KG9Nb2RlbC5ydWxlcyx1bmRlZmluZWQsMikpO1xyXG4gICAgICAgIGZvcmNlR0MoKTtcclxuICAgICAgICBkZWxldGUgb01vZGVsLnNlZW5SdWxlcztcclxuICAgICAgICBkZWJ1Z2xvZygnc2F2aW5nJyk7XHJcbiAgICAgICAgZm9yY2VHQygpO1xyXG4gICAgICAgIHZhciBvTW9kZWxTZXIgPSBPYmplY3QuYXNzaWduKHt9LCBvTW9kZWwpO1xyXG4gICAgICAgIG9Nb2RlbFNlci5tb25nb0hhbmRsZSA9IE9iamVjdC5hc3NpZ24oe30sIG9Nb2RlbC5tb25nb0hhbmRsZSk7XHJcbiAgICAgICAgZGVidWdsb2coJ2NyZWF0ZWQgZGlyMSAnICsgbW9kZWxQYXRoKTsgXHJcbiAgICAgICAgZGVsZXRlIG9Nb2RlbFNlci5tb25nb0hhbmRsZS5zcmNIYW5kbGU7XHJcbiAgICAgICAgdHJ5IHtcclxuXHJcbiAgICAgICAgICAgIGFzc3VyZURpckV4aXN0cyhtb2RlbFBhdGgpO1xyXG4gICAgICAgICAgICBkZWJ1Z2xvZygnY3JlYXRlZCBkaXIgJyArIG1vZGVsUGF0aCk7XHJcbiAgICAgICAgICAgIENpcmN1bGFyU2VyLnNhdmUobW9kZWxQYXRoICsgJy9fY2FjaGUuanMnLCBvTW9kZWxTZXIpO1xyXG4gICAgICAgICAgICBmb3JjZUdDKCk7XHJcbiAgICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5BQk9UX0VNQUlMX1VTRVIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibG9hZGVkIG1vZGVscyBieSBjYWxjdWxhdGlvbiBpbiBcIiArIChEYXRlLm5vdygpIC0gdCkgKyBcIiBcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHJlcyA9IG9Nb2RlbDtcclxuICAgICAgICAgICAgLy8gKE9iamVjdCBhcyBhbnkpLmFzc2lnbihtb2RlbEhhbmRsZSwgeyBtb2RlbDogb01vZGVsIH0pIGFzIElNYXRjaC5JTW9kZWxIYW5kbGU7XHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfSBjYXRjaCggZXJyKSB7XHJcbiAgICAgICAgICAgIGRlYnVnbG9nKFwiXCIgKyBlcnIpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZXJyICcgKyBlcnIpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIgKyAnICcgKyBlcnIuc3RhY2spO1xyXG4gICAgICAgICAgICBwcm9jZXNzLnN0ZG91dC5vbignZHJhaW4nLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgtMSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJyAnICsgZXJyICArICcgJyArIGVyci5zdGFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICB9XHJcbiAgICApLmNhdGNoKCAoZXJyKSA9PiB7XHJcbiAgICAgICAgZGVidWdsb2coXCJcIiArIGVycik7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2VyciAnICsgZXJyKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhlcnIgKyAnICcgKyBlcnIuc3RhY2spO1xyXG4gICAgICAgIHByb2Nlc3Muc3Rkb3V0Lm9uKCdkcmFpbicsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBwcm9jZXNzLmV4aXQoLTEpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignICcgKyBlcnIgICsgJyAnICsgZXJyLnN0YWNrKTtcclxuICAgIH0pIGFzIFByb21pc2U8SU1hdGNoLklNb2RlbHM+O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc29ydENhdGVnb3JpZXNCeUltcG9ydGFuY2UobWFwOiB7IFtrZXk6IHN0cmluZ106IElNYXRjaC5JQ2F0ZWdvcnlEZXNjIH0sIGNhdHM6IHN0cmluZ1tdKTogc3RyaW5nW10ge1xyXG4gICAgdmFyIHJlcyA9IGNhdHMuc2xpY2UoMCk7XHJcbiAgICByZXMuc29ydChyYW5rQ2F0ZWdvcnlCeUltcG9ydGFuY2UuYmluZCh1bmRlZmluZWQsIG1hcCkpO1xyXG4gICAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJhbmtDYXRlZ29yeUJ5SW1wb3J0YW5jZShtYXA6IHsgW2tleTogc3RyaW5nXTogSU1hdGNoLklDYXRlZ29yeURlc2MgfSwgY2F0YTogc3RyaW5nLCBjYXRiOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gICAgdmFyIGNhdEFEZXNjID0gbWFwW2NhdGFdO1xyXG4gICAgdmFyIGNhdEJEZXNjID0gbWFwW2NhdGJdO1xyXG4gICAgaWYgKGNhdGEgPT09IGNhdGIpIHtcclxuICAgICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuICAgIC8vIGlmIGEgaXMgYmVmb3JlIGIsIHJldHVybiAtMVxyXG4gICAgaWYgKGNhdEFEZXNjICYmICFjYXRCRGVzYykge1xyXG4gICAgICAgIHJldHVybiAtMTtcclxuICAgIH1cclxuICAgIGlmICghY2F0QURlc2MgJiYgY2F0QkRlc2MpIHtcclxuICAgICAgICByZXR1cm4gKzE7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHByaW9BID0gKGNhdEFEZXNjICYmIGNhdEFEZXNjLmltcG9ydGFuY2UpIHx8IDk5O1xyXG4gICAgdmFyIHByaW9CID0gKGNhdEJEZXNjICYmIGNhdEJEZXNjLmltcG9ydGFuY2UpIHx8IDk5O1xyXG4gICAgLy8gbG93ZXIgcHJpbyBnb2VzIHRvIGZyb250XHJcbiAgICB2YXIgciA9IHByaW9BIC0gcHJpb0I7XHJcbiAgICBpZiAocikge1xyXG4gICAgICAgIHJldHVybiByO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNhdGEubG9jYWxlQ29tcGFyZShjYXRiKTtcclxufVxyXG5cclxuY29uc3QgTWV0YUYgPSBNZXRhLmdldE1ldGFGYWN0b3J5KCk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3BlcmF0b3IobWRsOiBJTWF0Y2guSU1vZGVscywgb3BlcmF0b3I6IHN0cmluZyk6IElNYXRjaC5JT3BlcmF0b3Ige1xyXG4gICAgcmV0dXJuIG1kbC5vcGVyYXRvcnNbb3BlcmF0b3JdO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVzdWx0QXNBcnJheShtZGw6IElNYXRjaC5JTW9kZWxzLCBhOiBNZXRhLklNZXRhLCByZWw6IE1ldGEuSU1ldGEpOiBNZXRhLklNZXRhW10ge1xyXG4gICAgaWYgKHJlbC50b1R5cGUoKSAhPT0gJ3JlbGF0aW9uJykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImV4cGVjdCByZWxhdGlvbiBhcyAybmQgYXJnXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciByZXMgPSBtZGwubWV0YS50M1thLnRvRnVsbFN0cmluZygpXSAmJlxyXG4gICAgICAgIG1kbC5tZXRhLnQzW2EudG9GdWxsU3RyaW5nKCldW3JlbC50b0Z1bGxTdHJpbmcoKV07XHJcbiAgICBpZiAoIXJlcykge1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhyZXMpLnNvcnQoKS5tYXAoTWV0YUYucGFyc2VJTWV0YSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjaGVja0RvbWFpblByZXNlbnQodGhlTW9kZWw6IElNYXRjaC5JTW9kZWxzLCBkb21haW46IHN0cmluZykge1xyXG4gICAgaWYgKHRoZU1vZGVsLmRvbWFpbnMuaW5kZXhPZihkb21haW4pIDwgMCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRvbWFpbiBcXFwiXCIgKyBkb21haW4gKyBcIlxcXCIgbm90IHBhcnQgb2YgbW9kZWxcIik7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRTaG93VVJJQ2F0ZWdvcmllc0ZvckRvbWFpbih0aGVNb2RlbCA6IElNYXRjaC5JTW9kZWxzLCBkb21haW4gOiBzdHJpbmcpIDogc3RyaW5nW10ge1xyXG4gICAgY2hlY2tEb21haW5QcmVzZW50KHRoZU1vZGVsLCBkb21haW4pO1xyXG4gICAgdmFyIG1vZGVsTmFtZSA9IGdldE1vZGVsTmFtZUZvckRvbWFpbih0aGVNb2RlbC5tb25nb0hhbmRsZSxkb21haW4pO1xyXG4gICAgdmFyIGFsbGNhdHMgPSBnZXRSZXN1bHRBc0FycmF5KHRoZU1vZGVsLCBNZXRhRi5Eb21haW4oZG9tYWluKSwgTWV0YUYuUmVsYXRpb24oTWV0YS5SRUxBVElPTl9oYXNDYXRlZ29yeSkpO1xyXG4gICAgdmFyIGRvYyA9IHRoZU1vZGVsLm1vbmdvSGFuZGxlLm1vZGVsRG9jc1ttb2RlbE5hbWVdO1xyXG4gICAgdmFyIHJlcyA9IGRvYy5fY2F0ZWdvcmllcy5maWx0ZXIoIGNhdCA9PiBjYXQuc2hvd1VSSSApLm1hcChjYXQgPT4gY2F0LmNhdGVnb3J5KTtcclxuICAgIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRTaG93VVJJUmFua0NhdGVnb3JpZXNGb3JEb21haW4odGhlTW9kZWwgOiBJTWF0Y2guSU1vZGVscywgZG9tYWluIDogc3RyaW5nKSA6IHN0cmluZ1tdIHtcclxuICAgIGNoZWNrRG9tYWluUHJlc2VudCh0aGVNb2RlbCwgZG9tYWluKTtcclxuICAgIHZhciBtb2RlbE5hbWUgPSBnZXRNb2RlbE5hbWVGb3JEb21haW4odGhlTW9kZWwubW9uZ29IYW5kbGUsZG9tYWluKTtcclxuICAgIHZhciBhbGxjYXRzID0gZ2V0UmVzdWx0QXNBcnJheSh0aGVNb2RlbCwgTWV0YUYuRG9tYWluKGRvbWFpbiksIE1ldGFGLlJlbGF0aW9uKE1ldGEuUkVMQVRJT05faGFzQ2F0ZWdvcnkpKTtcclxuICAgIHZhciBkb2MgPSB0aGVNb2RlbC5tb25nb0hhbmRsZS5tb2RlbERvY3NbbW9kZWxOYW1lXTtcclxuICAgIHZhciByZXMgPSBkb2MuX2NhdGVnb3JpZXMuZmlsdGVyKCBjYXQgPT4gY2F0LnNob3dVUklSYW5rICkubWFwKGNhdCA9PiBjYXQuY2F0ZWdvcnkpO1xyXG4gICAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldENhdGVnb3JpZXNGb3JEb21haW4odGhlTW9kZWw6IElNYXRjaC5JTW9kZWxzLCBkb21haW46IHN0cmluZyk6IHN0cmluZ1tdIHtcclxuICAgIGNoZWNrRG9tYWluUHJlc2VudCh0aGVNb2RlbCwgZG9tYWluKTtcclxuICAgIHZhciByZXMgPSBnZXRSZXN1bHRBc0FycmF5KHRoZU1vZGVsLCBNZXRhRi5Eb21haW4oZG9tYWluKSwgTWV0YUYuUmVsYXRpb24oTWV0YS5SRUxBVElPTl9oYXNDYXRlZ29yeSkpO1xyXG4gICAgcmV0dXJuIE1ldGEuZ2V0U3RyaW5nQXJyYXkocmVzKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFRhYmxlQ29sdW1ucyh0aGVNb2RlbDogSU1hdGNoLklNb2RlbHMsIGRvbWFpbjogc3RyaW5nKTogc3RyaW5nW10ge1xyXG4gICAgY2hlY2tEb21haW5QcmVzZW50KHRoZU1vZGVsLCBkb21haW4pO1xyXG4gICAgcmV0dXJuIHRoZU1vZGVsLnJhd01vZGVsc1tkb21haW5dLmNvbHVtbnMuc2xpY2UoMCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZvcmNlR0MoKSB7XHJcbiAgICBpZiAoZ2xvYmFsICYmIGdsb2JhbC5nYykge1xyXG4gICAgICAgIGdsb2JhbC5nYygpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogUmV0dXJuIGFsbCBjYXRlZ29yaWVzIG9mIGEgZG9tYWluIHdoaWNoIGNhbiBhcHBlYXIgb24gYSB3b3JkLFxyXG4gKiB0aGVzZSBhcmUgdHlwaWNhbGx5IHRoZSB3b3JkaW5kZXggZG9tYWlucyArIGVudHJpZXMgZ2VuZXJhdGVkIGJ5IGdlbmVyaWMgcnVsZXNcclxuICpcclxuICogVGhlIGN1cnJlbnQgaW1wbGVtZW50YXRpb24gaXMgYSBzaW1wbGlmaWNhdGlvblxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFBvdGVudGlhbFdvcmRDYXRlZ29yaWVzRm9yRG9tYWluKHRoZU1vZGVsOiBJTWF0Y2guSU1vZGVscywgZG9tYWluOiBzdHJpbmcpOiBzdHJpbmdbXSB7XHJcbiAgICAvLyB0aGlzIGlzIGEgc2ltcGxpZmllZCB2ZXJzaW9uXHJcbiAgICByZXR1cm4gZ2V0Q2F0ZWdvcmllc0ZvckRvbWFpbih0aGVNb2RlbCwgZG9tYWluKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldERvbWFpbnNGb3JDYXRlZ29yeSh0aGVNb2RlbDogSU1hdGNoLklNb2RlbHMsIGNhdGVnb3J5OiBzdHJpbmcpOiBzdHJpbmdbXSB7XHJcbiAgICBpZiAodGhlTW9kZWwuY2F0ZWdvcnkuaW5kZXhPZihjYXRlZ29yeSkgPCAwKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2F0ZWdvcnkgXFxcIlwiICsgY2F0ZWdvcnkgKyBcIlxcXCIgbm90IHBhcnQgb2YgbW9kZWxcIik7XHJcbiAgICB9XHJcbiAgICB2YXIgcmVzID0gZ2V0UmVzdWx0QXNBcnJheSh0aGVNb2RlbCwgTWV0YUYuQ2F0ZWdvcnkoY2F0ZWdvcnkpLCBNZXRhRi5SZWxhdGlvbihNZXRhLlJFTEFUSU9OX2lzQ2F0ZWdvcnlPZikpO1xyXG4gICAgcmV0dXJuIE1ldGEuZ2V0U3RyaW5nQXJyYXkocmVzKTtcclxufVxyXG5cclxuLypcclxuZXhwb3J0IGZ1bmN0aW9uIGdldEFsbFJlY29yZENhdGVnb3JpZXNGb3JUYXJnZXRDYXRlZ29yeShtb2RlbDogSU1hdGNoLklNb2RlbHMsIGNhdGVnb3J5OiBzdHJpbmcsIHdvcmRzb25seTogYm9vbGVhbik6IHsgW2tleTogc3RyaW5nXTogYm9vbGVhbiB9IHtcclxuICAgIHZhciByZXMgPSB7fTtcclxuICAgIC8vXHJcbiAgICB2YXIgZm4gPSB3b3Jkc29ubHkgPyBnZXRQb3RlbnRpYWxXb3JkQ2F0ZWdvcmllc0ZvckRvbWFpbiA6IGdldENhdGVnb3JpZXNGb3JEb21haW47XHJcbiAgICB2YXIgZG9tYWlucyA9IGdldERvbWFpbnNGb3JDYXRlZ29yeShtb2RlbCwgY2F0ZWdvcnkpO1xyXG4gICAgZG9tYWlucy5mb3JFYWNoKGZ1bmN0aW9uIChkb21haW4pIHtcclxuICAgICAgICBmbihtb2RlbCwgZG9tYWluKS5mb3JFYWNoKGZ1bmN0aW9uICh3b3JkY2F0KSB7XHJcbiAgICAgICAgICAgIHJlc1t3b3JkY2F0XSA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICAgIE9iamVjdC5mcmVlemUocmVzKTtcclxuICAgIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxSZWNvcmRDYXRlZ29yaWVzRm9yVGFyZ2V0Q2F0ZWdvcmllcyhtb2RlbDogSU1hdGNoLklNb2RlbHMsIGNhdGVnb3JpZXM6IHN0cmluZ1tdLCB3b3Jkc29ubHk6IGJvb2xlYW4pOiB7IFtrZXk6IHN0cmluZ106IGJvb2xlYW4gfSB7XHJcbiAgICB2YXIgcmVzID0ge307XHJcbiAgICAvL1xyXG4gICAgdmFyIGZuID0gd29yZHNvbmx5ID8gZ2V0UG90ZW50aWFsV29yZENhdGVnb3JpZXNGb3JEb21haW4gOiBnZXRDYXRlZ29yaWVzRm9yRG9tYWluO1xyXG4gICAgdmFyIGRvbWFpbnMgPSB1bmRlZmluZWQ7XHJcbiAgICBjYXRlZ29yaWVzLmZvckVhY2goZnVuY3Rpb24gKGNhdGVnb3J5KSB7XHJcbiAgICAgICAgdmFyIGNhdGRvbWFpbnMgPSBnZXREb21haW5zRm9yQ2F0ZWdvcnkobW9kZWwsIGNhdGVnb3J5KVxyXG4gICAgICAgIGlmICghZG9tYWlucykge1xyXG4gICAgICAgICAgICBkb21haW5zID0gY2F0ZG9tYWlucztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBkb21haW5zID0gXy5pbnRlcnNlY3Rpb24oZG9tYWlucywgY2F0ZG9tYWlucyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBpZiAoZG9tYWlucy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NhdGVnb3JpZXMgJyArIFV0aWxzLmxpc3RUb1F1b3RlZENvbW1hQW5kKGNhdGVnb3JpZXMpICsgJyBoYXZlIG5vIGNvbW1vbiBkb21haW4uJylcclxuICAgIH1cclxuICAgIGRvbWFpbnMuZm9yRWFjaChmdW5jdGlvbiAoZG9tYWluKSB7XHJcbiAgICAgICAgZm4obW9kZWwsIGRvbWFpbikuZm9yRWFjaChmdW5jdGlvbiAod29yZGNhdCkge1xyXG4gICAgICAgICAgICByZXNbd29yZGNhdF0gPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICBPYmplY3QuZnJlZXplKHJlcyk7XHJcbiAgICByZXR1cm4gcmVzO1xyXG59XHJcbiovXHJcblxyXG4vKipcclxuICogZ2l2ZW5hICBzZXQgIG9mIGNhdGVnb3JpZXMsIHJldHVybiBhIHN0cnVjdHVyZVxyXG4gKlxyXG4gKlxyXG4gKiB7IGRvbWFpbnMgOiBbXCJET01BSU4xXCIsIFwiRE9NQUlOMlwiXSxcclxuICogICBjYXRlZ29yeVNldCA6IHsgICBjYXQxIDogdHJ1ZSwgY2F0MiA6IHRydWUsIC4uLn1cclxuICogfVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldERvbWFpbkNhdGVnb3J5RmlsdGVyRm9yVGFyZ2V0Q2F0ZWdvcmllcyhtb2RlbDogSU1hdGNoLklNb2RlbHMsIGNhdGVnb3JpZXM6IHN0cmluZ1tdLCB3b3Jkc29ubHk6IGJvb2xlYW4pOiBJTWF0Y2guSURvbWFpbkNhdGVnb3J5RmlsdGVyIHtcclxuICAgIHZhciByZXMgPSB7fTtcclxuICAgIC8vXHJcbiAgICB2YXIgZm4gPSB3b3Jkc29ubHkgPyBnZXRQb3RlbnRpYWxXb3JkQ2F0ZWdvcmllc0ZvckRvbWFpbiA6IGdldENhdGVnb3JpZXNGb3JEb21haW47XHJcbiAgICB2YXIgZG9tYWlucyA9IHVuZGVmaW5lZCBhcyBzdHJpbmdbXTtcclxuICAgIGNhdGVnb3JpZXMuZm9yRWFjaChmdW5jdGlvbiAoY2F0ZWdvcnkpIHtcclxuICAgICAgICB2YXIgY2F0ZG9tYWlucyA9IGdldERvbWFpbnNGb3JDYXRlZ29yeShtb2RlbCwgY2F0ZWdvcnkpXHJcbiAgICAgICAgaWYgKCFkb21haW5zKSB7XHJcbiAgICAgICAgICAgIGRvbWFpbnMgPSBjYXRkb21haW5zO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGRvbWFpbnMgPSBfLmludGVyc2VjdGlvbihkb21haW5zLCBjYXRkb21haW5zKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIGlmIChkb21haW5zLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2F0ZWdvcmllcyAnICsgVXRpbHMubGlzdFRvUXVvdGVkQ29tbWFBbmQoY2F0ZWdvcmllcykgKyAnIGhhdmUgbm8gY29tbW9uIGRvbWFpbi4nKVxyXG4gICAgfVxyXG4gICAgZG9tYWlucy5mb3JFYWNoKGZ1bmN0aW9uIChkb21haW4pIHtcclxuICAgICAgICBmbihtb2RlbCwgZG9tYWluKS5mb3JFYWNoKGZ1bmN0aW9uICh3b3JkY2F0KSB7XHJcbiAgICAgICAgICAgIHJlc1t3b3JkY2F0XSA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICAgIE9iamVjdC5mcmVlemUocmVzKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZG9tYWluczogZG9tYWlucyxcclxuICAgICAgICBjYXRlZ29yeVNldDogcmVzXHJcbiAgICB9O1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldERvbWFpbkNhdGVnb3J5RmlsdGVyRm9yVGFyZ2V0Q2F0ZWdvcnkobW9kZWw6IElNYXRjaC5JTW9kZWxzLCBjYXRlZ29yeTogc3RyaW5nLCB3b3Jkc29ubHk6IGJvb2xlYW4pOiBJTWF0Y2guSURvbWFpbkNhdGVnb3J5RmlsdGVyIHtcclxuICAgIHJldHVybiBnZXREb21haW5DYXRlZ29yeUZpbHRlckZvclRhcmdldENhdGVnb3JpZXMobW9kZWwsIFtjYXRlZ29yeV0sIHdvcmRzb25seSk7XHJcbn1cclxuXHJcblxyXG4iXX0=
