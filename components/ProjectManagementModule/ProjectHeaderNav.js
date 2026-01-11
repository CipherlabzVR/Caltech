import { Box, Tab, Tabs } from "@mui/material";
import { useRouter } from "next/router";
import { useMemo } from "react";

const DEFAULT_CATEGORIES = [
  { label: "Dashboard", href: "/pmo/dashboard" },
  { label: "Projects", href: "/pmo/projects" },
  { label: "Team", href: "/pmo/team" },
  { label: "Tasks", href: "/pmo/tasks" },
  { label: "Timeline", href: "/pmo/timeline" },
  { label: "Financials", href: "/pmo/financials" },
  { label: "Reports", href: "/pmo/reports" },
];

const normalizePath = (path) => {
  if (!path) return "";
  return path.replace(/\/$/, "");
};

const findActiveCategory = (categories, pathname, asPath) => {
  const normalizedPathname = normalizePath(pathname);
  const normalizedAsPath = normalizePath(asPath.split("?")[0]);

  const match = categories.find(({ href }) => {
    const normalizedHref = normalizePath(href);
    return (
      normalizedPathname === normalizedHref ||
      normalizedAsPath === normalizedHref ||
      normalizedPathname.startsWith(`${normalizedHref}/`) ||
      normalizedAsPath.startsWith(`${normalizedHref}/`)
    );
  });

  return match?.href ?? false;
};

const ProjectHeaderNav = ({ categories = DEFAULT_CATEGORIES, sx }) => {
  const router = useRouter();

  const activeHref = useMemo(
    () => findActiveCategory(categories, router.pathname, router.asPath),
    [categories, router.pathname, router.asPath]
  );

  const handleChange = (event, newHref) => {
    if (!newHref || newHref === activeHref) return;
    router.push(newHref);
  };

  return (
    <Box sx={{ width: "100%", overflowX: "auto", ...sx }}>
      <Tabs
        value={activeHref}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          minHeight: 48,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 500,
            minHeight: 48,
          },
          "& .Mui-selected": {
            fontWeight: 600,
          },
        }}
      >
        {categories.map((category) => (
          <Tab key={category.href} label={category.label} value={category.href} />
        ))}
      </Tabs>
    </Box>
  );
};

export default ProjectHeaderNav;
