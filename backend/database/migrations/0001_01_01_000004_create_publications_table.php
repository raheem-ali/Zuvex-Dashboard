<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('publications', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('authors');
            $table->string('type');
            $table->unsignedSmallInteger('year');
            $table->text('summary');
            $table->string('cover')->nullable();
            $table->string('file')->nullable();
            $table->unsignedInteger('downloads')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('publications');
    }
};