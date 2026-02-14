import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      navigate("/");
    }, 800);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info text-info-foreground font-bold">
            FS
          </div>
          <span className="text-xl font-bold text-primary-foreground">FrotaSênior AI</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-primary-foreground leading-tight">
            Gestão inteligente<br />para sua frota
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-md">
            Controle 850+ veículos com IA integrada. Manutenção preventiva, combustível, 
            pneus e relatórios executivos em uma única plataforma.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold text-info">850+</p>
              <p className="text-sm text-primary-foreground/60">Veículos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-info">8</p>
              <p className="text-sm text-primary-foreground/60">Unidades</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-info">24/7</p>
              <p className="text-sm text-primary-foreground/60">Monitoramento</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-primary-foreground/40">© 2026 FrotaSênior AI — Todos os direitos reservados</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
              FS
            </div>
            <span className="text-xl font-bold text-foreground">FrotaSênior AI</span>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h2>
            <p className="text-sm text-muted-foreground">Entre com suas credenciais para acessar o sistema</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analista@empresa.com.br"
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Esqueceu a senha? Contate o administrador do sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
