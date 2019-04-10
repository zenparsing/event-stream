import assert from 'assert';
import { testMethodProperty } from './properties.js';

describe('of', () => {
  it('is a method on EventStream', () => {
    testMethodProperty(EventStream, 'of', {
      configurable: true,
      writable: true,
      length: 0,
    });
  });

  it('uses the this value if it is a function', () => {
    let usesThis = false;
    EventStream.of.call(function() { usesThis = true; });
    assert.ok(usesThis);
  });

  it('uses EventStream if the this value is not a function', () => {
    let result = EventStream.of.call({}, 1, 2, 3, 4);
    assert.ok(result instanceof EventStream);
  });

  it('delivers arguments to next in a job', async () => {
    let values = [];
    let turns = 0;
    EventStream.of(1, 2, 3, 4).listen(v => values.push(v));
    assert.equal(values.length, 0);
    await null;
    assert.deepEqual(values, [1, 2, 3, 4]);
  });
});
