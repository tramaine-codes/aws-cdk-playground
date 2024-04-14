import { addMinutes, getUnixTime } from 'date-fns';

export class Time {
  addMinutes = (date: Date, minutes: number) => addMinutes(date, minutes);

  now = () => new Date();

  unixTime = (date: Date) => getUnixTime(date);

  static addMinutes = (date: Date, minutes: number) =>
    new Time().addMinutes(date, minutes);

  static now = () => new Time().now();

  static unixTime = (date: Date) => new Time().unixTime(date);
}
