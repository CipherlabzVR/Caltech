import React, { useState } from "react";
import { Grid, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatDate } from "@/components/utils/formatHelper";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import EditDayEnd from "./edit";
import IsPOSShiftAvailable from "@/components/utils/IsPOSShiftAvailable";
import IsPOSDayEndDone from "@/components/utils/IsPOSDayEndDone";

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

export default function CreateDayEnd({ fetchItems }) {
  const today = new Date();
  const { refetch: refetchShiftAvailable } = IsPOSShiftAvailable();
  const { refetch: refetchDayEndDone } = IsPOSDayEndDone();
  const { data: isPOSShiftLinkToBackOffice } = IsAppSettingEnabled("IsPOSShiftLinkToBackOffice");
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = useState(formatDate(today));
  const handleClose = () => setOpen(false);

  const handleOpen = async () => {
    if (isPOSShiftLinkToBackOffice) {
      const latestDayEndDone = await refetchDayEndDone();
      const latestShiftAvailable = await refetchShiftAvailable();

      if (latestDayEndDone) {
        toast.warning("Day end is already completed for today.");
        return;
      }
      if (latestShiftAvailable) {
        toast.warning("You must end the current shift to proceed.");
        return;
      } else {
        setOpen(true);
      }
    } else {
      setOpen(true);
    }
  };
  const handleSubmit = (values) => {
    fetch(`${BASE_URL}/POSDayEnd/CreateDayEnd`, {
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
        + day end
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
              Remark: "",
              Date: date || "",
            }}
            onSubmit={handleSubmit}
          >
            {({ setFieldValue }) => (
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
                      Day End
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        mb: "5px",
                      }}
                    >
                      Date
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      size="small"
                      value={date}
                      name="Date"
                      onChange={(e) => {
                        setDate(e.target.value);
                        setFieldValue("Date", e.target.value);
                      }}
                      type="date"
                      inputProps={{
                        max: new Date().toISOString().split("T")[0],
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} my={2}>
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
                  <Grid item xs={12}>
                    <EditDayEnd date={date} />
                  </Grid>
                  <Grid
                    display="flex"
                    justifyContent="space-between"
                    item
                    xs={12}
                    my={1}
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
