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
import math
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
    try:
        # Ping leggero su Supabase per evitare che vada in pausa dopo 7 giorni
        supabase.table("transactions").select("id").limit(1).execute()
    except Exception as e:
        print("Keepalive Supabase ping warning:", e)
    return {"message": "Budget Tracker API & Database are active!"}

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

    roundup_info = None

    MIN_SAFETY_BALANCE = 20.00  # Soglia di protezione liquidità (20.00€)

    # Automated Smart Vault (Coffre-Fort) Round-Up logic
    if FEATURE_FLAGS.get("smart_vault_roundup", {}).get("enabled") and data.type == "expense":
        # Calcolo del saldo netto disponibile dell'utente
        all_tx = supabase.table("transactions").select("*").eq("user_id", user_id).execute().data or []
        tot_inc = sum(t["amount"] for t in all_tx if t.get("type") == "income")
        tot_exp = sum(t["amount"] for t in all_tx if t.get("type") == "expense")
        rem_balance = tot_inc - tot_exp  # Saldo residuo dopo la spesa

        # 1. CONTROLLO LIQUIDITÀ: Se il saldo residuo è inferiore a 5.00€, l'arrotondamento viene SOSPESO
        if rem_balance >= MIN_SAFETY_BALANCE:
            next_euro = math.ceil(data.amount)
            if next_euro > data.amount:
                spare_change = round(next_euro - data.amount, 2)
                max_allowed_spare = round(rem_balance - MIN_SAFETY_BALANCE, 2)
                actual_spare = min(spare_change, max_allowed_spare)

                if actual_spare > 0:
                    # 2. CONTROLLO GOALS ATTIVI: Verifica se l'utente ha almeno un obiettivo attivo
                    goals_res = supabase.table("goals").select("*").eq("user_id", user_id).execute()
                    goals = goals_res.data or []
                    active_goals = [g for g in goals if g.get("current_amount", 0) < g.get("target_amount", 1)]

                    if active_goals:
                        target_goal = active_goals[0]
                        new_amount = target_goal.get("current_amount", 0) + actual_spare
                        supabase.table("goals").update({"current_amount": new_amount}).eq("id", target_goal["id"]).execute()
                        roundup_info = {
                            "spare_change": actual_spare,
                            "goal_name": target_goal.get("name", "Savings Goal"),
                            "new_current": new_amount
                        }

    return {
        "transaction": result.data,
        "roundup": roundup_info
    }

@app.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    supabase.table("transactions").delete().eq("id", transaction_id).eq("user_id", user_id).execute()
    return {"message": "Transaction deleted!"}

@app.delete("/user/account")
def delete_user_account(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    try:
        # Delete user's transactions & goals
        supabase.table("transactions").delete().eq("user_id", user_id).execute()
        supabase.table("goals").delete().eq("user_id", user_id).execute()
        # Permanently delete user from Supabase Auth
        supabase.auth.admin.delete_user(user_id)
        return {"message": "Account and all associated data permanently deleted!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete account: {str(e)}")


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
    
    # Prende fino a 10 transazioni recenti con date e descrizioni
    recent_transactions = transactions.data[:10]
    recent_tx_summary = "\n".join([
        f"- {t.get('date', 'N/A')}: {t.get('description') or t.get('category_name') or 'Expense'} - €{t.get('amount', 0):.2f} ({t.get('category_name', 'General')})"
        for t in recent_transactions
    ]) if recent_transactions else "- No recent transactions recorded yet"

    prompt = f"""You are a warm, extremely friendly, polite, and encouraging personal finance advisor for Budget Tracker.
Analyze this user's real transaction history and financial goals to provide a personalized, beautifully formatted financial report.

FINANCIAL OVERVIEW:
- Total Income: €{total_income:.2f} 💰
- Total Expenses: €{total_expense:.2f} 💸
- Net Balance: €{balance:.2f} 📊
- Savings Rate: {savings_rate}% 📈
- Total Transactions Recorded: {len(transactions.data)} 📝

RECENT TRANSACTIONS & DATES:
{recent_tx_summary}

TOP EXPENSE CATEGORIES:
{chr(10).join([f"- {cat}: €{amount:.2f}" for cat, amount in top_categories])}

SAVINGS GOALS:
{chr(10).join([f"- {g['name']}: €{g['current_amount']:.2f} / €{g['target_amount']:.2f}" for g in goals.data]) if goals.data else "- No goals set yet"}

Guidelines for the response:
1. Be super friendly, warm, polite, and motivating ✨!
2. Use rich, cheerful emojis (🌟 📊 💡 🎯 💵 🏆 🎉) in headings and key points.
3. Reference specific recent transactions, dates, or top spending categories so the user knows you truly analyzed their exact activity.
4. Provide 3 actionable, easy-to-follow financial tips.
5. End with an inspiring closing message!
6. Respond in the same language as the user's data or request (Italian / English / French)."""

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

# -------------------------
# ADMIN & SYSTEM CONTROLS
# -------------------------

ADMIN_USER_ID = os.getenv("ADMIN_USER_ID")

FEATURE_FLAGS = {
    "open_banking_sync": {
        "key": "open_banking_sync",
        "name": "Open Banking Sync (Plaid/Tink API)",
        "description": "Automatic real-time transaction ingestion from bank accounts",
        "status": "Coming Soon",
        "enabled": False
    },
    "smart_vault_roundup": {
        "key": "smart_vault_roundup",
        "name": "Smart Vault (Coffre-Fort) Round-Up",
        "description": "Automatic spare change round-up into savings goals",
        "status": "Beta",
        "enabled": True
    },
    "biometric_2fa_emergency": {
        "key": "biometric_2fa_emergency",
        "name": "2FA & Biometric Emergency Release",
        "description": "Identity verification and OTP security for vault withdrawals",
        "status": "In Development",
        "enabled": False
    }
}

def require_admin(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    if user_id != ADMIN_USER_ID:
        raise HTTPException(status_code=403, detail="Access denied! Admin privileges required.")
    return user_id

@app.get("/admin/check")
def check_admin(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    return {"is_admin": user_id == ADMIN_USER_ID}

@app.get("/admin/stats")
def admin_stats(authorization: str = Header(...)):
    require_admin(authorization)
    
    users = supabase.auth.admin.list_users()
    all_transactions = supabase.table("transactions").select("*").execute()
    all_goals = supabase.table("goals").select("*").execute()
    
    total_income = sum(t["amount"] for t in all_transactions.data if t["type"] == "income")
    total_expense = sum(t["amount"] for t in all_transactions.data if t["type"] == "expense")
    net_volume = total_income - total_expense
    
    verified_users = sum(1 for u in users if u.email_confirmed_at is not None)
    unverified_users = len(users) - verified_users
    
    return {
        "total_users": len(users),
        "verified_users": verified_users,
        "unverified_users": unverified_users,
        "total_transactions": len(all_transactions.data),
        "total_goals": len(all_goals.data),
        "total_income_tracked": total_income,
        "total_expense_tracked": total_expense,
        "net_volume_tracked": net_volume,
        "system_status": "Operational",
        "database_status": "Connected"
    }

@app.get("/admin/users")
def admin_users(authorization: str = Header(...)):
    require_admin(authorization)
    users = supabase.auth.admin.list_users()
    return [
        {
            "id": u.id,
            "email": u.email,
            "username": u.user_metadata.get("username", "") or u.email.split("@")[0],
            "avatar_url": u.user_metadata.get("avatar_url", ""),
            "created_at": str(u.created_at),
            "last_sign_in": str(u.last_sign_in_at) if u.last_sign_in_at else "Never",
            "email_confirmed": u.email_confirmed_at is not None,
            "is_admin": u.id == ADMIN_USER_ID,
            "role": "Admin" if u.id == ADMIN_USER_ID else "User"
        }
        for u in users
    ]

@app.get("/admin/features")
def get_admin_features(authorization: str = Header(...)):
    require_admin(authorization)
    return list(FEATURE_FLAGS.values())

class UpdateFeatureFlag(BaseModel):
    enabled: Optional[bool] = None
    status: Optional[str] = None

@app.patch("/admin/features/{feature_key}")
def update_admin_feature(feature_key: str, data: UpdateFeatureFlag, authorization: str = Header(...)):
    require_admin(authorization)
    if feature_key not in FEATURE_FLAGS:
        raise HTTPException(status_code=404, detail="Feature flag not found!")
    if data.enabled is not None:
        FEATURE_FLAGS[feature_key]["enabled"] = data.enabled
    if data.status is not None:
        FEATURE_FLAGS[feature_key]["status"] = data.status
    return FEATURE_FLAGS[feature_key]


# -------------------------
# AI CHAT & TEMPORAL QUERIES
# -------------------------

class ChatMessage(BaseModel):
    message: str
    history: list = []

# In-memory storage fallback for chat history per user
USER_CHAT_STORE = {}

@app.get("/ai/chat/history")
def get_chat_history(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    return {"history": USER_CHAT_STORE.get(user_id, [])}

@app.delete("/ai/chat/history")
def clear_chat_history(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    USER_CHAT_STORE[user_id] = []
    return {"message": "Chat history cleared!"}

@app.post("/ai/chat")
def ai_chat(data: ChatMessage, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    
    # Get user metadata for currency and AI personality preferences
    token = authorization.replace("Bearer ", "")
    user_data = supabase.auth.get_user(token)
    user_meta = user_data.user.user_metadata or {} if user_data and user_data.user else {}
    
    currency_symbol = user_meta.get("currency_symbol", "€")
    ai_personality = user_meta.get("ai_personality", "warm")
    
    # Prende le transazioni e i goals reali dell'utente
    transactions_res = supabase.table("transactions").select("*").eq("user_id", user_id).execute()
    goals_res = supabase.table("goals").select("*").eq("user_id", user_id).execute()
    
    tx_list = transactions_res.data or []
    goals_list = goals_res.data or []
    
    total_income = sum(t["amount"] for t in tx_list if t.get("type") == "income")
    total_expense = sum(t["amount"] for t in tx_list if t.get("type") == "expense")
    balance = total_income - total_expense
    savings_rate = round(((total_income - total_expense) / total_income) * 100) if total_income > 0 else 0
    
    from datetime import datetime, timedelta
    today = date.today()
    today_str = str(today)
    yesterday_str = str(today - timedelta(days=1))
    seven_days_ago_str = str(today - timedelta(days=7))
    
    # Spese di Ieri
    yesterday_tx = [t for t in tx_list if t.get("type") == "expense" and t.get("date") == yesterday_str]
    yesterday_total = sum(t["amount"] for t in yesterday_tx)
    yesterday_summary = ", ".join([f"{t.get('description') or t.get('category_name') or 'Expense'} ({currency_symbol}{t.get('amount'):.2f})" for t in yesterday_tx]) if yesterday_tx else "No expenses recorded yesterday"
    
    # Spese degli ultimi 7 giorni
    last_7_days_tx = [t for t in tx_list if t.get("type") == "expense" and t.get("date") and t.get("date") >= seven_days_ago_str]
    last_7_days_total = sum(t["amount"] for t in last_7_days_tx)
    last_7_days_summary = "\n".join([
        f"- {t.get('date')}: {t.get('description') or t.get('category_name') or 'Expense'} - {currency_symbol}{t.get('amount', 0):.2f} [{t.get('category_name', 'General')}]"
        for t in last_7_days_tx[:15]
    ]) if last_7_days_tx else "- No expenses recorded in the last 7 days"
    
    # Spese per categoria
    by_category = {}
    for t in tx_list:
        if t.get("type") == "expense":
            cat = t.get("category_name") or "Other"
            by_category[cat] = by_category.get(cat, 0) + t["amount"]
    
    top_categories = sorted(by_category.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Personality persona definition
    if ai_personality == "strict":
        persona_instructions = "Adopt a formal, highly analytical, precise financial analyst persona 📊. Focus on direct financial optimization, metrics, efficiency, and concise data-driven facts."
    elif ai_personality == "gamified":
        persona_instructions = "Adopt an energetic, enthusiastic, gamified financial coach persona 🎮. Use high-energy language, cheerful emojis, challenge targets, level-up rewards tone, and playful motivation!"
    else: # warm
        persona_instructions = "Adopt a warm, polite, encouraging personal finance coach persona 🌟. Be supportive, cheerful, empathetic, and helpful."

    system_prompt = f"""You are an intelligent personal finance advisor for Budget Tracker app.
{persona_instructions}

You have access to the user's real, live financial data with exact date breakdowns:

PREFERRED CURRENCY SYMBOL: {currency_symbol}
CURRENT DATE: {today_str}

FINANCIAL OVERVIEW:
- Net Balance: {currency_symbol}{balance:.2f} 📊
- Total Income: {currency_symbol}{total_income:.2f} 💰
- Total Expenses: {currency_symbol}{total_expense:.2f} 💸
- Savings Rate: {savings_rate}% 📈
- Total Recorded Transactions: {len(tx_list)} 📝

TEMPORAL EXPENSE DATA (USE FOR EXACT DATE QUESTIONS):
- Yesterday ({yesterday_str}): Total {currency_symbol}{yesterday_total:.2f} ({yesterday_summary})
- Last 7 Days Total: {currency_symbol}{last_7_days_total:.2f}
- Last 7 Days Purchases:
{last_7_days_summary}

TOP EXPENSE CATEGORIES:
{chr(10).join([f"- {cat}: {currency_symbol}{amount:.2f}" for cat, amount in top_categories]) if top_categories else "- No expense category data yet"}

SAVINGS GOALS:
{chr(10).join([f"- {g['name']}: {currency_symbol}{g['current_amount']:.2f} / {currency_symbol}{g['target_amount']:.2f} ({round((g['current_amount']/g['target_amount'])*100) if g.get('target_amount') else 0}%)" for g in goals_list]) if goals_list else "- No goals set yet"}

Guidelines:
1. Respond in clear English (or in the user's exact writing language).
2. Follow your designated persona tone ({ai_personality}).
3. Use the preferred currency symbol ({currency_symbol}) for all amounts.
4. If the user asks about specific dates like "Yesterday", "Last week", or "Where did I spend money", use the exact numbers from TEMPORAL EXPENSE DATA."""

    messages = []
    for msg in data.history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": data.message})

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=400,
        system=system_prompt,
        messages=messages
    )
    
    ai_reply = response.content[0].text
    
    # Save conversation to history store
    if user_id not in USER_CHAT_STORE:
        USER_CHAT_STORE[user_id] = []
    
    USER_CHAT_STORE[user_id].append({"role": "user", "content": data.message})
    USER_CHAT_STORE[user_id].append({"role": "assistant", "content": ai_reply})
    # Keep last 30 messages in memory
    USER_CHAT_STORE[user_id] = USER_CHAT_STORE[user_id][-30:]
    
    return {"response": ai_reply}