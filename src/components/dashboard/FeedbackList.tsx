import { Card } from "@/components/ui/card";
import { StarIcon } from "lucide-react";
import type { Feedback } from "@/types/feedback";

interface FeedbackListProps {
  feedbacks: Feedback[];
  isLoading: boolean;
}

export const FeedbackList = ({ feedbacks, isLoading }: FeedbackListProps) => {
  if (isLoading) return <div>Loading feedbacks...</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Feedback Received</h2>
      <div className="grid gap-6">
        {feedbacks?.map((feedback) => (
          <Card key={feedback.id} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex space-x-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-5 h-5 ${
                        i < feedback.rating ? "text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-600">{feedback.comment}</p>
                <p className="text-sm text-gray-500 mt-2">
                  By: {feedback.customer.full_name}
                </p>
                <p className="text-sm text-gray-500">
                  Service: {feedback.service.title}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};