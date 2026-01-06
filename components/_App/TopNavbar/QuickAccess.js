import React from "react";
import Link from "next/link";
import styles from "@/components/_App/TopNavbar/QuickAccess.module.css";

const QuickAccess = () => {
  return (
    <div className={styles.quickAccessWrapper}>
      <Link href="/quick-access" className={styles.quickAccessLink}>
        Quick Access
      </Link>
    </div>
  );
};

export default QuickAccess;

