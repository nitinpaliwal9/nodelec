#models.py

import uuid
import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, String, Integer, ForeignKey, JSON, Enum, Float, DateTime, Boolean, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# ==========================================
# ENUMS & SYSTEM CONFIGURATIONS
# ==========================================

class FileStatus(PyEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class MatchType(PyEnum):
    EXACT = "exact"
    FUZZY = "fuzzy"
    REVIEW = "review"
    UNMATCHED = "unmatched"

# ==========================================
# TENANCY & AUTH
# ==========================================
# The real security boundary between customers. Everything below this
# point (uploads, results, catalog visibility) is scoped to an
# Organization -- never to a client-supplied string like the old
# "distributor_id" field, which was never verified against anything
# and let any caller read any other tenant's data.

class Organization(Base):
    """A paying customer account (e.g. one distributor)."""
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    api_keys = relationship("ApiKey", back_populates="organization", cascade="all, delete-orphan")
    bom_files = relationship("BOMFile", back_populates="organization")


class ApiKey(Base):
    """
    A credential issued to an Organization. Only a salted hash of the
    key is ever stored -- the raw key is shown once at creation time
    (see manage_api_keys.py) and can never be recovered afterward,
    the same way a password would be handled.
    """
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    key_hash = Column(String, unique=True, index=True, nullable=False)
    key_prefix = Column(String, nullable=False)  # e.g. "nk_live_a1b2c3" -- safe to display, not reversible to the full key
    label = Column(String, nullable=True)        # e.g. "Production", "Zapier integration"

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)

    organization = relationship("Organization", back_populates="api_keys")


class MailboxConnection(Base):
    """
    A dedicated inbox an Organization has given out to its customers
    for RFQs (e.g. "rfq@formax-intake.nodelec.ai" or a mailbox they
    already own). One mailbox belongs to exactly one organization --
    that's what makes an incoming email's tenant unambiguous without
    needing an API key on the email itself.
    """
    __tablename__ = "mailbox_connections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    label = Column(String, nullable=True)  # e.g. "Formax RFQ intake"

    imap_host = Column(String, nullable=False)
    imap_port = Column(Integer, nullable=False, default=993)
    username = Column(String, nullable=False)

    # Fernet-encrypted, not plaintext -- see email_intake/crypto.py.
    # This is a meaningful step up from storing the password as-is, but
    # it is not a substitute for a real secrets manager/KMS long-term;
    # anyone with both this DB and MAILBOX_CREDENTIAL_KEY can decrypt it.
    encrypted_password = Column(String, nullable=False)

    folder = Column(String, nullable=False, default="INBOX")
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_polled_at = Column(DateTime(timezone=True), nullable=True)

    organization = relationship("Organization")


class ErpConnection(Base):
    """
    An organization's own ERP instance (currently: Tally, reached over
    its local XML HTTP gateway -- no cloud account or third-party
    credential involved, since Tally runs on the distributor's own
    machine/network). One org can have one connection per erp_type.
    """
    __tablename__ = "erp_connections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    erp_type = Column(String, nullable=False, default="tally")  # extensible: sap/oracle/netsuite/odoo later
    label = Column(String, nullable=True)

    host = Column(String, nullable=False)  # e.g. "localhost" or the distributor's LAN IP running Tally
    port = Column(Integer, nullable=False, default=9000)
    company_name = Column(String, nullable=False)  # Tally requires specifying which company to query

    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    last_sync_status = Column(String, nullable=True)  # "success" or "failed: <reason>"

    organization = relationship("Organization")


# ==========================================
# SUPPLY CHAIN ENGINE CACHE SCHEMAS
# ==========================================

class ComponentMaster(Base):
    """
    The local cache of verified real-world components.
    Saves API budget by preventing redundant network calls to Nexar/Octopart.
    """
    __tablename__ = "components_master"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mpn = Column(String, unique=True, index=True, nullable=False)  # Strict Manufacturer Part Number
    normalized_mpn = Column(String, index=True, nullable=False)
    manufacturer = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, index=True, nullable=True)           # Passives, ICs, Discrete Connectors
    lifecycle_status = Column(String, default="ACTIVE", index=True)# ACTIVE, OBSOLETE, EOL
    rohs_status = Column(String, nullable=True)                    # COMPLIANT, NON-COMPLIANT
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class PartAlias(Base):
    """
    A persistent lookup dictionary that maps messy history permutations
    directly to their clean verified ComponentMaster ID.
    If a customer uses a learned typo again, the match finishes in 0ms.
    """
    __tablename__ = "part_aliases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dirty_string = Column(String, unique=True, index=True, nullable=False) # e.g., "ST M32-F103"
    resolved_component_id = Column(UUID(as_uuid=True), ForeignKey("components_master.id", ondelete="CASCADE"), nullable=False)
    
    # Relationship linkage mapping
    component = relationship("ComponentMaster")


class ComponentPrice(Base):
    """
    A price is NOT global the way a component's identity is -- two
    distributors selling the same STM32F103C8T6 charge different
    prices, so this is a per-organization overlay on top of the
    shared ComponentMaster catalog, kept current by ERP sync
    (erp/sync.py). One row per (organization, component); a sync
    updates it in place rather than appending history.
    """
    __tablename__ = "component_prices"
    __table_args__ = (
        UniqueConstraint("organization_id", "component_id", name="uq_component_price_org_component"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    component_id = Column(UUID(as_uuid=True), ForeignKey("components_master.id", ondelete="CASCADE"), nullable=False, index=True)

    unit_price = Column(Float, nullable=False)
    currency = Column(String, nullable=False, default="INR")
    stock_quantity = Column(Integer, nullable=True)

    source = Column(String, nullable=False, default="tally")
    synced_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    organization = relationship("Organization")
    component = relationship("ComponentMaster")

# ==========================================
# BATCH WORKFLOW INGESTION TABLES
# ==========================================

class BOMFile(Base):
    """Tracks batch processing file tracking context."""
    __tablename__ = "bom_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # The actual tenant-isolation boundary -- set from the authenticated
    # API key, never from anything the client sends directly.
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)

    # A free-text label for who/which branch submitted this (e.g. an
    # employee ID). Purely descriptive -- NOT a security boundary.
    distributor_id = Column(String, nullable=False, index=True)

    status = Column(Enum(FileStatus), default=FileStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    file_path = Column(String, nullable=False) # Local volume route or cloud object URL

    # Back-reference relationship for tracking file rows automatically
    rows = relationship("BOMRow", back_populates="file", cascade="all, delete-orphan")
    organization = relationship("Organization", back_populates="bom_files")

class BOMRow(Base):
    """Individual structural entries within an uploaded Bill of Materials sheet."""
    __tablename__ = "bom_rows"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_id = Column(UUID(as_uuid=True), ForeignKey("bom_files.id", ondelete="CASCADE"), nullable=False)
    row_number = Column(Integer, nullable=False)
    
    # Customer Input Data
    raw_component_text = Column(String, nullable=False)
    requested_quantity = Column(Integer, default=1)
    
    # System Match Results (Linked to the Local Cache Master Engine)
    matched_component_id = Column(UUID(as_uuid=True), ForeignKey("components_master.id", ondelete="SET NULL"), nullable=True)
    matched_mpn = Column(String, nullable=True, index=True)
    match_confidence = Column(Float, default=0.0)  # Scoring metric: 0.0 to 1.0
    match_status = Column(Enum(MatchType), default=MatchType.UNMATCHED)

    # Pricing, looked up from ComponentPrice (the file's own organization's
    # ERP-synced price) at the moment this row was matched -- deliberately
    # NOT a live join, so an already-issued quote doesn't silently reprice
    # itself if the ERP's price changes later.
    unit_price = Column(Float, nullable=True)
    line_total = Column(Float, nullable=True)
    price_currency = Column(String, nullable=True)

    # A REVIEW-status row's match_status never changes once written --
    # that's the honest record of "this wasn't auto-matched with full
    # confidence". A human's decision is tracked separately here so the
    # audit trail (and any future "review-tier accuracy" reporting)
    # stays intact regardless of what a reviewer decided.
    review_action = Column(String, nullable=True)  # "confirmed" | "rejected" | null = pending
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Extracted metadata structure token storage for deep debugging
    extracted_metadata = Column(JSON, nullable=True)

    # Database relationships linking files to specific matching results
    file = relationship("BOMFile", back_populates="rows")
    component = relationship("ComponentMaster")


class UnmatchedPart(Base):
    """
    Stores parts that failed matching so sales/procurement
    can manually investigate them later.
    """

    __tablename__ = "unmatched_parts"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    file_id = Column(
        UUID(as_uuid=True),
        ForeignKey("bom_files.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    raw_part_number = Column(
        String,
        nullable=False
    )

    quantity = Column(
        Integer,
        default=1
    )

    reason = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

class ProcessingError(Base):
    """
    Captures ingestion failures for debugging.
    """

    __tablename__ = "processing_errors"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    file_id = Column(
        UUID(as_uuid=True),
        ForeignKey("bom_files.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    stage = Column(
        String,
        nullable=False
    )

    error_message = Column(
        String,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )