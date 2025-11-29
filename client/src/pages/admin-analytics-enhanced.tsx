import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, TrendingDown, Activity, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MonthlyTrend {
  month: string;
  revenue: number;
  clients: number;
  newClients: number;
}

interface GrowthMetrics {
  thisMonth: number;
  lastMonth: number;
  growthRate: number;
  lastMonthGrowthRate: number;
  totalClients: number;
  packageStats: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
}

interface ClientTimeline {
  month: string;
  newClients: number;
  totalClients: number;
}

export default function AdminAnalyticsEnhanced() {
  const style = { "--sidebar-width": "16rem" };

  const { data: monthlyTrends = [], isLoading: trendsLoading } = useQuery<MonthlyTrend[]>({
    queryKey: ['/api/analytics/monthly-trends'],
  });

  const { data: growthMetrics, isLoading: metricsLoading } = useQuery<GrowthMetrics>({
    queryKey: ['/api/analytics/growth-metrics'],
  });

  const { data: clientTimeline = [], isLoading: timelineLoading } = useQuery<ClientTimeline[]>({
    queryKey: ['/api/analytics/client-timeline'],
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['/api/clients'],
  });

  const { data: packages = [] } = useQuery<any[]>({
    queryKey: ['/api/packages'],
  });

  const { data: videos = [] } = useQuery<any[]>({
    queryKey: ['/api/videos'],
  });

  // Get payment statistics from backend
  const { data: paymentStats, isLoading: statsLoading } = useQuery<{
    totalRevenue: number;
    paymentsDue: number;
    paymentsOverdue: number;
    pendingCount: number;
    overdueCount: number;
    completedCount: number;
    growthRate: number;
    lastMonthRevenue: number;
  }>({
    queryKey: ['/api/payments/stats'],
  });

  // Calculate metrics
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const monthlyRevenue = paymentStats?.totalRevenue || 0;
  const revenueGrowthRate = paymentStats?.growthRate || 0;

  const isGrowthPositive = (growthMetrics?.growthRate || 0) >= 0;

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-2xl font-display font-bold tracking-tight">Analytics & Growth</h1>
            </div>
            <ThemeToggle />
          </header>

          <main className="flex-1 overflow-auto p-8 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <div className="max-w-7xl mx-auto space-y-8">
              <div>
                <p className="text-muted-foreground">
                  Comprehensive analytics dashboard with revenue trends, client growth, and business insights
                </p>
              </div>

              <div className="space-y-8">
              {/* Key Metrics Row */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Total Clients" 
                  value={totalClients} 
                  icon={Users} 
                  trend={`${activeClients} active`} 
                  trendUp={true} 
                />
                <StatCard 
                  title="Monthly Revenue" 
                  value={statsLoading ? 'Loading...' : `₹${monthlyRevenue.toLocaleString()}`} 
                  icon={DollarSign} 
                  trend={`${revenueGrowthRate > 0 ? '+' : ''}${revenueGrowthRate.toFixed(1)}% vs last month`} 
                  trendUp={revenueGrowthRate > 0} 
                />
                <StatCard 
                  title="Growth Rate" 
                  value={`${growthMetrics?.growthRate || 0}%`} 
                  icon={isGrowthPositive ? TrendingUp : TrendingDown} 
                  trend={`vs last month`} 
                  trendUp={isGrowthPositive} 
                />
                <StatCard 
                  title="New This Month" 
                  value={growthMetrics?.thisMonth || 0} 
                  icon={Activity} 
                  trend={`${growthMetrics?.lastMonth || 0} last month`} 
                  trendUp={true} 
                />
              </div>

              {/* Revenue & Client Trends */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">Revenue Trend (6 Months)</CardTitle>
                    <p className="text-sm text-muted-foreground">Monthly revenue with client correlation</p>
                  </CardHeader>
                  <CardContent>
                    {trendsLoading ? (
                      <div className="h-80 flex items-center justify-center">
                        <p className="text-muted-foreground">Loading...</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={320}>
                        <AreaChart data={monthlyTrends}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                            formatter={(value: number) => `₹${value.toLocaleString()}`}
                          />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="hsl(var(--chart-3))" 
                            fill="hsl(var(--chart-3))" 
                            fillOpacity={0.3}
                            name="Revenue (₹)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">Client Growth Timeline</CardTitle>
                    <p className="text-sm text-muted-foreground">Historical client acquisition data</p>
                  </CardHeader>
                  <CardContent>
                    {timelineLoading ? (
                      <div className="h-80 flex items-center justify-center">
                        <p className="text-muted-foreground">Loading...</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={clientTimeline}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="totalClients" 
                            stroke="hsl(var(--chart-1))" 
                            strokeWidth={2}
                            name="Total Clients"
                            dot={{ r: 4 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="newClients" 
                            stroke="hsl(var(--chart-2))" 
                            strokeWidth={2}
                            name="New Clients"
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Acquisitions & Package Distribution */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">Monthly Client Acquisitions</CardTitle>
                    <p className="text-sm text-muted-foreground">New clients per month</p>
                  </CardHeader>
                  <CardContent>
                    {trendsLoading ? (
                      <div className="h-80 flex items-center justify-center">
                        <p className="text-muted-foreground">Loading...</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={monthlyTrends}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          />
                          <Legend />
                          <Bar 
                            dataKey="newClients" 
                            fill="hsl(var(--chart-2))" 
                            name="New Clients"
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">Package Distribution</CardTitle>
                    <p className="text-sm text-muted-foreground">Client subscription breakdown</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {metricsLoading ? (
                      <div className="h-80 flex items-center justify-center">
                        <p className="text-muted-foreground">Loading...</p>
                      </div>
                    ) : (
                      <>
                        {growthMetrics?.packageStats.map((pkg, index) => {
                          const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];
                          const color = colors[index % colors.length];
                          return (
                            <div key={pkg.name} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{pkg.name}</span>
                                <span className="text-muted-foreground">
                                  {pkg.count} clients ({pkg.percentage}%)
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2.5">
                                <div
                                  className="h-2.5 rounded-full transition-all"
                                  style={{ 
                                    width: `${pkg.percentage}%`,
                                    backgroundColor: color
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Growth Metrics Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display">Growth Metrics Summary</CardTitle>
                  <p className="text-sm text-muted-foreground">Month-over-month growth analysis</p>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-chart-1" />
                        <p className="text-sm font-medium text-muted-foreground">This Month</p>
                      </div>
                      <p className="text-3xl font-bold">{growthMetrics?.thisMonth || 0}</p>
                      <p className="text-xs text-muted-foreground">New client sign-ups</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className={`h-5 w-5 ${isGrowthPositive ? 'text-chart-3' : 'text-chart-2'}`} />
                        <p className="text-sm font-medium text-muted-foreground">Growth Rate</p>
                      </div>
                      <p className={`text-3xl font-bold ${isGrowthPositive ? 'text-chart-3' : 'text-chart-2'}`}>
                        {isGrowthPositive ? '+' : ''}{growthMetrics?.growthRate || 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">vs last month ({growthMetrics?.lastMonth || 0} clients)</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-chart-1" />
                        <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                      </div>
                      <p className="text-3xl font-bold">{growthMetrics?.totalClients || 0}</p>
                      <p className="text-xs text-muted-foreground">All-time registered members</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display">System Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="flex items-start gap-3 pb-3 border-b md:border-b-0 md:border-r">
                      <Users className="h-5 w-5 text-chart-1 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">Active Clients</p>
                        <p className="text-2xl font-bold mt-1">{activeClients}</p>
                        <p className="text-xs text-muted-foreground mt-1">Out of {totalClients} total</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 pb-3 border-b md:border-b-0 md:border-r">
                      <Activity className="h-5 w-5 text-chart-2 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">Video Library</p>
                        <p className="text-2xl font-bold mt-1">{videos.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">Available workouts</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-chart-3 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">Monthly Revenue</p>
                        <p className="text-2xl font-bold mt-1">₹{monthlyRevenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">Recurring income</p>
                      </div>
                    </div>
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
