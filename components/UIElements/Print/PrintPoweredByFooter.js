import Typography from "@mui/material/Typography";

export default function PrintPoweredByFooter({ sx = {} }) {
  return (
    <Typography
      sx={{
        mt: 2,
        pt: 1,
        borderTop: "1px solid #d9d9d9",
        textAlign: "center",
        fontSize: { xs: "0.62rem", sm: "0.8rem" },
        fontWeight: 600,
        ...sx,
      }}
    >
      Powered by CBASS-AI
    </Typography>
  );
}
