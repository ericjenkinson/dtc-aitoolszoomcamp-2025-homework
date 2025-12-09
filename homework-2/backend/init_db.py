from database import create_db_and_tables
import models  # Register models

if __name__ == "__main__":
    create_db_and_tables()
    print("Database tables created.")
