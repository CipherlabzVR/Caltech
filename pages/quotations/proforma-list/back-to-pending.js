import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UndoIcon from '@mui/icons-material/Undo';

export default function BackToPending({ id, fetchItems }) {
  const handleBackToPending = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/Inquiry/RevertProformaInvoiceToPending?id=${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.result?.statusCode === 200 || response.ok) {
        toast.success(data.result?.message || "Moved back to Pending");
        fetchItems();
      } else {
        toast.error(data.result?.message || "Failed to move back to Pending");
      }
    } catch (error) {
      toast.error(error.message || "Error occurred");
    }
  };

  return (
    <Tooltip title="Back to Pending" placement="top">
      <IconButton onClick={handleBackToPending} aria-label="back-to-pending" size="small">
        <UndoIcon color="warning" fontSize="medium" />
      </IconButton>
    </Tooltip>
  );
}
