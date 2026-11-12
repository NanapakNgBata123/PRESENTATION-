import os

os.system('cls' if os.name == 'nt' else 'clear')

DAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday")
payroll_list = []

def get_float_input(prompt):
    while True:
        try:
            return float(input(prompt))
        except ValueError:
            print("Invalid number. Please enter a valid amount.")

def get_int_input(prompt):
    while True:
        try:
            return int(input(prompt))
        except ValueError:
            print("Invalid number. Please enter a whole number.")

num_employees = get_int_input("Enter number of employees to process: ")
daily_rate = get_float_input("Enter daily rate: ₱")
late_deduction = get_float_input("Enter deduction for being late: ₱")
perfect_bonus = get_float_input("Enter perfect attendance bonus: ₱")

print("\n˚.⋆꒰১ ໒꒱⋆.˚ Record Attendance ˚.⋆꒰ ໒꒱⋆.")
for i in range(num_employees):
    emp_name = input(f"\nEnter name for employee {i + 1}: ").strip()
    attendance_records = {}

    for day in DAYS:
        while True:
            status = input(f"Was {emp_name} present on {day}? (P/A/L): ").strip().upper()
            if status in ('P', 'A', 'L'):
                attendance_records[day] = status
                break
            print("Invalid input. Please enter 'P', 'A', or 'L'.")

    days_worked = 0
    late_days = 0

    for status in attendance_records.values():
        if status == 'P':
            days_worked += 1
        elif status == 'L':
            days_worked += 1
            late_days += 1

    base_salary = days_worked * daily_rate
    total_deductions = late_days * late_deduction
    total_salary = base_salary - total_deductions
    bonus_applied = 0.0

    if days_worked == 5 and late_days == 0:
        total_salary += perfect_bonus
        bonus_applied = perfect_bonus

    emp_data = {
        "name": emp_name,
        "attendance": attendance_records,
        "days_worked": days_worked,
        "late_days": late_days,
        "salary": total_salary,
        "bonus": bonus_applied
    }
    payroll_list.append(emp_data)

print("\n˚.⋆১ ໒꒱⋆.˚ Final Payroll Report ˚.꒰১ ໒⋆.˚")
print("=" * 50)

grand_total = 0

for emp in payroll_list:
    print(f"\nEmployee: {emp['name']}")
    print(f"Record: {emp['attendance']}")
    print(f"Days Worked: {emp['days_worked']} | Late Days: {emp['late_days']}")

    if emp['bonus'] > 0:
        print(f"Bonus Applied: ₱{emp['bonus']:.2f}")

    print(f"Final Salary: ₱{emp['salary']:.2f}")
    grand_total += emp['salary']
    print("-" * 30)

print(f"\n˚.꒰১ ໒꒱⋆.˚ Grand Total Payroll: ₱{grand_total:.2f} ˚.꒰১ ໒꒱⋆.˚")
print("=" * 50)
