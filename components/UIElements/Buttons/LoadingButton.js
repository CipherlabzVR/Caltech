import React from "react";
import { Button, CircularProgress } from "@mui/material";

const LoadingButton = ({ loading, handleSubmit,disabled }) => {
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
      {loading ? "Saving..." : "Save"}
    </Button>
  );
};

export default LoadingButton;
