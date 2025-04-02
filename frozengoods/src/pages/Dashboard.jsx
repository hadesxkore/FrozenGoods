import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  ArrowRight, 
  ArrowUpRight, 
  ChevronRight, 
  Clock,
  DollarSign,
  BarChart,
  CalendarDays
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalTransactions: 0,
    recentTransactions: [],
    lowStockProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [salesTrend, setSalesTrend] = useState({ increasing: true, percentage: 12 });
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Get product count
        const productsSnapshot = await getDocs(collection(db, "products"));
        const totalProducts = productsSnapshot.size;
        
        // Get total sales (all transactions)
        const transactionsSnapshot = await getDocs(collection(db, "transactions"));
        const totalTransactions = transactionsSnapshot.size;
        
        // Calculate total sales amount
        let totalSales = 0;
        transactionsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.amount) {
            totalSales += data.amount;
          }
        });
        
        // Get recent transactions
        const recentTransactionsQuery = query(
          collection(db, "transactions"),
          orderBy("date", "desc"),
          limit(5)
        );
        const recentTransactionsSnapshot = await getDocs(recentTransactionsQuery);
        const recentTransactions = recentTransactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Get low stock products
        const lowStockProducts = productsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(product => product.quantity < 10)
          .sort((a, b) => a.quantity - b.quantity) // Sort by lowest quantity first
          .slice(0, 5);
        
        setStats({
          totalProducts,
          totalSales,
          totalTransactions,
          recentTransactions,
          lowStockProducts
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

  // Helper function to format dates
  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    
    let date;
    
    // Handle Firestore Timestamp objects
    if (dateValue && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    } 
    // Handle date objects
    else if (dateValue instanceof Date) {
      date = dateValue;
    } 
    // Handle string dates
    else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else {
      return "Invalid date";
    }
    
    // Check if date is valid before formatting
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1">
              <CalendarDays className="h-4 w-4" />
              <span>Today</span>
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Welcome to your Frozen Goods dashboard. Here's an overview of your business.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Products */}
        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-800">
              <Package className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats.totalProducts}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Items in your inventory
            </p>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
        </Card>
        
        {/* Card 2: Total Sales */}
        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-800">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-300" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-bold">
                ₱{stats.totalSales.toFixed(2)}
              </div>
            )}
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>All time sales</span>
              {salesTrend.increasing ? (
                <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 border-green-200">
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                  {salesTrend.percentage}%
                </Badge>
              ) : (
                <Badge variant="outline" className="ml-2 bg-red-100 text-red-700 border-red-200">
                  <ArrowUpRight className="mr-1 h-3 w-3 transform rotate-180" />
                  {salesTrend.percentage}%
                </Badge>
              )}
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500"></div>
        </Card>
        
        {/* Card 3: Recent Transactions */}
        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-800">
              <BarChart className="h-4 w-4 text-purple-600 dark:text-purple-300" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats.totalTransactions}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              All recorded activities
            </p>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></div>
        </Card>
        
        {/* Card 4: Low Stock Alert */}
        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-300" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats.lowStockProducts.length}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Products need restocking
            </p>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card className="overflow-hidden shadow-md">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Recent Transactions
                </CardTitle>
                <CardDescription>
                  Latest activities in your inventory
                </CardDescription>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats.recentTransactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Product</TableHead>
                    <TableHead className="text-center">Date</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-center">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium text-center">{transaction.productName || "Unknown"}</TableCell>
                      <TableCell className="text-center">{formatDate(transaction.date)}</TableCell>
                      <TableCell className="text-center">{transaction.quantity || 0}</TableCell>
                      <TableCell className="text-center">
                        {transaction.notes || "No notes"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <ShoppingCart className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No recent transactions</p>
              </div>
            )}
          </CardContent>
          {stats.recentTransactions.length > 0 && (
            <CardFooter className="border-t p-4 flex justify-center">
              <Button variant="ghost" className="gap-1" onClick={() => navigate('/transactions')}>
                View All Transactions
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          )}
        </Card>
        
        {/* Low Stock Products */}
        <Card className="overflow-hidden shadow-md">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Low Stock Alert
                </CardTitle>
                <CardDescription>
                  Products that need restocking soon
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats.lowStockProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category || "Uncategorized"}</TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={product.quantity < 5 ? "destructive" : "outline"}
                          className={product.quantity < 5 ? "" : "text-amber-500 border-amber-200 bg-amber-50"}
                        >
                          {product.quantity}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Package className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No low stock products</p>
              </div>
            )}
          </CardContent>
          {stats.lowStockProducts.length > 0 && (
            <CardFooter className="border-t p-4 flex justify-center">
              <Button variant="ghost" className="gap-1" onClick={() => navigate('/products')}>
                View All Products
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
} 