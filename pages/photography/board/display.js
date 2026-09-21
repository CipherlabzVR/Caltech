import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BoardWorkspace from "./BoardWorkspace";

/** Separate full-bleed TV / wallboard view (no ERP sidebar layout). */
export default function PhotographyBoardDisplay() {
  return (
    <>
      <ToastContainer />
      <BoardWorkspace mode="display" />
    </>
  );
}
