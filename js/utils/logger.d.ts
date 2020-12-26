/**
 * a simple logger utility
 *
 *
 * There are two types of logs ( append and overwrite, default is append)
 */
export declare function logPerf(cons: any, sString: string): void;
export declare function perf(string: any): any;
declare function getFileName(name: string): string;
export declare const _test: {
    getFileName: typeof getFileName;
};
export declare function logger(name: string, flags?: string): (any: any) => void;
export {};
