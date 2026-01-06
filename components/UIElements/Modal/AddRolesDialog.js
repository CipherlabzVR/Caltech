import React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import AddIcon from "@mui/icons-material/Add";
import Grid from "@mui/material/Grid";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";

export default function AddRolesDialog() {
  const [open, setOpen] = React.useState(false);
  const [scroll, setScroll] = React.useState("paper");

  const handleClickOpen = (scrollType) => () => {
    setOpen(true);
    setScroll(scrollType);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <ToastContainer />
      <Button onClick={handleClickOpen("paper")} variant="outlined">
        <AddIcon
          sx={{
            position: "relative",
            top: "-2px",
          }}
          className="mr-5px"
        />{" "}
        Create New Role
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <DialogTitle id="scroll-dialog-title">Create Role</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  fontSize: "14px",
                  mb: "10px",
                  display: "block",
                }}
              >
                Role Name
              </Typography>
              <TextField fullWidth name="FirstName" />
            </Grid>
            <Grid item xs={12}>
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  fontSize: "14px",
                  mb: "10px",
                  display: "block",
                }}
              >
                Display Name
              </Typography>
              <TextField fullWidth name="FirstName" />
            </Grid>
            <Grid item xs={12}>
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  fontSize: "14px",
                  mb: "10px",
                  display: "block",
                }}
              >
                Description
              </Typography>
              <TextField fullWidth name="FirstName" />
            </Grid>
            <Grid item xs={12}>
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  fontSize: "14px",
                  mb: "10px",
                  display: "block",
                }}
              >
                Permissions
              </Typography>
              <Grid container>
                <Grid item xs={4}>
                  <FormControlLabel
                    control={
                      <Checkbox/>
                    }
                    label="Permission 01"
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={6}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  textTransform: "capitalize",
                  borderRadius: "8px",
                  fontWeight: "500",
                  fontSize: "16px",
                  padding: "12px 10px",
                  color: "#fff !important",
                }}
              >
                Create Role
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                color="error"
                fullWidth
                variant="contained"
                onClick={handleClose}
                sx={{
                  textTransform: "capitalize",
                  borderRadius: "8px",
                  fontWeight: "500",
                  fontSize: "16px",
                  padding: "12px 10px",
                  color: "#fff !important",
                }}
              >
                Cancel
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  );
}
