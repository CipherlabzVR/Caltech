import React, { useEffect, useRef, useState } from "react";
import { Grid, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Form, Formik } from "formik";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatDate } from "@/components/utils/formatHelper";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 450, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};


export default function CreateSummary({ fetchItems,search,pageSize, warehouseId }) {
  const today = new Date();
  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);
  const inputRef = useRef(null);
  const [lastShiftBalance, setLastShiftBalance] = useState(0);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
    fetchLastShiftData();
  }, [open]);

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

  const handleOpen = async () => {
    setOpen(true);
  };

  const handleSubmit = (values) => {
    fetch(`${BASE_URL}/Shift/CreateShiftSummary`, {
      method: "POST",
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.message);
          setOpen(false);
          fetchItems(1,search,pageSize ,warehouseId);
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };
  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        + add summary
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Formik
            initialValues={{
              ShiftId: null,
              ShiftCode: "",
              StartAmount: lastShiftBalance,
              EndAmount: 0,
              StartDate: formatDate(today),
              EndDate: formatDate(today),
              TerminalId: null,
              WarehouseId: warehouseId
            }}
            onSubmit={handleSubmit}
          >
            {({ setFieldValue, values, handleSubmit, touched, errors }) => (
              <Form onSubmit={handleSubmit}>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Typography variant="h5" fontWeight={500}>
                      Shift Summary Update
                    </Typography>
                  </Grid>
                  <Grid item xs={12} mt={2}>
                    <Typography>Start Amount</Typography>
                    <TextField
                      type="text"
                      size="small"
                      required
                      name="StartAmount"
                      value={values.StartAmount}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} mt={2}>
                    <Typography>End Amount</Typography>
                    <TextField
                      inputRef={inputRef}
                      type="number"
                      size="small"
                      required
                      name="EndAmount"
                      fullWidth
                      onChange={(e) => setFieldValue("EndAmount", e.target.value)}
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
                    <Button disabled={lastShiftBalance === 0} type="submit" variant="contained">
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
