import React from 'react';
import { CssValue, t } from '../../common';
import { PropList, PropListItem } from '../../PropList';

export type DevSampleProplistProps = {
  id: string;
  info?: t.PositioningLayerInfo;
  overlaps: t.PositioningLayerOverlapInfo[];
  style?: CssValue;
};

export const DevSampleProplist: React.FC<DevSampleProplistProps> = (props) => {
  const { info, id, overlaps } = props;
  const items = toList({ id, info, overlaps });
  return <PropList items={items} defaults={{ clipboard: false, monospace: true }} />;
};

/**
 * [Helpers]
 */

function toList(args: {
  id: string;
  info?: t.PositioningLayerInfo;
  overlaps: t.PositioningLayerOverlapInfo[];
}) {
  const { id, info, overlaps } = args;
  const index = info ? `${info.index}` : '?';
  const list: PropListItem[] = [{ label: `layer-${index}`, value: `id:"${id}"` }];

  if (info) {
    const { position, size } = info;
    list.push(
      ...[
        { label: 'position (x, y)', value: `${position.x} ${position.y}` },
        { label: 'size', value: `x:${size.x} y:${size.y}, ${size.width}x${size.height}px` },
      ],
    );

    overlaps.forEach((overlap) => {
      const { index, x, y } = overlap;
      list.push({
        label: `overlaps with: layer-${index}`,
        value: `${x ? 'x' : ''}${y ? 'y' : ''}`,
      });
    });
  }

  return list;
}