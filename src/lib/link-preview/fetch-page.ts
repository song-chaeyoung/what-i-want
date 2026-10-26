import type { LookupAddress } from "node:dns";
import { lookup } from "node:dns/promises";
import { request as httpRequest, type IncomingMessage } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import { isPublicIpAddress, parseFetchableUrl } from "./url-guard";

const MAX_HTML_LENGTH = 500_000;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 5_000;

type PreviewPage = {
  url: string;
  status: number;
  contentType: string;
  html: string;
  location: string | null;
};

export async function fetchPreviewPage(
  initialUrl: URL,
): Promise<PreviewPage | null> {
  let currentUrl: URL | null = parseFetchableUrl(initialUrl.toString());

  for (let hop = 0; hop <= MAX_REDIRECTS && currentUrl; hop += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort(new Error("Link preview request timed out."));
    }, FETCH_TIMEOUT_MS);

    try {
      const addresses = await resolvePublicAddresses(currentUrl, controller.signal);
      if (!addresses) {
        return null;
      }

      const page = await requestPage(currentUrl, addresses, controller.signal);
      if (page.status < 300 || page.status >= 400) {
        return page;
      }
      currentUrl = page.location
        ? parseFetchableUrl(new URL(page.location, currentUrl).toString())
        : null;
    } finally {
      clearTimeout(timeout);
    }
  }

  return null;
}

async function resolvePublicAddresses(
  url: URL,
  signal: AbortSignal,
): Promise<LookupAddress[] | null> {
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const family = isIP(hostname);
  if (family !== 0) {
    return isPublicIpAddress(hostname) ? [{ address: hostname, family }] : null;
  }

  let onAbort: (() => void) | undefined;
  try {
    const addresses = await new Promise<LookupAddress[]>((resolve, reject) => {
      onAbort = () => reject(signal.reason);
      signal.addEventListener("abort", onAbort, { once: true });
      lookup(hostname, { all: true }).then(resolve, reject);
    });
    if (
      addresses.length === 0 ||
      addresses.some(({ address }) => !isPublicIpAddress(address))
    ) {
      return null;
    }
    return addresses;
  } finally {
    if (onAbort) {
      signal.removeEventListener("abort", onAbort);
    }
  }
}

async function requestPage(
  url: URL,
  addresses: LookupAddress[],
  signal: AbortSignal,
): Promise<PreviewPage> {
  let onAbort: (() => void) | undefined;
  try {
    return await new Promise<PreviewPage>((resolve, reject) => {
      let incoming: IncomingMessage | undefined;
      const request = url.protocol === "https:" ? httpsRequest : httpRequest;
      const outgoing = request(url, {
        // Keep the URL hostname for Host/SNI/certificate verification, but never
        // resolve it again when establishing the socket (DNS rebinding).
        agent: false,
        lookup: (_hostname, options, callback) => {
          if (options.all) {
            callback(null, addresses);
          } else {
            callback(null, addresses[0].address, addresses[0].family);
          }
        },
        headers: {
          accept: "text/html,application/xhtml+xml",
          "accept-encoding": "identity",
          "user-agent": "Mozilla/5.0 (compatible; mwagotgosipeo-link-preview/1.0)",
        },
      }, (response) => {
        incoming = response;
        readPage(response, url).then(resolve, reject);
      });
      onAbort = () => {
        incoming?.destroy();
        outgoing.destroy();
        reject(signal.reason);
      };
      signal.addEventListener("abort", onAbort, { once: true });
      outgoing.once("error", reject);
      outgoing.end();
    });
  } finally {
    if (onAbort) {
      signal.removeEventListener("abort", onAbort);
    }
  }
}

async function readPage(response: IncomingMessage, url: URL): Promise<PreviewPage> {
  const page: PreviewPage = {
    url: url.toString(),
    status: response.statusCode ?? 0,
    contentType: response.headers["content-type"] ?? "",
    html: "",
    location: response.headers.location ?? null,
  };

  try {
    // Redirects and non-HTML responses do not need a body download.
    if (
      page.status < 200 ||
      page.status >= 300 ||
      !page.contentType.includes("text/html")
    ) {
      return page;
    }
    const decoder = new TextDecoder();
    for await (const chunk of response) {
      page.html += decoder.decode(chunk, { stream: true });
      if (page.html.length >= MAX_HTML_LENGTH) {
        break;
      }
    }
    page.html = (page.html + decoder.decode()).slice(0, MAX_HTML_LENGTH);
    return page;
  } finally {
    response.destroy();
  }
}
