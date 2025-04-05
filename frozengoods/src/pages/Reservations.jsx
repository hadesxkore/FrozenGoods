import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { db } from "@/firebase/config";
import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc, query, where, orderBy, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

import {
  Search,
  Filter,
  Calendar,
  ShoppingBag,
  Tag,
  CircleDollarSign,
  User,
  Clock,
  CheckCircle2,
  Trash2,
  CreditCard,
} from "lucide-react";

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [currentReservation, setCurrentReservation] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("Cash");
  const { currentUser } = useAuth();

  // Payment method options
  const PAYMENT_METHODS = {
    CASH: "Cash",
    GCASH: "GCash",
    PAYMAYA: "PayMaya"
  };

  // Fetch all reservations
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        const reservationsQuery = query(
          collection(db, "reservations"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(reservationsQuery);
        
        const reservationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));
        
        setReservations(reservationsData);
      } catch (error) {
        console.error("Error fetching reservations:", error);
        toast.error("Failed to load reservations");
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  // Filter reservations based on search term
  const filteredReservations = reservations.filter(reservation => 
    reservation.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open payment method dialog
  const openPaymentDialog = (reservation) => {
    setCurrentReservation(reservation);
    setSelectedPaymentMethod("Cash"); // Default to Cash
    setIsPaymentDialogOpen(true);
  };

  // Handle confirmation to convert reservation to sale
  const handleConfirmReservation = async () => {
    try {
      if (!currentReservation) return;
      
      // 1. Create a new sale transaction
      await addDoc(collection(db, "transactions"), {
        type: "sale",
        productId: currentReservation.productId,
        productName: currentReservation.productName,
        quantity: currentReservation.quantity,
        amount: currentReservation.amount,
        date: new Date(),
        notes: currentReservation.customerName || "Walk-in Customer",
        userName: currentUser.displayName || currentUser.email,
        userId: currentUser.uid,
        paymentMethod: selectedPaymentMethod
      });

      // 2. Delete the reservation
      await deleteDoc(doc(db, "reservations", currentReservation.id));
      
      // 3. Delete the inventory adjustment transaction for this reservation
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("reservationId", "==", currentReservation.id)
      );
      
      const transactionSnapshot = await getDocs(transactionsQuery);
      for (const doc of transactionSnapshot.docs) {
        await deleteDoc(doc.ref);
      }

      // 4. Update the UI by removing the reservation
      setReservations(prevReservations => 
        prevReservations.filter(r => r.id !== currentReservation.id)
      );

      toast.success("Reservation successfully converted to sale");
    } catch (error) {
      console.error("Error confirming reservation:", error);
      toast.error("Failed to process reservation");
    } finally {
      setIsPaymentDialogOpen(false);
      setCurrentReservation(null);
    }
  };

  // Handle deletion of reservation
  const handleDeleteReservation = async (reservationId) => {
    try {
      // Get the reservation details first
      const reservationToDelete = reservations.find(r => r.id === reservationId);
      if (!reservationToDelete) return;
      
      // 1. Get the current product details
      const productRef = doc(db, "products", reservationToDelete.productId);
      const productSnapshot = await getDoc(productRef);
      
      if (productSnapshot.exists()) {
        const productData = productSnapshot.data();
        
        // 2. Restore the quantity
        const newQuantity = productData.quantity + reservationToDelete.quantity;
        await updateDoc(productRef, {
          quantity: newQuantity
        });
        
        // 3. Add inventory transaction to record the restoration
        await addDoc(collection(db, "transactions"), {
          type: "inventory_adjustment",
          productId: reservationToDelete.productId,
          productName: reservationToDelete.productName,
          quantity: reservationToDelete.quantity, // Positive value to add back to inventory
          date: new Date(),
          notes: `Restored ${reservationToDelete.quantity} units from canceled reservation #${reservationId.slice(0, 8)}`,
          userId: currentUser.uid,
          userName: currentUser.displayName || currentUser.email
        });
      }
      
      // 4. Delete the reservation
      await deleteDoc(doc(db, "reservations", reservationId));
      
      // 5. Delete the original inventory adjustment transaction for this reservation
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("reservationId", "==", reservationId)
      );
      
      const transactionSnapshot = await getDocs(transactionsQuery);
      for (const doc of transactionSnapshot.docs) {
        await deleteDoc(doc.ref);
      }
      
      // 6. Update the UI
      setReservations(prevReservations => 
        prevReservations.filter(r => r.id !== reservationId)
      );
      
      toast.success("Reservation deleted successfully");
    } catch (error) {
      console.error("Error deleting reservation:", error);
      toast.error("Failed to delete reservation");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Reservations</h1>
        <p className="text-muted-foreground">
          Manage customer reservations for your frozen goods products.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            placeholder="Search by product or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 w-full"
          />
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Reserved Products
              </CardTitle>
              <CardDescription>
                {filteredReservations.length} {filteredReservations.length === 1 ? 'reservation' : 'reservations'} found
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
          ) : filteredReservations.length > 0 ? (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Reserved On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          {reservation.productName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {reservation.customerName || "Anonymous"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {reservation.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CircleDollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">₱{reservation.amount?.toFixed(2) || "0.00"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(reservation.createdAt, "MMM d, yyyy")}
                          <Clock className="h-3 w-3 ml-1" />
                          {format(reservation.createdAt, "h:mm a")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex items-center gap-1 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                            onClick={() => openPaymentDialog(reservation)}
                          >
                            <CreditCard className="h-3 w-3" />
                            <span>Continue</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteReservation(reservation.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
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
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No reservations found</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-md">
                {searchTerm 
                  ? "No reservations match your search criteria."
                  : "There are no active product reservations."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete Reservation</DialogTitle>
            <DialogDescription>
              Select a payment method to finalize this reservation as a sale.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {currentReservation && (
              <>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="product-name">Product</Label>
                  <div className="p-2 border rounded-md bg-muted/30">
                    {currentReservation.productName}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="customer-name">Customer</Label>
                  <div className="p-2 border rounded-md bg-muted/30">
                    {currentReservation.customerName || "Walk-in Customer"}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="quantity">Quantity</Label>
                    <div className="p-2 border rounded-md bg-muted/30">
                      {currentReservation.quantity}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <Label>Total Amount</Label>
                    <div className="p-2 border rounded-md bg-muted/30 font-medium">
                      ₱{currentReservation.amount?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select
                    value={selectedPaymentMethod}
                    onValueChange={setSelectedPaymentMethod}
                  >
                    <SelectTrigger id="payment-method">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PAYMENT_METHODS.CASH}>Cash</SelectItem>
                      <SelectItem value={PAYMENT_METHODS.GCASH}>GCash</SelectItem>
                      <SelectItem value={PAYMENT_METHODS.PAYMAYA}>PayMaya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmReservation}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirm Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 