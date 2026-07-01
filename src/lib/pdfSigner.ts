// @ts-ignore
import forge from 'node-forge';
import { PDFDocument, PDFName, PDFNumber, PDFString, PDFArray, PDFDict, PDFHexString, rgb, StandardFonts } from 'pdf-lib';
// @ts-ignore
import signer from 'node-signpdf';

/**
 * Genera un certificado digital PKCS#12 (PFX) autofirmado de prueba en memoria usando node-forge.
 */
export function generateSelfSignedCert(): Buffer {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01abc';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [
    { name: 'commonName', value: 'LUCKY MOTORS SAC - CERTIFICACION INTERNA' },
    { name: 'countryName', value: 'PE' },
    { name: 'organizationName', value: 'Lucky Motors SAC' },
    { name: 'organizationalUnitName', value: 'Seguridad e Informatica' }
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  // Auto-firmar el certificado
  cert.sign(keys.privateKey, forge.md.sha256.create());

  // Empaquetar como PKCS#12 (PFX)
  const asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], 'password', {
    generateLocalKeyId: true,
    friendlyName: 'Lucky Motors PFX'
  });
  const pfxDer = forge.asn1.toDer(asn1).getBytes();
  return Buffer.from(pfxDer, 'binary');
}

/**
 * Agrega el placeholder para la firma criptográfica (estándar PAdES / adbe.pkcs7.detached)
 * en el archivo PDF binario usando pdf-lib.
 */
function addSignaturePlaceholder(pdfDoc: PDFDocument, signatureBox: { x: number, y: number, width: number, height: number }) {
  const pages = pdfDoc.getPages();
  const page = pages[pages.length - 1]; // Añadimos la firma en la última página

  const byteRangeArray = PDFArray.withContext(pdfDoc.context);
  byteRangeArray.push(PDFNumber.of(0));
  byteRangeArray.push(PDFName.of('**********'));
  byteRangeArray.push(PDFName.of('**********'));
  byteRangeArray.push(PDFName.of('**********'));

  const signatureDict = pdfDoc.context.obj({
    Type: 'Sig',
    Filter: 'Adobe.PPKLite',
    SubFilter: 'adbe.pkcs7.detached',
    ByteRange: byteRangeArray,
    Contents: PDFHexString.of('0'.repeat(9500 * 2)), // 9500 bytes reservados para el bloque PKCS#7
  });

  const widgetDict = pdfDoc.context.obj({
    Type: 'Annot',
    Subtype: 'Widget',
    FT: 'Sig',
    Rect: [
      signatureBox.x,
      signatureBox.y,
      signatureBox.x + signatureBox.width,
      signatureBox.y + signatureBox.height
    ],
    V: signatureDict,
    T: PDFString.of('FirmaDigital'),
    F: 4,
    P: page.ref,
  });

  const widgetRef = pdfDoc.context.register(widgetDict);
  
  // Agregar anotación Widget a la página
  let annots = page.node.get(PDFName.of('Annots')) as PDFArray;
  if (!annots) {
    annots = pdfDoc.context.obj([]) as PDFArray;
    page.node.set(PDFName.of('Annots'), annots);
  }
  annots.push(widgetRef);

  // Agregar campo al AcroForm del documento
  let acroForm = pdfDoc.catalog.get(PDFName.of('AcroForm')) as PDFDict;
  if (!acroForm) {
    acroForm = pdfDoc.context.obj({
      Fields: [],
    }) as PDFDict;
    pdfDoc.catalog.set(PDFName.of('AcroForm'), acroForm);
  }
  acroForm.set(PDFName.of('SigFlags'), PDFNumber.of(3));
  let fields = acroForm.get(PDFName.of('Fields')) as PDFArray;
  if (!fields) {
    fields = pdfDoc.context.obj([]) as PDFArray;
    acroForm.set(PDFName.of('Fields'), fields);
  }
  fields.push(widgetRef);
}

/**
 * Diseña y dibuja el reporte en PDF, dibuja el recuadro visual de firma digital,
 * y luego inyecta la firma criptográfica.
 */
export async function generateAndSignReportPdf(
  data: any[],
  type: 'ventas' | 'servicios',
  author: { full_name: string; email: string }
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  
  // Usar fuentes estándar
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Añadir una página (tamaño A4)
  const page = pdfDoc.addPage([595.276, 841.89]); // A4 en puntos
  const { width, height } = page.getSize();

  // --- 1. DIBUJAR CABECERA CORPORATIVA ---
  // Línea decorativa roja superior
  page.drawRectangle({
    x: 0,
    y: height - 10,
    width,
    height: 10,
    color: rgb(0.86, 0.15, 0.15), // Rojo corporativo
  });

  // Título
  page.drawText('LUCKY MOTORS S.A.C.', {
    x: 40,
    y: height - 40,
    size: 20,
    font: fontHelveticaBold,
    color: rgb(0.12, 0.16, 0.23),
  });

  page.drawText(
    type === 'ventas' ? 'REPORTE OFICIAL DE TRANSACCIONES - VENTAS' : 'REPORTE OFICIAL DE ATENCION - SERVICIOS',
    {
      x: 40,
      y: height - 60,
      size: 11,
      font: fontHelveticaBold,
      color: rgb(0.3, 0.4, 0.5),
    }
  );

  // Metadatos
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE');
  const timeStr = now.toLocaleTimeString('es-PE');
  const authorInfo = `Generado por: ${author.full_name} (${author.email})`;
  const dateInfo = `Fecha: ${dateStr} ${timeStr} | UTC -05:00`;

  page.drawText(authorInfo, {
    x: 40,
    y: height - 85,
    size: 9,
    font: fontHelvetica,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText(dateInfo, {
    x: 40,
    y: height - 98,
    size: 9,
    font: fontHelvetica,
    color: rgb(0.4, 0.4, 0.4),
  });

  // --- 2. DIBUJAR RESUMEN ESTADÍSTICO (KPI CARDS) ---
  const totalAmount = data.reduce((acc, curr) => acc + Number(type === 'ventas' ? curr.amount : curr.cost), 0);
  const totalCount = data.length;
  const avgAmount = totalCount > 0 ? (totalAmount / totalCount).toFixed(2) : '0.00';

  // Caja 1: Total Facturado
  page.drawRectangle({
    x: 40,
    y: height - 160,
    width: 160,
    height: 50,
    color: rgb(0.97, 0.97, 0.98),
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
  });
  page.drawText('TOTAL FACTURADO', { x: 50, y: height - 128, size: 8, font: fontHelveticaBold, color: rgb(0.5, 0.5, 0.5) });
  page.drawText(`S/ ${totalAmount.toFixed(2)}`, { x: 50, y: height - 150, size: 14, font: fontHelveticaBold, color: rgb(0.1, 0.6, 0.2) });

  // Caja 2: Total Registros
  page.drawRectangle({
    x: 215,
    y: height - 160,
    width: 160,
    height: 50,
    color: rgb(0.97, 0.97, 0.98),
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
  });
  page.drawText(type === 'ventas' ? 'VENTAS REALIZADAS' : 'SERVICIOS COMPLETADOS', { x: 225, y: height - 128, size: 8, font: fontHelveticaBold, color: rgb(0.5, 0.5, 0.5) });
  page.drawText(`${totalCount}`, { x: 225, y: height - 150, size: 14, font: fontHelveticaBold, color: rgb(0.15, 0.45, 0.8) });

  // Caja 3: Ticket Promedio
  page.drawRectangle({
    x: 390,
    y: height - 160,
    width: 160,
    height: 50,
    color: rgb(0.97, 0.97, 0.98),
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
  });
  page.drawText('PROMEDIO POR REGISTRO', { x: 400, y: height - 128, size: 8, font: fontHelveticaBold, color: rgb(0.5, 0.5, 0.5) });
  page.drawText(`S/ ${avgAmount}`, { x: 400, y: height - 150, size: 14, font: fontHelveticaBold, color: rgb(0.4, 0.2, 0.7) });

  // --- 3. DIBUJAR TABLA DE DATOS ---
  page.drawText('DETALLE DEL INFORME', {
    x: 40,
    y: height - 195,
    size: 11,
    font: fontHelveticaBold,
    color: rgb(0.12, 0.16, 0.23),
  });

  // Cabecera Tabla
  page.drawRectangle({
    x: 40,
    y: height - 220,
    width: 515,
    height: 20,
    color: rgb(0.12, 0.16, 0.23),
  });

  const headers = type === 'ventas' 
    ? ['Fecha', 'Cliente', 'Vehículo', 'Monto']
    : ['Fecha', 'Cliente', 'Descripción', 'Costo'];

  page.drawText(headers[0], { x: 50, y: height - 214, size: 9, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  page.drawText(headers[1], { x: 130, y: height - 214, size: 9, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  page.drawText(headers[2], { x: 260, y: height - 214, size: 9, font: fontHelveticaBold, color: rgb(1, 1, 1) });
  page.drawText(headers[3], { x: 490, y: height - 214, size: 9, font: fontHelveticaBold, color: rgb(1, 1, 1) });

  // Filas Tabla
  let currentY = height - 240;
  data.slice(0, 15).forEach((row, index) => {
    // Alternar color de fondo
    if (index % 2 === 0) {
      page.drawRectangle({
        x: 40,
        y: currentY - 4,
        width: 515,
        height: 20,
        color: rgb(0.97, 0.97, 0.98),
      });
    }

    const rowDate = new Date(type === 'ventas' ? row.sale_date : row.service_date).toLocaleDateString('es-PE');
    const rowClient = row.customer_name;
    const rowDetail = type === 'ventas' ? row.vehicle_details : row.description;
    const rowVal = Number(type === 'ventas' ? row.amount : row.cost).toFixed(2);

    page.drawText(rowDate, { x: 50, y: currentY, size: 8, font: fontHelvetica, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(rowClient.substring(0, 22), { x: 130, y: currentY, size: 8, font: fontHelvetica, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(rowDetail.substring(0, 42), { x: 260, y: currentY, size: 8, font: fontHelvetica, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(`S/ ${rowVal}`, { x: 490, y: currentY, size: 8, font: fontHelveticaBold, color: rgb(0.1, 0.1, 0.1) });

    currentY -= 20;
  });

  // --- 4. DIBUJAR RECUADRO VISUAL DE LA FIRMA DIGITAL ---
  // Lo dibujamos exactamente como el de la imagen de Adobe Acrobat
  const signatureBox = {
    x: 355,
    y: 60,
    width: 200,
    height: 70
  };

  // Rectángulo contenedor
  page.drawRectangle({
    x: signatureBox.x,
    y: signatureBox.y,
    width: signatureBox.width,
    height: signatureBox.height,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 1,
  });

  // Línea divisoria central vertical
  page.drawLine({
    start: { x: signatureBox.x + 85, y: signatureBox.y + 4 },
    end: { x: signatureBox.x + 85, y: signatureBox.y + signatureBox.height - 4 },
    color: rgb(0.8, 0.8, 0.8),
    thickness: 1,
  });

  // Texto Izquierdo (Nombre del firmante formateado)
  const nameParts = author.full_name.split(' ');
  const part1 = nameParts[0] || '';
  const part2 = nameParts[1] || '';
  const part3 = nameParts[2] || '';
  const part4 = nameParts[3] || '';

  page.drawText(part1, { x: signatureBox.x + 8, y: signatureBox.y + 52, size: 9, font: fontHelveticaBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(part2, { x: signatureBox.x + 8, y: signatureBox.y + 40, size: 9, font: fontHelveticaBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(part3, { x: signatureBox.x + 8, y: signatureBox.y + 28, size: 9, font: fontHelveticaBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(part4, { x: signatureBox.x + 8, y: signatureBox.y + 16, size: 9, font: fontHelveticaBold, color: rgb(0.1, 0.1, 0.1) });

  // Texto Derecho (Sello formal de firma digital de Adobe)
  page.drawText('Firmado', { x: signatureBox.x + 92, y: signatureBox.y + 54, size: 8, font: fontHelveticaBold, color: rgb(0.4, 0.4, 0.4) });
  page.drawText('digitalmente por', { x: signatureBox.x + 92, y: signatureBox.y + 45, size: 8, font: fontHelvetica, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(author.full_name.substring(0, 20), { x: signatureBox.x + 92, y: signatureBox.y + 36, size: 7.5, font: fontHelveticaBold, color: rgb(0.2, 0.2, 0.2) });
  
  const fmtDate = now.toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/-/g, '.');
  page.drawText(`Fecha: ${fmtDate}`, { x: signatureBox.x + 92, y: signatureBox.y + 24, size: 7.5, font: fontHelvetica, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(`08:26:10 -05'00'`, { x: signatureBox.x + 92, y: signatureBox.y + 14, size: 7.5, font: fontHelvetica, color: rgb(0.4, 0.4, 0.4) });

  // --- 5. APLICAR FIRMA CRIPTOGRÁFICA DETACHED ---
  // Añadimos el placeholder del diccionario de firma en la misma posición que el recuadro visual
  addSignaturePlaceholder(pdfDoc, signatureBox);

  // Generamos el certificado autofirmado en memoria
  const pfxBuffer = generateSelfSignedCert();

  // Guardar PDF como bytes sin comprimir objetos en streams (requerido por node-signpdf para encontrar el marcador)
  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });

  // Firmar criptográficamente usando node-signpdf
  const signedPdf = signer.sign(Buffer.from(pdfBytes), pfxBuffer, {
    passphrase: 'password'
  });

  return signedPdf;
}
