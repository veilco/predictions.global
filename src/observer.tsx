export type Subscribe<T> = (t: T) => void;
export type Unsubscribe = () => void;
export interface Subscription<T> {
  u: Unsubscribe,
  initialValue: T
}
export type Observer<T> = (s: Subscribe<T>) => Subscription<T>;

// TODO ObserverOwner should be named something like "ObservableValue". The idea here is to hide a piece of state inside an object to avoid putting that state in some parentComponent.state to avoid rerendering that parent. Eg. we hide currently selected currency in this object and use observer pattern to trigger descendant rerender without rerendering entire App / janking the whole page.
// TODO also there can be tools for being an observer, e.g. subscribe/auto unsubscribe on componentWillUnmount.
export interface ObserverOwner<T> {
  getCurrentValue: () => T,
  o: Observer<T>, // Observer to pass to descendants who want to observe this state
  setValueAndNotifyObservers: (t: T) => void, // cause all registered observers to see a new observation
}

export function makeObserverOwner<T>(initialValue: T): ObserverOwner<T> {
  let currentValue = initialValue;
  const subs: Set<Subscribe<T>> = new Set();
  const subscribe = (newSub: Subscribe<T>) => {
    subs.add(newSub);
    const response: Subscription<T> = {
      initialValue: currentValue,
      u: () => subs.delete(newSub),
    }
    return response;
  }
  return {
    getCurrentValue: () => currentValue,
    o: subscribe,
    setValueAndNotifyObservers: (newT: T) => {
      currentValue = newT;
      subs.forEach(s => s(newT));
    },
  };
}
