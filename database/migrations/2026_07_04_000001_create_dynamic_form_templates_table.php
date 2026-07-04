<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dynamic_form_templates', function (Blueprint $table) {
            $table->id();
            $table->string('field_name');
            $table->string('field_label');
            $table->string('field_type')->default('text');
            $table->text('field_options')->nullable();
            $table->boolean('is_required')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('sort_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dynamic_form_templates');
    }
};
