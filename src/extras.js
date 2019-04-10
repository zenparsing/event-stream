import { EventStream } from './EventStream.js';

// Emits all values from all inputs in parallel
export function merge(...sources) {
  return new EventStream((next, error, complete) => {
    if (sources.length === 0)
      return EventStream.from([]);

    let count = sources.length;

    let list = sources.map(source => EventStream.from(source).listen(
      next,
      error,
      () => {
        if (--count === 0)
          complete();
      }
    ));

    return () => list.forEach(cancel => cancel());
  });
}

// Emits arrays containing the most current values from each input
export function combineLatest(...sources) {
  return new EventStream((next, error, complete) => {
    if (sources.length === 0)
      return EventStream.from([]);

    let count = sources.length;
    let seen = new Set();
    let seenAll = false;
    let values = sources.map(() => undefined);

    let list = sources.map((source, index) => EventStream.from(source).listen(
      v => {
        values[index] = v;

        if (!seenAll) {
          seen.add(index);
          if (seen.size !== sources.length)
            return;

          seen = null;
          seenAll = true;
        }

        next(Array.from(values));
      },
      error,
      () => {
        if (--count === 0)
          complete();
      }
    ));

    return () => list.forEach(cancel => cancel());
  });
}

// Emits arrays containing the matching index values from each input
export function zip(...sources) {
  return new EventStream((next, error, complete) => {
    if (sources.length === 0)
      return EventStream.from([]);

    let queues = sources.map(() => ({
      queue: [],
      done: false,
    }));

    function checkDone() {
      if (queues.some(entry => entry.queue.length === 0 && entry.done))
        complete();
    }

    let list = sources.map((source, index) => EventStream.from(source).listen(
      v => {
        queues[index].queue.push(v);
        if (queues.every(entry => entry.queue.length > 0)) {
          next(queues.map(entry => entry.queue.shift()));
          checkDone();
        }
      },
      error,
      () => {
        queues[index].done = true;
        checkDone();
      }
    ));

    return () => list.forEach(cancel => cancel());
  });
}
