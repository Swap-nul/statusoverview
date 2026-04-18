import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

interface ReleaseConfigEvent {
  type: string;
  version: string;
  releaseDate: string;
  Note?: string;
}

interface ReleaseConfigApp {
  appName: string;
  Events: ReleaseConfigEvent[];
}

interface ReleaseCalendarEvent {
  id: string;
  appName: string;
  type: string;
  version: string;
  note: string;
  releaseDate: string;
  date: Date;
  dateKey: string;
}

interface CalendarDayCell {
  id: string;
  date: Date | null;
  dayNumber: number | null;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: ReleaseCalendarEvent[];
}

interface YearMonthSummary {
  monthIndex: number;
  label: string;
  eventCount: number;
  isActiveMonth: boolean;
}

@Component({
  selector: 'app-release-calendar',
  templateUrl: './release-calendar.component.html',
  styleUrls: ['./release-calendar.component.scss'],
})
export class ReleaseCalendarComponent implements OnInit {
  isLoading = true;
  selectedCalendarDate = this.createDateOnly(new Date());
  calendarActiveDate = this.createMonthStart(new Date());
  releaseEvents: ReleaseCalendarEvent[] = [];
  releaseEventsByDate = new Map<string, ReleaseCalendarEvent[]>();
  calendarWeeks: CalendarDayCell[][] = [];
  yearMonthSummaries: YearMonthSummary[] = [];
  readonly calendarWeekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  readonly yearMonthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadReleaseEvents();
  }

  getCalendarMonthLabel(): string {
    return this.calendarActiveDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  getCalendarYearLabel(): string {
    return `${this.calendarActiveDate.getFullYear()}`;
  }

  goToPreviousMonth(): void {
    this.syncCalendarMonth(new Date(this.calendarActiveDate.getFullYear(), this.calendarActiveDate.getMonth() - 1, 1));
  }

  goToNextMonth(): void {
    this.syncCalendarMonth(new Date(this.calendarActiveDate.getFullYear(), this.calendarActiveDate.getMonth() + 1, 1));
  }

  goToPreviousYear(): void {
    this.syncCalendarMonth(new Date(this.calendarActiveDate.getFullYear() - 1, this.calendarActiveDate.getMonth(), 1));
  }

  goToNextYear(): void {
    this.syncCalendarMonth(new Date(this.calendarActiveDate.getFullYear() + 1, this.calendarActiveDate.getMonth(), 1));
  }

  selectYearMonth(monthIndex: number): void {
    this.syncCalendarMonth(new Date(this.calendarActiveDate.getFullYear(), monthIndex, 1));
  }

  selectCalendarDate(day: CalendarDayCell): void {
    if (!day.date) {
      return;
    }

    this.selectedCalendarDate = this.createDateOnly(day.date);
    this.buildCalendarWeeks();
  }

  private loadReleaseEvents(): void {
    this.http
      .get<{ Releases?: ReleaseConfigApp[] }>('/assets/config.json')
      .subscribe((data) => {
        this.initializeReleaseEvents(data.Releases || []);
        this.isLoading = false;
      });
  }

  private initializeReleaseEvents(releaseConfigs: ReleaseConfigApp[]): void {
    this.releaseEvents = releaseConfigs
      .flatMap((releaseApp, appIndex) =>
        (releaseApp.Events || [])
          .map((event, eventIndex) => this.mapReleaseEvent(releaseApp.appName, event, appIndex, eventIndex))
          .filter((event): event is ReleaseCalendarEvent => event !== null)
      )
      .sort((first, second) => first.date.getTime() - second.date.getTime() || first.appName.localeCompare(second.appName));

    this.rebuildReleaseEventLookup();
    this.buildYearMonthSummaries();
    this.buildCalendarWeeks();
  }

  private mapReleaseEvent(
    appName: string,
    event: ReleaseConfigEvent,
    appIndex: number,
    eventIndex: number
  ): ReleaseCalendarEvent | null {
    const parsedDate = this.parseConfigDate(event.releaseDate);

    if (!parsedDate) {
      console.warn(`Invalid releaseDate "${event.releaseDate}" for ${appName}`);
      return null;
    }

    return {
      id: `${appIndex}-${eventIndex}-${this.toDateKey(parsedDate)}`,
      appName,
      type: event.type,
      version: event.version,
      note: event.Note || '',
      releaseDate: event.releaseDate,
      date: parsedDate,
      dateKey: this.toDateKey(parsedDate),
    };
  }

  private parseConfigDate(rawDate: string): Date | null {
    const dateParts = rawDate?.split('/').map((value) => Number(value));

    if (!dateParts || dateParts.length !== 3 || dateParts.some((value) => Number.isNaN(value))) {
      return null;
    }

    const [month, day, year] = dateParts;
    const parsedDate = new Date(year, month - 1, day);

    if (parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month - 1 || parsedDate.getDate() !== day) {
      return null;
    }

    return this.createDateOnly(parsedDate);
  }

  private rebuildReleaseEventLookup(): void {
    const lookup = new Map<string, ReleaseCalendarEvent[]>();

    this.releaseEvents.forEach((event) => {
      const existingEvents = lookup.get(event.dateKey) || [];
      existingEvents.push(event);
      lookup.set(event.dateKey, existingEvents);
    });

    this.releaseEventsByDate = lookup;
  }

  private syncCalendarMonth(activeDate: Date): void {
    const normalizedDate = this.createMonthStart(activeDate);

    if (
      normalizedDate.getFullYear() === this.calendarActiveDate.getFullYear() &&
      normalizedDate.getMonth() === this.calendarActiveDate.getMonth()
    ) {
      return;
    }

    this.calendarActiveDate = normalizedDate;
    this.buildYearMonthSummaries();
    this.buildCalendarWeeks();
  }

  private buildYearMonthSummaries(): void {
    const activeYear = this.calendarActiveDate.getFullYear();

    this.yearMonthSummaries = this.yearMonthLabels.map((label, monthIndex) => ({
      monthIndex,
      label,
      eventCount: this.releaseEvents.filter((event) => {
        return event.date.getFullYear() === activeYear && event.date.getMonth() === monthIndex;
      }).length,
      isActiveMonth: this.calendarActiveDate.getMonth() === monthIndex,
    }));
  }

  private buildCalendarWeeks(): void {
    const year = this.calendarActiveDate.getFullYear();
    const month = this.calendarActiveDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingEmptyDays = monthStart.getDay();
    const selectedDateKey = this.toDateKey(this.selectedCalendarDate);
    const todayDateKey = this.toDateKey(this.createDateOnly(new Date()));
    const calendarCells: CalendarDayCell[] = [];

    for (let index = 0; index < leadingEmptyDays; index++) {
      calendarCells.push({
        id: `empty-start-${index}`,
        date: null,
        dayNumber: null,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        events: [],
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = this.toDateKey(date);

      calendarCells.push({
        id: dateKey,
        date,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateKey === todayDateKey,
        isSelected: dateKey === selectedDateKey,
        events: this.releaseEventsByDate.get(dateKey) || [],
      });
    }

    while (calendarCells.length % 7 !== 0) {
      calendarCells.push({
        id: `empty-end-${calendarCells.length}`,
        date: null,
        dayNumber: null,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        events: [],
      });
    }

    this.calendarWeeks = [];
    for (let index = 0; index < calendarCells.length; index += 7) {
      this.calendarWeeks.push(calendarCells.slice(index, index + 7));
    }
  }

  private createDateOnly(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private createMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
