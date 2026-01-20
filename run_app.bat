@echo off
echo Starting Job Prediction App...

:: Start Backend
start "Job Prediction Backend" cmd /k "cd backend && pip install -r requirements.txt && python api.py"

:: Start Frontend
start "Job Prediction Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo Application is starting!
echo Backend will be at: http://localhost:5000
echo Frontend will be at: http://localhost:5173 (or 5174)
echo.
pause
