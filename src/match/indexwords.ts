
import * as IMatch from './ifmatch';
import * as debug from 'debug';

const debuglog = debug('indexwords');

export function mockPG(pg: any) {
}

var columns = ['lowercaseword', 'matchedstring', 'category'];
export function insertWord(dburl : string,lowercaseword : string, matchedstring : string, category: string, callback : (err: Error, res? : boolean) => void ) {
  callback(null, true);
}


export function dumpWords(dburl : string,  model: IMatch.IModels) {
  // move
  model.mRules.forEach(function(mRule) {
    if(mRule.type === IMatch.EnumRuleType.WORD) {
      insertWord(dburl, mRule.lowercaseword, mRule.matchedString, mRule.category, function() {});
    }
  });

}