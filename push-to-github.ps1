# Quick GitHub Push Script
# Run this after creating your GitHub repository

Write-Host "Pushing to GitHub..." -ForegroundColor Green
Write-Host ""

# Set your GitHub username
$githubUser = "Gpro188"
$repoName = "campaign-poster-saas"

# Add remote
Write-Host "Adding GitHub remote..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin "https://github.com/$githubUser/$repoName.git"

# Rename branch to main
Write-Host "Setting up main branch..." -ForegroundColor Yellow
git branch -M main

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "Repository: https://github.com/$githubUser/$repoName" -ForegroundColor Cyan
Write-Host ""
git push -u origin main

Write-Host ""
Write-Host "✅ Pushed to GitHub successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT: Go to YOUR_DEPLOYMENT_STEPS.md and continue with Step 2 (MongoDB Atlas)" -ForegroundColor Cyan
Write-Host ""
