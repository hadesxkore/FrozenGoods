import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { setTheme, getTheme } from "@/lib/utils";
import {
  Moon,
  Sun,
  Laptop,
  User,
  Shield,
  Palette,
  Bell,
  Globe,
  Languages,
  HelpCircle,
  Save
} from "lucide-react";

export default function Settings() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("appearance");
  const [theme, setCurrentTheme] = useState(getTheme());
  const [loading, setLoading] = useState(false);
  
  // Settings states
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      browser: true,
      sales: true,
      stockAlerts: true,
    },
    appearance: {
      compactMode: false,
      animationsEnabled: true,
      highContrast: false
    },
    account: {
      name: currentUser?.name || "",
      email: currentUser?.email || "",
    }
  });
  
  const handleThemeChange = (newTheme) => {
    setCurrentTheme(newTheme);
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme === "system" ? "system default" : newTheme}`);
  };
  
  const handleToggleSetting = (category, setting) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [setting]: !settings[category][setting]
      }
    });
  };
  
  const handleSaveSettings = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("Settings saved successfully");
    }, 800);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
      </div>
      
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-8 lg:space-y-0">
        <aside className="lg:w-1/5">
          <Card>
            <CardContent className="px-2 py-4">
              <div className="space-y-1">
                <Button
                  variant={activeTab === "appearance" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("appearance")}
                >
                  <Palette className="mr-2 h-4 w-4" />
                  Appearance
                </Button>
                <Button
                  variant={activeTab === "account" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("account")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Account
                </Button>
                <Button
                  variant={activeTab === "notifications" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("notifications")}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </Button>
                <Button
                  variant={activeTab === "security" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("security")}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Security
                </Button>
                <Button
                  variant={activeTab === "language" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("language")}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Language
                </Button>
                <Button
                  variant={activeTab === "help" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("help")}
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
        
        <div className="flex-1">
          {/* Appearance Settings */}
          {activeTab === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="mr-2 h-5 w-5" /> 
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize how FrozenGoods looks and feels.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Theme</h3>
                  <div className="flex flex-wrap gap-4">
                    <div 
                      className={`flex flex-col items-center gap-2 rounded-lg border border-border p-3 cursor-pointer transition-colors ${theme === "light" ? "bg-primary/5 border-primary" : "hover:bg-accent/50"}`}
                      onClick={() => handleThemeChange("light")}
                    >
                      <div className="rounded-full bg-primary/10 p-3">
                        <Sun className="h-5 w-5" />
                      </div>
                      <span>Light</span>
                    </div>
                    
                    <div 
                      className={`flex flex-col items-center gap-2 rounded-lg border border-border p-3 cursor-pointer transition-colors ${theme === "dark" ? "bg-primary/5 border-primary" : "hover:bg-accent/50"}`}
                      onClick={() => handleThemeChange("dark")}
                    >
                      <div className="rounded-full bg-primary/10 p-3">
                        <Moon className="h-5 w-5" />
                      </div>
                      <span>Dark</span>
                    </div>
                    
                    <div 
                      className={`flex flex-col items-center gap-2 rounded-lg border border-border p-3 cursor-pointer transition-colors ${theme === "system" ? "bg-primary/5 border-primary" : "hover:bg-accent/50"}`}
                      onClick={() => handleThemeChange("system")}
                    >
                      <div className="rounded-full bg-primary/10 p-3">
                        <Laptop className="h-5 w-5" />
                      </div>
                      <span>System</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Preferences</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="compact-mode" className="text-base">Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Display more content with less spacing
                      </p>
                    </div>
                    <Switch 
                      id="compact-mode" 
                      checked={settings.appearance.compactMode}
                      onCheckedChange={() => handleToggleSetting('appearance', 'compactMode')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="animations" className="text-base">Enable animations</Label>
                      <p className="text-sm text-muted-foreground">
                        Show animations throughout the interface
                      </p>
                    </div>
                    <Switch 
                      id="animations" 
                      checked={settings.appearance.animationsEnabled}
                      onCheckedChange={() => handleToggleSetting('appearance', 'animationsEnabled')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="high-contrast" className="text-base">High contrast</Label>
                      <p className="text-sm text-muted-foreground">
                        Increase contrast for better readability
                      </p>
                    </div>
                    <Switch 
                      id="high-contrast" 
                      checked={settings.appearance.highContrast}
                      onCheckedChange={() => handleToggleSetting('appearance', 'highContrast')}
                    />
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button onClick={handleSaveSettings} className="ml-auto" disabled={loading}>
                  {loading ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Account Settings */}
          {activeTab === "account" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" /> 
                  Account Information
                </CardTitle>
                <CardDescription>
                  Update your account details and profile information.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl">
                      {currentUser?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1 flex-1">
                    <h3 className="font-medium">Profile Picture</h3>
                    <p className="text-sm text-muted-foreground">
                      This will be displayed on your profile and throughout the system.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm">Upload</Button>
                      <Button variant="outline" size="sm">Remove</Button>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Your name" 
                      value={settings.account.name} 
                      onChange={(e) => setSettings({
                        ...settings, 
                        account: {...settings.account, name: e.target.value}
                      })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="your.email@example.com" 
                      value={settings.account.email} 
                      onChange={(e) => setSettings({
                        ...settings, 
                        account: {...settings.account, email: e.target.value}
                      })}
                    />
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button onClick={handleSaveSettings} className="ml-auto" disabled={loading}>
                  {loading ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Notifications Settings */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" /> 
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Control how and when you receive notifications.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Channels</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive important notifications via email
                      </p>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      checked={settings.notifications.email}
                      onCheckedChange={() => handleToggleSetting('notifications', 'email')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="browser-notifications" className="text-base">Browser Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show notifications in your browser
                      </p>
                    </div>
                    <Switch 
                      id="browser-notifications" 
                      checked={settings.notifications.browser}
                      onCheckedChange={() => handleToggleSetting('notifications', 'browser')}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Types</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sales-notifications" className="text-base">Sales</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about new sales and transactions
                      </p>
                    </div>
                    <Switch 
                      id="sales-notifications" 
                      checked={settings.notifications.sales}
                      onCheckedChange={() => handleToggleSetting('notifications', 'sales')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="stock-alerts" className="text-base">Stock Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts when inventory is low
                      </p>
                    </div>
                    <Switch 
                      id="stock-alerts" 
                      checked={settings.notifications.stockAlerts}
                      onCheckedChange={() => handleToggleSetting('notifications', 'stockAlerts')}
                    />
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button onClick={handleSaveSettings} className="ml-auto" disabled={loading}>
                  {loading ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Security Settings */}
          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" /> 
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your password and account security.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </div>
                
                <Button className="mt-2">
                  Update Password
                </Button>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Session Management</h3>
                  <p className="text-sm text-muted-foreground">
                    You're currently logged in on this device. Manage your active sessions across devices.
                  </p>
                  <Button variant="outline">
                    Manage Sessions
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Language Settings */}
          {activeTab === "language" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5" /> 
                  Language and Region
                </CardTitle>
                <CardDescription>
                  Set your preferred language and regional settings.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="language">Display Language</Label>
                    <select 
                      id="language" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="ja">日本語</option>
                    </select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="region">Region</Label>
                    <select 
                      id="region" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="us">United States</option>
                      <option value="eu">European Union</option>
                      <option value="ca">Canada</option>
                      <option value="au">Australia</option>
                      <option value="ph">Philippines</option>
                    </select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="date-format">Date Format</Label>
                    <select 
                      id="date-format" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="mdy">MM/DD/YYYY</option>
                      <option value="dmy">DD/MM/YYYY</option>
                      <option value="ymd">YYYY/MM/DD</option>
                    </select>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button onClick={handleSaveSettings} className="ml-auto" disabled={loading}>
                  {loading ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Help & Support */}
          {activeTab === "help" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="mr-2 h-5 w-5" /> 
                  Help & Support
                </CardTitle>
                <CardDescription>
                  Get help with FrozenGoods or contact support.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-2">Documentation</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Browse our comprehensive documentation to learn how to use all features of FrozenGoods.
                    </p>
                    <Button variant="outline">View Documentation</Button>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-2">Contact Support</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Need help with something specific? Our support team is here to help.
                    </p>
                    <Button variant="outline">Contact Support</Button>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-2">Frequently Asked Questions</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Find answers to common questions about FrozenGoods.
                    </p>
                    <Button variant="outline">View FAQs</Button>
                  </div>
                </div>
                
                <div className="rounded-lg bg-primary/5 p-4 mt-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Need Immediate Assistance?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Our support team is available Monday to Friday, 9AM to 5PM.
                  </p>
                  <p className="text-sm font-medium">support@frozengoods.com</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 