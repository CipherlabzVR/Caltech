export const PAGE_ORIENTATION = {
  PORTRAIT: "portrait",
  LANDSCAPE: "landscape",
};

const META_NAME = "apexflow-page-orientation";
const META_RE =
  /<meta\s+[^>]*name=["']apexflow-page-orientation["'][^>]*>/i;

export const parsePageOrientation = (html) => {
  if (!html) return PAGE_ORIENTATION.PORTRAIT;
  const match = html.match(
    /<meta\s+[^>]*name=["']apexflow-page-orientation["'][^>]*content=["'](portrait|landscape)["'][^>]*>/i
  ) || html.match(
    /<meta\s+[^>]*content=["'](portrait|landscape)["'][^>]*name=["']apexflow-page-orientation["'][^>]*>/i
  );
  const value = (match?.[1] || "").toLowerCase();
  return value === PAGE_ORIENTATION.LANDSCAPE
    ? PAGE_ORIENTATION.LANDSCAPE
    : PAGE_ORIENTATION.PORTRAIT;
};

const pageDimensions = (orientation) =>
  orientation === PAGE_ORIENTATION.LANDSCAPE
    ? { width: "297mm", minHeight: "210mm", pageSize: "A4 landscape" }
    : { width: "210mm", minHeight: "297mm", pageSize: "A4" };

/**
 * Persist print orientation in the template HTML (no DB column needed):
 *  - <meta name="apexflow-page-orientation" content="portrait|landscape" />
 *  - update .page width / min-height
 *  - update any @page size rule inside <style>
 */
export const applyPageOrientation = (html, orientation) => {
  if (!html) return html;
  const next =
    orientation === PAGE_ORIENTATION.LANDSCAPE
      ? PAGE_ORIENTATION.LANDSCAPE
      : PAGE_ORIENTATION.PORTRAIT;
  const { width, minHeight, pageSize } = pageDimensions(next);
  const metaTag = `<meta name="${META_NAME}" content="${next}" />`;

  let output = html;

  if (META_RE.test(output)) {
    output = output.replace(META_RE, metaTag);
  } else if (/<head[^>]*>/i.test(output)) {
    output = output.replace(/<head([^>]*)>/i, `<head$1>\n  ${metaTag}`);
  } else {
    output = `${metaTag}\n${output}`;
  }

  // Update .page box dimensions when present.
  output = output.replace(
    /\.page\s*\{([^}]*)\}/i,
    (_m, body) => {
      let nextBody = body;
      if (/width\s*:/i.test(nextBody)) {
        nextBody = nextBody.replace(/width\s*:\s*[^;]+;/i, `width: ${width};`);
      } else {
        nextBody = `\n      width: ${width};${nextBody}`;
      }
      if (/min-height\s*:/i.test(nextBody)) {
        nextBody = nextBody.replace(
          /min-height\s*:\s*[^;]+;/i,
          `min-height: ${minHeight};`
        );
      } else {
        nextBody = nextBody.replace(
          /width\s*:\s*[^;]+;/i,
          (w) => `${w}\n      min-height: ${minHeight};`
        );
      }
      return `.page {${nextBody}}`;
    }
  );

  // Update existing @page size rules in the template styles.
  output = output.replace(
    /@page\s*\{([^}]*)\}/gi,
    (_m, body) => {
      let nextBody = body;
      if (/size\s*:/i.test(nextBody)) {
        nextBody = nextBody.replace(/size\s*:\s*[^;]+;/i, `size: ${pageSize};`);
      } else {
        nextBody = ` size: ${pageSize};${nextBody}`;
      }
      return `@page {${nextBody}}`;
    }
  );

  return output;
};

export const getPageSizeCss = (orientation) => {
  const { pageSize } = pageDimensions(
    orientation === PAGE_ORIENTATION.LANDSCAPE
      ? PAGE_ORIENTATION.LANDSCAPE
      : PAGE_ORIENTATION.PORTRAIT
  );
  return pageSize;
};

export const getPageSizeMm = (orientation) =>
  orientation === PAGE_ORIENTATION.LANDSCAPE
    ? { widthMm: 297, heightMm: 210 }
    : { widthMm: 210, heightMm: 297 };
