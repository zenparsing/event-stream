import assert from 'assert';

describe('species', () => {
  it('uses EventStream when constructor is undefined', () => {
    let instance = new EventStream(() => {});
    instance.constructor = undefined;
    assert.ok(instance.map(x => x) instanceof EventStream);
  });

  it('uses EventStream if species is null', () => {
    let instance = new EventStream(() => {});
    instance.constructor = { [Symbol.species]: null };
    assert.ok(instance.map(x => x) instanceof EventStream);
  });

  it('uses EventStream if species is undefined', () => {
    let instance = new EventStream(() => {});
    instance.constructor = { [Symbol.species]: undefined };
    assert.ok(instance.map(x => x) instanceof EventStream);
  });

  it('uses value of Symbol.species', () => {
    function ctor() {}
    let instance = new EventStream(() => {});
    instance.constructor = { [Symbol.species]: ctor };
    assert.ok(instance.map(x => x) instanceof ctor);
  });
});
