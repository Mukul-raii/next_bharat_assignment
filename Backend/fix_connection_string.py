#!/usr/bin/env python3
"""
Helper script to properly encode MongoDB connection string for Azure Cosmos DB
"""
import urllib.parse
import re

def fix_connection_string(conn_str):
    """Fix MongoDB connection string by URL-encoding username and password"""
    
    # Pattern to match mongodb:// or mongodb+srv:// with username:password
    pattern = r'^(mongodb(?:\+srv)?://)(.*?):(.*?)@(.*)$'
    match = re.match(pattern, conn_str)
    
    if not match:
        print("❌ Could not parse connection string")
        return None
    
    protocol, username, password, rest = match.groups()
    
    # URL encode username and password
    encoded_username = urllib.parse.quote_plus(username)
    encoded_password = urllib.parse.quote_plus(password)
    
    # Rebuild connection string
    fixed_conn_str = f"{protocol}{encoded_username}:{encoded_password}@{rest}"
    
    return fixed_conn_str

if __name__ == "__main__":
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    original = os.getenv("COSMOS_CONNECTION_STRING")
    
    if not original:
        print("❌ COSMOS_CONNECTION_STRING not found in .env")
        exit(1)
    
    print("=== Connection String Fixer ===\n")
    print(f"Original (first 50 chars): {original[:50]}...")
    
    fixed = fix_connection_string(original)
    
    if fixed:
        print(f"\n✅ Fixed connection string (first 50 chars): {fixed[:50]}...\n")
        print("Add this to your .env file:")
        print(f"\nCOSMOS_CONNECTION_STRING={fixed}\n")
    else:
        print("\n❌ Failed to fix connection string")
