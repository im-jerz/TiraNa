"""
Shared PostgreSQL connection for the withdrawals table.

Host-TiraNa connects directly to the same PostgreSQL database that
Admin-TiraNa uses, so withdrawal records can be written without HTTP
calls or API keys.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime
from sqlalchemy.sql import func

SHARED_DB_URL = os.environ.get(
    "SHARED_DB_URL",
    "postgresql://tira_admin:tira_secret@db:5432/tirana_db",
)

_shared_engine = create_engine(SHARED_DB_URL, pool_pre_ping=True)
SharedSession = sessionmaker(autocommit=False, autoflush=False, bind=_shared_engine)
SharedBase = declarative_base()


class SharedWithdrawal(SharedBase):
    __tablename__ = "withdrawals"

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, nullable=False, index=True)
    host_name = Column(String(100), nullable=True)
    host_email = Column(String(100), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    method = Column(String(50), nullable=True)
    status = Column(String(20), default="pending", index=True)
    reference_number = Column(String(100), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


def get_shared_db():
    db = SharedSession()
    try:
        yield db
    finally:
        db.close()
