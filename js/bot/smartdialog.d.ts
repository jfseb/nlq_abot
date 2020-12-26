/**
 * The bot implementation
 *
 * Instantiate apssing a connector via
 * makeBot
 *
 *
 */
/**
 * @file
 * @module jfseb.mgnlq_abot.smartdialog
 * @copyright (c) 2016-2109 Gerd Forstmann
 */
import * as builder from 'botbuilder';
export declare function restrictData(arr: any[]): any[];
export declare const aResponsesOnTooLong: string[];
export declare const metawordsDescriptions: {
    category: string;
    domain: string;
    key: string;
    tool: string;
    record: string;
    fact: string;
};
export declare class SimpleUpDownRecognizer implements builder.IIntentRecognizer {
    constructor();
    recognize(context: builder.IRecognizeContext, callback: (err: Error, result: builder.IIntentRecognizerResult) => void): void;
}
