import re
import mysql.connector
from pymongo import MongoClient
import pandas as pd

# MongoDB Configuration
MONGO_URI = "mongodb+srv://vaibhavsoincs22:betagama21@cluster0.fbe7m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
MONGO_DB = "test"  # Your MongoDB database
MONGO_COLLECTION = "managers"  # Your collection

# MySQL Configuration
MYSQL_HOST = "localhost"
MYSQL_USER = "root"
MYSQL_PASSWORD = "umang2003"
MYSQL_DB = "inventory_db"
MYSQL_TABLE = "managers"

# Connect to MongoDB
mongo_client = MongoClient(MONGO_URI)
mongo_db = mongo_client[MONGO_DB]
mongo_collection = mongo_db[MONGO_COLLECTION]

# Fetch data from MongoDB
data = list(mongo_collection.find({}, {"_id": 0, "extractedText": 1}))  # Fetch only 'extractedText'

# Check if data is empty
if not data:
    print("No data found in MongoDB!")
    exit()

# Convert to DataFrame
df = pd.DataFrame(data)

# Debug: Print DataFrame columns
print("Columns in DataFrame:", df.columns)

# Ensure 'extractedText' exists
if "extractedText" not in df.columns:
    print("Error: 'extractedText' column not found in MongoDB data!")
    print(df.head())
    exit()

# Function to extract ID, Name, and Phone from extractedText
def parse_extracted_text(text):
    match = re.search(r"MANAGER ID (\d+).*PHONE:\s*(\d+)\s*(\w+)", text)
    if match:
        return match.group(1), match.group(2), match.group(3)
    return None, None, None

df["manager_id"], df["phone"], df["name"] = zip(*df["extractedText"].apply(parse_extracted_text))

# Remove unnecessary columns
df = df[["manager_id", "name", "phone"]]

# Connect to MySQL
mysql_conn = mysql.connector.connect(
    host=MYSQL_HOST,
    user=MYSQL_USER,
    password=MYSQL_PASSWORD,
    database=MYSQL_DB
)
mysql_cursor = mysql_conn.cursor()

# Create Table if Not Exists
create_table_sql = """
CREATE TABLE IF NOT EXISTS managers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    manager_id VARCHAR(100),
    name VARCHAR(255),
    phone VARCHAR(20)
);
"""
mysql_cursor.execute(create_table_sql)

# Insert Data into MySQL
insert_sql = "INSERT INTO managers (manager_id, name, phone) VALUES (%s, %s, %s)"
for _, row in df.iterrows():
    mysql_cursor.execute(insert_sql, tuple(row))

mysql_conn.commit()

# Close connections
mysql_cursor.close()
mysql_conn.close()
mongo_client.close()

print("Data migrated successfully!")
