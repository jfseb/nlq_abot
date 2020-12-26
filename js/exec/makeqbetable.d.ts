/**
 * maketable.ts
 *
 * @file
 * @copyright (c) 2016 Gerd Forstmann
 */
import * as IMatch from '../match/ifmatch';
export declare function makeTable(categories: string[], theModel: IMatch.IModels): {
    text: string;
    action: {
        url?: string;
    };
};
