

import { IFModel } from '../model/index_model';

import {ISrcHandle as ISrcHandle} from '../model/srchandle';

import { MongoQ as MongoQ } from '../index_parser';

export const enum EnumResponseCode {
  NOMATCH = 0,
  EXEC,
  QUERY
}


export const CAT_CATEGORY = "category";
export const CAT_FILLER = "filler";
export const CAT_TOOL = "tool";


export const ERR_NO_KNOWN_WORD = "NO_KNOWN_WORD";
export const ERR_EMPTY_INPUT = "EMPTY_INPUT";

export interface IERError {
  err_code : string,
  text : string
};

export interface IERErrorNO_KNOWN_WORD extends IERError{
  context : {
    token : string,
    index: number,
    tokens : string[]
  }
};



export interface IPromptDescription {
  description: string,
  type: string,
  pattern: RegExp,
  message: string,
  default: string,
  required: boolean
}

export const aOperatorNames = ["starting with", "ending with",
                          "containing", "excluding", "having", "being"
                          ,"more than","less than" ,"exactly",
                          "<", "<=", "!=", "=", ">", ">=",
                          "order by", "order descending by",
                          "existing", "not existing",
                          "left_paren", "right_paren",
                          "logical_and", "logical_or"
                        ];
export type OperatorName = "starting with" | "ending with"
                        | "containing" | "being" | "excluding" | "having"
                        | "more than" | "less than" | "exactly"
                        | "<" | "<="| "!="| "="| ">"| ">="
                        |"order by"| "order descending by"
                        | "existing"| "not existing"
                        | "left_paren"| "right_paren"
                        | "logical_and" | "logical_or"
                        ;

export const aAnySuccessorOperatorNames = ["starting with", "ending with",
                        "containing", "excluding", "having", "being",
                        "<", "<=", "!=", "=", ">", ">="
                      ];


export interface IOperator {
  operator : OperatorName,
  code : string,
  arity : number,
  argcategory : [ string[] ],
  operatorpos? : number
}

export type IOperators = { [key:string] : IOperator };

export type IRecord = { [key : string] : string };


export interface IWhatIsAnswer {
  sentence: ISentence,
  record : IRecord,
  category : string,
  result: string,
  _ranking : number
}


export interface IProcessedWhatIsAnswers extends IProcessed {
  sentences? : ISentence[],
  answers : IWhatIsAnswer[]
}


export type IProcessedWhatIsTupelAnswers = MongoQ.IProcessedMongoAnswers;
/*
export interface IProcessedWhatIsTupelAnswers extends IProcessed {
  sentences? : ISentence[],
  tupelanswers : Array<IWhatIsTupelAnswer>
}
*/

// WAS ??? 

//export type IProcessedWhatIsTupelAnswers = MongoQ.IProcessedMongoAnswers;
//  sentences? : ISentence[],
//  tupelanswers : Array<IWhatIsTupelAnswer>
//}

export type IWhatIsTupelAnswer = MongoQ.IQueryResult;
export type ITupelAnswer = MongoQ.IQueryResult;
export type ITupelAnswers = MongoQ.IQueryResult[];

/*
export interface IWhatIsTupelAnswer {
  sentence: ISentence,
  record : IRecord,
  categories : string[],
  result: string[],
  _ranking : number
}
*/

export interface IMatchedSetRecord {
  setId : string,
  record : IRecord
};
export type IMatchedSetRecords = IMatchedSetRecord[];
/**
 * Map category -> value
 */
export type IMatchSet = { [key : string] : string};

export const WORDTYPE = {
  FILLER : "I", // in, and,
  FACT : "F",  // a model fact
  TOOL: "T", // a tool name
  META : "M",  // words like category, domain
  CATEGORY : "C", // a category, e.g. BSPName
  DOMAIN : "D", // a domain, e.g. Fiori Bom
  OPERATOR : "O", // containing ,starting with
  NUMERICARG : 'N', // a number
  ANY : "A" //
};

export /*const*/  enum EnumRuleType {
  WORD,
  REGEXP
}

export interface IToolSet {
      set: string[],
      response: string
    };

export type IToolSets = {
    [key: string]: IToolSet
    };
/**
 * @interface ITool
 *
 * var oTool = { 'name' : 'FLPD',
 *   'requires' : { 'systemId' : {}, 'client' :{}},
 *   'optional' : { 'catalog' : {}, 'group' :{}}
 * };
*/
export interface ITool {
  name: string,
  requires: { [key: string]: Object },
  optional?: { [key: string]: Object },
  sets?: IToolSets
}

export interface IToolMatchResult {
  required: { [key: string]: IWord },
  missing: { [key: string]: number },
  optional?: { [key: string]: IWord },
  spurious: { [key: string]: number },
  toolmentioned: IWord[]
}

export interface IPrompt {
  text: string,
  category: string
}

export interface IToolMatch {
  toolmatchresult: IToolMatchResult,
  sentence: ISentence,
  tool: ITool,
  rank: number
}

export interface IWord {
  string: string,
  matchedString: string,
  category: string,
  _ranking?: number,
  levenmatch?: number,
  reinforce?: number,
  bitindex? : number,
  rule? : mRule
}

export type ISentence = Array<IWord>;

export interface IRule {
  type: EnumRuleType,
  key: string,
  word?: string,
  regexp?: RegExp,
  argsMap?: { [key: number]: string }  // a map of regexp match group -> context key
  // e.g. /([a-z0-9]{3,3})CLNT([\d{3,3}])/
  //      { 1 : "systemId", 2 : "client" }
  follows: context
}

export interface IntentRule {
  type: EnumRuleType,
  regexp: RegExp,
  argsMap: { [key: string]: number }  // a map of regexp match group -> context key
  // e.g. /([a-z0-9]{3,3})CLNT([\d{3,3}])/
  //      { 1 : "systemId", 2 : "client" }
  follows?: context
}

export interface IRange {
  low: number, high: number,
};

export interface IWordRange extends IRange
{
  rule? : mRule };
/**
 * A rule matching a single string
 */
export interface mRule {
  type: EnumRuleType,
  word?: string,
  lowercaseword? : string,
  regexp?: RegExp,
  matchedString?: string,
  matchIndex?: number,
  category: string,
  range? :  IWordRange,
  /* categorization */
  wordType: string, // one of WORDTYPE
  bitindex : number, // bitindex indicating domain
  bitSentenceAnd : number, // a bitindex flaglist which has to be nonzero on and

  /**
   * only use an exact match
   */
  exactOnly? : boolean,
  _ranking?: number

}

export interface IWordRules {
  rules : Array<mRule>,
  bitindex: number
}

export interface SplitRules {
  allRules: Array<mRule>,
  nonWordRules : Array<mRule>,
  wordMap: { [key : string] : IWordRules },
  wordCache :  { [key: string]: Array<ICategorizedString> }
};

export interface ICategorizedString {
  string: string,
  matchedString: string,
  category: string,
  breakdown?: Array<any>
  score?: number,
  _ranking?: number,
  levenmatch?: number  // a distance ranking
}

export interface ICategorizedStringRanged extends ICategorizedString{
  string: string,
  matchedString: string,
  category: string,
  breakdown?: Array<any>
  /**
   * Length of the entry (for skipping following words)
   */
  score?: number,
  span? : number,
  rule : mRule,
  _ranking?: number,
  levenmatch?: number  // a distance ranking
}

export interface IProcessed {
  tokens : string[],
  errors? : IERError[]
}

export interface IProcessedSentences extends IProcessed {
  tokens : string[],
  errors? : any,
  sentences : ISentence[]
};

export type ICategoryFilter = { [key: string]: boolean };


export type IDomainCategoryFilter = {
  domains : string[],
  categorySet : { [key: string]: boolean }
}


export interface IProcessedExtractedCategories extends IProcessed {
  categories : string[],
};

export type context = { [key: string]: string };

export const enum EnumActionType {
  STARTURL,
  STARTCMDLINE
}

export interface IAction {
  data: any,
  type: EnumActionType,
  pattern: string,
  concrete: string
}

export interface IRawSchema {
    props: any[],
    index : any
}

export interface QBEColumnProp {
      defaultWidth?: number,
      QBE: boolean,
      LUNRIndex?: boolean,
      QBEInclude? : boolean
}

export const enum IMongooseBaseType {
  Number = "Number",
  String = "String"
};

export type IMongooseTypeDecl = IMongooseBaseType | IMongooseBaseType[];


export interface IModelCategoryRec {
    category : string,
    category_description : string,
    QBEColumnProps : QBEColumnProp,
    category_synonyms: string[],
    wordindex : boolean,
    exactmatch: boolean,
    showURI : boolean,
    showURIRank : boolean,
    type : IMongooseTypeDecl
}

export interface IModelDoc {
    domain : string,
    modelname : string,
    domain_description : string
    _categories : IModelCategoryRec[],
    columns: string[],
    domain_synonyms : string[]
}

export interface IModelPath {
  paths : string[], // individual segments, can be  ["A","[]","B"] , ["A", "B"]  or ["A", "[]"]
  fullpath : string, // the model path as written, e.g. A.B
  shortName : string // the effective property name, "element_name" , 
};

export interface CatMongoMap  { [key: string] : IModelPath };

export interface IExtendedSchema extends IRawSchema{
    domain : string,
    modelname : string
};

export interface ICategoryDesc {
  category: string,
  importance? : number,
  category_description : string,
  iskey? : boolean,
  wordindex : boolean,
  exactmatch: boolean,
  category_synonyms? : string[];
}


// TODO: simplify this!
export interface IModelHandleRaw {
    srcHandle: ISrcHandle,
    modelDocs: { [key: string]: IModelDoc },
    modelESchemas: { [key: string]: IExtendedSchema },
    mongoMaps: { [key: string]: CatMongoMap },
};


export interface IModel {
    domain: string,
    modelname? : string,
    bitindex : number,
    description? : string,
//    tool: ITool,
//    toolhidden?: boolean,
    synonyms?: { [key: string]: string[] },
    categoryDescribed :  { name : string,
        description? : string,
        key? : string }[],
    category: string[],
    columns? : string[],
    hidden: string[]
    // why are these two later not obsolete??? 
    wordindex: string[],
    exactmatch? : string[],
};

//export const EnumRuleType = IFModel.EnumRuleType;
//export type IModels = IFModel.IModels;

//export { IFModel.IModels as IModels } from '../model/index_model';

export interface IModels {
    mongoHandle:  IModelHandleRaw, 
    full : {
      domain : { [key : string] : {
          description: string,
          bitindex : number,
          categories : { [key : string] : ICategoryDesc }
        }
      }
    },
    rawModels : { [key : string] : IModel};
    domains: string[],
//    tools: ITool[],
    category: string[],
    operators : { [key: string] : IOperator },
    mRules: mRule[],
    rules : SplitRules,
    records?: any[]
    seenRules?: { [key: string]: mRule[] },
    meta : {
        // entity -> relation -> target
        t3 : { [key: string] : { [key : string] : any }}
    }
}
