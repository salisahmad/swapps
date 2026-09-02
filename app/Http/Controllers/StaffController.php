<?php

namespace App\Http\Controllers;

use App\Models\EmployeeEventBonusClaim;
use App\Models\EmployeeLeaveRequest;
use App\Models\EmployeeLoan;
use App\Models\EmployeeOwnerBonus;
use App\Models\Event;
use App\Models\User;
use App\Services\TelegramNotification;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    private const LEAVE_ALLOWANCE_PER_MONTH = 4;

    public function index(Request $request): Response
    {
        $user = $request->user();
        $canManageEmployees = $user->canManageEmployees();
        $canManageLeave = $user->canManageLeaveRequests();
        $month = $this->normalMonth($request->input('month'));
        $employeeRecords = $this->managedEmployeesQuery()->orderBy('role')->orderBy('name')->get();
        $employees = $canManageEmployees
            ? $employeeRecords
            : ($canManageLeave
                ? $employeeRecords->map(fn (User $employee) => $this->minimalEmployee($employee))->values()
                : collect([$user])->map(fn (User $employee) => $this->minimalEmployee($employee))->values());

        $query = $this->managedEmployeesQuery();
        if (!$canManageEmployees) {
            $query->where('id', $user->id);
        }

        if ($request->filled('q')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->q . '%')
                    ->orWhere('email', 'like', '%' . $request->q . '%')
                    ->orWhere('mobile_phone', 'like', '%' . $request->q . '%');
            });
        }

        if ($canManageEmployees && $request->filled('role')) {
            $query->where('role', $request->role);
        }

        $staff = $query->orderBy('role')->orderBy('name')->paginate(15)->withQueryString();
        if (!$canManageEmployees) {
            $staff->through(fn (User $employee) => $this->minimalEmployee($employee));
        }

        return Inertia::render('Staff/Index', [
            'staff' => $staff,
            'employees' => $employees,
            'events' => $this->eventsForMonth($month),
            'leaveRequests' => $this->leaveRequests($canManageLeave, $user->id),
            'leaveRows' => $canManageLeave ? $this->leaveRows($employeeRecords, $month) : [],
            'loans' => $canManageEmployees ? $this->loans() : [],
            'eventBonusClaims' => $this->eventBonusClaims($canManageEmployees, $user->id, $month),
            'ownerBonuses' => $canManageEmployees ? $this->ownerBonuses($month) : [],
            'payrollRows' => $canManageEmployees ? $this->payrollRows($employeeRecords, $month) : [],
            'profileSummary' => $this->profileSummary($user, $month, $canManageEmployees),
            'filters' => [
                ...$request->only(['q', 'role']),
                'month' => $month,
            ],
            'meta' => [
                'can_manage' => $canManageEmployees,
                'can_manage_leave' => $canManageLeave,
                'roles' => User::ROLES,
                'employment_statuses' => User::EMPLOYMENT_STATUSES,
                'leave_types' => EmployeeLeaveRequest::TYPES,
                'leave_statuses' => EmployeeLeaveRequest::STATUSES,
                'loan_borrower_types' => EmployeeLoan::BORROWER_TYPES,
                'loan_statuses' => EmployeeLoan::STATUSES,
                'bonus_statuses' => EmployeeEventBonusClaim::STATUSES,
                'current_user_id' => $user->id,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeEmployeeManagement();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'mobile_phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'role' => 'required|integer|in:1,2,3,4',
            'address' => 'nullable|string',
            'join_date' => 'nullable|date',
            'employment_status' => 'required|string|in:' . implode(',', array_keys(User::EMPLOYMENT_STATUSES)),
            'base_salary' => 'nullable|numeric|min:0',
            'default_event_bonus' => 'nullable|numeric|min:0',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['base_salary'] = $validated['base_salary'] ?? 0;
        $validated['default_event_bonus'] = $validated['default_event_bonus'] ?? 0;

        User::create($validated);

        return redirect()->back()->with('success', 'Pegawai berhasil ditambahkan.');
    }

    public function update(Request $request, User $staff)
    {
        $this->authorizeEmployeeManagement();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $staff->id,
            'mobile_phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6',
            'role' => 'required|integer|in:1,2,3,4',
            'address' => 'nullable|string',
            'join_date' => 'nullable|date',
            'employment_status' => 'required|string|in:' . implode(',', array_keys(User::EMPLOYMENT_STATUSES)),
            'base_salary' => 'nullable|numeric|min:0',
            'default_event_bonus' => 'nullable|numeric|min:0',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $validated['base_salary'] = $validated['base_salary'] ?? 0;
        $validated['default_event_bonus'] = $validated['default_event_bonus'] ?? 0;
        $staff->update($validated);

        return redirect()->back()->with('success', 'Pegawai berhasil diupdate.');
    }

    public function destroy(User $staff)
    {
        $this->authorizeEmployeeManagement();

        if ($staff->id === auth()->id()) {
            return redirect()->back()->with('error', 'Tidak bisa menghapus akun sendiri.');
        }

        $staff->delete();

        return redirect()->back()->with('success', 'Pegawai berhasil dihapus.');
    }

    public function storeLeave(Request $request)
    {
        $canManageEmployees = $request->user()->canManageEmployees();

        $validated = $request->validate([
            'user_id' => $canManageEmployees ? 'required|exists:users,id' : 'nullable',
            'leave_type' => 'required|integer|in:1,2',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string',
        ]);

        $start = Carbon::parse($validated['start_date'])->startOfDay();
        $end = Carbon::parse($validated['end_date'])->startOfDay();

        $leave = EmployeeLeaveRequest::create([
            ...$validated,
            'user_id' => $canManageEmployees ? $validated['user_id'] : $request->user()->id,
            'days' => $start->diffInDays($end) + 1,
            'status' => EmployeeLeaveRequest::STATUS_PENDING,
            'created_by' => $request->user()->id,
        ]);
        (new TelegramNotification())->notifyLeaveRequest($leave);

        return redirect()->back()->with('success', 'Pengajuan cuti berhasil dikirim.');
    }

    public function updateLeaveStatus(Request $request, EmployeeLeaveRequest $leave)
    {
        $this->authorizeEmployeeManagement();

        $validated = $request->validate([
            'status' => 'required|integer|in:1,2,3',
            'review_notes' => 'nullable|string',
        ]);

        $leave->update([
            ...$validated,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Status cuti berhasil diupdate.');
    }

    public function storeLoan(Request $request)
    {
        $this->authorizeEmployeeManagement();

        $validated = $request->validate([
            'borrower_type' => 'required|integer|in:1,2',
            'user_id' => 'nullable|required_if:borrower_type,1|exists:users,id',
            'vendor_name' => 'nullable|required_if:borrower_type,2|string|max:255',
            'vendor_phone' => 'nullable|string|max:30',
            'loan_date' => 'required|date',
            'amount' => 'required|numeric|min:1',
            'notes' => 'nullable|string',
        ]);

        EmployeeLoan::create([
            ...$validated,
            'status' => EmployeeLoan::STATUS_ACTIVE,
            'created_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Pinjaman berhasil dicatat.');
    }

    public function storeLoanPayment(Request $request, EmployeeLoan $loan)
    {
        $this->authorizeEmployeeManagement();

        $validated = $request->validate([
            'payment_date' => 'required|date',
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
        ]);

        $loan->payments()->create([
            ...$validated,
            'created_by' => auth()->id(),
        ]);

        $loan->refresh();
        if ($loan->remaining_amount <= 0 && $loan->status !== EmployeeLoan::STATUS_CANCELLED) {
            $loan->update(['status' => EmployeeLoan::STATUS_PAID]);
        }

        return redirect()->back()->with('success', 'Pembayaran pinjaman berhasil dicatat.');
    }

    public function storeBorrowerLoanPayment(Request $request)
    {
        $this->authorizeEmployeeManagement();

        $validated = $request->validate([
            'borrower_type' => 'required|integer|in:1,2',
            'user_id' => 'nullable|required_if:borrower_type,1|exists:users,id',
            'vendor_name' => 'nullable|required_if:borrower_type,2|string|max:255',
            'payment_date' => 'required|date',
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
        ]);

        $remainingPayment = (float) $validated['amount'];

        $loans = EmployeeLoan::query()
            ->where('borrower_type', $validated['borrower_type'])
            ->where('status', EmployeeLoan::STATUS_ACTIVE)
            ->when(
                (int) $validated['borrower_type'] === EmployeeLoan::BORROWER_EMPLOYEE,
                fn ($q) => $q->where('user_id', $validated['user_id']),
                fn ($q) => $q->where('vendor_name', $validated['vendor_name']),
            )
            ->orderBy('loan_date')
            ->with('payments')
            ->get();

        $totalRemaining = (float) $loans->sum('remaining_amount');

        if ($totalRemaining <= 0) {
            throw ValidationException::withMessages([
                'amount' => 'Peminjam ini tidak memiliki sisa pinjaman aktif.',
            ]);
        }

        if ($remainingPayment > $totalRemaining) {
            throw ValidationException::withMessages([
                'amount' => 'Nominal cicilan tidak boleh melebihi sisa pinjaman ' . number_format($totalRemaining, 0, ',', '.') . '.',
            ]);
        }

        foreach ($loans as $loan) {
            if ($remainingPayment <= 0) {
                break;
            }

            $paymentAmount = min($remainingPayment, $loan->remaining_amount);
            if ($paymentAmount <= 0) {
                continue;
            }

            $loan->payments()->create([
                'payment_date' => $validated['payment_date'],
                'amount' => $paymentAmount,
                'payment_method' => $validated['payment_method'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'created_by' => auth()->id(),
            ]);

            $remainingPayment -= $paymentAmount;
            $loan->refresh();

            if ($loan->remaining_amount <= 0) {
                $loan->update(['status' => EmployeeLoan::STATUS_PAID]);
            }
        }

        return redirect()->back()->with('success', 'Pembayaran cicilan berhasil dicatat ke pinjaman aktif peminjam.');
    }

    public function storeEventBonusClaim(Request $request)
    {
        $canManageEmployees = $request->user()->canManageEmployees();

        $validated = $request->validate([
            'user_id' => $canManageEmployees ? 'required|exists:users,id' : 'nullable',
            'event_ids' => 'nullable|array',
            'event_ids.*' => 'exists:events,id',
            'work_month' => 'required|date_format:Y-m',
            'descriptions' => 'nullable|array',
            'descriptions.*' => 'nullable|string',
            'amounts' => 'nullable|array',
            'amounts.*' => 'nullable|numeric|min:0',
        ]);

        $userId = $canManageEmployees ? $validated['user_id'] : $request->user()->id;
        $eventIds = collect($validated['event_ids'] ?? [])->map(fn ($eventId) => (int) $eventId)->values();
        $workMonth = $validated['work_month'] . '-01';

        EmployeeEventBonusClaim::where('user_id', $userId)
            ->whereDate('work_month', $workMonth)
            ->when($eventIds->isNotEmpty(), fn ($query) => $query->whereNotIn('event_id', $eventIds), fn ($query) => $query)
            ->delete();

        foreach ($eventIds as $eventId) {
            EmployeeEventBonusClaim::updateOrCreate([
                'user_id' => $userId,
                'event_id' => $eventId,
            ], [
                'event_id' => $eventId,
                'work_month' => $workMonth,
                'description' => $validated['descriptions'][$eventId] ?? '-',
                'amount' => $validated['amounts'][$eventId] ?? 0,
                'status' => EmployeeEventBonusClaim::STATUS_APPROVED,
            ]);
        }

        return redirect()->back()->with('success', 'Klaim bonus event berhasil disimpan.');
    }

    public function updateEventBonusClaim(Request $request, EmployeeEventBonusClaim $claim)
    {
        if (!auth()->user()->canManageEmployees() && $claim->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'review_notes' => 'nullable|string',
        ]);

        $claim->update([
            'amount' => $validated['amount'],
            'description' => $validated['description'] ?? $claim->description,
            'review_notes' => $validated['review_notes'] ?? $claim->review_notes,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Nominal klaim bonus event berhasil diupdate.');
    }

    public function destroyEventBonusClaim(EmployeeEventBonusClaim $claim)
    {
        $this->authorizeEmployeeManagement();

        $claim->delete();

        return redirect()->back()->with('success', 'Klaim bonus event berhasil dihapus.');
    }

    public function storeOwnerBonus(Request $request)
    {
        $this->authorizeEmployeeManagement();

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'bonus_month' => 'required|date_format:Y-m',
            'amount' => 'required|numeric|min:1',
            'notes' => 'nullable|string',
        ]);

        EmployeeOwnerBonus::create([
            ...$validated,
            'bonus_month' => $validated['bonus_month'] . '-01',
            'created_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Bonus owner berhasil dicatat.');
    }

    public function updateOwnerBonus(Request $request, EmployeeOwnerBonus $bonus)
    {
        $this->authorizeEmployeeManagement();

        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'notes' => 'nullable|string',
        ]);

        $bonus->update($validated);

        return redirect()->back()->with('success', 'Bonus owner berhasil diupdate.');
    }

    public function destroyOwnerBonus(EmployeeOwnerBonus $bonus)
    {
        $this->authorizeEmployeeManagement();

        $bonus->delete();

        return redirect()->back()->with('success', 'Bonus owner berhasil dihapus.');
    }

    private function authorizeEmployeeManagement(): void
    {
        if (!auth()->user()->canManageEmployees()) {
            abort(403);
        }
    }

    private function employeesQuery()
    {
        return User::whereIn('role', array_keys(User::ROLES));
    }

    private function managedEmployeesQuery()
    {
        return User::whereIn('role', [User::ROLE_MANAGER, User::ROLE_STAFF_GALERI, User::ROLE_STAFF_LOKASI]);
    }

    private function leaveRequests(bool $canManage, int $userId)
    {
        return EmployeeLeaveRequest::with(['user:id,name,role', 'reviewer:id,name'])
            ->when(!$canManage, fn ($q) => $q->where('user_id', $userId))
            ->latest()
            ->take(30)
            ->get();
    }

    private function loans()
    {
        return EmployeeLoan::with(['user:id,name,role', 'payments' => fn ($q) => $q->orderByDesc('payment_date')])
            ->latest('loan_date')
            ->take(100)
            ->get();
    }

    private function eventsForMonth(string $month)
    {
        $start = Carbon::parse($month . '-01')->startOfMonth();
        $end = $start->copy()->endOfMonth();

        return Event::whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->orderBy('date')
            ->orderBy('name')
            ->get(['id', 'uuid', 'name', 'date']);
    }

    private function eventBonusClaims(bool $canManage, int $userId, string $month)
    {
        return EmployeeEventBonusClaim::with(['user:id,name,role', 'event:id,uuid,name,date', 'reviewer:id,name'])
            ->when(!$canManage, fn ($q) => $q->where('user_id', $userId))
            ->whereDate('work_month', $month . '-01')
            ->latest()
            ->get();
    }

    private function ownerBonuses(string $month)
    {
        return EmployeeOwnerBonus::with('user:id,name,role')
            ->whereDate('bonus_month', $month . '-01')
            ->latest()
            ->take(30)
            ->get();
    }

    private function payrollRows($employees, string $month): array
    {
        return $employees->map(function (User $employee) use ($month) {
            $summary = $this->payrollSummary($employee, $month);

            return [
                'id' => $employee->id,
                'name' => $employee->name,
                'role_detail' => $employee->role_detail,
                ...$summary,
            ];
        })->values()->all();
    }

    private function profileSummary(User $user, string $month, bool $includePayroll = false): array
    {
        $summary = [
            'leave_balance' => $this->leaveBalance($user, Carbon::parse($month . '-01')->endOfMonth()),
            'active_loans' => EmployeeLoan::with('payments')
                ->where('user_id', $user->id)
                ->where('status', EmployeeLoan::STATUS_ACTIVE)
                ->get(),
        ];

        if ($includePayroll) {
            $summary['payroll'] = $this->payrollSummary($user, $month);
        }

        return $summary;
    }

    private function leaveRows($employees, string $month): array
    {
        $start = Carbon::parse($month . '-01')->startOfMonth();
        $end = $start->copy()->endOfMonth();

        return $employees->map(function (User $employee) use ($start, $end) {
            $balance = $this->leaveBalance($employee, $end);
            $unpaidDays = EmployeeLeaveRequest::where('user_id', $employee->id)
                ->where('leave_type', EmployeeLeaveRequest::TYPE_UNPAID)
                ->where('status', EmployeeLeaveRequest::STATUS_APPROVED)
                ->whereBetween('start_date', [$start->toDateString(), $end->toDateString()])
                ->sum('days');

            return [
                'employee' => $this->minimalEmployee($employee),
                'remaining_days' => $balance['remaining_days'],
                'used_days' => $balance['used_days'],
                'total_allowance' => $balance['total_allowance'],
                'unpaid_days_month' => (int) $unpaidDays,
            ];
        })->values()->all();
    }

    private function minimalEmployee(User $employee): array
    {
        return [
            'id' => $employee->id,
            'name' => $employee->name,
            'role' => $employee->role,
            'role_detail' => $employee->role_detail,
            'default_event_bonus' => (float) $employee->default_event_bonus,
        ];
    }

    private function payrollSummary(User $employee, string $month): array
    {
        $start = Carbon::parse($month . '-01')->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $unpaidDays = EmployeeLeaveRequest::where('user_id', $employee->id)
            ->where('leave_type', EmployeeLeaveRequest::TYPE_UNPAID)
            ->where('status', EmployeeLeaveRequest::STATUS_APPROVED)
            ->whereBetween('start_date', [$start->toDateString(), $end->toDateString()])
            ->sum('days');

        $unpaidDeduction = ((float) $employee->base_salary / 30) * (int) $unpaidDays;

        $eventBonus = EmployeeEventBonusClaim::where('user_id', $employee->id)
            ->whereDate('work_month', $start->toDateString())
            ->sum('amount');

        $ownerBonus = EmployeeOwnerBonus::where('user_id', $employee->id)
            ->whereDate('bonus_month', $start->toDateString())
            ->sum('amount');

        return [
            'base_salary' => (float) $employee->base_salary,
            'unpaid_days' => (int) $unpaidDays,
            'unpaid_deduction' => (float) $unpaidDeduction,
            'event_bonus' => (float) $eventBonus,
            'owner_bonus' => (float) $ownerBonus,
            'net_salary' => max(0, (float) $employee->base_salary - (float) $unpaidDeduction + (float) $eventBonus + (float) $ownerBonus),
        ];
    }

    private function leaveBalance(User $employee, Carbon $until): array
    {
        $joinDate = $employee->join_date ? Carbon::parse($employee->join_date) : Carbon::parse($employee->created_at);
        $months = max(1, $joinDate->startOfMonth()->diffInMonths($until->copy()->startOfMonth()) + 1);
        $allowance = $months * self::LEAVE_ALLOWANCE_PER_MONTH;
        $used = EmployeeLeaveRequest::where('user_id', $employee->id)
            ->where('leave_type', EmployeeLeaveRequest::TYPE_PAID)
            ->where('status', EmployeeLeaveRequest::STATUS_APPROVED)
            ->whereDate('start_date', '<=', $until->toDateString())
            ->sum('days');

        return [
            'allowance_per_month' => self::LEAVE_ALLOWANCE_PER_MONTH,
            'total_allowance' => (int) $allowance,
            'used_days' => (int) $used,
            'remaining_days' => (int) $allowance - (int) $used,
        ];
    }

    private function normalMonth(?string $month): string
    {
        if ($month && preg_match('/^\d{4}-\d{2}$/', $month)) {
            return $month;
        }

        return now()->format('Y-m');
    }
}
