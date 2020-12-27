var root = '../js';
var mt = require(root + '/makeToken.js');

describe('testMakeToken', () => {
  it('testMakeMongoDomain2', async () => {
    mt.run();
    expect(!!mt.run).toEqual(true);
  });
});

