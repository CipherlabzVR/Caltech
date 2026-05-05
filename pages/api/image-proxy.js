import http from "node:http";
import https from "node:https";

const isImageLikeContentType = (contentType) => {
  if (!contentType) return false;
  const normalized = String(contentType).toLowerCase();
  return (
    normalized.startsWith("image/") ||
    normalized.includes("application/octet-stream")
  );
};

const requestBinary = (urlObj, headers, allowInsecureTls) =>
  new Promise((resolve, reject) => {
    const isHttps = urlObj.protocol === "https:";
    const transport = isHttps ? https : http;
    const req = transport.request(
      urlObj,
      {
        method: "GET",
        headers,
        ...(isHttps ? { rejectUnauthorized: !allowInsecureTls } : {}),
      },
      (upstreamRes) => {
        const chunks = [];
        upstreamRes.on("data", (chunk) => chunks.push(chunk));
        upstreamRes.on("end", () => {
          resolve({
            statusCode: upstreamRes.statusCode || 0,
            headers: upstreamRes.headers || {},
            body: Buffer.concat(chunks),
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });

const fetchBinaryFollowingRedirects = async (
  urlObj,
  headers,
  allowInsecureTls,
  redirectsLeft = 3
) => {
  const response = await requestBinary(urlObj, headers, allowInsecureTls);
  const status = response.statusCode;
  const location = response.headers?.location;

  if (
    redirectsLeft > 0 &&
    [301, 302, 303, 307, 308].includes(status) &&
    location
  ) {
    const nextUrl = new URL(location, urlObj);
    return fetchBinaryFollowingRedirects(
      nextUrl,
      headers,
      allowInsecureTls,
      redirectsLeft - 1
    );
  }

  return response;
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const rawUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  if (!rawUrl) {
    return res.status(400).json({ message: "Missing url query parameter" });
  }

  let targetUrl;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return res.status(400).json({ message: "Invalid url" });
  }

  if (!["http:", "https:"].includes(targetUrl.protocol)) {
    return res.status(400).json({ message: "Unsupported url protocol" });
  }

  const tokenHeader = req.headers["x-auth-token"];
  const authToken =
    typeof tokenHeader === "string"
      ? tokenHeader.trim()
      : Array.isArray(tokenHeader) && tokenHeader.length > 0
        ? String(tokenHeader[0]).trim()
        : "";

  const forwardedCookie =
    typeof req.headers.cookie === "string" ? req.headers.cookie : "";
  const allowInsecureTls =
    targetUrl.protocol === "https:" &&
    ["localhost", "127.0.0.1", "::1"].includes(targetUrl.hostname);

  const candidates = [
    {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(forwardedCookie ? { Cookie: forwardedCookie } : {}),
      Accept: "image/*,*/*;q=0.8",
    },
    {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      Accept: "image/*,*/*;q=0.8",
    },
    {
      ...(forwardedCookie ? { Cookie: forwardedCookie } : {}),
      Accept: "image/*,*/*;q=0.8",
    },
    {
      Accept: "image/*,*/*;q=0.8",
    },
  ];

  try {
    for (const headers of candidates) {
      const upstream = await fetchBinaryFollowingRedirects(
        targetUrl,
        headers,
        allowInsecureTls
      );
      const contentTypeHeader = Array.isArray(upstream.headers["content-type"])
        ? upstream.headers["content-type"][0]
        : upstream.headers["content-type"];
      const cacheControlHeader = Array.isArray(upstream.headers["cache-control"])
        ? upstream.headers["cache-control"][0]
        : upstream.headers["cache-control"];

      if (
        upstream.statusCode >= 200 &&
        upstream.statusCode < 300 &&
        isImageLikeContentType(contentTypeHeader) &&
        upstream.body?.length > 0
      ) {
        res.setHeader(
          "Content-Type",
          contentTypeHeader || "application/octet-stream"
        );
        res.setHeader("Cache-Control", cacheControlHeader || "no-store");
        return res.status(200).send(upstream.body);
      }
    }

    return res.status(502).json({ message: "Image proxy request failed" });
  } catch {
    return res.status(502).json({ message: "Image proxy request failed" });
  }
}
