# Simple-Financial-Time-Series-Prediction-Dashboard
1. Executive Overview

The Simple Financial Time Series Prediction Dashboard is a cloud-native web application designed to democratize access to financial machine learning. It provides retail investors and students with an automated, easy-to-use platform that not only visualizes historical stock market data but also leverages modern AI (Hugging Face Transformers) to generate 7-day price forecasts. By abstracting away the complexity of Python scripts and API keys, it offers "Data Science as a Service" for the everyday user.

2. Problem Statement

The Gap: Retail investors often lack the technical skills to run their own Machine Learning models on financial data.

The Complexity: Existing tools are either expensive professional terminals (like Bloomberg) or require complex local setups (Python/Jupyter Notebooks).

The Need: There is a need for a lightweight, web-based tool that automates data collection (ETL) and offers on-demand AI predictions without requiring the user to write code.

3. Target Audience

Primary: Finance students and amateur retail investors who want data-driven insights.

Secondary: Data science hobbyists looking for a reference architecture for MLOps.

Stakeholders: Academic faculty (for grading), Project Manager (Student Developer).

4. Product Vision

"For finance students and investors who need accessible AI insights, the Financial Prediction Dashboard is a web platform that automates market forecasting. Unlike static charting tools, our product integrates live Machine Learning inference to visualize future trends."

5. Key Features (Functional Requirements)

Secure Authentication: User sign-up and login via Firebase Auth to protect personal dashboards.

Automated ETL Pipeline: A scheduled Cloud Function fetches daily closing prices (e.g., BTC-USD) from Yahoo Finance every 24 hours.

Interactive Visualization: A dynamic Chart.js line graph displaying 30 days of historical data.

AI-Powered Forecasting: On-demand integration with Hugging Face Inference API to predict the next 7 days of price movement.

Smart Caching: Reduces API costs by storing predictions in Firestore and serving cached results if a request is repeated within the same day.

6. Success Metrics

Accuracy: The system successfully fetches and stores data for 14 consecutive days without error.

Performance: AI inference results are returned to the user in under 3 seconds.

Usability: A new user can sign up and generate their first prediction within 2 minutes.

7. Assumptions & Constraints

Assumption: The Yahoo Finance API and Hugging Face API remain free and accessible.

Assumption: Users have a stable internet connection for real-time inference.

Constraint: The project must be built using the Firebase "Spark" (Free) tier.

Constraint: The AI model is strictly for educational purposes and not financial advice.

## Branching Strategy

This project follows the **GitHub Flow** workflow to ensure code stability and organized collaboration. The `main` branch is always deployable, and all development happens in isolated feature branches.

## 📐 Software Design

### Main Design Choices
To ensure the Financial Prediction Dashboard is highly maintainable and scalable, we adopted a **Layered Client-Server Architecture** utilizing a serverless backend. We prioritized **low coupling** by strictly separating the React presentation components from the external API logic (Yahoo Finance & Hugging Face). Additionally, we achieved **high cohesion** by encapsulating all authentication and database caching tasks into their own dedicated, single-purpose service modules.

### High-Level Architecture
*The image below is available in our repository at `/docs/architecture-diagram.drawio.png`.*

![High-Level Architecture](./docs/architecture-diagram.drawio.png)

**Diagram Explanation:** This diagram illustrates the clear separation of concerns in our system. The top layer represents our React UI, which only handles display logic. It sends requests to our Middle Layer (the Firebase/Controller logic), which acts as a secure middleman. This controller first checks our Database Cache for existing data, and if none is found, it securely fetches fresh data from the Bottom Layer (Yahoo Finance API) and passes it to the AI Engine (Hugging Face) for predictions. 

### User Interface Design
*The UI wireframe screenshots are available in our repository under the `/docs/wireframes/` directory.*

**Dashboard Wireframes:**
![Wireframe 1](./docs/wireframes/Screenshot%202026-01-22%20at%2012.20.28%20AM.png)
![Wireframe 2](./docs/wireframes/Screenshot%202026-01-22%20at%2012.20.35%20AM.png)
![Wireframe 3](./docs/wireframes/Screenshot%202026-01-22%20at%2012.20.44%20AM.png)
![Wireframe 4](./docs/wireframes/Screenshot%202026-01-22%20at%2012.20.54%20AM.png)
![Wireframe 5](./docs/wireframes/Screenshot%202026-01-22%20at%2012.21.01%20AM.png)
![Wireframe 6](./docs/wireframes/Screenshot%202026-01-22%20at%2012.21.07%20AM.png)
![Wireframe 7](./docs/wireframes/Screenshot%202026-01-22%20at%2012.21.18%20AM.png)

**UI Design Explanation:** These screens demonstrate our focus on a clean, accessible, and user-friendly experience. Key design features include:
* **Consistent Styling:** Primary actions (like the "Predict" button) use a unified color scheme and clear typography.
* **System Feedback:** Loading states and error messages are clearly visualized so the user is aware when the AI is processing heavy data.
* **Mobile-Friendly Layout:** The dashboard utilizes responsive grid systems so the charts and navigation menus remain readable on smaller mobile screens.

### The Workflow Rules
1.  **Main Branch (`main`)**
    * This is the "Source of Truth" for the project.
    * It contains only production-ready, tested code.
    * Direct commits to `main` are restricted; code enters only via Pull Requests (PRs).

2.  **Feature Branches**
    * Created from `main` for every new task, feature, or bug fix.
    * **Naming Convention:** `category/description-in-kebab-case`
    * **Examples:**
        * `feature/auth-setup` (For setting up Login/Signup)
        * `feature/dashboard-ui` (For frontend layout work)
        * `fix/api-timeout` (For fixing a specific bug)
        * `docs/architecture-diagram` (For updating documentation)

3.  **Pull Requests (PRs)**
    * When a feature is complete, a Pull Request is opened to merge the feature branch back into `main`.
    * This allows for code review and automated testing before the code is integrated.
    * 

## 🐳 Quick Start – Local Development (Docker)

You can run this project locally using Docker without installing Node.js or Firebase tools on your machine.

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.

### Instructions
1.  **Build the Image:**
    ```bash
    docker build -t financial-dashboard .
    ```

2.  **Run the Container:**
    ```bash
    docker run -p 8080:8080 financial-dashboard
    ```

3.  **View the App:**
    Open your browser and visit: `http://localhost:8080`
    
