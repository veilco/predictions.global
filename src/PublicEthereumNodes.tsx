import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Currency } from './Currency';
import Footer from './Components/Footer';
import Header, { HasMarketsSummary } from "./Components/Header";
import { Observer } from "./Components/observer";

type Props = HasMarketsSummary & {
  currencySelectionObserver: Observer<Currency>;
}

const PublicEthereumNodes: React.SFC<Props> = (props) => {
  return <div>
    <Header ms={props.ms} currencySelectionObserver={props.currencySelectionObserver} doesClickingLogoReloadPage={false} headerContent={
      <div className="has-text-centered content">
        <h3 className="title">Public Ethereum Nodes</h3>
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
                <tr>
                  <td><strong>#3</strong></td>
                  <td><code>https://ponytail.io/</code></td>
                  <td><code>wss://ponytail.io/ws</code></td>
                </tr>
                <tr>
                  <td><strong>#4</strong></td>
                  <td><code>https://epoxide.io/</code></td>
                  <td><code>wss://epoxide.io/ws</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
    {Footer}
    <Helmet>
      <title>List of public Ethereum Node servers with HTTP and Websocket endpoints for Augur App | Predictions.Global</title>
      <meta name="description" content="List of community-curated, trusted public Ethereum and Augur Node servers for use with Augur App. Endpoints are available for HTTP and Websocket connections. This may be useful as an alternative to Infura." />
    </Helmet>
  </div>;
};

export default PublicEthereumNodes;
