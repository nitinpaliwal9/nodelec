# engine/__init__.py

"""
Nodelec Matching Engine Package

Exports:

- BOMEngine
    Primary production matching engine used by worker.py

- MultiAxisMatcher
    Secondary matching layer for future
    cross-reference and distributor intelligence workflows.
"""

from .legacy_engine import BOMEngine
from .matching_core import MultiAxisMatcher

__all__ = [
    "BOMEngine",
    "MultiAxisMatcher"
]