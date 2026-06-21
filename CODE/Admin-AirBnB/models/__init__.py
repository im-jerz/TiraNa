import time
import logging

from models.admin_user import AdminUser
from models.otp_code import OTPCode
from models.login_attempt import LoginAttempt
from models.support_ticket import SupportTicket
from models.ticket_message import TicketMessage
from models.activity_log import ActivityLog
from models.audit_log import AuditLog
from models.system_setting import SystemSetting
from models.booking_copy import BookingCache
from models.payment_copy import PaymentCache
from models.review_copy import ReviewCache
from models.dispute import Dispute, DisputeMessage
from database import Base, engine

logger = logging.getLogger(__name__)


def init_db(retries: int = 5, delay: int = 2):
    for attempt in range(1, retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables created successfully")
            return
        except Exception as e:
            if attempt == retries:
                logger.error("Failed to create tables after %d retries: %s", retries, e)
                raise
            logger.warning("Table creation attempt %d failed: %s. Retrying...", attempt, e)
            time.sleep(delay)
