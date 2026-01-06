import React, { useState } from "react";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
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
  Name: Yup.string().required("Name is required"),
  MobileNo: Yup.string()
    .required("Mobile No is required")
});

export default function EditSupplier({
  fetchItems,
  item,
  isPOSSystem,
  banks,
  isBankRequired,
  chartOfAccounts
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedBank, setSelectedBank] = useState();
  const handleClose = () => setOpen(false);

  const handleOpen = () => {
    if (isBankRequired && item.bankId) {
      const selected = banks.find((bank) => bank.id === item.bankId);
      setSelectedBank(selected);
    }
    setOpen(true);
  };


  const handleSubmit = (values) => {
    if (!selectedBank && isBankRequired) {
      toast.warning("Please Select Bank")
      return;
    }
    const payload = {
      ...values,
      BankId: selectedBank?.id || null,
      BankName: selectedBank?.name || "",
      BankAccountUserName: selectedBank?.accountUsername || "",
      BankAccountNo: selectedBank?.accountNo || "",
    };
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/Supplier/UpdateSupplier`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
              Id: item.id,
              Name: item.name || "",
              MobileNo: item.mobileNo || "",
              Email: item.email || "",
              WarehouseId: item.warehouseId || "",
              PayableAccount: item.payableAccount || null,
              IsActive: item.isActive ?? true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Box mt={2}>
                  <Grid spacing={1} container>
                    <Grid item xs={12}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: "500",
                          mb: "12px",
                        }}
                      >
                        Edit Suppliers
                      </Typography>
                    </Grid>
                    <Grid item xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Supplier Name
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="Name"
                        size="small"
                        error={touched.Name && Boolean(errors.Name)}
                        helperText={touched.Name && errors.Name}
                      />
                    </Grid>
                    <Grid item xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Mobile No
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="MobileNo"
                        error={touched.MobileNo && Boolean(errors.MobileNo)}
                        helperText={touched.MobileNo && errors.MobileNo}
                        size="small"
                      />
                    </Grid>
                    {isPOSSystem && (
                      <>
                        <Grid item xs={12} mt={1}>
                          <Typography
                            sx={{
                              fontWeight: 500,
                              fontSize: "14px",
                              mb: "5px",
                            }}
                          >
                            Email
                          </Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            name="Email"
                            size="small"
                          />
                        </Grid>
                      </>
                    )}
                    {isBankRequired && (
                      <>
                        <Grid item xs={12} mt={1}>
                          <Typography
                            sx={{
                              fontWeight: 500,
                              fontSize: "14px",
                              mb: "5px",
                            }}
                          >
                            Bank
                          </Typography>
                          <Select
                            size="small"
                            fullWidth
                            value={selectedBank?.id || ""}
                            onChange={(e) => {
                              const selected = banks.find((bank) => bank.id === e.target.value);
                              setSelectedBank(selected);
                            }}
                          >

                            {banks.length === 0 ? (
                              <MenuItem disabled>No Data Available</MenuItem>
                            ) : (
                              banks.map((bank, index) => (
                                <MenuItem key={index} value={bank.id}>
                                  {bank.name} - {bank.accountUsername} ({bank.accountNo})
                                </MenuItem>
                              ))
                            )}
                          </Select>
                        </Grid>

                      </>
                    )}
                    <Grid item xs={12} mt={1}>
                      <Typography
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "5px",
                        }}
                      >
                        Payable Account
                      </Typography>
                      <FormControl fullWidth>
                        <Field
                          as={TextField}
                          select
                          fullWidth
                          name="PayableAccount"
                          size="small"
                          onChange={(e) => {
                            setFieldValue("PayableAccount", e.target.value);
                          }}
                        >
                          {chartOfAccounts.length === 0 ? (
                            <MenuItem disabled>
                              No Accounts Available
                            </MenuItem>
                          ) : (
                            chartOfAccounts.map((acc, index) => (
                              <MenuItem key={index} value={acc.id}>
                                {acc.code} - {acc.description}
                              </MenuItem>
                            ))
                          )}
                        </Field>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} mt={1}>
                      <FormControlLabel
                        control={
                          <Field
                            as={Checkbox}
                            name="IsActive"
                            checked={values.IsActive}
                            onChange={() =>
                              setFieldValue("IsActive", !values.IsActive)
                            }
                          />
                        }
                        label="Active"
                      />
                    </Grid>
                  </Grid>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleClose}
                    sx={{
                      mt: 2,
                      textTransform: "capitalize",
                      borderRadius: "8px",
                      fontWeight: "500",
                      fontSize: "13px",
                      padding: "12px 20px",
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      mt: 2,
                      textTransform: "capitalize",
                      borderRadius: "8px",
                      fontWeight: "500",
                      fontSize: "13px",
                      padding: "12px 20px",
                      color: "#fff !important",
                    }}
                  >
                    Save
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}
