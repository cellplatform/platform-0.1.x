import React from 'react';

import { FsPathList } from './FsPathList';
import { FsPathListStatefulProps } from './types';
import { List } from './common';

/**
 * <PathList> with state configured.
 */
export const FsPathListStateful: React.FC<FsPathListStatefulProps> = (props) => {
  const { instance, dir, droppable, selectable, onStateChange } = props;

  const state = FsPathList.useState({ instance, dir, droppable, onStateChange });

  /**
   * TODO 🐷
   * - move within [PathList.useState]
   */

  const total = state.total;
  const dynamic = List.useDynamicState({ total, instance, orientation: 'y', selectable });

  return (
    <FsPathList
      instance={instance}
      files={state.files}
      state={dynamic.state}
      spinning={!state.ready}
      scroll={props.scroll}
      padding={props.padding}
      selectable={props.selectable}
      tabIndex={props.tabIndex}
      theme={props.theme}
      style={props.style}
      droppable={droppable}
      onDrop={state.onDrop}
    />
  );
};
