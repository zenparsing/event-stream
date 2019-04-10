# event-stream

An implementation of EventStream for JavaScript.

## Install

```sh
npm install @zenparsing/event-stream
```

## Usage

```js
import EventStream from '@zenparsing/event-stream';

EventStream.of(1, 2, 3).listen(x => console.log(x));
```

## API

### new EventStream(initializer)

```js
let EventStream = new EventStream((next, error, complete) => {
  // Emit a single value after 1 second
  let timer = setTimeout(() => {
    next('hello');
    complete();
  }, 1000);

  // On unsubscription, cancel the timer
  return () => clearTimeout(timer);
});
```

Creates a new EventStream object using the specified initializer function.  The initializer function is called whenever the `listen` method of the EventStream object is invoked.  The initializer function is passed the following callback functions:

- `next(value)` Sends the next value in the sequence.
- `error(exception)` Terminates the sequence with an exception.
- `complete()` Terminates the sequence successfully.

The initializer function can optionally return either a cleanup function.  If it returns a cleanup function, that function will be called when the subscription has closed.

### EventStream.of(...items)

```js
// Logs 1, 2, 3
EventStream.of(1, 2, 3).listen(x => {
  console.log(x);
});
```

Returns an EventStream which will emit each supplied argument.

### EventStream.from(value)

```js
let list = [1, 2, 3];

// Iterate over an object
EventStream.from(list).listen(x => {
  console.log(x);
});
```

```js
// Convert something 'EventStream' to an EventStream instance
EventStream.from(otherEventStream).listen(x => {
  console.log(x);
});
```

Converts `value` to an EventStream.

- If `value` is an implementation of EventStream, then it is converted to an instance of EventStream as defined by this library.
- Otherwise, it is converted to an EventStream which synchronously iterates over `value`.

### EventStream.listen([onNext, onError, onComplete])

```js
let cancel = EventStream.listen(
  x => console.log(x),
  err => console.log(`Finished with error: ${ err }`),
  () => console.log('Finished')
);
```

Listens to the EventStream. Returns a function that can be used to cancel the stream.

### EventStream.forEach(callback)

```js
EventStream.forEach(x => {
  console.log(`Received value: ${ x }`);
}).then(() => {
  console.log('Finished successfully')
}).catch(err => {
  console.log(`Finished with error: ${ err }`);
})
```

Listens to the EventStream and returns a Promise for the completion value of the stream.  The `callback` argument is called once for each value in the stream.

### EventStream.filter(callback)

```js
EventStream.of(1, 2, 3).filter(value => {
  return value > 2;
}).listen(value => {
  console.log(value);
});
// 3
```

Returns a new EventStream that emits all values which pass the test implemented by the `callback` argument.

### EventStream.map(callback)

Returns a new EventStream that emits the results of calling the `callback` argument for every value in the stream.

```js
EventStream.of(1, 2, 3).map(value => {
  return value * 2;
}).listen(value => {
  console.log(value);
});
// 2
// 4
// 6
```

### EventStream.reduce(callback [, initialValue])

```js
EventStream.of(0, 1, 2, 3, 4).reduce((previousValue, currentValue) => {
  return previousValue + currentValue;
}).listen(result => {
  console.log(result);
});
// 10
```

Returns a new EventStream that applies a function against an accumulator and each value of the stream to reduce it to a single value.

### EventStream.concat(...sources)

```js
EventStream.of(1, 2, 3).concat(
  EventStream.of(4, 5, 6),
  EventStream.of(7, 8, 9)
).listen(result => {
  console.log(result);
});
// 1, 2, 3, 4, 5, 6, 7, 8, 9
```

Merges the current EventStream with additional EventStreams.
