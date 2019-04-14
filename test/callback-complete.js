import assert from 'assert';
import { testMethodProperty } from './properties.js';

describe('callback-complete', () => {

  it('forwards arguments', () => {
    let args;
    let subscription = getSubscription(null, null, (...a) => { args = a });
    subscription.complete(1);
    assert.deepEqual(args, [1]);
  });

  it('allows return values', () => {
    let subscription = getSubscription(null, null, () => 1);
    assert.equal(subscription.complete(), 1);
  });

  it('does not forward when the subscription is complete', () => {
    let count = 0;
    let subscription = getSubscription(null, null, () => count++);
    subscription.complete();
    subscription.complete();
    assert.equal(count, 1);
  });

  it('does not forward when the subscription is cancelled', () => {
    let count = 0;
    let subscription = getSubscription(null, null, () => count++);
    subscription.cancel();
    subscription.complete();
    assert.equal(count, 0);
  });

  it('throws if the subscription is not initialized', async () => {
    assert.throws(() => {
      new EventStream((next, error, complete) => {
        complete();
      }).observe();
    });
  });

  it('sends if the subscription is running', async () => {
    let subscription;
    let completed = false;
    new EventStream((next, error, complete) => {
      subscription = { next, error, complete };
    }).listen(
      () => subscription.complete(),
      null,
      () => completed = true
    );
    subscription.next();
    assert.equal(completed, true);
  });

  it('closes the subscription before invoking inner subscription', () => {
    let hasValue = false;
    let subscription = getSubscription(
      () => { hasValue = true },
      null,
      () => { subscription.next() },
    );
    subscription.complete();
    assert.equal(hasValue, false);
  });

  it('throws error if callback is not a method', () => {
    let subscription = getSubscription(null, null, 1);
    assert.throws(() => subscription.complete());
  });

  it('does not throw an error if "complete" is undefined', () => {
    let subscription = getSubscription(null, null, undefined);
    subscription.complete();
    assert.doesNotThrow(() => subscription.complete());
  });

  it('does not throw an error if "complete" is null', () => {
    let subscription = getSubscription(null, null, null);
    assert.doesNotThrow(() => subscription.complete());
  });

  it('throws an error if callback throws', () => {
    let error = {};
    let subscription = getSubscription(null, null, () => { throw error });
    assert.throws(() => subscription.complete());
  });

  it('calls the cleanup method after callback', () => {
    let calls = [];
    let subscription;
    new EventStream((next, error, complete) => {
      subscription = { next, error, complete };
      return () => { calls.push('cleanup') };
    }).listen(null, null, () => { calls.push('complete') });
    subscription.complete();
    assert.deepEqual(calls, ['complete', 'cleanup']);
  });

  it('calls the cleanup method if there is no callback', () => {
    let calls = [];
    let subscription;
    new EventStream((next, error, complete) => {
      subscription = { next, error, complete };
      return () => { calls.push('cleanup') };
    }).listen();
    subscription.complete();
    assert.deepEqual(calls, ['cleanup']);
  });

  it('throws an error if the cleanup function throws', () => {
    let error = {};
    let subscription;
    new EventStream((next, error, complete) => {
      subscription = { next, error, complete };
      return () => { throw error };
    }).listen();
    assert.throws(() => subscription.complete());
  });
});
