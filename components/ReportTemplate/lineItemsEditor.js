/** Generic helpers for editable {{#lineItems}} row templates. */

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const flattenLineFields = (fieldGroups = []) =>
  fieldGroups.flatMap((group) => group.fields || []);

export const getUsedLineTokens = (html, fieldGroups = []) => {
  const used = new Set();
  if (!html) return used;
  const fields = flattenLineFields(fieldGroups);
  const loop = html.match(/\{\{#\s*lineItems\s*\}\}([\s\S]*?)\{\{\/\s*lineItems\s*\}\}/i);
  const scope = loop?.[1] || html;
  fields.forEach((field) => {
    const pattern = new RegExp(
      `\\{\\{\\s*${escapeRegExp(field.token)}\\s*\\}\\}`,
      "i"
    );
    if (pattern.test(scope)) used.add(field.token);
  });
  return used;
};

const buildHeaderCell = (field) =>
  field.numeric
    ? `<th class="num">${field.header}</th>`
    : `<th>${field.header}</th>`;

const buildBodyCell = (field) => {
  const inner = field.cellHtml || `{{${field.token}}}`;
  return field.numeric ? `<td class="num">${inner}</td>` : `<td>${inner}</td>`;
};

export const upgradeLineItemsPlaceholder = (html, defaultBlock) => {
  if (!html || !defaultBlock || /\{\{#\s*lineItems\s*\}\}/i.test(html)) {
    return html;
  }
  if (!/\{\{\s*lineItemsRows\s*\}\}/i.test(html)) {
    return html;
  }
  return html.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, defaultBlock);
};

export const addLineColumn = (html, token, fieldGroups = []) => {
  if (!html) return html;
  const field = flattenLineFields(fieldGroups).find((item) => item.token === token);
  if (!field) return html;
  if (getUsedLineTokens(html, fieldGroups).has(token)) return html;
  if (!/\{\{#\s*lineItems\s*\}\}/i.test(html)) return html;

  let output = html;
  const headerCell = buildHeaderCell(field);
  const bodyCell = buildBodyCell(field);

  if (/<\/thead>/i.test(output)) {
    output = output.replace(
      /(<thead[\s\S]*?<tr[\s\S]*?)(<\/tr>\s*<\/thead>)/i,
      `$1\n          ${headerCell}\n        $2`
    );
  }

  output = output.replace(
    /(\{\{#\s*lineItems\s*\}\}[\s\S]*?)(<\/tr>\s*\{\{\/\s*lineItems\s*\}\})/i,
    `$1\n          ${bodyCell}\n        $2`
  );

  return output;
};

export const removeLineColumn = (html, token, fieldGroups = []) => {
  if (!html) return html;
  const field = flattenLineFields(fieldGroups).find((item) => item.token === token);
  if (!field) return html;
  if (!getUsedLineTokens(html, fieldGroups).has(token)) return html;

  let output = html;
  output = output.replace(
    new RegExp(
      `\\s*<th[^>]*>\\s*${escapeRegExp(field.header)}\\s*<\\/th>`,
      "i"
    ),
    ""
  );

  if (field.cellHtml) {
    output = output.replace(
      new RegExp(
        `\\s*<td(?:\\s+class=["']num["'])?>\\s*${escapeRegExp(
          field.cellHtml
        )}\\s*<\\/td>`,
        "i"
      ),
      ""
    );
  }

  output = output.replace(
    new RegExp(
      `\\s*<td(?:\\s+class=["']num["'])?>\\s*\\{\\{\\s*${escapeRegExp(
        token
      )}\\s*\\}\\}\\s*<\\/td>`,
      "i"
    ),
    ""
  );

  if (getUsedLineTokens(output, fieldGroups).has(token)) {
    output = output.replace(
      new RegExp(
        `\\s*<td(?:\\s+[^>]*)?>[\\s\\S]*?\\{\\{\\s*${escapeRegExp(
          token
        )}\\s*\\}\\}[\\s\\S]*?<\\/td>`,
        "i"
      ),
      ""
    );
  }

  return output;
};

export const EMPTY_LINE_ITEMS_HTML =
  '<tr><td colspan="99" style="text-align:center;padding:16px;">No items available</td></tr>';

/** Build a simple legacy <tr> list from token maps (all values already formatted). */
export const buildLegacyRowsFromTokenMaps = (lineTokenMaps, orderedTokens) => {
  if (!lineTokenMaps?.length) return EMPTY_LINE_ITEMS_HTML;
  return lineTokenMaps
    .map((tokens) => {
      const cells = orderedTokens
        .map((token) => {
          const value = tokens?.[token] ?? "";
          const isNum = /price|qty|total|amount|rate|duty|cost|free|profit|difference|quantity|level|balance/i.test(
            token
          );
          return isNum
            ? `<td class="num">${value}</td>`
            : `<td>${value}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("\n");
};
