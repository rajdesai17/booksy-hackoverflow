import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import type { Feedback } from "@/types/feedback";

export const ProviderFeedbacks = () => {
  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ["provider-feedbacks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedbacks")
        .select(`
          *,
          booking:bookings(
            service:services(
              id,
              title
            ),
            customer:profiles(
              full_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Feedback[];
    },
  });

  if (isLoading) return <div>Loading feedbacks...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Feedback Received</h2>
      {feedbacks?.map((feedback) => (
        <Card key={feedback.id} className="p-6">
          <div>
            <div className="flex space-x-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < feedback.rating ? "text-yellow-400" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-gray-600 mb-2">{feedback.comment}</p>
            <p className="text-sm text-gray-500">
              By: {feedback.booking?.customer?.full_name}
            </p>
            <p className="text-sm text-gray-500">
              Service: {feedback.booking?.service?.title}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};