import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, UtensilsCrossed, Dumbbell, UserPlus, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DietTemplateList } from "@/components/diet-template-list";
import { WorkoutPlanTemplates } from "@/components/workout-plan-templates";
import { PlanAssignments } from "@/components/plan-assignments";

export default function AdminDiet() {
  const style = { "--sidebar-width": "16rem" };
  const { toast } = useToast();

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
                <UtensilsCrossed className="h-6 w-6 text-primary" />
                Diet & Workout Management
              </h1>
            </div>
            <ThemeToggle />
          </header>

          <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <div className="max-w-7xl mx-auto">
              <Tabs defaultValue="templates" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="templates" data-testid="tab-diet-templates">
                    <UtensilsCrossed className="h-4 w-4 mr-2" />
                    Diet Templates
                  </TabsTrigger>
                  <TabsTrigger value="workouts" data-testid="tab-workout-plans">
                    <Dumbbell className="h-4 w-4 mr-2" />
                    Workout Plans
                  </TabsTrigger>
                  <TabsTrigger value="assignments" data-testid="tab-assignments">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Diet & Workout Assignments
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="space-y-4">
                  <DietTemplateList />
                </TabsContent>

                <TabsContent value="workouts" className="space-y-4">
                  <WorkoutPlanTemplates />
                </TabsContent>

                <TabsContent value="assignments" className="space-y-4">
                  <PlanAssignments />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}
