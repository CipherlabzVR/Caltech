import React, { useState } from "react";
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
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";

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

export default function EditOutlet({ fetchItems, item }) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisable, setIsDisable] = useState(false);
  const handleOpen = () => {
    setOpen(true)
  };
  const handleClose = () => setOpen(false);


  const handleSubmit = async (values) => {
    if (isSubmitting || isDisable) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${BASE_URL}/Outlet/UpdateOutlets?id=${values.Id}&value=${values.Value}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const json = await response.json();
      if (json.statusCode == 200) {
        setIsDisable(true);
        toast.success(json.message);
        setOpen(false);
        fetchItems();
      } else {
        toast.error(json.message);
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
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
              Name: item.productName || "",
              Value: item.addedQuantityValue || "",
            }}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue, submitForm }) => (
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
                      Edit Outlet
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Box>
                      <Grid container>
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
                            disabled
                            size="small"
                            fullWidth
                            name="Name"
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
                            Quantity
                          </Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            name="Value"
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </Box>
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
                    <LoadingButton
                      loading={isSubmitting}
                      handleSubmit={() => submitForm()}
                      disabled={isDisable || isSubmitting}
                    />
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
