import moment from 'moment';

import { applyUTCOffset } from '../date.utils';

const formatWithoutMillis = (m: moment.Moment) => m.format('YYYY-MM-DDTHH:mm');

describe('date.utils', () => {
  describe('applyUTCOffset', () => {
    it('should applyUTCOffset to a given date, +1', () => {
      expect(
        applyUTCOffset(moment(), '+1').isSame(moment.utc().add({ hour: 1 }), 'minutes'),
      ).toBeTruthy();
    });

    it('should applyUTCOffset to a given date, -1', () => {
      expect(
        applyUTCOffset(moment(), '-1').isSame(moment.utc().subtract({ hour: 1 }), 'minutes'),
      ).toBeTruthy();
    });

    it('should applyUTCOffset to a given date, +1 : reverse', () => {
      expect(
        applyUTCOffset(moment(), '+1', true).isSame(moment.utc().subtract({ hour: 1 }), 'minutes'),
      ).toBeTruthy();
    });

    it('should applyUTCOffset to a given date, -1 : reverse', () => {
      expect(
        applyUTCOffset(moment(), '-1', true).isSame(moment.utc().add({ hour: 1 }), 'minutes'),
      ).toBeTruthy();
    });

    it('should apply from utc back to foreign a given date, +2', () => {
      expect(formatWithoutMillis(applyUTCOffset(moment.utc(), '+2'))).toEqual(
        formatWithoutMillis(moment.utc().add({ hour: 2 })),
      );
    });

    it('should apply from utc back to foreign a given date, -1', () => {
      expect(formatWithoutMillis(applyUTCOffset(moment.utc(), '-1'))).toEqual(
        formatWithoutMillis(moment.utc().subtract({ hour: 1 })),
      );
    });

    it('should apply from utc back to foreign a given date, +1 : reverse', () => {
      expect(formatWithoutMillis(applyUTCOffset(moment.utc(), '+1', true))).toEqual(
        formatWithoutMillis(moment.utc().subtract({ hour: 1 })),
      );
    });

    it('should apply from utc back to foreign a given date, -1 : reverse', () => {
      expect(formatWithoutMillis(applyUTCOffset(moment.utc(), '-1', true))).toEqual(
        formatWithoutMillis(moment.utc().add({ hour: 1 })),
      );
    });
  });
});
