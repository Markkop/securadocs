import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FilesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meus Arquivos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus arquivos e pastas
          </p>
        </div>
        <Button>Nova Pasta</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Arquivos</CardTitle>
          <CardDescription>
            Você ainda não tem arquivos. Faça upload para começar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhum arquivo encontrado
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
