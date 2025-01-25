import { motion } from "framer-motion";
import HeroHighlight from "@/components/HeroHighlight";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Search, Calendar } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <HeroHighlight
            text="Find Local Services You Can Trust"
            highlightWords={["Trust"]}
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-xl text-gray-600"
          >
            Connect with verified local service providers in your area
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8"
          >
            <Button size="lg" className="bg-primary hover:bg-primary-dark">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose <Highlight>LocalServices</Highlight>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-white p-6 rounded-lg shadow-sm"
              >
                <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const features = [
  {
    title: "Easy Discovery",
    description: "Find the perfect service provider for your needs in minutes.",
    icon: <Search className="w-6 h-6 text-primary" />,
  },
  {
    title: "Secure Booking",
    description: "Book services with confidence using our secure platform.",
    icon: <Shield className="w-6 h-6 text-primary" />,
  },
  {
    title: "Flexible Scheduling",
    description: "Choose appointment times that work best for you.",
    icon: <Calendar className="w-6 h-6 text-primary" />,
  },
];

export default Home;