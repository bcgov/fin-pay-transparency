import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { CSV_COLUMNS } from './validate-service';

interface CalculatedAmount {
  key: string,
  value: string,
  isSuppressed: boolean
}
/*
This is a helper class which can be used to incrementally collect values
representing separate measurements of a certain type. For example, it can 
collect a list of values representing Bonus Pay for different people.
The class insits that each value value be associated with a category (for 
example, a gender category). There are functions to calculate statistics
on the list of values in each category subset.

Use of this class to collect values might look something like this:
  
  const bonusPayStats = new StatisticsHelper();
  people.forEach(person => {
    bonusPayStats.push(person.bonusPay, person.gender);
  });

Statistics broken down by category (gender in this example), can be
accessed as follows: 

  const meanBonusPayMale = bonusPayStats.getMean("male");
  const meanBonusPayFemale = bonusPayStats.getMean("female");
  const medianBonusPayMale = bonusPayStats.getMedian("male");
  const medianBonusPayFemale = bonusPayStats.getMedian("female");
*/
class StatisticsHelper {

  dataByCategoryKey: any;
  isSorted: boolean;

  constructor() {
    this.dataByCategoryKey = {};
    this.isSorted = true;
  }

  push(value: number, categoryKey: string) {
    if (!categoryKey) {
      throw new Error('categoryKey must be specified')
    }
    if (!this.dataByCategoryKey.hasOwnProperty(categoryKey)) {
      this.dataByCategoryKey[categoryKey] = [];
    }
    this.dataByCategoryKey[categoryKey].push(value)
    this.isSorted = false;
  }

  /* Sort the the array of values in each category. */
  sortEachCategory() {
    if (this.isSorted) {
      return; //already sorted
    }
    Object.keys(this.dataByCategoryKey).forEach(k => {
      this.dataByCategoryKey[k].sort();
    });
  }

  getValues(categoryKey: string) {
    if (!categoryKey) {
      throw new Error('categoryKey must be specified')
    }
    const values = this.dataByCategoryKey.hasOwnProperty(categoryKey) ?
      this.dataByCategoryKey[categoryKey] :
      [];
    return values;
  }

  getCount(categoryKey: string) {
    const values = this.getValues(categoryKey);
    return values.length;
  }

  /* Calculate and return the mean (average) from the array of values
  associated with the given categoryKey */
  getMean(categoryKey: string) {
    const sum = this.getValues(categoryKey).reduce(
      (accumulator, v) => accumulator + v,
      0,
    );
    const avg = sum / this.getCount(categoryKey).length;
    return avg;
  }

  /* Calculate and return the median from the array of values
  associated with the given categoryKey */
  getMedian(categoryKey: string) {
    // The logic in this function relies on the array of values for
    // a given categoryKey being sorted.  Sort now to be sure.
    this.sortEachCategory();

    const values = this.getValues(categoryKey);
    if (!values?.length) {
      return 0;
    }
    if (values.length % 2 == 1) { //odd number of values
      return values[values.length / 2];
    }
    // Must be an even number of values.  
    // Return the average of the two middle values
    const index1 = values.length / 2;
    const index2 = index1 + 1;
    const avgOfTwo = (values[index1] + values[index2]) / 2;
    return avgOfTwo;
  }


}

const reportCalcService = {

  async calculateAll(csvReadable: Readable): Promise<CalculatedAmount[]> {
    const calculatedAmounts: CalculatedAmount[] = [];
    const csvParser = csvReadable
      .pipe(parse({
        columns: true,
        bom: true,
        trim: true,
        ltrim: true,
        skip_empty_lines: true,
        relax_column_count: true
      }));

    const hourlyPayStats = new StatisticsHelper();

    for await (const csvRecord of csvParser) {
      console.log(csvRecord);
      const hourlyPayDollars = reportCalcServicePrivate.getHourlyPayDollars(csvRecord);
      hourlyPayStats.push(hourlyPayDollars, csvRecord[CSV_COLUMNS.GENDER_CODE]);
    }
    return calculatedAmounts;
  }

}

const reportCalcServicePrivate = {
  /* Given a parsed csvRecord (represented as an object with column 
    names as keys), determine the hourly pay (in dollars).  This 
    involves either calculating the hourly pay from regular (annual) pay
    and regular hours worked, or from special salary */
  getHourlyPayDollars(csvRecord): number {
    return 0;
  }
}

export { CalculatedAmount, StatisticsHelper, reportCalcService, reportCalcServicePrivate };

