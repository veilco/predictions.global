import * as React from 'react';
import Header, { HasMarketsSummary } from "./Header";
import { Observer } from "./observer";
import { Currency } from './Currency';
import { Link } from 'react-router-dom';
import Footer from './Footer';

type Props = HasMarketsSummary & {
  currencySelectionObserver: Observer<Currency>;
}

const PublicEthereumNodes: React.SFC<Props> = (props) => {
  return <div>
    <Header ms={props.ms} currencySelectionObserver={props.currencySelectionObserver} doesClickingLogoReloadPage={false} headerContent={
      <div className="has-text-centered content">
        <h3 className="title">Public Ethereum &amp; Augur Nodes</h3>
        <p>These nodes can be used as the back end for <a href="https://github.com/AugurProject/augur-app/releases" target="_blank">Augur App</a>. (Eg. as an alternative to Infura.)</p>
        <p>This list is provided by Predictions.Global for your convenience. We trust the community members hosting these nodes, but make no security guarantees.</p>
      </div>
    }
    />
    <section className="section">
      <div className="container">
        <div className="columns has-text-centered is-centered is-vcentered is-multiline content">
          <div className="column is-narrow">
            <table>
              <thead>
                <tr>
                  <th />
                  <th>Ethereum HTTP Endpoint</th>
                  <th>Ethereum Websocket Endpoint</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>#1</strong></td>
                  <td><code>https://megageth.com/</code></td>
                  <td><code>wss://megageth.com/ws</code></td>
                </tr>
                <tr>
                  <td><strong>#2</strong></td>
                  <td><code>https://gethstar.com/</code></td>
                  <td><code>wss://gethstar.com/ws</code></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="column is-narrow">
            <table>
              <thead>
                <tr>
                  <th />
                  <th>Augur Node Websocket Endpoint</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>#1</strong></td>
                  <td><code>wss://augur.gethstar.com</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
    {Footer}
  </div>;
};

export default PublicEthereumNodes;
