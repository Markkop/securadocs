/**
 * Storage Client - Nextcloud WebDAV
 * 
 * This file provides the storage abstraction for SecuraDocs.
 * Using Nextcloud with WebDAV protocol for self-hosted deployments.
 */

// Re-export all Nextcloud functions
export {
  uploadFile,
  downloadFile,
  deleteFile,
  checkConnection,
} from "./nextcloud";
