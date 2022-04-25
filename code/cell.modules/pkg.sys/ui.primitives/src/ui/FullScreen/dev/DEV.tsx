import React from 'react';
import { DevActions, ObjectView } from 'sys.ui.dev';
import { FullScreen, FullScreenProps } from '..';

type Ctx = { props: FullScreenProps };

/**
 * Actions
 */
export const actions = DevActions<Ctx>()
  .namespace('ui.FullScreen')
  .context((e) => {
    if (e.prev) return e.prev;
    const ctx: Ctx = { props: {} };
    return ctx;
  })

  .init(async (e) => {
    const { ctx, bus } = e;
  })

  .items((e) => {
    e.title('Dev');

    e.hr();

    e.component((e) => {
      return (
        <ObjectView
          name={'props'}
          data={e.ctx.props}
          style={{ MarginX: 15 }}
          fontSize={10}
          expandPaths={['$']}
        />
      );
    });
  })

  .subject((e) => {
    e.settings({
      host: { background: -0.04 },
      layout: {
        label: '<FullScreen>',
        position: [150, 80],
        border: -0.1,
        cropmarks: -0.2,
        background: 1,
      },
    });
    e.render(<FullScreen {...e.ctx.props} style={{ flex: 1 }} />);
  });

export default actions;
