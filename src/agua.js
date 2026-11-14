// El agua del mar, vista desde arriba: un lienzo WebGL que va DEBAJO del lienzo del juego (#mar) y se pinta en una sola pasada.
// Oleaje lento en tres capas que siguen al viento, color que se oscurece mar adentro y se aclara sobre los bajíos,
// destellos de la luz del escenario (el "camino" de la luna o del sol), cáusticas en el agua baja y espuma suelta.
// Es solo dibujo y es local: no toca la simulación ni lo que viaja por la red. Si el equipo no tiene WebGL, crearAgua
// devuelve null y dibujo.js pinta el mar liso de siempre con la paleta nueva.

const ISLAS = 16, RAFAGAS = 6;

const VERTICES = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }';

const PIXELES = `
precision highp float;
uniform vec2 uRes, uCam, uPuerto, uViento, uLuz;
uniform float uZoom, uT, uBrillo, uOleaje, uEspuma, uLluvia, uReal;
uniform vec3 cHondo, cMedio, cBajo, cCielo, cLuz;
uniform vec4 uIslas[${ISLAS}];
uniform vec4 uRafagas[${RAFAGAS}];

float azar(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float ruido(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(azar(i), azar(i + vec2(1.0, 0.0)), f.x), mix(azar(i + vec2(0.0, 1.0)), azar(i + vec2(1.0, 1.0)), f.x), f.y);
}
vec2 girar(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }

// Altura del agua (0 a 1). q viene en ejes del viento: x a favor, y de través. Las crestas quedan atravesadas al viento.
float olas(vec2 q, float t) {
  float h = 0.55 * ruido(vec2(q.x * 0.0105 - t * 0.085, q.y * 0.0064 + 3.1));
  h += 0.30 * ruido(girar(q, 0.55) * vec2(0.026, 0.0125) - vec2(t * 0.13, t * 0.02));
  h += 0.15 * ruido(girar(q, -0.8) * vec2(0.062, 0.034) + vec2(-t * 0.19, t * 0.05));
  return h;
}

void main() {
  vec2 pant = (gl_FragCoord.xy - 0.5 * uRes) * vec2(1.0, -1.0); // en píxeles, con la y hacia abajo como el juego
  vec2 w = uCam + pant / uZoom;
  float t = uT;

  // ejes del viento y una deformación suave, para que el oleaje no sea un dibujo que se repite
  vec2 q = vec2(dot(w, uViento), dot(w, vec2(-uViento.y, uViento.x)));
  q += 26.0 * vec2(ruido(w * 0.0042 + t * 0.012), ruido(w * 0.0042 + 9.7 - t * 0.010));

  float h = olas(q, t);
  const float E = 3.0;
  vec2 pend = vec2(olas(q + vec2(E, 0.0), t) - h, olas(q + vec2(0.0, E), t) - h) / E * 30.0 * uOleaje;
  // la pendiente está en ejes del viento: de vuelta a los de la pantalla
  pend = pend.x * uViento + pend.y * vec2(-uViento.y, uViento.x);

  // ráfagas: adentro el agua se riza y se aclara
  float raf = 0.0;
  for (int i = 0; i < ${RAFAGAS}; i++) {
    vec4 g = uRafagas[i];
    if (g.z > 0.0) raf = max(raf, 1.0 - smoothstep(g.z * 0.62, g.z, length(w - g.xy)));
  }

  // profundidad: oscura mar adentro, más clara cerca del puerto, turquesa sobre los bajíos de cada tierra
  float lejos = clamp(length(w - uPuerto) / 3400.0 + (ruido(w * 0.0013 + 4.0) - 0.5) * 0.30, 0.0, 1.0);
  vec3 col = mix(cMedio, cHondo, smoothstep(0.04, 0.80, lejos));
  float bajo = 0.0;
  for (int i = 0; i < ${ISLAS}; i++) {
    vec4 s = uIslas[i];
    if (s.z > 0.0) bajo = max(bajo, (1.0 - smoothstep(-s.z * 0.15, 90.0 + s.z * 0.30, length(w - s.xy) - s.z)) * s.w);
  }
  bajo *= 0.80 + 0.20 * ruido(w * 0.012 + 2.0);
  col = mix(col, cBajo, bajo * 0.70);

  // el relieve: valles más oscuros, crestas más claras, y el cielo reflejado en las pendientes
  // uReal: 1 = el agua con todo el detalle; 0 = agua dibujada, más lisa (color por profundidad y un oleaje apenas marcado)
  float det = 0.22 + 0.78 * uReal;
  col *= mix(1.0, 0.76 + 0.48 * h, 0.35 + 0.65 * uReal);
  float inclin = clamp(length(pend) * 1.5, 0.0, 1.0);
  col = mix(col, cCielo, (inclin * 0.24 + raf * 0.07) * det);
  col += cLuz * max(0.0, dot(-pend, uLuz)) * 0.20 * uBrillo * det; // la cara de la ola que mira a la luz

  // cáusticas: una red fina de luz en el agua baja
  float red = 1.0 - abs(ruido(w * 0.045 + vec2(t * 0.06, -t * 0.04)) - ruido(w * 0.058 + 5.0 + vec2(-t * 0.05, t * 0.045))) * 2.6;
  col += cLuz * pow(clamp(red, 0.0, 1.0), 7.0) * bajo * 0.20 * (0.35 + 0.65 * uBrillo) * det;

  // destellos: el camino de brillo hacia la luz, angosto de través y largo hacia ella, que titila con las olas
  float aLoLargo = dot(pant, uLuz) / uRes.y, deTraves = dot(pant, vec2(-uLuz.y, uLuz.x)) / uRes.y;
  vec2 mira = -(uLuz * (aLoLargo - 0.22) * 0.55 + vec2(-uLuz.y, uLuz.x) * deTraves * 1.9);
  vec3 n = normalize(vec3(-pend * 0.85, 1.0));
  float lobulo = pow(max(0.0, dot(n, normalize(vec3(mira, 1.0)))), 80.0);
  float chispa = ruido(w * 0.42 + vec2(t * 0.50, -t * 0.36)) * ruido(w * 0.77 - vec2(t * 0.31, t * 0.44));
  col += cLuz * uBrillo * lobulo * (0.07 + 1.5 * smoothstep(0.40, 0.62, chispa)) * (0.12 + 0.88 * uReal);

  // espuma suelta: vetas finas y curvas, algo estiradas a favor del viento, a manchones; más seguidas dentro de una ráfaga
  vec2 qe = q + 14.0 * vec2(ruido(q * 0.021 + 1.7), ruido(q * 0.021 + 8.2));
  float veta = 1.0 - abs(ruido(vec2(qe.x * 0.016 - t * 0.050, qe.y * 0.048)) * 2.0 - 1.0);
  veta *= 0.55 + 0.45 * ruido(vec2(qe.x * 0.09 - t * 0.09, qe.y * 0.17));
  float zona = smoothstep(0.52, 0.80, ruido(w * 0.0046 + vec2(t * 0.014, 0.0)) + raf * 0.30);
  float espuma = smoothstep(0.80, 0.93, veta) * zona * (0.35 + 0.65 * uEspuma);
  espuma += smoothstep(0.80, 0.97, h + (uOleaje - 1.0) * 0.06) * 0.45 * uEspuma; // crestas que rompen (se nota con temporal)
  vec3 colEspuma = mix(cCielo, vec3(1.0), 0.55) * (0.55 + 0.45 * max(max(cLuz.r, cLuz.g), cLuz.b));
  col = mix(col, colEspuma, clamp(espuma, 0.0, 1.0) * 0.34 * (0.25 + 0.75 * uReal));

  // la lluvia sobre el agua: muchísimas gotas chicas que pican la superficie (un punto claro al caer y un anillo corto que
  // se abre y se apaga), en dos tamaños. Viene en cortinas: manchones donde llueve más fuerte, que el viento va corriendo,
  // y ahí el agua se ve más gris, como con bruma.
  if (uLluvia > 0.01) {
    float cortina = 0.45 + 1.0 * ruido(w * 0.0022 + vec2(t * 0.12, t * 0.07));
    float suma = 0.0;
    for (int k = 0; k < 2; k++) {
      float fk = float(k), lado = 8.0 + fk * 7.0;
      vec2 g = w / lado + fk * 13.7, c = floor(g);
      float vuelta = t * (2.7 - fk * 0.8) + azar(c) * 9.0, fase = fract(vuelta), cual = floor(vuelta);
      vec2 centro = 0.2 + 0.6 * vec2(azar(c + cual + 3.1), azar(c + cual + 7.7));
      float d = length(fract(g) - centro);
      float gota = smoothstep(0.17, 0.0, d) * (1.0 - smoothstep(0.0, 0.22, fase));
      float anillo = smoothstep(0.07, 0.0, abs(d - fase * 0.32)) * (1.0 - fase) * (1.0 - fase);
      suma += (gota * 0.9 + anillo * 0.5) * step(0.30, azar(c + cual * 1.7));
    }
    col += mix(cCielo, vec3(1.0), 0.5) * suma * 0.70 * uLluvia * cortina;
    col = mix(col, cCielo * 0.85 + 0.06, 0.12 * uLluvia * cortina);
  }

  col += (azar(gl_FragCoord.xy) - 0.5) / 255.0; // evita las bandas en los escenarios oscuros
  gl_FragColor = vec4(col, 1.0);
}`;

export function crearAgua(lienzo) {
  let gl = null;
  try { gl = lienzo.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' }); } catch {}
  if (!gl) return null;
  const compilar = (tipo, codigo) => {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, codigo);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compilar(gl.VERTEX_SHADER, VERTICES));
    gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, PIXELES));
    gl.bindAttribLocation(prog, 0, 'p');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { console.warn('Agua: no se pudo armar el dibujo, queda el mar liso.', e.message); return null; }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u = {};
  for (const n of ['uRes', 'uCam', 'uPuerto', 'uViento', 'uLuz', 'uZoom', 'uT', 'uBrillo', 'uOleaje', 'uEspuma', 'uLluvia', 'uReal', 'cHondo', 'cMedio', 'cBajo', 'cCielo', 'cLuz', 'uIslas', 'uRafagas']) u[n] = gl.getUniformLocation(prog, n);
  const islas = new Float32Array(ISLAS * 4), rafagas = new Float32Array(RAFAGAS * 4);
  const agua = { ok: true, lienzo };
  lienzo.addEventListener('webglcontextlost', (e) => { e.preventDefault(); agua.ok = false; });

  // ancho y alto: tamaño del lienzo del juego en sus píxeles; escala: cuánto más chico se pinta el agua (rinde más y no se nota)
  agua.ajustar = (ancho, alto, escala) => {
    agua.escala = escala;
    lienzo.width = Math.max(2, Math.round(ancho * escala));
    lienzo.height = Math.max(2, Math.round(alto * escala));
    gl.viewport(0, 0, lienzo.width, lienzo.height);
  };

  // d: { camX, camY, zoom (del lienzo del juego), t, puerto, viento (ángulo o null), escena, islas, rafagas }
  agua.dibujar = (d) => {
    if (!agua.ok) return false;
    const e = d.escena, W = lienzo.width, H = lienzo.height, zoom = d.zoom * agua.escala;
    const mx = W / zoom / 2 + 260, my = H / zoom / 2 + 260;
    islas.fill(0);
    let n = 0;
    for (const s of d.islas) {
      if (n >= ISLAS) break;
      if (Math.abs(s.x - d.camX) > mx + s.r * 1.5 || Math.abs(s.y - d.camY) > my + s.r * 1.5) continue;
      islas[n * 4] = s.x; islas[n * 4 + 1] = s.y; islas[n * 4 + 2] = s.r; islas[n * 4 + 3] = s.tipo === 'iceberg' ? 0.45 : 1;
      n++;
    }
    rafagas.fill(0);
    n = 0;
    for (const g of d.rafagas || []) {
      if (n >= RAFAGAS) break;
      if (Math.abs(g.x - d.camX) > mx + g.r || Math.abs(g.y - d.camY) > my + g.r) continue;
      rafagas[n * 4] = g.x; rafagas[n * 4 + 1] = g.y; rafagas[n * 4 + 2] = g.r;
      n++;
    }
    const va = d.viento == null ? -0.6 : d.viento;
    gl.uniform2f(u.uRes, W, H);
    gl.uniform2f(u.uCam, d.camX, d.camY);
    gl.uniform2f(u.uPuerto, d.puerto.x, d.puerto.y);
    gl.uniform2f(u.uViento, Math.cos(va), Math.sin(va));
    gl.uniform2f(u.uLuz, Math.cos(e.rumbo), Math.sin(e.rumbo));
    gl.uniform1f(u.uZoom, zoom);
    gl.uniform1f(u.uT, d.t);
    gl.uniform1f(u.uBrillo, e.brillo);
    gl.uniform1f(u.uOleaje, e.oleaje);
    gl.uniform1f(u.uEspuma, e.espuma);
    gl.uniform1f(u.uLluvia, d.lluvia || 0);
    gl.uniform1f(u.uReal, d.real ? 1 : 0);
    gl.uniform3fv(u.cHondo, e.hondo);
    gl.uniform3fv(u.cMedio, e.medio);
    gl.uniform3fv(u.cBajo, e.bajo);
    gl.uniform3fv(u.cCielo, e.cielo);
    gl.uniform3fv(u.cLuz, e.luz);
    gl.uniform4fv(u.uIslas, islas);
    gl.uniform4fv(u.uRafagas, rafagas);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return true;
  };
  return agua;
}
