import React, { useEffect, useRef, useState } from "react";
import { Grid, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useApi from "@/components/utils/useApi";

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

const ASSET_ACCOUNT_TYPES = [3, 4, 8, 15];

const validationSchema = Yup.object().shape({
  FundName: Yup.string().required("Fund name is required"),
  FloatAmount: Yup.number().min(0, "Float amount must be zero or greater").required("Float amount is required"),
  ChartOfAccountId: Yup.number().min(1, "Petty cash account is required").required("Petty cash account is required"),
  CustodianName: Yup.string().required("Custodian name is required"),
});

export default function FundSetup({ fetchItems, fund }) {
  const isEdit = Boolean(fund?.id);
  const [open, setOpen] = useState(false);
  const [assetAccounts, setAssetAccounts] = useState([]);
  const inputRef = useRef(null);
  const { data: accountList } = useApi("/ChartOfAccount/GetAll");

  const handleClose = () => setOpen(false);
  const handleOpen = () => setOpen(true);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (accountList) {
      setAssetAccounts(accountList.filter((acc) => ASSET_ACCOUNT_TYPES.includes(acc.accountType)));
    }
  }, [accountList]);

  const handleSubmit = (values) => {
    const url = isEdit
      ? `${BASE_URL}/PettyCash/UpdateFund/${fund.id}`
      : `${BASE_URL}/PettyCash/CreateFund`;
    const method = isEdit ? "PUT" : "POST";

    fetch(url, {
      method,
      body: JSON.stringify({
        FundName: values.FundName,
        FloatAmount: Number(values.FloatAmount),
        ChartOfAccountId: Number(values.ChartOfAccountId),
        CustodianName: values.CustodianName,
        IsActive: values.IsActive,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode === 200 || data.statusCode === 1) {
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
      <Button variant="outlined" onClick={handleOpen}>
        {isEdit ? "Edit Fund" : "+ Setup Fund"}
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Formik
            enableReinitialize
            initialValues={{
              FundName: fund?.fundName || "",
              FloatAmount: fund?.floatAmount ?? "",
              ChartOfAccountId: fund?.chartOfAccountId || "",
              CustodianName: fund?.custodianName || "",
              IsActive: fund ? (fund.isActive ? "true" : "false") : "true",
            }}
            validationSchema={validationSchema}
            onSubmit={(values) =>
              handleSubmit({
                ...values,
                IsActive: values.IsActive === true || values.IsActive === "true",
              })
            }
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Grid container>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: "500", mb: "5px" }}>
                      {isEdit ? "Edit Petty Cash Fund" : "Setup Petty Cash Fund"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography sx={{ fontWeight: "500", mb: "5px" }}>Fund Name</Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="FundName"
                      inputRef={inputRef}
                      error={touched.FundName && Boolean(errors.FundName)}
                      helperText={touched.FundName && errors.FundName}
                    />
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography sx={{ fontWeight: "500", mb: "5px" }}>Float Amount</Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      type="number"
                      name="FloatAmount"
                      error={touched.FloatAmount && Boolean(errors.FloatAmount)}
                      helperText={touched.FloatAmount && errors.FloatAmount}
                    />
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography sx={{ fontWeight: "500", mb: "5px" }}>Petty Cash Account (Asset)</Typography>
                    <Field
                      as={TextField}
                      select
                      fullWidth
                      name="ChartOfAccountId"
                      value={values.ChartOfAccountId}
                      onChange={(e) => setFieldValue("ChartOfAccountId", e.target.value)}
                      error={touched.ChartOfAccountId && Boolean(errors.ChartOfAccountId)}
                      helperText={touched.ChartOfAccountId && errors.ChartOfAccountId}
                    >
                      <MenuItem value="" disabled>
                        Select asset account
                      </MenuItem>
                      {assetAccounts.map((acc) => (
                        <MenuItem key={acc.id} value={acc.id}>
                          {acc.code} - {acc.description}
                        </MenuItem>
                      ))}
                    </Field>
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography sx={{ fontWeight: "500", mb: "5px" }}>Custodian Name</Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="CustodianName"
                      error={touched.CustodianName && Boolean(errors.CustodianName)}
                      helperText={touched.CustodianName && errors.CustodianName}
                    />
                  </Grid>
                  {isEdit && (
                    <Grid item xs={12} mt={1}>
                      <Typography sx={{ fontWeight: "500", mb: "5px" }}>Status</Typography>
                      <Field as={TextField} select fullWidth name="IsActive">
                        <MenuItem value="true">Active</MenuItem>
                        <MenuItem value="false">Inactive</MenuItem>
                      </Field>
                    </Grid>
                  )}
                  <Grid display="flex" justifyContent="space-between" item xs={12} p={1}>
                    <Button variant="contained" size="small" color="error" onClick={handleClose}>
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
