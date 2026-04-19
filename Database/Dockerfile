FROM postgres:16-alpine

COPY Database_Schema.sql /docker-entrypoint-initdb.d/01-schema.sql
COPY Dummy_Data_Insert_Scripts.sql /docker-entrypoint-initdb.d/02-dummy-data.sql
