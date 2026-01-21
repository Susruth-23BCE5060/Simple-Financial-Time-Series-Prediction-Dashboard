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
