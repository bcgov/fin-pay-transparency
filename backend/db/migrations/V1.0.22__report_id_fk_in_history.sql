SET
    search_path TO pay_transparency;

ALTER TABLE report_history ADD CONSTRAINT report_history_report_id FOREIGN KEY (report_id) REFERENCES pay_transparency_report (report_id);