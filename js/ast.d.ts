export declare enum ASTNodeType {
    BINOP = 0,
    OP = 1,
    OPEqIn = 2,
    OPContains = 3,
    OPStartsWith = 4,
    OPEndsWith = 5,
    OPAll = 6,
    OPFirst = 7,
    OPLatest = 8,
    OPNewest = 9,
    OPOldest = 10,
    CAT = 11,
    CATPH = 12,
    FACT = 13,
    LIST = 14,
    ANY = 15,
    OPMoreThan = 16,
    OPLessThan = 17,
    OPExactly = 18,
    OPLT = 19,
    OPLE = 20,
    OPNE = 21,
    OPEQ = 22,
    OPGT = 23,
    OPGE = 24,
    OPOrderBy = 25,
    OPOrderDescendingBy = 26,
    OPExisting = 27,
    OPNotExisting = 28,
    OPLogicalAnd = 29,
    OPLogicalOr = 30,
    NUMBER = 31,
    DOM = 32
}
export declare class NodeType {
    nt: ASTNodeType;
    constructor(nt: ASTNodeType);
    toString(): string;
}
export interface ASTNode {
    type: ASTNodeType;
    bearer?: any;
    children?: ASTNode[];
}
export declare function makeNode(type: ASTNodeType, ...args: ASTNode[]): ASTNode;
export declare function makeNodeForCat(cat: any): ASTNode;
export declare function makeNodeForDomain(cat: any): ASTNode;
export declare function makeNodeForToken(type: ASTNodeType, opToken: any): ASTNode;
export declare function makeNodeForFact(fact: any): ASTNode;
export declare function makeNodeForAny(fact: any): ASTNode;
export declare function makeNodeForInteger(inttok: any): ASTNode;
export declare function typeToString(type: ASTNodeType): string;
export declare function dumpNodeNice(node: ASTNode): any;
export declare function astToText(node: ASTNode, indent?: number, prefix?: number): any;
