// Cuenta del jugador: login con Google (Supabase), nombre de jugador y estadísticas.
// El nombre de jugador es público y lo elige cada uno; el mail de Google nunca se muestra ni se guarda en el perfil.
const SB_URL = 'https://iaglglmtemuohfhcingu.supabase.co';
const SB_KEY = 'sb_publishable_xfHdoqpl4fo92C4I8vk-Wg_mU1nSwxA'; // clave pública, pensada para ir en el navegador

let sb = null;
try {
  if (window.supabase) sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, detectSessionInUrl: true, flowType: 'pkce' } });
} catch (e) { console.warn(e); }

export const cuenta = { disponible: !!sb, usuario: null, perfil: null, cargando: !!sb };
let alCambiar = () => {};

export function iniciarCuenta(fn) {
  alCambiar = fn;
  if (!sb) { fn(); return; }
  sb.auth.onAuthStateChange((_evento, sesion) => { setTimeout(() => cargar(sesion), 0); });
}

async function cargar(sesion) {
  const usuario = sesion?.user || null;
  if (usuario && cuenta.usuario?.id === usuario.id && cuenta.perfil) return; // mismo usuario, ya cargado
  cuenta.usuario = usuario;
  cuenta.perfil = null;
  if (usuario) {
    const { data } = await sb.from('perfiles').select('*').eq('id', usuario.id).maybeSingle();
    cuenta.perfil = data || null;
  }
  cuenta.cargando = false;
  alCambiar();
}

export async function entrarConGoogle() {
  if (!sb) return;
  const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } });
  if (error) throw new Error('No se pudo abrir el inicio de sesión de Google.');
}

export async function salir() {
  if (!sb) return;
  await sb.auth.signOut();
  cuenta.usuario = null;
  cuenta.perfil = null;
  alCambiar();
}

export async function elegirNombre(nombre) {
  const { data, error } = await sb.rpc('elegir_nombre', { p_nombre: nombre });
  if (error) throw new Error(error.message || 'No se pudo guardar el nombre.');
  cuenta.perfil = data;
  alCambiar();
  return data;
}

// Suma al perfil lo hecho desde el último reporte. Si falla (sin conexión), no rompe la partida.
export async function registrarProgreso(d) {
  if (!sb || !cuenta.perfil) return false;
  try {
    const { data, error } = await sb.rpc('registrar_progreso', {
      p_hundidos: d.hundidos, p_capturados: d.capturados, p_eliminados: d.eliminados || 0, p_oro: d.oro,
      p_segundos: d.segundos, p_saqueo_partida: d.saqueoPartida, p_fin: !!d.fin,
    });
    if (error) throw error;
    if (data) cuenta.perfil = data;
    return true;
  } catch (e) { console.warn('No se pudo guardar el progreso', e); return false; }
}

export async function ranking() {
  if (!sb) return [];
  const { data } = await sb.from('perfiles').select('nombre, mejor_saqueo, barcos_hundidos').order('mejor_saqueo', { ascending: false }).limit(10);
  return data || [];
}
