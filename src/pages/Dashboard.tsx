import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Service {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  city: string;
  provider_id: string;
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
  created_at: string;
  updated_at: string;
  service: Service;
  customer: {
    full_name: string;
  };
}

const categories = [
  "Haircuts",
  "Home Repairs",
  "Cleaning",
  "Gardening",
  "Personal Training",
  "Pet Care",
];

const cities = ["Mumbai", "Pune", "Bangalore"];

const Dashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingService, setIsAddingService] = useState(false);
  const [newService, setNewService] = useState({
    title: "",
    description: "",
    price: 0,
    category: "Haircuts",
    city: "Mumbai",
  });

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: services, isLoading: isServicesLoading } = useQuery({
    queryKey: ["services", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select(`
          *,
          provider:profiles(full_name)
        `)
        .eq("provider_id", user?.id);

      if (error) throw error;
      return data as Service[];
    },
  });

  const { data: bookings, isLoading: isBookingsLoading } = useQuery({
    queryKey: ["bookings", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          service:services(
            id,
            title,
            description,
            price,
            category,
            city,
            provider_id,
            provider:profiles(full_name)
          ),
          customer:profiles(full_name)
        `)
        .eq("service.provider_id", user?.id);

      if (error) throw error;
      return data as Booking[];
    },
  });

  const createService = useMutation({
    mutationFn: async (serviceData: Omit<Service, "id" | "provider_id"> & { provider_id: string }) => {
      const { data, error } = await supabase
        .from("services")
        .insert([serviceData]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setIsAddingService(false);
      setNewService({
        title: "",
        description: "",
        price: 0,
        category: "Haircuts",
        city: "Mumbai",
      });
      toast({
        title: "Success",
        description: "Service created successfully",
      });
    },
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast({
        title: "Success",
        description: "Booking status updated successfully",
      });
    },
  });

  const handleAddService = () => {
    if (!user?.id) return;

    createService.mutate({
      ...newService,
      provider_id: user.id,
    });
  };

  if (isUserLoading || isProfileLoading) {
    return <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        Loading...
      </div>
    </div>;
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {profile.full_name}</h1>
          <p className="text-gray-600">Manage your services and bookings</p>
        </div>

        {/* Services Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Your Services</h2>
            <Button onClick={() => setIsAddingService(!isAddingService)}>
              {isAddingService ? "Cancel" : "Add Service"}
            </Button>
          </div>

          {isAddingService && (
            <Card className="p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input
                    value={newService.title}
                    onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <Input
                    type="number"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Select
                    value={newService.category}
                    onValueChange={(value) => setNewService({ ...newService, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <Select
                    value={newService.city}
                    onValueChange={(value) => setNewService({ ...newService, city: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddService}>Create Service</Button>
              </div>
            </Card>
          )}

          {isServicesLoading ? (
            <div>Loading services...</div>
          ) : (
            <div className="grid gap-6">
              {services?.map((service) => (
                <Card key={service.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                      <p className="text-gray-600">{service.description}</p>
                      <p className="text-lg font-semibold mt-2">₹{service.price}</p>
                      <p className="text-sm text-gray-500 mt-1">Category: {service.category}</p>
                      <p className="text-sm text-gray-500">City: {service.city}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Bookings Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Bookings</h2>
          {isBookingsLoading ? (
            <div>Loading bookings...</div>
          ) : (
            <div className="grid gap-6">
              {bookings?.map((booking) => (
                booking.service && (
                  <Card key={booking.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{booking.service.title}</h3>
                        <p className="text-gray-600">Booked by: {booking.customer.full_name}</p>
                        <p className="text-gray-600">Date: {new Date(booking.booking_date).toLocaleDateString()}</p>
                        <p className="text-gray-600">Status: {booking.status}</p>
                      </div>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => updateBookingStatus.mutate({ bookingId: booking.id, status: "confirmed" })}
                          disabled={booking.status === "confirmed"}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => updateBookingStatus.mutate({ bookingId: booking.id, status: "rejected" })}
                          disabled={booking.status === "rejected"}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;