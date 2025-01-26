import type { Service } from "./service";

export interface Feedback {
  id: string;
  booking_id: string;
  rating: number;
  comment: string;
  created_at: string;
  service: Service;
  customer: {
    full_name: string;
  };
}