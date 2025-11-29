import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import logoImage from "@assets/TWWLOGO_1763965276890.png";
import bgImage from "@assets/admin_log_1763968144242.jpg";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token in sessionStorage for this tab
      if (data.token) {
        sessionStorage.setItem('adminToken', data.token);
        // Clear trainer token if it exists
        sessionStorage.removeItem('trainerToken');
      }

      toast({
        title: "Login successful",
        description: "Welcome to FitPro Admin Dashboard",
      });
      setLocation("/admin/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <div className="absolute inset-0 z-0">
        <img
          src={bgImage}
          alt="Admin login background"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
      </div>
      
      <header className="border-b relative z-20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="FitPro" className="h-20 w-20 object-contain" />
            <span className="text-2xl font-display font-bold tracking-tight hidden sm:inline text-white">
              FitPro
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              data-testid="button-back-home"
              className="text-white hover:text-white/80"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div className="text-white [&_button]:text-white [&_svg]:text-white">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="relative flex-1 flex items-center justify-center overflow-hidden z-10">
        <div className="relative z-10 container mx-auto px-6 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <CardTitle className="text-2xl font-display">Admin Login</CardTitle>
              <CardDescription className="mt-2">
                Access the FitPro admin dashboard
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@fitpro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Demo: admin@fitpro.com / Admin@123
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email || !password}
                data-testid="button-login"
              >
                {isLoading ? "Logging in..." : "Login as Admin"}
              </Button>
              <div className="text-center">
                <Button
                  variant="ghost"
                  type="button"
                  className="text-sm"
                  onClick={() => setLocation("/admin/forgot-password")}
                  data-testid="link-forgot-password"
                >
                  Forgot Password?
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </main>
    </div>

      <MobileNavigation />
    </div>
  );
}
