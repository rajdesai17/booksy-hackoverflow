import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Clock, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Booking, FeedbackInput } from "@/types/booking";

export const CustomerBookings = () => {
  const { toast } = useToast();
  const { data: user } = useUser();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [formRating, setFormRating] = useState(0);
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["customer-bookings", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id,
            status,
            booking_date,
            created_at,
            provider_id,
            service:services!inner (
              id,
              title,
              price,
              provider:profiles!inner (
                id,
                full_name
              )
            ),
            feedback:feedbacks (
              id,
              rating,
              comment
            )
          `)
          .eq("customer_id", user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Bookings fetch error:', error);
          throw error;
        }

        console.log('Fetched bookings:', data); // Debug log
        return data;
      } catch (error) {
        console.error('Query error:', error);
        return [];
      }
    },
  });

  const submitFeedback = useMutation({
    mutationFn: async ({ booking_id, provider_id, rating, comment }: FeedbackInput) => {
      const { error } = await supabase
        .from("feedbacks")
        .insert([{ booking_id, provider_id, rating, comment }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-bookings"] });
      toast({
        title: "Success",
        description: "Thank you for your feedback!"
      });
      setSelectedBooking(null);
      setFormRating(0);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive"
      });
    }
  });

  const handleFeedbackSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBooking?.service?.provider?.id) return;

    const formData = new FormData(e.currentTarget);
    submitFeedback.mutate({
      booking_id: selectedBooking.id,
      provider_id: selectedBooking.service.provider.id,
      rating: formRating,
      comment: formData.get('comment') as string
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (isLoading) return <div>Loading bookings...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">My Bookings</h2>
      {bookings?.map((booking) => (
        <Card key={booking.id} className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold mb-2">{booking.service?.title}</h3>
              <p className="text-gray-600">Provider: {booking.service?.provider?.full_name}</p>
              <div className="flex items-center gap-2 mt-2">
                {getStatusIcon(booking.status)}
                <span className={`font-medium ${
                  booking.status === 'pending' ? 'text-yellow-600' :
                  booking.status === 'accepted' ? 'text-blue-600' :
                  booking.status === 'completed' ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
              <p className="text-gray-600">Date: {new Date(booking.booking_date).toLocaleDateString()}</p>
              <p className="text-primary font-semibold mt-2">₹{booking.service?.price}</p>
            </div>
            <div>
              {booking.status === 'completed' && !booking.feedback?.length && (
                <Button
                  onClick={() => setSelectedBooking(booking)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  Add Review
                </Button>
              )}
              {booking.feedback?.length > 0 && (
                <div className="text-sm text-gray-500">
                  <div className="flex gap-1">
                    {Array.from({ length: booking.feedback[0].rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mt-1">"{booking.feedback[0].comment}"</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}

      {!bookings?.length && (
        <div className="text-center py-8">
          <p className="text-gray-500">No bookings found.</p>
        </div>
      )}

      <Dialog 
        open={!!selectedBooking} 
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormRating(rating)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star className={`w-6 h-6 ${
                      rating <= formRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Comment</label>
              <textarea
                name="comment"
                required
                className="w-full p-2 border rounded-md"
                placeholder="Share your experience..."
                rows={3}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={submitFeedback.isLoading || formRating === 0}
            >
              {submitFeedback.isLoading ? 'Submitting...' : 'Submit Review'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};