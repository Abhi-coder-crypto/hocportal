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
} from "lucide-react";

const DAYS_OF_WEEK = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];
const MEAL_TYPES = ["BREAKFAST", "LUNCH", "SNACK", "DINNER"];

interface Dish {
  name: string;
  quantity?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

interface Meal {
  time?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  dishes?: Dish[];
  name?: string;
}

interface DayMeals {
  [mealType: string]: Meal;
}

interface DietPlan {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  targetCalories: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  meals: Record<string, DayMeals>;
  createdAt: string;
  updatedAt?: string;
}

export default function ClientDiet() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<{ day: string; mealType: string } | null>(null);
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
      if (!response.ok) {
        throw new Error("Failed to fetch diet plans");
      }
      return response.json();
    },
    enabled: !!clientId,
    staleTime: 0,
    refetchInterval: 10000,
    refetchOnWindowFocus: "stale",
  });

  const currentPlan = dietPlans?.[0];

  const getMealsForDay = (day: string): DayMeals => {
    return currentPlan?.meals?.[day] || {};
  };

  const getMealByType = (day: string, mealType: string): Meal | undefined => {
    const dayMeals = getMealsForDay(day);
    return dayMeals[mealType.toLowerCase()];
  };

  const generateGroceryListForDay = (day: string): string[] => {
    const items: string[] = [];
    const dayMeals = getMealsForDay(day);
    
    Object.values(dayMeals).forEach((meal: Meal) => {
      if (meal?.dishes && Array.isArray(meal.dishes)) {
        meal.dishes.forEach((dish: Dish) => {
          if (dish.name) {
            const itemText = dish.quantity ? `${dish.name} - ${dish.quantity}` : dish.name;
            if (!items.includes(itemText)) {
              items.push(itemText);
            }
          }
        });
      }
    });
    
    return items;
  };

  const downloadGroceryList = () => {
    if (!selectedMeal) return;
    
    const items = generateGroceryListForDay(selectedMeal.day);
    const content = `GROCERY LIST - ${selectedMeal.day.toUpperCase()}
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
    a.download = `grocery-list-${selectedMeal.day.toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: `Grocery list for ${selectedMeal.day} downloaded successfully`,
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
          <Button onClick={() => setLocation("/client-dashboard")} className="mt-4" data-testid="button-back-dashboard">
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
            <h1 className="text-3xl font-bold" data-testid="text-plan-name">
              {currentPlan.name}
            </h1>
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
                      className="px-6 py-4 text-left font-semibold text-primary min-w-60"
                    >
                      {mealType}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS_OF_WEEK.map((day, dayIdx) => (
                  <tr
                    key={day}
                    className={`border-b transition-colors ${
                      dayIdx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/50 dark:bg-slate-900/50"
                    } hover:bg-primary/5`}
                  >
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="font-semibold">
                        {day}
                      </Badge>
                    </td>
                    {MEAL_TYPES.map((mealType) => {
                      const meal = getMealByType(day, mealType);
                      return (
                        <td
                          key={`${day}-${mealType}`}
                          className="px-6 py-4"
                        >
                          {meal && meal.dishes && meal.dishes.length > 0 ? (
                            <button
                              onClick={() => {
                                setSelectedMeal({ day, mealType });
                                setShowGroceryList(false);
                              }}
                              className="text-left hover-elevate group transition-all"
                              data-testid={`button-meal-${day}-${mealType}`}
                            >
                              <div className="space-y-1">
                                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                  {meal.dishes[0]?.name}
                                </p>
                                {meal.dishes.length > 1 && (
                                  <p className="text-xs text-muted-foreground">
                                    +{meal.dishes.length - 1} more
                                  </p>
                                )}
                                {meal.calories && (
                                  <p className="text-xs text-muted-foreground">
                                    {meal.calories} cal
                                  </p>
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
                ))}
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
                {selectedMeal?.day} - {selectedMeal?.mealType}
              </DialogTitle>
            </DialogHeader>

            {selectedMeal && getMealByType(selectedMeal.day, selectedMeal.mealType) && (() => {
              const meal = getMealByType(selectedMeal.day, selectedMeal.mealType)!;
              const groceryItems = generateGroceryListForDay(selectedMeal.day);
              return (
                <div className="space-y-6">
                  {/* Dishes */}
                  {meal.dishes && meal.dishes.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4" />
                        Dishes
                      </h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {meal.dishes.map((dish, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10"
                          >
                            <span className="font-medium">{dish.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {dish.quantity || "1 serving"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nutrition */}
                  {(meal.protein || meal.carbs || meal.fats) && (
                    <div className="grid grid-cols-3 gap-3">
                      {meal.protein && (
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-900">
                          <p className="text-xs text-muted-foreground mb-1">Protein</p>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {meal.protein}g
                          </p>
                        </div>
                      )}
                      {meal.carbs && (
                        <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3 border border-orange-200 dark:border-orange-900">
                          <p className="text-xs text-muted-foreground mb-1">Carbs</p>
                          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {meal.carbs}g
                          </p>
                        </div>
                      )}
                      {meal.fats && (
                        <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                          <p className="text-xs text-muted-foreground mb-1">Fats</p>
                          <p className="text-2xl font-bold text-primary">
                            {meal.fats}g
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Calories */}
                  {meal.calories && (
                    <div className="bg-gradient-to-r from-primary/10 to-orange-100/30 rounded-lg p-4 border border-primary/20">
                      <p className="text-sm text-muted-foreground mb-1">Total Calories</p>
                      <p className="text-3xl font-bold text-primary">{meal.calories}</p>
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
                Grocery List - {selectedMeal?.day}
              </DialogTitle>
            </DialogHeader>
            {selectedMeal && (() => {
              const groceryItems = generateGroceryListForDay(selectedMeal.day);
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
                        No grocery items for {selectedMeal.day}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={downloadGroceryList}
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
