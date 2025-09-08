import os
from pathlib import Path
import json
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import duckdb
import pandas as pd
import google.generativeai as genai

# --- Configuration ---
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# --- Gemini AI Setup ---
try:
    GOOGLE_API_KEY = os.environ["GOOGLE_API_KEY"]
    genai.configure(api_key=GOOGLE_API_KEY)
except KeyError:
    raise RuntimeError("GOOGLE_API_KEY environment variable not set. Set your key to enable AI mode.")

# --- Database Connection ---
conn = duckdb.connect(database=":memory:")

# --- FastAPI App ---
app = FastAPI(title="CSV/Excel SQL Chat Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class QueryRequest(BaseModel):
    mode: str = "nl"
    query: str

# --- Helper Functions ---
def sanitize_sql(sql: str) -> str:
    """Cleans the AI-generated SQL string."""
    s = sql.strip()
    if s.startswith("```sql"):
        s = s.replace("```sql", "").strip()
    if s.startswith("```"):
        s = s.strip("`").strip()
    if s.endswith(";"):
        s = s[:-1]
    return s.strip()

# --- API Endpoints ---
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Handles file uploads and loads data into a DuckDB table."""
    file_path = UPLOAD_DIR / Path(file.filename).name
    
    with open(file_path, "wb") as f:
        f.write(await file.read())

    table_name = Path(file.filename).stem.lower().replace(" ", "_")
    
    try:
        ext = file_path.suffix.lower()
        if ext == ".csv":
            conn.execute(f"CREATE OR REPLACE TABLE {table_name} AS SELECT * FROM read_csv_auto('{file_path.as_posix()}');")
        elif ext == ".parquet":
            conn.execute(f"CREATE OR REPLACE TABLE {table_name} AS SELECT * FROM read_parquet('{file_path.as_posix()}');")
        elif ext in (".xlsx", ".xls"):
            df = pd.read_excel(file_path)
            conn.register(f"df_{table_name}", df)
            conn.execute(f"CREATE OR REPLACE TABLE {table_name} AS SELECT * FROM df_{table_name};")
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
            
        app.state.last_table_name = table_name

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load file: {e}")

    return {"message": f"Loaded {file.filename} into table '{table_name}'", "tableName": table_name}

@app.post("/query")
async def run_query(req: QueryRequest):
    """Runs a SQL query or converts natural language to SQL."""
    
    if not hasattr(app.state, 'last_table_name'):
        raise HTTPException(status_code=400, detail="No data loaded. Please upload a file first.")
        
    table_name = app.state.last_table_name
    user_query = req.query.strip()
    
    if not user_query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    sql_to_run = ""

    if req.mode == "nl":
        try:
            sample_df = conn.execute(f"SELECT * FROM {table_name} LIMIT 5").fetchdf()
            cols_info = "\n".join([f"- '{col}' ({dtype})" for col, dtype in sample_df.dtypes.items()])
            
            prompt = f"""
            You are an expert DuckDB SQL query generator. Your task is to convert a user's natural language question into a valid SQL query for a table named '{table_name}'.
            
            Table Schema:
            {cols_info}
            
            Instructions:
            1.  Generate a single, valid SQL SELECT query.
            2.  **DO NOT** include any explanations, comments, or markdown formatting like ```sql.
            3.  Return **ONLY** the SQL query.
            
            User Question: "{user_query}"
            
            SQL Query:
            """
            
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            sql_to_run = sanitize_sql(response.text)

            if not sql_to_run.lower().startswith("select"):
                raise ValueError("AI failed to generate a valid SELECT query.")

        except Exception as e:
            print(f"[WARNING] Gemini failed: {e}. Returning an error message to the user.")
            raise HTTPException(status_code=500, detail=f"AI query generation failed: {e}. Please try writing the query in SQL mode.")
    else:
        sql_to_run = sanitize_sql(user_query)

    if not sql_to_run.lower().startswith("select"):
        raise HTTPException(status_code=403, detail="For security reasons, only SELECT queries are allowed.")

    try:
        result_df = conn.execute(sql_to_run).fetchdf()

        # --- NEW FIX STARTS HERE ---
        # Loop through all columns in the result
        for col in result_df.columns:
            # If a column's data type is boolean
            if result_df[col].dtype == 'bool':
                # Convert it to a string type so React can display it
                result_df[col] = result_df[col].astype(str)
        # --- NEW FIX ENDS HERE ---

        return {
            "sql": sql_to_run,
            "columns": list(result_df.columns),
            "rows": result_df.values.tolist() 
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error executing SQL query: {e}")