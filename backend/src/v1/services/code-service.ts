import moment from 'moment';
import prisma from '../prisma/prisma-client';

const cacheExpirationTimeHours = 25;

let employeeCountRangeCache: any[] = [];
let employeeCountRangeCacheExpiryDate: moment.Moment = null;
let naicsCodesCache: any[] = [];
let naicsCodesCacheExpiryDate: moment.Moment = null;

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

    if (!employeeCountRangeCache?.length) {
      employeeCountRangeCache = await prisma.employee_count_range.findMany({
        select: {
          employee_count_range_id: true,
          employee_count_range: true
        },
        //Only fetch records that are within the effective time range
        //i.e. current time >= effective date and either no expiry date is given, 
        //or expiry date is in the future
        where: {
          effective_date: {
            lte: now.toDate(),
          },
          OR: [
            {
              expiry_date: null
            },
            {
              expiry_date: {
                gt: now.toDate(),
              }
            }

          ]
        }
      });

      //Set the cache to expire at some time in the future.
      employeeCountRangeCacheExpiryDate = moment().add(cacheExpirationTimeHours, "hours")
    }

    return employeeCountRangeCache;
  },

  
  /* This function returns a list of untyped objects representing 
  NAICS Codes.
  The NAICS Codes are stored in the database.  Because the values
  change infrequently, we reduce roundtrips to the database by caching (in memory)
  the full list of all values. */
  async getAllNaicsCodes() {

    const now = moment();

    if (naicsCodesCacheExpiryDate && moment(now).isAfter(naicsCodesCacheExpiryDate)) {
      //Cache has expired.  Clear it
      naicsCodesCache = [];
      naicsCodesCacheExpiryDate = null;
    }

    //No cached values, so fetch from database
    if (!naicsCodesCache?.length) {
      naicsCodesCache = await prisma.naics_code.findMany({
        select: {
          naics_code: true,
          naics_label: true,
          naics_code_desc: true,          
        },
        where: {
          effective_date: {
            lte: now.toDate(),
          },
          OR: [
            {
              expiry_date: null
            },
            {
              expiry_date: {
                gt: now.toDate(),
              }
            }
          ]
        }
      });

      //Set the cache to expire at some time in the future.
      naicsCodesCacheExpiryDate = moment().add(cacheExpirationTimeHours, "hours")
    }

    return naicsCodesCache;
  },

};

export { codeService };

