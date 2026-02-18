"""
GOCAST.me API Tests
Tests for: Registration, Login, Castings, Profiles, Invitations
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data with unique identifiers
TEST_ID = str(uuid.uuid4())[:8]

class TestHealthAndRoot:
    """Basic API health checks"""
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"Root endpoint OK: {data}")


class TestTalentRegistration:
    """Talent user registration tests"""
    
    def test_register_talent_success(self):
        """Test successful talent registration with terms accepted"""
        email = f"TEST_talent_{TEST_ID}@gocast.me"
        payload = {
            "nombre": f"Test Talento {TEST_ID}",
            "email": email,
            "password": "testpass123",
            "tipo_usuario": "talento",
            "acepta_terminos": True
        }
        response = requests.post(f"{BASE_URL}/api/register", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["email"] == email
        assert data["tipo_usuario"] == "talento"
        assert "id" in data
        print(f"Talent registered: {data['email']}")
        return data
    
    def test_register_talent_without_terms_fails(self):
        """Test registration fails without accepting terms"""
        payload = {
            "nombre": "Test Sin Terminos",
            "email": f"TEST_noterms_{TEST_ID}@gocast.me",
            "password": "testpass123",
            "tipo_usuario": "talento",
            "acepta_terminos": False
        }
        response = requests.post(f"{BASE_URL}/api/register", json=payload)
        assert response.status_code == 400
        data = response.json()
        assert "terminos" in data.get("detail", "").lower() or "términos" in data.get("detail", "").lower()
        print(f"Terms validation works: {data['detail']}")
    
    def test_register_duplicate_email_fails(self):
        """Test duplicate email registration fails"""
        email = f"TEST_dup_{TEST_ID}@gocast.me"
        payload = {
            "nombre": "Test Duplicado",
            "email": email,
            "password": "testpass123",
            "tipo_usuario": "talento",
            "acepta_terminos": True
        }
        # First registration
        response1 = requests.post(f"{BASE_URL}/api/register", json=payload)
        assert response1.status_code == 200
        
        # Second registration with same email
        response2 = requests.post(f"{BASE_URL}/api/register", json=payload)
        assert response2.status_code == 400
        print(f"Duplicate email validation works")


class TestProducerRegistration:
    """Producer/Agency registration tests"""
    
    def test_register_producer_success(self):
        """Test successful producer registration"""
        email = f"TEST_producer_{TEST_ID}@gocast.me"
        payload = {
            "nombre": f"Productora Test {TEST_ID}",
            "email": email,
            "password": "testpass123",
            "tipo_usuario": "productora",
            "acepta_terminos": True
        }
        response = requests.post(f"{BASE_URL}/api/register", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["email"] == email
        assert data["tipo_usuario"] == "productora"
        print(f"Producer registered: {data['email']}")
        return data
    
    def test_register_invalid_user_type_fails(self):
        """Test invalid user type fails"""
        payload = {
            "nombre": "Test Invalid",
            "email": f"TEST_invalid_{TEST_ID}@gocast.me",
            "password": "testpass123",
            "tipo_usuario": "invalid_type",
            "acepta_terminos": True
        }
        response = requests.post(f"{BASE_URL}/api/register", json=payload)
        assert response.status_code == 400
        print("Invalid user type validation works")


class TestLogin:
    """Login tests for talent and producer"""
    
    @pytest.fixture(autouse=True)
    def setup_test_users(self):
        """Create test users for login tests"""
        self.talent_email = f"TEST_login_talent_{TEST_ID}@gocast.me"
        self.producer_email = f"TEST_login_producer_{TEST_ID}@gocast.me"
        self.password = "testpass123"
        
        # Register talent
        requests.post(f"{BASE_URL}/api/register", json={
            "nombre": "Login Test Talent",
            "email": self.talent_email,
            "password": self.password,
            "tipo_usuario": "talento",
            "acepta_terminos": True
        })
        
        # Register producer
        requests.post(f"{BASE_URL}/api/register", json={
            "nombre": "Login Test Producer",
            "email": self.producer_email,
            "password": self.password,
            "tipo_usuario": "productora",
            "acepta_terminos": True
        })
    
    def test_talent_login_success(self):
        """Test talent login returns token and user data"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": self.talent_email,
            "password": self.password
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["tipo_usuario"] == "talento"
        assert len(data["token"]) > 0
        print(f"Talent login successful, token received")
    
    def test_producer_login_success(self):
        """Test producer login returns token and user data"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": self.producer_email,
            "password": self.password
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["tipo_usuario"] == "productora"
        print(f"Producer login successful")
    
    def test_login_wrong_password_fails(self):
        """Test login with wrong password fails"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": self.talent_email,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("Wrong password validation works")
    
    def test_login_nonexistent_email_fails(self):
        """Test login with non-existent email fails"""
        response = requests.post(f"{BASE_URL}/api/login", json={
            "email": "nonexistent@gocast.me",
            "password": "anypassword"
        })
        assert response.status_code == 401
        print("Non-existent email validation works")


class TestCastingCreation:
    """Casting creation tests (producer only)"""
    
    @pytest.fixture(autouse=True)
    def setup_producer(self):
        """Create and login producer for casting tests"""
        self.producer_email = f"TEST_casting_producer_{TEST_ID}@gocast.me"
        self.talent_email = f"TEST_casting_talent_{TEST_ID}@gocast.me"
        self.password = "testpass123"
        
        # Register producer
        requests.post(f"{BASE_URL}/api/register", json={
            "nombre": "Casting Test Producer",
            "email": self.producer_email,
            "password": self.password,
            "tipo_usuario": "productora",
            "acepta_terminos": True
        })
        
        # Login producer
        login_resp = requests.post(f"{BASE_URL}/api/login", json={
            "email": self.producer_email,
            "password": self.password
        })
        self.producer_token = login_resp.json().get("token")
        
        # Register talent
        requests.post(f"{BASE_URL}/api/register", json={
            "nombre": "Casting Test Talent",
            "email": self.talent_email,
            "password": self.password,
            "tipo_usuario": "talento",
            "acepta_terminos": True
        })
        
        # Login talent
        talent_login = requests.post(f"{BASE_URL}/api/login", json={
            "email": self.talent_email,
            "password": self.password
        })
        self.talent_token = talent_login.json().get("token")
    
    def test_create_casting_with_multiple_roles(self):
        """Test creating casting with multiple roles"""
        casting_data = {
            "titulo": f"Comercial Test {TEST_ID}",
            "descripcion": "Comercial de prueba para testing",
            "roles": [
                {
                    "nombre_rol": "Papá",
                    "descripcion_rol": "Padre de familia, 35-45 años",
                    "tipo_talento": "actor",
                    "sexo": "masculino",
                    "edad_min": 35,
                    "edad_max": 45
                },
                {
                    "nombre_rol": "Mamá",
                    "descripcion_rol": "Madre de familia, 30-40 años",
                    "tipo_talento": "actor",
                    "sexo": "femenino",
                    "edad_min": 30,
                    "edad_max": 40
                }
            ],
            "ubicacion": "Buenos Aires, Argentina",
            "territorios": ["Latinoamérica", "España"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/castings",
            json=casting_data,
            headers={"Authorization": f"Bearer {self.producer_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["titulo"] == casting_data["titulo"]
        assert len(data["roles"]) == 2
        assert data["roles"][0]["nombre_rol"] == "Papá"
        assert data["roles"][1]["nombre_rol"] == "Mamá"
        assert "id" in data
        print(f"Casting created with {len(data['roles'])} roles")
        return data
    
    def test_talent_cannot_create_casting(self):
        """Test that talent users cannot create castings"""
        casting_data = {
            "titulo": "Casting Invalido",
            "descripcion": "No debería crearse",
            "roles": [{"nombre_rol": "Test", "descripcion_rol": "Test", "tipo_talento": "actor"}],
            "ubicacion": "Test",
            "territorios": ["Test"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/castings",
            json=casting_data,
            headers={"Authorization": f"Bearer {self.talent_token}"}
        )
        assert response.status_code == 403
        print("Talent cannot create casting - validation works")
    
    def test_get_castings_list(self):
        """Test getting list of active castings"""
        # First create a casting
        self.test_create_casting_with_multiple_roles()
        
        response = requests.get(
            f"{BASE_URL}/api/castings",
            headers={"Authorization": f"Bearer {self.producer_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Got {len(data)} castings")
    
    def test_get_casting_details(self):
        """Test getting specific casting details"""
        # Create casting first
        created = self.test_create_casting_with_multiple_roles()
        casting_id = created["id"]
        
        response = requests.get(
            f"{BASE_URL}/api/castings/{casting_id}",
            headers={"Authorization": f"Bearer {self.producer_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == casting_id
        assert len(data["roles"]) == 2
        print(f"Casting details retrieved: {data['titulo']}")


class TestTalentProfile:
    """Talent profile creation and editing tests"""
    
    @pytest.fixture(autouse=True)
    def setup_talent(self):
        """Create and login talent for profile tests"""
        self.talent_email = f"TEST_profile_talent_{TEST_ID}@gocast.me"
        self.password = "testpass123"
        
        # Register talent
        requests.post(f"{BASE_URL}/api/register", json={
            "nombre": "Profile Test Talent",
            "email": self.talent_email,
            "password": self.password,
            "tipo_usuario": "talento",
            "acepta_terminos": True
        })
        
        # Login talent
        login_resp = requests.post(f"{BASE_URL}/api/login", json={
            "email": self.talent_email,
            "password": self.password
        })
        self.talent_token = login_resp.json().get("token")
    
    def test_create_talent_profile(self):
        """Test creating talent profile with all physical attributes"""
        profile_data = {
            "tipo_talento": "actor",
            "nombre_completo": f"Talento Test {TEST_ID}",
            "edad": 30,
            "ciudad": "Buenos Aires",
            "pais": "Argentina",
            "altura_cm": 175,
            "color_pelo": "castaño",
            "color_ojos": "marrones",
            "sexo": "masculino",
            "talla_camisa": "M",
            "talla_pantalon": "32",
            "talla_zapatos": "42",
            "descripcion_corta": "Actor profesional con experiencia en comerciales",
            "talentos_especiales": "Canto, baile, artes marciales",
            "disponibilidad": ["lunes", "martes", "miércoles"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/perfil-talento",
            json=profile_data,
            headers={"Authorization": f"Bearer {self.talent_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["nombre_completo"] == profile_data["nombre_completo"]
        assert data["altura_cm"] == 175
        assert data["talla_camisa"] == "M"
        assert data["talla_pantalon"] == "32"
        assert data["talla_zapatos"] == "42"
        print(f"Profile created: {data['nombre_completo']}")
        return data
    
    def test_get_talent_profile(self):
        """Test getting talent profile after creation"""
        # Create profile first
        self.test_create_talent_profile()
        
        response = requests.get(
            f"{BASE_URL}/api/perfil-talento",
            headers={"Authorization": f"Bearer {self.talent_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "nombre_completo" in data
        assert "altura_cm" in data
        print(f"Profile retrieved: {data['nombre_completo']}")
    
    def test_update_talent_profile(self):
        """Test updating talent profile"""
        # Create profile first
        self.test_create_talent_profile()
        
        # Update profile
        updated_data = {
            "tipo_talento": "actor",
            "nombre_completo": f"Talento Actualizado {TEST_ID}",
            "edad": 31,
            "ciudad": "Córdoba",
            "pais": "Argentina",
            "altura_cm": 176,
            "color_pelo": "negro",
            "color_ojos": "verdes",
            "sexo": "masculino",
            "talla_camisa": "L",
            "talla_pantalon": "34",
            "talla_zapatos": "43",
            "descripcion_corta": "Actor actualizado",
            "disponibilidad": ["lunes", "viernes"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/perfil-talento",
            json=updated_data,
            headers={"Authorization": f"Bearer {self.talent_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["ciudad"] == "Córdoba"
        assert data["talla_camisa"] == "L"
        print("Profile updated successfully")


class TestInvitations:
    """Invitation system tests"""
    
    @pytest.fixture(autouse=True)
    def setup_users_and_casting(self):
        """Setup producer, talent, and casting for invitation tests"""
        self.producer_email = f"TEST_inv_producer_{TEST_ID}@gocast.me"
        self.talent_email = f"TEST_inv_talent_{TEST_ID}@gocast.me"
        self.password = "testpass123"
        
        # Register and login producer
        requests.post(f"{BASE_URL}/api/register", json={
            "nombre": "Invitation Test Producer",
            "email": self.producer_email,
            "password": self.password,
            "tipo_usuario": "productora",
            "acepta_terminos": True
        })
        login_resp = requests.post(f"{BASE_URL}/api/login", json={
            "email": self.producer_email,
            "password": self.password
        })
        self.producer_token = login_resp.json().get("token")
        
        # Register and login talent
        reg_resp = requests.post(f"{BASE_URL}/api/register", json={
            "nombre": "Invitation Test Talent",
            "email": self.talent_email,
            "password": self.password,
            "tipo_usuario": "talento",
            "acepta_terminos": True
        })
        self.talent_id = reg_resp.json().get("id")
        
        talent_login = requests.post(f"{BASE_URL}/api/login", json={
            "email": self.talent_email,
            "password": self.password
        })
        self.talent_token = talent_login.json().get("token")
        
        # Create casting
        casting_resp = requests.post(
            f"{BASE_URL}/api/castings",
            json={
                "titulo": f"Casting Invitaciones {TEST_ID}",
                "descripcion": "Casting para probar invitaciones",
                "roles": [{"nombre_rol": "Protagonista", "descripcion_rol": "Rol principal", "tipo_talento": "actor"}],
                "ubicacion": "Buenos Aires",
                "territorios": ["Argentina"]
            },
            headers={"Authorization": f"Bearer {self.producer_token}"}
        )
        self.casting_id = casting_resp.json().get("id")
    
    def test_producer_can_send_invitation(self):
        """Test producer can send invitation to talent"""
        invitation_data = {
            "casting_id": self.casting_id,
            "rol_nombre": "Protagonista",
            "talento_id": self.talent_id,
            "mensaje": "Te invitamos a participar en nuestro casting"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/invitaciones",
            json=invitation_data,
            headers={"Authorization": f"Bearer {self.producer_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["casting_id"] == self.casting_id
        assert data["talento_id"] == self.talent_id
        assert data["estado"] == "pendiente"
        print(f"Invitation sent successfully")
        return data
    
    def test_talent_can_see_invitations(self):
        """Test talent can see their invitations"""
        # Send invitation first
        self.test_producer_can_send_invitation()
        
        response = requests.get(
            f"{BASE_URL}/api/mis-invitaciones",
            headers={"Authorization": f"Bearer {self.talent_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        print(f"Talent has {len(data)} invitation(s)")


class TestTalentSearch:
    """Talent search tests (producer only)"""
    
    @pytest.fixture(autouse=True)
    def setup_producer_and_talents(self):
        """Setup producer and talents for search tests"""
        self.producer_email = f"TEST_search_producer_{TEST_ID}@gocast.me"
        self.password = "testpass123"
        
        # Register and login producer
        requests.post(f"{BASE_URL}/api/register", json={
            "nombre": "Search Test Producer",
            "email": self.producer_email,
            "password": self.password,
            "tipo_usuario": "productora",
            "acepta_terminos": True
        })
        login_resp = requests.post(f"{BASE_URL}/api/login", json={
            "email": self.producer_email,
            "password": self.password
        })
        self.producer_token = login_resp.json().get("token")
        
        # Create talent with profile
        talent_email = f"TEST_searchable_talent_{TEST_ID}@gocast.me"
        requests.post(f"{BASE_URL}/api/register", json={
            "nombre": "Searchable Talent",
            "email": talent_email,
            "password": self.password,
            "tipo_usuario": "talento",
            "acepta_terminos": True
        })
        talent_login = requests.post(f"{BASE_URL}/api/login", json={
            "email": talent_email,
            "password": self.password
        })
        talent_token = talent_login.json().get("token")
        
        # Create profile for searchable talent
        requests.post(
            f"{BASE_URL}/api/perfil-talento",
            json={
                "tipo_talento": "actor",
                "nombre_completo": f"Talento Buscable {TEST_ID}",
                "edad": 28,
                "ciudad": "Buenos Aires",
                "pais": "Argentina",
                "altura_cm": 180,
                "color_pelo": "negro",
                "color_ojos": "marrones",
                "sexo": "masculino",
                "talla_camisa": "M",
                "talla_pantalon": "32",
                "talla_zapatos": "42",
                "descripcion_corta": "Actor buscable para tests",
                "disponibilidad": ["lunes", "martes"]
            },
            headers={"Authorization": f"Bearer {talent_token}"}
        )
    
    def test_producer_can_search_talents(self):
        """Test producer can search talents with filters"""
        response = requests.get(
            f"{BASE_URL}/api/buscar-talentos?tipo_talento=actor",
            headers={"Authorization": f"Bearer {self.producer_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} talents matching filters")


class TestRecommendedCastings:
    """Recommended castings for talent tests"""
    
    @pytest.fixture(autouse=True)
    def setup_talent_with_profile(self):
        """Setup talent with profile for recommendations"""
        self.talent_email = f"TEST_rec_talent_{TEST_ID}@gocast.me"
        self.password = "testpass123"
        
        # Register and login talent
        requests.post(f"{BASE_URL}/api/register", json={
            "nombre": "Recommendations Test Talent",
            "email": self.talent_email,
            "password": self.password,
            "tipo_usuario": "talento",
            "acepta_terminos": True
        })
        login_resp = requests.post(f"{BASE_URL}/api/login", json={
            "email": self.talent_email,
            "password": self.password
        })
        self.talent_token = login_resp.json().get("token")
        
        # Create profile
        requests.post(
            f"{BASE_URL}/api/perfil-talento",
            json={
                "tipo_talento": "actor",
                "nombre_completo": f"Talento Recomendaciones {TEST_ID}",
                "edad": 35,
                "ciudad": "Buenos Aires",
                "pais": "Argentina",
                "altura_cm": 175,
                "color_pelo": "castaño",
                "color_ojos": "marrones",
                "sexo": "masculino",
                "talla_camisa": "M",
                "talla_pantalon": "32",
                "talla_zapatos": "42",
                "descripcion_corta": "Actor para recomendaciones",
                "disponibilidad": ["lunes"]
            },
            headers={"Authorization": f"Bearer {self.talent_token}"}
        )
    
    def test_talent_can_get_recommended_castings(self):
        """Test talent can get recommended castings based on profile"""
        response = requests.get(
            f"{BASE_URL}/api/castings-recomendados",
            headers={"Authorization": f"Bearer {self.talent_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Got {len(data)} recommended castings")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
