<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Notifications\Notifiable;

#[Fillable([
    'name',
    'email',
    'password',
    'role',
    'mobile_phone',
    'address',
    'join_date',
    'employment_status',
    'base_salary',
    'default_event_bonus',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $appends = [
        'role_detail',
        'employment_status_name',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => 'integer',
            'join_date' => 'date',
            'base_salary' => 'double',
            'default_event_bonus' => 'double',
        ];
    }

    const ROLE_OWNER = 1;
    const ROLE_MANAGER = 2;
    const ROLE_STAFF_GALERI = 3;
    const ROLE_STAFF_LOKASI = 4;

    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';
    const STATUS_RESIGNED = 'resigned';

    const ROLES = [
        self::ROLE_OWNER => 'Owner',
        self::ROLE_MANAGER => 'Manager',
        self::ROLE_STAFF_GALERI => 'Staff Galeri',
        self::ROLE_STAFF_LOKASI => 'Staff Lokasi',
    ];

    const EMPLOYMENT_STATUSES = [
        self::STATUS_ACTIVE => 'Aktif',
        self::STATUS_INACTIVE => 'Nonaktif',
        self::STATUS_RESIGNED => 'Resign',
    ];

    public function getRoleDetailAttribute(): string
    {
        return self::ROLES[$this->role] ?? 'Unknown';
    }

    public function getEmploymentStatusNameAttribute(): string
    {
        return self::EMPLOYMENT_STATUSES[$this->employment_status] ?? 'Aktif';
    }

    public function isOwner(): bool
    {
        return $this->role === self::ROLE_OWNER;
    }

    public function isAdmin(): bool
    {
        return $this->isOwner();
    }

    public function isStaff(): bool
    {
        return in_array($this->role, [
            self::ROLE_MANAGER,
            self::ROLE_STAFF_GALERI,
            self::ROLE_STAFF_LOKASI,
        ], true);
    }

    public function isManager(): bool
    {
        return $this->role === self::ROLE_MANAGER;
    }

    public function isLimitedStaff(): bool
    {
        return in_array($this->role, [
            self::ROLE_STAFF_GALERI,
            self::ROLE_STAFF_LOKASI,
        ], true);
    }

    public function canManageEmployees(): bool
    {
        return $this->isOwner();
    }

    public function canManageLeaveRequests(): bool
    {
        return $this->isOwner() || $this->isManager();
    }

    public function canConfirmPayment(): bool
    {
        return $this->isOwner();
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(EmployeeLeaveRequest::class);
    }

    public function loans(): HasMany
    {
        return $this->hasMany(EmployeeLoan::class);
    }

    public function eventBonusClaims(): HasMany
    {
        return $this->hasMany(EmployeeEventBonusClaim::class);
    }

    public function ownerBonuses(): HasMany
    {
        return $this->hasMany(EmployeeOwnerBonus::class);
    }
}
