import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar as CalendarIcon, Users, Clock, Trash2, UserPlus, List, Video, Copy } from "lucide-react";
import { format } from "date-fns";
import { AssignSessionDialog } from "@/components/assign-session-dialog";

const SESSION_STATUSES = ["upcoming", "live", "completed", "cancelled"];

const sessionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  packagePlan: z.enum(["fitplus", "pro", "elite"], { required_error: "Package plan is required" }),
  trainerId: z.string().optional(),
  scheduledAt: z.string().min(1, "Date and time are required"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  maxCapacity: z.coerce.number().min(1, "Capacity must be at least 1"),
});

type SessionFormData = z.infer<typeof sessionSchema>;

export default function AdminSessions() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignSessionId, setAssignSessionId] = useState<string>("");
  const [assignSessionTitle, setAssignSessionTitle] = useState<string>("");
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [cloneSessionData, setCloneSessionData] = useState<any>(null);
  const [cloneForm, setCloneForm] = useState({ scheduledAt: "" });
  const { toast } = useToast();

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: "",
      packagePlan: "fitplus",
      trainerId: "",
      scheduledAt: "",
      duration: 60,
      maxCapacity: 10,
    },
  });

  const { data: sessions = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/sessions"],
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  const { data: packages = [] } = useQuery<any[]>({
    queryKey: ["/api/packages"],
  });

  const { data: trainers = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/trainers"],
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: SessionFormData) => {
      return await apiRequest("POST", "/api/sessions", {
        title: data.title,
        packagePlan: data.packagePlan,
        trainerId: data.trainerId || undefined,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration,
        maxCapacity: data.maxCapacity,
        currentCapacity: 0,
        status: "upcoming",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trainers"] });
      toast({ title: "Success", description: "Session created successfully. You can now assign clients." });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create session", variant: "destructive" });
    },
  });

  const cancelSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return await apiRequest("POST", `/api/sessions/${sessionId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({ title: "Success", description: "Session cancelled successfully" });
      setIsManageDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to cancel session", variant: "destructive" });
    },
  });

  const bookSessionMutation = useMutation({
    mutationFn: async ({ sessionId, clientId }: { sessionId: string; clientId: string }) => {
      return await apiRequest("POST", `/api/sessions/${sessionId}/book`, { clientId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({ title: "Success", description: "Client booked successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to book session", variant: "destructive" });
    },
  });

  const createZoomMeetingMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return await apiRequest("POST", `/api/sessions/${sessionId}/create-zoom`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({ title: "Success", description: "Zoom meeting created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create Zoom meeting", variant: "destructive" });
    },
  });

  const cloneSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return await apiRequest("POST", `/api/sessions/${sessionId}/clone`, {
        scheduledAt: new Date(cloneForm.scheduledAt),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({ title: "Success", description: "Session cloned successfully" });
      setIsCloneDialogOpen(false);
      setCloneSessionData(null);
      setCloneForm({ scheduledAt: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to clone session", variant: "destructive" });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return await apiRequest("DELETE", `/api/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === 'string' && (
          key.startsWith('/api/sessions') ||
          key.includes('sessions')
        );
      }});
      toast({ title: "Success", description: "Session deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete session", variant: "destructive" });
    },
  });

  const onSubmit = (data: SessionFormData) => {
    createSessionMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming": return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "live": return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "completed": return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
      case "cancelled": return "bg-red-500/10 text-red-700 dark:text-red-400";
      default: return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const style = { "--sidebar-width": "16rem" };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-2xl font-display font-bold tracking-tight">Live Session Management</h1>
            </div>
            <ThemeToggle />
          </header>

          <main className="flex-1 overflow-auto p-8 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-muted-foreground">Schedule and manage live training sessions with bookings and waitlists</p>
                <div className="flex items-center gap-2">
                  <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "calendar")}>
                    <TabsList>
                      <TabsTrigger value="list" data-testid="button-view-list">
                        <List className="h-4 w-4 mr-2" />
                        List View
                      </TabsTrigger>
                      <TabsTrigger value="calendar" data-testid="button-view-calendar">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Calendar View
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-session">
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Session
                  </Button>
                </div>
              </div>

              {viewMode === "calendar" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Session Calendar</CardTitle>
                    <CardDescription>View sessions by date</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                      data-testid="calendar-session-view"
                    />
                  </CardContent>
                </Card>
              )}

              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center py-12 text-muted-foreground">
                    No sessions found. Create your first session to get started.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sessions.map((session: any) => {
                    const packageName = session.packageId?.name || session.packageName || '';
                    return (
                    <Card key={session._id} className="hover-elevate" data-testid={`card-session-${session._id}`}>
                      <CardHeader className="gap-2">
                        {packageName && (
                          <Badge className="w-fit text-xs" variant="outline">
                            {packageName}
                          </Badge>
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="line-clamp-1">{session.title}</CardTitle>
                          </div>
                          <Badge className={getStatusColor(session.status)}>
                            {session.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarIcon className="h-4 w-4" />
                            {format(new Date(session.scheduledAt), "MMM dd, yyyy 'at' h:mm a")}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {session.duration} minutes
                          </div>
                          {session.trainerName && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <UserPlus className="h-4 w-4" />
                              {session.trainerName}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {session.currentCapacity}/{session.maxCapacity} participants
                            {session.currentCapacity >= 10 && (
                              <Badge variant="default" className="ml-2 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                                Batch Complete
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {!session.joinUrl && session.status === "upcoming" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => createZoomMeetingMutation.mutate(session._id)}
                              data-testid={`button-create-zoom-${session._id}`}
                              disabled={createZoomMeetingMutation.isPending}
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Create Zoom
                            </Button>
                          )}
                          {session.joinUrl && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(session.joinUrl, '_blank')}
                                data-testid={`button-join-zoom-${session._id}`}
                              >
                                <Video className="h-4 w-4 mr-1" />
                                Join Now
                              </Button>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Video className="h-3 w-3" />
                                Zoom Ready
                              </Badge>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAssignSessionId(session._id);
                              setAssignSessionTitle(session.title);
                              setShowAssignDialog(true);
                            }}
                            data-testid={`button-assign-${session._id}`}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign ({session.currentCapacity}/10)
                          </Button>
                          {session.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelSessionMutation.mutate(session._id)}
                              data-testid={`button-cancel-${session._id}`}
                            >
                              Cancel
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCloneSessionData(session);
                              setCloneForm({ scheduledAt: "" });
                              setIsCloneDialogOpen(true);
                            }}
                            data-testid={`button-clone-${session._id}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm("Are you sure you want to permanently delete this session?")) {
                                deleteSessionMutation.mutate(session._id);
                              }
                            }}
                            data-testid={`button-delete-${session._id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-session">
          <DialogHeader>
            <DialogTitle>Schedule New Session</DialogTitle>
            <DialogDescription>Create a new live training session with all details</DialogDescription>
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

              <FormField
                control={form.control}
                name="packagePlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Plan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-package-plan">
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fitplus">FitPlus</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="elite">Elite</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trainerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Trainer (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-trainer">
                          <SelectValue placeholder="Select trainer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {trainers.map((trainer: any) => (
                          <SelectItem key={trainer._id} value={trainer._id}>
                            {trainer.name || trainer.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-manage-session">
          <DialogHeader>
            <DialogTitle>Manage Session: {selectedSession?.title}</DialogTitle>
            <DialogDescription>View bookings and manage participants</DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedSession.status)}>{selectedSession.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-medium">{selectedSession.currentCapacity}/{selectedSession.maxCapacity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trainer</p>
                  <p className="font-medium">{selectedSession.trainerName || "Not assigned"}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Reserve Spot for Client</h4>
                <div className="flex gap-2">
                  <Select
                    onValueChange={(clientId) => {
                      bookSessionMutation.mutate({
                        sessionId: selectedSession._id,
                        clientId,
                      });
                    }}
                  >
                    <SelectTrigger data-testid="select-client-booking">
                      <SelectValue placeholder="Select client to book" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client: any) => (
                        <SelectItem key={client._id} value={client._id}>
                          {client.name} ({client.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AssignSessionDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        sessionId={assignSessionId}
        sessionTitle={assignSessionTitle}
        packagePlan={sessions.find((s: any) => s._id === assignSessionId)?.packagePlan || ""}
      />

      <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
        <DialogContent data-testid="dialog-clone-session">
          <DialogHeader>
            <DialogTitle>Clone Session</DialogTitle>
            <DialogDescription>Create a copy with new timing for remaining clients</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clone-title">Session Title</Label>
              <Input id="clone-title" value={cloneSessionData?.title} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clone-package">Package</Label>
              <Input 
                id="clone-package" 
                value={cloneSessionData?.packageId?.name || cloneSessionData?.packageName || 'N/A'} 
                disabled 
                className="bg-muted" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clone-datetime">New Date & Time</Label>
              <Input
                id="clone-datetime"
                type="datetime-local"
                value={cloneForm.scheduledAt}
                onChange={(e) => setCloneForm({ scheduledAt: e.target.value })}
                data-testid="input-clone-datetime"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Duration</Label>
                <p className="font-medium">{cloneSessionData?.duration} minutes</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Capacity</Label>
                <p className="font-medium">{cloneSessionData?.maxCapacity} slots</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloneDialogOpen(false)} data-testid="button-cancel-clone">
              Cancel
            </Button>
            <Button
              onClick={() => cloneSessionMutation.mutate(cloneSessionData?._id)}
              disabled={!cloneForm.scheduledAt || cloneSessionMutation.isPending}
              data-testid="button-confirm-clone"
            >
              {cloneSessionMutation.isPending ? "Cloning..." : "Clone Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  </SidebarProvider>
  );
}
