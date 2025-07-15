import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, context } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Basit AI yanıt sistemi (gerçek AI entegrasyonu için OpenAI, Claude vb. kullanılabilir)
    const responses = {
      greeting: [
        'Merhaba! Size nasıl yardımcı olabilirim?',
        'Hoş geldiniz! Hangi konuda yardıma ihtiyacınız var?',
        'Selam! Bugün size nasıl yardımcı olabilirim?'
      ],
      help: [
        'Kullanıcı yönetimi, dosya yönetimi, log takibi gibi işlemler yapabilirsiniz.',
        'Dashboard\'da genel istatistikleri görebilir, kullanıcıları yönetebilirsiniz.',
        'Sol menüden istediğiniz modüle erişebilirsiniz.'
      ],
      users: [
        'Kullanıcı yönetimi için sol menüden "Kullanıcılar" bölümüne gidin.',
        'Yeni kullanıcı oluşturmak için "Kullanıcı Oluştur" butonunu kullanın.',
        'Kullanıcıları düzenlemek için yanlarındaki düzenleme ikonuna tıklayın.'
      ],
      files: [
        'Dosya yönetimi için "Dosya Yönetimi" bölümüne gidin.',
        'Dosya yüklemek için "Dosya Yükle" butonunu kullanın.',
        'Dosyaları görüntülemek ve yönetmek için dosya kartlarına tıklayın.'
      ],
      analytics: [
        'Analitik verileri "Analytics" bölümünde bulabilirsiniz.',
        'Kullanıcı büyümesi ve aktivite metriklerini takip edebilirsiniz.',
        'Grafikler ve istatistikler gerçek zamanlı olarak güncellenir.'
      ],
      default: [
        'Bu konuda size yardımcı olmak için daha fazla bilgiye ihtiyacım var.',
        'Lütfen sorunuzu daha detaylı açıklayabilir misiniz?',
        'Bu konuda size nasıl yardımcı olabileceğimi belirtir misiniz?'
      ]
    }

    // Mesaj analizi
    const lowerMessage = message.toLowerCase()
    let responseType = 'default'

    if (lowerMessage.includes('merhaba') || lowerMessage.includes('selam') || lowerMessage.includes('hi')) {
      responseType = 'greeting'
    } else if (lowerMessage.includes('yardım') || lowerMessage.includes('help') || lowerMessage.includes('nasıl')) {
      responseType = 'help'
    } else if (lowerMessage.includes('kullanıcı') || lowerMessage.includes('user')) {
      responseType = 'users'
    } else if (lowerMessage.includes('dosya') || lowerMessage.includes('file')) {
      responseType = 'files'
    } else if (lowerMessage.includes('analitik') || lowerMessage.includes('analytics') || lowerMessage.includes('istatistik')) {
      responseType = 'analytics'
    }

    const possibleResponses = responses[responseType as keyof typeof responses]
    const randomResponse = possibleResponses[Math.floor(Math.random() * possibleResponses.length)]

    // Log kaydı oluştur
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: 'INFO',
          type: 'AI',
          message: `AI Chat: ${message}`,
          details: `User: ${session.user.email}, Response: ${randomResponse}`,
          metadata: { context }
        })
      })
    } catch (error) {
      console.error('Error logging AI chat:', error)
    }

    return NextResponse.json({
      response: randomResponse,
      timestamp: new Date().toISOString(),
      context: {
        user: session.user.email,
        messageType: responseType
      }
    })
  } catch (error) {
    console.error('Error in AI chat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 