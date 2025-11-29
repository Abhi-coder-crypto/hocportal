import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { StatCard } from "@/components/stat-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { Users, Activity, DollarSign, TrendingUp, UserPlus, Video, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const style = {
    "--sidebar-width": "16rem",
  };

  const { data: authData } = useQuery<any>({
    queryKey: ['auth', 'admin'],
    queryFn: async () => {
      // Use specific admin token from sessionStorage, not trainer token
      const token = sessionStorage.getItem('adminToken');
      if (!token) throw new Error('Admin not logged in');
      
      const response = await fetch('/api/auth/me?role=admin', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch auth');
      return response.json();
    }
  });

  const user = authData?.user;

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const token = sessionStorage.getItem('adminToken');
      if (!token) throw new Error('Admin not logged in');
      const response = await fetch('/api/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    }
  });

  const { data: trainers = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/trainers'],
    queryFn: async () => {
      const token = sessionStorage.getItem('adminToken');
      if (!token) throw new Error('Admin not logged in');
      const response = await fetch('/api/admin/trainers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch trainers');
      return response.json();
    }
  });

  const { data: packages = [] } = useQuery<any[]>({
    queryKey: ['/api/packages'],
    queryFn: async () => {
      const token = sessionStorage.getItem('adminToken');
      if (!token) throw new Error('Admin not logged in');
      const response = await fetch('/api/packages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch packages');
      return response.json();
    }
  });

  const packageById = packages.reduce((map, pkg) => {
    map[pkg._id] = pkg;
    return map;
  }, {} as Record<string, any>);

  const clientsWithPackages = clients.map(client => {
    const packageId = typeof client.packageId === 'object' ? client.packageId._id : client.packageId;
    const pkg = packageById[packageId];
    return {
      ...client,
      packageData: pkg || null
    };
  });

  const totalClients = clients.length;
  const activeClients = clientsWithPackages.filter(c => c.packageData).length;
  
  const monthlyRevenue = clientsWithPackages.reduce((sum, client) => {
    return sum + (client.packageData?.price || 0);
  }, 0);

  // Filter to show only active/unique packages (remove duplicates)
  const uniquePackages = packages.filter((pkg, index) => {
    return packages.findIndex(p => p.name === pkg.name) === index;
  });

  const recentClients = [...clientsWithPackages]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4)
    .map(client => ({
      name: client.name,
      package: client.packageData?.name || 'No Package',
      joinedDate: new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: client.packageData ? 'active' : 'inactive',
    }));

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full overflow-hidden">
        <AdminSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 border-b min-h-[56px]">
            <div className="flex items-center gap-2 sm:gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight">
                Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-semibold text-sm">
                    {user.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="text-sm hidden sm:block">
                    <p className="font-medium">{user.name || 'Admin'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              )}
              <NotificationBell />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                <StatCard
                  title="Total Clients"
                  value={totalClients}
                  icon={Users}
                  trend={`${activeClients} active`}
                  trendUp={true}
                  colorScheme="red"
                />
                <StatCard
                  title="Active Users"
                  value={activeClients}
                  icon={Activity}
                  trend={`${totalClients - activeClients} inactive`}
                  trendUp={true}
                  colorScheme="green"
                />
                <StatCard
                  title="Total Trainers"
                  value={trainers.length}
                  icon={UserCheck}
                  trend="Team members"
                  trendUp={true}
                  colorScheme="purple"
                />
                <StatCard
                  title="Monthly Revenue"
                  value={`₹${monthlyRevenue.toLocaleString()}`}
                  icon={DollarSign}
                  trend={`From ${activeClients} active clients`}
                  trendUp={true}
                  colorScheme="orange"
                />
                <StatCard
                  title="Packages Available"
                  value={uniquePackages.length}
                  icon={TrendingUp}
                  trend="Membership plans"
                  trendUp={true}
                  colorScheme="pink"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-t-lg">
                    <CardTitle className="font-display text-amber-900 dark:text-amber-100">Recent Clients</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {recentClients.map((client, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-4 p-4 rounded-lg bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10 dark:to-transparent border border-amber-100 dark:border-amber-800/30 hover-elevate transition-all"
                          data-testid={`row-client-${index}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm" data-testid="text-client-name">
                              {client.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Joined {client.joinedDate}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-xs" data-testid="badge-package">
                              {client.package}
                            </Badge>
                            <Badge
                              className={`text-xs font-semibold ${
                                client.status === "active"
                                  ? "bg-green-500/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700"
                                  : "bg-gray-500/20 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
                              }`}
                              data-testid="badge-status"
                            >
                              {client.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setLocation('/admin/clients')}
                      data-testid="button-view-all-clients"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      View All Clients
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-t-lg">
                    <CardTitle className="font-display text-orange-900 dark:text-orange-100">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    <Button 
                      className="w-full justify-start bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700" 
                      variant="ghost"
                      onClick={() => setLocation('/admin/videos')}
                      data-testid="button-add-video"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Add New Video
                    </Button>
                    <Button 
                      className="w-full justify-start bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700" 
                      variant="ghost"
                      onClick={() => setLocation('/admin/sessions')}
                      data-testid="button-schedule-session"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Schedule Live Session
                    </Button>
                    <Button 
                      className="w-full justify-start bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700" 
                      variant="ghost"
                      onClick={() => setLocation('/admin/diet')}
                      data-testid="button-create-diet"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Create Diet Plan
                    </Button>
                    <Button 
                      className="w-full justify-start bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700" 
                      variant="ghost"
                      onClick={() => setLocation('/admin/analytics')}
                      data-testid="button-view-analytics"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}
