import * as React from 'react';

export interface User {
  id: number;
  email: string;
  nome: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const AUTH_API = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/auctions', '/auth')
  : "http://localhost:3001/api/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [token, setToken] = React.useState<string | null>(localStorage.getItem('leilao_hub_token'));
  const [loading, setLoading] = React.useState<boolean>(true);

  const fetchCurrentUser = React.useCallback(async (authToken: string) => {
    try {
      const response = await fetch(`${AUTH_API}/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token is invalid/expired
        localStorage.removeItem('leilao_hub_token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      // Don't log out immediately on network failure, but clean up state if it's unauthorized
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, [token, fetchCurrentUser]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('leilao_hub_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('leilao_hub_token');
    setToken(null);
    setUser(null);
  };

  const refetchUser = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
