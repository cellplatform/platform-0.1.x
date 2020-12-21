import React from 'react';
import { css, CssValue, t, color } from '../../common';

export type ItemHrProps = {
  model: t.ActionItemHr;
  style?: CssValue;
};

export const ItemHr: React.FC<ItemHrProps> = (props) => {
  const { model } = props;

  const styles = {
    base: css({
      boxSizing: 'border-box',
      PaddingY: 4,
      PaddingX: 8,
    }),
    hr: css({
      height: model.height,
      backgroundColor: color.format(-0.06),
    }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      <div {...styles.hr} />
    </div>
  );
};
