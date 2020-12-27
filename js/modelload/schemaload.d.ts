/**
 * Functionality managing the match models
 *
 * @file
 */
import * as IMatch from '../match/ifmatch';
import { ISrcHandle, IPseudoSchema, IPseudoModel } from '../model/srchandle';
export declare function cmpTools(a: IMatch.ITool, b: IMatch.ITool): number;
declare type IModelDoc = IMatch.IModelDoc;
export declare function loadModelNames(modelPath: string): string[];
export interface IRawSchema {
    props: any[];
    index: any;
}
export interface IExtendedSchema extends IRawSchema {
    domain: string;
    modelname: string;
}
export declare function mapType(val: string): any;
export declare function replaceIfTypeDeleteM(obj: any, val: any, key: string): void;
export declare function typeProps(a: any): any;
export declare function loadExtendedMongooseSchema(modelPath: string, modelName: string): IExtendedSchema;
export declare function loadModelDoc(modelPath: string, modelName: string): IModelDoc;
export interface IModelRec {
    collectionName: string;
    model: IPseudoModel;
    schema: IPseudoSchema;
}
export declare function augmentMongooseSchema(modelDoc: IModelDoc, schemaRaw: IRawSchema): IExtendedSchema;
/**
 * returns a srcHandle collection name
 * @param modelName
 */
export declare function makeMongoCollectionName(modelName: string): string;
export declare function getFillersFromDB(srcHandle: ISrcHandle): Promise<string[]>;
export declare function getOperatorsFromDB(srcHandle: ISrcHandle): Promise<any>;
export declare function getExtendSchemaDocFromDB(srcHandle: ISrcHandle, modelName: string): Promise<IExtendedSchema>;
export declare function getModelDocFromDB(srcHandle: ISrcHandle, modelName: string): Promise<IModelDoc>;
export declare const MongoNLQ: {
    MODELNAME_METAMODELS: string;
    COLL_METAMODELS: string;
};
export declare const MongooseNLQ: {
    MONGOOSE_MODELNAME_METAMODELS: string;
};
export {};
