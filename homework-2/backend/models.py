from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel

class FileBase(SQLModel):
    name: str = Field(index=True)
    content: str = Field(default="")
    language: str = Field(default="plaintext")

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
