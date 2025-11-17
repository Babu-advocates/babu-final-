import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { showToast } from "@/lib/toast";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, Eye, CheckCircle, AlertTriangle, LogOut, Filter, Calendar, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LegalOpinionAnalytics() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  
  const [stats, setStats] = useState({
    totalDocuments: 0,
    pending: 0,
    inReview: 0,
    completed: 0,
    delayed: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchApplications();
  }, [selectedYear, selectedMonth]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('applications')
        .select('*')
        .eq('application_type', 'legal opinion');

      // Filter by year
      const yearStart = `${selectedYear}-01-01`;
      const yearEnd = `${selectedYear}-12-31`;
      query = query.gte('created_at', yearStart).lte('created_at', yearEnd);

      // Filter by month if not "all"
      if (selectedMonth !== "all") {
        const monthNum = selectedMonth.padStart(2, '0');
        const monthStart = `${selectedYear}-${monthNum}-01`;
        const monthEnd = `${selectedYear}-${monthNum}-31`;
        query = query.gte('created_at', monthStart).lte('created_at', monthEnd);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setApplications(data || []);
      calculateStats(data || []);
      calculateChartData(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      showToast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (apps: any[]) => {
    const total = apps.length;
    const pending = apps.filter(a => a.status === 'to_be_assigned' || a.status === 'draft').length;
    const inReview = apps.filter(a => a.status === 'in_review' || a.status === 'submitted').length;
    const completed = apps.filter(a => a.status === 'completed' || a.status === 'closed' || a.digital_signature_applied).length;
    
    // Delayed: pending for more than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const delayed = apps.filter(a => {
      const createdAt = new Date(a.created_at);
      return (a.status === 'to_be_assigned' || a.status === 'in_review') && createdAt < sevenDaysAgo;
    }).length;

    setStats({
      totalDocuments: total,
      pending,
      inReview,
      completed,
      delayed
    });
  };

  const calculateChartData = (apps: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const data = months.map((month, index) => {
      const monthApps = apps.filter(app => {
        const appMonth = new Date(app.created_at).getMonth();
        return appMonth === index;
      });

      return {
        month,
        Pending: monthApps.filter(a => a.status === 'to_be_assigned' || a.status === 'draft').length,
        'In Review': monthApps.filter(a => a.status === 'in_review' || a.status === 'submitted').length,
        Completed: monthApps.filter(a => a.status === 'completed' || a.status === 'closed' || a.digital_signature_applied).length,
      };
    });

    setChartData(data);
  };

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = [
    { value: "all", label: "All Months" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background font-kontora">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="min-h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-6 gap-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
            </div>

            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Admin
            </Badge>

            {/* Year Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="ghost" size="icon">
              <Filter className="h-4 w-4" />
            </Button>

            <Select defaultValue="year">
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="year">Year</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
              </SelectContent>
            </Select>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be redirected to the login page.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                    showToast.success("Successfully logged out!");
                    navigate('/');
                  }} className="bg-destructive hover:bg-destructive/90">
                    Yes, Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="border-l-4 border-l-primary bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Documents
                  </CardTitle>
                  <FileText className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {loading ? "..." : stats.totalDocuments}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total applications submitted
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500 bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending
                  </CardTitle>
                  <Clock className="h-5 w-5 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {loading ? "..." : stats.pending}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    To be assigned
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500 bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    In Review
                  </CardTitle>
                  <Eye className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {loading ? "..." : stats.inReview}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Being reviewed
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completed
                  </CardTitle>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {loading ? "..." : stats.completed}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Finalized
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500 bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Delayed Cases
                  </CardTitle>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {loading ? "..." : stats.delayed}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pending for more than 7 days
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-xl font-bold text-foreground">
                    Document Status Trend
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Last 6 months breakdown</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Pending" fill="#eab308" />
                    <Bar dataKey="In Review" fill="#3b82f6" />
                    <Bar dataKey="Completed" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
