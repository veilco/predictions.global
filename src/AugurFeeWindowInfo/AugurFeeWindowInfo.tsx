import * as React from 'react';
import {Observer} from '../observer';
import {Currency} from '../Currency';
import {ParticipationRentabilityCalculator} from "./ParticipationRentabilityCalculator";
import Header from '../Header';
import Footer from '../Footer';
import {MarketsSummary} from '../generated/markets_pb';
import {AugurFeeWindows} from "./AugurFeeWindows";

interface Props<T> {
  ms: MarketsSummary
  currencySelectionObserver: Observer<Currency>,
}

export class AugurFeeWindowInfo<T> extends React.Component<Props<T>> {
  public constructor(props: Props<T>) {
    super(props);
  }

  public render() {
    const {
      ms,
      currencySelectionObserver,
    } = this.props;

    return (
      <div>
        <Header ms={ms} currencySelectionObserver={currencySelectionObserver} headerContent=""
                doesClickingLogoReloadPage={true}/>
        <AugurFeeWindows/>
        <ParticipationRentabilityCalculator/>
        { Footer }
      </div>
    );
  }
}