export interface Booking {
  id: string;
  service_id: string;
  customer_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  service?: {
    title: string;
    price: number;
  };
  customer?: {
    full_name: string;
  };
}