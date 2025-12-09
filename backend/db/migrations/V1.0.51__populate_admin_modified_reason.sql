SET search_path TO pay_transparency;

UPDATE report_history rh
SET admin_modified_reason = null;

UPDATE pay_transparency_report ptr
SET admin_modified_reason = null;

-- Populate admin_modified_reason for report_history table
-- Logic: Determine what admin action was taken based on status/unlock changes
UPDATE report_history rh
SET admin_modified_reason = CASE
  -- If report_status changed from the previous state, it's a status change action
  WHEN rh.report_status = 'Withdrawn' THEN 'WITHDRAW'
  -- If is_unlocked changed, it's a lock/unlock action
  WHEN rh.is_unlocked = false THEN 'LOCK'
  WHEN rh.is_unlocked = true THEN 'UNLOCK'
  ELSE NULL
END
WHERE rh.admin_modified_date IS NOT NULL
AND rh.admin_modified_date > rh.update_date;

-- Populate admin_modified_reason for pay_transparency_report table (current state)
-- Where admin_modified_date > update_date, determine the action based on changes
UPDATE pay_transparency_report ptr
SET admin_modified_reason = CASE
  -- If report_status changed from the previous state, it's a status change action
  WHEN ptr.report_status = 'Withdrawn' THEN 'WITHDRAW'
  -- If is_unlocked changed, it's a lock/unlock action
  WHEN ptr.is_unlocked = false THEN 'LOCK'
  WHEN ptr.is_unlocked = true THEN 'UNLOCK'
  ELSE NULL
END
WHERE ptr.report_status = 'Published'
AND ptr.admin_modified_date IS NOT NULL
AND ptr.admin_modified_date > ptr.update_date;

-- Propagate admin_modified_reason from history for rows where admin_modified_date < update_date
-- For report_history table
UPDATE report_history rh
SET admin_modified_reason = (
  SELECT admin_modified_reason FROM report_history rh2
  WHERE rh2.report_id = rh.report_id 
  AND rh2.admin_modified_reason IS NOT NULL
  AND rh2.admin_modified_date = rh.admin_modified_date
  LIMIT 1
)
WHERE rh.admin_modified_date IS NOT NULL
AND rh.admin_modified_reason IS NULL;

-- For pay_transparency_report table
UPDATE pay_transparency_report ptr
SET admin_modified_reason = (
  SELECT admin_modified_reason FROM report_history rh2
  WHERE rh2.report_id = ptr.report_id 
  AND rh2.admin_modified_reason IS NOT NULL
  AND rh2.admin_modified_date = ptr.admin_modified_date
  LIMIT 1
)
WHERE ptr.admin_modified_date IS NOT NULL
AND ptr.admin_modified_reason IS NULL;
