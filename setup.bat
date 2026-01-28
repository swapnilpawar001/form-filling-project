@echo off
echo Setting up Form Filling Project...

echo Installing dependencies...
npm install

echo Setting up database...
npm run db:push

echo Setup complete! You can now run:
echo npm run dev
pause