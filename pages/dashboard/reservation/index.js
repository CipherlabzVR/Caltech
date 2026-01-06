import React from "react";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import Features from "./Features";
import Summery from "./Summery";

export default function Reservation() {
  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Dashboard</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 2 }}>
        <Grid item xs={12} md={12} lg={12}>
          <Features />
        </Grid>

        <Grid item xs={12} md={12} lg={12}>
          <Summery />
        </Grid>
      </Grid>
    </>
  );
}
