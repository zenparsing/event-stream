export function parse(string) {
  return new EventStream((next, error, complete) => {
    (async function() {
      await null;
      for (let char of string) {
        if (closed) return;
        else if (char !== '-') next(char);
        await null;
      }
      complete();
    })();
    let closed = false;
    return () => closed = true;
  });
}
