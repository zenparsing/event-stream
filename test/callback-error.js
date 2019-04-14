import assert from 'assert';
import { testMethodProperty } from './properties.js';

describe('callback-error', () => {

  function getObserver(...args) {
    let observer = {};

    observer.cancel = new EventStream((next, error, complete) => {
      observer.next = next;
      observer.error = error;
      observer.complete = complete;
      return () => observer.cleanupCalled = true;
    }).listen(...args);

    return observer;
  }

  it('forwards the argument', () => {
    let args;
    let observer = getObserver(null, (...a) => { args = a });
    observer.error(1);
    assert.deepEqual(args, [1]);
  });

  it('returns a value', () => {
    let observer = getObserver(null, () => 1);
    assert.equal(observer.error(), 1);
  });

  it('callback is not called when the subscription is complete', () => {
    let called = false;
    let observer = getObserver(null, () => called = true);
    observer.complete();
    observer.error();
    assert.equal(called, false);
  });

  it('callback is not called when the subscription is cancelled', () => {
    let called = false;
    let observer = getObserver(null, () => called = true);
    observer.cancel();
    observer.error();
    assert.equal(called, false);
  });

  it('throws when there is no handler', () => {
    let observer = getObserver();
    assert.throws(() => observer.error());
  });

  it('does not throw when there is no handler and subscription is done', () => {
    let observer = getObserver();
    observer.complete();
    observer.error();
  });

  it('does not throw when there is no handler and subscription is cancelled', () => {
    let observer = getObserver();
    observer.cancel();
    observer.error();
  });

  it('closes the subscription before invoking callback', () => {
    let observer = getObserver(null, () => {});
    observer.error();
    assert.equal(observer.cleanupCalled, true);
  });

  it('throws if callback is not callable', () => {
    assert.throws(() => getObserver(null, 1).error());
    assert.throws(() => getObserver(null, {}).error());
    assert.throws(() => getObserver(null, undefined).error());
    assert.throws(() => getObserver(null, null).error());
  });

  it('throws if "error" throws', () => {
    let error = {};
    let observer = getObserver(null, () => { throw error });
    assert.throws(() => observer.error());
  });

  it('calls the cleanup method after "error"', () => {
    let calls = [];
    let observer = {};
    new EventStream((next, error) => {
      observer.error = error;
      return () => { calls.push('cleanup') };
    }).listen(null, () => calls.push('error'));
    observer.error();
    assert.deepEqual(calls, ['error', 'cleanup']);
  });

  it('calls the cleanup method if there is no callback', () => {
    let calls = [];
    let observer = {};
    new EventStream((next, error) => {
      observer.error = error;
      return () => { calls.push('cleanup') };
    }).listen();
    try {
      observer.error();
    } catch (err) {}
    assert.deepEqual(calls, ['cleanup']);
  });

  it('throws if the cleanup function throws', () => {
    let error = {};
    let observer = error;
    new EventStream((next, error) => {
      observer.error = error;
      return () => { throw error };
    }).listen();
    assert.throws(() => observer.error());
  });

});
