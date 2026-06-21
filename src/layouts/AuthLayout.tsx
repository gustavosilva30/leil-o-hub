import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <Outlet />
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1550131464-a5e2f75fd6ae?auto=format&fit=crop&q=80&w=2000"
          alt="Cars in an auction yard"
        />
        <div className="absolute inset-0 bg-zinc-900/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-80" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <h2 className="text-3xl font-bold mb-2">Leilão Hub Brasil</h2>
          <p className="text-xl opacity-80">A maior plataforma SaaS para gestão e agregação de leilões veiculares do país.</p>
        </div>
      </div>
    </div>
  );
}
