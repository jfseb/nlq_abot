

  'use strict'
  import * as chevrotain from 'chevrotain';
    var createToken = chevrotain.createToken;

    var Tall = createToken({name: "all", pattern: /all/i });
var Tand = createToken({name: "and", pattern: /and/i });
var Ta = createToken({name: "a", pattern: /a/i });
var TAnANY = createToken({name: "AnANY", pattern: /AnANY/ });
var Tany = createToken({name: "any", pattern: /any/i });
var Tat = createToken({name: "at", pattern: /at/i });
var TCAT = createToken({name: "CAT", pattern: /CAT/ });
var TComma = createToken({name: "Comma", pattern: /,/i });
var Tcontaining = createToken({name: "containing", pattern: /containing/i });
var Tcontains = createToken({name: "contains", pattern: /contains/i });
var TDOM = createToken({name: "DOM", pattern: /DOM/ });
var Tdomain = createToken({name: "domain", pattern: /domain/i });
var Tending_with = createToken({name: "ending_with", pattern: /ending_with/i });
var Tending = createToken({name: "ending", pattern: /ending/i });
var Tends_with = createToken({name: "ends_with", pattern: /ends_with/i });
var Tends = createToken({name: "ends", pattern: /ends/i });
var TEQ = createToken({name: "EQ", pattern: /=/i });
var Tequals = createToken({name: "equals", pattern: /equals/i });
var Tevery = createToken({name: "every", pattern: /every/i });
var Texactly = createToken({name: "exactly", pattern: /exactly/i });
var Texisting = createToken({name: "existing", pattern: /existing/i });
var Te = createToken({name: "e", pattern: /e/i });
var TFACT = createToken({name: "FACT", pattern: /FACT/ });
var Tfirst = createToken({name: "first", pattern: /first/i });
var Tfor = createToken({name: "for", pattern: /for/i });
var Tfrom = createToken({name: "from", pattern: /from/i });
var TGE = createToken({name: "GE", pattern: />=/i });
var Tgreater = createToken({name: "greater", pattern: /greater/i });
var TGT = createToken({name: "GT", pattern: />/i });
var Tin = createToken({name: "in", pattern: /in/i });
var Tis = createToken({name: "is", pattern: /is/i });
var Tlast = createToken({name: "last", pattern: /last/i });
var Tlatest = createToken({name: "latest", pattern: /latest/i });
var TLE = createToken({name: "LE", pattern: /<=/i });
var Tleast = createToken({name: "least", pattern: /least/i });
var Tleat = createToken({name: "leat", pattern: /leat/i });
var Tleft_paren = createToken({name: "left_paren", pattern: /left_paren/i });
var Tless_than = createToken({name: "less_than", pattern: /less_than/i });
var Tless = createToken({name: "less", pattern: /less/i });
var Tlife = createToken({name: "life", pattern: /life/i });
var Tlist = createToken({name: "list", pattern: /list/i });
var Tlogical_and = createToken({name: "logical_and", pattern: /logical_and/i });
var Tlogical_or = createToken({name: "logical_or", pattern: /logical_or/i });
var TLParen = createToken({name: "LParen", pattern: /\(/i });
var TLT = createToken({name: "LT", pattern: /</i });
var Tmore_than = createToken({name: "more_than", pattern: /more_than/i });
var TNE = createToken({name: "NE", pattern: /!=/i });
var Tnewest = createToken({name: "newest", pattern: /newest/i });
var Tnot_existing = createToken({name: "not_existing", pattern: /not_existing/i });
var Tof = createToken({name: "of", pattern: /of/i });
var Toldest = createToken({name: "oldest", pattern: /oldest/i });
var Tone = createToken({name: "one", pattern: /one/i });
var Torder_by = createToken({name: "order_by", pattern: /order_by/i });
var Torder_descending_by = createToken({name: "order_descending_by", pattern: /order_descending_by/i });
var Tor = createToken({name: "or", pattern: /or/i });
var Trelating = createToken({name: "relating", pattern: /relating/i });
var Tright_paren = createToken({name: "right_paren", pattern: /right_paren/i });
var TRParen = createToken({name: "RParen", pattern: /\)/i });
var Tselect = createToken({name: "select", pattern: /select/i });
var Tshort = createToken({name: "short", pattern: /short/i });
var Tstarting_with = createToken({name: "starting_with", pattern: /starting_with/i });
var Tstarting = createToken({name: "starting", pattern: /starting/i });
var Tstarts_with = createToken({name: "starts_with", pattern: /starts_with/i });
var Tstarts = createToken({name: "starts", pattern: /starts/i });
var Tthan = createToken({name: "than", pattern: /than/i });
var Tthe = createToken({name: "the", pattern: /the/i });
var Twhere = createToken({name: "where", pattern: /where/i });
var Twith = createToken({name: "with", pattern: /with/i });
var TInteger = createToken({name: "Integer", pattern: /0[1-9]\d+/i });
var TIdentifier = createToken({name: "Identifier", pattern: /\w+/i });

    
    export const Tokens = {
   all : Tall ,
 and : Tand ,
 a : Ta ,
 AnANY : TAnANY ,
 any : Tany ,
 at : Tat ,
 CAT : TCAT ,
 Comma : TComma ,
 containing : Tcontaining ,
 contains : Tcontains ,
 DOM : TDOM ,
 domain : Tdomain ,
 ending_with : Tending_with ,
 ending : Tending ,
 ends_with : Tends_with ,
 ends : Tends ,
 EQ : TEQ ,
 equals : Tequals ,
 every : Tevery ,
 exactly : Texactly ,
 existing : Texisting ,
 e : Te ,
 FACT : TFACT ,
 first : Tfirst ,
 for : Tfor ,
 from : Tfrom ,
 GE : TGE ,
 greater : Tgreater ,
 GT : TGT ,
 in : Tin ,
 is : Tis ,
 last : Tlast ,
 latest : Tlatest ,
 LE : TLE ,
 least : Tleast ,
 leat : Tleat ,
 left_paren : Tleft_paren ,
 less_than : Tless_than ,
 less : Tless ,
 life : Tlife ,
 list : Tlist ,
 logical_and : Tlogical_and ,
 logical_or : Tlogical_or ,
 LParen : TLParen ,
 LT : TLT ,
 more_than : Tmore_than ,
 NE : TNE ,
 newest : Tnewest ,
 not_existing : Tnot_existing ,
 of : Tof ,
 oldest : Toldest ,
 one : Tone ,
 order_by : Torder_by ,
 order_descending_by : Torder_descending_by ,
 or : Tor ,
 relating : Trelating ,
 right_paren : Tright_paren ,
 RParen : TRParen ,
 select : Tselect ,
 short : Tshort ,
 starting_with : Tstarting_with ,
 starting : Tstarting ,
 starts_with : Tstarts_with ,
 starts : Tstarts ,
 than : Tthan ,
 the : Tthe ,
 where : Twhere ,
 with : Twith ,
 Integer : TInteger ,
 Identifier : TIdentifier 
    };
    export const OperatorLookup = {
       "all" : Tall ,
 "and" : Tand ,
 "a" : Ta ,
 "AnANY" : TAnANY ,
 "any" : Tany ,
 "at" : Tat ,
 "CAT" : TCAT ,
 "," : TComma ,
 "containing" : Tcontaining ,
 "contains" : Tcontains ,
 "DOM" : TDOM ,
 "domain" : Tdomain ,
 "ending with" : Tending_with ,
 "ending" : Tending ,
 "ends with" : Tends_with ,
 "ends" : Tends ,
 "=" : TEQ ,
 "equals" : Tequals ,
 "every" : Tevery ,
 "exactly" : Texactly ,
 "existing" : Texisting ,
 "e" : Te ,
 "FACT" : TFACT ,
 "first" : Tfirst ,
 "for" : Tfor ,
 "from" : Tfrom ,
 ">=" : TGE ,
 "greater" : Tgreater ,
 ">" : TGT ,
 "in" : Tin ,
 "is" : Tis ,
 "last" : Tlast ,
 "latest" : Tlatest ,
 "<=" : TLE ,
 "least" : Tleast ,
 "leat" : Tleat ,
 "left_paren" : Tleft_paren ,
 "less than" : Tless_than ,
 "less" : Tless ,
 "life" : Tlife ,
 "list" : Tlist ,
 "logical_and" : Tlogical_and ,
 "logical_or" : Tlogical_or ,
 "(" : TLParen ,
 "<" : TLT ,
 "more than" : Tmore_than ,
 "!=" : TNE ,
 "newest" : Tnewest ,
 "not existing" : Tnot_existing ,
 "of" : Tof ,
 "oldest" : Toldest ,
 "one" : Tone ,
 "order by" : Torder_by ,
 "order descending by" : Torder_descending_by ,
 "or" : Tor ,
 "relating" : Trelating ,
 "right_paren" : Tright_paren ,
 ")" : TRParen ,
 "select" : Tselect ,
 "short" : Tshort ,
 "starting with" : Tstarting_with ,
 "starting" : Tstarting ,
 "starts with" : Tstarts_with ,
 "starts" : Tstarts ,
 "than" : Tthan ,
 "the" : Tthe ,
 "where" : Twhere ,
 "with" : Twith ,
 "123" : TInteger ,
 "identifier" : TIdentifier 
        };
  
  