import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export const useNetworkStatus = () => {
  const offlineIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<'online' | 'offline' | 'no-internet'>('online');
  const toastIdRef = useRef<string | null>(null);

  useEffect(() => {
    const checkInternetConnectivity = async (): Promise<boolean> => {
      try {
        // Try to fetch a small resource to verify actual internet connectivity
        const response = await fetch('https://www.google.com/favicon.ico', {
          mode: 'no-cors',
          cache: 'no-cache',
        });
        return true;
      } catch {
        return false;
      }
    };

    const handleNetworkChange = async () => {
      if (!navigator.onLine) {
        // WiFi/Network is disconnected
        if (lastStatusRef.current !== 'offline') {
          // Dismiss any existing toast
          if (toastIdRef.current) {
            toast.dismiss(toastIdRef.current);
          }
          
          // Show persistent error toast
          toastIdRef.current = toast.error('No network available. Please check your connection.', {
            duration: Infinity, // Persistent toast
            icon: '📡',
          });
          
          lastStatusRef.current = 'offline';
          
          // Clear any existing interval
          if (offlineIntervalRef.current) {
            clearInterval(offlineIntervalRef.current);
            offlineIntervalRef.current = null;
          }
        }
      } else {
        // WiFi/Network is connected, check actual internet
        const hasInternet = await checkInternetConnectivity();
        
        if (hasInternet) {
          // Connected with internet
          if (lastStatusRef.current !== 'online') {
            // Dismiss the persistent offline toast
            if (toastIdRef.current) {
              toast.dismiss(toastIdRef.current);
              toastIdRef.current = null;
            }
            
            // Show success message
            toast.success('Network connection restored', {
              duration: 3000,
            });
            
            lastStatusRef.current = 'online';
            
            if (offlineIntervalRef.current) {
              clearInterval(offlineIntervalRef.current);
              offlineIntervalRef.current = null;
            }
          }
        } else {
          // Connected but no internet
          if (lastStatusRef.current !== 'no-internet') {
            // Dismiss any existing toast
            if (toastIdRef.current) {
              toast.dismiss(toastIdRef.current);
            }
            
            // Show persistent error toast
            toastIdRef.current = toast.error('Connected but no internet access', {
              duration: Infinity, // Persistent toast
              icon: '⚠️',
            });
            
            lastStatusRef.current = 'no-internet';
            
            // Clear any existing interval
            if (offlineIntervalRef.current) {
              clearInterval(offlineIntervalRef.current);
            }
            
            // Check periodically if internet is back
            offlineIntervalRef.current = setInterval(async () => {
              if (navigator.onLine) {
                const stillNoInternet = !(await checkInternetConnectivity());
                if (!stillNoInternet) {
                  // Internet is back
                  if (toastIdRef.current) {
                    toast.dismiss(toastIdRef.current);
                    toastIdRef.current = null;
                  }
                  
                  toast.success('Network connection restored', {
                    duration: 3000,
                  });
                  
                  lastStatusRef.current = 'online';
                  if (offlineIntervalRef.current) {
                    clearInterval(offlineIntervalRef.current);
                    offlineIntervalRef.current = null;
                  }
                }
              }
            }, 5000);
          }
        }
      }
    };

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    // Check initial state
    handleNetworkChange();

    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
      if (offlineIntervalRef.current) {
        clearInterval(offlineIntervalRef.current);
      }
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, []);
};
