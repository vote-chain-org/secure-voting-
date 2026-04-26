#!/bin/bash

# ==============================================================================
# VoteChain User Management Helper
# ==============================================================================

DB_NAME="votechain"
DB_USER="postgres"

function show_usage() {
    echo "Usage: ./manage_users.sh [command] [email]"
    echo ""
    echo "Commands:"
    echo "  list               - List all users and their roles"
    echo "  promote [email]     - Change user role to ADMIN"
    echo "  demote  [email]     - Change user role to VOTER"
    echo "  delete  [email]     - Remove a user from the database"
    echo ""
}

case "$1" in
    "list")
        sudo -u $DB_USER psql -d $DB_NAME -c "SELECT full_name, email, role, voter_id FROM users ORDER BY role DESC;"
        ;;
    "promote")
        if [ -z "$2" ]; then show_usage; exit 1; fi
        sudo -u $DB_USER psql -d $DB_NAME -c "UPDATE users SET role = 'ADMIN' WHERE email = '$2';"
        echo "Done. User $2 is now an ADMIN."
        ;;
    "demote")
        if [ -z "$2" ]; then show_usage; exit 1; fi
        sudo -u $DB_USER psql -d $DB_NAME -c "UPDATE users SET role = 'VOTER' WHERE email = '$2';"
        echo "Done. User $2 is now a VOTER."
        ;;
    "delete")
        if [ -z "$2" ]; then show_usage; exit 1; fi
        read -p "Are you sure you want to delete $2 and all their associated votes? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # 1. Delete associated votes first to satisfy Foreign Key constraint
            sudo -u $DB_USER psql -d $DB_NAME -c "DELETE FROM votes WHERE user_id = (SELECT id FROM users WHERE email = '$2');"
            # 2. Delete the user
            sudo -u $DB_USER psql -d $DB_NAME -c "DELETE FROM users WHERE email = '$2';"
            echo "User and associated vote history deleted."
        fi
        ;;
    *)
        show_usage
        ;;
esac
