import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from '@mui/material';
import PageHeader from '../../components/PageHeader';

export default function TaxManagementConsole() {
  const [taxes] = useState([
    {
      code: 'VAT-8',
      name: 'Standard Value Added Tax (VAT)',
      rate: 8.0,
      type: 'VAT',
      isInclusive: false,
    },
    {
      code: 'SALES-TAX-5',
      name: 'State Sales Tax',
      rate: 5.0,
      type: 'SALES_TAX',
      isInclusive: false,
    },
  ]);

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Tax Rules & Liability Management"
        subtitle="Configure Sales Tax / VAT rate rules and monitor accrued tax liabilities"
      />

      <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Configured Tax Rate Rules
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tax Code</TableCell>
                <TableCell>Rule Name</TableCell>
                <TableCell>Tax Type</TableCell>
                <TableCell>Rate (%)</TableCell>
                <TableCell>Pricing Basis</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {taxes.map((t) => (
                <TableRow key={t.code}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t.code}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>
                    <Chip label={t.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t.rate.toFixed(1)}%</TableCell>
                  <TableCell>{t.isInclusive ? 'Tax Inclusive' : 'Tax Exclusive'}</TableCell>
                  <TableCell>
                    <Chip label="Active" size="small" color="success" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
