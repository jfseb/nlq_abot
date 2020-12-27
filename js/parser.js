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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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LFlBQVksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDekQsWUFBWSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEdBQUcsWUFBWSxDQUFDIiwiZmlsZSI6InBhcnNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xyXG5cclxuLy8gYmFzZWQgb246IGh0dHA6Ly9lbi53aWtpYm9va3Mub3JnL3dpa2kvQWxnb3JpdGhtX2ltcGxlbWVudGF0aW9uL1N0cmluZ3MvTGV2ZW5zaHRlaW5fZGlzdGFuY2VcclxuLy8gYW5kOiAgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9EYW1lcmF1JUUyJTgwJTkzTGV2ZW5zaHRlaW5fZGlzdGFuY2VcclxuXHJcblxyXG5pbXBvcnQgKiBhcyBjaGV2cm90YWluIGZyb20gJ2NoZXZyb3RhaW4nO1xyXG5pbXBvcnQgKiBhcyBBU1QgZnJvbSAnLi9hc3QnO1xyXG5cclxuaW1wb3J0IHsgQVNUTm9kZVR5cGUgYXMgTlR9IGZyb20gJy4vYXN0JztcclxuXHJcbiAgLy8gV3JpdHRlbiBEb2NzIGZvciB0aGlzIHR1dG9yaWFsIHN0ZXAgY2FuIGJlIGZvdW5kIGhlcmU6XHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL1NBUC9jaGV2cm90YWluL2Jsb2IvbWFzdGVyL2RvY3MvdHV0b3JpYWwvc3RlcDJfcGFyc2luZy5tZFxyXG5cclxuICAvLyBUdXRvcmlhbCBTdGVwIDI6XHJcblxyXG4gIC8vIEFkZGluZyBhIFBhcnNlciAoZ3JhbW1hciBvbmx5LCBvbmx5IHJlYWRzIHRoZSBpbnB1dFxyXG4gIC8vIHdpdGhvdXQgYW55IGFjdGlvbnMpIHVzaW5nIHRoZSBUb2tlbnMgZGVmaW5lZCBpbiB0aGUgcHJldmlvdXMgc3RlcC5cclxuICAvLyBtb2RpZmljYXRpb24gdG8gdGhlIGdyYW1tYXIgd2lsbCBiZSBkaXNwbGF5ZWQgaW4gdGhlIHN5bnRheCBkaWFncmFtcyBwYW5lbC5cclxuXHJcbiAgdmFyIGNyZWF0ZVRva2VuID0gY2hldnJvdGFpbi5jcmVhdGVUb2tlbjtcclxuICB2YXIgTGV4ZXIgPSBjaGV2cm90YWluLkxleGVyO1xyXG4gIHZhciBQYXJzZXIgPSBjaGV2cm90YWluLlBhcnNlcjtcclxuXHJcbiAgdmFyIFdoaXRlU3BhY2UgPSBjcmVhdGVUb2tlbih7bmFtZTogXCJXaGl0ZVNwYWNlXCIsIHBhdHRlcm46IC9cXHMrL30pO1xyXG5cclxuICBXaGl0ZVNwYWNlLkdST1VQID0gTGV4ZXIuU0tJUFBFRDtcclxuXHJcblxyXG5pbXBvcnQgeyBUb2tlbnMgYXMgVH0gIGZyb20gJy4vdG9rZW5zJztcclxuICAvLyB3aGl0ZXNwYWNlIGlzIG5vcm1hbGx5IHZlcnkgY29tbW9uIHNvIGl0IGlzIHBsYWNlZCBmaXJzdCB0byBzcGVlZCB1cCB0aGUgbGV4ZXJcclxuICB2YXIgYWxsVG9rZW5zID0gT2JqZWN0LmtleXMoVCkubWFwKGtleSA9PiBUW2tleV0pO1xyXG4gIC8qIFsgRkFDVCwgQW5kLFxyXG4gICAgRGVzY3JpYmUsXHJcbiAgICBGaXJzdCwgT2xkZXN0LCBMYXRlc3QsIFdoYXQsXHJcbiAgICBBdCwgRXZlcnksIEFsbCwgQXQsIExlYXN0LCBPbmUsXHJcbiAgICBUaGUsXHJcbiAgICBMUGFyZW4sIFJQYXJlbixcclxuXHJcblxyXG4gICBNZWFuaW5nLCBPZiwgQXJlLCAgSW4sIEFib3V0LCBZb3UsIEFsbCxcclxuICBXaGl0ZVNwYWNlLCBTZWxlY3QsIEZyb20sIFdoZXJlLCBDb21tYSwgQUNhdGVnb3J5LCBBbGwsXHJcbiAgICBMaXN0LCBJZGVudGlmaWVyLCBJbnRlZ2VyLCBHcmVhdGVyVGhhbiwgTGVzc1RoYW4sIFRvLCBSZWxhdGluZywgV2l0aF07XHJcbiovXHJcbiAgICB2YXIgU2VsZWN0TGV4ZXIgPSBuZXcgTGV4ZXIoYWxsVG9rZW5zKTtcclxuXHJcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0gcGFyc2VyIC0tLS0tLS0tLS0tLS0tLS0tXHJcbmZ1bmN0aW9uIFNlbGVjdFBhcnNlcihpbnB1dCkge1xyXG4gICAgLy8gQnkgZGVmYXVsdCBpZiB7cmVjb3ZlcnlFbmFibGVkOiB0cnVlfSBpcyBub3QgcGFzc2VkIGluIHRoZSBjb25maWcgb2JqZWN0XHJcbiAgICAvLyBlcnJvciByZWNvdmVyeSAvIGZhdWx0IHRvbGVyYW5jZSBjYXBhYmlsaXRpZXMgd2lsbCBiZSBkaXNhYmxlZFxyXG4gICAgdmFyIHUgPSBQYXJzZXIuY2FsbCh0aGlzLCBpbnB1dCwgYWxsVG9rZW5zLCB7XHJcbiAgICAgLy8gYXV0cHV0Q3N0OiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICAvL2NvbnNvbGUubG9nKHUpO1xyXG4gICAgdmFyICQgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMubGlzdEFsbCA9ICQuUlVMRSgnbGlzdEFsbCcsICgpID0+IHtcclxuICAgICAgJC5DT05TVU1FKFQubGlzdCk7XHJcbiAgICAgICQuT1BUSU9OKCgpID0+XHJcbiAgICAgICAgJC5DT05TVU1FKFQuYWxsKVxyXG4gICAgICApO1xyXG4gICAgICB2YXIgcmVzRmllbGRMaXN0ID0gJC5TVUJSVUxFKCQuZmllbGRMaXN0KVxyXG4gICAgICByZXR1cm4gcmVzRmllbGRMaXN0O1xyXG4gICAgfSk7XHJcblxyXG4vKlxyXG4gICAgdGhpcy5pbkRvbWFpbiA9ICQuUlVMRSgnaW5Eb21haW4nLCAoKSA9PiB7XHJcbiAgICAgICQuQ09OU1VNRShULmluKTtcclxuICAgICAgJC5DT05TVU1FKFQuZG9tYWluKTtcclxuICAgICAgJC5DT05TVU1FKFQuQURvbWFpbik7XHJcbiAgICB9KTtcclxuKi9cclxuLypcclxuICAgIHRoaXMuc2VsZWN0U3RhdGVtZW50ID0gJC5SVUxFKFwic2VsZWN0U3RhdGVtZW50XCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgJC5TVUJSVUxFKCQuc2VsZWN0Q2xhdXNlKVxyXG4gICAgICAkLlNVQlJVTEUoJC5mcm9tQ2xhdXNlKVxyXG4gICAgICAkLk9QVElPTihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJC5TVUJSVUxFKCQud2hlcmVDbGF1c2UpXHJcbiAgICAgIH0pO1xyXG4gICAgICAvL2NvbnNvbGUubG9nKCdyZXR1cm5pbmcnKTtcclxuICAgICAgcmV0dXJuIHsgYTogMTIzIH07XHJcbiAgICB9KTtcclxuKi9cclxuXHJcbiAgICB0aGlzLmFsbENsYXVzZSA9ICQuUlVMRSgnYWxsQ2xhdXNlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICQuU1VCUlVMRSgkLmNhdExpc3RPcE1vcmUpO1xyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIHRoaXMub3BDYXQgPSAkLlJVTEUoJ29wQ2F0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICQuT1IoW1xyXG4gICAgICAgIHtBTFQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gQVNULm1ha2VOb2RlRm9yVG9rZW4oTlQuT1BGaXJzdCwgJC5DT05TVU1FKFQuZmlyc3QpKTt9fSxcclxuICAgICAgICB7QUxUOiBmdW5jdGlvbigpIHsgcmV0dXJuIEFTVC5tYWtlTm9kZUZvclRva2VuKE5ULk9QT2xkZXN0LCAkLkNPTlNVTUUoVC5vbGRlc3QpKTt9fSxcclxuICAgICAgICB7QUxUOiBmdW5jdGlvbigpIHsgcmV0dXJuIEFTVC5tYWtlTm9kZUZvclRva2VuKE5ULk9QTmV3ZXN0LCQuQ09OU1VNRShULmxhdGVzdCkpO319LFxyXG4gICAgICAgIHtBTFQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gQVNULm1ha2VOb2RlRm9yVG9rZW4oTlQuT1BOZXdlc3QsJC5DT05TVU1FKFQubmV3ZXN0KSk7fX1cclxuICAgICAgXSlcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuY2F0TGlzdE9wTW9yZSA9ICQuUlVMRShcImNhdExpc3RPcE1vcmVcIiwgZnVuY3Rpb24oKSA6IEFTVC5BU1ROb2RlIHtcclxuICAgICAgIHZhciByID0gdW5kZWZpbmVkIGFzIEFTVC5BU1ROb2RlO1xyXG4gICAgICAgJC5PUFRJT04oKCkgPT5cclxuICAgICAgICAgIHIgPSAkLlNVQlJVTEUoJC5vcENhdClcclxuICAgICAgICk7XHJcbiAgICAgICByID0gciB8fCBBU1QubWFrZU5vZGUoTlQuT1BBbGwpO1xyXG4gICAgICAgdmFyIGNhdExpc3QgPSAkLlNVQlJVTEUyKCQuY2F0ZWdvcnlMaXN0KTtcclxuICAgICAgIHIuY2hpbGRyZW4gPSBbY2F0TGlzdF07XHJcbiAgICAgICB2YXIgaW5vcCA9ICQuT1BUSU9OMigoKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBvcCA9ICQuU1VCUlVMRTMoJC5iaW5hcnlGcmFnT3ApO1xyXG4gICAgICAgICAgICB2YXIgaGVhZCA9IGNhdExpc3QuY2hpbGRyZW5bY2F0TGlzdC5jaGlsZHJlbi5sZW5ndGgtMV07XHJcbiAgICAgICAgICAgICAgb3AuY2hpbGRyZW4gPSBbaGVhZF07XHJcbiAgICAgICAgICAgIHZhciBmYWN0T3JBbnkgPSAkLlNVQlJVTEU0KCQuZmFjdE9yQW55KTtcclxuICAgICAgICAgICAgb3AuY2hpbGRyZW4ucHVzaChmYWN0T3JBbnkpO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gb3A7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICB2YXIgcmVzID0gJC5TVUJSVUxFKCQuY2F0TGlzdFRhaWwpO1xyXG4gICAgICAgdmFyIGZpbHRlckRvbSA9IHJlc1swXTtcclxuICAgICAgIHZhciBmaWx0ZXIgPSAoZmlsdGVyRG9tIHx8IFtdKVswXTtcclxuICAgICAgIGlmKCFmaWx0ZXIgJiYgaW5vcCkge1xyXG4gICAgICAgICAgdmFyIG4gPSAgQVNULm1ha2VOb2RlKE5ULkxJU1QpO1xyXG4gICAgICAgICAgbi5jaGlsZHJlbiA9IFtpbm9wXTtcclxuICAgICAgICAgIGZpbHRlciA9IG47XHJcbiAgICAgICB9IGVsc2UgaWYoaW5vcCkge1xyXG4gICAgICAgICAgZmlsdGVyLmNoaWxkcmVuLnVuc2hpZnQoaW5vcCk7XHJcbiAgICAgICB9XHJcbiAgICAgICB2YXIgb3JkZXJCeSA9IHJlc1sxXTtcclxuICAgICAgIGlmICggb3JkZXJCeSApXHJcbiAgICAgICAgIGZpbHRlci5jaGlsZHJlbi5wdXNoKG9yZGVyQnkpO1xyXG4gICAgICAgdmFyIGRvbSA9IChmaWx0ZXJEb20gfHwgW10pWzFdO1xyXG4gICAgICAgdmFyIGN1cnJlbnQgPSAoZG9tKSA/XHJcbiAgICAgICAgICAgQVNULm1ha2VOb2RlKE5ULkJJTk9QLCByLCBmaWx0ZXIsIGRvbSlcclxuICAgICAgICA6ICBBU1QubWFrZU5vZGUoTlQuQklOT1AsciwgZmlsdGVyKTtcclxuICAgICAgIHJldHVybiBjdXJyZW50O1xyXG4gICAgICAgLypcclxuICAgICAgIHZhciBmaWx0ZXJEb20gPSB1bmRlZmluZWQ7XHJcbiAgICAgICAkLk9QVElPTjMoKCkgPT4gZmlsdGVyRG9tID0gJC5TVUJSVUxFNSgkLmNhdEZpbHRlcikpO1xyXG4gICAgICAgdmFyIGZpbHRlciA9IChmaWx0ZXJEb20gfHwgW10pWzBdO1xyXG5cclxuICAgICAgIGlmKCFmaWx0ZXIgJiYgaW5vcCkge1xyXG4gICAgICAgICAgdmFyIG4gPSAgQVNULm1ha2VOb2RlKE5ULkxJU1QpO1xyXG4gICAgICAgICAgbi5jaGlsZHJlbiA9IFtpbm9wXTtcclxuICAgICAgICAgIGZpbHRlciA9IG47XHJcbiAgICAgICB9IGVsc2UgaWYoaW5vcCkge1xyXG4gICAgICAgICAgZmlsdGVyLmNoaWxkcmVuLnVuc2hpZnQoaW5vcCk7XHJcbiAgICAgICB9XHJcbiAgICAgICB2YXIgb3JkZXJCeSA9IHVuZGVmaW5lZDtcclxuICAgICAgICQuT1BUSU9ONCgoKSA9PiBvcmRlckJ5ID0gJC5TVUJSVUxFNigkLm9yZGVyQnkpKTtcclxuXHJcbiAgICAgICB2YXIgZG9tID0gKGZpbHRlckRvbSB8fCBbXSlbMV07XHJcbiAgICAgICB2YXIgY3VycmVudCA9IChkb20pID9cclxuICAgICAgICAgICBBU1QubWFrZU5vZGUoTlQuQklOT1AsIHIsIGZpbHRlciwgZG9tKVxyXG4gICAgICAgIDogIEFTVC5tYWtlTm9kZShOVC5CSU5PUCxyLCBmaWx0ZXIpO1xyXG4gICAgICAgaWYob3JkZXJCeSkge1xyXG4gICAgICAgICAgb3JkZXJCeVswXSA9IGN1cnJlbnQ7XHJcbiAgICAgICAgICByZXR1cm4gb3JkZXJCeTtcclxuICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgIHJldHVybiBjdXJyZW50O1xyXG4gICAgICAgfVxyXG4gICAgICAgKi9cclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuY2F0TGlzdFRhaWwgPSAkLlJVTEUoXCJjYXRMaXN0VGFpbFwiLCBmdW5jdGlvbigpIDogQVNULkFTVE5vZGVbXSB7XHJcbiAgICAgICAgdmFyIGZpbHRlckRvbSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAkLk9QVElPTjMoKCkgPT4gZmlsdGVyRG9tID0gJC5TVUJSVUxFMSgkLmNhdEZpbHRlcikpO1xyXG4gICAgICAgIHZhciBmaWx0ZXIgPSAoZmlsdGVyRG9tIHx8IFtdKVswXTtcclxuICAgICAgICB2YXIgb3JkZXJCeSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAkLk9QVElPTjQoKCkgPT4gb3JkZXJCeSA9ICQuU1VCUlVMRTIoJC5vcmRlckJ5KSk7XHJcbiAgICAgICAgcmV0dXJuIFsgZmlsdGVyRG9tLCBvcmRlckJ5IF07XHJcbiAgICAgICAgLypcclxuICAgICAgICBpZighZmlsdGVyICYmIGlub3ApIHtcclxuICAgICAgICAgIHZhciBuID0gIEFTVC5tYWtlTm9kZShOVC5MSVNUKTtcclxuICAgICAgICAgIG4uY2hpbGRyZW4gPSBbaW5vcF07XHJcbiAgICAgICAgICBmaWx0ZXIgPSBuO1xyXG4gICAgICAgIH0gZWxzZSBpZihpbm9wKSB7XHJcbiAgICAgICAgICBmaWx0ZXIuY2hpbGRyZW4udW5zaGlmdChpbm9wKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIG9yZGVyQnkgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgJC5PUFRJT040KCgpID0+IG9yZGVyQnkgPSAkLlNVQlJVTEU2KCQub3JkZXJCeSkpO1xyXG5cclxuICAgICAgICB2YXIgZG9tID0gKGZpbHRlckRvbSB8fCBbXSlbMV07XHJcbiAgICAgICAgdmFyIGN1cnJlbnQgPSAoZG9tKSA/XHJcbiAgICAgICAgICAgIEFTVC5tYWtlTm9kZShOVC5CSU5PUCwgciwgZmlsdGVyLCBkb20pXHJcbiAgICAgICAgOiAgQVNULm1ha2VOb2RlKE5ULkJJTk9QLHIsIGZpbHRlcik7XHJcbiAgICAgICAgaWYob3JkZXJCeSkge1xyXG4gICAgICAgICAgb3JkZXJCeVswXSA9IGN1cnJlbnQ7XHJcbiAgICAgICAgICByZXR1cm4gb3JkZXJCeTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuIGN1cnJlbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICovXHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgdGhpcy5maWx0ZXJFbnRyeSA9ICQuUlVMRShcImZpbHRlckVudHJ5XCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAkLk9SKFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJC5DT05TVU1FKFQuaW4pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQuQ09OU1VNRShULndpdGgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQuQ09OU1VNRShULmZvcik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJC5DT05TVU1FKFQucmVsYXRpbmcpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBdKTtcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICB0aGlzLm9yZGVyQnkgPSAkLlJVTEUoXCJvcmRlckJ5XCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgb3AgPSB1bmRlZmluZWQ7XHJcbiAgICAgICQuT1IoW1xyXG4gICAgICAgIHtcclxuICAgICAgICBBTFQ6ICgpID0+IHtcclxuICAgICAgICAgIHZhciB0b2sgPSAkLkNPTlNVTUUxKFQub3JkZXJfYnkpXHJcbiAgICAgICAgICBvcCA9IEFTVC5tYWtlTm9kZShOVC5PUE9yZGVyQnkpO1xyXG4gICAgICAgICAgb3AuYmVhcmVyID0gdG9rO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIEFMVDogKCkgPT4ge1xyXG4gICAgICAgIHZhciB0b2sgPSAkLkNPTlNVTUUyKFQub3JkZXJfZGVzY2VuZGluZ19ieSlcclxuICAgICAgICBvcCA9IEFTVC5tYWtlTm9kZShOVC5PUE9yZGVyRGVzY2VuZGluZ0J5KTtcclxuICAgICAgICBvcC5iZWFyZXIgPSB0b2s7XHJcbiAgICAgIH1cclxuICAgICAgfV0pO1xyXG4gICAgICB2YXIgY2F0ID0gJC5DT05TVU1FMyhULkNBVCk7XHJcbiAgICAgIHZhciBub2RlQ2F0ID0gQVNULm1ha2VOb2RlRm9yQ2F0KGNhdCk7XHJcbiAgICAgIG9wLmNoaWxkcmVuWzBdID0gbm9kZUNhdDtcclxuICAgICAgcmV0dXJuIG9wO1xyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIHRoaXMuZG9tT3JEb21haW5Eb20gPSAkLlJVTEUoXCJkb21PckRvbWFpbkRvbVwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgJC5PUFRJT04oKCkgPT4gJC5DT05TVU1FKFQuZG9tYWluKSk7XHJcbiAgICAgIHZhciByID0gJC5DT05TVU1FMihULkRPTSk7XHJcbiAgICAgIHJldHVybiBBU1QubWFrZU5vZGVGb3JEb21haW4ocik7XHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLmNhdEZpbHRlciA9ICQuUlVMRShcImNhdEZpbHRlclwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAkLlNVQlJVTEUoJC5maWx0ZXJFbnRyeSk7XHJcbiAgICAgICAgdmFyIGRvbSA9IHVuZGVmaW5lZDtcclxuICAgICAgICB2YXIgZmlsdGVyID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICQuT1IoW3tcclxuICAgICAgICAgIEFMVDogKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGRvbSA9ICQuU1VCUlVMRTEoJC5kb21PckRvbWFpbkRvbSk7XHJcbiAgICAgICAgICAgICAgJC5PUFRJT04yKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICQuU1VCUlVMRTIoJC5maWx0ZXJFbnRyeSk7XHJcbiAgICAgICAgICAgICAgICBmaWx0ZXIgPSAkLlNVQlJVTEUzKCQuY29tbWFBbmRMaXN0RmlsdGVyKTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogKCkgPT4ge1xyXG4gICAgICAgICAgICBmaWx0ZXIgPSAkLlNVQlJVTEU0KCQuY29tbWFBbmRMaXN0RmlsdGVyKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXSk7XHJcbiAgICAgICAgcmV0dXJuIFtmaWx0ZXIsIGRvbV07XHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLmNhdGVnb3J5TGlzdCA9ICQuUlVMRShcImNhdGVnb3J5TGlzdFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciByID0gW107XHJcbiAgICAgICQuQVRfTEVBU1RfT05FKCAoKSA9PiB7XHJcbiAgICAgICAgJC5PUFRJT04oICgpID0+IHtcclxuICAgICAgICAgIC8vJC5DT05TVU1FKFQuQ29tbWEpO1xyXG4gICAgICAgICAgJC5PUihbeyBBTFQ6ICgpPT4gJC5DT05TVU1FKFQuQ29tbWEpfSxcclxuICAgICAgICAgICAgeyBBTFQ6ICgpPT4gJC5DT05TVU1FKFQuYW5kKX0sXHJcbiAgICAgICAgICBdKVxyXG4gICAgICAgICB9KTtcclxuICAgICAgICByLnB1c2goQVNULm1ha2VOb2RlRm9yQ2F0KCQuQ09OU1VNRShULkNBVCkpKTtcclxuICAgICAgfSk7XHJcbiAgICAgIC8qXHJcbiAgICAgICQuQVRfTEVBU1RfT05FX1NFUCh7XHJcbiAgICAgICAgU0VQOiBULkNvbW1hLCBERUY6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHIucHVzaChBU1QubWFrZU5vZGVGb3JDYXQoJC5DT05TVU1FKFQuQ0FUKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgICovXHJcbiAgICAgIHZhciByZXMgPSBBU1QubWFrZU5vZGUoTlQuTElTVCk7XHJcbiAgICAgIHJlcy5jaGlsZHJlbiA9IHI7XHJcbiAgICAgIHJldHVybiByZXM7XHJcbiAgICB9KTtcclxuXHJcbiAgdGhpcy5wbGFpbkZhY3QgPSAkLlJVTEUoXCJwbGFpbkZhY3RcIiwgKCkgPT5cclxuICAgIEFTVC5tYWtlTm9kZUZvckZhY3QoJC5DT05TVU1FKFQuRkFDVCkpXHJcbiAgKTtcclxuXHJcbiAgdGhpcy5mYWN0T3JBbnkgPSAkLlJVTEUoXCJmYWN0T3JBbnlcIiwgKCkgPT5cclxuICAgICQuT1IoW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yRmFjdCgkLkNPTlNVTUUxKFQuRkFDVCkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBBU1QubWFrZU5vZGVGb3JBbnkoJC5DT05TVU1FMihULkFuQU5ZKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgXSlcclxuICApO1xyXG5cclxuICB0aGlzLmZhY3RPckFueU9ySW50ZWdlciA9ICQuUlVMRShcImZhY3RPckFueU9ySW50ZWdlclwiLCAoKSA9PlxyXG4gICQuT1IoW1xyXG4gICAgICB7XHJcbiAgICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yRmFjdCgkLkNPTlNVTUUxKFQuRkFDVCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvckFueSgkLkNPTlNVTUUyKFQuQW5BTlkpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHJldHVybiBBU1QubWFrZU5vZGVGb3JBbnkoJC5DT05TVU1FMyhULkludGVnZXIpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICBdKVxyXG4pO1xyXG5cclxuICB0aGlzLnBwRmFjdEFueSA9ICQuUlVMRShcIm9wRmFjdEFueVwiLCBmdW5jdGlvbiAoaGVhZCkge1xyXG4gICAgcmV0dXJuICQuT1IoW1xyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIEFMVDogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICB2YXIgb3AgPSBBU1QubWFrZU5vZGUoTlQuT1BFcUluLGhlYWQpO1xyXG4gICAgICAgICAgICAgICAgICB2YXIgZmFjdCA9ICQuU1VCUlVMRSgkLnBsYWluRmFjdCk7XHJcbiAgICAgICAgICAgICAgICAgIG9wLmNoaWxkcmVuLnB1c2goZmFjdCk7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBvcDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIEFMVDogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICB2YXIgb3AgPSAkLlNVQlJVTEUyKCQuYmluYXJ5VmFsT3ApO1xyXG4gICAgICAgICAgICAgICAgICBvcC5jaGlsZHJlbiA9IFtoZWFkXTtcclxuICAgICAgICAgICAgICAgICAgdmFyIGZhY3QgPSAkLlNVQlJVTEUzKCQucGxhaW5GYWN0KTtcclxuICAgICAgICAgICAgICAgICAgb3AuY2hpbGRyZW4ucHVzaChmYWN0KTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgQUxUOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIHZhciBvcCA9ICQuU1VCUlVMRTQoJC5iaW5hcnlGcmFnT3ApO1xyXG4gICAgICAgICAgICAgICAgICBvcC5jaGlsZHJlbiA9IFtoZWFkXTtcclxuICAgICAgICAgICAgICAgICAgdmFyIGZhY3RPckFueU9ySW50ZWdlciA9ICQuU1VCUlVMRTUoJC5mYWN0T3JBbnlPckludGVnZXIpO1xyXG4gICAgICAgICAgICAgICAgICBvcC5jaGlsZHJlbi5wdXNoKGZhY3RPckFueU9ySW50ZWdlcik7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBvcDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgXSk7XHJcbiAgfSk7XHJcbiAgLy8gWyBDQVQ/IEZBQ1QgXVxyXG4gIC8vIFRPRE8gQ0FUIE9QIENPTlRBSU5TIE1BTllcclxuICAvLyBDQVQgT1AgRkFDVFxyXG4gIC8vIEZBQ1RcclxuICB0aGlzLk1vcmVUaGFuTGVzc1RoYW5FeGFjdGx5ID0gJC5SVUxFKFwiTW9yZVRoYW5MZXNzVGhhbkV4YWN0bHlcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuICQuT1IoIFsgIHtcclxuICAgICAgICAgIEFMVDogKCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgdG9rID0gJC5DT05TVU1FKFQubW9yZV90aGFuKTtcclxuICAgICAgICAgICAgdmFyIG9wID0gQVNULm1ha2VOb2RlKE5ULk9QTW9yZVRoYW4pO1xyXG4gICAgICAgICAgICBvcC5iZWFyZXIgPSB0b2s7XHJcbiAgICAgICAgICAgIHZhciB0b2tpID0gJC5DT05TVU1FKFQuSW50ZWdlcik7XHJcbiAgICAgICAgICAgIHZhciBudW1iZXJhcmcgPSBBU1QubWFrZU5vZGVGb3JJbnRlZ2VyKHRva2kpO1xyXG4gICAgICAgICAgICBvcC5jaGlsZHJlblswXSA9IG51bWJlcmFyZztcclxuICAgICAgICAgICAgdmFyIHRva2MgPSAkLkNPTlNVTUUoVC5DQVQpO1xyXG4gICAgICAgICAgICB2YXIgY2F0ID0gQVNULm1ha2VOb2RlRm9yQ2F0KHRva2MpO1xyXG4gICAgICAgICAgICBvcC5jaGlsZHJlblsxXSA9IGNhdDtcclxuICAgICAgICAgICAgcmV0dXJuIG9wO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciB0b2sgPSAkLkNPTlNVTUUoVC5sZXNzX3RoYW4pO1xyXG4gICAgICAgICAgICB2YXIgb3AgPSBBU1QubWFrZU5vZGUoTlQuT1BMZXNzVGhhbik7XHJcbiAgICAgICAgICAgIG9wLmJlYXJlciA9IHRvaztcclxuICAgICAgICAgICAgdmFyIHRva2kgPSAkLkNPTlNVTUUyKFQuSW50ZWdlcik7XHJcbiAgICAgICAgICAgIHZhciBudW1iZXJhcmcgPSBBU1QubWFrZU5vZGVGb3JJbnRlZ2VyKHRva2kpO1xyXG4gICAgICAgICAgICBvcC5jaGlsZHJlblswXSA9IG51bWJlcmFyZztcclxuICAgICAgICAgICAgdmFyIHRva2MgPSAkLkNPTlNVTUUyKFQuQ0FUKTtcclxuICAgICAgICAgICAgdmFyIGNhdCA9IEFTVC5tYWtlTm9kZUZvckNhdCh0b2tjKTtcclxuICAgICAgICAgICAgb3AuY2hpbGRyZW5bMV0gPSBjYXQ7XHJcbiAgICAgICAgICAgIHJldHVybiBvcDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogKCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgdG9rID0gJC5DT05TVU1FKFQuZXhhY3RseSk7XHJcbiAgICAgICAgICAgIHZhciBvcCA9IEFTVC5tYWtlTm9kZShOVC5PUEV4YWN0bHkpO1xyXG4gICAgICAgICAgICBvcC5iZWFyZXIgPSB0b2s7XHJcbiAgICAgICAgICAgIHZhciB0b2tpID0gJC5DT05TVU1FMyhULkludGVnZXIpO1xyXG4gICAgICAgICAgICB2YXIgbnVtYmVyYXJnID0gQVNULm1ha2VOb2RlRm9ySW50ZWdlcih0b2tpKTtcclxuICAgICAgICAgICAgb3AuY2hpbGRyZW5bMF0gPSBudW1iZXJhcmc7XHJcbiAgICAgICAgICAgIHZhciB0b2tjID0gJC5DT05TVU1FMyhULkNBVCk7XHJcbiAgICAgICAgICAgIHZhciBjYXQgPSBBU1QubWFrZU5vZGVGb3JDYXQodG9rYyk7XHJcbiAgICAgICAgICAgIG9wLmNoaWxkcmVuWzFdID0gY2F0O1xyXG4gICAgICAgICAgICByZXR1cm4gb3A7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6ICgpID0+IHtcclxuICAgICAgICAgICAgdmFyIHRvayA9ICQuQ09OU1VNRShULmV4aXN0aW5nKTtcclxuICAgICAgICAgICAgdmFyIG9wID0gQVNULm1ha2VOb2RlKE5ULk9QRXhpc3RpbmcpO1xyXG4gICAgICAgICAgICBvcC5iZWFyZXIgPSB0b2s7XHJcbiAgICAgICAgICAgIHZhciB0b2tjID0gJC5DT05TVU1FNChULkNBVCk7XHJcbiAgICAgICAgICAgIHZhciBjYXQgPSBBU1QubWFrZU5vZGVGb3JDYXQodG9rYyk7XHJcbiAgICAgICAgICAgIG9wLmNoaWxkcmVuWzBdID0gY2F0O1xyXG4gICAgICAgICAgICByZXR1cm4gb3A7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6ICgpID0+IHtcclxuICAgICAgICAgICAgdmFyIHRvayA9ICQuQ09OU1VNRShULm5vdF9leGlzdGluZyk7XHJcbiAgICAgICAgICAgIHZhciBvcCA9IEFTVC5tYWtlTm9kZShOVC5PUE5vdEV4aXN0aW5nKTtcclxuICAgICAgICAgICAgb3AuYmVhcmVyID0gdG9rO1xyXG4gICAgICAgICAgICB2YXIgdG9rYyA9ICQuQ09OU1VNRTUoVC5DQVQpO1xyXG4gICAgICAgICAgICB2YXIgY2F0ID0gQVNULm1ha2VOb2RlRm9yQ2F0KHRva2MpO1xyXG4gICAgICAgICAgICBvcC5jaGlsZHJlblswXSA9IGNhdDtcclxuICAgICAgICAgICAgcmV0dXJuIG9wO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuICAgICAgICAvKixcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6ICgpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coICd0b2tlbiBpbmRleCBpcyAnICsgVC5sZXNzX3RoYW4gKTtcclxuICAgICAgICAgICAgdmFyIHRvayA9ICQuQ09OU1VNRTIoVC5sZXNzX3RoYW4pO1xyXG4gICAgICAgICAgICB2YXIgb3AgPSBBU1QubWFrZU5vZGUoTlQuT1BNb3JlVGhhbik7XHJcbiAgICAgICAgICAgIG9wLmJlYXJlciA9IHRvaztcclxuICAgICAgICAgICAgdmFyIHRva2kgPSAkLkNPTlNVTUUzKFQuQW5BTlkpO1xyXG4gICAgICAgICAgICB2YXIgbnVtYmVyYXJnID0gQVNULm1ha2VOb2RlRm9ySW50ZWdlcih0b2tpKTtcclxuICAgICAgICAgICAgb3AuY2hpbGRyZW5bMF0gPSBudW1iZXJhcmc7XHJcbiAgICAgICAgICAgIHZhciB0b2tjID0gJC5DT05TVU1FMyhULkNBVCk7XHJcbiAgICAgICAgICAgIHZhciBjYXQgPSBBU1QubWFrZU5vZGVGb3JDYXQodG9rYyk7XHJcbiAgICAgICAgICAgIG9wLmNoaWxkcmVuWzFdID0gY2F0O1xyXG4gICAgICAgICAgICByZXR1cm4gb3A7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSovXHJcbiAgICAgIF0pO1xyXG4gICB9KTtcclxuXHJcblxyXG4gICB0aGlzLmNhdEZhY3QgPSAkLlJVTEUoXCJjYXRGYWN0XCIsIGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiAkLk9SKFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6ICgpID0+IHtcclxuICAgICAgICAgICAgdmFyIHRvayA9ICQuQ09OU1VNRShULkNBVCk7XHJcbiAgICAgICAgICAgIHZhciBoZWFkID0gQVNULm1ha2VOb2RlRm9yQ2F0KHRvayk7XHJcbiAgICAgICAgICAgIHZhciBvcCA9ICQuU1VCUlVMRSgkLm9wRmFjdEFueSwgaGVhZCk7XHJcbiAgICAgICAgICAgIG9wLmNoaWxkcmVuWzBdID0gaGVhZDtcclxuICAgICAgICAgICAgcmV0dXJuIG9wO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiAgJC5TVUJSVUxFKCQuTW9yZVRoYW5MZXNzVGhhbkV4YWN0bHkpO1xyXG4gICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggJ3Rva2VuIGluZGV4IGlzICcgKyBULm1vcmVfdGhhbiApO1xyXG4gICAgICAgICAgICB2YXIgdG9rID0gJC5DT05TVU1FKFQubW9yZV90aGFuKTtcclxuICAgICAgICAgICAgdmFyIG9wID0gQVNULm1ha2VOb2RlKE5ULk9QTW9yZVRoYW4pO1xyXG4gICAgICAgICAgICBvcC5iZWFyZXIgPSB0b2s7XHJcbiAgICAgICAgICAgIHZhciB0b2tpID0gJC5DT05TVU1FKFQuSW50ZWdlcik7XHJcbiAgICAgICAgICAgIHZhciBudW1iZXJhcmcgPSBBU1QubWFrZU5vZGVGb3JJbnRlZ2VyKHRva2kpO1xyXG4gICAgICAgICAgICBvcC5jaGlsZHJlblswXSA9IG51bWJlcmFyZztcclxuICAgICAgICAgICAgdmFyIHRva2MgPSAkLkNPTlNVTUUyKFQuQ0FUKTtcclxuICAgICAgICAgICAgdmFyIGNhdCA9IEFTVC5tYWtlTm9kZUZvckNhdCh0b2tjKTtcclxuICAgICAgICAgICAgb3AuY2hpbGRyZW5bMV0gPSBjYXQ7XHJcbiAgICAgICAgICAgIHJldHVybiBvcDtcclxuICAgICAgICAgICAgKi9cclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogKCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgb3AgPSBBU1QubWFrZU5vZGUoTlQuT1BFcUluLFxyXG4gICAgICAgICAgICAgIEFTVC5tYWtlTm9kZShBU1QuQVNUTm9kZVR5cGUuQ0FUUEgpKTtcclxuICAgICAgICAgICAgdmFyIGZhY3QgPSAkLlNVQlJVTEUyKCQucGxhaW5GYWN0KTtcclxuICAgICAgICAgICAgb3AuY2hpbGRyZW4ucHVzaChmYWN0KTtcclxuICAgICAgICAgICAgcmV0dXJuIG9wO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgXSk7XHJcbiAgIH0pO1xyXG5cclxuLy9cclxuXHJcbiB0aGlzLmNvbW1hQW5kTGlzdEZpbHRlciA9ICQuUlVMRShcImNvbW1hQW5kTGlzdEZpbHRlclwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciByID0gWyQuU1VCUlVMRSgkLmNhdEZhY3QpXTtcclxuICAgICAgJC5NQU5ZKCAoKSA9PiB7XHJcbiAgICAgICAgJC5PUFRJT04oICgpID0+XHJcbiAgICAgICAgICAvLyQuQ09OU1VNRShULkNvbW1hKSk7XHJcbiAgICAgICAgICAkLk9SKCBbXHJcbiAgICAgICAgICAgIHsgQUxUOiBmdW5jdGlvbigpIHsgJC5DT05TVU1FKFQuQ29tbWEpOyB9fSxcclxuICAgICAgICAgICAgeyBBTFQ6IGZ1bmN0aW9uKCkgeyAkLkNPTlNVTUUoVC5hbmQpOyB9fSwgLy8gbm90IGEgbG9naWNhbCBhbmQgeWV0XHJcbiAgICAgICAgICAgIHsgQUxUOiBmdW5jdGlvbigpIHsgJC5DT05TVU1FKFQub3IpOyB9fSwgLy9ub3QgbG9naWNhbCBvciB5ZXRcclxuICAgICAgICAgICAgeyBBTFQ6IGZ1bmN0aW9uKCkgeyAkLkNPTlNVTUUoVC53aXRoKTsgfX1cclxuICAgICAgICAgIF0pXHJcbiAgICAgICAgKVxyXG4gICAgICAgIHIucHVzaCgkLlNVQlJVTEUyKCQuY2F0RmFjdCkpO1xyXG4gICAgICB9KTtcclxuICAgICAgLy9vbnNvbGUubG9nKFwiaGVyZSBwcm9kdWNpbmdcIiArIEpTT04uc3RyaW5naWZ5KG4pKTtcclxuICAgICAgdmFyIG4gPSAgQVNULm1ha2VOb2RlKE5ULkxJU1QpO1xyXG4gICAgICBuLmNoaWxkcmVuID0gcjtcclxuICAgICAgcmV0dXJuIG47XHJcbiAgICB9KTtcclxuLypcclxuICB0aGlzLmNvbW1hQW5kTGlzdFRhaWwgPSAkLlJVTEUoXCJjb21tYUFuZExpc3RUYWlsXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgLy8kLlNVQlJVTEUoJC5jYXRGYWN0KTtcclxuICAgICAgJC5NQU5ZKCAoKSA9PiB7XHJcbiAgICAgICAgJC5DT05TVU1FKFQuQ29tbWEpO1xyXG4gICAgICAgIC8qICQuT1IoIFtcclxuICAgICAgICAgIHsgQUxUOiBmdW5jdGlvbigpIHsgJC5DT05TVU1FKENvbW1hKTsgfX0sXHJcbiAgICAgICAgICB7IEFMVDogZnVuY3Rpb24oKSB7ICQuQ09OU1VNRShBbmQpOyB9fVxyXG4gICAgICAgIF0pOyAqIC9cclxuICAgICAgICAkLlNVQlJVTEUoJC5jYXRGYWN0KTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiB7IGI6IDQ0NSB9O1xyXG4gICAgfSk7XHJcbiovXHJcbiAgICAkLlJVTEUoXCJ1bmFyeVNldE9wXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgJC5PUihbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQuQ09OU1VNRShULmFsbCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJC5DT05TVU1FKFQuZmlyc3QpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQuQ09OU1VNRShULm5ld2VzdCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJC5DT05TVU1FKFQub2xkZXN0KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkLkNPTlNVTUUoVC5sYXRlc3QpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQuQ09OU1VNRShULmV2ZXJ5KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkLkNPTlNVTUUoVC5hbnkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQuQ09OU1VNRShULmF0KTtcclxuICAgICAgICAgICAgJC5DT05TVU1FKFQubGVhc3QpO1xyXG4gICAgICAgICAgICAkLkNPTlNVTUUoVC5vbmUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkLkNPTlNVTUUoVC5sYXN0KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIF0pO1xyXG4gIH0pO1xyXG5cclxuICAgICAkLlJVTEUoXCJiaW5hcnlWYWxPcFwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgIHJldHVybiAkLk9SKFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvclRva2VuKE5ULk9QRVEsICQuQ09OU1VNRTEoVC5lcXVhbHMpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yVG9rZW4oTlQuT1BFUSwgJC5DT05TVU1FMihULmlzKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgXSk7XHJcbiAgfSk7XHJcblxyXG4gICQuUlVMRShcImJpbmFyeUZyYWdPcFwiLCBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiAkLk9SKFtcclxuICAgIHtcclxuICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvclRva2VuKE5ULk9QQ29udGFpbnMsICQuQ09OU1VNRShULmNvbnRhaW5zKSk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBBU1QubWFrZU5vZGVGb3JUb2tlbihOVC5PUENvbnRhaW5zLCAkLkNPTlNVTUUxKFQuY29udGFpbmluZykpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHJldHVybiBBU1QubWFrZU5vZGVGb3JUb2tlbihOVC5PUEVuZHNXaXRoLCAkLkNPTlNVTUUyKFQuZW5kc193aXRoKSk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvclRva2VuKE5ULk9QRW5kc1dpdGgsICQuQ09OU1VNRTMoVC5lbmRpbmdfd2l0aCkpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yVG9rZW4oTlQuT1BTdGFydHNXaXRoLCAkLkNPTlNVTUU0KFQuc3RhcnRpbmdfd2l0aCkpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yVG9rZW4oTlQuT1BTdGFydHNXaXRoLCAkLkNPTlNVTUU1KFQuc3RhcnRzX3dpdGgpKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICQuU1VCUlVMRTIoJC5vcEJpbmFyeUNvbXBhcmUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgXSk7XHJcbn0pO1xyXG5cclxuJC5SVUxFKFwib3BCaW5hcnlDb21wYXJlXCIsIGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiAkLk9SKFtcclxuICB7XHJcbiAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvclRva2VuKE5ULk9QTFQsICQuQ09OU1VNRTEoVC5MVCkpO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAge1xyXG4gICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBBU1QubWFrZU5vZGVGb3JUb2tlbihOVC5PUExFLCAkLkNPTlNVTUUyKFQuTEUpKTtcclxuICAgIH1cclxuICB9LFxyXG4gIHtcclxuICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yVG9rZW4oTlQuT1BHVCwgJC5DT05TVU1FMyhULkdUKSk7XHJcbiAgICB9XHJcbiAgfSxcclxuICB7XHJcbiAgICBBTFQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIEFTVC5tYWtlTm9kZUZvclRva2VuKE5ULk9QR0UsICQuQ09OU1VNRTQoVC5HRSkpO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAge1xyXG4gICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBBU1QubWFrZU5vZGVGb3JUb2tlbihOVC5PUEVRLCAkLkNPTlNVTUU1KFQuRVEpKTtcclxuICAgIH1cclxuICB9LFxyXG4gIHtcclxuICAgIEFMVDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAvLyBkZWxpYmVyYXRlIHJlY2FzdCwoICggbm90IGxlc3MgdGhhbiAzIENBVCAgKVxyXG4gICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yVG9rZW4oTlQuT1BMVCwgJC5DT05TVU1FMyhULmxlc3NfdGhhbikpO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAge1xyXG4gICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIC8vIGRlbGliZXJhdGUgcmVjYXN0IVxyXG4gICAgICByZXR1cm4gQVNULm1ha2VOb2RlRm9yVG9rZW4oTlQuT1BHVCwgJC5DT05TVU1FNChULm1vcmVfdGhhbikpO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAge1xyXG4gICAgQUxUOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBBU1QubWFrZU5vZGVGb3JUb2tlbihOVC5PUE5FLCAkLkNPTlNVTUU1KFQuTkUpKTtcclxuICAgIH1cclxuICB9XHJcbiAgXSk7XHJcbn0pO1xyXG5cclxuXHJcbi8vLyBXaGVyZSAgRmlyc3QgKENBVCAgR0UgIFggIClcclxuXHJcbi8qXHJcbiAgICAkLlJVTEUoXCJjYXRTZXRFeHByZXNzaW9uXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAkLk9QVElPTigkLlNVQlJVTEUoJC51bmFyeVNldE9wKSk7XHJcbiAgICAgICQuQ09OU1VNRShULkNBVCk7XHJcbiAgICB9KVxyXG4qL1xyXG4gICAgLy8gIGxvd2VzdCBwcmVjZWRlbmNlIHRodXMgaXQgaXMgZmlyc3QgaW4gdGhlIHJ1bGUgY2hhaW5cclxuICAgIC8vIFRoZSBwcmVjZWRlbmNlIG9mIGJpbmFyeSBleHByZXNzaW9ucyBpcyBkZXRlcm1pbmVkIGJ5IGhvdyBmYXIgZG93biB0aGUgUGFyc2UgVHJlZVxyXG4gICAgLy8gVGhlIGJpbmFyeSBleHByZXNzaW9uIGFwcGVhcnMuXHJcblxyXG4gICAgLypcclxuICAgICQuUlVMRShcImZpbHRlckV4cHJlc3Npb25cIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHZhbHVlLCBvcCwgcmhzVmFsO1xyXG5cclxuICAgICAgICAvLyBwYXJzaW5nIHBhcnRcclxuICAgICAgICB2YWx1ZSA9ICQuU1VCUlVMRSgkLmNhdFNldEV4cHJlc3Npb24pO1xyXG4gICAgICAgICQuT1IoWyB7IEFMVDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAkLkFUX0xFQVNUX08oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgLy8gY29uc3VtaW5nICdBZGRpdGlvbk9wZXJhdG9yJyB3aWxsIGNvbnN1bWUgZWl0aGVyIFBsdXMgb3IgTWludXMgYXMgdGhleSBhcmUgc3ViY2xhc3NlcyBvZiBBZGRpdGlvbk9wZXJhdG9yXHJcbiAgICAgICAgICAgICAgb3AgPSAkLlNVQlJVTEUxKCQuYmluYXJ5VmFsT3ApO1xyXG4gICAgICAgICAgICAgIC8vICB0aGUgaW5kZXggXCIyXCIgaW4gU1VCUlVMRTIgaXMgbmVlZGVkIHRvIGlkZW50aWZ5IHRoZSB1bmlxdWUgcG9zaXRpb24gaW4gdGhlIGdyYW1tYXIgZHVyaW5nIHJ1bnRpbWVcclxuICAgICAgICAgICAgICByaHNWYWwgPSAkLkNPTlNVTUUoVC5BRmFjdCk7XHJcbiAgICAgICAgICAgICAgLy8gVE9ETyBsb2dpY2FsIGV4cHJcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH19LFxyXG4gICAgICAgIHsgQUxUOiBmdW5jdGlvbigpIHsgJC5DT05TVU1FMihULkFGYWN0KTsgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBdKTtcclxuICAgIH0pO1xyXG4gICAgKi9cclxuXHJcbi8qXHJcbiAgICAkLlJVTEUoXCJ4YXRvbWljRXhwcmVzc2lvblwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gJC5PUihbXHJcbiAgICAgICAgICAgIC8vIHBhcmVudGhlc2lzRXhwcmVzc2lvbiBoYXMgdGhlIGhpZ2hlc3QgcHJlY2VkZW5jZSBhbmQgdGh1cyBpdCBhcHBlYXJzXHJcbiAgICAgICAgICAgIC8vIGluIHRoZSBcImxvd2VzdFwiIGxlYWYgaW4gdGhlIGV4cHJlc3Npb24gUGFyc2VUcmVlLlxyXG4gICAgICAgICAgICB7QUxUOiBmdW5jdGlvbigpIHsgcmV0dXJuICQuU1VCUlVMRSgkLnBhcmVudGhlc2lzRXhwcmVzc2lvbil9fSxcclxuICAgICAgICAgICAge0FMVDogZnVuY3Rpb24oKSB7IHJldHVybiBwYXJzZUludCgkLkNPTlNVTUUoVC5JbnRlZ2VyKS5pbWFnZSwgMTApfX0sXHJcbiAgICAgICAgICAgIHtBTFQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gJC5TVUJSVUxFKCQucG93ZXJGdW5jdGlvbil9fVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSk7XHJcbiovXHJcblxyXG4vKlxyXG4gICAgJC5SVUxFKFwicGFyZW50aGVzaXNFeHByZXNzaW9uXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBleHBWYWx1ZTtcclxuICAgICAgICAkLkNPTlNVTUUoVC5MUGFyZW4pO1xyXG4gICAgICAgIGV4cFZhbHVlID0gJC5TVUJSVUxFKCQuZXhwcmVzc2lvbik7XHJcbiAgICAgICAgJC5DT05TVU1FKFQuUlBhcmVuKTtcclxuICAgICAgICByZXR1cm4gZXhwVmFsdWVcclxuICAgIH0pO1xyXG4qL1xyXG4vKlxyXG5cclxuICAgIHRoaXMuc2VsZWN0Q2xhdXNlID0gJC5SVUxFKFwic2VsZWN0Q2xhdXNlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgJC5DT05TVU1FKFQuc2VsZWN0KTtcclxuICAgICAgJC5BVF9MRUFTVF9PTkVfU0VQKHtcclxuICAgICAgICBTRVA6IFQuQ29tbWEsIERFRjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgJC5DT05TVU1FKFQuSWRlbnRpZmllcik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIHsgYjogNDQ1IH07XHJcbiAgICB9KTtcclxuKi9cclxuXHJcbi8qXHJcbiAgICB0aGlzLmZyb21DbGF1c2UgPSAkLlJVTEUoXCJmcm9tQ2xhdXNlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgJC5DT05TVU1FKFQuZnJvbSk7XHJcbiAgICAgICQuQ09OU1VNRShULklkZW50aWZpZXIpO1xyXG5cclxuICAgICAgLy8gZXhhbXBsZTpcclxuICAgICAgLy8gcmVwbGFjZSB0aGUgY29udGVudHMgb2YgdGhpcyBydWxlIHdpdGggdGhlIGNvbW1lbnRlZCBvdXQgbGluZXNcclxuICAgICAgLy8gYmVsb3cgdG8gaW1wbGVtZW50IG11bHRpcGxlIHRhYmxlcyB0byBzZWxlY3QgZnJvbSAoaW1wbGljaXQgam9pbikuXHJcblxyXG4gICAgICAvLyAkLkNPTlNVTUUoRnJvbSk7XHJcbiAgICAgIC8vICQuQVRfTEVBU1RfT05FX1NFUCh7XHJcbiAgICAgIC8vICAgU0VQOiBDb21tYSwgREVGOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIC8vICAgICAkLkNPTlNVTUUoSWRlbnRpZmllcik7XHJcbiAgICAgIC8vICAgfVxyXG4gICAgICAvLyB9KTtcclxuICAgIH0pO1xyXG4qL1xyXG5cclxuICAgIHRoaXMuZmllbGRMaXN0ID0gJC5SVUxFKFwiZmllbGRMaXN0XCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHJlcyA9IFtdO1xyXG4gICAgICAkLkFUX0xFQVNUX09ORV9TRVAoe1xyXG4gICAgICAgIFNFUDogVC5Db21tYSwgREVGIDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgIHZhciBhdG9rID0gICQuQ09OU1VNRShULkNBVCk7XHJcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcInRva2VuIFwiICsgSlNPTi5zdHJpbmdpZnkoYXRvaykpO1xyXG4gICAgICAgICAgIHJlcy5wdXNoKGF0b2spO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiByZXM7XHJcbiAgICB9KTtcclxuXHJcbi8qXHJcbiAgICB0aGlzLndoZXJlQ2xhdXNlID0gJC5SVUxFKFwid2hlcmVDbGF1c2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLkNPTlNVTUUoVC53aGVyZSlcclxuICAgICAgJC5TVUJSVUxFKCQuZXhwcmVzc2lvbilcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICB0aGlzLmV4cHJlc3Npb24gPSAkLlJVTEUoXCJleHByZXNzaW9uXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgJC5TVUJSVUxFKCQuYXRvbWljRXhwcmVzc2lvbik7XHJcbiAgICAgICQuU1VCUlVMRSgkLnJlbGF0aW9uYWxPcGVyYXRvcik7XHJcbiAgICAgICQuU1VCUlVMRTIoJC5hdG9taWNFeHByZXNzaW9uKTsgLy8gbm90ZSB0aGUgJzInIHN1ZmZpeCB0byBkaXN0aW5ndWlzaFxyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gZnJvbSB0aGUgJ1NVQlJVTEUoYXRvbWljRXhwcmVzc2lvbiknXHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyAyIGxpbmVzIGFib3ZlLlxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIHRoaXMuYXRvbWljRXhwcmVzc2lvbiA9ICQuUlVMRShcImF0b21pY0V4cHJlc3Npb25cIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLk9SKFtcclxuICAgICAgICB7QUxUOiBmdW5jdGlvbiAoKSB7ICQuQ09OU1VNRShULkludGVnZXIpfX0sXHJcbiAgICAgICAge0FMVDogZnVuY3Rpb24gKCkgeyAkLkNPTlNVTUUoVC5JZGVudGlmaWVyKX19XHJcbiAgICAgIF0pO1xyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIHRoaXMucmVsYXRpb25hbE9wZXJhdG9yID0gJC5SVUxFKFwicmVsYXRpb25hbE9wZXJhdG9yXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgJC5PUihbXHJcbiAgICAgICAge0FMVDogZnVuY3Rpb24gKCkgeyAkLkNPTlNVTUUoVC5HVCl9fSxcclxuICAgICAgICB7QUxUOiBmdW5jdGlvbiAoKSB7ICQuQ09OU1VNRShULkxUKX19XHJcbiAgICAgIF0pO1xyXG4gICAgfSk7XHJcbiovXHJcbiAgICAvLyB2ZXJ5IGltcG9ydGFudCB0byBjYWxsIHRoaXMgYWZ0ZXIgYWxsIHRoZSBydWxlcyBoYXZlIGJlZW4gZGVmaW5lZC5cclxuICAgIC8vIG90aGVyd2lzZSB0aGUgcGFyc2VyIG1heSBub3Qgd29yayBjb3JyZWN0bHkgYXMgaXQgd2lsbCBsYWNrIGluZm9ybWF0aW9uXHJcbiAgICAvLyBkZXJpdmVkIGR1cmluZyB0aGUgc2VsZiBhbmFseXNpcyBwaGFzZS5cclxuICAgIChQYXJzZXIgYXMgYW55KS5wZXJmb3JtU2VsZkFuYWx5c2lzKHRoaXMpO1xyXG4gIH1cclxuXHJcbiAgU2VsZWN0UGFyc2VyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGFyc2VyLnByb3RvdHlwZSk7XHJcbiAgU2VsZWN0UGFyc2VyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFNlbGVjdFBhcnNlcjtcclxuXHJcbi8vXHJcbmV4cG9ydCB7XHJcbiAgIFNlbGVjdExleGVyLFxyXG4gICBTZWxlY3RQYXJzZXJcclxuICAgLy8gZGVmYXVsdFJ1bGUgOiBcInNlbGVjdFN0YXRlbWVudFwiXHJcbn07XHJcbiJdfQ==
