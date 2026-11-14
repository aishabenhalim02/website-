CREATE TABLE mms_records (
    id boolean PRIMARY KEY DEFAULT true CHECK (id),
    state jsonb NOT NULL
);

INSERT INTO mms_records (state) VALUES (
    '{"submissions":[],"listings":[],"schedules":[],"sources":[],"products":[],"audit":[]}'
);

CREATE TABLE mms_sessions (
    token_hash text PRIMARY KEY,
    expires bigint NOT NULL,
    role text NOT NULL CHECK (role IN ('administrator', 'reviewer'))
);

CREATE TABLE mms_limits (
    bucket text PRIMARY KEY,
    hits integer NOT NULL DEFAULT 0,
    expires bigint NOT NULL
);
