# Run with: python manage.py shell < seed_data.py
# Creates leave types, an admin, a manager, and two employees with balances.

from django.contrib.auth import get_user_model
from apps.leaves.models import LeaveType, LeaveBalance
from datetime import date

User = get_user_model()

print("Creating leave types...")
annual, _ = LeaveType.objects.get_or_create(
    name="Annual Leave", defaults={"max_days_per_year": 20, "description": "Paid annual leave"}
)
sick, _ = LeaveType.objects.get_or_create(
    name="Sick Leave", defaults={"max_days_per_year": 10, "description": "Medical leave"}
)
casual, _ = LeaveType.objects.get_or_create(
    name="Casual Leave", defaults={"max_days_per_year": 7, "description": "Short unplanned leave"}
)

print("Creating users...")
admin_user = User.objects.filter(email="admin@company.com").first()
if not admin_user:
    admin_user = User.objects.create_superuser(
        email="admin@company.com",
        username="admin",
        first_name="System",
        last_name="Admin",
        password="admin123",
        role="admin",
        department="IT",
    )

manager_user = User.objects.filter(email="manager@company.com").first()
if not manager_user:
    manager_user = User.objects.create_user(
        email="manager@company.com",
        username="manager1",
        first_name="Alice",
        last_name="Smith",
        password="manager123",
        role="manager",
        department="Engineering",
    )

emp1 = User.objects.filter(email="emp1@company.com").first()
if not emp1:
    emp1 = User.objects.create_user(
        email="emp1@company.com",
        username="emp1",
        first_name="Bob",
        last_name="Jones",
        password="emp123",
        role="employee",
        department="Engineering",
        manager=manager_user,
    )

emp2 = User.objects.filter(email="emp2@company.com").first()
if not emp2:
    emp2 = User.objects.create_user(
        email="emp2@company.com",
        username="emp2",
        first_name="Carol",
        last_name="White",
        password="emp123",
        role="employee",
        department="Engineering",
        manager=manager_user,
    )

print("Creating leave balances for employees...")
year = date.today().year
for user in [emp1, emp2]:
    for lt in [annual, sick, casual]:
        LeaveBalance.objects.get_or_create(
            user=user, leave_type=lt, year=year,
            defaults={"total_days": lt.max_days_per_year},
        )

print("Done. Seed accounts:")
print("  Admin:    admin@company.com     / admin123")
print("  Manager:  manager@company.com  / manager123")
print("  Employee: emp1@company.com      / emp123")
print("  Employee: emp2@company.com      / emp123")
