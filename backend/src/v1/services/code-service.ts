import { LocalDateTime, convert } from '@js-joda/core';
import prisma from '../prisma/prisma-client';

const cacheExpirationTimeHours = 25;

let employeeCountRangeCache: any[] = [];
let employeeCountRangeCacheExpiryDate: LocalDateTime = null;
let naicsCodesCache: any[] = [];
let naicsCodesCacheExpiryDate: LocalDateTime = null;
let calculationCodeAndIdCache: any; //keys are calc codes, values are calc code ids

const codeService = {
  /* This function returns a list of untyped objects representing 
  employee count ranges.
  The employee count ranges are stored in the database.  Because the values
  change infrequently, we reduce roundtrips to the database by caching (in memory)
  the full list of all values. */
  async getAllEmployeeCountRanges() {
    const now = LocalDateTime.now();

    if (
      employeeCountRangeCacheExpiryDate &&
      now.isAfter(employeeCountRangeCacheExpiryDate)
    ) {
      //Cache has expired.  Clear it
      employeeCountRangeCache = [];
      employeeCountRangeCacheExpiryDate = null;
    }

    //No cached values, so fetch from database

    if (!employeeCountRangeCache?.length) {
      employeeCountRangeCache = await prisma.employee_count_range.findMany({
        select: {
          employee_count_range_id: true,
          employee_count_range: true,
        },
        //Only fetch records that are within the effective time range
        //i.e. current time >= effective date and either no expiry date is given,
        //or expiry date is in the future
        where: {
          effective_date: {
            lte: convert(now).toDate(),
          },
          OR: [
            {
              expiry_date: null,
            },
            {
              expiry_date: {
                gte: convert(now).toDate(),
              },
            },
          ],
        },
      });

      //Set the cache to expire at some time in the future.
      employeeCountRangeCacheExpiryDate = LocalDateTime.now().plusHours(
        cacheExpirationTimeHours,
      );
    }

    return employeeCountRangeCache;
  },

  /* This function returns a list of untyped objects representing 
  NAICS Codes.
  The NAICS Codes are stored in the database.  Because the values
  change infrequently, we reduce roundtrips to the database by caching (in memory)
  the full list of all values. */
  async getAllNaicsCodes() {
    const now = LocalDateTime.now();

    if (naicsCodesCacheExpiryDate && now.isAfter(naicsCodesCacheExpiryDate)) {
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
        },
        where: {
          effective_date: {
            lte: convert(now).toDate(),
          },
          OR: [
            {
              expiry_date: null,
            },
            {
              expiry_date: {
                gte: convert(now).toDate(),
              },
            },
          ],
        },
      });

      //Set the cache to expire at some time in the future.
      naicsCodesCacheExpiryDate = LocalDateTime.now().plusHours(
        cacheExpirationTimeHours,
      );
    }

    return naicsCodesCache;
  },

  /* This function returns an object in which the keys are calculation codes, and the 
  values are the corresponding calculation code IDs.
  The Calculation Codes are stored in the database.  Because the values
  change infrequently, we reduce roundtrips to the database by caching (in memory)
  the full list of all values. */
  async getAllCalculationCodesAndIds() {
    //No cached values, so fetch from database
    if (!Object.keys(calculationCodeAndIdCache ?? {}).length) {
      const calculationCodes = await prisma.calculation_code.findMany({
        select: {
          calculation_code_id: true,
          calculation_code: true,
        },
      });
      calculationCodeAndIdCache = {};
      calculationCodes.forEach((c) => {
        calculationCodeAndIdCache[c.calculation_code] = c.calculation_code_id;
      });
    }

    return calculationCodeAndIdCache;
  },
};

export { codeService };
