// ============================================================
// INBOX DATA — Messages from rivals, institutions and world characters
// All messages have consequences when accepted or rejected
// ============================================================

export type SenderType = 'rival' | 'hacienda' | 'banco' | 'periodista' | 'hacker' | 'gobierno' | 'cliente'

export interface MessageConsequence {
  label: string
  // Immediate effects on accept
  balChange?: number          // fixed amount
  balPct?: number             // % of current bal (positive = gain, negative = loss)
  stockShock?: { sector: string; mult: number; duration: number } // price shock
  xp?: number
  lv?: number                 // force level change
  hackProtectChange?: number
  bmRiskChange?: number
  loanRateChange?: number     // multiplier on current loan rate
  addNews?: string
  // Special effects
  special?: 'inspector_visit' | 'market_crash' | 'bull_run' | 'loan_forgiven' | 'double_rent' | 'stock_tip' | 'rival_broke'
}

export interface InboxMessage {
  id: string
  senderId: string
  senderName: string
  senderEmoji: string
  senderType: SenderType
  senderColor: string
  subject: string
  body: string
  minWealth?: number   // only appears above this wealth
  maxWealth?: number   // only appears below this wealth
  minLv?: number
  probability: number  // 0-1, chance per check interval
  cooldownMs: number   // min time between same message
  accept: MessageConsequence
  reject: MessageConsequence
  expireMs?: number    // how long before it disappears unanswered
}

export const INBOX_MESSAGES: InboxMessage[] = [

  // ── RIVALS ──────────────────────────────────────────────────
  {
    id: 'rival_loan_req',
    senderId: 'r3',
    senderName: 'Ibrahim Al-Saud',
    senderEmoji: '👳',
    senderType: 'rival',
    senderColor: '#e2b96f',
    subject: 'Propuesta de liquidez temporal',
    body: 'Estimado trader. Mi fondo soberano necesita liquidez urgente por 48h. Te propongo un préstamo de 50.000€ con devolución de 60.000€ en 3 minutos. Mi palabra como honor.',
    probability: 0.008,
    cooldownMs: 300000,
    minWealth: 50000,
    expireMs: 120000,
    accept: {
      label: 'Prestarle 50.000€',
      balChange: -50000,
      addNews: '🤝 Acuerdo de préstamo entre traders. Ibrahim Al-Saud recibe liquidez urgente.',
      special: 'rival_broke', // may or may not return
    },
    reject: {
      label: 'Rechazar',
      addNews: '❌ Propuesta de préstamo rechazada. Las relaciones comerciales se enfrían.',
    },
  },
  {
    id: 'rival_tip',
    senderId: 'r2',
    senderName: 'Carlos Ruiz',
    senderEmoji: '👨‍💻',
    senderType: 'rival',
    senderColor: '#818cf8',
    subject: 'Re: Algo que te puede interesar',
    body: 'Mi algoritmo detectó una anomalía en el sector TECH. Algo grande se mueve. Si me das 20.000€ te paso la señal exacta. En 5 minutos lo entenderás todo.',
    probability: 0.006,
    cooldownMs: 240000,
    minWealth: 30000,
    expireMs: 90000,
    accept: {
      label: 'Pagar 20.000€ por el tip',
      balChange: -20000,
      special: 'stock_tip',
      addNews: '💻 Información privilegiada cambia de manos. Sector TECH en movimiento.',
    },
    reject: {
      label: 'Ignorar',
    },
  },
  {
    id: 'rival_alliance',
    senderId: 'r6',
    senderName: 'Sofia Marchetti',
    senderEmoji: '👩‍🎨',
    senderType: 'rival',
    senderColor: '#fb923c',
    subject: 'Propuesta de alianza',
    body: 'Hola. He analizado tu portfolio y creo que podemos ayudarnos mutuamente. Si aceptas no atacarnos durante 5 minutos, yo también me comprometo. Y te regalo 15.000€ como señal de buena fe.',
    probability: 0.005,
    cooldownMs: 360000,
    expireMs: 150000,
    accept: {
      label: 'Aceptar alianza',
      balChange: 15000,
      xp: 100,
      addNews: '🤝 Alianza estratégica entre dos grandes traders. El mercado lo observa.',
    },
    reject: {
      label: 'Rechazar',
      addNews: '⚔️ Propuesta de alianza rechazada. La rivalidad se intensifica.',
    },
  },
  {
    id: 'rival_bet',
    senderId: 'r4',
    senderName: 'Yuki Tanaka',
    senderEmoji: '👩‍🔬',
    senderType: 'rival',
    senderColor: '#c084fc',
    subject: '速い！Una apuesta',
    body: 'Hola! Propongo apuesta simple: en 2 minutos, quien más gane en TECH gana 30.000€ del otro. Sé que tienes miedo 😏 Yo ya aposté con mi honor.',
    probability: 0.007,
    cooldownMs: 300000,
    minWealth: 30000,
    expireMs: 60000,
    accept: {
      label: 'Aceptar apuesta (30k€)',
      balChange: -30000,
      stockShock: { sector: 'TECH', mult: 1.04, duration: 120000 },
      special: 'rival_broke',
      addNews: '⚡ Apuesta épica entre traders. El sector TECH como campo de batalla.',
    },
    reject: {
      label: 'Declinar',
      addNews: '😏 Yuki Tanaka gana por incomparecencia. "Sabía que tenía miedo."',
    },
  },
  {
    id: 'rival_pump',
    senderId: 'r8',
    senderName: 'Priya Kapoor',
    senderEmoji: '👩‍💻',
    senderType: 'rival',
    senderColor: '#34d399',
    subject: 'WAGMI — necesito tu ayuda',
    body: 'bro necesito que compres CRYPTO ahora mismo con todo lo que tengas. entre los dos podemos hacer un pump. te lo devuelvo x2. WAGMI 🚀🚀🚀',
    probability: 0.006,
    cooldownMs: 200000,
    expireMs: 90000,
    accept: {
      label: 'Comprar CRYPTO (pump juntos)',
      stockShock: { sector: 'CRYPTO', mult: 1.08, duration: 90000 },
      xp: 50,
      addNews: '🚀 Movimiento coordinado en CRYPTO detectado. Posible pump en marcha.',
    },
    reject: {
      label: 'NGMI, paso',
      addNews: '📉 Priya Kapoor intenta el pump solo. Sin éxito.',
    },
  },

  // ── HACIENDA ─────────────────────────────────────────────────
  {
    id: 'hacienda_inspection',
    senderId: 'hacienda',
    senderName: 'Agencia Tributaria',
    senderEmoji: '🏛️',
    senderType: 'hacienda',
    senderColor: '#f87171',
    subject: 'Notificación de inspección fiscal — URGENTE',
    body: 'Estimado contribuyente. Hemos detectado irregularidades en sus declaraciones de los últimos períodos. Puede regularizar su situación voluntariamente pagando 25.000€ antes del vencimiento, o esperar la inspección completa que podría resultar en sanciones mayores.',
    probability: 0.004,
    cooldownMs: 600000,
    minWealth: 50000,
    expireMs: 180000,
    accept: {
      label: 'Pagar 25.000€ y regularizar',
      balChange: -25000,
      xp: 50,
      addNews: '🏛️ Trader regulariza situación fiscal voluntariamente. Hacienda somos todos.',
    },
    reject: {
      label: 'Ignorar y arriesgarse',
      balPct: -0.35,
      addNews: '🚨 INSPECCIÓN FISCAL: Multa aplicada por fraude fiscal detectado.',
    },
  },
  {
    id: 'hacienda_amnesty',
    senderId: 'hacienda',
    senderName: 'Ministerio de Hacienda',
    senderEmoji: '🏛️',
    senderType: 'hacienda',
    senderColor: '#f87171',
    subject: 'Amnistía fiscal — Oferta limitada',
    body: 'El Gobierno anuncia amnistía fiscal temporal. Puede declarar activos no declarados pagando solo el 10% de multa. Esta oferta expira en 2 minutos. Activos no declarados estimados: variable.',
    probability: 0.003,
    cooldownMs: 900000,
    minWealth: 100000,
    expireMs: 120000,
    accept: {
      label: 'Acogerse a la amnistía',
      balPct: -0.10,
      xp: 200,
      addNews: '🕊️ Amnistía fiscal: miles de contribuyentes regularizan su situación.',
    },
    reject: {
      label: 'No declarar nada',
    },
  },

  // ── BANCO ────────────────────────────────────────────────────
  {
    id: 'bank_vip',
    senderId: 'banco',
    senderName: 'Banco Premium',
    senderEmoji: '🏦',
    senderType: 'banco',
    senderColor: '#818cf8',
    subject: 'Invitación exclusiva: Banca Privada VIP',
    body: 'Estimado cliente. Dado su volumen de activos, le invitamos a nuestra división de banca privada. Ventajas: tipos de préstamo -40%, acceso anticipado a IPOs, y gestor personal dedicado. Cuota de entrada: 100.000€.',
    probability: 0.004,
    cooldownMs: 600000,
    minWealth: 500000,
    expireMs: 240000,
    accept: {
      label: 'Unirse al VIP (100k€)',
      balChange: -100000,
      loanRateChange: 0.6,
      xp: 500,
      addNews: '💎 Trader accede a banca privada VIP. El dinero atrae al dinero.',
    },
    reject: {
      label: 'No, gracias',
    },
  },
  {
    id: 'bank_margin_call',
    senderId: 'banco',
    senderName: 'Departamento de Riesgos',
    senderEmoji: '🏦',
    senderType: 'banco',
    senderColor: '#f87171',
    subject: 'URGENTE: Margin Call pendiente',
    body: 'Sus posiciones apalancadas han superado el umbral de riesgo. Debe depositar 30.000€ de garantía adicional en los próximos 90 segundos o sus posiciones serán liquidadas automáticamente.',
    probability: 0.003,
    cooldownMs: 480000,
    minWealth: 30000,
    expireMs: 90000,
    accept: {
      label: 'Depositar garantía (30k€)',
      balChange: -30000,
      addNews: '📋 Margin call resuelto. El trader mantiene sus posiciones apalancadas.',
    },
    reject: {
      label: 'No tengo fondos',
      balPct: -0.20,
      stockShock: { sector: 'ALL', mult: 0.95, duration: 60000 },
      addNews: '💥 Liquidación forzada de posiciones. El mercado absorbe el impacto.',
    },
  },

  // ── PERIODISTA ───────────────────────────────────────────────
  {
    id: 'journalist_interview',
    senderId: 'periodista',
    senderName: 'Elena Vega — Bloomberg',
    senderEmoji: '📰',
    senderType: 'periodista',
    senderColor: '#60a5fa',
    subject: 'Solicitud de entrevista — Bloomberg',
    body: 'Hola. Soy Elena Vega de Bloomberg España. Hemos seguido su trayectoria y me gustaría hacerle una entrevista sobre su estrategia de inversión. La exposición mediática podría atraer capital a sus proyectos. ¿Disponible?',
    probability: 0.004,
    cooldownMs: 480000,
    minWealth: 100000,
    expireMs: 180000,
    accept: {
      label: 'Dar la entrevista',
      xp: 300,
      stockShock: { sector: 'ALL', mult: 1.03, duration: 120000 },
      addNews: '📺 Entrevista en Bloomberg: trader revela su estrategia. Mercados atentos.',
    },
    reject: {
      label: 'Sin comentarios',
      addNews: '🤫 El trader más misterioso del mercado rechaza toda exposición pública.',
    },
  },
  {
    id: 'journalist_expose',
    senderId: 'periodista2',
    senderName: 'Rodrigo Méndez — El País',
    senderEmoji: '📰',
    senderType: 'periodista',
    senderColor: '#60a5fa',
    subject: 'Le doy 24h para responder',
    body: 'Tenemos información sobre sus actividades en ciertos "mercados alternativos". Podemos publicar la historia completa mañana, o usted puede comprar nuestro silencio por 40.000€. Usted decide.',
    probability: 0.003,
    cooldownMs: 600000,
    minWealth: 80000,
    expireMs: 120000,
    accept: {
      label: 'Pagar 40.000€ por el silencio',
      balChange: -40000,
      addNews: '🤫 Acuerdo de confidencialidad firmado. Ciertos asuntos quedan en privado.',
    },
    reject: {
      label: 'Publicad lo que queráis',
      balPct: -0.12,
      addNews: '📰 Escándalo financiero publicado. El trader pierde reputación y capital.',
    },
  },

  // ── HACKER ───────────────────────────────────────────────────
  {
    id: 'hacker_offer',
    senderId: 'hacker_anon',
    senderName: 'Anonymous_9',
    senderEmoji: '💻',
    senderType: 'hacker',
    senderColor: '#34d399',
    subject: 'Propuesta de negocio',
    body: 'Hola. Puedo hackear a cualquiera de tus rivales y transferirte el 20% de su balance. Cobro 15.000€ por el servicio. Si alguien pregunta, no me conoces.',
    probability: 0.005,
    cooldownMs: 360000,
    minWealth: 20000,
    expireMs: 120000,
    accept: {
      label: 'Contratar (15k€)',
      balChange: -15000,
      special: 'rival_broke',
      addNews: '💻 Ataque cibernético detectado en las cuentas de varios traders.',
    },
    reject: {
      label: 'No me interesa',
    },
  },
  {
    id: 'hacker_ransom',
    senderId: 'hacker_bad',
    senderName: 'DarkNet_X',
    senderEmoji: '☠️',
    senderType: 'hacker',
    senderColor: '#f87171',
    subject: 'Tu portfolio en mis manos',
    body: 'Tengo acceso a tu cuenta. He visto todo. Paga 20.000€ en las próximas 2 minutos o empiezo a ejecutar ventas masivas de todo lo que tienes. No es una broma.',
    probability: 0.003,
    cooldownMs: 480000,
    minWealth: 50000,
    expireMs: 120000,
    accept: {
      label: 'Pagar el rescate (20k€)',
      balChange: -20000,
      addNews: '💰 Ataque de ransomware resuelto. El trader paga para proteger su cartera.',
    },
    reject: {
      label: 'Es un farol, ignorar',
      // 50/50 - was it real or not?
      special: 'rival_broke', // reuse logic for random outcome
      addNews: '⚠️ Trader desafía ataque de ransomware. El resultado es incierto.',
    },
  },

  // ── GOBIERNO ─────────────────────────────────────────────────
  {
    id: 'gov_subsidy',
    senderId: 'gobierno',
    senderName: 'Ministerio de Economía',
    senderEmoji: '🏛️',
    senderType: 'gobierno',
    senderColor: '#fbbf24',
    subject: 'Subvención para PYMEs — Solicitud pendiente',
    body: 'Su empresa ha sido preseleccionada para recibir una subvención de 80.000€ del plan de digitalización. Solo necesita firmar un compromiso de mantener 10 empleados durante 1 año. ¿Acepta las condiciones?',
    probability: 0.004,
    cooldownMs: 600000,
    minLv: 5,
    expireMs: 240000,
    accept: {
      label: 'Aceptar subvención',
      balChange: 80000,
      xp: 200,
      addNews: '🏛️ Empresa local recibe subvención de digitalización. Éxito del plan gubernamental.',
    },
    reject: {
      label: 'Rechazar condiciones',
      addNews: '❌ Subvención rechazada por incompatibilidad con la estructura empresarial.',
    },
  },
  {
    id: 'gov_regulation',
    senderId: 'gobierno',
    senderName: 'CNMV — Comisión Nacional',
    senderEmoji: '⚖️',
    senderType: 'gobierno',
    senderColor: '#f87171',
    subject: 'Investigación por posible manipulación de mercado',
    body: 'La CNMV ha iniciado una investigación sobre ciertas operaciones en su cuenta. Puede cooperar voluntariamente (multa reducida de 50.000€) o ejercer su derecho a no declarar (investigación completa).',
    probability: 0.003,
    cooldownMs: 720000,
    minWealth: 200000,
    expireMs: 180000,
    accept: {
      label: 'Cooperar y pagar 50k€',
      balChange: -50000,
      xp: 100,
      addNews: '⚖️ Trader coopera con investigación de la CNMV. Caso cerrado.',
    },
    reject: {
      label: 'Ejercer derecho a no declarar',
      balPct: -0.25,
      addNews: '🚨 CNMV sanciona a trader por manipulación de mercado. Multa histórica.',
    },
  },

  // ── CLIENTE ──────────────────────────────────────────────────
  {
    id: 'client_investment',
    senderId: 'client1',
    senderName: 'Familia Rodríguez',
    senderEmoji: '👨‍👩‍👧',
    senderType: 'cliente',
    senderColor: '#34d399',
    subject: 'Queremos que gestione nuestros ahorros',
    body: 'Buenos días. Somos una familia con 200.000€ ahorrados durante 20 años. Hemos seguido su trayectoria y nos gustaría que los gestionara. Si en 3 minutos genera +10%, nos quedamos con usted.',
    probability: 0.004,
    cooldownMs: 480000,
    minWealth: 100000,
    expireMs: 180000,
    accept: {
      label: 'Aceptar gestión de fondos',
      balChange: 200000,
      addNews: '💼 Nuevo cliente institucional. El trader amplía su gestión de patrimonio familiar.',
      special: 'rival_broke', // random: either keep it or have to return more
    },
    reject: {
      label: 'No acepto clientes externos',
      addNews: '🚫 Trader rechaza gestión de fondos externos. Mantiene independencia total.',
    },
  },
  {
    id: 'client_tip_reward',
    senderId: 'client2',
    senderName: 'Viktor Petrov',
    senderEmoji: '🎩',
    senderType: 'cliente',
    senderColor: '#e2b96f',
    subject: 'Recompensa por consejo',
    body: 'Me diste un consejo hace tiempo que me hizo ganar mucho dinero. No sé si lo recuerdas. Quiero pagarte 50.000€ como agradecimiento. Solo dime a qué cuenta lo transfiero.',
    probability: 0.003,
    cooldownMs: 600000,
    expireMs: 120000,
    accept: {
      label: 'Aceptar el regalo',
      balChange: 50000,
      xp: 150,
      addNews: '🎁 Recompensa inesperada: 50.000€ por un consejo del pasado. El karma existe.',
    },
    reject: {
      label: 'No puedo aceptar eso',
      xp: 200,
      addNews: '🙏 Trader rechaza recompensa inesperada. La integridad tiene precio.',
    },
  },
]
