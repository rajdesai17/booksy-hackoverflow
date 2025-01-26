import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Booking } from "@/types/booking";

export const ProviderBookings = () => {
  const { toast } = useToast();
  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ["provider-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          service:services(
            id,
            title
          ),
          customer:profiles(
            id,
            full_name
          ),
          feedback:feedbacks(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Booking[];
    },
  });

  const handleUpdateStatus = async (bookingId: string, status: 'confirmed' | 'rejected') => {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);

    if (error) {
      toast({
        title: "Error",
        description: "Could not update booking status",
        variant: "destructive",
      });
      return;
    }

    refetch();
    toast({
      title: "Success",
      description: `Booking ${status}`,
    });
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
                  onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Accept
                </Button>
                <Button
                  onClick={() => handleUpdateStatus(booking.id, 'rejected')}
                  variant="outline"
                  className="bg-red-50 hover:bg-red-100"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};