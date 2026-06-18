import anthropic
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import date
from supabase import create_client
from fastapi.responses import StreamingResponse
import csv
import io
import os
from dotenv import load_dotenv


load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# -------------------------
# MODELS
# -------------------------

class Transaction(BaseModel):
    type: str
    amount: float
    description: Optional[str] = None
    category_name: Optional[str] = None
    category_icon: Optional[str] = None
    date: Optional[str] = None

class Goal(BaseModel):
    name: str
    target_amount: float
    current_amount: Optional[float] = 0
    deadline: Optional[str] = None

class UpdateGoal(BaseModel):
    amount_to_add: float

# -------------------------
# HELPER
# -------------------------

def get_user_id(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        return user.user.id
    except:
        raise HTTPException(status_code=401, detail="Invalid token!")

# -------------------------
# ENDPOINTS
# -------------------------

@app.get("/")
def home():
    return {"message": "Budget Tracker API is running!"}

@app.get("/transactions")
def get_transactions(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("transactions").select("*").eq("user_id", user_id).order("date", desc=True).execute()
    return result.data

@app.post("/transactions")
def create_transaction(data: Transaction, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("transactions").insert({
        "user_id": user_id,
        "type": data.type,
        "amount": data.amount,
        "description": data.description,
        "category_name": data.category_name,
        "category_icon": data.category_icon,
        "date": data.date or str(date.today())
    }).execute()
    return result.data

@app.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    supabase.table("transactions").delete().eq("id", transaction_id).eq("user_id", user_id).execute()
    return {"message": "Transaction deleted!"}

@app.get("/goals")
def get_goals(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("goals").select("*").eq("user_id", user_id).execute()
    return result.data

@app.post("/goals")
def create_goal(data: Goal, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("goals").insert({
        "user_id": user_id,
        "name": data.name,
        "target_amount": data.target_amount,
        "current_amount": data.current_amount,
        "deadline": data.deadline
    }).execute()
    return result.data


@app.patch("/goals/{goal_id}")
def update_goal(goal_id: str, data: UpdateGoal, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    
    # Prende il goal attuale
    goal = supabase.table("goals").select("*").eq("id", goal_id).eq("user_id", user_id).single().execute()
    
    if not goal.data:
        raise HTTPException(status_code=404, detail="Goal not found!")
    
    new_amount = goal.data["current_amount"] + data.amount_to_add
    
    result = supabase.table("goals").update({
        "current_amount": new_amount
    }).eq("id", goal_id).execute()
    
    return result.data
# Elimina goal
@app.delete("/goals/{goal_id}")
def delete_goal(goal_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    supabase.table("goals").delete().eq("id", goal_id).eq("user_id", user_id).execute()
    return {"message": "Goal deleted!"}

# Modifica goal
class UpdateGoalFull(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    deadline: Optional[str] = None

@app.patch("/goals/{goal_id}/edit")
def edit_goal(goal_id: str, data: UpdateGoalFull, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    updates = {k: v for k, v in data.dict().items() if v is not None}
    result = supabase.table("goals").update(updates).eq("id", goal_id).eq("user_id", user_id).execute()
    return result.data

# Aggiorna savings
class UpdateGoal(BaseModel):
    amount_to_add: float

@app.patch("/goals/{goal_id}")
def update_goal(goal_id: str, data: UpdateGoal, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    goal = supabase.table("goals").select("*").eq("id", goal_id).eq("user_id", user_id).single().execute()
    if not goal.data:
        raise HTTPException(status_code=404, detail="Goal not found!")
    new_amount = goal.data["current_amount"] + data.amount_to_add
    result = supabase.table("goals").update({"current_amount": new_amount}).eq("id", goal_id).execute()
    return result.data

# AI suggestion per goal
@app.get("/goals/{goal_id}/suggestion")
def goal_suggestion(goal_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    goal = supabase.table("goals").select("*").eq("id", goal_id).eq("user_id", user_id).single().execute()
    if not goal.data:
        raise HTTPException(status_code=404, detail="Goal not found!")
    
    g = goal.data
    remaining = g["target_amount"] - g["current_amount"]
    
    if remaining <= 0:
        return {"suggestion": "🏆 Goal completed! Great job!"}
    
    days_left = None
    monthly_needed = None
    
    if g.get("deadline"):
        from datetime import datetime
        deadline = datetime.strptime(g["deadline"], "%Y-%m-%d")
        today = datetime.today()
        days_left = (deadline - today).days
        if days_left > 0:
            months_left = days_left / 30
            monthly_needed = remaining / months_left

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    prompt = f"""Give a short, motivating financial tip for this savings goal:
Goal: {g['name']}
Target: €{g['target_amount']}
Saved so far: €{g['current_amount']} ({round((g['current_amount']/g['target_amount'])*100)}%)
Remaining: €{remaining}
{f"Days left: {days_left}" if days_left else "No deadline set"}
{f"Monthly savings needed: €{monthly_needed:.2f}" if monthly_needed else ""}

Rules:
- Maximum 2 sentences.
- Mention at least one number from the data.
- Be encouraging and practical.
- Use exactly one emoji.
- Do not repeat all the input data.
- Write in clear, natural English. """

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return {
        "suggestion": message.content[0].text,
        "monthly_needed": monthly_needed,
        "days_left": days_left
    }

@app.get("/stats")
def get_stats(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    transactions = supabase.table("transactions").select("*").eq("user_id", user_id).execute()
    total_income = sum(t["amount"] for t in transactions.data if t["type"] == "income")
    total_expense = sum(t["amount"] for t in transactions.data if t["type"] == "expense")
    balance = total_income - total_expense
    return {
        "totale_entrate": total_income,
        "totale_uscite": total_expense,
        "saldo": balance
    }


# Endpoint — AI report
@app.post("/ai/report")
def ai_report(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    
    transactions = supabase.table("transactions").select("*").eq("user_id", user_id).execute()
    goals = supabase.table("goals").select("*").eq("user_id", user_id).execute()
    
    total_income = sum(t["amount"] for t in transactions.data if t["type"] == "income")
    total_expense = sum(t["amount"] for t in transactions.data if t["type"] == "expense")
    balance = total_income - total_expense
    savings_rate = round(((total_income - total_expense) / total_income) * 100) if total_income > 0 else 0
    
    by_category = {}
    for t in transactions.data:
        if t["type"] == "expense":
            cat = t.get("category_name") or "Other"
            by_category[cat] = by_category.get(cat, 0) + t["amount"]
    
    top_categories = sorted(by_category.items(), key=lambda x: x[1], reverse=True)[:5]
    
    prompt = f"""You are a personal finance advisor. Analyze this user's financial data and provide a detailed, actionable report.

FINANCIAL DATA:
- Total Income: €{total_income:.2f}
- Total Expenses: €{total_expense:.2f}
- Net Balance: €{balance:.2f}
- Savings Rate: {savings_rate}%
- Number of transactions: {len(transactions.data)}

TOP EXPENSE CATEGORIES:
{chr(10).join([f"- {cat}: €{amount:.2f}" for cat, amount in top_categories])}

SAVINGS GOALS:
{chr(10).join([f"- {g['name']}: €{g['current_amount']:.2f} / €{g['target_amount']:.2f}" for g in goals.data]) if goals.data else "- No goals set yet"}

Please provide:
1. A brief overall financial health assessment (use emojis)
2. Key insights about spending patterns
3. 3-4 specific actionable recommendations
4. Encouragement based on their progress

Keep it concise, friendly and motivating. Use bullet points. Maximum 200 words."""

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return {"report": message.content[0].text}



@app.get("/export/transactions")
def export_transactions(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("transactions").select("*").eq("user_id", user_id).order("date", desc=True).execute()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Date', 'Type', 'Amount', 'Category', 'Description'])
    
    for t in result.data:
        writer.writerow([
            t.get('date', ''),
            t.get('type', ''),
            t.get('amount', ''),
            t.get('category_name', ''),
            t.get('description', '')
        ])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"}
    )

#pagina admin

ADMIN_USER_ID = os.getenv("ADMIN_USER_ID")

def require_admin(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    if user_id != ADMIN_USER_ID:
        raise HTTPException(status_code=403, detail="Access denied!")
    return user_id

@app.get("/admin/stats")
def admin_stats(authorization: str = Header(...)):
    require_admin(authorization)
    
    users = supabase.auth.admin.list_users()
    all_transactions = supabase.table("transactions").select("*").execute()
    all_goals = supabase.table("goals").select("*").execute()
    
    total_income = sum(t["amount"] for t in all_transactions.data if t["type"] == "income")
    total_expense = sum(t["amount"] for t in all_transactions.data if t["type"] == "expense")
    
    return {
        "total_users": len(users),
        "total_transactions": len(all_transactions.data),
        "total_goals": len(all_goals.data),
        "total_income_tracked": total_income,
        "total_expense_tracked": total_expense,
    }

@app.get("/admin/users")
def admin_users(authorization: str = Header(...)):
    require_admin(authorization)
    users = supabase.auth.admin.list_users()
    return [
        {
            "id": u.id,
            "email": u.email,
            "username": u.user_metadata.get("username", ""),
            "created_at": str(u.created_at),
            "last_sign_in": str(u.last_sign_in_at),
            "email_confirmed": u.email_confirmed_at is not None
        }
        for u in users
    ]


class ChatMessage(BaseModel):
    message: str
    history: list = []

@app.post("/ai/chat")
def ai_chat(data: ChatMessage, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    
    # Prende i dati reali dell'utente
    transactions = supabase.table("transactions").select("*").eq("user_id", user_id).execute()
    goals = supabase.table("goals").select("*").eq("user_id", user_id).execute()
    
    total_income = sum(t["amount"] for t in transactions.data if t["type"] == "income")
    total_expense = sum(t["amount"] for t in transactions.data if t["type"] == "expense")
    balance = total_income - total_expense
    savings_rate = round(((total_income - total_expense) / total_income) * 100) if total_income > 0 else 0
    
    by_category = {}
    for t in transactions.data:
        if t["type"] == "expense":
            cat = t.get("category_name") or "Other"
            by_category[cat] = by_category.get(cat, 0) + t["amount"]
    
    top_categories = sorted(by_category.items(), key=lambda x: x[1], reverse=True)[:3]
    
    system_prompt = f"""You are a friendly and knowledgeable personal finance advisor for Budget Tracker app.
You have access to the user's real financial data:

FINANCIAL SUMMARY:
- Total Income: €{total_income:.2f}
- Total Expenses: €{total_expense:.2f}  
- Net Balance: €{balance:.2f}
- Savings Rate: {savings_rate}%
- Total Transactions: {len(transactions.data)}

TOP EXPENSE CATEGORIES:
{chr(10).join([f"- {cat}: €{amount:.2f}" for cat, amount in top_categories]) if top_categories else "- No expense data yet"}

SAVINGS GOALS:
{chr(10).join([f"- {g['name']}: €{g['current_amount']:.2f} / €{g['target_amount']:.2f} ({round((g['current_amount']/g['target_amount'])*100)}%)" for g in goals.data]) if goals.data else "- No goals set yet"}

Guidelines:
- Be friendly, encouraging and specific
- Always reference their REAL data when relevant
- Give actionable advice with specific numbers
- Keep responses concise (max 3-4 sentences)
- Use emojis sparingly
- Respond in the same language as the user"""

    messages = []
    for msg in data.history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": data.message})

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        system=system_prompt,
        messages=messages
    )
    
    return {"response": response.content[0].text}