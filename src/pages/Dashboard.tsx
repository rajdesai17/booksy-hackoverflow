import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Check, X, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Service {
  id: string;
  title: string;
  description: string | null;
  price: number;
  provider_id: string;
  category: string;
  city: string;
  provider?: {
    full_name: string;
  };
}

interface Booking {
  id: string;
  service_id: string;
  customer_id: string;
  status: string;
  booking_date: string;
  service: Service;
  customer: {
    full_name: string;
  };
}

const CITIES = ["Mumbai", "Pune", "Bangalore"];
const CATEGORIES = ["Haircuts", "Home Repairs", "Cleaning", "Gardening", "Personal Training", "Pet Care"];

const Dashboard = () => {
  const [userType, setUserType] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user type
  useEffect(() => {
    const fetchUserType = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", user.id)
          .single();
        setUserType(data?.user_type);
      }
    };
    fetchUserType();
  }, []);

  // Query for services
  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select(`
          *,
          provider:profiles(full_name)
        `);
      if (error) throw error;
      return data as Service[];
    },
  });

  // Query for bookings
  const { data: bookings } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      let query = supabase
        .from("bookings")
        .select(`
          *,
          service:services(
            id,
            title,
            description,
            price,
            provider_id,
            provider:profiles(full_name)
          ),
          customer:profiles(full_name)
        `);

      if (userType === "customer") {
        query = query.eq("customer_id", user.id);
      } else if (userType === "provider") {
        query = query.eq("service.provider_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!userType,
  });

  // Mutation for creating a service
  const createService = useMutation({
    mutationFn: async (serviceData: {
      title: string;
      description: string;
      price: number;
      category: string;
      city: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("services")
        .insert([{
          title: serviceData.title,
          description: serviceData.description,
          price: serviceData.price,
          category: serviceData.category,
          city: serviceData.city,
          provider_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({
        title: "Service created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error creating service",
        description: error.message,
      });
    },
  });

  const handleAddService = () => {
    const title = prompt("Enter service title:");
    if (!title) return;
    
    const description = prompt("Enter service description:");
    if (!description) return;
    
    const priceStr = prompt("Enter service price:");
    if (!priceStr) return;
    
    const category = prompt(`Enter service category (${CATEGORIES.join(", ")}):`);
    if (!category || !CATEGORIES.includes(category)) {
      toast({
        variant: "destructive",
        title: "Invalid category",
        description: "Please select a valid category",
      });
      return;
    }

    const city = prompt(`Enter your city (${CITIES.join(", ")}):`);
    if (!city || !CITIES.includes(city)) {
      toast({
        variant: "destructive",
        title: "Invalid city",
        description: "Please select a valid city",
      });
      return;
    }
    
    const price = parseFloat(priceStr);
    if (isNaN(price)) {
      toast({
        variant: "destructive",
        title: "Invalid price",
        description: "Please enter a valid number for the price",
      });
      return;
    }

    createService.mutate({ title, description, price, category, city });
  };

  // Mutation for creating a booking
  const createBooking = useMutation({
    mutationFn: async (serviceId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("bookings")
        .insert([{
          service_id: serviceId,
          customer_id: user.id,
          booking_date: new Date().toISOString(),
          status: "pending"
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast({
        title: "Booking created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error creating booking",
        description: error.message,
      });
    },
  });

  // Mutation for updating booking status
  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast({
        title: "Booking status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error updating booking status",
        description: error.message,
      });
    },
  });

  const handleBookService = (serviceId: string) => {
    createBooking.mutate(serviceId);
  };

  const handleUpdateBookingStatus = (bookingId: string, status: string) => {
    updateBookingStatus.mutate({ bookingId, status });
  };

  if (!userType) return <div>Loading...</div>;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            {userType === "provider" ? "My Services" : "Available Services"}
          </h1>
          {userType === "provider" && (
            <Button onClick={handleAddService} className="bg-primary hover:bg-primary-dark">
              <Plus className="w-4 h-4 mr-2" />
              Add New Service
            </Button>
          )}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {services?.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                <div className="space-y-2 text-gray-600">
                  <p>{service.description}</p>
                  <p>Price: ${service.price}</p>
                  <p>Category: {service.category}</p>
                  <p>City: {service.city}</p>
                  <p>Provider: {service.provider?.full_name}</p>
                </div>
                {userType === "customer" && (
                  <Button
                    onClick={() => handleBookService(service.id)}
                    className="w-full mt-4"
                  >
                    Book Service
                  </Button>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bookings Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">
            {userType === "provider" ? "Service Bookings" : "My Bookings"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings?.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-2">
                    {booking.service.title}
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    <p>Status: {booking.status}</p>
                    {userType === "provider" ? (
                      <p>Customer: {booking.customer.full_name}</p>
                    ) : (
                      <p>Provider: {booking.service.provider?.full_name}</p>
                    )}
                    <p>Date: {new Date(booking.booking_date).toLocaleDateString()}</p>
                  </div>
                  {userType === "provider" && booking.status === "pending" && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleUpdateBookingStatus(booking.id, "accepted")}
                        className="flex-1"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleUpdateBookingStatus(booking.id, "rejected")}
                        variant="outline"
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                  {booking.status === "pending" && (
                    <div className="flex items-center justify-center mt-4 text-yellow-500">
                      <Clock className="w-4 h-4 mr-2" />
                      Awaiting Response
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
