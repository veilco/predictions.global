import * as React from 'react';
import { feedbackFormURL } from './Header';

const Footer = <footer className="footer">
  <div className="container">
    <div className="columns is-centered is-vcentered">
      <div className="column is-4">
        <div className="columns has-text-centered is-centered is-vcentered is-multiline content">
          <div className="column is-12 is-paddingless">
            <strong>Links</strong>
          </div>
          <div className="column is-12 is-paddingless">
            <a href="https://augur.net" target="blank">Augur</a>
          </div>
          <div className="column is-12 is-paddingless">
            <a href="https://github.com/AugurProject/augur-app/releases" target="blank">Download Augur App</a>
          </div>
          <div className="column is-12 is-paddingless">
            <a href="https://twitter.com/PredictionsGlbl" target="blank">Twitter</a>
          </div>
        </div>
      </div>
      <div className="column is-4 has-text-centered is-centered is-vcentered content">
        <img className="logo" src="logo.png" />
        <p><em>© 2018 Predictions.Global</em></p>
      </div>
      <div className="column is-4 has-text-centered is-centered is-vcentered content">
        <a href={feedbackFormURL} target="blank">Send Feedback</a>
      </div>
    </div>
  </div>
</footer>;

export default Footer;
