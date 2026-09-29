import React from "react";
import Link from "next/link";
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  ThemeProvider,
  createTheme,
  CircularProgress,
} from "@mui/material";
import useGrantedModules from "./useGrantedModules";

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

const WelcomeHero = () => {
  const { modules, loading } = useGrantedModules();

  return (
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
              Your modules — open what you have access to
            </Typography>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : modules.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No modules are available for your role. Contact your
                administrator if you need access.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={4} justifyContent="center" mb={6}>
              {modules.map((module) => (
                <Grid item xs={12} sm={6} md={4} key={module.ModuleId ?? module.title}>
                  <Paper
                    component={Link}
                    href={module.href || module.path || "/"}
                    elevation={2}
                    sx={{
                      p: 3,
                      height: "100%",
                      borderRadius: 2,
                      display: "block",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      cursor: "pointer",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 4,
                      },
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
                          "& .MuiSvgIcon-root": { fontSize: 32 },
                        }}
                      >
                        {module.icon}
                      </Box>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          gutterBottom
                          sx={{ fontWeight: 600 }}
                        >
                          {module.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {module.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}

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
};

export default WelcomeHero;
