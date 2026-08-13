import { useState, useEffect, useTransition } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  InputAdornment,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import PersonIcon from '@mui/icons-material/Person';
import PageHeader from '../../components/PageHeader.tsx';
import { apiClient } from '../../api/client.ts';
import { toast } from 'react-hot-toast';

interface ProductItem {
  _id: string;
  sku: string;
  name: string;
  sellingPrice: number;
  quantity: number;
  category?: string;
}

interface CartItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export default function POSTerminal() {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  // Modals & States
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [heldModalOpen, setHeldModalOpen] = useState(false);
  const [heldSales, setHeldSales] = useState<any[]>([]);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [receiptHistoryModalOpen, setReceiptHistoryModalOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lookupOrderNumber, setLookupOrderNumber] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Split Payment Inputs
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [cardAmount, setCardAmount] = useState<number>(0);
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [referenceNo, setReferenceNo] = useState<string>('');

  const handleFetchReceipt = async (orderNum: string) => {
    try {
      const res = await apiClient.get(`/pos/receipt/${orderNum}`);
      const rData = res.data?.data || res.data || res;
      setReceiptData(rData);
      setReceiptHistoryModalOpen(false);
    } catch {
      toast.error(`Receipt for order #${orderNum} not found.`);
    }
  };

  const handleOpenRecentReceipts = async () => {
    try {
      const { data } = await apiClient.get('/orders', {
        params: { channel: 'POS', limit: 20 },
      });
      const orderList = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setRecentOrders(orderList);
      setReceiptHistoryModalOpen(true);
    } catch {
      toast.error('Failed to load recent sales history.');
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchProducts = (query: string) => {
    startTransition(async () => {
      try {
        const { data } = await apiClient.get('/products', {
          params: { search: query },
        });
        const list: ProductItem[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.data)
            ? (data as any).data
            : [];

        if (query && query.trim() !== '') {
          const q = query.toLowerCase().trim();
          setProducts(
            list.filter(
              (p) =>
                p.name?.toLowerCase().includes(q) ||
                p.sku?.toLowerCase().includes(q) ||
                (p as any).barcode?.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q)
            )
          );
        } else {
          setProducts(list);
        }
      } catch {
        toast.error('Failed to load products.');
      }
    });
  };

  useEffect(() => {
    fetchProducts('');
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchProducts(val);
  };

  const addToCart = (product: ProductItem) => {
    if (product.quantity <= 0) {
      toast.error(`${product.name} is out of stock.`);
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.productId === product._id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const currentQty = updated[existingIndex].quantity;
        if (currentQty >= product.quantity) {
          toast.error(`Cannot exceed stock limit (${product.quantity}).`);
          return prev;
        }
        const newQty = currentQty + 1;
        updated[existingIndex].quantity = newQty;
        updated[existingIndex].total =
          (updated[existingIndex].unitPrice - updated[existingIndex].discount) * newQty;
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product._id,
            sku: product.sku,
            name: product.name,
            quantity: 1,
            unitPrice: product.sellingPrice,
            discount: 0,
            total: product.sellingPrice,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      (prev) =>
        prev
          .map((item) => {
            if (item.productId === productId) {
              const newQty = item.quantity + delta;
              if (newQty <= 0) return null;
              return {
                ...item,
                quantity: newQty,
                total: (item.unitPrice - item.discount) * newQty,
              };
            }
            return item;
          })
          .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const totalItemDiscounts = cart.reduce((acc, i) => acc + i.discount * i.quantity, 0);
  const taxableSubtotal = Math.max(0, subtotal - totalItemDiscounts - cartDiscount);
  const taxTotal = Number((taxableSubtotal * 0.07).toFixed(2));
  const grandTotal = Number((taxableSubtotal + taxTotal).toFixed(2));

  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty.');
      return;
    }
    setCashAmount(grandTotal);
    setCardAmount(0);
    setTransferAmount(0);
    setCheckoutModalOpen(true);
  };

  const handleCompleteCheckout = async () => {
    const totalProvided = Number((cashAmount + cardAmount + transferAmount).toFixed(2));
    if (totalProvided < grandTotal) {
      toast.error(`Payment amount ($${totalProvided}) is less than total due ($${grandTotal}).`);
      return;
    }

    const payments = [];
    if (cashAmount > 0) payments.push({ paymentMethod: 'CASH' as const, amount: cashAmount });
    if (cardAmount > 0)
      payments.push({
        paymentMethod: 'CARD' as const,
        amount: cardAmount,
        referenceNumber: referenceNo,
      });
    if (transferAmount > 0)
      payments.push({
        paymentMethod: 'BANK_TRANSFER' as const,
        amount: transferAmount,
        referenceNumber: referenceNo,
      });

    const checkoutPayload = {
      idempotencyKey: `POS-TX-${Date.now()}`,
      branchId: '000000000000000000000001',
      warehouseId: '000000000000000000000001',
      cashierId: 'CASHIER-01',
      cashierName: 'Alice Operator',
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      customerEmail: selectedCustomer?.email,
      items: cart,
      payments,
      cartDiscount,
      taxRate: 0.07,
    };

    try {
      if (isOffline) {
        // Save to offline queue storage
        const queue = JSON.parse(localStorage.getItem('pos_offline_queue') || '[]');
        queue.push(checkoutPayload);
        localStorage.setItem('pos_offline_queue', JSON.stringify(queue));
        toast.success('Offline transaction saved locally! Will sync when connection resumes.');
      } else {
        const { data } = await apiClient.post('/pos/checkout', checkoutPayload);
        const resObj = data.data || data;
        const createdOrderNumber = resObj.orderNumber;
        toast.success(`Checkout Complete! Order #${createdOrderNumber}`);

        // Fetch & display receipt modal automatically
        await handleFetchReceipt(createdOrderNumber);
      }

      setCart([]);
      setCartDiscount(0);
      setSelectedCustomer(null);
      setCheckoutModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Checkout failed.');
    }
  };

  const handleHoldCart = async () => {
    if (cart.length === 0) return;
    try {
      await apiClient.post('/pos/hold', {
        cashierId: 'CASHIER-01',
        cashierName: 'Alice Operator',
        branchId: '000000000000000000000001',
        cartItems: cart,
        customer: selectedCustomer,
      });
      toast.success('Cart parked successfully!');
      setCart([]);
    } catch {
      toast.error('Failed to park cart.');
    }
  };

  const handleFetchHeldSales = async () => {
    try {
      const { data } = await apiClient.get('/pos/held/000000000000000000000001');
      setHeldSales(data.data || []);
      setHeldModalOpen(true);
    } catch {
      toast.error('Failed to load held carts.');
    }
  };

  const handleResumeCart = async (holdId: string) => {
    try {
      const { data } = await apiClient.post(`/pos/resume/${holdId}`);
      setCart(data.data.cartItems || []);
      setHeldModalOpen(false);
      toast.success('Cart resumed!');
    } catch {
      toast.error('Failed to resume cart.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Point-of-Sale Terminal"
        subtitle="High-speed retail transaction cashier interface"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isOffline && (
              <Chip
                icon={<WifiOffIcon />}
                label="Offline Mode Active"
                color="warning"
                size="small"
              />
            )}
            <Button
              variant="outlined"
              startIcon={<PauseCircleIcon />}
              onClick={handleHoldCart}
              disabled={cart.length === 0}
            >
              Hold Cart
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<PlayCircleIcon />}
              onClick={handleFetchHeldSales}
            >
              Held Carts ({heldSales.length})
            </Button>
            <Button
              variant="outlined"
              color="info"
              startIcon={<ReceiptIcon />}
              onClick={handleOpenRecentReceipts}
            >
              Receipts & History
            </Button>
          </Box>
        }
      />

      <Grid container spacing={3}>
        {/* Left: Product Grid */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Scan barcode or search product name / SKU..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Paper>

          {isPending ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : products.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {searchQuery
                  ? `No products matching "${searchQuery}".`
                  : 'No products available in catalog.'}
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {products.map((p) => (
                <Grid item xs={12} sm={6} md={4} key={p._id}>
                  <Paper
                    sx={{
                      p: 2,
                      cursor: p.quantity > 0 ? 'pointer' : 'not-allowed',
                      opacity: p.quantity > 0 ? 1 : 0.6,
                      '&:hover': { boxShadow: p.quantity > 0 ? 4 : 1 },
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justify: 'space-between',
                    }}
                    onClick={() => addToCart(p)}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        SKU: {p.sku}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                        {p.name}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        mt: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                        ${(p.sellingPrice || 0).toFixed(2)}
                      </Typography>
                      <Chip
                        label={p.quantity > 0 ? `${p.quantity} in stock` : 'Out of Stock'}
                        size="small"
                        color={p.quantity > 0 ? 'success' : 'error'}
                      />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>

        {/* Right: Active Cart */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <PointOfSaleIcon color="primary" /> Current Cart ({cart.length})
              </Typography>
              <Chip
                icon={<PersonIcon />}
                label={selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
                color="info"
                variant="outlined"
                size="small"
              />
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: '420px', mb: 2 }}>
              {cart.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
                  No items in cart. Click products to add.
                </Typography>
              ) : (
                <List disablePadding>
                  {cart.map((item) => (
                    <ListItem
                      key={item.productId}
                      sx={{
                        px: 1,
                        py: 1,
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <ListItemText
                        primary={item.name}
                        secondary={`$${item.unitPrice.toFixed(2)} x ${item.quantity}`}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton size="small" onClick={() => updateQuantity(item.productId, -1)}>
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography
                          sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}
                        >
                          {item.quantity}
                        </Typography>
                        <IconButton size="small" onClick={() => updateQuantity(item.productId, 1)}>
                          <AddIcon fontSize="small" />
                        </IconButton>
                        <Typography sx={{ fontWeight: 'bold', width: '60px', textAlign: 'right' }}>
                          ${item.total.toFixed(2)}
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Calculations Summary */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography color="text.secondary">Subtotal</Typography>
                <Typography>${subtotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography color="text.secondary">Discounts</Typography>
                <Typography color="error">
                  -${(totalItemDiscounts + cartDiscount).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography color="text.secondary">Tax (7%)</Typography>
                <Typography>${taxTotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Total Due
                </Typography>
                <Typography variant="h5" color="primary.main" sx={{ fontWeight: 'bold' }}>
                  ${grandTotal.toFixed(2)}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
              sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
            >
              Pay ${grandTotal.toFixed(2)}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Checkout Split Payment Modal */}
      <Dialog
        open={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Split Payment & Tender Confirmation</DialogTitle>
        <DialogContent dividers>
          <Typography
            variant="h6"
            color="primary"
            align="center"
            sx={{ mb: 2, fontWeight: 'bold' }}
          >
            Amount Due: ${grandTotal.toFixed(2)}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                label="Cash ($)"
                type="number"
                fullWidth
                value={cashAmount}
                onChange={(e) => setCashAmount(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Card ($)"
                type="number"
                fullWidth
                value={cardAmount}
                onChange={(e) => setCardAmount(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Transfer ($)"
                type="number"
                fullWidth
                value={transferAmount}
                onChange={(e) => setTransferAmount(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Reference / Authorization No"
                fullWidth
                size="small"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="POS Terminal Card Slip # or Bank Ref"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutModalOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleCompleteCheckout}>
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Held Sales Dialog */}
      <Dialog open={heldModalOpen} onClose={() => setHeldModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Parked & Held Carts</DialogTitle>
        <DialogContent dividers>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Hold ID</TableCell>
                <TableCell>Cashier</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Subtotal</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {heldSales.map((h) => (
                <TableRow key={h.holdId}>
                  <TableCell>{h.holdId}</TableCell>
                  <TableCell>{h.cashierName}</TableCell>
                  <TableCell>{h.customerName || 'Walk-in'}</TableCell>
                  <TableCell>{h.cartItems.length} line items</TableCell>
                  <TableCell>${h.subtotal.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleResumeCart(h.holdId)}
                    >
                      Resume
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHeldModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Receipts History & Lookup Dialog */}
      <Dialog
        open={receiptHistoryModalOpen}
        onClose={() => setReceiptHistoryModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          <ReceiptIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
          Recent Receipts & Invoice Lookup
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Enter Order # (e.g. POS-2026-000001)"
              value={lookupOrderNumber}
              onChange={(e) => setLookupOrderNumber(e.target.value)}
            />
            <Button
              variant="contained"
              disabled={!lookupOrderNumber.trim()}
              onClick={() => handleFetchReceipt(lookupOrderNumber.trim())}
            >
              Lookup
            </Button>
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Recent POS Transactions
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order Number</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No recent POS orders found.
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((o) => (
                  <TableRow key={o.orderNumber}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{o.orderNumber}</TableCell>
                    <TableCell>{o.customerName || 'Walk-in'}</TableCell>
                    <TableCell>${(o.grandTotal || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip label={o.status || 'COMPLETED'} color="success" size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ReceiptIcon />}
                        onClick={() => handleFetchReceipt(o.orderNumber)}
                      >
                        View & Print Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptHistoryModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Digital Receipt Viewer Dialog */}
      {receiptData && (
        <Dialog
          open={Boolean(receiptData)}
          onClose={() => setReceiptData(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
            <ReceiptIcon color="primary" sx={{ fontSize: 32 }} />
            <br />
            {receiptData.businessName}
          </DialogTitle>
          <DialogContent dividers sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
            <Typography align="center" variant="caption" display="block">
              {receiptData.branchName}
            </Typography>
            <Typography align="center" variant="caption" display="block">
              Date: {new Date(receiptData.date).toLocaleString()}
            </Typography>
            <Typography align="center" variant="caption" display="block">
              Order: #{receiptData.receiptNumber}
            </Typography>
            <Divider sx={{ my: 1 }} />
            {receiptData.items.map((i: any, idx: number) => (
              <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">
                  {i.name} (x{i.qty})
                </Typography>
                <Typography variant="body2">${i.total.toFixed(2)}</Typography>
              </Box>
            ))}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2">${receiptData.subtotal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Tax:</Typography>
              <Typography variant="body2">${receiptData.tax.toFixed(2)}</Typography>
            </Box>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', mt: 1 }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                TOTAL:
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                ${receiptData.total.toFixed(2)}
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Typography align="center" variant="caption" display="block">
              {receiptData.footer}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReceiptData(null)}>Close</Button>
            <Button variant="contained" onClick={() => window.print()}>
              Print Receipt
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
