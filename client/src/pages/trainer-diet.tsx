import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TrainerSidebar } from "@/components/trainer-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { UtensilsCrossed, Dumbbell, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { DietTemplateList } from "@/components/diet-template-list";
import { WorkoutPlanTemplates } from "@/components/workout-plan-templates";
import { Card, CardContent } from "@/components/ui/card";

export default function TrainerDiet() {
  const style = { "--sidebar-width": "16rem" };

  const { data: authData } = useQuery<any>({
    queryKey: ['/api/auth/me']
  });

  const user = authData?.user;
  const trainerId = user?._id?.toString() || user?.id;

  // Fetch trainer's client assignments
  const { data: clientAssignments = [], isLoading: isLoadingAssignments } = useQuery<any[]>({
    queryKey: ['/api/trainers', trainerId, 'clients'],
    enabled: !!trainerId
  });

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <TrainerSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
                <UtensilsCrossed className="h-6 w-6 text-primary" />
                Diet & Workout Management
              </h1>
            </div>
            <ThemeToggle />
          </header>

          <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <div className="max-w-7xl mx-auto">
              <Tabs defaultValue="diet" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="diet" data-testid="tab-diet-templates">
                    <UtensilsCrossed className="h-4 w-4 mr-2" />
                    Diet Templates
                  </TabsTrigger>
                  <TabsTrigger value="workout" data-testid="tab-workout-plans">
                    <Dumbbell className="h-4 w-4 mr-2" />
                    Workout Plans
                  </TabsTrigger>
                  <TabsTrigger value="assignments" data-testid="tab-assignments">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Diet & Workout Assignments
                  </TabsTrigger>
                </TabsList>

                {/* Diet Templates Tab */}
                <TabsContent value="diet" className="space-y-4">
                  <DietTemplateList isTrainer={true} trainerId={trainerId} />
                </TabsContent>

                {/* Workout Plans Tab */}
                <TabsContent value="workout" className="space-y-4">
                  <WorkoutPlanTemplates isTrainer={true} trainerId={trainerId} />
                </TabsContent>

                {/* My Assignments Tab */}
                <TabsContent value="assignments" className="space-y-4">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold">Diet & Workout Assignments</h2>
                    <p className="text-sm text-muted-foreground mt-1">View diet and workout plans you've assigned to your {clientAssignments.length} clients</p>
                  </div>

                  {isLoadingAssignments ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        Loading assignments...
                      </CardContent>
                    </Card>
                  ) : clientAssignments.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        You have no assigned clients yet.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {clientAssignments.map((client: any) => (
                        <Card key={client._id} className="hover-elevate" data-testid={`card-assignment-${client._id}`}>
                          <CardContent className="pt-6 space-y-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold">{client.name}</h3>
                                <p className="text-sm text-muted-foreground">{client.email}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium mb-2">Diet Plans</p>
                                <p className="text-sm text-muted-foreground">{client.dietPlans?.length || 0} assigned</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-2">Workout Plans</p>
                                <p className="text-sm text-muted-foreground">{client.workoutPlans?.length || 0} assigned</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

    </div>
  </SidebarProvider>
  );
}
