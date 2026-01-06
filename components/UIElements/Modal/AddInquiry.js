import React, { useEffect, useState } from "react";
import {
  FormControlLabel,
  Grid,
  IconButton,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import BASE_URL from "Base/api";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/router";
import AddCustomerDialog from "./AddCustomerDialog";

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
  CustomerName: Yup.string().required("Customer Name is required"),
  StyleName: Yup.string().required("Style Name is required"),
  InquiryMode: Yup.number().required("Inquiry Mode is required"),
});

export default function AddInquiry({ fetchItems, type }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const router = useRouter();
  const [customersLists, setCustomersLists] = useState([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Customer/GetAllCustomer`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await response.json();
      setCustomersLists(data.result);
    } catch (error) {
      //console.error("Error fetching customers:", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = (values) => {
    const token = localStorage.getItem("token");

    fetch(`${BASE_URL}/Inquiry/CreateInquiry`, {
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
          setOpen(false);
          router.push({
            pathname: "/inquiry/select-inquiry/",
          });
          const inquiryDetailsStringified = JSON.stringify(data.result);
          localStorage.setItem("InquiryDetails", inquiryDetailsStringified);
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
      {type === 1 ? (
        <Button variant="outlined" onClick={handleOpen}>
          + new inquiry
        </Button>
      ) : (
        <Box sx={{ textAlign: "center" }}>
          {/* <IconButton
            onClick={handleOpen}
            sx={{
              background: "#a38dd2",
              width: "50px",
              height: "50px",
              "&:hover": {
                backgroundColor: "#a38dd2",
              },
            }}
          >
            <AddIcon />
          </IconButton>
          <Typography sx={{ fontWeight: "500" }}>Add Inquiry</Typography> */}
        </Box>
      )}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <AddCustomerDialog fetchItems={fetchCustomers} />
          <Formik
            initialValues={{
              CustomerId: "",
              CustomerName: "",
              Deliverydate: new Date().toISOString().split("T")[0],
              ContactNo: "",
              DesignStatus: true,
              StyleName: "",
              InquiryMode: "",
              ItemDescription: "",
              Qty: 0,
              Amount: 0,
              InquiryStatus: 1,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Box>
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
                        Customer Name
                      </Typography>
                      <Autocomplete
                        options={customersLists}
                        getOptionLabel={(option) =>
                          `${option.firstName} ${option.lastName}`
                        }
                        value={selectedCustomer}
                        onChange={(event, newValue) => {
                          setSelectedCustomer(newValue);
                          setFieldValue(
                            "CustomerId",
                            newValue ? newValue.id : ""
                          );
                          setFieldValue(
                            "CustomerName",
                            newValue
                              ? `${newValue.firstName} ${newValue.lastName}`
                              : ""
                          );
                          setFieldValue(
                            "ContactNo",
                            newValue
                              ? newValue.customerContactDetails[0].contactNo
                              : ""
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Customer Name"
                            error={
                              touched.CustomerName &&
                              Boolean(errors.CustomerName)
                            }
                            helperText={
                              touched.CustomerName && errors.CustomerName
                            }
                          />
                        )}
                      />

                    </Grid>
                    <Grid item xs={12} mt={2}>
                      <Typography
                        as="h5"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "12px",
                        }}
                      >
                        Style Name
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="StyleName"
                        error={touched.StyleName && Boolean(errors.StyleName)}
                        helperText={touched.StyleName && errors.StyleName}
                      />
                    </Grid>
                    <Grid item xs={12} mt={2}>
                      <Typography
                        as="h5"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "12px",
                        }}
                      >
                        Inquiry Mode
                      </Typography>
                      <RadioGroup
                        name="InquiryMode"
                        value={values.InquiryMode}
                        onChange={(event) =>
                          setFieldValue("InquiryMode", parseInt(event.target.value))
                        }
                        row
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                        }}
                      >
                        <FormControlLabel
                          value={1}
                          control={<Radio />}
                          label="WhatsApp"
                        />
                        <FormControlLabel
                          value={2}
                          control={<Radio />}
                          label="Email"
                        />
                        <FormControlLabel
                          value={3}
                          control={<Radio />}
                          label="Over The Mobile"
                        />
                      </RadioGroup>
                      {touched.InquiryMode && Boolean(errors.InquiryMode) && (
                        <Typography variant="caption" color="error">
                          {errors.InquiryMode}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </Box>
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
                  Create Inquiry
                </Button>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}
