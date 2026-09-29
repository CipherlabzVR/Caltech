import React from "react";
import Link from "next/link";
import { Card, CardContent, Typography, Grid, Box } from "@mui/material";

const QuickAccessCard = ({ title, items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
        boxShadow: "none",
        border: "none",
        backgroundColor: "transparent",
      }}
    >
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {title ? (
          <Typography
            variant="h6"
            sx={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#1f2949",
            }}
          >
            {title}
          </Typography>
        ) : null}

        <Grid container spacing={1.5} columns={{ xs: 12, sm: 12, md: 24, lg: 24 }}>
          {items.map((item, index) => {
            const isDisabled = item.isAvailable === false;
            const key = item.path || `${title}-${index}`;
            const cardStyles = {
              px: 1,
              py: 1.5,
              borderRadius: "8px",
              borderLeft: "5px solid #8CA9FF",
              borderRight: "1px solid rgba(94, 129, 244, 0.25)",
              borderTop: "1px solid rgba(94, 129, 244, 0.25)",
              borderBottom: "1px solid rgba(94, 129, 244, 0.25)",
              backgroundColor: isDisabled ? "rgba(148, 163, 184, 0.18)" : "#fff",
              color: isDisabled ? "#64748b" : "#5e81f4",
              fontSize: "14px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "all 0.2s ease",
              minHeight: "48px",
              cursor: isDisabled ? "not-allowed" : "pointer",
              opacity: isDisabled ? 0.7 : 1,
              "&:hover": isDisabled
                ? {}
                : {
                    backgroundColor: "rgba(94, 129, 244, 0.16)",
                    boxShadow: "0px 10px 25px rgba(94, 129, 244, 0.18)",
                  },
            };

            const content = (
              <Box sx={cardStyles} aria-disabled={isDisabled}>
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: isDisabled ? "#475569" : "#1f2949",
                    }}
                  >
                    {item.title}
                  </Typography>
                </Box>

                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    color: isDisabled ? "#94a3b8" : "#5e81f4",
                    fontSize: "18px",
                  }}
                >
                  <i className="ri-arrow-right-up-line"></i>
                </Box>
              </Box>
            );

            return (
              <Grid item xs={12} sm={6} md={4} lg={4} key={key}>
                {isDisabled ? (
                  <Box>{content}</Box>
                ) : (
                  <Link href={item.path} style={{ textDecoration: "none" }}>
                    {content}
                  </Link>
                )}
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default QuickAccessCard;

