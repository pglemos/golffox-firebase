import { NextRequest, NextResponse } from 'next/server'

interface HealthStatus {
  status: 'ok' | 'warning' | 'error'
  timestamp: string
  service: string
  version: string
  uptime: number
  environment: string
  services: {
    database: ServiceStatus
    firebase: {
      auth: ServiceStatus
      firestore: ServiceStatus
    }
    api: ServiceStatus
    cache?: ServiceStatus
  }
  system: {
    memory: {
      used: number
      total: number
      percentage: number
    }
    cpu?: {
      usage: number
    }
  }
}

interface ServiceStatus {
  status: 'connected' | 'disconnected' | 'degraded'
  responseTime?: number
  lastCheck: string
}

interface DetailedHealthCheck {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  checks: Array<{
    name: string
    status: 'pass' | 'fail' | 'warn'
    message?: string
    duration?: number
  }>
  metadata: {
    buildVersion: string
    buildDate: string
    nodeVersion: string
    platform: string
  }
}

const startTime = Date.now()

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const detailed = searchParams.get('detailed') === 'true'

    if (detailed) {
      return getDetailedHealth()
    }

    const uptime = Math.floor((Date.now() - startTime) / 1000)
    const memoryUsage = process.memoryUsage()
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)

    // Simular verificações de serviços
    const databaseStatus = await checkDatabaseConnection()
    const firebaseStatus = await checkFirebaseServices()
    const apiStatus = checkApiHealth()

    // Determinar status geral
    const allServices = [
      databaseStatus.status,
      firebaseStatus.auth.status,
      firebaseStatus.firestore.status,
      apiStatus.status
    ]

    let overallStatus: 'ok' | 'warning' | 'error' = 'ok'
    if (allServices.includes('disconnected')) {
      overallStatus = 'error'
    } else if (allServices.includes('degraded')) {
      overallStatus = 'warning'
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'GolfFox Management Panel',
      version: '1.0.0',
      uptime,
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: databaseStatus,
        firebase: firebaseStatus,
        api: apiStatus
      },
      system: {
        memory: {
          used: memoryUsedMB,
          total: memoryTotalMB,
          percentage: Math.round((memoryUsedMB / memoryTotalMB) * 100)
        }
      }
    }

    const statusCode = overallStatus === 'error' ? 503 : 200

    return NextResponse.json({
      success: true,
      data: healthStatus,
      message: 'Health check realizado com sucesso'
    }, { status: statusCode })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

async function getDetailedHealth(): Promise<NextResponse> {
  const checks = []
  
  // Verificar conectividade do banco
  const dbStart = Date.now()
  const dbStatus = await checkDatabaseConnection()
  checks.push({
    name: 'database_connectivity',
    status: dbStatus.status === 'connected' ? 'pass' : 'fail',
    message: `Database ${dbStatus.status}`,
    duration: Date.now() - dbStart
  })

  // Verificar Firebase Auth
  const authStart = Date.now()
  const firebaseStatus = await checkFirebaseServices()
  checks.push({
    name: 'firebase_auth',
    status: firebaseStatus.auth.status === 'connected' ? 'pass' : 'fail',
    message: `Firebase Auth ${firebaseStatus.auth.status}`,
    duration: Date.now() - authStart
  })

  // Verificar Firestore
  const firestoreStart = Date.now()
  checks.push({
    name: 'firebase_firestore',
    status: firebaseStatus.firestore.status === 'connected' ? 'pass' : 'fail',
    message: `Firestore ${firebaseStatus.firestore.status}`,
    duration: Date.now() - firestoreStart
  })

  // Verificar uso de memória
  const memoryUsage = process.memoryUsage()
  const memoryPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
  checks.push({
    name: 'memory_usage',
    status: memoryPercentage > 90 ? 'fail' : memoryPercentage > 70 ? 'warn' : 'pass',
    message: `Memory usage: ${memoryPercentage.toFixed(1)}%`,
    duration: 1
  })

  const overallStatus = checks.some(c => c.status === 'fail') ? 'unhealthy' :
                       checks.some(c => c.status === 'warn') ? 'degraded' : 'healthy'

  const detailedHealth: DetailedHealthCheck = {
    overall: overallStatus,
    checks,
    metadata: {
      buildVersion: '1.0.0',
      buildDate: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform
    }
  }

  const statusCode = overallStatus === 'unhealthy' ? 503 : 200

  return NextResponse.json({
    success: true,
    data: detailedHealth,
    message: 'Health check detalhado realizado com sucesso'
  }, { status: statusCode })
}

async function checkDatabaseConnection(): Promise<ServiceStatus> {
  try {
    // Simular verificação de conexão com banco
    // Em produção, fazer ping real no banco de dados
    await new Promise(resolve => setTimeout(resolve, 10))
    
    return {
      status: 'connected',
      responseTime: 10,
      lastCheck: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'disconnected',
      lastCheck: new Date().toISOString()
    }
  }
}

async function checkFirebaseServices(): Promise<{
  auth: ServiceStatus
  firestore: ServiceStatus
}> {
  try {
    // Simular verificação dos serviços Firebase
    // Em produção, fazer verificações reais
    await new Promise(resolve => setTimeout(resolve, 15))
    
    return {
      auth: {
        status: 'connected',
        responseTime: 15,
        lastCheck: new Date().toISOString()
      },
      firestore: {
        status: 'connected',
        responseTime: 12,
        lastCheck: new Date().toISOString()
      }
    }
  } catch (error) {
    return {
      auth: {
        status: 'disconnected',
        lastCheck: new Date().toISOString()
      },
      firestore: {
        status: 'disconnected',
        lastCheck: new Date().toISOString()
      }
    }
  }
}

function checkApiHealth(): ServiceStatus {
  // Verificar saúde da API
  return {
    status: 'connected',
    responseTime: 1,
    lastCheck: new Date().toISOString()
  }
}

export const dynamic = 'force-dynamic'