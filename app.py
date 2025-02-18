from flask import Flask, jsonify, render_template
import psycopg2  
from parser import setup_database, insert_transactions_from_xml  

app = Flask(__name__)

categories = {
    "incoming_money": "Incoming Money",
    "payments_to_code_holders": "Payments to Code Holders",
    "transfers_to_mobile_numbers": "Transfer to Mobile Numbers",
    "bank_deposits": "Bank Deposits",
    "airtime_bill_payments": "Airtime Purchase",
    "cash_power": "Cash Power",
    "withdrawal": "Withdrawal",
    "bank_transfer": "Bank Transfer",
    "pack": "Internet and Voice Bundle Purchases",
    "third_party": "Third Party",
    "uncategorized": "No category"
    }


@app.route('/')
def home():
    return render_template("index.html")  


@app.route("/transactions", methods=["GET"])
def get_transactions():
    conn = psycopg2.connect(  
        dbname="momo_pay",
        user="postgres",
        password="lorita123",
        host="localhost",
        port="5432"
    )
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions")
    transactions = cursor.fetchall()

    cursor.execute("SELECT SUM(amount) AS total_amount FROM transactions")
    total_amount = cursor.fetchone()[0]
    conn.close()

    
    transactions_json = [
        {"id": row[0], "body": row[1], "amount": row[2], "balance": row[3], "readable_date": row[4], "category": row[5], "total_transactions": total_amount}
        for row in transactions
    ]

    return jsonify(transactions_json)

if __name__ == "__main__":
    setup_database()  
    print("Data Processing Completed!")
    app.run(debug=True)
