from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from .models import (
    Organization,
    Department,
    Team,
    Role,
    TeamMembership,
    UserActiveSession,
    SecurityAuditLog
)

User = get_user_model()


class IAMArchitectureTestCase(TestCase):
    """
    مجموعه تست‌های جامع واحد معماری مدیریت هویت و سطوح دسترسی (IAM)
    مطابق با بند ۹ بخش تست‌های PRD فاز هشتم
    """

    def setUp(self):
        # ایجاد کاربران تست
        self.owner_user = User.objects.create_user(
            phone_number="09121111111",
            full_name="مهندس علوی (مالک)",
            email="owner@chaproshan.ir",
            status="active"
        )
        self.owner_user.set_password("SecureOwnerPass123!")
        self.owner_user.save()

        self.employee_user = User.objects.create_user(
            phone_number="09122222222",
            full_name="سارا احمدی (طراح)",
            email="sara@chaproshan.ir",
            status="active"
        )
        self.employee_user.set_password("SecureSaraPass123!")
        self.employee_user.save()

        # ایجاد یک سازمان B2B نمونه
        self.organization = Organization.objects.create(
            name="برند زنجیره‌ای کافه رُست",
            registration_number="۱۲۴۹۰۱",
            tax_id="۱۰۱۰۰۳۹۴۸۲۱",
            address="تهران، خیابان شریعتی",
            owner=self.owner_user
        )

        # ایجاد دپارتمان و تیم مربوطه
        self.department = Department.objects.create(
            organization=self.organization,
            name="دپارتمان آتلیه طراحی و بررسی فایل"
        )
        self.team = Team.objects.create(
            department=self.department,
            name="تیم ناظرین فنی فایل چاپی"
        )

    def test_user_authentication_creation(self):
        """تست ۱: احراز هویت و ایجاد کاربران با پسورد هش‌شده"""
        self.assertTrue(self.owner_user.check_password("SecureOwnerPass123!"))
        self.assertFalse(self.owner_user.check_password("WrongPassword123!"))
        self.assertEqual(self.owner_user.phone_number, "09121111111")
        self.assertEqual(self.owner_user.status, "active")

    def test_organization_and_departments(self):
        """تست ۲: ساختار سازمان‌ها، دپارتمان‌ها و مالکین حقوقی B2B"""
        self.assertEqual(self.organization.owner, self.owner_user)
        self.assertEqual(self.department.organization, self.organization)
        self.assertEqual(self.team.department, self.department)

    def test_role_builder_and_permissions(self):
        """تست ۳: موتور نقش‌ساز پویا (Role Builder) و مجوزهای دسترسی"""
        # واکشی یک پرمیشن فرضی از مدل برای تست مپینگ
        content_type = ContentType.objects.get_for_model(Organization)
        permission = Permission.objects.create(
            codename="can_view_dashboard",
            name="Can View Dashboard",
            content_type=content_type
        )

        role = Role.objects.create(
            name="Senior Designer",
            description="ناظر ارشد آتلیه طراحی چاپخانه"
        )
        role.permissions.add(permission)

        # ایجاد عضویت تیمی کاربر
        membership = TeamMembership.objects.create(
            user=self.employee_user,
            team=self.team,
            role=role
        )

        self.assertEqual(membership.user, self.employee_user)
        self.assertEqual(membership.role, role)
        self.assertEqual(membership.team, self.team)
        self.assertIn(permission, membership.role.permissions.all())

    def test_session_management(self):
        """تست ۴: ثبت نشست‌های فعال مانیتورینگ امنیتی کاربران"""
        session = UserActiveSession.objects.create(
            user=self.employee_user,
            ip_address="185.90.12.4",
            browser_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0"
        )
        self.assertEqual(session.user, self.employee_user)
        self.assertEqual(session.ip_address, "185.90.12.4")

    def test_security_audit_log(self):
        """تست ۵: تریل مانیتورینگ اودیت سایبری و ورود شبیه‌سازی شده ادمین (Impersonation)"""
        audit_log = SecurityAuditLog.objects.create(
            user=self.owner_user,
            event_type="impersonation",
            ip_address="185.90.12.4",
            browser_agent="Chrome/129.0",
            details="ورود ادمین به جای کاربر رضا کریمی بدون داشتن پسورد با لاگ اودیت سایبری"
        )
        self.assertEqual(audit_log.user, self.owner_user)
        self.assertEqual(audit_log.event_type, "impersonation")
