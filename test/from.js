import assert from 'assert';
import { testMethodProperty } from './properties.js';

describe('from', () => {
  const iterable = {
    *[Symbol.iterator]() {
      yield 1;
      yield 2;
      yield 3;
    },
  };

  it('is a method on EventStream', () => {
    testMethodProperty(EventStream, 'from', {
      configurable: true,
      writable: true,
      length: 1,
    });
  });

  it('throws if the argument is null', () => {
    assert.throws(() => EventStream.from(null));
  });

  it('throws if the argument is undefined', () => {
    assert.throws(() => EventStream.from(undefined));
  });

  it('throws if the argument is not observable or iterable', () => {
    assert.throws(() => EventStream.from({}));
  });

  describe('observables', () => {
    it('returns the input if the constructor matches "this"', () => {
      let ctor = function() {};
      let observable = new EventStream(() => {});
      observable.constructor = ctor;
      assert.equal(EventStream.from.call(ctor, observable), observable);
    });

    it('wraps the input if it is not an instance of EventStream', () => {
      let obj = {
        constructor: EventStream,
        listen() {}
      };
      assert.ok(EventStream.from(obj) !== obj);
    });

    it('returns an observable wrapping @@observable result', () => {
      let inner = {
        listen(next, error, complete) {
          observer = { next, error, complete };
          return () => { cleanupCalled = true };
        },
      };
      let observer;
      let cleanupCalled = true;
      let stream = EventStream.from(inner);
      stream.listen();
      assert.equal(typeof observer.next, 'function');
      observer.complete();
      assert.equal(cleanupCalled, true);
    });
  });

  describe('iterables', () => {
    it('throws if @@iterator is not a method', () => {
      assert.throws(() => EventStream.from({ [Symbol.iterator]: 1 }));
    });

    it('returns an observable wrapping iterables', async () => {
      let calls = [];
      let subscription = EventStream.from(iterable).listen(
        v => calls.push(['next', v]),
        () => {},
        () => calls.push(['complete'])
      );
      assert.deepEqual(calls, []);
      await null;
      assert.deepEqual(calls, [
        ['next', 1],
        ['next', 2],
        ['next', 3],
        ['complete'],
      ]);
    });
  });
});
