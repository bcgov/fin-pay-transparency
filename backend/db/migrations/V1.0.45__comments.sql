SET search_path TO pay_transparency;

-- schema
comment on schema pay_transparency is 'This database schema holds the statistics and reports, including history, for companies that have leveraged BC''s Pay Transparency Reporting Tool (PTRT). It also manages information leveraged in the Admin Portal, such as the administrative users in the `admin_users` table and announcements in the `announcements` table.
The user inputted information from the form in the webapp is saved in the tables `pay_transparency_calculated_data` (which stores all the statistics for the report) and `pay_transparency_report` (which stores the remaining selectable information for the report). When a user updates a published report, the existing version is moved to the tables `calculated_data_history` and `report_history`.

Users log in with a BCeID account, which must be associated with a BCeID Business account, and the required details are stored in the tables `pay_transparency_user` and `pay_transparency_company` respectively. Company name and address is included in the report. If the company details, such as address, changes, then the old details are stored in the `company_history` table so that old reports can be shown with the details of the company at that time.

Two lookup tables, `employee_count_range` and `naics_code`, hold the selectable options on the form which also appears on the report. Another lookup table, `calculation_code`, identifies all the statistics used on a report.

BC Gov employees who administrate the PTRT through the Admin Portal site are stored in the `admin_users` table. The Admin users with the ''admin'' role can add or remove other admin users. All admin users can use the rest of the Admin Portal site. Keycloak is the source-of-truth for access permissions, this database stores a copy of the information to track admin user usage across the site and is automatically updated whenever a discrepancy between Keycloak and these records are found.

Admin users can create announcements which will be displayed to logged in users. Announcements are stored in the `announcements` table and can have resources stored in the `announcement_resources` table. The `announcement_resource_type` lookup table defines what kind of resources there are. Any modification to an announcement or it''s resources are stored in the tables `announcement_history` and `announcement_resource_history`.

The `announcement_status` table keeps track of which announcements are shown to the user. Announcements can be given a time range when they are shown to the user and are automatically expired after that time frame. A scheduled task will delete any announcement that expired or was archived over 90 days ago.

Errors specifically from users uploading files is stored in the `user_error` table.';

-- pay_transparency_report
comment on table pay_transparency_report is 'This table stores the latest versions of draft and published reports. Each report is submitted by a BCeID user, identified by `user_id`, and is associated with an employer with a BCeID Business account, identified by `company_id`.
Reports are created after the user submits the form in the webapp. Initially `report_status` will be ''draft'', but the user can choose to publish the report which changes it''s `report_status` to ''published''. The form allows the user to select `employee_count_range_id`, `naics_code`, `reporting_year`, `report_start_date`, `report_end_date`, `user_comment`, and `data_constraints`.

Each employer will have one published report per `reporting_year`. When a draft report is published, the existing published report (if there is one) will be copied into the `report_history` table. Once a report is published, the `report_id` will stay the same even if it is updated. `revision` keeps track of the number of times a report has been updated after being published.

Reports that have a `create_date` older than 30 days are locked on a schedule run daily. Reports with `is_unlocked` set to false, cannot be modified by the user. An admin can set `is_unlocked` to true, which will allow the user to publish a new report for the same `reporting_year`. After 3 days, it will automatically be locked again. Changes in `is_unlocked` is also stored in `report_history` table which is used to show admin users how frequently a report has been unlocked.

Draft reports that are older than 48 hours are deleted automatically on a schedule.';

comment on column pay_transparency_report.report_id is 'Primary unique ID for this report. Even when a published report is updated, this ID stays the same.';
comment on column pay_transparency_report.company_id is 'The employer (a BCeID Business) the report is made for. This references the primary key of `pay_transparency_company` table.';
comment on column pay_transparency_report.user_id is 'The user who created/modified this report. This references the primary key of `pay_transparency_user` table.';
comment on column pay_transparency_report.user_comment is 'User optionally fills this text area on the form, called "Employer statement", which is shown at the top of the report. This is for additional information about the employer.';
comment on column pay_transparency_report.employee_count_range_id is 'User selects range indicating the number of employees an employer has on the form, which is shown on the report. This references the primary key of `employee_count_range` table.';
comment on column pay_transparency_report.naics_code is 'User selects the NAICS code for their business on the form, which is shown on the report. This references the primary key of `naics_code` table.';
comment on column pay_transparency_report.report_start_date is 'Start date of the report, which is shown on the report, and always a year before the end date. The range could be a calendar year, fiscal year, school year, or any range the employer prefers. A user can choose either the start date or end date for the report on the form. The other date is automatically calculated.';
comment on column pay_transparency_report.report_end_date is 'End date of the report, which is shown on the report, and always a year before the end date. A user can choose either the start date or end date for the report on the form. The other date is automatically calculated.';
comment on column pay_transparency_report.create_date is 'The date and time when the first `revision` was inserted. This is used for locking published reports older than 30 days.';
comment on column pay_transparency_report.update_date is 'The date and time when this `revision` was modified. This is used for deleting draft reports older than 24 hours.';
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
comment on column pay_transparency_report.admin_user_id is 'Admin users can lock a report which updates `report_unlock_date` and `admin_modified_date`. They can also look at reports which updates `admin_last_access_date`.';
comment on column pay_transparency_report.admin_modified_date is 'The time when an admin user locked or unlocked a report.';
comment on column pay_transparency_report.admin_last_access_date is 'The time when an admin user last looked at this report.';

-- report_history
comment on table report_history is 'This table stores the report information of old published reports that have been replaced with a new version. Old draft reports are not stored. When a published report is updated, the report''s information is copied from `pay_transparency_report` table to the `report_history` table. The purpose and meaning of the report information is described in the description of the `pay_transparency_report` table. Previous reports are not modified and are used as an internal archival record, and are not accessible to the end user. Admin users use this table to see a history of when reports were locked or unlocked.';
comment on column report_history.report_history_id is 'Primary unique id for this history report.';
comment on column report_history.report_id is 'The report that this id used to be in the `pay_transparency_report` table. Can be thought of as a grouping; the most recent published report, and all history reports for the same `reporting_year` will have the same `report_id`. This references the primary key of `pay_transparency_report` table.';
comment on column report_history.company_id is 'The employer (a BCeID Business) the report is made for. This references the primary key of `pay_transparency_company` table.';
comment on column report_history.user_id is 'The user who created/modified this report. This references the primary key of `pay_transparency_user` table.';
comment on column report_history.user_comment is 'User optionally fills this text area on the form, called "Employer statement", which is shown at the top of the report. This is for additional information about the employer.';
comment on column report_history.employee_count_range_id is 'User selects range indicating the number of employees an employer has on the form, which is shown on the report. This references the primary key of `employee_count_range` table.';
comment on column report_history.naics_code is 'User selects the NAICS code for their business on the form, which is shown on the report. This references the primary key of `naics_code` table.';
comment on column report_history.report_start_date is 'User selects the start date of the report, which is shown on the report. Start date is always a year before the end date. The range could be a calendar year, fiscal year, school year, or any range the employer prefers.';
comment on column report_history.report_end_date is 'User selects the end date of the report, which is shown on the report. End date is always a year after the start date.';
comment on column report_history.create_date is 'The date and time when the first `revision` was inserted into the `pay_transparency_report` table.';
comment on column report_history.update_date is 'The date and time when this `revision` was modified.';
comment on column report_history.create_user is 'The username of the database user who created the record in the `pay_transparency_report` table.';
comment on column report_history.update_user is 'The username of the database user who modified the record.';
comment on column report_history.report_status is 'History reports will always be ''Published''. Draft reports are never saved to history.';
comment on column report_history.revision is 'Every published report has a revision. Each time a published report is replaced the revision goes up.';
comment on column report_history.data_constraints is 'User optionally fills this text area on the form, which is shown at the bottom of the report. This is for any relevant information, such as limitations, constraints, or dependencies, that may help explain the employers payroll data.';
comment on column report_history.is_unlocked is 'History reports are not modified, so this field has no meaning in the `report_history` table. This field will always be ''true'' since reports must be unlocked before being replaced and moving to the history table.';
comment on column report_history.reporting_year is 'User selected the year this report is for. Each employer is limited to one report annually. This is distinct from the report''s start and end dates as employers may generate reports for any period, like a fiscal or school year, yet the specific year the report pertains to may not be discernible from those dates.';
comment on column report_history.report_unlock_date is 'History reports are not modified, so this field has no meaning in the `report_history` table.';
comment on column report_history.admin_user_id is 'Admin users can lock a report which updates `report_unlock_date` and `admin_modified_date`. They can also look at reports which updates `admin_last_access_date`.';
comment on column report_history.admin_modified_date is 'The time when an admin user locked or unlocked a report.';
comment on column report_history.admin_last_access_date is 'The time when an admin user last looked at this report.';

-- pay_transparency_calculated_data
comment on table pay_transparency_calculated_data is 'This table holds the statistics for a company''s pay transparency report that shows any pay disparity between genders. Every report has 57 records (ie. statistics) in this table, collectively known as ''calculated data''. The records in this table are statistics calculated from the file submitted by users and are used in the report. Records are identified and described by a `calculation_code_id` from the `calculation_code` table. If insufficient data prevents a statistic from being calculated, a record is still created with a null `value` and `is_suppressed` set as true.
Calculated data linked to draft reports that are older than 48 hours are deleted automatically on a schedule.';

comment on column pay_transparency_calculated_data.calculated_data_id is 'The primary ID to identify this specific record in the table.';
comment on column pay_transparency_calculated_data.report_id is 'Identifies which report that this calculated data is associated with. This references the primary key of `pay_transparency_report` table.';
comment on column pay_transparency_calculated_data.calculation_code_id is 'Identifies which statistic this record is storing. References the primary key of `calculation_code` table.';
comment on column pay_transparency_calculated_data.value is 'The statistic that indicates any disparity in gender pay, which will be shown as a graph in the resulting report. If there is insufficient information to calculate the statistic, `value` will be null.';
comment on column pay_transparency_calculated_data.is_suppressed is 'Will be set to true if there is not enough information to calculate a statistic. Suppressed statistics are not included in the outputted report.';
comment on column pay_transparency_calculated_data.create_date is 'The date and time when this record was inserted. This is used for deleting calculated data records associated with draft reports that are older than 48 hours.';
comment on column pay_transparency_calculated_data.update_date is 'The date and time when this record was modified. Records cannot be modified from the webapp, instead the user is required to submit a new report.';
comment on column pay_transparency_calculated_data.create_user is 'The username of the database user who created the record.';
comment on column pay_transparency_calculated_data.update_user is 'The username of the database user who modified the record. Records cannot be modified from the webapp, instead the user is required to submit a new report.';

-- calculated_data_history
comment on table calculated_data_history is 'This table stores the calculated data associated with previous versions of published reports. When a report is updated, the report''s calculated data is transferred from `pay_transparency_calculated_data` table to the `calculated_data_history` table. The purpose and meaning of the calculated data is described in the comments of the `pay_transparency_calculated_data` table. The calculated data history is used as an internal archival record, and is not accessible to the end user.';
comment on column calculated_data_history.calculated_data_history_id is 'The primary ID to identify this specific record in the table';
comment on column calculated_data_history.calculated_data_id is 'The original ID before moving the record to the history table.';
comment on column calculated_data_history.report_history_id is 'Identifies which report that this calculated data history is associated with. This references the primary key of `report_history` table.';
comment on column calculated_data_history.report_id is 'The ID of the original report associated with the record.';
comment on column calculated_data_history.calculation_code_id is 'Identifies which statistic this record is storing. References the primary key of `calculation_code` table.';
comment on column calculated_data_history.value is 'The statistic that indicates any disparity in gender pay, which will be shown as a graph in the resulting report. If there is insufficient information to calculate the statistic, `value` will be null.';
comment on column calculated_data_history.is_suppressed is 'Will be set to true if there is not enough information to calculate a statistic. Suppressed statistics are not included in the outputted report.';
comment on column calculated_data_history.create_date is 'The date and time when this record was inserted into `pay_transparency_calculated_data`.';
comment on column calculated_data_history.update_date is 'The date and time when this record was last modified while in `pay_transparency_calculated_data`. Records in the history table are not modified.';
comment on column calculated_data_history.create_user is 'The username of the database user who created the record in `pay_transparency_calculated_data`.';
comment on column calculated_data_history.update_user is 'The username of the database user who modified the record in `pay_transparency_calculated_data`. Records in the history table are not modified.';

-- calculation_code
comment on table calculation_code is 'This is a lookup table of all 57 statistics, known as ''calculations'', that relate to calculating any disparity in gender pay such as the mean hourly pay difference. The webapp has the `calculation_code` in two places, when calculating the statistics to store in the `pay_transparency_calculated_data` table, and when adding the statistics in the report. These operations require looking up either the `calculation_code_id` or the `calculation_code` from this table.';
comment on column calculation_code.calculation_code_id is 'The ID of the calculation code which is referenced in the two `calculated_data` tables. The webapp uses this ID to lookup the `calculation_code` when retrieving the calculated data for use on the report.';
comment on column calculation_code.calculation_code is 'A unique, human readable string used to identify the algorithm for data calculation. The webapp uses this code to lookup the `calculation_code_id` to save the `value` in the `pay_transparency_calculated_data` table.';
comment on column calculation_code.description is 'An explanation of the formula used to perform this calculation.';

-- naics_code
comment on table naics_code is 'This is a lookup table that stores only the 1st level (of 5 levels) codes of the current North American Industry Classification System (NAICS) data. The user is required to select a NAICS code for each report.
[North American Industry Classification System (NAICS) Canada 2022 Version 1.0](https://www23.statcan.gc.ca/imdb/pUtil.pl?Function=getNote&Id=1369825&NT=45)';

comment on column naics_code.naics_code is 'The NAICS code which is either a number (eg 11) or a range of numbers (eg 31-33).';
comment on column naics_code.naics_label is 'The name of the sector (eg ''Construction'') of the NAICS code.';
comment on column naics_code.effective_date is 'The minimum date for which the code can be visible to the users.';
comment on column naics_code.expiry_date is 'A code will be visible to the users if the value is not set or the current date is not later than the date value of this column.';
comment on column naics_code.create_date is 'When the value was inserted/created';
comment on column naics_code.update_date is 'When the value was modified';
comment on column naics_code.create_user is 'The database user who initially created the record.';
comment on column naics_code.update_user is 'The database user who modified the record.';
comment on column naics_code.naics_year is 'The year on which the code was created by Statistics Canada';

-- employee_count_range
comment on table employee_count_range is 'This is a lookup table that stores the employee count ranges, for example "50-100". The user selects from a list on the form how many employees their employer has which is recorded in the `pay_transparency_report` table.';
comment on column employee_count_range.employee_count_range_id is 'The primary unique id. Used in the two report tables.';
comment on column employee_count_range.employee_count_range is 'The name of this record which is shown to the user.';
comment on column employee_count_range.create_date is 'When the value was inserted/created.';
comment on column employee_count_range.update_date is 'When the value was modified.';
comment on column employee_count_range.effective_date is 'The minimum date for which the range can be visible to the users.';
comment on column employee_count_range.expiry_date is 'The last day that this value will be shown to the user.';
comment on column employee_count_range.create_user is 'The database user who initially created the record.';
comment on column employee_count_range.update_user is 'The database user who modified the record.';

-- pay_transparency_user
comment on table pay_transparency_user is 'Users log in with their BCeID account which must be associated with a BCeID business account. The unique ID''s of both accounts are stored to identify this user and business in future logins.';
comment on column pay_transparency_user.user_id is 'Primary unique id used in the two report tables.';
comment on column pay_transparency_user.bceid_user_guid is 'The unique id provided by the BCeID service to identify this user.';
comment on column pay_transparency_user.bceid_business_guid is 'The unique id provided the the BCeID service to identify which employer this user is associated with.';
comment on column pay_transparency_user.display_name is 'This is the full name of the user.';
comment on column pay_transparency_user.create_date is 'The date this user record was entered into the database.';
comment on column pay_transparency_user.update_date is 'The date this user record was last updated. The record is automatically updated every time the user logs in even if there are no changes.';

-- pay_transparency_company
comment on table pay_transparency_company is 'These are the details provided by a BCeID Business account for a logged in user. The name and address will be included on a report.
If a user logs in without a BCeID Business account, or if the BCeID Business account is missing information, the login will not proceed and the record will not be created.';

comment on column pay_transparency_company.company_id is 'Primary unique ID for this company. Referenced on the `pay_transparency_report` table.';
comment on column pay_transparency_company.bceid_business_guid is 'The BCeID unique ID for this company. Used to associate a user with a company.';
comment on column pay_transparency_company.company_name is 'The name of the employer provided by BCeID account.';
comment on column pay_transparency_company.create_date is 'The date this company record was entered into the database.';
comment on column pay_transparency_company.update_date is 'The date this company record was last updated. The record is updated if there are changes. The old record is copied to the `company_history` table.';
comment on column pay_transparency_company.address_line1 is 'Street address provided by BCeID account.';
comment on column pay_transparency_company.address_line2 is 'Optional second address line provided by BCeID account.';
comment on column pay_transparency_company.city is 'City provided by BCeID account.';
comment on column pay_transparency_company.province is 'Province provided by BCeID account.';
comment on column pay_transparency_company.country is 'Country provided by BCeID account.';
comment on column pay_transparency_company.postal_code is 'Postal Code provided by BCeID account.';

-- company_history
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

-- admin_user
comment on table admin_user is 'This table stores information about current administrative users of the application, including their roles, status, and relevant user metadata. Administrators are managed through the Single Sign On (SSO) Keycloak service, which is the source-of-truth for authentication, however a record of their information is stored here to easily log activities performed by the admin user. Upon login, if there is ever a difference between SSO Keycloak and this table, this table will be updated with the information from SSO Keycloak. If it is the first time login in after accepting the onboarding email, a new record will be created with information from SSO Keycloak, or an existing record will be updated by setting `is_active` to true.';
comment on column admin_user.admin_user_id is 'Primary unique ID for each admin user.';
comment on column admin_user.idir_user_guid is 'Unique identifier for the admin user provided by SSO Keycloak for logging purposes.';
comment on column admin_user.display_name is 'The full name of the admin user to be displayed within the application provided by SSO Keycloak.';
comment on column admin_user.create_date is 'Timestamp indicating when the admin user record was created.';
comment on column admin_user.create_user is 'Admin user ID who invited this user. Or this is set to "keycloak" if this user was discovered on the SSO Keycloak service and wasn''t invited through the app.';
comment on column admin_user.update_date is 'Timestamp of the most recent update to the admin user record.';
comment on column admin_user.update_user is 'Admin user ID who last modified the record. Or this is set to "keycloak" if this updated occurred due to changes discovered on the SSO Keycloak service.';
comment on column admin_user.is_active is 'Boolean flag indicating if the admin user is currently active in the system. Admin users with the admin role can remove users using the webapp. This removes them from SSO Keycloak, and sets `is_active` to false. Users must go through the onboarding process before they can become active again.';
comment on column admin_user.assigned_roles is 'Comma-separated list of roles assigned to the admin user, determining permissions within the application. Currently there are two roles, ''user'' and ''admin''. ''admin'' is for managing the users, and ''user'' is for managing the other features available in the administrative section of the application. An admin user will have either the ''user'' role or both ''user'' and ''admin'' role.';
comment on column admin_user.preferred_username is 'This field stores the `idir_user_guid` in a consistent string format provided by SSO Keycloak, ensuring reliability for user lookups. While `idir_user_guid` values are case-insensitive and may contain optional dashes (`-`) making direct comparisons challenging, the `preferred_username` field formats the GUID as a standardized string. This consistency simplifies lookups and comparisons within the admin webapp.';
comment on column admin_user.last_login is 'Timestamp of the user''s last login. Updating this field does not result in creating a history record.';
comment on column admin_user.email is 'Email address of the admin user for notifications. For example, all admin users receive an email warning when an announcement is scheduled to expire soon.';

-- admin_user_history
comment on table admin_user_history is 'This table stores the old version of admin users who''s roles, active, or other metadata has changed. This table retains a log of modifications to support auditing and historical tracking of admin users. This table is not updated when last_login is updated.';
comment on column admin_user_history.admin_user_history_id is 'Primary unique ID for each record in the history table.';
comment on column admin_user_history.admin_user_id is 'Foreign key reference to the `admin_user` table, linking history to the main user record.';
comment on column admin_user_history.idir_user_guid is 'Unique identifier for the admin user provided by SSO Keycloak for logging purposes.';
comment on column admin_user_history.display_name is 'The full name of the admin user to be displayed within the application provided by SSO Keycloak.';
comment on column admin_user_history.create_date is 'Timestamp indicating when the admin user record was created.';
comment on column admin_user_history.create_user is 'Admin user ID who invited this user. Or this is set to "keycloak" if this user was discovered on the SSO Keycloak service and wasn''t invited through the app.';
comment on column admin_user_history.update_date is 'Timestamp of the most recent update to the admin user record.';
comment on column admin_user_history.update_user is 'Admin user ID who last modified the record. Or this is set to "keycloak" if this updated occurred due to changes discovered on the SSO Keycloak service.';
comment on column admin_user_history.is_active is 'Boolean flag indicating if the admin user is currently active in the system. Admin users with the admin role can remove users using the webapp. This removes them from SSO Keycloak, and sets `is_active` to false. Users must go through the onboarding process before they can become active again.';
comment on column admin_user_history.assigned_roles is 'Comma-separated list of roles assigned to the admin user, determining permissions within the application. Currently there are two roles, ''user'' and ''admin''. ''admin'' is for managing the users, and ''user'' is for managing the other features available in the administrative section of the application. An admin user will have either the ''user'' role or both ''user'' and ''admin'' role.';
comment on column admin_user_history.preferred_username is 'This field stores the `idir_user_guid` in a consistent string format provided by SSO Keycloak, ensuring reliability for user lookups. While `idir_user_guid` values are case-insensitive and may contain optional dashes (`-`), making direct comparisons challenging, the `preferred_username` field formats the GUID as a standardized string. This consistency simplifies lookups and comparisons within the application.';
comment on column admin_user_history.last_login is 'Timestamp of the user''s last login. Updating this field does not result in creating a history record.';
comment on column admin_user_history.email is 'Email address of the admin user for notifications. For example, all admin users receive an email warning when an announcement is scheduled to expire soon.';

-- admin_user_onboarding
comment on table admin_user_onboarding is 'This table keeps track of potential admin users awaiting onboarding, including their email, assigned roles, and whether they have completed the onboarding process. Potential admin users are invited by an admin user with the admin role. The user details are given by an admin user, not by any sort of database of users. An email is sent to the person who then has 3 days to accept the invite by logging in. Upon logging in, the `email` is used to lookup the new user in SSO Keycloak, and `assigned_roles` are sent to set permissions. The user must re-log in order to get the new permissions from SSO Keycloak and for `admin_user` table to be updated.';
comment on column admin_user_onboarding.admin_user_onboarding_id is 'Primary unique ID for each onboarding record.';
comment on column admin_user_onboarding.email is 'Email address for the admin user being onboarded, used for communication and identification. Provided by the admin user who created this request.';
comment on column admin_user_onboarding.first_name is 'First name of the admin user for identification purposes during onboarding. Provided by the admin user who created this request.';
comment on column admin_user_onboarding.assigned_roles is 'Roles to be assigned upon onboarding completion, stored as a comma-separated list. Provided by the admin user who created this request.';
comment on column admin_user_onboarding.create_date is 'Timestamp indicating when the onboarding record was created.';
comment on column admin_user_onboarding.created_by is 'Admin user ID of the admin responsible for initiating the onboarding process.';
comment on column admin_user_onboarding.is_onboarded is 'Boolean flag indicating whether the admin user has completed onboarding and gained access to the application.';
comment on column admin_user_onboarding.expiry_date is 'Expiry date of the onboarding record, after which it may no longer be valid.';

-- announcement
comment on table announcement is 'This table stores information about announcements created within the application, including details such as title, description, and status, as well as timestamps for tracking creation, publication, and expiration. Announcements are created by admin users. Announcements are only shown to public users who are logged in.
Announcements can be saved with the `status` of ''published'' or ''draft''. Draft is to allow the admin user to save their work and come back to edit it later. Published will make the announcement visible to the public users if the current date is between `active_on` and `expires_on`.

`Status` is automatically set to ''expired'' if it is published and the `expired_on` date has passed. Status is changed to ''archived'' when the admin user archives an announcement. A monthly scheduled task will remove from the database any announcement who''s `updated_date` is over 90 days old and has the `status` ''expired'' or ''archived''.';

comment on column announcement.announcement_id is 'Primary Unique identifier for an announcement.';
comment on column announcement.title is 'Title of the announcement displayed to the user.';
comment on column announcement.description is 'Body of the announcement displayed to the user.';
comment on column announcement.created_date is 'Date when the announcement was created.';
comment on column announcement.updated_date is 'Date when the announcement was last updated.';
comment on column announcement.created_by is 'The admin user ID who created the announcement.';
comment on column announcement.updated_by is 'The admin user ID who last updated the announcement.';
comment on column announcement.active_on is 'Date when the announcement becomes visible to the public user, but only if the status is published.';
comment on column announcement.expires_on is 'Date when the announcement is hidden from the public user. This can be null if an announcement doesn''t expire.';
comment on column announcement.status is 'Status of the announcement, defined by the `announcement_status` table. Currently the options are Draft, Published, Expired, or Archived.';

-- announcement_history
comment on table announcement_history is 'This table stores old versions of announcements when changes were made. The announcement history is used as an internal historical record, and is not accessible to admin users.';
comment on column announcement_history.announcement_history_id is 'Primary Unique identifier for an announcement history record.';
comment on column announcement_history.announcement_id is 'The ID of the original announcement.';
comment on column announcement_history.title is 'Title of the announcement.';
comment on column announcement_history.description is 'Body of the announcement.';
comment on column announcement_history.created_date is 'Date when the announcement was created.';
comment on column announcement_history.updated_date is 'Date when the announcement was last updated.';
comment on column announcement_history.created_by is 'The admin user ID who created the announcement.';
comment on column announcement_history.updated_by is 'The admin user ID who made this specific record.';
comment on column announcement_history.active_on is 'Date when the announcement became visible to the user, but only if the status is published.';
comment on column announcement_history.expires_on is 'Date when the announcement was hidden from the user. This could be null if an announcement didn''t expire.';
comment on column announcement_history.status is 'Status of the announcement, defined by the `announcement_status` table. Currently the options are Draft, Published, Expired, or Archived.';

-- announcement_resource
comment on table announcement_resource is 'This table lists the resources associated with an announcement. A resource is either a link to a file, or a link to a URL. While the design supports any number of resources existing for each announcement, the webapp limits the user to one of each type, file or link.';
comment on column announcement_resource.announcement_resource_id is 'Primary unique ID for identifying this resource.';
comment on column announcement_resource.announcement_id is 'The ID of the announcement to which the resource is associated.';
comment on column announcement_resource.display_name is 'Display name of the resource. Given by the admin user who added the resource and displayed to the public user as a link.';
comment on column announcement_resource.resource_url is 'URL where the public user is directed to when accessing the link. Only used if the `resource_type` is ''Link''. Given by the admin user who added the resource.';
comment on column announcement_resource.created_date is 'Date when the resource was created.';
comment on column announcement_resource.update_date is 'Date when the resource was last updated.';
comment on column announcement_resource.created_by is 'The admin user ID who created the resource.';
comment on column announcement_resource.updated_by is 'The admin user ID who last updated the resource.';
comment on column announcement_resource.resource_type is 'Type of the resource, can be ''Link'' or ''Attachment''.';
comment on column announcement_resource.attachment_file_id is 'A GUID to identify the file in the object storage. Only used if the `resource_type` is ''Attachment''.';

-- announcement_resource_history
comment on table announcement_resource_history is 'Announcement resource history is updated whenever there is change in any record of an announcement resource.';
comment on column announcement_resource_history.announcement_resource_history_id is 'Primary key for identifying this resource history record.';
comment on column announcement_resource_history.announcement_resource_id is 'The ID of the original announcement resource.';
comment on column announcement_resource_history.announcement_id is 'The ID of the original announcement to which the resource is associated.';
comment on column announcement_resource_history.display_name is 'Display name of the resource. Given by the admin user who added the resource and displayed to the user as a link.';
comment on column announcement_resource_history.resource_url is 'URL where the user is directed to when accessing the link. Only used if the `resource_type` is ''Link''. Given by the admin user who added the resource.';
comment on column announcement_resource_history.created_date is 'Date when the resource was created.';
comment on column announcement_resource_history.update_date is 'Date when the resource was last updated.';
comment on column announcement_resource_history.created_by is 'The admin user ID who created the resource.';
comment on column announcement_resource_history.updated_by is 'The admin user ID who last updated the resource.';
comment on column announcement_resource_history.resource_type is 'Type of the resource. Limited to the options in the `announcement_resource_type` table. For example, can be ''Link'' or ''Attachment''.';
comment on column announcement_resource_history.announcement_history_id is 'The ID in the `announcement_history` table to which the resource is associated.';
comment on column announcement_resource_history.attachment_file_id is 'A unique ID to identify the file in the object storage. Only used if the `resource_type` is ''Attachment''.';

-- announcement_resource_type
comment on table announcement_resource_type is 'A lookup table for the types of resources that an announcement can have. Currently two types: Link and Attachment. A human-readable description is provided for each code.';
comment on column announcement_resource_type.code is 'Unique identifier for the type of a resource. Can be the text ''LINK'' or ''ATTACHMENT''.';
comment on column announcement_resource_type.description is 'A human readable description of the code.';
comment on column announcement_resource_type.created_date is 'Date when the type was created.';
comment on column announcement_resource_type.updated_date is 'Date when the type was last updated.';

-- announcement_status
comment on table announcement_status is 'A lookup table for the status of an announcement. Currently, there are four statuses: Draft, Published, Expired, and Archived. A human-readable description is provided for each code.';
comment on column announcement_status.code is 'Code for the status of an announcement. There are four text codes: DRAFT, PUBLISHED, EXPIRED, ARCHIVED.';
comment on column announcement_status.description is 'A human readable description of the code.';
comment on column announcement_status.created_date is 'Date when the status was created.';
comment on column announcement_status.updated_date is 'Date when the status was last updated.';

-- user_error
comment on table user_error is 'When the application servers are configured to enable logging, errors related to file processing will be captured in this table. This logging is currently enabled. The purpose is to find out if there are common errors the users are encountering. Every 6 months a scheduled task will remove from the database any record older than 6 months.';
comment on column user_error.user_error_id is 'Primary unique ID of the error.';
comment on column user_error.user_id is 'The user who experienced the error.';
comment on column user_error.company_id is 'The company the user is associated with.';
comment on column user_error.error is 'The error message generated by the webapp.';
comment on column user_error.create_date is 'Time when the error was encountered.';

-- announcement_status descriptions
update announcement_status set description='A draft announcement is not active and will not be shown to the end users.'where code='DRAFT';
update announcement_status set description='A published announcement will be shown to end users between the specified times.'
where code='PUBLISHED';
update announcement_status set description='An expired announcement is one that once was published, but it''s expired time has elapsed.'
where code='EXPIRED';
update announcement_status set description='An archived announcement is one that an admin user has removed with the intention of it eventually being deleted and cannot be recovered within the webapp.'
where code='ARCHIVED';

-- announcement_resource_type descriptions
update announcement_resource_type set description='A web link to a website or resource.'where code='LINK';
update announcement_resource_type set description='A file stored as part of this webapp.'
where code='ATTACHMENT';