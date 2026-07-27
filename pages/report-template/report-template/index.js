import React from "react";
import TemplateModuleBrowser from "@/components/ReportTemplate/TemplateModuleBrowser";

// Report (document) templates grouped by ERP module.
// Populate as report templates are introduced.
const REPORT_TEMPLATE_MODULES = [];

export default function ReportTemplatePage() {
  return (
    <TemplateModuleBrowser
      pageTitle="Report Template"
      basePath="/report-template/report-template"
      modules={REPORT_TEMPLATE_MODULES}
      emptyMessage="No report templates have been configured yet."
    />
  );
}
