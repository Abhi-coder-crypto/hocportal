import { Button } from "@/components/ui/button";
import { MobileNavigation } from "@/components/mobile-navigation";
import { ClientHeader } from "@/components/client-header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, CreditCard, FileText, Download, Globe, Shield, Heart, Activity, Moon, Sun, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/language-context";

export default function ClientProfile() {
  const [, setLocation] = useLocation();
  const [clientId, setClientId] = useState<string | null>(null);
  const { toast } = useToast();
  const { language: currentLanguage, setLanguage, t } = useLanguage();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    fitnessLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    medicalConditions: '',
    injuries: '',
    limitations: '',
    language: 'en' as 'en' | 'hi',
    emailNotifications: true,
    sessionReminders: true,
    achievementNotifications: true,
    showEmail: false,
    showPhone: false,
    showProgress: true,
  });

  useEffect(() => {
    const id = localStorage.getItem('clientId');
    if (!id) {
      setLocation('/client-access');
    } else {
      setClientId(id);
    }
  }, [setLocation]);

  const { data: client, isLoading: isLoadingClient } = useQuery<any>({
    queryKey: [`/api/clients/${clientId}`],
    enabled: !!clientId,
  });

  // Initialize form data when client loads
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        bio: client.bio || '',
        fitnessLevel: client.fitnessLevel || 'beginner',
        medicalConditions: client.medicalConditions?.join(', ') || '',
        injuries: client.injuries?.join(', ') || '',
        limitations: client.limitations || '',
        language: client.language || currentLanguage,
        emailNotifications: client.notificationPreferences?.email ?? true,
        sessionReminders: client.notificationPreferences?.sessionReminders ?? true,
        achievementNotifications: client.notificationPreferences?.achievements ?? true,
        showEmail: client.privacySettings?.showEmail ?? false,
        showPhone: client.privacySettings?.showPhone ?? false,
        showProgress: client.privacySettings?.showProgress ?? true,
      });
    }
  }, [client, currentLanguage]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newMode);
  };

  const updateClientMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PATCH', `/api/clients/${clientId}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      // Sync language with provider if language was updated
      if (variables.language) {
        setLanguage(variables.language);
      }
      toast({
        title: t('common.success'),
        description: t('msg.profileUpdated'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('msg.error'),
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/logout', {});
      localStorage.removeItem('clientId');
      localStorage.removeItem('authToken');
      queryClient.clear();
      setLocation('/client-access');
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoadingClient || !client) {
    return (
      <div className="min-h-screen flex flex-col">
        <ClientHeader currentPage="profile" />
        <div className="flex items-center justify-center flex-1">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ClientHeader currentPage="profile" />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-6 max-w-4xl space-y-8">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                {getInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-display font-bold tracking-tight">{client.name}</h1>
              <p className="text-muted-foreground mt-1">{t('profile.memberSince')} {new Date(client.createdAt).toLocaleDateString(currentLanguage === 'hi' ? 'hi-IN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-chart-2">{client.packageId?.name || t('common.no')} {t('profile.plan')}</Badge>
                <Badge variant="outline" className="bg-chart-3 text-white">{t('profile.active')}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button data-testid="button-edit-profile">{t('profile.editProfile')}</Button>
              <Button variant="destructive" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">{t('tabs.personal')}</TabsTrigger>
              <TabsTrigger value="health">{t('tabs.health')}</TabsTrigger>
              <TabsTrigger value="subscription">{t('tabs.subscription')}</TabsTrigger>
              <TabsTrigger value="privacy">{t('tabs.privacy')}</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      data-testid="input-full-name" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        className="pl-10" 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        data-testid="input-email" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="phone" 
                        className="pl-10" 
                        value={formData.phone} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        data-testid="input-phone" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="address" 
                        className="pl-10" 
                        value={formData.address} 
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        data-testid="input-address" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                      id="bio" 
                      placeholder="Tell us about yourself, your fitness goals..." 
                      value={formData.bio} 
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      className="min-h-24"
                      data-testid="textarea-bio" 
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      updateClientMutation.mutate({
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        address: formData.address,
                        bio: formData.bio,
                      });
                    }}
                    disabled={updateClientMutation.isPending}
                    data-testid="button-save-personal"
                  >
                    {updateClientMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="health" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Health Profile
                  </CardTitle>
                  <CardDescription>Manage your health information and fitness level</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fitnessLevel">Fitness Level</Label>
                    <Select value={formData.fitnessLevel} onValueChange={(value: any) => setFormData({...formData, fitnessLevel: value})}>
                      <SelectTrigger id="fitnessLevel" data-testid="select-fitness-level">
                        <SelectValue placeholder="Select your fitness level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicalConditions">Medical Conditions</Label>
                    <Textarea
                      id="medicalConditions"
                      placeholder="List any medical conditions (e.g., diabetes, hypertension...)"
                      value={formData.medicalConditions}
                      onChange={(e) => setFormData({...formData, medicalConditions: e.target.value})}
                      className="min-h-20"
                      data-testid="textarea-medical-conditions"
                    />
                    <p className="text-sm text-muted-foreground">Separate multiple conditions with commas</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="injuries">Injuries or Past Surgeries</Label>
                    <Textarea
                      id="injuries"
                      placeholder="List any injuries or surgeries (e.g., knee injury, back surgery...)"
                      value={formData.injuries}
                      onChange={(e) => setFormData({...formData, injuries: e.target.value})}
                      className="min-h-20"
                      data-testid="textarea-injuries"
                    />
                    <p className="text-sm text-muted-foreground">Separate multiple items with commas</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="limitations">Physical Limitations</Label>
                    <Textarea
                      id="limitations"
                      placeholder="Describe any physical limitations or restrictions..."
                      value={formData.limitations}
                      onChange={(e) => setFormData({...formData, limitations: e.target.value})}
                      className="min-h-20"
                      data-testid="textarea-limitations"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      updateClientMutation.mutate({
                        fitnessLevel: formData.fitnessLevel,
                        medicalConditions: formData.medicalConditions ? formData.medicalConditions.split(',').map(c => c.trim()).filter(c => c) : [],
                        injuries: formData.injuries ? formData.injuries.split(',').map(i => i.trim()).filter(i => i) : [],
                        limitations: formData.limitations,
                      });
                    }}
                    disabled={updateClientMutation.isPending}
                    data-testid="button-save-health"
                  >
                    {updateClientMutation.isPending ? "Saving..." : "Save Health Profile"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {client.packageId ? (
                    <>
                      <div className="p-4 border rounded-md bg-accent/50">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xl font-bold font-display">{client.packageId.name} Plan</h3>
                          <Badge className="bg-chart-2">₹{client.packageId.price}/month</Badge>
                        </div>
                        {client.packageId.features && client.packageId.features.length > 0 && (
                          <ul className="space-y-2 text-sm">
                            {client.packageId.features.map((feature: string, index: number) => (
                              <li key={index} className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="space-y-3">
                        {client.subscriptionEndDate && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subscription ends on</span>
                            <span className="font-semibold">
                              {new Date(client.subscriptionEndDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        {client.paymentMethod && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Payment method</span>
                            <span className="font-semibold flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              {client.paymentMethod}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button variant="outline" className="flex-1" data-testid="button-change-plan">
                          Change Plan
                        </Button>
                        <Button variant="outline" className="flex-1" data-testid="button-cancel-subscription">
                          Cancel Subscription
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No active subscription</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacy Settings
                  </CardTitle>
                  <CardDescription>Control what information is visible to others</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Show Email Address</p>
                      <p className="text-sm text-muted-foreground">Allow others to see your email</p>
                    </div>
                    <Switch 
                      id="showEmail"
                      checked={formData.showEmail}
                      onCheckedChange={(checked) => setFormData({...formData, showEmail: checked})}
                      data-testid="switch-show-email"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Show Phone Number</p>
                      <p className="text-sm text-muted-foreground">Allow others to see your phone number</p>
                    </div>
                    <Switch 
                      id="showPhone"
                      checked={formData.showPhone}
                      onCheckedChange={(checked) => setFormData({...formData, showPhone: checked})}
                      data-testid="switch-show-phone"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Show Progress</p>
                      <p className="text-sm text-muted-foreground">Allow trainers to see your workout progress</p>
                    </div>
                    <Switch 
                      id="showProgress"
                      checked={formData.showProgress}
                      onCheckedChange={(checked) => setFormData({...formData, showProgress: checked})}
                      data-testid="switch-show-progress"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      updateClientMutation.mutate({
                        privacySettings: {
                          showEmail: formData.showEmail,
                          showPhone: formData.showPhone,
                          showProgress: formData.showProgress,
                        },
                      });
                    }}
                    disabled={updateClientMutation.isPending}
                    data-testid="button-save-privacy"
                  >
                    {updateClientMutation.isPending ? "Saving..." : "Save Privacy Settings"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
      <MobileNavigation />
    </>
  );
}

