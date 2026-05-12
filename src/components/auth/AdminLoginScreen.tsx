import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { Button, Input } from "../ui";
import finqzLogoBlue from "../../assets/brand/finqz-logo-blue.png";

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
    "auth-login-field h-10 px-3 text-base shadow-none";
  const primaryButtonClassName =
    "auth-login-button h-12 min-w-[148px] rounded-none px-8 text-sm font-semibold uppercase tracking-[0.24em] shadow-none";

  return (
    <div className="auth-login-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_8%,rgba(99,196,255,0.18),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.08),transparent_30%)]" />
        <div className="absolute -bottom-[30rem] -right-[28rem] h-[58rem] w-[58rem] rounded-full border-[10px] border-[#ff1717] opacity-90 sm:-bottom-[34rem] sm:-right-[26rem] sm:h-[66rem] sm:w-[66rem]" />
        <div className="absolute -bottom-[18rem] -right-[12rem] h-[34rem] w-[34rem] rounded-full border-[8px] border-[#ff1717] opacity-90 sm:-bottom-[23rem] sm:-right-[9rem] sm:h-[42rem] sm:w-[42rem]" />
      </div>

      <div className="auth-login-panel relative z-10 w-full max-w-[760px] overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.32)]">
        <div className="px-6 py-9 sm:px-20 sm:py-12">
          <div className="flex flex-col items-center text-center">
            <img
              src={finqzLogoBlue}
              alt="FINQZ"
              className="h-auto w-[188px] sm:w-[230px]"
            />
            <p className="mt-4 text-sm font-medium tracking-[0.26em] text-[#2d3767]">PRO</p>
          </div>

          <div className="mx-auto mt-10 max-w-[410px] sm:mt-12">
            {mode === "login" && (
              <>
                {error && (
                  <div className="auth-login-alert mb-5 flex items-start gap-2 px-4 py-3 text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-9">
                  <div>
                    <label className="auth-login-label mb-1 block text-xl font-normal leading-tight">
                      Login
                    </label>
                    <Input
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      placeholder="Código de acesso ou e-mail"
                      autoComplete="username"
                      required
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className="auth-login-label mb-1 block text-xl font-normal leading-tight">
                      Senha
                    </label>
                    <div className="relative">
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

                  <div className="flex justify-center pt-2">
                    <Button type="submit" size="lg" loading={loading} className={primaryButtonClassName}>
                      Entrar
                    </Button>
                  </div>
                </form>

                <div className="mt-6 flex flex-col gap-3 text-base sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("recovery");
                      setError("");
                      setRecoveryIdentifier(identifier);
                    }}
                    className="font-bold text-[#005fff] transition-colors hover:text-[#0018ff]"
                  >
                    Esqueci minha senha
                  </button>
                  <span className="text-sm text-slate-500">ou use seu código</span>
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
                    <label className="auth-login-label mb-1 block text-xl font-normal leading-tight">
                      Login
                    </label>
                    <Input
                      value={recoveryIdentifier}
                      onChange={(event) => setRecoveryIdentifier(event.target.value)}
                      placeholder="Código de acesso ou e-mail"
                      autoComplete="username"
                      required
                      className={inputClassName}
                    />
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

        <div className="flex min-h-28 items-center justify-center bg-[#2d3767] px-6 py-7 text-center">
          <div>
            <p className="text-sm font-medium text-white/80">FINQZ PRO</p>
            <p className="mt-1 text-xs tracking-[0.24em] text-white/55">GESTÃO FINANCEIRA</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginScreen;
