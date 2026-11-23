import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

import account_store as store
from main import app
from match_tracking import init_tracking, tracking_status


class ProviderConnectionsTests(unittest.TestCase):
    steam_id = "76561198000000001"
    password = "Example-only-123"

    def setUp(self):
        temp = self.enterContext(tempfile.TemporaryDirectory())
        self.enterContext(patch.object(store, "DB_PATH", Path(temp) / "accounts.sqlite"))
        store.init_database()
        init_tracking()
        self.client = self.enterContext(TestClient(app))

    def sign_in_as(self, user):
        self.client.cookies.set("cs2coach_session", store.create_session(user["user_id"]))

    def test_faceit_validation_save_remove_and_isolation(self):
        self.assertEqual(self.client.delete("/api/account/faceit").status_code, 401)
        first = store.create_user("player_one", self.password)
        other = store.create_user("player_two", self.password)
        store.save_faceit_nickname(other["user_id"], "Other")
        self.sign_in_as(first)
        provider = AsyncMock(return_value={"player_id": "verified-profile", "nickname": "Player"})
        with patch("main.faceit_get", provider):
            invalid = self.client.post("/api/account/faceit", json={"nickname": "https://faceit.com.example/players/Test"})
            self.assertEqual(invalid.status_code, 400)
            provider.assert_not_called()
            saved = self.client.post("/api/account/faceit", json={"nickname": "https://www.faceit.com/tr/players/Player"})
        self.assertEqual(saved.json()["faceit_nickname"], "Player")
        self.assertFalse(saved.json()["ownership_verified"])
        self.assertIsNone(self.client.delete("/api/account/faceit").json()["faceit_nickname"])
        self.sign_in_as(other)
        self.assertEqual(self.client.get("/api/account").json()["faceit_nickname"], "Other")

    def test_steam_password_and_tracking(self):
        user = store.create_user("password_user", self.password)
        store.link_steam_account(user["user_id"], self.steam_id, "Steam Name", None)
        self.sign_in_as(user)
        with store.connection() as conn:
            conn.execute(
                "INSERT INTO cs2_tracking(user_id,steam_id,auth_cipher,cursor_code,status) VALUES(?,?,?,?,?)",
                (user["user_id"], self.steam_id, "test", "test", "active"),
            )
        denied = self.client.post("/api/account/steam/disconnect", json={"password": "wrong-password"})
        self.assertEqual(denied.status_code, 400)
        self.assertEqual(self.client.get("/api/account").json()["steam_id"], self.steam_id)
        removed = self.client.post("/api/account/steam/disconnect", json={"password": self.password})
        self.assertIsNone(removed.json()["steam_id"])
        self.assertIsNone(tracking_status(user["user_id"], self.steam_id)["tracking"])
        self.assertEqual(self.client.get("/api/steam/profile").status_code, 404)

    def test_steam_only_gains_password_without_losing_account(self):
        user = store.upsert_steam_user(self.steam_id, "Steam Player", None)
        store.create_user("taken_login", self.password)
        store.set_favorite(user["user_id"], "donk", "Spirit", True)
        self.sign_in_as(user)
        self.assertTrue(self.client.get("/api/account").json()["steam_only_login"])
        self.assertEqual(self.client.post("/api/account/steam/disconnect", json={"password": self.password}).status_code, 400)
        taken = self.client.post("/api/account/steam/disconnect", json={"username": "taken_login", "password": self.password})
        self.assertEqual(taken.status_code, 409)
        self.assertEqual(self.client.get("/api/account").json()["steam_id"], self.steam_id)
        changed = self.client.post("/api/account/steam/disconnect", json={"username": "new_login", "password": self.password})
        self.assertEqual(changed.json()["account_id"], user["user_id"])
        self.assertIsNone(changed.json()["steam_id"])
        self.client.post("/api/account/logout")
        login = self.client.post("/api/account/login", json={"username": "new_login", "password": self.password})
        self.assertEqual(login.json()["account_id"], user["user_id"])
        self.assertEqual(self.client.get("/api/account/favorites").json()["items"], [{"name": "donk", "team": "Spirit"}])
