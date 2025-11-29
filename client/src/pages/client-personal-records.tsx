import { useState } from "react";
import { MobileNavigation } from "@/components/mobile-navigation";
import { ClientHeader } from "@/components/client-header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Plus, TrendingUp } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const recordCategories = [
  { value: 'bench-press', label: 'Bench Press', unit: 'kg' },
  { value: 'squat', label: 'Squat', unit: 'kg' },
  { value: 'deadlift', label: 'Deadlift', unit: 'kg' },
  { value: 'overhead-press', label: 'Overhead Press', unit: 'kg' },
  { value: 'running-5k', label: '5K Run', unit: 'min' },
  { value: 'running-10k', label: '10K Run', unit: 'min' },
  { value: 'plank', label: 'Plank Hold', unit: 'sec' },
  { value: 'pull-ups', label: 'Pull-ups', unit: 'reps' },
  { value: 'push-ups', label: 'Push-ups', unit: 'reps' },
];

export default function ClientPersonalRecords() {
  const { toast } = useToast();
  const [category, setCategory] = useState("");
  const [value, setValue] = useState("");

  const { data: recordsData, isLoading } = useQuery({
    queryKey: ['/api/progress/records'],
  });

  const addRecordMutation = useMutation({
    mutationFn: async (data: { category: string; value: number; date: string }) =>
      apiRequest('POST', '/api/progress/records', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress/records'] });
      toast({ title: "Personal record added!" });
      setCategory("");
      setValue("");
    },
    onError: () => {
      toast({ title: "Failed to add record", variant: "destructive" });
    },
  });

  const handleAddRecord = () => {
    if (!category || !value || isNaN(parseFloat(value))) {
      toast({ title: "Please select a category and enter a valid value", variant: "destructive" });
      return;
    }
    addRecordMutation.mutate({
      category,
      value: parseFloat(value),
      date: new Date().toISOString(),
    });
  };

  const records = recordsData?.records || [];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-50 via-lime-50 to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <ClientHeader currentPage="personal-records" />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-6 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Personal Records</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Track your best lifts, fastest runs, and longest holds
            </p>
          </div>

          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Log New Personal Record
            </CardTitle>
            <CardDescription>Add a new personal best to celebrate your progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="category">Exercise / Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" data-testid="select-category">
                    <SelectValue placeholder="Select exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    {recordCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">
                  Value {category && `(${recordCategories.find((c) => c.value === category)?.unit})`}
                </Label>
                <Input
                  id="value"
                  type="number"
                  step="0.1"
                  placeholder="Enter value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  data-testid="input-record-value"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddRecord}
                  disabled={addRecordMutation.isPending}
                  className="w-full"
                  data-testid="button-add-record"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  {addRecordMutation.isPending ? "Adding..." : "Add Record"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {records.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No personal records yet</p>
                <p className="text-sm">Start tracking your bests to see them here</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {recordCategories.map((cat) => {
              const categoryRecords = records.filter((r: any) => r.category === cat.value);
              if (categoryRecords.length === 0) return null;

              const best = categoryRecords.reduce((max: any, r: any) => 
                r.value > max.value ? r : max
              , categoryRecords[0]);

              return (
                <Card key={cat.value} data-testid={`record-card-${cat.value}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{cat.label}</span>
                      <Trophy className="h-5 w-5 text-primary" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-end gap-2">
                      <div className="text-4xl font-bold">{best.value}</div>
                      <div className="text-xl text-muted-foreground mb-1">{cat.unit}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Set on {format(new Date(best.date), 'PPP')}
                    </div>
                    {categoryRecords.length > 1 && (
                      <div className="pt-4 border-t">
                        <div className="text-sm font-medium mb-2">History</div>
                        <div className="space-y-2">
                          {categoryRecords.slice(0, 3).map((record: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {format(new Date(record.date), 'MMM dd, yyyy')}
                              </span>
                              <div className="flex items-center gap-1">
                                {index === 0 && <TrendingUp className="h-3 w-3 text-green-500" />}
                                <span className="font-medium">
                                  {record.value} {cat.unit}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        </div>
      </main>
    </div>
  );
      <MobileNavigation />
    </>
  );
}

