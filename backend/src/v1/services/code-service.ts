import moment from 'moment';
import prisma from '../prisma/prisma-client';

const cacheExpirationTimeHours = 25;

let employeeCountRangeCache: any[] = [];
let employeeCountRangeCacheExpiryDate: moment.Moment = null;

const codeService = {

  /* This function returns a list of untyped objects representing 
  employee count ranges.
  The employee count ranges are stored in the database.  Because the values
  change infrequently, we reduce roundtrips to the database by caching (in memory)
  the full list of all values. */
  async getAllEmployeeCountRanges() {

    const now = moment();

    if (employeeCountRangeCacheExpiryDate && moment(now).isAfter(employeeCountRangeCacheExpiryDate)) {
      //Cache has expired.  Clear it
      employeeCountRangeCache = [];
      employeeCountRangeCacheExpiryDate = null;
    }

    //No cached values, so fetch from database
    if (!employeeCountRangeCache || !employeeCountRangeCache.length) {
      employeeCountRangeCache = await prisma.employee_count_range.findMany({
        select: {
          employee_count_range_id: true,
          employee_count_range: true
        },
        where: {
          effective_date: {
            lte: now.toDate(),
          },
          expiry_date: {
            gt: now.toDate(),
          },
        }
      });

      //Set the cache to expire at some time in the future.
      employeeCountRangeCacheExpiryDate = moment().add(cacheExpirationTimeHours, "hours")
    }

    return employeeCountRangeCache;
  }

};

export { codeService };

