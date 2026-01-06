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

export default function ViewMeals({ meals }) {
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
          <DialogTitle id="scroll-dialog-title">Item Details</DialogTitle>
          <DialogContent>
            <Grid container>
              <Grid item xs={12}>
                <TableContainer component={Paper}>
                  <Table aria-label="simple table" className="dark-table">
                    <TableHead style={{ backgroundColor: "#7884ef" }}>
                      <TableRow>
                        <TableCell sx={{ color: "#fff", width: "30%" }}>
                          Category
                        </TableCell>
                        <TableCell sx={{ color: "#fff", width: "30%" }}>
                          Item
                        </TableCell>
                        <TableCell sx={{ color: "#fff", width: "30%" }}>
                          Portion
                        </TableCell>
                        <TableCell sx={{ color: "#fff" }}>
                          Quantity
                        </TableCell>
                        <TableCell sx={{ color: "#fff" }}>
                          
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {meals && meals.map((meal, i) => (
                        <TableRow key={i}>
                          <TableCell>{meal.categoryId}</TableCell>
                          <TableCell>{meal.itemName}</TableCell>
                          <TableCell>{meal.portionName}</TableCell>
                          <TableCell>{meal.qty}</TableCell>
                          <TableCell>
                            {meal.isDefault ? (
                              <span className="successBadge">Default</span>
                            ) : (
                              ""
                            )}
                          </TableCell>
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
