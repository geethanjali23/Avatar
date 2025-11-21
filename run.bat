@echo off
for /f "usebackq tokens=1* delims==" %%i in (.env) do set %%i=%%j
python main.py
pause
