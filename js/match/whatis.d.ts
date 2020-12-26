/**
 *
 * @module jfseb.fdevstart.analyze
 * @file analyze.ts
 * @copyright (c) 2016 Gerd Forstmann
 */
import { MongoQ as MongoQ } from '../index_parser';
export declare function mockDebug(o: any): void;
import * as IMatch from './ifmatch';
export declare function localeCompareArrays(aaresult: string[], bbresult: string[]): number;
export declare function localeCompareRecordArrays(aaresult: MongoQ.IResultRecord[], bbresult: MongoQ.IResultRecord[]): number;
export declare function localeCompareRecord(aaresult: MongoQ.IResultRecord, bbresult: MongoQ.IResultRecord): number;
export declare function safeEqual(a: number, b: number): boolean;
export declare function safeDelta(a: number, b: number): number;
export declare function cmpByResultThenRankingTupel(aa: IMatch.IWhatIsTupelAnswer, bb: IMatch.IWhatIsTupelAnswer): number;
export declare function cmpRecords(a: IMatch.IRecord, b: IMatch.IRecord): number;
export declare function dumpNiceTupel(answer: IMatch.IWhatIsTupelAnswer): string;
export declare function analyzeCategory(categoryword: string, rules: IMatch.SplitRules, wholesentence: string): string;
export declare function splitAtCommaAnd(str: string): string[];
/**
 * A simple implementation, splitting at and and ,
 */
export declare function analyzeCategoryMultOnlyAndComma(categorylist: string, rules: IMatch.SplitRules, wholesentence: string): string[];
export declare function filterAcceptingOnly(res: IMatch.ICategorizedString[][], categories: string[]): IMatch.ICategorizedString[][];
export declare function processString(query: string, rules: IMatch.SplitRules): IMatch.IProcessedSentences;
export declare function analyzeContextString(contextQueryString: string, rules: IMatch.SplitRules): IMatch.IProcessedSentences;
export declare function analyzeCategoryMult(categorylist: string, rules: IMatch.SplitRules, wholesentence: string, gWords: {
    [key: string]: IMatch.ICategorizedString[];
}): string[];
export declare function isIndiscriminateResultTupel(results: Array<IMatch.IWhatIsTupelAnswer>): string;
