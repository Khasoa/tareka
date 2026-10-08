from urllib.parse import urlsplit


def validate_http_url(value: str | None) -> str | None:
    """Accept only absolute HTTP(S) URLs with a valid-looking hostname."""
    if value is None:
        return None

    value = value.strip()
    if not value:
        return None

    try:
        parsed = urlsplit(value)
        hostname = parsed.hostname

        if (
            parsed.scheme.lower() not in {"http", "https"}
            or not parsed.netloc
            or not hostname
            or any(char.isspace() for char in value)
            or parsed.username is not None
            or parsed.password is not None
        ):
            raise ValueError

        # Accessing .port also catches malformed port numbers.
        _ = parsed.port

    except (ValueError, TypeError) as exc:
        raise ValueError("Enter a valid absolute HTTP or HTTPS URL.") from exc

    return value
