/**
 * Nextcloud WebDAV Storage Client
 * Provides file upload/download operations using WebDAV protocol
 */

export interface NextcloudConfig {
  url: string;
  user: string;
  password: string;
  webdavPath: string;
  baseDir: string;
}

function getConfig(): NextcloudConfig {
  const url = process.env.NEXTCLOUD_URL;
  const user = process.env.NEXTCLOUD_USER;
  const password = process.env.NEXTCLOUD_PASSWORD;
  const webdavPath = process.env.NEXTCLOUD_WEBDAV_PATH || "/remote.php/dav/files";
  const baseDir = process.env.NEXTCLOUD_BASE_DIR || "/SecuraDocs";

  if (!url || !user || !password) {
    throw new Error(
      "Nextcloud configuration incomplete. Please set NEXTCLOUD_URL, NEXTCLOUD_USER, and NEXTCLOUD_PASSWORD."
    );
  }

  return { url, user, password, webdavPath, baseDir };
}

function getAuthHeader(config: NextcloudConfig): string {
  return "Basic " + Buffer.from(`${config.user}:${config.password}`).toString("base64");
}

function buildWebDAVUrl(config: NextcloudConfig, path: string): string {
  // Ensure path starts with baseDir
  const fullPath = path.startsWith(config.baseDir) 
    ? path 
    : `${config.baseDir}/${path}`.replace(/\/+/g, "/");
  
  return `${config.url}${config.webdavPath}${fullPath}`;
}

/**
 * Ensure a directory exists, creating it if necessary
 */
async function ensureDirectory(config: NextcloudConfig, dirPath: string): Promise<void> {
  const url = buildWebDAVUrl(config, dirPath);
  console.log(`[Nextcloud] ensureDirectory: ${dirPath} -> ${url}`);
  
  try {
    // Try to create the directory (MKCOL)
    const response = await fetch(url, {
      method: "MKCOL",
      headers: {
        Authorization: getAuthHeader(config),
      },
    });

    console.log(`[Nextcloud] MKCOL response for ${dirPath}: ${response.status} ${response.statusText}`);

    // 201 = created, 405 = already exists, both are OK
    if (response.ok || response.status === 405) {
      return;
    }

    // 409 = parent doesn't exist, create it recursively
    if (response.status === 409) {
      const parentPath = dirPath.split("/").slice(0, -1).join("/");
      if (parentPath && parentPath !== config.baseDir) {
        await ensureDirectory(config, parentPath);
        // Retry creating this directory
        const retryResponse = await fetch(url, {
          method: "MKCOL",
          headers: {
            Authorization: getAuthHeader(config),
          },
        });
        console.log(`[Nextcloud] MKCOL retry response for ${dirPath}: ${retryResponse.status} ${retryResponse.statusText}`);
      }
    } else {
      const errorText = await response.text();
      console.warn(`[Nextcloud] Unexpected MKCOL response for ${dirPath}: ${response.status} - ${errorText.substring(0, 200)}`);
    }
  } catch (error) {
    console.warn(`[Nextcloud] Could not ensure directory ${dirPath}:`, error);
  }
}

export interface UploadResult {
  success: boolean;
  path?: string;
  error?: string;
}

/**
 * Upload a file to Nextcloud
 */
export async function uploadFile(
  storagePath: string,
  data: Buffer | Uint8Array,
  contentType: string
): Promise<UploadResult> {
  try {
    const config = getConfig();
    console.log(`[Nextcloud] Config: url=${config.url}, webdavPath=${config.webdavPath}, baseDir=${config.baseDir}`);
    
    // Ensure user directory exists
    const userDir = storagePath.split("/")[0];
    console.log(`[Nextcloud] Ensuring directory exists: ${userDir}`);
    await ensureDirectory(config, userDir);
    
    const url = buildWebDAVUrl(config, storagePath);
    console.log(`[Nextcloud] Uploading to: ${url}`);
    console.log(`[Nextcloud] Content-Type: ${contentType}, Data size: ${data.length} bytes`);

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: getAuthHeader(config),
        "Content-Type": contentType,
      },
      body: new Uint8Array(data),
    });

    console.log(`[Nextcloud] Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Nextcloud] Upload failed: ${response.status} - ${errorText.substring(0, 500)}`);
      return {
        success: false,
        error: `Upload failed: ${response.status} ${response.statusText}`,
      };
    }

    console.log(`[Nextcloud] Upload successful: ${storagePath}`);
    return {
      success: true,
      path: storagePath,
    };
  } catch (error) {
    console.error("[Nextcloud] Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown upload error",
    };
  }
}

export interface DownloadResult {
  success: boolean;
  data?: ArrayBuffer;
  error?: string;
}

/**
 * Download a file from Nextcloud
 */
export async function downloadFile(storagePath: string): Promise<DownloadResult> {
  try {
    const config = getConfig();
    const url = buildWebDAVUrl(config, storagePath);
    console.log(`[Nextcloud] Downloading from: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: getAuthHeader(config),
      },
    });

    if (!response.ok) {
      console.error(`[Nextcloud] Download failed: ${response.status}`);
      return {
        success: false,
        error: `Download failed: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.arrayBuffer();
    console.log(`[Nextcloud] Download successful: ${storagePath} (${data.byteLength} bytes)`);
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("[Nextcloud] Download error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown download error",
    };
  }
}

/**
 * Delete a file from Nextcloud
 */
export async function deleteFile(storagePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getConfig();
    const url = buildWebDAVUrl(config, storagePath);
    console.log(`[Nextcloud] Deleting: ${url}`);

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: getAuthHeader(config),
      },
    });

    if (!response.ok && response.status !== 404) {
      console.error(`[Nextcloud] Delete failed: ${response.status}`);
      return {
        success: false,
        error: `Delete failed: ${response.status} ${response.statusText}`,
      };
    }

    console.log(`[Nextcloud] Delete successful: ${storagePath}`);
    return { success: true };
  } catch (error) {
    console.error("[Nextcloud] Delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown delete error",
    };
  }
}

/**
 * Check if Nextcloud connection is working
 */
export async function checkConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const config = getConfig();
    const url = buildWebDAVUrl(config, "");
    
    const response = await fetch(url, {
      method: "PROPFIND",
      headers: {
        Authorization: getAuthHeader(config),
        Depth: "0",
      },
    });

    if (response.ok || response.status === 207) {
      return { connected: true };
    }

    return {
      connected: false,
      error: `Connection failed: ${response.status} ${response.statusText}`,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Connection error",
    };
  }
}
