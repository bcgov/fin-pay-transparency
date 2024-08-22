SET
    search_path TO pay_transparency;

ALTER TABLE announcement_resource
ADD COLUMN attachment_path VARCHAR(255) DEFAULT NULL;

COMMENT ON COLUMN announcement_resource.attachment_path IS 'The storage path of the attachment file.';

ALTER TABLE announcement_resource_history
ADD COLUMN attachment_path VARCHAR(255) DEFAULT NULL;

COMMENT ON COLUMN announcement_resource_history.attachment_path IS 'The storage path of the attachment file.';