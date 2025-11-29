import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, Clock, MessageCircle, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface TrainerInfo {
  name: string;
  phone: string;
  email: string;
  availability: { [key: string]: { start: string; end: string } };
  specialty: string;
}

interface TrainerContactDropdownProps {
  isProOrElite: boolean;
  packageName?: string;
}

export function TrainerContactDropdown({ isProOrElite, packageName }: TrainerContactDropdownProps) {
  const [open, setOpen] = useState(false);

  const isBasicPlan = packageName && (packageName.toLowerCase().includes('fit plus') || packageName.toLowerCase().includes('basics'));

  const { data: trainerInfo, isLoading } = useQuery<TrainerInfo>({
    queryKey: ["/api/client/trainer-contact"],
    enabled: isProOrElite && open,
  });

  const getNextAvailableTime = () => {
    if (!trainerInfo?.availability) return "Check availability with trainer";
    
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayName = days[date.getDay()];
      const slot = trainerInfo.availability[dayName];
      
      if (slot?.start && slot?.end) {
        const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : dayName.charAt(0).toUpperCase() + dayName.slice(1);
        return `${label} ${slot.start} - ${slot.end}`;
      }
    }
    return "No availability this week";
  };

  const openWhatsApp = () => {
    if (trainerInfo?.phone) {
      const cleanPhone = trainerInfo.phone.replace(/\D/g, "");
      const message = `Hi ${trainerInfo.name}, I'd like to schedule a call with you.`;
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank");
    }
  };

  const handleCall = () => {
    if (trainerInfo?.phone) {
      const cleanPhone = trainerInfo.phone.replace(/\D/g, "");
      window.location.href = `tel:+${cleanPhone}`;
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        data-testid="button-trainer-contact"
        title={isProOrElite ? "Contact your trainer" : isBasicPlan ? "Upgrade to contact trainer" : "Contact your trainer"}
      >
        <Phone className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              {isProOrElite && !isBasicPlan ? "Contact Your Trainer" : "Trainer Access"}
            </DialogTitle>
          </DialogHeader>

          {isProOrElite && !isBasicPlan ? (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : trainerInfo ? (
                <div className="space-y-5">
                  {/* Trainer Name & Specialty */}
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1 font-semibold">Assigned Trainer</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {trainerInfo.name}
                    </p>
                    {trainerInfo.specialty && (
                      <p className="text-xs text-muted-foreground">{trainerInfo.specialty}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  {trainerInfo.phone && (
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-2 font-semibold">Contact</p>
                      <p className="text-sm font-mono font-bold text-green-600 dark:text-green-400 mb-3">
                        {trainerInfo.phone}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCall}
                          size="sm"
                          variant="default"
                          className="flex-1 gap-2"
                          data-testid="button-call"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Call
                        </Button>
                        <Button
                          onClick={openWhatsApp}
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-2"
                          data-testid="button-whatsapp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Availability */}
                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-2 font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Next Available Time
                    </p>
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {getNextAvailableTime()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No trainer assigned yet. Contact support to get started.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4 py-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/40 rounded-lg p-6 text-center">
                <Phone className="h-10 w-10 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                <h3 className="font-semibold text-base mb-2">Upgrade Your Plan</h3>
                <p className="text-xs text-muted-foreground">
                  {isBasicPlan ? "Trainer contact is available for Pro and Elite packages. Upgrade now to get direct access to your trainer." : "Trainer contact is available for Pro and Elite packages only."}
                </p>
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
