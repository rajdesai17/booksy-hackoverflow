import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Add this import
import { Star, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Add helper function for badge variants
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'accepted':
      return 'default';
    case 'pending':
      return 'warning';
    case 'rejected':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export const CustomerBookings = () => {
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: bookings } = useQuery({
    queryKey: ["customer-bookings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          service:services (
            title,
            price,
            provider:profiles (
              full_name
            )
          )
        `)
        .eq("customer_id", user?.id);
      if (error) throw error;
      return data;
    },
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["customer-bookings"]);
    },
  });

  const submitFeedback = useMutation({
    mutationFn: async ({ bookingId, rating, comment }: { bookingId: string; rating: number; comment: string }) => {
      const { data: booking } = await supabase
        .from("bookings")
        .select("service_id, provider:services(provider_id)")
        .eq("id", bookingId)
        .single();

      const { error } = await supabase
        .from("feedbacks")
        .insert([{
          booking_id: bookingId,
          provider_id: booking?.provider?.provider_id,
          rating,
          comment
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["customer-bookings"]);
      setSelectedBooking(null);
    },
  });

  return (
    <div className="space-y-4">
      {bookings?.map((booking) => (
        <Card key={booking.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{booking.service?.title}</h3>
              <p className="text-sm text-gray-600">Provider: {booking.service?.provider?.full_name}</p>
              <p className="text-sm text-gray-600">Price: ₹{booking.service?.price}</p>
              <Badge variant={getStatusBadgeVariant(booking.status)}>
                {booking.status}
              </Badge>
            </div>
            <div className="space-y-2">
              {booking.status === 'accepted' && (
                <Button
                  onClick={() => updateBookingStatus.mutate({ bookingId: booking.id, status: 'completed' })}
                  variant="outline"
                  className="w-full"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Completed
                </Button>
              )}
              {booking.status === 'completed' && !booking.feedback && (
                <Button
                  onClick={() => setSelectedBooking(booking.id)}
                  variant="outline"
                  className="w-full"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Add Feedback
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}

      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feedback</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            submitFeedback.mutate({
              bookingId: selectedBooking as string,
              rating: Number(formData.get('rating')),
              comment: formData.get('comment') as string
            });
          }}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rating</label>
                <select name="rating" className="w-full mt-1 border rounded-md p-2" required>
                  {[1,2,3,4,5].map(num => (
                    <option key={num} value={num}>{num} Stars</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Comment</label>
                <textarea 
                  name="comment"
                  required
                  className="w-full mt-1 border rounded-md p-2"
                />
              </div>
              <Button type="submit" disabled={submitFeedback.isLoading}>
                Submit Feedback
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};