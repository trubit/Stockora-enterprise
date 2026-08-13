import { Box, Typography, Card, CardContent, Button, Chip } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PageHeader from '../../components/PageHeader';
import { toast } from 'react-hot-toast';

export default function BankReconciliationConsole() {
  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Bank Account & Payment Reconciliation"
        subtitle="Automated bank statement reconciliation and general ledger payment matching"
      />

      <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Connected Operating Accounts
          </Typography>
          <Box
            sx={{
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                JPMorgan Chase Operating Account (**** 4890)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                GL Account: 1010 | Currency: USD
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip label="MATCHED" color="success" size="small" />
              <Button
                variant="contained"
                startIcon={<AccountBalanceIcon />}
                onClick={() => toast.success('Auto-reconciled bank statement with General Ledger!')}
              >
                Reconcile Now
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
