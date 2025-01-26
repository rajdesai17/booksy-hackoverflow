import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Booking } from "@/types/booking";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StarIcon } from "lucide-react";

interface BookingsListProps {
  bookings: Booking[];
  isLoading: boolean;
  isProvider?: boolean;
  onUpdateStatus: (bookingId: string, status: 'accepted' | 'rejected') => void;
  onAddFeedback: (bookingId: string, feedback: { rating: number; comment: string }) => void;
}

export const BookingsList = ({ 
  bookings, 
  isLoading, 
  isProvider = false,
  onUpdateStatus,
  onAddFeedback
}: BookingsListProps) => {
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleFeedbackSubmit = () => {
    if (selectedBooking) {
      onAddFeedback(selectedBooking, { rating, comment });
      setSelectedBooking(null);
      setRating(0);
      setComment("");
    }
  };

  if (isLoading) return <div>Loading bookings...</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Bookings</h2>
      <div className="grid gap-6">
        {bookings?.map((booking) => (
          booking.service && (
            <Card key={booking.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{booking.service.title}</h3>
                  {isProvider ? (
                    <p className="text-gray-600">Booked by: {booking.customer?.full_name}</p>
                  ) : (
                    <p className="text-gray-600">Provider: {booking.service.provider?.full_name}</p>
                  )}
                  <p className="text-gray-600">Date: {new Date(booking.booking_date).toLocaleDateString()}</p>
                  <p className="text-gray-600">Status: {booking.status}</p>
                </div>
                <div className="space-x-2">
                  {isProvider ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => onUpdateStatus(booking.id, "confirmed")}
                        disabled={booking.status === "confirmed"}
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => onUpdateStatus(booking.id, "rejected")}
                        disabled={booking.status === "rejected"}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    booking.status === "confirmed" && !booking.feedback && (
                      <Button
                        variant="outline"
                        onClick={() => setSelectedBooking(booking.id)}
                      >
                        Add Feedback
                      </Button>
                    )
                  )}
                </div>
              </div>
            </Card>
          )
        ))}
      </div>

      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feedback</DialogTitle>
            <DialogDescription>
              Share your experience with this service
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-1 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  <StarIcon className="w-6 h-6" />
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