const forge = require('node-forge');
const { PDFDocument, PDFName, PDFNumber, PDFString, PDFArray, PDFDict, PDFHexString } = require('pdf-lib');
const signer = require('node-signpdf').default || require('node-signpdf');

console.log('Iniciando prueba de firma...');

function generateSelfSignedCert() {
  console.log('Generando certificado con node-forge...');
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [
    { name: 'commonName', value: 'LUCKY MOTORS SAC - TEST' },
    { name: 'countryName', value: 'PE' }
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  const asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], 'password', {
    generateLocalKeyId: true,
    friendlyName: 'Test'
  });
  const pfxDer = forge.asn1.toDer(asn1).getBytes();
  return Buffer.from(pfxDer, 'binary');
}

async function test() {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);

    console.log('Agregando placeholder...');
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
      Contents: PDFHexString.of('0'.repeat(9500 * 2)),
    });

    const widgetDict = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Widget',
      FT: 'Sig',
      Rect: [50, 50, 200, 100],
      V: signatureDict,
      T: PDFString.of('FirmaDigital'),
      F: 4,
      P: page.ref,
    });

    const widgetRef = pdfDoc.context.register(widgetDict);
    let annots = page.node.get(PDFName.of('Annots'));
    if (!annots) {
      annots = pdfDoc.context.obj([]);
      page.node.set(PDFName.of('Annots'), annots);
    }
    annots.push(widgetRef);

    let acroForm = pdfDoc.catalog.get(PDFName.of('AcroForm'));
    if (!acroForm) {
      acroForm = pdfDoc.context.obj({ Fields: [] });
      pdfDoc.catalog.set(PDFName.of('AcroForm'), acroForm);
    }
    acroForm.set(PDFName.of('SigFlags'), PDFNumber.of(3));
    let fields = acroForm.get(PDFName.of('Fields'));
    if (!fields) {
      fields = pdfDoc.context.obj([]);
      acroForm.set(PDFName.of('Fields'), fields);
    }
    fields.push(widgetRef);

    const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
    const pdfString = Buffer.from(pdfBytes).toString('latin1');
    const index = pdfString.indexOf('ByteRange');
    if (index !== -1) {
      console.log('ENCONTRADO ByteRange en PDF:', pdfString.substring(index - 100, index + 200));
    } else {
      console.log('NO SE ENCONTRO LA PALABRA ByteRange en el PDF');
    }
    console.log('PDF guardado. Tamaño:', pdfBytes.length);

    const pfxBuffer = generateSelfSignedCert();
    console.log('Certificado PFX generado. Tamaño:', pfxBuffer.length);

    console.log('Firmando PDF con node-signpdf...');
    const signedPdf = signer.sign(Buffer.from(pdfBytes), pfxBuffer, {
      passphrase: 'password'
    });
    console.log('Firma exitosa! PDF firmado tamaño:', signedPdf.length);
  } catch (err) {
    console.error('ERROR EN FIRMA:', err);
  }
}

test();
