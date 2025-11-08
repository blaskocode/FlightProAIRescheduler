import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get school settings (for now, return default)
    // In production, this would fetch from a settings table
    return NextResponse.json({
      weatherApiEnabled: false,
      weatherCheckFrequency: 'hourly',
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { weatherApiEnabled, weatherCheckFrequency } = body;

    // In production, this would update a settings table
    // For now, just return success
    return NextResponse.json({
      success: true,
      settings: {
        weatherApiEnabled: weatherApiEnabled ?? false,
        weatherCheckFrequency: weatherCheckFrequency || 'hourly',
      },
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

