"""
SQLAlchemy ORM Model for Sales Records.
"""
from sqlalchemy import Column, Integer, String, Float, Date
from app.database import Base

class SalesRecord(Base):
    __tablename__ = "sales_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    transaction_id = Column(String(50), unique=True, nullable=False, index=True)
    order_date = Column(Date, nullable=False, index=True)
    product = Column(String(100), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    region = Column(String(50), nullable=False, index=True)
    sales_channel = Column(String(50), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0)
    status = Column(String(50), nullable=False, index=True)
    net_revenue = Column(Float, nullable=False)

    def to_dict(self):
        """Helper to convert model instance to dictionary."""
        return {
            "transaction_id": self.transaction_id,
            "order_date": str(self.order_date),
            "product": self.product,
            "category": self.category,
            "region": self.region,
            "sales_channel": self.sales_channel,
            "quantity": self.quantity,
            "unit_price": self.unit_price,
            "discount_amount": self.discount_amount,
            "status": self.status,
            "net_revenue": self.net_revenue
        }

