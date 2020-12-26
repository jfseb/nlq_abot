/**
 * @file algol.ts
 *
 * Constant determining the algorithm
 */
/**
 * Number of sentences which are not used
 */
export declare const Cutoff_Sentences = 120;
export declare const RANKING_EPSILON = 1e-9;
export declare const calcDist: {
    lengthDelta1: number;
};
/**
 * levenshtein distances above this will not be considered valid
 */
export declare const Cutoff_LevenShtein: number;
export declare const Cutoff_WordMatch = 0.935;
export declare const Cutoff_rangeCloseMatch = 0.98;
/**
 * Maximum amount of spaces permitted in a combined word
 *
 * Note that quoted words are never combined, and may exceed this limit,
 * e.g.   A "q u o t e d" entry.
 */
export declare const MaxSpacesPerCombinedWord: number;
/**
 * Weight factor to use on the a given word distance
 * of 0, 1, 2, 3 ....
 */
export declare const aReinforceDistWeight: Array<number>;
/**
 * only the top n words are considered
 */
export declare const Top_N_WordCategorizations = 5;
export declare const DescribeValueListMinCountValueList = 3;
export declare const DescribeValueListLengthCharLimit = 60;
