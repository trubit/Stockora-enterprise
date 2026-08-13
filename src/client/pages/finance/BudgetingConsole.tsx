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

export default function BudgetingConsole() {
  const [budgets] = useState([
    {
      name: 'FY2026 Corporate Operating Budget',
      target: 250000,
      actual: 180000,
      variance: 70000,
      status: 'ON_TRACK',
    },
  ]);

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Corporate Budgeting & Variance Analysis"
        subtitle="Annual and monthly budget planning vs actual expenditure tracking"
      />

      <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Active Corporate Budgets
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Budget Name</TableCell>
                <TableCell>Target Budget</TableCell>
                <TableCell>Actual Expenditure</TableCell>
                <TableCell>Variance ($)</TableCell>
                <TableCell>Performance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {budgets.map((b) => (
                <TableRow key={b.name}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{b.name}</TableCell>
                  <TableCell>${b.target.toLocaleString()}</TableCell>
                  <TableCell>${b.actual.toLocaleString()}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    +${b.variance.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip label={b.status} color="success" size="small" />
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
