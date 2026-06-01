"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type BirthdayPickerProps = {
  id?: string;
  name?: string;
  defaultValue?: string | null;
};

export function BirthdayPicker({
  id = "birthday",
  name = "birthday",
  defaultValue = null,
}: BirthdayPickerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date | undefined>(() =>
    parseBirthday(defaultValue),
  );
  const birthdayValue = selected ? format(selected, "yyyy-MM-dd") : "";

  const handleSelect = (date: Date | undefined) => {
    setSelected(date);

    if (date) {
      setOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <input name={name} type="hidden" value={birthdayValue} readOnly />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            size="lg"
            className={cn(
              "h-11 w-full justify-between rounded-md border border-line bg-white px-3 text-sm text-ink hover:bg-zinc-50",
              !selected && "text-zinc-500",
            )}
          >
            <span className="truncate">
              {selected ? format(selected, "yyyy-MM-dd") : "생일을 선택하세요"}
            </span>
            <CalendarIcon
              className="ml-2 size-4 text-zinc-500"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto rounded-md border border-line bg-white p-3 shadow-pub"
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            captionLayout="dropdown"
            startMonth={new Date(1900, 0)}
            endMonth={new Date(new Date().getFullYear(), 11)}
            className="bg-white text-ink"
            classNames={{
              caption_label: "text-sm font-semibold text-ink",
              dropdowns:
                "flex h-8 items-center justify-center gap-2 text-sm font-medium text-ink",
              dropdown: "absolute inset-0 bg-white opacity-0",
              button_previous:
                "size-8 rounded-md text-zinc-600 hover:bg-zinc-100",
              button_next:
                "size-8 rounded-md text-zinc-600 hover:bg-zinc-100",
              weekday: "flex-1 text-xs font-medium text-zinc-500",
              day: "relative aspect-square h-full w-full p-0 text-center",
              day_button:
                "rounded-md text-sm text-ink hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-300 data-[selected-single=true]:bg-ink data-[selected-single=true]:text-white",
              today: "rounded-md bg-zinc-100 text-ink",
              selected: "rounded-md bg-ink text-white",
              outside: "text-zinc-400",
              disabled: "text-zinc-300 opacity-50",
            }}
          />
        </PopoverContent>
      </Popover>

      {selected ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="px-0 text-zinc-600 hover:text-ink"
          onClick={() => setSelected(undefined)}
        >
          선택 해제
        </Button>
      ) : null}
    </div>
  );
}

function parseBirthday(value: string | null): Date | undefined {
  if (!value) {
    return undefined;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return undefined;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!isValidCalendarDate(year, month, day)) {
    return undefined;
  }

  return new Date(year, month - 1, day);
}

function isValidCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (year < 1 || month < 1 || month > 12) {
    return false;
  }

  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day >= 1 && day <= daysInMonth[month - 1];
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
