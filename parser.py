import psycopg2
from psycopg2.errors import DuplicateTable
import xml.etree.ElementTree as ET
import re
import json


def categorize_transaction(description):
    description = description.lower()
    
    if "received" in description:
        return "incoming_money"
    elif "transferred to" in description:
        return "transfers_to_mobile_numbers"
    elif "bank deposit" in description:
        return "bank_deposits"
    elif "airtime" in description:
        return "airtime_bill_payments"
    elif "power" in description:
        return "cash_power"
    elif "withdrawn" in description or "agent withdrawal" in description:
        return "withdrawal"
    elif "transferred" in description and "bank" in description:
        return "bank_transfer"
    elif "voice" in description or "pack" in description:
        return "pack"
    elif "third party" in description:
        return "third_party"
    elif "payment of" in description:
        return "payments_to_code_holders"
    
    return "uncategorized"


def setup_database():
    
    conn = psycopg2.connect(
        dbname="momo_pay",
        user="postgres",  
        password="lorita123",  
        host="localhost",
        port="5432"
    )
    cur = conn.cursor()

    
    try:
        cur.execute("""
            CREATE TABLE transactions (
                id SERIAL PRIMARY KEY,
                body TEXT,
                amount NUMERIC(10, 2),
                balance NUMERIC(10, 2),
                readable_date TIMESTAMP,
                category VARCHAR(50),
                transaction_id VARCHAR(60) UNIQUE
            );
        """)

        
        cur.execute("""
            CREATE TABLE transaction_details (
                id SERIAL PRIMARY KEY,
                transaction_id VARCHAR(60) REFERENCES transactions(transaction_id),
                status VARCHAR(50),
                description TEXT,
                additional_info JSONB
            );
        """)

        conn.commit()
        print("Database setup completed successfully.")

        
        cur.close()
        conn.close()

        
        insert_transactions_from_xml('sms_data.xml')

    except DuplicateTable as e:
        conn.commit()
        cur.close()
        conn.close()


def insert_transaction_details(transaction_id, status, description, additional_info):
    
    conn = psycopg2.connect(
        dbname="momo_pay",
        user="postgres",  
        password="lorita123",  
        host="localhost",
        port="5432"
    )
    cur = conn.cursor()

    
    if transaction_id == "N/A":
        return

    try:
        cur.execute("""
            INSERT INTO transaction_details (transaction_id, status, description, additional_info)
            VALUES (%s, %s, %s, %s)
        """, (transaction_id, status, description, json.dumps(additional_info)))

        conn.commit()

    except Exception as e:
        print(f"Error inserting transaction details: {e}")
        conn.rollback()

    finally:
        cur.close()
        conn.close()


def insert_transactions_from_xml(xml_file_path):
    
    conn = psycopg2.connect(
        dbname="momo_pay",
        user="postgres",
        password="lorita123",
        host="localhost",
        port="5432"
    )
    cur = conn.cursor()

    categories = {
        "incoming_money": [],
        "payments_to_code_holders": [],
        "transfers_to_mobile_numbers": [],
        "bank_deposits": [],
        "airtime_bill_payments": [],
        "cash_power": [],
        "withdrawal": [],
        "bank_transfer": [],
        "pack": [],
        "third_party": [],
        "uncategorized": []
    }

    
    tree = ET.parse(xml_file_path)
    root = tree.getroot()

    default_transaction = 1

    for sms in root.findall("sms"):
        body = sms.get("body", "")
        date = sms.get("date", "")
        readable_date = sms.get("readable_date", "")

        
        amount_match = re.search(r"([\d,]+) RWF", body)

        balance_match = re.search(r"balance.*?([\d,]+).*?\.", body.lower())

        if 'one-time password' in body:
            continue

        if amount_match is None:
            amount_match = re.search(r"RWF ([\d,]+)", body)

        if balance_match is None:
            balance = 0
        else:
            balance = int(str(balance_match.group(1)).replace(',', ''))

        amount = int(str(amount_match.group(1)).replace(',', '')) if amount_match else "Unknown"

        
        txid_match = re.search(r"TxId:\s?(\d+)", body)
        transaction_id = txid_match.group(1) if txid_match else "N/A"

        if transaction_id == "N/A":
            transaction_id = default_transaction
            default_transaction += 1
        
        
        category = categorize_transaction(body)
        
        
        categories[category].append({
            "transaction_id": transaction_id,
            "amount": amount,
            "date": readable_date,
            "body": body,
        })

        try:
            cur.execute("""
                INSERT INTO transactions (amount, balance, body, readable_date, category, transaction_id)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (amount, balance, body, readable_date, category, transaction_id))
            conn.commit()

            
            insert_transaction_details(transaction_id, "Completed", "Transaction completed", {"note": "Automated transaction"})
        
        except Exception as e:
            conn.rollback()
            print(f"Error inserting transaction: {e}")

    
    conn.commit()
    cur.close()
    conn.close()

    print("Transactions inserted successfully from XML.")

    
    with open("uncategorized_logs.json", "w") as log_file:
        json.dump(categories["uncategorized"], log_file, indent=4)

