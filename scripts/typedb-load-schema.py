#!/usr/bin/env python3
"""
Load ONE schema into TypeDB Cloud using Python driver.

Usage:
    pip install typedb-driver
    python scripts/typedb-load-schema.py

Or use TypeDB Console:
    typedb console --cloud cr0mc4-0.cluster.typedb.com:80
    > database create one
    > transaction one schema write
    > source src/schema/one.tql
    > commit
"""

import os
import sys
from pathlib import Path

# Load .env
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())

TYPEDB_URL = os.getenv("TYPEDB_URL", "")
# Ensure https:// prefix and port 443 for TLS
if not TYPEDB_URL.startswith("https://"):
    TYPEDB_URL = "https://" + TYPEDB_URL.replace("http://", "")
# Replace port 80 with 443 for TLS
TYPEDB_URL = TYPEDB_URL.replace(":80", ":443")
# Add port if missing
if ":443" not in TYPEDB_URL and ":80" not in TYPEDB_URL:
    TYPEDB_URL = TYPEDB_URL.rstrip("/") + ":443"
TYPEDB_DATABASE = os.getenv("TYPEDB_DATABASE", "one")
TYPEDB_USERNAME = os.getenv("TYPEDB_USERNAME", "admin")
TYPEDB_PASSWORD = os.getenv("TYPEDB_PASSWORD", "")

if not TYPEDB_URL or not TYPEDB_PASSWORD:
    print("Error: TYPEDB_URL and TYPEDB_PASSWORD required in .env")
    sys.exit(1)

print(f"TypeDB: {TYPEDB_URL}")
print(f"Database: {TYPEDB_DATABASE}")

try:
    from typedb.driver import TypeDB, Credentials
except ImportError:
    print("\nInstall TypeDB driver:")
    print("  pip install typedb-driver")
    sys.exit(1)

def main():
    schema_path = Path(__file__).parent.parent / "src" / "schema" / "one.tql"
    if not schema_path.exists():
        print(f"Error: Schema not found: {schema_path}")
        sys.exit(1)

    schema = schema_path.read_text()
    print(f"Schema: {len(schema.splitlines())} lines")

    # Connect to TypeDB Cloud
    print(f"\nConnecting to {TYPEDB_URL}...")

    try:
        # TypeDB driver API (works for both cloud and local)
        from typedb.driver import DriverOptions
        credentials = Credentials(TYPEDB_USERNAME, TYPEDB_PASSWORD)
        options = DriverOptions(is_tls_enabled=True)
        driver = TypeDB.driver(TYPEDB_URL, credentials, options)
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)

    print("Connected!")

    # Check/create database
    try:
        existing = [db.name for db in driver.databases.all()]
        print(f"Existing databases: {existing}")

        if TYPEDB_DATABASE not in existing:
            print(f"Creating database '{TYPEDB_DATABASE}'...")
            driver.databases.create(TYPEDB_DATABASE)
            print("Created!")
    except Exception as e:
        print(f"Database check failed (may already exist): {e}")

    # Load schema
    print("\nLoading schema...")
    from typedb.driver import TransactionType, SessionType
    with driver.session(TYPEDB_DATABASE, SessionType.SCHEMA) as session:
        with session.transaction(TransactionType.WRITE) as tx:
            tx.query(schema)
            tx.commit()

    print("Schema loaded!")

    # Verify
    print("\nVerifying...")
    with driver.session(TYPEDB_DATABASE, SessionType.DATA) as session:
        with session.transaction(TransactionType.READ) as tx:
            # Try to match a unit (will be empty but shouldn't error)
            result = list(tx.query("match $u isa unit; limit 1;"))
            print(f"Query OK (found {len(result)} units)")

    driver.close()
    print("\nDone! Run the seed API next:")
    print("  curl -X POST http://localhost:4321/api/seed")

if __name__ == "__main__":
    main()
