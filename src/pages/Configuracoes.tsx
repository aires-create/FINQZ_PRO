// FINQZ PRO - Configurações Page
import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Settings, Palette, Bell, Shield, Database, Save, Upload, X, Plus, Minus, Trash2, Edit, Users, Zap, ChevronDown, ChevronRight, Check, Mail, Key, ExternalLink } from "lucide-react";
import useAppStore from "../store";
import { MODULE_PERMISSIONS, PROFILE_PERMISSIONS, USER_PROFILES, Pipeline, Etapa } from "../types";
import { pipelines as initialPipelines, setPipelines } from "../config/pipelines";
import { CAMPOS_SISTEMA, CAMPOS_POR_CATEGORIA } from "../config/campos";
import { TAGS_SISTEMA, listarTags, criarTag, editarTag, excluirTag, CORES_DISPONIVEIS, Tag } from "../config/tags";
import { AUTOMAÇÕES_BASE, getConfigPipeline, salvarConfigPipeline, toggleAutomacaoPipeline, getPipelinesComAutomacao, getTipoPipelineLabel, getCorTipoPipeline, resetarConfigPipeline, ConfigAutomacaoPipeline } from "../config/configAutomacoes";
import { Button, Card as DSCard, Input, Select } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";

interface ConfiguracoesPageProps {
  defaultTab?: string;
}

export const ConfiguracoesPage: React.FC<ConfiguracoesPageProps> = ({ defaultTab }) => {
  const location = useLocation();
  
  // Determine initial tab based on prop or URL path
  const getInitialTab = () => {
    if (defaultTab) return defaultTab;
    
    // Map URL paths to tabs
    const path = location.pathname;
    if (path.includes('/tags')) return 'tags';
    if (path.includes('/pipelines')) return 'pipelines';
    if (path.includes('/integracoes') || path.includes('/integrations')) return 'integrations';
    if (path.includes('/automacoes') || path.includes('/automations') || path.includes('/automacao')) return 'automations';
    if (path.includes('/notificacoes') || path.includes('/notifications')) return 'notifications';
    if (path.includes('/seguranca') || path.includes('/security')) return 'security';
    return 'general';
  };
  
  const { theme, setTheme, toggleTheme, usuarios, produtos, updateUsuario, user, updateUserAvatar, updateUserProfile } = useAppStore();
  const [activeTab, setActiveTab] = useState(getInitialTab);
  
  // Update tab when URL changes (e.g., direct navigation)
  useEffect(() => {
    const newTab = getInitialTab();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.pathname]);
  const [pipelines, setPipelines] = useState<Pipeline[]>(initialPipelines);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  // Avatar crop state
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropScale, setCropScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Drag & Drop for pipeline stages
  const [draggedStage, setDraggedStage] = useState<{ pipelineId: string; etapaId: string } | null>(null);
  const [dragOverStage, setDragOverStage] = useState<{ pipelineId: string; etapaId: string } | null>(null);
  
  // Edit stage modal
  const [editingStage, setEditingStage] = useState<{ pipelineId: string; etapa: Etapa } | null>(null);
  const [stageForm, setStageForm] = useState<{ 
    nome: string; 
    cor: string; 
    obrigatorios: Record<string, boolean>; 
    tags: string;
  }>({ nome: "", cor: "#6b7280", obrigatorios: {}, tags: "" });
  
  // Tag management state
  const [tagsList, setTagsList] = useState<Tag[]>(listarTags());
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagForm, setTagForm] = useState({ nome: "", cor: "#ef4444" });
  const [tagError, setTagError] = useState("");

  // Tag functions
  const handleCriarTag = () => {
    try {
      setTagError("");
      const nova = criarTag(tagForm);
      setTagsList(listarTags());
      setTagForm({ nome: "", cor: "#ef4444" });
    } catch (err: any) {
      setTagError(err.message);
    }
  };

  const handleEditarTag = (tag: Tag) => {
    setEditingTag(tag);
    setTagForm({ nome: tag.nome, cor: tag.cor });
    setTagError("");
  };

  const handleSalvarTag = () => {
    if (!editingTag) return;
    try {
      setTagError("");
      editarTag(editingTag.id, tagForm);
      setTagsList(listarTags());
      setEditingTag(null);
      setTagForm({ nome: "", cor: "#ef4444" });
    } catch (err: any) {
      setTagError(err.message);
    }
  };

  const handleExcluirTag = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta tag?")) {
      excluirTag(id);
      setTagsList(listarTags());
    }
  };

  // Open stage editor
  const openStageEditor = (pipelineId: string, etapa: Etapa) => {
    setEditingStage({ pipelineId, etapa });
    
    // Convert old string[] format to Record<string, boolean>
    let obrigatoriosConvertidos: Record<string, boolean> = {};
    if (Array.isArray(etapa.obrigatorios)) {
      etapa.obrigatorios.forEach(key => {
        obrigatoriosConvertidos[key] = true;
      });
    } else if (etapa.obrigatorios) {
      obrigatoriosConvertidos = { ...etapa.obrigatorios };
    }
    
    setStageForm({
      nome: etapa.nome,
      cor: etapa.cor || "#6b7280",
      obrigatorios: obrigatoriosConvertidos,
      tags: etapa.tags?.join(", ") || "",
    });
  };

  // Save stage edits
  const saveStage = () => {
    if (!editingStage) return;
    
    setPipelines(pipelines.map(p => {
      if (p.id !== editingStage.pipelineId || !p.etapas) return p;
      return {
        ...p,
        etapas: p.etapas.map(e => 
          e.id === editingStage.etapa.id 
            ? { 
                ...e, 
                nome: stageForm.nome,
                cor: stageForm.cor,
                obrigatorios: stageForm.obrigatorios,
                tags: stageForm.tags ? stageForm.tags.split(",").map(s => s.trim()).filter(Boolean) : [],
              } 
            : e
        )
      };
    }));
    
    setEditingStage(null);
  };

  // Handle drag start
  const handleDragStart = (pipelineId: string, etapaId: string) => {
    setDraggedStage({ pipelineId, etapaId });
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, pipelineId: string, etapaId: string) => {
    e.preventDefault();
    setDragOverStage({ pipelineId, etapaId });
  };

  // Handle drop - reorder stages
  const handleDrop = (e: React.DragEvent, targetPipelineId: string, targetEtapaId: string) => {
    e.preventDefault();
    
    if (!draggedStage || draggedStage.pipelineId !== targetPipelineId) {
      setDraggedStage(null);
      setDragOverStage(null);
      return;
    }

    if (draggedStage.etapaId === targetEtapaId) {
      setDraggedStage(null);
      setDragOverStage(null);
      return;
    }

    // Reorder stages
    setPipelines(pipelines.map(pipeline => {
      if (pipeline.id !== targetPipelineId || !pipeline.etapas) return pipeline;
      
      const stages = [...pipeline.etapas];
      const draggedIndex = stages.findIndex(e => e.id === draggedStage.etapaId);
      const targetIndex = stages.findIndex(e => e.id === targetEtapaId);
      
      if (draggedIndex === -1 || targetIndex === -1) return pipeline;
      
      // Remove dragged item and insert at target position
      const [draggedItem] = stages.splice(draggedIndex, 1);
      stages.splice(targetIndex, 0, draggedItem);
      
      // Update order for all stages
      return {
        ...pipeline,
        etapas: stages.map((etapa, index) => ({
          ...etapa,
          ordem: index + 1
        }))
      };
    }));

    setDraggedStage(null);
    setDragOverStage(null);
  };
  
  // Permission states
  const [editingPermissions, setEditingPermissions] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState({
    dashboard: true,
    oportunidades: true,
    clientes: true,
    produtos: true,
    parceiros: true,
    automacoes: true,
    relatorios: true,
    usuarios: true,
    configuracoes: true,
  });
  
  const [settings, setSettings] = useState({
    empresaNome: "FINQZ PRO",
    empresaLogo: "",
    emailNotificacoes: true,
    whatsappNotificacoes: true,
    notificacaoOportunidade: true,
    notificacaoComissao: true,
    sessaoTimeout: 30,
    duasFatores: false,
    webhookUrl: "",
    whatsappApiKey: "",
  });
  
  // Login Alerts State
  const [loginAlerts, setLoginAlerts] = useState({
    enabled: true,
    alertOnNewDevice: true,
    alertOnPasswordChange: true,
    alertOnLoginFromNewIP: true,
    notifyByEmail: true,
    notifyByPush: false,
    notifyAdmins: true,
    alertEmail: "",
  });
  
  const [highlightColor, setHighlightColor] = useState("#000dff");

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess(false);

    // Validation
    if (!passwordForm.currentPassword) {
      setPasswordError("Digite a senha atual");
      return;
    }
    if (!passwordForm.newPassword) {
      setPasswordError("Digite a nova senha");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("As senhas não conferem");
      return;
    }

    setChangingPassword(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, just show success
    setPasswordSuccess(true);
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setChangingPassword(false);
  };

  // Integration settings
  const [emailSettings, setEmailSettings] = useState({
    resendApiKey: "",
    smtpFrom: "",
    sendTestEmail: "",
    // Template customization
    empresaNome: "FINQZ PRO",
    primaryColor: "#000dff",
    logoUrl: "",
  });
  const [testingEmail, setTestingEmail] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save email template settings to backend
      const response = await fetch("https://staging--81irdofnlgfsx9dqddsk.youbase.cloud/api/settings/email-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaNome: emailSettings.empresaNome,
          primaryColor: emailSettings.primaryColor,
          logoUrl: emailSettings.logoUrl,
          smtpFrom: emailSettings.smtpFrom,
          resendApiKey: emailSettings.resendApiKey,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        console.log("Email settings saved:", data);
      } else {
        console.warn("Settings save warning:", data.error);
      }
      
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert("Configurações salvas com sucesso!\n\n" + (data.message || ""));
    } catch (error) {
      alert("Erro ao salvar configurações");
    }
    setSaving(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setSettings({ ...settings, empresaLogo: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setSettings({ ...settings, empresaLogo: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Avatar upload functions
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCropImage(base64);
        setCropPosition({ x: 0, y: 0 });
        setCropScale(1);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Crop functions
  const handleCropSave = () => {
    if (!cropCanvasRef.current || !cropImage) return;
    
    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Create a temporary image to get dimensions
    const img = new Image();
    img.onload = () => {
      // Set canvas size for cropped image (200x200 for avatar)
      canvas.width = 200;
      canvas.height = 200;
      
      // Calculate the crop area (center square)
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2 + cropPosition.x;
      const sy = (img.height - size) / 2 + cropPosition.y;
      
      // Draw cropped image
      ctx.drawImage(
        img,
        sx, sy, size, size,  // source
        0, 0, 200, 200        // destination
      );
      
      // Get cropped base64
      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9);
      setAvatarPreview(croppedBase64);
      updateUserAvatar(croppedBase64);
      setShowCropModal(false);
      setCropImage(null);
    };
    img.src = cropImage;
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setCropImage(null);
    setCropPosition({ x: 0, y: 0 });
    setCropScale(1);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleCropMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropPosition.x, y: e.clientY - cropPosition.y });
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCropPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleCropMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setCropScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setCropScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    updateUserAvatar("");
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  // Permission functions - granular permissions
  const [selectedProfile, setSelectedProfile] = useState<string>("vendedor");
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [profilePermissions, setProfilePermissions] = useState<Record<string, string[]>>(
    JSON.parse(JSON.stringify(PROFILE_PERMISSIONS))
  );

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(m => m !== moduleId)
        : [...prev, moduleId]
    );
  };

  const togglePermission = (moduleId: string, actionKey: string) => {
    setProfilePermissions(prev => {
      const modulePerms = prev[moduleId] || [];
      const newPerms = modulePerms.includes(actionKey)
        ? modulePerms.filter(a => a !== actionKey)
        : [...modulePerms, actionKey];
      return { ...prev, [moduleId]: newPerms };
    });
  };

  const toggleAllInModule = (moduleId: string, enabled: boolean) => {
    const module = MODULE_PERMISSIONS.find(m => m.module === moduleId);
    if (!module) return;
    
    setProfilePermissions(prev => {
      const actions = module.actions.map(a => a.key);
      return { 
        ...prev, 
        [moduleId]: enabled ? actions : []
      };
    });
  };

  const resetToDefault = () => {
    setProfilePermissions(JSON.parse(JSON.stringify(PROFILE_PERMISSIONS)));
  };

  const openEditPermissions = (usuarioId: string) => {
    setEditingPermissions(usuarioId);
    setSelectedProfile("vendedor");
  };

  const savePermissions = () => {
    alert("Permissões salvas com sucesso!");
    setEditingPermissions(null);
  };

  const tabs = [
    { id: "general", label: "Geral", icon: Settings },
    { id: "tags", label: "Tags", icon: Zap },
    { id: "pipelines", label: "Pipelines", icon: Zap },
    { id: "integrations", label: "Integrações", icon: Key },
    { id: "automations", label: "Automações", icon: Zap },
    { id: "notifications", label: "Notificações", icon: Bell },
    { id: "security", label: "Segurança", icon: Shield },
  ];

  // Get page title based on active tab
  const getPageTitle = () => {
    const titles: Record<string, string> = {
      general: "Geral",
      tags: "Tags",
      pipelines: "Pipelines",
      integrations: "Integrações",
      automations: "Automações",
      notifications: "Notificações",
      security: "Segurança",
    };
    return titles[activeTab] || "Configurações";
  };

  const getPageSubtitle = () => {
    const subtitles: Record<string, string> = {
      general: "Gerencie as configurações gerais do sistema",
      tags: "Crie e gerencie tags para classificar seus leads e oportunidades",
      pipelines: "Configure os pipelines e etapas do seu funil de vendas",
      integrations: "Gerencie integrações com serviços externos",
      automations: "Configure automações para otimizar seus processos",
      notifications: "Gerencie as notificações do sistema",
      security: "Configure as opções de segurança do sistema",
    };
    return subtitles[activeTab] || "Gerencie as configurações do sistema";
  };

  return (
    <div className="space-y-6">
      {/* Header Padronizado */}
      <PageHeader
        title={getPageTitle()}
        subtitle={getPageSubtitle()}
        onRefresh={() => {}}
        onImport={() => alert('Funcionalidade de importação em desenvolvimento')}
        importLabel="Importar"
        onExport={() => {
          // Exportar configurações gerais
          const configData = {
            tema: theme,
            pipelines: initialPipelines,
            tags: TAGS_SISTEMA,
            automacoes: AUTOMAÇÕES_BASE,
          };
          const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `configuracoes_finqz_${new Date().toISOString().split('T')[0]}.json`;
          link.click();
        }}
        exportLabel="Exportar"
        exportData={[]}
        exportColumns={[]}
        exportFilename="configuracoes"
      />
      {/* Tabs Navigation */}
      <div className="flex gap-6">
        {/* Tabs */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "primary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={18} className="mr-2" />
                  {tab.label}
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-[#111827] bg-[#111827]:bg-[#111827] border border-[#1f2937] bg-[#111827]:border-[#1f2937] rounded-xl p-6">
          {activeTab === "general" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white bg-[#111827]:text-white">Configurações Gerais</h3>
              
              {/* Avatar do Usuário */}
              <div className="border-b border-[#1f2937] pb-6">
                <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-3">Foto de Perfil</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-100 bg-[#111827]:bg-gray-50 border-2 border-[#1f2937] bg-[#111827]:border-[#3388d9] flex items-center justify-center overflow-hidden">
                    {avatarPreview || user?.avatar ? (
                      <img 
                        src={avatarPreview || user?.avatar} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-2xl font-semibold text-slate-500">
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
                <p className="text-xs text-slate-500 mt-2">Recomendado: imagem quadrada com no mínimo 200x200 pixels</p>
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
                  <label className="block text-sm font-medium text-slate-300 mb-1">Bio / Descrição</label>
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
              <div>
                <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-1">Logo da Empresa</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg bg-gray-100 bg-[#111827]:bg-gray-50 border border-[#1f2937] bg-[#111827]:border-[#3388d9] flex items-center justify-center overflow-hidden">
                    {logoPreview || settings.empresaLogo ? (
                      <img 
                        src={logoPreview || settings.empresaLogo} 
                        alt="Logo" 
                        className="w-full h-full object-contain" 
                      />
                    ) : (
                      <Palette size={32} className="text-slate-500" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 bg-primary text-white hover:bg-primary/90 active:bg-primary/80 px-4 py-2 text-sm gap-2"
                    >
                      <Upload size={16} />
                      Upload Logo
                    </label>
                    {(logoPreview || settings.empresaLogo) && (
                      <button
                        onClick={handleRemoveLogo}
                        className="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 bg-error text-white hover:bg-red-700 active:bg-red-800 px-4 py-2 text-sm gap-2"
                      >
                        <X size={16} />
                        Remover
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 bg-[#111827]:text-slate-500 mt-2">
                  Recomendado: imagem quadrada PNG ou JPG, máximo 2MB
                </p>
              </div>
              <div className="pt-4 border-t border-[#1f2937]">
                <Button onClick={handleSave} disabled={saving}>
                  <Save size={18} className="mr-2" />
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "tags" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Gerenciar Tags</h3>
              <p className="text-sm text-slate-500">Crie e gerencie tags para classificar seus leads e oportunidades</p>
              
              {/* Formulário para criar/editar tag */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Nome da Tag</label>
                    <Input
                      value={tagForm.nome}
                      onChange={(e) => setTagForm({ ...tagForm, nome: e.target.value })}
                      placeholder="Ex: Quente, Frio, Prioridade..."
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Cor</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={tagForm.cor}
                        onChange={(e) => setTagForm({ ...tagForm, cor: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                    </div>
                  </div>
                  <div>
                    {editingTag ? (
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => { setEditingTag(null); setTagForm({ nome: "", cor: "#ef4444" }); }}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSalvarTag}>
                          Salvar
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={handleCriarTag}>
                        + Nova Tag
                      </Button>
                    )}
                  </div>
                </div>
                {tagError && (
                  <p className="text-sm text-red-500">{tagError}</p>
                )}
              </div>
              
              {/* Lista de tags */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {tagsList.map((tag) => (
                  <div 
                    key={tag.id} 
                    className="flex items-center justify-between p-3 bg-[#111827] border border-[#1f2937] rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: tag.cor }}
                      />
                      <span className="font-medium text-white truncate">{tag.nome}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleEditarTag(tag)}
                        className="p-1.5 text-slate-400 hover:text-[#000dff] hover:bg-gray-100 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleExcluirTag(tag.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-gray-100 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {tagsList.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  Nenhuma tag encontrada. Crie sua primeira tag acima.
                </div>
              )}
            </div>
          )}

          {activeTab === "pipelines" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Gerenciar Pipelines</h3>
              <p className="text-sm text-slate-500">Configure os pipelines e etapas do seu funil de vendas</p>
              
              {/* Lista de Pipelines */}
              <div className="space-y-4">
                {pipelines.map((pipeline) => (
                  <div key={pipeline.id} className="border border-[#1f2937] rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-white">{pipeline.nome}</h4>
                        <p className="text-sm text-slate-500">ID: {pipeline.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${pipeline.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-slate-500'}`}>
                          {pipeline.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        <button className="p-2 text-slate-500 hover:text-[#000dff] hover:bg-gray-100 rounded-lg">
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            setPipelines(pipelines.map(p => 
                              p.id === pipeline.id ? { ...p, ativo: !p.ativo } : p
                            ));
                          }}
                          className="p-2 text-slate-500 hover:text-red-500 hover:bg-gray-100 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Etapas do Pipeline - Drag & Drop */}
                    <div className="mt-4">
                      <p className="text-sm font-medium text-slate-300 mb-2">Etapas (arraste para reordenar):</p>
                      <div className="flex gap-2 flex-wrap">
                        {pipeline.etapas
                          ?.filter(e => e.ativo)
                          .sort((a, b) => a.ordem - b.ordem)
                          .map((etapa, index) => (
                            <div 
                              key={etapa.id}
                              draggable
                              onDragStart={() => handleDragStart(pipeline.id, etapa.id)}
                              onDragOver={(e) => handleDragOver(e, pipeline.id, etapa.id)}
                              onDrop={(e) => handleDrop(e, pipeline.id, etapa.id)}
                              className={`
                                group flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm cursor-move
                                transition-all duration-200 select-none
                                ${dragOverStage?.pipelineId === pipeline.id && dragOverStage?.etapaId === etapa.id 
                                  ? 'ring-2 ring-[#000dff] ring-offset-2 bg-blue-50' 
                                  : ''}
                                ${draggedStage?.etapaId === etapa.id ? 'opacity-50' : ''}
                                hover:bg-gray-200 hover:shadow-sm
                              `}
                            >
                              <span className="w-5 h-5 rounded-full bg-[#000dff] text-white text-xs flex items-center justify-center cursor-grab">
                                {etapa.ordem}
                              </span>
                              <span className="text-slate-300">{etapa.nome}</span>
                              {etapa.obrigatorios && etapa.obrigatorios.length > 0 && (
                                <span className="text-xs text-orange-500" title={`Obrigatórios: ${etapa.obrigatorios.join(', ')}`}>
                                  ({etapa.obrigatorios.length})
                                </span>
                              )}
                              <button 
                                onClick={(e) => { e.stopPropagation(); openStageEditor(pipeline.id, etapa); }}
                                className="ml-1 p-1 text-slate-400 hover:text-[#000dff] rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Editar etapa"
                              >
                                <Edit size={12} />
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Botão adicionar pipeline */}
              <button
                onClick={() => {
                  const novoId = `pipeline_${Date.now()}`;
                  const novoPipeline: Pipeline = {
                    id: novoId,
                    nome: "Novo Pipeline",
                    ativo: true,
                    etapas: [
                      { id: `${novoId}_lead`, nome: "Novo Lead", ordem: 1, ativo: true },
                      { id: `${novoId}_processo`, nome: "Em Processo", ordem: 2, ativo: true },
                      { id: `${novoId}_fechamento`, nome: "Fechamento", ordem: 3, ativo: true },
                    ],
                  };
                  setPipelines([...pipelines, novoPipeline]);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#000dff] text-white rounded-lg hover:bg-[#000dcc] transition-colors"
              >
                <Plus size={18} />
                Novo Pipeline
              </button>
            </div>
          )}

          {/* ✅ Modal de Edição de Etapa */}
          {editingStage && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-[#111827] rounded-xl p-6 w-full max-w-md shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Editar Etapa</h3>
                  <button onClick={() => setEditingStage(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Nome</label>
                    <Input
                      value={stageForm.nome}
                      onChange={(e) => setStageForm({ ...stageForm, nome: e.target.value })}
                      placeholder="Nome da etapa"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Cor</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={stageForm.cor}
                        onChange={(e) => setStageForm({ ...stageForm, cor: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                      <Input
                        value={stageForm.cor}
                        onChange={(e) => setStageForm({ ...stageForm, cor: e.target.value })}
                        placeholder="#6b7280"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Campos Obrigatórios</label>
                    <div className="max-h-48 overflow-y-auto border border-[#1f2937] rounded-lg p-2 space-y-2">
                      {CAMPOS_POR_CATEGORIA.pessoal.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Dados Pessoais</p>
                          <div className="grid grid-cols-2 gap-1">
                            {CAMPOS_POR_CATEGORIA.pessoal.map(campo => (
                              <label key={campo.key} className="flex items-center gap-1 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={stageForm.obrigatorios[campo.key] || false}
                                  onChange={(e) => setStageForm({ 
                                    ...stageForm, 
                                    obrigatorios: { 
                                      ...stageForm.obrigatorios, 
                                      [campo.key]: e.target.checked 
                                    } 
                                  })}
                                  className="rounded text-[#000dff]"
                                />
                                <span className="truncate">{campo.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      {CAMPOS_POR_CATEGORIA.contato.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Contato</p>
                          <div className="grid grid-cols-2 gap-1">
                            {CAMPOS_POR_CATEGORIA.contato.map(campo => (
                              <label key={campo.key} className="flex items-center gap-1 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={stageForm.obrigatorios[campo.key] || false}
                                  onChange={(e) => setStageForm({ 
                                    ...stageForm, 
                                    obrigatorios: { 
                                      ...stageForm.obrigatorios, 
                                      [campo.key]: e.target.checked 
                                    } 
                                  })}
                                  className="rounded text-[#000dff]"
                                />
                                <span className="truncate">{campo.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      {CAMPOS_POR_CATEGORIA.bancario.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Dados Bancários</p>
                          <div className="grid grid-cols-2 gap-1">
                            {CAMPOS_POR_CATEGORIA.bancario.map(campo => (
                              <label key={campo.key} className="flex items-center gap-1 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={stageForm.obrigatorios[campo.key] || false}
                                  onChange={(e) => setStageForm({ 
                                    ...stageForm, 
                                    obrigatorios: { 
                                      ...stageForm.obrigatorios, 
                                      [campo.key]: e.target.checked 
                                    } 
                                  })}
                                  className="rounded text-[#000dff]"
                                />
                                <span className="truncate">{campo.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      {CAMPOS_POR_CATEGORIA.pix.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">PIX</p>
                          <div className="grid grid-cols-2 gap-1">
                            {CAMPOS_POR_CATEGORIA.pix.map(campo => (
                              <label key={campo.key} className="flex items-center gap-1 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={stageForm.obrigatorios[campo.key] || false}
                                  onChange={(e) => setStageForm({ 
                                    ...stageForm, 
                                    obrigatorios: { 
                                      ...stageForm.obrigatorios, 
                                      [campo.key]: e.target.checked 
                                    } 
                                  })}
                                  className="rounded text-[#000dff]"
                                />
                                <span className="truncate">{campo.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      {CAMPOS_POR_CATEGORIA.documentos.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Documentos</p>
                          <div className="grid grid-cols-2 gap-1">
                            {CAMPOS_POR_CATEGORIA.documentos.map(campo => (
                              <label key={campo.key} className="flex items-center gap-1 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={stageForm.obrigatorios[campo.key] || false}
                                  onChange={(e) => setStageForm({ 
                                    ...stageForm, 
                                    obrigatorios: { 
                                      ...stageForm.obrigatorios, 
                                      [campo.key]: e.target.checked 
                                    } 
                                  })}
                                  className="rounded text-[#000dff]"
                                />
                                <span className="truncate">{campo.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Selecione os campos que são obrigatórios para esta etapa</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Tags (separadas por vírgula)</label>
                    <Input
                      value={stageForm.tags}
                      onChange={(e) => setStageForm({ ...stageForm, tags: e.target.value })}
                      placeholder="novo, quente, prioridade"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="ghost" onClick={() => setEditingStage(null)}>
                    Cancelar
                  </Button>
                  <Button onClick={saveStage}>
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Configurações de Integrações</h3>
              
              {/* Email Configuration */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-white">Configuração de Email</h4>
                </div>
                
                <p className="text-sm text-slate-600 mb-4">
                  Configure o envio de emails usando a API do Resend. Obtenha sua chave API em <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">resend.com <ExternalLink className="w-3 h-3" /></a>
                </p>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Chave API do Resend
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={emailSettings.resendApiKey}
                      onChange={(e) => setEmailSettings({ ...emailSettings, resendApiKey: e.target.value })}
                      placeholder="re_123456789"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showApiKey ? <Shield className="w-4 h-4" /> : <Key className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Input
                    label="Email de Remetente"
                    value={emailSettings.smtpFrom}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpFrom: e.target.value })}
                    placeholder="FINQZ PRO <onboarding@resend.dev>"
                  />
                </div>

                <div className="pt-4 border-t border-[#1f2937]">
                  <h5 className="font-medium text-white mb-3">Testar Configuração</h5>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={emailSettings.sendTestEmail}
                      onChange={(e) => setEmailSettings({ ...emailSettings, sendTestEmail: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="flex-1"
                    />
                    <Button
                      variant="primary"
                      onClick={async () => {
                        if (!emailSettings.sendTestEmail) {
                          alert("Por favor, insira um email para teste");
                          return;
                        }
                        setTestingEmail(true);
                        try {
                          const result = await fetch("https://staging--81irdofnlgfsx9dqddsk.youbase.cloud/api/email/send", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              to: emailSettings.sendTestEmail,
                              subject: "Teste - FINQZ PRO",
                              html: "<h1>Email de teste</h1><p>Configuração de email funcionando corretamente!</p>",
                            }),
                          });
                          const data = await result.json();
                          if (data.success) {
                            alert("Email enviado com sucesso!");
                          } else {
                            alert("Erro ao enviar: " + data.error);
                          }
                        } catch (err) {
                          alert("Erro ao enviar email");
                        }
                        setTestingEmail(false);
                      }}
                      disabled={testingEmail}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {testingEmail ? "Enviando..." : "Enviar Teste"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Email Template Customization */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-5 h-5 text-pink-600" />
                  <h4 className="font-medium text-white">Personalização dos Templates de Email</h4>
                </div>
                
                <p className="text-sm text-slate-600 mb-4">
                  Customize a aparência dos emails enviados pelo sistema (credenciais de parceiro, reset de senha, etc.)
                </p>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={emailSettings.empresaNome}
                    onChange={(e) => setEmailSettings({ ...emailSettings, empresaNome: e.target.value })}
                    placeholder="FINQZ PRO"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Cor Principal dos Emails
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={emailSettings.primaryColor}
                      onChange={(e) => setEmailSettings({ ...emailSettings, primaryColor: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={emailSettings.primaryColor}
                      onChange={(e) => setEmailSettings({ ...emailSettings, primaryColor: e.target.value })}
                      placeholder="#000dff"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Cor usada no cabeçalho e botões dos emails</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    URL do Logo da Empresa
                  </label>
                  <input
                    type="url"
                    value={emailSettings.logoUrl}
                    onChange={(e) => setEmailSettings({ ...emailSettings, logoUrl: e.target.value })}
                    placeholder="https://seudominio.com/logo.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-slate-500 mt-1">URL pública da imagem do logo (recomendado: 200x60px)</p>
                </div>

                {/* Preview */}
                <div className="mt-4 p-4 bg-[#111827] rounded-lg border border-[#1f2937]">
                  <p className="text-sm font-medium text-slate-300 mb-2">Preview do Template</p>
                  <div 
                    className="rounded-lg overflow-hidden border border-[#1f2937]"
                    style={{ background: '#f4f6f8', padding: '20px' }}
                  >
                    <div 
                      className="rounded-t-lg p-6 text-center"
                      style={{ background: `linear-gradient(135deg, ${emailSettings.primaryColor} 0%, ${emailSettings.primaryColor}dd 100%)` }}
                    >
                      {emailSettings.logoUrl ? (
                        <img src={emailSettings.logoUrl} alt="Logo" style={{ maxHeight: '40px', marginBottom: '10px' }} />
                      ) : (
                        <h1 style={{ color: '#fff', margin: 0, fontSize: '24px' }}>{emailSettings.empresaNome}</h1>
                      )}
                      <p style={{ color: 'rgba(255,255,255,0.9)', margin: '5px 0 0' }}>Sistema de Gestão CRM</p>
                    </div>
                    <div className="bg-[#111827] p-4">
                      <p style={{ color: '#4a5568', margin: 0 }}>Olá <strong>Nome do Parceiro</strong></p>
                      <p style={{ color: '#64748b', margin: '10px 0', fontSize: '14px' }}>Seu acesso foi criado com sucesso.</p>
                      <div 
                        style={{ 
                          background: '#f1f5f9', 
                          borderRadius: '8px', 
                          padding: '15px',
                          margin: '15px 0'
                        }}
                      >
                        <p style={{ color: '#64748b', margin: '0 0 10px', fontSize: '12px' }}>Suas Credenciais</p>
                        <p style={{ margin: '5px 0' }}><span style={{ color: '#64748b' }}>📋 Login:</span> <strong>1234</strong></p>
                        <p style={{ margin: '5px 0' }}><span style={{ color: '#64748b' }}>🔑 Senha:</span> <strong style={{ color: emailSettings.primaryColor }}>senha123</strong></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* API Keys Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Key className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Sobre as chaves de API</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      As chaves de API são armazenadas de forma segura no backend. Após configurar, clique em "Salvar Configurações" para aplicar as alterações.
                    </p>
                  </div>
                </div>
              </div>

              {/* Webhook Configuration */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <ExternalLink className="w-5 h-5 text-purple-600" />
                  <h4 className="font-medium text-white">Webhook</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Webhook URL</label>
                  <input
                    type="url"
                    value={settings.webhookUrl}
                    onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                    placeholder="https://seu-webhook.com.br"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* WhatsApp Configuration */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Key className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-white">WhatsApp API</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">WhatsApp API Key</label>
                  <input
                    type="password"
                    value={settings.whatsappApiKey}
                    onChange={(e) => setSettings({ ...settings, whatsappApiKey: e.target.value })}
                    placeholder="Sua API key do WhatsApp"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "automations" && (
            <AutomationsConfig />
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white bg-[#111827]:text-white">Notificações</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 bg-gray-50 bg-[#111827]:bg-gray-50 rounded-lg cursor-pointer">
                  <div>
                    <p className="text-white bg-[#111827]:text-white font-medium">Email de Notificações</p>
                    <p className="text-sm text-slate-500 bg-[#111827]:text-slate-500">Receba notificações por email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotificacoes}
                    onChange={(e) => setSettings({ ...settings, emailNotificacoes: e.target.checked })}
                    className="w-5 h-5 rounded bg-gray-200 bg-[#111827]:bg-[#2a2a3e] border-gray-300 bg-[#111827]:border-[#3a3a4e] text-[#000dff] focus:ring-[#000dff]"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 bg-[#111827]:bg-gray-50 rounded-lg cursor-pointer">
                  <div>
                    <p className="text-white bg-[#111827]:text-white font-medium">WhatsApp de Notificações</p>
                    <p className="text-sm text-slate-500 bg-[#111827]:text-slate-500">Receba notificações por WhatsApp</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.whatsappNotificacoes}
                    onChange={(e) => setSettings({ ...settings, whatsappNotificacoes: e.target.checked })}
                    className="w-5 h-5 rounded bg-gray-200 bg-[#111827]:bg-[#2a2a3e] border-gray-300 bg-[#111827]:border-[#3a3a4e] text-[#000dff] focus:ring-[#000dff]"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 bg-[#111827]:bg-gray-50 rounded-lg cursor-pointer">
                  <div>
                    <p className="text-white bg-[#111827]:text-white font-medium">Nova Oportunidade</p>
                    <p className="text-sm text-slate-500 bg-[#111827]:text-slate-500">Notificar quando uma nova oportunidade for criada</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notificacaoOportunidade}
                    onChange={(e) => setSettings({ ...settings, notificacaoOportunidade: e.target.checked })}
                    className="w-5 h-5 rounded bg-gray-200 bg-[#111827]:bg-[#2a2a3e] border-gray-300 bg-[#111827]:border-[#3a3a4e] text-[#000dff] focus:ring-[#000dff]"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 bg-[#111827]:bg-gray-50 rounded-lg cursor-pointer">
                  <div>
                    <p className="text-white bg-[#111827]:text-white font-medium">Comissão Paga</p>
                    <p className="text-sm text-slate-500 bg-[#111827]:text-slate-500">Notificar quando uma comissão for paga</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notificacaoComissao}
                    onChange={(e) => setSettings({ ...settings, notificacaoComissao: e.target.checked })}
                    className="w-5 h-5 rounded bg-gray-200 bg-[#111827]:bg-[#2a2a3e] border-gray-300 bg-[#111827]:border-[#3a3a4e] text-[#000dff] focus:ring-[#000dff]"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white bg-[#111827]:text-white">Segurança</h3>
              <div className="space-y-6">
                {/* Alterar Senha */}
                <div className="border border-[#1f2937] rounded-lg p-4">
                  <h4 className="font-medium text-white mb-4">Alterar Senha</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Senha Atual</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full max-w-md bg-gray-50 border border-[#1f2937] rounded-lg px-4 py-2 text-white"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Nova Senha</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full max-w-md bg-gray-50 border border-[#1f2937] rounded-lg px-4 py-2 text-white"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Confirmar Nova Senha</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full max-w-md bg-gray-50 border border-[#1f2937] rounded-lg px-4 py-2 text-white"
                        placeholder="••••••••"
                      />
                    </div>
                    
                    {passwordError && (
                      <p className="text-sm text-red-600">{passwordError}</p>
                    )}
                    {passwordSuccess && (
                      <p className="text-sm text-green-600">Senha alterada com sucesso!</p>
                    )}
                    
                    <button
                      onClick={handlePasswordChange}
                      disabled={changingPassword}
                      className="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 bg-primary text-white hover:bg-primary/90 active:bg-primary/80 px-4 py-2 text-sm gap-2 disabled:opacity-50"
                    >
                      {changingPassword ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Alterando...
                        </>
                      ) : (
                        <>
                          <Key size={16} />
                          Alterar Senha
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 bg-[#111827]:text-slate-300 mb-1">Timeout da Sessão (minutos)</label>
                  <input
                    type="number"
                    value={settings.sessaoTimeout}
                    onChange={(e) => setSettings({ ...settings, sessaoTimeout: Number(e.target.value) })}
                    className="w-full max-w-md bg-gray-50 bg-[#111827]:bg-gray-50 border border-[#1f2937] bg-[#111827]:border-[#3388d9] rounded-lg px-4 py-2 text-white bg-[#111827]:text-white"
                  />
                </div>
                <label className="flex items-center justify-between p-3 bg-gray-50 bg-[#111827]:bg-gray-50 rounded-lg cursor-pointer">
                  <div>
                    <p className="text-white bg-[#111827]:text-white font-medium">Autenticação em Dois Fatores</p>
                    <p className="text-sm text-slate-500 bg-[#111827]:text-slate-500">Adicione uma camada extra de segurança</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.duasFatores}
                    onChange={(e) => setSettings({ ...settings, duasFatores: e.target.checked })}
                    className="w-5 h-5 rounded bg-gray-200 bg-[#111827]:bg-[#2a2a3e] border-gray-300 bg-[#111827]:border-[#3a3a4e] text-[#000dff] focus:ring-[#000dff]"
                  />
                </label>
              </div>

              {/* Alertas de Login */}
              <div className="border border-[#1f2937] rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">Alertas de Login</h4>
                    <p className="text-sm text-slate-500">Receba notificações sobre atividades de login</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={loginAlerts.enabled}
                      onChange={(e) => setLoginAlerts({ ...loginAlerts, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#000dff]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#111827] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#000dff]"></div>
                  </label>
                </div>

                {loginAlerts.enabled && (
                  <div className="space-y-3 pl-4 border-l-2 border-[#1f2937]">
                    <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={loginAlerts.alertOnNewDevice}
                        onChange={(e) => setLoginAlerts({ ...loginAlerts, alertOnNewDevice: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-[#000dff] focus:ring-[#000dff]"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-300">Novo dispositivo</p>
                        <p className="text-xs text-slate-500">Alertar quando um novo dispositivo acessar a conta</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={loginAlerts.alertOnPasswordChange}
                        onChange={(e) => setLoginAlerts({ ...loginAlerts, alertOnPasswordChange: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-[#000dff] focus:ring-[#000dff]"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-300">Alteração de senha</p>
                        <p className="text-xs text-slate-500">Alertar quando a senha for alterada</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={loginAlerts.alertOnLoginFromNewIP}
                        onChange={(e) => setLoginAlerts({ ...loginAlerts, alertOnLoginFromNewIP: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-[#000dff] focus:ring-[#000dff]"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-300">Novo endereço IP</p>
                        <p className="text-xs text-slate-500">Alertar quando houver login de um novo endereço IP</p>
                      </div>
                    </label>

                    <div className="pt-2 border-t border-[#1f2937]">
                      <p className="text-sm font-medium text-slate-300 mb-2">Método de notificação</p>
                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={loginAlerts.notifyByEmail}
                            onChange={(e) => setLoginAlerts({ ...loginAlerts, notifyByEmail: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-[#000dff] focus:ring-[#000dff]"
                          />
                          <Mail size={16} className="text-slate-500" />
                          <span className="text-sm text-slate-600">E-mail</span>
                        </label>

                        <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={loginAlerts.notifyByPush}
                            onChange={(e) => setLoginAlerts({ ...loginAlerts, notifyByPush: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-[#000dff] focus:ring-[#000dff]"
                          />
                          <Bell size={16} className="text-slate-500" />
                          <span className="text-sm text-slate-600">Push</span>
                        </label>

                        <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={loginAlerts.notifyAdmins}
                            onChange={(e) => setLoginAlerts({ ...loginAlerts, notifyAdmins: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-[#000dff] focus:ring-[#000dff]"
                          />
                          <Users size={16} className="text-slate-500" />
                          <span className="text-sm text-slate-600">Notificar administradores</span>
                        </label>
                      </div>
                    </div>

                    {(loginAlerts.notifyByEmail || loginAlerts.notifyAdmins) && (
                      <div className="pt-2">
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          {loginAlerts.notifyAdmins ? "E-mail para alertas" : "E-mail de notificação"}
                        </label>
                        <input
                          type="email"
                          value={loginAlerts.alertEmail}
                          onChange={(e) => setLoginAlerts({ ...loginAlerts, alertEmail: e.target.value })}
                          placeholder="seu@email.com"
                          className="w-full max-w-md bg-gray-50 border border-[#1f2937] rounded-lg px-4 py-2 text-white"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          {loginAlerts.notifyAdmins 
                            ? "Os administradores receberão alertas neste e-mail" 
                            : "Você receberá alertas de login neste e-mail"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}


        </div>
      </div>
      {/* Edit Permissions Modal - Granular */}
      {editingPermissions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] dark:bg-[#1a1a2e] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-[#1f2937] dark:border-gray-700">
            <div className="p-6 border-b border-[#1f2937] dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white dark:text-white">Gerenciar Permissões por Perfil</h3>
                <button onClick={() => setEditingPermissions(null)} className="text-slate-500 hover:text-slate-300 dark:hover:text-slate-300">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Configure quais ações cada perfil pode executar em cada módulo do sistema.
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              {/* Profile Selector */}
              <div className="flex gap-2 flex-wrap mb-4">
                {USER_PROFILES.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedProfile(profile.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedProfile === profile.id
                        ? "bg-[#000dff] text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-slate-300 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {profile.label}
                  </button>
                ))}
              </div>

              {/* Modules List */}
              <div className="space-y-2">
                {MODULE_PERMISSIONS.map(module => {
                  const isExpanded = expandedModules.includes(module.module);
                  const modulePerms = profilePermissions[selectedProfile]?.[module.module] || [];
                  const allSelected = module.actions.length > 0 && module.actions.every(a => modulePerms.includes(a.key));
                  const someSelected = modulePerms.length > 0 && !allSelected;

                  return (
                    <div key={module.module} className="border border-[#1f2937] dark:border-gray-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleModule(module.module)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          <span className="font-medium text-white dark:text-white">{module.label}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            ({modulePerms.length}/{module.actions.length} ações)
                          </span>
                        </div>
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAllInModule(module.module, !allSelected);
                          }}
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                            allSelected 
                              ? "bg-[#000dff] border-[#000dff]" 
                              : someSelected 
                                ? "bg-[#000dff]/50 border-[#000dff]"
                                : "border-gray-300 dark:border-gray-600 hover:border-[#000dff]"
                          }`}
                        >
                          {allSelected && <Check size={14} className="text-white" />}
                          {someSelected && <div className="w-2 h-2 bg-[#111827] rounded-full" />}
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="p-4 bg-[#111827] dark:bg-[#1a1a2e] space-y-2 border-t border-[#1f2937] dark:border-gray-700">
                          {module.actions.map(action => (
                            <label
                              key={action.key}
                              className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                            >
                              <div>
                                <span className="text-white dark:text-white text-sm">{action.label}</span>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{action.description}</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={modulePerms.includes(action.key)}
                                onChange={() => togglePermission(module.module, action.key)}
                                className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-[#000dff] focus:ring-[#000dff]"
                              />
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-[#1f2937] dark:border-gray-700 flex justify-between">
              <button
                onClick={resetToDefault}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-white dark:hover:text-white transition-colors"
              >
                Restaurar Padrão
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingPermissions(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-slate-300 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={savePermissions}
                  className="px-4 py-2 bg-[#000dff] hover:bg-[#000dff]/90 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save size={16} />
                  Salvar Permissões
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#111827] rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recortar Imagem</h3>
              <button onClick={handleCropCancel} className="text-slate-500 hover:text-slate-300">
                <X size={24} />
              </button>
            </div>
            
            <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden mb-4">
              {cropImage && (
                <img
                  src={cropImage}
                  alt="Crop preview"
                  className="absolute w-full h-full object-contain"
                  style={{
                    transform: `translate(${cropPosition.x}px, ${cropPosition.y}px) scale(${cropScale})`,
                    transformOrigin: 'center',
                    cursor: isDragging ? 'grabbing' : 'grab'
                  }}
                  onMouseDown={handleCropMouseDown}
                  onMouseMove={handleCropMouseMove}
                  onMouseUp={handleCropMouseUp}
                  onMouseLeave={handleCropMouseUp}
                  draggable={false}
                />
              )}
              {/* Circular overlay to show crop area */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-2 border-white/80 shadow-lg" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={handleZoomOut}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Diminuir zoom"
              >
                <Minus size={20} />
              </button>
              <span className="text-sm text-slate-600 min-w-[60px] text-center">
                {Math.round(cropScale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Aumentar zoom"
              >
                <Plus size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-500 text-center mb-4">
              Arraste a imagem para posicionar. O resultado será um círculo.
            </p>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleCropCancel} className="flex-1">
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleCropSave} className="flex-1">
                <Check size={16} className="mr-2" />
                Aplicar
              </Button>
            </div>

            <canvas ref={cropCanvasRef} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
};

// 🎯 COMPONENTE DE CONFIGURAÇÃO DE AUTOMAÇÕES
const AutomationsConfig: React.FC = () => {
  const [pipelineSelecionado, setPipelineSelecionado] = useState<string>("parceiros_comerciais");
  const [config, setConfig] = useState(() => getConfigPipeline(pipelineSelecionado));
  
  const pipelines = getPipelinesComAutomacao();
  
  const handleToggle = (automacaoId: string, ativo: boolean) => {
    const novoConfig = toggleAutomacaoPipeline(pipelineSelecionado, automacaoId, ativo);
    setConfig(novoConfig);
  };
  
  const handleReset = () => {
    const novoConfig = resetarConfigPipeline(pipelineSelecionado);
    setConfig(novoConfig);
    alert("Configuração resetada para o padrão!");
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Automações por Pipeline</h3>
          <p className="text-sm text-slate-500">
            Configure quais ações automáticas executam quando um contrato é assinado em cada pipeline.
          </p>
        </div>
      </div>
      
      {/* Seleção de Pipeline */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">Selecione o Pipeline</label>
        <div className="grid grid-cols-3 gap-2">
          {pipelines.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPipelineSelecionado(p.id);
                setConfig(getConfigPipeline(p.id));
              }}
              className={`p-3 rounded-lg border text-left transition-all ${
                pipelineSelecionado === p.id
                  ? 'border-[#000dff] bg-[#000dff]/10'
                  : 'border-[#1f2937] hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm text-white">{p.nome}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <Zap size={12} />
                {p.automacoesAtivas} automações ativas
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Lista de Automações */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-white">Automações do Pipeline</h4>
          <button
            onClick={handleReset}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Resetar para padrão
          </button>
        </div>
        
        {config.automacoes.map((auto) => {
          const automacaoBase = AUTOMAÇÕES_BASE.find(a => a.id === auto.automacaoId);
          if (!automacaoBase) return null;
          
          return (
            <div
              key={auto.id}
              className={`p-4 rounded-lg border transition-all ${
                auto.ativo 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-[#1f2937] bg-[#111827]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{ backgroundColor: automacaoBase.cor + '20' }}
                  >
                    {automacaoBase.icone}
                  </div>
                  <div>
                    <h5 className="font-medium text-white">{automacaoBase.nome}</h5>
                    <p className="text-xs text-slate-500">{automacaoBase.descricao}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={auto.ativo}
                    onChange={(e) => handleToggle(auto.automacaoId, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#111827] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Resumo */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-800">
          <Zap size={18} />
          <span className="font-medium">Resumo</span>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          {config.automacoes.filter(a => a.ativo).length} automação(ões) ativa(s) para este pipeline.
          Quando um contrato for assinado, todas as automações ativas serão executadas automaticamente.
        </p>
      </div>
    </div>
  );
};

export default ConfiguracoesPage;
