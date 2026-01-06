import React, { } from "react";
import {
  IconButton,
  Tooltip,
} from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import { Visibility } from "@mui/icons-material";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import { ReportURL } from "Base/report";


export default function ViewReport() {
  const { data: StockBalance } = GetReportSettingValueByName("StockBalance");
  const warehouse = localStorage.getItem("warehouse");
  const name = localStorage.getItem("name");

  const handleClick = () => {
    const url = `${ReportURL}&reportName=${StockBalance}&warehouseId=${warehouse}&currentUser=${name}`
    window.open(url, "_blank");
  }
  return (
    <>
      <Tooltip title="View" placement="top">
        <IconButton onClick={handleClick} aria-label="View" size="small">
          <Visibility color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </>
  );
}
