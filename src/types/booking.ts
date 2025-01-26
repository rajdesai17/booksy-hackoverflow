import type { Service } from "./service";

export interface Booking {
  id: string;
  service_id: string;
  customer_id: string;
  status: string;
  booking_date: string;
  created_at: string;
  updated_at: string;
  service: Service;
  customer: {
    full_name: string;
  };
  feedback?: Feedback;
}