import * as React from 'react';

const marketCreatorBetaSignupFormURL = "https://docs.google.com/forms/d/e/1FAIpQLSdMslhaJfvTLK5MDkQWxyWmwkL28lpNdxznnZuDuJqr65UOZg/viewform?usp=sf_link";


const MarketCreatorSignup: React.SFC<{}> = (_) => {
  return <a href={marketCreatorBetaSignupFormURL} target="blank">
    <div className="market-creator-signup red-3 content">
      <strong>Want Market Creator Tools?</strong>
    </div>
  </a>;
}

export default MarketCreatorSignup;
