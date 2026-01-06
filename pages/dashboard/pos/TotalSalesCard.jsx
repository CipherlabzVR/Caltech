import React from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const formatCurrency = (value) => {
  const numericValue = Number(value) || 0;
  return `Rs ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)}`;
};

const formatPercentage = (value) => {
  const numericValue = Number(value) || 0;
  return `${numericValue.toFixed(2)}%`;
};

const TotalSalesCard = ({ amount, profit, profitMargin }) => {
  return (
    <Card
      sx={{
        boxShadow: 'none',
        borderRadius: '10px',
        p: '20px 15px',
        mb: '15px',
        background: '#fff',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: '58px',
              height: '58px',
              lineHeight: '58px',
              background: '#757FEF',
              color: '#fff',
              fontSize: '30px',
              borderRadius: '8px',
              textAlign: 'center',
            }}
            className="mr-10px"
          >
            <i className="ri-money-dollar-circle-line"></i>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '13px' }}>
              Total Sales
            </Typography>
            <Typography variant="h1" sx={{ fontSize: 25, fontWeight: 700, marginTop: '4px' }}>
              {formatCurrency(amount)}
            </Typography>
            {/* <Typography sx={{ fontSize: '13px', marginTop: '8px' }}>
              Profit: {formatCurrency(profit)}
            </Typography>
            <Typography sx={{ fontSize: '13px', marginTop: '4px' }}>
              Profit Margin: {formatPercentage(profitMargin)}
            </Typography> */}
          </Box>
        </Box>
      </Box>
      <Box mt={1}>
        <Typography sx={{ color: '#00c851' }}>Date filter applicable</Typography>
      </Box>
    </Card>
  );
};

export default TotalSalesCard;