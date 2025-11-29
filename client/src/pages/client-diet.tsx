import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ClientHeader } from "@/components/client-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
const MEAL_TYPES = ["breakfast", "lunch", "pre-workout", "post-workout", "dinner"];

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
  date?: string;
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
    
    // Handle flat 5-meal structure (breakfast, lunch, pre-workout, post-workout, dinner)
    const meals = currentPlan.meals;
    const mealKey = mealType.toLowerCase();
    
    // Check if it's a direct meal (flat structure)
    if (meals[mealKey]) {
      return meals[mealKey];
    }
    
    // Handle day-based structure fallback
    const mealTypeKey = Object.keys(meals).find(key => 
      key.toLowerCase().startsWith(mealType.toLowerCase())
    );
    
    if (mealTypeKey) {
      return meals[mealTypeKey];
    }
    
    return undefined;
  };

  const getTotalMacrosForDay = (dayIndex: number) => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    // For flat 5-meal structure, all meals are the same for every day
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
        meal.dishes.forEach((dish: any) => {
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

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">{currentPlan.name}</h1>
              {currentPlan.date && (
                <p className="text-sm text-muted-foreground">Valid from {new Date(currentPlan.date).toLocaleDateString()}</p>
              )}
            </div>
          </div>
          {currentPlan.description && (
            <p className="text-muted-foreground text-sm">{currentPlan.description}</p>
          )}
        </div>

        {/* Vertical Cards - Responsive */}
        <div className="space-y-6">
          {DAYS_OF_WEEK.map((day, dayIdx) => {
            const macros = getTotalMacrosForDay(dayIdx);
            return (
              <Card key={day} className="overflow-hidden border-2 border-primary/10 hover:border-primary/20 transition-colors">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-stretch">
                    {/* Day Summary Sidebar - Horizontal on mobile, vertical on desktop */}
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b md:border-b-0 md:border-r-2 border-primary/20 px-6 py-4 flex md:flex-col justify-between md:justify-between md:min-w-[200px]">
                      <div>
                        <Badge variant="secondary" className="font-semibold mb-4 text-base px-3 py-1">
                          {day}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">
                            {macros.totalCalories}
                          </span>
                          <span className="text-sm text-muted-foreground">cal</span>
                        </div>
                        <div className="space-y-1 text-xs md:text-sm hidden md:block">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Protein:</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{macros.totalProtein}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Carbs:</span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">{macros.totalCarbs}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fats:</span>
                            <span className="font-semibold text-primary">{macros.totalFats}g</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => downloadGroceryList(dayIdx)}
                        size="sm"
                        variant="outline"
                        className="gap-2 hidden md:flex"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
                    </div>

                    {/* Meals Grid - 2 cols on mobile, 4 cols on desktop */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 divide-x divide-primary/20">
                      {MEAL_TYPES.map((mealType) => {
                        const meal = getMealForDayAndType(dayIdx, mealType);
                        return (
                          <div
                            key={`${day}-${mealType}`}
                            className="p-3 md:p-4 flex flex-col hover:bg-primary/5 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedMeal(`${dayIdx}-${mealType}`);
                              setShowGroceryList(false);
                            }}
                          >
                            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                              {mealType}
                            </p>
                            
                            {meal ? (
                              <div className="space-y-2">
                                <div>
                                  <p className="font-semibold text-foreground text-xs md:text-sm leading-tight">
                                    {meal.name}
                                  </p>
                                </div>

                                {/* Macro Boxes */}
                                <div className="space-y-1.5">
                                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded px-2 py-1 text-center">
                                    <p className="text-xs text-muted-foreground hidden md:block">Protein</p>
                                    <p className="font-bold text-blue-600 dark:text-blue-400 text-xs md:text-sm">{meal.protein || 0}g</p>
                                  </div>
                                  <div className="bg-orange-50 dark:bg-orange-950/30 rounded px-2 py-1 text-center">
                                    <p className="text-xs text-muted-foreground hidden md:block">Carbs</p>
                                    <p className="font-bold text-orange-600 dark:text-orange-400 text-xs md:text-sm">{meal.carbs || 0}g</p>
                                  </div>
                                  <div className="bg-primary/10 rounded px-2 py-1 text-center">
                                    <p className="text-xs text-muted-foreground hidden md:block">Fats</p>
                                    <p className="font-bold text-primary text-xs md:text-sm">{meal.fats || 0}g</p>
                                  </div>
                                </div>

                                {/* Calories */}
                                {meal.calories && (
                                  <div className="flex items-center justify-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 rounded py-1">
                                    <Flame className="h-3 w-3" />
                                    {meal.calories}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-xs">-</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Mobile Download Button */}
                  <div className="md:hidden border-t border-primary/20 p-3">
                    <Button
                      onClick={() => downloadGroceryList(dayIdx)}
                      size="sm"
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download Grocery List
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

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
                    View Grocery List
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
