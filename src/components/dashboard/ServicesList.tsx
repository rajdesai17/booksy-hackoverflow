import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import type { Service } from "@/types/service";

interface ServicesListProps {
  services: Service[];
  isLoading: boolean;
  onAddService: (service: Omit<Service, "id" | "provider_id" | "provider">) => void;
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

export const ServicesList = ({ services, isLoading, onAddService }: ServicesListProps) => {
  const [isAddingService, setIsAddingService] = useState(false);
  const [newService, setNewService] = useState({
    title: "",
    description: "",
    price: 0,
    category: "Haircuts",
    city: "Mumbai",
  });

  const handleAddService = () => {
    onAddService(newService);
    setIsAddingService(false);
    setNewService({
      title: "",
      description: "",
      price: 0,
      category: "Haircuts",
      city: "Mumbai",
    });
  };

  if (isLoading) return <div>Loading services...</div>;

  return (
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
    </div>
  );
};