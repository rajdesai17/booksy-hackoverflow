import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Booking } from "@/types/booking";
import { useUser } from "@/hooks/useUser";

export const ProviderBookings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  // Update the query to filter by provider_id
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["provider-bookings", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          booking_date,
          service:services!inner(
            id,
            title,
            price
          ),
          customer:profiles!bookings_customer_id_fkey(
            id,
            full_name
          )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Bookings query error:', error);
        throw error;
      }
      return data;
    }
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: 'accepted' | 'rejected' | 'completed' }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-bookings'] });
      toast({
        title: "Success",
        description: "Booking status updated successfully"
      });
    },
    onError: (error: any) => {
      console.error('Booking update error:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive"
      });
    }
  });

  const handleStatusUpdate = async (bookingId: string, status: 'accepted' | 'rejected' | 'completed') => {
    try {
      await updateBookingStatus.mutateAsync({ bookingId, status });
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  if (isLoading) return <div>Loading bookings...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Service Bookings</h2>
      {bookings?.map((booking) => (
        <Card key={booking.id} className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold mb-2">{booking.service?.title}</h3>
              <p className="text-gray-600">Customer: {booking.customer?.full_name}</p>
              <p className="text-gray-600">Status: {booking.status}</p>
              <p className="text-gray-600">Date: {new Date(booking.booking_date).toLocaleDateString()}</p>
            </div>
            {booking.status === 'pending' && (
              <div className="space-x-2">
                <Button
                  onClick={() => handleStatusUpdate(booking.id, 'accepted')}
                  disabled={updateBookingStatus.isLoading}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Accept
                </Button>
                <Button
                  onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                  disabled={updateBookingStatus.isLoading}
                  variant="destructive"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}

            {booking.status === 'accepted' && (
              <div className="space-x-2">
                <Button
                  onClick={() => handleStatusUpdate(booking.id, 'completed')}
                  disabled={updateBookingStatus.isLoading}
                  variant="success"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </Button>
              </div>
            )}

            {booking.status === 'completed' && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                Completed
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};