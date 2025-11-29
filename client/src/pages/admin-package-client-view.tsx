/**
 * PACKAGE FEATURE MATRIX FOR ALL 4 PACKAGES
 * Complete Admin View of What Features Each Package Offers
 */
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

const PACKAGES_FEATURES = [
  {
    name: 'Fit Basics',
    price: '₹2,500',
    color: 'blue',
    features: {
      'Workout Plans': true,
      'Basic Diet': true,
      'Recorded Videos': true,
      'Personalized Diet': false,
      'Weekly Check-ins': false,
      '1-on-1 Calls': false,
      'Habit Coaching': false,
      'Performance Tracking': false,
      'Priority Support': false,
    },
    durations: ['4 weeks', '8 weeks', '12 weeks'],
  },
  {
    name: 'Fit Plus',
    price: '₹5,000',
    color: 'green',
    features: {
      'Workout Plans': true,
      'Basic Diet': true,
      'Recorded Videos': true,
      'Personalized Diet': true,
      'Weekly Check-ins': true,
      '1-on-1 Calls': false,
      'Habit Coaching': false,
      'Performance Tracking': false,
      'Priority Support': false,
    },
    durations: ['4 weeks', '8 weeks', '12 weeks'],
  },
  {
    name: 'Pro Transformation',
    price: '₹7,500',
    color: 'purple',
    features: {
      'Workout Plans': true,
      'Basic Diet': true,
      'Recorded Videos': true,
      'Personalized Diet': true,
      'Weekly Check-ins': true,
      '1-on-1 Calls': true,
      'Habit Coaching': true,
      'Performance Tracking': false,
      'Priority Support': false,
    },
    durations: ['4 weeks', '8 weeks', '12 weeks'],
  },
  {
    name: 'Elite Athlete',
    price: '₹10,000',
    color: 'gold',
    features: {
      'Workout Plans': true,
      'Basic Diet': true,
      'Recorded Videos': true,
      'Personalized Diet': true,
      'Weekly Check-ins': true,
      '1-on-1 Calls': true,
      'Habit Coaching': true,
      'Performance Tracking': true,
      'Priority Support': true,
    },
    durations: ['4 weeks', '8 weeks', '12 weeks'],
  },
];

export default function AdminPackageClientView() {
  const style = { "--sidebar-width": "16rem" } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold">Package Features Matrix</h1>
            </div>
            <ThemeToggle />
          </header>

          <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Feature Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {PACKAGES_FEATURES.map((pkg) => (
                  <Card key={pkg.name} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        {pkg.name}
                        <Badge variant="outline" className={`text-${pkg.color}-600`}>
                          {pkg.price}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">DURATION OPTIONS</p>
                          <div className="space-y-1">
                            {pkg.durations.map((d) => (
                              <p key={d} className="text-sm">✓ {d}</p>
                            ))}
                          </div>
                        </div>
                        
                        <div className="border-t pt-3">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">FEATURES</p>
                          <div className="space-y-2">
                            {Object.entries(pkg.features).map(([feature, hasFeature]) => (
                              <div key={feature} className="flex items-center gap-2 text-sm">
                                {hasFeature ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <X className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className={hasFeature ? '' : 'text-muted-foreground'}>
                                  {feature}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Management Instructions */}
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-lg">How to Manage Client Packages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold mb-1">1. Create/Edit Client</p>
                    <p className="text-muted-foreground">When creating a client, select their package and access duration (4, 8, or 12 weeks)</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">2. Manage Subscriptions</p>
                    <p className="text-muted-foreground">Go to Package Management to view all clients, their subscription status, and renewal dates</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">3. Handle Renewals</p>
                    <p className="text-muted-foreground">When a client's subscription is expiring (7 days left), renew or upgrade them</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">4. Feature Access</p>
                    <p className="text-muted-foreground">Trainers and clients can only access features available in their package tier</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}
