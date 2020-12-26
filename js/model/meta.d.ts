/**
 * Functionality managing the match models
 *
 * @file
 */
export interface IMeta {
    toName(): string;
    toType(): string;
    toFullString(): string;
}
export declare class AMeta implements IMeta {
    name: string;
    type: string;
    constructor(type: string, name: string);
    toName(): string;
    toFullString(): string;
    toType(): string;
}
export interface Meta {
    parseIMeta: (string: any) => IMeta;
    Domain: (string: any) => IMeta;
    Category: (string: any) => IMeta;
    Relation: (string: any) => IMeta;
}
export declare function getStringArray(arr: IMeta[]): string[];
export declare const RELATION_hasCategory = "hasCategory";
export declare const RELATION_isCategoryOf = "isCategoryOf";
export declare function getMetaFactory(): Meta;
