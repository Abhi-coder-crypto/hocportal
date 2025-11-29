import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TrainerSidebar } from "@/components/trainer-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Dumbbell } from "lucide-react";

export default function TrainerWorkouts() {
  const { data: authData } = useQuery<any>({
    queryKey: ['/api/auth/me']
  });

  const user = authData?.user;
  const trainerId = user?._id?.toString() || user?.id;

  const { data: workoutPlans = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/trainers', trainerId, 'workout-plans'],
    enabled: !!trainerId
  });

  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <TrainerSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-2xl font-display font-bold tracking-tight">
                Workout Plans
              </h1>
            </div>
            <ThemeToggle />
          </header>

          <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold">Workout Plans for Your Clients</h2>
                <p className="text-sm text-muted-foreground mt-2">Manage workout plans plus shared admin templates</p>
              </div>

              {isLoading ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Loading workout plans...
                  </CardContent>
                </Card>
              ) : workoutPlans.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    No workout plans created yet
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {workoutPlans.map((plan) => (
                    <Card key={plan._id} className="hover-elevate" data-testid={`card-plan-${plan._id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="line-clamp-1">{plan.name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">{plan.description || plan.goal}</p>
                          </div>
                          <div className="flex gap-2">
                            {plan.isTemplate && (
                              <Badge variant="secondary">Admin Template</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Duration</p>
                            <p className="font-semibold">{plan.durationWeeks || plan.duration || 4} weeks</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Goal</p>
                            <p className="font-semibold">{plan.goal || 'N/A'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

  </SidebarProvider>
  );
}
