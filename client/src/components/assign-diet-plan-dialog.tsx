import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";

interface AssignDietPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dietPlan: {
    _id?: string;
    id?: number;
    name: string;
    calories: number;
    type: string;
    meals: number | any[];
  } | null;
}

export function AssignDietPlanDialog({ open, onOpenChange, dietPlan }: AssignDietPlanDialogProps) {
  const { toast } = useToast();
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['/api/clients'],
  });

  const { data: packages = [] } = useQuery<any[]>({
    queryKey: ['/api/packages'],
  });

  // Fetch the full diet plan template to get its meals using the correct template endpoint
  const planId = dietPlan?._id || dietPlan?.id;
  const { data: fullDietPlan } = useQuery<any>({
    queryKey: ['/api/diet-plans/plan', planId],
    queryFn: async () => {
      if (!planId) return null;
      const res = await fetch(`/api/diet-plans/plan/${planId}`);
      if (!res.ok) throw new Error("Failed to fetch diet plan");
      return res.json();
    },
    enabled: !!planId && open,
  });

  // Fetch all diet plans to find which clients already have this diet
  const { data: allDietPlans = [] } = useQuery<any[]>({
    queryKey: ['/api/all-diet-plans'],
    enabled: open,
  });

  // Get clientIds that already have this exact diet plan assigned
  const clientsWithThisDiet = new Set<string>();
  const assignedClientNames: string[] = [];
  
  // Use the most reliable identifier available
  const dietTemplateId = String(fullDietPlan?._id || dietPlan?._id || '').trim();
  const dietTemplateName = fullDietPlan?.name || dietPlan?.name;
  
  // Build Set of clients who already have this diet assigned FOR THIS SPECIFIC DAY
  const selectedDay = fullDietPlan?.selectedDay || 'Monday';
  if (dietTemplateId && allDietPlans.length > 0) {
    allDietPlans.forEach((plan: any) => {
      // Check if this is an assigned plan (has clientId and is not a template)
      if (plan.clientId && plan.isTemplate === false) {
        const clientId = typeof plan.clientId === 'object' ? String(plan.clientId._id || plan.clientId) : String(plan.clientId);
        const clientName = typeof plan.clientId === 'object' ? (plan.clientId.name || '') : '';
        
        // Get the day of this assigned plan (check meals or plan-level selectedDay)
        let planDay = plan.selectedDay || 'Monday';
        if (Array.isArray(plan.meals) && plan.meals.length > 0) {
          planDay = plan.meals[0].dayOfWeek || planDay;
        }
        
        // Match by template ID AND same day (most reliable)
        const planTemplateId = plan.templateId ? String(plan.templateId).trim() : '';
        if (planTemplateId && dietTemplateId && planTemplateId === dietTemplateId && planDay === selectedDay) {
          clientsWithThisDiet.add(clientId.trim());
          if (clientName) assignedClientNames.push(clientName);
        }
        // Also match by name AND day as fallback for older assignments
        else if (plan.name === dietTemplateName && dietTemplateName && planDay === selectedDay) {
          clientsWithThisDiet.add(clientId.trim());
          if (clientName) assignedClientNames.push(clientName);
        }
      }
    });
  }

  const packageById = packages.reduce((map: Record<string, any>, pkg) => {
    map[pkg._id] = pkg;
    return map;
  }, {});

  const clientsWithPackages = clients.map(client => {
    const packageId = typeof client.packageId === 'object' ? client.packageId._id : client.packageId;
    const pkg = packageById[packageId];
    return {
      ...client,
      packageData: pkg || null
    };
  });

  const assignMutation = useMutation({
    mutationFn: async (clientIds: string[]) => {
      if (!dietPlan || !fullDietPlan) return;
      
      const planId = fullDietPlan._id || dietPlan._id;
      
      // Assign the diet plan to each client using the proper assignment endpoint
      const assignments = clientIds.map(clientId => 
        apiRequest('POST', '/api/assign-diet', {
          dietPlanId: planId,
          clientId: clientId,
        })
      );
      
      return Promise.all(assignments);
    },
    onSuccess: (_, clientIds) => {
      queryClient.invalidateQueries({ queryKey: ['/api/diet-plans-with-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/all-diet-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/diet-plan-templates'] });
      // Invalidate each client's diet plans
      clientIds.forEach(clientId => {
        queryClient.invalidateQueries({ queryKey: [`/api/diet-plans/${clientId}`] });
      });
      toast({
        title: "Success",
        description: `Diet plan assigned to ${clientIds.length} client(s)`,
      });
      setSelectedClients(new Set());
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign diet plan",
        variant: "destructive",
      });
    },
  });

  const toggleClient = (clientId: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
  };

  const handleAssign = () => {
    if (selectedClients.size === 0) {
      toast({
        title: "No clients selected",
        description: "Please select at least one client",
        variant: "destructive",
      });
      return;
    }
    assignMutation.mutate(Array.from(selectedClients));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Assign Diet Plan</DialogTitle>
          <DialogDescription>
            Select clients to assign "{dietPlan?.name}" ({dietPlan?.calories} cal, {dietPlan?.type})
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 rounded-md border">
            <div className="space-y-3 p-4 pr-4">
              {assignedClientNames.length > 0 && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    <strong>Already assigned:</strong> {assignedClientNames.join(', ')}
                  </p>
                </div>
              )}

              {clientsWithThisDiet.size > 0 && clientsWithThisDiet.size === clientsWithPackages.length && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="font-medium">All clients are already assigned to this diet</p>
                  <p className="text-sm mt-2">Click "Cancel" to close.</p>
                </div>
              )}

              {clientsWithPackages.length > 0 ? (
                clientsWithPackages.map((client) => {
                  const isAlreadyAssigned = clientsWithThisDiet.has(client._id);
                  const hasPackageAccess = client.packageData?.dietPlanAccess || false;
                  const packageName = client.packageData?.name || 'No Package';
                  const isDisabled = !hasPackageAccess || isAlreadyAssigned;
                  
                  return (
                    <div
                      key={client._id}
                      className={`flex flex-col gap-2 p-3 rounded-md border ${isAlreadyAssigned ? 'opacity-50 bg-muted/30 border-muted' : !isDisabled ? 'hover-elevate cursor-pointer border-border' : 'opacity-50 cursor-not-allowed border-border'}`}
                      onClick={() => !isDisabled && toggleClient(client._id)}
                      data-testid={`client-${client._id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedClients.has(client._id)}
                          disabled={isDisabled}
                          onCheckedChange={() => !isDisabled && toggleClient(client._id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.phone}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{packageName}</Badge>
                          {isAlreadyAssigned && (
                            <Badge variant="secondary" className="bg-green-600/20 text-green-700 dark:text-green-400">Assigned</Badge>
                          )}
                          {!isAlreadyAssigned && !hasPackageAccess && (
                            <Badge variant="outline" className="bg-muted">No Access</Badge>
                          )}
                        </div>
                      </div>
                      {client.allergies && client.allergies.length > 0 && (
                        <div className="pl-8 pt-1 border-t">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-3.5 w-3.5 text-orange-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1">Allergies:</p>
                              <div className="flex flex-wrap gap-1">
                                {client.allergies.map((allergy, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs bg-orange-100 dark:bg-orange-950/50 text-orange-900 dark:text-orange-200">
                                    {allergy}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No clients found
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <p className="text-sm text-muted-foreground">
            {selectedClients.size} client(s) selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={assignMutation.isPending}
              data-testid="button-confirm-assign"
            >
              {assignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assign to Selected
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function generateMeals(calories: number, mealCount: number, type: string) {
  // Fixed at 5 meals per week as per user requirement
  const mealsPerWeek = 5;
  const caloriesPerMeal = Math.round(calories / mealsPerWeek);
  
  const mealTimes = ["7:00 AM", "10:00 AM", "1:00 PM", "4:00 PM", "7:00 PM"];
  const mealTypes = ["Breakfast", "Snack", "Lunch", "Snack", "Dinner"];
  
  const mealNames: Record<string, string[]> = {
    "Low Carb": ["Scrambled Eggs & Avocado", "Almonds & Cheese", "Grilled Chicken Salad", "Greek Yogurt", "Salmon with Vegetables"],
    "High Protein": ["Protein Pancakes", "Protein Shake", "Turkey & Quinoa Bowl", "Cottage Cheese", "Lean Beef with Broccoli"],
    "Balanced": ["Oatmeal with Berries", "Apple & Peanut Butter", "Chicken & Rice", "Greek Yogurt & Fruit", "Fish with Sweet Potato"],
    "Ketogenic": ["Keto Breakfast Bowl", "Keto Fat Bombs", "Keto Chicken Salad", "Keto Cheese Plate", "Keto Steak Dinner"],
    "Vegan": ["Tofu Scramble", "Hummus & Veggies", "Lentil Buddha Bowl", "Mixed Nuts & Berries", "Vegan Stir Fry"],
  };

  const names = mealNames[type] || mealNames["Balanced"];
  
  // Generate 5 meals for Week 1
  return Array.from({ length: mealsPerWeek }, (_, i) => ({
    weekNumber: 1,
    time: mealTimes[i],
    type: mealTypes[i],
    name: names[i],
    calories: caloriesPerMeal,
    protein: Math.round(caloriesPerMeal * 0.30 / 4),
    carbs: Math.round(caloriesPerMeal * 0.40 / 4),
    fats: Math.round(caloriesPerMeal * 0.30 / 9),
  }));
}
