import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatePicker } from "@/components/ui/date-picker";
import { Search, FileText, Mail, Phone, Calendar, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
  message: string | null;
  document_url: string | null;
  created_at: string;
}

export default function PublicSubmissions() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [submissions, searchQuery, startDate, endDate]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error loading submissions",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...submissions];

    // Filter by name or phone
    if (searchQuery) {
      filtered = filtered.filter(sub =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.phone_number?.includes(searchQuery)
      );
    }

    // Filter by date range
    if (startDate && endDate) {
      filtered = filtered.filter(sub => {
        const submissionDate = new Date(sub.created_at);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Set time to start of day for start date
        start.setHours(0, 0, 0, 0);
        // Set time to end of day for end date
        end.setHours(23, 59, 59, 999);
        
        return submissionDate >= start && submissionDate <= end;
      });
    } else if (startDate) {
      filtered = filtered.filter(sub => {
        const submissionDate = new Date(sub.created_at);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        return submissionDate >= start;
      });
    } else if (endDate) {
      filtered = filtered.filter(sub => {
        const submissionDate = new Date(sub.created_at);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return submissionDate <= end;
      });
    }

    setFilteredSubmissions(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
  };

  const handleSetSameDate = (date: string) => {
    setStartDate(date);
    setEndDate(date);
  };

  const handleDownload = async (documentUrl: string, submissionId: string, fileName: string) => {
    try {
      setDownloadingId(submissionId);
      
      // Fetch the file
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `document-${submissionId}`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download complete",
        description: "Document downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Download failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary">Public Submissions</h1>
                <p className="text-muted-foreground mt-1">
                  View and manage contact form submissions
                </p>
              </div>
            </div>

            {/* Filters Card */}
            <Card className="shadow-lg border-primary/10">
              <CardContent className="p-6">
                {/* Submissions Count Badge */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-lg px-4 py-2">
                      <p className="text-sm text-muted-foreground">Total Submissions</p>
                      <p className="text-2xl font-bold text-primary">{filteredSubmissions.length}</p>
                    </div>
                    {(searchQuery || startDate || endDate) && (
                      <div className="text-sm text-muted-foreground">
                        Filtered from {submissions.length} total
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Unified Search */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Search by Name or Phone
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Enter name or phone number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Start Date */}
                  <div className="space-y-2">
                    <DatePicker
                      label="Start Date"
                      value={startDate}
                      onChange={(date) => setStartDate(date)}
                      showLabelOutside
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <DatePicker
                      label="End Date"
                      value={endDate}
                      onChange={(date) => setEndDate(date)}
                      showLabelOutside
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="flex-1"
                  >
                    Clear Filters
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (startDate || endDate) {
                        handleSetSameDate(startDate || endDate);
                        toast({
                          title: "Same date selected",
                          description: "Start and end date set to the same date",
                        });
                      }
                    }}
                    className="flex-1"
                  >
                    Set Same Date
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Card */}
            <Card className="shadow-lg border-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredSubmissions.length} of {submissions.length} submissions
                  </p>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading submissions...</p>
                  </div>
                ) : filteredSubmissions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No submissions found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Document</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubmissions.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(submission.created_at), "dd/MM/yyyy")}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {submission.name}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                {submission.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              {submission.phone_number ? (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  {submission.phone_number}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {submission.message || (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {submission.document_url ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const fileName = submission.document_url!.split('/').pop() || `document-${submission.id}`;
                                    handleDownload(submission.document_url!, submission.id, fileName);
                                  }}
                                  disabled={downloadingId === submission.id}
                                  className="transition-all hover:scale-105"
                                >
                                  {downloadingId === submission.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Downloading...
                                    </>
                                  ) : (
                                    <>
                                      <Download className="h-4 w-4 mr-2 transition-transform group-hover:translate-y-0.5" />
                                      Download
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
