import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import PhilosopherQuotes from "@/components/auth/PhilosopherQuotes";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    
    try {
      setError("");
      setLoading(true);
      await signup(email, password, name);
      navigate("/dashboard");
    } catch (error) {
      setError("Failed to create an account. " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-0">
      <div className="w-full h-screen flex flex-row shadow-lg">
        {/* Left side - Quotes */}
        <div className="hidden md:block md:w-1/2 h-full">
          <PhilosopherQuotes />
        </div>
        
        {/* Right side - Signup Form */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Create an account</h1>
              <p className="text-muted-foreground">Enter your information to start using Frozen Goods</p>
            </div>
            
            {error && (
              <div className="bg-destructive/10 border-l-4 border-destructive text-destructive p-4 mb-6 rounded">
                <p>{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border-input"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full font-medium"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Sign Up"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
                    Sign in
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