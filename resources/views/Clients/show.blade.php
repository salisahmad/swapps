@extends('layouts.app')

@section('content')
<div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">Detail Klien: {{ $client->name }}</h1>

    {{-- Kartu Informasi Utama --}}
    <div class="bg-white shadow rounded-lg p-8 max-w-4xl mx-auto mb-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 border-b pb-6 mb-6">
            {{-- Kolom 1 --}}
            <div>
                <h2 class="text-xl font-semibold text-indigo-700 mb-2">Informasi Dasar</h2>
                <p><strong>Jenis Layanan:</strong> <span class="font-medium">{{ $client->order_type == \App\Models\Client::TYPE_MUA ? 'MUA' : 'Sewa Gaun' }}</span></p>
                <p><strong>Tanggal Acara:</strong> {{ \Carbon\Carbon::parse($client->date)->format('d M Y') }}</p>
                <p><strong>Waktu Acara:</strong> {{ $client->time ? \Carbon\Carbon::parse($client->time)->format('H:i') : 'N/A' }}</p>
            </div>

            {{-- Kolom 2 --}}
            <div>
                <h2 class="text-xl font-semibold text-indigo-700 mb-2">Kontak & Lokasi</h2>
                <p><strong>Nomor Telepon:</strong> {{ $client->mobile_phone }}</p>
                <p><strong>Alamat:</strong> {{ $client->address ?? 'Tidak tersedia' }}</p>
                <p><strong>Lokasi Acara:</strong> {{ $client->location ?? 'Tidak tersedia' }}</p>
            </div>

            {{-- Kolom 3 --}}
            <div>
                <h2 class="text-xl font-semibold text-indigo-700 mb-2">Keuangan</h2>
                <p><strong>Total Harga:</strong> <span class="font-bold text-lg text-red-600">Rp {{ number_format($client->total_amount, 0, ',', '.') }}</span></p>
                <p><strong>DP Dibayar:</strong> <span class="font-bold text-lg text-green-600">Rp {{ number_format($client->down_payment ?? 0, 0, ',', '.') }}</span></p>
                <p><strong>Sisa Pembayaran:</strong> <span class="font-bold text-lg">{{ number_format($client->remaining_amount ?? 0, 0, ',', '.') }}</span></p>
            </div>
        </div>

        {{-- Deskripsi Paket --}}
        <div class="mb-8">
            <h2 class="text-xl font-semibold mb-3 border-b pb-2">Deskripsi Paket</h2>
            <p>{{ $client->package_description ?? 'Tidak ada deskripsi paket.' }}</p>
        </div>

        {{-- Item Tambahan --}}
        <div class="mb-8 p-4 bg-gray-50 rounded-lg border">
            <h2 class="text-xl font-semibold mb-3">Item yang Dipilih</h2>
            @if ($client->items->isEmpty())
                <p class="text-gray-500">Belum ada item tambahan yang dipilih.</p>
            @else
                <ul class="space-y-2">
                    @foreach($client->items as $item)
                        <li class="flex justify-between items-center border-b pb-2 last:border-b-0">
                            <span>{{ $item->name }} ({{ $item->type == \App\Models\Client::TYPE_MUA ? 'MUA' : 'Sewa Gaun' }})</span>
                            <span class="font-semibold text-gray-800">Rp {{ number_format($item->price, 0, ',', '.') }}</span>
                        </li>
                    @endforeach
                </ul>
            @endif
        </div>

        {{-- Jadwal dan Pembayaran --}}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h2 class="text-xl font-semibold mb-3 border-b pb-2">Jadwal Kegiatan</h2>
                @if ($client->schedules->isEmpty())
                    <p class="text-gray-500">Belum ada jadwal kegiatan.</p>
                @else
                    <ul class="space-y-3">
                        @foreach($client->schedules as $schedule)
                            <li class="border p-3 rounded-md bg-blue-50">
                                <p class="font-semibold">{{ \Carbon\Carbon::parse($schedule->date)->format('d M Y') }} - {{ \Carbon\Carbon::parse($schedule->time)->format('H:i') }}</p>
                                <p class="text-sm text-gray-600">Kegiatan: {{ $schedule->description ?? 'Tidak ada deskripsi' }}</p>
                            </li>
                        @endforeach
                    </ul>
                @endif
            </div>

            <div>
                <h2 class="text-xl font-semibold mb-3 border-b pb-2">Riwayat Pembayaran</h2>
                @if ($client->payments->isEmpty())
                    <p class="text-gray-500">Belum ada riwayat pembayaran.</p>
                @else
                    <ul class="space-y-3 max-h-96 overflow-y-auto pr-2">
                        @foreach($client->payments as $payment)
                            <li class="border p-3 rounded-md bg-green-50">
                                <p class="font-semibold">{{ \Carbon\Carbon::parse($payment->date)->format('d M Y') }}</p>
                                <p class="text-sm text-gray-600">Jumlah: Rp {{ number_format($payment->amount, 0, ',', '.') }} ({{ $payment->status == 1 ? 'Lunas' : 'Pending' }})</p>
                            </li>
                        @endforeach
                    </ul>
                @endif
            </div>
        </div>

    </div>
</div>
@endsection
<task_progress>
- [x] Analyze requirements and formulate plan (Completed)
- [x] Implement naming convention change (Events -> Clients)
- [ ] Update UI/UX: Consolidate 'Closing Today' & 'New Client Today' logic
- [ ] Implement client detail view navigation persistence
- [ ] Modify table view: Add 'Jenis' column and apply background colors
- [ ] Apply theme colors to the detailed client view
- [ ] Implement filtering mechanism on the Clients tab (MUA/Sewa Gaun)
- [ ] Update form validation: Required fields (Name, Phone, Date, Total Price)
- [ ] Update form logic: Restrict start date selection (Tomorrow onwards)
- [ ] Update form structure: Add editable 'Down Payment' field with default value 1.000.000
- [ ] Test the implementation and verify results
</task_progress>
</write_to_file>

</final_file_content>

IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base your SEARCH/REPLACE operations on this final version to ensure accuracy.

<environment_details>
# Visual Studio Code Visible Files
resources/views/clients/show.blade.php

# Visual Studio Code Open Tabs
app/Models/Event.php
app/Http/Controllers/EventController.php
resources/views/Clients/index.blade.php
resources/views/clients/create.blade.php
resources/views/clients/edit.blade.php
resources/views/clients/show.blade.php

# Recently Modified Files
These files have been modified since you last accessed them (file was just edited so you may need to re-read it before editing):
/Users/elvano/Sites/shofi-wedding/resources/views/clients/show.blade.php

# Current Time
7/3/2026, 7:51:48 AM (Asia/Jakarta, UTC+7:00)

# Context Window Usage
70,996 / 128K tokens used (55%)

# Current Mode
ACT MODE
</environment_details>