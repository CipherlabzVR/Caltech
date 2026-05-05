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
  Tabs,
  Tab
} from "@mui/material";
import { Form, Formik } from "formik";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 700, xs: 350 },
  maxWidth: "calc(100vw - 32px)",
  minWidth: 0,
  boxSizing: "border-box",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
};

const denominations = [5000, 2000, 1000, 500, 100, 50, 20, 10, 5, 2, 1, 0.5];

export default function EditShift({ fetchItems, item }) {
  const { data: isItemEndInvolveEnable } = IsAppSettingEnabled("IsItemEndInvolveEnable");
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

  const [tabValue, setTabValue] = useState(0);
  const [shiftItems, setShiftItems] = useState([]);

  const fetchShiftItems = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Items/GetAllShiftEndItems`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          setShiftItems(data.result.map(i => ({ itemId: i.id, name: i.name, code: i.code, endQty: "" })));
        }
      }
    } catch (error) {
      console.error("Error fetching shift items:", error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const updateItemQty = (index, qty) => {
    const updated = [...shiftItems];
    updated[index].endQty = qty;
    setShiftItems(updated);
  };

  const handleOpen = () => {
    setCashData(denominations.map((val) => ({ val, qty: "", total: 0 })));
    if (isItemEndInvolveEnable) {
      fetchShiftItems();
    } else {
      setShiftItems([]);
    }
    setTabValue(0);
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
      2000: "TwoThousand",
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
      TwoThousand: 0,
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
      TerminalId: item.terminalId,
      ShiftItems: isItemEndInvolveEnable
        ? shiftItems.map(si => ({
            ItemId: si.itemId,
            StartQty: 0,
            EndQty: parseFloat(si.endQty || 0)
          }))
        : []
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
              <Form onSubmit={handleSubmit} style={{ minWidth: 0, width: "100%" }}>
                <Grid container spacing={1} sx={{ minWidth: 0, width: "100%" }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} mt={2}>
                      <Typography variant="h5" fontWeight={500}>
                        End Shift
                      </Typography>
                    </Grid>

                  </Grid>

                  <Box
                    sx={{
                      maxHeight: "60vh",
                      overflowY: "auto",
                      width: "100%",
                      minWidth: 0,
                    }}
                  >
                    <Grid container sx={{ width: "100%", minWidth: 0 }}>
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
                      {isItemEndInvolveEnable && (
                        <Grid item xs={12}>
                          <Tabs value={tabValue} onChange={handleTabChange}>
                            <Tab label="Denominations" />
                            <Tab label="Items" />
                          </Tabs>
                        </Grid>
                      )}
                      {(!isItemEndInvolveEnable || tabValue === 0) && (
                        <>
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
                        </>
                      )}

                      {isItemEndInvolveEnable && tabValue === 1 && (
                        <Grid item xs={12} sx={{ minWidth: 0, width: "100%", pr: 0 }}>
                          <TableContainer
                            sx={{ width: "100%", maxWidth: "100%", minWidth: 0 }}
                          >
                            <Table
                              size="small"
                              sx={{ tableLayout: "fixed", width: "100%" }}
                            >
                              <colgroup>
                                <col style={{ width: "22%" }} />
                                <col style={{ width: "50%" }} />
                                <col style={{ width: "28%" }} />
                              </colgroup>
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ py: 1 }}>Item Code</TableCell>
                                  <TableCell sx={{ py: 1 }}>Item Name</TableCell>
                                  <TableCell sx={{ py: 1, pr: 0 }}>End Qty</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {shiftItems.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={3} align="center">No items found</TableCell>
                                  </TableRow>
                                ) : (
                                  shiftItems.map((item, index) => (
                                    <TableRow key={item.itemId}>
                                      <TableCell sx={{ wordBreak: "break-word" }}>{item.code}</TableCell>
                                      <TableCell sx={{ wordBreak: "break-word" }}>{item.name}</TableCell>
                                      <TableCell sx={{ pr: 0, verticalAlign: "middle" }}>
                                        <TextField
                                          type="number"
                                          size="small"
                                          fullWidth
                                          value={item.endQty}
                                          onChange={(e) => updateItemQty(index, e.target.value)}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                      )}
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
