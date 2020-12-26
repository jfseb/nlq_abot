/**
 *
 * @module jfseb.fdevstart.explain
 * @file explain.ts
 * @copyright (c) 2016 Gerd Forstmann
 *
 * Functions dealing with explaining facts, categories etc.
 */
import * as IMatch from './ifmatch';
import { IFModel } from '../model/index_model';
export declare function isSynonymFor(exactWord: string, sloppyWord: string, theModel: IMatch.IModels): boolean;
export declare function sloppyOrExact(exactWord: string, sloppyWord: string, theModel: IMatch.IModels): string;
interface IDescribeCategory {
    totalrecords: number;
    presentrecords: number;
    values: {
        [key: string]: number;
    };
    multivalued: boolean;
}
export declare function countRecordPresence(category: string, domain: string, theModel: IMatch.IModels): Promise<IDescribeCategory>;
export declare function makeValuesListString(realvalues: string[]): string;
export declare function toPercent(a: number, b: number): string;
export interface ICategoryStats {
    categoryDesc: IFModel.ICategoryDesc;
    presentRecords: number;
    distinct: string;
    delta: string;
    percPresent: string;
    sampleValues: string;
}
export declare function getCategoryStatsInDomain(category: string, filterdomain: string, theModel: IMatch.IModels): Promise<ICategoryStats>;
export declare function describeCategoryInDomain(category: string, filterdomain: string, theModel: IMatch.IModels): Promise<string>;
export declare function findRecordsWithFact(matchedString: string, category: string, records: any, domains: {
    [key: string]: number;
}): any[];
export declare function increment(map: {
    [key: string]: number;
}, key: string): void;
export declare function describeDomain(fact: string, domain: string, theModel: IMatch.IModels): Promise<string>;
export declare function describeFactInDomain(fact: string, filterdomain: string, theModel: IMatch.IModels): Promise<string>;
export declare function describeCategory(category: string, filterDomain: string, model: IMatch.IModels, message: string): Promise<string[]>;
export {};
