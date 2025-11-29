import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { User, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import heroImage from "@assets/generated_images/Gym_hero_background_image_43c161d8.png";
import logoImage from "@assets/TWWLOGO_1763965276890.png";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="h-screen overflow-hidden">
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="FitPro" className="h-20 w-20 object-contain" />
            <span className="text-2xl font-display font-bold tracking-tight text-white hidden sm:inline">
              FitPro
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Gym hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center py-32">
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-white mb-6">
            FitPro Management System
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-16 max-w-3xl mx-auto">
            Transform your fitness journey with personalized training and nutrition
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
            <Button
              className="text-lg backdrop-blur-sm bg-blue-600 text-white border-2 border-blue-600 hover:bg-white hover:text-black hover:border-black"
              onClick={() => setLocation("/client-access")}
              data-testid="button-client-access"
            >
              <User className="h-5 w-5 mr-2" />
              Client Login
            </Button>
          </div>

          <p className="text-white/70 text-sm mt-8">
            Access your personalized dashboard with your credentials
          </p>
        </div>
      </section>
    </div>

    </div>
  );
}
