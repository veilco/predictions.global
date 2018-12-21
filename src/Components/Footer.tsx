import * as React from 'react';
import { Link } from 'react-router-dom';
import { feedbackFormURL } from '../Components/Header';
import MarketCreatorSignup from '../MarketCreatorSignup';

const Footer = <footer className="footer">
  <div className="container">
    <div className="columns is-centered is-vcentered">
      <div className="column is-4">
        <div className="columns has-text-centered is-centered is-vcentered is-multiline content">
          <div className="column is-12 is-paddingless">
            <strong>Links</strong>
          </div>
          <div className="column is-12 is-paddingless">
            <a href="https://augur.net" target="_blank">Augur</a>
          </div>
          <div className="column is-12 is-paddingless">
            <a href="https://github.com/AugurProject/augur-app/releases" target="_blank">Download Augur App</a>
          </div>
          <div className="column is-12 is-paddingless">
            <a href="https://twitter.com/PredictionsGlbl" target="_blank">Twitter</a>
          </div>
          <div className="column is-12 is-paddingless">
            <Link to="/augur-public-ethereum-nodes">List of Public Ethereum Nodes</Link>
          </div>
          <div className="column is-12 is-paddingless">
            <Link to="/augur-reporter-fee-window-rep-profit-calculator">Augur Fee Window Info</Link>
          </div>
          <div className="column is-12 is-paddingless">
            <Link to="/augur-reporter-fee-window-rep-profit-calculator">REP Profit Calculator</Link>
          </div>
          <div className="column is-12 is-paddingless">
            <a href="https://veil.co">Veil</a>
          </div>
          <div className="column is-12 is-paddingless">
            <Link to="/faq">FAQ</Link>
          </div>
        </div>
      </div>
      <div className="column is-4 has-text-centered is-centered is-vcentered content">
        {/* TODO use something like Header.doesClickingLogoReloadPage so that clicking Footer logo doesn't always do a hard reload */}
        <a href="/"><img className="logo" src="/logo.png" /></a>
        <p><em>© 2018 Predictions.Global</em></p>
        <p><small>Built by Ryan Berckmans and Jorge Olivero</small></p>
      </div>
      <div className="column is-4 has-text-centered is-centered is-vcentered content">
        <div className="columns is-centered is-vcentered is-multiline">
          <div className="column is-12">
            <MarketCreatorSignup />
          </div>
          <div className="column is-12">
            <a href={feedbackFormURL} target="_blank">Send Feedback</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</footer>;

export default Footer;
