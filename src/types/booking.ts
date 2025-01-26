export interface Booking {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  service_id: string;
  service: {
    id: string;
    title: string;
    price: number;
    provider_id: string;
    provider: {
      id: string;
      full_name: string;  
    }
  };
  feedback?: Array<{
    id: string;
    rating: number;
    comment: string;
  }>;
}