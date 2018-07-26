import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

// https://reacttraining.com/react-router/web/guides/scroll-restoration
class ScrollToTop extends React.Component<RouteComponentProps<{}>> {
  public componentDidUpdate(prevProps: RouteComponentProps<{}>) {
    if (this.props.location !== prevProps.location) {
      // tslint:disable-next-line
      console.log(this.props.location, prevProps.location);
      window.scrollTo(0, 0);
    }
  }
  public render() {
    return this.props.children;
  }
}

export default withRouter(ScrollToTop)
