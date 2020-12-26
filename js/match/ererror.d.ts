/**
 *
 * @module jfseb.fdevstart.analyze
 * @file erbase
 * @copyright (c) 2016 Gerd Forstmann
 *
 * Basic domain based entity recognition
 */
import * as IMatch from './iferbase';
export declare function makeError_NO_KNOWN_WORD(index: number, tokens: string[]): IMatch.IERErrorNO_KNOWN_WORD;
export declare function makeError_EMPTY_INPUT(): IMatch.IERError;
export declare function explainError(errors: IMatch.IERError[]): string;
