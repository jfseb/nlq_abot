"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSourceHandle = exports.filterByQuery = exports.applyStep = exports.applySort = exports.applyUnwind = exports.removeDuplicates = exports.isAllPropsEmpty = exports.makeKey = exports.isDeep = exports.applyProjectCollecting = exports.flattenDeep = exports.copyAllBut = exports.wrapArray = exports.filterProject = exports.applyProject = exports.applyMatch = exports.satisfiesMatch = exports.evalSet = exports.compareByType = exports.asString = exports.evalArg = void 0;
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
function applyProject(records, project) {
    var res = [];
    records.forEach(rec => res = applyProjectCollecting(res, rec, project));
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
function applyProjectCollecting(res, rec, project) {
    // 1) retrieve onyl members part of the project, flattening the records in the process
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
                if (_.isArray(rec[fullpath])) {
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
                var localExpand = applyProject(wrapArray(rec[prefix]), projSuffix);
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
    debugger;
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
        return applyProject(records, queryStep["$project"]);
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
        debugger;
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
    connect(connectionString) {
        this.name = connectionString;
        if (this.name.indexOf("2") >= 0) {
            this.path = "./testmodel2" + "/";
        }
        else {
            this.path = "./testmodel" + "/";
        }
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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RUFBRSxDQUFDLFFBQVEsQ0FBRSxRQUFRLEVBQUUsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFHLEVBQUU7Z0JBQ3RDLElBQUssR0FBRyxFQUFHO29CQUNULE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3RCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2pCLE1BQU0sR0FBRyxDQUFDO2lCQUNYO2dCQUNGLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBUSxDQUFDO2dCQUN0RCxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLENBQUMsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFFRCxTQUFnQixrQkFBa0I7SUFDaEMsT0FBTyxJQUFJLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM1QixDQUFDO0FBRkQsZ0RBRUMiLCJmaWxlIjoibW9kZWwvc3JjaGFuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSVN5bnRhY3RpY0NvbnRlbnRBc3Npc3RQYXRoIH0gZnJvbSBcImNoZXZyb3RhaW5cIjtcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwidXJsXCI7XG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCB7IGFkZENsb3NlRXhhY3RSYW5nZVJ1bGVzLCBhc1Byb21pc2UgfSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0ICogYXMgTW9uZ29NYXAgZnJvbSAgXCIuL21vbmdvbWFwXCI7XG5pbXBvcnQgeyBhQW55U3VjY2Vzc29yT3BlcmF0b3JOYW1lcywgSU1vZGVsUGF0aCB9IGZyb20gXCIuLi9tYXRjaC9pZm1hdGNoXCI7XG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5cbi8vaW1wb3J0ICogYXMgaW50ZiBmcm9tICdjb25zdGFudHMnO1xuaW1wb3J0ICogYXMgZGVidWdmIGZyb20gJ2RlYnVnZic7XG5pbXBvcnQgeyBldmFsdWF0ZVJhbmdlUnVsZXNUb1Bvc2l0aW9uIH0gZnJvbSBcIi4uL21hdGNoL2VyYmFzZVwiO1xuaW1wb3J0IHsgU2VudGVuY2UgfSBmcm9tIFwiLi4vbWF0Y2gvZXJfaW5kZXhcIjtcbmltcG9ydCB7IGFzc2VydCB9IGZyb20gXCJjb25zb2xlXCI7XG5pbXBvcnQgeyBuZXh0VGljayB9IGZyb20gXCJwcm9jZXNzXCI7XG5pbXBvcnQgeyBpc0VtcHR5IH0gZnJvbSBcImxvZGFzaFwiO1xuXG52YXIgZGVidWdsb2cgPSBkZWJ1Z2YoJ3NyY2hhbmRsZScpO1xuXG5leHBvcnQgaW50ZXJmYWNlIElTeW5vbnltIHtcbiAgY2F0ZWdvcnk6IHN0cmluZyxcbiAgZmFjdDogc3RyaW5nLFxuICBzeW5vbnltczogc3RyaW5nW11cbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVBzZXVkb01vZGVsIHtcbiAgbW9kZWxuYW1lIDogc3RyaW5nLFxuICByZWNvcmRzIDogYW55W107XG4gIHNjaGVtYSA6IGFueTtcbiAgYWdncmVnYXRlU3lub255bXMoKSA6IFByb21pc2U8SVN5bm9ueW1bXT47XG4gIGRpc3RpbmN0RmxhdCggbW9kZWxQYXRoIDogSU1vZGVsUGF0aCApIDogUHJvbWlzZTxzdHJpbmdbXT47XG4gIGRpc3RpbmN0KCBwYXRoIDogc3RyaW5nKSA6IFByb21pc2U8c3RyaW5nW10+O1xuICBmaW5kKHF1ZXJ5OiBhbnkpIDogUHJvbWlzZTxhbnlbXT47XG4gIGFnZ3JlZ2F0ZShxdWVyeSA6IGFueSkgOiBQcm9taXNlPGFueVtdPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJUHNldWRvU2NoZW1hIHtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJU3JjSGFuZGxlIHtcbiAgbW9kZWxOYW1lcygpIDogc3RyaW5nW10sXG4gIGdldFBhdGgoKSA6IHN0cmluZyxcbiAgbW9kZWwoYSA6IHN0cmluZywgc2NoZW1hPzogYW55KSA6IElQc2V1ZG9Nb2RlbCxcbiAgc2V0TW9kZWwobW9kZWxuYW1lIDogc3RyaW5nICwgZGF0YTphbnksIHNjaGVtYSA6IGFueSksXG4gIGNvbm5lY3QoIGNvbm5lY3Rpb25TdHJpbmcgOiBzdHJpbmcgKSA6IFByb21pc2U8SVNyY0hhbmRsZT5cbiAgZ2V0SlNPTiggZmlsZW5hbWUgOiBzdHJpbmcgLCBtb2RlbG5hbWVzPyA6IHN0cmluZ1tdKSA6IFByb21pc2U8YW55PjtcbiAgZ2V0SlNPTkFyciggZmlsZW5hbWUgOiBzdHJpbmcpIDogUHJvbWlzZTxhbnlbXT47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBldmFsQXJnKHJlYzogYW55LCBhcmcgOiBhbnkpIDogYW55W10ge1xuICBpZiAoIGFyZ1snJGV2YWwnXSkge1xuICAgIC8vIFRPRE8gZWxlbWVudHNcbiAgICBkZWJ1Z2xvZyhcIiByZXRyaWV2ZSBcIiArIGFyZ1snJGV2YWwnXSArICcgZnJvbSAnICsgSlNPTi5zdHJpbmdpZnkocmVjKSk7XG4gICAgdmFyIHN0ciA9IGFyZ1snJGV2YWwnXS5zcGxpdChcIi5cIik7XG4gICAgcmV0dXJuIE1vbmdvTWFwLmNvbGxlY3RNZW1iZXJCeVBhdGgocmVjLCBzdHIpO1xuICB9IGVsc2UgaWYgKCBhcmdbJyRyZWdleCddKSB7XG4gICAgcmV0dXJuIGFyZ1snJHJlZ2V4J107XG4gIH0gZWxzZSBpZiAoIGFyZ1snJEFSUkFZU0laRV9PUl9WQUxfT1IxJ10pIHtcbiAgICB2YXIgcGF0aCA9IGFyZ1snJEFSUkFZU0laRV9PUl9WQUxfT1IxJ107XG4gICAgdmFyIHJlcyA9IE1vbmdvTWFwLmNvbGxlY3RNZW1iZXJCeVBhdGgocmVjLCBzdHIpO1xuICAgIGlmKCByZXMubGVuZ3RoICYmIHR5cGVvZiByZXNbMF0gPT0gXCJudW1iZXJcIikge1xuICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgcmV0dXJuIFtyZXMubGVuZ3RoXTtcbiAgICByZXR1cm4gYXJnWyckcmVnZXgnXTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gW2FyZ107XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzU3RyaW5nKCBhIDogYW55KSA6IHN0cmluZyB7XG4gIHJldHVybiBcIlwiICsgYTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBhcmVCeVR5cGUob3A6IHN0cmluZywgbCA6IGFueSwgcjogYW55KSA6IGJvb2xlYW4ge1xuICBpZiAoIHR5cGVvZiByID09IFwic3RyaW5nXCIpIHtcbiAgICBsID0gYXNTdHJpbmcobCk7XG4gIH1cbiAgc3dpdGNoKG9wKSB7XG4gIGNhc2UgXCIkbHRcIjogXG4gICAgcmV0dXJuIGwgPCByO1xuICBjYXNlIFwiJGx0ZVwiOlxuICAgIHJldHVybiBsIDw9IHI7XG4gIGNhc2UgXCIkZ3RcIjpcbiAgICByZXR1cm4gbCA+IHI7XG4gIGNhc2UgXCIkZ3RlXCI6XG4gICAgcmV0dXJuIGwgPj0gcjtcbiAgY2FzZSBcIiRlcVwiOlxuICAgIHJldHVybiBsID09IHI7XG4gIGNhc2UgXCIkbmVcIjpcbiAgICByZXR1cm4gbCAhPSByO1xuICBkZWZhdWx0OiBcbiAgdGhyb3cgXCJVbmltcGxlbWVudGVkIG9wIFwiICsgb3A7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV2YWxTZXQob3AgOiBzdHJpbmcsIGxoczogYW55LCByaHM6IGFueSApIDogYm9vbGVhbiB7XG4gIHN3aXRjaChvcCkge1xuICBjYXNlIFwiJHJlZ2V4XCI6e1xuICAgIGlmICggdHlwZW9mIHJocyA9PSBcIm9iamVjdFwiICYmICByaHMuY29uc3RydWN0b3IgPT0gUmVnRXhwKSB7XG4gICAgICByZXR1cm4gbGhzLnNvbWUoIGEgPT4gcmhzLmV4ZWMoYXNTdHJpbmcoYSkpKTtcbiAgICB9XG4gICAgdGhyb3cgXCJyaHMgaXMgbm90IGFuIHJlZ2V4cFwiICsgSlNPTi5zdHJpbmdpZnkocmhzKTtcbiAgfVxuICBicmVhaztcbiAgY2FzZSBcIiRsdFwiOiBcbiAgY2FzZSBcIiRsdGVcIjpcbiAgY2FzZSBcIiRndFwiOlxuICBjYXNlIFwiJGd0ZVwiOlxuICBjYXNlIFwiJGVxXCI6XG4gIGNhc2UgXCIkbmVcIjpcbiAge1xuICAgIHJldHVybiByaHMuc29tZSggciA9PiAoIGxocy5zb21lKCBsID0+ICAgY29tcGFyZUJ5VHlwZShvcCxsLHIpICkpKTtcbiAgfVxuICBicmVhaztcbiAgY2FzZSBcIiRleGlzdHNcIjoge1xuICAgIGlmICggcmhzWzBdID09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gbGhzLmxlbmd0aCA9PSAwO1xuICAgIH1cbiAgICByZXR1cm4gbGhzLmxlbmd0aCA+IDA7XG4gIH1cbiAgZGVmYXVsdDogXG4gICAgdGhyb3cgXCJVbmltcGxlbWVudGVkIG9wIFwiICsgb3A7XG4gIH1cbn1cblxudmFyIG9wcyA9IFtcIiRsdFwiLCBcIiRlcVwiLCBcIiRuZVwiLCBcIiRsdGVcIiwgXCIkZ3RcIiwgXCIkZ3RlXCIsIFwiJGV4aXN0c1wiLCBcIiRyZWdleFwiIF07XG5cbmV4cG9ydCBmdW5jdGlvbiBzYXRpc2ZpZXNNYXRjaChyZWMgOiBhbnksIG1hdGNoIDogYW55KSA6IGJvb2xlYW4ge1xuICB2YXIgcHJvcHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhtYXRjaCk7XG4gIGlmKHByb3BzLmxlbmd0aCA9PSAwICl7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZihtYXRjaFsnJGFuZCddKSB7XG4gICAgZGVidWdsb2coJ2ZvdW5kICRhbmQnKTtcbiAgICByZXR1cm4gbWF0Y2hbJyRhbmQnXS5ldmVyeSggY29uZCA9PiBzYXRpc2ZpZXNNYXRjaChyZWMsIGNvbmQpKTtcbiAgfSBlbHNlIGlmIChtYXRjaFsnJG9yJ10pIHtcbiAgICByZXR1cm4gbWF0Y2hbJyRvciddLmFueSggY29uZCA9PiBzYXRpc2ZpZXNNYXRjaChyZWMsIGNvbmQpKTtcbiAgfSBlbHNlIGlmICggb3BzLmluZGV4T2YoT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMobWF0Y2gpWzBdKSA+PSAwKSB7XG4gICAgICB2YXIgb3AgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhtYXRjaClbMF07XG4gICAgICB2YXIgbGhzID0gZXZhbEFyZyhyZWMsbWF0Y2hbb3BdWzBdKVxuICAgICAgdmFyIHJocyA9IGV2YWxBcmcocmVjLG1hdGNoW29wXVsxXSk7XG4gICAgICBkZWJ1Z2xvZygoKSA9PiAncmhzICcgKyBKU09OLnN0cmluZ2lmeShsaHMpICsgXCIgcmhzOlwiICsgSlNPTi5zdHJpbmdpZnkocmhzKSk7XG4gICAgICByZXR1cm4gZXZhbFNldChvcCxsaHMscmhzKTtcbiAgfSBcbiAgZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ3Vua25vd24gb3AgJyArIEpTT04uc3RyaW5naWZ5KG1hdGNoKSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5TWF0Y2gocmVjb3JkczphbnlbXSwgbWF0Y2g6IGFueSkgOiBhbnlbXSB7XG4gIHZhciBsMT0gcmVjb3Jkcy5sZW5ndGg7XG4gIHZhciByZXMgPSByZWNvcmRzLmZpbHRlciggcmVjID0+IHNhdGlzZmllc01hdGNoKHJlYyAsbWF0Y2gpKTtcbiAgZGVidWdsb2coJyBhcHBsaWVkIG1hdGNoICcgKyByZXMubGVuZ3RoICsgXCIvXCIgKyBsMSApO1xuICByZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlQcm9qZWN0KHJlY29yZHM6YW55W10sIHByb2plY3Q6IGFueSkgOiBhbnlbXSB7XG4gIHZhciByZXMgPSBbXTtcbiAgcmVjb3Jkcy5mb3JFYWNoKHJlYyA9PiByZXMgPSBhcHBseVByb2plY3RDb2xsZWN0aW5nKHJlcyxyZWMscHJvamVjdCkpO1xuICByZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyUHJvamVjdChwcm9qZWN0OiBhbnksIHByZWZpeDogc3RyaW5nKSB7XG4gIHZhciByZXMgPSB7fTtcbiAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocHJvamVjdCkuZm9yRWFjaCggcG4gPT4ge1xuICAgIGlmKCAoXCJcIisgcHJvamVjdFtwbl0pLnN0YXJ0c1dpdGgocHJlZml4ICsgXCIuXCIpICkge1xuICAgICAgcmVzW3BuXSA9IHByb2plY3RbcG5dLnN1YnN0cihwcmVmaXgubGVuZ3RoICsgMSlcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JhcEFycmF5KGEgOiBhbnkpIDogYW55W10ge1xuICBpZiAoIF8uaXNBcnJheShhKSkge1xuICAgIHJldHVybiBhO1xuICB9XG4gIHJldHVybiBbYV07XG59XG5leHBvcnQgZnVuY3Rpb24gY29weUFsbEJ1dChyZWM6IGFueSAsIHJlbW92ZWRQcm9wZXJ0aWVzOiBzdHJpbmdbXSkge1xuICB2YXIgcmVzID0ge307XG4gIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHJlYykuZmlsdGVyKCBwbiA9PiByZW1vdmVkUHJvcGVydGllcy5pbmRleE9mKHBuKSA8IDApLmZvckVhY2goIHBuID0+IFxuICAgIHJlc1twbl0gPSByZWNbcG5dXG4gICk7XG4gIHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmbGF0dGVuRGVlcCggcmVjIDogYW55LCBjb21wYWN0IDogc3RyaW5nW10pIDogYW55W10ge1xuICB2YXIgcmVzID0gW2NvcHlBbGxCdXQocmVjLGNvbXBhY3QpXTtcbiAgLy8gd2UgY29uc3RydWN0IHRoZSBuZXcgcmVjb3JkcyBcbiAgY29tcGFjdC5mb3JFYWNoKCBjID0+IHsgIFxuICAgIHZhciBuZXh0ID0gW107XG4gICAgcmVzLmZvckVhY2goIGJhc2UgPT4ge1xuICAgICAgLy8gY29weSBhbGwgcHJvcGVydGllcyBmcm9tIHJlc1tjXSBpbnRvIGVhY2ggYmFzZTsgXG4gICAgICBhc3NlcnQoXy5pc0FycmF5KHJlY1tjXSkpOyAvLyB3aGF0IGlmIHRoaXMgaXMgZW1wdHk/XG4gICAgICByZWNbY10uZm9yRWFjaCggb2JqID0+IHtcbiAgICAgICAgaWYgKCB0eXBlb2Ygb2JqID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICB2YXIgbmIgPSBfLmNsb25lKGJhc2UpO1xuICAgICAgICAgIE9iamVjdC5hc3NpZ24obmIsb2JqKTtcbiAgICAgICAgICBuZXh0LnB1c2gobmIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBuYiA9IF8uY2xvbmUoYmFzZSk7XG4gICAgICAgICAgbmJbY10gPSBvYmo7XG4gICAgICAgICAgbmV4dC5wdXNoKG5iKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmVzID0gbmV4dDtcbiAgfSk7XG4gIHJldHVybiByZXM7XG59XG5cbiBleHBvcnQgZnVuY3Rpb24gYXBwbHlQcm9qZWN0Q29sbGVjdGluZyhyZXM6YW55W10sIHJlYzphbnksIHByb2plY3Q6IGFueSk6IGFueVtdIHtcbiAgLy8gMSkgcmV0cmlldmUgb255bCBtZW1iZXJzIHBhcnQgb2YgdGhlIHByb2plY3QsIGZsYXR0ZW5pbmcgdGhlIHJlY29yZHMgaW4gdGhlIHByb2Nlc3NcbiAgdmFyIGZpZWxkcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHByb2plY3QpO1xuICB2YXIgc2VlbiA9IHt9O1xuICB2YXIgY29tcGFjdCA9IFtdO1xuICAvLyAxKSB3ZSBleHBhbmQgYWxsIGNvbGxpbmVhciBpbnRvIGFuIGFycmF5IFsgcmVnYXJkbGVzcyBvZiBvcmlnaW5dICBjb25zdHJ1Y3QgYSB7IGUgOiB4LCAgX2NhdGVnb3JpZXMgOiBbIHsgeCA6IGEsIGIgOiBbIHsgeDogYSwgYjogYX0gfSBdfVxuICB2YXIgdG1wbCA9IHt9O1xuICBmaWVsZHMuZm9yRWFjaCggZiA9PiB7XG4gICAgaWYgKCAhc2VlbltmXSkge1xuICAgICAgdmFyIGZ1bGxwYXRoID0gKHByb2plY3RbZl0gPT0gMSk/ICBmIDogcHJvamVjdFtmXTtcbiAgICAgIHZhciBwYXRoID0gZnVsbHBhdGguc3BsaXQoXCIuXCIpO1xuICAgICAgaWYgKCBwYXRoLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgIGlmICggXy5pc0FycmF5KHJlY1tmdWxscGF0aF0pKSB7XG4gICAgICAgICAgY29tcGFjdC5wdXNoKGZ1bGxwYXRoKVxuICAgICAgICAgIHRtcGxbZl0gPSByZWNbZnVsbHBhdGhdO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIGlmICggdHlwZW9mIHJlY1tmdWxscGF0aF0gPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgIC8vIHRoaXMgY2Fubm90IGJlLCBcbiAgICAgICAgICB0aHJvdyBcIlVuYWJsZSB0byBleHRyYWN0IG1lbWJlciBcIiArIGZ1bGxwYXRoICsgXCIgZnJvbSBcIiArIEpTT04uc3RyaW5naWZ5KHJlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdG1wbFtwYXRoXSA9IHJlY1tmdWxscGF0aF07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBjb2xsZWN0IHByZWZpeGUgc2V0LCBjcmVhdGUgcHNldWRvIHByb2plY3Rpb24gZnJvbSBpdC4gXG4gICAgICAgIHZhciBwcmVmaXggPSBwYXRoWzBdO1xuICAgICAgICBjb21wYWN0LnB1c2gocHJlZml4KTtcbiAgICAgICAgdmFyIHByb2pTdWZmaXggPSBmaWx0ZXJQcm9qZWN0KHByb2plY3QscHJlZml4KTtcbiAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocHJvalN1ZmZpeCkuZm9yRWFjaCggYT0+IHNlZW5bYV0gPSAxKTtcbiAgICAgICAgdmFyIGxvY2FsRXhwYW5kID0gYXBwbHlQcm9qZWN0KHdyYXBBcnJheShyZWNbcHJlZml4XSksIHByb2pTdWZmaXgpO1xuICAgICAgICB0bXBsW3ByZWZpeF0gPSBsb2NhbEV4cGFuZDtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICB2YXIgYXVnID0gZmxhdHRlbkRlZXAodG1wbCwgY29tcGFjdCk7XG4gIHJldHVybiByZXMuY29uY2F0KGF1Zyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0RlZXAoYTphbnkpIHtcbiAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGEpLnNvbWUoIHAgPT4gXy5pc09iamVjdChhW3BdKSB8fCBfLmlzQXJyYXkoYVtwXSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFrZUtleShhKSAgOiBzdHJpbmcge1xuICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoYSkubWFwKCBrID0+ICcnKyAoYVtrXSB8fCAnJykpLmpvaW4oJ19fJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0FsbFByb3BzRW1wdHkocyA6IHN0cmluZykge1xuICByZXR1cm4gcy5zZWFyY2goL1teX10vKSA8IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVEdXBsaWNhdGVzKHJlY29yZHM6IGFueVtdKSB7XG4gIHZhciBzZWVuID0ge307XG4gIHJldHVybiByZWNvcmRzLmZpbHRlciggYSA9PiB7IHZhciBzID0gbWFrZUtleShhKTsgdmFyIHJlcyA9IGlzRGVlcChhKSB8fCAoIWlzQWxsUHJvcHNFbXB0eShzKSAmJiAhc2VlbltzXSk7IHNlZW5bc10gPSAxOyByZXR1cm4gcmVzOyB9KTtcbn1cblxuXG4vKipcbiAqIGlmIG1lbWJlciBvZiB1bndpbmQgcG9pbnRzIHRvIGFuIGFycmF5LCBleHBhbmQgaXQuIFxuICogQHBhcmFtIHJlY29yZHMgSSBcbiAqIEBwYXJhbSB1bndpbmQgXG4gKiBAcGFyYW0gYW55IFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlVbndpbmQocmVjb3JkczphbnlbXSwgdW53aW5kIDogYW55KSA6IGFueVtdIHtcbiAgdmFyIHJlcyA9IFtdO1xuICBkZWJ1Z2dlcjtcbiAgdmFyIHByb3AgPSB1bndpbmQucGF0aDtcbiAgcmVjb3Jkcy5mb3JFYWNoKCByID0+IHtcbiAgICBpZiAoIF8uaXNBcnJheShyW3Byb3BdKSAmJiByW3Byb3BdLmxlbmd0aCA+IDAgKSB7XG4gICAgICByW3Byb3BdLmZvckVhY2goIGVsID0+IHtcbiAgICAgICAgdmFyIHJjID0gXy5jbG9uZURlZXAocik7XG4gICAgICAgIHJjW3Byb3BdID0gZWw7XG4gICAgICAgIHJlcy5wdXNoKHJjKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXMucHVzaChyKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTb3J0KHJlY29yZHM6YW55W10sIG1hdGNoOiBhbnkpIDogYW55W10ge1xuICB2YXIgcHJvcHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhtYXRjaCk7XG4gIHJlY29yZHMuc29ydCggKGEsYikgPT4geyBcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBmYWMgPSAxO1xuICAgICAgaWYgKCBtYXRjaFtwcm9wc1tpXV0gPT0gLTEpIHtcbiAgICAgICAgZmFjID0gLTE7XG4gICAgICB9XG4gICAgICB2YXIgbGhzID0gYVtwcm9wc1tpXV07XG4gICAgICB2YXIgcmhzID0gYltwcm9wc1tpXV07XG4gICAgICBpZiggbGhzID4gcmhzKSB7XG4gICAgICAgIHJldHVybiArZmFjO1xuICAgICAgfSBlbHNlIGlmICggbGhzIDwgcmhzICkge1xuICAgICAgICByZXR1cm4gLWZhYztcbiAgICAgIH0gZWxzZSBpZiAoIGxocyA9PSB1bmRlZmluZWQgKSB7XG4gICAgICAgIHJldHVybiArZmFjO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gMDtcbiAgIH0pO1xuICByZXR1cm4gcmVjb3JkczsgXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0ZXAocmVjb3JkczphbnlbXSwgcXVlcnlTdGVwOiBhbnkpIDogYW55W10ge1xuICBpZiggcXVlcnlTdGVwW1wiJG1hdGNoXCJdKSB7XG4gICAgcmV0dXJuIGFwcGx5TWF0Y2gocmVjb3JkcywgcXVlcnlTdGVwW1wiJG1hdGNoXCJdKVxuICB9IGVsc2UgaWYgKCBxdWVyeVN0ZXBbXCIkcHJvamVjdFwiXSkge1xuICAgIHJldHVybiBhcHBseVByb2plY3QocmVjb3JkcywgcXVlcnlTdGVwW1wiJHByb2plY3RcIl0pOyAgICBcbiAgfSBlbHNlIGlmICggcXVlcnlTdGVwW1wiJHNvcnRcIl0gKSB7XG4gICAgcmV0dXJuIGFwcGx5U29ydChyZWNvcmRzLCBxdWVyeVN0ZXBbXCIkc29ydFwiXSk7XG4gIH0gZWxzZSBpZiAoIHF1ZXJ5U3RlcFtcIiR1bndpbmRcIl0gKSB7XG4gICAgcmV0dXJuIGFwcGx5VW53aW5kKHJlY29yZHMsIHF1ZXJ5U3RlcFtcIiR1bndpbmRcIl0pO1xuICB9IFxuICBlbHNlIGlmICggcXVlcnlTdGVwW1wiJGdyb3VwXCJdIHx8IHF1ZXJ5U3RlcFtcIiR1bndpbmRcIl0gKXtcbiAgICByZXR1cm4gcmVjb3JkcztcbiAgfVxuICBjb25zb2xlLmxvZygndW5rbm93biBzdGVwICcgKyBKU09OLnN0cmluZ2lmeShxdWVyeVN0ZXApKTtcbiAgcmV0dXJuIHJlY29yZHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJCeVF1ZXJ5KHJlY29yZHM6YW55W10sIHF1ZXJ5OiBhbnkpOiBhbnlbXSB7XG4gIHZhciByZXMgPSByZWNvcmRzO1xuICBkZWJ1Z2dlcjtcbiAgcXVlcnkuZm9yRWFjaCggcWNvbXAgPT4geyByZXMgPSBhcHBseVN0ZXAocmVzLHFjb21wKX0pO1xuICByZXR1cm4gcmVtb3ZlRHVwbGljYXRlcyhyZXMpO1xufVxuXG5cbmNsYXNzIEFQc2V1ZG9Nb2RlbCBpbXBsZW1lbnRzIElQc2V1ZG9Nb2RlbCB7XG4gIG1vZGVsbmFtZSA6IHN0cmluZztcbiAgcmVjb3JkcyA6IGFueVtdO1xuICBzY2hlbWEgOiBhbnk7XG4gIGNvbnN0cnVjdG9yKCBtb2RlbE5hbWUgOiBzdHJpbmcsIHJlY29yZHM6IGFueVtdLCBzY2hlbWEgOiBhbnkpIHtcbiAgICB0aGlzLm1vZGVsbmFtZSA9IG1vZGVsTmFtZTsgXG4gICAgdGhpcy5yZWNvcmRzID0gcmVjb3JkczsgXG4gICAgdGhpcy5zY2hlbWEgPSBzY2hlbWE7XG4gIH1cbiAgYWdncmVnYXRlU3lub255bXMoKSA6IFByb21pc2U8SVN5bm9ueW1bXT4ge1xuICAgIHZhciBzZWxmID0gdGhpcztcbi8qXG4gICAgXCJfc3lub255bXNcIiA6IFtcbiAgICAgIHsgXCJjYXRlZ29yeVwiIDogXCJvYmplY3QgbmFtZVwiLFxuICAgICAgICBcImZhY3RcIiA6IFwiZWFydGhcIixcbiAgICAgICAgXCJzeW5vbnltc1wiIDogWyBcImJsdWUgcGxhbmV0XCIgLCBcImdhaWFcIl1cbiAgICAgIH0sXG4gICAgICB7IFwiY2F0ZWdvcnlcIiA6IFwib3JiaXRzXCIsXG4gICAgICAgIFwiZmFjdFwiIDogXCJTdW5cIixcbiAgICAgICAgXCJzeW5vbnltc1wiIDogWyBcIlNvbFwiXVxuICAgICAgfVxuICAgICAgKi9cbiAgICB2YXIgcmVzID0gW10gYXMgSVN5bm9ueW1bXTtcbiAgICBzZWxmLnJlY29yZHMuZm9yRWFjaCggcmVjID0+IHtcbiAgICAgICAgdmFyIHN5biA9IE1vbmdvTWFwLmdldE1lbWJlckJ5UGF0aChyZWMsW1wiX3N5bm9ueW1zXCJdKTtcbiAgICAgICAgaWYgKCBzeW4gKSB7XG4gICAgICAgICAgcmVzID0gcmVzLmNvbmNhdChzeW4pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgZGVidWdsb2coJyBmb3VuZCAnICsgcmVzLmxlbmd0aCArICcgc3lub255bXMgZm9yICcgKyB0aGlzLm1vZGVsbmFtZSk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPElTeW5vbnltW10+KCAocmVzb2x2ZSxyZWplY3QpID0+IHsgcmVzb2x2ZShyZXMpfSk7ICAgIFxuICB9XG4gIGRpc3RpbmN0RmxhdCggbW9kZWxQYXRoIDogSU1vZGVsUGF0aCApIDogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHZhciBvID0ge307XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMucmVjb3Jkcy5mb3JFYWNoKCByZWMgPT4gXG4gICAgICB7IHZhciByID0gTW9uZ29NYXAuZ2V0TWVtYmVyQnlQYXRoKHJlYywgbW9kZWxQYXRoLnBhdGhzKTtcbiAgICAgICAgaWYoXy5pc0FycmF5KHIpKSB7XG4gICAgICAgICAgci5mb3JFYWNoKCBrID0+IG9ba10gPSBrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoIHIgKSB7XG4gICAgICAgICAgICBvW3JdID0gcjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIHZhciByZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhvKS5tYXAoIChrKSA9PiBvW2tdKS5zb3J0KCk7XG4gICAgcmV0dXJuIGFzUHJvbWlzZShyZXMpO1xuICB9XG4gIGRpc3RpbmN0KCBwYXRoIDogc3RyaW5nKSA6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHN0cmluZ1tdPiggKHJlc29sdmUscmVqZWN0KSA9PiB7XG4gICAgICB2YXIgbyA9IHt9O1xuICAgICAgLy8gVE9ETzogbm90IG9ubHkgZGlyZWN0IHByb3BcbiAgICAgIHNlbGYucmVjb3Jkcy5mb3JFYWNoKCBhID0+IGNvbnNvbGUubG9nKFwiaGVyZSBvbmUgXCIgKyBhW3BhdGhdKSk7XG4gICAgICBzZWxmLnJlY29yZHMuZm9yRWFjaCggYSA9PiB7IFxuICAgICAgICB2YXIgdSA9IGFbcGF0aF07XG4gICAgICAgIGlmKCBfLmlzQXJyYXkodSkpIHtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9bYVtwYXRoXV0gPSBhW3BhdGhdOyBcbiAgICAgICAgfVxuICAgICAgXG4gICAgICB9KTtcbiAgICAgIHJlc29sdmUoT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMobykubWFwKCAoaykgPT4gb1trXSkuc29ydCgpKTtcbiAgICB9KTsgICAgXG4gIH1cbiAgZmluZChxdWVyeTogYW55KSA6IFByb21pc2U8YW55W10+IHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKCBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhxdWVyeSkubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxJU3lub255bVtdPiggKHJlc29sdmUscmVqZWN0KSA9PiB7IHJlc29sdmUoc2VsZi5yZWNvcmRzKX0pOyAgICBcbiAgICB9XG4gICAgZGVidWdnZXI7XG4gICAgY29uc29sZS5sb2coXCJmaW5kIFwiICsgSlNPTi5zdHJpbmdpZnkocXVlcnkpKTtcbiAgICB0aHJvdyBcIkZpbmQgXCIgKyBKU09OLnN0cmluZ2lmeShxdWVyeSk7XG4gIH1cbiAgYWdncmVnYXRlKHF1ZXJ5IDogYW55KSA6IFByb21pc2U8YW55W10+IHtcbiAgICBkZWJ1Z2xvZyhcIkFnZ3JlZ2F0ZSBcIiArIEpTT04uc3RyaW5naWZ5KHF1ZXJ5KSk7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciByZXMgPSBmaWx0ZXJCeVF1ZXJ5KHNlbGYucmVjb3JkcyxxdWVyeSk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPElTeW5vbnltW10+KCAocmVzb2x2ZSxyZWplY3QpID0+IHsgcmVzb2x2ZShyZXMpfSk7ICAgIFxuICB9XG59XG5cbmNsYXNzIEFTcmNIYW5kbGUgaW1wbGVtZW50cyBJU3JjSGFuZGxlIHtcbiAgX21vZGVsTmFtZXMgOiBzdHJpbmdbXTtcbiAgX3BzZXVkb01vZGVscyA6IE1hcDxTdHJpbmcsSVBzZXVkb01vZGVsPjtcbiAgbmFtZTogc3RyaW5nO1xuICBwYXRoIDogc3RyaW5nO1xuICBjb25zdHJ1Y3RvcihwYXRoOiBzdHJpbmcpIHtcbiAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgIHRoaXMuX3BzZXVkb01vZGVscyA9IHt9IGFzIE1hcDxTdHJpbmcsSVBzZXVkb01vZGVsPjsgXG4gIH1cbiAgbW9kZWxOYW1lcygpIDogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLl9tb2RlbE5hbWVzO1xuICB9XG4gIGdldFBhdGgoKSA6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMucGF0aDtcbiAgfVxuICBtb2RlbCggbmFtZSA6IHN0cmluZyApIDogSVBzZXVkb01vZGVsIHtcbiAgICByZXR1cm4gdGhpcy5fcHNldWRvTW9kZWxzW25hbWVdO1xuICB9XG4gIHNldE1vZGVsKG1vZGVsTmFtZSA6IHN0cmluZyAsIHJlY29yZHMgOmFueSwgc2NoZW1hIDogYW55KSB7XG4gICAgZGVidWdsb2coXCJTZXR0aW5nIG1vZGVsIFwiICsgbW9kZWxOYW1lICsgXCIgd2l0aCBcIiArIHJlY29yZHMubGVuZ3RoICsgXCIgcmVjb3JkcyBcIik7XG4gICAgdGhpcy5fcHNldWRvTW9kZWxzW21vZGVsTmFtZV0gPSBuZXcgQVBzZXVkb01vZGVsKG1vZGVsTmFtZSwgcmVjb3Jkcywgc2NoZW1hKTsgXG4gIH1cbiAgY29ubmVjdCggY29ubmVjdGlvblN0cmluZyA6IHN0cmluZyApIDogUHJvbWlzZTxJU3JjSGFuZGxlPiB7XG4gICAgdGhpcy5uYW1lID0gY29ubmVjdGlvblN0cmluZzsgXG4gICAgaWYgKCB0aGlzLm5hbWUuaW5kZXhPZihcIjJcIik+PSAwKSB7XG4gICAgICB0aGlzLnBhdGggPSBcIi4vdGVzdG1vZGVsMlwiICsgXCIvXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucGF0aCA9IFwiLi90ZXN0bW9kZWxcIiArIFwiL1wiO1xuICAgIH1cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPElTcmNIYW5kbGU+KCAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBmcy5yZWFkRmlsZSggdGhpcy5wYXRoICsgXCJtb2RlbHMuanNvblwiLCAoZXJyLCBidWZmZXIgKSA9PiB7XG4gICAgICAgIGlmICggZXJyICkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG4gICAgICAgc2VsZi5fbW9kZWxOYW1lcyA9IEpTT04ucGFyc2UoYnVmZmVyLnRvU3RyaW5nKCd1dGYtOCcpKSBhcyBhbnk7IFxuICAgICAgICBkZWJ1Z2xvZyhcIlJlYWQgbW9kZWxuYW1lcyBcIiArIEpTT04uc3RyaW5naWZ5KCBzZWxmLl9tb2RlbE5hbWVzKSArIFwiIHRoaXMucGF0aCA9XCIgKyBzZWxmLnBhdGgpO1xuICAgICAgICByZXNvbHZlKHNlbGYpO1xuICAgICAgfSlcbiAgICB9KTtcbiAgfVxuICBnZXRKU09OKGZpbGVuYW1lIDogc3RyaW5nKSA6IFByb21pc2U8YW55PiB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBmdWxsZmlsZSA9IHRoaXMucGF0aCArIGZpbGVuYW1lO1xuICAgIC8vY29uc29sZS5sb2coJyByZWFkIGZpbGUgJyArIGZ1bGxmaWxlKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2U8YW55PiggKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgZnMucmVhZEZpbGUoIGZ1bGxmaWxlLCAoZXJyLCBidWZmZXIgKSA9PiB7XG4gICAgICAgIGlmICggZXJyICkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGZ1bGxmaWxlICsgZXJyKTtcbiAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRhdGEgPSBKU09OLnBhcnNlKGJ1ZmZlci50b1N0cmluZygndXRmLTgnKSkgYXMgYW55OyBcbiAgICAgICAgcmVzb2x2ZShkYXRhKTtcbiAgICAgIH0pXG4gICAgfSk7XG4gIH1cbiAgZ2V0SlNPTkFycihmaWxlbmFtZSA6IHN0cmluZyApIDogUHJvbWlzZTxhbnlbXT4ge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZnVsbGZpbGUgPSB0aGlzLnBhdGggKyBmaWxlbmFtZTtcbiAgICAvL2NvbnNvbGUubG9nKCcgcmVhZCBmaWxlICcgKyBmdWxsZmlsZSk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPGFueVtdPiggKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgZnMucmVhZEZpbGUoIGZ1bGxmaWxlLCAoZXJyLCBidWZmZXIgKSA9PiB7XG4gICAgICAgIGlmICggZXJyICkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGZ1bGxmaWxlKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgICAgIHZhciBkYXRhID0gSlNPTi5wYXJzZShidWZmZXIudG9TdHJpbmcoJ3V0Zi04JykpIGFzIGFueTsgXG4gICAgICAgIHJlc29sdmUoW2RhdGFdKTtcbiAgICAgIH0pXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNvdXJjZUhhbmRsZSgpICA6IElTcmNIYW5kbGUge1xuICByZXR1cm4gbmV3IEFTcmNIYW5kbGUoXCJcIik7IFxufSJdfQ==
