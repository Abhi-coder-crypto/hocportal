import { ClientHeader } from "@/components/client-header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Trophy, Target, Dumbbell, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const achievementTypes = [
  {
    id: 'first-workout',
    title: 'First Workout',
    description: 'Complete your first assigned workout',
    icon: Dumbbell,
    requirement: 1,
    category: 'completed',
  },
  {
    id: '10-workouts',
    title: 'Dedicated Ten',
    description: 'Complete 10 assigned workouts',
    icon: Target,
    requirement: 10,
    category: 'completed',
  },
  {
    id: '50-workouts',
    title: 'Half Century',
    description: 'Complete 50 assigned workouts',
    icon: CheckCircle2,
    requirement: 50,
    category: 'completed',
  },
  {
    id: '100-workouts',
    title: 'Century Club',
    description: 'Complete 100 assigned workouts',
    icon: Trophy,
    requirement: 100,
    category: 'completed',
  },
  {
    id: 'consistency',
    title: 'Workout Consistency',
    description: '80% or more workouts assigned completed',
    icon: Calendar,
    requirement: 80,
    category: 'compliance',
  },
  {
    id: 'weight-goal',
    title: 'Weight Goal',
    description: 'Reach your target weight',
    icon: TrendingUp,
    requirement: 1,
    category: 'goals',
  },
];

export default function ClientAchievements() {
  const { data: achievementsData, isLoading } = useQuery({
    queryKey: ['/api/progress/achievements'],
  });

  const stats = achievementsData?.stats || { 
    completedWorkouts: 0, 
    assignedWorkouts: 0,
    workoutCompliancePercent: 0,
    goalReached: false,
    daysInProgram: 0
  };
  const unlockedIds = achievementsData?.unlocked || [];

  const checkUnlocked = (achievement: typeof achievementTypes[0]) => {
    if (achievement.category === 'completed') {
      return stats.completedWorkouts >= achievement.requirement;
    }
    if (achievement.category === 'compliance') {
      return stats.workoutCompliancePercent >= achievement.requirement;
    }
    if (achievement.category === 'goals') {
      return stats.goalReached;
    }
    return false;
  };

  const getProgress = (achievement: typeof achievementTypes[0]) => {
    if (achievement.category === 'completed') {
      return Math.min(100, (stats.completedWorkouts / achievement.requirement) * 100);
    }
    if (achievement.category === 'compliance') {
      return Math.min(100, stats.workoutCompliancePercent);
    }
    if (achievement.category === 'goals') {
      return stats.goalReached ? 100 : 0;
    }
    return 0;
  };

  const getCurrent = (achievement: typeof achievementTypes[0]) => {
    if (achievement.category === 'completed') {
      return stats.completedWorkouts;
    }
    if (achievement.category === 'compliance') {
      return Math.round(stats.workoutCompliancePercent);
    }
    if (achievement.category === 'goals') {
      return stats.goalReached ? 1 : 0;
    }
    return 0;
  };

  const unlockedCount = achievementTypes.filter(checkUnlocked).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ClientHeader currentPage="achievements" />
      <main className="flex-1 container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Achievement System</h1>
          <p className="text-muted-foreground">
            Unlock badges and milestones as you progress on your fitness journey
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workouts Completed</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.completedWorkouts}</div>
              <p className="text-xs text-muted-foreground mt-1">of {stats.assignedWorkouts} assigned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.round(stats.workoutCompliancePercent)}%</div>
              <p className="text-xs text-muted-foreground mt-1">of assigned workouts completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Program</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.daysInProgram}</div>
              <p className="text-xs text-muted-foreground mt-1">days since first assignment</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {achievementTypes.map((achievement) => {
            const unlocked = checkUnlocked(achievement);
            const progress = getProgress(achievement);
            const current = getCurrent(achievement);
            const Icon = achievement.icon;

            return (
              <Card
                key={achievement.id}
                className={unlocked ? 'border-primary' : 'opacity-75'}
                data-testid={`achievement-${achievement.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-md ${unlocked ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{achievement.title}</CardTitle>
                        <CardDescription>{achievement.description}</CardDescription>
                      </div>
                    </div>
                    {unlocked && (
                      <Badge variant="default" data-testid={`badge-unlocked-${achievement.id}`}>
                        <Trophy className="h-3 w-3 mr-1" />
                        Unlocked
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {achievement.category === 'compliance' ? `${current}%` : `${current} / ${achievement.requirement}`}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

    </div>
  );
}
