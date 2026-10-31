#!/bin/bash
# Script to initialize and start local PostgreSQL for the project

PG_DATA_DIR="/home/user/suraj_project/postgres_data"
PG_BIN_DIR="/usr/lib/postgresql/16/bin"
PG_PORT=5433
PG_USER="postgres"
PG_DB="sales_bi_db"

if [ ! -d "$PG_DATA_DIR/base" ]; then
    echo "Initializing PostgreSQL cluster in $PG_DATA_DIR..."
    $PG_BIN_DIR/initdb -D "$PG_DATA_DIR" -U "$PG_USER" --auth=trust
    echo "PostgreSQL cluster initialized."
fi

# Check if PostgreSQL is already running
if $PG_BIN_DIR/pg_ctl -D "$PG_DATA_DIR" status > /dev/null 2>&1; then
    echo "PostgreSQL is already running."
else
    echo "Starting PostgreSQL on port $PG_PORT..."
    $PG_BIN_DIR/pg_ctl -D "$PG_DATA_DIR" -o "-p $PG_PORT -k /tmp" -l "$PG_DATA_DIR/server.log" start
    sleep 2
fi

# Create database if not exists
if ! psql -h localhost -p $PG_PORT -U $PG_USER -lqt | cut -d \| -f 1 | grep -qw "$PG_DB"; then
    echo "Creating database $PG_DB..."
    psql -h localhost -p $PG_PORT -U $PG_USER -c "CREATE DATABASE $PG_DB;"
    echo "Database $PG_DB created successfully."
else
    echo "Database $PG_DB already exists."
fi

