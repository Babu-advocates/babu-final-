import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scale, FileText, LogOut, Gavel, Download, DollarSign, Building2, UserCheck, Search, Clock, Eye, CheckCircle, XCircle, BarChart3, TrendingUp, PieChart, Filter, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { DocumentViewer } from "@/components/DocumentViewer";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { showToast } from "@/lib/toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [selectedBank, setSelectedBank] = useState("all");
  const [bankSearch, setBankSearch] = useState("");
  const [activeMenuTab, setActiveMenuTab] = useState("");
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bankFilter, setBankFilter] = useState("all");
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [bankCounters, setBankCounters] = useState<any[]>([]);
  const [litigationCases, setLitigationCases] = useState<any[]>([]);
  const [legalOpinionSearch, setLegalOpinionSearch] = useState("");
  const [legalOpinionStatusFilter, setLegalOpinionStatusFilter] = useState("all");
  const [legalOpinionBankFilter, setLegalOpinionBankFilter] = useState("all");
  const [litigationSearch, setLitigationSearch] = useState("");
  const [litigationStatusFilter, setLitigationStatusFilter] = useState("all");
  const [litigationBankFilter, setLitigationBankFilter] = useState("all");
  const [legalOpinionYear, setLegalOpinionYear] = useState(new Date().getFullYear().toString());
  const [legalOpinionMonth, setLegalOpinionMonth] = useState("all");
  const [litigationYear, setLitigationYear] = useState(new Date().getFullYear().toString());
  const [litigationMonth, setLitigationMonth] = useState("all");
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    fetchApplications();
    fetchBankAccounts();
    fetchBankCounters();
    fetchLitigationCases();

    // Set up real-time subscription for application status changes
    const channel = supabase.channel('schema-db-changes').on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'applications'
    }, payload => {
      console.log('Real-time update received:', payload);

      // Update the applications state with the new data
      setApplications(prevApps => prevApps.map(app => app.id === payload.new.id ? {
        ...app,
        ...payload.new
      } : app));

      // Show toast notification for status changes
      if (payload.old.status !== payload.new.status) {
        showToast.success(`Application ${payload.new.application_id} status updated to ${payload.new.status}`);
      }
    }).subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const fetchApplications = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('applications').select('*').order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching applications:', error);
        showToast.error('Failed to load applications');
      } else {
        setApplications(data || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      showToast.error('Failed to load applications');
    } finally {
      setApplicationsLoading(false);
    }
  };
  const fetchBankAccounts = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('bank_accounts').select('username, bank_name, is_active').eq('is_active', true).order('username', {
        ascending: true
      });
      if (error) {
        console.error('Error fetching bank accounts:', error);
        showToast.error('Failed to load bank accounts');
      } else {
        setBankAccounts(data || []);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      showToast.error('Failed to load bank accounts');
    }
  };
  const fetchBankCounters = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('bank_application_counters').select('*').order('bank_name', {
        ascending: true
      });
      if (error) {
        console.error('Error fetching bank counters:', error);
        showToast.error('Failed to load bank counters');
      } else {
        setBankCounters(data || []);
      }
    } catch (error) {
      console.error('Error fetching bank counters:', error);
      showToast.error('Failed to load bank counters');
    }
  };
  const fetchLitigationCases = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('litigation_cases').select('*').order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching litigation cases:', error);
      } else {
        setLitigationCases(data || []);
      }
    } catch (error) {
      console.error('Error fetching litigation cases:', error);
    }
  };
  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      const {
        error
      } = await supabase.from('applications').update({
        status: newStatus
      }).eq('id', applicationId);
      if (error) {
        console.error('Error updating application status:', error);
        showToast.error('Failed to update application status');
      } else {
        showToast.success(`Application ${newStatus} successfully`);
        fetchApplications(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      showToast.error('Failed to update application status');
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    sessionStorage.removeItem('adminVerified');
    showToast.success("Successfully logged out!");
    navigate('/advocate-login');
  };
  const handleDownloadDocument = (application: any) => {
    // Mock download functionality - in real app, this would download the actual document
    showToast.success(`Downloading document for ${application.application_id}`);
  };
  const handleViewDocument = (application: any) => {
    setSelectedApplication(application);
    setIsDocumentViewerOpen(true);
  };

  // Filter applications based on search and filters
  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.application_id.toLowerCase().includes(searchTerm.toLowerCase()) || app.borrower_name.toLowerCase().includes(searchTerm.toLowerCase()) || app.bank_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;

    // Filter by bank account username - find the matching bank account and check if bank names match
    const matchesBank = bankFilter === "all" || (() => {
      const selectedBankAccount = bankAccounts.find(account => account.username === bankFilter);
      return selectedBankAccount && app.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
    })();
    return matchesSearch && matchesStatus && matchesBank;
  });

  // Create dynamic banks list from bank_accounts
  const banks = [{
    id: "all",
    name: "All Banks"
  }, ...bankAccounts.map(account => ({
    id: account.username,
    name: account.bank_name
  }))];

  // Calculate dynamic bank-wise data
  const getBankWiseData = (bankId: string) => {
    if (bankId === "all") {
      const totalCases = applications.length;
      const totalDocuments = bankCounters.reduce((total, counter) => total + counter.last_sequence, 0);
      return {
        amount: 1640000,
        // Mock revenue - can be calculated based on cases
        cases: totalCases,
        documents: totalDocuments
      };
    }

    // Find matching bank account
    const bankAccount = bankAccounts.find(account => account.username === bankId);
    if (!bankAccount) {
      return {
        amount: 0,
        cases: 0,
        documents: 0
      };
    }

    // Filter applications by bank name
    const bankApplications = applications.filter(app => app.bank_name.toLowerCase().includes(bankAccount.bank_name.toLowerCase()));

    // Find counter for this bank
    const bankCounter = bankCounters.find(counter => counter.bank_name.toLowerCase().includes(bankAccount.bank_name.toLowerCase()));
    return {
      amount: bankApplications.length * 10000,
      // Mock revenue calculation
      cases: bankApplications.length,
      documents: bankCounter?.last_sequence || 0
    };
  };

  // Calculate monthly bank cases from actual applications data
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthApplications = applications.filter(app => {
    const appDate = new Date(app.created_at);
    return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear;
  });
  const monthlyBankCases = thisMonthApplications.reduce((acc, app) => {
    const bankName = app.bank_name;
    acc[bankName] = (acc[bankName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get top 5 banks by monthly cases
  const topBanks = Object.entries(monthlyBankCases).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 5).map(([bankName, cases]) => ({
    id: bankName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    name: bankName,
    cases: cases as number
  }));

  // Filter banks based on search
  const filteredBanks = Object.entries(monthlyBankCases).filter(([bankName]) => bankName.toLowerCase().includes(bankSearch.toLowerCase())).map(([bankName, cases]) => ({
    id: bankName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    name: bankName,
    cases: cases as number
  })).sort((a, b) => b.cases - a.cases);

  // Get current selected bank data
  const selectedBankData = getBankWiseData(selectedBank);

  // Generate year options from 2000 to 2099
  const yearOptions = Array.from({
    length: 100
  }, (_, i) => (2000 + i).toString());

  // Month options
  const monthOptions = [{
    value: "all",
    label: "All Months"
  }, {
    value: "0",
    label: "January"
  }, {
    value: "1",
    label: "February"
  }, {
    value: "2",
    label: "March"
  }, {
    value: "3",
    label: "April"
  }, {
    value: "4",
    label: "May"
  }, {
    value: "5",
    label: "June"
  }, {
    value: "6",
    label: "July"
  }, {
    value: "7",
    label: "August"
  }, {
    value: "8",
    label: "September"
  }, {
    value: "9",
    label: "October"
  }, {
    value: "10",
    label: "November"
  }, {
    value: "11",
    label: "December"
  }];

  // Calculate monthly data for Legal Opinion
  const getLegalOpinionMonthlyData = () => {
    const monthlyData = Array.from({
      length: 12
    }, (_, i) => ({
      month: monthOptions[i + 1].label.substring(0, 3),
      count: 0
    }));
    applications.forEach(app => {
      const appDate = new Date(app.created_at);
      const appYear = appDate.getFullYear();
      const appMonth = appDate.getMonth();

      // Apply filters
      if (appYear.toString() !== legalOpinionYear) return;
      if (legalOpinionMonth !== "all" && appMonth.toString() !== legalOpinionMonth) return;
      const matchesSearch = legalOpinionSearch === "" || app.application_id.toLowerCase().includes(legalOpinionSearch.toLowerCase()) || app.borrower_name.toLowerCase().includes(legalOpinionSearch.toLowerCase());
      
      // Special handling for completed status filter - include all completed-related statuses
      const isCompleted = app.status === 'completed' || app.status === 'closed' || app.status === 'waiting_for_approval' || app.digital_signature_applied;
      const matchesStatus = legalOpinionStatusFilter === "all" || 
                           (legalOpinionStatusFilter === "completed" && isCompleted) ||
                           (legalOpinionStatusFilter === "waiting_for_approval" && isCompleted) ||
                           app.status === legalOpinionStatusFilter;
      
      const matchesBank = legalOpinionBankFilter === "all" || (() => {
        const selectedBankAccount = bankAccounts.find(account => account.username === legalOpinionBankFilter);
        return selectedBankAccount && app.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
      })();
      if (matchesSearch && matchesStatus && matchesBank && app.loan_type !== 'litigation') {
        monthlyData[appMonth].count++;
      }
    });
    return legalOpinionMonth === "all" ? monthlyData : monthlyData.filter((_, i) => i.toString() === legalOpinionMonth);
  };

  // Calculate monthly data for Litigation with status breakdown
  const getLitigationMonthlyData = () => {
    const monthlyData = Array.from({
      length: 12
    }, (_, i) => ({
      month: monthOptions[i + 1].label.substring(0, 3),
      Pending: 0,
      Decreed: 0,
      Dismissed: 0
    }));
    litigationCases.forEach(litigationCase => {
      const caseDate = new Date(litigationCase.created_at);
      const caseYear = caseDate.getFullYear();
      const caseMonth = caseDate.getMonth();

      // Apply filters
      if (caseYear.toString() !== litigationYear) return;
      if (litigationMonth !== "all" && caseMonth.toString() !== litigationMonth) return;
      const matchesSearch = litigationSearch === "" || litigationCase.case_no && litigationCase.case_no.toLowerCase().includes(litigationSearch.toLowerCase()) || litigationCase.borrower_name && litigationCase.borrower_name.toLowerCase().includes(litigationSearch.toLowerCase());
      const matchesStatus = litigationStatusFilter === "all" || litigationCase.status?.toLowerCase() === litigationStatusFilter.toLowerCase();
      const matchesBank = litigationBankFilter === "all" || (() => {
        const selectedBankAccount = bankAccounts.find(account => account.username === litigationBankFilter);
        return selectedBankAccount && litigationCase.bank_name && litigationCase.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
      })();
      if (matchesSearch && matchesStatus && matchesBank) {
        const status = litigationCase.status || 'Pending';
        if (status === 'Pending') {
          monthlyData[caseMonth].Pending++;
        } else if (status === 'Decreed') {
          monthlyData[caseMonth].Decreed++;
        } else if (status === 'Dismissed') {
          monthlyData[caseMonth].Dismissed++;
        }
      }
    });
    return litigationMonth === "all" ? monthlyData : monthlyData.filter((_, i) => i.toString() === litigationMonth);
  };
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-legal-bg">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-gradient-to-r from-white/95 to-blue-50/95 backdrop-blur-sm shadow-elegant border-b border-white/20">
            <div className="px-6">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-3">
                  <SidebarTrigger className="text-slate-600 hover:text-blue-600 transition-colors duration-200" />
                  <div className="flex items-center space-x-3 group cursor-pointer">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center hover-scale transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-200">
                      <Scale className="h-6 w-6 text-white transition-transform duration-300 group-hover:rotate-12" />
                    </div>
                    <div className="transition-transform duration-200 group-hover:translate-x-1">
                      <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent transition-all duration-300 group-hover:from-blue-600 group-hover:to-purple-600">Babu Advocate</h1>
                      <p className="text-sm text-slate-600 transition-colors duration-200 group-hover:text-blue-600">Admin Dashboard</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Button onClick={() => navigate('/attendance')} variant="ghost" className="bg-emerald-600 text-white hover:bg-white hover:text-emerald-600 hover:border-emerald-600 border-2 border-emerald-600 hover-scale transition-all duration-200 group" title="Employee Attendance">
                    <UserCheck className="h-5 w-5 mr-2 transition-transform duration-200 group-hover:scale-110" />
                    <span className="hidden sm:inline">Attendance</span>
                  </Button>
                  <NotificationDropdown />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white border-red-600">
                        <LogOut className="h-4 w-4 mr-2 transition-transform duration-200" />
                        Logout
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You will be redirected to the login page and will need to sign in again.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                          Yes, Logout
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="px-6 py-8">
              {/* Welcome Section */}
              <div className="mb-8 animate-fade-in">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 transition-all duration-300 hover:from-purple-600 hover:via-pink-500 hover:to-orange-500 cursor-pointer">Welcome back, Admin!</h2>
                <p className="text-slate-600 transition-colors duration-200 hover:text-blue-600 cursor-pointer">Here's what's happening in your law firm today.</p>
              </div>

              {/* Tabs Navigation */}
              <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/80 backdrop-blur-sm border border-primary/20 shadow-md">
                  <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger value="legal-opinion" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-green-600 data-[state=active]:text-white transition-all duration-300">
                    <FileText className="h-4 w-4 mr-2" />
                    Legal Opinion Analytics
                  </TabsTrigger>
                  <TabsTrigger value="litigation" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-600 data-[state=active]:text-white transition-all duration-300">
                    <Gavel className="h-4 w-4 mr-2" />
                    Litigation Analytics
                  </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab Content */}
                <TabsContent value="dashboard" className="space-y-8">

              {/* Dashboard Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Cases */}
                <Card className="bg-gradient-to-br from-white/95 to-blue-50/50 backdrop-blur-sm shadow-elegant border border-white/20 hover:shadow-2xl hover:shadow-blue-100 transition-all duration-300 group cursor-pointer hover-scale animate-fade-in" onClick={() => navigate('/admin/applications')}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <Gavel className="h-6 w-6 text-blue-600 transition-all duration-300 group-hover:text-purple-600 group-hover:rotate-12 group-hover:scale-110" />
                      <h3 className="font-semibold text-slate-700 transition-colors duration-200 group-hover:text-blue-600">Total Cases Currently</h3>
                    </div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent transition-all duration-300 group-hover:from-purple-600 group-hover:to-blue-600 group-hover:scale-105 transform">
                      {applications.length}
                    </p>
                    <p className="text-sm text-slate-600 mt-1 transition-colors duration-200 group-hover:text-blue-500">Across all banks</p>
                  </CardContent>
                </Card>

                {/* Bank Accounts */}
                <Card className="bg-gradient-to-br from-white/95 to-emerald-50/30 backdrop-blur-sm shadow-elegant border border-white/20 hover:shadow-2xl hover:shadow-emerald-100 transition-all duration-300 group cursor-pointer hover-scale animate-fade-in" style={{
                    animationDelay: '100ms'
                  }} onClick={() => navigate('/admin/bank-logins')}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <Building2 className="h-6 w-6 text-emerald-600 transition-all duration-300 group-hover:text-green-600 group-hover:scale-110 group-hover:rotate-12" />
                      <h3 className="font-semibold text-slate-700 transition-colors duration-200 group-hover:text-emerald-600">Bank Accounts</h3>
                    </div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent transition-all duration-300 group-hover:from-green-600 group-hover:to-emerald-600 group-hover:scale-105 transform">
                      {bankAccounts.length}
                    </p>
                    <p className="text-sm text-slate-600 mt-1 transition-colors duration-200 group-hover:text-emerald-500">Active accounts</p>
                  </CardContent>
                </Card>

                {/* Monthly Cases */}
                <Card className="bg-gradient-to-br from-white/95 to-orange-50/30 backdrop-blur-sm shadow-elegant border border-white/20 hover:shadow-2xl hover:shadow-orange-100 transition-all duration-300 group cursor-pointer hover-scale animate-fade-in" style={{
                    animationDelay: '200ms'
                  }}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-6 w-6 text-orange-600 transition-all duration-300 group-hover:text-amber-600 group-hover:scale-110 group-hover:rotate-6" />
                      <h3 className="font-semibold text-slate-700 transition-colors duration-200 group-hover:text-orange-600">This Month</h3>
                    </div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent transition-all duration-300 group-hover:from-amber-600 group-hover:to-orange-600 group-hover:scale-105 transform">
                      {thisMonthApplications.length}
                    </p>
                    <p className="text-sm text-slate-600 mt-1 transition-colors duration-200 group-hover:text-orange-500">New cases</p>
                  </CardContent>
                </Card>

                {/* Total Documents */}
                <Card className="bg-gradient-to-br from-white/95 to-purple-50/30 backdrop-blur-sm shadow-elegant border border-white/20 hover:shadow-2xl hover:shadow-purple-100 transition-all duration-300 group cursor-pointer hover-scale animate-fade-in" style={{
                    animationDelay: '300ms'
                  }}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <Download className="h-6 w-6 text-purple-600 transition-all duration-300 group-hover:text-pink-600 group-hover:rotate-12 group-hover:scale-110" />
                      <h3 className="font-semibold text-slate-700 transition-colors duration-200 group-hover:text-purple-600">Documents</h3>
                    </div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent transition-all duration-300 group-hover:from-pink-600 group-hover:to-purple-600 group-hover:scale-105 transform">
                      {bankCounters.reduce((total, counter) => total + counter.last_sequence, 0)}
                    </p>
                    <p className="text-sm text-slate-600 mt-1 transition-colors duration-200 group-hover:text-purple-500">Total processed</p>
                  </CardContent>
                </Card>
              </div>

              {/* Bank-wise Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in" style={{
                  animationDelay: '400ms'
                }}>
                {/* Bank Selection & Sales */}
                <Card className="bg-gradient-to-br from-white/95 to-blue-50/30 backdrop-blur-sm shadow-elegant border border-white/20 hover:shadow-2xl hover:shadow-blue-100 transition-all duration-300 hover-scale">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 group">
                      <Building2 className="h-5 w-5 text-blue-600 transition-all duration-300 group-hover:text-indigo-600 group-hover:scale-110 group-hover:rotate-6" />
                      <span className="bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent transition-all duration-300 group-hover:from-blue-600 group-hover:to-indigo-600">Bank-wise Sales</span>
                    </CardTitle>
                    <CardDescription className="text-slate-600 transition-colors duration-200 group-hover:text-blue-600">Select a bank to view detailed metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select value={selectedBank} onValueChange={setSelectedBank}>
                      <SelectTrigger className="w-full hover:border-blue-400 hover:shadow-md transition-all duration-200 group">
                        <SelectValue placeholder="Select a bank" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-sm border border-blue-100">
                        {banks.map(bank => <SelectItem key={bank.id} value={bank.id} className="hover:bg-blue-50 transition-colors duration-200 cursor-pointer">
                            {bank.name}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                    
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 p-4 rounded-lg border border-blue-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100 transition-all duration-300 space-y-3 group">
                      <div className="flex items-center justify-between p-2 rounded hover:bg-white/50 transition-all duration-200">
                        <span className="text-sm font-medium text-slate-600 transition-colors duration-200 group-hover:text-slate-700">Revenue</span>
                        <span className="text-lg font-bold text-emerald-600 transition-all duration-200 group-hover:scale-105 transform">
                          ₹{selectedBankData.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded hover:bg-white/50 transition-all duration-200">
                        <span className="text-sm font-medium text-slate-600 transition-colors duration-200 group-hover:text-slate-700">Cases</span>
                        <span className="text-lg font-bold text-blue-600 transition-all duration-200 group-hover:scale-105 transform">
                          {selectedBankData.cases}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded hover:bg-white/50 transition-all duration-200">
                        <span className="text-sm font-medium text-slate-600 transition-colors duration-200 group-hover:text-slate-700">Documents</span>
                        <span className="text-lg font-bold text-purple-600 transition-all duration-200 group-hover:scale-105 transform">
                          {selectedBankData.documents}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Bank-wise Cases */}
                <Card className="bg-gradient-to-br from-white/95 to-emerald-50/30 backdrop-blur-sm shadow-elegant border border-white/20 hover:shadow-2xl hover:shadow-emerald-100 transition-all duration-300 hover-scale">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 group">
                      <Gavel className="h-5 w-5 text-emerald-600 transition-all duration-300 group-hover:text-green-600 group-hover:rotate-12 group-hover:scale-110" />
                      <span className="bg-gradient-to-r from-slate-800 to-emerald-600 bg-clip-text text-transparent transition-all duration-300 group-hover:from-emerald-600 group-hover:to-green-600">Monthly Cases by Bank</span>
                    </CardTitle>
                    <CardDescription className="text-slate-600 transition-colors duration-200 group-hover:text-emerald-600">Top 5 banks with search for others</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Search Input */}
                    <div className="relative group">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 transition-colors duration-200 group-hover:text-emerald-500" />
                      <Input placeholder="Search banks..." value={bankSearch} onChange={e => setBankSearch(e.target.value)} className="pl-10 bg-white/80 backdrop-blur-sm border-slate-200 focus:border-emerald-400 hover:border-emerald-300 transition-all duration-200 focus:shadow-md focus:shadow-emerald-100" />
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {bankSearch ?
                        // Show filtered search results
                        filteredBanks.length > 0 ? filteredBanks.map((bank, index) => <div key={bank.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-lg hover:from-blue-50 hover:to-blue-100 transition-all duration-200 hover:shadow-md hover:scale-[1.02] transform group cursor-pointer" style={{
                          animationDelay: `${index * 50}ms`
                        }}>
                              <span className="text-sm font-medium text-slate-700 transition-colors duration-200 group-hover:text-blue-700">{bank.name}</span>
                              <Badge variant="secondary" className="bg-blue-600 text-white transition-all duration-200 group-hover:bg-blue-700 group-hover:scale-110 transform">{bank.cases.toString()}</Badge>
                            </div>) : <div className="text-center py-4 text-slate-500 animate-fade-in">No banks found matching your search.</div> :
                        // Show top 5 banks by default
                        topBanks.map((bank, index) => <div key={bank.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-lg hover:from-blue-50 hover:to-blue-100 transition-all duration-200 hover:shadow-md hover:scale-[1.02] transform group cursor-pointer animate-fade-in" style={{
                          animationDelay: `${index * 100}ms`
                        }}>
                            <span className="text-sm font-medium text-slate-700 transition-colors duration-200 group-hover:text-blue-700">{bank.name}</span>
                            <Badge variant="secondary" className="bg-blue-600 text-white transition-all duration-200 group-hover:bg-blue-700 group-hover:scale-110 transform">{bank.cases.toString()}</Badge>
                          </div>)}
                    </div>
                    
                    {!bankSearch && <div className="text-center pt-2 animate-fade-in" style={{
                        animationDelay: '500ms'
                      }}>
                        <p className="text-xs text-slate-500 transition-colors duration-200 hover:text-emerald-600 cursor-default">Showing top 5 banks. Use search to find others.</p>
                      </div>}
                  </CardContent>
                </Card>
              </div>
                </TabsContent>

                {/* Legal Opinion Analytics Tab */}
                <TabsContent value="legal-opinion" className="space-y-8">
                  {/* Filters Section */}
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Filter className="h-5 w-5 text-muted-foreground" />
                        <span>Filter Legal Opinions</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        <Select value={legalOpinionStatusFilter} onValueChange={setLegalOpinionStatusFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="to_be_assigned">To Be Assigned</SelectItem>
                            <SelectItem value="in_review">In Review</SelectItem>
                            <SelectItem value="waiting_for_approval">Waiting for Approval</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={legalOpinionBankFilter} onValueChange={setLegalOpinionBankFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by bank" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Banks</SelectItem>
                            {bankAccounts.map(account => <SelectItem key={account.username} value={account.username}>
                                {account.bank_name}
                              </SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Legal Opinions */}
                    <Card className="border-l-4 border-l-primary bg-card shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total Opinions
                        </CardTitle>
                        <FileText className="h-5 w-5 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                          {applications.filter(app => {
                          const matchesSearch = legalOpinionSearch === "" || app.application_id.toLowerCase().includes(legalOpinionSearch.toLowerCase()) || app.borrower_name.toLowerCase().includes(legalOpinionSearch.toLowerCase());
                          const matchesStatus = legalOpinionStatusFilter === "all" || app.status === legalOpinionStatusFilter;
                          const matchesBank = legalOpinionBankFilter === "all" || (() => {
                            const selectedBankAccount = bankAccounts.find(account => account.username === legalOpinionBankFilter);
                            return selectedBankAccount && app.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
                          })();
                          return matchesSearch && matchesStatus && matchesBank;
                        }).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">All legal opinions</p>
                      </CardContent>
                    </Card>

                    {/* Pending Opinions */}
                    <Card className="border-l-4 border-l-yellow-500 bg-card shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Pending
                        </CardTitle>
                        <Clock className="h-5 w-5 text-yellow-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                          {(() => {
                            // Show 0 if status filter is set to a non-pending status
                            if (legalOpinionStatusFilter !== "all" && 
                                legalOpinionStatusFilter !== "to_be_assigned") {
                              return 0;
                            }
                            
                            return applications.filter(app => {
                              const matchesSearch = legalOpinionSearch === "" || app.application_id.toLowerCase().includes(legalOpinionSearch.toLowerCase()) || app.borrower_name.toLowerCase().includes(legalOpinionSearch.toLowerCase());
                              const matchesBank = legalOpinionBankFilter === "all" || (() => {
                                const selectedBankAccount = bankAccounts.find(account => account.username === legalOpinionBankFilter);
                                return selectedBankAccount && app.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
                              })();
                              return matchesSearch && matchesBank && app.status === 'to_be_assigned';
                            }).length;
                          })()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">To be assigned</p>
                      </CardContent>
                    </Card>

                    {/* In Review */}
                    <Card className="border-l-4 border-l-blue-500 bg-card shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          In Review
                        </CardTitle>
                        <Eye className="h-5 w-5 text-blue-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                          {applications.filter(app => {
                          const matchesSearch = legalOpinionSearch === "" || app.application_id.toLowerCase().includes(legalOpinionSearch.toLowerCase()) || app.borrower_name.toLowerCase().includes(legalOpinionSearch.toLowerCase());
                          const matchesStatus = legalOpinionStatusFilter === "all" || app.status === legalOpinionStatusFilter;
                          const matchesBank = legalOpinionBankFilter === "all" || (() => {
                            const selectedBankAccount = bankAccounts.find(account => account.username === legalOpinionBankFilter);
                            return selectedBankAccount && app.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
                          })();
                          return matchesSearch && matchesStatus && matchesBank && app.status === 'in_review';
                        }).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Being reviewed</p>
                      </CardContent>
                    </Card>

                    {/* Completed */}
                    <Card className="border-l-4 border-l-green-500 bg-card shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Completed
                        </CardTitle>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                          {(() => {
                            // Show 0 if status filter is set to a non-completed status
                            if (legalOpinionStatusFilter !== "all" && 
                                legalOpinionStatusFilter !== "completed" && 
                                legalOpinionStatusFilter !== "waiting_for_approval") {
                              return 0;
                            }
                            
                            return applications.filter(app => {
                              const matchesSearch = legalOpinionSearch === "" || app.application_id.toLowerCase().includes(legalOpinionSearch.toLowerCase()) || app.borrower_name.toLowerCase().includes(legalOpinionSearch.toLowerCase());
                              const matchesBank = legalOpinionBankFilter === "all" || (() => {
                                const selectedBankAccount = bankAccounts.find(account => account.username === legalOpinionBankFilter);
                                return selectedBankAccount && app.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
                              })();
                              return matchesSearch && matchesBank && (app.status === 'completed' || app.status === 'closed' || app.status === 'waiting_for_approval' || app.digital_signature_applied);
                            }).length;
                          })()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Finalized</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Document Status Trend */}
                  <Card className="shadow-sm">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="h-5 w-5 text-muted-foreground" />
                            <span>Document Status Trend</span>
                          </CardTitle>
                          <CardDescription>
                            {legalOpinionMonth === "all" ? `Last 12 months breakdown for ${legalOpinionYear}` : `${monthOptions.find(m => m.value === legalOpinionMonth)?.label} ${legalOpinionYear}`}
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Select value={legalOpinionYear} onValueChange={setLegalOpinionYear}>
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {yearOptions.map(year => <SelectItem key={year} value={year}>
                                  {year}
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select value={legalOpinionMonth} onValueChange={setLegalOpinionMonth}>
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                              {monthOptions.map(month => <SelectItem key={month.value} value={month.value}>
                                  {month.label}
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getLegalOpinionMonthlyData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <Tooltip contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px"
                        }} />
                          <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Status Distribution Bar Chart */}
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        <span>Legal Opinion Status Distribution</span>
                      </CardTitle>
                      <CardDescription>Visual breakdown of legal opinion statuses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[{
                        name: 'To Be Assigned',
                        count: applications.filter(app => {
                          const appDate = new Date(app.created_at);
                          const appYear = appDate.getFullYear();
                          const appMonth = appDate.getMonth();
                          
                          if (appYear.toString() !== legalOpinionYear) return false;
                          if (legalOpinionMonth !== "all" && appMonth.toString() !== legalOpinionMonth) return false;
                          
                          const matchesSearch = legalOpinionSearch === "" || app.application_id.toLowerCase().includes(legalOpinionSearch.toLowerCase()) || app.borrower_name.toLowerCase().includes(legalOpinionSearch.toLowerCase());
                          
                          // Special handling for completed status filter
                          const isCompleted = app.status === 'completed' || app.status === 'closed' || app.status === 'waiting_for_approval' || app.digital_signature_applied;
                          const matchesStatus = legalOpinionStatusFilter === "all" || 
                                               (legalOpinionStatusFilter === "completed" && isCompleted) ||
                                               (legalOpinionStatusFilter === "waiting_for_approval" && isCompleted) ||
                                               app.status === legalOpinionStatusFilter;
                          
                          const matchesBank = legalOpinionBankFilter === "all" || (() => {
                            const selectedBankAccount = bankAccounts.find(account => account.username === legalOpinionBankFilter);
                            return selectedBankAccount && app.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
                          })();
                          return matchesSearch && matchesStatus && matchesBank && app.status === 'to_be_assigned';
                        }).length
                      }, {
                        name: 'In Review',
                        count: applications.filter(app => {
                          const appDate = new Date(app.created_at);
                          const appYear = appDate.getFullYear();
                          const appMonth = appDate.getMonth();
                          
                          if (appYear.toString() !== legalOpinionYear) return false;
                          if (legalOpinionMonth !== "all" && appMonth.toString() !== legalOpinionMonth) return false;
                          
                          const matchesSearch = legalOpinionSearch === "" || app.application_id.toLowerCase().includes(legalOpinionSearch.toLowerCase()) || app.borrower_name.toLowerCase().includes(legalOpinionSearch.toLowerCase());
                          
                          // Special handling for completed status filter
                          const isCompleted = app.status === 'completed' || app.status === 'closed' || app.status === 'waiting_for_approval' || app.digital_signature_applied;
                          const matchesStatus = legalOpinionStatusFilter === "all" || 
                                               (legalOpinionStatusFilter === "completed" && isCompleted) ||
                                               (legalOpinionStatusFilter === "waiting_for_approval" && isCompleted) ||
                                               app.status === legalOpinionStatusFilter;
                          
                          const matchesBank = legalOpinionBankFilter === "all" || (() => {
                            const selectedBankAccount = bankAccounts.find(account => account.username === legalOpinionBankFilter);
                            return selectedBankAccount && app.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
                          })();
                          return matchesSearch && matchesStatus && matchesBank && app.status === 'in_review';
                        }).length
                      }, {
                        name: 'Waiting for Approval',
                        count: applications.filter(app => {
                          const appDate = new Date(app.created_at);
                          const appYear = appDate.getFullYear();
                          const appMonth = appDate.getMonth();
                          
                          if (appYear.toString() !== legalOpinionYear) return false;
                          if (legalOpinionMonth !== "all" && appMonth.toString() !== legalOpinionMonth) return false;
                          
                          const matchesSearch = legalOpinionSearch === "" || app.application_id.toLowerCase().includes(legalOpinionSearch.toLowerCase()) || app.borrower_name.toLowerCase().includes(legalOpinionSearch.toLowerCase());
                          
                          // Special handling for completed status filter
                          const isCompleted = app.status === 'completed' || app.status === 'closed' || app.status === 'waiting_for_approval' || app.digital_signature_applied;
                          const matchesStatus = legalOpinionStatusFilter === "all" || 
                                               (legalOpinionStatusFilter === "completed" && isCompleted) ||
                                               (legalOpinionStatusFilter === "waiting_for_approval" && isCompleted) ||
                                               app.status === legalOpinionStatusFilter;
                          
                          const matchesBank = legalOpinionBankFilter === "all" || (() => {
                            const selectedBankAccount = bankAccounts.find(account => account.username === legalOpinionBankFilter);
                            return selectedBankAccount && app.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
                          })();
                          return matchesSearch && matchesStatus && matchesBank && app.status === 'waiting_for_approval';
                        }).length
                      }, {
                        name: 'Completed',
                        count: applications.filter(app => {
                          const appDate = new Date(app.created_at);
                          const appYear = appDate.getFullYear();
                          const appMonth = appDate.getMonth();
                          
                          if (appYear.toString() !== legalOpinionYear) return false;
                          if (legalOpinionMonth !== "all" && appMonth.toString() !== legalOpinionMonth) return false;
                          
                          const matchesSearch = legalOpinionSearch === "" || app.application_id.toLowerCase().includes(legalOpinionSearch.toLowerCase()) || app.borrower_name.toLowerCase().includes(legalOpinionSearch.toLowerCase());
                          
                          // Special handling for completed status filter - include all completed-related statuses
                          const isCompleted = app.status === 'completed' || app.status === 'closed' || app.status === 'waiting_for_approval' || app.digital_signature_applied;
                          const matchesStatus = legalOpinionStatusFilter === "all" || 
                                               (legalOpinionStatusFilter === "completed" && isCompleted) ||
                                               (legalOpinionStatusFilter === "waiting_for_approval" && isCompleted) ||
                                               app.status === legalOpinionStatusFilter;
                          
                          const matchesBank = legalOpinionBankFilter === "all" || (() => {
                            const selectedBankAccount = bankAccounts.find(account => account.username === legalOpinionBankFilter);
                            return selectedBankAccount && app.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
                          })();
                          return matchesSearch && matchesStatus && matchesBank && isCompleted;
                        }).length
                      }]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Bank-wise Opinion Distribution */}
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <PieChart className="h-5 w-5 text-muted-foreground" />
                        <span>Bank-wise Opinion Distribution</span>
                      </CardTitle>
                      <CardDescription>Legal opinions submitted by each bank</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(() => {
                          // Filter applications based on year, month, and bank filters
                          const filteredApps = applications.filter(app => {
                            const appDate = new Date(app.created_at);
                            const appYear = appDate.getFullYear();
                            const appMonth = appDate.getMonth();
                            
                            // Apply year filter
                            if (appYear.toString() !== legalOpinionYear) return false;
                            
                            // Apply month filter
                            if (legalOpinionMonth !== "all" && appMonth.toString() !== legalOpinionMonth) return false;
                            
                            // Apply bank filter
                            if (legalOpinionBankFilter !== "all") {
                              const selectedBankAccount = bankAccounts.find(account => account.username === legalOpinionBankFilter);
                              if (!selectedBankAccount || !app.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase())) {
                                return false;
                              }
                            }
                            
                            // Apply status filter
                            if (legalOpinionStatusFilter !== "all" && app.status !== legalOpinionStatusFilter) {
                              return false;
                            }
                            
                            return true;
                          });
                          
                          // Group by bank name
                          const bankCounts = filteredApps.reduce((acc, app) => {
                            const bankName = app.bank_name;
                            acc[bankName] = (acc[bankName] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>);
                          
                          // Sort by count
                          const sortedBanks = Object.entries(bankCounts).sort(([, a], [, b]) => (b as number) - (a as number));
                          
                          const totalCount = filteredApps.length;
                          
                          return sortedBanks.map(([bankName, count]) => {
                            const caseCount = count as number;
                            const percentage = totalCount > 0 ? (caseCount / totalCount) * 100 : 0;
                            return (
                              <div key={bankName} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all duration-200">
                                <div className="flex items-center space-x-3">
                                  <Building2 className="h-5 w-5 text-primary" />
                                  <span className="font-medium text-foreground">{bankName}</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <div className="w-48 bg-muted rounded-full h-2">
                                    <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{
                                      width: `${percentage}%`
                                    }} />
                                  </div>
                                  <Badge variant="secondary">
                                    {caseCount}
                                  </Badge>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Litigation Analytics Tab */}
                <TabsContent value="litigation" className="space-y-8">
                  {/* Filters Section */}
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Filter className="h-5 w-5 text-muted-foreground" />
                        <span>Filter Litigation Cases</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Search by application ID, borrower..." value={litigationSearch} onChange={e => setLitigationSearch(e.target.value)} className="pl-10" />
                        </div>
                        <Select value={litigationStatusFilter} onValueChange={setLitigationStatusFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="decreed">Decreed</SelectItem>
                            <SelectItem value="dismissed">Dismissed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={litigationBankFilter} onValueChange={setLitigationBankFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by bank" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Banks</SelectItem>
                            {bankAccounts.map(account => <SelectItem key={account.username} value={account.username}>
                                {account.bank_name}
                              </SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Litigation Cases */}
                    <Card className="border-l-4 border-l-primary bg-card shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total Cases
                        </CardTitle>
                        <Gavel className="h-5 w-5 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                          {litigationCases.filter(litigationCase => {
                          const matchesSearch = litigationSearch === "" || litigationCase.case_no && litigationCase.case_no.toLowerCase().includes(litigationSearch.toLowerCase()) || litigationCase.borrower_name && litigationCase.borrower_name.toLowerCase().includes(litigationSearch.toLowerCase());
                          const matchesStatus = litigationStatusFilter === "all" || litigationCase.status?.toLowerCase() === litigationStatusFilter.toLowerCase();
                          const matchesBank = litigationBankFilter === "all" || (() => {
                            const selectedBankAccount = bankAccounts.find(account => account.username === litigationBankFilter);
                            return selectedBankAccount && litigationCase.bank_name && litigationCase.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
                          })();
                          return matchesSearch && matchesStatus && matchesBank;
                        }).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">All litigation cases</p>
                      </CardContent>
                    </Card>

                    {/* Pending Cases */}
                    <Card className="border-l-4 border-l-yellow-500 bg-card shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Pending
                        </CardTitle>
                        <Clock className="h-5 w-5 text-yellow-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                          {litigationCases.filter(litigationCase => {
                          const matchesSearch = litigationSearch === "" || litigationCase.case_no && litigationCase.case_no.toLowerCase().includes(litigationSearch.toLowerCase()) || litigationCase.borrower_name && litigationCase.borrower_name.toLowerCase().includes(litigationSearch.toLowerCase());
                          const matchesStatus = litigationStatusFilter === "all" || litigationCase.status?.toLowerCase() === litigationStatusFilter.toLowerCase();
                          const matchesBank = litigationBankFilter === "all" || (() => {
                            const selectedBankAccount = bankAccounts.find(account => account.username === litigationBankFilter);
                            return selectedBankAccount && litigationCase.bank_name && litigationCase.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
                          })();
                          return matchesSearch && matchesStatus && matchesBank && litigationCase.status === 'Pending';
                        }).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
                      </CardContent>
                    </Card>

                    {/* Decreed Cases */}
                    <Card className="border-l-4 border-l-blue-500 bg-card shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Decreed
                        </CardTitle>
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                          {litigationCases.filter(litigationCase => {
                          const matchesSearch = litigationSearch === "" || litigationCase.case_no && litigationCase.case_no.toLowerCase().includes(litigationSearch.toLowerCase()) || litigationCase.borrower_name && litigationCase.borrower_name.toLowerCase().includes(litigationSearch.toLowerCase());
                          const matchesStatus = litigationStatusFilter === "all" || litigationCase.status?.toLowerCase() === litigationStatusFilter.toLowerCase();
                          const matchesBank = litigationBankFilter === "all" || (() => {
                            const selectedBankAccount = bankAccounts.find(account => account.username === litigationBankFilter);
                            return selectedBankAccount && litigationCase.bank_name && litigationCase.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
                          })();
                          return matchesSearch && matchesStatus && matchesBank && litigationCase.status === 'Decreed';
                        }).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Cases decreed</p>
                      </CardContent>
                    </Card>

                    {/* Dismissed Cases */}
                    <Card className="border-l-4 border-l-green-500 bg-card shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Dismissed
                        </CardTitle>
                        <XCircle className="h-5 w-5 text-green-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                          {litigationCases.filter(litigationCase => {
                          const matchesSearch = litigationSearch === "" || litigationCase.case_no && litigationCase.case_no.toLowerCase().includes(litigationSearch.toLowerCase()) || litigationCase.borrower_name && litigationCase.borrower_name.toLowerCase().includes(litigationSearch.toLowerCase());
                          const matchesStatus = litigationStatusFilter === "all" || litigationCase.status?.toLowerCase() === litigationStatusFilter.toLowerCase();
                          const matchesBank = litigationBankFilter === "all" || (() => {
                            const selectedBankAccount = bankAccounts.find(account => account.username === litigationBankFilter);
                            return selectedBankAccount && litigationCase.bank_name && litigationCase.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
                          })();
                          return matchesSearch && matchesStatus && matchesBank && litigationCase.status === 'Dismissed';
                        }).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Cases dismissed</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Document Status Trend */}
                  <Card className="shadow-sm">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="h-5 w-5 text-muted-foreground" />
                            <span>Document Status Trend</span>
                          </CardTitle>
                          <CardDescription>
                            {litigationMonth === "all" ? `Last 12 months breakdown for ${litigationYear}` : `${monthOptions.find(m => m.value === litigationMonth)?.label} ${litigationYear}`}
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Select value={litigationYear} onValueChange={setLitigationYear}>
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {yearOptions.map(year => <SelectItem key={year} value={year}>
                                  {year}
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select value={litigationMonth} onValueChange={setLitigationMonth}>
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                              {monthOptions.map(month => <SelectItem key={month.value} value={month.value}>
                                  {month.label}
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getLitigationMonthlyData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <Tooltip contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px"
                        }} />
                          <Legend />
                          <Bar dataKey="Pending" fill="#eab308" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Decreed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Dismissed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Status Distribution Bar Chart */}
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        <span>Litigation Status Distribution</span>
                      </CardTitle>
                      <CardDescription>Visual breakdown of litigation case statuses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[{
                        name: 'Pending',
                        count: litigationCases.filter(litigationCase => {
                          const matchesSearch = litigationSearch === "" || litigationCase.case_no && litigationCase.case_no.toLowerCase().includes(litigationSearch.toLowerCase()) || litigationCase.borrower_name && litigationCase.borrower_name.toLowerCase().includes(litigationSearch.toLowerCase());
                          const matchesStatus = litigationStatusFilter === "all" || litigationCase.status?.toLowerCase() === litigationStatusFilter.toLowerCase();
                          const matchesBank = litigationBankFilter === "all" || (() => {
                            const selectedBankAccount = bankAccounts.find(account => account.username === litigationBankFilter);
                            return selectedBankAccount && litigationCase.bank_name && litigationCase.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
                          })();
                          return matchesSearch && matchesStatus && matchesBank && litigationCase.status === 'Pending';
                        }).length
                      }, {
                        name: 'Decreed',
                        count: litigationCases.filter(litigationCase => {
                          const matchesSearch = litigationSearch === "" || litigationCase.case_no && litigationCase.case_no.toLowerCase().includes(litigationSearch.toLowerCase()) || litigationCase.borrower_name && litigationCase.borrower_name.toLowerCase().includes(litigationSearch.toLowerCase());
                          const matchesStatus = litigationStatusFilter === "all" || litigationCase.status?.toLowerCase() === litigationStatusFilter.toLowerCase();
                          const matchesBank = litigationBankFilter === "all" || (() => {
                            const selectedBankAccount = bankAccounts.find(account => account.username === litigationBankFilter);
                            return selectedBankAccount && litigationCase.bank_name && litigationCase.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
                          })();
                          return matchesSearch && matchesStatus && matchesBank && litigationCase.status === 'Decreed';
                        }).length
                      }, {
                        name: 'Dismissed',
                        count: litigationCases.filter(litigationCase => {
                          const matchesSearch = litigationSearch === "" || litigationCase.case_no && litigationCase.case_no.toLowerCase().includes(litigationSearch.toLowerCase()) || litigationCase.borrower_name && litigationCase.borrower_name.toLowerCase().includes(litigationSearch.toLowerCase());
                          const matchesStatus = litigationStatusFilter === "all" || litigationCase.status?.toLowerCase() === litigationStatusFilter.toLowerCase();
                          const matchesBank = litigationBankFilter === "all" || (() => {
                            const selectedBankAccount = bankAccounts.find(account => account.username === litigationBankFilter);
                            return selectedBankAccount && litigationCase.bank_name && litigationCase.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
                          })();
                          return matchesSearch && matchesStatus && matchesBank && litigationCase.status === 'Dismissed';
                        }).length
                      }]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px"
                        }} />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Litigation Status Overview */}
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        <span>Litigation Status Overview</span>
                      </CardTitle>
                      <CardDescription>Current status of all litigation cases</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all">
                          <div className="flex items-center space-x-3">
                            <Clock className="h-5 w-5 text-yellow-500" />
                            <span className="font-medium text-foreground">Pending</span>
                          </div>
                          <Badge variant="secondary" className="bg-yellow-500 text-white">
                            {litigationCases.filter(litigationCase => {
                            const matchesSearch = litigationSearch === "" || litigationCase.case_no && litigationCase.case_no.toLowerCase().includes(litigationSearch.toLowerCase()) || litigationCase.borrower_name && litigationCase.borrower_name.toLowerCase().includes(litigationSearch.toLowerCase());
                            const matchesStatus = litigationStatusFilter === "all" || litigationCase.status?.toLowerCase() === litigationStatusFilter.toLowerCase();
                            const matchesBank = litigationBankFilter === "all" || (() => {
                              const selectedBankAccount = bankAccounts.find(account => account.username === litigationBankFilter);
                              return selectedBankAccount && litigationCase.bank_name && litigationCase.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
                            })();
                            return matchesSearch && matchesStatus && matchesBank && litigationCase.status === 'Pending';
                          }).length}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                            <span className="font-medium text-foreground">Decreed</span>
                          </div>
                          <Badge variant="secondary" className="bg-blue-500 text-white">
                            {litigationCases.filter(litigationCase => {
                            const matchesSearch = litigationSearch === "" || litigationCase.case_no && litigationCase.case_no.toLowerCase().includes(litigationSearch.toLowerCase()) || litigationCase.borrower_name && litigationCase.borrower_name.toLowerCase().includes(litigationSearch.toLowerCase());
                            const matchesStatus = litigationStatusFilter === "all" || litigationCase.status?.toLowerCase() === litigationStatusFilter.toLowerCase();
                            const matchesBank = litigationBankFilter === "all" || (() => {
                              const selectedBankAccount = bankAccounts.find(account => account.username === litigationBankFilter);
                              return selectedBankAccount && litigationCase.bank_name && litigationCase.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
                            })();
                            return matchesSearch && matchesStatus && matchesBank && litigationCase.status === 'Decreed';
                          }).length}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all">
                          <div className="flex items-center space-x-3">
                            <XCircle className="h-5 w-5 text-green-500" />
                            <span className="font-medium text-foreground">Dismissed</span>
                          </div>
                          <Badge variant="secondary" className="bg-green-500 text-white">
                            {litigationCases.filter(litigationCase => {
                            const matchesSearch = litigationSearch === "" || litigationCase.case_no && litigationCase.case_no.toLowerCase().includes(litigationSearch.toLowerCase()) || litigationCase.borrower_name && litigationCase.borrower_name.toLowerCase().includes(litigationSearch.toLowerCase());
                            const matchesStatus = litigationStatusFilter === "all" || litigationCase.status?.toLowerCase() === litigationStatusFilter.toLowerCase();
                            const matchesBank = litigationBankFilter === "all" || (() => {
                              const selectedBankAccount = bankAccounts.find(account => account.username === litigationBankFilter);
                              return selectedBankAccount && litigationCase.bank_name && litigationCase.bank_name.toLowerCase().includes(selectedBankAccount.bank_name.toLowerCase());
                            })();
                            return matchesSearch && matchesStatus && matchesBank && litigationCase.status === 'Dismissed';
                          }).length}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

            </div>
          </main>
        </div>

        {/* Document Viewer Modal */}
        {isDocumentViewerOpen && selectedApplication && <DocumentViewer application={selectedApplication} isOpen={isDocumentViewerOpen} onClose={() => {
        setIsDocumentViewerOpen(false);
        setSelectedApplication(null);
      }} />}
      </div>
    </SidebarProvider>;
};
export default AdminDashboard;