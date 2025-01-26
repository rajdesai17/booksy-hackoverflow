import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Service } from "@/types/service";
import { useToast } from "@/hooks/use-toast";

interface ServicesListProps {
  providerId: string;
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

export const ServicesList = ({ providerId }: ServicesListProps) => {
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

  const { data: services, isLoading } = useQuery({
    queryKey: ["services", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("provider_id", providerId);
        
      if (error) throw error;
      return data;
    },
  });

  const createService = useMutation({
    mutationFn: async (service: Omit<Service, "id" | "provider_id">) => {
      if (!service.city) {
        throw new Error("City is required");
      }

      const { data, error } = await supabase
        .from("services")
        .insert([{ ...service, provider_id: providerId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", providerId] });
      toast({
        title: "Success",
        description: "Service created successfully",
      });
      setIsAddingService(false);
      setNewService({
        title: "",
        description: "",
        price: 0,
        category: "Haircuts",
        city: "Mumbai",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create service",
        variant: "destructive",
      });
    },
  });

  const handleAddService = () => {
    if (!newService.title || !newService.description || !newService.city) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including city",
        variant: "destructive",
      });
      return;
    }
    createService.mutate(newService);
  };

  if (isLoading) return <div>Loading services...</div>;

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Services</h2>
        <Button onClick={() => setIsAddingService(true)}>Add New Service</Button>
      </div>

      {isAddingService && (
        <Card className="p-4 mb-6">
          <div className="space-y-4">
            <Input
              placeholder="Service Title"
              value={newService.title}
              onChange={(e) => setNewService({ ...newService, title: e.target.value })}
            />
            <Textarea
              placeholder="Service Description"
              value={newService.description}
              onChange={(e) => setNewService({ ...newService, description: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Price"
              value={newService.price}
              onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
            />
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingService(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddService}>Add Service</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services?.map((service: Service) => (
          <Card key={service.id} className="p-4">
            <h3 className="font-semibold mb-2">{service.title}</h3>
            <p className="text-gray-600 mb-2">{service.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-primary font-semibold">₹{service.price}</span>
              <span className="text-sm text-gray-500">{service.category}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ServicesList;