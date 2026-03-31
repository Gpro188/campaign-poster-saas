# Git Deployment Setup Script
# Run this in PowerShell to initialize your repository

Write-Host "Setting up Git repository for deployment..." -ForegroundColor Green
Write-Host ""

# Check if git is installed
try {
    $gitVersion = git --version
    Write-Host "Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "Git not found! Please install from https://git-scm.com/" -ForegroundColor Red
    exit 1
}

# Initialize git repository
Write-Host "`nInitializing git repository..." -ForegroundColor Yellow
git init

# Create .gitignore if it doesn't exist
if (-not (Test-Path ".gitignore")) {
    Write-Host "Creating .gitignore..." -ForegroundColor Yellow
    $gitignoreContent = @"
node_modules/
.env
.DS_Store
.next/
dist/
build/
*.log
.vscode/
.idea/
uploads/*
!uploads/.gitkeep
"@
    $gitignoreContent | Out-File -FilePath ".gitignore" -Encoding utf8
    Write-Host ".gitignore created" -ForegroundColor Green
} else {
    Write-Host ".gitignore already exists" -ForegroundColor Green
}

# Add all files
Write-Host "`nAdding all files to git..." -ForegroundColor Yellow
git add .

# Initial commit
Write-Host "Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit - Ready for deployment"

# Rename branch to main
Write-Host "Setting up main branch..." -ForegroundColor Yellow
git branch -M main

Write-Host ""
Write-Host "Git repository initialized successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Create a new repository on GitHub:"
Write-Host "   Go to: https://github.com/new"
Write-Host "   Repository name: campaign-poster-saas"
Write-Host "   Keep it Public or Private (your choice)"
Write-Host "   Click Create repository"
Write-Host ""
Write-Host "2. Connect and push to GitHub:"
Write-Host "   Replace YOUR_USERNAME with your GitHub username:"
Write-Host ""
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/campaign-poster-saas.git"
Write-Host "   git push -u origin main"
Write-Host ""
Write-Host "3. Then follow DEPLOY_NOW.md for the rest of the steps!" -ForegroundColor Green
Write-Host ""
