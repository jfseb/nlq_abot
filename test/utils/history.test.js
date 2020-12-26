var root = '../../js';


var History = require(root + '/utils/history.js');

it('testCtor', done => {
  // test.expect(3)
  var u = new History({
    length: 10, pos: 10
  });
  expect(typeof u).toEqual('object');
  done();
});

it('testHistory0', done => {
  // test.expect(3)
  var u;
  u = new History({
    length: 3,
    default: 'defaultfwd'
  });
  expect(u.get()).toEqual('defaultfwd');
  u.backward();
  expect(u.get()).toEqual('defaultfwd');
  u.forward();
  expect(u.get()).toEqual('defaultfwd');
  done();
});

it('testHistory1', done => {
  // test.expect(3)
  var u;
  u = new History({
    length: 3,
    default: 'defaultfwd'
  });
  u.push('entry 1');
  expect(u.get()).toEqual('defaultfwd');
  u.push('entry 2');
  expect(u.get()).toEqual('defaultfwd');
  u.push('entry 3');
  expect(u.get()).toEqual('defaultfwd');
  expect(u._pos).toEqual(3);
  expect(u.backward()).toEqual('entry 3');
  expect(u._pos).toEqual(2);
  expect(u.get()).toEqual('entry 3');
  u.backward();
  expect(u.get()).toEqual('entry 2');
  u.forward();
  expect(u.get()).toEqual('entry 3');
  u.forward();
  expect(u.get()).toEqual('entry 3');
  u.forward();
  expect(u.get()).toEqual('entry 3');
  u.backward();
  expect(u.get()).toEqual('entry 2');

  done();
});

it('testBackHitBorder', done => {
  // test.expect(3)
  var u;
  u = new History({
    length: 3,
    default: 'defaultfwd'
  });
  u.push('e 1');
  u.push('e 2');
  u.push('e 3');
  u.push('e 4');
  expect(u.backward()).toEqual('e 4');
  expect(u.backward()).toEqual('e 3');
  expect(u.backward()).toEqual('e 2');
  expect(u.backward()).toEqual('e 2');
  expect(u.backward()).toEqual('e 2');
  expect(u.backward()).toEqual('e 2');
  expect(u.backward()).toEqual('e 2');
  expect(u.forward()).toEqual('e 3');
  done();
});

it('testPushUndefined', done => {
  expect.assertions(11);
  var u;
  u = new History({
    length: 3,
    default: 'defaultfwd'
  });
  u.push('e 1');
  try {
    u.push(null);
    expect(false).toBeTruthy();
  } catch (e) {
    expect(true).toBeTruthy();
  }
  u.push('e 2');
  try {
    u.push(undefined);
    expect(false).toBeTruthy();
  } catch (e) {
    expect(true).toBeTruthy();
  }
  u.push('e 3');
  u.push('e 4');
  expect(u.backward()).toEqual('e 4');
  expect(u.backward()).toEqual('e 3');
  expect(u.backward()).toEqual('e 2');
  expect(u.backward()).toEqual('e 2');
  expect(u.backward()).toEqual('e 2');
  expect(u.backward()).toEqual('e 2');
  expect(u.backward()).toEqual('e 2');
  expect(u.forward()).toEqual('e 3');
  expect(true).toBeTruthy();
  done();
});

it('testPushSameBackHitBorder', done => {
  // test.expect(3)
  var u;
  u = new History({
    length: 10,
    default: 'defaultfwd'
  });
  u.push('e 1');
  u.push('e 2');
  u.push('e 3');
  u.push('e 1');
  u.push('e 2');
  expect(u.backward()).toEqual('e 2');
  expect(u.backward()).toEqual('e 1');
  expect(u.backward()).toEqual('e 3');
  expect(u.backward()).toEqual('e 2');
  expect(u.get()).toEqual('e 2');
  u.push('e 2');
  expect(u.backward()).toEqual('e 2');
  expect(u.backward()).toEqual('e 1');
  expect(u.backward()).toEqual('e 1');
  expect(u.forward()).toEqual('e 2');
  done();
});

it('testPushdefaultempty', done => {
  // test.expect(3)
  var u;
  u = new History({
    length: 10,
    default: 'defaultfwd'
  });
  u.push('defaultfwd');
  u.push('e 2');
  u.push('e 2');
  expect(u.backward()).toEqual('defaultfwd');
  expect(u.backward()).toEqual('defaultfwd');
  expect(u.backward()).toEqual('defaultfwd');
  done();
});

it('testPushNonSameBackHitBorder', done => {
  // test.expect(3)
  var u;
  u = new History({
    length: 10,
    default: 'defaultfwd'
  });
  u.push('e 1');
  u.push('e 2');
  u.push('e 3');
  u.push('e 1');
  u.push('e 2');
  expect(u.backward()).toEqual('e 2');
  expect(u.backward()).toEqual('e 1');
  expect(u.backward()).toEqual('e 3');
  expect(u.get()).toEqual('e 3');
  u.push('e 3');
  expect(u.backward()).toEqual('e 3');
  expect(u.backward()).toEqual('e 2');
  expect(u.backward()).toEqual('e 1');
  expect(u.backward()).toEqual('e 1');
  expect(u.forward()).toEqual('e 2');
  done();
});

it('testRetpushOld', done => {
  // test.expect(3)
  var u;
  u = new History({
    length: 6,
    default: 'defaultfwd'
  });
  u.push('entry 1');
  u.push('entry 2');
  u.push('entry 3');
  u.push('entry 4');
  expect(u.backward()).toEqual('entry 4');
  expect(u.backward()).toEqual('entry 3');
  expect(u.backward()).toEqual('entry 2');
  u.push('entry 2');
  expect(u._pos).toEqual(1);
  expect(u._state).toEqual('pushed');
  expect(u.backward()).toEqual('entry 2');
  expect(u._pos).toEqual(1);
  expect(u.backward()).toEqual('entry 1');
  expect(u._pos).toEqual(0);
  expect(u.forward()).toEqual('entry 2');
  expect(u.forward()).toEqual('entry 3');
  expect(u.forward()).toEqual('entry 4');
  expect(u._pos).toEqual(3);
  expect(u.forward()).toEqual('entry 2');
  expect(u._pos).toEqual(4);
  expect(u.forward()).toEqual('entry 2');
  done();
});

it('testRetpushOld2', done => {
  // test.expect(3)
  var u;
  u = new History({
    length: 6,
    default: 'defaultfwd'
  });
  u.push('entry 1');
  u.push('exntry 2');
  u.push('entry 3');
  u.push('entry 4');
  expect(u.backward()).toEqual('entry 4');
  expect(u.backward()).toEqual('entry 3');
  expect(u.backward()).toEqual('exntry 2');
  u.push('exntry 2');
  expect(u._pos).toEqual(1);
  expect(u._state).toEqual('pushed');
  expect(u.forward()).toEqual('entry 3');
  expect(u._state).toEqual('history');
  expect(u._pos).toEqual(2);
  expect(u.forward()).toEqual('entry 4');
  expect(u._pos).toEqual(3);
  expect(u.forward()).toEqual('exntry 2');
  expect(u._pos).toEqual(4);
  expect(u.forward()).toEqual('exntry 2');
  done();
});

it('testHistoryPersistenceWrite', done => {
  // test.expect(3)
  var u;
  var oLastSave;
  function fnSave(oData) {
    oLastSave = oData;
  }
  u = new History({
    length: 6,
    default: 'defaultfwd',
    save: fnSave
  });
  u.push('entry 1');
  u.push('exntry 2');
  u.push('entry 3');

  expect(oLastSave).toEqual({
    pos: 3,
    entries: ['entry 1', 'exntry 2', 'entry 3']
  });
  u.push('entry 4');
  expect(u.backward()).toEqual('entry 4');
  expect(oLastSave).toEqual({
    pos: 4,
    entries: ['entry 1', 'exntry 2', 'entry 3', 'entry 4']
  });

  done();
});

it('testHistoryPersistenceLoadEmpty', done => {
  // test.expect(3)
  var u;
  var fnCB;
  function fnLoad(cb) {
    fnCB = cb;
  }
  u = new History({
    length: 5,
    default: 'defaultfwd',
    load: fnLoad
  });
  fnCB(undefined, {
    pos: 2,
    entries: ['hentry1', 'hentry2', 'hentry3']
  });
  u.push('entry 1');
  expect(u.backward()).toEqual('hentry3');
  expect(u.backward()).toEqual('hentry2');
  expect(u.backward()).toEqual('hentry1');
  done();
});

it('testHistoryPersistenceLoadEmptyPos2', done => {
  // test.expect(3)
  var u;
  var fnCB;
  function fnLoad(cb) {
    fnCB = cb;
  }
  u = new History({
    length: 5,
    default: 'defaultfwd',
    load: fnLoad
  });
  fnCB(undefined, {
    pos: 3,
    entries: ['hentry1', 'hentry2', 'hentry3']
  });
  u.push('entry 1');
  expect(u.backward()).toEqual('entry 1');
  expect(u.backward()).toEqual('hentry3');
  expect(u.backward()).toEqual('hentry2');
  expect(u.backward()).toEqual('hentry1');
  done();
});

it('testHistoryPersistenceLoadLate', done => {
  // test.expect(3)
  var u;
  var fnCB;
  function fnLoad(cb) {
    fnCB = cb;
  }
  u = new History({
    length: 5,
    default: 'defaultfwd',
    load: fnLoad
  });
  u.push('entry 1');
  fnCB(undefined, {
    pos: 3,
    entries: ['hentry1', 'hentry2', 'hentry3']
  });
  u.push('exntry 2');
  u.push('entry 3');
  expect(u.backward()).toEqual('entry 3');
  expect(u.backward()).toEqual('exntry 2');
  expect(u.backward()).toEqual('entry 1');
  expect(u.backward()).toEqual('hentry3');
  expect(u.backward()).toEqual('hentry2');
  expect(u.backward()).toEqual('hentry2');
  done();
});
