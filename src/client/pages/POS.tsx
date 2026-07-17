import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChangeEvent, FormEvent, SyntheticEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client.ts';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Tabs,
  Tab,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ScanIcon from '@mui/icons-material/QrCodeScanner';
import CheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import type { Product, TransactionItem, Transaction } from '../../shared/types.js';
import { useAuthStore } from '../store/auth.ts';
import { toast } from 'react-hot-toast';
import {
  queueOfflineTransaction,
  getPendingQueueCount,
  runSync,
  on as onSyncEvent,
} from '../offline/syncEngine.ts';

type CartItem = TransactionItem;

const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await apiClient.get<Product[]>('/products');
  return data;
};

export default function POS() {
  const queryClient = useQueryClient();
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MOBILE' | 'SPLIT'>('CASH');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(0);
  const { user, accessToken } = useAuthStore();

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const syncOfflineTransactions = useCallback(async () => {
    if (!accessToken) return;
    const count = await getPendingQueueCount();
    if (count === 0) return;
    toast.loading(`Syncing ${count} offline transactions...`, { id: 'offline-sync' });
    try {
      const res = await runSync(accessToken);
      toast.dismiss('offline-sync');
      if (res.synced > 0) {
        toast.success(`Synced ${res.synced} transactions successfully!`);
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }
    } catch (err) {
      toast.dismiss('offline-sync');
      console.error('Offline sync failed:', err);
    }
  }, [accessToken, queryClient]);

  useEffect(() => {
    getPendingQueueCount().then(setOfflineCount);

    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineTransactions();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsub = onSyncEvent('pending:change', (payload) => {
      if (payload.pendingCount !== undefined) {
        setOfflineCount(payload.pendingCount);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsub();
    };
  }, [syncOfflineTransactions]);

  // Mutation to handle transaction checkout
  const checkoutMutation = useMutation({
    mutationFn: async (transactionData: unknown) => {
      const { data } = await apiClient.post<Transaction>('/transactions', transactionData);
      return data;
    },
    onSuccess: () => {
      toast.success('Transaction Completed Successfully!');
      setCart([]);
      setDiscount(0);
      // Invalidate queries to fetch updated stock quantities
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: Error) => {
      toast.error(`Checkout failed: ${err.message || 'Error occurred'}`);
    },
  });

  // Unique categories list
  const categories = ['All', ...Array.from(new Set(products.map((p: Product) => p.category)))];

  // Filter products by search and category
  const filteredProducts = products.filter((p: Product) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory && p.isActive;
  });

  // Handle adding product to cart
  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      toast.error(`${product.name} is out of stock!`);
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.productId === (product.id || product._id));
      if (existing) {
        if (existing.quantity >= (product.quantity || 0)) {
          toast.error(`Cannot add more. Only ${product.quantity} units available.`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.productId === (product.id || product._id)
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        );
      }
      const newItem: CartItem = {
        productId: product.id || product._id || '',
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        price: product.price || 0,
        discount: 0,
        total: product.price || 0,
      };
      return [...prevCart, newItem];
    });
  };

  // Adjust item quantity in cart
  const adjustQuantity = (productId: string, amount: number) => {
    const product = products.find((p: Product) => p.id === productId);
    if (!product) return;

    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.productId !== productId) return item;
          const newQty = item.quantity + amount;
          if (newQty > product.quantity) {
            toast.error(`Only ${product.quantity} units in inventory.`);
            return item;
          }
          return {
            ...item,
            quantity: newQty,
            total: newQty * item.price,
          };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // Remove item from cart
  const removeItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  };

  // Barcode simulation handler
  const handleBarcodeSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matchedProduct = products.find(
      (p: Product) => p.barcode === barcodeInput || p.sku === barcodeInput
    );

    if (matchedProduct) {
      addToCart(matchedProduct);
      toast.success(`Scanned: ${matchedProduct.name}`);
      setBarcodeInput('');
    } else {
      toast.error(`No item matching barcode "${barcodeInput}"`);
    }
  };

  // Computations
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 0.08; // 8% sales tax
  const tax = subtotal * taxRate;
  const total = Math.max(0, subtotal + tax - discount);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty.');
      return;
    }

    const payload = {
      items: cart,
      paymentMethod,
      discount,
      tax,
      subtotal,
      total,
      cashierName: user?.username || 'Jane Doe',
      branchName: 'Main HQ',
    };

    if (!navigator.onLine) {
      queueOfflineTransaction({
        id: `off-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        transactionNumber: `TX-OFF-${Date.now().toString().slice(-6)}`,
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.price,
          lineTotal: item.total,
        })),
        subtotal,
        tax,
        discount,
        total,
        paymentMethod,
        cashierName: user?.username || 'Jane Doe',
        branchName: 'Main HQ',
        capturedAt: new Date().toISOString(),
      }).then(async () => {
        const count = await getPendingQueueCount();
        setOfflineCount(count);
        setCart([]);
        setDiscount(0);
        toast.success('Offline checkout stored in IndexedDB successfully! Will sync when online.');
      });
      return;
    }

    checkoutMutation.mutate(payload);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {!isOnline && (
        <Box sx={{ bgcolor: 'warning.dark', color: 'warning.contrastText', p: 1.5, mb: 3, borderRadius: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            ⚠️ Device is currently Offline. Checkout operations will be queued locally.
          </Typography>
          {offlineCount > 0 && (
            <Chip label={`${offlineCount} transactions pending sync`} color="secondary" size="small" sx={{ fontWeight: 700 }} />
          )}
        </Box>
      )}
      <Grid container spacing={3}>
        {/* Product Catalog Pane */}
        <Grid item xs={12} lg={8}>
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                POS Checkout
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Search products, scan barcodes, and cash out customer carts.
              </Typography>
            </Box>

            {/* Simulated Barcode Scanner Bar */}
            <Box component="form" onSubmit={handleBarcodeSubmit} sx={{ display: 'flex', gap: 1 }}>
              <TextField
                inputRef={barcodeInputRef}
                label="Simulated Barcode Scan"
                variant="outlined"
                size="small"
                value={barcodeInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setBarcodeInput(e.target.value)}
                placeholder="Type '40012011'..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ScanIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 220 }}
              />
              <Button type="submit" variant="contained" color="secondary" size="small">
                Scan
              </Button>
            </Box>
          </Box>

          {/* Search and Category Tabs */}
          <Card className="glass-panel" sx={{ mb: 3 }}>
            <CardContent sx={{ p: '16px !important' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    placeholder="Search by name, SKU or barcode..."
                    size="small"
                    value={searchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={7}>
                  <Tabs
                    value={selectedCategory}
                    onChange={(_: SyntheticEvent, val: string) => setSelectedCategory(val)}
                    variant="scrollable"
                    scrollButtons="auto"
                    textColor="secondary"
                    indicatorColor="secondary"
                  >
                    {categories.map((cat) => (
                      <Tab
                        key={cat}
                        label={cat}
                        value={cat}
                        sx={{ fontWeight: 600, fontSize: '0.85rem' }}
                      />
                    ))}
                  </Tabs>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <Grid container spacing={2}>
            {filteredProducts.length === 0 ? (
              <Grid item xs={12}>
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No products found matching filters.
                  </Typography>
                </Box>
              </Grid>
            ) : (
              filteredProducts.map((p: Product) => (
                <Grid item xs={12} sm={6} md={4} key={p.id}>
                  <Card
                    onClick={() => addToCart(p)}
                    sx={{
                      cursor: 'pointer',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:active': { transform: 'scale(0.98)' },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip
                          label={p.category}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            bgcolor: 'rgba(255,255,255,0.03)',
                          }}
                        />
                        <Typography
                          variant="caption"
                          color={p.quantity <= p.lowStockAlert ? 'error.main' : 'text.secondary'}
                          sx={{ fontWeight: 700 }}
                        >
                          {p.quantity} in stock
                        </Typography>
                      </Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.2 }}
                      >
                        {p.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 1.5 }}
                      >
                        SKU: {p.sku}
                      </Typography>
                      <Typography
                        variant="h6"
                        color="primary.light"
                        sx={{ fontWeight: 800, mt: 'auto' }}
                      >
                        ${p.price.toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Grid>

        {/* Checkout Cart Pane */}
        <Grid item xs={12} lg={4}>
          <Card
            className="glass-panel"
            sx={{
              position: 'sticky',
              top: 88,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 120px)',
            }}
          >
            <Box
              sx={{
                p: 2.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Shopping Cart
              </Typography>
              <Chip
                label={`${cart.reduce((sum, i) => sum + i.quantity, 0)} Items`}
                size="small"
                color="primary"
              />
            </Box>
            <Divider />

            {/* Cart List */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1, py: 1, minHeight: 200 }}>
              {cart.length === 0 ? (
                <Box sx={{ py: 8, textCol: 'center', textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Cart is empty. Click catalog items or scan a barcode to add.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {cart.map((item) => (
                    <ListItem
                      key={item.productId}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          color="error"
                          size="small"
                          onClick={() => removeItem(item.productId)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                      sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', py: 1.5 }}
                    >
                      <ListItemText
                        primary={item.productName}
                        primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                        secondaryTypographyProps={{ component: 'div' }}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              ${item.price.toFixed(2)} ea
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                sx={{ p: 0.2 }}
                                onClick={() => adjustQuantity(item.productId, -1)}
                              >
                                <RemoveIcon fontSize="inherit" />
                              </IconButton>
                              <Typography variant="body2" sx={{ fontWeight: 700, px: 0.5 }}>
                                {item.quantity}
                              </Typography>
                              <IconButton
                                size="small"
                                sx={{ p: 0.2 }}
                                onClick={() => adjustQuantity(item.productId, 1)}
                              >
                                <AddIcon fontSize="inherit" />
                              </IconButton>
                            </Box>
                          </Box>
                        }
                      />
                      <Typography variant="subtitle2" sx={{ mr: 2, fontWeight: 700 }}>
                        ${item.total.toFixed(2)}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            <Divider />

            {/* Calculations & Checkout */}
            <Box sx={{ p: 2.5, bgcolor: 'rgba(255, 255, 255, 0.01)' }}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    label="Discount ($)"
                    type="number"
                    size="small"
                    value={discount || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setDiscount(Math.max(0, Number(e.target.value)))
                    }
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    select
                    label="Payment Method"
                    size="small"
                    value={paymentMethod}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setPaymentMethod(e.target.value as 'CASH' | 'CARD' | 'MOBILE' | 'SPLIT')
                    }
                    fullWidth
                  >
                    <MenuItem value="CASH">Cash</MenuItem>
                    <MenuItem value="CARD">Credit/Debit Card</MenuItem>
                    <MenuItem value="MOBILE">Mobile Money</MenuItem>
                    <MenuItem value="SPLIT">Split Payment</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ${subtotal.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Sales Tax (8%)
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ${tax.toFixed(2)}
                </Typography>
              </Box>
              {discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="error">
                    Discount
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.light' }}>
                    -${discount.toFixed(2)}
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Total
                </Typography>
                <Typography variant="h5" color="secondary.light" sx={{ fontWeight: 800 }}>
                  ${total.toFixed(2)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="secondary"
                fullWidth
                size="large"
                startIcon={<CheckoutIcon />}
                onClick={handleCheckout}
                disabled={cart.length === 0 || checkoutMutation.isPending}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                }}
              >
                {checkoutMutation.isPending ? 'Processing...' : 'Complete Checkout'}
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
