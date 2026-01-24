import React, { useEffect, useMemo, useState } from "react";
import { Stack, Box, Typography } from "@mui/material";
import BASE_URL from "Base/api";
import pkg from "../../package.json";

const Footer = () => {
  const [latestVersion, setLatestVersion] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const cached = sessionStorage.getItem("latestAppVersion");
    if (cached) {
      try {
        setLatestVersion(JSON.parse(cached));
        // Still fetch latest in background to keep footer up-to-date
      } catch {
        // ignore cache parse errors
      }
    }

    fetch(`${BASE_URL}/Version/GetLatestVersion`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data && data.versionNumber) {
          setLatestVersion(data);
          sessionStorage.setItem("latestAppVersion", JSON.stringify(data));
        }
      })
      .catch(() => {
        // silently ignore footer errors
      });
  }, []);

  const versionText = useMemo(() => {
    const apiVersionNumber = latestVersion?.versionNumber ?? null;
    const fallbackVersionNumber = pkg?.version ?? null;
    const chosenVersionNumber = apiVersionNumber || fallbackVersionNumber;

    if (!chosenVersionNumber) return null;

    const dateText =
      apiVersionNumber && latestVersion?.createdOn
        ? new Date(latestVersion.createdOn).toLocaleDateString()
        : null;

    return dateText
      ? `Version ${chosenVersionNumber} | ${dateText}`
      : `Version ${chosenVersionNumber}`;
  }, [latestVersion]);

  return (
    <>
      <Stack
        sx={{
          backgroundColor: "#fff",
          p: "25px",
          borderRadius: "10px 10px 0 0",
          textAlign: "center",
          mt: "15px",
        }}
        className="footer"
      >
        <Box>
          <Typography>
            <strong>CBASS-AI</strong> &copy; All Rights Reserved
          </Typography>
          {versionText ? (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {versionText}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </>
  );
};

export default Footer;
