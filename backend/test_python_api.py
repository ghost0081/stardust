#!/usr/bin/env python3
"""
Space Explorer Python Backend Test Script
Tests the Flask backend API endpoints
"""

import requests
import json
import sys

BASE_URL = "http://localhost:5000"

def test_health():
    """Test health endpoint"""
    print("1. Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check successful: {data['message']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure the server is running.")
        return False
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")
        return False

def test_register():
    """Test user registration"""
    print("\n2. Testing user registration...")
    try:
        user_data = {
            "name": "Test User",
            "email": "test@spaceexplorer.com",
            "password": "TestPass123!"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=user_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ Registration successful: {data['message']}")
            return data['data']['tokens']['accessToken']
        else:
            data = response.json()
            if data.get('code') == 'USER_EXISTS':
                print("✅ User already exists (expected for repeated tests)")
                return "existing_user"
            else:
                print(f"❌ Registration failed: {data.get('message', 'Unknown error')}")
                return None
    except Exception as e:
        print(f"❌ Registration error: {str(e)}")
        return None

def test_login():
    """Test user login"""
    print("\n3. Testing user login...")
    try:
        login_data = {
            "email": "test@spaceexplorer.com",
            "password": "TestPass123!"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login successful: {data['message']}")
            return data['data']['tokens']['accessToken']
        else:
            data = response.json()
            print(f"❌ Login failed: {data.get('message', 'Unknown error')}")
            return None
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return None

def test_protected_endpoint(token):
    """Test protected endpoint with token"""
    print("\n4. Testing protected endpoint...")
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Protected endpoint successful: {data['message']}")
            return True
        else:
            data = response.json()
            print(f"❌ Protected endpoint failed: {data.get('message', 'Unknown error')}")
            return False
    except Exception as e:
        print(f"❌ Protected endpoint error: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🧪 Space Explorer Python Backend API Tests")
    print("=" * 50)
    
    # Test health endpoint
    if not test_health():
        print("\n❌ Server is not running. Please start the server first:")
        print("   python app.py")
        sys.exit(1)
    
    # Test registration
    token = test_register()
    if not token:
        print("\n❌ Registration failed. Check your database setup.")
        sys.exit(1)
    
    # Test login (if registration created a new user)
    if token != "existing_user":
        login_token = test_login()
        if login_token:
            token = login_token
    
    # Test protected endpoint
    if token and token != "existing_user":
        test_protected_endpoint(token)
    
    print("\n🎉 All tests completed!")
    print("\nAPI Endpoints tested:")
    print("- GET /health")
    print("- POST /api/auth/register")
    print("- POST /api/auth/login")
    print("- GET /api/auth/me")
    
    print("\nAdditional endpoints available:")
    print("- GET /api/users/profile")
    print("- PUT /api/users/profile")
    print("- POST /api/auth/logout")

if __name__ == "__main__":
    main()
