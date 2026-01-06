import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import {
  BarChart,
  People,
  PointOfSale,
  Groups,
  PieChart,
  CalendarMonth,
  Checkroom,
} from "@mui/icons-material";

const theme = createTheme({
  palette: {
    primary: { main: "#0c1270ff" },
    secondary: { main: "#1565c0" },
    background: { default: "#f5f5f5" },
    text: { primary: "#212121" },
  },
  typography: {
    fontFamily: '"Helvetica Neue", Roboto, sans-serif',
    h3: { fontWeight: 700 },
    h5: { fontWeight: 600 },
  },
});

const features = [
  {
    icon: <BarChart fontSize="large" />,
    title: "Real-time Analytics",
    description: "Live business performance dashboards",
  },
  {
    icon: <People fontSize="large" />,
    title: "Sale GRN",
    description: "Inventory management and goods receipt tracking",
  },
  {
    icon: <PointOfSale fontSize="large" />,
    title: "POS",
    description: "Complete point of sale transaction system",
  },
  {
    icon: <Groups fontSize="large" />,
    title: "HR",
    description: "Employee management and payroll processing",
  },
  {
    icon: <PieChart fontSize="large" />,
    title: "Finance reports",
    description: "Detailed financial statements and analytics",
  },
  {
    icon: <CalendarMonth fontSize="large" />,
    title: "Reservation system",
    description: "Booking and appointment management",
  },
  {
    icon: <Checkroom fontSize="large" />,
    title: "Garment process",
    description: "Production tracking and quality control",
  },
];

const WelcomeHero = () => (
  <ThemeProvider theme={theme}>
    <Box
      component="main"
      sx={{
        py: { xs: 5, md: 7 },
        px: 2,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Container maxWidth="lg">
        <Box textAlign="center" mb={6}>
          <Typography
            gutterBottom
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            Welcome to
          </Typography>
          <Typography
            variant="h3"
            gutterBottom
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.5px",
              color: "#1565c0",
            }}
          >
            <span style={{ color: "#023167" }}>CBASS-</span>
            <span style={{ color: "#d2202e" }}>AI</span>
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            paragraph
            sx={{ maxWidth: "800px", mx: "auto" }}
          >
            Enterprise-grade solution integrating finance, HR, supply chain, and
            customer management in a single platform
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center" mb={6}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  height: "100%",
                  borderRadius: 2,
                  transition: "transform 0.2s",
                  "&:hover": { transform: "translateY(-4px)" },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      color: "primary.main",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box textAlign="center">
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: "text.primary",
            }}
          >
            Transform Your Business Operations Today
          </Typography>
        </Box>
      </Container>
    </Box>
  </ThemeProvider>
);

export default WelcomeHero;

