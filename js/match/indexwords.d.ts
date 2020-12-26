import * as IMatch from './ifmatch';
export declare function mockPG(pg: any): void;
export declare function insertWord(dburl: string, lowercaseword: string, matchedstring: string, category: string, callback: (err: Error, res?: boolean) => void): void;
export declare function dumpWords(dburl: string, model: IMatch.IModels): void;
