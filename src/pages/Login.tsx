import * as React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/src/context/AuthContext';
import { toast } from 'sonner';

const AUTH_API = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/auctions', '/auth')
  : "http://localhost:3001/api/auth";

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${AUTH_API}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao realizar login');
      }

      login(data.token, data.user);
      toast.success(`Bem-vindo de volta, ${data.user.nome}!`);
    } catch (err: any) {
      setError(err.message || 'Falha na conexão com o servidor.');
      toast.error(err.message || 'Falha na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Leilão Hub</span>
      </div>
      <div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Entrar na plataforma</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Acesse a base nacional unificada e gerencie seu estoque.
        </p>
      </div>

      <div className="mt-2">
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3.5 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/50">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">E-mail corporativo</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nome@empresa.com.br" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-white dark:bg-slate-900"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Senha</Label>
                <Link to="#" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                  Esqueceu a senha?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Autenticando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
