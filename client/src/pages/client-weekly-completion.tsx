import { ClientHeader } from "@/components/client-header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, Target, TrendingUp, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";

export default function ClientWeeklyCompletion() {
  const { data: weeklyData, isLoading } = useQuery({
    queryKey: ['/api/progress/weekly-completion'],
  });

  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const daysOfWeek = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });

  const completedDays = weeklyData?.completedDays || [];
  const plannedWorkouts = weeklyData?.plannedWorkouts || 5;
  const completedWorkouts = weeklyData?.completedWorkouts || 0;
  const completionRate = plannedWorkouts > 0 ? (completedWorkouts / plannedWorkouts) * 100 : 0;

  const isCompleted = (date: Date) => {
    return completedDays.some((d: string) => isSameDay(new Date(d), date));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ClientHeader currentPage="weekly-completion" />
      <main className="flex-1 container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Weekly Workout Completion</h1>
          <p className="text-muted-foreground">
            Track your weekly workout adherence and stay consistent
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed This Week</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {completedWorkouts} / {plannedWorkouts}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {completionRate.toFixed(0)}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week's Goal</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{plannedWorkouts}</div>
              <p className="text-xs text-muted-foreground mt-1">Planned workouts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Average</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {weeklyData?.average || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Workouts per week</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>This Week's Progress</CardTitle>
            <CardDescription>
              {format(currentWeekStart, 'MMM dd')} - {format(currentWeekEnd, 'MMM dd, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium">{completionRate.toFixed(0)}%</span>
              </div>
              <Progress value={completionRate} className="h-3" />
            </div>

            <div className="grid grid-cols-7 gap-2 mt-6">
              {daysOfWeek.map((day, index) => {
                const completed = isCompleted(day);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-md border text-center ${
                      completed
                        ? 'bg-primary text-primary-foreground border-primary'
                        : isToday
                        ? 'border-primary border-2'
                        : ''
                    }`}
                    data-testid={`day-${index}`}
                  >
                    <div className="text-xs font-medium mb-1">
                      {format(day, 'EEE')}
                    </div>
                    <div className="text-2xl font-bold mb-2">
                      {format(day, 'd')}
                    </div>
                    {completed && (
                      <CheckCircle2 className="h-5 w-5 mx-auto" data-testid={`completed-${index}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly History</CardTitle>
            <CardDescription>Your workout completion over recent weeks</CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyData?.history && weeklyData.history.length > 0 ? (
              <div className="space-y-3">
                {weeklyData.history.map((week: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b last:border-0" data-testid={`week-${index}`}>
                    <div>
                      <div className="font-medium">Week of {format(new Date(week.startDate), 'MMM dd, yyyy')}</div>
                      <div className="text-sm text-muted-foreground">
                        {week.completed} / {week.planned} workouts completed
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">
                        {((week.completed / week.planned) * 100).toFixed(0)}%
                      </div>
                      <div className="w-24">
                        <Progress value={(week.completed / week.planned) * 100} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No weekly history available yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

    </div>
  );
}
