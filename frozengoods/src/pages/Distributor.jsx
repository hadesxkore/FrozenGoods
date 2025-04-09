import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/config";
import { collection, query, getDocs, doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Search, Tag, DollarSign, Edit, AlertCircle } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function Distributor() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [distributorPrice, setDistributorPrice] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsQuery = query(collection(db, "products"));
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
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

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than or equal to max visible pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      if (currentPage > 3) {
        pageNumbers.push('...');
      }
      
      // Show pages around current page
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pageNumbers.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pageNumbers.push('...');
      }
      
      // Always show last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  const handleUpdateDistributorPrice = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct || !distributorPrice) {
      toast.error("Please enter a distributor price");
      return;
    }

    try {
      setLoading(true);
      
      const productRef = doc(db, "products", selectedProduct.id);
      await updateDoc(productRef, {
        distributorPrice: parseFloat(distributorPrice),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid
      });

      // Update local state
      setProducts(products.map(product => {
        if (product.id === selectedProduct.id) {
          return {
            ...product,
            distributorPrice: parseFloat(distributorPrice)
          };
        }
        return product;
      }));

      setIsDialogOpen(false);
      setDistributorPrice("");
      setSelectedProduct(null);
      toast.success("Distributor price updated successfully");
    } catch (error) {
      console.error("Error updating distributor price:", error);
      toast.error("Failed to update distributor price");
    } finally {
      setLoading(false);
    }
  };

  const calculatePriceDifference = (product) => {
    if (!product.distributorPrice || !product.price) return null;
    return product.price - product.distributorPrice;
  };

  const getPriceDifferenceBadge = (difference) => {
    if (difference === null) return null;
    
    if (difference > 0) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          +₱{difference.toFixed(2)}
        </Badge>
      );
    } else if (difference < 0) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          -₱{Math.abs(difference).toFixed(2)}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          ₱0.00
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Distributor Prices</h1>
          <p className="text-muted-foreground">
            Manage and compare distributor prices with your selling prices.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            View all products and their distributor prices. Add or update distributor prices to compare with your selling prices.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  {currentProducts.map((product) => {
                    const priceDifference = calculatePriceDifference(product);
                    return (
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
                          {getPriceDifferenceBadge(priceDifference)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedProduct(product);
                              setDistributorPrice(product.distributorPrice?.toString() || "");
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="border-t bg-background py-4">
                  <div className="flex flex-col items-center gap-2">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          />
                        </PaginationItem>
                        
                        {getPageNumbers().map((pageNum, index) => (
                          <PaginationItem key={index}>
                            {pageNum === '...' ? (
                              <PaginationEllipsis />
                            ) : (
                              <PaginationLink
                                onClick={() => handlePageChange(pageNum)}
                                isActive={currentPage === pageNum}
                              >
                                {pageNum}
                              </PaginationLink>
                            )}
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                    
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Distributor Price Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProduct?.distributorPrice ? "Update" : "Add"} Distributor Price
            </DialogTitle>
            <DialogDescription>
              Enter the distributor's price for {selectedProduct?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateDistributorPrice}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Product</Label>
                <Input
                  value={selectedProduct?.name || ""}
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label>Your Price</Label>
                <Input
                  value={selectedProduct?.price ? `₱${selectedProduct.price.toFixed(2)}` : ""}
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="distributorPrice">Distributor Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="distributorPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter distributor price"
                    value={distributorPrice}
                    onChange={(e) => setDistributorPrice(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
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
  );
} 