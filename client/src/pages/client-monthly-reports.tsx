import { ClientHeader } from "@/components/client-header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, TrendingUp, Award, Dumbbell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

export default function ClientMonthlyReports() {
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['/api/progress/monthly-reports'],
  });

  const currentMonth = reportsData?.current || {};
  const previousReports = reportsData?.history || [];

  const handleDownloadReport = (monthYear: string) => {
    // Generate PDF or CSV download
    const reportContent = `FitPro Monthly Report - ${monthYear}\n\n` +
      `Total Workouts: ${currentMonth.totalWorkouts}\n` +
      `Weight Change: ${currentMonth.weightChange} kg\n` +
      `Achievements Unlocked: ${currentMonth.achievements}\n` +
      `Average Weekly Completion: ${currentMonth.weeklyCompletion}%`;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitpro-report-${monthYear}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <ClientHeader currentPage="monthly-reports" />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-6 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Monthly Reports</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Comprehensive summaries of your fitness progress and activities
            </p>
          </div>

          <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {currentMonth.monthYear || format(new Date(), 'MMMM yyyy')}
                </CardTitle>
                <CardDescription>Your current month's progress summary</CardDescription>
              </div>
              <Button
                onClick={() => handleDownloadReport(currentMonth.monthYear || format(new Date(), 'MMMM-yyyy'))}
                variant="outline"
                data-testid="button-download-current"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="p-4 rounded-md border">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Workouts</span>
                </div>
                <div className="text-3xl font-bold">{currentMonth.totalWorkouts || 0}</div>
              </div>

              <div className="p-4 rounded-md border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Weight Change</span>
                </div>
                <div className="text-3xl font-bold">
                  {currentMonth.weightChange ? `${currentMonth.weightChange > 0 ? '+' : ''}${currentMonth.weightChange} kg` : 'N/A'}
                </div>
              </div>

              <div className="p-4 rounded-md border">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Achievements</span>
                </div>
                <div className="text-3xl font-bold">{currentMonth.achievements || 0}</div>
              </div>

              <div className="p-4 rounded-md border">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Weekly Completion</span>
                </div>
                <div className="text-3xl font-bold">{currentMonth.weeklyCompletion || 0}%</div>
              </div>
            </div>

            {currentMonth.highlights && currentMonth.highlights.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-3">Month Highlights</h3>
                <ul className="space-y-2">
                  {currentMonth.highlights.map((highlight: string, index: number) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Previous Reports</CardTitle>
            <CardDescription>Access your historical monthly summaries</CardDescription>
          </CardHeader>
          <CardContent>
            {previousReports.length > 0 ? (
              <div className="space-y-3">
                {previousReports.map((report: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-md border" data-testid={`report-${index}`}>
                    <div>
                      <div className="font-medium">{report.monthYear}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {report.totalWorkouts} workouts · {report.achievements} achievements
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownloadReport(report.monthYear)}
                      variant="outline"
                      size="sm"
                      data-testid={`button-download-${index}`}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No previous reports</p>
                <p className="text-sm">Keep tracking your progress to build your history</p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </main>
    </div>
  );
  );
}

