@extends('layouts.app')

@section('content')
<div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">Edit Detail Klien</h1>

    {{-- Form Edit Klien --}}
    <form action="{{ route('clients.update', $client) }}" method="POST" enctype="multipart/form-data" class="bg-white shadow rounded-lg p-8 max-w-3xl mx-auto">
        @csrf
        @method('PUT')

        {{-- Grid Utama --}}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <label for="name" class="block text-sm font-medium text-gray-700">Nama Klien <span class="text-red-500">*</span></label>
                <input type="text" name="name" id="name" value="{{ $client->name }}" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>

            <div>
                <label for="mobile_phone" class="block text-sm font-medium text-gray-700">Nomor Telepon <span class="text-red-500">*</span></label>
                <input type="text" name="mobile_phone" id="mobile_phone" value="{{ $client->mobile_phone }}" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>

            <div>
                <label for="date" class="block text-sm font-medium text-gray-700">Tanggal Acara <span class="text-red-500">*</span></label>
                <input type="date" name="date" id="date" value="{{ $client->date }}" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>

            <div>
                <label for="time" class="block text-sm font-medium text-gray-700">Waktu Acara</label>
                <input type="time" name="time" id="time" value="{{ $client->time }}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>

            {{-- Jenis Layanan --}}
            <div>
                <label for="order_type" class="block text-sm font-medium text-gray-700">Jenis Layanan <span class="text-red-500">*</span></label>
                <select name="order_type" id="order_type" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Pilih Jenis Layanan</option>
                    <option value="{{ \App\Models\Client::TYPE_MUA }}" {{ $client->order_type == \App\Models\Client::TYPE_MUA ? 'selected' : '' }}>MUA</option>
                    <option value="{{ \App\Models\Client::TYPE_GAUN }}" {{ $client->order_type == \App\Models\Client::TYPE_GAUN ? 'selected' : '' }}>Sewa Gaun</option>
                </select>
            </div>

            {{-- Down Payment --}}
            <div>
                <label for="down_payment" class="block text-sm font-medium text-gray-700">Down Payment (DP) <span class="text-red-500">*</span></label>
                <input type="number" name="down_payment" id="down_payment" value="{{ $client->down_payment ?? 0 }}" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>
        </div>

        {{-- Detail Tambahan --}}
        <div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <label for="address" class="block text-sm font-medium text-gray-700">Alamat</label>
                <input type="text" name="address" id="address" value="{{ $client->address }}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>

            <div>
                <label for="location" class="block text-sm font-medium text-gray-700">Lokasi</label>
                <input type="text" name="location" id="location" value="{{ $client->location }}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>

            <div>
                <label for="package_description" class="block text-sm font-medium text-gray-700">Deskripsi Paket</label>
                <textarea name="package_description" id="package_description" rows="2" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500">{{ $client->package_description }}</textarea>
            </div>
        </div>

        {{-- Total Harga dan Item --}}
        <div class="mb-8">
            <label for="total_amount" class="block text-sm font-medium text-gray-700">Total Harga <span class="text-red-500">*</span></label>
            <input type="number" name="total_amount" id="total_amount" value="{{ $client->total_amount }}" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500">
        </div>

        {{-- Item Selection --}}
        <div class="mb-8 p-4 border border-dashed border-gray-300 rounded-lg">
            <h3 class="text-lg font-semibold mb-3">Pilih Item Tambahan</h3>
            @if ($items->isEmpty())
                <p class="text-sm text-gray-500">Belum ada item yang tersedia.</p>
            @else
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    @foreach($items as $item)
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" name="item_ids[]" value="{{ $item->id }}" {{ in_array($item->id, $client->items->pluck('item_id')->toArray()) ? 'checked' : '' }} class="rounded text-indigo-600 focus:ring-indigo-500">
                            <span>{{ $item->name }} (Rp {{ number_format($item->price, 0, ',', '.') }})</span>
                        </label>
                    @endforeach
                </div>
                <input type="hidden" name="item_ids[]" value="">
            @endif
        </div>

        {{-- Tombol Submit --}}
        <div class="flex justify-between items-center pt-4 border-t">
            <button type="submit" class="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 transition duration-150">Update Klien</button>
        </div>
    </form>
</div>

@endsection
<script>
    // Script untuk membatasi tanggal mulai (date) agar tidak sebelum besok
    document.addEventListener('DOMContentLoaded', function() {
        const dateInput = document.getElementById('date');
        if (dateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const year = tomorrow.getFullYear();
            const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
            const day = String(tomorrow.getDate()).padStart(2, '0');
            dateInput.setAttribute('min', `${year}-${month}-${day}`);
        }
    });
</script>
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