import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Chip,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';

export interface ReceiptItem {
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ReceiptData {
  transactionNumber: string;
  createdAt?: string;
  cashierName?: string;
  branchName?: string;
  customerName?: string;
  customerEmail?: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
}

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ open, onClose, receiptData }) => {
  if (!receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = receiptData.createdAt
    ? new Date(receiptData.createdAt).toLocaleString()
    : new Date().toLocaleString();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          bgcolor: '#121827',
          color: '#f3f4f6',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      }}
    >
      <DialogTitle
        className="no-print"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleOutlineIcon color="success" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Sales Receipt & Invoice
          </Typography>
        </Box>
        <Button onClick={onClose} sx={{ minWidth: 'auto', color: 'text.secondary' }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* PRINTABLE RECEIPT CONTAINER */}
        <Box
          id="printable-receipt"
          sx={{
            p: 3,
            bgcolor: '#ffffff',
            color: '#111827',
            borderRadius: '12px',
            fontFamily: 'Inter, monospace, sans-serif',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          {/* Print specific CSS */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-receipt, #printable-receipt * {
                visibility: visible !important;
              }
              #printable-receipt {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 450px !important;
                margin: 0 auto !important;
                padding: 20px !important;
                background: #ffffff !important;
                color: #000000 !important;
                box-shadow: none !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          {/* RECEIPT HEADER */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 900, letterSpacing: -0.5, color: '#111827' }}
            >
              STOCKORA ENTERPRISE
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: '#4b5563', display: 'block', fontWeight: 600 }}
            >
              {receiptData.branchName || 'Headquarters Branch'} • POS Sales Terminal
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
              TAX INVOICE & OFFICIAL RECEIPT
            </Typography>
          </Box>

          <Divider sx={{ my: 1.5, borderColor: '#e5e7eb', borderStyle: 'dashed' }} />

          {/* METADATA GRID */}
          <Box sx={{ fontSize: '0.825rem', color: '#374151', mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                INVOICE NO:
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                {receiptData.transactionNumber}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                DATE & TIME:
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {formattedDate}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                CASHIER:
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {receiptData.cashierName || 'Store Cashier'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                PAYMENT METHOD:
              </Typography>
              <Chip
                label={receiptData.paymentMethod}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.675rem',
                  fontWeight: 800,
                  bgcolor: '#f3f4f6',
                  color: '#1f2937',
                }}
              />
            </Box>
            {receiptData.customerEmail && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                  CUSTOMER EMAIL:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {receiptData.customerEmail}
                </Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 1.5, borderColor: '#e5e7eb', borderStyle: 'dashed' }} />

          {/* ITEMS TABLE */}
          <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent', mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ color: '#6b7280', fontWeight: 700, fontSize: '0.725rem', px: 0 }}
                  >
                    ITEM DESCRIPTION
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ color: '#6b7280', fontWeight: 700, fontSize: '0.725rem', px: 0 }}
                  >
                    QTY
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: '#6b7280', fontWeight: 700, fontSize: '0.725rem', px: 0 }}
                  >
                    PRICE
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: '#6b7280', fontWeight: 700, fontSize: '0.725rem', px: 0 }}
                  >
                    TOTAL
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {receiptData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ py: 1, px: 0, borderBottom: '1px solid #f3f4f6' }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#111827' }}
                      >
                        {item.productName}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: '#9ca3af', fontSize: '0.675rem', display: 'block' }}
                      >
                        SKU: {item.sku}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        py: 1,
                        px: 0,
                        borderBottom: '1px solid #f3f4f6',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                      }}
                    >
                      {item.quantity}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ py: 1, px: 0, borderBottom: '1px solid #f3f4f6', fontSize: '0.8rem' }}
                    >
                      ${item.price.toFixed(2)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        py: 1,
                        px: 0,
                        borderBottom: '1px solid #f3f4f6',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                      }}
                    >
                      ${item.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 1.5, borderColor: '#e5e7eb', borderStyle: 'dashed' }} />

          {/* FINANCIAL SUMMARY BOX */}
          <Box sx={{ width: '100%', ml: 'auto', fontSize: '0.825rem', color: '#374151' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Subtotal
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                ${receiptData.subtotal.toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Sales Tax (8%)
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                ${receiptData.tax.toFixed(2)}
              </Typography>
            </Box>
            {receiptData.discount > 0 && (
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, color: '#dc2626' }}
              >
                <Typography variant="body2">Discount</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  -${receiptData.discount.toFixed(2)}
                </Typography>
              </Box>
            )}
            <Divider sx={{ my: 1, borderColor: '#111827' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#111827' }}>
                GRAND TOTAL
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#059669' }}>
                ${receiptData.total.toFixed(2)}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2, borderColor: '#e5e7eb', borderStyle: 'dashed' }} />

          {/* RECEIPT FOOTER */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: '#4b5563', display: 'block' }}
            >
              Thank you for shopping with us!
            </Typography>
            <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.65rem' }}>
              Please keep this invoice for warranties & return verification within 14 days.
            </Typography>

            {/* BARCODE GRAPHIC */}
            <Box sx={{ mt: 1.5, opacity: 0.75 }}>
              <Box
                sx={{
                  height: 32,
                  width: '70%',
                  mx: 'auto',
                  background:
                    'repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 7px, #fff 7px, #fff 9px)',
                  borderRadius: '2px',
                }}
              />
              <Typography
                variant="caption"
                sx={{ fontFamily: 'monospace', fontSize: '0.625rem', color: '#6b7280' }}
              >
                {receiptData.transactionNumber}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className="no-print" sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: '8px', fontWeight: 700 }}
        >
          Close
        </Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          sx={{ borderRadius: '8px', fontWeight: 800, px: 3 }}
        >
          Print Invoice Receipt
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceiptModal;
