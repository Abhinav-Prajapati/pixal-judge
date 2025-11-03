#!/usr/bin/env python3
"""
Pre-startup script to wait for database and run migrations.
"""
import time
import socket
import subprocess
import sys


def wait_for_db(host="db", port=5432, timeout=30):
    """Wait for PostgreSQL to be ready."""
    print("🔄 Waiting for database to be ready...")
    start_time = time.time()
    
    while True:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            sock.connect((host, port))
            sock.close()
            print("✅ Database is ready!")
            return True
        except (socket.error, socket.timeout):
            if time.time() - start_time > timeout:
                print("❌ Timeout waiting for database!")
                return False
            time.sleep(0.1)


def run_migrations():
    """Run Alembic migrations."""
    print("🔄 Running Alembic migrations...")
    try:
        subprocess.run(
            ["alembic", "upgrade", "head"],
            check=True,
            capture_output=False
        )
        print("✅ Migrations completed!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Migration failed: {e}")
        return False


def main():
    """Main startup sequence."""
    if not wait_for_db():
        sys.exit(1)
    
    if not run_migrations():
        sys.exit(1)
    
    print("🚀 Starting FastAPI server...")
    # Start uvicorn
    subprocess.run([
        "uvicorn",
        "api.main:app",
        "--host", "0.0.0.0",
        "--port", "8000"
    ])


if __name__ == "__main__":
    main()
