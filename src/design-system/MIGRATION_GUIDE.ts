// Design System - Migration Guide
// ==================================
// 
// Este arquivo documenta como migrar gradualmente para o Design System
// sem quebrar o sistema existente.
//
// 📋 IMPORTAÇÃO
// -------------
// Agora você pode importar de qualquer um dos caminhos abaixo:
// 
// 1. Importação direta (recomendado para novos códigos):
//    import { Button, Input, Card } from "@/components/ui";
//
// 2. Via adapters (para migração gradual):
//    import { DSButton, DSInput, DSCard } from "@/design-system/adapters";
//
// 3. Componentes individuais:
//    import { Button } from "@/design-system/components/Button";
//
//
// 🔄 SUBSTITUIÇÃO GRADUAL
// -----------------------
// Siga a ordem de prioridade:
//
// ETAPA 1: Botões
//   - <button className="bg-primary..."> → <Button variant="primary">
//   - <button className="border...">    → <Button variant="outline">
//
// ETAPA 2: Inputs  
//   - <input className="border rounded..."> → <Input />
//   - Adicione labels e validação automaticamente
//
// ETAPA 3: Selects
//   - <select className="border rounded..."> → <Select options={...} />
//
// ETAPA 4: Cards
//   - <div className="bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 border rounded-xl..."> → <Card />
//
//
// 🎨 VARIANTES DISPONÍVEIS
// -------------------------
// Button: variant="primary" | "secondary" | "outline" | "ghost" | "danger"
//         size="sm" | "md" | "lg"
//         loading={true | false}
//         icon={<Icon />}
//         iconPosition="left" | "right"
//
// Input:  label="Texto"
//         error="Mensagem de erro"
//         helperText="Texto de ajuda"
//         leftIcon={<Icon />}
//         rightIcon={<Icon />}
//
// Select: label="Texto"
//         error="Mensagem de erro"
//         options={[{ value: "1", label: "Opção 1" }]}
//         placeholder="Selecione..."
//
// Card:   padding="none" | "sm" | "md" | "lg"
//         hover={true | false}
//

// Exemplo de uso:
/*
import { Button, Input, Select, Card } from "@/components/ui";
import { Search, User } from "lucide-react";

const ExamplePage = () => {
  return (
    <Card padding="lg" hover>
      <CardHeader>
        <CardTitle>Meu Formulário</CardTitle>
        <CardDescription>Preencha os dados abaixo</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <Input 
            label="Nome" 
            placeholder="Digite seu nome"
            leftIcon={<User size={18} />}
          />
          
          <Input 
            label="Email" 
            type="email"
            error="Email inválido"
          />
          
          <Select 
            label="País"
            options={[
              { value: "br", label: "Brasil" },
              { value: "pt", label: "Portugal" }
            ]}
            placeholder="Selecione o país"
          />
        </div>
      </CardContent>
      
      <CardFooter>
        <Button variant="outline">Cancelar</Button>
        <Button variant="primary">Salvar</Button>
      </CardFooter>
    </Card>
  );
};
*/

export {};
