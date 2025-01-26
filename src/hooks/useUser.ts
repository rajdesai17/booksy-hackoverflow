import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;

      if (user) {
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          // Create profile if it doesn't exist
          const { error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: user.id,
              full_name: user.user_metadata?.full_name,
              user_type: user.user_metadata?.user_type
            }]);

          if (createError) {
            console.error('Error creating profile:', createError);
          }
        }
      }

      return user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });
};