import assert from 'assert';
import { testMethodProperty } from './properties.js';

describe('callback-complete', () => {

  function getObserver(...args) {
    let observer = {};

    observer.cancel = new EventStream((next, error, complete) => {
      observer.next = next;
      observer.error = error;
      observer.complete = complete;
    }).listen(...args);

    return observer;
  }

  it('forwards arguments', () => {
    let args;
    let observer = getObserver(null, null, (...a) => { args = a });
    observer.complete(1);
    assert.deepEqual(args, [1]);
  });

  it('allows return values', () => {
    let observer = getObserver(null, null, () => 1);
    assert.equal(observer.complete(), 1);
  });

  it('does not forward when the subscription is complete', () => {
    let count = 0;
    let observer = getObserver(null, null, () => count++);
    observer.complete();
    observer.complete();
    assert.equal(count, 1);
  });

  it('does not forward when the subscription is cancelled', () => {
    let count = 0;
    let observer = getObserver(null, null, () => count++);
    observer.cancel();
    observer.complete();
    assert.equal(count, 0);
  });

  it('throws if the subscription is not initialized', async () => {
    assert.throws(() => {
      new EventStream((next, error, complete) => {
        complete();
      }).observe();
    });
  });

  it('sends if the observer is running', async () => {
    let observer;
    let completed = false;
    new EventStream((next, error, complete) => {
      observer = { next, error, complete };
    }).listen(
      () => observer.complete(),
      null,
      () => completed = true
    );
    observer.next();
    assert.equal(completed, true);
  });

  it('closes the subscription before invoking inner observer', () => {
    let hasValue = false;
    let observer = getObserver(
      () => { hasValue = true },
      null,
      () => { observer.next() },
    );
    observer.complete();
    assert.equal(hasValue, false);
  });

  it('throws error if "complete" is not a method', () => {
    let observer = getObserver(null, null, 1);
    assert.throws(() => observer.complete());
  });

  it('does not throw an error if "complete" is undefined', () => {
    let observer = getObserver(null, null, undefined);
    observer.complete();
    assert.doesNotThrow(() => observer.complete());
  });

  it('does not throw an error if "complete" is null', () => {
    let observer = getObserver(null, null, null);
    assert.doesNotThrow(() => observer.complete());
  });

  it('throws an error if "complete" throws', () => {
    let error = {};
    let observer = getObserver(null, null, () => { throw error });
    assert.throws(() => observer.complete());
  });

  it('calls the cleanup method after "complete"', () => {
    let calls = [];
    let observer;
    new EventStream((next, error, complete) => {
      observer = { next, error, complete };
      return () => { calls.push('cleanup') };
    }).listen(null, null, () => { calls.push('complete') });
    observer.complete();
    assert.deepEqual(calls, ['complete', 'cleanup']);
  });

  it('calls the cleanup method if there is no "complete"', () => {
    let calls = [];
    let observer;
    new EventStream((next, error, complete) => {
      observer = { next, error, complete };
      return () => { calls.push('cleanup') };
    }).listen();
    observer.complete();
    assert.deepEqual(calls, ['cleanup']);
  });

  it('throws an error if the cleanup function throws', () => {
    let error = {};
    let observer;
    new EventStream((next, error, complete) => {
      observer = { next, error, complete };
      return () => { throw error };
    }).listen();
    assert.throws(() => observer.complete());
  });
});
