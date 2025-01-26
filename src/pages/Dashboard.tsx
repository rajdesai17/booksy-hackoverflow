import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CustomerBookings } from "@/components/dashboard/CustomerBookings";
import { ProviderBookings } from "@/components/dashboard/ProviderBookings";
import { ProviderFeedbacks } from "@/components/dashboard/ProviderFeedbacks";
import { ServicesList } from "@/components/dashboard/ServicesList"; // Add this import

const Dashboard = () => {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {profile?.full_name}</h1>
          <p className="text-gray-600">
            Manage your {profile?.user_type === "provider" ? "services" : "bookings"}
          </p>
        </div>

        <div className="space-y-12">
          {profile?.user_type === "provider" ? (
            <>
              <ServicesList providerId={profile.id} /> {/* Add this line */}
              <ProviderBookings />
              <ProviderFeedbacks />
            </>
          ) : (
            <CustomerBookings />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;