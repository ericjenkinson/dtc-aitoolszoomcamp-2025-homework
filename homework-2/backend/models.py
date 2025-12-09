from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel

class Interview(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FileBase(SQLModel):
    name: str = Field(index=True)
    content: str = Field(default="")
    language: str = Field(default="plaintext")
    interview_id: Optional[int] = Field(default=None, foreign_key="interview.id", ondelete="CASCADE")

class File(FileBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    last_modified: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FileCreate(FileBase):
    pass

class FileRead(FileBase):
    id: int
    last_modified: datetime

class FileUpdate(SQLModel):
    name: Optional[str] = None
    content: Optional[str] = None
    language: Optional[str] = None

