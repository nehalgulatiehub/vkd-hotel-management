import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Hotel, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center text-primary-foreground">
        <div className="flex justify-center mb-8">
          <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Hotel className="h-12 w-12 text-white" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          TerraLodge Manager
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
          Comprehensive hotel management system for modern hospitality businesses
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-3">Room Management</h3>
            <p className="text-white/80">
              Manage inventory, pricing, and availability in real-time
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-3">Guest Services</h3>
            <p className="text-white/80">
              Complete CRM and booking management system
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-3">Analytics</h3>
            <p className="text-white/80">
              Track performance with comprehensive reports
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
