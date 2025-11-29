import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientHeader } from "@/components/client-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dumbbell,
  Target,
  TrendingUp,
  Activity,
  Flame,
  Calendar,
  Clock,
  Users,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { ContinueWatching } from "@/components/continue-watching";
import { ProgressSidebar } from "@/components/progress-sidebar";
import { AchievementGrid } from "@/components/achievement-grid";
import { MobileNavigation } from "@/components/mobile-navigation";
import { LiveSessionCard } from "@/components/live-session-card";
import fullBodyImg from "@assets/generated_images/full_body_strength_training.png";
import morningYogaImg from "@assets/generated_images/morning_yoga_flow.png";
import hiitCardioImg from "@assets/generated_images/hiit_cardio_blast.png";
import upperBodyImg from "@assets/generated_images/upper_body_power.png";
import eveningRelaxImg from "@assets/generated_images/evening_relaxation_yoga.png";
import runningImg from "@assets/generated_images/running_endurance_workout.png";
import coreImg from "@assets/generated_images/core_conditioning.png";
import flexibilityImg from "@assets/generated_images/flexibility_training.png";
import jumpRopeImg from "@assets/generated_images/jump_rope_challenge.png";

interface DashboardData {
  client: {
    name: string;
    packageName: string;
    goal: string;
  };
  stats: {
    currentStreak: number;
    maxStreak: number;
    totalSessions: number;
    weekSessions: number;
    monthSessions: number;
    totalCalories: number;
    weekCalories: number;
    waterIntakeToday: number;
  };
  progress: {
    initialWeight: number;
    currentWeight: number;
    targetWeight: number;
    weightProgress: number;
    weeklyWorkoutCompletion: number;
  };
  nextSession: any;
  upcomingSessions: any[];
  recentSessions: any[];
  videos: any[];
  achievements: any[];
  hasWorkoutPlan: boolean;
  hasDietPlan: boolean;
}

const DUMMY_VIDEOS = [
  {
    id: "1",
    category: "Strength",
    title: "Full Body Strength Training",
    duration: 45,
    thumbnail: fullBodyImg,
  },
  {
    id: "2",
    category: "Yoga",
    title: "Morning Yoga Flow",
    duration: 30,
    thumbnail: morningYogaImg,
  },
  {
    id: "3",
    category: "Cardio",
    title: "HIIT Cardio Blast",
    duration: 25,
    thumbnail: hiitCardioImg,
  },
  {
    id: "4",
    category: "Strength",
    title: "Upper Body Power",
    duration: 40,
    thumbnail: upperBodyImg,
  },
  {
    id: "5",
    category: "Yoga",
    title: "Evening Relaxation",
    duration: 35,
    thumbnail: eveningRelaxImg,
  },
  {
    id: "6",
    category: "Cardio",
    title: "Running Endurance",
    duration: 50,
    thumbnail: runningImg,
  },
  {
    id: "7",
    category: "Strength",
    title: "Core Conditioning",
    duration: 35,
    thumbnail: coreImg,
  },
  {
    id: "8",
    category: "Yoga",
    title: "Flexibility Training",
    duration: 45,
    thumbnail: flexibilityImg,
  },
  {
    id: "9",
    category: "Cardio",
    title: "Jump Rope Challenge",
    duration: 20,
    thumbnail: jumpRopeImg,
  },
];

export default function ClientDashboard() {
  const [, setLocation] = useLocation();
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("clientId");
    if (!id) {
      setLocation("/client-access");
    } else {
      setClientId(id);
    }
  }, [setLocation]);

  const { data: packageAccess } = useQuery<any>({
    queryKey: ["/api/client-access", clientId],
    enabled: !!clientId,
    staleTime: 0,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard", clientId],
    enabled: !!clientId,
    staleTime: 0,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const { data: sessionsData = [] } = useQuery<any[]>({
    queryKey: [`/api/sessions/client/${clientId}`],
    enabled: !!clientId,
    staleTime: 0,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  if (isLoading || !dashboardData) {
    return (
      <div className="w-full bg-background">
        <ClientHeader currentPage="dashboard" packageName={packageAccess?.packageName} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { client, stats, progress, nextSession, upcomingSessions: dashboardUpcomingSessions, videos: apiVideos } =
    dashboardData || { client: { name: '', packageName: '', goal: '' }, stats: { totalSessions: 0, weekSessions: 0, weekCalories: 0, currentStreak: 0, maxStreak: 0, monthSessions: 0, totalCalories: 0, waterIntakeToday: 0 }, progress: { initialWeight: 0, currentWeight: 0, targetWeight: 0, weightProgress: 0, weeklyWorkoutCompletion: 0 }, nextSession: null, upcomingSessions: [], videos: [] };
  
  // Use dummy videos if no API videos available
  const videos = apiVideos && apiVideos.length > 0 ? apiVideos : DUMMY_VIDEOS;

  // Format sessions from the sessions endpoint
  const formattedSessions = ((sessionsData || []) as any[])
    .filter((s: any) => s.status === 'upcoming' || s.status === 'live')
    .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 2)
    .map((session: any) => {
      const sessionDate = new Date(session.scheduledAt);
      const trainerName = session.trainerId?.name || session.trainerName || "Trainer";
      return {
        id: session._id,
        title: session.title,
        trainer: trainerName,
        date: sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: sessionDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        duration: `${session.duration} min`,
        participants: session.currentParticipants || 0,
        maxParticipants: session.maxParticipants || 15,
        status: session.status,
        joinUrl: session.joinUrl || session.meetingLink,
      };
    });

  const nextSessionTime = nextSession
    ? format(new Date(nextSession.scheduledAt), "hh:mm a")
    : "No session";
  const nextSessionDate = nextSession
    ? format(new Date(nextSession.scheduledAt), "MMM d, yyyy")
    : "scheduled";

  // Mock weekly workout data
  const weeklyWorkouts = {
    mon: stats.weekSessions >= 1,
    tue: stats.weekSessions >= 2,
    wed: stats.weekSessions >= 3,
    thu: stats.weekSessions >= 4,
    fri: stats.weekSessions >= 5,
    sat: false,
    sun: false,
  };

  return (
    <div className="w-full bg-background min-h-screen mb-20 md:mb-0">
      <ClientHeader currentPage="dashboard" packageName={packageAccess?.packageName} />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="space-y-3">
            <h1
              className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground"
              data-testid="text-welcome"
            >
              Welcome back, {client.name.split(" ")[0].charAt(0).toUpperCase() + client.name.split(" ")[0].slice(1)} !
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-base font-medium text-black">Your current plan</span>
              <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1" data-testid="badge-package">
                {client.packageName}
              </Badge>
            </div>
          </div>

          {/* Stats Cards Row - Credit Card Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Workouts Assigned - Dark Blue with Orange Accent */}
            <Card className="hover-elevate relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border-0 rounded-2xl p-6 min-h-56 flex flex-col justify-between">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500 rounded-full opacity-80" />
              <div className="relative z-10">
                <p className="text-xs font-medium text-white">Workouts</p>
                <div className="text-6xl font-bold text-white my-4">{(sessionsData as any[])?.length || 0}</div>
                <p className="text-sm text-white">Assigned</p>
              </div>
              <div className="flex items-center justify-between relative z-10 pt-4 border-t border-slate-700">
                <Dumbbell className="h-6 w-6 text-white" />
                <span className="text-sm font-medium text-white">Sessions</span>
              </div>
            </Card>
      </main>

            {/* Sessions Completed - Yellow/Gold */}
            <Card className="hover-elevate relative overflow-hidden bg-gradient-to-br from-yellow-400 to-yellow-500 border-0 rounded-2xl p-6 min-h-56 flex flex-col justify-between">
              <div className="absolute top-2 right-2 opacity-10">
                <div className="grid grid-cols-4 gap-1">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-white rounded-full" />
                  ))}
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-medium text-white">Sessions Completed</p>
                <div className="text-6xl font-bold text-white my-4">{stats.totalSessions}</div>
                <p className="text-sm text-white">+{stats.weekSessions} this week</p>
              </div>
              <div className="flex items-center justify-between relative z-10 pt-4 border-t border-yellow-300">
                <Target className="h-6 w-6 text-white" />
                <span className="text-sm font-medium text-white">Completed</span>
              </div>
            </Card>
      </main>

            {/* Calories Burned - Green */}
            <Card className="hover-elevate relative overflow-hidden bg-gradient-to-br from-emerald-400 to-emerald-500 border-0 rounded-2xl p-6 min-h-56 flex flex-col justify-between">
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-300 rounded-full opacity-20" />
              <div className="relative z-10">
                <p className="text-xs font-medium text-white">Calories Burned</p>
                <div className="text-6xl font-bold text-white my-4">{stats.weekCalories.toLocaleString()}</div>
                <p className="text-sm text-white">This week</p>
              </div>
              <div className="flex items-center justify-between relative z-10 pt-4 border-t border-emerald-300">
                <Flame className="h-6 w-6 text-white" />
                <span className="text-sm font-medium text-white">Kcal</span>
              </div>
            </Card>
      </main>

            {/* Next Session - Orange */}
            <Card className="hover-elevate relative overflow-hidden bg-gradient-to-br from-orange-400 to-orange-500 border-0 rounded-2xl p-6 min-h-56 flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-300 rounded-full opacity-40" />
              <div className="relative z-10">
                <p className="text-xs font-medium text-white">Next Session</p>
                <div className="text-6xl font-bold text-white my-4">{nextSessionTime !== "No session" ? nextSessionTime : "N/A"}</div>
                <p className="text-sm text-white">{nextSessionTime !== "No session" ? nextSessionDate : "No session"}</p>
              </div>
              <div className="flex items-center justify-between relative z-10 pt-4 border-t border-orange-300">
                <Calendar className="h-6 w-6 text-white" />
                <span className="text-sm font-medium text-white">Timing</span>
              </div>
            </Card>
      </main>
          </div>

          {/* Two Column Layout: Videos + Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Videos */}
            <div className="lg:col-span-2">
              <ContinueWatching 
                videos={videos || []} 
                onWatchAll={() => setLocation("/client/videos")}
              />
            </div>

            {/* Right Column: Progress */}
            <div className="space-y-6">
              <ProgressSidebar
                weeklyWorkouts={weeklyWorkouts}
                weightCurrent={Math.round(parseFloat(progress.currentWeight as any))}
                weightTarget={Math.round(parseFloat(progress.targetWeight as any))}
                weeklyCompletion={progress.weeklyWorkoutCompletion}
                onUpdateGoals={() => setLocation("/client/goals")}
              />

              <AchievementGrid
                achievements={[]}
                unlockedCount={Math.min(
                  6,
                  Math.floor(stats.totalSessions / 10) + (stats.currentStreak >= 7 ? 1 : 0)
                )}
                totalCount={6}
              />
            </div>
          </div>

          {/* Upcoming Live Sessions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Upcoming Live Sessions</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/client/sessions")}
                className="text-primary hover:text-primary"
                data-testid="button-view-all-sessions"
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {formattedSessions && formattedSessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formattedSessions.map((session) => (
                  <LiveSessionCard
                    key={session.id}
                    title={session.title}
                    trainer={session.trainer}
                    date={session.date}
                    time={session.time}
                    duration={session.duration}
                    participants={session.participants}
                    maxParticipants={session.maxParticipants}
                    status={session.status}
                    onJoin={() => {
                      if (session.joinUrl) {
                        window.open(session.joinUrl, '_blank');
                      } else {
                        alert('Zoom link not available for this session yet');
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <Card className="hover-elevate">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No upcoming sessions scheduled</p>
                </CardContent>
              </Card>
      </main>
            )}
          </div>
        </div>
      </main>

      </div>
    </div>
  );
}
