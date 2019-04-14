import assert from 'assert';

describe('async-iteration', () => {

  it('allows for-await iteration', async () => {
    let stream = new EventStream((next, error, complete) => {
      Promise.resolve().then(() => {
        next(1);
        next(2);
      }).then(() => {
        return new Promise(resolve => setTimeout(resolve, 1));
      }).then(() => {
        next(3);
      }).then(() => {
        complete();
      });
    });

    let values = [];

    // Eval is used where translators do not yet support for-await
    let fn = eval(`
      async () => {
        for await (let x of stream) {
          values.push(x);
        }
      }
    `);

    await fn();

    assert.deepEqual(values, [1, 2, 3]);
  });

});
