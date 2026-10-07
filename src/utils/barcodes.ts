import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

export function renderBarcodeToSvg(
  svgElement: SVGSVGElement | null,
  text: string,
  options?: { height?: number; width?: number; displayValue?: boolean }
) {
  if (!svgElement || !text) return;
  try {
    JsBarcode(svgElement, text, {
      format: 'CODE128',
      lineColor: '#18181b',
      width: options?.width || 2,
      height: options?.height || 45,
      displayValue: options?.displayValue !== false,
      fontSize: 12,
      font: 'JetBrains Mono',
      margin: 4,
    });
  } catch (err) {
    console.warn('Barcode render error, falling back:', err);
  }
}

export async function generateQRCode(text: string): Promise<string> {
  if (!text) return '';
  try {
    return await QRCode.toDataURL(text, {
      width: 256,
      margin: 2,
      color: {
        dark: '#18181b',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return '';
  }
}

/**
 * Generate standard PIX BR Code payload (EMVCo format)
 */
export function generatePixPayload({
  key,
  merchantName = 'MINHA LOJA',
  merchantCity = 'SAO PAULO',
  amount,
  txId = 'PDV1',
}: {
  key: string;
  merchantName?: string;
  merchantCity?: string;
  amount?: number;
  txId?: string;
}): string {
  const cleanKey = key.trim();
  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const payloadFormat = formatField('00', '01');
  const merchantAccountInfo = formatField(
    '26',
    `${formatField('00', 'br.gov.bcb.pix')}${formatField('01', cleanKey)}`
  );
  const merchantCategoryCode = formatField('52', '0000');
  const transactionCurrency = formatField('53', '986'); // BRL
  const transactionAmount = amount && amount > 0 ? formatField('54', amount.toFixed(2)) : '';
  const countryCode = formatField('58', 'BR');
  const name = formatField('59', merchantName.slice(0, 25).toUpperCase());
  const city = formatField('60', merchantCity.slice(0, 15).toUpperCase());
  const additionalDataField = formatField('62', formatField('05', txId.slice(0, 25)));

  const rawPayload = `${payloadFormat}${merchantAccountInfo}${merchantCategoryCode}${transactionCurrency}${transactionAmount}${countryCode}${name}${city}${additionalDataField}6304`;

  // CRC16 CCITT
  let crc = 0xffff;
  for (let i = 0; i < rawPayload.length; i++) {
    crc ^= rawPayload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  const crcHex = (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
  return `${rawPayload}${crcHex}`;
}
