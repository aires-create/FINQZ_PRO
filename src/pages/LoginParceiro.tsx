// FINQZ PRO - Login Parceiro
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, AlertCircle, Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import useAppStore from "../store";
import { isValidLoginIdentifier, getLoginValidationError, isInternalAccessCode, isPartnerAccessCode, generateSecurePassword } from "../utils/auth";

type ViewType = "login" | "recuperar" | "nova-senha" | "sucesso";

export const LoginParceiroPage: React.FC = () => {
  const navigate = useNavigate();
  const { parceiros, updateParceiro, setAuth } = useAppStore();
  
  // Estados para login
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Estados para recuperação
  const [view, setView] = useState<ViewType>("login");
  const [codigoRecuperacao, setCodigoRecuperacao] = useState("");
  const [emailRecuperacao, setEmailRecuperacao] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  
  // Função para gerar nova senha (SEGURA - usa crypto API)
  const generateNovaSenha = () => {
    return generateSecurePassword(8);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validação do identificador de login
    const validationError = getLoginValidationError(login);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const normalizedLogin = login.trim().toUpperCase();
    const normalizedLoginLower = login.trim().toLowerCase();

    // Busca por parceiro (código P-XXXX)
    const parceiro = parceiros.find(p => 
      (String(p.codigo).toUpperCase() === normalizedLogin || p.email?.toLowerCase() === normalizedLoginLower) && 
      p.senha === senha
    );

    if (parceiro) {
      if (parceiro.status !== "ativo") {
        setError("Parceiro inativo. Entre em contato com o administrador.");
        setLoading(false);
        return;
      }

      setAuth({
        id: String(parceiro.id),
        nome: parceiro.nome,
        email: parceiro.email,
        perfil: "parceiro",
        parceiroId: parceiro.id,
        codigo: parceiro.codigo,
      });
      
      setLoading(false);
      navigate("/app/parceiro");
    } else {
      // Busca por usuário interno (FINQZ-XXXX)
      const { usuarios } = useAppStore.getState();
      const usuario = usuarios.find(u => 
        (u.access_code?.toUpperCase() === normalizedLogin || u.email?.toLowerCase() === normalizedLoginLower) && 
        u.senha === senha
      );

      if (usuario) {
        if (usuario.status !== "ativo") {
          setError("Usuário inativo. Entre em contato com o administrador.");
          setLoading(false);
          return;
        }

        setAuth({
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.role,
          access_code: usuario.access_code,
          role: usuario.role,
          scope: usuario.scope,
        });
        
        setLoading(false);
        navigate("/app/dashboard");
      } else {
        setError("Login ou senha incorretos.");
        setLoading(false);
      }
    }
  };

  const handleRecuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const parceiro = parceiros.find(p => 
      String(p.codigo) === codigoRecuperacao && 
      p.email?.toLowerCase() === emailRecuperacao.toLowerCase()
    );

    if (parceiro) {
      // Gerar nova senha
      const novaSenhaGerada = generateNovaSenha();
      updateParceiro(parceiro.id, { senha: novaSenhaGerada });
      
      // Mostrar a nova senha (em produção, seria enviada por email)
      setNovaSenha(novaSenhaGerada);
      setView("sucesso");
      setLoading(false);
    } else {
      setError("Código ou email não encontrado.");
      setLoading(false);
    }
  };

  const handleNovaSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (novaSenha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    
    if (novaSenha !== confirmarSenha) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const parceiro = parceiros.find(p => String(p.codigo) === codigoRecuperacao);
    
    if (parceiro) {
      updateParceiro(parceiro.id, { senha: novaSenha });
      setView("sucesso");
    } else {
      setError("Erro ao redefinir senha. Tente novamente.");
    }
    
    setLoading(false);
  };

  // Renderizar tela de sucesso
  if (view === "sucesso") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#000dff]/5 to-[#3388d9]/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#000dff] to-[#3388d9] rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#000dff] to-[#59a8f0] bg-clip-text text-transparent">
              FINQZ PRO
            </h1>
            <p className="text-gray-500 mt-1">Área do Parceiro</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Senha Redefinida!
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Sua nova senha foi definida com sucesso.
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-xs text-gray-500 mb-1">Nova senha:</p>
                <p className="text-xl font-mono font-bold text-gray-900">{novaSenha}</p>
              </div>

              <button
                onClick={() => {
                  setView("login");
                  setLogin(codigoRecuperacao);
                }}
                className="w-full py-3 bg-[#000dff] hover:bg-[#000dff]/90 text-white font-medium rounded-2xl transition-colors"
              >
                Entrar com nova senha
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a href="/parceiro/login" className="text-sm text-gray-500 hover:text-[#000dff]">
              ← Voltar para login
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar tela de nova senha
  if (view === "nova-senha") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#000dff]/5 to-[#3388d9]/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#000dff] to-[#3388d9] rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#000dff] to-[#59a8f0] bg-clip-text text-transparent">
              FINQZ PRO
            </h1>
            <p className="text-gray-500 mt-1">Área do Parceiro</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <button
              onClick={() => setView("recuperar")}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft size={18} />
              Voltar
            </button>

            <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
              Criar nova senha
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleNovaSenha} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showSenha ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:border-[#000dff] transition-colors pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:border-[#000dff] transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#000dff] hover:bg-[#000dff]/90 disabled:bg-[#000dff]/50 text-white font-medium rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar nova senha"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar tela de recuperação
  if (view === "recuperar") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#000dff]/5 to-[#3388d9]/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#000dff] to-[#3388d9] rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#000dff] to-[#59a8f0] bg-clip-text text-transparent">
              FINQZ PRO
            </h1>
            <p className="text-gray-500 mt-1">Área do Parceiro</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <button
              onClick={() => setView("login")}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft size={18} />
              Voltar
            </button>

            <h2 className="text-lg font-semibold text-gray-900 mb-2 text-center">
              Esqueci minha senha
            </h2>
            <p className="text-gray-500 text-sm mb-6 text-center">
              Informe seu código de parceiro e email para recuperar o acesso.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleRecuperarSenha} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código do Parceiro
                </label>
                <input
                  type="text"
                  value={codigoRecuperacao}
                  onChange={(e) => setCodigoRecuperacao(e.target.value)}
                  placeholder="Ex: 1001"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:border-[#000dff] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email cadastrado
                </label>
                <input
                  type="email"
                  value={emailRecuperacao}
                  onChange={(e) => setEmailRecuperacao(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:border-[#000dff] transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#000dff] hover:bg-[#000dff]/90 disabled:bg-[#000dff]/50 text-white font-medium rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Mail size={20} />
                    Recuperar senha
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar tela de login
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000dff]/5 to-[#3388d9]/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#000dff] to-[#3388d9] rounded-2xl flex items-center justify-center shadow-lg">
            <Building2 className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#000dff] to-[#59a8f0] bg-clip-text text-transparent">
            FINQZ PRO
          </h1>
          <p className="text-gray-500 mt-1">Área do Parceiro</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2 text-center">
            FINQZ PRO
          </h2>
          <p className="text-gray-500 text-sm mb-6 text-center">
            Digite seu código de acesso ou e-mail para continuar
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código de Acesso ou E-mail
              </label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="FINQZ-0001 ou email@empresa.com"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:border-[#000dff] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:border-[#000dff] transition-colors pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#000dff] hover:bg-[#000dff]/90 disabled:bg-[#000dff]/50 text-white font-medium rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setView("recuperar")}
              className="text-sm text-[#000dff] hover:underline"
            >
              Esqueci minha senha
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              É parceiro e ainda não tem acesso?{" "}
              <a href="/app/parceiros" className="text-[#000dff] hover:underline font-medium">
                Fale com a gente
              </a>
            </p>
          </div>
        </div>

        {/* Link para área admin */}
        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-[#000dff]">
            ← Voltar para área administrativa
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginParceiroPage;
