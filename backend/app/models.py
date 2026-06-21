from sqlalchemy import Column, Integer, String, Text
from app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    repo = Column(String)
    workflows = Column(Text)
    saved_values = Column(Text)   # ✅ KEEP THIS

class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer)
    workflow = Column(String)
    status = Column(String)   # running / success / failed
    inputs = Column(Text)
    chat_history = Column(Text)
    logs = Column(Text)# ✅ STORE INPUTS