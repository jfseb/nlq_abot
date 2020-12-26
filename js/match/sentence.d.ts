/**
 * @file sentence
 * @module jfseb.fdevstart.sentence
 * @copyright (c) Gerd Forstmann
 *
 * Match a tool record on a sentence,
 *
 * This will unify matching required and optional category words
 * with the requirements of the tool.
 *
 */
import * as IMatch from './iferbase';
export declare function findWordByCategory(oSentence: any, sCategory: string): {
    word: IMatch.IWord;
    index: number;
};
export declare function getDistinctCategoriesInSentence(oSentence: IMatch.ISentence): string[];
export declare function rankingGeometricMean(oSentence: IMatch.ISentence): number;
export declare function rankingProduct(oSentence: IMatch.ISentence): number;
export declare function cmpRankingProduct(a: IMatch.ISentence, b: IMatch.ISentence): number;
export declare function cutoffSentenceAtRatio(sentences: IMatch.ISentence[]): IMatch.ISentence[];
export declare function dumpNice(sentence: IMatch.ISentence, fn?: any): string;
export declare function dumpNiceRuled(sentence: IMatch.ISentence, fn?: any): string;
export declare function dumpNiceBitIndexed(sentence: IMatch.ISentence, fn?: any): string;
export declare function dumpNiceArr(sentences: IMatch.ISentence[], fn?: any): string;
export declare function simplifyStringsWithBitIndex(sentence: IMatch.ISentence): string[];
