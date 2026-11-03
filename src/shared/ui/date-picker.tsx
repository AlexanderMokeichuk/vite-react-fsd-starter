import { useState } from "react";
import { format, isSameDay } from "date-fns";
import type { Locale } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

const DATE_FORMAT = "PP";

interface DatePickerProps {
  value: Date | undefined;
  onChange: (value: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  locale?: Locale;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  id,
  locale,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const select = (date: Date | undefined) => {
    onChange(date);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          data-empty={!value}
          className={cn(
            "w-56 justify-start px-2.5 font-normal data-[empty=true]:text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon data-icon="inline-start" />
          {value ? format(value, DATE_FORMAT, { locale }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={select}
          defaultMonth={value}
          locale={locale}
        />
      </PopoverContent>
    </Popover>
  );
}

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (value: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  locale?: Locale;
  numberOfMonths?: number;
  className?: string;
}

function formatRange(range: DateRange | undefined, locale: Locale | undefined): string | undefined {
  if (!range?.from) {
    return undefined;
  }
  const from = format(range.from, DATE_FORMAT, { locale });
  if (!range.to || isSameDay(range.from, range.to)) {
    return from;
  }
  return `${from} – ${format(range.to, DATE_FORMAT, { locale })}`;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  disabled,
  id,
  locale,
  numberOfMonths = 2,
  className,
}: DateRangePickerProps) {
  const label = formatRange(value, locale);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          data-empty={!label}
          className={cn(
            "w-72 justify-start px-2.5 font-normal data-[empty=true]:text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon data-icon="inline-start" />
          {label ?? placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          defaultMonth={value?.from}
          numberOfMonths={numberOfMonths}
          locale={locale}
        />
      </PopoverContent>
    </Popover>
  );
}
