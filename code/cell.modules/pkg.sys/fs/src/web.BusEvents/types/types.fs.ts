import { t } from './common';

type FilesystemId = string;
type FilePath = string;
type DirPath = string;

export type SysFsInfo = {
  id: FilesystemId;
  dir: DirPath; // The root directory of the file-system scope.
};

export type SysFsFileInfo = {
  path: FilePath;
  exists: boolean | null;
  hash: string;
  bytes: number;
  error?: t.SysFsError;
};

export type SysFsFile = { path: FilePath; data: Uint8Array; hash: string };
export type SysFsFileTarget = { source: FilePath; target: FilePath };

export type SysFsFileReadResponse = { file?: SysFsFile; error?: t.SysFsError };
export type SysFsFileWriteResponse = { path: FilePath; error?: t.SysFsError };
export type SysFsFileDeleteResponse = { path: FilePath; error?: t.SysFsError };
export type SysFsFileCopyResponse = { source: FilePath; target: FilePath; error?: t.SysFsError };
export type SysFsFileMoveResponse = { source: FilePath; target: FilePath; error?: t.SysFsError };

export type SysFsReadResponse = { files: SysFsFileReadResponse[]; error?: t.SysFsError };
export type SysFsWriteResponse = { files: SysFsFileWriteResponse[]; error?: t.SysFsError };
export type SysFsDeleteResponse = { files: SysFsFileDeleteResponse[]; error?: t.SysFsError };
export type SysFsCopyResponse = { files: SysFsFileCopyResponse[]; error?: t.SysFsError };
export type SysFsMoveResponse = { files: SysFsFileMoveResponse[]; error?: t.SysFsError };