import { Typography } from "@mui/material";
import { Box } from "@mui/system";
import Button from "@mui/material/Button";
import { useEffect } from "react";

export default function Logout() {
  useEffect(() => {
    localStorage.clear();
    sessionStorage.removeItem("holidayGreetingShown");
  }, []);
  return (
    <>
      <div className="authenticationBox">
        <Box
          component="main"
          sx={{
            padding: "70px 0 100px",
          }}
        >
          <Box
            sx={{
              background: "#fff",
              padding: "30px 20px",
              borderRadius: "10px",
              maxWidth: "510px",
              ml: "auto",
              mr: "auto",
              textAlign: "center"
            }}
            className="bg-black"
          >
            <Box>
              <img 
                src="/images/logo(1).png" 
                alt="Black logo" 
                className="black-logo" 
                width="200px"
              />
            </Box>

            <Box mt={4} mb={4}>
              <img src="/images/coffee.png" alt="Coffee" />
            </Box>

            <Typography as="h1" fontSize="20px" fontWeight="500" mb={1}>
              You are Logged Out
            </Typography>

            <Typography>
              Thank you for using Admash admin template
            </Typography>

            <Button
              href="/authentication/sign-in/"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                textTransform: "capitalize",
                borderRadius: "8px",
                fontWeight: "500",
                fontSize: "16px",
                padding: "12px 10px",
                color: "#fff !important"
              }}
            >
              Sign In
            </Button>
          </Box>
        </Box>
      </div>
    </>
  );
}
