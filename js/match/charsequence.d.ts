/**
 * @file charsequence
 * @module jfseb.mnglq_er.charsequence
 * @copyright (c) Gerd Forstmann
 *
 * Char sequence specific comparisons
 *
 * Very simple comparisons based on plain strings
 *
 */
export declare const CharSequence: {
    isSameOrPlural: (a: string, b: string) => boolean;
    isVeryClose: (a: string, b: string) => boolean;
    isSameOrPluralOrVeryClose: (a: string, b: string) => boolean;
};
