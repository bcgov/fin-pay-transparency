/*
    Update Summary:
    - drops a not null constraint on pay_transparency.employee_count_range.expiry_date and changes
      the default value to null.
    - inserts initial data into the 'employee_count_range' table
*/

alter table pay_transparency.employee_count_range alter column expiry_date drop not null;
alter table pay_transparency.employee_count_range alter column expiry_date set default null;

insert into pay_transparency.employee_count_range (
  employee_count_range_id,
  employee_count_range,
  create_user,
  update_user
)
values (
  gen_random_uuid(),
  '50-299',
  user,
  user
);

insert into pay_transparency.employee_count_range (
  employee_count_range_id,
  employee_count_range,
  create_user,
  update_user
)
values (
  gen_random_uuid(),
  '300-999',
  user,
  user
);

insert into pay_transparency.employee_count_range (
  employee_count_range_id,
  employee_count_range,
  create_user,
  update_user
)
values (
  gen_random_uuid(),
  '1000 or more',
  user,
  user
);