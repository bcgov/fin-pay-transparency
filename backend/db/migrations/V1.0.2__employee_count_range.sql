/*
    Update Summary:
    - this migration inserts initial data into the 'employee_count_range' table
*/

insert into pay_transparency.employee_count_range (
  employee_count_range_id,
  employee_count_range,
  create_user,
  update_user,
  expiry_date
)
values (
  gen_random_uuid(),
  '50-299',
  user,
  user,
  TO_DATE('9999-12-31', 'YYYY-MM-DD')
);

insert into pay_transparency.employee_count_range (
  employee_count_range_id,
  employee_count_range,
  create_user,
  update_user,
  expiry_date
)
values (
  gen_random_uuid(),
  '300-999',
  user,
  user,
  TO_DATE('9999-12-31', 'YYYY-MM-DD')
);

insert into pay_transparency.employee_count_range (
  employee_count_range_id,
  employee_count_range,
  create_user,
  update_user,
  expiry_date
)
values (
  gen_random_uuid(),
  '1000 or more',
  user,
  user,
  TO_DATE('9999-12-31', 'YYYY-MM-DD')
);