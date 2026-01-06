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
  FormControl,
  MenuItem,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import IsDayEndDone from "@/components/utils/IsDayEndDone";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import { formatCurrency } from "@/components/utils/formatHelper";

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

const validationSchema = Yup.object().shape({
  TerminalId: Yup.number().required("Terminal is required"),
});

export default function AddShift({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const [terminalList, setTerminalList] = useState([]);
  const [lastShiftBalance, setLastShiftBalance] = useState(0);
  const [saveDisabled, setSaveDisabled] = useState(false);
  const [cashData, setCashData] = useState(
    denominations.map((val) => ({ val, qty: "", total: 0 }))
  );
  const inputRef = useRef(null);
  const { data: isDayEndDone } = IsDayEndDone();
  const { data: isPOSShiftLinkToBackOffice } = IsAppSettingEnabled("IsPOSShiftLinkToBackOffice");
  const { data: getLastShiftBalanceToNext } = IsAppSettingEnabled("GetLastShiftBalanceToNext");

  const fetchAvailableTerminalList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Terminal/GetAllShiftNotEnabledTerminals`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Supplier List");
      }

      const data = await response.json();
      setTerminalList(data.result);
    } catch (error) {
      console.error("Error fetching Supplier List:", error);
    }
  };

  const fetchLastShiftData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Shift/GetLastShiftDetails`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Supplier List");
      }

      const data = await response.json();
      const result = data.result?.result;
      if (result) {
        setLastShiftBalance(result.endAmount);
      } else {
        setLastShiftBalance(0);
      }
    } catch (error) {
      console.error("Error fetching Supplier List:", error);
    }
  };

  useEffect(() => {
    if (getLastShiftBalanceToNext && parseFloat(lastShiftBalance) != 0) {
      setSaveDisabled(true);
    }
    if (open) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }

  }, [open]);

  const handleOpen = () => {
    if (getLastShiftBalanceToNext) {
      fetchLastShiftData();
    }
    if (isPOSShiftLinkToBackOffice) {
      if (isDayEndDone) {
        toast.warning("Work cannot continue as the day-end process has already been completed.");
        return;
      }
    }
    fetch(`${BASE_URL}/Shift/GetShiftAvailableForUser`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.result.result) {
          toast.error(data.result.message);
          return;
        } else {
          fetchAvailableTerminalList();
          setCashData(denominations.map((val) => ({ val, qty: "", total: 0 })));
          setOpen(true);
        }
      })
      .catch((err) => toast.error(err.message || ""));

  };

  const handleClose = () => setOpen(false);

  const updateQty = (index, qty) => {
    const updated = [...cashData];
    updated[index].qty = qty;
    updated[index].total = parseFloat(qty || 0) * updated[index].val;
    setCashData(updated);
    if (getLastShiftBalanceToNext && parseFloat(lastShiftBalance) != 0) {
      var enteredTotal = getTotalAmount();
      if (parseFloat(enteredTotal) === parseFloat(lastShiftBalance)) {
        setSaveDisabled(false);
      } else {
        setSaveDisabled(true);
      }
    }
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
      TotalStartAmount: getTotalAmount().toFixed(2),
      TotalEndAmount: null,
      TotalInvoice: null,
      TotalOutstanding: null,
      TotalReceipt: null,
      IsActive: true,
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
      TerminalId: values.TerminalId
    };

    cashData.forEach((row) => {
      const key = denominationMap[row.val];
      if (key) data[key] = parseInt(row.qty) || 0;
    });

    fetch(`${BASE_URL}/Shift/CreateShift`, {
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
      <Button variant="outlined" onClick={handleOpen}>
        + start shift
      </Button>
      <Modal open={open}>
        <Box sx={style}>
          <Formik
            initialValues={{ Name: "", TerminalId: "", IsActive: true }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleSubmit, touched, errors, setFieldValue }) => (
              <Form onSubmit={handleSubmit}>
                <Grid container spacing={1}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} display="flex" justifyContent="space-between" mt={2}>
                      <Typography variant="h5" fontWeight={500}>
                        Start Shift
                      </Typography>
                      {(getLastShiftBalanceToNext  && parseFloat(lastShiftBalance) != 0) && (
                        <Typography variant="h5" fontWeight={500}>
                          {formatCurrency(lastShiftBalance)}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                  <Box sx={{ maxHeight: '60vh', overflowY: 'scroll' }}>
                    <Grid container spacing={1}>
                      <Grid item mt={2} xs={12} lg={6}>
                        <Typography
                          sx={{
                            fontWeight: "500",
                            fontSize: "14px",
                            mb: "5px",
                          }}
                        >
                          Terminal
                        </Typography>
                        <FormControl fullWidth>
                          <Field
                            as={TextField}
                            select
                            fullWidth
                            name="TerminalId"
                            size="small"
                            onChange={(e) => {
                              setFieldValue("TerminalId", e.target.value);
                            }}
                          >
                            {terminalList.length === 0 ? (
                              <MenuItem disabled color="error">
                                No Terminals Available
                              </MenuItem>
                            ) : (
                              terminalList.map((terminal, index) => (
                                <MenuItem key={index} value={terminal.id}>
                                  {terminal.code}
                                </MenuItem>
                              ))
                            )}
                          </Field>
                          {touched.TerminalId && Boolean(errors.TerminalId) && (
                            <Typography variant="caption" color="error">
                              {errors.TerminalId}
                            </Typography>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography fontWeight={500} my={1}>
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
                                <TableCell>{(getLastShiftBalanceToNext && parseFloat(lastShiftBalance) != 0) ? lastShiftBalance : getTotalAmount().toFixed(2)}</TableCell>
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
                      <Button disabled={saveDisabled} type="submit" variant="contained">
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
