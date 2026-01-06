import React, { useEffect, useRef, useState } from "react";
import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Box,
  Button,
  Modal,
  Tooltip,
  IconButton,
} from "@mui/material";
import { Form, Formik } from "formik";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BorderColorIcon from "@mui/icons-material/BorderColor";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 700, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
};

const denominations = [5000, 1000, 500, 100, 50, 20, 10, 5, 2, 1, 0.5];

export default function EditShift({ fetchItems, item }) {
  const [open, setOpen] = useState(false);
  const [cashData, setCashData] = useState(
    denominations.map((val) => ({ val, qty: "", total: 0 }))
  );
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [open]);

  const handleOpen = () => {
    setCashData(denominations.map((val) => ({ val, qty: "", total: 0 })));
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const updateQty = (index, qty) => {
    const updated = [...cashData];
    updated[index].qty = qty;
    updated[index].total = parseFloat(qty || 0) * updated[index].val;
    setCashData(updated);
  };

  const getTotalAmount = () => {
    return cashData.reduce((sum, row) => sum + row.total, 0);
  };

  const handleSubmit = (values) => {
    const used = cashData.filter((row) => parseFloat(row.qty) > 0);

    if (used.length === 0) {
      toast.error("Please enter at least one quantity.");
      return;
    }

    const denominationMap = {
      5000: "FiveThousand",
      1000: "Thousand",
      500: "FiveHundred",
      100: "Hundred",
      50: "Fifty",
      20: "Twenty",
      10: "Ten",
      5: "Five",
      2: "Two",
      1: "One",
      0.5: "FiftyCents"
    };

    const data = {
      Id: item.id,
      TotalStartAmount: item.totalStartAmount,
      TotalEndAmount: getTotalAmount().toFixed(2),
      TotalInvoice: null,
      TotalOutstanding: null,
      TotalReceipt: null,
      IsActive: false,
      WarehouseId: 1,
      FiveThousand: 0,
      Thousand: 0,
      FiveHundred: 0,
      Hundred: 0,
      Fifty: 0,
      Twenty: 0,
      Ten: 0,
      Five: 0,
      Two: 0,
      One: 0,
      FiftyCents: 0,
      TerminalId: item.terminalId
    };

    cashData.forEach((row) => {
      const key = denominationMap[row.val];
      if (key) data[key] = parseInt(row.qty) || 0;
    });

    fetch(`${BASE_URL}/POSShift/UpdateShift`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 200) {
          toast.success(data.message);
          setOpen(false);
          fetchItems();
        } else {
          toast.error(data.message);
        }
      })
      .catch((err) => toast.error(err.message || ""));
  };


  return (
    <>
      <Tooltip title="Edit" placement="top">
        <IconButton onClick={handleOpen} aria-label="edit" size="small">
          <BorderColorIcon color="primary" fontSize="medium" />
        </IconButton>
      </Tooltip>
      <Modal open={open}>
        <Box sx={style}>
          <Formik
            initialValues={{ Name: "", IsActive: true }}
            onSubmit={handleSubmit}
          >
            {({ handleSubmit }) => (
              <Form onSubmit={handleSubmit}>
                <Grid container spacing={1}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} mt={2}>
                      <Typography variant="h5" fontWeight={500}>
                        End Shift
                      </Typography>
                    </Grid>

                  </Grid>

                  <Box sx={{ maxHeight: '60vh', overflowY: 'scroll' }}>
                    <Grid container>
                      <Grid item xs={12} lg={3} mt={2}>
                        <Typography
                          sx={{
                            fontWeight: "500",
                            fontSize: "14px",
                            mb: "5px",
                          }}
                        >
                          Terminal
                        </Typography>
                      </Grid>
                      <Grid item xs={12} lg={5} mt={2}>
                        <TextField
                          size="small"
                          fullWidth
                          value={item.terminalCode}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography fontWeight={500} my={2}>
                          Cash Denominations
                        </Typography>
                      </Grid>
                      <Grid item xs={12} lg={6}>
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
                              {cashData.slice(0, 5).map((row, index) => (
                                <TableRow key={row.val}>
                                  <TableCell>{row.val}</TableCell>
                                  <TableCell>X</TableCell>
                                  <TableCell>
                                    <TextField
                                      inputRef={index === 0 ? inputRef : null}
                                      type="number"
                                      size="small"
                                      value={row.qty}
                                      onChange={(e) =>
                                        updateQty(index, e.target.value)
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>{row.total.toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>

                      <Grid item xs={12} lg={6}>
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
                              {cashData.slice(5).map((row, idx) => {
                                const index = idx + 5;
                                return (
                                  <TableRow key={row.val}>
                                    <TableCell>{row.val}</TableCell>
                                    <TableCell>X</TableCell>
                                    <TableCell>
                                      <TextField
                                        type="number"
                                        size="small"
                                        value={row.qty}
                                        onChange={(e) =>
                                          updateQty(index, e.target.value)
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>{row.total.toFixed(2)}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                            <TableFooter>
                              <TableRow>
                                <TableCell colSpan={3}>Total Amount</TableCell>
                                <TableCell>{getTotalAmount().toFixed(2)}</TableCell>
                              </TableRow>
                            </TableFooter>
                          </Table>
                        </TableContainer>
                      </Grid>
                    </Grid>
                  </Box>
                  <Grid container>
                    <Grid item xs={12} display="flex" justifyContent="space-between" mt={2}>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={handleClose}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="contained">
                        Save
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}
