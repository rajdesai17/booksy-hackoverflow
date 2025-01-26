import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Booking } from "@/types/booking";

export const CustomerBookings = () => {
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ["customer-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          service:services(
            id,
            title,
            provider:profiles(
              id,
              full_name
            )
          ),
          feedback:feedbacks(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Booking[];
    },
  });

  const handleComplete = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', bookingId);

    if (error) {
      toast({
        title: "Error",
        description: "Could not complete booking",
        variant: "destructive",
      });
      return;
    }

    refetch();
    toast({
      title: "Success",
      description: "Booking marked as completed",
    });
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedBooking) return;

    const { error } = await supabase
      .from('feedbacks')
      .insert([
        {
          booking_id: selectedBooking,
          rating,
          comment
        }
      ]);

    if (error) {
      toast({
        title: "Error",
        description: "Could not submit feedback",
        variant: "destructive",
      });
      return;
    }

    setSelectedBooking(null);
    setRating(0);
    setComment("");
    refetch();
    toast({
      title: "Success",
      description: "Feedback submitted successfully",
    });
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
              <p className="text-gray-600">Status: {booking.status}</p>
              <p className="text-gray-600">Date: {new Date(booking.booking_date).toLocaleDateString()}</p>
            </div>
            <div className="space-y-2">
              {booking.status === 'confirmed' && (
                <Button
                  onClick={() => handleComplete(booking.id)}
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
          <div className="space-y-4">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-1 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  <Star className="w-6 h-6" />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Write your feedback here..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button onClick={handleFeedbackSubmit}>Submit Feedback</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};