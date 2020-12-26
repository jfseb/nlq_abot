/*! copyright gerd forstmann, all rights reserved */
var process = require('process');
var root = '../../js';

var Schemaload = require(root + '/modelload/schemaload.js');
//var FUtils = require(root + '/model/model.js');

//var debuglog = require('debugf')('schemaload.nunit.js');
var modelPath = 'testmodel/';
/**
 * Unit test for sth
 */
it('testSchemaLoadNames', async () => {
  expect.assertions(1);
  var res = Schemaload.loadModelNames(modelPath);
  expect(res).toEqual([
    'metamodels',
    'iupacs',
    'philoelements',
    'cosmos',
    'r3trans',
    'fioriapps',
    'sobj_tables',
    'fioribecatalogs',
    'demomdls']);
});

// load distinct values from model

process.on('unhandledRejection', function onError(err) {
  console.log(err);
  console.log(err.stack);
  throw err;
});


it('testmapType', async () => {
  expect.assertions(3);
  [
    { input: 'String', expected: String },
    { input: 'Boolean', expected: Boolean },
    { input: 'Number', expected: Number }
  ].forEach(function (fixture) {
    var res = Schemaload.mapType(fixture.input);
    expect(res).toEqual(fixture.expected);
  });
});

it('testReplaceIfTypeRemoveM', async () => {
  var obj = { _m_abc: 1 };
  Schemaload.replaceIfTypeDeleteM(obj, 1, '_m_abc');
  expect(obj).toEqual({});
});

it('testmapTypeThrows', async () => {
  expect.assertions(1);
  try {
    Schemaload.mapType('notype');
    expect(1).toEqual(0);
  } catch (e) {
    expect(1).toEqual(1);
  }
});

/**
 * Unit test for sth
 */
it('testTypeProps', async () => {
  expect.assertions(1);
  var res = Schemaload.typeProps({
    'object_name': {
      'type': 'String',
      'trim': true,
      '_m_category': 'object name',
      'index': true
    }
  });

  expect(res).toEqual({
    'object_name': {
      'type': String,
      'trim': true,
      'index': true
    }
  });
});


it('testmakeMongooseCollName', async () => {
  expect.assertions(1);
  var res = Schemaload.makeMongoCollectionName('abc');
  expect(res).toEqual('abc');

});

it('testmakeMongooseCollName2', async () => {
  expect.assertions(1);
  var res = Schemaload.makeMongoCollectionName('abcs');
  expect(res).toEqual('abcs');
});

it('testmakeMongooseCollName3', async () => {
  expect.assertions(1);
  var res = Schemaload.makeMongoCollectionName('abcs');
  expect(res).toEqual('abcs');
});

it('testmakeMongooseCollNameThrows', async () => {
  expect.assertions(1);
  try {
    Schemaload.makeMongooseCollectionName('aBc');
    test.equaL(1, 0);
  } catch (e) {
    expect(1).toEqual(1);
  }

  //test.done()

});


it('testCmpTools', async () => {
  expect.assertions(1);
  var res =
    Schemaload.cmpTools({ name: 'bb' }, { name: 'aaa' });
  expect(res > 0).toEqual(true);

});

