import { useState, useEffect, useTransition, useRef } from 'react';
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
import PaymentsIcon from '@mui/icons-material/Payments';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PageHeader from '../../components/PageHeader.tsx';
import { apiClient } from '../../api/client.ts';
import { toast } from 'react-hot-toast';
import { useRegionalSettings } from '../../hooks/useRegionalSettings.js';
import { CurrencySelector } from '../../components/CurrencySelector.tsx';

interface ProductItem {
  _id: string;
  sku: string;
  name: string;
  sellingPrice: number;
  retailPrice?: number;
  wholesalePrice?: number;
  quantity: number;
  category?: string;
  currency?: string;
}

interface CartItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  priceTier: 'RETAIL' | 'WHOLESALE';
  retailPrice: number;
  wholesalePrice: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export default function POSTerminal() {
  const { formatAmount, currencySymbol, baseCurrency, activeCurrency, convertAmount } =
    useRegionalSettings();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [activePricingTier, setActivePricingTier] = useState<'RETAIL' | 'WHOLESALE'>('RETAIL');
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [mobileView, setMobileView] = useState<'catalog' | 'cart'>('catalog');

  // Modals & States
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [heldModalOpen, setHeldModalOpen] = useState(false);
  const [heldSales, setHeldSales] = useState<any[]>([]);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [receiptHistoryModalOpen, setReceiptHistoryModalOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lookupOrderNumber, setLookupOrderNumber] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Manual Tender Inputs
  const [selectedTender, setSelectedTender] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const addingLockRef = useRef<{ [key: string]: number }>({});

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

  const handleSwitchGlobalTier = (newTier: 'RETAIL' | 'WHOLESALE') => {
    setActivePricingTier(newTier);
    if (cart.length > 0) {
      setCart((prev) =>
        prev.map((item) => {
          const newUnitPrice = newTier === 'WHOLESALE' ? item.wholesalePrice : item.retailPrice;
          return {
            ...item,
            priceTier: newTier,
            unitPrice: newUnitPrice,
            total: (newUnitPrice - item.discount) * item.quantity,
          };
        })
      );
      toast.success(`Switched active cart to ${newTier} pricing.`);
    }
  };

  const addToCart = (product: ProductItem) => {
    if (product.quantity <= 0) {
      toast.error(`${product.name} is out of stock.`);
      return;
    }

    const now = Date.now();
    const lockKey = `${product._id}-${activePricingTier}`;
    if (addingLockRef.current[lockKey] && now - addingLockRef.current[lockKey] < 280) {
      return; // Debounce rapid click multiplier (prevents x2, x3, x4 jump)
    }
    addingLockRef.current[lockKey] = now;

    const retPrice = Number(
      product.retailPrice && product.retailPrice > 0
        ? product.retailPrice
        : product.sellingPrice || 0
    );
    const whoPrice = Number(
      product.wholesalePrice && product.wholesalePrice > 0 ? product.wholesalePrice : retPrice
    );
    const chosenPrice = activePricingTier === 'WHOLESALE' ? whoPrice : retPrice;

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === product._id && i.priceTier === activePricingTier
      );
      if (existingIndex > -1) {
        const currentItem = prev[existingIndex];
        if (currentItem.quantity >= product.quantity) {
          toast.error(`Cannot exceed stock limit (${product.quantity}).`);
          return prev;
        }
        const updated = [...prev];
        const newQty = currentItem.quantity + 1;
        updated[existingIndex] = {
          ...currentItem,
          quantity: newQty,
          total: (currentItem.unitPrice - currentItem.discount) * newQty,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product._id,
            sku: product.sku,
            name: product.name,
            quantity: 1,
            priceTier: activePricingTier,
            retailPrice: retPrice,
            wholesalePrice: whoPrice,
            unitPrice: chosenPrice,
            discount: 0,
            total: chosenPrice,
          },
        ];
      }
    });
  };

  const toggleItemTier = (productId: string, currentTier: 'RETAIL' | 'WHOLESALE') => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId && item.priceTier === currentTier) {
          const nextTier: 'RETAIL' | 'WHOLESALE' =
            currentTier === 'RETAIL' ? 'WHOLESALE' : 'RETAIL';
          const newUnitPrice = nextTier === 'WHOLESALE' ? item.wholesalePrice : item.retailPrice;
          return {
            ...item,
            priceTier: nextTier,
            unitPrice: newUnitPrice,
            total: (newUnitPrice - item.discount) * item.quantity,
          };
        }
        return item;
      })
    );
  };

  const updateQuantity = (productId: string, priceTier: 'RETAIL' | 'WHOLESALE', delta: number) => {
    setCart(
      (prev) =>
        prev
          .map((item) => {
            if (item.productId === productId && item.priceTier === priceTier) {
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

  const removeFromCart = (productId: string, priceTier: 'RETAIL' | 'WHOLESALE') => {
    setCart((prev) =>
      prev.filter((i) => !(i.productId === productId && i.priceTier === priceTier))
    );
  };

  // Calculations (in base currency)
  const subtotal = cart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const totalItemDiscounts = cart.reduce((acc, i) => acc + i.discount * i.quantity, 0);
  const totalWholesaleSavings = cart.reduce((acc, i) => {
    if (i.priceTier === 'WHOLESALE' && i.retailPrice > i.wholesalePrice) {
      return acc + (i.retailPrice - i.wholesalePrice) * i.quantity;
    }
    return acc;
  }, 0);
  const taxableSubtotal = Math.max(0, subtotal - totalItemDiscounts - cartDiscount);
  const taxTotal = Number((taxableSubtotal * 0.07).toFixed(2));
  const grandTotal = Number((taxableSubtotal + taxTotal).toFixed(2));

  const displayGrandTotal = convertAmount(grandTotal, baseCurrency, activeCurrency);

  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty.');
      return;
    }
    const currentTotal = Number(displayGrandTotal.toFixed(2));
    setSelectedTender('CASH');
    setCashTendered(currentTotal);
    setReferenceNo('');
    setCheckoutModalOpen(true);
  };

  const handleCompleteCheckout = async () => {
    const currentDisplayTotal = Number(
      convertAmount(grandTotal, baseCurrency, activeCurrency).toFixed(2)
    );
    if (
      selectedTender === 'CASH' &&
      Math.round(cashTendered * 100) < Math.round(currentDisplayTotal * 100)
    ) {
      toast.error(
        `Cash tendered (${formatAmount(cashTendered, { currency: activeCurrency, convert: false })}) is less than total due (${formatAmount(grandTotal)}).`
      );
      return;
    }

    const amountTenderedInBase =
      selectedTender === 'CASH'
        ? convertAmount(cashTendered, activeCurrency, baseCurrency)
        : grandTotal;

    const checkoutPayload = {
      idempotencyKey: `POS-TX-${Date.now()}`,
      branchId: '000000000000000000000001',
      warehouseId: '000000000000000000000001',
      cashierId: 'CASHIER-01',
      cashierName: 'Alice Operator',
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      customerEmail: selectedCustomer?.email,
      pricingMode: activePricingTier,
      items: cart,
      paymentMethod: selectedTender,
      amountTendered: amountTenderedInBase,
      referenceNumber: referenceNo.trim() || undefined,
      payments: [
        {
          paymentMethod: selectedTender,
          amount: grandTotal,
          referenceNumber: referenceNo.trim() || undefined,
        },
      ],
      cartDiscount,
      taxRate: 0.07,
      currency: baseCurrency,
    };

    setIsSubmittingPayment(true);
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

      // Refresh product stock live on the cashier interface
      await fetchProducts(searchQuery);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Checkout failed.');
    } finally {
      setIsSubmittingPayment(false);
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
    <Box sx={{ p: { xs: 0, sm: 1 }, pb: { xs: cart.length > 0 ? 10 : 2, md: 2 } }}>
      <PageHeader
        title="Point-of-Sale Terminal"
        subtitle="High-speed retail transaction cashier interface"
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <CurrencySelector size="small" />
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

      {/* Mobile Catalog vs Cart Segmented Toggle */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, mb: 2, gap: 1 }}>
        <Button
          fullWidth
          variant={mobileView === 'catalog' ? 'contained' : 'outlined'}
          onClick={() => setMobileView('catalog')}
          sx={{ fontWeight: 700, py: 1 }}
        >
          Catalog ({products.length})
        </Button>
        <Button
          fullWidth
          variant={mobileView === 'cart' ? 'contained' : 'outlined'}
          color="primary"
          startIcon={<PointOfSaleIcon />}
          onClick={() => setMobileView('cart')}
          sx={{ fontWeight: 700, py: 1 }}
        >
          Cart ({cart.length}) • {formatAmount(grandTotal)}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Left: Product Grid */}
        <Grid
          item
          xs={12}
          md={7}
          sx={{ display: { xs: mobileView === 'catalog' ? 'block' : 'none', md: 'block' } }}
        >
          {/* Global Pricing Mode Selector */}
          <Paper
            sx={{
              p: 1.5,
              mb: 2,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              background:
                activePricingTier === 'WHOLESALE'
                  ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.12) 0%, rgba(79, 70, 229, 0.08) 100%)'
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
              border: '1.5px solid',
              borderColor: activePricingTier === 'WHOLESALE' ? 'secondary.main' : 'primary.main',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Customer Sales Tier:
              </Typography>
              <Chip
                label={
                  activePricingTier === 'WHOLESALE' ? '📦 WHOLESALE ACTIVE' : '🏷️ RETAIL ACTIVE'
                }
                color={activePricingTier === 'WHOLESALE' ? 'secondary' : 'primary'}
                size="small"
                sx={{ fontWeight: 800, fontSize: '0.75rem' }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={activePricingTier === 'RETAIL' ? 'contained' : 'outlined'}
                color="primary"
                size="small"
                onClick={() => handleSwitchGlobalTier('RETAIL')}
                sx={{ fontWeight: 700, px: 2, borderRadius: 1.5 }}
              >
                🏷️ Retail Customer
              </Button>
              <Button
                variant={activePricingTier === 'WHOLESALE' ? 'contained' : 'outlined'}
                color="secondary"
                size="small"
                onClick={() => handleSwitchGlobalTier('WHOLESALE')}
                sx={{ fontWeight: 700, px: 2, borderRadius: 1.5 }}
              >
                📦 Wholesale Customer
              </Button>
            </Box>
          </Paper>

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
              {products.map((p) => {
                const retailAmt = p.retailPrice ?? p.sellingPrice ?? 0;
                const wholesaleAmt = p.wholesalePrice != null ? p.wholesalePrice : retailAmt;
                const activeAmt = activePricingTier === 'WHOLESALE' ? wholesaleAmt : retailAmt;

                return (
                  <Grid item xs={12} sm={6} md={4} key={p._id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        cursor: p.quantity > 0 ? 'pointer' : 'not-allowed',
                        opacity: p.quantity > 0 ? 1 : 0.55,
                        borderRadius: '16px',
                        background:
                          'linear-gradient(145deg, rgba(20, 26, 44, 0.75) 0%, rgba(11, 15, 26, 0.9) 100%)',
                        border: '1px solid',
                        borderColor:
                          activePricingTier === 'WHOLESALE'
                            ? 'rgba(168, 85, 247, 0.35)'
                            : 'rgba(59, 130, 246, 0.35)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                        userSelect: 'none',
                        '&:hover': {
                          transform: p.quantity > 0 ? 'translateY(-2px)' : 'none',
                          boxShadow:
                            p.quantity > 0
                              ? activePricingTier === 'WHOLESALE'
                                ? '0 10px 24px rgba(168, 85, 247, 0.25)'
                                : '0 10px 24px rgba(59, 130, 246, 0.25)'
                              : 'none',
                          borderColor:
                            activePricingTier === 'WHOLESALE'
                              ? 'rgba(168, 85, 247, 0.7)'
                              : 'rgba(59, 130, 246, 0.7)',
                        },
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                      onClick={() => addToCart(p)}
                    >
                      <Box>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontWeight: 600,
                              letterSpacing: '0.02em',
                            }}
                          >
                            SKU: {p.sku}
                          </Typography>
                          <Chip
                            label={
                              p.quantity > 5
                                ? `${p.quantity} in stock`
                                : p.quantity > 0
                                  ? `Only ${p.quantity} left`
                                  : 'Out of Stock'
                            }
                            size="small"
                            color={
                              p.quantity > 5 ? 'success' : p.quantity > 0 ? 'warning' : 'error'
                            }
                            sx={{
                              fontSize: '0.68rem',
                              height: '20px',
                              fontWeight: 800,
                              borderRadius: '6px',
                            }}
                          />
                        </Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 800, lineHeight: 1.25, color: '#f8fafc' }}
                        >
                          {p.name}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 2 }}>
                        {/* Dual-price display */}
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            mb: 1.5,
                            p: 1.25,
                            borderRadius: '10px',
                            bgcolor: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                          }}
                        >
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{
                                color:
                                  activePricingTier === 'RETAIL'
                                    ? 'primary.main'
                                    : 'text.secondary',
                                display: 'block',
                                fontSize: '0.7rem',
                                fontWeight: activePricingTier === 'RETAIL' ? 800 : 500,
                              }}
                            >
                              Retail {activePricingTier === 'RETAIL' ? '✓' : ''}
                            </Typography>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: activePricingTier === 'RETAIL' ? 900 : 600,
                                color:
                                  activePricingTier === 'RETAIL'
                                    ? 'primary.main'
                                    : 'text.secondary',
                              }}
                            >
                              {formatAmount(retailAmt, {
                                fromCurrency: p.currency || baseCurrency,
                                currency: activeCurrency,
                              })}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography
                              variant="caption"
                              sx={{
                                color:
                                  activePricingTier === 'WHOLESALE'
                                    ? 'secondary.main'
                                    : 'text.secondary',
                                display: 'block',
                                fontSize: '0.7rem',
                                fontWeight: activePricingTier === 'WHOLESALE' ? 800 : 500,
                              }}
                            >
                              Wholesale {activePricingTier === 'WHOLESALE' ? '✓' : ''}
                            </Typography>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: activePricingTier === 'WHOLESALE' ? 900 : 600,
                                color:
                                  activePricingTier === 'WHOLESALE'
                                    ? 'secondary.main'
                                    : 'text.secondary',
                              }}
                            >
                              {formatAmount(wholesaleAmt, {
                                fromCurrency: p.currency || baseCurrency,
                                currency: activeCurrency,
                              })}
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Chip
                            label={`+ Add ${activePricingTier === 'WHOLESALE' ? 'Wholesale' : 'Retail'} (${formatAmount(activeAmt)})`}
                            size="small"
                            color={activePricingTier === 'WHOLESALE' ? 'secondary' : 'primary'}
                            sx={{
                              fontSize: '0.72rem',
                              height: '24px',
                              fontWeight: 800,
                              borderRadius: '8px',
                            }}
                          />
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Grid>

        {/* Right: Active Cart */}
        <Grid
          item
          xs={12}
          md={5}
          sx={{ display: { xs: mobileView === 'cart' ? 'block' : 'none', md: 'block' } }}
        >
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
                      key={`${item.productId}-${item.priceTier}`}
                      sx={{
                        px: 1,
                        py: 1,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <ListItemText
                        disableTypography
                        primary={
                          <Box
                            sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {item.name}
                            </Typography>
                            <Chip
                              label={item.priceTier === 'WHOLESALE' ? '📦 WHOLESALE' : '🏷️ RETAIL'}
                              size="small"
                              color={item.priceTier === 'WHOLESALE' ? 'secondary' : 'primary'}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleItemTier(item.productId, item.priceTier);
                              }}
                              clickable
                              title="Click to switch price tier for this item"
                              sx={{
                                fontSize: '0.65rem',
                                height: '20px',
                                fontWeight: 800,
                                cursor: 'pointer',
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mt: 0.5,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {formatAmount(item.unitPrice)} × {item.quantity}
                            </Typography>
                            {item.priceTier === 'WHOLESALE' &&
                              item.retailPrice > item.wholesalePrice && (
                                <Chip
                                  label={`Saved ${formatAmount((item.retailPrice - item.wholesalePrice) * item.quantity)}`}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ height: '18px', fontSize: '0.65rem', fontWeight: 700 }}
                                />
                              )}
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item.productId, item.priceTier, -1)}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography
                          sx={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}
                        >
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item.productId, item.priceTier, 1)}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                        <Typography sx={{ fontWeight: 'bold', width: '80px', textAlign: 'right' }}>
                          {formatAmount(item.total)}
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeFromCart(item.productId, item.priceTier)}
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
                <Typography>{formatAmount(subtotal)}</Typography>
              </Box>
              {totalWholesaleSavings > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ color: 'success.main', fontWeight: 600 }}>
                    Wholesale Savings
                  </Typography>
                  <Typography sx={{ color: 'success.main', fontWeight: 700 }}>
                    -{formatAmount(totalWholesaleSavings)}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography color="text.secondary">Discounts</Typography>
                <Typography color="error">
                  -{formatAmount(totalItemDiscounts + cartDiscount)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography color="text.secondary">Tax (7%)</Typography>
                <Typography>{formatAmount(taxTotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Total Due
                </Typography>
                <Typography variant="h5" color="primary.main" sx={{ fontWeight: 'bold' }}>
                  {formatAmount(grandTotal)}
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
              Pay {formatAmount(grandTotal)}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Mobile Sticky Bottom Summary Bar */}
      {cart.length > 0 && mobileView === 'catalog' && (
        <Paper
          elevation={8}
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            p: 1.5,
            px: 2,
            bgcolor: '#0f131f',
            borderTop: '1px solid rgba(139, 92, 246, 0.3)',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.6)',
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              {cart.length} item{cart.length > 1 ? 's' : ''} in cart
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.light' }}>
              {formatAmount(grandTotal)}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setMobileView('cart')}
            sx={{ fontWeight: 700, px: 2.5 }}
          >
            Review Cart & Pay
          </Button>
        </Paper>
      )}

      {/* Checkout Split Payment Modal */}
      <Dialog
        open={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            maxWidth: '520px !important',
            width: '100%',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            p: { xs: 1.5, sm: 2 },
            m: { xs: 1.5, sm: 3 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>
          POS Tender Confirmation
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <Chip
              label={
                activePricingTier === 'WHOLESALE'
                  ? '📦 WHOLESALE TRANSACTION'
                  : '🏷️ RETAIL TRANSACTION'
              }
              color={activePricingTier === 'WHOLESALE' ? 'secondary' : 'primary'}
              sx={{ fontWeight: 800, fontSize: '0.8rem' }}
            />
          </Box>
          <Typography
            variant="h4"
            color="success.main"
            align="center"
            sx={{ mb: 2, fontWeight: 'bold' }}
          >
            {formatAmount(grandTotal)}
          </Typography>

          {/* Tender Selector */}
          <Typography
            variant="caption"
            sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1 }}
          >
            SELECT TENDER METHOD
          </Typography>
          <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
            <Grid item xs={4}>
              <Paper
                onClick={() => setSelectedTender('CASH')}
                sx={{
                  p: 1.5,
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  border:
                    selectedTender === 'CASH'
                      ? '2px solid #10b981'
                      : '1px solid rgba(255,255,255,0.1)',
                  bgcolor:
                    selectedTender === 'CASH'
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'rgba(255,255,255,0.02)',
                  color: selectedTender === 'CASH' ? '#34d399' : 'inherit',
                  transition: 'all 0.2s',
                  userSelect: 'none',
                }}
              >
                <PaymentsIcon sx={{ fontSize: 26, mb: 0.5 }} />
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  Cash
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper
                onClick={() => setSelectedTender('CARD')}
                sx={{
                  p: 1.5,
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  border:
                    selectedTender === 'CARD'
                      ? '2px solid #3b82f6'
                      : '1px solid rgba(255,255,255,0.1)',
                  bgcolor:
                    selectedTender === 'CARD'
                      ? 'rgba(59, 130, 246, 0.12)'
                      : 'rgba(255,255,255,0.02)',
                  color: selectedTender === 'CARD' ? '#60a5fa' : 'inherit',
                  transition: 'all 0.2s',
                  userSelect: 'none',
                }}
              >
                <CreditCardIcon sx={{ fontSize: 26, mb: 0.5 }} />
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  Card POS
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper
                onClick={() => setSelectedTender('BANK_TRANSFER')}
                sx={{
                  p: 1.5,
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  border:
                    selectedTender === 'BANK_TRANSFER'
                      ? '2px solid #a855f7'
                      : '1px solid rgba(255,255,255,0.1)',
                  bgcolor:
                    selectedTender === 'BANK_TRANSFER'
                      ? 'rgba(168, 85, 247, 0.12)'
                      : 'rgba(255,255,255,0.02)',
                  color: selectedTender === 'BANK_TRANSFER' ? '#c084fc' : 'inherit',
                  transition: 'all 0.2s',
                  userSelect: 'none',
                }}
              >
                <AccountBalanceIcon sx={{ fontSize: 26, mb: 0.5 }} />
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  Transfer
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {selectedTender === 'CASH' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                  <Chip
                    label={`Exact (${formatAmount(displayGrandTotal, { currency: activeCurrency, convert: false })})`}
                    size="small"
                    onClick={() => setCashTendered(Number(displayGrandTotal.toFixed(2)))}
                    clickable
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    label="Round Up 1k"
                    size="small"
                    onClick={() => setCashTendered(Math.ceil(displayGrandTotal / 1000) * 1000)}
                    clickable
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    label="Round Up 5k"
                    size="small"
                    onClick={() => setCashTendered(Math.ceil(displayGrandTotal / 5000) * 5000)}
                    clickable
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
                <TextField
                  label={`Cash Received (${currencySymbol})`}
                  type="number"
                  fullWidth
                  value={cashTendered || ''}
                  onChange={(e) => setCashTendered(Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 1.5,
                    bgcolor:
                      cashTendered >= displayGrandTotal
                        ? 'rgba(46, 125, 50, 0.08)'
                        : 'rgba(211, 47, 47, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Change to Return:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 'bold',
                      color: cashTendered >= displayGrandTotal ? 'success.main' : 'error.main',
                    }}
                  >
                    {formatAmount(Math.max(0, cashTendered - displayGrandTotal), {
                      currency: activeCurrency,
                      convert: false,
                    })}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}

          {selectedTender === 'CARD' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                💳 Process payment on physical card reader. Enter authorization or receipt reference
                below:
              </Typography>
              <TextField
                label="Card Terminal RRN / Auth Code"
                fullWidth
                size="small"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. RRN-104928"
              />
            </Box>
          )}

          {selectedTender === 'BANK_TRANSFER' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                🏦 Confirm that incoming bank/mobile transfer of {formatAmount(grandTotal)} is
                verified.
              </Typography>
              <TextField
                label="Transfer Reference / Session ID"
                fullWidth
                size="small"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. TRF-98234"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCheckoutModalOpen(false)} disabled={isSubmittingPayment}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleCompleteCheckout}
            disabled={
              isSubmittingPayment ||
              (selectedTender === 'CASH' &&
                Math.round((cashTendered || 0) * 100) < Math.round(displayGrandTotal * 100))
            }
            startIcon={isSubmittingPayment ? <CircularProgress size={18} color="inherit" /> : null}
            sx={{ fontWeight: 800, px: 3 }}
          >
            {isSubmittingPayment ? 'Processing Payment...' : 'Confirm & Print Receipt'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Held Sales Dialog */}
      <Dialog
        open={heldModalOpen}
        onClose={() => setHeldModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxWidth: '680px !important',
            width: '100%',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
            p: { xs: 1, sm: 2 },
            m: { xs: 1.5, sm: 3 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Parked & Held Carts</DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1, sm: 2 } }}>
          <Box sx={{ overflowX: 'auto', width: '100%' }}>
            <Table size="small" sx={{ minWidth: 550 }}>
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
                    <TableCell>{formatAmount(h.subtotal)}</TableCell>
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
          </Box>
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
        PaperProps={{
          sx: {
            maxWidth: '720px !important',
            width: '100%',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
            p: { xs: 1, sm: 2 },
            m: { xs: 1.5, sm: 3 },
          },
        }}
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
          <Box sx={{ overflowX: 'auto', width: '100%' }}>
            <Table size="small" sx={{ minWidth: 550 }}>
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
                      <TableCell>{formatAmount(o.grandTotal || 0)}</TableCell>
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
          </Box>
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
          PaperProps={{
            sx: {
              maxWidth: '460px !important',
              width: '100%',
              borderRadius: '20px',
              bgcolor: '#0f1322',
              color: '#f8fafc',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.85)',
              p: { xs: 1.5, sm: 2 },
              m: { xs: 1.5, sm: 3 },
            },
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', pb: 1 }}>
            {receiptData.logoUrl ? (
              <Box
                component="img"
                src={receiptData.logoUrl}
                alt={receiptData.businessName}
                sx={{
                  maxHeight: 40,
                  maxWidth: 140,
                  mx: 'auto',
                  mb: 1,
                  display: 'block',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <ReceiptIcon color="primary" sx={{ fontSize: 32, mb: 0.5 }} />
            )}
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}
            >
              {receiptData.businessName || 'Retail Store'}
            </Typography>
            {receiptData.legalName && receiptData.legalName !== receiptData.businessName && (
              <Typography variant="caption" color="text.secondary" display="block">
                {receiptData.legalName}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent
            dividers
            sx={{
              fontFamily: 'Inter, monospace, sans-serif',
              fontSize: '0.9rem',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              px: { xs: 2, sm: 3 },
            }}
          >
            <Box sx={{ maxWidth: '400px', mx: 'auto' }}>
              {receiptData.address &&
                receiptData.address.trim().toUpperCase() !== 'US' &&
                receiptData.address.trim().toUpperCase() !== 'USA' && (
                  <Typography
                    align="center"
                    variant="caption"
                    display="block"
                    color="text.secondary"
                  >
                    {receiptData.address}
                  </Typography>
                )}
              {(receiptData.phone || receiptData.email) && (
                <Typography align="center" variant="caption" display="block" color="text.secondary">
                  {[
                    receiptData.phone ? `Tel: ${receiptData.phone}` : '',
                    receiptData.email ? `Email: ${receiptData.email}` : '',
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </Typography>
              )}
              {receiptData.taxId && (
                <Typography align="center" variant="caption" display="block" color="text.secondary">
                  Tax ID / VAT: {receiptData.taxId}
                </Typography>
              )}
              {receiptData.headerNotice && (
                <Typography
                  align="center"
                  variant="caption"
                  display="block"
                  sx={{ fontStyle: 'italic', my: 0.5 }}
                >
                  {receiptData.headerNotice}
                </Typography>
              )}
              <Typography align="center" variant="caption" display="block" sx={{ mt: 0.5 }}>
                {receiptData.branchName}
              </Typography>
              <Typography align="center" variant="caption" display="block">
                Date: {new Date(receiptData.date).toLocaleString()}
              </Typography>
              <Typography align="center" variant="caption" display="block">
                Order: #{receiptData.receiptNumber}
              </Typography>
              {receiptData.customerName && (
                <Typography align="center" variant="caption" display="block">
                  Customer: {receiptData.customerName}
                </Typography>
              )}
              <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />
              {receiptData.items?.map((i: any, idx: number) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography variant="body2">
                    {i.name} (x{i.qty})
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatAmount(i.total)}
                  </Typography>
                </Box>
              ))}
              <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Subtotal:
                </Typography>
                <Typography variant="body2">{formatAmount(receiptData.subtotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Tax:
                </Typography>
                <Typography variant="body2">{formatAmount(receiptData.tax)}</Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  mt: 1.5,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  TOTAL:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: 'success.main' }}>
                  {formatAmount(receiptData.total)}
                </Typography>
              </Box>
              <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />
              <Typography align="center" variant="caption" display="block" color="text.secondary">
                {receiptData.footer}
              </Typography>
              <Typography
                align="center"
                variant="caption"
                display="block"
                color="text.secondary"
                sx={{ mt: 1, fontSize: '0.625rem', letterSpacing: 0.5, textTransform: 'uppercase' }}
              >
                {receiptData.platformAttribution || 'Powered by Stockora Enterprise'}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions
            sx={{ px: { xs: 2, sm: 3 }, py: 1.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <Button onClick={() => setReceiptData(null)} sx={{ color: 'text.secondary' }}>
              Close
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.print()}
              startIcon={<ReceiptIcon />}
              sx={{ fontWeight: 800, borderRadius: '8px', px: 2.5 }}
            >
              Print Receipt
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
