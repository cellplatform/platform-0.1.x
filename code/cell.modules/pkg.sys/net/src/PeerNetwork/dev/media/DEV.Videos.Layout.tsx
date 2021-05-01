import React, { useEffect, useRef, useState } from 'react';
import { color, css, CssValue, t, rx, PeerNetwork } from '../common';
import { DevVideo } from './DEV.Video';
import { useLocalPeer } from '../../hook';

import {
  MotionDraggable,
  MotionDraggableItem,
  MotionDraggableEvent,
} from 'sys.ui.primitives/lib/components/Draggable.Motion';

export type DevVideosLayoutProps = {
  self: t.PeerId;
  bus: t.EventBus<any>;
  style?: CssValue;
};

export const DevVideosLayout: React.FC<DevVideosLayoutProps> = (props) => {
  const { self, bus } = props;

  const local = useLocalPeer({ self, bus });
  const [dragBus, setDragBus] = useState<t.EventBus<any>>();

  useEffect(() => {
    const events = PeerNetwork.Events(bus);
    const dragBus = rx.bus<MotionDraggableEvent>();
    const dragEvents = MotionDraggable.Events(dragBus);
    setDragBus(dragBus);

    // Ensure local video is open.
    events.media(self).video();

    return () => {
      events.dispose();
      dragEvents.dispose();
    };
  }, []); // eslint-disable-line

  const styles = {
    base: css({ flex: 1, backgroundColor: color.format(1) }),
    draggable: css({ Absolute: 20 }),
  };

  const items: MotionDraggableItem[] = [];

  const addVideo = (stream?: MediaStream) => {
    if (!stream) return;
    const el = <DevVideo bus={bus} kind={'media/video'} stream={stream} />;
    items.push({ width: 150, height: 160, el });
  };

  addVideo(local.media.video);
  local.connections
    .filter((e) => e.kind === 'media/video')
    .map((e) => e as t.PeerConnectionMediaStatus)
    .forEach((e) => addVideo(e.media));

  return (
    <div {...css(styles.base, props.style)}>
      {dragBus && <MotionDraggable bus={dragBus} style={styles.draggable} items={items} />}
    </div>
  );
};
