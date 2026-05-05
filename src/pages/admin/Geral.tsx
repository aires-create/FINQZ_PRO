// FINQZ PRO - Geral Page
import React, { useState, useRef } from "react";
import { Settings, Upload, X, Save } from "lucide-react";
import useAppStore from "../../store";
import { Button, Input, Select } from "../../components/ui";
import { PageHeader } from "../../components/layout/PageHeader";

export const GeralPage: React.FC = () => {
  const { theme, setTheme, toggleTheme, user, updateUserAvatar, updateUserProfile } = useAppStore();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    empresaNome: "FINQZ PRO",
    empresaLogo: "",
    tema: theme,
    idioma: "pt-BR",
    fusoHorario: "America/Sao_Paulo",
    formatoData: "DD/MM/YYYY",
    formatoMoeda: "BRL",
  });

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    updateUserAvatar(null);
  };

  const handleSalvar = async () => {
    setSaving(true);
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (avatarPreview) {
      updateUserAvatar(avatarPreview);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Geral"
        subtitle="Gerencie as configurações gerais do sistema"
        onRefresh={() => {}}
        onImport={() => alert('Funcionalidade de importação em desenvolvimento')}
        importLabel="Importar"
        onExport={() => {
          const configData = { tema: theme };
          const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `configuracoes_gerais_${new Date().toISOString().split('T')[0]}.json`;
          link.click();
        }}
        exportLabel="Exportar"
        exportData={[]}
        exportColumns={[]}
        exportFilename="configuracoes_gerais"
      />
      
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Configurações Gerais</h3>
          
          {/* Avatar do Usuário */}
          <div className="border-b border-gray-200 pb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Foto de Perfil</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-[#3388d9] flex items-center justify-center overflow-hidden">
                {avatarPreview || user?.avatar ? (
                  <img 
                    src={avatarPreview || user?.avatar} 
                    alt="Avatar" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-2xl font-semibold text-gray-500">
                    {user?.nome ? user.nome.charAt(0).toUpperCase() : "U"}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 bg-primary text-white hover:bg-primary/90 active:bg-primary/80 px-4 py-2 text-sm gap-2"
                >
                  <Upload size={16} />
                  Alterar Foto
                </label>
                {(avatarPreview || user?.avatar) && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 bg-error text-white hover:bg-red-700 active:bg-red-800 px-4 py-2 text-sm gap-2"
                  >
                    <X size={16} />
                    Remover
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Recomendado: imagem quadrada com no mínimo 200x200 pixels</p>
          </div>

          {/* Informações do Perfil */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div>
              <Input
                label="Nome Completo"
                value={user?.nome || ""}
                onChange={(e) => updateUserProfile({ nome: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>
            <div>
              <Input
                label="Telefone"
                value={user?.telefone || ""}
                onChange={(e) => updateUserProfile({ telefone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <Input
                label="Cargo / Função"
                value={user?.cargo || ""}
                onChange={(e) => updateUserProfile({ cargo: e.target.value })}
                placeholder="Ex: Gerente de Vendas"
              />
            </div>
            <div>
              <Input
                label="Localização"
                value={user?.localizacao || ""}
                onChange={(e) => updateUserProfile({ localizacao: e.target.value })}
                placeholder="Ex: São Paulo, SP"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Descrição</label>
              <textarea
                value={user?.bio || ""}
                onChange={(e) => updateUserProfile({ bio: e.target.value })}
                placeholder="Conte um pouco sobre você..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                rows={3}
              />
            </div>
          </div>

          <div>
            <Input
              label="Nome da Empresa"
              value={settings.empresaNome}
              onChange={(e) => setSettings({ ...settings, empresaNome: e.target.value })}
              className="max-w-md"
            />
          </div>

          {/* Tema */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tema</label>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setTheme("light");
                  setSettings({ ...settings, tema: "light" });
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                  settings.tema === "light" 
                    ? "border-primary bg-primary/5" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-white border border-gray-300" />
                Claro
              </button>
              <button
                onClick={() => {
                  setTheme("dark");
                  setSettings({ ...settings, tema: "dark" });
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                  settings.tema === "dark" 
                    ? "border-primary bg-primary/5" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-gray-800 border border-gray-600" />
                Escuro
              </button>
            </div>
          </div>

          {/* Idioma */}
          <div className="max-w-md">
            <Select
              label="Idioma"
              value={settings.idioma}
              onChange={(e) => setSettings({ ...settings, idioma: e.target.value })}
              options={[
                { value: "pt-BR", label: "Português (Brasil)" },
                { value: "en-US", label: "English (US)" },
                { value: "es", label: "Español" },
              ]}
            />
          </div>

          {/* Fuso Horário */}
          <div className="max-w-md">
            <Select
              label="Fuso Horário"
              value={settings.fusoHorario}
              onChange={(e) => setSettings({ ...settings, fusoHorario: e.target.value })}
              options={[
                { value: "America/Sao_Paulo", label: "Brasília (GMT-3)" },
                { value: "America/Manaus", label: "Manaus (GMT-4)" },
                { value: "America/Recife", label: "Recife (GMT-3)" },
              ]}
            />
          </div>

          {/* Formato de Data */}
          <div className="max-w-md">
            <Select
              label="Formato de Data"
              value={settings.formatoData}
              onChange={(e) => setSettings({ ...settings, formatoData: e.target.value })}
              options={[
                { value: "DD/MM/YYYY", label: "DD/MM/AAAA" },
                { value: "MM/DD/YYYY", label: "MM/DD/AAAA" },
                { value: "YYYY-MM-DD", label: "AAAA-MM-DD" },
              ]}
            />
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={handleSalvar}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save size={18} />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeralPage;
