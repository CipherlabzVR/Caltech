import React, { } from "react";
import {
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BorderColorIcon from "@mui/icons-material/BorderColor";

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

export default function EditStock({ fetchItems, item }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = (values) => {    
    fetch(`${BASE_URL}/StockAdjustment/StockAdjustmentCreate`, {
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
          toast.success(data.result.message);
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
              AvailableQty: item.bookBalanceQuantity,
              UpdatedQty: "",
              ProductCode: item.productCode,
              ProductName: item.productName,
              ProductId: item.productId,
              SupplierName: item.supplierName,
              SupplierId: item.supplierID,
              StockId: item.id,
              Remark: "",
              WarehouseId:1,
            }}
            onSubmit={handleSubmit}
          >
            {() => (
              <Form>
                <Grid container>
                  <Grid item xs={12}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: "500",
                        mb: "12px",
                      }}
                    >
                      Edit Stock Balance
                    </Typography>
                  </Grid>
                  <Grid item xs={12} p={1}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "5px",
                      }}
                    >
                      Item Name
                    </Typography>
                    <Field
                      as={TextField}
                      size="small"
                      fullWidth
                      name="ProductName"
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} p={1}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "5px",
                      }}
                    >
                      Item Code
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="ProductCode"
                      size="small"
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} p={1}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "5px",
                      }}
                    >
                      Supplier
                    </Typography>
                    <Field
                      as={TextField}
                      size="small"
                      fullWidth
                      name="SupplierName"
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} p={1}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "5px",
                      }}
                    >
                      Available Quantity
                    </Typography>
                    <Field
                      as={TextField}
                      size="small"
                      fullWidth
                      name="AvailableQty"
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} p={1}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "5px",
                      }}
                    >
                      New Quantity
                    </Typography>
                    <Field
                      as={TextField}
                      size="small"
                      fullWidth
                      type="number"
                      name="UpdatedQty"
                    />
                  </Grid>
                  <Grid item xs={12} p={1}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "5px",
                      }}
                    >
                      Remark
                    </Typography>
                    <Field
                      as={TextField}
                      size="small"
                      fullWidth
                      name="Remark"
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
                      color="error"
                      onClick={handleClose}
                      size="small"
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
