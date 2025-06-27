<div align="center">

# 🎯 FeedbackFlow

An assignment for DPDzero Full Stack Intern role.
A modern web app for transparent, structured feedback between managers and employees—enabling growth-focused conversations, sentiment tracking, and privacy with empathy.
https://dpdzero.arhya.codes

</div>

---

### Capabilities

- **Role-based Authentication:** Manager and Employee roles with secure login.

- **Team Management:** Managers see only their team; employees see only their own feedback ;

- **Dashboard Analytics:** Visual statistics and insights tailored for both managers and employees.

- **Peer-to-Peer Feedback:** Employees can give feedback to peers, but only to those under the same manager.

- **Structured Feedback:** Managers submit feedback with strengths, areas to improve, and sentiment (positive/neutral/negative).

- **Feedback History:** Both roles see a timeline of all feedback.

- **Edit Feedback:** Managers and Employees can edit feedback after submission.

- **Acknowledge Feedback:** Employees acknowledge receipt of feedback.

- **Comment on Feedback:** Employees can add comments to feedback.

- **Anonymous Peer Feedback:** Option for anonymous feedback between peers.

- **Notifications:** Email or in-app alerts for new feedback.

- **Tagging:** Add predefined tags like "communication", "leadership", etc., or create custom tags as needed.

- **Export:** Download feedback as PDF.

- **Markdown Support:** Comments support markdown formatting.

---

### UI Screenshots

- Manager dashboard (team overview, sentiment trends)
  ![Manager dashboard screenshot](assets/MDH.PNG)
- Manager given feedback (timeline view)
  ![Employee feedback screenshot](assets/MDGF.PNG)
- Employee dashboard (feedback timeline)
  ![Employee dashboard screenshot](assets/EDH.PNG)
- Employee Settings (profile, password change)
  ![Employee settings screenshot](assets/EDS.PNG)
- Feedback modal (with reminders, required strengths)
  ![Feedback modal screenshot](assets/FM.PNG)

---

### System Diagrams

- **ERD:** Entity-Relationship Diagram of users, feedback, comments, tags.
  ![ERD screenshot](assets/ERD.PNG)
- **API Endpoints:** REST API structure.
  ![API Endpoints screenshot](assets/Endpoints.PNG)
- **Auth Flow:** Diagram showing login, role assignment, and access control.
  ![Auth Flow screenshot](assets/AuthFLow.PNG)

---

### Tech Stack

- **Frontend:** React, Tailwind CSS, Lucide React, Axios
- **Backend:** Python,FastAPI, JWT Auth
- **Database:** MongoDB (NoSQL)
- **Other:** Markdown rendering, PDF export, Email service

---

### Deployment

- _Live demo:_ [FeedbackFlow](https://dpdzero.arhya.codes)

### Installation

1.  **Clone the repo:**  
    `git clone <repo-url> && cd project`
2.  **Backend:**

    ```bash
    cd backend
    # Build the image
    docker build -t feedback-backend .
    ```

    Create `.env` file with:

    ```env
    MONGODB_URL=your_mongodb_url
    DATABASE_NAME=feedback_db
    SECRET_KEY=your_secret_key
    SMTP_SERVER=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USERNAME=your_email
    SMTP_PASSWORD=your_password
    FROM_EMAIL=no-reply@feedbackflow.com
    ```

    ```bash
    # Run the container with environment file
    docker run -p 8000:8000 --env-file .env feedback-backend

    # Or run with individual environment variables
    docker run -p 8000:8000 \
    -e MONGODB_URL=your_mongodb_url \
    -e DATABASE_NAME=feedback_db \
    -e SECRET_KEY=your_secret_key \
    -e SMTP_SERVER=smtp.gmail.com \
    -e SMTP_PORT=587 \
    -e SMTP_USERNAME=your_email \
    -e SMTP_PASSWORD=your_password \
    -e FROM_EMAIL=no-reply@feedbackflow.com \
    feedback-backend
    ```

    Access API docs at: http://localhost:8000/docs

3.  **Frontend:**
    ```
    cd frontend
    npm install
    npm run dev
    ```
4.  **Access:**
    - Frontend: http://localhost:3000
    - Backend: http://localhost:8000

---
