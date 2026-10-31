"""Persistent account, password and session storage for CS2 Coach."""
from __future__ import annotations

import base64
import hashlib
import hmac
import os
import secrets
import sqlite3
import time
import uuid
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql://" + DATABASE_URL[len("postgres://"):]
if os.getenv("APP_DATABASE_PATH"):
    DB_PATH = Path(os.environ["APP_DATABASE_PATH"])
elif os.getenv("RENDER_DISK_PATH"):
    DB_PATH = Path(os.environ["RENDER_DISK_PATH"]) / "accounts.sqlite3"
else:
    DB_PATH = Path(__file__).resolve().parent / "data" / "accounts.sqlite3"
def persistent_storage_configured() -> bool:
    if DATABASE_URL:
        return True
    if os.getenv("RENDER"):
        return bool(os.getenv("RENDER_DISK_PATH"))
    return True

if not DATABASE_URL:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)


@contextmanager
def connection() -> Iterator[Any]:
    """Yield one transactional connection and always release it on exit."""
    if DATABASE_URL:
        try:
            import psycopg
            from psycopg.rows import dict_row
        except ImportError as exc:
            raise RuntimeError("DATABASE_URL is set but psycopg is not installed") from exc
        conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
    else:
        conn = sqlite3.connect(DB_PATH, timeout=10)

    try:
        if not DATABASE_URL:
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA foreign_keys = ON")
        yield conn
        conn.commit()
    except BaseException:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    finally:
        conn.close()

@contextmanager
def db_cursor(conn: Any) -> Iterator[Any]:
    cur = conn.cursor()
    try:
        yield cur
    finally:
        cur.close()

def init_database() -> None:
    """Create the account schema and its indexes as one transaction."""
    with connection() as conn:
        with db_cursor(conn) as cur:
            # SQLite needs an explicit write transaction for atomic DDL; PostgreSQL
            # accepts BEGIN and rolls the complete schema change back on failure.
            cur.execute("BEGIN" if DATABASE_URL else "BEGIN IMMEDIATE")
            cur.execute("""CREATE TABLE IF NOT EXISTS coach_users (
                user_id TEXT PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                faceit_nickname TEXT,
                created_at BIGINT NOT NULL
            )""")
            cur.execute("""CREATE TABLE IF NOT EXISTS coach_sessions (
                token_hash TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES coach_users(user_id) ON DELETE CASCADE,
                expires_at BIGINT NOT NULL
            )""")
            cur.execute("CREATE INDEX IF NOT EXISTS coach_sessions_expiry ON coach_sessions(expires_at)")

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=16384, r=8, p=1, dklen=64)
    return "scrypt$16384$8$1$" + base64.urlsafe_b64encode(salt).decode() + "$" + base64.urlsafe_b64encode(digest).decode()


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, n, r, p, salt_text, digest_text = encoded.split("$", 5)
        if algorithm != "scrypt":
            return False
        salt = base64.urlsafe_b64decode(salt_text.encode())
        expected = base64.urlsafe_b64decode(digest_text.encode())
        actual = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=int(n), r=int(r), p=int(p), dklen=len(expected))
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def create_user(username: str, password: str) -> dict[str, Any]:
    user_id = str(uuid.uuid4())
    encoded = hash_password(password)
    try:
        with connection() as conn:
            with db_cursor(conn) as cur:
                cur.execute("INSERT INTO coach_users(user_id, username, password_hash, created_at) VALUES (%s, %s, %s, %s)" if DATABASE_URL else "INSERT INTO coach_users(user_id, username, password_hash, created_at) VALUES (?, ?, ?, ?)", (user_id, username, encoded, int(time.time())))
    except Exception as exc:
        if "unique" in str(exc).lower() or "duplicate" in str(exc).lower():
            raise ValueError("Bu kullanıcı adı zaten kullanımda.") from exc
        raise
    return {"user_id": user_id, "username": username, "faceit_nickname": None}


def authenticate_user(username: str, password: str) -> dict[str, Any] | None:
    with connection() as conn:
        with db_cursor(conn) as cur:
            cur.execute("SELECT user_id, username, password_hash, faceit_nickname FROM coach_users WHERE username = %s" if DATABASE_URL else "SELECT user_id, username, password_hash, faceit_nickname FROM coach_users WHERE username = ?", (username,))
            row = cur.fetchone()
    if not row or not verify_password(password, row["password_hash"]):
        return None
    return {"user_id": row["user_id"], "username": row["username"], "faceit_nickname": row["faceit_nickname"]}


def create_session(user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    expires_at = int(time.time()) + 60 * 60 * 24 * 30
    with connection() as conn:
        with db_cursor(conn) as cur:
            cur.execute("DELETE FROM coach_sessions WHERE expires_at <= %s" if DATABASE_URL else "DELETE FROM coach_sessions WHERE expires_at <= ?", (int(time.time()),))
            cur.execute("INSERT INTO coach_sessions(token_hash, user_id, expires_at) VALUES (%s, %s, %s)" if DATABASE_URL else "INSERT INTO coach_sessions(token_hash, user_id, expires_at) VALUES (?, ?, ?)", (token_hash, user_id, expires_at))
    return token


def get_user_for_session(token: str | None) -> dict[str, Any] | None:
    if not token:
        return None
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    with connection() as conn:
        with db_cursor(conn) as cur:
            cur.execute("SELECT u.user_id, u.username, u.faceit_nickname FROM coach_sessions s JOIN coach_users u ON u.user_id=s.user_id WHERE s.token_hash=%s AND s.expires_at>%s" if DATABASE_URL else "SELECT u.user_id, u.username, u.faceit_nickname FROM coach_sessions s JOIN coach_users u ON u.user_id=s.user_id WHERE s.token_hash=? AND s.expires_at>?", (token_hash, int(time.time())))
            row = cur.fetchone()
    return dict(row) if row else None


def delete_session(token: str | None) -> None:
    if not token:
        return
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    with connection() as conn:
        with db_cursor(conn) as cur:
            cur.execute("DELETE FROM coach_sessions WHERE token_hash=%s" if DATABASE_URL else "DELETE FROM coach_sessions WHERE token_hash=?", (token_hash,))


def save_faceit_nickname(user_id: str, nickname: str) -> None:
    with connection() as conn:
        with db_cursor(conn) as cur:
            cur.execute("UPDATE coach_users SET faceit_nickname=%s WHERE user_id=%s" if DATABASE_URL else "UPDATE coach_users SET faceit_nickname=? WHERE user_id=?", (nickname, user_id))