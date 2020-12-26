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
// TODO: this has to be rewritten!
function makeLunrIndex(modelpath, output, silent) {
    var mdl = JSON.parse('' + fs.readFileSync(modelpath + '.model.json'));
    var data = JSON.parse('' + fs.readFileSync(modelpath + '.data.json'));
    var cats = mdl.category.filter(a => typeof a !== 'string');
    var qbeDataObjects = cats.filter(cat => (cat.QBE || cat.QBEInclude));
    //console.log("here cats" + JSON.stringify(cats));
    //console.log("\nhere data objects" + JSON.stringify(qbeDataObjects));
    var qbeDataNames = qbeDataObjects.map(cat => cat.name);
    qbeDataNames = _.union(qbeDataNames, mdl.columns);
    var LUNRIndex = cats.filter(cat => cat.LUNRIndex).map(cat => cat.name);
    //var elasticlunr = require('lunr');
    var bomdata = data;
    // index all LUNR properties
    var index = elasticlunr(function () {
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
    bomdata.forEach(function (o, index) {
        o.id = index;
    });
    bomdata.forEach(function (record) {
        index.addDoc(record);
    });
    var elastic = index;
    // dump the lunr index
    //
    var theIndex = index.toJSON();
    var columns = mdl.columns.map(colname => {
        var res = cats.filter(cat => cat.name === colname);
        if (res.length !== 1) {
            throw new Error("undefined or non-object column : " + colname);
        }
        ;
        return res[0];
    });
    var columnNames = columns.map(col => col.name);
    var jsonp = `var mdldata = {};\n//columns \n mdldata.columns = ["${columns.map(col => col.name).join('","')}"];`;
    var json = `{ "columns"  : ["${columns.map(col => JSONEscape(col.name)).join('","')}"],`;
    // jsonp += `\n mdldata.fulldata = ${JSON.stringify(bomdata)};\n`;
    //jsonp += `\n//columns info \n mdldata.lunrcolumns = ["{${LUNRIndex.join('","')}"];`;
    jsonp += `\n//columns info \n mdldata.columnsDescription = {${columns.map(col => ` \n "${col.name}" :  "${JSONEscape(col.description || col.name)}" `).join(',')}
      };`;
    json += `"columnsDescription" : {${columns.map(col => ` \n "${col.name}" :  "${JSONEscape(col.description || col.name)}" `).join(',')}
      },`;
    jsonp += `\n//columns info \n mdldata.columnsDefaultWidth = {${columns.map(col => ` \n "${col.name}" : ${col.defaultWidth || 150} `).join(',')}
      };`;
    json += `\n"columnsDefaultWidth" : {${columns.map(col => ` \n "${col.name}" : ${col.defaultWidth || 150} `).join(',')}
      },`;
    var theIndexStr = JSON.stringify(theIndex);
    jsonp += "\nvar serIndex =\"" + JSONEscape(theIndexStr) + "\";\n";
    // jsonp += "\nvar serIndex =" + JSON.stringify(theIndex) + ";\n";
    json += '\n"serIndex" :' + theIndexStr + ',';
    //console.log("here all names " + JSON.stringify(qbeDataNames));
    var cleanseddata = bomdata.map(o => {
        var res = {};
        qbeDataNames.forEach(key => {
            res[key] = o[key];
        });
        return res;
    });
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
    fs.writeFileSync(output + ".lunr.json", json);
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
            var p = index_model_1.Model.getExpandedRecordsFull(m, dom);
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

// preset form values if we receive a userdata object //
- user = user

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
                /*
                  // calculate other domains.
                  // draw "other categories"
                  res += `node [color=purple, style=filled]; \n`
                  otherdomains.forEach(function(otherdomain) {
                    res += `"${otherdomain}" \n`;
                  });
                  // count records in domain :
                  var nrRecords = m.records.reduce(function(prev,entry) {
                  return prev + ((entry._domain === domain) ? 1 : 0);
                  },0);
                  res += `node [shape=record]; \n`
                  res += ` "record" [label="{<f0> ${domain} | ${nrRecords}}"] \n`;
        
                  res += ` "r_other" [label="{<f0> other | ${nrRecords}}"] \n `;
        
                  res += `# relation from categories to domain\n`;
                  cats.forEach(function(cat) {
                    res += ` "${cat}" -> "${domain}" \n`;
                  })
        
        
                  res += `# relation from categories to records\n`;
                  cats.forEach(function(cat) {
                    var rec = categoryResults[cat];
                    res += ` "${cat}" -> "record" \n`;
                  })
        
        
                  //other domains to this
                  cats.forEach(function(cat) {
        
        
                  })
                */
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
/*
  return Promise.all(m.domains.map(function (sDomain) {
    console.log('making domain' + sDomain);
    return graphDomain(sDomain, m).then((s) => {
      var fnGraph = folderOut + "/" + sDomain.replace(/ /g, '_') + ".gv";
      fs.writeFileSync(fnGraph, s);
      if (process.env.GRAPHVIZ) {
        console.log("here the file " + fnGraph);
        execCmd(process.env.GRAPHVIZ + " -Tjpeg -O " + fnGraph);
      }
    });
  })
  );
}
*/
function tabModels(m, folderOut) {
    var p = Promise.resolve();
    m.domains.forEach((sDomain) => {
        p = p.then(() => {
            tabDomain(sDomain, m).then((s) => {
                var fnGraph = folderOut + "/" + sDomain.replace(/ /g, '_') + ".jade";
                debuglog("here the file " + fnGraph);
                fs.writeFileSync(fnGraph, s);
            });
        });
    });
    return p.then(() => { });
}
exports.tabModels = tabModels;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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USxDQUFDLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxDQUFDO2dCQUNyQyxFQUFFLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMvQixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDSCxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDM0IsQ0FBQztBQVpELDhCQVlDIiwiZmlsZSI6Im1vZGVsL3Zpc21vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiB2aXN1YWxpemUgYSBtb2RlbCBhbmQgY2FsY3VsYXRlIHNvbWUgc3RhdGlzdGljc1xuICovXG5cblxuXG5pbXBvcnQgKiBhcyBJTWF0Y2ggZnJvbSAnLi4vbWF0Y2gvaWZtYXRjaCc7XG5cblxuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuXG5pbXBvcnQgeyBNb2RlbCBhcyBNb2RlbCB9IGZyb20gJy4uL21vZGVsL2luZGV4X21vZGVsJztcblxuaW1wb3J0ICogYXMgVXRpbCBmcm9tICdhYm90X3V0aWxzJztcblxuaW1wb3J0ICogYXMgRGVzY3JpYmUgZnJvbSAnLi4vbWF0Y2gvZGVzY3JpYmUnO1xuXG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBkZWJ1ZyBmcm9tICdkZWJ1Z2YnO1xuXG4vL2ltcG9ydCAqIGFzIGVsYXN0aWNsdW5yIGZyb20gJ2VsYXN0aWNsdW5yJztcblxudmFyIGRlYnVnbG9nID0gZGVidWcoJ3Zpc21vZGVsJyk7XG5cbmludGVyZmFjZSBDYXRlZ29yeVJlY29yZCB7XG4gIG90aGVyZG9tYWluczogc3RyaW5nW10sXG4gIG5yRGlzdGluY3RWYWx1ZXM6IG51bWJlcixcbiAgbnJEaXN0aW5jdFZhbHVlc0luRG9tYWluOiBudW1iZXIsXG4gIG5yUmVjb3JkczogbnVtYmVyLFxuICBuclJlY29yZHNJbkRvbWFpbjogbnVtYmVyLFxuICBuclRvdGFsUmVjb3Jkc0luRG9tYWluOiBudW1iZXJcbn07XG5cbnZhciBlbGFzdGljbHVuciA9IHJlcXVpcmUoJ2VsYXN0aWNsdW5yJyk7XG5cblxuZXhwb3J0IGZ1bmN0aW9uIEpTT05Fc2NhcGUoczogc3RyaW5nKSB7XG5cbiAgcmV0dXJuIHMucmVwbGFjZSgvXFxcXC9nLCBcIlxcXFxcXFxcXCIpLnJlcGxhY2UoL1xcbi9nLCBcIlxcXFxuXCIpXG4gICAgLnJlcGxhY2UoL1xcJy9nLCBcIlxcXFwnXCIpXG4gICAgLnJlcGxhY2UoL1xcXCIvZywgJ1xcXFxcIicpXG4gICAgLnJlcGxhY2UoL1xcJi9nLCBcIlxcXFwmXCIpXG4gICAgLnJlcGxhY2UoL1xcci9nLCBcIlxcXFxyXCIpXG4gICAgLnJlcGxhY2UoL1xcdC9nLCBcIlxcXFx0XCIpO1xuICAvLyAucmVwbGFjZSgvXFxiL2csIFwiXFxcXGJcIilcbiAgLy8gLnJlcGxhY2UoL1xcZi9nLCBcIlxcXFxmXCIpO1xufTtcblxuXG4vLyBUT0RPOiB0aGlzIGhhcyB0byBiZSByZXdyaXR0ZW4hXG5cbmV4cG9ydCBmdW5jdGlvbiBtYWtlTHVuckluZGV4KG1vZGVscGF0aDogc3RyaW5nLCBvdXRwdXQ6IHN0cmluZywgc2lsZW50PzogYm9vbGVhbikge1xuICB2YXIgbWRsID0gSlNPTi5wYXJzZSgnJyArIGZzLnJlYWRGaWxlU3luYyhtb2RlbHBhdGggKyAnLm1vZGVsLmpzb24nKSk7XG4gIHZhciBkYXRhID0gSlNPTi5wYXJzZSgnJyArIGZzLnJlYWRGaWxlU3luYyhtb2RlbHBhdGggKyAnLmRhdGEuanNvbicpKTtcblxuICB2YXIgY2F0cyA9IG1kbC5jYXRlZ29yeS5maWx0ZXIoYSA9PiB0eXBlb2YgYSAhPT0gJ3N0cmluZycpO1xuXG4gIHZhciBxYmVEYXRhT2JqZWN0cyA9IGNhdHMuZmlsdGVyKGNhdCA9PiAoY2F0LlFCRSB8fCBjYXQuUUJFSW5jbHVkZSkpO1xuXG4gIC8vY29uc29sZS5sb2coXCJoZXJlIGNhdHNcIiArIEpTT04uc3RyaW5naWZ5KGNhdHMpKTtcbiAgLy9jb25zb2xlLmxvZyhcIlxcbmhlcmUgZGF0YSBvYmplY3RzXCIgKyBKU09OLnN0cmluZ2lmeShxYmVEYXRhT2JqZWN0cykpO1xuICB2YXIgcWJlRGF0YU5hbWVzID0gcWJlRGF0YU9iamVjdHMubWFwKGNhdCA9PiBjYXQubmFtZSk7XG5cbiAgcWJlRGF0YU5hbWVzID0gXy51bmlvbihxYmVEYXRhTmFtZXMsIG1kbC5jb2x1bW5zKVxuXG5cbiAgdmFyIExVTlJJbmRleCA9IGNhdHMuZmlsdGVyKGNhdCA9PiBjYXQuTFVOUkluZGV4KS5tYXAoY2F0ID0+IGNhdC5uYW1lKTtcbiAgLy92YXIgZWxhc3RpY2x1bnIgPSByZXF1aXJlKCdsdW5yJyk7XG4gIHZhciBib21kYXRhID0gZGF0YTtcbiAgLy8gaW5kZXggYWxsIExVTlIgcHJvcGVydGllc1xuICB2YXIgaW5kZXggPSBlbGFzdGljbHVucihmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIExVTlJJbmRleCAvKlxuICAgICAgICAgICAgW1wiYXBwSWRcIixcbiAgICAgICAgICAgIFwiQXBwS2V5XCIsXG4gICAgICAgICAgICBcIkFwcE5hbWVcIixcbiAgICAgICAgICAgICAgICBcIkFwcGxpY2F0aW9uQ29tcG9uZW50XCIsXG4gICAgICAgICAgICAgICAgXCJSb2xlTmFtZVwiLFxuICAgICAgICAgICAgICAgIFwiQXBwbGljYXRpb25UeXBlXCIsXG4gICAgICAgICAgICAgICAgXCJCU1BOYW1lXCIsXG4gICAgICAgICAgICAgICAgXCJCU1BBcHBsaWNhdGlvblVSTFwiLFxuICAgICAgICAgICAgICAgIFwicmVsZWFzZU5hbWVcIixcbiAgICAgICAgICAgICAgICBcIkJ1c2luZXNzQ2F0YWxvZ1wiLFxuICAgICAgICAgICAgICAgIFwiVGVjaG5pY2FsQ2F0YWxvZ1wiXSAqLyAuZm9yRWFjaChmdW5jdGlvbiAoZmllbGQpIHtcbiAgICAgICAgdGhhdC5hZGRGaWVsZChmaWVsZCk7XG4gICAgICB9KTtcbiAgICB0aGlzLnNldFJlZignaWQnKTtcbiAgICB0aGlzLnNhdmVEb2N1bWVudChmYWxzZSk7XG4gIH0pO1xuICBib21kYXRhLmZvckVhY2goZnVuY3Rpb24gKG8sIGluZGV4KSB7XG4gICAgby5pZCA9IGluZGV4O1xuICB9KTtcbiAgYm9tZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChyZWNvcmQpIHtcbiAgICBpbmRleC5hZGREb2MocmVjb3JkKTtcbiAgfSk7XG4gIHZhciBlbGFzdGljID0gaW5kZXg7XG5cbiAgLy8gZHVtcCB0aGUgbHVuciBpbmRleFxuICAvL1xuICB2YXIgdGhlSW5kZXggPSBpbmRleC50b0pTT04oKTtcbiAgdmFyIGNvbHVtbnMgPSBtZGwuY29sdW1ucy5tYXAoY29sbmFtZSA9PiB7XG4gICAgdmFyIHJlcyA9IGNhdHMuZmlsdGVyKGNhdCA9PiBjYXQubmFtZSA9PT0gY29sbmFtZSk7XG4gICAgaWYgKHJlcy5sZW5ndGggIT09IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcInVuZGVmaW5lZCBvciBub24tb2JqZWN0IGNvbHVtbiA6IFwiICsgY29sbmFtZSk7XG4gICAgfTtcbiAgICByZXR1cm4gcmVzWzBdO1xuICB9KTtcblxuICB2YXIgY29sdW1uTmFtZXMgPSBjb2x1bW5zLm1hcChjb2wgPT4gY29sLm5hbWUpO1xuXG4gIHZhciBqc29ucCA9IGB2YXIgbWRsZGF0YSA9IHt9O1xcbi8vY29sdW1ucyBcXG4gbWRsZGF0YS5jb2x1bW5zID0gW1wiJHtjb2x1bW5zLm1hcChjb2wgPT4gY29sLm5hbWUpLmpvaW4oJ1wiLFwiJyl9XCJdO2A7XG5cbiAgdmFyIGpzb24gPSBgeyBcImNvbHVtbnNcIiAgOiBbXCIke2NvbHVtbnMubWFwKGNvbCA9PiBKU09ORXNjYXBlKGNvbC5uYW1lKSkuam9pbignXCIsXCInKX1cIl0sYDtcbiAgLy8ganNvbnAgKz0gYFxcbiBtZGxkYXRhLmZ1bGxkYXRhID0gJHtKU09OLnN0cmluZ2lmeShib21kYXRhKX07XFxuYDtcbiAgLy9qc29ucCArPSBgXFxuLy9jb2x1bW5zIGluZm8gXFxuIG1kbGRhdGEubHVucmNvbHVtbnMgPSBbXCJ7JHtMVU5SSW5kZXguam9pbignXCIsXCInKX1cIl07YDtcblxuICBqc29ucCArPSBgXFxuLy9jb2x1bW5zIGluZm8gXFxuIG1kbGRhdGEuY29sdW1uc0Rlc2NyaXB0aW9uID0geyR7Y29sdW1ucy5tYXAoY29sID0+XG4gICAgYCBcXG4gXCIke2NvbC5uYW1lfVwiIDogIFwiJHtKU09ORXNjYXBlKGNvbC5kZXNjcmlwdGlvbiB8fCBjb2wubmFtZSl9XCIgYFxuICApLmpvaW4oJywnKX1cbiAgICAgIH07YDtcblxuICBqc29uICs9IGBcImNvbHVtbnNEZXNjcmlwdGlvblwiIDogeyR7Y29sdW1ucy5tYXAoY29sID0+XG4gICAgYCBcXG4gXCIke2NvbC5uYW1lfVwiIDogIFwiJHtKU09ORXNjYXBlKGNvbC5kZXNjcmlwdGlvbiB8fCBjb2wubmFtZSl9XCIgYFxuICApLmpvaW4oJywnKX1cbiAgICAgIH0sYDtcblxuXG4gIGpzb25wICs9IGBcXG4vL2NvbHVtbnMgaW5mbyBcXG4gbWRsZGF0YS5jb2x1bW5zRGVmYXVsdFdpZHRoID0geyR7Y29sdW1ucy5tYXAoY29sID0+XG4gICAgYCBcXG4gXCIke2NvbC5uYW1lfVwiIDogJHtjb2wuZGVmYXVsdFdpZHRoIHx8IDE1MH0gYFxuICApLmpvaW4oJywnKX1cbiAgICAgIH07YDtcblxuICBqc29uICs9IGBcXG5cImNvbHVtbnNEZWZhdWx0V2lkdGhcIiA6IHske2NvbHVtbnMubWFwKGNvbCA9PlxuICAgIGAgXFxuIFwiJHtjb2wubmFtZX1cIiA6ICR7Y29sLmRlZmF1bHRXaWR0aCB8fCAxNTB9IGBcbiAgKS5qb2luKCcsJyl9XG4gICAgICB9LGA7XG5cblxuXG4gIHZhciB0aGVJbmRleFN0ciA9IEpTT04uc3RyaW5naWZ5KHRoZUluZGV4KTtcblxuICBqc29ucCArPSBcIlxcbnZhciBzZXJJbmRleCA9XFxcIlwiICsgSlNPTkVzY2FwZSh0aGVJbmRleFN0cikgKyBcIlxcXCI7XFxuXCI7XG4gIC8vIGpzb25wICs9IFwiXFxudmFyIHNlckluZGV4ID1cIiArIEpTT04uc3RyaW5naWZ5KHRoZUluZGV4KSArIFwiO1xcblwiO1xuXG5cbiAganNvbiArPSAnXFxuXCJzZXJJbmRleFwiIDonICsgdGhlSW5kZXhTdHIgKyAnLCc7XG5cbiAgLy9jb25zb2xlLmxvZyhcImhlcmUgYWxsIG5hbWVzIFwiICsgSlNPTi5zdHJpbmdpZnkocWJlRGF0YU5hbWVzKSk7XG4gIHZhciBjbGVhbnNlZGRhdGEgPSBib21kYXRhLm1hcChvID0+IHtcbiAgICB2YXIgcmVzID0ge307XG4gICAgcWJlRGF0YU5hbWVzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIHJlc1trZXldID0gb1trZXldO1xuICAgIH0pO1xuICAgIHJldHVybiByZXM7XG4gIH0pO1xuXG4gIGlmICghc2lsZW50KSB7XG4gICAgY29uc29sZS5sb2coXCJkdW1waW5nIFwiICsgb3V0cHV0KTtcbiAgICBjb25zb2xlLmxvZyhcImxlbmd0aCBvZiBpbmRleCBzdHJcIiArIHRoZUluZGV4U3RyLmxlbmd0aClcbiAgICBjb25zb2xlLmxvZyhcImF2YWlsYWJsZSAgICAgICAgICBcIiArIGNvbHVtbnMubGVuZ3RoICsgXCIgY29sdW1uc1wiKTtcbiAgICBjb25zb2xlLmxvZyhcInJldHVybmluZyBhcyBkYXRhICBcIiArIHFiZURhdGFOYW1lcy5sZW5ndGggKyBcIiBjb2x1bW5zXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiaW5kZXhpbmcgICAgICAgICAgIFwiICsgTFVOUkluZGV4Lmxlbmd0aCArIFwiIGNvbHVtbnNcIik7XG4gICAgY29uc29sZS5sb2coJ3JldHVybmVkIGJ1dCBub3QgYXZhaWxhYmxlJywgXy5kaWZmZXJlbmNlKHFiZURhdGFOYW1lcywgY29sdW1uTmFtZXMpLmpvaW4oXCIsIFwiKSk7XG4gICAgY29uc29sZS5sb2coJ3JldHVybmVkIGJ1dCBub3QgaW5kZXhlZCcsIF8uZGlmZmVyZW5jZShxYmVEYXRhTmFtZXMsIExVTlJJbmRleCkuam9pbihcIiwgXCIpKTtcbiAgfVxuXG4gIGpzb25wICs9IFwidmFyIGRhdGE9XCIgKyBKU09OLnN0cmluZ2lmeShjbGVhbnNlZGRhdGEpICsgXCI7XCI7XG5cbiAganNvbiArPSAnXCJkYXRhXCI6JyArIEpTT04uc3RyaW5naWZ5KGNsZWFuc2VkZGF0YSkgKyBcIlxcbn1cIjtcblxuICBqc29ucCArPSBgXG5cbiAgICAgICAgICAgLy8gdmFyIGVsYXN0aWMgPSBlbGFzdGljbHVuci5JbmRleC5sb2FkKHNlckluZGV4KTtcblxuICBgO1xuXG4gIC8vZnMud3JpdGVGaWxlU3luYyhvdXRwdXQgKyBcIi5sdW5yLmpzXCIsIGpzb25wKTtcbiAgZnMud3JpdGVGaWxlU3luYyhvdXRwdXQgKyBcIi5sdW5yLmpzb25cIiwganNvbik7XG59XG5cblxuXG5cblxuLypcblxuICB2YXIgaW5kZXggPSBlbGFzdGlsdW5yLkluZGV4LmxvYWQob2JqKTtcblxuXG59XG5cbiBcIlFCRVwiIDogZmFsc2UsXG4gICAgICBcIlFCRUluY2x1ZGVcIiA6IHRydWUsXG4gICAgICBcIkxVTlJJbmRleFwiOiBmYWxzZVxuKi9cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxjQ2F0ZWdvcnlSZWNvcmQobTogSU1hdGNoLklNb2RlbHMsIGNhdGVnb3J5OiBzdHJpbmcsIGRvbWFpbjogc3RyaW5nLCBjYWNoZT86IGFueSk6IFByb21pc2U8Q2F0ZWdvcnlSZWNvcmQ+IHtcblxuICB2YXIgb3RoZXJkb21haW5zID0gTW9kZWwuZ2V0RG9tYWluc0ZvckNhdGVnb3J5KG0sIGNhdGVnb3J5KTtcbiAgXy5wdWxsKG90aGVyZG9tYWlucywgZG9tYWluKTtcbiAgdmFyIHJlcyA9IHtcbiAgICBvdGhlcmRvbWFpbnM6IG90aGVyZG9tYWlucyxcbiAgICBuckRpc3RpbmN0VmFsdWVzOiAwLFxuICAgIG5yRGlzdGluY3RWYWx1ZXNJbkRvbWFpbjogMCxcbiAgICBuclJlY29yZHM6IDAsXG4gICAgbnJSZWNvcmRzSW5Eb21haW46IDAsXG4gICAgbnJUb3RhbFJlY29yZHNJbkRvbWFpbjogMCxcbiAgfSBhcyBDYXRlZ29yeVJlY29yZDtcbiAgaWYgKGNhY2hlKSB7XG4gICAgZGVidWdsb2coJ2dvdCBhIGNhY2hlJyArIE9iamVjdC5rZXlzKGNhY2hlKSk7XG4gIH1cbiAgY2FjaGUgPSBjYWNoZSB8fCB7fTtcbiAgZnVuY3Rpb24gZ2V0RG9tYWluUmVjb3Jkcyhkb20pOiBQcm9taXNlPHtcbiAgICBba2V5OiBzdHJpbmddOiBhbnk7XG4gIH0+IHtcbiAgICBpZiAoY2FjaGVbZG9tXSkge1xuICAgICAgZGVidWdsb2coJ3NlZW4gZG9tYWluICcgKyBkb20pO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjYWNoZVtkb21dKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdsb2coJ25vdCBzZWVuIGRvbWFpbiAnICsgZG9tKVxuICAgICAgdmFyIHAgPSBNb2RlbC5nZXRFeHBhbmRlZFJlY29yZHNGdWxsKG0sIGRvbSk7XG4gICAgICByZXR1cm4gcC50aGVuKChyZWNvcmRzKSA9PiB7XG4gICAgICAgIGNhY2hlW2RvbV0gPSByZWNvcmRzOyByZXR1cm4gcmVjb3JkcztcbiAgICAgIH0pXG4gICAgfVxuICB9XG4gIHZhciB2YWx1ZXMgPSBbXTtcbiAgdmFyIHZhbHVlc0luRG9tYWluID0gW107XG4gIHZhciBuclJlY29yZHNJbkRvbWFpbiA9IDA7XG4gIGRlYnVnbG9nKCdpbnZlc3RpZ2F0aW5nJyArIGRvbWFpbiArICcgY2F0ZWdvcnknICsgY2F0ZWdvcnkpO1xuICByZXR1cm4gZ2V0RG9tYWluUmVjb3Jkcyhkb21haW4pLnRoZW4oKHJlY29yZHMpID0+IHtcbiAgICByZXMubnJUb3RhbFJlY29yZHNJbkRvbWFpbiA9IHJlY29yZHMubGVuZ3RoO1xuICAgIHZhciBkaXN0aW5jdFZhbHVlcyA9IHJlY29yZHMuZm9yRWFjaChmdW5jdGlvbiAob0VudHJ5KSB7XG4gICAgICBpZiAob0VudHJ5W2NhdGVnb3J5XSkge1xuICAgICAgICB2YXIgdmFsdWUgPSBvRW50cnlbY2F0ZWdvcnldO1xuICAgICAgICB2YWx1ZXNJbkRvbWFpblt2YWx1ZV0gPSAodmFsdWVzSW5Eb21haW5bdmFsdWVdIHx8IDApICsgMTtcbiAgICAgICAgcmVzLm5yUmVjb3Jkc0luRG9tYWluICs9IDE7XG4gICAgICAgIHZhbHVlc1t2YWx1ZV0gPSAodmFsdWVzW3ZhbHVlXSB8fCAwKSArIDE7XG4gICAgICAgIHJlcy5uclJlY29yZHMgKz0gMTtcbiAgICAgIH1cbiAgICB9KVxuICB9KS50aGVuKCgpID0+XG4gICAgUHJvbWlzZS5hbGwob3RoZXJkb21haW5zLm1hcChvZCA9PlxuICAgICAgZ2V0RG9tYWluUmVjb3JkcyhvZCkudGhlbigocmVjb3JkcykgPT4ge1xuICAgICAgICAvL3Jlcy5uclRvdGFsUmVjb3Jkc0luRG9tYWluID0gcmVjb3Jkcy5sZW5ndGg7XG4gICAgICAgIHZhciBkaXN0aW5jdFZhbHVlcyA9IHJlY29yZHMuZm9yRWFjaChmdW5jdGlvbiAob0VudHJ5KSB7XG4gICAgICAgICAgaWYgKG9FbnRyeVtjYXRlZ29yeV0pIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IG9FbnRyeVtjYXRlZ29yeV07XG4gICAgICAgICAgICAvL3ZhbHVlc0luRG9tYWluW3ZhbHVlXSA9ICh2YWx1ZXNJbkRvbWFpblt2YWx1ZV0gfHwgMCkgKyAxO1xuICAgICAgICAgICAgLy9yZXMubnJSZWNvcmRzSW5Eb21haW4gKz0gMTtcbiAgICAgICAgICAgIHZhbHVlc1t2YWx1ZV0gPSAodmFsdWVzW3ZhbHVlXSB8fCAwKSArIDE7XG4gICAgICAgICAgICByZXMubnJSZWNvcmRzICs9IDE7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICApXG4gICAgKS50aGVuKCgpID0+IHtcbiAgICAgIHJlcy5uckRpc3RpbmN0VmFsdWVzID0gT2JqZWN0LmtleXModmFsdWVzKS5sZW5ndGg7XG4gICAgICByZXMubnJEaXN0aW5jdFZhbHVlc0luRG9tYWluID0gT2JqZWN0LmtleXModmFsdWVzSW5Eb21haW4pLmxlbmd0aDtcbiAgICAgIHJldHVybiByZXM7XG4gICAgfSlcbiAgICApO1xufVxuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdyYXBoRG9tYWluKGRvbWFpbjogc3RyaW5nLCBtOiBJTWF0Y2guSU1vZGVscywgZG9tYWluUmVjb3JkQ2FjaGU/OiBhbnkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAvLyBkcmF3IGEgbW9kZWwgZG9tYWluc1xuICB2YXIgcmVzID0gYFxuICAgIGRpZ3JhcGggc2RzdSB7XG5cdHNpemU9XCIzNiwzNlwiO1xuICAgcmFua2Rpcj1MUlxuXHRub2RlIFtjb2xvcj15ZWxsb3csIHN0eWxlPWZpbGxlZF07XG4gICAgXCIke2RvbWFpbn1cIlxuICBgO1xuICAvLyBhZGQgYWxsIGNhdGVnb3J5IG5vZGVzXG4gIHJlcyArPSBgbm9kZSBbc2hhcGU9cmVjb3JkLCBjb2xvcj15ZWxsb3csIHN0eWxlPWZpbGxlZF07XFxuIGBcbiAgdmFyIGNhdHMgPSBNb2RlbC5nZXRDYXRlZ29yaWVzRm9yRG9tYWluKG0sIGRvbWFpbik7XG4gIHZhciBkb21haW5SZWNvcmRDYWNoZSA9IGRvbWFpblJlY29yZENhY2hlIHx8IHt9O1xuICB2YXIgY2F0ZWdvcnlSZXN1bHRzID0ge307XG4gIHZhciBvdGhlcmRvbWFpbnMgPSBbXTtcbiAgdmFyIG5yUmVjb3JkcyA9IDA7XG4gIHZhciBwID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIGNhdHMuZm9yRWFjaChmdW5jdGlvbiAoY2F0KSB7XG4gICAgcCA9IHAudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gY2FsY0NhdGVnb3J5UmVjb3JkKG0sIGNhdCwgZG9tYWluLCBkb21haW5SZWNvcmRDYWNoZSkudGhlbihcbiAgICAgICAgKGNhdFJlc3VsdCkgPT4ge1xuICAgICAgICAgIGRlYnVnbG9nKCdnb3QgcmVzdWx0IGZvciAnICsgZG9tYWluICsgJyAnICsgY2F0KTtcbiAgICAgICAgICBuclJlY29yZHMgPSBjYXRSZXN1bHQubnJUb3RhbFJlY29yZHNJbkRvbWFpbjtcbiAgICAgICAgICBjYXRlZ29yeVJlc3VsdHNbY2F0XSA9IGNhdFJlc3VsdDtcbiAgICAgICAgICBvdGhlcmRvbWFpbnMgPSBfLnVuaW9uKG90aGVyZG9tYWlucywgY2F0ZWdvcnlSZXN1bHRzW2NhdF0ub3RoZXJEb21haW5zKTtcbiAgICAgICAgICByZXMgKz0gYFwiJHtjYXR9XCIgW2xhYmVsPVwieyAke2NhdH0gfCAke2NhdFJlc3VsdC5uckRpc3RpbmN0VmFsdWVzSW5Eb21haW59IFZhbHVlcyBpbiAke2NhdFJlc3VsdC5uclJlY29yZHNJbkRvbWFpbn0gYDtcbiAgICAgICAgICBpZiAoY2F0UmVzdWx0Lm5yUmVjb3Jkc0luRG9tYWluICE9PSBjYXRSZXN1bHQubnJSZWNvcmRzKSB7XG4gICAgICAgICAgICByZXMgKz0gYHwgICR7Y2F0UmVzdWx0Lm5yRGlzdGluY3RWYWx1ZXMgLSBjYXRSZXN1bHQubnJEaXN0aW5jdFZhbHVlc0luRG9tYWlufSBvdGhlciB2YWx1ZXMgaW4gJHtjYXRSZXN1bHQubnJSZWNvcmRzIC0gY2F0UmVzdWx0Lm5yUmVjb3Jkc0luRG9tYWlufSBvdGhlciByZWNvcmRzYDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzICs9IGAgYDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzICs9IGB9XCJdXFxuYDtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuICByZXR1cm4gcC50aGVuKCgpID0+IHtcbiAgICAvLyBjYWxjdWxhdGUgb3RoZXIgZG9tYWlucy5cbiAgICAvLyBkcmF3IFwib3RoZXIgY2F0ZWdvcmllc1wiXG4gICAgcmVzICs9IGBub2RlIFtjb2xvcj1wdXJwbGUsIHN0eWxlPWZpbGxlZF07IFxcbmBcbiAgICBvdGhlcmRvbWFpbnMuZm9yRWFjaChmdW5jdGlvbiAob3RoZXJkb21haW4pIHtcbiAgICAgIHJlcyArPSBgXCIke290aGVyZG9tYWlufVwiIFxcbmA7XG4gICAgfSk7XG4gICAgLy8gY291bnQgcmVjb3JkcyBpbiBkb21haW4gOlxuICAgIC8qIHZhciBuclJlY29yZHMgPSBtLnJlY29yZHMucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBlbnRyeSkge1xuICAgICAgICByZXR1cm4gcHJldiArICgoZW50cnkuX2RvbWFpbiA9PT0gZG9tYWluKSA/IDEgOiAwKTtcbiAgICAgIH0sIDApO1xuICAgICAgKi9cbiAgICByZXMgKz0gYG5vZGUgW3NoYXBlPXJlY29yZF07IFxcbmBcbiAgICByZXMgKz0gYCBcInJlY29yZFwiIFtsYWJlbD1cIns8ZjA+ICR7ZG9tYWlufSB8ICR7bnJSZWNvcmRzfX1cIl0gXFxuYDtcblxuICAgIHJlcyArPSBgIFwicl9vdGhlclwiIFtsYWJlbD1cIns8ZjA+IG90aGVyIHwgJHtuclJlY29yZHN9fVwiXSBcXG4gYDtcblxuICAgIHJlcyArPSBgIyByZWxhdGlvbiBmcm9tIGNhdGVnb3JpZXMgdG8gZG9tYWluXFxuYDtcbiAgICBjYXRzLmZvckVhY2goZnVuY3Rpb24gKGNhdCkge1xuICAgICAgcmVzICs9IGAgXCIke2NhdH1cIiAtPiBcIiR7ZG9tYWlufVwiIFxcbmA7XG4gICAgfSlcblxuICAgIHJlcyArPSBgIyByZWxhdGlvbiBmcm9tIGNhdGVnb3JpZXMgdG8gcmVjb3Jkc1xcbmA7XG4gICAgY2F0cy5mb3JFYWNoKGZ1bmN0aW9uIChjYXQpIHtcbiAgICAgIHZhciByZWMgPSBjYXRlZ29yeVJlc3VsdHNbY2F0XTtcbiAgICAgIHJlcyArPSBgIFwiJHtjYXR9XCIgLT4gXCJyZWNvcmRcIiBcXG5gO1xuICAgIH0pXG5cbiAgICAvL290aGVyIGRvbWFpbnMgdG8gdGhpc1xuICAgIGNhdHMuZm9yRWFjaChmdW5jdGlvbiAoY2F0KSB7XG4gICAgfSlcbiAgICAvKlxuICAgIGNhdHMgZm9cbiAgICAgIGRpZ3JhcGggc2RzdSB7XG4gICAgc2l6ZT1cIjM2LDM2XCI7XG4gICAgbm9kZSBbY29sb3I9eWVsbG93LCBzdHlsZT1maWxsZWRdO1xuICAgIEZMUEQgRkxQIFwiQk9NIEVkaXRvclwiLCBcIldJS0lVUkxcIiBcIlVJNSBEb2N1bWVudGF0aW9uXCIsIFwiVUk1IEV4YW1wbGVcIiwgXCJTVEFSVFRBXCJcbiAgICBCQ1BcbiAgICBub2RlIFtjb2xvcj1ncmV5LCBzdHlsZT1maWxsZWRdO1xuICAgIG5vZGUgW2ZvbnRuYW1lPVwiVmVyZGFuYVwiLCBzaXplPVwiMzAsMzBcIl07XG4gICAgbm9kZSBbY29sb3I9Z3JleSwgc3R5bGU9ZmlsbGVkXTtcbiAgICBncmFwaCBbIGZvbnRuYW1lID0gXCJBcmlhbFwiLFxuICAgICovXG4gICAgcmVzICs9IGB9XFxuYDtcbiAgICByZXR1cm4gcmVzO1xuICB9KTtcbn1cbi8qXG4gICAgY2F0ZWdvcnlEZXNjIDogdGhlTW9kZWwuZnVsbC5kb21haW5bZmlsdGVyZG9tYWluXS5jYXRlZ29yaWVzW2NhdGVnb3J5XSxcbiAgICBkaXN0aW5jdCA6IGRpc3RpbmN0LFxuICAgIGRlbHRhIDogZGVsdGEsXG4gICAgcHJlc2VudFJlY29yZHMgOiByZWNvcmRDb3VudC5wcmVzZW50cmVjb3JkcyxcbiAgICBwZXJjUHJlc2VudCA6IHBlcmNlbnQsXG4gICAgc2FtcGxlVmFsdWVzIDogdmFsdWVzTGlzdFxuICB9XG4qL1xuXG5mdW5jdGlvbiByZXBsYWNlQnIoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcge1xuICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZSgvXFxuL2csXG4gICAgYFxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0YnJcblxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdFxcdHwgYFxuICApO1xuICByZXR1cm4gc3RyaW5nO1xufVxuXG5cblxuLyoqXG4gKiBnZW5lcmF0ZSBhIHRleHR1YWwgcmVwcmVzZW50YXRpb24gb2YgYSBkb21haW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRhYkRvbWFpbihkb21haW46IHN0cmluZywgbTogSU1hdGNoLklNb2RlbHMpOiBQcm9taXNlPHN0cmluZz4ge1xuICAvLyBkcmF3IGEgbW9kZWwgZG9tYWluc1xuICB2YXIgcmVzID0gJyc7XG4gIHZhciBtb2RlbENhY2hlID0ge307XG4gIHZhciBjYXRzID0gTW9kZWwuZ2V0Q2F0ZWdvcmllc0ZvckRvbWFpbihtLCBkb21haW4pO1xuICBjYXRzID0gTW9kZWwuc29ydENhdGVnb3JpZXNCeUltcG9ydGFuY2UobS5mdWxsLmRvbWFpbltkb21haW5dLmNhdGVnb3JpZXMgfHwge30sIGNhdHMpO1xuICAvL2NvbnNvbGUubG9nKGNhdHMuam9pbihcIlxcblwiKSk7XG4gIHJldHVybiBEZXNjcmliZS5nZXRDYXRlZ29yeVN0YXRzSW5Eb21haW4oY2F0c1swXSwgZG9tYWluLCBtKS50aGVuKChjYXRSZXN1bHQwKSA9PiB7XG4gICAgcmV0dXJuIGNhbGNDYXRlZ29yeVJlY29yZChtLCBjYXRzWzBdLCBkb21haW4sIG1vZGVsQ2FjaGUpLnRoZW4oKGNhdFJlc3VsdDEpID0+IHtcblxuICAgICAgdmFyIGRvbWFpbkRlc2NyID0gbS5mdWxsLmRvbWFpbltkb21haW5dLmRlc2NyaXB0aW9uIHx8IFwiXCI7XG4gICAgICBkb21haW5EZXNjciA9IHJlcGxhY2VCcihkb21haW5EZXNjcik7XG4gICAgICByZXMgPSBgXG5cbi8vIHByZXNldCBmb3JtIHZhbHVlcyBpZiB3ZSByZWNlaXZlIGEgdXNlcmRhdGEgb2JqZWN0IC8vXG4tIHVzZXIgPSB1c2VyXG5cbmV4dGVuZHMgLi4vbGF5b3V0X3BcblxuYmxvY2sgY29udGVudFxuXG5cdG5hdi5uYXZiYXIubmF2YmFyLWRlZmF1bHQubmF2YmFyLWZpeGVkLXRvcFxuXHRcdC5jb250YWluZXJcblx0XHRcdC5uYXZiYXItaGVhZGVyXG5cdFx0XHRcdC5uYXZiYXItYnJhbmQoc3R5bGU9J2JnY29sb3I6b3JhbmdlO2NvbG9yOmRhcmtibHVlO2ZvbnQtZmFtaWx5OkFyaWFsIEJsYWNrO2ZvbnQtc2l6ZToxNS4xMThweCcpIHdvc2FwIGRvbWFpbiAke2RvbWFpbn1cblx0XHRcdHVsLm5hdi5uYXZiYXItbmF2Lm5hdmJhci1yaWdodCAje3VpZH1cblx0XHRcdFx0bGlcblx0XHRcdFx0XHQubmF2YmFyLWJ0biNidG4tbG9nb3V0LmJ0bi5idG4tZGVmYXVsdChvbmNsaWNrPVwibG9jYXRpb24uaHJlZj0nL2hvbWUnXCIpXG5cdFx0XHRcdFx0XHR8IGJhY2sgdG8gaG9tZVxuXG5cdHAgICZuYnNwO1xuXHRwICZuYnNwO1xuXHRwXG5cblx0ZGl2LndlbGxcblx0XHRoMyBkb21haW4gXCIke2RvbWFpbn1cIlxuXHRcdFx0c3Bhbi5wdWxsLXJpZ2h0ICR7Y2F0UmVzdWx0MS5uclRvdGFsUmVjb3Jkc0luRG9tYWlufSByZWNvcmRzXG5cdFx0cFxuXHRcdHNwYW4gJHtkb21haW5EZXNjcn1cblxuXHRcdHRhYmxlLnRhYmxlLnRhYmxlLWNvbmRlbnNlZC50YWJsZS1zdHJpcGVkXG5cdFx0XHR0aGVhZFxuXHRcdFx0XHR0clxuXHRcdFx0XHRcdHRoIGNhdGVnb3J5XG5cdFx0XHRcdFx0dGgoc3R5bGU9XCJ3aWR0aDoxMCVcIikgY291bnRcblx0XHRcdFx0XHR0aFxuXHRcdFx0XHRcdFx0dGFibGVcblx0XHRcdFx0XHRcdFx0dHJcblx0XHRcdFx0XHRcdFx0XHR0ZCBzeW5vbnltc1xuXHRcdFx0XHRcdFx0XHR0clxuXHRcdFx0XHRcdFx0XHRcdHRkIGRlc2NyaXB0aW9uXG5cdFx0XHRcdFx0XHRcdHRyXG5cdFx0XHRcdFx0XHRcdFx0dGQgZXhhbXBsZSB2YWx1ZXNcblx0XHRcdHRib2R5XG5gO1xuXG4gICAgICB2YXIgY2F0ZWdvcnlSZXN1bHRzID0ge307XG4gICAgICB2YXIgb3RoZXJkb21haW5zID0gW107XG4gICAgICB2YXIgY2F0ZWdvcnlNYXAgPSBtLmZ1bGwuZG9tYWluW2RvbWFpbl0uY2F0ZWdvcmllcyB8fCB7fTtcbiAgICAgIHZhciBwVGFpbCA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgY2F0cy5mb3JFYWNoKGZ1bmN0aW9uIChjYXQpIHtcbiAgICAgICAgcFRhaWwgPSBwVGFpbC50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gRGVzY3JpYmUuZ2V0Q2F0ZWdvcnlTdGF0c0luRG9tYWluKGNhdCwgZG9tYWluLCBtKS50aGVuKFxuICAgICAgICAgICAgY2F0ZGVzYyA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxjQ2F0ZWdvcnlSZWNvcmQobSwgY2F0LCBkb21haW4sIG1vZGVsQ2FjaGUpLnRoZW4oKGNhdFJlc3VsdDIpID0+IHtcbiAgICAgICAgICAgICAgICBjYXRlZ29yeVJlc3VsdHNbY2F0XSA9IGNhdFJlc3VsdDI7XG4gICAgICAgICAgICAgICAgb3RoZXJkb21haW5zID0gXy51bmlvbihvdGhlcmRvbWFpbnMsIGNhdGVnb3J5UmVzdWx0c1tjYXRdLm90aGVyRG9tYWlucyk7XG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgcmVzICs9IGBcIiR7Y2F0fVwiIFtsYWJlbD1cInsgJHtjYXR9IHwgJHtjYXRSZXN1bHQubnJEaXN0aW5jdFZhbHVlc0luRG9tYWlufSBWYWx1ZXMgaW4gJHtjYXRSZXN1bHQubnJSZWNvcmRzSW5Eb21haW59IGA7XG4gICAgICAgICAgICAgICAgICAgIGlmKGNhdFJlc3VsdC5uclJlY29yZHNJbkRvbWFpbiAhPT0gY2F0UmVzdWx0Lm5yUmVjb3Jkcykge1xuICAgICAgICAgICAgICAgICAgICAgIHJlcyArPSAgYHwgICR7Y2F0UmVzdWx0Lm5yRGlzdGluY3RWYWx1ZXMgLSBjYXRSZXN1bHQubnJEaXN0aW5jdFZhbHVlc0luRG9tYWlufSBvdGhlciB2YWx1ZXMgaW4gJHtjYXRSZXN1bHQubnJSZWNvcmRzIC0gY2F0UmVzdWx0Lm5yUmVjb3Jkc0luRG9tYWlufSBvdGhlciByZWNvcmRzYDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXMgKz0gYCBgO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlcyArPSBgfVwiXVxcbmA7XG4gICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KG0uZnVsbC5kb21haW5bZG9tYWluXSkpO1xuICAgICAgICAgICAgICAgIGlmIChtLmZ1bGwuZG9tYWluW2RvbWFpbl0uY2F0ZWdvcmllc1tjYXRdKSB7XG4gICAgICAgICAgICAgICAgICB2YXIgc3lub255bXNTdHJpbmcgPSBVdGlsLmxpc3RUb0NvbW1hQW5kKGNhdGRlc2MuY2F0ZWdvcnlEZXNjICYmIGNhdGRlc2MuY2F0ZWdvcnlEZXNjLmNhdGVnb3J5X3N5bm9ueW1zICYmIGNhdGRlc2MuY2F0ZWdvcnlEZXNjLmNhdGVnb3J5X3N5bm9ueW1zIHx8IFtdKSB8fCBcIiZuYnNwO1wiO1xuXG4gICAgICAgICAgICAgICAgICByZXMgKz0gYFxuXHRcdFx0dHJcblx0XHRcdFx0XHR0ZC5jYXRfY291bnQgJHtjYXR9XG5cXHRcXHRcXHRcXHRcXHR0ZCAke2NhdGRlc2MucHJlc2VudFJlY29yZHN9IGRpc3RpbmN0IHZhbHVlcyBpbiAke2NhdGRlc2MucGVyY1ByZXNlbnR9JSBvZiByZWNvcmRzXG5cXHRcXHRcXHRcXHRcXHR0ZFxuXFx0XFx0XFx0XFx0XFx0XFx0dGFibGVcblxcdFxcdFxcdFxcdFxcdFxcdFxcdHRyLmNhdF9zeW5vbnltc1xuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0dGQgJHtzeW5vbnltc1N0cmluZ31cblxcdFxcdFxcdFxcdFxcdFxcdFxcdHRyLmNhdF9kZXNjcmlwdGlvblxuXFx0XFx0XFx0XFx0XFx0XFx0XFx0XFx0dGQgJHtyZXBsYWNlQnIoY2F0ZGVzYy5jYXRlZ29yeURlc2MgJiYgY2F0ZGVzYy5jYXRlZ29yeURlc2MuY2F0ZWdvcnlfZGVzY3JpcHRpb24gfHwgXCJcIil9XG5cXHRcXHRcXHRcXHRcXHRcXHRcXHR0ci5jYXRfc2FtcGxldmFsdWVzXG5cXHRcXHRcXHRcXHRcXHRcXHRcXHRcXHR0ZCAke3JlcGxhY2VCcihjYXRkZXNjLnNhbXBsZVZhbHVlcyl9XG4gICAgICBgO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGNhdGRlc2MpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHBUYWlsLnRoZW4oKCkgPT4ge1xuICAgICAgICB2YXIgb3RoZXJjYXRzID0gY2F0cy5sZW5ndGggLSBPYmplY3Qua2V5cyhtLmZ1bGwuZG9tYWluW2RvbWFpbl0uY2F0ZWdvcmllcykubGVuZ3RoO1xuICAgICAgICB2YXIgcmVtYWluaW5nQ2F0ZWdvcmllcyA9IF8uZGlmZmVyZW5jZShjYXRzLCBPYmplY3Qua2V5cyhtLmZ1bGwuZG9tYWluW2RvbWFpbl0uY2F0ZWdvcmllcykpO1xuICAgICAgICBpZiAoKG90aGVyY2F0cykgPiAwKSB7XG4gICAgICAgICAgcmVzICs9IGBcblxcdFxcdHAgICBhbmQgJHtvdGhlcmNhdHN9IG90aGVyIGNhdGVnb3JpZXNcblxcdFxcdHwgJHtVdGlsLmxpc3RUb0NvbW1hQW5kKHJlbWFpbmluZ0NhdGVnb3JpZXMpfVxuICAgICAgIGBcbiAgICAgICAgfVxuICAgICAgICAvKlxuICAgICAgICAgIC8vIGNhbGN1bGF0ZSBvdGhlciBkb21haW5zLlxuICAgICAgICAgIC8vIGRyYXcgXCJvdGhlciBjYXRlZ29yaWVzXCJcbiAgICAgICAgICByZXMgKz0gYG5vZGUgW2NvbG9yPXB1cnBsZSwgc3R5bGU9ZmlsbGVkXTsgXFxuYFxuICAgICAgICAgIG90aGVyZG9tYWlucy5mb3JFYWNoKGZ1bmN0aW9uKG90aGVyZG9tYWluKSB7XG4gICAgICAgICAgICByZXMgKz0gYFwiJHtvdGhlcmRvbWFpbn1cIiBcXG5gO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIC8vIGNvdW50IHJlY29yZHMgaW4gZG9tYWluIDpcbiAgICAgICAgICB2YXIgbnJSZWNvcmRzID0gbS5yZWNvcmRzLnJlZHVjZShmdW5jdGlvbihwcmV2LGVudHJ5KSB7XG4gICAgICAgICAgcmV0dXJuIHByZXYgKyAoKGVudHJ5Ll9kb21haW4gPT09IGRvbWFpbikgPyAxIDogMCk7XG4gICAgICAgICAgfSwwKTtcbiAgICAgICAgICByZXMgKz0gYG5vZGUgW3NoYXBlPXJlY29yZF07IFxcbmBcbiAgICAgICAgICByZXMgKz0gYCBcInJlY29yZFwiIFtsYWJlbD1cIns8ZjA+ICR7ZG9tYWlufSB8ICR7bnJSZWNvcmRzfX1cIl0gXFxuYDtcblxuICAgICAgICAgIHJlcyArPSBgIFwicl9vdGhlclwiIFtsYWJlbD1cIns8ZjA+IG90aGVyIHwgJHtuclJlY29yZHN9fVwiXSBcXG4gYDtcblxuICAgICAgICAgIHJlcyArPSBgIyByZWxhdGlvbiBmcm9tIGNhdGVnb3JpZXMgdG8gZG9tYWluXFxuYDtcbiAgICAgICAgICBjYXRzLmZvckVhY2goZnVuY3Rpb24oY2F0KSB7XG4gICAgICAgICAgICByZXMgKz0gYCBcIiR7Y2F0fVwiIC0+IFwiJHtkb21haW59XCIgXFxuYDtcbiAgICAgICAgICB9KVxuXG5cbiAgICAgICAgICByZXMgKz0gYCMgcmVsYXRpb24gZnJvbSBjYXRlZ29yaWVzIHRvIHJlY29yZHNcXG5gO1xuICAgICAgICAgIGNhdHMuZm9yRWFjaChmdW5jdGlvbihjYXQpIHtcbiAgICAgICAgICAgIHZhciByZWMgPSBjYXRlZ29yeVJlc3VsdHNbY2F0XTtcbiAgICAgICAgICAgIHJlcyArPSBgIFwiJHtjYXR9XCIgLT4gXCJyZWNvcmRcIiBcXG5gO1xuICAgICAgICAgIH0pXG5cblxuICAgICAgICAgIC8vb3RoZXIgZG9tYWlucyB0byB0aGlzXG4gICAgICAgICAgY2F0cy5mb3JFYWNoKGZ1bmN0aW9uKGNhdCkge1xuXG5cbiAgICAgICAgICB9KVxuICAgICAgICAqL1xuICAgICAgICAvKlxuICAgICAgICBjYXRzIGZvXG4gICAgICAgICAgZGlncmFwaCBzZHN1IHtcbiAgICAgICAgc2l6ZT1cIjM2LDM2XCI7XG4gICAgICAgIG5vZGUgW2NvbG9yPXllbGxvdywgc3R5bGU9ZmlsbGVkXTtcbiAgICAgICAgRkxQRCBGTFAgXCJCT00gRWRpdG9yXCIsIFwiV0lLSVVSTFwiIFwiVUk1IERvY3VtZW50YXRpb25cIiwgXCJVSTUgRXhhbXBsZVwiLCBcIlNUQVJUVEFcIlxuICAgICAgICBCQ1BcbiAgICAgICAgbm9kZSBbY29sb3I9Z3JleSwgc3R5bGU9ZmlsbGVkXTtcbiAgICAgICAgbm9kZSBbZm9udG5hbWU9XCJWZXJkYW5hXCIsIHNpemU9XCIzMCwzMFwiXTtcbiAgICAgICAgbm9kZSBbY29sb3I9Z3JleSwgc3R5bGU9ZmlsbGVkXTtcbiAgICAgICAgZ3JhcGggWyBmb250bmFtZSA9IFwiQXJpYWxcIixcbiAgICAgICAgKi9cbiAgICAgICAgcmVzICs9IGBcblx0XHRoMyBWZXJzaW9uXG5cdFx0XHRhLnNtYWxsKGhyZWY9XCIvd2hhdHNuZXdcIilcblxuXG5ibG9jayBzY3JpcHRzXG5cdHNjcmlwdChzcmM9Jy92ZW5kb3IvanF1ZXJ5LTIuMi4zLm1pbi5qcycpXG5cdHNjcmlwdChzcmM9Jy92ZW5kb3IvYm9vdHN0cmFwLm1pbi5qcycpXG5cdHNjcmlwdChzcmM9Jy9qcy92aWV3cy9zZXR0aW5ncy5qcycpXG5gO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pLnRoZW4oKCkgPT4ge1xuICAgIHJldHVybiByZXM7XG4gIH0pO1xufVxuXG5cbmltcG9ydCB7IGV4ZWMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcblxuXG5mdW5jdGlvbiBleGVjQ21kKGNtZDogc3RyaW5nKSB7XG4gIGV4ZWMoY21kLCBmdW5jdGlvbiAoZXJyb3IsIHN0ZG91dCwgc3RkZXJyKSB7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBleGVjIGVycm9yOiAke2Vycm9yfWApXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc29sZS5sb2coYHN0ZG91dDogJHtzdGRvdXR9YClcbiAgICBjb25zb2xlLmxvZyhgc3RkZXJyOiAke3N0ZGVycn1gKVxuICB9KVxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHZpc01vZGVscyhtOiBJTWF0Y2guSU1vZGVscywgZm9sZGVyT3V0OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAvLyB3ZSB3YW50IHRvIGV4ZWN1dGUgdGhlIGRvbWFpbnMgaW4gc2VxdWVuY2UgdG8gYXZvaWQgYW5kIG91dCBvZiBtZW1vcnlcbiAgdmFyIHAgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgdmFyIGRvbWFpblJlY29yZENhY2hlID0ge307XG4gIG0uZG9tYWlucy5mb3JFYWNoKHNEb21haW4gPT4ge1xuICAgIHAgPSBwLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGdyYXBoRG9tYWluKHNEb21haW4sIG0sIGRvbWFpblJlY29yZENhY2hlKS50aGVuKChzKSA9PiB7XG4gICAgICAgIGRlYnVnbG9nKCdkb25lIHdpdGggcmVzdWx0IGZvciAnICsgc0RvbWFpbiArICcgJyArIHMubGVuZ3RoKTtcbiAgICAgICAgdmFyIGZuR3JhcGggPSBmb2xkZXJPdXQgKyBcIi9cIiArIHNEb21haW4ucmVwbGFjZSgvIC9nLCAnXycpICsgXCIuZ3ZcIjtcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhmbkdyYXBoLCBzKTtcbiAgICAgICAgaWYgKHByb2Nlc3MuZW52LkdSQVBIVklaKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJoZXJlIHRoZSBmaWxlIFwiICsgZm5HcmFwaCk7XG4gICAgICAgICAgZXhlY0NtZChwcm9jZXNzLmVudi5HUkFQSFZJWiArIFwiIC1UanBlZyAtTyBcIiArIGZuR3JhcGgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgICApO1xuICAgIH0pXG4gIH0pO1xuICByZXR1cm4gcDtcbn07XG4vKlxuICByZXR1cm4gUHJvbWlzZS5hbGwobS5kb21haW5zLm1hcChmdW5jdGlvbiAoc0RvbWFpbikge1xuICAgIGNvbnNvbGUubG9nKCdtYWtpbmcgZG9tYWluJyArIHNEb21haW4pO1xuICAgIHJldHVybiBncmFwaERvbWFpbihzRG9tYWluLCBtKS50aGVuKChzKSA9PiB7XG4gICAgICB2YXIgZm5HcmFwaCA9IGZvbGRlck91dCArIFwiL1wiICsgc0RvbWFpbi5yZXBsYWNlKC8gL2csICdfJykgKyBcIi5ndlwiO1xuICAgICAgZnMud3JpdGVGaWxlU3luYyhmbkdyYXBoLCBzKTtcbiAgICAgIGlmIChwcm9jZXNzLmVudi5HUkFQSFZJWikge1xuICAgICAgICBjb25zb2xlLmxvZyhcImhlcmUgdGhlIGZpbGUgXCIgKyBmbkdyYXBoKTtcbiAgICAgICAgZXhlY0NtZChwcm9jZXNzLmVudi5HUkFQSFZJWiArIFwiIC1UanBlZyAtTyBcIiArIGZuR3JhcGgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KVxuICApO1xufVxuKi9cblxuZXhwb3J0IGZ1bmN0aW9uIHRhYk1vZGVscyhtOiBJTWF0Y2guSU1vZGVscywgZm9sZGVyT3V0OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICB2YXIgcCA9IFByb21pc2UucmVzb2x2ZSgpO1xuICBtLmRvbWFpbnMuZm9yRWFjaCgoc0RvbWFpbikgPT4ge1xuICAgIHAgPSBwLnRoZW4oKCkgPT4ge1xuICAgICAgdGFiRG9tYWluKHNEb21haW4sIG0pLnRoZW4oKHMpID0+IHtcbiAgICAgICAgdmFyIGZuR3JhcGggPSBmb2xkZXJPdXQgKyBcIi9cIiArIHNEb21haW4ucmVwbGFjZSgvIC9nLCAnXycpICsgXCIuamFkZVwiO1xuICAgICAgICBkZWJ1Z2xvZyhcImhlcmUgdGhlIGZpbGUgXCIgKyBmbkdyYXBoKTtcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhmbkdyYXBoLCBzKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbiAgcmV0dXJuIHAudGhlbigoKSA9PiB7IH0pO1xufVxuIl19
