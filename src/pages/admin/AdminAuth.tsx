import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, Eye, EyeOff } from "lucide-react";
import mukutLogo from "@/assets/mukut-logo.webp";

export default function AdminAuth() {
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user has admin/account role
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        const userRoles = roles?.map((r) => r.role) || [];
        if (userRoles.includes("admin") || userRoles.includes("account")) {
          navigate("/admin");
          return;
        }
      }
      setCheckingSession(false);
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

      // Check active status
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', authData.user?.id)
        .single();

      if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        throw new Error("Your account has been deactivated.");
      }

      // Check admin/account role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id);

      const userRoles = roles?.map((r) => r.role) || [];
      if (!userRoles.includes("admin") && !userRoles.includes("account")) {
        await supabase.auth.signOut();
        throw new Error("Access denied. Admin privileges required.");
      }

      toast.success("Welcome to Admin Panel!");
      navigate("/admin");
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/80 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto">
            <img src={mukutLogo} alt="Mukut Hotels" className="h-16 mx-auto" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-5 w-5 text-red-400" />
            <CardTitle className="text-xl text-white">Admin Panel Login</CardTitle>
          </div>
          <p className="text-slate-400 text-sm">Enter your admin credentials to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminUsername" className="text-slate-300 text-sm">
                Username
              </Label>
              <Input
                id="adminUsername"
                type="text"
                placeholder="Enter admin username"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                required
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-red-400 focus:ring-red-400/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPassword" className="text-slate-300 text-sm">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="adminPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-red-400 focus:ring-red-400/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white mt-2"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in to Admin Panel"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
