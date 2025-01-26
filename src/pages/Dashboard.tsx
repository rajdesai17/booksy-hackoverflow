import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ServicesList } from "@/components/dashboard/ServicesList";
import { BookingsList } from "@/components/dashboard/BookingsList";
import { FeedbackList } from "@/components/dashboard/FeedbackList";
import type { Service } from "@/types/service";
import type { Booking } from "@/types/booking";
import type { Feedback } from "@/types/feedback";

const Dashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: services, isLoading: isServicesLoading } = useQuery({
    queryKey: ["services", user?.id],
    enabled: !!user?.id && profile?.user_type === "provider",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select(`
          *,
          provider:profiles(full_name)
        `)
        .eq("provider_id", user?.id);

      if (error) throw error;
      return data as Service[];
    },
  });

  const { data: bookings, isLoading: isBookingsLoading } = useQuery({
    queryKey: ["bookings", user?.id, profile?.user_type],
    enabled: !!user?.id,
    queryFn: async () => {
      const query = supabase
        .from("bookings")
        .select(`
          *,
          service:services(
            id,
            title,
            description,
            price,
            category,
            city,
            provider_id,
            provider:profiles(full_name)
          ),
          customer:profiles(full_name),
          feedback:feedbacks(
            id,
            rating,
            comment,
            created_at
          )
        `);

      if (profile?.user_type === "provider") {
        query.eq("service.provider_id", user?.id);
      } else {
        query.eq("customer_id", user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Booking[];
    },
  });

  const { data: feedbacks, isLoading: isFeedbacksLoading } = useQuery({
    queryKey: ["feedbacks", user?.id],
    enabled: !!user?.id && profile?.user_type === "provider",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedbacks")
        .select(`
          *,
          booking:bookings(
            service:services(
              id,
              title,
              provider_id
            )
          ),
          customer:profiles(full_name)
        `)
        .eq("booking.service.provider_id", user?.id);

      if (error) throw error;
      return data as Feedback[];
    },
  });

  const createService = useMutation({
    mutationFn: async (serviceData: Omit<Service, "id" | "provider_id" | "provider">) => {
      const { data, error } = await supabase
        .from("services")
        .insert([{ ...serviceData, provider_id: user?.id }]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({
        title: "Success",
        description: "Service created successfully",
      });
    },
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast({
        title: "Success",
        description: "Booking status updated successfully",
      });
    },
  });

  const addFeedback = useMutation({
    mutationFn: async ({ 
      bookingId, 
      feedback 
    }: { 
      bookingId: string; 
      feedback: { rating: number; comment: string; }
    }) => {
      const { data, error } = await supabase
        .from("feedbacks")
        .insert([{
          booking_id: bookingId,
          rating: feedback.rating,
          comment: feedback.comment
        }]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
      toast({
        title: "Success",
        description: "Feedback submitted successfully",
      });
    },
  });

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          Loading...
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {profile.full_name}</h1>
          <p className="text-gray-600">Manage your {profile.user_type === "provider" ? "services" : "bookings"}</p>
        </div>

        {profile.user_type === "provider" && (
          <>
            <ServicesList
              services={services || []}
              isLoading={isServicesLoading}
              onAddService={(service) => createService.mutate(service)}
            />
            <BookingsList
              bookings={bookings || []}
              isLoading={isBookingsLoading}
              isProvider
              onUpdateStatus={(bookingId, status) => 
                updateBookingStatus.mutate({ bookingId, status })
              }
              onAddFeedback={() => {}}
            />
            <FeedbackList
              feedbacks={feedbacks || []}
              isLoading={isFeedbacksLoading}
            />
          </>
        )}

        {profile.user_type === "customer" && (
          <BookingsList
            bookings={bookings || []}
            isLoading={isBookingsLoading}
            onUpdateStatus={() => {}}
            onAddFeedback={(bookingId, feedback) => 
              addFeedback.mutate({ bookingId, feedback })
            }
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;