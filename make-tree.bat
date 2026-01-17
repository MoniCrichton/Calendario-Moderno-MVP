@echo off
REM Genera tree.txt ignorando node_modules, dist y .git
echo Generando árbol de carpetas limpio...
tree /F /A | findstr /V "node_modules" | findstr /V "dist" | findstr /V ".git" > tree.txt
echo Listo! Revisá tree.txt
