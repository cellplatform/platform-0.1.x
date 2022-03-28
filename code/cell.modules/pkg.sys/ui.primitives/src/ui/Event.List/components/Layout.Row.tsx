import React from 'react';

import { Bullet } from '../../Bullet';
import { CONSTANTS, css, CssValue, t } from '../common';
import { CountLabel } from './Label.Count';
import { TypeLabel } from './Label.Type';

const { ROW } = CONSTANTS;
type D = t.EventHistoryItem;

export type EventListRowProps = {
  index: number;
  data: D;
  is: { first: boolean; last: boolean; selected: boolean; down: boolean };
  style?: CssValue;
  onClick?: (e: { index: number; data: D }) => void;
};

export const EventListRow: React.FC<EventListRowProps> = (props) => {
  const { index, data, is } = props;

  /**
   * [Render]
   */
  const styles = {
    base: css({
      position: 'relative',
      height: ROW.HEIGHT,
      fontSize: 12,
      backgroundColor: is.selected ? 'rgba(255, 0, 0, 0.1)' /* RED */ : undefined,
    }),
    body: css({
      Flex: 'x-stretch-center',
      boxSizing: 'border-box',
      paddingRight: 15,
      transform: is.down ? `translateY(1px)` : undefined,
    }),
    dot: css({
      Flex: 'y-center-center',
      marginRight: 6,
    }),
    label: css({
      flex: 1,
    }),
    right: css({}),
  };

  return (
    <div {...css(styles.base, props.style)}>
      <div {...styles.body}>
        <div {...styles.dot}>
          <Bullet
            size={6}
            body={{
              radius: 15,
              borderColor: -0.2,
              backgroundColor: 1,
            }}
          />
        </div>
        <TypeLabel
          text={data.event.type}
          style={styles.label}
          onClick={(e) => props.onClick?.({ index, data })}
        />
        <CountLabel count={data.count} style={styles.right} />
      </div>
    </div>
  );
};
