import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Clock, RefreshCw } from "lucide-react";

export default function AdminSubscriptionAlerts() {
  const style = { "--sidebar-width": "16rem" } as React.CSSProperties;

  const { data: alerts = { expiring_soon: [], expired: [] }, refetch } = useQuery({
    queryKey: ['/api/admin/subscription-alerts'],
  });

  const totalAlerts = (alerts.expiring_soon?.length || 0) + (alerts.expired?.length || 0);

  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold">Subscription Alerts</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Expiring Soon</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">{alerts.expiring_soon?.length || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Within 7 days</p>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Expired</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{alerts.expired?.length || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">No longer active</p>
                  </CardContent>
                </Card>
              </div>

              {totalAlerts === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">All subscriptions are active and healthy!</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Expiring Soon */}
                  {alerts.expiring_soon && alerts.expiring_soon.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        Expiring Soon ({alerts.expiring_soon.length})
                      </h2>
                      {alerts.expiring_soon.map((alert: any) => (
                        <Card key={alert.clientId} className="border-yellow-200 dark:border-yellow-800">
                          <CardContent className="pt-6 flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{alert.clientName}</p>
                              <p className="text-sm text-muted-foreground">{alert.packageName}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                {alert.daysLeft} days left
                              </Badge>
                              <Button size="sm" variant="outline" className="mt-2 w-full">
                                Renew
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Expired */}
                  {alerts.expired && alerts.expired.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        Expired ({alerts.expired.length})
                      </h2>
                      {alerts.expired.map((alert: any) => (
                        <Card key={alert.clientId} className="border-red-200 dark:border-red-800">
                          <CardContent className="pt-6 flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{alert.clientName}</p>
                              <p className="text-sm text-muted-foreground">{alert.packageName}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="destructive" className="mb-2">
                                Expired {alert.expiredSince} day{alert.expiredSince > 1 ? 's' : ''} ago
                              </Badge>
                              <Button size="sm" variant="default" className="w-full">
                                Renew Now
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>

    </div>
  </SidebarProvider>
  );
}
