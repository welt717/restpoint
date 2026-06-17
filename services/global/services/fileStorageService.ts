/**
 * Global File Storage Service
 * 
 * Re-export from shared-services package for backward compatibility.
 * This file exists at the legacy path `services/global/services/fileStorageService.ts`
 * and re-exports from `packages/shared-services/src/fileStorageService.ts`.
 */

export {
  fileStorageService,
  FolderCategory,
  FileType,
  default
} from '../../packages/shared-services/src/fileStorageService';

export type {
  UploadConfig,
  UploadedFile,
  TenantFolderInfo,
  MulterFile
} from '../../packages/shared-services/src/fileStorageService';