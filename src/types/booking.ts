import type { Service } from "./service";
import type { Feedback } from "./feedback";

export interface Booking {
  id: string;
  service_id: string;
  customer_id: string;
  status: string;
  booking_date: string;
  created_at: string;
  updated_at: string;
  service?: {
    id: string;
    title: string;
  };
  customer?: {
    id: string;
    full_name: string;
  };
  feedback?: Feedback | null;
}