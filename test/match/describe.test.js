/**
 * @file
 * @module toolmatcher.nunit
 * @copyright (c) 2016 Gerd Forstmann
 */
const process = require('process');
var root = '../../js';


var debuglog = require('debug')('describe.nunit');

//var debuglog = require('debug')('listall.nunit');

const Describe = require(root + '/match/describe.js');


const Model = require(root + '/model/index_model.js').Model;
process.on('unhandledRejection', function onError(err) {
  console.log(err);
  console.log(err.stack);
  throw err;
});

const getModel = require(root + '/model/testmodels.js').getTestModel1;

it('testSloppyOrExactExact', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    var res = Describe.sloppyOrExact('unit tests', 'unit tEsts', theModel);
    expect(res).toEqual('"unit tEsts"');
    done();
    Model.releaseModel(theModel);
  });
});

it('testSloppyOrExactPlural', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    var res = Describe.sloppyOrExact('unit test', 'Unit tests', theModel);
    expect(res).toEqual('"Unit tests" (interpreted as "unit test")');
    done();
    Model.releaseModel(theModel);
  });

});

it('testSloppyOrExactSloppy', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    var res = Describe.sloppyOrExact('unit tests', 'Uint tests', theModel);
    expect(res).toEqual('"Uint tests" (interpreted as "unit tests")');
    done();
    Model.releaseModel(theModel);
  });

});

it('testSloppyOrExactSyn', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    var res = Describe.sloppyOrExact('element name', 'name', theModel);
    expect(res).toEqual('"name" (interpreted as synonym for "element name")');
    done();
    Model.releaseModel(theModel);
  });

});

it('testCountPresence', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    Describe.countRecordPresence('orbits', 'Cosmos', theModel).then(res => {
      expect(res).toEqual({
        totalrecords: 7,
        presentrecords: 3,
        values: { 'Sun': 2, 'Alpha Centauri C': 1, undefined: 3, 'n/a': 1 },
        multivalued: false
      });
      done();
      Model.releaseModel(theModel);
    });
  });
});

it('testDescribeFactInDomain', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    Describe.describeFactInDomain('nomatchnotevenclose', undefined, theModel).then(res => {
      var cmp = 'I don\'t know anything about "nomatchnotevenclose".\n';
      debuglog(res);
      debuglog(cmp);
      expect(res).toEqual(cmp);
      done();
      Model.releaseModel(theModel);
    });
  });
});

it('testDescribeFactInDomainFilter', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    Describe.describeFactInDomain('nomatchnotevenclose', 'IUPAC', theModel).then(res => {
      var cmp = '"nomatchnotevenclose" is no known fact in domain "IUPAC".\n';
      debuglog(res);
      debuglog(cmp);
      expect(res).toEqual(cmp);
      done();
      Model.releaseModel(theModel);
    });
  });
});

it('testDescribeFactInDomainSun', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    Describe.describeFactInDomain('sun', undefined, theModel).then((res) => {
      //var cmp = '"sun" has a meaning in domain "Cosmos":\n"sun" ...\nis a value for category "orbits" present in 2(28.6%) of records;\nis a value for category "object name" present in 1(14.3%) of records;\n' == '"sun" has a meaning in domain "Cosmos":\n"sun" is a value for category "orbits" present in 2(28.6%) of records;\n';
      //var cmp = '"sun" has a meaning in domain "Cosmos":\n"sun" ...\nis a value for category "orbits" present in 2(28.6%) of records;\nis a value for category "object name" present in 1(14.3%) of records;\n';
      var cmp = '"sun" has a meaning in one domain "Cosmos":\n"sun" ...\n' +
        'is a value for category "object name" present in 1(14.3%) of records;\n' +
        'is a value for category "orbits" present in 2(28.6%) of records;\n'
        ;
      cmp = '"sun" has a meaning in one domain "Cosmos":\n"sun" ...\nis a value for category "orbits" present in 2(28.6%) of records;\nis a value for category "object name" present in 1(14.3%) of records;\n';


      debuglog(res);
      debuglog(cmp);
      expect(res).toEqual(cmp);
      done();
      Model.releaseModel(theModel);
    });
  });

});

it('testDescribeFactInDomainSunCosmos', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    Describe.describeFactInDomain('sun', 'Cosmos', theModel).then(res => {
      var cmp = '"sun" has a meaning in domain "Cosmos":\n"sun" ...\nis a value for category "orbits" present in 2(28.6%) of records;\nis a value for category "object name" present in 1(14.3%) of records;\n';
      cmp = '"sun" has a meaning in domain "Cosmos":\n"sun" ...\nis a value for category "object name" present in 1(14.3%) of records;\nis a value for category "orbits" present in 2(28.6%) of records;\n';
      cmp = '"sun" has a meaning in domain "Cosmos":\n"sun" ...\nis a value for category "orbits" present in 2(28.6%) of records;\nis a value for category "object name" present in 1(14.3%) of records;\n';
      debuglog(res);
      debuglog(cmp);
      expect(res).toEqual(cmp);
      done();
      Model.releaseModel(theModel);
    });
  });
});

it('testDescribeFactInDomainProxima2', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    Describe.describeFactInDomain('Proxima Centauri', 'Cosmos', theModel).then(res => {
      var cmp = `"Proxima Centauri" has a meaning in domain "Cosmos":
  "Proxima Centauri" (interpreted as "Alpha Centauri C") is a value for category "object name" present in 1(14.3%) of records;\n`;

      cmp = '"Proxima Centauri" has a meaning in domain "Cosmos":\n"Proxima Centauri" (interpreted as "Alpha Centauri C") is a value for category "object name" present in 1(14.3%) of records;\n"Proxima Centauri" (interpreted as "Proxima Centauri b") is a value for category "object name" present in 1(14.3%) of records;\n';

      cmp = '"Proxima Centauri" has a meaning in domain "Cosmos":\n"Proxima Centauri" (interpreted as "Alpha Centauri C") is a value for category "object name" present in 1(14.3%) of records;\n';

      cmp = '"Proxima Centauri" has a meaning in domain "Cosmos":\n"Proxima Centauri" (interpreted as "Alpha Centauri B") is a value for category "object name" present in 1(14.3%) of records;\n';
      debuglog(res);
      debuglog(cmp);
      expect(res).toEqual(cmp);
      done();
      Model.releaseModel(theModel);
    });
  });
});

///TODO FIX THIS

it('testDescribeFactInDomainAlpha', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    Describe.describeFactInDomain('Alpha Centauri C', 'Cosmos', theModel).then(res => {
      var cmp = '"Alpha Centauri C" has a meaning in domain "Cosmos":\n' +
        '"Alpha Centauri C" ...\n' +
        'is a value for category "object name" present in 1(14.3%) of records;\n' +
        'is a value for category "orbits" present in 1(14.3%) of records;\n';

      cmp =
        '"Alpha Centauri C" has a meaning in domain "Cosmos":\n"Alpha Centauri C" (interpreted as "Alpha Centauri A") is a value for category "object name" present in 1(14.3%) of records;\n"Alpha Centauri C" (interpreted as "Alpha Centauri B") is a value for category "object name" present in 1(14.3%) of records;\n"Alpha Centauri C" ...\nis a value for category "object name" present in 1(14.3%) of records;\nis a value for category "orbits" present in 1(14.3%) of records;\n'; debuglog(res);
      //cmp = '"Alpha Centauri C" has a meaning in domain "Cosmos":\n"Alpha Centauri C" (interpreted as "Alpha Centauri B") is a value for category "object name" present in 1(14.3%) of records;\n"Alpha Centauri C" (interpreted as "Alpha Centauri A") is a value for category "object name" present in 1(14.3%) of records;\n"Alpha Centauri C" ...\nis a value for category "object name" present in 1(14.3%) of records;\nis a value for category "orbits" present in 1(14.3%) of records;\n';

      debuglog(cmp);
      expect(res).toEqual(cmp);
      done();
      Model.releaseModel(theModel);
    });
  });

});

it('testDescribeFactInDomainAlphaFuzz', done => {
  getModel().then((theModel) => {
    Describe.describeFactInDomain('Alpha Centauri X', 'Cosmos', theModel).then(res => {
      var cmp = `"Alpha Centauri X" has a meaning in domain "Cosmos":
"Alpha Centauri X" (interpreted as "Alpha Centauri A") is a value for category "object name" present in 1(14.3%) of records;
"Alpha Centauri X" (interpreted as "Alpha Centauri B") is a value for category "object name" present in 1(14.3%) of records;
"Alpha Centauri X" (interpreted as "Alpha Centauri C") ...
is a value for category "object name" present in 1(14.3%) of records;
is a value for category "orbits" present in 1(14.3%) of records;\n`;

      //      cmp = '"Alpha Centauri X" has a meaning in domain "Cosmos":\n"Alpha Centauri X" (interpreted as "Alpha Centauri B") is a value for category "object name" present in 1(14.3%) of records;\n"Alpha Centauri X" (interpreted as "Alpha Centauri A") is a value for category "object name" present in 1(14.3%) of records;\n"Alpha Centauri X" (interpreted as "Alpha Centauri C") ...\nis a value for category "object name" present in 1(14.3%) of records;\nis a value for category "orbits" present in 1(14.3%) of records;\n';

      debuglog(res);
      debuglog(cmp);
      expect(res).toEqual(cmp);
      done();
      Model.releaseModel(theModel);
    });
  });
});


it('testDescribeFactInDomainBluePlanet', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    Describe.describeFactInDomain('blue planet', 'Cosmos', theModel).then(res => {

      var cmp = '"blue planet" has a meaning in domain "Cosmos":\n' +
        '"blue planet" (interpreted as "earth") is a value for category "object name" present in 1(14.3%) of records;\n';
      debuglog(res);
      debuglog(cmp);
      expect(res).toEqual(cmp);
      done();
      Model.releaseModel(theModel);
    });
  });

});



it('testDescribeFactInDomainEarth', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    //TODO , restrict synonyms per domain!
    var p = Describe.describeFactInDomain('earth', undefined, theModel);
    /*  console.log('here is p ' + p);
      console.log(JSON.stringify(p));
      console.log(typeof p.then);*/
    p.then(function (res) {
      var cmp = `"earth" has a meaning in 2 domains: "Cosmos" and "Philosophers elements"
in domain "Cosmos" "earth" is a value for category "object name" present in 1(14.3%) of records;
in domain "Philosophers elements" "earth" is a value for category "element name" present in 1(25.0%) of records;\n`;
      debuglog(res);
      debuglog(cmp);
      expect(res).toEqual(cmp);
      done();
      Model.releaseModel(theModel);
    });
  });

});


it('testDescribeFactInDomainBluePlanetAll', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    //TODO , restrict synonyms per domain!
    Describe.describeFactInDomain('blue planet', undefined, theModel).then(res => {
      var cmp = '"blue planet" has a meaning in one domain "Cosmos":\n"blue planet" (interpreted as "earth") is a value for category "object name" present in 1(14.3%) of records;\n';
      cmp = '"blue planet" has a meaning in one domain "Cosmos":\n"blue planet" (interpreted as "earth") is a value for category "object name" present in 1(14.3%) of records;\n';
      debuglog(res);
      debuglog(cmp);
      expect(res).toEqual(cmp);
      done();
      Model.releaseModel(theModel);
    });
  });
});

it('testDescribeFactInDomainSIUPAC', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    Describe.describeFactInDomain('sun', 'IUPAC', theModel).then(res => {
      var cmp = '"sun" is no known fact in domain "IUPAC".\n';
      debuglog(res);
      debuglog(cmp);
      expect(res).toEqual(cmp);
      done();
      Model.releaseModel(theModel);
    });
  });

});

it('testDescribeDomain', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    Describe.describeDomain('cusmos', 'Cosmos', theModel).then((oRes) => {
      expect(oRes).toEqual(
        //  '"cusmos" (interpreted as "Cosmos")is a domain with 13 categories and 7 records\nDescription:a model with a small subset of cosmological entities. Main purpose is to test \na)properties which occur multiple times (e.g. "Sun" in "object name" as key and in "orbits"; \nb) "earth" as a property which is also present in a different model\n' );

        //  '"cusmos" (interpreted as "Cosmos")is a domain with 13 categories and 7 records\nDescription:a model with a small subset of cosmological entities. Main purpose is to test \na)properties which occur multiple times (e.g. "Sun" in "object name" as key and in "orbits"; \nb) "earth" as a property which is also present in a different model\n'
        //"cusmos" (interpreted as "Cosmos")is a domain with 13 categories and 7 records\nDescription:a model with a small subset of cosmological entities. Main purpose is to test \na)properties which occur multiple times (e.g. "Sun" in "object name" as key and in "orbits"; \nb) "earth" as a property which is also present in a different model\n');
        '"cusmos" (interpreted as "Cosmos")is a domain with 13 categories and 7 records\nDescription:a model with a small subset of cosmological entities. Main purpose is to test \na)properties which occur multiple times (e.g. "Sun" in "object name" as key and in "orbits"; \nb) "earth" as a property which is also present in a different model\n'
      );
      done();
      Model.releaseModel(theModel);
    });
  });
});

it('testDescribeFactWhichIsADomain', done => {
  getModel().then((theModel) => {
    Describe.describeFactInDomain('cusmos', undefined, theModel).then(oRes => {
      expect(oRes).toEqual(
        //  '"cusmos" (interpreted as "Cosmos")is a domain with 13 categories and 7 records\nDescription:a model with a small subset of cosmological entities. Main purpose is to test \na)properties which occur multiple times (e.g. "Sun" in "object name" as key and in "orbits"; \nb) "earth" as a property which is also present in a different model\n' );
        //    '"cusmos" (interpreted as "Cosmos")is a domain with 13 categories and 7 records\nDescription:a model with a small subset of cosmological entities. Main purpose is to test \na)properties which occur multiple times (e.g. "Sun" in "object name" as key and in "orbits"; \nb) "earth" as a property which is also present in a different model\n"cusmos" has a meaning in one domain "metamodel":\n"cusmos" (interpreted as "Cosmos") is a value for category "domain" present in 13(14.8%) of records;\n'
        '"cusmos" (interpreted as "Cosmos")is a domain with 13 categories and 7 records\nDescription:a model with a small subset of cosmological entities. Main purpose is to test \na)properties which occur multiple times (e.g. "Sun" in "object name" as key and in "orbits"; \nb) "earth" as a property which is also present in a different model\n"cusmos" has a meaning in one domain "metamodel":\n"cusmos" (interpreted as "Cosmos") is a value for category "domain" present in 13(15.3%) of records;\n'
      );
      done();
      Model.releaseModel(theModel);
    });
  });

});


it('testDescribeFactInDomainMultiDomain', done => {
  getModel().then((theModel) => {
    Describe.describeFactInDomain('earth', 'Philosophers elements', theModel).then(oRes => {
      expect(oRes).toEqual(
        '"earth" has a meaning in domain "Philosophers elements":\n"earth" is a value for category "element name" present in 1(25.0%) of records;\n'
      );
      done();
      Model.releaseModel(theModel);
    });
  });

});
it('testDescribeFactInDomainMultiDomainNoFilter', done => {
  getModel().then((theModel) => {
    Describe.describeFactInDomain('earth', undefined, theModel).then(oRes => {
      expect(oRes).toEqual(
        '"earth" has a meaning in 2 domains: "Cosmos" and "Philosophers elements"\nin domain "Cosmos" "earth" is a value for category "object name" present in 1(14.3%) of records;\nin domain "Philosophers elements" "earth" is a value for category "element name" present in 1(25.0%) of records;\n'
      );
      done();
      Model.releaseModel(theModel);
    });
  });

});


it('testDescribeCategoryStatsInDomain', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    Describe.getCategoryStatsInDomain('element name', 'IUPAC', theModel).then((oRes) => {
      delete oRes.categoryDesc._id;
      expect(oRes).toEqual({
        categoryDesc:
        {
          wordindex: true,
          category_description: 'element name',
          category: 'element name',
          QBEColumnProps: { LUNRIndex: true, QBE: true, defaultWidth: 120 },
          category_synonyms: ['name'],
          'type' : 'String'
        },
        distinct: '118',
        delta: '',
        presentRecords: 118,
        percPresent: '100.0',
        sampleValues: 'Possible values are ...\n"actinium", "aluminium", "americium", "antimony", "argon", "arsenic", "astatine" ...'
      });
      done();
      Model.releaseModel(theModel);
    });
  });

});


it('testMakeValuesListOne', done => {
  var res = Describe.makeValuesListString(['abc']);
  expect(res).toEqual('The sole value is "abc"');
  done();
});



it('testMakeValuesListEarth', done => {
  var res = Describe.makeValuesListString(['earth', 'fire', 'water', 'wind']);
  expect(res).toEqual('Possible values are ...\n"earth", "fire", "water" or "wind"');
  done();
});


it('testMakeValuesListFits', done => {
  var res = Describe.makeValuesListString(['abc', 'def', 'hif', 'klm']);
  expect(res).toEqual('Possible values are ...\n"abc", "def", "hif" or "klm"');
  done();
});

it('testMakeValuesListNoFit', done => {
  var res = Describe.makeValuesListString(['abc', 'def', 'hiasfasfasfsaf', 'klasfasfasfsafasfm', 'hijsasfasfasfasfdfsf', 'desafsfasff', 'kasdfasfsafsafdlm']);
  expect(res).toEqual(
    'Possible values are ...\n"abc", "def", "hiasfasfasfsaf", "klasfasfasfsafasfm", "hijsasfasfasfasfdfsf" ...'
  );
  done();
});



it('testMakeValuesListLong', done => {
  var val1 = 'abcs';
  var val2 = 'abcsadlfaj askdf skfjKKKKK aksdlfj saldkf jaslkfdjas lfjsad flskjaf lsdfkjs alfjks df';
  var val3 = 'abcsadlfaj askdf skfjKKKKK aksdlfj saldkf jaslkfdjas lfjsad flskjaf lsdfkjs alfjks df';
  var res = Describe.makeValuesListString([val1, val2, val3, 'SAFSDFSDF']);
  expect(res).toEqual('Possible values are ...\n(1): "' + val1 +
    '"\n(2): "' + val2 + '"\n(3): "' + val3 + '"\n...');
  done();
});


it('testMakeValuesListLong3', done => {
  // no ...
  var val1 = 'abcs';
  var val2 = 'abcsadlfaj askdf skfjKKKKK aksdlfj saldkf jaslkfdjas lfjsad flskjaf lsdfkjs alfjks df';
  var val3 = 'abcsadlfaj askdf skfjKKKKK aksdlfj saldkf jaslkfdjas lfjsad flskjaf lsdfkjs alfjks df';
  var res = Describe.makeValuesListString([val1, val2, val3]);
  expect(res).toEqual('Possible values are ...\n(1): "' + val1 +
    '"\n(2): "' + val2 + '"\n(3): "' + val3 + '"\n');
  done();
});

var ELEMENT_NAME_IUPAC =
  'is a category in domain "IUPAC"\nIt is present in 118 (100.0%) of records in this domain,\n'
  + 'having 118 distinct values.\n'
  + 'Possible values are ...\n"actinium", "aluminium", "americium", "antimony", "argon", "arsenic", "astatine" ...';

ELEMENT_NAME_IUPAC = 'is a category in domain "IUPAC"\nIt is present in 118 (100.0%) of records in this domain,\n'
  + 'having 118 distinct values.\n'
  + 'Possible values are ...\n"actinium", "aluminium", "americium", "antimony", "argon", "arsenic", "astatine" ...\nDescription: element name';


it('testDescribeCategoryWithDomain', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    Describe.describeCategory('element name', 'IUPAC', theModel, 'describe element name in domain IUPAC').then(
      res => {
        debuglog(res);
        var cmp = ELEMENT_NAME_IUPAC;
        debuglog(cmp);
        expect(res).toEqual(
          ['is a category in domain "IUPAC"\nIt is present in 118 (100.0%) of records in this domain,\nhaving 118 distinct values.\nPossible values are ...\n"actinium", "aluminium", "americium", "antimony", "argon", "arsenic", "astatine" ...\nDescription: element name']
        );
        done();
        Model.releaseModel(theModel);
      });
  });
});


it('testDescribeCategoryWithInvalid', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    var res = Describe.describeCategory('element name', 'IUPOCCCCCAC', theModel, 'describe element name in domain IUPAC');
    res.then((res) => {
      debuglog(res);
      var cmp = ELEMENT_NAME_IUPAC;
      debuglog(cmp);
      expect(res).toEqual([]);
      done();
      Model.releaseModel(theModel);
    });
  });
});

it('testDescribeInDomain', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    Describe.describeCategoryInDomain('element name', 'IUPAC', theModel).then((res) => {
      debuglog(res);
      var cmp = ELEMENT_NAME_IUPAC;
      debuglog(cmp);
      expect(res).toEqual(cmp);
      done();
      Model.releaseModel(theModel);
    });
  });
});


it('testDescribeCategoryInhomogeneous', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    Describe.describeCategory('orbits', undefined, theModel, 'abc').then((res) => {

      var cmp = 'is a category in domain "Cosmos"\nIt is present in 3 (42.9%) of records in this domain,\nhaving 2(+2) distinct values.\nPossible values are ...\n"Alpha Centauri C" or "Sun"\nDescription: for planets, name of the central entity';
      //
      //var cmp = 'is a category in domain "Cosmos"\nIt is present in 3 (42.9%) of records in this domain,\nhaving 2(+2) distinct values.\nPossible values are ...\n"Alpha Centauri C" or "Sun"\nDescription:';
      debuglog(res);
      debuglog([cmp]);
      expect(res).toEqual([cmp]);
      done();
      Model.releaseModel(theModel);
    });
  });
});


it('testDescribeCategoryEcc', done => {
  expect.assertions(1);
  getModel().then((theModel) => {
    Describe.describeCategory('eccentricity', undefined, theModel, 'abc').then((res) => {
      var cmp = 'is a category in domain "Cosmos"\nIt is present in 2 (28.6%) of records in this domain,\nhaving 2(+1) distinct values.\n'
        + 'Possible values are ...\n"0.0167" or "0.0934"';
      debuglog(res);
      debuglog([cmp]);
      expect(res).toEqual([cmp]);
      done();
      Model.releaseModel(theModel);
    });
  });
});


it('testDescribeCategoryMult', done => {
  expect.assertions(2);
  getModel().then((theModel) => {
    Describe.describeCategory('element name', undefined, theModel, 'abc').then((res) => {
      var cmp1 =
        'is a category in domain "Philosophers elements"\nIt is present in 4 (100.0%) of records in this domain,\nhaving 4 distinct values.\nPossible values are ...\n"earth", "fire", "water" or "wind"\nDescription: name of the philosophical element';

      //  'is a category in domain "Philosophers elements"\nIt is present in 4 (100.0%) of records in this domain,\nhaving 4 distinct values.\nPossible values are ...\n"earth", "fire", "water" or "wind"';
      var cmp2 = ELEMENT_NAME_IUPAC;
      debuglog(res[0]);
      debuglog(res[0]);

      expect(res[0]).toEqual(cmp2);
      expect(res[1]).toEqual(cmp1);
      done();
      Model.releaseModel(theModel);
    });
  });
});
