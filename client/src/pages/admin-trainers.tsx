import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Trash2, Eye, EyeOff, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function AdminTrainers() {
  const style = { "--sidebar-width": "16rem" };
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const { data: trainers, isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/trainers'],
  });

  const createTrainerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; name: string; phone: string }) => {
      const response = await apiRequest('POST', '/api/admin/trainers', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/trainers'] });
      toast({
        title: "Success",
        description: "Trainer created successfully",
      });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create trainer",
        variant: "destructive",
      });
    },
  });

  const deleteTrainerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/trainers/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/trainers'] });
      toast({
        title: "Success",
        description: "Trainer deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete trainer",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setPhone("");
    setShowPassword(false);
  };

  const handleCreateTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    createTrainerMutation.mutate({ email, password, name, phone });
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-2xl font-display font-bold tracking-tight">Trainer Management</h1>
            </div>
            <ThemeToggle />
          </header>

          <main className="flex-1 overflow-auto p-8 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <div className="max-w-6xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Trainers
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Create and manage trainer credentials for your fitness center
                      </CardDescription>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-create-trainer">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Trainer
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form onSubmit={handleCreateTrainer}>
                          <DialogHeader>
                            <DialogTitle>Create New Trainer</DialogTitle>
                            <DialogDescription>
                              Add a new trainer to your system with their credentials
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="create-name">Full Name *</Label>
                              <Input
                                id="create-name"
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                data-testid="input-trainer-name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="create-email">Email *</Label>
                              <Input
                                id="create-email"
                                type="email"
                                placeholder="trainer@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                data-testid="input-trainer-email"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="create-phone">Phone Number</Label>
                              <Input
                                id="create-phone"
                                type="tel"
                                placeholder="1234567890"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                data-testid="input-trainer-phone"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="create-password">Password *</Label>
                              <div className="relative">
                                <Input
                                  id="create-password"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="At least 6 characters"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  data-testid="input-trainer-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0"
                                  onClick={() => setShowPassword(!showPassword)}
                                  data-testid="button-toggle-password"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setOpen(false);
                                resetForm();
                              }}
                              data-testid="button-cancel"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createTrainerMutation.isPending}
                              data-testid="button-submit-trainer"
                            >
                              {createTrainerMutation.isPending ? "Creating..." : "Create Trainer"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-center text-muted-foreground py-8">Loading trainers...</p>
                  ) : trainers && trainers.length > 0 ? (
                    <div className="space-y-4">
                      {trainers.map((trainer: any) => (
                        <div
                          key={trainer._id}
                          className="flex items-center justify-between p-4 border rounded-md"
                          data-testid={`trainer-card-${trainer._id}`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium" data-testid={`trainer-name-${trainer._id}`}>
                                {trainer.name}
                              </h4>
                              <Badge variant="secondary">Trainer</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground" data-testid={`trainer-email-${trainer._id}`}>
                              {trainer.email}
                            </p>
                            {trainer.phone && (
                              <p className="text-sm text-muted-foreground" data-testid={`trainer-phone-${trainer._id}`}>
                                Phone: {trainer.phone}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => deleteTrainerMutation.mutate(trainer._id)}
                            disabled={deleteTrainerMutation.isPending}
                            data-testid={`button-delete-${trainer._id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No trainers found</p>
                      <Button onClick={() => setOpen(true)} data-testid="button-create-first-trainer">
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Trainer
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}
