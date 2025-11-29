import { ClientHeader } from "@/components/client-header";
import { MobileNavigation } from "@/components/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Ruler, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

export default function ClientProgressCharts() {
  const { data: weightData } = useQuery({
    queryKey: ['/api/progress/weight'],
  });

  const { data: measurementsData } = useQuery({
    queryKey: ['/api/progress/measurements'],
  });

  const weightChartData = weightData?.history?.map((entry: any) => ({
    date: format(new Date(entry.date), 'MMM dd'),
    weight: entry.weight,
    goal: weightData.goal,
  })) || [];

  const measurementChartData = measurementsData?.history?.map((entry: any) => ({
    date: format(new Date(entry.date), 'MMM dd'),
    chest: entry.chest || null,
    waist: entry.waist || null,
    hips: entry.hips || null,
  })) || [];

  const weightChange = weightData?.start && weightData?.current 
    ? weightData.current.weight - weightData.start 
    : 0;
  const isWeightLoss = weightChange < 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <ClientHeader currentPage="progress-charts" />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-6 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Progress Analytics</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Track your fitness journey with detailed charts and insights</p>
          </div>

          {/* Key Metrics */}
          {(weightData?.start || measurementsData?.history?.length) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {weightData?.start && (
                <>
                  <Card className="hover-elevate">
                    <CardHeader className="space-y-0 pb-3">
                      <CardTitle className="flex items-center justify-between text-sm font-semibold">
                        <span>Total Change</span>
                        {isWeightLoss ? (
                          <TrendingDown className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingUp className="h-5 w-5 text-blue-500" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className={`text-3xl font-bold ${isWeightLoss ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {Math.abs(weightChange).toFixed(1)} kg
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isWeightLoss ? 'Weight lost' : 'Weight gained'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover-elevate">
                    <CardHeader className="space-y-0 pb-3">
                      <CardTitle className="flex items-center justify-between text-sm font-semibold">
                        <span>Current Weight</span>
                        <Scale className="h-5 w-5 text-blue-500" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-3xl font-bold">{weightData?.current?.weight || 0}</div>
                      <p className="text-xs text-muted-foreground">kg</p>
                    </CardContent>
                  </Card>

                  <Card className="hover-elevate">
                    <CardHeader className="space-y-0 pb-3">
                      <CardTitle className="flex items-center justify-between text-sm font-semibold">
                        <span>Weight Entries</span>
                        <Activity className="h-5 w-5 text-purple-500" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-3xl font-bold">{weightChartData.length}</div>
                      <p className="text-xs text-muted-foreground">logged</p>
                    </CardContent>
                  </Card>

                  <Card className="hover-elevate">
                    <CardHeader className="space-y-0 pb-3">
                      <CardTitle className="flex items-center justify-between text-sm font-semibold">
                        <span>Measurement Entries</span>
                        <Ruler className="h-5 w-5 text-orange-500" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-3xl font-bold">{measurementChartData.length}</div>
                      <p className="text-xs text-muted-foreground">logged</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Charts */}
          <div className="space-y-6">
            {/* Weight Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-blue-500" />
                  Weight Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weightChartData.length > 0 ? (
                  <div className="w-full h-64 sm:h-80 -mx-2 sm:mx-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={weightChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '0.5rem',
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line
                          type="monotone"
                          dataKey="weight"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Current Weight (kg)"
                        />
                        {weightData?.goal && (
                          <Line
                            type="monotone"
                            dataKey="goal"
                            stroke="hsl(var(--destructive))"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="Goal Weight (kg)"
                          />
                        )}
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 sm:h-80 flex flex-col items-center justify-center text-muted-foreground">
                    <Scale className="h-12 w-12 mb-3 opacity-30" />
                    <p className="font-medium">No weight data yet</p>
                    <p className="text-sm mt-1">Start tracking your weight to see progress</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Body Measurements Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-orange-500" />
                  Body Measurements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {measurementChartData.length > 0 ? (
                  <div className="w-full h-64 sm:h-80 -mx-2 sm:mx-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={measurementChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '0.5rem',
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line
                          type="monotone"
                          dataKey="chest"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Chest (cm)"
                        />
                        <Line
                          type="monotone"
                          dataKey="waist"
                          stroke="hsl(var(--destructive))"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Waist (cm)"
                        />
                        <Line
                          type="monotone"
                          dataKey="hips"
                          stroke="hsl(var(--accent))"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Hips (cm)"
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 sm:h-80 flex flex-col items-center justify-center text-muted-foreground">
                    <Ruler className="h-12 w-12 mb-3 opacity-30" />
                    <p className="font-medium">No measurement data yet</p>
                    <p className="text-sm mt-1">Start logging measurements to see progress</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
  );
}

