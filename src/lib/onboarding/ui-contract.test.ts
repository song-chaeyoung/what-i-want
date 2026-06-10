import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();
const pagePath = join(root, "app/onboarding/page.tsx");
const birthdayPickerPath = join(root, "app/onboarding/birthday-picker.tsx");

describe("onboarding UI contract", () => {
  test("renders the client birthday picker inside the existing server form", () => {
    const source = readFileSync(pagePath, "utf8");

    expect(source).toContain('import { BirthdayPicker } from "./birthday-picker";');
    expect(source).toContain('action="/api/onboarding"');
    expect(source).toContain('method="post"');
    expect(source).toContain('name="displayName"');
    expect(source).toContain('name="birthday"');
    expect(source).toContain('name="description"');
    expect(source).toContain("<BirthdayPicker");
  });

  test("does not keep the native date input on the server page", () => {
    const source = readFileSync(pagePath, "utf8");

    expect(source).not.toContain('type="date"');
  });

  test("uses the pixel brand shell with calm form fields", () => {
    const source = readFileSync(pagePath, "utf8");

    expect(source).toContain('className="pixel-dot-bg min-h-dvh');
    expect(source).toContain('src="/logo.png"');
    expect(source).toContain("font-pixel");
    expect(source).toContain("border-2 border-[#171717] bg-[#fffdf7]");
    expect(source).toContain("shadow-[6px_6px_0_#111827]");
    expect(source).toContain("text-zinc-600");
    expect(source).toContain("focus:border-zinc-400");
    expect(source).toContain("placeholder:text-zinc-400");
    expect(source).not.toContain("bg-[#f7f5f0]");
  });

  test("posts birthday through a client picker hidden input", () => {
    expect(existsSync(birthdayPickerPath)).toBe(true);

    const source = readFileSync(birthdayPickerPath, "utf8");

    expect(source).toContain('"use client";');
    expect(source).toContain('import { Calendar } from "@/components/ui/calendar";');
    expect(source).toContain('import { Button } from "@/components/ui/button";');
    expect(source).toContain('import { CalendarIcon } from "lucide-react";');
    expect(source).toContain('import { format } from "date-fns";');
    expect(source).toContain("<Popover");
    expect(source).toContain('mode="single"');
    expect(source).toContain("selected={selected}");
    expect(source).toContain("onSelect={handleSelect}");
    expect(source).toContain('type="hidden"');
    expect(source).toContain('name={name}');
    expect(source).toContain('format(selected, "yyyy-MM-dd")');
  });

  test("uses calm date picker trigger and calendar popover styles", () => {
    const source = readFileSync(birthdayPickerPath, "utf8");

    expect(source).toContain(
      "h-11 w-full justify-between rounded-md border border-line bg-white px-3 text-sm text-ink hover:bg-zinc-50",
    );
    expect(source).toContain('!selected && "text-zinc-500"');
    expect(source).toContain(
      'className="w-auto rounded-md border border-line bg-white p-3 shadow-pub"',
    );
    expect(source).toContain("startMonth={new Date(1900, 0)}");
    expect(source).toContain(
      "endMonth={new Date(new Date().getFullYear(), 11)}",
    );
    expect(source).toContain("classNames={{");
    expect(source).toContain('caption_label: "text-sm font-semibold text-ink"');
    expect(source).toContain("day_button:");
    expect(source).toContain("rounded-md text-sm text-ink hover:bg-zinc-100");
    expect(source).toContain("생일을 선택하세요");
    expect(source).toContain("선택 해제");
    expect(source).not.toContain('border-[#d1d5db]');
    expect(source).not.toContain('text-[#6b7280]');
    expect(source).not.toContain('text-[#4b5563]');
  });

  test("points the birthday label at the visible picker trigger", () => {
    const source = readFileSync(birthdayPickerPath, "utf8");

    expect(source).toContain(
      '<input name={name} type="hidden" value={birthdayValue} readOnly />',
    );
    expect(source).not.toContain('<input id={id} name={name} type="hidden"');
    expect(source).toContain(
      `<Button
            id={id}
            type="button"`,
    );
  });

  test("maps invalid birthday validation errors", () => {
    const source = readFileSync(pagePath, "utf8");

    expect(source).toContain("invalid_birthday");
  });

  test("does not ask users to enter a public slug", () => {
    const source = readFileSync(pagePath, "utf8");

    expect(source).not.toContain('name="slug"');
    expect(source).not.toContain('htmlFor="slug"');
  });
});
