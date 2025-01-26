import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Search, Star, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Service } from "@/types/service";
import type { Feedback } from "@/types/feedback";

const categories = [
  { id: 1, name: "Haircuts", icon: "💇‍♂️" },
  { id: 2, name: "Home Repairs", icon: "🔧" },
  { id: 3, name: "Cleaning", icon: "🧹" },
  { id: 4, name: "Gardening", icon: "🌱" },
  { id: 5, name: "Personal Training", icon: "💪" },
  { id: 6, name: "Pet Care", icon: "🐾" },
];

const cities = ["Mumbai", "Pune", "Bangalore"];

const Discover = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Add isLoading to services query
  // Update the services query to include category filtering
const { data: services, isLoading: servicesLoading } = useQuery({
  queryKey: ["services", selectedCategory],
  queryFn: async () => {
    const query = supabase
      .from("services")
      .select("*, provider:profiles(*)")
      .eq('is_active', true);
    
    if (selectedCategory) {
      query.eq('category', selectedCategory);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
});
  
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: providerFeedbacks, isLoading: isFeedbacksLoading } = useQuery({
    queryKey: ['provider-feedbacks', selectedProvider],
    enabled: !!selectedProvider,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedbacks')
        .select(`
          *,
          booking:bookings(
            service:services(
              id,
              title,
              provider_id
            ),
            customer:profiles(
              full_name
            )
          )
        `)
        .eq('booking.service.provider_id', selectedProvider);

      if (error) throw error;
      return data as Feedback[];
    },
  });

  const createBooking = useMutation({
    mutationFn: async ({ serviceId }: { serviceId: string }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          service_id: serviceId,
          customer_id: user.id,
          booking_date: new Date().toISOString(),
          status: 'pending'
        }]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Booking request sent successfully",
      });
    },
  });

  const handleBookService = async (serviceId: string, providerId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please login to book a service",
        variant: "destructive",
      });
      return;
    }
  
    // Check if user is the service provider
    if (user.id === providerId) {
      toast({
        title: "Error",
        description: "You cannot book your own service",
        variant: "destructive",
      });
      return;
    }
  
    // Check for existing bookings
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('service_id', serviceId)
      .eq('customer_id', user.id)
      .in('status', ['pending', 'accepted']);
  
    if (existingBookings && existingBookings.length > 0) {
      toast({
        title: "Error",
        description: "You already have an active booking for this service",
        variant: "destructive",
      });
      return;
    }
  
    // If all checks pass, create booking
    createBooking.mutate({ serviceId });
  };
  
  // Update the Book Now button
  <Button 
    onClick={() => handleBookService(service.id, service.provider_id)}
    variant="default"
    disabled={createBooking.isLoading}
  >
    {createBooking.isLoading ? "Sending..." : "Book Now"}
  </Button>

  // Update the handleCategoryClick function
const handleCategoryClick = (categoryName: string) => {
  setSelectedCategory(categoryName);
  // Reset other filters when changing category
  setSelectedCity(null);
  setPriceRange([0, 1000]);
};

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">City</label>
                  <Select onValueChange={(value) => setSelectedCity(value)}>
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

                <div>
                  <label className="text-sm font-medium text-gray-700">Price Range</label>
                  <div className="mt-4">
                    <Slider
                      defaultValue={[0, 1000]}
                      max={1000}
                      step={10}
                      className="w-full"
                      onValueChange={(value) => setPriceRange(value)}
                    />
                    <div className="mt-2 text-sm text-gray-600">
                      ₹{priceRange[0]} - ₹{priceRange[1]}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Categories Grid */}
            {!selectedCategory && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleCategoryClick(category.name)}
                  >
                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="text-center">
                        <span className="text-4xl mb-4 block">{category.icon}</span>
                        <h3 className="text-lg font-semibold">{category.name}</h3>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Services List */}
            {selectedCategory && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold">{selectedCategory}</h2>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-primary hover:underline"
                  >
                    Back to Categories
                  </button>
                </div>

                {servicesLoading ? (
                  <div className="text-center py-8">Loading services...</div>
                ) : services && services.length > 0 ? (
                  <div className="grid gap-6">
                    {services.map((service) => (
                      <Card key={service.id} className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                            <p className="text-gray-600 mb-2">{service.description}</p>
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="w-4 h-4 mr-1" />
                              {service.city}
                            </div>
                            <p className="text-lg font-semibold mt-2">₹{service.price}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Provided by</p>
                            <button
                              onClick={() => setSelectedProvider(service.provider?.id || null)}
                              className="font-medium mb-4 hover:underline"
                            >
                              {service.provider?.full_name}
                            </button>
                            <div>
                              <Button 
                                onClick={() => handleBookService(service.id)}
                                variant="default"
                              >
                                Book Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No services found for the selected filters.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Provider Profile Dialog */}
      <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Provider Profile</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {services?.find(s => s.provider?.id === selectedProvider)?.provider && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold">
                  {services.find(s => s.provider?.id === selectedProvider)?.provider?.full_name}
                </h3>
                <p className="text-gray-600">
                  Location: {services.find(s => s.provider?.id === selectedProvider)?.provider?.city}
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <h4 className="font-medium">Feedback & Reviews</h4>
              {isFeedbacksLoading ? (
                <p>Loading feedback...</p>
              ) : providerFeedbacks && providerFeedbacks.length > 0 ? (
                providerFeedbacks.map((feedback) => (
                  <div key={feedback.id} className="border-b pb-4">
                    <div className="flex space-x-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < feedback.rating ? "text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm">{feedback.comment}</p>
                    <p className="text-gray-500 text-xs mt-2">
                      By: {feedback.booking?.customer?.full_name}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No feedback yet</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Discover;
