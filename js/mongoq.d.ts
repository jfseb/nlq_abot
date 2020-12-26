/**
 * @file
 * @module jfseb.mgnlq_parser1.mongoq
 * @copyright (c) 2016-2109 Gerd Forstmann
 *
 * database connectivity and querying
 */
import { IFErBase as IFErBase } from './match/er_index';
import { IFModel as IFModel } from './model/index_model';
import * as AST from './ast';
import { ISrcHandle } from './model/srchandle';
export declare function JSONStringify(obj: any): string;
export declare function makeMongoName(s: string): string;
export declare class MongoBridge {
    _model: IFModel.IModels;
    constructor(model: IFModel.IModels);
    mongoooseDomainToDomain(mgdomain: string): string;
}
export declare class ModelHandle {
    _theModel: IFModel.IModels;
    _mgBridge: MongoBridge;
    _mongoose: ISrcHandle;
    constructor(theModel: IFModel.IModels);
    query(domain: string, query: any): Promise<any>;
}
export declare function getDomainForSentenceSafe(theModel: IFModel.IModels, sentence: IFErBase.ISentence): string;
/**
 * given a Sentence, obtain the domain for it
 * @param theModel
 * @param sentence
 */
export declare function getDomainInfoForSentence(theModel: IFModel.IModels, sentence: IFErBase.ISentence): {
    domain: string;
    collectionName: string;
    modelName: string;
};
export interface SRes {
    sentence: IFErBase.ISentence;
    records: any[];
}
export interface QResult {
    domain: string;
    sentence: IFErBase.ISentence;
    columns: string[];
    results: string[][];
}
export interface IResultRecord {
    [key: string]: Number | string;
}
export interface IQueryResult {
    domain: string;
    aux: {
        sentence: IFErBase.ISentence;
        tokens: string[];
        astnode?: AST.ASTNode;
    };
    errors: any;
    /**
     * Columns relevant for output, in "query" / "sentence" order
     */
    columns: string[];
    auxcolumns?: string[];
    results: IResultRecord[];
}
import * as SentenceParser from './sentenceparser';
export interface IQuery {
    domain: string;
    columns: string[];
    auxcolumns?: string[];
    reverseMap: IReverseMap;
    query: any;
}
export interface IPreparedQuery extends SentenceParser.IParsedSentences {
    queries: IQuery[];
}
export declare function makeAggregateFromAst(astnode: AST.ASTNode, sentence: IFModel.IWord[], models: IFModel.IModels, modelname: string, fixedCategories: string[]): {
    query: any[];
    columnsReverseMap: {
        columns: string[];
        reverseMap: {
            [key: string]: string;
        };
    };
};
export declare function makeAggregateFromAstOld(astnode: AST.ASTNode, sentence: IFModel.IWord[], models: IFModel.IModels, collectionName: string, fixedCategories: string[]): {
    query: any[];
    columnsReverseMap: {
        columns: string[];
        reverseMap: {
            [key: string]: string;
        };
    };
};
export declare function containsFixedCategories(theModel: IFModel.IModels, domain: string, fixedCategories: string[]): boolean;
export declare function augmentCategoriesWithURI(fixedCategories: string[], theModel: IFModel.IModels, domain: string): string[];
export declare function prepareQueries(query: string, theModel: IFModel.IModels, fixedCategories: string[], options?: IQueryOptions): IPreparedQuery;
export declare type IProcessedMongoAnswers = IQueryResult[];
export declare function queryWithAuxCategories(query: string, theModel: IFModel.IModels, auxiliary_categories: string[]): Promise<IProcessedMongoAnswers>;
export declare function queryWithURI(query: string, theModel: IFModel.IModels, auxiliary_categories: string[]): Promise<IProcessedMongoAnswers>;
export declare function query(query: string, theModel: IFModel.IModels): Promise<IProcessedMongoAnswers>;
export declare type IReverseMap = {
    [key: string]: string;
};
export declare function remapRecord(rec: any, columns: string[], reverseMap: IReverseMap): IResultRecord;
export declare function projectResultToArray(res: IQueryResult): (string | Number)[][];
export declare function remapResult(res: any, columns: string[], reverseMap: IReverseMap): IResultRecord[];
export interface IQueryOptions {
    showURI: boolean;
}
export declare function queryInternal(querystring: string, theModel: IFModel.IModels, handle: ModelHandle, fixedFields: string[], options?: IQueryOptions): Promise<IProcessedMongoAnswers>;
