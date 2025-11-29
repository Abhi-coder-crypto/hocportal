import { Button } from "@/components/ui/button";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientHeader } from "@/components/client-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Target,
  Plus,
  TrendingUp,
  Calendar,
  Edit,
  Trash2,
  Award,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

interface Goal {
  _id: string;
  clientId: string;
  goalType: 'weight' | 'fitness' | 'nutrition';
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  targetDate?: string;
  status: 'active' | 'completed' | 'abandoned';
  progress: number;
  milestones: Array<{
    value: number;
    label: string;
    achieved: boolean;
    achievedAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}


const goalFormSchema = z.object({
  goalType: z.enum(['weight', 'fitness', 'nutrition']),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  targetValue: z.coerce.number().min(0.01, "Target value must be greater than 0"),
  currentValue: z.coerce.number().min(0, "Current value must be 0 or greater"),
  unit: z.string().min(1, "Unit is required"),
  targetDate: z.string().optional(),
});

type GoalFormData = z.infer<typeof goalFormSchema>;

export default function ClientGoals() {
  const [, setLocation] = useLocation();
  const [clientId, setClientId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const id = localStorage.getItem('clientId');
    if (!id) {
      setLocation('/client-access');
    } else {
      setClientId(id);
    }
  }, [setLocation]);

  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ['/api/goals', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const res = await fetch(`/api/goals?clientId=${clientId}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!clientId,
  });

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      goalType: 'weight',
      title: '',
      description: '',
      targetValue: 0,
      currentValue: 0,
      unit: 'kg',
      targetDate: '',
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      const response = await apiRequest('POST', '/api/goals', {
        ...data,
        clientId,
        milestones: generateMilestones(data.targetValue, data.unit),
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals', clientId] });
      setIsCreateOpen(false);
      form.reset();
      toast({
        title: "Goal created",
        description: "Your new goal has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create goal",
        variant: "destructive",
      });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GoalFormData> }) => {
      const response = await apiRequest('PATCH', `/api/goals/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals', clientId] });
      setEditingGoal(null);
      toast({
        title: "Goal updated",
        description: "Your goal has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update goal",
        variant: "destructive",
      });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/goals/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals', clientId] });
      toast({
        title: "Goal deleted",
        description: "Your goal has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete goal",
        variant: "destructive",
      });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, currentValue }: { id: string; currentValue: number }) => {
      const response = await apiRequest('POST', `/api/goals/${id}/progress`, { currentValue });
      return await response.json();
    },
    onSuccess: (data: Goal) => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals', clientId] });
      
      const newMilestones = data.milestones.filter(m => 
        m.achieved && new Date(m.achievedAt || '').getTime() > Date.now() - 5000
      );
      
      if (newMilestones.length > 0) {
        newMilestones.forEach(milestone => {
          toast({
            title: "Milestone Achieved!",
            description: milestone.label,
          });
        });
      }
      
      if (data.status === 'completed') {
        toast({
          title: "Goal Completed!",
          description: `Congratulations! You've achieved your goal: ${data.title}`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update progress",
        variant: "destructive",
      });
    },
  });

  function generateMilestones(targetValue: number, unit: string) {
    const milestones = [];
    const steps = [0.25, 0.5, 0.75, 1.0];
    
    for (const step of steps) {
      milestones.push({
        value: targetValue * step,
        label: `Reached ${Math.round(targetValue * step)}${unit} (${step * 100}% complete)`,
        achieved: false,
      });
    }
    
    return milestones;
  }

  function onSubmit(data: GoalFormData) {
    if (editingGoal) {
      updateGoalMutation.mutate({ id: editingGoal._id, data });
    } else {
      createGoalMutation.mutate(data);
    }
  }

  function handleEdit(goal: Goal) {
    setEditingGoal(goal);
    form.reset({
      goalType: goal.goalType,
      title: goal.title,
      description: goal.description || '',
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      unit: goal.unit,
      targetDate: goal.targetDate ? format(new Date(goal.targetDate), 'yyyy-MM-dd') : '',
    });
    setIsCreateOpen(true);
  }

  function handleUpdateProgress(goal: Goal, newValue: number) {
    updateProgressMutation.mutate({ id: goal._id, currentValue: newValue });
  }

  function getGoalTypeColor(type: string) {
    switch (type) {
      case 'weight': return 'bg-blue-500';
      case 'fitness': return 'bg-green-500';
      case 'nutrition': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  }

  function getGoalTypeIcon(type: string) {
    switch (type) {
      case 'weight': return TrendingUp;
      case 'fitness': return Target;
      case 'nutrition': return Award;
      default: return Target;
    }
  }

  if (isLoading || !clientId) {
    return (
      <div className="min-h-screen flex flex-col">
        <ClientHeader currentPage="goals" />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-6">
            <Skeleton className="h-10 w-64 mb-8" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ClientHeader currentPage="goals" />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-6 space-y-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight" data-testid="text-goals-title">
                My Goals
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your fitness journey with personalized goals
              </p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) {
                setEditingGoal(null);
                form.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-goal">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
                  <DialogDescription>
                    Set up a new goal to track your progress
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="goalType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Goal Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-goal-type">
                                <SelectValue placeholder="Select goal type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weight">Weight Goal</SelectItem>
                              <SelectItem value="fitness">Fitness Goal</SelectItem>
                              <SelectItem value="nutrition">Nutrition Goal</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g., Lose 10kg" {...field} data-testid="input-goal-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Add details about your goal..." {...field} data-testid="input-goal-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="currentValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" placeholder="0" {...field} data-testid="input-current-value" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="targetValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" placeholder="0" {...field} data-testid="input-target-value" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit</FormLabel>
                            <FormControl>
                              <Input placeholder="kg, reps, kcal" {...field} data-testid="input-unit" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="targetDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-target-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
                        data-testid="button-submit-goal"
                      >
                        {editingGoal ? 'Update Goal' : 'Create Goal'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {goals && goals.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="space-y-4">
                <Target className="h-16 w-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-xl font-semibold">No goals yet</h3>
                  <p className="text-muted-foreground mt-2">
                    Create your first goal to start tracking your progress
                  </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-goal">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals?.map((goal) => {
                const Icon = getGoalTypeIcon(goal.goalType);
                const isCompleted = goal.status === 'completed';
                const daysRemaining = goal.targetDate 
                  ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;

                return (
                  <Card key={goal._id} data-testid={`card-goal-${goal._id}`}>
                    <CardHeader className="gap-1 space-y-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-md ${getGoalTypeColor(goal.goalType)}`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{goal.title}</CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {goal.goalType}
                            </Badge>
                          </div>
                        </div>
                        {isCompleted && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" data-testid="icon-goal-completed" />
                        )}
                      </div>
                      {goal.description && (
                        <CardDescription className="mt-2">{goal.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-muted-foreground">
                            {goal.currentValue} / {goal.targetValue} {goal.unit}
                          </span>
                        </div>
                        <Progress value={goal.progress} className="h-2" data-testid={`progress-goal-${goal._id}`} />
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{goal.progress}% complete</span>
                          {daysRemaining !== null && daysRemaining > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {daysRemaining} days left
                            </span>
                          )}
                        </div>
                      </div>

                      {goal.milestones.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm font-medium">Milestones</span>
                          <div className="space-y-1">
                            {goal.milestones.map((milestone, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                {milestone.achieved ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                                ) : (
                                  <div className="h-3 w-3 rounded-full border border-muted-foreground flex-shrink-0" />
                                )}
                                <span className={milestone.achieved ? 'text-muted-foreground line-through' : ''}>
                                  {milestone.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1" data-testid={`button-update-progress-${goal._id}`}>
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Update
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Progress</DialogTitle>
                              <DialogDescription>
                                Update your current progress for: {goal.title}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Current Value</label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  defaultValue={goal.currentValue}
                                  onChange={(e) => {
                                    const newValue = parseFloat(e.target.value);
                                    if (!isNaN(newValue)) {
                                      handleUpdateProgress(goal, newValue);
                                    }
                                  }}
                                  data-testid="input-update-progress"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Target: {goal.targetValue} {goal.unit}
                                </p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(goal)}
                          data-testid={`button-edit-goal-${goal._id}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteGoalMutation.mutate(goal._id)}
                          data-testid={`button-delete-goal-${goal._id}`}
                        >
                          <Trash2 className="h-3 w-3" />
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
  );
}
