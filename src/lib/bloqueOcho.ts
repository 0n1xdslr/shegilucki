// Algoritmo BloqueOcho - Cifrado Simétrico por Bloques de 8 caracteres
// Adaptado a un alfabeto seguro de URLs (letras minúsculas, guion y tilde de padding)
// Tamaño del alfabeto: 28 caracteres.

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz-~';
const N = ALPHABET.length; // 28
const K = 8; // Clave secreta (configurable)

/**
 * Cifra un bloque de 8 caracteres del alfabeto usando la fórmula:
 * c_i = (p_i + K + i) mod N
 */
function cifrarBloque(bloque: string): string {
  let cifrado = '';
  for (let i = 0; i < 8; i++) {
    const char = bloque[i];
    const pi = ALPHABET.indexOf(char);
    if (pi === -1) {
      // Si el carácter no está en el alfabeto, lo dejamos pasar tal cual
      cifrado += char;
      continue;
    }
    const ci = (((pi + K + i) % N) + N) % N;
    cifrado += ALPHABET[ci];
  }
  return cifrado;
}

/**
 * Descifra un bloque de 8 caracteres del alfabeto usando la fórmula:
 * p_i = (c_i - K - i) mod N
 */
function descifrarBloque(bloque: string): string {
  let descifrado = '';
  for (let i = 0; i < 8; i++) {
    const char = bloque[i];
    const ci = ALPHABET.indexOf(char);
    if (ci === -1) {
      descifrado += char;
      continue;
    }
    const pi = (((ci - K - i) % N) + N) % N;
    descifrado += ALPHABET[pi];
  }
  return descifrado;
}

/**
 * Cifra un texto completo de cualquier longitud aplicando la lógica de bloques de 8 caracteres.
 * Devuelve el resultado como una cadena cifrada limpia de 8, 16, 24... caracteres.
 */
export function cifrarBloqueOcho(texto: string): string {
  // Aseguramos que el texto esté en minúsculas para coincidir con nuestro alfabeto
  const textoMinuscula = texto.toLowerCase();
  let resultado = '';
  
  for (let b = 0; b < textoMinuscula.length; b += 8) {
    let bloque = textoMinuscula.substring(b, b + 8);
    // Relleno (padding) con tilde (~) si es menor a 8
    while (bloque.length < 8) {
      bloque += '~';
    }
    resultado += cifrarBloque(bloque);
  }
  
  return resultado;
}

/**
 * Descifra una cadena a su texto original usando BloqueOcho y limpia las tildes (~) de relleno.
 */
export function descifrarBloqueOcho(cifrado: string): string {
  let resultado = '';
  
  for (let b = 0; b < cifrado.length; b += 8) {
    const bloque = cifrado.substring(b, b + 8);
    resultado += descifrarBloque(bloque);
  }
  
  // Limpiar tildes de relleno al final
  return resultado.replace(/~+$/, '');
}

/**
 * Cifra un path de URL completo (ej: "/dashboard" -> "/c/zwpzlyab")
 */
export function cifrarUrl(path: string): string {
  if (!path || !path.startsWith('/') || path === '/') {
    return path;
  }
  
  // Cifrar el path omitiendo el primer '/'
  const pathWithoutSlash = path.substring(1);
  return `/c/${cifrarBloqueOcho(pathWithoutSlash)}`;
}

/**
 * Descifra una URL cifrada con prefijo "/c/" a su path original (ej: "/c/zwpzlyab" -> "/dashboard")
 */
export function descifrarUrl(cryptedPath: string): string {
  if (!cryptedPath || !cryptedPath.startsWith('/c/')) {
    return cryptedPath;
  }
  
  const cipher = cryptedPath.substring(3);
  try {
    const decrypted = descifrarBloqueOcho(cipher);
    return `/${decrypted}`;
  } catch (e) {
    console.error('Error descifrando URL:', e);
    return '/dashboard'; // fallback seguro
  }
}
