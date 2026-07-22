import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Employee {
    id: number;
    name: string;
    email?: string;
    mobile_phone?: string | null;
    address?: string | null;
    role: number;
    role_detail: string;
    employment_status?: string;
    employment_status_name?: string;
    join_date?: string | null;
    base_salary?: number;
    default_event_bonus?: number;
}

interface EventItem {
    id: number;
    uuid: string;
    name: string;
    date: string | null;
}

interface LeaveRequest {
    id: number;
    user: Employee;
    leave_type: number;
    leave_type_name: string;
    start_date: string;
    end_date: string;
    days: number;
    status: number;
    status_name: string;
    reason: string | null;
    review_notes: string | null;
}

interface LeaveRow {
    employee: Employee;
    remaining_days: number;
    used_days: number;
    total_allowance: number;
    unpaid_days_month: number;
}

interface LoanPayment {
    id: number;
    payment_date: string;
    amount: number;
    payment_method: string | null;
    notes: string | null;
}

interface Loan {
    id: number;
    borrower_type: number;
    borrower_type_name: string;
    borrower_name: string;
    user: Employee | null;
    vendor_name: string | null;
    vendor_phone: string | null;
    loan_date: string;
    amount: number;
    paid_amount: number;
    remaining_amount: number;
    status: number;
    status_name: string;
    notes: string | null;
    payments: LoanPayment[];
}

interface BonusClaim {
    id: number;
    user: Employee;
    event: EventItem;
    work_month: string;
    description: string;
    amount: number;
    status: number;
    status_name: string;
    review_notes: string | null;
}

interface OwnerBonus {
    id: number;
    user: Employee;
    bonus_month: string;
    amount: number;
    notes: string | null;
}

interface PayrollRow {
    id: number;
    name: string;
    role_detail: string;
    base_salary: number;
    unpaid_days: number;
    unpaid_deduction: number;
    event_bonus: number;
    owner_bonus: number;
    net_salary: number;
}

interface ProfileSummary {
    leave_balance: {
        allowance_per_month: number;
        total_allowance: number;
        used_days: number;
        remaining_days: number;
    };
    payroll?: PayrollRow;
    active_loans: Loan[];
}

interface PageProps {
    staff: {
        data: Employee[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    employees: Employee[];
    events: EventItem[];
    leaveRequests: LeaveRequest[];
    leaveRows: LeaveRow[];
    loans: Loan[];
    eventBonusClaims: BonusClaim[];
    ownerBonuses: OwnerBonus[];
    payrollRows: PayrollRow[];
    profileSummary: ProfileSummary;
    filters: {
        q?: string;
        role?: string;
        month: string;
    };
    meta: {
        can_manage: boolean;
        can_manage_leave: boolean;
        roles: Record<string, string>;
        employment_statuses: Record<string, string>;
        leave_types: Record<string, string>;
        leave_statuses: Record<string, string>;
        loan_borrower_types: Record<string, string>;
        loan_statuses: Record<string, string>;
        bonus_statuses: Record<string, string>;
        current_user_id: number;
    };
}

export default function Index({
    staff,
    employees,
    events,
    leaveRequests,
    leaveRows,
    loans,
    eventBonusClaims,
    ownerBonuses,
    payrollRows,
    profileSummary,
    filters,
    meta,
}: PageProps) {
    const [activeTab, setActiveTab] = useState(meta.can_manage ? 'employees' : (meta.can_manage_leave ? 'leave' : 'profile'));
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showLoanModal, setShowLoanModal] = useState(false);
    const [showLoanPaymentModal, setShowLoanPaymentModal] = useState(false);
    const [showLoanDetailModal, setShowLoanDetailModal] = useState(false);
    const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
    const [selectedLoanGroupKey, setSelectedLoanGroupKey] = useState<string | null>(null);
    const [loanView, setLoanView] = useState<'active' | 'all'>('active');
    const [selectedPayrollRowId, setSelectedPayrollRowId] = useState<number | null>(null);

    const employeeForm = useForm({
        name: '',
        email: '',
        mobile_phone: '',
        password: '',
        role: '2',
        address: '',
        join_date: '',
        employment_status: 'active',
        base_salary: '',
        default_event_bonus: '',
    });

    const leaveForm = useForm({
        user_id: String(meta.current_user_id),
        leave_type: '1',
        start_date: '',
        end_date: '',
        reason: '',
    });

    const loanForm = useForm({
        borrower_type: '1',
        user_id: employees[0] ? String(employees[0].id) : '',
        vendor_name: '',
        vendor_phone: '',
        loan_date: new Date().toISOString().slice(0, 10),
        amount: '',
        notes: '',
    });

    const loanPaymentForm = useForm({
        borrower_type: '1',
        user_id: employees[0] ? String(employees[0].id) : '',
        vendor_name: '',
        payment_date: new Date().toISOString().slice(0, 10),
        amount: '',
        payment_method: '',
        notes: '',
    });

    const bonusClaimForm = useForm({
        user_id: String(meta.current_user_id),
        event_ids: [] as string[],
        work_month: filters.month,
        descriptions: {} as Record<string, string>,
        amounts: {} as Record<string, string>,
    });

    const ownerBonusForm = useForm({
        user_id: employees[0] ? String(employees[0].id) : '',
        bonus_month: filters.month,
        amount: '',
        notes: '',
    });

    const onlyDigits = (value: string) => value.replace(/\D/g, '');
    const formatNumberInput = (value: string) => onlyDigits(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const formatRupiah = (value?: number) => 'Rp ' + Number(value || 0).toLocaleString('id-ID');
    const inputClass = 'mt-1 block w-full rounded-md border-stone-300 bg-white text-sm text-stone-800 shadow-sm focus:border-rose-400 focus:ring-rose-400';
    const labelClass = 'block text-sm font-medium text-stone-600';
    const loanGroups = Object.values(loans.reduce((groups, loan) => {
        const key = loan.borrower_type === 1 ? `employee:${loan.user?.id || loan.borrower_name}` : `vendor:${loan.vendor_name || loan.borrower_name}`;

        if (!groups[key]) {
            groups[key] = {
                key,
                borrowerName: loan.borrower_name || loan.vendor_name || '-',
                borrowerTypeName: loan.borrower_type_name,
                totalAmount: 0,
                paidAmount: 0,
                remainingAmount: 0,
                activeTotalAmount: 0,
                activePaidAmount: 0,
                activeRemainingAmount: 0,
                loans: [] as Loan[],
            };
        }

        const isActiveLoan = loan.remaining_amount > 0 && loan.status === 1;

        groups[key].totalAmount += loan.amount;
        groups[key].paidAmount += loan.paid_amount;
        groups[key].remainingAmount += loan.remaining_amount;
        if (isActiveLoan) {
            groups[key].activeTotalAmount += loan.amount;
            groups[key].activePaidAmount += loan.paid_amount;
            groups[key].activeRemainingAmount += loan.remaining_amount;
        }
        groups[key].loans.push(loan);

        return groups;
    }, {} as Record<string, { key: string; borrowerName: string; borrowerTypeName: string; totalAmount: number; paidAmount: number; remainingAmount: number; activeTotalAmount: number; activePaidAmount: number; activeRemainingAmount: number; loans: Loan[] }>));
    const activeLoanGroups = loanGroups.filter((group) => group.activeRemainingAmount > 0);
    const visibleLoanGroups = loanView === 'active' ? activeLoanGroups : loanGroups;
    const selectedLoanGroup = loanGroups.find((group) => group.key === selectedLoanGroupKey) || null;
    const openLoanDetail = (key: string) => {
        setSelectedLoanGroupKey(key);
        setShowLoanDetailModal(true);
    };
    const openLoanPaymentModal = () => {
        const firstActiveLoanGroup = activeLoanGroups[0] || null;

        if (firstActiveLoanGroup) {
            const isEmployee = firstActiveLoanGroup.key.startsWith('employee:');
            loanPaymentForm.setData({
                ...loanPaymentForm.data,
                borrower_type: isEmployee ? '1' : '2',
                user_id: isEmployee ? firstActiveLoanGroup.key.replace('employee:', '') : loanPaymentForm.data.user_id,
                vendor_name: isEmployee ? '' : firstActiveLoanGroup.borrowerName,
                amount: '',
                payment_method: '',
                notes: '',
            });
        }

        setShowLoanPaymentModal(true);
    };
    const selectedPayrollRow = selectedPayrollRowId
        ? payrollRows.find((row) => row.id === selectedPayrollRowId) || null
        : null;
    const selectedPayrollClaims = selectedPayrollRow
        ? eventBonusClaims.filter((claim) => claim.user.id === selectedPayrollRow.id)
        : [];
    const selectedOwnerBonuses = selectedPayrollRow
        ? ownerBonuses.filter((bonus) => bonus.user.id === selectedPayrollRow.id)
        : [];

    const openCreateEmployee = () => {
        setEditEmployee(null);
        employeeForm.setData({
            name: '',
            email: '',
            mobile_phone: '',
            password: '',
            role: '2',
            address: '',
            join_date: '',
            employment_status: 'active',
            base_salary: '',
            default_event_bonus: '',
        });
        setShowEmployeeModal(true);
    };

    const openEditEmployee = (employee: Employee) => {
        setEditEmployee(employee);
        employeeForm.setData({
            name: employee.name,
            email: employee.email || '',
            mobile_phone: employee.mobile_phone || '',
            password: '',
            role: String(employee.role),
            address: employee.address || '',
            join_date: employee.join_date || '',
            employment_status: employee.employment_status || 'active',
            base_salary: String(employee.base_salary || ''),
            default_event_bonus: String(employee.default_event_bonus || ''),
        });
        setShowEmployeeModal(true);
    };

    const submitEmployee = (e: React.FormEvent) => {
        e.preventDefault();

        if (editEmployee) {
            employeeForm.put(route('staff.update', editEmployee.id), {
                preserveScroll: true,
                onSuccess: () => setShowEmployeeModal(false),
            });
        } else {
            employeeForm.post(route('staff.store'), {
                preserveScroll: true,
                onSuccess: () => setShowEmployeeModal(false),
            });
        }
    };

    const approveLeave = (leave: LeaveRequest, status: number) => {
        router.patch(route('staff.leave.update-status', leave.id), {
            status,
            review_notes: '',
        }, { preserveScroll: true });
    };

    const deleteBonusClaim = (claim: BonusClaim) => {
        if (!confirm(`Hapus klaim bonus ${claim.user.name} untuk ${claim.event.name}?`)) {
            return;
        }

        router.delete(route('staff.event-bonuses.destroy', claim.id), { preserveScroll: true });
    };

    const editBonusClaimAmount = (claim: BonusClaim) => {
        const amount = window.prompt('Nominal bonus:', formatNumberInput(String(Math.round(claim.amount || 0))));
        if (amount === null) return;

        const description = window.prompt('Keterangan pekerjaan:', claim.description || '');
        if (description === null) return;

        router.patch(route('staff.event-bonuses.update', claim.id), {
            amount: onlyDigits(amount) || '0',
            description,
            review_notes: '',
        }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const editOwnerBonus = (bonus: OwnerBonus) => {
        const amount = window.prompt('Nominal bonus owner:', formatNumberInput(String(Math.round(bonus.amount || 0))));
        if (amount === null) return;

        const notes = window.prompt('Catatan bonus owner:', bonus.notes || '');
        if (notes === null) return;

        router.patch(route('staff.owner-bonuses.update', bonus.id), {
            amount: onlyDigits(amount) || '0',
            notes,
        }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const deleteOwnerBonus = (bonus: OwnerBonus) => {
        if (!confirm(`Hapus bonus owner ${formatRupiah(bonus.amount)}?`)) {
            return;
        }

        router.delete(route('staff.owner-bonuses.destroy', bonus.id), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const openPayrollDetail = (row: PayrollRow) => {
        setSelectedPayrollRowId(row.id);
        bonusClaimForm.setData({
            ...bonusClaimForm.data,
            user_id: String(row.id),
            work_month: filters.month,
            event_ids: [],
            descriptions: {},
            amounts: {},
        });
        ownerBonusForm.setData({
            user_id: String(row.id),
            bonus_month: filters.month,
            amount: '',
            notes: '',
        });
    };

    const tabs = [
        ...(meta.can_manage ? [
            ['employees', 'Pegawai'],
        ] : []),
        ...(meta.can_manage_leave ? [
            ['leave', 'Cuti'],
        ] : []),
        ...(meta.can_manage ? [
            ['loans', 'Pinjaman'],
            ['payroll', 'Payroll'],
        ] : []),
        ...(!meta.can_manage ? [
            ['profile', 'Profil Saya'],
        ] : []),
    ];

    const statusClass = (status: number) => {
        if (status === 1) return 'bg-green-50 text-green-700';
        if (status === 2) return 'bg-red-50 text-red-700';
        if (status === 3) return 'bg-stone-100 text-stone-600';
        return 'bg-amber-50 text-amber-700';
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-stone-800">
                            Kepegawaian
                        </h2>
                        <p className="text-sm text-stone-500">Pegawai, cuti, pinjaman, bonus event, dan payroll.</p>
                    </div>
                    {meta.can_manage && (
                        <button
                            onClick={openCreateEmployee}
                            className="rounded bg-rose-400 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
                        >
                            + Tambah Pegawai
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Kepegawaian" />

            <div className="space-y-4 py-4">
                <div className="flex gap-2 overflow-x-auto border-b border-stone-200 pb-2">
                    {tabs.map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setActiveTab(key)}
                            className={`whitespace-nowrap rounded px-3 py-2 text-sm font-semibold ${
                                activeTab === key
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-white text-stone-600 hover:bg-stone-50'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {activeTab === 'employees' && meta.can_manage && (
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-stone-100">
                            <thead>
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-500">Nama</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-500">Jabatan</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-500">Kontak</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-stone-500">Gaji Pokok</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-stone-500">Bonus/Event</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {staff.data.map((employee) => (
                                    <tr
                                        key={employee.id}
                                        onClick={() => openEditEmployee(employee)}
                                        className="cursor-pointer hover:bg-stone-50"
                                    >
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-semibold text-stone-900">{employee.name}</p>
                                            <p className="text-xs text-stone-500">{employee.employment_status_name || '-'} · Masuk {employee.join_date || '-'}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="rounded bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">{employee.role_detail}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-stone-600">
                                            <p>{employee.email || '-'}</p>
                                            <p className="text-xs text-stone-400">{employee.mobile_phone || '-'}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-semibold text-stone-800">{formatRupiah(employee.base_salary || 0)}</td>
                                        <td className="px-4 py-3 text-right text-sm font-semibold text-rose-600">{formatRupiah(employee.default_event_bonus || 0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex justify-end gap-1 p-4">
                            {staff.links.map((link, i) => link.url ? (
                                <Link key={i} href={link.url} className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-rose-400 text-white' : 'bg-stone-100 text-stone-600'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                            ) : (
                                <span key={i} className="rounded bg-stone-50 px-3 py-1 text-sm text-stone-400 dark:bg-stone-900" dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'leave' && meta.can_manage_leave && (
                    <div className="space-y-4">
                        {meta.can_manage && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowLeaveModal(true)}
                                    className="rounded bg-rose-400 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
                                >
                                    + Tambah Cuti
                                </button>
                            </div>
                        )}
                        <LeaveOverviewTable rows={leaveRows} />
                        <LeaveList leaveRequests={leaveRequests} statusClass={statusClass} approveLeave={approveLeave} canManage={meta.can_manage} />
                    </div>
                )}

                {activeTab === 'loans' && meta.can_manage && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex rounded-lg bg-stone-100 p-1">
                                {[
                                    { value: 'active', label: 'Aktif' },
                                    { value: 'all', label: 'Semua' },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setLoanView(option.value as 'active' | 'all')}
                                        className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                                            loanView === option.value
                                                ? 'bg-white text-stone-900 shadow-sm'
                                                : 'text-stone-500 hover:text-stone-800'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowLoanModal(true)}
                                    className="rounded bg-rose-400 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
                                >
                                    + Tambah Pinjaman
                                </button>
                                <button
                                    type="button"
                                    onClick={openLoanPaymentModal}
                                    className="rounded bg-stone-800 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-900"
                                >
                                    Bayar Cicilan
                                </button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                                <div className="border-b border-stone-100 p-4">
                                    <h3 className="font-semibold text-stone-800">Total Pinjaman per Peminjam</h3>
                                    <p className="text-xs text-stone-500">Klik baris untuk melihat rincian pinjaman dan cicilan.</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-stone-100">
                                        <thead>
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-500">Peminjam</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-stone-500">Total Pinjam</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-stone-500">Sudah Cicil</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-stone-500">Sisa Aktif</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100">
                                            {visibleLoanGroups.map((group) => {
                                                const rowTotal = loanView === 'active' ? group.activeTotalAmount : group.totalAmount;
                                                const rowPaid = loanView === 'active' ? group.activePaidAmount : group.paidAmount;

                                                return (
                                                    <tr
                                                        key={group.key}
                                                        onClick={() => openLoanDetail(group.key)}
                                                        className="cursor-pointer hover:bg-stone-50"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="text-sm font-semibold text-stone-900">{group.borrowerName}</p>
                                                                {loanView === 'all' && (
                                                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                                                        group.activeRemainingAmount > 0
                                                                            ? 'bg-amber-50 text-amber-700'
                                                                            : 'bg-green-50 text-green-700'
                                                                    }`}>
                                                                        {group.activeRemainingAmount > 0 ? 'Aktif' : 'Lunas'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-stone-500">{group.borrowerTypeName}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm font-semibold text-stone-900">{formatRupiah(rowTotal)}</td>
                                                        <td className="px-4 py-3 text-right text-sm text-green-600">{formatRupiah(rowPaid)}</td>
                                                        <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">{formatRupiah(group.activeRemainingAmount)}</td>
                                                    </tr>
                                                );
                                            })}
                                            {visibleLoanGroups.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-stone-400">
                                                        {loanView === 'active' ? 'Tidak ada pinjaman aktif.' : 'Belum ada riwayat pinjaman.'}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'payroll' && meta.can_manage && (
                    <PayrollTable rows={payrollRows} formatRupiah={formatRupiah} onSelectRow={openPayrollDetail} />
                )}

                {activeTab === 'profile' && (
                    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                        <ProfileSummaryCard summary={profileSummary} formatRupiah={formatRupiah} />
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowLeaveModal(true)}
                                    className="rounded bg-rose-400 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
                                >
                                    Ajukan Cuti
                                </button>
                            </div>
                            <BonusClaimForm employees={employees} events={events} existingClaims={eventBonusClaims} form={bonusClaimForm} inputClass={inputClass} labelClass={labelClass} canManage={meta.can_manage} formatNumberInput={formatNumberInput} onlyDigits={onlyDigits} />
                            <LeaveList leaveRequests={leaveRequests} statusClass={statusClass} approveLeave={approveLeave} canManage={false} />
                        </div>
                    </div>
                )}
            </div>

            {showEmployeeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-stone-900">{editEmployee ? 'Edit Pegawai' : 'Tambah Pegawai'}</h3>
                        <form onSubmit={submitEmployee} className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Nama</label>
                                    <input value={employeeForm.data.name} onChange={(e) => employeeForm.setData('name', e.target.value)} className={inputClass} required />
                                </div>
                                <div>
                                    <label className={labelClass}>Email</label>
                                    <input type="email" value={employeeForm.data.email} onChange={(e) => employeeForm.setData('email', e.target.value)} className={inputClass} required />
                                </div>
                                <div>
                                    <label className={labelClass}>Telepon / WA</label>
                                    <input value={employeeForm.data.mobile_phone} onChange={(e) => employeeForm.setData('mobile_phone', e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Jabatan</label>
                                    <select value={employeeForm.data.role} onChange={(e) => employeeForm.setData('role', e.target.value)} className={inputClass}>
                                        {Object.entries(meta.roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Tanggal Masuk</label>
                                    <input type="date" value={employeeForm.data.join_date} onChange={(e) => employeeForm.setData('join_date', e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Status</label>
                                    <select value={employeeForm.data.employment_status} onChange={(e) => employeeForm.setData('employment_status', e.target.value)} className={inputClass}>
                                        {Object.entries(meta.employment_statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Gaji Pokok</label>
                                    <input inputMode="numeric" value={formatNumberInput(employeeForm.data.base_salary)} onChange={(e) => employeeForm.setData('base_salary', onlyDigits(e.target.value))} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Default Bonus / Event</label>
                                    <input inputMode="numeric" value={formatNumberInput(employeeForm.data.default_event_bonus)} onChange={(e) => employeeForm.setData('default_event_bonus', onlyDigits(e.target.value))} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Password {editEmployee && <span className="text-xs text-stone-400">(kosongkan jika tidak diganti)</span>}</label>
                                    <input type="password" value={employeeForm.data.password} onChange={(e) => employeeForm.setData('password', e.target.value)} className={inputClass} required={!editEmployee} minLength={6} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Alamat</label>
                                <textarea value={employeeForm.data.address} onChange={(e) => employeeForm.setData('address', e.target.value)} className={inputClass} rows={2} />
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    {editEmployee && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirm('Hapus pegawai ini?')) {
                                                    router.delete(route('staff.destroy', editEmployee.id), {
                                                        preserveScroll: true,
                                                        onSuccess: () => setShowEmployeeModal(false),
                                                    });
                                                }
                                            }}
                                            className="rounded bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                                        >
                                            Hapus Pegawai
                                        </button>
                                    )}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setShowEmployeeModal(false)} className="rounded bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-600">Batal</button>
                                    <button disabled={employeeForm.processing} className="rounded bg-rose-400 px-4 py-2 text-sm font-semibold text-white">Simpan</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showLeaveModal && (
                <Modal title="Pengajuan Cuti / Unpaid Leave" onClose={() => setShowLeaveModal(false)}>
                    <LeaveForm
                        employees={employees}
                        form={leaveForm}
                        inputClass={inputClass}
                        labelClass={labelClass}
                        leaveTypes={meta.leave_types}
                        selfOnly={!meta.can_manage}
                        onSuccess={() => setShowLeaveModal(false)}
                    />
                </Modal>
            )}

            {showLoanModal && (
                <Modal title="Tambah Pinjaman" onClose={() => setShowLoanModal(false)}>
                    <LoanForm
                        employees={employees}
                        form={loanForm}
                        inputClass={inputClass}
                        labelClass={labelClass}
                        borrowerTypes={meta.loan_borrower_types}
                        loanGroups={activeLoanGroups}
                        formatNumberInput={formatNumberInput}
                        onlyDigits={onlyDigits}
                        onSuccess={() => setShowLoanModal(false)}
                    />
                </Modal>
            )}

            {showLoanPaymentModal && (
                <Modal title="Bayar Cicilan Peminjam" onClose={() => setShowLoanPaymentModal(false)}>
                    <LoanPaymentForm
                        employees={employees}
                        form={loanPaymentForm}
                        inputClass={inputClass}
                        labelClass={labelClass}
                        borrowerTypes={meta.loan_borrower_types}
                        loanGroups={loanGroups}
                        formatNumberInput={formatNumberInput}
                        onlyDigits={onlyDigits}
                        onSuccess={() => setShowLoanPaymentModal(false)}
                    />
                </Modal>
            )}

            {showLoanDetailModal && selectedLoanGroup && (
                <Modal title={`Detail Pinjaman - ${selectedLoanGroup.borrowerName}`} onClose={() => setShowLoanDetailModal(false)} wide>
                    <LoanDetail group={selectedLoanGroup} formatRupiah={formatRupiah} />
                </Modal>
            )}

            {selectedPayrollRow && (
                <Modal title={`Payroll - ${selectedPayrollRow.name}`} onClose={() => setSelectedPayrollRowId(null)} wide>
                    <PayrollDetail
                        row={selectedPayrollRow}
                        employee={employees.find((employee) => employee.id === selectedPayrollRow.id)}
                        employees={employees}
                        events={events}
                        claims={selectedPayrollClaims}
                        ownerBonuses={selectedOwnerBonuses}
                        bonusClaimForm={bonusClaimForm}
                        ownerBonusForm={ownerBonusForm}
                        inputClass={inputClass}
                        labelClass={labelClass}
                        formatRupiah={formatRupiah}
                        formatNumberInput={formatNumberInput}
                        onlyDigits={onlyDigits}
                        currentUserId={meta.current_user_id}
                        editOwnerBonus={editOwnerBonus}
                        deleteOwnerBonus={deleteOwnerBonus}
                    />
                </Modal>
            )}
        </AuthenticatedLayout>
    );
}

function Modal({ title, onClose, children, wide = false }: any) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className={`max-h-[90vh] w-full overflow-y-auto rounded-lg bg-white p-6 shadow-xl ${wide ? 'max-w-5xl' : 'max-w-2xl'}`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
                    <button type="button" onClick={onClose} className="rounded bg-stone-100 px-3 py-1.5 text-sm font-semibold text-stone-600">
                        Tutup
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function LoanDetail({ group, formatRupiah }: any) {
    const activeLoans = group.loans.filter((loan: Loan) => loan.remaining_amount > 0 && loan.status === 1);
    const completedLoans = group.loans.filter((loan: Loan) => !(loan.remaining_amount > 0 && loan.status === 1));
    const renderLoanCard = (loan: Loan) => (
        <div key={loan.id} className="rounded-lg border border-stone-100 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="font-semibold text-stone-900">{loan.loan_date} · {loan.status_name}</p>
                    <p className="mt-1 text-sm text-stone-500">
                        {loan.borrower_type_name}
                        {loan.vendor_phone ? ` · ${loan.vendor_phone}` : ''}
                    </p>
                    {loan.notes && <p className="mt-1 text-sm text-stone-500">{loan.notes}</p>}
                </div>
                <div className="text-sm sm:text-right">
                    <p className="font-semibold text-stone-900">{formatRupiah(loan.amount)}</p>
                    <p className="text-green-600">Cicilan {formatRupiah(loan.paid_amount)}</p>
                    <p className="text-red-600">Sisa {formatRupiah(loan.remaining_amount)}</p>
                </div>
            </div>

            <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase text-stone-500">Riwayat Cicilan</p>
                {loan.payments.length > 0 ? (
                    <div className="divide-y divide-stone-100 rounded-lg bg-stone-50 px-3">
                        {loan.payments.map((payment) => (
                            <div key={payment.id} className="flex justify-between gap-3 py-2 text-xs text-stone-600">
                                <span>{payment.payment_date} · {payment.payment_method || '-'}{payment.notes ? ` · ${payment.notes}` : ''}</span>
                                <span className="font-semibold">{formatRupiah(payment.amount)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">Belum ada cicilan.</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-stone-50 p-3">
                    <p className="text-xs font-semibold uppercase text-stone-500">Pinjaman Aktif</p>
                    <p className="mt-1 text-lg font-bold text-stone-900">{formatRupiah(group.activeTotalAmount)}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3">
                    <p className="text-xs font-semibold uppercase text-green-700">Cicilan Aktif</p>
                    <p className="mt-1 text-lg font-bold text-green-700">{formatRupiah(group.activePaidAmount)}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                    <p className="text-xs font-semibold uppercase text-red-700">Sisa Aktif</p>
                    <p className="mt-1 text-lg font-bold text-red-700">{formatRupiah(group.activeRemainingAmount)}</p>
                </div>
            </div>

            <div className="space-y-3">
                <h4 className="font-semibold text-stone-800">Pinjaman Aktif</h4>
                {activeLoans.length > 0 ? activeLoans.map(renderLoanCard) : (
                    <p className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-500">Tidak ada pinjaman aktif.</p>
                )}

                <h4 className="pt-3 font-semibold text-stone-800">Riwayat Lunas / Ditutup</h4>
                {completedLoans.length > 0 ? completedLoans.map(renderLoanCard) : (
                    <p className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-500">Belum ada riwayat pinjaman lunas.</p>
                )}
            </div>
        </div>
    );
}

function LeaveForm({ employees, form, inputClass, labelClass, leaveTypes, selfOnly = false, onSuccess }: any) {
    return (
        <div>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(route('staff.leave.store'), {
                        preserveScroll: true,
                        onSuccess: () => {
                            form.reset('start_date', 'end_date', 'reason');
                            onSuccess?.();
                        },
                    });
                }}
                className="space-y-3"
            >
                {!selfOnly && (
                    <div>
                        <label className={labelClass}>Pegawai</label>
                        <select value={form.data.user_id} onChange={(e) => form.setData('user_id', e.target.value)} className={inputClass}>
                            {employees.map((employee: Employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
                        </select>
                    </div>
                )}
                <div>
                    <label className={labelClass}>Jenis</label>
                    <select value={form.data.leave_type} onChange={(e) => form.setData('leave_type', e.target.value)} className={inputClass}>
                        {Object.entries(leaveTypes).map(([value, label]) => <option key={value} value={value}>{label as string}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <label className={labelClass}>Mulai</label>
                        <input type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} className={inputClass} required />
                    </div>
                    <div>
                        <label className={labelClass}>Selesai</label>
                        <input type="date" value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} className={inputClass} required />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Alasan</label>
                    <textarea value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} className={inputClass} rows={2} />
                </div>
                <button className="rounded bg-rose-400 px-4 py-2 text-sm font-semibold text-white">Ajukan</button>
            </form>
        </div>
    );
}

function LoanForm({ employees, form, inputClass, labelClass, borrowerTypes, formatNumberInput, onlyDigits, onSuccess }: any) {
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                form.post(route('staff.loans.store'), {
                    preserveScroll: true,
                    onSuccess: () => {
                        form.reset('amount', 'notes', 'vendor_name', 'vendor_phone');
                        onSuccess?.();
                    },
                });
            }}
            className="space-y-3"
        >
            <div>
                <label className={labelClass}>Peminjam</label>
                <select value={form.data.borrower_type} onChange={(e) => form.setData('borrower_type', e.target.value)} className={inputClass}>
                    {Object.entries(borrowerTypes).map(([value, label]) => <option key={value} value={value}>{label as string}</option>)}
                </select>
            </div>
            {form.data.borrower_type === '1' ? (
                <div>
                    <label className={labelClass}>Pegawai</label>
                    <select value={form.data.user_id} onChange={(e) => form.setData('user_id', e.target.value)} className={inputClass}>
                        {employees.map((employee: Employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
                    </select>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <label className={labelClass}>Nama Vendor</label>
                        <input value={form.data.vendor_name} onChange={(e) => form.setData('vendor_name', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Telepon Vendor</label>
                        <input value={form.data.vendor_phone} onChange={(e) => form.setData('vendor_phone', e.target.value)} className={inputClass} />
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <label className={labelClass}>Tanggal Pinjaman</label>
                    <input type="date" value={form.data.loan_date} onChange={(e) => form.setData('loan_date', e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Nominal</label>
                    <input inputMode="numeric" value={formatNumberInput(form.data.amount)} onChange={(e) => form.setData('amount', onlyDigits(e.target.value))} className={inputClass} />
                </div>
            </div>
            <div>
                <label className={labelClass}>Catatan</label>
                <textarea value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} className={inputClass} rows={2} />
            </div>
            <div className="flex justify-end">
                <button disabled={form.processing} className="rounded bg-rose-400 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Simpan Pinjaman</button>
            </div>
        </form>
    );
}

function LoanPaymentForm({ employees, form, inputClass, labelClass, borrowerTypes, loanGroups = [], formatNumberInput, onlyDigits, onSuccess }: any) {
    const activeLoanGroups = loanGroups.filter((group: any) => group.activeRemainingAmount > 0);
    const employeeLoanGroups = activeLoanGroups.filter((group: any) => group.key.startsWith('employee:'));
    const vendorLoanGroups = activeLoanGroups.filter((group: any) => group.key.startsWith('vendor:'));
    const hasEmployeeLoans = employeeLoanGroups.length > 0;
    const hasVendorLoans = vendorLoanGroups.length > 0;
    const effectiveBorrowerType = form.data.borrower_type === '2' && hasVendorLoans
        ? '2'
        : (hasEmployeeLoans ? '1' : '2');
    const selectedEmployeeGroup = employeeLoanGroups.find((group: any) => group.key === `employee:${form.data.user_id}`) || employeeLoanGroups[0] || null;
    const selectedVendorGroup = vendorLoanGroups.find((group: any) => group.borrowerName === form.data.vendor_name) || vendorLoanGroups[0] || null;
    const selectedGroup = effectiveBorrowerType === '1' ? selectedEmployeeGroup : selectedVendorGroup;
    const maxRemaining = selectedGroup?.activeRemainingAmount || 0;

    const handleAmountChange = (value: string) => {
        const amount = Number(onlyDigits(value) || 0);
        form.setData('amount', String(Math.min(amount, maxRemaining || amount)));
    };

    const syncSelectedBorrower = () => {
        if (!selectedGroup) {
            return false;
        }

        if (effectiveBorrowerType === '1') {
            form.setData({
                ...form.data,
                borrower_type: '1',
                user_id: selectedGroup.key.replace('employee:', ''),
            });
        } else {
            form.setData({
                ...form.data,
                borrower_type: '2',
                vendor_name: selectedGroup.borrowerName,
            });
        }

        return true;
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();

                if (!syncSelectedBorrower()) {
                    alert('Pilih peminjam yang masih punya sisa pinjaman.');
                    return;
                }

                if (Number(form.data.amount || 0) > maxRemaining) {
                    alert(`Nominal cicilan maksimal ${formatNumberInput(String(Math.round(maxRemaining)))}.`);
                    return;
                }

                form.post(route('staff.loans.borrower-payments.store'), {
                    preserveScroll: true,
                    onSuccess: () => {
                        form.reset('amount', 'payment_method', 'notes');
                        onSuccess?.();
                    },
                });
            }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
            <div>
                <label className={labelClass}>Jenis Peminjam</label>
                <select value={effectiveBorrowerType} onChange={(e) => form.setData('borrower_type', e.target.value)} className={inputClass}>
                    {Object.entries(borrowerTypes)
                        .filter(([value]) => value === '1' ? hasEmployeeLoans : hasVendorLoans)
                        .map(([value, label]) => <option key={value} value={value}>{label as string}</option>)}
                </select>
            </div>
            {activeLoanGroups.length === 0 ? (
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 sm:col-span-2">
                    Tidak ada peminjam dengan sisa pinjaman aktif.
                </div>
            ) : effectiveBorrowerType === '1' ? (
                <div>
                    <label className={labelClass}>Pegawai</label>
                    <select value={selectedEmployeeGroup?.key.replace('employee:', '') || ''} onChange={(e) => form.setData('user_id', e.target.value)} className={inputClass}>
                        {employeeLoanGroups.map((group: any) => {
                            const id = group.key.replace('employee:', '');
                            const employee = employees.find((item: Employee) => String(item.id) === id);
                            return <option key={group.key} value={id}>{employee?.name || group.borrowerName}</option>;
                        })}
                    </select>
                </div>
            ) : (
                <div>
                    <label className={labelClass}>Nama Vendor</label>
                    <select value={selectedVendorGroup?.borrowerName || ''} onChange={(e) => form.setData('vendor_name', e.target.value)} className={inputClass}>
                        {vendorLoanGroups.map((group: any) => <option key={group.key} value={group.borrowerName}>{group.borrowerName}</option>)}
                    </select>
                </div>
            )}
            <div className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600 sm:col-span-2">
                Sisa pinjaman: <span className="font-semibold text-stone-900">{formatNumberInput(String(Math.round(maxRemaining))) || '0'}</span>
            </div>
            <div>
                <label className={labelClass}>Tanggal Bayar</label>
                <input type="date" value={form.data.payment_date} onChange={(e) => form.setData('payment_date', e.target.value)} className={inputClass} />
            </div>
            <div>
                <label className={labelClass}>Nominal</label>
                <input inputMode="numeric" value={formatNumberInput(form.data.amount)} onChange={(e) => handleAmountChange(e.target.value)} className={inputClass} />
                {maxRemaining > 0 && (
                    <p className="mt-1 text-xs text-stone-500">Maksimal {formatNumberInput(String(Math.round(maxRemaining)))}</p>
                )}
            </div>
            <div>
                <label className={labelClass}>Metode</label>
                <input value={form.data.payment_method} onChange={(e) => form.setData('payment_method', e.target.value)} className={inputClass} />
            </div>
            <div>
                <label className={labelClass}>Catatan</label>
                <input value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2 flex justify-end">
                <button disabled={form.processing || activeLoanGroups.length === 0} className="rounded bg-rose-400 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Simpan Cicilan</button>
            </div>
        </form>
    );
}

function LeaveList({ leaveRequests, statusClass, approveLeave, canManage }: any) {
    return (
        <div className="space-y-3">
            {leaveRequests.map((leave: LeaveRequest) => (
                <div key={leave.id} className="rounded-lg bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="font-semibold text-stone-900">{leave.user.name}</p>
                            <p className="text-sm text-stone-600">{leave.leave_type_name} · {leave.start_date} s/d {leave.end_date} · {leave.days} hari</p>
                            {leave.reason && <p className="mt-1 text-sm text-stone-500">{leave.reason}</p>}
                        </div>
                        <span className={`w-fit rounded px-2 py-1 text-xs font-semibold ${statusClass(leave.status)}`}>{leave.status_name}</span>
                    </div>
                    {canManage && leave.status === 0 && (
                        <div className="mt-3 flex gap-2">
                            <button onClick={() => approveLeave(leave, 1)} className="rounded bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">Setujui</button>
                            <button onClick={() => approveLeave(leave, 2)} className="rounded bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">Tolak</button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function LeaveOverviewTable({ rows }: { rows: LeaveRow[] }) {
    return (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="border-b border-stone-100 p-4">
                <h3 className="font-semibold text-stone-800">Rekap Cuti Pegawai</h3>
                <p className="text-xs text-stone-500">Sisa cuti mengikuti akumulasi 4 hari per bulan. Unpaid dihitung untuk bulan filter.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-100">
                    <thead>
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-500">Pegawai</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-stone-500">Jatah Total</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-stone-500">Terpakai</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-stone-500">Sisa Cuti</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-stone-500">Unpaid Bulan Ini</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {rows.map((row) => (
                            <tr key={row.employee.id}>
                                <td className="px-4 py-3">
                                    <p className="text-sm font-semibold text-stone-900">{row.employee.name}</p>
                                    <p className="text-xs text-stone-500">{row.employee.role_detail}</p>
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-stone-600">{row.total_allowance} hari</td>
                                <td className="px-4 py-3 text-right text-sm text-stone-600">{row.used_days} hari</td>
                                <td className={`px-4 py-3 text-right text-sm font-semibold ${row.remaining_days < 0 ? 'text-red-600' : 'text-rose-600'}`}>{row.remaining_days} hari</td>
                                <td className="px-4 py-3 text-right text-sm font-semibold text-amber-700">{row.unpaid_days_month} hari</td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-stone-400">Belum ada data cuti.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function BonusClaimForm({ employees, events, existingClaims, form, inputClass, labelClass, canManage, formatNumberInput, onlyDigits }: any) {
    const selectedEmployee = employees.find((employee: Employee) => String(employee.id) === String(form.data.user_id)) || employees[0];
    const defaultBonus = String(Math.round(Number(selectedEmployee?.default_event_bonus || 0)));
    const selectedEventIds = form.data.event_ids as string[];
    const totalClaim = selectedEventIds.reduce((sum, id) => sum + Number((form.data.amounts || {})[id] || 0), 0);
    const selectedClaims = (existingClaims || []).filter((claim: BonusClaim) => String(claim.user.id) === String(selectedEmployee?.id));
    const claimsByEvent = selectedClaims.reduce((map: Record<string, BonusClaim>, claim: BonusClaim) => {
        map[String(claim.event.id)] = claim;
        return map;
    }, {});
    const claimsKey = selectedClaims
        .map((claim: BonusClaim) => `${claim.event.id}:${claim.amount}:${claim.description}`)
        .sort()
        .join('|');

    useEffect(() => {
        const eventIds = selectedClaims.map((claim: BonusClaim) => String(claim.event.id));
        const descriptions = selectedClaims.reduce((map: Record<string, string>, claim: BonusClaim) => {
            map[String(claim.event.id)] = claim.description || '';
            return map;
        }, {});
        const amounts = selectedClaims.reduce((map: Record<string, string>, claim: BonusClaim) => {
            map[String(claim.event.id)] = String(Math.round(Number(claim.amount || 0)));
            return map;
        }, {});

        form.setData({
            ...form.data,
            event_ids: eventIds,
            descriptions,
            amounts,
        });
    }, [selectedEmployee?.id, claimsKey]);

    const isEventDirty = (eventId: number) => {
        const id = String(eventId);
        const claim = claimsByEvent[id];
        const checked = selectedEventIds.includes(id);

        if (!claim) {
            return checked;
        }

        if (!checked) {
            return true;
        }

        const description = (form.data.descriptions || {})[id] || '';
        const amount = Number((form.data.amounts || {})[id] || 0);

        return description !== (claim.description || '') || amount !== Number(claim.amount || 0);
    };

    const toggleEvent = (eventId: number) => {
        const id = String(eventId);
        const current = selectedEventIds;
        if (current.includes(id)) {
            const nextDescriptions = { ...(form.data.descriptions || {}) };
            const nextAmounts = { ...(form.data.amounts || {}) };
            delete nextDescriptions[id];
            delete nextAmounts[id];
            form.setData({
                ...form.data,
                event_ids: current.filter((value) => value !== id),
                descriptions: nextDescriptions,
                amounts: nextAmounts,
            });
            return;
        }

        form.setData({
            ...form.data,
            event_ids: [...current, id],
            amounts: {
                ...(form.data.amounts || {}),
                [id]: defaultBonus,
            },
        });
    };

    const setDescription = (eventId: number, value: string) => {
        form.setData('descriptions', {
            ...(form.data.descriptions || {}),
            [String(eventId)]: value,
        });
    };

    const setAmount = (eventId: number, value: string) => {
        form.setData('amounts', {
            ...(form.data.amounts || {}),
            [String(eventId)]: onlyDigits(value),
        });
    };

    return (
        <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-semibold text-stone-800">Klaim Bonus Event</h3>
                <div className="rounded bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                    Total {formatRupiahLocal(totalClaim)}
                </div>
            </div>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(route('staff.event-bonuses.store'), {
                        preserveScroll: true,
                        preserveState: true,
                    });
                }}
                className="mt-4 space-y-3"
            >
                {canManage && (
                    <div>
                        <label className={labelClass}>Pegawai</label>
                        <select
                            value={form.data.user_id}
                            onChange={(e) => form.setData({
                                ...form.data,
                                user_id: e.target.value,
                                amounts: {},
                                event_ids: [],
                                descriptions: {},
                            })}
                            className={inputClass}
                        >
                            {employees.map((employee: Employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
                        </select>
                        <p className="mt-1 text-xs text-stone-500">Default bonus/event: {formatRupiahLocal(Number(selectedEmployee?.default_event_bonus || 0))}</p>
                    </div>
                )}
                <div>
                    <label className={labelClass}>Bulan Event</label>
                    <input type="month" value={form.data.work_month} onChange={(e) => form.setData('work_month', e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Pilih Event Bulan Ini</label>
                    <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-stone-200">
                        {events.length === 0 && (
                            <p className="p-4 text-sm text-stone-500">Belum ada event pada bulan filter ini.</p>
                        )}
                        {events.map((event: EventItem) => {
                            const checked = (form.data.event_ids as string[]).includes(String(event.id));
                            const dirty = isEventDirty(event.id);

                            return (
                                <div key={event.id} className={`grid gap-3 border-b border-stone-100 px-3 py-2 last:border-b-0 hover:bg-stone-50 lg:grid-cols-[minmax(220px,0.7fr)_1fr_180px] lg:items-start ${dirty ? 'bg-amber-50' : ''}`}>
                                    <label className="flex cursor-pointer items-center gap-3 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleEvent(event.id)}
                                            className="rounded border-stone-300 text-rose-400 focus:ring-rose-400"
                                        />
                                        <span className="min-w-0">
                                            <span className="block font-semibold text-stone-800">{event.name}</span>
                                            <span className="text-xs text-stone-500">{event.date || '-'}</span>
                                            {claimsByEvent[String(event.id)] && <span className="mt-1 block text-xs font-semibold text-green-600">Sudah tersimpan</span>}
                                        </span>
                                    </label>
                                    {checked && (
                                        <>
                                            <textarea
                                                value={(form.data.descriptions || {})[String(event.id)] || ''}
                                                onChange={(e) => setDescription(event.id, e.target.value)}
                                                className={`${inputClass} mt-0`}
                                                rows={2}
                                                placeholder="Keterangan pekerjaan di event ini"
                                            />
                                            <div>
                                                <input
                                                    inputMode="numeric"
                                                    value={formatNumberInput((form.data.amounts || {})[String(event.id)] || '')}
                                                    onChange={(e) => setAmount(event.id, e.target.value)}
                                                    className={`${inputClass} mt-0 text-right font-semibold`}
                                                    placeholder="Nominal"
                                                />
                                                <p className="mt-1 text-right text-xs text-stone-400">bonus event</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <button className="rounded bg-rose-400 px-4 py-2 text-sm font-semibold text-white">Simpan Klaim</button>
            </form>
        </div>
    );
}

function formatRupiahLocal(value?: number) {
    return 'Rp ' + Number(value || 0).toLocaleString('id-ID');
}

function BonusClaimList({ claims, formatRupiah, editBonusClaimAmount, deleteBonusClaim, canManage, currentUserId }: any) {
    const total = claims.reduce((sum: number, claim: BonusClaim) => sum + Number(claim.amount || 0), 0);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
                <span className="text-sm font-semibold text-stone-700">Total Klaim Bonus Event</span>
                <span className="text-base font-bold text-rose-600">{formatRupiah(total)}</span>
            </div>
            {claims.map((claim: BonusClaim) => (
                <div key={claim.id} className="rounded-lg bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="font-semibold text-stone-900">{claim.user.name}</p>
                            <p className="text-sm text-stone-600">{claim.event.name} · {claim.work_month}</p>
                            <p className="mt-1 text-sm text-stone-500">{claim.description}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold text-stone-900">{formatRupiah(claim.amount)}</p>
                            <p className="mt-1 text-xs text-stone-400">Tercatat</p>
                        </div>
                    </div>
                    {(canManage || claim.user.id === currentUserId) && (
                        <div className="mt-3 flex gap-2">
                            <button onClick={() => editBonusClaimAmount(claim)} className="rounded bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">Ubah Klaim</button>
                            {canManage && (
                                <button onClick={() => deleteBonusClaim(claim)} className="rounded bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">Hapus Klaim</button>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function PayrollTable({ rows, formatRupiah, onSelectRow }: any) {
    return (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="border-b border-stone-100 p-4">
                <h3 className="font-semibold text-stone-800">Rekap Payroll</h3>
                <p className="text-xs text-stone-500">Klik baris pegawai untuk melihat detail bonus event, bonus owner, dan gaji.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-100">
                    <thead>
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-500">Pegawai</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-stone-500">Pokok</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-stone-500">Unpaid</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-stone-500">Bonus</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-stone-500">Bersih</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {rows.map((row: PayrollRow) => (
                            <tr key={row.id} onClick={() => onSelectRow(row)} className="cursor-pointer hover:bg-rose-50/60">
                                <td className="px-4 py-3">
                                    <p className="text-sm font-semibold text-stone-900">{row.name}</p>
                                    <p className="text-xs text-stone-500">{row.role_detail}</p>
                                </td>
                                <td className="px-4 py-3 text-right text-sm">{formatRupiah(row.base_salary)}</td>
                                <td className="px-4 py-3 text-right text-sm text-red-600">{row.unpaid_days} hari · {formatRupiah(row.unpaid_deduction)}</td>
                                <td className="px-4 py-3 text-right text-sm text-green-600">{formatRupiah(row.event_bonus + row.owner_bonus)}</td>
                                <td className="px-4 py-3 text-right text-sm font-bold text-stone-900">{formatRupiah(row.net_salary)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function PayrollDetail({
    row,
    employee,
    employees,
    events,
    claims,
    ownerBonuses,
    bonusClaimForm,
    ownerBonusForm,
    inputClass,
    labelClass,
    formatRupiah,
    formatNumberInput,
    onlyDigits,
    editOwnerBonus,
    deleteOwnerBonus,
}: any) {
    return (
        <div className="space-y-5">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    ownerBonusForm.post(route('staff.owner-bonuses.store'), {
                        preserveScroll: true,
                        onSuccess: () => ownerBonusForm.reset('amount', 'notes'),
                    });
                }}
                className="rounded-lg border border-stone-100 bg-stone-50 p-4"
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
                    <div>
                        <label className={labelClass}>Bulan</label>
                        <input type="month" value={ownerBonusForm.data.bonus_month} onChange={(e) => ownerBonusForm.setData('bonus_month', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Bonus Owner</label>
                        <input inputMode="numeric" value={formatNumberInput(ownerBonusForm.data.amount)} onChange={(e) => ownerBonusForm.setData('amount', onlyDigits(e.target.value))} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Catatan</label>
                        <input value={ownerBonusForm.data.notes} onChange={(e) => ownerBonusForm.setData('notes', e.target.value)} className={inputClass} />
                    </div>
                    <button disabled={ownerBonusForm.processing} className="rounded bg-rose-400 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                        Simpan
                    </button>
                </div>
            </form>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <PayrollStat label="Gaji Pokok" value={formatRupiah(row.base_salary)} />
                <PayrollStat label="Unpaid" value={`${row.unpaid_days} hari`} note={`-${formatRupiah(row.unpaid_deduction)}`} tone="red" />
                <PayrollStat label="Bonus Event" value={formatRupiah(row.event_bonus)} tone="green" />
                <PayrollStat label="Bonus Owner" value={formatRupiah(row.owner_bonus)} tone="green" />
                <PayrollStat label="Gaji Bersih" value={formatRupiah(row.net_salary)} tone="rose" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                    <h4 className="mb-3 font-semibold text-stone-800">Klaim Bonus Event</h4>
                    <BonusClaimForm
                        employees={employee ? [employee] : employees}
                        events={events}
                        existingClaims={claims}
                        form={bonusClaimForm}
                        inputClass={inputClass}
                        labelClass={labelClass}
                        canManage
                        formatNumberInput={formatNumberInput}
                        onlyDigits={onlyDigits}
                    />
                </div>
                <div>
                    <h4 className="mb-3 font-semibold text-stone-800">Riwayat Bonus Owner</h4>
                    <div className="space-y-2">
                        {ownerBonuses.length === 0 && (
                            <p className="rounded-lg bg-stone-50 p-4 text-sm text-stone-500">Belum ada bonus owner bulan ini.</p>
                        )}
                        {ownerBonuses.map((bonus: OwnerBonus) => (
                            <div key={bonus.id} className="rounded-lg bg-stone-50 p-3 text-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-stone-600">{bonus.notes || '-'}</p>
                                        <div className="mt-2 flex gap-2">
                                            <button type="button" onClick={() => editOwnerBonus(bonus)} className="rounded bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                                                Ubah
                                            </button>
                                            <button type="button" onClick={() => deleteOwnerBonus(bonus)} className="rounded bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                    <span className="shrink-0 font-semibold text-stone-900">{formatRupiah(bonus.amount)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function PayrollStat({ label, value, note, tone = 'stone' }: { label: string; value: string; note?: string; tone?: 'green' | 'red' | 'rose' | 'stone' }) {
    const toneClass: Record<'green' | 'red' | 'rose' | 'stone', string> = {
        green: 'text-green-700',
        red: 'text-red-600',
        rose: 'text-rose-600',
        stone: 'text-stone-900',
    };

    return (
        <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-stone-100">
            <p className="text-xs text-stone-500">{label}</p>
            <p className={`mt-1 text-base font-bold ${toneClass[tone]}`}>{value}</p>
            {note && <p className="text-xs text-stone-500">{note}</p>}
        </div>
    );
}

function ProfileSummaryCard({ summary, formatRupiah }: any) {
    return (
        <div className="space-y-4">
            <div className="rounded-lg bg-white p-4 shadow-sm">
                <h3 className="font-semibold text-stone-800">Saldo Cuti</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded bg-stone-50 p-3">
                        <p className="text-stone-500">Jatah Total</p>
                        <p className="text-xl font-bold text-stone-900">{summary.leave_balance.total_allowance} hari</p>
                    </div>
                    <div className="rounded bg-stone-50 p-3">
                        <p className="text-stone-500">Sisa</p>
                        <p className="text-xl font-bold text-rose-500">{summary.leave_balance.remaining_days} hari</p>
                    </div>
                </div>
                <p className="mt-3 text-xs text-stone-500">Jatah {summary.leave_balance.allowance_per_month} hari per bulan. Sisa bisa terbawa, dan nilai minus berarti memakai jatah bulan depan.</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
                <h3 className="font-semibold text-stone-800">Informasi Pegawai</h3>
                <p className="mt-2 text-sm text-stone-500">
                    Profil ini dipakai untuk pengajuan cuti, unpaid leave, klaim bonus event, dan melihat pinjaman aktif.
                </p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
                <h3 className="font-semibold text-stone-800">Pinjaman Aktif</h3>
                <div className="mt-3 space-y-2">
                    {summary.active_loans.length === 0 && <p className="text-sm text-stone-500">Tidak ada pinjaman aktif.</p>}
                    {summary.active_loans.map((loan: Loan) => (
                        <div key={loan.id} className="rounded bg-stone-50 p-3 text-sm">
                            <div className="flex justify-between"><span>{loan.loan_date}</span><span>{formatRupiah(loan.remaining_amount)}</span></div>
                            {loan.notes && <p className="mt-1 text-xs text-stone-500">{loan.notes}</p>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
