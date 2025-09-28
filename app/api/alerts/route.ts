import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Alerts retrieved successfully',
      data: {
        alerts: [
          {
            id: 'alert-1',
            type: 'emergency',
            title: 'Emergency Button Activated',
            description: 'Driver activated emergency button in vehicle ABC-1234',
            severity: 'critical',
            status: 'active',
            vehicleId: 'vehicle-1',
            vehiclePlate: 'ABC-1234',
            driverId: 'driver-1',
            driverName: 'João Silva',
            companyId: 'test-company-id',
            location: {
              latitude: -23.5505,
              longitude: -46.6333,
              address: 'Av. Paulista, 1000 - São Paulo, SP'
            },
            timestamp: '2024-01-15T10:30:00Z',
            resolvedAt: null,
            resolvedBy: null
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      success: true,
      message: 'Alert created successfully',
      data: {
        alert: {
          id: 'alert-new',
          ...body,
          timestamp: new Date().toISOString(),
          status: 'active'
        }
      }
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}