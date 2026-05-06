import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { Button, Card, Input } from "../ui";

interface LoginResult {
  success: boolean;
  must_change_password?: boolean;
  error?: string;
}

interface ResetResult {
  success: boolean;
  temporaryPassword?: string;
  accessCode?: string;
  error?: string;
}

interface AdminLoginScreenProps {
  onLogin: (credentials: { access_code_or_email: string; senha: string }) => Promise<LoginResult>;
  onRequestPasswordReset: (identifier: string) => Promise<ResetResult>;
}

type ScreenMode = "login" | "recovery" | "success";

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({
  onLogin,
  onRequestPasswordReset,
}) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ScreenMode>("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryIdentifier, setRecoveryIdentifier] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [recoveredAccessCode, setRecoveredAccessCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await onLogin({
      access_code_or_email: identifier,
      senha: password,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error || "Não foi possível entrar agora.");
      return;
    }

    navigate("/app/dashboard", { replace: true });
  };

  const handleRecovery = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await onRequestPasswordReset(recoveryIdentifier);

    setLoading(false);

    if (!result.success) {
      setError(result.error || "Não encontramos esse acesso.");
      return;
    }

    setGeneratedPassword(result.temporaryPassword || "");
    setRecoveredAccessCode(result.accessCode || "");
    setIdentifier(recoveryIdentifier);
    setPassword(result.temporaryPassword || "");
    setMode("success");
  };

  const resetToLogin = () => {
    setMode("login");
    setError("");
    setRecoveryIdentifier("");
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#000dff] to-[#59a8f0] rounded-2xl flex items-center justify-center shadow-lg shadow-[#000dff]/20">
            <span className="text-white font-bold text-3xl">F</span>
          </div>
          <h1 className="text-3xl font-bold text-[#3b5bfd]">FINQZ PRO</h1>
          <p className="text-white/60 mt-2">Acesso administrativo</p>
        </div>

        <Card className="rounded-[28px] border-white/10 bg-[#050816] p-3 shadow-2xl shadow-black/30">
          <div className="rounded-[24px] bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8">
            {mode === "login" && (
              <>
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-semibold text-slate-950">Entrar</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Use seu código de acesso ou e-mail para continuar.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="Código de acesso ou e-mail"
                    autoComplete="username"
                    required
                  />

                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Senha"
                      autoComplete="current-password"
                      required
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <Button type="submit" size="lg" loading={loading} className="w-full rounded-2xl py-3 text-base">
                    Entrar
                  </Button>
                </form>

                <div className="mt-5 flex items-center justify-between gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("recovery");
                      setError("");
                      setRecoveryIdentifier(identifier);
                    }}
                    className="font-medium text-[#000dff] hover:text-[#0000cc]"
                  >
                    Esqueci minha senha
                  </button>
                  <span className="text-slate-400">ou use seu código</span>
                </div>
              </>
            )}

            {mode === "recovery" && (
              <>
                <button
                  type="button"
                  onClick={resetToLogin}
                  className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
                >
                  <ArrowLeft size={16} />
                  Voltar
                </button>

                <div className="mb-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#000dff]">
                    <KeyRound size={22} />
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-950">Recuperar acesso</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Informe seu código ou e-mail para gerar uma senha temporária.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRecovery} className="space-y-4">
                  <Input
                    value={recoveryIdentifier}
                    onChange={(event) => setRecoveryIdentifier(event.target.value)}
                    placeholder="Código de acesso ou e-mail"
                    autoComplete="username"
                    required
                  />

                  <Button type="submit" size="lg" loading={loading} className="w-full rounded-2xl py-3 text-base">
                    Gerar senha temporária
                  </Button>
                </form>
              </>
            )}

            {mode === "success" && (
              <>
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                    <ShieldCheck size={22} />
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-950">Acesso liberado</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Sua senha temporária foi gerada. Use-a para entrar agora.
                  </p>
                </div>

                <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  {recoveredAccessCode && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Código de acesso</p>
                      <p className="mt-1 font-semibold text-slate-900">{recoveredAccessCode}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Senha temporária</p>
                    <p className="mt-1 break-all font-mono text-lg font-bold text-slate-950">{generatedPassword}</p>
                  </div>
                </div>

                <Button type="button" size="lg" className="mt-6 w-full rounded-2xl py-3 text-base" onClick={resetToLogin}>
                  Voltar e entrar
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminLoginScreen;
