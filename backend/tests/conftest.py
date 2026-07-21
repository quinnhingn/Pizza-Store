import sys
import pytest
import pytest_asyncio
from app.core.database import engine

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

@pytest_asyncio.fixture(autouse=True)
async def dispose_engine():
    """
    Autouse fixture to dispose of the SQLAlchemy engine pool after every test.
    This ensures that asyncpg connections bound to one event loop are not reused in another.
    """
    yield
    await engine.dispose()
