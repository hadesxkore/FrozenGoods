import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  getDoc,
  query,
  orderBy,
  deleteDoc,
  serverTimestamp,
  where
} from "firebase/firestore";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Plus, 
  Trash2, 
  ShoppingCart, 
  PlusCircle, 
  Pencil, 
  Trash, 
  RotateCw,
  User,
  Calendar,
  FileText,
  Filter,
  Search,
  Tag,
  Package,
  DollarSign,
  AlertCircle,
  ChevronDown,
  Printer,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types of transactions
const TRANSACTION_TYPES = {
  SALE: 'sale',
  PRODUCT_ADDED: 'product_added',
  PRODUCT_UPDATED: 'product_updated',
  PRODUCT_DELETED: 'product_deleted',
  INVENTORY_ADJUSTMENT: 'inventory_adjustment'
};

// Group transaction types
const TRANSACTION_GROUPS = {
  SALES: 'sales',
  INVENTORY: 'inventory'
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "1",
    amount: "",
    notes: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(TRANSACTION_GROUPS.SALES);
  const [salesFilterType, setSalesFilterType] = useState("all");
  const [inventoryFilterType, setInventoryFilterType] = useState("all");
  const [salesCurrentPage, setSalesCurrentPage] = useState(1);
  const [inventoryCurrentPage, setInventoryCurrentPage] = useState(1);
  const itemsPerPage = 7; // Show 10 transactions per page
  const { currentUser } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");

  // Payment method options
  const PAYMENT_METHODS = {
    CASH: "Cash",
    GCASH: "GCash",
    PAYMAYA: "PayMaya"
  };

  // Fetch transactions and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get all transactions (sales + inventory changes)
        const transactionsQuery = query(
          collection(db, "transactions"),
          orderBy("date", "desc")
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const transactionsData = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date()
        }));
        setTransactions(transactionsData);
        
        // Get products
        const productsSnapshot = await getDocs(collection(db, "products"));
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "productId" && value) {
      const selectedProduct = products.find(product => product.id === value);
      if (selectedProduct) {
        setFormData({
          ...formData,
          productId: value,
          amount: (selectedProduct.price * parseInt(formData.quantity || 1)).toFixed(2)
        });
      }
    } else if (name === "quantity" && formData.productId) {
      const selectedProduct = products.find(product => product.id === formData.productId);
      if (selectedProduct) {
        setFormData({
          ...formData,
          quantity: value,
          amount: (selectedProduct.price * parseInt(value || 1)).toFixed(2)
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      productId: "",
      quantity: "1",
      amount: "",
      notes: ""
    });
  };

  // Open dialog for new transaction
  const openAddDialog = () => {
    resetFormData();
    setIsDialogOpen(true);
  };

  // Create a new transaction record for inventory actions
  const recordInventoryAction = async (type, productData, quantity = 0, notes = "") => {
    if (!currentUser) return;
    
    // Skip recording if there are no meaningful changes or details
    if (type === TRANSACTION_TYPES.PRODUCT_UPDATED && (!notes || notes.trim() === "")) {
      return;
    }
    
    try {
      const transactionData = {
        type,
        productId: productData.id,
        productName: productData.name,
        quantity: quantity,
        userName: currentUser.name || currentUser.email,
        userId: currentUser.uid,
        notes,
        date: serverTimestamp()
      };
      
      if (type === TRANSACTION_TYPES.PRODUCT_UPDATED) {
        transactionData.changes = notes;
      }
      
      await addDoc(collection(db, "transactions"), transactionData);
    } catch (error) {
      console.error("Error recording inventory action:", error);
    }
  };

  // Handle form submission (sales transaction)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      toast.error("Please select a valid product");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    const quantityNum = parseInt(quantity);
    if (!quantityNum || quantityNum <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (selectedProduct.quantity < quantityNum) {
      toast.error(`Not enough inventory. Only ${selectedProduct.quantity} units available.`);
      return;
    }

    try {
      setLoading(true);

      // Create transaction data
      const transactionData = {
        type: TRANSACTION_TYPES.SALE,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: quantityNum,
        amount: selectedProduct.price * quantityNum,
        paymentMethod: paymentMethod,
        notes: notes,
        userName: currentUser?.name || currentUser?.email || "Unknown User",
        userId: currentUser?.uid || "unknown",
        date: serverTimestamp()
      };

      // Add transaction to Firestore
      const docRef = await addDoc(collection(db, "transactions"), transactionData);

      // Update product quantity in inventory
      const productRef = doc(db, "products", selectedProduct.id);
      await updateDoc(productRef, {
        quantity: selectedProduct.quantity - quantityNum
      });

      // Update local states
      const newTransaction = {
        id: docRef.id,
        ...transactionData,
        date: new Date()
      };

      setTransactions(prev => [newTransaction, ...prev]);
      setProducts(prev => prev.map(product => 
        product.id === selectedProduct.id 
          ? { ...product, quantity: product.quantity - quantityNum }
          : product
      ));

      toast.success(`Sale of ${quantityNum} ${selectedProduct.name} recorded successfully`);

      // Reset form
      setSelectedProduct(null);
      setQuantity("");
      setNotes("");
      setPaymentMethod("");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error recording sale:", error);
      toast.error("Failed to record sale");
    } finally {
      setLoading(false);
    }
  };

  // Delete transaction (potentially with inventory restoration)
  const handleDelete = async () => {
    if (!transactionToDelete) return;
    
    try {
      setLoading(true);
      
      // Get the transaction first
      const transactionRef = doc(db, "transactions", transactionToDelete.id);
      const transactionDoc = await getDoc(transactionRef);
      
      if (transactionDoc.exists()) {
        const transactionData = transactionDoc.data();
        
        // Restore inventory for sales transactions
        if (transactionData.type === TRANSACTION_TYPES.SALE && transactionToDelete.restoreInventory) {
          // Restore product quantity
          const productRef = doc(db, "products", transactionData.productId);
          const productDoc = await getDoc(productRef);
          
          if (productDoc.exists()) {
            const productData = productDoc.data();
            await updateDoc(productRef, {
              quantity: productData.quantity + transactionData.quantity
            });
            
            // Update local state for products
            setProducts(products.map(product => 
              product.id === transactionData.productId 
                ? { ...product, quantity: product.quantity + transactionData.quantity } 
                : product
            ));
            
            // Record this inventory adjustment
            await recordInventoryAction(
              TRANSACTION_TYPES.INVENTORY_ADJUSTMENT,
              { id: transactionData.productId, name: transactionData.productName },
              transactionData.quantity,
              `Inventory restored from deleted transaction #${transactionToDelete.id}`
            );
            
            toast.success("Inventory restored successfully");
          }
        }
        
        // Delete the transaction
        await deleteDoc(transactionRef);
        
        // Update local state for transactions
        setTransactions(transactions.filter(transaction => transaction.id !== transactionToDelete.id));
        
        toast.success("Transaction deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
    } finally {
      setLoading(false);
      setIsDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (transaction, restoreInventory = false) => {
    setTransactionToDelete({
      ...transaction,
      restoreInventory: restoreInventory
    });
    setIsDeleteDialogOpen(true);
  };

  // Format date helper
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get transaction type display
  const getTransactionTypeDisplay = (type) => {
    switch(type) {
      case TRANSACTION_TYPES.SALE:
        return { 
          label: 'Sale', 
          icon: <ShoppingCart className="h-4 w-4 text-green-500" />,
          color: "bg-green-100 text-green-800 hover:bg-green-200"
        };
      case TRANSACTION_TYPES.PRODUCT_ADDED:
        return { 
          label: 'Product Added', 
          icon: <PlusCircle className="h-4 w-4 text-blue-500" />,
          color: "bg-blue-100 text-blue-800 hover:bg-blue-200"
        };
      case TRANSACTION_TYPES.PRODUCT_UPDATED:
        return { 
          label: 'Product Updated', 
          icon: <Pencil className="h-4 w-4 text-amber-500" />,
          color: "bg-amber-100 text-amber-800 hover:bg-amber-200"
        };
      case TRANSACTION_TYPES.PRODUCT_DELETED:
        return { 
          label: 'Product Deleted', 
          icon: <Trash className="h-4 w-4 text-red-500" />,
          color: "bg-red-100 text-red-800 hover:bg-red-200"
        };
      case TRANSACTION_TYPES.INVENTORY_ADJUSTMENT:
        return { 
          label: 'Inventory Adjustment', 
          icon: <RotateCw className="h-4 w-4 text-purple-500" />,
          color: "bg-purple-100 text-purple-800 hover:bg-purple-200"
        };
      default:
        return { 
          label: 'Unknown', 
          icon: <FileText className="h-4 w-4 text-gray-500" />,
          color: "bg-gray-100 text-gray-800 hover:bg-gray-200"
        };
    }
  };

  // Group transactions by type
  const salesTransactions = transactions.filter(transaction => 
    transaction.type === TRANSACTION_TYPES.SALE
  );
  
  const inventoryTransactions = transactions.filter(transaction => 
    transaction.type !== TRANSACTION_TYPES.SALE
  );

  // Filter transactions by search term and type
  const filterTransactions = (transactions, searchTerm, filterType) => {
    return transactions.filter(transaction => {
      // Filter by search term
      const matchesSearch = 
        (transaction.productName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.userName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.changes?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by transaction type
      const matchesType = filterType === 'all' || transaction.type === filterType;
      
      return matchesSearch && matchesType;
    });
  };

  // Filter transactions by payment method
  const filterTransactionsByPayment = (transactions) => {
    if (paymentMethodFilter === "all") return transactions;
    return transactions.filter(transaction => transaction.paymentMethod === paymentMethodFilter);
  };

  // Update the filtered sales transactions
  const filteredSalesTransactions = filterTransactions(
    filterTransactionsByPayment(salesTransactions),
    searchTerm,
    salesFilterType
  );

  // Update the filtered inventory transactions
  const filteredInventoryTransactions = filterTransactions(
    inventoryTransactions,
    searchTerm,
    inventoryFilterType
  );

  // Reset pagination when filters change or tab changes
  useEffect(() => {
    setSalesCurrentPage(1);
  }, [searchTerm, salesFilterType]);

  useEffect(() => {
    setInventoryCurrentPage(1);
  }, [searchTerm, inventoryFilterType]);

  useEffect(() => {
    if (activeTab === TRANSACTION_GROUPS.SALES) {
      setSalesCurrentPage(1);
    } else {
      setInventoryCurrentPage(1);
    }
  }, [activeTab]);

  // Apply pagination
  const paginatedSalesTransactions = filteredSalesTransactions.slice(
    (salesCurrentPage - 1) * itemsPerPage,
    salesCurrentPage * itemsPerPage
  );

  const paginatedInventoryTransactions = filteredInventoryTransactions.slice(
    (inventoryCurrentPage - 1) * itemsPerPage,
    inventoryCurrentPage * itemsPerPage
  );

  const salesTotalPages = Math.ceil(filteredSalesTransactions.length / itemsPerPage);
  const inventoryTotalPages = Math.ceil(filteredInventoryTransactions.length / itemsPerPage);

  // Handle page change
  const handleSalesPageChange = (page) => {
    setSalesCurrentPage(page);
  };

  const handleInventoryPageChange = (page) => {
    setInventoryCurrentPage(page);
  };

  // Generate pagination items
  const renderPaginationItems = (currentPage, totalPages, handlePageChange) => {
    const items = [];
    const maxVisiblePages = 5; // Maximum number of page links to show
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if less than maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink 
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink 
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      
      // Add ellipsis if needed
      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      // Add current page and adjacent pages
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink 
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      // Add ellipsis if needed
      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      // Show last page
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink 
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  const handlePrintSales = () => {
    // Show preparing notification
    toast.info('Preparing sales report for export...');
    
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast.error('Please allow popups for this site to print sales report');
      return;
    }
    
    const currentDate = format(new Date(), 'MMMM d, yyyy');
    
    // Calculate total sales amount
    const totalSales = filteredSalesTransactions.reduce((sum, transaction) => 
      sum + (transaction.amount || 0), 0
    );

    // Calculate totals by payment method
    const paymentMethodTotals = filteredSalesTransactions.reduce((acc, transaction) => {
      const method = transaction.paymentMethod || 'Unspecified';
      acc[method] = (acc[method] || 0) + (transaction.amount || 0);
      return acc;
    }, {});
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Report - ${currentDate}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #1a56db;
              margin-bottom: 10px;
            }
            .header p {
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f8fafc;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .footer {
              margin-top: 30px;
              text-align: right;
              font-size: 14px;
              color: #666;
            }
            .amount {
              font-weight: bold;
              color: #059669;
            }
            .date {
              white-space: nowrap;
            }
            .payment-summary {
              margin-top: 20px;
              padding: 15px;
              background-color: #f8fafc;
              border-radius: 8px;
            }
            .payment-summary h3 {
              margin-top: 0;
              color: #1a56db;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Frozen Goods Sales Report</h1>
            <p>Generated on ${currentDate}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Payment Method</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSalesTransactions.map(transaction => `
                <tr>
                  <td class="date">${format(transaction.date, 'MMM d, yyyy h:mm a')}</td>
                  <td>${transaction.productName}</td>
                  <td>${transaction.quantity} units</td>
                  <td>${transaction.paymentMethod || 'Unspecified'}</td>
                  <td class="amount">₱${transaction.amount?.toFixed(2) || '0.00'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="payment-summary">
            <h3>Payment Method Summary</h3>
            ${Object.entries(paymentMethodTotals).map(([method, amount]) => `
              <p><strong>${method}:</strong> ₱${amount.toFixed(2)}</p>
            `).join('')}
          </div>
          
          <div class="footer">
            <p><strong>Total Sales:</strong> ₱${totalSales.toFixed(2)}</p>
            <p>Total Transactions: ${filteredSalesTransactions.length}</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      
      // Close the window after printing (or after a delay if user cancels)
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close();
        }
        toast.success('Sales report exported successfully!');
      }, 1000);
    }, 500);
  };

  // Render sales transactions table
  const renderSalesTable = () => {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              placeholder="Search sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={paymentMethodFilter}
              onValueChange={setPaymentMethodFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value={PAYMENT_METHODS.CASH}>Cash</SelectItem>
                <SelectItem value={PAYMENT_METHODS.GCASH}>GCash</SelectItem>
                <SelectItem value={PAYMENT_METHODS.PAYMAYA}>PayMaya</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handlePrintSales}>
              <Printer className="mr-2 h-4 w-4" />
              Print Sales
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Sale
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Record New Sale</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                          disabled={loading}
                        >
                          {selectedProduct ? (
                            <div className="flex items-center gap-2">
                              <span>{selectedProduct.name}</span>
                              <Badge variant="outline">
                                ₱{selectedProduct.price.toFixed(2)}
                              </Badge>
                              <Badge variant={selectedProduct.quantity < 10 ? "destructive" : "secondary"}>
                                {selectedProduct.quantity} in stock
                              </Badge>
                            </div>
                          ) : (
                            "Select a product"
                          )}
                          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                        <div className="p-2">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search products..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-8"
                            />
                          </div>
                        </div>
                        <DropdownMenuSeparator />
                        <ScrollArea className="h-[300px]">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                              <DropdownMenuItem
                                key={product.id}
                                onSelect={() => {
                                  setSelectedProduct(product);
                                  setSearchTerm("");
                                }}
                                disabled={product.quantity <= 0}
                                className="p-3"
                              >
                                <div className="flex flex-col gap-1">
                                  <div className="font-medium">{product.name}</div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Badge variant="outline">
                                      ₱{product.price.toFixed(2)}
                                    </Badge>
                                    <Badge variant={product.quantity < 10 ? "destructive" : "secondary"}>
                                      {product.quantity} in stock
                                    </Badge>
                                  </div>
                                </div>
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              No products found
                            </div>
                          )}
                        </ScrollArea>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={selectedProduct?.quantity || 1}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      disabled={!selectedProduct || loading}
                    />
                    {selectedProduct && (
                      <div className="text-sm text-muted-foreground">
                        Total Amount: ₱{((selectedProduct.price || 0) * (parseInt(quantity) || 0)).toFixed(2)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PAYMENT_METHODS.CASH}>Cash</SelectItem>
                        <SelectItem value={PAYMENT_METHODS.GCASH}>GCash</SelectItem>
                        <SelectItem value={PAYMENT_METHODS.PAYMAYA}>PayMaya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any additional notes"
                      disabled={loading}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={!selectedProduct || !quantity || !paymentMethod || loading}
                    >
                      {loading ? (
                        <>
                          <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                          Recording...
                        </>
                      ) : (
                        "Record Sale"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {loading ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : paginatedSalesTransactions.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSalesTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(transaction.date)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        {transaction.productName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{transaction.userName || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {transaction.paymentMethod || "Unspecified"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {transaction.quantity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-green-500" />
                        <span className="font-medium text-green-600">
                          ₱{transaction.amount?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {transaction.notes || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openDeleteDialog(transaction, true)}
                          title="Delete transaction"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <CardFooter className="flex items-center justify-between px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {((salesCurrentPage - 1) * itemsPerPage) + 1} to {Math.min(salesCurrentPage * itemsPerPage, filteredSalesTransactions.length)} of {filteredSalesTransactions.length} transactions
              </div>
              {salesTotalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    {salesCurrentPage > 1 && (
                      <PaginationItem>
                        <PaginationPrevious onClick={() => handleSalesPageChange(salesCurrentPage - 1)} />
                      </PaginationItem>
                    )}
                    
                    {renderPaginationItems(salesCurrentPage, salesTotalPages, handleSalesPageChange)}
                    
                    {salesCurrentPage < salesTotalPages && (
                      <PaginationItem>
                        <PaginationNext onClick={() => handleSalesPageChange(salesCurrentPage + 1)} />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              )}
            </CardFooter>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/10">
            <ShoppingCart className="h-10 w-10 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium">No sales found</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {searchTerm 
                ? "No sales match your search criteria" 
                : "You haven't recorded any sales yet"}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Render inventory transactions table
  const renderInventoryTable = () => {
    const inventoryFilterOptions = [
      { value: "all", label: "All Activities" },
      { value: TRANSACTION_TYPES.PRODUCT_ADDED, label: "Products Added" },
      { value: TRANSACTION_TYPES.PRODUCT_UPDATED, label: "Products Updated" },
      { value: TRANSACTION_TYPES.PRODUCT_DELETED, label: "Products Deleted" },
      { value: TRANSACTION_TYPES.INVENTORY_ADJUSTMENT, label: "Inventory Adjustments" }
    ];
    
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              placeholder="Search inventory activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select 
              value={inventoryFilterType} 
              onChange={(e) => setInventoryFilterType(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {inventoryFilterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="rounded-md border min-h-[500px] flex flex-col">
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : paginatedInventoryTransactions.length > 0 ? (
            <>
              <div className="flex-grow">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInventoryTransactions.map((transaction) => {
                      const typeInfo = getTransactionTypeDisplay(transaction.type);
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <Badge className={`flex w-fit items-center gap-1 ${typeInfo.color}`}>
                              {typeInfo.icon}
                              {typeInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {formatDate(transaction.date)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-muted-foreground" />
                              {transaction.productName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{transaction.userName || "Unknown"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {transaction.quantity !== undefined && (
                              <Badge variant="outline">
                                {transaction.quantity > 0 ? "+" : ""}{transaction.quantity}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            <div className="truncate">
                              {transaction.notes || transaction.changes || "No details provided"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(transaction)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="border-t mt-auto">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((inventoryCurrentPage - 1) * itemsPerPage) + 1} to {Math.min(inventoryCurrentPage * itemsPerPage, filteredInventoryTransactions.length)} of {filteredInventoryTransactions.length} transactions
                  </div>
                  {inventoryTotalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        {inventoryCurrentPage > 1 && (
                          <PaginationItem>
                            <PaginationPrevious onClick={() => handleInventoryPageChange(inventoryCurrentPage - 1)} />
                          </PaginationItem>
                        )}
                        
                        {renderPaginationItems(inventoryCurrentPage, inventoryTotalPages, handleInventoryPageChange)}
                        
                        {inventoryCurrentPage < inventoryTotalPages && (
                          <PaginationItem>
                            <PaginationNext onClick={() => handleInventoryPageChange(inventoryCurrentPage + 1)} />
                          </PaginationItem>
                        )}
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/10 flex-grow">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No inventory activities found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {searchTerm 
                  ? "No inventory activities match your search criteria" 
                  : "No inventory activities have been recorded yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground mt-1">
          Manage and track all sales and inventory activities
        </p>
      </div>
      
      <Tabs 
        defaultValue={TRANSACTION_GROUPS.SALES} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="border-b">
          <div className="flex items-center justify-between">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value={TRANSACTION_GROUPS.SALES}
                className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Sales
                <Badge className="ml-2 px-1.5 py-0.5">
                  {salesTransactions.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value={TRANSACTION_GROUPS.INVENTORY}
                className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Package className="mr-2 h-4 w-4" />
                Inventory Activities
                <Badge className="ml-2 px-1.5 py-0.5">
                  {inventoryTransactions.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        <TabsContent value={TRANSACTION_GROUPS.SALES} className="pt-4 pb-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Sales History</CardTitle>
              <CardDescription>
                View and manage all sales transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderSalesTable()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value={TRANSACTION_GROUPS.INVENTORY} className="pt-4 pb-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Inventory Activity Log</CardTitle>
              <CardDescription>
                Track all changes to your inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderInventoryTable()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete Transaction Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Transaction
            </AlertDialogTitle>
            <AlertDialogDescription>
              {transactionToDelete?.type === TRANSACTION_TYPES.SALE ? (
                <>
                  Are you sure you want to delete this sale of {transactionToDelete?.quantity} {transactionToDelete?.productName}?
                  {transactionToDelete?.restoreInventory && (
                    <div className="mt-2 text-sm bg-blue-50 p-2 rounded border border-blue-200">
                      <strong>Note:</strong> This will restore the product quantity back to inventory.
                    </div>
                  )}
                </>
              ) : (
                <>Are you sure you want to delete this {getTransactionTypeDisplay(transactionToDelete?.type)?.label.toLowerCase()} record?</>
              )}
              <div className="mt-3">This action cannot be undone.</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {loading && <RotateCw className="h-4 w-4 animate-spin" />}
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 