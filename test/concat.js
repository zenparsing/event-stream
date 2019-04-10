import assert from 'assert';

describe('concat', () => {
  it('concatenates the supplied EventStream arguments', async () => {
    let list = [];

    await EventStream
      .from([1, 2, 3, 4])
      .concat(EventStream.of(5, 6, 7))
      .forEach(x => list.push(x));

    assert.deepEqual(list, [1, 2, 3, 4, 5, 6, 7]);
  });

  it('can be used multiple times to produce the same results', async () => {
    const list1 = [];
    const list2 = [];

    const concatenated = EventStream.from([1, 2, 3, 4])
      .concat(EventStream.of(5, 6, 7));

    await concatenated
      .forEach(x => list1.push(x));
    await concatenated
      .forEach(x => list2.push(x));

    assert.deepEqual(list1, [1, 2, 3, 4, 5, 6, 7]);
    assert.deepEqual(list2, [1, 2, 3, 4, 5, 6, 7]);
  });
});
