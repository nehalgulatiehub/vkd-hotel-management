import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";

// Import images
import mukutLogo from "@/assets/mukut-logo.webp";
import loginImage from "@/assets/login-image.webp";
import ourHotelsImage from "@/assets/our-hotels.webp";
import travelServicesImage from "@/assets/travel-services.webp";

export default function Auth() {
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let emailToUse = loginIdentifier;
      
      if (!loginIdentifier.includes("@")) {
        const { data, error: lookupError } = await supabase.rpc('get_email_by_username', {
          _username: loginIdentifier
        });
        
        if (lookupError || !data) {
          throw new Error("Username not found");
        }
        emailToUse = data;
      }

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });
      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', authData.user?.id)
        .single();

      if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        throw new Error("Your account has been deactivated. Please contact the administrator.");
      }

      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const currentDate = format(new Date(), "dd/MM/yyyy");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="relative py-4 px-6" style={{ backgroundColor: 'rgb(248, 216, 217)' }}>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-pink-200/50 to-transparent" 
             style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
        <img src={mukutLogo} alt="Mukut Hotels" className="h-20 relative z-10" />
      </header>

      {/* Date */}
      <div className="px-6 py-3">
        <span className="text-[#8B1538] font-medium text-lg italic">{currentDate}</span>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-6 py-4">
        <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
          {/* Login Card */}
          <div className="flex-1">
            <div className="rounded-3xl overflow-hidden shadow-lg max-w-2xl">
              {/* Blue Header */}
              <div className="bg-gradient-to-r from-[#1e6e99] to-[#2a8ab8] px-6 py-3">
                <h2 className="text-white font-semibold text-lg">
                  Login
                </h2>
              </div>
              
              {/* Form Content */}
              <div className="bg-white p-6 border-x border-gray-200">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Form */}
                  <form onSubmit={handleAuth} className="flex-1 space-y-4 min-w-[280px]">
                    <div className="flex items-center gap-4">
                      <Label htmlFor="loginIdentifier" className="w-24 text-right text-gray-600 text-sm">
                        Username :
                      </Label>
                      <Input
                        id="loginIdentifier"
                        type="text"
                        placeholder="Enter username or email"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        required
                        className="flex-1 border-gray-300"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <Label htmlFor="password" className="w-24 text-right text-gray-600 text-sm">
                        Password :
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="flex-1 border-gray-300"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24"></div>
                      <Button 
                        type="submit" 
                        className="bg-red-600 hover:bg-red-700 text-white px-6 text-sm h-8"
                        disabled={loading}
                      >
                        {loading ? "Loading..." : "Sign in"}
                      </Button>
                    </div>
                  </form>
                  
                  {/* Image */}
                  <div className="hidden md:block">
                    <img 
                      src={loginImage} 
                      alt="Login" 
                      className="w-48 h-auto object-contain"
                    />
                  </div>
                </div>
              </div>
              
              {/* Blue Footer */}
              <div className="bg-gradient-to-r from-[#1e6e99] to-[#2a8ab8] h-12"></div>
            </div>

            {/* Quote of the day */}
            <div className="mt-8 max-w-2xl">
              <div className="bg-gradient-to-r from-[#f4a261] to-[#e9c46a] text-white px-6 py-2 rounded-t-lg inline-block">
                <span className="font-medium">Quote of the day</span>
              </div>
              <div className="bg-gradient-to-r from-[#f4a261]/30 to-[#e9c46a]/30 h-8 rounded-b-lg rounded-tr-lg"></div>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="w-full lg:w-64 space-y-6">
            {/* Latest News */}
            <div>
              <h3 className="text-[#8B1538] font-bold text-lg mb-3">Latest News</h3>
              <div className="bg-gradient-to-r from-[#f4a261]/30 to-[#e9c46a]/30 h-24 rounded-lg"></div>
            </div>

            {/* Our Hotels */}
            <div className="overflow-hidden rounded-lg shadow-md">
              <img 
                src={ourHotelsImage} 
                alt="Our Hotels" 
                className="w-full h-32 object-cover"
              />
            </div>

            {/* Travel Services */}
            <div className="overflow-hidden rounded-lg shadow-md">
              <img 
                src={travelServicesImage} 
                alt="Travel Services" 
                className="w-full h-32 object-cover"
              />
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#1e6e99] to-[#2a8ab8] py-4 px-6 mt-8">
        <div className="max-w-7xl mx-auto text-right">
          <span className="text-white/90 text-sm">© Mukut Hotels & Resorts Pvt Ltd.</span>
        </div>
      </footer>
    </div>
  );
}
