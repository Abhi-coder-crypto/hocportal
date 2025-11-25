import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ClientHeader } from "@/components/client-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MobileNavigation } from "@/components/mobile-navigation";
import {
  Flame,
  Droplet,
  Pill,
  ShoppingCart,
  ChefHat,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface Meal {
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  dishes: Array<{
    name: string;
    quantity: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
  }>;
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
  allergens?: string[];
  waterIntakeGoal?: number;
  supplements?: Array<{
    name: string;
    dosage: string;
    timing: string;
  }>;
  createdAt: string;
}

export default function ClientDiet() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [showMealDetails, setShowMealDetails] = useState(false);
  const [waterIntake, setWaterIntake] = useState(0);
  const [showGroceryList, setShowGroceryList] = useState(false);

  // Get clientId from storage
  useEffect(() => {
    const id = localStorage.getItem("clientId");
    if (!id) {
      setLocation("/client-access");
    } else {
      setClientId(id);
    }
  }, [setLocation]);

  // Fetch diet plans
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
  });

  const currentPlan = dietPlans?.[0];

  // Calculate totals for a specific day
  const calculateDayTotals = (day: string) => {
    if (!currentPlan?.meals?.[day]) {
      return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    }

    const dayMeals = currentPlan.meals[day];
    let totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };

    Object.values(dayMeals).forEach((meal: any) => {
      if (meal && typeof meal === "object") {
        totals.calories += meal.calories || 0;
        totals.protein += meal.protein || 0;
        totals.carbs += meal.carbs || 0;
        totals.fats += meal.fats || 0;
      }
    });

    return totals;
  };

  const dayTotals = calculateDayTotals(selectedDay);
  const targetCalories = currentPlan?.targetCalories || 2000;
  const caloriePercentage = (dayTotals.calories / targetCalories) * 100;

  // Get all meals for the selected day
  const getMealsForDay = (day: string) => {
    return currentPlan?.meals?.[day] || {};
  };

  // Generate grocery list
  const generateGroceryList = () => {
    const groceries = new Set<string>();
    if (currentPlan?.meals) {
      Object.values(currentPlan.meals).forEach((dayMeals: any) => {
        Object.values(dayMeals).forEach((meal: any) => {
          if (meal?.dishes && Array.isArray(meal.dishes)) {
            meal.dishes.forEach((dish: any) => {
              if (dish.name) groceries.add(dish.name);
            });
          }
        });
      });
    }
    return Array.from(groceries);
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

  const dayMeals = getMealsForDay(selectedDay);
  const mealTypes = Object.keys(dayMeals);

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />
      <MobileNavigation />

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{currentPlan.name}</h1>
          {currentPlan.description && (
            <p className="text-muted-foreground">{currentPlan.description}</p>
          )}
        </div>

        {/* Nutrition Goals */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5" />
              Daily Nutrition Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {currentPlan.targetCalories?.toLocaleString() || 2000}
                </div>
                <p className="text-sm text-muted-foreground">Calories</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {currentPlan.protein || 150}g
                </div>
                <p className="text-sm text-muted-foreground">Protein</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {currentPlan.carbs || 200}g
                </div>
                <p className="text-sm text-muted-foreground">Carbs</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {currentPlan.fats || 65}g
                </div>
                <p className="text-sm text-muted-foreground">Fats</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Meal Plan */}
        <Tabs defaultValue="Monday" onValueChange={setSelectedDay} className="mb-8">
          <TabsList className="grid grid-cols-7 w-full">
            {DAYS_OF_WEEK.map((day) => (
              <TabsTrigger key={day} value={day} className="text-xs sm:text-sm">
                {day.slice(0, 3)}
              </TabsTrigger>
            ))}
          </TabsList>

          {DAYS_OF_WEEK.map((day) => (
            <TabsContent key={day} value={day} className="space-y-4 mt-6">
              {/* Day Totals */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{day}'s Nutrition Summary</CardTitle>
                    <Badge variant="outline">{dayTotals.calories.toLocaleString()} kcal</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Calorie Progress */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Calories</span>
                      <span className="text-sm text-muted-foreground">
                        {dayTotals.calories.toLocaleString()} / {targetCalories.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={Math.min(caloriePercentage, 100)} className="h-2" />
                  </div>

                  {/* Macro breakdown */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Protein</p>
                      <p className="text-lg font-semibold">{dayTotals.protein}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Carbs</p>
                      <p className="text-lg font-semibold">{dayTotals.carbs}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fats</p>
                      <p className="text-lg font-semibold">{dayTotals.fats}g</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Meals for Day */}
              <div className="space-y-4">
                {mealTypes.length > 0 ? (
                  mealTypes.map((mealType) => {
                    const meal = dayMeals[mealType];
                    return (
                      <Card key={mealType} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                        setSelectedMeal({ ...meal, type: mealType, day });
                        setShowMealDetails(true);
                      }}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="capitalize text-lg">{mealType}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">{meal?.time || "No time set"}</p>
                            </div>
                            <Badge variant="secondary">{meal?.calories || 0} kcal</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {meal?.dishes && meal.dishes.length > 0 ? (
                            <div className="space-y-2">
                              {meal.dishes.map((dish: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                  <span className="text-foreground">{dish.name}</span>
                                  <span className="text-muted-foreground">{dish.quantity || "1 serving"}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">No dishes planned</p>
                          )}

                          {/* Macro nutrients */}
                          <Separator className="my-3" />
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <p className="text-muted-foreground">Protein</p>
                              <p className="font-semibold">{meal?.protein || 0}g</p>
                            </div>
                            <div className="text-center">
                              <p className="text-muted-foreground">Carbs</p>
                              <p className="font-semibold">{meal?.carbs || 0}g</p>
                            </div>
                            <div className="text-center">
                              <p className="text-muted-foreground">Fats</p>
                              <p className="font-semibold">{meal?.fats || 0}g</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">No meals planned for {day}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Hydration & Supplements */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Water Intake */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplet className="h-5 w-5" />
                Hydration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold">{waterIntake}L</div>
                <p className="text-sm text-muted-foreground">
                  Daily Goal: {currentPlan.waterIntakeGoal || 3}L
                </p>
              </div>
              <Progress 
                value={(waterIntake / (currentPlan.waterIntakeGoal || 3)) * 100} 
                className="mb-4"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWaterIntake(Math.max(0, waterIntake - 0.5))}
                >
                  -
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setWaterIntake(0)}
                >
                  Reset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWaterIntake(waterIntake + 0.5)}
                >
                  +
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Supplements */}
          {currentPlan.supplements && currentPlan.supplements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Supplements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentPlan.supplements.map((supplement: any, idx: number) => (
                    <div key={idx} className="border-l-2 border-primary pl-3 py-2">
                      <p className="font-medium text-sm">{supplement.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {supplement.dosage} • {supplement.timing}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Allergens & Grocery List */}
        <div className="grid md:grid-cols-2 gap-6">
          {currentPlan.allergens && currentPlan.allergens.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Allergen Restrictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {currentPlan.allergens.map((allergen: string) => (
                    <Badge key={allergen} variant="destructive">
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grocery List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Grocery List
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGroceryList(true)}
                >
                  View
                </Button>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Meal Details Modal */}
      <Dialog open={showMealDetails} onOpenChange={setShowMealDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">
              {selectedMeal?.type} - {selectedMeal?.day}
            </DialogTitle>
          </DialogHeader>
          {selectedMeal && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-semibold">{selectedMeal.time}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Dishes</p>
                {selectedMeal.dishes?.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedMeal.dishes.map((dish: any, idx: number) => (
                      <li key={idx} className="text-sm border-l-2 border-primary pl-3">
                        <p className="font-medium">{dish.name}</p>
                        <p className="text-muted-foreground text-xs">{dish.quantity}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">No dishes</p>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Calories</p>
                  <p className="font-semibold">{selectedMeal.calories || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Protein</p>
                  <p className="font-semibold">{selectedMeal.protein || 0}g</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Carbs</p>
                  <p className="font-semibold">{selectedMeal.carbs || 0}g</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fats</p>
                  <p className="font-semibold">{selectedMeal.fats || 0}g</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Grocery List Modal */}
      <Dialog open={showGroceryList} onOpenChange={setShowGroceryList}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Weekly Grocery List</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {generateGroceryList().length > 0 ? (
              <ul className="space-y-2">
                {generateGroceryList().map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm py-2 border-b last:border-b-0">
                    <div className="w-4 h-4 rounded border border-muted-foreground"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-8">No items in grocery list</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
