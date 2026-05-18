import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button, Input } from "../ui";

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

  const inputClassName =
    "auth-login-field h-10 px-3 pl-11 text-base shadow-none";
  const primaryButtonClassName =
    "auth-login-button h-11 min-w-[220px] px-8 text-sm font-medium shadow-none";

  return (
    <div className="auth-login-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0 auth-login-network" />
      <div className="pointer-events-none absolute left-[7%] top-1/2 hidden -translate-y-1/2 select-none text-[34rem] font-black leading-none text-white/[0.055] lg:block">
        F
      </div>

      <div className="auth-login-panel relative z-10 w-full max-w-[370px] overflow-hidden rounded-xl">
        <div className="px-7 py-10 sm:px-9">
          <div className="flex flex-col items-center text-center">
            <div className="auth-login-wordmark" aria-label="FINQZ PRO">
              <span className="auth-login-wordmark-main">
                Finqz<sup>®</sup>
              </span>
              <span className="auth-login-product-mark mt-2 text-lg font-light tracking-normal">PRO</span>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-[320px]">
            {mode === "login" && (
              <>
                {error && (
                  <div className="auth-login-alert mb-5 flex items-start gap-2 px-4 py-3 text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="auth-login-label mb-2 block text-base font-normal leading-tight">
                      Login
                    </label>
                    <div className="relative">
                      <Mail className="auth-login-field-icon absolute left-4 top-1/2 -translate-y-1/2" size={18} />
                      <Input
                        value={identifier}
                        onChange={(event) => setIdentifier(event.target.value)}
                        placeholder="E-mail"
                        autoComplete="username"
                        required
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="auth-login-label mb-2 block text-base font-normal leading-tight">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="auth-login-field-icon absolute left-4 top-1/2 -translate-y-1/2" size={18} />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Senha"
                        autoComplete="current-password"
                        required
                        className={`${inputClassName} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="auth-login-icon-button absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-center pt-1">
                    <Button type="submit" size="lg" loading={loading} className={primaryButtonClassName}>
                      Entrar
                    </Button>
                  </div>
                </form>

                <div className="mt-5 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("recovery");
                      setError("");
                      setRecoveryIdentifier(identifier);
                    }}
                    className="auth-login-link font-medium transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                  <span className="auth-login-muted text-sm">ou use seu código</span>
                </div>
              </>
            )}

            {mode === "recovery" && (
              <>
                <button
                  type="button"
                  onClick={resetToLogin}
                  className="auth-login-subtle mb-6 flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <ArrowLeft size={16} />
                  Voltar
                </button>

                <div className="mb-7 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center bg-[#0018ff]/10 text-[#0018ff]">
                    <KeyRound size={22} />
                  </div>
                  <h2 className="auth-login-heading text-2xl font-semibold">Recuperar acesso</h2>
                  <p className="auth-login-muted mt-2 text-sm">
                    Informe seu código ou e-mail para gerar uma senha temporária.
                  </p>
                </div>

                {error && (
                  <div className="auth-login-alert mb-5 flex items-start gap-2 px-4 py-3 text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRecovery} className="space-y-7">
                  <div>
                    <label className="auth-login-label mb-2 block text-base font-normal leading-tight">
                      Login
                    </label>
                    <div className="relative">
                      <Mail className="auth-login-field-icon absolute left-4 top-1/2 -translate-y-1/2" size={18} />
                      <Input
                        value={recoveryIdentifier}
                        onChange={(event) => setRecoveryIdentifier(event.target.value)}
                        placeholder="E-mail"
                        autoComplete="username"
                        required
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button type="submit" size="lg" loading={loading} className={`${primaryButtonClassName} tracking-normal normal-case`}>
                      Gerar senha
                    </Button>
                  </div>
                </form>
              </>
            )}

            {mode === "success" && (
              <>
                <div className="mb-7 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center bg-emerald-500/10 text-emerald-600">
                    <ShieldCheck size={22} />
                  </div>
                  <h2 className="auth-login-heading text-2xl font-semibold">Acesso liberado</h2>
                  <p className="auth-login-muted mt-2 text-sm">
                    Sua senha temporária foi gerada. Use-a para entrar agora.
                  </p>
                </div>

                <div className="auth-login-code-box space-y-3 p-4">
                  {recoveredAccessCode && (
                    <div>
                      <p className="auth-login-code-label text-xs uppercase tracking-wide">Código de acesso</p>
                      <p className="auth-login-code-value mt-1 font-semibold">{recoveredAccessCode}</p>
                    </div>
                  )}
                  <div>
                    <p className="auth-login-code-label text-xs uppercase tracking-wide">Senha temporária</p>
                    <p className="auth-login-code-value mt-1 break-all font-mono text-lg font-bold">{generatedPassword}</p>
                  </div>
                </div>

                <div className="mt-7 flex justify-center">
                  <Button type="button" size="lg" className={`${primaryButtonClassName} tracking-normal normal-case`} onClick={resetToLogin}>
                    Entrar
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminLoginScreen;
