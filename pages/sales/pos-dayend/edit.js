import React, { useState,useEffect } from "react";
import {
  Grid, IconButton, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, Typography, TextField
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import { Formik, Form } from "formik";
import BASE_URL from "Base/api";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import SaveIcon from "@mui/icons-material/Save";
import SouthIcon from '@mui/icons-material/South';
import NorthIcon from '@mui/icons-material/North';
import { getCashType } from "@/components/types/types";
import CashInOut from "./create-cash-in-out";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 600, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

export default function EditDayEnd({ date }) {
  const [open, setOpen] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [cashItems, setCashItems] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [rowValues, setRowValues] = useState({});
  const [viewCashTable, setViewCashTable] = useState(false);
  const [shiftCode, setShiftCode] = useState("");
  const [typeName, setTypeName] = useState("");
  const [cashType, setCashType] = useState(null);
  const controller = "Shift/DeleteCashInOut";

  const fetchShifts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/POSShift/GetAllShiftsByDate?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setShifts(data.result || []);
    } catch (err) {
      console.error("Shift fetch error:", err);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  useEffect(() => {
    fetchShifts();
  }, [date]);

  const handleClose = () => setOpen(false);

  const handleEdit = (shift) => {
    setEditingRowId(shift.shiftId);
    setViewCashTable(false);
    setRowValues({
      shiftEndAmount: shift.shiftEndAmount,
      cashInAmount: shift.cashInAmount,
      cashOutAmount: shift.cashOutAmount,
    });
  };

  const handleRowChange = (field, value) => {
    setRowValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveRow = async (shiftId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${BASE_URL}/POSDayEnd/UpdateShift`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ShiftId: shiftId,
          ...rowValues,
        }),
      });
      await fetchShifts();
      setEditingRowId(null);
      setViewCashTable(false);
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleReload = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/POSShift/GetAllCashInOutByShiftsAndDate?date=${date}&shiftId=${editingRowId}&cashType=${cashType}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const updatedItems = data.result || [];
      setCashItems(updatedItems);

      const total = updatedItems.reduce((sum, i) => sum + Number(i.amount || 0), 0);

      setRowValues((prev) => ({
        ...prev,
        ...(cashType === 1 ? { cashInAmount: total } : { cashOutAmount: total }),
      }));

      setShifts((prev) =>
        prev.map((shift) =>
          shift.shiftId === editingRowId
            ? {
              ...shift,
              ...(cashType === 1 ? { cashInAmount: total } : { cashOutAmount: total }),
            }
            : shift
        )
      );

      fetchShifts();
    } catch (err) {
      console.error("Reload error:", err);
    }
  };


  const handleViewCash = async (shiftId, type, code) => {
    setCashType(type);
    setShiftCode(code);
    setTypeName(getCashType(type));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/POSShift/GetAllCashInOutByShiftsAndDate?date=${date}&shiftId=${shiftId}&cashType=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCashItems(data.result || []);
      setViewCashTable(true);
    } catch (err) {
      console.error("Cash view error:", err);
    }
  };

  const handleCashChange = (id, value) => {
    setCashItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, amount: value } : item))
    );
  };

  const handleSaveLine = async (id, amount) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${BASE_URL}/POSShift/EditCashInOut?id=${id}&amount=${amount}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const updated = cashItems.map((item) =>
        item.id === id ? { ...item, amount } : item
      );
      setCashItems(updated);

      const total = updated.reduce((sum, i) => sum + Number(i.amount), 0);
      setRowValues((prev) => ({
        ...prev,
        ...(cashType === 1 ? { cashInAmount: total } : { cashOutAmount: total }),
      }));

    } catch (err) {
      console.error("Line save error:", err);
    }
  };

  return (
    <>
      <Button disabled={shifts.length === 0} variant="outlined" onClick={handleOpen}>
        <BorderColorIcon sx={{ mr: 1 }} /> edit day end
      </Button>

      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle} className="bg-black">
          <Formik initialValues={{}} onSubmit={() => setOpen(false)}>
            {() => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h5" fontWeight={500}>Day End Edit</Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <TableContainer component={Paper}>
                      <Table className="dark-table">
                        <TableHead>
                          <TableRow>
                            <TableCell>Shift Code</TableCell>
                            <TableCell>Shift End Amount</TableCell>
                            <TableCell>Cash In</TableCell>
                            <TableCell>Cash Out</TableCell>
                            <TableCell>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {shifts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5}>
                                <Typography color="error">No Shifts Available</Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            shifts.map((s) => (
                              <TableRow key={s.shiftId}>
                                <TableCell>{s.documentNo}</TableCell>
                                <TableCell>
                                  {editingRowId === s.shiftId ? (
                                    <TextField
                                      size="small"
                                      type="number"
                                      value={rowValues.shiftEndAmount || ""}
                                      onChange={(e) => handleRowChange("shiftEndAmount", e.target.value)}
                                    />
                                  ) : s.shiftEndAmount}
                                </TableCell>
                                <TableCell>
                                  {editingRowId === s.shiftId ? (
                                    <IconButton onClick={() => handleViewCash(s.shiftId, 1, s.documentNo)}>
                                      <SouthIcon color="primary" />
                                    </IconButton>
                                  ) : s.cashInAmount}
                                </TableCell>
                                <TableCell>
                                  {editingRowId === s.shiftId ? (
                                    <IconButton onClick={() => handleViewCash(s.shiftId, 2, s.documentNo)}>
                                      <NorthIcon color="primary" />
                                    </IconButton>
                                  ) : s.cashOutAmount}
                                </TableCell>
                                <TableCell>
                                  {editingRowId === s.shiftId ? (
                                    <IconButton onClick={() => handleSaveRow(s.shiftId)}>
                                      <SaveIcon color="success" />
                                    </IconButton>
                                  ) : (
                                    <IconButton onClick={() => handleEdit(s)}>
                                      <BorderColorIcon color="primary" />
                                    </IconButton>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>

                  {viewCashTable && (
                    <Grid item xs={12}>
                      <Box sx={{ height: '30vh', overflowY: 'scroll' }}>
                        <Box display="flex" justifyContent="space-between" my={1}>
                          <Typography variant="h6">
                            {shiftCode} - {typeName}
                          </Typography>
                          <CashInOut fetchItems={handleReload} shiftId={editingRowId} date={date} />
                        </Box>
                        <TableContainer component={Paper}>
                          <Table size="small" className="dark-table">
                            <TableHead>
                              <TableRow>
                                <TableCell>Description</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Save</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {cashItems.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={3}>
                                    <Typography color="error">No Data Available</Typography>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                cashItems.map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell>
                                      <TextField
                                        size="small"
                                        type="number"
                                        value={item.amount}
                                        onChange={(e) => handleCashChange(item.id, e.target.value)}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        size="small"
                                        onClick={() => handleSaveLine(item.id, item.amount)}
                                      >
                                        Save
                                      </Button>
                                      <DeleteConfirmationById id={item.id}
                                        controller={controller}
                                        fetchItems={handleReload} />
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </Grid>
                  )}

                  <Grid item xs={12} display="flex" justifyContent="space-between">
                    <Button variant="contained" size="small" color="error" onClick={handleClose}>
                      Close
                    </Button>
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
