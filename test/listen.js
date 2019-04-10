import assert from 'assert';
import { testMethodProperty } from './properties.js';

function captureObserver(fn) {
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
    let observer;
    let nextValue;
    new EventStream(captureObserver(x => observer = x)).listen(
      v => nextValue = v
    );
    observer.next(1);
    assert.equal(nextValue, 1);
  });

  it('accepts an error function argument', () => {
    let observer;
    let errorValue;
    let error = {};
    new EventStream(captureObserver(x => observer = x)).listen(
      null,
      e => errorValue = e
    );
    observer.error(error);
    assert.equal(errorValue, error);
  });

  it('accepts a complete function argument', () => {
    let observer;
    let completed = false;
    new EventStream(captureObserver(x => observer = x)).listen(
      null,
      null,
      () => completed = true
    );
    observer.complete();
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
