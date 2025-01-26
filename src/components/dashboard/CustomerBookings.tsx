import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

interface Booking {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  service: {
    title: string;
    price: number;
    provider: {
      full_name: string;
      provider_id: string;
    }
  }
}

interface FeedbackInput {
  booking_id: string;
  provider_id: string;
  rating: number;
  comment: string;
}

interface BookingStatus {
  bookingId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

export const CustomerBookings = () => {
  const { data: user } = useUser();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [formRating, setFormRating] = useState(0);
  const queryClient = useQueryClient();

  const { data: bookings } = useQuery({
    queryKey: ["customer-bookings", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          service:services (
            title,
            price,
            provider:profiles (
              full_name,
              provider_id
            )
          )
        `)
        .eq("customer_id", user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateBookingStatus = useMutation<void, Error, BookingStatus>({
    mutationFn: async ({ bookingId, status }) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
    }
  });

  const submitFeedback = useMutation<void, Error, FeedbackInput>({
    mutationFn: async ({ booking_id, provider_id, rating, comment }) => {
      const { error } = await supabase
        .from("feedbacks")
        .insert([{ booking_id, provider_id, rating, comment }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-bookings"] });
      setSelectedBooking(null);
      setFormRating(0);
    },
  });

  const handleFeedbackSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBooking) return;
    
    const formData = new FormData(e.currentTarget);
    submitFeedback.mutate({
      booking_id: selectedBooking.id,
      provider_id: selectedBooking.service.provider.provider_id,
      rating: formRating,
      comment: formData.get('comment') as string
    });
  };

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
                  onClick={() => setSelectedBooking(booking)}
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

      <Dialog 
        open={!!selectedBooking} 
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Feedback</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFeedbackSubmit}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rating</label>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      type="button"
                      variant={formRating === rating ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormRating(rating)}
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Comment</label>
                <textarea 
                  name="comment"
                  required
                  className="w-full mt-1 border rounded-md p-2"
                />
              </div>
              <Button 
                type="submit" 
                disabled={submitFeedback.isLoading || formRating === 0}
              >
                Submit Feedback
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};