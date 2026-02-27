"""
Configuration for the annotation engine and email notifications.
"""

# pylint: disable=too-few-public-methods
class Config:
    """
    Centralized configuration for the annotation engine and email notifications.

    :cvar VOCABULARY_PROPOSAL_RECIPIENT: Email address for proposal notifications
    :cvar SMTP_SERVER: SMTP server address
    :cvar SMTP_PORT: SMTP server port
    :cvar SMTP_USER: SMTP username
    :cvar SMTP_PASSWORD: SMTP password
    :cvar USE_MOCK_RECOMMENDATIONS: Whether to use mock recommendations
    :cvar MERGE_CONFIG: Configuration for merging recommender results
    """
    VOCABULARY_PROPOSAL_RECIPIENT: str = 'seeolin@gmail.com'
    SMTP_SERVER: str = 'smtp.gmail.com'
    SMTP_PORT: int = 587
    SMTP_USER: str = 'seeolin@gmail.com'
    SMTP_PASSWORD: str = 'yqpk dmul dvzl nayx'

    # Centralized configuration for annotation engine
    USE_MOCK_RECOMMENDATIONS: bool = True  # Set to False to use real recommendation logic
    MERGE_CONFIG: dict = {
        "ATTRIBUTE": {
            "property_label": "contains measurements of type",
            "property_uri": "http://ecoinformatics.org/oboe/oboe.1.2/oboe-core.owl#"
                            "containsMeasurementsOfType",
            "join_key": "column_name"
        }
    }

    # API endpoint configuration (private, for internal use only)
    _BASE_URL: str = "http://98.88.80.17:5000"
    _ANNOTATE_ENDPOINT: str = "/api/annotate"
    API_URL: str = f"{_BASE_URL}{_ANNOTATE_ENDPOINT}"
