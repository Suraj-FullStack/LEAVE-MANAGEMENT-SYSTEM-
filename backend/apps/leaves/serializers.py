# Serializers for leave types, balances, and requests.

from rest_framework import serializers
from .models import LeaveType, LeaveBalance, LeaveRequest


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ["id", "name", "max_days_per_year", "description"]


class LeaveBalanceSerializer(serializers.ModelSerializer):
    leave_type_name = serializers.ReadOnlyField(source="leave_type.name")
    days_available = serializers.ReadOnlyField()

    class Meta:
        model = LeaveBalance
        fields = [
            "id", "leave_type", "leave_type_name",
            "year", "total_days", "days_taken", "days_pending", "days_available",
        ]


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source="employee.full_name")
    leave_type_name = serializers.ReadOnlyField(source="leave_type.name")
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = [
            "id", "employee", "employee_name",
            "leave_type", "leave_type_name",
            "start_date", "end_date", "num_days",
            "reason", "status", "applied_on",
            "reviewed_by", "reviewed_by_name",
            "reviewed_on", "manager_comment",
        ]
        read_only_fields = [
            "id", "employee", "num_days", "status",
            "applied_on", "reviewed_by", "reviewed_on",
        ]

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name()
        return None


class ApplyLeaveSerializer(serializers.Serializer):
    # Used only for creating new leave requests
    leave_type = serializers.PrimaryKeyRelatedField(queryset=LeaveType.objects.all())
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    reason = serializers.CharField(max_length=500)

    def validate(self, data):
        if data["start_date"] > data["end_date"]:
            raise serializers.ValidationError(
                {"end_date": "End date must be on or after start date."}
            )
        return data


class ReviewLeaveSerializer(serializers.Serializer):
    # Used for approve/reject actions
    comment = serializers.CharField(max_length=500, required=False, allow_blank=True)
