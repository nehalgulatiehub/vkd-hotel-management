import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

  // Exact colors from the screenshot
  const colors = {
    headerPink: "#FCE4EC",
    headerStripe: "#F8BBD9",
    maroon: "#8B1A1A",
    cardBlue: "#1A5276",
    signInGreen: "#2E7D32",
    peach: "#FFDAB9",
    peachDark: "#E9967A",
    footerBlue: "#2874A6"
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header - Light pink with diagonal stripe */}
      <header 
        className="relative overflow-hidden"
        style={{ backgroundColor: colors.headerPink }}
      >
        <div 
          className="absolute top-0 right-0 h-full w-2/5"
          style={{ 
            background: `linear-gradient(to bottom left, ${colors.headerStripe}, transparent)`,
            clipPath: "polygon(100% 0, 30% 0, 100% 100%)"
          }} 
        />
        <div className="px-8 py-3">
          <img src={mukutLogo} alt="Mukut Hotels" className="h-24 relative z-10" />
        </div>
      </header>

      {/* Date - Maroon italic */}
      <div className="px-8 py-4">
        <span 
          className="text-xl italic"
          style={{ color: colors.maroon }}
        >
          {currentDate}
        </span>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-8">
        <div className="flex gap-12">
          {/* Left Section - Login Card */}
          <div className="flex-1 max-w-2xl">
            {/* Login Card with very rounded corners */}
            <div 
              className="overflow-hidden"
              style={{ 
                borderRadius: "30px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
              }}
            >
              {/* Blue Header */}
              <div 
                className="px-6 py-3"
                style={{ backgroundColor: colors.cardBlue }}
              >
                <h2 className="text-white font-bold text-lg">
                  {isLogin ? "Login" : "Sign Up"}
                </h2>
              </div>
              
              {/* White Form Area */}
              <div className="bg-white px-8 py-10">
                <div className="flex gap-10">
                  {/* Form */}
                  <form onSubmit={handleAuth} className="space-y-6">
                    {!isLogin && (
                      <>
                        <div className="flex items-center">
                          <label className="w-28 text-right pr-4 text-gray-700">First Name :</label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            className="w-40 px-2 py-1 border border-gray-400 bg-gray-50"
                          />
                        </div>
                        <div className="flex items-center">
                          <label className="w-28 text-right pr-4 text-gray-700">Last Name :</label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            className="w-40 px-2 py-1 border border-gray-400 bg-gray-50"
                          />
                        </div>
                        <div className="flex items-center">
                          <label className="w-28 text-right pr-4 text-gray-700">Username :</label>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            required
                            className="w-40 px-2 py-1 border border-gray-400 bg-gray-50"
                          />
                        </div>
                        <div className="flex items-center">
                          <label className="w-28 text-right pr-4 text-gray-700">Email :</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-40 px-2 py-1 border border-gray-400 bg-gray-50"
                          />
                        </div>
                      </>
                    )}
                    {isLogin && (
                      <div className="flex items-center">
                        <label className="w-28 text-right pr-4 text-gray-700">Username :</label>
                        <input
                          type="text"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          required
                          className="w-40 px-2 py-1 border border-gray-400 bg-gray-50"
                        />
                      </div>
                    )}
                    <div className="flex items-center">
                      <label className="w-28 text-right pr-4 text-gray-700">Password :</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-40 px-2 py-1 border border-gray-400 bg-gray-50"
                      />
                    </div>
                    <div className="flex items-center">
                      <div className="w-28"></div>
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="px-4 py-1 text-white text-sm font-medium rounded"
                        style={{ backgroundColor: colors.signInGreen }}
                      >
                        {loading ? "..." : isLogin ? "Sign in" : "Sign Up"}
                      </button>
                    </div>
                    <div className="flex items-center">
                      <div className="w-28"></div>
                      <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm hover:underline"
                        style={{ color: colors.maroon }}
                      >
                        {isLogin ? "Forgot Password..?" : "Back to Login"}
                      </button>
                    </div>
                  </form>
                  
                  {/* Login Image */}
                  <div className="hidden md:flex items-center">
                    <img 
                      src={loginImage} 
                      alt="Login" 
                      className="w-56 h-auto"
                    />
                  </div>
                </div>
              </div>
              
              {/* Blue Footer */}
              <div 
                className="h-16"
                style={{ backgroundColor: colors.cardBlue }}
              ></div>
            </div>

            {/* Quote of the day */}
            <div className="mt-12">
              <div 
                className="inline-block px-8 py-2 text-white font-medium"
                style={{ 
                  backgroundColor: colors.peachDark,
                  borderRadius: "6px 6px 0 0"
                }}
              >
                Quote of the day
              </div>
              <div 
                className="h-10 max-w-lg"
                style={{ 
                  backgroundColor: colors.peach,
                  borderRadius: "0 6px 6px 6px"
                }}
              ></div>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="w-52 space-y-6 pt-2">
            {/* Latest News */}
            <div>
              <h3 
                className="font-bold text-lg mb-2"
                style={{ color: colors.maroon }}
              >
                Latest News
              </h3>
              <div 
                className="h-24"
                style={{ backgroundColor: colors.peach }}
              ></div>
            </div>

            {/* Our Hotels */}
            <div className="overflow-hidden border-2 border-blue-900">
              <img 
                src={ourHotelsImage} 
                alt="Our Hotels" 
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Travel Services */}
            <div className="overflow-hidden border-2 border-blue-900">
              <img 
                src={travelServicesImage} 
                alt="Travel Services" 
                className="w-full h-auto object-cover"
              />
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="py-4 px-8 mt-12"
        style={{ backgroundColor: colors.footerBlue }}
      >
        <div className="text-right">
          <span className="text-white text-sm">© Mukut Hotels & Resorts Pvt Ltd.</span>
        </div>
      </footer>
    </div>
  );
}
