import React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import {
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { formatCurrency } from "@/components/utils/formatHelper";

export default function ViewPrice({ pricing }) {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip title="View" placement="top">
        <IconButton onClick={handleClickOpen("paper")} aria-label="View" size="small">
          <VisibilityIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <div className="bg-black">
          <DialogTitle id="scroll-dialog-title">Price Details</DialogTitle>
          <DialogContent>
            <Grid container>
              <Grid item xs={12}>
                <TableContainer component={Paper}>
                  <Table aria-label="simple table" className="dark-table">
                    <TableHead style={{ backgroundColor: "#7884ef" }}>
                      <TableRow>
                        <TableCell sx={{ color: "#fff", width: "30%" }}>
                          Portion
                        </TableCell>
                        <TableCell sx={{ color: "#fff" }}>
                          Selling Price
                        </TableCell>
                        <TableCell sx={{ color: "#fff" }}>
                         Cost Price
                        </TableCell>
                         <TableCell sx={{ color: "#fff" }}>
                         Tax
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pricing &&pricing.map((contact,i) => (
                          <TableRow key={i}>
                            <TableCell>{contact.portionName}</TableCell>
                            <TableCell>{formatCurrency(contact.sellingPrice)}</TableCell>
                            <TableCell>{formatCurrency(contact.costPrice)}</TableCell>
                            <TableCell>{formatCurrency(contact.tax)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleClose}
                  sx={{
                    mt: 2,
                    textTransform: "capitalize",
                    borderRadius: "8px",
                    fontWeight: "500",
                    fontSize: "13px",
                    padding: "12px 20px",
                  }}
                >
                  Close
                </Button>
              </Grid>
            </Grid>
          </DialogContent>
        </div>
      </Dialog>
    </>
  );
}
