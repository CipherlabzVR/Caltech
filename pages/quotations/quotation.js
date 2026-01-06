import React from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';


export default function ColorCode() {
  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Color Code</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>Color Code</li>
        </ul>
      </div>
      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <TableContainer component={Paper}>
          <Table aria-label="simple table" className="dark-table">
            <TableHead>
              <TableRow>
                <TableCell>Supplier Name</TableCell>
                <TableCell>Color Code</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
                <TableRow
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    1
                  </TableCell>
                  <TableCell>2</TableCell>
                  <TableCell>3</TableCell>
                </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </>
  );
}
