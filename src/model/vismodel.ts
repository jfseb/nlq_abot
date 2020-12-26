/**
 * visualize a model and calculate some statistics
 */



import * as IMatch from '../match/ifmatch';


import * as fs from 'fs';

import { Model as Model } from '../model/index_model';

import * as Util from 'abot_utils';

import * as Describe from '../match/describe';

import * as _ from 'lodash';
import * as debug from 'debugf';

//import * as elasticlunr from 'elasticlunr';

var debuglog = debug('vismodel');

interface CategoryRecord {
  otherdomains: string[],
  nrDistinctValues: number,
  nrDistinctValuesInDomain: number,
  nrRecords: number,
  nrRecordsInDomain: number,
  nrTotalRecordsInDomain: number
};

var elasticlunr = require('elasticlunr');


export function JSONEscape(s: string) {

  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n")
    .replace(/\'/g, "\\'")
    .replace(/\"/g, '\\"')
    .replace(/\&/g, "\\&")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
  // .replace(/\b/g, "\\b")
  // .replace(/\f/g, "\\f");
};


// TODO: this has to be rewritten!

export function makeLunrIndex(modelpath: string, output: string, silent?: boolean) {
  var mdl = JSON.parse('' + fs.readFileSync(modelpath + '.model.json'));
  var data = JSON.parse('' + fs.readFileSync(modelpath + '.data.json'));

  var cats = mdl.category.filter(a => typeof a !== 'string');

  var qbeDataObjects = cats.filter(cat => (cat.QBE || cat.QBEInclude));

  //console.log("here cats" + JSON.stringify(cats));
  //console.log("\nhere data objects" + JSON.stringify(qbeDataObjects));
  var qbeDataNames = qbeDataObjects.map(cat => cat.name);

  qbeDataNames = _.union(qbeDataNames, mdl.columns)


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
                "TechnicalCatalog"] */ .forEach(function (field) {
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
    };
    return res[0];
  });

  var columnNames = columns.map(col => col.name);

  var jsonp = `var mdldata = {};\n//columns \n mdldata.columns = ["${columns.map(col => col.name).join('","')}"];`;

  var json = `{ "columns"  : ["${columns.map(col => JSONEscape(col.name)).join('","')}"],`;
  // jsonp += `\n mdldata.fulldata = ${JSON.stringify(bomdata)};\n`;
  //jsonp += `\n//columns info \n mdldata.lunrcolumns = ["{${LUNRIndex.join('","')}"];`;

  jsonp += `\n//columns info \n mdldata.columnsDescription = {${columns.map(col =>
    ` \n "${col.name}" :  "${JSONEscape(col.description || col.name)}" `
  ).join(',')}
      };`;

  json += `"columnsDescription" : {${columns.map(col =>
    ` \n "${col.name}" :  "${JSONEscape(col.description || col.name)}" `
  ).join(',')}
      },`;


  jsonp += `\n//columns info \n mdldata.columnsDefaultWidth = {${columns.map(col =>
    ` \n "${col.name}" : ${col.defaultWidth || 150} `
  ).join(',')}
      };`;

  json += `\n"columnsDefaultWidth" : {${columns.map(col =>
    ` \n "${col.name}" : ${col.defaultWidth || 150} `
  ).join(',')}
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
    console.log("length of index str" + theIndexStr.length)
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





/*

  var index = elastilunr.Index.load(obj);


}

 "QBE" : false,
      "QBEInclude" : true,
      "LUNRIndex": false
*/



export function calcCategoryRecord(m: IMatch.IModels, category: string, domain: string, cache?: any): Promise<CategoryRecord> {

  var otherdomains = Model.getDomainsForCategory(m, category);
  _.pull(otherdomains, domain);
  var res = {
    otherdomains: otherdomains,
    nrDistinctValues: 0,
    nrDistinctValuesInDomain: 0,
    nrRecords: 0,
    nrRecordsInDomain: 0,
    nrTotalRecordsInDomain: 0,
  } as CategoryRecord;
  if (cache) {
    debuglog('got a cache' + Object.keys(cache));
  }
  cache = cache || {};
  function getDomainRecords(dom): Promise<{
    [key: string]: any;
  }> {
    if (cache[dom]) {
      debuglog('seen domain ' + dom);
      return Promise.resolve(cache[dom]);
    } else {
      debuglog('not seen domain ' + dom)
      var p = Model.getExpandedRecordsFull(m, dom);
      return p.then((records) => {
        cache[dom] = records; return records;
      })
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
    })
  }).then(() =>
    Promise.all(otherdomains.map(od =>
      getDomainRecords(od).then((records) => {
        //res.nrTotalRecordsInDomain = records.length;
        var distinctValues = records.forEach(function (oEntry) {
          if (oEntry[category]) {
            var value = oEntry[category];
            //valuesInDomain[value] = (valuesInDomain[value] || 0) + 1;
            //res.nrRecordsInDomain += 1;
            values[value] = (values[value] || 0) + 1;
            res.nrRecords += 1;
          }
        })
      })
    )
    ).then(() => {
      res.nrDistinctValues = Object.keys(values).length;
      res.nrDistinctValuesInDomain = Object.keys(valuesInDomain).length;
      return res;
    })
    );
}



export function graphDomain(domain: string, m: IMatch.IModels, domainRecordCache?: any): Promise<string> {
  // draw a model domains
  var res = `
    digraph sdsu {
	size="36,36";
   rankdir=LR
	node [color=yellow, style=filled];
    "${domain}"
  `;
  // add all category nodes
  res += `node [shape=record, color=yellow, style=filled];\n `
  var cats = Model.getCategoriesForDomain(m, domain);
  var domainRecordCache = domainRecordCache || {};
  var categoryResults = {};
  var otherdomains = [];
  var nrRecords = 0;
  var p = Promise.resolve();
  cats.forEach(function (cat) {
    p = p.then(() => {
      return calcCategoryRecord(m, cat, domain, domainRecordCache).then(
        (catResult) => {
          debuglog('got result for ' + domain + ' ' + cat);
          nrRecords = catResult.nrTotalRecordsInDomain;
          categoryResults[cat] = catResult;
          otherdomains = _.union(otherdomains, categoryResults[cat].otherDomains);
          res += `"${cat}" [label="{ ${cat} | ${catResult.nrDistinctValuesInDomain} Values in ${catResult.nrRecordsInDomain} `;
          if (catResult.nrRecordsInDomain !== catResult.nrRecords) {
            res += `|  ${catResult.nrDistinctValues - catResult.nrDistinctValuesInDomain} other values in ${catResult.nrRecords - catResult.nrRecordsInDomain} other records`;
          } else {
            res += ` `;
          }
          res += `}"]\n`;
        });
    });
  });
  return p.then(() => {
    // calculate other domains.
    // draw "other categories"
    res += `node [color=purple, style=filled]; \n`
    otherdomains.forEach(function (otherdomain) {
      res += `"${otherdomain}" \n`;
    });
    // count records in domain :
    /* var nrRecords = m.records.reduce(function (prev, entry) {
        return prev + ((entry._domain === domain) ? 1 : 0);
      }, 0);
      */
    res += `node [shape=record]; \n`
    res += ` "record" [label="{<f0> ${domain} | ${nrRecords}}"] \n`;

    res += ` "r_other" [label="{<f0> other | ${nrRecords}}"] \n `;

    res += `# relation from categories to domain\n`;
    cats.forEach(function (cat) {
      res += ` "${cat}" -> "${domain}" \n`;
    })

    res += `# relation from categories to records\n`;
    cats.forEach(function (cat) {
      var rec = categoryResults[cat];
      res += ` "${cat}" -> "record" \n`;
    })

    //other domains to this
    cats.forEach(function (cat) {
    })
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
/*
    categoryDesc : theModel.full.domain[filterdomain].categories[category],
    distinct : distinct,
    delta : delta,
    presentRecords : recordCount.presentrecords,
    percPresent : percent,
    sampleValues : valuesList
  }
*/

function replaceBr(string: string): string {
  string = string.replace(/\n/g,
    `
\t\t\t\t\t\t\t\t\t\t\tbr
\t\t\t\t\t\t\t\t\t\t\t| `
  );
  return string;
}



/**
 * generate a textual representation of a domain
 */
export function tabDomain(domain: string, m: IMatch.IModels): Promise<string> {
  // draw a model domains
  var res = '';
  var modelCache = {};
  var cats = Model.getCategoriesForDomain(m, domain);
  cats = Model.sortCategoriesByImportance(m.full.domain[domain].categories || {}, cats);
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
          return Describe.getCategoryStatsInDomain(cat, domain, m).then(
            catdesc => {
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
              }
              );
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
       `
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


import { exec } from 'child_process';


function execCmd(cmd: string) {
  exec(cmd, function (error, stdout, stderr) {
    if (error) {
      console.error(`exec error: ${error}`)
      return
    }
    console.log(`stdout: ${stdout}`)
    console.log(`stderr: ${stderr}`)
  })
};

export function visModels(m: IMatch.IModels, folderOut: string): Promise<any> {
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
      }
      );
    })
  });
  return p;
};
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

export function tabModels(m: IMatch.IModels, folderOut: string): Promise<any> {
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
