import moment, { Moment } from 'moment';
import { pick } from 'ramda';

export interface ParsedUTCOffset {
  op: 'add' | 'sub';
  offset: string;
  hours: number;
  minutes: number;
  timezone: string;
}

const TimezoneFixedUTCMap: Record<string, string> = {
  'UTC-11': 'Pacific/Pago_Pago',
  'UTC-10': 'Pacific/Honolulu',
  'UTC-9': 'America/Anchorage',
  'UTC-8': 'America/Los_Angeles',
  'UTC-7': 'America/Denver',
  'UTC-6': 'America/Chicago',
  'UTC-5': 'America/Detroit',
  'UTC-4': 'America/Caracas',
  'UTC-3': 'America/Sao_Paulo',
  'UTC-2': 'Atlantic/South_Georgia',
  'UTC-1': 'Atlantic/Cape_Verde',
  'UTC+0': 'UTC',
  'UTC+1': 'Africa/Lagos',
  'UTC+2': 'Africa/Cairo',
  'UTC+3': 'Africa/Addis_Ababa',
  'UTC+4': 'Asia/Dubai',
  'UTC+5': 'Asia/Karachi',
  'UTC+6': 'Asia/Dhaka',
  'UTC+7': 'Asia/Bangkok',
  'UTC+8': 'Asia/Shanghai',
  'UTC+9': 'Asia/Seoul',
  'UTC+10': 'Asia/Brisbane',
  'UTC+11': 'Australia/Sydney',
  'UTC+12': 'Pacific/Norfolk',
  'UTC+13': 'Pacific/Tongatapu',
  'UTC+14': 'Pacific/Apia',
};

export const parseUTCOffset = (utcOffset = ''): ParsedUTCOffset => {
  const [hours, minutes] = utcOffset.split(':');

  let _hours;
  let op: ParsedUTCOffset['op'] = 'add';
  let offset = '+';

  if (hours[0] === '-' || hours[0] === '+') {
    if (hours[0] === '-') {
      op = 'sub';
      offset = '-';
    }
    _hours = parseInt(hours.substr(1)) || 0;
  } else {
    _hours = parseInt(hours) || 0;
  }

  const _minutes = (parseInt(minutes) || 0) % 60;

  _hours = _hours % 24;
  offset += _hours < 10 ? `0${_hours}` : _hours;
  offset += ':';
  offset += _minutes < 10 ? `0${_minutes}` : _minutes;

  return {
    op,
    offset,
    hours: _hours,
    minutes: _minutes,
    timezone: TimezoneFixedUTCMap[`UTC${op === 'add' ? '+' : '-'}${_hours}`] || 'UTC',
  };
};

export type UTCOffset = string | ParsedUTCOffset;

/**
 * This method assumes every input that every input is a local input
 * All it does is add to or subtract from
 *
 * NOTE: Only use when wanting to get the utc date from an offset of a local date
 *
 * We reverse ops in order to catch up with passed date, i.e.
 *
 * If we are requesting a +1 of 00:00, then its actually stored in system as 23:00
 * In the above case we are subtracting from the local time to match the appropriate utc
 * Hence the toUTC option for such cases
 *
 * In nutshell,
 *  toUTC=true takes from offset date to utc date
 *  toUTC=false takes from a utc date to offset date
 * The computation takes place with the utc date.
 */
export function applyUTCOffset(
  utcInput: Moment | Date | moment.MomentInput,
  utcOffset: UTCOffset = '+0',
  toUTC = false,
): Moment {
  if (typeof utcOffset === 'string') {
    utcOffset = parseUTCOffset(utcOffset);
  }

  let utcMoment: Moment;
  if (moment.isMoment(utcInput)) {
    utcMoment = utcInput as Moment;
  } else {
    utcMoment = moment(utcInput);
  }

  const duration = pick(['hours', 'minutes'], utcOffset);
  const op = toUTC ? (utcOffset.op === 'add' ? 'sub' : 'add') : utcOffset.op;

  if (op === 'add') {
    utcMoment = utcMoment.add(duration);
  } else {
    utcMoment = utcMoment.subtract(duration);
  }

  return utcMoment;
}
