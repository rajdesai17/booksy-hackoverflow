import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();

  const handleSignUp = (userType: "customer" | "provider") => {
    navigate("/auth", { 
      state: { 
        isLogin: false,
        userType 
      } 
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">Join LocalServices</h1>
          <p className="text-xl text-gray-600">Choose how you want to get started</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="text-center">
                <UserCircle className="w-16 h-16 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-semibold mb-4">I'm a Customer</h2>
                <p className="text-gray-600 mb-6">
                  Looking for reliable local services
                </p>
                <Button 
                  type="button"
                  onClick={() => handleSignUp("customer")}
                  className="w-full bg-primary hover:bg-primary-dark"
                  aria-label="Sign up as customer"
                >
                  Sign Up as Customer
                </Button>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="text-center">
                <Briefcase className="w-16 h-16 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-semibold mb-4">I'm a Provider</h2>
                <p className="text-gray-600 mb-6">
                  Ready to offer my services to customers
                </p>
                <Button
                  type="button" 
                  onClick={() => handleSignUp("provider")}
                  className="w-full bg-primary hover:bg-primary-dark"
                  aria-label="Sign up as provider"
                >
                  Sign Up as Provider
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;