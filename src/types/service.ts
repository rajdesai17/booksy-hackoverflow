export interface Service {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  city: string;
  provider_id: string;
  provider?: {
    id: string;
    full_name: string;
    city: string;
  };
}