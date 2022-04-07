import React from 'react';

import { css, CssValue, t, useResizeObserver } from '../common';
import { BackdropMemo } from './Backdrop';
import { BodyMemo } from './Body';

/**
 * Types
 */
export type CmdCardLayoutProps = {
  instance: t.CmdCardInstance;
  state: t.CmdCardState;
  borderRadius?: number | string;
  resize?: t.ResizeObserverHook;
  style?: CssValue;
};

/**
 * Component
 */
export const CmdCardLayout: React.FC<CmdCardLayoutProps> = (props) => {
  const { instance, state, borderRadius } = props;
  const resize = useResizeObserver({ root: props.resize });
  const size = resize.rect;

  /**
   * [Render]
   */
  const styles = {
    base: css({ position: 'relative', overflow: 'hidden', borderRadius }),
    body: css({ Absolute: 0 }),
    backdrop: css({ Absolute: 0 }),
  };

  const elBody = resize.ready && (
    <BodyMemo instance={instance} state={state} size={size} style={styles.body} />
  );

  const elBackdrop = resize.ready && (
    <BackdropMemo instance={instance} state={state} size={size} style={styles.backdrop} />
  );

  return (
    <div ref={resize.ref} {...css(styles.base, props.style)}>
      {elBackdrop}
      {elBody}
    </div>
  );
};