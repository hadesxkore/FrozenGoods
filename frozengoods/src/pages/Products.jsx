import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { toast } from "sonner";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DialogClose
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Image as ImageIcon, 
  Loader2,
  Package,
  Search,
  Tag,
  CircleDollarSign,
  ClipboardList,
  ShoppingBag,
  Filter,
  Printer,
  FileDown,
  ArrowUpDown,
  Calendar,
  BookmarkIcon,
  DollarSign
} from "lucide-react";
import { uploadImageToCloudinary } from "@/utils/cloudinary";
import { format } from "date-fns";

// Transaction types
const TRANSACTION_TYPES = {
  PRODUCT_ADDED: 'product_added',
  PRODUCT_UPDATED: 'product_updated',
  PRODUCT_DELETED: 'product_deleted'
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    markupPrice: "",
    quantity: "",
    imageFile: null,
    imageUrl: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [productToReserve, setProductToReserve] = useState(null);
  const [reserveQuantity, setReserveQuantity] = useState("1");
  const [customerName, setCustomerName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7; // Display 7 items per page
  const { currentUser } = useAuth();

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Get unique categories for filter
  const categories = ["all"];
  const addedCategories = new Set();
  
  products.forEach(product => {
    if (product.category) {
      const normalizedCategory = product.category.trim().toLowerCase();
      if (!addedCategories.has(normalizedCategory)) {
        addedCategories.add(normalizedCategory);
        categories.push(product.category.trim());
      }
    }
  });

  // Record inventory transaction
  const recordInventoryTransaction = async (type, productData, notes = "") => {
    if (!currentUser) return;

    // Skip recording if there are no meaningful details to record
    if (!notes || notes.trim() === "") {
      return;
    }
    
    // For product updates, skip if there are no actual changes
    if (type === TRANSACTION_TYPES.PRODUCT_UPDATED && notes === ";") {
      return;
    }

    try {
      const transactionData = {
        type,
        productId: productData.id,
        productName: productData.name,
        quantity: productData.quantity || 0,
        userName: currentUser.name || currentUser.email,
        userId: currentUser.uid,
        date: serverTimestamp(),
        notes: notes
      };

      await addDoc(collection(db, "transactions"), transactionData);
    } catch (error) {
      console.error("Error recording inventory transaction:", error);
      toast.error("Failed to record transaction");
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === "imageFile" && files[0]) {
      setFormData({
        ...formData,
        imageFile: files[0]
      });
      
      // Upload image immediately when selected
      handleImageUpload(files[0]);
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Upload image to Cloudinary
  const handleImageUpload = async (file) => {
    if (!file) return;
    
    try {
      setUploadingImage(true);
      const imageUrl = await uploadImageToCloudinary(file);
      
      if (imageUrl) {
        setFormData(prevData => ({
          ...prevData,
          imageUrl
        }));
      } else {
        toast.error("Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      price: "",
      markupPrice: "",
      quantity: "",
      imageFile: null,
      imageUrl: ""
    });
    setIsEditing(false);
    setCurrentProductId(null);
  };

  // Open dialog for adding new product
  const openAddDialog = () => {
    resetFormData();
    setIsDialogOpen(true);
  };

  // Open dialog for editing product
  const openEditDialog = (product) => {
    setFormData({
      name: product.name || "",
      description: product.description || "",
      category: product.category || "",
      price: product.price ? String(product.price) : "", // Use the exact price from the table
      markupPrice: "", // Clear markup price since we're not using it in edit mode
      quantity: product.quantity ? String(product.quantity) : "",
      imageFile: null,
      imageUrl: product.imageUrl || ""
    });
    setIsEditing(true);
    setCurrentProductId(product.id);
    setIsDialogOpen(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  // Open reserve dialog
  const openReserveDialog = (product) => {
    setProductToReserve(product);
    setReserveQuantity("1");
    setCustomerName("");
    setIsReserveDialogOpen(true);
  };

  // Add this function before the handleSubmit function
  const handlePriceChange = (e) => {
    const value = e.target.value;
    const price = parseFloat(value) || 0;
    const markupPrice = (price * 1.20).toFixed(2); // 20% markup
    
    setFormData({
      ...formData,
      price: value,
      markupPrice: markupPrice
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.price || !formData.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      
      const productData = {
        name: formData.name,
        description: formData.description || "",
        category: formData.category,
        price: isEditing ? parseFloat(formData.price) : parseFloat(formData.markupPrice), // Use markup price for new products, direct price for edits
        quantity: parseInt(formData.quantity),
        imageUrl: formData.imageUrl || "",
        updatedAt: serverTimestamp()
      };

      if (isEditing && currentProductId) {
        // Get existing product to track changes
        const existingProduct = products.find(p => p.id === currentProductId);
        
        // Create notes about what changed
        const changes = [];
        if (existingProduct.name !== productData.name) 
          changes.push(`Name changed from "${existingProduct.name}" to "${productData.name}"`);
        if (existingProduct.price !== productData.price) 
          changes.push(`Price changed from ₱${existingProduct.price} to ₱${productData.price}`);
        if (existingProduct.quantity !== productData.quantity) 
          changes.push(`Quantity changed from ${existingProduct.quantity} to ${productData.quantity}`);
        if (existingProduct.category !== productData.category) 
          changes.push(`Category changed from "${existingProduct.category}" to "${productData.category}"`);
        
        // Update existing product
        const productRef = doc(db, "products", currentProductId);
        await updateDoc(productRef, productData);
        
        // Only record if there were actual changes
        if (changes.length > 0) {
          // Record this product update in transactions
          await recordInventoryTransaction(
            TRANSACTION_TYPES.PRODUCT_UPDATED, 
            { ...productData, id: currentProductId },
            changes.join("; ")
          );
        }
        
        // Update local state
        setProducts(products.map(product => 
          product.id === currentProductId ? { id: currentProductId, ...productData } : product
        ));

        toast.success("Product updated successfully");
      } else {
        // Add createdAt for new products
        productData.createdAt = serverTimestamp();
        
        // Add new product
        const docRef = await addDoc(collection(db, "products"), productData);
        
        // Record this new product in transactions
        await recordInventoryTransaction(
          TRANSACTION_TYPES.PRODUCT_ADDED, 
          { ...productData, id: docRef.id },
          `Added new product: ${productData.name}`
        );
        
        // Update local state
        setProducts([...products, { id: docRef.id, ...productData }]);

        toast.success("Product added successfully");
      }

      // Reset form and close dialog
      resetFormData();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(isEditing ? "Failed to update product" : "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const handleDelete = async () => {
    if (!productToDelete) return;
    
    try {
      setLoading(true);
      
      // Delete the product document from Firestore
      await deleteDoc(doc(db, "products", productToDelete.id));
      
      // Record this product deletion in transactions
      await recordInventoryTransaction(
        TRANSACTION_TYPES.PRODUCT_DELETED, 
        productToDelete,
        `Deleted product: ${productToDelete.name}`
      );
      
      // Update local state
      setProducts(products.filter(product => product.id !== productToDelete.id));
      
      // Close dialog
      setIsDeleteDialogOpen(false);
      
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  // Handle reservation submission
  const handleReserveProduct = async () => {
    try {
      if (!productToReserve) return;
      
      // Validate reservation quantity
      const quantity = parseInt(reserveQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        toast.error("Please enter a valid quantity");
        return;
      }
      
      if (quantity > productToReserve.quantity) {
        toast.error("Quantity exceeds available stock");
        return;
      }
      
      // Calculate total amount
      const amount = productToReserve.price * quantity;
      
      // Create reservation in Firestore
      const reservationRef = await addDoc(collection(db, "reservations"), {
        productId: productToReserve.id,
        productName: productToReserve.productName || productToReserve.name,
        quantity,
        amount,
        customerName: customerName.trim() || "Walk-in Customer",
        createdAt: new Date(),
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
      });
      
      // Update product quantity in the inventory
      const productRef = doc(db, "products", productToReserve.id);
      const newQuantity = productToReserve.quantity - quantity;
      
      await updateDoc(productRef, {
        quantity: newQuantity
      });
      
      // Add inventory transaction
      await addDoc(collection(db, "transactions"), {
        type: "inventory_adjustment",
        productId: productToReserve.id,
        productName: productToReserve.productName || productToReserve.name,
        quantity: -quantity,
        date: new Date(),
        notes: `Reserved ${quantity} units for ${customerName.trim() || "Walk-in Customer"} (Reservation ID: ${reservationRef.id.slice(0, 8)})`,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        reservationId: reservationRef.id
      });
      
      // Update the local products state
      setProducts(prevProducts => prevProducts.map(p => 
        p.id === productToReserve.id ? { ...p, quantity: newQuantity } : p
      ));
      
      // Close dialog and show success message
      setIsReserveDialogOpen(false);
      toast.success("Product reserved successfully");
    } catch (error) {
      console.error("Error reserving product:", error);
      toast.error("Failed to reserve product");
    }
  };

  // Filter products by search term and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      categoryFilter === "all" || 
      product.category?.toLowerCase() === categoryFilter.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Generate pagination items
  const renderPaginationItems = () => {
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

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  const handleExportPDF = () => {
    // Show preparing notification
    toast.info('Preparing inventory data for export...');
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast.error('Please allow popups for this site to export PDF');
      return;
    }
    
    const currentDate = format(new Date(), 'MMMM d, yyyy');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Frozen Goods Inventory - ${currentDate}</title>
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
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .price {
              font-weight: bold;
              color: #1a56db;
            }
            .stock {
              font-weight: bold;
            }
            .low-stock {
              color: #dc2626;
            }
            .category {
              color: #4b5563;
              font-size: 0.9em;
            }
            .amount {
              font-weight: bold;
              color: #059669;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Frozen Goods Inventory</h1>
            <p>Generated on ${currentDate}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Amount</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(product => `
                <tr>
                  <td>${product.name}</td>
                  <td class="category">${product.category || 'Uncategorized'}</td>
                  <td class="price">₱${product.price.toFixed(2)}</td>
                  <td class="stock ${product.quantity < 10 ? 'low-stock' : ''}">${product.quantity} units</td>
                  <td class="amount">₱${(product.price * product.quantity).toFixed(2)}</td>
                  <td>${product.description || 'No description'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>This is an official inventory report from Frozen Goods</p>
            <p>Total Products: ${products.length}</p>
            <p>Total Value: ₱${products.reduce((sum, product) => sum + (product.price * product.quantity), 0).toFixed(2)}</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Wait for the content to load before printing
    setTimeout(() => {
      printWindow.print();
      
      // Close the window after printing (or after a delay if user cancels)
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close();
        }
        toast.success('Inventory report exported successfully!');
      }, 1000);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-muted-foreground">
          Manage your frozen goods inventory, add new products or modify existing ones.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 w-full"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>
        </div>
        
        <Button onClick={handleExportPDF} className="w-full sm:w-auto">
          <Printer className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
        
        <Button onClick={openAddDialog} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Frozen Goods Inventory
              </CardTitle>
              <CardDescription>
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} in your inventory
                {filteredProducts.length > itemsPerPage && ` (showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredProducts.length)} of ${filteredProducts.length})`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Product Details</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.imageUrl ? (
                          <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="h-full w-full object-cover" 
                            />
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{product.name}</span>
                          {product.description && (
                            <span className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {product.category || "Uncategorized"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CircleDollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">₱{product.price?.toFixed(2) || "0.00"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            product.quantity <= 0 ? "destructive" : 
                            product.quantity < 5 ? "destructive" : 
                            product.quantity < 10 ? "warning" : 
                            "outline"
                          }
                        >
                          {product.quantity || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">₱{(product.price * product.quantity).toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => openReserveDialog(product)}
                            disabled={product.quantity <= 0}
                          >
                            <BookmarkIcon className="h-3 w-3" />
                            <span>Reserve</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditDialog(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openDeleteDialog(product)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center border rounded-md bg-muted/10">
              <Package className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-md">
                {searchTerm || categoryFilter !== "all" 
                  ? "No products match your search criteria. Try changing your filters."
                  : "Your inventory is empty. Add products to get started."}
              </p>
              <Button onClick={openAddDialog} variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Add your first product
              </Button>
            </div>
          )}
        </CardContent>
        {filteredProducts.length > itemsPerPage && (
          <CardFooter className="flex justify-center border-t px-6 py-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                
                {renderPaginationItems()}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        )}
      </Card>
      
      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditing ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {isEditing ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update the details of your existing product."
                : "Fill in the details to add a new product to your inventory."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-5 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g. Ice Cream, Frozen Meat"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of the product"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Base Price</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={isEditing ? handleChange : handlePriceChange}
                      placeholder="Enter base price"
                      className="pl-9"
                      required
                    />
                  </div>
                  {!isEditing && formData.price && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-800">Selling Price (20% Markup):</span>
                        <span className="font-medium text-blue-900">₱{formData.markupPrice}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="imageFile">Product Image</Label>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Input
                      id="imageFile"
                      name="imageFile"
                      type="file"
                      accept="image/*"
                      onChange={handleChange}
                      disabled={uploadingImage}
                      className={uploadingImage ? "opacity-50" : ""}
                    />
                    {uploadingImage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  
                  {formData.imageUrl && (
                    <div className="relative h-16 w-16 overflow-hidden rounded-md border flex-shrink-0">
                      <img
                        src={formData.imageUrl}
                        alt="Product preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={loading || uploadingImage}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || uploadingImage}
                className="gap-2"
              >
                {(loading || uploadingImage) && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? "Update Product" : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? 
              This action cannot be undone and will remove the product from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Reserve Product Dialog */}
      <Dialog open={isReserveDialogOpen} onOpenChange={setIsReserveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reserve Product</DialogTitle>
            <DialogDescription>
              Create a reservation for this product.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="product-name">Product</Label>
              <Input
                id="product-name"
                value={productToReserve?.name || ""}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="customer-name">Customer Name</Label>
              <Input
                id="customer-name"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="quantity">Quantity</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Enter quantity"
                  value={reserveQuantity}
                  onChange={(e) => setReserveQuantity(e.target.value)}
                  min="1"
                  max={productToReserve?.quantity}
                />
                <Badge variant="outline" className="flex-shrink-0">
                  In stock: {productToReserve?.quantity || 0}
                </Badge>
              </div>
            </div>
            
            {productToReserve && (
              <div className="flex flex-col space-y-1.5">
                <Label>Total Amount</Label>
                <div className="p-2 border rounded-md bg-muted/50 font-medium">
                  ₱{((productToReserve?.price || 0) * (parseInt(reserveQuantity) || 0)).toFixed(2)}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsReserveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReserveProduct}>
              <BookmarkIcon className="mr-2 h-4 w-4" />
              Reserve Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 