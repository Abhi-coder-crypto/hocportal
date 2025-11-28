import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ClientHeader } from "@/components/client-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MobileNavigation } from "@/components/mobile-navigation";
import {
  UtensilsCrossed,
  ShoppingCart,
  AlertTriangle,
  Download,
  ChefHat,
  Flame,
} from "lucide-react";

const DAYS_OF_WEEK = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];
const MEAL_TYPES = ["breakfast", "lunch", "snack", "dinner"];

interface Meal {
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  dishes?: Array<{ name: string; quantity?: string }>;
}

interface DietPlan {
  _id: string;
  name: string;
  description?: string;
  meals: Record<string, Meal>;
  targetCalories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

export default function ClientDiet() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [showGroceryList, setShowGroceryList] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("clientId");
    if (!id) {
      setLocation("/client-access");
    } else {
      setClientId(id);
    }
  }, [setLocation]);

  const { data: dietPlans = [], isLoading, error } = useQuery<DietPlan[]>({
    queryKey: ["/api/diet-plans", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const url = `/api/diet-plans?clientId=${clientId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch diet plans");
      return response.json();
    },
    enabled: !!clientId,
    staleTime: 0,
    refetchInterval: 10000,
    refetchOnWindowFocus: "stale",
  });

  const currentPlan = dietPlans?.[0];

  const getMealForDayAndType = (dayIndex: number, mealType: string): Meal | undefined => {
    if (!currentPlan?.meals) return undefined;
    
    // Calculate which meal group this day/type combination falls into
    // Each day repeats the meal type pattern, so we cycle through meals
    const mealsArray = Object.entries(currentPlan.meals).filter(([key]) => 
      key.toLowerCase().startsWith(mealType.toLowerCase())
    );
    
    if (mealsArray.length === 0) return undefined;
    
    // Get the meal for this day (cycle through available meals)
    const mealIndex = dayIndex % mealsArray.length;
    return mealsArray[mealIndex]?.[1];
  };

  const getMealsByType = (mealType: string): Meal | undefined => {
    return currentPlan?.meals?.[mealType];
  };

  const getTotalMacrosForDay = (dayIndex: number) => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    MEAL_TYPES.forEach((mealType) => {
      const meal = getMealForDayAndType(dayIndex, mealType);
      if (meal) {
        totalCalories += meal.calories || 0;
        totalProtein += meal.protein || 0;
        totalCarbs += meal.carbs || 0;
        totalFats += meal.fats || 0;
      }
    });

    return { totalCalories, totalProtein, totalCarbs, totalFats };
  };

  const generateGroceryList = (dayIndex: number): string[] => {
    const items: Set<string> = new Set();
    
    MEAL_TYPES.forEach((mealType) => {
      const meal = getMealForDayAndType(dayIndex, mealType);
      if (meal?.dishes) {
        meal.dishes.forEach((dish) => {
          const text = dish.quantity ? `${dish.name} - ${dish.quantity}` : dish.name;
          items.add(text);
        });
      }
    });
    
    return Array.from(items);
  };

  const downloadGroceryList = (dayIndex: number) => {
    const items = generateGroceryList(dayIndex);
    const dayName = DAYS_OF_WEEK[dayIndex];
    const content = `GROCERY LIST - ${dayName.toUpperCase()}
${currentPlan?.name || "Diet Plan"}
Generated: ${new Date().toLocaleDateString()}
${"=".repeat(40)}

${items.length > 0 ? items.map((item, idx) => `${idx + 1}. ${item}`).join("\n") : "No items for this day"}

${"=".repeat(40)}
Total Items: ${items.length}
`;
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grocery-list-${dayName.toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: `Grocery list for ${dayName} downloaded successfully`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your diet plan...</p>
        </div>
      </div>
    );
  }

  if (error || !currentPlan) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Diet Plan Assigned</h2>
          <p className="text-muted-foreground">Contact your trainer to get a personalized diet plan</p>
          <Button onClick={() => setLocation("/client-dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />
      <MobileNavigation />

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{currentPlan.name}</h1>
          </div>
          {currentPlan.description && (
            <p className="text-muted-foreground text-sm">{currentPlan.description}</p>
          )}
        </div>

        {/* Table Container */}
        <Card className="border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 border-primary/20">
                  <th className="px-6 py-4 text-left font-semibold text-primary">DAYS</th>
                  {MEAL_TYPES.map((mealType) => (
                    <th
                      key={mealType}
                      className="px-6 py-4 text-left font-semibold text-primary min-w-80"
                    >
                      {mealType.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS_OF_WEEK.map((day, dayIdx) => {
                  const macros = getTotalMacrosForDay(dayIdx);
                  return (
                    <tr
                      key={day}
                      className={`border-b transition-colors ${
                        dayIdx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/50 dark:bg-slate-900/50"
                      } hover:bg-primary/5`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <Badge variant="secondary" className="font-semibold mb-2">
                            {day}
                          </Badge>
                          <div className="text-xs space-y-1">
                            <div className="flex gap-2">
                              <span className="font-semibold text-orange-600 dark:text-orange-400">{macros.totalCalories} cal</span>
                            </div>
                            <div className="flex gap-2 text-muted-foreground text-xs">
                              <span>P: {macros.totalProtein}g</span>
                              <span>C: {macros.totalCarbs}g</span>
                              <span>F: {macros.totalFats}g</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      {MEAL_TYPES.map((mealType) => {
                        const meal = getMealForDayAndType(dayIdx, mealType);
                        return (
                          <td key={`${day}-${mealType}`} className="px-6 py-4">
                            {meal ? (
                              <button
                                onClick={() => {
                                  setSelectedMeal(`${dayIdx}-${mealType}`);
                                  setShowGroceryList(false);
                                }}
                                className="text-left hover-elevate group transition-all w-full"
                              >
                                <div className="space-y-2">
                                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                    {meal.name}
                                  </p>
                                  <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-2 text-center">
                                      <p className="text-muted-foreground">Protein</p>
                                      <p className="font-bold text-blue-600 dark:text-blue-400">{meal.protein || 0}g</p>
                                    </div>
                                    <div className="bg-orange-50 dark:bg-orange-950/30 rounded p-2 text-center">
                                      <p className="text-muted-foreground">Carbs</p>
                                      <p className="font-bold text-orange-600 dark:text-orange-400">{meal.carbs || 0}g</p>
                                    </div>
                                    <div className="bg-primary/10 rounded p-2 text-center">
                                      <p className="text-muted-foreground">Fats</p>
                                      <p className="font-bold text-primary">{meal.fats || 0}g</p>
                                    </div>
                                  </div>
                                  {meal.calories && (
                                    <div className="flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
                                      <Flame className="h-3 w-3" />
                                      {meal.calories} cal
                                    </div>
                                  )}
                                </div>
                              </button>
                            ) : (
                              <p className="text-muted-foreground text-sm">-</p>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Meal Details Modal */}
        <Dialog
          open={!!selectedMeal}
          onOpenChange={(open) => {
            if (!open) setSelectedMeal(null);
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                {selectedMeal && (() => {
                  const [dayIdx, mealType] = selectedMeal.split("-");
                  return `${DAYS_OF_WEEK[parseInt(dayIdx)]} - ${mealType.toUpperCase()}`;
                })()}
              </DialogTitle>
            </DialogHeader>

            {selectedMeal && (() => {
              const [dayIdx, mealType] = selectedMeal.split("-");
              const meal = getMealForDayAndType(parseInt(dayIdx), mealType);
              const groceryItems = generateGroceryList(parseInt(dayIdx));

              if (!meal) return null;

              return (
                <div className="space-y-6">
                  {/* Nutrition Macros */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-900">
                      <p className="text-xs text-muted-foreground mb-1">Protein</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{meal.protein || 0}g</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4 border border-orange-200 dark:border-orange-900">
                      <p className="text-xs text-muted-foreground mb-1">Carbs</p>
                      <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{meal.carbs || 0}g</p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">Fats</p>
                      <p className="text-3xl font-bold text-primary">{meal.fats || 0}g</p>
                    </div>
                  </div>

                  {/* Calories */}
                  {meal.calories && (
                    <div className="bg-gradient-to-r from-primary/10 to-orange-100/30 rounded-lg p-4 border border-primary/20">
                      <p className="text-sm text-muted-foreground mb-1">Total Calories</p>
                      <div className="flex items-center gap-2">
                        <Flame className="h-6 w-6 text-orange-500" />
                        <p className="text-3xl font-bold text-primary">{meal.calories}</p>
                      </div>
                    </div>
                  )}

                  {/* Grocery List Button */}
                  <Button
                    onClick={() => setShowGroceryList(true)}
                    className="w-full"
                    size="lg"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    View Grocery List ({groceryItems.length} items)
                  </Button>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Grocery List Dialog */}
        <Dialog open={showGroceryList} onOpenChange={setShowGroceryList}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Grocery List - {selectedMeal && DAYS_OF_WEEK[parseInt(selectedMeal.split("-")[0])]}
              </DialogTitle>
            </DialogHeader>
            {selectedMeal && (() => {
              const dayIdx = parseInt(selectedMeal.split("-")[0]);
              const groceryItems = generateGroceryList(dayIdx);
              return (
                <div>
                  <div className="max-h-80 overflow-y-auto mb-4">
                    {groceryItems.length > 0 ? (
                      <ul className="space-y-2">
                        {groceryItems.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-3 py-2 border-b last:border-0">
                            <div className="w-5 h-5 rounded border-2 border-primary flex-shrink-0" />
                            <span className="text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No grocery items for {DAYS_OF_WEEK[dayIdx]}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => downloadGroceryList(dayIdx)}
                    disabled={groceryItems.length === 0}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download List
                  </Button>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
