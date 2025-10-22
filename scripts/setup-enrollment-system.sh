#!/bin/bash

# Student Enrollment System Setup Script
# This script helps set up the database schema for the intelligent student enrollment system

echo "🎓 Setting up Student Enrollment System Database Schema..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory."
    echo "   Please run 'supabase init' first or navigate to your Supabase project directory."
    exit 1
fi

# Create migration file
MIGRATION_FILE="supabase/migrations/$(date +%Y%m%d%H%M%S)_student_enrollment_schema.sql"

echo "📝 Creating migration file: $MIGRATION_FILE"

# Copy the schema to the migration file
cp scripts/student-enrollment-schema.sql "$MIGRATION_FILE"

echo "✅ Migration file created successfully!"

# Ask if user wants to apply the migration
read -p "🚀 Do you want to apply this migration to your database? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Applying migration..."
    supabase db push
    echo "✅ Migration applied successfully!"
else
    echo "⏭️  Migration created but not applied."
    echo "   Run 'supabase db push' when you're ready to apply it."
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Configure your environment variables in .env.local"
echo "2. Set up Resend for email functionality"
echo "3. Test the system with sample data"
echo ""
echo "📚 For detailed documentation, see STUDENT_ENROLLMENT_README.md"
