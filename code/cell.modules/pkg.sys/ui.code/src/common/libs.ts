import { equals } from 'ramda';
export const R = { equals };

/**
 * @platform
 */
export { css, CssValue, CssProps, color, Color } from '@platform/css';
export { WebRuntime } from '@platform/cell.runtime.web/lib/WebRuntime';
export { http } from '@platform/http';
export { log } from '@platform/log/lib/client';
export { Uri, Schema } from '@platform/cell.schema';
export { StateObject } from '@platform/state';
export { HttpClient } from '@platform/cell.client';
export { time, rx, slug, deleteUndefined } from '@platform/util.value';
export { FC } from '@platform/react';
export { Markdown } from '@platform/util.markdown';
export { Http } from '@platform/http';

/**
 * @system
 */
export { IpcBus } from 'sys.runtime.electron';
export { Filesystem, Filesize } from 'sys.fs';
export { ObjectView } from 'sys.ui.primitives/lib/ui/ObjectView';
export { PropList } from 'sys.ui.primitives/lib/ui/PropList';
export { HashChip } from 'sys.ui.primitives/lib/ui/HashChip';
