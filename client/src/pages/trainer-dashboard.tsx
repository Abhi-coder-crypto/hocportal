import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TrainerSidebar } from "@/components/trainer-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Calendar, Video as VideoIcon, Users, TrendingUp, Activity, Clock, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Client, LiveSession, Video as VideoType } from "@shared/schema";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function TrainerDashboard() {
  const style = {
    "--sidebar-width": "16rem",
  };

  const { data: authData } = useQuery<any>({
    queryKey: ['auth', 'trainer'],
    queryFn: async () => {
      // Use specific trainer token from sessionStorage, not admin token
      const token = sessionStorage.getItem('trainerToken');
      if (!token) throw new Error('Trainer not logged in');
      
      const response = await fetch('/api/auth/me?role=trainer', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch auth');
      return response.json();
    }
  });

  const user = authData?.user;
  const trainerId = user?._id?.toString() || user?.id;

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/trainers', trainerId, 'clients'],
    queryFn: async () => {
      const token = sessionStorage.getItem('trainerToken');
      if (!token) throw new Error('Trainer not logged in');
      const response = await fetch(`/api/trainers/${trainerId}/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    },
    enabled: !!trainerId
  });

  const { data: sessions = [] } = useQuery<LiveSession[]>({
    queryKey: ['/api/trainers', trainerId, 'sessions'],
    queryFn: async () => {
      const token = sessionStorage.getItem('trainerToken');
      if (!token) throw new Error('Trainer not logged in');
      const response = await fetch(`/api/trainers/${trainerId}/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },
    enabled: !!trainerId
  });

  const { data: videos = [] } = useQuery<VideoType[]>({
    queryKey: ['/api/videos'],
    queryFn: async () => {
      const token = sessionStorage.getItem('trainerToken');
      if (!token) throw new Error('Trainer not logged in');
      const response = await fetch('/api/videos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch videos');
      return response.json();
    },
    enabled: !!trainerId
  });

  const upcomingSessions = sessions.filter((s: LiveSession) => 
    s.status === 'upcoming' && new Date(s.scheduledAt) > new Date()
  );

  const thisWeekSessions = sessions.filter((s: LiveSession) => {
    const sessionDate = new Date(s.scheduledAt);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return sessionDate >= now && sessionDate <= weekFromNow;
  });

  const activeClients = clients;

  const clientGrowthData = [
    { month: 'Jan', clients: 8 },
    { month: 'Feb', clients: 12 },
    { month: 'Mar', clients: 15 },
    { month: 'Apr', clients: 18 },
    { month: 'May', clients: activeClients.length || 20 },
  ];

  const sessionData = [
    { day: 'Mon', sessions: 3 },
    { day: 'Tue', sessions: 5 },
    { day: 'Wed', sessions: 4 },
    { day: 'Thu', sessions: 6 },
    { day: 'Fri', sessions: 5 },
    { day: 'Sat', sessions: 7 },
    { day: 'Sun', sessions: 2 },
  ];

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <TrainerSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 border-b min-h-[56px]">
            <div className="flex items-center gap-2 sm:gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight">
                {user ? `Welcome, ${user.name || 'Trainer'}` : 'Trainer Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                    {user.name?.charAt(0).toUpperCase() || 'T'}
                  </div>
                  <div className="text-sm hidden sm:block">
                    <p className="font-medium">{user.name || 'Trainer'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              )}
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Assigned Clients</CardTitle>
                    <Users className="h-5 w-5 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{clients?.length || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Active clients under your supervision</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
                    <Calendar className="h-5 w-5 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">{sessions?.filter((s: any) => s.status === 'upcoming')?.length || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">{thisWeekSessions.length} sessions this week</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Videos Created</CardTitle>
                    <VideoIcon className="h-5 w-5 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{videos.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Training videos uploaded</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Profile</CardTitle>
                    <User className="h-5 w-5 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{user?.name || 'Trainer'}</div>
                    <p className="text-xs text-muted-foreground mt-1">Strength & Conditioning</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      <CardTitle>Client Growth</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={clientGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))' 
                          }} 
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="clients" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-500" />
                      <CardTitle>Weekly Sessions</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={sessionData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="day" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))' 
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="sessions" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Sessions Section */}
              {upcomingSessions.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-500" />
                      <CardTitle>Your Upcoming Sessions</CardTitle>
                    </div>
                    <CardDescription>Sessions you're assigned to train</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {upcomingSessions.map((session: any) => (
                        <Card key={session._id} className="border-l-4 border-l-green-500" data-testid={`card-trainer-session-${session._id}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold line-clamp-1">{session.title}</h4>
                                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {format(new Date(session.scheduledAt), "MMM dd, yyyy 'at' h:mm a")}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    {session.duration} minutes
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    {session.currentCapacity || 0} clients assigned
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 items-end">
                                {session.packageId?.name && (
                                  <Badge variant="outline" className="text-xs">
                                    {session.packageId.name}
                                  </Badge>
                                )}
                                {session.joinUrl && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(session.joinUrl, '_blank')}
                                    data-testid={`button-join-zoom-${session._id}`}
                                  >
                                    <VideoIcon className="h-4 w-4 mr-1" />
                                    Join Zoom
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Assigned Clients Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <CardTitle>Your Assigned Clients ({activeClients.length})</CardTitle>
                  </div>
                  <CardDescription>Clients you are currently training</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeClients.slice(0, 10).map((client: any) => (
                      <div key={client._id} className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover-elevate" data-testid={`client-item-${client._id}`}>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {client.name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-xs text-muted-foreground">{client.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {client.packageId?.name && (
                            <Badge variant="outline" className="text-xs mb-1">
                              {client.packageId.name}
                            </Badge>
                          )}
                          <p className="text-sm font-medium capitalize">{client.goal || 'Fitness'}</p>
                        </div>
                      </div>
                    ))}
                    {activeClients.length === 0 && (
                      <p className="text-center text-muted-foreground py-6">No clients assigned yet</p>
                    )}
                    {activeClients.length > 10 && (
                      <p className="text-center text-sm text-muted-foreground py-2">+{activeClients.length - 10} more clients</p>
                    )}
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
