export interface Booking {
  id: string;
  service_id: string;
  customer_id: string;
  provider_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  booking_date: string;
  created_at: string;
  updated_at?: string;
  service?: {
    id: string;
    title: string;
    price: number;
    provider?: {
      id: string;
      full_name: string;
    }
  };
  customer?: {
    id: string;
    full_name: string;
  };
  feedback?: Array<{
    id: string;
    rating: number;
    comment: string;
  }>;
}

export interface BookingStatus {
  bookingId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

export interface FeedbackInput {
  booking_id: string;
  provider_id: string;
  rating: number;
  comment: string;
}