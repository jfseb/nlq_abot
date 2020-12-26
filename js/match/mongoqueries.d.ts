/**
 *
 * @module jfseb.fdevstart.analyze
 * @file analyze.ts
 * @copyright (c) 2016 Gerd Forstmann
 */
import * as IMatch from './ifmatch';
import { MongoQ as MongoQ } from '../index_parser';
export declare function listAll(query: string, theModel: IMatch.IModels): Promise<MongoQ.IProcessedMongoAnswers>;
export declare function listShowMe(query: string, theModel: IMatch.IModels): Promise<MongoQ.IProcessedMongoAnswers>;
