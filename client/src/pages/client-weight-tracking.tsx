import { useState } from "react";
import { MobileNavigation } from "@/components/mobile-navigation";
import { ClientHeader } from "@/components/client-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, TrendingDown, TrendingUp, Target, Plus, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function ClientWeightTracking() {
  const { toast } = useToast();
  const [weight, setWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");

  const { data: weightData, isLoading } = useQuery({
    queryKey: ['/api/progress/weight'],
  });

  const addWeightMutation = useMutation({
    mutationFn: async (data: { weight: number; date: string }) =>
      apiRequest('POST', '/api/progress/weight', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress/weight'] });
      toast({ title: "Weight logged successfully" });
      setWeight("");
    },
    onError: () => {
      toast({ title: "Failed to log weight", variant: "destructive" });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async (data: { goalWeight: number }) =>
      apiRequest('POST', '/api/progress/goal', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress/weight'] });
      toast({ title: "Goal updated successfully" });
      setGoalWeight("");
    },
    onError: () => {
      toast({ title: "Failed to update goal", variant: "destructive" });
    },
  });

  const currentWeight = weightData?.current?.weight || 0;
  const goal = weightData?.goal || 0;
  const startWeight = weightData?.start || currentWeight;
  const remaining = Math.abs(currentWeight - goal);
  const totalToLose = Math.abs(startWeight - goal);
  const weightChanged = Math.abs(startWeight - currentWeight);
  const progressPercent = totalToLose > 0 ? Math.min(100, Math.max(0, (weightChanged / totalToLose) * 100)) : 0;
  const isGoalAchieved = goal > 0 && currentWeight === goal;

  const handleLogWeight = () => {
    if (!weight || isNaN(parseFloat(weight))) {
      toast({ title: "Please enter a valid weight", variant: "destructive" });
      return;
    }
    addWeightMutation.mutate({
      weight: parseFloat(weight),
      date: new Date().toISOString(),
    });
  };

  const handleSetGoal = () => {
    if (!goalWeight || isNaN(parseFloat(goalWeight))) {
      toast({ title: "Please enter a valid goal weight", variant: "destructive" });
      return;
    }
    updateGoalMutation.mutate({ goalWeight: parseFloat(goalWeight) });
  };

  const weightLost = Math.max(0, startWeight - currentWeight);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <ClientHeader currentPage="weight-tracking" />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-6 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Weight Tracking</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Monitor your progress towards your fitness goals</p>
          </div>

          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Current Weight */}
            <Card className="hover-elevate">
              <CardHeader className="space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Scale className="h-5 w-5 text-blue-500" />
                  Current Weight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-foreground">{currentWeight}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {weightData?.current?.date ? format(new Date(weightData.current.date), 'MMM dd') : 'Not recorded'}
                </p>
              </CardContent>
            </Card>

            {/* Goal Weight */}
            <Card className="hover-elevate">
              <CardHeader className="space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Target className="h-5 w-5 text-green-500" />
                  Goal Weight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-foreground">{goal || '--'}</div>
                <p className="text-sm text-muted-foreground mt-1">kg</p>
              </CardContent>
            </Card>

            {/* Weight to Lose */}
            <Card className={`hover-elevate ${isGoalAchieved ? 'bg-green-50 dark:bg-green-950/30' : ''}`}>
              <CardHeader className="space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  {isGoalAchieved ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : remaining > 0 ? (
                    <TrendingDown className="h-5 w-5 text-orange-500" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  )}
                  {isGoalAchieved ? 'Goal Achieved!' : remaining > 0 ? 'To Lose' : 'To Gain'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-foreground">
                  {isGoalAchieved ? '✓' : Math.abs(remaining).toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{isGoalAchieved ? '' : 'kg'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Visual Progress Tracker - Circular */}
          {goal > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Progress Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-8">
                  {/* Circular Progress */}
                  <div className="relative w-64 h-64">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                      {/* Background circle */}
                      <circle
                        cx="100"
                        cy="100"
                        r="90"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-muted"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="100"
                        cy="100"
                        r="90"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={`${(progressPercent / 100) * 565.48} 565.48`}
                        strokeLinecap="round"
                        className="text-blue-500 transition-all duration-500"
                      />
                    </svg>
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-5xl font-bold text-foreground">{progressPercent.toFixed(0)}</div>
                      <div className="text-sm text-muted-foreground">% Complete</div>
                    </div>
                  </div>

                  {/* Progress Details */}
                  <div className="w-full space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">Lost</div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{weightLost.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">kg</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">Remaining</div>
                        <div className={`text-2xl font-bold ${remaining > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                          {Math.abs(remaining).toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">kg</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">Total Goal</div>
                        <div className="text-2xl font-bold text-foreground">{totalToLose.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">kg</div>
                      </div>
                    </div>

                    {/* Before & After */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-2">Starting Weight</div>
                        <div className="text-3xl font-bold text-foreground">{startWeight}</div>
                        <div className="text-xs text-muted-foreground mt-1">kg</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-2">Current Weight</div>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{currentWeight}</div>
                        <div className="text-xs text-muted-foreground mt-1">kg</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Log & Set Goal Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Log Weight */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Log Weight
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm font-medium">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="Enter your weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    data-testid="input-weight"
                    className="text-base"
                  />
                </div>
                <Button
                  onClick={handleLogWeight}
                  disabled={addWeightMutation.isPending}
                  className="w-full"
                  data-testid="button-log-weight"
                >
                  {addWeightMutation.isPending ? "Logging..." : "Log Weight"}
                </Button>
              </CardContent>
            </Card>

            {/* Set Goal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Set Goal Weight
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="goalWeight" className="text-sm font-medium">Target Weight (kg)</Label>
                  <Input
                    id="goalWeight"
                    type="number"
                    step="0.1"
                    placeholder="Enter your goal"
                    value={goalWeight}
                    onChange={(e) => setGoalWeight(e.target.value)}
                    data-testid="input-goal-weight"
                    className="text-base"
                  />
                </div>
                <Button
                  onClick={handleSetGoal}
                  disabled={updateGoalMutation.isPending}
                  className="w-full"
                  data-testid="button-set-goal"
                >
                  {updateGoalMutation.isPending ? "Setting..." : "Set Goal"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Weight History */}
          {weightData?.history && weightData.history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weightData.history.slice(0, 10).map((entry: any, index: number) => {
                    const prevWeight = index > 0 ? weightData.history[index - 1].weight : null;
                    const diff = prevWeight ? entry.weight - prevWeight : null;
                    const isDecrease = diff !== null && diff < 0;

                    return (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate"
                        data-testid={`weight-entry-${index}`}
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-foreground">{entry.weight} kg</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(entry.date), 'MMM dd, yyyy')}
                          </div>
                        </div>
                        {diff !== null && (
                          <div className={`flex items-center gap-1 text-sm font-medium ${isDecrease ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {isDecrease ? (
                              <TrendingDown className="h-4 w-4" />
                            ) : (
                              <TrendingUp className="h-4 w-4" />
                            )}
                            {Math.abs(diff).toFixed(1)} kg
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
  );
}
