import React from "react";
import CloseIcon from "@mui/icons-material/Close";
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
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import "react-toastify/dist/ReactToastify.css";
import AddNotes from "./AddNotes";

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
export default function Notes() {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Button fullWidth variant="outlined" onClick={handleOpen}>
        Notes
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box>
            <Grid container>
              <Grid item xs={12} display="flex" justifyContent="space-between">
                <AddNotes />
                <IconButton
                color="error"
                  sx={{ width: "40px", height: "40px" }}
                  onClick={handleClose}
                >
                  <CloseIcon />
                </IconButton>
              </Grid>
              <Grid item xs={12} mt={2}>
                <TableContainer component={Paper}>
                  <Table
                    size="small"
                    aria-label="simple table"
                    className="dark-table"
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>Note</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Added By</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Note number 01</TableCell>
                        <TableCell>27-05-2024</TableCell>
                        <TableCell align="right">Buyan</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
