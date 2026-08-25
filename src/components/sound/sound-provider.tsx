"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const CLAVE_LOCALSTORAGE = "arma-tu-partido:sonido";

type SoundContextValue = {
  sonidoActivo: boolean;
  alternarSonido: () => void;
  /** Navegación, copiar, chips, rechazar. */
  reproducirClick: () => void;
  /** Aprobar jugador, decir "Voy", convocar partido, mandar el magic
   * link, unirse — las acciones de confirmación. */
  reproducirSilbato: () => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

type Ambiente = { fuente: AudioBufferSourceNode; gain: GainNode };

export function SoundProvider({ children }: { children: React.ReactNode }) {
  // Arranca apagado siempre — los navegadores bloquean audio sin gesto
  // del usuario, y nadie quiere que la web le silbe sin permiso. Recién
  // después de montar se revisa si había una preferencia guardada.
  const [sonidoActivo, setSonidoActivo] = useState(false);
  const [hidratado, setHidratado] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const ambienteRef = useRef<Ambiente | null>(null);

  // AudioContext perezoso: se crea recién con el primer sonido real, no
  // en el mount — y se reactiva si el navegador lo dejó "suspended".
  const obtenerContexto = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      void ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // ~100ms, triangle 520→240Hz. Navegación, copiar, chips, rechazar.
  const click = useCallback(() => {
    const ctx = obtenerContexto();
    const ahora = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(520, ahora);
    osc.frequency.exponentialRampToValueAtTime(240, ahora + 0.07);
    gain.gain.setValueAtTime(0.09, ahora);
    gain.gain.exponentialRampToValueAtTime(0.0005, ahora + 0.09);

    osc.connect(gain).connect(ctx.destination);
    osc.start(ahora);
    osc.stop(ahora + 0.1);
  }, [obtenerContexto]);

  // ~350ms, sine 2050→2380Hz con un LFO de 26Hz modulando la frecuencia
  // — ese trino es lo que lo hace sonar a silbato de árbitro.
  const silbato = useCallback(() => {
    const ctx = obtenerContexto();
    const ahora = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(2050, ahora);
    osc.frequency.linearRampToValueAtTime(2380, ahora + 0.09);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 26;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 95;
    lfo.connect(lfoGain).connect(osc.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ahora);
    gain.gain.linearRampToValueAtTime(0.07, ahora + 0.02);
    gain.gain.setValueAtTime(0.07, ahora + 0.2);
    gain.gain.linearRampToValueAtTime(0.0005, ahora + 0.33);

    osc.connect(gain).connect(ctx.destination);
    osc.start(ahora);
    lfo.start(ahora);
    osc.stop(ahora + 0.35);
    lfo.stop(ahora + 0.35);
  }, [obtenerContexto]);

  // Ambiente de cancha: 4s de ruido rosado (ruido blanco filtrado con
  // last = last*0.97 + w*0.03, amplificado ×6) en loop, con un lowpass a
  // 620Hz para que no sea tan áspero como el ruido blanco puro.
  const iniciarAmbiente = useCallback(() => {
    if (ambienteRef.current) return;
    const ctx = obtenerContexto();

    const duracionSegundos = 4;
    const buffer = ctx.createBuffer(
      1,
      ctx.sampleRate * duracionSegundos,
      ctx.sampleRate,
    );
    const datos = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < datos.length; i++) {
      const ruidoBlanco = Math.random() * 2 - 1;
      last = last * 0.97 + ruidoBlanco * 0.03;
      datos[i] = last * 6;
    }

    const fuente = ctx.createBufferSource();
    fuente.buffer = buffer;
    fuente.loop = true;

    const filtro = ctx.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.value = 620;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 1.2);

    fuente.connect(filtro).connect(gain).connect(ctx.destination);
    fuente.start();

    ambienteRef.current = { fuente, gain };
  }, [obtenerContexto]);

  const detenerAmbiente = useCallback(() => {
    const ambiente = ambienteRef.current;
    const ctx = ctxRef.current;
    if (!ambiente || !ctx) return;

    const ahora = ctx.currentTime;
    ambiente.gain.gain.linearRampToValueAtTime(0, ahora + 0.5);
    ambiente.fuente.stop(ahora + 0.7);
    ambienteRef.current = null;
  }, []);

  useEffect(() => {
    // Sincroniza con localStorage — un sistema externo que no existe en
    // el servidor —, no ajusta estado a partir de otro estado/props: es
    // exactamente el caso que React documenta como uso válido de un
    // efecto (a diferencia de "derivar" datos que ya se podrían calcular
    // en el render). Por eso el setState acá adentro es intencional.
    const guardado = window.localStorage.getItem(CLAVE_LOCALSTORAGE);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (guardado === "on") setSonidoActivo(true);
    setHidratado(true);
  }, []);

  useEffect(() => {
    // No persistir ni tocar el ambiente hasta que se leyó la preferencia
    // guardada: si no, el primer render (siempre "apagado") pisaría lo
    // que hubiera en localStorage antes de llegar a leerlo.
    if (!hidratado) return;

    window.localStorage.setItem(
      CLAVE_LOCALSTORAGE,
      sonidoActivo ? "on" : "off",
    );

    if (sonidoActivo) {
      iniciarAmbiente();
    } else {
      detenerAmbiente();
    }
  }, [sonidoActivo, hidratado, iniciarAmbiente, detenerAmbiente]);

  const alternarSonido = useCallback(() => {
    setSonidoActivo((actual) => !actual);
  }, []);

  const reproducirClick = useCallback(() => {
    if (sonidoActivo) click();
  }, [sonidoActivo, click]);

  const reproducirSilbato = useCallback(() => {
    if (sonidoActivo) silbato();
  }, [sonidoActivo, silbato]);

  const value = useMemo<SoundContextValue>(
    () => ({
      sonidoActivo,
      alternarSonido,
      reproducirClick,
      reproducirSilbato,
    }),
    [sonidoActivo, alternarSonido, reproducirClick, reproducirSilbato],
  );

  return (
    <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
  );
}

export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    throw new Error("useSound() tiene que usarse dentro de <SoundProvider>.");
  }
  return ctx;
}
