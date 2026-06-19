import requests, os, smtplib

# def notify(status, parsed, details=None):
#     # Teams
#     requests.post(os.getenv("TEAMS_WEBHOOK"), json={
#         "text": f"{status} - {parsed}"
#     })

#     # Email
#     with smtplib.SMTP("smtp.office365.com", 587) as s:
#         s.starttls()
#         s.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASS"))
#         s.sendmail(
#             os.getenv("EMAIL_USER"),
#             os.getenv("EMAIL_USER"),
#             f"Subject:{status}\n\n{details}"
#         )
def notify(status, parsed, details=None):
    # Dummy mode (no real notifications)
    print("===== NOTIFICATION =====")
    print("Status:", status)
    print("Data:", parsed)

    if details:
        print("Details:", details)

    print("========================")
