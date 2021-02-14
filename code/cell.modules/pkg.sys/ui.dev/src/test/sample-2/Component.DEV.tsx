import React from 'react';

import { DevActions } from '../..';
import { Component } from './Component';

type Ctx = { count: number };

/**
 * Actions
 */
export const actions = DevActions<Ctx>()
  .namespace('sample-2')
  .context((prev) => prev || { count: 0 })

  .items((e) => {
    e.button('increment', (e) => e.ctx.count++);
    e.hr();
  })

  /**
   * Render
   */
  .subject((e) => {
    e.settings({
      layout: { width: 450, border: -0.1, cropmarks: -0.2, background: 1, label: 'sample-1' },
      host: { background: -0.04 },
    });
    e.render(<Component count={e.ctx.count} />);
  });

  export default actions;
