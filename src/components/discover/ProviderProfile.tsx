import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star } from "lucide-react";
import type { Feedback } from "@/types/feedback";

interface ProviderProfileProps {
  providerId: string | null;
  onClose: () => void;
}

export const ProviderProfile = ({ providerId, onClose }: ProviderProfileProps) => {
  const { data: provider } = useQuery({
    queryKey: ["provider", providerId],
    enabled: !!providerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", providerId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: feedbacks } = useQuery({
    queryKey: ["provider-feedbacks", providerId],
    enabled: !!providerId,
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
            ),
            customer:profiles(
              full_name
            )
          )
        `)
        .eq("booking.service.provider_id", providerId);

      if (error) throw error;
      return data as Feedback[];
    },
  });

  return (
    <Dialog open={!!providerId} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Provider Profile</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {provider && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold">{provider.full_name}</h3>
              <p className="text-gray-600">Location: {provider.city}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <h4 className="font-medium">Feedback & Reviews</h4>
            {feedbacks && feedbacks.length > 0 ? (
              feedbacks.map((feedback) => (
                <div key={feedback.id} className="border-b pb-4">
                  <div className="flex space-x-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < feedback.rating ? "text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm">{feedback.comment}</p>
                  <p className="text-gray-500 text-xs mt-2">
                    By: {feedback.booking?.customer?.full_name}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No feedback yet</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};