/**
 * @file word
 * @module jfseb.fdevstart.sentence
 * @copyright (c) Gerd Forstmann
 *
 * Word specific qualifications,
 *
 * These functions expose parf the underlying model,
 * e.g.
 * Match a tool record on a sentence,
 *
 * This will unify matching required and optional category words
 * with the requirements of the tool.
 *
 */
import * as IMatch from './iferbase';
export declare const Category: {
    CAT_CATEGORY: string;
    CAT_DOMAIN: string;
    CAT_OPERATOR: string;
    CAT_FILLER: string;
    CAT_NUMBER: string;
    CAT_TOOL: string;
    CAT_ANY: string;
    _aCatFillers: string[];
    isDomain: (sCategory: string) => boolean;
    isCategory: (sCategory: string) => boolean;
    isFiller: (sCategory: string) => boolean;
};
export declare const Word: {
    isFiller: (word: IMatch.IWord) => boolean;
    isCategory: (word: IMatch.IWord) => boolean;
    isDomain: (word: IMatch.IWord) => boolean;
};
export declare const WordType: {
    CAT_CATEGORY: string;
    CAT_DOMAIN: string;
    CAT_FILLER: string;
    CAT_OPERATOR: string;
    CAT_TOOL: string;
    _aCatFillers: string[];
    isDomain: (sCategory: string) => boolean;
    isCategory: (sCategory: string) => boolean;
    isFiller: (sCategory: string) => boolean;
    fromCategoryString: (sCategory: string) => string;
};
