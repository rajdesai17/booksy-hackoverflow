import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const services = [
  {
    id: 1,
    name: "House Cleaning",
    price: "$80/hr",
    bookings: 12,
    rating: 4.8,
  },
  {
    id: 2,
    name: "Garden Maintenance",
    price: "$60/hr",
    bookings: 8,
    rating: 4.9,
  },
  {
    id: 3,
    name: "Window Cleaning",
    price: "$40/hr",
    bookings: 15,
    rating: 4.7,
  },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Services</h1>
          <Button className="bg-primary hover:bg-primary-dark">
            <Plus className="w-4 h-4 mr-2" />
            Add New Service
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                <div className="space-y-2 text-gray-600">
                  <p>Price: {service.price}</p>
                  <p>Total Bookings: {service.bookings}</p>
                  <p>Rating: {service.rating} ⭐</p>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    Edit
                  </Button>
                  <Button variant="outline" className="flex-1">
                    View Bookings
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;