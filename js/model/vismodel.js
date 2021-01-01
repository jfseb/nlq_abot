"use strict";
/**
 * visualize a model and calculate some statistics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tabModels = exports.visModels = exports.tabDomain = exports.graphDomain = exports.calcCategoryRecord = exports.makeLunrIndex = exports.JSONEscape = void 0;
const fs = require("fs");
const index_model_1 = require("../model/index_model");
const Util = require("abot_utils");
const Describe = require("../match/describe");
const _ = require("lodash");
const debug = require("debugf");
//import * as elasticlunr from 'elasticlunr';
var debuglog = debug('vismodel');
;
var elasticlunr = require('elasticlunr');
function JSONEscape(s) {
    return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n")
        .replace(/\'/g, "\\'")
        .replace(/\"/g, '\\"')
        .replace(/\&/g, "\\&")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
    // .replace(/\b/g, "\\b")
    // .replace(/\f/g, "\\f");
}
exports.JSONEscape = JSONEscape;
;
function makeLunrIndex(imodels, modelname, silent) {
    var modelPath = imodels.mongoHandle.srcHandle.getPath();
    var modelDoc = imodels.mongoHandle.modelDocs[modelname];
    if (!modelDoc) {
        throw " Unknown model name " + modelname + " known names are " + Object.getOwnPropertyNames(imodels.mongoHandle.modelDocs).join(',');
    }
    //var mdl = JSON.parse('' + fs.readFileSync(modelPath + '.model.json'));
    //var data = JSON.parse('' + fs.readFileSync(modelpath + '.data.json'));
    /*
      "_categories": [
        {
          "category": "element name",
          "category_description": "element name",
          "QBEColumnProps": {
            "defaultWidth": 120,
            "QBE": true,
            "LUNRIndex": true
          },
          "wordindex" : true,
          "category_synonyms": [
            "name"
          ]
        },
    */
    var cats = modelDoc._categories;
    var qbeDataObjects = cats.filter(cat => { var _a, _b; return ((((_a = cat.QBEColumnProps) === null || _a === void 0 ? void 0 : _a.QBE) == true) || ((_b = cat.QBEColumnProps) === null || _b === void 0 ? void 0 : _b.QBEInclude)); });
    //console.log("here cats" + JSON.stringify(cats));
    //console.log("\nhere data objects" + JSON.stringify(qbeDataObjects));
    var qbeDataNames = qbeDataObjects.map(cat => cat.category);
    qbeDataNames = _.union(qbeDataNames, modelDoc.columns);
    console.log(JSON.stringify(qbeDataObjects, undefined, 2));
    var keepAsArray = qbeDataObjects.filter(cat => cat.QBEColumnProps.QBEConcat).map(cat => cat.category);
    var LUNRIndex = cats.filter(cat => { var _a; return (_a = cat.QBEColumnProps) === null || _a === void 0 ? void 0 : _a.LUNRIndex; }).map(cat => cat.category);
    //var elasticlunr = require('lunr');
    var domain = index_model_1.Model.getDomainForModelName(imodels, modelname);
    return index_model_1.Model.getExpandedRecordsSome(imodels, domain, qbeDataNames, keepAsArray).then((data) => {
        // index all LUNR properties
        var elasticindex = elasticlunr(function () {
            var that = this;
            LUNRIndex /*
            ["appId",
            "AppKey",
            "AppName",
            "ApplicationComponent",
            "RoleName",
            "ApplicationType",
            "BSPName",
            "BSPApplicationURL",
            "releaseName",
            "BusinessCatalog",
            "TechnicalCatalog"] */
                .forEach(function (field) {
                that.addField(field);
            });
            this.setRef('id');
            this.saveDocument(false);
        });
        data.forEach(function (o, index) {
            o.id = index;
            if (modelname == "iupacs") {
                console.log(" rec" + JSON.stringify(o, undefined, 2));
            }
        });
        var len = data.length;
        data.forEach(function (record, index) {
            if (index % Math.floor(len / 10) == 0) {
                console.log(' ' + index + "/" + len);
            }
            elasticindex.addDoc(record);
        });
        // dump the lunr index
        //
        var theIndex = elasticindex.toJSON();
        var columns = modelDoc.columns.map(colname => {
            var res = cats.filter(cat => cat.category === colname);
            if (res.length !== 1) {
                throw new Error("undefined or non-object column : " + colname);
            }
            ;
            return res[0];
        });
        var columnNames = columns.map(col => col.category);
        var jsonp = `var mdldata = {};\n//columns \n mdldata.columns = ["${columns.map(col => col.category).join('","')}"];`;
        var json = `{ "columns"  : ["${columns.map(col => JSONEscape(col.category)).join('","')}"],`;
        // jsonp += `\n mdldata.fulldata = ${JSON.stringify(bomdata)};\n`;
        //jsonp += `\n//columns info \n mdldata.lunrcolumns = ["{${LUNRIndex.join('","')}"];`;
        jsonp += `\n//columns info \n mdldata.columnsDescription = {${columns.map(col => ` \n "${col.category}" :  "${JSONEscape(col.category_description || col.category)}" `).join(',')}
    };`;
        json += `"columnsDescription" : {${columns.map(col => ` \n "${col.category}" :  "${JSONEscape(col.category_description || col.category)}" `).join(',')}
  },`;
        jsonp += `\n//columns info \n mdldata.columnsDefaultWidth = {${columns.map(col => { var _a; return ` \n "${col.category}" : ${((_a = col.QBEColumnProps) === null || _a === void 0 ? void 0 : _a.defaultWidth) || 150} `; }).join(',')}
  };`;
        json += `\n"columnsDefaultWidth" : {${columns.map(col => { var _a; return ` \n "${col.category}" : ${((_a = col.QBEColumnProps) === null || _a === void 0 ? void 0 : _a.defaultWidth) || 150} `; }).join(',')}
  },`;
        var theIndexStr = JSON.stringify(theIndex);
        jsonp += "\nvar serIndex =\"" + JSONEscape(theIndexStr) + "\";\n";
        // jsonp += "\nvar serIndex =" + JSON.stringify(theIndex) + ";\n";
        json += '\n"serIndex" :' + theIndexStr + ',';
        //console.log("here all names " + JSON.stringify(qbeDataNames));
        var cleanseddata = data.map(o => {
            var res = {};
            qbeDataNames.forEach(key => {
                res[key] = o[key];
                if (keepAsArray.indexOf(key) >= 0 && _.isArray(o[key])) {
                    res[key] = o[key].join(",");
                }
            });
            return res;
        });
        var output = modelPath + "gen_" + modelname + ".lunr.json";
        if (!silent) {
            console.log("dumping " + output);
            console.log("length of index str" + theIndexStr.length);
            console.log("available          " + columns.length + " columns");
            console.log("returning as data  " + qbeDataNames.length + " columns");
            console.log("indexing           " + LUNRIndex.length + " columns");
            console.log('returned but not available', _.difference(qbeDataNames, columnNames).join(", "));
            console.log('returned but not indexed', _.difference(qbeDataNames, LUNRIndex).join(", "));
        }
        jsonp += "var data=" + JSON.stringify(cleanseddata) + ";";
        json += '"data":' + JSON.stringify(cleanseddata) + "\n}";
        jsonp += `

  // var elastic = elasticlunr.Index.load(serIndex);

  `;
        //fs.writeFileSync(output + ".lunr.js", jsonp);
        console.log('Writing lunr index for ' + modelname + " as file " + output);
        fs.writeFileSync(output, json);
    });
}
exports.makeLunrIndex = makeLunrIndex;
/*

  var index = elastilunr.Index.load(obj);


}

 "QBE" : false,
      "QBEInclude" : true,
      "LUNRIndex": false
*/
function calcCategoryRecord(m, category, domain, cache) {
    var otherdomains = index_model_1.Model.getDomainsForCategory(m, category);
    _.pull(otherdomains, domain);
    var res = {
        otherdomains: otherdomains,
        nrDistinctValues: 0,
        nrDistinctValuesInDomain: 0,
        nrRecords: 0,
        nrRecordsInDomain: 0,
        nrTotalRecordsInDomain: 0,
    };
    if (cache) {
        debuglog('got a cache' + Object.keys(cache));
    }
    cache = cache || {};
    function getDomainRecords(dom) {
        if (cache[dom]) {
            debuglog('seen domain ' + dom);
            return Promise.resolve(cache[dom]);
        }
        else {
            debuglog('not seen domain ' + dom);
            var p = index_model_1.Model.getExpandedRecordsFirst(m, dom);
            return p.then((records) => {
                cache[dom] = records;
                return records;
            });
        }
    }
    var values = [];
    var valuesInDomain = [];
    var nrRecordsInDomain = 0;
    debuglog('investigating' + domain + ' category' + category);
    return getDomainRecords(domain).then((records) => {
        res.nrTotalRecordsInDomain = records.length;
        var distinctValues = records.forEach(function (oEntry) {
            if (oEntry[category]) {
                var value = oEntry[category];
                valuesInDomain[value] = (valuesInDomain[value] || 0) + 1;
                res.nrRecordsInDomain += 1;
                values[value] = (values[value] || 0) + 1;
                res.nrRecords += 1;
            }
        });
    }).then(() => Promise.all(otherdomains.map(od => getDomainRecords(od).then((records) => {
        //res.nrTotalRecordsInDomain = records.length;
        var distinctValues = records.forEach(function (oEntry) {
            if (oEntry[category]) {
                var value = oEntry[category];
                //valuesInDomain[value] = (valuesInDomain[value] || 0) + 1;
                //res.nrRecordsInDomain += 1;
                values[value] = (values[value] || 0) + 1;
                res.nrRecords += 1;
            }
        });
    }))).then(() => {
        res.nrDistinctValues = Object.keys(values).length;
        res.nrDistinctValuesInDomain = Object.keys(valuesInDomain).length;
        return res;
    }));
}
exports.calcCategoryRecord = calcCategoryRecord;
function graphDomain(domain, m, domainRecordCache) {
    // draw a model domains
    var res = `
    digraph sdsu {
	size="36,36";
   rankdir=LR
	node [color=yellow, style=filled];
    "${domain}"
  `;
    // add all category nodes
    res += `node [shape=record, color=yellow, style=filled];\n `;
    var cats = index_model_1.Model.getCategoriesForDomain(m, domain);
    var domainRecordCache = domainRecordCache || {};
    var categoryResults = {};
    var otherdomains = [];
    var nrRecords = 0;
    var p = Promise.resolve();
    cats.forEach(function (cat) {
        p = p.then(() => {
            return calcCategoryRecord(m, cat, domain, domainRecordCache).then((catResult) => {
                debuglog('got result for ' + domain + ' ' + cat);
                nrRecords = catResult.nrTotalRecordsInDomain;
                categoryResults[cat] = catResult;
                otherdomains = _.union(otherdomains, categoryResults[cat].otherDomains);
                res += `"${cat}" [label="{ ${cat} | ${catResult.nrDistinctValuesInDomain} Values in ${catResult.nrRecordsInDomain} `;
                if (catResult.nrRecordsInDomain !== catResult.nrRecords) {
                    res += `|  ${catResult.nrDistinctValues - catResult.nrDistinctValuesInDomain} other values in ${catResult.nrRecords - catResult.nrRecordsInDomain} other records`;
                }
                else {
                    res += ` `;
                }
                res += `}"]\n`;
            });
        });
    });
    return p.then(() => {
        // calculate other domains.
        // draw "other categories"
        res += `node [color=purple, style=filled]; \n`;
        otherdomains.forEach(function (otherdomain) {
            res += `"${otherdomain}" \n`;
        });
        // count records in domain :
        /* var nrRecords = m.records.reduce(function (prev, entry) {
            return prev + ((entry._domain === domain) ? 1 : 0);
          }, 0);
          */
        res += `node [shape=record]; \n`;
        res += ` "record" [label="{<f0> ${domain} | ${nrRecords}}"] \n`;
        res += ` "r_other" [label="{<f0> other | ${nrRecords}}"] \n `;
        res += `# relation from categories to domain\n`;
        cats.forEach(function (cat) {
            res += ` "${cat}" -> "${domain}" \n`;
        });
        res += `# relation from categories to records\n`;
        cats.forEach(function (cat) {
            var rec = categoryResults[cat];
            res += ` "${cat}" -> "record" \n`;
        });
        //other domains to this
        cats.forEach(function (cat) {
        });
        /*
        cats fo
          digraph sdsu {
        size="36,36";
        node [color=yellow, style=filled];
        FLPD FLP "BOM Editor", "WIKIURL" "UI5 Documentation", "UI5 Example", "STARTTA"
        BCP
        node [color=grey, style=filled];
        node [fontname="Verdana", size="30,30"];
        node [color=grey, style=filled];
        graph [ fontname = "Arial",
        */
        res += `}\n`;
        return res;
    });
}
exports.graphDomain = graphDomain;
/*
    categoryDesc : theModel.full.domain[filterdomain].categories[category],
    distinct : distinct,
    delta : delta,
    presentRecords : recordCount.presentrecords,
    percPresent : percent,
    sampleValues : valuesList
  }
*/
function replaceBr(string) {
    string = string.replace(/\n/g, `
\t\t\t\t\t\t\t\t\t\t\tbr
\t\t\t\t\t\t\t\t\t\t\t| `);
    return string;
}
/**
 * generate a textual representation of a domain
 */
function tabDomain(domain, m) {
    // draw a model domains
    var res = '';
    var modelCache = {};
    var cats = index_model_1.Model.getCategoriesForDomain(m, domain);
    cats = index_model_1.Model.sortCategoriesByImportance(m.full.domain[domain].categories || {}, cats);
    //console.log(cats.join("\n"));
    return Describe.getCategoryStatsInDomain(cats[0], domain, m).then((catResult0) => {
        return calcCategoryRecord(m, cats[0], domain, modelCache).then((catResult1) => {
            var domainDescr = m.full.domain[domain].description || "";
            domainDescr = replaceBr(domainDescr);
            res = `
extends ../layout_p

block content

	nav.navbar.navbar-default.navbar-fixed-top
		.container
			.navbar-header
				.navbar-brand(style='bgcolor:orange;color:darkblue;font-family:Arial Black;font-size:15.118px') wosap domain ${domain}
			ul.nav.navbar-nav.navbar-right #{uid}
				li
					.navbar-btn#btn-logout.btn.btn-default(onclick="location.href='/home'")
						| back to home

	p  &nbsp;
	p &nbsp;
	p

	div.well
		h3 domain "${domain}"
			span.pull-right ${catResult1.nrTotalRecordsInDomain} records
		p
		span ${domainDescr}

		table.table.table-condensed.table-striped
			thead
				tr
					th category
					th(style="width:10%") count
					th
						table
							tr
								td synonyms
							tr
								td description
							tr
								td example values
			tbody
`;
            var categoryResults = {};
            var otherdomains = [];
            var categoryMap = m.full.domain[domain].categories || {};
            var pTail = Promise.resolve();
            cats.forEach(function (cat) {
                pTail = pTail.then(() => {
                    return Describe.getCategoryStatsInDomain(cat, domain, m).then(catdesc => {
                        return calcCategoryRecord(m, cat, domain, modelCache).then((catResult2) => {
                            categoryResults[cat] = catResult2;
                            otherdomains = _.union(otherdomains, categoryResults[cat].otherDomains);
                            /*
                                res += `"${cat}" [label="{ ${cat} | ${catResult.nrDistinctValuesInDomain} Values in ${catResult.nrRecordsInDomain} `;
                                if(catResult.nrRecordsInDomain !== catResult.nrRecords) {
                                  res +=  `|  ${catResult.nrDistinctValues - catResult.nrDistinctValuesInDomain} other values in ${catResult.nrRecords - catResult.nrRecordsInDomain} other records`;
                                } else {
                                  res += ` `;
                                }
                                res += `}"]\n`;
                            */
                            //console.log(JSON.stringify(m.full.domain[domain]));
                            if (m.full.domain[domain].categories[cat]) {
                                var synonymsString = Util.listToCommaAnd(catdesc.categoryDesc && catdesc.categoryDesc.category_synonyms && catdesc.categoryDesc.category_synonyms || []) || "&nbsp;";
                                res += `
			tr
					td.cat_count ${cat}
\t\t\t\t\ttd ${catdesc.presentRecords} distinct values in ${catdesc.percPresent}% of records
\t\t\t\t\ttd
\t\t\t\t\t\ttable
\t\t\t\t\t\t\ttr.cat_synonyms
\t\t\t\t\t\t\t\ttd ${synonymsString}
\t\t\t\t\t\t\ttr.cat_description
\t\t\t\t\t\t\t\ttd ${replaceBr(catdesc.categoryDesc && catdesc.categoryDesc.category_description || "")}
\t\t\t\t\t\t\ttr.cat_samplevalues
\t\t\t\t\t\t\t\ttd ${replaceBr(catdesc.sampleValues)}
      `;
                            }
                        });
                        //console.log(JSON.stringify(catdesc));
                    });
                });
            });
            return pTail.then(() => {
                var othercats = cats.length - Object.keys(m.full.domain[domain].categories).length;
                var remainingCategories = _.difference(cats, Object.keys(m.full.domain[domain].categories));
                if ((othercats) > 0) {
                    res += `
\t\tp   and ${othercats} other categories
\t\t| ${Util.listToCommaAnd(remainingCategories)}
       `;
                }
                res += `
		h3 Version
			a.small(href="/whatsnew")


block scripts
	script(src='/vendor/jquery-2.2.3.min.js')
	script(src='/vendor/bootstrap.min.js')
	script(src='/js/views/settings.js')
`;
                return res;
            });
        });
    }).then(() => {
        return res;
    });
}
exports.tabDomain = tabDomain;
const child_process_1 = require("child_process");
function execCmd(cmd) {
    child_process_1.exec(cmd, function (error, stdout, stderr) {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });
}
;
function visModels(m, folderOut) {
    // we want to execute the domains in sequence to avoid and out of memory
    var p = Promise.resolve();
    var domainRecordCache = {};
    m.domains.forEach(sDomain => {
        p = p.then(() => {
            return graphDomain(sDomain, m, domainRecordCache).then((s) => {
                debuglog('done with result for ' + sDomain + ' ' + s.length);
                var fnGraph = folderOut + "/" + sDomain.replace(/ /g, '_') + ".gv";
                fs.writeFileSync(fnGraph, s);
                if (process.env.GRAPHVIZ) {
                    console.log("here the file " + fnGraph);
                    execCmd(process.env.GRAPHVIZ + " -Tjpeg -O " + fnGraph);
                }
                return undefined;
            });
        });
    });
    return p;
}
exports.visModels = visModels;
;
function tabModels(m) {
    var p = Promise.resolve();
    var folderOut = m.mongoHandle.srcHandle.getPath();
    if (!fs.existsSync(folderOut + "views")) {
        fs.mkdirSync(folderOut + 'views');
    }
    // copy the layout_p.pug file
    var layout_p = fs.readFileSync('resources/templates_pug/layout_p.pug');
    fs.writeFileSync(folderOut + "views/layout_p.pug", layout_p);
    var excludedModelNames = ["metamodels", "hints", "questions"];
    // generate the models file
    var models = fs.readFileSync('resources/templates_pug/models.pug');
    if (!fs.existsSync(folderOut + "views/models.pug")) {
        console.log('You want to manually adjust  ' + folderOut + "views/models.pug");
        fs.writeFileSync(folderOut + "views/models.pug", models);
    }
    var dumpedModelNames = Object.getOwnPropertyNames(m.rawModelByModelName).filter(modelName => excludedModelNames.indexOf(modelName) < 0);
    dumpedModelNames.forEach(modelName => {
        var domain = m.rawModelByModelName[modelName].domain;
        var table = '' + fs.readFileSync('resources/templates_pug/table_xxx.pug');
        table = table.replace("FioriBOM", domain);
        table = table.replace("js/model_fioribom.lunr.json", "js/gen_" + modelName + ".lunr.json");
        fs.writeFileSync(folderOut + "views/gen_table_" + modelName + ".pug", table);
    });
    m.domains.forEach((sDomain) => {
        p = p.then(() => {
            tabDomain(sDomain, m).then((s) => {
                var modelName = index_model_1.Model.getModelNameForDomain(m.mongoHandle, sDomain);
                var fnGraph = folderOut + "views/gen_model_" + modelName + ".pug";
                debuglog("here the file " + fnGraph);
                console.log('Writing model overview file for ' + modelName + ' as ' + fnGraph);
                fs.writeFileSync(fnGraph, s);
                // 
            });
        });
    });
    return p.then(() => { });
}
exports.tabModels = tabModels;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QyxDQUFDO0FBQzNCLENBQUM7QUExQ0QsOEJBMENDIiwiZmlsZSI6Im1vZGVsL3Zpc21vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiB2aXN1YWxpemUgYSBtb2RlbCBhbmQgY2FsY3VsYXRlIHNvbWUgc3RhdGlzdGljc1xuICovXG5cblxuXG5pbXBvcnQgKiBhcyBJTWF0Y2ggZnJvbSAnLi4vbWF0Y2gvaWZtYXRjaCc7XG5cblxuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuXG5pbXBvcnQgeyBNb2RlbCBhcyBNb2RlbCB9IGZyb20gJy4uL21vZGVsL2luZGV4X21vZGVsJztcblxuaW1wb3J0ICogYXMgVXRpbCBmcm9tICdhYm90X3V0aWxzJztcblxuaW1wb3J0ICogYXMgRGVzY3JpYmUgZnJvbSAnLi4vbWF0Y2gvZGVzY3JpYmUnO1xuXG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBkZWJ1ZyBmcm9tICdkZWJ1Z2YnO1xuXG4vL2ltcG9ydCAqIGFzIGVsYXN0aWNsdW5yIGZyb20gJ2VsYXN0aWNsdW5yJztcblxudmFyIGRlYnVnbG9nID0gZGVidWcoJ3Zpc21vZGVsJyk7XG5cbmludGVyZmFjZSBDYXRlZ29yeVJlY29yZCB7XG4gIG90aGVyZG9tYWluczogc3RyaW5nW10sXG4gIG5yRGlzdGluY3RWYWx1ZXM6IG51bWJlcixcbiAgbnJEaXN0aW5jdFZhbHVlc0luRG9tYWluOiBudW1iZXIsXG4gIG5yUmVjb3JkczogbnVtYmVyLFxuICBuclJlY29yZHNJbkRvbWFpbjogbnVtYmVyLFxuICBuclRvdGFsUmVjb3Jkc0luRG9tYWluOiBudW1iZXJcbn07XG5cbnZhciBlbGFzdGljbHVuciA9IHJlcXVpcmUoJ2VsYXN0aWNsdW5yJyk7XG5cblxuZXhwb3J0IGZ1bmN0aW9uIEpTT05Fc2NhcGUoczogc3RyaW5nKSB7XG5cbiAgcmV0dXJuIHMucmVwbGFjZSgvXFxcXC9nLCBcIlxcXFxcXFxcXCIpLnJlcGxhY2UoL1xcbi9nLCBcIlxcXFxuXCIpXG4gICAgLnJlcGxhY2UoL1xcJy9nLCBcIlxcXFwnXCIpXG4gICAgLnJlcGxhY2UoL1xcXCIvZywgJ1xcXFxcIicpXG4gICAgLnJlcGxhY2UoL1xcJi9nLCBcIlxcXFwmXCIpXG4gICAgLnJlcGxhY2UoL1xcci9nLCBcIlxcXFxyXCIpXG4gICAgLnJlcGxhY2UoL1xcdC9nLCBcIlxcXFx0XCIpO1xuICAvLyAucmVwbGFjZSgvXFxiL2csIFwiXFxcXGJcIilcbiAgLy8gLnJlcGxhY2UoL1xcZi9nLCBcIlxcXFxmXCIpO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VMdW5ySW5kZXgoaW1vZGVscyA6IElNYXRjaC5JTW9kZWxzLCBtb2RlbG5hbWUgOiBzdHJpbmcsIHNpbGVudD86IGJvb2xlYW4pIDogUHJvbWlzZTxhbnk+IHtcblxuICB2YXIgbW9kZWxQYXRoID0gaW1vZGVscy5tb25nb0hhbmRsZS5zcmNIYW5kbGUuZ2V0UGF0aCgpO1xuICB2YXIgbW9kZWxEb2MgPSBpbW9kZWxzLm1vbmdvSGFuZGxlLm1vZGVsRG9jc1ttb2RlbG5hbWVdO1xuICBpZiAoICFtb2RlbERvYykge1xuICAgIHRocm93IFwiIFVua25vd24gbW9kZWwgbmFtZSBcIiArIG1vZGVsbmFtZSArIFwiIGtub3duIG5hbWVzIGFyZSBcIiArIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGltb2RlbHMubW9uZ29IYW5kbGUubW9kZWxEb2NzKS5qb2luKCcsJyk7XG4gIH1cbiAgLy92YXIgbWRsID0gSlNPTi5wYXJzZSgnJyArIGZzLnJlYWRGaWxlU3luYyhtb2RlbFBhdGggKyAnLm1vZGVsLmpzb24nKSk7XG4gIC8vdmFyIGRhdGEgPSBKU09OLnBhcnNlKCcnICsgZnMucmVhZEZpbGVTeW5jKG1vZGVscGF0aCArICcuZGF0YS5qc29uJykpO1xuLypcbiAgXCJfY2F0ZWdvcmllc1wiOiBbXG4gICAge1xuICAgICAgXCJjYXRlZ29yeVwiOiBcImVsZW1lbnQgbmFtZVwiLFxuICAgICAgXCJjYXRlZ29yeV9kZXNjcmlwdGlvblwiOiBcImVsZW1lbnQgbmFtZVwiLFxuICAgICAgXCJRQkVDb2x1bW5Qcm9wc1wiOiB7XG4gICAgICAgIFwiZGVmYXVsdFdpZHRoXCI6IDEyMCxcbiAgICAgICAgXCJRQkVcIjogdHJ1ZSxcbiAgICAgICAgXCJMVU5SSW5kZXhcIjogdHJ1ZVxuICAgICAgfSxcbiAgICAgIFwid29yZGluZGV4XCIgOiB0cnVlLFxuICAgICAgXCJjYXRlZ29yeV9zeW5vbnltc1wiOiBbXG4gICAgICAgIFwibmFtZVwiXG4gICAgICBdXG4gICAgfSxcbiovXG5cbiAgdmFyIGNhdHMgPSBtb2RlbERvYy5fY2F0ZWdvcmllczsgIFxuICB2YXIgcWJlRGF0YU9iamVjdHMgPSBjYXRzLmZpbHRlcihjYXQgPT4gKCAoY2F0LlFCRUNvbHVtblByb3BzPy5RQkUgPT0gdHJ1ZSkgfHwgY2F0LlFCRUNvbHVtblByb3BzPy5RQkVJbmNsdWRlKSk7XG5cbiAgLy9jb25zb2xlLmxvZyhcImhlcmUgY2F0c1wiICsgSlNPTi5zdHJpbmdpZnkoY2F0cykpO1xuICAvL2NvbnNvbGUubG9nKFwiXFxuaGVyZSBkYXRhIG9iamVjdHNcIiArIEpTT04uc3RyaW5naWZ5KHFiZURhdGFPYmplY3RzKSk7XG4gIHZhciBxYmVEYXRhTmFtZXMgPSBxYmVEYXRhT2JqZWN0cy5tYXAoY2F0ID0+IGNhdC5jYXRlZ29yeSk7XG5cbiAgcWJlRGF0YU5hbWVzID0gXy51bmlvbihxYmVEYXRhTmFtZXMsIG1vZGVsRG9jLmNvbHVtbnMpXG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocWJlRGF0YU9iamVjdHMsIHVuZGVmaW5lZCwyKSk7XG4gIHZhciBrZWVwQXNBcnJheSA9IHFiZURhdGFPYmplY3RzLmZpbHRlciggY2F0ID0+IGNhdC5RQkVDb2x1bW5Qcm9wcy5RQkVDb25jYXQgKS5tYXAoY2F0ID0+IGNhdC5jYXRlZ29yeSk7IFxuXG4gIHZhciBMVU5SSW5kZXggPSBjYXRzLmZpbHRlcihjYXQgPT4gY2F0LlFCRUNvbHVtblByb3BzPy5MVU5SSW5kZXgpLm1hcChjYXQgPT4gY2F0LmNhdGVnb3J5KTtcbiAgLy92YXIgZWxhc3RpY2x1bnIgPSByZXF1aXJlKCdsdW5yJyk7XG5cbiAgdmFyIGRvbWFpbiA9IE1vZGVsLmdldERvbWFpbkZvck1vZGVsTmFtZShpbW9kZWxzLCBtb2RlbG5hbWUpOyBcbiAgcmV0dXJuIE1vZGVsLmdldEV4cGFuZGVkUmVjb3Jkc1NvbWUoaW1vZGVscywgZG9tYWluLCBxYmVEYXRhTmFtZXMsa2VlcEFzQXJyYXkpLnRoZW4oIChkYXRhKSA9PiB7ICAgICAgXG4gICAgICAvLyBpbmRleCBhbGwgTFVOUiBwcm9wZXJ0aWVzXG4gICAgICB2YXIgZWxhc3RpY2luZGV4ID0gZWxhc3RpY2x1bnIoZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIExVTlJJbmRleCAvKlxuICAgICAgICBbXCJhcHBJZFwiLFxuICAgICAgICBcIkFwcEtleVwiLFxuICAgICAgICBcIkFwcE5hbWVcIixcbiAgICAgICAgXCJBcHBsaWNhdGlvbkNvbXBvbmVudFwiLFxuICAgICAgICBcIlJvbGVOYW1lXCIsXG4gICAgICAgIFwiQXBwbGljYXRpb25UeXBlXCIsXG4gICAgICAgIFwiQlNQTmFtZVwiLFxuICAgICAgICBcIkJTUEFwcGxpY2F0aW9uVVJMXCIsXG4gICAgICAgIFwicmVsZWFzZU5hbWVcIixcbiAgICAgICAgXCJCdXNpbmVzc0NhdGFsb2dcIixcbiAgICAgICAgXCJUZWNobmljYWxDYXRhbG9nXCJdICovIC5mb3JFYWNoKGZ1bmN0aW9uIChmaWVsZCkge1xuICAgICAgICAgIHRoYXQuYWRkRmllbGQoZmllbGQpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zZXRSZWYoJ2lkJyk7XG4gICAgICAgIHRoaXMuc2F2ZURvY3VtZW50KGZhbHNlKTtcbiAgICAgIH0pO1xuICAgICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChvLCBpbmRleCkge1xuICAgICAgICBvLmlkID0gaW5kZXg7XG4gICAgICAgIGlmICggbW9kZWxuYW1lID09IFwiaXVwYWNzXCIgKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCIgcmVjXCIgKyBKU09OLnN0cmluZ2lmeShvLHVuZGVmaW5lZCwyKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgdmFyIGxlbiA9IGRhdGEubGVuZ3RoO1xuICAgICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChyZWNvcmQsIGluZGV4KSB7XG4gICAgICAgIGlmICggaW5kZXggJSBNYXRoLmZsb29yKGxlbi8xMCkgPT0gMCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCcgJyArIGluZGV4ICsgXCIvXCIgKyBsZW4pO1xuICAgICAgICB9XG4gICAgICAgIGVsYXN0aWNpbmRleC5hZGREb2MocmVjb3JkKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBkdW1wIHRoZSBsdW5yIGluZGV4XG4gICAgICAvL1xuICAgICAgdmFyIHRoZUluZGV4ID0gZWxhc3RpY2luZGV4LnRvSlNPTigpO1xuICAgICAgdmFyIGNvbHVtbnMgPSBtb2RlbERvYy5jb2x1bW5zLm1hcChjb2xuYW1lID0+IHtcbiAgICAgICAgdmFyIHJlcyA9IGNhdHMuZmlsdGVyKGNhdCA9PiBjYXQuY2F0ZWdvcnkgPT09IGNvbG5hbWUpO1xuICAgICAgICBpZiAocmVzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInVuZGVmaW5lZCBvciBub24tb2JqZWN0IGNvbHVtbiA6IFwiICsgY29sbmFtZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiByZXNbMF07XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgdmFyIGNvbHVtbk5hbWVzID0gY29sdW1ucy5tYXAoY29sID0+IGNvbC5jYXRlZ29yeSk7XG4gICAgICBcbiAgICAgIHZhciBqc29ucCA9IGB2YXIgbWRsZGF0YSA9IHt9O1xcbi8vY29sdW1ucyBcXG4gbWRsZGF0YS5jb2x1bW5zID0gW1wiJHtjb2x1bW5zLm1hcChjb2wgPT4gY29sLmNhdGVnb3J5KS5qb2luKCdcIixcIicpfVwiXTtgO1xuICAgICAgXG4gICAgICB2YXIganNvbiA9IGB7IFwiY29sdW1uc1wiICA6IFtcIiR7Y29sdW1ucy5tYXAoY29sID0+IEpTT05Fc2NhcGUoY29sLmNhdGVnb3J5KSkuam9pbignXCIsXCInKX1cIl0sYDtcbiAgICAgIC8vIGpzb25wICs9IGBcXG4gbWRsZGF0YS5mdWxsZGF0YSA9ICR7SlNPTi5zdHJpbmdpZnkoYm9tZGF0YSl9O1xcbmA7XG4gICAgICAvL2pzb25wICs9IGBcXG4vL2NvbHVtbnMgaW5mbyBcXG4gbWRsZGF0YS5sdW5yY29sdW1ucyA9IFtcInske0xVTlJJbmRleC5qb2luKCdcIixcIicpfVwiXTtgO1xuICAgICAgXG4gICAgICBqc29ucCArPSBgXFxuLy9jb2x1bW5zIGluZm8gXFxuIG1kbGRhdGEuY29sdW1uc0Rlc2NyaXB0aW9uID0geyR7Y29sdW1ucy5tYXAoY29sID0+XG4gICAgICBgIFxcbiBcIiR7Y29sLmNhdGVnb3J5fVwiIDogIFwiJHtKU09ORXNjYXBlKGNvbC5jYXRlZ29yeV9kZXNjcmlwdGlvbiB8fCBjb2wuY2F0ZWdvcnkpfVwiIGBcbiAgICAgICkuam9pbignLCcpfVxuICAgIH07YDtcbiAgICBcbiAgICBqc29uICs9IGBcImNvbHVtbnNEZXNjcmlwdGlvblwiIDogeyR7Y29sdW1ucy5tYXAoY29sID0+XG4gICAgICBgIFxcbiBcIiR7Y29sLmNhdGVnb3J5fVwiIDogIFwiJHtKU09ORXNjYXBlKGNvbC5jYXRlZ29yeV9kZXNjcmlwdGlvbiB8fCBjb2wuY2F0ZWdvcnkpfVwiIGBcbiAgICApLmpvaW4oJywnKX1cbiAgfSxgO1xuXG5cbiAganNvbnAgKz0gYFxcbi8vY29sdW1ucyBpbmZvIFxcbiBtZGxkYXRhLmNvbHVtbnNEZWZhdWx0V2lkdGggPSB7JHtjb2x1bW5zLm1hcChjb2wgPT5cbiAgYCBcXG4gXCIke2NvbC5jYXRlZ29yeX1cIiA6ICR7Y29sLlFCRUNvbHVtblByb3BzPy5kZWZhdWx0V2lkdGggfHwgMTUwfSBgXG4gICAgKS5qb2luKCcsJyl9XG4gIH07YDtcblxuICAgIGpzb24gKz0gYFxcblwiY29sdW1uc0RlZmF1bHRXaWR0aFwiIDogeyR7Y29sdW1ucy5tYXAoY29sID0+XG4gICAgICBgIFxcbiBcIiR7Y29sLmNhdGVnb3J5fVwiIDogJHtjb2wuUUJFQ29sdW1uUHJvcHM/LmRlZmF1bHRXaWR0aCB8fCAxNTB9IGBcbiAgICApLmpvaW4oJywnKX1cbiAgfSxgO1xuXG4gIHZhciB0aGVJbmRleFN0ciA9IEpTT04uc3RyaW5naWZ5KHRoZUluZGV4KTtcblxuICBqc29ucCArPSBcIlxcbnZhciBzZXJJbmRleCA9XFxcIlwiICsgSlNPTkVzY2FwZSh0aGVJbmRleFN0cikgKyBcIlxcXCI7XFxuXCI7XG4gIC8vIGpzb25wICs9IFwiXFxudmFyIHNlckluZGV4ID1cIiArIEpTT04uc3RyaW5naWZ5KHRoZUluZGV4KSArIFwiO1xcblwiO1xuXG5cbiAganNvbiArPSAnXFxuXCJzZXJJbmRleFwiIDonICsgdGhlSW5kZXhTdHIgKyAnLCc7XG5cbiAgLy9jb25zb2xlLmxvZyhcImhlcmUgYWxsIG5hbWVzIFwiICsgSlNPTi5zdHJpbmdpZnkocWJlRGF0YU5hbWVzKSk7XG4gIHZhciBjbGVhbnNlZGRhdGEgPSBkYXRhLm1hcChvID0+IHtcbiAgICB2YXIgcmVzID0ge307XG4gICAgcWJlRGF0YU5hbWVzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIHJlc1trZXldID0gb1trZXldO1xuICAgICAgaWYgKCBrZWVwQXNBcnJheS5pbmRleE9mKGtleSk+PTAgJiYgXy5pc0FycmF5KG9ba2V5XSkpIHtcbiAgICAgICAgcmVzW2tleV0gPSBvW2tleV0uam9pbihcIixcIik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlcztcbiAgfSk7XG5cbiAgdmFyIG91dHB1dCA9IG1vZGVsUGF0aCArIFwiZ2VuX1wiICsgbW9kZWxuYW1lICsgXCIubHVuci5qc29uXCIgO1xuICBpZiAoIXNpbGVudCkge1xuICAgIGNvbnNvbGUubG9nKFwiZHVtcGluZyBcIiArIG91dHB1dCk7XG4gICAgY29uc29sZS5sb2coXCJsZW5ndGggb2YgaW5kZXggc3RyXCIgKyB0aGVJbmRleFN0ci5sZW5ndGgpXG4gICAgY29uc29sZS5sb2coXCJhdmFpbGFibGUgICAgICAgICAgXCIgKyBjb2x1bW5zLmxlbmd0aCArIFwiIGNvbHVtbnNcIik7XG4gICAgY29uc29sZS5sb2coXCJyZXR1cm5pbmcgYXMgZGF0YSAgXCIgKyBxYmVEYXRhTmFtZXMubGVuZ3RoICsgXCIgY29sdW1uc1wiKTtcbiAgICBjb25zb2xlLmxvZyhcImluZGV4aW5nICAgICAgICAgICBcIiArIExVTlJJbmRleC5sZW5ndGggKyBcIiBjb2x1bW5zXCIpO1xuICAgIGNvbnNvbGUubG9nKCdyZXR1cm5lZCBidXQgbm90IGF2YWlsYWJsZScsIF8uZGlmZmVyZW5jZShxYmVEYXRhTmFtZXMsIGNvbHVtbk5hbWVzKS5qb2luKFwiLCBcIikpO1xuICAgIGNvbnNvbGUubG9nKCdyZXR1cm5lZCBidXQgbm90IGluZGV4ZWQnLCBfLmRpZmZlcmVuY2UocWJlRGF0YU5hbWVzLCBMVU5SSW5kZXgpLmpvaW4oXCIsIFwiKSk7XG4gIH1cblxuICBqc29ucCArPSBcInZhciBkYXRhPVwiICsgSlNPTi5zdHJpbmdpZnkoY2xlYW5zZWRkYXRhKSArIFwiO1wiO1xuXG4gIGpzb24gKz0gJ1wiZGF0YVwiOicgKyBKU09OLnN0cmluZ2lmeShjbGVhbnNlZGRhdGEpICsgXCJcXG59XCI7XG5cbiAganNvbnAgKz0gYFxuXG4gIC8vIHZhciBlbGFzdGljID0gZWxhc3RpY2x1bnIuSW5kZXgubG9hZChzZXJJbmRleCk7XG5cbiAgYDtcblxuICAvL2ZzLndyaXRlRmlsZVN5bmMob3V0cHV0ICsgXCIubHVuci5qc1wiLCBqc29ucCk7XG4gIGNvbnNvbGUubG9nKCdXcml0aW5nIGx1bnIgaW5kZXggZm9yICcgKyBtb2RlbG5hbWUgKyBcIiBhcyBmaWxlIFwiICsgb3V0cHV0KTtcbiAgZnMud3JpdGVGaWxlU3luYyhvdXRwdXQsIGpzb24pO1xufSk7XG59XG5cblxuXG5cbi8qXG5cbiAgdmFyIGluZGV4ID0gZWxhc3RpbHVuci5JbmRleC5sb2FkKG9iaik7XG5cblxufVxuXG4gXCJRQkVcIiA6IGZhbHNlLFxuICAgICAgXCJRQkVJbmNsdWRlXCIgOiB0cnVlLFxuICAgICAgXCJMVU5SSW5kZXhcIjogZmFsc2VcbiovXG5cblxuXG5leHBvcnQgZnVuY3Rpb24gY2FsY0NhdGVnb3J5UmVjb3JkKG06IElNYXRjaC5JTW9kZWxzLCBjYXRlZ29yeTogc3RyaW5nLCBkb21haW46IHN0cmluZywgY2FjaGU/OiBhbnkpOiBQcm9taXNlPENhdGVnb3J5UmVjb3JkPiB7XG5cbiAgdmFyIG90aGVyZG9tYWlucyA9IE1vZGVsLmdldERvbWFpbnNGb3JDYXRlZ29yeShtLCBjYXRlZ29yeSk7XG4gIF8ucHVsbChvdGhlcmRvbWFpbnMsIGRvbWFpbik7XG4gIHZhciByZXMgPSB7XG4gICAgb3RoZXJkb21haW5zOiBvdGhlcmRvbWFpbnMsXG4gICAgbnJEaXN0aW5jdFZhbHVlczogMCxcbiAgICBuckRpc3RpbmN0VmFsdWVzSW5Eb21haW46IDAsXG4gICAgbnJSZWNvcmRzOiAwLFxuICAgIG5yUmVjb3Jkc0luRG9tYWluOiAwLFxuICAgIG5yVG90YWxSZWNvcmRzSW5Eb21haW46IDAsXG4gIH0gYXMgQ2F0ZWdvcnlSZWNvcmQ7XG4gIGlmIChjYWNoZSkge1xuICAgIGRlYnVnbG9nKCdnb3QgYSBjYWNoZScgKyBPYmplY3Qua2V5cyhjYWNoZSkpO1xuICB9XG4gIGNhY2hlID0gY2FjaGUgfHwge307XG4gIGZ1bmN0aW9uIGdldERvbWFpblJlY29yZHMoZG9tKTogUHJvbWlzZTx7XG4gICAgW2tleTogc3RyaW5nXTogYW55O1xuICB9PiB7XG4gICAgaWYgKGNhY2hlW2RvbV0pIHtcbiAgICAgIGRlYnVnbG9nKCdzZWVuIGRvbWFpbiAnICsgZG9tKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2FjaGVbZG9tXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnbG9nKCdub3Qgc2VlbiBkb21haW4gJyArIGRvbSlcbiAgICAgIHZhciBwID0gTW9kZWwuZ2V0RXhwYW5kZWRSZWNvcmRzRmlyc3QobSwgZG9tKTtcbiAgICAgIHJldHVybiBwLnRoZW4oKHJlY29yZHMpID0+IHtcbiAgICAgICAgY2FjaGVbZG9tXSA9IHJlY29yZHM7IHJldHVybiByZWNvcmRzO1xuICAgICAgfSlcbiAgICB9XG4gIH1cbiAgdmFyIHZhbHVlcyA9IFtdO1xuICB2YXIgdmFsdWVzSW5Eb21haW4gPSBbXTtcbiAgdmFyIG5yUmVjb3Jkc0luRG9tYWluID0gMDtcbiAgZGVidWdsb2coJ2ludmVzdGlnYXRpbmcnICsgZG9tYWluICsgJyBjYXRlZ29yeScgKyBjYXRlZ29yeSk7XG4gIHJldHVybiBnZXREb21haW5SZWNvcmRzKGRvbWFpbikudGhlbigocmVjb3JkcykgPT4ge1xuICAgIHJlcy5uclRvdGFsUmVjb3Jkc0luRG9tYWluID0gcmVjb3Jkcy5sZW5ndGg7XG4gICAgdmFyIGRpc3RpbmN0VmFsdWVzID0gcmVjb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uIChvRW50cnkpIHtcbiAgICAgIGlmIChvRW50cnlbY2F0ZWdvcnldKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IG9FbnRyeVtjYXRlZ29yeV07XG4gICAgICAgIHZhbHVlc0luRG9tYWluW3ZhbHVlXSA9ICh2YWx1ZXNJbkRvbWFpblt2YWx1ZV0gfHwgMCkgKyAxO1xuICAgICAgICByZXMubnJSZWNvcmRzSW5Eb21haW4gKz0gMTtcbiAgICAgICAgdmFsdWVzW3ZhbHVlXSA9ICh2YWx1ZXNbdmFsdWVdIHx8IDApICsgMTtcbiAgICAgICAgcmVzLm5yUmVjb3JkcyArPSAxO1xuICAgICAgfVxuICAgIH0pXG4gIH0pLnRoZW4oKCkgPT5cbiAgICBQcm9taXNlLmFsbChvdGhlcmRvbWFpbnMubWFwKG9kID0+XG4gICAgICBnZXREb21haW5SZWNvcmRzKG9kKS50aGVuKChyZWNvcmRzKSA9PiB7XG4gICAgICAgIC8vcmVzLm5yVG90YWxSZWNvcmRzSW5Eb21haW4gPSByZWNvcmRzLmxlbmd0aDtcbiAgICAgICAgdmFyIGRpc3RpbmN0VmFsdWVzID0gcmVjb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uIChvRW50cnkpIHtcbiAgICAgICAgICBpZiAob0VudHJ5W2NhdGVnb3J5XSkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gb0VudHJ5W2NhdGVnb3J5XTtcbiAgICAgICAgICAgIC8vdmFsdWVzSW5Eb21haW5bdmFsdWVdID0gKHZhbHVlc0luRG9tYWluW3ZhbHVlXSB8fCAwKSArIDE7XG4gICAgICAgICAgICAvL3Jlcy5uclJlY29yZHNJbkRvbWFpbiArPSAxO1xuICAgICAgICAgICAgdmFsdWVzW3ZhbHVlXSA9ICh2YWx1ZXNbdmFsdWVdIHx8IDApICsgMTtcbiAgICAgICAgICAgIHJlcy5uclJlY29yZHMgKz0gMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIClcbiAgICApLnRoZW4oKCkgPT4ge1xuICAgICAgcmVzLm5yRGlzdGluY3RWYWx1ZXMgPSBPYmplY3Qua2V5cyh2YWx1ZXMpLmxlbmd0aDtcbiAgICAgIHJlcy5uckRpc3RpbmN0VmFsdWVzSW5Eb21haW4gPSBPYmplY3Qua2V5cyh2YWx1ZXNJbkRvbWFpbikubGVuZ3RoO1xuICAgICAgcmV0dXJuIHJlcztcbiAgICB9KVxuICAgICk7XG59XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gZ3JhcGhEb21haW4oZG9tYWluOiBzdHJpbmcsIG06IElNYXRjaC5JTW9kZWxzLCBkb21haW5SZWNvcmRDYWNoZT86IGFueSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIC8vIGRyYXcgYSBtb2RlbCBkb21haW5zXG4gIHZhciByZXMgPSBgXG4gICAgZGlncmFwaCBzZHN1IHtcblx0c2l6ZT1cIjM2LDM2XCI7XG4gICByYW5rZGlyPUxSXG5cdG5vZGUgW2NvbG9yPXllbGxvdywgc3R5bGU9ZmlsbGVkXTtcbiAgICBcIiR7ZG9tYWlufVwiXG4gIGA7XG4gIC8vIGFkZCBhbGwgY2F0ZWdvcnkgbm9kZXNcbiAgcmVzICs9IGBub2RlIFtzaGFwZT1yZWNvcmQsIGNvbG9yPXllbGxvdywgc3R5bGU9ZmlsbGVkXTtcXG4gYFxuICB2YXIgY2F0cyA9IE1vZGVsLmdldENhdGVnb3JpZXNGb3JEb21haW4obSwgZG9tYWluKTtcbiAgdmFyIGRvbWFpblJlY29yZENhY2hlID0gZG9tYWluUmVjb3JkQ2FjaGUgfHwge307XG4gIHZhciBjYXRlZ29yeVJlc3VsdHMgPSB7fTtcbiAgdmFyIG90aGVyZG9tYWlucyA9IFtdO1xuICB2YXIgbnJSZWNvcmRzID0gMDtcbiAgdmFyIHAgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgY2F0cy5mb3JFYWNoKGZ1bmN0aW9uIChjYXQpIHtcbiAgICBwID0gcC50aGVuKCgpID0+IHtcbiAgICAgIHJldHVybiBjYWxjQ2F0ZWdvcnlSZWNvcmQobSwgY2F0LCBkb21haW4sIGRvbWFpblJlY29yZENhY2hlKS50aGVuKFxuICAgICAgICAoY2F0UmVzdWx0KSA9PiB7XG4gICAgICAgICAgZGVidWdsb2coJ2dvdCByZXN1bHQgZm9yICcgKyBkb21haW4gKyAnICcgKyBjYXQpO1xuICAgICAgICAgIG5yUmVjb3JkcyA9IGNhdFJlc3VsdC5uclRvdGFsUmVjb3Jkc0luRG9tYWluO1xuICAgICAgICAgIGNhdGVnb3J5UmVzdWx0c1tjYXRdID0gY2F0UmVzdWx0O1xuICAgICAgICAgIG90aGVyZG9tYWlucyA9IF8udW5pb24ob3RoZXJkb21haW5zLCBjYXRlZ29yeVJlc3VsdHNbY2F0XS5vdGhlckRvbWFpbnMpO1xuICAgICAgICAgIHJlcyArPSBgXCIke2NhdH1cIiBbbGFiZWw9XCJ7ICR7Y2F0fSB8ICR7Y2F0UmVzdWx0Lm5yRGlzdGluY3RWYWx1ZXNJbkRvbWFpbn0gVmFsdWVzIGluICR7Y2F0UmVzdWx0Lm5yUmVjb3Jkc0luRG9tYWlufSBgO1xuICAgICAgICAgIGlmIChjYXRSZXN1bHQubnJSZWNvcmRzSW5Eb21haW4gIT09IGNhdFJlc3VsdC5uclJlY29yZHMpIHtcbiAgICAgICAgICAgIHJlcyArPSBgfCAgJHtjYXRSZXN1bHQubnJEaXN0aW5jdFZhbHVlcyAtIGNhdFJlc3VsdC5uckRpc3RpbmN0VmFsdWVzSW5Eb21haW59IG90aGVyIHZhbHVlcyBpbiAke2NhdFJlc3VsdC5uclJlY29yZHMgLSBjYXRSZXN1bHQubnJSZWNvcmRzSW5Eb21haW59IG90aGVyIHJlY29yZHNgO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXMgKz0gYCBgO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXMgKz0gYH1cIl1cXG5gO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG4gIHJldHVybiBwLnRoZW4oKCkgPT4ge1xuICAgIC8vIGNhbGN1bGF0ZSBvdGhlciBkb21haW5zLlxuICAgIC8vIGRyYXcgXCJvdGhlciBjYXRlZ29yaWVzXCJcbiAgICByZXMgKz0gYG5vZGUgW2NvbG9yPXB1cnBsZSwgc3R5bGU9ZmlsbGVkXTsgXFxuYFxuICAgIG90aGVyZG9tYWlucy5mb3JFYWNoKGZ1bmN0aW9uIChvdGhlcmRvbWFpbikge1xuICAgICAgcmVzICs9IGBcIiR7b3RoZXJkb21haW59XCIgXFxuYDtcbiAgICB9KTtcbiAgICAvLyBjb3VudCByZWNvcmRzIGluIGRvbWFpbiA6XG4gICAgLyogdmFyIG5yUmVjb3JkcyA9IG0ucmVjb3Jkcy5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGVudHJ5KSB7XG4gICAgICAgIHJldHVybiBwcmV2ICsgKChlbnRyeS5fZG9tYWluID09PSBkb21haW4pID8gMSA6IDApO1xuICAgICAgfSwgMCk7XG4gICAgICAqL1xuICAgIHJlcyArPSBgbm9kZSBbc2hhcGU9cmVjb3JkXTsgXFxuYFxuICAgIHJlcyArPSBgIFwicmVjb3JkXCIgW2xhYmVsPVwiezxmMD4gJHtkb21haW59IHwgJHtuclJlY29yZHN9fVwiXSBcXG5gO1xuXG4gICAgcmVzICs9IGAgXCJyX290aGVyXCIgW2xhYmVsPVwiezxmMD4gb3RoZXIgfCAke25yUmVjb3Jkc319XCJdIFxcbiBgO1xuXG4gICAgcmVzICs9IGAjIHJlbGF0aW9uIGZyb20gY2F0ZWdvcmllcyB0byBkb21haW5cXG5gO1xuICAgIGNhdHMuZm9yRWFjaChmdW5jdGlvbiAoY2F0KSB7XG4gICAgICByZXMgKz0gYCBcIiR7Y2F0fVwiIC0+IFwiJHtkb21haW59XCIgXFxuYDtcbiAgICB9KVxuXG4gICAgcmVzICs9IGAjIHJlbGF0aW9uIGZyb20gY2F0ZWdvcmllcyB0byByZWNvcmRzXFxuYDtcbiAgICBjYXRzLmZvckVhY2goZnVuY3Rpb24gKGNhdCkge1xuICAgICAgdmFyIHJlYyA9IGNhdGVnb3J5UmVzdWx0c1tjYXRdO1xuICAgICAgcmVzICs9IGAgXCIke2NhdH1cIiAtPiBcInJlY29yZFwiIFxcbmA7XG4gICAgfSlcblxuICAgIC8vb3RoZXIgZG9tYWlucyB0byB0aGlzXG4gICAgY2F0cy5mb3JFYWNoKGZ1bmN0aW9uIChjYXQpIHtcbiAgICB9KVxuICAgIC8qXG4gICAgY2F0cyBmb1xuICAgICAgZGlncmFwaCBzZHN1IHtcbiAgICBzaXplPVwiMzYsMzZcIjtcbiAgICBub2RlIFtjb2xvcj15ZWxsb3csIHN0eWxlPWZpbGxlZF07XG4gICAgRkxQRCBGTFAgXCJCT00gRWRpdG9yXCIsIFwiV0lLSVVSTFwiIFwiVUk1IERvY3VtZW50YXRpb25cIiwgXCJVSTUgRXhhbXBsZVwiLCBcIlNUQVJUVEFcIlxuICAgIEJDUFxuICAgIG5vZGUgW2NvbG9yPWdyZXksIHN0eWxlPWZpbGxlZF07XG4gICAgbm9kZSBbZm9udG5hbWU9XCJWZXJkYW5hXCIsIHNpemU9XCIzMCwzMFwiXTtcbiAgICBub2RlIFtjb2xvcj1ncmV5LCBzdHlsZT1maWxsZWRdO1xuICAgIGdyYXBoIFsgZm9udG5hbWUgPSBcIkFyaWFsXCIsXG4gICAgKi9cbiAgICByZXMgKz0gYH1cXG5gO1xuICAgIHJldHVybiByZXM7XG4gIH0pO1xufVxuLypcbiAgICBjYXRlZ29yeURlc2MgOiB0aGVNb2RlbC5mdWxsLmRvbWFpbltmaWx0ZXJkb21haW5dLmNhdGVnb3JpZXNbY2F0ZWdvcnldLFxuICAgIGRpc3RpbmN0IDogZGlzdGluY3QsXG4gICAgZGVsdGEgOiBkZWx0YSxcbiAgICBwcmVzZW50UmVjb3JkcyA6IHJlY29yZENvdW50LnByZXNlbnRyZWNvcmRzLFxuICAgIHBlcmNQcmVzZW50IDogcGVyY2VudCxcbiAgICBzYW1wbGVWYWx1ZXMgOiB2YWx1ZXNMaXN0XG4gIH1cbiovXG5cbmZ1bmN0aW9uIHJlcGxhY2VCcihzdHJpbmc6IHN0cmluZyk6IHN0cmluZyB7XG4gIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKC9cXG4vZyxcbiAgICBgXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHRiclxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0fCBgXG4gICk7XG4gIHJldHVybiBzdHJpbmc7XG59XG5cblxuXG4vKipcbiAqIGdlbmVyYXRlIGEgdGV4dHVhbCByZXByZXNlbnRhdGlvbiBvZiBhIGRvbWFpblxuICovXG5leHBvcnQgZnVuY3Rpb24gdGFiRG9tYWluKGRvbWFpbjogc3RyaW5nLCBtOiBJTWF0Y2guSU1vZGVscyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIC8vIGRyYXcgYSBtb2RlbCBkb21haW5zXG4gIHZhciByZXMgPSAnJztcbiAgdmFyIG1vZGVsQ2FjaGUgPSB7fTtcbiAgdmFyIGNhdHMgPSBNb2RlbC5nZXRDYXRlZ29yaWVzRm9yRG9tYWluKG0sIGRvbWFpbik7XG4gIGNhdHMgPSBNb2RlbC5zb3J0Q2F0ZWdvcmllc0J5SW1wb3J0YW5jZShtLmZ1bGwuZG9tYWluW2RvbWFpbl0uY2F0ZWdvcmllcyB8fCB7fSwgY2F0cyk7XG4gIC8vY29uc29sZS5sb2coY2F0cy5qb2luKFwiXFxuXCIpKTtcbiAgcmV0dXJuIERlc2NyaWJlLmdldENhdGVnb3J5U3RhdHNJbkRvbWFpbihjYXRzWzBdLCBkb21haW4sIG0pLnRoZW4oKGNhdFJlc3VsdDApID0+IHtcbiAgICByZXR1cm4gY2FsY0NhdGVnb3J5UmVjb3JkKG0sIGNhdHNbMF0sIGRvbWFpbiwgbW9kZWxDYWNoZSkudGhlbigoY2F0UmVzdWx0MSkgPT4ge1xuXG4gICAgICB2YXIgZG9tYWluRGVzY3IgPSBtLmZ1bGwuZG9tYWluW2RvbWFpbl0uZGVzY3JpcHRpb24gfHwgXCJcIjtcbiAgICAgIGRvbWFpbkRlc2NyID0gcmVwbGFjZUJyKGRvbWFpbkRlc2NyKTtcbiAgICAgIHJlcyA9IGBcbmV4dGVuZHMgLi4vbGF5b3V0X3BcblxuYmxvY2sgY29udGVudFxuXG5cdG5hdi5uYXZiYXIubmF2YmFyLWRlZmF1bHQubmF2YmFyLWZpeGVkLXRvcFxuXHRcdC5jb250YWluZXJcblx0XHRcdC5uYXZiYXItaGVhZGVyXG5cdFx0XHRcdC5uYXZiYXItYnJhbmQoc3R5bGU9J2JnY29sb3I6b3JhbmdlO2NvbG9yOmRhcmtibHVlO2ZvbnQtZmFtaWx5OkFyaWFsIEJsYWNrO2ZvbnQtc2l6ZToxNS4xMThweCcpIHdvc2FwIGRvbWFpbiAke2RvbWFpbn1cblx0XHRcdHVsLm5hdi5uYXZiYXItbmF2Lm5hdmJhci1yaWdodCAje3VpZH1cblx0XHRcdFx0bGlcblx0XHRcdFx0XHQubmF2YmFyLWJ0biNidG4tbG9nb3V0LmJ0bi5idG4tZGVmYXVsdChvbmNsaWNrPVwibG9jYXRpb24uaHJlZj0nL2hvbWUnXCIpXG5cdFx0XHRcdFx0XHR8IGJhY2sgdG8gaG9tZVxuXG5cdHAgICZuYnNwO1xuXHRwICZuYnNwO1xuXHRwXG5cblx0ZGl2LndlbGxcblx0XHRoMyBkb21haW4gXCIke2RvbWFpbn1cIlxuXHRcdFx0c3Bhbi5wdWxsLXJpZ2h0ICR7Y2F0UmVzdWx0MS5uclRvdGFsUmVjb3Jkc0luRG9tYWlufSByZWNvcmRzXG5cdFx0cFxuXHRcdHNwYW4gJHtkb21haW5EZXNjcn1cblxuXHRcdHRhYmxlLnRhYmxlLnRhYmxlLWNvbmRlbnNlZC50YWJsZS1zdHJpcGVkXG5cdFx0XHR0aGVhZFxuXHRcdFx0XHR0clxuXHRcdFx0XHRcdHRoIGNhdGVnb3J5XG5cdFx0XHRcdFx0dGgoc3R5bGU9XCJ3aWR0aDoxMCVcIikgY291bnRcblx0XHRcdFx0XHR0aFxuXHRcdFx0XHRcdFx0dGFibGVcblx0XHRcdFx0XHRcdFx0dHJcblx0XHRcdFx0XHRcdFx0XHR0ZCBzeW5vbnltc1xuXHRcdFx0XHRcdFx0XHR0clxuXHRcdFx0XHRcdFx0XHRcdHRkIGRlc2NyaXB0aW9uXG5cdFx0XHRcdFx0XHRcdHRyXG5cdFx0XHRcdFx0XHRcdFx0dGQgZXhhbXBsZSB2YWx1ZXNcblx0XHRcdHRib2R5XG5gO1xuXG4gICAgICB2YXIgY2F0ZWdvcnlSZXN1bHRzID0ge307XG4gICAgICB2YXIgb3RoZXJkb21haW5zID0gW107XG4gICAgICB2YXIgY2F0ZWdvcnlNYXAgPSBtLmZ1bGwuZG9tYWluW2RvbWFpbl0uY2F0ZWdvcmllcyB8fCB7fTtcbiAgICAgIHZhciBwVGFpbCA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgY2F0cy5mb3JFYWNoKGZ1bmN0aW9uIChjYXQpIHtcbiAgICAgICAgcFRhaWwgPSBwVGFpbC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gRGVzY3JpYmUuZ2V0Q2F0ZWdvcnlTdGF0c0luRG9tYWluKGNhdCwgZG9tYWluLCBtKS50aGVuKFxuICAgICAgICAgICAgY2F0ZGVzYyA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxjQ2F0ZWdvcnlSZWNvcmQobSwgY2F0LCBkb21haW4sIG1vZGVsQ2FjaGUpLnRoZW4oKGNhdFJlc3VsdDIpID0+IHtcbiAgICAgICAgICAgICAgICBjYXRlZ29yeVJlc3VsdHNbY2F0XSA9IGNhdFJlc3VsdDI7XG4gICAgICAgICAgICAgICAgb3RoZXJkb21haW5zID0gXy51bmlvbihvdGhlcmRvbWFpbnMsIGNhdGVnb3J5UmVzdWx0c1tjYXRdLm90aGVyRG9tYWlucyk7XG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgcmVzICs9IGBcIiR7Y2F0fVwiIFtsYWJlbD1cInsgJHtjYXR9IHwgJHtjYXRSZXN1bHQubnJEaXN0aW5jdFZhbHVlc0luRG9tYWlufSBWYWx1ZXMgaW4gJHtjYXRSZXN1bHQubnJSZWNvcmRzSW5Eb21haW59IGA7XG4gICAgICAgICAgICAgICAgICAgIGlmKGNhdFJlc3VsdC5uclJlY29yZHNJbkRvbWFpbiAhPT0gY2F0UmVzdWx0Lm5yUmVjb3Jkcykge1xuICAgICAgICAgICAgICAgICAgICAgIHJlcyArPSAgYHwgICR7Y2F0UmVzdWx0Lm5yRGlzdGluY3RWYWx1ZXMgLSBjYXRSZXN1bHQubnJEaXN0aW5jdFZhbHVlc0luRG9tYWlufSBvdGhlciB2YWx1ZXMgaW4gJHtjYXRSZXN1bHQubnJSZWNvcmRzIC0gY2F0UmVzdWx0Lm5yUmVjb3Jkc0luRG9tYWlufSBvdGhlciByZWNvcmRzYDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXMgKz0gYCBgO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlcyArPSBgfVwiXVxcbmA7XG4gICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG0uZnVsbC5kb21haW5bZG9tYWluXSkpO1xuICAgICAgICAgICAgICAgIGlmIChtLmZ1bGwuZG9tYWluW2RvbWFpbl0uY2F0ZWdvcmllc1tjYXRdKSB7XG4gICAgICAgICAgICAgICAgICB2YXIgc3lub255bXNTdHJpbmcgPSBVdGlsLmxpc3RUb0NvbW1hQW5kKGNhdGRlc2MuY2F0ZWdvcnlEZXNjICYmIGNhdGRlc2MuY2F0ZWdvcnlEZXNjLmNhdGVnb3J5X3N5bm9ueW1zICYmIGNhdGRlc2MuY2F0ZWdvcnlEZXNjLmNhdGVnb3J5X3N5bm9ueW1zIHx8IFtdKSB8fCBcIiZuYnNwO1wiO1xuXG4gICAgICAgICAgICAgICAgICByZXMgKz0gYFxuXHRcdFx0dHJcblx0XHRcdFx0XHR0ZC5jYXRfY291bnQgJHtjYXR9XG5cXHRcXHRcXHRcXHRcXHR0ZCAke2NhdGRlc2MucHJlc2VudFJlY29yZHN9IGRpc3RpbmN0IHZhbHVlcyBpbiAke2NhdGRlc2MucGVyY1ByZXNlbnR9JSBvZiByZWNvcmRzXG5cXHRcXHRcXHRcXHRcXHR0ZFxuXFx0XFx0XFx0XFx0XFx0XFx0dGFibGVcblxcdFxcdFxcdFxcdFxcdFxcdFxcdHRyLmNhdF9zeW5vbnltc1xuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0dGQgJHtzeW5vbnltc1N0cmluZ31cblxcdFxcdFxcdFxcdFxcdFxcdFxcdHRyLmNhdF9kZXNjcmlwdGlvblxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0dGQgJHtyZXBsYWNlQnIoY2F0ZGVzYy5jYXRlZ29yeURlc2MgJiYgY2F0ZGVzYy5jYXRlZ29yeURlc2MuY2F0ZWdvcnlfZGVzY3JpcHRpb24gfHwgXCJcIil9XG5cXHRcXHRcXHRcXHRcXHRcXHRcXHR0ci5jYXRfc2FtcGxldmFsdWVzXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHR0ZCAke3JlcGxhY2VCcihjYXRkZXNjLnNhbXBsZVZhbHVlcyl9XG4gICAgICBgO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGNhdGRlc2MpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHBUYWlsLnRoZW4oKCkgPT4ge1xuICAgICAgICB2YXIgb3RoZXJjYXRzID0gY2F0cy5sZW5ndGggLSBPYmplY3Qua2V5cyhtLmZ1bGwuZG9tYWluW2RvbWFpbl0uY2F0ZWdvcmllcykubGVuZ3RoO1xuICAgICAgICB2YXIgcmVtYWluaW5nQ2F0ZWdvcmllcyA9IF8uZGlmZmVyZW5jZShjYXRzLCBPYmplY3Qua2V5cyhtLmZ1bGwuZG9tYWluW2RvbWFpbl0uY2F0ZWdvcmllcykpO1xuICAgICAgICBpZiAoKG90aGVyY2F0cykgPiAwKSB7XG4gICAgICAgICAgcmVzICs9IGBcblxcdFxcdHAgICBhbmQgJHtvdGhlcmNhdHN9IG90aGVyIGNhdGVnb3JpZXNcblxcdFxcdHwgJHtVdGlsLmxpc3RUb0NvbW1hQW5kKHJlbWFpbmluZ0NhdGVnb3JpZXMpfVxuICAgICAgIGBcbiAgICAgICAgfVxuICAgICAgICByZXMgKz0gYFxuXHRcdGgzIFZlcnNpb25cblx0XHRcdGEuc21hbGwoaHJlZj1cIi93aGF0c25ld1wiKVxuXG5cbmJsb2NrIHNjcmlwdHNcblx0c2NyaXB0KHNyYz0nL3ZlbmRvci9qcXVlcnktMi4yLjMubWluLmpzJylcblx0c2NyaXB0KHNyYz0nL3ZlbmRvci9ib290c3RyYXAubWluLmpzJylcblx0c2NyaXB0KHNyYz0nL2pzL3ZpZXdzL3NldHRpbmdzLmpzJylcbmA7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSkudGhlbigoKSA9PiB7XG4gICAgcmV0dXJuIHJlcztcbiAgfSk7XG59XG5cblxuaW1wb3J0IHsgZXhlYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuXG5cbmZ1bmN0aW9uIGV4ZWNDbWQoY21kOiBzdHJpbmcpIHtcbiAgZXhlYyhjbWQsIGZ1bmN0aW9uIChlcnJvciwgc3Rkb3V0LCBzdGRlcnIpIHtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYGV4ZWMgZXJyb3I6ICR7ZXJyb3J9YClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zb2xlLmxvZyhgc3Rkb3V0OiAke3N0ZG91dH1gKVxuICAgIGNvbnNvbGUubG9nKGBzdGRlcnI6ICR7c3RkZXJyfWApXG4gIH0pXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gdmlzTW9kZWxzKG06IElNYXRjaC5JTW9kZWxzLCBmb2xkZXJPdXQ6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gIC8vIHdlIHdhbnQgdG8gZXhlY3V0ZSB0aGUgZG9tYWlucyBpbiBzZXF1ZW5jZSB0byBhdm9pZCBhbmQgb3V0IG9mIG1lbW9yeVxuICB2YXIgcCA9IFByb21pc2UucmVzb2x2ZSgpO1xuICB2YXIgZG9tYWluUmVjb3JkQ2FjaGUgPSB7fTtcbiAgbS5kb21haW5zLmZvckVhY2goc0RvbWFpbiA9PiB7XG4gICAgcCA9IHAudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gZ3JhcGhEb21haW4oc0RvbWFpbiwgbSwgZG9tYWluUmVjb3JkQ2FjaGUpLnRoZW4oKHMpID0+IHtcbiAgICAgICAgZGVidWdsb2coJ2RvbmUgd2l0aCByZXN1bHQgZm9yICcgKyBzRG9tYWluICsgJyAnICsgcy5sZW5ndGgpO1xuICAgICAgICB2YXIgZm5HcmFwaCA9IGZvbGRlck91dCArIFwiL1wiICsgc0RvbWFpbi5yZXBsYWNlKC8gL2csICdfJykgKyBcIi5ndlwiO1xuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGZuR3JhcGgsIHMpO1xuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuR1JBUEhWSVopIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcImhlcmUgdGhlIGZpbGUgXCIgKyBmbkdyYXBoKTtcbiAgICAgICAgICBleGVjQ21kKHByb2Nlc3MuZW52LkdSQVBIVklaICsgXCIgLVRqcGVnIC1PIFwiICsgZm5HcmFwaCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgICk7XG4gICAgfSlcbiAgfSk7XG4gIHJldHVybiBwO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHRhYk1vZGVscyhtOiBJTWF0Y2guSU1vZGVscyk6IFByb21pc2U8YW55PiB7XG4gIHZhciBwID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIHZhciBmb2xkZXJPdXQgPSBtLm1vbmdvSGFuZGxlLnNyY0hhbmRsZS5nZXRQYXRoKCk7XG4gIGlmICggIWZzLmV4aXN0c1N5bmMoZm9sZGVyT3V0ICsgXCJ2aWV3c1wiKSkge1xuICAgIGZzLm1rZGlyU3luYyhmb2xkZXJPdXQgKyAndmlld3MnKTtcbiAgfVxuICAvLyBjb3B5IHRoZSBsYXlvdXRfcC5wdWcgZmlsZVxuICB2YXIgbGF5b3V0X3AgPSBmcy5yZWFkRmlsZVN5bmMoJ3Jlc291cmNlcy90ZW1wbGF0ZXNfcHVnL2xheW91dF9wLnB1ZycpXG4gIGZzLndyaXRlRmlsZVN5bmMoZm9sZGVyT3V0ICsgXCJ2aWV3cy9sYXlvdXRfcC5wdWdcIiwgbGF5b3V0X3ApO1xuXG4gIHZhciBleGNsdWRlZE1vZGVsTmFtZXMgPSBbXCJtZXRhbW9kZWxzXCIsXCJoaW50c1wiLFwicXVlc3Rpb25zXCJdO1xuICAvLyBnZW5lcmF0ZSB0aGUgbW9kZWxzIGZpbGVcbiAgdmFyIG1vZGVscyA9IGZzLnJlYWRGaWxlU3luYygncmVzb3VyY2VzL3RlbXBsYXRlc19wdWcvbW9kZWxzLnB1ZycpO1xuICBpZiggIWZzLmV4aXN0c1N5bmMoZm9sZGVyT3V0ICsgXCJ2aWV3cy9tb2RlbHMucHVnXCIpKSB7XG4gICAgY29uc29sZS5sb2coJ1lvdSB3YW50IHRvIG1hbnVhbGx5IGFkanVzdCAgJyArIGZvbGRlck91dCArIFwidmlld3MvbW9kZWxzLnB1Z1wiICk7XG4gICAgZnMud3JpdGVGaWxlU3luYyhmb2xkZXJPdXQgKyBcInZpZXdzL21vZGVscy5wdWdcIiwgbW9kZWxzKTtcbiAgfVxuICB2YXIgZHVtcGVkTW9kZWxOYW1lcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG0ucmF3TW9kZWxCeU1vZGVsTmFtZSkuZmlsdGVyKCBtb2RlbE5hbWUgPT4gZXhjbHVkZWRNb2RlbE5hbWVzLmluZGV4T2YobW9kZWxOYW1lKSA8IDApO1xuXG4gIGR1bXBlZE1vZGVsTmFtZXMuZm9yRWFjaCggbW9kZWxOYW1lID0+IHtcbiAgICB2YXIgZG9tYWluID0gbS5yYXdNb2RlbEJ5TW9kZWxOYW1lW21vZGVsTmFtZV0uZG9tYWluO1xuICAgIHZhciB0YWJsZSA9ICcnK2ZzLnJlYWRGaWxlU3luYygncmVzb3VyY2VzL3RlbXBsYXRlc19wdWcvdGFibGVfeHh4LnB1ZycpO1xuICAgIHRhYmxlID0gdGFibGUucmVwbGFjZShcIkZpb3JpQk9NXCIsZG9tYWluKTtcbiAgICB0YWJsZSA9IHRhYmxlLnJlcGxhY2UoXCJqcy9tb2RlbF9maW9yaWJvbS5sdW5yLmpzb25cIiwgXCJqcy9nZW5fXCIgKyBtb2RlbE5hbWUgKyBcIi5sdW5yLmpzb25cIik7IFxuICAgIGZzLndyaXRlRmlsZVN5bmMoZm9sZGVyT3V0ICsgXCJ2aWV3cy9nZW5fdGFibGVfXCIgKyBtb2RlbE5hbWUgKyBcIi5wdWdcIiwgdGFibGUpO1xuICB9KTtcblxuICBtLmRvbWFpbnMuZm9yRWFjaCgoc0RvbWFpbikgPT4ge1xuICAgIHAgPSBwLnRoZW4oKCkgPT4ge1xuICAgICAgdGFiRG9tYWluKHNEb21haW4sIG0pLnRoZW4oKHMpID0+IHtcbiAgICAgICAgdmFyIG1vZGVsTmFtZSA9IE1vZGVsLmdldE1vZGVsTmFtZUZvckRvbWFpbihtLm1vbmdvSGFuZGxlLHNEb21haW4pO1xuICAgICAgICB2YXIgZm5HcmFwaCA9IGZvbGRlck91dCArIFwidmlld3MvZ2VuX21vZGVsX1wiICsgbW9kZWxOYW1lICsgXCIucHVnXCI7XG4gICAgICAgIGRlYnVnbG9nKFwiaGVyZSB0aGUgZmlsZSBcIiArIGZuR3JhcGgpO1xuICAgICAgICBjb25zb2xlLmxvZygnV3JpdGluZyBtb2RlbCBvdmVydmlldyBmaWxlIGZvciAnICsgbW9kZWxOYW1lICsgJyBhcyAnICsgZm5HcmFwaCk7XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZm5HcmFwaCwgcyk7XG4gICAgICAgIC8vIFxuXG5cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbiAgcmV0dXJuIHAudGhlbigoKSA9PiB7IH0pO1xufSJdfQ==
