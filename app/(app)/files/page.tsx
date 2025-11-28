"use client";

import { useState } from "react";
import { FileUpload } from "@/components/files/file-upload";
import { FileList } from "@/components/files/file-list";

export default function FilesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Meus Arquivos</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seus arquivos e pastas
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Upload</h2>
          <FileUpload onUploadComplete={handleUploadComplete} />
        </div>

        <div>
          <FileList refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}
