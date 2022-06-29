import React from 'react';

import { Font } from '../Font';
import { css, FC, CssValue, FONT } from './common';

export type DocFontProps = { style?: CssValue };

const View: React.FC<DocFontProps> = (props) => {
  const fonts = [FONT.NEUTON.REGULAR, FONT.NEUTON.ITALIC];

  const styles = {
    base: css({
      position: 'relative',
      display: 'flex',
    }),
  };

  return (
    <Font.Container fonts={fonts} style={css(styles.base, props.style)}>
      {props.children}
    </Font.Container>
  );
};

/**
 * Export
 */
type Fields = { FONT: typeof FONT };
export const DocFonts = FC.decorate<DocFontProps, Fields>(
  View,
  { FONT },
  { displayName: 'Doc.Fonts' },
);