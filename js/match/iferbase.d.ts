import { IFModel as IFModel } from '../model/index_model';
export declare const enum EnumResponseCode {
    NOMATCH = 0,
    EXEC = 1,
    QUERY = 2
}
export declare const CAT_CATEGORY = "category";
export declare const CAT_FILLER = "filler";
export declare const CAT_TOOL = "tool";
export declare const ERR_NO_KNOWN_WORD = "NO_KNOWN_WORD";
export declare const ERR_EMPTY_INPUT = "EMPTY_INPUT";
export interface IERError {
    err_code: string;
    text: string;
}
export interface IERErrorNO_KNOWN_WORD extends IERError {
    context: {
        token: string;
        index: number;
        tokens: string[];
    };
}
export interface IPromptDescription {
    description: string;
    type: string;
    pattern: RegExp;
    message: string;
    default: string;
    required: boolean;
}
export declare const aOperatorNames: string[];
export declare type OperatorName = "starting with" | "ending with" | "containing" | "being" | "excluding" | "having";
export interface IOperator {
    operator: OperatorName;
    code: string;
    arity: number;
    argcategory: [string[]];
}
export declare type IRecord = {
    [key: string]: string;
};
export interface IWhatIsAnswer {
    sentence: ISentence;
    record: IRecord;
    category: string;
    result: string;
    _ranking: number;
}
export interface IProcessedWhatIsAnswers extends IProcessed {
    sentences?: ISentence[];
    answers: IWhatIsAnswer[];
}
export interface IProcessedWhatIsTupelAnswers extends IProcessed {
    sentences?: ISentence[];
    tupelanswers: Array<IWhatIsTupelAnswer>;
}
export interface IWhatIsTupelAnswer {
    sentence: ISentence;
    record: IRecord;
    categories: string[];
    result: string[];
    _ranking: number;
}
export interface IMatchedSetRecord {
    setId: string;
    record: IRecord;
}
export declare type IMatchedSetRecords = IMatchedSetRecord[];
/**
 * Map category -> value
 */
export declare type IMatchSet = {
    [key: string]: string;
};
export interface IToolSet {
    set: string[];
    response: string;
}
export interface IToolMatchResult {
    required: {
        [key: string]: IWord;
    };
    missing: {
        [key: string]: number;
    };
    optional?: {
        [key: string]: IWord;
    };
    spurious: {
        [key: string]: number;
    };
    toolmentioned: IWord[];
}
export interface IPrompt {
    text: string;
    category: string;
}
export interface IWord {
    string: string;
    matchedString: string;
    category: string;
    _ranking?: number;
    levenmatch?: number;
    reinforce?: number;
    bitindex?: number;
    rule?: IFModel.mRule;
}
export declare type ISentence = Array<IWord>;
export declare type IRule = IFModel.IRule;
export interface IRange {
    low: number;
    high: number;
}
export interface IWordRange extends IRange {
    rule?: IFModel.mRule;
}
/**
 * A rule matching a single string
 */
export interface IWordRules {
    rules: Array<IFModel.mRule>;
    bitindex: number;
}
export interface SplitRules {
    allRules: Array<IFModel.mRule>;
    nonWordRules: Array<IFModel.mRule>;
    wordMap: {
        [key: string]: IWordRules;
    };
    wordCache: {
        [key: string]: Array<ICategorizedString>;
    };
}
export interface ICategorizedString {
    string: string;
    matchedString: string;
    category: string;
    breakdown?: Array<any>;
    score?: number;
    _ranking?: number;
    levenmatch?: number;
}
export interface ICategorizedStringRanged extends ICategorizedString {
    string: string;
    matchedString: string;
    category: string;
    breakdown?: Array<any>;
    /**
     * Length of the entry (for skipping following words)
     */
    score?: number;
    span?: number;
    rule: IFModel.mRule;
    _ranking?: number;
    levenmatch?: number;
}
export interface IProcessed {
    tokens: string[];
    errors?: IERError[];
}
export interface IProcessedSentences extends IProcessed {
    tokens: string[];
    sentences: ISentence[];
}
export declare type ICategoryFilter = {
    [key: string]: boolean;
};
export declare type IDomainCategoryFilter = {
    domains: string[];
    categorySet: {
        [key: string]: boolean;
    };
};
export interface IProcessedExtractedCategories extends IProcessed {
    categories: string[];
}
export declare type context = {
    [key: string]: string;
};
export declare const enum EnumActionType {
    STARTURL = 0,
    STARTCMDLINE = 1
}
export interface IAction {
    data: any;
    type: EnumActionType;
    pattern: string;
    concrete: string;
}
export interface ICategoryDesc {
    name: string;
    importance?: number;
    description?: string;
    iskey?: boolean;
    exactMatch: boolean;
    synonyms?: string[];
}
