// Si el profesor borra o desactiva la cuenta, la sincronización lo detecta para cerrar la sesión.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { borrar, clavesApp } from '../src/almacenamiento/almacen';
import { guardarCuenta, type FilaPerfil } from '../src/almacenamiento/datos';

const nube = vi.hoisted(() => ({
  sesion: { data: { session: { user: { id: 'u1' } } as unknown }, error: null as unknown },
  rpc: { data: null as unknown, error: null as unknown },
}));

vi.mock('../src/servicios/supabase', async (original) => ({
  ...(await original<typeof import('../src/servicios/supabase')>()),
  obtenerSupabase: async () => ({
    auth: { getSession: async () => nube.sesion },
    rpc: async () => nube.rpc,
  }),
}));

const { estadoDeCuenta, sincronizarAhora } = await import('../src/servicios/sincronizacion');

const fila: FilaPerfil = {
  id: 'u1', usuario: 'ana', nombre: 'Ana', rol: 'usuario', tipo: 'estudiante', grado: 1, activo: true, avatar: 'gallina',
  bandas: {}, finales_permitidos: {}, generacion: 0, profesor_id: null, creado: '2026-10-01T00:00:00Z', ultima_sync: null,
};

describe('cuenta borrada o desactivada', () => {
  beforeEach(() => {
    for (const k of clavesApp()) borrar(k);
    guardarCuenta(fila);
    nube.sesion = { data: { session: { user: { id: 'u1' } } }, error: null };
    nube.rpc = { data: { estado: 'ok', perfil: fila }, error: null };
  });

  it('cuenta borrada: la base ya no encuentra el perfil', async () => {
    nube.rpc = { data: null, error: { code: '42501', message: 'Cuenta no encontrada' } };
    expect(await sincronizarAhora()).toBe('eliminado');
  });

  it('cuenta borrada: la sesión ya no se puede renovar porque el usuario no existe', async () => {
    nube.sesion = { data: { session: null }, error: { code: 'user_not_found', message: 'User not found' } };
    expect(await sincronizarAhora()).toBe('eliminado');
  });

  it('cuenta desactivada', async () => {
    nube.rpc = { data: { estado: 'inactivo' }, error: null };
    expect(await sincronizarAhora()).toBe('inactivo');
    nube.sesion = { data: { session: null }, error: { code: 'user_banned', message: 'User is banned' } };
    expect(await sincronizarAhora()).toBe('inactivo');
  });

  it('otros errores no cierran la sesión', async () => {
    expect(estadoDeCuenta({ code: '42501', message: 'permission denied for function x' })).toBeNull();
    expect(estadoDeCuenta({ code: 'refresh_token_not_found', message: 'Invalid Refresh Token' })).toBeNull();
    nube.rpc = { data: null, error: { code: 'PGRST301', message: 'JWT expired' } };
    expect(await sincronizarAhora()).toBe('sin-sesion');
    nube.rpc = { data: { estado: 'ok', perfil: fila }, error: null };
    expect(await sincronizarAhora()).toBe('ok');
  });
});
