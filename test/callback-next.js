import assert from 'assert';
import { testMethodProperty } from './properties.js';

describe('callback-next', () => {

  it('forwards the first argument', () => {
    let args;
    let subscription = getSubscription((...a) => args = a);
    subscription.next(1, 2);
    assert.deepEqual(args, [1]);
  });

  it('returns a value', () => {
    let subscription = getSubscription(() => 1);
    assert.equal(subscription.next(), 1);
  });

  it('does not forward when the subscription is complete', () => {
    let count = 0;
    let subscription = getSubscription({ next() { count++ } });
    subscription.complete();
    subscription.next();
    assert.equal(count, 0);
  });

  it('does not forward when the subscription is cancelled', () => {
    let count = 0;
    let subscription = getSubscription(() => count++);
    subscription.cancel();
    subscription.next();
    assert.equal(count, 0);
  });

  it('remains closed if the subscription is cancelled from "next"', () => {
    let subscription = getSubscription(() => subscription.cancel());
    subscription.next();
    assert.equal(subscription.cleanupCalled, true);
  });

  it('throws if the subscription is not initialized', () => {
    assert.throws(() => {
      new EventStream((next) => next()).listen();
    });
  });

  it('does not callback if the subscription is closed', () => {
    let called = false;
    let subscription = getSubscription(() => called = true);
    subscription.complete();
    subscription.next();
    assert.equal(called, false);
  });

  it('calls the callback if the subscription is running', () => {
    let values = [];
    let subscription = getSubscription((val) => {
      values.push(val);
      if (val === 1) subscription.next(2);
    });
    subscription.next(1);
    assert.deepEqual(values, [1, 2]);
  });

  it('throws if callback is not a method', () => {
    assert.throws(() => getSubscription(1).next());
    assert.throws(() => getSubscription({}).next());
  });

  it('does not throw if callback is undefined', () => {
    getSubscription(undefined).next();
  });

  it('does not report error if callback is null', () => {
    getSubscription(null).next();
  });

  it('throws if callback throws', () => {
    let error = {};
    let subscription = getSubscription(() => { throw error });
    assert.throws(() => subscription.next());
    assert.equal(subscription.cleanupCalled, false);
  });

});
