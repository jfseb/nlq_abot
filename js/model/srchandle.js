"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSourceHandle = exports.filterByQuery = exports.applyStep = exports.applySort = exports.applyUnwind = exports.removeDuplicates = exports.isAllPropsEmpty = exports.makeKey = exports.isDeep = exports.applyProjectCollecting = exports.flattenDeep = exports.copyAllBut = exports.wrapArray = exports.filterProject = exports.applyProject = exports.applyProjectOnly = exports.applyMatch = exports.satisfiesMatch = exports.evalSet = exports.compareByType = exports.asString = exports.evalArg = void 0;
const fs = require("fs");
const model_1 = require("./model");
const MongoMap = require("./mongomap");
const _ = require("lodash");
//import * as intf from 'constants';
const debugf = require("debugf");
const console_1 = require("console");
var debuglog = debugf('srchandle');
;
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
        var res = MongoMap.collectMemberByPath(rec, str);
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
function satisfiesMatch(rec, match) {
    var props = Object.getOwnPropertyNames(match);
    if (props.length == 0) {
        return true;
    }
    else if (match['$and']) {
        debuglog('found $and');
        return match['$and'].every(cond => satisfiesMatch(rec, cond));
    }
    else if (match['$or']) {
        return match['$or'].any(cond => satisfiesMatch(rec, cond));
    }
    else if (ops.indexOf(Object.getOwnPropertyNames(match)[0]) >= 0) {
        var op = Object.getOwnPropertyNames(match)[0];
        var lhs = evalArg(rec, match[op][0]);
        var rhs = evalArg(rec, match[op][1]);
        debuglog(() => 'rhs ' + JSON.stringify(lhs) + " rhs:" + JSON.stringify(rhs));
        return evalSet(op, lhs, rhs);
    }
    else if (match["$expr"]) {
        return satisfiesMatch(rec, match["$expr"]);
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
    if (queryStep["$match"]) {
        return applyMatch(records, queryStep["$match"]);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QyxDQUFDLENBQUE7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDRCxVQUFVLENBQUMsUUFBaUI7UUFDMUIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2hCLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDO1FBQ3BDLHdDQUF3QztRQUN4QyxPQUFPLElBQUksT0FBTyxDQUFTLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQzdDLEVBQUUsQ0FBQyxRQUFRLENBQUUsUUFBUSxFQUFFLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRyxFQUFFO2dCQUN0QyxJQUFLLEdBQUcsRUFBRztvQkFDVCxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUN0QixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNqQixNQUFNLEdBQUcsQ0FBQztpQkFDWDtnQkFDRixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQVEsQ0FBQztnQkFDdEQsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNsQixDQUFDLENBQUMsQ0FBQTtRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBRUQsU0FBZ0Isa0JBQWtCO0lBQ2hDLE9BQU8sSUFBSSxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDNUIsQ0FBQztBQUZELGdEQUVDIiwiZmlsZSI6Im1vZGVsL3NyY2hhbmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElTeW50YWN0aWNDb250ZW50QXNzaXN0UGF0aCB9IGZyb20gXCJjaGV2cm90YWluXCI7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSBcInVybFwiO1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgeyBhZGRDbG9zZUV4YWN0UmFuZ2VSdWxlcywgYXNQcm9taXNlIH0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCAqIGFzIE1vbmdvTWFwIGZyb20gIFwiLi9tb25nb21hcFwiO1xuaW1wb3J0IHsgYUFueVN1Y2Nlc3Nvck9wZXJhdG9yTmFtZXMsIElNb2RlbFBhdGggfSBmcm9tIFwiLi4vbWF0Y2gvaWZtYXRjaFwiO1xuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuXG4vL2ltcG9ydCAqIGFzIGludGYgZnJvbSAnY29uc3RhbnRzJztcbmltcG9ydCAqIGFzIGRlYnVnZiBmcm9tICdkZWJ1Z2YnO1xuaW1wb3J0IHsgZXZhbHVhdGVSYW5nZVJ1bGVzVG9Qb3NpdGlvbiB9IGZyb20gXCIuLi9tYXRjaC9lcmJhc2VcIjtcbmltcG9ydCB7IFNlbnRlbmNlIH0gZnJvbSBcIi4uL21hdGNoL2VyX2luZGV4XCI7XG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiY29uc29sZVwiO1xuaW1wb3J0IHsgbmV4dFRpY2sgfSBmcm9tIFwicHJvY2Vzc1wiO1xuaW1wb3J0IHsgaXNFbXB0eSB9IGZyb20gXCJsb2Rhc2hcIjtcblxudmFyIGRlYnVnbG9nID0gZGVidWdmKCdzcmNoYW5kbGUnKTtcblxuZXhwb3J0IGludGVyZmFjZSBJU3lub255bSB7XG4gIGNhdGVnb3J5OiBzdHJpbmcsXG4gIGZhY3Q6IHN0cmluZyxcbiAgc3lub255bXM6IHN0cmluZ1tdXG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIElQc2V1ZG9Nb2RlbCB7XG4gIG1vZGVsbmFtZSA6IHN0cmluZyxcbiAgcmVjb3JkcyA6IGFueVtdO1xuICBzY2hlbWEgOiBhbnk7XG4gIGFnZ3JlZ2F0ZVN5bm9ueW1zKCkgOiBQcm9taXNlPElTeW5vbnltW10+O1xuICBkaXN0aW5jdEZsYXQoIG1vZGVsUGF0aCA6IElNb2RlbFBhdGggKSA6IFByb21pc2U8c3RyaW5nW10+O1xuICBkaXN0aW5jdCggcGF0aCA6IHN0cmluZykgOiBQcm9taXNlPHN0cmluZ1tdPjtcbiAgZmluZChxdWVyeTogYW55KSA6IFByb21pc2U8YW55W10+O1xuICBhZ2dyZWdhdGUocXVlcnkgOiBhbnkpIDogUHJvbWlzZTxhbnlbXT47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVBzZXVkb1NjaGVtYSB7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVNyY0hhbmRsZSB7XG4gIG1vZGVsTmFtZXMoKSA6IHN0cmluZ1tdLFxuICBnZXRQYXRoKCkgOiBzdHJpbmcsXG4gIG1vZGVsKGEgOiBzdHJpbmcsIHNjaGVtYT86IGFueSkgOiBJUHNldWRvTW9kZWwsXG4gIHNldE1vZGVsKG1vZGVsbmFtZSA6IHN0cmluZyAsIGRhdGE6YW55LCBzY2hlbWEgOiBhbnkpLFxuICBjb25uZWN0KCBjb25uZWN0aW9uU3RyaW5nIDogc3RyaW5nICkgOiBQcm9taXNlPElTcmNIYW5kbGU+XG4gIGdldEpTT04oIGZpbGVuYW1lIDogc3RyaW5nICwgbW9kZWxuYW1lcz8gOiBzdHJpbmdbXSkgOiBQcm9taXNlPGFueT47XG4gIGdldEpTT05BcnIoIGZpbGVuYW1lIDogc3RyaW5nKSA6IFByb21pc2U8YW55W10+O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXZhbEFyZyhyZWM6IGFueSwgYXJnIDogYW55KSA6IGFueVtdIHtcbiAgaWYgKCBhcmdbJyRldmFsJ10pIHtcbiAgICAvLyBUT0RPIGVsZW1lbnRzXG4gICAgZGVidWdsb2coXCIgcmV0cmlldmUgXCIgKyBhcmdbJyRldmFsJ10gKyAnIGZyb20gJyArIEpTT04uc3RyaW5naWZ5KHJlYykpO1xuICAgIHZhciBzdHIgPSBhcmdbJyRldmFsJ10uc3BsaXQoXCIuXCIpO1xuICAgIHJldHVybiBNb25nb01hcC5jb2xsZWN0TWVtYmVyQnlQYXRoKHJlYywgc3RyKTtcbiAgfSBlbHNlIGlmICggYXJnWyckcmVnZXgnXSkge1xuICAgIHJldHVybiBhcmdbJyRyZWdleCddO1xuICB9IGVsc2UgaWYgKCBhcmdbJyRBUlJBWVNJWkVfT1JfVkFMX09SMSddKSB7XG4gICAgdmFyIHBhdGggPSBhcmdbJyRBUlJBWVNJWkVfT1JfVkFMX09SMSddO1xuICAgIHZhciByZXMgPSBNb25nb01hcC5jb2xsZWN0TWVtYmVyQnlQYXRoKHJlYywgc3RyKTtcbiAgICBpZiggcmVzLmxlbmd0aCAmJiB0eXBlb2YgcmVzWzBdID09IFwibnVtYmVyXCIpIHtcbiAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIHJldHVybiBbcmVzLmxlbmd0aF07XG4gICAgcmV0dXJuIGFyZ1snJHJlZ2V4J107XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIFthcmddO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc1N0cmluZyggYSA6IGFueSkgOiBzdHJpbmcge1xuICByZXR1cm4gXCJcIiArIGE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wYXJlQnlUeXBlKG9wOiBzdHJpbmcsIGwgOiBhbnksIHI6IGFueSkgOiBib29sZWFuIHtcbiAgaWYgKCB0eXBlb2YgciA9PSBcInN0cmluZ1wiKSB7XG4gICAgbCA9IGFzU3RyaW5nKGwpO1xuICB9XG4gIHN3aXRjaChvcCkge1xuICBjYXNlIFwiJGx0XCI6IFxuICAgIHJldHVybiBsIDwgcjtcbiAgY2FzZSBcIiRsdGVcIjpcbiAgICByZXR1cm4gbCA8PSByO1xuICBjYXNlIFwiJGd0XCI6XG4gICAgcmV0dXJuIGwgPiByO1xuICBjYXNlIFwiJGd0ZVwiOlxuICAgIHJldHVybiBsID49IHI7XG4gIGNhc2UgXCIkZXFcIjpcbiAgICByZXR1cm4gbCA9PSByO1xuICBjYXNlIFwiJG5lXCI6XG4gICAgcmV0dXJuIGwgIT0gcjtcbiAgZGVmYXVsdDogXG4gIHRocm93IFwiVW5pbXBsZW1lbnRlZCBvcCBcIiArIG9wO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBldmFsU2V0KG9wIDogc3RyaW5nLCBsaHM6IGFueSwgcmhzOiBhbnkgKSA6IGJvb2xlYW4ge1xuICBzd2l0Y2gob3ApIHtcbiAgY2FzZSBcIiRyZWdleFwiOntcbiAgICBpZiAoIHR5cGVvZiByaHMgPT0gXCJvYmplY3RcIiAmJiAgcmhzLmNvbnN0cnVjdG9yID09IFJlZ0V4cCkge1xuICAgICAgcmV0dXJuIGxocy5zb21lKCBhID0+IHJocy5leGVjKGFzU3RyaW5nKGEpKSk7XG4gICAgfVxuICAgIHRocm93IFwicmhzIGlzIG5vdCBhbiByZWdleHBcIiArIEpTT04uc3RyaW5naWZ5KHJocyk7XG4gIH1cbiAgYnJlYWs7XG4gIGNhc2UgXCIkbHRcIjogXG4gIGNhc2UgXCIkbHRlXCI6XG4gIGNhc2UgXCIkZ3RcIjpcbiAgY2FzZSBcIiRndGVcIjpcbiAgY2FzZSBcIiRlcVwiOlxuICBjYXNlIFwiJG5lXCI6XG4gIHtcbiAgICByZXR1cm4gcmhzLnNvbWUoIHIgPT4gKCBsaHMuc29tZSggbCA9PiAgIGNvbXBhcmVCeVR5cGUob3AsbCxyKSApKSk7XG4gIH1cbiAgYnJlYWs7XG4gIGNhc2UgXCIkZXhpc3RzXCI6IHtcbiAgICBpZiAoIHJoc1swXSA9PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIGxocy5sZW5ndGggPT0gMDtcbiAgICB9XG4gICAgcmV0dXJuIGxocy5sZW5ndGggPiAwO1xuICB9XG4gIGRlZmF1bHQ6IFxuICAgIHRocm93IFwiVW5pbXBsZW1lbnRlZCBvcCBcIiArIG9wO1xuICB9XG59XG5cbnZhciBvcHMgPSBbXCIkbHRcIiwgXCIkZXFcIiwgXCIkbmVcIiwgXCIkbHRlXCIsIFwiJGd0XCIsIFwiJGd0ZVwiLCBcIiRleGlzdHNcIiwgXCIkcmVnZXhcIiBdO1xuXG5leHBvcnQgZnVuY3Rpb24gc2F0aXNmaWVzTWF0Y2gocmVjIDogYW55LCBtYXRjaCA6IGFueSkgOiBib29sZWFuIHtcbiAgdmFyIHByb3BzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMobWF0Y2gpO1xuICBpZihwcm9wcy5sZW5ndGggPT0gMCApe1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYobWF0Y2hbJyRhbmQnXSkge1xuICAgIGRlYnVnbG9nKCdmb3VuZCAkYW5kJyk7XG4gICAgcmV0dXJuIG1hdGNoWyckYW5kJ10uZXZlcnkoIGNvbmQgPT4gc2F0aXNmaWVzTWF0Y2gocmVjLCBjb25kKSk7XG4gIH0gZWxzZSBpZiAobWF0Y2hbJyRvciddKSB7XG4gICAgcmV0dXJuIG1hdGNoWyckb3InXS5hbnkoIGNvbmQgPT4gc2F0aXNmaWVzTWF0Y2gocmVjLCBjb25kKSk7XG4gIH0gZWxzZSBpZiAoIG9wcy5pbmRleE9mKE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG1hdGNoKVswXSkgPj0gMCkge1xuICAgICAgdmFyIG9wID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMobWF0Y2gpWzBdO1xuICAgICAgdmFyIGxocyA9IGV2YWxBcmcocmVjLG1hdGNoW29wXVswXSlcbiAgICAgIHZhciByaHMgPSBldmFsQXJnKHJlYyxtYXRjaFtvcF1bMV0pO1xuICAgICAgZGVidWdsb2coKCkgPT4gJ3JocyAnICsgSlNPTi5zdHJpbmdpZnkobGhzKSArIFwiIHJoczpcIiArIEpTT04uc3RyaW5naWZ5KHJocykpO1xuICAgICAgcmV0dXJuIGV2YWxTZXQob3AsbGhzLHJocyk7XG4gIH0gZWxzZSBpZiAoIG1hdGNoW1wiJGV4cHJcIl0pIHtcbiAgICByZXR1cm4gc2F0aXNmaWVzTWF0Y2gocmVjLG1hdGNoW1wiJGV4cHJcIl0pO1xuICB9XG4gIGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKCd1bmtub3duIG9wICcgKyBKU09OLnN0cmluZ2lmeShtYXRjaCkpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseU1hdGNoKHJlY29yZHM6YW55W10sIG1hdGNoOiBhbnkpIDogYW55W10ge1xuICB2YXIgbDE9IHJlY29yZHMubGVuZ3RoO1xuICB2YXIgcmVzID0gcmVjb3Jkcy5maWx0ZXIoIHJlYyA9PiBzYXRpc2ZpZXNNYXRjaChyZWMgLG1hdGNoKSk7XG4gIGRlYnVnbG9nKCcgYXBwbGllZCBtYXRjaCAnICsgcmVzLmxlbmd0aCArIFwiL1wiICsgbDEgKTtcbiAgcmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5UHJvamVjdE9ubHkocmVjb3JkczphbnlbXSwgcHJvamVjdDogYW55KSA6IGFueVtdIHtcbiAgdmFyIHJlcyA9IFtdO1xuICB2YXIgbGVuID0gcmVjb3Jkcy5sZW5ndGg7IFxuICByZWNvcmRzLmZvckVhY2goKHJlYyxpbmRleCkgPT57XG4gICAgaWYoaW5kZXggJSAyMDAgPT0gMTApIHtcbiAgICAgIGNvbnNvbGUubG9nKCcnICsgaW5kZXggKyBcIi9cIiArIGxlbiArIFwiIFwiICsgcmVzLmxlbmd0aCk7XG4gICAgfVxuICAgIHJlcyA9IGFwcGx5UHJvamVjdENvbGxlY3RpbmcocmVzLHJlYyxwcm9qZWN0LHt9KVxuICB9KTtcbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBcbiAqIEBwYXJhbSByZWNvcmRzIFxuICogQHBhcmFtIHByb2plY3QgXG4gKiBAcGFyYW0ga2VlcEFzQXJyYXkgIG1lbWJlcnMgKCBrZXlzIG9mIHByb2plY3QhICkgYXJlIGRpcmVjdGx5IGNvbGxlY3RlZCBhcyBhcnJheSBhbmQgbm90IHRvLW4tZXhwYW5kZWQsIFxuICogc28gIFt7YSA6MSwgYjpcIkIxXCIgfSx7YToyLCBiOlwiQjJcIn1dICwgY1sgXCJDMVwiLCBcIkMyXCIgXSBcbiAqIHdpbGwgYmVjb21lICBhOiBbMSwyXSwgYjogW1wiQjFcIiwgQjJdLCBjOiBbXCJDMVwiICwgXCJDMlwiXSBpZiAgW1wiYVwiLFwiYlwiLFwiY1wiXSBpcyBwYXNzZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5UHJvamVjdChyZWNvcmRzOmFueVtdLCBwcm9qZWN0OiBhbnksIGtlZXBBc0FycmF5IDogc3RyaW5nW10pIDogYW55W10ge1xuICAvLyAxKSBjb2xsZWN0IGFsbCBrZWVwYXNhcnJheSBkaXJlY3RseSwgXG4gIHZhciBzcGxpdEtlZXBBc0FycmF5UGF0aHMgPSB7fTtcbiAga2VlcEFzQXJyYXkuZm9yRWFjaCggayA9PiB7XG4gICAgc3BsaXRLZWVwQXNBcnJheVBhdGhzW2tdID0gcHJvamVjdFtrXS5zcGxpdCgnLicpO1xuICB9KTtcbiAgdmFyIHJlY0ZpeGVkID0gcmVjb3JkcztcbiAgaWYoIGtlZXBBc0FycmF5Lmxlbmd0aCkge1xuICAgIGNvbnNvbGUubG9nKFwiIGtlZXAgZml4ZWRcIiArIEpTT04uc3RyaW5naWZ5KGtlZXBBc0FycmF5TWFwKSk7XG4gICAgcmVjRml4ZWQgPSByZWNvcmRzLm1hcCggciA9PiB7XG4gICAgICB2YXIgcmZpeCA9IF8uY2xvbmUocik7XG4gICAgICBrZWVwQXNBcnJheS5mb3JFYWNoKCBwID0+IHtcbiAgICAgICAgcmZpeFtwXSA9IE1vbmdvTWFwLmNvbGxlY3RNZW1iZXJCeVBhdGgociwgc3BsaXRLZWVwQXNBcnJheVBhdGhzW3BdKTsgICAgICBcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJmaXg7XG4gICAgfSk7XG4gIH1cbiAgXG4gIHZhciBuZXdwcm9qZWN0ID0gXy5jbG9uZShwcm9qZWN0KTtcbiAgdmFyIGtlZXBBc0FycmF5TWFwID0ge307XG4gIGtlZXBBc0FycmF5LmZvckVhY2goIGsgPT4ge1xuICAgIG5ld3Byb2plY3Rba10gPSBrO1xuICAgIGtlZXBBc0FycmF5TWFwW2tdID0gMTtcbiAgfSk7XG4gIHZhciByZXMgPSBbXTtcbiAgdmFyIGxlbiA9IHJlY29yZHMubGVuZ3RoOyBcbiAgcmVjRml4ZWQuZm9yRWFjaCgocmVjLGluZGV4KSA9PntcbiAgICBpZihpbmRleCAlIDIwMCA9PSAxMCkge1xuICAgICAgY29uc29sZS5sb2coJycgKyBpbmRleCArIFwiL1wiICsgbGVuICsgXCIgXCIgKyByZXMubGVuZ3RoKTtcbiAgICB9XG4gICAgcmVzID0gYXBwbHlQcm9qZWN0Q29sbGVjdGluZyhyZXMscmVjLG5ld3Byb2plY3QsIGtlZXBBc0FycmF5TWFwKVxuICB9KTtcbiAgcmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlclByb2plY3QocHJvamVjdDogYW55LCBwcmVmaXg6IHN0cmluZykge1xuICB2YXIgcmVzID0ge307XG4gIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHByb2plY3QpLmZvckVhY2goIHBuID0+IHtcbiAgICBpZiggKFwiXCIrIHByb2plY3RbcG5dKS5zdGFydHNXaXRoKHByZWZpeCArIFwiLlwiKSApIHtcbiAgICAgIHJlc1twbl0gPSBwcm9qZWN0W3BuXS5zdWJzdHIocHJlZml4Lmxlbmd0aCArIDEpXG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyYXBBcnJheShhIDogYW55KSA6IGFueVtdIHtcbiAgaWYgKCBfLmlzQXJyYXkoYSkpIHtcbiAgICByZXR1cm4gYTtcbiAgfVxuICByZXR1cm4gW2FdO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNvcHlBbGxCdXQocmVjOiBhbnkgLCByZW1vdmVkUHJvcGVydGllczogc3RyaW5nW10pIHtcbiAgdmFyIHJlcyA9IHt9O1xuICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhyZWMpLmZpbHRlciggcG4gPT4gcmVtb3ZlZFByb3BlcnRpZXMuaW5kZXhPZihwbikgPCAwKS5mb3JFYWNoKCBwbiA9PiBcbiAgICByZXNbcG5dID0gcmVjW3BuXVxuICApO1xuICByZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmxhdHRlbkRlZXAoIHJlYyA6IGFueSwgY29tcGFjdCA6IHN0cmluZ1tdKSA6IGFueVtdIHtcbiAgdmFyIHJlcyA9IFtjb3B5QWxsQnV0KHJlYyxjb21wYWN0KV07XG4gIC8vIHdlIGNvbnN0cnVjdCB0aGUgbmV3IHJlY29yZHMgXG4gIGNvbXBhY3QuZm9yRWFjaCggYyA9PiB7ICBcbiAgICB2YXIgbmV4dCA9IFtdO1xuICAgIHJlcy5mb3JFYWNoKCBiYXNlID0+IHtcbiAgICAgIC8vIGNvcHkgYWxsIHByb3BlcnRpZXMgZnJvbSByZXNbY10gaW50byBlYWNoIGJhc2U7IFxuICAgICAgYXNzZXJ0KF8uaXNBcnJheShyZWNbY10pKTsgLy8gd2hhdCBpZiB0aGlzIGlzIGVtcHR5P1xuICAgICAgcmVjW2NdLmZvckVhY2goIG9iaiA9PiB7XG4gICAgICAgIGlmICggdHlwZW9mIG9iaiA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgdmFyIG5iID0gXy5jbG9uZShiYXNlKTtcbiAgICAgICAgICBPYmplY3QuYXNzaWduKG5iLG9iaik7XG4gICAgICAgICAgbmV4dC5wdXNoKG5iKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgbmIgPSBfLmNsb25lKGJhc2UpO1xuICAgICAgICAgIG5iW2NdID0gb2JqO1xuICAgICAgICAgIG5leHQucHVzaChuYik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJlcyA9IG5leHQ7XG4gIH0pO1xuICByZXR1cm4gcmVzO1xufVxuXG4gZXhwb3J0IGZ1bmN0aW9uIGFwcGx5UHJvamVjdENvbGxlY3RpbmcocmVzOmFueVtdLCByZWM6YW55LCBwcm9qZWN0OiBhbnksIGtlZXBBc0FycmF5TWFwIDogYW55KTogYW55W10ge1xuICAvLyAxKSByZXRyaWV2ZSBvbmx5IG1lbWJlcnMgcGFydCBvZiB0aGUgcHJvamVjdCwgZmxhdHRlbmluZyB0aGUgcmVjb3JkcyBpbiB0aGUgcHJvY2Vzc1xuICB2YXIgZmllbGRzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocHJvamVjdCk7XG4gIHZhciBzZWVuID0ge307XG4gIHZhciBjb21wYWN0ID0gW107XG4gIC8vIDEpIHdlIGV4cGFuZCBhbGwgY29sbGluZWFyIGludG8gYW4gYXJyYXkgWyByZWdhcmRsZXNzIG9mIG9yaWdpbl0gIGNvbnN0cnVjdCBhIHsgZSA6IHgsICBfY2F0ZWdvcmllcyA6IFsgeyB4IDogYSwgYiA6IFsgeyB4OiBhLCBiOiBhfSB9IF19XG4gIHZhciB0bXBsID0ge307XG4gIGZpZWxkcy5mb3JFYWNoKCBmID0+IHtcbiAgICBpZiAoICFzZWVuW2ZdKSB7XG4gICAgICB2YXIgZnVsbHBhdGggPSAocHJvamVjdFtmXSA9PSAxKT8gIGYgOiBwcm9qZWN0W2ZdO1xuICAgICAgdmFyIHBhdGggPSBmdWxscGF0aC5zcGxpdChcIi5cIik7XG4gICAgICBpZiAoIHBhdGgubGVuZ3RoID09IDEpIHtcbiAgICAgICAgaWYgKCBfLmlzQXJyYXkocmVjW2Z1bGxwYXRoXSkgJiYga2VlcEFzQXJyYXlNYXBbZl0pIHtcbiAgICAgICAgICAvLyBrZWVwIGFycmF5IVxuICAgICAgICAgIHRtcGxbcGF0aF0gPSByZWNbZnVsbHBhdGhdO1xuICAgICAgICB9IGVsc2UgaWYgKCBfLmlzQXJyYXkocmVjW2Z1bGxwYXRoXSkpIHtcbiAgICAgICAgICBjb21wYWN0LnB1c2goZnVsbHBhdGgpXG4gICAgICAgICAgdG1wbFtmXSA9IHJlY1tmdWxscGF0aF07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2UgaWYgKCB0eXBlb2YgcmVjW2Z1bGxwYXRoXSA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgLy8gdGhpcyBjYW5ub3QgYmUsIFxuICAgICAgICAgIHRocm93IFwiVW5hYmxlIHRvIGV4dHJhY3QgbWVtYmVyIFwiICsgZnVsbHBhdGggKyBcIiBmcm9tIFwiICsgSlNPTi5zdHJpbmdpZnkocmVzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0bXBsW3BhdGhdID0gcmVjW2Z1bGxwYXRoXTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGNvbGxlY3QgcHJlZml4ZSBzZXQsIGNyZWF0ZSBwc2V1ZG8gcHJvamVjdGlvbiBmcm9tIGl0LiBcbiAgICAgICAgdmFyIHByZWZpeCA9IHBhdGhbMF07XG4gICAgICAgIGNvbXBhY3QucHVzaChwcmVmaXgpO1xuICAgICAgICB2YXIgcHJvalN1ZmZpeCA9IGZpbHRlclByb2plY3QocHJvamVjdCxwcmVmaXgpO1xuICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhwcm9qU3VmZml4KS5mb3JFYWNoKCBhPT4gc2VlblthXSA9IDEpO1xuICAgICAgICB2YXIgbG9jYWxFeHBhbmQgPSBhcHBseVByb2plY3RPbmx5KHdyYXBBcnJheShyZWNbcHJlZml4XSksIHByb2pTdWZmaXgpO1xuICAgICAgICB0bXBsW3ByZWZpeF0gPSBsb2NhbEV4cGFuZDtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICB2YXIgYXVnID0gZmxhdHRlbkRlZXAodG1wbCwgY29tcGFjdCk7XG4gIHJldHVybiByZXMuY29uY2F0KGF1Zyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0RlZXAoYTphbnkpIHtcbiAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGEpLnNvbWUoIHAgPT4gXy5pc09iamVjdChhW3BdKSB8fCBfLmlzQXJyYXkoYVtwXSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFrZUtleShhKSAgOiBzdHJpbmcge1xuICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoYSkubWFwKCBrID0+ICcnKyAoYVtrXSB8fCAnJykpLmpvaW4oJ19fJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0FsbFByb3BzRW1wdHkocyA6IHN0cmluZykge1xuICByZXR1cm4gcy5zZWFyY2goL1teX10vKSA8IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVEdXBsaWNhdGVzKHJlY29yZHM6IGFueVtdKSB7XG4gIHZhciBzZWVuID0ge307XG4gIHJldHVybiByZWNvcmRzLmZpbHRlciggYSA9PiB7IHZhciBzID0gbWFrZUtleShhKTsgdmFyIHJlcyA9IGlzRGVlcChhKSB8fCAoIWlzQWxsUHJvcHNFbXB0eShzKSAmJiAhc2VlbltzXSk7IHNlZW5bc10gPSAxOyByZXR1cm4gcmVzOyB9KTtcbn1cblxuXG4vKipcbiAqIGlmIG1lbWJlciBvZiB1bndpbmQgcG9pbnRzIHRvIGFuIGFycmF5LCBleHBhbmQgaXQuIFxuICogQHBhcmFtIHJlY29yZHMgSSBcbiAqIEBwYXJhbSB1bndpbmQgXG4gKiBAcGFyYW0gYW55IFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlVbndpbmQocmVjb3JkczphbnlbXSwgdW53aW5kIDogYW55KSA6IGFueVtdIHtcbiAgdmFyIHJlcyA9IFtdO1xuICB2YXIgcHJvcCA9IHVud2luZC5wYXRoO1xuICByZWNvcmRzLmZvckVhY2goIHIgPT4ge1xuICAgIGlmICggXy5pc0FycmF5KHJbcHJvcF0pICYmIHJbcHJvcF0ubGVuZ3RoID4gMCApIHtcbiAgICAgIHJbcHJvcF0uZm9yRWFjaCggZWwgPT4ge1xuICAgICAgICB2YXIgcmMgPSBfLmNsb25lRGVlcChyKTtcbiAgICAgICAgcmNbcHJvcF0gPSBlbDtcbiAgICAgICAgcmVzLnB1c2gocmMpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcy5wdXNoKHIpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVNvcnQocmVjb3JkczphbnlbXSwgbWF0Y2g6IGFueSkgOiBhbnlbXSB7XG4gIHZhciBwcm9wcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG1hdGNoKTtcbiAgcmVjb3Jkcy5zb3J0KCAoYSxiKSA9PiB7IFxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIGZhYyA9IDE7XG4gICAgICBpZiAoIG1hdGNoW3Byb3BzW2ldXSA9PSAtMSkge1xuICAgICAgICBmYWMgPSAtMTtcbiAgICAgIH1cbiAgICAgIHZhciBsaHMgPSBhW3Byb3BzW2ldXTtcbiAgICAgIHZhciByaHMgPSBiW3Byb3BzW2ldXTtcbiAgICAgIGlmKCBsaHMgPiByaHMpIHtcbiAgICAgICAgcmV0dXJuICtmYWM7XG4gICAgICB9IGVsc2UgaWYgKCBsaHMgPCByaHMgKSB7XG4gICAgICAgIHJldHVybiAtZmFjO1xuICAgICAgfSBlbHNlIGlmICggbGhzID09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgcmV0dXJuICtmYWM7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAwO1xuICAgfSk7XG4gIHJldHVybiByZWNvcmRzOyBcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdGVwKHJlY29yZHM6YW55W10sIHF1ZXJ5U3RlcDogYW55KSA6IGFueVtdIHtcbiAgaWYoIHF1ZXJ5U3RlcFtcIiRtYXRjaFwiXSkge1xuICAgIHJldHVybiBhcHBseU1hdGNoKHJlY29yZHMsIHF1ZXJ5U3RlcFtcIiRtYXRjaFwiXSlcbiAgfSBlbHNlIGlmICggcXVlcnlTdGVwW1wiJHByb2plY3RcIl0pIHtcbiAgICByZXR1cm4gYXBwbHlQcm9qZWN0KHJlY29yZHMsIHF1ZXJ5U3RlcFtcIiRwcm9qZWN0XCJdLCBxdWVyeVN0ZXBbXCIka2VlcEFzQXJyYXlcIl0gfHwgW10pOyAgICBcbiAgfSBlbHNlIGlmICggcXVlcnlTdGVwW1wiJHNvcnRcIl0gKSB7XG4gICAgcmV0dXJuIGFwcGx5U29ydChyZWNvcmRzLCBxdWVyeVN0ZXBbXCIkc29ydFwiXSk7XG4gIH0gZWxzZSBpZiAoIHF1ZXJ5U3RlcFtcIiR1bndpbmRcIl0gKSB7XG4gICAgcmV0dXJuIGFwcGx5VW53aW5kKHJlY29yZHMsIHF1ZXJ5U3RlcFtcIiR1bndpbmRcIl0pO1xuICB9IFxuICBlbHNlIGlmICggcXVlcnlTdGVwW1wiJGdyb3VwXCJdIHx8IHF1ZXJ5U3RlcFtcIiR1bndpbmRcIl0gKXtcbiAgICByZXR1cm4gcmVjb3JkcztcbiAgfVxuICBjb25zb2xlLmxvZygndW5rbm93biBzdGVwICcgKyBKU09OLnN0cmluZ2lmeShxdWVyeVN0ZXApKTtcbiAgcmV0dXJuIHJlY29yZHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJCeVF1ZXJ5KHJlY29yZHM6YW55W10sIHF1ZXJ5OiBhbnkpOiBhbnlbXSB7XG4gIHZhciByZXMgPSByZWNvcmRzO1xuICBxdWVyeS5mb3JFYWNoKCBxY29tcCA9PiB7IHJlcyA9IGFwcGx5U3RlcChyZXMscWNvbXApfSk7XG4gIHJldHVybiByZW1vdmVEdXBsaWNhdGVzKHJlcyk7XG59XG5cblxuY2xhc3MgQVBzZXVkb01vZGVsIGltcGxlbWVudHMgSVBzZXVkb01vZGVsIHtcbiAgbW9kZWxuYW1lIDogc3RyaW5nO1xuICByZWNvcmRzIDogYW55W107XG4gIHNjaGVtYSA6IGFueTtcbiAgY29uc3RydWN0b3IoIG1vZGVsTmFtZSA6IHN0cmluZywgcmVjb3JkczogYW55W10sIHNjaGVtYSA6IGFueSkge1xuICAgIHRoaXMubW9kZWxuYW1lID0gbW9kZWxOYW1lOyBcbiAgICB0aGlzLnJlY29yZHMgPSByZWNvcmRzOyBcbiAgICB0aGlzLnNjaGVtYSA9IHNjaGVtYTtcbiAgfVxuICBhZ2dyZWdhdGVTeW5vbnltcygpIDogUHJvbWlzZTxJU3lub255bVtdPiB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuLypcbiAgICBcIl9zeW5vbnltc1wiIDogW1xuICAgICAgeyBcImNhdGVnb3J5XCIgOiBcIm9iamVjdCBuYW1lXCIsXG4gICAgICAgIFwiZmFjdFwiIDogXCJlYXJ0aFwiLFxuICAgICAgICBcInN5bm9ueW1zXCIgOiBbIFwiYmx1ZSBwbGFuZXRcIiAsIFwiZ2FpYVwiXVxuICAgICAgfSxcbiAgICAgIHsgXCJjYXRlZ29yeVwiIDogXCJvcmJpdHNcIixcbiAgICAgICAgXCJmYWN0XCIgOiBcIlN1blwiLFxuICAgICAgICBcInN5bm9ueW1zXCIgOiBbIFwiU29sXCJdXG4gICAgICB9XG4gICAgICAqL1xuICAgIHZhciByZXMgPSBbXSBhcyBJU3lub255bVtdO1xuICAgIHNlbGYucmVjb3Jkcy5mb3JFYWNoKCByZWMgPT4ge1xuICAgICAgICB2YXIgc3luID0gTW9uZ29NYXAuZ2V0TWVtYmVyQnlQYXRoKHJlYyxbXCJfc3lub255bXNcIl0pO1xuICAgICAgICBpZiAoIHN5biApIHtcbiAgICAgICAgICByZXMgPSByZXMuY29uY2F0KHN5bik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBkZWJ1Z2xvZygnIGZvdW5kICcgKyByZXMubGVuZ3RoICsgJyBzeW5vbnltcyBmb3IgJyArIHRoaXMubW9kZWxuYW1lKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2U8SVN5bm9ueW1bXT4oIChyZXNvbHZlLHJlamVjdCkgPT4geyByZXNvbHZlKHJlcyl9KTsgICAgXG4gIH1cbiAgZGlzdGluY3RGbGF0KCBtb2RlbFBhdGggOiBJTW9kZWxQYXRoICkgOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgdmFyIG8gPSB7fTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5yZWNvcmRzLmZvckVhY2goIHJlYyA9PiBcbiAgICAgIHsgdmFyIHIgPSBNb25nb01hcC5nZXRNZW1iZXJCeVBhdGgocmVjLCBtb2RlbFBhdGgucGF0aHMpO1xuICAgICAgICBpZihfLmlzQXJyYXkocikpIHtcbiAgICAgICAgICByLmZvckVhY2goIGsgPT4gb1trXSA9IGspO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICggciApIHtcbiAgICAgICAgICAgIG9bcl0gPSByO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgdmFyIHJlcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG8pLm1hcCggKGspID0+IG9ba10pLnNvcnQoKTtcbiAgICByZXR1cm4gYXNQcm9taXNlKHJlcyk7XG4gIH1cbiAgZGlzdGluY3QoIHBhdGggOiBzdHJpbmcpIDogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gbmV3IFByb21pc2U8c3RyaW5nW10+KCAocmVzb2x2ZSxyZWplY3QpID0+IHtcbiAgICAgIHZhciBvID0ge307XG4gICAgICAvLyBUT0RPOiBub3Qgb25seSBkaXJlY3QgcHJvcFxuICAgICAgc2VsZi5yZWNvcmRzLmZvckVhY2goIGEgPT4gY29uc29sZS5sb2coXCJoZXJlIG9uZSBcIiArIGFbcGF0aF0pKTtcbiAgICAgIHNlbGYucmVjb3Jkcy5mb3JFYWNoKCBhID0+IHsgXG4gICAgICAgIHZhciB1ID0gYVtwYXRoXTtcbiAgICAgICAgaWYoIF8uaXNBcnJheSh1KSkge1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb1thW3BhdGhdXSA9IGFbcGF0aF07IFxuICAgICAgICB9XG4gICAgICBcbiAgICAgIH0pO1xuICAgICAgcmVzb2x2ZShPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhvKS5tYXAoIChrKSA9PiBvW2tdKS5zb3J0KCkpO1xuICAgIH0pOyAgICBcbiAgfVxuICBmaW5kKHF1ZXJ5OiBhbnkpIDogUHJvbWlzZTxhbnlbXT4ge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHF1ZXJ5KS5sZW5ndGggPT0gMCkge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPElTeW5vbnltW10+KCAocmVzb2x2ZSxyZWplY3QpID0+IHsgcmVzb2x2ZShzZWxmLnJlY29yZHMpfSk7ICAgIFxuICAgIH1cbiAgICBjb25zb2xlLmxvZyhcImZpbmQgXCIgKyBKU09OLnN0cmluZ2lmeShxdWVyeSkpO1xuICAgIHRocm93IFwiRmluZCBcIiArIEpTT04uc3RyaW5naWZ5KHF1ZXJ5KTtcbiAgfVxuICBhZ2dyZWdhdGUocXVlcnkgOiBhbnkpIDogUHJvbWlzZTxhbnlbXT4ge1xuICAgIGRlYnVnbG9nKFwiQWdncmVnYXRlIFwiICsgSlNPTi5zdHJpbmdpZnkocXVlcnkpKTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIHJlcyA9IGZpbHRlckJ5UXVlcnkoc2VsZi5yZWNvcmRzLHF1ZXJ5KTtcbiAgICByZXR1cm4gbmV3IFByb21pc2U8SVN5bm9ueW1bXT4oIChyZXNvbHZlLHJlamVjdCkgPT4geyByZXNvbHZlKHJlcyl9KTsgICAgXG4gIH1cbn1cblxuY2xhc3MgQVNyY0hhbmRsZSBpbXBsZW1lbnRzIElTcmNIYW5kbGUge1xuICBfbW9kZWxOYW1lcyA6IHN0cmluZ1tdO1xuICBfcHNldWRvTW9kZWxzIDogTWFwPFN0cmluZyxJUHNldWRvTW9kZWw+O1xuICAvL25hbWU6IHN0cmluZztcbiAgcGF0aCA6IHN0cmluZztcbiAgY29uc3RydWN0b3IocGF0aDogc3RyaW5nKSB7XG4gICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICBpZiggIXRoaXMucGF0aC5lbmRzV2l0aCgnLycpKSB7XG4gICAgICB0aGlzLnBhdGggPSB0aGlzLnBhdGggKyAnLyc7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCcgdGhpcyBpcyB0aGUgcGF0aCcgKyBwYXRoKTtcbiAgICB0aGlzLl9wc2V1ZG9Nb2RlbHMgPSB7fSBhcyBNYXA8U3RyaW5nLElQc2V1ZG9Nb2RlbD47IFxuICB9XG4gIG1vZGVsTmFtZXMoKSA6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gdGhpcy5fbW9kZWxOYW1lcztcbiAgfVxuICBnZXRQYXRoKCkgOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnBhdGg7XG4gIH1cbiAgbW9kZWwoIG5hbWUgOiBzdHJpbmcgKSA6IElQc2V1ZG9Nb2RlbCB7XG4gICAgcmV0dXJuIHRoaXMuX3BzZXVkb01vZGVsc1tuYW1lXTtcbiAgfVxuICBzZXRNb2RlbChtb2RlbE5hbWUgOiBzdHJpbmcgLCByZWNvcmRzIDphbnksIHNjaGVtYSA6IGFueSkge1xuICAgIGRlYnVnbG9nKFwiU2V0dGluZyBtb2RlbCBcIiArIG1vZGVsTmFtZSArIFwiIHdpdGggXCIgKyByZWNvcmRzLmxlbmd0aCArIFwiIHJlY29yZHMgXCIpO1xuICAgIHRoaXMuX3BzZXVkb01vZGVsc1ttb2RlbE5hbWVdID0gbmV3IEFQc2V1ZG9Nb2RlbChtb2RlbE5hbWUsIHJlY29yZHMsIHNjaGVtYSk7IFxuICB9XG4gIGNvbm5lY3QoIG1vZGVsUGF0aCA6IHN0cmluZyApIDogUHJvbWlzZTxJU3JjSGFuZGxlPiB7XG4gICAgdGhpcy5wYXRoID0gbW9kZWxQYXRoO1xuICAgIGlmKCAhdGhpcy5wYXRoLmVuZHNXaXRoKCcvJykpIHtcbiAgICAgIHRoaXMucGF0aCA9IHRoaXMucGF0aCArICcvJztcbiAgICB9XG4gICAgY29uc29sZS5sb2coJyB0aGlzIGlzIHRoZSBwYXRoJyArIHRoaXMucGF0aCk7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxJU3JjSGFuZGxlPiggKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgZnMucmVhZEZpbGUoIHRoaXMucGF0aCArIFwibW9kZWxzLmpzb25cIiwgKGVyciwgYnVmZmVyICkgPT4ge1xuICAgICAgICBpZiAoIGVyciApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgICAgIHNlbGYuX21vZGVsTmFtZXMgPSBKU09OLnBhcnNlKGJ1ZmZlci50b1N0cmluZygndXRmLTgnKSkgYXMgYW55OyBcbiAgICAgICAgZGVidWdsb2coXCJSZWFkIG1vZGVsbmFtZXMgXCIgKyBKU09OLnN0cmluZ2lmeSggc2VsZi5fbW9kZWxOYW1lcykgKyBcIiB0aGlzLnBhdGggPVwiICsgc2VsZi5wYXRoKTtcbiAgICAgICAgcmVzb2x2ZShzZWxmKTtcbiAgICAgIH0pXG4gICAgfSk7XG4gIH1cbiAgZ2V0SlNPTihmaWxlbmFtZSA6IHN0cmluZykgOiBQcm9taXNlPGFueT4ge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZnVsbGZpbGUgPSB0aGlzLnBhdGggKyBmaWxlbmFtZTtcbiAgICAvL2NvbnNvbGUubG9nKCcgcmVhZCBmaWxlICcgKyBmdWxsZmlsZSk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPGFueT4oIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGZzLnJlYWRGaWxlKCBmdWxsZmlsZSwgKGVyciwgYnVmZmVyICkgPT4ge1xuICAgICAgICBpZiAoIGVyciApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhmdWxsZmlsZSArIGVycik7XG4gICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkYXRhID0gSlNPTi5wYXJzZShidWZmZXIudG9TdHJpbmcoJ3V0Zi04JykpIGFzIGFueTsgXG4gICAgICAgIHJlc29sdmUoZGF0YSk7XG4gICAgICB9KVxuICAgIH0pO1xuICB9XG4gIGdldEpTT05BcnIoZmlsZW5hbWUgOiBzdHJpbmcgKSA6IFByb21pc2U8YW55W10+IHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGZ1bGxmaWxlID0gdGhpcy5wYXRoICsgZmlsZW5hbWU7XG4gICAgLy9jb25zb2xlLmxvZygnIHJlYWQgZmlsZSAnICsgZnVsbGZpbGUpO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxhbnlbXT4oIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGZzLnJlYWRGaWxlKCBmdWxsZmlsZSwgKGVyciwgYnVmZmVyICkgPT4ge1xuICAgICAgICBpZiAoIGVyciApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhmdWxsZmlsZSk7XG4gICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cbiAgICAgICB2YXIgZGF0YSA9IEpTT04ucGFyc2UoYnVmZmVyLnRvU3RyaW5nKCd1dGYtOCcpKSBhcyBhbnk7IFxuICAgICAgICByZXNvbHZlKFtkYXRhXSk7XG4gICAgICB9KVxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTb3VyY2VIYW5kbGUoKSAgOiBJU3JjSGFuZGxlIHtcbiAgcmV0dXJuIG5ldyBBU3JjSGFuZGxlKFwiXCIpOyBcbn0iXX0=
