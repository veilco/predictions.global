export type SubscriptionOnValueChangeHandler<T> = (t: T) => void;
export type Unsubscribe = () => void;
export interface Subscription<T> {
  unsubscribe: Unsubscribe,
  initialValue: T
}
export interface Observer<T> {
  subscribe: (s: SubscriptionOnValueChangeHandler<T>) => Subscription<T>,
  isObserver: true, // this property is used to
};
export function isObserver<T>(o: T | Observer<T>): o is Observer<T> {
  return typeof o === 'object' && (o as any).isObserver;
}

// TODO ObserverOwner should be named something like "ObservableValue". The idea here is to hide a piece of state inside an object to avoid putting that state in some parentComponent.state to avoid rerendering that parent. Eg. we hide currently selected currency in this object and use observer pattern to trigger descendant rerender without rerendering entire App / janking the whole page.
// TODO also there can be tools for being an observer, e.g. subscribe/auto unsubscribe on componentWillUnmount.
export interface ObserverOwner<T> {
  getCurrentValue: () => T,
  observer: Observer<T>, // Observer to pass to descendants who want to observe this state
  setValueAndNotifyObservers: (t: T) => void, // cause all registered observers to see a new observation
}

export function makeObserverOwner<T>(initialValue: T): ObserverOwner<T> {
  let currentValue = initialValue;
  const subs: Set<SubscriptionOnValueChangeHandler<T>> = new Set();
  const subscribe = (newSub: SubscriptionOnValueChangeHandler<T>) => {
    subs.add(newSub);
    const response: Subscription<T> = {
      initialValue: currentValue,
      unsubscribe: () => subs.delete(newSub),
    }
    return response;
  }
  return {
    getCurrentValue: () => currentValue,
    observer: {
      isObserver: true,
      subscribe,
    },
    setValueAndNotifyObservers: (newT: T) => {
      currentValue = newT;
      subs.forEach(s => s(newT));
    },
  };
}
