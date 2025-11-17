import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useEmployees = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const { data, error } = await supabase
        .from('employee_accounts')
        .select('id, username')
        .eq('is_active', true)
        .order('username');

      if (error) {
        console.error('Error fetching employees:', error);
        toast({
          title: "Error",
          description: "Failed to fetch employees",
          variant: "destructive"
        });
        return;
      }

      setEmployees(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive"
      });
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return {
    employees,
    loadingEmployees,
    fetchEmployees
  };
};
