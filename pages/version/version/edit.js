import React from "react";
import { Grid, IconButton, Tooltip, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import "react-toastify/dist/ReactToastify.css";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 500, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const validationSchema = Yup.object().shape({
  VersionNumber: Yup.string().required("Version Number is required"),
  Description: Yup.string(),
  VersionDocumentLink: Yup.string().url("Please enter a valid URL"),
});

export default function EditVersion({ item, fetchItems }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (values) => {
    const token = localStorage.getItem("token");
    const payload = {
      Id: item.id,
      ...values,
    };
    fetch(`${BASE_URL}/Version/UpdateVersion`, {
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
              VersionNumber: item.versionNumber || "",
              Description: item.description || "",
              VersionDocumentLink: item.versionDocumentLink || "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched }) => (
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
                        Edit Version
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
                        Version Number <span style={{ color: "red" }}>*</span>
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        size="small"
                        name="VersionNumber"
                        disabled
                        error={touched.VersionNumber && !!errors.VersionNumber}
                        helperText={touched.VersionNumber && errors.VersionNumber}
                        placeholder="e.g., v1.2.0"
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
                        Description
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        size="small"
                        name="Description"
                        multiline
                        rows={3}
                        placeholder="Brief summary of changes in this version"
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
                        Version Document Link
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        size="small"
                        name="VersionDocumentLink"
                        error={
                          touched.VersionDocumentLink &&
                          !!errors.VersionDocumentLink
                        }
                        helperText={
                          touched.VersionDocumentLink &&
                          errors.VersionDocumentLink
                        }
                        placeholder="URL to detailed changelog or documentation"
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

