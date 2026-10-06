<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('summary', 500);
            $table->json('categories');
            $table->json('tags')->nullable();
            $table->unsignedSmallInteger('year');
            $table->string('client')->nullable();
            $table->string('duration')->nullable();
            $table->text('overview')->nullable();
            $table->json('objectives')->nullable();
            $table->text('challenge')->nullable();
            $table->text('solution')->nullable();
            $table->json('results')->nullable();
            $table->string('cover')->nullable();
            $table->json('gallery')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};