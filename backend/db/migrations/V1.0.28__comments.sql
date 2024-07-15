SET search_path TO pay_transparency;

-- add description column to calculation_code table
alter table calculation_code add column description text;

-- add descriptions to each calculation_code in the table
update calculation_code set description='The gender code (M, X or U) of the reference gender for the entire report. The reference gender is defined by the following rule:

The first gender from the ordered list [M, U, X] which has at least 10 people who earned non-zero hourly pay. The reference gender code may be null if none of the genders meet the above criteria. W is never selected as the reference gender code.

In other words: M is the preferred reference gender category, but if that category doesn''t have enough people earning non-zero hourly pay then the second option (X) is chosen. If that category also doesn''t have enough people earning non-zero hourly pay then the third option (U) is chosen. If none of the above, the reference gender code is suppressed (i.e. null is assigned).'
where calculation_code='REFERENCE_GENDER_CATEGORY_CODE';

update calculation_code set description='Mean hourly pay difference - There are four separate calculations in this group. Each is a measure of the difference in mean hourly pay between the reference gender category and a specific gender category (one of: M, W, X or U). Expressed as a percentage of the mean hourly pay of the reference gender category, and calculated as follows:
`(meanHourlyPayRef - meanHourlyPay[Gender]) / meanHourlyPayRef) * 100`

Where "meanHourlyPayRef" is the mean hourly pay of the reference gender category.

If the number of people in the specific gender category who earn hourly pay is less than 10 then the calculation is suppressed (i.e. null is assigned).'
where calculation_code in ('MEAN_HOURLY_PAY_DIFF_M','MEAN_HOURLY_PAY_DIFF_W','MEAN_HOURLY_PAY_DIFF_X','MEAN_HOURLY_PAY_DIFF_U');

update calculation_code set description='Median hourly pay difference - There are four separate calculations in this group. Each is a measure of the difference in median hourly pay between the reference gender category and a specific gender category (one of: M, W, X or U). Expressed as a percentage of the median hourly pay of the reference gender category, and calculated as follows:
`(medianHourlyPayRef - medianHourlyPay[Gender]) / medianHourlyPayRef) * 100`

Where "medianHourlyPayRef" is the median hourly pay of the reference gender category.

If the number of people in the specific gender category who earn hourly pay is less than 10 then the calculation is suppressed (i.e. null is assigned).'
where calculation_code in ('MEDIAN_HOURLY_PAY_DIFF_M','MEDIAN_HOURLY_PAY_DIFF_W','MEDIAN_HOURLY_PAY_DIFF_X','MEDIAN_HOURLY_PAY_DIFF_U');

update calculation_code set description='Mean overtime pay difference - There are four separate calculations in this group. Each is a measure of the difference in mean overtime pay between the reference gender category and a specific gender category (one of: M, W, X or U). Expressed as a percentage of the mean overtime pay of the reference gender category, and calculated as follows:
`(meanOvertimePayRef - meanOvertimePay[Gender]) / meanOvertimePayRef) * 100`

Where "meanOvertimePayRef" is the mean overtime pay of the reference gender category.

If the number of people in the specific gender category who earn overtime pay is less than 10 then the calculation is suppressed (i.e. null is assigned).'
where calculation_code in ('MEAN_OT_PAY_DIFF_M','MEAN_OT_PAY_DIFF_W','MEAN_OT_PAY_DIFF_X','MEAN_OT_PAY_DIFF_U');

update calculation_code set description='Median overtime pay difference - There are four separate calculations in this group. Each is a measure of the difference in median overtime pay between the reference gender category and a specific gender category (one of: M, W, X or U). Expressed as a percentage of the median overtime pay of the reference gender category, and calculated as follows:
`(medianOvertimePayRef - medianOvertimePay[Gender]) / medianOvertimePayRef) * 100`

Where "medianOvertimePayRef" is the median overtime pay of the reference gender category.

If the number of people in the specific gender category who earn overtime pay is less than 10 then the calculation is suppressed (i.e. null is assigned).'
where calculation_code in ('MEDIAN_OT_PAY_DIFF_M','MEDIAN_OT_PAY_DIFF_W','MEDIAN_OT_PAY_DIFF_X','MEDIAN_OT_PAY_DIFF_U');

update calculation_code set description='Mean overtime hours difference - There are four separate calculations in this group. Each is the difference between the mean number of overtime hours worked by people in a specific gender category (one of: M, W, X or U) and the mean number of overtime hours worked by people in the reference gender category.
`meanOvertimeHours[Gender] - meanOvertimeHoursRef`

Where "meanOvertimeHoursRef" is the mean number of overtime hours worked by people in the reference gender category.

If the number of people in the specific gender category who worked overtime hours is less than 10 then the calculation is suppressed (i.e. null is assigned).'
where calculation_code in ('MEAN_OT_HOURS_DIFF_M','MEAN_OT_HOURS_DIFF_W','MEAN_OT_HOURS_DIFF_X','MEAN_OT_HOURS_DIFF_U');

update calculation_code set description='Median overtime hours difference - There are four separate calculations in this group. Each is the difference between the median number of overtime hours worked by people in a specific gender category (one of: M, W, X or U) and the median number of overtime hours worked by people in the reference gender category.
`medianOvertimeHours[Gender] - medianOvertimeHoursRef`

Where "medianOvertimeHoursRef" is the median number of overtime hours worked by people in the reference gender category.

If the number of people in the specific gender category who worked overtime hours is less than 10 then the calculation is suppressed (i.e. null is assigned).'
where calculation_code in ('MEDIAN_OT_HOURS_DIFF_M','MEDIAN_OT_HOURS_DIFF_W','MEDIAN_OT_HOURS_DIFF_X','MEDIAN_OT_HOURS_DIFF_U');

update calculation_code set description='Mean bonus pay difference - There are four separate calculations in this group. Each is a measure of the difference in mean bonus pay between the reference gender category and a specific gender category (one of: M, W, X or U). Expressed as a percentage of the mean bonus pay of the reference gender category, and calculated as follows:
`(meanBonusPayRef - meanBonusPay[Gender]) / meanBonusPayRef) * 100`

Where "meanBonusPayRef" is the mean bonus pay of the reference gender category.

If the number of people in the specific gender category who earn bonus pay is less than 10 then the calculation is suppressed (i.e. null is assigned).'
where calculation_code in ('MEAN_BONUS_PAY_DIFF_M','MEAN_BONUS_PAY_DIFF_W','MEAN_BONUS_PAY_DIFF_X','MEAN_BONUS_PAY_DIFF_U');

update calculation_code set description='Median bonus pay difference - There are four separate calculations in this group. Each is a measure of the difference in median bonus pay between the reference gender category and a specific gender category (one of: M, W, X or U). Expressed as a percentage of the median bonus pay of the reference gender category, and calculated as follows:
`(medianBonusPayRef - medianBonusPay[Gender]) / medianBonusPayRef) * 100`

Where "medianBonusPayRef" is the median bonus pay of the reference gender category.

If the number of people in the specific gender category who earn bonus pay is less than 10 then the calculation is suppressed (i.e. null is assigned).'
where calculation_code in ('MEDIAN_BONUS_PAY_DIFF_M','MEDIAN_BONUS_PAY_DIFF_W','MEDIAN_BONUS_PAY_DIFF_X','MEDIAN_BONUS_PAY_DIFF_U');

update calculation_code set description='Hourly pay in the 1st quartile - There are four separate calculations in this group. Each gives the percentage of people in the first (lowest paid) quartile who are from a specific gender category (one of M, W, X or U). The following calculation is used:
`numPeopleOfGenderInQ1[Gender] / numPeopleInQ1 * 100`

where "numPeopleInQ1" is the sum of people in gender categories that have at least 10 people. If the numerator is < 10 the calculation is suppressed (i.e. null is assigned).'
where calculation_code in ('HOURLY_PAY_PERCENT_QUARTILE_1_M','HOURLY_PAY_PERCENT_QUARTILE_1_W','HOURLY_PAY_PERCENT_QUARTILE_1_X','HOURLY_PAY_PERCENT_QUARTILE_1_U');

update calculation_code set description='Hourly pay in the 2nd quartile - There are four separate calculations in this group. Each gives the percentage of people in the second (low-middle) quartile who are from a specific gender category (one of M, W, X or U). The following calculation is used:
`numPeopleOfGenderInQ2[Gender] / numPeopleInQ2 * 100`

where "numPeopleInQ2" is the sum of people in gender categories that have at least 10 people. If the numerator is < 10 the calculation is suppressed (i.e. null is assigned).'
where calculation_code in ('HOURLY_PAY_PERCENT_QUARTILE_2_M','HOURLY_PAY_PERCENT_QUARTILE_2_W','HOURLY_PAY_PERCENT_QUARTILE_2_X','HOURLY_PAY_PERCENT_QUARTILE_2_U');

update calculation_code set description='Hourly pay in the 3rd quartile - There are four separate calculations in this group. Each gives the percentage of people in the third (upper-middle) quartile who are from a specific gender category (one of M, W, X or U). The following calculation is used:
`numPeopleOfGenderInQ3[Gender] / numPeopleInQ3 * 100`

where "numPeopleInQ3" is the sum of people in gender categories that have at least 10 people. If the numerator is < 10 the calculation is suppressed (i.e. null is assigned).'
where calculation_code in ('HOURLY_PAY_PERCENT_QUARTILE_3_M','HOURLY_PAY_PERCENT_QUARTILE_3_W','HOURLY_PAY_PERCENT_QUARTILE_3_X','HOURLY_PAY_PERCENT_QUARTILE_3_U');

update calculation_code set description='Hourly pay in the 4th quartile - There are four separate calculations in this group. Each gives the percentage of people in the forth (highest paid) quartile who are from a specific gender category (one of M, W, X or U). The following calculation is used:
`numPeopleOfGenderInQ4[Gender] / numPeopleInQ4 * 100`

where "numPeopleInQ4" is the sum of people in gender categories that have at least 10 people. If the numerator is < 10 the calculation is suppressed (i.e. null is assigned).'
where calculation_code in ('HOURLY_PAY_PERCENT_QUARTILE_4_M','HOURLY_PAY_PERCENT_QUARTILE_4_W','HOURLY_PAY_PERCENT_QUARTILE_4_X','HOURLY_PAY_PERCENT_QUARTILE_4_U');

update calculation_code set description='Percent receiving overtime pay - There are four separate calculations in this group. Each gives the percentage of people in a specific gender category (one of M, W, X or U) who receive overtime pay. The following calculation is used:
`numReceivingOvertimePay[Gender] / totalNum[Gender] * 100`

If the number of people in the specific gender category who received overtime pay is < 10 then the calculation is suppressed (i.e. null is assigned).'
where calculation_code in ('PERCENT_RECEIVING_OT_PAY_M','PERCENT_RECEIVING_OT_PAY_W','PERCENT_RECEIVING_OT_PAY_X','PERCENT_RECEIVING_OT_PAY_U');

update calculation_code set description='Percent receiving bonus pay - There are four separate calculations in this group. Each gives the percentage of people in a specific gender category (one of M, W, X or U) who receive bonus pay. The following calculation is used:
`numReceivingBonusPay[Gender] / totalNum[Gender] * 100`

If the number of people in the specific gender category who received bonus pay is < 10 then the calculation is suppressed (i.e. null is assigned).'
where calculation_code in ('PERCENT_RECEIVING_BONUS_PAY_M','PERCENT_RECEIVING_BONUS_PAY_W','PERCENT_RECEIVING_BONUS_PAY_X','PERCENT_RECEIVING_BONUS_PAY_U');



-- add comments to the schema and all tables and columns
comment on schema pay_transparency is 'This database schema holds the statistics and reports, including history, for companies that have leveraged BC''s pay transparency reporting tool.

The user inputted information from the form in the webapp is saved in the tables `pay_transparency_calculated_data` (which stores all the statistics for the report) and `pay_transparency_report` (which stores the remaining selectable information for the report). When a user updates a published report, the existing version is moved to the tables `calculated_data_history` and `report_history`. 

Users log in with a BCeID account, which must be associated with a BCeID Business account, and the required details are stored in the tables `pay_transparency_user` and `pay_transparency_company` respectively. Company name and address is included in the report. If the company details, such as address, changes, then the old details are stored in the table `company_history` so that old reports can be shown with the details of the company at that time.

Two lookup tables, `employee_count_range` and `naics_code`, hold the selectable options on the form which also appears on the report. Another lookup table, `calculation_code`, identifies all the statistics used on a report.';

comment on table pay_transparency_report is 'This table stores the latest versions of draft and published reports. Each report is submitted by a BCeID user, identified by `user_id`, and is associated with an employer with a BCeID Business account, identified by `company_id`.

Reports are created after the user submits the form in the webapp. Initially `report_status` will be ''draft'', but the user can choose to publish the report which changes it''s `report_status` to ''published''. The form allows the user to select `employee_count_range_id`, `naics_code`, `reporting_year`, `report_start_date`, `report_end_date`, `user_comment`, and `data_constraints`.

Each employer will have one published report per `reporting_year`. When a draft report is published, the existing published report (if there is one) will be copied into the `report_history` table. Once a report is published, the `report_id` will stay the same even if it is updated. `revision` keeps track of the number of times a report has been updated after being published.

Reports that have a `create_date` older than 30 days are locked on a schedule run daily. Reports with is_unlocked set to false, cannot be modified by the user. An admin can set `is_unlocked` to true, which will allow the user to publish a new report for the same `reporting_year`. After 3 days, it will automatically be locked again.

Draft reports that are older than 48 hours are deleted automatically on a schedule.';

comment on column pay_transparency_report.report_id is 'Primary unique ID for this report. Even when a published report is updated, this ID stays the same.';
comment on column pay_transparency_report.company_id is 'The employer (a BCeID Business) the report is made for. This references the primary key of `pay_transparency_company` table.';
comment on column pay_transparency_report.user_id is 'The user who created/modified this report. This references the primary key of `pay_transparency_user` table.';
comment on column pay_transparency_report.user_comment is 'User optionally fills this text area on the form, called ''Employer statement'', which is shown at the top of the report. This is for additional information about the employer.';
comment on column pay_transparency_report.employee_count_range_id is 'User selects range indicating the number of employees an employer has on the form, which is shown on the report. This references the primary key of `employee_count_range` table.';
comment on column pay_transparency_report.naics_code is 'User selects the NAICS code for their business on the form, which is shown on the report. This references the primary key of `naics_code` table.';
comment on column pay_transparency_report.report_start_date is 'Start date of the report, which is shown on the report, and always a year before the end date. The range could be a calendar year, fiscal year, school year, or any range the employer prefers. A user can choose either the start date or end date for the report on the form. The other date is automatically calculated.';
comment on column pay_transparency_report.report_end_date is 'End date of the report, which is shown on the report, and always a year before the end date. A user can choose either the start date or end date for the report on the form. The other date is automatically calculated.';
comment on column pay_transparency_report.create_date is 'The date and time when the first revision was inserted. This is used for locking published reports older than 30 days.';
comment on column pay_transparency_report.update_date is 'The date and time when this revision was modified. This is used for deleting draft reports older than 24 hours.';
comment on column pay_transparency_report.create_user is 'The username of the database user who created the record.';
comment on column pay_transparency_report.update_user is 'The username of the database user who modified the record.';
comment on column pay_transparency_report.report_status is 'Reports are first created with the status of ''Draft'' and the user can publish their report which changes the status to ''Published''.';
comment on column pay_transparency_report.revision is 'Every published report has a revision. Each time a published report is replaced the revision goes up.';
comment on column pay_transparency_report.data_constraints is 'User optionally fills this text area on the form, which is shown at the bottom of the report. This is for any relevant information, such as limitations, constraints, or dependencies, that may help explain the employers payroll data.';
comment on column pay_transparency_report.is_unlocked is 'This signifies when a published report can be modified or not. Draft reports can always be created regardless of this field.

When `is_unlocked` is true on a published report, then a draft report in the same `reporting_year` can be published overwriting the existing published report.

Published reports are unlocked for 30 days from the `create_date` before they are automatically locked by a schedule. Administrators can unlock a report, which will be locked again after 3 days from `report_unlock_date`.';
comment on column pay_transparency_report.reporting_year is 'User selects the calendar year this report is for. Each employer is limited to one report annually. This is distinct from the report''s start and end dates as employers may generate reports for any period, like a fiscal or school year, yet the specific year the report pertains to may not be discernible from those dates.';
comment on column pay_transparency_report.report_unlock_date is 'This date is set by an administrator and is used by a scheduled task to change `is_unlocked` to false after 3 days.';


comment on table report_history is 'This table stores the report information of old published reports that have been replaced with a new version. Old draft reports are not stored. When a published report is updated, the report''s information is copied from `pay_transparency_report` table to the `report_history` table. The purpose and meaning of the report information is described in the description of the `pay_transparency_report` table. Previous reports are not modified and are used as an internal archival record, and are not accessible to the end user.';
comment on column report_history.report_history_id is 'Primary unique id for this history report.';
comment on column report_history.report_id is 'The report that this id used to be in the `pay_transparency_report` table. Can be thought of as a grouping; the most recent published report, and all history reports for the same `reporting_year` will have the same `report_id`. This references the primary key of `pay_transparency_report` table.';
comment on column report_history.company_id is 'The employer (a BCeID Business) the report is made for. This references the primary key of `pay_transparency_company` table.';
comment on column report_history.user_id is 'The user who created/modified this report. This references the primary key of `pay_transparency_user` table.';
comment on column report_history.user_comment is 'User optionally fills this text area on the form, called ''Employer statement'', which is shown at the top of the report. This is for additional information about the employer.';
comment on column report_history.employee_count_range_id is 'User selects range indicating the number of employees an employer has on the form, which is shown on the report. This references the primary key of `employee_count_range` table.';
comment on column report_history.naics_code is 'User selects the NAICS code for their business on the form, which is shown on the report. This references the primary key of `naics_code` table.';
comment on column report_history.report_start_date is 'User selects the start date of the report, which is shown on the report. Start date is always a year before the end date. The range could be a calendar year, fiscal year, school year, or any range the employer prefers.';
comment on column report_history.report_end_date is 'User selects the end date of the report, which is shown on the report. End date is always a year after the start date.';
comment on column report_history.create_date is 'The date and time when the first revision was inserted into the `pay_transparency_report` table.';
comment on column report_history.update_date is 'The date and time when this revision was modified.';
comment on column report_history.create_user is 'The username of the database user who created the record in the `pay_transparency_report` table.';
comment on column report_history.update_user is 'The username of the database user who modified the record.';
comment on column report_history.report_status is 'History reports will always be ''Published''. Draft reports are never saved to history.';
comment on column report_history.revision is 'Every published report has a revision. Each time a published report is replaced the revision goes up.';
comment on column report_history.data_constraints is 'User optionally fills this text area on the form, which is shown at the bottom of the report. This is for any relevant information, such as limitations, constraints, or dependencies, that may help explain the employers payroll data.';
comment on column report_history.is_unlocked is 'History reports are not modified, so this field has no meaning in the `report_history` table. This field will always be ''true'' since reports must be unlocked before being replaced and moving to the history table.';
comment on column report_history.reporting_year is 'User selected the year this report is for. Each employer is limited to one report annually. This is distinct from the report''s start and end dates as employers may generate reports for any period, like a fiscal or school year, yet the specific year the report pertains to may not be discernible from those dates.';
comment on column report_history.report_unlock_date is 'History reports are not modified, so this field has no meaning in the `report_history` table.';


comment on table pay_transparency_calculated_data is 'This table holds the statistics for a company''s pay transparency report that shows any pay disparity between genders. Every report has 57 records (ie. statistics) in this table, collectively known as ''calculated data''. The records in this table are statistics calculated from the file submitted by users and are used in the report. Records are identified and described by a `calculation_code_id` from the `calculation_code` table. If insufficient data prevents a statistic from being calculated, a record is still created with a null value and `is_suppressed` set as true.

Calculated data linked to draft reports that are older than 48 hours are deleted automatically on a schedule.';
comment on column pay_transparency_calculated_data.calculated_data_id is 'The primary ID to identify this specific record in the table.';
comment on column pay_transparency_calculated_data.report_id is 'Identifies which report that this calculated data is associated with. This references the primary key of `pay_transparency_report` table.';
comment on column pay_transparency_calculated_data.calculation_code_id is 'Identifies which statistic this record is storing. References the primary key of `calculation_code` table.';
comment on column pay_transparency_calculated_data.value is 'The statistic that indicates any disparity in gender pay, which will be shown as a graph in the resulting report. If there is insufficient information to calculate the statistic, value will be null.';
comment on column pay_transparency_calculated_data.is_suppressed is 'Will be set to true if there is not enough information to calculate a statistic. Suppressed statistics are not included in the outputted report.';
comment on column pay_transparency_calculated_data.create_date is 'The date and time when this record was inserted. This is used for deleting calculated data records associated with draft reports that are older than 48 hours.';
comment on column pay_transparency_calculated_data.update_date is 'The date and time when this record was modified. Records cannot be modified from the webapp, instead the user is required to submit a new report.';
comment on column pay_transparency_calculated_data.create_user is 'The username of the database user who created the record.';
comment on column pay_transparency_calculated_data.update_user is 'The username of the database user who modified the record. Records cannot be modified from the webapp, instead the user is required to submit a new report.';


comment on table calculated_data_history is 'This table stores the calculated data associated with previous versions of published reports. When a report is updated, the report''s calculated data is transferred from `pay_transparency_calculated_data` table to the `calculated_data_history` table. The purpose and meaning of the calculated data is described in the comments of the `pay_transparency_calculated_data` table. The calculated data history is used as an internal archival record, and is not accessible to the end user.';
comment on column calculated_data_history.calculated_data_history_id is 'The primary ID to identify this specific record in the table';
comment on column calculated_data_history.calculated_data_id is 'The original ID before moving the record to the history table.';
comment on column calculated_data_history.report_history_id is 'Identifies which report that this calculated data history is associated with. This references the primary key of `report_history` table.';
comment on column calculated_data_history.report_id is 'The ID of the original report associated with the record.';
comment on column calculated_data_history.calculation_code_id is 'Identifies which statistic this record is storing. References the primary key of `calculation_code` table.';
comment on column calculated_data_history.value is 'The statistic that indicates any disparity in gender pay, which will be shown as a graph in the resulting report. If there is insufficient information to calculate the statistic, value will be null.';
comment on column calculated_data_history.is_suppressed is 'Will be set to true if there is not enough information to calculate a statistic. Suppressed statistics are not included in the outputted report.';
comment on column calculated_data_history.create_date is 'The date and time when this record was inserted into `pay_transparency_calculated_data`.';
comment on column calculated_data_history.update_date is 'The date and time when this record was last modified while in `pay_transparency_calculated_data`. Records in the history table are not modified.';
comment on column calculated_data_history.create_user is 'The username of the database user who created the record in `pay_transparency_calculated_data`.';
comment on column calculated_data_history.update_user is 'The username of the database user who modified the record in `pay_transparency_calculated_data`. Records in the history table are not modified.';


comment on table calculation_code is 'This is a lookup table of all 57 statistics, known as ''calculations'', that relate to calculating any disparity in gender pay such as the mean hourly pay difference. The webapp has the `calculation_code` in two places, when calculating the statistics to store in the `pay_transparency_calculated_data` table, and when adding the statistics in the report. These operations require looking up either the `calculation_code_id` or the `calculation_code` from this table.';
comment on column calculation_code.calculation_code_id is 'The ID of the calculation code which is referenced in the two `calculated_data` tables. The webapp uses this ID to lookup the `calculation_code` when retrieving the calculated data for use on the report.';
comment on column calculation_code.calculation_code is 'A unique, human readable string used to identify the algorithm for data calculation. The webapp uses this code to lookup the `calculation_code_id` to save the value in the `pay_transparency_calculated_data` table.';
comment on column calculation_code.description is 'An explanation of the formula used to perform this calculation.';

comment on table naics_code is 'This is a lookup table that stores only the 1st level (of 5 levels) codes of the current North American Industry Classification System (NAICS) data. The user is required to select a NAICS code for each report.

[North American Industry Classification System (NAICS) Canada 2022 Version 1.0](https://www23.statcan.gc.ca/imdb/pUtil.pl?Function=getNote&Id=1369825&NT=45)';
comment on column naics_code.naics_code is 'The NAICS code which is either a number (eg 11) or a range of numbers (eg 31-33).';
comment on column naics_code.naics_label is 'The name of the sector (eg ''Construction'') of the NAICS code.';
comment on column naics_code.naics_year is 'The year on which the code was created by Statistics Canada';
comment on column naics_code.effective_date is 'The minimum date for which the code can be visible to the users. ';
comment on column naics_code.expiry_date is 'A code will be visible to the users if the value is not set or the current date is not later than the date value of this column.';
comment on column naics_code.create_date is 'When the value was inserted/created';
comment on column naics_code.update_date is 'When the value was modified';
comment on column naics_code.create_user is 'The database user who initially created the record.';
comment on column naics_code.update_user is 'The database user who modified the record.';


comment on table employee_count_range is 'This is a lookup table that stores the employee count ranges, for example ''50-100''. The user selects from a list on the form how many employees their employer has which is recorded in the `pay_transparency_report` table.';
comment on column employee_count_range.employee_count_range_id is 'The primary unique id. Used in the two report tables.';
comment on column employee_count_range.employee_count_range is 'The name of this record which is shown to the user.';
comment on column employee_count_range.create_date is 'When the value was inserted/created.';
comment on column employee_count_range.update_date is 'When the value was modified.';
comment on column employee_count_range.effective_date is 'The minimum date for which the range can be visible to the users. ';
comment on column employee_count_range.expiry_date is 'The last day that this value will be shown to the user.';
comment on column employee_count_range.create_user is 'The database user who initially created the record.';
comment on column employee_count_range.update_user is 'The database user who modified the record.';


comment on table pay_transparency_user is 'Users log in with their BCeID account which must be associated with a BCeID business account. The unique ID''s of both accounts are stored to identify this user and business in future logins.';
comment on column pay_transparency_user.user_id is 'Primary unique id used in the two report tables.';
comment on column pay_transparency_user.bceid_user_guid is 'The unique id provided by the BCeID service to identify this user.';
comment on column pay_transparency_user.bceid_business_guid is 'The unique id provided the the BCeID service to identify which employer this user is associated with.';
comment on column pay_transparency_user.display_name is 'This is the full name of the user.';
comment on column pay_transparency_user.create_date is 'The date this user record was entered into the database.';
comment on column pay_transparency_user.update_date is 'The date this user record was last updated. The record is automatically updated every time the user logs in even if there are no changes.';


comment on table pay_transparency_company is 'These are the details provided by a BCeID Business account for a logged in user. The name and address will be included on a report.

If a user logs in without a BCeID Business account, or if the BCeID Business account is missing information, the login will not proceed and the record will not be created.';
comment on column pay_transparency_company.company_id is 'Primary unique ID for this company. Referenced on the `pay_transparency_report` table.';
comment on column pay_transparency_company.bceid_business_guid is 'The BCeID unique ID for this company. Used to associate a user with a company.';
comment on column pay_transparency_company.company_name is 'The name of the employer provided by BCeID account.';
comment on column pay_transparency_company.create_date is 'The date this company record was entered into the database.';
comment on column pay_transparency_company.update_date is 'The date this company record was last updated. The record is updated if there are changes. The old record is copied to the company_history table.';
comment on column pay_transparency_company.address_line1 is 'Street address provided by BCeID account.';
comment on column pay_transparency_company.address_line2 is 'Optional second address line provided by BCeID account.';
comment on column pay_transparency_company.city is 'City provided by BCeID account.';
comment on column pay_transparency_company.province is 'Province provided by BCeID account.';
comment on column pay_transparency_company.country is 'Country provided by BCeID account.';
comment on column pay_transparency_company.postal_code is 'Postal Code provided by BCeID account.';


comment on table company_history is 'This table stores the old company records. If a company has published a report, but has since changed their business address, this table stores the old company address so that generating the old report can display the company information that was originally provided for that report.';
comment on column company_history.company_history_id is 'Primary unique ID for this company history record.';
comment on column company_history.company_id is 'Primary unique ID for this company. Referenced on the `pay_transparency_company` table.';
comment on column company_history.bceid_business_guid is 'The BCeID unique ID for this company. Used to associate a user with a company.';
comment on column company_history.company_name is 'The name of the employer provided by BCeID account.';
comment on column company_history.create_date is 'The date this company record was entered into the `pay_transparency_company` table.';
comment on column company_history.update_date is 'The date this company record was last updated.';
comment on column company_history.address_line1 is 'Street address provided by BCeID account.';
comment on column company_history.address_line2 is 'Optional second address line provided by BCeID account.';
comment on column company_history.city is 'City provided by BCeID account.';
comment on column company_history.province is 'Province provided by BCeID account.';
comment on column company_history.country is 'Country provided by BCeID account.';
comment on column company_history.postal_code is 'Postal Code provided by BCeID account.';


comment on view reports_view is 'This view is a union of the `pay_transparency_report` table and `report_history` table. The columns `naics_code.naics_label` and `employee_count_range.employee_count_range`, as well as the full address and company name from `pay_transparency_company` have been included in this view.

This view allows the webapp to fetch the most recent report as well as the historical versions of the report in one query.

Only one new column is created in this view, `report_change_id`, which is used to associate this view with the `calculated_data_view` view. The `is_unlocked` column from the two report tables is not included in this view.';
comment on column reports_view.report_id is 'Primary unique ID for this report. Even when a published report is updated, this ID stays the same.';
comment on column reports_view.report_change_id is 'This id is created from merging the `report_id` from the `pay_transparency_report` table and `report_history_id` from the `report_history` table. It is used to associate this view with the `calculated_data_view` view.';
comment on column reports_view.company_id is 'The employer (a BCeID Business) the report is made for. This references the primary key of `pay_transparency_company` table.';
comment on column reports_view.user_id is 'The user who created/modified this report. This references the primary key of `pay_transparency_user` table.';
comment on column reports_view.user_comment is 'User optionally fills this text area on the form, called ''Employer statement'', which is shown at the top of the report. This is for additional information about the employer.';
comment on column reports_view.employee_count_range_id is 'User selects range indicating the number of employees an employer has on the form, which is shown on the report. This references the primary key of `employee_count_range` table.';
comment on column reports_view.naics_code is 'User selects the NAICS code for their business on the form, which is shown on the report. This references the primary key of `naics_code` table.';
comment on column reports_view.report_start_date is 'User selects the start date of the report, which is shown on the report. Start date is always a year before the end date. The range could be a calendar year, fiscal year, school year, or any range the employer prefers.';
comment on column reports_view.report_end_date is 'User selects the end date of the report, which is shown on the report. End date is always a year after the start date.';
comment on column reports_view.create_date is 'The date and time when the first revision was inserted. This is used for locking published reports older than 30 days.';
comment on column reports_view.update_date is 'The date and time when this revision was modified. This is used for deleting draft reports older than 24 hours.';
comment on column reports_view.create_user is 'The username of the database user who created the record.';
comment on column reports_view.update_user is 'The username of the database user who modified the record.';
comment on column reports_view.report_status is 'Reports are first created with the status of ''Draft'' and the user can publish their report which changes the status to ''Published''.';
comment on column reports_view.revision is 'Every published report has a revision. Each time a published report is replaced the revision goes up.';
comment on column reports_view.data_constraints is 'User optionally fills this text area on the form, which is shown at the bottom of the report. This is for any relevant information, such as limitations, constraints, or dependencies, that may help explain the employers payroll data.';
comment on column reports_view.reporting_year is 'User selects the year this report is for. Each employer is limited to one report annually. This is distinct from the report''s start and end dates as employers may generate reports for any period, like a fiscal or school year, yet the specific year the report pertains to may not be discernible from those dates.';
comment on column reports_view.report_unlock_date is 'This date is set by an administrator and is used by a scheduled task to change `is_unlocked` to false after 3 days.';
comment on column reports_view.naics_code_label is 'The name of the sector (eg ''Construction'') of the NAICS code.';
comment on column reports_view.company_name is 'The name of the employer provided by BCeID account.';
comment on column reports_view.company_bceid_business_guid is 'The BCeID unique ID for this company. Used to associate a user with a company.';
comment on column reports_view.company_address_line1 is 'Street address provided by BCeID account.';
comment on column reports_view.company_address_line2 is 'Optional second address line provided by BCeID account.';
comment on column reports_view.company_city is 'City provided by BCeID account.';
comment on column reports_view.company_province is 'Province provided by BCeID account.';
comment on column reports_view.company_country is 'Country provided by BCeID account.';
comment on column reports_view.company_postal_code is 'Postal Code provided by BCeID account.';
comment on column reports_view.employee_count_range is 'The name of the employee count record, for example ''50-100''.';


comment on view calculated_data_view is 'This view is a union of the `pay_transparency_calculated_data` table and `calculated_data_history` table. The column `calculation_code.calculation_code` have been included in this view.

This view allows the webapp to fetch the calculated data for any report regardless of if that report is in the history table or not. It is used in combination with the `reports_view` view to fetch a single report with that report''s history and also get the calculated data from this view.

There are no new columns in this view, but some columns from the two `calculated_data` tables are not included in this view.';
comment on column calculated_data_view.calculated_data_id is 'The primary ID to identify this specific record in the table.';
comment on column calculated_data_view.report_id is 'Identifies which report that this calculated data is associated with. This references the primary key of `pay_transparency_report` table.';
comment on column calculated_data_view.calculation_code_id is 'Identifies which statistic this record is storing. References the primary key of `calculation_code` table.';
comment on column calculated_data_view.value is 'The statistic that indicates any disparity in gender pay, which will be shown as a graph in the resulting report. If there is insufficient information to calculate the statistic, value will be null.';
comment on column calculated_data_view.is_suppressed is 'Will be set to true if there is not enough information to calculate a statistic. Suppressed statistics are not included in the outputted report.';
comment on column calculated_data_view.calculation_code is 'A unique, human readable string used to identify the algorithm for data calculation. The webapp uses this code to lookup the `calculation_code_id` to save the value in the `pay_transparency_calculated_data` table.';
