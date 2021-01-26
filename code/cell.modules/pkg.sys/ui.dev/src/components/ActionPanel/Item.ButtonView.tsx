import React, { useState } from 'react';

import { COLORS, constants, css, CssValue, t } from '../../common';
import { Icons } from '../Icons';

/**
 * The button view, with no smarts about the event bus.
 */
export type ButtonViewProps = {
  label: React.ReactNode;
  description?: React.ReactNode;
  isActive: boolean;
  icon?: t.IIcon;
  right?: React.ReactNode;
  style?: CssValue;
  onClick?: () => void;
};
export const ButtonView: React.FC<ButtonViewProps> = (props) => {
  const { isActive, label, description, onClick } = props;
  const [isOver, setIsOver] = useState<boolean>(false);
  const [isDown, setIsDown] = useState<boolean>(false);

  const styles = {
    base: css({
      position: 'relative',
      boxSizing: 'border-box',
      color: COLORS.DARK,
    }),
    main: css({
      Flex: 'horizontal-stretch-stretch',
      PaddingY: 2,
      paddingLeft: 12,
      paddingRight: 15,
      cursor: isActive ? 'pointer' : 'default',
      opacity: isActive ? 1 : 0.4,
    }),
    icon: css({
      opacity: isOver ? 1 : 0.4,
      width: 20,
    }),
    body: css({
      flex: 1,
      marginLeft: 6,
      marginTop: 5,
      overflow: 'hidden',
      transform: isDown ? `translateY(1px)` : undefined,
    }),
    label: css({
      width: '100%',
      fontFamily: constants.FONT.MONO,
      color: isOver ? COLORS.BLUE : COLORS.DARK,
      opacity: isActive ? 1 : 0.6,
      fontSize: 12,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }),
    description: css({
      fontSize: 11,
      marginTop: 4,
      opacity: 0.6,
    }),
  };

  const overHandler = (isOver: boolean) => () => {
    if (isActive) {
      setIsOver(isOver);
      if (!isOver) setIsDown(false);
    }
  };

  const clickHandler = (isDown: boolean) => (e: React.MouseEvent) => {
    if (isActive && e.button === 0) {
      setIsDown(isDown);
      if (isDown && onClick) onClick();
    }
  };

  const Icon = props.icon || Icons.Variable;

  return (
    <div {...css(styles.base, props.style)}>
      <div
        {...styles.main}
        onMouseEnter={overHandler(true)}
        onMouseLeave={overHandler(false)}
        onMouseDown={clickHandler(true)}
        onMouseUp={clickHandler(false)}
      >
        <Icon color={isOver ? COLORS.BLUE : COLORS.DARK} size={20} style={styles.icon} />
        <div {...styles.body}>
          <div {...styles.label}>{label || 'Unnamed'}</div>
          {description && <div {...styles.description}>{description}</div>}
        </div>
        {props.right}
      </div>
    </div>
  );
};