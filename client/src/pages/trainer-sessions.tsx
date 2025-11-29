import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TrainerSidebar } from "@/components/trainer-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Users, Video as VideoIcon, Plus } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LiveSession {
  _id: string;
  title: string;
  description?: string;
  sessionType: string;
  scheduledAt: string | Date;
  duration: number;
  meetingLink?: string;
  trainerName?: string;
  maxCapacity: number;
  currentCapacity: number;
  status: string;
  joinUrl?: string;
  startUrl?: string;
}

const SESSION_TYPES = ["Power Yoga", "HIIT", "Cardio Bootcamp", "Strength Building", "Flexibility"];

const sessionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  scheduledAt: z.string().min(1, "Date and time are required"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  maxCapacity: z.coerce.number().min(1, "Capacity must be at least 1"),
});

type SessionFormData = z.infer<typeof sessionSchema>;

export default function TrainerSessions() {
  const style = {
    "--sidebar-width": "16rem",
  };

  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: "",
      scheduledAt: "",
      duration: 60,
      maxCapacity: 15,
    },
  });

  const { data: authData } = useQuery<any>({
    queryKey: ['/api/auth/me']
  });

  const user = authData?.user;
  const trainerId = user?._id?.toString() || user?.id;

  const { data: sessions = [], isLoading } = useQuery<LiveSession[]>({
    queryKey: ['/api/trainers', trainerId, 'sessions'],
    enabled: !!trainerId
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: SessionFormData) => {
      return await apiRequest("POST", "/api/sessions", {
        ...data,
        scheduledAt: new Date(data.scheduledAt),
        currentCapacity: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trainers', trainerId, 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({ title: "Success", description: "Session created successfully" });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create session", variant: "destructive" });
    },
  });

  const createZoomMeetingMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return await apiRequest("POST", `/api/sessions/${sessionId}/create-zoom`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trainers', trainerId, 'sessions'] });
      toast({ title: "Success", description: "Zoom meeting created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create Zoom meeting", variant: "destructive" });
    },
  });

  const upcomingSessions = sessions.filter((s: LiveSession) => 
    s.status === 'upcoming' && new Date(s.scheduledAt) > new Date()
  ).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const pastSessions = sessions.filter((s: LiveSession) => 
    s.status === 'completed' || new Date(s.scheduledAt) <= new Date()
  ).sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const onSubmit = (data: SessionFormData) => {
    createSessionMutation.mutate(data);
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
                Live Sessions
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                data-testid="button-create-session"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Session
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">{upcomingSessions.length}</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Completed Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{pastSessions.length}</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{sessions.length}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingSessions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No upcoming sessions</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingSessions.map((session: LiveSession) => (
                        <Card key={session._id} className="hover-elevate">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="h-10 w-10 rounded-md bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white">
                                    <Calendar className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold">{session.title}</h3>
                                    <p className="text-sm text-muted-foreground">{session.description}</p>
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{format(new Date(session.scheduledAt), 'PPp')}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>{session.currentCapacity || 0}/{session.maxCapacity || 10} participants</span>
                                  </div>
                                  <Badge variant="default">
                                    {session.sessionType || 'Group'}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-2">
                                {!session.joinUrl && session.status === "upcoming" && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => createZoomMeetingMutation.mutate(session._id)}
                                    data-testid={`button-create-zoom-${session._id}`}
                                    disabled={createZoomMeetingMutation.isPending}
                                  >
                                    <VideoIcon className="h-4 w-4 mr-1" />
                                    Create Zoom
                                  </Button>
                                )}
                                {session.joinUrl && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(session.joinUrl, '_blank')}
                                    data-testid={`button-join-${session._id}`}
                                  >
                                    <VideoIcon className="h-4 w-4 mr-2" />
                                    Start Session
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Past Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  {pastSessions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No past sessions</p>
                  ) : (
                    <div className="space-y-2">
                      {pastSessions.slice(0, 10).map((session: LiveSession) => (
                        <div key={session._id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                          <div className="flex-1">
                            <p className="font-medium">{session.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(session.scheduledAt), 'PPp')}
                            </p>
                          </div>
                          <Badge variant="secondary">{session.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-session">
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>Schedule a new live training session for your clients</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Power Yoga Session" {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-scheduled-at" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-duration"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="maxCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-max-capacity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSessionMutation.isPending} data-testid="button-submit-session">
                  {createSessionMutation.isPending ? "Creating..." : "Create Session"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <MobileNavigation />
    </div>
  );
}
