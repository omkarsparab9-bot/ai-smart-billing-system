"""
Pydantic data schemas for request/response validation.
Compatible with Python 3.15 Windows CPython without C++ build tools.
"""
from typing import List, Optional
from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str = "staff"
    phone: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    phone: Optional[str] = None
    created_at: str

class ProductCreate(BaseModel):
    name: str
    category: str
    sku: str
    price: float
    cost_price: float
    stock_quantity: int
    min_stock_level: int = 5
    tax_rate: float = 18.0
    supplier: Optional[str] = ""

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    min_stock_level: Optional[int] = None
    tax_rate: Optional[float] = None
    supplier: Optional[str] = None
    status: Optional[str] = None

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = ""
    address: Optional[str] = ""

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class InvoiceItemInput(BaseModel):
    product_id: int
    quantity: int
    unit_price: float
    cost_price: Optional[float] = 0.0
    discount: Optional[float] = 0.0
    tax_rate: Optional[float] = 18.0

class InvoiceCreate(BaseModel):
    customer_id: Optional[int] = None
    customer_name: str
    customer_phone: Optional[str] = ""
    items: List[InvoiceItemInput]
    discount_amount: float = 0.0
    payment_method: str = "Cash"
    payment_status: str = "Paid"
    notes: Optional[str] = ""

class InventoryAdjustment(BaseModel):
    product_id: int
    quantity_change: int
    reason: str = "Manual Adjustment"

class AIChatRequest(BaseModel):
    message: str

class StoreSettingsUpdate(BaseModel):
    store_name: str
    tagline: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    address: Optional[str] = ""
    gst_tax_number: Optional[str] = ""
    currency_symbol: Optional[str] = "₹"
    default_tax_rate: Optional[float] = 18.0
