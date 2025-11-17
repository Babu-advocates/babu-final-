import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useApplications = (isAdminRoute: boolean) => {
  const [loanApplications, setLoanApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchApplications = async () => {
    try {
      setLoading(true);

      const isEmployeeLogin = localStorage.getItem("employeeLogin") === "true";
      const employeeUsername = localStorage.getItem("employeeUsername");
      let query = supabase.from('applications').select('*');

      if (isEmployeeLogin && employeeUsername && !isAdminRoute) {
        query = query.or(`assigned_to_username.eq.${employeeUsername},original_assigned_to_username.eq.${employeeUsername}`);
      } else {
        query = query.in('status', ['to_be_assigned', 'in_review', 'under_review', 'redirected', 'waiting_for_approval']);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        toast({
          title: "Error",
          description: "Failed to fetch applications",
          variant: "destructive"
        });
        return;
      }

      const transformedData = data?.map(app => {
        let displayStatus = app.status;
        if (app.status === 'redirected' && isEmployeeLogin && employeeUsername) {
          if (app.original_assigned_to_username === employeeUsername) {
            displayStatus = `redirected to ${app.assigned_to_username}`;
          } else if (app.assigned_to_username === employeeUsername) {
            displayStatus = 'in_review';
          }
        }

        return {
          id: app.id,
          applicationNumber: app.application_id,
          name: app.borrower_name,
          bankName: app.bank_name,
          amount: `₹${Number(app.loan_amount).toLocaleString('en-IN')}`,
          status: displayStatus,
          date: new Date(app.submission_date).toISOString().split('T')[0],
          loanType: app.loan_type,
          applicationType: app.application_type,
          ...app
        };
      }) || [];

      setLoanApplications(transformedData);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();

    const channel = supabase
      .channel('applications-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'applications'
      }, payload => {
        setLoanApplications(prev => prev.map(app => {
          if (app.id !== payload.new.id) return app;
          const updated = payload.new as any;
          return {
            ...app,
            ...updated,
            id: updated.id,
            applicationNumber: updated.application_id,
            name: updated.borrower_name,
            bankName: updated.bank_name,
            amount: `₹${Number(updated.loan_amount).toLocaleString('en-IN')}`,
            status: updated.status,
            date: new Date(updated.submission_date).toISOString().split('T')[0],
            loanType: updated.loan_type,
            applicationType: updated.application_type
          };
        }));

        if ((payload.old as any)?.status !== (payload.new as any)?.status) {
          toast({
            title: 'Status updated',
            description: `Application ${(payload.new as any).application_id} is now ${(payload.new as any).status}.`
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    loanApplications,
    setLoanApplications,
    loading,
    fetchApplications
  };
};
