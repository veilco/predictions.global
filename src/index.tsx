import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Routes} from './Routes';
import './index.css';
import registerServiceWorker from './registerServiceWorker';
import {MarketsSummary} from './generated/markets_pb';

// function makeDataLoader(dataURI: string, callback: (ms: MarketsSummary) => void): void {
//   function reload() {
//     // fetch polyfill is automatically supplied by create-react-app's build.
//     fetch(new Request(dataURI, {
//       mode: "cors", // mode cors assumes dataURI has a different origin; once dataURI is served from CDN (instead of directly from google storage bucket) we'll want to update this code.
//     })).then(resp => {
//       if (!resp.ok) {
//         throw Error(resp.statusText);
//       }
//
//       return resp.arrayBuffer()
//     }).then(ab => {
//       callback(MarketsSummary.deserializeBinary(new Uint8Array(ab)));
//     }).catch(console.error.bind(console));
//   }
//
//   reload();
//   // setInterval(reload, 15000); // naive real time updates
//   // TODO backoff on error
//   // TODO smarter real time data updates
//   // TODO after adding periodicity, return a cancellation object
// }

// window.DATA_URI is set index.html from the environment
// variable REACT_APP_DATA_URI. This allows the dataURI to
// vary based on build environment (eg. dev, staging, prod).

// TODO if MarketsSummary generation time is relatively old, perform another fetch immediately.

registerServiceWorker();

// makeDataLoader((window as any).DATA_URI, (ms: MarketsSummary) => {
ReactDOM.render(<Routes />, document.getElementById('root') as HTMLElement);
// });