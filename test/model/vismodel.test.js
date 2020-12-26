var root =  '../../js';

//var debug = require('debug')('vismodel.nunit');

const Vismodel = require(root + '/model/vismodel.js');

const Model = require(root + '/model/index_model.js').Model;

const getModel = require(root + '/model/testmodels.js').getTestModel1;

//var m = Model.loadModels();

it('testCalcCategoryRecord', done => {
  getModel().then((m) => {
    Vismodel.calcCategoryRecord(m, 'element name', 'IUPAC').then((rec) => {
      expect(rec).toEqual({
        otherdomains: ['Philosophers elements'],
        nrDistinctValues: 122,
        nrDistinctValuesInDomain: 118,
        nrRecords: 122,
        nrRecordsInDomain: 118,
        nrTotalRecordsInDomain: 118
      });
      done();
      Model.releaseModel(m);
    });
  });
});

it('testCalcCategoryRecordOtherDomain', done => {
  getModel().then((m) => {
    Vismodel.calcCategoryRecord(m, 'element name', 'Philosophers elements').then((rec) => {
      expect(rec).toEqual({
        otherdomains: ['IUPAC'],
        nrDistinctValues: 122,
        nrDistinctValuesInDomain: 4,
        nrRecords: 122,
        nrRecordsInDomain: 4,
        nrTotalRecordsInDomain: 4
      });
      done();
      Model.releaseModel(m);
    });
  });
});

