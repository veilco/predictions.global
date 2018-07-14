import * as moment from 'moment';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Routes} from './Routes';
import './index.css';
import registerServiceWorker from './registerServiceWorker';

// window.DATA_URI is set index.html from the environment
// variable REACT_APP_DATA_URI. This allows the dataURI to
// vary based on build environment (eg. dev, staging, prod).

registerServiceWorker();

ReactDOM.render(<Routes/>, document.getElementById('root') as HTMLElement);
