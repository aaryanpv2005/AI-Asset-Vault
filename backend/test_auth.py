from app.auth import hash_password, verify_password

password = "MyPassword123"

hashed = hash_password(password)

print("Original Password :", password)
print("Hashed Password :", hashed)

is_correct = verify_password(password,hashed)
print("Password Match  :", is_correct)
