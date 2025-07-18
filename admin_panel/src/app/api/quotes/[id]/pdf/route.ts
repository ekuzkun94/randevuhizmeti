import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import puppeteer from 'puppeteer'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await context.params
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quote = await prisma.quote.findUnique({
      where: { 
        id: id,
        createdBy: session.user.id
      },
      include: {
        items: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Generate HTML content
    const htmlContent = generateQuoteHTML(quote)

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    })

    await browser.close()

    // Update quote with PDF path
    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        pdfPath: `quotes/${quote.quoteNumber}.pdf`,
        pdfGeneratedAt: new Date()
      }
    })

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="teklif-${quote.quoteNumber}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateQuoteHTML(quote: any) {
  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Teklif - ${quote.quoteNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 5px;
        }
        
        .quote-title {
          font-size: 18px;
          color: #666;
          margin-bottom: 10px;
        }
        
        .quote-number {
          font-size: 16px;
          font-weight: bold;
          color: #333;
        }
        
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        
        .customer-info, .quote-info {
          flex: 1;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 5px;
        }
        
        .info-item {
          margin-bottom: 5px;
          font-size: 12px;
        }
        
        .info-label {
          font-weight: bold;
          color: #666;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        
        .items-table th {
          background-color: #f8fafc;
          border: 1px solid #e5e7eb;
          padding: 10px;
          text-align: left;
          font-size: 12px;
          font-weight: bold;
          color: #374151;
        }
        
        .items-table td {
          border: 1px solid #e5e7eb;
          padding: 10px;
          font-size: 12px;
        }
        
        .items-table .text-right {
          text-align: right;
        }
        
        .totals {
          margin-left: auto;
          width: 300px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          font-size: 12px;
        }
        
        .total-row.grand-total {
          border-top: 2px solid #2563eb;
          font-weight: bold;
          font-size: 14px;
          padding-top: 10px;
          margin-top: 10px;
        }
        
        .notes-section {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        
        .notes-title {
          font-size: 14px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        
        .notes-content {
          font-size: 12px;
          color: #666;
          line-height: 1.5;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 10px;
          color: #999;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-name">ZamanYonet</div>
          <div class="quote-title">${quote.title}</div>
          <div class="quote-number">Teklif No: ${quote.quoteNumber}</div>
        </div>
        
        <div class="info-section">
          <div class="customer-info">
            <div class="section-title">Müşteri Bilgileri</div>
            <div class="info-item">
              <span class="info-label">Ad:</span> ${quote.customerName}
            </div>
            <div class="info-item">
              <span class="info-label">E-posta:</span> ${quote.customerEmail}
            </div>
            ${quote.customerPhone ? `<div class="info-item">
              <span class="info-label">Telefon:</span> ${quote.customerPhone}
            </div>` : ''}
            ${quote.customerAddress ? `<div class="info-item">
              <span class="info-label">Adres:</span> ${quote.customerAddress}
            </div>` : ''}
          </div>
          
          <div class="quote-info">
            <div class="section-title">Teklif Bilgileri</div>
            <div class="info-item">
              <span class="info-label">Tarih:</span> ${format(new Date(quote.createdAt), 'dd/MM/yyyy', { locale: tr })}
            </div>
            ${quote.validUntil ? `<div class="info-item">
              <span class="info-label">Geçerlilik:</span> ${format(new Date(quote.validUntil), 'dd/MM/yyyy', { locale: tr })}
            </div>` : ''}
            <div class="info-item">
              <span class="info-label">Durum:</span> ${quote.status === 'DRAFT' ? 'Taslak' : quote.status === 'SENT' ? 'Gönderildi' : quote.status === 'ACCEPTED' ? 'Kabul Edildi' : quote.status === 'REJECTED' ? 'Reddedildi' : quote.status}
            </div>
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Ürün/Hizmet</th>
              <th>Açıklama</th>
              <th class="text-right">Miktar</th>
              <th class="text-right">Birim Fiyat</th>
              <th class="text-right">Toplam</th>
            </tr>
          </thead>
          <tbody>
            ${quote.items.map((item: any) => `
              <tr>
                <td>${item.name}</td>
                <td>${item.description || '-'}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">₺${item.unitPrice.toFixed(2)}</td>
                <td class="text-right">₺${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-row">
            <span>Ara Toplam:</span>
            <span>₺${quote.subtotal.toFixed(2)}</span>
          </div>
          ${quote.taxAmount > 0 ? `<div class="total-row">
            <span>KDV (${quote.taxRate}%):</span>
            <span>₺${quote.taxAmount.toFixed(2)}</span>
          </div>` : ''}
          ${quote.discountAmount > 0 ? `<div class="total-row">
            <span>İndirim (${quote.discountRate}%):</span>
            <span>-₺${quote.discountAmount.toFixed(2)}</span>
          </div>` : ''}
          <div class="total-row grand-total">
            <span>Genel Toplam:</span>
            <span>₺${quote.total.toFixed(2)}</span>
          </div>
        </div>
        
        ${(quote.notes || quote.terms) ? `
          <div class="notes-section">
            ${quote.notes ? `
              <div class="notes-title">Notlar</div>
              <div class="notes-content">${quote.notes}</div>
            ` : ''}
            ${quote.terms ? `
              <div class="notes-title" style="margin-top: 20px;">Şartlar ve Koşullar</div>
              <div class="notes-content">${quote.terms}</div>
            ` : ''}
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Bu teklif ZamanYonet sistemi tarafından oluşturulmuştur.</p>
          <p>Oluşturulma Tarihi: ${format(new Date(quote.createdAt), 'dd/MM/yyyy HH:mm', { locale: tr })}</p>
        </div>
      </div>
    </body>
    </html>
  `
} 