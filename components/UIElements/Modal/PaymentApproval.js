import React, { useState } from "react";
import { Grid, Typography, Button, Modal, Box } from "@mui/material";
import { Form, Formik } from "formik";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: {lg:450,xs:350},
  bgcolor: "background.paper",
  boxShadow: 24,
  maxHeight: '90vh',
  overflowY: 'scroll',
  p: 4,
  borderRadius: 2,
};

export default function PaymentApproval({ item,fetchItems }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (values) => {
    try {
      const response = await fetch(
        `${BASE_URL}/ReservationApproval/UpdateApproval?id=${item.paymentApprovalId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error("Failed to fetch");
      } else {
        toast.success(responseData.result.message);
        setOpen(false);   
        await fetchItems();  
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  return (
    <>
      <Button onClick={handleOpen} variant="contained" color="success">
        Approve
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Formik
            initialValues={{
              Id: item.id,
            }}
            onSubmit={handleSubmit}
          >
            {({ values }) => (
              <Form>
                <Box mt={2}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="h5" fontWeight="bold">
                        Are you sure you want to approve this reservation?
                      </Typography>
                      <Typography color="secondary">
                        This action cannot be undone
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Box display="flex" justifyContent="space-between" mt={3}>
                  <Button
                    variant="contained"
                    onClick={handleClose}
                    color="error"
                  >
                    No
                  </Button>
                  <Button type="submit" variant="contained">
                    Yes
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
