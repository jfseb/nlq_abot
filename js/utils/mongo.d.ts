/**
 * Utiltities for mongo
 */
import { ISrcHandle } from '../model/srchandle';
export declare function openMongoose(srcHandle: ISrcHandle, mongoConnectionString: string): Promise<ISrcHandle>;
export declare function clearModels(srcHandle: any): void;
export declare function disconnectReset(srcHandle: any): void;
export declare function getCollectionNames(srcHandle: any): Promise<String[]>;
