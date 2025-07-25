SET search_path TO pay_transparency;

ALTER TABLE pay_transparency_report
  DROP CONSTRAINT report_status_check,
  ADD CONSTRAINT report_status_check CHECK (report_status IN ('Draft', 'Published', 'Withdrawn'));
ALTER TABLE report_history
  DROP CONSTRAINT report_status_check,
  ADD CONSTRAINT report_status_check CHECK (report_status IN ('Draft', 'Published', 'Withdrawn'));

-- pay_transparency_report
comment on table pay_transparency_report is 'This table stores the latest versions of draft and published reports. Each report is submitted by a BCeID user, identified by `user_id`, and is associated with an employer with a BCeID Business account, identified by `company_id`.
Reports are created after the user submits the form in the webapp. Initially `report_status` will be ''draft'', but the user can choose to publish the report which changes it''s `report_status` to ''published''. The form allows the user to select `employee_count_range_id`, `naics_code`, `reporting_year`, `report_start_date`, `report_end_date`, `user_comment`, and `data_constraints`.

Each employer will have one published report per `reporting_year`. When a draft report is published, the existing published report (if there is one) will be copied into the `report_history` table. Once a report is published, the `report_id` will stay the same even if it is updated. `revision` keeps track of the number of times a report has been updated after being published.

Reports that have a `create_date` older than 30 days are locked on a schedule run daily. Reports with `is_unlocked` set to false, cannot be modified by the user. An admin can set `is_unlocked` to true, which will allow the user to publish a new report for the same `reporting_year`. After 3 days, it will automatically be locked again. Changes in `is_unlocked` is also stored in `report_history` table which is used to show admin users how frequently a report has been unlocked.

Reports can also be withdrawn by an admin user, which changes the `report_status` to ''Withdrawn''. Withdrawn reports are not visible to the user or admin-users. The `admin_user_id` and `admin_modified_date` columns are used to track which admin user withdrew the report and when it was done.

Draft reports that are older than 48 hours are deleted automatically on a schedule.';

comment on column pay_transparency_report.report_status is 'Reports are first created with the status of ''Draft'' and the user can publish their report which changes the status to ''Published''. An Admin can also withdraw a report, which changes the status to ''Withdrawn''. Withdrawn reports are not visible to the user or admin-user.';
comment on column pay_transparency_report.admin_user_id is 'Admin user who either locked/unlocked report, or withdrew the report. Related to `admin_modified_date`.';
comment on column pay_transparency_report.admin_modified_date is 'The time when an admin user locked, unlocked, or withdrew a report.';

-- report_history
comment on column report_history.report_status is 'History reports will be ''Published'' or ''Withdrawn''. Draft reports are never saved to history.';
comment on column report_history.admin_user_id is 'Admin user who either locked/unlocked report, or withdrew the report. Related to `admin_modified_date`.';
comment on column report_history.admin_modified_date is 'The time when an admin user locked, unlocked, or withdrew a report.';



