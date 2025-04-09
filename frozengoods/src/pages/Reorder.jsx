import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  query,
  where,
  orderBy,
  addDoc,
  deleteDoc
} from "firebase/firestore";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  RotateCw,
  Search,
  Tag,
  Package,
  DollarSign,
  AlertCircle,
  Printer,
  Check,
  X,
  FileText,
  ClipboardList,
  Edit,
  CheckCircle,
  AlertTriangle,
  Save,
  History
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
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

export default function Reorder() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reorderItems, setReorderItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    notes: ""
  });
  const [maxTotalAmount, setMaxTotalAmount] = useState(0);
  const [isMaxAmountDialogOpen, setIsMaxAmountDialogOpen] = useState(false);
  const [savedReorderLists, setSavedReorderLists] = useState([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveListName, setSaveListName] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [isReorderListHidden, setIsReorderListHidden] = useState(false);
  const [selectedSavedList, setSelectedSavedList] = useState(null);
  const [isViewSavedListDialogOpen, setIsViewSavedListDialogOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [lastDeletedList, setLastDeletedList] = useState(null);

  // Fetch products, reorder items, and saved reorder lists
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch products
        const productsQuery = query(collection(db, "products"));
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsData);
        
        // Fetch reorder items
        const reorderQuery = query(collection(db, "reorderItems"));
        const reorderSnapshot = await getDocs(reorderQuery);
        const reorderData = reorderSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReorderItems(reorderData);
        
        // Fetch max total amount
        const maxAmountQuery = query(collection(db, "reorderSettings"));
        const maxAmountSnapshot = await getDocs(maxAmountQuery);
        if (!maxAmountSnapshot.empty) {
          const maxAmountDoc = maxAmountSnapshot.docs[0];
          setMaxTotalAmount(maxAmountDoc.data().maxTotalAmount || 0);
        }
        
        // Fetch saved reorder lists
        const savedListsQuery = query(collection(db, "savedReorderLists"), orderBy("createdAt", "desc"));
        const savedListsSnapshot = await getDocs(savedListsQuery);
        const savedListsData = savedListsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSavedReorderLists(savedListsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter products based on search term and low stock
  const filteredProducts = products
    .filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      product.quantity <= 5
    )
    .sort((a, b) => a.quantity - b.quantity); // Sort from lowest to highest quantity

  // Apply pagination
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMaxAmountChange = (e) => {
    setMaxTotalAmount(parseFloat(e.target.value) || 0);
  };

  const handleSaveListNameChange = (e) => {
    setSaveListName(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (maxTotalAmount <= 0) {
      toast.error("Please set a maximum total amount before adding items", {
        action: {
          label: "Set Max Amount",
          onClick: () => setIsMaxAmountDialogOpen(true)
        }
      });
      setIsDialogOpen(false);
      return;
    }

    if (!formData.productId || !formData.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    try {
      setLoading(true);
      
      const selectedProduct = products.find(p => p.id === formData.productId);
      
      if (!selectedProduct) {
        toast.error("Selected product not found");
        return;
      }
      
      const quantity = parseInt(formData.quantity);
      const distributorPrice = selectedProduct.distributorPrice || 0;
      const yourPrice = selectedProduct.price || 0;
      const subtotal = quantity * distributorPrice;
      
      // Check if adding this item would exceed the max total amount
      const currentTotal = reorderItems.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        const itemPrice = product?.distributorPrice || 0;
        return sum + (itemPrice * item.quantity);
      }, 0);
      
      if (currentTotal + subtotal > maxTotalAmount) {
        toast.error(`Adding this item would exceed the maximum total amount of ₱${maxTotalAmount.toFixed(2)}`);
        return;
      }
      
      const reorderItem = {
        productId: formData.productId,
        productName: selectedProduct.name,
        quantity: quantity,
        yourPrice: yourPrice,
        distributorPrice: distributorPrice,
        subtotal: subtotal,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid,
        status: "active"
      };
      
      await addDoc(collection(db, "reorderItems"), reorderItem);
      
      // Refresh reorder items
      const reorderQuery = query(collection(db, "reorderItems"));
      const reorderSnapshot = await getDocs(reorderQuery);
      const reorderData = reorderSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReorderItems(reorderData);
      
      // Reset form
      setFormData({
        productId: "",
        quantity: "",
        notes: ""
      });
      
      setIsDialogOpen(false);
      toast.success("Reorder item added successfully");
    } catch (error) {
      console.error("Error adding reorder item:", error);
      toast.error("Failed to add reorder item");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setItemToEdit(item);
    setFormData({
      productId: item.productId,
      quantity: item.quantity.toString(),
      notes: item.notes || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!formData.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    try {
      setLoading(true);
      
      const selectedProduct = products.find(p => p.id === itemToEdit.productId);
      const quantity = parseInt(formData.quantity);
      const distributorPrice = selectedProduct?.distributorPrice || 0;
      const yourPrice = selectedProduct?.price || 0;
      const subtotal = quantity * distributorPrice;
      
      // Check if updating this item would exceed the max total amount
      const currentTotal = reorderItems.reduce((sum, item) => {
        if (item.id === itemToEdit.id) return sum;
        const product = products.find(p => p.id === item.productId);
        const itemPrice = product?.distributorPrice || 0;
        return sum + (itemPrice * item.quantity);
      }, 0);
      
      if (currentTotal + subtotal > maxTotalAmount) {
        toast.error(`Updating this item would exceed the maximum total amount of ₱${maxTotalAmount.toFixed(2)}`);
        return;
      }
      
      const reorderItemRef = doc(db, "reorderItems", itemToEdit.id);
      await updateDoc(reorderItemRef, {
        quantity: quantity,
        yourPrice: yourPrice,
        distributorPrice: distributorPrice,
        subtotal: subtotal,
        notes: formData.notes,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid
      });
      
      // Refresh reorder items
      const reorderQuery = query(collection(db, "reorderItems"));
      const reorderSnapshot = await getDocs(reorderQuery);
      const reorderData = reorderSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReorderItems(reorderData);
      
      setIsEditDialogOpen(false);
      toast.success("Reorder item updated successfully");
    } catch (error) {
      console.error("Error updating reorder item:", error);
      toast.error("Failed to update reorder item");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this reorder item?")) {
      return;
    }
    
    try {
      setLoading(true);
      
      await deleteDoc(doc(db, "reorderItems", itemId));
      
      // Refresh reorder items
      const reorderQuery = query(collection(db, "reorderItems"));
      const reorderSnapshot = await getDocs(reorderQuery);
      const reorderData = reorderSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReorderItems(reorderData);
      
      toast.success("Reorder item deleted successfully");
    } catch (error) {
      console.error("Error deleting reorder item:", error);
      toast.error("Failed to delete reorder item");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSavedList = async (listId) => {
    try {
      setLoading(true);
      
      // Store the list before deleting
      const listToDelete = savedReorderLists.find(list => list.id === listId);
      setLastDeletedList(listToDelete);
      
      await deleteDoc(doc(db, "savedReorderLists", listId));
      
      // Refresh saved lists
      const savedListsQuery = query(collection(db, "savedReorderLists"), orderBy("createdAt", "desc"));
      const savedListsSnapshot = await getDocs(savedListsQuery);
      const savedListsData = savedListsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedReorderLists(savedListsData);
      
      toast.success("Saved list deleted successfully", {
        action: {
          label: "Undo",
          onClick: () => handleUndoDelete(listToDelete)
        },
        duration: 5000 // Give users 5 seconds to undo
      });
      setIsDeleteAlertOpen(false);
      setListToDelete(null);
      
      // If we're deleting from the view dialog, close it
      if (isViewSavedListDialogOpen) {
        setIsViewSavedListDialogOpen(false);
      }
    } catch (error) {
      console.error("Error deleting saved list:", error);
      toast.error("Failed to delete saved list");
    } finally {
      setLoading(false);
    }
  };

  const handleUndoDelete = async (deletedList) => {
    if (!deletedList) return;
    
    try {
      setLoading(true);
      
      // Restore the deleted list
      await addDoc(collection(db, "savedReorderLists"), {
        name: deletedList.name,
        items: deletedList.items,
        totalAmount: deletedList.totalAmount,
        maxAmount: deletedList.maxAmount,
        createdAt: deletedList.createdAt,
        createdBy: deletedList.createdBy
      });
      
      // Refresh saved lists
      const savedListsQuery = query(collection(db, "savedReorderLists"), orderBy("createdAt", "desc"));
      const savedListsSnapshot = await getDocs(savedListsQuery);
      const savedListsData = savedListsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedReorderLists(savedListsData);
      
      setLastDeletedList(null);
      toast.success("List restored successfully");
    } catch (error) {
      console.error("Error restoring list:", error);
      toast.error("Failed to restore list");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMaxAmount = async () => {
    try {
      setLoading(true);
      
      // Check if settings document exists
      const settingsQuery = query(collection(db, "reorderSettings"));
      const settingsSnapshot = await getDocs(settingsQuery);
      
      if (settingsSnapshot.empty) {
        // Create new settings document
        await addDoc(collection(db, "reorderSettings"), {
          maxTotalAmount: maxTotalAmount,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.uid
        });
      } else {
        // Update existing settings document
        const settingsDoc = settingsSnapshot.docs[0];
        await updateDoc(doc(db, "reorderSettings", settingsDoc.id), {
          maxTotalAmount: maxTotalAmount,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.uid
        });
      }
      
      setIsMaxAmountDialogOpen(false);
      toast.success("Maximum total amount updated successfully");
    } catch (error) {
      console.error("Error updating maximum total amount:", error);
      toast.error("Failed to update maximum total amount");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReorderList = async () => {
    if (!saveListName.trim()) {
      toast.error("Please enter a name for the reorder list");
      return;
    }
    
    if (reorderItems.length === 0) {
      toast.error("Cannot save an empty reorder list");
      return;
    }
    
    try {
      setLoading(true);
      
      // Create a new saved reorder list
      await addDoc(collection(db, "savedReorderLists"), {
        name: saveListName,
        items: reorderItems,
        totalAmount: calculateTotalCost(),
        maxAmount: maxTotalAmount,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid
      });
      
      // Clear the current reorder items
      for (const item of reorderItems) {
        await deleteDoc(doc(db, "reorderItems", item.id));
      }

      // Reset the maximum total amount in Firestore
      const settingsQuery = query(collection(db, "reorderSettings"));
      const settingsSnapshot = await getDocs(settingsQuery);
      
      if (!settingsSnapshot.empty) {
        const settingsDoc = settingsSnapshot.docs[0];
        await updateDoc(doc(db, "reorderSettings", settingsDoc.id), {
          maxTotalAmount: 0,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.uid
        });
      } else {
        // Create new settings document if it doesn't exist
        await addDoc(collection(db, "reorderSettings"), {
          maxTotalAmount: 0,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.uid
        });
      }
      
      // Reset the maximum total amount in state
      setMaxTotalAmount(0);
      
      // Refresh saved reorder lists
      const savedListsQuery = query(collection(db, "savedReorderLists"), orderBy("createdAt", "desc"));
      const savedListsSnapshot = await getDocs(savedListsQuery);
      const savedListsData = savedListsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedReorderLists(savedListsData);
      
      // Reset reorder items
      setReorderItems([]);
      
      // Reset form and close dialog
      setSaveListName("");
      setIsSaveDialogOpen(false);
      setIsReorderListHidden(true);
      
      // Switch to products tab to show the reset state
      setActiveTab("products");
      
      toast.success("Reorder list saved successfully. Please set a new maximum total amount for your next list.", {
        duration: 5000
      });
    } catch (error) {
      console.error("Error saving reorder list:", error);
      toast.error("Failed to save reorder list");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReorderList = () => {
    const printWindow = window.open('', '_blank');
    
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { text-align: center; color: #333; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; }
        .total { text-align: right; margin-top: 20px; font-weight: bold; }
        .date { text-align: right; color: #666; margin-top: 20px; }
      </style>
    `;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reorder List</title>
          ${styles}
        </head>
        <body>
          <h1>Reorder List</h1>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Your Price</th>
                <th>Distributor Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${reorderItems.map(item => {
                const product = products.find(p => p.id === item.productId);
                return `
                  <tr>
                    <td>${item.productName}</td>
                    <td>${item.quantity}</td>
                    <td>₱${item.yourPrice?.toFixed(2) || "0.00"}</td>
                    <td>${product?.distributorPrice ? `₱${product.distributorPrice.toFixed(2)}` : 'Not set'}</td>
                    <td>₱${item.subtotal?.toFixed(2) || "0.00"}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="total">
            Total: ₱${calculateTotalCost().toFixed(2)} / Max: ₱${maxTotalAmount.toFixed(2)}
          </div>
          <div class="date">
            Generated on: ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = function() {
      printWindow.print();
      printWindow.close();
    };
  };

  const handleViewSavedList = (savedList) => {
    setSelectedSavedList(savedList);
    setIsViewSavedListDialogOpen(true);
  };

  const handleCreateNewList = () => {
    setIsReorderListHidden(false);
    setActiveTab("reorder");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Calculate total cost of reorder items
  const calculateTotalCost = () => {
    return reorderItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      const price = product?.distributorPrice || 0;
      return sum + (price * item.quantity);
    }, 0);
  };

  // Render products table
  const renderProductsTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (maxTotalAmount <= 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Maximum Total Amount Not Set</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please set a maximum total amount before adding reorder items.
          </p>
          <Button onClick={() => setIsMaxAmountDialogOpen(true)}>
            <DollarSign className="mr-2 h-4 w-4" />
            Set Max Total Amount
          </Button>
        </div>
      );
    }

    if (filteredProducts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No low stock products found</h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm ? "No products match your search criteria" : "You don't have any products with low stock (5 or fewer items)"}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Maximum Total Amount: ₱{maxTotalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Your Price</TableHead>
                <TableHead>Distributor Price</TableHead>
                <TableHead>Difference</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      {product.name}
                    </div>
                  </TableCell>
                  <TableCell>{product.category || "Uncategorized"}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={product.quantity <= 5 ? "destructive" : "secondary"}
                      className="font-normal"
                    >
                      {product.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-green-500" />
                      <span className="font-medium text-green-600">
                        ₱{product.price?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.distributorPrice ? (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-blue-500" />
                        <span className="font-medium text-blue-600">
                          ₱{product.distributorPrice.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.distributorPrice && product.price ? (
                      <Badge 
                        variant="outline" 
                        className={
                          product.price - product.distributorPrice > 0
                            ? "bg-green-50 text-green-700 border-green-200"
                            : product.price - product.distributorPrice < 0
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }
                      >
                        {product.price - product.distributorPrice > 0 ? "+" : ""}
                        ₱{(product.price - product.distributorPrice).toFixed(2)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setFormData({
                          productId: product.id,
                          quantity: "",
                          notes: ""
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add to Reorder
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render reorder items table
  const renderReorderItemsTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (reorderItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No reorder items</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add a reorder item to get started.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Reorder Item
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handlePrintReorderList}>
            <Printer className="mr-2 h-4 w-4" />
            Print to PDF
          </Button>
          <Button variant="outline" onClick={() => setIsSaveDialogOpen(true)}>
            <Save className="mr-2 h-4 w-4" />
            Save List
          </Button>
        </div>

        <div className="rounded-md border">
          <div id="reorderTableForPrint">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Your Price</TableHead>
                  <TableHead>Distributor Price</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reorderItems.map((item) => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-green-500" />
                          <span className="font-medium text-green-600">
                            ₱{product?.price?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product?.distributorPrice ? (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-blue-500" />
                            <span className="font-medium text-blue-600">
                              ₱{product.distributorPrice.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>₱{(item.quantity * (product?.distributorPrice || 0)).toFixed(2)}</TableCell>
                      <TableCell>{item.notes || "-"}</TableCell>
                      <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        {item.status === "active" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                {reorderItems.length} items in reorder list
              </div>
              <div className="text-sm font-medium">
                <span className="text-muted-foreground mr-2">Total:</span>
                <span className="text-green-600">₱{calculateTotalCost().toFixed(2)}</span>
                <span className="text-muted-foreground ml-2">/</span>
                <span className="text-muted-foreground ml-2">Max: ₱{maxTotalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render saved reorder lists
  const renderSavedReorderLists = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (savedReorderLists.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <History className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No saved reorder lists</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Save a reorder list to view it here.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={handleCreateNewList}>
            <Plus className="mr-2 h-4 w-4" />
            Create New List
          </Button>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>List Name</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Max Amount</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savedReorderLists.map((list) => (
                <TableRow key={list.id}>
                  <TableCell className="font-medium">{list.name}</TableCell>
                  <TableCell>{list.items.length}</TableCell>
                  <TableCell>₱{list.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>₱{list.maxAmount.toFixed(2)}</TableCell>
                  <TableCell>{new Date(list.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewSavedList(list)}
                        title="View List"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setListToDelete(list.id);
                          setIsDeleteAlertOpen(true);
                        }}
                        title="Delete List"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reorder Management</h1>
          <p className="text-muted-foreground">
            Set and track maximum total amounts for reorders of low stock items.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsMaxAmountDialogOpen(true)}>
            <DollarSign className="mr-2 h-4 w-4" />
            Set Max Total Amount
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Reorder Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Reorder Item</DialogTitle>
                <DialogDescription>
                  Add a product to your reorder list.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="productId">Product</Label>
                    <select
                      id="productId"
                      name="productId"
                      value={formData.productId}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      placeholder="Enter quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      name="notes"
                      placeholder="Add any notes about this reorder"
                      value={formData.notes}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Low Stock Products</TabsTrigger>
          <TabsTrigger value="reorder">Reorder Items</TabsTrigger>
          <TabsTrigger value="saved">Saved Lists</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Products</CardTitle>
              <CardDescription>
                View products with 5 or fewer items in stock and add them to your reorder list.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderProductsTable()}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reorder">
          <Card>
            <CardHeader>
              <CardTitle>Reorder Items</CardTitle>
              <CardDescription>
                Manage your reorder items and track the total amount.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isReorderListHidden ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Reorder list is hidden</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You can create a new reorder list or view your saved lists.
                  </p>
                  <Button onClick={handleCreateNewList}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New List
                  </Button>
                </div>
              ) : (
                renderReorderItemsTable()
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <CardTitle>Saved Reorder Lists</CardTitle>
              <CardDescription>
                View your previously saved reorder lists.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderSavedReorderLists()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reorder Item</DialogTitle>
            <DialogDescription>
              Update the quantity for this reorder item.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-product">Product</Label>
                <Input
                  id="edit-product"
                  value={itemToEdit?.productName || ""}
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  name="notes"
                  placeholder="Add any notes about this reorder"
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Max Total Amount Dialog */}
      <Dialog open={isMaxAmountDialogOpen} onOpenChange={setIsMaxAmountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Maximum Total Amount</DialogTitle>
            <DialogDescription>
              Set the maximum total amount for all reorder items combined.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="maxTotalAmount">Maximum Total Amount</Label>
              <Input
                id="maxTotalAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter maximum total amount"
                value={maxTotalAmount}
                onChange={handleMaxAmountChange}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveMaxAmount} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Reorder List Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Reorder List</DialogTitle>
            <DialogDescription>
              Save your current reorder list with a name.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="saveListName">List Name</Label>
              <Input
                id="saveListName"
                placeholder="Enter a name for this list"
                value={saveListName}
                onChange={handleSaveListNameChange}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveReorderList} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save List"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Saved List Dialog */}
      <Dialog open={isViewSavedListDialogOpen} onOpenChange={setIsViewSavedListDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedSavedList?.name || "Saved Reorder List"}</DialogTitle>
            <DialogDescription>
              Created on {selectedSavedList ? new Date(selectedSavedList.createdAt).toLocaleDateString() : ""}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSavedList && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {selectedSavedList.items.length} items in this list
                </div>
                <div className="text-sm font-medium">
                  <span className="text-muted-foreground mr-2">Total:</span>
                  <span className="text-green-600">₱{selectedSavedList.totalAmount.toFixed(2)}</span>
                  <span className="text-muted-foreground ml-2">/</span>
                  <span className="text-muted-foreground ml-2">Max: ₱{selectedSavedList.maxAmount.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedSavedList.items.map((item, index) => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <div key={index} className="rounded-lg border bg-card text-card-foreground shadow-sm">
                      <div className="p-3 space-y-2">
                        {product?.imageUrl ? (
                          <div className="relative h-28 w-full overflow-hidden rounded-md border">
                            <img 
                              src={product.imageUrl} 
                              alt={item.productName}
                              className="h-full w-full object-cover" 
                            />
                          </div>
                        ) : (
                          <div className="flex h-28 w-full items-center justify-center rounded-md border bg-muted">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-sm truncate">{item.productName}</h3>
                          <div className="mt-1 space-y-0.5 text-sm">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Quantity:</span>
                              <span>{item.quantity}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Distributor Price:</span>
                              <span className="text-blue-600">₱{product?.distributorPrice?.toFixed(2) || "Not set"}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Subtotal:</span>
                              <span className="font-medium">₱{(item.quantity * (product?.distributorPrice || 0)).toFixed(2)}</span>
                            </div>
                            {item.notes && (
                              <div className="pt-1">
                                <span className="text-muted-foreground text-xs">Notes:</span>
                                <p className="text-xs line-clamp-1 text-muted-foreground">{item.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <DialogFooter>
                <div className="flex justify-between w-full">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      handleDeleteSavedList(selectedSavedList.id);
                      setIsViewSavedListDialogOpen(false);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete List
                  </Button>
                  <Button 
                    onClick={() => {
                      setReorderItems(selectedSavedList.items);
                      setIsReorderListHidden(false);
                      setActiveTab("reorder");
                      setIsViewSavedListDialogOpen(false);
                      toast.success("Items added to new reorder list");
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New List with These Items
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the saved reorder list
              and all of its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => handleDeleteSavedList(listToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 