'use strict'

// based on: http://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Levenshtein_distance
// and:  http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance


import * as chevrotain from 'chevrotain';
import * as AST from './ast';

import { ASTNodeType as NT} from './ast';

  // Written Docs for this tutorial step can be found here:
  // https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step2_parsing.md

  // Tutorial Step 2:

  // Adding a Parser (grammar only, only reads the input
  // without any actions) using the Tokens defined in the previous step.
  // modification to the grammar will be displayed in the syntax diagrams panel.

  var createToken = chevrotain.createToken;
  var Lexer = chevrotain.Lexer;
  var Parser = chevrotain.Parser;

  var WhiteSpace = createToken({name: "WhiteSpace", pattern: /\s+/});

  WhiteSpace.GROUP = Lexer.SKIPPED;


import { Tokens as T}  from './tokens';
  // whitespace is normally very common so it is placed first to speed up the lexer
  var allTokens = Object.keys(T).map(key => T[key]);
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
      $.CONSUME(T.list);
      $.OPTION(() =>
        $.CONSUME(T.all)
      );
      var resFieldList = $.SUBRULE($.fieldList)
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

    this.allClause = $.RULE('allClause', function() {
      $.SUBRULE($.catListOpMore);
    });


    this.opCat = $.RULE('opCat', function() {
      $.OR([
        {ALT: function() { return AST.makeNodeForToken(NT.OPFirst, $.CONSUME(T.first));}},
        {ALT: function() { return AST.makeNodeForToken(NT.OPOldest, $.CONSUME(T.oldest));}},
        {ALT: function() { return AST.makeNodeForToken(NT.OPNewest,$.CONSUME(T.latest));}},
        {ALT: function() { return AST.makeNodeForToken(NT.OPNewest,$.CONSUME(T.newest));}}
      ])
    });

    this.catListOpMore = $.RULE("catListOpMore", function() : AST.ASTNode {
       var r = undefined as AST.ASTNode;
       $.OPTION(() =>
          r = $.SUBRULE($.opCat)
       );
       r = r || AST.makeNode(NT.OPAll);
       var catList = $.SUBRULE2($.categoryList);
       r.children = [catList];
       var inop = $.OPTION2(() => {
            var op = $.SUBRULE3($.binaryFragOp);
            var head = catList.children[catList.children.length-1];
              op.children = [head];
            var factOrAny = $.SUBRULE4($.factOrAny);
            op.children.push(factOrAny);
                  return op;
        });
       var res = $.SUBRULE($.catListTail);
       var filterDom = res[0];
       var filter = (filterDom || [])[0];
       if(!filter && inop) {
          var n =  AST.makeNode(NT.LIST);
          n.children = [inop];
          filter = n;
       } else if(inop) {
          filter.children.unshift(inop);
       }
       var orderBy = res[1];
       if ( orderBy )
         filter.children.push(orderBy);
       var dom = (filterDom || [])[1];
       var current = (dom) ?
           AST.makeNode(NT.BINOP, r, filter, dom)
        :  AST.makeNode(NT.BINOP,r, filter);
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

    this.catListTail = $.RULE("catListTail", function() : AST.ASTNode[] {
        var filterDom = undefined;
        $.OPTION3(() => filterDom = $.SUBRULE1($.catFilter));
        var filter = (filterDom || [])[0];
        var orderBy = undefined;
        $.OPTION4(() => orderBy = $.SUBRULE2($.orderBy));
        return [ filterDom, orderBy ];
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


    this.filterEntry = $.RULE("filterEntry", function() {
      $.OR([
        {
          ALT: function () {
            $.CONSUME(T.in);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.with);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.for);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.relating);
          }
        }
        ]);
    });


    this.orderBy = $.RULE("orderBy", function() {
      var op = undefined;
      $.OR([
        {
        ALT: () => {
          var tok = $.CONSUME1(T.order_by)
          op = AST.makeNode(NT.OPOrderBy);
          op.bearer = tok;
        }
      },
      {
        ALT: () => {
        var tok = $.CONSUME2(T.order_descending_by)
        op = AST.makeNode(NT.OPOrderDescendingBy);
        op.bearer = tok;
      }
      }]);
      var cat = $.CONSUME3(T.CAT);
      var nodeCat = AST.makeNodeForCat(cat);
      op.children[0] = nodeCat;
      return op;
    });


    this.domOrDomainDom = $.RULE("domOrDomainDom", function() {
      $.OPTION(() => $.CONSUME(T.domain));
      var r = $.CONSUME2(T.DOM);
      return AST.makeNodeForDomain(r);
    });

    this.catFilter = $.RULE("catFilter", function() {
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
      $.AT_LEAST_ONE( () => {
        $.OPTION( () => {
          //$.CONSUME(T.Comma);
          $.OR([{ ALT: ()=> $.CONSUME(T.Comma)},
            { ALT: ()=> $.CONSUME(T.and)},
          ])
         });
        r.push(AST.makeNodeForCat($.CONSUME(T.CAT)));
      });
      /*
      $.AT_LEAST_ONE_SEP({
        SEP: T.Comma, DEF: function () {
          r.push(AST.makeNodeForCat($.CONSUME(T.CAT)));
        }
      });
      */
      var res = AST.makeNode(NT.LIST);
      res.children = r;
      return res;
    });

  this.plainFact = $.RULE("plainFact", () =>
    AST.makeNodeForFact($.CONSUME(T.FACT))
  );

  this.factOrAny = $.RULE("factOrAny", () =>
    $.OR([
        {
          ALT: function () {
            return AST.makeNodeForFact($.CONSUME1(T.FACT));
          }
        },
        {
          ALT: function () {
            return AST.makeNodeForAny($.CONSUME2(T.AnANY));
          }
        }
    ])
  );

  this.factOrAnyOrInteger = $.RULE("factOrAnyOrInteger", () =>
  $.OR([
      {
        ALT: function () {
          return AST.makeNodeForFact($.CONSUME1(T.FACT));
        }
      },
      {
        ALT: function () {
          return AST.makeNodeForAny($.CONSUME2(T.AnANY));
        }
      },
      {
        ALT: function () {
          return AST.makeNodeForAny($.CONSUME3(T.Integer));
        }
      }
  ])
);

  this.ppFactAny = $.RULE("opFactAny", function (head) {
    return $.OR([
              {
                ALT: () => {
                  var op = AST.makeNode(NT.OPEqIn,head);
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
    return $.OR( [  {
          ALT: () => {
            var tok = $.CONSUME(T.more_than);
            var op = AST.makeNode(NT.OPMoreThan);
            op.bearer = tok;
            var toki = $.CONSUME(T.Integer);
            var numberarg = AST.makeNodeForInteger(toki);
            op.children[0] = numberarg;
            var tokc = $.CONSUME(T.CAT);
            var cat = AST.makeNodeForCat(tokc);
            op.children[1] = cat;
            return op;
          }
        },
        {
          ALT: () => {
            var tok = $.CONSUME(T.less_than);
            var op = AST.makeNode(NT.OPLessThan);
            op.bearer = tok;
            var toki = $.CONSUME2(T.Integer);
            var numberarg = AST.makeNodeForInteger(toki);
            op.children[0] = numberarg;
            var tokc = $.CONSUME2(T.CAT);
            var cat = AST.makeNodeForCat(tokc);
            op.children[1] = cat;
            return op;
          }
        },
        {
          ALT: () => {
            var tok = $.CONSUME(T.exactly);
            var op = AST.makeNode(NT.OPExactly);
            op.bearer = tok;
            var toki = $.CONSUME3(T.Integer);
            var numberarg = AST.makeNodeForInteger(toki);
            op.children[0] = numberarg;
            var tokc = $.CONSUME3(T.CAT);
            var cat = AST.makeNodeForCat(tokc);
            op.children[1] = cat;
            return op;
          }
        },
        {
          ALT: () => {
            var tok = $.CONSUME(T.existing);
            var op = AST.makeNode(NT.OPExisting);
            op.bearer = tok;
            var tokc = $.CONSUME4(T.CAT);
            var cat = AST.makeNodeForCat(tokc);
            op.children[0] = cat;
            return op;
          }
        },
        {
          ALT: () => {
            var tok = $.CONSUME(T.not_existing);
            var op = AST.makeNode(NT.OPNotExisting);
            op.bearer = tok;
            var tokc = $.CONSUME5(T.CAT);
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
            var tok = $.CONSUME(T.CAT);
            var head = AST.makeNodeForCat(tok);
            var op = $.SUBRULE($.opFactAny, head);
            op.children[0] = head;
            return op;
          }
        },
        {
          ALT: () => {
            return  $.SUBRULE($.MoreThanLessThanExactly);
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
            var op = AST.makeNode(NT.OPEqIn,
              AST.makeNode(AST.ASTNodeType.CATPH));
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
      $.MANY( () => {
        $.OPTION( () =>
          //$.CONSUME(T.Comma));
          $.OR( [
            { ALT: function() { $.CONSUME(T.Comma); }},
            { ALT: function() { $.CONSUME(T.and); }}, // not a logical and yet
            { ALT: function() { $.CONSUME(T.or); }}, //not logical or yet
            { ALT: function() { $.CONSUME(T.with); }}
          ])
        )
        r.push($.SUBRULE2($.catFact));
      });
      //onsole.log("here producing" + JSON.stringify(n));
      var n =  AST.makeNode(NT.LIST);
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
    $.RULE("unarySetOp", function() {
       $.OR([
        {
          ALT: function () {
            $.CONSUME(T.all);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.first);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.newest);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.oldest);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.latest);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.every);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.any);
          }
        },
        {
          ALT: function () {
            $.CONSUME(T.at);
            $.CONSUME(T.least);
            $.CONSUME(T.one);
          }
        },

        {
          ALT: function () {
            $.CONSUME(T.last);
          }
        }
      ]);
  });

     $.RULE("binaryValOp", function() {
       return $.OR([
        {
          ALT: function () {
            return AST.makeNodeForToken(NT.OPEQ, $.CONSUME1(T.equals));
          }
        },
        {
          ALT: function () {
            return AST.makeNodeForToken(NT.OPEQ, $.CONSUME2(T.is));
          }
        }
    ]);
  });

  $.RULE("binaryFragOp", function() {
    return $.OR([
    {
      ALT: function () {
        return AST.makeNodeForToken(NT.OPContains, $.CONSUME(T.contains));
      }
    },
    {
      ALT: function () {
        return AST.makeNodeForToken(NT.OPContains, $.CONSUME1(T.containing));
      }
    },
    {
      ALT: function () {
          return AST.makeNodeForToken(NT.OPEndsWith, $.CONSUME2(T.ends_with));
      }
    },
    {
      ALT: function () {
          return AST.makeNodeForToken(NT.OPEndsWith, $.CONSUME3(T.ending_with));
      }
    },
    {
      ALT: function () {
        return AST.makeNodeForToken(NT.OPStartsWith, $.CONSUME4(T.starting_with));
      }
    },
    {
      ALT: function () {
        return AST.makeNodeForToken(NT.OPStartsWith, $.CONSUME5(T.starts_with));
      }
    },
    {
      ALT: function () {
        return $.SUBRULE2($.opBinaryCompare);
      }
    }
  ]);
});

$.RULE("opBinaryCompare", function() {
  return $.OR([
  {
    ALT: function () {
      return AST.makeNodeForToken(NT.OPLT, $.CONSUME1(T.LT));
    }
  },
  {
    ALT: function () {
      return AST.makeNodeForToken(NT.OPLE, $.CONSUME2(T.LE));
    }
  },
  {
    ALT: function () {
      return AST.makeNodeForToken(NT.OPGT, $.CONSUME3(T.GT));
    }
  },
  {
    ALT: function () {
      return AST.makeNodeForToken(NT.OPGE, $.CONSUME4(T.GE));
    }
  },
  {
    ALT: function () {
      return AST.makeNodeForToken(NT.OPEQ, $.CONSUME5(T.EQ));
    }
  },
  {
    ALT: function () {
      // deliberate recast,( ( not less than 3 CAT  )
      return AST.makeNodeForToken(NT.OPLT, $.CONSUME3(T.less_than));
    }
  },
  {
    ALT: function () {
      // deliberate recast!
      return AST.makeNodeForToken(NT.OPGT, $.CONSUME4(T.more_than));
    }
  },
  {
    ALT: function () {
      return AST.makeNodeForToken(NT.OPNE, $.CONSUME5(T.NE));
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
        SEP: T.Comma, DEF : function () {
           var atok =  $.CONSUME(T.CAT);
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
    (Parser as any).performSelfAnalysis(this);
  }

  SelectParser.prototype = Object.create(Parser.prototype);
  SelectParser.prototype.constructor = SelectParser;

//
export {
   SelectLexer,
   SelectParser
   // defaultRule : "selectStatement"
};
