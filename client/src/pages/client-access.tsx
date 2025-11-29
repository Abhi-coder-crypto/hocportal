import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import backgroundImage from "@assets/cleint_login_1763960397741.jpg";
import logoImage from "@assets/TWWLOGO_1763965276890.png";

export default function ClientAccess() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      return response.json();
    },
    onSuccess: (data) => {
      const { user, client } = data;
      localStorage.setItem('userId', user._id);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userName', user.name);
      
      if (client) {
        localStorage.setItem('clientId', client._id);
        localStorage.setItem('clientName', client.name);
      }
      
      toast({
        title: `Welcome back, ${user.name}!`,
        description: "Redirecting to your dashboard...",
      });
      
      // Redirect based on role
      setTimeout(() => {
        if (user.role === 'admin') {
          setLocation("/admin");
        } else if (user.role === 'client') {
          setLocation("/client");
        } else {
          setLocation("/");
        }
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    loginMutation.mutate({ email: loginEmail, password: loginPassword });
  };

  return (
    <div className="h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={backgroundImage}
          alt="Gym background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/50" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="FitPro" className="h-20 w-20 object-contain" />
            <span className="text-2xl font-display font-bold tracking-tight text-white hidden sm:inline">
              FitPro
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLocation("/")}
              data-testid="button-back-home"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-md transition-colors flex items-center gap-1 font-medium cursor-pointer pointer-events-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="text-white [&_button]:text-white [&_svg]:text-white">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="relative h-screen flex items-center justify-center px-6 overflow-hidden">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader className="space-y-2 pb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mx-auto">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-center">
              <CardTitle className="text-xl font-display">Client Login</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Access your fitness dashboard
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLoginSubmit} className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="login-email" className="text-sm">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  data-testid="input-login-email"
                  className="text-sm h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="login-password" className="text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    data-testid="input-login-password"
                    className="text-sm h-9"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-9 w-9"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    data-testid="button-toggle-login-password"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-end pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs px-0 h-auto text-blue-600 hover:underline"
                  onClick={() => setLocation("/forgot-password")}
                  data-testid="link-forgot-password"
                >
                  <KeyRound className="h-3 w-3 mr-1" />
                  Forgot Password?
                </Button>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm"
                disabled={loginMutation.isPending}
                data-testid="button-login-submit"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <MobileNavigation />
    </div>
  );
}
