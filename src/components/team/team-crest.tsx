/**
 * Tamaños de escudo en uso en la app, con la proporción base 40×47
 * mantenida a mano en cada uno (no es un cálculo continuo: son los
 * tamaños que pide el handoff de diseño para cada contexto).
 */
const TAMANOS = {
  // ancho/alto/relleno/letra van como clases completas (no interpoladas):
  // Tailwind solo genera las utilidades cuyo texto literal encuentra en el código.
  30: {
    ancho: "w-[30px]",
    alto: "h-[35px]",
    relleno: "pt-[6px]",
    letra: "text-[12px]",
  }, // barra superior
  38: {
    ancho: "w-[38px]",
    alto: "h-[44px]",
    relleno: "pt-[7px]",
    letra: "text-[15px]",
  }, // landing
  40: {
    ancho: "w-[40px]",
    alto: "h-[47px]",
    relleno: "pt-[8px]",
    letra: "text-[16px]",
  }, // tarjeta de equipo
  48: {
    ancho: "w-[48px]",
    alto: "h-[57px]",
    relleno: "pt-[10px]",
    letra: "text-[19px]",
  }, // vista pública
  56: {
    ancho: "w-[56px]",
    alto: "h-[66px]",
    relleno: "pt-[11px]",
    letra: "text-[22px]",
  }, // cabecera de equipo, login
} as const;

export type TeamCrestSize = keyof typeof TAMANOS;

/** Tres variantes de degradado para distinguir equipos en una lista. */
const VARIANTES = ["lima", "ambar", "cielo"] as const;

function siglasDe(nombreEquipo: string) {
  const palabras = nombreEquipo.trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return "";
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}

/**
 * El degradado se elige a partir del id del equipo (no al azar) para que
 * quede estable entre renders y entre servidor y cliente.
 */
function varianteDe(teamId: string) {
  let hash = 0;
  for (let i = 0; i < teamId.length; i++) {
    hash = (hash * 31 + teamId.charCodeAt(i)) >>> 0;
  }
  return VARIANTES[hash % VARIANTES.length];
}

/** Núcleo compartido entre TeamCrest y BrandCrest: solo cambia de dónde
 * sale el texto y la variante de degradado. */
function Escudo({
  siglas,
  variante,
  size,
}: {
  siglas: string;
  variante: (typeof VARIANTES)[number];
  size: TeamCrestSize;
}) {
  const { ancho, alto, relleno, letra } = TAMANOS[size];

  return (
    <span
      aria-hidden="true"
      className={`escudo escudo-${variante} ${ancho} ${alto} ${relleno}`}
    >
      <span className={`font-mono font-semibold text-tinta-oscura ${letra}`}>
        {siglas}
      </span>
    </span>
  );
}

/**
 * El escudo de un equipo: pentágono con sus iniciales. Puramente
 * decorativo — el nombre del equipo va siempre como texto visible al
 * lado, así que se oculta a lectores de pantalla.
 */
export function TeamCrest({
  name,
  teamId,
  size = 40,
}: {
  name: string;
  teamId: string;
  size?: TeamCrestSize;
}) {
  return (
    <Escudo siglas={siglasDe(name)} variante={varianteDe(teamId)} size={size} />
  );
}

/**
 * El escudo de la marca ("AP", siempre lima): el mismo elemento gráfico,
 * pero para cuando lo que se identifica es la app y no un equipo puntual
 * (landing, login, barra de sesión del dashboard).
 */
export function BrandCrest({ size = 40 }: { size?: TeamCrestSize }) {
  return <Escudo siglas="AP" variante="lima" size={size} />;
}
