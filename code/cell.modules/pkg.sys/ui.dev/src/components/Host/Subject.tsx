import * as React from 'react';

import { css, defaultValue, formatColor, t } from '../../common';
import { Cropmarks } from './Cropmarks';
import { Labels } from './Labels';

export type SubjectCropmark = { size: number; margin: number };
export type SubjectProps = {
  cropmark: SubjectCropmark;
  layout: t.IDevHostedLayout;
};

/**
 * The hosted "subject" content.
 */
export const Subject: React.FC<SubjectProps> = (props) => {
  if (!props.children) return null;
  const { layout } = props;
  const { width, height } = layout;

  const styles = {
    children: css({
      WebkitAppRegion: 'none', // Hint for how to handle dragging within electron.
      position: 'relative',
      boxSizing: 'border-box',
      flex: 1,
      width,
      height,
    }),
  };

  return (
    <>
      <SubjectCropmarks {...props} />
      <Labels label={layout.label} />
      <div {...styles.children}>{props.children}</div>
    </>
  );
};

/**
 * Arrange cropmarks around the content.
 */
const SubjectCropmarks: React.FC<SubjectProps> = (props) => {
  const { layout } = props;
  const cropmarks = defaultValue(layout.cropmarks, true);
  if (!cropmarks) return null;

  const abs = layout.position;
  const color = formatColor(cropmarks === true ? 1 : cropmarks);

  const size = props.cropmark.size;
  const margin = props.cropmark.margin;
  const offset = size + margin;

  // Ensure the space surrounding an "absolute positioning" is
  // not less than offset space of the cropmarks.
  if (abs && Object.keys(abs).some((key) => abs[key] < offset)) return null;

  // Finish up.
  return <Cropmarks color={color} margin={margin} size={size} />;
};