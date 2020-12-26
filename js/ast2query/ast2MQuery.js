'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMongoMatchF = exports.makeMongoExplicitSort = exports.makeMongoSortFromAst = exports.makeMongoProjectionFromAst = exports.getCategoryList = exports.makeMongoColumnsFromAst = exports.makeMongoGroupFromAst = exports.extractExplicitSortFromAst = exports.makeMongoMatchFromAst = exports.amendCategoryList = exports.coerceFactLiteralToType = exports.isNumericTypeOrHasNumericType = exports.isArray = exports.getNumberArg = exports.addSortExpression = exports.addFilterExpr = exports.makeOpFilter = exports.makeMongoName = exports.getFactForNode = exports.getCategoryForNode = exports.getCategoryForNodePair = exports.makeMongoDistinctGroup = void 0;
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
/* construct a mongo query from an AST */
function makeMongoDistinctGroup(cols) {
    var res = { $group: { _id: {} } };
    cols.forEach(col => {
        res.$group[col] = '$' + col;
        res.$group._id[col] = '$' + col;
    });
    return res;
}
exports.makeMongoDistinctGroup = makeMongoDistinctGroup;
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
function addSortExpression(res, expr) {
    if (res['$sort']) {
        _.merge(res['$sort'], expr);
        return res;
    }
    res['$sort'] = expr;
    return res;
}
exports.addSortExpression = addSortExpression;
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
        debugger;
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hc3QycXVlcnkvYXN0Mk1RdWVyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUE7OztBQUlaLGdDQUFnQztBQUNoQyw0QkFBNEI7QUFFNUIsc0RBQW9GLENBQUMsZ0JBQWdCO0FBRXJHLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUVyQyx5Q0FBeUM7QUFDekMsOEJBQThCO0FBRTlCLGdDQUEyQztBQUkzQyx1REFBdUQ7QUFFdkQsSUFBSSxXQUFXLEdBQUcsVUFBVSxDQUFDLFdBQVcsQ0FBQztBQUN6QyxJQUFJLEtBQUssR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDO0FBQzdCLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7QUFLOUIsQ0FBQztBQUVGLHlDQUF5QztBQUV6QyxTQUFnQixzQkFBc0IsQ0FBQyxJQUFjO0lBQ25ELElBQUksR0FBRyxHQUFHLEVBQUUsTUFBTSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7SUFDbEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNqQixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDNUIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQztJQUNsQyxDQUFDLENBQUMsQ0FBQztJQUNILE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQVBELHdEQU9DO0FBRUQsU0FBZ0Isc0JBQXNCLENBQUMsT0FBb0IsRUFBRSxRQUFxQixFQUFFLFFBQTRCO0lBQzlHLGlDQUFpQztJQUNqQyxxQ0FBcUM7SUFDckMsbUNBQW1DO0lBQ25DLElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFO1FB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LDBDQU9DIiwiZmlsZSI6ImFzdDJxdWVyeS9hc3QyTVF1ZXJ5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXHJcblxyXG5pbXBvcnQgeyBTZW50ZW5jZSBhcyBTZW50ZW5jZSwgSUZFckJhc2UgYXMgSUZFckJhc2UgfSBmcm9tICcuLi9tYXRjaC9lcl9pbmRleCc7XHJcblxyXG5pbXBvcnQgKiBhcyBkZWJ1ZyBmcm9tICdkZWJ1Z2YnO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XHJcblxyXG5pbXBvcnQgeyBJRk1vZGVsIGFzIElGTW9kZWwsIE1vbmdvTWFwLCBNb2RlbCBhcyBNb2RlbCB9IGZyb20gJy4uL21vZGVsL2luZGV4X21vZGVsJzsgLy8gbWdubHFfbW9kZWwnO1xyXG5cclxuY29uc3QgZGVidWdsb2cgPSBkZWJ1ZygnYXN0Mk1RdWVyeScpO1xyXG5cclxuaW1wb3J0ICogYXMgY2hldnJvdGFpbiBmcm9tICdjaGV2cm90YWluJztcclxuaW1wb3J0ICogYXMgQVNUIGZyb20gJy4uL2FzdCc7XHJcblxyXG5pbXBvcnQgeyBBU1ROb2RlVHlwZSBhcyBOVCB9IGZyb20gJy4uL2FzdCc7XHJcbmltcG9ydCB7IElNb25nb29zZUJhc2VUeXBlIH0gZnJvbSAnLi4vbWF0Y2gvaWZtYXRjaCc7XHJcbmltcG9ydCB7IENvbnNvbGUgfSBmcm9tICdjb25zb2xlJztcclxuXHJcbi8vIGltcG9ydCAqIGFzIFNlbnRlbmNlcGFyc2VyIGZyb20gJy4uL3NlbnRlbmNlcGFyc2VyJztcclxuXHJcbnZhciBjcmVhdGVUb2tlbiA9IGNoZXZyb3RhaW4uY3JlYXRlVG9rZW47XHJcbnZhciBMZXhlciA9IGNoZXZyb3RhaW4uTGV4ZXI7XHJcbnZhciBQYXJzZXIgPSBjaGV2cm90YWluLlBhcnNlcjtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUZpbHRlciB7XHJcbiAgY2F0OiBzdHJpbmcsXHJcbiAgdmFsdWU6IHN0cmluZ1xyXG59O1xyXG5cclxuLyogY29uc3RydWN0IGEgbW9uZ28gcXVlcnkgZnJvbSBhbiBBU1QgKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYWtlTW9uZ29EaXN0aW5jdEdyb3VwKGNvbHM6IHN0cmluZ1tdKTogYW55IHtcclxuICB2YXIgcmVzID0geyAkZ3JvdXA6IHsgX2lkOiB7fSB9IH07XHJcbiAgY29scy5mb3JFYWNoKGNvbCA9PiB7XHJcbiAgICByZXMuJGdyb3VwW2NvbF0gPSAnJCcgKyBjb2w7XHJcbiAgICByZXMuJGdyb3VwLl9pZFtjb2xdID0gJyQnICsgY29sO1xyXG4gIH0pO1xyXG4gIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRDYXRlZ29yeUZvck5vZGVQYWlyKG5vZGVDYXQ6IEFTVC5BU1ROb2RlLCBub2RlRmFjdDogQVNULkFTVE5vZGUsIHNlbnRlbmNlOiBJRkVyQmFzZS5JU2VudGVuY2UpIHtcclxuICAvLyAgZWl0aGVyICAgICAgICAgICA8Q0FUPiA8RkFDVD5cclxuICAvLyAgb3IgICAgICAgICAgICAgICB1bmRlZmluZWQgPEZBQ1Q+XHJcbiAgLy8gIG9yICBNb3JlIHRoYW4gICAgPG51bWJlcj4gPENBVD5cclxuICBpZiAobm9kZUNhdCAmJiBub2RlQ2F0LmJlYXJlciAmJiBub2RlQ2F0LmJlYXJlci5pbWFnZSA9PT0gJ05VTUJFUicpIHtcclxuICAgIHJldHVybiBnZXRDYXRlZ29yeUZvck5vZGVQYWlyKG5vZGVGYWN0LCBub2RlRmFjdCwgc2VudGVuY2UpO1xyXG4gIH1cclxuICB2YXIgc3RhcnRJbmRleCA9IG5vZGVDYXQgJiYgbm9kZUNhdC5iZWFyZXIgJiYgbm9kZUNhdC5iZWFyZXIuc3RhcnRPZmZzZXQ7XHJcbiAgZGVidWdsb2coJ1N0YXJ0SW5kZXggOiAnICsgc3RhcnRJbmRleCk7XHJcbiAgZGVidWdsb2coJ1N0YXJ0SW5kZXggOiAnICsgSlNPTi5zdHJpbmdpZnkobm9kZUNhdCwgdW5kZWZpbmVkLCAyKSk7XHJcbiAgaWYgKHR5cGVvZiBzdGFydEluZGV4ID09PSBcIm51bWJlclwiICYmIChzdGFydEluZGV4ID49IDApKSB7XHJcbiAgICByZXR1cm4gc2VudGVuY2Vbc3RhcnRJbmRleF0ubWF0Y2hlZFN0cmluZztcclxuICB9XHJcbiAgaWYgKCFub2RlQ2F0IHx8IG5vZGVDYXQuY2hpbGRyZW4ubGVuZ3RoID09PSAwIHx8IG5vZGVDYXQuYmVhcmVyID09PSB1bmRlZmluZWQpIHtcclxuICAgIHZhciBmYWN0SW5kZXggPSBub2RlRmFjdC5iZWFyZXIuc3RhcnRPZmZzZXQ7XHJcbiAgICBkZWJ1Z2xvZyhKU09OLnN0cmluZ2lmeShzZW50ZW5jZVtmYWN0SW5kZXhdLCB1bmRlZmluZWQsIDIpKTtcclxuICAgIHJldHVybiBzZW50ZW5jZVtmYWN0SW5kZXhdLmNhdGVnb3J5O1xyXG4gIH1cclxuICBkZWJ1ZygnIGZvdW5kIG5vIGNhdGVnb3J5ICcpO1xyXG4gIHJldHVybiB1bmRlZmluZWQ7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2F0ZWdvcnlGb3JOb2RlKG5vZGVDYXQ6IEFTVC5BU1ROb2RlLCBzZW50ZW5jZTogSUZFckJhc2UuSVNlbnRlbmNlKSB7XHJcbiAgdmFyIHN0YXJ0SW5kZXggPSBub2RlQ2F0ICYmIG5vZGVDYXQuYmVhcmVyICYmIG5vZGVDYXQuYmVhcmVyLnN0YXJ0T2Zmc2V0O1xyXG4gIGlmIChub2RlQ2F0LnR5cGUgIT09IE5ULkNBVCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBub2RldHlwZSAke25ldyBBU1QuTm9kZVR5cGUoTlQuQ0FUKS50b1N0cmluZygpfSBidXQgd2FzICR7bmV3IEFTVC5Ob2RlVHlwZShub2RlQ2F0LnR5cGUpLnRvU3RyaW5nKCl9YCk7XHJcbiAgfVxyXG4gIGlmIChzdGFydEluZGV4ICE9PSB1bmRlZmluZWQgJiYgKHN0YXJ0SW5kZXggPj0gMCkpIHtcclxuICAgIHJldHVybiBzZW50ZW5jZVtzdGFydEluZGV4XS5tYXRjaGVkU3RyaW5nO1xyXG4gIH1cclxuICB0aHJvdyBuZXcgRXJyb3IoJyBubyBzdGFydGluZGV4JyArIEpTT04uc3RyaW5naWZ5KG5vZGVDYXQpKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRGYWN0Rm9yTm9kZShub2RlRmFjdDogQVNULkFTVE5vZGUsIHNlbnRlbmNlOiBJRkVyQmFzZS5JU2VudGVuY2UpIHtcclxuICB2YXIgZmFjdEluZGV4ID0gbm9kZUZhY3QuYmVhcmVyLnN0YXJ0T2Zmc2V0O1xyXG4gIC8vY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoc2VudGVuY2VbZmFjdEluZGV4XSwgdW5kZWZpbmVkLCAyKSk7XHJcbiAgcmV0dXJuIHNlbnRlbmNlW2ZhY3RJbmRleF0ubWF0Y2hlZFN0cmluZzsgLy8uY2F0ZWdvcnk7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZU1vbmdvTmFtZShzOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gIHJldHVybiBNb25nb01hcC5tYWtlQ2Fub25pY1Byb3BlcnR5TmFtZShzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFrZUZpbHRlck9iaihjYXQsIGZpbHRlcikge1xyXG4gIHZhciBmaWx0ZXJPYmogPSB7fTtcclxuICBmaWx0ZXJPYmpbY2F0XSA9IGZpbHRlcjtcclxuICByZXR1cm4gZmlsdGVyT2JqO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZU9wRmlsdGVyKGNhdHBhdGgsIG9wLCBsaXRlcmFsKSB7XHJcbiAgdmFyIGZpbHRlck9iaiA9IHt9O1xyXG4gIGZpbHRlck9ialtvcF0gPSBbIHsgJGV2YWwgOiBjYXRwYXRoIH0sIGxpdGVyYWxdOyBcclxuICByZXR1cm4gZmlsdGVyT2JqO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYWRkRmlsdGVyRXhwcihyZXMsIGV4cHI6IGFueSkge1xyXG4gIGRlYnVnbG9nKFwiYWRkRmlsdGVyRXhwciBcIiArIEpTT04uc3RyaW5naWZ5KGV4cHIpKTtcclxuICBpZiAocmVzWyckYW5kJ10pIHtcclxuICAgIHJlc1snJGFuZCddLnB1c2goZXhwcik7XHJcbiAgICByZXR1cm4gcmVzO1xyXG4gIH1cclxuICByZXNbJyRhbmQnXSA9IFtleHByXTtcclxuICByZXR1cm4gcmVzO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFkZFNvcnRFeHByZXNzaW9uKHJlcywgZXhwcjogYW55KSB7XHJcbiAgaWYgKHJlc1snJHNvcnQnXSkge1xyXG4gICAgXy5tZXJnZShyZXNbJyRzb3J0J10sIGV4cHIpO1xyXG4gICAgcmV0dXJuIHJlcztcclxuICB9XHJcbiAgcmVzWyckc29ydCddID0gZXhwcjtcclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TnVtYmVyQXJnKG5vZGU6IEFTVC5BU1ROb2RlLCBzZW50ZW5jZTogSUZFckJhc2UuSVNlbnRlbmNlKTogbnVtYmVyIHsgLy8gISEgcmV0dXJucyBhIG51bWJlciBcclxuICB2YXIgc3RhcnRJbmRleCA9IG5vZGUgJiYgbm9kZS5iZWFyZXIgJiYgbm9kZS5iZWFyZXIuc3RhcnRPZmZzZXQ7XHJcbiAgaWYgKG5vZGUudHlwZSAhPT0gTlQuTlVNQkVSKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIG5vZGV0eXBlICR7bmV3IEFTVC5Ob2RlVHlwZShOVC5DQVQpLnRvU3RyaW5nKCl9IGJ1dCB3YXMgJHtuZXcgQVNULk5vZGVUeXBlKG5vZGUudHlwZSkudG9TdHJpbmcoKX1gKTtcclxuICB9XHJcbiAgaWYgKHN0YXJ0SW5kZXggIT09IHVuZGVmaW5lZCAmJiAoc3RhcnRJbmRleCA+PSAwKSkge1xyXG4gICAgLy9UT0RPIHRyZWF0IG9uZSwgdHdvXHJcbiAgICByZXR1cm4gcGFyc2VJbnQoc2VudGVuY2Vbc3RhcnRJbmRleF0ubWF0Y2hlZFN0cmluZyk7XHJcbiAgfVxyXG4gIHRocm93IG5ldyBFcnJvcignIG5vIHN0YXJ0aW5kZXgnICsgSlNPTi5zdHJpbmdpZnkobm9kZSkpO1xyXG59O1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0FycmF5KG1vbmdvSGFuZGxlUmF3OiBJRk1vZGVsLklNb2RlbEhhbmRsZVJhdywgZG9tYWluOiBzdHJpbmcsIGNhdGVnb3J5OiBzdHJpbmcpIHtcclxuICB2YXIgY2F0ID0gTW9kZWwuZ2V0Q2F0ZWdvcnlSZWMobW9uZ29IYW5kbGVSYXcsIGRvbWFpbiwgY2F0ZWdvcnkpO1xyXG4gIHJldHVybiBfLmlzQXJyYXkoY2F0LnR5cGUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNOdW1lcmljVHlwZU9ySGFzTnVtZXJpY1R5cGUobW9uZ29IYW5kbGVSYXc6IElGTW9kZWwuSU1vZGVsSGFuZGxlUmF3LCBkb21haW46IHN0cmluZywgY2F0ZWdvcnk6IHN0cmluZykgOiBib29sZWFuIHtcclxuICB2YXIgY2F0ID0gTW9kZWwuZ2V0Q2F0ZWdvcnlSZWMobW9uZ29IYW5kbGVSYXcsIGRvbWFpbiwgY2F0ZWdvcnkpO1xyXG4gIC8vY29uc29sZS5sb2coXCJjYXRlZ29yeSBcIiArIGNhdGVnb3J5ICsgXCIgIC0+IFwiICsgSlNPTi5zdHJpbmdpZnkoY2F0KSk7XHJcbiAgdmFyIHJlcyA9IChjYXQudHlwZSA9PSBJTW9uZ29vc2VCYXNlVHlwZS5OdW1iZXIpIHx8IChfLmlzQXJyYXkoY2F0LnR5cGUpICYmIGNhdC50eXBlLmluZGV4T2YoSU1vbmdvb3NlQmFzZVR5cGUuTnVtYmVyKSA+PSAwKTtcclxuICBpZiAoIHJlcyApIHtcclxuICAgIGRlYnVnbG9nKCAoKSA9PiBcImNhdGVnb3J5IFwiICsgY2F0ZWdvcnkgKyBcIiBpcyBOdW1lcmljT3JIYXNOdW1lcmljIC0+IFwiICsgSlNPTi5zdHJpbmdpZnkoY2F0KSk7XHJcbiAgfVxyXG4gIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb2VyY2VGYWN0TGl0ZXJhbFRvVHlwZShpc051bWVyaWM6IGJvb2xlYW4sIGZhY3Q6IHN0cmluZyk6IG51bWJlciB8IHN0cmluZyB7XHJcbiAgaWYgKGlzTnVtZXJpYykge1xyXG4gICAgdHJ5IHtcclxuICAgICAgdmFyIHIgPSBwYXJzZUludChmYWN0KTtcclxuICAgICAgaWYgKE51bWJlci5pc05hTihyKSkge1xyXG4gICAgICAgIHJldHVybiBmYWN0O1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiByO1xyXG4gICAgfSBjYXRjaCAoZSkgeyB9XHJcbiAgfVxyXG4gIHJldHVybiBmYWN0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYW1lbmRDYXRlZ29yeUxpc3QoZXh0cmFjdFNvcnRSZXN1bHQ6IGFueVtdLCBjYXRMaXN0OiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcclxuICB2YXIgcmVzID0gW107XHJcbiAgZXh0cmFjdFNvcnRSZXN1bHQuZm9yRWFjaChhID0+IHtcclxuICAgIHZhciBuYW1lID0gYS5jYXRlZ29yeU5hbWU7XHJcbiAgICBpZiAoIWNhdExpc3QuaW5jbHVkZXMobmFtZSkpIHtcclxuICAgICAgcmVzLnB1c2gobmFtZSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmVzID0gcmVzLmNvbmNhdChjYXRMaXN0KTtcclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZU1vbmdvTWF0Y2hGcm9tQXN0KG5vZGU6IEFTVC5BU1ROb2RlLCBzZW50ZW5jZTogSUZFckJhc2UuSVNlbnRlbmNlLCBtb25nb01hcDogSUZNb2RlbC5DYXRNb25nb01hcCwgZG9tYWluOiBzdHJpbmcsIG1vbmdvSGFuZGxlUmF3OiBJRk1vZGVsLklNb2RlbEhhbmRsZVJhdykge1xyXG4gIGRlYnVnbG9nKEFTVC5hc3RUb1RleHQobm9kZSkpO1xyXG4gIC8vY29uc29sZS5sb2coXCJtYWtpbmcgbW9uZ28gbWF0Y2ggXCIgKyBBU1QuYXN0VG9UZXh0KG5vZGUpKTtcclxuICBpZiAoIW5vZGUpIHtcclxuICAgIHJldHVybiB7ICRtYXRjaDoge30gfTtcclxuICB9XHJcbiAgaWYgKG5vZGUudHlwZSAhPT0gTlQuTElTVCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdleHBlY3RlZCBkaWZmZXJlbnQgbm9kZXR5cGUgJyArIG5vZGUudHlwZSk7XHJcbiAgfVxyXG4gIHZhciByZXMgPSB7fTtcclxuICBub2RlLmNoaWxkcmVuLmZvckVhY2gobiA9PiB7XHJcbiAgICB2YXIgY2F0ZWdvcnkgPSBnZXRDYXRlZ29yeUZvck5vZGVQYWlyKG4uY2hpbGRyZW5bMF0sIG4uY2hpbGRyZW5bMV0sIHNlbnRlbmNlKTtcclxuICAgIC8vY29uc29sZS5sb2coJ2hlcmUgaXMgdGhlIGRvbWFpbiAnICsgT2JqZWN0LmtleXModGhlTW9kZWwubW9uZ29IYW5kbGUubW9uZ29NYXBzKS5qb2luKFwiXFxuXCIpKTtcclxuICAgIC8vY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodGhlTW9kZWwubW9uZ29IYW5kbGUubW9uZ29NYXBzW21vbmdvZG9tYWluXSwgdW5kZWZpbmVkLDIpKTtcclxuICAgIHZhciBtb25nb2NhdGZ1bGxwYXRoID0gbW9uZ29NYXBbY2F0ZWdvcnldLmZ1bGxwYXRoOyAvLyBNb2RlbC5nZXRNb25nb29zZVBhdGgodGhlTW9kZWwsIGNhdGVnb3J5KTsgLy9tYWtlTW9uZ29OYW1lKGNhdCk7XHJcbiAgICBkZWJ1Z2dlcjtcclxuICAgIGRlYnVnbG9nKCgpID0+IGBoZXJlIGlzIHRoZSBmdWxscGF0aCBmb3IgJHtjYXRlZ29yeX0gaXMgJHttb25nb2NhdGZ1bGxwYXRofSBgKTtcclxuICAgIHZhciBmYWN0ID0gKG4uY2hpbGRyZW4ubGVuZ3RoID4gMSkgJiYgZ2V0RmFjdEZvck5vZGUobi5jaGlsZHJlblsxXSwgc2VudGVuY2UpO1xyXG4gICAgdmFyIGNhdElzTnVtZXJpYyA9IGlzTnVtZXJpY1R5cGVPckhhc051bWVyaWNUeXBlKG1vbmdvSGFuZGxlUmF3LCBkb21haW4sIGNhdGVnb3J5KTtcclxuICAgIHZhciBmYWN0Q29lcmNlZCA9IGNvZXJjZUZhY3RMaXRlcmFsVG9UeXBlKGNhdElzTnVtZXJpYywgZmFjdCk7XHJcbiAgICBpZiAobi50eXBlID09PSBOVC5PUEVxSW4pIHtcclxuICAgICAgcmVzID0gYWRkRmlsdGVyRXhwcihyZXMsIG1ha2VPcEZpbHRlcihtb25nb2NhdGZ1bGxwYXRoLCBcIiRlcVwiLCBmYWN0Q29lcmNlZCkpO1xyXG4gICAgfSBlbHNlIGlmIChuLnR5cGUgPT09IE5ULk9QU3RhcnRzV2l0aCkge1xyXG4gICAgICByZXMgPSBhZGRGaWx0ZXJFeHByKHJlcywgbWFrZU9wRmlsdGVyKCBtb25nb2NhdGZ1bGxwYXRoLCBcIiRyZWdleFwiLCB7ICRyZWdleDogbmV3IFJlZ0V4cChgXiR7ZmFjdC50b0xvd2VyQ2FzZSgpfWAsIFwiaVwiKSB9KSk7XHJcbiAgICB9IGVsc2UgaWYgKG4udHlwZSA9PT0gTlQuT1BFbmRzV2l0aCkge1xyXG4gICAgICBkZWJ1Z2xvZygoKSA9PiAnISEhIWFkZGluZyByZWdleCB3aXRoIGV4cHJlc3Npb24gJyArIGZhY3QudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgIHJlcyA9IGFkZEZpbHRlckV4cHIocmVzLCBtYWtlT3BGaWx0ZXIoIG1vbmdvY2F0ZnVsbHBhdGgsIFwiJHJlZ2V4XCIsIHsgJHJlZ2V4OiBuZXcgUmVnRXhwKGAke2ZhY3QudG9Mb3dlckNhc2UoKX0kYCwgXCJpXCIpIH0pKTtcclxuICAgIH0vKiBlbHNlIGlmIChuLnR5cGUgPT09IE5ULk9QTW9yZVRoYW4pIHtcclxuICAgICAgdmFyIG51bWJlcmFyZyA9IGdldE51bWJlckFyZyhuLmNoaWxkcmVuWzBdLCBzZW50ZW5jZSk7XHJcbiAgICAgIGRlYnVnbG9nKCgpID0+ICchISEhYWRkaW5nIG1vcmUgdGhhbiAnICsgbnVtYmVyYXJnICsgJyBmb3IgY2F0ZWdvcnkgJyArIGNhdGVnb3J5ICk7XHJcbiAgICAgIC8vVE9ETyAvL3JlcyA9IGFkZEZpbHRlclRvTWF0Y2gocmVzLCBtb25nb2NhdGZ1bGxwYXRoLCB7ICdjb3VudCcgKCBtb25nb2NhdGZ1bGxwYXRoICkgZ3QgbnVtYmVyYXJnICwgXCJpXCIpIH0pO1xyXG4gICAgICB2YXIgYXJncGF0aCA9ICckJyArIG1vbmdvY2F0ZnVsbHBhdGg7XHJcbiAgICAgIHJlcyA9IGFkZEZpbHRlckV4cHIoIHJlcyxcclxuICAgICAgICB7ICRleHByOiB7ICRndDogWyB7ICRzd2l0Y2g6IHsgYnJhbmNoZXM6IFsgeyBjYXNlOiB7ICRpc0FycmF5IDogYXJncGF0aCB9LCB0aGVuOiB7ICRzaXplOiBhcmdwYXRoIH0gfV0sIGRlZmF1bHQgOiAxIH19XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICwgbnVtYmVyYXJnIF19fSApO1xyXG5cclxuLy9cclxuLy8gICAgICAgIHsgJGV4cHI6IHsgJGd0OiBbIHsgJHNpemU6ICckc3RhbmRvcnQnfSwxIF19fSApO1xyXG4vLyAgICAgIChbIHsgJG1hdGNoIDogeyAkZXhwcjogeyAkZ3Q6IFsgeyAkc2l6ZTogYXJncGF0aCB9LCBudW1iZXJhcmcgXX19fV0pO1xyXG4vLyB0d28gc3RhZ2VcclxuLy8gdXNlICRhZGRGaWVsZHMgIHdpdGggMy40XHJcbi8vIHRyeSBhbHNvICRleHByIGRpcmVjdGx5XHJcbi8vICAgICAgID4gZGIuZGVtb21kbHMuYWdncmVnYXRlKFsgeyAkcHJvamVjdCA6IHsgc3RhbmRvcnRfc2l6ZSA6IHsgJHNpemU6ICckc3RhbmRvcnQnIH0sIHN0YW5kb3J0OjEsIHNlbmRlcjoxLCB1dSA6IHsgJGd0OlsgeyAkc2l6ZTogJyRzdGFuZG9ydCcgfSwzXX0gLCBhYnggOiB7ICRndDpbIFwiJHN0YW5kb3J0XCIsIDFdfX19LCB7ICRtYXRjaDogeyBcInN0YW5kb3J0X3NpemVcIjogeyAkZXE6IHsgJHNpemU6ICckc3RhbmRvcnQnfSB9fX1dKTtcclxuLy8gICAgICA+IGRiLmRlbW9tZGxzLmFnZ3JlZ2F0ZShbIHsgJHByb2plY3QgOiB7IHN0YW5kb3J0X3NpemUgOiB7ICRzaXplOiAnJHN0YW5kb3J0JyB9LCBzdGFuZG9ydDoxLCBzZW5kZXI6MSwgdXUgOiB7ICRndDpbIHsgJHNpemU6ICckc3RhbmRvcnQnIH0sM119ICwgYWJ4IDogeyAkZ3Q6WyBcIiRzdGFuZG9ydFwiLCAxXX19fSwgeyAkbWF0Y2g6IHsgXCJzdGFuZG9ydF9zaXplXCI6IHsgJGd0OiAxIH19fV0pO1xyXG4vLyAgICAgIHsgXCJfaWRcIiA6IE9iamVjdElkKFwiNWRiODhhMTg1YjY2NzU5Y2ZjNTZiY2Q0XCIpLCBcInN0YW5kb3J0XCIgOiBbIFwiQmVybGluXCIsIFwiTcO8bmNoZW5cIiwgXCJGcmFua2Z1cnRcIiwgXCJIYW1idXJnXCIsIFwiQnJlbWVuXCIgXSwgXCJzZW5kZXJcIiA6IFwiQVJ1bmRmdW5rRFwiLCBcInN0YW5kb3J0X3NpemVcIiA6IDUsIFwidXVcIiA6IHRydWUsIFwiYWJ4XCIgOiB0cnVlIH1cclxuXHJcblxyXG4gICAgLy8gZXhhY3QgbWF0Y2g6IGRiLmRlbW9tZGxzLmFnZ3JlZ2F0ZShbIHsgJG1hdGNoOiB7IHN0YW5kb3J0IDogeyAkc2l6ZSA6IDMgfX19LFxyXG5cclxuICAgIH0qL1xyXG4gICAgZWxzZSBpZiAobi50eXBlID09PSBOVC5PUExlc3NUaGFuIHx8IG4udHlwZSA9PT0gTlQuT1BNb3JlVGhhbiB8fCBuLnR5cGUgPT0gTlQuT1BFeGFjdGx5KSB7XHJcbiAgICAgIC8vIGZsYXZvdXJzOiBcclxuICAgICAgLy8gbGVzc190aGFuIDMgQ0FUICAgICggYSBjb3VudCBtZWFzdXJlIClcclxuICAgICAgdmFyIG51bWJlcmFyZyA9IGdldE51bWJlckFyZyhuLmNoaWxkcmVuWzBdLCBzZW50ZW5jZSk7XHJcbiAgICAgIGRlYnVnbG9nKCgpID0+ICchISEhYWRkaW5nIG1vcmUgdGhhbiAnICsgbnVtYmVyYXJnICsgJyBmb3IgY2F0ZWdvcnkgJyArIGNhdGVnb3J5KTtcclxuICAgICAgdmFyIGFyZ3BhdGggPSBtb25nb2NhdGZ1bGxwYXRoO1xyXG4gICAgICAvLyBUT0RPIGV2YWx1YXRlIHRoaXMgbm93XHJcbiAgICAgIHZhciBleHRyYWN0ID0gW3sgJEFSUkFZU0laRV9PUl9WQUxfT1IxIDogYXJncGF0aCB9XHJcbiAgICAgICAgLCBudW1iZXJhcmddO1xyXG4gICAgICBzd2l0Y2ggKG4udHlwZSkge1xyXG4gICAgICAgIGNhc2UgTlQuT1BMZXNzVGhhbjogcmVzID0gYWRkRmlsdGVyRXhwcihyZXMsIHsgJGV4cHI6IHsgJGx0OiBleHRyYWN0IH0gfSk7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgTlQuT1BNb3JlVGhhbjogcmVzID0gYWRkRmlsdGVyRXhwcihyZXMsIHsgJGV4cHI6IHsgJGd0OiBleHRyYWN0IH0gfSk7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgTlQuT1BFeGFjdGx5OiByZXMgPSBhZGRGaWx0ZXJFeHByKHJlcywgeyAkZXhwcjogIHsgJGVxOiBleHRyYWN0IH0gfSk7IGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChuLnR5cGUgPT09IE5ULk9QQ29udGFpbnMpIHtcclxuICAgICAgcmVzID0gYWRkRmlsdGVyRXhwcihyZXMsIG1ha2VPcEZpbHRlcihtb25nb2NhdGZ1bGxwYXRoLFwiJHJlZ2V4XCIsIHsgJHJlZ2V4OiBuZXcgUmVnRXhwKGAke2ZhY3QudG9Mb3dlckNhc2UoKX1gLCBcImlcIikgfSkpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAobi50eXBlID09PSBOVC5PUEdUIHx8IG4udHlwZSA9PT0gTlQuT1BMVFxyXG4gICAgICB8fCBuLnR5cGUgPT0gTlQuT1BFUSB8fCBuLnR5cGUgPT0gTlQuT1BORVxyXG4gICAgICB8fCBuLnR5cGUgPT0gTlQuT1BHRSB8fCBuLnR5cGUgPT0gTlQuT1BMRSkge1xyXG4gICAgICB2YXIgZmFjdCA9IGdldEZhY3RGb3JOb2RlKG4uY2hpbGRyZW5bMV0sIHNlbnRlbmNlKTtcclxuICAgICAgdmFyIGZhY3RDb2VyY2VkID0gY29lcmNlRmFjdExpdGVyYWxUb1R5cGUoY2F0SXNOdW1lcmljLCBmYWN0KTtcclxuICAgICAgdmFyIGFyZ3BhdGggPSAgbW9uZ29jYXRmdWxscGF0aDtcclxuICAgICAgdmFyIGV4dHJhY3QyID0gW2FyZ3BhdGgsIGZhY3RDb2VyY2VkXTtcclxuICAgICAgLy8gJHN3aXRjaDogeyBicmFuY2hlczogWyB7IGNhc2U6IHsgJGlzQXJyYXkgOiBhcmdwYXRoIH0sIHRoZW46IHsgJHNpemU6IGFyZ3BhdGggfSB9XSwgZGVmYXVsdCA6IDEgfX1cclxuXHJcbiAgICAgIHZhciBvcHN0ciA9ICckbHQnO1xyXG4gICAgICBzd2l0Y2ggKG4udHlwZSkge1xyXG4gICAgICAgIGNhc2UgTlQuT1BMVDogb3BzdHIgPSAnJGx0JzsgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBOVC5PUEdUOiBvcHN0ciA9ICckZ3QnOyBicmVhaztcclxuICAgICAgICBjYXNlIE5ULk9QRVE6IG9wc3RyID0gJyRlcSc7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgTlQuT1BORTogb3BzdHIgPSAnJG5lJzsgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBOVC5PUExFOiBvcHN0ciA9ICckbHRlJzsgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBOVC5PUEdFOiBvcHN0ciA9ICckZ3RlJzsgYnJlYWs7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChpc0FycmF5KG1vbmdvSGFuZGxlUmF3LCBkb21haW4sIGNhdGVnb3J5KSkge1xyXG4gICAgICAgIHZhciBmaWx0ZXJvYmpFID0gbWFrZU9wRmlsdGVyKG1vbmdvY2F0ZnVsbHBhdGgsIG9wc3RyLCBmYWN0Q29lcmNlZCk7XHJcbiAgICAgICAgcmVzID0gYWRkRmlsdGVyRXhwcihyZXMsIGZpbHRlcm9iakUpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGRlYnVnbG9nKCgpPT4nTk9UIEFOIEFSUkFZIEZPUiAnICsgbW9uZ29jYXRmdWxscGF0aCArIFwiIFwiICsgZmFjdENvZXJjZWQpO1xyXG4gICAgICAgIHZhciBmaWx0ZXJvYmogPSBtYWtlT3BGaWx0ZXIobW9uZ29jYXRmdWxscGF0aCwgb3BzdHIsIGZhY3RDb2VyY2VkKTtcclxuICAgICAgICByZXMgPSBhZGRGaWx0ZXJFeHByKHJlcywgZmlsdGVyb2JqKTtcclxuICAgICAgfVxyXG4gICAgICAvL3ZhciBudW1iZXJhcmcgPSBnZXROdW1iZXJBcmcobi5jaGlsZHJlblswXSwgc2VudGVuY2UpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAobi50eXBlID09PSBOVC5PUE9yZGVyQnkgfHwgbi50eXBlID09PSBOVC5PUE9yZGVyRGVzY2VuZGluZ0J5KSB7XHJcbiAgICAgIC8vdmFyIGFzY2Rlc2MgPSAobi50eXBlID09IE5ULk9QT3JkZXJEZXNjZW5kaW5nQnkpID8gMSA6IC0xO1xyXG4gICAgICAvLyByZXMgPSBhZGRTb3J0RXhwcmVzc2lvbihyZXMsIGFkZE9iamVjdFByb3AoIHt9LCBtb25nb2NhdGZ1bGxwYXRoLCBhc2NkZXNjICkgKTtcclxuICAgICAgLy8gVE9ETyAgdGhpcyBtYXkgYmUgYWRkZWQgaW4gdGhlIHdyb25nIHBvc2l0aW9uXHJcbiAgICAgIC8vICBvbmUgYWxzbyBoYXMgdG8gYXNzdXJlIHRoZSBkYXRhIGlzIG5vdCBwcm9qZWN0ZWQgb3V0IGJlZm9yZVxyXG4gICAgICAvLyAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgbm9kZXR5cGUgTlQuT1BFcUluIGJ1dCB3YXMgJyArIG4udHlwZSk7XHJcbiAgICAgIC8vIHsgJHNvcnQgOiB7IHNlbmRlciA6IC0xIH0gfWBcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKG4udHlwZSA9PT0gTlQuT1BOb3RFeGlzdGluZykge1xyXG4gICAgICAvLyB7IGl0ZW0gOiBudWxsIH1cclxuICAgICAgdmFyIGZpbHRlcm9iaiA9IG1ha2VPcEZpbHRlcihtb25nb2NhdGZ1bGxwYXRoLCBcIiRleGlzdHNcIiwgZmFsc2UpO1xyXG4gICAgICByZXMgPSBhZGRGaWx0ZXJFeHByKHJlcywgZmlsdGVyb2JqKTtcclxuICAgICAgLy8gIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgbm9kZXR5cGUgT1BFeGlzaXRpbmcgbm90IHN1cHBvcnRlZCBoZXJlICBOVC5PUEVxSW4gYnV0IHdhcyAnICsgbi50eXBlKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKG4udHlwZSA9PT0gTlQuT1BFeGlzdGluZykge1xyXG4gICAgICB2YXIgZmlsdGVyb2JqID0gbWFrZU9wRmlsdGVyKG1vbmdvY2F0ZnVsbHBhdGgsICckZXhpc3RzJywgdHJ1ZSk7XHJcbiAgICAgIHJlcyA9IGFkZEZpbHRlckV4cHIocmVzLCBmaWx0ZXJvYmopO1xyXG4gICAgICAvLyAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBub2RldHlwZSBPUEV4aXNpdGluZyBub3Qgc3VwcG9ydGVkIGhlcmUgIE5ULk9QRXFJbiBidXQgd2FzICcgKyBuLnR5cGUpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgbm9kZXR5cGUgTlQuT1BFcUluIGJ1dCB3YXMgJyArIG4udHlwZSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHsgJG1hdGNoOiByZXMgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RFeHBsaWNpdFNvcnRGcm9tQXN0KG5vZGU6IEFTVC5BU1ROb2RlLCBzZW50ZW5jZTogSUZFckJhc2UuSVNlbnRlbmNlLCBtb25nb01hcDogSUZNb2RlbC5DYXRNb25nb01hcCwgZG9tYWluOiBzdHJpbmcsIG1vbmdvSGFuZGxlUmF3OiBJRk1vZGVsLklNb2RlbEhhbmRsZVJhdyk6IEV4cGxpY2l0U29ydFtdIHtcclxuICAvLyByZXR1cm4gYW4gYXJyYXlcclxuICBkZWJ1Z2xvZyhBU1QuYXN0VG9UZXh0KG5vZGUpKTtcclxuICAvL2NvbnNvbGUubG9nKFwibWFraW5nIG1vbmdvIG1hdGNoIFwiICsgQVNULmFzdFRvVGV4dChub2RlKSk7XHJcbiAgaWYgKCFub2RlKSB7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG4gIGlmIChub2RlLnR5cGUgIT09IE5ULkxJU1QpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignZXhwZWN0ZWQgZGlmZmVyZW50IG5vZGV0eXBlICcgKyBub2RlLnR5cGUpO1xyXG4gIH1cclxuICB2YXIgcmVzID0gW10gYXMgRXhwbGljaXRTb3J0W107XHJcbiAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKG4gPT4ge1xyXG4gICAgdmFyIGNhdGVnb3J5ID0gZ2V0Q2F0ZWdvcnlGb3JOb2RlUGFpcihuLmNoaWxkcmVuWzBdLCBuLmNoaWxkcmVuWzFdLCBzZW50ZW5jZSk7XHJcbiAgICB2YXIgZnVsbHBhdGggPSBtb25nb01hcFtjYXRlZ29yeV0uZnVsbHBhdGg7IC8vIE1vZGVsLmdldE1vbmdvb3NlUGF0aCh0aGVNb2RlbCwgY2F0ZWdvcnkpOyAvL21ha2VNb25nb05hbWUoY2F0KTtcclxuICAgIHZhciBmYWN0ID0gKG4uY2hpbGRyZW4ubGVuZ3RoID4gMSkgJiYgZ2V0RmFjdEZvck5vZGUobi5jaGlsZHJlblsxXSwgc2VudGVuY2UpO1xyXG4gICAgaWYgKG4udHlwZSA9PT0gTlQuT1BPcmRlckJ5IHx8IG4udHlwZSA9PT0gTlQuT1BPcmRlckRlc2NlbmRpbmdCeSkge1xyXG4gICAgICB2YXIgYXNjZGVzYyA9IChuLnR5cGUgPT0gTlQuT1BPcmRlckRlc2NlbmRpbmdCeSkgPyAxIDogLTE7XHJcbiAgICAgIHJlcy5wdXNoKHtcclxuICAgICAgICBjYXRlZ29yeU5hbWU6IGNhdGVnb3J5LFxyXG4gICAgICAgIGZ1bGxwYXRoOiBmdWxscGF0aCxcclxuICAgICAgICBhc2NEZXNjOiBhc2NkZXNjXHJcbiAgICAgIH0gYXMgRXhwbGljaXRTb3J0KTtcclxuICAgIH1cclxuICB9KTtcclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZU1vbmdvR3JvdXBGcm9tQXN0KGNhdGVnb3J5TGlzdDogc3RyaW5nW10sIG1vbmdvTWFwOiBJRk1vZGVsLkNhdE1vbmdvTWFwKSB7XHJcblxyXG4gIHZhciByZXMgPSBjYXRlZ29yeUxpc3QubWFwKCBjYXQgPT4gbW9uZ29NYXBbY2F0XS5zaG9ydE5hbWUpO1xyXG4gIC8qXHJcbiAgdmFyIHJlcyA9IHt9O1xyXG4gIGNhdGVnb3J5TGlzdC5mb3JFYWNoKGNhdGVnb3J5ID0+IHtcclxuICAgIHZhciBmdWxscGF0aCA9IE1vbmdvTWFwLmdldEZpcnN0U2VnbWVudChtb25nb01hcFtjYXRlZ29yeV0ucGF0aHMpOyAvLyBNb2RlbC5nZXRNb25nb29zZVBhdGgodGhlTW9kZWwsIGNhdGVnb3J5KTsgLy9tYWtlTW9uZ29OYW1lKGNhdCk7XHJcbiAgICByZXNbZnVsbHBhdGhdID0gZnVsbHBhdGg7XHJcbiAgfSk7XHJcbiAgdmFyIHIxID0geyAkZ3JvdXA6IE9iamVjdC5hc3NpZ24oeyBfaWQ6IE9iamVjdC5hc3NpZ24oe30sIHJlcykgfSwge30pIH07XHJcbiAgdmFyIGZpcnN0WCA9IHt9O1xyXG4gIE9iamVjdC5rZXlzKHJlcykuZm9yRWFjaChrZXkgPT4geyBmaXJzdFhba2V5XSA9IHsgJGZpcnN0OiAnJCcgKyBrZXkgfSB9KTtcclxuICByMS4kZ3JvdXAgPSBPYmplY3QuYXNzaWduKHIxLiRncm91cCwgZmlyc3RYKTsgKi9cclxuICByZXR1cm4geyAkZ3JvdXAgOiByZXMgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VNb25nb0NvbHVtbnNGcm9tQXN0KGNhdGVnb3J5TGlzdDogc3RyaW5nW10sIG1vbmdvTWFwOiBJRk1vZGVsLkNhdE1vbmdvTWFwKVxyXG4gIDogeyBjb2x1bW5zOiBzdHJpbmdbXSwgcmV2ZXJzZU1hcDogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSB9IHtcclxuICB2YXIgcmVzID0ge1xyXG4gICAgY29sdW1uczogW10sXHJcbiAgICByZXZlcnNlTWFwOiB7fVxyXG4gIH07XHJcbiAgY2F0ZWdvcnlMaXN0LmZvckVhY2goY2F0ZWdvcnkgPT4ge1xyXG4gICAgcmVzLmNvbHVtbnMucHVzaChjYXRlZ29yeSk7XHJcbiAgICB2YXIgY2F0bW9uZ28gPSBNb25nb01hcC5nZXRTaG9ydFByb2plY3RlZE5hbWUobW9uZ29NYXAsIGNhdGVnb3J5KTtcclxuICAgIGlmIChjYXRlZ29yeSAhPT0gY2F0bW9uZ28pIHtcclxuICAgICAgcmVzLnJldmVyc2VNYXBbY2F0bW9uZ29dID0gY2F0ZWdvcnk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldENhdGVnb3J5TGlzdChmaXhlZENhdGVnb3JpZXM6IHN0cmluZ1tdLCBub2RlOiBBU1QuQVNUTm9kZSwgc2VudGVuY2U6IElGRXJCYXNlLklTZW50ZW5jZSk6IHN0cmluZ1tdIHtcclxuICB2YXIgcmVzID0gZml4ZWRDYXRlZ29yaWVzLnNsaWNlKCk7XHJcbiAgd2hpbGUgKG5vZGUudHlwZSAhPT0gTlQuTElTVClcclxuICAgIG5vZGUgPSBub2RlLmNoaWxkcmVuWzBdO1xyXG4gIGRlYnVnKEFTVC5hc3RUb1RleHQobm9kZSkpO1xyXG4gIGlmIChub2RlLnR5cGUgIT09IE5ULkxJU1QpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignZXhwZWN0ZWQgZGlmZmVyZW50IG5vZGV0eXBlICcgKyBub2RlLnR5cGUpO1xyXG4gIH1cclxuICBub2RlLmNoaWxkcmVuLm1hcChuID0+IHtcclxuICAgIGlmIChuLnR5cGUgPT09IE5ULkNBVCkge1xyXG4gICAgICB2YXIgY2F0ZWdvcnkgPSBnZXRDYXRlZ29yeUZvck5vZGUobiwgc2VudGVuY2UpO1xyXG4gICAgICBpZiAocmVzLmluZGV4T2YoY2F0ZWdvcnkpIDwgZml4ZWRDYXRlZ29yaWVzLmxlbmd0aCkge1xyXG4gICAgICAgIHJlcy5wdXNoKGNhdGVnb3J5KTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBub2RldHlwZSAke25ldyBBU1QuTm9kZVR5cGUoTlQuQ0FUKS50b1N0cmluZygpfSBidXQgd2FzICR7bmV3IEFTVC5Ob2RlVHlwZShuLnR5cGUpLnRvU3RyaW5nKCl9YCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VNb25nb1Byb2plY3Rpb25Gcm9tQXN0KGNhdGVnb3J5TGlzdDogc3RyaW5nW10sIG1vbmdvTWFwOiBJRk1vZGVsLkNhdE1vbmdvTWFwKSB7XHJcbiAgdmFyIHJlcyA9IHsgfTtcclxuICBjYXRlZ29yeUxpc3QubWFwKGNhdGVnb3J5ID0+IHtcclxuICAgIHZhciBmdWxscGF0aCA9IG1vbmdvTWFwW2NhdGVnb3J5XS5mdWxscGF0aDsgLy9tYWtlTW9uZ29OYW1lKGNhdCk7XHJcbiAgICB2YXIgc2hvcnROYW1lID0gTW9uZ29NYXAuZ2V0U2hvcnRQcm9qZWN0ZWROYW1lKG1vbmdvTWFwLCBjYXRlZ29yeSk7XHJcbiAgICBpZiAoc2hvcnROYW1lID09PSBmdWxscGF0aCkge1xyXG4gICAgICByZXNbZnVsbHBhdGhdID0gMTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJlc1tzaG9ydE5hbWVdID0gZnVsbHBhdGg7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHsgJHByb2plY3Q6IHJlcyB9O1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VNb25nb1NvcnRGcm9tQXN0KGNhdGVnb3J5TGlzdDogc3RyaW5nW10sIG1vbmdvTWFwOiBJRk1vZGVsLkNhdE1vbmdvTWFwKSB7XHJcbiAgdmFyIHJlcyA9IHt9O1xyXG4gIGNhdGVnb3J5TGlzdC5mb3JFYWNoKGNhdGVnb3J5ID0+IHtcclxuICAgIHZhciBzaG9ydE5hbWUgPSBNb25nb01hcC5nZXRTaG9ydFByb2plY3RlZE5hbWUobW9uZ29NYXAsIGNhdGVnb3J5KTtcclxuICAgIHJlc1tzaG9ydE5hbWVdID0gMTtcclxuICB9KTtcclxuICByZXR1cm4geyAkc29ydDogcmVzIH07XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRXhwbGljaXRTb3J0IHtcclxuICBjYXRlZ29yeU5hbWU6IHN0cmluZywgLy8gXHJcbiAgYXNjRGVzYzogbnVtYmVyLCAgLy8gMCBvciAxXHJcbiAgZnVsbHBhdGg6IHN0cmluZyAvLyBfdGFibGVzLlRhYmxlXHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZU1vbmdvRXhwbGljaXRTb3J0KGV4cGxpY2l0U29ydDogRXhwbGljaXRTb3J0W10sIGNhdGVnb3J5TGlzdDogc3RyaW5nW10sIG1vbmdvTWFwOiBJRk1vZGVsLkNhdE1vbmdvTWFwKSB7XHJcbiAgdmFyIHJlcyA9IHt9O1xyXG4gIGV4cGxpY2l0U29ydC5mb3JFYWNoKGVzID0+IHtcclxuICAgIHZhciBtb25nb0NhdE5hbWUgPSBlcy5mdWxscGF0aDtcclxuICAgIHJlc1ttb25nb0NhdE5hbWVdID0gZXMuYXNjRGVzYztcclxuICB9KTtcclxuICBjYXRlZ29yeUxpc3QuZm9yRWFjaChjYXRlZ29yeSA9PiB7XHJcbiAgICB2YXIgc2hvcnROYW1lID0gTW9uZ29NYXAuZ2V0U2hvcnRQcm9qZWN0ZWROYW1lKG1vbmdvTWFwLCBjYXRlZ29yeSk7XHJcbiAgICBpZiAocmVzW3Nob3J0TmFtZV0gPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJlc1tzaG9ydE5hbWVdID0gMTtcclxuICAgIH1cclxuICB9KTtcclxuICByZXR1cm4geyAkc29ydDogcmVzIH07XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VNb25nb01hdGNoRihmaWx0ZXJzOiBJRmlsdGVyW10pIHtcclxuICB2YXIgcmVzID0geyAkbWF0Y2g6IHt9IH07XHJcbiAgLy9jb25zb2xlLmxvZygnaXMgbWF0Y2ggXFxuJyk7XHJcbiAgZmlsdGVycy5mb3JFYWNoKGZpbHRlciA9PiB7XHJcbiAgICByZXMuJG1hdGNoW2ZpbHRlci5jYXRdID0gZmlsdGVyLnZhbHVlO1xyXG4gIH0pO1xyXG4gIHJldHVybiByZXM7XHJcbn1cclxuXHJcblxyXG4iXX0=
