/**
 * Functionality to load data into a srcHandle model
 * (c) gerd forstmann 2017
 *
 * @file
 */
import * as IMatch from '../match/ifmatch';
import * as srcHandle from 'srcHandle';
/**
 * the model path, may be controlled via environment variable
 */
export declare function cmpTools(a: IMatch.ITool, b: IMatch.ITool): number;
/**
 * Create Database (currently does not drop database before!)
 * @param srcHandle {ISrcHandle} srcHandle instance ( or mock for testing)
 * @param mongoConnectionString {string}  connectionstring, method will connect and disconnect
 * (currenlty disconnnect only on success, subject to change)
 * @param modelPath {string} modepath to read data from
 */
export declare function createDB(srcHandle: ISrcHandle, mongoConnectionString: string, modelPath: string): Promise<any>;
export declare function getModel(srcHandle: any, modelName: string, modelPath: string): Promise<IPseudoModel>;
export declare function loadModelData(srcHandle: any, modelPath: string, modelName: string): Promise<void>;
