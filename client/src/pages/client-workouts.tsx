import { ClientHeader } from "@/components/client-header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ContactTrainerDialog } from "@/components/contact-trainer-dialog";
import {
  Dumbbell,
  AlertCircle,
  Flame,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Exercise {
  name: string;
  sets?: number;
  reps?: string | number;
  weight?: number;
  duration?: number;
  restTime?: number;
  notes?: string;
  difficulty?: string;
  intensity?: string;
}


interface WorkoutPlan {
  _id: string;
  name: string;
  description: string;
  exercises: Record<string, Exercise[]>;
  difficulty: string;
  durationWeeks: number;
  goal?: string;
}


interface DietPlan {
  _id: string;
  meals: Array<{ calories?: number; weekNumber?: number }>;
  targetCalories?: number;
}


interface ClientData {
  weight?: number;
  age?: number;
  gender?: string;
  goal?: string;
}


export default function ClientWorkouts() {
  const [currentWeekDay, setCurrentWeekDay] = useState<string>("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [contactTrainerOpen, setContactTrainerOpen] = useState(false);

  const { data: assignedWorkouts = [], isLoading: isLoadingWorkouts, isError, error } = useQuery<WorkoutPlan[]>({
    queryKey: ['/api/workout-plans'],
    staleTime: 0,
    refetchInterval: 10000,
  });

  const { data: dietPlans = [] } = useQuery<DietPlan[]>({
    queryKey: ['/api/diet-plans'],
    staleTime: 0,
    refetchInterval: 10000,
  });

  const { data: clientData } = useQuery<ClientData>({
    queryKey: ['/api/auth/me'],
    select: (data: any) => ({
      weight: data.user?.weight,
      age: data.user?.age,
      gender: data.user?.gender,
      goal: data.user?.goal,
    }),
    staleTime: 0,
    refetchInterval: 10000,
  });

  const firstWorkout = assignedWorkouts && assignedWorkouts.length > 0 ? assignedWorkouts[0] : null;

  const getAllUniqueDays = (): string[] => {
    if (!firstWorkout?.exercises) return [];
    const daysSet = new Set<string>();
    
    Object.keys(firstWorkout.exercises).forEach(key => {
      const days = key.split(/[/,\s]+/).map(d => d.trim()).filter(d => d);
      days.forEach(day => daysSet.add(day));
    });
    
    return Array.from(daysSet);
  };

  const availableDays = getAllUniqueDays();

  useEffect(() => {
    if (availableDays.length > 0 && !currentWeekDay) {
      setCurrentWeekDay(availableDays[0]);
    }
  }, [availableDays, currentWeekDay]);

  const getCurrentDayExercises = (): Exercise[] => {
    if (!firstWorkout?.exercises || !currentWeekDay) return [];
    
    for (const [key, exercises] of Object.entries(firstWorkout.exercises)) {
      const days = key.split(/[/,\s]+/).map(d => d.trim());
      if (days.includes(currentWeekDay) && Array.isArray(exercises)) {
        return exercises;
      }
    }
    return [];
  };

  const currentDayExercises = getCurrentDayExercises();

  const calculateCaloriesBurned = (exercises: Exercise[], weight: number = 70, durationHours: number = 1): number => {
    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) return 0;

    const weightKg = weight > 100 ? weight / 2.2 : weight;

    const metValues: Record<string, number> = {
      'light': 3.0,
      'beginner': 3.5,
      'moderate': 5.0,
      'intermediate': 7.0,
      'intense': 9.0,
      'advanced': 10.5,
      'high': 12.0,
    };

    let totalCalories = 0;
    let exerciseCount = 0;

    exercises.forEach((ex) => {
      try {
        if (!ex.name || ex.name.trim() === '') return;
        
        exerciseCount++;
        
        const intensity = (ex.intensity || ex.difficulty || 'moderate').toLowerCase();
        const baseMET = metValues[intensity] || 5.0;
        
        let exerciseCalories = weightKg * baseMET * (durationHours / Math.max(exercises.length, 1));
        
        if (ex.sets && ex.sets > 0 && ex.reps) {
          const repsNum = typeof ex.reps === 'string' 
            ? parseInt(ex.reps.split('-')[0]) || 10
            : ex.reps || 10;
          const totalReps = ex.sets * repsNum;
          const volumeMultiplier = 1 + (totalReps / 100) * 0.5;
          exerciseCalories *= Math.min(volumeMultiplier, 2.5);
        }
        
        if (ex.weight && ex.weight > 0) {
          const weightMultiplier = 1 + (ex.weight / weightKg) * 0.2;
          exerciseCalories *= Math.min(weightMultiplier, 2.0);
        }
        
        totalCalories += exerciseCalories;
      } catch (err) {
        const baseMET = 5.0;
        totalCalories += weightKg * baseMET * (durationHours / Math.max(exercises.length, 1));
      }
    });

    if (exerciseCount === 0) return 0;

    const restingCalories = weightKg * 1.0 * durationHours;
    const totalBurned = Math.round(totalCalories + restingCalories);
    
    return Math.max(totalBurned, 100);
  };

  const getAllExercises = (): Exercise[] => {
    if (!firstWorkout?.exercises) return [];
    const all: Exercise[] = [];
    Object.values(firstWorkout.exercises).forEach((dayExercises) => {
      if (Array.isArray(dayExercises)) {
        all.push(...dayExercises);
      }
    });
    return all;
  };

  const allExercises = getAllExercises();
  const dietPlan = dietPlans && dietPlans.length > 0 ? dietPlans[0] : null;
  const dietCalories = dietPlan?.targetCalories || 0;
  
  const clientWeight = clientData?.weight && clientData.weight > 0 ? clientData.weight : 70;
  const caloriesBurned = firstWorkout && allExercises.length > 0 ? calculateCaloriesBurned(allExercises, clientWeight, 1) : 0;
  const calorieBalance = dietCalories - caloriesBurned;
  const isWeightGain = clientData?.goal?.toLowerCase().includes('weight_gain') || clientData?.goal?.toLowerCase().includes('bulk');

  if (isLoadingWorkouts) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <ClientHeader currentPage="workouts" />
        <main className="flex-1 container mx-auto px-6 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Loading your workout plans...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <ClientHeader currentPage="workouts" />
        <main className="flex-1 container mx-auto px-6 py-8">
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
            <CardContent className="p-8 text-center space-y-4">
              <AlertCircle className="h-16 w-16 mx-auto text-red-500" />
              <h2 className="text-2xl font-bold text-red-900 dark:text-red-100">Error Loading Workouts</h2>
              <p className="text-red-700 dark:text-red-200 max-w-md mx-auto">
                {error instanceof Error ? error.message : "Failed to load your workout plans. Please refresh the page or try again later."}
              </p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()} data-testid="button-retry-workout">
                Retry
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!firstWorkout || availableDays.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <ClientHeader currentPage="workouts" />
        <main className="flex-1 container mx-auto px-6 py-8 max-w-4xl">
          <Card className="bg-gradient-to-br from-primary/5 to-orange-100/20 border-primary/20">
            <CardContent className="p-8 text-center space-y-4">
              <Dumbbell className="h-16 w-16 mx-auto text-primary" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">No Workout Plan Assigned</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your trainer hasn't assigned a workout plan yet. Please contact your trainer to get a personalized training program tailored to your fitness goals.
              </p>
              <Button onClick={() => setContactTrainerOpen(true)} data-testid="button-contact-trainer">
                Contact Trainer
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader currentPage="workouts" />

      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Dumbbell className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">{firstWorkout.name}</h1>
            </div>
            <p className="text-muted-foreground">{firstWorkout.description}</p>
          </div>

          {/* Plan Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Duration</p>
                <p className="text-3xl font-bold text-primary">{firstWorkout.durationWeeks} weeks</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-orange-100/30 to-orange-50/30 dark:from-orange-950/30 dark:to-orange-900/20">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Difficulty</p>
                <Badge className="justify-center w-full capitalize text-base py-1">{firstWorkout.difficulty}</Badge>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-blue-100/30 to-blue-50/30 dark:from-blue-950/30 dark:to-blue-900/20">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Daily Calorie Burn</p>
                <div className="flex items-center justify-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <p className="text-3xl font-bold">{caloriesBurned}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Day Selector */}
          <div className="space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Select Training Day
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {availableDays.map((day) => (
                <Button
                  key={day}
                  variant={currentWeekDay === day ? "default" : "outline"}
                  onClick={() => setCurrentWeekDay(day)}
                  className="text-xs"
                  data-testid={`button-day-${day}`}
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>
          </div>

          {/* Exercises Table */}
          <Card className="border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                {currentWeekDay} Exercises ({currentDayExercises.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {currentDayExercises.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No exercises scheduled for {currentWeekDay}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-6 py-3 text-left font-semibold text-sm">Exercise</th>
                        <th className="px-6 py-3 text-center font-semibold text-sm">Sets</th>
                        <th className="px-6 py-3 text-center font-semibold text-sm">Reps</th>
                        <th className="px-6 py-3 text-center font-semibold text-sm">Weight</th>
                        <th className="px-6 py-3 text-center font-semibold text-sm">Rest</th>
                        <th className="px-6 py-3 text-center font-semibold text-sm">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentDayExercises.map((exercise, idx) => (
                        <tr
                          key={idx}
                          className={`border-b transition-colors ${
                            idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/50 dark:bg-slate-900/50"
                          } hover:bg-primary/5`}
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium">{exercise.name}</p>
                              {exercise.difficulty && (
                                <Badge variant="outline" className="text-xs capitalize mt-1">
                                  {exercise.difficulty}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-primary">{exercise.sets || "-"}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-primary">{exercise.reps || "-"}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-primary">{exercise.weight ? `${exercise.weight}kg` : "-"}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm text-muted-foreground">{exercise.restTime ? `${exercise.restTime}s` : "-"}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedExercise(exercise)}
                              data-testid={`button-exercise-details-${idx}`}
                            >
                              Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calorie Balance */}
          {dietCalories > 0 && (
            <Card className="border-0">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Daily Calorie Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-900">
                    <p className="text-sm text-muted-foreground mb-2">Calories Consumed</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{dietCalories}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">From diet plan</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4 border border-orange-200 dark:border-orange-900">
                    <p className="text-sm text-muted-foreground mb-2">Calories Burned</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{caloriesBurned}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">From workout</p>
                  </div>
                  <div className={`${isWeightGain ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-primary/10'} rounded-lg p-4 border ${isWeightGain ? 'border-blue-200 dark:border-blue-800' : 'border-primary/20'}`}>
                    <p className="text-sm text-muted-foreground mb-2">Calorie {isWeightGain ? 'Surplus' : 'Deficit'}</p>
                    <div className="flex items-center gap-2">
                      {isWeightGain ? (
                        <TrendingUp className={`h-5 w-5 ${calorieBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`} />
                      ) : (
                        <TrendingDown className={`h-5 w-5 ${calorieBalance <= 0 ? 'text-primary' : 'text-yellow-600 dark:text-yellow-400'}`} />
                      )}
                      <p className={`text-3xl font-bold ${calorieBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {Math.abs(calorieBalance)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {calorieBalance >= 0 ? '+' : ''}{calorieBalance} calories
                    </span>
                  </div>
                  <Progress value={Math.min(Math.max((dietCalories / (dietCalories + 500)) * 100, 0), 100)} className="h-3" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Exercise Details Dialog */}
      <Dialog open={!!selectedExercise} onOpenChange={(open) => { if (!open) setSelectedExercise(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedExercise?.name}</DialogTitle>
          </DialogHeader>
          {selectedExercise && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {selectedExercise.sets && (
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Sets</p>
                    <p className="text-2xl font-bold text-primary">{selectedExercise.sets}</p>
                  </div>
                )}
                {selectedExercise.reps && (
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Reps</p>
                    <p className="text-2xl font-bold text-primary">{selectedExercise.reps}</p>
                  </div>
                )}
                {selectedExercise.weight && (
                  <div className="bg-orange-100/30 dark:bg-orange-950/30 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Weight</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{selectedExercise.weight}kg</p>
                  </div>
                )}
                {selectedExercise.restTime && (
                  <div className="bg-blue-100/30 dark:bg-blue-950/30 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Rest</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedExercise.restTime}s</p>
                  </div>
                )}
              </div>
              {selectedExercise.notes && (
                <div className="bg-muted/50 rounded-lg p-3 border-l-4 border-primary">
                  <p className="text-sm"><strong>Notes:</strong> {selectedExercise.notes}</p>
                </div>
              )}
              {selectedExercise.difficulty && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm"><strong>Difficulty:</strong> <Badge className="capitalize ml-2">{selectedExercise.difficulty}</Badge></p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ContactTrainerDialog open={contactTrainerOpen} onOpenChange={setContactTrainerOpen} />
    </div>
  );
}

