/**
 * @file
 * @module jfseb.mgnlq_model.breakdown
 * @copyright (c) 2016 Gerd Forstmann
 */
import * as IMatch from './ifmatch';
export declare function cleanseString(sString: string): string;
export declare function cleanseStringLeaveDots(sString: string): string;
export declare function cleanseQuotedString(sString: string): string;
export declare function trimQuoted(sString: string): string;
export declare function trimQuotedSpaced(sString: string): string;
export declare function recombineQuoted(aArr: Array<string>): Array<string>;
export declare function isQuoted(sString: any): boolean;
export declare function countSpaces(sString: string): number;
export interface ITokenizedString {
    tokens: string[];
    fusable: boolean[];
}
export declare function swallowQuote(str: string, i: number): {
    token: string;
    nextpos: number;
};
export declare function swallowWord(str: string, i: number): {
    token: string;
    nextpos: number;
};
/**
 * Returns true iff tokenized represents multiple words, which
 * can potenially be added together;
 */
export declare function isCombinableSplit(tokenized: ITokenizedString): boolean;
/**
 * return true iff  range @ index is a suitable combinable overlap
 *
 * (typically in the parsed real string)
 * return the targetindex or -1 if impossible
 */
export declare function isCombinableRangeReturnIndex(range: IMatch.IRange, fusable: boolean[], index: number): number;
export declare function combineTokens(range: IMatch.IRange, index: number, tokens: string[]): string;
/**
 *
 * Note: this tokenizer recognized .gitigore or .a.b.c as one token
 * trailing . is stripped!
 *@param {string} sString , e.g. "a,b c;d O'Hara and "murph'ys"
 *@return {Array<String>} broken down array, e.g.
 * [["a b c"], ["a", "b c"], ["a b", "c"], ....["a", "b", "c"]]
 */
export declare function tokenizeString(sString: string, spacesLimit?: number): ITokenizedString;
export declare function makeMatchPattern(str: string): {
    longestToken: string;
    span: {
        low: number;
        high: number;
    };
};
/**
 *@param {string} sString , e.g. "a b c"
 *@return {Array<Array<String>>} broken down array, e.g.
 *[["a b c"], ["a", "b c"], ["a b", "c"], ....["a", "b", "c"]]
 */
export declare function breakdownString(sString: string, spacesLimit?: number): Array<Array<String>>;
