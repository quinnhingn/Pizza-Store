"""
Test package for Pizza Store Backend API.

Contains automated integration and unit test suites:
- test_day6_api: Tests for Categories & Products CRUD endpoints
- test_upload_api: Tests for Cloudinary & Local fallback image uploads
- test_catalog_api: Tests for Master Catalog (Ingredients) endpoints
"""

import sys
from pathlib import Path

# Ensure backend root directory (parent of tests folder) is in sys.path
# so that imports like `from app.main import app` work regardless of where tests are run.
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

__all__ = [
    "backend_root",
]
