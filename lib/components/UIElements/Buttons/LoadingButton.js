import React from "react";
import { Button, CircularProgress } from "@mui/material";

const LoadingButton = ({
  loading,
  handleSubmit,
  disabled,
  label,
  loadingLabel,
}) => {
  const handleClick = () => {
    if (handleSubmit) {
      handleSubmit();
    }
  };
  return (
    <Button
      variant="contained"
      type="submit"
      onClick={handleClick}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
    >
      {loading ? loadingLabel || "Saving..." : label || "Save"}
    </Button>
  );
};

export default LoadingButton;
