/**
 *
 * @module jfseb.fdevstart.analyze
 * @file analyze.ts
 * @copyright (c) 2016 Gerd Forstmann
 */
import * as IMatch from './ifmatch';
export declare function projectResultToStringArray(answer: IMatch.IWhatIsTupelAnswer, result: MongoQ.IResultRecord): string[];
export declare function projectResultsToStringArray(answer: IMatch.IWhatIsTupelAnswer): string[][];
export declare function projectFullResultsToFlatStringArray(answers: IMatch.IWhatIsTupelAnswer[]): string[][];
export declare function analyzeContextString(contextQueryString: string, rules: IMatch.SplitRules): IMatch.IProcessedSentences;
export declare function listAllWithContext(category: string, contextQueryString: string, theModel: IMatch.IModels, domainCategoryFilter?: IMatch.IDomainCategoryFilter): Promise<IMatch.IProcessedWhatIsTupelAnswers>;
import { MongoQ as MongoQ } from '../index_parser';
export declare function listAllShowMe(query: string, theModel: IMatch.IModels): Promise<MongoQ.IProcessedMongoAnswers>;
/**
 * analyze results of a query,
 *
 * Resorting results
 *
 * -> split by domains
 * -> order by significance of sentence, dropping "lees relevant" (e.g. metamodel) answers
 * -> prune
 */
export declare function sortAnwsersByDomains(): void;
export declare function listAllTupelWithContext(categories: string[], contextQueryString: string, theModel: IMatch.IModels, domainCategoryFilter?: IMatch.IDomainCategoryFilter): Promise<IMatch.IProcessedWhatIsTupelAnswers>;
/**
 * Sort string list case insensitive, then remove duplicates retaining
 * "largest" match
 */
export declare function removeCaseDuplicates(arr: string[]): string[];
export declare function getCategoryOpFilterAsDistinctStrings(operator: IMatch.IOperator, fragment: string, category: string, records: Array<IMatch.IRecord>, filterDomain?: string): string[];
export declare function likelyPluralDiff(a: string, pluralOfa: string): boolean;
export declare function joinSortedQuoted(strings: string[]): string;
export declare function formatDistinctFromWhatIfResult(answers: Array<IMatch.IWhatIsTupelAnswer>): string;
export declare function flattenErrors(results: IMatch.IProcessedWhatIsTupelAnswers): any[];
export declare function flattenComplete(r: any[]): any[];
/**
 * return undefined if resutls is not only erroneous
 * @param results
 */
export declare function returnErrorTextIfOnlyError(results: IMatch.IProcessedWhatIsTupelAnswers): string;
export declare function flattenToStringArray(results: Array<IMatch.IWhatIsTupelAnswer>): string[][];
export declare function joinResultsFilterDuplicates(answers: Array<IMatch.IWhatIsTupelAnswer>): string[];
export declare function isOKAnswer(answer: IMatch.ITupelAnswer): boolean;
/**
 *
 * @param answers
 * @return {string[]} an array of strings
 */
export declare function getDistinctOKDomains(answers: IMatch.ITupelAnswer[]): string[];
export declare function hasOKAnswer(answers: IMatch.ITupelAnswers): boolean;
export declare function hasError(answers: IMatch.ITupelAnswers): boolean;
export declare function hasEmptyResult(answers: IMatch.ITupelAnswers): boolean;
/**
 *
 * @param answers
 */
export declare function getOKIfDistinctOKDomains(answers: IMatch.ITupelAnswer[]): string[];
export declare function removeErrorsIfOKAnswers(answers: IMatch.ITupelAnswers): IMatch.ITupelAnswers;
export declare function removeEmptyResults(answers: IMatch.ITupelAnswers): IMatch.ITupelAnswers;
export declare function removeMetamodelResultIfOthers(answers: IMatch.ITupelAnswers): IMatch.ITupelAnswers;
export declare function isSignificantWord(word: IMatch.IWord): boolean;
export declare function isSignificantDifference(actualword: string, matchedWord: string): boolean;
export declare function getQueryString(answ: IMatch.ITupelAnswer): string;
export declare function cmpDomainSentenceRanking(a: IMatch.ITupelAnswer, b: IMatch.ITupelAnswer): number;
export declare function retainOnlyTopRankedPerDomain(answers: IMatch.ITupelAnswers): IMatch.ITupelAnswers;
export declare function resultAsListString(answers: IMatch.ITupelAnswers): string;
/**
 * TODO
 * @param results
 */
export declare function joinResultsTupel(results: Array<IMatch.IWhatIsTupelAnswer>): string[];
export declare function inferDomain(theModel: IMatch.IModels, contextQueryString: string): string;
