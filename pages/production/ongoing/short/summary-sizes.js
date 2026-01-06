import React, { useState } from "react";
import {
  Button,
  ButtonGroup,
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
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function SizesList() {
  return (
    <>
      <Grid container>
        <Grid item xs={12}>
          <Typography fontWeight="bold" sx={{ mt: 1, mb: 1 }}>
            Sizes
          </Typography>
          <TableContainer component={Paper}>
                <Table aria-label="simple table" className="dark-table">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Sleeve</TableCell>
                      <TableCell>2XS</TableCell>
                      <TableCell>XS</TableCell>
                      <TableCell>S</TableCell>
                      <TableCell>M</TableCell>
                      <TableCell>L</TableCell>
                      <TableCell>XL</TableCell>
                      <TableCell>2XL</TableCell>
                      <TableCell>3XL</TableCell>
                      <TableCell>4XL</TableCell>
                      <TableCell>5XL</TableCell>
                      <TableCell>Width</TableCell>
                      <TableCell>Lenght</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        background: "#e5e5e5",
                      }}
                    >
                      <TableCell component="th" scope="row">
                        1
                      </TableCell>
                      <TableCell>Special</TableCell>
                      <TableCell>Short</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>10</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell align="right">10</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
        </Grid>
      </Grid>
    </>
  );
}
