"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSourceHandle = exports.filterByQuery = exports.applyStep = exports.applySort = exports.applyUnwind = exports.removeDuplicates = exports.isAllPropsEmpty = exports.makeKey = exports.isDeep = exports.applyProjectCollecting = exports.flattenDeep = exports.copyAllBut = exports.wrapArray = exports.filterProject = exports.applyProject = exports.applyProjectOnly = exports.applyMatchAsFilter = exports.collectRelevantCategoriesWithSingleArrayOnPath = exports.collectPaths = exports.applyMatch = exports.satisfiesMatch = exports.isCountOp = exports.evalSet = exports.compareByType = exports.asString = exports.evalArg = exports.isEvalArr = void 0;
const fs = require("fs");
const model_1 = require("./model");
const MongoMap = require("./mongomap");
const _ = require("lodash");
//import * as intf from 'constants';
const debugf = require("debugf");
const console_1 = require("console");
var debuglog = debugf('srchandle');
;
function isEvalArr(rec, arg) {
    if (arg['$ARRAYSIZE_OR_VAL_OR1']) {
        var path = arg['$ARRAYSIZE_OR_VAL_OR1'];
        var propPath = path.split("."); // is this the category or the path
        var res = MongoMap.collectMemberByPath(rec, propPath);
        if (res.length && typeof res[0] == "number") {
            return false; // a numberical evaluation which can be done!
        }
        return true;
    }
}
exports.isEvalArr = isEvalArr;
function evalArg(rec, arg) {
    if (arg['$eval']) {
        // TODO elements
        debuglog(" retrieve " + arg['$eval'] + ' from ' + JSON.stringify(rec));
        var str = arg['$eval'].split(".");
        return MongoMap.collectMemberByPath(rec, str);
    }
    else if (arg['$regex']) {
        return arg['$regex'];
    }
    else if (arg['$ARRAYSIZE_OR_VAL_OR1']) {
        var path = arg['$ARRAYSIZE_OR_VAL_OR1'];
        var propPath = path.split("."); // is this the category or the path
        var res = MongoMap.collectMemberByPath(rec, propPath);
        if (res.length && typeof res[0] == "number") {
            return res;
        }
        return [res.length];
        return arg['$regex'];
    }
    else {
        return [arg];
    }
}
exports.evalArg = evalArg;
function asString(a) {
    return "" + a;
}
exports.asString = asString;
function compareByType(op, l, r) {
    if (typeof r == "string") {
        l = asString(l);
    }
    switch (op) {
        case "$lt":
            return l < r;
        case "$lte":
            return l <= r;
        case "$gt":
            return l > r;
        case "$gte":
            return l >= r;
        case "$eq":
            return l == r;
        case "$ne":
            return l != r;
        default:
            throw "Unimplemented op " + op;
    }
}
exports.compareByType = compareByType;
function evalSet(op, lhs, rhs) {
    switch (op) {
        case "$regex":
            {
                if (typeof rhs == "object" && rhs.constructor == RegExp) {
                    return lhs.some(a => rhs.exec(asString(a)));
                }
                throw "rhs is not an regexp" + JSON.stringify(rhs);
            }
            break;
        case "$lt":
        case "$lte":
        case "$gt":
        case "$gte":
        case "$eq":
        case "$ne":
            {
                return rhs.some(r => (lhs.some(l => compareByType(op, l, r))));
            }
            break;
        case "$exists": {
            if (rhs[0] == false) {
                return lhs.length == 0;
            }
            return lhs.length > 0;
        }
        default:
            throw "Unimplemented op " + op;
    }
}
exports.evalSet = evalSet;
var ops = ["$lt", "$eq", "$ne", "$lte", "$gt", "$gte", "$exists", "$regex"];
function isCountOp(rec, matchOp) {
    return isEvalArr(rec, matchOp[0]) || isEvalArr(rec, matchOp[1]);
}
exports.isCountOp = isCountOp;
function satisfiesMatch(rec, match, ignoreCount) {
    var props = Object.getOwnPropertyNames(match);
    if (props.length == 0) {
        return true;
    }
    else if (match['$and']) {
        debuglog('found $and');
        return match['$and'].every(cond => satisfiesMatch(rec, cond, ignoreCount));
    }
    else if (match['$or']) {
        return match['$or'].any(cond => satisfiesMatch(rec, cond, ignoreCount));
    }
    else if (ops.indexOf(Object.getOwnPropertyNames(match)[0]) >= 0) {
        var op = Object.getOwnPropertyNames(match)[0];
        var lhs = evalArg(rec, match[op][0]);
        var rhs = evalArg(rec, match[op][1]);
        debuglog(() => 'rhs ' + JSON.stringify(lhs) + " rhs:" + JSON.stringify(rhs));
        if (ignoreCount && isCountOp(rec, match[op])) {
            return true; // this precluded logical not above!
        }
        return evalSet(op, lhs, rhs);
    }
    else if (match["$expr"]) {
        return satisfiesMatch(rec, match["$expr"], ignoreCount);
    }
    else {
        console.log('unknown op ' + JSON.stringify(match));
    }
}
exports.satisfiesMatch = satisfiesMatch;
function applyMatch(records, match) {
    var l1 = records.length;
    var res = records.filter(rec => satisfiesMatch(rec, match));
    debuglog(' applied match ' + res.length + "/" + l1);
    return res;
}
exports.applyMatch = applyMatch;
function atLeastOneIsArrayMult(records, path) {
    return path.indexOf('.') < 0 && records.some(r => _.isArray(r[path]) && r[path].length > 1);
}
function collectPaths(prev, match) {
    if (match["$eval"]) {
        var path = match["$eval"];
        if (path.indexOf(".") < 0) {
            prev.push(path);
        }
        return prev;
    }
    if (_.isArray(match)) {
        var r = prev;
        match.forEach(m => { r = collectPaths(r, m); });
        return r;
    }
    if (typeof match == "object") {
        var r = prev;
        Object.getOwnPropertyNames(match).forEach(pn => {
            r = collectPaths(r, match[pn]);
        });
        return r;
    }
    return prev;
}
exports.collectPaths = collectPaths;
function collectRelevantCategoriesWithSingleArrayOnPath(records, match) {
    // we only support "trivial categories, for now, not deep ones"
    var matchPaths = _.uniq(collectPaths([], match));
    // 1) we collect all evalution path   XXXXXXXX
    // then we analyse a record whether it is array-ish
    return matchPaths.filter(path => atLeastOneIsArrayMult(records, path)).map(path => { var res = { "pathToArr": path }; return res; });
}
exports.collectRelevantCategoriesWithSingleArrayOnPath = collectRelevantCategoriesWithSingleArrayOnPath;
/**
 * This step apply match conditions on records, pruning non-fitting array members on the result stream
 *
 * A complete implementation would have to denormalize the tuples, then apply the filters (ignoring more than count x conditions),
 * then recombine them into "unique" arrays
 * this is currenlty not implemented
 *
 * @param records
 * @param match
 */
function applyMatchAsFilter(records, match) {
    var l1 = records.length;
    var relevantCategories = collectRelevantCategoriesWithSingleArrayOnPath(records, match);
    if (relevantCategories.length == 0) {
        return records;
    }
    var res = records.map(rec => {
        // iterate over each relevant property,
        var rcClone = _.cloneDeep(rec);
        relevantCategories.forEach(relcat => {
            if (_.isArray(rec[relcat.pathToArr])) {
                var rcOne = _.cloneDeep(rec);
                rcClone[relcat.pathToArr] = rcClone[relcat.pathToArr].filter(arrMem => {
                    // construct a clone with the single member set
                    rcOne[relcat.pathToArr] = [arrMem];
                    return satisfiesMatch(rcOne, match, true);
                });
            }
            else {
                // nothign to filter 
            }
        });
        return rcClone;
    });
    debuglog(' applied match ' + res.length + "/" + l1);
    return res;
}
exports.applyMatchAsFilter = applyMatchAsFilter;
function applyProjectOnly(records, project) {
    var res = [];
    var len = records.length;
    records.forEach((rec, index) => {
        if (index % 200 == 10) {
            console.log('' + index + "/" + len + " " + res.length);
        }
        res = applyProjectCollecting(res, rec, project, {});
    });
    return res;
}
exports.applyProjectOnly = applyProjectOnly;
/**
 *
 * @param records
 * @param project
 * @param keepAsArray  members ( keys of project! ) are directly collected as array and not to-n-expanded,
 * so  [{a :1, b:"B1" },{a:2, b:"B2"}] , c[ "C1", "C2" ]
 * will become  a: [1,2], b: ["B1", B2], c: ["C1" , "C2"] if  ["a","b","c"] is passed
 */
function applyProject(records, project, keepAsArray) {
    // 1) collect all keepasarray directly, 
    var splitKeepAsArrayPaths = {};
    keepAsArray.forEach(k => {
        splitKeepAsArrayPaths[k] = project[k].split('.');
    });
    var recFixed = records;
    if (keepAsArray.length) {
        console.log(" keep fixed" + JSON.stringify(keepAsArrayMap));
        recFixed = records.map(r => {
            var rfix = _.clone(r);
            keepAsArray.forEach(p => {
                rfix[p] = MongoMap.collectMemberByPath(r, splitKeepAsArrayPaths[p]);
            });
            return rfix;
        });
    }
    var newproject = _.clone(project);
    var keepAsArrayMap = {};
    keepAsArray.forEach(k => {
        newproject[k] = k;
        keepAsArrayMap[k] = 1;
    });
    var res = [];
    var len = records.length;
    recFixed.forEach((rec, index) => {
        if (index % 200 == 10) {
            console.log('' + index + "/" + len + " " + res.length);
        }
        res = applyProjectCollecting(res, rec, newproject, keepAsArrayMap);
    });
    return res;
}
exports.applyProject = applyProject;
function filterProject(project, prefix) {
    var res = {};
    Object.getOwnPropertyNames(project).forEach(pn => {
        if (("" + project[pn]).startsWith(prefix + ".")) {
            res[pn] = project[pn].substr(prefix.length + 1);
        }
    });
    return res;
}
exports.filterProject = filterProject;
function wrapArray(a) {
    if (_.isArray(a)) {
        return a;
    }
    return [a];
}
exports.wrapArray = wrapArray;
function copyAllBut(rec, removedProperties) {
    var res = {};
    Object.getOwnPropertyNames(rec).filter(pn => removedProperties.indexOf(pn) < 0).forEach(pn => res[pn] = rec[pn]);
    return res;
}
exports.copyAllBut = copyAllBut;
function flattenDeep(rec, compact) {
    var res = [copyAllBut(rec, compact)];
    // we construct the new records 
    compact.forEach(c => {
        var next = [];
        res.forEach(base => {
            // copy all properties from res[c] into each base; 
            console_1.assert(_.isArray(rec[c])); // what if this is empty?
            rec[c].forEach(obj => {
                if (typeof obj == "object") {
                    var nb = _.clone(base);
                    Object.assign(nb, obj);
                    next.push(nb);
                }
                else {
                    var nb = _.clone(base);
                    nb[c] = obj;
                    next.push(nb);
                }
            });
        });
        res = next;
    });
    return res;
}
exports.flattenDeep = flattenDeep;
function applyProjectCollecting(res, rec, project, keepAsArrayMap) {
    // 1) retrieve only members part of the project, flattening the records in the process
    var fields = Object.getOwnPropertyNames(project);
    var seen = {};
    var compact = [];
    // 1) we expand all collinear into an array [ regardless of origin]  construct a { e : x,  _categories : [ { x : a, b : [ { x: a, b: a} } ]}
    var tmpl = {};
    fields.forEach(f => {
        if (!seen[f]) {
            var fullpath = (project[f] == 1) ? f : project[f];
            var path = fullpath.split(".");
            if (path.length == 1) {
                if (_.isArray(rec[fullpath]) && keepAsArrayMap[f]) {
                    // keep array!
                    tmpl[path] = rec[fullpath];
                }
                else if (_.isArray(rec[fullpath])) {
                    compact.push(fullpath);
                    tmpl[f] = rec[fullpath];
                    return;
                }
                else if (typeof rec[fullpath] == "object") {
                    // this cannot be, 
                    throw "Unable to extract member " + fullpath + " from " + JSON.stringify(res);
                }
                else {
                    tmpl[path] = rec[fullpath];
                    return;
                }
            }
            else {
                // collect prefixe set, create pseudo projection from it. 
                var prefix = path[0];
                compact.push(prefix);
                var projSuffix = filterProject(project, prefix);
                Object.getOwnPropertyNames(projSuffix).forEach(a => seen[a] = 1);
                var localExpand = applyProjectOnly(wrapArray(rec[prefix]), projSuffix);
                tmpl[prefix] = localExpand;
            }
        }
    });
    var aug = flattenDeep(tmpl, compact);
    return res.concat(aug);
}
exports.applyProjectCollecting = applyProjectCollecting;
function isDeep(a) {
    return Object.getOwnPropertyNames(a).some(p => _.isObject(a[p]) || _.isArray(a[p]));
}
exports.isDeep = isDeep;
function makeKey(a) {
    return Object.getOwnPropertyNames(a).map(k => '' + (a[k] || '')).join('__');
}
exports.makeKey = makeKey;
function isAllPropsEmpty(s) {
    return s.search(/[^_]/) < 0;
}
exports.isAllPropsEmpty = isAllPropsEmpty;
function removeDuplicates(records) {
    var seen = {};
    return records.filter(a => { var s = makeKey(a); var res = isDeep(a) || (!isAllPropsEmpty(s) && !seen[s]); seen[s] = 1; return res; });
}
exports.removeDuplicates = removeDuplicates;
/**
 * if member of unwind points to an array, expand it.
 * @param records I
 * @param unwind
 * @param any
 */
function applyUnwind(records, unwind) {
    var res = [];
    var prop = unwind.path;
    records.forEach(r => {
        if (_.isArray(r[prop]) && r[prop].length > 0) {
            r[prop].forEach(el => {
                var rc = _.cloneDeep(r);
                rc[prop] = el;
                res.push(rc);
            });
        }
        else {
            res.push(r);
        }
    });
    return res;
}
exports.applyUnwind = applyUnwind;
function applySort(records, match) {
    var props = Object.getOwnPropertyNames(match);
    records.sort((a, b) => {
        for (var i = 0; i < props.length; ++i) {
            var fac = 1;
            if (match[props[i]] == -1) {
                fac = -1;
            }
            var lhs = a[props[i]];
            var rhs = b[props[i]];
            if (lhs > rhs) {
                return +fac;
            }
            else if (lhs < rhs) {
                return -fac;
            }
            else if (lhs == undefined) {
                return +fac;
            }
        }
        return 0;
    });
    return records;
}
exports.applySort = applySort;
function applyStep(records, queryStep) {
    debugger;
    if (queryStep["$match"]) {
        var r = applyMatch(records, queryStep["$match"]);
        return applyMatchAsFilter(r, queryStep["$match"]);
    }
    else if (queryStep["$project"]) {
        return applyProject(records, queryStep["$project"], queryStep["$keepAsArray"] || []);
    }
    else if (queryStep["$sort"]) {
        return applySort(records, queryStep["$sort"]);
    }
    else if (queryStep["$unwind"]) {
        return applyUnwind(records, queryStep["$unwind"]);
    }
    else if (queryStep["$group"] || queryStep["$unwind"]) {
        return records;
    }
    console.log('unknown step ' + JSON.stringify(queryStep));
    return records;
}
exports.applyStep = applyStep;
function filterByQuery(records, query) {
    var res = records;
    debugger;
    query.forEach(qcomp => { res = applyStep(res, qcomp); });
    return removeDuplicates(res);
}
exports.filterByQuery = filterByQuery;
class APseudoModel {
    constructor(modelName, records, schema) {
        this.modelname = modelName;
        this.records = records;
        this.schema = schema;
    }
    aggregateSynonyms() {
        var self = this;
        /*
            "_synonyms" : [
              { "category" : "object name",
                "fact" : "earth",
                "synonyms" : [ "blue planet" , "gaia"]
              },
              { "category" : "orbits",
                "fact" : "Sun",
                "synonyms" : [ "Sol"]
              }
              */
        var res = [];
        self.records.forEach(rec => {
            var syn = MongoMap.getMemberByPath(rec, ["_synonyms"]);
            if (syn) {
                res = res.concat(syn);
            }
        });
        debuglog(' found ' + res.length + ' synonyms for ' + this.modelname);
        return new Promise((resolve, reject) => { resolve(res); });
    }
    distinctFlat(modelPath) {
        var o = {};
        var self = this;
        this.records.forEach(rec => {
            var r = MongoMap.getMemberByPath(rec, modelPath.paths);
            if (_.isArray(r)) {
                r.forEach(k => o[k] = k);
            }
            else {
                if (r) {
                    o[r] = r;
                }
            }
        });
        var res = Object.getOwnPropertyNames(o).map((k) => o[k]).sort();
        return model_1.asPromise(res);
    }
    distinct(path) {
        var self = this;
        return new Promise((resolve, reject) => {
            var o = {};
            // TODO: not only direct prop
            self.records.forEach(a => console.log("here one " + a[path]));
            self.records.forEach(a => {
                var u = a[path];
                if (_.isArray(u)) {
                }
                else {
                    o[a[path]] = a[path];
                }
            });
            resolve(Object.getOwnPropertyNames(o).map((k) => o[k]).sort());
        });
    }
    find(query) {
        var self = this;
        if (Object.getOwnPropertyNames(query).length == 0) {
            return new Promise((resolve, reject) => { resolve(self.records); });
        }
        console.log("find " + JSON.stringify(query));
        throw "Find " + JSON.stringify(query);
    }
    aggregate(query) {
        debuglog("Aggregate " + JSON.stringify(query));
        var self = this;
        var res = filterByQuery(self.records, query);
        return new Promise((resolve, reject) => { resolve(res); });
    }
}
class ASrcHandle {
    constructor(path) {
        this.path = path;
        if (!this.path.endsWith('/')) {
            this.path = this.path + '/';
        }
        console.log(' this is the path' + path);
        this._pseudoModels = {};
    }
    modelNames() {
        return this._modelNames;
    }
    getPath() {
        return this.path;
    }
    model(name) {
        return this._pseudoModels[name];
    }
    setModel(modelName, records, schema) {
        debuglog("Setting model " + modelName + " with " + records.length + " records ");
        this._pseudoModels[modelName] = new APseudoModel(modelName, records, schema);
    }
    connect(modelPath) {
        this.path = modelPath;
        if (!this.path.endsWith('/')) {
            this.path = this.path + '/';
        }
        console.log(' this is the path' + this.path);
        var self = this;
        return new Promise((resolve, reject) => {
            fs.readFile(this.path + "models.json", (err, buffer) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
                self._modelNames = JSON.parse(buffer.toString('utf-8'));
                debuglog("Read modelnames " + JSON.stringify(self._modelNames) + " this.path =" + self.path);
                resolve(self);
            });
        });
    }
    getJSON(filename) {
        var self = this;
        var fullfile = this.path + filename;
        //console.log(' read file ' + fullfile);
        return new Promise((resolve, reject) => {
            fs.readFile(fullfile, (err, buffer) => {
                if (err) {
                    console.log(fullfile + err);
                    throw err;
                }
                var data = JSON.parse(buffer.toString('utf-8'));
                resolve(data);
            });
        });
    }
    getJSONArr(filename) {
        var self = this;
        var fullfile = this.path + filename;
        //console.log(' read file ' + fullfile);
        return new Promise((resolve, reject) => {
            fs.readFile(fullfile, (err, buffer) => {
                if (err) {
                    console.log(fullfile);
                    console.log(err);
                    throw err;
                }
                var data = JSON.parse(buffer.toString('utf-8'));
                resolve([data]);
            });
        });
    }
}
function createSourceHandle() {
    return new ASrcHandle("");
}
exports.createSourceHandle = createSourceHandle;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tb2RlbC9zcmNoYW5kbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0EseUJBQXlCO0FBQ3pCLG1DQUE2RDtBQUM3RCx1Q0FBd0M7QUFFeEMsNEJBQTRCO0FBRTVCLG9DQUFvQztBQUNwQyxpQ0FBaUM7QUFHakMscUNBQWlDO0FBTWpDLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQU1sQyxDQUFDO0FBMEJGLFNBQWdCLFNBQVMsQ0FBQyxHQUFRLEVBQUUsR0FBUztJQUMzQyxJQUFLLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFO1FBQ2pDLElBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBQ3hDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxtQ0FBbUM7UUFDbkUsSUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN0RCxJQUFJLEdBQUcsQ0FBQyxNQUFNLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksUUFBUSxFQUFFO1lBQzNDLE9BQU8sS0FBSyxDQUFDLENBQUMsNkNBQTZDO1NBQzVEO1FBQ0QsT0FBTyxJQUFJLENBQUM7S0FDYjtBQUNILENBQUM7QUFWRCw4QkFVQztBQUVELFNBQWdCLE9BQU8sQ0FBQyxHQUFRLEVBQUUsR0FBUztJQUN6QyxJQUFLLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUNqQixnQkFBZ0I7UUFDaEIsUUFBUSxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN2RSxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FB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UUFBUSxDQUFDLENBQUM7b0JBQ3RCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2pCLE1BQU0sR0FBRyxDQUFDO2lCQUNYO2dCQUNGLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBUSxDQUFDO2dCQUN0RCxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLENBQUMsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFFRCxTQUFnQixrQkFBa0I7SUFDaEMsT0FBTyxJQUFJLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM1QixDQUFDO0FBRkQsZ0RBRUMiLCJmaWxlIjoibW9kZWwvc3JjaGFuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSVN5bnRhY3RpY0NvbnRlbnRBc3Npc3RQYXRoIH0gZnJvbSBcImNoZXZyb3RhaW5cIjtcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwidXJsXCI7XG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCB7IGFkZENsb3NlRXhhY3RSYW5nZVJ1bGVzLCBhc1Byb21pc2UgfSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0ICogYXMgTW9uZ29NYXAgZnJvbSAgXCIuL21vbmdvbWFwXCI7XG5pbXBvcnQgeyBhQW55U3VjY2Vzc29yT3BlcmF0b3JOYW1lcywgSU1vZGVsUGF0aCB9IGZyb20gXCIuLi9tYXRjaC9pZm1hdGNoXCI7XG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5cbi8vaW1wb3J0ICogYXMgaW50ZiBmcm9tICdjb25zdGFudHMnO1xuaW1wb3J0ICogYXMgZGVidWdmIGZyb20gJ2RlYnVnZic7XG5pbXBvcnQgeyBldmFsdWF0ZVJhbmdlUnVsZXNUb1Bvc2l0aW9uIH0gZnJvbSBcIi4uL21hdGNoL2VyYmFzZVwiO1xuaW1wb3J0IHsgU2VudGVuY2UgfSBmcm9tIFwiLi4vbWF0Y2gvZXJfaW5kZXhcIjtcbmltcG9ydCB7IGFzc2VydCB9IGZyb20gXCJjb25zb2xlXCI7XG5pbXBvcnQgeyBuZXh0VGljayB9IGZyb20gXCJwcm9jZXNzXCI7XG5pbXBvcnQgeyBpc0VtcHR5IH0gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgcmVjb2duaXplIH0gZnJvbSBcIi4uL2JvdC9wbGFpbnJlY29nbml6ZXJcIjtcbmltcG9ydCB7IFpfUEFSVElBTF9GTFVTSCB9IGZyb20gXCJ6bGliXCI7XG5cbnZhciBkZWJ1Z2xvZyA9IGRlYnVnZignc3JjaGFuZGxlJyk7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVN5bm9ueW0ge1xuICBjYXRlZ29yeTogc3RyaW5nLFxuICBmYWN0OiBzdHJpbmcsXG4gIHN5bm9ueW1zOiBzdHJpbmdbXVxufTtcblxuZXhwb3J0IGludGVyZmFjZSBJUHNldWRvTW9kZWwge1xuICBtb2RlbG5hbWUgOiBzdHJpbmcsXG4gIHJlY29yZHMgOiBhbnlbXTtcbiAgc2NoZW1hIDogYW55O1xuICBhZ2dyZWdhdGVTeW5vbnltcygpIDogUHJvbWlzZTxJU3lub255bVtdPjtcbiAgZGlzdGluY3RGbGF0KCBtb2RlbFBhdGggOiBJTW9kZWxQYXRoICkgOiBQcm9taXNlPHN0cmluZ1tdPjtcbiAgZGlzdGluY3QoIHBhdGggOiBzdHJpbmcpIDogUHJvbWlzZTxzdHJpbmdbXT47XG4gIGZpbmQocXVlcnk6IGFueSkgOiBQcm9taXNlPGFueVtdPjtcbiAgYWdncmVnYXRlKHF1ZXJ5IDogYW55KSA6IFByb21pc2U8YW55W10+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElQc2V1ZG9TY2hlbWEge1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElTcmNIYW5kbGUge1xuICBtb2RlbE5hbWVzKCkgOiBzdHJpbmdbXSxcbiAgZ2V0UGF0aCgpIDogc3RyaW5nLFxuICBtb2RlbChhIDogc3RyaW5nLCBzY2hlbWE/OiBhbnkpIDogSVBzZXVkb01vZGVsLFxuICBzZXRNb2RlbChtb2RlbG5hbWUgOiBzdHJpbmcgLCBkYXRhOmFueSwgc2NoZW1hIDogYW55KSxcbiAgY29ubmVjdCggY29ubmVjdGlvblN0cmluZyA6IHN0cmluZyApIDogUHJvbWlzZTxJU3JjSGFuZGxlPlxuICBnZXRKU09OKCBmaWxlbmFtZSA6IHN0cmluZyAsIG1vZGVsbmFtZXM/IDogc3RyaW5nW10pIDogUHJvbWlzZTxhbnk+O1xuICBnZXRKU09OQXJyKCBmaWxlbmFtZSA6IHN0cmluZykgOiBQcm9taXNlPGFueVtdPjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRXZhbEFycihyZWM6IGFueSwgYXJnIDogYW55KSA6IGJvb2xlYW4ge1xuICBpZiAoIGFyZ1snJEFSUkFZU0laRV9PUl9WQUxfT1IxJ10pIHtcbiAgICB2YXIgcGF0aCA9IGFyZ1snJEFSUkFZU0laRV9PUl9WQUxfT1IxJ107XG4gICAgdmFyIHByb3BQYXRoID0gcGF0aC5zcGxpdChcIi5cIik7IC8vIGlzIHRoaXMgdGhlIGNhdGVnb3J5IG9yIHRoZSBwYXRoXG4gICAgdmFyIHJlcyA9IE1vbmdvTWFwLmNvbGxlY3RNZW1iZXJCeVBhdGgocmVjLCBwcm9wUGF0aCk7XG4gICAgaWYoIHJlcy5sZW5ndGggJiYgdHlwZW9mIHJlc1swXSA9PSBcIm51bWJlclwiKSB7XG4gICAgICByZXR1cm4gZmFsc2U7IC8vIGEgbnVtYmVyaWNhbCBldmFsdWF0aW9uIHdoaWNoIGNhbiBiZSBkb25lIVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTsgXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV2YWxBcmcocmVjOiBhbnksIGFyZyA6IGFueSkgOiBhbnlbXSB7XG4gIGlmICggYXJnWyckZXZhbCddKSB7XG4gICAgLy8gVE9ETyBlbGVtZW50c1xuICAgIGRlYnVnbG9nKFwiIHJldHJpZXZlIFwiICsgYXJnWyckZXZhbCddICsgJyBmcm9tICcgKyBKU09OLnN0cmluZ2lmeShyZWMpKTtcbiAgICB2YXIgc3RyID0gYXJnWyckZXZhbCddLnNwbGl0KFwiLlwiKTtcbiAgICByZXR1cm4gTW9uZ29NYXAuY29sbGVjdE1lbWJlckJ5UGF0aChyZWMsIHN0cik7XG4gIH0gZWxzZSBpZiAoIGFyZ1snJHJlZ2V4J10pIHtcbiAgICByZXR1cm4gYXJnWyckcmVnZXgnXTtcbiAgfSBlbHNlIGlmICggYXJnWyckQVJSQVlTSVpFX09SX1ZBTF9PUjEnXSkge1xuICAgIHZhciBwYXRoID0gYXJnWyckQVJSQVlTSVpFX09SX1ZBTF9PUjEnXTtcbiAgICB2YXIgcHJvcFBhdGggPSBwYXRoLnNwbGl0KFwiLlwiKTsgLy8gaXMgdGhpcyB0aGUgY2F0ZWdvcnkgb3IgdGhlIHBhdGhcbiAgICB2YXIgcmVzID0gTW9uZ29NYXAuY29sbGVjdE1lbWJlckJ5UGF0aChyZWMsIHByb3BQYXRoKTtcbiAgICBpZiggcmVzLmxlbmd0aCAmJiB0eXBlb2YgcmVzWzBdID09IFwibnVtYmVyXCIpIHtcbiAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIHJldHVybiBbcmVzLmxlbmd0aF07XG4gICAgcmV0dXJuIGFyZ1snJHJlZ2V4J107XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIFthcmddO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc1N0cmluZyggYSA6IGFueSkgOiBzdHJpbmcge1xuICByZXR1cm4gXCJcIiArIGE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wYXJlQnlUeXBlKG9wOiBzdHJpbmcsIGwgOiBhbnksIHI6IGFueSkgOiBib29sZWFuIHtcbiAgaWYgKCB0eXBlb2YgciA9PSBcInN0cmluZ1wiKSB7XG4gICAgbCA9IGFzU3RyaW5nKGwpO1xuICB9XG4gIHN3aXRjaChvcCkge1xuICBjYXNlIFwiJGx0XCI6IFxuICAgIHJldHVybiBsIDwgcjtcbiAgY2FzZSBcIiRsdGVcIjpcbiAgICByZXR1cm4gbCA8PSByO1xuICBjYXNlIFwiJGd0XCI6XG4gICAgcmV0dXJuIGwgPiByO1xuICBjYXNlIFwiJGd0ZVwiOlxuICAgIHJldHVybiBsID49IHI7XG4gIGNhc2UgXCIkZXFcIjpcbiAgICByZXR1cm4gbCA9PSByO1xuICBjYXNlIFwiJG5lXCI6XG4gICAgcmV0dXJuIGwgIT0gcjtcbiAgZGVmYXVsdDogXG4gIHRocm93IFwiVW5pbXBsZW1lbnRlZCBvcCBcIiArIG9wO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBldmFsU2V0KG9wIDogc3RyaW5nLCBsaHM6IGFueSwgcmhzOiBhbnkgKSA6IGJvb2xlYW4ge1xuICBzd2l0Y2gob3ApIHtcbiAgY2FzZSBcIiRyZWdleFwiOntcbiAgICBpZiAoIHR5cGVvZiByaHMgPT0gXCJvYmplY3RcIiAmJiAgcmhzLmNvbnN0cnVjdG9yID09IFJlZ0V4cCkge1xuICAgICAgcmV0dXJuIGxocy5zb21lKCBhID0+IHJocy5leGVjKGFzU3RyaW5nKGEpKSk7XG4gICAgfVxuICAgIHRocm93IFwicmhzIGlzIG5vdCBhbiByZWdleHBcIiArIEpTT04uc3RyaW5naWZ5KHJocyk7XG4gIH1cbiAgYnJlYWs7XG4gIGNhc2UgXCIkbHRcIjogXG4gIGNhc2UgXCIkbHRlXCI6XG4gIGNhc2UgXCIkZ3RcIjpcbiAgY2FzZSBcIiRndGVcIjpcbiAgY2FzZSBcIiRlcVwiOlxuICBjYXNlIFwiJG5lXCI6XG4gIHtcbiAgICByZXR1cm4gcmhzLnNvbWUoIHIgPT4gKCBsaHMuc29tZSggbCA9PiAgIGNvbXBhcmVCeVR5cGUob3AsbCxyKSApKSk7XG4gIH1cbiAgYnJlYWs7XG4gIGNhc2UgXCIkZXhpc3RzXCI6IHtcbiAgICBpZiAoIHJoc1swXSA9PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIGxocy5sZW5ndGggPT0gMDtcbiAgICB9XG4gICAgcmV0dXJuIGxocy5sZW5ndGggPiAwO1xuICB9XG4gIGRlZmF1bHQ6IFxuICAgIHRocm93IFwiVW5pbXBsZW1lbnRlZCBvcCBcIiArIG9wO1xuICB9XG59XG5cbnZhciBvcHMgPSBbXCIkbHRcIiwgXCIkZXFcIiwgXCIkbmVcIiwgXCIkbHRlXCIsIFwiJGd0XCIsIFwiJGd0ZVwiLCBcIiRleGlzdHNcIiwgXCIkcmVnZXhcIiBdO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNDb3VudE9wKHJlYzphbnkgLCBtYXRjaE9wIDogYW55KSB7XG4gIHJldHVybiBpc0V2YWxBcnIocmVjLCBtYXRjaE9wWzBdKSB8fCBpc0V2YWxBcnIocmVjLCBtYXRjaE9wWzFdKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhdGlzZmllc01hdGNoKHJlYyA6IGFueSwgbWF0Y2ggOiBhbnksIGlnbm9yZUNvdW50PyA6IGJvb2xlYW4pIDogYm9vbGVhbiB7XG4gIHZhciBwcm9wcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG1hdGNoKTtcbiAgaWYocHJvcHMubGVuZ3RoID09IDAgKXtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmKG1hdGNoWyckYW5kJ10pIHtcbiAgICBkZWJ1Z2xvZygnZm91bmQgJGFuZCcpO1xuICAgIHJldHVybiBtYXRjaFsnJGFuZCddLmV2ZXJ5KCBjb25kID0+IHNhdGlzZmllc01hdGNoKHJlYywgY29uZCwgaWdub3JlQ291bnQpKTtcbiAgfSBlbHNlIGlmIChtYXRjaFsnJG9yJ10pIHtcbiAgICByZXR1cm4gbWF0Y2hbJyRvciddLmFueSggY29uZCA9PiBzYXRpc2ZpZXNNYXRjaChyZWMsIGNvbmQsIGlnbm9yZUNvdW50KSk7XG4gIH0gZWxzZSBpZiAoIG9wcy5pbmRleE9mKE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG1hdGNoKVswXSkgPj0gMCkge1xuICAgICAgdmFyIG9wID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMobWF0Y2gpWzBdO1xuICAgICAgdmFyIGxocyA9IGV2YWxBcmcocmVjLG1hdGNoW29wXVswXSlcbiAgICAgIHZhciByaHMgPSBldmFsQXJnKHJlYyxtYXRjaFtvcF1bMV0pO1xuICAgICAgZGVidWdsb2coKCkgPT4gJ3JocyAnICsgSlNPTi5zdHJpbmdpZnkobGhzKSArIFwiIHJoczpcIiArIEpTT04uc3RyaW5naWZ5KHJocykpO1xuICAgICAgaWYgKCBpZ25vcmVDb3VudCAmJiBpc0NvdW50T3AocmVjLCBtYXRjaFtvcF0pKSB7XG4gICAgICAgIHJldHVybiB0cnVlOyAvLyB0aGlzIHByZWNsdWRlZCBsb2dpY2FsIG5vdCBhYm92ZSFcbiAgICAgIH1cbiAgICAgIHJldHVybiBldmFsU2V0KG9wLGxocyxyaHMpO1xuICB9IGVsc2UgaWYgKCBtYXRjaFtcIiRleHByXCJdKSB7XG4gICAgcmV0dXJuIHNhdGlzZmllc01hdGNoKHJlYyxtYXRjaFtcIiRleHByXCJdLCBpZ25vcmVDb3VudCk7XG4gIH1cbiAgZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ3Vua25vd24gb3AgJyArIEpTT04uc3RyaW5naWZ5KG1hdGNoKSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5TWF0Y2gocmVjb3JkczphbnlbXSwgbWF0Y2g6IGFueSkgOiBhbnlbXSB7XG4gIHZhciBsMT0gcmVjb3Jkcy5sZW5ndGg7XG4gIHZhciByZXMgPSByZWNvcmRzLmZpbHRlciggcmVjID0+IHNhdGlzZmllc01hdGNoKHJlYyAsbWF0Y2gpKTtcbiAgZGVidWdsb2coJyBhcHBsaWVkIG1hdGNoICcgKyByZXMubGVuZ3RoICsgXCIvXCIgKyBsMSApO1xuICByZXR1cm4gcmVzO1xufVxuXG5pbnRlcmZhY2UgUmVsZXZhbnRBcnJDYXRlZ29yeSB7XG4gIHBhdGhUb0FyciA6IHN0cmluZ1xufVxuXG5mdW5jdGlvbiBhdExlYXN0T25lSXNBcnJheU11bHQoIHJlY29yZHM6IGFueVtdLCBwYXRoOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHBhdGguaW5kZXhPZignLicpIDwgMCAmJiByZWNvcmRzLnNvbWUoIHIgPT4gXy5pc0FycmF5KHJbcGF0aF0pICYmIHJbcGF0aF0ubGVuZ3RoID4gMSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0UGF0aHMocHJldiA6IHN0cmluZ1tdLCBtYXRjaDogYW55KSB7XG4gIGlmKCBtYXRjaFtcIiRldmFsXCJdICkge1xuICAgIHZhciBwYXRoID0gbWF0Y2hbXCIkZXZhbFwiXTsgXG4gICAgaWYgKCBwYXRoLmluZGV4T2YoXCIuXCIpPCAwKSB7XG4gICAgICBwcmV2LnB1c2gocGF0aCk7XG4gICAgfVxuICAgIHJldHVybiBwcmV2O1xuICB9XG4gIGlmICggXy5pc0FycmF5KG1hdGNoKSApIHtcbiAgICB2YXIgciA9IHByZXY7XG4gICAgbWF0Y2guZm9yRWFjaCggbSA9PiB7IHIgPSBjb2xsZWN0UGF0aHMocixtKX0pO1xuICAgIHJldHVybiByO1xuICB9IFxuICBpZiAoIHR5cGVvZiBtYXRjaCA9PSBcIm9iamVjdFwiKSB7XG4gICAgdmFyIHIgPSBwcmV2O1xuICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG1hdGNoKS5mb3JFYWNoKCAgcG4gPT4ge1xuICAgICAgciA9IGNvbGxlY3RQYXRocyhyLG1hdGNoW3BuXSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgcmV0dXJuIHByZXY7XG59XG4gIFxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RSZWxldmFudENhdGVnb3JpZXNXaXRoU2luZ2xlQXJyYXlPblBhdGgoIHJlY29yZHM6IGFueVtdLCBtYXRjaDogYW55KSA6IFJlbGV2YW50QXJyQ2F0ZWdvcnlbXSB7XG4gIC8vIHdlIG9ubHkgc3VwcG9ydCBcInRyaXZpYWwgY2F0ZWdvcmllcywgZm9yIG5vdywgbm90IGRlZXAgb25lc1wiXG4gIHZhciBtYXRjaFBhdGhzID0gXy51bmlxKGNvbGxlY3RQYXRocyhbXSxtYXRjaCkpO1xuICAvLyAxKSB3ZSBjb2xsZWN0IGFsbCBldmFsdXRpb24gcGF0aCAgIFhYWFhYWFhYXG4gIC8vIHRoZW4gd2UgYW5hbHlzZSBhIHJlY29yZCB3aGV0aGVyIGl0IGlzIGFycmF5LWlzaFxuICByZXR1cm4gbWF0Y2hQYXRocy5maWx0ZXIoIHBhdGggPT5cbiAgICAgICAgICAgICBhdExlYXN0T25lSXNBcnJheU11bHQocmVjb3JkcyxwYXRoKSkubWFwKCBwYXRoID0+eyB2YXIgcmVzID0geyBcInBhdGhUb0FyclwiOiBwYXRofSBhcyBSZWxldmFudEFyckNhdGVnb3J5OyByZXR1cm4gcmVzfSk7XG59XG5cbi8qKlxuICogVGhpcyBzdGVwIGFwcGx5IG1hdGNoIGNvbmRpdGlvbnMgb24gcmVjb3JkcywgcHJ1bmluZyBub24tZml0dGluZyBhcnJheSBtZW1iZXJzIG9uIHRoZSByZXN1bHQgc3RyZWFtXG4gKiBcbiAqIEEgY29tcGxldGUgaW1wbGVtZW50YXRpb24gd291bGQgaGF2ZSB0byBkZW5vcm1hbGl6ZSB0aGUgdHVwbGVzLCB0aGVuIGFwcGx5IHRoZSBmaWx0ZXJzIChpZ25vcmluZyBtb3JlIHRoYW4gY291bnQgeCBjb25kaXRpb25zKSwgXG4gKiB0aGVuIHJlY29tYmluZSB0aGVtIGludG8gXCJ1bmlxdWVcIiBhcnJheXNcbiAqIHRoaXMgaXMgY3VycmVubHR5IG5vdCBpbXBsZW1lbnRlZCBcbiAqICBcbiAqIEBwYXJhbSByZWNvcmRzIFxuICogQHBhcmFtIG1hdGNoIFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlNYXRjaEFzRmlsdGVyKHJlY29yZHM6YW55W10sIG1hdGNoOiBhbnkpIDogYW55W10ge1xuICB2YXIgbDE9IHJlY29yZHMubGVuZ3RoO1xuICB2YXIgcmVsZXZhbnRDYXRlZ29yaWVzID0gY29sbGVjdFJlbGV2YW50Q2F0ZWdvcmllc1dpdGhTaW5nbGVBcnJheU9uUGF0aChyZWNvcmRzLCBtYXRjaCk7XG4gIGlmICggcmVsZXZhbnRDYXRlZ29yaWVzLmxlbmd0aCA9PSAwKSB7XG4gICAgcmV0dXJuIHJlY29yZHM7XG4gIH1cbiAgdmFyIHJlcyA9IHJlY29yZHMubWFwKCByZWMgPT4ge1xuICAgIC8vIGl0ZXJhdGUgb3ZlciBlYWNoIHJlbGV2YW50IHByb3BlcnR5LFxuICAgIHZhciByY0Nsb25lID0gXy5jbG9uZURlZXAocmVjKTtcbiAgICByZWxldmFudENhdGVnb3JpZXMuZm9yRWFjaCggcmVsY2F0ID0+IHtcbiAgICAgIGlmICggXy5pc0FycmF5KHJlY1tyZWxjYXQucGF0aFRvQXJyXSkpIHtcbiAgICAgICAgdmFyIHJjT25lID0gXy5jbG9uZURlZXAocmVjKTtcbiAgICAgICAgcmNDbG9uZVtyZWxjYXQucGF0aFRvQXJyXSA9IHJjQ2xvbmVbcmVsY2F0LnBhdGhUb0Fycl0uZmlsdGVyKFxuICAgICAgICAgIGFyck1lbSA9PiB7XG4gICAgICAgICAgICAvLyBjb25zdHJ1Y3QgYSBjbG9uZSB3aXRoIHRoZSBzaW5nbGUgbWVtYmVyIHNldFxuICAgICAgICAgICAgcmNPbmVbcmVsY2F0LnBhdGhUb0Fycl0gPSBbYXJyTWVtXTtcbiAgICAgICAgICAgIHJldHVybiBzYXRpc2ZpZXNNYXRjaChyY09uZSwgbWF0Y2gsIHRydWUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIG5vdGhpZ24gdG8gZmlsdGVyIFxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJjQ2xvbmU7XG4gIH0pO1xuICBkZWJ1Z2xvZygnIGFwcGxpZWQgbWF0Y2ggJyArIHJlcy5sZW5ndGggKyBcIi9cIiArIGwxICk7XG4gIHJldHVybiByZXM7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5UHJvamVjdE9ubHkocmVjb3JkczphbnlbXSwgcHJvamVjdDogYW55KSA6IGFueVtdIHtcbiAgdmFyIHJlcyA9IFtdO1xuICB2YXIgbGVuID0gcmVjb3Jkcy5sZW5ndGg7IFxuICByZWNvcmRzLmZvckVhY2goKHJlYyxpbmRleCkgPT57XG4gICAgaWYoaW5kZXggJSAyMDAgPT0gMTApIHtcbiAgICAgIGNvbnNvbGUubG9nKCcnICsgaW5kZXggKyBcIi9cIiArIGxlbiArIFwiIFwiICsgcmVzLmxlbmd0aCk7XG4gICAgfVxuICAgIHJlcyA9IGFwcGx5UHJvamVjdENvbGxlY3RpbmcocmVzLHJlYyxwcm9qZWN0LHt9KVxuICB9KTtcbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBcbiAqIEBwYXJhbSByZWNvcmRzIFxuICogQHBhcmFtIHByb2plY3QgXG4gKiBAcGFyYW0ga2VlcEFzQXJyYXkgIG1lbWJlcnMgKCBrZXlzIG9mIHByb2plY3QhICkgYXJlIGRpcmVjdGx5IGNvbGxlY3RlZCBhcyBhcnJheSBhbmQgbm90IHRvLW4tZXhwYW5kZWQsIFxuICogc28gIFt7YSA6MSwgYjpcIkIxXCIgfSx7YToyLCBiOlwiQjJcIn1dICwgY1sgXCJDMVwiLCBcIkMyXCIgXSBcbiAqIHdpbGwgYmVjb21lICBhOiBbMSwyXSwgYjogW1wiQjFcIiwgQjJdLCBjOiBbXCJDMVwiICwgXCJDMlwiXSBpZiAgW1wiYVwiLFwiYlwiLFwiY1wiXSBpcyBwYXNzZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5UHJvamVjdChyZWNvcmRzOmFueVtdLCBwcm9qZWN0OiBhbnksIGtlZXBBc0FycmF5IDogc3RyaW5nW10pIDogYW55W10ge1xuICAvLyAxKSBjb2xsZWN0IGFsbCBrZWVwYXNhcnJheSBkaXJlY3RseSwgXG4gIHZhciBzcGxpdEtlZXBBc0FycmF5UGF0aHMgPSB7fTtcbiAga2VlcEFzQXJyYXkuZm9yRWFjaCggayA9PiB7XG4gICAgc3BsaXRLZWVwQXNBcnJheVBhdGhzW2tdID0gcHJvamVjdFtrXS5zcGxpdCgnLicpO1xuICB9KTtcbiAgdmFyIHJlY0ZpeGVkID0gcmVjb3JkcztcbiAgaWYoIGtlZXBBc0FycmF5Lmxlbmd0aCkge1xuICAgIGNvbnNvbGUubG9nKFwiIGtlZXAgZml4ZWRcIiArIEpTT04uc3RyaW5naWZ5KGtlZXBBc0FycmF5TWFwKSk7XG4gICAgcmVjRml4ZWQgPSByZWNvcmRzLm1hcCggciA9PiB7XG4gICAgICB2YXIgcmZpeCA9IF8uY2xvbmUocik7XG4gICAgICBrZWVwQXNBcnJheS5mb3JFYWNoKCBwID0+IHtcbiAgICAgICAgcmZpeFtwXSA9IE1vbmdvTWFwLmNvbGxlY3RNZW1iZXJCeVBhdGgociwgc3BsaXRLZWVwQXNBcnJheVBhdGhzW3BdKTsgICAgICBcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJmaXg7XG4gICAgfSk7XG4gIH1cbiAgXG4gIHZhciBuZXdwcm9qZWN0ID0gXy5jbG9uZShwcm9qZWN0KTtcbiAgdmFyIGtlZXBBc0FycmF5TWFwID0ge307XG4gIGtlZXBBc0FycmF5LmZvckVhY2goIGsgPT4ge1xuICAgIG5ld3Byb2plY3Rba10gPSBrO1xuICAgIGtlZXBBc0FycmF5TWFwW2tdID0gMTtcbiAgfSk7XG4gIHZhciByZXMgPSBbXTtcbiAgdmFyIGxlbiA9IHJlY29yZHMubGVuZ3RoOyBcbiAgcmVjRml4ZWQuZm9yRWFjaCgocmVjLGluZGV4KSA9PntcbiAgICBpZihpbmRleCAlIDIwMCA9PSAxMCkge1xuICAgICAgY29uc29sZS5sb2coJycgKyBpbmRleCArIFwiL1wiICsgbGVuICsgXCIgXCIgKyByZXMubGVuZ3RoKTtcbiAgICB9XG4gICAgcmVzID0gYXBwbHlQcm9qZWN0Q29sbGVjdGluZyhyZXMscmVjLG5ld3Byb2plY3QsIGtlZXBBc0FycmF5TWFwKVxuICB9KTtcbiAgcmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlclByb2plY3QocHJvamVjdDogYW55LCBwcmVmaXg6IHN0cmluZykge1xuICB2YXIgcmVzID0ge307XG4gIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHByb2plY3QpLmZvckVhY2goIHBuID0+IHtcbiAgICBpZiggKFwiXCIrIHByb2plY3RbcG5dKS5zdGFydHNXaXRoKHByZWZpeCArIFwiLlwiKSApIHtcbiAgICAgIHJlc1twbl0gPSBwcm9qZWN0W3BuXS5zdWJzdHIocHJlZml4Lmxlbmd0aCArIDEpXG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyYXBBcnJheShhIDogYW55KSA6IGFueVtdIHtcbiAgaWYgKCBfLmlzQXJyYXkoYSkpIHtcbiAgICByZXR1cm4gYTtcbiAgfVxuICByZXR1cm4gW2FdO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNvcHlBbGxCdXQocmVjOiBhbnkgLCByZW1vdmVkUHJvcGVydGllczogc3RyaW5nW10pIHtcbiAgdmFyIHJlcyA9IHt9O1xuICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhyZWMpLmZpbHRlciggcG4gPT4gcmVtb3ZlZFByb3BlcnRpZXMuaW5kZXhPZihwbikgPCAwKS5mb3JFYWNoKCBwbiA9PiBcbiAgICByZXNbcG5dID0gcmVjW3BuXVxuICApO1xuICByZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmxhdHRlbkRlZXAoIHJlYyA6IGFueSwgY29tcGFjdCA6IHN0cmluZ1tdKSA6IGFueVtdIHtcbiAgdmFyIHJlcyA9IFtjb3B5QWxsQnV0KHJlYyxjb21wYWN0KV07XG4gIC8vIHdlIGNvbnN0cnVjdCB0aGUgbmV3IHJlY29yZHMgXG4gIGNvbXBhY3QuZm9yRWFjaCggYyA9PiB7ICBcbiAgICB2YXIgbmV4dCA9IFtdO1xuICAgIHJlcy5mb3JFYWNoKCBiYXNlID0+IHtcbiAgICAgIC8vIGNvcHkgYWxsIHByb3BlcnRpZXMgZnJvbSByZXNbY10gaW50byBlYWNoIGJhc2U7IFxuICAgICAgYXNzZXJ0KF8uaXNBcnJheShyZWNbY10pKTsgLy8gd2hhdCBpZiB0aGlzIGlzIGVtcHR5P1xuICAgICAgcmVjW2NdLmZvckVhY2goIG9iaiA9PiB7XG4gICAgICAgIGlmICggdHlwZW9mIG9iaiA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgdmFyIG5iID0gXy5jbG9uZShiYXNlKTtcbiAgICAgICAgICBPYmplY3QuYXNzaWduKG5iLG9iaik7XG4gICAgICAgICAgbmV4dC5wdXNoKG5iKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgbmIgPSBfLmNsb25lKGJhc2UpO1xuICAgICAgICAgIG5iW2NdID0gb2JqO1xuICAgICAgICAgIG5leHQucHVzaChuYik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJlcyA9IG5leHQ7XG4gIH0pO1xuICByZXR1cm4gcmVzO1xufVxuXG4gZXhwb3J0IGZ1bmN0aW9uIGFwcGx5UHJvamVjdENvbGxlY3RpbmcocmVzOmFueVtdLCByZWM6YW55LCBwcm9qZWN0OiBhbnksIGtlZXBBc0FycmF5TWFwIDogYW55KTogYW55W10ge1xuICAvLyAxKSByZXRyaWV2ZSBvbmx5IG1lbWJlcnMgcGFydCBvZiB0aGUgcHJvamVjdCwgZmxhdHRlbmluZyB0aGUgcmVjb3JkcyBpbiB0aGUgcHJvY2Vzc1xuICB2YXIgZmllbGRzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocHJvamVjdCk7XG4gIHZhciBzZWVuID0ge307XG4gIHZhciBjb21wYWN0ID0gW107XG4gIC8vIDEpIHdlIGV4cGFuZCBhbGwgY29sbGluZWFyIGludG8gYW4gYXJyYXkgWyByZWdhcmRsZXNzIG9mIG9yaWdpbl0gIGNvbnN0cnVjdCBhIHsgZSA6IHgsICBfY2F0ZWdvcmllcyA6IFsgeyB4IDogYSwgYiA6IFsgeyB4OiBhLCBiOiBhfSB9IF19XG4gIHZhciB0bXBsID0ge307XG4gIGZpZWxkcy5mb3JFYWNoKCBmID0+IHtcbiAgICBpZiAoICFzZWVuW2ZdKSB7XG4gICAgICB2YXIgZnVsbHBhdGggPSAocHJvamVjdFtmXSA9PSAxKT8gIGYgOiBwcm9qZWN0W2ZdO1xuICAgICAgdmFyIHBhdGggPSBmdWxscGF0aC5zcGxpdChcIi5cIik7XG4gICAgICBpZiAoIHBhdGgubGVuZ3RoID09IDEpIHtcbiAgICAgICAgaWYgKCBfLmlzQXJyYXkocmVjW2Z1bGxwYXRoXSkgJiYga2VlcEFzQXJyYXlNYXBbZl0pIHtcbiAgICAgICAgICAvLyBrZWVwIGFycmF5IVxuICAgICAgICAgIHRtcGxbcGF0aF0gPSByZWNbZnVsbHBhdGhdO1xuICAgICAgICB9IGVsc2UgaWYgKCBfLmlzQXJyYXkocmVjW2Z1bGxwYXRoXSkpIHtcbiAgICAgICAgICBjb21wYWN0LnB1c2goZnVsbHBhdGgpXG4gICAgICAgICAgdG1wbFtmXSA9IHJlY1tmdWxscGF0aF07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2UgaWYgKCB0eXBlb2YgcmVjW2Z1bGxwYXRoXSA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgLy8gdGhpcyBjYW5ub3QgYmUsIFxuICAgICAgICAgIHRocm93IFwiVW5hYmxlIHRvIGV4dHJhY3QgbWVtYmVyIFwiICsgZnVsbHBhdGggKyBcIiBmcm9tIFwiICsgSlNPTi5zdHJpbmdpZnkocmVzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0bXBsW3BhdGhdID0gcmVjW2Z1bGxwYXRoXTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGNvbGxlY3QgcHJlZml4ZSBzZXQsIGNyZWF0ZSBwc2V1ZG8gcHJvamVjdGlvbiBmcm9tIGl0LiBcbiAgICAgICAgdmFyIHByZWZpeCA9IHBhdGhbMF07XG4gICAgICAgIGNvbXBhY3QucHVzaChwcmVmaXgpO1xuICAgICAgICB2YXIgcHJvalN1ZmZpeCA9IGZpbHRlclByb2plY3QocHJvamVjdCxwcmVmaXgpO1xuICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhwcm9qU3VmZml4KS5mb3JFYWNoKCBhPT4gc2VlblthXSA9IDEpO1xuICAgICAgICB2YXIgbG9jYWxFeHBhbmQgPSBhcHBseVByb2plY3RPbmx5KHdyYXBBcnJheShyZWNbcHJlZml4XSksIHByb2pTdWZmaXgpO1xuICAgICAgICB0bXBsW3ByZWZpeF0gPSBsb2NhbEV4cGFuZDtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICB2YXIgYXVnID0gZmxhdHRlbkRlZXAodG1wbCwgY29tcGFjdCk7XG4gIHJldHVybiByZXMuY29uY2F0KGF1Zyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0RlZXAoYTphbnkpIHtcbiAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGEpLnNvbWUoIHAgPT4gXy5pc09iamVjdChhW3BdKSB8fCBfLmlzQXJyYXkoYVtwXSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFrZUtleShhKSAgOiBzdHJpbmcge1xuICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoYSkubWFwKCBrID0+ICcnKyAoYVtrXSB8fCAnJykpLmpvaW4oJ19fJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0FsbFByb3BzRW1wdHkocyA6IHN0cmluZykge1xuICByZXR1cm4gcy5zZWFyY2goL1teX10vKSA8IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVEdXBsaWNhdGVzKHJlY29yZHM6IGFueVtdKSB7XG4gIHZhciBzZWVuID0ge307XG4gIHJldHVybiByZWNvcmRzLmZpbHRlciggYSA9PiB7IHZhciBzID0gbWFrZUtleShhKTsgdmFyIHJlcyA9IGlzRGVlcChhKSB8fCAoIWlzQWxsUHJvcHNFbXB0eShzKSAmJiAhc2VlbltzXSk7IHNlZW5bc10gPSAxOyByZXR1cm4gcmVzOyB9KTtcbn1cblxuXG4vKipcbiAqIGlmIG1lbWJlciBvZiB1bndpbmQgcG9pbnRzIHRvIGFuIGFycmF5LCBleHBhbmQgaXQuIFxuICogQHBhcmFtIHJlY29yZHMgSSBcbiAqIEBwYXJhbSB1bndpbmQgXG4gKiBAcGFyYW0gYW55IFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlVbndpbmQocmVjb3JkczphbnlbXSwgdW53aW5kIDogYW55KSA6IGFueVtdIHtcbiAgdmFyIHJlcyA9IFtdO1xuICB2YXIgcHJvcCA9IHVud2luZC5wYXRoO1xuICByZWNvcmRzLmZvckVhY2goIHIgPT4ge1xuICAgIGlmICggXy5pc0FycmF5KHJbcHJvcF0pICYmIHJbcHJvcF0ubGVuZ3RoID4gMCApIHtcbiAgICAgIHJbcHJvcF0uZm9yRWFjaCggZWwgPT4ge1xuICAgICAgICB2YXIgcmMgPSBfLmNsb25lRGVlcChyKTtcbiAgICAgICAgcmNbcHJvcF0gPSBlbDtcbiAgICAgICAgcmVzLnB1c2gocmMpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcy5wdXNoKHIpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVNvcnQocmVjb3JkczphbnlbXSwgbWF0Y2g6IGFueSkgOiBhbnlbXSB7XG4gIHZhciBwcm9wcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG1hdGNoKTtcbiAgcmVjb3Jkcy5zb3J0KCAoYSxiKSA9PiB7IFxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIGZhYyA9IDE7XG4gICAgICBpZiAoIG1hdGNoW3Byb3BzW2ldXSA9PSAtMSkge1xuICAgICAgICBmYWMgPSAtMTtcbiAgICAgIH1cbiAgICAgIHZhciBsaHMgPSBhW3Byb3BzW2ldXTtcbiAgICAgIHZhciByaHMgPSBiW3Byb3BzW2ldXTtcbiAgICAgIGlmKCBsaHMgPiByaHMpIHtcbiAgICAgICAgcmV0dXJuICtmYWM7XG4gICAgICB9IGVsc2UgaWYgKCBsaHMgPCByaHMgKSB7XG4gICAgICAgIHJldHVybiAtZmFjO1xuICAgICAgfSBlbHNlIGlmICggbGhzID09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgcmV0dXJuICtmYWM7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAwO1xuICAgfSk7XG4gIHJldHVybiByZWNvcmRzOyBcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdGVwKHJlY29yZHM6YW55W10sIHF1ZXJ5U3RlcDogYW55KSA6IGFueVtdIHtcbiAgZGVidWdnZXI7XG4gIGlmKCBxdWVyeVN0ZXBbXCIkbWF0Y2hcIl0pIHtcbiAgICB2YXIgciA9IGFwcGx5TWF0Y2gocmVjb3JkcywgcXVlcnlTdGVwW1wiJG1hdGNoXCJdKVxuICAgIHJldHVybiBhcHBseU1hdGNoQXNGaWx0ZXIociwgcXVlcnlTdGVwW1wiJG1hdGNoXCJdKTtcbiAgfSBlbHNlIGlmICggcXVlcnlTdGVwW1wiJHByb2plY3RcIl0pIHtcbiAgICByZXR1cm4gYXBwbHlQcm9qZWN0KHJlY29yZHMsIHF1ZXJ5U3RlcFtcIiRwcm9qZWN0XCJdLCBxdWVyeVN0ZXBbXCIka2VlcEFzQXJyYXlcIl0gfHwgW10pOyAgICBcbiAgfSBlbHNlIGlmICggcXVlcnlTdGVwW1wiJHNvcnRcIl0gKSB7XG4gICAgcmV0dXJuIGFwcGx5U29ydChyZWNvcmRzLCBxdWVyeVN0ZXBbXCIkc29ydFwiXSk7XG4gIH0gZWxzZSBpZiAoIHF1ZXJ5U3RlcFtcIiR1bndpbmRcIl0gKSB7XG4gICAgcmV0dXJuIGFwcGx5VW53aW5kKHJlY29yZHMsIHF1ZXJ5U3RlcFtcIiR1bndpbmRcIl0pO1xuICB9IFxuICBlbHNlIGlmICggcXVlcnlTdGVwW1wiJGdyb3VwXCJdIHx8IHF1ZXJ5U3RlcFtcIiR1bndpbmRcIl0gKXtcbiAgICByZXR1cm4gcmVjb3JkcztcbiAgfVxuICBjb25zb2xlLmxvZygndW5rbm93biBzdGVwICcgKyBKU09OLnN0cmluZ2lmeShxdWVyeVN0ZXApKTtcbiAgcmV0dXJuIHJlY29yZHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJCeVF1ZXJ5KHJlY29yZHM6YW55W10sIHF1ZXJ5OiBhbnkpOiBhbnlbXSB7XG4gIHZhciByZXMgPSByZWNvcmRzO1xuICBkZWJ1Z2dlcjtcbiAgcXVlcnkuZm9yRWFjaCggcWNvbXAgPT4geyByZXMgPSBhcHBseVN0ZXAocmVzLHFjb21wKX0pO1xuICByZXR1cm4gcmVtb3ZlRHVwbGljYXRlcyhyZXMpO1xufVxuXG5cbmNsYXNzIEFQc2V1ZG9Nb2RlbCBpbXBsZW1lbnRzIElQc2V1ZG9Nb2RlbCB7XG4gIG1vZGVsbmFtZSA6IHN0cmluZztcbiAgcmVjb3JkcyA6IGFueVtdO1xuICBzY2hlbWEgOiBhbnk7XG4gIGNvbnN0cnVjdG9yKCBtb2RlbE5hbWUgOiBzdHJpbmcsIHJlY29yZHM6IGFueVtdLCBzY2hlbWEgOiBhbnkpIHtcbiAgICB0aGlzLm1vZGVsbmFtZSA9IG1vZGVsTmFtZTsgXG4gICAgdGhpcy5yZWNvcmRzID0gcmVjb3JkczsgXG4gICAgdGhpcy5zY2hlbWEgPSBzY2hlbWE7XG4gIH1cbiAgYWdncmVnYXRlU3lub255bXMoKSA6IFByb21pc2U8SVN5bm9ueW1bXT4ge1xuICAgIHZhciBzZWxmID0gdGhpcztcbi8qXG4gICAgXCJfc3lub255bXNcIiA6IFtcbiAgICAgIHsgXCJjYXRlZ29yeVwiIDogXCJvYmplY3QgbmFtZVwiLFxuICAgICAgICBcImZhY3RcIiA6IFwiZWFydGhcIixcbiAgICAgICAgXCJzeW5vbnltc1wiIDogWyBcImJsdWUgcGxhbmV0XCIgLCBcImdhaWFcIl1cbiAgICAgIH0sXG4gICAgICB7IFwiY2F0ZWdvcnlcIiA6IFwib3JiaXRzXCIsXG4gICAgICAgIFwiZmFjdFwiIDogXCJTdW5cIixcbiAgICAgICAgXCJzeW5vbnltc1wiIDogWyBcIlNvbFwiXVxuICAgICAgfVxuICAgICAgKi9cbiAgICB2YXIgcmVzID0gW10gYXMgSVN5bm9ueW1bXTtcbiAgICBzZWxmLnJlY29yZHMuZm9yRWFjaCggcmVjID0+IHtcbiAgICAgICAgdmFyIHN5biA9IE1vbmdvTWFwLmdldE1lbWJlckJ5UGF0aChyZWMsW1wiX3N5bm9ueW1zXCJdKTtcbiAgICAgICAgaWYgKCBzeW4gKSB7XG4gICAgICAgICAgcmVzID0gcmVzLmNvbmNhdChzeW4pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgZGVidWdsb2coJyBmb3VuZCAnICsgcmVzLmxlbmd0aCArICcgc3lub255bXMgZm9yICcgKyB0aGlzLm1vZGVsbmFtZSk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPElTeW5vbnltW10+KCAocmVzb2x2ZSxyZWplY3QpID0+IHsgcmVzb2x2ZShyZXMpfSk7ICAgIFxuICB9XG4gIGRpc3RpbmN0RmxhdCggbW9kZWxQYXRoIDogSU1vZGVsUGF0aCApIDogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHZhciBvID0ge307XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMucmVjb3Jkcy5mb3JFYWNoKCByZWMgPT4gXG4gICAgICB7IHZhciByID0gTW9uZ29NYXAuZ2V0TWVtYmVyQnlQYXRoKHJlYywgbW9kZWxQYXRoLnBhdGhzKTtcbiAgICAgICAgaWYoXy5pc0FycmF5KHIpKSB7XG4gICAgICAgICAgci5mb3JFYWNoKCBrID0+IG9ba10gPSBrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoIHIgKSB7XG4gICAgICAgICAgICBvW3JdID0gcjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIHZhciByZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhvKS5tYXAoIChrKSA9PiBvW2tdKS5zb3J0KCk7XG4gICAgcmV0dXJuIGFzUHJvbWlzZShyZXMpO1xuICB9XG4gIGRpc3RpbmN0KCBwYXRoIDogc3RyaW5nKSA6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHN0cmluZ1tdPiggKHJlc29sdmUscmVqZWN0KSA9PiB7XG4gICAgICB2YXIgbyA9IHt9O1xuICAgICAgLy8gVE9ETzogbm90IG9ubHkgZGlyZWN0IHByb3BcbiAgICAgIHNlbGYucmVjb3Jkcy5mb3JFYWNoKCBhID0+IGNvbnNvbGUubG9nKFwiaGVyZSBvbmUgXCIgKyBhW3BhdGhdKSk7XG4gICAgICBzZWxmLnJlY29yZHMuZm9yRWFjaCggYSA9PiB7IFxuICAgICAgICB2YXIgdSA9IGFbcGF0aF07XG4gICAgICAgIGlmKCBfLmlzQXJyYXkodSkpIHtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9bYVtwYXRoXV0gPSBhW3BhdGhdOyBcbiAgICAgICAgfVxuICAgICAgXG4gICAgICB9KTtcbiAgICAgIHJlc29sdmUoT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMobykubWFwKCAoaykgPT4gb1trXSkuc29ydCgpKTtcbiAgICB9KTsgICAgXG4gIH1cbiAgZmluZChxdWVyeTogYW55KSA6IFByb21pc2U8YW55W10+IHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKCBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhxdWVyeSkubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxJU3lub255bVtdPiggKHJlc29sdmUscmVqZWN0KSA9PiB7IHJlc29sdmUoc2VsZi5yZWNvcmRzKX0pOyAgICBcbiAgICB9XG4gICAgY29uc29sZS5sb2coXCJmaW5kIFwiICsgSlNPTi5zdHJpbmdpZnkocXVlcnkpKTtcbiAgICB0aHJvdyBcIkZpbmQgXCIgKyBKU09OLnN0cmluZ2lmeShxdWVyeSk7XG4gIH1cbiAgYWdncmVnYXRlKHF1ZXJ5IDogYW55KSA6IFByb21pc2U8YW55W10+IHtcbiAgICBkZWJ1Z2xvZyhcIkFnZ3JlZ2F0ZSBcIiArIEpTT04uc3RyaW5naWZ5KHF1ZXJ5KSk7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciByZXMgPSBmaWx0ZXJCeVF1ZXJ5KHNlbGYucmVjb3JkcyxxdWVyeSk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPElTeW5vbnltW10+KCAocmVzb2x2ZSxyZWplY3QpID0+IHsgcmVzb2x2ZShyZXMpfSk7ICAgIFxuICB9XG59XG5cbmNsYXNzIEFTcmNIYW5kbGUgaW1wbGVtZW50cyBJU3JjSGFuZGxlIHtcbiAgX21vZGVsTmFtZXMgOiBzdHJpbmdbXTtcbiAgX3BzZXVkb01vZGVscyA6IE1hcDxTdHJpbmcsSVBzZXVkb01vZGVsPjtcbiAgLy9uYW1lOiBzdHJpbmc7XG4gIHBhdGggOiBzdHJpbmc7XG4gIGNvbnN0cnVjdG9yKHBhdGg6IHN0cmluZykge1xuICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgaWYoICF0aGlzLnBhdGguZW5kc1dpdGgoJy8nKSkge1xuICAgICAgdGhpcy5wYXRoID0gdGhpcy5wYXRoICsgJy8nO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZygnIHRoaXMgaXMgdGhlIHBhdGgnICsgcGF0aCk7XG4gICAgdGhpcy5fcHNldWRvTW9kZWxzID0ge30gYXMgTWFwPFN0cmluZyxJUHNldWRvTW9kZWw+OyBcbiAgfVxuICBtb2RlbE5hbWVzKCkgOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMuX21vZGVsTmFtZXM7XG4gIH1cbiAgZ2V0UGF0aCgpIDogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5wYXRoO1xuICB9XG4gIG1vZGVsKCBuYW1lIDogc3RyaW5nICkgOiBJUHNldWRvTW9kZWwge1xuICAgIHJldHVybiB0aGlzLl9wc2V1ZG9Nb2RlbHNbbmFtZV07XG4gIH1cbiAgc2V0TW9kZWwobW9kZWxOYW1lIDogc3RyaW5nICwgcmVjb3JkcyA6YW55LCBzY2hlbWEgOiBhbnkpIHtcbiAgICBkZWJ1Z2xvZyhcIlNldHRpbmcgbW9kZWwgXCIgKyBtb2RlbE5hbWUgKyBcIiB3aXRoIFwiICsgcmVjb3Jkcy5sZW5ndGggKyBcIiByZWNvcmRzIFwiKTtcbiAgICB0aGlzLl9wc2V1ZG9Nb2RlbHNbbW9kZWxOYW1lXSA9IG5ldyBBUHNldWRvTW9kZWwobW9kZWxOYW1lLCByZWNvcmRzLCBzY2hlbWEpOyBcbiAgfVxuICBjb25uZWN0KCBtb2RlbFBhdGggOiBzdHJpbmcgKSA6IFByb21pc2U8SVNyY0hhbmRsZT4ge1xuICAgIHRoaXMucGF0aCA9IG1vZGVsUGF0aDtcbiAgICBpZiggIXRoaXMucGF0aC5lbmRzV2l0aCgnLycpKSB7XG4gICAgICB0aGlzLnBhdGggPSB0aGlzLnBhdGggKyAnLyc7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCcgdGhpcyBpcyB0aGUgcGF0aCcgKyB0aGlzLnBhdGgpO1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gbmV3IFByb21pc2U8SVNyY0hhbmRsZT4oIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGZzLnJlYWRGaWxlKCB0aGlzLnBhdGggKyBcIm1vZGVscy5qc29uXCIsIChlcnIsIGJ1ZmZlciApID0+IHtcbiAgICAgICAgaWYgKCBlcnIgKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cbiAgICAgICBzZWxmLl9tb2RlbE5hbWVzID0gSlNPTi5wYXJzZShidWZmZXIudG9TdHJpbmcoJ3V0Zi04JykpIGFzIGFueTsgXG4gICAgICAgIGRlYnVnbG9nKFwiUmVhZCBtb2RlbG5hbWVzIFwiICsgSlNPTi5zdHJpbmdpZnkoIHNlbGYuX21vZGVsTmFtZXMpICsgXCIgdGhpcy5wYXRoID1cIiArIHNlbGYucGF0aCk7XG4gICAgICAgIHJlc29sdmUoc2VsZik7XG4gICAgICB9KVxuICAgIH0pO1xuICB9XG4gIGdldEpTT04oZmlsZW5hbWUgOiBzdHJpbmcpIDogUHJvbWlzZTxhbnk+IHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGZ1bGxmaWxlID0gdGhpcy5wYXRoICsgZmlsZW5hbWU7XG4gICAgLy9jb25zb2xlLmxvZygnIHJlYWQgZmlsZSAnICsgZnVsbGZpbGUpO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxhbnk+KCAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBmcy5yZWFkRmlsZSggZnVsbGZpbGUsIChlcnIsIGJ1ZmZlciApID0+IHtcbiAgICAgICAgaWYgKCBlcnIgKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZnVsbGZpbGUgKyBlcnIpO1xuICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGF0YSA9IEpTT04ucGFyc2UoYnVmZmVyLnRvU3RyaW5nKCd1dGYtOCcpKSBhcyBhbnk7IFxuICAgICAgICByZXNvbHZlKGRhdGEpO1xuICAgICAgfSlcbiAgICB9KTtcbiAgfVxuICBnZXRKU09OQXJyKGZpbGVuYW1lIDogc3RyaW5nICkgOiBQcm9taXNlPGFueVtdPiB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBmdWxsZmlsZSA9IHRoaXMucGF0aCArIGZpbGVuYW1lO1xuICAgIC8vY29uc29sZS5sb2coJyByZWFkIGZpbGUgJyArIGZ1bGxmaWxlKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2U8YW55W10+KCAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBmcy5yZWFkRmlsZSggZnVsbGZpbGUsIChlcnIsIGJ1ZmZlciApID0+IHtcbiAgICAgICAgaWYgKCBlcnIgKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZnVsbGZpbGUpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG4gICAgICAgdmFyIGRhdGEgPSBKU09OLnBhcnNlKGJ1ZmZlci50b1N0cmluZygndXRmLTgnKSkgYXMgYW55OyBcbiAgICAgICAgcmVzb2x2ZShbZGF0YV0pO1xuICAgICAgfSlcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU291cmNlSGFuZGxlKCkgIDogSVNyY0hhbmRsZSB7XG4gIHJldHVybiBuZXcgQVNyY0hhbmRsZShcIlwiKTsgXG59Il19
