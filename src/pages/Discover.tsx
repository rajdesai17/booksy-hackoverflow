import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Search, Star } from "lucide-react";

const categories = [
  { id: 1, name: "Haircuts", icon: "💇‍♂️" },
  { id: 2, name: "Home Repairs", icon: "🔧" },
  { id: 3, name: "Cleaning", icon: "🧹" },
  { id: 4, name: "Gardening", icon: "🌱" },
  { id: 5, name: "Personal Training", icon: "💪" },
  { id: 6, name: "Pet Care", icon: "🐾" },
];

const Discover = () => {
  const [priceRange, setPriceRange] = useState([0, 100]);

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
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <div className="mt-1 relative">
                    <Input
                      type="text"
                      placeholder="Enter your location"
                      className="w-full"
                    />
                    <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Price Range</label>
                  <div className="mt-4">
                    <Slider
                      defaultValue={[0, 100]}
                      max={100}
                      step={1}
                      className="w-full"
                      onValueChange={(value) => setPriceRange(value)}
                    />
                    <div className="mt-2 text-sm text-gray-600">
                      ${priceRange[0]} - ${priceRange[1]}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Rating</label>
                  <div className="mt-2 space-y-2">
                    {[5, 4, 3].map((rating) => (
                      <label key={rating} className="flex items-center">
                        <input type="checkbox" className="rounded text-primary" />
                        <span className="ml-2 flex items-center">
                          {Array.from({ length: rating }).map((_, i) => (
                            <Star
                              key={i}
                              className="h-4 w-4 text-yellow-400 fill-current"
                            />
                          ))}
                          <span className="ml-1 text-sm text-gray-600">& up</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discover;