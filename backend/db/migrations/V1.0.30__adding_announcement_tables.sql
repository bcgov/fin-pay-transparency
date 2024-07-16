CREATE TYPE IF NOT EXISTS ANNOUNCEMENT_STATUS AS ENUM ('Draft', 'Published', 'Expired', 'Deleted');

CREATE TABLE
    IF NOT EXISTS announcement (
        announcement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by UUID NOT NULL,
        updated_by UUID NOT NULL,
        published_date TIMESTAMP NULL,
        expiry_date TIMESTAMP NULL,
        announcement_status ANNOUNCEMENT_STATUS NOT NULL DEFAULT 'Draft'
    );

CREATE TABLE
    IF NOT EXISTS announcement_history (
        announcement_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        announcement_id UUID,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by UUID NOT NULL,
        updated_by UUID NOT NULL,
        published_date TIMESTAMP NULL,
        expiry_date TIMESTAMP NULL,
        announcement_status ANNOUNCEMENT_STATUS NOT NULL DEFAULT 'Draft'
    );

CREATE TYPE IF NOT EXISTS ANNOUNCEMENT_RESOURCE AS ENUM ('Link', 'Attachment');

CREATE TABLE
    IF NOT EXISTS announcement_resource (
        announcement_attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        announcement_id INT NOT NULL,
        type ANNOUNCEMENT_RESOURCE NOT NULL,
        attachment_url VARCHAR(255) NOT NULL,
        created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by UUID NOT NULL
    );