'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMongoMatchF = exports.makeMongoExplicitSort = exports.makeMongoSortFromAst = exports.makeMongoProjectionFromAst = exports.getCategoryList = exports.makeMongoColumnsFromAst = exports.makeMongoGroupFromAst = exports.extractExplicitSortFromAst = exports.makeMongoMatchFromAst = exports.amendCategoryList = exports.coerceFactLiteralToType = exports.isNumericTypeOrHasNumericType = exports.isArray = exports.getNumberArg = exports.addFilterExpr = exports.makeOpFilter = exports.makeMongoName = exports.getFactForNode = exports.getCategoryForNode = exports.getCategoryForNodePair = void 0;
const debug = require("debugf");
const _ = require("lodash");
const index_model_1 = require("../model/index_model"); // mgnlq_model';
const debuglog = debug('ast2MQuery');
const chevrotain = require("chevrotain");
const AST = require("../ast");
const ast_1 = require("../ast");
// import * as Sentenceparser from '../sentenceparser';
var createToken = chevrotain.createToken;
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;
;
function getCategoryForNodePair(nodeCat, nodeFact, sentence) {
    //  either           <CAT> <FACT>
    //  or               undefined <FACT>
    //  or  More than    <number> <CAT>
    if (nodeCat && nodeCat.bearer && nodeCat.bearer.image === 'NUMBER') {
        return getCategoryForNodePair(nodeFact, nodeFact, sentence);
    }
    var startIndex = nodeCat && nodeCat.bearer && nodeCat.bearer.startOffset;
    debuglog('StartIndex : ' + startIndex);
    debuglog('StartIndex : ' + JSON.stringify(nodeCat, undefined, 2));
    if (typeof startIndex === "number" && (startIndex >= 0)) {
        return sentence[startIndex].matchedString;
    }
    if (!nodeCat || nodeCat.children.length === 0 || nodeCat.bearer === undefined) {
        var factIndex = nodeFact.bearer.startOffset;
        debuglog(JSON.stringify(sentence[factIndex], undefined, 2));
        return sentence[factIndex].category;
    }
    debug(' found no category ');
    return undefined;
}
exports.getCategoryForNodePair = getCategoryForNodePair;
;
function getCategoryForNode(nodeCat, sentence) {
    var startIndex = nodeCat && nodeCat.bearer && nodeCat.bearer.startOffset;
    if (nodeCat.type !== ast_1.ASTNodeType.CAT) {
        throw new Error(`Expected nodetype ${new AST.NodeType(ast_1.ASTNodeType.CAT).toString()} but was ${new AST.NodeType(nodeCat.type).toString()}`);
    }
    if (startIndex !== undefined && (startIndex >= 0)) {
        return sentence[startIndex].matchedString;
    }
    throw new Error(' no startindex' + JSON.stringify(nodeCat));
}
exports.getCategoryForNode = getCategoryForNode;
;
function getFactForNode(nodeFact, sentence) {
    var factIndex = nodeFact.bearer.startOffset;
    //console.log(JSON.stringify(sentence[factIndex], undefined, 2));
    return sentence[factIndex].matchedString; //.category;
}
exports.getFactForNode = getFactForNode;
;
function makeMongoName(s) {
    return index_model_1.MongoMap.makeCanonicPropertyName(s);
}
exports.makeMongoName = makeMongoName;
function makeFilterObj(cat, filter) {
    var filterObj = {};
    filterObj[cat] = filter;
    return filterObj;
}
function makeOpFilter(catpath, op, literal) {
    var filterObj = {};
    filterObj[op] = [{ $eval: catpath }, literal];
    return filterObj;
}
exports.makeOpFilter = makeOpFilter;
function addFilterExpr(res, expr) {
    debuglog("addFilterExpr " + JSON.stringify(expr));
    if (res['$and']) {
        res['$and'].push(expr);
        return res;
    }
    res['$and'] = [expr];
    return res;
}
exports.addFilterExpr = addFilterExpr;
;
function getNumberArg(node, sentence) {
    var startIndex = node && node.bearer && node.bearer.startOffset;
    if (node.type !== ast_1.ASTNodeType.NUMBER) {
        throw new Error(`Expected nodetype ${new AST.NodeType(ast_1.ASTNodeType.CAT).toString()} but was ${new AST.NodeType(node.type).toString()}`);
    }
    if (startIndex !== undefined && (startIndex >= 0)) {
        //TODO treat one, two
        return parseInt(sentence[startIndex].matchedString);
    }
    throw new Error(' no startindex' + JSON.stringify(node));
}
exports.getNumberArg = getNumberArg;
;
function isArray(mongoHandleRaw, domain, category) {
    var cat = index_model_1.Model.getCategoryRec(mongoHandleRaw, domain, category);
    return _.isArray(cat.type);
}
exports.isArray = isArray;
function isNumericTypeOrHasNumericType(mongoHandleRaw, domain, category) {
    var cat = index_model_1.Model.getCategoryRec(mongoHandleRaw, domain, category);
    //console.log("category " + category + "  -> " + JSON.stringify(cat));
    var res = (cat.type == "Number" /* Number */) || (_.isArray(cat.type) && cat.type.indexOf("Number" /* Number */) >= 0);
    if (res) {
        debuglog(() => "category " + category + " is NumericOrHasNumeric -> " + JSON.stringify(cat));
    }
    return res;
}
exports.isNumericTypeOrHasNumericType = isNumericTypeOrHasNumericType;
function coerceFactLiteralToType(isNumeric, fact) {
    if (isNumeric) {
        try {
            var r = parseInt(fact);
            if (Number.isNaN(r)) {
                return fact;
            }
            return r;
        }
        catch (e) { }
    }
    return fact;
}
exports.coerceFactLiteralToType = coerceFactLiteralToType;
function amendCategoryList(extractSortResult, catList) {
    var res = [];
    extractSortResult.forEach(a => {
        var name = a.categoryName;
        if (!catList.includes(name)) {
            res.push(name);
        }
    });
    res = res.concat(catList);
    return res;
}
exports.amendCategoryList = amendCategoryList;
function makeMongoMatchFromAst(node, sentence, mongoMap, domain, mongoHandleRaw) {
    debuglog(AST.astToText(node));
    //console.log("making mongo match " + AST.astToText(node));
    if (!node) {
        return { $match: {} };
    }
    if (node.type !== ast_1.ASTNodeType.LIST) {
        throw new Error('expected different nodetype ' + node.type);
    }
    var res = {};
    node.children.forEach(n => {
        var category = getCategoryForNodePair(n.children[0], n.children[1], sentence);
        //console.log('here is the domain ' + Object.keys(theModel.mongoHandle.mongoMaps).join("\n"));
        //console.log(JSON.stringify(theModel.mongoHandle.mongoMaps[mongodomain], undefined,2));
        var mongocatfullpath = mongoMap[category].fullpath; // Model.getMongoosePath(theModel, category); //makeMongoName(cat);
        debuglog(() => `here is the fullpath for ${category} is ${mongocatfullpath} `);
        var fact = (n.children.length > 1) && getFactForNode(n.children[1], sentence);
        var catIsNumeric = isNumericTypeOrHasNumericType(mongoHandleRaw, domain, category);
        var factCoerced = coerceFactLiteralToType(catIsNumeric, fact);
        if (n.type === ast_1.ASTNodeType.OPEqIn) {
            res = addFilterExpr(res, makeOpFilter(mongocatfullpath, "$eq", factCoerced));
        }
        else if (n.type === ast_1.ASTNodeType.OPStartsWith) {
            res = addFilterExpr(res, makeOpFilter(mongocatfullpath, "$regex", { $regex: new RegExp(`^${fact.toLowerCase()}`, "i") }));
        }
        else if (n.type === ast_1.ASTNodeType.OPEndsWith) {
            debuglog(() => '!!!!adding regex with expression ' + fact.toLowerCase());
            res = addFilterExpr(res, makeOpFilter(mongocatfullpath, "$regex", { $regex: new RegExp(`${fact.toLowerCase()}$`, "i") }));
        } /* else if (n.type === NT.OPMoreThan) {
          var numberarg = getNumberArg(n.children[0], sentence);
          debuglog(() => '!!!!adding more than ' + numberarg + ' for category ' + category );
          //TODO //res = addFilterToMatch(res, mongocatfullpath, { 'count' ( mongocatfullpath ) gt numberarg , "i") });
          var argpath = '$' + mongocatfullpath;
          res = addFilterExpr( res,
            { $expr: { $gt: [ { $switch: { branches: [ { case: { $isArray : argpath }, then: { $size: argpath } }], default : 1 }}
                            , numberarg ]}} );
    
    //
    //        { $expr: { $gt: [ { $size: '$standort'},1 ]}} );
    //      ([ { $match : { $expr: { $gt: [ { $size: argpath }, numberarg ]}}}]);
    // two stage
    // use $addFields  with 3.4
    // try also $expr directly
    //       > db.demomdls.aggregate([ { $project : { standort_size : { $size: '$standort' }, standort:1, sender:1, uu : { $gt:[ { $size: '$standort' },3]} , abx : { $gt:[ "$standort", 1]}}}, { $match: { "standort_size": { $eq: { $size: '$standort'} }}}]);
    //      > db.demomdls.aggregate([ { $project : { standort_size : { $size: '$standort' }, standort:1, sender:1, uu : { $gt:[ { $size: '$standort' },3]} , abx : { $gt:[ "$standort", 1]}}}, { $match: { "standort_size": { $gt: 1 }}}]);
    //      { "_id" : ObjectId("5db88a185b66759cfc56bcd4"), "standort" : [ "Berlin", "München", "Frankfurt", "Hamburg", "Bremen" ], "sender" : "ARundfunkD", "standort_size" : 5, "uu" : true, "abx" : true }
    
    
        // exact match: db.demomdls.aggregate([ { $match: { standort : { $size : 3 }}},
    
        }*/
        else if (n.type === ast_1.ASTNodeType.OPLessThan || n.type === ast_1.ASTNodeType.OPMoreThan || n.type == ast_1.ASTNodeType.OPExactly) {
            // flavours: 
            // less_than 3 CAT    ( a count measure )
            var numberarg = getNumberArg(n.children[0], sentence);
            debuglog(() => '!!!!adding more than ' + numberarg + ' for category ' + category);
            var argpath = mongocatfullpath;
            // TODO evaluate this now
            var extract = [{ $ARRAYSIZE_OR_VAL_OR1: argpath },
                numberarg];
            switch (n.type) {
                case ast_1.ASTNodeType.OPLessThan:
                    res = addFilterExpr(res, { $expr: { $lt: extract } });
                    break;
                case ast_1.ASTNodeType.OPMoreThan:
                    res = addFilterExpr(res, { $expr: { $gt: extract } });
                    break;
                case ast_1.ASTNodeType.OPExactly:
                    res = addFilterExpr(res, { $expr: { $eq: extract } });
                    break;
            }
        }
        else if (n.type === ast_1.ASTNodeType.OPContains) {
            res = addFilterExpr(res, makeOpFilter(mongocatfullpath, "$regex", { $regex: new RegExp(`${fact.toLowerCase()}`, "i") }));
        }
        else if (n.type === ast_1.ASTNodeType.OPGT || n.type === ast_1.ASTNodeType.OPLT
            || n.type == ast_1.ASTNodeType.OPEQ || n.type == ast_1.ASTNodeType.OPNE
            || n.type == ast_1.ASTNodeType.OPGE || n.type == ast_1.ASTNodeType.OPLE) {
            var fact = getFactForNode(n.children[1], sentence);
            var factCoerced = coerceFactLiteralToType(catIsNumeric, fact);
            var argpath = mongocatfullpath;
            var extract2 = [argpath, factCoerced];
            // $switch: { branches: [ { case: { $isArray : argpath }, then: { $size: argpath } }], default : 1 }}
            var opstr = '$lt';
            switch (n.type) {
                case ast_1.ASTNodeType.OPLT:
                    opstr = '$lt';
                    break;
                case ast_1.ASTNodeType.OPGT:
                    opstr = '$gt';
                    break;
                case ast_1.ASTNodeType.OPEQ:
                    opstr = '$eq';
                    break;
                case ast_1.ASTNodeType.OPNE:
                    opstr = '$ne';
                    break;
                case ast_1.ASTNodeType.OPLE:
                    opstr = '$lte';
                    break;
                case ast_1.ASTNodeType.OPGE:
                    opstr = '$gte';
                    break;
            }
            if (isArray(mongoHandleRaw, domain, category)) {
                var filterobjE = makeOpFilter(mongocatfullpath, opstr, factCoerced);
                res = addFilterExpr(res, filterobjE);
            }
            else {
                debuglog(() => 'NOT AN ARRAY FOR ' + mongocatfullpath + " " + factCoerced);
                var filterobj = makeOpFilter(mongocatfullpath, opstr, factCoerced);
                res = addFilterExpr(res, filterobj);
            }
            //var numberarg = getNumberArg(n.children[0], sentence);
        }
        else if (n.type === ast_1.ASTNodeType.OPOrderBy || n.type === ast_1.ASTNodeType.OPOrderDescendingBy) {
            //var ascdesc = (n.type == NT.OPOrderDescendingBy) ? 1 : -1;
            // res = addSortExpression(res, addObjectProp( {}, mongocatfullpath, ascdesc ) );
            // TODO  this may be added in the wrong position
            //  one also has to assure the data is not projected out before
            //   throw new Error('Expected nodetype NT.OPEqIn but was ' + n.type);
            // { $sort : { sender : -1 } }`
        }
        else if (n.type === ast_1.ASTNodeType.OPNotExisting) {
            // { item : null }
            var filterobj = makeOpFilter(mongocatfullpath, "$exists", false);
            res = addFilterExpr(res, filterobj);
            //  throw new Error('Expected nodetype OPExisiting not supported here  NT.OPEqIn but was ' + n.type);
        }
        else if (n.type === ast_1.ASTNodeType.OPExisting) {
            var filterobj = makeOpFilter(mongocatfullpath, '$exists', true);
            res = addFilterExpr(res, filterobj);
            //  throw new Error('Expected nodetype OPExisiting not supported here  NT.OPEqIn but was ' + n.type);
        }
        else {
            throw new Error('Expected nodetype NT.OPEqIn but was ' + n.type);
        }
    });
    return { $match: res };
}
exports.makeMongoMatchFromAst = makeMongoMatchFromAst;
function extractExplicitSortFromAst(node, sentence, mongoMap, domain, mongoHandleRaw) {
    // return an array
    debuglog(AST.astToText(node));
    //console.log("making mongo match " + AST.astToText(node));
    if (!node) {
        return [];
    }
    if (node.type !== ast_1.ASTNodeType.LIST) {
        throw new Error('expected different nodetype ' + node.type);
    }
    var res = [];
    node.children.forEach(n => {
        var category = getCategoryForNodePair(n.children[0], n.children[1], sentence);
        var fullpath = mongoMap[category].fullpath; // Model.getMongoosePath(theModel, category); //makeMongoName(cat);
        var fact = (n.children.length > 1) && getFactForNode(n.children[1], sentence);
        if (n.type === ast_1.ASTNodeType.OPOrderBy || n.type === ast_1.ASTNodeType.OPOrderDescendingBy) {
            var ascdesc = (n.type == ast_1.ASTNodeType.OPOrderDescendingBy) ? 1 : -1;
            res.push({
                categoryName: category,
                fullpath: fullpath,
                ascDesc: ascdesc
            });
        }
    });
    return res;
}
exports.extractExplicitSortFromAst = extractExplicitSortFromAst;
function makeMongoGroupFromAst(categoryList, mongoMap) {
    var res = categoryList.map(cat => mongoMap[cat].shortName);
    /*
    var res = {};
    categoryList.forEach(category => {
      var fullpath = MongoMap.getFirstSegment(mongoMap[category].paths); // Model.getMongoosePath(theModel, category); //makeMongoName(cat);
      res[fullpath] = fullpath;
    });
    var r1 = { $group: Object.assign({ _id: Object.assign({}, res) }, {}) };
    var firstX = {};
    Object.keys(res).forEach(key => { firstX[key] = { $first: '$' + key } });
    r1.$group = Object.assign(r1.$group, firstX); */
    return { $group: res };
}
exports.makeMongoGroupFromAst = makeMongoGroupFromAst;
function makeMongoColumnsFromAst(categoryList, mongoMap) {
    var res = {
        columns: [],
        reverseMap: {}
    };
    categoryList.forEach(category => {
        res.columns.push(category);
        var catmongo = index_model_1.MongoMap.getShortProjectedName(mongoMap, category);
        if (category !== catmongo) {
            res.reverseMap[catmongo] = category;
        }
    });
    return res;
}
exports.makeMongoColumnsFromAst = makeMongoColumnsFromAst;
function getCategoryList(fixedCategories, node, sentence) {
    var res = fixedCategories.slice();
    while (node.type !== ast_1.ASTNodeType.LIST)
        node = node.children[0];
    debug(AST.astToText(node));
    if (node.type !== ast_1.ASTNodeType.LIST) {
        throw new Error('expected different nodetype ' + node.type);
    }
    node.children.map(n => {
        if (n.type === ast_1.ASTNodeType.CAT) {
            var category = getCategoryForNode(n, sentence);
            if (res.indexOf(category) < fixedCategories.length) {
                res.push(category);
            }
        }
        else {
            throw new Error(`Expected nodetype ${new AST.NodeType(ast_1.ASTNodeType.CAT).toString()} but was ${new AST.NodeType(n.type).toString()}`);
        }
    });
    return res;
}
exports.getCategoryList = getCategoryList;
function makeMongoProjectionFromAst(categoryList, mongoMap) {
    var res = {};
    categoryList.map(category => {
        var fullpath = mongoMap[category].fullpath; //makeMongoName(cat);
        var shortName = index_model_1.MongoMap.getShortProjectedName(mongoMap, category);
        if (shortName === fullpath) {
            res[fullpath] = 1;
        }
        else {
            res[shortName] = fullpath;
        }
    });
    return { $project: res };
}
exports.makeMongoProjectionFromAst = makeMongoProjectionFromAst;
function makeMongoSortFromAst(categoryList, mongoMap) {
    var res = {};
    categoryList.forEach(category => {
        var shortName = index_model_1.MongoMap.getShortProjectedName(mongoMap, category);
        res[shortName] = 1;
    });
    return { $sort: res };
}
exports.makeMongoSortFromAst = makeMongoSortFromAst;
;
function makeMongoExplicitSort(explicitSort, categoryList, mongoMap) {
    var res = {};
    explicitSort.forEach(es => {
        var mongoCatName = es.fullpath;
        res[mongoCatName] = es.ascDesc;
    });
    categoryList.forEach(category => {
        var shortName = index_model_1.MongoMap.getShortProjectedName(mongoMap, category);
        if (res[shortName] == undefined) {
            res[shortName] = 1;
        }
    });
    return { $sort: res };
}
exports.makeMongoExplicitSort = makeMongoExplicitSort;
function makeMongoMatchF(filters) {
    var res = { $match: {} };
    //console.log('is match \n');
    filters.forEach(filter => {
        res.$match[filter.cat] = filter.value;
    });
    return res;
}
exports.makeMongoMatchF = makeMongoMatchF;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hc3QycXVlcnkvYXN0Mk1RdWVyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUE7OztBQUlaLGdDQUFnQztBQUNoQyw0QkFBNEI7QUFFNUIsc0RBQW9GLENBQUMsZ0JBQWdCO0FBRXJHLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUVyQyx5Q0FBeUM7QUFDekMsOEJBQThCO0FBRTlCLGdDQUEyQztBQUkzQyx1REFBdUQ7QUFFdkQsSUFBSSxXQUFXLEdBQUcsVUFBVSxDQUFDLFdBQVcsQ0FBQztBQUN6QyxJQUFJLEtBQUssR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDO0FBQzdCLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7QUFLOUIsQ0FBQztBQUVGLFNBQWdCLHNCQUFzQixDQUFDLE9BQW9CLEVBQUUsUUFBcUIsRUFBRSxRQUE0QjtJQUM5RyxpQ0FBaUM7SUFDakMscUNBQXFDO0lBQ3JDLG1DQUFtQztJQUNuQyxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxLQUFLLFFBQVEsRUFBRTtRQUNsRSxPQUFPLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDN0Q7SUFDRCxJQUFJLFVBQVUsR0FBRyxPQUFPLElBQUksT0FBTyxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQztJQUN6RSxRQUFRLENBQUMsZUFBZSxHQUFHLFVBQVUsQ0FBQyxDQUFDO0lBQ3ZDLFFBQVEsQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEUsSUFBSSxPQUFPLFVBQVUsS0FBSyxRQUFRLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxDQUFDLEVBQUU7UUFDdkQsT0FBTyxR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RUFBRSxDQUFDO0FBQ3hCLENBQUM7QUFiRCxzREFhQztBQUlELFNBQWdCLGVBQWUsQ0FBQyxPQUFrQjtJQUNoRCxJQUFJLEdBQUcsR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQztJQUN6Qiw2QkFBNkI7SUFDN0IsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUN2QixHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ3hDLENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBUEQsMENBT0MiLCJmaWxlIjoiYXN0MnF1ZXJ5L2FzdDJNUXVlcnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcclxuXHJcbmltcG9ydCB7IFNlbnRlbmNlIGFzIFNlbnRlbmNlLCBJRkVyQmFzZSBhcyBJRkVyQmFzZSB9IGZyb20gJy4uL21hdGNoL2VyX2luZGV4JztcclxuXHJcbmltcG9ydCAqIGFzIGRlYnVnIGZyb20gJ2RlYnVnZic7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcclxuXHJcbmltcG9ydCB7IElGTW9kZWwgYXMgSUZNb2RlbCwgTW9uZ29NYXAsIE1vZGVsIGFzIE1vZGVsIH0gZnJvbSAnLi4vbW9kZWwvaW5kZXhfbW9kZWwnOyAvLyBtZ25scV9tb2RlbCc7XHJcblxyXG5jb25zdCBkZWJ1Z2xvZyA9IGRlYnVnKCdhc3QyTVF1ZXJ5Jyk7XHJcblxyXG5pbXBvcnQgKiBhcyBjaGV2cm90YWluIGZyb20gJ2NoZXZyb3RhaW4nO1xyXG5pbXBvcnQgKiBhcyBBU1QgZnJvbSAnLi4vYXN0JztcclxuXHJcbmltcG9ydCB7IEFTVE5vZGVUeXBlIGFzIE5UIH0gZnJvbSAnLi4vYXN0JztcclxuaW1wb3J0IHsgSU1vbmdvb3NlQmFzZVR5cGUgfSBmcm9tICcuLi9tYXRjaC9pZm1hdGNoJztcclxuaW1wb3J0IHsgQ29uc29sZSB9IGZyb20gJ2NvbnNvbGUnO1xyXG5cclxuLy8gaW1wb3J0ICogYXMgU2VudGVuY2VwYXJzZXIgZnJvbSAnLi4vc2VudGVuY2VwYXJzZXInO1xyXG5cclxudmFyIGNyZWF0ZVRva2VuID0gY2hldnJvdGFpbi5jcmVhdGVUb2tlbjtcclxudmFyIExleGVyID0gY2hldnJvdGFpbi5MZXhlcjtcclxudmFyIFBhcnNlciA9IGNoZXZyb3RhaW4uUGFyc2VyO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJRmlsdGVyIHtcclxuICBjYXQ6IHN0cmluZyxcclxuICB2YWx1ZTogc3RyaW5nXHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2F0ZWdvcnlGb3JOb2RlUGFpcihub2RlQ2F0OiBBU1QuQVNUTm9kZSwgbm9kZUZhY3Q6IEFTVC5BU1ROb2RlLCBzZW50ZW5jZTogSUZFckJhc2UuSVNlbnRlbmNlKSB7XHJcbiAgLy8gIGVpdGhlciAgICAgICAgICAgPENBVD4gPEZBQ1Q+XHJcbiAgLy8gIG9yICAgICAgICAgICAgICAgdW5kZWZpbmVkIDxGQUNUPlxyXG4gIC8vICBvciAgTW9yZSB0aGFuICAgIDxudW1iZXI+IDxDQVQ+XHJcbiAgaWYgKG5vZGVDYXQgJiYgbm9kZUNhdC5iZWFyZXIgJiYgbm9kZUNhdC5iZWFyZXIuaW1hZ2UgPT09ICdOVU1CRVInKSB7XHJcbiAgICByZXR1cm4gZ2V0Q2F0ZWdvcnlGb3JOb2RlUGFpcihub2RlRmFjdCwgbm9kZUZhY3QsIHNlbnRlbmNlKTtcclxuICB9XHJcbiAgdmFyIHN0YXJ0SW5kZXggPSBub2RlQ2F0ICYmIG5vZGVDYXQuYmVhcmVyICYmIG5vZGVDYXQuYmVhcmVyLnN0YXJ0T2Zmc2V0O1xyXG4gIGRlYnVnbG9nKCdTdGFydEluZGV4IDogJyArIHN0YXJ0SW5kZXgpO1xyXG4gIGRlYnVnbG9nKCdTdGFydEluZGV4IDogJyArIEpTT04uc3RyaW5naWZ5KG5vZGVDYXQsIHVuZGVmaW5lZCwgMikpO1xyXG4gIGlmICh0eXBlb2Ygc3RhcnRJbmRleCA9PT0gXCJudW1iZXJcIiAmJiAoc3RhcnRJbmRleCA+PSAwKSkge1xyXG4gICAgcmV0dXJuIHNlbnRlbmNlW3N0YXJ0SW5kZXhdLm1hdGNoZWRTdHJpbmc7XHJcbiAgfVxyXG4gIGlmICghbm9kZUNhdCB8fCBub2RlQ2F0LmNoaWxkcmVuLmxlbmd0aCA9PT0gMCB8fCBub2RlQ2F0LmJlYXJlciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICB2YXIgZmFjdEluZGV4ID0gbm9kZUZhY3QuYmVhcmVyLnN0YXJ0T2Zmc2V0O1xyXG4gICAgZGVidWdsb2coSlNPTi5zdHJpbmdpZnkoc2VudGVuY2VbZmFjdEluZGV4XSwgdW5kZWZpbmVkLCAyKSk7XHJcbiAgICByZXR1cm4gc2VudGVuY2VbZmFjdEluZGV4XS5jYXRlZ29yeTtcclxuICB9XHJcbiAgZGVidWcoJyBmb3VuZCBubyBjYXRlZ29yeSAnKTtcclxuICByZXR1cm4gdW5kZWZpbmVkO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldENhdGVnb3J5Rm9yTm9kZShub2RlQ2F0OiBBU1QuQVNUTm9kZSwgc2VudGVuY2U6IElGRXJCYXNlLklTZW50ZW5jZSkge1xyXG4gIHZhciBzdGFydEluZGV4ID0gbm9kZUNhdCAmJiBub2RlQ2F0LmJlYXJlciAmJiBub2RlQ2F0LmJlYXJlci5zdGFydE9mZnNldDtcclxuICBpZiAobm9kZUNhdC50eXBlICE9PSBOVC5DQVQpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgbm9kZXR5cGUgJHtuZXcgQVNULk5vZGVUeXBlKE5ULkNBVCkudG9TdHJpbmcoKX0gYnV0IHdhcyAke25ldyBBU1QuTm9kZVR5cGUobm9kZUNhdC50eXBlKS50b1N0cmluZygpfWApO1xyXG4gIH1cclxuICBpZiAoc3RhcnRJbmRleCAhPT0gdW5kZWZpbmVkICYmIChzdGFydEluZGV4ID49IDApKSB7XHJcbiAgICByZXR1cm4gc2VudGVuY2Vbc3RhcnRJbmRleF0ubWF0Y2hlZFN0cmluZztcclxuICB9XHJcbiAgdGhyb3cgbmV3IEVycm9yKCcgbm8gc3RhcnRpbmRleCcgKyBKU09OLnN0cmluZ2lmeShub2RlQ2F0KSk7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RmFjdEZvck5vZGUobm9kZUZhY3Q6IEFTVC5BU1ROb2RlLCBzZW50ZW5jZTogSUZFckJhc2UuSVNlbnRlbmNlKSB7XHJcbiAgdmFyIGZhY3RJbmRleCA9IG5vZGVGYWN0LmJlYXJlci5zdGFydE9mZnNldDtcclxuICAvL2NvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHNlbnRlbmNlW2ZhY3RJbmRleF0sIHVuZGVmaW5lZCwgMikpO1xyXG4gIHJldHVybiBzZW50ZW5jZVtmYWN0SW5kZXhdLm1hdGNoZWRTdHJpbmc7IC8vLmNhdGVnb3J5O1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VNb25nb05hbWUoczogc3RyaW5nKTogc3RyaW5nIHtcclxuICByZXR1cm4gTW9uZ29NYXAubWFrZUNhbm9uaWNQcm9wZXJ0eU5hbWUocyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1ha2VGaWx0ZXJPYmooY2F0LCBmaWx0ZXIpIHtcclxuICB2YXIgZmlsdGVyT2JqID0ge307XHJcbiAgZmlsdGVyT2JqW2NhdF0gPSBmaWx0ZXI7XHJcbiAgcmV0dXJuIGZpbHRlck9iajtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VPcEZpbHRlcihjYXRwYXRoLCBvcCwgbGl0ZXJhbCkge1xyXG4gIHZhciBmaWx0ZXJPYmogPSB7fTtcclxuICBmaWx0ZXJPYmpbb3BdID0gWyB7ICRldmFsIDogY2F0cGF0aCB9LCBsaXRlcmFsXTsgXHJcbiAgcmV0dXJuIGZpbHRlck9iajtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFkZEZpbHRlckV4cHIocmVzLCBleHByOiBhbnkpIHtcclxuICBkZWJ1Z2xvZyhcImFkZEZpbHRlckV4cHIgXCIgKyBKU09OLnN0cmluZ2lmeShleHByKSk7XHJcbiAgaWYgKHJlc1snJGFuZCddKSB7XHJcbiAgICByZXNbJyRhbmQnXS5wdXNoKGV4cHIpO1xyXG4gICAgcmV0dXJuIHJlcztcclxuICB9XHJcbiAgcmVzWyckYW5kJ10gPSBbZXhwcl07XHJcbiAgcmV0dXJuIHJlcztcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXROdW1iZXJBcmcobm9kZTogQVNULkFTVE5vZGUsIHNlbnRlbmNlOiBJRkVyQmFzZS5JU2VudGVuY2UpOiBudW1iZXIgeyAvLyAhISByZXR1cm5zIGEgbnVtYmVyIFxyXG4gIHZhciBzdGFydEluZGV4ID0gbm9kZSAmJiBub2RlLmJlYXJlciAmJiBub2RlLmJlYXJlci5zdGFydE9mZnNldDtcclxuICBpZiAobm9kZS50eXBlICE9PSBOVC5OVU1CRVIpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgbm9kZXR5cGUgJHtuZXcgQVNULk5vZGVUeXBlKE5ULkNBVCkudG9TdHJpbmcoKX0gYnV0IHdhcyAke25ldyBBU1QuTm9kZVR5cGUobm9kZS50eXBlKS50b1N0cmluZygpfWApO1xyXG4gIH1cclxuICBpZiAoc3RhcnRJbmRleCAhPT0gdW5kZWZpbmVkICYmIChzdGFydEluZGV4ID49IDApKSB7XHJcbiAgICAvL1RPRE8gdHJlYXQgb25lLCB0d29cclxuICAgIHJldHVybiBwYXJzZUludChzZW50ZW5jZVtzdGFydEluZGV4XS5tYXRjaGVkU3RyaW5nKTtcclxuICB9XHJcbiAgdGhyb3cgbmV3IEVycm9yKCcgbm8gc3RhcnRpbmRleCcgKyBKU09OLnN0cmluZ2lmeShub2RlKSk7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNBcnJheShtb25nb0hhbmRsZVJhdzogSUZNb2RlbC5JTW9kZWxIYW5kbGVSYXcsIGRvbWFpbjogc3RyaW5nLCBjYXRlZ29yeTogc3RyaW5nKSB7XHJcbiAgdmFyIGNhdCA9IE1vZGVsLmdldENhdGVnb3J5UmVjKG1vbmdvSGFuZGxlUmF3LCBkb21haW4sIGNhdGVnb3J5KTtcclxuICByZXR1cm4gXy5pc0FycmF5KGNhdC50eXBlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzTnVtZXJpY1R5cGVPckhhc051bWVyaWNUeXBlKG1vbmdvSGFuZGxlUmF3OiBJRk1vZGVsLklNb2RlbEhhbmRsZVJhdywgZG9tYWluOiBzdHJpbmcsIGNhdGVnb3J5OiBzdHJpbmcpIDogYm9vbGVhbiB7XHJcbiAgdmFyIGNhdCA9IE1vZGVsLmdldENhdGVnb3J5UmVjKG1vbmdvSGFuZGxlUmF3LCBkb21haW4sIGNhdGVnb3J5KTtcclxuICAvL2NvbnNvbGUubG9nKFwiY2F0ZWdvcnkgXCIgKyBjYXRlZ29yeSArIFwiICAtPiBcIiArIEpTT04uc3RyaW5naWZ5KGNhdCkpO1xyXG4gIHZhciByZXMgPSAoY2F0LnR5cGUgPT0gSU1vbmdvb3NlQmFzZVR5cGUuTnVtYmVyKSB8fCAoXy5pc0FycmF5KGNhdC50eXBlKSAmJiBjYXQudHlwZS5pbmRleE9mKElNb25nb29zZUJhc2VUeXBlLk51bWJlcikgPj0gMCk7XHJcbiAgaWYgKCByZXMgKSB7XHJcbiAgICBkZWJ1Z2xvZyggKCkgPT4gXCJjYXRlZ29yeSBcIiArIGNhdGVnb3J5ICsgXCIgaXMgTnVtZXJpY09ySGFzTnVtZXJpYyAtPiBcIiArIEpTT04uc3RyaW5naWZ5KGNhdCkpO1xyXG4gIH1cclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY29lcmNlRmFjdExpdGVyYWxUb1R5cGUoaXNOdW1lcmljOiBib29sZWFuLCBmYWN0OiBzdHJpbmcpOiBudW1iZXIgfCBzdHJpbmcge1xyXG4gIGlmIChpc051bWVyaWMpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHZhciByID0gcGFyc2VJbnQoZmFjdCk7XHJcbiAgICAgIGlmIChOdW1iZXIuaXNOYU4ocikpIHtcclxuICAgICAgICByZXR1cm4gZmFjdDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcjtcclxuICAgIH0gY2F0Y2ggKGUpIHsgfVxyXG4gIH1cclxuICByZXR1cm4gZmFjdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFtZW5kQ2F0ZWdvcnlMaXN0KGV4dHJhY3RTb3J0UmVzdWx0OiBhbnlbXSwgY2F0TGlzdDogc3RyaW5nW10pOiBzdHJpbmdbXSB7XHJcbiAgdmFyIHJlcyA9IFtdO1xyXG4gIGV4dHJhY3RTb3J0UmVzdWx0LmZvckVhY2goYSA9PiB7XHJcbiAgICB2YXIgbmFtZSA9IGEuY2F0ZWdvcnlOYW1lO1xyXG4gICAgaWYgKCFjYXRMaXN0LmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgIHJlcy5wdXNoKG5hbWUpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJlcyA9IHJlcy5jb25jYXQoY2F0TGlzdCk7XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VNb25nb01hdGNoRnJvbUFzdChub2RlOiBBU1QuQVNUTm9kZSwgc2VudGVuY2U6IElGRXJCYXNlLklTZW50ZW5jZSwgbW9uZ29NYXA6IElGTW9kZWwuQ2F0TW9uZ29NYXAsIGRvbWFpbjogc3RyaW5nLCBtb25nb0hhbmRsZVJhdzogSUZNb2RlbC5JTW9kZWxIYW5kbGVSYXcpIHtcclxuICBkZWJ1Z2xvZyhBU1QuYXN0VG9UZXh0KG5vZGUpKTtcclxuICAvL2NvbnNvbGUubG9nKFwibWFraW5nIG1vbmdvIG1hdGNoIFwiICsgQVNULmFzdFRvVGV4dChub2RlKSk7XHJcbiAgaWYgKCFub2RlKSB7XHJcbiAgICByZXR1cm4geyAkbWF0Y2g6IHt9IH07XHJcbiAgfVxyXG4gIGlmIChub2RlLnR5cGUgIT09IE5ULkxJU1QpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignZXhwZWN0ZWQgZGlmZmVyZW50IG5vZGV0eXBlICcgKyBub2RlLnR5cGUpO1xyXG4gIH1cclxuICB2YXIgcmVzID0ge307XHJcbiAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKG4gPT4ge1xyXG4gICAgdmFyIGNhdGVnb3J5ID0gZ2V0Q2F0ZWdvcnlGb3JOb2RlUGFpcihuLmNoaWxkcmVuWzBdLCBuLmNoaWxkcmVuWzFdLCBzZW50ZW5jZSk7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdoZXJlIGlzIHRoZSBkb21haW4gJyArIE9iamVjdC5rZXlzKHRoZU1vZGVsLm1vbmdvSGFuZGxlLm1vbmdvTWFwcykuam9pbihcIlxcblwiKSk7XHJcbiAgICAvL2NvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRoZU1vZGVsLm1vbmdvSGFuZGxlLm1vbmdvTWFwc1ttb25nb2RvbWFpbl0sIHVuZGVmaW5lZCwyKSk7XHJcbiAgICB2YXIgbW9uZ29jYXRmdWxscGF0aCA9IG1vbmdvTWFwW2NhdGVnb3J5XS5mdWxscGF0aDsgLy8gTW9kZWwuZ2V0TW9uZ29vc2VQYXRoKHRoZU1vZGVsLCBjYXRlZ29yeSk7IC8vbWFrZU1vbmdvTmFtZShjYXQpO1xyXG4gICAgZGVidWdsb2coKCkgPT4gYGhlcmUgaXMgdGhlIGZ1bGxwYXRoIGZvciAke2NhdGVnb3J5fSBpcyAke21vbmdvY2F0ZnVsbHBhdGh9IGApO1xyXG4gICAgdmFyIGZhY3QgPSAobi5jaGlsZHJlbi5sZW5ndGggPiAxKSAmJiBnZXRGYWN0Rm9yTm9kZShuLmNoaWxkcmVuWzFdLCBzZW50ZW5jZSk7XHJcbiAgICB2YXIgY2F0SXNOdW1lcmljID0gaXNOdW1lcmljVHlwZU9ySGFzTnVtZXJpY1R5cGUobW9uZ29IYW5kbGVSYXcsIGRvbWFpbiwgY2F0ZWdvcnkpO1xyXG4gICAgdmFyIGZhY3RDb2VyY2VkID0gY29lcmNlRmFjdExpdGVyYWxUb1R5cGUoY2F0SXNOdW1lcmljLCBmYWN0KTtcclxuICAgIGlmIChuLnR5cGUgPT09IE5ULk9QRXFJbikge1xyXG4gICAgICByZXMgPSBhZGRGaWx0ZXJFeHByKHJlcywgbWFrZU9wRmlsdGVyKG1vbmdvY2F0ZnVsbHBhdGgsIFwiJGVxXCIsIGZhY3RDb2VyY2VkKSk7XHJcbiAgICB9IGVsc2UgaWYgKG4udHlwZSA9PT0gTlQuT1BTdGFydHNXaXRoKSB7XHJcbiAgICAgIHJlcyA9IGFkZEZpbHRlckV4cHIocmVzLCBtYWtlT3BGaWx0ZXIoIG1vbmdvY2F0ZnVsbHBhdGgsIFwiJHJlZ2V4XCIsIHsgJHJlZ2V4OiBuZXcgUmVnRXhwKGBeJHtmYWN0LnRvTG93ZXJDYXNlKCl9YCwgXCJpXCIpIH0pKTtcclxuICAgIH0gZWxzZSBpZiAobi50eXBlID09PSBOVC5PUEVuZHNXaXRoKSB7XHJcbiAgICAgIGRlYnVnbG9nKCgpID0+ICchISEhYWRkaW5nIHJlZ2V4IHdpdGggZXhwcmVzc2lvbiAnICsgZmFjdC50b0xvd2VyQ2FzZSgpKTtcclxuICAgICAgcmVzID0gYWRkRmlsdGVyRXhwcihyZXMsIG1ha2VPcEZpbHRlciggbW9uZ29jYXRmdWxscGF0aCwgXCIkcmVnZXhcIiwgeyAkcmVnZXg6IG5ldyBSZWdFeHAoYCR7ZmFjdC50b0xvd2VyQ2FzZSgpfSRgLCBcImlcIikgfSkpO1xyXG4gICAgfS8qIGVsc2UgaWYgKG4udHlwZSA9PT0gTlQuT1BNb3JlVGhhbikge1xyXG4gICAgICB2YXIgbnVtYmVyYXJnID0gZ2V0TnVtYmVyQXJnKG4uY2hpbGRyZW5bMF0sIHNlbnRlbmNlKTtcclxuICAgICAgZGVidWdsb2coKCkgPT4gJyEhISFhZGRpbmcgbW9yZSB0aGFuICcgKyBudW1iZXJhcmcgKyAnIGZvciBjYXRlZ29yeSAnICsgY2F0ZWdvcnkgKTtcclxuICAgICAgLy9UT0RPIC8vcmVzID0gYWRkRmlsdGVyVG9NYXRjaChyZXMsIG1vbmdvY2F0ZnVsbHBhdGgsIHsgJ2NvdW50JyAoIG1vbmdvY2F0ZnVsbHBhdGggKSBndCBudW1iZXJhcmcgLCBcImlcIikgfSk7XHJcbiAgICAgIHZhciBhcmdwYXRoID0gJyQnICsgbW9uZ29jYXRmdWxscGF0aDtcclxuICAgICAgcmVzID0gYWRkRmlsdGVyRXhwciggcmVzLFxyXG4gICAgICAgIHsgJGV4cHI6IHsgJGd0OiBbIHsgJHN3aXRjaDogeyBicmFuY2hlczogWyB7IGNhc2U6IHsgJGlzQXJyYXkgOiBhcmdwYXRoIH0sIHRoZW46IHsgJHNpemU6IGFyZ3BhdGggfSB9XSwgZGVmYXVsdCA6IDEgfX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgLCBudW1iZXJhcmcgXX19ICk7XHJcblxyXG4vL1xyXG4vLyAgICAgICAgeyAkZXhwcjogeyAkZ3Q6IFsgeyAkc2l6ZTogJyRzdGFuZG9ydCd9LDEgXX19ICk7XHJcbi8vICAgICAgKFsgeyAkbWF0Y2ggOiB7ICRleHByOiB7ICRndDogWyB7ICRzaXplOiBhcmdwYXRoIH0sIG51bWJlcmFyZyBdfX19XSk7XHJcbi8vIHR3byBzdGFnZVxyXG4vLyB1c2UgJGFkZEZpZWxkcyAgd2l0aCAzLjRcclxuLy8gdHJ5IGFsc28gJGV4cHIgZGlyZWN0bHlcclxuLy8gICAgICAgPiBkYi5kZW1vbWRscy5hZ2dyZWdhdGUoWyB7ICRwcm9qZWN0IDogeyBzdGFuZG9ydF9zaXplIDogeyAkc2l6ZTogJyRzdGFuZG9ydCcgfSwgc3RhbmRvcnQ6MSwgc2VuZGVyOjEsIHV1IDogeyAkZ3Q6WyB7ICRzaXplOiAnJHN0YW5kb3J0JyB9LDNdfSAsIGFieCA6IHsgJGd0OlsgXCIkc3RhbmRvcnRcIiwgMV19fX0sIHsgJG1hdGNoOiB7IFwic3RhbmRvcnRfc2l6ZVwiOiB7ICRlcTogeyAkc2l6ZTogJyRzdGFuZG9ydCd9IH19fV0pO1xyXG4vLyAgICAgID4gZGIuZGVtb21kbHMuYWdncmVnYXRlKFsgeyAkcHJvamVjdCA6IHsgc3RhbmRvcnRfc2l6ZSA6IHsgJHNpemU6ICckc3RhbmRvcnQnIH0sIHN0YW5kb3J0OjEsIHNlbmRlcjoxLCB1dSA6IHsgJGd0OlsgeyAkc2l6ZTogJyRzdGFuZG9ydCcgfSwzXX0gLCBhYnggOiB7ICRndDpbIFwiJHN0YW5kb3J0XCIsIDFdfX19LCB7ICRtYXRjaDogeyBcInN0YW5kb3J0X3NpemVcIjogeyAkZ3Q6IDEgfX19XSk7XHJcbi8vICAgICAgeyBcIl9pZFwiIDogT2JqZWN0SWQoXCI1ZGI4OGExODViNjY3NTljZmM1NmJjZDRcIiksIFwic3RhbmRvcnRcIiA6IFsgXCJCZXJsaW5cIiwgXCJNw7xuY2hlblwiLCBcIkZyYW5rZnVydFwiLCBcIkhhbWJ1cmdcIiwgXCJCcmVtZW5cIiBdLCBcInNlbmRlclwiIDogXCJBUnVuZGZ1bmtEXCIsIFwic3RhbmRvcnRfc2l6ZVwiIDogNSwgXCJ1dVwiIDogdHJ1ZSwgXCJhYnhcIiA6IHRydWUgfVxyXG5cclxuXHJcbiAgICAvLyBleGFjdCBtYXRjaDogZGIuZGVtb21kbHMuYWdncmVnYXRlKFsgeyAkbWF0Y2g6IHsgc3RhbmRvcnQgOiB7ICRzaXplIDogMyB9fX0sXHJcblxyXG4gICAgfSovXHJcbiAgICBlbHNlIGlmIChuLnR5cGUgPT09IE5ULk9QTGVzc1RoYW4gfHwgbi50eXBlID09PSBOVC5PUE1vcmVUaGFuIHx8IG4udHlwZSA9PSBOVC5PUEV4YWN0bHkpIHtcclxuICAgICAgLy8gZmxhdm91cnM6IFxyXG4gICAgICAvLyBsZXNzX3RoYW4gMyBDQVQgICAgKCBhIGNvdW50IG1lYXN1cmUgKVxyXG4gICAgICB2YXIgbnVtYmVyYXJnID0gZ2V0TnVtYmVyQXJnKG4uY2hpbGRyZW5bMF0sIHNlbnRlbmNlKTtcclxuICAgICAgZGVidWdsb2coKCkgPT4gJyEhISFhZGRpbmcgbW9yZSB0aGFuICcgKyBudW1iZXJhcmcgKyAnIGZvciBjYXRlZ29yeSAnICsgY2F0ZWdvcnkpO1xyXG4gICAgICB2YXIgYXJncGF0aCA9IG1vbmdvY2F0ZnVsbHBhdGg7XHJcbiAgICAgIC8vIFRPRE8gZXZhbHVhdGUgdGhpcyBub3dcclxuICAgICAgdmFyIGV4dHJhY3QgPSBbeyAkQVJSQVlTSVpFX09SX1ZBTF9PUjEgOiBhcmdwYXRoIH1cclxuICAgICAgICAsIG51bWJlcmFyZ107XHJcbiAgICAgIHN3aXRjaCAobi50eXBlKSB7XHJcbiAgICAgICAgY2FzZSBOVC5PUExlc3NUaGFuOiByZXMgPSBhZGRGaWx0ZXJFeHByKHJlcywgeyAkZXhwcjogeyAkbHQ6IGV4dHJhY3QgfSB9KTsgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBOVC5PUE1vcmVUaGFuOiByZXMgPSBhZGRGaWx0ZXJFeHByKHJlcywgeyAkZXhwcjogeyAkZ3Q6IGV4dHJhY3QgfSB9KTsgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBOVC5PUEV4YWN0bHk6IHJlcyA9IGFkZEZpbHRlckV4cHIocmVzLCB7ICRleHByOiAgeyAkZXE6IGV4dHJhY3QgfSB9KTsgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2UgaWYgKG4udHlwZSA9PT0gTlQuT1BDb250YWlucykge1xyXG4gICAgICByZXMgPSBhZGRGaWx0ZXJFeHByKHJlcywgbWFrZU9wRmlsdGVyKG1vbmdvY2F0ZnVsbHBhdGgsXCIkcmVnZXhcIiwgeyAkcmVnZXg6IG5ldyBSZWdFeHAoYCR7ZmFjdC50b0xvd2VyQ2FzZSgpfWAsIFwiaVwiKSB9KSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChuLnR5cGUgPT09IE5ULk9QR1QgfHwgbi50eXBlID09PSBOVC5PUExUXHJcbiAgICAgIHx8IG4udHlwZSA9PSBOVC5PUEVRIHx8IG4udHlwZSA9PSBOVC5PUE5FXHJcbiAgICAgIHx8IG4udHlwZSA9PSBOVC5PUEdFIHx8IG4udHlwZSA9PSBOVC5PUExFKSB7XHJcbiAgICAgIHZhciBmYWN0ID0gZ2V0RmFjdEZvck5vZGUobi5jaGlsZHJlblsxXSwgc2VudGVuY2UpO1xyXG4gICAgICB2YXIgZmFjdENvZXJjZWQgPSBjb2VyY2VGYWN0TGl0ZXJhbFRvVHlwZShjYXRJc051bWVyaWMsIGZhY3QpO1xyXG4gICAgICB2YXIgYXJncGF0aCA9ICBtb25nb2NhdGZ1bGxwYXRoO1xyXG4gICAgICB2YXIgZXh0cmFjdDIgPSBbYXJncGF0aCwgZmFjdENvZXJjZWRdO1xyXG4gICAgICAvLyAkc3dpdGNoOiB7IGJyYW5jaGVzOiBbIHsgY2FzZTogeyAkaXNBcnJheSA6IGFyZ3BhdGggfSwgdGhlbjogeyAkc2l6ZTogYXJncGF0aCB9IH1dLCBkZWZhdWx0IDogMSB9fVxyXG5cclxuICAgICAgdmFyIG9wc3RyID0gJyRsdCc7XHJcbiAgICAgIHN3aXRjaCAobi50eXBlKSB7XHJcbiAgICAgICAgY2FzZSBOVC5PUExUOiBvcHN0ciA9ICckbHQnOyBicmVhaztcclxuICAgICAgICBjYXNlIE5ULk9QR1Q6IG9wc3RyID0gJyRndCc7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgTlQuT1BFUTogb3BzdHIgPSAnJGVxJzsgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBOVC5PUE5FOiBvcHN0ciA9ICckbmUnOyBicmVhaztcclxuICAgICAgICBjYXNlIE5ULk9QTEU6IG9wc3RyID0gJyRsdGUnOyBicmVhaztcclxuICAgICAgICBjYXNlIE5ULk9QR0U6IG9wc3RyID0gJyRndGUnOyBicmVhaztcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGlzQXJyYXkobW9uZ29IYW5kbGVSYXcsIGRvbWFpbiwgY2F0ZWdvcnkpKSB7XHJcbiAgICAgICAgdmFyIGZpbHRlcm9iakUgPSBtYWtlT3BGaWx0ZXIobW9uZ29jYXRmdWxscGF0aCwgb3BzdHIsIGZhY3RDb2VyY2VkKTtcclxuICAgICAgICByZXMgPSBhZGRGaWx0ZXJFeHByKHJlcywgZmlsdGVyb2JqRSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgZGVidWdsb2coKCk9PidOT1QgQU4gQVJSQVkgRk9SICcgKyBtb25nb2NhdGZ1bGxwYXRoICsgXCIgXCIgKyBmYWN0Q29lcmNlZCk7XHJcbiAgICAgICAgdmFyIGZpbHRlcm9iaiA9IG1ha2VPcEZpbHRlcihtb25nb2NhdGZ1bGxwYXRoLCBvcHN0ciwgZmFjdENvZXJjZWQpO1xyXG4gICAgICAgIHJlcyA9IGFkZEZpbHRlckV4cHIocmVzLCBmaWx0ZXJvYmopO1xyXG4gICAgICB9XHJcbiAgICAgIC8vdmFyIG51bWJlcmFyZyA9IGdldE51bWJlckFyZyhuLmNoaWxkcmVuWzBdLCBzZW50ZW5jZSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChuLnR5cGUgPT09IE5ULk9QT3JkZXJCeSB8fCBuLnR5cGUgPT09IE5ULk9QT3JkZXJEZXNjZW5kaW5nQnkpIHtcclxuICAgICAgLy92YXIgYXNjZGVzYyA9IChuLnR5cGUgPT0gTlQuT1BPcmRlckRlc2NlbmRpbmdCeSkgPyAxIDogLTE7XHJcbiAgICAgIC8vIHJlcyA9IGFkZFNvcnRFeHByZXNzaW9uKHJlcywgYWRkT2JqZWN0UHJvcCgge30sIG1vbmdvY2F0ZnVsbHBhdGgsIGFzY2Rlc2MgKSApO1xyXG4gICAgICAvLyBUT0RPICB0aGlzIG1heSBiZSBhZGRlZCBpbiB0aGUgd3JvbmcgcG9zaXRpb25cclxuICAgICAgLy8gIG9uZSBhbHNvIGhhcyB0byBhc3N1cmUgdGhlIGRhdGEgaXMgbm90IHByb2plY3RlZCBvdXQgYmVmb3JlXHJcbiAgICAgIC8vICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBub2RldHlwZSBOVC5PUEVxSW4gYnV0IHdhcyAnICsgbi50eXBlKTtcclxuICAgICAgLy8geyAkc29ydCA6IHsgc2VuZGVyIDogLTEgfSB9YFxyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAobi50eXBlID09PSBOVC5PUE5vdEV4aXN0aW5nKSB7XHJcbiAgICAgIC8vIHsgaXRlbSA6IG51bGwgfVxyXG4gICAgICB2YXIgZmlsdGVyb2JqID0gbWFrZU9wRmlsdGVyKG1vbmdvY2F0ZnVsbHBhdGgsIFwiJGV4aXN0c1wiLCBmYWxzZSk7XHJcbiAgICAgIHJlcyA9IGFkZEZpbHRlckV4cHIocmVzLCBmaWx0ZXJvYmopO1xyXG4gICAgICAvLyAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBub2RldHlwZSBPUEV4aXNpdGluZyBub3Qgc3VwcG9ydGVkIGhlcmUgIE5ULk9QRXFJbiBidXQgd2FzICcgKyBuLnR5cGUpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAobi50eXBlID09PSBOVC5PUEV4aXN0aW5nKSB7XHJcbiAgICAgIHZhciBmaWx0ZXJvYmogPSBtYWtlT3BGaWx0ZXIobW9uZ29jYXRmdWxscGF0aCwgJyRleGlzdHMnLCB0cnVlKTtcclxuICAgICAgcmVzID0gYWRkRmlsdGVyRXhwcihyZXMsIGZpbHRlcm9iaik7XHJcbiAgICAgIC8vICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkIG5vZGV0eXBlIE9QRXhpc2l0aW5nIG5vdCBzdXBwb3J0ZWQgaGVyZSAgTlQuT1BFcUluIGJ1dCB3YXMgJyArIG4udHlwZSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBub2RldHlwZSBOVC5PUEVxSW4gYnV0IHdhcyAnICsgbi50eXBlKTtcclxuICAgIH1cclxuICB9KTtcclxuICByZXR1cm4geyAkbWF0Y2g6IHJlcyB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEV4cGxpY2l0U29ydEZyb21Bc3Qobm9kZTogQVNULkFTVE5vZGUsIHNlbnRlbmNlOiBJRkVyQmFzZS5JU2VudGVuY2UsIG1vbmdvTWFwOiBJRk1vZGVsLkNhdE1vbmdvTWFwLCBkb21haW46IHN0cmluZywgbW9uZ29IYW5kbGVSYXc6IElGTW9kZWwuSU1vZGVsSGFuZGxlUmF3KTogRXhwbGljaXRTb3J0W10ge1xyXG4gIC8vIHJldHVybiBhbiBhcnJheVxyXG4gIGRlYnVnbG9nKEFTVC5hc3RUb1RleHQobm9kZSkpO1xyXG4gIC8vY29uc29sZS5sb2coXCJtYWtpbmcgbW9uZ28gbWF0Y2ggXCIgKyBBU1QuYXN0VG9UZXh0KG5vZGUpKTtcclxuICBpZiAoIW5vZGUpIHtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcbiAgaWYgKG5vZGUudHlwZSAhPT0gTlQuTElTVCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdleHBlY3RlZCBkaWZmZXJlbnQgbm9kZXR5cGUgJyArIG5vZGUudHlwZSk7XHJcbiAgfVxyXG4gIHZhciByZXMgPSBbXSBhcyBFeHBsaWNpdFNvcnRbXTtcclxuICBub2RlLmNoaWxkcmVuLmZvckVhY2gobiA9PiB7XHJcbiAgICB2YXIgY2F0ZWdvcnkgPSBnZXRDYXRlZ29yeUZvck5vZGVQYWlyKG4uY2hpbGRyZW5bMF0sIG4uY2hpbGRyZW5bMV0sIHNlbnRlbmNlKTtcclxuICAgIHZhciBmdWxscGF0aCA9IG1vbmdvTWFwW2NhdGVnb3J5XS5mdWxscGF0aDsgLy8gTW9kZWwuZ2V0TW9uZ29vc2VQYXRoKHRoZU1vZGVsLCBjYXRlZ29yeSk7IC8vbWFrZU1vbmdvTmFtZShjYXQpO1xyXG4gICAgdmFyIGZhY3QgPSAobi5jaGlsZHJlbi5sZW5ndGggPiAxKSAmJiBnZXRGYWN0Rm9yTm9kZShuLmNoaWxkcmVuWzFdLCBzZW50ZW5jZSk7XHJcbiAgICBpZiAobi50eXBlID09PSBOVC5PUE9yZGVyQnkgfHwgbi50eXBlID09PSBOVC5PUE9yZGVyRGVzY2VuZGluZ0J5KSB7XHJcbiAgICAgIHZhciBhc2NkZXNjID0gKG4udHlwZSA9PSBOVC5PUE9yZGVyRGVzY2VuZGluZ0J5KSA/IDEgOiAtMTtcclxuICAgICAgcmVzLnB1c2goe1xyXG4gICAgICAgIGNhdGVnb3J5TmFtZTogY2F0ZWdvcnksXHJcbiAgICAgICAgZnVsbHBhdGg6IGZ1bGxwYXRoLFxyXG4gICAgICAgIGFzY0Rlc2M6IGFzY2Rlc2NcclxuICAgICAgfSBhcyBFeHBsaWNpdFNvcnQpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYWtlTW9uZ29Hcm91cEZyb21Bc3QoY2F0ZWdvcnlMaXN0OiBzdHJpbmdbXSwgbW9uZ29NYXA6IElGTW9kZWwuQ2F0TW9uZ29NYXApIHtcclxuXHJcbiAgdmFyIHJlcyA9IGNhdGVnb3J5TGlzdC5tYXAoIGNhdCA9PiBtb25nb01hcFtjYXRdLnNob3J0TmFtZSk7XHJcbiAgLypcclxuICB2YXIgcmVzID0ge307XHJcbiAgY2F0ZWdvcnlMaXN0LmZvckVhY2goY2F0ZWdvcnkgPT4ge1xyXG4gICAgdmFyIGZ1bGxwYXRoID0gTW9uZ29NYXAuZ2V0Rmlyc3RTZWdtZW50KG1vbmdvTWFwW2NhdGVnb3J5XS5wYXRocyk7IC8vIE1vZGVsLmdldE1vbmdvb3NlUGF0aCh0aGVNb2RlbCwgY2F0ZWdvcnkpOyAvL21ha2VNb25nb05hbWUoY2F0KTtcclxuICAgIHJlc1tmdWxscGF0aF0gPSBmdWxscGF0aDtcclxuICB9KTtcclxuICB2YXIgcjEgPSB7ICRncm91cDogT2JqZWN0LmFzc2lnbih7IF9pZDogT2JqZWN0LmFzc2lnbih7fSwgcmVzKSB9LCB7fSkgfTtcclxuICB2YXIgZmlyc3RYID0ge307XHJcbiAgT2JqZWN0LmtleXMocmVzKS5mb3JFYWNoKGtleSA9PiB7IGZpcnN0WFtrZXldID0geyAkZmlyc3Q6ICckJyArIGtleSB9IH0pO1xyXG4gIHIxLiRncm91cCA9IE9iamVjdC5hc3NpZ24ocjEuJGdyb3VwLCBmaXJzdFgpOyAqL1xyXG4gIHJldHVybiB7ICRncm91cCA6IHJlcyB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZU1vbmdvQ29sdW1uc0Zyb21Bc3QoY2F0ZWdvcnlMaXN0OiBzdHJpbmdbXSwgbW9uZ29NYXA6IElGTW9kZWwuQ2F0TW9uZ29NYXApXHJcbiAgOiB7IGNvbHVtbnM6IHN0cmluZ1tdLCByZXZlcnNlTWFwOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9IH0ge1xyXG4gIHZhciByZXMgPSB7XHJcbiAgICBjb2x1bW5zOiBbXSxcclxuICAgIHJldmVyc2VNYXA6IHt9XHJcbiAgfTtcclxuICBjYXRlZ29yeUxpc3QuZm9yRWFjaChjYXRlZ29yeSA9PiB7XHJcbiAgICByZXMuY29sdW1ucy5wdXNoKGNhdGVnb3J5KTtcclxuICAgIHZhciBjYXRtb25nbyA9IE1vbmdvTWFwLmdldFNob3J0UHJvamVjdGVkTmFtZShtb25nb01hcCwgY2F0ZWdvcnkpO1xyXG4gICAgaWYgKGNhdGVnb3J5ICE9PSBjYXRtb25nbykge1xyXG4gICAgICByZXMucmV2ZXJzZU1hcFtjYXRtb25nb10gPSBjYXRlZ29yeTtcclxuICAgIH1cclxuICB9KTtcclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2F0ZWdvcnlMaXN0KGZpeGVkQ2F0ZWdvcmllczogc3RyaW5nW10sIG5vZGU6IEFTVC5BU1ROb2RlLCBzZW50ZW5jZTogSUZFckJhc2UuSVNlbnRlbmNlKTogc3RyaW5nW10ge1xyXG4gIHZhciByZXMgPSBmaXhlZENhdGVnb3JpZXMuc2xpY2UoKTtcclxuICB3aGlsZSAobm9kZS50eXBlICE9PSBOVC5MSVNUKVxyXG4gICAgbm9kZSA9IG5vZGUuY2hpbGRyZW5bMF07XHJcbiAgZGVidWcoQVNULmFzdFRvVGV4dChub2RlKSk7XHJcbiAgaWYgKG5vZGUudHlwZSAhPT0gTlQuTElTVCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdleHBlY3RlZCBkaWZmZXJlbnQgbm9kZXR5cGUgJyArIG5vZGUudHlwZSk7XHJcbiAgfVxyXG4gIG5vZGUuY2hpbGRyZW4ubWFwKG4gPT4ge1xyXG4gICAgaWYgKG4udHlwZSA9PT0gTlQuQ0FUKSB7XHJcbiAgICAgIHZhciBjYXRlZ29yeSA9IGdldENhdGVnb3J5Rm9yTm9kZShuLCBzZW50ZW5jZSk7XHJcbiAgICAgIGlmIChyZXMuaW5kZXhPZihjYXRlZ29yeSkgPCBmaXhlZENhdGVnb3JpZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgcmVzLnB1c2goY2F0ZWdvcnkpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIG5vZGV0eXBlICR7bmV3IEFTVC5Ob2RlVHlwZShOVC5DQVQpLnRvU3RyaW5nKCl9IGJ1dCB3YXMgJHtuZXcgQVNULk5vZGVUeXBlKG4udHlwZSkudG9TdHJpbmcoKX1gKTtcclxuICAgIH1cclxuICB9KTtcclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZU1vbmdvUHJvamVjdGlvbkZyb21Bc3QoY2F0ZWdvcnlMaXN0OiBzdHJpbmdbXSwgbW9uZ29NYXA6IElGTW9kZWwuQ2F0TW9uZ29NYXApIHtcclxuICB2YXIgcmVzID0geyB9O1xyXG4gIGNhdGVnb3J5TGlzdC5tYXAoY2F0ZWdvcnkgPT4ge1xyXG4gICAgdmFyIGZ1bGxwYXRoID0gbW9uZ29NYXBbY2F0ZWdvcnldLmZ1bGxwYXRoOyAvL21ha2VNb25nb05hbWUoY2F0KTtcclxuICAgIHZhciBzaG9ydE5hbWUgPSBNb25nb01hcC5nZXRTaG9ydFByb2plY3RlZE5hbWUobW9uZ29NYXAsIGNhdGVnb3J5KTtcclxuICAgIGlmIChzaG9ydE5hbWUgPT09IGZ1bGxwYXRoKSB7XHJcbiAgICAgIHJlc1tmdWxscGF0aF0gPSAxO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmVzW3Nob3J0TmFtZV0gPSBmdWxscGF0aDtcclxuICAgIH1cclxuICB9KTtcclxuICByZXR1cm4geyAkcHJvamVjdDogcmVzIH07XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZU1vbmdvU29ydEZyb21Bc3QoY2F0ZWdvcnlMaXN0OiBzdHJpbmdbXSwgbW9uZ29NYXA6IElGTW9kZWwuQ2F0TW9uZ29NYXApIHtcclxuICB2YXIgcmVzID0ge307XHJcbiAgY2F0ZWdvcnlMaXN0LmZvckVhY2goY2F0ZWdvcnkgPT4ge1xyXG4gICAgdmFyIHNob3J0TmFtZSA9IE1vbmdvTWFwLmdldFNob3J0UHJvamVjdGVkTmFtZShtb25nb01hcCwgY2F0ZWdvcnkpO1xyXG4gICAgcmVzW3Nob3J0TmFtZV0gPSAxO1xyXG4gIH0pO1xyXG4gIHJldHVybiB7ICRzb3J0OiByZXMgfTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBFeHBsaWNpdFNvcnQge1xyXG4gIGNhdGVnb3J5TmFtZTogc3RyaW5nLCAvLyBcclxuICBhc2NEZXNjOiBudW1iZXIsICAvLyAwIG9yIDFcclxuICBmdWxscGF0aDogc3RyaW5nIC8vIF90YWJsZXMuVGFibGVcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYWtlTW9uZ29FeHBsaWNpdFNvcnQoZXhwbGljaXRTb3J0OiBFeHBsaWNpdFNvcnRbXSwgY2F0ZWdvcnlMaXN0OiBzdHJpbmdbXSwgbW9uZ29NYXA6IElGTW9kZWwuQ2F0TW9uZ29NYXApIHtcclxuICB2YXIgcmVzID0ge307XHJcbiAgZXhwbGljaXRTb3J0LmZvckVhY2goZXMgPT4ge1xyXG4gICAgdmFyIG1vbmdvQ2F0TmFtZSA9IGVzLmZ1bGxwYXRoO1xyXG4gICAgcmVzW21vbmdvQ2F0TmFtZV0gPSBlcy5hc2NEZXNjO1xyXG4gIH0pO1xyXG4gIGNhdGVnb3J5TGlzdC5mb3JFYWNoKGNhdGVnb3J5ID0+IHtcclxuICAgIHZhciBzaG9ydE5hbWUgPSBNb25nb01hcC5nZXRTaG9ydFByb2plY3RlZE5hbWUobW9uZ29NYXAsIGNhdGVnb3J5KTtcclxuICAgIGlmIChyZXNbc2hvcnROYW1lXSA9PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmVzW3Nob3J0TmFtZV0gPSAxO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiB7ICRzb3J0OiByZXMgfTtcclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZU1vbmdvTWF0Y2hGKGZpbHRlcnM6IElGaWx0ZXJbXSkge1xyXG4gIHZhciByZXMgPSB7ICRtYXRjaDoge30gfTtcclxuICAvL2NvbnNvbGUubG9nKCdpcyBtYXRjaCBcXG4nKTtcclxuICBmaWx0ZXJzLmZvckVhY2goZmlsdGVyID0+IHtcclxuICAgIHJlcy4kbWF0Y2hbZmlsdGVyLmNhdF0gPSBmaWx0ZXIudmFsdWU7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuXHJcbiJdfQ==
