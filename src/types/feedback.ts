import type { Booking } from "./booking";

export interface Feedback {
  id: string;
  booking_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  booking?: {
    service: {
      id: string;
      title: string;
      provider_id?: string;
    };
    customer: {
      full_name: string;
    };
  };
}