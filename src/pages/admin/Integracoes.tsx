// FINQZ PRO - Integrações Page
import React, { useState } from "react";
import { Key, ExternalLink, Check, X, RefreshCw, Loader2 } from "lucide-react";
import { Button, Input } from "../../components/ui";
import { PageHeader } from "../../components/layout/PageHeader";
import { client } from "../../api/client";

interface Integracao {
  id: string;
  nome: string;
  descricao: string;
  status: 'conectado' | 'desconectado' | 'erro';
  logo?: string;
}

interface StormTestResult {
  success: boolean;
  provider: string;
  message: string;
  checkedAt: string;
}

interface Integracao {
  id: string;
  nome: string;
  descricao: string;
  status: 'conectado' | 'desconectado' | 'erro';
  logo?: string;
}

export const IntegracoesPage: React.FC = () => {
  const [integracoes, setIntegracoes] = useState<Integracao[]>([
    { id: 'whatsapp', nome: 'WhatsApp Business', descricao: 'Conecte seu número do WhatsApp Business para enviar mensagens automáticas', status: 'conectado' },
    { id: 'email', nome: 'E-mail SMTP', descricao: 'Configure servidor de e-mail para envio de mensagens', status: 'desconectado' },
    { id: 'zapier', nome: 'Zapier', descricao: 'Conecte com mais de 5000 aplicativos', status: 'desconectado' },
    { id: 'webhook', nome: 'Webhooks', descricao: 'Configure webhooks para receber notificações em tempo real', status: 'conectado' },
    { id: 'api', nome: 'API REST', descricao: 'Acesse nossa API para integrações personalizadas', status: 'conectado' },
    { id: 's3', nome: 'Amazon S3', descricao: 'Armazenamento de arquivos na nuvem', status: 'desconectado' },
    { id: 'storm', nome: 'NOVA PROMOTORA / Storm', descricao: 'Integração com sistema Storm para envio de propostas e sync de comissões', status: 'desconectado' },
  ]);

  const [apiKey, setApiKey] = useState('');
  const [stormTesting, setStormTesting] = useState(false);
  const [stormResult, setStormResult] = useState<StormTestResult | null>(null);

  // Testar conexão com Storm
  const testStormConnection = async () => {
    setStormTesting(true);
    setStormResult(null);
    
    try {
      const response = await client.post('/api/integrations/storm/test-connection', {});
      const data = response.data;
      setStormResult(data);
      
      // Atualizar status na lista
      setIntegracoes(integracoes.map(i => 
        i.id === 'storm' ? { ...i, status: data.success ? 'conectado' : 'erro' } : i
      ));
    } catch (error) {
      setStormResult({
        success: false,
        provider: 'storm',
        message: 'Erro ao conectar com o servidor',
        checkedAt: new Date().toISOString(),
      });
      setIntegracoes(integracoes.map(i => 
        i.id === 'storm' ? { ...i, status: 'erro' } : i
      ));
    } finally {
      setStormTesting(false);
    }
  };

  const toggleIntegracao = (id: string) => {
    setIntegracoes(integracoes.map(i => 
      i.id === id ? { ...i, status: i.status === 'conectado' ? 'desconectado' : 'conectado' } : i
    ));
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(integracoes, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `integracoes_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrações"
        subtitle="Gerencie integrações com serviços externos"
        onRefresh={() => {}}
        onImport={() => alert('Funcionalidade de importação em desenvolvimento')}
        importLabel="Importar"
        onExport={handleExport}
        exportLabel="Exportar"
        exportData={integracoes}
        exportColumns={[{ key: 'nome', label: 'Nome' }, { key: 'status', label: 'Status' }]}
        exportFilename="integracoes"
      />
      
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Configurações de Integrações</h3>
          
          {/* API Key */}
          <div className="bg-gray-50 rounded-xl p-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Chave API</label>
            <div className="flex gap-2">
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Cole sua chave API aqui..."
                className="flex-1"
              />
              <Button>Salvar</Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Sua chave API é usada para autenticar requisições externas. Mantenha em segurança.
            </p>
          </div>

          {/* Lista de Integrações */}
          <div className="grid gap-4">
            {integracoes.map((integracao) => (
              <div key={integracao.id} className="border border-[#1f2937] rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white">{integracao.nome}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        integracao.status === 'conectado' ? 'bg-green-100 text-green-700' : 
                        integracao.status === 'erro' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-slate-500'
                      }`}>
                        {integracao.status === 'conectado' ? 'Conectado' : 
                         integracao.status === 'erro' ? 'Erro' : 'Desconectado'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{integracao.descricao}</p>
                    
                    {/* Storm Test Result */}
                    {integracao.id === 'storm' && stormResult && (
                      <div className={`mt-3 p-3 rounded-lg ${
                        stormResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          {stormResult.success ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <X size={16} className="text-red-600" />
                          )}
                          <span className={`text-sm font-medium ${
                            stormResult.success ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {stormResult.message}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Última verificação: {new Date(stormResult.checkedAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {/* Botão especial para Storm */}
                    {integracao.id === 'storm' ? (
                      <Button 
                        variant={stormResult?.success ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={testStormConnection}
                        disabled={stormTesting}
                      >
                        {stormTesting ? (
                          <>
                            <Loader2 size={16} className="animate-spin mr-2" />
                            Testando...
                          </>
                        ) : (
                          <>
                            <RefreshCw size={16} className="mr-2" />
                            Testar Conexão
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button 
                        variant={integracao.status === 'conectado' ? 'ghost' : 'primary'}
                        size="sm"
                        onClick={() => toggleIntegracao(integracao.id)}
                      >
                        {integracao.status === 'conectado' ? 'Desconectar' : 'Conectar'}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <ExternalLink size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegracoesPage;
