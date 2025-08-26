import requests
import sys
from datetime import datetime, timezone
import json

class OnamAppAPITester:
    def __init__(self, base_url="https://pookalam-fest.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.team_ids = []
        self.member_ids = []
        self.event_ids = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.text}")
                except:
                    pass
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login_valid(self):
        """Test login with valid credentials"""
        success, response = self.run_test(
            "Login with valid credentials",
            "POST",
            "auth/login",
            200,
            data={"username": "admin", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_login_invalid(self):
        """Test login with invalid credentials"""
        success, _ = self.run_test(
            "Login with invalid credentials",
            "POST",
            "auth/login",
            401,
            data={"username": "admin", "password": "wrongpassword"}
        )
        return success

    def test_get_teams(self):
        """Test getting teams"""
        success, response = self.run_test(
            "Get teams",
            "GET",
            "teams",
            200
        )
        if success and isinstance(response, list):
            self.team_ids = [team['id'] for team in response if 'id' in team]
            print(f"   Found {len(response)} teams: {[team.get('name', 'Unknown') for team in response]}")
            return True
        return False

    def test_get_members(self):
        """Test getting all members"""
        success, response = self.run_test(
            "Get all members",
            "GET",
            "members",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} members")
            return True
        return False

    def test_create_member(self):
        """Test creating a new member"""
        if not self.team_ids:
            print("❌ No teams available for member creation")
            return False
            
        member_data = {
            "name": "Test Member",
            "category": "Adult",
            "team_id": self.team_ids[0]
        }
        success, response = self.run_test(
            "Create member",
            "POST",
            "members",
            200,
            data=member_data
        )
        if success and 'id' in response:
            self.member_ids.append(response['id'])
            print(f"   Created member with ID: {response['id']}")
            return True
        return False

    def test_get_members_by_team(self):
        """Test getting members by team"""
        if not self.team_ids:
            print("❌ No teams available")
            return False
            
        success, response = self.run_test(
            "Get members by team",
            "GET",
            f"members/team/{self.team_ids[0]}",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} members for team")
            return True
        return False

    def test_get_events(self):
        """Test getting events"""
        success, response = self.run_test(
            "Get events",
            "GET",
            "events",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} events")
            return True
        return False

    def test_create_event(self):
        """Test creating a new event"""
        event_data = {
            "name": "Test Event",
            "description": "A test event for Onam celebration",
            "event_date": datetime.now(timezone.utc).isoformat()
        }
        success, response = self.run_test(
            "Create event",
            "POST",
            "events",
            200,
            data=event_data
        )
        if success and 'id' in response:
            self.event_ids.append(response['id'])
            print(f"   Created event with ID: {response['id']}")
            return True
        return False

    def test_get_results(self):
        """Test getting results"""
        success, response = self.run_test(
            "Get results",
            "GET",
            "results",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} results")
            return True
        return False

    def test_create_result(self):
        """Test creating a result"""
        if len(self.team_ids) < 2 or not self.event_ids:
            print("❌ Need at least 2 teams and 1 event for result creation")
            return False
            
        result_data = {
            "event_id": self.event_ids[0],
            "winner_team_id": self.team_ids[0],
            "runner_up_team_id": self.team_ids[1],
            "winner_points": 10,
            "runner_up_points": 5,
            "remarks": "Test result"
        }
        success, response = self.run_test(
            "Create result",
            "POST",
            "results",
            200,
            data=result_data
        )
        if success:
            print(f"   Created result successfully")
            return True
        return False

    def test_get_points_config(self):
        """Test getting points configuration"""
        success, response = self.run_test(
            "Get points config",
            "GET",
            "points-config",
            200
        )
        if success and 'winner_points' in response:
            print(f"   Points config: Winner={response['winner_points']}, Runner-up={response['runner_up_points']}")
            return True
        return False

    def test_update_points_config(self):
        """Test updating points configuration"""
        config_data = {
            "winner_points": 15,
            "runner_up_points": 8
        }
        success, response = self.run_test(
            "Update points config",
            "PUT",
            "points-config",
            200,
            data=config_data
        )
        if success:
            print(f"   Updated points config successfully")
            return True
        return False

    def test_get_scoreboard(self):
        """Test getting scoreboard"""
        success, response = self.run_test(
            "Get scoreboard",
            "GET",
            "scoreboard",
            200
        )
        if success and isinstance(response, list):
            print(f"   Scoreboard has {len(response)} teams")
            for team in response:
                print(f"     {team.get('name', 'Unknown')}: {team.get('total_points', 0)} points")
            return True
        return False

    def test_delete_member(self):
        """Test deleting a member"""
        if not self.member_ids:
            print("❌ No members to delete")
            return False
            
        success, _ = self.run_test(
            "Delete member",
            "DELETE",
            f"members/{self.member_ids[0]}",
            200
        )
        if success:
            print(f"   Deleted member successfully")
            return True
        return False

    def test_delete_event(self):
        """Test deleting an event"""
        if not self.event_ids:
            print("❌ No events to delete")
            return False
            
        success, _ = self.run_test(
            "Delete event",
            "DELETE",
            f"events/{self.event_ids[0]}",
            200
        )
        if success:
            print(f"   Deleted event successfully")
            return True
        return False

def main():
    print("🎉 Starting Onam Celebration 2025 API Tests")
    print("=" * 50)
    
    tester = OnamAppAPITester()
    
    # Test sequence
    test_results = []
    
    # Authentication tests
    test_results.append(("Login Invalid", tester.test_login_invalid()))
    test_results.append(("Login Valid", tester.test_login_valid()))
    
    if not tester.token:
        print("\n❌ Cannot proceed without valid authentication")
        return 1
    
    # Team tests
    test_results.append(("Get Teams", tester.test_get_teams()))
    
    # Member tests
    test_results.append(("Get All Members", tester.test_get_members()))
    test_results.append(("Create Member", tester.test_create_member()))
    test_results.append(("Get Members by Team", tester.test_get_members_by_team()))
    
    # Event tests
    test_results.append(("Get Events", tester.test_get_events()))
    test_results.append(("Create Event", tester.test_create_event()))
    
    # Results tests
    test_results.append(("Get Results", tester.test_get_results()))
    test_results.append(("Create Result", tester.test_create_result()))
    
    # Points config tests
    test_results.append(("Get Points Config", tester.test_get_points_config()))
    test_results.append(("Update Points Config", tester.test_update_points_config()))
    
    # Scoreboard test
    test_results.append(("Get Scoreboard", tester.test_get_scoreboard()))
    
    # Cleanup tests
    test_results.append(("Delete Member", tester.test_delete_member()))
    test_results.append(("Delete Event", tester.test_delete_event()))
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    failed = 0
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\nTotal Tests: {len(test_results)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {(passed/len(test_results)*100):.1f}%")
    
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())