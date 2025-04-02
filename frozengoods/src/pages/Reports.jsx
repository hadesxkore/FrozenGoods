import { useState, useEffect, useRef } from "react";
import { db } from "@/firebase/config";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  ArrowUpRight,
  BarChart2,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  LineChart,
  PieChart,
  RefreshCcw,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Add print styles
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    
    .print-container, .print-container * {
      visibility: visible;
    }
    
    .print-container {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }

    @page {
      size: portrait;
      margin: 20mm;
    }
  }
`;

export default function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState({
    totalSales: 0,
    previousPeriodSales: 0,
    percentageChange: 0,
    averageOrder: 0,
    totalOrders: 0
  });
  const [productCategories, setProductCategories] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [timeRange, setTimeRange] = useState("monthly");
  const [salesTrend, setSalesTrend] = useState({ increasing: true, percentage: 8 });
  const [refreshing, setRefreshing] = useState(false);
  const reportRef = useRef(null);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Get transactions for sales data
      const querySnapshot = await getDocs(
        query(
          collection(db, "transactions"),
          where("type", "==", "sale"),
          orderBy("date", "desc")
        )
      );
      
      const transactions = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        date: doc.data().date?.toDate()
      }));
      
      setTransactions(transactions);
      
      // Calculate current period (this month) and previous period sales
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const currentPeriodSales = transactions
        .filter(t => t.date >= currentMonthStart)
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const previousPeriodSales = transactions
        .filter(t => t.date >= previousMonthStart && t.date < currentMonthStart)
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const totalSales = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalOrders = transactions.length;
      const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Calculate percentage change
      const percentageChange = previousPeriodSales === 0 
        ? 100 // If previous period had no sales, consider it 100% growth
        : ((currentPeriodSales - previousPeriodSales) / previousPeriodSales) * 100;

      setSalesData({
        totalSales,
        previousPeriodSales,
        percentageChange,
        averageOrder,
        totalOrders
      });
      
      // Get products for category data
      const productsSnapshot = await getDocs(collection(db, "products"));
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Process products into category data
      const categoryData = processCategoryData(products);
      setProductCategories(categoryData);
      
      // Only process sales transactions for top products
      const topProductsData = processTopProducts(transactions, products);
      setTopProducts(topProductsData);
      
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    toast.info("Refreshing data...");
    await fetchReportData();
    toast.success("Data refreshed successfully");
  };

  // Process product category data
  const processCategoryData = (products) => {
    const categoryMap = new Map();
    
    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, 0);
      }
      
      categoryMap.set(category, categoryMap.get(category) + 1);
    });
    
    return Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Process top products data
  const processTopProducts = (transactions, productsData) => {
    const productMap = new Map();
    
    // Only consider transactions with type="sale"
    const salesTransactions = transactions.filter(transaction => transaction.type === "sale");
    
    if (salesTransactions.length === 0) {
      return []; // Return empty array if no sales
    }
    
    salesTransactions.forEach(transaction => {
      const productId = transaction.productId;
      const productName = transaction.productName || 'Unknown Product';
      const quantity = transaction.quantity || 0;
      const amount = transaction.amount || 0;
      
      if (!productMap.has(productId)) {
        // Try to find product category from products collection
        const productData = productsData.find(p => p.id === productId);
        
        productMap.set(productId, { 
          productId,
          productName, 
          quantity: 0, 
          revenue: 0,
          image: transaction.productImage || null,
          category: productData?.category || 'Uncategorized' 
        });
      }
      
      const product = productMap.get(productId);
      product.quantity += quantity;
      product.revenue += amount;
    });
    
    return Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get data for the currently selected time period
  const getCurrentSalesData = () => {
    return transactions.map(item => ({
      period: item.date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      total: item.amount || 0
    }));
  };

  // Chart configurations
  const salesChartData = {
    labels: getCurrentSalesData().map(item => item.period),
    datasets: [
      {
        label: `${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Sales (₱)`,
        data: getCurrentSalesData().map(item => item.total),
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.3
      }
    ]
  };

  const categoriesChart = {
    labels: productCategories.map(item => item.category),
    datasets: [
      {
        label: 'Products per Category',
        data: productCategories.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const topProductsChart = {
    labels: topProducts.map(item => item.productName),
    datasets: [
      {
        label: 'Units Sold',
        data: topProducts.map(item => item.quantity),
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 99, 132, 0.7)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Direct print functionality
  const handleDirectPrint = () => {
    toast.info('Preparing report for printing...');
    
    // Create a new window
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast.error('Please allow popups for this site to print reports');
      return;
    }
    
    // Get chart data for visualization
    const chartData = getCurrentSalesData();
    const maxValue = Math.max(...chartData.map(item => item.total)) || 100;
    
    // Generate bar chart HTML
    const generateBarChart = () => {
      return chartData.map(item => {
        const percentage = (item.total / maxValue) * 100;
        return `
          <div class="chart-bar">
            <div class="bar-label">${item.period}</div>
            <div class="bar-container">
              <div class="bar" style="width: ${percentage}%; background-color: rgba(75, 192, 192, 0.7);"></div>
            </div>
            <div class="bar-value">${formatCurrency(item.total)}</div>
          </div>
        `;
      }).join('');
    };
    
    // Generate the print content with improved design
    const printContent = `
      <html>
        <head>
          <title>Frozen Goods Sales Report</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              color: #333;
              line-height: 1.5;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 2px solid #f0f0f0;
              padding-bottom: 20px;
            }
            .header h1 {
              font-size: 28px;
              margin-bottom: 8px;
              color: #333;
            }
            .header p {
              color: #666;
              margin-top: 0;
              font-size: 16px;
            }
            .cards {
              display: flex;
              gap: 20px;
              margin-bottom: 40px;
            }
            .card {
              flex: 1;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.05);
              position: relative;
              overflow: hidden;
            }
            .card:nth-child(1) {
              border-bottom: 4px solid #3b82f6;
            }
            .card:nth-child(2) {
              border-bottom: 4px solid #8b5cf6;
            }
            .card:nth-child(3) {
              border-bottom: 4px solid #10b981;
            }
            .card h2 {
              font-size: 16px;
              margin-top: 0;
              margin-bottom: 12px;
              font-weight: 600;
              color: #555;
            }
            .card .value {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
              color: #111;
            }
            .card .subtitle {
              font-size: 14px;
              color: #666;
            }
            .chart-container {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 24px;
              margin-top: 20px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
            .chart-container h2 {
              font-size: 20px;
              margin-top: 0;
              margin-bottom: 24px;
              color: #333;
              border-bottom: 1px solid #f0f0f0;
              padding-bottom: 12px;
            }
            .chart-wrapper {
              padding: 20px 0;
            }
            .chart-bar {
              display: flex;
              align-items: center;
              margin-bottom: 15px;
              height: 35px;
            }
            .bar-label {
              width: 60px;
              text-align: right;
              padding-right: 15px;
              font-size: 14px;
              font-weight: 500;
            }
            .bar-container {
              flex: 1;
              height: 25px;
              background-color: #f3f4f6;
              border-radius: 4px;
              overflow: hidden;
              position: relative;
            }
            .bar {
              height: 100%;
              border-radius: 4px;
              transition: width 0.5s;
            }
            .bar-value {
              width: 100px;
              text-align: right;
              padding-left: 15px;
              font-size: 14px;
              font-weight: 600;
            }
            .signature {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #f0f0f0;
              font-size: 12px;
              color: #888;
              text-align: center;
            }
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              .card, .chart-container {
                break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Frozen Goods Sales Report</h1>
            <p>Generated on ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
          
          <div class="cards">
            <div class="card">
              <h2>Total Sales</h2>
              <div class="value">${formatCurrency(salesData.totalSales)}</div>
              <p class="subtitle">All time revenue</p>
            </div>
            
            <div class="card">
              <h2>Average Order</h2>
              <div class="value">${formatCurrency(salesData.averageOrder)}</div>
              <p class="subtitle">Average order value</p>
            </div>
            
            <div class="card">
              <h2>Total Orders</h2>
              <div class="value">${salesData.totalOrders}</div>
              <p class="subtitle">Completed transactions</p>
            </div>
          </div>
          
          <div class="chart-container">
            <h2>${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Sales Overview</h2>
            <div class="chart-wrapper">
              ${chartData.length > 0 ? generateBarChart() : 
                '<div style="text-align: center; padding: 30px 0; color: #888;">No sales data available for this period</div>'
              }
            </div>
          </div>
          
          <div class="signature">
            <p>Frozen Goods Inventory Management System</p>
          </div>
        </body>
      </html>
    `;
    
    // Write to the new window
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
      
      // Close the window after printing (or after a delay if user cancels)
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close();
        }
        toast.success('Report exported successfully!');
      }, 1000);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Add print style tag */}
      <style>{printStyles}</style>
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4" />
                  <span>Refresh</span>
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={handleDirectPrint}>
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Comprehensive analytics and performance metrics for your Frozen Goods business.
        </p>
      </div>
      
      {loading ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-4 w-48 mt-2" />
            </Card>
          ))}
          <Card className="col-span-1 md:col-span-3 p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-[300px] w-full rounded-md" />
          </Card>
        </div>
      ) : (
        <div className="grid gap-6" ref={reportRef}>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {/* Summary Cards */}
            <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-800">
                  <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(salesData.totalSales)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <span>All time revenue</span>
                  {salesData.percentageChange > 0 ? (
                    <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 border-green-200">
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                      {salesData.percentageChange.toFixed(1)}%
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="ml-2 bg-red-100 text-red-700 border-red-200">
                      <ArrowUpRight className="mr-1 h-3 w-3 transform rotate-180" />
                      {salesData.percentageChange.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </CardContent>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
            </Card>
            
            <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Average Order</CardTitle>
                <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-800">
                  <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(salesData.averageOrder)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average order value
                </p>
              </CardContent>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></div>
            </Card>
            
            <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-800">
                  <ShoppingBag className="h-4 w-4 text-green-600 dark:text-green-300" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesData.totalOrders}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Completed transactions
                </p>
              </CardContent>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500"></div>
            </Card>
          </div>
          
          {/* Sales Chart */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-primary" />
                    Sales Overview
                  </CardTitle>
                  <CardDescription>
                    Track your sales performance over time
                  </CardDescription>
                </div>
                
                <Tabs 
                  defaultValue="monthly" 
                  value={timeRange} 
                  onValueChange={setTimeRange}
                  className="w-auto"
                >
                  <TabsList className="grid w-auto grid-cols-3">
                    <TabsTrigger value="weekly" className="px-3">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      Weekly
                    </TabsTrigger>
                    <TabsTrigger value="monthly" className="px-3">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      Monthly
                    </TabsTrigger>
                    <TabsTrigger value="yearly" className="px-3">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      Yearly
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="p-6 h-80">
              {getCurrentSalesData().length > 0 ? (
                <Line 
                  data={salesChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          boxWidth: 10,
                          usePointStyle: true,
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                              label += ': ';
                            }
                            if (context.parsed.y !== null) {
                              label += '₱' + context.parsed.y.toFixed(2);
                            }
                            return label;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return '₱' + value;
                          }
                        }
                      }
                    }
                  }} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <LineChart className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
                  <p className="text-muted-foreground">No sales data available for this period</p>
                  <p className="text-xs text-muted-foreground mt-1">Try a different time period or add some sales</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {/* Product Categories */}
            <Card className="overflow-hidden shadow-md">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-primary" />
                      Product Categories
                    </CardTitle>
                    <CardDescription>
                      Distribution of products by category
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 h-[350px]">
                {productCategories.length > 0 ? (
                  <Doughnut 
                    data={categoriesChart} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: '65%',
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            boxWidth: 10,
                            usePointStyle: true,
                            padding: 20
                          }
                        }
                      }
                    }} 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <PieChart className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
                    <p className="text-muted-foreground">No category data available</p>
                    <p className="text-xs text-muted-foreground mt-1">Add products with categories to see data</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Top 5 Products */}
            <Card className="overflow-hidden shadow-md">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Top 5 Products
                    </CardTitle>
                    <CardDescription>
                      Your best-selling products by units sold
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {topProducts.length > 0 ? (
                  <div>
                    {topProducts.length < 5 && (
                      <div className="bg-amber-50 p-4 border-b">
                        <div className="flex items-center gap-2 text-amber-700">
                          <BarChart2 className="h-4 w-4" />
                          <p className="text-sm font-medium">
                            You need at least 5 sales transactions to see a complete Top 5 Products list.
                            Currently showing {topProducts.length} {topProducts.length === 1 ? 'product' : 'products'}.
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="p-4">
                      <Bar 
                        data={topProductsChart} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          indexAxis: 'y',
                          plugins: {
                            legend: {
                              display: false
                            }
                          },
                          scales: {
                            x: {
                              beginAtZero: true,
                              ticks: {
                                precision: 0
                              }
                            }
                          }
                        }} 
                        height={180}
                      />
                    </div>
                    
                    <div className="border-t">
                      {topProducts.map((product, index) => (
                        <div key={index} className={`flex items-center justify-between p-4 ${index !== topProducts.length - 1 ? 'border-b' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10 rounded">
                                {product.image ? (
                                  <img src={product.image} alt={product.productName} />
                                ) : (
                                  <div className="bg-primary/10 flex items-center justify-center h-full w-full">
                                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                              </Avatar>
                              {index < 3 && (
                                <span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium ${
                                  index === 0 ? 'bg-yellow-500' : 
                                  index === 1 ? 'bg-gray-300' : 
                                  'bg-amber-600'
                                } text-white`}>
                                  {index + 1}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{product.productName}</p>
                              <p className="text-xs text-muted-foreground">{product.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{product.quantity} units</p>
                            {product.revenue > 0 && (
                              <p className="text-xs text-muted-foreground">{formatCurrency(product.revenue)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[350px]">
                    <BarChart2 className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
                    <p className="text-muted-foreground">No sales data available</p>
                    <p className="text-xs text-muted-foreground mt-1">Make some sales transactions to see your top products</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 