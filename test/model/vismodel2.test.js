
var root = '../../js';

//var debug = require('debug')('vismodel.nunit');

const Vismodel = require(root + '/model/vismodel.js');

const Model = require(root + '/model/index_model.js').Model;

const getModel2 = require(root + '/model/testmodels.js').getTestModel2;


it('testCalcCategoryRecordAppComp', done => {
  getModel2().then((mdl2) => {
    debugger;
    Vismodel.calcCategoryRecord(mdl2, 'ApplicationComponent', 'FioriBOM').then((rec) => {
      expect(rec).toEqual({
        otherdomains: [],
        nrDistinctValues: 710,
        nrDistinctValuesInDomain: 710,
        nrRecords: 12779,
        nrRecordsInDomain: 12779,
        nrTotalRecordsInDomain: 12779
      });
      done();
      Model.releaseModel(mdl2);
    });
  });
});


var fs = require('fs');
//const { JsxEmit } = require('typescript');

try {
  fs.mkdirSync('./tmp');
  fs.mkdirSync('./tmp/testmodel2');
  fs.mkdirSync('./tmp/testmodel2/graph');
} catch (e) {
  /*emtpy*/
}


it('testMakeViz2', done => {
  jest.setTimeout(500000);
  expect.assertions(1);
  getModel2().then((mdl2) => {
    try {
      fs.mkdirSync('./tmp/testmodel2/graph');
    } catch (e) {
      /*emtpy*/
    }
    Vismodel.visModels(mdl2, './tmp/testmodel2/graph').then(() => {
      expect(1).toEqual(1);
      done();
      Model.releaseModel(mdl2);
    });
  });
});


//var mdltest = Model.loadModels();

try {
  fs.mkdirSync('./tmp/testmodel');
  fs.mkdirSync('./tmp/testmodel/graph');
} catch (e) {
  /*emtpy*/
}

it('testMakeTab', done => {
  expect.assertions(1);
  try {
    fs.mkdirSync('./tmp/testmodel/graph');
  } catch (e) {
    /*emtpy*/
  }
  getModel2().then((mdltest) => {
    Vismodel.tabModels(mdltest, './tmp/testmodel/graph').then(() => {
      expect(1).toEqual(1);
      done();
      Model.releaseModel(mdltest);
    });
  });
});

var TESTMODELLOCATION = '';

it('testMakeLUNR', done => {
  Vismodel.makeLunrIndex(TESTMODELLOCATION + 'testmodel/iupacs', './tmp/model_iupac', true);
  done();
});