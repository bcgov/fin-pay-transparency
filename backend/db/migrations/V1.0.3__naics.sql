/*
    Update Summary:
    - update `naics_code` table to reflect top level naics data only

    New table looks like this:
    CREATE TABLE naics_code
    (
        naics_code      varchar(5)                        not null,
        naics_year      varchar(255)                        not null,
        naics_label     varchar(255)                        not null,
        effective_date  date      default current_date      not null,
        expiry_date     date,
        create_date     timestamp default current_timestamp not null,
        update_date     timestamp default current_timestamp not null,
        create_user     varchar(255)                        not null,
        update_user     varchar(255)                        not null,
        constraint naics_code_id_pk primary key (naics_code)
    );
*/

-- modify pay_transparency schema only
SET search_path TO pay_transparency;

-- remove all data
DELETE FROM naics_code;

-- make changes to `naics_code` table's definition
ALTER TABLE naics_code DROP COLUMN naics_code_desc;           -- Remove unused column
ALTER TABLE naics_code ALTER COLUMN naics_code TYPE varchar(5); -- Limit to 5 characters

-- make changes to `naics_code` table's definition
ALTER TABLE pay_transparency_report ALTER COLUMN naics_code TYPE varchar(5); -- Limit to 5 characters

-- insert new data
INSERT INTO naics_code(
naics_code, naics_year, naics_label, create_user, update_user)
VALUES 
('11', '2022', 'Agriculture, forestry, fishing and hunting', 'System', 'System'),
('21', '2022', 'Mining, quarrying, and oil and gas extraction', 'System', 'System'),
('22', '2022', 'Utilities', 'System', 'System'),
('23', '2022', 'Construction', 'System', 'System'),
('31-33', '2022', 'Manufacturing', 'System', 'System'),
('41', '2022', 'Wholesale trade', 'System', 'System'),
('44-45', '2022', 'Retail trade', 'System', 'System'),
('48-49', '2022', 'Transportation and warehousing', 'System', 'System'),
('51', '2022', 'Information and cultural industries', 'System', 'System'),
('52', '2022', 'Finance and insurance', 'System', 'System'),
('53', '2022', 'Real estate and rental and leasing', 'System', 'System'),
('54', '2022', 'Professional, scientific and technical services', 'System', 'System'),
('55', '2022', 'Management of companies and enterprises', 'System', 'System'),
('56', '2022', 'Administrative and support, waste management and remediation services', 'System', 'System'),
('61', '2022', 'Educational services', 'System', 'System'),
('62', '2022', 'Health care and social assistance', 'System', 'System'),
('71', '2022', 'Arts, entertainment and recreation', 'System', 'System'),
('72', '2022', 'Accommodation and food services', 'System', 'System'),
('81', '2022', 'Other services (except public administration)', 'System', 'System'),
('91', '2022', 'Public administration', 'System', 'System');