import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2 } from "lucide-react";
import PhilosopherQuotes from "@/components/auth/PhilosopherQuotes";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if there's a redirect destination
  const from = location.state?.from?.pathname || "/dashboard";
  
  // If user is already logged in, redirect them
  useEffect(() => {
    if (currentUser) {
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, from]);

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (loading) return; // Prevent double submissions
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    
    try {
      setError("");
      setLoading(true);
      
      await login(email, password);
      
      // The navigation will happen in the useEffect when currentUser is set
      toast.success("Login successful!");
      
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to sign in. Please check your credentials.");
      setLoading(false); // Only set loading to false on error
    }
  }
  
  // Clear error message when user starts typing again
  useEffect(() => {
    if (error) setError("");
  }, [email, password]);
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-0">
      <div className="w-full h-screen flex flex-row shadow-lg">
        {/* Left side - Quotes */}
        <div className="hidden md:block md:w-1/2 h-full">
          <PhilosopherQuotes />
        </div>
        
        {/* Right side - Login Form */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
              <p className="text-muted-foreground">Enter your credentials to access your account</p>
            </div>
            
            {error && (
              <div className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 mb-6 rounded">
                <p>{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="border-input"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="#" className="text-sm text-blue-600 hover:text-blue-800">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="border-input"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In 
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-primary hover:text-primary/80 font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
            
            <div className="mt-12 text-center text-sm text-muted-foreground">
              <p>© 2024 Frozen Goods. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 