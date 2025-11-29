import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function AdminRevenue() {
  const style = { "--sidebar-width": "16rem" };

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['/api/clients'],
  });

  const { data: packages = [] } = useQuery<any[]>({
    queryKey: ['/api/packages'],
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

  const packageRevenue = packages.map(pkg => {
    const clientCount = clientsWithPackages.filter(c => c.packageData?._id === pkg._id).length;
    return {
      package: pkg.name,
      price: pkg.price,
      clients: clientCount,
      revenue: clientCount * pkg.price,
    };
  });

  const totalRevenue = packageRevenue.reduce((sum, p) => sum + p.revenue, 0);
  const totalClients = clients.length;
  const avgPerClient = totalClients > 0 ? Math.round(totalRevenue / totalClients) : 0;

  const recentPayments = [...clientsWithPackages]
    .filter(c => c.packageData)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((client, index) => ({
      id: index + 1,
      client: client.name,
      package: client.packageData.name,
      amount: client.packageData.price,
      date: new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'paid',
    }));

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-2xl font-display font-bold tracking-tight">Revenue & Payments</h1>
            </div>
            <ThemeToggle />
          </header>

          <main className="flex-1 overflow-auto p-8 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Track revenue, payments, and financial analytics</p>
                <Button data-testid="button-export-report">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} trend={`From ${totalClients} clients`} trendUp={true} />
                <StatCard title="Avg per Client" value={`$${avgPerClient}`} icon={Users} trend={`${totalClients} total clients`} trendUp={true} />
                <StatCard title="Total Clients" value={totalClients} icon={CreditCard} trend={`${clientsWithPackages.filter(c => c.packageData).length} active`} trendUp={true} />
                <StatCard title="Packages" value={packages.length} icon={TrendingUp} trend="Available plans" trendUp={true} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="font-display">Current Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-accent/50 rounded-md">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Monthly Revenue</p>
                        <p className="text-3xl font-bold">${totalRevenue.toLocaleString()}</p>
                      </div>
                      <DollarSign className="h-12 w-12 text-chart-3 opacity-50" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Revenue Distribution</p>
                      {packageRevenue.length > 0 ? (
                        packageRevenue.map((pkg) => (
                          <div key={pkg.package} className="flex items-center justify-between text-sm">
                            <span>{pkg.package}</span>
                            <span className="text-muted-foreground">
                              {pkg.clients} × ${pkg.price} = <span className="font-semibold">${pkg.revenue}</span>
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No revenue data available</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">Revenue by Package</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {packageRevenue.map((pkg) => (
                      <div key={pkg.package} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{pkg.package}</span>
                          <span className="text-sm text-muted-foreground">
                            {pkg.clients} × ${pkg.price} = ${pkg.revenue}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              pkg.package === "Basic" ? "bg-chart-1" :
                              pkg.package === "Premium" ? "bg-chart-2" : "bg-chart-3"
                            }`}
                            style={{ width: `${(pkg.revenue / totalRevenue) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">Recent Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentPayments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-3 rounded-md border"
                          data-testid={`payment-${payment.id}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold">{payment.client}</p>
                            <p className="text-sm text-muted-foreground">{payment.date}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{payment.package}</Badge>
                            <span className="font-bold text-lg">${payment.amount}</span>
                            <Badge className={payment.status === "paid" ? "bg-chart-3" : "bg-chart-2"}>
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>

    </div>
  </SidebarProvider>
  );
}
