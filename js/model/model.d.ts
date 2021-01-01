/**
 * Functionality managing the match models
 *
 * @file
 */
import { IFModel as IFModel } from './index_model';
import { IPseudoModel, ISrcHandle, ISynonym } from './srchandle';
import * as IMatch from '../match/ifmatch';
import * as Meta from './meta';
export declare function cmpTools(a: IMatch.ITool, b: IMatch.ITool): number;
export declare function propagateTypeToModelDoc(modelDoc: IFModel.IModelDoc, eschema: IFModel.IExtendedSchema): void;
export declare function asPromise(a: any): Promise<any>;
export declare function getModelData(srcHandle: ISrcHandle, modelName: string, modelNames: string[]): Promise<any>;
/**
 * returns when all models are loaded and all modeldocs are made
 * @param srcHandle
 */
export declare function getModelHandle(srcHandle: ISrcHandle, modelPath: string): Promise<IMatch.IModelHandleRaw>;
export declare function getFactSynonyms(mongoHandle: IMatch.IModelHandleRaw, modelname: string): Promise<ISynonym[]>;
export declare function getMongoCollectionNameForDomain(theModel: IMatch.IModels, domain: string): string;
export declare function getMongooseModelNameForDomain(theModel: IMatch.IModels, domain: string): string;
export declare function getModelForModelName(theModel: IMatch.IModels, modelname: string): any;
export declare function getModelForDomain(theModel: IMatch.IModels, domain: string): any;
export declare function getModelNameForDomain(handle: IMatch.IModelHandleRaw, domain: string): string;
export declare function getDomainForModelName(models: IMatch.IModels, modelName: string): string;
export declare function filterRemapCategories(mongoMap: IMatch.CatMongoMap, categories: string[], records: any[]): any[];
export declare function filterRemapCategories2(mongoMap: IMatch.CatMongoMap, categories: string[], records: any[]): any[];
export declare function checkModelMongoMap(model: IPseudoModel, modelname: string, mongoMap: IMatch.CatMongoMap, category?: string): any;
/**
 * Unwraps array, retaining the *FIRST* member of an array,
 * note that the result is indexed by { category : member }
 * @param theModel
 * @param domain
 */
export declare function getExpandedRecordsFirst(theModel: IMatch.IModels, domain: string): Promise<{
    [key: string]: any;
}>;
export declare function getExpandedRecordsSome(theModel: IMatch.IModels, domain: string, categories: string[], keepAsArray: string[]): Promise<any[]>;
export declare function getExpandedRecordsForCategory(theModel: IMatch.IModels, domain: string, category: string): Promise<{
    [key: string]: any;
}>;
/**
 *
 * @param mongoHandle
 * @param modelname
 * @param category
 */
export declare function getDistinctValues(mongoHandle: IMatch.IModelHandleRaw, modelname: string, category: string): Promise<string[]>;
export declare function getCategoryRec(mongoHandle: IMatch.IModelHandleRaw, modelname: string, category: string): IMatch.IModelCategoryRec;
export declare function addBestSplit(mRules: Array<IMatch.mRule>, rule: IMatch.mRule, seenRules: {
    [key: string]: IMatch.mRule[];
}): void;
export declare function readFileAsJSON(filename: string): any;
export declare function hasRuleWithFact(mRules: IMatch.mRule[], fact: string, category: string, bitindex: number): boolean;
export declare function loadModel(modelHandle: IMatch.IModelHandleRaw, sModelName: string, oModel: IMatch.IModels): Promise<any>;
export declare function getAllDomainsBitIndex(oModel: IMatch.IModels): number;
export declare function getDomainBitIndex(domain: string, oModel: IMatch.IModels): number;
export declare function getDomainBitIndexSafe(domain: string, oModel: IMatch.IModels): number;
/**
 * Given a bitfield, return an unsorted set of domains matching present bits
 * @param oModel
 * @param bitfield
 */
export declare function getDomainsForBitField(oModel: IMatch.IModels, bitfield: number): string[];
export declare function splitRules(rules: IMatch.mRule[]): IMatch.SplitRules;
export declare function sortFlatRecords(a: any, b: any): number;
export declare function findNextLen(targetLen: number, arr: string[], offsets: number[]): void;
export declare function addRangeRulesUnlessPresent(rules: IMatch.mRule[], lcword: string, rangeRules: IMatch.mRule[], presentRulesForKey: IMatch.mRule[], seenRules: any): void;
export declare function addCloseExactRangeRules(rules: IMatch.mRule[], seenRules: any): void;
export declare function readFillers(srcHandle: ISrcHandle, oModel: IMatch.IModels): Promise<any>;
export declare function readOperators(srcHandle: ISrcHandle, oModel: IMatch.IModels): Promise<any>;
export declare function releaseModel(model: IMatch.IModels): void;
export declare function LoadModels(modelPath: string): Promise<IMatch.IModels>;
/**
 * @deprecated use LoadModels
 * @param srchandle
 * @param modelPath
 */
export declare function loadModelsOpeningConnection(srchandle: ISrcHandle, modelPath?: string): Promise<IMatch.IModels>;
/**
 * @param srcHandle
 * @param modelPath
 */
export declare function loadModels(srcHandle: ISrcHandle, modelPath: string): Promise<IMatch.IModels>;
export declare function _loadModelsFull(modelHandle: IMatch.IModelHandleRaw, modelPath?: string): Promise<IMatch.IModels>;
export declare function sortCategoriesByImportance(map: {
    [key: string]: IMatch.ICategoryDesc;
}, cats: string[]): string[];
export declare function rankCategoryByImportance(map: {
    [key: string]: IMatch.ICategoryDesc;
}, cata: string, catb: string): number;
export declare function getOperator(mdl: IMatch.IModels, operator: string): IMatch.IOperator;
export declare function getResultAsArray(mdl: IMatch.IModels, a: Meta.IMeta, rel: Meta.IMeta): Meta.IMeta[];
export declare function checkDomainPresent(theModel: IMatch.IModels, domain: string): void;
export declare function getShowURICategoriesForDomain(theModel: IMatch.IModels, domain: string): string[];
export declare function getShowURIRankCategoriesForDomain(theModel: IMatch.IModels, domain: string): string[];
export declare function getCategoriesForDomain(theModel: IMatch.IModels, domain: string): string[];
export declare function getTableColumns(theModel: IMatch.IModels, domain: string): string[];
/**
 * Return all categories of a domain which can appear on a word,
 * these are typically the wordindex domains + entries generated by generic rules
 *
 * The current implementation is a simplification
 */
export declare function getPotentialWordCategoriesForDomain(theModel: IMatch.IModels, domain: string): string[];
export declare function getDomainsForCategory(theModel: IMatch.IModels, category: string): string[];
/**
 * givena  set  of categories, return a structure
 *
 *
 * { domains : ["DOMAIN1", "DOMAIN2"],
 *   categorySet : {   cat1 : true, cat2 : true, ...}
 * }
 */
export declare function getDomainCategoryFilterForTargetCategories(model: IMatch.IModels, categories: string[], wordsonly: boolean): IMatch.IDomainCategoryFilter;
export declare function getDomainCategoryFilterForTargetCategory(model: IMatch.IModels, category: string, wordsonly: boolean): IMatch.IDomainCategoryFilter;
