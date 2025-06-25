import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from typing import Optional

def send_feedback_request_email(manager_email: str, employee_name: str, manager_name: str) -> bool:
    """
    Send feedback request email to manager
    """
    try:
        # Email configuration - you'll need to set these environment variables
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_username = os.getenv("SMTP_USERNAME")
        smtp_password = os.getenv("SMTP_PASSWORD")
        from_email = os.getenv("FROM_EMAIL", smtp_username)
        
        if not smtp_username or not smtp_password:
            print("SMTP credentials not configured")
            return False
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = manager_email
        msg['Subject'] = f"Feedback Request from {employee_name}"
        
        # Email body
        body = f"""
Dear {manager_name},

{employee_name} has requested feedback from you through the Feedback App.

Please log in to the feedback system to provide your valuable feedback:
🔗 Login Link: https://dpdzero.arhya.codes

Your feedback helps in professional growth and development.

Best regards,
Feedback App Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(msg)
        server.quit()
        
        return True
        
    except Exception as e:
        print(f"Error sending email: {e}")
        return False