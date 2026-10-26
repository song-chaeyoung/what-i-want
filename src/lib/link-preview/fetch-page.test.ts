import { EventEmitter } from "node:events";
import type { IncomingMessage, RequestOptions } from "node:http";
import { isIP } from "node:net";
import { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fetchPreviewPage } from "./fetch-page";

const { lookup, request } = vi.hoisted(() => ({ lookup: vi.fn(), request: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup }));
vi.mock("node:http", () => ({ request }));
vi.mock("node:https", () => ({ request }));

type ResponsePlan = {
  status?: number;
  location?: string;
  contentType?: string;
  chunks?: Buffer[];
  hang?: boolean;
  fail?: boolean;
};
const destinations: Array<string | object> = [];
const responses: IncomingMessage[] = [];
let plans: ResponsePlan[];
let lookupAll: boolean;

beforeEach(() => {
  vi.clearAllMocks();
  destinations.length = 0;
  responses.length = 0;
  plans = [{}];
  lookupAll = true;
  lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  request.mockImplementation(
    (url: URL, options: RequestOptions, callback: (response: IncomingMessage) => void) => {
      const outgoing = Object.assign(new EventEmitter(), {
        end: () => {
          queueMicrotask(() => {
            const respond = (error: Error | null, address: string | object) => {
              if (error) {
                outgoing.emit("error", error);
                return;
              }
              destinations.push(address);
              const plan = plans.shift() ?? {};
              const incoming = Object.assign(
                plan.fail
                  ? new Readable({ read() { this.destroy(new Error("Response closed early")); } })
                  : plan.hang ? new Readable({ read() {} }) : Readable.from(plan.chunks ?? [Buffer.from("<title>Gift</title>")]),
                { statusCode: plan.status ?? 200, headers: { "content-type": plan.contentType ?? "text/html", location: plan.location } },
              ) as IncomingMessage;
              responses.push(incoming);
              callback(incoming);
            };
            const hostname = url.hostname.replace(/^\[|\]$/g, "");
            if (isIP(hostname)) respond(null, hostname);
            else options.lookup!(hostname, { all: lookupAll }, respond);
          });
        },
        destroy: (error?: Error) => {
          if (error) outgoing.emit("error", error);
          return outgoing;
        },
      });
      return outgoing;
    },
  );
});

afterEach(() => {
  responses.forEach((response) => response.destroy());
  vi.useRealTimers();
});

describe("fetchPreviewPage", () => {
  test.each(["127.0.0.1", "10.0.0.1", "169.254.169.254", "::1", "fd00::1", "febf::1"])(
    "does not connect when a public hostname resolves to %s", async (address) => {
      lookup.mockResolvedValue([{ address, family: isIP(address) }]);
      await expect(fetchPreviewPage(new URL("https://shop.example/item"))).resolves.toBeNull();
      expect(request).not.toHaveBeenCalled();
    },
  );

  test("rejects mixed public/private DNS answers before connecting", async () => {
    lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }, { address: "::ffff:127.0.0.1", family: 6 }]);
    await expect(fetchPreviewPage(new URL("https://shop.example/item"))).resolves.toBeNull();
    expect(request).not.toHaveBeenCalled();
  });

  test.each([true, false])("pins DNS results with lookup all=%s and preserves the HTTPS hostname", async (all) => {
    lookupAll = all;
    lookup.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
      .mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);
    const page = await fetchPreviewPage(new URL("https://shop.example/item?q=gift"));
    expect(page).toMatchObject({ html: "<title>Gift</title>", url: "https://shop.example/item?q=gift", status: 200 });
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(destinations).toEqual([all ? [{ address: "93.184.216.34", family: 4 }] : "93.184.216.34"]);
    expect(request.mock.calls[0][0].hostname).toBe("shop.example");
    expect(request.mock.calls[0][1]).toMatchObject({ agent: false, headers: { "accept-encoding": "identity" } });
  });

  test("pins a public IPv6 DNS result", async () => {
    lookup.mockResolvedValue([{ address: "2606:4700:4700::1111", family: 6 }]);
    await fetchPreviewPage(new URL("https://shop.example/item"));
    expect(destinations).toEqual([[{ address: "2606:4700:4700::1111", family: 6 }]]);
  });

  test("checks DNS again after redirects and closes redirect bodies", async () => {
    plans = [{ status: 302, location: "https://metadata.example/latest" }];
    lookup.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
      .mockResolvedValueOnce([{ address: "169.254.169.254", family: 4 }]);
    await expect(fetchPreviewPage(new URL("https://shop.example/item"))).resolves.toBeNull();
    expect(request).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledTimes(2);
    expect(responses[0].destroyed).toBe(true);
  });

  test("blocks literal private redirects without resolving or connecting to them", async () => {
    plans = [{ status: 302, location: "http://127.0.0.1/admin" }];
    await expect(fetchPreviewPage(new URL("https://shop.example/item"))).resolves.toBeNull();
    expect(request).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  test("follows public relative redirects and returns the final URL", async () => {
    plans = [{ status: 302, location: "/products/gift" }, {}];
    expect((await fetchPreviewPage(new URL("https://shop.example/item")))?.url).toBe("https://shop.example/products/gift");
    expect(lookup).toHaveBeenCalledTimes(2);
  });

  test("stops after three redirects and closes the final response", async () => {
    plans = Array.from({ length: 4 }, () => ({ status: 302, location: "/again" }));
    await expect(fetchPreviewPage(new URL("https://shop.example/item"))).resolves.toBeNull();
    expect(request).toHaveBeenCalledTimes(4);
    expect(responses.every((response) => response.destroyed)).toBe(true);
  });

  test("caps HTML at 500000 characters and closes the remaining download", async () => {
    plans = [{ chunks: [Buffer.from("a".repeat(300_000)), Buffer.from("b".repeat(300_000)), Buffer.from("not needed")] }];
    const page = await fetchPreviewPage(new URL("https://shop.example/item"));
    expect(page?.html).toBe("a".repeat(300_000) + "b".repeat(200_000));
    expect(responses[0].destroyed).toBe(true);
  });

  test("decodes UTF-8 split between response chunks", async () => {
    const html = Buffer.from("<title>선물</title>");
    plans = [{ chunks: [html.subarray(0, 8), html.subarray(8)] }];
    expect((await fetchPreviewPage(new URL("https://shop.example/item")))?.html).toBe("<title>선물</title>");
  });

  test("times out during DNS without starting a request", async () => {
    vi.useFakeTimers();
    lookup.mockImplementation(() => new Promise(() => {}));
    const pending = expect(fetchPreviewPage(new URL("https://shop.example/item"))).rejects.toThrow(/timed out/i);
    await vi.advanceTimersByTimeAsync(5_000);
    await pending;
    expect(request).not.toHaveBeenCalled();
  });

  test("times out and destroys a body that never ends", async () => {
    vi.useFakeTimers();
    plans = [{ hang: true }];
    const pending = expect(fetchPreviewPage(new URL("https://shop.example/item"))).rejects.toThrow(/timed out/i);
    await vi.advanceTimersByTimeAsync(5_000);
    await pending;
    expect(responses[0].destroyed).toBe(true);
  });
});

describe("fetchPreviewPage cleanup and literal URLs", () => {
  test("does not resolve a hostname again after its DNS check timed out", async () => {
    vi.useFakeTimers();
    let finishLookup!: (addresses: Array<{ address: string; family: number }>) => void;
    lookup.mockImplementation(() => new Promise((resolve) => {
      finishLookup = resolve;
    }));
    const pending = expect(fetchPreviewPage(new URL("https://shop.example/item")))
      .rejects.toThrow(/timed out/i);
    await vi.advanceTimersByTimeAsync(5_000);
    await pending;
    finishLookup([{ address: "127.0.0.1", family: 4 }]);
    await vi.runAllTimersAsync();
    expect(request).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("rechecks the same hostname when it redirects to another path", async () => {
    plans = [{ status: 302, location: "/other-path" }];
    lookup.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
      .mockResolvedValueOnce([{ address: "127.0.0.1", family: 4 }]);
    await expect(fetchPreviewPage(new URL("https://shop.example/item")))
      .resolves.toBeNull();
    expect(request).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledTimes(2);
  });

  test("requests public IP literals without doing DNS resolution", async () => {
    const page = await fetchPreviewPage(new URL("http://8.8.8.8/item"));
    expect(page?.status).toBe(200);
    expect(lookup).not.toHaveBeenCalled();
    expect(destinations).toEqual(["8.8.8.8"]);
  });

  test("rejects private initial IP literals without network access", async () => {
    await expect(fetchPreviewPage(new URL("http://127.0.0.1/admin")))
      .resolves.toBeNull();
    expect(lookup).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  test("clears the timeout after DNS failures", async () => {
    vi.useFakeTimers();
    lookup.mockRejectedValue(new Error("DNS lookup failed"));
    await expect(fetchPreviewPage(new URL("https://shop.example/item")))
      .rejects.toThrow("DNS lookup failed");
    expect(request).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("clears the timeout after a successful HTML response", async () => {
    vi.useFakeTimers();
    await expect(fetchPreviewPage(new URL("https://shop.example/item")))
      .resolves.toMatchObject({ status: 200 });
    expect(vi.getTimerCount()).toBe(0);
  });
});


describe("fetchPreviewPage response failures", () => {
  test("rejects a broken HTML stream and destroys it without leaking the timeout", async () => {
    vi.useFakeTimers();
    plans = [{ fail: true }];
    await expect(fetchPreviewPage(new URL("https://shop.example/item")))
      .rejects.toThrow("Response closed early");
    expect(responses[0].destroyed).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  test("does not read non-HTML bodies", async () => {
    plans = [{ contentType: "application/json", hang: true }];
    const page = await fetchPreviewPage(new URL("https://shop.example/item"));
    expect(page).toMatchObject({ contentType: "application/json", html: "" });
    expect(responses[0].destroyed).toBe(true);
  });
  test("passes all validated public addresses to Node's connection fallback", async () => {
    const addresses = [
      { address: "2606:4700:4700::1111", family: 6 },
      { address: "93.184.216.34", family: 4 },
    ];
    lookup.mockResolvedValue(addresses);

    expect((await fetchPreviewPage(new URL("https://shop.example/item")))?.status).toBe(200);
    expect(destinations).toEqual([addresses]);
    expect(lookup).toHaveBeenCalledTimes(1);
  });
});
