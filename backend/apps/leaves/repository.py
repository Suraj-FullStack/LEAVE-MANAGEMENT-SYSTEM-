# Leave repository — all ORM queries for leaves.
# Separating queries here makes the service layer easy to read and test.

from .models import LeaveRequest, LeaveType, LeaveBalance


class LeaveTypeRepository:
    def get_all(self):
        return LeaveType.objects.all()

    def get_by_id(self, pk):
        try:
            return LeaveType.objects.get(pk=pk)
        except LeaveType.DoesNotExist:
            return None


class LeaveBalanceRepository:
    def get_balance(self, user, leave_type, year, for_update=False):
        try:
            balances = LeaveBalance.objects
            if for_update:
                balances = balances.select_for_update()
            return balances.get(user=user, leave_type=leave_type, year=year)
        except LeaveBalance.DoesNotExist:
            return None

    def get_balances_for_user(self, user, year):
        return LeaveBalance.objects.filter(user=user, year=year).select_related("leave_type")

    def create_balance(self, user, leave_type, year):
        return LeaveBalance.objects.create(
            user=user,
            leave_type=leave_type,
            year=year,
            total_days=leave_type.max_days_per_year,
        )

    def get_or_create_balance(self, user, leave_type, year):
        balance, _ = LeaveBalance.objects.get_or_create(
            user=user,
            leave_type=leave_type,
            year=year,
            defaults={"total_days": leave_type.max_days_per_year},
        )
        return LeaveBalance.objects.select_for_update().get(pk=balance.pk)


class LeaveRequestRepository:
    def get_by_id(self, pk, for_update=False):
        requests = LeaveRequest.objects
        if for_update:
            requests = requests.select_for_update()
        try:
            if for_update:
                return requests.get(pk=pk)
            return requests.select_related(
                "employee", "leave_type", "reviewed_by"
            ).get(pk=pk)
        except LeaveRequest.DoesNotExist:
            return None

    def get_all(self):
        return LeaveRequest.objects.select_related("employee", "leave_type", "reviewed_by")

    def get_for_employee(self, employee):
        return LeaveRequest.objects.filter(employee=employee).select_related(
            "leave_type", "reviewed_by"
        )

    def get_for_manager(self, manager):
        # A manager sees requests from their direct reports
        return LeaveRequest.objects.filter(
            employee__manager=manager
        ).select_related("employee", "leave_type", "reviewed_by")

    def get_overlapping(self, employee, start_date, end_date, exclude_id=None):
        # Finds any existing active request that overlaps with the given date range
        qs = LeaveRequest.objects.filter(
            employee=employee,
            status__in=("pending", "approved"),
            start_date__lte=end_date,
            end_date__gte=start_date,
        )
        if exclude_id:
            qs = qs.exclude(pk=exclude_id)
        return qs

    def create(self, **data):
        return LeaveRequest.objects.create(**data)

    def save(self, leave_request):
        leave_request.save()
        return leave_request
