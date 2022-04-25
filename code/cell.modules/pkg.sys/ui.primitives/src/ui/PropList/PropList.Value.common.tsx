import React from 'react';

import { COLORS, css } from './common';
import { Icons } from '../Icons';

/**
 * Copy icon.
 */
export const CopyIcon: React.FC = () => {
  const styles = {
    base: css({
      Absolute: [0, -12, null, null],
      opacity: 0.8,
    }),
  };
  return <Icons.Copy style={styles.base} color={COLORS.BLUE} size={12} />;
};
