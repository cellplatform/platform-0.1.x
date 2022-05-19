import React from 'react';

import { t, Chip } from '../../common';
import { DEFAULT } from '../constants';
import * as k from '../types';

type P = t.PropListItem;

export function toHash(args: { manifest: t.ModuleManifest; field: k.ModuleInfoFields }): P {
  const { manifest, field } = args;

  let label = 'hash';
  if (field === 'hash.files') label = 'files hash';
  if (field === 'hash.module') label = 'module hash';

  const key = field.split('.')[1];
  const hash = manifest.hash[key];
  const data = <Chip.Hash text={hash} icon={false} length={DEFAULT.HASH_CHIP_LENGTH} />;

  return {
    label,
    value: { data, clipboard: false },
  };
}
