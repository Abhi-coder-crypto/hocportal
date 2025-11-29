import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ClientHeader } from "@/components/client-header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { AdvancedNutritionCalculators } from "@/components/advanced-nutrition-calculators";

export default function ClientCalculators() {
  const [, setLocation] = useLocation();
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("clientId");
    if (!id) {
      setLocation("/client-access");
    } else {
      setClientId(id);
    }
  }, [setLocation]);

  if (!clientId) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <ClientHeader currentPage="calculators" />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Nutrition Calculators</h1>
            <p className="text-muted-foreground">Advanced nutrition tools to optimize your fitness goals</p>
          </div>
          <AdvancedNutritionCalculators />
        </div>
      </main>
    </div>
  );
}
