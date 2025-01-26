// Fix import statements
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // Fix typo in package name
import { supabase } from "@/integrations/supabase/client";
import { CustomerBookings } from "@/components/dashboard/CustomerBookings"; // Remove extra 'r'
import { ProviderBookings } from "@/components/dashboard/ProviderBookings";
import { ProviderFeedbacks } from "@/components/dashboard/ProviderFeedbacks";
import { ServicesList } from "@/components/dashboard/ServicesList";
import { Card } from "@/components/ui/card"; // Remove extra 'v'
import { 
  LayoutDashboard, 
  Users, 
  Star, 
  Upload,
  Briefcase,
  Edit,
  Trash2,
  IndianRupee,
  History,
  User
} from "lucide-react";
import { useState, useEffect } from "react"; // Remove extra 'i'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/useUser"; // Remove extra 'c'
import { Button } from "@/components/ui/button";
import { Navigate } from "react-router-dom";
import { EditProfileDialog } from "@/components/dashboard/EditProfileDialog";
import { toast } from "@/components/ui/use-toast";

const categories = [
  "Haircuts",
  "Home Repairs", 
  "Cleaning",
  "Gardening",
  "Personal Training",
  "Pet Care"
];

const cities = ["Mumbai", "Pune", "Bangalore"];

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  city: string;
  provider_id: string;
  is_active: boolean;
}

interface Profile {
  id: string;
  full_name: string;
  user_type: 'provider' | 'customer';
}

interface Booking {
  id: string;
  service: Service;
  status: string;
  feedback?: {
    rating: number;
    comment: string;
  };
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'accepted':
      return 'default';
    case 'pending':
      return 'warning';
    case 'rejected':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const Dashboard = () => {
  const { data: user } = useUser();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [formRating, setFormRating] = useState(0);
  const queryClient = useQueryClient();
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Get user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      console.log('User profile:', profile);
    }
  }, [profile]);

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
      // Get all bookings with service details for this provider
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          service:services!inner (
            id,
            price,
            provider_id
          )
        `)
        .eq('service.provider_id', profile.id);

      // Get all feedbacks for this provider's services
      const { data: feedbacks, error: feedbacksError } = await supabase
        .from('feedbacks')
        .select(`
          rating,
          booking:bookings!inner (
            service:services!inner (
              provider_id
            )
          )
        `)
        .eq('booking.service.provider_id', profile.id);

      // Get active services count
      const { count: activeServicesCount, error: servicesError } = await supabase
        .from('services')
        .select('id', { count: true })
        .eq('provider_id', profile.id)
        .eq('is_active', true);

      if (bookingsError || feedbacksError || servicesError) {
        throw new Error('Failed to fetch stats');
      }

      // Calculate metrics
      const acceptedBookings = bookings?.filter(b => b.status === 'accepted' || b.status === 'completed') || [];
      const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
      
      // Calculate total income from completed bookings
      const totalIncome = completedBookings.reduce((sum, booking) => 
        sum + (booking.service?.price || 0), 0);

      // Calculate average rating
      const validFeedbacks = feedbacks?.filter(f => f.rating > 0) || [];
      const avgRating = validFeedbacks.length 
        ? validFeedbacks.reduce((sum, f) => sum + f.rating, 0) / validFeedbacks.length 
        : 0;

      return {
        totalBookings: acceptedBookings.length,
        avgRating: Number(avgRating.toFixed(1)),
        activeServices: activeServicesCount || 0,
        totalIncome: Number(totalIncome.toFixed(2))
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

  // Get user bookings with proper error handling
  const { data: userBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["user-bookings", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id,
            status,
            booking_date,
            created_at,
            service_id,
            provider_id,
            services (
              id,
              title,
              price,
              provider_id,
              provider:profiles (
                id,
                full_name
              )
            ),
            feedbacks (
              id,
              rating,
              comment
            )
          `)
          .eq("customer_id", user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching bookings:', error);
          throw error;
        }

        console.log('Fetched user bookings:', data); // Debug log
        return data;
      } catch (error) {
        console.error('Query error:', error);
        return [];
      }
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
      // Invalidate all relevant queries
      queryClient.invalidateQueries(['bookings']);
      queryClient.invalidateQueries(['dashboard-stats']);
      queryClient.invalidateQueries(['provider-bookings']);
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

  const editService = useMutation<void, Error, Partial<Service>>({
    mutationFn: async (service) => {
      const { error } = await supabase
        .from('services')
        .update(service)
        .eq('id', service.id);
      if (error) throw error;
    }
  });

  const addService = useMutation<void, Error, Omit<Service, 'id' | 'is_active'>>({
    mutationFn: async (newService) => {
      if (!profile?.id) {
        throw new Error('Provider profile not found');
      }

      // First verify the profile exists
      const { data: providerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', profile.id)
        .single();

      if (profileError || !providerProfile) {
        console.error('Provider profile not found:', profileError);
        throw new Error('Provider profile not found');
      }

      // Then create the service
      const { error: serviceError } = await supabase
        .from('services')
        .insert([{ ...newService, provider_id: profile.id }]);

      if (serviceError) {
        console.error('Service creation error:', serviceError);
        throw serviceError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsAddingService(false);
      toast({
        title: "Success",
        description: "Service added successfully"
      });
    },
    onError: (error) => {
      console.error('Error adding service:', error);
      toast({
        title: "Error",
        description: "Failed to add service. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update the bookings query
  const { data: bookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(
            *,
            provider:profiles(*)
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
  
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Update feedback dialog submit handler
  const handleFeedbackSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    submitFeedback.mutate({
      bookingId: selectedBooking?.id!,
      rating: Number(formData.get('rating')),
      comment: formData.get('comment') as string,
    });
  };

  // Update the submitFeedback mutation to invalidate stats
  const submitFeedback = useMutation<void, Error, { bookingId: string; rating: number; comment: string }>({
    mutationFn: async ({ bookingId, rating, comment }) => {
      const { error } = await supabase
        .from('feedbacks')
        .insert([
          {
            booking_id: bookingId,
            rating,
            comment,
          },
        ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSelectedBooking(null);
      setFormRating(0);
    },
  });

  if (profileLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
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
              <div className="space-y-4">
                {bookingsLoading ? (
                  <div className="text-center py-8">Loading bookings...</div>
                ) : userBookings && userBookings.length > 0 ? (
                  <div className="space-y-4">
                    {userBookings.map((booking) => (
                      <Card key={booking.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{booking.service?.title}</h3>
                            <p className="text-sm text-gray-600">
                              Provider: {booking.service?.provider?.full_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Price: ₹{booking.service?.price}
                            </p>
                            <p className="text-sm text-gray-600">
                              Date: {new Date(booking.booking_date).toLocaleDateString()}
                            </p>
                            <div className="mt-2">
                              <Badge variant={getStatusBadgeVariant(booking.status)}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          {booking.status === 'completed' && !booking.feedbacks?.[0] && (
                            <Button
                              onClick={() => setSelectedBooking(booking)}
                              variant="outline"
                              size="sm"
                            >
                              <Star className="w-4 h-4 mr-2" />
                              Add Review
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No bookings found</p>
                  </div>
                )}
              </div>
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
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const formData = new FormData(form);
            
            editService.mutate({
              id: editingService?.id,
              title: formData.get('title') as string,
              description: formData.get('description') as string,
              price: Number(formData.get('price'))
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

      {/* Add Feedback Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feedback</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormRating(rating)}
                    className={`p-1 ${
                      rating <= formRating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    <Star className="w-6 h-6" />
                  </button>
                ))}
              </div>
              <input type="hidden" name="rating" value={formRating} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Comment</label>
              <textarea
                name="comment"
                required
                className="w-full p-2 border rounded-md"
                rows={3}
                placeholder="Share your experience..."
              />
            </div>
            <Button type="submit" className="w-full">
              Submit Feedback
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <EditProfileDialog 
        profile={profile}
        open={isEditingProfile}
        onOpenChange={setIsEditingProfile}
      />
    </div>
  );
};

export default Dashboard;