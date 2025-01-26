import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CustomerBookings } from "@/components/dashboard/CustomerBookings";
import { ProviderBookings } from "@/components/dashboard/ProviderBookings";
import { ProviderFeedbacks } from "@/components/dashboard/ProviderFeedbacks";
import { ServicesList } from "@/components/dashboard/ServicesList";
import { Card } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  Users, 
  Star, 
  Upload,
  Briefcase,
  Edit,
  Trash2,
  IndianRupee,
  History
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const categories = [
  "Haircuts",
  "Home Repairs", 
  "Cleaning",
  "Gardening",
  "Personal Training",
  "Pet Care"
];

const cities = ["Mumbai", "Pune", "Bangalore"];

const Dashboard = () => {
  const [editingService, setEditingService] = useState(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["services", profile?.id],
    enabled: !!profile?.id && profile?.user_type === "provider",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("provider_id", profile.id)
        .eq("is_active", true);
        
      if (error) throw error;
      return data;
    },
  });

  // Add past services query
  const { data: pastServices } = useQuery({
    queryKey: ["past-services", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("provider_id", profile.id)
        .eq("is_active", false);
      if (error) throw error;
      return data;
    },
  });

  // Update stats query
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", profile?.id],
    enabled: !!profile?.id && profile?.user_type === "provider",
    queryFn: async () => {
      // Get only accepted bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          service:services (
            price
          )
        `)
        .eq('provider_id', profile.id)
        .eq('status', 'accepted');

      // Get all feedbacks
      const { data: feedbacks, error: feedbacksError } = await supabase
        .from('feedbacks')
        .select('rating')
        .eq('provider_id', profile.id);

      // Get active services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', profile.id);

      if (bookingsError || feedbacksError || servicesError) {
        throw new Error('Failed to fetch stats');
      }

      // Calculate income from accepted bookings
      const totalIncome = bookings?.reduce((sum, booking) => 
        sum + (booking.service?.price || 0), 0) || 0;

      // Calculate average rating
      const avgRating = feedbacks?.length 
        ? feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / feedbacks.length 
        : 0;

      return {
        totalBookings: bookings?.length || 0,
        avgRating: avgRating.toFixed(1),
        activeServices: services?.length || 0,
        totalIncome: totalIncome.toFixed(2)
      };
    }
  });

  const { data: userStats } = useQuery({
    queryKey: ["user-stats", profile?.id],
    enabled: !!profile?.id && profile?.user_type === "customer",
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_id', profile.id);
      
      if (error) throw error;
      return {
        totalOrders: data?.length || 0
      };
    }
  });

  // Update booking status mutation to invalidate stats
  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status }) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      queryClient.invalidateQueries(['dashboard-stats']);
    }
  });

  // Update service mutations
  const deleteService = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', serviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['services']);
      queryClient.invalidateQueries(['past-services']);
      queryClient.invalidateQueries(['dashboard-stats']);
    },
    onError: (error) => {
      console.error('Error deleting service:', error);
      alert('Failed to delete service. Please try again.');
    }
  });

  const editService = useMutation({
    mutationFn: async (service) => {
      const { error } = await supabase
        .from('services')
        .update(service)
        .eq('id', service.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['services']);
      setEditingService(null);
    }
  });

  const addService = useMutation({
    mutationFn: async (newService) => {
      const { error } = await supabase
        .from('services')
        .insert([{ ...newService, provider_id: profile.id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['services']);
      queryClient.invalidateQueries(['dashboard-stats']);
      setIsAddingService(false);
    }
  });

  if (profileLoading || servicesLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-gray-200 rounded"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div>Error loading profile</div>;
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <LayoutDashboard className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Welcome, {profile?.full_name}</h1>
              <p className="text-gray-600">
                Manage your {profile?.user_type === "provider" ? "services and bookings" : "appointments"}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          {profile?.user_type === "provider" ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <Card className="p-4 flex items-center gap-4">
                <Users className="w-10 h-10 text-primary/80" />
                <div>
                  <p className="text-sm text-gray-600">Accepted Bookings</p>
                  <p className="text-2xl font-semibold">{stats?.totalBookings || 0}</p>
                </div>
              </Card>
              
              <Card className="p-4 flex items-center gap-4">
                <Star className="w-10 h-10 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="text-2xl font-semibold">{stats?.avgRating || '0.0'}</p>
                </div>
              </Card>
              
              <Card className="p-4 flex items-center gap-4">
                <Briefcase className="w-10 h-10 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Active Services</p>
                  <p className="text-2xl font-semibold">{stats?.activeServices || 0}</p>
                </div>
              </Card>
            
              <Card className="p-4 flex items-center gap-4">
                <IndianRupee className="w-10 h-10 text-emerald-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Income</p>
                  <p className="text-2xl font-semibold">₹{stats?.totalIncome || '0.00'}</p>
                </div>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-6">
              <Card className="p-4 flex items-center gap-4">
                <Users className="w-10 h-10 text-primary/80" />
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-semibold">{userStats?.totalOrders || 0}</p>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {profile?.user_type === "provider" ? (
            <>
              {/* Services Section */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-semibold">My Services</h2>
                  </div>
                  <button
                    onClick={() => setIsAddingService(true)}
                    className="bg-primary text-white px-4 py-2 rounded-md"
                  >
                    Add New Service
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services?.map((service) => (
                    <Card key={service.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">{service.title}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingService(service)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if(confirm('Are you sure you want to delete this service?')) {
                                deleteService.mutate(service.id.toString());
                              }
                            }}
                            className="text-red-500 hover:text-red-700"
                            disabled={deleteService.isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                      <div className="flex items-center mt-2">
                        <IndianRupee className="w-4 h-4 text-gray-600 mr-1" />
                        <p className="text-sm font-medium">{service.price}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Bookings Section */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Users className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-semibold">Bookings</h2>
                </div>
                <ProviderBookings />
              </div>

              {/* Feedback Section */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-semibold">Feedback</h2>
                </div>
                <ProviderFeedbacks />
              </div>

              {/* Past Services Section */}
              <div className="bg-white rounded-lg p-6 shadow-sm mt-8">
                <div className="flex items-center gap-2 mb-6">
                  <History className="w-6 h-6 text-gray-500" />
                  <h2 className="text-2xl font-semibold">Past Services</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pastServices?.map((service) => (
                    <Card key={service.id} className="p-4">
                      <h3 className="font-semibold">{service.title}</h3>
                      <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                      <p className="text-sm font-medium mt-2">₹{service.price}</p>
                      <Badge variant="secondary" className="mt-2">Inactive</Badge>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">My Bookings</h2>
              </div>
              <CustomerBookings />
            </div>
          )}
        </div>
      </div>

      {/* Edit Service Dialog */}
      <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
        <DialogContent aria-describedby="edit-service-desc">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <p id="edit-service-desc" className="text-sm text-gray-500">
              Make changes to your service details below.
            </p>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            editService.mutate({
              id: editingService.id,
              title: formData.get('title'),
              description: formData.get('description'),
              price: formData.get('price')
            });
          }}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  name="title"
                  defaultValue={editingService?.title}
                  className="w-full mt-1 border rounded-md p-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingService?.description}
                  className="w-full mt-1 border rounded-md p-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Price (₹)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5">
                    <IndianRupee className="w-4 h-4 text-gray-500" />
                  </span>
                  <input
                    name="price"
                    type="number"
                    defaultValue={editingService?.price}
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-9 border rounded-md p-2"
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-primary text-white rounded-md p-2"
                disabled={editService.isLoading}
              >
                Save Changes
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={isAddingService} onOpenChange={setIsAddingService}>
        <DialogContent aria-describedby="add-service-desc">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <p id="add-service-desc" className="text-sm text-gray-500">
              Add details for your new service offering.
            </p>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            addService.mutate({
              title: formData.get('title') as string,
              description: formData.get('description') as string,
              price: Number(formData.get('price')),
              category: formData.get('category') as string,
              city: formData.get('city') as string,
              provider_id: profile.id
            });
          }}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  name="title"
                  required
                  className="w-full mt-1 border rounded-md p-2"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Category</label>
                <select 
                  name="category"
                  required
                  className="w-full mt-1 border rounded-md p-2"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">City</label>
                <select
                  name="city" 
                  required
                  className="w-full mt-1 border rounded-md p-2"
                >
                  <option value="">Select city</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  required
                  className="w-full mt-1 border rounded-md p-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Price (₹)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5">
                    <IndianRupee className="w-4 h-4 text-gray-500" />
                  </span>
                  <input
                    name="price"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-9 border rounded-md p-2"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-primary text-white rounded-md p-2"
                disabled={addService.isLoading}
              >
                {addService.isLoading ? 'Adding...' : 'Add Service'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;