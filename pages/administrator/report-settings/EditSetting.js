import React from "react";
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
import "react-toastify/dist/ReactToastify.css";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

export default function EditSetting({ item, fetchItems }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (values) => {
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/ReportSetting/UpdateReportSetting`, {
      method: "POST",
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.message);
          fetchItems();
          setOpen(false);
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
              ReportName: item.reportName,
              ReportValue: item.reportValue,
              IsEnabled: item.isEnabled,
            }}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Box>
                  <Grid container>
                    <Grid item xs={12}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: "bold",
                          mb: "12px",
                        }}
                      >
                        Edit Report Setting
                      </Typography>
                    </Grid>

                    <Grid item xs={12} mt={1}>
                      <Typography
                        as="h5"
                        sx={{
                          fontWeight: "400",
                          mb: "5px",
                        }}
                      >
                        Report Name
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        size="small"
                        disabled
                        name="ReportName"
                      />
                    </Grid>
                    <Grid item xs={12} mt={1}>
                      <Typography
                        as="h5"
                        sx={{
                          fontWeight: "400",
                          mb: "5px",
                        }}
                      >
                        Value
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        size="small"
                        name="ReportValue"
                      />
                    </Grid>
                  </Grid>
                </Box>
                <Box display="flex" mt={2} justifyContent="space-between">
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="small" variant="contained">
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

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};
