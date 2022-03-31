import React from 'react';
import { Harness } from 'sys.ui.dev';
import { t } from './common';

const imports = {
  ModuleInfo: import('./web.ui/ModuleInfo/dev/DEV'),
  ManifestSelector: import('./web.ui/Manifest.Selector/dev/DEV'),
  ManifestSemver: import('./web.ui/Manifest.Semver/dev/DEV'),
  Module: import('./web.ui/Module/dev/DEV'),

  useManifest: import('./web.ui/useManifest/dev/DEV'),
  useModuleTarget: import('./web.ui/useModuleTarget/dev/DEV'),
  useModule: import('./web.ui/useModule/dev/DEV'),

  UnitTests: import('./Dev.UnitTests'),
};

/**
 * UI Harness (Dev)
 */
type Props = { bus?: t.EventBus };

export const DevHarness: React.FC<Props> = (props) => {
  return <Harness bus={props.bus} actions={Object.values(imports)} showActions={true} />;
};

export default DevHarness;