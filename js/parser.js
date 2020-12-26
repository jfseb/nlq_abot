'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectParser = exports.SelectLexer = void 0;
// based on: http://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Levenshtein_distance
// and:  http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
const chevrotain = require("chevrotain");
const AST = require("./ast");
const ast_1 = require("./ast");
// Written Docs for this tutorial step can be found here:
// https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step2_parsing.md
// Tutorial Step 2:
// Adding a Parser (grammar only, only reads the input
// without any actions) using the Tokens defined in the previous step.
// modification to the grammar will be displayed in the syntax diagrams panel.
/*
  function a( ) :  {
    GROUP?: string;
    PATTERN?: RegExp;
    LABEL?: string;
    LONGER_ALT?: chevrotain.TokenConstructor;
    POP_MODE?: boolean;
    PUSH_MODE?: string;
    tokenName?: string;
    tokenType?: number;
    extendingTokenTypes?: number[];
    new (...args: any[]): chevrotain.IToken;
  } {
    return { new(...args{}) : function() {
      return {
        image : "All"
      };
    }
  };
  };
*/
var createToken = chevrotain.createToken;
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;
var WhiteSpace = createToken({ name: "WhiteSpace", pattern: /\s+/ });
WhiteSpace.GROUP = Lexer.SKIPPED;
const tokens_1 = require("./tokens");
// whitespace is normally very common so it is placed first to speed up the lexer
var allTokens = Object.keys(tokens_1.Tokens).map(key => tokens_1.Tokens[key]);
/* [ FACT, And,
  Describe,
  First, Oldest, Latest, What,
  At, Every, All, At, Least, One,
  The,
  LParen, RParen,


 Meaning, Of, Are,  In, About, You, All,
WhiteSpace, Select, From, Where, Comma, ACategory, All,
  List, Identifier, Integer, GreaterThan, LessThan, To, Relating, With];
*/
var SelectLexer = new Lexer(allTokens);
exports.SelectLexer = SelectLexer;
// ----------------- parser -----------------
function SelectParser(input) {
    // By default if {recoveryEnabled: true} is not passed in the config object
    // error recovery / fault tolerance capabilities will be disabled
    var u = Parser.call(this, input, allTokens, {
    // autputCst: true
    });
    //console.log(u);
    var $ = this;
    this.listAll = $.RULE('listAll', () => {
        $.CONSUME(tokens_1.Tokens.list);
        $.OPTION(() => $.CONSUME(tokens_1.Tokens.all));
        var resFieldList = $.SUBRULE($.fieldList);
        return resFieldList;
    });
    /*
        this.inDomain = $.RULE('inDomain', () => {
          $.CONSUME(T.in);
          $.CONSUME(T.domain);
          $.CONSUME(T.ADomain);
        });
    */
    /*
        this.selectStatement = $.RULE("selectStatement", function () {
          $.SUBRULE($.selectClause)
          $.SUBRULE($.fromClause)
          $.OPTION(function () {
            $.SUBRULE($.whereClause)
          });
          //console.log('returning');
          return { a: 123 };
        });
    */
    this.allClause = $.RULE('allClause', function () {
        $.SUBRULE($.catListOpMore);
    });
    this.opCat = $.RULE('opCat', function () {
        $.OR([
            { ALT: function () { return AST.makeNodeForToken(ast_1.ASTNodeType.OPFirst, $.CONSUME(tokens_1.Tokens.first)); } },
            { ALT: function () { return AST.makeNodeForToken(ast_1.ASTNodeType.OPOldest, $.CONSUME(tokens_1.Tokens.oldest)); } },
            { ALT: function () { return AST.makeNodeForToken(ast_1.ASTNodeType.OPNewest, $.CONSUME(tokens_1.Tokens.latest)); } },
            { ALT: function () { return AST.makeNodeForToken(ast_1.ASTNodeType.OPNewest, $.CONSUME(tokens_1.Tokens.newest)); } }
        ]);
    });
    this.catListOpMore = $.RULE("catListOpMore", function () {
        var r = undefined;
        $.OPTION(() => r = $.SUBRULE($.opCat));
        r = r || AST.makeNode(ast_1.ASTNodeType.OPAll);
        var catList = $.SUBRULE2($.categoryList);
        r.children = [catList];
        var inop = $.OPTION2(() => {
            var op = $.SUBRULE3($.binaryFragOp);
            var head = catList.children[catList.children.length - 1];
            op.children = [head];
            var factOrAny = $.SUBRULE4($.factOrAny);
            op.children.push(factOrAny);
            return op;
        });
        var res = $.SUBRULE($.catListTail);
        var filterDom = res[0];
        var filter = (filterDom || [])[0];
        if (!filter && inop) {
            var n = AST.makeNode(ast_1.ASTNodeType.LIST);
            n.children = [inop];
            filter = n;
        }
        else if (inop) {
            filter.children.unshift(inop);
        }
        var orderBy = res[1];
        if (orderBy)
            filter.children.push(orderBy);
        var dom = (filterDom || [])[1];
        var current = (dom) ?
            AST.makeNode(ast_1.ASTNodeType.BINOP, r, filter, dom)
            : AST.makeNode(ast_1.ASTNodeType.BINOP, r, filter);
        return current;
        /*
        var filterDom = undefined;
        $.OPTION3(() => filterDom = $.SUBRULE5($.catFilter));
        var filter = (filterDom || [])[0];
 
        if(!filter && inop) {
           var n =  AST.makeNode(NT.LIST);
           n.children = [inop];
           filter = n;
        } else if(inop) {
           filter.children.unshift(inop);
        }
        var orderBy = undefined;
        $.OPTION4(() => orderBy = $.SUBRULE6($.orderBy));
 
        var dom = (filterDom || [])[1];
        var current = (dom) ?
            AST.makeNode(NT.BINOP, r, filter, dom)
         :  AST.makeNode(NT.BINOP,r, filter);
        if(orderBy) {
           orderBy[0] = current;
           return orderBy;
        } else {
          return current;
        }
        */
    });
    this.catListTail = $.RULE("catListTail", function () {
        var filterDom = undefined;
        $.OPTION3(() => filterDom = $.SUBRULE1($.catFilter));
        var filter = (filterDom || [])[0];
        var orderBy = undefined;
        $.OPTION4(() => orderBy = $.SUBRULE2($.orderBy));
        return [filterDom, orderBy];
        /*
        if(!filter && inop) {
          var n =  AST.makeNode(NT.LIST);
          n.children = [inop];
          filter = n;
        } else if(inop) {
          filter.children.unshift(inop);
        }
        var orderBy = undefined;
        $.OPTION4(() => orderBy = $.SUBRULE6($.orderBy));

        var dom = (filterDom || [])[1];
        var current = (dom) ?
            AST.makeNode(NT.BINOP, r, filter, dom)
        :  AST.makeNode(NT.BINOP,r, filter);
        if(orderBy) {
          orderBy[0] = current;
          return orderBy;
        } else {
          return current;
        }
        */
    });
    this.filterEntry = $.RULE("filterEntry", function () {
        $.OR([
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.in);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.with);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.for);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.relating);
                }
            }
        ]);
    });
    this.orderBy = $.RULE("orderBy", function () {
        var op = undefined;
        $.OR([
            {
                ALT: () => {
                    var tok = $.CONSUME1(tokens_1.Tokens.order_by);
                    op = AST.makeNode(ast_1.ASTNodeType.OPOrderBy);
                    op.bearer = tok;
                }
            },
            {
                ALT: () => {
                    var tok = $.CONSUME2(tokens_1.Tokens.order_descending_by);
                    op = AST.makeNode(ast_1.ASTNodeType.OPOrderDescendingBy);
                    op.bearer = tok;
                }
            }
        ]);
        var cat = $.CONSUME3(tokens_1.Tokens.CAT);
        var nodeCat = AST.makeNodeForCat(cat);
        op.children[0] = nodeCat;
        return op;
    });
    this.domOrDomainDom = $.RULE("domOrDomainDom", function () {
        $.OPTION(() => $.CONSUME(tokens_1.Tokens.domain));
        var r = $.CONSUME2(tokens_1.Tokens.DOM);
        return AST.makeNodeForDomain(r);
    });
    this.catFilter = $.RULE("catFilter", function () {
        $.SUBRULE($.filterEntry);
        var dom = undefined;
        var filter = undefined;
        $.OR([{
                ALT: () => {
                    dom = $.SUBRULE1($.domOrDomainDom);
                    $.OPTION2(() => {
                        $.SUBRULE2($.filterEntry);
                        filter = $.SUBRULE3($.commaAndListFilter);
                    });
                }
            },
            {
                ALT: () => {
                    filter = $.SUBRULE4($.commaAndListFilter);
                }
            }
        ]);
        return [filter, dom];
    });
    this.categoryList = $.RULE("categoryList", function () {
        var r = [];
        $.AT_LEAST_ONE(() => {
            $.OPTION(() => {
                //$.CONSUME(T.Comma);
                $.OR([{ ALT: () => $.CONSUME(tokens_1.Tokens.Comma) },
                    { ALT: () => $.CONSUME(tokens_1.Tokens.and) },
                ]);
            });
            r.push(AST.makeNodeForCat($.CONSUME(tokens_1.Tokens.CAT)));
        });
        /*
        $.AT_LEAST_ONE_SEP({
          SEP: T.Comma, DEF: function () {
            r.push(AST.makeNodeForCat($.CONSUME(T.CAT)));
          }
        });
        */
        var res = AST.makeNode(ast_1.ASTNodeType.LIST);
        res.children = r;
        return res;
    });
    this.plainFact = $.RULE("plainFact", () => AST.makeNodeForFact($.CONSUME(tokens_1.Tokens.FACT)));
    this.factOrAny = $.RULE("factOrAny", () => $.OR([
        {
            ALT: function () {
                return AST.makeNodeForFact($.CONSUME1(tokens_1.Tokens.FACT));
            }
        },
        {
            ALT: function () {
                return AST.makeNodeForAny($.CONSUME2(tokens_1.Tokens.AnANY));
            }
        }
    ]));
    this.factOrAnyOrInteger = $.RULE("factOrAnyOrInteger", () => $.OR([
        {
            ALT: function () {
                return AST.makeNodeForFact($.CONSUME1(tokens_1.Tokens.FACT));
            }
        },
        {
            ALT: function () {
                return AST.makeNodeForAny($.CONSUME2(tokens_1.Tokens.AnANY));
            }
        },
        {
            ALT: function () {
                return AST.makeNodeForAny($.CONSUME3(tokens_1.Tokens.Integer));
            }
        }
    ]));
    this.ppFactAny = $.RULE("opFactAny", function (head) {
        return $.OR([
            {
                ALT: () => {
                    var op = AST.makeNode(ast_1.ASTNodeType.OPEqIn, head);
                    var fact = $.SUBRULE($.plainFact);
                    op.children.push(fact);
                    return op;
                }
            },
            {
                ALT: () => {
                    var op = $.SUBRULE2($.binaryValOp);
                    op.children = [head];
                    var fact = $.SUBRULE3($.plainFact);
                    op.children.push(fact);
                    return op;
                }
            },
            {
                ALT: () => {
                    var op = $.SUBRULE4($.binaryFragOp);
                    op.children = [head];
                    var factOrAnyOrInteger = $.SUBRULE5($.factOrAnyOrInteger);
                    op.children.push(factOrAnyOrInteger);
                    return op;
                }
            }
        ]);
    });
    // [ CAT? FACT ]
    // TODO CAT OP CONTAINS MANY
    // CAT OP FACT
    // FACT
    this.MoreThanLessThanExactly = $.RULE("MoreThanLessThanExactly", function () {
        return $.OR([{
                ALT: () => {
                    var tok = $.CONSUME(tokens_1.Tokens.more_than);
                    var op = AST.makeNode(ast_1.ASTNodeType.OPMoreThan);
                    op.bearer = tok;
                    var toki = $.CONSUME(tokens_1.Tokens.Integer);
                    var numberarg = AST.makeNodeForInteger(toki);
                    op.children[0] = numberarg;
                    var tokc = $.CONSUME(tokens_1.Tokens.CAT);
                    var cat = AST.makeNodeForCat(tokc);
                    op.children[1] = cat;
                    return op;
                }
            },
            {
                ALT: () => {
                    var tok = $.CONSUME(tokens_1.Tokens.less_than);
                    var op = AST.makeNode(ast_1.ASTNodeType.OPLessThan);
                    op.bearer = tok;
                    var toki = $.CONSUME2(tokens_1.Tokens.Integer);
                    var numberarg = AST.makeNodeForInteger(toki);
                    op.children[0] = numberarg;
                    var tokc = $.CONSUME2(tokens_1.Tokens.CAT);
                    var cat = AST.makeNodeForCat(tokc);
                    op.children[1] = cat;
                    return op;
                }
            },
            {
                ALT: () => {
                    var tok = $.CONSUME(tokens_1.Tokens.exactly);
                    var op = AST.makeNode(ast_1.ASTNodeType.OPExactly);
                    op.bearer = tok;
                    var toki = $.CONSUME3(tokens_1.Tokens.Integer);
                    var numberarg = AST.makeNodeForInteger(toki);
                    op.children[0] = numberarg;
                    var tokc = $.CONSUME3(tokens_1.Tokens.CAT);
                    var cat = AST.makeNodeForCat(tokc);
                    op.children[1] = cat;
                    return op;
                }
            },
            {
                ALT: () => {
                    var tok = $.CONSUME(tokens_1.Tokens.existing);
                    var op = AST.makeNode(ast_1.ASTNodeType.OPExisting);
                    op.bearer = tok;
                    var tokc = $.CONSUME4(tokens_1.Tokens.CAT);
                    var cat = AST.makeNodeForCat(tokc);
                    op.children[0] = cat;
                    return op;
                }
            },
            {
                ALT: () => {
                    var tok = $.CONSUME(tokens_1.Tokens.not_existing);
                    var op = AST.makeNode(ast_1.ASTNodeType.OPNotExisting);
                    op.bearer = tok;
                    var tokc = $.CONSUME5(tokens_1.Tokens.CAT);
                    var cat = AST.makeNodeForCat(tokc);
                    op.children[0] = cat;
                    return op;
                }
            }
            /*,
            {
              ALT: () => {
                console.log( 'token index is ' + T.less_than );
                var tok = $.CONSUME2(T.less_than);
                var op = AST.makeNode(NT.OPMoreThan);
                op.bearer = tok;
                var toki = $.CONSUME3(T.AnANY);
                var numberarg = AST.makeNodeForInteger(toki);
                op.children[0] = numberarg;
                var tokc = $.CONSUME3(T.CAT);
                var cat = AST.makeNodeForCat(tokc);
                op.children[1] = cat;
                return op;
              }
            }*/
        ]);
    });
    this.catFact = $.RULE("catFact", function () {
        return $.OR([
            {
                ALT: () => {
                    var tok = $.CONSUME(tokens_1.Tokens.CAT);
                    var head = AST.makeNodeForCat(tok);
                    var op = $.SUBRULE($.opFactAny, head);
                    op.children[0] = head;
                    return op;
                }
            },
            {
                ALT: () => {
                    return $.SUBRULE($.MoreThanLessThanExactly);
                    /*
                    console.log( 'token index is ' + T.more_than );
                    var tok = $.CONSUME(T.more_than);
                    var op = AST.makeNode(NT.OPMoreThan);
                    op.bearer = tok;
                    var toki = $.CONSUME(T.Integer);
                    var numberarg = AST.makeNodeForInteger(toki);
                    op.children[0] = numberarg;
                    var tokc = $.CONSUME2(T.CAT);
                    var cat = AST.makeNodeForCat(tokc);
                    op.children[1] = cat;
                    return op;
                    */
                }
            },
            {
                ALT: () => {
                    var op = AST.makeNode(ast_1.ASTNodeType.OPEqIn, AST.makeNode(AST.ASTNodeType.CATPH));
                    var fact = $.SUBRULE2($.plainFact);
                    op.children.push(fact);
                    return op;
                }
            }
        ]);
    });
    //
    this.commaAndListFilter = $.RULE("commaAndListFilter", function () {
        var r = [$.SUBRULE($.catFact)];
        $.MANY(() => {
            $.OPTION(() => 
            //$.CONSUME(T.Comma));
            $.OR([
                { ALT: function () { $.CONSUME(tokens_1.Tokens.Comma); } },
                { ALT: function () { $.CONSUME(tokens_1.Tokens.and); } },
                { ALT: function () { $.CONSUME(tokens_1.Tokens.or); } },
                { ALT: function () { $.CONSUME(tokens_1.Tokens.with); } }
            ]));
            r.push($.SUBRULE2($.catFact));
        });
        //onsole.log("here producing" + JSON.stringify(n));
        var n = AST.makeNode(ast_1.ASTNodeType.LIST);
        n.children = r;
        return n;
    });
    /*
      this.commaAndListTail = $.RULE("commaAndListTail", function () {
          //$.SUBRULE($.catFact);
          $.MANY( () => {
            $.CONSUME(T.Comma);
            /* $.OR( [
              { ALT: function() { $.CONSUME(Comma); }},
              { ALT: function() { $.CONSUME(And); }}
            ]); * /
            $.SUBRULE($.catFact);
          });
          return { b: 445 };
        });
    */
    $.RULE("unarySetOp", function () {
        $.OR([
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.all);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.first);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.newest);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.oldest);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.latest);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.every);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.any);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.at);
                    $.CONSUME(tokens_1.Tokens.least);
                    $.CONSUME(tokens_1.Tokens.one);
                }
            },
            {
                ALT: function () {
                    $.CONSUME(tokens_1.Tokens.last);
                }
            }
        ]);
    });
    $.RULE("binaryValOp", function () {
        return $.OR([
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPEQ, $.CONSUME1(tokens_1.Tokens.equals));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPEQ, $.CONSUME2(tokens_1.Tokens.is));
                }
            }
        ]);
    });
    $.RULE("binaryFragOp", function () {
        return $.OR([
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPContains, $.CONSUME(tokens_1.Tokens.contains));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPContains, $.CONSUME1(tokens_1.Tokens.containing));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPEndsWith, $.CONSUME2(tokens_1.Tokens.ends_with));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPEndsWith, $.CONSUME3(tokens_1.Tokens.ending_with));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPStartsWith, $.CONSUME4(tokens_1.Tokens.starting_with));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPStartsWith, $.CONSUME5(tokens_1.Tokens.starts_with));
                }
            },
            {
                ALT: function () {
                    return $.SUBRULE2($.opBinaryCompare);
                }
            }
        ]);
    });
    $.RULE("opBinaryCompare", function () {
        return $.OR([
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPLT, $.CONSUME1(tokens_1.Tokens.LT));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPLE, $.CONSUME2(tokens_1.Tokens.LE));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPGT, $.CONSUME3(tokens_1.Tokens.GT));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPGE, $.CONSUME4(tokens_1.Tokens.GE));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPEQ, $.CONSUME5(tokens_1.Tokens.EQ));
                }
            },
            {
                ALT: function () {
                    // deliberate recast,( ( not less than 3 CAT  )
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPLT, $.CONSUME3(tokens_1.Tokens.less_than));
                }
            },
            {
                ALT: function () {
                    // deliberate recast!
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPGT, $.CONSUME4(tokens_1.Tokens.more_than));
                }
            },
            {
                ALT: function () {
                    return AST.makeNodeForToken(ast_1.ASTNodeType.OPNE, $.CONSUME5(tokens_1.Tokens.NE));
                }
            }
        ]);
    });
    /// Where  First (CAT  GE  X  )
    /*
        $.RULE("catSetExpression", function() {
          $.OPTION($.SUBRULE($.unarySetOp));
          $.CONSUME(T.CAT);
        })
    */
    //  lowest precedence thus it is first in the rule chain
    // The precedence of binary expressions is determined by how far down the Parse Tree
    // The binary expression appears.
    /*
    $.RULE("filterExpression", function() {
        var value, op, rhsVal;

        // parsing part
        value = $.SUBRULE($.catSetExpression);
        $.OR([ { ALT: function() {
          $.AT_LEAST_O(function() {
              // consuming 'AdditionOperator' will consume either Plus or Minus as they are subclasses of AdditionOperator
              op = $.SUBRULE1($.binaryValOp);
              //  the index "2" in SUBRULE2 is needed to identify the unique position in the grammar during runtime
              rhsVal = $.CONSUME(T.AFact);
              // TODO logical expr
          });
          return value;
        }},
        { ALT: function() { $.CONSUME2(T.AFact); }
        }
        ]);
    });
    */
    /*
        $.RULE("xatomicExpression", function() {
            return $.OR([
                // parenthesisExpression has the highest precedence and thus it appears
                // in the "lowest" leaf in the expression ParseTree.
                {ALT: function() { return $.SUBRULE($.parenthesisExpression)}},
                {ALT: function() { return parseInt($.CONSUME(T.Integer).image, 10)}},
                {ALT: function() { return $.SUBRULE($.powerFunction)}}
            ]);
        });
    */
    /*
        $.RULE("parenthesisExpression", function() {
            var expValue;
            $.CONSUME(T.LParen);
            expValue = $.SUBRULE($.expression);
            $.CONSUME(T.RParen);
            return expValue
        });
    */
    /*
    
        this.selectClause = $.RULE("selectClause", function () {
          $.CONSUME(T.select);
          $.AT_LEAST_ONE_SEP({
            SEP: T.Comma, DEF: function () {
              $.CONSUME(T.Identifier);
            }
          });
          return { b: 445 };
        });
    */
    /*
        this.fromClause = $.RULE("fromClause", function () {
          $.CONSUME(T.from);
          $.CONSUME(T.Identifier);
    
          // example:
          // replace the contents of this rule with the commented out lines
          // below to implement multiple tables to select from (implicit join).
    
          // $.CONSUME(From);
          // $.AT_LEAST_ONE_SEP({
          //   SEP: Comma, DEF: function () {
          //     $.CONSUME(Identifier);
          //   }
          // });
        });
    */
    this.fieldList = $.RULE("fieldList", function () {
        var res = [];
        $.AT_LEAST_ONE_SEP({
            SEP: tokens_1.Tokens.Comma, DEF: function () {
                var atok = $.CONSUME(tokens_1.Tokens.CAT);
                // console.log("token " + JSON.stringify(atok));
                res.push(atok);
            }
        });
        return res;
    });
    /*
        this.whereClause = $.RULE("whereClause", function () {
          $.CONSUME(T.where)
          $.SUBRULE($.expression)
        });
    
    
        this.expression = $.RULE("expression", function () {
          $.SUBRULE($.atomicExpression);
          $.SUBRULE($.relationalOperator);
          $.SUBRULE2($.atomicExpression); // note the '2' suffix to distinguish
                          // from the 'SUBRULE(atomicExpression)'
                          // 2 lines above.
        });
    
    
        this.atomicExpression = $.RULE("atomicExpression", function () {
          $.OR([
            {ALT: function () { $.CONSUME(T.Integer)}},
            {ALT: function () { $.CONSUME(T.Identifier)}}
          ]);
        });
    
    
        this.relationalOperator = $.RULE("relationalOperator", function () {
          $.OR([
            {ALT: function () { $.CONSUME(T.GT)}},
            {ALT: function () { $.CONSUME(T.LT)}}
          ]);
        });
    */
    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    Parser.performSelfAnalysis(this);
}
exports.SelectParser = SelectParser;
SelectParser.prototype = Object.create(Parser.prototype);
SelectParser.prototype.constructor = SelectParser;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUFDO0FBQzVDLENBQUM7QUFRQSxvQ0FBWTtBQU5iLFlBQVksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDekQsWUFBWSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEdBQUcsWUFBWSxDQUFDIiwiZmlsZSI6InBhcnNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xyXG5cclxuLy8gYmFzZWQgb246IGh0dHA6Ly9lbi53aWtpYm9va3Mub3JnL3dpa2kvQWxnb3JpdGhtX2ltcGxlbWVudGF0aW9uL1N0cmluZ3MvTGV2ZW5zaHRlaW5fZGlzdGFuY2VcclxuLy8gYW5kOiAgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9EYW1lcmF1JUUyJTgwJTkzTGV2ZW5zaHRlaW5fZGlzdGFuY2VcclxuXHJcblxyXG5pbXBvcnQgKiBhcyBjaGV2cm90YWluIGZyb20gJ2NoZXZyb3RhaW4nO1xyXG5pbXBvcnQgKiBhcyBBU1QgZnJvbSAnLi9hc3QnO1xyXG5cclxuaW1wb3J0IHsgQVNUTm9kZVR5cGUgYXMgTlR9IGZyb20gJy4vYXN0JztcclxuXHJcbiAgLy8gV3JpdHRlbiBEb2NzIGZvciB0aGlzIHR1dG9yaWFsIHN0ZXAgY2FuIGJlIGZvdW5kIGhlcmU6XHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL1NBUC9jaGV2cm90YWluL2Jsb2IvbWFzdGVyL2RvY3MvdHV0b3JpYWwvc3RlcDJfcGFyc2luZy5tZFxyXG5cclxuICAvLyBUdXRvcmlhbCBTdGVwIDI6XHJcblxyXG4gIC8vIEFkZGluZyBhIFBhcnNlciAoZ3JhbW1hciBvbmx5LCBvbmx5IHJlYWRzIHRoZSBpbnB1dFxyXG4gIC8vIHdpdGhvdXQgYW55IGFjdGlvbnMpIHVzaW5nIHRoZSBUb2tlbnMgZGVmaW5lZCBpbiB0aGUgcHJldmlvdXMgc3RlcC5cclxuICAvLyBtb2RpZmljYXRpb24gdG8gdGhlIGdyYW1tYXIgd2lsbCBiZSBkaXNwbGF5ZWQgaW4gdGhlIHN5bnRheCBkaWFncmFtcyBwYW5lbC5cclxuXHJcbi8qXHJcbiAgZnVuY3Rpb24gYSggKSA6ICB7XHJcbiAgICBHUk9VUD86IHN0cmluZztcclxuICAgIFBBVFRFUk4/OiBSZWdFeHA7XHJcbiAgICBMQUJFTD86IHN0cmluZztcclxuICAgIExPTkdFUl9BTFQ/OiBjaGV2cm90YWluLlRva2VuQ29uc3RydWN0b3I7XHJcbiAgICBQT1BfTU9ERT86IGJvb2xlYW47XHJcbiAgICBQVVNIX01PREU/OiBzdHJpbmc7XHJcbiAgICB0b2tlbk5hbWU/OiBzdHJpbmc7XHJcbiAgICB0b2tlblR5cGU/OiBudW1iZXI7XHJcbiAgICBleHRlbmRpbmdUb2tlblR5cGVzPzogbnVtYmVyW107XHJcbiAgICBuZXcgKC4uLmFyZ3M6IGFueVtdKTogY2hldnJvdGFpbi5JVG9rZW47XHJcbiAgfSB7XHJcbiAgICByZXR1cm4geyBuZXcoLi4uYXJnc3t9KSA6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGltYWdlIDogXCJBbGxcIlxyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gIH07XHJcbiAgfTtcclxuKi9cclxuXHJcbiAgdmFyIGNyZWF0ZVRva2VuID0gY2hldnJvdGFpbi5jcmVhdGVUb2tlbjtcclxuICB2YXIgTGV4ZXIgPSBjaGV2cm90YWluLkxleGVyO1xyXG4gIHZhciBQYXJzZXIgPSBjaGV2cm90YWluLlBhcnNlcjtcclxuXHJcbiAgdmFyIFdoaXRlU3BhY2UgPSBjcmVhdGVUb2tlbih7bmFtZTogXCJXaGl0ZVNwYWNlXCIsIHBhdHRlcm46IC9cXHMrL30pO1xyXG5cclxuICBXaGl0ZVNwYWNlLkdST1VQID0gTGV4ZXIuU0tJUFBFRDtcclxuXHJcblxyXG5pbXBvcnQgeyBPcGVyYXRvckxvb2t1cCBhcyBPTCwgVG9rZW5zIGFzIFR9ICBmcm9tICcuL3Rva2Vucyc7XHJcbiAgLy8gd2hpdGVzcGFjZSBpcyBub3JtYWxseSB2ZXJ5IGNvbW1vbiBzbyBpdCBpcyBwbGFjZWQgZmlyc3QgdG8gc3BlZWQgdXAgdGhlIGxleGVyXHJcbiAgdmFyIGFsbFRva2VucyA9IE9iamVjdC5rZXlzKFQpLm1hcChrZXkgPT4gVFtrZXldKTtcclxuICAvKiBbIEZBQ1QsIEFuZCxcclxuICAgIERlc2NyaWJlLFxyXG4gICAgRmlyc3QsIE9sZGVzdCwgTGF0ZXN0LCBXaGF0LFxyXG4gICAgQXQsIEV2ZXJ5LCBBbGwsIEF0LCBMZWFzdCwgT25lLFxyXG4gICAgVGhlLFxyXG4gICAgTFBhcmVuLCBSUGFyZW4sXHJcblxyXG5cclxuICAgTWVhbmluZywgT2YsIEFyZSwgIEluLCBBYm91dCwgWW91LCBBbGwsXHJcbiAgV2hpdGVTcGFjZSwgU2VsZWN0LCBGcm9tLCBXaGVyZSwgQ29tbWEsIEFDYXRlZ29yeSwgQWxsLFxyXG4gICAgTGlzdCwgSWRlbnRpZmllciwgSW50ZWdlciwgR3JlYXRlclRoYW4sIExlc3NUaGFuLCBUbywgUmVsYXRpbmcsIFdpdGhdO1xyXG4qL1xyXG4gICAgdmFyIFNlbGVjdExleGVyID0gbmV3IExleGVyKGFsbFRva2Vucyk7XHJcblxyXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tIHBhcnNlciAtLS0tLS0tLS0tLS0tLS0tLVxyXG5mdW5jdGlvbiBTZWxlY3RQYXJzZXIoaW5wdXQpIHtcclxuICAgIC8vIEJ5IGRlZmF1bHQgaWYge3JlY292ZXJ5RW5hYmxlZDogdHJ1ZX0gaXMgbm90IHBhc3NlZCBpbiB0aGUgY29uZmlnIG9iamVjdFxyXG4gICAgLy8gZXJyb3IgcmVjb3ZlcnkgLyBmYXVsdCB0b2xlcmFuY2UgY2FwYWJpbGl0aWVzIHdpbGwgYmUgZGlzYWJsZWRcclxuICAgIHZhciB1ID0gUGFyc2VyLmNhbGwodGhpcywgaW5wdXQsIGFsbFRva2Vucywge1xyXG4gICAgIC8vIGF1dHB1dENzdDogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy9jb25zb2xlLmxvZyh1KTtcclxuICAgIHZhciAkID0gdGhpcztcclxuXHJcbiAgICB0aGlzLmxpc3RBbGwgPSAkLlJVTEUoJ2xpc3RBbGwnLCAoKSA9PiB7XHJcbiAgICAgICQuQ09OU1VNRShULmxpc3QpO1xyXG4gICAgICAkLk9QVElPTigoKSA9PlxyXG4gICAgICAgICQuQ09OU1VNRShULmFsbClcclxuICAgICAgKTtcclxuICAgICAgdmFyIHJlc0ZpZWxkTGlzdCA9ICQuU1VCUlVMRSgkLmZpZWxkTGlzdClcclxuICAgICAgcmV0dXJuIHJlc0ZpZWxkTGlzdDtcclxuICAgIH0pO1xyXG5cclxuLypcclxuICAgIHRoaXMuaW5Eb21haW4gPSAkLlJVTEUoJ2luRG9tYWluJywgKCkgPT4ge1xyXG4gICAgICAkLkNPTlNVTUUoVC5pbik7XHJcbiAgICAgICQuQ09OU1VNRShULmRvbWFpbik7XHJcbiAgICAgICQuQ09OU1VNRShULkFEb21haW4pO1xyXG4gICAgfSk7XHJcbiovXHJcbi8qXHJcbiAgICB0aGlzLnNlbGVjdFN0YXRlbWVudCA9ICQuUlVMRShcInNlbGVjdFN0YXRlbWVudFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQuU1VCUlVMRSgkLnNlbGVjdENsYXVzZSlcclxuICAgICAgJC5TVUJSVUxFKCQuZnJvbUNsYXVzZSlcclxuICAgICAgJC5PUFRJT04oZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQuU1VCUlVMRSgkLndoZXJlQ2xhdXNlKVxyXG4gICAgICB9KTtcclxuICAgICAgLy9jb25zb2xlLmxvZygncmV0dXJuaW5nJyk7XHJcbiAgICAgIHJldHVybiB7IGE6IDEyMyB9O1xyXG4gICAgfSk7XHJcbiovXHJcblxyXG4gICAgdGhpcy5hbGxDbGF1c2UgPSAkLlJVTEUoJ2FsbENsYXVzZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAkLlNVQlJVTEUoJC5jYXRMaXN0T3BNb3JlKTtcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICB0aGlzLm9wQ2F0ID0gJC5SVUxFKCdvcENhdCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAkLk9SKFtcclxuICAgICAgICB7QUxUOiBmdW5jdGlvbigpIHsgcmV0dXJuIEFTVC5tYWtlTm9kZUZvclRva2VuKE5ULk9QRmlyc3QsICQuQ09OU1VNRShULmZpcnN0KSk7fX0sXHJcbiAgICAgICAge0FMVDogZnVuY3Rpb24oKSB7IHJldHVybiBBU1QubWFrZU5vZGVGb3JUb2tlbihOVC5PUE9sZGVzdCwgJC5DT05TVU1FKFQub2xkZXN0KSk7fX0sXHJcbiAgICAgICAge0FMVDogZnVuY3Rpb24oKSB7IHJldHVybiBBU1QubWFrZU5vZGVGb3JUb2tlbihOVC5PUE5ld2VzdCwkLkNPTlNVTUUoVC5sYXRlc3QpKTt9fSxcclxuICAgICAgICB7QUxUOiBmdW5jdGlvbigpIHsgcmV0dXJuIEFTVC5tYWtlTm9kZUZvclRva2VuKE5ULk9QTmV3ZXN0LCQuQ09OU1VNRShULm5ld2VzdCkpO319XHJcbiAgICAgIF0pXHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLmNhdExpc3RPcE1vcmUgPSAkLlJVTEUoXCJjYXRMaXN0T3BNb3JlXCIsIGZ1bmN0aW9uKCkgOiBBU1QuQVNUTm9kZSB7XHJcbiAgICAgICB2YXIgciA9IHVuZGVmaW5lZCBhcyBBU1QuQVNUTm9kZTtcclxuICAgICAgICQuT1BUSU9OKCgpID0+XHJcbiAgICAgICAgICByID0gJC5TVUJSVUxFKCQub3BDYXQpXHJcbiAgICAgICApO1xyXG4gICAgICAgciA9IHIgfHwgQVNULm1ha2VOb2RlKE5ULk9QQWxsKTtcclxuICAgICAgIHZhciBjYXRMaXN0ID0gJC5TVUJSVUxFMigkLmNhdGVnb3J5TGlzdCk7XHJcbiAgICAgICByLmNoaWxkcmVuID0gW2NhdExpc3RdO1xyXG4gICAgICAgdmFyIGlub3AgPSAkLk9QVElPTjIoKCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgb3AgPSAkLlNVQlJVTEUzKCQuYmluYXJ5RnJhZ09wKTtcclxuICAgICAgICAgICAgdmFyIGhlYWQgPSBjYXRMaXN0LmNoaWxkcmVuW2NhdExpc3QuY2hpbGRyZW4ubGVuZ3RoLTFdO1xyXG4gICAgICAgICAgICAgIG9wLmNoaWxkcmVuID0gW2hlYWRdO1xyXG4gICAgICAgICAgICB2YXIgZmFjdE9yQW55ID0gJC5TVUJSVUxFNCgkLmZhY3RPckFueSk7XHJcbiAgICAgICAgICAgIG9wLmNoaWxkcmVuLnB1c2goZmFjdE9yQW55KTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgdmFyIHJlcyA9ICQuU1VCUlVMRSgkLmNhdExpc3RUYWlsKTtcclxuICAgICAgIHZhciBmaWx0ZXJEb20gPSByZXNbMF07XHJcbiAgICAgICB2YXIgZmlsdGVyID0gKGZpbHRlckRvbSB8fCBbXSlbMF07XHJcbiAgICAgICBpZighZmlsdGVyICYmIGlub3ApIHtcclxuICAgICAgICAgIHZhciBuID0gIEFTVC5tYWtlTm9kZShOVC5MSVNUKTtcclxuICAgICAgICAgIG4uY2hpbGRyZW4gPSBbaW5vcF07XHJcbiAgICAgICAgICBmaWx0ZXIgPSBuO1xyXG4gICAgICAgfSBlbHNlIGlmKGlub3ApIHtcclxuICAgICAgICAgIGZpbHRlci5jaGlsZHJlbi51bnNoaWZ0KGlub3ApO1xyXG4gICAgICAgfVxyXG4gICAgICAgdmFyIG9yZGVyQnkgPSByZXNbMV07XHJcbiAgICAgICBpZiAoIG9yZGVyQnkgKVxyXG4gICAgICAgICBmaWx0ZXIuY2hpbGRyZW4ucHVzaChvcmRlckJ5KTtcclxuICAgICAgIHZhciBkb20gPSAoZmlsdGVyRG9tIHx8IFtdKVsxXTtcclxuICAgICAgIHZhciBjdXJyZW50ID0gKGRvbSkgP1xyXG4gICAgICAgICAgIEFTVC5tYWtlTm9kZShOVC5CSU5PUCwgciwgZmlsdGVyLCBkb20pXHJcbiAgICAgICAgOiAgQVNULm1ha2VOb2RlKE5ULkJJTk9QLHIsIGZpbHRlcik7XHJcbiAgICAgICByZXR1cm4gY3VycmVudDtcclxuICAgICAgIC8qXHJcbiAgICAgICB2YXIgZmlsdGVyRG9tID0gdW5kZWZpbmVkO1xyXG4gICAgICAgJC5PUFRJT04zKCgpID0+IGZpbHRlckRvbSA9ICQuU1VCUlVMRTUoJC5jYXRGaWx0ZXIpKTtcclxuICAgICAgIHZhciBmaWx0ZXIgPSAoZmlsdGVyRG9tIHx8IFtdKVswXTtcclxuXHJcbiAgICAgICBpZighZmlsdGVyICYmIGlub3ApIHtcclxuICAgICAgICAgIHZhciBuID0gIEFTVC5tYWtlTm9kZShOVC5MSVNUKTtcclxuICAgICAgICAgIG4uY2hpbGRyZW4gPSBbaW5vcF07XHJcbiAgICAgICAgICBmaWx0ZXIgPSBuO1xyXG4gICAgICAgfSBlbHNlIGlmKGlub3ApIHtcclxuICAgICAgICAgIGZpbHRlci5jaGlsZHJlbi51bnNoaWZ0KGlub3ApO1xyXG4gICAgICAgfVxyXG4gICAgICAgdmFyIG9yZGVyQnkgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAkLk9QVElPTjQoKCkgPT4gb3JkZXJCeSA9ICQuU1VCUlVMRTYoJC5vcmRlckJ5KSk7XHJcblxyXG4gICAgICAgdmFyIGRvbSA9IChmaWx0ZXJEb20gfHwgW10pWzFdO1xyXG4gICAgICAgdmFyIGN1cnJlbnQgPSAoZG9tKSA/XHJcbiAgICAgICAgICAgQVNULm1ha2VOb2RlKE5ULkJJTk9QLCByLCBmaWx0ZXIsIGRvbSlcclxuICAgICAgICA6ICBBU1QubWFrZU5vZGUoTlQuQklOT1AsciwgZmlsdGVyKTtcclxuICAgICAgIGlmKG9yZGVyQnkpIHtcclxuICAgICAgICAgIG9yZGVyQnlbMF0gPSBjdXJyZW50O1xyXG4gICAgICAgICAgcmV0dXJuIG9yZGVyQnk7XHJcbiAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICByZXR1cm4gY3VycmVudDtcclxuICAgICAgIH1cclxuICAgICAgICovXHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLmNhdExpc3RUYWlsID0gJC5SVUxFKFwiY2F0TGlzdFRhaWxcIiwgZnVuY3Rpb24oKSA6IEFTVC5BU1ROb2RlW10ge1xyXG4gICAgICAgIHZhciBmaWx0ZXJEb20gPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgJC5PUFRJT04zKCgpID0+IGZpbHRlckRvbSA9ICQuU1VCUlVMRTEoJC5jYXRGaWx0ZXIpKTtcclxuICAgICAgICB2YXIgZmlsdGVyID0gKGZpbHRlckRvbSB8fCBbXSlbMF07XHJcbiAgICAgICAgdmFyIG9yZGVyQnkgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgJC5PUFRJT040KCgpID0+IG9yZGVyQnkgPSAkLlNVQlJVTEUyKCQub3JkZXJCeSkpO1xyXG4gICAgICAgIHJldHVybiBbIGZpbHRlckRvbSwgb3JkZXJCeSBdO1xyXG4gICAgICAgIC8qXHJcbiAgICAgICAgaWYoIWZpbHRlciAmJiBpbm9wKSB7XHJcbiAgICAgICAgICB2YXIgbiA9ICBBU1QubWFrZU5vZGUoTlQuTElTVCk7XHJcbiAgICAgICAgICBuLmNoaWxkcmVuID0gW2lub3BdO1xyXG4gICAgICAgICAgZmlsdGVyID0gbjtcclxuICAgICAgICB9IGVsc2UgaWYoaW5vcCkge1xyXG4gICAgICAgICAgZmlsdGVyLmNoaWxkcmVuLnVuc2hpZnQoaW5vcCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBvcmRlckJ5ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICQuT1BUSU9ONCgoKSA9PiBvcmRlckJ5ID0gJC5TVUJSVUxFNigkLm9yZGVyQnkpKTtcclxuXHJcbiAgICAgICAgdmFyIGRvbSA9IChmaWx0ZXJEb20gfHwgW10pWzFdO1xyXG4gICAgICAgIHZhciBjdXJyZW50ID0gKGRvbSkgP1xyXG4gICAgICAgICAgICBBU1QubWFrZU5vZGUoTlQuQklOT1AsIHIsIGZpbHRlciwgZG9tKVxyXG4gICAgICAgIDogIEFTVC5tYWtlTm9kZShOVC5CSU5PUCxyLCBmaWx0ZXIpO1xyXG4gICAgICAgIGlmKG9yZGVyQnkpIHtcclxuICAgICAgICAgIG9yZGVyQnlbMF0gPSBjdXJyZW50O1xyXG4gICAgICAgICAgcmV0dXJuIG9yZGVyQnk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiBjdXJyZW50O1xyXG4gICAgICAgIH1cclxuICAgICAgICAqL1xyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIHRoaXMuZmlsdGVyRW50cnkgPSAkLlJVTEUoXCJmaWx0ZXJFbnRyeVwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgJC5PUihbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQuQ09OU1VNRShULmluKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkLkNPTlNVTUUoVC53aXRoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkLkNPTlNVTUUoVC5mb3IpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQuQ09OU1VNRShULnJlbGF0aW5nKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXSk7XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgdGhpcy5vcmRlckJ5ID0gJC5SVUxFKFwib3JkZXJCeVwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIG9wID0gdW5kZWZpbmVkO1xyXG4gICAgICAkLk9SKFtcclxuICAgICAgICB7XHJcbiAgICAgICAgQUxUOiAoKSA9PiB7XHJcbiAgICAgICAgICB2YXIgdG9rID0gJC5DT05TVU1FMShULm9yZGVyX2J5KVxyXG4gICAgICAgICAgb3AgPSBBU1QubWFrZU5vZGUoTlQuT1BPcmRlckJ5KTtcclxuICAgICAgICAgIG9wLmJlYXJlciA9IHRvaztcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBBTFQ6ICgpID0+IHtcclxuICAgICAgICB2YXIgdG9rID0gJC5DT05TVU1FMihULm9yZGVyX2Rlc2NlbmRpbmdfYnkpXHJcbiAgICAgICAgb3AgPSBBU1QubWFrZU5vZGUoTlQuT1BPcmRlckRlc2NlbmRpbmdCeSk7XHJcbiAgICAgICAgb3AuYmVhcmVyID0gdG9rO1xyXG4gICAgICB9XHJcbiAgICAgIH1dKTtcclxuICAgICAgdmFyIGNhdCA9ICQuQ09OU1VNRTMoVC5DQVQpO1xyXG4gICAgICB2YXIgbm9kZUNhdCA9IEFTVC5tYWtlTm9kZUZvckNhdChjYXQpO1xyXG4gICAgICBvcC5jaGlsZHJlblswXSA9IG5vZGVDYXQ7XHJcbiAgICAgIHJldHVybiBvcDtcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICB0aGlzLmRvbU9yRG9tYWluRG9tID0gJC5SVUxFKFwiZG9tT3JEb21haW5Eb21cIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICQuT1BUSU9OKCgpID0+ICQuQ09OU1VNRShULmRvbWFpbikpO1xyXG4gICAgICB2YXIgciA9ICQuQ09OU1VNRTIoVC5ET00pO1xyXG4gICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yRG9tYWluKHIpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5jYXRGaWx0ZXIgPSAkLlJVTEUoXCJjYXRGaWx0ZXJcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJC5TVUJSVUxFKCQuZmlsdGVyRW50cnkpO1xyXG4gICAgICAgIHZhciBkb20gPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgdmFyIGZpbHRlciA9IHVuZGVmaW5lZDtcclxuICAgICAgICAkLk9SKFt7XHJcbiAgICAgICAgICBBTFQ6ICgpID0+IHtcclxuICAgICAgICAgICAgICBkb20gPSAkLlNVQlJVTEUxKCQuZG9tT3JEb21haW5Eb20pO1xyXG4gICAgICAgICAgICAgICQuT1BUSU9OMigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAkLlNVQlJVTEUyKCQuZmlsdGVyRW50cnkpO1xyXG4gICAgICAgICAgICAgICAgZmlsdGVyID0gJC5TVUJSVUxFMygkLmNvbW1hQW5kTGlzdEZpbHRlcik7XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6ICgpID0+IHtcclxuICAgICAgICAgICAgZmlsdGVyID0gJC5TVUJSVUxFNCgkLmNvbW1hQW5kTGlzdEZpbHRlcik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIF0pO1xyXG4gICAgICAgIHJldHVybiBbZmlsdGVyLCBkb21dO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5jYXRlZ29yeUxpc3QgPSAkLlJVTEUoXCJjYXRlZ29yeUxpc3RcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgciA9IFtdO1xyXG4gICAgICAkLkFUX0xFQVNUX09ORSggKCkgPT4ge1xyXG4gICAgICAgICQuT1BUSU9OKCAoKSA9PiB7XHJcbiAgICAgICAgICAvLyQuQ09OU1VNRShULkNvbW1hKTtcclxuICAgICAgICAgICQuT1IoW3sgQUxUOiAoKT0+ICQuQ09OU1VNRShULkNvbW1hKX0sXHJcbiAgICAgICAgICAgIHsgQUxUOiAoKT0+ICQuQ09OU1VNRShULmFuZCl9LFxyXG4gICAgICAgICAgXSlcclxuICAgICAgICAgfSk7XHJcbiAgICAgICAgci5wdXNoKEFTVC5tYWtlTm9kZUZvckNhdCgkLkNPTlNVTUUoVC5DQVQpKSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICAvKlxyXG4gICAgICAkLkFUX0xFQVNUX09ORV9TRVAoe1xyXG4gICAgICAgIFNFUDogVC5Db21tYSwgREVGOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICByLnB1c2goQVNULm1ha2VOb2RlRm9yQ2F0KCQuQ09OU1VNRShULkNBVCkpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICAqL1xyXG4gICAgICB2YXIgcmVzID0gQVNULm1ha2VOb2RlKE5ULkxJU1QpO1xyXG4gICAgICByZXMuY2hpbGRyZW4gPSByO1xyXG4gICAgICByZXR1cm4gcmVzO1xyXG4gICAgfSk7XHJcblxyXG4gIHRoaXMucGxhaW5GYWN0ID0gJC5SVUxFKFwicGxhaW5GYWN0XCIsICgpID0+XHJcbiAgICBBU1QubWFrZU5vZGVGb3JGYWN0KCQuQ09OU1VNRShULkZBQ1QpKVxyXG4gICk7XHJcblxyXG4gIHRoaXMuZmFjdE9yQW55ID0gJC5SVUxFKFwiZmFjdE9yQW55XCIsICgpID0+XHJcbiAgICAkLk9SKFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvckZhY3QoJC5DT05TVU1FMShULkZBQ1QpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yQW55KCQuQ09OU1VNRTIoVC5BbkFOWSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIF0pXHJcbiAgKTtcclxuXHJcbiAgdGhpcy5mYWN0T3JBbnlPckludGVnZXIgPSAkLlJVTEUoXCJmYWN0T3JBbnlPckludGVnZXJcIiwgKCkgPT5cclxuICAkLk9SKFtcclxuICAgICAge1xyXG4gICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvckZhY3QoJC5DT05TVU1FMShULkZBQ1QpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHJldHVybiBBU1QubWFrZU5vZGVGb3JBbnkoJC5DT05TVU1FMihULkFuQU5ZKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yQW55KCQuQ09OU1VNRTMoVC5JbnRlZ2VyKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgXSlcclxuKTtcclxuXHJcbiAgdGhpcy5wcEZhY3RBbnkgPSAkLlJVTEUoXCJvcEZhY3RBbnlcIiwgZnVuY3Rpb24gKGhlYWQpIHtcclxuICAgIHJldHVybiAkLk9SKFtcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBBTFQ6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgdmFyIG9wID0gQVNULm1ha2VOb2RlKE5ULk9QRXFJbixoZWFkKTtcclxuICAgICAgICAgICAgICAgICAgdmFyIGZhY3QgPSAkLlNVQlJVTEUoJC5wbGFpbkZhY3QpO1xyXG4gICAgICAgICAgICAgICAgICBvcC5jaGlsZHJlbi5wdXNoKGZhY3QpO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gb3A7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBBTFQ6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgdmFyIG9wID0gJC5TVUJSVUxFMigkLmJpbmFyeVZhbE9wKTtcclxuICAgICAgICAgICAgICAgICAgb3AuY2hpbGRyZW4gPSBbaGVhZF07XHJcbiAgICAgICAgICAgICAgICAgIHZhciBmYWN0ID0gJC5TVUJSVUxFMygkLnBsYWluRmFjdCk7XHJcbiAgICAgICAgICAgICAgICAgIG9wLmNoaWxkcmVuLnB1c2goZmFjdCk7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBvcDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIEFMVDogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICB2YXIgb3AgPSAkLlNVQlJVTEU0KCQuYmluYXJ5RnJhZ09wKTtcclxuICAgICAgICAgICAgICAgICAgb3AuY2hpbGRyZW4gPSBbaGVhZF07XHJcbiAgICAgICAgICAgICAgICAgIHZhciBmYWN0T3JBbnlPckludGVnZXIgPSAkLlNVQlJVTEU1KCQuZmFjdE9yQW55T3JJbnRlZ2VyKTtcclxuICAgICAgICAgICAgICAgICAgb3AuY2hpbGRyZW4ucHVzaChmYWN0T3JBbnlPckludGVnZXIpO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gb3A7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgIF0pO1xyXG4gIH0pO1xyXG4gIC8vIFsgQ0FUPyBGQUNUIF1cclxuICAvLyBUT0RPIENBVCBPUCBDT05UQUlOUyBNQU5ZXHJcbiAgLy8gQ0FUIE9QIEZBQ1RcclxuICAvLyBGQUNUXHJcbiAgdGhpcy5Nb3JlVGhhbkxlc3NUaGFuRXhhY3RseSA9ICQuUlVMRShcIk1vcmVUaGFuTGVzc1RoYW5FeGFjdGx5XCIsIGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiAkLk9SKCBbICB7XHJcbiAgICAgICAgICBBTFQ6ICgpID0+IHtcclxuICAgICAgICAgICAgdmFyIHRvayA9ICQuQ09OU1VNRShULm1vcmVfdGhhbik7XHJcbiAgICAgICAgICAgIHZhciBvcCA9IEFTVC5tYWtlTm9kZShOVC5PUE1vcmVUaGFuKTtcclxuICAgICAgICAgICAgb3AuYmVhcmVyID0gdG9rO1xyXG4gICAgICAgICAgICB2YXIgdG9raSA9ICQuQ09OU1VNRShULkludGVnZXIpO1xyXG4gICAgICAgICAgICB2YXIgbnVtYmVyYXJnID0gQVNULm1ha2VOb2RlRm9ySW50ZWdlcih0b2tpKTtcclxuICAgICAgICAgICAgb3AuY2hpbGRyZW5bMF0gPSBudW1iZXJhcmc7XHJcbiAgICAgICAgICAgIHZhciB0b2tjID0gJC5DT05TVU1FKFQuQ0FUKTtcclxuICAgICAgICAgICAgdmFyIGNhdCA9IEFTVC5tYWtlTm9kZUZvckNhdCh0b2tjKTtcclxuICAgICAgICAgICAgb3AuY2hpbGRyZW5bMV0gPSBjYXQ7XHJcbiAgICAgICAgICAgIHJldHVybiBvcDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogKCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgdG9rID0gJC5DT05TVU1FKFQubGVzc190aGFuKTtcclxuICAgICAgICAgICAgdmFyIG9wID0gQVNULm1ha2VOb2RlKE5ULk9QTGVzc1RoYW4pO1xyXG4gICAgICAgICAgICBvcC5iZWFyZXIgPSB0b2s7XHJcbiAgICAgICAgICAgIHZhciB0b2tpID0gJC5DT05TVU1FMihULkludGVnZXIpO1xyXG4gICAgICAgICAgICB2YXIgbnVtYmVyYXJnID0gQVNULm1ha2VOb2RlRm9ySW50ZWdlcih0b2tpKTtcclxuICAgICAgICAgICAgb3AuY2hpbGRyZW5bMF0gPSBudW1iZXJhcmc7XHJcbiAgICAgICAgICAgIHZhciB0b2tjID0gJC5DT05TVU1FMihULkNBVCk7XHJcbiAgICAgICAgICAgIHZhciBjYXQgPSBBU1QubWFrZU5vZGVGb3JDYXQodG9rYyk7XHJcbiAgICAgICAgICAgIG9wLmNoaWxkcmVuWzFdID0gY2F0O1xyXG4gICAgICAgICAgICByZXR1cm4gb3A7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6ICgpID0+IHtcclxuICAgICAgICAgICAgdmFyIHRvayA9ICQuQ09OU1VNRShULmV4YWN0bHkpO1xyXG4gICAgICAgICAgICB2YXIgb3AgPSBBU1QubWFrZU5vZGUoTlQuT1BFeGFjdGx5KTtcclxuICAgICAgICAgICAgb3AuYmVhcmVyID0gdG9rO1xyXG4gICAgICAgICAgICB2YXIgdG9raSA9ICQuQ09OU1VNRTMoVC5JbnRlZ2VyKTtcclxuICAgICAgICAgICAgdmFyIG51bWJlcmFyZyA9IEFTVC5tYWtlTm9kZUZvckludGVnZXIodG9raSk7XHJcbiAgICAgICAgICAgIG9wLmNoaWxkcmVuWzBdID0gbnVtYmVyYXJnO1xyXG4gICAgICAgICAgICB2YXIgdG9rYyA9ICQuQ09OU1VNRTMoVC5DQVQpO1xyXG4gICAgICAgICAgICB2YXIgY2F0ID0gQVNULm1ha2VOb2RlRm9yQ2F0KHRva2MpO1xyXG4gICAgICAgICAgICBvcC5jaGlsZHJlblsxXSA9IGNhdDtcclxuICAgICAgICAgICAgcmV0dXJuIG9wO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciB0b2sgPSAkLkNPTlNVTUUoVC5leGlzdGluZyk7XHJcbiAgICAgICAgICAgIHZhciBvcCA9IEFTVC5tYWtlTm9kZShOVC5PUEV4aXN0aW5nKTtcclxuICAgICAgICAgICAgb3AuYmVhcmVyID0gdG9rO1xyXG4gICAgICAgICAgICB2YXIgdG9rYyA9ICQuQ09OU1VNRTQoVC5DQVQpO1xyXG4gICAgICAgICAgICB2YXIgY2F0ID0gQVNULm1ha2VOb2RlRm9yQ2F0KHRva2MpO1xyXG4gICAgICAgICAgICBvcC5jaGlsZHJlblswXSA9IGNhdDtcclxuICAgICAgICAgICAgcmV0dXJuIG9wO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciB0b2sgPSAkLkNPTlNVTUUoVC5ub3RfZXhpc3RpbmcpO1xyXG4gICAgICAgICAgICB2YXIgb3AgPSBBU1QubWFrZU5vZGUoTlQuT1BOb3RFeGlzdGluZyk7XHJcbiAgICAgICAgICAgIG9wLmJlYXJlciA9IHRvaztcclxuICAgICAgICAgICAgdmFyIHRva2MgPSAkLkNPTlNVTUU1KFQuQ0FUKTtcclxuICAgICAgICAgICAgdmFyIGNhdCA9IEFTVC5tYWtlTm9kZUZvckNhdCh0b2tjKTtcclxuICAgICAgICAgICAgb3AuY2hpbGRyZW5bMF0gPSBjYXQ7XHJcbiAgICAgICAgICAgIHJldHVybiBvcDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiAgICAgICAgLyosXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCAndG9rZW4gaW5kZXggaXMgJyArIFQubGVzc190aGFuICk7XHJcbiAgICAgICAgICAgIHZhciB0b2sgPSAkLkNPTlNVTUUyKFQubGVzc190aGFuKTtcclxuICAgICAgICAgICAgdmFyIG9wID0gQVNULm1ha2VOb2RlKE5ULk9QTW9yZVRoYW4pO1xyXG4gICAgICAgICAgICBvcC5iZWFyZXIgPSB0b2s7XHJcbiAgICAgICAgICAgIHZhciB0b2tpID0gJC5DT05TVU1FMyhULkFuQU5ZKTtcclxuICAgICAgICAgICAgdmFyIG51bWJlcmFyZyA9IEFTVC5tYWtlTm9kZUZvckludGVnZXIodG9raSk7XHJcbiAgICAgICAgICAgIG9wLmNoaWxkcmVuWzBdID0gbnVtYmVyYXJnO1xyXG4gICAgICAgICAgICB2YXIgdG9rYyA9ICQuQ09OU1VNRTMoVC5DQVQpO1xyXG4gICAgICAgICAgICB2YXIgY2F0ID0gQVNULm1ha2VOb2RlRm9yQ2F0KHRva2MpO1xyXG4gICAgICAgICAgICBvcC5jaGlsZHJlblsxXSA9IGNhdDtcclxuICAgICAgICAgICAgcmV0dXJuIG9wO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0qL1xyXG4gICAgICBdKTtcclxuICAgfSk7XHJcblxyXG5cclxuICAgdGhpcy5jYXRGYWN0ID0gJC5SVUxFKFwiY2F0RmFjdFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gJC5PUihbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciB0b2sgPSAkLkNPTlNVTUUoVC5DQVQpO1xyXG4gICAgICAgICAgICB2YXIgaGVhZCA9IEFTVC5tYWtlTm9kZUZvckNhdCh0b2spO1xyXG4gICAgICAgICAgICB2YXIgb3AgPSAkLlNVQlJVTEUoJC5vcEZhY3RBbnksIGhlYWQpO1xyXG4gICAgICAgICAgICBvcC5jaGlsZHJlblswXSA9IGhlYWQ7XHJcbiAgICAgICAgICAgIHJldHVybiBvcDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogKCkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gICQuU1VCUlVMRSgkLk1vcmVUaGFuTGVzc1RoYW5FeGFjdGx5KTtcclxuICAgICAgICAgICAgLypcclxuICAgICAgICAgICAgY29uc29sZS5sb2coICd0b2tlbiBpbmRleCBpcyAnICsgVC5tb3JlX3RoYW4gKTtcclxuICAgICAgICAgICAgdmFyIHRvayA9ICQuQ09OU1VNRShULm1vcmVfdGhhbik7XHJcbiAgICAgICAgICAgIHZhciBvcCA9IEFTVC5tYWtlTm9kZShOVC5PUE1vcmVUaGFuKTtcclxuICAgICAgICAgICAgb3AuYmVhcmVyID0gdG9rO1xyXG4gICAgICAgICAgICB2YXIgdG9raSA9ICQuQ09OU1VNRShULkludGVnZXIpO1xyXG4gICAgICAgICAgICB2YXIgbnVtYmVyYXJnID0gQVNULm1ha2VOb2RlRm9ySW50ZWdlcih0b2tpKTtcclxuICAgICAgICAgICAgb3AuY2hpbGRyZW5bMF0gPSBudW1iZXJhcmc7XHJcbiAgICAgICAgICAgIHZhciB0b2tjID0gJC5DT05TVU1FMihULkNBVCk7XHJcbiAgICAgICAgICAgIHZhciBjYXQgPSBBU1QubWFrZU5vZGVGb3JDYXQodG9rYyk7XHJcbiAgICAgICAgICAgIG9wLmNoaWxkcmVuWzFdID0gY2F0O1xyXG4gICAgICAgICAgICByZXR1cm4gb3A7XHJcbiAgICAgICAgICAgICovXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6ICgpID0+IHtcclxuICAgICAgICAgICAgdmFyIG9wID0gQVNULm1ha2VOb2RlKE5ULk9QRXFJbixcclxuICAgICAgICAgICAgICBBU1QubWFrZU5vZGUoQVNULkFTVE5vZGVUeXBlLkNBVFBIKSk7XHJcbiAgICAgICAgICAgIHZhciBmYWN0ID0gJC5TVUJSVUxFMigkLnBsYWluRmFjdCk7XHJcbiAgICAgICAgICAgIG9wLmNoaWxkcmVuLnB1c2goZmFjdCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvcDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIF0pO1xyXG4gICB9KTtcclxuXHJcbi8vXHJcblxyXG4gdGhpcy5jb21tYUFuZExpc3RGaWx0ZXIgPSAkLlJVTEUoXCJjb21tYUFuZExpc3RGaWx0ZXJcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgciA9IFskLlNVQlJVTEUoJC5jYXRGYWN0KV07XHJcbiAgICAgICQuTUFOWSggKCkgPT4ge1xyXG4gICAgICAgICQuT1BUSU9OKCAoKSA9PlxyXG4gICAgICAgICAgLy8kLkNPTlNVTUUoVC5Db21tYSkpO1xyXG4gICAgICAgICAgJC5PUiggW1xyXG4gICAgICAgICAgICB7IEFMVDogZnVuY3Rpb24oKSB7ICQuQ09OU1VNRShULkNvbW1hKTsgfX0sXHJcbiAgICAgICAgICAgIHsgQUxUOiBmdW5jdGlvbigpIHsgJC5DT05TVU1FKFQuYW5kKTsgfX0sIC8vIG5vdCBhIGxvZ2ljYWwgYW5kIHlldFxyXG4gICAgICAgICAgICB7IEFMVDogZnVuY3Rpb24oKSB7ICQuQ09OU1VNRShULm9yKTsgfX0sIC8vbm90IGxvZ2ljYWwgb3IgeWV0XHJcbiAgICAgICAgICAgIHsgQUxUOiBmdW5jdGlvbigpIHsgJC5DT05TVU1FKFQud2l0aCk7IH19XHJcbiAgICAgICAgICBdKVxyXG4gICAgICAgIClcclxuICAgICAgICByLnB1c2goJC5TVUJSVUxFMigkLmNhdEZhY3QpKTtcclxuICAgICAgfSk7XHJcbiAgICAgIC8vb25zb2xlLmxvZyhcImhlcmUgcHJvZHVjaW5nXCIgKyBKU09OLnN0cmluZ2lmeShuKSk7XHJcbiAgICAgIHZhciBuID0gIEFTVC5tYWtlTm9kZShOVC5MSVNUKTtcclxuICAgICAgbi5jaGlsZHJlbiA9IHI7XHJcbiAgICAgIHJldHVybiBuO1xyXG4gICAgfSk7XHJcbi8qXHJcbiAgdGhpcy5jb21tYUFuZExpc3RUYWlsID0gJC5SVUxFKFwiY29tbWFBbmRMaXN0VGFpbFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIC8vJC5TVUJSVUxFKCQuY2F0RmFjdCk7XHJcbiAgICAgICQuTUFOWSggKCkgPT4ge1xyXG4gICAgICAgICQuQ09OU1VNRShULkNvbW1hKTtcclxuICAgICAgICAvKiAkLk9SKCBbXHJcbiAgICAgICAgICB7IEFMVDogZnVuY3Rpb24oKSB7ICQuQ09OU1VNRShDb21tYSk7IH19LFxyXG4gICAgICAgICAgeyBBTFQ6IGZ1bmN0aW9uKCkgeyAkLkNPTlNVTUUoQW5kKTsgfX1cclxuICAgICAgICBdKTsgKiAvXHJcbiAgICAgICAgJC5TVUJSVUxFKCQuY2F0RmFjdCk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4geyBiOiA0NDUgfTtcclxuICAgIH0pO1xyXG4qL1xyXG4gICAgJC5SVUxFKFwidW5hcnlTZXRPcFwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICQuT1IoW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkLkNPTlNVTUUoVC5hbGwpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQuQ09OU1VNRShULmZpcnN0KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkLkNPTlNVTUUoVC5uZXdlc3QpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQuQ09OU1VNRShULm9sZGVzdCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJC5DT05TVU1FKFQubGF0ZXN0KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkLkNPTlNVTUUoVC5ldmVyeSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJC5DT05TVU1FKFQuYW55KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkLkNPTlNVTUUoVC5hdCk7XHJcbiAgICAgICAgICAgICQuQ09OU1VNRShULmxlYXN0KTtcclxuICAgICAgICAgICAgJC5DT05TVU1FKFQub25lKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJC5DT05TVU1FKFQubGFzdCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICBdKTtcclxuICB9KTtcclxuXHJcbiAgICAgJC5SVUxFKFwiYmluYXJ5VmFsT3BcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICByZXR1cm4gJC5PUihbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBBU1QubWFrZU5vZGVGb3JUb2tlbihOVC5PUEVRLCAkLkNPTlNVTUUxKFQuZXF1YWxzKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvclRva2VuKE5ULk9QRVEsICQuQ09OU1VNRTIoVC5pcykpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIF0pO1xyXG4gIH0pO1xyXG5cclxuICAkLlJVTEUoXCJiaW5hcnlGcmFnT3BcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gJC5PUihbXHJcbiAgICB7XHJcbiAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBBU1QubWFrZU5vZGVGb3JUb2tlbihOVC5PUENvbnRhaW5zLCAkLkNPTlNVTUUoVC5jb250YWlucykpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yVG9rZW4oTlQuT1BDb250YWlucywgJC5DT05TVU1FMShULmNvbnRhaW5pbmcpKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yVG9rZW4oTlQuT1BFbmRzV2l0aCwgJC5DT05TVU1FMihULmVuZHNfd2l0aCkpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHJldHVybiBBU1QubWFrZU5vZGVGb3JUb2tlbihOVC5PUEVuZHNXaXRoLCAkLkNPTlNVTUUzKFQuZW5kaW5nX3dpdGgpKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvclRva2VuKE5ULk9QU3RhcnRzV2l0aCwgJC5DT05TVU1FNChULnN0YXJ0aW5nX3dpdGgpKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvclRva2VuKE5ULk9QU3RhcnRzV2l0aCwgJC5DT05TVU1FNShULnN0YXJ0c193aXRoKSk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAkLlNVQlJVTEUyKCQub3BCaW5hcnlDb21wYXJlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIF0pO1xyXG59KTtcclxuXHJcbiQuUlVMRShcIm9wQmluYXJ5Q29tcGFyZVwiLCBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gJC5PUihbXHJcbiAge1xyXG4gICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBBU1QubWFrZU5vZGVGb3JUb2tlbihOVC5PUExULCAkLkNPTlNVTUUxKFQuTFQpKTtcclxuICAgIH1cclxuICB9LFxyXG4gIHtcclxuICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yVG9rZW4oTlQuT1BMRSwgJC5DT05TVU1FMihULkxFKSk7XHJcbiAgICB9XHJcbiAgfSxcclxuICB7XHJcbiAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvclRva2VuKE5ULk9QR1QsICQuQ09OU1VNRTMoVC5HVCkpO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAge1xyXG4gICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBBU1QubWFrZU5vZGVGb3JUb2tlbihOVC5PUEdFLCAkLkNPTlNVTUU0KFQuR0UpKTtcclxuICAgIH1cclxuICB9LFxyXG4gIHtcclxuICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yVG9rZW4oTlQuT1BFUSwgJC5DT05TVU1FNShULkVRKSk7XHJcbiAgICB9XHJcbiAgfSxcclxuICB7XHJcbiAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgLy8gZGVsaWJlcmF0ZSByZWNhc3QsKCAoIG5vdCBsZXNzIHRoYW4gMyBDQVQgIClcclxuICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvclRva2VuKE5ULk9QTFQsICQuQ09OU1VNRTMoVC5sZXNzX3RoYW4pKTtcclxuICAgIH1cclxuICB9LFxyXG4gIHtcclxuICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAvLyBkZWxpYmVyYXRlIHJlY2FzdCFcclxuICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvclRva2VuKE5ULk9QR1QsICQuQ09OU1VNRTQoVC5tb3JlX3RoYW4pKTtcclxuICAgIH1cclxuICB9LFxyXG4gIHtcclxuICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yVG9rZW4oTlQuT1BORSwgJC5DT05TVU1FNShULk5FKSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIF0pO1xyXG59KTtcclxuXHJcblxyXG4vLy8gV2hlcmUgIEZpcnN0IChDQVQgIEdFICBYICApXHJcblxyXG4vKlxyXG4gICAgJC5SVUxFKFwiY2F0U2V0RXhwcmVzc2lvblwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgJC5PUFRJT04oJC5TVUJSVUxFKCQudW5hcnlTZXRPcCkpO1xyXG4gICAgICAkLkNPTlNVTUUoVC5DQVQpO1xyXG4gICAgfSlcclxuKi9cclxuICAgIC8vICBsb3dlc3QgcHJlY2VkZW5jZSB0aHVzIGl0IGlzIGZpcnN0IGluIHRoZSBydWxlIGNoYWluXHJcbiAgICAvLyBUaGUgcHJlY2VkZW5jZSBvZiBiaW5hcnkgZXhwcmVzc2lvbnMgaXMgZGV0ZXJtaW5lZCBieSBob3cgZmFyIGRvd24gdGhlIFBhcnNlIFRyZWVcclxuICAgIC8vIFRoZSBiaW5hcnkgZXhwcmVzc2lvbiBhcHBlYXJzLlxyXG5cclxuICAgIC8qXHJcbiAgICAkLlJVTEUoXCJmaWx0ZXJFeHByZXNzaW9uXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciB2YWx1ZSwgb3AsIHJoc1ZhbDtcclxuXHJcbiAgICAgICAgLy8gcGFyc2luZyBwYXJ0XHJcbiAgICAgICAgdmFsdWUgPSAkLlNVQlJVTEUoJC5jYXRTZXRFeHByZXNzaW9uKTtcclxuICAgICAgICAkLk9SKFsgeyBBTFQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgJC5BVF9MRUFTVF9PKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgIC8vIGNvbnN1bWluZyAnQWRkaXRpb25PcGVyYXRvcicgd2lsbCBjb25zdW1lIGVpdGhlciBQbHVzIG9yIE1pbnVzIGFzIHRoZXkgYXJlIHN1YmNsYXNzZXMgb2YgQWRkaXRpb25PcGVyYXRvclxyXG4gICAgICAgICAgICAgIG9wID0gJC5TVUJSVUxFMSgkLmJpbmFyeVZhbE9wKTtcclxuICAgICAgICAgICAgICAvLyAgdGhlIGluZGV4IFwiMlwiIGluIFNVQlJVTEUyIGlzIG5lZWRlZCB0byBpZGVudGlmeSB0aGUgdW5pcXVlIHBvc2l0aW9uIGluIHRoZSBncmFtbWFyIGR1cmluZyBydW50aW1lXHJcbiAgICAgICAgICAgICAgcmhzVmFsID0gJC5DT05TVU1FKFQuQUZhY3QpO1xyXG4gICAgICAgICAgICAgIC8vIFRPRE8gbG9naWNhbCBleHByXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9fSxcclxuICAgICAgICB7IEFMVDogZnVuY3Rpb24oKSB7ICQuQ09OU1VNRTIoVC5BRmFjdCk7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXSk7XHJcbiAgICB9KTtcclxuICAgICovXHJcblxyXG4vKlxyXG4gICAgJC5SVUxFKFwieGF0b21pY0V4cHJlc3Npb25cIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICQuT1IoW1xyXG4gICAgICAgICAgICAvLyBwYXJlbnRoZXNpc0V4cHJlc3Npb24gaGFzIHRoZSBoaWdoZXN0IHByZWNlZGVuY2UgYW5kIHRodXMgaXQgYXBwZWFyc1xyXG4gICAgICAgICAgICAvLyBpbiB0aGUgXCJsb3dlc3RcIiBsZWFmIGluIHRoZSBleHByZXNzaW9uIFBhcnNlVHJlZS5cclxuICAgICAgICAgICAge0FMVDogZnVuY3Rpb24oKSB7IHJldHVybiAkLlNVQlJVTEUoJC5wYXJlbnRoZXNpc0V4cHJlc3Npb24pfX0sXHJcbiAgICAgICAgICAgIHtBTFQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gcGFyc2VJbnQoJC5DT05TVU1FKFQuSW50ZWdlcikuaW1hZ2UsIDEwKX19LFxyXG4gICAgICAgICAgICB7QUxUOiBmdW5jdGlvbigpIHsgcmV0dXJuICQuU1VCUlVMRSgkLnBvd2VyRnVuY3Rpb24pfX1cclxuICAgICAgICBdKTtcclxuICAgIH0pO1xyXG4qL1xyXG5cclxuLypcclxuICAgICQuUlVMRShcInBhcmVudGhlc2lzRXhwcmVzc2lvblwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgZXhwVmFsdWU7XHJcbiAgICAgICAgJC5DT05TVU1FKFQuTFBhcmVuKTtcclxuICAgICAgICBleHBWYWx1ZSA9ICQuU1VCUlVMRSgkLmV4cHJlc3Npb24pO1xyXG4gICAgICAgICQuQ09OU1VNRShULlJQYXJlbik7XHJcbiAgICAgICAgcmV0dXJuIGV4cFZhbHVlXHJcbiAgICB9KTtcclxuKi9cclxuLypcclxuXHJcbiAgICB0aGlzLnNlbGVjdENsYXVzZSA9ICQuUlVMRShcInNlbGVjdENsYXVzZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQuQ09OU1VNRShULnNlbGVjdCk7XHJcbiAgICAgICQuQVRfTEVBU1RfT05FX1NFUCh7XHJcbiAgICAgICAgU0VQOiBULkNvbW1hLCBERUY6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICQuQ09OU1VNRShULklkZW50aWZpZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiB7IGI6IDQ0NSB9O1xyXG4gICAgfSk7XHJcbiovXHJcblxyXG4vKlxyXG4gICAgdGhpcy5mcm9tQ2xhdXNlID0gJC5SVUxFKFwiZnJvbUNsYXVzZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQuQ09OU1VNRShULmZyb20pO1xyXG4gICAgICAkLkNPTlNVTUUoVC5JZGVudGlmaWVyKTtcclxuXHJcbiAgICAgIC8vIGV4YW1wbGU6XHJcbiAgICAgIC8vIHJlcGxhY2UgdGhlIGNvbnRlbnRzIG9mIHRoaXMgcnVsZSB3aXRoIHRoZSBjb21tZW50ZWQgb3V0IGxpbmVzXHJcbiAgICAgIC8vIGJlbG93IHRvIGltcGxlbWVudCBtdWx0aXBsZSB0YWJsZXMgdG8gc2VsZWN0IGZyb20gKGltcGxpY2l0IGpvaW4pLlxyXG5cclxuICAgICAgLy8gJC5DT05TVU1FKEZyb20pO1xyXG4gICAgICAvLyAkLkFUX0xFQVNUX09ORV9TRVAoe1xyXG4gICAgICAvLyAgIFNFUDogQ29tbWEsIERFRjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAvLyAgICAgJC5DT05TVU1FKElkZW50aWZpZXIpO1xyXG4gICAgICAvLyAgIH1cclxuICAgICAgLy8gfSk7XHJcbiAgICB9KTtcclxuKi9cclxuXHJcbiAgICB0aGlzLmZpZWxkTGlzdCA9ICQuUlVMRShcImZpZWxkTGlzdFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciByZXMgPSBbXTtcclxuICAgICAgJC5BVF9MRUFTVF9PTkVfU0VQKHtcclxuICAgICAgICBTRVA6IFQuQ29tbWEsIERFRiA6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICB2YXIgYXRvayA9ICAkLkNPTlNVTUUoVC5DQVQpO1xyXG4gICAgICAgICAgLy8gY29uc29sZS5sb2coXCJ0b2tlbiBcIiArIEpTT04uc3RyaW5naWZ5KGF0b2spKTtcclxuICAgICAgICAgICByZXMucHVzaChhdG9rKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gcmVzO1xyXG4gICAgfSk7XHJcblxyXG4vKlxyXG4gICAgdGhpcy53aGVyZUNsYXVzZSA9ICQuUlVMRShcIndoZXJlQ2xhdXNlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgJC5DT05TVU1FKFQud2hlcmUpXHJcbiAgICAgICQuU1VCUlVMRSgkLmV4cHJlc3Npb24pXHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgdGhpcy5leHByZXNzaW9uID0gJC5SVUxFKFwiZXhwcmVzc2lvblwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQuU1VCUlVMRSgkLmF0b21pY0V4cHJlc3Npb24pO1xyXG4gICAgICAkLlNVQlJVTEUoJC5yZWxhdGlvbmFsT3BlcmF0b3IpO1xyXG4gICAgICAkLlNVQlJVTEUyKCQuYXRvbWljRXhwcmVzc2lvbik7IC8vIG5vdGUgdGhlICcyJyBzdWZmaXggdG8gZGlzdGluZ3Vpc2hcclxuICAgICAgICAgICAgICAgICAgICAgIC8vIGZyb20gdGhlICdTVUJSVUxFKGF0b21pY0V4cHJlc3Npb24pJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gMiBsaW5lcyBhYm92ZS5cclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICB0aGlzLmF0b21pY0V4cHJlc3Npb24gPSAkLlJVTEUoXCJhdG9taWNFeHByZXNzaW9uXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgJC5PUihbXHJcbiAgICAgICAge0FMVDogZnVuY3Rpb24gKCkgeyAkLkNPTlNVTUUoVC5JbnRlZ2VyKX19LFxyXG4gICAgICAgIHtBTFQ6IGZ1bmN0aW9uICgpIHsgJC5DT05TVU1FKFQuSWRlbnRpZmllcil9fVxyXG4gICAgICBdKTtcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICB0aGlzLnJlbGF0aW9uYWxPcGVyYXRvciA9ICQuUlVMRShcInJlbGF0aW9uYWxPcGVyYXRvclwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQuT1IoW1xyXG4gICAgICAgIHtBTFQ6IGZ1bmN0aW9uICgpIHsgJC5DT05TVU1FKFQuR1QpfX0sXHJcbiAgICAgICAge0FMVDogZnVuY3Rpb24gKCkgeyAkLkNPTlNVTUUoVC5MVCl9fVxyXG4gICAgICBdKTtcclxuICAgIH0pO1xyXG4qL1xyXG4gICAgLy8gdmVyeSBpbXBvcnRhbnQgdG8gY2FsbCB0aGlzIGFmdGVyIGFsbCB0aGUgcnVsZXMgaGF2ZSBiZWVuIGRlZmluZWQuXHJcbiAgICAvLyBvdGhlcndpc2UgdGhlIHBhcnNlciBtYXkgbm90IHdvcmsgY29ycmVjdGx5IGFzIGl0IHdpbGwgbGFjayBpbmZvcm1hdGlvblxyXG4gICAgLy8gZGVyaXZlZCBkdXJpbmcgdGhlIHNlbGYgYW5hbHlzaXMgcGhhc2UuXHJcbiAgICAoUGFyc2VyIGFzIGFueSkucGVyZm9ybVNlbGZBbmFseXNpcyh0aGlzKTtcclxuICB9XHJcblxyXG4gIFNlbGVjdFBhcnNlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBhcnNlci5wcm90b3R5cGUpO1xyXG4gIFNlbGVjdFBhcnNlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTZWxlY3RQYXJzZXI7XHJcblxyXG4vL1xyXG5leHBvcnQge1xyXG4gICBTZWxlY3RMZXhlcixcclxuICAgU2VsZWN0UGFyc2VyXHJcbiAgIC8vIGRlZmF1bHRSdWxlIDogXCJzZWxlY3RTdGF0ZW1lbnRcIlxyXG59O1xyXG4iXX0=
