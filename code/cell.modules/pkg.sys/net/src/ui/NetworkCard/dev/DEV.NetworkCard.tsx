import React from 'react';

import { NetworkCard } from '../NetworkCard';
import { DevCardPlaceholder } from './DEV.Card.Placeholder';
import { DevChild } from './DEV.Child';
import { CssValue, t } from './DEV.common';
import { useDevController } from './DEV.useController';

export type DevNetworkCardProps = {
  instance: { network: t.PeerNetwork; id: t.Id };
  child?: t.DevChildKind;
  style?: CssValue;
};

export const DevNetworkCard: React.FC<DevNetworkCardProps> = (props) => {
  const { instance } = props;

  const defaultChild = <DevCardPlaceholder style={{ flex: 1 }} />;
  const ctrl = useDevController({ instance, defaultChild });
  const elChild = props.child && <DevChild instance={instance} kind={props.child} />;

  return <NetworkCard instance={instance} child={elChild || ctrl.child} style={props.style} />;
};