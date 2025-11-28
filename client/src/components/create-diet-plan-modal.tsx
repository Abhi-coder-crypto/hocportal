import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreateDietPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: any;
}

export function CreateDietPlanModal({ open, onOpenChange, plan }: CreateDietPlanModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("Balanced");
  const [weekNumber, setWeekNumber] = useState("1");
  const [targetCalories, setTargetCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [isTemplate, setIsTemplate] = useState(true);
  const [generateMeals, setGenerateMeals] = useState(true);

  useEffect(() => {
    if (plan) {
      setName(plan.name || "");
      setDescription(plan.description || "");
      setDate(plan.date || "");
      setCategory(plan.category || "Balanced");
      setWeekNumber("1");
      setTargetCalories(String(plan.targetCalories || ""));
      setProtein(String(plan.protein || ""));
      setCarbs(String(plan.carbs || ""));
      setFats(String(plan.fats || ""));
      setIsTemplate(plan.isTemplate ?? true);
      setGenerateMeals(false); // Don't generate meals by default when editing
    } else {
      resetForm();
    }
  }, [plan, open]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setDate("");
    setCategory("Balanced");
    setWeekNumber("1");
    setTargetCalories("");
    setProtein("");
    setCarbs("");
    setFats("");
    setIsTemplate(true);
    setGenerateMeals(true); // Generate meals by default for new plans
  };

  const autoCalculateMacros = () => {
    const calories = parseFloat(targetCalories);
    if (!calories) return;

    const macroDistributions: Record<string, { protein: number; carbs: number; fats: number }> = {
      "Balanced": { protein: 30, carbs: 40, fats: 30 },
      "High Protein": { protein: 40, carbs: 30, fats: 30 },
      "Low Carb": { protein: 35, carbs: 25, fats: 40 },
      "Ketogenic": { protein: 25, carbs: 5, fats: 70 },
      "Vegan": { protein: 25, carbs: 50, fats: 25 },
      "Paleo": { protein: 35, carbs: 30, fats: 35 },
      "Mediterranean": { protein: 25, carbs: 45, fats: 30 },
    };

    const distribution = macroDistributions[category] || macroDistributions["Balanced"];
    
    const proteinGrams = Math.round((calories * (distribution.protein / 100)) / 4);
    const carbsGrams = Math.round((calories * (distribution.carbs / 100)) / 4);
    const fatsGrams = Math.round((calories * (distribution.fats / 100)) / 9);

    setProtein(String(proteinGrams));
    setCarbs(String(carbsGrams));
    setFats(String(fatsGrams));
  };

  const createOrUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (plan) {
        return apiRequest('PATCH', `/api/diet-plans/${plan._id}`, data);
      }
      return apiRequest('POST', '/api/diet-plans', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diet-plan-templates'] });
      toast({
        title: "Success",
        description: plan ? "Diet plan updated successfully" : "Diet plan created successfully",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save diet plan",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !targetCalories) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Clone existing meals to avoid reference sharing
    let mealsToSave = plan?.meals ? JSON.parse(JSON.stringify(plan.meals)) : [];
    
    if (generateMeals) {
      const weekNum = parseInt(weekNumber);
      
      // Check if this week already has meals
      const weekExists = mealsToSave.some((meal: any) => meal.weekNumber === weekNum);
      if (weekExists) {
        toast({
          title: "Week Already Exists",
          description: `Week ${weekNum} already has meals in this plan. Please delete existing meals first or choose a different week.`,
          variant: "destructive",
        });
        return;
      }
      
      // Generate 5 meals for the selected week
      const caloriesPerMeal = Math.round(parseFloat(targetCalories) / 5);
      const mealTimes = ["7:00 AM", "10:00 AM", "1:00 PM", "4:00 PM", "7:00 PM"];
      const mealTypes = ["Breakfast", "Snack", "Lunch", "Snack", "Dinner"];
      const mealNames: Record<string, string[]> = {
        "Low Carb": ["Scrambled Eggs & Avocado", "Almonds & Cheese", "Grilled Chicken Salad", "Greek Yogurt", "Salmon with Vegetables"],
        "High Protein": ["Protein Pancakes", "Protein Shake", "Turkey & Quinoa Bowl", "Cottage Cheese", "Lean Beef with Broccoli"],
        "Balanced": ["Oatmeal with Berries", "Apple & Peanut Butter", "Chicken & Rice", "Greek Yogurt & Fruit", "Fish with Sweet Potato"],
        "Ketogenic": ["Keto Breakfast Bowl", "Keto Fat Bombs", "Keto Chicken Salad", "Keto Cheese Plate", "Keto Steak Dinner"],
        "Vegan": ["Tofu Scramble", "Hummus & Veggies", "Lentil Buddha Bowl", "Mixed Nuts & Berries", "Vegan Stir Fry"],
      };
      
      const names = mealNames[category] || mealNames["Balanced"];
      
      const generatedMeals = Array.from({ length: 5 }, (_, i) => ({
        weekNumber: weekNum,
        time: mealTimes[i],
        type: mealTypes[i],
        name: names[i],
        calories: caloriesPerMeal,
        protein: protein ? Math.round(parseFloat(protein) / 5) : Math.round(caloriesPerMeal * 0.30 / 4),
        carbs: carbs ? Math.round(parseFloat(carbs) / 5) : Math.round(caloriesPerMeal * 0.40 / 4),
        fats: fats ? Math.round(parseFloat(fats) / 5) : Math.round(caloriesPerMeal * 0.30 / 9),
      }));
      
      mealsToSave = [...mealsToSave, ...generatedMeals];
    }

    const data = {
      name,
      description,
      date: date || undefined,
      category,
      targetCalories: parseFloat(targetCalories),
      protein: protein ? parseFloat(protein) : undefined,
      carbs: carbs ? parseFloat(carbs) : undefined,
      fats: fats ? parseFloat(fats) : undefined,
      isTemplate,
      meals: mealsToSave,
    };

    createOrUpdateMutation.mutate(data);
  };

  const categories = [
    "Low Carb",
    "High Protein",
    "Ketogenic",
    "Vegan",
    "Balanced",
    "Paleo",
    "Mediterranean",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {plan ? "Edit Diet Plan" : "Create Diet Plan Template"}
          </DialogTitle>
          <DialogDescription>
            {plan ? "Update the diet plan details below" : "Create a new reusable diet plan template"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Weight Loss Plan"
                data-testid="input-plan-name"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the plan..."
                data-testid="input-plan-description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="date">Valid From Date (Optional)</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                data-testid="input-plan-date"
              />
              <p className="text-sm text-muted-foreground mt-1">
                When assigning this diet to a client, it will show the date when this plan is valid
              </p>
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="week">Week Number *</Label>
              <Select value={weekNumber} onValueChange={setWeekNumber}>
                <SelectTrigger id="week" data-testid="select-week">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Week 1</SelectItem>
                  <SelectItem value="2">Week 2</SelectItem>
                  <SelectItem value="3">Week 3</SelectItem>
                  <SelectItem value="4">Week 4</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                {plan ? "Add meals for a specific week to this plan" : "Select which week this plan is for (5 meals per week)"}
              </p>
            </div>

            {plan && (
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <Label htmlFor="generateMeals">Generate Meals for Selected Week</Label>
                  <p className="text-sm text-muted-foreground">
                    Add 5 new meals for Week {weekNumber} to this plan
                  </p>
                </div>
                <Switch
                  id="generateMeals"
                  checked={generateMeals}
                  onCheckedChange={setGenerateMeals}
                  data-testid="switch-generate-meals"
                />
              </div>
            )}

            <div>
              <Label htmlFor="calories">Target Calories (Weekly Total) *</Label>
              <div className="flex gap-2">
                <Input
                  id="calories"
                  type="number"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(e.target.value)}
                  placeholder="2000"
                  data-testid="input-calories"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={autoCalculateMacros}
                  data-testid="button-auto-calculate"
                >
                  Auto Calculate Macros
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="150"
                  data-testid="input-protein"
                />
              </div>
              <div>
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="200"
                  data-testid="input-carbs"
                />
              </div>
              <div>
                <Label htmlFor="fats">Fats (g)</Label>
                <Input
                  id="fats"
                  type="number"
                  value={fats}
                  onChange={(e) => setFats(e.target.value)}
                  placeholder="65"
                  data-testid="input-fats"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <Label htmlFor="isTemplate">Save as Template</Label>
                <p className="text-sm text-muted-foreground">
                  Templates can be reused and assigned to multiple clients
                </p>
              </div>
              <Switch
                id="isTemplate"
                checked={isTemplate}
                onCheckedChange={setIsTemplate}
                data-testid="switch-is-template"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createOrUpdateMutation.isPending}
              data-testid="button-save-plan"
            >
              {createOrUpdateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {plan ? "Update Plan" : "Create Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
