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
        description VARCHAR(2000) NOT NULL,
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
        resource_url VARCHAR(255) NOT NULL,
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
        resource_url VARCHAR(255) NOT NULL,
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

comment on table announcement_status is 'To track the status of an announcement (Draft, Published, Expired, Deleted)';
comment on column announcement_status.code is 'Code for the status of an announcement (Draft, Published, Expired, Deleted)';
comment on column announcement_status.description is 'Description of the status of an announcement (Draft, Published, Expired, Deleted)';
comment on column announcement_status.created_date is 'Date when the status was created';
comment on column announcement_status.updated_date is 'Date when the status was last updated';

comment on table announcement is 'To track announcements created from the application';
comment on column announcement.announcement_id is 'Unique identifier/Primary key for an announcement';
comment on column announcement.title is 'Title of the announcement';
comment on column announcement.description is 'Description of the announcement';
comment on column announcement.created_date is 'Date when the announcement was created';
comment on column announcement.updated_date is 'Date when the announcement was last updated';
comment on column announcement.created_by is 'The ID of the user who created the announcement';
comment on column announcement.updated_by is 'The ID of the user who last updated the announcement';
comment on column announcement.published_on is 'Date when the announcement was published';
comment on column announcement.expires_on is 'Date when the announcement expires (optional)';
comment on column announcement.status is 'Status of the announcement (Draft, Published, Expired, Deleted)';

comment on table announcement_history is 'Announcement history is updated whenever there is change in any record of an announcement.';
comment on column announcement_history.announcement_history_id is 'Unique identifier/Primary key for an announcement history record';
comment on column announcement_history.announcement_id is 'The ID of the original announcement';
comment on column announcement_history.title is 'Title of the announcement';
comment on column announcement_history.description is 'Description of the announcement';
comment on column announcement_history.created_date is 'Date when the announcement was created';
comment on column announcement_history.updated_date is 'Date when the announcement was last updated';
comment on column announcement_history.created_by is 'The ID of the user who created the announcement';
comment on column announcement_history.updated_by is 'The ID of the user who last updated the announcement';
comment on column announcement_history.published_on is 'Date when the announcement was published';
comment on column announcement_history.expires_on is 'Date when the announcement expires (optional)';
comment on column announcement_history.status is 'Status of the announcement (Draft, Published, Expired, Deleted)';

comment on table announcement_resource is 'To track resources(links or attachments) associated with an announcement';
comment on column announcement_resource.announcement_resource_id is 'Unique identifier/Primary key for an announcement resource';
comment on column announcement_resource.announcement_id is 'The ID of the announcement to which the resource is associated';
comment on column announcement_resource.display_name is 'Display name of the resource';
comment on column announcement_resource.resource_type is 'Type of the resource (Link, Attachment)';
comment on column announcement_resource.resource_url is 'URL of the resource';
comment on column announcement_resource.created_date is 'Date when the resource was created';
comment on column announcement_resource.update_date is 'Date when the resource was last updated';
comment on column announcement_resource.created_by is 'The ID of the user who created the resource';
comment on column announcement_resource.updated_by is 'The ID of the user who last updated the resource';

comment on table announcement_resource_history is 'Announcement resource history is updated whenever there is change in any record of an announcement resource.';
comment on column announcement_resource_history.announcement_resource_history_id is 'Unique identifier/Primary key for an announcement resource history record';
comment on column announcement_resource_history.announcement_resource_id is 'The ID of the original announcement resource';
comment on column announcement_resource_history.announcement_id is 'The ID of the announcement to which the resource is associated';
comment on column announcement_resource_history.display_name is 'Display name of the resource';
comment on column announcement_resource_history.resource_type is 'Type of the resource (Link, Attachment)';
comment on column announcement_resource_history.resource_url is 'URL of the resource';
comment on column announcement_resource_history.created_date is 'Date when the resource was created';
comment on column announcement_resource_history.update_date is 'Date when the resource was last updated';
comment on column announcement_resource_history.created_by is 'The ID of the user who created the resource';
comment on column announcement_resource_history.updated_by is 'The ID of the user who last updated the resource';

INSERT INTO
    announcement_status (code, description)
VALUES
    ('DRAFT', 'Draft'),
    ('PUBLISHED', 'Published'),
    ('EXPIRED', 'Expired'),
    ('DELETED', 'Deleted');