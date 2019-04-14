import { EventStream } from '../src/EventStream.js';

function getSubscription(...args) {
  let subscription = {
    cleanupCalled: false,
  };

  subscription.cancel = new EventStream((next, error, complete) => {
    subscription.next = next;
    subscription.error = error;
    subscription.complete = complete;
    return () => subscription.cleanupCalled = true;
  }).listen(...args);

  return subscription;
}

beforeEach(() => {
  global.EventStream = EventStream;
  global.getSubscription = getSubscription;
});
