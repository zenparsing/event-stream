import assert from 'assert';
import { testMethodProperty } from './properties.js';

describe('callback-error', () => {

  it('forwards the argument', () => {
    let args;
    let subscription = getSubscription(null, (...a) => { args = a });
    subscription.error(1);
    assert.deepEqual(args, [1]);
  });

  it('returns a value', () => {
    let subscription = getSubscription(null, () => 1);
    assert.equal(subscription.error(), 1);
  });

  it('callback is not called when the subscription is complete', () => {
    let called = false;
    let subscription = getSubscription(null, () => called = true);
    subscription.complete();
    subscription.error();
    assert.equal(called, false);
  });

  it('callback is not called when the subscription is cancelled', () => {
    let called = false;
    let subscription = getSubscription(null, () => called = true);
    subscription.cancel();
    subscription.error();
    assert.equal(called, false);
  });

  it('throws when there is no handler', () => {
    let subscription = getSubscription();
    assert.throws(() => subscription.error());
  });

  it('does not throw when there is no handler and subscription is done', () => {
    let subscription = getSubscription();
    subscription.complete();
    subscription.error();
  });

  it('does not throw when there is no handler and subscription is cancelled', () => {
    let subscription = getSubscription();
    subscription.cancel();
    subscription.error();
  });

  it('closes the subscription before invoking callback', () => {
    let subscription = getSubscription(null, () => {});
    subscription.error();
    assert.equal(subscription.cleanupCalled, true);
  });

  it('throws if callback is not callable', () => {
    assert.throws(() => getSubscription(null, 1).error());
    assert.throws(() => getSubscription(null, {}).error());
    assert.throws(() => getSubscription(null, undefined).error());
    assert.throws(() => getSubscription(null, null).error());
  });

  it('throws if "error" throws', () => {
    let error = {};
    let subscription = getSubscription(null, () => { throw error });
    assert.throws(() => subscription.error());
  });

  it('calls the cleanup method after "error"', () => {
    let calls = [];
    let subscription = {};
    new EventStream((next, error) => {
      subscription.error = error;
      return () => { calls.push('cleanup') };
    }).listen(null, () => calls.push('error'));
    subscription.error();
    assert.deepEqual(calls, ['error', 'cleanup']);
  });

  it('calls the cleanup method if there is no callback', () => {
    let calls = [];
    let subscription = {};
    new EventStream((next, error) => {
      subscription.error = error;
      return () => { calls.push('cleanup') };
    }).listen();
    try {
      subscription.error();
    } catch (err) {}
    assert.deepEqual(calls, ['cleanup']);
  });

  it('throws if the cleanup function throws', () => {
    let error = {};
    let subscription = error;
    new EventStream((next, error) => {
      subscription.error = error;
      return () => { throw error };
    }).listen();
    assert.throws(() => subscription.error());
  });

});
