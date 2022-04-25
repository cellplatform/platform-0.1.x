import { WebRuntime as Base } from 'sys.runtime.web';

import { useManifest, useModuleTarget } from './ui/hooks';
import { ManifestSelector, ManifestSelectorStateful } from './ui/Manifest.Selector';
import { ManifestSemver } from './ui/Manifest.Semver';
import { Module } from './ui/Module';
import { ModuleInfo } from './ui/Module.Info';

export const WebRuntimeUI = {
  useManifest,
  useModuleTarget,
  ManifestSelector,
  ManifestSelectorStateful,
  ManifestSemver,
  Module,
  ModuleInfo,
};

export const WebRuntime = {
  ...Base,
  ui: WebRuntimeUI,
};
