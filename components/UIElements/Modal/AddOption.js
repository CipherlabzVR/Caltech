import React, { useRef, useEffect } from "react";
import { Grid, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

const validationSchema = Yup.object().shape({
  OptionName: Yup.string().required("Option Name is required"),
});

export default function AddOption({ category, fetchItems }) {
  const [open, setOpen] = React.useState(false); 
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
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

  const inquiryDetailsStringified = localStorage.getItem("InquiryDetails");
  const inquiryDetails = JSON.parse(inquiryDetailsStringified);
  const InqId = inquiryDetails.id;
  const InqCode = inquiryDetails.inqCode;

  const handleSubmit = (values) => {
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/Inquiry/CreateInquiryOption`, {
      method: "POST",
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode === 200) {
          toast.success(data.message);
          setOpen(false);
          fetchItems(category);
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(
          error.message || "Inquiry Creation failed. Please try again."
        );
      });
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        + new Option
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
              InquiryID: InqId,
              InqCode: InqCode,
              OptionName: "",
              WindowType: category,
              InquiryStatus: 1,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values }) => (
              <Form>
                <Box mt={2}>
                  <Grid container>
                    <Grid item xs={12} mt={2}>
                      <Typography
                        as="h5"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "12px",
                        }}
                      >
                        Option Name
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="OptionName"
                        inputRef={inputRef}
                        error={touched.OptionName && Boolean(errors.OptionName)}
                        helperText={touched.OptionName && errors.OptionName}
                      />
                    </Grid>
                    <Grid
                      item
                      display="flex"
                      justifyContent="space-between"
                      xs={12}
                      mt={2}
                    >
                      <Button
                        variant="outlined"
                        color="error"
                        sx={{
                          mt: 2,
                          textTransform: "capitalize",
                          borderRadius: "8px",
                          fontWeight: "500",
                          fontSize: "13px",
                          padding: "12px 20px",
                        }}
                        onClick={handleClose}
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
                        Create
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}
