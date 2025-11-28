"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface FileUploadProps {
  folderId?: string | null;
  onUploadComplete?: () => void;
}

export function FileUpload({ folderId, onUploadComplete }: FileUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setStatus("idle");
      setErrorMessage(null);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        setSelectedFile(files[0]);
        setStatus("idle");
        setErrorMessage(null);
      }
    },
    []
  );

  const uploadFile = async () => {
    if (!selectedFile) return;

    setStatus("uploading");
    setProgress(0);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (folderId) {
        formData.append("folderId", folderId);
      }

      // Simular progresso (XHR não é usado para simplificar)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload");
      }

      setProgress(100);
      setStatus("success");
      setSelectedFile(null);
      toast.success("Arquivo enviado com sucesso!");

      // Notificar que o upload foi concluído
      if (onUploadComplete) {
        setTimeout(() => {
          onUploadComplete();
          setStatus("idle");
          setProgress(0);
        }, 1500);
      }
    } catch (error) {
      setStatus("error");
      const message = error instanceof Error ? error.message : "Erro ao fazer upload";
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setStatus("idle");
    setProgress(0);
    setErrorMessage(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="p-6">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-zinc-300 dark:border-zinc-700"}
          ${status === "success" ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}
          ${status === "error" ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Only show overlay input when no file is selected and idle state */}
        {status === "idle" && !selectedFile && (
          <input
            ref={inputRef}
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileSelect}
          />
        )}

        {status === "idle" && !selectedFile && (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Upload className="w-6 h-6 text-zinc-500" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Arraste e solte um arquivo aqui
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ou clique para selecionar
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Máximo 50MB • PDF, imagens, documentos Office, texto
            </p>
          </div>
        )}

        {selectedFile && status === "idle" && (
          <div className="space-y-4 relative z-20">
            <div className="flex items-center justify-center gap-3">
              <div className="text-left">
                <p className="text-sm font-medium truncate max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                uploadFile();
              }}
            >
              Fazer Upload
            </Button>
          </div>
        )}

        {status === "uploading" && (
          <div className="space-y-4 relative z-20">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
            <div>
              <p className="text-sm font-medium">Enviando arquivo...</p>
              <div className="mt-2 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-2 relative z-20">
            <CheckCircle className="w-8 h-8 mx-auto text-green-500" />
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Upload concluído com sucesso!
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 relative z-20">
            <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Erro no upload
              </p>
              {errorMessage && (
                <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
            >
              Tentar novamente
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
