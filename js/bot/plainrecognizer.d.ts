/**
 * @copyright (c) 2016 Gerd Forstmann
 * @file plainrecognizer.ts
 *
 * A recognizer parametrized by regex expressions
 */
import * as builder from './botbuilder';
import * as IMatch from '../match/ifmatch';
export declare function recognize(sString: any, mRules: Array<IMatch.IntentRule>): any;
export declare function countParenGroups(s: string): number;
/**
 * given a string, e.g.
 * "who is the <category> of <A1>",
 * @param {string} a
 * @returns {IMatch.IRule} a regexp rule
 */
export declare function parseRuleString(a: string): IMatch.IntentRule;
/**
 * given a string, e.g.
 * "who is the <category> of <A1>",
 * @param {string} a
 * @returns {IMatch.IRule} a regexp rule
 */
export declare function parseRuleArray(a: Array<any>): IMatch.IntentRule;
export declare function parseRule(a: any): IMatch.IntentRule;
export declare function parseRules(oJSON: {
    [key: string]: any;
}): {
    [key: string]: Array<IMatch.IntentRule>;
};
export declare function trimValueAdjusting(value: string): {
    deltaStart: number;
    value: string;
};
export declare function extractArgsMap(s: string, match: Array<string>, argsMap: {
    [key: string]: number;
}): Array<builder.IEntity>;
export declare function matchRegularExpression(text: string, oRule: IMatch.IntentRule): builder.IIntentRecognizerResult;
export declare function trimTrailingSentenceDelimiters(text: string): string;
export declare function normalizeWhitespace(text: string): string;
/**
 * Givena string, replace all "....."  with <word>
 */
export declare function compactQuoted(text: string): string;
export declare function countCompactWords(text: string): number;
export declare function checkForLength(text: any): builder.IIntentRecognizerResult;
export declare function recognizeText(text: string, aRules: Array<IMatch.IntentRule>): builder.IIntentRecognizerResult;
export declare class RegExpRecognizer implements builder.IIntentRecognizer {
    oRules: {
        [key: string]: Array<IMatch.IntentRule>;
    };
    constructor(xRules: {
        [key: string]: Array<IMatch.IntentRule>;
    });
    recognize(context: builder.IRecognizeContext, callback: (err: Error, result: builder.IIntentRecognizerResult) => void): void;
}
