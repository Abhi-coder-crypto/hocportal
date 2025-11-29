import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TrainerSidebar } from "@/components/trainer-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Plus, Trash2, Eye } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TrainerHabits() {
  const style = {
    "--sidebar-width": "16rem",
  };

  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [habitName, setHabitName] = useState("");
  const [habitDescription, setHabitDescription] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [viewingHabitId, setViewingHabitId] = useState<string | null>(null);

  // Get trainer ID from auth
  const { data: authData } = useQuery<any>({
    queryKey: ["auth", "trainer"],
    queryFn: async () => {
      const token = sessionStorage.getItem("trainerToken");
      if (!token) throw new Error("Trainer not logged in");
      const response = await fetch("/api/auth/me?role=trainer", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch auth");
      return response.json();
    },
  });

  const trainerId = authData?.user?._id?.toString() || authData?.user?.id;

  // Get trainer's clients (Pro/Elite only)
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/trainers", trainerId, "clients"],
    queryFn: async () => {
      const token = sessionStorage.getItem("trainerToken");
      if (!token) throw new Error("Trainer not logged in");
      const response = await fetch(`/api/trainers/${trainerId}/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch clients");
      const allClients = await response.json();
      // Filter for Pro/Elite packages
      return allClients.filter((c: any) => {
        const pkg = c.packageId?.name || c.packageName || "";
        return pkg.includes("Pro") || pkg.includes("Elite");
      });
    },
    enabled: !!trainerId,
  });

  // Get all habits for trainer
  const { data: habits = [] } = useQuery<any[]>({
    queryKey: ["/api/trainers", trainerId, "habits"],
    queryFn: async () => {
      const token = sessionStorage.getItem("trainerToken");
      const response = await fetch(`/api/trainers/${trainerId}/habits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch habits");
      return response.json();
    },
    enabled: !!trainerId,
  });

  // Get logs for a habit
  const { data: habitLogs = [] } = useQuery<any[]>({
    queryKey: ["/api/habits", viewingHabitId, "logs"],
    queryFn: async () => {
      const response = await fetch(`/api/habits/${viewingHabitId}/logs`);
      if (!response.ok) throw new Error("Failed to fetch logs");
      return response.json();
    },
    enabled: !!viewingHabitId,
  });

  // Create habit mutation
  const createHabitMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/habits", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainers", trainerId, "habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/habits"] });
      setIsAddDialogOpen(false);
      setSelectedClient("");
      setHabitName("");
      setHabitDescription("");
      setFrequency("daily");
      toast({
        title: "Success",
        description: "Habit assigned successfully",
      });
    },
    onError: (error: any) => {
      console.error("Habit creation error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to assign habit",
        variant: "destructive",
      });
    },
  });

  // Delete habit mutation
  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      return apiRequest("DELETE", `/api/habits/${habitId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainers", trainerId, "habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Success",
        description: "Habit deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete habit",
        variant: "destructive",
      });
    },
  });

  const handleAddHabit = async () => {
    if (!selectedClient || !habitName || !trainerId) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createHabitMutation.mutate({
      clientId: selectedClient,
      name: habitName,
      description: habitDescription,
      frequency,
    });
  };

  const getCompletionRate = (habit: any) => {
    const logs = habitLogs.filter((l: any) => l.habitId === habit._id);
    if (logs.length === 0) return 0;
    const completed = logs.filter((l: any) => l.completed).length;
    return Math.round((completed / logs.length) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <TrainerSidebar />
          <div className="flex flex-col flex-1">
            <header className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <h1 className="text-2xl font-bold">Habit Tracking</h1>
              </div>
              <ThemeToggle />
            </header>

            <main className="flex-1 overflow-auto p-6">
              <div className="max-w-6xl mx-auto space-y-6">
                {/* Header with Add Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground">
                      Assign and track daily habits for your Pro/Elite clients
                    </p>
                  </div>
                  <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Assign New Habit
                  </Button>
                </div>

                {/* Habits by Client */}
                {clients.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">
                        No Pro/Elite clients assigned to you yet
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  clients.map((client: any) => {
                    const clientHabits = habits.filter((h: any) => h.clientId === client._id);
                    return (
                      <Card key={client._id}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div>
                              <p>{client.name}</p>
                              <p className="text-sm font-normal text-muted-foreground">
                                {client.packageId?.name || "Pro/Elite"}
                              </p>
                            </div>
                            <Badge variant="outline">{clientHabits.length} habits</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {clientHabits.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                              No habits assigned yet
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {clientHabits.map((habit: any) => {
                                const completionRate = getCompletionRate(habit);
                                return (
                                  <div
                                    key={habit._id}
                                    className="border rounded-lg p-4 space-y-3"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="font-semibold">{habit.name}</p>
                                        {habit.description && (
                                          <p className="text-sm text-muted-foreground">
                                            {habit.description}
                                          </p>
                                        )}
                                        <Badge className="mt-2">{habit.frequency}</Badge>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => setViewingHabitId(habit._id)}
                                          data-testid={`button-view-habit-${habit._id}`}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => deleteHabitMutation.mutate(habit._id)}
                                          data-testid={`button-delete-habit-${habit._id}`}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                      <span className="text-sm text-muted-foreground">
                                        {completionRate}% completion rate
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}

                {/* Logs Viewer */}
                {viewingHabitId && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Habit Completion Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {habitLogs.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No logs yet</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {habitLogs.map((log: any) => (
                            <div
                              key={log._id}
                              className="flex items-center justify-between p-3 border rounded"
                            >
                              <div>
                                <p className="text-sm">
                                  {new Date(log.date).toLocaleDateString()}
                                </p>
                                {log.notes && (
                                  <p className="text-xs text-muted-foreground">{log.notes}</p>
                                )}
                              </div>
                              <Badge variant={log.completed ? "default" : "secondary"}>
                                {log.completed ? "Completed" : "Pending"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => setViewingHabitId(null)}
                      >
                        Close
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>

      {/* Add Habit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign New Habit</DialogTitle>
            <DialogDescription>
              Create a new daily habit for your client to track
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Select Client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger data-testid="select-client-habit">
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client: any) => (
                    <SelectItem key={client._id} value={client._id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="habitName">Habit Name</Label>
              <Input
                id="habitName"
                placeholder="e.g., Drink 3L Water"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                data-testid="input-habit-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="habitDescription">Description (Optional)</Label>
              <Textarea
                id="habitDescription"
                placeholder="Add any notes or instructions..."
                value={habitDescription}
                onChange={(e) => setHabitDescription(e.target.value)}
                data-testid="textarea-habit-description"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger data-testid="select-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              data-testid="button-cancel-habit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddHabit}
              disabled={createHabitMutation.isPending}
              data-testid="button-add-habit"
            >
              Assign Habit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MobileNavigation />
    </div>
  );
}
