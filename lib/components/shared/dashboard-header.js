import { Typography, Chip } from "@mui/material";
import Link from "next/link";

import styles from "@/styles/PageTitle.module.css";
import { getWindowType } from "@/components/types/types";

export const DashboardHeader = (props) => {
  const windowTypeName = props.windowType ? getWindowType(props.windowType) : null;
  
  return (
    <div className={styles.pageTitle}>
      <Typography color="primary" variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        {props.customerName}&rsquo;s Inquiry ({props.optionName})
        {windowTypeName && (
          <Chip 
            label={windowTypeName}
            color="primary"
            size="small"
            sx={{ 
              fontWeight: "bold",
              fontSize: "0.75rem",
              height: "24px"
            }}
          />
        )}
      </Typography>
      <ul>
        <li>
          <Link href={props.href}>{props.link}</Link>
        </li>
        <li>{props.title}</li>
      </ul>
    </div>
  );
};
