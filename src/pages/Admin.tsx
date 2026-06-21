import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Building2, Server, History, Cog } from 'lucide-react';
import { TENANTS, USERS, AUCTIONEERS } from '@/src/data/mock';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function Admin() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Administração</h2>
        <p className="text-muted-foreground mt-2">
          Gerenciamento global de inquilinos (Tenants), usuários e integrações. (Acesso Restrito)
        </p>
      </div>

      <Tabs defaultValue="tenants" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tenants" className="flex gap-2"><Building2 className="w-4 h-4" /> Empresas</TabsTrigger>
          <TabsTrigger value="users" className="flex gap-2"><Users className="w-4 h-4" /> Usuários Globais</TabsTrigger>
          <TabsTrigger value="integrations" className="flex gap-2"><Server className="w-4 h-4" /> Crawlers/Integrações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Empresas Cadastradas</CardTitle>
              <CardDescription>Visão geral de todos os clientes B2B na plataforma.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TENANTS.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-mono text-xs">{tenant.id}</TableCell>
                      <TableCell className="font-medium">{tenant.nome}</TableCell>
                      <TableCell>
                        <Badge variant={tenant.plano === 'Pro' ? 'default' : 'secondary'}>{tenant.plano}</Badge>
                      </TableCell>
                      <TableCell>
                         <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">Ativo</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Gerenciar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
               <CardTitle>Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Tenant ID</TableHead>
                    <TableHead>Cargo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {USERS.slice(0, 15).map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nome}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[100px] truncate">{u.tenantId}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'Admin' ? 'default' : 'secondary'}>{u.role}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Status dos Crawlers</CardTitle>
              <CardDescription>Monitoramento das automações que alimentam a base nacional.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leiloeiro</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Última Sincronização</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {AUCTIONEERS.map((a, i) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.nome}</TableCell>
                      <TableCell>{i % 2 === 0 ? 'A cada 30 min' : 'A cada 1 hora'}</TableCell>
                      <TableCell>{new Date().toLocaleString('pt-BR')}</TableCell>
                      <TableCell>
                         <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">Sincronizado</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
