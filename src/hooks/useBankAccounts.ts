import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useBankAccounts = () => {
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('username, bank_name, is_active')
        .eq('is_active', true)
        .order('username', { ascending: true });

      if (error) {
        console.error('Error fetching bank accounts:', error);
        toast({
          title: "Error",
          description: "Failed to load bank accounts",
          variant: "destructive"
        });
        return;
      }

      setBankAccounts(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load bank accounts",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  return { bankAccounts };
};
