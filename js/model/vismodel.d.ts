/**
 * visualize a model and calculate some statistics
 */
import * as IMatch from '../match/ifmatch';
interface CategoryRecord {
    otherdomains: string[];
    nrDistinctValues: number;
    nrDistinctValuesInDomain: number;
    nrRecords: number;
    nrRecordsInDomain: number;
    nrTotalRecordsInDomain: number;
}
export declare function JSONEscape(s: string): string;
export declare function makeLunrIndex(modelpath: string, output: string, silent?: boolean): void;
export declare function calcCategoryRecord(m: IMatch.IModels, category: string, domain: string, cache?: any): Promise<CategoryRecord>;
export declare function graphDomain(domain: string, m: IMatch.IModels, domainRecordCache?: any): Promise<string>;
/**
 * generate a textual representation of a domain
 */
export declare function tabDomain(domain: string, m: IMatch.IModels): Promise<string>;
export declare function visModels(m: IMatch.IModels, folderOut: string): Promise<any>;
export declare function tabModels(m: IMatch.IModels, folderOut: string): Promise<any>;
export {};
