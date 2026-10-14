from datetime import date
from typing import Literal
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel, Field, field_validator

app = FastAPI(title="Household Account API")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)


class TransactionIn(BaseModel):
    type: Literal["income", "expense"]
    amount: int = Field(gt=0)
    category: str
    date: date
    memo: str = ""

    @field_validator("category")
    @classmethod
    def category_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("category must not be blank")
        return v


class Transaction(TransactionIn):
    id: str


class Summary(BaseModel):
    income: int
    expense: int
    balance: int


# In-memory store (demo). Replace with DynamoDB/RDS for persistence.
_store: dict[str, Transaction] = {}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/transactions", response_model=list[Transaction])
def list_transactions() -> list[Transaction]:
    return sorted(_store.values(), key=lambda t: t.date, reverse=True)


@app.post("/transactions", response_model=Transaction, status_code=201)
def create_transaction(body: TransactionIn) -> Transaction:
    tx = Transaction(id=str(uuid4()), **body.model_dump())
    _store[tx.id] = tx
    return tx


@app.delete("/transactions/{tx_id}", status_code=204)
def delete_transaction(tx_id: str) -> None:
    if _store.pop(tx_id, None) is None:
        raise HTTPException(status_code=404, detail="not found")


@app.get("/summary", response_model=Summary)
def summary() -> Summary:
    income = sum(t.amount for t in _store.values() if t.type == "income")
    expense = sum(t.amount for t in _store.values() if t.type == "expense")
    return Summary(income=income, expense=expense, balance=income - expense)


handler = Mangum(app)  # AWS Lambda entrypoint
