import React, { useEffect, useRef, useState } from "react";
import {
  Grid,
  TextField,
  Typography,
  Box,
  Button,
  Modal,
  FormControlLabel,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 400, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  maxHeight: '90vh',
  overflowY: 'scroll',
  p: 2,
};


export default function CashInOut({ fetchItems, shiftId,date }) {
  const [open, setOpen] = useState(false);
  const [cashFlowTypes, setCashFlowTypes] = useState([]);
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
    handleGetCashFlowType(1);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleGetCashFlowType = async (type) => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/CashFlowType/GetCashFlowTypesByType?cashType=${type}`;
      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setCashFlowTypes(data.result);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSubmit = (values) => {
    const data = {
      ShiftId: shiftId,
      Description: values.Description,
      Amount: values.Amount,
      CashType: parseInt(values.CashType),
      CashFlowType: parseInt(values.CashFlowType),
      Date: date ? new Date(date).toISOString() : null
    };

    fetch(`${BASE_URL}/Shift/CreateCashInOut`, {
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
      <Button variant="contained" onClick={handleOpen}>
        + add Cash In/out
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <Formik
            initialValues={{ Description: "", Amount: "", CashType: 1, CashFlowType: null }}
            onSubmit={handleSubmit}
          >
            {({ setFieldValue, values, handleSubmit }) => (
              <Form onSubmit={handleSubmit}>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Typography variant="h5" fontWeight={500}>
                      Cash In / Out Create
                    </Typography>
                  </Grid>
                  <Grid item xs={12} mt={2}>
                    <Typography>Type</Typography>
                    <RadioGroup
                      name="CashType"
                      value={values.CashType}
                      onChange={(event) => {
                        setFieldValue("CashType", event.target.value);
                        handleGetCashFlowType(event.target.value);
                      }}
                      row
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                      }}
                    >
                      <FormControlLabel
                        value={1}
                        control={<Radio />}
                        label="Cash In"
                      />
                      <FormControlLabel
                        value={2}
                        control={<Radio />}
                        label="Cash Out"
                      />
                    </RadioGroup>
                  </Grid>
                  <Grid item xs={12} mt={2}>
                    <Typography>Cash Flow Type</Typography>
                    <Field
                      as={Select}
                      inputRef={inputRef}
                      labelId="cash-flow-select-label"
                      id="cash-flow-select"
                      name="CashFlowType"
                      label="Cash Flow Type"
                      required
                      value={values.CashFlowType}
                      fullWidth
                      size="small"
                      onChange={(e) =>
                        setFieldValue("CashFlowType", parseInt(e.target.value))
                      }
                    >
                      {cashFlowTypes.length === 0 ? (
                        <MenuItem disabled color="error">
                          No Cash Flow Types Available
                        </MenuItem>
                      ) : (
                        cashFlowTypes.map((flow, index) => (
                          <MenuItem
                            key={index}
                            value={flow.id}
                          >
                            {flow.name} - {flow.description}
                          </MenuItem>
                        ))
                      )}
                    </Field>
                  </Grid>
                  <Grid item xs={12} mt={2}>
                    <Typography>Description</Typography>
                    <TextField                      
                      type="text"
                      size="small"
                      required
                      name="Description"
                      value={values.Description}
                      fullWidth
                      onChange={(e) => setFieldValue("Description", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} mt={2}>
                    <Typography>Amount</Typography>
                    <TextField
                      type="number"
                      size="small"
                      required
                      value={values.Amount}
                      name="Amount"
                      fullWidth
                      onChange={(e) => setFieldValue("Amount", e.target.value)}
                    />
                  </Grid>
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
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}
