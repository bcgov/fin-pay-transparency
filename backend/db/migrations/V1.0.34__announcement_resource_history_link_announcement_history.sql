SET
    search_path TO pay_transparency;

ALTER TABLE announcement_resource_history
    ADD COLUMN announcement_history_id UUID NOT NULL REFERENCES announcement_history(announcement_history_id);