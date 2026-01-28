import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";

// Import images
import mukutLogo from "@/assets/mukut-logo.webp";
import loginImage from "@/assets/login-image.webp";
import ourHotelsImage from "@/assets/our-hotels.webp";
import travelServicesImage from "@/assets/travel-services.webp";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
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
      if (isLogin) {
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
      } else {
        if (!username.trim()) {
          throw new Error("Username is required");
        }
        
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .ilike('username', username)
          .maybeSingle();
        
        if (existingUser) {
          throw new Error("Username already taken");
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              username: username,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        toast.success("Account created! Please check your email to confirm.");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const currentDate = format(new Date(), "dd MMMM, yyyy");

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#fff" }}>
      {/* Header - Pink background matching logo */}
      <header className="relative overflow-hidden" style={{ backgroundColor: "#fce4ec" }}>
        <div 
          className="absolute top-0 right-0 h-full" 
          style={{ 
            width: "40%",
            background: "linear-gradient(to bottom left, #f8bbd9 0%, transparent 100%)",
            clipPath: "polygon(100% 0, 0 0, 100% 100%)"
          }} 
        />
        <div className="px-6 py-4">
          <img src={mukutLogo} alt="Mukut Hotels" className="h-24 relative z-10" />
        </div>
      </header>

      {/* Date - Maroon italic */}
      <div className="px-6 py-3">
        <span 
          className="font-medium text-lg italic"
          style={{ color: "#8B1538" }}
        >
          {currentDate}
        </span>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-6 py-4">
        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl">
          {/* Login Card */}
          <div className="flex-1">
            <div 
              className="overflow-hidden shadow-lg max-w-xl"
              style={{ borderRadius: "20px" }}
            >
              {/* Blue Header */}
              <div 
                className="px-6 py-3"
                style={{ 
                  background: "linear-gradient(135deg, #1565C0 0%, #1976D2 50%, #2196F3 100%)",
                  borderTopLeftRadius: "20px",
                  borderTopRightRadius: "20px"
                }}
              >
                <h2 className="text-white font-semibold text-lg">
                  {isLogin ? "Login" : "Sign Up"}
                </h2>
              </div>
              
              {/* Form Content - White background */}
              <div className="bg-white p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Form */}
                  <form onSubmit={handleAuth} className="flex-1 space-y-5">
                    {!isLogin && (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="w-24 text-right text-gray-700 text-sm">First Name :</span>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required={!isLogin}
                            className="flex-1 px-2 py-1 border border-gray-400 text-sm"
                            style={{ maxWidth: "180px" }}
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-24 text-right text-gray-700 text-sm">Last Name :</span>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required={!isLogin}
                            className="flex-1 px-2 py-1 border border-gray-400 text-sm"
                            style={{ maxWidth: "180px" }}
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-24 text-right text-gray-700 text-sm">Username :</span>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            required={!isLogin}
                            className="flex-1 px-2 py-1 border border-gray-400 text-sm"
                            style={{ maxWidth: "180px" }}
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-24 text-right text-gray-700 text-sm">Email :</span>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required={!isLogin}
                            className="flex-1 px-2 py-1 border border-gray-400 text-sm"
                            style={{ maxWidth: "180px" }}
                          />
                        </div>
                      </>
                    )}
                    {isLogin && (
                      <div className="flex items-center gap-3">
                        <span className="w-24 text-right text-gray-700 text-sm">Username :</span>
                        <input
                          type="text"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          required
                          className="flex-1 px-2 py-1 border border-gray-400 text-sm"
                          style={{ maxWidth: "180px" }}
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="w-24 text-right text-gray-700 text-sm">Password :</span>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="flex-1 px-2 py-1 border border-gray-400 text-sm"
                        style={{ maxWidth: "180px" }}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24"></div>
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="px-4 py-1 text-white text-sm font-medium rounded"
                        style={{ backgroundColor: "#4CAF50" }}
                      >
                        {loading ? "..." : isLogin ? "Sign in" : "Sign Up"}
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24"></div>
                      <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm hover:underline"
                        style={{ color: "#8B1538" }}
                      >
                        {isLogin ? "Forgot Password..?" : "Already have an account?"}
                      </button>
                    </div>
                    {isLogin && (
                      <div className="flex items-center gap-3">
                        <div className="w-24"></div>
                        <button
                          type="button"
                          onClick={() => setIsLogin(false)}
                          className="text-sm hover:underline"
                          style={{ color: "#1565C0" }}
                        >
                          Create new account
                        </button>
                      </div>
                    )}
                  </form>
                  
                  {/* Image */}
                  <div className="hidden md:block">
                    <img 
                      src={loginImage} 
                      alt="Login" 
                      className="w-52 h-auto object-contain"
                    />
                  </div>
                </div>
              </div>
              
              {/* Blue Footer */}
              <div 
                className="h-14"
                style={{ 
                  background: "linear-gradient(135deg, #1565C0 0%, #1976D2 50%, #2196F3 100%)",
                  borderBottomLeftRadius: "20px",
                  borderBottomRightRadius: "20px"
                }}
              ></div>
            </div>

            {/* Quote of the day - Peach/Orange color */}
            <div className="mt-10 max-w-xl">
              <div 
                className="text-white px-6 py-2 inline-block font-medium"
                style={{ 
                  background: "linear-gradient(90deg, #E57373 0%, #F4A261 100%)",
                  borderTopLeftRadius: "8px",
                  borderTopRightRadius: "8px"
                }}
              >
                Quote of the day
              </div>
              <div 
                className="h-10"
                style={{ 
                  background: "linear-gradient(90deg, #FFCCBC 0%, #FFE0B2 100%)",
                  borderBottomLeftRadius: "8px",
                  borderBottomRightRadius: "8px",
                  borderTopRightRadius: "8px"
                }}
              ></div>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="w-full lg:w-56 space-y-5">
            {/* Latest News */}
            <div>
              <h3 
                className="font-bold text-lg mb-2"
                style={{ color: "#8B1538" }}
              >
                Latest News
              </h3>
              <div 
                className="h-20 rounded"
                style={{ background: "linear-gradient(90deg, #FFCCBC 0%, #FFE0B2 100%)" }}
              ></div>
            </div>

            {/* Our Hotels */}
            <div className="overflow-hidden rounded shadow-md">
              <img 
                src={ourHotelsImage} 
                alt="Our Hotels" 
                className="w-full h-28 object-cover"
              />
            </div>

            {/* Travel Services */}
            <div className="overflow-hidden rounded shadow-md">
              <img 
                src={travelServicesImage} 
                alt="Travel Services" 
                className="w-full h-28 object-cover"
              />
            </div>
          </aside>
        </div>
      </main>

      {/* Footer - Blue matching login card */}
      <footer 
        className="py-4 px-6 mt-auto"
        style={{ background: "linear-gradient(135deg, #1565C0 0%, #1976D2 50%, #2196F3 100%)" }}
      >
        <div className="max-w-6xl text-right">
          <span className="text-white/90 text-sm">© Mukut Hotels & Resorts Pvt Ltd.</span>
        </div>
      </footer>
    </div>
  );
}
