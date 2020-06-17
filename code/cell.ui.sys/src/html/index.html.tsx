import '../config';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { t } from '../common';
import { Root } from '../components/Root';
import { context } from '../context';

const win = (window as unknown) as t.ITopWindow;
const env = win.env;
const { Provider } = context.create({ env });

const el = (
  <Provider>
    <Root />
  </Provider>
);

// const el = <Root env={env} uri={env.def} />;
ReactDOM.render(el, document.getElementById('root'));
