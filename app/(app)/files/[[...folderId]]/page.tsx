"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { FileUpload } from "@/components/files/file-upload";
import { FileList } from "@/components/files/file-list";
import { Breadcrumbs } from "@/components/files/breadcrumbs";
import { CreateFolderDialog } from "@/components/files/create-folder-dialog";
import { SearchBox } from "@/components/files/search-box";

export default function FilesPage() {
  const params = useParams();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Extract folderId from catch-all route params
  // params.folderId will be undefined for root, or an array like ["uuid"] for a folder
  const folderIdArray = params.folderId as string[] | undefined;
  const currentFolderId = folderIdArray?.[0] || null;

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleFolderCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Meus Arquivos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus arquivos e pastas
          </p>
        </div>
        <SearchBox />
      </div>

      {/* Breadcrumbs for navigation */}
      <div className="mb-6">
        <Breadcrumbs currentFolderId={currentFolderId} />
      </div>

      <div className="space-y-6">
        {/* Actions bar */}
        <div className="flex items-center gap-3">
          <CreateFolderDialog
            parentFolderId={currentFolderId}
            onFolderCreated={handleFolderCreated}
          />
        </div>

        {/* Upload section */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Upload</h2>
          <FileUpload
            folderId={currentFolderId}
            onUploadComplete={handleUploadComplete}
          />
        </div>

        {/* Files and folders list */}
        <div>
          <FileList
            folderId={currentFolderId}
            refreshTrigger={refreshTrigger}
            onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
          />
        </div>
      </div>
    </div>
  );
}
