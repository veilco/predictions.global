import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
// @ts-ignore for HashLink which has no TypeScript types
import { HashLink } from 'react-router-hash-link';
import Footer from './Components/Footer';
import Header, { feedbackFormURL, HasMarketsSummary } from "./Components/Header";
import { Observer } from "./Components/observer";
import { Currency } from './Currency';


type Props = HasMarketsSummary & {
  currencySelectionObserver: Observer<Currency>;
}

interface FAQItem {
  id: string,
  title: string,
  body: React.ReactNode,
}

const faqItems: FAQItem[] = [
  {
    body: <div>
      <ol>
        <li><a href="https://github.com/AugurProject/augur-app/releases" target="_blank">Download Augur App</a></li>
        <li>Run Augur App and start blockchain sync[1]</li>
        <li>Check out <a href="https://www.youtube.com/watch?v=Gd5s56_NLhg" target="_blank">BlockWolf's Augur Tutorial</a> on YouTube</li>
      </ol>

      <p>Augur App requires an Ethereum wallet. If you need one, we recommend <a href="https://metamask.io/" target="_blank">MetaMask</a> and <a href="https://coinbase.com" target="_blank">Coinbase</a> to buy your Ether.</p>

      <p>Join us on the <a href="https://discord.gg/faud6Fx" target="_blank">Augur Discord <i className="fab fa-discord" /></a>.</p>

      <p>[1] If you have trouble syncing Augur App, please try a different server. See our <Link to="/augur-public-ethereum-nodes">list of Public Ethereum Nodes</Link>.</p>
    </div>,
    id: 'getting-started-with-augur',
    title: 'How do I use Augur?',
  },
  {
    body: <div>
      <p>Ξ is the <a href="https://ethereumsymbol.com/" target="_blank">symbol</a> for ETH, the currency of the Ethereum blockchain. We say "10Ξ" (pronounced "ten Ether") the same way we'd say "$10".</p>
      <p>Similarly, Ƀ is the symbol for BTC (Bitcoin).</p>
    </div>,
    id: 'what-is-eth-symbol',
    title: 'What is Ξ?',
  },
  {
    body: <div>
      <p>First, we generate one number, called the <strong>liquidity metric</strong>, for each market. The liquidity metric tells you <strong>how deep the order book is</strong>, and <strong>how wide the spread is</strong>, in <strong>one number</strong>. We do this by simulating a series of buys and sells into each market.</p>
      <p>Second, we sort markets by the liquidity metric. A higher liquidity metric means the market is more attractive to traders (all other things equal).</p>
      <p>Third, we <strong>hide markets with a liquidity metric below our cut-off</strong>.</p>
      <p>The liquidity metrics themselves are currently not shown.</p>
      <p><Link to="/?s=Liquidity">View Liquid Markets</Link></p>
    </div>,
    id: 'sort-by-liquidity',
    title: 'How does "Sort By Liquidity" work?',
  },
  {
    body: <div>
      <p>To calculate each market's liquidity metric, we simulate a series of buys and sells into that market. The Target Liquidity is the <strong>budget in ETH for those simulated buys and sells.</strong></p>
      <p>Each market has <strong>one liquidity metric per Target Liquidity</strong>. For example, one market may have a liquidity metric <em>X</em> for a Target Liquidity of 10 ETH, but has a different liquidity metric <em>Y</em> for a Target Liquidity of 50 ETH.</p>
      <p>The Target Liquidity can be thought of as a <strong>trader's desired budget to spend on one market</strong>.</p>
      <p>We support multiple Target Liquidities because traders have different budgets.</p>
      <p><Link to="/?s=Liquidity">View Liquid Markets</Link></p>
    </div>,
    id: 'target-liquidity',
    title: 'With "Sort By Liquidity", what is "Target Liquidity"?',
  },
  {
    body: <div>
      <p>Liquid Markets is the number of markets with a liquidity metric above the cut-off for the lowest Target Liquidity.</p>
      <p>Ie. when you <Link to="/?s=Liquidity">sort by liquidity</Link>, the number of markets in this list is the same number as Liquid Markets.</p>
    </div>,
    id: 'what-is-liquid-markets',
    title: 'What is "Liquid Markets" at the top of each page on Predictions.Global?',
  },
  {
    body: <div>
      <p>Yes. Predictions.Global maintains a market blacklist based on our mission to expand the reach and social utility of prediction markets. We currently evaluate markets on a case by case basis. Please <a href={feedbackFormURL} target="_blank">contact us</a> if you think a market should be on our blacklist.</p>
    </div>,
    id: 'blacklist',
    title: 'Does Predictions.Global blacklist markets?',
  },
  {
    body: <div>
      <p>Open Interest is the <strong>total amount of ETH</strong> escrowed (currently locked up) in Augur's prediction markets. Open Interest is the technical name for "Money At Stake".</p>
      <p>Open Interest (denominated in ETH) has a <strong>1-to-1 correspondence with "complete sets"</strong> of Augur shares. Every 1 ETH corresponds to 1 complete set of shares.</p>
      <p>Complete sets of shares have a lifecycle; a new market initially has zero complete sets of shares.</p>
      <p>Augur users can trade in each market. Each trade is between two users. When doing one trade, each user "pays for" their side of the trade by escrowing (locking up inside Augur) either their ETH or shares from that market they already possess.</p>
      <p><strong>Complete sets of shares are created and destroyed based on whether users escrow their ETH or existing shares.</strong> Since Open Interest has a 1-to-1 correspondence with complete sets of shares, this is also how Open Interest increases and decreases.</p>
      <p><strong>How Open Interest increases and decreases:</strong><br /><em>(this matrix occurs for each trade)</em></p>
      <table className="table is-bordered">
        <tbody>
          <tr>
            <td />
            <td>They escrow ETH</td>
            <td>They escrow shares</td>
          </tr>
          <tr>
            <td>We escrow ETH</td>
            <td>Complete sets of shares created; <strong>Open Interest increases</strong></td>
            <td>We get their existing shares, they get our ETH</td>
          </tr>
          <tr>
            <td>We escrow shares</td>
            <td>They get our existing shares, we get their ETH</td>
            <td>Complete sets of shares destroyed; <strong>Open Interest decreases</strong></td>
          </tr>
        </tbody>
      </table>
      <p>To learn more, we recommend starting with the <a href="https://www.augur.net/whitepaper.pdf" target="_blank">Augur White Paper</a>.</p>
    </div>,
    id: 'what-is-open-interest',
    title: 'What is "Open Interest"?',
  },
];

const FAQ: React.SFC<Props> = (props) => {
  return <div>
    <Header ms={props.ms} currencySelectionObserver={props.currencySelectionObserver} doesClickingLogoReloadPage={false} headerContent={
      <div className="has-text-centered content">
        <a href={feedbackFormURL} target="_blank">Send Feedback</a>
      </div>
    }
    />
    <section className="section">
      <div className="container">
        <div className="columns is-centered is-vcentered content">
          <div className="column is-12-mobile is-6-tablet is-6-desktop no-padding-bottom no-margin-bottom">
            <h3 className="title">Frequently Asked Questions</h3>
          </div>
        </div>
        <div className="columns is-centered is-vcentered content">
          <div className="column is-12-mobile is-6-tablet is-6-desktop no-padding-top">
            <ul>
            {faqItems.map((fi, index) => <li key={fi.id}>
                <HashLink to={`#${fi.id}`}>{fi.title}</HashLink>
            </li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
    <section className="section">
      <div className="container">
        {faqItems.map(fi => <div key={fi.id} id={fi.id} className="columns is-centered is-vcentered">
          <div className="column is-12-mobile is-6-tablet is-6-desktop content">
            <h5 className="title is-5"><a href={`#${fi.id}`} style={{ color: 'black' }}><i className="fas fa-link" />&nbsp;</a>{fi.title}</h5>
            {fi.body}
            <br />
          </div>
        </div>)}
      </div>
    </section>
    {Footer}
    <Helmet>
      <title>FAQ | Predictions.Global</title>
      <meta name="description" content="List of Frequently Asked Questions (known as a FAQ) for Predictions.Global." />
    </Helmet>
  </div>;
};

export default FAQ;
