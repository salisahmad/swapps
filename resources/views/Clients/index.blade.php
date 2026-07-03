@extends('layouts.app')

@section('content')
<div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">Daftar Klien</h1>

    {{-- Filter dan Pencarian --}}
    <form action="{{ route('clients.index') }}" method="GET" class="bg-white shadow rounded-lg p-6 mb-8 flex flex-wrap gap-4 items-end">
        <div class="flex-grow">
            <label for="q" class="block text-sm font-medium text-gray-700">Cari Klien</label>
            <input type="text" name="q" id="q" value="{{ request('q') }}" placeholder="Nama atau Nomor Telepon" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500">
        </div>

        {{-- Filter Tanggal --}}
        <div class="w-full md:w-1/4">
            <label for="date_from" class="block text-sm font-medium text-gray-700">Tanggal Mulai</label>
            <input type="date" name="date_from" id="date_from" value="{{ request('date_from') }}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500">
        </div>

        <div class="w-full md:w-1/4">
            <label for="date_to" class="block text-sm font-medium text-gray-700">Tanggal Sampai</label>
            <input type="date" name="date_to" id="date_to" value="{{ request('date_to') }}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500">
        </div>

        {{-- Filter Status Pembayaran --}}
        <div class="w-full md:w-1/4">
            <label for="paid" class="block text-sm font-medium text-gray-700">Status Pembayaran</label>
            <select name="paid" id="paid" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">Semua</option>
                <option value="1" {{ request('paid') == '1' ? 'selected' : '' }}>Lunas</option>
                <option value="0" {{ request('paid') == '0' ? 'selected' : '' }}>Belum Lunas</option>
            </select>
        </div>

        {{-- Filter Jenis Layanan --}}
        <div class="w-full md:w-1/4">
            <label for="order_type" class="block text-sm font-medium text-gray-700">Jenis Layanan</label>
            <select name="order_type" id="order_type" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">Semua</option>
                <option value="{{ \App\Models\Client::TYPE_MUA }}">MUA</option>
                <option value="{{ \App\Models\Client::TYPE_GAUN }}">Sewa Gaun</option>
            </select>
        </div>

        <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-150">Filter</button>
    </form>

    {{-- Tabel Daftar Klien --}}
    <div class="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Daftar Klien</h2>
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead>
                    <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Klien</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Acara</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Layanan</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Harga</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DP Dibayar</th>
                        <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    @forelse($clients as $client)
                        {{-- Tentukan background color berdasarkan order_type --}}
                        @php
                            $bgColor = '';
                            if ($client->order_type == \App\Models\Client::TYPE_MUA) {
                                $bgColor = 'bg-pink-50'; // Pink for MUA
                            } elseif ($client->order_type == \App\Models\Client::TYPE_GAUN) {
                                $bgColor = 'bg-purple-50'; // Purple/Light Blue for Gaun
                            } else {
                                $bgColor = '';
                            }
                        @endphp
                        <tr class="{{ $bgColor }}">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ $client->name }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ \Carbon\Carbon::parse($client->date)->format('d M Y') }} ({{ \Carbon\Carbon::parse($client->time)->format('H:i') }})</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                @if ($client->order_type == \App\Models\Client::TYPE_MUA)
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">MUA</span>
                                @elseif ($client->order_type == \App\Models\Client::TYPE_GAUN)
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Sewa Gaun</span>
                                @else
                                    <span>Unknown</span>
                                @endif
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp {{ number_format($client->total_amount, 0, ',', '.') }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">Rp {{ number_format($client->down_payment ?? 0, 0, ',', '.') }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <a href="{{ route('clients.show', $client) }}" class="text-indigo-600 hover:text-indigo-900">Detail</a>
                                <a href="{{ route('clients.edit', $client) }}" class="text-yellow-600 hover:text-yellow-900">Edit</a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="px-6 py-4 text-center text-gray-500">Belum ada data klien.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        {{ $clients->withQueryString()->links() }}
    </div>
</div>
@endsection