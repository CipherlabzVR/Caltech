import React, { useEffect, useRef, useState } from "react";
import { Grid, IconButton, MenuItem, Select, Tooltip, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useApi from "@/components/utils/useApi";
import BorderColorIcon from "@mui/icons-material/BorderColor";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 400, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const validationSchema = Yup.object().shape({
  Amount: Yup.string().required("Amount is required"),
  Description: Yup.string().required("Description is required"),
});

export default function EditBankHistory({ item, fetchItems }) {
  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);
  const inputRef = useRef(null);
  const [cashFlowTypeId, setCashFlowTypeId] = useState(item.cashFlowTypeId || null);
  const { data: cashFlowTypeList } = useApi("/CashFlowType/GetCashFlowTypesByType?cashType=3");
  const [cashFlowTypes, setCashFlowTypes] = useState([]);

  const handleOpen = async () => {
    setCashFlowTypeId(item.cashFlowTypeId || null);
    setOpen(true);
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    if (cashFlowTypeList) {
      setCashFlowTypes(cashFlowTypeList.filter(x => x.isActive));
    }
  }, [cashFlowTypeList]);

  const handleSubmit = (values) => {
    if(!cashFlowTypeId){
      toast.error("Please Select Category");
      return;
    }
    const payload = {
      Id: item.id,
      Amount: values.Amount,
      Description: values.Description,
      CashFlowTypeId: cashFlowTypeId,
    }
    fetch(`${BASE_URL}/BankHistory/UpdateBankHistory`, {
      method: "POST",
      body: JSON.stringify(payload),
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
          fetchItems();
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
      <Tooltip title="Edit" placement="top">
        <IconButton onClick={handleOpen} aria-label="edit" size="small">
          <BorderColorIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Formik
            initialValues={{
              Description: item.description || "",
              Amount: item.amount || "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Grid container>
                  <Grid item xs={12}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: "500",
                        mb: "5px",
                      }}
                    >
                      Edit Bank History
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        mb: "5px",
                      }}
                    >
                      Description
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Description"
                      inputRef={inputRef}
                      error={touched.Description && Boolean(errors.Description)}
                      helperText={touched.Description && errors.Description}
                    />
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        mb: "5px",
                      }}
                    >
                      Category
                    </Typography>
                    <Select value={cashFlowTypeId} onChange={(e) => setCashFlowTypeId(e.target.value)} fullWidth>
                      {cashFlowTypes.length === 0 ? <MenuItem value="">No Data Available</MenuItem> :
                        (cashFlowTypes.map((type, i) => (
                          <MenuItem key={i} value={type.id}>{type.name}</MenuItem>
                        )))}
                    </Select>
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "5px",
                      }}
                    >
                      Amount
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Amount"
                      error={touched.Amount && Boolean(errors.Amount)}
                      helperText={touched.Amount && errors.Amount}
                    />
                  </Grid>
                  <Grid
                    display="flex"
                    justifyContent="space-between"
                    item
                    xs={12}
                    p={1}
                  >
                    <Button
                      variant="contained"
                      size="small"
                      color="error"
                      onClick={handleClose}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" size="small">
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
