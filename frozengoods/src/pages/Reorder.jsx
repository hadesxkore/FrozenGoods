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
  const [selectedItemsToAdd, setSelectedItemsToAdd] = useState([]);
  const [isAddItemsDialogOpen, setIsAddItemsDialogOpen] = useState(false);
  const [isAddProductsDialogOpen, setIsAddProductsDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productQuantities, setProductQuantities] = useState({});
  const [isDeleteItemsModalOpen, setIsDeleteItemsModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [deleteOption, setDeleteOption] = useState("selected");

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
      
      // Delete the specific item from Firestore
      await deleteDoc(doc(db, "reorderItems", itemId));
      
      // Update the local state by filtering out the deleted item
      setReorderItems(prevItems => prevItems.filter(item => item.id !== itemId));
      
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

  // Toggle item selection for adding to current list
  const toggleSavedItemSelection = (itemId) => {
    setSelectedItemsToAdd(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  // Select all items for adding to current list
  const selectAllItems = (items) => {
    const allSelected = items.every(item => selectedItemsToAdd.includes(item.id));
    if (allSelected) {
      setSelectedItemsToAdd([]);
    } else {
      setSelectedItemsToAdd(items.map(item => item.id));
    }
  };

  // Add selected items to current list
  const addSelectedItemsToCurrentList = async () => {
    if (selectedItemsToAdd.length === 0) {
      toast.error("Please select at least one item to add");
      return;
    }

    try {
      setLoading(true);
      
      // Get items from the selected saved list that match the selected IDs
      const itemsToAdd = selectedSavedList.items.filter(item => 
        selectedItemsToAdd.includes(item.id || item.productId)
      );
      
      // Find the saved list we want to add items to
      const targetSavedList = savedReorderLists.find(list => list.id === selectedSavedList.id);
      
      if (!targetSavedList) {
        toast.error("Target saved list not found");
        return;
      }
      
      // Create new item objects with fresh IDs
      const newItems = itemsToAdd.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid,
        status: "active"
      }));
      
      // Calculate new total amount
      const newTotalAmount = targetSavedList.items.reduce((sum, item) => {
        return sum + (item.subtotal || 0);
      }, 0) + newItems.reduce((sum, item) => {
        return sum + (item.subtotal || 0);
      }, 0);
      
      // Check if adding these items would exceed max amount
      if (targetSavedList.maxAmount > 0 && newTotalAmount > targetSavedList.maxAmount) {
        const excessAmount = newTotalAmount - targetSavedList.maxAmount;
        toast.error(`Adding these items would exceed the list's maximum amount by ₱${excessAmount.toFixed(2)}`);
        return;
      }
      
      // Update the saved list with the new items
      const updatedItems = [...targetSavedList.items, ...newItems];
      
      // Update in Firestore
      await updateDoc(doc(db, "savedReorderLists", targetSavedList.id), {
        items: updatedItems,
        totalAmount: newTotalAmount,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid
      });
      
      // Refresh saved lists
      const savedListsQuery = query(collection(db, "savedReorderLists"), orderBy("createdAt", "desc"));
      const savedListsSnapshot = await getDocs(savedListsQuery);
      const savedListsData = savedListsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedReorderLists(savedListsData);
      
      // Update selected saved list
      const updatedSelectedList = savedListsData.find(list => list.id === selectedSavedList.id);
      setSelectedSavedList(updatedSelectedList);
      
      // Close dialogs and reset selected items
      setIsAddItemsDialogOpen(false);
      setSelectedItemsToAdd([]);
      
      toast.success(`${newItems.length} item(s) added to "${targetSavedList.name}" list`);
    } catch (error) {
      console.error("Error adding items to saved list:", error);
      toast.error("Failed to add items to saved list");
    } finally {
      setLoading(false);
    }
  };

  // Toggle product selection for adding to reorder list
  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Select all products for adding to reorder list
  const selectAllProducts = (products) => {
    const allSelected = products.every(product => selectedProducts.includes(product.id));
    if (allSelected) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(product => product.id));
    }
  };

  // Handle quantity change for a product
  const handleProductQuantityChange = (productId, value) => {
    setProductQuantities(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  // Add selected products to reorder list
  const addSelectedProductsToReorderList = (newItems = []) => {
    if (newItems.length === 0) {
      if (selectedProducts.length === 0) {
        toast.error("Please select at least one product to add");
        return;
      }
  
      newItems = selectedProducts.map(productId => {
        const product = products.find(p => p.id === productId);
        const quantity = parseInt(productQuantities[productId]) || 1;
        const price = product?.price || 0;
        const distributorPrice = product?.distributorPrice || 0;
        const subtotal = quantity * distributorPrice;
        
        return {
          id: crypto.randomUUID(),
          productId: product.id,
          productName: product.name,
          quantity: quantity,
          yourPrice: price,
          distributorPrice: distributorPrice,
          subtotal: subtotal,
          notes: "",
          createdAt: new Date().toISOString(),
          createdBy: currentUser.uid,
          status: "active"
        };
      });
    }
    
    // Check if adding these items would exceed max amount
    const currentItems = [...reorderItems];
    const currentTotal = calculateTotalCost();
    const newItemsTotal = newItems.reduce((sum, item) => {
      return sum + (item.subtotal || 0);
    }, 0);
    
    if (maxTotalAmount > 0 && currentTotal + newItemsTotal > maxTotalAmount) {
      // Calculate how much it will exceed by
      const excessAmount = (currentTotal + newItemsTotal) - maxTotalAmount;
      toast.error(`Adding these items would exceed the maximum total amount by ₱${excessAmount.toFixed(2)}. Current total: ₱${currentTotal.toFixed(2)}, New items total: ₱${newItemsTotal.toFixed(2)}, Max allowed: ₱${maxTotalAmount.toFixed(2)}`);
      return;
    }
    
    setReorderItems([...currentItems, ...newItems]);
    setIsReorderListHidden(false);
    setActiveTab("reorder");
    setIsAddProductsDialogOpen(false);
    setIsAddItemsDialogOpen(false);
    setSelectedProducts([]);
    setProductQuantities({});
    toast.success(`${newItems.length} product(s) added to reorder list`);
  };

  // Filter products based on search term
  const filteredProductsForSelection = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

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
          <div className="flex gap-2">
            <Button onClick={() => setIsAddProductsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Products
            </Button>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Single Item
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsAddProductsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add More Products
          </Button>
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

  // Add new function to handle the deletion of specific items from a saved list
  const handleDeleteSelectedItems = async () => {
    if (deleteOption === "selected" && itemsToDelete.length === 0) {
      toast.error("Please select at least one item to delete");
      return;
    }
    
    try {
      setLoading(true);
      
      // Create a copy of the saved list
      const updatedList = { ...selectedSavedList };
      
      if (deleteOption === "selected") {
        // Remove selected items
        updatedList.items = updatedList.items.filter(item => !itemsToDelete.includes(item.id || item.productId));
      } else if (deleteOption === "all") {
        // Clear all items
        updatedList.items = [];
      }
      
      // Recalculate total amount
      const newTotalAmount = updatedList.items.reduce((sum, item) => {
        return sum + (item.subtotal || 0);
      }, 0);
      
      updatedList.totalAmount = newTotalAmount;
      
      // Update the saved list in Firestore
      await updateDoc(doc(db, "savedReorderLists", selectedSavedList.id), {
        items: updatedList.items,
        totalAmount: newTotalAmount,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid
      });
      
      // Refresh saved lists
      const savedListsQuery = query(collection(db, "savedReorderLists"), orderBy("createdAt", "desc"));
      const savedListsSnapshot = await getDocs(savedListsQuery);
      const savedListsData = savedListsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedReorderLists(savedListsData);
      
      // Update the selected saved list
      const updatedSelectedList = savedListsData.find(list => list.id === selectedSavedList.id);
      setSelectedSavedList(updatedSelectedList);
      
      // Reset selection state
      setItemsToDelete([]);
      setDeleteOption("selected");
      setIsDeleteItemsModalOpen(false);
      
      toast.success(deleteOption === "all" 
        ? "All items have been removed from the list" 
        : "Selected items have been removed from the list"
      );
    } catch (error) {
      console.error("Error deleting items:", error);
      toast.error("Failed to delete items");
    } finally {
      setLoading(false);
    }
  };

  // Add a function to toggle item selection for deletion
  const toggleItemDeletionSelection = (itemId) => {
    setItemsToDelete(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  // Add items to reorder list
  const addItemsToReorderList = (newItems) => {
    const currentItems = [...reorderItems];
    
    // Check if adding these items would exceed max amount
    const currentTotal = calculateTotalCost();
    const newItemsTotal = newItems.reduce((sum, item) => {
      return sum + (item.subtotal || 0);
    }, 0);
    
    if (maxTotalAmount > 0 && currentTotal + newItemsTotal > maxTotalAmount) {
      // Calculate how much it will exceed by
      const excessAmount = (currentTotal + newItemsTotal) - maxTotalAmount;
      toast.error(`Adding these items would exceed the maximum total amount by ₱${excessAmount.toFixed(2)}. Current total: ₱${currentTotal.toFixed(2)}, New items total: ₱${newItemsTotal.toFixed(2)}, Max allowed: ₱${maxTotalAmount.toFixed(2)}`);
      return;
    }
    
    setReorderItems([...currentItems, ...newItems]);
    setIsReorderListHidden(false);
    setActiveTab("reorder");
    setIsAddProductsDialogOpen(false);
    setIsAddItemsDialogOpen(false);
    setSelectedProducts([]);
    setProductQuantities({});
    toast.success(`${newItems.length} product(s) added to reorder list`);
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
            <DialogContent className="max-w-3xl">
              <DialogHeader className="border-b pb-4">
                <DialogTitle className="text-xl font-semibold">Add Reorder Item</DialogTitle>
                <DialogDescription className="text-sm">
                  Add a product to your reorder list.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="productId" className="text-sm font-medium">Select Product</Label>
                      <select
                        id="productId"
                        name="productId"
                        value={formData.productId}
                        onChange={handleInputChange}
                        className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="">Choose a product</option>
                        {products.map(product => {
                          const distributorPrice = product.distributorPrice ? `₱${product.distributorPrice.toFixed(2)}` : 'No price set';
                          return (
                            <option key={product.id} value={product.id}>
                              {product.name} - Stock: {product.quantity} - {distributorPrice}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {formData.productId && (
                      <div className="rounded-lg border bg-card p-4">
                        {(() => {
                          const selectedProduct = products.find(p => p.id === formData.productId);
                          if (!selectedProduct) return null;
                          return (
                            <div className="space-y-3">
                              <div className="flex items-start gap-4">
                                {selectedProduct.imageUrl ? (
                                  <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-muted flex-shrink-0">
                                    <img 
                                      src={selectedProduct.imageUrl} 
                                      alt={selectedProduct.name}
                                      className="h-full w-full object-cover" 
                                    />
                                  </div>
                                ) : (
                                  <div className="flex h-16 w-16 items-center justify-center rounded-md border bg-muted flex-shrink-0">
                                    <Package className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <h3 className="font-medium">{selectedProduct.name}</h3>
                                  <p className="text-sm text-muted-foreground">{selectedProduct.category || "Uncategorized"}</p>
                                </div>
                                <Badge 
                                  variant={selectedProduct.quantity <= 5 ? "destructive" : "secondary"}
                                  className="flex-shrink-0"
                                >
                                  Stock: {selectedProduct.quantity}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 border-t pt-3">
                                <div>
                                  <div className="text-xs text-muted-foreground">Your Price</div>
                                  <div className="font-medium text-green-600">₱{selectedProduct.price?.toFixed(2) || "0.00"}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Distributor Price</div>
                                  <div className="font-medium text-blue-600">₱{selectedProduct.distributorPrice?.toFixed(2) || "Not set"}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Stock Level</div>
                                  <div className="font-medium text-orange-600">{selectedProduct.quantity} items</div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quantity" className="text-sm font-medium">Quantity to Order</Label>
                        <Input
                          id="quantity"
                          name="quantity"
                          type="number"
                          min="1"
                          placeholder="Enter quantity"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          className="mt-2"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
                        <Input
                          id="notes"
                          name="notes"
                          placeholder="Add any notes about this reorder"
                          value={formData.notes}
                          onChange={handleInputChange}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  {formData.productId && formData.quantity && (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">Subtotal</div>
                        <div className="text-lg font-medium">
                          ₱{(() => {
                            const product = products.find(p => p.id === formData.productId);
                            const quantity = parseInt(formData.quantity) || 0;
                            return ((product?.distributorPrice || 0) * quantity).toFixed(2);
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="mt-6 flex items-center justify-between gap-4 border-t pt-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Item...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add to Reorder List
                      </>
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

      {/* Custom View Saved List Dialog */}
      {isViewSavedListDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-[95vw] max-w-[1200px] max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-xl font-bold">{selectedSavedList?.name}</h2>
              <button 
                onClick={() => setIsViewSavedListDialogOpen(false)}
                className="h-8 w-8 rounded-full inline-flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Info Bar */}
            <div className="flex items-center justify-between border-b px-6 py-3 bg-gray-50">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-sm text-gray-500">Created:</span>
                  <span className="ml-1 text-sm">{selectedSavedList ? new Date(selectedSavedList.createdAt).toLocaleDateString() : ""}</span>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500">Items:</span>
                  <span className="ml-1 text-sm font-medium">{selectedSavedList?.items.length}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-sm text-gray-500">Total:</span>
                  <span className="ml-1 text-sm font-medium text-green-600">₱{selectedSavedList?.totalAmount.toFixed(2)}</span>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500">Max:</span>
                  <span className="ml-1 text-sm font-medium text-blue-600">₱{selectedSavedList?.maxAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedSavedList?.items.map((item, index) => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <div key={index} className="flex rounded-md border bg-white p-3 shadow-sm">
                      <div className="w-16 h-16 mr-3 flex-shrink-0">
                        {product?.imageUrl ? (
                          <div className="h-16 w-16 overflow-hidden rounded bg-gray-100">
                            <img 
                              src={product.imageUrl} 
                              alt={item.productName}
                              className="h-full w-full object-cover" 
                            />
                          </div>
                        ) : (
                          <div className="h-16 w-16 flex items-center justify-center rounded bg-gray-100">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm leading-tight line-clamp-2">{item.productName}</h4>
                          <span className="ml-2 shrink-0 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                            x{item.quantity}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs mt-2">
                          <div className="flex items-center">
                            <span className="text-gray-500">Your:</span>
                            <span className="ml-1 text-green-600 font-medium">₱{item.yourPrice?.toFixed(2) || "0.00"}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-500">Dist:</span>
                            <span className="ml-1 text-blue-600 font-medium">
                              {product?.distributorPrice ? `₱${product.distributorPrice.toFixed(2)}` : 'Not set'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-500">Subtotal:</span>
                            <span className="ml-1 font-medium text-green-600">₱{item.subtotal?.toFixed(2) || "0.00"}</span>
                          </div>
                        </div>
                        
                        {item.notes && (
                          <div className="mt-2 pt-1 border-t text-xs text-gray-500 line-clamp-1">
                            <span className="font-medium">Note:</span> {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t p-4 flex items-center justify-between bg-gray-50">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setListToDelete(selectedSavedList.id);
                    setIsDeleteAlertOpen(true);
                  }}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete List
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setItemsToDelete([]);
                    setDeleteOption("selected");
                    setIsDeleteItemsModalOpen(true);
                  }}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Items
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedItemsToAdd([]);
                    setIsAddItemsDialogOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add to This List
                </Button>
                <Button 
                  size="sm"
                  onClick={() => {
                    setReorderItems(selectedSavedList.items);
                    setIsReorderListHidden(false);
                    setActiveTab("reorder");
                    setIsViewSavedListDialogOpen(false);
                    toast.success("Items added to new reorder list");
                  }}
                  className="gap-2"
                >
                  <ClipboardList className="h-4 w-4" />
                  Create New List
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Items Modal */}
      {isDeleteItemsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold">Delete Items</h2>
              <button 
                onClick={() => setIsDeleteItemsModalOpen(false)}
                className="h-8 w-8 rounded-full inline-flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Delete Options</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="deleteOption"
                      value="selected"
                      checked={deleteOption === "selected"}
                      onChange={() => setDeleteOption("selected")}
                      className="h-4 w-4"
                    />
                    <span>Delete selected items</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="deleteOption"
                      value="all"
                      checked={deleteOption === "all"}
                      onChange={() => setDeleteOption("all")}
                      className="h-4 w-4"
                    />
                    <span>Delete all items</span>
                  </label>
                </div>
              </div>
              
              {deleteOption === "selected" && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Select items to delete</h3>
                  <div className="max-h-60 overflow-y-auto border rounded-md">
                    {selectedSavedList?.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border-b last:border-b-0">
                        <input 
                          type="checkbox" 
                          id={`item-${index}`}
                          checked={itemsToDelete.includes(item.id || item.productId)}
                          onChange={() => toggleItemDeletionSelection(item.id || item.productId)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`item-${index}`} className="flex-1 flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{item.productName}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            x{item.quantity}
                          </span>
                        </label>
                        <div className="text-xs text-right">
                          <span className="text-gray-500">Subtotal:</span>
                          <span className="ml-1 font-medium text-green-600">₱{item.subtotal?.toFixed(2) || "0.00"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {itemsToDelete.length} items selected
                  </div>
                </div>
              )}
              
              {deleteOption === "all" && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <p className="text-sm font-medium">Warning</p>
                  </div>
                  <p className="mt-1 text-sm text-red-600">
                    This will remove all {selectedSavedList?.items.length} items from this list. This action cannot be undone.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 border-t p-4 bg-gray-50">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsDeleteItemsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteSelectedItems}
                disabled={deleteOption === "selected" && itemsToDelete.length === 0}
              >
                {deleteOption === "all" ? "Delete All Items" : "Delete Selected Items"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Items to Current List Dialog */}
      <Dialog open={isAddItemsDialogOpen} onOpenChange={setIsAddItemsDialogOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Add Items to "{selectedSavedList?.name}"</DialogTitle>
            <DialogDescription>
              Select items from this list to add to your current saved list.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="pl-9 pr-4"
                />
              </div>
              <div className="flex items-center gap-4 ml-4">
                <div className="text-sm text-muted-foreground">
                  {selectedProducts.length} of {filteredProducts.length} products selected
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => selectAllProducts(filteredProducts)}
                >
                  Select All
                </Button>
              </div>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {filteredProducts.map((product) => {
                const isSelected = selectedProducts.includes(product.id);
                return (
                  <div 
                    key={product.id} 
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      isSelected ? 'border-primary bg-primary/5' : 'bg-card'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => toggleProductSelection(product.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium truncate">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">Category: {product.category || "Uncategorized"}</p>
                        </div>
                        <div className="text-sm text-right">
                          <div>Your Price: <span className="text-green-600">₱{product.price?.toFixed(2) || "0.00"}</span></div>
                          <div>Distributor Price: <span className="text-blue-600">₱{product.distributorPrice?.toFixed(2) || "Not set"}</span></div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="mt-2 flex items-center gap-2">
                          <Label htmlFor={`quantity-${product.id}`} className="text-sm">Quantity:</Label>
                          <Input
                            id={`quantity-${product.id}`}
                            type="number"
                            min="1"
                            value={productQuantities[product.id] || 1}
                            onChange={(e) => handleProductQuantityChange(product.id, e.target.value)}
                            className="w-24 h-8"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No products found matching your search.
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between gap-4 border-t pt-4">
              <div className="text-sm">
                Selected Items: {selectedProducts.length}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddItemsDialogOpen(false);
                    setSelectedProducts([]);
                    setProductQuantities({});
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    // Generate items with subtotal calculation
                    const newItems = selectedProducts.map(productId => {
                      const product = products.find(p => p.id === productId);
                      const quantity = parseInt(productQuantities[productId]) || 1;
                      const price = product?.price || 0;
                      const distributorPrice = product?.distributorPrice || 0;
                      const subtotal = quantity * distributorPrice;
                      
                      return {
                        id: crypto.randomUUID(),
                        productId: product.id,
                        productName: product.name,
                        quantity: quantity,
                        yourPrice: price,
                        distributorPrice: distributorPrice,
                        subtotal: subtotal,
                        notes: "",
                        createdAt: new Date().toISOString(),
                        createdBy: currentUser.uid,
                        status: "active"
                      };
                    });
                    
                    // Check if we already have a selectedSavedList open
                    if (selectedSavedList) {
                      // Update the saved list with these new items
                      updateSavedListWithNewItems(newItems);
                    } else {
                      // Otherwise add to reorder items
                      addItemsToReorderList(newItems);
                    }
                  }}
                  disabled={selectedProducts.length === 0}
                >
                  Add Selected Products
                </Button>
              </div>
            </DialogFooter>
          </div>
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