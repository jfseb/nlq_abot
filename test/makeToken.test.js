var root = '../js';
var mt = require(root + '/makeToken.js');

describe('testMakeToken', () => {
  it('testMakeToken', async () => {
    mt.run();
    expect(!!mt.run).toEqual(true);
  });
});

