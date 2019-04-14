import assert from 'assert';
import { testMethodProperty } from './properties.js';

function capture(fn) {
  return (next, error, complete) => { fn({ next, error, complete }) };
}

describe('listen', () => {

  it('is a method of EventStream.prototype', () => {
    testMethodProperty(EventStream.prototype, 'listen', {
      configurable: true,
      writable: true,
      length: 3,
    });
  });

  it('accepts a next function argument', () => {
    let subscription;
    let nextValue;
    new EventStream(capture(x => subscription = x)).listen(
      v => nextValue = v
    );
    subscription.next(1);
    assert.equal(nextValue, 1);
  });

  it('accepts an error function argument', () => {
    let subscription;
    let errorValue;
    let error = {};
    new EventStream(capture(x => subscription = x)).listen(
      null,
      e => errorValue = e
    );
    subscription.error(error);
    assert.equal(errorValue, error);
  });

  it('accepts a complete function argument', () => {
    let subscription;
    let completed = false;
    new EventStream(capture(x => subscription = x)).listen(
      null,
      null,
      () => completed = true
    );
    subscription.complete();
    assert.equal(completed, true);
  });

  it('throws if initializer throws', async () => {
    assert.throws(() => {
      new EventStream(() => { throw {} }).listen();
    });
  });

  it('accepts a cleanup function from the initializer function', () => {
    let cleanupCalled = false;
    let cancel = new EventStream(() => {
      return () => cleanupCalled = true;
    }).listen();
    cancel();
    assert.equal(cleanupCalled, true);
  });

});
