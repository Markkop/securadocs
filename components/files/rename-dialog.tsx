"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: "file" | "folder";
  resourceId: string;
  currentName: string;
  onRenameComplete?: () => void;
}

export function RenameDialog({
  open,
  onOpenChange,
  resourceType,
  resourceId,
  currentName,
  onRenameComplete,
}: RenameDialogProps) {
  const [name, setName] = useState(currentName);
  const [isRenaming, setIsRenaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setName(currentName);
      setError(null);
    }
  }, [open, currentName]);

  const handleRename = async () => {
    if (!name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    if (name.trim() === currentName) {
      onOpenChange(false);
      return;
    }

    setIsRenaming(true);
    setError(null);

    try {
      const endpoint =
        resourceType === "file"
          ? `/api/files/${resourceId}/rename`
          : `/api/folders/${resourceId}/rename`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao renomear");
      }

      onOpenChange(false);
      onRenameComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao renomear");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isRenaming) {
      e.preventDefault();
      handleRename();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Renomear {resourceType === "file" ? "arquivo" : "pasta"}
          </DialogTitle>
          <DialogDescription>
            Digite o novo nome para &quot;{currentName}&quot;
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Novo nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRenaming}
            autoFocus
          />
          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRenaming}
          >
            Cancelar
          </Button>
          <Button onClick={handleRename} disabled={isRenaming}>
            {isRenaming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Renomeando...
              </>
            ) : (
              "Renomear"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
