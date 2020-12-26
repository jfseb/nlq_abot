import { IFModel as IFModel } from '../model/index_model';
import * as IFMatch from './iferbase';
import * as IMatch from './iferbase';
export declare function mockDebug(o: any): void;
/**
 * @param sText {string} the text to match to NavTargetResolution
 * @param sText2 {string} the query text, e.g. NavTarget
 *
 * @return the distance, note that is is *not* symmetric!
 */
export declare function calcDistance(sText1: string, sText2: string): number;
export interface ICntRec {
}
export interface IMatchOptions {
    matchothers?: boolean;
    augment?: boolean;
    override?: boolean;
}
export declare function levenPenalty(i: number): number;
export declare function countAinB(oA: any, oB: any, fnCompare: any, aKeyIgnore?: any): number;
export declare function spuriousAnotInB(oA: any, oB: any, aKeyIgnore?: any): number;
export declare function compareContext(oA: any, oB: any, aKeyIgnore?: any): {
    equal: number;
    different: number;
    spuriousL: number;
    spuriousR: number;
};
export declare function cmpByResult(a: IFMatch.ICategorizedStringRanged, b: IFMatch.ICategorizedStringRanged): number;
export declare function cmpByResultThenRank(a: IFMatch.ICategorizedStringRanged, b: IFMatch.ICategorizedStringRanged): number;
export declare function checkOneRule(string: string, lcString: string, exact: boolean, res: Array<IFMatch.ICategorizedString>, oRule: IFModel.mRule, cntRec?: ICntRec): void;
export declare function checkOneRuleWithOffset(string: string, lcString: string, exact: boolean, res: Array<IMatch.ICategorizedStringRanged>, oRule: IFModel.mRule, cntRec?: ICntRec): void;
export declare function categorizeSingleWordWithOffset(word: string, lcword: string, exact: boolean, oRules: Array<IFModel.mRule>, cntRec?: ICntRec): Array<IFMatch.ICategorizedStringRanged>;
export declare function dropLowerRankedEqualResult(res: Array<IFMatch.ICategorizedStringRanged>): Array<IFMatch.ICategorizedStringRanged>;
export declare function postFilterWithOffset(res: Array<IFMatch.ICategorizedStringRanged>): Array<IFMatch.ICategorizedStringRanged>;
export declare function categorizeWordInternalWithOffsets(word: string, lcword: string, exact: boolean, rules: IMatch.SplitRules, cntRec?: ICntRec): Array<IFMatch.ICategorizedStringRanged>;
/**
 *
 * Options may be {
 * matchothers : true,  => only rules where all others match are considered
 * augment : true,
 * override : true }  =>
 *
 */
export declare function matchWord(oRule: IFModel.IRule, context: IFMatch.context, options?: IMatchOptions): any;
export declare function extractArgsMap(match: Array<string>, argsMap: {
    [key: number]: string;
}): IFMatch.context;
export declare const RankWord: {
    hasAbove: (lst: Array<IFMatch.ICategorizedString>, border: number) => boolean;
    takeFirstN: <T extends IFMatch.ICategorizedString>(lst: T[], n: number) => T[];
    takeAbove: <T_1 extends IFMatch.ICategorizedString>(lst: T_1[], border: number) => T_1[];
};
export declare function categorizeWordWithOffsetWithRankCutoff(sWordGroup: string, splitRules: IMatch.SplitRules, cntRec?: ICntRec): Array<IFMatch.ICategorizedStringRanged>;
export declare function categorizeWordWithOffsetWithRankCutoffSingle(word: string, rule: IFModel.mRule): IFMatch.ICategorizedStringRanged;
export declare function categorizeAWord(sWordGroup: string, rules: IMatch.SplitRules, sentence: string, words: {
    [key: string]: Array<IFMatch.ICategorizedString>;
}, cntRec?: ICntRec): IMatch.ICategorizedStringRanged[];
/**
 * Given a  string, break it down into components,
 * [['A', 'B'], ['A B']]
 *
 * then categorizeWords
 * returning
 *
 * [ [[ { category: 'systemId', word : 'A'},
 *      { category: 'otherthing', word : 'A'}
 *    ],
 *    // result of B
 *    [ { category: 'systemId', word : 'B'},
 *      { category: 'otherthing', word : 'A'}
 *      { category: 'anothertryp', word : 'B'}
 *    ]
 *   ],
 * ]]]
 *
 *
 *
 */
/**
 * This is the main entry point for word categorization,
 * If sentence is supplied it will be used
 * @param sWordGroup a single word, g.e. "earth" or a combination "UI5 Component"
 *  The word will *not* be broken down here, but diretyl matched against  rules
 * @param rules rule index
 * @param sentence optional, only for debugging
 * @param words
 * @param cntRec
 */
export declare function categorizeAWordWithOffsets(sWordGroup: string, rules: IMatch.SplitRules, sentence: string, words: {
    [key: string]: Array<IFMatch.ICategorizedString>;
}, cntRec?: ICntRec): IMatch.ICategorizedStringRanged[];
export declare function expandMatchArr(deep: Array<Array<any>>): Array<Array<any>>;
/**
 * Calculate a weight factor for a given distance and
 * category
 * @param {integer} dist distance in words
 * @param {string} category category to use
 * @returns {number} a distance factor >= 1
 *  1.0 for no effect
 */
export declare function reinforceDistWeight(dist: number, category: string): number;
/**
 * Given a sentence, extact categories
 */
export declare function extractCategoryMap(oSentence: Array<IFMatch.IWord>): {
    [key: string]: Array<{
        pos: number;
    }>;
};
export declare function reinForceSentence(oSentence: any): any;
export declare function reinForce(aCategorizedArray: any): any;
export declare function matchRegExp(oRule: IFModel.IRule, context: IFMatch.context, options?: IMatchOptions): any;
export declare function sortByWeight(sKey: string, oContextA: IFMatch.context, oContextB: IFMatch.context): number;
export declare function augmentContext1(context: IFMatch.context, oRules: Array<IFModel.IRule>, options: IMatchOptions): Array<IFMatch.context>;
export declare function augmentContext(context: IFMatch.context, aRules: Array<IFModel.IRule>): Array<IFMatch.context>;
