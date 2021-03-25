import React from 'react';
import { DevActions, ObjectView } from 'sys.ui.dev';

import { PeerNetworkController, PeerNetworkEvents } from '..';
import { Button, copyToClipboard, css, cuid, deleteUndefined, Icons, rx, t, time } from './common';
import { PeerInfo } from './DEV.PeerInfo';

type Ctx = {
  id: string;
  bus: t.EventBus<t.PeerNetworkEvent>;
  signal: string; // Network address.
  events: ReturnType<typeof PeerNetworkEvents>;
  connectTo?: string;
  reliable: boolean;
};

/**
 * Actions
 */
export const actions = DevActions<Ctx>()
  .namespace('sys.net/PeerNetwork')

  .context((prev) => {
    if (prev) return prev;

    const id = cuid();
    const bus = rx.bus<t.PeerNetworkEvent>();

    PeerNetworkController({ bus });
    const signal = 'rtc.cellfs.com/peer';
    const events = PeerNetworkEvents({ bus });

    time.delay(0, () => events.create(signal, { id }));

    return {
      id,
      bus,
      events,
      signal,
      reliable: false,
    };
  })

  .items((e) => {
    e.title('Environment');

    e.textbox((config) => {
      config
        .initial(config.ctx.signal)
        .title('Signal end-point:')
        .placeholder('host/path')
        .description('Format: `host/path`')
        .pipe((e) => {
          if (e.changing) e.ctx.signal = e.changing.next;
        });
    });

    e.hr();
  })

  .items((e) => {
    e.title('Events');

    e.button('fire: PeerNetwork/create', async (e) => {
      const { id, signal, events } = e.ctx;
      events.create(signal, { id });
    });

    e.button('fire: PeerNetwork/status:req', async (e) => {
      const ref = e.ctx.id;
      const data = deleteUndefined(await e.ctx.events.status(ref).get());
      e.button.description = (
        <ObjectView name={'status:res'} data={data} fontSize={10} expandLevel={1} />
      );
    });

    e.hr();

    e.title('Connect: Data');
    e.textbox((config) => {
      config
        .title('Remote network peer to connect to:')
        .placeholder('target <cuid>')
        .pipe((e) => {
          if (e.changing) e.ctx.connectTo = e.changing.next;
        });
    });

    e.boolean('reliable', (e) => {
      if (e.changing) e.ctx.reliable = e.changing.next;
      e.boolean.current = e.ctx.reliable;
    });

    e.button('fire: PeerNetwork/connect (data)', async (e) => {
      const { id, connectTo, events, reliable } = e.ctx;

      if (!connectTo) {
        e.button.description = '🐷 ERROR: Target network not specified';
        // return write('fail', { message: '🐷 Target network not specified (cuid)' });
      } else {
        const res = await events.connect(id, connectTo).data({ reliable });

        const name = res.error ? 'fail' : 'Success';
        const el = <ObjectView name={name} data={res} fontSize={10} expandLevel={1} />;
        e.button.description = el;

        // write(res.error ? 'fail' : 'Success', res);
      }
    });

    e.button('fire: PeerNetwork/connect (video)');

    e.hr();
  })

  .subject((e) => {
    const { id, bus } = e.ctx;

    const styles = {
      icon: {
        base: css({
          top: -5,
          position: 'relative',
          Flex: 'horizontal-center-center',
          fontSize: 11,
        }),
        image: { marginLeft: 8 },
      },
    };

    const elIcon = (
      <div {...styles.icon.base}>
        <Button onClick={() => copyToClipboard(id)}>{id} (copy)</Button>
        <Icons.Antenna size={20} style={styles.icon.image} />
      </div>
    );

    e.settings({
      layout: {
        label: { topLeft: 'PeerNetwork', topRight: elIcon },
        position: [150, 80],
        border: -0.1,
        cropmarks: -0.2,
        background: 1,
      },
      host: { background: -0.04 },
      actions: { width: 380 },
    });

    e.render(<PeerInfo id={id} bus={bus} />);
  });

export default actions;