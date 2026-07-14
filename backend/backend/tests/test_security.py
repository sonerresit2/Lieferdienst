from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)


def test_hash_password():
    password = "passwort123"

    hashed = hash_password(password)

    assert hashed != password


def test_verify_password_success():
    password = "passwort123"

    hashed = hash_password(password)

    assert verify_password(password, hashed)


def test_verify_password_wrong_password():
    password = "passwort123"

    hashed = hash_password(password)

    assert not verify_password("falschespasswort", hashed)


def test_create_and_decode_token():
    token = create_access_token({"sub": "1"})

    payload = decode_access_token(token)

    assert payload is not None
    assert payload["sub"] == "1"


def test_decode_invalid_token():
    payload = decode_access_token("ungueltiger.token")

    assert payload is None
