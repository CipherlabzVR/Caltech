import { Chip } from "@mui/material";
import React from "react";

export default function StatusType({ type }) {
  const getStatusInfo = (type) => {
    switch (type) {
      case 1:
        return { label: "Order", color: "default" };
      case 2:
        return { label: "Invoice", color: "primary" };
      case 3:
        return { label: "Warehouse Issued", color: "secondary" };
      case 4:
        return { label: "Dispatched", color: "warning" };
      case 5:
        return { label: "Arrive", color: "success" };
      case 6:
        return { label: "Customer Warehouse", color: "info" };
      case 7:
        return { label: "Completed", color: "success" };
      default:
        return { label: "-", color: "default" };
    }
  };

  const { label, color } = getStatusInfo(type);

  return <Chip size="small" label={label} color={color} />;
}
