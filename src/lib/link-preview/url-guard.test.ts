import { describe, expect, test } from "vitest";
import { parseFetchableUrl } from "./url-guard";

describe("parseFetchableUrl", () => {
  test("accepts public http and https URLs", () => {
    expect(parseFetchableUrl("https://shop.example.com/item/1")).not.toBeNull();
    expect(parseFetchableUrl("http://example.com")).not.toBeNull();
  });

  test("rejects malformed values and non-http protocols", () => {
    expect(parseFetchableUrl("not-a-url")).toBeNull();
    expect(parseFetchableUrl("ftp://example.com")).toBeNull();
    expect(parseFetchableUrl("javascript:alert(1)")).toBeNull();
  });

  test("rejects localhost and internal hostnames", () => {
    expect(parseFetchableUrl("http://localhost:3000")).toBeNull();
    expect(parseFetchableUrl("http://db.internal")).toBeNull();
    expect(parseFetchableUrl("http://printer.local")).toBeNull();
  });

  test("rejects private IPv4 ranges", () => {
    expect(parseFetchableUrl("http://127.0.0.1")).toBeNull();
    expect(parseFetchableUrl("http://10.0.0.5")).toBeNull();
    expect(parseFetchableUrl("http://172.16.0.1")).toBeNull();
    expect(parseFetchableUrl("http://192.168.1.10")).toBeNull();
    expect(parseFetchableUrl("http://169.254.169.254")).toBeNull();
    expect(parseFetchableUrl("http://100.64.0.1")).toBeNull();
  });

  test("rejects private IPv6 hosts", () => {
    expect(parseFetchableUrl("http://[::1]")).toBeNull();
    expect(parseFetchableUrl("http://[fd00::1]")).toBeNull();
    expect(parseFetchableUrl("http://[fe80::1]")).toBeNull();
  });

  test("rejects IPv4-mapped IPv6 hosts", () => {
    expect(parseFetchableUrl("http://[::ffff:127.0.0.1]")).toBeNull();
    expect(parseFetchableUrl("http://[::ffff:10.0.0.1]")).toBeNull();
    expect(parseFetchableUrl("http://[::ffff:169.254.169.254]")).toBeNull();
  });
});
