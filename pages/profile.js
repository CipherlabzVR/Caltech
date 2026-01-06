import React from 'react';
import Grid from "@mui/material/Grid";
import PersonalInformation from '@/components/Pages/Profile/PersonalInformation';
import Link from 'next/link';
import styles from '@/styles/PageTitle.module.css';
import { ToastContainer } from 'react-toastify';

export default function Profile() {
  return (
    <>
      {/* Page title */}
      <div className={styles.pageTitle}>
        <h1>Profile</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>Profile</li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <ToastContainer/>
        <Grid item xs={12} md={12} lg={12} xl={4}>
          <PersonalInformation />
        </Grid>
      </Grid>
    </>
  );
}
