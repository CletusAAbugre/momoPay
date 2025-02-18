Momopay Web App
A web application called MoMoPay is used to analyze transactions involving mobile money. It provides an interactive dashboard for users to browse, search, filter, and visualize transactions after parsing SMS transaction data and storing it in a PostgreSQL database.
Technologies used
Backend: Flask (Python) with PostgreSQL
Frontend: HTML, CSS, JavaScript
Database: PostgreSQL
Libraries: Flask, psycopg2, Chart.js (for visualizations)
Available features
Searching and filtering transactions (by date, type, and amount)
interactive graphs (summaries, pie charts, and bar charts)
Details of the Transaction See the REST API to retrieve transactions.
 Setup Instructions
 step 1.clone repostiory:
 git clone https://github.com/icyeza/momoPay.git
cd momopay
 step 2.Create & Activate a Virtual Environment:
 python -m venv venv
source venv/bin/activate   # On macOS/Linux
venv\Scripts\activate     # On Windows
step 3. Install Dependencies:
pip install -r requirements.txt
step 4.  Set Up PostgreSQL Database:
psql -U postgres
step 5. Update Database Config in app.py:
DB_CONFIG = {
    "dbname": "momo_pay",
    "user": "postgres",
    "password": "your_password",
    "host": "localhost",
    "port": 5432
}
step 6: run the app by : 
python app.py