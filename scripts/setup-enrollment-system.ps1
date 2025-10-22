# Student Enrollment System Setup Script (PowerShell)
# This script helps set up the database schema for the intelligent student enrollment system

Write-Host "🎓 Setting up Student Enrollment System Database Schema..." -ForegroundColor Green

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version 2>$null
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if we're in a Supabase project
if (-not (Test-Path "supabase/config.toml")) {
    Write-Host "❌ Not in a Supabase project directory." -ForegroundColor Red
    Write-Host "   Please run 'supabase init' first or navigate to your Supabase project directory." -ForegroundColor Yellow
    exit 1
}

# Create migration file
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$migrationFile = "supabase/migrations/${timestamp}_student_enrollment_schema.sql"

Write-Host "📝 Creating migration file: $migrationFile" -ForegroundColor Blue

# Copy the schema to the migration file
Copy-Item "scripts/student-enrollment-schema.sql" $migrationFile

Write-Host "✅ Migration file created successfully!" -ForegroundColor Green

# Ask if user wants to apply the migration
$response = Read-Host "🚀 Do you want to apply this migration to your database? (y/N)"
if ($response -eq "y" -or $response -eq "Y") {
    Write-Host "🔄 Applying migration..." -ForegroundColor Blue
    supabase db push
    Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
} else {
    Write-Host "⏭️  Migration created but not applied." -ForegroundColor Yellow
    Write-Host "   Run 'supabase db push' when you're ready to apply it." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup complete! Next steps:" -ForegroundColor Green
Write-Host "1. Configure your environment variables in .env.local" -ForegroundColor White
Write-Host "2. Set up Resend for email functionality" -ForegroundColor White
Write-Host "3. Test the system with sample data" -ForegroundColor White
Write-Host ""
Write-Host "📚 For detailed documentation, see STUDENT_ENROLLMENT_README.md" -ForegroundColor Cyan
