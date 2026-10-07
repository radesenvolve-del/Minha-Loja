/**
 * Utility functions for client-side image compression and photo templates
 */

export async function compressImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado não é uma imagem válida.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler arquivo da imagem.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Erro ao processar dados da imagem.'));
      img.onload = () => {
        // Calculate proportional dimensions
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original data URL if 2D context is unavailable
          resolve(event.target?.result as string);
          return;
        }

        // Draw image on canvas with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG for high compatibility and small payload size
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

export interface SampleProductPhoto {
  id: string;
  category: string;
  title: string;
  url: string;
}

export const SAMPLE_PRODUCT_PHOTOS: SampleProductPhoto[] = [
  // Moda / Vestuário Feminino
  {
    id: 'dress-linen',
    category: 'Vestidos',
    title: 'Vestido Midi Linho Puro',
    url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'dress-silk',
    category: 'Vestidos',
    title: 'Vestido Longo Cetim Champagne',
    url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'blouse-white',
    category: 'Blusas',
    title: 'Blusa Canelada Manga Bufante',
    url: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'blouse-satin',
    category: 'Blusas',
    title: 'Camisa Seda Off-White',
    url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'pants-wide-leg',
    category: 'Calças',
    title: 'Calça Jeans Wide Leg Clara',
    url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'pants-tailored',
    category: 'Calças',
    title: 'Calça Alfaiataria Bege',
    url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'skirt-pleated',
    category: 'Saias',
    title: 'Saia Midi Plissada Nude',
    url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'suit-blazer',
    category: 'Conjuntos',
    title: 'Blazer Alfaiataria / Short',
    url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'handbag-leather',
    category: 'Acessórios',
    title: 'Bolsa Tiracolo Couro Caramelo',
    url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
  },
  // Semijoias / Alta Joalheria
  {
    id: 'ring-gold',
    category: 'Anéis',
    title: 'Anel Ouro Solitário Zircônia',
    url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'ring-silver',
    category: 'Alianças',
    title: 'Par de Alianças Luxo Banhadas',
    url: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'necklace-gold',
    category: 'Colares',
    title: 'Colar Choker Malha Italiana Ouro',
    url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'necklace-emerald',
    category: 'Colares',
    title: 'Colar Gota Fusion Esmeralda',
    url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'earrings-diamond',
    category: 'Brincos',
    title: 'Brincos Ponto de Luz / Argola',
    url: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'bracelet-cuff',
    category: 'Pulseiras',
    title: 'Bracelete Rígido Dourado',
    url: 'https://images.unsplash.com/photo-1611591475837-7757ee928a6f?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'watch-luxury',
    category: 'Relógios',
    title: 'Relógio Cronógrafo Dourado Classic',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'perfume-luxury',
    category: 'Perfumes',
    title: 'Eau de Parfum Essência Floral',
    url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sunglasses-modern',
    category: 'Óculos',
    title: 'Óculos de Sol Proteção UV400',
    url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80',
  },
];
