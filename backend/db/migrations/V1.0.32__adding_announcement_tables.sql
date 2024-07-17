SET search_path TO pay_transparency;

CREATE TABLE
    IF NOT EXISTS announcement_status (
        code VARCHAR(100) PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    IF NOT EXISTS announcement (
        announcement_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        title VARCHAR(100) NOT NULL,
        description VARCHAR(2000) NOT NULL,
        created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by UUID NOT NULL,
        updated_by UUID NOT NULL,
        published_on TIMESTAMP NULL,
        expires_on TIMESTAMP NULL,
        status VARCHAR(100),
        constraint announcement_status_fk foreign key (status) references announcement_status (code),
        constraint announcement_created_by_fk foreign key (created_by) references admin_user (admin_user_id),
        constraint announcement_updated_by_fk foreign key (updated_by) references admin_user (admin_user_id)
    );

CREATE INDEX IF NOT EXISTS announcement_dates_idx ON announcement (published_on, expires_on);

CREATE INDEX IF NOT EXISTS announcement_created_by_idx ON announcement (created_by);

CREATE INDEX IF NOT EXISTS announcement_updated_by_idx ON announcement (updated_by);

CREATE INDEX IF NOT EXISTS announcement_status_idx ON announcement (status);

CREATE TABLE
    IF NOT EXISTS announcement_history (
        announcement_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        announcement_id UUID,
        title VARCHAR(100) NOT NULL,
        content VARCHAR(2000) NOT NULL,
        created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by UUID NOT NULL,
        updated_by UUID NOT NULL,
        published_on TIMESTAMP NULL,
        expires_on TIMESTAMP NULL,
        status VARCHAR(100),
        constraint announcement_status_fk foreign key (status) references announcement_status (code),
        constraint announcement_history_created_by_fk foreign key (created_by) references admin_user (admin_user_id),
        constraint announcement_history_updated_by_fk foreign key (updated_by) references admin_user (admin_user_id)
    );

CREATE INDEX IF NOT EXISTS announcement_history_created_by_idx ON announcement_history (created_by);

CREATE INDEX IF NOT EXISTS announcement_history_updated_by_idx ON announcement_history (updated_by);

CREATE INDEX IF NOT EXISTS announcement_history_status_idx ON announcement_history (status);

CREATE TYPE ANNOUNCEMENT_RESOURCE_TYPE AS ENUM ('Link', 'Attachment');

CREATE TABLE
    IF NOT EXISTS announcement_resource (
        announcement_resource_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        announcement_id UUID NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        resource_type ANNOUNCEMENT_RESOURCE_TYPE NOT NULL,
        reource_url VARCHAR(255) NOT NULL,
        created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        update_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by UUID NOT NULL,
        updated_by UUID NOT NULL,
        constraint announcement_resource_fk foreign key (announcement_id) references announcement (announcement_id),
        constraint announcement_resource_created_by_fk foreign key (created_by) references admin_user (admin_user_id),
        constraint announcement_resource_updated_by_fk foreign key (updated_by) references admin_user (admin_user_id)
    );

CREATE INDEX IF NOT EXISTS announcement_resource_type_idx ON announcement_resource (resource_type);

CREATE TABLE
    IF NOT EXISTS announcement_resource_history (
        announcement_resource_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        announcement_resource_id UUID,
        announcement_id UUID NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        resource_type ANNOUNCEMENT_RESOURCE_TYPE NOT NULL,
        reource_url VARCHAR(255) NOT NULL,
        created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        update_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by UUID NOT NULL,
        updated_by UUID NOT NULL,
        constraint announcement_resource_history_announcement_resource_fk foreign key (announcement_resource_id) references announcement_resource (announcement_resource_id),
        constraint announcement_resource_history_announcement_fk foreign key (announcement_id) references announcement (announcement_id),
        constraint announcement_resource_history_created_by_fk foreign key (created_by) references admin_user (admin_user_id),
        constraint announcement_resource_history_updated_by_fk foreign key (updated_by) references admin_user (admin_user_id)
    );

CREATE INDEX IF NOT EXISTS announcement_resource_history_resource_type_idx ON announcement_resource_history (resource_type);

INSERT INTO
    announcement_status (code, description)
VALUES
    ('DRAFT', 'Draft'),
    ('PUBLISHED', 'Published'),
    ('EXPIRED', 'Expired'),
    ('DELETED', 'Deleted');