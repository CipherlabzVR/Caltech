import Box from "@mui/material/Box";

export default function PrintCompanyLogo({
  src,
  alt = "Company logo",
  width = { xs: "135px", sm: "220px" },
}) {
  if (!src) {
    return null;
  }

  return (
    <Box sx={{ width, flexShrink: 0 }}>
      <img
        src={src}
        alt={alt}
        style={{ width: "100%", height: "auto", objectFit: "contain" }}
      />
    </Box>
  );
}
