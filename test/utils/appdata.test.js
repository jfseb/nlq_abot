/*! copyright gerd forstmann, all rights reserved */
var debug = require('debug')('appdata.nunit');
var root = '../../js';


var AppData = require(root + '/utils/appdata.js');


/**
 * Unit test for sth
 */
it('testPersistence', done => {
  expect.assertions(2);
  var u;
  u = new AppData.PersistenceHandle('_Test3', 'File1');
  u.save({
    a: 1
  }, function (err) {
    if (err) {
      debug('got an error' + err);
      throw err;
    }
    var k = new AppData.PersistenceHandle('_Test3', 'File1');
    k.load(function (err, sData) {
      expect(err).toEqual(undefined);
      expect(sData).toEqual({ a: 1 });
      done();
    });
  });
});

var fs = require('fs');
//const { expandTokenMatchesToSentences } = require('mgnlq_parser1/js/match/erbase');

function rmDir(dirPath) {
  try {
    var files = fs.readdirSync(dirPath);
  } catch (e) { return; }
  if (files.length > 0) {
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      } else {
        rmDir(filePath);
      }
    }
  }
  fs.rmdirSync(dirPath);
}

it('testPersistenceNoDirOnSave', done => {
  expect.assertions(2);
  var dirf = AppData._test.getFileAndDir('_Test4a', 'File1');
  try {
    rmDir(dirf.dir);
  } catch (e) {
    /* empty */
    // emtpy
    // debug("could not remove file");
  }

  var u = new AppData.PersistenceHandle('_Test4a', 'File1');
  u.save({
    a: 1
  }, function (err) {
    if (err) {
      debug('error on save bad' + err);
      expect(true).toBeTruthy();
      done();
    }
    var k = new AppData.PersistenceHandle('_Test4a', 'File1');
    k.load(function (err, sData) {
      expect(err).toEqual(undefined);
      expect(sData).toEqual({ a: 1 });
      done();
    });
  });
});

/*eslint no-unused-vars: ["error", { "caughtErrors": "none" }]*/

it('testPersistenceNoDirOnRead', done => {
  expect.assertions(1);
  var dirf = AppData._test.getFileAndDir('_Test4b', 'File1');
  try {
    rmDir(dirf.dir);
  } catch (e) {
    /*empty */
  }
  debug('got past file removal');
  var u = new AppData.PersistenceHandle('_Test4b', 'File1');
  /*eslint-disable no-unused-vars*/
  u.load(function (err, sData) {
    if (err) {
      debug('got an error' + err);
      expect(true).toBeTruthy();
      //test.ok(true, 'loading impossible');
      done();
      return;
    }
    expect(false).toBeTruthy();
    expect(false).toBeTruthy();
    expect(sData).toBeTruthy();
    done();
  });
});

it('testPersistenceNoJSON', done => {
  expect.assertions(1);
  var dirf = AppData._test.getFileAndDir('_Test3x', 'FileA.json');
  try {
    if (!fs.existsSync(dirf.dir)) {
      fs.mkdirSync(dirf.dir);
    }
  } catch (e) {
    // ok, hope not present
  }
  fs.writeFile(dirf.fileName, 'ABC',
    {
      flag: 'w',
      encoding: 'utf8'
    },
    function (err) {
      if (err) {
        // console.log('cannot open file for writing!')
        expect(false).toBeTruthy(); //  test.ok(false, 'error preparing test');
        done();
        return;
      }
      // console.log('wrote file!')
      var u = new AppData.PersistenceHandle('_Test3x', 'FileA.json');
      u.load(function (err, sData) {
        if (err) {
          expect(true).toBeTruthy(); 
          //test.ok(true, 'cannot load');
          done();
          return;
        }
        expect(false).toBeTruthy();
        expect(err).toEqual(undefined);
        expect(sData).toEqual({});
        done();
      });
    });
});

/**
 * Unit test for sth
 */
it('testPersistenceNoDir', async done => {
  expect.assertions(3);
  // prepare
  var u = new AppData.PersistenceHandle('_Test4', 'File1');
  // console.log('got handle')
  // creates dir, must be first!
  var dirf = AppData._test.getFileAndDir('_Test4', 'File1');
  try {
    rmDir(dirf.dir);
  } catch (e) {
    debug(' trouble removing ' + dirf.dir + ' ' + e.message);
  }
  // console.log('removed')
  // act
  u.save({
    a: 444
  }, function (err) {
    // console.log('saved')
    if (err) {
      expect(1).toEqual(0);
      //test.ok(false, ' no error');
      debug('got an error' + err);
      done();
      throw err;
    }
    var k = new AppData.PersistenceHandle('_Test4', 'File1');
    k.load(function (err, sData) {
      expect(1).toEqual(1);
      // test.ok(true, 'could save and read');
      expect(err).toEqual(undefined);
      expect(sData).toEqual({ a: 444 });
      done();
    });
  });
});

/**
 * Unit test for sth
 */
/*
exports.testPersistenceFileLocked = function (test) {
  test.expect(2)
  var dirf = AppData._test.getFileAndDir('_Test5', 'File1')
  try {
    rmDir(dirf.dir)
  } catch (e) {}
  var u = new AppData.PersistenceHandle('_Test5', 'File1')
  u.save({
    a: 333
  }, function (err) {
    if (err) {
      debug('got an error' + err)
      test.ok(false, ' no save')
      test.done()
      throw err
    }
    var fd = fs.openSync(dirf.fileName, 'r')
    var k = new AppData.PersistenceHandle('_Test5', 'File1')
    k.load(function (err, sData) {
      test.equal(err, undefined, 'no error')
      test.deepEqual(sData, {}, 'correct data read')
      fs.close(fd, function (err) {
        debug('got an error closing fd' + err)
      })
      test.done()
    })
  })
}
*/
