#!/bin/bash

# Claude Code Pre-Database Edit Hook
# This runs before any database modification

echo "⚠️  DATABASE MODIFICATION DETECTED!"
echo "=================================="
echo ""
echo "You are about to modify the database. Please confirm:"
echo ""
echo "Fixed credentials that must NEVER change:"
echo "  - Admin: f@pachoman.com / C@rlos2025"
echo "  - Test users: seller@test.com, buyer@test.com / password123"
echo ""
echo "Before proceeding:"
echo "1. Is this change explicitly requested by the user?"
echo "2. Have you created a backup?"
echo "3. Are you modifying passwords? (DON'T!)"
echo ""
echo "If login is failing, check the CODE not the DATABASE:"
echo "  - Import errors (next-auth vs next-auth/next)"
echo "  - Route configuration"
echo "  - Environment variables"
echo ""
echo "Press Ctrl+C to cancel, or wait 10 seconds to continue..."
sleep 10