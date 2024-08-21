SET
    search_path TO pay_transparency;

ALTER TABLE announcement_resource
ADD COLUMN attachment_file_id UUID DEFAULT NULL;
ALTER TABLE announcement_resource ALTER COLUMN resource_url DROP NOT NULL;
COMMENT ON COLUMN announcement_resource.attachment_file_id IS 'The file id of the attachment file.';

ALTER TABLE announcement_resource_history
ADD COLUMN attachment_file_id UUID DEFAULT NULL;
ALTER TABLE announcement_resource_history ALTER COLUMN resource_url DROP NOT NULL;
COMMENT ON COLUMN announcement_resource_history.attachment_file_id IS 'The file id of the attachment file.';