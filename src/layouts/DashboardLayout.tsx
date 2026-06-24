import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Building2, 
  LayoutDashboard, 
  Search, 
  Heart, 
  BellRing, 
  Settings, 
  LogOut,
  ShoppingCart,
  Wrench,
  Package,
  Users,
  BarChart3,
  Menu,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CURRENT_TENANT } from '@/src/data/mock';
import { useAuth } from '@/src/context/AuthContext';

const navigation = [
  { name: 'Dashboard Corporativo', href: '/', icon: LayoutDashboard },
  { name: 'Busca de Ativos', href: '/lots', icon: Search },
  { name: 'Meus Favoritos', href: '/favorites', icon: Heart },
  { name: 'Alertas Inteligentes', href: '/alerts', icon: BellRing },
  { name: 'Arrematações (Kanban)', href: '/purchases', icon: ShoppingCart },
  { name: 'Desmontagem', href: '/disassembly', icon: Wrench },
  { name: 'Sincronizar Leilões', href: '/auctions/sync', icon: RefreshCw },
  { name: 'Configurações', href: '/admin', icon: Settings },
];

export function DashboardLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 md:flex shrink-0">
        <div className="flex h-16 items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">LeilãoHub</span>
        </div>
        
        <div className="flex flex-col flex-1 overflow-y-auto w-full py-4 px-3 gap-1">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link key={item.name} to={item.href}>
                <Button 
                  variant="ghost"
                  className={`w-full justify-start font-medium ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:bg-blue-900/50 dark:text-blue-400' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
            <Avatar className="w-8 h-8">
              <AvatarImage src="" />
              <AvatarFallback className="bg-slate-300 dark:bg-slate-700">
                {user?.nome ? user.nome.substring(0, 2).toUpperCase() : 'US'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden flex-1">
              <span className="text-xs font-bold truncate">{user?.nome || 'Usuário'}</span>
              <span className="text-[10px] text-slate-500 truncate dark:text-slate-400">{user?.email || CURRENT_TENANT.nome}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 ml-auto text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700" 
              title="Sair"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-8 sticky top-0 z-10 transition-all">
          <div className="flex items-center gap-4 w-96">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative w-full hidden sm:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por chassi, modelo ou leiloeiro..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none placeholder:text-slate-400 dark:text-slate-200"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-medium text-slate-500">Atualizado há 2 min</span>
              <span className="text-xs font-bold text-green-600">● Conectado ao Core Brasil</span>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <BellRing className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
