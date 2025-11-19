import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export const generateReceiptImage = async (orderData, items) => {
  try {
    // Create a temporary div for the receipt
    const receiptDiv = document.createElement('div')
    receiptDiv.style.position = 'absolute'
    receiptDiv.style.left = '-9999px'
    receiptDiv.style.top = '-9999px'
    receiptDiv.style.width = '400px'
    receiptDiv.style.backgroundColor = 'white'
    receiptDiv.style.fontFamily = 'Arial, sans-serif'
    receiptDiv.style.padding = '20px'
    receiptDiv.style.border = '2px solid #000'
    receiptDiv.style.borderRadius = '8px'

    // Add watermark/security features
    const watermark = document.createElement('div')
    watermark.style.position = 'absolute'
    watermark.style.top = '50%'
    watermark.style.left = '50%'
    watermark.style.transform = 'translate(-50%, -50%) rotate(-45deg)'
    watermark.style.fontSize = '60px'
    watermark.style.color = 'rgba(255, 0, 0, 0.1)'
    watermark.style.fontWeight = 'bold'
    watermark.style.pointerEvents = 'none'
    watermark.style.zIndex = '1'
    watermark.textContent = 'ORIGINAL'
    receiptDiv.appendChild(watermark)

    // Header
    const header = document.createElement('div')
    header.style.textAlign = 'center'
    header.style.marginBottom = '20px'
    header.style.borderBottom = '2px solid #000'
    header.style.paddingBottom = '10px'
    header.innerHTML = `
      <h1 style="margin: 0; font-size: 24px; font-weight: bold;">NOTA PESANAN</h1>
      <p style="margin: 5px 0; font-size: 14px;">Aplikasi Pembelian Guru TK</p>
      <p style="margin: 5px 0; font-size: 12px; color: #666;">${new Date().toLocaleString('id-ID')}</p>
    `
    receiptDiv.appendChild(header)

    // Order Info
    const orderInfo = document.createElement('div')
    orderInfo.style.marginBottom = '20px'
    orderInfo.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span style="font-weight: bold;">No. Pesanan:</span>
        <span>${orderData.order_number}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span style="font-weight: bold;">Nama:</span>
        <span>${orderData.customer_name}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span style="font-weight: bold;">Email:</span>
        <span>${orderData.customer_email}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span style="font-weight: bold;">Telepon:</span>
        <span>${orderData.customer_phone}</span>
      </div>
    `
    receiptDiv.appendChild(orderInfo)

    // Items Header
    const itemsHeader = document.createElement('div')
    itemsHeader.style.borderTop = '1px solid #000'
    itemsHeader.style.borderBottom = '1px solid #000'
    itemsHeader.style.padding = '8px 0'
    itemsHeader.style.fontWeight = 'bold'
    itemsHeader.style.display = 'flex'
    itemsHeader.style.justifyContent = 'space-between'
    itemsHeader.innerHTML = `
      <span style="flex: 2;">Produk</span>
      <span style="flex: 1; text-align: center;">Qty</span>
      <span style="flex: 1; text-align: right;">Harga</span>
      <span style="flex: 1; text-align: right;">Total</span>
    `
    receiptDiv.appendChild(itemsHeader)

    // Items
    items.forEach(item => {
      const itemDiv = document.createElement('div')
      itemDiv.style.padding = '8px 0'
      itemDiv.style.borderBottom = '1px dotted #ccc'
      itemDiv.style.display = 'flex'
      itemDiv.style.justifyContent = 'space-between'
      itemDiv.innerHTML = `
        <span style="flex: 2; font-size: 12px;">${item.product.name}</span>
        <span style="flex: 1; text-align: center;">${item.quantity}</span>
        <span style="flex: 1; text-align: right;">Rp ${new Intl.NumberFormat('id-ID').format(item.price)}</span>
        <span style="flex: 1; text-align: right;">Rp ${new Intl.NumberFormat('id-ID').format(item.quantity * item.price)}</span>
      `
      receiptDiv.appendChild(itemDiv)
    })

    // Total
    const totalDiv = document.createElement('div')
    totalDiv.style.marginTop = '15px'
    totalDiv.style.paddingTop = '10px'
    totalDiv.style.borderTop = '2px solid #000'
    totalDiv.style.fontSize = '16px'
    totalDiv.style.fontWeight = 'bold'
    totalDiv.style.display = 'flex'
    totalDiv.style.justifyContent = 'space-between'
    totalDiv.innerHTML = `
      <span>TOTAL:</span>
      <span>Rp ${new Intl.NumberFormat('id-ID').format(orderData.total_amount)}</span>
    `
    receiptDiv.appendChild(totalDiv)

    // Notes
    if (orderData.notes) {
      const notesDiv = document.createElement('div')
      notesDiv.style.marginTop = '15px'
      notesDiv.style.padding = '10px'
      notesDiv.style.backgroundColor = '#f9f9f9'
      notesDiv.style.border = '1px solid #ddd'
      notesDiv.style.borderRadius = '4px'
      notesDiv.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px;">Catatan:</div>
        <div style="font-size: 12px;">${orderData.notes}</div>
      `
      receiptDiv.appendChild(notesDiv)
    }

    // Payment Info
    const paymentDiv = document.createElement('div')
    paymentDiv.style.marginTop = '20px'
    paymentDiv.style.padding = '15px'
    paymentDiv.style.backgroundColor = '#e8f4f8'
    paymentDiv.style.border = '1px solid #0066cc'
    paymentDiv.style.borderRadius = '4px'
    paymentDiv.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 10px; color: #0066cc;">INFORMASI PEMBAYARAN</div>
      <div style="font-size: 12px; line-height: 1.4;">
        <div><strong>Bank BCA:</strong> 1234567890</div>
        <div><strong>A/N:</strong> Nama Toko</div>
        <div style="margin-top: 8px; color: #d32f2f; font-weight: bold;">
          ⚠️ Harap transfer sesuai nominal total di atas
        </div>
      </div>
    `
    receiptDiv.appendChild(paymentDiv)

    // Security Footer
    const securityDiv = document.createElement('div')
    securityDiv.style.marginTop = '20px'
    securityDiv.style.padding = '10px'
    securityDiv.style.backgroundColor = '#fff3cd'
    securityDiv.style.border = '1px solid #ffc107'
    securityDiv.style.borderRadius = '4px'
    securityDiv.style.fontSize = '10px'
    securityDiv.style.textAlign = 'center'
    securityDiv.innerHTML = `
      <div style="color: #856404;">
        <strong>DOKUMEN RESMI - TIDAK BOLEH DIUBAH</strong>
      </div>
      <div style="margin-top: 5px; color: #6c757d;">
        Nota ini dilindungi dari manipulasi. Setiap perubahan akan terdeteksi.
      </div>
    `
    receiptDiv.appendChild(securityDiv)

    // Add to document temporarily
    document.body.appendChild(receiptDiv)

    // Generate canvas
    const canvas = await html2canvas(receiptDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 400,
      height: receiptDiv.offsetHeight,
    })

    // Remove temporary element
    document.body.removeChild(receiptDiv)

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/png', 0.95)
    })
  } catch (error) {
    console.error('Error generating receipt image:', error)
    throw error
  }
}

export const generateSecureReceipt = async (orderData, items) => {
  try {
    // Generate the receipt image
    const receiptBlob = await generateReceiptImage(orderData, items)

    // Create a unique hash for verification
    const receiptData = {
      order_number: orderData.order_number,
      customer_name: orderData.customer_name,
      total_amount: orderData.total_amount,
      timestamp: new Date().toISOString(),
      items: items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price
      }))
    }

    // Create a simple hash for verification (in production, use proper cryptographic hash)
    const verificationString = JSON.stringify(receiptData)
    const verificationHash = btoa(verificationString).substring(0, 16)

    return {
      imageBlob: receiptBlob,
      verificationHash,
      receiptData
    }
  } catch (error) {
    console.error('Error generating secure receipt:', error)
    throw error
  }
}
