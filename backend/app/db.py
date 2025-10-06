from sqlmodel import SQLModel, create_engine, Session
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data.db"
engine = create_engine(
    f"sqlite:///{DB_PATH}",
    echo=False,
    connect_args={"check_same_thread": False},  # <-- avoids SQLite thread complaint during reload
)

def init_db():
    from . import models  # noqa
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
