import React from 'react';
import { Hr } from 'sys.ui.primitives/lib/components/Hr';

import { css, CssValue, t } from '../common';
import { useDevGroupController, useDevLocalController } from '../hook';
import { DevNetworkConnections } from './DEV.Network.Connections';
import { DevNetworkHeader } from './DEV.Network.Header';

export type DevNetworkProps = {
  bus: t.EventBus<any>;
  netbus: t.NetBus<any>;
  peer: t.PeerStatus;
  media: { video?: MediaStream; screen?: MediaStream };
  collapse?: boolean | { data?: boolean; media?: boolean };
  cards?: { data?: boolean; media?: boolean };
  style?: CssValue;
};

export const DevNetwork: React.FC<DevNetworkProps> = (props) => {
  const { peer, media, netbus } = props;
  const bus = props.bus.type<t.PeerEvent>();

  const local = useDevLocalController({ bus });
  const group = useDevGroupController({ bus, netbus });

  const styles = {
    base: css({
      flex: 1,
      Flex: 'vertical-stretch-stretch',
      boxSizing: 'border-box',
      position: 'relative',
      fontSize: 14,
    }),
    body: css({ flex: 1, position: 'relative' }),
    modal: css({ Absolute: 0, display: 'flex' }),
  };

  const modalSize = local.modal?.target;
  const elModal = local.modal?.el && <div {...styles.modal}>{local.modal.el}</div>;

  const elBody = (
    <div {...styles.body}>
      <DevNetworkConnections
        bus={bus}
        netbus={netbus}
        collapse={props.collapse}
        cards={props.cards}
        showNetbus={true}
      />
      {modalSize === 'body' && elModal}
    </div>
  );

  return (
    <div {...css(styles.base, props.style)}>
      <DevNetworkHeader bus={bus} netbus={netbus} peer={peer} media={media} />
      <Hr thickness={10} opacity={0.05} margin={0} />
      {elBody}
      {modalSize === 'fullscreen' && elModal}
    </div>
  );
};
