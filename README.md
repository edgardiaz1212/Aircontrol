# AATemperature - Air Conditioning Monitoring System

## Description
A comprehensive system for monitoring and managing air conditioning units, providing real-time data on performance, maintenance, and user management.

## Technologies Used
- **Backend**: Flask, SQLAlchemy, PostgreSQL
- **Frontend**: React, TypeScript, Axios
- **Additional Libraries**: Flask-CORS, Flask-JWT-Extended, Pandas, NumPy, Plotly

## Installation Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd AATemperature
   ```

2. Set up the backend:
   - Create a `.env` file in the root directory with the following variables:
     ```
     DATABASE_URL=postgresql://<username>:<password>@localhost:5432/aires
     SECRET_KEY=<your-secret-key>
     JWT_SECRET_KEY=<your-jwt-secret-key>
     ```
   - Install dependencies:
     ```bash
     pip install -r requirements.txt
     ```
   - Initialize the database:
     ```bash
     python backend/init_db.py
     ```
   - Run the backend:
     ```bash
     python backend/app.py
     ```

3. Set up the frontend:
   - Navigate to the frontend directory:
     ```bash
     cd frontend
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Run the frontend:
     ```bash
     npm run dev
     ```

4. Access the application at `http://localhost:3000`.
