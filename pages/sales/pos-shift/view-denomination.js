import React, { useState } from "react";
import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Typography,
  Box,
  Button,
  Modal,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
} from "@mui/material";
import BASE_URL from "Base/api";
import MoneyIcon from '@mui/icons-material/Money';

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 700, xs: 350 },
  bgcolor: "background.paper",
  maxHeight: "90vh",
  overflowY: "scroll",
  boxShadow: 24,
  p: 2,
};

const denominations = [5000, 1000, 500, 100, 50, 20, 10, 5, 2, 1, 0.5];

export default function ViewShift({ shiftId, isShiftEnd }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [startCashData, setStartCashData] = useState([]);
  const [endCashData, setEndCashData] = useState([]);

  const handleOpen = async () => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/POSShift/GetAllCashDenominationValues?shiftId=${shiftId}`;
      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      const start = data.result.find((i) => i.isShiftAvailable);
      const end = data.result.find((i) => !i.isShiftAvailable);

      const mapData = (item) =>
        denominations.map((val) => {
          const qty = item
            ? {
              5000: item.fiveThousand,
              1000: item.thousand,
              500: item.fiveHundred,
              100: item.hundred,
              50: item.fifty,
              20: item.twenty,
              10: item.ten,
              5: item.five,
              2: item.two,
              1: item.one,
              0.5: item.fiftyCents,
            }[val] || 0
            : 0;
          return { val, qty, total: val * qty };
        });

      setStartCashData(mapData(start));
      setEndCashData(mapData(end));
      setOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClose = () => setOpen(false);
  const handleTabChange = (_, newValue) => setTab(newValue);

  const renderTables = (cashData) => {
    const totalSum = cashData.reduce((sum, item) => sum + item.total, 0);
    return (
      <>

        {[cashData.slice(0, 5), cashData.slice(5)].map((half, idx) => (
          <Grid item xs={12} lg={6} key={idx}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Value</TableCell>
                    <TableCell>X</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {half.map((row) => (
                    <TableRow key={row.val}>
                      <TableCell>{row.val}</TableCell>
                      <TableCell>X</TableCell>
                      <TableCell>{row.qty}</TableCell>
                      <TableCell>{row.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {idx === 1 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3}>Total Amount</TableCell>
                      <TableCell>{totalSum}</TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </TableContainer>
          </Grid>
        ))}
      </>
    );
  };

  return (
    <>
      <Tooltip title="Cash Denomination" placement="top">
        <IconButton onClick={handleOpen} aria-label="edit" size="small">
          <MoneyIcon color="primary" fontSize="medium" />
        </IconButton>
      </Tooltip>
      <Modal open={open}>
        <Box sx={style}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h5" fontWeight={500}>
                Cash Denomination
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Tabs value={tab} onChange={handleTabChange}>
                <Tab label="Start" />
                <Tab label="End" />
              </Tabs>
            </Grid>
            <Grid item xs={12}>
              {isShiftEnd && tab === 1 ?
                <Typography color="error" variant="h6">The shift has not ended yet</Typography>
                : ""}
            </Grid>
            {tab === 0 && renderTables(startCashData)}
            {tab === 1 && renderTables(endCashData)}
            <Grid item xs={12} display="flex" justifyContent="space-between" mt={2}>
              <Button variant="contained" color="error" onClick={handleClose}>
                Close
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}
