import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ClientHeader } from "@/components/client-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileNavigation } from "@/components/mobile-navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ClientHabits() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string | null>(null);
  const [packageName, setPackageName] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("clientId");
    const pkg = localStorage.getItem("packageName");
    if (!id) {
      setLocation("/client-access");
    } else {
      setClientId(id);
      setPackageName(pkg || "");
    }
  }, [setLocation]);

  // Check if client has Pro or Elite package
  const isProOrElite = !!(packageName && (packageName.includes("Pro") || packageName.includes("Elite")));

  if (!isProOrElite) {
    return (
      <div className="min-h-screen bg-background">
        <ClientHeader currentPage="dashboard" packageName={packageName} />
        <MobileNavigation />
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    Upgrade to Pro or Elite
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Habit tracking is available for Pro and Elite package clients. Contact your trainer to upgrade.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get habits for client
  const { data: habits = [] } = useQuery<any[]>({
    queryKey: ["/api/habits/client", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const response = await fetch(`/api/habits/client/${clientId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!clientId,
  });

  // Get today's logs
  const { data: todayLogs = [] } = useQuery<any[]>({
    queryKey: ["/api/habits", "today", clientId],
    queryFn: async () => {
      if (!clientId || habits.length === 0) return [];
      
      const today = new Date().toDateString();
      const logs: any[] = [];

      for (const habit of habits) {
        const response = await fetch(`/api/habits/${habit._id}/logs`);
        if (response.ok) {
          const habitLogs = await response.json();
          const todayLog = habitLogs.find(
            (l: any) => new Date(l.date).toDateString() === today
          );
          if (todayLog) {
            logs.push(todayLog);
          } else {
            // Create empty log for today
            logs.push({
              habitId: habit._id,
              date: new Date(),
              completed: false,
              _id: `temp-${habit._id}`,
            });
          }
        }
      }
      return logs;
    },
    enabled: !!clientId && habits.length > 0,
  });

  // Mark habit done mutation
  const markHabitMutation = useMutation({
    mutationFn: async ({ habitId, completed }: { habitId: string; completed: boolean }) => {
      const today = new Date();
      return apiRequest("POST", `/api/habits/${habitId}/log`, {
        completed,
        date: today,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits", "today", clientId] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/client", clientId] });
      toast({
        title: "Success",
        description: "Habit status updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update habit",
        variant: "destructive",
      });
    },
  });

  const toggleHabit = (habitId: string, currentStatus: boolean) => {
    markHabitMutation.mutate({
      habitId,
      completed: !currentStatus,
    });
  };

  const completedCount = todayLogs.filter((l: any) => l.completed).length;
  const totalCount = habits.length;

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader currentPage="dashboard" packageName={packageName} />
      <MobileNavigation />

      <div className="max-w-2xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Habits</h1>
          <p className="text-muted-foreground">Track your daily habits assigned by your trainer</p>
        </div>

        {/* Progress Summary */}
        {habits.length > 0 && (
          <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Progress</p>
                  <p className="text-3xl font-bold">
                    {completedCount}/{totalCount}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Habits List */}
        {habits.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                No habits assigned yet. Contact your trainer to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {habits.map((habit: any) => {
              const todayLog = todayLogs.find((l: any) => l.habitId === habit._id);
              const isCompleted = todayLog?.completed || false;

              return (
                <Card key={habit._id} className={isCompleted ? "border-green-200 bg-green-50 dark:bg-green-950/20" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{habit.name}</p>
                        {habit.description && (
                          <p className="text-sm text-muted-foreground mt-1">{habit.description}</p>
                        )}
                        <Badge className="mt-2">{habit.frequency}</Badge>
                      </div>
                      <Button
                        onClick={() => toggleHabit(habit._id, isCompleted)}
                        disabled={markHabitMutation.isPending}
                        variant={isCompleted ? "default" : "outline"}
                        className="gap-2 whitespace-nowrap"
                        data-testid={`button-mark-habit-${habit._id}`}
                      >
                        <CheckCircle2 className={`h-4 w-4 ${isCompleted ? "" : "opacity-50"}`} />
                        {isCompleted ? "Done Today" : "Mark Today Done"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <MobileNavigation />
    </div>
  );
}
