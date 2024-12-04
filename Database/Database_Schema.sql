DROP VIEW statusoverview;
drop table env_deployments;
drop table builds;
drop table apps;
drop table environments;


CREATE TABLE
    apps (
        id SERIAL PRIMARY KEY,
        portfolio TEXT NOT NULL,
        parent TEXT NOT NULL,
        app_name TEXT NOT NULL,
        updated_on TIMESTAMP NOT NULL,
        UNIQUE (portfolio, parent, app_name)
    );

CREATE TABLE
    environments (
        name TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT now ()
    );

CREATE TABLE
    builds (
        build_id UUID PRIMARY KEY, -- Assuming build_id is unique and could be a UUID
        app_id INT NOT NULL REFERENCES apps (id) ON DELETE CASCADE, -- Foreign key to apps table
        image TEXT NOT NULL,
        tag TEXT NOT NULL,
        git_sha TEXT NOT NULL,
        docker_sha TEXT NOT NULL,
        branch TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL,
        commitmessage TEXT NOT NULL,
        commitby TEXT NOT NULL
    );

CREATE TABLE
    env_deployments (
        id SERIAL PRIMARY KEY,
        app_id INT NOT NULL REFERENCES apps (id) ON DELETE CASCADE,
        environment_name TEXT not null REFERENCES environments (name) ON DELETE CASCADE,
        tag TEXT NOT NULL,
        branch TEXT NOT NULL,
        status TEXT NOT NULL,
        cluster TEXT NOT NULL,
        commitby TEXT NOT NULL,
        commit_id TEXT NOT NULL,
        namespace TEXT NOT NULL,
        previous_tag TEXT NOT NULL,
        commitmessage TEXT NOT NULL,
        image_created_at TIMESTAMP NOT NULL,
        image_deployed_at TIMESTAMP NOT NULL,
        image_deployed_by TEXT NOT NULL,
        latest_build_tag TEXT NOT null,
        created_on TIMESTAMP default NOW()
    );
   
-- View For consolidating the data ---

CREATE OR REPLACE VIEW statusoverview AS
SELECT 
    a.id AS app_id,
    a.app_name,
    a.portfolio,
    a.parent,
    -- Generate a JSON column for each environment with the latest deployment
    COALESCE((
        SELECT TO_JSONB(ed)
        FROM (
            SELECT envdep.id, envdep.app_id, envdep.environment_name, envdep.tag , envdep.branch , envdep.status , envdep.cluster , envdep.commitby , envdep.commit_id , envdep.namespace , envdep.previous_tag, envdep.commitmessage , envdep.image_created_at, envdep.image_deployed_at, envdep.image_deployed_by, b.tag as latest_build_tag, envdep.created_on
            FROM env_deployments envdep join builds b on b.branch = envdep.branch
            WHERE envdep.app_id = a.id and b.app_id = a.id AND envdep.environment_name = 'alpha' 
            ORDER BY envdep.created_on DESC
            LIMIT 1
        ) ed
    ), 'null') AS alpha,
    COALESCE((
        SELECT TO_JSONB(ed)
        FROM (
           SELECT envdep.id, envdep.app_id, envdep.environment_name, envdep.tag , envdep.branch , envdep.status , envdep.cluster , envdep.commitby , envdep.commit_id , envdep.namespace , envdep.previous_tag, envdep.commitmessage , envdep.image_created_at, envdep.image_deployed_at, envdep.image_deployed_by, b.tag as latest_build_tag, envdep.created_on
            FROM env_deployments envdep join builds b on b.branch = envdep.branch
            WHERE envdep.app_id = a.id and b.app_id = a.id  AND envdep.environment_name = 'alpha2'
            ORDER BY envdep.created_on DESC
            LIMIT 1
        ) ed
    ), 'null') AS alpha2,
    COALESCE((
        SELECT TO_JSONB(ed)
        FROM (
            SELECT envdep.id, envdep.app_id, envdep.environment_name, envdep.tag , envdep.branch , envdep.status , envdep.cluster , envdep.commitby , envdep.commit_id , envdep.namespace , envdep.previous_tag, envdep.commitmessage , envdep.image_created_at, envdep.image_deployed_at, envdep.image_deployed_by, b.tag as latest_build_tag, envdep.created_on
            FROM env_deployments envdep join builds b on b.branch = envdep.branch
            WHERE envdep.app_id = a.id and b.app_id = a.id  AND envdep.environment_name = 'qa'
            ORDER BY envdep.created_on DESC
            LIMIT 1
        ) ed
    ), 'null') AS qa,
    COALESCE((
        SELECT TO_JSONB(ed)
        FROM (
            SELECT envdep.id, envdep.app_id, envdep.environment_name, envdep.tag , envdep.branch , envdep.status , envdep.cluster , envdep.commitby , envdep.commit_id , envdep.namespace , envdep.previous_tag, envdep.commitmessage , envdep.image_created_at, envdep.image_deployed_at, envdep.image_deployed_by, b.tag as latest_build_tag, envdep.created_on
            FROM env_deployments envdep join builds b on b.branch = envdep.branch
            WHERE envdep.app_id = a.id and b.app_id = a.id  AND envdep.environment_name = 'qa2'
            ORDER BY envdep.created_on DESC
            LIMIT 1
        ) ed
    ), 'null') AS qa2,
    COALESCE((
        SELECT TO_JSONB(ed)
        FROM (
           SELECT envdep.id, envdep.app_id, envdep.environment_name, envdep.tag , envdep.branch , envdep.status , envdep.cluster , envdep.commitby , envdep.commit_id , envdep.namespace , envdep.previous_tag, envdep.commitmessage , envdep.image_created_at, envdep.image_deployed_at, envdep.image_deployed_by, b.tag as latest_build_tag, envdep.created_on
            FROM env_deployments envdep join builds b on b.branch = envdep.branch
            WHERE envdep.app_id = a.id and b.app_id = a.id  AND envdep.environment_name = 'uat'
            ORDER BY envdep.created_on DESC
            LIMIT 1
        ) ed
    ), 'null') AS uat,
    COALESCE((
        SELECT TO_JSONB(ed)
        FROM (
           SELECT envdep.id, envdep.app_id, envdep.environment_name, envdep.tag , envdep.branch , envdep.status , envdep.cluster , envdep.commitby , envdep.commit_id , envdep.namespace , envdep.previous_tag, envdep.commitmessage , envdep.image_created_at, envdep.image_deployed_at, envdep.image_deployed_by, b.tag as latest_build_tag, envdep.created_on
            FROM env_deployments envdep join builds b on b.branch = envdep.branch
            WHERE envdep.app_id = a.id and b.app_id = a.id  AND envdep.environment_name = 'uat2'
            ORDER BY envdep.created_on DESC
            LIMIT 1
        ) ed
    ), 'null') AS uat2,
    COALESCE((
        SELECT TO_JSONB(ed)
        FROM (
            SELECT envdep.id, envdep.app_id, envdep.environment_name, envdep.tag , envdep.branch , envdep.status , envdep.cluster , envdep.commitby , envdep.commit_id , envdep.namespace , envdep.previous_tag, envdep.commitmessage , envdep.image_created_at, envdep.image_deployed_at, envdep.image_deployed_by, b.tag as latest_build_tag, envdep.created_on
            FROM env_deployments envdep join builds b on b.branch = envdep.branch
            WHERE envdep.app_id = a.id and b.app_id = a.id  AND envdep.environment_name = 'staging'
            ORDER BY envdep.created_on DESC
            LIMIT 1
        ) ed
    ), 'null') AS staging,
    COALESCE((
        SELECT TO_JSONB(ed)
        FROM (
            SELECT envdep.id, envdep.app_id, envdep.environment_name, envdep.tag , envdep.branch , envdep.status , envdep.cluster , envdep.commitby , envdep.commit_id , envdep.namespace , envdep.previous_tag, envdep.commitmessage , envdep.image_created_at, envdep.image_deployed_at, envdep.image_deployed_by, b.tag as latest_build_tag, envdep.created_on
            FROM env_deployments envdep join builds b on b.branch = envdep.branch
            WHERE envdep.app_id = a.id and b.app_id = a.id  AND envdep.environment_name = 'staging1'
            ORDER BY envdep.created_on DESC
            LIMIT 1
        ) ed
    ), 'null') AS staging1,
    COALESCE((
        SELECT TO_JSONB(ed)
        FROM (
            SELECT envdep.id, envdep.app_id, envdep.environment_name, envdep.tag , envdep.branch , envdep.status , envdep.cluster , envdep.commitby , envdep.commit_id , envdep.namespace , envdep.previous_tag, envdep.commitmessage , envdep.image_created_at, envdep.image_deployed_at, envdep.image_deployed_by, b.tag as latest_build_tag, envdep.created_on
            FROM env_deployments envdep join builds b on b.branch = envdep.branch
            WHERE envdep.app_id = a.id and b.app_id = a.id  AND envdep.environment_name = 'staging2'
            ORDER BY envdep.created_on DESC
            LIMIT 1
        ) ed
    ), 'null') AS staging2,
    COALESCE((
        SELECT TO_JSONB(ed)
        FROM (
            SELECT envdep.id, envdep.app_id, envdep.environment_name, envdep.tag , envdep.branch , envdep.status , envdep.cluster , envdep.commitby , envdep.commit_id , envdep.namespace , envdep.previous_tag, envdep.commitmessage , envdep.image_created_at, envdep.image_deployed_at, envdep.image_deployed_by, b.tag as latest_build_tag, envdep.created_on
            FROM env_deployments envdep join builds b on b.branch = envdep.branch
            WHERE envdep.app_id = a.id and b.app_id = a.id  AND envdep.environment_name = 'prod'
            ORDER BY envdep.created_on DESC
            LIMIT 1
        ) ed
    ), 'null') AS prod,
    COALESCE((
        SELECT TO_JSONB(ed)
        FROM (
           SELECT envdep.id, envdep.app_id, envdep.environment_name, envdep.tag , envdep.branch , envdep.status , envdep.cluster , envdep.commitby , envdep.commit_id , envdep.namespace , envdep.previous_tag, envdep.commitmessage , envdep.image_created_at, envdep.image_deployed_at, envdep.image_deployed_by, b.tag as latest_build_tag, envdep.created_on
            FROM env_deployments envdep join builds b on b.branch = envdep.branch
            WHERE envdep.app_id = a.id and b.app_id = a.id  AND envdep.environment_name = 'dr'
            ORDER BY envdep.created_on DESC
            LIMIT 1
        ) ed
    ), 'null') AS dr
FROM 
    apps a;
