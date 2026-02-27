"""
Unit tests for the send_email_notification function and related email notification logic.
"""

from unittest.mock import MagicMock
import smtplib
import pytest
from webapp.run import send_email_notification
from webapp.models.proposal_request import ProposalRequest, TermDetails, SubmitterInfo
from webapp.config import Config


@pytest.fixture(name="proposal_request")
def proposal_request_fixture():
    """
    Fixture for a sample ProposalRequest used in email notification tests.
    """
    return ProposalRequest(
        target_vocabulary="TestVocab",
        term_details=TermDetails(
            label="TestLabel",
            description="TestDescription",
            evidence_source="TestSource",
        ),
        submitter_info=SubmitterInfo(
            email="test@example.com",
            orcid_id="0000-0000-0000-0000",
            attribution_consent=True,
        ),
    )


def test_send_email_notification_success(monkeypatch, proposal_request):
    """
    Test that send_email_notification completes successfully with valid SMTP settings.
    """
    monkeypatch.setenv("PROPOSAL_RECIPIENT_EMAIL", Config.VOCABULARY_PROPOSAL_RECIPIENT)
    monkeypatch.setenv("SMTP_USER", "user@example.com")
    monkeypatch.setenv("SMTP_PASSWORD", "password")

    mock_smtp = MagicMock()
    monkeypatch.setattr("smtplib.SMTP", lambda *args, **kwargs: mock_smtp)

    send_email_notification(proposal_request)
    assert mock_smtp.starttls.called
    assert mock_smtp.login.called
    assert mock_smtp.sendmail.called
    assert mock_smtp.quit.called


# def test_send_email_notification_missing_recipient(monkeypatch, proposal_request, capsys):
#     monkeypatch.delenv("PROPOSAL_RECIPIENT_EMAIL", raising=False)
#     monkeypatch.setenv("SMTP_USER", "user@example.com")
#     monkeypatch.setenv("SMTP_PASSWORD", "password")
#     send_email_notification(proposal_request)
#     captured = capsys.readouterr()
#     assert "PROPOSAL_RECIPIENT_EMAIL not set" in captured.out
#     assert "Payload received" in captured.out

# def test_send_email_notification_missing_credentials(monkeypatch, proposal_request, capsys):
#     monkeypatch.setenv("PROPOSAL_RECIPIENT_EMAIL", Config.VOCABULARY_PROPOSAL_RECIPIENT)
#     monkeypatch.delenv("SMTP_USER", raising=False)
#     monkeypatch.delenv("SMTP_PASSWORD", raising=False)
#     send_email_notification(proposal_request)
#     captured = capsys.readouterr()
#     assert "SMTP credentials not set" in captured.out


def test_send_email_notification_exception(monkeypatch, proposal_request, capsys):
    """
    Test that send_email_notification handles SMTPException gracefully.
    """
    monkeypatch.setenv("PROPOSAL_RECIPIENT_EMAIL", Config.VOCABULARY_PROPOSAL_RECIPIENT)
    monkeypatch.setenv("SMTP_USER", "user@example.com")
    monkeypatch.setenv("SMTP_PASSWORD", "password")

    class FailingSMTP:
        """Mock SMTP class that always raises SMTPException on sendmail."""

        def starttls(self):
            """Mock starttls method."""

        def login(self, u, p):
            """Mock login method."""

        def sendmail(self, u, r, t):
            """Mock sendmail method that raises SMTPException."""
            raise smtplib.SMTPException("SMTP error")

        def quit(self):
            """Mock quit method."""

    monkeypatch.setattr("smtplib.SMTP", lambda *args, **kwargs: FailingSMTP())
    send_email_notification(proposal_request)
    captured = capsys.readouterr()
    assert "Failed to send email" in captured.out


# if __name__ == "__main__":
#     from webapp.config import Config
#     from webapp.run import ProposalRequest, TermDetails, SubmitterInfo, send_email_notification
#     import sys
#     print("Running live email notification test...")
#     proposal = ProposalRequest(
#         target_vocabulary="TestVocab",
#         term_details=TermDetails(
#             label="LiveTestLabel",
#             description="Live test of email notification system.",
#             evidence_source="UnitTest"
#         ),
#         submitter_info=SubmitterInfo(
#             email=Config.VOCABULARY_PROPOSAL_RECIPIENT,
#             orcid_id="0000-0000-0000-0000",
#             attribution_consent=True
#         )
#     )
#     send_email_notification(proposal)
#     print("Live email notification test completed.")
