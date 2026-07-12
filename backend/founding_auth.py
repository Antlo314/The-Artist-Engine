"""
Compatibility shim — simple name/email/password auth lives in simple_auth.py.
All previous imports from founding_auth keep working.
"""

from simple_auth import (  # noqa: F401
    AppUser,
    DAILY_LIMITS,
    auth_configured,
    auth_required,
    require_founding_user,
    resolve_user,
    assert_quota,
    record_usage,
    get_usage_snapshot,
    acquire_master_slot,
    release_master_slot,
    init_db,
    register_user,
    login_user,
    logout_token,
    list_users_admin,
    user_from_token,
)
