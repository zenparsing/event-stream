import assert from 'assert';
import { testMethodProperty } from './properties.js';

describe('constructor', () => {
  it('throws if called as a function', () => {
    assert.throws(() => EventStream(() => {}));
    assert.throws(() => EventStream.call({}, () => {}));
  });

  it('throws if the argument is not callable', () => {
    assert.throws(() => new EventStream({}));
    assert.throws(() => new EventStream());
    assert.throws(() => new EventStream(1));
    assert.throws(() => new EventStream('string'));
  });

  it('accepts a function argument', () => {
    let result = new EventStream(() => {});
    assert.ok(result instanceof EventStream);
  });

  it('is the value of EventStream.prototype.constructor', () => {
    testMethodProperty(EventStream.prototype, 'constructor', {
      configurable: true,
      writable: true,
      length: 1,
    });
  });

  it('does not call the subscriber function', () => {
    let called = 0;
    new EventStream(() => { called++ });
    assert.equal(called, 0);
  });

});
