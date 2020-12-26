import { IModelPath } from "../match/ifmatch";
export interface ISynonym {
    category: string;
    fact: string;
    synonyms: string[];
}
export interface IPseudoModel {
    modelname: string;
    records: any[];
    schema: any;
    aggregateSynonyms(): Promise<ISynonym[]>;
    distinctFlat(modelPath: IModelPath): Promise<string[]>;
    distinct(path: string): Promise<string[]>;
    find(query: any): Promise<any[]>;
    aggregate(query: any): Promise<any[]>;
}
export interface IPseudoSchema {
}
export interface ISrcHandle {
    modelNames(): string[];
    getPath(): string;
    model(a: string, schema?: any): IPseudoModel;
    setModel(modelname: string, data: any, schema: any): any;
    connect(connectionString: string): Promise<ISrcHandle>;
    getJSON(filename: string, modelnames?: string[]): Promise<any>;
    getJSONArr(filename: string): Promise<any[]>;
}
export declare function evalArg(rec: any, arg: any): any[];
export declare function asString(a: any): string;
export declare function compareByType(op: string, l: any, r: any): boolean;
export declare function evalSet(op: string, lhs: any, rhs: any): boolean;
export declare function satisfiesMatch(rec: any, match: any): boolean;
export declare function applyMatch(records: any[], match: any): any[];
export declare function applyProject(records: any[], project: any): any[];
export declare function filterProject(project: any, prefix: string): {};
export declare function wrapArray(a: any): any[];
export declare function copyAllBut(rec: any, removedProperties: string[]): {};
export declare function flattenDeep(rec: any, compact: string[]): any[];
export declare function applyProjectCollecting(res: any[], rec: any, project: any): any[];
export declare function isDeep(a: any): boolean;
export declare function makeKey(a: any): string;
export declare function isAllPropsEmpty(s: string): boolean;
export declare function removeDuplicates(records: any[]): any[];
/**
 * if member of unwind points to an array, expand it.
 * @param records I
 * @param unwind
 * @param any
 */
export declare function applyUnwind(records: any[], unwind: any): any[];
export declare function applySort(records: any[], match: any): any[];
export declare function applyStep(records: any[], queryStep: any): any[];
export declare function filterByQuery(records: any[], query: any): any[];
export declare function createSourceHandle(): ISrcHandle;
