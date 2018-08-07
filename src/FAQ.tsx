import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Currency } from './Currency';
import Footer from './Components/Footer';
import Header, { HasMarketsSummary } from "./Components/Header";
import { Observer } from "./Components/observer";
import { Link } from 'react-router-dom';

type Props = HasMarketsSummary & {
  currencySelectionObserver: Observer<Currency>;
}

const FAQ: React.SFC<Props> = (props) => {
  return <div>
    <Header ms={props.ms} currencySelectionObserver={props.currencySelectionObserver} doesClickingLogoReloadPage={false} headerContent={
      <div className="has-text-centered content">
        <h3 className="title">Frequently Asked Questions</h3>
      </div>
    }
    />
    <section className="section">
      <div className="container">
        <div id="sort-by-liquidity" className="columns is-centered is-vcentered content">
          <div className="column is-12-mobile is-6-tablet is-6-desktop" >
              <h5 className="title is-5"><a href="#sort-by-liquidity" style={{ color: 'black' }}><i className="fas fa-link" />&nbsp;</a> How does "Sort By Liquidity" work?</h5>
            <p>First, we generate one number, called the <strong>liquidity metric</strong>, for each market. The liquidity metric tells you <strong>how deep the order book is</strong>, and <strong>how wide the spread is</strong>, in <strong>one number</strong>. We do this by simulating a series of buys and sells into each market.</p>
            <p>Second, we sort markets by the liquidity metric. A higher liquidity metric means the market is more attractive to traders (all other things equal).</p>
            <p>Third, we <strong>hide markets with a liquidity metric below our cut-off</strong>.</p>
            <p>The liquidity metrics themselves are currently not shown.</p>
            <p><Link to="/?s=Liquidity">View Liquid Markets</Link></p>
          </div>
        </div>
        <div id="target-liquidity" className="columns is-centered is-vcentered content">
          <div className="column is-12-mobile is-6-tablet is-6-desktop" >
              <h5 className="title is-5"><a href="#target-liquidity" style={{ color: 'black' }}><i className="fas fa-link" />&nbsp;</a> With "Sort By Liquidity", what is "Target Liquidity"?</h5>
            <p>To calculate each market's liquidity metric, we simulate a series of buys and sells into that market. The Target Liquidity is the <strong>budget in ETH for those simulated buys and sells.</strong></p>
            <p>Each market has <strong>one liquidity metric per Target Liquidity</strong>. For example, one market may have a liquidity metric <em>X</em> for a Target Liquidity of 10 ETH, but has a different liquidity metric <em>Y</em> for a Target Liquidity of 50 ETH.</p>
            <p>The Target Liquidity can be thought of as a <strong>trader's desired budget to spend on one market</strong>.</p>
            <p>We support multiple Target Liquidities because traders have different budgets.</p>
            {/* <p>Consider that a market may have high liquidity for a trader that wants to spend 10 ETH, ie. the trader can spend 10 ETH immediately with a narrow spread. But, this market may have low liquidity for a trader that wants to spend 50 ETH, because the existing orders on that market's order bookis that a market with that can support spending 10 ETH high liquity  </p> */}
            <p><Link to="/?s=Liquidity">View Liquid Markets</Link></p>
          </div>
        </div>
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
