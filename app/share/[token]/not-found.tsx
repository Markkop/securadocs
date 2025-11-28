import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ShareNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="w-8 h-8 text-zinc-500" />
          </div>
          <CardTitle>Link não encontrado</CardTitle>
          <CardDescription>
            Este link de compartilhamento não existe ou foi removido pelo proprietário.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild variant="outline">
            <Link href="/">Ir para a página inicial</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
