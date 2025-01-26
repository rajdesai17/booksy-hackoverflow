export interface Service {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  city: string;
  provider?: {
    id: string;
    full_name: string;
    city: string;
  };
}