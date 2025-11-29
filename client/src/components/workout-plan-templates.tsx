import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Plus, Search, Filter, Dumbbell, Edit, Trash2, Copy, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AssignPlanDialog } from "@/components/assign-plan-dialog";

const CATEGORIES = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'weight_gain', label: 'Weight Gain' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'general', label: 'General Fitness' },
];

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Full Body', 'Cardio'
];

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

interface WorkoutPlanFormData {
  name: string;
  description: string;
  category: string;
  difficulty: string;
  durationWeeks: number;
  exercises: Record<string, Array<{ name: string; sets: number; reps: string; rest: string; notes: string }>>;
}

// Force rebuild - filters should display
export function WorkoutPlanTemplates({ isTrainer = false, trainerId = '' }: { isTrainer?: boolean; trainerId?: string }) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  
  const [formData, setFormData] = useState<WorkoutPlanFormData>({
    name: "",
    description: "",
    category: "general",
    difficulty: "beginner",
    durationWeeks: 4,
    exercises: {},
  });

  const [selectedDay, setSelectedDay] = useState<string>("Monday");

  const { data: workoutPlans = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/workout-plan-templates'],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/workout-plan-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workout-plan-templates'] });
      toast({ title: "Success", description: "Workout plan template created successfully" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest("PATCH", `/api/workout-plan-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workout-plan-templates'] });
      toast({ title: "Success", description: "Workout plan template updated successfully" });
      setDialogOpen(false);
      resetForm();
      setEditingPlan(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/workout-plan-templates/${id}/clone`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workout-plan-templates'] });
      toast({ title: "Success", description: "Workout plan template cloned successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/workout-plan-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workout-plan-templates'] });
      toast({ title: "Success", description: "Workout plan template deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "general",
      difficulty: "beginner",
      durationWeeks: 4,
      exercises: {},
    });
    setSelectedDay("Monday");
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    // Normalize exercises format - convert from both old and new formats
    const normalizedExercises: any = {};
    if (plan.exercises) {
      Object.entries(plan.exercises).forEach(([day, data]: [string, any]) => {
        // Handle both formats: direct array or nested {exercises: array}
        normalizedExercises[day] = Array.isArray(data) ? data : (data.exercises || []);
      });
    }
    setFormData({
      name: plan.name,
      description: plan.description || "",
      category: plan.category || "general",
      difficulty: plan.difficulty || "beginner",
      durationWeeks: plan.durationWeeks,
      exercises: normalizedExercises,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Please enter a plan name", variant: "destructive" });
      return;
    }

    // Flatten exercises: convert from {Monday: [...]} format (direct arrays)
    const flattenedExercises: any = {};
    Object.entries(formData.exercises).forEach(([day, data]: [string, any]) => {
      flattenedExercises[day] = Array.isArray(data) ? data : (data.exercises || []);
    });

    const planData = {
      ...formData,
      exercises: flattenedExercises,
      isTemplate: true,
      createdBy: "admin",
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan._id, data: planData });
    } else {
      createMutation.mutate(planData);
    }
  };

  const addExercise = () => {
    // Get exercises as direct array
    const dayExercises = Array.isArray(formData.exercises[selectedDay]) 
      ? formData.exercises[selectedDay] 
      : [];
    setFormData({
      ...formData,
      exercises: {
        ...formData.exercises,
        [selectedDay]: [
          ...dayExercises,
          { name: "", sets: 3, reps: "10-12", rest: "60s", notes: "" }
        ]
      }
    });
  };

  const updateExercise = (dayIndex: number, field: string, value: any) => {
    const dayExercises = Array.isArray(formData.exercises[selectedDay])
      ? [...formData.exercises[selectedDay]]
      : [];
    dayExercises[dayIndex] = { ...dayExercises[dayIndex], [field]: value };
    setFormData({
      ...formData,
      exercises: {
        ...formData.exercises,
        [selectedDay]: dayExercises
      }
    });
  };

  const removeExercise = (dayIndex: number) => {
    const dayExercises = Array.isArray(formData.exercises[selectedDay])
      ? [...formData.exercises[selectedDay]]
      : [];
    dayExercises.splice(dayIndex, 1);
    setFormData({
      ...formData,
      exercises: {
        ...formData.exercises,
        [selectedDay]: dayExercises
      }
    });
  };

  const filteredPlans = workoutPlans.filter((plan) => {
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || plan.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === "all" || plan.difficulty === difficultyFilter;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workout plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-workouts"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-difficulty-filter">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {DIFFICULTY_LEVELS.map(level => (
                <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            resetForm();
            setEditingPlan(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-workout">
              <Plus className="h-4 w-4 mr-2" />
              Create Workout
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Edit" : "Create"} Workout Plan Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan Name *</Label>
                  <Input
                    placeholder="e.g., Push Pull Legs - Beginner"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    data-testid="input-plan-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (Weeks)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="52"
                    value={formData.durationWeeks}
                    onChange={(e) => setFormData({ ...formData, durationWeeks: parseInt(e.target.value) })}
                    data-testid="input-duration-weeks"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Difficulty Level *</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                    <SelectTrigger data-testid="select-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the workout plan..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  data-testid="textarea-description"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Day Selection</Label>
                  <p className="text-sm text-muted-foreground mt-1">Click to select a day and add exercises for that day</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {DAYS_OF_WEEK.map(day => (
                      <Button
                        key={day}
                        variant={selectedDay === day ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDay(day)}
                        data-testid={`button-select-day-${day}`}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />
              </div>

              <div className="space-y-2 border rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base">{selectedDay} Exercises</Label>
                  <Button size="sm" onClick={addExercise} data-testid="button-add-exercise">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Exercise
                  </Button>
                </div>

                {(Array.isArray(formData.exercises[selectedDay]) ? formData.exercises[selectedDay] : []).map((exercise, idx) => (
                  <div key={idx} className="grid grid-cols-6 gap-2 p-3 border rounded-md bg-muted/20">
                    <div className="col-span-2">
                      <Input
                        placeholder="Exercise name"
                        value={exercise.name}
                        onChange={(e) => updateExercise(idx, 'name', e.target.value)}
                        data-testid={`input-exercise-name-${idx}`}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Sets"
                        value={exercise.sets}
                        onChange={(e) => updateExercise(idx, 'sets', parseInt(e.target.value))}
                        data-testid={`input-exercise-sets-${idx}`}
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Reps"
                        value={exercise.reps}
                        onChange={(e) => updateExercise(idx, 'reps', e.target.value)}
                        data-testid={`input-exercise-reps-${idx}`}
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Rest"
                        value={exercise.rest}
                        onChange={(e) => updateExercise(idx, 'rest', e.target.value)}
                        data-testid={`input-exercise-rest-${idx}`}
                      />
                    </div>
                    <div className="flex items-center justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeExercise(idx)}
                        data-testid={`button-remove-exercise-${idx}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}

                {!(Array.isArray(formData.exercises[selectedDay]) && formData.exercises[selectedDay].length > 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No exercises added for {selectedDay}. Click "Add Exercise" to get started.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingPlan ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading workout plans...</div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-12">
          <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No workout plans found</p>
          <p className="text-sm text-muted-foreground mt-2">Create Your First Workout Plan</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.map((plan) => (
            <Card key={plan._id} data-testid={`card-workout-plan-${plan._id}`}>
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-2">
                  <span className="line-clamp-2">{plan.name}</span>
                  <Badge variant={
                    plan.category === 'weight_loss' ? 'default' :
                    plan.category === 'weight_gain' ? 'secondary' : 'outline'
                  }>
                    {CATEGORIES.find(c => c.value === plan.category)?.label || plan.category}
                  </Badge>
                </CardTitle>
                <div className="flex gap-2">
                  {plan.difficulty && (
                    <Badge variant="outline" className="text-xs">
                      {DIFFICULTY_LEVELS.find(d => d.value === plan.difficulty)?.label || plan.difficulty}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">{plan.durationWeeks} weeks</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{plan.description}</p>
                )}
                <div className="text-sm text-muted-foreground">
                  {Object.keys(plan.exercises || {}).length} day(s) configured
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => {
                      setSelectedPlan(plan);
                      setAssignDialogOpen(true);
                    }}
                    data-testid={`button-assign-${plan._id}`}
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Assign
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => cloneMutation.mutate(plan._id)}
                    data-testid={`button-clone-${plan._id}`}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Clone
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEdit(plan)}
                    data-testid={`button-edit-${plan._id}`}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => deleteMutation.mutate(plan._id)}
                    data-testid={`button-delete-${plan._id}`}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AssignPlanDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        plan={selectedPlan}
        resourceType="workout"
      />
    </div>
  );
}
