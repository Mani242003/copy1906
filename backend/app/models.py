from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(Integer, primary_key=True, index=True)
    component = Column(String)
    action = Column(String)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
