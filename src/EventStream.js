// === Abstract Operations ===

function getMethod(obj, key) {
  let value = obj[key];

  if (value == null)
    return undefined;

  if (typeof value !== 'function')
    throw new TypeError(value + ' is not a function');

  return value;
}

function getSpecies(obj) {
  let ctor = obj.constructor;
  if (ctor !== undefined) {
    ctor = ctor[Symbol.species];
    if (ctor === null) {
      ctor = undefined;
    }
  }
  return ctor !== undefined ? ctor : EventStream;
}

const $brand = Symbol();
const $initializer = Symbol();

function isEventStream(x) {
  return x[$brand] === x; // SPEC: Brand check
}

function enqueue(fn) {
  Promise.resolve().then(() => {
    try { fn() }
    catch (e) { hostReportError(e) }
  });
}

function hostReportError(e) {
  if (hostReportError.log) {
    hostReportError.log(e);
  } else {
    setTimeout(() => { throw e });
  }
}

class AsyncAdaptor {

  constructor() {
    this.current = undefined;
    this.requests = [];
    this.queue = [];
    this.done = false;
    this.cancel = undefined;
  }

  static createIterator(stream) {
    let adaptor = new this();

    adaptor.cancel = stream.listen(
      v => adaptor.receive('next', v),
      v => adaptor.receive('error', v),
      v => adaptor.receive('complete', v)
    );

    return {
      next(v) { return adaptor.request('next', v) },
      throw(v) { return adaptor.request('throw', v) },
      return(v) { return adaptor.request('return', v) },
      [Symbol.asyncIterator]() { return this },
    };
  }

  receive(type, value) {
    if (this.done) return;

    if (this.current) this.resolveCurrent(type, value);
    else this.queue.push([type, value]);
  }

  resolveCurrent(type, value) {
    // assert(this.current && !this.done)
    let request = this.current;

    switch (type) {
      case 'next':
        request.resolve({ value, done: false });
        if (this.requests.length === 0) this.current = undefined;
        else this.setCurrent(this.requests.shift());
        break;
      case 'error':
        request.reject(value);
        this.finalize();
        break;
      case 'complete':
        request.resolve({ value, done: true });
        this.finalize();
        break;
    }
  }

  flushRequest(request) {
    if (request.type === 'throw') request.reject(request.value);
    else request.resolve({ value: request.value, done: true });
  }

  finalize() {
    while (this.requests.length > 0)
      this.flushRequest(this.requests.shift());

    this.done = true;
    this.current = undefined;
    this.queue = undefined;
    this.requests = undefined;
    this.cancel = undefined;
  }

  setCurrent(request) {
    // assert(!this.done)
    if (request.type === 'next') {
      this.current = request;
    } else {
      this.cancel();
      this.flushRequest(request);
      this.finalize();
    }
  }

  request(type, value) {
    return new Promise((resolve, reject) => {
      let request = { resolve, reject, type, value };

      if (this.done) {
        this.flushRequest(request);
        return;
      }

      if (this.current) {
        this.requests.push(request);
      } else {
        this.setCurrent(request);
        if (!this.done && this.queue.length > 0) {
          let [type, value] = this.queue.shift();
          this.resolveCurrent(type, value);
        }
      }
    });
  }
}

class Subscription {

  constructor(onNext, onError, onComplete) {
    this.onNext = onNext;
    this.onError = onError,
    this.onComplete = onComplete;
    this.cleanup = undefined;
    this.state = 'initializing';
  }

  send(type, value) {
    if (this.state === 'closed')
      return undefined;

    if (this.state === 'initializing')
      throw new Error('Cannot send values while initializing');

    let completion;
    let isError = false;

    try {
      switch (type) {
        case 'next':
          if (this.onNext) completion = this.onNext(value);
          break;
        case 'error':
          this.close();
          if (this.onError) completion = this.onError(value);
          else throw value;
          break;
        case 'complete':
          this.close();
          if (this.onComplete) completion = this.onComplete(value);
          break;
      }
    } catch (e) {
      completion = e;
      isError = true;
    }

    if (this.state === 'closed')
      this.finalize();

    if (isError) throw completion;
    else return completion;
  }

  cancel() {
    if (this.state !== 'closed') {
      this.close();
      this.finalize();
    }
  }

  close() {
    this.queue = undefined;
    this.state = 'closed';
  }

  finalize() {
    let cleanup = this.cleanup;
    this.cleanup = undefined;

    if (cleanup)
      cleanup();
  }
}

export class EventStream {

  constructor(initializer) {
    if (!(this instanceof EventStream))
      throw new TypeError('EventStream cannot be called as a function');

    if (typeof initializer !== 'function')
      throw new TypeError('EventStream initializer must be a function');

    this[$initializer] = initializer;
    this[$brand] = this;
  }

  listen(onNext, onError, onComplete) {
    let subscription = new Subscription(onNext, onError, onComplete);

    subscription.cleanup = this[$initializer].call(undefined,
      x => subscription.send('next', x),
      x => subscription.send('error', x),
      x => subscription.send('complete', x)
    );

    if (subscription.state === 'initializing')
      subscription.state = 'ready';

    return () => subscription.cancel();
  }

  forEach(fn) {
    return new Promise((resolve, reject) => {
      if (typeof fn !== 'function') {
        reject(new TypeError(fn + ' is not a function'));
        return;
      }

      let cancel = this.listen(value => {
        try {
          fn(value);
        } catch (e) {
          reject(e);
          cancel();
        }
      }, reject, resolve);
    });
  }

  map(fn) {
    if (typeof fn !== 'function')
      throw new TypeError(fn + ' is not a function');

    let C = getSpecies(this);

    return new C((next, error, complete) => this.listen(value => {
      try { value = fn(value) }
      catch (e) { return error(e) }
      next(value);
    }, error, complete));
  }

  filter(fn) {
    if (typeof fn !== 'function')
      throw new TypeError(fn + ' is not a function');

    let C = getSpecies(this);

    return new C((next, error, complete) => this.listen(value => {
      try { if (!fn(value)) return; }
      catch (e) { return error(e) }
      next(value);
    }, error, complete));
  }

  reduce(fn) {
    if (typeof fn !== 'function')
      throw new TypeError(fn + ' is not a function');

    let C = getSpecies(this);
    let hasSeed = arguments.length > 1;
    let hasValue = false;
    let seed = arguments[1];
    let acc = seed;

    return new C((next, error, complete) => this.listen(
      value => {
        let first = !hasValue;
        hasValue = true;

        if (!first || hasSeed) {
          try { acc = fn(acc, value) }
          catch (e) { return error(e) }
        } else {
          acc = value;
        }
      },
      error,
      () => {
        if (!hasValue && !hasSeed)
          return error(new TypeError('Cannot reduce an empty sequence'));

        next(acc);
        complete();
      }
    ));
  }

  concat(...sources) {
    let C = getSpecies(this);

    return new C((next, error, complete) => {
      let cancel;
      let index = 0;

      function startSource(source) {
        cancel = source.listen(next, error, () => {
          if (index === sources.length) {
            cancel = undefined;
            complete();
          } else {
            startSource(C.from(sources[index++]));
          }
        });
      }

      startSource(this);

      return () => {
        if (cancel) {
          cancel();
          cancel = undefined;
        }
      };
    });
  }

  flatMap(fn) {
    if (typeof fn !== 'function')
      throw new TypeError(fn + ' is not a function');

    let C = getSpecies(this);

    return new C((next, error, complete) => {
      let list = [];
      let outerComplete = false;

      let cancel = this.listen(
        value => {
          if (fn) {
            try { value = fn(value) }
            catch (e) { return error(e) }
          }

          let inner = C.from(value).listen(
            next,
            error,
            () => {
              let i = list.indexOf(inner);
              if (i >= 0) list.splice(i, 1);
              completeIfDone();
            }
          );

          list.push(inner);
        },
        error,
        () => {
          outerComplete = true;
          completeIfDone();
        }
      );

      function completeIfDone() {
        if (outerComplete && list.length === 0)
          complete();
      }

      return () => {
        list.forEach(cancel => cancel());
        cancel();
      };
    });
  }

  [Symbol.asyncIterator]() {
    return AsyncAdaptor.createIterator(this);
  }

  static from(x) {
    let C = typeof this === 'function' ? this : EventStream;

    if (x == null)
      throw new TypeError(x + ' is not an object');

    if (isEventStream(x) && x.constructor === C)
      return x;

    let method;

    // TODO: Symbol.listen?
    method = getMethod(x, 'listen');
    if (method)
      return new C((next, error, complete) => method.call(x, next, error, complete));

    method = getMethod(x, Symbol.iterator);
    if (method) {
      return new C((next, error, complete) => {
        let closed = false;

        enqueue(() => {
          if (closed) return;
          for (let item of method.call(x)) {
            next(item);
            if (closed) return;
          }
          complete();
        });

        return () => { closed = true };
      });
    }

    throw new TypeError(x + ' cannot be converted to an EventStream');
  }

  static of(...items) {
    let C = typeof this === 'function' ? this : EventStream;

    return new C((next, error, complete) => {
      let closed = false;

      enqueue(() => {
        if (closed) return;
        for (let item of items) {
          next(item);
          if (closed) return;
        }
        complete();
      });

      return () => { closed = true };
    });
  }

  static get [Symbol.species]() { return this }

}
