@echo off
start "风向标网站服务" /D "%~dp0" "C:\Users\liuzi\.workbuddy\binaries\node\versions\22.22.2\node.exe" server.js
timeout /t 3 >nul
start http://localhost:8090/admin.html
