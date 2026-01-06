import React from "react";
import { Box, Grid, Typography } from "@mui/material";
import Card from "@mui/material/Card";
import ReservationSummeryChart from "./ReservationSummeryChart";
import styles from "../../Reservation/Summery/Summery.module.css";

const Summery = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  return (
    <>
      <Card
        sx={{
          boxShadow: "none",
          borderRadius: "10px",
          p: "25px",
          mb: "15px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #EEF0F7",
            paddingBottom: "10px",
            mb: "20px",
          }}
          className="for-dark-bottom-border"
        >
          <Typography
            as="h3"
            sx={{
              fontSize: 18,
              fontWeight: 500,
            }}
          >
            Summery
          </Typography>
        </Box>

        <Grid container>
          <Grid item lg={6} xs={6}>
            <ReservationSummeryChart />
          </Grid>
          <Grid item lg={6} xs={6}>
            <ul className={styles.list}>
              <li>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <img src="/images/dashboard/reservation/1.png" width="22" alt="bitcoin" />
                  <Box sx={{ ml: "10px" }}>
                    <Typography
                      as="h5"
                      sx={{
                        fontSize: 15,
                        fontWeight: 500,
                      }}
                    >
                      Reservations
                    </Typography>

                    <Typography as="span">25%</Typography>
                  </Box>
                </Box>

                <Box textAlign="right">
                  <Typography as="p" fontWeight="500">
                    as of today
                  </Typography>
                  <Typography as="p" fontWeight="500" color="#00B69B">
                    25
                  </Typography>
                </Box>
              </li>

              <li>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <img src="/images/dashboard/reservation/2.png" width="22"  alt="ethereum" />
                  <Box sx={{ ml: "10px" }}>
                    <Typography
                      as="h5"
                      sx={{
                        fontSize: 15,
                        fontWeight: 500,
                      }}
                    >
                      Pencil Notes
                    </Typography>

                    <Typography as="span">25%</Typography>
                  </Box>
                </Box>

                <Box textAlign="right">
                  <Typography as="p" fontWeight="500">
                    as of today
                  </Typography>
                  <Typography as="p" fontWeight="500" color="#00B69B">
                    25
                  </Typography>
                </Box>
              </li>

              <li>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <img src="/images/dashboard/reservation/3.png" width="22"  alt="comp-bidr" />
                  <Box sx={{ ml: "10px" }}>
                    <Typography
                      as="h5"
                      sx={{
                        fontSize: 15,
                        fontWeight: 500,
                      }}
                    >
                      Pending Payment Approval
                    </Typography>

                    <Typography as="span">25%</Typography>
                  </Box>
                </Box>

                <Box textAlign="right">
                  <Typography as="p" fontWeight="500">
                    as of today
                  </Typography>
                  <Typography as="p" fontWeight="500" color="#00B69B">
                    25
                  </Typography>
                </Box>
              </li>

              <li>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <img src="/images/dashboard/reservation/4.png" width="22" alt="matic2" />
                  <Box sx={{ ml: "10px" }}>
                    <Typography
                      as="h5"
                      sx={{
                        fontSize: 15,
                        fontWeight: 500,
                      }}
                    >
                      Other Notes
                    </Typography>

                    <Typography as="span">25%</Typography>
                  </Box>
                </Box>

                <Box textAlign="right">
                  <Typography as="p" fontWeight="500">
                    as of today
                  </Typography>
                  <Typography as="p" fontWeight="500" color="#00B69B">
                    25
                  </Typography>
                </Box>
              </li>
            </ul>
          </Grid>
        </Grid>
      </Card>
    </>
  );
};

export default Summery;
