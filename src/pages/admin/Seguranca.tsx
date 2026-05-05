// FINQZ PRO - Segurança Page
import React, { useState } from "react";
import { Shield, Lock, Eye, EyeOff, Key, Check, AlertTriangle } from "lucide-react";
import { Button, Input } from "../../components/ui";
import { PageHeader } from "../../components/layout/PageHeader";

export const SegurancaPage: React.FC = () => {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [configuracoes, setConfiguracoes] = useState({
    autenticacaoDoisFatores: false,
    notificacaoLogin: true,
    sessaoTimeout: 30,
    ipAllowlist: '',
  });

  const handleTrocarSenha = () => {
    if (novaSenha !== confirmarSenha) {
      alert('As senhas não conferem!');
      return;
    }
    if (novaSenha.length < 8) {
      alert('A senha deve ter pelo menos 8 caracteres!');
      return;
    }
    alert('Senha alterada com sucesso!');
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(configuracoes, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `seguranca_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Segurança"
        subtitle="Configure as opções de segurança do sistema"
        onRefresh={() => {}}
        onImport={() => alert('Funcionalidade de importação em desenvolvimento')}
        importLabel="Importar"
        onExport={handleExport}
        exportLabel="Exportar"
        exportData={[]}
        exportColumns={[]}
        exportFilename="seguranca"
      />
      
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 space-y-8">
        <h3 className="text-lg font-semibold text-white">Segurança</h3>
        
        {/* Alterar Senha */}
        <div className="space-y-4">
          <h4 className="font-medium text-white flex items-center gap-2">
            <Key size={18} />
            Alterar Senha
          </h4>
          <div className="grid gap-4 max-w-md">
            <div className="relative">
              <Input
                label="Senha Atual"
                type={mostrarSenha ? "text" : "password"}
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="Nova Senha"
                type={mostrarNovaSenha ? "text" : "password"}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {mostrarNovaSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Input
              label="Confirmar Nova Senha"
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="••••••••"
            />
            <Button onClick={handleTrocarSenha}>
              Alterar Senha
            </Button>
          </div>
        </div>

        {/* Autenticação de Dois Fatores */}
        <div className="border-t border-[#1f2937] pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white">Autenticação de Dois Fatores (2FA)</h4>
              <p className="text-sm text-gray-500 mt-1">
                Adicione uma camada extra de segurança usando um código de verificação
              </p>
            </div>
            <button
              onClick={() => setConfiguracoes({ ...configuracoes, autenticacaoDoisFatores: !configuracoes.autenticacaoDoisFatores })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                configuracoes.autenticacaoDoisFatores ? 'bg-[#000dff]' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-[#111827] transition-transform ${
                configuracoes.autenticacaoDoisFatores ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Notificação de Login */}
        <div className="border-t border-[#1f2937] pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white">Notificação de Login</h4>
              <p className="text-sm text-gray-500 mt-1">
                Receba um e-mail quando alguém fazer login na sua conta
              </p>
            </div>
            <button
              onClick={() => setConfiguracoes({ ...configuracoes, notificacaoLogin: !configuracoes.notificacaoLogin })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                configuracoes.notificacaoLogin ? 'bg-[#000dff]' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-[#111827] transition-transform ${
                configuracoes.notificacaoLogin ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Timeout de Sessão */}
        <div className="border-t border-[#1f2937] pt-6">
          <h4 className="font-medium text-white mb-3">Timeout de Sessão</h4>
          <p className="text-sm text-gray-500 mb-3">
            Desconectar automaticamente após inatividade
          </p>
          <select
            value={configuracoes.sessaoTimeout}
            onChange={(e) => setConfiguracoes({ ...configuracoes, sessaoTimeout: parseInt(e.target.value) })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          >
            <option value={15}>15 minutos</option>
            <option value={30}>30 minutos</option>
            <option value={60}>1 hora</option>
            <option value={120}>2 horas</option>
            <option value={0}>Nunca</option>
          </select>
        </div>

        {/* Lista de Dispositivos */}
        <div className="border-t border-[#1f2937] pt-6">
          <h4 className="font-medium text-white mb-3">Dispositivos Recentes</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-green-500" />
                <div>
                  <p className="text-sm font-medium text-white">Chrome - Windows</p>
                  <p className="text-xs text-gray-500">São Paulo, SP • Última atividade: agora</p>
                </div>
              </div>
              <span className="text-xs text-green-600 font-medium">Atual</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SegurancaPage;
