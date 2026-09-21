import React from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BoardWorkspace from "./BoardWorkspace";

export default function PhotographyKanbanBoard() {
  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>📋 Status Board</h1>
        <ul>
          <li>
            <Link href="/photography/dashboard/">Photography</Link>
          </li>
          <li>Board</li>
        </ul>
      </div>
      <BoardWorkspace mode="manage" />
    </>
  );
}
