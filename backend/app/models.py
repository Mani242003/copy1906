from sqlalchemy import Column, Integer, String, Text
from app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    repo = Column(String)
    type = Column(String)              # ✅ ADD
    workflows = Column(Text)

class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer)
    component = Column(String)
    action = Column(String)
    status = Column(String)