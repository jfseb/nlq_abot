/**
 * @file operator
 * @module jfseb.fdevstart.operator
 * @copyright (c) Gerd Forstmann
 *
 * Operator implementation
 *
 * These functions expose parf the underlying model,
 *
 */
import * as IMatch from './ifmatch';
/**
 * Note: both arguments are expected to be lowercased
 */
export declare function matches(operator: IMatch.IOperator, fragmentLC: string, strLC: string): boolean;
